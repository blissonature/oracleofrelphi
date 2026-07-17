// Rebuilds both native renderer slots from the two verified workspace records.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SLOT_KEYS = { chart:'relphiTarotChart', currentSky:'relphiCurrentSky' };
  const RESUME_KEY = 'relphiWizardV3Resume';
  let repairing = false;
  let repairedSignature = '';

  function byId(id) { return document.getElementById(id); }
  function fire(node, type) { if (node) node.dispatchEvent(new Event(type, { bubbles:true })); }
  function readJson(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  }
  function placements(payload) {
    const source = payload && (payload.placements || payload);
    if (!source || typeof source !== 'object' || Array.isArray(source)) return {};
    return Object.fromEntries(Object.entries(source).filter(function (entry) {
      const item = entry[1];
      if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
      const degree = item.degree;
      return String(item.sign || '').trim() || (degree !== '' && degree != null && Number.isFinite(Number(degree)));
    }));
  }
  function hasPlacements(payload) { return !!Object.keys(placements(payload)).length; }
  function outputHasPlacements(node) {
    return /(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Rising|ASC|MC|Midheaven)[\s\S]{0,180}\d{1,2}°/i.test(node?.textContent || '');
  }
  function signature(payload) {
    return Object.entries(placements(payload)).sort(function (a, b) { return a[0].localeCompare(b[0]); }).map(function (entry) {
      const item = entry[1] || {};
      return [entry[0], item.sign || '', item.degree ?? '', item.minute ?? '', item.house ?? '', item.retrograde ? 'R' : ''].join(':');
    }).join('|');
  }
  function setValue(id, value) {
    const field = byId(id);
    if (!field) return;
    field.value = value == null ? '' : String(value);
    fire(field, 'input');
    fire(field, 'change');
  }
  function setTarget(kind) {
    setValue('skyCreatorTarget', kind);
    setValue('skyCalcTarget', kind);
  }
  function placementText(payload) {
    return Object.entries(placements(payload)).map(function (entry) {
      const name = entry[0];
      const item = entry[1] || {};
      const degreeNumber = Number(item.degree);
      const minuteNumber = Number(item.minute);
      const degree = Number.isFinite(degreeNumber) ? String(degreeNumber) : '0';
      const minute = Number.isFinite(minuteNumber) ? String(minuteNumber).padStart(2, '0') : '00';
      const house = item.house !== '' && item.house != null && Number.isFinite(Number(item.house)) ? ', in ' + Number(item.house) + ' House' : '';
      const retrograde = item.retrograde ? ', Retrograde' : '';
      return name + ',' + String(item.sign || '') + ',' + degree + '°' + minute + "'" + house + retrograde;
    }).join('\n');
  }
  function findCommitButton() {
    const direct = document.querySelector('.sky-paste-create-button, [data-create-sky], [data-confirm-sky]');
    if (direct) return direct;
    const paste = byId('skyCreatorPaste');
    const scope = paste?.closest('.sky-paste-panel')?.parentElement || byId('skyCreatorDrawer') || document;
    return Array.from(scope.querySelectorAll('button')).find(function (button) {
      const text = String(button.textContent || '').trim();
      return /(?:create|build|apply|use)\s+(?:sky\s+from\s+)?(?:entered\s+)?placements|create\s+sky/i.test(text) &&
        !/save|export|delete|clear|calculate/i.test(text);
    }) || null;
  }
  function waitUntil(test, timeout) {
    const started = Date.now();
    return new Promise(function (resolve, reject) {
      (function check() {
        try {
          const result = test();
          if (result) return resolve(result);
        } catch (_) {}
        if (Date.now() - started > timeout) return reject(new Error('Timed out'));
        setTimeout(check, 100);
      })();
    });
  }
  function preserveSlots(a, b) {
    writeJson(SLOT_KEYS.chart, a);
    writeJson(SLOT_KEYS.currentSky, b);
  }
  function commitSlot(kind, payload, a, b) {
    const output = kind === 'currentSky' ? byId('currentSkyOutput') : byId('chartOutput');
    const text = placementText(payload);
    const commit = findCommitButton();
    if (!output || !text || !commit) return Promise.reject(new Error('Native placement commit is unavailable'));

    const before = output.innerHTML;
    setTarget(kind);
    setValue('skyCreatorName', payload.name || (kind === 'currentSky' ? 'Sky B' : 'Sky A'));
    setValue('skyCalcName', payload.name || (kind === 'currentSky' ? 'Sky B' : 'Sky A'));
    setValue('skyCreatorNotes', payload.notes || '');
    setValue('skyCreatorPaste', text);
    preserveSlots(a, b);

    if (kind === 'currentSky') {
      output.hidden = false;
      output.removeAttribute('hidden');
      output.innerHTML = '';
    }

    commit.click();
    return waitUntil(function () {
      preserveSlots(a, b);
      return outputHasPlacements(output) && output.innerHTML !== before;
    }, 10000).then(function () {
      preserveSlots(a, b);
      output.dataset.skyName = payload.name || (kind === 'currentSky' ? 'Sky B' : 'Sky A');
      return output.innerHTML;
    });
  }
  function activateComparison() {
    const button = document.querySelector('[data-sky-chart-mode="compare"], [data-sky-chart-mode="synastry"], [data-sky-chart-mode="transit"]');
    if (button) button.click();
    const current = byId('currentSkyOutput');
    if (current) {
      current.hidden = false;
      current.removeAttribute('hidden');
    }
    window.dispatchEvent(new Event('resize'));
  }
  function status(message) {
    let note = byId('relphiV3NativeRenderStatus');
    const complete = byId('relphiV3Complete');
    if (!complete) return;
    if (!note) {
      note = document.createElement('p');
      note.id = 'relphiV3NativeRenderStatus';
      note.className = 'generated-note';
      note.setAttribute('aria-live', 'polite');
      complete.appendChild(note);
    }
    note.textContent = message || '';
  }
  function needsRepair(a, b) {
    if (!hasPlacements(a) || !hasPlacements(b)) return false;
    const chart = byId('chartOutput');
    const current = byId('currentSkyOutput');
    if (!outputHasPlacements(chart) || !outputHasPlacements(current)) return true;
    const chartName = String(chart?.dataset.skyName || '').trim().toLowerCase();
    const currentName = String(current?.dataset.skyName || '').trim().toLowerCase();
    return chartName !== String(a.name || '').trim().toLowerCase() || currentName !== String(b.name || '').trim().toLowerCase();
  }
  function repair() {
    if (repairing) return;
    const a = readJson(SLOT_KEYS.chart);
    const b = readJson(SLOT_KEYS.currentSky);
    if (!needsRepair(a, b)) return;
    const pairSignature = signature(a) + '||' + signature(b);
    if (!pairSignature.replace(/\|/g, '') || pairSignature === repairedSignature) return;

    const commit = findCommitButton();
    if (!commit) return;
    repairing = true;
    status('Restoring Sky A and Sky B to the comparison wheel…');
    let bHtml = '';

    // The native renderer must receive Sky B through its own target first.
    // Sky A is committed last so the primary wheel cannot inherit Sky B's identity.
    commitSlot('currentSky', b, a, b).then(function (html) {
      bHtml = html;
      return commitSlot('chart', a, a, b);
    }).then(function () {
      const current = byId('currentSkyOutput');
      if (current && !outputHasPlacements(current) && bHtml) current.innerHTML = bHtml;
      preserveSlots(a, b);
      activateComparison();
      return waitUntil(function () {
        return outputHasPlacements(byId('chartOutput')) && outputHasPlacements(byId('currentSkyOutput'));
      }, 5000);
    }).then(function () {
      repairedSignature = pairSignature;
      document.body.dataset.relphiSkyBReady = 'true';
      status('Sky A and Sky B are shown together on the wheel.');
      window.RelphiSkyWizardV3?.renderComplete?.();
      window.dispatchEvent(new CustomEvent('relphi:sky-b-ready', { detail:{ skyA:a.name, skyB:b.name } }));
    }).catch(function (error) {
      preserveSlots(a, b);
      status('Both sky records remain preserved, but the comparison renderer did not finish: ' + error.message + '.');
    }).finally(function () {
      repairing = false;
    });
  }
  function install() {
    // Do not let the older sequential saved-library restore run. It can display
    // only whichever sky it loads last.
    try { sessionStorage.removeItem(RESUME_KEY); } catch (_) {}

    const started = Date.now();
    (function waitForNativeControls() {
      if (findCommitButton() && byId('chartOutput') && byId('currentSkyOutput')) {
        repair();
        [500, 1200, 2500, 5000].forEach(function (delay) { setTimeout(repair, delay); });
        return;
      }
      if (Date.now() - started < 8000) setTimeout(waitForNativeControls, 100);
    })();

    window.addEventListener('relphi:sky-b-ready', function () { setTimeout(repair, 50); });
    window.addEventListener('storage', function (event) {
      if (event.key === SLOT_KEYS.chart || event.key === SLOT_KEYS.currentSky) setTimeout(repair, 50);
    });
  }

  window.RelphiV3NativeRender = { repair:repair };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
