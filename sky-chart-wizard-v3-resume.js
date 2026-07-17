// Restores Sky A and Sky B after the v3 calculator has committed both records.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const LIBRARY_KEY = 'relphiSkyLibraryV1';
  const SLOT_KEYS = { chart:'relphiTarotChart', currentSky:'relphiCurrentSky' };
  const RESUME_KEY = 'relphiWizardV3Resume';
  let resume = null;

  try {
    resume = JSON.parse(sessionStorage.getItem(RESUME_KEY) || 'null');
    if (resume?.skyA && resume?.skyB) sessionStorage.removeItem(RESUME_KEY);
  } catch (_) { resume = null; }

  function byId(id) { return document.getElementById(id); }
  function fire(node, type) { if (node) node.dispatchEvent(new Event(type, { bubbles:true })); }
  function normalize(value) { return String(value || '').trim().toLowerCase(); }
  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) { return fallback; }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  }
  function placements(value) {
    const source = value && (value.placements || value);
    if (!source || typeof source !== 'object' || Array.isArray(source)) return {};
    return Object.fromEntries(Object.entries(source).filter(function (entry) {
      const item = entry[1];
      return item && typeof item === 'object' && !Array.isArray(item) && (String(item.sign || '').trim() || Number.isFinite(Number(item.degree)));
    }));
  }
  function hasPlacements(value) { return !!Object.keys(placements(value)).length; }
  function outputHasPlacements(node) {
    return /(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Rising|ASC|MC|Midheaven)[\s\S]{0,180}\d{1,2}°/i.test(node?.textContent || '');
  }
  function records() {
    const value = readJson(LIBRARY_KEY, []);
    return Array.isArray(value) ? value : [];
  }
  function recordByName(name) {
    return records().find(function (record) { return normalize(record?.name) === normalize(name) && Object.keys(placements(record)).length; }) || null;
  }
  function payload(record) {
    return record ? { name:record.name, notes:record.notes || '', placements:placements(record), calcProfile:record.calcProfile || {} } : null;
  }
  function setTarget(kind) {
    ['skyCreatorTarget','skyCalcTarget'].forEach(function (id) {
      const field = byId(id);
      if (!field) return;
      field.value = kind;
      fire(field, 'input');
      fire(field, 'change');
    });
  }
  function waitUntil(test, timeout) {
    const started = Date.now();
    return new Promise(function (resolve, reject) {
      (function check() {
        try {
          const value = test();
          if (value) return resolve(value);
        } catch (_) {}
        if (Date.now() - started > timeout) return reject(new Error('Timed out'));
        setTimeout(check, 120);
      })();
    });
  }
  function loadRecord(record, kind) {
    const select = byId('skyCreatorLibrary');
    const chart = byId('chartOutput');
    const current = byId('currentSkyOutput');
    const output = kind === 'currentSky' ? current : chart;
    if (!select || !output) return Promise.reject(new Error('Native controls unavailable'));

    if (kind === 'currentSky') {
      const mode = byId('currentSkyMode');
      if (mode) { mode.hidden = false; mode.click(); }
    } else byId('chartMode')?.click();

    setTarget(kind);
    const creatorName = byId('skyCreatorName');
    const calcName = byId('skyCalcName');
    if (creatorName) creatorName.value = record.name;
    if (calcName) calcName.value = record.name;
    const beforeOutput = output.innerHTML;
    const beforeChart = chart?.innerHTML || '';
    select.value = record.id;
    fire(select, 'input');
    fire(select, 'change');
    byId('skyCreatorLoad')?.click();

    return waitUntil(function () {
      const slot = readJson(SLOT_KEYS[kind], null);
      const changed = outputHasPlacements(output) || output.innerHTML !== beforeOutput || (kind === 'currentSky' && (chart?.innerHTML || '') !== beforeChart);
      return hasPlacements(slot) && normalize(slot.name) === normalize(record.name) && changed;
    }, 10000).then(function () {
      if (kind === 'currentSky') byId('chartMode')?.click();
      return true;
    });
  }
  function finish(aRecord, bRecord) {
    const a = payload(aRecord);
    const b = payload(bRecord);
    writeJson(SLOT_KEYS.chart, a);
    writeJson(SLOT_KEYS.currentSky, b);
    const current = byId('currentSkyOutput');
    if (current && current.innerHTML.trim()) {
      current.hidden = false;
      current.removeAttribute('hidden');
      current.dataset.skyName = b.name;
    }
    const chart = byId('chartOutput');
    if (chart) chart.dataset.skyName = a.name;
    document.body.dataset.relphiSkyBReady = 'true';
    window.RelphiSkyWizardV3?.renderComplete?.();
    window.dispatchEvent(new CustomEvent('relphi:sky-b-ready', { detail:{ skyA:a.name, skyB:b.name } }));
    window.dispatchEvent(new Event('resize'));
  }
  function restore() {
    if (!resume?.skyA || !resume?.skyB) return;
    const aRecord = recordByName(resume.skyA);
    const bRecord = recordByName(resume.skyB);
    if (!aRecord || !bRecord) return;
    const a = payload(aRecord);
    const b = payload(bRecord);
    writeJson(SLOT_KEYS.chart, a);
    writeJson(SLOT_KEYS.currentSky, b);

    const chart = byId('chartOutput');
    const current = byId('currentSkyOutput');
    if (outputHasPlacements(chart) && outputHasPlacements(current)) {
      finish(aRecord, bRecord);
      return;
    }

    loadRecord(aRecord, 'chart').then(function () {
      return loadRecord(bRecord, 'currentSky');
    }).then(function () {
      finish(aRecord, bRecord);
    }).catch(function () {
      writeJson(SLOT_KEYS.chart, a);
      writeJson(SLOT_KEYS.currentSky, b);
      byId('chartMode')?.click();
      finish(aRecord, bRecord);
    });
  }

  if (resume?.skyA && resume?.skyB) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(restore, 1400); }, { once:true });
    else setTimeout(restore, 1400);
  }
})();
