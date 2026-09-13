// Drawing Board control ownership: keep non-canvas UI out of the pannable board surface.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiDrawingBoardChromeOwnershipV1) return;
  window.__relphiDrawingBoardChromeOwnershipV1 = true;

  const PANEL = '#shortListPanel';
  const EXPORT_IDS = ['snapshotCardRowArrangement','saveDrawingBoardSnapshotToDevice','downloadRowOptimizedHtml','downloadRowJson'];
  const CELTIC_LAYOUT_ID = 'celtic-cross-10';
  const CELTIC_SCALE = .80;
  const CELTIC_CENTER_LEFT = 250;
  const CELTIC_CENTER_TOP = 340;
  const CELTIC_STAFF_LEFT = 620;
  const CELTIC_FALLBACK_W = 174;
  const CELTIC_FALLBACK_H = 301;
  const CELTIC_FALLBACK_STICKER_H = 40;
  const CELTIC_STICKER_CLEARANCE = 2;
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

  function mobileCelticGeometry(root) {
    if (!window.matchMedia?.('(max-width:700px)')?.matches) {
      delete root?.dataset.relphiMobileCelticFit;
      return;
    }
    let state = null;
    try { state = window.RelphiDrawingBoardPrefabsBridge?.getState?.() || null; } catch (_) {}
    if (!root || state?.activeLayout?.id !== CELTIC_LAYOUT_ID) return;

    const liveBoard = root.querySelector('.card-row-board');
    const workspace = root.querySelector('.card-row-workspace');
    const items = Array.from(liveBoard?.querySelectorAll(':scope > .card-row-item') || []);
    if (!liveBoard || !workspace || items.length < 10) return;

    const firstFace = items[0]?.querySelector('.card-row-card-wrap,.card-row-drop-card');
    const width = firstFace?.offsetWidth || CELTIC_FALLBACK_W;
    const height = firstFace?.offsetHeight || CELTIC_FALLBACK_H;
    const visualWidth = width * CELTIC_SCALE;
    const visualHeight = height * CELTIC_SCALE;
    const axis = CELTIC_CENTER_LEFT + width / 2;
    const stickerGap = index => {
      const sticker = items[index]?.querySelector(':scope > .card-row-position-panel');
      return ((sticker?.offsetHeight || CELTIC_FALLBACK_STICKER_H) + CELTIC_STICKER_CLEARANCE) * CELTIC_SCALE;
    };
    const open = !!state.centerOpen;
    const coveringGap = stickerGap(0);
    const crossingGap = stickerGap(1);
    const beneathGap = stickerGap(3);
    const crownY = CELTIC_CENTER_TOP - visualHeight - coveringGap;
    const beneathY = CELTIC_CENTER_TOP + visualHeight + beneathGap;
    let coveringX = CELTIC_CENTER_LEFT;
    let crossingX = CELTIC_CENTER_LEFT;
    let centralLeft;
    let centralRight;
    const uprightVisualLeft = logicalLeft => logicalLeft + (width - visualWidth) / 2;
    const uprightVisualRight = logicalLeft => uprightVisualLeft(logicalLeft) + visualWidth;
    const xForVisualLeft = visualLeft => visualLeft - (width - visualWidth) / 2;
    const xForVisualRight = visualRight => visualRight - (width + visualWidth) / 2;

    if (open) {
      coveringX = CELTIC_CENTER_LEFT - visualWidth / 2;
      crossingX = CELTIC_CENTER_LEFT + visualWidth / 2;
      centralLeft = uprightVisualLeft(coveringX);
      centralRight = uprightVisualRight(crossingX);
    } else {
      centralLeft = axis - visualHeight / 2;
      centralRight = axis + visualHeight / 2;
    }
    const behindX = xForVisualRight(centralLeft);
    const beforeX = xForVisualLeft(centralRight + (open ? 0 : crossingGap));
    const staffTop = 8;
    const geometry = [
      [coveringX, CELTIC_CENTER_TOP, 0, 20],
      [crossingX, CELTIC_CENTER_TOP, open ? 0 : 90, 30],
      [CELTIC_CENTER_LEFT, crownY, 0, 4],
      [CELTIC_CENTER_LEFT, beneathY, 0, 4],
      [behindX, CELTIC_CENTER_TOP, 0, 4],
      [beforeX, CELTIC_CENTER_TOP, 0, 4],
      [CELTIC_STAFF_LEFT, staffTop + 3 * visualHeight, 0, 4],
      [CELTIC_STAFF_LEFT, staffTop + 2 * visualHeight, 0, 4],
      [CELTIC_STAFF_LEFT, staffTop + visualHeight, 0, 4],
      [CELTIC_STAFF_LEFT, staffTop, 0, 4]
    ];

    items.slice(0, 10).forEach((item, index) => {
      const values = geometry[index];
      item.style.setProperty('position', 'absolute', 'important');
      item.style.setProperty('left', values[0].toFixed(2) + 'px', 'important');
      item.style.setProperty('top', values[1].toFixed(2) + 'px', 'important');
      item.style.setProperty('z-index', String(values[3]), 'important');
      item.style.setProperty('--row-card-scale', String(CELTIC_SCALE));
      item.style.setProperty('--row-card-rotation', values[2] + 'deg');
      item.classList.toggle('relphi-celtic-crossing-rotated', index === 1 && !open);
    });
    liveBoard.style.setProperty('min-height', '760px', 'important');

    const viewportWidth = Math.round(window.visualViewport?.width || document.documentElement.clientWidth || window.innerWidth || 0);
    const signature = [viewportWidth, open ? 1 : 0, items.length].join(':');
    if (root.dataset.relphiMobileCelticFit === signature) return;
    root.dataset.relphiMobileCelticFit = signature;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const current = panel();
      if (!current || current.dataset.relphiMobileCelticFit !== signature) return;
      current.querySelector('#zoomCardRowExtents')?.click();
    }));
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
      mobileCelticGeometry(root);
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
        html body #shortListPanel{
          width:100%!important;
          max-width:100vw!important;
          min-width:0!important;
          overflow-x:hidden!important;
          box-sizing:border-box!important;
        }
        html body #shortListPanel .card-row-drawing-board{
          width:100%!important;
          max-width:100%!important;
          min-width:0!important;
          box-sizing:border-box!important;
        }
        html body #shortListPanel .card-row-workspace{
          width:calc(100% - 24px)!important;
          max-width:calc(100% - 24px)!important;
          min-width:0!important;
          margin-left:12px!important;
          margin-right:12px!important;
          box-sizing:border-box!important;
          overflow-x:hidden!important;
        }
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
  window.addEventListener('resize', () => {
    const root = panel();
    if (root) delete root.dataset.relphiMobileCelticFit;
    schedule();
  }, { passive:true });
  window.visualViewport?.addEventListener('resize', () => {
    const root = panel();
    if (root) delete root.dataset.relphiMobileCelticFit;
    schedule();
  }, { passive:true });

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