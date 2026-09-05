// Single-sky wheel layout: protect house numbers and resolve crowded placement bubbles.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkySingleSkyLayoutV2)return;
window.__relphiSkySingleSkyLayoutV1=true;
window.__relphiSkySingleSkyLayoutV2=true;

const EPS=.001;
let queued=false,arranging=false;

const num=value=>{const n=Number(value);return Number.isFinite(n)?n:NaN};
const norm=value=>((Number(value)%360)+360)%360;
function spec(){return window.RelphiSkyWheelSpec||null}
function mini(){return spec()?.mini||null}
function role(){return spec()?.miniRole?.()||mini()?.standalone||null}
function center(){return mini()?.center||{x:300,y:300}}
function polar(radius,degree){const c=center(),angle=(norm(degree)-180)*Math.PI/180;return{x:c.x+radius*Math.cos(angle),y:c.y+radius*Math.sin(angle)}}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function orient(a,b,c){return(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)}
function properIntersection(a,b,c,d){
  const abC=orient(a,b,c),abD=orient(a,b,d),cdA=orient(c,d,a),cdB=orient(c,d,b);
  return((abC>EPS&&abD<-EPS)||(abC<-EPS&&abD>EPS))&&((cdA>EPS&&cdB<-EPS)||(cdA<-EPS&&cdB>EPS));
}
function segmentDistance(point,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy;
  if(l2<=1e-9)return distance(point,a);
  const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/l2));
  return Math.hypot(point.x-(a.x+t*dx),point.y-(a.y+t*dy));
}
function parseTranslate(node){
  const match=String(node?.getAttribute('transform')||'').match(/translate\(\s*([-+\d.eE]+)[ ,]+([-+\d.eE]+)\s*\)/);
  return match?{x:Number(match[1]),y:Number(match[2])}:null;
}
function singleSlot(wheel){
  const explicit=String(wheel?.dataset?.singleSky||'').trim().toUpperCase();
  if(explicit==='A'||explicit==='B')return explicit;
  const group=wheel?.querySelector('[data-layer="placements"] g[data-sky][data-placement]');
  const slot=String(group?.dataset?.sky||'').toUpperCase();
  return slot==='B'?'B':'A';
}
function ordinaryItems(wheel,slot){
  const layer=wheel.querySelector('[data-layer="placements"]');if(!layer)return[];
  const leaders=[...wheel.querySelectorAll(`[data-layer="leaders"] line[data-sky="${slot}"][data-placement]:not([data-angle])`)];
  return [...layer.querySelectorAll(`:scope > g[data-sky="${slot}"][data-placement]:not([data-angle-axis="true"])`)].map((group,index)=>{
    const exact=num(group.dataset.exactLongitude);if(!Number.isFinite(exact))return null;
    const id=String(group.dataset.placement||'');
    const leader=leaders.find(line=>line.dataset.placement===id&&Math.abs(num(line.dataset.exactLongitude)-exact)<1e-5)||leaders.find(line=>line.dataset.placement===id);
    return leader?{group,leader,id,index,exact:norm(exact),sign:Math.floor(norm(exact)/30)}:null;
  }).filter(Boolean).sort((a,b)=>a.exact-b.exact||a.index-b.index);
}
function angleObstacles(wheel,slot){
  const radius=Number(mini()?.angleRadius)||14;
  return [...wheel.querySelectorAll(`[data-layer="placements"] g[data-sky="${slot}"][data-angle-axis="true"]`)].map(group=>{
    const point=parseTranslate(group);return point?{point,radius}:null;
  }).filter(Boolean);
}
function lanePair(){
  const g=role(),m=mini();if(!g||!m)return[172];
  const bubble=Number(m.placementBubbleRadius)||13,house=g.house||{inner:128.5,outer:207};
  const inset=bubble+4;
  return [Math.max(house.inner+inset,(house.inner+house.outer)/2-24),Math.min(house.outer-inset,(house.inner+house.outer)/2+24)];
}
function minimumSeparation(lane){
  const m=mini()||{},radius=Number(m.placementBubbleRadius)||13,clearance=Math.max(2,Number(m.placementClearance)||5),chord=2*radius+clearance;
  const ratio=Math.min(.999999,chord/(2*Math.max(1,lane)));
  return 2*Math.asin(ratio)*180/Math.PI+.1;
}
function isotonic(values,weights){
  const blocks=[];
  values.forEach((value,index)=>{
    let block={start:index,end:index,weight:weights[index],sum:value*weights[index]};block.mean=block.sum/block.weight;blocks.push(block);
    while(blocks.length>1){
      const right=blocks[blocks.length-1],left=blocks[blocks.length-2];if(left.mean<=right.mean+EPS)break;
      blocks.pop();blocks.pop();block={start:left.start,end:right.end,weight:left.weight+right.weight,sum:left.sum+right.sum};block.mean=block.sum/block.weight;blocks.push(block);
    }
  });
  const out=new Array(values.length);blocks.forEach(block=>{for(let i=block.start;i<=block.end;i++)out[i]=block.mean});return out;
}
function solveLane(items,lane){
  if(!items.length)return[];
  const sign=items[0].sign,start=sign*30+.12,end=start+29.76;
  const baseSep=minimumSeparation(lane);
  for(const multiplier of [1,.96,.92,.88,.84]){
    const sep=baseSep*multiplier,lower=start,upper=end-(items.length-1)*sep;
    if(lower>upper)continue;
    const targets=items.map((item,index)=>item.exact-index*sep),fit=isotonic(targets,items.map(()=>1));
    return items.map((item,index)=>{
      const base=Math.max(lower,Math.min(upper,fit[index])),display=base+index*sep;
      return{item,lane,display,point:polar(lane,display),offset:display-item.exact};
    });
  }
  return items.map(item=>({item,lane,display:item.exact,point:polar(lane,item.exact),offset:0,fallback:true}));
}
function solveSign(items){
  if(!items.length)return[];
  const lanes=lanePair();
  if(lanes.length===1)return solveLane(items,lanes[0]);
  const outer=[],inner=[];
  items.forEach((item,index)=>(index%2===0?outer:inner).push(item));
  // The outer lane has slightly more angular capacity, so an odd extra placement goes there.
  return [...solveLane(outer,lanes[1]),...solveLane(inner,lanes[0])];
}
function exactPoint(record){return polar(Number(role()?.degree)||128.5,record.item.exact)}
function segment(record){return{a:record.point,b:exactPoint(record)}}
function scoreSolution(solution,obstacles){
  const bubble=Number(mini()?.placementBubbleRadius)||13,clearance=2;
  let overlap=0,crossings=0,leaderHits=0;
  for(let i=0;i<solution.length;i++){
    for(let j=i+1;j<solution.length;j++){
      const need=bubble*2+clearance,d=distance(solution[i].point,solution[j].point);if(d<need)overlap+=need-d;
      const a=segment(solution[i]),b=segment(solution[j]);if(properIntersection(a.a,a.b,b.a,b.b))crossings++;
    }
    const seg=segment(solution[i]);
    obstacles.forEach(obstacle=>{const need=bubble+obstacle.radius+clearance,d=distance(solution[i].point,obstacle.point);if(d<need)overlap+=need-d;if(segmentDistance(obstacle.point,seg.a,seg.b)<obstacle.radius+2)leaderHits++});
    solution.forEach((other,j)=>{if(j!==i&&segmentDistance(other.point,seg.a,seg.b)<bubble+2)leaderHits++});
  }
  return{overlap,crossings,leaderHits,total:overlap*10+crossings*200+leaderHits*40};
}
function alternateLane(item,currentLane){
  const lanes=lanePair(),lane=Math.abs(currentLane-lanes[0])<1?lanes[1]:lanes[0];
  return{item,lane,display:item.exact,point:polar(lane,item.exact),offset:0};
}
function improve(solution,obstacles){
  let best=solution,bestScore=scoreSolution(best,obstacles);
  if(bestScore.total<=EPS)return best;
  // First try putting individual crowded placements on the opposite radial lane at their exact longitude.
  for(let i=0;i<best.length;i++){
    const candidate=best.slice();candidate[i]=alternateLane(best[i].item,best[i].lane);
    const score=scoreSolution(candidate,obstacles);if(score.total+EPS<bestScore.total){best=candidate;bestScore=score}
  }
  return best;
}
function applyHouseNumberLane(wheel){
  const c=center(),g=role(),radius=Number(g?.house?.numberRadius)||167.75;
  wheel.querySelectorAll('[data-layer$="-houses"] .sky-placement-mini-house-number').forEach(node=>{
    const x=num(node.getAttribute('x')),y=num(node.getAttribute('y')),dx=x-c.x,dy=y-c.y,length=Math.hypot(dx,dy);if(!Number.isFinite(length)||length===0)return;
    node.setAttribute('x',(c.x+dx/length*radius).toFixed(3));node.setAttribute('y',(c.y+dy/length*radius).toFixed(3));node.dataset.houseNumberLane='protected';
  });
}
function applyPlacements(wheel){
  const slot=singleSlot(wheel),items=ordinaryItems(wheel,slot);if(!items.length)return;
  const bySign=new Map();items.forEach(item=>{if(!bySign.has(item.sign))bySign.set(item.sign,[]);bySign.get(item.sign).push(item)});
  let solution=[];for(let sign=0;sign<12;sign++)solution.push(...solveSign(bySign.get(sign)||[]));
  solution.sort((a,b)=>a.item.exact-b.item.exact||a.item.index-b.item.index);
  solution=improve(solution,angleObstacles(wheel,slot));
  solution.forEach((record,index)=>{
    const exact=exactPoint(record),{item}=record;
    item.group.setAttribute('transform',`translate(${record.point.x.toFixed(3)} ${record.point.y.toFixed(3)})`);
    item.group.dataset.displayLongitude=norm(record.display).toFixed(8);
    item.group.dataset.placementLane=record.lane.toFixed(3);
    item.group.dataset.placementCircularOrder=String(index);
    item.group.dataset.placementTangentialOffset=record.offset.toFixed(3);
    item.group.dataset.singleSkyCollisionResolved='true';
    item.leader.setAttribute('x1',record.point.x.toFixed(3));item.leader.setAttribute('y1',record.point.y.toFixed(3));
    item.leader.setAttribute('x2',exact.x.toFixed(3));item.leader.setAttribute('y2',exact.y.toFixed(3));
    item.leader.dataset.displayLongitude=norm(record.display).toFixed(8);
    item.leader.dataset.leaderRouting='standalone-two-lane-v2';
  });
  const quality=scoreSolution(solution,angleObstacles(wheel,slot));
  wheel.dataset.singleSkyPlacementOverlap=quality.overlap.toFixed(3);
  wheel.dataset.singleSkyLeaderCrossings=String(quality.crossings);
  wheel.dataset.singleSkyLeaderGlyphHits=String(quality.leaderHits);
  wheel.dataset.singleSkyCollisionLayout='two-radial-lanes-v2';
}
function apply(){
  queued=false;if(arranging)return;
  const wheel=document.querySelector('#skyFoundationWheelMount>.sky-foundation-single-wheel[data-single-sky],#skyFoundationWheelMount>svg.sky-foundation-wheel[data-single-sky]');
  if(!(wheel instanceof SVGSVGElement))return;
  arranging=true;try{applyHouseNumberLane(wheel);applyPlacements(wheel);wheel.dataset.singleSkySpacing='ready'}finally{arranging=false}
}
function schedule(){if(queued||arranging)return;queued=true;requestAnimationFrame(apply)}
function start(){
  schedule();
  const mount=document.getElementById('skyFoundationWheelMount');
  if(mount)new MutationObserver(records=>{if(arranging)return;if(records.some(record=>record.type==='childList'||record.type==='attributes'))schedule()}).observe(mount,{subtree:true,childList:true,attributes:true,attributeFilter:['data-single-sky','class']});
  ['relphi:sky-single-sky-aspects-rendered','relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-where-when-committed','relphi:saved-sky-loaded'].forEach(name=>window.addEventListener(name,schedule));
}
window.RelphiSkySingleSkyLayout=Object.freeze({apply,schedule});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
