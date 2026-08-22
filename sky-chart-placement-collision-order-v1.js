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
  const LANES={A:[450,492,534],B:[287,245,203]};
  const BUBBLE_RADIUS=17.2;
  const CLEARANCE=6;
  const LEADER_CLEARANCE=4;
  const ORDER_EPS=1e-5;
  const PLACEMENTS='[data-layer="placements"]';
  const LEADERS='[data-layer="leaders"]';
  const PRIORITY={
    sun:0,moon:0,
    mercury:1,venus:1,mars:1,jupiter:1,saturn:1,uranus:1,neptune:1,pluto:1,
    'north-node':2,'south-node':2,chiron:2,
    lilith:3,'part-of-fortune':3,vertex:3
  };
  const WEIGHT=[12,8,4,2];
  const SEP_MULTIPLIERS=[1,1.06,1.12,1.2,1.3];
  const GLOBAL_SHIFTS=[0,.35,-.35,.7,-.7,1.4,-1.4,2.1,-2.1];
  let arranging=false;

  const num=value=>{const n=Number(value);return Number.isFinite(n)?n:NaN};
  const norm=value=>((Number(value)%360)+360)%360;
  const polar=(radius,degree)=>{const angle=(norm(degree)-180)*Math.PI/180;return{x:C.x+radius*Math.cos(angle),y:C.y+radius*Math.sin(angle)}};
  const priorityOf=id=>Object.prototype.hasOwnProperty.call(PRIORITY,id)?PRIORITY[id]:2;
  const weightOf=item=>WEIGHT[item.priority]||2;

  function ordinaryItems(wheel,slot){
    const layer=wheel.querySelector(PLACEMENTS),leaderLayer=wheel.querySelector(LEADERS);
    if(!layer||!leaderLayer)return[];
    const leaders=Array.from(leaderLayer.querySelectorAll(`line[data-sky="${slot}"][data-placement]`));
    return Array.from(layer.children).map((group,index)=>{
      if(!(group instanceof SVGGElement)||group.dataset.sky!==slot||group.dataset.angleAxis==='true')return null;
      const exact=num(group.dataset.exactLongitude);
      if(!Number.isFinite(exact))return null;
      const placement=String(group.dataset.placement||'');
      const leader=leaders.find(line=>line.dataset.placement===placement&&Math.abs(num(line.dataset.exactLongitude)-exact)<1e-6);
      if(!leader)return null;
      return{
        group,leader,index,placement,priority:priorityOf(placement),exact:norm(exact),
        authoredDisplay:norm(num(group.dataset.displayLongitude)),authoredLane:num(group.dataset.placementLane)
      };
    }).filter(Boolean);
  }

  function sortedItems(items){
    return items.slice().sort((a,b)=>a.exact-b.exact||a.priority-b.priority||a.index-b.index);
  }

  function seamCandidates(sorted){
    if(sorted.length<2)return[0];
    const gaps=sorted.map((item,index)=>{
      const next=(index+1)%sorted.length;
      const nextValue=sorted[next].exact+(next===0?360:0);
      return{seam:next,gap:nextValue-item.exact};
    });
    return gaps.sort((a,b)=>b.gap-a.gap||a.seam-b.seam).map(entry=>entry.seam);
  }

  function unwrap(sorted,seam){
    const result=[];
    let previous=-Infinity;
    for(let offset=0;offset<sorted.length;offset+=1){
      const item=sorted[(seam+offset)%sorted.length];
      let exactU=item.exact;
      while(exactU<previous-ORDER_EPS)exactU+=360;
      result.push({...item,exactU});
      previous=exactU;
    }
    return result;
  }

  // Weighted pool-adjacent-violators algorithm.  Transforming x_i to
  // x_i - i*minimumSeparation makes ordinary isotonic regression enforce the
  // required angular distance while preserving the exact circular sequence.
  function isotonic(values,weights){
    const blocks=[];
    values.forEach((value,index)=>{
      let block={start:index,end:index,weight:weights[index],sum:value*weights[index]};
      block.mean=block.sum/block.weight;
      blocks.push(block);
      while(blocks.length>1){
        const right=blocks[blocks.length-1],left=blocks[blocks.length-2];
        if(left.mean<=right.mean+ORDER_EPS)break;
        blocks.pop();blocks.pop();
        block={start:left.start,end:right.end,weight:left.weight+right.weight,sum:left.sum+right.sum};
        block.mean=block.sum/block.weight;
        blocks.push(block);
      }
    });
    const output=new Array(values.length);
    blocks.forEach(block=>{for(let index=block.start;index<=block.end;index+=1)output[index]=block.mean});
    return output;
  }

  function minimumSeparation(lane){
    const chord=2*BUBBLE_RADIUS+CLEARANCE;
    const ratio=Math.min(.999999,chord/(2*lane));
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
    return((abC>ORDER_EPS&&abD<-ORDER_EPS)||(abC<-ORDER_EPS&&abD>ORDER_EPS))&&
      ((cdA>ORDER_EPS&&cdB<-ORDER_EPS)||(cdA<-ORDER_EPS&&cdB>ORDER_EPS));
  }
  function segmentDistance(point,a,b){
    const dx=b.x-a.x,dy=b.y-a.y,length2=dx*dx+dy*dy;
    if(length2<=1e-9)return Math.hypot(point.x-a.x,point.y-a.y);
    const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/length2));
    return Math.hypot(point.x-(a.x+t*dx),point.y-(a.y+t*dy));
  }
  function exactPoint(record,slot){return polar(EXACT_RADIUS[slot],record.item.exact)}

  function crossingCount(solution,slot){
    let count=0;
    for(let left=0;left<solution.length;left+=1){
      const a=solution[left].point,b=exactPoint(solution[left],slot);
      for(let right=left+1;right<solution.length;right+=1){
        const c=solution[right].point,d=exactPoint(solution[right],slot);
        if(properIntersection(a,b,c,d))count+=1;
      }
    }
    return count;
  }

  function bubbleCollisionCount(solution){
    let count=0;
    const needed=2*BUBBLE_RADIUS+CLEARANCE;
    for(let left=0;left<solution.length;left+=1)for(let right=left+1;right<solution.length;right+=1){
      if(Math.hypot(solution[left].point.x-solution[right].point.x,solution[left].point.y-solution[right].point.y)<needed-ORDER_EPS)count+=1;
    }
    return count;
  }

  function leaderGlyphHits(solution,slot){
    let hits=0;
    for(let index=0;index<solution.length;index+=1){
      const lineStart=solution[index].point,lineEnd=exactPoint(solution[index],slot);
      for(let other=0;other<solution.length;other+=1){
        if(index===other)continue;
        if(segmentDistance(solution[other].point,lineStart,lineEnd)<BUBBLE_RADIUS+LEADER_CLEARANCE)hits+=1;
      }
    }
    return hits;
  }

  function circularOrderValid(solution,separation){
    if(solution.length<2)return true;
    for(let index=1;index<solution.length;index+=1){
      if(solution[index].displayU-solution[index-1].displayU<separation-ORDER_EPS)return false;
    }
    return solution[solution.length-1].displayU-solution[0].displayU<=360-separation+ORDER_EPS;
  }

  function displacementCost(solution){
    let weighted=0,max=0;
    solution.forEach(record=>{
      const amount=Math.abs(record.offset),weight=weightOf(record.item);
      weighted+=amount*amount*weight;
      max=Math.max(max,amount);
    });
    return{weighted,max};
  }

  function evaluate(solution,slot,laneIndex,separationMultiplier,shift){
    const crossings=crossingCount(solution,slot);
    if(crossings!==0)return null;
    const separation=minimumSeparation(solution[0]?.lane||LANES[slot][0])*separationMultiplier;
    if(!circularOrderValid(solution,separation))return null;
    const bubbles=bubbleCollisionCount(solution),hits=leaderGlyphHits(solution,slot),move=displacementCost(solution);
    return{solution,crossings,bubbles,hits,weighted:move.weighted,max:move.max,laneIndex,separationMultiplier,shift};
  }

  function compareCandidate(a,b){
    const av=[a.bubbles,a.hits,a.weighted,a.max,a.laneIndex,Math.abs(a.shift),a.separationMultiplier];
    const bv=[b.bubbles,b.hits,b.weighted,b.max,b.laneIndex,Math.abs(b.shift),b.separationMultiplier];
    for(let index=0;index<av.length;index+=1){const delta=av[index]-bv[index];if(Math.abs(delta)>1e-9)return delta}
    return 0;
  }

  function bestSolution(slot,items){
    if(!items.length)return{solution:[],fallback:false,bubbles:0,hits:0};
    const sorted=sortedItems(items),candidates=[];
    const seams=seamCandidates(sorted);
    for(const seam of seams){
      const ordered=unwrap(sorted,seam);
      for(let laneIndex=0;laneIndex<LANES[slot].length;laneIndex+=1){
        const lane=LANES[slot][laneIndex],baseSeparation=minimumSeparation(lane);
        for(const multiplier of SEP_MULTIPLIERS){
          const separation=baseSeparation*multiplier;
          if(separation*ordered.length>=360-ORDER_EPS)continue;
          for(const shift of GLOBAL_SHIFTS){
            const solution=solveSequence(ordered,lane,separation,shift);
            const candidate=evaluate(solution,slot,laneIndex,multiplier,shift);
            if(candidate)candidates.push(candidate);
          }
        }
      }
    }
    if(candidates.length){
      candidates.sort(compareCandidate);
      const best=candidates[0];
      return{...best,fallback:best.bubbles>0||best.hits>0};
    }

    // Absolute fallback: exact-longitude radial leaders.  Glyphs may overlap in an
    // impossible cluster, but exact order is preserved and leader crossings remain zero.
    const ordered=unwrap(sorted,seams[0]||0),lane=LANES[slot][0];
    const solution=ordered.map(item=>({item,lane,displayU:item.exactU,display:item.exact,point:polar(lane,item.exact),offset:0}));
    return{solution,fallback:true,bubbles:bubbleCollisionCount(solution),hits:leaderGlyphHits(solution,slot),crossings:0,laneIndex:0};
  }

  function setLeader(record,slot){
    const exact=polar(EXACT_RADIUS[slot],record.item.exact),line=record.item.leader;
    line.setAttribute('x1',record.point.x.toFixed(2));line.setAttribute('y1',record.point.y.toFixed(2));
    line.setAttribute('x2',exact.x.toFixed(2));line.setAttribute('y2',exact.y.toFixed(2));
    line.dataset.displayLongitude=record.display.toFixed(8);
    line.dataset.leaderRouting='ordered-zero-cross';
  }

  function apply(slot,items){
    const result=bestSolution(slot,items);
    result.solution.forEach((record,index)=>{
      const item=record.item;
      item.group.setAttribute('transform',`translate(${record.point.x} ${record.point.y})`);
      item.group.dataset.displayLongitude=record.display.toFixed(8);
      item.group.dataset.placementLane=String(record.lane);
      item.group.dataset.placementPriority=String(item.priority);
      item.group.dataset.placementCircularOrder=String(index);
      item.group.dataset.placementOrderCorrected=Math.abs(record.offset)>1e-6||record.lane!==item.authoredLane?'true':'false';
      item.group.dataset.placementOrderFallback=result.fallback?'true':'false';
      item.group.dataset.placementTangentialOffset=record.offset.toFixed(3);
      setLeader(record,slot);
    });
    return result;
  }

  function endpoint(line,suffix){return{x:num(line.getAttribute(`x${suffix}`)),y:num(line.getAttribute(`y${suffix}`))}}
  function actualCrossingCount(items){
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

  function forceRadial(slot,items){
    const lane=LANES[slot][0];
    sortedItems(items).forEach((item,index)=>{
      const point=polar(lane,item.exact),record={item,lane,display:item.exact,displayU:item.exact,point,offset:0};
      item.group.setAttribute('transform',`translate(${point.x} ${point.y})`);
      item.group.dataset.displayLongitude=item.exact.toFixed(8);
      item.group.dataset.placementLane=String(lane);
      item.group.dataset.placementCircularOrder=String(index);
      item.group.dataset.placementOrderFallback='true';
      item.group.dataset.placementTangentialOffset='0.000';
      setLeader(record,slot);
    });
  }

  function arrange(wheel){
    if(!(wheel instanceof SVGSVGElement)||arranging)return;
    arranging=true;
    try{
      let bubbleFallbacks=0,leaderHits=0;
      for(const slot of ['A','B']){
        const items=ordinaryItems(wheel,slot),result=apply(slot,items);
        bubbleFallbacks+=result.bubbles||0;leaderHits+=result.hits||0;
        if(actualCrossingCount(items)!==0)forceRadial(slot,items);
      }
      const all=[...ordinaryItems(wheel,'A'),...ordinaryItems(wheel,'B')];
      const crossings=actualCrossingCount(ordinaryItems(wheel,'A'))+actualCrossingCount(ordinaryItems(wheel,'B'));
      wheel.dataset.placementLeaderCrossings=String(crossings);
      wheel.dataset.placementCircularOrder='preserved';
      wheel.dataset.placementLeaderGlyphHits=String(leaderHits);
      wheel.dataset.placementCollisionFallbacks=String(bubbleFallbacks);
      wheel.dataset.placementCollisionOrder='cluster-isotonic-v4';
      if(crossings!==0){
        console.error('[Sky Chart placement layout] Zero-cross contract failed after radial fallback.',{crossings,count:all.length});
      }
    }finally{arranging=false}
  }

  function currentWheel(){return document.querySelector('#skyFoundationWheelMount > svg.sky-foundation-wheel')}
  function arrangeCurrent(){const wheel=currentWheel();if(wheel)arrange(wheel)}

  function install(){
    const mount=document.getElementById('skyFoundationWheelMount');
    if(mount)new MutationObserver(records=>{
      if(arranging)return;
      if(records.some(record=>Array.from(record.addedNodes||[]).some(node=>node instanceof SVGSVGElement&&node.classList.contains('sky-foundation-wheel'))))arrangeCurrent();
    }).observe(mount,{childList:true});
    arrangeCurrent();
    window.addEventListener('relphi:sky-foundation-ready',arrangeCurrent);
  }

  window.RelphiPlacementCollisionOrder={arrange,arrangeCurrent};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
