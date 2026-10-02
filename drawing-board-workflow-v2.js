// Oracle of Relphi Drawing Board enhancement layer.
// Native board state and rendering remain owned by tarot-app.js. This file owns
// only the stable Drawing Board UI, shipped spread definitions, and reading flow.
(function () {
  'use strict';
  if (!location.pathname.endsWith('/tarot.html') && location.pathname !== 'tarot.html') return;
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
  const GUTTER = 0;
  const START_EDGE_GUTTER = 4;
  const MAX_POSITIONS = 78; // One full tarot deck; dense layouts may zoom below card-scale defaults.

  let boardOpen = false;
  let initialized = false;
  let optionsSession = null;
  let craftedReadingActive = false;
  let focusIndex = -1;
  let suppressStripClickUntil = 0;
  let pendingFocusIndex = null;
  let activeDraw = false;
  let openTool = '';
  let transformEditingUnlocked = false;
  let showPositionStickers = readStickerVisibility();
  let surfaceReadingSession = null;
  let recursionSession = null;
  let recursionPortalLevel = 0;
  let attuneIndex = -1;
  let attuneViewportLock = null;
  let settingsOpen = false;
  let settingsMode = 'free';
  let settingsBaseline = null;
  let freeSettingsSession = null;
  let boardSetupConfirmed = false;
  let activeCraftedPath = '';
  let boardConfigurationOpen = false;
  let boardBackgroundMode = '';
  let sacredResumeGateHandled = false;
  const BOARD_TRANSFORM_LOCKS_KEY = 'relphiBoardTransformLocksV1';
  const BOARD_CARD_CONTROLS_FREE_KEY = 'relphiBoardCardControlsFreeV1';
  const BOARD_CARD_CONTROLS_BESPOKE_KEY = 'relphiBoardCardControlsBespokeV1';
  const BOARD_BACKGROUND_DEFAULT_KEY = 'relphiBoardBackgroundDefaultV1';
  const BOARD_RECENT_COLORS_KEY = 'relphiBoardRecentColorsV1';
  const BOARD_RECENT_IMAGES_KEY = 'relphiBoardRecentImagesV1';

  function panel() { return document.getElementById(PANEL_ID); }
  function prefabBridge() { return window.RelphiDrawingBoardPrefabsBridge || null; }
  function optionsBridge() { return window.RelphiDrawingBoardOptionsBridge || null; }
  function ledgerBridge() { return window.RelphiTarotLedgerBridge || null; }
  function persistedCraftedPath(root=panel()) {
    const snap=currentSnapshot()||{};
    return String(
      activeCraftedPath ||
      snap.rowActiveLayout?.relphiCraftedPath ||
      snap.rowPositionMeta?.find?.(meta=>meta?.craftedPath)?.craftedPath ||
      ''
    );
  }
  function zoomToolbarVisibleForState(root=panel()) {
    if(!root)return true;
    if(settingsOpen){
      if(settingsMode==='free')return true;
      return String(optionsSession?.path||activeCraftedPath||'')==='bespoke';
    }
    if(craftedReadingActive||boardHasCraftedStructure(root))return persistedCraftedPath(root)==='bespoke';
    return true;
  }
  function cardControlsPath(root=panel()) {
    if(settingsOpen) return settingsMode==='free' ? 'free' : (String(optionsSession?.path||activeCraftedPath||'')==='bespoke' ? 'bespoke' : '');
    if(craftedReadingActive||boardHasCraftedStructure(root)) return persistedCraftedPath(root)==='bespoke' ? 'bespoke' : '';
    return 'free';
  }
  function cardControlsEnabled(root=panel()){
    const path=cardControlsPath(root);
    if(!path)return false;
    const key=path==='bespoke'?BOARD_CARD_CONTROLS_BESPOKE_KEY:BOARD_CARD_CONTROLS_FREE_KEY;
    try{return localStorage.getItem(key)!=='false';}catch(_){return true;}
  }
  function writeCardControlsEnabled(enabled,root=panel()){
    const path=cardControlsPath(root);
    if(!path)return false;
    const key=path==='bespoke'?BOARD_CARD_CONTROLS_BESPOKE_KEY:BOARD_CARD_CONTROLS_FREE_KEY;
    try{localStorage.setItem(key,String(!!enabled));}catch(_){}
    return true;
  }
  function bespokeEditingAllowed(){ return (optionsSession?.path || activeCraftedPath || 'bespoke') === 'bespoke'; }
  function transformEditingAllowed(root=panel()) {
    if(!root||!cardControlsEnabled(root))return false;
    if(settingsOpen)return settingsMode==='free' || String(optionsSession?.path||activeCraftedPath||'')==='bespoke';
    if(craftedReadingActive||boardHasCraftedStructure(root))return persistedCraftedPath(root)==='bespoke';
    return true;
  }
  function syncTransformEditingAvailability(root=panel()) {
    const allowed=transformEditingAllowed(root);
    root?.classList.toggle('relphi-transform-editing-unlocked',allowed);
    if(allowed)syncTransformLocks(root);
    else{
      root?.classList.remove('relphi-drag-unlocked','relphi-rotation-unlocked','relphi-scale-unlocked');
    }
    return allowed;
  }
  function syncZoomToolbarVisibility(root=panel()) {
    if(!root)return true;
    const visible=zoomToolbarVisibleForState(root);
    root.classList.toggle('relphi-hide-zoom-toolbar',!visible);
    const toolbar=root.querySelector('.card-row-workspace-toolbar.relphi-board-controller');
    if(toolbar)toolbar.setAttribute('aria-hidden',String(!visible));
    syncTransformEditingAvailability(root);
    return visible;
  }
  function visibleToolbarHeight(root=panel()) {
    const toolbar=root?.querySelector('.card-row-workspace-toolbar.relphi-board-controller');
    return toolbar && getComputedStyle(toolbar).display!=='none' ? toolbar.offsetHeight : 0;
  }
  function stampCraftedPath(path,root=panel()) {
    const bridge=optionsBridge(),snap=bridge?.capture?.();
    if(!bridge||!snap)return false;
    const craftedPath=String(path||'');
    activeCraftedPath=craftedPath;
    if(snap.rowActiveLayout)snap.rowActiveLayout={...snap.rowActiveLayout,relphiCraftedPath:craftedPath};
    if(Array.isArray(snap.rowPositionMeta))snap.rowPositionMeta=snap.rowPositionMeta.map(meta=>({...meta,craftedPath}));
    bridge.restore(snap);
    syncZoomToolbarVisibility(root);
    return true;
  }

  function zoomLimits() {
    const limits=optionsBridge()?.zoomLimits || {};
    const min=Number(limits.min),max=Number(limits.max);
    return {
      min:Number.isFinite(min)&&min>0?min:.02,
      max:Number.isFinite(max)&&max>0?max:2.4
    };
  }
  function recursionFitZoomFloor(root=panel()) {
    if (!recursionActive()) return null;
    const workspace=root?.querySelector('.card-row-workspace');
    if (!workspace) return null;
    const bounds=renderedContentBounds(root);
    const toolbarH=visibleToolbarHeight(root);
    const availableW=Math.max(1,workspace.clientWidth-GUTTER*2);
    const availableH=Math.max(1,workspace.clientHeight-toolbarH-GUTTER*2);
    const contentW=Math.max(1,bounds.maxX-bounds.minX);
    const contentH=Math.max(1,bounds.maxY-bounds.minY);
    const limits=zoomLimits();
    return clamp(Math.min(availableW/contentW,availableH/contentH),limits.min,limits.max);
  }
  function syncRecursionZoomFloor(root=panel()) {
    const input=zoomInput(root);
    if (!input) return null;
    if (!input.dataset.relphiBaseMin) input.dataset.relphiBaseMin=String(input.min || zoomLimits().min);
    const baseMin=Number(input.dataset.relphiBaseMin) || zoomLimits().min;
    const floor=recursionFitZoomFloor(root);
    const nextMin=Number.isFinite(floor)?Math.max(baseMin,floor):baseMin;
    input.min=String(nextMin);
    if ((Number(input.value)||1)<nextMin) {
      input.value=String(nextMin);
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.dispatchEvent(new Event('change',{bubbles:true}));
    }
    return nextMin;
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
    // Auto-laid cards pack flush. Spare canvas space belongs after the pack,
    // not between cards; a gap only appears after the reader deliberately moves one.
    const gapX=GUTTER;
    const gapY=GUTTER;
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
    'What covers you',
    'What crosses you',
    'What crowns you',
    'What is beneath you',
    'What is behind you',
    'What is before you',
    'Yourself',
    'Your house',
    'Your hopes or fears',
    'What will come'
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


  const RECURSION_ID = 'relphi-recursion-22';
  const RECURSION_LEVELS = 7;
  const RECURSION_VEILVA_BODIES = Object.freeze(['saturn','jupiter','mars','sun','venus','mercury','moon']);
  const RECURSION_LOGO_GEOMETRY = Object.freeze({
    // Transform coordinates are the unscaled card-envelope top-lefts.
    // At the canonical .44 card scale, each card face is centered inside one logo circle.
    mem:Object.freeze({x:.310,y:.170}),
    aleph:Object.freeze({x:.490,y:.170}),
    shin:Object.freeze({x:.310,y:.385}),
    earth:Object.freeze({x:.490,y:.385})
  });
  const RECURSION_TRIAD = Object.freeze([
    { key:'mem', label:'Mem · Water', glyph:'מ', role:'recursion-mem', ...RECURSION_LOGO_GEOMETRY.mem },
    { key:'aleph', label:'Aleph · Air', glyph:'א', role:'recursion-aleph', ...RECURSION_LOGO_GEOMETRY.aleph },
    { key:'shin', label:'Shin · Fire', glyph:'ש', role:'recursion-shin', ...RECURSION_LOGO_GEOMETRY.shin }
  ]);
  function recursionPositions() {
    const positions=[];
    let drawOrder=1;
    for (let level=1;level<=RECURSION_LEVELS;level++) {
      RECURSION_TRIAD.forEach(item=>{
        positions.push(position(
          `recursion-${level}-${item.key}`,
          `Level ${level} · ${item.label}`,
          drawOrder++,
          transform(item.x,item.y,.44),
          { role:item.role, recursionLevel:level, recursionElement:item.key, recursionGlyph:item.glyph }
        ));
      });
      if (level===RECURSION_LEVELS) {
        positions.push(position(
          'recursion-7-earth',
          'Level 7 · Earth · Completion · Seed',
          drawOrder++,
          transform(RECURSION_LOGO_GEOMETRY.earth.x,RECURSION_LOGO_GEOMETRY.earth.y,.44),
          { role:'recursion-earth', recursionLevel:7, recursionElement:'earth', recursionGlyph:'🜃' }
        ));
      }
    }
    return positions;
  }
  const RELPHI_RECURSION = {
    version:1,
    id:RECURSION_ID,
    name:'Relphi Recursive Reading',
    cardCount:22,
    virtualPositionCount:6,
    source:'shipped',
    editable:false,
    recursion:true,
    positions:recursionPositions(),
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
    RELPHI_RECURSION,
    {
      version:1,
      id:'crowley-harmonic-divination-12',
      name:'Opening of the Key · Full Divination',
      cardCount:12,
      source:'shipped',
      editable:false,
      helper:'crowley-harmonic',
      methodOperations:[
        {number:1,name:'Opening of the Question',structure:'IHVH · four piles'},
        {number:2,name:'Development of the Question',structure:'12 astrological houses'},
        {number:3,name:'Further Development of the Question',structure:'12 zodiac signs'},
        {number:4,name:'Penultimate Aspects of the Question',structure:'Significator + 36-card ring'},
        {number:5,name:'Final Result',structure:'10 Tree of Life piles'}
      ],
      positions:Array.from({length:12}, (_, index) => {
        const angle=(-90 + index*30) * Math.PI / 180;
        const x=.43 + Math.cos(angle)*.34;
        const y=.39 + Math.sin(angle)*.31;
        return {
          id:'crowley-' + (index+1),
          label:String(index+1),
          drawOrder:index+1,
          transform:transform(x,y,.43,0),
          harmonicIndex:index
        };
      }),
      rules:{allowReversals:false,allowRepeats:false,drawScope:'full'}
    },
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
    return { templateId:'', basedOnTemplateId:'', labels:[], positionPacks:[], positionSettings:[], pack:'full', keywordTags:[], keywordMatchMode:'any', stickers:true, reversals:true, repeats:false, templateName:'Unnamed Template' };
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
      positionPacks:Array.from({length:Array.isArray(snap.shortListPositionLabels)?snap.shortListPositionLabels.length:0},(_,index)=>
        String(snap.rowPositionMeta?.[index]?.drawScope || state.activeLayout?.positions?.[index]?.drawScope || '')
      ),
      positionSettings:Array.from({length:Array.isArray(snap.shortListPositionLabels)?snap.shortListPositionLabels.length:0},(_,index)=>({
        pack:String(snap.rowPositionMeta?.[index]?.drawScope || state.activeLayout?.positions?.[index]?.drawScope || snap.rowDrawScope || 'full'),
        reversals:snap.rowPositionMeta?.[index]?.allowReversals ?? state.activeLayout?.positions?.[index]?.allowReversals ?? (snap.rowAllowReversals !== false),
        repeats:snap.rowPositionMeta?.[index]?.allowRepeats ?? state.activeLayout?.positions?.[index]?.allowRepeats ?? !!snap.rowAllowRepeats,
        cardCount:Math.max(1,Number(snap.rowPositionMeta?.[index]?.cardCount ?? state.activeLayout?.positions?.[index]?.cardCount ?? 1)||1),
        linkTo:String(snap.rowPositionMeta?.[index]?.linkTo ?? state.activeLayout?.positions?.[index]?.linkTo ?? '')
      })),
      pack:String(snap.rowDrawScope || 'full'),
      keywordTags:Array.isArray(snap.rowSelectedTags) ? snap.rowSelectedTags.slice() : [],
      keywordMatchMode:snap.rowTagMatchMode==='all' ? 'all' : 'any',
      stickers:showPositionStickers,
      reversals:snap.rowAllowReversals !== false,
      repeats:!!snap.rowAllowRepeats,
      templateName:String(state.activeLayout?.name || '')
    };
  }
  function freeSettingsDraftFromState() {
    const draft=draftFromState();
    return {
      pack:draft.pack||'full',
      keywordTags:Array.isArray(draft.keywordTags)?draft.keywordTags.slice():[],
      keywordMatchMode:draft.keywordMatchMode==='all'?'all':'any',
      stickers:draft.stickers!==false,
      reversals:draft.reversals!==false,
      repeats:!!draft.repeats
    };
  }

  function freeSettingsAreDefault(draft=freeSettingsDraftFromState()) {
    return String(draft.pack||'full')==='full' &&
      !(draft.keywordTags||[]).length &&
      draft.keywordMatchMode!=='all' &&
      draft.stickers===false &&
      draft.reversals!==false &&
      !draft.repeats;
  }

  function transformLocks() {
    const saved=safeLocalJson(BOARD_TRANSFORM_LOCKS_KEY,{drag:true,rotation:true,scale:true});
    return {
      drag:saved?.drag!==false,
      rotation:saved?.rotation!==false,
      scale:saved?.scale!==false
    };
  }
  function writeTransformLocks(value) {
    try { localStorage.setItem(BOARD_TRANSFORM_LOCKS_KEY,JSON.stringify(value)); } catch (_) {}
  }
  function syncTransformLocks(root=panel()) {
    const locks=transformLocks();
    root?.classList.toggle('relphi-drag-unlocked',!!locks.drag);
    root?.classList.toggle('relphi-rotation-unlocked',!!locks.rotation);
    root?.classList.toggle('relphi-scale-unlocked',!!locks.scale);
    return locks;
  }

  function safeLocalJson(key,fallback) {
    try { const value=JSON.parse(localStorage.getItem(key)||'null'); return value ?? fallback; } catch (_) { return fallback; }
  }
  function boardBackgroundDefault() {
    const saved=safeLocalJson(BOARD_BACKGROUND_DEFAULT_KEY,null);
    if(saved && (saved.mode==='color'||saved.mode==='image')) return {
      mode:saved.mode,
      color:String(saved.color||'#7d1f28'),
      image:String(saved.image||'')
    };
    return {mode:'color',color:'#7d1f28',image:''};
  }
  function writeBoardBackgroundDefault(value) {
    try { localStorage.setItem(BOARD_BACKGROUND_DEFAULT_KEY,JSON.stringify(value)); } catch (_) {}
  }
  function normalizeRecent(values,type) {
    const now=Date.now();
    return (Array.isArray(values)?values:[]).map((item,index)=>{
      if(type==='color' && typeof item==='string') return {value:item,pinned:false,lastUsed:now-index};
      if(type==='image' && item?.data && !('lastUsed' in item)) return {data:item.data,name:item.name||'Image',pinned:false,lastUsed:now-index};
      return item;
    }).filter(item=>type==='color'?!!item?.value:!!item?.data);
  }
  function pruneRecents(values) {
    const pinned=values.filter(item=>item.pinned);
    const loose=values.filter(item=>!item.pinned).sort((a,b)=>(b.lastUsed||0)-(a.lastUsed||0)).slice(0,8);
    return [...pinned,...loose];
  }
  function recentBoardColors() {
    return pruneRecents(normalizeRecent(safeLocalJson(BOARD_RECENT_COLORS_KEY,[]),'color'));
  }
  function rememberBoardColor(value,pinned=null) {
    const color=String(value||'').trim(); if(!color)return;
    const existing=recentBoardColors().find(item=>item.value===color);
    const item={value:color,pinned:pinned==null?!!existing?.pinned:!!pinned,lastUsed:Date.now()};
    const next=pruneRecents([item,...recentBoardColors().filter(other=>other.value!==color)]);
    try { localStorage.setItem(BOARD_RECENT_COLORS_KEY,JSON.stringify(next)); } catch (_) {}
  }
  function recentBoardImages() {
    return pruneRecents(normalizeRecent(safeLocalJson(BOARD_RECENT_IMAGES_KEY,[]),'image'));
  }
  function rememberBoardImage(data,name='Image',pinned=null) {
    const value=String(data||''); if(!value)return;
    const existing=recentBoardImages().find(item=>item.data===value);
    const item={data:value,name:String(name||existing?.name||'Image').slice(0,60),pinned:pinned==null?!!existing?.pinned:!!pinned,lastUsed:Date.now()};
    const next=pruneRecents([item,...recentBoardImages().filter(other=>other.data!==value)]);
    try { localStorage.setItem(BOARD_RECENT_IMAGES_KEY,JSON.stringify(next)); } catch (_) {}
  }
  function boardResetReasons(root=panel()) {
    const snap=currentSnapshot()||{};
    const cards=currentCardCount(root);
    const crafted=boardHasCraftedStructure(root);
    const meaningfulGeometry=cards>0||crafted;
    const background=boardBackgroundDefault();
    const backgroundChanged=String(snap.rowTableColor||'#7d1f28')!==String(background.color||'#7d1f28') ||
      String(snap.rowTableImage||'')!==(background.mode==='image'?String(background.image||''):'');
    const appearanceChanged=String(snap.rowEnvelopeColor||'#f3f0ea')!=='#f3f0ea' ||
      snap.rowSnapEnabled===false ||
      String(snap.rowSnapGrid||'one-eighth')!=='one-eighth' ||
      snap.rowRotationSnapEnabled===false ||
      Number(snap.rowRotationSnapDegrees||15)!==15 ||
      backgroundChanged ||
      Object.keys(snap.rowEnvelopeArt||{}).length>0 ||
      Object.keys(snap.customCardArt||{}).length>0;
    const geometryChanged=meaningfulGeometry&&(
      Object.keys(snap.rowEnvelopeLayout||{}).length>0 ||
      Object.keys(snap.rowCardTransforms||{}).length>0
    );
    return {
      cards:cards>0,
      crafted,
      drawSettings:!freeSettingsAreDefault(),
      appearance:appearanceChanged,
      geometry:geometryChanged
    };
  }
  function boardCanReset(root=panel()) {
    return Object.values(boardResetReasons(root)).some(Boolean);
  }

  function ensureSettingsTransaction(root=panel()) {
    if(settingsBaseline||!root)return;
    settingsBaseline={
      snapshot:clone(currentSnapshot()||{}),
      stickers:showPositionStickers,
      craftedReadingActive:!!craftedReadingActive,
      surfaceReadingSession:clone(surfaceReadingSession),
      recursionSession:clone(recursionSession),
      recursionPortalLevel:Number(recursionPortalLevel)||0
    };
    settingsMode=(craftedReadingActive||boardHasCraftedStructure(root))?'crafted':'free';
    freeSettingsSession={draft:freeSettingsDraftFromState()};
  }

  function ensureBoardChrome(root=panel()) {
    const boardDrawer=root?.querySelector('.card-row-drawing-board');
    const summary=boardDrawer?.querySelector(':scope > summary');
    const boardMode=root?.querySelector('.drawing-board-board-mode');
    const modeSwitch=root?.querySelector('.drawing-board-mode-switch');
    const topActions=root?.querySelector('.drawing-board-top-actions');
    if(!root||!boardDrawer||!summary||!boardMode||!modeSwitch||!topActions)return null;

    boardDrawer.open=true;
    summary.hidden=true;

    let bar=boardDrawer.querySelector(':scope > .relphi-board-commandbar');
    if(!bar){
      bar=document.createElement('div');
      bar.className='relphi-board-commandbar';
      bar.innerHTML='<div class="relphi-board-command-left"><div class="relphi-board-command-title"><strong>Drawing Board</strong><span class="relphi-board-command-count">0</span></div><button type="button" id="relphiBoardSettingsButton" aria-expanded="false">Settings</button></div>';
      summary.insertAdjacentElement('afterend',bar);
    }
    const count=bar.querySelector('.relphi-board-command-count');
    if(count)count.textContent=String(currentCardCount(root));

    topActions.classList.add('relphi-board-command-actions');
    if(topActions.parentElement!==bar)bar.appendChild(topActions);
    // Sky Connector installs itself into the native action host. Reparenting that
    // host can happen after its own install event, so explicitly restore it here.
    window.RelphiSkyConnector?.install?.();

    const clear=root.querySelector('#clearShortListCardsOnly');
    const undo=root.querySelector('#undoShortList');
    const redo=root.querySelector('#redoShortList');
    const draw=root.querySelector('#drawRandomRowCard');
    let reset=root.querySelector('#relphiResetBoard');
    if(!reset){
      reset=document.createElement('button');
      reset.type='button';
      reset.id='relphiResetBoard';
      reset.textContent='Reset Board';
    }
    reset.title='Restore default settings';
    reset.setAttribute('aria-label','Restore default settings');
    reset.disabled=!boardCanReset(root);
    topActions.appendChild(reset);
    if(clear){
      clear.textContent='Clear';
      clear.title='Clear the cards without changing settings';
      clear.setAttribute('aria-label','Clear the cards without changing settings');
    }
    const freeMode=!(craftedReadingActive||boardHasCraftedStructure(root));
    bar.classList.toggle('relphi-board-free-mode',freeMode);
    if(undo)undo.hidden=!freeMode;
    if(redo)redo.hidden=!freeMode;
    if(undo){
      undo.classList.add('board-history-icon');
      undo.title='Undo';
      undo.setAttribute('aria-label','Undo');
      if(!undo.querySelector('svg')) undo.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M9 7 4 12l5 5"></path><path d="M4 12h9a7 7 0 0 1 7 7"></path></svg>';
      topActions.appendChild(undo);
    }
    if(redo){
      redo.classList.add('board-history-icon');
      redo.title='Redo';
      redo.setAttribute('aria-label','Redo');
      if(!redo.querySelector('svg')) redo.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="m15 7 5 5-5 5"></path><path d="M20 12h-9a7 7 0 0 0-7 7"></path></svg>';
      topActions.appendChild(redo);
    }
    if(clear)topActions.appendChild(clear);
    if(draw){draw.textContent='Draw';draw.title='Draw a card';draw.setAttribute('aria-label','Draw a card');topActions.appendChild(draw);}

    let settingsPanel=boardDrawer.querySelector(':scope > .relphi-board-settings-panel');
    if(!settingsPanel){
      settingsPanel=document.createElement('section');
      settingsPanel.className='relphi-board-settings-panel';
      settingsPanel.setAttribute('aria-label','Drawing Board settings');
      settingsPanel.innerHTML='<div class="relphi-board-settings-body"></div>';
      bar.insertAdjacentElement('afterend',settingsPanel);
    }
    const body=settingsPanel.querySelector('.relphi-board-settings-body');
    if(body && modeSwitch.parentElement!==body)body.appendChild(modeSwitch);

    // Settings is an overlay: anchor it immediately below the command bar
    // without allowing it to participate in the board's vertical layout.
    const commandBottom=Math.max(0,bar.offsetTop+bar.offsetHeight);
    settingsPanel.style.setProperty('--relphi-settings-top',commandBottom+'px');

    reset.disabled=!boardCanReset(root);

    [...root.querySelectorAll('.relphi-global-board-actions')].forEach(node=>node.remove());
    settingsPanel.hidden=!settingsOpen;
    if(!settingsOpen){boardConfigurationOpen=false;boardBackgroundMode='';}
    root.classList.toggle('relphi-settings-open',settingsOpen);
    const settingsButton=bar.querySelector('#relphiBoardSettingsButton');
    if(settingsButton){
      settingsButton.setAttribute('aria-expanded',String(settingsOpen));
      settingsButton.classList.toggle('is-active',settingsOpen);
    }
    return settingsPanel;
  }

  function boardConfigurationAllowed(root=panel()) {
    if(!root||!settingsOpen)return false;
    if(settingsMode==='free')return true;
    return String(optionsSession?.path||activeCraftedPath||'')==='bespoke';
  }

  function renderBoardConfiguration(root=panel()) {
    const settingsPanel=ensureBoardChrome(root);
    const body=settingsPanel?.querySelector('.relphi-board-settings-body');
    if(!settingsPanel||!body)return;
    const drawer=settingsMode==='free' ? null : body.querySelector('.relphi-reading-options-drawer');
    const host=settingsMode==='free'
      ? body.querySelector('.relphi-free-settings')
      : drawer?.querySelector('.relphi-options-body');
    if(!host)return;

    let section=host.querySelector(':scope > .relphi-board-configuration');
    if(!section){
      section=document.createElement('details');
      section.className='relphi-board-configuration relphi-appearance-disclosure';
      // Crafted Appearance is ordinary scrolling content. The Confirm/Cancel
      // commit bar remains outside .relphi-options-body and therefore static.
      if(settingsMode==='free'){
        const footer=host.querySelector('.relphi-board-settings-footer');
        if(footer)host.insertBefore(section,footer); else host.appendChild(section);
      }else{
        host.appendChild(section);
      }
    }
    const allowed=boardConfigurationAllowed(root);
    section.hidden=!allowed;
    if(section.hidden)return;
    section.open=!!boardConfigurationOpen;

    const snap=root.querySelector('#rowSnapEnabled');
    const snapMinus=root.querySelector('#rowSnapGridMinus');
    const snapValue=root.querySelector('#rowSnapGridValue');
    const snapPlus=root.querySelector('#rowSnapGridPlus');
    const rotate=root.querySelector('#rowRotationSnapEnabled');
    const rotateMinus=root.querySelector('#rowRotationSnapMinus');
    const rotateValue=root.querySelector('#rowRotationSnapValue');
    const rotatePlus=root.querySelector('#rowRotationSnapPlus');
    const resetLayout=root.querySelector('#resetCardRowLayout');
    const envelopeColor=root.querySelector('#rowEnvelopeColor');
    const tableColor=root.querySelector('#rowTableColor');
    const tableUpload=root.querySelector('#rowTableImageUpload');
    const tableFile=root.querySelector('#rowTableImageFile');
    const snapshot=currentSnapshot()||{};
    const visuallyShippedRed=!String(snapshot.rowTableImage||'')&&!String(snapshot.rowEnvelopeImage||'')&&String(snapshot.rowTableColor||'#7d1f28')==='#7d1f28'&&String(snapshot.rowEnvelopeColor||'#f3f0ea')==='#f3f0ea';
    const isShippedRed=visuallyShippedRed && !boardBackgroundMode;

    section.replaceChildren();
    const summary=document.createElement('summary');
    summary.textContent='Appearance';
    section.appendChild(summary);
    const content=document.createElement('div');
    content.className='relphi-appearance-body';
    section.appendChild(content);
    section.addEventListener('toggle',()=>{boardConfigurationOpen=section.open;},{once:true});

    syncTransformEditingAvailability(root);

    const controlGroup=document.createElement('div');
    controlGroup.className='relphi-board-configuration-group';
    controlGroup.innerHTML='<strong>Card controls</strong><label class="relphi-setting-toggle"><input type="checkbox" data-card-controls-master '+(cardControlsEnabled(root)?'checked':'')+'> Enable card controls</label><div class="relphi-control-toggles"></div>';
    controlGroup.querySelector('[data-card-controls-master]')?.addEventListener('change',event=>{writeCardControlsEnabled(event.target.checked,root);syncTransformEditingAvailability(root);renderBoardConfiguration(root);});
    const controlToggles=controlGroup.querySelector('.relphi-control-toggles');
    const locks=transformLocks();
    [['drag','Drag'],['rotation','Rotation'],['scale','Scale']].forEach(([key,label])=>{
      const row=document.createElement('label');
      row.innerHTML='<input type="checkbox" '+(locks[key]?'checked':'')+' '+(!cardControlsEnabled(root)?'disabled':'')+'> '+label;
      row.querySelector('input').addEventListener('change',event=>{
        const next=transformLocks();next[key]=event.target.checked;writeTransformLocks(next);syncTransformEditingAvailability(root);renderBoardConfiguration(root);
      });
      controlToggles.appendChild(row);
    });
    content.appendChild(controlGroup);

    const snaps=document.createElement('div');
    snaps.className='relphi-board-configuration-group';
    snaps.innerHTML='<strong>Snaps</strong>';
    const snapControl=(input,label,minus,value,plus)=>{
      const wrap=document.createElement('div');wrap.className='relphi-snap-control';
      const toggle=document.createElement('label');toggle.className='relphi-setting-toggle';
      if(input)toggle.appendChild(input);
      const text=document.createElement('span');text.textContent=label;toggle.appendChild(text);
      wrap.appendChild(toggle);
      const stepper=document.createElement('div');stepper.className='relphi-snap-stepper';
      [minus,value,plus].filter(Boolean).forEach(node=>stepper.appendChild(node));
      if(input&&!input.checked)stepper.hidden=true;
      wrap.appendChild(stepper);
      return wrap;
    };
    snaps.append(
      snapControl(snap,'Align',snapMinus,snapValue,snapPlus),
      snapControl(rotate,'Rotation',rotateMinus,rotateValue,rotatePlus)
    );
    if(resetLayout){
      resetLayout.textContent='Reset layout';
      resetLayout.title='Make all cards the same size and set them side by side.';
      resetLayout.setAttribute('aria-label','Reset layout. Make all cards the same size and set them side by side.');
      snaps.appendChild(resetLayout);
    }
    content.appendChild(snaps);

    const background=document.createElement('div');
    background.className='relphi-board-configuration-group relphi-board-background';
    background.innerHTML='<strong>Background</strong>';

    const presetRow=document.createElement('div');
    presetRow.className='relphi-background-preset-row';
    const redFelt=document.createElement('button');
    redFelt.type='button';
    redFelt.className='relphi-background-preset-swatch'+(isShippedRed?' is-active':'');
    redFelt.title='Red felt';
    redFelt.setAttribute('aria-label','Use red felt');
    redFelt.style.background='#7d1f28';
    redFelt.addEventListener('click',()=>{
      const bridge=optionsBridge(),snapShot=bridge?.capture?.();if(!bridge||!snapShot)return;
      snapShot.rowTableColor='#7d1f28';
      snapShot.rowTableImage='';
      snapShot.rowEnvelopeColor='#f3f0ea';
      snapShot.rowEnvelopeImage='';
      boardBackgroundMode='';
      bridge.restore(snapShot);
      setTimeout(()=>{ensureBoardChrome(root);renderBoardConfiguration(root);},0);
    });
    const redLabel=document.createElement('span');redLabel.textContent='Red felt';
    presetRow.append(redFelt,redLabel);
    background.appendChild(presetRow);

    {
      const mode=document.createElement('div');mode.className='relphi-background-mode';
      const activeMode=boardBackgroundMode || ((snapshot.rowTableImage||snapshot.rowEnvelopeImage)?'image':'color');
      mode.innerHTML='<button type="button" data-background-mode="color" class="'+(activeMode==='color'?'is-active':'')+'">Color</button><button type="button" data-background-mode="image" class="'+(activeMode==='image'?'is-active':'')+'">Image</button>';
      background.appendChild(mode);

      const rows=document.createElement('div');rows.className='relphi-background-targets';
      const addColorRow=(label,input)=>{
        const row=document.createElement('div');row.className='relphi-background-target-row';
        const labelNode=document.createElement('span');labelNode.textContent=label;
        const swatch=document.createElement('button');swatch.type='button';swatch.className='relphi-background-target-swatch';swatch.style.background=input?.value||'#fff';swatch.title='Choose '+label.toLowerCase()+' color';
        swatch.addEventListener('click',()=>input?.click());
        row.append(labelNode,swatch);
        if(input){input.hidden=true;row.appendChild(input);}
        rows.appendChild(row);
      };
      const addImageRow=(label,kind)=>{
        const row=document.createElement('div');row.className='relphi-background-target-row';
        const labelNode=document.createElement('span');labelNode.textContent=label;
        const swatch=document.createElement('button');swatch.type='button';swatch.className='relphi-background-target-swatch is-image';swatch.title='Choose '+label.toLowerCase()+' image';
        const image=kind==='board'?String(snapshot.rowTableImage||''):String(snapshot.rowEnvelopeImage||'');
        if(image)swatch.style.backgroundImage='url("'+image.replace(/"/g,'%22')+'")';
        swatch.addEventListener('click',()=>{
          if(kind==='board')tableUpload?.click();
          else{
            let file=section.querySelector('#relphiPlaceholderImageFile');
            if(!file){file=document.createElement('input');file.type='file';file.accept='image/*';file.hidden=true;file.id='relphiPlaceholderImageFile';section.appendChild(file);}
            file.onchange=()=>{
              const chosen=file.files?.[0];if(!chosen)return;
              const reader=new FileReader();
              reader.onload=()=>{const bridge=optionsBridge(),s=bridge?.capture?.();if(!bridge||!s)return;s.rowEnvelopeImage=String(reader.result||'');bridge.restore(s);rememberBoardImage(String(reader.result||''),chosen.name);setTimeout(()=>renderBoardConfiguration(root),0);};
              reader.readAsDataURL(chosen);file.value='';
            };
            file.click();
          }
        });
        row.append(labelNode,swatch);rows.appendChild(row);
      };
      if(activeMode==='color'){addColorRow('Board',tableColor);addColorRow('Placeholder',envelopeColor);}
      else{addImageRow('Board','board');addImageRow('Placeholder','placeholder');}
      background.appendChild(rows);

      const history=document.createElement('div');history.className='relphi-background-history';
      history.innerHTML='<span>History</span><div class="relphi-background-history-items"></div>';
      const items=history.querySelector('.relphi-background-history-items');
      if(activeMode==='color'){
        recentBoardColors().forEach(item=>{
          const chip=document.createElement('span');chip.className='relphi-history-chip';
          const sw=document.createElement('button');sw.type='button';sw.className='relphi-recent-color';sw.style.background=item.value;sw.title=item.value;
          sw.addEventListener('click',()=>{if(tableColor){tableColor.value=item.value;tableColor.dispatchEvent(new Event('input',{bubbles:true}));tableColor.dispatchEvent(new Event('change',{bubbles:true}));}rememberBoardColor(item.value);setTimeout(()=>renderBoardConfiguration(root),0);});
          const pin=document.createElement('button');pin.type='button';pin.className='relphi-history-pin';pin.textContent=item.pinned?'📌':'○';pin.title=item.pinned?'Unpin':'Keep';
          pin.addEventListener('click',()=>{rememberBoardColor(item.value,!item.pinned);renderBoardConfiguration(root);});
          chip.append(sw,pin);items.appendChild(chip);
        });
      }else{
        recentBoardImages().forEach(item=>{
          const chip=document.createElement('span');chip.className='relphi-history-chip';
          const sw=document.createElement('button');sw.type='button';sw.className='relphi-recent-image';sw.style.backgroundImage='url("'+item.data.replace(/"/g,'%22')+'")';sw.title=item.name||'Recent image';
          sw.addEventListener('click',()=>{const bridge=optionsBridge(),s=bridge?.capture?.();if(!bridge||!s)return;s.rowTableImage=item.data;bridge.restore(s);rememberBoardImage(item.data,item.name);setTimeout(()=>renderBoardConfiguration(root),0);});
          const pin=document.createElement('button');pin.type='button';pin.className='relphi-history-pin';pin.textContent=item.pinned?'📌':'○';pin.title=item.pinned?'Unpin':'Keep';
          pin.addEventListener('click',()=>{rememberBoardImage(item.data,item.name,!item.pinned);renderBoardConfiguration(root);});
          chip.append(sw,pin);items.appendChild(chip);
        });
      }
      if(items.children.length)background.appendChild(history);

      mode.querySelectorAll('[data-background-mode]').forEach(button=>button.addEventListener('click',()=>{boardBackgroundMode=button.dataset.backgroundMode;renderBoardConfiguration(root);}));
    }
    content.appendChild(background);

    tableColor?.addEventListener('change',()=>{rememberBoardColor(tableColor.value);setTimeout(()=>{ensureBoardChrome(root);renderBoardConfiguration(root);},0);},{once:true});
    envelopeColor?.addEventListener('change',()=>{rememberBoardColor(envelopeColor.value);setTimeout(()=>{ensureBoardChrome(root);renderBoardConfiguration(root);},0);},{once:true});
    tableFile?.addEventListener('change',()=>{
      const file=tableFile.files?.[0];if(!file)return;
      const reader=new FileReader();
      reader.addEventListener('load',()=>{boardBackgroundMode='image';rememberBoardImage(String(reader.result||''),file.name);setTimeout(()=>{ensureBoardChrome(root);renderBoardConfiguration(root);},80);},{once:true});
      reader.readAsDataURL(file);
    },{once:true});
  }

  function renderFreeSettings(root=panel()) {
    const settingsPanel=ensureBoardChrome(root);
    const body=settingsPanel?.querySelector('.relphi-board-settings-body');
    const modeSwitch=body?.querySelector('.drawing-board-mode-switch');
    if(!settingsPanel||!body||!modeSwitch)return;
    body.querySelector('.relphi-reading-options-drawer')?.remove();
    body.querySelector('.relphi-free-settings')?.remove();
    const draft=freeSettingsSession?.draft || (freeSettingsSession={draft:freeSettingsDraftFromState()}).draft;
    const free=document.createElement('section');
    free.className='relphi-free-settings';
    draft.stickers=false;
    free.innerHTML='<div class="relphi-free-settings-fields"><label class="relphi-free-pack">Sub-pack<select id="relphiFreePack">'+packOptions(draft.pack||'full')+'</select></label>'+keywordDraftMarkup(draft)+'<div class="relphi-free-toggles"><label><input id="relphiFreeReversals" type="checkbox" '+(draft.reversals!==false?'checked':'')+'> Reversals</label><label><input id="relphiFreeRepeats" type="checkbox" '+(draft.repeats?'checked':'')+'> Repeats</label></div></div><div class="relphi-board-settings-footer"><button type="button" id="relphiCancelFreeSettings">Cancel</button><button type="button" id="relphiConfirmFreeSettings" class="primary">Confirm</button></div>';
    modeSwitch.insertAdjacentElement('afterend',free);
    renderBoardConfiguration(root);

    free.querySelector('#relphiFreePack')?.addEventListener('change',event=>{
      draft.pack=event.target.value||'full';
      if(draft.pack!=='tags'){draft.keywordTags=[];draft.keywordMatchMode='any';}
      renderFreeSettings(root);
    });
    const query=free.querySelector('#relphiKeywordQuery');
    query?.addEventListener('input',event=>renderKeywordMatches(free,draft,event.target.value,()=>renderFreeSettings(root)));
    free.querySelectorAll('input[name="relphiKeywordMode"]').forEach(input=>input.addEventListener('change',()=>{
      draft.keywordMatchMode=input.value==='all'?'all':'any';
      renderFreeSettings(root);
    }));
    free.querySelectorAll('[data-keyword-remove]').forEach(button=>button.addEventListener('click',()=>{
      draft.keywordTags=(draft.keywordTags||[]).filter(tag=>tag!==button.dataset.keywordRemove);
      renderFreeSettings(root);
    }));
    free.querySelector('#relphiFreeReversals')?.addEventListener('change',event=>{draft.reversals=event.target.checked;});
    free.querySelector('#relphiFreeRepeats')?.addEventListener('change',event=>{draft.repeats=event.target.checked;});
    free.querySelector('#relphiCancelFreeSettings')?.addEventListener('click',()=>cancelBoardSettings(root));
    free.querySelector('#relphiConfirmFreeSettings')?.addEventListener('click',()=>confirmFreeSettings(root));
  }

  function renderBoardSettings(root=panel()) {
    const settingsPanel=ensureBoardChrome(root);
    if(!settingsPanel||!settingsOpen)return;
    setBoardMode(root,settingsMode==='crafted'?'referents':'board');
    if(settingsMode==='crafted'){
      settingsPanel.querySelector('.relphi-free-settings')?.remove();
      if(!optionsSession)beginOptionsSession();
      renderOptions(root);
    }else{
      optionsSession=null;
      renderFreeSettings(root);
    }
    ensureBoardChrome(root);
    renderBoardConfiguration(root);
    syncZoomToolbarVisibility(root);
  }

  function openBoardSettings(root=panel()) {
    if(!root)return;
    if(settingsOpen){cancelBoardSettings(root);return;}
    settingsOpen=true;
    ensureSettingsTransaction(root);
    if(settingsMode==='crafted'&&!optionsSession)beginOptionsSession();
    renderBoardSettings(root);
  }

  function switchSettingsMode(mode,root=panel()) {
    if(!settingsOpen||!root)return;
    settingsMode=mode==='crafted'?'crafted':'free';
    if(settingsMode==='crafted'){
      if(!optionsSession)beginOptionsSession();
    }else{
      optionsSession=null;
      if(!freeSettingsSession)freeSettingsSession={draft:freeSettingsDraftFromState()};
    }
    syncZoomToolbarVisibility(root);
    renderBoardSettings(root);
  }

  function cancelBoardSettings(root=panel()) {
    if(!root)return;
    optionsSession=null;
    freeSettingsSession=null;
    settingsBaseline=null;
    settingsOpen=false;
    boardConfigurationOpen=false;
    root.querySelector('.relphi-reading-options-drawer')?.remove();
    root.querySelector('.relphi-free-settings')?.remove();
    setBoardMode(root,craftedReadingActive||boardHasCraftedStructure(root)?'crafted':'board');
    ensureBoardChrome(root);
    syncZoomToolbarVisibility(root);
  }

  function confirmFreeSettings(root=panel()) {
    if(!root||!freeSettingsSession)return;
    const draft=clone(freeSettingsSession.draft);
    draft.stickers=false;
    if(craftedReadingActive||boardHasCraftedStructure(root)){
      clearCraftedStructure(root);
      craftedReadingActive=false;
      surfaceReadingSession=null;
      recursionSession=null;
      recursionPortalLevel=0;
    }
    applyDrawSettings(draft);
    writeStickerVisibility(false);
    boardSetupConfirmed=true;
    activeCraftedPath='';
    settingsOpen=false;
    boardConfigurationOpen=false;
    settingsMode='free';
    optionsSession=null;
    freeSettingsSession=null;
    settingsBaseline=null;
    root.querySelector('.relphi-free-settings')?.remove();
    setBoardMode(root,'board');
    ensureBoardChrome(root);
    syncZoomToolbarVisibility(root);
    showBoardToast('Free Draw settings confirmed.',{title:'Drawing Board',duration:2600});
    setTimeout(()=>enhance(panel()),0);
  }

  function markSettingsConfirmed() {
    boardSetupConfirmed=true;
    settingsOpen=false;
    settingsBaseline=null;
    freeSettingsSession=null;
  }

  function beginOptionsSession() {
    if (optionsSession) return;
    const draft=draftFromState();
    const crowleyActive=draft.templateId==='crowley-harmonic-divination-12'||draft.basedOnTemplateId==='crowley-harmonic-divination-12';
    const path=crowleyActive?'templates':(activeCraftedPath||'');
    if(crowleyActive)activeCraftedPath='templates';
    if(path==='bespoke' && !draft.templateId) draft.templateName='Unnamed Template';
    // Settings always reopen visually collapsed. Keep the last configured path
    // in state, but never imply that Bespoke (or any other path) was reopened.
    optionsSession = { baseline:currentSnapshot(), draft, path, pathCollapsed:true, building:{element:'',planet:'',aspect:'',sign:'',house:'',need:''}, suggestions:[], suggestionPacks:[], surfaceSelected:{} };
  }
  function optionsStructuralChanged(session = optionsSession) {
    if (!session) return false;
    const base = session.baseline || {};
    const baseLayout = String(base.rowActiveLayout?.id || '');
    const draftLayout = session.draft.templateId || (baseLayout==='custom-active' ? 'custom-active' : '');
    const baseLabels = Array.isArray(base.shortListPositionLabels) ? base.shortListPositionLabels : [];
    const basePacks=baseLabels.map((_,index)=>String(base.rowPositionMeta?.[index]?.drawScope || base.rowActiveLayout?.positions?.[index]?.drawScope || ''));
    const draftPacks=(session.draft.positionPacks||[]).slice(0,session.draft.labels.length).map(value=>String(value||''));
    return draftLayout !== baseLayout || JSON.stringify(session.draft.labels) !== JSON.stringify(baseLabels) || JSON.stringify(draftPacks)!==JSON.stringify(basePacks);
  }

  function interruptedSacredReading(root=panel()) {
    if(!root)return false;
    const path=persistedCraftedPath(root);
    if(!path)return false;
    const snap=currentSnapshot()||{};
    const hasLayout=!!snap.rowActiveLayout?.id || (Array.isArray(snap.rowPositionMeta)&&snap.rowPositionMeta.length>0);
    const hasReferents=Array.isArray(snap.shortListPositionLabels)&&snap.shortListPositionLabels.some(label=>String(label||'').trim());
    return hasLayout || hasReferents;
  }

  function removeSacredResumeGate(root=panel()) {
    root?.querySelector('.relphi-sacred-resume-gate')?.remove();
    root?.classList.remove('relphi-awaiting-sacred-resume');
  }

  function resumeSacredReading(root=panel()) {
    if(!root)return false;
    removeSacredResumeGate(root);
    sacredResumeGateHandled=true;
    craftedReadingActive=true;
    if(!activeCraftedPath)activeCraftedPath=persistedCraftedPath(root);
    setBoardMode(root,'crafted');
    syncZoomToolbarVisibility(root);
    enhance(root);
    requestAnimationFrame(()=>requestAnimationFrame(zoomExtents));
    return true;
  }

  function concludeSacredReading(root=panel()) {
    if(!root)return false;
    removeSacredResumeGate(root);
    if(!resetBoardGlobal(root,{openSettings:false}))return false;
    sacredResumeGateHandled=true;
    const reconcile=()=>{
      const live=panel();
      if(!live)return;
      ensureBoardChrome(live);
      const reset=live.querySelector('#relphiResetBoard');
      if(reset)reset.disabled=!boardCanReset(live);
    };
    requestAnimationFrame(()=>requestAnimationFrame(reconcile));
    showBoardToast('The Sacred Reading has been concluded.',{title:'Reading concluded',duration:4200});
    return true;
  }

  function installSacredResumeGate(root=panel()) {
    if(!root||sacredResumeGateHandled||!interruptedSacredReading(root))return false;
    if(root.querySelector('.relphi-sacred-resume-gate'))return true;
    craftedReadingActive=false;
    settingsOpen=false;
    optionsSession=null;
    root.querySelector('.relphi-reading-options-drawer')?.remove();
    root.querySelector('.relphi-free-settings')?.remove();
    root.classList.add('relphi-awaiting-sacred-resume');
    const gate=document.createElement('aside');
    gate.className='relphi-sacred-resume-gate relphi-panel';
    gate.setAttribute('role','dialog');
    gate.setAttribute('aria-modal','true');
    gate.setAttribute('aria-labelledby','relphiSacredResumeTitle');
    gate.innerHTML='<div class="relphi-sacred-resume-card">'+
      '<span class="relphi-eyebrow">Drawing Board</span>'+
      '<h3 id="relphiSacredResumeTitle">Sacred Reading Mode</h3>'+
      '<p>A Sacred Reading is already in progress.</p>'+
      '<div class="relphi-sacred-resume-actions">'+
        '<button type="button" class="relphi-button relphi-button--primary" data-sacred-reading-resume>Resume Sacred-Reading Mode</button>'+
        '<button type="button" class="relphi-button relphi-button--quiet" data-sacred-reading-conclude>Conclude</button>'+
      '</div>'+
    '</div>';
    root.appendChild(gate);
    gate.querySelector('[data-sacred-reading-resume]')?.addEventListener('click',()=>resumeSacredReading(root));
    gate.querySelector('[data-sacred-reading-conclude]')?.addEventListener('click',()=>concludeSacredReading(root));
    gate.querySelector('[data-sacred-reading-resume]')?.focus?.();
    return true;
  }

  function setBoardOpen(open, { fit = true } = {}) {
    const root = panel();
    const trigger = document.getElementById('relphiOpenDrawingBoardCurrent');
    boardOpen = !!open;
    if (!root || !trigger) return;
    if (boardOpen) {
      const commandDetails = document.querySelector('.tarot-command-drawer > details');
      if (commandDetails) commandDetails.open = true;
      root.hidden = false;
      root.removeAttribute('hidden');
      const drawer = root.querySelector('.card-row-drawing-board');
      if (drawer) drawer.open = true;
      trigger.textContent = 'Close Drawing Board';
      trigger.setAttribute('aria-expanded','true');
      root.classList.add('relphi-board-ready');
      enhance(root);
      installSacredResumeGate(root);
      requestAnimationFrame(() => root.scrollIntoView({ behavior:'smooth', block:'start' }));
      if (fit) { requestAnimationFrame(()=>requestAnimationFrame(zoomExtents)); setTimeout(zoomExtents, 180); }
    } else {
      closeFocus({ acknowledge:true, advanceSurface:false });
      optionsSession = null;
      freeSettingsSession = null;
      settingsBaseline = null;
      settingsOpen = false;
      if(interruptedSacredReading(root))sacredResumeGateHandled=false;
      removeSacredResumeGate(root);
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
    const recursionLogo=board.querySelector(':scope > .relphi-recursion-logo-underlay');
    if (recursionLogo) {
      const rect=recursionLogo.getBoundingClientRect();
      if (rect.width>0 && rect.height>0) rects.push(rect);
    }
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
    const toolbarH = visibleToolbarHeight(root);
    const availableW = Math.max(1, workspace.clientWidth - START_EDGE_GUTTER*2);
    const availableH = Math.max(1, workspace.clientHeight - toolbarH - START_EDGE_GUTTER*2);
    const contentW = Math.max(1,bounds.maxX-bounds.minX);
    const contentH = Math.max(1,bounds.maxY-bounds.minY);
    const limits=zoomLimits();
    const zoom = clamp(Math.min(availableW/contentW,availableH/contentH),limits.min,limits.max);
    snapshot.rowZoom = zoom;
    // Fit from the sacred board's upper-left corner instead of centering the spread
    // inside the remaining canvas. The tiny reveal is intentional: enough board to
    // register as a surface, without wasting the first view on empty gutter.
    snapshot.rowPanX = Math.round(START_EDGE_GUTTER-bounds.minX*zoom);
    snapshot.rowPanY = Math.round(START_EDGE_GUTTER-bounds.minY*zoom);
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
    // Snaps, background, and independent transforms now live in Settings.
    // Keep the zoom bar devoted to zoom itself.
    toolbar.appendChild(zoomRow);
    syncTransformEditingAvailability(root);
    nativeOptions.hidden = true;
    nativeOptions.setAttribute('aria-hidden','true');
    renderBoardConfiguration(root);
    syncZoomToolbarVisibility(root);
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
      <div class="relphi-reading-text-actions">
        <button type="button" class="relphi-copy-reading" ${entries.length ? '' : 'disabled'}>Copy</button>
      </div>
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
    const workspace=root.querySelector('.card-row-workspace');
    const readingText=root.querySelector('#drawing-board-reading-text');
    const commandbar=root.querySelector('.relphi-board-commandbar');
    const actions=readingText?.querySelector('.relphi-reading-text-actions') || commandbar?.querySelector('.relphi-reading-text-actions');
    if(!workspace||!readingText||!commandbar||!actions)return;

    // Keep document actions in the unused upper-right command-bar space rather
    // than spending vertical room beside Reading Text below the felt.
    if(actions.parentElement!==commandbar)commandbar.appendChild(actions);

    // Native export controls own their behavior in tarot-app.js. Preserve those
    // exact bound nodes while moving the useful actions into the command bar.
    const nativeExportIds=['snapshotCardRowArrangement','downloadRowHtml','downloadRowTextHtml','downloadRowJson','printCardRowImage'];
    const preservedExports=new Map(nativeExportIds.map(id=>[id,root.querySelector('#'+id)]).filter(([,node])=>!!node));
    preservedExports.forEach(node=>node.remove());

    root.querySelector('#drawing-board-post-export')?.remove();

    const take=(id,label,title)=>{
      const node=preservedExports.get(id)||root.querySelector('#'+id);
      if(!node)return null;
      node.hidden=false;
      node.removeAttribute('aria-hidden');
      node.textContent=label;
      node.title=title;
      node.setAttribute('aria-label',title);
      node.classList.add('relphi-board-export-button');
      actions.appendChild(node);
      return node;
    };
    take('snapshotCardRowArrangement','Snapshot','Snapshot the current board arrangement at zoom extents');
    take('downloadRowHtml','Download HTML','Download the reading as HTML with card art and text');

    const journal=document.createElement('button');
    journal.type='button';
    journal.className='relphi-board-export-button relphi-board-journal-button';
    journal.disabled=true;
    journal.title='Save to Journal — coming soon';
    journal.setAttribute('aria-label','Save to Journal — coming soon');
    journal.innerHTML='<span>Save to Journal</span><small>Coming soon</small>';
    actions.appendChild(journal);

    // Reading Text already owns the single text-copy action. These legacy
    // exports stay hidden so the header has one clear Copy button.
    ['downloadRowTextHtml','downloadRowJson','printCardRowImage'].forEach(id=>{
      const node=preservedExports.get(id)||root.querySelector('#'+id);
      if(node){node.hidden=true;node.setAttribute('aria-hidden','true');}
    });
  }

  function templateCountLabel(item) {
    return item?.id===RECURSION_ID ? '22 cards' : String(item?.cardCount || 0);
  }
  function optionTemplateMarkup(draft) {
    const entries = allTemplates();
    const selectedId=entries.some(item=>item.id===draft.templateId) ? draft.templateId : (entries[0]?.id||'');
    return entries.map(item => `<option value="${escapeHtml(item.id)}" ${selectedId===item.id?'selected':''}>${escapeHtml(templateCountLabel(item))} · ${escapeHtml(item.name)}</option>`).join('');
  }
  function packItems(){
    const built=[
      ['full','Full Pack'],['shown','Shown cards'],['uhn','Universal Human Needs'],['majors','Majors'],
      ['primordial-majors','Primordial Element Majors'],['planetary-majors','Planetary Majors'],['zodiac-majors','Zodiac Majors'],['aces','Aces'],['courts','Courts'],
      ['pips','Pips'],['decans','Decan pips'],['wands','Wands'],['cups','Cups'],['swords','Swords'],['pentacles','Pentacles / Disks'],['tags','Keywords / Tags']
    ];
    const custom=(window.RelphiCustomSubpacks?.all?.()||[]).map(pack=>['custom:'+pack.id,pack.name]);
    return [...built,...custom];
  }
  function packLabel(value){ return packItems().find(([id])=>id===value)?.[1] || value || 'Full Pack'; }
  function packOptions(value, {questionByQuestion=false} = {}) {
    const items=packItems();
    const prefix=questionByQuestion ? `<option value="question-by-question" ${value==='question-by-question'?'selected':''}>Question by question</option>` : '';
    return prefix+items.map(([id,label])=>`<option value="${escapeHtml(id)}" ${value===id?'selected':''}>${escapeHtml(label)}</option>`).join('');
  }
  function keywordDraftMarkup(draft) {
    if (draft.pack!=='tags') return '';
    const tags=Array.isArray(draft.keywordTags)?draft.keywordTags:[];
    const selected=tags.length ? '<div class="relphi-keyword-selected">'+tags.map(tag=>'<button type="button" data-keyword-remove="'+escapeHtml(tag)+'">'+escapeHtml(tag)+' ×</button>').join('')+'</div>' : '';
    const count=window.RELPHI_KEYWORD_SUBPACK_CONTEXT?.count?.(tags,draft.keywordMatchMode)||0;
    return '<div class="relphi-keyword-builder" aria-label="Keywords and Tags sub-pack"><label>Find tags<input id="relphiKeywordQuery" type="search" placeholder="Type a tag, e.g. prince" autocomplete="off"></label><div class="relphi-keyword-match-mode"><label><input type="radio" name="relphiKeywordMode" value="any" '+(draft.keywordMatchMode!=='all'?'checked':'')+'> Any</label><label><input type="radio" name="relphiKeywordMode" value="all" '+(draft.keywordMatchMode==='all'?'checked':'')+'> All</label></div><div id="relphiKeywordMatches" class="relphi-keyword-matches"><p>Type to find matching canonical tags.</p></div>'+selected+'<p id="relphiKeywordCount">'+(tags.length?count+' card'+(count===1?'':'s')+' in this sub-pack':'Choose one or more tags.')+'</p></div>';
  }
  function renderKeywordMatches(drawer,draft,query,rerender=null) {
    const host=drawer.querySelector('#relphiKeywordMatches'); if(!host) return;
    const matches=window.RELPHI_KEYWORD_SUBPACK_CONTEXT?.matches?.(query)||[];
    host.innerHTML=matches.length ? matches.map(tag=>'<label><input type="checkbox" data-keyword-choice value="'+escapeHtml(tag)+'" '+((draft.keywordTags||[]).includes(tag)?'checked':'')+'> '+escapeHtml(tag)+'</label>').join('') : '<p>'+(query?'No matching tags.':'Type to find matching canonical tags.')+'</p>';
    host.querySelectorAll('[data-keyword-choice]').forEach(input=>input.addEventListener('change',()=>{
      const set=new Set(draft.keywordTags||[]); input.checked?set.add(input.value):set.delete(input.value); draft.keywordTags=[...set];
      if(typeof rerender==='function')rerender();
      else renderOptions(drawer.closest('#shortListPanel')||panel());
    }));
  }

  function cardCountOptions(value) {
    const selected=Math.max(1,Math.min(12,Number(value)||1));
    return Array.from({length:12},(_,index)=>{
      const count=index+1;
      return '<option value="'+count+'" '+(count===selected?'selected':'')+'>'+count+' card'+(count===1?'':'s')+'</option>';
    }).join('');
  }
  function normalizedBespokeQuestionSettings(draft,index) {
    const prior=draft?.positionSettings?.[index] || {};
    const fallback=draft?.positionSettings?.[index-1] || {};
    return {
      pack:prior.pack || draft?.positionPacks?.[index] || fallback.pack || draft?.pack || 'full',
      cardCount:Math.max(1,Math.min(12,Number(prior.cardCount ?? fallback.cardCount)||1)),
      linkTo:String(prior.linkTo ?? ''),
      reversals:prior.reversals ?? fallback.reversals ?? (draft?.reversals!==false),
      repeats:prior.repeats ?? fallback.repeats ?? !!draft?.repeats
    };
  }
  function bespokeQuestionsClipboardText(draft) {
    const labels=Array.isArray(draft?.labels)?draft.labels:[];
    return labels.map((label,index)=>{
      const settings=normalizedBespokeQuestionSettings(draft,index);
      const linkIndex=settings.linkTo===''?null:Number(settings.linkTo);
      const linkLabel=Number.isInteger(linkIndex)&&linkIndex>=0&&linkIndex<labels.length ? 'Question '+(linkIndex+1) : 'No link';
      return [
        (index+1)+'. '+String(label||'').trim(),
        '   Sub-pack: '+packLabel(settings.pack),
        '   Cards: '+settings.cardCount,
        '   Share card with: '+linkLabel,
        '   Reversals: '+(settings.reversals?'On':'Off'),
        '   Repeats: '+(settings.repeats?'On':'Off')
      ].join('\n');
    }).join('\n\n');
  }

  function labelsMarkup(labels,draft=null) {
    const rows=labels.length ? labels : [''];
    return rows.map((label,index)=>{
      const inherited=draft?.positionSettings?.[index] || draft?.positionSettings?.[index-1] || {pack:draft?.pack||'full',reversals:draft?.reversals!==false,repeats:!!draft?.repeats,cardCount:1,linkTo:''};
      if(draft && !draft.positionSettings?.[index]){
        draft.positionSettings ||= [];
        draft.positionSettings[index]={
          pack:inherited.pack||'full',
          reversals:inherited.reversals!==false,
          repeats:!!inherited.repeats,
          cardCount:Math.max(1,Math.min(12,Number(inherited.cardCount)||1)),
          linkTo:String(inherited.linkTo??'')
        };
        draft.positionPacks ||= [];
        draft.positionPacks[index]=draft.positionSettings[index].pack;
      }
      return `<div class="relphi-label-row relphi-bespoke-question-row" data-label-row="${index}"><label class="relphi-question-select"><input type="checkbox" data-question-select="${index}" aria-label="Select question ${index+1} for editing"><span>${index+1}</span></label><div class="relphi-bespoke-question-main"><input type="text" value="${escapeHtml(label)}" ${index===0&&!label?'placeholder="Commas split questions"':''} aria-label="Question ${index+1}" data-position-label="${index}"></div></div>`;
    }).join('');
  }
  function parseBulkQuestions(value) {
    return String(value || '').split(',').map(item=>item.trim()).filter(Boolean).slice(0,MAX_POSITIONS);
  }
  function markQuestionEditCustom(drawer,draft) {
    if (draft.templateId) draft.basedOnTemplateId=draft.templateId;
    draft.templateId='';
    draft.templateName='Unnamed Template';
    const templateSelect=drawer.querySelector('#relphiSpreadTemplateSelect');
    if (templateSelect) templateSelect.value='';
    const nameField=drawer.querySelector('#relphiTemplateName');
    if (nameField) nameField.value='Unnamed Template';
  }

  const REFERENT_ELEMENTS = {
    Fire:'action desire courage momentum and initiative',
    Water:'feeling attachment care memory and belonging',
    Air:'thought language interpretation choice and exchange',
    Earth:'body work money resources and practical reality'
  };
  const REFERENT_PLANETS = Object.fromEntries(
    Object.entries(window.RELPHI_SYMBOLIC_REFERENCE?.planets || {}).map(([name,record])=>[
      name,
      [record.principle,...(record.operations||[])].join(' ').toLowerCase()
    ])
  );
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
  const REFERENT_UNIVERSAL_HUMAN_NEEDS = ['Identity','Understanding','Affection','Subsistence','Protection','Participation','Freedom','Creation','Leisure'];
  const REFERENT_NEED_QUESTIONS = Object.freeze({
    Identity:[
      {text:'Is this more about who you know yourself to be or about how you are being recognized?',pack:'courts'},
      {text:'What area of life is asking loudest for a clearer sense of identity?',pack:'zodiac-majors'},
      {text:'What is the concrete form this identity question is taking?',pack:'pips'}
    ],
    Understanding:[
      {text:'Is this more about what you understand or about you being understood?',pack:'courts'},
      {text:'What area of life is asking loudest for understanding?',pack:'zodiac-majors'},
      {text:'What is the nature of the subject requiring understanding?',pack:'pips'}
    ],
    Affection:[
      {text:'Is this more about giving affection or about receiving it?',pack:'courts'},
      {text:'What area of life is asking loudest for affection?',pack:'zodiac-majors'},
      {text:'What is the nature of the bond or desire requiring affection?',pack:'pips'}
    ],
    Subsistence:[
      {text:'Is this more about what you need to sustain yourself or about what you are sustaining for others?',pack:'courts'},
      {text:'What area of life is asking loudest for material or bodily support?',pack:'zodiac-majors'},
      {text:'What is the concrete need requiring subsistence?',pack:'pips'}
    ],
    Protection:[
      {text:'Is this more about protecting yourself or about protecting someone or something else?',pack:'courts'},
      {text:'What area of life is asking loudest for protection?',pack:'zodiac-majors'},
      {text:'What is the nature of the threat or vulnerability requiring protection?',pack:'pips'}
    ],
    Participation:[
      {text:'Is this more about entering into participation or about being invited or received into it?',pack:'courts'},
      {text:'What area of life is asking loudest for participation?',pack:'zodiac-majors'},
      {text:'What is the concrete form of participation being asked of you?',pack:'pips'}
    ],
    Freedom:[
      {text:'Is this more about freeing yourself or about allowing someone or something else more freedom?',pack:'courts'},
      {text:'What area of life is asking loudest for freedom?',pack:'zodiac-majors'},
      {text:'What is the nature of the constraint requiring freedom?',pack:'pips'}
    ],
    Creation:[
      {text:'Is this more about what you are creating or about what wants to be created through you?',pack:'courts'},
      {text:'What area of life is asking loudest for creation?',pack:'zodiac-majors'},
      {text:'What is the nature of the thing asking to be created?',pack:'pips'}
    ],
    Leisure:[
      {text:'Is this more about making room for rest or about allowing yourself to enjoy what is already available?',pack:'courts'},
      {text:'What area of life is asking loudest for leisure?',pack:'zodiac-majors'},
      {text:'What concrete form of rest play or spaciousness is being asked for?',pack:'pips'}
    ]
  });
  const MODE_BY_PIP = {2:'Cardinal',3:'Cardinal',4:'Cardinal',5:'Fixed',6:'Fixed',7:'Fixed',8:'Mutable',9:'Mutable',10:'Mutable'};

  function referentPathButton(id,label,description,path,disabled=false,expanded=false) {
    const active=path===id;
    return '<button type="button" aria-pressed="'+(active?'true':'false')+'" aria-expanded="'+(expanded?'true':'false')+'" aria-controls="relphiReferentPanel-'+id+'" class="relphi-referent-path'+(active?' is-active':'')+'" data-referent-path="'+id+'" '+(disabled&&!active?'disabled':'')+'><strong>'+escapeHtml(label)+'</strong><span>'+escapeHtml(description)+'</span></button>';
  }
  function candidateQuestionsFromBlocks(blocks={}) {
    const element=String(blocks.element||'');
    const planet=String(blocks.planet||'');
    const aspect=String(blocks.aspect||'');
    const sign=String(blocks.sign||'');
    const house=Number(blocks.house)||0;
    const mode=String(blocks.mode||'');
    const need=String(blocks.need||'');
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
      need ? 'the universal human need for '+need : '',
      mode ? mode.toLowerCase()+' movement' : ''
    ].filter(Boolean);
    const compact = subject.length ? subject.join(' through ') : 'this matter';
    const needOnly=!!need && !element && !planet && !aspect && !sign && !house && !mode;
    if(needOnly && REFERENT_NEED_QUESTIONS[need]) return REFERENT_NEED_QUESTIONS[need].map(item=>item.text);
    const q1 = planet
      ? 'What is '+planet+' asking me to understand about '+(housePhrase ? housePhrase : (elementPhrase || signPhrase || (need ? 'the need for '+need : 'this matter')))+'?'
      : need
        ? 'What does the universal human need for '+need+' ask me to understand here?'
        : 'What deserves my attention about '+compact+'?';
    const q2 = aspect
      ? 'How should I work with '+aspectPhrase+' in '+(housePhrase || elementPhrase || signPhrase || 'this situation')+'?'
      : 'What is changing or becoming possible through '+compact+'?';
    const q3 = mode
      ? 'What does '+mode.toLowerCase()+' movement ask me to do differently in '+(housePhrase || elementPhrase || 'this situation')+'?'
      : sign
        ? 'How is '+sign+' shaping the way this situation is being expressed?'
        : need
          ? 'What would better serve the need for '+need+' in this situation?'
          : 'What practical next question would clarify '+compact+'?';
    return Array.from(new Set([q1,q2,q3].map(q=>q.replace(/\s+/g,' ').trim()))).slice(0,3);
  }
  function suggestionMarkup(session, disabled=false) {
    const suggestions=Array.isArray(session.suggestions)?session.suggestions:[];
    if (!suggestions.length) return '<p class="relphi-referent-empty">Choose or draw building blocks to surface candidate referents.</p>';
    return '<div class="relphi-suggestions-review"><div class="relphi-options-subhead"><strong>Review the referents</strong><span>Each generated question includes its assigned sub-pack. Use Bespoke to author a different question and experiment.</span></div>'+
      suggestions.map((value,index)=>'<label class="relphi-suggestion-row"><input type="checkbox" data-suggestion-use="'+index+'" checked '+(disabled?'disabled':'')+'><span>'+(index+1)+'</span><span class="relphi-suggestion-copy"><strong>'+escapeHtml(value)+'</strong><small>'+escapeHtml(packLabel(session.suggestionPacks?.[index]||'full'))+'</small></span></label>').join('')+
      '<button type="button" id="relphiAcceptSuggestions" '+(disabled?'disabled':'')+'>Use selected referents</button></div>';
  }
  function buildingControlsMarkup(session, disabled=false) {
    const b=session.building || (session.building={element:'',planet:'',aspect:'',sign:'',house:'',need:''});
    const option=(value,current)=>'<option value="'+escapeHtml(value)+'" '+(current===value?'selected':'')+'>'+escapeHtml(value||'Choose…')+'</option>';
    const options=(values,current)=>option('',current)+values.map(value=>option(value,current)).join('');
    return '<div class="relphi-building-grid">'+
      '<label>Element<select data-building-key="element" '+(disabled?'disabled':'')+'>'+options(Object.keys(REFERENT_ELEMENTS),b.element)+'</select></label>'+
      '<label>Planet<select data-building-key="planet" '+(disabled?'disabled':'')+'>'+options(Object.keys(REFERENT_PLANETS),b.planet)+'</select></label>'+
      '<label>Aspect<select data-building-key="aspect" '+(disabled?'disabled':'')+'>'+options(Object.keys(REFERENT_ASPECTS),b.aspect)+'</select></label>'+
      '<label>Sign<select data-building-key="sign" '+(disabled?'disabled':'')+'>'+options(Object.keys(REFERENT_SIGNS),b.sign)+'</select></label>'+
      '<label>House<select data-building-key="house" '+(disabled?'disabled':'')+'>'+option('',String(b.house||''))+HOUSE_ORDINALS.map((name,index)=>'<option value="'+(index+1)+'" '+(String(b.house)===String(index+1)?'selected':'')+'>'+name+' House</option>').join('')+'</select></label>'+
      '<label>Universal Human Need<select data-building-key="need" '+(disabled?'disabled':'')+'>'+options(REFERENT_UNIVERSAL_HUMAN_NEEDS,b.need)+'</select></label>'+
      '</div><button type="button" id="relphiBuildQuestions" '+(disabled?'disabled':'')+'>Surface referents</button>';
  }
  const PIP_NUMBER_BY_RANK = {Two:2,Three:3,Four:4,Five:5,Six:6,Seven:7,Eight:8,Nine:9,Ten:10};
  const SURFACE_DRAW_KEYS = ['primordial','ace','planet','sign','need','court','pip'];
  const SURFACE_QUESTIONS = Object.freeze({
    primordial:'Which primordial force?',
    ace:'What is taking root?',
    planet:'What is at work?',
    sign:'How is it showing up?',
    need:'What is needed?',
    court:'How is it being carried?',
    pip:'What form is it taking?'
  });
  const SURFACE_PACK_LABELS = Object.freeze({
    primordial:'Mother-letter Majors',
    ace:'Aces',
    planet:'Planetary Majors',
    sign:'Zodiac Majors',
    need:'Universal Human Needs',
    court:'Courts',
    pip:'Pips'
  });
  const SURFACE_PACK_BY_KIND = Object.freeze({
    primordial:'primordial-majors',
    ace:'aces',
    planet:'planetary-majors',
    sign:'zodiac-majors',
    need:'uhn',
    court:'courts',
    pip:'pips'
  });
  const SURFACE_INITIAL_PACKS = Object.freeze(SURFACE_DRAW_KEYS.map(kind=>SURFACE_PACK_BY_KIND[kind]).filter(Boolean));
  if (new Set(SURFACE_INITIAL_PACKS).size !== SURFACE_DRAW_KEYS.length) {
    console.warn('See What Surfaces initial probes must map one-to-one to dedicated sub-packs.');
  }
  function surfacePlanet(card) {
    return String(card?.astrology?.planet || '').split('/')[0].trim();
  }
  function surfacePipNumber(card) {
    const numeric=Number(card?.number);
    return numeric || PIP_NUMBER_BY_RANK[String(card?.rank || '')] || 0;
  }
  function surfacePrimordialElement(card) {
    return String(card?.astrology?.zodiac_range || card?.astrology?.element || '').trim();
  }
  function surfaceNeed(card) {
    return String(card?.relphi?.universal_human_needs?.need || '').trim();
  }
  function isPrincessPage(card) {
    return card?.card_type==='Court' && (String(card?.rank||'').toLowerCase()==='princess' || String(card?.rws_rank||'').toLowerCase()==='page');
  }
  function surfaceCourtFormula(card) {
    return String(card?.elemental_formula || [card?.rank_element,card?.element].filter(Boolean).join(' of ') || '').trim();
  }
  function selectedSurfaceKinds(session) {
    const selected=session?.surfaceSelected || {};
    return SURFACE_DRAW_KEYS.filter(kind=>!!selected[kind]);
  }
  function surfaceChoicesMarkup(session, disabled=false) {
    const selected=session.surfaceSelected || (session.surfaceSelected={});
    const selectedCount=SURFACE_DRAW_KEYS.filter(kind=>!!selected[kind]).length;
    const allSelected=selectedCount===SURFACE_DRAW_KEYS.length;
    return '<div class="relphi-surface-question-choices" role="group" aria-label="Question types">'+
      '<label class="relphi-surface-select-all"><input type="checkbox" data-surface-select-all '+(allSelected?'checked ':'')+(disabled?'disabled':'')+'><span><strong>Select all '+SURFACE_DRAW_KEYS.length+'</strong><small>One probe from every See What Surfaces sub-pack</small></span></label>'+
      SURFACE_DRAW_KEYS.map(kind=>'<label class="relphi-surface-question-choice"><input type="checkbox" data-surface-choice="'+kind+'" '+(selected[kind]?'checked ':'')+(disabled?'disabled':'')+'><span><strong>'+escapeHtml(SURFACE_QUESTIONS[kind])+'</strong><small>'+escapeHtml(SURFACE_PACK_LABELS[kind])+'</small></span></label>').join('')+
      '</div><p class="relphi-surface-choice-note">Choose each kind of question you agree to ask. The initial set has one dedicated probe for each of the '+SURFACE_DRAW_KEYS.length+' See What Surfaces sub-packs.</p>';
  }
  function prepareSurfaceDraft(session) {
    const kinds=selectedSurfaceKinds(session);
    if (!kinds.length) return false;
    if(!['digital','physical'].includes(session?.sacredCardSource))session.sacredCardSource='digital';
    const draft=session.draft;
    draft.labels=kinds.map(kind=>SURFACE_QUESTIONS[kind]);
    draft.positionPacks=kinds.map(kind=>SURFACE_PACK_BY_KIND[kind]||'');
    draft.templateId='';
    draft.basedOnTemplateId='';
    draft.templateName='See What Surfaces';
    return true;
  }
  function suggestionsFromSurface(session) {
    const draws=session.surfaceDraws || {};
    const result=[];
    // The first See What Surfaces cards are probes drawn from deliberately
    // narrow packs. Once a probe surfaces a referent, its derived question is a
    // new experiment and must not inherit that probe's pack. Re-open the answer
    // space to the Full Pack unless a future derivation explicitly supplies a
    // principled answer scope of its own.
    const push=(kind,text,pack='full')=>{
      const clean=String(text||'').replace(/\s+/g,' ').trim();
      if(clean) result.push({text:clean,pack,sourceKind:kind,derivedFromPack:SURFACE_PACK_BY_KIND[kind]||''});
    };
    const primordial=surfacePrimordialElement(draws.primordial);
    if (primordial) push('primordial','What does the primordial '+primordial+' principle reveal about this matter?');
    if (draws.ace?.element) push('ace','What is taking root materially through '+draws.ace.element+'?');
    const planet=surfacePlanet(draws.planet);
    if (planet) push('planet','What is '+planet+' asking me to understand about this matter?');
    const sign=String(draws.sign?.astrology?.sign||'').trim();
    if (sign) push('sign','How is '+sign+' shaping the way this situation is being expressed?');
    const need=surfaceNeed(draws.need);
    if (need) push('need','What does the unmet need for '+need+' ask me to recognize?');
    if (draws.court) {
      const formula=surfaceCourtFormula(draws.court);
      push('court',isPrincessPage(draws.court)
        ? 'What is ready to become tangible through '+formula+'?'
        : 'How is '+formula+' carrying this situation?');
    }
    if (draws.pip) {
      const number=surfacePipNumber(draws.pip);
      const form=[draws.pip.element,HOUSE_ORDINALS[number-1] ? HOUSE_ORDINALS[number-1]+' House' : '',MODE_BY_PIP[number]||''].filter(Boolean).join(' · ');
      push('pip','What form is this taking through '+form+'?');
    }
    return result.slice(0,MAX_POSITIONS);
  }
  const ASTRO_SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ASTRO_MODES=['Cardinal','Fixed','Mutable'];
  const ASTRO_ELEMENTS=['Fire','Earth','Air','Water'];
  const ASTRO_DECAN_CARDS=[
    ['two_of_wands','three_of_wands','four_of_wands'],['five_of_pentacles','six_of_pentacles','seven_of_pentacles'],['eight_of_swords','nine_of_swords','ten_of_swords'],
    ['two_of_cups','three_of_cups','four_of_cups'],['five_of_wands','six_of_wands','seven_of_wands'],['eight_of_pentacles','nine_of_pentacles','ten_of_pentacles'],
    ['two_of_swords','three_of_swords','four_of_swords'],['five_of_cups','six_of_cups','seven_of_cups'],['eight_of_wands','nine_of_wands','ten_of_wands'],
    ['two_of_pentacles','three_of_pentacles','four_of_pentacles'],['five_of_swords','six_of_swords','seven_of_swords'],['eight_of_cups','nine_of_cups','ten_of_cups']
  ];
  function astrologyPayloadRecords(payload) {
    const source=payload?.placements||payload?.positions||payload?.points||payload?.bodies||{};
    return Object.entries(source).map(([key,item])=>{
      if(!item||typeof item!=='object')return null;
      let lon=Number(item.longitude),signIndex=ASTRO_SIGNS.findIndex(s=>s.toLowerCase()===String(item.sign||item.zodiac||'').toLowerCase());
      if(!Number.isFinite(lon)&&signIndex>=0)lon=signIndex*30+Number(item.degree||item.degrees||0)+Number(item.minute||item.minutes||0)/60;
      if(!Number.isFinite(lon))return null;lon=((lon%360)+360)%360;if(signIndex<0)signIndex=Math.floor(lon/30);
      const degree=Number.isFinite(Number(item.degree??item.degrees))?Number(item.degree??item.degrees):lon%30;
      const body=String(item.name||item.label||item.body||item.planet||key),retrograde=Boolean(item.retrograde||item.isRetrograde||String(item.motion||'').toLowerCase()==='retrograde');
      return {key,body,lon,signIndex,sign:ASTRO_SIGNS[signIndex],degree,decan:Math.min(2,Math.floor(degree/10)),mode:ASTRO_MODES[signIndex%3],element:ASTRO_ELEMENTS[signIndex%4],retrograde};
    }).filter(Boolean);
  }
  function astrologySkyEvidence(payload,skyName) {
    const records=astrologyPayloadRecords(payload),out=[],add=(kind,id,value,count=1,detail='',extra={})=>out.push({kind,id:skyName+':'+id,value,count,detail,sky:skyName,...extra});
    records.forEach(r=>{
      add('placement','placement:'+r.key,r.body+' in '+r.sign,1,r.sign+' '+r.degree.toFixed(1)+'°');
      const condition=window.RELPHI_SYMBOLIC_REFERENCE?.traditionalCondition?.(r.body,r.sign);
      if(condition&&(condition.statuses.length||window.RELPHI_SYMBOLIC_REFERENCE?.traditionalProfile?.(r.body))){
        add('planet-relationship','relationship:'+r.key,r.body+' in '+r.sign,1,[condition.host,condition.mode,condition.element,condition.statuses.join(' + ')||'guest'].filter(Boolean).join(' · '),{planet:r.body,sign:r.sign,condition,retrograde:r.retrograde});
      }
    });
    const by=(field)=>{const m=new Map();records.forEach(r=>m.set(r[field],(m.get(r[field])||0)+1));return m};
    [['sign',by('sign')],['mode',by('mode')],['element',by('element')],['decan',by('decan')]].forEach(([kind,map])=>[...map].filter(([,n])=>n>=3).forEach(([v,n])=>add('sky-'+kind,kind+':'+v,kind==='decan'?'Decan '+(Number(v)+1):String(v),n)));
    const p=payload?.placements||payload?.positions||payload?.points||payload?.bodies||{};
    Object.entries(p).forEach(([key,item])=>{if(!item||typeof item!=='object')return;const house=Number(item.house??item.houseNumber);if(Number.isFinite(house))add('house','house:'+house,'House '+house,1,String(item.name||item.label||key))});
    const aspects=Array.isArray(payload?.aspects)?payload.aspects:[],configs=Array.isArray(payload?.configurations)?payload.configurations:[];
    aspects.forEach((x,i)=>add('aspect','aspect:'+i,String(x.label||x.name||x.type||'Aspect'),1,String(x.participants||x.bodies||'')));
    configs.forEach((x,i)=>add('configuration','configuration:'+i,String(x.label||x.name||x.type||'Configuration'),Number(x.count)||1,String(x.participants||x.bodies||'')));
    return out;
  }
  function astrologyCardHits(payload) {
    if(window.RelphiSkyCardHits?.analyzePayload)return window.RelphiSkyCardHits.analyzePayload(payload);
    const cards=Array.isArray(window.RELPHI_TAROT_CARDS)?window.RELPHI_TAROT_CARDS:[],map=new Map(),add=(card,reason)=>{
      if(!card)return;const id=card.card_id||card.stable_symbol_id;if(!id)return;const hit=map.get(id)||{id,name:card.name||card.systems?.golden_dawn_rws?.display_name||id,arcana:card.arcana||'',count:0,reasons:[]};hit.count++;hit.reasons.push(reason);map.set(id,hit);
    };
    const split=v=>String(v||'').split(',').map(x=>x.trim()),majorFor=(field,value)=>cards.find(card=>card.arcana==='Major'&&split(card.astrology?.[field]).includes(value));
    astrologyPayloadRecords(payload).forEach(r=>{add(majorFor('sign',r.sign),r.body+' in '+r.sign);add(cards.find(card=>(card.card_id||card.stable_symbol_id)===ASTRO_DECAN_CARDS[r.signIndex]?.[r.decan]),r.body+' in '+r.sign+' decan '+(r.decan+1));});
    return [...map.values()].sort((a,b)=>b.count-a.count);
  }
  function astrologyPatterns(payload) {
    const records=astrologyPayloadRecords(payload),patterns=[],countBy=key=>records.reduce((m,r)=>(m[r[key]]=(m[r[key]]||0)+1,m),{});
    [['sign','sign'],['mode','mode'],['element','element'],['decan','decan']].forEach(([key,type])=>Object.entries(countBy(key)).filter(([,n])=>n>=3).forEach(([value,n])=>patterns.push({type,value:type==='decan'?'Decan '+(Number(value)+1):value,count:n,score:n+(type==='sign'?2:type==='mode'?1:0)})));
    const sorted=records.slice().sort((a,b)=>a.lon-b.lon);for(let i=0;i<sorted.length;i++){const cluster=[sorted[i]];for(let j=i+1;j<sorted.length;j++){const d=Math.min(Math.abs(sorted[j].lon-sorted[i].lon),360-Math.abs(sorted[j].lon-sorted[i].lon));if(d<=10)cluster.push(sorted[j])}if(cluster.length>=3)patterns.push({type:'cluster',value:cluster.map(r=>r.body).join(' · '),count:cluster.length,score:cluster.length+2})}
    const cfg=payload?.configurations||payload?.aspectConfigurations||payload?.patterns?.configurations||[];(Array.isArray(cfg)?cfg:[]).forEach(x=>patterns.push({type:'configuration',value:String(x.name||x.type||x.label||'Configuration'),count:Number(x.members?.length||x.points?.length||3),score:7}));
    return patterns.sort((a,b)=>b.score-a.score||b.count-a.count).filter((p,i,a)=>a.findIndex(q=>q.type===p.type&&q.value===p.value)===i);
  }
  function astrologyEvidenceKey(item){return item.kind+':'+String(item.id||item.value||'').toLowerCase()}
  function astrologySuggestedPack(source,evidence) {
    if(source==='ruler' || source==='planet-relationship') return 'planetary-majors';
    if(source==='polarity-derived-sign') return 'zodiac-majors';
    if(source==='card-hit') return 'full';
    if(source==='pattern' && evidence?.raw?.type==='sign') return 'zodiac-majors';
    if(source==='pattern' && evidence?.raw?.type==='decan') return 'decans';
    if(source==='cluster' || source==='configuration') return 'full';
    return 'full';
  }
  function astrologyQuestionSuggestions(analysis,enabledKeys) {
    const enabled=item=>!enabledKeys||enabledKeys.has(astrologyEvidenceKey(item)),out=[];
    const push=(text,score,source,evidence)=>{if(text&&!out.some(q=>q.text===text)){const pack=astrologySuggestedPack(source,evidence);out.push({text,score,source,evidence,pack,packReason:source});}};
    // Evidence is not automatically a question. Only promote evidence whose meaning,
    // consequence, synthesis, or activation remains unresolved by the sky itself.
    analysis.evidence.filter(enabled).forEach(e=>{
      if(e.kind==='pattern'){
        const p=e.raw;
        if(p.type==='sign') push('What is the '+p.value+' concentration emphasizing?',90+p.score,'pattern',e);
        else if(p.type==='cluster') push('What is the '+p.value+' cluster concentrating into one issue?',92+p.score,'cluster',e);
        else if(p.type==='configuration') push('What is the '+p.value+' configuration organizing in this reading?',96+p.score,'configuration',e);
        else if(p.type==='mode') push('The '+p.value.toLowerCase()+' emphasis is established. What does it ask of this reading now?',84+p.score,'pattern',e);
        else if(p.type==='element') push('The concentration of '+p.value.toLowerCase()+' is established. What does it ask of this reading now?',82+p.score,'pattern',e);
        else if(p.type==='decan') push(p.value+' is repeating across this sky. What does that repetition ask of this reading now?',80+p.score,'pattern',e);
      } else if(e.kind==='hit') {
        push('What is '+e.value+' activating in this sky?',70+Math.min(20,e.count*3),'card-hit',e);
      } else if(e.kind==='polarity') {
        const pd=analysis.polarityDiagnostic;
        if(pd) push('What is the pull toward '+pd.sign+' revealing in this reading?',88+(pd.observed?8:0),'polarity-derived-sign',{...e,derivedSign:pd.sign,bin:pd.index+1,share:pd.share,excess:pd.excess,independentlyObserved:pd.observed,observedCount:pd.observedCount});
      }
      else if(e.kind==='planet-relationship') {
        const ref=window.RELPHI_SYMBOLIC_REFERENCE,condition=e.condition||e.raw?.condition;
        const semanticQuestion=ref?.relationshipQuestion?.(e.planet||e.raw?.planet,e.sign||e.raw?.sign);
        if(semanticQuestion) push(semanticQuestion,91+(condition?.statuses?.length||0)*3,'planet-relationship',{...e,semanticSource:'relphi-symbolic-reference',relationshipProfile:ref?.traditionalProfile?.(e.planet||e.raw?.planet)||null});
        if(e.retrograde){
          const planet=e.planet||e.raw?.planet,profile=ref?.planet?.(planet);
          if(profile?.retrograde) push('What is '+planet+' returning to revise while working in '+condition.host+"'s "+condition.mode+' '+condition.element+' affairs?',94,'planet-relationship',{...e,semanticSource:'relphi-symbolic-reference',motion:'retrograde'});
        }
      }
      else if(e.kind==='ruler') {
        const semanticQuestion=window.RELPHI_SYMBOLIC_REFERENCE?.planetQuestion?.(e.value,'repeated');
        if(semanticQuestion) push(semanticQuestion,76+Math.min(16,e.count),'ruler',{...e,semanticSource:'relphi-symbolic-reference',principle:window.RELPHI_SYMBOLIC_REFERENCE?.planet?.(e.value)?.principle||''});
      } else if(e.kind==='tag') {
        push(e.value+' is a repeated theme. What does that theme ask of this reading now?',68+Math.min(14,e.count),'tag',e);
      }
    });
    return out.sort((a,b)=>b.score-a.score).slice(0,16);
  }
  function astrologyAnalyzeResolved(skyA,skyB) {
    const perSky=[skyA,skyB].filter(Boolean).map((sky,index)=>{const name=sky.name||('Sky '+(index?'B':'A'));return {slot:index?'B':'A',name,hits:astrologyCardHits(sky),patterns:astrologyPatterns(sky),skyEvidence:astrologySkyEvidence(sky,name)}});
    const hits=new Map(),patternMap=new Map();perSky.forEach(s=>{s.hits.forEach(h=>{const x=hits.get(h.id)||{...h,count:0,reasons:[]};x.count+=h.count;x.reasons.push(...h.reasons);hits.set(h.id,x)});s.patterns.forEach(p=>{const key=p.type+':'+p.value,x=patternMap.get(key)||{...p,count:0,skies:[]};x.count+=(Number(p.count)||0);x.score=Math.max(Number(x.score)||0,Number(p.score)||0);if(!x.skies.includes(s.name))x.skies.push(s.name);patternMap.set(key,x)})});const patterns=[...patternMap.values()].sort((a,b)=>(b.count||0)-(a.count||0));
    const hitList=[...hits.values()].sort((a,b)=>b.count-a.count),cards=Array.isArray(window.RELPHI_TAROT_CARDS)?window.RELPHI_TAROT_CARDS:[],cardById=new Map(cards.map(card=>[card.card_id||card.stable_symbol_id,card])),tagCounts=new Map(),rulerCounts=new Map(),polarity={Active:0,Passive:0},ignoreTags=new Set(['active','passive','sign','zodiac template','yin arc (libra through pisces)','yang arc (aries through virgo)']);
    const polaritySign=(polarity)=>{const total=polarity.Active+polarity.Passive;if(!total||polarity.Active===polarity.Passive)return null;const winner=polarity.Active>polarity.Passive?'Active':'Passive',share=polarity[winner]/total,excess=share-.5,index=Math.min(5,Math.floor(excess/(.5/6))),signs=winner==='Active'?['Aries','Gemini','Leo','Libra','Sagittarius','Aquarius']:['Taurus','Cancer','Virgo','Scorpio','Capricorn','Pisces'];return {winner,share,excess,index,sign:signs[index],total}};
    hitList.forEach(hit=>{const card=cardById.get(hit.id);if(!card)return;const weight=Math.max(1,Number(hit.count)||1);(card.tags||[]).forEach(tag=>{const key=String(tag).trim(),lower=key.toLowerCase();if(lower==='active')polarity.Active+=weight;else if(lower==='passive')polarity.Passive+=weight;if(!ignoreTags.has(lower))tagCounts.set(key,(tagCounts.get(key)||0)+weight)});if(!(card.tags||[]).some(tag=>['active','passive'].includes(String(tag).toLowerCase()))&&card.polarity&&polarity[card.polarity]!=null)polarity[card.polarity]+=weight;[card.astrology?.planet,card.astrology?.sign_ruler,card.astrology?.decan_ruler].filter(Boolean).forEach(ruler=>rulerCounts.set(ruler,(rulerCounts.get(ruler)||0)+weight))});
    const ranked=map=>[...map].map(([value,count])=>({value,count})).sort((a,b)=>b.count-a.count||a.value.localeCompare(b.value)),topTags=ranked(tagCounts),topRulers=ranked(rulerCounts),evidence=[];
    hitList.forEach(h=>evidence.push({kind:'hit',id:h.id,value:h.name,count:h.count,raw:h}));perSky.forEach(s=>s.skyEvidence.forEach(x=>evidence.push({...x,raw:x})));patterns.forEach((p,i)=>evidence.push({kind:'pattern',id:p.type+':'+p.value+':'+i,value:p.value,count:p.count||0,raw:p}));topRulers.forEach(x=>evidence.push({kind:'ruler',id:x.value,value:x.value,count:x.count,raw:x}));topTags.forEach(x=>evidence.push({kind:'tag',id:x.value,value:x.value,count:x.count,raw:x}));
    if(polarity.Active||polarity.Passive)evidence.push({kind:'polarity',id:'active-passive',value:'Active '+polarity.Active+' · Passive '+polarity.Passive,count:polarity.Active+polarity.Passive,raw:polarity});
    const polarityDiagnostic=polaritySign(polarity),signCounts=new Map();patterns.filter(p=>p.type==='sign').forEach(p=>signCounts.set(p.value,(signCounts.get(p.value)||0)+(p.count||0)));if(polarityDiagnostic){polarityDiagnostic.observedCount=signCounts.get(polarityDiagnostic.sign)||0;polarityDiagnostic.observed=polarityDiagnostic.observedCount>0;polarityDiagnostic.signCounts=Object.fromEntries(signCounts)}const analysis={perSky,hits:hitList,patterns,topTags,topRulers,polarity,polarityDiagnostic,evidence};analysis.questions=astrologyQuestionSuggestions(analysis);return analysis;
  }
  function astrologyQuestionCategory(question) {
    const source=String(question?.source||'');
    if(['pattern','cluster','configuration'].includes(source))return {id:'patterns',label:'Patterns & concentrations'};
    if(source==='card-hit')return {id:'card-hits',label:'Card Hits'};
    if(source==='polarity-derived-sign')return {id:'polarity',label:'Polarity'};
    if(source==='planet-relationship')return {id:'planet-relationships',label:'Planet relationships'};
    if(source==='ruler')return {id:'rulers',label:'Repeated rulers'};
    if(source==='tag')return {id:'themes',label:'Repeated themes'};
    return {id:'other',label:'Other suggestions'};
  }
  function astrologyQuestionKey(question) { return String(question?.source||'question')+'|'+String(question?.text||'').trim(); }
  function astrologyQuestionIsSelected(session,question,index) {
    const selection=session?.astrologyQuestionSelection,key=astrologyQuestionKey(question);
    return selection&&Object.prototype.hasOwnProperty.call(selection,key)?!!selection[key]:index<3;
  }
  function astrologyQuestionGroupsMarkup(questionList,session) {
    const groups=[];
    questionList.forEach((question,index)=>{const category=astrologyQuestionCategory(question);let group=groups.find(x=>x.id===category.id);if(!group){group={...category,items:[]};groups.push(group);}group.items.push({question,index});});
    return groups.map(group=>{
      const selectedCount=group.items.filter(({question,index})=>astrologyQuestionIsSelected(session,question,index)).length;
      const categoryChecked=selectedCount===group.items.length&&group.items.length?' checked':'';
      return '<section class="relphi-astrology-question-group" data-astrology-question-group="'+escapeHtml(group.id)+'"><div class="relphi-astrology-question-group-head"><label class="relphi-astrology-category-toggle"><input type="checkbox" data-astrology-category-toggle="'+escapeHtml(group.id)+'"'+categoryChecked+'><strong>'+escapeHtml(group.label)+'</strong></label></div>'+group.items.map(({question,index})=>'<label class="relphi-astrology-question"><input type="checkbox" data-astrology-question="'+index+'" data-astrology-question-category="'+escapeHtml(group.id)+'" '+(astrologyQuestionIsSelected(session,question,index)?'checked':'')+'><span><strong>'+escapeHtml(question.text)+'</strong><small>'+escapeHtml(packLabel(question.pack))+'</small></span></label>').join('')+'</section>';
    }).join('');
  }
  function astrologyEvidenceCategory(item) {
    const kind=String(item?.kind||'');
    if(kind==='hit')return {id:'card-hits',label:'Card Hits'};
    if(kind==='placement')return {id:'placements',label:'Placements'};
    if(kind==='house')return {id:'houses',label:'Houses'};
    if(kind==='aspect')return {id:'aspects',label:'Aspects'};
    if(kind==='configuration')return {id:'configurations',label:'Configurations'};
    if(kind==='planet-relationship')return {id:'planet-relationships',label:'Planet relationships'};
    if(kind==='pattern')return {id:'patterns',label:'Patterns'};
    if(kind==='ruler')return {id:'rulers',label:'Rulers'};
    if(kind==='polarity')return {id:'polarity',label:'Polarity'};
    if(kind==='tag')return {id:'themes',label:'Themes'};
    return {id:'other',label:'Other'};
  }
  function astrologyEvidenceControlsMarkup(analysis,disabled) {
    const groups=[];
    analysis.evidence.forEach(item=>{
      const category=astrologyEvidenceCategory(item);
      let group=groups.find(entry=>entry.id===category.id);
      if(!group){group={...category,items:[]};groups.push(group);}
      group.items.push(item);
    });
    const activeGroups=groups.filter(group=>group.items.some(item=>['hit','placement','house','aspect','configuration','planet-relationship','pattern','ruler','polarity','tag'].includes(String(item.kind||''))));
    const allItems=activeGroups.flatMap(group=>group.items);
    const enabledCount=allItems.filter(item=>!disabled.has(astrologyEvidenceKey(item))).length;
    const masterChecked=allItems.length&&enabledCount===allItems.length?' checked':'';
    return '<section class="relphi-astrology-evidence-controls"><div class="relphi-astrology-evidence-control-head"><strong>Evidence</strong><label class="relphi-astrology-evidence-master"><input type="checkbox" data-astrology-evidence-master'+masterChecked+'> <span>All evidence</span></label></div><div class="relphi-astrology-evidence-categories">'+activeGroups.map(group=>{const count=group.items.filter(item=>!disabled.has(astrologyEvidenceKey(item))).length;const checked=count===group.items.length&&group.items.length?' checked':'';return '<label><input type="checkbox" data-astrology-evidence-category="'+escapeHtml(group.id)+'"'+checked+'><span>'+escapeHtml(group.label)+'</span></label>';}).join('')+'</div></section>';
  }
  function astrologyAnalysisMarkup(analysis,session) {
    if(!analysis)return '';const disabled=new Set(session?.astrologyDisabledEvidence||[]),checked=item=>disabled.has(astrologyEvidenceKey(item))?'':' checked';
    const evidenceBox=(item,label)=>{const category=astrologyEvidenceCategory(item);return '<label class="relphi-astrology-evidence"><input type="checkbox" data-astrology-evidence="'+escapeHtml(astrologyEvidenceKey(item))+'" data-astrology-evidence-category-id="'+escapeHtml(category.id)+'"'+checked(item)+'><span>'+label+'</span></label>';};
    const hits=analysis.hits.map(h=>evidenceBox({kind:'hit',id:h.id},'<strong>'+escapeHtml(h.name)+'</strong> ×'+h.count)).join('');
    const summaries=[...analysis.patterns.map((p,i)=>({kind:'pattern',id:p.type+':'+p.value+':'+i,value:p.value,count:p.count||0,type:p.type})),...analysis.topRulers.map(x=>({...x,kind:'ruler',id:x.value,type:'ruler'})),...(analysis.polarity.Active||analysis.polarity.Passive?[{kind:'polarity',id:'active-passive',value:'Active '+analysis.polarity.Active+' · Passive '+analysis.polarity.Passive,count:analysis.polarity.Active+analysis.polarity.Passive,type:'polarity'}]:[]),...analysis.topTags.slice(0,10).map(x=>({...x,kind:'tag',id:x.value,type:'tag'}))].sort((a,b)=>(b.count||0)-(a.count||0));
    const pd=analysis.polarityDiagnostic,polarityDetail=pd?' <small class="relphi-polarity-bin">'+pd.winner+' '+(pd.share*100).toFixed(1)+'% · excess '+(pd.excess*100).toFixed(1)+' points → <strong>'+pd.sign+'</strong> · bin '+(pd.index+1)+'/6</small>':'';
    const summary=summaries.map(x=>evidenceBox(x,'<strong>'+escapeHtml(x.value)+'</strong> · '+escapeHtml(x.type)+(x.count?' ×'+x.count:'')+(x.kind==='polarity'?polarityDetail:''))).join('');
    const diagnostic=pd?'<div class="relphi-polarity-diagnostic"><strong>Experimental polarity → sign test</strong><span>'+pd.winner+' selects the '+(pd.winner==='Active'?'Yang':'Yin')+' signs; '+(pd.excess*100).toFixed(1)+'-point excess selects bin '+(pd.index+1)+'/6 → <strong>'+pd.sign+'</strong>.</span><span class="relphi-polarity-test-result"><strong>Independent check:</strong> '+(pd.observed?escapeHtml(pd.sign)+' is independently concentrated ×'+pd.observedCount:'no independent '+escapeHtml(pd.sign)+' concentration')+'.</span><small>Experimental derived-sign evidence — included in the question generator while Polarity is checked.</small></div>':'';
    const enabled=new Set(analysis.evidence.map(astrologyEvidenceKey).filter(key=>!disabled.has(key))),questionList=astrologyQuestionSuggestions(analysis,enabled),questions=astrologyQuestionGroupsMarkup(questionList,session);
    session.astrologyVisibleQuestions=questionList;
    const skyChannels=analysis.perSky.map(s=>{const items=s.skyEvidence.filter(x=>['placement','house','aspect','configuration'].includes(x.kind)).map(x=>evidenceBox(x,'<strong>'+escapeHtml(x.value)+'</strong>'+(x.detail?' · '+escapeHtml(x.detail):''))).join('');return items?'<section><h4>Sky evidence · '+escapeHtml(s.name)+'</h4><div class="relphi-evidence-list">'+items+'</div></section>':''}).join('');
    const ownPack=String(session?.astrologyOwnPack||'');
    const ownPackOptions='<option value="">Choose sub-pack…</option>'+packOptions(ownPack);
    const evidenceControls=astrologyEvidenceControlsMarkup(analysis,disabled);
    return '<div class="relphi-astrology-analysis">'+evidenceControls+'<section><h4>Card Hits</h4><div class="relphi-evidence-list">'+hits+'</div></section>'+skyChannels+'<section><h4>Patterns & concentrations</h4><div class="relphi-evidence-list">'+summary+'</div>'+diagnostic+'</section><section class="relphi-astrology-questions"><div class="relphi-astrology-question-head"><h4>Suggested questions</h4><label class="relphi-astrology-category-master"><input type="checkbox" data-astrology-category-master> <strong>All categories</strong></label></div><p class="relphi-question-prompt">Checked evidence is factored into these suggestions. Check or clear a category box to change every question in that category at once. The All categories box controls the entire suggestion set. Accepting a generated question also accepts its assigned sub-pack. To use a different sub-pack, author your own question below.</p>'+questions+'<div class="relphi-astrology-own-question"><label><span>Your question</span><input type="text" data-astrology-own-question value="'+escapeHtml(session?.astrologyOwnQuestion||'')+'" placeholder="Write your own question…"></label><label><span>Sub-pack</span><select data-astrology-own-pack>'+ownPackOptions+'</select></label></div></section></div>';
  }
  function astrologySavedSkies() {
    try {
      const list=JSON.parse(localStorage.getItem('relphiSkyLibraryV1')||'[]');
      return Array.isArray(list) ? list.filter(record=>{
        if(!record)return false;
        const name=String(record.name||record.metadata?.savedSkyName||'').trim();
        const placements=record.placements||record.positions||record.points||record.bodies||{};
        return !!name&&!!placements&&Object.keys(placements).length>0;
      }) : [];
    } catch (_) { return []; }
  }
  function astrologySavedSkyRef(record) {
    return String(record?.id||record?.savedSkyId||record?.metadata?.savedSkyId||record?.name||'');
  }
  function astrologySavedSkyOptions(selectedId) {
    const records=astrologySavedSkies();
    return records.map(record=>{const id=astrologySavedSkyRef(record);return id?'<option value="saved:'+escapeHtml(id)+'" '+(selectedId===id?'selected':'')+'>'+escapeHtml(String(record.name||record.metadata?.savedSkyName||'Saved sky'))+'</option>':'';}).join('');
  }
  function astrologySharedConnectorSky() {
    const live=window.RelphiSkyConnector?.context?.();
    if(live?.enabled&&live?.source==='saved'&&live.savedSkyId){
      const record=live.savedSky||astrologySavedSkies().find(item=>astrologySavedSkyRef(item)===String(live.savedSkyId));
      if(record)return {id:String(live.savedSkyId),name:String(record.name||record.metadata?.savedSkyName||'Connected sky'),record};
    }
    try{
      const connector=JSON.parse(localStorage.getItem('relphiDrawingBoardSkyConnectorV1')||'null');
      if(connector?.enabled&&connector?.source==='saved'&&connector.savedSkyId){
        const record=astrologySavedSkies().find(item=>astrologySavedSkyRef(item)===String(connector.savedSkyId));
        if(record)return {id:String(connector.savedSkyId),name:String(record.name||record.metadata?.savedSkyName||'Connected sky'),record};
      }
    }catch(_){}
    return null;
  }
  function astrologySeedFromSharedConnector(session) {
    if(!session||session.astrologyConnectorSeeded)return;
    session.astrologyConnectorSeeded=true;
    const shared=astrologySharedConnectorSky();
    if(!session.astrologySkyASource){
      session.astrologySkyASource=shared?'saved:'+shared.id:'here-now';
    }
    if(!session.astrologySkyBSource)session.astrologySkyBSource='here-now';
    if(!Number.isFinite(Number(session.astrologySkyCount))||Number(session.astrologySkyCount)<1)session.astrologySkyCount=1;
    if(shared&&session.astrologySkyASource==='saved:'+shared.id){
      session.astrologyInheritedConnectorId=shared.id;
      session.astrologyInheritedConnectorName=shared.name;
    }
  }
  function invalidateAstrologyConnection(session) {
    if(!session)return;
    session.astrologyAnalysis=null;
    session.astrologyResolved=null;
    session.astrologyVisibleQuestions=[];
    session.astrologyQuestionSelection={};
    session.astrologyDisabledEvidence=[];
  }
  function astrologySkySourceMarkup(slot,session,disabled=false) {
    const isB=slot==='B',key=isB?'astrologySkyBSource':'astrologySkyASource';
    const value=session[key]||'here-now';
    const selectedId=value.startsWith('saved:')?value.slice(6):'';
    const records=astrologySavedSkies();
    const inherited=!isB&&session.astrologyInheritedConnectorId&&selectedId===String(session.astrologyInheritedConnectorId);
    const label=isB?'Sky B':'Sky A';
    return '<div class="relphi-astrology-sky-source" data-astrology-sky-slot="'+slot+'">'+
      '<div class="relphi-astrology-sky-source-head"><strong>'+label+'</strong>'+
        (inherited?'<span class="relphi-astrology-inherited-sky">Connected · '+escapeHtml(session.astrologyInheritedConnectorName||'Drawing Board')+'</span>':'')+
        (isB?'<button type="button" class="relphi-button relphi-button--quiet relphi-remove-astrology-sky" data-remove-astrology-sky="B" '+(disabled?'disabled':'')+'>Remove</button>':'')+
      '</div>'+
      '<select aria-label="'+(isB?'Second sky':'Primary sky')+'" data-astrology-sky-source="'+slot+'" '+(disabled?'disabled':'')+'>'+
        '<option value="here-now" '+(value==='here-now'?'selected':'')+'>Here & Now</option>'+
        (records.length?'<optgroup label="Saved Skies">'+astrologySavedSkyOptions(selectedId)+'</optgroup>':'')+
      '</select>'+
      (inherited?'<small class="relphi-astrology-inherited-note">Using the sky already connected to the Drawing Board. Choose another source here to replace it for this reading only.</small>':'')+
      (records.length?'':'<small class="relphi-saved-sky-empty">No Saved Skies were found in the shared Sky Chart library.</small>')+
    '</div>';
  }
  function astrologyResolveSavedSky(source) {
    if(!String(source||'').startsWith('saved:')) return null;
    const ref=String(source).slice(6);
    return astrologySavedSkies().find(record=>astrologySavedSkyRef(record)===ref)||null;
  }
  function astrologyWhereWhenPacket() {
    try {
      const p=JSON.parse(localStorage.getItem('relphiPlanetaryHoursWhereWhen')||'null')||{};
      return {latitude:p.lat??p.latitude,longitude:p.lon??p.longitude,timeZone:p.tz??p.timeZone,location:p.loc??p.location};
    } catch (_) { return {}; }
  }
  function astrologySetField(id,value) {
    const field=document.getElementById(id); if(!field)return false;
    field.value=value==null?'':String(value);
    field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));return true;
  }
  function astrologyCalculateHereNow() {
    return new Promise((resolve,reject)=>{
      const packet=astrologyWhereWhenPacket();
      if(packet.latitude==null||packet.longitude==null)return reject(new Error('Set Where and When before using Here & Now.'));
      const now=new Date(),browserZone=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC',zone=packet.timeZone||browserZone;
      const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).formatToParts(now).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
      const dateTime=parts.year+'-'+parts.month+'-'+parts.day+'T'+(parts.hour==='24'?'00':parts.hour)+':'+parts.minute;
      astrologySetField('skyCalcTarget','chart');astrologySetField('skyCreatorTarget','chart');astrologySetField('skyCalcDateTime',dateTime);astrologySetField('skyCalcLatitude',packet.latitude);astrologySetField('skyCalcLongitude',packet.longitude);astrologySetField('skyCalcTimeZone',zone);astrologySetField('skyCalcLocation',packet.location||'Here & Now');astrologySetField('skyCalcName','Here & Now');
      const startedAt=Date.now(),onCalculated=event=>{
        const result=event.detail;if(!result||result.target!=='chart'||!result.placements||!Object.keys(result.placements).length)return;
        cleanup();resolve({name:'Here & Now',placements:clone(result.placements),calcProfile:{...(result.calcProfile||{}),source:'here-and-now'}});
      },cleanup=()=>window.removeEventListener('relphi:sky-calculated',onCalculated);
      window.addEventListener('relphi:sky-calculated',onCalculated);
      const direct=typeof runSkyCalculation==='function'?runSkyCalculation('chart'):null;
      if(direct&&typeof direct.then==='function')direct.then(ok=>{if(!ok){cleanup();reject(new Error(document.getElementById('skyCalcStatus')?.textContent||'Here & Now could not be calculated.'))}}).catch(error=>{cleanup();reject(error)});
      else {const button=document.getElementById('skyCalcRun');if(!button){cleanup();return reject(new Error('Sky calculation is unavailable.'))}button.click()}
      setTimeout(()=>{if(Date.now()-startedAt>=15000){cleanup();reject(new Error('Here & Now calculation timed out.'))}},15100);
    });
  }
  async function astrologyResolveSource(source) {
    if(String(source||'')==='here-now')return astrologyCalculateHereNow();
    const saved=astrologyResolveSavedSky(source);if(saved)return clone(saved);
    throw new Error('Choose a valid sky source.');
  }
  function astrologyHouseSystemMarkup(session,disabled=false) {
    const value=session.astrologyHouseSystem||'whole-sign',options=[['whole-sign','Whole Sign'],['equal-house','Equal House'],['porphyry','Porphyry'],['placidus','Placidus'],['alcabitius','Alcabitius'],['regiomontanus','Regiomontanus'],['campanus','Campanus'],['koch','Koch']];
    return '<details class="relphi-astrology-advanced" data-astrology-advanced '+(session.astrologyAdvanced?'open':'')+'>'+
      '<summary><strong>Advanced</strong><span>House system · '+escapeHtml(options.find(([v])=>v===value)?.[1]||'Whole Sign')+'</span></summary>'+
      '<div class="relphi-astrology-advanced-body">'+
        '<p>Only change this if you intentionally want a different house division for this reading.</p>'+
        '<label class="relphi-astrology-house-system"><span>House system</span><select data-astrology-house-system '+(disabled?'disabled':'')+'>'+options.map(([v,n])=>'<option value="'+v+'" '+(value===v?'selected':'')+'>'+n+'</option>').join('')+'</select><small>Chosen for this reading; Saved Skies stay house-system-neutral.</small></label>'+
      '</div>'+
    '</details>';
  }
  function astrologySurfaceMarkup(session,disabled=false) {
    astrologySeedFromSharedConnector(session);
    const count=Math.max(1,Math.min(2,Number(session.astrologySkyCount)||1));
    return '<section class="relphi-referent-panel relphi-astrology-surface">'+
      ''+
      astrologyHouseSystemMarkup(session,disabled)+
      '<div class="relphi-astrology-sky-sources">'+
        (count>0?astrologySkySourceMarkup('A',session,disabled):'')+
        (count>1?astrologySkySourceMarkup('B',session,disabled):'')+
        (count<2?'<button type="button" class="relphi-add-sky" data-add-astrology-sky '+(disabled?'disabled':'')+'>+ Compare a second sky</button>':'')+
      '</div>'+
      (count?'<div class="relphi-astrology-bridge-status"><strong>Sky connection</strong><span data-astrology-sky-status>'+(session.astrologyAnalysis?'Review the evidence below. Select suggested questions or write your own before starting the reading.':'Ready to connect.')+'</span><button type="button" id="relphiConnectSky" '+(disabled?'disabled':'')+'>Use '+(count>1?'These Skies':'This Sky')+'</button></div>':'')+
      (session.astrologyAnalysis?astrologyAnalysisMarkup(session.astrologyAnalysis,session):'')+
      '</section>';
  }

  function mixedValue(values) {
    const normalized=values.map(value=>String(value??''));
    return normalized.length && normalized.every(value=>value===normalized[0]) ? normalized[0] : '__mixed__';
  }
  function bespokeQuestionControllerMarkup(draft) {
    return '<section class="relphi-question-controller" aria-label="Selected question settings">'+
      '<div class="relphi-question-controller-head"><strong>Question controller</strong><span id="relphiQuestionControllerStatus">Select one or more questions.</span></div>'+
      '<div class="relphi-question-controller-fields">'+
        '<label>Sub-pack<div class="relphi-subpack-control"><select id="relphiQuestionControllerPack" class="relphi-select" disabled><option value="">Select questions</option></select><button type="button" class="relphi-subpack-create" data-create-subpack aria-label="Create a sub-pack">+</button></div></label>'+
        '<label class="relphi-card-count-controller">Cards per question<div><input id="relphiQuestionControllerCards" class="relphi-input" type="number" inputmode="numeric" min="1" max="12" step="1" placeholder="—" disabled aria-label="Cards per selected question"><span>× Cards</span></div></label>'+
        '<label>Share card with<select id="relphiQuestionControllerLink" class="relphi-select" disabled><option value="">Select questions</option></select></label>'+
        '<label class="relphi-question-controller-check"><input id="relphiQuestionControllerReversals" type="checkbox" disabled> Reversals</label>'+
        '<label class="relphi-question-controller-check"><input id="relphiQuestionControllerRepeats" type="checkbox" disabled> Repeats</label>'+
      '</div>'+
    '</section>';
  }

  function bespokeMarkup(draft,hasCards) {
    const clonedFrom=!draft.templateId&&draft.basedOnTemplateId?templateById(draft.basedOnTemplateId):null;
    return '<section class="relphi-referent-panel">'+
      (clonedFrom?'<div class="relphi-template-clone-note"><strong>Editing a copy of '+escapeHtml(clonedFrom.name)+'</strong><span>The original template stays untouched. Name and save this Bespoke version if you want to keep it; you can also continue without saving.</span></div>':'')+
      '<div class="relphi-question-toolbar"><label><input type="checkbox" id="relphiSelectAllQuestions" aria-label="Select all questions for editing"> <span>Select all</span></label><button type="button" id="relphiCopyBespokeQuestions" class="relphi-button relphi-question-copy" aria-label="Copy all Bespoke questions and advanced settings">Copy</button><button type="button" id="relphiMoveQuestionsUp" aria-label="Move selected questions up">↑</button><button type="button" id="relphiMoveQuestionsDown" aria-label="Move selected questions down">↓</button><button type="button" id="relphiDeleteQuestions" class="relphi-stroke-icon relphi-stroke-x" aria-label="Delete selected questions"><span aria-hidden="true"></span></button><button type="button" id="relphiAddPosition" class="relphi-stroke-icon relphi-stroke-plus" aria-label="Add question" '+(hasCards||draft.labels.length>=MAX_POSITIONS?'disabled':'')+'><span aria-hidden="true"></span></button></div>'+
      bespokeQuestionControllerMarkup(draft)+
      '<div id="relphiPositionLabels">'+labelsMarkup(draft.labels,draft)+'</div>'+
      '<div class="relphi-template-save"><input id="relphiTemplateName" class="'+((draft.templateName||'Unnamed Template')==='Unnamed Template'?'is-unnamed':'')+'" type="text" maxlength="60" aria-label="Template name" value="'+escapeHtml(draft.templateName||'Unnamed Template')+'" '+(hasCards?'disabled':'')+'><button type="button" id="relphiSaveTemplate" '+(hasCards?'disabled':'')+'>Save template</button></div>'+
      '</section>';
  }
  function hydrateTemplateDraft(draft,template) {
    if(!draft||!template||!Array.isArray(template.positions))return false;
    const ordered=template.positions.slice().sort((a,b)=>(Number(a.drawOrder)||0)-(Number(b.drawOrder)||0));
    draft.templateId=template.id;
    draft.basedOnTemplateId=template.id;
    draft.templateName=template.name||'';
    draft.labels=ordered.map((item,index)=>String(item.label||('Position '+(index+1))));
    draft.positionPacks=ordered.map(item=>String(item.drawScope||template.rules?.drawScope||''));
    draft.positionSettings=[];
    draft.pack=String(template.rules?.drawScope||draft.pack||'full');
    draft.reversals=template.rules?.allowReversals!==false;
    draft.repeats=!!template.rules?.allowRepeats;
    return true;
  }

  function templatesMarkup(draft,hasCards) {
    const entries=allTemplates();
    const requestedId=draft.templateId||draft.basedOnTemplateId;
    const effectiveId=entries.some(item=>item.id===requestedId)?requestedId:(entries[0]?.id||'');
    // Templates are authoritative. Entering this path replaces stale Bespoke
    // question state with the selected template's own canonical positions.
    const selected=templateById(effectiveId);
    if(!draft.templateId && selected) hydrateTemplateDraft(draft,selected);
    const positions=selected?.positions?.slice?.().sort((a,b)=>a.drawOrder-b.drawOrder) || [];
    const preview=selected?.id===RECURSION_ID
      ? '<div class="relphi-recursion-template-note"><strong>Seven recursive levels · 22 cards</strong><span>Each level uses the Relphi logo: Mem, Aleph, and Shin occupy the three black circles. The red circle is Earth, the portal to the next level; on Level 7 it receives card 22. The seven-level depth control is the 1×7 Veilva.</span></div>'
      : selected?.id==='crowley-harmonic-divination-12'
        ? '<div class="relphi-recursion-template-note"><strong>Five-operation method · not a 12-position spread</strong><span>I · IHVH four piles · II · 12 houses · III · 12 signs · IV · Significator + 36-card ring · V · 10 Tree of Life piles.</span></div>'
        : positions.length
          ? '<ol class="relphi-template-preview">'+positions.map(item=>'<li>'+escapeHtml(item.label)+'</li>').join('')+'</ol>'
          : '<p class="relphi-referent-empty">Choose a template to preview its referents.</p>';
    return '<section class="relphi-referent-panel">'+
      '<label class="relphi-options-field">Template<select id="relphiSpreadTemplateSelect" '+(hasCards?'disabled':'')+'>'+optionTemplateMarkup(draft)+'</select></label>'+
      preview+
      (selected?'<div class="relphi-template-modify"><button type="button" id="relphiModifyTemplate" '+(hasCards?'disabled':'')+'>Modify a copy</button><span>Clones this template into Bespoke so the original remains unchanged.</span></div>':'')+
      '</section>';
  }
  function sacredCardSourceMarkup(session,disabled=false) {
    const source=session?.sacredCardSource==='physical'?'physical':'digital';
    return '<fieldset class="relphi-sacred-card-source"><legend>Drawing method</legend>'+
      '<label class="relphi-sacred-card-source-choice"><input type="radio" name="relphiSacredCardSource" value="digital" data-sacred-card-source '+(source==='digital'?'checked ':'')+(disabled?'disabled ':'')+'><span><strong>Digital</strong><small>Relphi draws the card from the assigned sub-pack.</small></span></label>'+
      '<label class="relphi-sacred-card-source-choice"><input type="radio" name="relphiSacredCardSource" value="physical" data-sacred-card-source '+(source==='physical'?'checked ':'')+(disabled?'disabled ':'')+'><span><strong>Manual</strong><small>Draw from your physical deck, then enter the card and orientation.</small></span></label>'+
    '</fieldset>';
  }

  function appendToOuterPathPanel(markup,addition) {
    const close=markup.lastIndexOf('</section>');
    return close<0 ? markup+addition : markup.slice(0,close)+addition+markup.slice(close);
  }

  function pathPanelMarkup(session,hasCards) {
    const draft=session.draft;
    if (!session.path) return '<p class="relphi-referent-intro">Choose a referent path. Drawing itself stays in the Board tab.</p>';
    const source=sacredCardSourceMarkup(session,hasCards);
    if (session.path==='bespoke') return appendToOuterPathPanel(bespokeMarkup(draft,hasCards),source);
    if (session.path==='templates') return appendToOuterPathPanel(templatesMarkup(draft,hasCards),source);
    if (session.path==='blocks') return '<section class="relphi-referent-panel">'+buildingControlsMarkup(session,hasCards)+suggestionMarkup(session,hasCards)+source+'</section>';
    if (session.path==='surface') return '<section class="relphi-referent-panel">'+surfaceChoicesMarkup(session,hasCards)+source+'</section>';
    if (session.path==='astro') return appendToOuterPathPanel(astrologySurfaceMarkup(session,hasCards),source);
    return '';
  }

  function keepAstrologyConnectorInView(root=panel()) {
    const drawer=root?.querySelector('.relphi-reading-options-drawer');
    const body=drawer?.querySelector('.relphi-options-body');
    const bridge=drawer?.querySelector('.relphi-astrology-bridge-status');
    const button=drawer?.querySelector('#relphiConnectSky');
    if(!drawer||!body||!bridge||!button)return false;
    const bodyRect=body.getBoundingClientRect();
    const bridgeRect=bridge.getBoundingClientRect();
    const pad=14;
    const fullyVisible=bridgeRect.top>=bodyRect.top+pad && bridgeRect.bottom<=bodyRect.bottom-pad;
    if(fullyVisible)return true;
    const targetTop=body.scrollTop+(bridgeRect.top-bodyRect.top)-Math.max(pad,(bodyRect.height-bridgeRect.height)/2);
    // This runs during the same DOM update as the rerender. Never animate it:
    // delayed/smooth correction lets the new drawer visibly flash at scrollTop 0.
    body.scrollTop=Math.max(0,targetTop);
    return true;
  }

  function renderOptions(root = panel(), {preserveScroll=true} = {}) {
    if (!root || !optionsSession) return;
    const previousDrawer=root.querySelector('.relphi-reading-options-drawer');
    const previousBody=previousDrawer?.querySelector('.relphi-options-body');
    const previousScrollTop=preserveScroll&&previousBody ? previousBody.scrollTop : null;
    previousDrawer?.remove();
    const modeTabs = root.querySelector('.drawing-board-mode-switch');
    if (!modeTabs) return;
    const session=optionsSession;
    const draft = session.draft;
    const hasCards = currentCardCount(root) > 0;
    const drawer = document.createElement('section');
    drawer.className='relphi-reading-options-drawer is-reading-options-open relphi-referents-drawer';
    drawer.id='drawingBoardReadingOptions';
    drawer.setAttribute('role','region');
    drawer.setAttribute('aria-label','Crafted reading paths');
    draft.stickers=true;
    if(!['digital','physical'].includes(session.sacredCardSource))session.sacredCardSource='digital';
    const activePathPanel=pathPanelMarkup(session,hasCards);
    const pathEntry=(id,label,description)=>{
      const expanded=session.path===id && !session.pathCollapsed;
      return referentPathButton(id,label,description,session.path,hasCards,expanded)+(expanded?'<div class="relphi-referent-path-drawer" id="relphiReferentPanel-'+id+'" data-referent-path-panel="'+id+'">'+activePathPanel+'</div>':'');
    };
    drawer.innerHTML = '<div class="relphi-options-heading"><div><span class="eyebrow">Drawing Board</span><h3>Crafted Draw</h3></div></div>'+
      (hasCards ? '<p class="relphi-options-note relphi-options-note-visible">Reset Board before changing referents. The reading structure is locked once cards are drawn.</p>' : '')+
      '<div class="relphi-options-body">'+
        '<div class="relphi-referent-paths" role="list" aria-label="Referent paths">'+
          pathEntry('bespoke','Bespoke','Write your own referents.')+
          pathEntry('templates','Templates','Use a saved or established spread.')+
          pathEntry('blocks','Building Blocks','Choose elements planets aspects signs houses and Universal Human Needs.')+
          pathEntry('surface','See What Surfaces','Draw symbolic cards to discover what to ask.')+
          pathEntry('astro','Astrological Tarot Reading','Connect one or two skies and surface questions from exact card hits.')+
        '</div>'+
        (session.path==='surface'&&!session.pathCollapsed
          ? (()=>{const count=selectedSurfaceKinds(session).length,ready=count>0;return '<aside class="relphi-surface-readiness '+(ready?'is-ready':'')+'" data-surface-readiness role="status" aria-live="polite">'+
              '<div class="relphi-surface-readiness-rail" aria-label="Crafted reading progress">'+
                '<div class="relphi-surface-readiness-step is-complete" data-readiness-step="path"><i aria-hidden="true"></i><strong>Path</strong><small>See What Surfaces</small></div>'+
                '<div class="relphi-surface-readiness-step '+(ready?'is-complete':'')+'" data-readiness-step="questions"><i aria-hidden="true"></i><strong>Questions</strong><small data-surface-question-status>'+(ready?count+' selected':'Choose 1+')+'</small></div>'+
                '<div class="relphi-surface-readiness-step '+(ready?'is-complete is-success':'')+'" data-readiness-step="ready"><i aria-hidden="true"></i><strong>Ready</strong><small data-surface-ready-status>'+(ready?'Minimum met':'Waiting')+'</small></div>'+
              '</div>'+
              '<div class="relphi-surface-readiness-message">'+
                '<span><strong data-surface-readiness-title>'+(ready?'✓ Ready to begin':'↑ Choose at least one question above')+'</strong><small data-surface-readiness-detail>'+(ready?(count+' question'+(count===1?'':'s')+' selected · minimum met'):'One question is enough to craft the reading.')+'</small></span>'+
                '<button type="button" data-surface-select-all-bottom '+(ready?'hidden':'')+'>Select all '+SURFACE_DRAW_KEYS.length+'</button>'+
              '</div>'+
            '</aside>';})()
          : '')+
      '</div>'+
      '<div class="relphi-options-commitbar"><button type="button" id="relphiCancelOptions">Cancel</button><span></span><button type="button" id="relphiApplyOptions" class="primary" '+(session.path==='surface'&&!selectedSurfaceKinds(session).length?'disabled':'')+'>Confirm</button></div>';
    modeTabs.insertAdjacentElement('afterend',drawer);
    renderBoardConfiguration(root);
    const nextBody=drawer.querySelector('.relphi-options-body');
    if(nextBody&&Number.isFinite(previousScrollTop))nextBody.scrollTop=previousScrollTop;
    if(nextBody&&!Number.isFinite(previousScrollTop)){
      const activePath=drawer.querySelector('[data-referent-path].is-active');
      if(activePath){
        const bodyRect=nextBody.getBoundingClientRect(), pathRect=activePath.getBoundingClientRect();
        nextBody.scrollTop=Math.max(0,nextBody.scrollTop+(pathRect.top-bodyRect.top)-8);
      }
    }
    setBoardMode(root,'referents');
    // Resolve the final Astrological viewport before this DOM update paints.
    // Path changes may choose a new landing position; in-path rerenders preserve it.
    if(session.path==='astro' && !session.astrologyAnalysis)keepAstrologyConnectorInView(root);

    drawer.querySelectorAll('[data-referent-path]').forEach(button=>button.addEventListener('click',()=>{
      const nextPath=button.dataset.referentPath || '';
      if(session.path===nextPath){
        session.pathCollapsed=!session.pathCollapsed;
      }else{
        session.path=nextPath;
        session.pathCollapsed=false;
        session.suggestions=[];
        session.suggestionPacks=[];
      }
      syncZoomToolbarVisibility(root);
      renderOptions(root,{preserveScroll:false});
    }));

    drawer.querySelector('[data-add-astrology-sky]')?.addEventListener('click',()=>{
      session.astrologySkyCount=2;
      session.astrologySkyBSource ||= 'here-now';
      invalidateAstrologyConnection(session);
      renderOptions(root,{preserveScroll:true});
    });
    drawer.querySelector('[data-remove-astrology-sky]')?.addEventListener('click',()=>{
      session.astrologySkyCount=1;
      session.astrologySkyBSource='here-now';
      invalidateAstrologyConnection(session);
      renderOptions(root,{preserveScroll:true});
    });
    const setAstrologyEvidenceEnabled=(keys,enabled)=>{
      const disabled=new Set(session.astrologyDisabledEvidence||[]);
      keys.forEach(key=>{if(enabled)disabled.delete(key);else disabled.add(key);});
      session.astrologyDisabledEvidence=[...disabled];
    };
    drawer.querySelectorAll('[data-astrology-evidence]').forEach(box=>box.addEventListener('change',()=>{setAstrologyEvidenceEnabled([box.dataset.astrologyEvidence],box.checked);renderOptions(root);}));
    drawer.querySelectorAll('[data-astrology-evidence-category]').forEach(toggle=>toggle.addEventListener('change',()=>{
      const category=toggle.dataset.astrologyEvidenceCategory;
      const keys=(session.astrologyAnalysis?.evidence||[]).filter(item=>astrologyEvidenceCategory(item).id===category).map(astrologyEvidenceKey);
      setAstrologyEvidenceEnabled(keys,toggle.checked);
      renderOptions(root);
    }));
    drawer.querySelector('[data-astrology-evidence-master]')?.addEventListener('change',event=>{
      const keys=(session.astrologyAnalysis?.evidence||[]).filter(item=>['hit','placement','house','aspect','configuration','planet-relationship','pattern','ruler','polarity','tag'].includes(String(item.kind||''))).map(astrologyEvidenceKey);
      setAstrologyEvidenceEnabled(keys,event.target.checked);
      renderOptions(root);
    });
    drawer.querySelector('[data-astrology-own-question]')?.addEventListener('input',event=>{session.astrologyOwnQuestion=event.target.value;});
    drawer.querySelector('[data-astrology-own-pack]')?.addEventListener('change',event=>{session.astrologyOwnPack=event.target.value||'';});
    const rememberAstrologyQuestionSelection=box=>{
      const index=Number(box.dataset.astrologyQuestion),question=session.astrologyVisibleQuestions?.[index];
      if(!question)return;
      session.astrologyQuestionSelection ||= {};
      session.astrologyQuestionSelection[astrologyQuestionKey(question)]=!!box.checked;
    };
    const syncAstrologyCategoryBoxes=()=>{
      const questions=Array.from(drawer.querySelectorAll('[data-astrology-question]'));
      const syncToggle=(toggle,items)=>{
        const checked=items.filter(box=>box.checked).length;
        toggle.checked=items.length>0&&checked===items.length;
        toggle.indeterminate=checked>0&&checked<items.length;
      };
      drawer.querySelectorAll('[data-astrology-category-toggle]').forEach(toggle=>{
        const category=toggle.dataset.astrologyCategoryToggle;
        syncToggle(toggle,questions.filter(box=>box.dataset.astrologyQuestionCategory===category));
      });
      const master=drawer.querySelector('[data-astrology-category-master]');
      if(master)syncToggle(master,questions);
    };
    drawer.querySelectorAll('[data-astrology-question]').forEach(box=>box.addEventListener('change',()=>{rememberAstrologyQuestionSelection(box);syncAstrologyCategoryBoxes();}));
    drawer.querySelectorAll('[data-astrology-category-toggle]').forEach(toggle=>toggle.addEventListener('change',()=>{
      const category=toggle.dataset.astrologyCategoryToggle;
      drawer.querySelectorAll('[data-astrology-question]').forEach(box=>{if(box.dataset.astrologyQuestionCategory!==category)return;box.checked=toggle.checked;rememberAstrologyQuestionSelection(box);});
      syncAstrologyCategoryBoxes();
    }));
    drawer.querySelector('[data-astrology-category-master]')?.addEventListener('change',event=>{
      drawer.querySelectorAll('[data-astrology-question]').forEach(box=>{box.checked=event.target.checked;rememberAstrologyQuestionSelection(box);});
      syncAstrologyCategoryBoxes();
    });
    syncAstrologyCategoryBoxes();
    drawer.querySelector('[data-astrology-advanced]')?.addEventListener('toggle',event=>{session.astrologyAdvanced=!!event.currentTarget.open;});
    drawer.querySelector('[data-astrology-house-system]')?.addEventListener('change',event=>{session.astrologyHouseSystem=event.target.value;session.astrologyAdvanced=true;session.astrologyAnalysis=null;session.astrologyResolved=null;renderOptions(root);});
    drawer.querySelectorAll('[data-astrology-sky-source]').forEach(select=>select.addEventListener('change',()=>{
      const slot=select.dataset.astrologySkySource==='B'?'B':'A';
      session[slot==='B'?'astrologySkyBSource':'astrologySkyASource']=select.value||'here-now';
      invalidateAstrologyConnection(session);
      renderOptions(root,{preserveScroll:true});
    }));
    drawer.querySelector('#relphiConnectSky')?.addEventListener('click',async()=>{
      const button=drawer.querySelector('#relphiConnectSky'),count=Math.max(1,Math.min(2,Number(session.astrologySkyCount)||1)),mode=count>1?'AB':'A';
      const status=drawer.querySelector('[data-astrology-sky-status]');
      if(button){button.disabled=true;button.textContent='Preparing…'} if(status)status.textContent='Resolving the selected sky'+(mode==='AB'?'s':'')+'…';
      try{
        const skyA=await astrologyResolveSource(session.astrologySkyASource||'here-now');
        const skyB=mode==='AB'?await astrologyResolveSource(session.astrologySkyBSource||'here-now'):null;
        session.astrologyResolved={mode,skyA,skyB,houseSystem:session.astrologyHouseSystem||'whole-sign',resolvedAt:new Date().toISOString()};
        session.astrologyQuestionSelection={};
        session.astrologyAnalysis=astrologyAnalyzeResolved(skyA,skyB);
        draft.labels=session.astrologyAnalysis.questions.slice(0,3).map(q=>q.text);
        if(!draft.labels.length)draft.labels=['Astrological surface · 1','Astrological surface · 2','Astrological surface · 3'];
        draft.positionPacks=['full','full','full'];draft.templateId='';draft.basedOnTemplateId='';draft.templateName='Astrological Tarot Reading';
        window.RELPHI_ASTROLOGICAL_TAROT_CONTEXT=clone(session.astrologyResolved);
        window.dispatchEvent(new CustomEvent('relphi:astrological-tarot-skies-ready',{detail:clone(session.astrologyResolved)}));
        if(status)status.textContent=(skyA.name||'Sky A')+(skyB?' + '+(skyB.name||'Sky B'):'')+' ready.';
        renderOptions(root);
        showBoardToast('The selected sky'+(skyB?'s are':' is')+' loaded into the Astrological Tarot Reading. The next draw can now use real placement data.',{title:'Astrological Tarot Reading',duration:6200});
      }catch(error){if(status)status.textContent=error.message||'The selected sky could not be prepared.';showBoardToast(error.message||'The selected sky could not be prepared.',{title:'Astrological Tarot Reading',duration:6200})}
      finally{if(button?.isConnected){button.disabled=false;button.textContent='Use '+(count>1?'These Skies':'This Sky')}}
    });

    const templateSelect = drawer.querySelector('#relphiSpreadTemplateSelect');
    templateSelect?.addEventListener('change',()=>{
      const chosen=templateById(templateSelect.value);
      if(chosen)hydrateTemplateDraft(draft,chosen);
      // Rerender only the settings UI so the selected template preview is current;
      // applying the canonical board layout still waits for Confirm.
      renderOptions(root);
    });
    drawer.querySelector('#relphiModifyTemplate')?.addEventListener('click',()=>{
      const chosen=templateById(draft.templateId||draft.basedOnTemplateId);
      if(!chosen||hasCards)return;
      draft.templateId='';
      draft.basedOnTemplateId=chosen.id;
      draft.templateName='Unnamed Template';
      draft.labels=chosen.positions.slice().sort((a,b)=>a.drawOrder-b.drawOrder).map(item=>item.label);
      draft.positionPacks=chosen.positions.slice().sort((a,b)=>a.drawOrder-b.drawOrder).map(item=>String(item.drawScope||''));
      draft.pack=chosen.rules?.drawScope||draft.pack||'full';
      draft.reversals=chosen.rules?.allowReversals!==false;
      draft.repeats=!!chosen.rules?.allowRepeats;
      session.path='bespoke';
      syncTransformEditingAvailability(root);
      renderOptions(root,{preserveScroll:false});
      showBoardToast('A Bespoke copy is ready to modify. Save it with a name if you want to keep it, or simply continue.',{title:'Template copied',duration:5200});
    });

    const labelsList=drawer.querySelector('#relphiPositionLabels');
    const refreshBespokeLabels=()=>{
      if (!labelsList?.isConnected) return;
      labelsList.innerHTML=labelsMarkup(draft.labels,draft);
      const add=drawer.querySelector('#relphiAddPosition');
      if (add) add.disabled=hasCards || draft.labels.length>=MAX_POSITIONS;
      drawer.querySelector('.relphi-referent-review')?.remove();
    };
    const acceptCommaList=(value)=>{
      const labels=parseBulkQuestions(value);
      if (!labels.length) return false;
      draft.labels=labels;
      draft.positionPacks=[];
      markQuestionEditCustom(drawer,draft);
      refreshBespokeLabels();
      return true;
    };
    labelsList?.addEventListener('input',event=>{
      const row=event.target.closest('.relphi-label-row');
      if (!row || !event.target.matches('[data-position-label]')) return;
      const index=Number(row.dataset.labelRow);
      while (draft.labels.length<=index) draft.labels.push('');
      draft.labels[index]=event.target.value;
      draft.positionPacks=[];
      markQuestionEditCustom(drawer,draft);
    });
    labelsList?.addEventListener('focusout',event=>{
      const row=event.target.closest('.relphi-label-row');
      if (!row || !event.target.matches('[data-position-label]') || Number(row.dataset.labelRow)!==0) return;
      const value=event.target.value;
      if (!value.includes(',') || parseBulkQuestions(value).length<2) return;
      // Parse only after Question 1 loses focus so commas never interrupt typing.
      queueMicrotask(()=>{ if (optionsSession && labelsList?.isConnected) acceptCommaList(value); });
    });
    labelsList?.addEventListener('click',event=>{
      const mover=event.target.closest('[data-move-label]');
      if(mover){
        const from=Number(mover.dataset.labelIndex),to=mover.dataset.moveLabel==='up'?from-1:from+1;
        if(to>=0&&to<draft.labels.length){
          [draft.labels[from],draft.labels[to]]=[draft.labels[to],draft.labels[from]];
          draft.positionPacks ||= []; [draft.positionPacks[from],draft.positionPacks[to]]=[draft.positionPacks[to],draft.positionPacks[from]];
          draft.positionSettings ||= []; [draft.positionSettings[from],draft.positionSettings[to]]=[draft.positionSettings[to],draft.positionSettings[from]];
          markQuestionEditCustom(drawer,draft);renderOptions(root);
        }
        return;
      }
      const button=event.target.closest('[data-remove-label]');
      if (!button) return;
      const index=Number(button.dataset.removeLabel);
      draft.labels.splice(index,1);
      draft.positionPacks?.splice?.(index,1);
      draft.positionSettings?.splice?.(index,1);
      markQuestionEditCustom(drawer,draft); renderOptions(root);
    });
    const selectedQuestionIndexes=()=>Array.from(drawer.querySelectorAll('[data-question-select]:checked')).map(box=>Number(box.dataset.questionSelect)).filter(Number.isInteger).sort((a,b)=>a-b);
    const controller={
      status:drawer.querySelector('#relphiQuestionControllerStatus'),
      pack:drawer.querySelector('#relphiQuestionControllerPack'),
      cards:drawer.querySelector('#relphiQuestionControllerCards'),
      link:drawer.querySelector('#relphiQuestionControllerLink'),
      reversals:drawer.querySelector('#relphiQuestionControllerReversals'),
      repeats:drawer.querySelector('#relphiQuestionControllerRepeats')
    };
    const ensureQuestionSettings=index=>{
      draft.positionSettings ||= [];
      const prior=normalizedBespokeQuestionSettings(draft,index);
      draft.positionSettings[index]={...prior};
      draft.positionPacks ||= [];
      draft.positionPacks[index]=prior.pack;
      return draft.positionSettings[index];
    };
    const syncQuestionController=()=>{
      const selected=selectedQuestionIndexes();
      const up=drawer.querySelector('#relphiMoveQuestionsUp'),down=drawer.querySelector('#relphiMoveQuestionsDown'),del=drawer.querySelector('#relphiDeleteQuestions'),all=drawer.querySelector('#relphiSelectAllQuestions');
      const any=selected.length>0,allSelected=selected.length===draft.labels.length&&draft.labels.length>0;
      if(up)up.disabled=!any||allSelected||selected[0]===0;
      if(down)down.disabled=!any||allSelected||selected[selected.length-1]===draft.labels.length-1;
      if(del)del.disabled=!any;
      if(all){all.checked=allSelected;all.indeterminate=any&&!allSelected}
      Object.values(controller).forEach(node=>{if(node&&'disabled' in node)node.disabled=!any});
      if(controller.status)controller.status.textContent=!any?'Select one or more questions.':selected.length===1?'Editing Question '+(selected[0]+1):'Editing '+selected.length+' questions';
      if(!any){
        if(controller.pack)controller.pack.innerHTML='<option value="">Select questions</option>';
        if(controller.cards)controller.cards.value='';
        if(controller.link)controller.link.innerHTML='<option value="">Select questions</option>';
        if(controller.reversals){controller.reversals.checked=false;controller.reversals.indeterminate=false}
        if(controller.repeats){controller.repeats.checked=false;controller.repeats.indeterminate=false}
        return;
      }
      const settings=selected.map(ensureQuestionSettings);
      const pack=mixedValue(settings.map(item=>item.pack));
      if(controller.pack){
        controller.pack.innerHTML=(pack==='__mixed__'?'<option value="__mixed__" selected>Mixed — choose to change</option>':'')+packOptions(pack==='__mixed__'?'':pack);
        if(pack!=='__mixed__')controller.pack.value=pack;
      }
      const cards=mixedValue(settings.map(item=>item.cardCount));
      if(controller.cards)controller.cards.value=cards==='__mixed__'?'':cards;
      const links=mixedValue(settings.map(item=>item.linkTo));
      if(controller.link){
        controller.link.innerHTML=(links==='__mixed__'?'<option value="__mixed__" selected>Mixed — choose to change</option>':'<option value="">No link</option>')+
          draft.labels.map((label,index)=>selected.includes(index)?'':`<option value="${index}">Question ${index+1}</option>`).join('');
        if(links!=='__mixed__')controller.link.value=links;
      }
      const reversalValues=settings.map(item=>item.reversals!==false);
      if(controller.reversals){controller.reversals.checked=reversalValues.every(Boolean);controller.reversals.indeterminate=!reversalValues.every(Boolean)&&reversalValues.some(Boolean)}
      const repeatValues=settings.map(item=>!!item.repeats);
      if(controller.repeats){controller.repeats.checked=repeatValues.every(Boolean);controller.repeats.indeterminate=!repeatValues.every(Boolean)&&repeatValues.some(Boolean)}
    };
    const applyToSelected=(patch)=>{
      const selected=selectedQuestionIndexes();
      if(!selected.length)return;
      selected.forEach(index=>{
        const prior=ensureQuestionSettings(index);
        draft.positionSettings[index]={...prior,...patch};
        if(patch.pack){draft.positionPacks[index]=patch.pack;draft.pack='question-by-question'}
      });
      markQuestionEditCustom(drawer,draft);
      syncQuestionController();
    };
    drawer.querySelector('#relphiSelectAllQuestions')?.addEventListener('change',event=>{drawer.querySelectorAll('[data-question-select]').forEach(box=>{box.checked=event.target.checked});syncQuestionController()});
    drawer.querySelectorAll('[data-question-select]').forEach(box=>box.addEventListener('change',syncQuestionController));
    controller.pack?.addEventListener('change',()=>{if(controller.pack.value&&controller.pack.value!=='__mixed__')applyToSelected({pack:controller.pack.value})});
    controller.cards?.addEventListener('change',()=>{
      const value=Math.max(1,Math.min(12,Math.trunc(Number(controller.cards.value)||1)));
      controller.cards.value=String(value);
      applyToSelected({cardCount:value});
    });
    controller.link?.addEventListener('change',()=>{if(controller.link.value!=='__mixed__')applyToSelected({linkTo:controller.link.value})});
    controller.reversals?.addEventListener('change',()=>{controller.reversals.indeterminate=false;applyToSelected({reversals:controller.reversals.checked})});
    controller.repeats?.addEventListener('change',()=>{controller.repeats.indeterminate=false;applyToSelected({repeats:controller.repeats.checked})});
    drawer.querySelector('#relphiCopyBespokeQuestions')?.addEventListener('click',async event=>{
      const button=event.currentTarget;
      const text=bespokeQuestionsClipboardText(draft);
      const ok=await writeDrawingBoardClipboard(text);
      button.textContent=ok?'Copied':'Copy failed';
      button.setAttribute('aria-label',ok?'Bespoke questions copied':'Copy Bespoke questions failed');
      window.setTimeout(()=>{
        if(!button.isConnected)return;
        button.textContent='Copy';
        button.setAttribute('aria-label','Copy all Bespoke questions and advanced settings');
      },1200);
    });
    drawer.querySelector('[data-create-subpack]')?.addEventListener('click',()=>window.RelphiCustomSubpacks?.open?.({
      onSave:pack=>{
        const scope='custom:'+pack.id;
        applyToSelected({pack:scope});
        renderOptions(root);
      }
    }));
    syncQuestionController();
    const moveSelectedQuestions=direction=>{const selected=selectedQuestionIndexes();if(!selected.length)return;const order=Array.from({length:draft.labels.length},(_,i)=>i);if(direction<0){for(const i of selected){const p=order.indexOf(i);if(p>0&&!selected.includes(order[p-1]))[order[p-1],order[p]]=[order[p],order[p-1]]}}else{for(const i of selected.slice().reverse()){const p=order.indexOf(i);if(p<order.length-1&&!selected.includes(order[p+1]))[order[p],order[p+1]]=[order[p+1],order[p]]}}draft.labels=order.map(i=>draft.labels[i]);draft.positionPacks=(draft.positionPacks||[]).length?order.map(i=>draft.positionPacks[i]):[];draft.positionSettings=(draft.positionSettings||[]).length?order.map(i=>draft.positionSettings[i]):[];markQuestionEditCustom(drawer,draft);renderOptions(root)};
    drawer.querySelector('#relphiMoveQuestionsUp')?.addEventListener('click',()=>moveSelectedQuestions(-1));
    drawer.querySelector('#relphiMoveQuestionsDown')?.addEventListener('click',()=>moveSelectedQuestions(1));
    drawer.querySelector('#relphiDeleteQuestions')?.addEventListener('click',()=>{const selected=new Set(selectedQuestionIndexes());if(!selected.size)return;draft.labels=draft.labels.filter((_,i)=>!selected.has(i));draft.positionPacks=(draft.positionPacks||[]).filter((_,i)=>!selected.has(i));draft.positionSettings=(draft.positionSettings||[]).filter((_,i)=>!selected.has(i));if(!draft.labels.length)draft.labels=[''];markQuestionEditCustom(drawer,draft);renderOptions(root)});
    drawer.querySelector('#relphiAddPosition')?.addEventListener('click',()=>{
      if (draft.labels.length>=MAX_POSITIONS) return;
      const previous=draft.positionSettings?.[draft.positionSettings.length-1] || {pack:draft.pack||'full',reversals:draft.reversals!==false,repeats:!!draft.repeats,cardCount:1,linkTo:''};
      draft.labels.push(''); draft.positionPacks?.push?.(previous.pack||'full'); draft.positionSettings ||= []; draft.positionSettings.push({...previous}); markQuestionEditCustom(drawer,draft); renderOptions(root);
    });
    drawer.querySelector('#relphiTemplateName')?.addEventListener('input',event=>{draft.templateName=event.target.value.slice(0,60);event.target.classList.toggle('is-unnamed',draft.templateName==='Unnamed Template');});
    drawer.querySelector('#relphiSaveTemplate')?.addEventListener('click',()=>saveDraftTemplate(root));

    drawer.querySelectorAll('[data-building-key]').forEach(select=>select.addEventListener('change',()=>{
      session.building ||= {};
      session.building[select.dataset.buildingKey]=select.value;
    }));
    drawer.querySelector('#relphiBuildQuestions')?.addEventListener('click',()=>{
      session.suggestions=candidateQuestionsFromBlocks(session.building);
      const b=session.building||{};
      const needOnly=!!b.need && !b.element && !b.planet && !b.aspect && !b.sign && !Number(b.house||0) && !b.mode;
      if(needOnly && REFERENT_NEED_QUESTIONS[b.need]){
        session.suggestionPacks=REFERENT_NEED_QUESTIONS[b.need].map(item=>item.pack);
      }else{
        const suggestedPack=b.need?'uhn':b.planet?'planetary-majors':b.sign?'zodiac-majors':b.element?'full':'full';
        session.suggestionPacks=session.suggestions.map(()=>suggestedPack);
      }
      renderOptions(root);
    });

    const surfaceChoiceInputs=Array.from(drawer.querySelectorAll('[data-surface-choice]'));
    const surfaceSelectAll=drawer.querySelector('[data-surface-select-all]');
    const surfaceSelectAllBottom=drawer.querySelector('[data-surface-select-all-bottom]');
    const surfaceReadiness=drawer.querySelector('[data-surface-readiness]');
    drawer.querySelectorAll('[data-sacred-card-source]').forEach(input=>input.addEventListener('change',()=>{
      if(input.checked)session.sacredCardSource=input.value==='physical'?'physical':'digital';
      const sourceStatus=drawer.querySelector('[data-surface-source-status]');
      if(sourceStatus)sourceStatus.textContent=session.sacredCardSource==='physical'?'Physical':'Digital';
    }));
    const syncSurfaceSelectionUi=()=>{
      const count=selectedSurfaceKinds(session).length;
      if(surfaceSelectAll){
        surfaceSelectAll.checked=count===SURFACE_DRAW_KEYS.length;
        surfaceSelectAll.indeterminate=count>0&&count<SURFACE_DRAW_KEYS.length;
      }
      if(surfaceReadiness){
        const ready=count>0;
        surfaceReadiness.classList.toggle('is-ready',ready);
        surfaceReadiness.querySelector('[data-readiness-step="questions"]')?.classList.toggle('is-complete',ready);
        const readyStep=surfaceReadiness.querySelector('[data-readiness-step="ready"]');
        readyStep?.classList.toggle('is-complete',ready);
        readyStep?.classList.toggle('is-success',ready);
        const questionStatus=surfaceReadiness.querySelector('[data-surface-question-status]');
        const readyStatus=surfaceReadiness.querySelector('[data-surface-ready-status]');
        const title=surfaceReadiness.querySelector('[data-surface-readiness-title]');
        const detail=surfaceReadiness.querySelector('[data-surface-readiness-detail]');
        const selectAllBottom=surfaceReadiness.querySelector('[data-surface-select-all-bottom]');
        if(questionStatus)questionStatus.textContent=ready?count+' selected':'Choose 1+';
        if(readyStatus)readyStatus.textContent=ready?'Minimum met':'Waiting';
        if(title)title.textContent=ready?'✓ Ready to begin':'↑ Choose at least one question above';
        if(detail)detail.textContent=ready?(count+' question'+(count===1?'':'s')+' selected · minimum met'):'One question is enough to craft the reading.';
        if(selectAllBottom)selectAllBottom.hidden=ready;
      }
      const start=drawer.querySelector('#relphiApplyOptions');
      if(start&&session.path==='surface')start.disabled=!count;
    };
    surfaceChoiceInputs.forEach(input=>input.addEventListener('change',()=>{
      session.surfaceSelected ||= {};
      session.surfaceSelected[input.dataset.surfaceChoice]=input.checked;
      syncSurfaceSelectionUi();
    }));
    const setAllSurfaceChoices=checked=>{
      session.surfaceSelected ||= {};
      SURFACE_DRAW_KEYS.forEach(kind=>{session.surfaceSelected[kind]=!!checked;});
      surfaceChoiceInputs.forEach(input=>{input.checked=!!checked;});
      if(surfaceSelectAll){
        surfaceSelectAll.checked=!!checked;
        surfaceSelectAll.indeterminate=false;
      }
      syncSurfaceSelectionUi();
    };
    surfaceSelectAll?.addEventListener('change',()=>setAllSurfaceChoices(surfaceSelectAll.checked));
    surfaceSelectAllBottom?.addEventListener('click',()=>setAllSurfaceChoices(true));
    syncSurfaceSelectionUi();

    drawer.querySelectorAll('[data-suggestion-text]').forEach(input=>input.addEventListener('input',()=>{
      session.suggestions[Number(input.dataset.suggestionText)]=input.value;
    }));
    const commitSelectedSuggestions=()=>{
      const chosen=Array.from(drawer.querySelectorAll('[data-suggestion-use]')).filter(box=>box.checked).map(box=>{
        const index=Number(box.dataset.suggestionUse);
        return {text:String(session.suggestions[index]||'').trim(),pack:String(session.suggestionPacks?.[index]||'')};
      }).filter(item=>item.text).slice(0,MAX_POSITIONS);
      if (!chosen.length) return false;
      draft.labels=chosen.map(item=>item.text);
      draft.positionPacks=chosen.map(item=>item.pack);
      draft.templateId='';
      draft.basedOnTemplateId='';
      draft.templateName='';
      return true;
    };
    drawer.querySelector('#relphiAcceptSuggestions')?.addEventListener('click',()=>{
      if (!commitSelectedSuggestions()) return;
      session.suggestions=[];
      session.suggestionPacks=[];
      renderOptions(root);
    });

     drawer.querySelector('#relphiCancelOptions')?.addEventListener('click',()=>cancelBoardSettings(root));
    drawer.querySelector('#relphiApplyOptions')?.addEventListener('click',()=>{
      if (session.path==='surface' && !prepareSurfaceDraft(session)) return;
      if (session.path==='blocks' && session.suggestions.length) commitSelectedSuggestions();
      if(session.path==='astro'){
        const chosen=Array.from(drawer.querySelectorAll('[data-astrology-question]')).filter(box=>box.checked).map(box=>session.astrologyVisibleQuestions?.[Number(box.dataset.astrologyQuestion)]).filter(Boolean);
        const own=String(drawer.querySelector('[data-astrology-own-question]')?.value||session.astrologyOwnQuestion||'').trim();
        const ownPack=String(drawer.querySelector('[data-astrology-own-pack]')?.value||session.astrologyOwnPack||'');
        if(own&&!ownPack){showBoardToast('Choose a sub-pack for your authored question.',{title:'Astrological Tarot Reading',duration:4200});drawer.querySelector('[data-astrology-own-pack]')?.focus();return}
        if(own)chosen.push({text:own,pack:ownPack,source:'authored'});
        if(!chosen.length){showBoardToast('Select at least one suggested question or write your own.',{title:'Astrological Tarot Reading',duration:4200});return}
        const accepted=chosen.slice(0,MAX_POSITIONS);draft.labels=accepted.map(q=>q.text);draft.positionPacks=accepted.map(q=>q.pack||'full');draft.positionSettings=accepted.map(q=>({pack:q.pack||'full',reversals:draft.reversals!==false,repeats:!!draft.repeats,source:q.source||'suggested'}));draft.templateId='';draft.basedOnTemplateId='';draft.templateName='Astrological Tarot Reading';session.astrologyChosenQuestions=accepted.map(q=>({text:q.text,pack:q.pack||'full',source:q.source||'suggested'}));
      }
      applyOptions(root);
    });
  }

  function saveDraftTemplate(root) {
    if (!optionsSession) return;
    const draft=optionsSession.draft;
    const requested=String(draft.templateName || '').trim() || 'Unnamed Template';
    if (!draft.labels.length) return;
    const existing=readCustomTemplates();
    let name=requested;
    if(requested==='Unnamed Template'){
      const names=new Set(existing.map(item=>String(item.name||'')));
      let modifier=2;
      while(names.has(name)) name='Unnamed Template '+modifier++;
    }
    draft.templateName=name;
    const based=templateById(draft.templateId || draft.basedOnTemplateId);
    const positions=(based?.positions?.length===draft.labels.length ? clone(based.positions) : genericPositions(draft.labels));
    positions.forEach((item,index)=>{ item.label=draft.labels[index] || `Position ${index+1}`; item.drawOrder=index+1; });
    const id=`custom-${slug(name)}-${draft.labels.length}`;
    const custom={version:1,id,name,cardCount:draft.labels.length,source:'custom',editable:true,basedOn:based?.id||null,positions,rules:{allowReversals:draft.reversals,allowRepeats:draft.repeats,drawScope:(draft.pack==='question-by-question'?'full':draft.pack)}};
    const items=existing.filter(item=>item.id!==id);
    items.push(custom); writeCustomTemplates(items);
    draft.templateId=id;
    draft.basedOnTemplateId=id;
    renderOptions(root);
  }

  function resetBoardFromOptions(root) {
    return resetBoardGlobal(root);
  }

  function resetBoardGlobal(root = panel(), {openSettings=true} = {}) {
    if(!root)return false;
    openTool='';
    surfaceReadingSession=null;
    recursionSession=null;
    recursionPortalLevel=0;
    pendingFocusIndex=null;
    attuneIndex=-1;
    craftedReadingActive=false;
    optionsSession=null;
    document.querySelector('.relphi-surface-question-composer')?.remove();
    root.querySelector('.relphi-board-toast')?.remove();
    closeAttune();
    closeFocus({acknowledge:false,advanceSurface:false});

    settingsOpen=!!openSettings;
    settingsMode='free';
    boardSetupConfirmed=false;
    activeCraftedPath='';
    clearCraftedStructure(root);
    const defaults=blankDraft();
    applyDrawSettings(defaults);
    writeStickerVisibility(false);
    const bridge=optionsBridge();
    const resetSnapshot=bridge?.capture?.();
    if(bridge&&resetSnapshot){
      const background=boardBackgroundDefault();
      resetSnapshot.rowEnvelopeColor='#f3f0ea';
      resetSnapshot.rowEnvelopeImage='';
      resetSnapshot.rowEnvelopeArt={};
      resetSnapshot.customCardArt={};
      resetSnapshot.rowTableColor=String(background.color||'#7d1f28');
      resetSnapshot.rowTableImage=background.mode==='image'?String(background.image||''):'';
      resetSnapshot.rowSnapEnabled=true;
      resetSnapshot.rowSnapGrid='one-eighth';
      resetSnapshot.rowRotationSnapEnabled=true;
      resetSnapshot.rowRotationSnapDegrees=15;
      resetSnapshot.rowEnvelopeLayout={};
      resetSnapshot.rowCardTransforms={};
      bridge.restore(resetSnapshot);
    }

    const trigger=document.getElementById('relphiOpenDrawingBoardCurrent');
    if(trigger){
      trigger.textContent='Close Drawing Board';
      trigger.setAttribute('aria-expanded','true');
    }
    boardOpen=true;
    root.hidden=false;
    root.removeAttribute('hidden');
    const nativeDrawer=root.querySelector('.card-row-drawing-board');
    if(nativeDrawer)nativeDrawer.open=true;

    setBoardMode(root,'board');
    if(openSettings){
      settingsOpen=true;
      freeSettingsSession={draft:freeSettingsDraftFromState()};
      settingsBaseline={
        snapshot:clone(currentSnapshot()||{}),
        stickers:false,
        craftedReadingActive:false,
        surfaceReadingSession:null,
        recursionSession:null,
        recursionPortalLevel:0
      };
      ensureBoardChrome(root);
      renderBoardSettings(root);
    }else{
      settingsOpen=false;
      boardConfigurationOpen=false;
      optionsSession=null;
      freeSettingsSession=null;
      settingsBaseline=null;
      root.querySelector('.relphi-reading-options-drawer')?.remove();
      root.querySelector('.relphi-free-settings')?.remove();
      ensureBoardChrome(root);
      syncZoomToolbarVisibility(root);
      enhance(root);
    }
    return true;
  }

  function boardHasCraftedStructure(root = panel()) {
    const snap=currentSnapshot()||{},state=currentPrefabState()||{};
    return !!(
      state.activeLayout?.id ||
      snap.rowActiveLayout?.id ||
      (Array.isArray(snap.shortListPositionLabels)&&snap.shortListPositionLabels.some(label=>String(label||'').trim())) ||
      (Array.isArray(snap.rowPositionMeta)&&snap.rowPositionMeta.length)
    );
  }
  function clearCraftedStructure(root = panel()) {
    const bridge=optionsBridge();if(!bridge)return false;
    const snap=bridge.capture();if(!snap)return false;
    Object.assign(snap,{
      shortList:[],shortListSelection:[],shortListPositionLabels:[],shortListPositionCardIds:[],
      rowEnvelopeLayout:{},rowCardTransforms:{},rowPositionMeta:[],rowActiveLayout:null,
      rowLayoutLocked:false,rowLayoutDesignMode:false,rowCardReversals:{},rowCardManual:[],
      rowDrawDeck:[],rowDrawDeckSignature:'',shortListName:'',shortListNotes:'',
      rowDrawScope:'full',rowTagQuery:'',rowSelectedTags:[],rowTagMatchMode:'any',
      rowAllowRepeats:false,rowAllowReversals:true,rowZoom:1,rowPanX:0,rowPanY:0,rowTransformTarget:0,
      cardRowBoardOpen:true
    });
    bridge.restore(snap);
    surfaceReadingSession=null;recursionSession=null;recursionPortalLevel=0;
    pendingFocusIndex=null;attuneIndex=-1;
    activeCraftedPath='';
    removeSacredResumeGate(root);
    sacredResumeGateHandled=false;
    syncZoomToolbarVisibility(root);
    return true;
  }
  function setBoardMode(root = panel(), mode = 'board') {
    if (!root) return;
    const configuring=mode==='referents',crafted=configuring||mode==='crafted';
    root.classList.toggle('relphi-referents-mode',configuring);
    const boardTab=root.querySelector('#drawingBoardBoardTab');
    const referentsTab=root.querySelector('#drawingBoardOptionsButton');
    if (boardTab) {
      boardTab.classList.toggle('is-active',!crafted);
      boardTab.setAttribute('aria-checked',String(!crafted));
    }
    if (referentsTab) {
      referentsTab.classList.toggle('is-active',crafted);
      referentsTab.setAttribute('aria-checked',String(crafted));
      referentsTab.setAttribute('aria-expanded',String(configuring));
    }
  }
  function closeOptions(root = panel()) {
    cancelBoardSettings(root);
  }
  function openOptions(root = panel()) {
    if(!root)return;
    if(!settingsOpen){
      settingsOpen=true;
      ensureSettingsTransaction(root);
    }
    settingsMode='crafted';
    if(!optionsSession)beginOptionsSession();
    renderBoardSettings(root);
  }

  function expandBespokeDraftForLaunch(draft) {
    const source=clone(draft);
    const labels=Array.isArray(source.labels)?source.labels:[];
    const entries=labels.map((label,index)=>{
      const settings=normalizedBespokeQuestionSettings(source,index);
      const linkedIndex=settings.linkTo===''||settings.linkTo==null?null:Number(settings.linkTo);
      const linked=Number.isInteger(linkedIndex)&&linkedIndex>=0&&linkedIndex<labels.length&&linkedIndex!==index;
      return {
        index,
        text:String(label||'').trim() || 'Question '+(index+1),
        settings,
        linkedIndex:linked?linkedIndex:null,
        count:linked?1:Math.max(1,Math.min(12,Math.trunc(Number(settings.cardCount)||1)))
      };
    });
    const starts=[];
    let total=0;
    entries.forEach(entry=>{starts[entry.index]=total;total+=entry.count;});
    if(total>MAX_POSITIONS)return {draft:null,total};

    const next={...source,labels:[],positionPacks:[],positionSettings:[]};
    entries.forEach(entry=>{
      const linkedStart=entry.linkedIndex==null?null:starts[entry.linkedIndex];
      for(let offset=0;offset<entry.count;offset++){
        next.labels.push(entry.count>1?entry.text+' · Card '+(offset+1)+' of '+entry.count:entry.text);
        next.positionPacks.push(entry.settings.pack||'full');
        next.positionSettings.push({
          ...entry.settings,
          cardCount:1,
          linkTo:Number.isInteger(linkedStart)?String(linkedStart):'',
          questionText:entry.text,
          questionIndex:entry.index,
          questionCardIndex:offset,
          questionCardCount:entry.count
        });
      }
    });
    if(next.positionPacks.some((pack,index)=>pack!==next.positionPacks[0]))next.pack='question-by-question';
    return {draft:next,total};
  }

  function draftPrefab(draft) {
    const based=templateById(draft.templateId || draft.basedOnTemplateId);
    if(draft.templateId && based){
      const canonical=clone(based);
      canonical.rules={
        ...(canonical.rules||{}),
        allowReversals:draft.reversals,
        allowRepeats:draft.repeats,
        drawScope:draft.pack||canonical.rules?.drawScope||'full'
      };
      return canonical;
    }
    const labels=draft.labels.slice(0,MAX_POSITIONS).map((value,index)=>String(value || `Position ${index+1}`).trim());
    const positionPacks=(draft.positionPacks||[]).slice(0,labels.length).map(value=>String(value||''));
    if (based && based.positions.length===labels.length) {
      const next=clone(based);
      next.positions.forEach((item,index)=>{const ps=draft.positionSettings?.[index]||{};item.label=labels[index];item.drawOrder=index+1;item.drawScope=positionPacks[index]||ps.pack||item.drawScope||'';item.allowReversals=ps.reversals ?? draft.reversals;item.allowRepeats=ps.repeats ?? draft.repeats;item.cardCount=Math.max(1,Number(ps.cardCount)||1);item.linkTo=String(ps.linkTo??'');item.questionText=String(ps.questionText||labels[index]||'');item.questionIndex=Number.isInteger(ps.questionIndex)?ps.questionIndex:index;item.questionCardIndex=Math.max(0,Number(ps.questionCardIndex)||0);item.questionCardCount=Math.max(1,Number(ps.questionCardCount)||1);});
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
    const positions=genericPositions(labels);
    positions.forEach((item,index)=>{const ps=draft.positionSettings?.[index]||{};item.drawScope=positionPacks[index]||ps.pack||'';item.allowReversals=ps.reversals ?? draft.reversals;item.allowRepeats=ps.repeats ?? draft.repeats;item.cardCount=Math.max(1,Number(ps.cardCount)||1);item.linkTo=String(ps.linkTo??'');item.questionText=String(ps.questionText||labels[index]||'');item.questionIndex=Number.isInteger(ps.questionIndex)?ps.questionIndex:index;item.questionCardIndex=Math.max(0,Number(ps.questionCardIndex)||0);item.questionCardCount=Math.max(1,Number(ps.questionCardCount)||1);});
    return {version:1,id:'custom-active',name:draft.templateName || 'Custom',cardCount:labels.length,source:'custom',editable:true,basedOn:based?.id||null,positions,rules:{allowReversals:draft.reversals,allowRepeats:draft.repeats,drawScope:draft.pack}};
  }

  function applyDrawSettings(draft) {
    const bridge=optionsBridge(); if (!bridge) return;
    const snap=bridge.capture();
    snap.rowDrawScope=draft.pack;
    snap.rowSelectedTags=draft.pack==='tags' ? (draft.keywordTags||[]).slice() : [];
    snap.rowTagMatchMode=draft.keywordMatchMode==='all' ? 'all' : 'any';
    snap.rowAllowRepeats=!!draft.repeats;
    snap.rowAllowReversals=!!draft.reversals;
    snap.rowDrawDeck=[];
    snap.rowDrawDeckSignature='';
    bridge.restore(snap);
  }
  function showBoardToast(message,{title='Reading ready',duration=7600,actionLabel='',onAction=null}={}) {
    const root=panel();
    if (!root || !message) return;
    root.querySelector('.relphi-board-toast')?.remove();
    const toast=document.createElement('aside');
    toast.className='relphi-board-toast';
    toast.setAttribute('role','status');
    toast.innerHTML='<button type="button" class="relphi-board-toast-close" aria-label="Dismiss">×</button><span class="eyebrow">'+escapeHtml(title)+'</span><p>'+escapeHtml(message)+'</p>'+(actionLabel?'<button type="button" class="relphi-board-toast-action">'+escapeHtml(actionLabel)+'</button>':'');
    root.appendChild(toast);
    const remove=()=>toast.remove();
    toast.querySelector('.relphi-board-toast-close')?.addEventListener('click',remove);
    toast.querySelector('.relphi-board-toast-action')?.addEventListener('click',()=>{
      remove();
      if (typeof onAction==='function') onAction();
    });
    if (duration>0) setTimeout(()=>{ if (toast.isConnected) remove(); },duration);
  }

  function recursionLayout() {
    const layout=currentPrefabState().activeLayout || {};
    return layout.id===RECURSION_ID || layout.basedOn===RECURSION_ID ? layout : null;
  }
  function recursionActive() { return !!recursionLayout(); }
  function recursionPositionAt(index) {
    const snap=currentSnapshot() || {};
    return snap.rowActiveLayout?.positions?.[index] || recursionLayout()?.positions?.[index] || null;
  }
  function recursionLevelForIndex(index) {
    return Number(recursionPositionAt(index)?.recursionLevel) || 0;
  }
  function recursionElementForIndex(index) {
    return String(recursionPositionAt(index)?.recursionElement || '');
  }
  function recursionIndicesForLevel(level) {
    const layout=recursionLayout();
    if (!layout?.positions?.length) return [];
    return layout.positions
      .map((item,index)=>({item,index}))
      .filter(entry=>Number(entry.item?.recursionLevel)===Number(level))
      .sort((a,b)=>(Number(a.item?.drawOrder)||0)-(Number(b.item?.drawOrder)||0))
      .map(entry=>entry.index);
  }
  function recursionTriadIndices(level) {
    return recursionIndicesForLevel(level).filter(index=>recursionElementForIndex(index)!=='earth');
  }
  function recursionEarthIndex() {
    const layout=recursionLayout();
    return layout?.positions?.findIndex?.(item=>item?.recursionElement==='earth') ?? -1;
  }
  function ensureRecursionSession() {
    if (!recursionActive()) { recursionSession=null; recursionPortalLevel=0; return null; }
    if (!recursionSession) {
      let deepest=1;
      for (let level=1;level<=RECURSION_LEVELS;level++) {
        if (recursionIndicesForLevel(level).some(index=>!!cardAt(index))) deepest=level;
      }
      recursionSession={level:deepest,maxLevel:deepest,complete:recursionEarthIndex()>=0 && !!cardAt(recursionEarthIndex())};
    }
    recursionSession.level=clamp(recursionSession.level,1,RECURSION_LEVELS);
    recursionSession.maxLevel=clamp(Math.max(recursionSession.maxLevel||1,recursionSession.level),1,RECURSION_LEVELS);
    recursionSession.complete=recursionEarthIndex()>=0 && !!cardAt(recursionEarthIndex());
    return recursionSession;
  }
  function recursionTriadComplete(level) {
    const triad=recursionTriadIndices(level);
    return triad.length===3 && triad.every(index=>!!cardAt(index));
  }
  function recursionLevelComplete(level) {
    const indices=recursionIndicesForLevel(level);
    return !!indices.length && indices.every(index=>!!cardAt(index));
  }
  function recursionNextCardIndex(level) {
    return recursionIndicesForLevel(level).find(index=>!cardAt(index)) ?? null;
  }
  function recursionGlyphForIndex(index) {
    const item=recursionPositionAt(index);
    return String(item?.recursionGlyph || ({mem:'מ',aleph:'א',shin:'ש',earth:'🜃'}[item?.recursionElement]||''));
  }
  function recursionNameForIndex(index) {
    return ({mem:'Mem',aleph:'Aleph',shin:'Shin',earth:'Earth'}[recursionElementForIndex(index)] || positionLabel(index));
  }
  function recursionLevelLabel(level) { return 'Level '+Number(level); }
  function setRecursionLevel(level,{fit=true}={}) {
    const session=ensureRecursionSession();
    const next=clamp(level,1,session?.maxLevel||1);
    if (!session || next>session.maxLevel) return false;
    session.level=next;
    recursionPortalLevel=0;
    installRecursionBoard(panel());
    if (fit) setTimeout(zoomExtents,0);
    return true;
  }
  function recursionDepthMarkup(session,compact=false) {
    if (!session) return '';
    const buttons=Array.from({length:RECURSION_LEVELS},(_,index)=>{
      const level=index+1;
      const opened=level<=session.maxLevel;
      const current=level===session.level;
      const body=RECURSION_VEILVA_BODIES[index];
      const name=body.charAt(0).toUpperCase()+body.slice(1);
      return '<button type="button" data-recursion-depth="'+level+'" '+(opened?'':'disabled ')+'class="'+(current?'is-current ':'')+(opened?'is-opened':'is-future')+'" aria-label="Level '+level+' · '+name+'" title="Level '+level+' · '+name+'"><svg class="relphi-veilva-glyph" data-relphi-veilva-glyph="'+body+'" viewBox="-14 -14 28 28" aria-hidden="true"></svg></button>';
    }).join('');
    return '<span class="relphi-recursion-depth-line" aria-hidden="true"></span>'+buttons+
      (session.complete?'<strong class="relphi-recursion-complete-mark">22 / 22 · complete</strong>':'');
  }
  function hydrateVeilvaGlyphs(root,attempt=0) {
    if (!root?.querySelectorAll) return;
    const registry=window.RelphiGlyphRegistry;
    const component=window.RelphiGlyphComponent;
    if (!registry || !component?.draw) {
      if (attempt<40) setTimeout(()=>hydrateVeilvaGlyphs(root,attempt+1),50);
      return;
    }
    root.querySelectorAll('[data-relphi-veilva-glyph]').forEach(host=>{
      if (host.dataset.relphiCanonicalGlyph==='true') return;
      const identity=String(host.dataset.relphiVeilvaGlyph||'');
      const entry=registry.get?.(identity) || registry.resolve?.(identity);
      if (!entry) return;
      host.replaceChildren();
      host.dataset.relphiCanonicalGlyph='true';
      Promise.resolve(component.draw(host,entry.id,{radius:10.5,padding:.75,color:'currentColor'})).catch(()=>{
        delete host.dataset.relphiCanonicalGlyph;
      });
    });
  }
  function installRecursionBoard(root=panel()) {
    if (!root) return;
    const workspace=root.querySelector('.card-row-workspace');
    const board=root.querySelector('.card-row-board');
    const session=ensureRecursionSession();
    root.classList.toggle('relphi-recursion-reading',!!session);
    const nextIndex=session ? recursionNextCardIndex(session.level) : null;
    root.querySelectorAll('.card-row-board>.card-row-item[data-row-index]').forEach(item=>{
      const index=Number(item.dataset.rowIndex);
      const level=session ? recursionLevelForIndex(index) : 0;
      const element=session ? recursionElementForIndex(index) : '';
      const drawn=!!cardAt(index);
      const activeLevel=!!session && level===session.level;
      if (level) item.dataset.relphiRecursionLevel=String(level); else delete item.dataset.relphiRecursionLevel;
      if (element) item.dataset.relphiRecursionElement=element; else delete item.dataset.relphiRecursionElement;
      item.classList.toggle('is-recursion-level-active',activeLevel);
      item.classList.toggle('is-recursion-drawn',activeLevel && drawn);
      item.classList.toggle('is-recursion-current-position',activeLevel && !drawn && index===nextIndex);
      item.classList.toggle('is-recursion-waiting',activeLevel && !drawn && index!==nextIndex);
    });
    if (!workspace || !board) return;
    let depth=workspace.querySelector('.relphi-recursion-board-depth');
    let logo=board.querySelector(':scope > .relphi-recursion-logo-underlay');
    let states=board.querySelector(':scope > .relphi-recursion-circle-states');
    let portal=board.querySelector(':scope > .relphi-recursion-board-portal');
    if (!session) {
      depth?.remove(); logo?.remove(); states?.remove(); portal?.remove();
      syncRecursionZoomFloor(root);
      return;
    }
    if (!logo) {
      logo=document.createElement('img');
      logo.className='relphi-recursion-logo-underlay';
      logo.src='assets/relphi-logo-tight.svg';
      logo.alt='';
      logo.setAttribute('aria-hidden','true');
      board.prepend(logo);
    }
    if (!states) {
      states=document.createElement('div');
      states.className='relphi-recursion-circle-states';
      states.setAttribute('aria-hidden','true');
      states.innerHTML=RECURSION_TRIAD.map(item=>'<span class="relphi-recursion-state-circle" data-recursion-circle="'+item.key+'"></span>').join('');
      board.appendChild(states);
    }
    RECURSION_TRIAD.forEach(item=>{
      const circle=states.querySelector('[data-recursion-circle="'+item.key+'"]');
      const index=recursionTriadIndices(session.level).find(candidate=>recursionElementForIndex(candidate)===item.key);
      const drawn=Number.isInteger(index) && !!cardAt(index);
      const current=Number.isInteger(index) && index===nextIndex && !drawn;
      circle?.classList.toggle('is-current',current);
      circle?.classList.toggle('is-drawn',drawn);
      circle?.classList.toggle('is-waiting',!current && !drawn);
    });
    if (!depth) {
      depth=document.createElement('nav');
      depth.className='relphi-recursion-board-depth relphi-veilva';
      depth.setAttribute('aria-label','Veilva · recursion depth');
      workspace.appendChild(depth);
    }
    depth.innerHTML=recursionDepthMarkup(session,true);
    hydrateVeilvaGlyphs(depth);
    depth.querySelectorAll('[data-recursion-depth]').forEach(button=>button.addEventListener('click',()=>{
      setRecursionLevel(Number(button.dataset.recursionDepth));
    }));
    if (session.level<RECURSION_LEVELS) {
      if (!portal) {
        portal=document.createElement('button');
        portal.type='button';
        portal.className='relphi-recursion-board-portal';
        board.appendChild(portal);
      }
      const ready=recursionTriadComplete(session.level);
      portal.disabled=!ready;
      portal.classList.toggle('is-ready',ready);
      portal.classList.toggle('is-locked',!ready);
      portal.dataset.recursionPortal=String(session.level);
      portal.innerHTML='<span class="relphi-recursion-earth-glyph" aria-hidden="true">🜃</span><strong>Earth</strong><small>'+(ready?'Enter Level '+(session.level+1):'Mem · Aleph · Shin first')+'</small>';
      portal.onclick=()=>{
        if (!ready) return;
        const last=recursionTriadIndices(session.level).slice(-1)[0];
        if (Number.isInteger(last) && cardAt(last)) {
          openFocus(last);
          setTimeout(()=>openRecursionPortal(session.level),0);
        }
      };
    } else {
      const earthIndex=recursionEarthIndex();
      const earthItem=Number.isInteger(earthIndex) && earthIndex>=0 ? root.querySelector('.card-row-board>.card-row-item[data-row-index="'+earthIndex+'"]') : null;
      const earthDrawn=Number.isInteger(earthIndex) && earthIndex>=0 && !!cardAt(earthIndex);
      const ready=recursionTriadComplete(RECURSION_LEVELS) && !earthDrawn;
      earthItem?.classList.toggle('is-recursion-earth-ready',!!ready);
      if (earthDrawn) {
        portal?.remove();
      } else {
        if (!portal) {
          portal=document.createElement('button');
          portal.type='button';
          portal.className='relphi-recursion-board-portal';
          board.appendChild(portal);
        }
        portal.disabled=!ready;
        portal.classList.toggle('is-ready',ready);
        portal.classList.toggle('is-locked',!ready);
        portal.dataset.recursionPortal='7';
        portal.innerHTML='<span class="relphi-recursion-earth-glyph" aria-hidden="true">🜃</span><strong>Earth</strong><small>'+(ready?'Draw card 22':'Mem · Aleph · Shin first')+'</small>';
        portal.onclick=()=>{
          if (ready && Number.isInteger(earthIndex) && earthIndex>=0) openAttune(earthIndex);
        };
      }
    }
    if (workspace.dataset.relphiRecursionZoomFloorBound!=='true') {
      workspace.dataset.relphiRecursionZoomFloorBound='true';
      let lastRecursionViewportWidth=Math.round(window.innerWidth||document.documentElement.clientWidth||0);
      window.addEventListener('resize',()=>{
        const nextWidth=Math.round(window.innerWidth||document.documentElement.clientWidth||0);
        const widthChanged=Math.abs(nextWidth-lastRecursionViewportWidth)>2;
        lastRecursionViewportWidth=nextWidth;
        if(widthChanged)requestAnimationFrame(()=>syncRecursionZoomFloor(panel()));
      });
    }
    requestAnimationFrame(()=>syncRecursionZoomFloor(root));
  }
  function renderRecursionDepth(reader) {
    const session=ensureRecursionSession();
    const nav=reader?.querySelector('.relphi-recursion-depth');
    if (!nav || !session) return;
    nav.hidden=false;
    nav.innerHTML=recursionDepthMarkup(session,false);
    hydrateVeilvaGlyphs(nav);
    nav.querySelectorAll('[data-recursion-depth]').forEach(button=>button.addEventListener('click',()=>{
      const level=Number(button.dataset.recursionDepth);
      if (!setRecursionLevel(level)) return;
      const drawn=recursionIndicesForLevel(level).filter(index=>!!cardAt(index));
      if (drawn.length) openFocus(drawn[0]);
      else openAttune(recursionIndicesForLevel(level)[0]);
    }));
  }
  function renderRecursionFocusStrip(reader,index) {
    const session=ensureRecursionSession();
    const strip=reader?.querySelector('.relphi-focus-strip');
    if (!session || !strip) return;
    const level=recursionLevelForIndex(index) || recursionPortalLevel || session.level;
    if (level<=session.maxLevel) session.level=level;
    reader.classList.add('is-recursion-reading');
    const indices=recursionIndicesForLevel(level);
    strip.replaceChildren();
    indices.forEach(nativeIndex=>{
      const button=document.createElement('button');
      button.type='button';
      button.dataset.focusPosition=String(nativeIndex);
      button.className='relphi-recursion-focus-node';
      const current=nativeIndex===index && !recursionPortalLevel;
      button.classList.toggle('is-current',current);
      button.classList.toggle('is-empty',!cardAt(nativeIndex));
      button.classList.toggle('is-reversed',focusCardIsReversed(nativeIndex));
      const art=focusArtImage(cardAt(nativeIndex));
      if (art) {
        const img=art.cloneNode(true);
        img.removeAttribute('loading'); img.removeAttribute('decoding');
        button.appendChild(img);
      } else {
        const glyph=document.createElement('strong');
        glyph.textContent=recursionGlyphForIndex(nativeIndex);
        button.appendChild(glyph);
      }
      const label=document.createElement('span');
      label.textContent=recursionNameForIndex(nativeIndex);
      button.appendChild(label);
      button.title=positionLabel(nativeIndex);
      button.setAttribute('aria-label',positionLabel(nativeIndex)+(cardAt(nativeIndex)?'':' · draw this position'));
      button.addEventListener('click',()=>navigateFocusTo(nativeIndex));
      strip.appendChild(button);
    });
    if (level<RECURSION_LEVELS) {
      const portal=document.createElement('button');
      portal.type='button';
      portal.className='relphi-recursion-focus-node is-earth-portal'+(recursionPortalLevel===level?' is-current':'');
      portal.dataset.recursionPortal=String(level);
      portal.disabled=!recursionTriadComplete(level);
      portal.innerHTML='<strong>🜃</strong><span>Earth</span>';
      portal.setAttribute('aria-label','Level '+level+' · Earth · descend');
      portal.addEventListener('click',()=>openRecursionPortal(level));
      strip.appendChild(portal);
    }
    renderRecursionDepth(reader);
    installRecursionBoard(panel());
  }
  function openRecursionPortal(level) {
    const session=ensureRecursionSession();
    const reader=document.querySelector('.relphi-focus-reader');
    if (!session || !reader || level>=RECURSION_LEVELS || !recursionTriadComplete(level)) return false;
    session.level=level;
    recursionPortalLevel=level;
    focusIndex=-1;
    reader.classList.add('is-recursion-reading','is-recursion-portal');
    reader.removeAttribute('data-focus-index');
    reader.setAttribute('aria-label','Level '+level+' · Earth');
    const position=reader.querySelector('.relphi-focus-position');
    const reversedBadge=reader.querySelector('.relphi-focus-reversed-badge');
    if (position) position.textContent='Level '+level+' · Earth';
    if (reversedBadge) reversedBadge.hidden=true;
    const portal=reader.querySelector('.relphi-recursion-portal-focus');
    if (portal) {
      portal.hidden=false;
      portal.innerHTML='<span class="relphi-recursion-portal-ring" aria-hidden="true"><span>🜃</span></span><span class="eyebrow">Level '+level+' · Earth</span><h2>Descend</h2><p>Earth does not answer beside Mem, Aleph, and Shin. It opens the same threefold form one octave deeper.</p><button type="button" class="primary" data-recursion-descend>Enter Level '+(level+1)+'</button>';
      portal.querySelector('[data-recursion-descend]')?.addEventListener('click',()=>descendRecursion(level));
    }
    renderRecursionFocusStrip(reader,-1);
    const next=reader.querySelector('.relphi-focus-next');
    if (next) next.disabled=true;
    return true;
  }
  function descendRecursion(level) {
    const session=ensureRecursionSession();
    if (!session || level>=RECURSION_LEVELS || !recursionTriadComplete(level)) return false;
    const nextLevel=level+1;
    session.maxLevel=Math.max(session.maxLevel,nextLevel);
    session.level=nextLevel;
    recursionPortalLevel=0;
    installRecursionBoard(panel());
    setTimeout(zoomExtents,0);
    const first=recursionIndicesForLevel(nextLevel)[0];
    if (Number.isInteger(first)) openAttune(first);
    return true;
  }
  function navigateRecursionFocusBy(delta) {
    const session=ensureRecursionSession();
    if (!session) return false;
    if (recursionPortalLevel) {
      if (delta<0) {
        const last=recursionTriadIndices(recursionPortalLevel).slice(-1)[0];
        if (Number.isInteger(last)) openFocus(last);
      }
      return true;
    }
    const level=recursionLevelForIndex(focusIndex) || session.level;
    const order=recursionIndicesForLevel(level);
    const current=order.indexOf(focusIndex);
    if (current<0) return true;
    if (delta<0) {
      if (current>0) navigateFocusTo(order[current-1]);
      else if (level>1 && level<=session.maxLevel) {
        session.level=level-1;
        const previous=recursionIndicesForLevel(level-1);
        const target=previous.filter(index=>!!cardAt(index)).slice(-1)[0];
        if (Number.isInteger(target)) openFocus(target);
      }
      return true;
    }
    if (current<order.length-1) {
      navigateFocusTo(order[current+1]);
      return true;
    }
    if (level<RECURSION_LEVELS) openRecursionPortal(level);
    return true;
  }

  function surfaceGuidance() {
    return 'Attune to each referent before revealing its card. Draw randomly from the assigned pack or search for the physical card you drew. After the initial exploration, new questions are created from what surfaced.';
  }
  function cardDataAt(index) {
    const id=String(cardAt(index)?.dataset?.rowCard || '');
    return (Array.isArray(window.RELPHI_TAROT_CARDS)?window.RELPHI_TAROT_CARDS:[]).find(card=>card?.card_id===id) || null;
  }
  function lockAttuneViewport() {
    if (attuneViewportLock) return;
    const body=document.body;
    const scrollX=window.scrollX || window.pageXOffset || 0;
    const scrollY=window.scrollY || window.pageYOffset || 0;
    attuneViewportLock={
      scrollX,scrollY,
      position:body.style.position,
      top:body.style.top,
      left:body.style.left,
      right:body.style.right,
      width:body.style.width
    };
    body.style.position='fixed';
    body.style.top=(-scrollY)+'px';
    body.style.left=(-scrollX)+'px';
    body.style.right='0';
    body.style.width='100%';
    body.classList.add('relphi-attune-open');
  }
  function unlockAttuneViewport() {
    const lock=attuneViewportLock;
    const body=document.body;
    body.classList.remove('relphi-attune-open');
    if (!lock) return;
    body.style.position=lock.position;
    body.style.top=lock.top;
    body.style.left=lock.left;
    body.style.right=lock.right;
    body.style.width=lock.width;
    attuneViewportLock=null;
    window.scrollTo(lock.scrollX,lock.scrollY);
  }
  function closeAttune() {
    document.querySelector('.relphi-attune-reader')?.remove();
    unlockAttuneViewport();
    attuneIndex=-1;
  }
  function setRecordedCardOrientation(index,reversed) {
    const bridge=optionsBridge();
    const snap=bridge?.capture?.();
    if(!bridge||!snap||!Number.isInteger(index)||index<0)return false;
    snap.rowCardReversals={...(snap.rowCardReversals||{}),[index]:!!reversed};
    bridge.restore(snap);
    return true;
  }

  function sacredCardSourceAt(index,snap=currentSnapshot()||{}) {
    const meta=snap.rowPositionMeta?.[index] || snap.rowActiveLayout?.positions?.[index] || {};
    const source=surfaceReadingSession?.cardSource || meta.cardSource || 'digital';
    return source==='physical'?'physical':'digital';
  }

  function renderAttuneSearch(reader, query) {
    const results=reader.querySelector('.relphi-attune-search-results');
    const confirm=reader.querySelector('[data-attune-confirm]');
    if (!results) return;
    reader.dataset.attuneSelectedCard='';
    if(confirm){confirm.disabled=true;confirm.textContent='Confirm';}
    const q=String(query||'').trim();
    if (!q) {
      results.innerHTML='<p>Start typing the card you drew. Matches from the current sub-pack will appear here.</p>';
      return;
    }
    const scope=String(reader.dataset.attuneScope || 'full');
    const matches=ledgerBridge()?.searchCards?.(q,24,scope) || [];
    results.innerHTML=matches.length ? matches.map(card=>'<button type="button" data-attune-card="'+escapeHtml(card.card_id)+'"><img src="'+escapeHtml(card.image||'')+'" alt=""><span>'+escapeHtml(card.title||card.card_id)+'</span></button>').join('') : '<p>No matching cards in the current sub-pack.</p>';
    results.querySelectorAll('[data-attune-card]').forEach(button=>button.addEventListener('click',()=>{
      results.querySelectorAll('[data-attune-card]').forEach(item=>item.classList.toggle('is-selected',item===button));
      reader.dataset.attuneSelectedCard=button.dataset.attuneCard||'';
      if(confirm)confirm.disabled=!reader.dataset.attuneSelectedCard;
    }));
  }

  function openAttune(index) {
    const root=panel();
    const item=focusItem(index,root);
    if (!(surfaceReadingSession || recursionActive() || craftedReadingActive) || !root || !isEmptyItem(item)) return false;
    closeFocus({acknowledge:true});
    closeAttune();
    attuneIndex=index;
    const snap=currentSnapshot() || {};
    const meta=snap.rowPositionMeta?.[index] || snap.rowActiveLayout?.positions?.[index] || {};
    const scope=String(meta.drawScope || snap.rowDrawScope || 'full');
    const keywordTags=scope==='tags'&&Array.isArray(meta.keywordTags)?meta.keywordTags.filter(Boolean):[];
    const keywordMode=meta.keywordMatchMode==='all'?'all':'any';
    const reversalsAllowed=meta.allowReversals ?? (snap.rowAllowReversals!==false);
    const cardSource=String(meta.cardSource||'digital')==='physical'?'physical':'digital';
    const cardCount=Math.max(1,Number(meta.cardCount)||1),linkTo=String(meta.linkTo??'');
    const questionCardCount=Math.max(1,Number(meta.questionCardCount)||cardCount);
    const questionCardIndex=Math.max(0,Number(meta.questionCardIndex)||0);
    const linkedIndex=linkTo!==''?Number(linkTo):null,linkedCard=Number.isInteger(linkedIndex)?cardAt(linkedIndex,root):null;

    // Keyword sub-packs are question-specific. Load the current question's tags
    // before either digital drawing or physical-card lookup.
    if(scope==='tags'){
      const live=optionsBridge()?.capture?.();
      if(live){
        live.rowSelectedTags=keywordTags.slice();
        live.rowTagMatchMode=keywordMode;
        live.rowDrawDeck=[];
        live.rowDrawDeckSignature='';
        optionsBridge()?.restore?.(live);
      }
    }

    const reader=document.createElement('section');
    reader.className='relphi-attune-reader';
    reader.dataset.attuneScope=scope;
    reader.dataset.attuneCardSource=cardSource;
    reader.dataset.attuneSelectedCard='';
    reader.dataset.attuneOrientation='upright';
    reader.setAttribute('role','dialog');
    reader.setAttribute('aria-modal','true');
    reader.setAttribute('aria-label','Attune to the Referent');
    const scopeLabel=SURFACE_PACK_LABELS[Object.keys(SURFACE_PACK_BY_KIND).find(key=>SURFACE_PACK_BY_KIND[key]===scope)] || (scope==='full'?'Full Pack':scope || 'Full Pack');
    const packLine='Assigned pack · '+escapeHtml(scopeLabel)+(keywordTags.length?' · '+escapeHtml(keywordTags.join(keywordMode==='all'?' + ':' / ')):'')+(questionCardCount>1?' · Card '+(questionCardIndex+1)+' of '+questionCardCount:'')+(linkedCard?' · shares Question '+(linkedIndex+1)+' card':'');

    let actionMarkup='';
    let searchMarkup='';
    if(linkedCard){
      actionMarkup='<div class="relphi-attune-actions relphi-attune-actions--single"><button type="button" class="primary" data-attune-shared>Continue with the shared card</button></div>';
    }else if(cardSource==='physical'){
      const orientationMarkup=reversalsAllowed
        ? '<fieldset class="relphi-attune-orientation"><legend>Orientation</legend><label><input type="radio" name="relphiPhysicalOrientation" value="upright" checked> Upright</label><label><input type="radio" name="relphiPhysicalOrientation" value="reversed"> Reversed</label></fieldset>'
        : '<p class="relphi-attune-orientation-note">Reversals are off for this draw.</p>';
      searchMarkup='<section class="relphi-attune-search relphi-attune-search--physical">'+
        '<label>Enter the Card You Drew<input type="search" autocomplete="off" placeholder="Type the card you drew"></label>'+
        '<div class="relphi-attune-search-results"><p>Start typing the physical card you drew. Matches from the current sub-pack will appear here.</p></div>'+
        orientationMarkup+
        '<details class="relphi-attune-advanced"><summary>Advanced</summary><div><label>Sub-pack<select data-attune-pack>'+packOptions(scope)+'</select></label><label><input type="checkbox" data-attune-reversals '+(reversalsAllowed?'checked':'')+'> Reversals</label><label><input type="checkbox" data-attune-repeats '+((meta.allowRepeats ?? !!snap.rowAllowRepeats)?'checked':'')+'> Repeats</label></div></details>'+
        '</section>';
      actionMarkup='<div class="relphi-attune-actions relphi-attune-actions--single"><button type="button" class="primary" data-attune-confirm disabled>Use This Card</button></div>';
    }else{
      actionMarkup='<div class="relphi-attune-actions relphi-attune-actions--single"><button type="button" class="primary" data-attune-random>Draw Card</button></div>';
    }

    reader.innerHTML='<div class="relphi-attune-shell"><button type="button" class="relphi-attune-close" aria-label="Close">×</button><span class="eyebrow">Attune to the Referent</span><h2>'+escapeHtml(positionLabel(index,root))+'</h2><p class="relphi-attune-pack">'+packLine+'</p><p class="relphi-attune-note">Stay with the referent on its own first. Notice what it already means to you before you reveal a card.</p>'+actionMarkup+searchMarkup+'</div>';

    reader.querySelector('.relphi-attune-close')?.addEventListener('click',closeAttune);

    reader.querySelector('[data-attune-shared]')?.addEventListener('click',()=>{
      const target=attuneIndex;
      const cardId=linkedCard?.dataset?.rowCard || linkedCard?.dataset?.cardId || linkedCard?.getAttribute?.('data-row-card');
      const sourceScope=String((snap.rowPositionMeta?.[linkedIndex]||{}).drawScope||scope);
      const linkedReversed=!!snap.rowCardReversals?.[linkedIndex];
      closeAttune();
      if(cardId)ledgerBridge()?.addCardToBoard?.(cardId,sourceScope);
      const drawnIndex=currentCardCount(panel())-1;
      if(target!==drawnIndex&&drawnIndex>=0)prefabBridge()?.swapPositionSlots?.(drawnIndex,target);
      setRecordedCardOrientation(target,linkedReversed);
      pendingFocusIndex=target;
      setTimeout(()=>enhance(panel()),0);
    });

    reader.querySelector('[data-attune-random]')?.addEventListener('click',()=>{
      const target=attuneIndex;
      closeAttune();
      drawInto(focusItem(target,panel()),target);
    });
    reader.querySelector('[data-attune-confirm]')?.addEventListener('click',()=>{
      const target=attuneIndex;
      const cardId=reader.dataset.attuneSelectedCard||'';
      if(!cardId||!Number.isInteger(target)||target<0)return;
      const root=panel(),drawnIndex=currentCardCount(root);
      pendingFocusIndex=target;
      const selectedScope=String(reader.dataset.attuneScope||'full');
      if(!ledgerBridge()?.addCardToBoard?.(cardId,selectedScope)){pendingFocusIndex=null;return;}
      if(target!==drawnIndex)prefabBridge()?.swapPositionSlots?.(drawnIndex,target);
      setRecordedCardOrientation(target,reader.dataset.attuneOrientation==='reversed');
      closeAttune();
      setTimeout(()=>enhance(panel()),0);
    });
    reader.querySelector('[data-attune-pack]')?.addEventListener('change',event=>{
      reader.dataset.attuneScope=event.target.value||'full';
      const input=reader.querySelector('.relphi-attune-search input[type="search"]');
      renderAttuneSearch(reader,input?.value||'');
    });

    reader.querySelectorAll('input[name="relphiPhysicalOrientation"]').forEach(input=>input.addEventListener('change',()=>{
      if(input.checked)reader.dataset.attuneOrientation=input.value==='reversed'?'reversed':'upright';
    }));
    reader.querySelector('.relphi-attune-search input[type="search"]')?.addEventListener('input',event=>renderAttuneSearch(reader,event.target.value));

    document.body.appendChild(reader);
    lockAttuneViewport();
    reader.querySelector('.relphi-attune-shell')?.scrollTo?.(0,0);
    return true;
  }

  function expandSurfaceEntries(entries, baseIndex) {
    const prepared=entries.map((entry,index)=>{
      const linkToLocal=entry.linkTo===''||entry.linkTo==null?'':Number(entry.linkTo);
      return {
        ...entry,
        text:String(entry.text||'').trim(),
        pack:String(entry.pack||'full'),
        cardCount:Number.isInteger(linkToLocal)?1:Math.max(1,Math.min(12,Number(entry.cardCount)||1)),
        localIndex:index,
        linkToLocal
      };
    }).filter(entry=>entry.text);
    const starts=[];
    let cursor=baseIndex;
    prepared.forEach(entry=>{starts[entry.localIndex]=cursor;cursor+=entry.cardCount;});
    const expanded=[];
    prepared.forEach(entry=>{
      const linkedStart=Number.isInteger(entry.linkToLocal)?starts[entry.linkToLocal]:null;
      for(let cardOffset=0;cardOffset<entry.cardCount;cardOffset++){
        expanded.push({
          ...entry,
          text:entry.cardCount>1 ? entry.text+' · Card '+(cardOffset+1)+' of '+entry.cardCount : entry.text,
          questionText:entry.text,
          questionCardIndex:cardOffset,
          questionCardCount:entry.cardCount,
          linkTo:Number.isInteger(linkedStart)?String(linkedStart):''
        });
      }
    });
    return expanded;
  }

  function appendSurfaceFollowups(entries, root=panel()) {
    const bridge=optionsBridge();
    if (!bridge || !root || !entries.length) return false;
    const snap=bridge.capture();
    const originalLabels=Array.isArray(snap.shortListPositionLabels)?snap.shortListPositionLabels.slice():[];
    const originalMeta=Array.isArray(snap.rowPositionMeta)?snap.rowPositionMeta.map(item=>clone(item)||{}):[];
    const originalPacks=originalLabels.map((_,index)=>String(originalMeta[index]?.drawScope || snap.rowActiveLayout?.positions?.[index]?.drawScope || ''));
    const expanded=expandSurfaceEntries(entries,originalLabels.length);
    const room=Math.max(0,MAX_POSITIONS-originalLabels.length);
    const appended=expanded.slice(0,room);
    if(!appended.length)return false;
    const labels=originalLabels.concat(appended.map(item=>item.text));
    const packs=originalPacks.concat(appended.map(item=>item.pack||'full'));
    const positions=genericPositions(labels);
    positions.forEach((item,index)=>{item.drawScope=packs[index]||'';});
    snap.shortListPositionLabels=labels;
    snap.shortListPositionCardIds=Array.from({length:labels.length},(_,index)=>String(snap.shortListPositionCardIds?.[index]||''));
    snap.rowEnvelopeLayout={};
    snap.rowCardTransforms={};
    snap.rowPositionMeta=positions.map((item,index)=>{
      snap.rowEnvelopeLayout[index]={x:item.transform.x*CANVAS_W,y:item.transform.y*CANVAS_H};
      snap.rowCardTransforms[index]={scale:item.transform.scale,rotation:item.transform.rotation||0,zIndex:item.transform.zIndex||1};
      const prior=originalMeta[index];
      if(prior)return {...prior,id:item.id,drawScope:packs[index]||prior.drawScope||'',openTransform:null};
      const derived=appended[index-originalLabels.length]||{};
      return {
        id:item.id,
        role:index<surfaceReadingSession.initialCount?'surface-initial':'surface-followup',
        covers:'',
        crosses:'',
        drawScope:packs[index]||'full',
        openTransform:null,
        sourceKind:String(derived.sourceKind||''),
        derivedFromPack:String(derived.derivedFromPack||''),
        derivedFromIndex:Number.isInteger(derived.derivedFromIndex)?derived.derivedFromIndex:null,
        derivedFromCard:String(derived.derivedFromCard||''),
        derivedFromReversed:!!derived.derivedFromReversed,
        questionText:String(derived.questionText||derived.text||''),
        cardCount:Math.max(1,Number(derived.questionCardCount)||1),
        cardIndex:Math.max(0,Number(derived.questionCardIndex)||0),
        linkTo:String(derived.linkTo??''),
        keywordTags:Array.isArray(derived.keywordTags)?derived.keywordTags.slice():[],
        keywordMatchMode:derived.keywordMatchMode==='all'?'all':'any',
        cardSource:String(surfaceReadingSession?.cardSource||derived.cardSource||'digital')==='physical'?'physical':'digital',
        allowReversals:derived.reversals!==false,
        allowRepeats:!!derived.repeats
      };
    });
    snap.rowActiveLayout={version:1,id:'see-what-surfaces-active',name:'See What Surfaces',cardCount:labels.length,source:'custom',editable:false,positions:positions.map((item,index)=>({...item,drawOrder:index+1})),rules:{allowReversals:snap.rowAllowReversals!==false,allowRepeats:!!snap.rowAllowRepeats,drawScope:snap.rowDrawScope||'full'}};
    snap.rowLayoutLocked=true;
    bridge.restore(snap);
    return appended.length;
  }

  function closeSurfaceQuestionComposer({complete=false}={}) {
    document.querySelector('.relphi-surface-question-composer')?.remove();
    if(surfaceReadingSession){surfaceReadingSession.composerOpen=false;surfaceReadingSession.followupDecisionPending=false;}
    if(complete)setTimeout(()=>revealCompletedSurfaceBoard(panel()),0);
  }

  function surfaceKeywordMarkup(row,index) {
    if(String(row.pack||'full')!=='tags')return '';
    const tags=Array.isArray(row.keywordTags)?row.keywordTags:[];
    const mode=row.keywordMatchMode==='all'?'all':'any';
    const query=String(row.keywordQuery||'');
    const matches=query ? (window.RELPHI_KEYWORD_SUBPACK_CONTEXT?.matches?.(query)||[]) : [];
    const selected=tags.length
      ? '<div class="relphi-surface-keyword-selected">'+tags.map(tag=>'<button type="button" data-surface-tag-remove="'+escapeHtml(tag)+'">'+escapeHtml(tag)+' ×</button>').join('')+'</div>'
      : '';
    const matchesMarkup=matches.length
      ? matches.map(tag=>'<label><input type="checkbox" data-surface-tag-choice value="'+escapeHtml(tag)+'" '+(tags.includes(tag)?'checked':'')+'> '+escapeHtml(tag)+'</label>').join('')
      : '<p>'+(query?'No matching tags.':'Type to find matching canonical tags.')+'</p>';
    const count=window.RELPHI_KEYWORD_SUBPACK_CONTEXT?.count?.(tags,mode)||0;
    return '<section class="relphi-surface-keyword-builder" data-surface-keyword-builder="'+index+'">'+
      '<label>Find tags<input type="search" data-surface-tag-query autocomplete="off" placeholder="Type a tag, e.g. prince" value="'+escapeHtml(query)+'"></label>'+
      '<div class="relphi-surface-keyword-mode" role="radiogroup" aria-label="Tag matching">'+
        '<label><input type="radio" name="surfaceTagMode'+index+'" value="any" '+(mode==='any'?'checked':'')+'> Any</label>'+
        '<label><input type="radio" name="surfaceTagMode'+index+'" value="all" '+(mode==='all'?'checked':'')+'> All</label>'+
      '</div>'+
      '<div class="relphi-surface-keyword-matches" data-surface-tag-matches>'+matchesMarkup+'</div>'+
      selected+
      '<p class="relphi-surface-keyword-count" data-surface-tag-count>'+(tags.length?count+' card'+(count===1?'':'s')+' in this sub-pack':'Choose one or more tags.')+'</p>'+
    '</section>';
  }

  function surfaceComposerAdvancedSummary(row) {
    const pack=String(row.pack||'full');
    const packLabel=pack==='tags'
      ? ((row.keywordTags||[]).length ? 'Keywords / Tags · '+(row.keywordTags||[]).join(row.keywordMatchMode==='all'?' + ':' / ') : 'Keywords / Tags')
      : packOptions(pack).match(/selected[^>]*>([^<]+)/)?.[1] || (pack==='full'?'Full Pack':pack);
    const cards=Math.max(1,Math.min(12,Number(row.cardCount)||1));
    const link=row.linkTo===''||row.linkTo==null?'No link':'Shared card';
    return packLabel+' · '+cards+' card'+(cards===1?'':'s')+' · '+link;
  }

  function surfaceComposerRowMarkup(row,index,rows) {
    const linkOptions=rows.map((other,j)=>j===index?'':'<option value="'+j+'" '+(String(row.linkTo)===String(j)?'selected':'')+'>Question '+(j+1)+'</option>').join('');
    return '<article class="relphi-surface-composer-row" data-surface-composer-row="'+index+'">'+
      '<label class="relphi-surface-composer-select"><input type="checkbox" data-surface-select '+(row.selected!==false?'checked':'')+'><span>Ask</span></label>'+
      '<div class="relphi-surface-composer-main"><textarea rows="2" data-surface-text '+(row.sourceKind==='authored'&&!row.text?'placeholder="Commas split questions" ':'')+'aria-label="Question '+(index+1)+'">'+escapeHtml(row.text||'')+'</textarea>'+
      '<section class="relphi-surface-composer-controls" aria-label="Question '+(index+1)+' draw settings">'+
        '<label>Sub-pack<div class="relphi-surface-subpack-control"><select data-surface-pack>'+packOptions(row.pack||'full')+'</select><button type="button" data-surface-create-subpack aria-label="Create a sub-pack">+</button></div></label>'+
        '<label class="relphi-surface-card-count">Cards per question<div><input type="number" min="1" max="12" step="1" value="'+Math.max(1,Math.min(12,Number(row.cardCount)||1))+'" data-surface-card-count><span>× Cards</span></div></label>'+
        '<label>Share card with<select data-surface-link><option value="">No link</option>'+linkOptions+'</select></label>'+
        '<label class="relphi-surface-toggle"><input type="checkbox" data-surface-reversals '+(row.reversals!==false?'checked':'')+'> Reversals</label>'+
        '<label class="relphi-surface-toggle"><input type="checkbox" data-surface-repeats '+(row.repeats?'checked':'')+'> Repeats</label>'+
      '</section>'+
      surfaceKeywordMarkup(row,index)+
      '</div>'+
      '<button type="button" class="relphi-surface-composer-remove" data-surface-remove aria-label="Remove question '+(index+1)+'">×</button>'+
    '</article>';
  }

  function splitAuthoredSurfaceRow(rows,index,value) {
    const questions=parseBulkQuestions(value);
    if(questions.length<2)return false;
    const source=rows[index];if(!source||source.sourceKind!=='authored')return false;
    const delta=questions.length-1;
    const copies=questions.map(text=>({
      ...clone(source),
      text,
      selected:true,
      sourceKind:'authored',
      keywordTags:Array.isArray(source.keywordTags)?source.keywordTags.slice():[]
    }));
    rows.forEach((row,rowIndex)=>{
      if(rowIndex===index)return;
      const linked=row.linkTo===''||row.linkTo==null?null:Number(row.linkTo);
      if(Number.isInteger(linked)&&linked>index)row.linkTo=String(linked+delta);
    });
    rows.splice(index,1,...copies);
    return true;
  }

  function openSurfaceQuestionComposer(entries,{title='Unpack Questions',intro='Choose the questions you want to add to this reading.',completeOnCancel=true}={}) {
    const root=panel(),session=surfaceReadingSession;
    if(!root||!session)return false;
    closeAttune();
    document.querySelector('.relphi-surface-question-composer')?.remove();
    session.composerOpen=true;
    const rows=(entries||[]).map(item=>({
      ...clone(item),selected:item.selected!==false,text:String(item.text||''),pack:String(item.pack||'full'),
      cardCount:Math.max(1,Math.min(12,Number(item.cardCount)||1)),linkTo:item.linkTo??'',
      keywordTags:Array.isArray(item.keywordTags)?item.keywordTags.slice():[],
      keywordMatchMode:item.keywordMatchMode==='all'?'all':'any',
      keywordQuery:String(item.keywordQuery||''),
      reversals:item.reversals!==false,repeats:!!item.repeats
    }));
    if(!rows.length)rows.push({selected:true,text:'',pack:'full',cardCount:1,linkTo:'',keywordTags:[],keywordMatchMode:'any',keywordQuery:'',reversals:true,repeats:false,sourceKind:'authored'});
    let suggestionCursor=0;
    const composer=document.createElement('section');
    composer.className='relphi-surface-question-composer';
    composer.setAttribute('role','dialog');
    composer.setAttribute('aria-modal','true');
    composer.setAttribute('aria-label',title);
    const render=()=>{
      composer.innerHTML='<div class="relphi-surface-composer-shell">'+
        '<button type="button" class="relphi-surface-composer-close" aria-label="Close">×</button>'+
        '<span class="eyebrow">'+escapeHtml(title)+'</span>'+
        '<h2>Choose what to ask next</h2>'+
        '<p class="relphi-surface-composer-intro">'+escapeHtml(intro)+'</p>'+
        '<p class="relphi-surface-composer-status" data-surface-composer-status hidden></p>'+
        '<div class="relphi-surface-composer-rows">'+rows.map((row,index)=>surfaceComposerRowMarkup(row,index,rows)).join('')+'</div>'+
        '<div class="relphi-surface-composer-footer"><button type="button" data-surface-suggest>Suggest another question</button><button type="button" data-surface-add>Add my own question</button><span></span><button type="button" data-surface-done class="primary">Add selected questions</button></div>'+
      '</div>';
      const syncRow=(article,index)=>{
        const row=rows[index];if(!row)return;
        row.selected=!!article.querySelector('[data-surface-select]')?.checked;
        row.text=article.querySelector('[data-surface-text]')?.value||'';
        row.pack=article.querySelector('[data-surface-pack]')?.value||'full';
        row.cardCount=Math.max(1,Math.min(12,Math.trunc(Number(article.querySelector('[data-surface-card-count]')?.value)||1)));
        row.linkTo=article.querySelector('[data-surface-link]')?.value??'';
        row.reversals=article.querySelector('[data-surface-reversals]')?.checked!==false;
        row.repeats=!!article.querySelector('[data-surface-repeats]')?.checked;
        row.keywordTags=Array.isArray(row.keywordTags)?row.keywordTags:[];
        row.keywordMatchMode=article.querySelector('[name="surfaceTagMode'+index+'"]:checked')?.value==='all'?'all':'any';
      };
      composer.querySelectorAll('[data-surface-composer-row]').forEach((article,index)=>{
        const row=rows[index];
        ['change','input'].forEach(type=>article.addEventListener(type,()=>syncRow(article,index)));
        article.querySelector('[data-surface-text]')?.addEventListener('focusout',event=>{
          if(row.sourceKind!=='authored')return;
          syncRow(article,index);
          const value=event.target.value;
          if(!value.includes(',')||parseBulkQuestions(value).length<2)return;
          // Match Bespoke Question 1: commas are parsed only after typing is
          // finished, and every resulting question inherits this row's settings.
          queueMicrotask(()=>{
            if(!composer.isConnected)return;
            if(splitAuthoredSurfaceRow(rows,index,value)){
              render();
              setTimeout(()=>composer.querySelector('[data-surface-composer-row="'+index+'"] [data-surface-text]')?.focus(),0);
            }
          });
        });
        article.querySelector('[data-surface-pack]')?.addEventListener('change',()=>{
          syncRow(article,index);
          if(row.pack!=='tags'){row.keywordTags=[];row.keywordMatchMode='any';}
          render();
        });
        article.querySelector('[data-surface-create-subpack]')?.addEventListener('click',()=>{
          syncRow(article,index);
          window.RelphiCustomSubpacks?.open?.({
            onSave:pack=>{
              row.pack='custom:'+pack.id;
              render();
            }
          });
        });
        article.querySelector('[data-surface-card-count]')?.addEventListener('change',event=>{
          row.cardCount=Math.max(1,Math.min(12,Math.trunc(Number(event.target.value)||1)));
          event.target.value=String(row.cardCount);
        });
        const query=article.querySelector('[data-surface-tag-query]');
        const matchesHost=article.querySelector('[data-surface-tag-matches]');
        const bindTagChoices=()=>{
          matchesHost?.querySelectorAll('[data-surface-tag-choice]').forEach(input=>{
            input.onchange=()=>{
              const set=new Set(row.keywordTags||[]);
              input.checked?set.add(input.value):set.delete(input.value);
              row.keywordTags=[...set];
              render();
            };
          });
        };
        const renderMatches=value=>{
          if(!matchesHost)return;
          const matches=window.RELPHI_KEYWORD_SUBPACK_CONTEXT?.matches?.(value)||[];
          matchesHost.innerHTML=matches.length
            ? matches.map(tag=>'<label><input type="checkbox" data-surface-tag-choice value="'+escapeHtml(tag)+'" '+((row.keywordTags||[]).includes(tag)?'checked':'')+'> '+escapeHtml(tag)+'</label>').join('')
            : '<p>'+(value?'No matching tags.':'Type to find matching canonical tags.')+'</p>';
          bindTagChoices();
        };
        bindTagChoices();
        query?.addEventListener('input',event=>{row.keywordQuery=event.target.value;renderMatches(row.keywordQuery);});
        article.querySelectorAll('[name="surfaceTagMode'+index+'"]').forEach(input=>input.addEventListener('change',()=>{
          row.keywordMatchMode=input.value==='all'&&input.checked?'all':'any';
          render();
        }));
        article.querySelectorAll('[data-surface-tag-remove]').forEach(button=>button.addEventListener('click',()=>{
          row.keywordTags=(row.keywordTags||[]).filter(tag=>tag!==button.dataset.surfaceTagRemove);
          render();
        }));
        article.querySelector('[data-surface-remove]')?.addEventListener('click',()=>{syncRow(article,index);rows.splice(index,1);render();});
      });
      composer.querySelector('[data-surface-suggest]')?.addEventListener('click',()=>{
        composer.querySelectorAll('[data-surface-composer-row]').forEach((article,index)=>syncRow(article,index));
        const suggestion=nextSurfaceSuggestion(rows,suggestionCursor);
        if(!suggestion)return;
        suggestionCursor=suggestion.nextCursor;
        rows.push({...suggestion.candidate,selected:true,cardCount:Math.max(1,Number(suggestion.candidate.cardCount)||1),linkTo:suggestion.candidate.linkTo??'',keywordTags:Array.isArray(suggestion.candidate.keywordTags)?suggestion.candidate.keywordTags.slice():[],keywordMatchMode:suggestion.candidate.keywordMatchMode==='all'?'all':'any',keywordQuery:'',reversals:suggestion.candidate.reversals!==false,repeats:!!suggestion.candidate.repeats});
        render();
        setTimeout(()=>composer.querySelector('[data-surface-composer-row]:last-child')?.scrollIntoView?.({block:'nearest'}),0);
      });
      composer.querySelector('[data-surface-add]')?.addEventListener('click',()=>{
        composer.querySelectorAll('[data-surface-composer-row]').forEach((article,index)=>syncRow(article,index));
        rows.push({selected:true,text:'',pack:'full',cardCount:1,linkTo:'',keywordTags:[],keywordMatchMode:'any',keywordQuery:'',reversals:true,repeats:false,sourceKind:'authored'});
        render();
        setTimeout(()=>composer.querySelector('[data-surface-composer-row]:last-child [data-surface-text]')?.focus(),0);
      });
      composer.querySelector('[data-surface-done]')?.addEventListener('click',()=>{
        composer.querySelectorAll('[data-surface-composer-row]').forEach((article,index)=>syncRow(article,index));
        const selectedIndices=rows.map((row,index)=>row.selected&&String(row.text||'').trim()?index:null).filter(index=>index!=null);
        const remap=new Map(selectedIndices.map((originalIndex,newIndex)=>[originalIndex,newIndex]));
        const chosen=selectedIndices.map(originalIndex=>{
          const row=clone(rows[originalIndex]);
          const linkedOriginal=row.linkTo===''||row.linkTo==null?null:Number(row.linkTo);
          row.linkTo=Number.isInteger(linkedOriginal)&&remap.has(linkedOriginal)?String(remap.get(linkedOriginal)):'';
          return row;
        });
        if(!chosen.length){closeSurfaceQuestionComposer({complete:completeOnCancel});return;}
        const missingChosenIndex=chosen.findIndex(row=>row.pack==='tags' && !(row.keywordTags||[]).length && (row.linkTo===''||row.linkTo==null));
        if(missingChosenIndex>=0){
          const originalIndex=selectedIndices[missingChosenIndex];
          const target=composer.querySelector('[data-surface-composer-row="'+originalIndex+'"] [data-surface-tag-query]')||composer.querySelector('[data-surface-tag-query]');
          const status=composer.querySelector('[data-surface-composer-status]');
          if(status){status.hidden=false;status.textContent='Choose at least one keyword or tag for every Keywords / Tags question.';}
          target?.focus();
          target?.scrollIntoView?.({block:'center'});
          return;
        }
        const before=(currentSnapshot()?.shortListPositionLabels||[]).length;
        const count=appendSurfaceFollowups(chosen,root);
        if(!count)return;
        session.followupsGenerated=true;
        session.followupCount=Math.max(0,before-session.initialCount)+count;
        session.completionShown=false;
        session.conclusionOffered=false;
        session.followupDecisionPending=false;
        session.composerOpen=false;
        craftedReadingActive=true;
        optionsSession=null;
        composer.remove();
        setBoardMode(root,'crafted');
        setTimeout(()=>{
          const live=panel();if(!live)return;
          markSemanticPositions(live);updateLayoutClasses(live);zoomExtents();
          const next=nextUndrawnNativeIndex(live);if(next!=null)openAttune(next);
        },0);
      });
      composer.querySelector('.relphi-surface-composer-close')?.addEventListener('click',()=>closeSurfaceQuestionComposer({complete:completeOnCancel}));
    };
    render();
    document.body.appendChild(composer);
    return true;
  }

  function unpackSuggestionsForCard(index) {
    const root=panel(),snap=currentSnapshot()||{},card=cardDataAt(index)||{};
    const cardId=String(card.card_id||cardAt(index,root)?.dataset?.rowCard||'');
    const title=String(ledgerBridge()?.titleFor?.(cardId)||card.title||card.name||cardId||'this card').trim();
    const reversed=focusCardIsReversed(index);
    const name=title+(reversed?' reversed':'');
    const sourceMeta=snap.rowPositionMeta?.[index]||snap.rowActiveLayout?.positions?.[index]||{};
    const sourcePack=String(sourceMeta.drawScope||snap.rowDrawScope||'full');
    const base={pack:'full',cardCount:1,linkTo:'',sourceKind:'unpack',derivedFromPack:sourcePack,derivedFromIndex:index,derivedFromCard:cardId,derivedFromReversed:reversed};
    return [
      {...base,text:'What is '+name+' asking me to understand more deeply?'},
      {...base,text:'What part of '+name+' is most important for me to examine now?'},
      {...base,text:'What would help me work constructively with '+name+'?'},
      {...base,text:'What is '+name+' revealing that I have not yet named?'},
      {...base,text:'What tension inside '+name+' deserves closer attention?'},
      {...base,text:'What becomes possible if I fully understand '+name+'?'},
      {...base,text:'What practical response does '+name+' invite from me?'}
    ];
  }

  function surfacedSuggestionPool(kind) {
    const session=surfaceReadingSession;
    if(!session)return [];
    const index=session.kinds?.indexOf?.(kind);
    if(!Number.isInteger(index)||index<0)return [];
    const card=cardDataAt(index)||{};
    const base={pack:'full',cardCount:1,linkTo:'',sourceKind:kind,derivedFromPack:SURFACE_PACK_BY_KIND[kind]||'',derivedFromIndex:index,derivedFromCard:String(card.card_id||cardAt(index)?.dataset?.rowCard||''),derivedFromReversed:focusCardIsReversed(index)};
    const make=text=>({...base,text});
    if(kind==='planet'){
      const planet=surfacePlanet(card)||'this planet';
      return [
        make('What is '+planet+' asking me to understand about this matter?'),
        make('Where is '+planet+' most active in this matter?'),
        make('What is '+planet+' asking me to value or reconsider here?'),
        make('What is being revealed through '+planet+' that I have not yet named?'),
        make('How can I work more consciously with '+planet+' in this situation?')
      ];
    }
    if(kind==='sign'){
      const sign=String(card?.astrology?.sign||'').trim()||'this sign';
      return [
        make('How is '+sign+' shaping the way this situation is being expressed?'),
        make('What is '+sign+' making visible about this situation?'),
        make('Where is the '+sign+' pattern strongest here?'),
        make('What does '+sign+' ask me to approach differently?'),
        make('What possibility opens when I work consciously with '+sign+'?')
      ];
    }
    if(kind==='need'){
      const need=surfaceNeed(card)||'this need';
      return [
        make('What does the unmet need for '+need+' ask me to recognize?'),
        make('Where is the need for '+need+' most alive in this situation?'),
        make('What is obstructing '+need+' here?'),
        make('What would genuinely support '+need+' now?'),
        make('How is '+need+' changing the meaning of this situation?')
      ];
    }
    if(kind==='court'){
      const formula=surfaceCourtFormula(card)||'this court pattern';
      return [
        make('How is '+formula+' carrying this situation?'),
        make('Where is '+formula+' embodied most clearly here?'),
        make('What role is '+formula+' asking me to take or recognize?'),
        make('What is distorted or underdeveloped in '+formula+' here?'),
        make('How can '+formula+' be expressed more skillfully?')
      ];
    }
    if(kind==='pip'){
      const number=surfacePipNumber(card);
      const form=[card?.element,HOUSE_ORDINALS[number-1] ? HOUSE_ORDINALS[number-1]+' House' : '',MODE_BY_PIP[number]||''].filter(Boolean).join(' · ')||'this form';
      return [
        make('What form is this taking through '+form+'?'),
        make('Where is the pattern of '+form+' most concrete right now?'),
        make('What pressure or movement is '+form+' describing?'),
        make('What is '+form+' trying to become?'),
        make('What changes if I respond directly to '+form+'?')
      ];
    }
    if(kind==='ace'){
      const element=String(card?.element||'').trim()||'this element';
      return [
        make('What is taking root materially through '+element+'?'),
        make('What new beginning is '+element+' offering here?'),
        make('What seed in '+element+' needs attention now?'),
        make('What would help this '+element+' beginning develop?'),
        make('What is the first concrete expression of this '+element+' potential?')
      ];
    }
    if(kind==='primordial'){
      const element=surfacePrimordialElement(card)||'this primordial principle';
      return [
        make('What does the primordial '+element+' principle reveal about this matter?'),
        make('Where is the primordial '+element+' principle operating most strongly?'),
        make('What is the '+element+' principle asking me to notice first?'),
        make('What becomes clearer when I view this through '+element+'?'),
        make('How should I respond to the '+element+' principle surfacing here?')
      ];
    }
    return [];
  }

  function nextSurfaceSuggestion(rows, cursor=0) {
    const normalized=new Set(rows.map(row=>String(row.text||'').replace(/\s+/g,' ').trim().toLowerCase()).filter(Boolean));
    const sources=[];
    rows.forEach(row=>{
      const key=String(row.sourceKind||'');
      const sourceIndex=Number.isInteger(row.derivedFromIndex)?row.derivedFromIndex:null;
      const token=key+':'+String(sourceIndex??'');
      if(key && key!=='authored' && !sources.some(item=>item.token===token)) sources.push({token,key,sourceIndex});
    });
    if(!sources.length && surfaceReadingSession?.kinds?.length) surfaceReadingSession.kinds.forEach(key=>sources.push({token:key+':',key,sourceIndex:null}));
    if(!sources.length)return null;
    for(let offset=0;offset<sources.length;offset++){
      const source=sources[(cursor+offset)%sources.length];
      const pool=source.key==='unpack' && Number.isInteger(source.sourceIndex)
        ? unpackSuggestionsForCard(source.sourceIndex)
        : surfacedSuggestionPool(source.key);
      const candidate=pool.find(item=>!normalized.has(String(item.text||'').replace(/\s+/g,' ').trim().toLowerCase()));
      if(candidate)return {candidate,nextCursor:(cursor+offset+1)%sources.length};
    }
    return null;
  }

  function unpackSurfaceCard(index) {
    const session=surfaceReadingSession;
    const root=panel();
    if(!session||!root||!Number.isInteger(index)||!cardAt(index,root))return false;
    const snap=currentSnapshot()||{};
    const labels=Array.isArray(snap.shortListPositionLabels)?snap.shortListPositionLabels:[];
    if(labels.length>=MAX_POSITIONS){
      showBoardToast('This reading has reached the 78-card board limit.',{title:'See What Surfaces',duration:4200});
      return false;
    }
    root.querySelector('.relphi-board-toast')?.remove();
    closeFocus({acknowledge:true,advanceSurface:false});
    return openSurfaceQuestionComposer(unpackSuggestionsForCard(index),{
      title:'Unpack this card',
      intro:'Choose a suggested question or write your own. Nothing is added to the reading until you approve it.',
      completeOnCancel:true
    });
  }

  function surfaceReadingComplete(root=panel()) {
    const session=surfaceReadingSession;
    if (!session || !session.followupsGenerated || session.followupDecisionPending || session.composerOpen || !root) return false;
    const total=Math.min(MAX_POSITIONS,session.initialCount+session.followupCount);
    return total>0 && Array.from({length:total},(_,index)=>index).every(index=>!!cardAt(index,root));
  }
  function revealCompletedSurfaceBoard(root=panel()) {
    const session=surfaceReadingSession;
    if (!session || session.completionShown || !surfaceReadingComplete(root)) return false;
    session.completionShown=true;
    closeAttune();
    closeFocus({acknowledge:true,advanceSurface:false});
    setTimeout(()=>{
      const next=panel();
      if (!next) return;
      zoomExtents();
      showBoardToast('Every current referent has been answered. Open any card and choose “Unpack this card” to continue, or conclude the reading.',{
        title:'See What Surfaces · Current branch complete',
        duration:0,
        actionLabel:'Conclude Reading',
        onAction:()=>{
          const active=panel();
          if(!active)return;
          zoomExtents();
          if(surfaceReadingSession)surfaceReadingSession.conclusionOffered=true;
          showBoardToast('The reading is concluded. The completed spread remains at zoom extents for review.',{title:'Reading concluded',duration:5200});
        }
      });
    },0);
    return true;
  }
  function maybeGenerateSurfaceFollowups(root=panel()) {
    const session=surfaceReadingSession;
    if (!session || !root || session.composerOpen) return;
    if (!session.followupsGenerated) {
      if (session.kinds.some((_,index)=>!cardAt(index,root))) return;
      const draws={};
      session.kinds.forEach((kind,index)=>{draws[kind]=cardDataAt(index);});
      const entries=suggestionsFromSurface({surfaceDraws:draws}).map(item=>({...item,cardCount:1,linkTo:'',selected:true}));
      session.followupsGenerated=true;
      session.followupCount=0;
      session.followupDecisionPending=true;
      if(entries.length){
        openSurfaceQuestionComposer(entries,{
          title:'What surfaced next',
          intro:'Relphi has suggestions, but these are options—not automatic follow-ups. Choose what to ask, adjust each draw, or write your own.',
          completeOnCancel:true
        });
        return;
      }
      session.followupDecisionPending=false;
    }
    revealCompletedSurfaceBoard(root);
  }

  function launchConfiguredReading(root,draft) {
    const bridge=optionsBridge(),prefabs=prefabBridge(),prefab=draftPrefab(draft);
    const snap=bridge?.capture();
    const craftedPath=String(optionsSession?.path||activeCraftedPath||'');
    if(!snap||!prefabs||!prefab.positions.length)return false;
    craftedReadingActive=true;
    sacredResumeGateHandled=true;
    Object.assign(snap,{shortList:[],shortListSelection:[],shortListPositionLabels:[],shortListPositionCardIds:[],rowEnvelopeLayout:{},rowCardTransforms:{},rowPositionMeta:[],rowActiveLayout:null,rowLayoutLocked:false,rowLayoutDesignMode:false,rowCardReversals:{},rowCardManual:[],rowDrawDeck:[],rowDrawDeckSignature:''});
    bridge.restore(snap);
    if(!prefabs.applyLayout(prefab)){craftedReadingActive=false;return false;}
    stampCraftedPath(craftedPath,root);
    const sacredCardSource=optionsSession?.sacredCardSource==='physical'?'physical':'digital';
    markSettingsConfirmed();
    applyDrawSettings(draft);
    stampSacredCardSource(sacredCardSource,root);
    optionsSession=null;
    root.querySelector('.relphi-reading-options-drawer')?.remove();
    setBoardMode(root,'crafted');
    const crafted=root.querySelector('#drawingBoardOptionsButton'),free=root.querySelector('#drawingBoardBoardTab');
    crafted?.classList.add('is-active');crafted?.setAttribute('aria-checked','true');
    free?.classList.remove('is-active');free?.setAttribute('aria-checked','false');
    setTimeout(()=>{markSemanticPositions(root);updateLayoutClasses(root);zoomExtents();},0);
    return true;
  }

  function stampSacredCardSource(source, root=panel()) {
    const bridge=optionsBridge();
    const snap=bridge?.capture?.();
    if(!bridge||!snap)return false;
    const cardSource=source==='physical'?'physical':'digital';
    const count=Math.max(
      Array.isArray(snap.shortListPositionLabels)?snap.shortListPositionLabels.length:0,
      Array.isArray(snap.rowPositionMeta)?snap.rowPositionMeta.length:0
    );
    snap.rowPositionMeta=Array.from({length:count},(_,index)=>({
      ...(snap.rowPositionMeta?.[index]||{}),
      cardSource
    }));
    if(snap.rowActiveLayout?.positions){
      snap.rowActiveLayout={...snap.rowActiveLayout,positions:snap.rowActiveLayout.positions.map((position,index)=>({
        ...position,
        cardSource
      }))};
    }
    bridge.restore(snap);
    return true;
  }

  function applyOptions(root = panel()) {
    if (!optionsSession || !root) return;
    const session=optionsSession;
    let draft=clone(session.draft);
    if(session.path==='bespoke'){
      const expanded=expandBespokeDraftForLaunch(draft);
      if(!expanded.draft){
        showBoardToast('This Bespoke reading requests '+expanded.total+' cards. The current safety limit is '+MAX_POSITIONS+'. Reduce the card count or number of questions before starting.',{title:'Bespoke',duration:6200});
        return;
      }
      draft=expanded.draft;
    }
    draft.stickers=true;
    const structural=optionsStructuralChanged(session);
    const surfaceKinds=session.path==='surface' ? selectedSurfaceKinds(session) : [];
    if(session.path==='astro'&&!session.astrologyResolved){showBoardToast('Choose and prepare the sky before starting the Astrological Tarot Reading.',{title:'Astrological Tarot Reading',duration:5200});return}
    const astrologyRequested=session.path==='astro'&&!!session.astrologyResolved;
    if(astrologyRequested){writeStickerVisibility(draft.stickers);surfaceReadingSession=null;recursionSession=null;recursionPortalLevel=0;if(!launchConfiguredReading(root,draft)){showBoardToast('The reading layout could not be established. Your Astrological Tarot setup has been kept open.',{title:'Astrological Tarot Reading',duration:5200});return}showBoardToast('Your selected astrological questions are established. Attune to the first referent before revealing its card.',{title:'Astrological Tarot Reading',duration:0,actionLabel:'Attune',onAction:()=>{const next=nextUndrawnNativeIndex(panel());if(next!=null)openAttune(next);}});return}
    if(session.path==='surface'){
      if(!surfaceKinds.length)return;
      writeStickerVisibility(draft.stickers);
      surfaceReadingSession={kinds:surfaceKinds.slice(),initialCount:surfaceKinds.length,cardSource:session.sacredCardSource==='physical'?'physical':'digital',followupsGenerated:false,followupCount:0,followupDecisionPending:false,composerOpen:false,completionShown:false,conclusionOffered:false};
      recursionSession=null;recursionPortalLevel=0;
      if(!launchConfiguredReading(root,draft)){
        surfaceReadingSession=null;
        showBoardToast('The See What Surfaces reading could not be established. Your setup has been kept open.',{title:'See What Surfaces',duration:5200});
        return;
      }
      stampSacredCardSource(surfaceReadingSession.cardSource,root);
      // Start Reading is the only start action. Go directly into the first sacred attunement.
      setTimeout(()=>{const next=nextUndrawnNativeIndex(panel());if(next!=null)openAttune(next);},0);
      return;
    }
    const recursionRequested=draft.templateId===RECURSION_ID || draft.basedOnTemplateId===RECURSION_ID;
    const crowleyRequested=draft.templateId==='crowley-harmonic-divination-12' || draft.basedOnTemplateId==='crowley-harmonic-divination-12';
    if(session.path==='templates' && crowleyRequested){
      const method=templateById('crowley-harmonic-divination-12');
      if(!method)return;
      // Opening of the Key is a method, not a twelve-question spread. Clear any
      // Bespoke/question residue and establish only the method identity; its
      // helper owns the five operations and their changing structures.
      draft.templateId=method.id;
      draft.basedOnTemplateId=method.id;
      draft.labels=[];
      draft.positionPacks=[];
      draft.positionSettings=[];
      draft.templateName=method.name;
      draft.reversals=false;
      draft.repeats=false;
      const bridge=optionsBridge();
      const snap=bridge?.capture?.();
      if(!bridge||!snap)return;
      Object.assign(snap,{shortList:[],shortListSelection:[],shortListPositionLabels:[],shortListPositionCardIds:[],rowEnvelopeLayout:{},rowCardTransforms:{},rowPositionMeta:[],rowCardReversals:{},rowCardManual:[],rowDrawDeck:[],rowDrawDeckSignature:'',rowLayoutLocked:false,rowLayoutDesignMode:false,rowActiveLayout:{...clone(method),positions:[]}});
      bridge.restore(snap);
      optionsSession=null;
      markSettingsConfirmed();
      root.querySelector('.relphi-reading-options-drawer')?.remove();
      root.querySelector('.relphi-free-settings')?.remove();
      setBoardMode(root,'crafted');
      ensureBoardChrome(root);
      syncZoomToolbarVisibility(root);
      setTimeout(()=>{
        window.RelphiCrowleyHarmonicBridge?.start?.();
        document.dispatchEvent(new Event('relphi:drawing-board-rendered'));
      },0);
      return;
    }
    // Every ordinary Crafted path must cross the same atomic launch boundary.
    // Leaving Templates / Building Blocks on the legacy clear-and-reapply path
    // gives enhance() a chance to reinterpret the new structure as setup state.
    if(session.path==='bespoke' || session.path==='templates' || session.path==='blocks'){
      const pathTitle=session.path==='bespoke'?'Bespoke':session.path==='templates'?'Templates':'Building Blocks';
      writeStickerVisibility(draft.stickers);
      surfaceReadingSession=null;
      recursionSession=recursionRequested ? {level:1,maxLevel:1,complete:false} : null;
      recursionPortalLevel=0;
      if(!launchConfiguredReading(root,draft)){
        showBoardToast('The reading layout could not be established. Your setup has been kept open.',{title:pathTitle,duration:5200});
        return;
      }
      if(recursionSession && recursionActive()){
        showBoardToast('Each level takes the shape of the Relphi logo. The active black circle opens white, then holds its card. When Mem, Aleph, and Shin are complete, the red Earth circle wakes up as the portal. Veilva marks the seven depths.',{
          title:'Relphi Recursive Reading',duration:0,actionLabel:'Enter Level 1',
          onAction:()=>{const first=recursionIndicesForLevel(1)[0];if(Number.isInteger(first))openAttune(first);}
        });
      }else{
        showBoardToast('Your '+pathTitle.toLowerCase()+' referents and draw settings are established. Attune to the first referent before revealing its card.',{title:pathTitle,duration:0,actionLabel:'Attune',onAction:()=>{const next=nextUndrawnNativeIndex(panel());if(next!=null)openAttune(next);}});
      }
      return;
    }
    surfaceReadingSession=surfaceKinds.length ? {kinds:surfaceKinds.slice(),initialCount:surfaceKinds.length,followupsGenerated:false,followupCount:0,followupDecisionPending:false,composerOpen:false,completionShown:false} : null;
    if(astrologyRequested) surfaceReadingSession=null;
    recursionSession=recursionRequested ? {level:1,maxLevel:1,complete:false} : null;
    recursionPortalLevel=0;
    writeStickerVisibility(draft.stickers);
    optionsSession=null;
    root.querySelector('.relphi-reading-options-drawer')?.remove();
    setBoardMode(root,boardHasCraftedStructure(root)?'referents':'board');
    if (structural && currentCardCount(root)===0) {
      const clear=root.querySelector('#clearShortList');
      clear?.click();
      const prefab=draftPrefab(draft);
      if (prefab.positions.length) prefabBridge()?.applyLayout?.(prefab);
      applyDrawSettings(draft);
    } else {
      applyDrawSettings(draft);
    }
    if(astrologyRequested && currentCardCount(root)===0){
      const prefab=draftPrefab(draft);
      if(prefab.positions.length) prefabBridge()?.applyLayout?.(prefab);
      applyDrawSettings(draft);
    }
    setTimeout(()=>{
      enhance(panel());
      zoomExtents();
      if (recursionSession && recursionActive()) {
        showBoardToast('Each level takes the shape of the Relphi logo. The active black circle opens white, then holds its card. When Mem, Aleph, and Shin are complete, the red Earth circle wakes up as the portal. Veilva marks the seven depths.',{
          title:'Relphi Recursive Reading',
          duration:0,
          actionLabel:'Enter Level 1',
          onAction:()=>{
            const first=recursionIndicesForLevel(1)[0];
            if (Number.isInteger(first)) openAttune(first);
          }
        });
      } else if (surfaceReadingSession) {
        const astrologySurface=!!surfaceReadingSession.astrology;
        showBoardToast(astrologySurface?'Draw the three surface cards. Their correspondences can now be compared against the resolved sky data as the astrological question engine is connected.':surfaceGuidance(),{
          title:astrologySurface?'Astrological Tarot Reading':'See What Surfaces',
          duration:0,
          actionLabel:'Begin reading',
          onAction:()=>{
            const next=nextUndrawnNativeIndex(panel());
            if (next!=null) openAttune(next);
          }
        });
      } else {
        showBoardToast('Your referents and draw settings are established. The Drawing Board is ready.',{title:'Reading ready',duration:4600});
      }
    },0);
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
  function addFocusSurfaceContext(entry,index,cardId) {
    entry.querySelectorAll('[data-relphi-focus-surface-context]').forEach(node=>node.remove());
    const snap=currentSnapshot() || {};
    const scope=String(snap.rowPositionMeta?.[index]?.drawScope || snap.rowActiveLayout?.positions?.[index]?.drawScope || '');
    if (scope!=='courts') return;
    const card=(Array.isArray(window.RELPHI_TAROT_CARDS)?window.RELPHI_TAROT_CARDS:[]).find(item=>item?.card_id===cardId);
    if (!isPrincessPage(card)) return;
    const formula=surfaceCourtFormula(card);
    const section=document.createElement('section');
    section.className='interpretation-card--priority relphi-focus-surface-context';
    section.dataset.relphiFocusSurfaceContext='princess-page';
    const heading=document.createElement('h3'); heading.textContent='Next-generation embodiment';
    const body=document.createElement('p'); body.textContent='Page/Princess · '+formula+' · Earth carries the suit element into tangible form.';
    section.append(heading,body);
    const block=entry.querySelector('.full-entry-title-block');
    if (block) block.appendChild(section); else entry.prepend(section);
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
    const src=artSource?.dataset?.relphiFullSrc || artSource?.currentSrc || artSource?.src || '';
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
    const unpack=reader.querySelector('.relphi-focus-unpack');
    const positionText=positionLabel(index);
    reader.classList.toggle('has-long-referent',positionText.length>320);
    if (position) position.textContent=positionText;
    if (reversedBadge) reversedBadge.hidden=!reversed;
    if (unpack) {
      const count=Array.isArray((currentSnapshot()||{}).shortListPositionLabels)?(currentSnapshot()||{}).shortListPositionLabels.length:configuredPositionCount();
      unpack.hidden=!surfaceReadingSession || !card || count>=MAX_POSITIONS;
    }
    replaceFocusArt(reader,artSource,cardId,reversed);
    if (entry) {
      entry.innerHTML=ledgerBridge()?.renderCardEntry?.(cardId,'Tarot Ledger entry') || '<p>Card entry unavailable.</p>';
      entry.querySelectorAll('.tarot-card-art,.full-entry-row-button').forEach(node=>node.remove());
      addFocusReversedMeaning(entry,cardId,reversed);
      addFocusSurfaceContext(entry,index,cardId);
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
    if (recursionActive()) { renderRecursionFocusStrip(reader,index); return; }
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
      recursionPortalLevel=0;
      existingReader.classList.remove('is-recursion-portal');
      const portal=existingReader.querySelector('.relphi-recursion-portal-focus');
      if (portal) portal.hidden=true;
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
    reader.innerHTML=`<div class="relphi-focus-shell"><section class="relphi-focus-position-panel" aria-label="Reading question or position"><span class="relphi-focus-reversed-badge" hidden>Reversed</span><strong class="relphi-focus-position"></strong><button type="button" class="relphi-focus-close" aria-label="Close focused card">×</button></section><nav class="relphi-recursion-depth" aria-label="Recursion depth" hidden></nav><div class="relphi-focus-main"><section class="relphi-focus-art-pane" aria-label="Card art"><div class="relphi-focus-art-frame"><img class="relphi-focus-art" alt=""></div><div class="relphi-focus-art-actions"><button type="button" class="relphi-focus-unpack" hidden>Unpack this card</button></div></section><article class="relphi-focus-entry tarot-detail" aria-label="Full Tarot Ledger entry"></article><section class="relphi-recursion-portal-focus" hidden></section></div><footer><button type="button" class="relphi-focus-prev" aria-label="Previous position">‹</button><div class="relphi-focus-navigator"><div class="relphi-focus-strip" aria-label="Reading positions"></div></div><button type="button" class="relphi-focus-next" aria-label="Next position">›</button></footer></div>`;
    renderFocusEntry(reader,index);
    renderFocusStrip(reader,index,{preserveScroll:false});
    installFocusStripScrub(reader);
    reader.querySelector('.relphi-focus-close').addEventListener('click',()=>closeFocus({acknowledge:true}));
    reader.querySelector('.relphi-focus-unpack')?.addEventListener('click',()=>{
      const target=Number(reader.dataset.focusIndex);
      if(Number.isInteger(target))unpackSurfaceCard(target);
    });
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
  function closeFocus({acknowledge=true,advanceSurface=true}={}) {
    const leaving=focusIndex;
    document.querySelector('.relphi-focus-reader')?.remove();
    document.body.classList.remove('relphi-focus-open');
    focusIndex=-1;
    recursionPortalLevel=0;
    // Returning from Focus is a board reframe boundary. Recompute extents after
    // the overlay is gone so newly drawn / positioned cards are brought into view.
    requestAnimationFrame(()=>zoomExtents());
    if (acknowledge && isCrossingPosition(leaving)) acknowledgeCelticCrossing();
    if(surfaceReadingSession && panel()){
      craftedReadingActive=true;
      optionsSession=null;
      setBoardMode(panel(),'crafted');
      if(acknowledge && advanceSurface && leaving>=0){
        setTimeout(()=>{
          const root=panel(),session=surfaceReadingSession;
          if(!root||!session||session.composerOpen||document.querySelector('.relphi-focus-reader'))return;
          // Closing/advancing Focus is the acknowledgement boundary. Never let
          // render/enhance race ahead of the card the user is still reading.
          if(nextUndrawnNativeIndex(root)!=null)return;
          maybeGenerateSurfaceFollowups(root);
        },0);
      }
    }
  }
  function navigateFocusTo(nativeIndex) {
    const next=Number(nativeIndex);
    if (!Number.isInteger(next)) return;
    const leaving=focusIndex;
    if (leaving>=0 && leaving!==next && isCrossingPosition(leaving)) acknowledgeCelticCrossing();
    if (cardAt(next)) openFocus(next);
    else if (surfaceReadingSession || recursionActive() || craftedReadingActive) openAttune(next);
    else drawInto(focusItem(next),next);
  }
  function navigateFocusBy(delta) {
    if (recursionActive()) return navigateRecursionFocusBy(delta);
    const order=orderedNativePositionIndices();
    if (!order.length) return closeFocus({acknowledge:true});
    const currentIndex=order.indexOf(focusIndex);
    const current=currentIndex>=0 ? currentIndex : 0;
    if (delta>0 && current>=order.length-1) {
      if (surfaceReadingSession) {
        closeFocus({acknowledge:true});
      } else if (configuredPositionCount()===0) drawNextLogical(panel());
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
    const snap=optionsBridge()?.capture?.();const meta=snap?.rowPositionMeta?.[targetIndex] || snap?.rowActiveLayout?.positions?.[targetIndex] || {};
    if(snap){
      if(meta.allowReversals!==undefined)snap.rowAllowReversals=meta.allowReversals!==false;
      if(meta.allowRepeats!==undefined)snap.rowAllowRepeats=!!meta.allowRepeats;
      if(String(meta.drawScope||'')==='tags'){
        snap.rowSelectedTags=Array.isArray(meta.keywordTags)?meta.keywordTags.slice():[];
        snap.rowTagMatchMode=meta.keywordMatchMode==='all'?'all':'any';
      }else{
        snap.rowSelectedTags=[];
        snap.rowTagMatchMode='any';
      }
      snap.rowDrawDeck=[];snap.rowDrawDeckSignature='';
      optionsBridge()?.restore?.(snap);
    }
    activeDraw=true;
    // Focus belongs to the referent slot, not necessarily the append slot used
    // internally by the native draw.
    pendingFocusIndex=targetIndex;
    draw.click();
    if (targetIndex!==drawnIndex) prefabBridge()?.swapPositionSlots?.(drawnIndex,targetIndex);
    activeDraw=false;
    if(surfaceReadingSession){
      // The draw itself owns this transition. Wait for the native renderer to
      // put the card in its referent slot, then show that answer. Nothing else
      // in the surface workflow may advance until the user presses Next.
      const expected=targetIndex;
      let attempts=0;
      const showDrawnAnswer=()=>{
        const live=panel();
        if(live && cardAt(expected,live)){
          pendingFocusIndex=null;
          closeAttune();
          openFocus(expected);
          return;
        }
        if(++attempts<40)setTimeout(showDrawnAnswer,50);
      };
      setTimeout(showDrawnAnswer,0);
    } else setTimeout(()=>enhance(panel()),0);
  }
  function nextUndrawnNativeIndex(root=panel()) {
    return orderedNativePositionIndices().find(index=>!cardAt(index,root) && isEmptyItem(focusItem(index,root))) ?? null;
  }
  function drawNextLogical(root=panel()) {
    if (!root || activeDraw) return;
    if (recursionActive()) {
      const session=ensureRecursionSession();
      const next=recursionNextCardIndex(session?.level||1);
      if (next!=null) { openAttune(next); return; }
      if (session?.level<RECURSION_LEVELS && recursionTriadComplete(session.level)) {
        const last=recursionTriadIndices(session.level).slice(-1)[0];
        if (Number.isInteger(last) && cardAt(last)) {
          openFocus(last);
          setTimeout(()=>openRecursionPortal(session.level),0);
        }
      }
      return;
    }
    const next=nextUndrawnNativeIndex(root);
    if (next!=null) { if (surfaceReadingSession || craftedReadingActive) openAttune(next); else drawInto(focusItem(next,root),next); return; }
    if (configuredPositionCount()>0) return;
    const draw=root.querySelector('#drawRandomRowCard');
    if (!draw || draw.disabled) return;
    activeDraw=true;
    pendingFocusIndex=currentCardCount(root);
    draw.click();
    activeDraw=false;
  }

  function installLockedLayoutPointerGuards(root) {
    syncTransformLocks(root);
    root.querySelectorAll('.card-row-board>.card-row-item[data-row-index]>.card-row-drop-card,.card-row-board>.card-row-item[data-row-index]>.card-row-card-wrap').forEach(surface => {
      if (surface.dataset.relphiLockedPointerGuard==='true') return;
      surface.dataset.relphiLockedPointerGuard='true';
      surface.addEventListener('pointerdown', event => {
        if (event.target.closest('button,input,textarea,select,label,[contenteditable="true"],[data-row-transform-handle]')) return;
        const state=currentPrefabState();
        if (state.locked && !state.designMode) { event.stopPropagation(); return; }
        if (!transformLocks().drag && !event.target.closest('[data-row-transform-handle]')) event.stopPropagation();
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
        event.preventDefault(); openFocus(index); return;
      }
      if (isEmptyItem(item)) {
        event.preventDefault(); event.stopImmediatePropagation();
        if (surfaceReadingSession || recursionActive() || craftedReadingActive) openAttune(index); else drawInto(item,index);
      }
    },true);
  }
  function ensureGlobalBoardActions(root) {
    return ensureBoardChrome(root);
  }

  function installTopActions(root) {
    ensureBoardChrome(root);
    const settings=root.querySelector('#relphiBoardSettingsButton');
    if(settings && settings.dataset.relphiSettingsBound!=='true'){
      settings.dataset.relphiSettingsBound='true';
      settings.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();openBoardSettings(root);},true);
    }

    const boardTab=root.querySelector('#drawingBoardBoardTab');
    if(boardTab){
      boardTab.textContent='Free';
      boardTab.setAttribute('aria-label','Free settings');
      if(boardTab.dataset.relphiUnifiedBoardTab!=='true'){
        boardTab.dataset.relphiUnifiedBoardTab='true';
        boardTab.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();switchSettingsMode('free',root);},true);
      }
    }

    const options=root.querySelector('#drawingBoardOptionsButton');
    if(options){
      options.textContent='Crafted';
      options.setAttribute('aria-label','Crafted settings');
      options.setAttribute('aria-expanded',String(settingsOpen&&settingsMode==='crafted'));
      options.onclick=null;
      if(options.dataset.relphiUnifiedOptions!=='true'){
        options.dataset.relphiUnifiedOptions='true';
        options.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();switchSettingsMode('crafted',root);},true);
      }
    }

    const draw=root.querySelector('#drawRandomRowCard');
    if(draw && draw.dataset.relphiUnifiedDraw!=='true'){
      draw.dataset.relphiUnifiedDraw='true';
      draw.addEventListener('click',event=>{
        if(!activeDraw && (surfaceReadingSession || recursionActive() || craftedReadingActive)){
          const next=recursionActive()?recursionNextCardIndex(ensureRecursionSession()?.level||1):nextUndrawnNativeIndex(root);
          if(next!=null){
            event.preventDefault();
            event.stopImmediatePropagation();
            openAttune(next);
            return;
          }
        }
        const freeDraw=!(surfaceReadingSession || recursionActive() || craftedReadingActive || boardHasCraftedStructure(root));
        pendingFocusIndex=currentCardCount(root);
        if(freeDraw){
          const before=currentCardCount(root);
          requestAnimationFrame(()=>requestAnimationFrame(()=>{
            const live=panel();if(!live||currentCardCount(live)<=before)return;
            const bridge=optionsBridge(),snap=bridge?.capture?.();
            if(bridge&&snap){
              const count=currentCardCount(live),scale=1;
              snap.rowEnvelopeLayout={...(snap.rowEnvelopeLayout||{})};
              snap.rowCardTransforms={...(snap.rowCardTransforms||{})};
              for(let i=0;i<count;i++){
                snap.rowEnvelopeLayout[i]={x:i*CARD_W*scale,y:0};
                snap.rowCardTransforms[i]={...(snap.rowCardTransforms[i]||{}),scale,rotation:0,zIndex:i+1};
              }
              bridge.restore(snap);
            }
            requestAnimationFrame(()=>requestAnimationFrame(zoomExtents));
          }));
        }
      },true);
    }
    ensureBoardChrome(root);
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
    root.classList.toggle('relphi-recursion-layout',id===RECURSION_ID || layout.basedOn===RECURSION_ID);
    const snap=isCeltic?currentSnapshot():null;
    const acknowledged=!!snap?.rowPositionMeta?.some?.(meta=>meta?.celticCrossAcknowledged);
    root.classList.toggle('relphi-celtic-crossed',isCeltic&&acknowledged);
  }

  function enhance(root = panel()) {
    if (!root) return;
    const trigger=document.getElementById('relphiOpenDrawingBoardCurrent');
    if (!initialized) initialized=true;
    boardOpen=trigger?.getAttribute('aria-expanded')==='true';
    if(!activeCraftedPath){
      const snap=currentSnapshot()||{};
      activeCraftedPath=String(snap.rowActiveLayout?.relphiCraftedPath||snap.rowPositionMeta?.find?.(meta=>meta?.craftedPath)?.craftedPath||'');
    }
    setBoardMode(root,settingsOpen&&settingsMode==='crafted'?'referents':(craftedReadingActive||boardHasCraftedStructure(root))?'crafted':'board');
    if (!boardOpen) {
      root.hidden=true;
      if (trigger) { trigger.textContent='Open Drawing Board'; trigger.setAttribute('aria-expanded','false'); }
      return;
    }
    root.hidden=false;
    root.removeAttribute('hidden');
    if (migrateLegacyDenseAutoLayout(root)) { requestAnimationFrame(()=>enhance(root)); return; }
    root.classList.toggle('relphi-hide-position-stickers',!showPositionStickers);
    markSemanticPositions(root);
    updateLayoutClasses(root);
    installRecursionBoard(root);
    ensureBoardChrome(root);
    installTopActions(root);
    installPermanentControls(root);
    installBespokeContinuation(root);
    syncZoomToolbarVisibility(root);
    installPinchZoom(root);
    installReadingTextArea(root);
    installExportArea(root);
    installLockedLayoutPointerGuards(root);
    installBoardCapture(root);
    if(settingsOpen)renderBoardSettings(root);
    else {
      root.querySelector('.relphi-reading-options-drawer')?.remove();
      root.querySelector('.relphi-free-settings')?.remove();
      ensureBoardChrome(root);
    }
    // Surface progression is user-paced. Rendering may open the newly drawn
    // card in Focus, but only leaving that Focus may advance to follow-up questions.
    if (recursionActive()) {
      const session=ensureRecursionSession();
      session.complete=recursionEarthIndex()>=0 && !!cardAt(recursionEarthIndex(),root);
      installRecursionBoard(root);
    }
    root.classList.add('relphi-board-ready');
    if(installSacredResumeGate(root))return;
    if (pendingFocusIndex!=null) {
      // pendingFocusIndex is the slot the native draw appended into. A Crafted
      // draw may immediately swap that card into its referent's target slot,
      // so resolve the actual occupied slot before opening Focus.
      let target=pendingFocusIndex;
      if (!cardAt(target,root) && surfaceReadingSession && Number.isInteger(attuneIndex) && cardAt(attuneIndex,root)) target=attuneIndex;
      if (!cardAt(target,root) && surfaceReadingSession) {
        const occupied=orderedNativePositionIndices().filter(index=>!!cardAt(index,root));
        target=occupied.length ? occupied[occupied.length-1] : target;
      }
      if (cardAt(target,root)) {
        pendingFocusIndex=null;
        if (configuredPositionCount()===0) zoomExtents();
        const focusTarget=target;
        setTimeout(()=>openFocus(focusTarget),0);
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
    if (activeLayoutId()==='crowley-harmonic-divination-12') {
      // Clear starts a fresh Opening while preserving the selected method.
      // The helper resets ritual state; Reset Board remains the control that
      // removes the template/settings themselves.
      setTimeout(()=>window.RelphiCrowleyHarmonicBridge?.start?.(),0);
    }
    if (recursionActive()) {
      recursionSession={level:1,maxLevel:1,complete:false};
      recursionPortalLevel=0;
      setTimeout(()=>installRecursionBoard(panel()),0);
    }
    return true;
  }

  function installBespokeContinuation(root=panel()) {
    if(!root)return;
    root.querySelector('.relphi-bespoke-continue')?.remove();
    const bespoke=bespokeEditingAllowed(root)&&craftedReadingActive;
    const draw=root.querySelector('#drawRandomRowCard');
    if(draw&&bespoke){
      const complete=nextUndrawnNativeIndex(root)==null;
      draw.disabled=complete;
      draw.setAttribute('aria-disabled',String(complete));
      draw.title=complete?'All Bespoke questions have cards.':'Draw the next Bespoke card';
    }
    if(!bespoke)return;
    const actions=draw?.parentElement;
    if(!actions)return;
    const button=document.createElement('button');
    button.type='button';
    button.className='relphi-bespoke-continue relphi-bespoke-ask-another';
    button.textContent='＋ Ask another question';
    button.addEventListener('click',promptForBespokeQuestion);
    const undo=root.querySelector('#undoShortList');
    if(undo?.parentElement===actions) actions.insertBefore(button,undo);
    else actions.insertBefore(button,actions.firstChild);
  }

  function globalCapture(event) {
    const root=panel();
    const openCloseTrigger=event.target.closest?.('#relphiOpenDrawingBoardCurrent');
    if(openCloseTrigger){
      // The workflow owns the visible open/closed state once enhanced. The native
      // Tarot handler can reopen/rerender the panel, so consume this command here.
      event.preventDefault();
      event.stopImmediatePropagation();
      setBoardOpen(!boardOpen);
      return;
    }
    const settingsTrigger=event.target.closest?.('#shortListPanel #relphiBoardSettingsButton');
    if(settingsTrigger&&root?.contains(settingsTrigger)){
      event.preventDefault();
      event.stopImmediatePropagation();
      openBoardSettings(root);
      return;
    }
    const boardTrigger=event.target.closest?.('#shortListPanel #drawingBoardBoardTab');
    if(boardTrigger&&root?.contains(boardTrigger)){
      event.preventDefault();
      event.stopImmediatePropagation();
      switchSettingsMode('free',root);
      return;
    }
    const optionsTrigger=event.target.closest?.('#shortListPanel #drawingBoardOptionsButton');
    if(optionsTrigger&&root?.contains(optionsTrigger)){
      event.preventDefault();
      event.stopImmediatePropagation();
      switchSettingsMode('crafted',root);
      return;
    }
    const clearCardsTrigger=event.target.closest?.('#shortListPanel #clearShortListCardsOnly');
    if (clearCardsTrigger && root?.contains(clearCardsTrigger)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      clearCardsOnly(root);
      return;
    }
    const resetBoardTrigger=event.target.closest?.('#shortListPanel #relphiResetBoard');
    if (resetBoardTrigger && root?.contains(resetBoardTrigger)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      resetBoardGlobal(root);
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
    const positionSticker=event.target.closest?.('#shortListPanel .card-row-position-panel');
    if(positionSticker&&root?.contains(positionSticker)&&(craftedReadingActive||surfaceReadingSession||recursionActive()||boardHasCraftedStructure(root))){
      // Once a reading has begun, its questions/referents are part of the reading record.
      // A sticker click must not fall through to legacy/custom-layout question editing.
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
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
          if (surfaceReadingSession || recursionActive()) openAttune(index); else drawInto(item,index);
          return;
        }
      }
    }
    if (openTool && !event.target.closest?.('.relphi-workspace-tools')) {
      openTool='';
      enhance(panel());
    }
  }

  function launchBespokeQuestion(question) {
    const root=panel();
    const text=String(question||'').trim();
    if(!root||!text||!optionsBridge()||!prefabBridge())return false;
    // Clear first: clearCraftedStructure restores a snapshot whose board-open
    // state may predate this launch. Open only after the reset so the launch
    // cannot be hidden again by that restore.
    if(currentCardCount(root)||boardHasCraftedStructure(root))clearCraftedStructure(root);
    setBoardOpen(true);
    activeCraftedPath='bespoke';
    optionsSession=null;
    beginOptionsSession();
    optionsSession.path='bespoke';
    optionsSession.draft={
      ...optionsSession.draft,
      templateId:'',
      basedOnTemplateId:'',
      templateName:'',
      labels:[text],
      positionPacks:['full'],
      positionSettings:[{pack:'full',reversals:true,repeats:false,cardCount:1,linkTo:''}],
      pack:'full',
      reversals:true,
      repeats:false,
      stickers:true
    };
    if(!launchConfiguredReading(root,clone(optionsSession.draft)))return false;
    root.scrollIntoView?.({behavior:'smooth',block:'start'});
    setTimeout(()=>{const live=panel();if(!live)return;const next=nextUndrawnNativeIndex(live);if(next!=null)openAttune(next);},0);
    return true;
  }

  function appendBespokeQuestion(question) {
    const root=panel(),bridge=optionsBridge();
    const text=String(question||'').trim();
    if(!root||!bridge||!text||!bespokeEditingAllowed(root))return false;
    const snap=bridge.capture();if(!snap)return false;
    const labels=Array.isArray(snap.shortListPositionLabels)?snap.shortListPositionLabels.slice():[];
    if(labels.length>=MAX_POSITIONS)return false;
    const originalMeta=Array.isArray(snap.rowPositionMeta)?snap.rowPositionMeta.map(item=>clone(item)||{}):[];
    labels.push(text);
    const positions=genericPositions(labels);
    snap.shortListPositionLabels=labels;
    snap.shortListPositionCardIds=Array.from({length:labels.length},(_,index)=>String(snap.shortListPositionCardIds?.[index]||''));
    snap.rowEnvelopeLayout={};snap.rowCardTransforms={};
    snap.rowPositionMeta=positions.map((item,index)=>{
      snap.rowEnvelopeLayout[index]={x:item.transform.x*CANVAS_W,y:item.transform.y*CANVAS_H};
      snap.rowCardTransforms[index]={scale:item.transform.scale,rotation:item.transform.rotation||0,zIndex:item.transform.zIndex||1};
      return {...(originalMeta[index]||{}),id:item.id,drawScope:originalMeta[index]?.drawScope||'full',allowReversals:originalMeta[index]?.allowReversals??true,allowRepeats:originalMeta[index]?.allowRepeats??false,cardCount:1,craftedPath:'bespoke',questionText:labels[index],openTransform:null};
    });
    snap.rowActiveLayout={version:1,id:'custom-active',name:String(snap.rowActiveLayout?.name||'Bespoke'),cardCount:labels.length,source:'custom',editable:true,basedOn:snap.rowActiveLayout?.basedOn||null,relphiCraftedPath:'bespoke',positions:positions.map((item,index)=>({...item,drawOrder:index+1,drawScope:snap.rowPositionMeta[index].drawScope,allowReversals:snap.rowPositionMeta[index].allowReversals,allowRepeats:snap.rowPositionMeta[index].allowRepeats,cardCount:1})),rules:{allowReversals:snap.rowAllowReversals!==false,allowRepeats:!!snap.rowAllowRepeats,drawScope:snap.rowDrawScope||'full'}};
    snap.rowLayoutLocked=false;
    bridge.restore(snap);
    craftedReadingActive=true;activeCraftedPath='bespoke';
    setBoardMode(root,'crafted');
    setTimeout(()=>{const live=panel();if(!live)return;markSemanticPositions(live);updateLayoutClasses(live);zoomExtents();const next=nextUndrawnNativeIndex(live);if(next!=null)openAttune(next);},0);
    return true;
  }

  function promptForBespokeQuestion() {
    const question=window.prompt('Ask another question');
    if(question!=null&&String(question).trim())appendBespokeQuestion(question);
  }

  window.RelphiLaunchBespokeQuestion = launchBespokeQuestion;
  window.RelphiAppendBespokeQuestion = appendBespokeQuestion;
  window.RelphiDrawingBoardEnsureTopActions = ensureBoardChrome;

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
    const attune=document.querySelector('.relphi-attune-reader');
    if (attune) closeAttune();
    else if (reader) closeFocus({acknowledge:true});
    else if (optionsSession) { /* Mode is permanent; Escape does not collapse Crafted mode. */ }
    else if (openTool) { openTool=''; enhance(panel()); }
  });
  document.addEventListener('relphi:drawing-board-rendered',()=>enhance(panel()));
  window.addEventListener('relphi:tarot-enhancements-ready',()=>enhance(panel()));
  let lastBoardViewportWidth=Math.round(window.innerWidth||document.documentElement.clientWidth||0);
  window.addEventListener('resize',()=>{
    const nextWidth=Math.round(window.innerWidth||document.documentElement.clientWidth||0);
    const widthChanged=Math.abs(nextWidth-lastBoardViewportWidth)>2;
    lastBoardViewportWidth=nextWidth;
    // Mobile browser chrome changes the visual viewport height while scrolling.
    // Do not refit the board for height-only resize events; that makes card art jump.
    if(boardOpen&&widthChanged)requestAnimationFrame(()=>zoomExtents());
  });

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
  function bootUntilReady(attempt=0){
    if(boot()) return;
    if(attempt<80) setTimeout(()=>bootUntilReady(attempt+1),100);
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>bootUntilReady(),{once:true});
  else bootUntilReady();
})();
