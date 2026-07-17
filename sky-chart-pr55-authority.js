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
  let updateQueued = false;

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
      name:String(record.name || '').trim(), notes:String(record.notes || ''),
      placements:placementEntries(record.placements),
      calcProfile:record.calcProfile && typeof record.calcProfile === 'object' ? record.calcProfile : {},
      savedAt:record.savedAt || new Date().toISOString(), savedAtLocal:record.savedAtLocal || new Date().toLocaleString()
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
      if (field.value !== kind) field.value = kind;
      field.dispatchEvent(new Event('input', { bubbles:true }));
      field.dispatchEvent(new Event('change', { bubbles:true }));
    });
    const paste = byId('skyCreatorPaste');
    if (paste) paste.dataset.skyKind = kind;
  }
  function setHidden(node, hidden) {
    if (!node) return;
    if (node.hidden !== hidden) node.hidden = hidden;
    if (hidden && !node.hasAttribute('hidden')) node.setAttribute('hidden', '');
    if (!hidden && node.hasAttribute('hidden')) node.removeAttribute('hidden');
    const aria = hidden ? 'true' : 'false';
    if (node.getAttribute('aria-hidden') !== aria) node.setAttribute('aria-hidden', aria);
  }
  function showOnly(id) {
    STAGES.forEach(function (stageId) { setHidden(byId(stageId), stageId !== id); });
    if (id === 'relphiV3Method') ensureMethodChoices();
  }
  function ensureMethodChoices() {
    const stage = byId('relphiV3Method');
    if (!stage) return;
    const grid = stage.querySelector('.relphi-v3-choice-grid');
    setHidden(grid, false);
    [byId('relphiV3Existing'), byId('relphiV3Calculate')].forEach(function (button) {
      setHidden(button, false);
      if (button) button.style.removeProperty('display');
    });
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
    if (output) setHidden(output, false);
  }
  function updateSavedHint() {
    const input = byId('relphiV3NameInput');
    const status = byId('relphiV3NameStatus');
    const record = recordByName(input?.value || '');
    if (!status) return;
    const next = record ? 'Continue will load the saved sky “' + record.name + '”.' : '';
    if (record && status.textContent !== next) status.textContent = next;
    else if (!record && /Continue will load|saved sky could not/i.test(status.textContent || '')) status.textContent = '';
  }
  function loadSavedA(record, event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    writeJson(A_KEY, payloadFromRecord(record));
    removeKey(B_KEY); removeKey(SNAPSHOT_KEY, true); removeKey('relphiWizardV3Resume', true);
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
      comparison = true; restoreA(); setTarget('currentSky');
      document.body.dataset.relphiPendingSkyKind = 'currentSky';
    }, true);
  }
  function reconcileSlots() {
    if (!comparisonStage()) return;
    const a = restoreA();
    const b = readJson(B_KEY, null);
    if (!a || !hasPlacements(b) || signature(a) === signature(b)) return;
    writeJson(A_KEY, a); activateComparison();
    const chart = byId('chartOutput'); const current = byId('currentSkyOutput');
    if (chart) chart.dataset.skyName = a.name || 'Sky A';
    if (current) current.dataset.skyName = b.name || 'Sky B';
  }
  function ensureStartOver() {
    if (byId('relphiV3StartOver')) return;
    const hero = document.querySelector('.sky-chart-hero-panel');
    if (!hero) return;
    const button = document.createElement('button');
    button.id = 'relphiV3StartOver'; button.type = 'button'; button.textContent = 'Start Over';
    hero.insertAdjacentElement('afterend', button);
    button.addEventListener('click', function () {
      if (!window.confirm('Start over? This clears Sky A and Sky B from the current workspace. Saved skies will not be deleted.')) return;
      removeKey(A_KEY); removeKey(B_KEY); removeKey(SNAPSHOT_KEY, true); removeKey('relphiWizardV3Resume', true);
      const url = new URL(location.href); url.searchParams.set('reset', String(Date.now())); location.replace(url.toString());
    });
  }
  function installStyles() {
    if (byId('relphiPr55AuthorityStyles')) return;
    const style = document.createElement('style');
    style.id = 'relphiPr55AuthorityStyles';
    style.textContent = '#relphiSkyWizard .relphi-v3-stage[hidden],#relphiSkyWizard .relphi-v3-choice-grid[hidden],#relphiSkyWizard .choice[hidden]{display:none!important}#relphiSkyWizard .relphi-v3-stage:not([hidden]){display:block!important}#relphiV3StartOver{appearance:none;border:1px solid rgba(220,31,24,.42);border-radius:999px;background:#fff;color:#111;font:inherit;font-weight:700;padding:.75rem 1.25rem;min-height:44px;display:block;margin:1rem 0 1rem auto}';
    document.head.appendChild(style);
  }
  function maintain() {
    ensureStartOver(); ensureRunBoundary();
    const method = byId('relphiV3Method');
    if (method && !method.hidden) ensureMethodChoices();
    reconcileSlots();
  }
  function queueMaintain() {
    if (updateQueued) return;
    updateQueued = true;
    requestAnimationFrame(function () { updateQueued = false; maintain(); });
  }
  function install() {
    installStyles(); maintain(); updateSavedHint();
    window.addEventListener('click', function (event) {
      const target = event.target;
      if (target.closest?.('#relphiV3Continue')) {
        const record = recordByName(byId('relphiV3NameInput')?.value || '');
        if (record && !comparisonStage()) return loadSavedA(record, event);
        setTimeout(function () { showOnly('relphiV3Method'); ensureMethodChoices(); }, 0);
        return;
      }
      if (target.closest?.('#relphiV3AddComparison')) {
        captureA(); comparison = true; document.body.dataset.relphiPendingSkyKind = 'currentSky';
        setTimeout(function () { showOnly('relphiV3Name'); }, 0); return;
      }
      if (target.closest?.('#relphiV3Calculate')) { setTimeout(function () { showOnly('relphiV3CalculateStage'); }, 0); return; }
      if (target.closest?.('#relphiV3Existing')) { setTimeout(function () { showOnly('relphiV3ExistingStage'); }, 0); return; }
      if (target.closest?.('#relphiV3BackName')) { setTimeout(function () { showOnly('relphiV3Name'); }, 0); return; }
      if (target.closest?.('#relphiV3BackMethodCalc, #relphiV3BackMethodExisting')) { setTimeout(function () { showOnly('relphiV3Method'); }, 0); return; }
      if (target.closest?.('#relphiV3HereNow, #relphiV3Manual') && comparisonStage()) {
        comparison = true; restoreA(); document.body.dataset.relphiPendingSkyKind = 'currentSky';
      }
    }, true);
    byId('relphiV3NameInput')?.addEventListener('input', updateSavedHint);
    byId('relphiV3NameInput')?.addEventListener('change', updateSavedHint);

    const wizard = byId('relphiSkyWizard');
    if (wizard) new MutationObserver(queueMaintain).observe(wizard, { childList:true, subtree:true, attributes:true, attributeFilter:['hidden'] });
    ['skyCalcStatus','chartOutput','currentSkyOutput'].forEach(function (id) {
      const node = byId(id); if (node) new MutationObserver(queueMaintain).observe(node, { childList:true, subtree:true, characterData:true });
    });
    [250, 800, 1800].forEach(function (delay) { setTimeout(maintain, delay); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
