// Desktop Drawing Board chrome owner. UI placement only; no card or Celtic geometry.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.matchMedia?.('(max-width:700px)')?.matches) return;
  if (window.__relphiDrawingBoardChromeUIV3) return;
  window.__relphiDrawingBoardChromeUIV3 = true;
  window.__relphiDrawingBoardChromeOwnershipV1 = true;
  window.__relphiDrawingBoardChromeUIV2 = true;

  const PANEL = '#shortListPanel';
  const EXPORT_IDS = ['snapshotCardRowArrangement','saveDrawingBoardSnapshotToDevice','downloadRowOptimizedHtml','downloadRowJson'];
  let queued = false;
  let repairing = false;

  function panel() { return document.querySelector(PANEL); }
  function move(destination, node) {
    if (!destination || !node || destination.contains(node)) return false;
    destination.appendChild(node);
    return true;
  }
  function control(root, id) {
    const node = root?.querySelector('#' + id);
    if (!node) return null;
    const label = node.closest('label');
    return label && root.contains(label) ? label : node;
  }
  function clearDraggedPosition(node) {
    if (!node?.style) return;
    ['position','inset','left','right','top','bottom','translate','transform','z-index'].forEach(name => node.style.removeProperty(name));
  }
  function ensureParent(root, id, destination) {
    const node = root?.querySelector('#' + id);
    if (!node || !destination || node.parentElement === destination) return;
    destination.appendChild(node);
  }

  function ensureAfterCanvas(root) {
    const drawer = root.querySelector('.card-row-drawing-board');
    const workspace = drawer?.querySelector(':scope > .card-row-workspace') || root.querySelector('.card-row-workspace');
    const afterCanvas = root.querySelector('#drawing-board-after-canvas');
    if (!drawer || !workspace || !afterCanvas) return;
    if (afterCanvas.parentElement !== drawer || workspace.nextElementSibling !== afterCanvas) workspace.insertAdjacentElement('afterend', afterCanvas);
    clearDraggedPosition(afterCanvas);

    const titleBody = afterCanvas.querySelector('#drawing-board-title .drawing-board-post-body');
    const notesBody = afterCanvas.querySelector('#drawing-board-notes .drawing-board-post-body');
    const exportBody = afterCanvas.querySelector('#drawing-board-post-export .board-options-body');
    const name = control(root, 'rowName');
    const notes = control(root, 'rowNotes');
    const stats = root.querySelector('.card-row-stats');
    if (name) name.classList.add('relphi-reading-name-control');
    if (stats) stats.classList.add('relphi-reading-stats');
    move(titleBody, name);
    move(titleBody, stats);
    move(notesBody, notes);
    root.querySelector('#printRowPdf')?.remove();
    EXPORT_IDS.forEach(id => {
      const node = root.querySelector('#' + id);
      if (!node || !exportBody) return;
      move(exportBody, node);
      clearDraggedPosition(node);
    });
  }

  function ensureWorkspaceTools(root) {
    const workspace = root.querySelector('.card-row-workspace');
    const tools = workspace?.querySelector(':scope > .relphi-workspace-tools');
    if (!workspace || !tools) return;
    const snapRows = tools.querySelector('.relphi-snap-rows');
    const rows = Array.from(snapRows?.querySelectorAll('.relphi-snap-row') || []);
    const snapRow = rows[0] || null;
    const rotationRow = rows[1] || null;
    const snapMeasure = snapRow?.querySelector('.relphi-snap-measure') || null;
    const rotationMeasure = rotationRow?.querySelector('.relphi-snap-measure') || null;
    ensureParent(root, 'rowSnapEnabled', snapRow);
    ensureParent(root, 'rowSnapGridMinus', snapRow);
    ensureParent(root, 'rowSnapGridValue', snapMeasure);
    ensureParent(root, 'rowSnapGridPlus', snapRow);
    ensureParent(root, 'rowRotationSnapEnabled', rotationRow);
    ensureParent(root, 'rowRotationSnapMinus', rotationRow);
    ensureParent(root, 'rowRotationSnapValue', rotationMeasure);
    ensureParent(root, 'rowRotationSnapPlus', rotationRow);
    ensureParent(root, 'resetCardRowLayout', snapRows);
    ensureParent(root, 'rowEnvelopeColor', tools.querySelector('.relphi-card-color-slot'));
    ensureParent(root, 'rowTableImageUpload', tools.querySelector('.relphi-board-image-slot'));
    ensureParent(root, 'rowTableColor', tools.querySelector('.relphi-board-color-slot'));
    ensureParent(root, 'rowTableImageReset', tools.querySelector('.relphi-board-reset-slot'));
  }

  function ensureOptions(root) {
    const workspace = root.querySelector('.card-row-workspace');
    const drawer = root.querySelector('.relphi-reading-options-drawer');
    if (workspace && drawer && drawer.parentElement !== workspace) workspace.insertAdjacentElement('afterbegin', drawer);
    window.RelphiDrawingBoardEnsureTopActions?.(root);
  }

  function finalToolbarReady(root) {
    const toolbar = root.querySelector('.card-row-workspace>.card-row-workspace-toolbar');
    if (!toolbar) return false;
    const final = !!toolbar.querySelector('#zoomCardRowExtents') && !!toolbar.querySelector('.relphi-zoom-row') && !!toolbar.querySelector('#rowZoom');
    if (final) toolbar.dataset.relphiCanonicalToolbarReady = 'true';
    else delete toolbar.dataset.relphiCanonicalToolbarReady;
    return final;
  }

  function invalidateToolbar() {
    const toolbar = panel()?.querySelector('.card-row-workspace>.card-row-workspace-toolbar');
    if (toolbar) delete toolbar.dataset.relphiCanonicalToolbarReady;
  }

  function repair() {
    queued = false;
    if (repairing) return;
    const root = panel();
    if (!root || root.hidden) return;
    repairing = true;
    try {
      ensureAfterCanvas(root);
      ensureWorkspaceTools(root);
      ensureOptions(root);
      const ready = finalToolbarReady(root);
      root.classList.toggle('relphi-drawing-board-ui-ready', ready);
      if (!ready) requestAnimationFrame(schedule);
    } finally {
      repairing = false;
    }
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(repair);
  }

  document.addEventListener('relphi:drawing-board-rendered', () => { invalidateToolbar(); schedule(); }, true);
  document.addEventListener('relphi:drawing-board-options-toggle', schedule);
  document.addEventListener('pointerup', schedule, true);
  new MutationObserver(records => {
    if (repairing) return;
    if (records.some(record => record.type === 'childList' && (record.addedNodes.length || record.removedNodes.length))) schedule();
  }).observe(document.documentElement, { childList:true, subtree:true });
  schedule();
})();