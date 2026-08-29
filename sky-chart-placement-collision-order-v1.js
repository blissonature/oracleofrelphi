// Final comparison-wheel placement collision resolver.
// Reads the current shared ring specification instead of hard-coding the historical A/B ring order.
// Placements remain inside their true zodiac sign and in true circular order. A crossed or misleading
// leader is never accepted; exact-radial overlap is preferable to a false visual correspondence.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyPlacementCollisionOrderV6)return;
window.__relphiSkyPlacementCollisionOrderV6=true;
window.__relphiSkyPlacementCollisionOrderV5=true;
window.__relphiSkyPlacementCollisionOrderV4=true;
window.__relphiSkyPlacementCollisionOrderV3=true;
window.__relphiSkyPlacementCollisionOrderV2=true;
window.__relphiSkyPlacementCollisionOrderV1=true;

const EPS=1e-5;
const PRIORITY={
  sun:0,moon:0,
  mercury:1,venus:1,mars:1,jupiter:1,saturn:1,uranus:1,neptune:1,pluto:1,
  'north-node':2,'south-node':2,chiron:2,
  lilith:3,'part-of-fortune':3,vertex:3
};
const WEIGHT=[12,8,4,2];
let arranging=false;

const num=value=>{const n=Number(value);return Number.isFinite(n)?n:NaN};
const norm=value=>((Number(value)%360)+360)%360;
const priority=id=>Object.prototype.hasOwnProperty.call(PRIORITY,id)?PRIORITY[id]:2;
const weight=item=>WEIGHT[item.priority]||2;
function spec(){return window.RelphiSkyWheelSpec||null}
function geometry(slot){return spec()?.role?.(slot)||null}
function center(){return spec()?.comparison?.center||{x:600,y:600}}
function polar(radius,degree){const c=center(),angle=(norm(degree)-180)*Math.PI/180;return{x:c.x+radius*Math.cos(angle),y:c.y+radius*Math.sin(angle)}}
function orient(a,b,c){return(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)}
function properIntersection(a,b,c,d){
  const abC=orient(a,b,c),abD=orient(a,b,d),cdA=orient(c,d,a),cdB=orient(c,d,b);
  return((abC>EPS&&abD<-EPS)||(abC<-EPS&&abD>EPS))&&((cdA>EPS&&cdB<-EPS)||(cdA<-EPS&&cdB>EPS));
}
function segmentDistance(point,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy;if(l2<=1e-9)return Math.hypot(point.x-a.x,point.y-a.y);
  const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/l2));
  return Math.hypot(point.x-(a.x+t*dx),point.y-(a.y+t*dy));
}
function parseSegment(line){
  const a={x:num(line.getAttribute('x1')),y:num(line.getAttribute('y1'))},b={x:num(line.getAttribute('x2')),y:num(line.getAttribute('y2'))};
  return[a.x,a.y,b.x,b.y].every(Number.isFinite)?{a,b}:null;
}
function minimumSeparation(lane){
  const shared=spec()?.comparison||{},radius=Number(shared.placementBubbleRadius)||17.2,clearance=Number(shared.placementClearance)||6;
  const chord=2*radius+clearance,ratio=Math.min(.999999,chord/(2*lane));
  return 2*Math.asin(ratio)*180/Math.PI+.08;
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

function ordinaryItems(wheel,slot){
  const layer=wheel.querySelector('[data-layer="placements"]');if(!layer)return[];
  const leaders=[...wheel.querySelectorAll(`[data-layer="leaders"] line[data-sky="${slot}"][data-placement]:not([data-angle])`)];
  return [...layer.querySelectorAll(`:scope > g[data-sky="${slot}"][data-placement]:not([data-angle-axis="true"])`)].map((group,index)=>{
    const exact=num(group.dataset.exactLongitude);if(!Number.isFinite(exact))return null;
    const id=String(group.dataset.placement||'');
    const leader=leaders.find(line=>line.dataset.placement===id&&Math.abs(num(line.dataset.exactLongitude)-exact)<1e-5)||leaders.find(line=>line.dataset.placement===id);
    if(!leader)return null;
    return{group,leader,id,index,priority:priority(id),exact:norm(exact),sign:Math.floor(norm(exact)/30)};
  }).filter(Boolean).sort((a,b)=>a.exact-b.exact||a.priority-b.priority||a.index-b.index);
}

function solveSignGroup(items,lane){
  if(!items.length)return[];
  const baseSep=minimumSeparation(lane),sign=items[0].sign,start=sign*30,end=start+30;
  for(const multiplier of [1,1.05,1.1,1.16,1.23]){
    const sep=baseSep*multiplier,lower=start+sep/2+.02,upper=end-sep/2-.02-(items.length-1)*sep;
    if(lower>upper)continue;
    const targets=items.map((item,index)=>item.exact-index*sep),fit=isotonic(targets,items.map(weight));
    const solution=items.map((item,index)=>{
      const base=Math.max(lower,Math.min(upper,fit[index])),display=base+index*sep;
      return{item,lane,display,point:polar(lane,display),exactPoint:null,offset:display-item.exact};
    });
    return solution;
  }
  // Too many placements to fit honestly inside this sign on one safe lane.
  // Keep them exact rather than reversing order or sending a leader across neighbors.
  return items.map(item=>({item,lane,display:item.exact,point:polar(lane,item.exact),exactPoint:null,offset:0,fallback:true}));
}

function fixedSegments(wheel,slot){
  const houseLayer=slot==='A'?'a-houses':'b-houses';
  return [
    ...wheel.querySelectorAll(`[data-layer="${houseLayer}"] line.sky-foundation-divider`),
    ...wheel.querySelectorAll(`[data-layer="leaders"] line[data-sky="${slot}"][data-angle]`)
  ].map(parseSegment).filter(Boolean);
}
function exactPoint(record,slot){const g=geometry(slot);return polar(g.degree,record.item.exact)}
function segmentFor(record,slot){return{a:record.point,b:record.exactPoint||exactPoint(record,slot)}}
function forceExact(record,slot){record.display=record.item.exact;record.point=polar(record.lane,record.display);record.offset=0;record.fallback=true;record.exactPoint=exactPoint(record,slot)}
function leaderCrossings(solution,slot){
  let count=0;
  for(let i=0;i<solution.length;i++)for(let j=i+1;j<solution.length;j++){
    const a=segmentFor(solution[i],slot),b=segmentFor(solution[j],slot);if(properIntersection(a.a,a.b,b.a,b.b))count++;
  }
  return count;
}
function bubbleHits(solution,slot){
  const shared=spec()?.comparison||{},radius=Number(shared.placementBubbleRadius)||17.2,clearance=4;
  let hits=0;
  for(let i=0;i<solution.length;i++){
    const segment=segmentFor(solution[i],slot);
    for(let j=0;j<solution.length;j++)if(i!==j&&segmentDistance(solution[j].point,segment.a,segment.b)<radius+clearance)hits++;
  }
  return hits;
}
function sanitize(solution,slot,wheel){
  solution.forEach(record=>{record.exactPoint=exactPoint(record,slot)});
  const fixed=fixedSegments(wheel,slot);
  // A displaced leader may not cut through a cusp/angle axis. Make only that placement radial.
  solution.forEach(record=>{
    const segment=segmentFor(record,slot);
    if(fixed.some(other=>properIntersection(segment.a,segment.b,other.a,other.b)))forceExact(record,slot);
  });
  // A leader may not run through another placement bubble.
  const shared=spec()?.comparison||{},radius=Number(shared.placementBubbleRadius)||17.2;
  solution.forEach((record,index)=>{
    const segment=segmentFor(record,slot);
    const hit=solution.some((other,j)=>j!==index&&segmentDistance(other.point,segment.a,segment.b)<radius+4);
    if(hit)forceExact(record,slot);
  });
  // If any leader-to-leader crossing remains, the entire sky falls back to exact radial anchors.
  if(leaderCrossings(solution,slot)!==0)solution.forEach(record=>forceExact(record,slot));
  return solution;
}

function solveSlot(wheel,slot){
  const g=geometry(slot),items=ordinaryItems(wheel,slot);if(!g||!items.length)return{items:[],crossings:0,hits:0};
  const lane=Number(g.placement?.[0]);if(!Number.isFinite(lane))return{items:[],crossings:0,hits:0};
  const bySign=new Map();items.forEach(item=>{if(!bySign.has(item.sign))bySign.set(item.sign,[]);bySign.get(item.sign).push(item)});
  let solution=[];for(let sign=0;sign<12;sign++)solution.push(...solveSignGroup(bySign.get(sign)||[],lane));
  solution=sanitize(solution,slot,wheel);
  solution.sort((a,b)=>a.item.exact-b.item.exact||a.item.index-b.item.index);
  solution.forEach((record,index)=>{
    const {item}=record,exact=record.exactPoint||exactPoint(record,slot);
    item.group.setAttribute('transform',`translate(${record.point.x} ${record.point.y})`);
    item.group.dataset.displayLongitude=norm(record.display).toFixed(8);
    item.group.dataset.exactLongitude=item.exact.toFixed(8);
    item.group.dataset.placementLane=String(record.lane);
    item.group.dataset.placementCircularOrder=String(index);
    item.group.dataset.placementOrderCorrected=Math.abs(record.offset)>1e-6?'true':'false';
    item.group.dataset.placementOrderFallback=record.fallback?'true':'false';
    item.group.dataset.placementTangentialOffset=record.offset.toFixed(3);
    item.leader.setAttribute('x1',record.point.x.toFixed(2));item.leader.setAttribute('y1',record.point.y.toFixed(2));
    item.leader.setAttribute('x2',exact.x.toFixed(2));item.leader.setAttribute('y2',exact.y.toFixed(2));
    item.leader.dataset.displayLongitude=norm(record.display).toFixed(8);
    item.leader.dataset.leaderRouting='same-sign-ordered-v6';
  });
  return{items:solution,crossings:leaderCrossings(solution,slot),hits:bubbleHits(solution,slot)};
}

function arrange(wheel){
  // This resolver is authored for the 1200×1200 A/B comparison geometry.
  // Standalone wheels use their own 600×600 geometry and already resolve
  // collisions in sky-chart-single-sky-mode-v2.js. Running this pass there
  // moves ordinary placements around the comparison center (600,600), outside
  // the standalone wheel's visible viewBox centered at (300,300).
  if(!(wheel instanceof SVGSVGElement)||arranging)return;
    // A-only Sky Chart now uses the same 1200×1200 comparison geometry, so it
    // intentionally shares this collision resolver. Only legacy mini geometry
    // would be ineligible.
    if(wheel.dataset.singleSky&&wheel.dataset.wheelGeometry!=='comparison')return;arranging=true;
  try{
    const a=solveSlot(wheel,'A'),b=solveSlot(wheel,'B');
    wheel.dataset.placementLeaderCrossings=String(a.crossings+b.crossings);
    wheel.dataset.placementLeaderGlyphHits=String(a.hits+b.hits);
    wheel.dataset.placementCircularOrder='preserved';
    wheel.dataset.crossSignDisplacement='forbidden';
    wheel.dataset.placementCollisionOrder='same-sign-current-ring-v6';
    if(a.crossings+b.crossings)console.error('[Sky Chart placement layout] Crossing contract failed.',{A:a.crossings,B:b.crossings});
  }finally{arranging=false}
}
function currentWheel(){return document.querySelector('#skyFoundationWheelMount > svg.sky-foundation-wheel')}
function arrangeCurrent(){const wheel=currentWheel();if(wheel)arrange(wheel)}
function install(){
  const mount=document.getElementById('skyFoundationWheelMount');
  if(mount)new MutationObserver(records=>{
    if(arranging)return;
    if(records.some(record=>record.type==='childList'&&Array.from(record.addedNodes||[]).some(node=>node.nodeType===1)))requestAnimationFrame(arrangeCurrent);
  }).observe(mount,{subtree:true,childList:true});
  arrangeCurrent();
  window.addEventListener('relphi:sky-foundation-ready',()=>requestAnimationFrame(arrangeCurrent));
}
window.RelphiPlacementCollisionOrder={arrange,arrangeCurrent};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
})();
