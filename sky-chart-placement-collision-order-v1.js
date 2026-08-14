// Preserve circular placement order after collision spacing so leaders cannot cross.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyPlacementCollisionOrderV1)return;
  window.__relphiSkyPlacementCollisionOrderV1=true;

  const C={x:600,y:600};
  const EXACT_RADIUS={A:414,B:323};
  const PLACEMENTS='[data-layer="placements"]';
  const LEADERS='[data-layer="leaders"]';
  let arranging=false;

  const num=value=>{const n=Number(value);return Number.isFinite(n)?n:NaN};
  const norm=value=>((Number(value)%360)+360)%360;
  const separation=(a,b)=>Math.abs(((Number(a)-Number(b)+180)%360+360)%360-180);
  const polar=(radius,degree)=>{const angle=(degree-180)*Math.PI/180;return{x:C.x+radius*Math.cos(angle),y:C.y+radius*Math.sin(angle)}};

  function ordinaryItems(wheel,slot){
    const layer=wheel.querySelector(PLACEMENTS);
    const leaderLayer=wheel.querySelector(LEADERS);
    if(!layer||!leaderLayer)return[];
    return Array.from(layer.children).map((group,index)=>{
      if(!(group instanceof SVGGElement)||group.dataset.sky!==slot||group.dataset.angleAxis==='true')return null;
      const exact=num(group.dataset.exactLongitude),display=num(group.dataset.displayLongitude),lane=num(group.dataset.placementLane);
      if(![exact,display,lane].every(Number.isFinite))return null;
      const placement=String(group.dataset.placement||'');
      const leader=Array.from(leaderLayer.querySelectorAll(`line[data-sky="${slot}"]`)).find(line=>line.dataset.placement===placement&&num(line.dataset.exactLongitude)===exact);
      if(!leader)return null;
      return{group,leader,index,placement,exact:norm(exact),display:norm(display),lane};
    }).filter(Boolean);
  }

  function bestRotation(exactOrder,positions){
    if(!exactOrder.length)return 0;
    let best=0,bestCost=Infinity;
    for(let rotation=0;rotation<positions.length;rotation+=1){
      let cost=0;
      for(let index=0;index<exactOrder.length;index+=1){
        const position=positions[(index+rotation)%positions.length];
        const distance=separation(exactOrder[index].exact,position.display);
        cost+=distance*distance;
      }
      if(cost<bestCost){bestCost=cost;best=rotation}
    }
    return best;
  }

  function setLeader(item,position,slot){
    const displayPoint=polar(position.lane,position.display);
    const exactPoint=polar(EXACT_RADIUS[slot],item.exact);
    // Foundation authors ordinary leaders as display -> exact. Keep that contract intact.
    item.leader.setAttribute('x1',displayPoint.x.toFixed(2));
    item.leader.setAttribute('y1',displayPoint.y.toFixed(2));
    item.leader.setAttribute('x2',exactPoint.x.toFixed(2));
    item.leader.setAttribute('y2',exactPoint.y.toFixed(2));
    item.leader.dataset.displayLongitude=position.display.toFixed(8);
  }

  function assign(slot,items){
    if(items.length<2)return;
    const exactOrder=items.slice().sort((a,b)=>a.exact-b.exact||a.index-b.index);
    const positions=items.map(item=>({display:item.display,lane:item.lane,source:item})).sort((a,b)=>a.display-b.display||a.lane-b.lane);
    const rotation=bestRotation(exactOrder,positions);

    exactOrder.forEach((item,index)=>{
      const position=positions[(index+rotation)%positions.length];
      const point=polar(position.lane,position.display);
      item.group.setAttribute('transform',`translate(${point.x} ${point.y})`);
      item.group.dataset.displayLongitude=position.display.toFixed(8);
      item.group.dataset.placementLane=String(position.lane);
      item.group.dataset.placementOrderCorrected=position.source===item?'false':'true';
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
        assign(slot,items);
        crossings+=crossingCount(items);
      }
      wheel.dataset.placementLeaderCrossings=String(crossings);
      wheel.dataset.placementCollisionOrder='circular-order-preserved';
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
