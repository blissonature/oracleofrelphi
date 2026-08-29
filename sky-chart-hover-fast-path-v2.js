// Sky Chart hover fast path v3: ownership-aware relationship identities, cached SVG geometry,
// delta class updates, and deferred ledger/list work. Click/keyboard selection remains
// owned by sky-chart-foundation-interactions-v2.js.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyHoverFastPathV3)return;
  window.__relphiSkyHoverFastPathV3=true;
  window.__relphiSkyHoverFastPathV2=true;
  window.__relphiSkyHoverFastPathV1=true;

  const GRID=64;
  const ASPECT_RADIUS_PX=9;
  const SECONDARY_DELAY_MS=36;
  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};

  let cache=null;
  let hoverState=null;
  let keptNodes=new Set();
  let endpointNodes=new Set();
  let hoveredNodes=new Set();
  let secondaryTimer=0;
  let probeFrame=0;
  let transformFrame=0;
  let pendingProbe=null;
  let boundRoot=null;

  const num=value=>{const n=Number(value);return Number.isFinite(n)?n:NaN};
  const norm=value=>((Number(value)%360)+360)%360;
  const same=(a,b)=>!!a&&!!b&&a.kind===b.kind&&a.sky===b.sky&&a.value===b.value;
  const key=(slot,value)=>`${slot}:${value}`;
  const stateKey=state=>state?`${state.kind}:${state.sky||''}:${state.value}`:'';

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

  function addMap(map,name,value){
    if(name==null)return;
    let set=map.get(name);
    if(!set){set=new Set();map.set(name,set)}
    set.add(value);
  }
  function addSegmentToGrid(grid,segment){
    const minX=Math.min(segment.a.x,segment.b.x),maxX=Math.max(segment.a.x,segment.b.x);
    const minY=Math.min(segment.a.y,segment.b.y),maxY=Math.max(segment.a.y,segment.b.y);
    for(let gx=Math.floor(minX/GRID);gx<=Math.floor(maxX/GRID);gx++)for(let gy=Math.floor(minY/GRID);gy<=Math.floor(maxY/GRID);gy++){
      const id=`${gx},${gy}`;
      let list=grid.get(id);
      if(!list){list=[];grid.set(id,list)}
      list.push(segment);
    }
  }
  function distanceToSegment(x,y,a,b){
    const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
    if(!length)return Math.hypot(x-a.x,y-a.y);
    const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/length));
    return Math.hypot(x-(a.x+t*dx),y-(a.y+t*dy));
  }
  function relationshipSlots(node){
    const mode=String(node?.dataset?.relationshipMode||document.documentElement.dataset.skyRelationshipMode||'A-B').toUpperCase();
    const left=String(node?.dataset?.leftSky||'').toUpperCase(),right=String(node?.dataset?.rightSky||'').toUpperCase();
    return{
      left:left==='A'||left==='B'?left:mode==='B-B'?'B':'A',
      right:right==='A'||right==='B'?right:mode==='A-A'?'A':'B'
    };
  }
  function relationshipIdentity(node){
    if(!node)return'';
    const slots=relationshipSlots(node),left=String(node.dataset.leftPlacement||''),aspect=String(node.dataset.aspect||''),right=String(node.dataset.rightPlacement||'');
    return left&&aspect&&right?`${slots.left}:${left}|${aspect}|${slots.right}:${right}`:'';
  }

  function updateTransform(){
    transformFrame=0;
    if(!cache?.wheel)return;
    const matrix=cache.wheel.getScreenCTM?.();
    if(!matrix){cache.transform=null;return}
    const det=matrix.a*matrix.d-matrix.b*matrix.c;
    if(!Number.isFinite(det)||Math.abs(det)<1e-9){cache.transform=null;return}
    cache.transform={
      ia:matrix.d/det,
      ib:-matrix.b/det,
      ic:-matrix.c/det,
      id:matrix.a/det,
      e:matrix.e,
      f:matrix.f,
      scale:Math.max(.0001,Math.hypot(matrix.a,matrix.b))
    };
  }
  function scheduleTransform(){
    if(transformFrame)return;
    transformFrame=requestAnimationFrame(updateTransform);
  }
  function clientToWheel(x,y){
    const t=cache?.transform;
    if(!t)return null;
    const dx=x-t.e,dy=y-t.f;
    return{x:t.ia*dx+t.ic*dy,y:t.ib*dx+t.id*dy,scale:t.scale};
  }

  function locked(){
    const clear=cache?.clearButton||document.getElementById('skyFoundationClearIsolation');
    return!!clear&&!clear.hidden;
  }
  function applyClassSet(current,next,className){
    current.forEach(node=>{if(!next.has(node))node.classList.remove(className)});
    next.forEach(node=>{if(!current.has(node))node.classList.add(className)});
    return next;
  }
  function clearClasses(){
    keptNodes=applyClassSet(keptNodes,new Set(),'is-kept');
    endpointNodes=applyClassSet(endpointNodes,new Set(),'is-aspect-endpoint');
    hoveredNodes=applyClassSet(hoveredNodes,new Set(),'is-hovered');
  }
  function cancelDeferred(){
    if(secondaryTimer){clearTimeout(secondaryTimer);secondaryTimer=0}
    if(probeFrame){cancelAnimationFrame(probeFrame);probeFrame=0}
    pendingProbe=null;
  }
  function clearFast(dispatch=true,preserveIsolation=false){
    cancelDeferred();
    clearClasses();
    if(!preserveIsolation)cache?.wheel?.classList.remove('has-isolation');
    hoverState=null;
    if(dispatch)queueSecondary(null,new Set(),null);
  }

  function indexRelation(indexes,relation){
    indexes.byIdentity.set(relation.identity,relation);
    for(const end of [relation.left,relation.right]){
      addMap(indexes.byPlacement,key(end.slot,end.id),relation);
      addMap(indexes.byHouse,key(end.slot,end.house),relation);
      addMap(indexes.bySign,end.sign,relation);
    }
  }
  function indexPlacement(indexes,item){
    indexes.byKey.set(key(item.slot,item.id),item);
    addMap(indexes.byHouse,key(item.slot,item.house),item);
    addMap(indexes.bySign,item.sign,item);
  }

  function rebuild(){
    const wheel=document.querySelector('#skyFoundationWheelMount > svg.sky-foundation-wheel');
    if(!wheel)return;
    cancelDeferred();
    clearClasses();
    hoverState=null;

    const focus={aspect:new Map(),placement:new Map(),house:new Map(),sign:new Map()};
    const interactive={aspect:new Map(),placement:new Map(),house:new Map(),sign:new Map()};
    const placements=[];
    const placementIndex={byKey:new Map(),byHouse:new Map(),bySign:new Map()};

    wheel.querySelectorAll('[data-focus-piece]').forEach(node=>{
      const type=node.dataset.focusPiece;
      if(type==='aspect'){const identity=relationshipIdentity(node);if(identity)addMap(focus.aspect,identity,node);}
      else if(type==='placement'||type==='leader')addMap(focus.placement,key(node.dataset.sky,node.dataset.placement),node);
      else if(type==='house')addMap(focus.house,key(node.dataset.sky,node.dataset.house),node);
      else if(type==='sign')addMap(focus.sign,Number(node.dataset.sign),node);
    });
    wheel.querySelectorAll('[data-interactive]').forEach(node=>{
      const type=node.dataset.interactive;
      if(type==='aspect'){const identity=relationshipIdentity(node);if(identity)addMap(interactive.aspect,identity,node);}
      else if(type==='placement'){
        const item={node,slot:node.dataset.sky,id:node.dataset.placement,house:Number(node.dataset.house),sign:Number(node.dataset.sign)};
        addMap(interactive.placement,key(item.slot,item.id),node);
        placements.push(item);
        indexPlacement(placementIndex,item);
      }else if(type==='house')addMap(interactive.house,key(node.dataset.sky,node.dataset.house),node);
      else if(type==='sign')addMap(interactive.sign,Number(node.dataset.sign),node);
    });

    const relationIndex={byIdentity:new Map(),byPlacement:new Map(),byHouse:new Map(),bySign:new Map()};
    const relations=Array.from(document.querySelectorAll('.sky-foundation-relationship-row[data-relation-index]')).map(row=>{
      const slots=relationshipSlots(row),identity=relationshipIdentity(row),address=String(row.dataset.relationIndex||'');
      return{
        identity,address,
        left:{slot:slots.left,id:row.dataset.leftPlacement,house:Number(row.dataset.leftHouse),sign:Number(row.dataset.leftSign)},
        right:{slot:slots.right,id:row.dataset.rightPlacement,house:Number(row.dataset.rightHouse),sign:Number(row.dataset.rightSign)}
      };
    }).filter(item=>item.identity&&item.address);
    relations.forEach(relation=>indexRelation(relationIndex,relation));

    const grid=new Map(),segments=[];
    wheel.querySelectorAll('[data-layer="aspects"] > line.sky-foundation-aspect:not(.sky-foundation-aspect-hit)').forEach(line=>{
      const identity=relationshipIdentity(line),x1=num(line.getAttribute('x1')),y1=num(line.getAttribute('y1')),x2=num(line.getAttribute('x2')),y2=num(line.getAttribute('y2'));
      if(!identity||![x1,y1,x2,y2].every(Number.isFinite))return;
      const segment={line,identity,a:{x:x1,y:y1},b:{x:x2,y:y2}};
      segments.push(segment);
      addSegmentToGrid(grid,segment);
    });

    cache={
      wheel,
      clearButton:document.getElementById('skyFoundationClearIsolation'),
      focus,
      interactive,
      placements,
      placementIndex,
      relations,
      relationIndex,
      allRelationIndexes:relations.map(item=>item.address),
      cusps:{A:houseCusps('A'),B:houseCusps('B')},
      grid,
      segments,
      keepCache:new Map(),
      transform:null
    };
    updateTransform();
    if(!locked())wheel.classList.remove('has-isolation');
  }

  function matchingRelations(state){
    if(!state)return[];
    if(state.kind==='aspect'){
      const relation=cache.relationIndex.byIdentity.get(state.value);
      return relation?[relation]:[];
    }
    if(state.kind==='sign')return cache.relationIndex.bySign.get(state.value)||[];
    if(state.kind==='house')return cache.relationIndex.byHouse.get(key(state.sky,state.value))||[];
    if(state.kind==='placement')return cache.relationIndex.byPlacement.get(key(state.sky,state.value))||[];
    return[];
  }
  function keepFor(state){
    const id=stateKey(state);
    const cached=cache.keepCache.get(id);
    if(cached)return cached;

    const matched=new Set(),identities=new Set(),placements=new Set(),houses=new Set(),signs=new Set();
    matchingRelations(state).forEach(relation=>{
      matched.add(relation.address);identities.add(relation.identity);
      for(const end of [relation.left,relation.right]){
        placements.add(key(end.slot,end.id));
        houses.add(key(end.slot,end.house));
        signs.add(end.sign);
      }
    });

    if(state.kind==='house'){
      houses.add(key(state.sky,state.value));
      (cache.placementIndex.byHouse.get(key(state.sky,state.value))||[]).forEach(item=>{
        placements.add(key(item.slot,item.id));
        signs.add(item.sign);
      });
    }
    if(state.kind==='sign'){
      signs.add(state.value);
      (cache.placementIndex.bySign.get(state.value)||[]).forEach(item=>placements.add(key(item.slot,item.id)));
      for(const slot of ['A','B'])housesForSign(cache.cusps[slot],state.value).forEach(house=>houses.add(key(slot,house)));
    }
    if(state.kind==='placement'){
      placements.add(key(state.sky,state.value));
      const item=cache.placementIndex.byKey.get(key(state.sky,state.value));
      if(item){houses.add(key(item.slot,item.house));signs.add(item.sign)}
    }

    const nodes=new Set();
    identities.forEach(value=>cache.focus.aspect.get(value)?.forEach(node=>nodes.add(node)));
    placements.forEach(value=>cache.focus.placement.get(value)?.forEach(node=>nodes.add(node)));
    houses.forEach(value=>cache.focus.house.get(value)?.forEach(node=>nodes.add(node)));
    signs.forEach(value=>cache.focus.sign.get(value)?.forEach(node=>nodes.add(node)));

    const exact=new Set();
    if(state.kind==='aspect')cache.interactive.aspect.get(state.value)?.forEach(node=>exact.add(node));
    else if(state.kind==='placement')cache.interactive.placement.get(key(state.sky,state.value))?.forEach(node=>exact.add(node));
    else if(state.kind==='house')cache.interactive.house.get(key(state.sky,state.value))?.forEach(node=>exact.add(node));
    else if(state.kind==='sign')cache.interactive.sign.get(state.value)?.forEach(node=>exact.add(node));

    const endpoints=new Set();
    if(state.kind==='aspect')placements.forEach(value=>cache.focus.placement.get(value)?.forEach(node=>endpoints.add(node)));

    const result={matched,identities,placements,houses,signs,nodes,exact,endpoints};
    cache.keepCache.set(id,result);
    return result;
  }

  function immediate(state){
    if(!cache||same(hoverState,state)||(!hoverState&&!state))return;
    hoverState=state;

    if(!state){
      keptNodes=applyClassSet(keptNodes,new Set(),'is-kept');
      endpointNodes=applyClassSet(endpointNodes,new Set(),'is-aspect-endpoint');
      hoveredNodes=applyClassSet(hoveredNodes,new Set(),'is-hovered');
      cache.wheel.classList.remove('has-isolation');
      queueSecondary(null,new Set(),null);
      return;
    }

    const keep=keepFor(state);
    cache.wheel.classList.add('has-isolation');
    keptNodes=applyClassSet(keptNodes,keep.nodes,'is-kept');
    hoveredNodes=applyClassSet(hoveredNodes,keep.exact,'is-hovered');
    endpointNodes=applyClassSet(endpointNodes,keep.endpoints,'is-aspect-endpoint');
    queueSecondary(state,keep.matched,keep);
  }

  function queueSecondary(state,matched,keep){
    if(secondaryTimer)clearTimeout(secondaryTimer);
    secondaryTimer=setTimeout(()=>{
      secondaryTimer=0;
      if(state&&!same(state,hoverState))return;
      if(!state&&hoverState)return;

      for(const slot of ['A','B']){
        const panel=document.getElementById(slot==='A'?'skyFoundationA':'skyFoundationB');
        if(!panel)continue;
        panel.classList.toggle('has-ledger-isolation',!!state);
        panel.querySelectorAll('.sky-foundation-row[data-placement]').forEach(row=>{
          const id=key(slot,row.dataset.placement);
          row.classList.toggle('is-kept',!!state&&!!keep?.placements?.has(id));
          row.classList.toggle('is-hovered',!!state&&state.kind==='placement'&&state.sky===slot&&state.value===row.dataset.placement);
        });
      }

      window.dispatchEvent(new CustomEvent('relphi:sky-foundation-filter-changed',{
        detail:{
          state:state?{...state,mode:'hover'}:null,
          relationshipIndexes:Array.from(state?matched:cache?.allRelationIndexes||[])
        }
      }));
    },SECONDARY_DELAY_MS);
  }

  function stateFromNode(node){
    if(!node)return null;
    const kind=node.dataset.interactive;
    if(kind==='aspect')return{kind,sky:null,value:relationshipIdentity(node)};
    if(kind==='sign')return{kind,sky:null,value:Number(node.dataset.sign)};
    if(kind==='house')return{kind,sky:node.dataset.sky,value:Number(node.dataset.house)};
    if(kind==='placement')return{kind,sky:node.dataset.sky,value:node.dataset.placement};
    return null;
  }
  function directNode(target){return target instanceof Element?target.closest('[data-interactive]'):null}

  function nearestAspectAt(clientX,clientY){
    if(!cache||!Number.isFinite(clientX)||!Number.isFinite(clientY))return null;
    const local=clientToWheel(clientX,clientY);
    if(!local)return null;
    const radius=ASPECT_RADIUS_PX/local.scale;
    const baseX=Math.floor(local.x/GRID),baseY=Math.floor(local.y/GRID),range=Math.max(1,Math.ceil(radius/GRID));
    const candidates=new Set();
    for(let gx=baseX-range;gx<=baseX+range;gx++)for(let gy=baseY-range;gy<=baseY+range;gy++){
      (cache.grid.get(`${gx},${gy}`)||[]).forEach(segment=>candidates.add(segment));
    }
    let best=null,bestDistance=Infinity;
    for(const segment of candidates){
      const line=segment.line;
      if(!line.isConnected||line.hidden||line.style.display==='none'||line.classList.contains('sky-chart-filter-hidden')||line.classList.contains('sky-chart-orb-hidden')||line.classList.contains('sky-orb-filter-hidden'))continue;
      const distance=distanceToSegment(local.x,local.y,segment.a,segment.b);
      if(distance<bestDistance){bestDistance=distance;best=segment}
    }
    return bestDistance<=radius?best:null;
  }
  function runProbe(){
    probeFrame=0;
    const probe=pendingProbe;
    pendingProbe=null;
    if(!probe||!cache)return;
    const nearest=nearestAspectAt(probe.x,probe.y);
    immediate(nearest?{kind:'aspect',sky:null,value:nearest.identity}:null);
  }
  function scheduleProbe(event){
    pendingProbe={x:event.clientX,y:event.clientY};
    if(probeFrame)return;
    probeFrame=requestAnimationFrame(runProbe);
  }

  function captureMove(event){
    if(!event.target.closest?.('#skyFoundationWheelMount'))return;
    event.stopImmediatePropagation();
    if(locked()){clearFast(false,true);return}

    const node=directNode(event.target);
    if(node){
      if(probeFrame){cancelAnimationFrame(probeFrame);probeFrame=0}
      pendingProbe=null;
      immediate(stateFromNode(node));
      return;
    }
    scheduleProbe(event);
  }
  function captureOut(event){
    if(!event.target.closest?.('#skyFoundationWheelMount'))return;
    event.stopImmediatePropagation();
    if(locked()){clearFast(false,true);return}
    const related=event.relatedTarget instanceof Element?event.relatedTarget:null;
    if(related?.closest('#skyFoundationWheelMount'))return;
    immediate(null);
  }
  function captureClick(event){
    if(!event.target.closest?.('#skyFoundationWheelMount'))return;
    clearFast(false);
  }

  function bind(){
    const root=document.getElementById('skyFoundationRoot');
    if(!root||root===boundRoot)return;
    if(boundRoot){
      boundRoot.removeEventListener('pointerover',captureMove,true);
      boundRoot.removeEventListener('pointermove',captureMove,true);
      boundRoot.removeEventListener('pointerout',captureOut,true);
      boundRoot.removeEventListener('click',captureClick,true);
    }
    boundRoot=root;
    root.addEventListener('pointerover',captureMove,true);
    root.addEventListener('pointermove',captureMove,true);
    root.addEventListener('pointerout',captureOut,true);
    root.addEventListener('click',captureClick,true);
  }

  function refresh(){bind();requestAnimationFrame(rebuild)}
  function invalidate(){clearFast(false,true);cache=null}
  function start(){
    bind();
    window.addEventListener('relphi:sky-foundation-interactions-ready',refresh);
    window.addEventListener('relphi:sky-intrasky-relationships-ready',refresh);
    window.addEventListener('relphi:sky-intrasky-b-relationships-ready',refresh);
    window.addEventListener('relphi:sky-aspect-multiselect-changed',refresh);
    window.addEventListener('relphi:sky-foundation-ready',invalidate);
    window.addEventListener('storage',invalidate);
    window.addEventListener('resize',scheduleTransform,{passive:true});
    window.addEventListener('scroll',scheduleTransform,{passive:true,capture:true});
    window.visualViewport?.addEventListener('resize',scheduleTransform,{passive:true});
    window.visualViewport?.addEventListener('scroll',scheduleTransform,{passive:true});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
