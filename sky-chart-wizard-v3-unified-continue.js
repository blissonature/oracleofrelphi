// One Continue button: load an exact saved sky, or let V3 continue creating a new one.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const LIBRARY_KEY = 'relphiSkyLibraryV1';
  const SLOT_KEYS = { chart:'relphiTarotChart', currentSky:'relphiCurrentSky' };
  const SNAPSHOT_KEY = 'relphiWizardV3SkyA';
  const RESUME_KEY = 'relphiWizardV3Resume';
  let selectionKind = 'chart';

  function byId(id) { return document.getElementById(id); }
  function normalize(value) { return String(value || '').trim().toLowerCase(); }
  function readJson(key, fallback, session) {
    try {
      const storage = session ? sessionStorage : localStorage;
      const raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) { return fallback; }
  }
  function writeJson(key, value, session) {
    try {
      (session ? sessionStorage : localStorage).setItem(key, JSON.stringify(value));
      return true;
    } catch (_) { return false; }
  }
  function removeKey(key, session) {
    try { (session ? sessionStorage : localStorage).removeItem(key); } catch (_) {}
  }
  function placementEntries(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(function (entry) {
      const placement = entry[1];
      if (!placement || typeof placement !== 'object' || Array.isArray(placement)) return false;
      const degree = placement.degree;
      return String(placement.sign || '').trim() || (degree !== '' && degree != null && Number.isFinite(Number(degree)));
    }));
  }
  function hasPlacements(payload) {
    return !!Object.keys(placementEntries(payload && (payload.placements || payload))).length;
  }
  function records() {
    const stored = readJson(LIBRARY_KEY, [], false);
    return Array.isArray(stored) ? stored.filter(function (record) {
      return record && String(record.name || '').trim() && Object.keys(placementEntries(record.placements)).length;
    }) : [];
  }
  function recordByName(name) {
    return records().find(function (record) { return normalize(record.name) === normalize(name); }) || null;
  }
  function payload(record) {
    return {
      name:String(record.name || '').trim(),
      notes:String(record.notes || ''),
      placements:placementEntries(record.placements),
      calcProfile:record.calcProfile && typeof record.calcProfile === 'object' ? record.calcProfile : {},
      savedAt:record.savedAt || new Date().toISOString(),
      savedAtLocal:record.savedAtLocal || new Date().toLocaleString()
    };
  }
  function statusForInput() {
    const input = byId('relphiV3NameInput');
    const status = byId('relphiV3NameStatus');
    const load = byId('relphiV3LoadSaved');
    if (load) load.hidden = true;
    if (!status) return;
    const record = recordByName(input?.value || '');
    if (record) status.textContent = 'Continue will load the saved sky “' + record.name + '”.';
    else if (/saved sky|Continue will load/i.test(status.textContent)) status.textContent = '';
  }
  function loadSaved(record) {
    const saved = payload(record);
    const status = byId('relphiV3NameStatus');
    if (!hasPlacements(saved)) {
      if (status) status.textContent = 'That saved sky has no usable placements.';
      return;
    }

    if (selectionKind === 'chart') {
      writeJson(SLOT_KEYS.chart, saved, false);
      removeKey(SLOT_KEYS.currentSky, false);
      removeKey(SNAPSHOT_KEY, true);
      removeKey(RESUME_KEY, true);
      const url = new URL(location.href);
      url.searchParams.delete('v3resume');
      url.searchParams.set('v3load', String(Date.now()));
      location.replace(url.toString());
      return;
    }

    const snapshot = readJson(SNAPSHOT_KEY, null, true);
    const skyA = snapshot?.payload && hasPlacements(snapshot.payload) ? snapshot.payload : readJson(SLOT_KEYS.chart, null, false);
    if (!hasPlacements(skyA)) {
      if (status) status.textContent = 'Sky A could not be preserved.';
      return;
    }
    writeJson(SLOT_KEYS.chart, skyA, false);
    writeJson(SLOT_KEYS.currentSky, saved, false);
    writeJson(RESUME_KEY, { skyA:skyA.name || snapshot?.name || 'Sky A', skyB:saved.name, savedAt:Date.now() }, true);
    const url = new URL(location.href);
    url.searchParams.delete('v3load');
    url.searchParams.set('v3resume', String(Date.now()));
    location.replace(url.toString());
  }
  function install() {
    const params = new URLSearchParams(location.search);
    if (!params.has('v3resume') && !params.has('v3load')) {
      selectionKind = 'chart';
      removeKey(SNAPSHOT_KEY, true);
      removeKey(RESUME_KEY, true);
    }

    const wait = function () {
      if (!byId('relphiSkyWizard')) return setTimeout(wait, 50);
      const load = byId('relphiV3LoadSaved');
      if (load) load.hidden = true;
      statusForInput();
      byId('relphiV3NameInput')?.addEventListener('input', statusForInput);
      byId('relphiV3NameInput')?.addEventListener('change', statusForInput);
    };
    wait();

    window.addEventListener('click', function (event) {
      const target = event.target;
      if (target.closest?.('#relphiV3AddComparison')) {
        selectionKind = 'currentSky';
        return;
      }
      if (target.closest?.('#relphiV3BackName') && selectionKind === 'currentSky') return;
      if (target.closest?.('#relphiV3LoadSaved')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const record = recordByName(byId('relphiV3NameInput')?.value || '');
        if (record) loadSaved(record);
        return;
      }
      if (!target.closest?.('#relphiV3Continue')) return;
      const record = recordByName(byId('relphiV3NameInput')?.value || '');
      if (!record) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      loadSaved(record);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
