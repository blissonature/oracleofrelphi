// Single authority for PR55: one visible Wizard stage and strict Sky A / Sky B slot ownership.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (new URLSearchParams(location.search).get('preview') !== 'pr55') return;

  const LIBRARY_KEY = 'relphiSkyLibraryV1';
  const A_KEY = 'relphiTarotChart';
  const B_KEY = 'relphiCurrentSky';
  const SNAPSHOT_KEY = 'relphiPr55SkyASnapshot';
  const STAGES = ['relphiV3Name','relphiV3Method','relphiV3ExistingStage','relphiV3CalculateStage','relphiV3Complete'];
  let comparison = false;

  function byId(id) { return document.getElementById(id); }
  function readJson(key, fallback, session) {
    try {
      const storage = session ? sessionStorage : localStorage;
      const raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) { return fallback; }
  }
  function writeJson(key, value, session) {
    try { (session ? sessionStorage : localStorage).setItem(key, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  }
  function removeKey(key, session) {
    try { (session ? sessionStorage : localStorage).removeItem(key); } catch (_) {}
  }
  function normalize(value) { return String(value || '').trim().toLowerCase(); }
  function placementEntries(payload) {
    const source = payload && (payload.placements || payload);
    if (!source || typeof source !== 'object' || Array.isArray(source)) return {};
    return Object.fromEntries(Object.entries(source).filter(function (entry) {
      const item = entry[1];
      return item && typeof item === 'object' && !Array.isArray(item) &&
        (String(item.sign || '').trim() || (item.degree !== '' && item.degree != null && Number.isFinite(Number(item.degree))));
    }));
  }
  function hasPlacements(payload) { return Object.keys(placementEntries(payload)).length > 0; }
  function signature(payload) {
    return Object.entries(placementEntries(payload)).sort(function (a, b) { return a[0].localeCompare(b[0]); }).map(function (entry) {
      const item = entry[1] || {};
      return [entry[0], item.sign || '', item.degree ?? '', item.minute ?? '', item.house ?? '', item.retrograde ? 'R' : ''].join(':');
    }).join('|');
  }
  function records() {
    const list = readJson(LIBRARY_KEY, []);
    return Array.isArray(list) ? list.filter(function (record) { return record && String(record.name || '').trim() && hasPlacements(record); }) : [];
  }
  function recordByName(name) {
    return records().find(function (record) { return normalize(record.name) === normalize(name); }) || null;
  }
  function payloadFromRecord(record) {
    return {
      name:String(record.name || '').trim(),
      notes:String(record.notes || ''),
      placements:placementEntries(record.placements),
      calcProfile:record.calcProfile && typeof record.calcProfile === 'object' ? record.calcProfile : {},
      savedAt:record.savedAt || new Date().toISOString(),
      savedAtLocal:record.savedAtLocal || new Date().toLocaleString()
    };
  }
  function matchingRecord(payload) {
    const sig = signature(payload);
    if (!sig) return null;
    const matches = records().filter(function (record) { return signature(record) === sig; });
    return matches.find(function (record) { return normalize(record.name) === 'marisa'; }) || matches[0] || null;
  }
  function setTarget(kind) {
    ['skyCreatorTarget','skyCalcTarget'].forEach(function (id) {
      const field = byId(id);
      if (!field) return;
      field.value = kind;
      field.dispatchEvent(new Event('input', { bubbles:true }));
      field.dispatchEvent(new Event('change', { bubbles:true }));
    });
    const paste = byId('skyCreatorPaste');
    if (paste) paste.dataset.skyKind = kind;
  }
  function showOnly(id) {
    STAGES.forEach(function (stageId) {
      const stage = byId(stageId);
      if (!stage) return;
      const visible = stageId === id;
      stage.hidden = !visible;
      stage.toggleAttribute('hidden', !visible);
      stage.setAttribute('aria-hidden', visible ? 'false' : 'true');
    });
  }
  function currentVisibleStage() {
    return STAGES.find(function (id) {
      const stage = byId(id);
      return stage && !stage.hidden;
    }) || '';
  }
  function comparisonStage() {
    const eyebrow = String(byId('relphiV3NameEyebrow')?.textContent || '').toLowerCase();
    return comparison || eyebrow.includes('comparison') || document.body.dataset.relphiPendingSkyKind === 'currentSky';
  }
  function captureA() {
    let payload = readJson(A_KEY, null);
    if (!hasPlacements(payload)) return null;
    const match = matchingRecord(payload);
    if (match?.name) payload = { ...payload, name:match.name };
    writeJson(A_KEY, payload);
    writeJson(SNAPSHOT_KEY, { payload:payload, signature:signature(payload), capturedAt:Date.now() }, true);
    const chart = byId('chartOutput');
    if (chart) chart.dataset.skyName = payload.name || 'Sky A';
    return payload;
  }
  function snapshotA() {
    const saved = readJson(SNAPSHOT_KEY, null, true);
    return saved?.payload && hasPlacements(saved.payload) ? saved.payload : captureA();
  }
  function restoreA() {
    const a = snapshotA();
    if (a) writeJson(A_KEY, a);
    return a;
  }
  function activateComparison() {
    const button = document.querySelector('[data-sky-chart-mode="compare"], [data-sky-chart-mode="synastry"], [data-sky-chart-mode="transit"]');
    button?.click();
    const output = byId('currentSkyOutput');
    if (output) {
      output.hidden = false;
      output.removeAttribute('hidden');
    }
  }
  function updateSavedHint() {
    const input = byId('relphiV3NameInput');
    const status = byId('relphiV3NameStatus');
    const record = recordByName(input?.value || '');
    if (!status) return;
    if (record) status.textContent = 'Continue will load the saved sky “' + record.name + '”.';
    else if (/Continue will load|saved sky could not/i.test(status.textContent || '')) status.textContent = '';
  }
  function loadSavedA(record, event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const payload = payloadFromRecord(record);
    writeJson(A_KEY, payload);
    removeKey(B_KEY);
    removeKey(SNAPSHOT_KEY, true);
    removeKey('relphiWizardV3Resume', true);
    const url = new URL(location.href);
    url.searchParams.set('v3load', String(Date.now()));
    location.replace(url.toString());
  }
  function ensureRunBoundary() {
    const run = byId('skyCalcRun');
    if (!run || run.dataset.relphiPr55Boundary === 'true') return;
    run.dataset.relphiPr55Boundary = 'true';
    run.addEventListener('click', function () {
      if (!comparisonStage()) return;
      comparison = true;
      restoreA();
      setTarget('currentSky');
      document.body.dataset.relphiPendingSkyKind = 'currentSky';
    }, true);
  }
  function reconcileSlots() {
    if (!comparisonStage()) return;
    const a = restoreA();
    const b = readJson(B_KEY, null);
    if (!a || !hasPlacements(b)) return;
    if (signature(a) === signature(b)) return;
    writeJson(A_KEY, a);
    activateComparison();
    const chart = byId('chartOutput');
    const current = byId('currentSkyOutput');
    if (chart) chart.dataset.skyName = a.name || 'Sky A';
    if (current) current.dataset.skyName = b.name || 'Sky B';
  }
  function ensureStartOver() {
    if (byId('relphiV3StartOver')) return;
    const hero = document.querySelector('.sky-chart-hero-panel');
    if (!hero) return;
    const button = document.createElement('button');
    button.id = 'relphiV3StartOver';
    button.type = 'button';
    button.textContent = 'Start Over';
    hero.insertAdjacentElement('afterend', button);
    button.addEventListener('click', function () {
      if (!window.confirm('Start over? This clears Sky A and Sky B from the current workspace. Saved skies will not be deleted.')) return;
      removeKey(A_KEY);
      removeKey(B_KEY);
      removeKey(SNAPSHOT_KEY, true);
      removeKey('relphiWizardV3Resume', true);
      const url = new URL(location.href);
      url.searchParams.set('reset', String(Date.now()));
      location.replace(url.toString());
    });
  }
  function installStyles() {
    if (byId('relphiPr55AuthorityStyles')) return;
    const style = document.createElement('style');
    style.id = 'relphiPr55AuthorityStyles';
    style.textContent = '#relphiSkyWizard .relphi-v3-stage[hidden]{display:none!important}#relphiSkyWizard .relphi-v3-stage:not([hidden]){display:block!important}#relphiV3StartOver{appearance:none;border:1px solid rgba(220,31,24,.42);border-radius:999px;background:#fff;color:#111;font:inherit;font-weight:700;padding:.75rem 1.25rem;min-height:44px;display:block;margin:1rem 0 1rem auto}';
    document.head.appendChild(style);
  }
  function install() {
    installStyles();
    ensureStartOver();
    ensureRunBoundary();
    updateSavedHint();

    window.addEventListener('click', function (event) {
      const target = event.target;
      if (target.closest?.('#relphiV3Continue')) {
        const record = recordByName(byId('relphiV3NameInput')?.value || '');
        if (record && !comparisonStage()) return loadSavedA(record, event);
      }
      if (target.closest?.('#relphiV3AddComparison')) {
        captureA();
        comparison = true;
        document.body.dataset.relphiPendingSkyKind = 'currentSky';
        setTimeout(function () { showOnly('relphiV3Name'); }, 0);
        return;
      }
      if (target.closest?.('#relphiV3Calculate')) {
        setTimeout(function () { showOnly('relphiV3CalculateStage'); }, 0);
        return;
      }
      if (target.closest?.('#relphiV3Existing')) {
        setTimeout(function () { showOnly('relphiV3ExistingStage'); }, 0);
        return;
      }
      if (target.closest?.('#relphiV3BackName')) {
        setTimeout(function () { showOnly('relphiV3Name'); }, 0);
        return;
      }
      if (target.closest?.('#relphiV3BackMethodCalc, #relphiV3BackMethodExisting')) {
        setTimeout(function () { showOnly('relphiV3Method'); }, 0);
        return;
      }
      if (target.closest?.('#relphiV3HereNow, #relphiV3Manual')) {
        if (comparisonStage()) {
          comparison = true;
          restoreA();
          document.body.dataset.relphiPendingSkyKind = 'currentSky';
        }
      }
    }, true);

    byId('relphiV3NameInput')?.addEventListener('input', updateSavedHint);
    byId('relphiV3NameInput')?.addEventListener('change', updateSavedHint);

    new MutationObserver(function () {
      ensureStartOver();
      ensureRunBoundary();
      if (comparisonStage()) reconcileSlots();
      const visible = STAGES.filter(function (id) { const stage = byId(id); return stage && !stage.hidden; });
      if (visible.length > 1) showOnly(visible[visible.length - 1]);
    }).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['hidden'] });

    [250, 800, 1800, 3500].forEach(function (delay) {
      setTimeout(function () { ensureRunBoundary(); reconcileSlots(); }, delay);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
