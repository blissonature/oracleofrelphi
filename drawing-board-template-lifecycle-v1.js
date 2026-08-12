// Drawing Board template lifecycle repair: restore saved positions before drawing and clear cards without destroying the layout.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiDrawingBoardTemplateLifecycleV1) return;
  window.__relphiDrawingBoardTemplateLifecycleV1 = true;

  const PANEL = '#shortListPanel';
  let staging = false;
  let queued = false;

  function bridge() { return window.RelphiDrawingBoardPrefabsBridge; }
  function clone(value) { return value ? JSON.parse(JSON.stringify(value)) : value; }
  function panel() { return document.querySelector(PANEL); }
  function field() { return panel()?.querySelector('#rowPositionLabels') || null; }

  function orderedPositions(layout) {
    if (!layout || !Array.isArray(layout.positions)) return [];
    return layout.positions.slice().sort((a, b) => Number(a.drawOrder || 0) - Number(b.drawOrder || 0));
  }

  function labelsFromLayout(layout) {
    return orderedPositions(layout).map((item, index) => String(item?.label || ('Position #' + (index + 1))).trim());
  }

  function displayName(layout) {
    const positions = orderedPositions(layout);
    return positions.length + ' | ' + String(layout?.name || '').trim();
  }

  function listTemplates() {
    try {
      const value = window.RelphiDrawingBoardSpreadPrefabs?.list?.();
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  }

  function templateFromValue(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return null;
    return listTemplates().find(item => displayName(item).toLowerCase() === normalized) || null;
  }

  function selectedTemplate() {
    return templateFromValue(field()?.value || '');
  }

  function stateLayout() {
    const state = bridge()?.getState?.();
    const candidates = [state?.currentLayout, state?.activeLayout];
    return candidates.find(item => orderedPositions(item).length) || null;
  }

  function slotCount() {
    const root = panel();
    if (!root) return 0;
    const domCount = root.querySelectorAll('.card-row-board .card-row-item').length;
    const stateCount = Number(bridge()?.getState?.()?.slotCount);
    return Math.max(domCount, Number.isFinite(stateCount) ? stateCount : 0);
  }

  function dispatchLabels(labels) {
    const input = field();
    if (!input || !labels.length) return false;
    const value = labels.join(', ');
    input.value = value;
    input.dataset.relphiManualValue = value;
    input.dispatchEvent(new Event('input', { bubbles:true }));
    input.dispatchEvent(new Event('change', { bubbles:true }));
    return true;
  }

  function ensureSlotCount(count) {
    const root = panel();
    const add = root?.querySelector('#addCardPlaceholder');
    if (!root || !add || count < 1) return;
    let guard = 0;
    while (slotCount() < count && guard < count + 4) {
      const wasDisabled = !!add.disabled;
      if (wasDisabled) add.disabled = false;
      add.click();
      if (wasDisabled) add.disabled = true;
      guard += 1;
      if (slotCount() >= count) break;
    }
  }

  function syncVisibleEditors(layout) {
    const positions = orderedPositions(layout);
    const items = Array.from(panel()?.querySelectorAll('.card-row-board .card-row-item') || []);
    positions.forEach((position, index) => {
      const item = items[index];
      const editor = item?.querySelector('[data-row-position-label-editor],.card-row-position-editor');
      const label = String(position?.label || ('Position #' + (index + 1))).trim();
      if (!editor || editor.textContent.trim() === label) return;
      editor.textContent = label;
      editor.dispatchEvent(new Event('input', { bubbles:true }));
      editor.dispatchEvent(new Event('change', { bubbles:true }));
    });
  }

  function stageLayout(layout) {
    const positions = orderedPositions(layout);
    if (!positions.length || staging) return false;
    staging = true;
    try {
      dispatchLabels(labelsFromLayout(layout));
      ensureSlotCount(positions.length);
      dispatchLabels(labelsFromLayout(layout));
      syncVisibleEditors(layout);
      return slotCount() >= positions.length;
    } finally {
      staging = false;
    }
  }

  function reconcileLayout(layout) {
    if (!layout || !orderedPositions(layout).length) return;
    stageLayout(layout);
    syncVisibleEditors(layout);
  }

  function applySavedTemplate(layout) {
    if (!layout) return;
    const state = bridge()?.getState?.();
    if (state?.designMode || state?.hasCards || state?.locked) return;
    stageLayout(layout);
    bridge()?.applyLayout?.(clone(layout), { designMode:false });
    requestAnimationFrame(() => reconcileLayout(layout));
  }

  function scheduleReconcile(layout) {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      reconcileLayout(layout || stateLayout());
    });
  }

  function captureControlState(root) {
    const ids = [
      'rowName', 'rowNotes', 'rowDrawScope', 'rowAllowRepeats', 'rowAllowReversalsQuick',
      'rowPositionStickersQuick', 'rowSnapEnabled', 'rowRotationSnapEnabled'
    ];
    const values = {};
    ids.forEach(id => {
      const control = root?.querySelector('#' + id);
      if (!control) return;
      values[id] = {
        value:'value' in control ? control.value : undefined,
        checked:'checked' in control ? !!control.checked : undefined
      };
    });
    return values;
  }

  function restoreControlState(root, values) {
    Object.entries(values || {}).forEach(([id, saved]) => {
      const control = root?.querySelector('#' + id);
      if (!control) return;
      if (saved.value !== undefined) control.value = saved.value;
      if (saved.checked !== undefined) control.checked = saved.checked;
      control.dispatchEvent(new Event('input', { bubbles:true }));
      control.dispatchEvent(new Event('change', { bubbles:true }));
    });
  }

  function restoreAfterCardClear(snapshot, attempt = 0) {
    const root = panel();
    const state = bridge()?.getState?.();
    if (!root) return;
    if (state?.hasCards) {
      if (attempt < 12) window.setTimeout(() => restoreAfterCardClear(snapshot, attempt + 1), 25);
      return;
    }

    restoreControlState(root, snapshot.controls);
    if (snapshot.layout) {
      stageLayout(snapshot.layout);
      bridge()?.applyLayout?.(clone(snapshot.layout), { designMode:false });
      scheduleReconcile(snapshot.layout);
    } else if (snapshot.labels.length) {
      dispatchLabels(snapshot.labels);
      ensureSlotCount(snapshot.labels.length);
      dispatchLabels(snapshot.labels);
    }
  }

  function clearCardsOnly() {
    const root = panel();
    const clear = root?.querySelector('#clearShortList');
    const state = bridge()?.getState?.();
    if (!root || !clear || !state?.hasCards) return;

    const layout = clone(stateLayout() || selectedTemplate());
    const labels = layout ? labelsFromLayout(layout) : String(field()?.value || '').split(',').map(value => value.trim()).filter(Boolean);
    const snapshot = { layout, labels, controls:captureControlState(root) };

    clear.click();
    window.setTimeout(() => restoreAfterCardClear(snapshot), 0);
  }

  function installClearCardsButton() {
    const root = panel();
    const clear = root?.querySelector('#clearShortList');
    if (!root || !clear) return;
    let cardsOnly = root.querySelector('#clearShortListCardsOnly');
    if (!cardsOnly) {
      cardsOnly = document.createElement('button');
      cardsOnly.id = 'clearShortListCardsOnly';
      cardsOnly.type = 'button';
      cardsOnly.className = clear.className;
      cardsOnly.textContent = 'Clear Cards';
      cardsOnly.title = 'Remove drawn cards and keep the spread positions';
      cardsOnly.setAttribute('aria-label', 'Clear cards and keep spread positions');
      clear.insertAdjacentElement('beforebegin', cardsOnly);
      cardsOnly.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        clearCardsOnly();
      });
    }
    cardsOnly.disabled = !bridge()?.getState?.()?.hasCards;
    clear.title = 'Clear board: remove cards and spread positions';
    clear.setAttribute('aria-label', 'Clear board including cards and spread positions');
    if (String(clear.textContent || '').trim().toLowerCase() === 'clear') clear.textContent = 'Clear Board';
  }

  // Selecting a saved template should mean using it. Wait until the prefab chooser has
  // recorded its selection, then instantiate the saved positions while the board is clear.
  document.addEventListener('input', event => {
    if (staging || event.target?.id !== 'rowPositionLabels') return;
    const layout = templateFromValue(event.target.value);
    if (!layout) return;
    window.setTimeout(() => applySavedTemplate(layout), 0);
  }, true);

  document.addEventListener('change', event => {
    if (staging || event.target?.id !== 'rowPositionLabels') return;
    const layout = templateFromValue(event.target.value);
    if (!layout) return;
    window.setTimeout(() => applySavedTemplate(layout), 0);
  }, true);

  // The explicit Use Template button still works. Pre-stage its slots before the prefab
  // handler locks the restored layout for use.
  document.addEventListener('click', event => {
    const use = event.target?.closest?.('[data-prefab-action="use"]');
    if (!use) return;
    const layout = selectedTemplate();
    const state = bridge()?.getState?.();
    if (layout && !state?.hasCards && !state?.locked && !state?.designMode) stageLayout(layout);
  }, true);

  document.addEventListener('relphi:drawing-board-rendered', () => {
    installClearCardsButton();
    const layout = stateLayout();
    if (layout) scheduleReconcile(layout);
  });

  new MutationObserver(records => {
    if (!records.some(record => Array.from(record.addedNodes).some(node => node.nodeType === 1 && (node.id === 'shortListPanel' || node.querySelector?.('#shortListPanel,#clearShortList'))))) return;
    installClearCardsButton();
  }).observe(document.documentElement, { childList:true, subtree:true });

  function start() {
    installClearCardsButton();
    const layout = stateLayout();
    if (layout) scheduleReconcile(layout);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();

  window.RelphiDrawingBoardTemplateLifecycle = Object.freeze({
    labelsFromLayout,
    displayName,
    stageLayout,
    reconcileLayout
  });
})();
