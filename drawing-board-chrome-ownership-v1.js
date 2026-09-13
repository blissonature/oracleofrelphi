// Drawing Board chrome owner. UI placement/readiness only: no spread geometry,
// no Celtic label rules, no card transforms.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiDrawingBoardChromeOwnershipV2) return;
  window.__relphiDrawingBoardChromeOwnershipV2 = true;
  window.__relphiDrawingBoardChromeOwnershipV1 = true; // compatibility filename

  const PANEL = '#shortListPanel';
  const EXPORT_IDS = ['snapshotCardRowArrangement','saveDrawingBoardSnapshotToDevice','downloadRowOptimizedHtml','downloadRowJson'];
  let scheduled = false;
  let repairing = false;
  const panel = () => document.querySelector(PANEL);

  function move(destination,node) {
    if (!destination || !node || destination.contains(node)) return;
    destination.appendChild(node);
  }
  function control(root,id) {
    const node = root?.querySelector('#' + id);
    if (!node) return null;
    const label = node.closest('label');
    return label && root.contains(label) ? label : node;
  }
  function clearPosition(node) {
    if (!node?.style) return;
    ['position','inset','left','right','top','bottom','translate','transform','z-index'].forEach(name => node.style.removeProperty(name));
  }

  function ensureAfterCanvas(root) {
    const drawer = root.querySelector('.card-row-drawing-board');
    const workspace = drawer?.querySelector(':scope > .card-row-workspace') || root.querySelector('.card-row-workspace');
    const after = root.querySelector('#drawing-board-after-canvas');
    if (!drawer || !workspace || !after) return;
    if (after.parentElement !== drawer || workspace.nextElementSibling !== after) workspace.insertAdjacentElement('afterend',after);
    clearPosition(after);
    const title = after.querySelector('#drawing-board-title .drawing-board-post-body');
    const notes = after.querySelector('#drawing-board-notes .drawing-board-post-body');
    const exports = after.querySelector('#drawing-board-post-export .board-options-body');
    const name = control(root,'rowName');
    const notesControl = control(root,'rowNotes');
    const stats = root.querySelector('.card-row-stats');
    if (name) name.classList.add('relphi-reading-name-control');
    if (stats) stats.classList.add('relphi-reading-stats');
    move(title,name); move(title,stats); move(notes,notesControl);
    root.querySelector('#printRowPdf')?.remove();
    EXPORT_IDS.forEach(id => { const node = root.querySelector('#' + id); move(exports,node); clearPosition(node); });
  }

  function ensureWorkspaceTools(root) {
    const workspace = root.querySelector('.card-row-workspace');
    const tools = workspace?.querySelector(':scope > .relphi-workspace-tools');
    if (!workspace || !tools) return;
    const rows = Array.from(tools.querySelectorAll('.relphi-snap-row'));
    const snap = rows[0], rotation = rows[1];
    const snapMeasure = snap?.querySelector('.relphi-snap-measure');
    const rotationMeasure = rotation?.querySelector('.relphi-snap-measure');
    const put = (id,destination) => { const node = root.querySelector('#' + id); if (node && destination && node.parentElement !== destination) destination.appendChild(node); };
    put('rowSnapEnabled',snap); put('rowSnapGridMinus',snap); put('rowSnapGridValue',snapMeasure); put('rowSnapGridPlus',snap);
    put('rowRotationSnapEnabled',rotation); put('rowRotationSnapMinus',rotation); put('rowRotationSnapValue',rotationMeasure); put('rowRotationSnapPlus',rotation);
    put('resetCardRowLayout',tools.querySelector('.relphi-snap-rows'));
    put('rowEnvelopeColor',tools.querySelector('.relphi-card-color-slot'));
    put('rowTableImageUpload',tools.querySelector('.relphi-board-image-slot'));
    put('rowTableColor',tools.querySelector('.relphi-board-color-slot'));
    put('rowTableImageReset',tools.querySelector('.relphi-board-reset-slot'));
  }

  function ensureOptions(root) {
    const workspace = root.querySelector('.card-row-workspace');
    const box = root.querySelector('.relphi-reading-options-drawer');
    if (workspace && box && box.parentElement !== workspace) workspace.insertAdjacentElement('afterbegin',box);
    window.RelphiDrawingBoardEnsureTopActions?.(root);
  }

  function currentUiAssembled(root) {
    const box = root.querySelector('.relphi-reading-options-drawer');
    const bar = box?.querySelector(':scope > .relphi-options-commit-bar[data-relphi-transaction-owner="v2"]');
    const spread = box?.querySelector('.board-setup-group--spread');
    const template = spread?.querySelector('#relphiSpreadTemplateSelect');
    const builder = spread?.querySelector('.relphi-label-builder');
    const zoomRow = root.querySelector('.card-row-workspace-toolbar .relphi-zoom-row');
    const fit = zoomRow?.querySelector('#zoomCardRowExtents[data-relphi-layout-controller="true"]');
    return !!(box && bar && spread && template && builder && zoomRow && fit);
  }

  function markStable(root) {
    if (root.classList.contains('relphi-drawing-board-ui-ready')) return;
    if (!currentUiAssembled(root)) return false;
    root.classList.add('relphi-drawing-board-ui-ready');
    document.documentElement.classList.add('relphi-drawing-board-ui-stable');
    return true;
  }

  function repair() {
    scheduled = false;
    if (repairing) return;
    const root = panel();
    if (!root || root.hidden) return;
    repairing = true;
    try {
      ensureAfterCanvas(root);
      ensureWorkspaceTools(root);
      ensureOptions(root);
      if (!root.classList.contains('relphi-drawing-board-ui-ready') && !markStable(root)) window.setTimeout(schedule,16);
    } finally { repairing = false; }
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(repair);
  }

  function installStyle() {
    if (document.getElementById('relphi-drawing-board-chrome-v2-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-drawing-board-chrome-v2-style';
    style.textContent = `
      #shortListPanel #drawing-board-after-canvas,#shortListPanel #drawing-board-after-canvas *{translate:none!important}
      #shortListPanel #drawing-board-after-canvas{position:relative!important;inset:auto!important;transform:none!important;z-index:auto!important}
      #shortListPanel #drawing-board-title .drawing-board-post-body{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:1rem!important;align-items:start!important;width:100%!important}
      #shortListPanel #drawing-board-title .relphi-reading-name-control{grid-column:1!important;width:100%!important;min-width:0!important;margin:0!important}
      #shortListPanel #drawing-board-title .relphi-reading-stats{grid-column:2!important;width:100%!important;min-width:0!important;margin:0!important}
      @media(max-width:700px){#shortListPanel #drawing-board-title .drawing-board-post-body{grid-template-columns:1fr!important}#shortListPanel #drawing-board-title .relphi-reading-name-control,#shortListPanel #drawing-board-title .relphi-reading-stats{grid-column:1!important}}
      #shortListPanel .relphi-reading-options-drawer #snapshotCardRowArrangement,#shortListPanel .relphi-reading-options-drawer #saveDrawingBoardSnapshotToDevice,#shortListPanel .relphi-reading-options-drawer #downloadRowOptimizedHtml,#shortListPanel .relphi-reading-options-drawer #downloadRowJson{display:none!important}
      #shortListPanel #printRowPdf{display:none!important}
      #shortListPanel .card-row-workspace>.relphi-reading-options-drawer{transform:none!important;translate:none!important}

      /* Once the canonical UI has appeared, a board re-render may replace inner
         nodes but may never reveal their raw construction states. */
      html.relphi-drawing-board-ui-stable #shortListPanel .card-row-more-options:not(.relphi-reading-options-drawer){visibility:hidden!important;opacity:0!important;pointer-events:none!important}
      html.relphi-drawing-board-ui-stable #shortListPanel .relphi-reading-options-drawer .card-row-position-label{display:none!important}
      html.relphi-drawing-board-ui-stable #shortListPanel .card-row-workspace-toolbar:not(:has(.relphi-zoom-row)){visibility:hidden!important;opacity:0!important;pointer-events:none!important}
      html.relphi-drawing-board-ui-stable #shortListPanel .card-row-workspace-toolbar:has(.relphi-zoom-row){visibility:visible!important;opacity:1!important}
    `;
    document.head.appendChild(style);
  }

  installStyle();
  document.addEventListener('relphi:drawing-board-rendered',schedule);
  document.addEventListener('relphi:drawing-board-options-toggle',schedule);
  new MutationObserver(records => {
    if (repairing) return;
    if (records.some(record => record.type === 'childList' && (record.addedNodes.length || record.removedNodes.length))) schedule();
  }).observe(document.documentElement,{childList:true,subtree:true});
  schedule();
})();
