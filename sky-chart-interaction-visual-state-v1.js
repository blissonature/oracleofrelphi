// View-only interaction renderer for the rearchitected Sky Chart.
// The application core remains the sole owner of hover/selection state; this module
// restores the wheel's kept/dimmed visual grammar using cached model indexes.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.RelphiSkyInteractionVisualState)return;

  const empty=()=>({relationships:new Set(),placements:new Set(),houses:new Set(),signs:new Set()});
  const index={placement:new Map(),house:new Map(),sign:new Map()};
  const placementContext=new Map(),placementsByHouse=new Map(),placementsBySign=new Map(),signGlyphs=new Map();
  let previousKeep=empty(),previousActiveKey='',previousLocked=null,queued=false,wheel=null;

  const add=(map,key,value)=>{if(!map.has(key))map.set(key,new Set());map.get(key).add(value)};
  const keyOf=target=>target?`${target.kind}|${target.key}`:'';
  const app=()=>window.RelphiSkyChartApplication;

  function rebuildIndexes(){
    const application=app(),model=application?.model;
    if(!application||!model)return false;
    Object.values(index).forEach(map=>map.clear());
    placementContext.clear();placementsByHouse.clear();placementsBySign.clear();signGlyphs.clear();

    model.relationships.forEach(relation=>{
      add(index.placement,`${relation.left.sky}:${relation.left.id}`,relation.id);
      add(index.placement,`${relation.right.sky}:${relation.right.id}`,relation.id);
      add(index.house,`${relation.left.sky}:${relation.left.house}`,relation.id);
      add(index.house,`${relation.right.sky}:${relation.right.house}`,relation.id);
      add(index.sign,String(relation.left.sign),relation.id);
      add(index.sign,String(relation.right.sign),relation.id);
    });

    ['A','B'].forEach(sky=>(model.placements?.[sky]||[]).forEach(record=>{
      const placementKey=`${sky}:${record.id}`,houseKey=`${sky}:${record.house}`,signKey=String(record.sign);
      placementContext.set(placementKey,{house:houseKey,sign:signKey});
      add(placementsByHouse,houseKey,placementKey);
      add(placementsBySign,signKey,placementKey);
    }));

    wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
    const view=application.view;
    view.placements.forEach(nodes=>nodes.forEach(node=>{
      if(!node.ownerSVGElement)return;
      const tag=node.tagName?.toLowerCase();
      if(tag==='g'){
        node.classList.add('sky-foundation-placement','sky-foundation-focus-piece');
        node.dataset.focusPiece='placement';
      }else if(tag==='line'){
        node.classList.add('sky-foundation-focus-piece');
        node.dataset.focusPiece='leader';
      }
    }));
    view.houses.forEach(nodes=>nodes.forEach(node=>{
      node.classList.add('sky-foundation-house-sector','sky-foundation-focus-piece');
      node.dataset.focusPiece='house';
    }));
    view.signs.forEach(nodes=>nodes.forEach(node=>{
      node.classList.add('sky-foundation-sign-sector','sky-foundation-focus-piece');
      node.dataset.focusPiece='sign';
    }));
    view.visibleLines.forEach(line=>{
      line.classList.add('sky-foundation-focus-piece');
      line.dataset.focusPiece='aspect';
    });

    const zodiac=document.querySelector('[data-layer="zodiac"]');
    [...zodiac?.children||[]].filter(node=>node.tagName?.toLowerCase()==='g').forEach((node,position)=>{
      const signKey=String(position);
      node.classList.add('sky-foundation-sign-glyph','sky-foundation-focus-piece');
      node.dataset.focusPiece='sign';node.dataset.sign=signKey;node.style.pointerEvents='none';
      add(signGlyphs,signKey,node);
    });
    return true;
  }

  function relatedIds(target){
    if(!target)return new Set();
    if(target.kind==='relationship')return new Set([target.key]);
    if(target.kind==='placement')return new Set(index.placement.get(target.key)||[]);
    if(target.kind==='house')return new Set(index.house.get(target.key)||[]);
    if(target.kind==='sign')return new Set(index.sign.get(target.key)||[]);
    return new Set();
  }

  function keepFor(target){
    const application=app(),keep=empty();
    if(!target||!application?.model)return keep;
    keep.relationships=relatedIds(target);
    keep.relationships.forEach(id=>{
      const relation=application.model.byId.get(id);if(!relation)return;
      keep.placements.add(`${relation.left.sky}:${relation.left.id}`);keep.placements.add(`${relation.right.sky}:${relation.right.id}`);
      keep.houses.add(`${relation.left.sky}:${relation.left.house}`);keep.houses.add(`${relation.right.sky}:${relation.right.house}`);
      keep.signs.add(String(relation.left.sign));keep.signs.add(String(relation.right.sign));
    });

    if(target.kind==='house'){
      keep.houses.add(target.key);
      (placementsByHouse.get(target.key)||[]).forEach(placementKey=>{
        keep.placements.add(placementKey);
        const context=placementContext.get(placementKey);if(context)keep.signs.add(context.sign);
      });
    }else if(target.kind==='placement'){
      keep.placements.add(target.key);
      const context=placementContext.get(target.key);if(context){keep.houses.add(context.house);keep.signs.add(context.sign)}
    }else if(target.kind==='sign'){
      keep.signs.add(target.key);
      (placementsBySign.get(target.key)||[]).forEach(placementKey=>{
        keep.placements.add(placementKey);
        const context=placementContext.get(placementKey);if(context)keep.houses.add(context.house);
      });
    }
    return keep;
  }

  function toggleNodes(nodes,className,enabled){nodes?.forEach(node=>node.classList.toggle(className,enabled))}
  function mapDelta(map,previous,next,className){
    previous.forEach(key=>{if(!next.has(key))toggleNodes(map.get(key),className,false)});
    next.forEach(key=>{if(!previous.has(key))toggleNodes(map.get(key),className,true)});
  }
  function lineDelta(view,previous,next,className){
    previous.forEach(id=>{if(!next.has(id))view.visibleLines.get(id)?.classList.remove(className)});
    next.forEach(id=>{if(!previous.has(id))view.visibleLines.get(id)?.classList.add(className)});
  }
  function signDelta(view,previous,next,className){
    mapDelta(view.signs,previous,next,className);mapDelta(signGlyphs,previous,next,className);
  }

  function directNodes(target){
    const view=app()?.view;if(!target||!view)return new Set();
    if(target.kind==='relationship')return view.relationNodes.get(target.key)||new Set();
    if(target.kind==='placement')return view.placements.get(target.key)||new Set();
    if(target.kind==='house')return view.houses.get(target.key)||new Set();
    if(target.kind==='sign')return view.signs.get(target.key)||new Set();
    return new Set();
  }

  function applyKeep(nextKeep,active){
    const application=app(),view=application?.view;if(!view)return;
    mapDelta(view.placements,previousKeep.placements,nextKeep.placements,'is-kept');
    mapDelta(view.houses,previousKeep.houses,nextKeep.houses,'is-kept');
    signDelta(view,previousKeep.signs,nextKeep.signs,'is-kept');
    lineDelta(view,previousKeep.relationships,nextKeep.relationships,'is-kept');
    previousKeep=nextKeep;
    wheel?.classList.toggle('has-isolation',!!active);
    ['A','B'].forEach(sky=>document.getElementById(`skyFoundation${sky}`)?.classList.toggle('has-ledger-isolation',!!active));
  }

  function render(){
    queued=false;
    const application=app();if(!application?.model||!application?.view)return;
    if(!wheel?.isConnected&&!rebuildIndexes())return;
    const active=application.state.locked||application.state.hover||null,activeKey=keyOf(active),locked=application.state.locked||null;
    if(keyOf(locked)!==keyOf(previousLocked)){
      toggleNodes(directNodes(previousLocked),'is-selected',false);
      toggleNodes(directNodes(locked),'is-selected',true);
      previousLocked=locked;
    }
    if(activeKey!==previousActiveKey){
      applyKeep(keepFor(active),active);
      previousActiveKey=activeKey;
    }
  }

  function schedule(){if(queued)return;queued=true;requestAnimationFrame(render)}
  function scheduleFromEvent(event){
    const root=document.getElementById('skyFoundationRoot');
    if(root&&(root.contains(event.target)||root.contains(event.relatedTarget)))schedule();
  }
  function refresh(){
    const application=app();if(!application?.model)return;
    applyKeep(empty(),null);toggleNodes(directNodes(previousLocked),'is-selected',false);
    previousKeep=empty();previousActiveKey='';previousLocked=null;
    if(rebuildIndexes())schedule();
  }

  ['pointerover','pointerout','focusin','focusout'].forEach(name=>document.addEventListener(name,scheduleFromEvent));
  window.addEventListener('relphi:sky-interaction-selection-changed',schedule);
  window.addEventListener('relphi:sky-foundation-interactions-ready',refresh);
  window.RelphiSkyInteractionVisualState=Object.freeze({refresh,render});
  if(document.getElementById('skyFoundationRoot')?.getAttribute('aria-busy')==='false')refresh();
})();
