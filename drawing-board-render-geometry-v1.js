// Drawing Board rendered-surface ownership and Celtic visual geometry.
// One owner only: preserve the shipped Celtic coordinates, make our visual
// corrections deterministic, and perform at most one fold-fit per state change.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiDrawingBoardRenderGeometryV1) return;
  window.__relphiDrawingBoardRenderGeometryV1 = true;

  const PANEL = '#shortListPanel';
  const RADIUS = '.72rem';
  const CELTIC_LAYOUT_ID = 'celtic-cross-10';
  const MIDDLE_GAP_RATIO = .14;
  const MIDDLE_GAP_MIN = 14;
  const MIDDLE_GAP_MAX = 26;
  const FOLD_GUTTER = 14;
  const SIDE_GUTTER = 14;
  const FIT_SAFETY = .975;
  const MIN_WORKSPACE_HEIGHT = 280;
  let queued = false;
  let applying = false;
  let fitting = false;

  function root() { return document.querySelector(PANEL); }
  function board(rootNode = root()) { return rootNode?.querySelector('.card-row-board') || null; }
  function face(item) { return item?.querySelector('.card-row-card-wrap,.card-row-drop-card') || null; }

  function activeLayoutId() {
    try { return window.RelphiDrawingBoardPrefabsBridge?.getState?.()?.activeLayout?.id || ''; }
    catch (_) { return ''; }
  }

  function setImportant(node, property, value) {
    if (!node) return;
    if (node.style.getPropertyValue(property) === value && node.style.getPropertyPriority(property) === 'important') return;
    node.style.setProperty(property, value, 'important');
  }

  function syncCelticReadable(rootNode) {
    const isCeltic = activeLayoutId() === CELTIC_LAYOUT_ID;
    rootNode?.classList.toggle('relphi-celtic-readable', isCeltic);
    if (!isCeltic && rootNode) releaseFoldConstraint(rootNode);
    return isCeltic;
  }

  function middleGapFor(cardWidth) {
    return Math.max(MIDDLE_GAP_MIN, Math.min(MIDDLE_GAP_MAX, cardWidth * MIDDLE_GAP_RATIO));
  }

  function renderedScaleX(liveBoard) {
    if (!liveBoard?.offsetWidth) return 1;
    const rect = liveBoard.getBoundingClientRect();
    const scale = rect.width / liveBoard.offsetWidth;
    return Number.isFinite(scale) && Math.abs(scale) >= .001 ? Math.abs(scale) : 1;
  }

  function clearTranslateX(item, dataKey) {
    if (!item || item.dataset[dataKey] === undefined) return;
    item.style.removeProperty('translate');
    delete item.dataset[dataKey];
  }

  function baseFaceRect(item, dataKey, scaleX) {
    const surface = face(item);
    if (!surface) return null;
    const rect = surface.getBoundingClientRect();
    const logicalTranslate = Number(item?.dataset?.[dataKey] || 0);
    const visualTranslate = Number.isFinite(logicalTranslate) ? logicalTranslate * scaleX : 0;
    return {
      left:rect.left - visualTranslate,
      right:rect.right - visualTranslate,
      top:rect.top,
      bottom:rect.bottom,
      width:rect.width,
      height:rect.height
    };
  }

  function setTranslateX(item, dataKey, logicalTranslate) {
    if (!item || !Number.isFinite(logicalTranslate)) return false;
    if (Math.abs(logicalTranslate) < .01) {
      clearTranslateX(item, dataKey);
      return true;
    }
    const previous = Number(item.dataset[dataKey] || 0);
    const value = logicalTranslate.toFixed(2) + 'px 0px';
    if (Math.abs(previous - logicalTranslate) < .01 && item.style.getPropertyValue('translate') === value) return false;
    item.dataset[dataKey] = String(logicalTranslate);
    setImportant(item, 'translate', value);
    return true;
  }

  function setTranslateFromVisualDelta(item, dataKey, deltaVisual, scaleX) {
    if (!Number.isFinite(deltaVisual) || !Number.isFinite(scaleX) || Math.abs(scaleX) < .001) return false;
    return setTranslateX(item, dataKey, deltaVisual / scaleX);
  }

  function installStyle() {
    if (document.getElementById('relphi-render-geometry-style-v1')) return;
    const style = document.createElement('style');
    style.id = 'relphi-render-geometry-style-v1';
    style.textContent = [
      '#shortListPanel .card-row-board>.card-row-item::before,#shortListPanel .card-row-board>.card-row-item::after{content:none!important;display:none!important}',
      '#shortListPanel .card-row-board>.card-row-item>.card-row-card-wrap::before,#shortListPanel .card-row-board>.card-row-item>.card-row-card-wrap::after,#shortListPanel .card-row-board>.card-row-placeholder-item>.card-row-drop-card::before,#shortListPanel .card-row-board>.card-row-placeholder-item>.card-row-drop-card::after{content:none!important;display:none!important}',
      '#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="0"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="1"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="2"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="3"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="4"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="5"]>.card-row-position-panel{bottom:100%!important;margin-bottom:0!important}',
      '#shortListPanel.relphi-celtic-readable.relphi-celtic-cross-unrevealed .card-row-board>.card-row-item[data-row-index="1"]{--row-card-rotation:0deg!important;transform:scale(var(--row-card-scale,1))!important;transform-origin:0 0!important}',
      '#shortListPanel.relphi-celtic-readable.relphi-celtic-cross-unrevealed .card-row-board>.card-row-item[data-row-index="1"]>.card-row-card-wrap,#shortListPanel.relphi-celtic-readable.relphi-celtic-cross-unrevealed .card-row-board>.card-row-item[data-row-index="1"]>.card-row-drop-card{transform:none!important}',
      '#shortListPanel.relphi-celtic-readable.relphi-celtic-cross-unrevealed .relphi-center-helper{display:none!important}'
    ].join('');
    document.head.appendChild(style);
  }

  function ownCardSurfaces(rootNode) {
    const liveBoard = board(rootNode);
    if (!liveBoard) return;
    liveBoard.querySelectorAll(':scope > .card-row-item').forEach(item => {
      setImportant(item, 'background', 'transparent');
      setImportant(item, 'background-color', 'transparent');
      setImportant(item, 'border', '0px');
      setImportant(item, 'outline', '0px');
      setImportant(item, 'box-shadow', 'none');

      const wrap = item.querySelector(':scope > .card-row-card-wrap');
      const drop = item.querySelector(':scope > .card-row-drop-card');
      [wrap, drop].filter(Boolean).forEach(surface => {
        setImportant(surface, 'border-radius', RADIUS);
        setImportant(surface, 'overflow', 'hidden');
        setImportant(surface, 'clip-path', 'inset(0 round ' + RADIUS + ')');
        setImportant(surface, 'background-clip', 'padding-box');
        setImportant(surface, 'border', '0px');
        setImportant(surface, 'outline', '0px');
        setImportant(surface, 'box-shadow', 'none');
      });
      item.querySelectorAll('.card-row-card,.or-card.card-row-card,.card-row-drop-card-inner,.card-row-drop-card>img').forEach(surface => {
        setImportant(surface, 'border-radius', RADIUS);
        setImportant(surface, 'background-clip', 'padding-box');
      });
    });
  }

  function syncRevealState(rootNode) {
    const liveBoard = board(rootNode);
    const crosses = liveBoard?.querySelector(':scope > .card-row-item[data-row-index="1"]');
    if (!crosses) return false;
    const revealed = !!crosses.querySelector('[data-row-card]');
    const previous = rootNode.dataset.relphiCelticCrossRevealState || '';
    const next = revealed ? 'revealed' : 'unrevealed';
    rootNode.dataset.relphiCelticCrossRevealState = next;
    rootNode.classList.toggle('relphi-celtic-cross-unrevealed', !revealed);
    if (!revealed) crosses.classList.remove('relphi-celtic-crossing-rotated');
    if (previous && previous !== next) resetFoldFit(rootNode);
    return revealed;
  }

  function clearMiddleTranslations(liveBoard) {
    [0,1,4,5].forEach(index => {
      clearTranslateX(liveBoard?.querySelector(':scope > .card-row-item[data-row-index="' + index + '"]'), 'relphiMiddleTranslateX');
    });
  }

  function positionCelticMiddleRow(rootNode, crossingRevealed) {
    const liveBoard = board(rootNode);
    if (!liveBoard) return;
    if (!rootNode.classList.contains('relphi-celtic-readable')) {
      clearMiddleTranslations(liveBoard);
      return;
    }

    const covers = liveBoard.querySelector(':scope > .card-row-item[data-row-index="0"]');
    const crosses = liveBoard.querySelector(':scope > .card-row-item[data-row-index="1"]');
    const behind = liveBoard.querySelector(':scope > .card-row-item[data-row-index="4"]');
    const before = liveBoard.querySelector(':scope > .card-row-item[data-row-index="5"]');
    if (![covers,crosses,behind,before].every(Boolean)) return;

    const scaleX = renderedScaleX(liveBoard);
    const coverRect = baseFaceRect(covers, 'relphiMiddleTranslateX', scaleX);
    const crossRect = baseFaceRect(crosses, 'relphiMiddleTranslateX', scaleX);
    const behindRect = baseFaceRect(behind, 'relphiMiddleTranslateX', scaleX);
    const beforeRect = baseFaceRect(before, 'relphiMiddleTranslateX', scaleX);
    if (!coverRect || !crossRect || !behindRect || !beforeRect || !coverRect.width) return;

    const centerOpen = !crossingRevealed || !crosses.classList.contains('relphi-celtic-crossing-rotated');
    const coverCenter = coverRect.left + coverRect.width / 2;
    const crossCenter = crossRect.left + crossRect.width / 2;
    const axis = centerOpen ? (coverCenter + crossCenter) / 2 : coverCenter;
    const cardWidth = coverRect.width;
    const middleGap = middleGapFor(cardWidth);

    if (centerOpen) {
      const targetCoverRight = axis - middleGap / 2;
      const targetCrossLeft = axis + middleGap / 2;
      setTranslateFromVisualDelta(covers, 'relphiMiddleTranslateX', targetCoverRight - coverRect.right, scaleX);
      setTranslateFromVisualDelta(crosses, 'relphiMiddleTranslateX', targetCrossLeft - crossRect.left, scaleX);
    } else {
      clearTranslateX(covers, 'relphiMiddleTranslateX');
      clearTranslateX(crosses, 'relphiMiddleTranslateX');
    }

    const fixedCentralLeft = axis - cardWidth - middleGap / 2;
    const fixedCentralRight = axis + cardWidth + middleGap / 2;
    setTranslateFromVisualDelta(behind, 'relphiMiddleTranslateX', (fixedCentralLeft - middleGap) - behindRect.right, scaleX);
    setTranslateFromVisualDelta(before, 'relphiMiddleTranslateX', (fixedCentralRight + middleGap) - beforeRect.left, scaleX);
  }

  function clearStaffTranslation(liveBoard) {
    [6,7,8,9].forEach(index => {
      clearTranslateX(liveBoard?.querySelector(':scope > .card-row-item[data-row-index="' + index + '"]'), 'relphiStaffTranslateX');
    });
  }

  function positionCelticStaff(rootNode) {
    const liveBoard = board(rootNode);
    if (!liveBoard) return;
    if (!rootNode.classList.contains('relphi-celtic-readable')) {
      clearStaffTranslation(liveBoard);
      return;
    }

    const before = liveBoard.querySelector(':scope > .card-row-item[data-row-index="5"]');
    const firstStaff = liveBoard.querySelector(':scope > .card-row-item[data-row-index="6"]');
    if (!before || !firstStaff) return;
    const scaleX = renderedScaleX(liveBoard);
    const beforeRect = baseFaceRect(before, 'relphiMiddleTranslateX', scaleX);
    const staffRect = baseFaceRect(firstStaff, 'relphiStaffTranslateX', scaleX);
    if (!beforeRect?.width || !staffRect?.width) return;

    const desiredLeft = beforeRect.right + beforeRect.width;
    const logicalTranslate = (desiredLeft - staffRect.left) / scaleX;
    [6,7,8,9].forEach(index => {
      const item = liveBoard.querySelector(':scope > .card-row-item[data-row-index="' + index + '"]');
      if (item) setTranslateX(item, 'relphiStaffTranslateX', logicalTranslate);
    });
  }

  function enforceFlushLabels(rootNode) {
    if (!rootNode?.classList.contains('relphi-celtic-readable')) return;
    const liveBoard = board(rootNode);
    if (!liveBoard) return;
    [0,1,2,3,4,5].forEach(index => {
      const sticker = liveBoard.querySelector(':scope > .card-row-item[data-row-index="' + index + '"] > .card-row-position-panel');
      if (!sticker) return;
      setImportant(sticker, 'bottom', '100%');
      setImportant(sticker, 'margin-bottom', '0px');
    });
  }

  function visualBounds(liveBoard) {
    if (!liveBoard) return null;
    const nodes = [];
    liveBoard.querySelectorAll(':scope > .card-row-item').forEach(item => {
      const visual = face(item);
      const label = item.querySelector(':scope > .card-row-position-panel');
      if (visual) nodes.push(visual);
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

  function constrainFold(rootNode) {
    const workspace = rootNode.querySelector('.card-row-workspace');
    if (!workspace) return false;
    const viewportHeight = window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || 720;
    const rect = workspace.getBoundingClientRect();
    const available = Math.floor(viewportHeight - Math.max(0, rect.top) - FOLD_GUTTER);
    if (available < MIN_WORKSPACE_HEIGHT) return false;
    if (workspace.dataset.relphiFoldPrevious === undefined) {
      workspace.dataset.relphiFoldPrevious = JSON.stringify({
        height:workspace.style.getPropertyValue('height') || '',
        minHeight:workspace.style.getPropertyValue('min-height') || '',
        maxHeight:workspace.style.getPropertyValue('max-height') || ''
      });
    }
    const px = available + 'px';
    setImportant(workspace, 'height', px);
    setImportant(workspace, 'min-height', px);
    setImportant(workspace, 'max-height', px);
    return true;
  }

  function releaseFoldConstraint(rootNode) {
    const workspace = rootNode?.querySelector('.card-row-workspace');
    if (workspace?.dataset.relphiFoldPrevious !== undefined) {
      let old = {};
      try { old = JSON.parse(workspace.dataset.relphiFoldPrevious || '{}'); } catch (_) {}
      [['height',old.height],['min-height',old.minHeight],['max-height',old.maxHeight]].forEach(([property,value]) => {
        if (value) workspace.style.setProperty(property, value); else workspace.style.removeProperty(property);
      });
      delete workspace.dataset.relphiFoldPrevious;
    }
    if (rootNode) {
      delete rootNode.dataset.relphiCelticFoldFitDone;
      delete rootNode.dataset.relphiCelticFoldFitKey;
      delete rootNode.dataset.relphiCelticPanReset;
      rootNode.classList.remove('relphi-celtic-cross-unrevealed');
    }
  }

  function resetFoldFit(rootNode = root()) {
    if (!rootNode) return;
    delete rootNode.dataset.relphiCelticFoldFitDone;
    delete rootNode.dataset.relphiCelticFoldFitKey;
  }

  function resetPanOnce(rootNode) {
    if (rootNode.dataset.relphiCelticPanReset === 'true') return;
    rootNode.dataset.relphiCelticPanReset = 'true';
    document.getElementById('resetCardRowPan')?.click();
  }

  function fitToFoldOnce(rootNode) {
    if (fitting || rootNode.dataset.relphiCelticFoldFitDone === 'true') return;
    const workspace = rootNode.querySelector('.card-row-workspace');
    const liveBoard = board(rootNode);
    const zoom = document.getElementById('rowZoom');
    if (!workspace || !liveBoard || !zoom || !constrainFold(rootNode)) return;

    const content = visualBounds(liveBoard);
    const frame = workspace.getBoundingClientRect();
    if (!content || !frame.width || !frame.height) return;

    const contentWidth = Math.max(1, content.right - content.left);
    const contentHeight = Math.max(1, content.bottom - content.top);
    const targetWidth = Math.max(1, frame.width - SIDE_GUTTER * 2);
    const targetHeight = Math.max(1, frame.height - FOLD_GUTTER * 2);
    const ratio = Math.min(targetWidth / contentWidth, targetHeight / contentHeight);
    const current = Number(zoom.value) || 1;
    const min = Number(zoom.min) > 0 ? Number(zoom.min) : .35;
    const max = Number(zoom.max) > 0 ? Number(zoom.max) : 2.4;
    const next = Math.max(min, Math.min(max, current * ratio * FIT_SAFETY));

    rootNode.dataset.relphiCelticFoldFitDone = 'true';
    rootNode.dataset.relphiCelticFoldFitKey = [Math.round(frame.width),Math.round(frame.height),rootNode.dataset.relphiCelticCrossRevealState || ''].join(':');
    if (Math.abs(next - current) < .006) return;

    fitting = true;
    try {
      zoom.value = String(next);
      zoom.dispatchEvent(new Event('input', { bubbles:true }));
      zoom.dispatchEvent(new Event('change', { bubbles:true }));
    } finally {
      fitting = false;
    }
  }

  function apply() {
    queued = false;
    if (applying) return;
    const rootNode = root();
    if (!rootNode || rootNode.hidden) return;
    applying = true;
    try {
      const isCeltic = syncCelticReadable(rootNode);
      installStyle();
      ownCardSurfaces(rootNode);
      if (!isCeltic) return;
      resetPanOnce(rootNode);
      const revealed = syncRevealState(rootNode);
      enforceFlushLabels(rootNode);
      positionCelticMiddleRow(rootNode, revealed);
      positionCelticStaff(rootNode);
      fitToFoldOnce(rootNode);
    } finally {
      applying = false;
    }
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => requestAnimationFrame(apply));
  }

  document.addEventListener('relphi:drawing-board-rendered', schedule);
  document.addEventListener('relphi:drawing-board-center-view', () => { resetFoldFit(); schedule(); });
  document.addEventListener('input', event => {
    if (event.target?.matches?.('#rowEnvelopeColor')) schedule();
    if (event.target?.matches?.('#rowZoom') && event.isTrusted && !fitting) {
      const rootNode = root();
      if (rootNode) rootNode.dataset.relphiCelticFoldFitDone = 'true';
    }
  }, true);
  document.addEventListener('change', event => {
    if (event.target?.matches?.('#relphiSpreadTemplateSelect')) {
      const rootNode = root();
      if (rootNode) {
        delete rootNode.dataset.relphiCelticPanReset;
        resetFoldFit(rootNode);
      }
      schedule();
    }
    if (event.target?.matches?.('#rowEnvelopeColor')) schedule();
  }, true);
  window.addEventListener('resize', () => { resetFoldFit(); schedule(); }, { passive:true });

  const rootNode = root();
  if (rootNode) {
    new MutationObserver(records => {
      if (applying) return;
      if (records.some(record => record.type === 'childList')) schedule();
    }).observe(rootNode, { childList:true, subtree:true });
  }

  apply();
})();
