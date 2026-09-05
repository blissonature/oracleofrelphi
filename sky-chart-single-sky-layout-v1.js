// Single-sky wheel layout: protect house labels and resolve crowded placement bubbles with the room available in a standalone ring.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkySingleSkyLayoutV3)return;
window.__relphiSkySingleSkyLayoutV1=true;
window.__relphiSkySingleSkyLayoutV2=true;
window.__relphiSkySingleSkyLayoutV3=true;

const EPS=.001;
let queued=false,arranging=false;

const num=value=>{const n=Number(value);return Number.isFinite(n)?n:NaN};
const norm=value=>((Number(value)%360)+360)%360;
function spec(){return window.RelphiSkyWheelSpec||null}
function isComparisonGeometry(wheel){return String(wheel?.dataset?.wheelGeometry||'').toLowerCase()==='comparison'}
function shared(wheel){return isComparisonGeometry(wheel)?spec()?.comparison:spec()?.mini}
function role(wheel){return isComparisonGeometry(wheel)?spec()?.role?.('A'):(spec()?.miniRole?.()||spec()?.mini?.standalone||null)}
function center(wheel){return shared(wheel)?.center||(isComparisonGeometry(wheel)?{x:600,y:600}:{x:300,y:300})}
function ringBounds(wheel){const g=role(wheel);if(!g)return{inner:0,outer:0};return g.house?{inner:Number(g.house.inner),outer:Number(g.house.outer)}:{inner:Number(g.inner),outer:Number(g.outer)}}
function polar(wheel,radius,degree){const c=center(wheel),angle=(norm(degree)-180)*Math.PI/180;return{x:c.x+radius*Math.cos(angle),y:c.y+radius*Math.sin(angle)}}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function orient(a,b,c){return(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)}
function properIntersection(a,b,c,d){
  const abC=orient(a,b,c),abD=orient(a,b,d),cdA=orient(c,d,a),cdB=orient(c,d,b);
  return((abC>EPS&&abD<-EPS)||(abC<-EPS&&abD>EPS))&&((cdA>EPS&&cdB<-EPS)||(cdA<-EPS&&cdB>EPS));
}
function segmentDistance(point,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy;if(l2<=1e-9)return distance(point,a);
  const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/l2));
  return Math.hypot(point.x-(a.x+t*dx),point.y-(a.y+t*dy));
}
function parseTranslate(node){
  const match=String(node?.getAttribute('transform')||'').match(/translate\(\s*([-+\d.eE]+)[ ,]+([-+\d.eE]+)\s*\)/);
  return match?{x:Number(match[1]),y:Number(match[2])}:null;
}
function singleSlot(wheel){
  const explicit=String(wheel?.dataset?.singleSky||'').trim().toUpperCase();if(explicit==='A'||explicit==='B')return explicit;
  const slot=String(wheel?.querySelector('[data-layer="placements"] g[data-sky][data-placement]')?.dataset?.sky||'').toUpperCase();return slot==='B'?'B':'A';
}
function ordinaryItems(wheel,slot){
  const layer=wheel.querySelector('[data-layer="placements"]');if(!layer)return[];
  const leaders=[...wheel.querySelectorAll(`[data-layer="leaders"] line[data-sky="${slot}"][data-placement]:not([data-angle])`)];
  return [...layer.querySelectorAll(`:scope > g[data-sky="${slot}"][data-placement]:not([data-angle-axis="true"])`)].map((group,index)=>{
    const exact=num(group.dataset.exactLongitude);if(!Number.isFinite(exact))return null;
    const id=String(group.dataset.placement||''),leader=leaders.find(line=>line.dataset.placement===id&&Math.abs(num(line.dataset.exactLongitude)-exact)<1e-5)||leaders.find(line=>line.dataset.placement===id);
    return leader?{group,leader,id,index,exact:norm(exact),sign:Math.floor(norm(exact)/30)}:null;
  }).filter(Boolean).sort((a,b)=>a.exact-b.exact||a.index-b.index);
}
function angleObstacles(wheel,slot){
  const radius=isComparisonGeometry(wheel)?21:Number(shared(wheel)?.angleRadius)||14;
  return [...wheel.querySelectorAll(`[data-layer="placements"] g[data-sky="${slot}"][data-angle-axis="true"]`)].map(group=>{const point=parseTranslate(group);return point?{point,radius}:null}).filter(Boolean);
}
function lanePair(wheel){
  const bounds=ringBounds(wheel),s=shared(wheel)||{},bubble=Number(s.placementBubbleRadius)||13,inset=bubble+4;
  const inner=Math.min(bounds.outer-inset,bounds.inner+inset),outer=Math.max(bounds.inner+inset,bounds.outer-inset);
  if(!Number.isFinite(inner)||!Number.isFinite(outer)||outer-inner<2*bubble+2){const fallback=Number(role(wheel)?.placement?.[0]);return[Number.isFinite(fallback)?fallback:(bounds.inner+bounds.outer)/2]}
  return[inner,outer];
}
function minimumSeparation(wheel,lane){
  const s=shared(wheel)||{},radius=Number(s.placementBubbleRadius)||13,clearance=Math.max(2,Number(s.placementClearance)||5),chord=2*radius+clearance;
  const ratio=Math.min(.999999,chord/(2*Math.max(1,lane)));return 2*Math.asin(ratio)*180/Math.PI+.08;
}
function isotonic(values,weights){
  const blocks=[];values.forEach((value,index)=>{let block={start:index,end:index,weight:weights[index],sum:value*weights[index]};block.mean=block.sum/block.weight;blocks.push(block);while(blocks.length>1){const right=blocks[blocks.length-1],left=blocks[blocks.length-2];if(left.mean<=right.mean+EPS)break;blocks.pop();blocks.pop();block={start:left.start,end:right.end,weight:left.weight+right.weight,sum:left.sum+right.sum};block.mean=block.sum/block.weight;blocks.push(block)}});
  const out=new Array(values.length);blocks.forEach(block=>{for(let i=block.start;i<=block.end;i++)out[i]=block.mean});return out;
}
function solveLane(wheel,items,lane){
  if(!items.length)return[];
  const sign=items[0].sign,start=sign*30+.1,end=sign*30+29.9,baseSep=minimumSeparation(wheel,lane);
  for(const multiplier of [1,.96,.92,.88,.84,.8]){
    const sep=baseSep*multiplier,lower=start,upper=end-(items.length-1)*sep;if(lower>upper)continue;
    const targets=items.map((item,index)=>item.exact-index*sep),fit=isotonic(targets,items.map(()=>1));
    return items.map((item,index)=>{const base=Math.max(lower,Math.min(upper,fit[index])),display=base+index*sep;return{item,lane,display,point:polar(wheel,lane,display),offset:display-item.exact}});
  }
  return items.map(item=>({item,lane,display:item.exact,point:polar(wheel,lane,item.exact),offset:0,fallback:true}));
}
function solveSign(wheel,items){
  if(!items.length)return[];const lanes=lanePair(wheel);if(lanes.length===1)return solveLane(wheel,items,lanes[0]);
  const outer=[],inner=[];items.forEach((item,index)=>(index%2===0?outer:inner).push(item));
  return[...solveLane(wheel,outer,lanes[1]),...solveLane(wheel,inner,lanes[0])];
}
function exactPoint(wheel,record){return polar(wheel,Number(role(wheel)?.degree)||128.5,record.item.exact)}
function segment(wheel,record){return{a:record.point,b:exactPoint(wheel,record)}}
function scoreSolution(wheel,solution,obstacles){
  const s=shared(wheel)||{},bubble=Number(s.placementBubbleRadius)||13,clearance=2;let overlap=0,crossings=0,leaderHits=0;
  for(let i=0;i<solution.length;i++){
    for(let j=i+1;j<solution.length;j++){
      const need=bubble*2+clearance,d=distance(solution[i].point,solution[j].point);if(d<need)overlap+=need-d;
      const a=segment(wheel,solution[i]),b=segment(wheel,solution[j]);if(properIntersection(a.a,a.b,b.a,b.b))crossings++;
    }
    const seg=segment(wheel,solution[i]);
    obstacles.forEach(obstacle=>{const need=bubble+obstacle.radius+clearance,d=distance(solution[i].point,obstacle.point);if(d<need)overlap+=need-d;if(segmentDistance(obstacle.point,seg.a,seg.b)<obstacle.radius+2)leaderHits++});
    solution.forEach((other,j)=>{if(j!==i&&segmentDistance(other.point,seg.a,seg.b)<bubble+2)leaderHits++});
  }
  return{overlap,crossings,leaderHits,total:overlap*10+crossings*200+leaderHits*40};
}
function alternateLane(wheel,item,currentLane){const lanes=lanePair(wheel),lane=Math.abs(currentLane-lanes[0])<1?lanes[1]:lanes[0];return{item,lane,display:item.exact,point:polar(wheel,lane,item.exact),offset:0}}
function improve(wheel,solution,obstacles){
  let best=solution,bestScore=scoreSolution(wheel,best,obstacles);if(bestScore.total<=EPS)return best;
  for(let i=0;i<best.length;i++){
    const candidate=best.slice();candidate[i]=alternateLane(wheel,best[i].item,best[i].lane);const score=scoreSolution(wheel,candidate,obstacles);if(score.total+EPS<bestScore.total){best=candidate;bestScore=score}
  }
  return best;
}
function protectHouseNumbers(wheel){
  const c=center(wheel),bounds=ringBounds(wheel),radius=(bounds.inner+bounds.outer)/2;
  wheel.querySelectorAll('[data-layer$="-houses"] .sky-foundation-house-number,[data-layer$="-houses"] .sky-placement-mini-house-number').forEach(node=>{
    const x=num(node.getAttribute('x')),y=num(node.getAttribute('y')),dx=x-c.x,dy=y-c.y,length=Math.hypot(dx,dy);if(!Number.isFinite(length)||length===0)return;
    node.setAttribute('x',(c.x+dx/length*radius).toFixed(3));node.setAttribute('y',(c.y+dy/length*radius).toFixed(3));node.dataset.houseNumberLane='protected';
  });
}
function applyPlacements(wheel){
  const slot=singleSlot(wheel),items=ordinaryItems(wheel,slot);if(!items.length)return;
  const bySign=new Map();items.forEach(item=>{if(!bySign.has(item.sign))bySign.set(item.sign,[]);bySign.get(item.sign).push(item)});
  let solution=[];for(let sign=0;sign<12;sign++)solution.push(...solveSign(wheel,bySign.get(sign)||[]));solution.sort((a,b)=>a.item.exact-b.item.exact||a.item.index-b.item.index);
  const obstacles=angleObstacles(wheel,slot);solution=improve(wheel,solution,obstacles);
  solution.forEach((record,index)=>{
    const exact=exactPoint(wheel,record),{item}=record;
    item.group.setAttribute('transform',`translate(${record.point.x.toFixed(3)} ${record.point.y.toFixed(3)})`);
    item.group.dataset.displayLongitude=norm(record.display).toFixed(8);item.group.dataset.placementLane=record.lane.toFixed(3);item.group.dataset.placementCircularOrder=String(index);item.group.dataset.placementTangentialOffset=record.offset.toFixed(3);item.group.dataset.singleSkyCollisionResolved='true';
    item.leader.setAttribute('x1',record.point.x.toFixed(3));item.leader.setAttribute('y1',record.point.y.toFixed(3));item.leader.setAttribute('x2',exact.x.toFixed(3));item.leader.setAttribute('y2',exact.y.toFixed(3));item.leader.dataset.displayLongitude=norm(record.display).toFixed(8);item.leader.dataset.leaderRouting='standalone-two-radial-lanes-v3';
  });
  const quality=scoreSolution(wheel,solution,obstacles);wheel.dataset.singleSkyPlacementOverlap=quality.overlap.toFixed(3);wheel.dataset.singleSkyLeaderCrossings=String(quality.crossings);wheel.dataset.singleSkyLeaderGlyphHits=String(quality.leaderHits);wheel.dataset.singleSkyCollisionLayout='two-radial-lanes-v3';
}
function apply(){
  queued=false;if(arranging)return;
  const wheel=document.querySelector('#skyFoundationWheelMount>svg.sky-foundation-wheel[data-single-sky]');if(!(wheel instanceof SVGSVGElement))return;
  arranging=true;try{protectHouseNumbers(wheel);applyPlacements(wheel);wheel.dataset.singleSkySpacing='ready'}finally{arranging=false}
}
function schedule(){if(queued||arranging)return;queued=true;requestAnimationFrame(apply)}
function start(){
  schedule();const mount=document.getElementById('skyFoundationWheelMount');
  if(mount)new MutationObserver(records=>{if(arranging)return;if(records.some(record=>record.type==='childList'||record.type==='attributes'))schedule()}).observe(mount,{subtree:true,childList:true,attributes:true,attributeFilter:['data-single-sky','data-wheel-geometry','class']});
  ['relphi:sky-single-sky-aspects-rendered','relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-where-when-committed','relphi:saved-sky-loaded'].forEach(name=>window.addEventListener(name,schedule));
}
window.RelphiSkySingleSkyLayout=Object.freeze({apply,schedule});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
