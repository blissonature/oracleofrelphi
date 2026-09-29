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
  const START_EDGE_GUTTER = 4;
  const MAX_POSITIONS = 50; // 10×5 dense packing stays above the supported .32 card scale.

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
  const BOARD_TRANSFORM_LOCKS_KEY = 'relphiBoardTransformLocksV1';
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
  function transformEditingAllowed(root=panel()) {
    if(!root)return false;
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
      name:'Opening of the Key · First Operation',
      cardCount:12,
      source:'shipped',
      editable:false,
      helper:'crowley-harmonic',
      positions:Array.from({length:12}, (_, index) => {
        const angle=(-90 + index*30) * Math.PI / 180;
        const x=.43 + Math.cos(angle)*.34;
        const y=.39 + Math.sin(angle)*.31;
        return {
          id:'crowley-' + (index+1),
          label:String(index+1),
          drawOrder:index+1,
          transform:transform(x,y,0,.43),
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
    return { templateId:'', basedOnTemplateId:'', labels:[], positionPacks:[], positionSettings:[], pack:'full', keywordTags:[], keywordMatchMode:'any', stickers:true, reversals:true, repeats:false, templateName:'' };
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
  function boardCanReset(root=panel()) {
    const snap=currentSnapshot()||{};
    const background=boardBackgroundDefault();
    const backgroundChanged=String(snap.rowTableColor||'#7d1f28')!==String(background.color||'#7d1f28') ||
      String(snap.rowTableImage||'')!==(background.mode==='image'?String(background.image||''):'');
    const configurationChanged=String(snap.rowEnvelopeColor||'#f3f0ea')!=='#f3f0ea' ||
      snap.rowSnapEnabled===false ||
      String(snap.rowSnapGrid||'one-eighth')!=='one-eighth' ||
      snap.rowRotationSnapEnabled===false ||
      Number(snap.rowRotationSnapDegrees||15)!==15 ||
      backgroundChanged ||
      Object.keys(snap.rowEnvelopeLayout||{}).length>0 ||
      Object.keys(snap.rowCardTransforms||{}).length>0;
    return currentCardCount(root)>0 ||
      boardHasCraftedStructure(root) ||
      !freeSettingsAreDefault() ||
      configurationChanged;
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
      topActions.appendChild(clear);
    }
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
    const host=settingsMode==='free'
      ? body.querySelector('.relphi-free-settings')
      : body.querySelector('.relphi-reading-options-drawer');
    if(!host)return;

    let section=host.querySelector(':scope > .relphi-board-configuration');
    if(!section){
      section=document.createElement('details');
      section.className='relphi-board-configuration relphi-appearance-disclosure';
      const footer=host.querySelector('.relphi-board-settings-footer,.relphi-options-commitbar');
      if(footer)host.insertBefore(section,footer); else host.appendChild(section);
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
    controlGroup.innerHTML='<strong>Card controls</strong><div class="relphi-control-toggles"></div>';
    const controlToggles=controlGroup.querySelector('.relphi-control-toggles');
    const locks=transformLocks();
    [['drag','Drag'],['rotation','Rotation'],['scale','Scale']].forEach(([key,label])=>{
      const row=document.createElement('label');
      row.innerHTML='<input type="checkbox" '+(locks[key]?'checked':'')+'> '+label;
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
    const path=activeCraftedPath||'bespoke';
    optionsSession = { baseline:currentSnapshot(), draft:draftFromState(), path, building:{element:'',planet:'',aspect:'',sign:'',house:'',need:''}, suggestions:[], suggestionPacks:[], surfaceSelected:{}, sacredCardSource:'digital' };
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

  function setBoardOpen(open, { fit = false } = {}) {
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
      requestAnimationFrame(() => root.scrollIntoView({ behavior:'smooth', block:'start' }));
      if (fit) setTimeout(zoomExtents, 0);
    } else {
      closeFocus({ acknowledge:true, advanceSurface:false });
      optionsSession = null;
      freeSettingsSession = null;
      settingsBaseline = null;
      settingsOpen = false;
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

  function templateCountLabel(item) {
    return item?.id===RECURSION_ID ? '22 cards' : String(item?.cardCount || 0);
  }
  function optionTemplateMarkup(draft) {
    const entries = allTemplates();
    return `<option value="">Custom</option>${entries.map(item => `<option value="${escapeHtml(item.id)}" ${draft.templateId===item.id?'selected':''}>${escapeHtml(templateCountLabel(item))} · ${escapeHtml(item.name)}</option>`).join('')}`;
  }
  function packItems(){ return [
      ['full','Full Pack'],['shown','Shown cards'],['uhn','Universal Human Needs'],['majors','Majors'],
      ['primordial-majors','Primordial Element Majors'],['planetary-majors','Planetary Majors'],['zodiac-majors','Zodiac Majors'],['aces','Aces'],['courts','Courts'],
      ['pips','Pips'],['decans','Decan pips'],['wands','Wands'],['cups','Cups'],['swords','Swords'],['pentacles','Pentacles / Disks'],['tags','Keywords / Tags']
    ]; }
  function packLabel(value){ return packItems().find(([id])=>id===value)?.[1] || value || 'Full Pack'; }
  function packOptions(value) {
    const items = [
      ['full','Full Pack'],['shown','Shown cards'],['uhn','Universal Human Needs'],['majors','Majors'],
      ['primordial-majors','Primordial Element Majors'],['planetary-majors','Planetary Majors'],['zodiac-majors','Zodiac Majors'],['aces','Aces'],['courts','Courts'],
      ['pips','Pips'],['decans','Decan pips'],['wands','Wands'],['cups','Cups'],['swords','Swords'],['pentacles','Pentacles / Disks'],['tags','Keywords / Tags']
    ];
    return items.map(([id,label])=>`<option value="${id}" ${value===id?'selected':''}>${label}</option>`).join('');
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

  function labelsMarkup(labels,draft=null) {
    const rows=labels.length ? labels : [''];
    return rows.map((label,index)=>{
      const inherited=draft?.positionSettings?.[index] || draft?.positionSettings?.[index-1] || {pack:draft?.pack||'full',reversals:draft?.reversals!==false,repeats:!!draft?.repeats,cardCount:1,linkTo:''};
      if(draft && !draft.positionSettings?.[index]){
        draft.positionSettings ||= [];
        draft.positionSettings[index]={pack:inherited.pack||'full',reversals:inherited.reversals!==false,repeats:!!inherited.repeats};
        draft.positionPacks ||= []; draft.positionPacks[index]=draft.positionSettings[index].pack;
      }
      const settings=draft?.positionSettings?.[index]||inherited;
      return `<div class="relphi-label-row relphi-bespoke-question-row" data-label-row="${index}"><span>${index+1}</span><div class="relphi-bespoke-question-main"><input type="text" value="${escapeHtml(label)}" aria-label="Position ${index+1} label" data-position-label="${index}"><div class="relphi-bespoke-question-settings"><label>Sub-pack<select data-position-pack="${index}">${packOptions(settings.pack||'full')}</select></label><label>Cards<input type="number" min="1" max="12" value="${Math.max(1,Number(settings.cardCount)||1)}" data-position-card-count="${index}" aria-label="Cards to draw for question ${index+1}"></label><label>Share card with<select data-position-link="${index}"><option value="">No link</option>${rows.map((other,j)=>j===index?'':`<option value="${j}" ${String(settings.linkTo)===String(j)?'selected':''}>Question ${j+1}</option>`).join('')}</select></label></div><details class="relphi-question-advanced"><summary>Advanced</summary><div><label><input type="checkbox" data-position-reversals="${index}" ${settings.reversals!==false?'checked':''}> Reversals</label><label><input type="checkbox" data-position-repeats="${index}" ${settings.repeats?'checked':''}> Repeats</label></div></details></div><button type="button" data-remove-label="${index}" aria-label="Remove position ${index+1}">×</button></div>`;
    }).join('');
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
    const cardSource=session.sacredCardSource==='physical'?'physical':session.sacredCardSource==='digital'?'digital':'';
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
  function astrologyAnalysisMarkup(analysis,session) {
    if(!analysis)return '';const disabled=new Set(session?.astrologyDisabledEvidence||[]),checked=item=>disabled.has(astrologyEvidenceKey(item))?'':' checked';
    const evidenceBox=(item,label)=>'<label class="relphi-astrology-evidence"><input type="checkbox" data-astrology-evidence="'+escapeHtml(astrologyEvidenceKey(item))+'"'+checked(item)+'><span>'+label+'</span></label>';
    const hits=analysis.hits.map(h=>evidenceBox({kind:'hit',id:h.id},'<strong>'+escapeHtml(h.name)+'</strong> ×'+h.count)).join('');
    const summaries=[...analysis.patterns.map((p,i)=>({kind:'pattern',id:p.type+':'+p.value+':'+i,value:p.value,count:p.count||0,type:p.type})),...analysis.topRulers.map(x=>({...x,kind:'ruler',id:x.value,type:'ruler'})),...(analysis.polarity.Active||analysis.polarity.Passive?[{kind:'polarity',id:'active-passive',value:'Active '+analysis.polarity.Active+' · Passive '+analysis.polarity.Passive,count:analysis.polarity.Active+analysis.polarity.Passive,type:'polarity'}]:[]),...analysis.topTags.slice(0,10).map(x=>({...x,kind:'tag',id:x.value,type:'tag'}))].sort((a,b)=>(b.count||0)-(a.count||0));
    const pd=analysis.polarityDiagnostic,polarityDetail=pd?' <small class="relphi-polarity-bin">'+pd.winner+' '+(pd.share*100).toFixed(1)+'% · excess '+(pd.excess*100).toFixed(1)+' points → <strong>'+pd.sign+'</strong> · bin '+(pd.index+1)+'/6</small>':'';
    const summary=summaries.map(x=>evidenceBox(x,'<strong>'+escapeHtml(x.value)+'</strong> · '+escapeHtml(x.type)+(x.count?' ×'+x.count:'')+(x.kind==='polarity'?polarityDetail:''))).join('');
    const diagnostic=pd?'<div class="relphi-polarity-diagnostic"><strong>Experimental polarity → sign test</strong><span>'+pd.winner+' selects the '+(pd.winner==='Active'?'Yang':'Yin')+' signs; '+(pd.excess*100).toFixed(1)+'-point excess selects bin '+(pd.index+1)+'/6 → <strong>'+pd.sign+'</strong>.</span><span class="relphi-polarity-test-result"><strong>Independent check:</strong> '+(pd.observed?escapeHtml(pd.sign)+' is independently concentrated ×'+pd.observedCount:'no independent '+escapeHtml(pd.sign)+' concentration')+'.</span><small>Experimental derived-sign evidence — included in the question generator while Polarity is checked.</small></div>':'';
    const enabled=new Set(analysis.evidence.map(astrologyEvidenceKey).filter(key=>!disabled.has(key))),questionList=astrologyQuestionSuggestions(analysis,enabled),questions=questionList.map((q,i)=>'<label class="relphi-astrology-question"><input type="checkbox" data-astrology-question="'+i+'" '+(i<3?'checked':'')+'><span><strong>'+escapeHtml(q.text)+'</strong><small>'+escapeHtml(packLabel(q.pack))+'</small></span></label>').join('');
    session.astrologyVisibleQuestions=questionList;
    const skyChannels=analysis.perSky.map(s=>{const items=s.skyEvidence.filter(x=>['placement','house','aspect','configuration'].includes(x.kind)).map(x=>evidenceBox(x,'<strong>'+escapeHtml(x.value)+'</strong>'+(x.detail?' · '+escapeHtml(x.detail):''))).join('');return items?'<section><h4>Sky evidence · '+escapeHtml(s.name)+'</h4><div class="relphi-evidence-list">'+items+'</div></section>':''}).join('');
    const ownPack=String(session?.astrologyOwnPack||'');
    const ownPackOptions='<option value="">Choose sub-pack…</option>'+packOptions(ownPack);
    return '<div class="relphi-astrology-analysis"><section><h4>Card Hits</h4><div class="relphi-evidence-list">'+hits+'</div></section>'+skyChannels+'<section><h4>Patterns & concentrations</h4><div class="relphi-evidence-list">'+summary+'</div>'+diagnostic+'</section><section class="relphi-astrology-questions"><div class="relphi-astrology-question-head"><h4>Suggested questions</h4><label><input type="checkbox" data-astrology-select-all> Select all</label></div><p class="relphi-question-prompt">Checked evidence is factored into these suggestions. Accepting a generated question also accepts its assigned sub-pack. To use a different sub-pack, author your own question below.</p>'+questions+'<div class="relphi-astrology-own-question"><label><span>Your question</span><input type="text" data-astrology-own-question value="'+escapeHtml(session?.astrologyOwnQuestion||'')+'" placeholder="Write your own question…"></label><label><span>Sub-pack</span><select data-astrology-own-pack>'+ownPackOptions+'</select></label></div></section></div>';
  }
  function astrologySavedSkies() {
    try {
      const list=JSON.parse(localStorage.getItem('relphiSkyLibraryV1')||'[]');
      return Array.isArray(list) ? list.filter(record=>record&&String(record.name||'').trim()&&record.placements&&Object.keys(record.placements).length) : [];
    } catch (_) { return []; }
  }
  function astrologySavedSkyOptions(selectedId) {
    const records=astrologySavedSkies();
    return records.map(record=>'<option value="saved:'+escapeHtml(String(record.id||record.name))+'" '+(selectedId===String(record.id||record.name)?'selected':'')+'>'+escapeHtml(String(record.name||'Saved sky'))+'</option>').join('');
  }
  function astrologySkySourceMarkup(slot,session,disabled=false) {
    const key=slot==='B'?'astrologySkyBSource':'astrologySkyASource';
    const value=session[key]||'here-now';
    const selectedId=value.startsWith('saved:')?value.slice(6):'';
    const records=astrologySavedSkies();
    return '<label class="relphi-astrology-sky-source"><select aria-label="'+(slot==='B'?'Second sky':'Sky')+'" data-astrology-sky-source="'+slot+'" '+(disabled?'disabled':'')+'>'+
      '<option value="here-now" '+(value==='here-now'?'selected':'')+'>Here & Now</option>'+
      (records.length?'<optgroup label="Saved Skies">'+astrologySavedSkyOptions(selectedId)+'</optgroup>':'')+
      '</select>'+(records.length?'':'<small class="relphi-saved-sky-empty">No Saved Skies were found in the shared Sky Chart library.</small>')+'</label>';
  }
  function astrologyResolveSavedSky(source) {
    if(!String(source||'').startsWith('saved:')) return null;
    const ref=String(source).slice(6);
    return astrologySavedSkies().find(record=>String(record.id||record.name)===ref)||null;
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
    const count=Math.max(0,Math.min(2,Number(session.astrologySkyCount)||0));
    return '<section class="relphi-referent-panel relphi-astrology-surface">'+
      '<div class="relphi-options-subhead"><div><strong>Astrological Tarot Reading</strong></div></div>'+
      astrologyHouseSystemMarkup(session,disabled)+
      '<div class="relphi-astrology-sky-sources">'+
        (count>0?astrologySkySourceMarkup('A',session,disabled):'')+
        (count>1?astrologySkySourceMarkup('B',session,disabled):'')+
        (count<2?'<button type="button" class="relphi-add-sky" data-add-astrology-sky '+(disabled?'disabled':'')+'>+ Add a sky</button>':'')+
      '</div>'+
      (count?'<div class="relphi-astrology-bridge-status"><strong>Sky connection</strong><span data-astrology-sky-status>'+(session.astrologyAnalysis?'Review the evidence below. Select suggested questions or write your own before starting the reading.':'Ready to connect.')+'</span><button type="button" id="relphiConnectSky" '+(disabled?'disabled':'')+'>Use '+(count>1?'These Skies':'This Sky')+'</button></div>':'')+
      (session.astrologyAnalysis?astrologyAnalysisMarkup(session.astrologyAnalysis,session):'')+
      '</section>';
  }

  function bespokeMarkup(draft,hasCards) {
    const clonedFrom=!draft.templateId&&draft.basedOnTemplateId?templateById(draft.basedOnTemplateId):null;
    return '<section class="relphi-referent-panel">'+
      (clonedFrom?'<div class="relphi-template-clone-note"><strong>Editing a copy of '+escapeHtml(clonedFrom.name)+'</strong><span>The original template stays untouched. Name and save this Bespoke version if you want to keep it; you can also continue without saving.</span></div>':'')+
      '<div class="relphi-options-subhead"><div><strong>Bespoke</strong><span>Write the referents for this reading.</span></div><button type="button" id="relphiAddPosition" '+(hasCards||draft.labels.length>=MAX_POSITIONS?'disabled':'')+'>Add referent</button></div>'+
      '<label class="relphi-bulk-referents">Enter several at once<textarea id="relphiBulkReferents" rows="3" placeholder="Situation, Challenge, Strategy" '+(hasCards?'disabled':'')+'></textarea></label>'+
      '<button type="button" id="relphiParseReferents" '+(hasCards?'disabled':'')+'>Parse comma-separated referents</button>'+
      '<div id="relphiPositionLabels">'+labelsMarkup(draft.labels,draft)+'</div>'+
      '<div class="relphi-template-save"><input id="relphiTemplateName" type="text" maxlength="60" placeholder="Template name" value="'+escapeHtml(draft.templateName)+'" '+(hasCards?'disabled':'')+'><button type="button" id="relphiSaveTemplate" '+(hasCards?'disabled':'')+'>Save template</button></div>'+
      '</section>';
  }
  function templatesMarkup(draft,hasCards) {
    const selected=templateById(draft.templateId||draft.basedOnTemplateId);
    const positions=selected?.positions?.slice?.().sort((a,b)=>a.drawOrder-b.drawOrder) || [];
    const preview=selected?.id===RECURSION_ID
      ? '<div class="relphi-recursion-template-note"><strong>Seven recursive levels · 22 cards</strong><span>Each level uses the Relphi logo: Mem, Aleph, and Shin occupy the three black circles. The red circle is Earth, the portal to the next level; on Level 7 it receives card 22. The seven-level depth control is the 1×7 Veilva.</span></div>'
      : positions.length
        ? '<ol class="relphi-template-preview">'+positions.map(item=>'<li>'+escapeHtml(item.label)+'</li>').join('')+'</ol>'
        : '<p class="relphi-referent-empty">Choose a template to preview its referents.</p>';
    return '<section class="relphi-referent-panel"><div class="relphi-options-subhead"><div><strong>Templates</strong><span>Start from an established or saved spread.</span></div></div>'+
      '<label class="relphi-options-field">Template<select id="relphiSpreadTemplateSelect" '+(hasCards?'disabled':'')+'>'+optionTemplateMarkup(draft)+'</select></label>'+
      preview+
      (selected?'<div class="relphi-template-modify"><button type="button" id="relphiModifyTemplate" '+(hasCards?'disabled':'')+'>Modify a copy</button><span>Clones this template into Bespoke so the original remains unchanged.</span></div>':'')+
      '</section>';
  }
  function pathPanelMarkup(session,hasCards) {
    const draft=session.draft;
    if (!session.path) return '<p class="relphi-referent-intro">Choose a referent path. Drawing itself stays in the Board tab.</p>';
    if (session.path==='bespoke') return bespokeMarkup(draft,hasCards);
    if (session.path==='templates') return templatesMarkup(draft,hasCards);
    if (session.path==='blocks') return '<section class="relphi-referent-panel"><div class="relphi-options-subhead"><div><strong>Building Blocks</strong><span>Choose Relphi symbols deliberately and let them formulate candidate referents.</span></div></div>'+buildingControlsMarkup(session,hasCards)+suggestionMarkup(session,hasCards)+'</section>';
    if (session.path==='surface') return '<section class="relphi-referent-panel"><div class="relphi-options-subhead"><div><strong>See What Surfaces</strong><span>Choose the questions for the first exploration. The cards themselves surface in sacred reading mode.</span></div></div>'+surfaceChoicesMarkup(session,hasCards)+'</section>';
    if (session.path==='astro') return astrologySurfaceMarkup(session,hasCards);
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
    drawer.setAttribute('aria-label','Crafted Draw settings');
    draft.stickers=true;
    if(!['digital','physical'].includes(session.sacredCardSource))session.sacredCardSource='digital';
    const cardSourceSettings='<fieldset class="relphi-sacred-card-source relphi-sacred-card-source--promoted"><legend>Method</legend><label class="relphi-sacred-card-source-choice"><input type="radio" name="relphiSacredCardSource" data-sacred-card-source value="digital" '+(session.sacredCardSource!=='physical'?'checked ':'')+'><span><strong>Digital</strong><small>Relphi draws the cards.</small></span></label><label class="relphi-sacred-card-source-choice"><input type="radio" name="relphiSacredCardSource" data-sacred-card-source value="physical" '+(session.sacredCardSource==='physical'?'checked ':'')+'><span><strong>Physical</strong><small>You draw and record them.</small></span></label></fieldset>';
    const advancedDrawSettings='<div class="relphi-free-toggles relphi-draw-promoted"><label><input id="relphiDraftReversals" type="checkbox" '+(draft.reversals?'checked':'')+'> Reversals</label><label><input id="relphiDraftRepeats" type="checkbox" '+(draft.repeats?'checked':'')+'> Repeats</label></div>';
    const drawSettingsMarkup=(session.path==='surface'||session.path==='astro')
      ? '<section class="relphi-referent-settings" aria-label="Draw settings"><strong class="relphi-referent-settings-title">Draw settings</strong>'+cardSourceSettings+advancedDrawSettings+'</section>'
      : '<section class="relphi-referent-settings" aria-label="Draw settings"><strong class="relphi-referent-settings-title">Draw settings</strong><div class="relphi-draw-options"><label>Pack<select id="relphiDraftPack">'+packOptions(draft.pack)+'</select></label>'+keywordDraftMarkup(draft)+'</div>'+cardSourceSettings+advancedDrawSettings+'</section>';
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
        drawSettingsMarkup+
        (session.path==='surface'&&!session.pathCollapsed
          ? (()=>{const count=selectedSurfaceKinds(session).length,ready=count>0,source=session.sacredCardSource==='physical'?'Physical':'Digital';return '<aside class="relphi-surface-readiness '+(ready?'is-ready':'')+'" data-surface-readiness role="status" aria-live="polite">'+
              '<div class="relphi-surface-readiness-rail" aria-label="Crafted reading progress">'+
                '<div class="relphi-surface-readiness-step is-complete" data-readiness-step="path"><i aria-hidden="true"></i><strong>Path</strong><small>See What Surfaces</small></div>'+
                '<div class="relphi-surface-readiness-step is-complete" data-readiness-step="source"><i aria-hidden="true"></i><strong>Card source</strong><small data-surface-source-status>'+source+'</small></div>'+
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
      session.astrologySkyCount=Math.min(2,(Number(session.astrologySkyCount)||0)+1);
      renderOptions(root,{preserveScroll:true});
    });
    drawer.querySelectorAll('[data-astrology-evidence]').forEach(box=>box.addEventListener('change',()=>{const disabled=new Set(session.astrologyDisabledEvidence||[]);if(box.checked)disabled.delete(box.dataset.astrologyEvidence);else disabled.add(box.dataset.astrologyEvidence);session.astrologyDisabledEvidence=[...disabled];renderOptions(root);}));
    drawer.querySelector('[data-astrology-own-question]')?.addEventListener('input',event=>{session.astrologyOwnQuestion=event.target.value;});
    drawer.querySelector('[data-astrology-own-pack]')?.addEventListener('change',event=>{session.astrologyOwnPack=event.target.value||'';});
    drawer.querySelector('[data-astrology-select-all]')?.addEventListener('change',event=>drawer.querySelectorAll('[data-astrology-question]').forEach(box=>box.checked=event.target.checked));
    drawer.querySelector('[data-astrology-advanced]')?.addEventListener('toggle',event=>{session.astrologyAdvanced=!!event.currentTarget.open;});
    drawer.querySelector('[data-astrology-house-system]')?.addEventListener('change',event=>{session.astrologyHouseSystem=event.target.value;session.astrologyAdvanced=true;session.astrologyAnalysis=null;session.astrologyResolved=null;renderOptions(root);});
    drawer.querySelectorAll('[data-astrology-sky-source]').forEach(select=>select.addEventListener('change',()=>{
      const slot=select.dataset.astrologySkySource==='B'?'B':'A';
      session[slot==='B'?'astrologySkyBSource':'astrologySkyASource']=select.value||'here-now';
    }));
    drawer.querySelector('#relphiConnectSky')?.addEventListener('click',async()=>{
      const button=drawer.querySelector('#relphiConnectSky'),count=Math.max(1,Math.min(2,Number(session.astrologySkyCount)||1)),mode=count>1?'AB':'A';
      const status=drawer.querySelector('[data-astrology-sky-status]');
      if(button){button.disabled=true;button.textContent='Preparing…'} if(status)status.textContent='Resolving the selected sky'+(mode==='AB'?'s':'')+'…';
      try{
        const skyA=await astrologyResolveSource(session.astrologySkyASource||'here-now');
        const skyB=mode==='AB'?await astrologyResolveSource(session.astrologySkyBSource||'here-now'):null;
        session.astrologyResolved={mode,skyA,skyB,houseSystem:session.astrologyHouseSystem||'whole-sign',resolvedAt:new Date().toISOString()};
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
      draft.templateId=templateSelect.value;
      draft.basedOnTemplateId=templateSelect.value;
      if (chosen) {
        const ordered=chosen.positions.slice().sort((a,b)=>a.drawOrder-b.drawOrder);
        draft.labels=ordered.map(item=>item.label);
        draft.positionPacks=ordered.map(item=>String(item.drawScope||''));
        draft.pack=chosen.rules?.drawScope || draft.pack;
        draft.reversals=chosen.rules?.allowReversals !== false;
        draft.repeats=!!chosen.rules?.allowRepeats;
        draft.templateName=chosen.name;
      } else {
        draft.basedOnTemplateId='';
        draft.templateName='';
        draft.labels=[];
        draft.positionPacks=[];
      }
      renderOptions(root);
    });
    drawer.querySelector('#relphiModifyTemplate')?.addEventListener('click',()=>{
      const chosen=templateById(draft.templateId||draft.basedOnTemplateId);
      if(!chosen||hasCards)return;
      draft.templateId='';
      draft.basedOnTemplateId=chosen.id;
      draft.templateName='';
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
    drawer.querySelector('#relphiParseReferents')?.addEventListener('click',()=>acceptCommaList(drawer.querySelector('#relphiBulkReferents')?.value || ''));
    labelsList?.addEventListener('paste',event=>{
      const row=event.target.closest('.relphi-label-row');
      if (!row || !event.target.matches('[data-position-label]') || Number(row.dataset.labelRow)!==0) return;
      const pasted=event.clipboardData?.getData('text') || '';
      if (!pasted.includes(',') || parseBulkQuestions(pasted).length<2) return;
      event.preventDefault();
      queueMicrotask(()=>{ if (optionsSession && labelsList?.isConnected) acceptCommaList(pasted); });
    });
    labelsList?.addEventListener('input',event=>{
      const row=event.target.closest('.relphi-label-row');
      if (!row || !event.target.matches('[data-position-label]')) return;
      const index=Number(row.dataset.labelRow);
      while (draft.labels.length<=index) draft.labels.push('');
      draft.labels[index]=event.target.value;
      draft.positionPacks=[];
      markQuestionEditCustom(drawer,draft);
    });
    labelsList?.addEventListener('change',event=>{
      const row=event.target.closest('.relphi-label-row');
      if (!row || !event.target.matches('[data-position-label]') || Number(row.dataset.labelRow)!==0) return;
      const value=event.target.value;
      queueMicrotask(()=>{ if (optionsSession && labelsList?.isConnected) acceptCommaList(value); });
    });
    labelsList?.addEventListener('click',event=>{
      const button=event.target.closest('[data-remove-label]');
      if (!button) return;
      const index=Number(button.dataset.removeLabel);
      draft.labels.splice(index,1);
      draft.positionPacks?.splice?.(index,1);
      draft.positionSettings?.splice?.(index,1);
      markQuestionEditCustom(drawer,draft); renderOptions(root);
    });
    drawer.querySelector('#relphiAddPosition')?.addEventListener('click',()=>{
      if (draft.labels.length>=MAX_POSITIONS) return;
      const previous=draft.positionSettings?.[draft.positionSettings.length-1] || {pack:draft.pack||'full',reversals:draft.reversals!==false,repeats:!!draft.repeats,cardCount:1,linkTo:''};
      draft.labels.push(''); draft.positionPacks?.push?.(previous.pack||'full'); draft.positionSettings ||= []; draft.positionSettings.push({...previous}); markQuestionEditCustom(drawer,draft); renderOptions(root);
    });
    drawer.querySelectorAll('[data-position-pack]').forEach(select=>select.addEventListener('change',()=>{const i=Number(select.dataset.positionPack);draft.positionSettings ||= [];const prior=draft.positionSettings[i]||{};draft.positionSettings[i]={...prior,pack:select.value||'full'};draft.positionPacks ||= [];draft.positionPacks[i]=select.value||'full';}));
    drawer.querySelectorAll('[data-position-card-count]').forEach(input=>input.addEventListener('change',()=>{const i=Number(input.dataset.positionCardCount);draft.positionSettings ||= [];const prior=draft.positionSettings[i]||{};draft.positionSettings[i]={...prior,cardCount:Math.max(1,Math.min(12,Number(input.value)||1))};}));
    drawer.querySelectorAll('[data-position-link]').forEach(select=>select.addEventListener('change',()=>{const i=Number(select.dataset.positionLink);draft.positionSettings ||= [];const prior=draft.positionSettings[i]||{};draft.positionSettings[i]={...prior,linkTo:select.value};}));
    drawer.querySelectorAll('[data-position-reversals]').forEach(input=>input.addEventListener('change',()=>{
      const i=Number(input.dataset.positionReversals);draft.positionSettings ||= [];
      for(let j=i;j<draft.labels.length;j++){
        const prior=draft.positionSettings[j]||{};
        draft.positionSettings[j]={...prior,pack:draft.positionPacks?.[j]||prior.pack||draft.pack||'full',reversals:input.checked,repeats:!!prior.repeats};
      }
      renderOptions(root);
    }));
    drawer.querySelectorAll('[data-position-repeats]').forEach(input=>input.addEventListener('change',()=>{
      const i=Number(input.dataset.positionRepeats);draft.positionSettings ||= [];
      for(let j=i;j<draft.labels.length;j++){
        const prior=draft.positionSettings[j]||{};
        draft.positionSettings[j]={...prior,pack:draft.positionPacks?.[j]||prior.pack||draft.pack||'full',reversals:prior.reversals!==false,repeats:input.checked};
      }
      renderOptions(root);
    }));
    drawer.querySelector('#relphiTemplateName')?.addEventListener('input',event=>{draft.templateName=event.target.value.slice(0,60);});
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

    drawer.querySelector('#relphiDraftPack')?.addEventListener('change',event=>{draft.pack=event.target.value; const body=drawer.querySelector('.relphi-options-body'); const scrollTop=body?.scrollTop||0; renderOptions(root); const next=root.querySelector('.relphi-options-body'); if(next) next.scrollTop=scrollTop;});
    const keywordQuery=drawer.querySelector('#relphiKeywordQuery');
    keywordQuery?.addEventListener('input',event=>renderKeywordMatches(drawer,draft,event.target.value));
    drawer.querySelectorAll('input[name="relphiKeywordMode"]').forEach(input=>input.addEventListener('change',()=>{draft.keywordMatchMode=input.value==='all'?'all':'any'; renderOptions(root);}));
    drawer.querySelectorAll('[data-keyword-remove]').forEach(button=>button.addEventListener('click',()=>{draft.keywordTags=(draft.keywordTags||[]).filter(tag=>tag!==button.dataset.keywordRemove); renderOptions(root);}));
    drawer.querySelector('#relphiDraftReversals')?.addEventListener('change',event=>{draft.reversals=event.target.checked;});
    drawer.querySelector('#relphiDraftRepeats')?.addEventListener('change',event=>{draft.repeats=event.target.checked;});
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
    return resetBoardGlobal(root);
  }

  function resetBoardGlobal(root = panel()) {
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

    settingsOpen=true;
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
      resetSnapshot.rowEnvelopeColor='#f3f0ea';
      resetSnapshot.rowEnvelopeImage='';
      resetSnapshot.rowTableColor='#7d1f28';
      resetSnapshot.rowTableImage='';
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

    freeSettingsSession={draft:freeSettingsDraftFromState()};
    settingsBaseline={
      snapshot:clone(currentSnapshot()||{}),
      stickers:true,
      craftedReadingActive:false,
      surfaceReadingSession:null,
      recursionSession:null,
      recursionPortalLevel:0
    };
    setBoardMode(root,'board');
    ensureBoardChrome(root);
    renderBoardSettings(root);
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
      rowAllowRepeats:false,rowAllowReversals:true,rowPanX:0,rowPanY:0,rowTransformTarget:0,
      cardRowBoardOpen:true
    });
    bridge.restore(snap);
    surfaceReadingSession=null;recursionSession=null;recursionPortalLevel=0;
    pendingFocusIndex=null;attuneIndex=-1;
    activeCraftedPath='';
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

  function draftPrefab(draft) {
    const based=templateById(draft.templateId || draft.basedOnTemplateId);
    const labels=draft.labels.slice(0,MAX_POSITIONS).map((value,index)=>String(value || `Position ${index+1}`).trim());
    const positionPacks=(draft.positionPacks||[]).slice(0,labels.length).map(value=>String(value||''));
    if (based && based.positions.length===labels.length) {
      const next=clone(based);
      next.positions.forEach((item,index)=>{const ps=draft.positionSettings?.[index]||{};item.label=labels[index]; item.drawOrder=index+1; item.drawScope=positionPacks[index]||ps.pack||item.drawScope||'';item.allowReversals=ps.reversals ?? draft.reversals;item.allowRepeats=ps.repeats ?? draft.repeats;item.cardCount=Math.max(1,Number(ps.cardCount)||1);item.linkTo=String(ps.linkTo??'');});
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
    positions.forEach((item,index)=>{const ps=draft.positionSettings?.[index]||{};item.drawScope=positionPacks[index]||ps.pack||'';item.allowReversals=ps.reversals ?? draft.reversals;item.allowRepeats=ps.repeats ?? draft.repeats;item.cardCount=Math.max(1,Number(ps.cardCount)||1);item.linkTo=String(ps.linkTo??'');});
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
    if (!results) return;
    const q=String(query||'').trim();
    if (!q) {
      results.innerHTML='<p>Search the Tarot Ledger by card name, title, rank, suit, element, planet, sign, or other indexed term.</p>';
      return;
    }
    const scope=String(reader.dataset.attuneScope || 'full');
    const matches=ledgerBridge()?.searchCards?.(q,24,scope) || [];
    results.innerHTML=matches.length ? matches.map(card=>'<button type="button" data-attune-card="'+escapeHtml(card.card_id)+'"><img src="'+escapeHtml(card.image||'')+'" alt=""><span>'+escapeHtml(card.title||card.card_id)+'</span></button>').join('') : '<p>No matching cards in the assigned sub-pack.</p>';
    results.querySelectorAll('[data-attune-card]').forEach(button=>button.addEventListener('click',()=>{
      const target=attuneIndex;
      const root=panel();
      const drawnIndex=currentCardCount(root);
      const cardId=button.dataset.attuneCard || '';
      if (!Number.isInteger(target) || target<0) return;
      pendingFocusIndex=target;
      const scope=String(reader.dataset.attuneScope || 'full');
      if (!ledgerBridge()?.addCardToBoard?.(cardId,scope)) { pendingFocusIndex=null; return; }
      if (target!==drawnIndex) prefabBridge()?.swapPositionSlots?.(drawnIndex,target);
      if(reader.dataset.attuneCardSource==='physical'){
        setRecordedCardOrientation(target,reader.dataset.attuneOrientation==='reversed');
      }
      closeAttune();
      setTimeout(()=>enhance(panel()),0);
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
    const cardSource=sacredCardSourceAt(index,snap);
    const reversalsAllowed=meta.allowReversals ?? (snap.rowAllowReversals!==false);
    const cardCount=Math.max(1,Number(meta.cardCount)||1),linkTo=String(meta.linkTo??'');
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
    reader.dataset.attuneOrientation='upright';
    reader.setAttribute('role','dialog');
    reader.setAttribute('aria-modal','true');
    reader.setAttribute('aria-label','Attune to the Referent');
    const scopeLabel=SURFACE_PACK_LABELS[Object.keys(SURFACE_PACK_BY_KIND).find(key=>SURFACE_PACK_BY_KIND[key]===scope)] || (scope==='full'?'Full Pack':scope || 'Full Pack');
    const sourceLabel=cardSource==='physical'?'Physical deck':'Digital cards';
    const packLine='Assigned pack · '+escapeHtml(scopeLabel)+(keywordTags.length?' · '+escapeHtml(keywordTags.join(keywordMode==='all'?' + ':' / ')):'')+(cardCount>1?' · '+cardCount+' cards':'')+(linkedCard?' · shares Question '+(linkedIndex+1)+' card':'')+' · '+sourceLabel;

    let actionMarkup='';
    let searchMarkup='';
    if(linkedCard){
      actionMarkup='<div class="relphi-attune-actions relphi-attune-actions--single"><button type="button" class="primary" data-attune-shared>Continue with the shared card</button></div>';
    }else if(cardSource==='physical'){
      actionMarkup='<p class="relphi-attune-physical-instruction">Draw one physical card from the assigned sub-pack. Keep its orientation exactly as drawn, then record it here.</p><div class="relphi-attune-actions relphi-attune-actions--single"><button type="button" class="primary" data-attune-search>Record the card I drew</button></div>';
      const orientationMarkup=reversalsAllowed
        ? '<fieldset class="relphi-attune-orientation"><legend>Orientation</legend><label><input type="radio" name="relphiPhysicalOrientation" value="upright" checked> Upright</label><label><input type="radio" name="relphiPhysicalOrientation" value="reversed"> Reversed</label></fieldset>'
        : '<p class="relphi-attune-orientation-note">Reversals are off for this reading, so this card will be recorded upright.</p>';
      searchMarkup='<section class="relphi-attune-search" hidden>'+orientationMarkup+'<label>Record physical card<input type="search" autocomplete="off" placeholder="Search for the card you drew"></label><div class="relphi-attune-search-results"><p>Search the Tarot Ledger for the physical card you drew.</p></div></section>';
    }else{
      actionMarkup='<div class="relphi-attune-actions relphi-attune-actions--single"><button type="button" class="primary" data-attune-random>Draw digital card</button></div>';
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

    reader.querySelector('[data-attune-search]')?.addEventListener('click',()=>{
      const search=reader.querySelector('.relphi-attune-search');
      search.hidden=false;
      reader.querySelector('.relphi-attune-search input[type="search"]')?.focus();
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
    const advancedOpen=!!row.advancedOpen;
    return '<article class="relphi-surface-composer-row" data-surface-composer-row="'+index+'">'+
      '<label class="relphi-surface-composer-select"><input type="checkbox" data-surface-select '+(row.selected!==false?'checked':'')+'><span>Ask</span></label>'+
      '<div class="relphi-surface-composer-main"><textarea rows="2" data-surface-text aria-label="Question '+(index+1)+'">'+escapeHtml(row.text||'')+'</textarea>'+
      '<details class="relphi-surface-composer-advanced" data-surface-advanced '+(advancedOpen?'open':'')+'>'+
        '<summary><strong>Advanced</strong><span>'+escapeHtml(surfaceComposerAdvancedSummary(row))+'</span></summary>'+
        '<div class="relphi-surface-composer-advanced-body">'+
          '<div class="relphi-surface-composer-settings">'+
            '<label>Sub-pack<select data-surface-pack>'+packOptions(row.pack||'full')+'</select></label>'+
            '<label>Cards<input type="number" min="1" max="12" value="'+Math.max(1,Math.min(12,Number(row.cardCount)||1))+'" data-surface-card-count></label>'+
            '<label>Share card with<select data-surface-link><option value="">No link</option>'+linkOptions+'</select></label>'+
          '</div>'+
          surfaceKeywordMarkup(row,index)+
        '</div>'+
      '</details>'+
      '</div>'+
      '<button type="button" class="relphi-surface-composer-remove" data-surface-remove aria-label="Remove question '+(index+1)+'">×</button>'+
    '</article>';
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
      advancedOpen:!!item.advancedOpen,
      reversals:item.reversals!==false,repeats:!!item.repeats
    }));
    if(!rows.length)rows.push({selected:true,text:'',pack:'full',cardCount:1,linkTo:'',keywordTags:[],keywordMatchMode:'any',keywordQuery:'',advancedOpen:false,reversals:true,repeats:false,sourceKind:'authored'});
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
        row.cardCount=Math.max(1,Math.min(12,Number(article.querySelector('[data-surface-card-count]')?.value)||1));
        row.linkTo=article.querySelector('[data-surface-link]')?.value??'';
        row.keywordTags=Array.isArray(row.keywordTags)?row.keywordTags:[];
        row.keywordMatchMode=article.querySelector('[name="surfaceTagMode'+index+'"]:checked')?.value==='all'?'all':'any';
      };
      composer.querySelectorAll('[data-surface-composer-row]').forEach((article,index)=>{
        const row=rows[index];
        ['change','input'].forEach(type=>article.addEventListener(type,()=>syncRow(article,index)));
        article.querySelector('[data-surface-advanced]')?.addEventListener('toggle',event=>{row.advancedOpen=!!event.currentTarget.open;});
        article.querySelector('[data-surface-pack]')?.addEventListener('change',()=>{
          syncRow(article,index);
          row.advancedOpen=true;
          if(row.pack!=='tags'){row.keywordTags=[];row.keywordMatchMode='any';}
          render();
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
        rows.push({...suggestion.candidate,selected:true,cardCount:Math.max(1,Number(suggestion.candidate.cardCount)||1),linkTo:suggestion.candidate.linkTo??'',keywordTags:Array.isArray(suggestion.candidate.keywordTags)?suggestion.candidate.keywordTags.slice():[],keywordMatchMode:suggestion.candidate.keywordMatchMode==='all'?'all':'any',keywordQuery:'',advancedOpen:false,reversals:suggestion.candidate.reversals!==false,repeats:!!suggestion.candidate.repeats});
        render();
        setTimeout(()=>composer.querySelector('[data-surface-composer-row]:last-child')?.scrollIntoView?.({block:'nearest'}),0);
      });
      composer.querySelector('[data-surface-add]')?.addEventListener('click',()=>{
        composer.querySelectorAll('[data-surface-composer-row]').forEach((article,index)=>syncRow(article,index));
        rows.push({selected:true,text:'',pack:'full',cardCount:1,linkTo:'',keywordTags:[],keywordMatchMode:'any',keywordQuery:'',advancedOpen:false,reversals:true,repeats:false,sourceKind:'authored'});
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
      showBoardToast('This reading has reached the 50-card board limit.',{title:'See What Surfaces',duration:4200});
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
    Object.assign(snap,{shortList:[],shortListSelection:[],shortListPositionLabels:[],shortListPositionCardIds:[],rowEnvelopeLayout:{},rowCardTransforms:{},rowPositionMeta:[],rowActiveLayout:null,rowLayoutLocked:false,rowLayoutDesignMode:false,rowCardReversals:{},rowCardManual:[],rowDrawDeck:[],rowDrawDeckSignature:''});
    bridge.restore(snap);
    if(!prefabs.applyLayout(prefab)){craftedReadingActive=false;return false;}
    stampCraftedPath(craftedPath,root);
    markSettingsConfirmed();
    applyDrawSettings(draft);
    stampSacredCardSource(optionsSession?.sacredCardSource==='physical'?'physical':'digital',root);
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
    const draft=clone(session.draft);
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
    else if (surfaceReadingSession || recursionActive()) openAttune(next);
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
        event.preventDefault(); event.stopImmediatePropagation(); openFocus(index); return;
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
        pendingFocusIndex=currentCardCount(root);
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
    if(!bespokeEditingAllowed(root)||!craftedReadingActive)return;
    const board=root.querySelector('.card-row-drawing-board')||root;
    const wrap=document.createElement('div');
    wrap.className='relphi-bespoke-continue';
    wrap.innerHTML='<button type="button" class="relphi-bespoke-ask-another">＋ Ask another question</button>';
    wrap.querySelector('button').addEventListener('click',promptForBespokeQuestion);
    board.appendChild(wrap);
  }

  function globalCapture(event) {
    const trigger=event.target.closest?.('#relphiOpenDrawingBoardCurrent');
    if (trigger) {
      event.preventDefault(); event.stopImmediatePropagation();
      const wasOpen=trigger.getAttribute('aria-expanded')==='true';
      if (!wasOpen) {
        const legacy=document.getElementById('landingOpenBoard');
        if (legacy) legacy.click();
      }
      setBoardOpen(!wasOpen,{fit:!wasOpen});
      return;
    }
    const root=panel();
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
    optionsSession.sacredCardSource='digital';
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
    showBoardToast('Your question is established as the first referent. Attune before revealing its card.',{
      title:'Bespoke',
      duration:0,
      actionLabel:'Attune',
      onAction:()=>{const next=nextUndrawnNativeIndex(panel());if(next!=null)openAttune(next);}
    });
    root.scrollIntoView?.({behavior:'smooth',block:'start'});
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
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{setTimeout(boot,0);setTimeout(boot,120);},{once:true});
  else { setTimeout(boot,0); setTimeout(boot,120); }
})();
