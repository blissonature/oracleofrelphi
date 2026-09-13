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
  const CELTIC_FALLBACK_STICKER_H = 52;
  const CELTIC_STICKER_CLEARANCE = 8;
  const MOBILE_GUTTER = 10;
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
  function afterFrames(count, fn) {
    if (count <= 0) return fn();
    requestAnimationFrame(() => afterFrames(count - 1, fn));
  }

  function ensureAfterCanvas(root) {
    const boardDrawer = root.querySelector('.card-row-drawing-board');
    const workspace = boardDrawer?.querySelector(':scope > .card-row-workspace') || root.querySelector('.card-row-workspace');
    const afterCanvas = root.querySelector('#drawing-board-after-canvas');
    if (!boardDrawer || !workspace || !afterCanvas) return;
    if (afterCanvas.parentElement !== boardDrawer || workspace.nextElementSibling !== afterCanvas) workspace.insertAdjacentElement('afterend', afterCanvas);
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

  function mobileCelticState(root) {
    if (!root || !window.matchMedia?.('(max-width:700px)')?.matches) return null;
    try {
      const state = window.RelphiDrawingBoardPrefabsBridge?.getState?.() || null;
      return state?.activeLayout?.id === CELTIC_LAYOUT_ID ? state : null;
    } catch (_) { return null; }
  }
  function celticItems(root) { return Array.from(root?.querySelectorAll('.card-row-board > .card-row-item') || []).slice(0, 10); }
  function clearGeometryTranslations(items) {
    items.forEach(item => {
      item.style.removeProperty('translate');
      delete item.dataset.relphiMiddleTranslateX;
      delete item.dataset.relphiStaffTranslateX;
    });
  }

  function mobileGeometry(root, state, offsetX = 0, offsetY = 0) {
    const liveBoard = root.querySelector('.card-row-board');
    const items = celticItems(root);
    if (!liveBoard || items.length < 10 || !state) return null;
    clearGeometryTranslations(items);
    const firstFace = items[0]?.querySelector('.card-row-card-wrap,.card-row-drop-card');
    const width = firstFace?.offsetWidth || CELTIC_FALLBACK_W;
    const height = firstFace?.offsetHeight || CELTIC_FALLBACK_H;
    const visualWidth = width * CELTIC_SCALE;
    const visualHeight = height * CELTIC_SCALE;
    const stickerHeight = Math.max(CELTIC_FALLBACK_STICKER_H, ...items.map(item => item.querySelector(':scope > .card-row-position-panel')?.offsetHeight || 0));
    const stickerVisual = stickerHeight * CELTIC_SCALE;
    const centerAxis = CELTIC_CENTER_LEFT + width / 2;
    const crossingRevealed = !!items[1]?.querySelector('[data-row-card]');
    const open = !crossingRevealed || !!state.centerOpen;
    const crownY = CELTIC_CENTER_TOP - visualHeight - stickerVisual - CELTIC_STICKER_CLEARANCE;
    const beneathY = CELTIC_CENTER_TOP + visualHeight + stickerVisual + CELTIC_STICKER_CLEARANCE;
    let coveringX = CELTIC_CENTER_LEFT;
    let crossingX = CELTIC_CENTER_LEFT;
    let centralLeft;
    let centralRight;
    const uprightVisualLeft = logicalLeft => logicalLeft + (width - visualWidth) / 2;
    const uprightVisualRight = logicalLeft => uprightVisualLeft(logicalLeft) + visualWidth;
    const xForVisualLeft = visualLeft => visualLeft - (width - visualWidth) / 2;
    const xForVisualRight = visualRight => visualRight - (width + visualWidth) / 2;
    if (open) {
      coveringX = CELTIC_CENTER_LEFT - visualWidth / 2 - CELTIC_STICKER_CLEARANCE / 2;
      crossingX = CELTIC_CENTER_LEFT + visualWidth / 2 + CELTIC_STICKER_CLEARANCE / 2;
      centralLeft = uprightVisualLeft(coveringX);
      centralRight = uprightVisualRight(crossingX);
    } else {
      centralLeft = centerAxis - visualHeight / 2;
      centralRight = centerAxis + visualHeight / 2;
    }
    const behindX = xForVisualRight(centralLeft - CELTIC_STICKER_CLEARANCE);
    const beforeX = xForVisualLeft(centralRight + CELTIC_STICKER_CLEARANCE);
    const staffStep = visualHeight + stickerVisual + CELTIC_STICKER_CLEARANCE;
    const staffTop = stickerVisual + CELTIC_STICKER_CLEARANCE;
    const geometry = [
      [coveringX, CELTIC_CENTER_TOP, 0, 20],
      [crossingX, CELTIC_CENTER_TOP, crossingRevealed && !open ? 90 : 0, 30],
      [CELTIC_CENTER_LEFT, crownY, 0, 4],
      [CELTIC_CENTER_LEFT, beneathY, 0, 4],
      [behindX, CELTIC_CENTER_TOP, 0, 4],
      [beforeX, CELTIC_CENTER_TOP, 0, 4],
      [CELTIC_STAFF_LEFT, staffTop + 3 * staffStep, 0, 4],
      [CELTIC_STAFF_LEFT, staffTop + 2 * staffStep, 0, 4],
      [CELTIC_STAFF_LEFT, staffTop + staffStep, 0, 4],
      [CELTIC_STAFF_LEFT, staffTop, 0, 4]
    ];
    items.forEach((item, index) => {
      const values = geometry[index];
      item.style.setProperty('position', 'absolute', 'important');
      item.style.setProperty('left', (values[0] + offsetX).toFixed(2) + 'px', 'important');
      item.style.setProperty('top', (values[1] + offsetY).toFixed(2) + 'px', 'important');
      item.style.setProperty('z-index', String(values[3]), 'important');
      item.style.setProperty('--row-card-scale', String(CELTIC_SCALE));
      item.style.setProperty('--row-card-rotation', values[2] + 'deg');
      item.classList.toggle('relphi-celtic-crossing-rotated', index === 1 && crossingRevealed && !open);
    });
    liveBoard.style.setProperty('min-height', '760px', 'important');
    return { items, open, crossingRevealed };
  }

  function visualBounds(root) {
    const nodes = [];
    celticItems(root).forEach(item => {
      const face = item.querySelector('.card-row-card-wrap,.card-row-drop-card');
      const sticker = item.querySelector(':scope > .card-row-position-panel');
      if (face) nodes.push(face);
      if (sticker) nodes.push(sticker);
    });
    const rects = nodes.map(node => node.getBoundingClientRect()).filter(rect => rect.width > 0 && rect.height > 0);
    if (!rects.length) return null;
    return { left:Math.min(...rects.map(rect => rect.left)), right:Math.max(...rects.map(rect => rect.right)), top:Math.min(...rects.map(rect => rect.top)), bottom:Math.max(...rects.map(rect => rect.bottom)) };
  }
  function boardScale(liveBoard) {
    const rect = liveBoard?.getBoundingClientRect();
    const sx = liveBoard?.offsetWidth ? rect.width / liveBoard.offsetWidth : 1;
    const sy = liveBoard?.offsetHeight ? rect.height / liveBoard.offsetHeight : 1;
    return { x:Number.isFinite(sx) && Math.abs(sx) > .001 ? sx : 1, y:Number.isFinite(sy) && Math.abs(sy) > .001 ? sy : 1 };
  }

  function fitMobileCeltic(root, state, signature) {
    if (!root || !state || root.dataset.relphiMobileCelticFitting !== signature) return;
    const workspace = root.querySelector('.card-row-workspace');
    const liveBoard = root.querySelector('.card-row-board');
    const zoom = root.querySelector('#rowZoom');
    if (!workspace || !liveBoard || !zoom) return finishMobileCeltic(root, signature, 0, 0);
    mobileGeometry(root, state, 0, 0);
    const bounds = visualBounds(root);
    const workspaceRect = workspace.getBoundingClientRect();
    if (!bounds || !workspaceRect.width || !workspaceRect.height) return finishMobileCeltic(root, signature, 0, 0);
    const targetWidth = Math.max(1, workspaceRect.width - MOBILE_GUTTER * 2);
    const targetHeight = Math.max(1, workspaceRect.height - MOBILE_GUTTER * 2);
    const contentWidth = Math.max(1, bounds.right - bounds.left);
    const contentHeight = Math.max(1, bounds.bottom - bounds.top);
    const ratio = Math.min(targetWidth / contentWidth, targetHeight / contentHeight) * .985;
    const currentZoom = Number(zoom.value) || 1;
    const inputMin = Number(zoom.min);
    const inputMax = Number(zoom.max);
    const minZoom = Number.isFinite(inputMin) && inputMin > 0 ? inputMin : .35;
    const maxZoom = Number.isFinite(inputMax) && inputMax > 0 ? inputMax : 2.4;
    const nextZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom * ratio));
    if (Math.abs(nextZoom - currentZoom) > .005) {
      zoom.value = String(nextZoom);
      zoom.dispatchEvent(new Event('input', { bubbles:true }));
      zoom.dispatchEvent(new Event('change', { bubbles:true }));
    }
    afterFrames(3, () => {
      const currentRoot = panel();
      const currentState = mobileCelticState(currentRoot);
      if (!currentRoot || !currentState || currentRoot.dataset.relphiMobileCelticFitting !== signature) return;
      const currentWorkspace = currentRoot.querySelector('.card-row-workspace');
      const currentBoard = currentRoot.querySelector('.card-row-board');
      if (!currentWorkspace || !currentBoard) return;
      mobileGeometry(currentRoot, currentState, 0, 0);
      const currentBounds = visualBounds(currentRoot);
      const currentWorkspaceRect = currentWorkspace.getBoundingClientRect();
      if (!currentBounds) return finishMobileCeltic(currentRoot, signature, 0, 0);
      const scale = boardScale(currentBoard);
      const targetLeft = currentWorkspaceRect.left + MOBILE_GUTTER;
      const targetBottom = currentWorkspaceRect.bottom - MOBILE_GUTTER;
      const dx = (targetLeft - currentBounds.left) / scale.x;
      const dy = (targetBottom - currentBounds.bottom) / scale.y;
      finishMobileCeltic(currentRoot, signature, dx, dy);
    });
  }

  function finishMobileCeltic(root, signature, offsetX, offsetY) {
    const state = mobileCelticState(root);
    if (!root || !state || root.dataset.relphiMobileCelticFitting !== signature) return;
    mobileGeometry(root, state, offsetX, offsetY);
    root.dataset.relphiMobileCelticOffsetX = String(offsetX);
    root.dataset.relphiMobileCelticOffsetY = String(offsetY);
    root.dataset.relphiMobileCelticFit = signature;
    delete root.dataset.relphiMobileCelticFitting;
    afterFrames(1, () => {
      if (!root.isConnected || root.dataset.relphiMobileCelticFit !== signature) return;
      refreshStickerOverflow(root);
      root.classList.remove('relphi-mobile-celtic-pending');
      root.classList.add('relphi-mobile-celtic-ready');
    });
  }

  function mobileCelticGeometry(root) {
    const state = mobileCelticState(root);
    if (!state) {
      root?.classList.remove('relphi-mobile-celtic', 'relphi-mobile-celtic-pending', 'relphi-mobile-celtic-ready');
      if (root) {
        delete root.dataset.relphiMobileCelticFit;
        delete root.dataset.relphiMobileCelticFitting;
        delete root.dataset.relphiMobileCelticOffsetX;
        delete root.dataset.relphiMobileCelticOffsetY;
      }
      return true;
    }
    root.classList.add('relphi-mobile-celtic');
    const items = celticItems(root);
    const workspace = root.querySelector('.card-row-workspace');
    if (items.length < 10 || !workspace) {
      root.classList.add('relphi-mobile-celtic-pending');
      root.classList.remove('relphi-mobile-celtic-ready');
      return false;
    }
    const crossingRevealed = !!items[1]?.querySelector('[data-row-card]');
    const open = !crossingRevealed || !!state.centerOpen;
    const viewportWidth = Math.round(window.visualViewport?.width || document.documentElement.clientWidth || window.innerWidth || 0);
    const workspaceHeight = Math.round(workspace.getBoundingClientRect().height || 0);
    const signature = [viewportWidth, workspaceHeight, open ? 1 : 0, crossingRevealed ? 1 : 0, items.length].join(':');
    if (root.dataset.relphiMobileCelticFit === signature && root.classList.contains('relphi-mobile-celtic-ready')) {
      const x = Number(root.dataset.relphiMobileCelticOffsetX || 0);
      const y = Number(root.dataset.relphiMobileCelticOffsetY || 0);
      mobileGeometry(root, state, x, y);
      refreshStickerOverflow(root);
      return true;
    }
    root.classList.add('relphi-mobile-celtic-pending');
    root.classList.remove('relphi-mobile-celtic-ready');
    mobileGeometry(root, state, 0, 0);
    if (root.dataset.relphiMobileCelticFitting !== signature) {
      root.dataset.relphiMobileCelticFitting = signature;
      afterFrames(3, () => fitMobileCeltic(root, mobileCelticState(root), signature));
    }
    return false;
  }

  function stickerFullText(sticker) { return String(sticker?.textContent || '').replace(/\s+/g, ' ').trim(); }
  function stickerOverflows(sticker) {
    if (!sticker || !sticker.offsetWidth || !sticker.offsetHeight) return false;
    const clone = sticker.cloneNode(true);
    clone.removeAttribute('id'); clone.removeAttribute('tabindex');
    clone.style.setProperty('position', 'fixed', 'important');
    clone.style.setProperty('left', '-10000px', 'important');
    clone.style.setProperty('top', '0', 'important');
    clone.style.setProperty('width', sticker.offsetWidth + 'px', 'important');
    clone.style.setProperty('height', 'auto', 'important');
    clone.style.setProperty('min-height', '0', 'important');
    clone.style.setProperty('max-height', 'none', 'important');
    clone.style.setProperty('transform', 'none', 'important');
    clone.style.setProperty('display', 'block', 'important');
    clone.style.setProperty('overflow', 'visible', 'important');
    clone.style.setProperty('-webkit-line-clamp', 'unset', 'important');
    clone.style.setProperty('visibility', 'hidden', 'important');
    document.body.appendChild(clone);
    const overflow = clone.scrollHeight > sticker.offsetHeight + 1;
    clone.remove();
    return overflow;
  }
  function refreshStickerOverflow(root) {
    if (!root?.classList.contains('relphi-mobile-celtic')) return;
    celticItems(root).forEach(item => {
      const sticker = item.querySelector(':scope > .card-row-position-panel');
      if (!sticker) return;
      const overflow = stickerOverflows(sticker);
      sticker.classList.toggle('relphi-position-label-truncated', overflow);
      if (overflow) {
        sticker.dataset.relphiFullLabel = stickerFullText(sticker);
        sticker.setAttribute('tabindex', '0');
        sticker.setAttribute('role', 'button');
        sticker.setAttribute('aria-haspopup', 'dialog');
        sticker.setAttribute('aria-label', 'Show full position label: ' + sticker.dataset.relphiFullLabel);
      } else {
        delete sticker.dataset.relphiFullLabel;
        sticker.removeAttribute('tabindex'); sticker.removeAttribute('role'); sticker.removeAttribute('aria-haspopup'); sticker.removeAttribute('aria-label');
      }
    });
  }
  function closeLabelPopover() { document.querySelector('.relphi-position-label-popover')?.remove(); }
  function openLabelPopover(sticker) {
    const text = sticker?.dataset.relphiFullLabel || stickerFullText(sticker);
    if (!text) return;
    closeLabelPopover();
    const popover = document.createElement('div');
    popover.className = 'relphi-position-label-popover';
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-label', 'Full position label');
    const copy = document.createElement('div'); copy.className = 'relphi-position-label-popover-copy'; copy.textContent = text;
    const close = document.createElement('button'); close.type = 'button'; close.className = 'relphi-position-label-popover-close'; close.textContent = 'Close';
    close.addEventListener('click', closeLabelPopover, { once:true });
    popover.append(copy, close); document.body.appendChild(popover); close.focus({ preventScroll:true });
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
    } finally { repairing = false; }
  }
  function schedule() {
    if (queued) return;
    queued = true;
    afterFrames(3, repair);
  }

  function installStyle() {
    let style = document.getElementById('relphi-drawing-board-chrome-ownership-style');
    if (!style) { style = document.createElement('style'); style.id = 'relphi-drawing-board-chrome-ownership-style'; }
    style.textContent = `
      #shortListPanel #drawing-board-after-canvas,#shortListPanel #drawing-board-after-canvas *{translate:none!important}
      #shortListPanel #drawing-board-after-canvas{position:relative!important;inset:auto!important;transform:none!important;z-index:auto!important}
      #shortListPanel #drawing-board-title .drawing-board-post-body{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:1rem!important;align-items:start!important;width:100%!important}
      #shortListPanel #drawing-board-title .relphi-reading-name-control{grid-column:1!important;width:100%!important;min-width:0!important;margin:0!important}
      #shortListPanel #drawing-board-title .relphi-reading-stats{grid-column:2!important;width:100%!important;min-width:0!important;margin:0!important;align-self:start!important}
      @media(max-width:700px){
        #shortListPanel #drawing-board-title .drawing-board-post-body{grid-template-columns:1fr!important}
        #shortListPanel #drawing-board-title .relphi-reading-name-control,#shortListPanel #drawing-board-title .relphi-reading-stats{grid-column:1!important}
        html body #shortListPanel{width:100%!important;max-width:100vw!important;min-width:0!important;overflow-x:hidden!important;box-sizing:border-box!important}
        html body #shortListPanel .card-row-drawing-board{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
        html body #shortListPanel .card-row-workspace{width:calc(100% - 24px)!important;max-width:calc(100% - 24px)!important;min-width:0!important;margin-left:12px!important;margin-right:12px!important;box-sizing:border-box!important;overflow:hidden!important}
        html body #shortListPanel.relphi-mobile-celtic .card-row-workspace{height:clamp(420px,68svh,620px)!important;min-height:clamp(420px,68svh,620px)!important;max-height:clamp(420px,68svh,620px)!important}
        html body #shortListPanel.relphi-mobile-celtic-pending .card-row-workspace{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
        html body #shortListPanel.relphi-mobile-celtic-ready .card-row-workspace{visibility:visible!important;opacity:1!important}
        html body #shortListPanel.relphi-mobile-celtic .card-row-board>.card-row-item>.card-row-position-panel{box-sizing:border-box!important;left:0!important;right:auto!important;top:0!important;bottom:auto!important;width:100%!important;min-width:100%!important;max-width:100%!important;height:3.35rem!important;min-height:3.35rem!important;max-height:3.35rem!important;margin:0!important;padding:.32rem .38rem!important;transform:translateY(-100%)!important;font-size:clamp(.64rem,2.35vw,.78rem)!important;line-height:1.04!important;white-space:normal!important;text-align:center!important;overflow:hidden!important;text-overflow:ellipsis!important;display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:3!important;line-clamp:3!important}
        html body #shortListPanel.relphi-mobile-celtic .card-row-board>.card-row-item>.card-row-position-panel.relphi-position-label-truncated{cursor:pointer!important}
      }
      #shortListPanel #drawing-board-post-export #snapshotCardRowArrangement,#shortListPanel #drawing-board-post-export #saveDrawingBoardSnapshotToDevice,#shortListPanel #drawing-board-post-export #downloadRowOptimizedHtml,#shortListPanel #drawing-board-post-export #downloadRowJson{position:static!important;inset:auto!important;transform:none!important;translate:none!important}
      #shortListPanel .relphi-reading-options-drawer #snapshotCardRowArrangement,#shortListPanel .relphi-reading-options-drawer #saveDrawingBoardSnapshotToDevice,#shortListPanel .relphi-reading-options-drawer #downloadRowOptimizedHtml,#shortListPanel .relphi-reading-options-drawer #downloadRowJson{display:none!important}
      #shortListPanel #printRowPdf{display:none!important}
      #shortListPanel .card-row-workspace>.relphi-reading-options-drawer{transform:none!important;translate:none!important}
      #shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="0"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="1"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="2"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="3"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="4"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="5"]>.card-row-position-panel{top:0!important;bottom:auto!important;margin:0!important;transform:translateY(-100%)!important}
      #shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item.relphi-celtic-crossing-rotated>.card-row-position-panel{top:0!important;bottom:auto!important;margin:0!important;transform:translateY(-100%)!important}
      .relphi-position-label-popover{position:fixed!important;left:50%!important;bottom:max(1rem,env(safe-area-inset-bottom))!important;transform:translateX(-50%)!important;z-index:100000!important;width:min(88vw,24rem)!important;box-sizing:border-box!important;padding:.85rem!important;border:1px solid rgba(53,36,31,.22)!important;border-radius:.8rem!important;background:#fffaf0!important;color:#2f211d!important;box-shadow:0 .75rem 2rem rgba(0,0,0,.24)!important;font:inherit!important}
      .relphi-position-label-popover-copy{font-weight:700!important;line-height:1.35!important;white-space:normal!important;overflow-wrap:anywhere!important}
      .relphi-position-label-popover-close{display:block!important;margin:.7rem 0 0 auto!important}
    `;
    if (style.parentElement !== document.head || style !== document.head.lastElementChild) document.head.appendChild(style);
  }

  installStyle();
  document.addEventListener('relphi:drawing-board-rendered', schedule);
  document.addEventListener('relphi:drawing-board-center-view', schedule);
  document.addEventListener('relphi:drawing-board-options-toggle', schedule);
  document.addEventListener('pointermove', event => { if (event.buttons && event.target?.closest?.('#shortListPanel .card-row-workspace')) schedule(); }, true);
  document.addEventListener('pointerup', schedule, true);
  document.addEventListener('touchend', schedule, true);
  document.addEventListener('wheel', event => { if (event.target?.closest?.('#shortListPanel .card-row-workspace')) schedule(); }, { capture:true, passive:true });
  document.addEventListener('click', event => {
    const sticker = event.target?.closest?.('#shortListPanel.relphi-mobile-celtic .card-row-position-panel.relphi-position-label-truncated');
    if (sticker) { event.preventDefault(); event.stopPropagation(); openLabelPopover(sticker); return; }
    if (!event.target?.closest?.('.relphi-position-label-popover')) closeLabelPopover();
  }, true);
  document.addEventListener('keydown', event => {
    const sticker = event.target?.closest?.('#shortListPanel.relphi-mobile-celtic .card-row-position-panel.relphi-position-label-truncated');
    if (sticker && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); openLabelPopover(sticker); }
    else if (event.key === 'Escape') closeLabelPopover();
  }, true);

  const resetMobileFit = () => {
    const root = panel();
    if (root) {
      delete root.dataset.relphiMobileCelticFit;
      delete root.dataset.relphiMobileCelticFitting;
      delete root.dataset.relphiMobileCelticOffsetX;
      delete root.dataset.relphiMobileCelticOffsetY;
      root.classList.remove('relphi-mobile-celtic-ready');
    }
    schedule();
  };
  window.addEventListener('resize', resetMobileFit, { passive:true });
  window.visualViewport?.addEventListener('resize', resetMobileFit, { passive:true });
  new MutationObserver(records => {
    if (records.some(record => Array.from(record.addedNodes).some(node => node.nodeType === Node.ELEMENT_NODE && node.id !== 'relphi-drawing-board-chrome-ownership-style'))) requestAnimationFrame(installStyle);
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
