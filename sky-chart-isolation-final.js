// Final containment for the named Sky Wizard: keep the legacy shell out of Wizard mode
// and preserve each sky through shared-editor operations.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SNAPSHOT_KEY = 'relphiSkyAProtectedSnapshotV2';
  let restoring = false;
  let skyASnapshot = null;

  function byId(id) { return document.getElementById(id); }
  function wait(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function fire(element, type) { if (element) element.dispatchEvent(new Event(type, { bubbles:true })); }
  function targetSelect() { return byId('skyCreatorTarget'); }
  function pasteBox() { return byId('skyCreatorPaste'); }
  function nameBox() { return byId('skyCreatorName'); }
  function notesBox() { return byId('skyCreatorNotes'); }

  function injectStyles() {
    if (byId('relphi-final-sky-wizard-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-final-sky-wizard-style';
    style.textContent = `
body.sky-chart-page #chartPanel[data-sky-builder-ui="wizard"] > .sky-wizard-shell-frictionless,
body.sky-chart-page #chartPanel[data-sky-builder-ui="wizard"] > .sky-wizard-shell:not([data-relphi-wizard-v2]),
body.sky-chart-page #chartPanel[data-sky-builder-ui="wizard"] > #skyCreatorDrawer,
body.sky-chart-page #chartPanel[data-sky-builder-ui="wizard"] > .sky-builder-advanced-panel {
  display:none !important;
}
`;
    document.head.appendChild(style);
  }

  function readSnapshot(kind) {
    return {
      kind:kind,
      text:pasteBox() ? pasteBox().value : '',
      name:nameBox() ? nameBox().value : '',
      notes:notesBox() ? notesBox().value : ''
    };
  }

  function rememberA(snapshot) {
    if (!snapshot || !snapshot.text) return;
    skyASnapshot = snapshot;
    try { sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot)); } catch (error) {}
  }

  function rememberedA() {
    if (skyASnapshot && skyASnapshot.text) return skyASnapshot;
    try { skyASnapshot = JSON.parse(sessionStorage.getItem(SNAPSHOT_KEY) || 'null'); } catch (error) {}
    return skyASnapshot;
  }

  async function switchTarget(kind) {
    const select = targetSelect();
    if (!select) return;
    const wanted = kind === 'currentSky' ? 'currentSky' : 'chart';
    if (select.value !== wanted) {
      select.value = wanted;
      fire(select, 'change');
      await wait(180);
    }
    if (pasteBox()) pasteBox().dataset.skyKind = wanted;
  }

  async function captureA() {
    if (restoring) return;
    const select = targetSelect();
    if (!select) return;
    const previous = select.value;
    await switchTarget('chart');
    await wait(100);
    rememberA(readSnapshot('chart'));
    if (previous === 'currentSky') await switchTarget('currentSky');
  }

  async function applySnapshot(snapshot) {
    if (!snapshot || !snapshot.text) return;
    await switchTarget(snapshot.kind);
    if (nameBox()) { nameBox().value = snapshot.name || ''; fire(nameBox(), 'input'); fire(nameBox(), 'change'); }
    if (notesBox()) { notesBox().value = snapshot.notes || ''; fire(notesBox(), 'input'); fire(notesBox(), 'change'); }
    const paste = pasteBox();
    paste.dataset.skyKind = snapshot.kind;
    paste.value = snapshot.text;
    fire(paste, 'input');
    fire(paste, 'change');
    await wait(520);
  }

  async function protectBothAfterB() {
    if (restoring) return;
    restoring = true;
    try {
      await wait(650);
      await switchTarget('currentSky');
      await wait(120);
      const bSnapshot = readSnapshot('currentSky');
      const aSnapshot = rememberedA();
      if (!aSnapshot || !aSnapshot.text || !bSnapshot.text) return;
      await applySnapshot(aSnapshot);
      await applySnapshot(bSnapshot);
      await switchTarget('currentSky');
    } finally { restoring = false; }
  }

  function textOf(node) { return String(node && node.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase(); }
  function isBeginningB(node) {
    const control = node && node.closest ? node.closest('[data-sky-entry-kind="currentSky"], button, [role="button"]') : null;
    if (!control) return false;
    return control.dataset.skyEntryKind === 'currentSky' || /add another sky|comparison sky|create sky b|sky b/.test(textOf(control));
  }
  function isCreate(node) {
    const button = node && node.closest ? node.closest('button, [role="button"]') : null;
    return !!button && /create this sky|create sky from|calculate this sky|use this sky|open this sky/.test(textOf(button));
  }
  function activeIsB() {
    return targetSelect()?.value === 'currentSky' || pasteBox()?.dataset.skyKind === 'currentSky';
  }

  function install() {
    injectStyles();
    captureA();
    document.addEventListener('click', function (event) {
      if (restoring) return;
      if (isBeginningB(event.target)) captureA();
      if (isCreate(event.target) && activeIsB()) protectBothAfterB();
    }, true);
    document.addEventListener('change', function (event) {
      if (!restoring && event.target === targetSelect() && event.target.value === 'currentSky') captureA();
    }, true);
    new MutationObserver(injectStyles).observe(document.body, { childList:true, subtree:true });
  }

  window.RelphiSkyIsolationFinal = { captureA:captureA, protectBothAfterB:protectBothAfterB };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
