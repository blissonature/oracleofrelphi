// User-specific Sky Builder defaults stored in this browser; no person is hard-coded.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (new URLSearchParams(location.search).get('preview') !== 'pr55') return;

  const LIBRARY_KEY = 'relphiSkyLibraryV1';
  const SKY_A_KEY = 'relphiSkyChartA';
  const SKY_B_KEY = 'relphiSkyChartB';
  const STATE_KEY = 'relphiSkyBuilderV4State';
  const PREFS_KEY = 'relphiSkyBuilderV4Preferences';
  const DEFAULT_SKY_B = 'Now';
  let targetSyncing = false;
  let calculationWatch = 0;
  let pendingEdit = null;

  function normalize(value) { return String(value || '').trim().toLowerCase(); }
  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) { return fallback; }
  }
  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (_) {}
  }
  function readState() {
    try { return JSON.parse(sessionStorage.getItem(STATE_KEY) || '{}'); }
    catch (_) { return {}; }
  }
  function placementEntries(payload) {
    const source = payload && (payload.placements || payload);
    if (!source || typeof source !== 'object' || Array.isArray(source)) return {};
    return Object.fromEntries(Object.entries(source).filter(function (entry) {
      const item = entry[1];
      return item && typeof item === 'object' && !Array.isArray(item) &&
        (String(item.sign || '').trim() ||
          (item.degree !== '' && item.degree != null && Number.isFinite(Number(item.degree))));
    }));
  }
  function signature(payload) {
    return Object.entries(placementEntries(payload))
      .sort(function (a, b) { return a[0].localeCompare(b[0]); })
      .map(function (entry) {
        const item = entry[1] || {};
        return [entry[0], item.sign || '', item.degree ?? '', item.minute ?? '', item.house ?? '', item.retrograde ? 'R' : ''].join(':');
      })
      .join('|');
  }
  function records() {
    const list = readJson(LIBRARY_KEY, []);
    return Array.isArray(list) ? list.filter(function (record) {
      return record && String(record.name || '').trim() && signature(record);
    }) : [];
  }
  function matchingSavedName(payload) {
    const sig = signature(payload);
    if (!sig) return '';
    const record = records().find(function (candidate) {
      return signature(candidate) === sig;
    });
    return String(record?.name || '').trim();
  }
  function preferences() {
    const stored = readJson(PREFS_KEY, {});
    return {
      defaultSkyA:String(stored.defaultSkyA || '').trim(),
      defaultSkyB:String(stored.defaultSkyB || DEFAULT_SKY_B).trim() || DEFAULT_SKY_B
    };
  }
  function savePreference(name, value) {
    const prefs = preferences();
    prefs[name] = String(value || '').trim();
    writeJson(PREFS_KEY, prefs);
  }
  function inferInitialSkyA() {
    const prefs = preferences();
    if (prefs.defaultSkyA) return prefs.defaultSkyA;
    const inferred = matchingSavedName(readJson(SKY_A_KEY, null));
    if (inferred) savePreference('defaultSkyA', inferred);
    return inferred;
  }
  function currentStep() { return String(readState().step || ''); }
  function activeSlot() {
    const state = readState();
    if (state.editingSlot === 'skyB' || /B$/.test(String(state.step || ''))) return 'skyB';
    return 'skyA';
  }
  function slotKey(slot) { return slot === 'skyB' ? SKY_B_KEY : SKY_A_KEY; }
  function nativeTarget(slot) { return slot === 'skyB' ? 'currentSky' : 'chart'; }
  function setNativeField(id, value) {
    const field = document.getElementById(id);
    if (!field || field.value === value) return;
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles:true }));
    field.dispatchEvent(new Event('change', { bubbles:true }));
  }
  function syncNativeTargets(slot) {
    if (targetSyncing) return;
    targetSyncing = true;
    const target = nativeTarget(slot || activeSlot());
    setNativeField('skyCreatorTarget', target);
    setNativeField('skyCalcTarget', target);
    const paste = document.getElementById('skyCreatorPaste');
    if (paste) paste.dataset.skyKind = target;
    requestAnimationFrame(function () {
      const creator = document.getElementById('skyCreatorTarget');
      const calculator = document.getElementById('skyCalcTarget');
      if (creator) creator.value = target;
      if (calculator) calculator.value = target;
      targetSyncing = false;
    });
  }
  function applyDefault() {
    const input = document.getElementById('relphiV4Name');
    if (input && !input.value.trim()) {
      const step = currentStep();
      if (step === 'nameA') input.value = preferences().defaultSkyA || inferInitialSkyA();
      if (step === 'nameB') input.value = preferences().defaultSkyB || DEFAULT_SKY_B;
    }
    const calculator = document.querySelector('.sky-calc-drawer');
    if (calculator && !calculator.hidden && calculator.open) syncNativeTargets(activeSlot());
  }
  function rememberFromInput() {
    const input = document.getElementById('relphiV4Name');
    if (!input) return;
    const value = input.value.trim();
    const step = currentStep();
    if (step === 'nameA' && records().some(function (record) { return normalize(record.name) === normalize(value); })) {
      savePreference('defaultSkyA', value);
    }
    if (step === 'nameB' && value) savePreference('defaultSkyB', value);
  }
  function currentPayload(slot) { return readJson(slotKey(slot), null); }
  function beginCalculationWatch(slot) {
    clearTimeout(calculationWatch);
    const payload = currentPayload(slot);
    pendingEdit = {
      slot:slot,
      originalName:String(payload?.name || document.getElementById('skyCalcName')?.value || '').trim(),
      beforeSignature:signature(payload),
      started:Date.now()
    };
    const check = function () {
      if (!pendingEdit || pendingEdit.slot !== slot) return;
      syncNativeTargets(slot);
      const next = currentPayload(slot);
      const nextSignature = signature(next);
      const status = document.getElementById('skyCalcStatus')?.textContent.trim() || '';
      if (nextSignature && (nextSignature !== pendingEdit.beforeSignature || /^Calculated\b/i.test(status))) {
        preserveEditedRecord(next, pendingEdit.originalName);
        pendingEdit = null;
        return;
      }
      if (Date.now() - pendingEdit.started > 65000 || /^(Could not|Enter |Choose |No location|Location search failed)/i.test(status)) {
        pendingEdit = null;
        return;
      }
      calculationWatch = setTimeout(check, 120);
    };
    calculationWatch = setTimeout(check, 80);
  }
  function preserveEditedRecord(payload, originalName) {
    if (!payload || !signature(payload)) return;
    const name = String(originalName || payload.name || '').trim();
    if (!name) return;
    const list = readJson(LIBRARY_KEY, []);
    if (!Array.isArray(list)) return;
    const index = list.findIndex(function (record) { return normalize(record?.name) === normalize(name); });
    if (index < 0) return;
    const updated = {
      ...list[index],
      ...payload,
      name:name,
      placements:placementEntries(payload),
      calcProfile:payload.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : list[index].calcProfile || {},
      savedAt:new Date().toISOString(),
      savedAtLocal:new Date().toLocaleString()
    };
    list[index] = updated;
    writeJson(LIBRARY_KEY, list);
    writeJson(slotKey(pendingEdit?.slot || activeSlot()), updated);
  }
  function install() {
    inferInitialSkyA();
    applyDefault();

    document.addEventListener('pointerdown', function (event) {
      const edit = event.target.closest('[data-edit]')?.dataset.edit;
      if (edit === 'skyA' || edit === 'skyB') setTimeout(function () { syncNativeTargets(edit); }, 0);
      if (event.target.closest('#skyCalcRun, [data-action="manual"], [data-action="here-now"], [data-action="calculate"]')) {
        syncNativeTargets(activeSlot());
      }
    }, true);

    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-action="continue-name"], [data-action="load-saved"]')) rememberFromInput();
      if (event.target.closest('#skyCalcRun')) {
        const slot = activeSlot();
        syncNativeTargets(slot);
        beginCalculationWatch(slot);
        setTimeout(function () { syncNativeTargets(slot); }, 0);
        setTimeout(function () { syncNativeTargets(slot); }, 50);
      }
      setTimeout(applyDefault, 0);
    }, true);

    document.addEventListener('input', function (event) {
      if (event.target.closest('.sky-calc-drawer')) syncNativeTargets(activeSlot());
    }, true);
    document.addEventListener('change', function (event) {
      if (event.target.closest('.sky-calc-drawer') && !event.target.matches('#skyCalcTarget,#skyCreatorTarget')) syncNativeTargets(activeSlot());
    }, true);

    const root = document.getElementById('relphiSkyBuilderV4');
    if (root) {
      new MutationObserver(function () { requestAnimationFrame(applyDefault); })
        .observe(root, { childList:true, subtree:true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
