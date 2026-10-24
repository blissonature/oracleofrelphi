// Final comparison-wheel placement collision resolver.
// Reads the current shared ring specification instead of hard-coding the historical A/B ring order.
// Placements remain inside their true zodiac sign and in true circular order. A crossed or misleading
// leader is never accepted; exact-radial overlap is preferable to a false visual correspondence.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyPlacementCollisionOrderV16)return;
window.__relphiSkyPlacementCollisionOrderV16=true;
window.__relphiSkyPlacementCollisionOrderV15=true;
window.__relphiSkyPlacementCollisionOrderV14=true;
window.__relphiSkyPlacementCollisionOrderV13=true;
window.__relphiSkyPlacementCollisionOrderV12=true;
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
// The zodiac sign and HOUSE are independent constraints. A bubble can move
// tangentially around its assigned ring to clear a neighbor, but its center
// must remain inside the house sector containing its actual exact longitude.
function houseCuspAngles(wheel,slot){
  const role=slot==='A'?'a-houses':'b-houses',c=center();
  const angles=[...wheel.querySelectorAll(`[data-layer="${role}"] line.sky-foundation-divider`)]
    .map(line=>{
      const segment=parseSegment(line);if(!segment)return NaN;
      const p=Math.hypot(segment.a.x-c.x,segment.a.y-c.y)>
        Math.hypot(segment.b.x-c.x,segment.b.y-c.y)?segment.a:segment.b;
      return norm(Math.atan2(p.y-c.y,p.x-c.x)*180/Math.PI+180);
    }).filter(Number.isFinite).sort((a,b)=>a-b);
  return angles.filter((value,i)=>!i||Math.abs(value-angles[i-1])>.02);
}
function houseArcFor(cusps,exact){
  if(cusps.length<4)return null;
  const e=norm(exact);
  let index=cusps.findLastIndex(v=>v<=e+1e-6);
  if(index<0)index=cusps.length-1;
  const first=cusps[index],last=cusps[(index+1)%cusps.length];
  const lower=first>e?first-360:first;
  return{lower,upper:last<=lower?last+360:last};
}
function staysInActualHouse(item,display,cusps){
  if(cusps.length<4)return true;
  // Compare the actual painted house sectors, NOT just the numerical
  // interval. In particular, the sector ending at the first cusp wraps
  // across 0° Aries and must not admit glyphs past that boundary.
  const houseOf=longitude=>{
    const value=norm(longitude);
    const i=cusps.findLastIndex(degree=>degree<=value+1e-6);
    return i<0?cusps.length-1:i;
  };
  return houseOf(item.exact)===houseOf(display);
}
function minimumSeparation(lane){
  const shared=spec()?.comparison||{},radius=Number(shared.placementBubbleRadius)||17.2,
    clearance=Math.max(6,Number(shared.placementClearance)||6);
  // Use the existing intended 6px-or-greater gap. A previous regression
  // reduced this to 2px, so tightly packed orbs passed numerical checks
  // while visually touching at normal chart scale.
  const chord=2*radius+clearance,ratio=Math.min(.999999,chord/(2*lane));
  return 2*Math.asin(ratio)*180/Math.PI+.005;
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
  const sorted=[...items].sort((a,b)=>a.exact-b.exact||a.priority-b.priority||a.index-b.index);
  const sign=sorted[0].sign,start=sign*30,end=start+30;
  const make=(item,display,fallback=false)=>({item,lane,display,
    point:polar(lane,display),exactPoint:null,offset:display-item.exact,fallback});
  // An isolated placement stays EXACTLY on its longitude notch.
  if(sorted.length===1)return[make(sorted[0],sorted[0].exact)];
  const sep=minimumSeparation(lane),lower=start+.005,
    upper=end-.005-(sorted.length-1)*sep;
  if(upper<lower-EPS){
    // Impossible to put all bubbles into one sign without overlap.
    return sorted.map(item=>make(item,item.exact,true));
  }
  // Weighted bounded isotonic regression minimizes the squared angular
  // displacement subject to non-overlap and circular order. Critically,
  // positions that already have enough clearance remain at EXACT longitude:
  // there is NO arbitrary spacing multiplier and NO margin of half a bubble
  // from the zodiac boundary.
  const targets=sorted.map((item,index)=>item.exact-index*sep);
  const fit=isotonic(targets,sorted.map(weight));
  return sorted.map((item,index)=>{
    const display=Math.max(lower,Math.min(upper,fit[index]))+index*sep;
    return make(item,display);
  });
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
    sepDistance=2*bubble+Math.max(6,Number(shared.placementClearance)||6),
    leaderClearance=bubble+4,fixed=fixedSegments(wheel,slot);
  const lane=group[0].item.authoredLane,start=sign*30,end=start+30,
    houseCusps=houseCuspAngles(wheel,slot);
  if(!Number.isFinite(lane)||group.some(record=>Math.abs(record.item.authoredLane-lane)>EPS))return false;
  const houseDividers=[...wheel.querySelectorAll(`[data-layer="${slot==='A'?'a-houses':'b-houses'}"] line.sky-foundation-divider`)]
    .map(parseSegment).filter(Boolean);
  const angleAxes=fixed.filter(segment=>!houseDividers.some(h=>
    Math.abs(h.a.x-segment.a.x)<EPS&&Math.abs(h.a.y-segment.a.y)<EPS&&
    Math.abs(h.b.x-segment.b.x)<EPS&&Math.abs(h.b.y-segment.b.y)<EPS));
  const safe=(records,allowHouseCrossing,allowLeaderBehindOrb)=>{
    const full=[...records,...other];
    if(records.some(r=>!staysInActualHouse(r.item,r.display,houseCusps)))return false;
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
    // Test the least-displaced, nonuniform isotonic solution before trying
    // an equally spaced sign-wide layout. A free-standing planet must not
    // shift merely because two OTHER planets in its sign are conjunct.
    const optimal=solveSignGroup(group.map(record=>record.item),lane);
    const minimal=optimal.map((record,index)=>({
      ...group[index],display:record.display,lane,
      point:polar(lane,record.display),offset:record.display-group[index].item.exact
    }));
    if(minimal.length===group.length&&!minimal.some(r=>r.fallback)){
      const minDisplay=Math.min(...minimal.map(r=>r.display)),maxDisplay=Math.max(...minimal.map(r=>r.display));
      for(let shift=-12;shift<=12.00001;shift+=.25){
        if(minDisplay+shift<start+.005||maxDisplay+shift>end-.005)continue;
        const records=minimal.map(record=>{
          const display=record.display+shift;
          return {...record,display,point:polar(lane,display),offset:display-record.item.exact};
        });
        if(records.some(r=>Math.abs(r.offset)>19)||!safe(records,allowHouseCrossing,allowLeaderBehindOrb))continue;
        const crossings=records.reduce((n,r)=>{
          const line=segmentFor(r,slot);
          return n+houseDividers.filter(h=>properIntersection(line.a,line.b,h.a,h.b)).length;
        },0);
        const score=records.reduce((n,r)=>n+r.offset*r.offset*weight(r.item),0)+150*crossings;
        if(!stageBest||score<stageBest.score)stageBest={records,score,crossings,allowLeaderBehindOrb};
      }
    }
    const sepBase=minimumSeparation(lane);
    // Only fall back to evenly spaced sign-wide search when minimal
    // nonuniform positions cannot satisfy the leader-routing constraints.
    for(const multiplier of [1,1.025,1.05,1.1]){
      const sep=sepBase*multiplier,low=start+.005,
        high=end-.005-(group.length-1)*sep;
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
        // Prefer the smallest total squared deviation from actual notches.
        // Leader-routing safety is handled by the staged search, not by
        // moving free placements away from their original coordinates.
        const score=records.reduce((n,r)=>n+r.offset*r.offset*weight(r.item),0)
          +150*crossings;
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
    separation=2*bubble+Math.max(6,Number(shared.placementClearance)||6),
    leaderClearance=bubble+4,fixed=fixedSegments(wheel,slot),
    houseCusps=houseCuspAngles(wheel,slot);
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
    if(!staysInActualHouse(item,candidate.display,houseCusps))return false;
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
// Final preference pass for ordinary placement bubbles on ONE authored ring:
// 1. Keep a straight radial leader (display longitude === true notch) whenever
//    no glyph collision or house divider forces a displacement.
// 2. Give the entire glyph outline breathing room from each HOUSE divider,
//    not merely the leader line. Never move the glyph inward or outward.
// 3. Minimize necessary same-ring angular shifts without changing the notch.
function preferRadialLeadersAndHouseClearance(solution,slot,wheel){
  if(!solution.length)return solution;
  const shared=spec()?.comparison||{},bubble=Number(shared.placementBubbleRadius)||19.7,
    clearance=Math.max(6,Number(shared.placementClearance)||6),
    minimum=bubble+clearance,diameter=2*bubble+clearance;
  const dividers=[...wheel.querySelectorAll(`[data-layer="${slot==='A'?'a-houses':'b-houses'}"] line.sky-foundation-divider`)]
    .map(parseSegment).filter(Boolean),houseCusps=houseCuspAngles(wheel,slot);
  if(!dividers.length)return solution;
  const boundaryClear=point=>dividers.every(line=>segmentDistance(point,line.a,line.b)>=minimum-.05);
  const grouped=new Map();
  for(const r of solution){if(!grouped.has(r.item.sign))grouped.set(r.item.sign,[]);grouped.get(r.item.sign).push(r);}
  const circularDistance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  let repaired=0,unresolved=0,straightened=0;
  for(const [sign,records] of grouped){
    const group=records.sort((a,b)=>a.item.exact-b.item.exact||a.item.index-b.item.index);
    const other=solution.filter(r=>r.item.sign!==sign),lane=group[0].item.authoredLane;
    if(!Number.isFinite(lane)||group.some(r=>Math.abs(r.item.authoredLane-lane)>EPS))continue;
    // We do NOT spread a sign when all orb outlines clear the boundaries and
    // every non-radial stalk is necessitated by an existing orb collision.
    const canStraighten=record=>{
      if(Math.abs(record.display-record.item.exact)<.05)return false;
      const exact=polar(lane,record.item.exact);
      return staysInActualHouse(record.item,record.item.exact,houseCusps)&&
        boundaryClear(exact)&&solution.every(r=>r===record||circularDistance(exact,r.point)>=diameter-.05);
    };
    if(!group.some(r=>!boundaryClear(r.point)||canStraighten(r)))continue;
    const allSame=group.map(r=>r.item.exact);
    const options=group.map((record)=>{
      const start=sign*30+.005,end=start+30-.01,values=[];
      const append=deg=>{if(deg>=start&&deg<=end&&Math.abs(deg-record.item.exact)<=19.0001)values.push(Number(deg.toFixed(5)));};
      append(record.item.exact);
      append(record.display);
      for(let t=Math.ceil(start*4)/4;t<=end;t+=.25)append(t);
      const unique=[...new Set(values)].sort((a,b)=>a-b);
      return unique.flatMap(display=>{
        const point=polar(lane,display);
        if(!staysInActualHouse(record.item,display,houseCusps)||!boundaryClear(point)||
           other.some(r=>circularDistance(point,r.point)<diameter-.05))return[];
        const segment={a:point,b:exactPoint(record,slot)};
        // A new leader cannot intersect another sky placement's leader. An
        // accurate line crossing a HOUSE division is possible, but penalized.
        if(other.some(r=>{const line=segmentFor(r,slot);return properIntersection(segment.a,segment.b,line.a,line.b)}))return[];
        const bends=Math.abs(display-record.item.exact);
        const houseCrossings=dividers.filter(l=>properIntersection(segment.a,segment.b,l.a,l.b)).length;
        const cost=weight(record.item)*(bends*bends+8*bends)+
          (bends>.06?36:0)+houseCrossings*35;
        return[{display,point,segment,cost}];
      });
    });
    if(options.some(list=>!list.length)){unresolved++;continue;}
    const costs=options.map(opts=>opts.map(()=>Infinity));
    const back=options.map(opts=>opts.map(()=>-1));
    options[0].forEach((opt,j)=>costs[0][j]=opt.cost);
    for(let i=1;i<options.length;i++){
      for(let j=0;j<options[i].length;j++){
        const cur=options[i][j];
        for(let k=0;k<options[i-1].length;k++){
          if(!Number.isFinite(costs[i-1][k]))continue;
          const prev=options[i-1][k];
          if(cur.display<=prev.display+.02||circularDistance(cur.point,prev.point)<diameter-.05)continue;
          if(properIntersection(cur.segment.a,cur.segment.b,prev.segment.a,prev.segment.b))continue;
          const score=costs[i-1][k]+cur.cost;
          if(score<costs[i][j]){costs[i][j]=score;back[i][j]=k;}
        }
      }
    }
    let index=-1,best=Infinity;
    const last=group.length-1;
    costs[last].forEach((score,j)=>{if(score<best){best=score;index=j;}});
    if(index<0||!Number.isFinite(best)){unresolved++;continue;}
    const chosen=new Array(group.length);
    for(let i=last;i>=0;i--){chosen[i]=options[i][index];index=back[i][index];}
    // Verify ALL inter-group and nonadjacent leader relationships, then
    // atomically accept the improvement; otherwise preserve the old layout.
    const trial=solution.map(record=>{
      const idx=group.indexOf(record);
      return idx>=0?{...record,display:chosen[idx].display,point:chosen[idx].point,
        lane,offset:chosen[idx].display-record.item.exact}:record;
    });
    const overlaps=trial.some((a,i)=>trial.some((b,j)=>j>i&&circularDistance(a.point,b.point)<diameter-.05));
    if(overlaps||leaderCrossings(trial,slot)>0){unresolved++;continue;}
    for(let i=0;i<group.length;i++){
      const record=group[i],wasBent=Math.abs(record.offset)>.06,
        display=chosen[i].display;
      if(wasBent&&Math.abs(display-record.item.exact)<=.06)straightened++;
      Object.assign(record,{display,point:chosen[i].point,lane,
        offset:display-record.item.exact,houseBoundaryRepair:true});
    }
    repaired++;
  }
  wheel.dataset.placementRadialLeaderBlocked='';
  // A previous sign-wide solve may leave a planet unnecessarily bent even
  // after its neighbors have moved clear of it. Restore radial stalks LAST,
  // using the *final* complete layout, without disturbing any other glyph.
  // This is an independent preference pass, not conditional on a nearby cusp.
  for(const record of [...solution].sort((a,b)=>b.item.priority-a.item.priority||
    Math.abs(a.offset)-Math.abs(b.offset))){
    if(Math.abs(record.offset)<=.06)continue;
    const lane=record.item.authoredLane,point=polar(lane,record.item.exact);
    if(!staysInActualHouse(record.item,record.item.exact,houseCusps)||!boundaryClear(point)){
      wheel.dataset.placementRadialLeaderBlocked+=record.item.id+':house;';
      continue;
    }
    const blockers=solution.filter(r=>r!==record&&circularDistance(point,r.point)<diameter-.05);
    if(blockers.length){
      wheel.dataset.placementRadialLeaderBlocked+=record.item.id+':orb-'+blockers.map(r=>r.item.id).join(',')+';';
      continue;
    }
    const trial={...record,display:record.item.exact,point,lane,offset:0,
      exactPoint:exactPoint(record,slot)};
    const currentIndex=solution.indexOf(record);
    const proposal=[...solution];proposal[currentIndex]=trial;
    if(leaderCrossings(proposal,slot)>0){
      wheel.dataset.placementRadialLeaderBlocked+=record.item.id+':leaders;';
      continue;
    }
    Object.assign(record,trial,{radialLeaderRestored:true});
    straightened++;
  }
  wheel.dataset.placementHouseBubbleClearanceRepairs=String(repaired);
  wheel.dataset.placementHouseBubbleClearanceUnresolved=String(unresolved);
  wheel.dataset.placementRadialLeadersRestored=String(straightened);
  return solution;
}
// Last-resort layout for a physically too-narrow sign/house arc: preserve
// the true house, sign, and exact radial lane. Reduce only the crowded
// glyphs' visual diameter as needed, rather than moving them into a false
// house or putting several full-size bubbles on top of one another.
function resolveImpossibleHouseCrowding(solution,slot,wheel){
  const shared=spec()?.comparison||{},radius=Number(shared.placementBubbleRadius)||19.7,
    gap=Math.max(6,Number(shared.placementClearance)||6),
    cusps=houseCuspAngles(wheel,slot),groups=new Map();
  if(cusps.length<4)return solution;
  const keyOf=r=>r.item.sign+':'+cusps.findLastIndex(x=>x<=r.item.exact+1e-6);
  for(const record of solution){
    record.bubbleScale=1;
    const key=keyOf(record);
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(record);
  }
  const chord=(r,a,b)=>2*r*Math.sin(Math.abs(a-b)*Math.PI/360);
  let repairs=0,minimumScale=1;
  for(const group of groups.values()){
    if(group.length<2)continue;
    group.sort((a,b)=>a.item.exact-b.item.exact||a.item.index-b.item.index);
    const lane=group[0].item.authoredLane,arc=houseArcFor(cusps,group[0].item.exact),sign=group[0].item.sign;
    if(!arc||!Number.isFinite(lane)||group.some(r=>Math.abs(r.item.authoredLane-lane)>EPS))continue;
    const lo=Math.max(sign*30+.025,arc.lower+.025),hi=Math.min(sign*30+30-.025,arc.upper-.025);
    if(lo>=hi)continue;
    const colliding=group.some((a,i)=>group.some((b,j)=>j>i&&
      chord(lane,a.display,b.display)<2*radius+gap-.05));
    if(!colliding)continue;
    // Only the actual HOUSE boundaries need the extra bubble-to-divider
    // padding. The sign edge requires glyph centers to remain inside it.
    const houseLower=arc.lower>=sign*30-.01,houseUpper=arc.upper<=sign*30+30+.01;
    const fit=scale=>{
      const r=radius*scale,sep=2*Math.asin(Math.min(.999999,(2*r+gap)/(2*lane)))*180/Math.PI+.005;
      const edge=Math.asin(Math.min(.999999,(r+gap)/(lane)))*180/Math.PI;
      const low=lo+(houseLower?edge:0),high=hi-(houseUpper?edge:0);
      return{possible:high-low>=(group.length-1)*sep-.001,low,high,sep};
    };
    if(!fit(.28).possible){wheel.dataset.placementImpossibleHouseCrowding='true';continue;}
    let lower=.28,upper=1;
    if(!fit(1).possible){
      for(let i=0;i<28;i++){const mid=(lower+upper)/2;if(fit(mid).possible)lower=mid;else upper=mid;}
    }else lower=1;
    const scale=+Math.max(.28,lower-.002).toFixed(4),cfg=fit(scale);
    // Once a HOUSE is too narrow at the authored glyph diameter, equally
    // spaced local centers are the unique safe fallback. Minimize the sum
    // of weighted squared offsets while respecting BOTH house boundaries.
    const weighted=group.reduce((a,g,i)=>({
      sum:a.sum+weight(g.item)*(g.item.exact-i*cfg.sep),
      total:a.total+weight(g.item)
    }),{sum:0,total:0});
    const first=Math.max(cfg.low,Math.min(cfg.high-(group.length-1)*cfg.sep,
      weighted.sum/weighted.total));
    const angles=group.map((_,i)=>first+i*cfg.sep);
    if(angles.some((a,i)=>a<cfg.low-.01||a>cfg.high+.01||
      !staysInActualHouse(group[i].item,a,cusps)))continue;
    for(let i=0;i<group.length;i++){
      const record=group[i],display=angles[i];
      Object.assign(record,{display,point:polar(lane,display),lane,
        offset:display-record.item.exact,bubbleScale:scale,houseCompactRepair:true});
    }
    minimumScale=Math.min(minimumScale,scale);repairs++;
  }
  wheel.dataset.placementCompactHouseRepairs=String(repairs);
  wheel.dataset.placementMinimumBubbleScale=minimumScale.toFixed(3);
  return solution;
}
function solveSlot(wheel,slot){
  const g=geometry(slot),items=ordinaryItems(wheel,slot);if(!g||!items.length)return{items:[],crossings:0,hits:0};
  const authoredLane=items.find(item=>Number.isFinite(item.authoredLane))?.authoredLane,lane=Number.isFinite(authoredLane)?authoredLane:Number(g.placement?.[0]);if(!Number.isFinite(lane))return{items:[],crossings:0,hits:0};
  const bySign=new Map();items.forEach(item=>{if(!bySign.has(item.sign))bySign.set(item.sign,[]);bySign.get(item.sign).push(item)});
  let solution=[];for(let sign=0;sign<12;sign++)solution.push(...solveSignGroup(bySign.get(sign)||[],lane));
  solution=sanitize(solution,slot,wheel);
  solution=repairBubbleClearance(solution,slot,wheel);
  solution=preferRadialLeadersAndHouseClearance(solution,slot,wheel);
  const houseCusps=houseCuspAngles(wheel,slot);
  // Absolute fail-safe: do not depict a body in the wrong house even when
  // the available arc is too narrow to satisfy every preferred gap. The
  // exact notch is truth; flag an unresolved layout instead of falsifying it.
  let houseFallbacks=0;
  wheel.dataset['placementHouseArcDebug'+slot]=JSON.stringify({
    cusps:houseCusps,
    moon:solution.filter(r=>['sun','moon','saturn'].includes(r.item.id))
      .map(r=>({id:r.item.id,exact:r.item.exact,display:r.display,
        arc:houseArcFor(houseCusps,r.item.exact),
        allowed:staysInActualHouse(r.item,r.display,houseCusps)}))
  });
  for(const record of solution)if(!staysInActualHouse(record.item,record.display,houseCusps)){
    forceExact(record,slot);houseFallbacks++;
  }
  wheel.dataset.placementHouseSectorFallbacks=String(houseFallbacks);
  solution=resolveImpossibleHouseCrowding(solution,slot,wheel);
  const bubble=Number(spec()?.comparison?.placementBubbleRadius)||19.7,
    gap=Math.max(6,Number(spec()?.comparison?.placementClearance)||6);
  let finalOverlaps=0;
  for(let i=0;i<solution.length;i++)for(let j=i+1;j<solution.length;j++){
    const first=solution[i],second=solution[j],
      centerGap=Math.hypot(first.point.x-second.point.x,first.point.y-second.point.y),
      minimum=(first.bubbleScale||1)*bubble+(second.bubbleScale||1)*bubble+gap;
    if(centerGap<minimum-.1)finalOverlaps++;
  }
  wheel.dataset['placementRemainingOverlaps'+slot]=String(finalOverlaps);
  solution.sort((a,b)=>a.item.exact-b.item.exact||a.item.index-b.item.index);
  solution.forEach((record,index)=>{
    const {item}=record,exact=record.exactPoint||exactPoint(record,slot);
    item.group.setAttribute('transform',`translate(${record.point.x} ${record.point.y}) scale(${record.bubbleScale||1})`);
    item.group.dataset.placementBubbleScale=String(record.bubbleScale||1);
    item.group.dataset.placementHouseCompactRepair=record.houseCompactRepair?'true':'false';
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
    item.group.dataset.placementHouseBoundaryClearance=record.houseBoundaryRepair?'true':'false';
    item.group.dataset.placementRadialLeaderRestored=record.radialLeaderRestored?'true':'false';
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
    c=center(),points=[],cusps=houseCuspAngles(wheel,slot),houseLines=[...wheel.querySelectorAll(
      `[data-layer="${slot==='A'?'a-houses':'b-houses'}"] line.sky-foundation-divider`)]
      .map(parseSegment).filter(Boolean);
  for(const item of items){
    const matrix=item.group.transform?.baseVal?.consolidate()?.matrix;
    if(!matrix||!Number.isFinite(matrix.e)||!Number.isFinite(matrix.f))return false;
    if(!Number.isFinite(item.authoredLane))return false;
    const point={x:matrix.e,y:matrix.f},
      scale=Math.max(.1,Math.min(1,num(item.group.dataset.placementBubbleScale)||1)),
      clearance=Math.max(6,Number(spec()?.comparison?.placementClearance)||6);
    if(!staysInActualHouse(item,num(item.group.dataset.displayLongitude),cusps))return false;
    if(houseLines.some(line=>segmentDistance(point,line.a,line.b)<
      bubble*scale+clearance-.05))return false;
    if(Math.abs(Math.hypot(point.x-c.x,point.y-c.y)-item.authoredLane)>.1)return false;
    if(points.some(other=>Math.hypot(point.x-other.point.x,point.y-other.point.y)<
      (scale+other.scale)*bubble+clearance-EPS))return false;
    points.push({point,scale});
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
    // Diagnostics must describe the final rendered (possibly locally
    // compacted) circles, not obsolete pre-repair collision candidates.
    wheel.dataset.placementUnresolvedBubbleOverlaps=String(
      Number(wheel.dataset.placementRemainingOverlapsA||0)+
      Number(wheel.dataset.placementRemainingOverlapsB||0));
    wheel.dataset.placementCircularOrder='preserved';
    wheel.dataset.crossSignDisplacement='forbidden';
    wheel.dataset.placementCollisionOrder='same-sign-fixed-circumference-v16';
    if(a.crossings+b.crossings)console.error('[Sky Chart placement layout] Crossing contract failed.',{A:a.crossings,B:b.crossings});
  }finally{arranging=false}
}
function currentWheel(){return document.querySelector('#skyFoundationWheelMount > svg.sky-foundation-wheel')}
function arrangeCurrent(){const wheel=currentWheel();if(wheel)arrange(wheel)}
function install(){
  const mount=document.getElementById('skyFoundationWheelMount');
  if(mount)new MutationObserver(records=>{
    if(arranging)return;
    const houseLayer=node=>node?.closest?.('[data-layer="a-houses"],[data-layer="b-houses"]');
    const newElement=record=>record.type==='childList'&&Array.from(record.addedNodes||[]).some(node=>node.nodeType===1);
    // Re-layout when house DIVIDER GEOMETRY updates, even when the drawing
    // renderer reuses its SVG line elements and only changes coordinates.
    // Watching placement or leader attributes here would feed our own
    // transform writes back into another collision solve.
    const needsLayout=records.some(record=>newElement(record)||
      (record.type==='attributes'&&record.target.matches?.('line.sky-foundation-divider')&&
       houseLayer(record.target)));
    if(needsLayout)requestAnimationFrame(arrangeCurrent);
  }).observe(mount,{subtree:true,childList:true,attributes:true,
    attributeFilter:['x1','y1','x2','y2']});
  arrangeCurrent();
  window.addEventListener('relphi:sky-foundation-ready',()=>requestAnimationFrame(arrangeCurrent));
}
window.RelphiPlacementCollisionOrder={arrange,arrangeCurrent};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
})();
