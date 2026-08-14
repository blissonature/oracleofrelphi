// Fast hover path for Sky Chart: immediate wheel paint, cached relationship semantics,
// and a spatial index for aspect-line proximity. Click/keyboard selection remains owned
// by sky-chart-foundation-interactions-v2.js.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyHoverFastPathV1)return;
  window.__relphiSkyHoverFastPathV1=true;

  const GRID=48;
  const ASPECT_RADIUS=9;
  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  let cache=null;
  let hoverState=null;
  let keptNodes=new Set();
  let endpointNodes=new Set();
  let hoveredNodes=new Set();
  let syncFrame=0;
  let boundRoot=null;

  const num=value=>{const n=Number(value);return Number.isFinite(n)?n:NaN};
  const norm=value=>((Number(value)%360)+360)%360;
  const same=(a,b)=>!!a&&!!b&&a.kind===b.kind&&a.sky===b.sky&&a.value===b.value;
  const key=(slot,value)=>`${slot}:${value}`;

  function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
  function profile(slot){const value=read(slot);return value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{}}
  function houseCusps(slot){
    const value=read(slot)||{},p=profile(slot);
    for(const raw of [p.houseCusps,p.cusps,value.houseCusps,value.cusps,value.houses]){
      if(!raw)continue;
      const values=(Array.isArray(raw)?raw:Object.values(raw)).map(item=>typeof item==='object'?Number(item.longitude??item.value??item.cusp):Number(item)).slice(0,12);
      if(values.length===12&&values.every(Number.isFinite))return values.map(norm);
    }
    return[];
  }
  function arcsOverlap(start,span,targetStart,targetSpan){
    const samples=[start,norm(start+span-.0001),targetStart,norm(targetStart+targetSpan-.0001)];
    const inside=(value,arcStart,arcSpan)=>norm(value-arcStart)<arcSpan;
    return samples.some((value,index)=>index<2?inside(value,targetStart,targetSpan):inside(value,start,span));
  }
  function housesForSign(cusps,sign){
    if(cusps.length!==12)return[];
    const result=[],targetStart=sign*30;
    cusps.forEach((start,index)=>{const span=norm(cusps[(index+1)%12]-start)||30;if(arcsOverlap(start,span,targetStart,30))result.push(index+1)});
    return result;
  }

  function addMap(map,name,node){if(name==null)return;let set=map.get(name);if(!set){set=new Set();map.set(name,set)}set.add(node)}
  function transform(matrix,x,y){return{x:matrix.a*x+matrix.c*y+matrix.e,y:matrix.b*x+matrix.d*y+matrix.f}}
  function gridKey(x,y){return`${Math.floor(x/GRID)},${Math.floor(y/GRID)}`}
  function addSegmentToGrid(grid,segment){
    const minX=Math.min(segment.a.x,segment.b.x)-ASPECT_RADIUS,maxX=Math.max(segment.a.x,segment.b.x)+ASPECT_RADIUS;
    const minY=Math.min(segment.a.y,segment.b.y)-ASPECT_RADIUS,maxY=Math.max(segment.a.y,segment.b.y)+ASPECT_RADIUS;
    for(let gx=Math.floor(minX/GRID);gx<=Math.floor(maxX/GRID);gx++)for(let gy=Math.floor(minY/GRID);gy<=Math.floor(maxY/GRID);gy++){
      const id=`${gx},${gy}`;let list=grid.get(id);if(!list){list=[];grid.set(id,list)}list.push(segment);
    }
  }
  function distanceToSegment(x,y,a,b){
    const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;if(!length)return Math.hypot(x-a.x,y-a.y);
    const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/length));
    return Math.hypot(x-(a.x+t*dx),y-(a.y+t*dy));
  }
  function relationshipSlots(row){
    const mode=row.dataset.relationshipMode||document.documentElement.dataset.skyRelationshipMode||'A-B';
    return{left:row.dataset.leftSky||(mode==='B-B'?'B':'A'),right:row.dataset.rightSky||(mode==='A-A'?'A':'B')};
  }

  function rebuild(){
    const wheel=document.querySelector('#skyFoundationWheelMount > svg.sky-foundation-wheel');
    if(!wheel)return;
    const focus={aspect:new Map(),placement:new Map(),house:new Map(),sign:new Map()};
    const interactive={aspect:new Map(),placement:new Map(),house:new Map(),sign:new Map()};
    const placements=[];

    wheel.querySelectorAll('[data-focus-piece]').forEach(node=>{
      const type=node.dataset.focusPiece;
      if(type==='aspect')addMap(focus.aspect,Number(node.dataset.relationIndex),node);
      else if(type==='placement'||type==='leader')addMap(focus.placement,key(node.dataset.sky,node.dataset.placement),node);
      else if(type==='house')addMap(focus.house,key(node.dataset.sky,node.dataset.house),node);
      else if(type==='sign')addMap(focus.sign,Number(node.dataset.sign),node);
    });
    wheel.querySelectorAll('[data-interactive]').forEach(node=>{
      const type=node.dataset.interactive;
      if(type==='aspect')addMap(interactive.aspect,Number(node.dataset.relationIndex),node);
      else if(type==='placement'){
        const id=key(node.dataset.sky,node.dataset.placement);addMap(interactive.placement,id,node);
        placements.push({node,slot:node.dataset.sky,id:node.dataset.placement,house:Number(node.dataset.house),sign:Number(node.dataset.sign)});
      }else if(type==='house')addMap(interactive.house,key(node.dataset.sky,node.dataset.house),node);
      else if(type==='sign')addMap(interactive.sign,Number(node.dataset.sign),node);
    });

    const relations=Array.from(document.querySelectorAll('.sky-foundation-relationship-row[data-relation-index]')).map(row=>{
      const slots=relationshipSlots(row);
      return{index:Number(row.dataset.relationIndex),left:{slot:slots.left,id:row.dataset.leftPlacement,house:Number(row.dataset.leftHouse),sign:Number(row.dataset.leftSign)},right:{slot:slots.right,id:row.dataset.rightPlacement,house:Number(row.dataset.rightHouse),sign:Number(row.dataset.rightSign)}};
    }).filter(item=>Number.isInteger(item.index));

    const grid=new Map(),segments=[];
    const matrix=wheel.getScreenCTM?.();
    if(matrix){
      wheel.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)').forEach(line=>{
        const index=Number(line.dataset.relationIndex),x1=num(line.getAttribute('x1')),y1=num(line.getAttribute('y1')),x2=num(line.getAttribute('x2')),y2=num(line.getAttribute('y2'));
        if(!Number.isInteger(index)||![x1,y1,x2,y2].every(Number.isFinite))return;
        const segment={line,index,a:transform(matrix,x1,y1),b:transform(matrix,x2,y2)};segments.push(segment);addSegmentToGrid(grid,segment);
      });
    }
    cache={wheel,focus,interactive,placements,relations,cusps:{A:houseCusps('A'),B:houseCusps('B')},grid,segments};
    clearFast(false);
  }

  function relationMatches(relation,state){
    if(!state)return true;
    if(state.kind==='aspect')return relation.index===state.value;
    if(state.kind==='sign')return relation.left.sign===state.value||relation.right.sign===state.value;
    if(state.kind==='house')return(relation.left.slot===state.sky&&relation.left.house===state.value)||(relation.right.slot===state.sky&&relation.right.house===state.value);
    if(state.kind==='placement')return(relation.left.slot===state.sky&&relation.left.id===state.value)||(relation.right.slot===state.sky&&relation.right.id===state.value);
    return true;
  }
  function keepSets(state){
    const matched=new Set(),placements=new Set(),houses=new Set(),signs=new Set();
    cache.relations.forEach(relation=>{if(!relationMatches(relation,state))return;matched.add(relation.index);for(const end of [relation.left,relation.right]){placements.add(key(end.slot,end.id));houses.add(key(end.slot,end.house));signs.add(end.sign)}});
    if(state?.kind==='house'){
      houses.add(key(state.sky,state.value));
      cache.placements.filter(item=>item.slot===state.sky&&item.house===state.value).forEach(item=>{placements.add(key(item.slot,item.id));signs.add(item.sign)});
    }
    if(state?.kind==='sign'){
      signs.add(state.value);
      cache.placements.filter(item=>item.sign===state.value).forEach(item=>placements.add(key(item.slot,item.id)));
      for(const slot of ['A','B'])housesForSign(cache.cusps[slot],state.value).forEach(house=>houses.add(key(slot,house)));
    }
    if(state?.kind==='placement'){
      placements.add(key(state.sky,state.value));
      const item=cache.placements.find(record=>record.slot===state.sky&&record.id===state.value);
      if(item){houses.add(key(item.slot,item.house));signs.add(item.sign)}
    }
    return{matched,placements,houses,signs};
  }

  function nodesForKeep(keep){
    const result=new Set();
    keep.matched.forEach(value=>cache.focus.aspect.get(value)?.forEach(node=>result.add(node)));
    keep.placements.forEach(value=>cache.focus.placement.get(value)?.forEach(node=>result.add(node)));
    keep.houses.forEach(value=>cache.focus.house.get(value)?.forEach(node=>result.add(node)));
    keep.signs.forEach(value=>cache.focus.sign.get(value)?.forEach(node=>result.add(node)));
    return result;
  }
  function exactNodes(state){
    const result=new Set();if(!state)return result;
    if(state.kind==='aspect')cache.interactive.aspect.get(state.value)?.forEach(node=>result.add(node));
    else if(state.kind==='placement')cache.interactive.placement.get(key(state.sky,state.value))?.forEach(node=>result.add(node));
    else if(state.kind==='house')cache.interactive.house.get(key(state.sky,state.value))?.forEach(node=>result.add(node));
    else if(state.kind==='sign')cache.interactive.sign.get(state.value)?.forEach(node=>result.add(node));
    return result;
  }

  function clearClasses(){
    keptNodes.forEach(node=>node.classList.remove('is-kept'));keptNodes.clear();
    endpointNodes.forEach(node=>node.classList.remove('is-aspect-endpoint'));endpointNodes.clear();
    hoveredNodes.forEach(node=>node.classList.remove('is-hovered'));hoveredNodes.clear();
  }
  function clearFast(dispatch=true){
    cancelAnimationFrame(syncFrame);syncFrame=0;
    clearClasses();
    cache?.wheel?.classList.remove('has-isolation');
    hoverState=null;
    if(dispatch)queueSecondary(null,new Set());
  }
  function locked(){const clear=document.getElementById('skyFoundationClearIsolation');return!!clear&&!clear.hidden}

  function immediate(state){
    if(!cache||same(hoverState,state)||(!hoverState&&!state))return;
    clearClasses();hoverState=state;
    const keep=keepSets(state);cache.wheel.classList.toggle('has-isolation',!!state);
    keptNodes=nodesForKeep(keep);keptNodes.forEach(node=>node.classList.add('is-kept'));
    hoveredNodes=exactNodes(state);hoveredNodes.forEach(node=>node.classList.add('is-hovered'));
    if(state?.kind==='aspect'){
      keep.placements.forEach(value=>cache.focus.placement.get(value)?.forEach(node=>{endpointNodes.add(node);node.classList.add('is-aspect-endpoint')}));
    }
    queueSecondary(state,keep.matched,keep);
  }

  function queueSecondary(state,matched,keep){
    cancelAnimationFrame(syncFrame);
    syncFrame=requestAnimationFrame(()=>{
      syncFrame=0;
      if(state&&!same(state,hoverState))return;
      for(const slot of ['A','B']){
        const panel=document.getElementById(slot==='A'?'skyFoundationA':'skyFoundationB');if(!panel)continue;
        panel.classList.toggle('has-ledger-isolation',!!state);
        panel.querySelectorAll('.sky-foundation-row[data-placement]').forEach(row=>{
          const id=key(slot,row.dataset.placement);
          row.classList.toggle('is-kept',!!state&&!!keep?.placements?.has(id));
          row.classList.toggle('is-hovered',!!state&&state.kind==='placement'&&state.sky===slot&&state.value===row.dataset.placement);
        });
      }
      window.dispatchEvent(new CustomEvent('relphi:sky-foundation-filter-changed',{detail:{state:state?{...state,mode:'hover'}:null,relationshipIndexes:Array.from(state?matched:cache?.relations.map(item=>item.index)||[])}}));
    });
  }

  function stateFromNode(node){
    if(!node)return null;const kind=node.dataset.interactive;
    if(kind==='aspect')return{kind,sky:null,value:Number(node.dataset.relationIndex)};
    if(kind==='sign')return{kind,sky:null,value:Number(node.dataset.sign)};
    if(kind==='house')return{kind,sky:node.dataset.sky,value:Number(node.dataset.house)};
    if(kind==='placement')return{kind,sky:node.dataset.sky,value:node.dataset.placement};
    return null;
  }
  function directNode(target){return target instanceof Element?target.closest('[data-interactive]'):null}
  function nearestAspect(event){
    if(!cache||!Number.isFinite(event.clientX)||!Number.isFinite(event.clientY))return null;
    const candidates=cache.grid.get(gridKey(event.clientX,event.clientY))||[];let best=null,bestDistance=Infinity;
    for(const segment of candidates){
      const line=segment.line;if(!line.isConnected||line.hidden||line.style.display==='none'||line.classList.contains('sky-chart-filter-hidden')||line.classList.contains('sky-chart-orb-hidden')||line.classList.contains('sky-orb-filter-hidden'))continue;
      const distance=distanceToSegment(event.clientX,event.clientY,segment.a,segment.b);if(distance<bestDistance){bestDistance=distance;best=segment}
    }
    return bestDistance<=ASPECT_RADIUS?best:null;
  }
  function stateAt(event){
    const node=directNode(event.target);
    if(node&&node.dataset.interactive!=='aspect')return stateFromNode(node);
    const nearest=nearestAspect(event);return nearest?{kind:'aspect',sky:null,value:nearest.index}:node?stateFromNode(node):null;
  }

  function captureMove(event){
    if(!event.target.closest?.('#skyFoundationWheelMount'))return;
    event.stopImmediatePropagation();
    if(locked()){clearFast(false);return}
    immediate(stateAt(event));
  }
  function captureOut(event){
    if(!event.target.closest?.('#skyFoundationWheelMount'))return;
    event.stopImmediatePropagation();
    if(locked()){clearFast(false);return}
    const related=event.relatedTarget instanceof Element?event.relatedTarget:null;
    if(related?.closest('#skyFoundationWheelMount'))return;
    immediate(null);
  }
  function captureClick(event){
    if(!event.target.closest?.('#skyFoundationWheelMount'))return;
    clearFast(false);
  }

  function bind(){
    const root=document.getElementById('skyFoundationRoot');if(!root||root===boundRoot)return;
    if(boundRoot){boundRoot.removeEventListener('pointerover',captureMove,true);boundRoot.removeEventListener('pointermove',captureMove,true);boundRoot.removeEventListener('pointerout',captureOut,true);boundRoot.removeEventListener('click',captureClick,true)}
    boundRoot=root;
    root.addEventListener('pointerover',captureMove,true);
    root.addEventListener('pointermove',captureMove,true);
    root.addEventListener('pointerout',captureOut,true);
    root.addEventListener('click',captureClick,true);
  }

  function refresh(){bind();requestAnimationFrame(rebuild)}
  function start(){
    bind();
    window.addEventListener('relphi:sky-foundation-interactions-ready',refresh);
    window.addEventListener('relphi:sky-foundation-ready',()=>{clearFast(false);cache=null});
    window.addEventListener('resize',()=>{if(cache)requestAnimationFrame(rebuild)},{passive:true});
    window.addEventListener('storage',()=>{clearFast(false);cache=null});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
