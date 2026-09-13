// Mobile Drawing Board chrome + Celtic Cross geometry owner.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiDrawingBoardMobileCelticV2) return;
  window.__relphiDrawingBoardMobileCelticV2 = true;
  window.__relphiDrawingBoardChromeOwnershipV1 = true;

  const PANEL = '#shortListPanel';
  const CELTIC_LAYOUT_ID = 'celtic-cross-10';
  const EXPORT_IDS = ['snapshotCardRowArrangement','saveDrawingBoardSnapshotToDevice','downloadRowOptimizedHtml','downloadRowJson'];
  const CARD_SCALE = .80;
  const BASE_CARD_W = 174;
  const BASE_CARD_H = 301;
  const BASE_LABEL_H = 52;
  const LABEL_CLEARANCE = 8;
  const GUTTER = 10;
  const CENTER_LEFT = 235;
  const CENTER_TOP = 330;
  const STAFF_LEFT = 650;
  const BODY_WIDTH_FOR_ZOOM = 535;
  let queued = false;
  let repairing = false;
  let settingZoom = false;

  function panel() { return document.querySelector(PANEL); }
  function mobile() { return !!window.matchMedia?.('(max-width:700px)')?.matches; }
  function state() {
    try { return window.RelphiDrawingBoardPrefabsBridge?.getState?.() || null; }
    catch (_) { return null; }
  }
  function celticState() {
    const value = state();
    return value?.activeLayout?.id === CELTIC_LAYOUT_ID ? value : null;
  }
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
  function ensureParent(root, id, destination) {
    const node = root?.querySelector('#' + id);
    if (!node || !destination || node.parentElement === destination) return;
    destination.appendChild(node);
  }
  function clearDraggedPosition(node) {
    if (!node?.style) return;
    ['position','inset','left','right','top','bottom','translate','transform','z-index'].forEach(name => node.style.removeProperty(name));
  }
  function afterFrames(count, fn) {
    if (count <= 0) return fn();
    requestAnimationFrame(() => afterFrames(count - 1, fn));
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

  function items(root) {
    return Array.from(root?.querySelectorAll('.card-row-board > .card-row-item') || []).slice(0, 10);
  }
  function face(item) { return item?.querySelector('.card-row-card-wrap,.card-row-drop-card') || null; }
  function clearLegacyTranslations(list) {
    list.forEach(item => {
      item.style.removeProperty('translate');
      delete item.dataset.relphiMiddleTranslateX;
      delete item.dataset.relphiStaffTranslateX;
    });
  }

  function geometry(root, layoutState, offsetX = 0, offsetY = 0) {
    const board = root.querySelector('.card-row-board');
    const list = items(root);
    if (!board || !layoutState || list.length < 10) return null;
    clearLegacyTranslations(list);

    const first = face(list[0]);
    const width = first?.offsetWidth || BASE_CARD_W;
    const height = first?.offsetHeight || BASE_CARD_H;
    const visualW = width * CARD_SCALE;
    const visualH = height * CARD_SCALE;
    const labelH = Math.max(BASE_LABEL_H, ...list.map(item => item.querySelector(':scope > .card-row-position-panel')?.offsetHeight || 0));
    const visualLabelH = labelH * CARD_SCALE;
    const crossingRevealed = !!list[1]?.querySelector('[data-row-card]');
    const open = !crossingRevealed || !!layoutState.centerOpen;
    const axis = CENTER_LEFT + width / 2;

    const uprightLeft = x => x + (width - visualW) / 2;
    const uprightRight = x => uprightLeft(x) + visualW;
    const xForLeft = left => left - (width - visualW) / 2;
    const xForRight = right => right - (width + visualW) / 2;

    let coverX = CENTER_LEFT;
    let crossX = CENTER_LEFT;
    let middleLeft;
    let middleRight;
    if (open) {
      coverX = CENTER_LEFT - visualW / 2 - LABEL_CLEARANCE / 2;
      crossX = CENTER_LEFT + visualW / 2 + LABEL_CLEARANCE / 2;
      middleLeft = uprightLeft(coverX);
      middleRight = uprightRight(crossX);
    } else {
      middleLeft = axis - visualH / 2;
      middleRight = axis + visualH / 2;
    }

    const crownY = CENTER_TOP - visualH - visualLabelH - LABEL_CLEARANCE;
    const beneathY = CENTER_TOP + visualH + visualLabelH + LABEL_CLEARANCE;
    const behindX = xForRight(middleLeft - LABEL_CLEARANCE);
    const beforeX = xForLeft(middleRight + LABEL_CLEARANCE);
    const staffStep = visualH + visualLabelH + LABEL_CLEARANCE;
    const staffTop = visualLabelH + LABEL_CLEARANCE;
    const values = [
      [coverX, CENTER_TOP, 0, 20],
      [crossX, CENTER_TOP, crossingRevealed && !open ? 90 : 0, 30],
      [CENTER_LEFT, crownY, 0, 4],
      [CENTER_LEFT, beneathY, 0, 4],
      [behindX, CENTER_TOP, 0, 4],
      [beforeX, CENTER_TOP, 0, 4],
      [STAFF_LEFT, staffTop + 3 * staffStep, 0, 4],
      [STAFF_LEFT, staffTop + 2 * staffStep, 0, 4],
      [STAFF_LEFT, staffTop + staffStep, 0, 4],
      [STAFF_LEFT, staffTop, 0, 4]
    ];

    list.forEach((item, index) => {
      const value = values[index];
      item.style.setProperty('position', 'absolute', 'important');
      item.style.setProperty('left', (value[0] + offsetX).toFixed(2) + 'px', 'important');
      item.style.setProperty('top', (value[1] + offsetY).toFixed(2) + 'px', 'important');
      item.style.setProperty('z-index', String(value[3]), 'important');
      item.style.setProperty('--row-card-scale', String(CARD_SCALE));
      item.style.setProperty('--row-card-rotation', value[2] + 'deg');
      item.classList.toggle('relphi-celtic-crossing-rotated', index === 1 && crossingRevealed && !open);
    });

    board.style.setProperty('width', '920px', 'important');
    board.style.setProperty('min-width', '920px', 'important');
    board.style.setProperty('height', '1180px', 'important');
    board.style.setProperty('min-height', '1180px', 'important');
    return { crossingRevealed, open };
  }

  function bounds(root) {
    const nodes = [];
    items(root).forEach(item => {
      const card = face(item);
      const label = item.querySelector(':scope > .card-row-position-panel');
      if (card) nodes.push(card);
      if (label) nodes.push(label);
    });
    const rects = nodes.map(node => node.getBoundingClientRect()).filter(rect => rect.width > 0 && rect.height > 0);
    if (!rects.length) return null;
    return {
      left:Math.min(...rects.map(rect => rect.left)),
      right:Math.max(...rects.map(rect => rect.right)),
      top:Math.min(...rects.map(rect => rect.top)),
      bottom:Math.max(...rects.map(rect => rect.bottom))
    };
  }

  function boardScale(board) {
    const rect = board?.getBoundingClientRect();
    const x = board?.offsetWidth ? rect.width / board.offsetWidth : 1;
    const y = board?.offsetHeight ? rect.height / board.offsetHeight : 1;
    return {
      x:Number.isFinite(x) && Math.abs(x) > .001 ? x : 1,
      y:Number.isFinite(y) && Math.abs(y) > .001 ? y : 1
    };
  }

  function desiredZoom(root) {
    const workspace = root.querySelector('.card-row-workspace');
    const zoom = root.querySelector('#rowZoom');
    if (!workspace || !zoom) return null;
    const width = workspace.getBoundingClientRect().width || window.visualViewport?.width || window.innerWidth || 390;
    const minAttr = Number(zoom.min);
    const maxAttr = Number(zoom.max);
    const min = Math.max(Number.isFinite(minAttr) && minAttr > 0 ? minAttr : .35, .56);
    const max = Math.min(Number.isFinite(maxAttr) && maxAttr > 0 ? maxAttr : 2.4, .82);
    return Math.max(min, Math.min(max, (width - GUTTER * 2) / BODY_WIDTH_FOR_ZOOM));
  }

  function setZoom(root, value) {
    const zoom = root.querySelector('#rowZoom');
    if (!zoom || !Number.isFinite(value)) return false;
    const current = Number(zoom.value) || 1;
    if (Math.abs(current - value) < .004) return false;
    settingZoom = true;
    zoom.value = value.toFixed(4);
    zoom.dispatchEvent(new Event('input', { bubbles:true }));
    zoom.dispatchEvent(new Event('change', { bubbles:true }));
    afterFrames(2, () => { settingZoom = false; schedule(); });
    return true;
  }

  function anchorBottomLeft(root, layoutState) {
    const workspace = root.querySelector('.card-row-workspace');
    const board = root.querySelector('.card-row-board');
    if (!workspace || !board) return false;
    geometry(root, layoutState, 0, 0);
    const content = bounds(root);
    const viewport = workspace.getBoundingClientRect();
    if (!content || !viewport.width || !viewport.height) return false;
    const scale = boardScale(board);
    const dx = (viewport.left + GUTTER - content.left) / scale.x;
    const dy = (viewport.bottom - GUTTER - content.bottom) / scale.y;
    geometry(root, layoutState, dx, dy);
    return true;
  }

  function stickerText(sticker) { return String(sticker?.textContent || '').replace(/\s+/g, ' ').trim(); }
  function stickerOverflows(sticker) {
    if (!sticker || !sticker.offsetWidth || !sticker.offsetHeight) return false;
    const clone = sticker.cloneNode(true);
    clone.removeAttribute('id');
    clone.removeAttribute('tabindex');
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
    const result = clone.scrollHeight > sticker.offsetHeight + 1;
    clone.remove();
    return result;
  }

  function refreshStickerOverflow(root) {
    if (!root?.classList.contains('relphi-mobile-celtic')) return;
    items(root).forEach(item => {
      const sticker = item.querySelector(':scope > .card-row-position-panel');
      if (!sticker) return;
      const overflow = stickerOverflows(sticker);
      sticker.classList.toggle('relphi-position-label-truncated', overflow);
      if (overflow) {
        sticker.dataset.relphiFullLabel = stickerText(sticker);
        sticker.setAttribute('tabindex', '0');
        sticker.setAttribute('role', 'button');
        sticker.setAttribute('aria-haspopup', 'dialog');
        sticker.setAttribute('aria-label', 'Show full position label: ' + sticker.dataset.relphiFullLabel);
      } else {
        delete sticker.dataset.relphiFullLabel;
        sticker.removeAttribute('tabindex');
        sticker.removeAttribute('role');
        sticker.removeAttribute('aria-haspopup');
        sticker.removeAttribute('aria-label');
      }
    });
  }

  function closePopover() { document.querySelector('.relphi-position-label-popover')?.remove(); }
  function openPopover(sticker) {
    const text = sticker?.dataset.relphiFullLabel || stickerText(sticker);
    if (!text) return;
    closePopover();
    const box = document.createElement('div');
    box.className = 'relphi-position-label-popover';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Full position label');
    const copy = document.createElement('div');
    copy.className = 'relphi-position-label-popover-copy';
    copy.textContent = text;
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'relphi-position-label-popover-close';
    close.textContent = 'Close';
    close.addEventListener('click', closePopover, { once:true });
    box.append(copy, close);
    document.body.appendChild(box);
    close.focus({ preventScroll:true });
  }

  function applyMobileCeltic(root) {
    const layoutState = celticState();
    if (!layoutState) {
      root.classList.remove('relphi-mobile-celtic','relphi-mobile-celtic-pending','relphi-mobile-celtic-ready');
      return true;
    }
    root.classList.add('relphi-mobile-celtic','relphi-mobile-celtic-pending');
    root.classList.remove('relphi-mobile-celtic-ready');
    if (items(root).length < 10 || !root.querySelector('.card-row-workspace')) return false;

    const targetZoom = desiredZoom(root);
    if (setZoom(root, targetZoom)) return false;

    geometry(root, layoutState, 0, 0);
    afterFrames(2, () => {
      const live = panel();
      const liveState = celticState();
      if (!live || !liveState || items(live).length < 10) return schedule();
      if (!anchorBottomLeft(live, liveState)) return schedule();
      refreshStickerOverflow(live);
      live.classList.remove('relphi-mobile-celtic-pending');
      live.classList.add('relphi-mobile-celtic-ready','relphi-drawing-board-ui-ready');
    });
    return false;
  }

  function repair() {
    queued = false;
    if (repairing) return;
    const root = panel();
    if (!root || root.hidden) return;
    repairing = true;
    try {
      installStyle();
      ensureAfterCanvas(root);
      ensureWorkspaceTools(root);
      ensureOptions(root);
      if (!mobile()) {
        root.classList.add('relphi-drawing-board-ui-ready');
        return;
      }
      root.classList.remove('relphi-drawing-board-ui-ready');
      if (applyMobileCeltic(root)) root.classList.add('relphi-drawing-board-ui-ready');
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
    let style = document.getElementById('relphi-drawing-board-mobile-celtic-v2-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'relphi-drawing-board-mobile-celtic-v2-style';
      document.head.appendChild(style);
    }
    style.textContent = `
      #shortListPanel #drawing-board-after-canvas,#shortListPanel #drawing-board-after-canvas *{translate:none!important}
      #shortListPanel #drawing-board-after-canvas{position:relative!important;inset:auto!important;transform:none!important;z-index:auto!important}
      #shortListPanel #drawing-board-title .drawing-board-post-body{display:grid!important;grid-template-columns:1fr!important;gap:1rem!important;width:100%!important}
      #shortListPanel #drawing-board-title .relphi-reading-name-control,#shortListPanel #drawing-board-title .relphi-reading-stats{grid-column:1!important;width:100%!important;min-width:0!important;margin:0!important}
      @media(max-width:700px){
        html body #shortListPanel{width:100%!important;max-width:100vw!important;min-width:0!important;overflow-x:hidden!important;box-sizing:border-box!important}
        html body #shortListPanel .card-row-drawing-board{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
        html body #shortListPanel .card-row-workspace{width:calc(100% - 24px)!important;max-width:calc(100% - 24px)!important;min-width:0!important;margin-left:12px!important;margin-right:12px!important;box-sizing:border-box!important;overflow:hidden!important}
        html body #shortListPanel.relphi-mobile-celtic .card-row-workspace{height:clamp(500px,76svh,700px)!important;min-height:clamp(500px,76svh,700px)!important;max-height:clamp(500px,76svh,700px)!important}
        html body #shortListPanel.relphi-mobile-celtic-pending .card-row-workspace{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
        html body #shortListPanel.relphi-mobile-celtic-ready .card-row-workspace{visibility:visible!important;opacity:1!important;pointer-events:auto!important}
        html body #shortListPanel.relphi-mobile-celtic .card-row-board>.card-row-item{position:absolute!important}
        html body #shortListPanel.relphi-mobile-celtic .card-row-board>.card-row-item>.card-row-position-panel{box-sizing:border-box!important;left:0!important;right:auto!important;top:0!important;bottom:auto!important;width:100%!important;min-width:100%!important;max-width:100%!important;height:3.35rem!important;min-height:3.35rem!important;max-height:3.35rem!important;margin:0!important;padding:.32rem .38rem!important;transform:translateY(-100%)!important;font-size:clamp(.68rem,2.5vw,.82rem)!important;line-height:1.05!important;white-space:normal!important;text-align:center!important;overflow:hidden!important;text-overflow:ellipsis!important;display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:3!important;line-clamp:3!important}
        html body #shortListPanel.relphi-mobile-celtic .card-row-board>.card-row-item>.card-row-position-panel.relphi-position-label-truncated{cursor:pointer!important}
        html body #shortListPanel.relphi-mobile-celtic .card-row-item.relphi-celtic-crossing-rotated>.card-row-card-wrap,
        html body #shortListPanel.relphi-mobile-celtic .card-row-item.relphi-celtic-crossing-rotated>.card-row-drop-card{transform:rotate(90deg)!important;transform-origin:50% 50%!important}
        html body #shortListPanel.relphi-mobile-celtic .card-row-item.relphi-celtic-crossing-rotated{transform:scale(var(--row-card-scale,1))!important;transform-origin:0 0!important}
        html body #shortListPanel.relphi-mobile-celtic .relphi-center-helper{display:none!important}
      }
      #shortListPanel #drawing-board-post-export #snapshotCardRowArrangement,#shortListPanel #drawing-board-post-export #saveDrawingBoardSnapshotToDevice,#shortListPanel #drawing-board-post-export #downloadRowOptimizedHtml,#shortListPanel #drawing-board-post-export #downloadRowJson{position:static!important;inset:auto!important;transform:none!important;translate:none!important}
      #shortListPanel .relphi-reading-options-drawer #snapshotCardRowArrangement,#shortListPanel .relphi-reading-options-drawer #saveDrawingBoardSnapshotToDevice,#shortListPanel .relphi-reading-options-drawer #downloadRowOptimizedHtml,#shortListPanel .relphi-reading-options-drawer #downloadRowJson{display:none!important}
      #shortListPanel #printRowPdf{display:none!important}
      #shortListPanel .card-row-workspace>.relphi-reading-options-drawer{transform:none!important;translate:none!important}
      .relphi-position-label-popover{position:fixed!important;left:50%!important;bottom:max(1rem,env(safe-area-inset-bottom))!important;transform:translateX(-50%)!important;z-index:100000!important;width:min(88vw,24rem)!important;box-sizing:border-box!important;padding:.85rem!important;border:1px solid rgba(53,36,31,.22)!important;border-radius:.8rem!important;background:#fffaf0!important;color:#2f211d!important;box-shadow:0 .75rem 2rem rgba(0,0,0,.24)!important;font:inherit!important}
      .relphi-position-label-popover-copy{font-weight:700!important;line-height:1.35!important;white-space:normal!important;overflow-wrap:anywhere!important}
      .relphi-position-label-popover-close{display:block!important;margin:.7rem 0 0 auto!important}
    `;
  }

  installStyle();

  document.addEventListener('click', event => {
    const fit = event.target?.closest?.('#shortListPanel #zoomCardRowExtents');
    if (fit && mobile() && celticState() && !event.isTrusted) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    const sticker = event.target?.closest?.('#shortListPanel.relphi-mobile-celtic .card-row-position-panel.relphi-position-label-truncated');
    if (sticker) {
      event.preventDefault();
      event.stopPropagation();
      openPopover(sticker);
      return;
    }
    if (!event.target?.closest?.('.relphi-position-label-popover')) closePopover();
  }, true);
  document.addEventListener('keydown', event => {
    const sticker = event.target?.closest?.('#shortListPanel.relphi-mobile-celtic .card-row-position-panel.relphi-position-label-truncated');
    if (sticker && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      openPopover(sticker);
    } else if (event.key === 'Escape') closePopover();
  }, true);
  document.addEventListener('relphi:drawing-board-rendered', schedule);
  document.addEventListener('relphi:drawing-board-center-view', schedule);
  document.addEventListener('relphi:drawing-board-options-toggle', schedule);
  document.addEventListener('input', event => {
    if (event.target?.matches?.('#rowZoom') && !settingZoom && event.isTrusted) schedule();
  }, true);
  window.addEventListener('resize', schedule, { passive:true });
  window.visualViewport?.addEventListener('resize', schedule, { passive:true });

  const startObserver = () => {
    const root = panel();
    if (!root) return window.setTimeout(startObserver, 40);
    new MutationObserver(records => {
      if (repairing) return;
      if (records.some(record => record.type === 'childList' && (record.addedNodes.length || record.removedNodes.length))) schedule();
    }).observe(root, { childList:true, subtree:true });
    schedule();
  };
  startObserver();
})();
