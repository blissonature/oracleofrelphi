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
  let queued = false;
  let applying = false;

  function root() { return document.querySelector(PANEL); }
  function board(rootNode = root()) { return rootNode?.querySelector('.card-row-board') || null; }
  function face(item) { return item?.querySelector('.card-row-card-wrap,.card-row-drop-card') || null; }

  function drawingBoardState() {
    try { return window.RelphiDrawingBoardPrefabsBridge?.getState?.() || null; }
    catch (_) { return null; }
  }

  function syncCelticReadable(rootNode) {
    const activeId = drawingBoardState()?.activeLayout?.id || '';
    const isCeltic = activeId === CELTIC_LAYOUT_ID;
    rootNode?.classList.toggle('relphi-celtic-readable', isCeltic);
    if (!isCeltic) rootNode?.classList.remove('relphi-celtic-cross-unrevealed');
    return isCeltic;
  }

  function syncCelticRevealState(rootNode) {
    if (!rootNode?.classList.contains('relphi-celtic-readable')) return;
    const liveBoard = board(rootNode);
    const crosses = liveBoard?.querySelector(':scope > .card-row-item[data-row-index="1"]');
    if (!crosses) return;

    const revealed = !!crosses.querySelector('[data-row-card]');
    rootNode.classList.toggle('relphi-celtic-cross-unrevealed', !revealed);
    rootNode.dataset.relphiCelticCrossRevealState = revealed ? 'revealed' : 'unrevealed';

    if (!revealed) {
      // The placeholder is an upright second position. It does not become the
      // traditional crossing card until an actual card has been drawn there.
      crosses.classList.remove('relphi-celtic-crossing-rotated');
      crosses.style.setProperty('--row-card-rotation', '0deg', 'important');
      return;
    }

    const layout = drawingBoardState()?.activeLayout;
    const crossing = Array.isArray(layout?.positions)
      ? layout.positions.slice().sort((a,b) => Number(a?.drawOrder || 0) - Number(b?.drawOrder || 0))[1]
      : null;
    const rotation = Number(crossing?.transform?.rotation) || 0;
    crosses.style.setProperty('--row-card-rotation', rotation + 'deg', 'important');
    crosses.classList.toggle('relphi-celtic-crossing-rotated', Math.abs(rotation) % 180 === 90);
  }

  function middleGapFor(cardWidth) {
    return Math.max(MIDDLE_GAP_MIN, Math.min(MIDDLE_GAP_MAX, cardWidth * MIDDLE_GAP_RATIO));
  }

  function setImportant(node, property, value) {
    if (!node) return;
    if (node.style.getPropertyValue(property) === value && node.style.getPropertyPriority(property) === 'important') return;
    node.style.setProperty(property, value, 'important');
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
      syncCelticReadable(rootNode);
      installStyle();
      ownCardSurfaces(rootNode);
      syncCelticRevealState(rootNode);
      enforceFlushLabels(rootNode);
      positionCelticMiddleRow(rootNode);
      positionCelticStaff(rootNode);
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
  document.addEventListener('relphi:drawing-board-center-view', schedule);
  document.addEventListener('input', event => {
    if (event.target?.matches?.('#rowZoom,#rowEnvelopeColor')) schedule();
  }, true);
  document.addEventListener('change', event => {
    if (event.target?.matches?.('#relphiSpreadTemplateSelect,#rowZoom,#rowEnvelopeColor')) schedule();
  }, true);
  window.addEventListener('resize', schedule);

  new MutationObserver(records => {
    if (applying) return;
    if (!records.some(record => record.type === 'childList' || (record.type === 'attributes' && ['class','style'].includes(record.attributeName)))) return;
    schedule();
  }).observe(document.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:['class','style'] });

  schedule();
})();