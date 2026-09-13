// Drawing Board rendered-surface ownership and Celtic visual geometry.
// The shipped Celtic Cross owns its canonical positions. This owner fits the
// complete rendered footprint (cards + position stickers), anchors that footprint
// inside the visible workspace, and never lets persisted slot coordinates win.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiDrawingBoardRenderGeometryV1) return;
  window.__relphiDrawingBoardRenderGeometryV1 = true;

  const PANEL = '#shortListPanel';
  const CELTIC_LAYOUT_ID = 'celtic-cross-10';
  const CANVAS_W = 900;
  const CANVAS_H = 760;
  const RADIUS = '.72rem';
  const GUTTER = 14;
  const FIT_SAFETY = .975;
  const MIN_WORKSPACE_HEIGHT = 280;
  let queued = false;
  let applying = false;
  let fitting = false;

  function root() { return document.querySelector(PANEL); }
  function board(rootNode = root()) { return rootNode?.querySelector('.card-row-board') || null; }
  function face(item) { return item?.querySelector('.card-row-card-wrap,.card-row-drop-card') || null; }
  function state() {
    try { return window.RelphiDrawingBoardPrefabsBridge?.getState?.() || null; }
    catch (_) { return null; }
  }
  function activeLayoutId() { return state()?.activeLayout?.id || ''; }

  function setImportant(node, property, value) {
    if (!node) return;
    if (node.style.getPropertyValue(property) === value && node.style.getPropertyPriority(property) === 'important') return;
    node.style.setProperty(property, value, 'important');
  }

  function shippedCelticLayout() {
    try {
      const list = window.RelphiDrawingBoardSpreadPrefabs?.list?.() || [];
      const shipped = list.find(item => item?.id === CELTIC_LAYOUT_ID && item?.source === 'shipped');
      if (shipped) return shipped;
    } catch (_) {}
    const active = state()?.activeLayout;
    return active?.id === CELTIC_LAYOUT_ID ? active : null;
  }

  function installStyle() {
    if (document.getElementById('relphi-render-geometry-style-v1')) return;
    const style = document.createElement('style');
    style.id = 'relphi-render-geometry-style-v1';
    style.textContent = [
      // Never hide the entire Drawing Board while enhancement scripts settle.
      // Only the moving Celtic card surface is masked during its geometry pass.
      'html body #shortListPanel:not(.relphi-drawing-board-ui-ready) .card-row-workspace{visibility:visible!important;opacity:1!important;pointer-events:auto!important}',
      '#shortListPanel.relphi-celtic-geometry-pending .card-row-board{visibility:hidden!important}',
      '#shortListPanel.relphi-celtic-geometry-ready .card-row-board{visibility:visible!important}',
      '#shortListPanel .card-row-board>.card-row-item::before,#shortListPanel .card-row-board>.card-row-item::after{content:none!important;display:none!important}',
      '#shortListPanel .card-row-board>.card-row-item>.card-row-card-wrap::before,#shortListPanel .card-row-board>.card-row-item>.card-row-card-wrap::after,#shortListPanel .card-row-board>.card-row-placeholder-item>.card-row-drop-card::before,#shortListPanel .card-row-board>.card-row-placeholder-item>.card-row-drop-card::after{content:none!important;display:none!important}',
      'html body #shortListPanel.relphi-celtic-readable .card-row-workspace .short-list-row.card-row-board>.card-row-item{position:absolute!important}',
      '#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="0"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="1"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="2"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="3"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="4"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="5"]>.card-row-position-panel{top:0!important;bottom:auto!important;margin:0!important;transform:translateY(-100%)!important}',
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
    });
  }

  function applyCanonicalCeltic(rootNode) {
    const liveBoard = board(rootNode);
    const layout = shippedCelticLayout();
    if (!liveBoard || !layout || !Array.isArray(layout.positions)) return false;

    const liveState = state();
    const centerOpen = !!liveState?.centerOpen;
    const positions = layout.positions.slice().sort((a,b) => Number(a?.drawOrder || 0) - Number(b?.drawOrder || 0));
    const crossingItem = liveBoard.querySelector(':scope > .card-row-item[data-row-index="1"]');
    const crossingRevealed = !!crossingItem?.querySelector('[data-row-card]');
    rootNode.classList.toggle('relphi-celtic-cross-unrevealed', !crossingRevealed);
    rootNode.dataset.relphiCelticCrossRevealState = crossingRevealed ? 'revealed' : 'unrevealed';

    positions.forEach((position, index) => {
      const item = liveBoard.querySelector(':scope > .card-row-item[data-row-index="' + index + '"]');
      if (!item) return;
      const openCrossing = index === 1 && !crossingRevealed;
      const useOpen = centerOpen || openCrossing;
      const value = useOpen && position.openTransform ? position.openTransform : position.transform;
      if (!value) return;

      const x = Number(value.x);
      const y = Number(value.y);
      const scale = Number(value.scale);
      const rotation = Number(value.rotation);
      const zIndex = Number(value.zIndex);
      setImportant(item, 'position', 'absolute');
      setImportant(item, 'left', Math.round((Number.isFinite(x) ? x : 0) * CANVAS_W) + 'px');
      setImportant(item, 'top', Math.round((Number.isFinite(y) ? y : 0) * CANVAS_H) + 'px');
      setImportant(item, 'z-index', String(Number.isFinite(zIndex) ? zIndex : 1));
      item.style.setProperty('--row-card-scale', String(Number.isFinite(scale) ? scale : 1), 'important');
      item.style.setProperty('--row-card-rotation', (Number.isFinite(rotation) ? rotation : 0) + 'deg', 'important');
      item.classList.toggle('relphi-celtic-crossing-rotated', index === 1 && crossingRevealed && Math.abs(rotation) % 180 === 90);
      item.style.removeProperty('translate');
      delete item.dataset.relphiMiddleTranslateX;
      delete item.dataset.relphiStaffTranslateX;
    });
    return true;
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

  function constrainWorkspace(rootNode) {
    const workspace = rootNode.querySelector('.card-row-workspace');
    if (!workspace) return false;
    const viewportHeight = window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || 720;
    const rect = workspace.getBoundingClientRect();
    const available = Math.floor(viewportHeight - Math.max(0, rect.top) - GUTTER);
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

  function clearBoardAnchor(liveBoard) {
    if (!liveBoard) return;
    if (liveBoard.dataset.relphiCelticAnchorLeft !== undefined) {
      liveBoard.style.removeProperty('left');
      delete liveBoard.dataset.relphiCelticAnchorLeft;
    }
    if (liveBoard.dataset.relphiCelticAnchorTop !== undefined) {
      liveBoard.style.removeProperty('top');
      delete liveBoard.dataset.relphiCelticAnchorTop;
    }
  }

  function anchorBottomLeft(rootNode) {
    const workspace = rootNode.querySelector('.card-row-workspace');
    const liveBoard = board(rootNode);
    if (!workspace || !liveBoard) return false;

    const frame = workspace.getBoundingClientRect();
    const content = visualBounds(liveBoard);
    if (!content || !frame.width || !frame.height) return false;

    const targetLeft = frame.left + GUTTER;
    const targetBottom = frame.bottom - GUTTER;
    const dx = targetLeft - content.left;
    const dy = targetBottom - content.bottom;
    const computed = getComputedStyle(liveBoard);
    const currentLeft = Number.parseFloat(computed.left) || 0;
    const currentTop = Number.parseFloat(computed.top) || 0;

    setImportant(liveBoard, 'left', (currentLeft + dx).toFixed(2) + 'px');
    setImportant(liveBoard, 'top', (currentTop + dy).toFixed(2) + 'px');
    liveBoard.dataset.relphiCelticAnchorLeft = 'true';
    liveBoard.dataset.relphiCelticAnchorTop = 'true';
    return true;
  }

  function releaseWorkspace(rootNode) {
    const workspace = rootNode?.querySelector('.card-row-workspace');
    const liveBoard = board(rootNode);
    clearBoardAnchor(liveBoard);
    if (workspace?.dataset.relphiFoldPrevious !== undefined) {
      let old = {};
      try { old = JSON.parse(workspace.dataset.relphiFoldPrevious || '{}'); } catch (_) {}
      [['height',old.height],['min-height',old.minHeight],['max-height',old.maxHeight]].forEach(([property,value]) => {
        if (value) workspace.style.setProperty(property, value); else workspace.style.removeProperty(property);
      });
      delete workspace.dataset.relphiFoldPrevious;
    }
    rootNode?.classList.remove('relphi-celtic-readable','relphi-celtic-cross-unrevealed','relphi-celtic-geometry-pending','relphi-celtic-geometry-ready');
    if (rootNode) {
      delete rootNode.dataset.relphiCelticFoldFitDone;
      delete rootNode.dataset.relphiCelticPanReset;
    }
  }

  function resetFit(rootNode = root()) {
    if (!rootNode) return;
    delete rootNode.dataset.relphiCelticFoldFitDone;
    delete rootNode.dataset.relphiCelticAnchorComplete;
    clearBoardAnchor(board(rootNode));
    rootNode.classList.add('relphi-celtic-geometry-pending');
    rootNode.classList.remove('relphi-celtic-geometry-ready');
  }

  function resetPanOnce(rootNode) {
    if (rootNode.dataset.relphiCelticPanReset === 'true') return;
    rootNode.dataset.relphiCelticPanReset = 'true';
    document.getElementById('resetCardRowPan')?.click();
  }

  function fitOnce(rootNode) {
    if (fitting) return false;
    if (rootNode.dataset.relphiCelticFoldFitDone === 'true') return true;
    const workspace = rootNode.querySelector('.card-row-workspace');
    const liveBoard = board(rootNode);
    const zoom = document.getElementById('rowZoom');
    if (!workspace || !liveBoard || !zoom || !constrainWorkspace(rootNode)) return false;

    clearBoardAnchor(liveBoard);
    const content = visualBounds(liveBoard);
    const frame = workspace.getBoundingClientRect();
    if (!content || !frame.width || !frame.height) return false;

    const contentWidth = Math.max(1, content.right - content.left);
    const contentHeight = Math.max(1, content.bottom - content.top);
    const targetWidth = Math.max(1, frame.width - GUTTER * 2);
    const targetHeight = Math.max(1, frame.height - GUTTER * 2);
    const ratio = Math.min(targetWidth / contentWidth, targetHeight / contentHeight);
    const current = Number(zoom.value) || 1;
    const min = Number(zoom.min) > 0 ? Number(zoom.min) : .35;
    const max = Number(zoom.max) > 0 ? Number(zoom.max) : 2.4;
    const next = Math.max(min, Math.min(max, current * ratio * FIT_SAFETY));

    rootNode.dataset.relphiCelticFoldFitDone = 'true';
    if (Math.abs(next - current) < .006) return true;

    fitting = true;
    try {
      zoom.value = String(next);
      zoom.dispatchEvent(new Event('input', { bubbles:true }));
      zoom.dispatchEvent(new Event('change', { bubbles:true }));
    } finally {
      fitting = false;
    }

    // The native zoom handler rewrites both the board and item inline styles.
    // Re-run our canonical geometry on the next frame before anything is shown.
    requestAnimationFrame(schedule);
    return false;
  }

  function finishGeometry(rootNode) {
    if (!anchorBottomLeft(rootNode)) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (activeLayoutId() !== CELTIC_LAYOUT_ID) return;
      // Re-anchor once after layout has settled. This keeps the measured labels,
      // not merely the card faces, inside the visible gutter.
      applyCanonicalCeltic(rootNode);
      anchorBottomLeft(rootNode);
      rootNode.dataset.relphiCelticAnchorComplete = 'true';
      rootNode.classList.remove('relphi-celtic-geometry-pending');
      rootNode.classList.add('relphi-celtic-geometry-ready');
    }));
  }

  function apply() {
    queued = false;
    if (applying) return;
    const rootNode = root();
    if (!rootNode || rootNode.hidden) return;
    applying = true;
    try {
      installStyle();
      ownCardSurfaces(rootNode);
      if (activeLayoutId() !== CELTIC_LAYOUT_ID) {
        releaseWorkspace(rootNode);
        return;
      }
      rootNode.classList.add('relphi-celtic-readable','relphi-celtic-geometry-pending');
      resetPanOnce(rootNode);
      if (!applyCanonicalCeltic(rootNode)) return;
      if (!fitOnce(rootNode)) return;
      finishGeometry(rootNode);
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
  document.addEventListener('relphi:drawing-board-center-view', () => { resetFit(); schedule(); });
  document.addEventListener('change', event => {
    if (event.target?.matches?.('#relphiSpreadTemplateSelect')) {
      const rootNode = root();
      if (rootNode) {
        delete rootNode.dataset.relphiCelticPanReset;
        resetFit(rootNode);
      }
      schedule();
    }
  }, true);
  document.addEventListener('input', event => {
    if (!event.target?.matches?.('#rowZoom') || fitting || activeLayoutId() !== CELTIC_LAYOUT_ID) return;
    const rootNode = root();
    if (!rootNode) return;

    if (event.isTrusted) {
      // Manual zoom is respected, but the visible footprint still needs to be
      // re-anchored so its labels remain inside the gutter.
      rootNode.dataset.relphiCelticFoldFitDone = 'true';
      delete rootNode.dataset.relphiCelticAnchorComplete;
      clearBoardAnchor(board(rootNode));
      rootNode.classList.add('relphi-celtic-geometry-pending');
      rootNode.classList.remove('relphi-celtic-geometry-ready');
      schedule();
      return;
    }

    // The prefab module still has a generic mobile "fit extents" action that
    // measures card faces only. If it fires after our Celtic pass, its zoom can
    // put the top labels outside the clipped workspace. Reclaim ownership and
    // refit using the complete footprint (cards + labels).
    resetFit(rootNode);
    schedule();
  }, true);
  window.addEventListener('resize', () => { resetFit(); schedule(); }, { passive:true });

  installStyle();
  const initialRoot = root();
  if (initialRoot && activeLayoutId() === CELTIC_LAYOUT_ID) {
    initialRoot.classList.add('relphi-celtic-readable','relphi-celtic-geometry-pending');
  }
  apply();
})();