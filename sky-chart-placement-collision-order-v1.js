// Preserve exact circular order while resolving dense Sky Chart placement collisions.
// v4 solves each sky's ordinary placements as one ordered circular label problem.
// Leader crossings are a hard failure: no fallback is allowed to accept crossed leaders.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyPlacementCollisionOrderV4)return;
window.__relphiSkyPlacementCollisionOrderV4=true;
window.__relphiSkyPlacementCollisionOrderV3=true;
window.__relphiSkyPlacementCollisionOrderV2=true;
window.__relphiSkyPlacementCollisionOrderV1=true;

const C={x:600,y:600};
const EXACT_RADIUS={A:414,B:323};
// These are the ordinary-placement lanes already safely separated from the angle lanes.
// Collision solving stays on this radius and spreads tangentially, so glyph order and
// leader routing remain one-dimensional and visually legible.
const LANE={A:450,B:287};
const BUBBLE_RADIUS=17.2;
const CLEARANCE=6;
const LEADER_CLEARANCE=4;
const EPS=1e-5;
const PRIORITY={
  sun:0,moon:0,
  mercury:1,venus:1,mars:1,jupiter:1,saturn:1,uranus:1,neptune:1,pluto:1,
  'north-node':2,'south-node':2,chiron:2,
  lilith:3,'part-of-fortune':3,vertex:3
};
const WEIGHT=[12,8,4,2];
const SEP_MULTIPLIERS=[1,1.06,1.12,1.2,1.3,1.42,1.55];
const GLOBAL_SHIFTS=[0,.35,-.35,.7,-.7,1.4,-1.4,2.1,-2.1,3,-3];
let arranging=false;

const num=value=>{const n=Number(value);return Number.isFinite(n)?n:NaN};
const norm=value=>((Number(value)%360)+360)%360;
const polar=(radius,degree)=>{const angle=(norm(degree)-180)*Math.PI/180;return{x:C.x+radius*Math.cos(angle),y:C.y+radius*Math.sin(angle)}};
const priorityOf=id=>Object.prototype.hasOwnProperty.call(PRIORITY,id)?PRIORITY[id]:2;
const weightOf=item=>WEIGHT[item.priority]||2;

function ordinaryItems(wheel,slot){
  const placements=wheel.querySelector('[data-layer="placements"]');
  const leaders=Array.from(wheel.querySelectorAll(`[data-layer="leaders"] line[data-sky="${slot}"][data-placement]`));
  if(!placements)return[];
  return Array.from(placements.children).map((group,index)=>{
    if(!(group instanceof SVGGElement)||group.dataset.sky!==slot||group.dataset.angleAxis==='true')return null;
    const exact=num(group.dataset.exactLongitude);if(!Number.isFinite(exact))return null;
    const placement=String(group.dataset.placement||'');
    const leader=leaders.find(line=>line.dataset.placement===placement&&Math.abs(num(line.dataset.exactLongitude)-exact)<1e-6);
    if(!leader)return null;
    return{group,leader,index,placement,priority:priorityOf(placement),exact:norm(exact)};
  }).filter(Boolean);
}

function sortedItems(items){return items.slice().sort((a,b)=>a.exact-b.exact||a.priority-b.priority||a.index-b.index)}
function seamCandidates(sorted){
  if(sorted.length<2)return[0];
  return sorted.map((item,index)=>{
    const next=(index+1)%sorted.length,nextValue=sorted[next].exact+(next===0?360:0);
    return{seam:next,gap:nextValue-item.exact};
  }).sort((a,b)=>b.gap-a.gap||a.seam-b.seam).map(entry=>entry.seam);
}
function unwrap(sorted,seam){
  const result=[];let previous=-Infinity;
  for(let offset=0;offset<sorted.length;offset+=1){
    const item=sorted[(seam+offset)%sorted.length];let exactU=item.exact;
    while(exactU<previous-EPS)exactU+=360;
    result.push({...item,exactU});previous=exactU;
  }
  return result;
}

// Weighted pool-adjacent-violators regression. Subtracting i*separation before
// fitting converts the required minimum distance into a monotonicity constraint.
function isotonic(values,weights){
  const blocks=[];
  values.forEach((value,index)=>{
    let block={start:index,end:index,weight:weights[index],sum:value*weights[index]};block.mean=block.sum/block.weight;blocks.push(block);
    while(blocks.length>1){
      const right=blocks[blocks.length-1],left=blocks[blocks.length-2];if(left.mean<=right.mean+EPS)break;
      blocks.pop();blocks.pop();block={start:left.start,end:right.end,weight:left.weight+right.weight,sum:left.sum+right.sum};block.mean=block.sum/block.weight;blocks.push(block);
    }
  });
  const output=new Array(values.length);blocks.forEach(block=>{for(let i=block.start;i<=block.end;i+=1)output[i]=block.mean});return output;
}
function minimumSeparation(lane){
  const chord=2*BUBBLE_RADIUS+CLEARANCE,ratio=Math.min(.999999,chord/(2*lane));
  return 2*Math.asin(ratio)*180/Math.PI+.08;
}
function solveSequence(ordered,lane,separation,shift){
  const target=ordered.map((item,index)=>item.exactU-index*separation);
  const fitted=isotonic(target,ordered.map(weightOf));
  return ordered.map((item,index)=>{
    const displayU=fitted[index]+index*separation+shift;
    return{item,lane,displayU,display:norm(displayU),point:polar(lane,displayU),offset:displayU-item.exactU};
  });
}

function orient(a,b,c){return(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)}
function properIntersection(a,b,c,d){
  const abC=orient(a,b,c),abD=orient(a,b,d),cdA=orient(c,d,a),cdB=orient(c,d,b);
  return((abC>EPS&&abD<-EPS)||(abC<-EPS&&abD>EPS))&&((cdA>EPS&&cdB<-EPS)||(cdA<-EPS&&cdB>EPS));
}
function segmentDistance(point,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,length2=dx*dx+dy*dy;if(length2<=1e-9)return Math.hypot(point.x-a.x,point.y-a.y);
  const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/length2));
  return Math.hypot(point.x-(a.x+t*dx),point.y-(a.y+t*dy));
}
function exactPoint(record,slot){return polar(EXACT_RADIUS[slot],record.item.exact)}
function crossingCount(solution,slot){
  let count=0;
  for(let a=0;a<solution.length;a++)for(let b=a+1;b<solution.length;b++){
    if(properIntersection(solution[a].point,exactPoint(solution[a],slot),solution[b].point,exactPoint(solution[b],slot)))count+=1;
  }
  return count;
}
function bubbleCollisionCount(solution){
  let count=0;const needed=2*BUBBLE_RADIUS+CLEARANCE;
  for(let a=0;a<solution.length;a++)for(let b=a+1;b<solution.length;b++){
    if(Math.hypot(solution[a].point.x-solution[b].point.x,solution[a].point.y-solution[b].point.y)<needed-EPS)count+=1;
  }
  return count;
}
function leaderGlyphHits(solution,slot){
  let hits=0;
  for(let a=0;a<solution.length;a++){
    const start=solution[a].point,end=exactPoint(solution[a],slot);
    for(let b=0;b<solution.length;b++)if(a!==b&&segmentDistance(solution[b].point,start,end)<BUBBLE_RADIUS+LEADER_CLEARANCE)hits+=1;
  }
  return hits;
}
function circularOrderValid(solution,separation){
  if(solution.length<2)return true;
  for(let i=1;i<solution.length;i++)if(solution[i].displayU-solution[i-1].displayU<separation-EPS)return false;
  return solution[solution.length-1].displayU-solution[0].displayU<=360-separation+EPS;
}
function movement(solution){
  let weighted=0,max=0;solution.forEach(record=>{const amount=Math.abs(record.offset);weighted+=amount*amount*weightOf(record.item);max=Math.max(max,amount)});return{weighted,max};
}
function evaluate(solution,slot,separation,shift,multiplier){
  // Crossing lines are not scored; they are disqualified.
  if(crossingCount(solution,slot)!==0||!circularOrderValid(solution,separation))return null;
  const move=movement(solution);
  return{solution,bubbles:bubbleCollisionCount(solution),hits:leaderGlyphHits(solution,slot),weighted:move.weighted,max:move.max,shift,multiplier};
}
function compareCandidate(a,b){
  const av=[a.bubbles,a.hits,a.weighted,a.max,Math.abs(a.shift),a.multiplier],bv=[b.bubbles,b.hits,b.weighted,b.max,Math.abs(b.shift),b.multiplier];
  for(let i=0;i<av.length;i++){const delta=av[i]-bv[i];if(Math.abs(delta)>1e-9)return delta}return 0;
}

function bestSolution(slot,items){
  if(!items.length)return{solution:[],fallback:false,bubbles:0,hits:0};
  const sorted=sortedItems(items),seams=seamCandidates(sorted),lane=LANE[slot],baseSeparation=minimumSeparation(lane),candidates=[];
  for(const seam of seams){
    const ordered=unwrap(sorted,seam);
    for(const multiplier of SEP_MULTIPLIERS){
      const separation=baseSeparation*multiplier;if(separation*ordered.length>=360-EPS)continue;
      for(const shift of GLOBAL_SHIFTS){
        const solution=solveSequence(ordered,lane,separation,shift),candidate=evaluate(solution,slot,separation,shift,multiplier);if(candidate)candidates.push(candidate);
      }
    }
  }
  if(candidates.length){
    candidates.sort(compareCandidate);const best=candidates[0];
    return{...best,fallback:best.bubbles>0||best.hits>0};
  }
  // Impossible-layout fallback: stay exactly radial. This may leave overlapping glyphs,
  // but cannot invert zodiac order or create a crossing leader.
  const ordered=unwrap(sorted,seams[0]||0);
  const solution=ordered.map(item=>({item,lane,displayU:item.exactU,display:item.exact,point:polar(lane,item.exact),offset:0}));
  return{solution,fallback:true,bubbles:bubbleCollisionCount(solution),hits:leaderGlyphHits(solution,slot)};
}

function setLeader(record,slot){
  const exact=polar(EXACT_RADIUS[slot],record.item.exact),line=record.item.leader;
  line.setAttribute('x1',record.point.x.toFixed(2));line.setAttribute('y1',record.point.y.toFixed(2));
  line.setAttribute('x2',exact.x.toFixed(2));line.setAttribute('y2',exact.y.toFixed(2));
  line.dataset.displayLongitude=record.display.toFixed(8);line.dataset.leaderRouting='ordered-zero-cross';
}
function apply(slot,items){
  const result=bestSolution(slot,items);
  result.solution.forEach((record,index)=>{
    const item=record.item;item.group.setAttribute('transform',`translate(${record.point.x} ${record.point.y})`);
    item.group.dataset.displayLongitude=record.display.toFixed(8);item.group.dataset.placementLane=String(record.lane);
    item.group.dataset.placementPriority=String(item.priority);item.group.dataset.placementCircularOrder=String(index);
    item.group.dataset.placementOrderCorrected=Math.abs(record.offset)>1e-6?'true':'false';
    item.group.dataset.placementOrderFallback=result.fallback?'true':'false';item.group.dataset.placementTangentialOffset=record.offset.toFixed(3);
    setLeader(record,slot);
  });
  return result;
}
function endpoint(line,suffix){return{x:num(line.getAttribute(`x${suffix}`)),y:num(line.getAttribute(`y${suffix}`))}}
function actualCrossings(items){
  let count=0;
  for(let a=0;a<items.length;a++)for(let b=a+1;b<items.length;b++){
    const a1=endpoint(items[a].leader,1),a2=endpoint(items[a].leader,2),b1=endpoint(items[b].leader,1),b2=endpoint(items[b].leader,2);
    if([a1.x,a1.y,a2.x,a2.y,b1.x,b1.y,b2.x,b2.y].every(Number.isFinite)&&properIntersection(a1,a2,b1,b2))count+=1;
  }
  return count;
}
function forceRadial(slot,items){
  const lane=LANE[slot];sortedItems(items).forEach((item,index)=>{
    const point=polar(lane,item.exact),record={item,lane,display:item.exact,displayU:item.exact,point,offset:0};
    item.group.setAttribute('transform',`translate(${point.x} ${point.y})`);item.group.dataset.displayLongitude=item.exact.toFixed(8);
    item.group.dataset.placementLane=String(lane);item.group.dataset.placementCircularOrder=String(index);item.group.dataset.placementOrderFallback='true';
    item.group.dataset.placementTangentialOffset='0.000';setLeader(record,slot);
  });
}

function arrange(wheel){
  if(!(wheel instanceof SVGSVGElement)||arranging)return;arranging=true;
  try{
    let bubbleFallbacks=0,leaderHits=0;
    for(const slot of ['A','B']){
      const items=ordinaryItems(wheel,slot),result=apply(slot,items);bubbleFallbacks+=result.bubbles||0;leaderHits+=result.hits||0;
      if(actualCrossings(items)!==0)forceRadial(slot,items);
    }
    const crossings=actualCrossings(ordinaryItems(wheel,'A'))+actualCrossings(ordinaryItems(wheel,'B'));
    wheel.dataset.placementLeaderCrossings=String(crossings);wheel.dataset.placementCircularOrder='preserved';
    wheel.dataset.placementLeaderGlyphHits=String(leaderHits);wheel.dataset.placementCollisionFallbacks=String(bubbleFallbacks);
    wheel.dataset.placementCollisionOrder='cluster-isotonic-v4';
    if(crossings!==0)console.error('[Sky Chart placement layout] Zero-cross contract failed after exact-radial fallback.',{crossings});
  }finally{arranging=false}
}
function currentWheel(){return document.querySelector('#skyFoundationWheelMount > svg.sky-foundation-wheel')}
function arrangeCurrent(){const wheel=currentWheel();if(wheel)arrange(wheel)}
function install(){
  const mount=document.getElementById('skyFoundationWheelMount');
  if(mount)new MutationObserver(records=>{if(arranging)return;if(records.some(record=>Array.from(record.addedNodes||[]).some(node=>node instanceof SVGSVGElement&&node.classList.contains('sky-foundation-wheel'))))arrangeCurrent()}).observe(mount,{childList:true});
  arrangeCurrent();window.addEventListener('relphi:sky-foundation-ready',arrangeCurrent);
}
window.RelphiPlacementCollisionOrder={arrange,arrangeCurrent};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
})();
