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
  const LABEL_H = 38;
  const GUTTER = 12;
  const MIN_ZOOM = .45;
  const MAX_ZOOM = 2.4;

  let boardOpen = false;
  let initialized = false;
  let optionsSession = null;
  let focusIndex = -1;
  let pendingFocusIndex = null;
  let activeDraw = false;
  let openTool = '';
  let transformEditingUnlocked = false;
  let showPositionStickers = readStickerVisibility();

  function panel() { return document.getElementById(PANEL_ID); }
  function prefabBridge() { return window.RelphiDrawingBoardPrefabsBridge || null; }
  function optionsBridge() { return window.RelphiDrawingBoardOptionsBridge || null; }
  function ledgerBridge() { return window.RelphiTarotLedgerBridge || null; }
  function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || 0)); }
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
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

  // Ordinary spreads use simple rows/grids. Only spreads whose meaning depends
  // on geometry (Celtic Cross and Saturn Square) receive bespoke layouts.
  function genericPositions(labels) {
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
    return { templateId:'', labels:[], pack:'full', stickers:true, reversals:true, repeats:false, templateName:'' };
  }
  function draftFromState() {
    const snap = currentSnapshot() || {};
    const state = currentPrefabState();
    return {
      templateId:String(state.activeLayout?.id || ''),
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
    optionsSession = { baseline:currentSnapshot(), draft:draftFromState() };
  }
  function optionsStructuralChanged(session = optionsSession) {
    if (!session) return false;
    const base = session.baseline || {};
    const baseLayout = String(base.rowActiveLayout?.id || '');
    const baseLabels = Array.isArray(base.shortListPositionLabels) ? base.shortListPositionLabels : [];
    return session.draft.templateId !== baseLayout || JSON.stringify(session.draft.labels) !== JSON.stringify(baseLabels);
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
    const next = clamp(value, Number(input.min) || MIN_ZOOM, Number(input.max) || MAX_ZOOM);
    input.value = String(next);
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function nudgeZoom(delta) {
    const input = zoomInput();
    setZoomFromControl((Number(input?.value) || 1) + delta);
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
      const next = clamp(startZoom * (distance(event.touches) / startDistance), Number(input.min) || MIN_ZOOM, Number(input.max) || MAX_ZOOM);
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

  function rotatedBounds(width, height, degrees) {
    const radians = Math.abs(Number(degrees) || 0) * Math.PI / 180;
    return {
      width:Math.abs(Math.cos(radians)) * width + Math.abs(Math.sin(radians)) * height,
      height:Math.abs(Math.sin(radians)) * width + Math.abs(Math.cos(radians)) * height
    };
  }
  function logicalPosition(snapshot, index) {
    const saved = snapshot?.rowEnvelopeLayout?.[index] || snapshot?.rowEnvelopeLayout?.[String(index)];
    if (saved && Number.isFinite(Number(saved.x)) && Number.isFinite(Number(saved.y))) return {x:Number(saved.x),y:Number(saved.y)};
    const cols = 4;
    return {x:(index % cols) * CARD_W,y:Math.floor(index / cols) * CARD_H};
  }
  function logicalTransform(snapshot, index) {
    const saved = snapshot?.rowCardTransforms?.[index] || snapshot?.rowCardTransforms?.[String(index)] || {};
    return {scale:clamp(saved.scale || 1,.45,2.5),rotation:Number(saved.rotation) || 0};
  }
  function stateContentBounds(snapshot, count) {
    if (!count) return {minX:0,minY:0,maxX:CARD_W,maxY:CARD_H};
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for (let i=0;i<count;i++) {
      const p = logicalPosition(snapshot,i);
      const t = logicalTransform(snapshot,i);
      // Native positions are the untransformed card box's top-left. CSS scales
      // and rotates each slot around its center, so extents must use that same origin.
      const centerX = p.x + CARD_W / 2;
      const centerY = p.y + CARD_H / 2;
      const rotated = rotatedBounds(CARD_W*t.scale,CARD_H*t.scale,t.rotation);
      let left=centerX-rotated.width/2, right=centerX+rotated.width/2;
      let top=centerY-rotated.height/2, bottom=centerY+rotated.height/2;
      const labelH = showPositionStickers ? LABEL_H*t.scale : 0;
      if (labelH) {
        if (Math.abs(t.rotation % 180) < 1) top -= labelH;
        else { left -= labelH; right += labelH; top -= labelH; bottom += labelH; }
      }
      minX=Math.min(minX,left); minY=Math.min(minY,top);
      maxX=Math.max(maxX,right); maxY=Math.max(maxY,bottom);
    }
    return {minX,minY,maxX,maxY};
  }
  function zoomExtents() {
    const root = panel();
    const workspace = root?.querySelector('.card-row-workspace');
    const bridge = optionsBridge();
    if (!root || !workspace || !bridge) return false;
    const snapshot = bridge.capture();
    const count = currentSlotCount(root);
    const bounds = stateContentBounds(snapshot,count);
    const toolbar = root.querySelector('.card-row-workspace-toolbar.relphi-board-controller');
    const toolbarH = toolbar?.offsetHeight || 52;
    const availableW = Math.max(CARD_W, workspace.clientWidth - GUTTER*2);
    const availableH = Math.max(CARD_H, workspace.clientHeight - toolbarH - GUTTER*2);
    const contentW = Math.max(CARD_W,bounds.maxX-bounds.minX);
    const contentH = Math.max(CARD_H,bounds.maxY-bounds.minY);
    const zoom = clamp(Math.min(availableW/contentW,availableH/contentH),MIN_ZOOM,MAX_ZOOM);
    snapshot.rowZoom = zoom;
    snapshot.rowPanX = Math.round((availableW-contentW*zoom)/2-bounds.minX*zoom+GUTTER);
    snapshot.rowPanY = Math.round((availableH-contentH*zoom)/2-bounds.minY*zoom+GUTTER);
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

  function installExportArea(root) {
    const drawer = root.querySelector('.card-row-drawing-board');
    const workspace = root.querySelector('.card-row-workspace');
    if (!drawer || !workspace) return;
    let section = root.querySelector('#drawing-board-post-export');
    if (!section) {
      section = document.createElement('section');
      section.id = 'drawing-board-post-export';
      section.className = 'relphi-board-export';
      section.innerHTML = '<header><strong>Save & export</strong><span>Keep the arranged board or export the cards.</span></header><div class="board-options-body"></div>';
      workspace.insertAdjacentElement('afterend',section);
    }
    const destination = section.querySelector('.board-options-body');
    const labels = {
      snapshotCardRowArrangement:'Prepare arrangement snapshot (PNG)',
      downloadRowHtml:'Download cards (HTML)',
      downloadRowTextHtml:'Download text (HTML)',
      downloadRowJson:'Download board data (JSON)',
      printCardRowImage:'Print / image'
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
    return `<option value="">Custom positions</option>${entries.map(item => `<option value="${escapeHtml(item.id)}" ${draft.templateId===item.id?'selected':''}>${item.cardCount} · ${escapeHtml(item.name)}</option>`).join('')}`;
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
    return labels.map((label,index)=>`<div class="relphi-label-row" data-label-row="${index}"><span>${index+1}</span><input type="text" maxlength="90" value="${escapeHtml(label)}" aria-label="Position ${index+1} label"><button type="button" data-remove-label="${index}" aria-label="Remove position ${index+1}">×</button></div>`).join('');
  }

  function parseBulkQuestions(value) {
    return String(value || '').split(',').map(item=>item.trim()).filter(Boolean).slice(0,40);
  }

  function renderOptions(root = panel()) {
    if (!root || !optionsSession) return;
    root.querySelector('.relphi-reading-options-drawer')?.remove();
    const workspace = root.querySelector('.card-row-workspace');
    if (!workspace) return;
    const draft = optionsSession.draft;
    const hasCards = currentCardCount(root) > 0;
    const drawer = document.createElement('section');
    drawer.className='relphi-reading-options-drawer is-reading-options-open';
    drawer.id='drawingBoardReadingOptions';
    drawer.setAttribute('role','dialog');
    drawer.setAttribute('aria-label','Drawing Board Options');
    drawer.innerHTML = `
      <div class="relphi-options-heading"><div><span class="eyebrow">Drawing Board</span><h3>Options</h3></div></div>
      ${hasCards ? '<p class="relphi-options-note">Reset Board before changing spread positions. Draw settings can still be changed.</p>' : ''}
      <div class="relphi-options-body">
        <label class="relphi-options-field relphi-bulk-questions">Questions / position labels<textarea id="relphiBulkQuestions" rows="3" ${hasCards?'disabled':''} placeholder="Question one, question two, question three">${escapeHtml(draft.labels.join(', '))}</textarea><small>Tip: separate questions with commas. Each comma-separated entry becomes one position.</small></label>
        <div class="relphi-labels-section">
          <div class="relphi-options-subhead"><strong>Individual position labels</strong><button type="button" id="relphiAddPosition" ${hasCards?'disabled':''}>Add position</button></div>
          <div id="relphiPositionLabels">${labelsMarkup(draft.labels)}</div>
        </div>
        <label class="relphi-options-field">Spread Template<select id="relphiSpreadTemplateSelect" ${hasCards?'disabled':''}>${optionTemplateMarkup(draft)}</select></label>
        <div class="relphi-draw-options">
          <label>Pack<select id="relphiDraftPack">${packOptions(draft.pack)}</select></label>
          <label><input id="relphiDraftStickers" type="checkbox" ${draft.stickers?'checked':''}> Show position stickers</label>
          <label><input id="relphiDraftReversals" type="checkbox" ${draft.reversals?'checked':''}> Reversals</label>
          <label><input id="relphiDraftRepeats" type="checkbox" ${draft.repeats?'checked':''}> Repeats</label>
        </div>
        <div class="relphi-template-save">
          <input id="relphiTemplateName" type="text" maxlength="60" placeholder="Custom template name" value="${escapeHtml(draft.templateName)}" ${hasCards?'disabled':''}>
          <button type="button" id="relphiSaveTemplate" ${hasCards?'disabled':''}>Save template</button>
        </div>
      </div>
      <div class="relphi-options-commitbar">
        <button type="button" id="relphiResetBoard" class="relphi-reset-board">Reset Board</button>
        <span></span>
        <button type="button" id="relphiCancelOptions">Cancel</button>
        <button type="button" id="relphiApplyOptions" class="primary">OK</button>
      </div>`;
    workspace.appendChild(drawer);

    const templateSelect = drawer.querySelector('#relphiSpreadTemplateSelect');
    templateSelect?.addEventListener('change',()=>{
      const chosen=templateById(templateSelect.value);
      draft.templateId=templateSelect.value;
      if (chosen) {
        draft.labels=chosen.positions.slice().sort((a,b)=>a.drawOrder-b.drawOrder).map(item=>item.label);
        draft.pack=chosen.rules?.drawScope || draft.pack;
        draft.reversals=chosen.rules?.allowReversals !== false;
        draft.repeats=!!chosen.rules?.allowRepeats;
        draft.templateName=chosen.name;
      }
      renderOptions(root);
    });
    const bulkQuestions=drawer.querySelector('#relphiBulkQuestions');
    const syncBulkQuestions=()=>{
      if (!bulkQuestions || bulkQuestions.disabled) return;
      const labels=parseBulkQuestions(bulkQuestions.value);
      draft.labels=labels;
      draft.templateId='';
      draft.templateName='';
      if (templateSelect) templateSelect.value='';
      const nameField=drawer.querySelector('#relphiTemplateName');
      if (nameField) nameField.value='';
      const list=drawer.querySelector('#relphiPositionLabels');
      if (list) list.innerHTML=labelsMarkup(labels);
    };
    bulkQuestions?.addEventListener('input',syncBulkQuestions);
    drawer.querySelector('#relphiPositionLabels')?.addEventListener('input',event=>{
      const row=event.target.closest('.relphi-label-row');
      if (!row || event.target.tagName!=='INPUT') return;
      draft.labels[Number(row.dataset.labelRow)]=event.target.value.slice(0,90);
      if (bulkQuestions) bulkQuestions.value=draft.labels.join(', ');
    });
    drawer.querySelector('#relphiPositionLabels')?.addEventListener('click',event=>{
      const button=event.target.closest('[data-remove-label]');
      if (!button) return;
      draft.labels.splice(Number(button.dataset.removeLabel),1);
      draft.templateId=''; draft.templateName='';
      renderOptions(root);
    });
    drawer.querySelector('#relphiAddPosition')?.addEventListener('click',()=>{
      draft.labels.push(`Position ${draft.labels.length+1}`);
      draft.templateId=''; draft.templateName='';
      renderOptions(root);
    });
    drawer.querySelector('#relphiDraftPack')?.addEventListener('change',event=>{draft.pack=event.target.value;});
    drawer.querySelector('#relphiDraftStickers')?.addEventListener('change',event=>{draft.stickers=event.target.checked;});
    drawer.querySelector('#relphiDraftReversals')?.addEventListener('change',event=>{draft.reversals=event.target.checked;});
    drawer.querySelector('#relphiDraftRepeats')?.addEventListener('change',event=>{draft.repeats=event.target.checked;});
    drawer.querySelector('#relphiTemplateName')?.addEventListener('input',event=>{draft.templateName=event.target.value.slice(0,60);});
    drawer.querySelector('#relphiSaveTemplate')?.addEventListener('click',()=>saveDraftTemplate(root));
    drawer.querySelector('#relphiResetBoard')?.addEventListener('click',()=>resetBoardFromOptions(root));
    drawer.querySelector('#relphiCancelOptions')?.addEventListener('click',()=>closeOptions(root));
    drawer.querySelector('#relphiApplyOptions')?.addEventListener('click',()=>applyOptions(root));
  }

  function saveDraftTemplate(root) {
    if (!optionsSession) return;
    const draft=optionsSession.draft;
    const name=String(draft.templateName || '').trim();
    if (!name || !draft.labels.length) return;
    const based=templateById(draft.templateId);
    const positions=(based?.positions?.length===draft.labels.length ? clone(based.positions) : genericPositions(draft.labels));
    positions.forEach((item,index)=>{ item.label=draft.labels[index] || `Position ${index+1}`; item.drawOrder=index+1; });
    const id=`custom-${slug(name)}-${draft.labels.length}`;
    const custom={version:1,id,name,cardCount:draft.labels.length,source:'custom',editable:true,basedOn:based?.id||null,positions,rules:{allowReversals:draft.reversals,allowRepeats:draft.repeats,drawScope:draft.pack}};
    const items=readCustomTemplates().filter(item=>item.id!==id);
    items.push(custom); writeCustomTemplates(items);
    draft.templateId=id;
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
    if (trigger) { trigger.textContent='Options'; trigger.setAttribute('aria-expanded','true'); }
    renderOptions(root);
  }

  function draftPrefab(draft) {
    const based=templateById(draft.templateId);
    const labels=draft.labels.map((value,index)=>String(value || `Position ${index+1}`).trim().slice(0,90));
    if (based && based.positions.length===labels.length) {
      const next=clone(based);
      next.positions.forEach((item,index)=>{item.label=labels[index]; item.drawOrder=index+1;});
      next.rules={allowReversals:draft.reversals,allowRepeats:draft.repeats,drawScope:draft.pack};
      return next;
    }
    return {version:1,id:'custom-active',name:draft.templateName || 'Custom spread',cardCount:labels.length,source:'custom',editable:true,positions:genericPositions(labels),rules:{allowReversals:draft.reversals,allowRepeats:draft.repeats,drawScope:draft.pack}};
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
    if (state.activeLayout?.id!=='celtic-cross-10') return false;
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
  function renderFocusEntry(reader, index) {
    const card=cardAt(index);
    const cardId=String(card?.dataset?.rowCard || '');
    const artSource=focusArtImage(card);
    const reversed=focusCardIsReversed(index);
    const art=reader.querySelector('.relphi-focus-art');
    const entry=reader.querySelector('.relphi-focus-entry');
    const position=reader.querySelector('.relphi-focus-position');
    const reversedBadge=reader.querySelector('.relphi-focus-reversed-badge');
    if (position) position.textContent=positionLabel(index);
    if (reversedBadge) reversedBadge.hidden=!reversed;
    if (art && artSource) {
      art.src=artSource.currentSrc || artSource.src || '';
      art.alt=(artSource.alt || ledgerBridge()?.titleFor?.(cardId) || 'Tarot card') + (reversed ? ' — reversed' : '');
      art.classList.toggle('is-reversed',reversed);
    }
    if (entry) {
      entry.innerHTML=ledgerBridge()?.renderCardEntry?.(cardId,'Tarot Ledger entry') || '<p>Card entry unavailable.</p>';
      entry.querySelectorAll('.tarot-card-art,.full-entry-row-button').forEach(node=>node.remove());
      addFocusReversedMeaning(entry,cardId,reversed);
      ledgerBridge()?.bindCardEntry?.(entry);
      entry.scrollTop=0;
    }
  }
  function renderFocusStrip(reader, index) {
    const order=orderedNativePositionIndices();
    const strip=reader.querySelector('.relphi-focus-strip');
    strip.replaceChildren();
    order.forEach((nativeIndex,logicalIndex)=>{
      const button=document.createElement('button');
      button.type='button'; button.dataset.focusPosition=String(nativeIndex);
      button.classList.toggle('is-current',nativeIndex===index);
      button.classList.toggle('is-reversed',focusCardIsReversed(nativeIndex));
      const card=cardAt(nativeIndex);
      const img=focusArtImage(card)?.cloneNode(true);
      if (img) { img.removeAttribute('loading'); button.appendChild(img); }
      const span=document.createElement('span'); span.textContent=String(logicalIndex+1); button.appendChild(span);
      button.title=positionLabel(nativeIndex);
      button.addEventListener('click',()=>navigateFocusTo(nativeIndex));
      strip.appendChild(button);
    });
    setTimeout(()=>strip.querySelector('.is-current')?.scrollIntoView({block:'nearest',inline:'center'}),0);
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
    const reader=document.createElement('section');
    reader.className='relphi-focus-reader';
    reader.dataset.focusIndex=String(index);
    reader.setAttribute('role','dialog');
    reader.setAttribute('aria-modal','true');
    reader.setAttribute('aria-label',positionLabel(index,root));
    reader.innerHTML=`<div class="relphi-focus-shell"><header><div class="relphi-focus-heading"><strong class="relphi-focus-position"></strong><span class="relphi-focus-reversed-badge" hidden>Reversed</span></div><div class="relphi-focus-actions"><button type="button" class="relphi-focus-draw">Draw</button><button type="button" class="relphi-focus-close" aria-label="Close focused card">×</button></div></header><div class="relphi-focus-main"><section class="relphi-focus-art-pane" aria-label="Card art"><div class="relphi-focus-art-frame"><img class="relphi-focus-art" alt=""></div></section><article class="relphi-focus-entry tarot-detail" aria-label="Full Tarot Ledger entry"></article></div><footer><button type="button" class="relphi-focus-prev" aria-label="Previous position">‹</button><div class="relphi-focus-strip" aria-label="Reading positions"></div><button type="button" class="relphi-focus-next" aria-label="Next position">›</button></footer></div>`;
    renderFocusEntry(reader,index);
    renderFocusStrip(reader,index);
    reader.querySelector('.relphi-focus-close').addEventListener('click',()=>closeFocus({acknowledge:true}));
    reader.querySelector('.relphi-focus-prev').addEventListener('click',()=>navigateFocusBy(-1));
    reader.querySelector('.relphi-focus-next').addEventListener('click',()=>navigateFocusBy(1));
    reader.querySelector('.relphi-focus-draw').addEventListener('click',()=>drawNextLogical(panel()));
    installFocusSwipe(reader);
    if (existingReader) existingReader.replaceWith(reader); else document.body.appendChild(reader);
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
    else {
      // Keep the current reader mounted while the next card is drawn. The
      // newly drawn card replaces it only when its complete focus view is ready,
      // avoiding the board/page flash between focus cards.
      drawInto(focusItem(next),next);
    }
  }
  function navigateFocusBy(delta) {
    const order=orderedNativePositionIndices();
    if (!order.length) return closeFocus({acknowledge:true});
    const currentIndex=order.indexOf(focusIndex);
    const current=currentIndex>=0 ? currentIndex : 0;
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
      options.textContent='Options';
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
    const id=currentPrefabState().activeLayout?.id || '';
    const isCeltic=id==='celtic-cross-10';
    root.classList.toggle('relphi-celtic-cross',isCeltic);
    root.classList.toggle('relphi-six-polarities',id==='six-polarities-houses-12');
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
    root.classList.toggle('relphi-hide-position-stickers',!showPositionStickers);
    markSemanticPositions(root);
    updateLayoutClasses(root);
    installTopActions(root);
    installPermanentControls(root);
    installPinchZoom(root);
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
