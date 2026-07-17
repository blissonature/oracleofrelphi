// User-specific Sky Builder defaults stored in this browser; no person is hard-coded.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (new URLSearchParams(location.search).get('preview') !== 'pr55') return;

  const LIBRARY_KEY = 'relphiSkyLibraryV1';
  const SKY_A_KEY = 'relphiTarotChart';
  const PREFS_KEY = 'relphiSkyBuilderV4Preferences';
  const DEFAULT_SKY_B = 'Now';

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
  function currentStep() {
    const state = (() => {
      try { return JSON.parse(sessionStorage.getItem('relphiSkyBuilderV4State') || '{}'); }
      catch (_) { return {}; }
    })();
    return String(state.step || '');
  }
  function applyDefault() {
    const input = document.getElementById('relphiV4Name');
    if (!input || input.value.trim()) return;
    const step = currentStep();
    if (step === 'nameA') input.value = preferences().defaultSkyA || inferInitialSkyA();
    if (step === 'nameB') input.value = preferences().defaultSkyB || DEFAULT_SKY_B;
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
  function install() {
    inferInitialSkyA();
    applyDefault();

    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-action="continue-name"], [data-action="load-saved"]')) rememberFromInput();
      setTimeout(applyDefault, 0);
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
