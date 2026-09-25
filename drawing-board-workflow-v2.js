// Oracle of Relphi Drawing Board enhancement layer.
// Native board state and rendering remain owned by tarot-app.js. This file owns
// only the stable Drawing Board UI, shipped spread definitions, and reading flow.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiDrawingBoardUnifiedV3) return;
  window.__relphiDrawingBoardUnifiedV3 = true;

  const PANEL_ID = 'shortListPanel';
  const CUSTOM_TEMPLATE_KEY = 'relphiDrawingBoardSpreadTemplatesV3';
  const STICKER_VISIBILITY_KEY = 'relphiDrawingBoardPositionStickersV3';
  const CANVAS_W = 900;
  const CANVAS_H = 760;
  const CARD_W = 174;
  const CARD_H = CARD_W * 866 / 500;
  const LABEL_H = 68;
  const GUTTER = 12;
  const MAX_POSITIONS = 50; // 10×5 dense packing stays above the supported .32 card scale.

  let boardOpen = false;
  let initialized = false;
  let optionsSession = null;
  let focusIndex = -1;
  let suppressStripClickUntil = 0;
  let pendingFocusIndex = null;
  let activeDraw = false;
  let openTool = '';
  let transformEditingUnlocked = false;
  let showPositionStickers = readStickerVisibility();

  function panel() { return document.getElementById(PANEL_ID); }
  function prefabBridge() { return window.RelphiDrawingBoardPrefabsBridge || null; }
  function optionsBridge() { return window.RelphiDrawingBoardOptionsBridge || null; }
  function ledgerBridge() { return window.RelphiTarotLedgerBridge || null; }
  function zoomLimits() {
    const limits=optionsBridge()?.zoomLimits || {};
    const min=Number(limits.min),max=Number(limits.max);
    return {
      min:Number.isFinite(min)&&min>0?min:.02,
      max:Number.isFinite(max)&&max>0?max:2.4
    };
  }
  function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || 0)); }
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch]));
  }
  function slug(value) {
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60) || 'custom-spread';
  }
  function transform(x, y, scale = .66, rotation = 0, zIndex = 1) {
    return { x, y, scale, rotation, zIndex };
  }
  function position(id, label, drawOrder, point, extra = {}) {
    return { id, label, drawOrder, transform:point, ...extra };
  }

  function legacyGenericPositions(labels) {
    const count = Math.max(1, labels.length);
    if (count === 1) return [position('position-1', labels[0], 1, transform(.40,.22,1))];
    if (count <= 3) {
      const xs = count === 2 ? [.18,.58] : [.055,.355,.655];
      return labels.map((label,index) => position(`position-${index+1}`,label,index+1,transform(xs[index],.24,.88)));
    }
    if (count <= 6) {
      const xs = [.055,.355,.655], ys = [.10,.56];
      return labels.map((label,index) => position(`position-${index+1}`,label,index+1,transform(xs[index%3],ys[Math.floor(index/3)],.74)));
    }
    const cols = 4;
    const rows = Math.ceil(count / cols);
    const xs = [.015,.25,.485,.72];
    const ys = rows <= 2 ? [.12,.56] : rows === 3 ? [.02,.34,.66] : Array.from({length:rows},(_,i)=>.015+i*(.93/Math.max(1,rows-1)));
    const scale = rows <= 3 ? .62 : .52;
    return labels.map((label,index) => position(`position-${index+1}`,label,index+1,transform(xs[index%cols],ys[Math.floor(index/cols)],scale)));
  }
  function genericPositions(labels) {
    const count = Math.max(1, labels.length);
    if (count <= 12) return legacyGenericPositions(labels);
    let best=null;
    const maxCols=Math.min(10,count);
    for (let cols=3;cols<=maxCols;cols++) {
      const rows=Math.ceil(count/cols);
      const scaleX=(CANVAS_W-GUTTER*2-GUTTER*Math.max(0,cols-1))/(CARD_W*cols);
      const scaleY=(CANVAS_H-GUTTER*2-GUTTER*Math.max(0,rows-1))/((CARD_H+LABEL_H)*rows);
      const scale=Math.min(.62,scaleX,scaleY);
      if (!best || scale>best.scale+.002 || (Math.abs(scale-best.scale)<=.002 && cols<best.cols)) best={cols,rows,scale};
    }
    const cols=best?.cols || 4;
    const rows=best?.rows || Math.ceil(count/cols);
    const scale=clamp(best?.scale || .52,.32,.62);
    const cardW=CARD_W*scale;
    const rowH=(CARD_H+LABEL_H)*scale;
    const gapX=cols>1?Math.max(GUTTER,(CANVAS_W-GUTTER*2-cardW*cols)/(cols-1)):0;
    const gapY=rows>1?Math.max(GUTTER,(CANVAS_H-GUTTER*2-rowH*rows)/(rows-1)):0;
    return labels.map((label,index)=>{
      const col=index%cols,row=Math.floor(index/cols);
      const x=(GUTTER+col*(cardW+gapX))/CANVAS_W;
      const y=(GUTTER+LABEL_H*scale+row*(rowH+gapY))/CANVAS_H;
      return position(`position-${index+1}`,label,index+1,transform(x,y,scale));
    });
  }
  function legacyDenseAutoLayout(layout) {
    const positions=Array.isArray(layout?.positions)?layout.positions.slice().sort((a,b)=>Number(a.drawOrder)-Number(b.drawOrder)):[];
    if (layout?.id!=='custom-active' || positions.length<=12) return false;
    const labels=positions.map((item,index)=>String(item.label || `Position ${index+1}`));
    const expected=legacyGenericPositions(labels);
    const close=(a,b)=>Math.abs(Number(a)-Number(b))<.0015;
    return positions.every((item,index)=>{
      const actual=item?.transform || {};
      const old=expected[index]?.transform || {};
      return close(actual.x,old.x)&&close(actual.y,old.y)&&close(actual.scale,old.scale)&&close(actual.rotation||0,old.rotation||0);
    });
  }
  function migrateLegacyDenseAutoLayout(root) {
    const state=currentPrefabState();
    const layout=state.activeLayout;
    if (!root || !layout || !legacyDenseAutoLayout(layout)) return false;
    const bridge=optionsBridge();
    const snap=bridge?.capture?.();
    if (!snap) return false;
    const ordered=layout.positions.slice().sort((a,b)=>Number(a.drawOrder)-Number(b.drawOrder));
    const packed=genericPositions(ordered.map((item,index)=>String(item.label || `Position ${index+1}`)));
    const nextLayout=clone(layout);
    nextLayout.positions=ordered.map((item,index)=>({
      ...clone(item),
      transform:clone(packed[index].transform),
      drawOrder:index+1
    }));
    snap.rowActiveLayout=nextLayout;
    snap.rowEnvelopeLayout={};
    snap.rowCardTransforms={};
    nextLayout.positions.forEach((item,index)=>{
      const value=item.transform;
      snap.rowEnvelopeLayout[index]={x:value.x*CANVAS_W,y:value.y*CANVAS_H};
      snap.rowCardTransforms[index]={scale:value.scale,rotation:value.rotation||0,zIndex:value.zIndex||1};
    });
    snap.rowPanX=0;
    snap.rowPanY=0;
    bridge.restore(snap);
    setTimeout(zoomExtents,0);
    return true;
  }

  const CELTIC_LABELS = [
    '1 · What covers you',
    '2 · What crosses you',
    '3 · What crowns you',
    '4 · What is beneath you',
    '5 · What is behind you',
    '6 · What is before you',
    '7 · Yourself',
    '8 · Your house',
    '9 · Your hopes or fears',
    '10 · What will come'
  ];
  const CELTIC_CROSS = {
    version:1,
    id:'celtic-cross-10',
    name:'Celtic Cross',
    cardCount:10,
    source:'shipped',
    editable:false,
    positions:[
      position('covering', CELTIC_LABELS[0], 1, transform(.20,.34,.48,0,20), { role:'covering' }),
      position('crossing', CELTIC_LABELS[1], 2, transform(.20,.34,.48,90,30), {
        role:'crossing', crosses:'covering',
        canonicalTransform:transform(.35,.34,.48,0,30),
        crossedTransform:transform(.20,.34,.48,90,30)
      }),
      position('crowning', CELTIC_LABELS[2], 3, transform(.20,.02,.48,0,4), { role:'crowning' }),
      position('beneath', CELTIC_LABELS[3], 4, transform(.20,.66,.48,0,4), { role:'beneath' }),
      position('behind', CELTIC_LABELS[4], 5, transform(.015,.34,.48,0,4), { role:'behind' }),
      position('before', CELTIC_LABELS[5], 6, transform(.49,.34,.48,0,4), { role:'before' }),
      position('self', CELTIC_LABELS[6], 7, transform(.70,.69,.44,0,4), { role:'self' }),
      position('house', CELTIC_LABELS[7], 8, transform(.70,.46,.44,0,4), { role:'house' }),
      position('hopes-fears', CELTIC_LABELS[8], 9, transform(.70,.23,.44,0,4), { role:'hopes-fears' }),
      position('outcome', CELTIC_LABELS[9], 10, transform(.70,.00,.44,0,4), { role:'outcome' })
    ],
    rules:{ allowReversals:true, allowRepeats:false, drawScope:'full' }
  };

  const SATURN_LABELS = [
    '1 · The structure', '2 · The pressure', '3 · The limit',
    '4 · What is tested', '5 · The center', '6 · What matures',
    '7 · Responsibility', '8 · Discipline', '9 · Integration'
  ];
  const SATURN_POINTS = [
    [.04,.04],[.36,.04],[.68,.04],
    [.04,.37],[.36,.37],[.68,.37],
    [.04,.70],[.36,.70],[.68,.70]
  ];
  const SATURN_SQUARE = {
    version:1,id:'saturn-square-9',name:'Saturn Square',cardCount:9,source:'shipped',editable:false,
    positions:SATURN_LABELS.map((label,index) => position(`saturn-${index + 1}`,label,index + 1,transform(SATURN_POINTS[index][0],SATURN_POINTS[index][1],.58))),
    rules:{ allowReversals:true, allowRepeats:false, drawScope:'full' }
  };

  const HOUSE_POLARITY_LABELS = [
    '1 · Aries · I','7 · Libra · You',
    '2 · Taurus · Mine','8 · Scorpio · Ours',
    '3 · Gemini · Word','9 · Sagittarius · Meaning',
    '4 · Cancer · Interior','10 · Capricorn · Form',
    '5 · Leo · Heart','11 · Aquarius · Field',
    '6 · Virgo · Distinction','12 · Pisces · Dissolution'
  ];
  const HOUSE_POLARITIES = {
    version:1,id:'six-polarities-houses-12',name:'Six Polarities · Houses',cardCount:12,source:'shipped',editable:false,
    positions:genericPositions(HOUSE_POLARITY_LABELS).map((item,index) => ({ ...item, id:`polarity-${index + 1}` })),
    rules:{ allowReversals:true, allowRepeats:false, drawScope:'full' }
  };

  const SHIPPED = [
    { id:'past-present-future-3', name:'Past · Present · Future', labels:['Past','Present','Future'] },
    { id:'situation-challenge-strategy-3', name:'Situation · Challenge · Strategy', labels:['Situation','Challenge','Strategy'] },
    { id:'choice-path-3', name:'Choice Path', labels:['Option A','Option B','Advice'] },
    { id:'relationship-check-in-5', name:'Relationship Check-In', labels:['You','Other','Bond','Challenge','Next step'] },
    { id:'hope-and-comfort-5', name:'Hope and Comfort', labels:['Confusion','Comfort','Lesson','Support','Next step'] }
  ].map(item => ({
    version:1,id:item.id,name:item.name,cardCount:item.labels.length,source:'shipped',editable:false,
    positions:genericPositions(item.labels),rules:{ allowReversals:true,allowRepeats:false,drawScope:'full' }
  })).concat([
    SATURN_SQUARE,
    CELTIC_CROSS,
    HOUSE_POLARITIES,
    {version:1,id:'focus-1',name:'Focus',cardCount:1,source:'shipped',editable:false,positions:genericPositions(['Focus']),rules:{allowReversals:true,allowRepeats:false,drawScope:'full'}}
  ]);

  function readCustomTemplates() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CUSTOM_TEMPLATE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.filter(item => item && Array.isArray(item.positions) && item.positions.length) : [];
    } catch (_) { return []; }
  }
  function writeCustomTemplates(items) {
    try { localStorage.setItem(CUSTOM_TEMPLATE_KEY, JSON.stringify(items)); } catch (_) {}
  }
  function allTemplates() { return SHIPPED.concat(readCustomTemplates()); }
  function templateById(id) { return allTemplates().find(item => item.id === id) || null; }
  function readStickerVisibility() {
    try { return localStorage.getItem(STICKER_VISIBILITY_KEY) !== 'false'; } catch (_) { return true; }
  }
  function writeStickerVisibility(value) {
    showPositionStickers = !!value;
    try { localStorage.setItem(STICKER_VISIBILITY_KEY, String(showPositionStickers)); } catch (_) {}
  }

  window.RelphiDrawingBoardSpreadPrefabs = Object.freeze({
    shipped:SHIPPED,
    all:allTemplates,
    byId:templateById
  });

  function currentSnapshot() { return optionsBridge()?.capture?.() || null; }
  function currentPrefabState() { return prefabBridge()?.getState?.() || {}; }
  function activeLayoutId() { return String(currentPrefabState().activeLayout?.id || ''); }
  function currentSlotCount(root = panel()) {
    return Math.max(
      Number(currentPrefabState().slotCount) || 0,
      root?.querySelectorAll('.card-row-board>.card-row-item').length || 0
    );
  }
  function currentCardCount(root = panel()) { return root?.querySelectorAll('.card-row-board [data-row-card]').length || 0; }
  function canonicalPositions() {
    const layout=currentPrefabState().activeLayout;
    if (Array.isArray(layout?.positions) && layout.positions.length) {
      return layout.positions.slice().sort((a,b)=>(Number(a.drawOrder)||0)-(Number(b.drawOrder)||0));
    }
    return Array.from({length:currentSlotCount()},(_,index)=>({id:`position-${index+1}`,drawOrder:index+1}));
  }
  function positionIdAt(index, snap=currentSnapshot() || {}) {
    return String(snap.rowPositionMeta?.[index]?.id || snap.rowActiveLayout?.positions?.[index]?.id || `position-${index+1}`);
  }
  function positionRoleAt(index, snap=currentSnapshot() || {}) {
    return String(snap.rowPositionMeta?.[index]?.role || '');
  }
  function nativeIndexForPositionId(id, snap=currentSnapshot() || {}) {
    const target=String(id || '');
    const meta=Array.isArray(snap.rowPositionMeta) ? snap.rowPositionMeta : [];
    const found=meta.findIndex(item=>String(item?.id || '')===target);
    return found>=0 ? found : null;
  }
  function orderedNativePositionIndices() {
    const snap=currentSnapshot() || {};
    const count=currentSlotCount();
    const seen=new Set();
    const result=[];
    canonicalPositions().forEach((position,fallbackIndex)=>{
      const resolved=nativeIndexForPositionId(position.id,snap);
      const index=resolved==null ? fallbackIndex : resolved;
      if (index>=0 && index<count && !seen.has(index)) { seen.add(index); result.push(index); }
    });
    for (let index=0;index<count;index++) if (!seen.has(index)) result.push(index);
    return result;
  }
  function configuredPositionCount() {
    const snap=currentSnapshot() || {};
    return Math.max(
      Array.isArray(snap.shortListPositionLabels) ? snap.shortListPositionLabels.length : 0,
      Array.isArray(snap.rowPositionMeta) ? snap.rowPositionMeta.length : 0,
      Number(currentPrefabState().activeLayout?.cardCount) || 0
    );
  }

  function blankDraft() {
    return { templateId:'', basedOnTemplateId:'', labels:[], pack:'full', stickers:true, reversals:true, repeats:false, templateName:'' };
  }
  function draftFromState() {
    const snap = currentSnapshot() || {};
    const state = currentPrefabState();
    const activeId=String(state.activeLayout?.id || '');
    const knownTemplate=templateById(activeId);
    return {
      templateId:knownTemplate ? activeId : '',
      basedOnTemplateId:String(state.activeLayout?.basedOn || (knownTemplate ? activeId : '')),
      labels:Array.isArray(snap.shortListPositionLabels) ? snap.shortListPositionLabels.slice() : [],
      pack:String(snap.rowDrawScope || 'full'),
      stickers:showPositionStickers,
      reversals:snap.rowAllowReversals !== false,
      repeats:!!snap.rowAllowRepeats,
      templateName:String(state.activeLayout?.name || '')
    };
  }
  function beginOptionsSession() {
    if (optionsSession) return;
    optionsSession = { baseline:currentSnapshot(), draft:draftFromState(), path:'', building:{element:'',planet:'',aspect:'',sign:'',house:''}, suggestions:[], surfaceDraws:{} };
  }
  function optionsStructuralChanged(session = optionsSession) {
    if (!session) return false;
    const base = session.baseline || {};
    const baseLayout = String(base.rowActiveLayout?.id || '');
    const draftLayout = session.draft.templateId || (baseLayout==='custom-active' ? 'custom-active' : '');
    const baseLabels = Array.isArray(base.shortListPositionLabels) ? base.shortListPositionLabels : [];
    return draftLayout !== baseLayout || JSON.stringify(session.draft.labels) !== JSON.stringify(baseLabels);
  }

  function setBoardOpen(open, { fit = false } = {}) {
    const root = panel();
    const trigger = document.getElementById('relphiOpenDrawingBoardCurrent');
    boardOpen = !!open;
    if (!root || !trigger) return;
    if (boardOpen) {
      if (root.hidden) {
        document.getElementById('landingOpenBoard')?.click();
        root.hidden = false;
        root.removeAttribute('hidden');
      }
      trigger.textContent = 'Close Drawing Board';
      trigger.setAttribute('aria-expanded','true');
      root.hidden = false;
      root.removeAttribute('hidden');
      enhance(root);
      if (fit) setTimeout(zoomExtents, 0);
    } else {
      closeFocus({ acknowledge:true });
      optionsSession = null;
      root.hidden = true;
      trigger.textContent = 'Open Drawing Board';
      trigger.setAttribute('aria-expanded','false');
    }
  }

  function zoomInput(root = panel()) { return root?.querySelector('#rowZoom') || null; }
  function setZoomFromControl(value) {
    const input = zoomInput();
    if (!input) return;
    const limits=zoomLimits();
    const next = clamp(value, Number(input.min) || limits.min, Number(input.max) || limits.max);
    input.value = String(next);
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function nudgeZoom(delta) {
    const input = zoomInput();
    const current=Number(input?.value) || 1;
    setZoomFromControl(current * (delta < 0 ? 1/1.2 : 1.2));
  }

  function installPinchZoom(root) {
    const workspace = root?.querySelector('.card-row-workspace');
    if (!workspace || workspace.dataset.relphiPinchZoom === 'true') return;
    workspace.dataset.relphiPinchZoom = 'true';
    let pinching = false;
    let startDistance = 0;
    let startZoom = 1;
    let disabledCards = [];
    const control = () => zoomInput(root);
    const distance = touches => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.hypot(dx,dy);
    };
    const begin = event => {
      if (event.touches.length !== 2) return;
      const input = control();
      if (!input) return;
      pinching = true;
      startDistance = distance(event.touches);
      startZoom = Number(input.value) || 1;
      disabledCards = Array.from(workspace.querySelectorAll('[draggable="true"],.card-row-item [data-row-card]')).map(node => {
        const wasDraggable = node.draggable;
        node.draggable = false;
        return [node,wasDraggable];
      });
      workspace.classList.add('relphi-is-pinching');
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const move = event => {
      if (!pinching || event.touches.length !== 2 || !startDistance) return;
      const input = control();
      if (!input) return;
      const limits=zoomLimits();
      const next = clamp(startZoom * (distance(event.touches) / startDistance), Number(input.min) || limits.min, Number(input.max) || limits.max);
      input.value = String(next);
      input.dispatchEvent(new Event('input',{bubbles:true}));
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const end = event => {
      if (!pinching || event.touches.length > 1) return;
      pinching = false;
      startDistance = 0;
      disabledCards.forEach(([node,wasDraggable]) => { if (node.isConnected) node.draggable = wasDraggable; });
      disabledCards = [];
      workspace.classList.remove('relphi-is-pinching');
      control()?.dispatchEvent(new Event('change',{bubbles:true}));
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    workspace.addEventListener('touchstart',begin,{capture:true,passive:false});
    workspace.addEventListener('touchmove',move,{capture:true,passive:false});
    workspace.addEventListener('touchend',end,{capture:true,passive:false});
    workspace.addEventListener('touchcancel',end,{capture:true,passive:false});
  }

  function renderedContentBounds(root) {
    const board=root?.querySelector('.card-row-board');
    const input=zoomInput(root);
    if (!board || !input) return {minX:0,minY:0,maxX:CARD_W,maxY:CARD_H};
    const currentZoom=Math.max(.0001,Number(input.value)||1);
    const boardRect=board.getBoundingClientRect();
    const rects=[];
    board.querySelectorAll(':scope > .card-row-item').forEach(item=>{
      const face=item.querySelector('.card-row-card-wrap,.card-row-drop-card') || item;
      const sticker=item.querySelector(':scope > .card-row-position-panel');
      [face,sticker].filter(Boolean).forEach(node=>{
        const rect=node.getBoundingClientRect();
        if (rect.width>0 && rect.height>0) rects.push(rect);
      });
    });
    if (!rects.length) return {minX:0,minY:0,maxX:CARD_W,maxY:CARD_H};
    return {
      minX:Math.min(...rects.map(rect=>(rect.left-boardRect.left)/currentZoom)),
      minY:Math.min(...rects.map(rect=>(rect.top-boardRect.top)/currentZoom)),
      maxX:Math.max(...rects.map(rect=>(rect.right-boardRect.left)/currentZoom)),
      maxY:Math.max(...rects.map(rect=>(rect.bottom-boardRect.top)/currentZoom))
    };
  }
  function zoomExtents() {
    const root = panel();
    const workspace = root?.querySelector('.card-row-workspace');
    const bridge = optionsBridge();
    if (!root || !workspace || !bridge) return false;
    const snapshot = bridge.capture();
    const bounds = renderedContentBounds(root);
    const toolbar = root.querySelector('.card-row-workspace-toolbar.relphi-board-controller');
    const toolbarH = toolbar?.offsetHeight || 52;
    const availableW = Math.max(1, workspace.clientWidth - GUTTER*2);
    const availableH = Math.max(1, workspace.clientHeight - toolbarH - GUTTER*2);
    const contentW = Math.max(1,bounds.maxX-bounds.minX);
    const contentH = Math.max(1,bounds.maxY-bounds.minY);
    const limits=zoomLimits();
    const zoom = clamp(Math.min(availableW/contentW,availableH/contentH),limits.min,limits.max);
    snapshot.rowZoom = zoom;
    snapshot.rowPanX = Math.round(GUTTER+(availableW-contentW*zoom)/2-bounds.minX*zoom);
    snapshot.rowPanY = Math.round(GUTTER+(availableH-contentH*zoom)/2-bounds.minY*zoom);
    bridge.restore(snapshot);
    return true;
  }

  function icon(kind) {
    if (kind === 'magnet') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v8a6 6 0 0 0 12 0V5h-4v8a2 2 0 0 1-4 0V5z"></path><path d="M6 9h4M14 9h4"></path></svg>';
    if (kind === 'picture') return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m4 17 5-5 4 4 2-2 5 5"></path></svg>';
    if (kind === 'fit') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"></path><path d="m3 8 5-5M21 8l-5-5M3 16l5 5M21 16l-5 5"></path></svg>';
    return '';
  }

  function controlLabel(input, fallback) {
    const label = input?.closest('label');
    if (label) return label;
    const wrap = document.createElement('label');
    wrap.textContent = fallback + ' ';
    if (input) wrap.appendChild(input);
    return wrap;
  }

  function installPermanentControls(root) {
    const workspace = root.querySelector('.card-row-workspace');
    const toolbar = root.querySelector('.card-row-workspace-toolbar');
    const nativeOptions = root.querySelector('.card-row-more-options');
    if (!workspace || !toolbar || !nativeOptions) return;
    const zoom = root.querySelector('#rowZoom');
    const zoomValue = root.querySelector('#rowZoomValue');
    const snap = root.querySelector('#rowSnapEnabled');
    const snapMinus = root.querySelector('#rowSnapGridMinus');
    const snapValue = root.querySelector('#rowSnapGridValue');
    const snapPlus = root.querySelector('#rowSnapGridPlus');
    const rotate = root.querySelector('#rowRotationSnapEnabled');
    const rotateMinus = root.querySelector('#rowRotationSnapMinus');
    const rotateValue = root.querySelector('#rowRotationSnapValue');
    const rotatePlus = root.querySelector('#rowRotationSnapPlus');
    const resetLayout = root.querySelector('#resetCardRowLayout');
    const envelopeColor = root.querySelector('#rowEnvelopeColor');
    const tableColor = root.querySelector('#rowTableColor');
    const tableUpload = root.querySelector('#rowTableImageUpload');
    const tableReset = root.querySelector('#rowTableImageReset');
    toolbar.className = 'card-row-workspace-toolbar relphi-board-controller';
    toolbar.replaceChildren();
    const zoomRow = document.createElement('div');
    zoomRow.className = 'relphi-zoom-row';
    const zoomOut = document.createElement('button');
    zoomOut.type='button'; zoomOut.className='relphi-zoom-step'; zoomOut.textContent='−'; zoomOut.title='Zoom out'; zoomOut.setAttribute('aria-label','Zoom out');
    const zoomIn = document.createElement('button');
    zoomIn.type='button'; zoomIn.className='relphi-zoom-step'; zoomIn.textContent='+'; zoomIn.title='Zoom in'; zoomIn.setAttribute('aria-label','Zoom in');
    const fit = document.createElement('button');
    fit.type='button'; fit.id='zoomCardRowExtents'; fit.className='relphi-icon-button'; fit.innerHTML=icon('fit'); fit.title='Zoom Extents'; fit.setAttribute('aria-label','Zoom Extents');
    zoomOut.addEventListener('click',()=>nudgeZoom(-.08));
    zoomIn.addEventListener('click',()=>nudgeZoom(.08));
    fit.addEventListener('click',zoomExtents);
    zoomRow.appendChild(zoomOut);
    if (zoom) { zoom.classList.add('relphi-native-zoom'); zoomRow.appendChild(zoom); }
    if (zoomValue) zoomRow.appendChild(zoomValue);
    zoomRow.append(zoomIn,fit);
    const tools = document.createElement('div');
    tools.className='relphi-workspace-tools';
    tools.innerHTML = `<button type="button" class="relphi-tool-trigger relphi-more-button" data-tool="more" aria-label="More board tools" title="More board tools">…</button><div class="relphi-tool-flyout" hidden></div>`;
    const flyout = tools.querySelector('.relphi-tool-flyout');
    const renderFlyout = () => {
      const open=openTool==='more';
      flyout.hidden=!open;
      flyout.replaceChildren();
      tools.querySelector('.relphi-tool-trigger')?.classList.toggle('is-active',open);
      if (!open) return;
      const transformButton=document.createElement('button');
      transformButton.type='button';
      transformButton.id='relphiToggleTransformEditing';
      transformButton.textContent=transformEditingUnlocked?'Lock rotation & scale':'Unlock rotation & scale';
      transformButton.setAttribute('aria-pressed',String(transformEditingUnlocked));
      transformButton.addEventListener('click',event=>{
        event.preventDefault(); event.stopPropagation();
        transformEditingUnlocked=!transformEditingUnlocked;
        root.classList.toggle('relphi-transform-editing-unlocked',transformEditingUnlocked);
        renderFlyout();
      });
      flyout.appendChild(transformButton);
      const snapsHeading=document.createElement('strong'); snapsHeading.textContent='Snaps'; flyout.appendChild(snapsHeading);
      const posRow=document.createElement('div'); posRow.className='relphi-tool-row';
      posRow.append(controlLabel(snap,'Position snap'));
      [snapMinus,snapValue,snapPlus].filter(Boolean).forEach(node=>posRow.appendChild(node));
      flyout.appendChild(posRow);
      const rotRow=document.createElement('div'); rotRow.className='relphi-tool-row';
      rotRow.append(controlLabel(rotate,'Rotation snap'));
      [rotateMinus,rotateValue,rotatePlus].filter(Boolean).forEach(node=>rotRow.appendChild(node));
      flyout.appendChild(rotRow);
      if (resetLayout) { resetLayout.textContent='Reset layout'; flyout.appendChild(resetLayout); }
      const backgroundHeading=document.createElement('strong'); backgroundHeading.textContent='Background'; flyout.appendChild(backgroundHeading);
      if (envelopeColor) { const row=document.createElement('div'); row.className='relphi-tool-row'; row.append(controlLabel(envelopeColor,'Card / placeholder')); flyout.appendChild(row); }
      if (tableColor) { const row=document.createElement('div'); row.className='relphi-tool-row'; row.append(controlLabel(tableColor,'Board')); flyout.appendChild(row); }
      const imageRow=document.createElement('div'); imageRow.className='relphi-tool-row';
      if (tableUpload) { tableUpload.textContent='Upload board image'; imageRow.appendChild(tableUpload); }
      if (tableReset) { tableReset.textContent='Remove board image'; imageRow.appendChild(tableReset); }
      if (imageRow.children.length) flyout.appendChild(imageRow);
    };
    tools.querySelector('.relphi-tool-trigger').addEventListener('click',event => {
      event.preventDefault(); event.stopPropagation();
      openTool=openTool==='more'?'':'more';
      renderFlyout();
    });
    zoomRow.appendChild(tools);
    toolbar.appendChild(zoomRow);
    root.classList.toggle('relphi-transform-editing-unlocked',transformEditingUnlocked);
    renderFlyout();
    nativeOptions.hidden = true;
    nativeOptions.setAttribute('aria-hidden','true');
  }

  async function writeDrawingBoardClipboard(text) {
    const value=String(text || '').trim();
    if (!value) return false;
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(value); return true; } catch (_) {}
    }
    const area=document.createElement('textarea');
    area.value=value;
    area.setAttribute('readonly','');
    area.style.position='fixed';
    area.style.left='-9999px';
    area.style.top='0';
    document.body.appendChild(area);
    area.select();
    let copied=false;
    try { copied=document.execCommand('copy'); } catch (_) {}
    area.remove();
    return copied;
  }
  function readingTextEntryMarkup(entry,index) {
    const position=String(entry?.position || `Position ${index + 1}`).trim();
    const title=String(entry?.title || 'Card').trim();
    const reversed=!!entry?.reversed;
    const association=String(entry?.association || '').trim();
    const interpretation=String(entry?.interpretation || '').trim();
    return `<article class="relphi-reading-text-card${reversed ? ' is-reversed' : ''}">
      <p class="relphi-reading-text-position">${escapeHtml(position)}</p>
      <h3>${escapeHtml(title)}${reversed ? ' · reversed' : ''}</h3>
      ${association ? `<p class="relphi-reading-text-association">${escapeHtml(association)}</p>` : ''}
      ${interpretation ? `<p class="relphi-reading-text-interpretation">${escapeHtml(interpretation)}</p>` : ''}
    </article>`;
  }
  function installReadingTextArea(root) {
    const workspace=root.querySelector('.card-row-workspace');
    if (!workspace) return;
    const entries=ledgerBridge()?.drawingBoardReadingEntries?.() || [];
    const serialized=ledgerBridge()?.serializeDrawingBoardReading?.() || '';
    let section=root.querySelector('#drawing-board-reading-text');
    if (!section) {
      section=document.createElement('section');
      section.id='drawing-board-reading-text';
      section.className='relphi-board-reading-text';
      workspace.insertAdjacentElement('afterend',section);
    } else if (section.previousElementSibling !== workspace) {
      workspace.insertAdjacentElement('afterend',section);
    }
    section.hidden=!entries.length;
    section.innerHTML=`<header>
      <div><strong>Reading text</strong><span>Question, card, association, and Relphi interpretation.</span></div>
      <button type="button" class="relphi-copy-reading" ${entries.length ? '' : 'disabled'}>Copy</button>
    </header>
    <div class="relphi-reading-text-list">${entries.map(readingTextEntryMarkup).join('')}</div>
    <small class="relphi-copy-reading-status" aria-live="polite"></small>`;
    const copy=section.querySelector('.relphi-copy-reading');
    const status=section.querySelector('.relphi-copy-reading-status');
    copy?.addEventListener('click',async()=>{
      const ok=await writeDrawingBoardClipboard(serialized);
      if (status) status.textContent=ok ? 'Copied.' : 'Copy failed.';
      if (ok) {
        copy.textContent='Copied';
        window.setTimeout(()=>{ if(copy.isConnected) copy.textContent='Copy'; },1200);
      }
    });
  }

  function installExportArea(root) {
    const drawer = root.querySelector('.card-row-drawing-board');
    const workspace = root.querySelector('.card-row-workspace');
    if (!drawer || !workspace) return;
    const readingText = root.querySelector('#drawing-board-reading-text');
    const anchor = readingText || workspace;
    let section = root.querySelector('#drawing-board-post-export');
    if (!section) {
      section = document.createElement('section');
      section.id = 'drawing-board-post-export';
      section.className = 'relphi-board-export';
      section.innerHTML = '<header><strong>Save & export</strong><span>Save the visual arrangement, the reading, or portable board data.</span></header><div class="board-options-body"></div>';
      anchor.insertAdjacentElement('afterend',section);
    } else if (section.previousElementSibling !== anchor) {
      anchor.insertAdjacentElement('afterend',section);
    }
    const destination = section.querySelector('.board-options-body');
    const labels = {
      snapshotCardRowArrangement:'Save arranged board (PNG)',
      downloadRowHtml:'Export reading with art (HTML)',
      downloadRowTextHtml:'Export reading text (HTML)',
      downloadRowJson:'Export board data (JSON)',
      printCardRowImage:'Make card sheet (PNG/JPEG)'
    };
    Object.entries(labels).forEach(([id,label]) => {
      const node = root.querySelector('#'+id);
      if (!node || node.parentElement === destination) return;
      node.textContent = label;
      destination.appendChild(node);
    });
  }

  function optionTemplateMarkup(draft) {
    const entries = allTemplates();
    return `<option value="">Custom</option>${entries.map(item => `<option value="${escapeHtml(item.id)}" ${draft.templateId===item.id?'selected':''}>${item.cardCount} · ${escapeHtml(item.name)}</option>`).join('')}`;
  }
  function packOptions(value) {
    const items = [
      ['full','Full Pack'],['shown','Shown cards'],['uhn','Universal Human Needs'],['majors','Majors'],
      ['planetary-majors','Planetary Majors'],['zodiac-majors','Zodiac Majors'],['aces','Aces'],['courts','Courts'],
      ['pips','Pips'],['decans','Decan pips'],['wands','Wands'],['cups','Cups'],['swords','Swords'],['pentacles','Pentacles / Disks']
    ];
    return items.map(([id,label])=>`<option value="${id}" ${value===id?'selected':''}>${label}</option>`).join('');
  }
  function labelsMarkup(labels) {
    const rows=labels.length ? labels : [''];
    return rows.map((label,index)=>`<div class="relphi-label-row" data-label-row="${index}"><span>${index+1}</span><input type="text" value="${escapeHtml(label)}" aria-label="Position ${index+1} label"><button type="button" data-remove-label="${index}" aria-label="Remove position ${index+1}">×</button></div>`).join('');
  }
  function parseBulkQuestions(value) {
    return String(value || '').split(',').map(item=>item.trim()).filter(Boolean).slice(0,MAX_POSITIONS);
  }
  function markQuestionEditCustom(drawer,draft) {
    if (draft.templateId) draft.basedOnTemplateId=draft.templateId;
    draft.templateId='';
    draft.templateName='';
    const templateSelect=drawer.querySelector('#relphiSpreadTemplateSelect');
    if (templateSelect) templateSelect.value='';
    const nameField=drawer.querySelector('#relphiTemplateName');
    if (nameField) nameField.value='';
  }

  const REFERENT_ELEMENTS = {
    Fire:'action desire courage momentum and initiative',
    Water:'feeling attachment care memory and belonging',
    Air:'thought language interpretation choice and exchange',
    Earth:'body work money resources and practical reality'
  };
  const REFERENT_PLANETS = {
    Sun:'identity vitality visibility and purpose',
    Moon:'feeling memory instinct rhythm and need',
    Mercury:'thought language interpretation exchange and recoverability',
    Venus:'attraction affection value pleasure and reception',
    Mars:'action desire conflict defense and severance',
    Jupiter:'growth participation faith generosity and increase',
    Saturn:'limits time responsibility consequence and endurance',
    Uranus:'change disruption invention freedom and awakening',
    Neptune:'imagination surrender ideals permeability and release',
    Pluto:'depth power compulsion transformation and irrevocable change'
  };
  const REFERENT_ASPECTS = {
    Conjunction:'what is operating together',
    Opposition:'what is pulling across an axis',
    Square:'what friction requires action',
    Trine:'what flows with little resistance',
    Sextile:'what opportunity can be developed',
    Quincunx:'what requires adjustment'
  };
  const REFERENT_SIGNS = {
    Aries:'initiation assertion courage and direct action',
    Taurus:'stability embodiment value and persistence',
    Gemini:'exchange language movement and multiplicity',
    Cancer:'care protection memory and belonging',
    Leo:'radiance heart creativity and sovereignty',
    Virgo:'discernment craft service and practical refinement',
    Libra:'relationship balance fairness and mutual recognition',
    Scorpio:'depth desire intimacy risk and transformation',
    Sagittarius:'meaning faith exploration study and horizon',
    Capricorn:'structure responsibility endurance and worldly form',
    Aquarius:'groups pattern distance invention and future orientation',
    Pisces:'imagination compassion surrender permeability and release'
  };
  const REFERENT_HOUSES = [
    'identity body and personal presence',
    'resources possessions value and material support',
    'communication learning siblings and the local environment',
    'home roots ancestry and private foundations',
    'creativity pleasure romance children and personal expression',
    'work routines health service and maintenance',
    'partnership contracts open conflict and direct others',
    'shared resources dependency debt loss inheritance and transformation',
    'belief study travel law meaning and worldview',
    'vocation public standing authority achievement and responsibility',
    'friends networks groups alliances hopes and collective participation',
    'retreat hidden conditions endings isolation and what operates out of view'
  ];
  const HOUSE_ORDINALS = ['First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth','Eleventh','Twelfth'];
  const MODE_BY_PIP = {2:'Cardinal',3:'Cardinal',4:'Cardinal',5:'Fixed',6:'Fixed',7:'Fixed',8:'Mutable',9:'Mutable',10:'Mutable'};

  function referentPathButton(id,label,description,path,disabled=false) {
    return '<button type="button" class="relphi-referent-path'+(path===id?' is-active':'')+'" data-referent-path="'+id+'" '+(disabled?'disabled':'')+'><strong>'+escapeHtml(label)+'</strong><span>'+escapeHtml(description)+'</span></button>';
  }
  function candidateQuestionsFromBlocks(blocks={}) {
    const element=String(blocks.element||'');
    const planet=String(blocks.planet||'');
    const aspect=String(blocks.aspect||'');
    const sign=String(blocks.sign||'');
    const house=Number(blocks.house)||0;
    const mode=String(blocks.mode||'');
    const planetPhrase=planet ? REFERENT_PLANETS[planet] || planet.toLowerCase() : '';
    const elementPhrase=element ? REFERENT_ELEMENTS[element] || element.toLowerCase() : '';
    const signPhrase=sign ? REFERENT_SIGNS[sign] || sign.toLowerCase() : '';
    const housePhrase=house>=1 && house<=12 ? REFERENT_HOUSES[house-1] : '';
    const aspectPhrase=aspect ? REFERENT_ASPECTS[aspect] || aspect.toLowerCase() : '';
    const subject = [
      planet ? planet+' and '+planetPhrase : '',
      element ? element+' and '+elementPhrase : '',
      housePhrase ? 'the '+HOUSE_ORDINALS[house-1]+' House realm of '+housePhrase : '',
      sign ? sign+' as '+signPhrase : '',
      mode ? mode.toLowerCase()+' movement' : ''
    ].filter(Boolean);
    const compact = subject.length ? subject.join(' through ') : 'this matter';
    const q1 = planet
      ? 'What is '+planet+' asking me to understand about '+(housePhrase ? housePhrase : (elementPhrase || signPhrase || 'this matter'))+'?'
      : 'What deserves my attention about '+compact+'?';
    const q2 = aspect
      ? 'How should I work with '+aspectPhrase+' in '+(housePhrase || elementPhrase || signPhrase || 'this situation')+'?'
      : 'What is changing or becoming possible through '+compact+'?';
    const q3 = mode
      ? 'What does '+mode.toLowerCase()+' movement ask me to do differently in '+(housePhrase || elementPhrase || 'this situation')+'?'
      : sign
        ? 'How is '+sign+' shaping the way this situation is being expressed?'
        : 'What practical next question would clarify '+compact+'?';
    return Array.from(new Set([q1,q2,q3].map(q=>q.replace(/\s+/g,' ').trim()))).slice(0,3);
  }
  function suggestionMarkup(session, disabled=false) {
    const suggestions=Array.isArray(session.suggestions)?session.suggestions:[];
    if (!suggestions.length) return '<p class="relphi-referent-empty">Choose or draw building blocks to surface candidate referents.</p>';
    return '<div class="relphi-suggestions-review"><div class="relphi-options-subhead"><strong>Review the referents</strong><span>Edit anything before you begin.</span></div>'+
      suggestions.map((value,index)=>'<label class="relphi-suggestion-row"><input type="checkbox" data-suggestion-use="'+index+'" checked '+(disabled?'disabled':'')+'><span>'+(index+1)+'</span><input type="text" data-suggestion-text="'+index+'" value="'+escapeHtml(value)+'" '+(disabled?'disabled':'')+'></label>').join('')+
      '<button type="button" id="relphiAcceptSuggestions" '+(disabled?'disabled':'')+'>Use selected referents</button></div>';
  }
  function referentReviewMarkup(draft) {
    const labels=(draft.labels||[]).map(value=>String(value||'').trim()).filter(Boolean);
    if (!labels.length) return '';
    return '<section class="relphi-referent-review"><strong>Current referents</strong><ol>'+labels.map(label=>'<li>'+escapeHtml(label)+'</li>').join('')+'</ol></section>';
  }
  function buildingControlsMarkup(session, disabled=false) {
    const b=session.building || (session.building={element:'',planet:'',aspect:'',sign:'',house:''});
    const option=(value,current)=>'<option value="'+escapeHtml(value)+'" '+(current===value?'selected':'')+'>'+escapeHtml(value||'Choose…')+'</option>';
    const options=(values,current)=>option('',current)+values.map(value=>option(value,current)).join('');
    return '<div class="relphi-building-grid">'+
      '<label>Element<select data-building-key="element" '+(disabled?'disabled':'')+'>'+options(Object.keys(REFERENT_ELEMENTS),b.element)+'</select></label>'+
      '<label>Planet<select data-building-key="planet" '+(disabled?'disabled':'')+'>'+options(Object.keys(REFERENT_PLANETS),b.planet)+'</select></label>'+
      '<label>Aspect<select data-building-key="aspect" '+(disabled?'disabled':'')+'>'+options(Object.keys(REFERENT_ASPECTS),b.aspect)+'</select></label>'+
      '<label>Sign<select data-building-key="sign" '+(disabled?'disabled':'')+'>'+options(Object.keys(REFERENT_SIGNS),b.sign)+'</select></label>'+
      '<label>House<select data-building-key="house" '+(disabled?'disabled':'')+'>'+option('',String(b.house||''))+HOUSE_ORDINALS.map((name,index)=>'<option value="'+(index+1)+'" '+(String(b.house)===String(index+1)?'selected':'')+'>'+name+' House</option>').join('')+'</select></label>'+
      '</div><button type="button" id="relphiBuildQuestions" '+(disabled?'disabled':'')+'>Surface referents</button>';
  }
  function surfaceCardPools() {
    const cards=Array.isArray(window.RELPHI_TAROT_CARDS)?window.RELPHI_TAROT_CARDS:[];
    return {
      planet:cards.filter(card=>card?.card_type==='Major' && card?.astrology?.attribution_type==='Planet' && card?.astrology?.planet),
      sign:cards.filter(card=>card?.card_type==='Major' && card?.astrology?.attribution_type==='Sign' && card?.astrology?.sign),
      pip:cards.filter(card=>card?.card_type==='Pip' && Number(card?.number)>=2 && Number(card?.number)<=10)
    };
  }
  function randomFrom(values) { return values?.length ? values[Math.floor(Math.random()*values.length)] : null; }
  function surfaceDrawSummary(session) {
    const draws=session.surfaceDraws || {};
    const parts=[];
    if (draws.planet) parts.push('<article><strong>'+escapeHtml(draws.planet.name)+'</strong><span>Planet · '+escapeHtml(draws.planet.astrology?.planet||'')+'</span></article>');
    if (draws.sign) parts.push('<article><strong>'+escapeHtml(draws.sign.name)+'</strong><span>Sign · '+escapeHtml(draws.sign.astrology?.sign||'')+'</span></article>');
    if (draws.pip) {
      const num=Number(draws.pip.number)||0;
      parts.push('<article><strong>'+escapeHtml(draws.pip.name)+'</strong><span>'+escapeHtml(draws.pip.element||'')+' · '+escapeHtml(HOUSE_ORDINALS[num-1]||String(num))+' House · '+escapeHtml(MODE_BY_PIP[num]||'')+'</span></article>');
    }
    return parts.length ? '<div class="relphi-surface-draws">'+parts.join('')+'</div>' : '<p class="relphi-referent-empty">Draw from the symbolic sub-packs. These cards suggest what to ask and do not become part of the reading.</p>';
  }
  function questionsFromSurface(session) {
    const draws=session.surfaceDraws || {};
    const pip=draws.pip;
    const number=Number(pip?.number)||0;
    return candidateQuestionsFromBlocks({
      planet:draws.planet?.astrology?.planet || '',
      sign:draws.sign?.astrology?.sign || '',
      element:pip?.element || '',
      house:number>=1 && number<=12 ? number : '',
      mode:MODE_BY_PIP[number] || ''
    });
  }
  function bespokeMarkup(draft,hasCards) {
    return '<section class="relphi-referent-panel">'+
      '<div class="relphi-options-subhead"><div><strong>Bespoke</strong><span>Write the referents for this reading.</span></div><button type="button" id="relphiAddPosition" '+(hasCards||draft.labels.length>=MAX_POSITIONS?'disabled':'')+'>Add referent</button></div>'+
      '<label class="relphi-bulk-referents">Enter several at once<textarea id="relphiBulkReferents" rows="3" placeholder="Situation, Challenge, Strategy" '+(hasCards?'disabled':'')+'></textarea></label>'+
      '<button type="button" id="relphiParseReferents" '+(hasCards?'disabled':'')+'>Parse comma-separated referents</button>'+
      '<div id="relphiPositionLabels">'+labelsMarkup(draft.labels)+'</div>'+
      '<div class="relphi-template-save"><input id="relphiTemplateName" type="text" maxlength="60" placeholder="Template name" value="'+escapeHtml(draft.templateName)+'" '+(hasCards?'disabled':'')+'><button type="button" id="relphiSaveTemplate" '+(hasCards?'disabled':'')+'>Save template</button></div>'+
      '</section>';
  }
  function templatesMarkup(draft,hasCards) {
    const selected=templateById(draft.templateId||draft.basedOnTemplateId);
    const positions=selected?.positions?.slice?.().sort((a,b)=>a.drawOrder-b.drawOrder) || [];
    return '<section class="relphi-referent-panel"><div class="relphi-options-subhead"><div><strong>Templates</strong><span>Start from an established or saved spread.</span></div></div>'+
      '<label class="relphi-options-field">Template<select id="relphiSpreadTemplateSelect" '+(hasCards?'disabled':'')+'>'+optionTemplateMarkup(draft)+'</select></label>'+
      (positions.length?'<ol class="relphi-template-preview">'+positions.map(item=>'<li>'+escapeHtml(item.label)+'</li>').join('')+'</ol>':'<p class="relphi-referent-empty">Choose a template to preview its referents.</p>')+
      '</section>';
  }
  function pathPanelMarkup(session,hasCards) {
    const draft=session.draft;
    if (!session.path) return '<p class="relphi-referent-intro">Choose how you want to begin. You can always draw without referents.</p>';
    if (session.path==='draw') return '<section class="relphi-referent-panel"><strong>Draw</strong><p>Use an open board with no referents or spread structure.</p><button type="button" id="relphiUseBlankDraw" '+(hasCards?'disabled':'')+'>Use blank board</button></section>';
    if (session.path==='bespoke') return bespokeMarkup(draft,hasCards);
    if (session.path==='templates') return templatesMarkup(draft,hasCards);
    if (session.path==='blocks') return '<section class="relphi-referent-panel"><div class="relphi-options-subhead"><div><strong>Building Blocks</strong><span>Choose Relphi symbols deliberately and let them formulate candidate referents.</span></div></div>'+buildingControlsMarkup(session,hasCards)+suggestionMarkup(session,hasCards)+'</section>';
    if (session.path==='surface') return '<section class="relphi-referent-panel"><div class="relphi-options-subhead"><div><strong>See What Surfaces</strong><span>Let the deck choose the symbolic ingredients first.</span></div></div><div class="relphi-surface-actions"><button type="button" data-surface-draw="planet" '+(hasCards?'disabled':'')+'>Draw planet</button><button type="button" data-surface-draw="sign" '+(hasCards?'disabled':'')+'>Draw sign</button><button type="button" data-surface-draw="pip" '+(hasCards?'disabled':'')+'>Draw pip</button><button type="button" id="relphiSurfaceAll" '+(hasCards?'disabled':'')+'>Draw all three</button></div>'+surfaceDrawSummary(session)+suggestionMarkup(session,hasCards)+'</section>';
    return '';
  }

  function renderOptions(root = panel()) {
    if (!root || !optionsSession) return;
    root.querySelector('.relphi-reading-options-drawer')?.remove();
    const workspace = root.querySelector('.card-row-workspace');
    if (!workspace) return;
    const session=optionsSession;
    const draft = session.draft;
    const hasCards = currentCardCount(root) > 0;
    const drawer = document.createElement('section');
    drawer.className='relphi-reading-options-drawer is-reading-options-open relphi-referents-drawer';
    drawer.id='drawingBoardReadingOptions';
    drawer.setAttribute('role','dialog');
    drawer.setAttribute('aria-label','Drawing Board Referents');
    drawer.innerHTML = '<div class="relphi-options-heading"><div><span class="eyebrow">Drawing Board</span><h3>Referents</h3></div></div>'+
      (hasCards ? '<p class="relphi-options-note relphi-options-note-visible">Reset Board before changing referents. The reading structure is locked once cards are drawn.</p>' : '')+
      '<div class="relphi-options-body">'+
        '<nav class="relphi-referent-paths" aria-label="Referent paths">'+
          referentPathButton('draw','Draw','No referents. Just begin.',session.path,hasCards)+
          referentPathButton('bespoke','Bespoke','Write your own referents.',session.path,hasCards)+
          referentPathButton('templates','Templates','Use a saved or established spread.',session.path,hasCards)+
          referentPathButton('blocks','Building Blocks','Choose elements planets aspects signs and houses.',session.path,hasCards)+
          referentPathButton('surface','See What Surfaces','Draw symbolic cards to discover what to ask.',session.path,hasCards)+
        '</nav>'+
        pathPanelMarkup(session,hasCards)+
        referentReviewMarkup(draft)+
        '<details class="relphi-referent-settings"><summary>Draw settings</summary><div class="relphi-draw-options"><label>Pack<select id="relphiDraftPack">'+packOptions(draft.pack)+'</select></label><label><input id="relphiDraftStickers" type="checkbox" '+(draft.stickers?'checked':'')+' title="Show position stickers"> Show referent stickers</label><label><input id="relphiDraftReversals" type="checkbox" '+(draft.reversals?'checked':'')+'> Reversals</label><label><input id="relphiDraftRepeats" type="checkbox" '+(draft.repeats?'checked':'')+'> Repeats</label></div></details>'+
      '</div>'+
      '<div class="relphi-options-commitbar"><button type="button" id="relphiResetBoard" class="relphi-reset-board">Reset Board</button><span></span><button type="button" id="relphiCancelOptions">Cancel</button><button type="button" id="relphiApplyOptions" class="primary">'+(session.path==='draw'?'Start Drawing':'Start Reading')+'</button></div>';
    workspace.appendChild(drawer);

    drawer.querySelectorAll('[data-referent-path]').forEach(button=>button.addEventListener('click',()=>{
      session.path=button.dataset.referentPath || '';
      session.suggestions=[];
      renderOptions(root);
    }));

    const templateSelect = drawer.querySelector('#relphiSpreadTemplateSelect');
    templateSelect?.addEventListener('change',()=>{
      const chosen=templateById(templateSelect.value);
      draft.templateId=templateSelect.value;
      draft.basedOnTemplateId=templateSelect.value;
      if (chosen) {
        draft.labels=chosen.positions.slice().sort((a,b)=>a.drawOrder-b.drawOrder).map(item=>item.label);
        draft.pack=chosen.rules?.drawScope || draft.pack;
        draft.reversals=chosen.rules?.allowReversals !== false;
        draft.repeats=!!chosen.rules?.allowRepeats;
        draft.templateName=chosen.name;
      } else {
        draft.basedOnTemplateId='';
        draft.templateName='';
        draft.labels=[];
      }
      renderOptions(root);
    });

    const labelsList=drawer.querySelector('#relphiPositionLabels');
    const acceptCommaList=(value)=>{
      const labels=parseBulkQuestions(value);
      if (!labels.length) return false;
      draft.labels=labels;
      markQuestionEditCustom(drawer,draft);
      setTimeout(()=>{ if (optionsSession) renderOptions(root); },0);
      return true;
    };
    drawer.querySelector('#relphiParseReferents')?.addEventListener('click',()=>acceptCommaList(drawer.querySelector('#relphiBulkReferents')?.value || ''));
    labelsList?.addEventListener('paste',event=>{
      const row=event.target.closest('.relphi-label-row');
      if (!row || event.target.tagName!=='INPUT' || Number(row.dataset.labelRow)!==0) return;
      const pasted=event.clipboardData?.getData('text') || '';
      if (!pasted.includes(',') || parseBulkQuestions(pasted).length<2) return;
      event.preventDefault(); acceptCommaList(pasted);
    });
    labelsList?.addEventListener('input',event=>{
      const row=event.target.closest('.relphi-label-row');
      if (!row || event.target.tagName!=='INPUT') return;
      const index=Number(row.dataset.labelRow);
      while (draft.labels.length<=index) draft.labels.push('');
      draft.labels[index]=event.target.value;
      markQuestionEditCustom(drawer,draft);
    });
    labelsList?.addEventListener('change',event=>{
      const row=event.target.closest('.relphi-label-row');
      if (!row || event.target.tagName!=='INPUT' || Number(row.dataset.labelRow)!==0) return;
      acceptCommaList(event.target.value);
    });
    labelsList?.addEventListener('click',event=>{
      const button=event.target.closest('[data-remove-label]');
      if (!button) return;
      draft.labels.splice(Number(button.dataset.removeLabel),1);
      markQuestionEditCustom(drawer,draft); renderOptions(root);
    });
    drawer.querySelector('#relphiAddPosition')?.addEventListener('click',()=>{
      if (draft.labels.length>=MAX_POSITIONS) return;
      draft.labels.push(''); markQuestionEditCustom(drawer,draft); renderOptions(root);
    });
    drawer.querySelector('#relphiTemplateName')?.addEventListener('input',event=>{draft.templateName=event.target.value.slice(0,60);});
    drawer.querySelector('#relphiSaveTemplate')?.addEventListener('click',()=>saveDraftTemplate(root));

    drawer.querySelectorAll('[data-building-key]').forEach(select=>select.addEventListener('change',()=>{
      session.building ||= {};
      session.building[select.dataset.buildingKey]=select.value;
    }));
    drawer.querySelector('#relphiBuildQuestions')?.addEventListener('click',()=>{
      session.suggestions=candidateQuestionsFromBlocks(session.building);
      renderOptions(root);
    });

    const redrawSurface = kind => {
      const pools=surfaceCardPools();
      session.surfaceDraws ||= {};
      session.surfaceDraws[kind]=randomFrom(pools[kind]);
      session.suggestions=questionsFromSurface(session);
      renderOptions(root);
    };
    drawer.querySelectorAll('[data-surface-draw]').forEach(button=>button.addEventListener('click',()=>redrawSurface(button.dataset.surfaceDraw)));
    drawer.querySelector('#relphiSurfaceAll')?.addEventListener('click',()=>{
      const pools=surfaceCardPools();
      session.surfaceDraws={planet:randomFrom(pools.planet),sign:randomFrom(pools.sign),pip:randomFrom(pools.pip)};
      session.suggestions=questionsFromSurface(session);
      renderOptions(root);
    });

    drawer.querySelectorAll('[data-suggestion-text]').forEach(input=>input.addEventListener('input',()=>{
      session.suggestions[Number(input.dataset.suggestionText)]=input.value;
    }));
    drawer.querySelector('#relphiAcceptSuggestions')?.addEventListener('click',()=>{
      const chosen=Array.from(drawer.querySelectorAll('[data-suggestion-use]')).filter(box=>box.checked).map(box=>{
        const index=Number(box.dataset.suggestionUse);
        return String(session.suggestions[index]||'').trim();
      }).filter(Boolean);
      if (!chosen.length) return;
      draft.labels=chosen.slice(0,MAX_POSITIONS);
      draft.templateId='';
      draft.basedOnTemplateId='';
      draft.templateName='';
      renderOptions(root);
    });

    drawer.querySelector('#relphiUseBlankDraw')?.addEventListener('click',()=>{
      draft.labels=[]; draft.templateId=''; draft.basedOnTemplateId=''; draft.templateName='';
      applyOptions(root);
    });
    drawer.querySelector('#relphiDraftPack')?.addEventListener('change',event=>{draft.pack=event.target.value;});
    drawer.querySelector('#relphiDraftStickers')?.addEventListener('change',event=>{draft.stickers=event.target.checked;});
    drawer.querySelector('#relphiDraftReversals')?.addEventListener('change',event=>{draft.reversals=event.target.checked;});
    drawer.querySelector('#relphiDraftRepeats')?.addEventListener('change',event=>{draft.repeats=event.target.checked;});
    drawer.querySelector('#relphiResetBoard')?.addEventListener('click',()=>resetBoardFromOptions(root));
    drawer.querySelector('#relphiCancelOptions')?.addEventListener('click',()=>closeOptions(root));
    drawer.querySelector('#relphiApplyOptions')?.addEventListener('click',()=>{
      if (session.path==='draw') { draft.labels=[]; draft.templateId=''; draft.basedOnTemplateId=''; draft.templateName=''; }
      applyOptions(root);
    });
  }

  function saveDraftTemplate(root) {
    if (!optionsSession) return;
    const draft=optionsSession.draft;
    const name=String(draft.templateName || '').trim();
    if (!name || !draft.labels.length) return;
    const based=templateById(draft.templateId || draft.basedOnTemplateId);
    const positions=(based?.positions?.length===draft.labels.length ? clone(based.positions) : genericPositions(draft.labels));
    positions.forEach((item,index)=>{ item.label=draft.labels[index] || `Position ${index+1}`; item.drawOrder=index+1; });
    const id=`custom-${slug(name)}-${draft.labels.length}`;
    const custom={version:1,id,name,cardCount:draft.labels.length,source:'custom',editable:true,basedOn:based?.id||null,positions,rules:{allowReversals:draft.reversals,allowRepeats:draft.repeats,drawScope:draft.pack}};
    const items=readCustomTemplates().filter(item=>item.id!==id);
    items.push(custom); writeCustomTemplates(items);
    draft.templateId=id;
    draft.basedOnTemplateId=id;
    renderOptions(root);
  }

  function resetBoardFromOptions(root) {
    if (!optionsSession) return;
    optionsSession.draft=blankDraft();
    openTool='';
    closeFocus({acknowledge:false});
    const clear=root.querySelector('#clearShortList');
    if (clear) clear.click();
    else if (optionsBridge()) {
      const snap=optionsBridge().capture();
      Object.assign(snap,{shortList:[],shortListPositionLabels:[],shortListPositionCardIds:[],rowEnvelopeLayout:{},rowCardTransforms:{},rowPositionMeta:[],rowActiveLayout:null,rowLayoutLocked:false,rowLayoutDesignMode:false,rowCardReversals:{},shortListName:'',shortListNotes:'',rowDrawScope:'full',rowAllowRepeats:false,rowAllowReversals:true});
      optionsBridge().restore(snap);
    }
    optionsSession.baseline=currentSnapshot();
    writeStickerVisibility(true);
    boardOpen=true;
    const keepBoardOpen=()=>{
      const next=panel();
      if (!next) return;
      next.hidden=false;
      next.removeAttribute('hidden');
      const drawer=next.querySelector('.card-row-drawing-board');
      if (drawer) drawer.open=true;
      const trigger=document.getElementById('relphiOpenDrawingBoardCurrent');
      if (trigger) {
        trigger.textContent='Close Drawing Board';
        trigger.setAttribute('aria-expanded','true');
      }
      enhance(next);
    };
    keepBoardOpen();
    setTimeout(keepBoardOpen,0);
  }
  function closeOptions(root = panel()) {
    optionsSession=null;
    root?.querySelector('.relphi-reading-options-drawer')?.remove();
    const trigger=root?.querySelector('#drawingBoardOptionsButton');
    if (trigger) trigger.setAttribute('aria-expanded','false');
  }
  function openOptions(root = panel()) {
    if (!root) return;
    if (optionsSession) { closeOptions(root); return; }
    beginOptionsSession();
    const trigger=root.querySelector('#drawingBoardOptionsButton');
    if (trigger) { trigger.textContent='Referents'; trigger.setAttribute('aria-expanded','true'); }
    renderOptions(root);
  }

  function draftPrefab(draft) {
    const based=templateById(draft.templateId || draft.basedOnTemplateId);
    const labels=draft.labels.slice(0,MAX_POSITIONS).map((value,index)=>String(value || `Position ${index+1}`).trim());
    if (based && based.positions.length===labels.length) {
      const next=clone(based);
      next.positions.forEach((item,index)=>{item.label=labels[index]; item.drawOrder=index+1;});
      next.rules={allowReversals:draft.reversals,allowRepeats:draft.repeats,drawScope:draft.pack};
      if (!draft.templateId) {
        next.id='custom-active';
        next.name=draft.templateName || 'Custom';
        next.source='custom';
        next.editable=true;
        next.basedOn=based.id;
      }
      return next;
    }
    return {version:1,id:'custom-active',name:draft.templateName || 'Custom',cardCount:labels.length,source:'custom',editable:true,basedOn:based?.id||null,positions:genericPositions(labels),rules:{allowReversals:draft.reversals,allowRepeats:draft.repeats,drawScope:draft.pack}};
  }

  function applyDrawSettings(draft) {
    const bridge=optionsBridge(); if (!bridge) return;
    const snap=bridge.capture();
    snap.rowDrawScope=draft.pack;
    snap.rowAllowRepeats=!!draft.repeats;
    snap.rowAllowReversals=!!draft.reversals;
    snap.rowDrawDeck=[];
    snap.rowDrawDeckSignature='';
    bridge.restore(snap);
  }
  function applyOptions(root = panel()) {
    if (!optionsSession || !root) return;
    const draft=clone(optionsSession.draft);
    const structural=optionsStructuralChanged(optionsSession);
    writeStickerVisibility(draft.stickers);
    optionsSession=null;
    root.querySelector('.relphi-reading-options-drawer')?.remove();
    if (structural && currentCardCount(root)===0) {
      const clear=root.querySelector('#clearShortList');
      clear?.click();
      const prefab=draftPrefab(draft);
      if (prefab.positions.length) prefabBridge()?.applyLayout?.(prefab);
      applyDrawSettings(draft);
    } else {
      applyDrawSettings(draft);
    }
    setTimeout(()=>{ enhance(panel()); zoomExtents(); },0);
  }

  function acknowledgeCelticCrossing() {
    const state=currentPrefabState();
    const layout=state.activeLayout;
    if (layout?.id!=='celtic-cross-10' && layout?.basedOn!=='celtic-cross-10') return false;
    const bridge=optionsBridge(); if (!bridge) return false;
    const snap=bridge.capture();
    const metaList=Array.isArray(snap.rowPositionMeta) ? snap.rowPositionMeta : [];
    const crossingIndex=metaList.findIndex(meta=>meta?.role==='crossing' || meta?.id==='crossing');
    const coveringIndex=metaList.findIndex(meta=>meta?.role==='covering' || meta?.id==='covering');
    if (crossingIndex<0 || coveringIndex<0) return false;
    const meta=metaList[crossingIndex] || {};
    if (meta.celticCrossAcknowledged) return false;
    const covering=snap.rowEnvelopeLayout?.[coveringIndex] || snap.rowEnvelopeLayout?.[String(coveringIndex)] || {x:.20*CANVAS_W,y:.34*CANVAS_H};
    snap.rowEnvelopeLayout ||= {};
    snap.rowCardTransforms ||= {};
    snap.rowPositionMeta ||= [];
    snap.rowEnvelopeLayout[crossingIndex]={x:Number(covering.x),y:Number(covering.y)};
    snap.rowCardTransforms[crossingIndex]={...(snap.rowCardTransforms[crossingIndex]||{}),scale:.48,rotation:90,zIndex:30};
    snap.rowPositionMeta[crossingIndex]={...meta,celticCrossAcknowledged:true};
    const activeCrossing=snap.rowActiveLayout?.positions?.find(position=>position?.id==='crossing' || position?.role==='crossing');
    if (activeCrossing) activeCrossing.transform=clone(CELTIC_CROSS.positions[1].crossedTransform);
    bridge.restore(snap);
    setTimeout(zoomExtents,0);
    return true;
  }

  function focusItem(index, root = panel()) {
    return root?.querySelector(`.card-row-board>.card-row-item[data-row-index="${index}"]`) || null;
  }
  function cardAt(index, root = panel()) { return focusItem(index,root)?.querySelector('[data-row-card]') || null; }
  function positionLabel(index, root = panel()) {
    const snap=currentSnapshot() || {};
    return String(snap.shortListPositionLabels?.[index] || `Position ${index+1}`);
  }
  function focusCardIsReversed(index, root = panel()) {
    const item=focusItem(index,root);
    const card=cardAt(index,root);
    return !!item?.classList?.contains('is-row-reversed') || card?.dataset?.rowReversed === 'true' || !!card?.classList?.contains('is-row-reversed');
  }
  function focusArtImage(card) {
    const art=card?.querySelector?.('.or-card-art');
    if (art?.tagName === 'IMG') return art;
    return art?.querySelector?.('img') || card?.querySelector?.('img') || null;
  }
  function addFocusReversedMeaning(entry, cardId, reversed) {
    entry.querySelectorAll('[data-relphi-focus-reversed]').forEach(node=>node.remove());
    if (!reversed) return;
    const meaning=window.RelphiTarotReversedMeanings?.meaningFor?.(cardId) || '';
    if (!meaning) return;
    const section=document.createElement('section');
    section.className='interpretation-card--priority relphi-focus-reversed';
    section.dataset.relphiFocusReversed=cardId;
    const heading=document.createElement('h3'); heading.textContent='Relphi-derived reversed interpretation';
    const body=document.createElement('p'); body.textContent=meaning;
    section.append(heading,body);
    const block=entry.querySelector('.full-entry-title-block');
    const upright=block?.querySelector(':scope > .locked-relphi-priority,:scope > .uhn-panel');
    if (upright) upright.insertAdjacentElement('afterend',section);
    else if (block) block.appendChild(section);
    else entry.prepend(section);
  }
  function replaceFocusArt(reader, artSource, cardId, reversed) {
    const frame=reader.querySelector('.relphi-focus-art-frame');
    if (!frame) return;
    const previous=frame.querySelector('.relphi-focus-art');
    const art=document.createElement('img');
    art.className='relphi-focus-art';
    art.alt=((artSource?.alt || ledgerBridge()?.titleFor?.(cardId) || 'Tarot card') + (reversed ? ' — reversed' : ''));
    art.decoding='async';
    art.loading='eager';
    art.classList.toggle('is-reversed',reversed);
    if (previous) previous.replaceWith(art); else frame.appendChild(art);
    const src=artSource?.currentSrc || artSource?.src || '';
    if (src) art.src=src;
  }
  function renderFocusEntry(reader, index) {
    const card=cardAt(index);
    const cardId=String(card?.dataset?.rowCard || '');
    const artSource=focusArtImage(card);
    const reversed=focusCardIsReversed(index);
    const entry=reader.querySelector('.relphi-focus-entry');
    const position=reader.querySelector('.relphi-focus-position');
    const reversedBadge=reader.querySelector('.relphi-focus-reversed-badge');
    if (position) position.textContent=positionLabel(index);
    if (reversedBadge) reversedBadge.hidden=!reversed;
    replaceFocusArt(reader,artSource,cardId,reversed);
    if (entry) {
      entry.innerHTML=ledgerBridge()?.renderCardEntry?.(cardId,'Tarot Ledger entry') || '<p>Card entry unavailable.</p>';
      entry.querySelectorAll('.tarot-card-art,.full-entry-row-button').forEach(node=>node.remove());
      addFocusReversedMeaning(entry,cardId,reversed);
      ledgerBridge()?.bindCardEntry?.(entry);
      entry.scrollTop=0;
    }
  }
  function keepFocusStripCurrentVisible(strip, centerCurrent = false) {
    requestAnimationFrame(()=>{
      if (!strip?.isConnected) return;
      const current=strip.querySelector('.is-current');
      if (!current) return;
      if (centerCurrent) {
        current.scrollIntoView({block:'nearest',inline:'center'});
        return;
      }
      const viewLeft=strip.scrollLeft;
      const viewRight=viewLeft+strip.clientWidth;
      const currentLeft=current.offsetLeft;
      const currentRight=currentLeft+current.offsetWidth;
      if (currentLeft < viewLeft) strip.scrollLeft=currentLeft;
      else if (currentRight > viewRight) strip.scrollLeft=currentRight-strip.clientWidth;
    });
  }
  function renderFocusStrip(reader, index, options = {}) {
    const order=orderedNativePositionIndices();
    const strip=reader.querySelector('.relphi-focus-strip');
    if (!strip) return;
    const preserveScroll=options.preserveScroll !== false;
    const previousScroll=preserveScroll ? strip.scrollLeft : 0;
    const existing=new Map(Array.from(strip.querySelectorAll('[data-focus-position]')).map(node=>[node.dataset.focusPosition,node]));
    order.forEach((nativeIndex,logicalIndex)=>{
      const key=String(nativeIndex);
      let button=existing.get(key);
      if (!button) {
        button=document.createElement('button');
        button.type='button';
        button.dataset.focusPosition=key;
        button.addEventListener('click',event=>{
          if (Date.now()<suppressStripClickUntil) { event.preventDefault(); return; }
          navigateFocusTo(Number(button.dataset.focusPosition));
        });
        strip.appendChild(button);
      }
      existing.delete(key);
      button.classList.toggle('is-current',nativeIndex===index);
      button.classList.toggle('is-reversed',focusCardIsReversed(nativeIndex));
      const card=cardAt(nativeIndex);
      button.classList.toggle('is-empty',!card);
      const art=focusArtImage(card);
      const signature=art ? `${art.currentSrc||art.src||''}|${focusCardIsReversed(nativeIndex)?'r':'u'}|${logicalIndex}` : `empty|${logicalIndex}`;
      if (button.dataset.focusCardSignature!==signature) {
        button.dataset.focusCardSignature=signature;
        button.replaceChildren();
        const img=art?.cloneNode(true);
        if (img) {
          img.removeAttribute('loading');
          img.removeAttribute('decoding');
          button.appendChild(img);
        }
        const span=document.createElement('span');
        span.textContent=String(logicalIndex+1);
        button.appendChild(span);
      }
      button.title=positionLabel(nativeIndex);
      button.setAttribute('aria-label',positionLabel(nativeIndex)+(card?'':' · draw this position'));
      button.tabIndex=nativeIndex===index?0:-1;
    });
    existing.forEach(node=>node.remove());
    if (preserveScroll) strip.scrollLeft=previousScroll;
    keepFocusStripCurrentVisible(strip,!preserveScroll);
  }
  function installFocusStripScrub(reader) {
    const strip=reader.querySelector('.relphi-focus-strip');
    if (!strip || strip.dataset.scrubReady==='true') return;
    strip.dataset.scrubReady='true';
    let gesture=null;
    const setFingerCard=nativeIndex=>{
      strip.querySelectorAll('[data-focus-position]').forEach(button=>{
        button.classList.toggle('is-under-finger',Number(button.dataset.focusPosition)===nativeIndex);
      });
    };
    const activateDrawn=nativeIndex=>{
      if (!Number.isInteger(nativeIndex) || !cardAt(nativeIndex) || nativeIndex===focusIndex) return;
      const leaving=focusIndex;
      if (leaving>=0 && leaving!==nativeIndex && isCrossingPosition(leaving)) acknowledgeCelticCrossing();
      openFocus(nativeIndex);
    };
    const drawnButtonAt=(x,y)=>{
      const hit=document.elementFromPoint(x,y)?.closest?.('.relphi-focus-strip [data-focus-position]');
      if (!hit || !strip.contains(hit)) return null;
      const nativeIndex=Number(hit.dataset.focusPosition);
      return Number.isInteger(nativeIndex) && cardAt(nativeIndex) ? nativeIndex : null;
    };
    strip.addEventListener('pointerdown',event=>{
      if (event.button!=null && event.button!==0) return;
      const pressed=event.target.closest?.('[data-focus-position]');
      if (!pressed || !strip.contains(pressed)) return;
      const nativeIndex=Number(pressed.dataset.focusPosition);
      if (!Number.isInteger(nativeIndex) || !cardAt(nativeIndex)) return;
      activateDrawn(nativeIndex);
      setFingerCard(nativeIndex);
      gesture={id:event.pointerId,x:event.clientX,y:event.clientY,target:nativeIndex,moved:false};
      strip.classList.add('is-scrubbing');
      strip.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    });
    strip.addEventListener('pointermove',event=>{
      if (!gesture || event.pointerId!==gesture.id) return;
      const dx=event.clientX-gesture.x;
      const dy=event.clientY-gesture.y;
      if (!gesture.moved && Math.hypot(dx,dy)>=4) gesture.moved=true;
      if (!gesture.moved) return;
      const target=drawnButtonAt(event.clientX,event.clientY);
      if (target==null) {
        setFingerCard(null);
        return;
      }
      setFingerCard(target);
      if (target!==gesture.target) {
        gesture.target=target;
        activateDrawn(target);
      }
      event.preventDefault();
    });
    const finish=event=>{
      if (!gesture || event.pointerId!==gesture.id) return;
      const moved=gesture.moved;
      gesture=null;
      strip.classList.remove('is-scrubbing');
      strip.querySelectorAll('.is-under-finger').forEach(button=>button.classList.remove('is-under-finger'));
      if (moved) suppressStripClickUntil=Date.now()+280;
    };
    strip.addEventListener('pointerup',finish);
    strip.addEventListener('pointercancel',finish);
  }
  function installFocusSwipe(reader) {
    const main=reader.querySelector('.relphi-focus-main');
    if (!main) return;
    let gesture=null;
    main.addEventListener('pointerdown',event=>{
      if (event.pointerType==='mouse') return;
      if (event.target.closest('button,a,input,textarea,select,label,[contenteditable="true"]')) return;
      gesture={id:event.pointerId,x:event.clientX,y:event.clientY,time:Date.now()};
    });
    main.addEventListener('pointercancel',()=>{gesture=null;});
    main.addEventListener('pointerup',event=>{
      if (!gesture || event.pointerId!==gesture.id) return;
      const dx=event.clientX-gesture.x;
      const dy=event.clientY-gesture.y;
      const elapsed=Date.now()-gesture.time;
      gesture=null;
      if (elapsed>1400 || Math.abs(dx)<56 || Math.abs(dx)<=Math.abs(dy)*1.25) return;
      navigateFocusBy(dx<0?1:-1);
    });
  }
  function openFocus(index) {
    const root=panel(); const card=cardAt(index,root);
    if (!root || !card || !ledgerBridge()) return false;
    const existingReader=document.querySelector('.relphi-focus-reader');
    focusIndex=index;
    if (existingReader) {
      existingReader.dataset.focusIndex=String(index);
      existingReader.setAttribute('aria-label',positionLabel(index,root));
      renderFocusEntry(existingReader,index);
      renderFocusStrip(existingReader,index,{preserveScroll:true});
      document.body.classList.add('relphi-focus-open');
      return true;
    }
    const reader=document.createElement('section');
    reader.className='relphi-focus-reader';
    reader.dataset.focusIndex=String(index);
    reader.setAttribute('role','dialog');
    reader.setAttribute('aria-modal','true');
    reader.setAttribute('aria-label',positionLabel(index,root));
    reader.innerHTML=`<div class="relphi-focus-shell"><section class="relphi-focus-position-panel" aria-label="Reading question or position"><span class="relphi-focus-reversed-badge" hidden>Reversed</span><strong class="relphi-focus-position"></strong><button type="button" class="relphi-focus-close" aria-label="Close focused card">×</button></section><div class="relphi-focus-main"><section class="relphi-focus-art-pane" aria-label="Card art"><div class="relphi-focus-art-frame"><img class="relphi-focus-art" alt=""></div></section><article class="relphi-focus-entry tarot-detail" aria-label="Full Tarot Ledger entry"></article></div><footer><button type="button" class="relphi-focus-prev" aria-label="Previous position">‹</button><div class="relphi-focus-navigator"><div class="relphi-focus-strip" aria-label="Reading positions"></div></div><button type="button" class="relphi-focus-next" aria-label="Next position">›</button></footer></div>`;
    renderFocusEntry(reader,index);
    renderFocusStrip(reader,index,{preserveScroll:false});
    installFocusStripScrub(reader);
    reader.querySelector('.relphi-focus-close').addEventListener('click',()=>closeFocus({acknowledge:true}));
    reader.querySelector('.relphi-focus-prev').addEventListener('click',()=>navigateFocusBy(-1));
    reader.querySelector('.relphi-focus-next').addEventListener('click',()=>navigateFocusBy(1));
    installFocusSwipe(reader);
    document.body.appendChild(reader);
    document.body.classList.add('relphi-focus-open');
    return true;
  }
  function isCrossingPosition(index) {
    if (index<0) return false;
    const snap=currentSnapshot() || {};
    return positionRoleAt(index,snap)==='crossing' || positionIdAt(index,snap)==='crossing';
  }
  function closeFocus({acknowledge=true}={}) {
    const leaving=focusIndex;
    document.querySelector('.relphi-focus-reader')?.remove();
    document.body.classList.remove('relphi-focus-open');
    focusIndex=-1;
    if (acknowledge && isCrossingPosition(leaving)) acknowledgeCelticCrossing();
  }
  function navigateFocusTo(nativeIndex) {
    const next=Number(nativeIndex);
    if (!Number.isInteger(next)) return;
    const leaving=focusIndex;
    if (leaving>=0 && leaving!==next && isCrossingPosition(leaving)) acknowledgeCelticCrossing();
    if (cardAt(next)) openFocus(next);
    else drawInto(focusItem(next),next);
  }
  function navigateFocusBy(delta) {
    const order=orderedNativePositionIndices();
    if (!order.length) return closeFocus({acknowledge:true});
    const currentIndex=order.indexOf(focusIndex);
    const current=currentIndex>=0 ? currentIndex : 0;
    if (delta>0 && current>=order.length-1) {
      if (configuredPositionCount()===0) drawNextLogical(panel());
      return;
    }
    const logical=Math.max(0,Math.min(order.length-1,current+delta));
    navigateFocusTo(order[logical]);
  }

  function isEmptyItem(item) { return !!item && !item.querySelector('[data-row-card]') && item.classList.contains('card-row-placeholder-item'); }
  function drawInto(item, suppliedIndex) {
    const root=panel();
    if (!root || activeDraw || !isEmptyItem(item) || currentPrefabState().designMode) return;
    const draw=root.querySelector('#drawRandomRowCard');
    if (!draw || draw.disabled) return;
    const targetIndex=Number.isInteger(suppliedIndex)?suppliedIndex:Number(item.dataset.rowIndex);
    const drawnIndex=currentCardCount(root);
    if (!Number.isInteger(targetIndex)||targetIndex<0) return;
    activeDraw=true;
    pendingFocusIndex=drawnIndex;
    draw.click();
    if (targetIndex!==drawnIndex) prefabBridge()?.swapPositionSlots?.(drawnIndex,targetIndex);
    activeDraw=false;
  }
  function nextUndrawnNativeIndex(root=panel()) {
    return orderedNativePositionIndices().find(index=>!cardAt(index,root) && isEmptyItem(focusItem(index,root))) ?? null;
  }
  function drawNextLogical(root=panel()) {
    if (!root || activeDraw) return;
    const next=nextUndrawnNativeIndex(root);
    if (next!=null) { drawInto(focusItem(next,root),next); return; }
    if (configuredPositionCount()>0) return;
    const draw=root.querySelector('#drawRandomRowCard');
    if (!draw || draw.disabled) return;
    activeDraw=true;
    pendingFocusIndex=currentCardCount(root);
    draw.click();
    activeDraw=false;
  }

  function installLockedLayoutPointerGuards(root) {
    root.querySelectorAll('.card-row-board>.card-row-item[data-row-index]>.card-row-drop-card,.card-row-board>.card-row-item[data-row-index]>.card-row-card-wrap').forEach(surface => {
      if (surface.dataset.relphiLockedPointerGuard==='true') return;
      surface.dataset.relphiLockedPointerGuard='true';
      surface.addEventListener('pointerdown', event => {
        if (event.target.closest('button,input,textarea,select,label,[contenteditable="true"],[data-row-transform-handle]')) return;
        const state=currentPrefabState();
        if (state.locked && !state.designMode) event.stopPropagation();
      });
    });
  }
  function installBoardCapture(root) {
    const board=root.querySelector('.card-row-board');
    if (!board || board.dataset.relphiUnifiedCapture==='true') return;
    board.dataset.relphiUnifiedCapture='true';
    board.addEventListener('click',event=>{
      const item=event.target.closest('.card-row-item[data-row-index]');
      if (!item || !board.contains(item)) return;
      if (event.target.closest('button,input,textarea,select,label,[contenteditable="true"],[data-row-transform-handle]')) return;
      const index=Number(item.dataset.rowIndex);
      if (!Number.isInteger(index)) return;
      if (item.querySelector('[data-row-card]')) {
        event.preventDefault(); event.stopImmediatePropagation(); openFocus(index); return;
      }
      if (isEmptyItem(item)) {
        event.preventDefault(); event.stopImmediatePropagation(); drawInto(item,index);
      }
    },true);
  }
  function installTopActions(root) {
    const options=root.querySelector('#drawingBoardOptionsButton');
    if (options) {
      options.textContent='Referents';
      options.setAttribute('aria-expanded',String(!!optionsSession));
      options.onclick=null;
      if (options.dataset.relphiUnifiedOptions!=='true') {
        options.dataset.relphiUnifiedOptions='true';
        options.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();openOptions(root);},true);
      }
    }
    const draw=root.querySelector('#drawRandomRowCard');
    if (draw && draw.dataset.relphiUnifiedDraw!=='true') {
      draw.dataset.relphiUnifiedDraw='true';
      draw.addEventListener('click',()=>{ pendingFocusIndex=currentCardCount(root); },true);
    }
  }
  function markSemanticPositions(root) {
    const snap=currentSnapshot() || {};
    root.querySelectorAll('.card-row-board>.card-row-item[data-row-index]').forEach(item=>{
      const index=Number(item.dataset.rowIndex);
      if (!Number.isInteger(index)) return;
      const id=positionIdAt(index,snap);
      if (id) item.dataset.relphiPositionId=id;
      else delete item.dataset.relphiPositionId;
    });
  }
  function updateLayoutClasses(root) {
    const layout=currentPrefabState().activeLayout || {};
    const id=layout.id || '';
    const isCeltic=id==='celtic-cross-10' || layout.basedOn==='celtic-cross-10';
    root.classList.toggle('relphi-celtic-cross',isCeltic);
    root.classList.toggle('relphi-six-polarities',id==='six-polarities-houses-12' || layout.basedOn==='six-polarities-houses-12');
    const snap=isCeltic?currentSnapshot():null;
    const acknowledged=!!snap?.rowPositionMeta?.some?.(meta=>meta?.celticCrossAcknowledged);
    root.classList.toggle('relphi-celtic-crossed',isCeltic&&acknowledged);
  }

  function enhance(root = panel()) {
    if (!root) return;
    const trigger=document.getElementById('relphiOpenDrawingBoardCurrent');
    if (!initialized) initialized=true;
    boardOpen=trigger?.getAttribute('aria-expanded')==='true';
    if (!boardOpen) {
      root.hidden=true;
      if (trigger) { trigger.textContent='Open Drawing Board'; trigger.setAttribute('aria-expanded','false'); }
      return;
    }
    root.hidden=false;
    root.removeAttribute('hidden');
    if (migrateLegacyDenseAutoLayout(root)) return;
    root.classList.toggle('relphi-hide-position-stickers',!showPositionStickers);
    markSemanticPositions(root);
    updateLayoutClasses(root);
    installTopActions(root);
    installPermanentControls(root);
    installPinchZoom(root);
    installReadingTextArea(root);
    installExportArea(root);
    installLockedLayoutPointerGuards(root);
    installBoardCapture(root);
    if (optionsSession) renderOptions(root);
    if (pendingFocusIndex!=null) {
      const target=pendingFocusIndex;
      if (cardAt(target,root)) {
        pendingFocusIndex=null;
        if (configuredPositionCount()===0) zoomExtents();
        setTimeout(()=>openFocus(target),0);
      }
    }
  }

  function clearCardsOnly(root=panel()) {
    const bridge=optionsBridge();
    const trigger=document.getElementById('relphiOpenDrawingBoardCurrent');
    if (!root || !bridge || !trigger) return false;
    const snapshot=bridge.capture();
    if (!snapshot) return false;
    boardOpen=true;
    trigger.textContent='Close Drawing Board';
    trigger.setAttribute('aria-expanded','true');
    root.hidden=false;
    root.removeAttribute('hidden');
    snapshot.shortList=[];
    snapshot.shortListSelection=[];
    snapshot.rowCardReversals={};
    snapshot.rowCardManual=[];
    snapshot.rowDrawDeck=[];
    snapshot.rowDrawDeckSignature='';
    snapshot.cardRowBoardOpen=true;
    bridge.restore(snapshot);
    return true;
  }

  function globalCapture(event) {
    const trigger=event.target.closest?.('#relphiOpenDrawingBoardCurrent');
    if (trigger) {
      event.preventDefault(); event.stopImmediatePropagation();
      const wasOpen=trigger.getAttribute('aria-expanded')==='true';
      setBoardOpen(!wasOpen,{fit:!wasOpen});
      return;
    }
    const root=panel();
    const optionsTrigger=event.target.closest?.('#shortListPanel #drawingBoardOptionsButton');
    if (optionsTrigger && root?.contains(optionsTrigger)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openOptions(root);
      return;
    }
    const clearCardsTrigger=event.target.closest?.('#shortListPanel #clearShortListCardsOnly');
    if (clearCardsTrigger && root?.contains(clearCardsTrigger)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      clearCardsOnly(root);
      return;
    }
    const drawTrigger=event.target.closest?.('#shortListPanel #drawRandomRowCard');
    if (drawTrigger && root?.contains(drawTrigger) && !activeDraw) {
      event.preventDefault();
      event.stopImmediatePropagation();
      drawNextLogical(root);
      return;
    }
    const item=event.target.closest?.('#shortListPanel .card-row-board>.card-row-item[data-row-index]');
    if (item && root?.contains(item) && !event.target.closest?.('button,input,textarea,select,label,[contenteditable="true"],[data-row-transform-handle]')) {
      const index=Number(item.dataset.rowIndex);
      if (Number.isInteger(index)) {
        if (item.querySelector('[data-row-card]')) {
          event.preventDefault(); event.stopImmediatePropagation();
          openFocus(index);
          return;
        }
        if (isEmptyItem(item)) {
          event.preventDefault(); event.stopImmediatePropagation();
          drawInto(item,index);
          return;
        }
      }
    }
    if (openTool && !event.target.closest?.('.relphi-workspace-tools')) {
      openTool='';
      enhance(panel());
    }
  }

  window.addEventListener('click',globalCapture,true);
  document.addEventListener('keydown',event=>{
    const reader=document.querySelector('.relphi-focus-reader');
    const target=event.target;
    const editable=!!target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName || ''));
    if (reader && !editable && (event.key==='ArrowLeft' || event.key==='ArrowRight')) {
      event.preventDefault();
      navigateFocusBy(event.key==='ArrowLeft' ? -1 : 1);
      return;
    }
    if (event.key!=='Escape') return;
    if (reader) closeFocus({acknowledge:true});
    else if (optionsSession) closeOptions(panel());
    else if (openTool) { openTool=''; enhance(panel()); }
  });
  document.addEventListener('relphi:drawing-board-rendered',()=>enhance(panel()));
  window.addEventListener('relphi:tarot-enhancements-ready',()=>enhance(panel()));
  window.addEventListener('resize',()=>{ if(boardOpen) zoomExtents(); });

  function boot() {
    const root=panel();
    const trigger=document.getElementById('relphiOpenDrawingBoardCurrent');
    if (!root || !trigger || !prefabBridge() || !optionsBridge()) return false;
    initialized=true;
    boardOpen=trigger.getAttribute('aria-expanded')==='true' && !root.hidden;
    if (!boardOpen) { root.hidden=true; trigger.textContent='Open Drawing Board'; trigger.setAttribute('aria-expanded','false'); }
    else enhance(root);
    return true;
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{setTimeout(boot,0);setTimeout(boot,120);},{once:true});
  else { setTimeout(boot,0); setTimeout(boot,120); }
})();
