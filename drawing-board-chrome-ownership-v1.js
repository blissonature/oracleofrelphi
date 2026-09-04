// Drawing Board control ownership: keep non-canvas UI out of the pannable board surface.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiDrawingBoardChromeOwnershipV1) return;
  window.__relphiDrawingBoardChromeOwnershipV1 = true;

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
    const boardDrawer = root.querySelector('.card-row-drawing-board');
    const workspace = boardDrawer?.querySelector(':scope > .card-row-workspace') || root.querySelector('.card-row-workspace');
    const afterCanvas = root.querySelector('#drawing-board-after-canvas');
    if (!boardDrawer || !workspace || !afterCanvas) return;

    if (afterCanvas.parentElement !== boardDrawer || workspace.nextElementSibling !== afterCanvas) {
      workspace.insertAdjacentElement('afterend', afterCanvas);
    }
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

    // Printing duplicates the downloadable HTML path, which can already be printed to PDF.
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
    const cardColor = tools.querySelector('.relphi-card-color-slot');
    const boardImage = tools.querySelector('.relphi-board-image-slot');
    const boardColor = tools.querySelector('.relphi-board-color-slot');
    const boardReset = tools.querySelector('.relphi-board-reset-slot');

    ensureParent(root, 'rowSnapEnabled', snapRow);
    ensureParent(root, 'rowSnapGridMinus', snapRow);
    ensureParent(root, 'rowSnapGridValue', snapMeasure);
    ensureParent(root, 'rowSnapGridPlus', snapRow);
    ensureParent(root, 'rowRotationSnapEnabled', rotationRow);
    ensureParent(root, 'rowRotationSnapMinus', rotationRow);
    ensureParent(root, 'rowRotationSnapValue', rotationMeasure);
    ensureParent(root, 'rowRotationSnapPlus', rotationRow);
    ensureParent(root, 'resetCardRowLayout', snapRows);
    ensureParent(root, 'rowEnvelopeColor', cardColor);
    ensureParent(root, 'rowTableImageUpload', boardImage);
    ensureParent(root, 'rowTableColor', boardColor);
    ensureParent(root, 'rowTableImageReset', boardReset);
  }

  function ensureOptions(root) {
    const workspace = root.querySelector('.card-row-workspace');
    const drawer = root.querySelector('.relphi-reading-options-drawer');
    if (workspace && drawer && drawer.parentElement !== workspace) workspace.insertAdjacentElement('afterbegin', drawer);
    window.RelphiDrawingBoardEnsureTopActions?.(root);
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
      root.classList.add('relphi-drawing-board-ui-ready');
    } finally {
      repairing = false;
    }
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(repair);
  }

  function installStyle() {
    let style = document.getElementById('relphi-drawing-board-chrome-ownership-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'relphi-drawing-board-chrome-ownership-style';
    }
    style.textContent = `
      #shortListPanel #drawing-board-after-canvas,
      #shortListPanel #drawing-board-after-canvas *{
        translate:none!important;
      }
      #shortListPanel #drawing-board-after-canvas{
        position:relative!important;
        inset:auto!important;
        transform:none!important;
        z-index:auto!important;
      }
      #shortListPanel #drawing-board-title .drawing-board-post-body{
        display:grid!important;
        grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
        gap:1rem!important;
        align-items:start!important;
        width:100%!important;
      }
      #shortListPanel #drawing-board-title .relphi-reading-name-control{
        grid-column:1!important;
        width:100%!important;
        min-width:0!important;
        margin:0!important;
      }
      #shortListPanel #drawing-board-title .relphi-reading-stats{
        grid-column:2!important;
        width:100%!important;
        min-width:0!important;
        margin:0!important;
        align-self:start!important;
      }
      @media(max-width:700px){
        #shortListPanel #drawing-board-title .drawing-board-post-body{grid-template-columns:1fr!important}
        #shortListPanel #drawing-board-title .relphi-reading-name-control,
        #shortListPanel #drawing-board-title .relphi-reading-stats{grid-column:1!important}
      }
      #shortListPanel #drawing-board-post-export #snapshotCardRowArrangement,
      #shortListPanel #drawing-board-post-export #saveDrawingBoardSnapshotToDevice,
      #shortListPanel #drawing-board-post-export #downloadRowOptimizedHtml,
      #shortListPanel #drawing-board-post-export #downloadRowJson{
        position:static!important;
        inset:auto!important;
        transform:none!important;
        translate:none!important;
      }
      #shortListPanel .relphi-reading-options-drawer #snapshotCardRowArrangement,
      #shortListPanel .relphi-reading-options-drawer #saveDrawingBoardSnapshotToDevice,
      #shortListPanel .relphi-reading-options-drawer #downloadRowOptimizedHtml,
      #shortListPanel .relphi-reading-options-drawer #downloadRowJson{
        display:none!important;
      }
      #shortListPanel #printRowPdf{display:none!important}
      #shortListPanel .card-row-workspace>.relphi-reading-options-drawer{
        transform:none!important;
        translate:none!important;
      }

      /* Anchor the six Celtic body labels to the card's top edge instead of the
         changing item height. Placeholder -> card replacement can no longer move them. */
      #shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="0"]>.card-row-position-panel,
      #shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="1"]>.card-row-position-panel,
      #shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="2"]>.card-row-position-panel,
      #shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="3"]>.card-row-position-panel,
      #shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="4"]>.card-row-position-panel,
      #shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="5"]>.card-row-position-panel{
        top:0!important;
        bottom:auto!important;
        margin:0!important;
        transform:translateY(-100%)!important;
      }
      #shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item.relphi-celtic-crossing-rotated>.card-row-position-panel{
        top:0!important;
        bottom:auto!important;
        margin:0!important;
        transform:translateY(-100%)!important;
      }
    `;
    if (style.parentElement !== document.head || style !== document.head.lastElementChild) document.head.appendChild(style);
  }

  installStyle();
  document.addEventListener('relphi:drawing-board-rendered', schedule);
  document.addEventListener('relphi:drawing-board-center-view', schedule);
  document.addEventListener('relphi:drawing-board-options-toggle', schedule);
  document.addEventListener('pointermove', event => {
    if (event.buttons && event.target?.closest?.('#shortListPanel .card-row-workspace')) schedule();
  }, true);
  document.addEventListener('pointerup', schedule, true);
  document.addEventListener('touchend', schedule, true);
  document.addEventListener('wheel', event => {
    if (event.target?.closest?.('#shortListPanel .card-row-workspace')) schedule();
  }, { capture:true, passive:true });

  // Preview wrappers may inject additional styles after the inner Tarot document loads.
  // Keep the canonical ownership rules last so preview CSS cannot revive old geometry.
  new MutationObserver(records => {
    if (records.some(record => Array.from(record.addedNodes).some(node => node.nodeType === Node.ELEMENT_NODE && node.id !== 'relphi-drawing-board-chrome-ownership-style'))) {
      requestAnimationFrame(installStyle);
    }
  }).observe(document.head, { childList:true });

  const startObserver = () => {
    const root = panel();
    if (!root) return window.setTimeout(startObserver, 60);
    new MutationObserver(records => {
      if (repairing) return;
      if (records.some(record => record.type === 'childList' && (record.addedNodes.length || record.removedNodes.length))) schedule();
    }).observe(root, { childList:true, subtree:true });
    schedule();
  };
  startObserver();
})();