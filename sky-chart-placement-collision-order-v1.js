// Final comparison-wheel placement collision resolver.
// Reads the current shared ring specification instead of hard-coding the historical A/B ring order.
// Placements remain inside their true zodiac sign and in true circular order. A crossed or misleading
// leader is never accepted; exact-radial overlap is preferable to a false visual correspondence.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyPlacementCollisionOrderV11)return;
window.__relphiSkyPlacementCollisionOrderV11=true;
window.__relphiSkyPlacementCollisionOrderV10=true;
window.__relphiSkyPlacementCollisionOrderV9=true;
window.__relphiSkyPlacementCollisionOrderV8=true;
window.__relphiSkyPlacementCollisionOrderV7=true;
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
    return{group,leader,id,index,priority:priority(id),exact:norm(exact),sign:Math.floor(norm(exact)/30),authoredLane:num(group.dataset.placementAuthoredLane??group.dataset.placementLane),authoredExactRadius:Math.hypot(num(leader.getAttribute('x2'))-center().x,num(leader.getAttribute('y2'))-center().y)};
  }).filter(Boolean).sort((a,b)=>a.exact-b.exact||a.priority-b.priority||a.index-b.index);
}

function solveSignGroup(items,lane){
  if(!items.length)return[];
  const baseSep=minimumSeparation(lane),sign=items[0].sign,start=sign*30,end=start+30;
  // Prefer the widest same-circumference spacing the sign can contain.
  // The previous ascending search always accepted multiplier 1 first,
  // leaving clusters visually cramped even when spare arc was available.
  // Densely populated signs gracefully fall back to smaller increments.
  for(const multiplier of [1.4,1.35,1.3,1.25,1.2,1.15,1.1,1.05,1]){
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
function exactPoint(record,slot){const radius=Number(record?.item?.authoredExactRadius),g=geometry(slot);return polar(Number.isFinite(radius)?radius:g.degree,record.item.exact)}
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

// A rejected leader can return a placement to its exact longitude after the
// angular collision solve. Repair *remaining* bubble overlaps without reversing
// circular order, changing zodiac signs, or crossing cusps / another leader.
// Every orb has a fixed authored circumference. When leader sanitization
// returns placements to their exact longitude, solve any remaining collisions
// tangentially on THAT SAME circumference. No radial candidates are legal.
// A chain of closely spaced longitudes cannot always be repaired one orb at a
// time: the first orb has nowhere to move until its neighbors move together.
// Solve the entire crowded sign as a unit, always on its authored circumference.
function redistributeCrowdedSign(solution,slot,wheel,sign){
  const group=solution.filter(record=>record.item.sign===sign).sort((a,b)=>a.item.exact-b.item.exact||a.item.index-b.item.index);
  if(group.length<2)return false;
  const other=solution.filter(record=>record.item.sign!==sign);
  const shared=spec()?.comparison||{},bubble=Number(shared.placementBubbleRadius)||19.7,
    sepDistance=2*bubble+2,leaderClearance=bubble+4,fixed=fixedSegments(wheel,slot);
  const lane=group[0].item.authoredLane,start=sign*30,end=start+30;
  if(!Number.isFinite(lane)||group.some(record=>Math.abs(record.item.authoredLane-lane)>EPS))return false;
  const houseDividers=[...wheel.querySelectorAll(`[data-layer="${slot==='A'?'a-houses':'b-houses'}"] line.sky-foundation-divider`)]
    .map(parseSegment).filter(Boolean);
  const angleAxes=fixed.filter(segment=>!houseDividers.some(h=>
    Math.abs(h.a.x-segment.a.x)<EPS&&Math.abs(h.a.y-segment.a.y)<EPS&&
    Math.abs(h.b.x-segment.b.x)<EPS&&Math.abs(h.b.y-segment.b.y)<EPS));
  const safe=(records,allowHouseCrossing,allowLeaderBehindOrb)=>{
    const full=[...records,...other];
    for(let i=0;i<full.length;i++){
      const a=full[i],line=segmentFor(a,slot);
      if(records.includes(a)){
        if(angleAxes.some(f=>properIntersection(line.a,line.b,f.a,f.b)))return false
        if(!allowHouseCrossing&&houseDividers.some(f=>properIntersection(line.a,line.b,f.a,f.b)))return false
      }
      for(let j=i+1;j<full.length;j++){
        const b=full[j];
        // The crowded-sign search cannot fix two placements in OTHER signs.
        // Do not let those unrelated pending collisions veto this sign's
        // collective solution; each crowded sign is repaired in its own pass.
        if(!records.includes(a)&&!records.includes(b))continue;
        const otherLine=segmentFor(b,slot);
        if(Math.hypot(a.point.x-b.point.x,a.point.y-b.point.y)<sepDistance-EPS)return false
        if(records.includes(a)||records.includes(b)){
          if(properIntersection(line.a,line.b,otherLine.a,otherLine.b))return false
          // As a final fallback the leader may pass BEHIND another opaque
          // glyph orb. The line still points to its exact zodiac longitude;
          // leader-to-leader crossings remain prohibited.
          if(!allowLeaderBehindOrb&&segmentDistance(a.point,otherLine.a,otherLine.b)<leaderClearance-EPS)return false
          if(!allowLeaderBehindOrb&&segmentDistance(b.point,line.a,line.b)<leaderClearance-EPS)return false
        }
      }
    }
    return true;
  };
  let best=null;
  // Preserve house dividers whenever possible. In an impossibly crowded
  // house segment, an exact-longitude leader may cross a house cusp rather
  // than allowing glyphs to overlap or leave their fixed circumference.
  for(const [allowHouseCrossing,allowLeaderBehindOrb] of [[false,false],[true,false],[true,true]]){
    let stageBest=null;
    const sepBase=minimumSeparation(lane);
    for(const multiplier of [1.4,1.3,1.2,1.1,1]){
      const sep=sepBase*multiplier,low=start+sep/2+.02,
        high=end-sep/2-.02-(group.length-1)*sep;
      if(low>high+EPS)continue;
      const intervals=Math.max(1,Math.ceil((high-low)/.2));
      for(let step=0;step<=intervals;step++){
        const first=low+(high-low)*step/intervals;
        const records=group.map((record,i)=>{
          const display=first+i*sep;
          return {...record,display,lane,point:polar(lane,display),
            exactPoint:record.exactPoint||exactPoint(record,slot),offset:display-record.item.exact};
        });
        if(records.some(rec=>Math.abs(rec.offset)>19))continue;
        if(!safe(records,allowHouseCrossing,allowLeaderBehindOrb))continue;
        const crossings=records.reduce((n,r)=>{
          const line=segmentFor(r,slot);
          return n+houseDividers.filter(h=>properIntersection(line.a,line.b,h.a,h.b)).length;
        },0);
        const score=records.reduce((n,r)=>n+Math.abs(r.offset)*weight(r.item),0)
          +80*(1.4-multiplier)+150*crossings;
        if(!stageBest||score<stageBest.score)stageBest={records,score,crossings,allowLeaderBehindOrb};
      }
    }
    if(stageBest){best=stageBest;break}
  }
  if(!best)return false;
  best.records.forEach((candidate,index)=>{
    Object.assign(group[index],candidate,{tangentialRepair:true,
      houseCrossingFallback:best.crossings>0,leaderBehindOrbFallback:best.allowLeaderBehindOrb});
  });
  if(best.crossings)wheel.dataset.placementHouseDividerLeaderCrossings=String(
    Number(wheel.dataset.placementHouseDividerLeaderCrossings||0)+best.crossings);
  return true;
}
function repairBubbleClearance(solution,slot,wheel){
  if(solution.length<2)return solution;
  const shared=spec()?.comparison||{},bubble=Number(shared.placementBubbleRadius)||19.7,
    separation=2*bubble+2,leaderClearance=bubble+4,fixed=fixedSegments(wheel,slot);
  const distance=(a,b)=>Math.hypot(a.point.x-b.point.x,a.point.y-b.point.y);
  const overlapPairs=()=>{
    const pairs=[];
    for(let i=0;i<solution.length;i++)for(let j=i+1;j<solution.length;j++){
      const d=distance(solution[i],solution[j]);
      if(d<separation-EPS)pairs.push({i,j,d});
    }
    return pairs.sort((a,b)=>a.d-b.d);
  };
  const allowed=(candidate,index)=>{
    const item=solution[index].item,sign=item.sign,start=sign*30,end=start+30;
    // A fixed circumference is not a preference: it is the layout contract.
    if(Math.abs(candidate.lane-item.authoredLane)>EPS)return false;
    if(!(candidate.display>start+.05&&candidate.display<end-.05))return false;
    for(let i=0;i<solution.length;i++){
      if(i===index)continue;
      const other=solution[i];
      if(other.item.sign===sign&&((other.item.exact<item.exact&&candidate.display<=other.display+.02)||
        (other.item.exact>item.exact&&candidate.display>=other.display-.02)))return false;
      if(distance(candidate,other)<separation-EPS)return false;
    }
    const line=segmentFor(candidate,slot);
    if(fixed.some(other=>properIntersection(line.a,line.b,other.a,other.b)))return false;
    for(let i=0;i<solution.length;i++){
      if(i===index)continue;
      const other=solution[i],route=segmentFor(other,slot);
      if(properIntersection(line.a,line.b,route.a,route.b))return false;
      if(segmentDistance(other.point,line.a,line.b)<leaderClearance-EPS)return false;
      if(segmentDistance(candidate.point,route.a,route.b)<leaderClearance-EPS)return false;
    }
    return true;
  };
  let repaired=0;
  // Resolve connected overlap chains together before local single-orb search.
  // This avoids returning Moon/Neptune/Saturn to mutually overlapping exacts.
  const crowdedSigns=new Set(overlapPairs().flatMap(({i,j})=>[solution[i].item.sign,solution[j].item.sign]));
  for(const sign of crowdedSigns)if(redistributeCrowdedSign(solution,slot,wheel,sign))repaired++;
  for(let pass=0;pass<solution.length*4;pass++){
    const overlaps=overlapPairs();
    if(!overlaps.length)break;
    let improved=false;
    for(const {i,j} of overlaps){
      // Preserve luminary positions if a less prominent neighbor can move.
      const order=[i,j].sort((a,b)=>solution[b].item.priority-solution[a].item.priority||
        Math.abs(solution[a].offset)-Math.abs(solution[b].offset));
      let best=null;
      for(const index of order){
        const record=solution[index],item=record.item,lane=item.authoredLane;
        // Explore only circular offsets. The search includes exact and
        // presently displayed longitudes to avoid unnecessary movement.
        const angles=[record.display,item.exact];
        for(let step=.25;step<=19;step+=.25){
          angles.push(item.exact+step,item.exact-step,record.display+step,record.display-step);
        }
        for(const display of [...new Set(angles.map(a=>Number(a.toFixed(5))))]){
          if(Math.abs(display-item.exact)>19)continue;
          const candidate={...record,lane,display,point:polar(lane,display),
            exactPoint:record.exactPoint||exactPoint(record,slot),offset:display-item.exact};
          if(!allowed(candidate,index))continue;
          const penalty=Math.abs(candidate.offset)*3.5*(1+Math.max(0,3-item.priority)*.45);
          if(!best||penalty<best.penalty)best={index,candidate,penalty};
        }
      }
      if(best){
        Object.assign(solution[best.index],best.candidate,{tangentialRepair:true});
        repaired++;improved=true;break;
      }
    }
    if(!improved)break;
  }
  const unresolved=overlapPairs();
  wheel.dataset.placementTangentialClearanceRepairs=String(
    Number(wheel.dataset.placementTangentialClearanceRepairs||0)+repaired);
  wheel.dataset.placementUnresolvedBubbleOverlaps=String(
    Number(wheel.dataset.placementUnresolvedBubbleOverlaps||0)+unresolved.length);
  if(unresolved.length)console.warn('[Sky Chart placement layout] No valid same-circumference clearance',slot,unresolved.length);
  return solution;
}
function solveSlot(wheel,slot){
  const g=geometry(slot),items=ordinaryItems(wheel,slot);if(!g||!items.length)return{items:[],crossings:0,hits:0};
  const authoredLane=items.find(item=>Number.isFinite(item.authoredLane))?.authoredLane,lane=Number.isFinite(authoredLane)?authoredLane:Number(g.placement?.[0]);if(!Number.isFinite(lane))return{items:[],crossings:0,hits:0};
  const bySign=new Map();items.forEach(item=>{if(!bySign.has(item.sign))bySign.set(item.sign,[]);bySign.get(item.sign).push(item)});
  let solution=[];for(let sign=0;sign<12;sign++)solution.push(...solveSignGroup(bySign.get(sign)||[],lane));
  solution=sanitize(solution,slot,wheel);
  solution=repairBubbleClearance(solution,slot,wheel);
  solution.sort((a,b)=>a.item.exact-b.item.exact||a.item.index-b.item.index);
  solution.forEach((record,index)=>{
    const {item}=record,exact=record.exactPoint||exactPoint(record,slot);
    item.group.setAttribute('transform',`translate(${record.point.x} ${record.point.y})`);
    item.group.dataset.displayLongitude=norm(record.display).toFixed(8);
    item.group.dataset.exactLongitude=item.exact.toFixed(8);
    // Keep the source lane stable across any subsequent arrange() pass.
    // A radial clearance repair must not become the authored lane for the
    // whole sign/sky when filters or wheel events re-run the resolver.
    if(!Number.isFinite(num(item.group.dataset.placementAuthoredLane)))item.group.dataset.placementAuthoredLane=String(item.authoredLane);
    item.group.dataset.placementLane=String(record.lane);
    item.group.dataset.placementCircularOrder=String(index);
    item.group.dataset.placementOrderCorrected=Math.abs(record.offset)>1e-6?'true':'false';
    item.group.dataset.placementOrderFallback=record.fallback?'true':'false';
    item.group.dataset.placementTangentialClearance=record.tangentialRepair?'true':'false';
    item.group.dataset.placementHouseCrossingFallback=record.houseCrossingFallback?'true':'false';
    item.group.dataset.placementLeaderBehindOrbFallback=record.leaderBehindOrbFallback?'true':'false';
    item.leader.dataset.placementHouseCrossingFallback=record.houseCrossingFallback?'true':'false';
    if(Math.abs(record.lane-item.authoredLane)>EPS)throw new Error('Placement orb left its authored circumference: '+item.id);
    item.group.dataset.placementTangentialOffset=record.offset.toFixed(3);
    item.leader.setAttribute('x1',record.point.x.toFixed(2));item.leader.setAttribute('y1',record.point.y.toFixed(2));
    item.leader.setAttribute('x2',exact.x.toFixed(2));item.leader.setAttribute('y2',exact.y.toFixed(2));
    item.leader.dataset.displayLongitude=norm(record.display).toFixed(8);
    item.leader.dataset.leaderRouting='same-sign-ordered-v6';
  });
  return{items:solution,crossings:leaderCrossings(solution,slot),hits:bubbleHits(solution,slot)};
}

// Preserve a valid resolved ring until that sky's geometry actually changes.
// Changing Sky A's house dividers must never re-sanitize Sky B and inadvertently
// return its safely separated orbs to overlapping exact anchors.
// Cache only immutable layout inputs, never the output SVG transforms. Other
// controllers may restyle glyphs without changing the sky's placements or
// house boundaries. Such changes must not trigger a destructive layout rerun.
function slotGeometrySignature(wheel,slot){
  const items=ordinaryItems(wheel,slot),fixed=fixedSegments(wheel,slot);
  return JSON.stringify([
    items.map(item=>[item.id,item.exact,item.authoredLane,item.authoredExactRadius]),
    fixed.map(segment=>[segment.a.x,segment.a.y,segment.b.x,segment.b.y])
  ]);
}
function slotOrbsStayOnRingAndClear(wheel,slot){
  const items=ordinaryItems(wheel,slot),bubble=Number(spec()?.comparison?.placementBubbleRadius)||19.7,
    c=center(),points=[];
  for(const item of items){
    const matrix=item.group.transform?.baseVal?.consolidate()?.matrix;
    if(!matrix||!Number.isFinite(matrix.e)||!Number.isFinite(matrix.f))return false;
    if(!Number.isFinite(item.authoredLane))return false;
    const point={x:matrix.e,y:matrix.f};
    if(Math.abs(Math.hypot(point.x-c.x,point.y-c.y)-item.authoredLane)>.1)return false;
    if(points.some(other=>Math.hypot(point.x-other.x,point.y-other.y)<2*bubble+2-EPS))return false;
    points.push(point);
  }
  return true;
}
function solveOrReuse(wheel,slot){
  const key='placementCollisionSignature'+slot,
    crossingsKey='placementSlotLeaderCrossings'+slot,
    hitsKey='placementSlotLeaderHits'+slot,
    input=slotGeometrySignature(wheel,slot);
  const sameInput=wheel.dataset[key]===input;
  const validGeometry=slotOrbsStayOnRingAndClear(wheel,slot);
  if(sameInput&&validGeometry){
    return{items:[],crossings:Number(wheel.dataset[crossingsKey]||0),
      hits:Number(wheel.dataset[hitsKey]||0),reused:true};
  }
  const result=solveSlot(wheel,slot);
  wheel.dataset[key]=slotGeometrySignature(wheel,slot);
  wheel.dataset[crossingsKey]=String(result.crossings);
  wheel.dataset[hitsKey]=String(result.hits);
  return result;
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
    wheel.dataset.placementTangentialClearanceRepairs='0';
    wheel.dataset.placementUnresolvedBubbleOverlaps='0';
    wheel.dataset.placementHouseDividerLeaderCrossings='0';
    const a=solveOrReuse(wheel,'A'),b=solveOrReuse(wheel,'B');
    wheel.dataset.placementLeaderCrossings=String(a.crossings+b.crossings);
    wheel.dataset.placementLeaderGlyphHits=String(a.hits+b.hits);
    wheel.dataset.placementCircularOrder='preserved';
    wheel.dataset.crossSignDisplacement='forbidden';
    wheel.dataset.placementCollisionOrder='same-sign-fixed-circumference-v11';
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
