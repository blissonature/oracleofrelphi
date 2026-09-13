// Drawing Board rendered-surface ownership and Celtic visual geometry.
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
  const FOLD_MIN_USABLE_HEIGHT = 280;
  const FOLD_SIDE_PADDING = 12;
  const FOLD_BOTTOM_PADDING = 12;
  const FOLD_FIT_SAFETY = .985;
  const FOLD_FIT_TOLERANCE = .012;
  const FOLD_MAX_FIT_PASSES = 4;
  let queued = false;
  let applying = false;
  let fittingFold = false;

  function root() { return document.querySelector(PANEL); }
  function board(rootNode = root()) { return rootNode?.querySelector('.card-row-board') || null; }
  function face(item) { return item?.querySelector('.card-row-card-wrap,.card-row-drop-card') || null; }

  function resetCelticFitState(rootNode) {
    if (!rootNode) return;
    delete rootNode.dataset.relphiCelticFoldFitDone;
    rootNode.dataset.relphiCelticFoldFitPass = '0';
  }

  function releaseCelticFoldConstraint(rootNode) {
    const workspace = rootNode?.querySelector('.card-row-workspace');
    if (workspace?.dataset.relphiCelticFoldPrevious !== undefined) {
      let previous = {};
      try { previous = JSON.parse(workspace.dataset.relphiCelticFoldPrevious || '{}'); } catch (_) {}
      ['height','min-height','max-height'].forEach(property => {
        const value = previous[property] || '';
        if (value) workspace.style.setProperty(property, value);
        else workspace.style.removeProperty(property);
      });
      delete workspace.dataset.relphiCelticFoldPrevious;
    }
    if (rootNode) {
      resetCelticFitState(rootNode);
      rootNode.classList.remove('relphi-celtic-cross-unrevealed');
      delete rootNode.dataset.relphiCelticCrossRevealState;
    }
  }

  function syncCelticReadable(rootNode) {
    let activeId = '';
    try { activeId = window.RelphiDrawingBoardPrefabsBridge?.getState?.()?.activeLayout?.id || ''; } catch (_) {}
    const isCeltic = activeId === CELTIC_LAYOUT_ID;
    rootNode?.classList.toggle('relphi-celtic-readable', isCeltic);
    if (!isCeltic) releaseCelticFoldConstraint(rootNode);
    return isCeltic;
  }

  function syncCelticCrossRevealState(rootNode) {
    if (!rootNode?.classList.contains('relphi-celtic-readable')) return true;
    const crosses = board(rootNode)?.querySelector(':scope > .card-row-item[data-row-index="1"]');
    const revealed = !!crosses?.querySelector('[data-row-card]');
    const nextState = revealed ? 'revealed' : 'unrevealed';
    if (rootNode.dataset.relphiCelticCrossRevealState !== nextState) {
      rootNode.dataset.relphiCelticCrossRevealState = nextState;
      resetCelticFitState(rootNode);
    }
    rootNode.classList.toggle('relphi-celtic-cross-unrevealed', !revealed);
    return revealed;
  }

  function middleGapFor(cardWidth) {
    return Math.max(MIDDLE_GAP_MIN, Math.min(MIDDLE_GAP_MAX, cardWidth * MIDDLE_GAP_RATIO));
  }

  function setImportant(node, property, value) {
    if (!node) return;
    if (node.style.getPropertyValue(property) === value && node.style.getPropertyPriority(property) === 'important') return;
    node.style.setProperty(property, value, 'important');
  }

  function constrainCelticWorkspaceToFold(rootNode) {
    if (!rootNode?.classList.contains('relphi-celtic-readable')) return null;
    if (window.matchMedia?.('(max-width:700px)')?.matches) return null;
    const workspace = rootNode.querySelector('.card-row-workspace');
    if (!workspace) return null;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 720;
    const workspaceRect = workspace.getBoundingClientRect();
    const visibleTop = Math.max(0, workspaceRect.top);
    const availableHeight = Math.floor(viewportHeight - visibleTop - FOLD_GUTTER);
    if (availableHeight < FOLD_MIN_USABLE_HEIGHT) return null;

    if (workspace.dataset.relphiCelticFoldPrevious === undefined) {
      workspace.dataset.relphiCelticFoldPrevious = JSON.stringify({
        height:workspace.style.getPropertyValue('height') || '',
        'min-height':workspace.style.getPropertyValue('min-height') || '',
        'max-height':workspace.style.getPropertyValue('max-height') || ''
      });
    }
    const height = availableHeight + 'px';
    setImportant(workspace, 'height', height);
    setImportant(workspace, 'min-height', height);
    setImportant(workspace, 'max-height', height);
    return availableHeight;
  }

  function celticVisualBounds(liveBoard) {
    if (!liveBoard) return null;
    const nodes = [];
    liveBoard.querySelectorAll(':scope > .card-row-item').forEach(item => {
      const cardFace = face(item);
      const sticker = item.querySelector(':scope > .card-row-position-panel');
      if (cardFace) nodes.push(cardFace);
      if (sticker) nodes.push(sticker);
    });
    const helper = liveBoard.querySelector('.relphi-center-helper');
    if (helper) nodes.push(helper);
    const rects = nodes.map(node => node.getBoundingClientRect()).filter(rect => rect.width > 0 && rect.height > 0);
    if (!rects.length) return null;
    return {
      left:Math.min(...rects.map(rect => rect.left)),
      right:Math.max(...rects.map(rect => rect.right)),
      top:Math.min(...rects.map(rect => rect.top)),
      bottom:Math.max(...rects.map(rect => rect.bottom))
    };
  }

  function fitCelticToFold(rootNode) {
    if (fittingFold || !rootNode?.classList.contains('relphi-celtic-readable')) return;
    if (rootNode.dataset.relphiCelticFoldFitDone === 'true') return;
    const workspace = rootNode.querySelector('.card-row-workspace');
    const liveBoard = board(rootNode);
    const zoomInput = document.getElementById('rowZoom');
    if (!workspace || !liveBoard || !zoomInput) return;
    const availableHeight = constrainCelticWorkspaceToFold(rootNode);
    if (!availableHeight) return;

    const workspaceRect = workspace.getBoundingClientRect();
    const bounds = celticVisualBounds(liveBoard);
    if (!bounds) return;
    const contentWidth = bounds.right - bounds.left;
    const contentHeight = bounds.bottom - bounds.top;
    if (!contentWidth || !contentHeight) return;

    const targetWidth = Math.max(1, workspaceRect.width - FOLD_SIDE_PADDING * 2);
    const topInset = Math.max(0, bounds.top - workspaceRect.top);
    const targetHeight = Math.max(1, workspaceRect.height - topInset - FOLD_BOTTOM_PADDING);
    const fitRatio = Math.min(targetWidth / contentWidth, targetHeight / contentHeight);
    const currentZoom = Number(zoomInput.value) || 1;
    const inputMin = Number(zoomInput.min);
    const inputMax = Number(zoomInput.max);
    const minZoom = Number.isFinite(inputMin) && inputMin > 0 ? inputMin : .45;
    const maxZoom = Number.isFinite(inputMax) && inputMax > 0 ? inputMax : 2.4;
    const pass = Number(rootNode.dataset.relphiCelticFoldFitPass || 0);

    if (Math.abs(1 - fitRatio) <= FOLD_FIT_TOLERANCE || pass >= FOLD_MAX_FIT_PASSES) {
      rootNode.dataset.relphiCelticFoldFitDone = 'true';
      return;
    }

    const nextZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom * fitRatio * FOLD_FIT_SAFETY));
    if (Math.abs(nextZoom - currentZoom) < .005) {
      rootNode.dataset.relphiCelticFoldFitDone = 'true';
      return;
    }

    fittingFold = true;
    rootNode.dataset.relphiCelticFoldFitPass = String(pass + 1);
    zoomInput.value = String(nextZoom);
    zoomInput.dispatchEvent(new Event('input', { bubbles:true }));
    zoomInput.dispatchEvent(new Event('change', { bubbles:true }));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fittingFold = false;
      if (Number(rootNode.dataset.relphiCelticFoldFitPass || 0) >= FOLD_MAX_FIT_PASSES) {
        rootNode.dataset.relphiCelticFoldFitDone = 'true';
      }
      schedule();
    }));
  }

  function renderedScaleX(liveBoard) {
    if (!liveBoard?.offsetWidth) return 1;
    const rect = liveBoard.getBoundingClientRect();
    const scale = rect.width / liveBoard.offsetWidth;
    return Number.isFinite(scale) && Math.abs(scale) >= .001 ? scale : 1;
  }

  function adjustTranslateX(item, dataKey, deltaVisual, scaleX) {
    if (!item || !Number.isFinite(deltaVisual) || Math.abs(deltaVisual) < .5) return false;
    const previous = Number(item.dataset[dataKey] || 0);
    const next = previous + (deltaVisual / scaleX);
    item.dataset[dataKey] = String(next);
    setImportant(item, 'translate', next.toFixed(2) + 'px 0px');
    return true;
  }

  function clearTranslateX(item, dataKey) {
    if (!item || item.dataset[dataKey] === undefined) return;
    item.style.removeProperty('translate');
    delete item.dataset[dataKey];
  }

  function installStyle() {
    if (document.getElementById('relphi-render-geometry-style-v1')) return;
    const style = document.createElement('style');
    style.id = 'relphi-render-geometry-style-v1';
    style.textContent = [
      '#shortListPanel .card-row-board>.card-row-item::before,#shortListPanel .card-row-board>.card-row-item::after{content:none!important;display:none!important}',
      '#shortListPanel .card-row-board>.card-row-item>.card-row-card-wrap::before,#shortListPanel .card-row-board>.card-row-item>.card-row-card-wrap::after,#shortListPanel .card-row-board>.card-row-placeholder-item>.card-row-drop-card::before,#shortListPanel .card-row-board>.card-row-placeholder-item>.card-row-drop-card::after{content:none!important;display:none!important}',
      '#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="0"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="1"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="2"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="3"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="4"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="5"]>.card-row-position-panel{bottom:100%!important;margin-bottom:0!important}',
      'html body #shortListPanel.relphi-celtic-cross-unrevealed .card-row-workspace .short-list-row.card-row-board>.card-row-item[data-row-index="1"].relphi-celtic-crossing-rotated{transform:rotate(0deg) scale(var(--row-card-scale,1))!important}',
      'html body #shortListPanel.relphi-celtic-cross-unrevealed .card-row-workspace .short-list-row.card-row-board>.card-row-item[data-row-index="1"].relphi-celtic-crossing-rotated>.card-row-position-panel{left:0!important;right:auto!important;top:auto!important;bottom:100%!important;width:100%!important;min-width:100%!important;max-width:100%!important;margin:0!important;transform:none!important;text-align:center!important}',
      'html body #shortListPanel.relphi-celtic-cross-unrevealed .card-row-workspace .short-list-row.card-row-board>.card-row-item[data-row-index="1"].relphi-celtic-crossing-rotated>.card-row-drop-card>.card-row-drop-card-inner{display:flex!important;align-items:center!important;justify-content:center!important}',
      'html body #shortListPanel.relphi-celtic-cross-unrevealed .relphi-center-helper{display:none!important}'
    ].join('');
    document.head.appendChild(style);
  }

  function ownCardSurfaces(rootNode) {
    const liveBoard = board(rootNode);
    if (!liveBoard) return;

    liveBoard.querySelectorAll(':scope > .card-row-item').forEach(item => {
      // The position envelope is geometry only. It must never paint a square behind the face.
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

  function clearMiddleTranslations(liveBoard) {
    [0,1,4,5].forEach(index => {
      clearTranslateX(liveBoard?.querySelector(':scope > .card-row-item[data-row-index="' + index + '"]'), 'relphiMiddleTranslateX');
    });
  }

  function positionCelticMiddleRow(rootNode) {
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
    const coverFace = face(covers);
    const crossFace = face(crosses);
    const behindFace = face(behind);
    const beforeFace = face(before);
    if (!coverFace || !crossFace || !behindFace || !beforeFace) return;

    const scaleX = renderedScaleX(liveBoard);
    const crossingRevealed = !!crosses.querySelector('[data-row-card]');
    const centerOpen = !crossingRevealed || !crosses.classList.contains('relphi-celtic-crossing-rotated');

    // Before the crossing card is revealed, treat the center as open so its
    // placeholder remains upright beside Covers. Revealing it closes the center.
    // Manual Open Center continues to work after reveal.
    if (!centerOpen) {
      clearTranslateX(covers, 'relphiMiddleTranslateX');
      clearTranslateX(crosses, 'relphiMiddleTranslateX');
    }

    let coverRect = coverFace.getBoundingClientRect();
    let crossRect = crossFace.getBoundingClientRect();
    const coverCenter = coverRect.left + coverRect.width / 2;
    const crossCenter = crossRect.left + crossRect.width / 2;
    const axis = centerOpen ? (coverCenter + crossCenter) / 2 : coverCenter;
    const cardWidth = coverRect.width;
    if (!cardWidth) return;
    const middleGap = middleGapFor(cardWidth);

    if (centerOpen) {
      const targetCoverRight = axis - middleGap / 2;
      const targetCrossLeft = axis + middleGap / 2;
      adjustTranslateX(covers, 'relphiMiddleTranslateX', targetCoverRight - coverRect.right, scaleX);
      adjustTranslateX(crosses, 'relphiMiddleTranslateX', targetCrossLeft - crossRect.left, scaleX);
      coverRect = coverFace.getBoundingClientRect();
      crossRect = crossFace.getBoundingClientRect();
    }

    const fixedCentralLeft = axis - cardWidth - middleGap / 2;
    const fixedCentralRight = axis + cardWidth + middleGap / 2;
    const behindRect = behindFace.getBoundingClientRect();
    const beforeRect = beforeFace.getBoundingClientRect();

    adjustTranslateX(behind, 'relphiMiddleTranslateX', (fixedCentralLeft - middleGap) - behindRect.right, scaleX);
    adjustTranslateX(before, 'relphiMiddleTranslateX', (fixedCentralRight + middleGap) - beforeRect.left, scaleX);
  }

  function clearStaffTranslation(liveBoard) {
    liveBoard?.querySelectorAll(':scope > .card-row-item[data-row-index="6"],:scope > .card-row-item[data-row-index="7"],:scope > .card-row-item[data-row-index="8"],:scope > .card-row-item[data-row-index="9"]').forEach(item => {
      if (item.dataset.relphiStaffTranslateX) {
        item.style.removeProperty('translate');
        delete item.dataset.relphiStaffTranslateX;
      }
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
    const beforeFace = face(before);
    const staffFace = face(firstStaff);
    if (!beforeFace || !staffFace) return;

    const beforeRect = beforeFace.getBoundingClientRect();
    const staffRect = staffFace.getBoundingClientRect();
    if (!beforeRect.width || !staffRect.width) return;

    // Required visual rule: Before | one full rendered card-width of felt | staff.
    const desiredLeft = beforeRect.right + beforeRect.width;
    const deltaVisual = desiredLeft - staffRect.left;
    if (Math.abs(deltaVisual) < .5) return;

    const scaleX = renderedScaleX(liveBoard);
    const previous = Number(firstStaff.dataset.relphiStaffTranslateX || 0);
    const next = previous + (deltaVisual / scaleX);

    [6,7,8,9].forEach(index => {
      const item = liveBoard.querySelector(':scope > .card-row-item[data-row-index="' + index + '"]');
      if (!item) return;
      item.dataset.relphiStaffTranslateX = String(next);
      setImportant(item, 'translate', next.toFixed(2) + 'px 0px');
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

  function apply() {
    queued = false;
    if (applying) return;
    const rootNode = root();
    if (!rootNode || rootNode.hidden) return;
    applying = true;
    try {
      const isCeltic = syncCelticReadable(rootNode);
      if (isCeltic) syncCelticCrossRevealState(rootNode);
      installStyle();
      ownCardSurfaces(rootNode);
      enforceFlushLabels(rootNode);
      positionCelticMiddleRow(rootNode);
      positionCelticStaff(rootNode);
      if (isCeltic) {
        constrainCelticWorkspaceToFold(rootNode);
        fitCelticToFold(rootNode);
      }
    } finally {
      applying = false;
    }
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => requestAnimationFrame(apply));
  }

  function resetCelticFit() {
    resetCelticFitState(root());
  }

  document.addEventListener('relphi:drawing-board-rendered', schedule);
  document.addEventListener('relphi:drawing-board-center-view', () => { resetCelticFit(); schedule(); });
  document.addEventListener('input', event => {
    if (event.target?.matches?.('#rowZoom,#rowEnvelopeColor')) {
      if (event.target.matches('#rowZoom') && event.isTrusted && !fittingFold) {
        const rootNode = root();
        if (rootNode) rootNode.dataset.relphiCelticFoldFitDone = 'true';
      }
      schedule();
    }
  }, true);
  document.addEventListener('change', event => {
    if (event.target?.matches?.('#relphiSpreadTemplateSelect')) resetCelticFit();
    if (event.target?.matches?.('#relphiSpreadTemplateSelect,#rowZoom,#rowEnvelopeColor')) schedule();
  }, true);
  window.addEventListener('resize', () => { resetCelticFit(); schedule(); });

  new MutationObserver(records => {
    if (applying) return;
    if (!records.some(record => record.type === 'childList' || (record.type === 'attributes' && ['class','style'].includes(record.attributeName)))) return;
    schedule();
  }).observe(document.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:['class','style'] });

  schedule();
})();
