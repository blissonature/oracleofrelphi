// Stable, indexed Placement checklist for Sky A / Sky B.
// Endpoint-OR semantics are authoritative here; no compatibility second pass is required.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyPlacementMultiselectV4)return;
  window.__relphiSkyPlacementMultiselectV4=true;
  // Compatibility flags: this implementation replaces the older placement multiselects.
  window.__relphiSkyPlacementMultiselectV3=true;
  window.__relphiSkyMultiselectFiltersV1=true;
  window.__relphiSkyMultiselectFiltersV2=true;

  const SLOTS=['A','B'];
  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const GROUPS=Object.freeze([
    {id:'luminaries',label:'Luminaries',members:['sun','moon']},
    {id:'planets',label:'Planets',members:['mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto']},
    {id:'chart-angles',label:'Chart Angles',members:['asc','dsc','mc','ic']},
    {id:'points',label:'Points',members:['north-node','south-node','chiron','lilith','part-of-fortune','vertex']}
  ]);
  const LABELS=Object.freeze({
    sun:'Sun',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',
    uranus:'Uranus',neptune:'Neptune',pluto:'Pluto',asc:'Ascendant',dsc:'Descendant',mc:'Medium Coeli',
    ic:'Imum Coeli','north-node':'North Node','south-node':'South Node',chiron:'Chiron',lilith:'Lilith',
    'part-of-fortune':'Part of Fortune',vertex:'Vertex'
  });
  const ORDER=Object.freeze(GROUPS.flatMap(group=>group.members));
  const ALIASES=Object.freeze({
    ascendant:'asc','asc.':'asc',rising:'asc',ac:'asc',
    descendant:'dsc','desc.':'dsc',desc:'dsc',dc:'dsc',
    midheaven:'mc','medium coeli':'mc',mediumcoeli:'mc',
    'imum coeli':'ic',imumcoeli:'ic',
    'north node':'north-node',northnode:'north-node',node:'north-node',
    'south node':'south-node',southnode:'south-node',
    'part of fortune':'part-of-fortune',partoffortune:'part-of-fortune',fortune:'part-of-fortune',
    'black moon lilith':'lilith',vx:'vertex'
  });

  const state={
    A:{available:new Map(),selected:new Set(),initialized:false,signature:''},
    B:{available:new Map(),selected:new Set(),initialized:false,signature:''}
  };

  let refreshQueued=false;
  let applyQueued=false;
  let positionQueued=false;
  let portalOwner=null;
  let rootObserver=null;
  let modeObserver=null;
  let lockedPopoverWidth=0;
  let renderCache={list:null,wheel:null,rowCount:-1,aspectCount:-1,rows:[],aspectsByIndex:new Map()};

  function canonicalId(value){
    const raw=String(value||'').trim().toLowerCase().replace(/_/g,'-').replace(/[.]+$/g,'').replace(/\s+/g,' ');
    const compact=raw.replace(/[\s-]+/g,'');
    return ALIASES[raw]||ALIASES[compact]||raw.replace(/\s+/g,'-');
  }
  function titleCase(value){return String(value||'').replace(/[-_]+/g,' ').replace(/\b\w/g,letter=>letter.toUpperCase())}
  function labelFor(id,fallback=''){
    const canonical=canonicalId(id);
    if(LABELS[canonical])return LABELS[canonical];
    const registry=window.RelphiGlyphRegistry?.resolve?.(canonical)||window.RelphiGlyphRegistry?.get?.(canonical);
    return String(registry?.name||fallback||titleCase(canonical)).trim();
  }
  function groupFor(id){
    const canonical=canonicalId(id);
    return GROUPS.find(group=>group.members.includes(canonical))?.id||'points';
  }

  function bActive(){
    const html=document.documentElement;
    return html.dataset.skyBEditing==='true'||html.dataset.skyBPresent==='true'||html.dataset.skyLastMode==='comparison';
  }
  function activeSlots(){return bActive()?SLOTS:['A']}
  function filterBar(){return document.querySelector('#skyFoundationRelationships .sky-chart-filter-bar')}
  function control(){return document.querySelector('[data-placement-filter="combined"]')}
  function popover(){return document.getElementById('skyChartPlacementPopover')}
  function isOpen(owner){return !!owner?.classList.contains('is-open')}

  function readPayload(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
  function placementSource(payload){
    if(!payload||typeof payload!=='object')return[];
    const known=[payload.placements,payload.positions,payload.points,payload.bodies].find(value=>value&&typeof value==='object');
    const source=known||payload;
    if(Array.isArray(source))return source.map((item,index)=>[String(item?.name||item?.label||item?.id||index),item]);
    return Object.entries(source).filter(([key,value])=>value&&typeof value==='object'&&!Array.isArray(value)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key));
  }
  function relationshipSlots(row){
    const mode=row.dataset.relationshipMode||document.documentElement.dataset.skyRelationshipMode||'A-B';
    if(mode==='A-A')return['A','A'];
    if(mode==='B-B')return['B','B'];
    return[row.dataset.leftSky||'A',row.dataset.rightSky||'B'];
  }

  function entriesFromRows(slot){
    const found=new Map();
    document.querySelectorAll('.sky-foundation-relationship-row').forEach(row=>{
      const [leftSlot,rightSlot]=relationshipSlots(row);
      [[leftSlot,row.dataset.leftPlacement],[rightSlot,row.dataset.rightPlacement]].forEach(([rowSlot,raw])=>{
        if(rowSlot!==slot||!raw)return;
        const id=canonicalId(raw);
        if(!found.has(id))found.set(id,{id,label:labelFor(id),group:groupFor(id)});
      });
    });
    return Array.from(found.values());
  }
  function entriesFor(slot){
    const found=new Map();
    placementSource(readPayload(slot)).forEach(([key,item])=>{
      const raw=item?.name||item?.label||item?.body||item?.planet||item?.point||item?.id||item?.glyphId||key;
      const id=canonicalId(raw);
      if(!id||found.has(id))return;
      found.set(id,{id,label:labelFor(id,raw),group:groupFor(id)});
    });
    entriesFromRows(slot).forEach(entry=>{if(!found.has(entry.id))found.set(entry.id,entry)});
    const rank=id=>{const index=ORDER.indexOf(id);return index<0?Number.MAX_SAFE_INTEGER:index};
    return Array.from(found.values()).sort((a,b)=>rank(a.id)-rank(b.id)||a.label.localeCompare(b.label));
  }
  function refreshAvailable(slot){
    const entries=entriesFor(slot);
    const signature=JSON.stringify(entries.map(entry=>[entry.id,entry.label,entry.group]));
    const current=state[slot];
    if(current.signature===signature)return false;
    const previouslyAll=!current.initialized||current.selected.size===current.available.size;
    const previous=new Set(current.selected);
    current.available=new Map(entries.map(entry=>[entry.id,entry]));
    current.selected=previouslyAll?new Set(current.available.keys()):new Set(Array.from(previous).filter(id=>current.available.has(id)));
    current.initialized=true;
    current.signature=signature;
    return true;
  }

  function idsFor(scope,target,slot){
    if(scope==='all')return Array.from(state[slot].available.keys());
    if(scope==='group')return Array.from(state[slot].available.values()).filter(entry=>entry.group===target).map(entry=>entry.id);
    if(scope==='placement'&&state[slot].available.has(target))return[target];
    return[];
  }
  function setSelection(ids,slot,checked){ids.forEach(id=>checked?state[slot].selected.add(id):state[slot].selected.delete(id))}

  function choice(scope,target,kind,rowLabel){
    const label=document.createElement('label');
    label.className=`sky-chart-placement-choice sky-chart-placement-choice-${kind}`;
    const input=document.createElement('input');
    input.type='checkbox';
    input.dataset.placementScope=scope;
    input.dataset.placementTarget=target;
    input.dataset.placementChoice=kind;
    input.setAttribute('aria-label',`${rowLabel}: ${kind==='all'?'All skies':`Sky ${kind.toUpperCase()}`}`);
    const text=document.createElement('span');
    text.textContent=kind==='all'?'All':kind.toUpperCase();
    label.append(input,text);
    return label;
  }
  function row(scope,target,labelText,kind){
    const item=document.createElement('div');
    item.className=`sky-chart-placement-list-item sky-chart-placement-list-item-${kind}`;
    item.dataset.placementListItem=target;
    const label=document.createElement('strong');
    label.className='sky-chart-placement-list-label';
    label.textContent=labelText;
    const choices=document.createElement('div');
    choices.className='sky-chart-placement-list-choices';
    choices.setAttribute('role','group');
    choices.setAttribute('aria-label',labelText);
    ['all','a','b'].forEach(kindName=>choices.appendChild(choice(scope,target,kindName,labelText)));
    item.append(label,choices);
    return item;
  }
  function listEntries(groupId){
    const combined=new Map();
    activeSlots().forEach(slot=>state[slot].available.forEach(entry=>{
      if(entry.group===groupId&&!combined.has(entry.id))combined.set(entry.id,entry);
    }));
    const groupOrder=GROUPS.find(group=>group.id===groupId)?.members||[];
    const rank=id=>{const index=groupOrder.indexOf(id);return index<0?Number.MAX_SAFE_INTEGER:index};
    return Array.from(combined.values()).sort((a,b)=>rank(a.id)-rank(b.id)||a.label.localeCompare(b.label));
  }

  function updateChoice(input){
    const slots=input.dataset.placementChoice==='all'?activeSlots():[input.dataset.placementChoice.toUpperCase()];
    let available=0,selected=0;
    slots.forEach(slot=>{
      if(slot==='B'&&!bActive())return;
      const ids=idsFor(input.dataset.placementScope,input.dataset.placementTarget,slot);
      available+=ids.length;
      selected+=ids.filter(id=>state[slot].selected.has(id)).length;
    });
    input.checked=available>0&&selected===available;
    input.indeterminate=selected>0&&selected<available;
    input.disabled=available===0;
  }
  function summary(slot){
    const current=state[slot];
    if(!current.selected.size)return'None';
    if(current.available.size&&current.selected.size===current.available.size)return'All';
    if(current.selected.size===1)return current.available.get(Array.from(current.selected)[0])?.label||'1 selected';
    return`${current.selected.size} of ${current.available.size}`;
  }
  function combinedSummary(){
    const a=summary('A');
    if(!bActive())return a;
    const b=summary('B');
    if(a==='All'&&b==='All')return'All';
    if(a==='None'&&b==='None')return'None';
    return`A: ${a} · B: ${b}`;
  }
  function updateControl(){
    const owner=control(),menu=popover();
    if(!owner||!menu)return;
    owner.querySelectorAll('[data-placement-choice]').forEach(updateChoice);
    if(!owner.contains(menu))menu.querySelectorAll('[data-placement-choice]').forEach(updateChoice);
    const status=owner.querySelector('[data-placement-filter-summary]');
    if(status)status.textContent=combinedSummary();
  }
  function renderList(){
    const menu=popover(),body=menu?.querySelector('.sky-chart-placement-filter-body');
    if(!body)return;
    const priorScroll=menu.scrollTop;
    const list=document.createElement('div');
    list.className='sky-chart-placement-list';
    list.dataset.placementList='combined';
    const header=document.createElement('div');
    header.className='sky-chart-placement-list-header';
    header.innerHTML='<strong>Placement</strong><span>All</span><span>A</span><span>B</span>';
    list.append(header,row('all','all','All placements','master'));
    GROUPS.forEach(group=>{
      const entries=listEntries(group.id);
      if(!entries.length)return;
      list.appendChild(row('group',group.id,group.label,'group'));
      entries.forEach(entry=>list.appendChild(row('placement',entry.id,entry.label,'placement')));
    });
    body.replaceChildren(list);
    updateControl();
    if(isOpen(portalOwner))requestAnimationFrame(()=>{menu.scrollTop=priorScroll});
  }

  function invalidateRenderCache(){renderCache={list:null,wheel:null,rowCount:-1,aspectCount:-1,rows:[],aspectsByIndex:new Map()}}
  function currentRenderCache(){
    const list=document.getElementById('skyFoundationRelationshipList');
    const wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
    const rowCount=list?.querySelectorAll('.sky-foundation-relationship-row').length||0;
    const aspectCount=wheel?.querySelectorAll('[data-layer="aspects"] .sky-foundation-aspect[data-relation-index]').length||0;
    if(renderCache.list===list&&renderCache.wheel===wheel&&renderCache.rowCount===rowCount&&renderCache.aspectCount===aspectCount)return renderCache;
    const rows=list?Array.from(list.querySelectorAll('.sky-foundation-relationship-row')):[];
    const aspectsByIndex=new Map();
    wheel?.querySelectorAll('[data-layer="aspects"] .sky-foundation-aspect[data-relation-index]').forEach(node=>{
      const key=String(node.dataset.relationIndex||'');
      if(!key)return;
      if(!aspectsByIndex.has(key))aspectsByIndex.set(key,[]);
      aspectsByIndex.get(key).push(node);
    });
    renderCache={list,wheel,rowCount,aspectCount,rows,aspectsByIndex};
    return renderCache;
  }
  function relationshipMatches(row){
    if(state.A.selected.size===0&&state.B.selected.size===0)return false;
    const [leftSlot,rightSlot]=relationshipSlots(row);
    const leftId=canonicalId(row.dataset.leftPlacement);
    const rightId=canonicalId(row.dataset.rightPlacement);
    return(!!leftId&&state[leftSlot]?.selected.has(leftId))||(!!rightId&&state[rightSlot]?.selected.has(rightId));
  }
  function updateCount(rows){
    requestAnimationFrame(()=>{
      const eligible=rows.filter(row=>!row.classList.contains('sky-foundation-single-sky-cross-hidden'));
      const shown=eligible.filter(row=>
        !row.hidden&&
        !row.classList.contains('sky-chart-filter-hidden')&&
        !row.classList.contains('sky-chart-orb-hidden')&&
        !row.classList.contains('sky-orb-filter-hidden')&&
        !row.classList.contains('sky-chart-multiselect-hidden')&&
        !row.classList.contains('sky-chart-house-multiselect-hidden')&&
        !row.classList.contains('sky-chart-aspect-multiselect-hidden')&&
        !row.classList.contains('sky-chart-sign-filter-hidden')&&
        !row.classList.contains('sky-chart-semantic-hidden')
      ).length;
      const count=document.getElementById('skyFoundationRelationshipCount');
      const empty=document.getElementById('skyFoundationRelationshipEmpty');
      if(count)count.textContent=`${shown}/${eligible.length}`;
      if(empty)empty.hidden=shown!==0;
    });
  }
  function applyNow(){
    applyQueued=false;
    const cache=currentRenderCache();
    cache.rows.forEach(row=>{
      const visible=relationshipMatches(row);
      row.classList.toggle('sky-chart-multiselect-hidden',!visible);
      (cache.aspectsByIndex.get(String(row.dataset.relationIndex||''))||[]).forEach(node=>node.classList.toggle('sky-chart-multiselect-hidden',!visible));
    });
    updateControl();
    document.documentElement.dataset.skyPlacementMultiselect='v4';
    document.documentElement.dataset.skyPlacementFilterSemantics='endpoint-or';
    updateCount(cache.rows);
    window.dispatchEvent(new CustomEvent('relphi:sky-placement-multiselect-changed',{detail:{A:Array.from(state.A.selected),B:Array.from(state.B.selected)}}));
  }
  function scheduleApply(){
    if(applyQueued)return;
    applyQueued=true;
    requestAnimationFrame(applyNow);
  }

  function stablePopoverWidth(){
    const margin=12;
    return Math.max(280,Math.min(360,window.innerWidth-margin*2));
  }
  function position(remeasureWidth=false){
    const owner=portalOwner,menu=popover(),head=owner?.querySelector('.sky-chart-placement-filter-head');
    if(!isOpen(owner)||!menu?.classList.contains('is-portaled')||!head)return;
    if(remeasureWidth||!lockedPopoverWidth)lockedPopoverWidth=stablePopoverWidth();
    const rect=head.getBoundingClientRect();
    const margin=12,width=lockedPopoverWidth;
    const left=Math.min(window.innerWidth-width-margin,Math.max(margin,rect.left+rect.width/2-width/2));
    const below=window.innerHeight-rect.bottom-margin;
    const above=rect.top-margin;
    const maxHeight=Math.max(220,Math.min(560,Math.max(below,above)));
    const top=below<280&&above>below?Math.max(margin,rect.top-maxHeight-6):Math.min(window.innerHeight-maxHeight-margin,rect.bottom+6);
    Object.assign(menu.style,{width:`${width}px`,maxHeight:`${maxHeight}px`,left:`${left}px`,top:`${Math.max(margin,top)}px`});
  }
  function schedulePosition(remeasureWidth=false){
    if(positionQueued)return;
    positionQueued=true;
    requestAnimationFrame(()=>{positionQueued=false;position(remeasureWidth)});
  }
  function open(owner){
    const menu=owner.querySelector('.sky-chart-placement-filter-popover')||popover();
    if(!menu)return;
    portalOwner=owner;
    lockedPopoverWidth=stablePopoverWidth();
    owner.classList.add('is-open');
    menu.hidden=false;
    menu.classList.add('is-portaled');
    document.body.appendChild(menu);
    owner.querySelector('[data-placement-filter-toggle]')?.setAttribute('aria-expanded','true');
    requestAnimationFrame(()=>position(false));
  }
  function close(owner){
    const menu=popover();
    if(!menu||!owner)return;
    menu.hidden=true;
    menu.classList.remove('is-portaled');
    menu.removeAttribute('style');
    owner.appendChild(menu);
    owner.classList.remove('is-open');
    owner.querySelector('[data-placement-filter-toggle]')?.setAttribute('aria-expanded','false');
    portalOwner=null;
    lockedPopoverWidth=0;
  }

  function createControl(){
    const root=document.createElement('div');
    root.className='sky-chart-placement-filter sky-chart-placement-filter-combined';
    root.dataset.placementFilter='combined';
    root.innerHTML='<div class="sky-chart-placement-filter-head"><span class="sky-chart-placement-filter-label">Placements</span><div class="sky-chart-placement-summary-choices" role="group" aria-label="All placements"></div><button type="button" class="sky-chart-placement-filter-toggle" data-placement-filter-toggle aria-label="Open placement filters" aria-haspopup="dialog" aria-expanded="false" aria-controls="skyChartPlacementPopover"></button><span class="sky-chart-placement-filter-status" data-placement-filter-summary aria-live="polite">All</span></div><div id="skyChartPlacementPopover" class="sky-chart-placement-filter-popover" role="dialog" aria-label="Placement filters" hidden><div class="sky-chart-placement-filter-body"></div></div>';
    const choices=root.querySelector('.sky-chart-placement-summary-choices');
    ['all','a','b'].forEach(kind=>choices.appendChild(choice('all','all',kind,'All placements')));
    root.querySelector('[data-placement-filter-toggle]').addEventListener('click',()=>isOpen(root)?close(root):open(root));
    return root;
  }
  function removeLegacyControls(bar){
    bar.querySelectorAll('select[data-filter="placement"],select[data-filter="placements"]').forEach(select=>{
      const label=select.closest('label');
      if(label&&label.parentElement===bar)label.remove();else select.remove();
    });
    bar.querySelectorAll('[data-placement-filter-sky]').forEach(node=>node.remove());
  }
  function ensure(){
    const bar=filterBar();
    if(!bar)return false;
    removeLegacyControls(bar);
    let owner=bar.querySelector('[data-placement-filter="combined"]');
    if(!owner)owner=createControl();
    if(!owner.isConnected){
      const aspect=bar.querySelector('[data-filter="aspect"]')?.closest('label')||bar.querySelector('[data-aspect-filter="combined"]');
      const houses=bar.querySelector('[data-house-filter="combined"]');
      if(houses)houses.insertAdjacentElement('beforebegin',owner);
      else if(aspect)aspect.insertAdjacentElement('afterend',owner);
      else bar.prepend(owner);
    }
    bar.dataset.multiselectPlacementFilters='true';
    return true;
  }

  function whereWhenEditing(){return document.documentElement.dataset.skyWhereWhenEditing==='true'}
  function refresh(){
    refreshQueued=false;
    if(whereWhenEditing()||!ensure())return;
    const changed=refreshAvailable('A')|refreshAvailable('B');
    if(changed||!popover()?.querySelector('[data-placement-list]'))renderList();
    else updateControl();
    invalidateRenderCache();
    scheduleApply();
    if(isOpen(portalOwner))schedulePosition(false);
  }
  function scheduleRefresh(){
    if(refreshQueued||whereWhenEditing())return;
    refreshQueued=true;
    requestAnimationFrame(refresh);
  }
  function handleChange(event){
    const input=event.target.closest?.('[data-placement-choice]');
    if(!input)return;
    const slots=input.dataset.placementChoice==='all'?activeSlots():[input.dataset.placementChoice.toUpperCase()];
    slots.forEach(slot=>setSelection(idsFor(input.dataset.placementScope,input.dataset.placementTarget,slot),slot,input.checked));
    updateControl();
    scheduleApply();
  }

  function eventInsidePlacementUI(event){
    const owner=portalOwner,menu=popover();
    if(!owner||!menu)return false;
    const path=typeof event.composedPath==='function'?event.composedPath():[];
    if(path.includes(owner)||path.includes(menu)||owner.contains(event.target)||menu.contains(event.target))return true;
    if(Number.isFinite(event.clientX)&&Number.isFinite(event.clientY)){
      const rect=menu.getBoundingClientRect();
      if(event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom)return true;
    }
    return false;
  }

  function start(){
    const root=document.getElementById('skyFoundationRoot');
    if(root){
      rootObserver=new MutationObserver(records=>{
        const meaningful=records.some(record=>{
          if(record.target?.closest?.('.sky-chart-placement-filter'))return false;
          return Array.from(record.addedNodes).some(node=>node.nodeType===1&&(node.matches?.('.sky-foundation-relationship-row,.sky-foundation-wheel,#skyFoundationRelationshipList')||node.querySelector?.('.sky-foundation-relationship-row,.sky-foundation-wheel')))||
            Array.from(record.removedNodes).some(node=>node.nodeType===1&&(node.matches?.('.sky-foundation-relationship-row,.sky-foundation-wheel,#skyFoundationRelationshipList')||node.querySelector?.('.sky-foundation-relationship-row,.sky-foundation-wheel')));
        });
        if(meaningful)scheduleRefresh();
      });
      rootObserver.observe(root,{childList:true,subtree:true});
    }
    modeObserver=new MutationObserver(records=>{
      if(records.some(record=>['data-sky-b-present','data-sky-b-editing','data-sky-last-mode'].includes(record.attributeName)))scheduleRefresh();
    });
    modeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-sky-b-present','data-sky-b-editing','data-sky-last-mode']});

    ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-single-sky-aspects-rendered'].forEach(name=>window.addEventListener(name,scheduleRefresh));
    document.addEventListener('change',handleChange);
    document.addEventListener('pointerdown',event=>{
      if(!isOpen(portalOwner))return;
      if(eventInsidePlacementUI(event))return;
      close(portalOwner);
    },true);
    document.addEventListener('keydown',event=>{
      if(event.key!=='Escape'||!isOpen(portalOwner))return;
      const owner=portalOwner;
      close(owner);
      owner.querySelector('[data-placement-filter-toggle]')?.focus();
    });
    window.addEventListener('resize',()=>schedulePosition(true));
    window.addEventListener('scroll',event=>{
      if(!isOpen(portalOwner))return;
      const menu=popover();
      if(event.target===menu||menu?.contains?.(event.target))return;
      schedulePosition(false);
    },true);
    window.visualViewport?.addEventListener('resize',()=>schedulePosition(true));
    scheduleRefresh();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
