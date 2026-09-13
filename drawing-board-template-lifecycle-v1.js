// Drawing Board layout controller. This is the single owner of spread geometry,
// Celtic reveal geometry, and zoom-to-extents. It operates on board state through
// the native bridges; it does not rearrange a rendered spread as a corrective pass.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiDrawingBoardLayoutControllerV1) return;
  window.__relphiDrawingBoardLayoutControllerV1 = true;
  window.__relphiDrawingBoardTemplateLifecycleV1 = true;

  const PANEL = '#shortListPanel';
  const CELTIC_ID = 'celtic-cross-10';
  const CANVAS_W = 900;
  const CANVAS_H = 760;
  const GUTTER = 12;
  let syncing = false;
  let fitQueued = false;
  let revealPending = false;
  let startupAttempts = 0;

  const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
  const panel = () => document.querySelector(PANEL);
  const prefabBridge = () => window.RelphiDrawingBoardPrefabsBridge || null;
  const optionsBridge = () => window.RelphiDrawingBoardOptionsBridge || null;
  const registry = () => window.RelphiDrawingBoardSpreadPrefabs || null;
  function state() {
    try { return prefabBridge()?.getState?.() || null; }
    catch (_) { return null; }
  }
  function templates() {
    try { return registry()?.list?.() || registry()?.shipped || []; }
    catch (_) { return []; }
  }
  function templateById(id) { return templates().find(item => item?.id === id) || null; }
  function ordered(layout) {
    return Array.isArray(layout?.positions)
      ? layout.positions.slice().sort((a,b) => Number(a?.drawOrder || 0) - Number(b?.drawOrder || 0))
      : [];
  }
  function transform(x,y,rotation=0,scale=.45,zIndex=4) { return { x,y,rotation,scale,zIndex }; }

  function canonicalCeltic(source) {
    const base = clone(source || templateById(CELTIC_ID));
    if (!base) return null;
    const byId = new Map(ordered(base).map(item => [item.id,item]));
    const labels = {
      covering:'1 · What covers you', crossing:'2 · What crosses you',
      crowning:'3 · What crowns you', beneath:'4 · What is beneath you',
      behind:'5 · What is behind you', before:'6 · What is before you',
      self:'7 · Yourself', house:'8 · Your house',
      'hopes-fears':'9 · Your hopes or fears', outcome:'10 · What will come'
    };
    const spec = [
      ['covering', transform(.27,.335,0,.45,20), transform(.27,.335,0,.45,20)],
      ['crossing', transform(.27,.335,90,.45,30), transform(.385,.335,0,.45,30)],
      ['crowning', transform(.27,.065,0,.45,4)],
      ['beneath', transform(.27,.605,0,.45,4)],
      ['behind', transform(.055,.335,0,.45,4)],
      ['before', transform(.505,.335,0,.45,4)],
      ['self', transform(.715,.715,0,.45,4)],
      ['house', transform(.715,.49,0,.45,4)],
      ['hopes-fears', transform(.715,.265,0,.45,4)],
      ['outcome', transform(.715,.04,0,.45,4)]
    ];
    base.id = CELTIC_ID;
    base.name = 'Celtic Cross';
    base.cardCount = 10;
    base.source = 'shipped';
    base.editable = false;
    delete base.helper;
    base.positions = spec.map(([id,closed,open],index) => {
      const original = clone(byId.get(id) || {});
      return {
        ...original,
        id,
        label:labels[id],
        drawOrder:index + 1,
        transform:closed,
        ...(id === 'covering' ? { role:'covering' } : {}),
        ...(id === 'crossing' ? { role:'crossing',crosses:'covering' } : {}),
        ...(open ? { openTransform:open } : {}),
        canonicalTransform:open || closed
      };
    });
    base.rules = {
      ...(base.rules || {}),
      allowReversals:base.rules?.allowReversals !== false,
      allowRepeats:!!base.rules?.allowRepeats,
      drawScope:String(base.rules?.drawScope || 'full')
    };
    return base;
  }

  function customGrid(labels,rules={}) {
    const clean = (labels || []).map(v => String(v || '').trim()).filter(Boolean).slice(0,40);
    const count = clean.length;
    if (!count) return null;
    const cols = Math.min(count,count > 6 ? 3 : count > 3 ? 2 : count);
    const rows = Math.ceil(count / cols);
    const scale = count > 6 ? .52 : count > 3 ? .62 : .72;
    return {
      id:'use-once-' + Date.now().toString(36), name:'One-time layout', cardCount:count,
      source:'active', editable:false,
      positions:clean.map((label,index) => ({
        id:'position-' + (index + 1),label,drawOrder:index + 1,
        transform:{
          x:.05 + (index % cols) * (.82 / Math.max(1,cols - 1)),
          y:.08 + Math.floor(index / cols) * (.72 / Math.max(1,rows - 1)),
          rotation:0,scale,zIndex:1
        }
      })),
      rules:{ allowReversals:rules.reversals !== false,allowRepeats:!!rules.repeats,drawScope:String(rules.pack || 'full') }
    };
  }

  function preparedTemplate(id,draft={}) {
    const source = templateById(id);
    if (!source) return null;
    const ready = id === CELTIC_ID ? canonicalCeltic(source) : clone(source);
    const labels = (draft.labels || []).map(v => String(v || '').trim());
    if (labels.length) ordered(ready).forEach((position,index) => { if (labels[index]) position.label = labels[index]; });
    ready.rules = {
      ...(ready.rules || {}),
      allowReversals:draft.reversals !== false,
      allowRepeats:!!draft.repeats,
      drawScope:String(draft.pack || ready.rules?.drawScope || 'full')
    };
    return ready;
  }

  function blankSnapshot(snapshot) {
    return {
      ...snapshot,
      shortList:[],shortListSelection:[],shortListSelectMode:false,
      shortListPositionLabels:[],shortListPositionCardIds:[],rowCardReversals:{},
      rowEnvelopeLayout:{},rowCardTransforms:{},rowActiveLayout:null,rowPositionMeta:[],
      rowLayoutDesignMode:false,rowLayoutLocked:false,rowCenterOpen:false,
      rowEnvelopeArt:{},rowDrawDeck:[],rowDrawDeckSignature:'',rowShuffled:false,rowShuffleCount:0,
      rowDrawScope:'full',rowAllowReversals:true,rowAllowRepeats:false,
      rowZoom:1,rowPanX:0,rowPanY:0,rowTransformTarget:0
    };
  }

  function resetBoard() {
    const bridge = optionsBridge();
    if (!bridge?.capture || !bridge?.restore) return false;
    syncing = true;
    try {
      bridge.restore(blankSnapshot(bridge.capture()));
      panel()?.classList.remove('relphi-celtic-readable','relphi-celtic-cross-unrevealed','relphi-layout-settling');
      return true;
    } finally { syncing = false; }
  }

  function applyLayout(layout) {
    const bridge = prefabBridge();
    if (!bridge?.applyLayout || !layout) return false;
    const live = state();
    if (live?.hasCards || live?.locked || live?.slotCount) resetBoard();
    const root = panel();
    root?.classList.add('relphi-layout-settling');
    window.RelphiDrawingBoardSetPositionStickers?.(true);
    syncing = true;
    let applied = false;
    try { applied = !!bridge.applyLayout(clone(layout),{designMode:false}); }
    finally { syncing = false; }
    if (applied) requestAnimationFrame(() => requestAnimationFrame(() => fitExtents({revealAfter:true})));
    else root?.classList.remove('relphi-layout-settling');
    return applied;
  }

  function applyDraft(draft={}) {
    const id = String(draft.template || '');
    const layout = id ? preparedTemplate(id,draft) : customGrid(draft.labels,draft);
    if (!layout) {
      resetBoard();
      return true;
    }
    return applyLayout(layout);
  }

  function stateTransform(value={}) {
    return {
      x:Number(value.x)||0,y:Number(value.y)||0,rotation:Number(value.rotation)||0,
      scale:Number(value.scale)||1,zIndex:Number(value.zIndex)||1
    };
  }
  function setSnapshotPosition(snapshot,index,value) {
    const t = stateTransform(value);
    snapshot.rowEnvelopeLayout ||= {};
    snapshot.rowCardTransforms ||= {};
    snapshot.rowEnvelopeLayout[index] = {x:t.x * CANVAS_W,y:t.y * CANVAS_H};
    snapshot.rowCardTransforms[index] = {scale:t.scale,rotation:t.rotation,zIndex:t.zIndex};
  }
  function celticRevealShouldBeClosed(snapshot) {
    return !!(snapshot?.shortList?.[1] || snapshot?.shortListPositionCardIds?.[1]);
  }

  function syncCelticState() {
    if (syncing) return false;
    const bridge = optionsBridge();
    const live = state();
    if (!bridge?.capture || !bridge?.restore || live?.activeLayout?.id !== CELTIC_ID) return false;
    const canonical = canonicalCeltic(templateById(CELTIC_ID) || live.activeLayout);
    if (!canonical) return false;
    const snapshot = bridge.capture();
    const closed = celticRevealShouldBeClosed(snapshot);
    const crossing = ordered(canonical)[1];
    const wanted = closed ? crossing.transform : crossing.openTransform;
    const point = snapshot.rowEnvelopeLayout?.[1];
    const cardT = snapshot.rowCardTransforms?.[1];
    const wx = wanted.x * CANVAS_W,wy = wanted.y * CANVAS_H;
    const already = point && cardT && Math.abs(Number(point.x)-wx)<.5 && Math.abs(Number(point.y)-wy)<.5 && Math.abs(Number(cardT.rotation)-Number(wanted.rotation))<.1;
    const root = panel();
    root?.classList.add('relphi-celtic-readable');
    root?.classList.toggle('relphi-celtic-cross-unrevealed',!closed);
    if (already) return false;
    syncing = true;
    try {
      setSnapshotPosition(snapshot,1,wanted);
      snapshot.rowActiveLayout = canonical;
      snapshot.rowPositionMeta = ordered(canonical).map((position,index) => ({
        id:position.id || ('position-' + (index + 1)),role:position.role || '',covers:position.covers || '',crosses:position.crosses || '',
        openTransform:position.openTransform ? clone(position.openTransform) : null
      }));
      bridge.restore(snapshot);
    } finally { syncing = false; }
    return true;
  }

  function canonicalizePersistedCeltic() {
    if (syncing) return false;
    const bridge = optionsBridge();
    const live = state();
    if (!bridge?.capture || !bridge?.restore || live?.activeLayout?.id !== CELTIC_ID) return false;
    const canonical = canonicalCeltic(templateById(CELTIC_ID) || live.activeLayout);
    if (!canonical) return false;
    const snapshot = bridge.capture();
    const closed = celticRevealShouldBeClosed(snapshot);
    const positions = ordered(canonical);
    syncing = true;
    panel()?.classList.add('relphi-layout-settling','relphi-celtic-readable');
    try {
      positions.forEach((position,index) => setSnapshotPosition(snapshot,index,index === 1 && !closed && position.openTransform ? position.openTransform : position.transform));
      snapshot.shortListPositionLabels = positions.map(position => position.label);
      snapshot.rowActiveLayout = canonical;
      snapshot.rowPositionMeta = positions.map((position,index) => ({
        id:position.id || ('position-' + (index + 1)),role:position.role || '',covers:position.covers || '',crosses:position.crosses || '',
        openTransform:position.openTransform ? clone(position.openTransform) : null
      }));
      snapshot.rowLayoutLocked = true;
      bridge.restore(snapshot);
    } finally { syncing = false; }
    requestAnimationFrame(() => requestAnimationFrame(() => fitExtents({revealAfter:true})));
    return true;
  }

  function tagSemanticPositions() {
    const root = panel();
    const live = state();
    const board = root?.querySelector('.card-row-board');
    if (!root || !board) return;
    const isCeltic = live?.activeLayout?.id === CELTIC_ID;
    root.classList.toggle('relphi-celtic-readable',isCeltic);
    if (!isCeltic) return;
    ordered(live.activeLayout).forEach((position,index) => {
      const item = board.querySelector(':scope > .card-row-item[data-row-index="' + index + '"]');
      if (!item) return;
      Array.from(item.classList).filter(name => name.startsWith('relphi-role-')).forEach(name => item.classList.remove(name));
      item.classList.add('relphi-role-' + String(position.id || 'position').replace(/[^a-z0-9-]/gi,'-').toLowerCase());
    });
    const crossing = board.querySelector(':scope > .card-row-item[data-row-index="1"]');
    const closed = !!crossing?.querySelector('[data-row-card]');
    root.classList.toggle('relphi-celtic-cross-unrevealed',!closed);
    crossing?.classList.toggle('relphi-celtic-crossing-rotated',closed);
  }

  function contentBounds() {
    const board = panel()?.querySelector('.card-row-board');
    if (!board) return null;
    const nodes = [];
    board.querySelectorAll(':scope > .card-row-item').forEach(item => {
      const face = item.querySelector(':scope > .card-row-card-wrap,:scope > .card-row-drop-card');
      const label = item.querySelector(':scope > .card-row-position-panel');
      if (face) nodes.push(face);
      if (label && getComputedStyle(label).display !== 'none') nodes.push(label);
    });
    const rects = nodes.map(node => node.getBoundingClientRect()).filter(rect => rect.width > 0 && rect.height > 0);
    if (!rects.length) return null;
    return {
      left:Math.min(...rects.map(rect=>rect.left)),right:Math.max(...rects.map(rect=>rect.right)),
      top:Math.min(...rects.map(rect=>rect.top)),bottom:Math.max(...rects.map(rect=>rect.bottom))
    };
  }

  function setViewportState(zoom,panX,panY) {
    const bridge = optionsBridge();
    if (!bridge?.capture || !bridge?.restore) return false;
    const snapshot = bridge.capture();
    snapshot.rowZoom = zoom;
    snapshot.rowPanX = panX;
    snapshot.rowPanY = panY;
    syncing = true;
    try { bridge.restore(snapshot); }
    finally { syncing = false; }
    return true;
  }

  function finishFit() {
    if (revealPending) panel()?.classList.remove('relphi-layout-settling');
    revealPending = false;
    fitQueued = false;
  }

  function fitExtents(options={}) {
    if (options.revealAfter) revealPending = true;
    if (fitQueued) return;
    fitQueued = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const root = panel();
      const workspace = root?.querySelector('.card-row-workspace');
      const zoomInput = root?.querySelector('#rowZoom');
      const bounds = contentBounds();
      if (!workspace || !zoomInput || !bounds) {
        finishFit();
        return;
      }
      const frame = workspace.getBoundingClientRect();
      const currentZoom = Number(zoomInput.value) || 1;
      const contentW = Math.max(1,bounds.right - bounds.left);
      const contentH = Math.max(1,bounds.bottom - bounds.top);
      const ratio = Math.min(Math.max(1,frame.width - GUTTER*2)/contentW,Math.max(1,frame.height - GUTTER*2)/contentH);
      const nextZoom = Math.max(.35,Math.min(2.4,currentZoom * ratio));
      setViewportState(nextZoom,0,0);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        tagSemanticPositions();
        const liveWorkspace = panel()?.querySelector('.card-row-workspace');
        const nextBounds = contentBounds();
        if (!liveWorkspace || !nextBounds) {
          finishFit();
          return;
        }
        const nextFrame = liveWorkspace.getBoundingClientRect();
        const dx = nextFrame.left + (nextFrame.width - (nextBounds.right - nextBounds.left))/2 - nextBounds.left;
        const dy = nextFrame.top + (nextFrame.height - (nextBounds.bottom - nextBounds.top))/2 - nextBounds.top;
        setViewportState(nextZoom,dx,dy);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          tagSemanticPositions();
          finishFit();
        }));
      }));
    }));
  }

  function ownExtentsButton() {
    const button = panel()?.querySelector('#zoomCardRowExtents');
    if (button) button.dataset.relphiLayoutController = 'true';
  }
  function onRendered() {
    ownExtentsButton();
    tagSemanticPositions();
    syncCelticState();
  }

  function installStyle() {
    if (document.getElementById('relphi-layout-controller-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-layout-controller-style';
    style.textContent = `
      #shortListPanel.relphi-layout-settling .card-row-board>.card-row-item{visibility:hidden!important}
      #shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item{position:absolute!important}
      #shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item>.card-row-position-panel{overflow:visible!important;height:auto!important;max-height:none!important;white-space:normal!important;z-index:180!important}

      /* Celtic label placement belongs here, alongside Celtic position geometry.
         Match the generic renderer's structural selector and add the semantic state,
         so the generic !important defaults cannot partially win the cascade. */
      html body #shortListPanel.relphi-celtic-readable .card-row-workspace .short-list-row.card-row-board>.card-row-item[data-row-index="0"]>.card-row-position-panel,
      html body #shortListPanel.relphi-celtic-readable .card-row-workspace .short-list-row.card-row-board>.card-row-item[data-row-index="1"]>.card-row-position-panel,
      html body #shortListPanel.relphi-celtic-readable .card-row-workspace .short-list-row.card-row-board>.card-row-item[data-row-index="2"]>.card-row-position-panel,
      html body #shortListPanel.relphi-celtic-readable .card-row-workspace .short-list-row.card-row-board>.card-row-item[data-row-index="3"]>.card-row-position-panel,
      html body #shortListPanel.relphi-celtic-readable .card-row-workspace .short-list-row.card-row-board>.card-row-item[data-row-index="4"]>.card-row-position-panel,
      html body #shortListPanel.relphi-celtic-readable .card-row-workspace .short-list-row.card-row-board>.card-row-item[data-row-index="5"]>.card-row-position-panel{left:0!important;right:auto!important;top:auto!important;bottom:calc(100% + 4px)!important;width:100%!important;max-width:100%!important;margin:0!important;transform:none!important;text-align:center!important}

      html body #shortListPanel.relphi-celtic-readable .card-row-workspace .short-list-row.card-row-board>.card-row-item.relphi-role-self>.card-row-position-panel,
      html body #shortListPanel.relphi-celtic-readable .card-row-workspace .short-list-row.card-row-board>.card-row-item.relphi-role-house>.card-row-position-panel,
      html body #shortListPanel.relphi-celtic-readable .card-row-workspace .short-list-row.card-row-board>.card-row-item.relphi-role-hopes-fears>.card-row-position-panel,
      html body #shortListPanel.relphi-celtic-readable .card-row-workspace .short-list-row.card-row-board>.card-row-item.relphi-role-outcome>.card-row-position-panel{left:calc(100% + 10px)!important;right:auto!important;top:50%!important;bottom:auto!important;width:160px!important;max-width:160px!important;min-width:160px!important;margin:0!important;transform:translateY(-50%)!important;text-align:left!important}
      #shortListPanel.relphi-celtic-readable.relphi-celtic-cross-unrevealed .relphi-center-helper{display:none!important}
    `;
    document.head.appendChild(style);
  }

  document.addEventListener('click',event => {
    const button = event.target.closest?.('#zoomCardRowExtents');
    if (!button || !button.closest(PANEL)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    fitExtents();
  },true);
  document.addEventListener('relphi:drawing-board-rendered',onRendered);
  window.addEventListener('resize',() => { if (state()?.activeLayout?.id) fitExtents(); },{passive:true});

  function startup() {
    installStyle();
    startupAttempts += 1;
    if (!panel() || !prefabBridge() || !optionsBridge() || !registry()) {
      if (startupAttempts < 120) window.setTimeout(startup,25);
      return;
    }
    if (state()?.activeLayout?.id === CELTIC_ID) canonicalizePersistedCeltic();
    else onRendered();
  }

  window.RelphiDrawingBoardLayoutController = Object.freeze({
    applyDraft,
    applyTemplate(id,draft={}) { return applyLayout(preparedTemplate(id,draft)); },
    resetBoard,fitExtents,canonicalCeltic,getTemplate:templateById
  });
  window.RelphiDrawingBoardTemplateLifecycle = Object.freeze({retired:true,owner:'layout-controller'});
  startup();
})();