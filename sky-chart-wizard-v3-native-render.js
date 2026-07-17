// Coordinates the Wizard with the Sky Chart engine's real chart/currentSky slots.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SLOT_KEYS = { chart:'relphiTarotChart', currentSky:'relphiCurrentSky' };
  let buildingSkyB = false;
  let awaitingSkyB = false;
  let skyARecord = null;

  function byId(id) { return document.getElementById(id); }
  function fire(node, type) { if (node) node.dispatchEvent(new Event(type, { bubbles:true })); }
  function readJson(key) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
    catch (_) { return null; }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  }
  function placementEntries(payload) {
    const source = payload && (payload.placements || payload);
    if (!source || typeof source !== 'object' || Array.isArray(source)) return {};
    return Object.fromEntries(Object.entries(source).filter(function (entry) {
      const item = entry[1];
      if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
      return String(item.sign || '').trim() ||
        (item.degree !== '' && item.degree != null && Number.isFinite(Number(item.degree)));
    }));
  }
  function hasRecord(payload) { return Object.keys(placementEntries(payload)).length > 0; }
  function outputHasPlacements(node) {
    return /(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Rising|ASC|MC|Midheaven)[\s\S]{0,180}\d{1,2}°/i.test(node?.textContent || '');
  }
  function setTarget(kind, notify) {
    const target = kind === 'currentSky' ? 'currentSky' : 'chart';
    ['skyCreatorTarget', 'skyCalcTarget'].forEach(function (id) {
      const field = byId(id);
      if (!field) return;
      field.value = target;
      if (notify) {
        fire(field, 'input');
        fire(field, 'change');
      }
    });
    const paste = byId('skyCreatorPaste');
    if (paste) paste.dataset.skyKind = target;
  }
  function wizardSaysSkyB() {
    const eyebrow = String(byId('relphiV3NameEyebrow')?.textContent || byId('relphiSkyNameEyebrow')?.textContent || '').toLowerCase();
    const placeholder = String(byId('relphiV3NameInput')?.placeholder || byId('relphiSkyNameInput')?.placeholder || '').toLowerCase();
    return buildingSkyB || document.body.dataset.relphiPendingSkyKind === 'currentSky' ||
      eyebrow.includes('comparison') || placeholder.includes('comparison');
  }
  function status(message) {
    const complete = byId('relphiV3Complete') || byId('relphiSkyCompleteStage');
    if (!complete) return;
    let note = byId('relphiV3NativeRenderStatus');
    if (!note) {
      note = document.createElement('p');
      note.id = 'relphiV3NativeRenderStatus';
      note.className = 'generated-note';
      note.setAttribute('aria-live', 'polite');
      complete.appendChild(note);
    }
    note.textContent = message;
  }
  function preserveSkyA() {
    if (hasRecord(skyARecord)) return;
    const stored = readJson(SLOT_KEYS.chart);
    if (hasRecord(stored)) skyARecord = stored;
  }
  function preserveBoth() {
    if (hasRecord(skyARecord)) writeJson(SLOT_KEYS.chart, skyARecord);
    const b = readJson(SLOT_KEYS.currentSky);
    if (hasRecord(b)) writeJson(SLOT_KEYS.currentSky, b);
  }
  function enableComparisonMode() {
    const active = Array.from(document.querySelectorAll('[data-sky-chart-mode]')).some(function (button) {
      return button.getAttribute('aria-pressed') === 'true' && button.dataset.skyChartMode !== 'single';
    });
    if (!active) {
      const button = document.querySelector('[data-sky-chart-mode="compare"]') ||
        document.querySelector('[data-sky-chart-mode="synastry"]') ||
        document.querySelector('[data-sky-chart-mode="transit"]');
      button?.click();
    }
    const output = byId('currentSkyOutput');
    if (output) {
      output.hidden = false;
      output.removeAttribute('hidden');
    }
    window.dispatchEvent(new Event('resize'));
  }
  function completeSkyBWhenReady() {
    if (!awaitingSkyB) return;
    const a = readJson(SLOT_KEYS.chart);
    const b = readJson(SLOT_KEYS.currentSky);
    const current = byId('currentSkyOutput');
    if (!hasRecord(b) || !outputHasPlacements(current)) return;
    if (hasRecord(skyARecord) && (!hasRecord(a) || String(a.name || '') !== String(skyARecord.name || ''))) {
      writeJson(SLOT_KEYS.chart, skyARecord);
    }
    preserveBoth();
    enableComparisonMode();
    awaitingSkyB = false;
    buildingSkyB = false;
    delete document.body.dataset.relphiPendingSkyKind;
    document.body.dataset.relphiSkyBReady = 'true';
    status('Sky A and Sky B are held in the native chart and comparison slots.');
    window.RelphiSkyWizardV3?.renderComplete?.();
    window.dispatchEvent(new CustomEvent('relphi:sky-b-ready', {
      detail:{ skyA:(skyARecord || a)?.name || 'Sky A', skyB:b.name || 'Sky B' }
    }));
  }
  function beginSkyB() {
    preserveSkyA();
    buildingSkyB = true;
    document.body.dataset.relphiPendingSkyKind = 'currentSky';
    setTarget('chart', false);
  }
  function prepareSkyBCalculation() {
    if (!wizardSaysSkyB()) return;
    preserveSkyA();
    buildingSkyB = true;
    awaitingSkyB = true;
    document.body.dataset.relphiPendingSkyKind = 'currentSky';
    setTarget('currentSky', true);
    status('Calculating Sky B in the native comparison slot…');
  }
  function guard(event) {
    const node = event.target;
    if (node?.closest?.('#relphiV3AddComparison, #relphiAddComparison')) return beginSkyB();
    if (node?.closest?.('#relphiV3Continue, #relphiSkyNameContinue') && wizardSaysSkyB()) return beginSkyB();
    if (node?.closest?.('#relphiV3HereNow, #relphiV3Manual, #relphiHereNow, #relphiChooseWhenWhere')) {
      if (wizardSaysSkyB()) beginSkyB();
      return;
    }
    if (node?.closest?.('#skyCalcRun, #skyCalcAttach, .sky-paste-create-button, #skyCreatorForm button, [data-create-sky], [data-confirm-sky]')) {
      if (wizardSaysSkyB()) prepareSkyBCalculation();
      else setTarget('chart', true);
    }
  }
  function restoreExistingPair() {
    const a = readJson(SLOT_KEYS.chart);
    const b = readJson(SLOT_KEYS.currentSky);
    if (!hasRecord(a) || !hasRecord(b)) return;
    skyARecord = a;
    enableComparisonMode();
    if (outputHasPlacements(byId('chartOutput')) && outputHasPlacements(byId('currentSkyOutput'))) {
      document.body.dataset.relphiSkyBReady = 'true';
      status('Sky A and Sky B are held in the native chart and comparison slots.');
      window.RelphiSkyWizardV3?.renderComplete?.();
    }
  }
  function install() {
    document.addEventListener('click', guard, true);
    ['chartOutput', 'currentSkyOutput', 'skyCalcStatus'].forEach(function (id) {
      const node = byId(id);
      if (!node) return;
      new MutationObserver(completeSkyBWhenReady).observe(node, { childList:true, subtree:true, characterData:true });
    });
    [250, 800, 1800].forEach(function (delay) { setTimeout(restoreExistingPair, delay); });
  }
  window.RelphiV3NativeRender = { repair:restoreExistingPair, beginSkyB:beginSkyB, prepareSkyB:prepareSkyBCalculation };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
