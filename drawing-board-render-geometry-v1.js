// Drawing Board stability: current UI readiness + native Celtic state integrity.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiDrawingBoardRenderGeometryV1) return;
  window.__relphiDrawingBoardRenderGeometryV1 = true;

  const PANEL = '#shortListPanel';
  const CELTIC_ID = 'celtic-cross-10';
  const CANVAS_W = 900;
  const CANVAS_H = 760;
  const RADIUS = '.72rem';
  let visualQueued = false;
  let guardQueued = false;
  let restoring = false;

  function root() { return document.querySelector(PANEL); }
  function board(rootNode = root()) { return rootNode?.querySelector('.card-row-board') || null; }
  function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
  function prefabBridge() { return window.RelphiDrawingBoardPrefabsBridge; }
  function optionsBridge() { return window.RelphiDrawingBoardOptionsBridge; }
  function state() {
    try { return prefabBridge()?.getState?.() || null; }
    catch (_) { return null; }
  }
  function orderedPositions(layout) {
    return Array.isArray(layout?.positions)
      ? layout.positions.slice().sort((a,b) => Number(a?.drawOrder || 0) - Number(b?.drawOrder || 0))
      : [];
  }
  function shippedCeltic() {
    try {
      return (window.RelphiDrawingBoardSpreadPrefabs?.list?.() || [])
        .find(item => item?.id === CELTIC_ID && item?.source === 'shipped') || null;
    } catch (_) { return null; }
  }
  function number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  function normalizedTransform(value = {}) {
    return {
      x:Math.max(0, Math.min(1, number(value.x))),
      y:Math.max(0, Math.min(1, number(value.y))),
      rotation:Math.max(-180, Math.min(180, number(value.rotation))),
      scale:Math.max(.45, Math.min(2.5, number(value.scale, 1))),
      zIndex:Math.max(1, Math.min(999, Math.round(number(value.zIndex, 1))))
    };
  }
  function setImportant(node, property, value) {
    if (!node) return;
    if (node.style.getPropertyValue(property) === value && node.style.getPropertyPriority(property) === 'important') return;
    node.style.setProperty(property, value, 'important');
  }

  function installStyle() {
    if (document.getElementById('relphi-render-geometry-style-v1')) return;
    const style = document.createElement('style');
    style.id = 'relphi-render-geometry-style-v1';
    style.textContent = [
      '#shortListPanel.relphi-celtic-state-pending .card-row-board{visibility:hidden!important}',
      '#shortListPanel .card-row-board>.card-row-item::before,#shortListPanel .card-row-board>.card-row-item::after{content:none!important;display:none!important}',
      '#shortListPanel .card-row-board>.card-row-item>.card-row-card-wrap::before,#shortListPanel .card-row-board>.card-row-item>.card-row-card-wrap::after,#shortListPanel .card-row-board>.card-row-placeholder-item>.card-row-drop-card::before,#shortListPanel .card-row-board>.card-row-placeholder-item>.card-row-drop-card::after{content:none!important;display:none!important}',
      '#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="0"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="1"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="2"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="3"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="4"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="5"]>.card-row-position-panel{top:0!important;bottom:auto!important;margin:0!important;transform:translateY(-100%)!important}',
      '#shortListPanel.relphi-celtic-readable.relphi-celtic-cross-unrevealed .relphi-center-helper{display:none!important}'
    ].join('');
    document.head.appendChild(style);
  }

  function expectedStructure(prefab) {
    const positions = orderedPositions(prefab);
    const envelope = {};
    const transforms = {};
    const meta = [];
    positions.forEach((position,index) => {
      const t = normalizedTransform(position.canonicalTransform || position.transform);
      envelope[index] = { x:t.x * CANVAS_W, y:t.y * CANVAS_H };
      transforms[index] = { scale:t.scale, rotation:t.rotation, zIndex:t.zIndex };
      meta[index] = {
        id:String(position.id || ('position-' + (index + 1))),
        role:String(position.role || ''),
        covers:String(position.covers || ''),
        crosses:String(position.crosses || ''),
        openTransform:position.openTransform ? normalizedTransform(position.openTransform) : null
      };
    });
    return { positions, envelope, transforms, meta };
  }

  function structureIsCanonical(snapshot, prefab) {
    if (!snapshot || snapshot.rowActiveLayout?.id !== CELTIC_ID) return false;
    const expected = expectedStructure(prefab);
    if (expected.positions.length !== 10) return false;
    return expected.positions.every((position,index) => {
      const point = snapshot.rowEnvelopeLayout?.[index];
      const transform = snapshot.rowCardTransforms?.[index];
      const exPoint = expected.envelope[index];
      const exTransform = expected.transforms[index];
      return point && transform &&
        Math.abs(number(point.x) - exPoint.x) < .5 &&
        Math.abs(number(point.y) - exPoint.y) < .5 &&
        Math.abs(number(transform.scale,1) - exTransform.scale) < .001 &&
        Math.abs(number(transform.rotation) - exTransform.rotation) < .1;
    });
  }

  function canonicalSnapshot(snapshot, prefab) {
    const expected = expectedStructure(prefab);
    const labels = expected.positions.map((position,index) => String(position.label || ('Position ' + (index + 1))).slice(0,90));
    const ids = Array.from({ length:expected.positions.length }, (_,index) => String(snapshot.shortListPositionCardIds?.[index] || ''));
    const activeLayout = clone({
      ...prefab,
      cardCount:expected.positions.length,
      positions:expected.positions.map((position,index) => ({
        ...clone(position),
        drawOrder:index + 1,
        transform:normalizedTransform(position.canonicalTransform || position.transform),
        openTransform:position.openTransform ? normalizedTransform(position.openTransform) : null
      }))
    });
    return {
      ...snapshot,
      shortListPositionLabels:labels,
      shortListPositionCardIds:ids,
      rowEnvelopeLayout:expected.envelope,
      rowCardTransforms:expected.transforms,
      rowActiveLayout:activeLayout,
      rowPositionMeta:expected.meta,
      rowLayoutDesignMode:false,
      rowLayoutLocked:true,
      rowCenterOpen:false
    };
  }

  function activeOrSelectedCeltic() {
    const live = state();
    const select = root()?.querySelector('#relphiSpreadTemplateSelect');
    return live?.activeLayout?.id === CELTIC_ID || select?.value === CELTIC_ID;
  }

  function canonicalizeCeltic() {
    if (restoring) return false;
    const rootNode = root();
    const prefab = shippedCeltic();
    const pBridge = prefabBridge();
    if (!rootNode || !prefab || !pBridge || !activeOrSelectedCeltic()) return false;

    let live = state();
    const select = rootNode.querySelector('#relphiSpreadTemplateSelect');
    if (live?.activeLayout?.id !== CELTIC_ID && select?.value === CELTIC_ID && !live?.hasCards && !live?.locked) {
      pBridge.applyLayout?.(clone(prefab), { designMode:false });
      live = state();
    }
    if (live?.activeLayout?.id !== CELTIC_ID) return false;

    const bridge = optionsBridge();
    if (!bridge?.capture || !bridge?.restore) return false;
    const snapshot = bridge.capture();
    if (structureIsCanonical(snapshot,prefab)) {
      rootNode.classList.remove('relphi-celtic-state-pending');
      return true;
    }

    rootNode.classList.add('relphi-celtic-state-pending');
    restoring = true;
    try {
      bridge.restore(canonicalSnapshot(snapshot,prefab));
    } finally {
      restoring = false;
    }
    rootNode.classList.remove('relphi-celtic-state-pending');
    return true;
  }

  function ownCardSurfaces(rootNode) {
    const liveBoard = board(rootNode);
    if (!liveBoard) return;
    liveBoard.querySelectorAll(':scope > .card-row-item').forEach(item => {
      setImportant(item,'background','transparent');
      setImportant(item,'background-color','transparent');
      setImportant(item,'border','0px');
      setImportant(item,'outline','0px');
      setImportant(item,'box-shadow','none');
      const wrap = item.querySelector(':scope > .card-row-card-wrap');
      const drop = item.querySelector(':scope > .card-row-drop-card');
      [wrap,drop].filter(Boolean).forEach(surface => {
        setImportant(surface,'border-radius',RADIUS);
        setImportant(surface,'overflow','hidden');
        setImportant(surface,'clip-path','inset(0 round ' + RADIUS + ')');
        setImportant(surface,'background-clip','padding-box');
        setImportant(surface,'border','0px');
        setImportant(surface,'outline','0px');
        setImportant(surface,'box-shadow','none');
      });
    });
  }

  function syncVisual() {
    visualQueued = false;
    const rootNode = root();
    if (!rootNode || rootNode.hidden) return;
    const live = state();
    const isCeltic = live?.activeLayout?.id === CELTIC_ID;
    rootNode.classList.toggle('relphi-celtic-readable',isCeltic);
    if (!isCeltic) {
      rootNode.classList.remove('relphi-celtic-cross-unrevealed','relphi-celtic-state-pending');
      ownCardSurfaces(rootNode);
      return;
    }

    ownCardSurfaces(rootNode);
    const liveBoard = board(rootNode);
    const crossing = liveBoard?.querySelector(':scope > .card-row-item[data-row-index="1"]');
    const position = orderedPositions(live.activeLayout)[1];
    if (!crossing || !position) return;

    const revealed = !!crossing.querySelector('[data-row-card]');
    rootNode.classList.toggle('relphi-celtic-cross-unrevealed',!revealed);
    rootNode.dataset.relphiCelticCrossRevealState = revealed ? 'revealed' : 'unrevealed';
    const value = normalizedTransform(!revealed && position.openTransform ? position.openTransform : position.transform);
    setImportant(crossing,'left',Math.round(value.x * CANVAS_W) + 'px');
    setImportant(crossing,'top',Math.round(value.y * CANVAS_H) + 'px');
    setImportant(crossing,'z-index',String(value.zIndex));
    crossing.style.setProperty('--row-card-scale',String(value.scale),'important');
    crossing.style.setProperty('--row-card-rotation',value.rotation + 'deg','important');
    crossing.classList.toggle('relphi-celtic-crossing-rotated',revealed && Math.abs(value.rotation) % 180 === 90);
  }

  function currentUiReady(rootNode) {
    const drawer = rootNode?.querySelector('.relphi-reading-options-drawer');
    const bar = drawer?.querySelector(':scope > .relphi-options-commit-bar[data-relphi-transactional="true"]');
    const spread = drawer?.querySelector('.board-setup-group--spread');
    const library = spread?.querySelector('.relphi-spread-prefab-library');
    const select = library?.querySelector('#relphiSpreadTemplateSelect');
    const builder = spread?.querySelector('.relphi-label-builder');
    const zoomRow = rootNode?.querySelector('.card-row-workspace-toolbar .relphi-zoom-row');
    const fit = zoomRow?.querySelector('#zoomCardRowExtents');
    if (!drawer || !bar || !spread || !library || !select || !builder || !zoomRow || !fit) return false;
    if (state()?.activeLayout?.id === CELTIC_ID) {
      const bridge = optionsBridge();
      const prefab = shippedCeltic();
      if (bridge?.capture && prefab && !structureIsCanonical(bridge.capture(),prefab)) return false;
    }
    return true;
  }

  function guardCurrentUi() {
    guardQueued = false;
    const rootNode = root();
    if (!rootNode || rootNode.hidden) return;
    rootNode.classList.toggle('relphi-drawing-board-ui-ready',currentUiReady(rootNode));
  }
  function scheduleVisual() {
    if (visualQueued) return;
    visualQueued = true;
    requestAnimationFrame(() => requestAnimationFrame(syncVisual));
  }
  function scheduleGuard() {
    if (guardQueued) return;
    guardQueued = true;
    requestAnimationFrame(guardCurrentUi);
  }
  function settleCeltic() {
    canonicalizeCeltic();
    scheduleVisual();
    scheduleGuard();
  }

  installStyle();

  document.addEventListener('relphi:drawing-board-rendered', () => {
    scheduleVisual();
    scheduleGuard();
  });
  document.addEventListener('change', event => {
    if (!event.target?.matches?.('#relphiSpreadTemplateSelect')) return;
    window.setTimeout(settleCeltic,0);
  });
  window.addEventListener('relphi:tarot-enhancements-ready', settleCeltic);

  const startObserver = () => {
    const rootNode = root();
    if (!rootNode) return window.setTimeout(startObserver,30);
    new MutationObserver(() => scheduleGuard()).observe(rootNode,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    let attempts = 0;
    const initial = () => {
      attempts += 1;
      const done = canonicalizeCeltic();
      scheduleVisual();
      scheduleGuard();
      if (!done && attempts < 20) window.setTimeout(initial,30);
    };
    initial();
  };
  startObserver();
})();