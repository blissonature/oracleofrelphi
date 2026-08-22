// Preserve placement identity and circular order while resolving dense wheel collisions.
// Priority placements keep their preferred lane; lower-priority points escape radially
// before they are allowed to travel tangentially across neighboring glyphs.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyPlacementCollisionOrderV3)return;
  window.__relphiSkyPlacementCollisionOrderV3=true;
  window.__relphiSkyPlacementCollisionOrderV2=true;
  window.__relphiSkyPlacementCollisionOrderV1=true;

  const C={x:600,y:600};
  const EXACT_RADIUS={A:414,B:323};
  // The old alternate lanes were only ~12px apart while two bubbles plus clearance
  // require ~40px. These lanes are true radial escape lanes, symmetric around the
  // zodiac band: Sky A escapes outward; Sky B escapes inward.
  const LANES={A:[450,492,534],B:[287,245,203]};
  const BUBBLE_RADIUS=17.2;
  const CLEARANCE=6;
  const LEADER_CLEARANCE=4;
  const STEP=.5;
  const LIMIT=8;
  const ORDER_EPS=.0001;
  const PLACEMENTS='[data-layer="placements"]';
  const LEADERS='[data-layer="leaders"]';
  const PRIORITY={
    sun:0,moon:0,
    mercury:1,venus:1,mars:1,jupiter:1,saturn:1,uranus:1,neptune:1,pluto:1,
    'north-node':2,'south-node':2,chiron:2,
    lilith:3,'part-of-fortune':3,vertex:3
  };
  let arranging=false;

  const num=value=>{const n=Number(value);return Number.isFinite(n)?n:NaN};
  const norm=value=>((Number(value)%360)+360)%360;
  const polar=(radius,degree)=>{const angle=(norm(degree)-180)*Math.PI/180;return{x:C.x+radius*Math.cos(angle),y:C.y+radius*Math.sin(angle)}};
  const priorityOf=placement=>Object.prototype.hasOwnProperty.call(PRIORITY,placement)?PRIORITY[placement]:2;

  function ordinaryItems(wheel,slot){
    const layer=wheel.querySelector(PLACEMENTS),leaderLayer=wheel.querySelector(LEADERS);
    if(!layer||!leaderLayer)return[];
    const leaders=Array.from(leaderLayer.querySelectorAll(`line[data-sky="${slot}"]`));
    return Array.from(layer.children).map((group,index)=>{
      if(!(group instanceof SVGGElement)||group.dataset.sky!==slot||group.dataset.angleAxis==='true')return null;
      const exact=num(group.dataset.exactLongitude),display=num(group.dataset.displayLongitude),lane=num(group.dataset.placementLane);
      if(![exact,display,lane].every(Number.isFinite))return null;
      const placement=String(group.dataset.placement||'');
      const leader=leaders.find(line=>line.dataset.placement===placement&&Math.abs(num(line.dataset.exactLongitude)-exact)<1e-6);
      if(!leader)return null;
      return{group,leader,index,placement,priority:priorityOf(placement),exact:norm(exact),authoredDisplay:norm(display),authoredLane:lane};
    }).filter(Boolean);
  }

  function circularOrder(items){
    const sorted=items.slice().sort((a,b)=>a.exact-b.exact||a.index-b.index);
    if(sorted.length<2)return sorted.map(item=>({...item,exactU:item.exact}));
    let seam=0,largest=-1;
    for(let index=0;index<sorted.length;index+=1){
      const next=(index+1)%sorted.length;
      const nextValue=sorted[next].exact+(next===0?360:0);
      const gap=nextValue-sorted[index].exact;
      if(gap>largest){largest=gap;seam=next}
    }
    const ordered=[];let previous=-Infinity;
    for(let offset=0;offset<sorted.length;offset+=1){
      const item=sorted[(seam+offset)%sorted.length];
      let exactU=item.exact;
      while(exactU+ORDER_EPS<previous)exactU+=360;
      ordered.push({...item,exactU});previous=exactU;
    }
    return ordered;
  }

  function candidate(lane,displayU,offset){
    const point=polar(lane,displayU);
    return{lane,displayU,display:norm(displayU),offset,point};
  }
  function optionsFor(item,slot){
    const result=[],steps=Math.floor(LIMIT/STEP),lanes=LANES[slot]||[item.authoredLane];
    // Zero-angle radial escape is always exhausted before any sideways movement.
    for(let step=0;step<=steps;step+=1){
      const magnitude=step*STEP,offsets=step===0?[0]:[magnitude,-magnitude];
      for(const offset of offsets)for(const lane of lanes)result.push(candidate(lane,item.exactU+offset,offset));
    }
    return result;
  }

  function bubblePenalty(option,obstacles){
    let penalty=0;
    for(const obstacle of obstacles){
      const distance=Math.hypot(option.point.x-obstacle.point.x,option.point.y-obstacle.point.y);
      const deficit=BUBBLE_RADIUS*2+CLEARANCE-distance;
      if(deficit>0)penalty+=deficit*deficit;
    }
    return penalty;
  }
  function segmentDistance(point,a,b){
    const dx=b.x-a.x,dy=b.y-a.y,length2=dx*dx+dy*dy;
    if(length2<=1e-9)return Math.hypot(point.x-a.x,point.y-a.y);
    const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/length2));
    return Math.hypot(point.x-(a.x+t*dx),point.y-(a.y+t*dy));
  }
  function leaderGlyphPenalty(option,item,slot,obstacles){
    const exactPoint=polar(EXACT_RADIUS[slot],item.exact);
    let penalty=0;
    for(const obstacle of obstacles){
      const distance=segmentDistance(obstacle.point,option.point,exactPoint);
      const deficit=BUBBLE_RADIUS+LEADER_CLEARANCE-distance;
      if(deficit>0)penalty+=deficit*deficit;
    }
    return penalty;
  }
  function orient(a,b,c){return(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)}
  function properIntersection(a,b,c,d){
    const abC=orient(a,b,c),abD=orient(a,b,d),cdA=orient(c,d,a),cdB=orient(c,d,b);
    return((abC>0&&abD<0)||(abC<0&&abD>0))&&((cdA>0&&cdB<0)||(cdA<0&&cdB>0));
  }
  function leaderCrossPenalty(option,item,slot,placed){
    const a=option.point,b=polar(EXACT_RADIUS[slot],item.exact);
    let crossings=0;
    for(const prior of placed){
      const c=prior.point,d=polar(EXACT_RADIUS[slot],prior.item.exact);
      if(properIntersection(a,b,c,d))crossings+=1;
    }
    return crossings;
  }
  function score(option,item,slot,placed,reservations){
    const obstacles=placed.concat(reservations);
    return[
      bubblePenalty(option,obstacles),
      leaderGlyphPenalty(option,item,slot,obstacles),
      leaderCrossPenalty(option,item,slot,placed),
      Math.abs(option.offset),
      Math.max(0,(LANES[slot]||[]).indexOf(option.lane))
    ];
  }
  function compareScore(left,right){
    for(let index=0;index<Math.max(left.length,right.length);index+=1){
      const difference=(left[index]||0)-(right[index]||0);
      if(Math.abs(difference)>1e-9)return difference;
    }
    return 0;
  }
  function cleanScore(value){return value[0]===0&&value[1]===0&&value[2]===0}

  function solve(slot,items){
    const ordered=circularOrder(items),placed=[],result=[];
    let firstDisplayU=NaN,previousDisplayU=-Infinity,previousExactU=-Infinity;
    for(let index=0;index<ordered.length;index+=1){
      const item=ordered[index],all=optionsFor(item,slot);
      const maxCircular=Number.isFinite(firstDisplayU)?firstDisplayU+360-ORDER_EPS:Infinity;
      const sameExact=Math.abs(item.exactU-previousExactU)<=ORDER_EPS;
      const orderSafe=all.filter(option=>{
        const afterPrevious=sameExact?option.displayU>=previousDisplayU-ORDER_EPS:option.displayU>previousDisplayU+ORDER_EPS;
        return afterPrevious&&option.displayU<maxCircular;
      });
      // Reserve the preferred lane for any higher-priority placement that has not yet
      // been solved. A node therefore cannot occupy or route through Mercury's home.
      const reservations=ordered.slice(index+1)
        .filter(future=>future.priority<item.priority)
        .map(future=>({item:future,priority:future.priority,point:polar(LANES[slot][0],future.exactU),reserved:true}));
      const pool=orderSafe.length?orderSafe:all;
      const evaluated=pool.map(option=>({option,value:score(option,item,slot,placed,reservations)}));
      let selected=evaluated.find(entry=>cleanScore(entry.value));
      let fallback=false;
      if(!selected){
        fallback=true;
        selected=evaluated.slice().sort((a,b)=>compareScore(a.value,b.value))[0];
      }
      if(!selected)continue;
      const chosen=selected.option;
      if(!Number.isFinite(firstDisplayU))firstDisplayU=chosen.displayU;
      previousDisplayU=chosen.displayU;
      previousExactU=item.exactU;
      const record={item,point:chosen.point,lane:chosen.lane,displayU:chosen.displayU,display:chosen.display,offset:chosen.offset,score:selected.value};
      placed.push(record);
      result.push({item,position:chosen,fallback,score:selected.value});
    }
    return result;
  }

  function setLeader(item,position,slot){
    const exactPoint=polar(EXACT_RADIUS[slot],item.exact);
    item.leader.setAttribute('x1',position.point.x.toFixed(2));
    item.leader.setAttribute('y1',position.point.y.toFixed(2));
    item.leader.setAttribute('x2',exactPoint.x.toFixed(2));
    item.leader.setAttribute('y2',exactPoint.y.toFixed(2));
    item.leader.dataset.displayLongitude=position.display.toFixed(8);
  }

  function apply(slot,items){
    const solved=solve(slot,items);
    solved.forEach(({item,position,fallback,score:value})=>{
      item.group.setAttribute('transform',`translate(${position.point.x} ${position.point.y})`);
      item.group.dataset.displayLongitude=position.display.toFixed(8);
      item.group.dataset.placementLane=String(position.lane);
      item.group.dataset.placementPriority=String(item.priority);
      item.group.dataset.placementOrderCorrected=(Math.abs(position.display-item.authoredDisplay)>1e-6||position.lane!==item.authoredLane)?'true':'false';
      item.group.dataset.placementOrderFallback=fallback?'true':'false';
      item.group.dataset.placementTangentialOffset=position.offset.toFixed(2);
      item.group.dataset.placementLeaderGlyphPenalty=value[1].toFixed(3);
      setLeader(item,position,slot);
    });
  }

  function endpoint(line,suffix){return{x:num(line.getAttribute(`x${suffix}`)),y:num(line.getAttribute(`y${suffix}`))}}
  function crossingCount(items){
    let count=0;
    for(let left=0;left<items.length;left+=1){
      const a=endpoint(items[left].leader,1),b=endpoint(items[left].leader,2);
      for(let right=left+1;right<items.length;right+=1){
        const c=endpoint(items[right].leader,1),d=endpoint(items[right].leader,2);
        if([a.x,a.y,b.x,b.y,c.x,c.y,d.x,d.y].every(Number.isFinite)&&properIntersection(a,b,c,d))count+=1;
      }
    }
    return count;
  }

  function arrange(wheel){
    if(!(wheel instanceof SVGSVGElement)||arranging)return;
    arranging=true;
    try{
      let crossings=0;
      for(const slot of ['A','B']){
        const items=ordinaryItems(wheel,slot);
        apply(slot,items);
        crossings+=crossingCount(items);
      }
      wheel.dataset.placementLeaderCrossings=String(crossings);
      wheel.dataset.placementCollisionOrder='priority-radial-escape-v3';
    }finally{arranging=false}
  }

  function currentWheel(){return document.querySelector('#skyFoundationWheelMount > svg.sky-foundation-wheel')}
  function arrangeCurrent(){const wheel=currentWheel();if(wheel)arrange(wheel)}

  function install(){
    const mount=document.getElementById('skyFoundationWheelMount');
    if(mount){
      new MutationObserver(records=>{
        if(arranging)return;
        if(records.some(record=>Array.from(record.addedNodes||[]).some(node=>node instanceof SVGSVGElement&&node.classList.contains('sky-foundation-wheel'))))arrangeCurrent();
      }).observe(mount,{childList:true});
    }
    arrangeCurrent();
    window.addEventListener('relphi:sky-foundation-ready',arrangeCurrent);
  }

  window.RelphiPlacementCollisionOrder={arrange,arrangeCurrent};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
