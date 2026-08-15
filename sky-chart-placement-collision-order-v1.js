// Preserve circular placement order without ever assigning one placement another placement's position.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyPlacementCollisionOrderV2)return;
  window.__relphiSkyPlacementCollisionOrderV2=true;
  window.__relphiSkyPlacementCollisionOrderV1=true;

  const C={x:600,y:600};
  const EXACT_RADIUS={A:414,B:323};
  const LANES={A:[450,440,460],B:[287,299,283]};
  const BUBBLE_RADIUS=17.2;
  const CLEARANCE=6;
  const STEP=.75;
  const LIMIT=15;
  const ORDER_EPS=.0001;
  const PLACEMENTS='[data-layer="placements"]';
  const LEADERS='[data-layer="leaders"]';
  let arranging=false;

  const num=value=>{const n=Number(value);return Number.isFinite(n)?n:NaN};
  const norm=value=>((Number(value)%360)+360)%360;
  const polar=(radius,degree)=>{const angle=(norm(degree)-180)*Math.PI/180;return{x:C.x+radius*Math.cos(angle),y:C.y+radius*Math.sin(angle)}};

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
      return{group,leader,index,placement,exact:norm(exact),authoredDisplay:norm(display),authoredLane:lane};
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
  function collisionPenalty(option,placed){
    let penalty=0;
    for(const prior of placed){
      const distance=Math.hypot(option.point.x-prior.point.x,option.point.y-prior.point.y);
      const deficit=BUBBLE_RADIUS*2+CLEARANCE-distance;
      if(deficit>0)penalty+=deficit*deficit;
    }
    return penalty;
  }
  function optionsFor(item){
    const result=[],steps=Math.floor(LIMIT/STEP);
    for(let step=0;step<=steps;step+=1){
      const magnitude=step*STEP,offsets=step===0?[0]:[magnitude,-magnitude];
      for(const offset of offsets)for(const lane of LANES[item.group.dataset.sky]||[item.authoredLane])result.push(candidate(lane,item.exactU+offset,offset));
    }
    return result;
  }

  function solve(slot,items){
    const ordered=circularOrder(items),placed=[],result=[];
    let firstDisplayU=NaN,previousDisplayU=-Infinity;
    for(let index=0;index<ordered.length;index+=1){
      const item=ordered[index],all=optionsFor(item);
      const maxCircular=Number.isFinite(firstDisplayU)?firstDisplayU+360-ORDER_EPS:Infinity;
      const orderSafe=all.filter(option=>option.displayU>previousDisplayU+ORDER_EPS&&option.displayU<maxCircular);
      let chosen=orderSafe.find(option=>collisionPenalty(option,placed)===0);
      let fallback=false;
      if(!chosen){
        fallback=true;
        const pool=orderSafe.length?orderSafe:all;
        chosen=pool.slice().sort((a,b)=>collisionPenalty(a,placed)-collisionPenalty(b,placed)||Math.abs(a.offset)-Math.abs(b.offset)||LANES[slot].indexOf(a.lane)-LANES[slot].indexOf(b.lane))[0];
      }
      if(!chosen)continue;
      if(!Number.isFinite(firstDisplayU))firstDisplayU=chosen.displayU;
      previousDisplayU=chosen.displayU;
      placed.push(chosen);
      result.push({item,position:chosen,fallback});
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
    solved.forEach(({item,position,fallback})=>{
      item.group.setAttribute('transform',`translate(${position.point.x} ${position.point.y})`);
      item.group.dataset.displayLongitude=position.display.toFixed(8);
      item.group.dataset.placementLane=String(position.lane);
      item.group.dataset.placementOrderCorrected=(Math.abs(position.display-item.authoredDisplay)>1e-6||position.lane!==item.authoredLane)?'true':'false';
      item.group.dataset.placementOrderFallback=fallback?'true':'false';
      item.group.dataset.placementTangentialOffset=position.offset.toFixed(2);
      setLeader(item,position,slot);
    });
  }

  function orient(a,b,c){return(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)}
  function properIntersection(a,b,c,d){
    const abC=orient(a,b,c),abD=orient(a,b,d),cdA=orient(c,d,a),cdB=orient(c,d,b);
    return((abC>0&&abD<0)||(abC<0&&abD>0))&&((cdA>0&&cdB<0)||(cdA<0&&cdB>0));
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
      wheel.dataset.placementCollisionOrder='identity-preserving-circular-order';
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
