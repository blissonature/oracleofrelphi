(function(){
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const COLORS=['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
  const SIGNS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  const SIGN_NAMES=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const DEFAULT_COLORS={A:'#c9211e',B:'#2462d0'};
  const C={x:600,y:600};
  const R={bIn:165,bOut:330,bDegree:330,zIn:330,zOut:420,aDegree:420,aIn:420,aOut:575};
  const DEGREE_TICK={one:5,five:8,ten:12,maximum:12};
  const PLACEMENT={size:16,footprintRadius:19,notchGap:4,laneStep:38,minimumCenterDistance:38,minimumLeaderSeparation:1.35,maximumDefaultDisplacement:12,maximumGlobalPasses:12};
  const outerDefaultLane=R.aDegree+DEGREE_TICK.maximum+PLACEMENT.footprintRadius+PLACEMENT.notchGap;
  const innerDefaultLane=R.bDegree-DEGREE_TICK.maximum-PLACEMENT.footprintRadius-PLACEMENT.notchGap;
  const SKY_LAYOUT={
    A:{degreeRadius:R.aDegree,defaultLane:outerDefaultLane,lanes:[outerDefaultLane,outerDefaultLane+PLACEMENT.laneStep,outerDefaultLane+PLACEMENT.laneStep*2]},
    B:{degreeRadius:R.bDegree,defaultLane:innerDefaultLane,lanes:[innerDefaultLane,innerDefaultLane-PLACEMENT.laneStep,innerDefaultLane-PLACEMENT.laneStep*2]}
  };
  let documentData=normalizeDocument(window.SkyChartNextInitialDocument);

  Object.values(SKY_LAYOUT).forEach(layout=>{
    const required=DEGREE_TICK.maximum+PLACEMENT.footprintRadius+PLACEMENT.notchGap;
    layout.lanes.forEach(lane=>{if(Math.abs(lane-layout.degreeRadius)<required)throw new Error('Placement lane violates degree-notch clearance.');});
  });

  const svgEl=name=>document.createElementNS(NS,name);
  const norm=n=>((Number(n)%360)+360)%360;
  const mean=values=>values.reduce((sum,value)=>sum+value,0)/(values.length||1);
  const clone=value=>JSON.parse(JSON.stringify(value));

  function normalizeSky(raw,slot){
    if(!raw)return null;
    const placements=Array.isArray(raw.placements)?raw.placements.map((item,index)=>{
      const value=Array.isArray(item)?{id:item[0],longitude:item[1]}:item||{};
      return{id:String(value.id||value.bodyId||`point-${index}`),longitude:norm(value.longitude),retrograde:!!value.retrograde,label:value.label||''};
    }).filter(item=>Number.isFinite(item.longitude)):[];
    if(!placements.length)return null;
    const frames={};
    Object.entries(raw.houseFrames||{}).forEach(([key,frame])=>{
      if(frame&&Array.isArray(frame.cusps)&&frame.cusps.length===12)frames[key]={system:frame.system||key,cusps:frame.cusps.map(norm)};
    });
    return{
      id:String(raw.id||`working-${slot}`),slot,name:String(raw.name||`Sky ${slot}`),color:raw.color||DEFAULT_COLORS[slot],
      metadata:raw.metadata&&typeof raw.metadata==='object'?clone(raw.metadata):{},placements,houseFrames:frames
    };
  }

  function normalizeDocument(raw){
    const source=raw&&typeof raw==='object'?raw:{};
    const A=normalizeSky(source.skies?.A||source.skyA,'A');
    const B=normalizeSky(source.skies?.B||source.skyB,'B');
    if(!A)throw new Error('Sky Chart requires a populated Sky A.');
    return{schemaVersion:Number(source.schemaVersion)||1,mode:B?'compare':'single',skies:{A,B},display:{houseSystem:String(source.display?.houseSystem||'whole-sign')}};
  }

  function polar(r,deg){const a=(deg-180)*Math.PI/180;return{x:C.x+r*Math.cos(a),y:C.y+r*Math.sin(a)};}
  function annularPath(r0,r1,start,end){
    const span=norm(end-start)||360,large=span>180?1:0;
    const p1=polar(r1,start),p2=polar(r1,start+span),p3=polar(r0,start+span),p4=polar(r0,start);
    return`M${p1.x} ${p1.y} A${r1} ${r1} 0 ${large} 1 ${p2.x} ${p2.y} L${p3.x} ${p3.y} A${r0} ${r0} 0 ${large} 0 ${p4.x} ${p4.y} Z`;
  }
  function line(parent,r0,r1,deg,className,color){
    const p1=polar(r0,deg),p2=polar(r1,deg),el=svgEl('line');
    el.setAttribute('x1',p1.x);el.setAttribute('y1',p1.y);el.setAttribute('x2',p2.x);el.setAttribute('y2',p2.y);el.setAttribute('class',className||'');
    if(color)el.setAttribute('stroke',color);parent.appendChild(el);return el;
  }
  function text(parent,r,deg,value,className){
    const p=polar(r,deg),el=svgEl('text');el.setAttribute('x',p.x);el.setAttribute('y',p.y);el.setAttribute('class',className||'');el.textContent=value;parent.appendChild(el);return el;
  }

  function selectedFrame(sky,system){
    if(!sky)return null;
    const frame=sky.houseFrames[system]||sky.houseFrames['whole-sign']||Object.values(sky.houseFrames)[0];
    if(!frame)throw new Error(`${sky.name} has no house frame for ${system}.`);
    return frame;
  }
  function houseFor(longitude,cusps){
    for(let i=0;i<12;i++){
      const start=cusps[i],span=norm(cusps[(i+1)%12]-start),delta=norm(longitude-start);
      if(delta<span||Math.abs(delta-span)<1e-6)return i+1;
    }
    return 12;
  }

  function pointDistance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
  function placementPoint(item){return polar(item.lane,item.displayLongitude);}
  function placementsCollide(a,b){return pointDistance(placementPoint(a),placementPoint(b))<PLACEMENT.minimumCenterDistance-.01;}
  function collisionPairs(items){const pairs=[];for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++)if(placementsCollide(items[i],items[j]))pairs.push([i,j]);return pairs;}
  function connectedComponents(count,pairs){
    const parent=Array.from({length:count},(_,i)=>i),find=value=>{let root=value;while(parent[root]!==root)root=parent[root];while(parent[value]!==value){const next=parent[value];parent[value]=root;value=next;}return root;};
    pairs.forEach(([a,b])=>{const ra=find(a),rb=find(b);if(ra!==rb)parent[rb]=ra;});
    const byRoot=new Map();for(let i=0;i<count;i++){const root=find(i);if(!byRoot.has(root))byRoot.set(root,[]);byRoot.get(root).push(i);}return Array.from(byRoot.values());
  }
  function requiredAngularSeparation(r1,r2){
    if(Math.abs(r1-r2)>=PLACEMENT.minimumCenterDistance)return PLACEMENT.minimumLeaderSeparation;
    const cosine=Math.max(-1,Math.min(1,(r1*r1+r2*r2-PLACEMENT.minimumCenterDistance*PLACEMENT.minimumCenterDistance)/(2*r1*r2)));
    return Math.max(PLACEMENT.minimumLeaderSeparation,Math.acos(cosine)*180/Math.PI);
  }
  function unwrapGroup(items,indices){
    const sorted=indices.slice().sort((a,b)=>Math.abs(items[a].longitude-items[b].longitude)>1e-8?items[a].longitude-items[b].longitude:a-b);
    if(sorted.length<2)return{order:sorted,truths:sorted.map(index=>items[index].longitude)};
    let largestGap=-1,startAt=0;for(let i=0;i<sorted.length;i++){const current=items[sorted[i]].longitude,next=items[sorted[(i+1)%sorted.length]].longitude+(i===sorted.length-1?360:0),gap=next-current;if(gap>largestGap){largestGap=gap;startAt=(i+1)%sorted.length;}}
    const order=[];for(let offset=0;offset<sorted.length;offset++)order.push(sorted[(startAt+offset)%sorted.length]);
    const truths=[];order.forEach((index,i)=>{let value=items[index].longitude;if(i)while(value<truths[i-1]-1e-8)value+=360;truths.push(value);});return{order,truths};
  }
  function packedAngles(truths,lanes){
    const result=[];for(let j=0;j<truths.length;j++){let value=truths[j];for(let i=0;i<j;i++)value=Math.max(value,result[i]+requiredAngularSeparation(lanes[i],lanes[j]));result.push(value);}const shift=mean(truths.map((truth,index)=>truth-result[index]));return result.map(value=>value+shift);
  }
  function orientation(a,b,c){return(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);}
  function segmentsCross(a,b,c,d){const abC=orientation(a,b,c),abD=orientation(a,b,d),cdA=orientation(c,d,a),cdB=orientation(c,d,b);return abC*abD<-1e-7&&cdA*cdB<-1e-7;}
  function leaderCrossings(items,order,angles,lanes,degreeRadius){
    let crossings=0;for(let i=0;i<order.length;i++){const startA=polar(lanes[i],angles[i]),endA=polar(degreeRadius,items[order[i]].longitude);for(let j=i+1;j<order.length;j++){const startB=polar(lanes[j],angles[j]),endB=polar(degreeRadius,items[order[j]].longitude);if(segmentsCross(startA,endA,startB,endB))crossings++;}}return crossings;
  }
  function lanePatterns(length,availableLanes){const patterns=[Array(length).fill(availableLanes[0])];for(let laneCount=2;laneCount<=availableLanes.length;laneCount++)for(let offset=0;offset<laneCount;offset++)patterns.push(Array.from({length},(_,index)=>availableLanes[(index+offset)%laneCount]));return patterns;}
  function candidateFor(items,order,truths,lanes,layout){
    const angles=packedAngles(truths,lanes),displacements=angles.map((angle,index)=>Math.abs(angle-truths[index])),radialMoves=lanes.filter(lane=>lane!==layout.defaultLane).length,radialDistance=lanes.reduce((sum,lane)=>sum+Math.abs(lane-layout.defaultLane),0),crossings=leaderCrossings(items,order,angles,lanes,layout.degreeRadius);
    return{angles,lanes,displacements,crossings,score:crossings*10000+Math.max(...displacements,0)*12+displacements.reduce((sum,value)=>sum+value,0)*2+radialMoves*24+radialDistance*.35};
  }
  function solveGroup(items,indices,layout){
    if(indices.length<2)return;const{order,truths}=unwrapGroup(items,indices),candidates=lanePatterns(order.length,layout.lanes).map(pattern=>candidateFor(items,order,truths,pattern,layout)),fallback=candidates[0],chosen=fallback.crossings===0&&Math.max(...fallback.displacements,0)<=PLACEMENT.maximumDefaultDisplacement?fallback:candidates.reduce((best,candidate)=>candidate.score<best.score?candidate:best,candidates[0]);
    order.forEach((itemIndex,index)=>{items[itemIndex].lane=chosen.lanes[index];items[itemIndex].displayLongitude=norm(chosen.angles[index]);});
  }
  function mergeGroups(groups,pairs,itemCount){
    const itemToGroup=Array(itemCount);groups.forEach((group,groupIndex)=>group.forEach(itemIndex=>{itemToGroup[itemIndex]=groupIndex;}));
    return connectedComponents(groups.length,pairs.map(([a,b])=>[itemToGroup[a],itemToGroup[b]])).map(component=>component.flatMap(groupIndex=>groups[groupIndex]).sort((a,b)=>a-b));
  }
  function layoutPlacements(sky,cusps,skyId){
    if(!sky)return[];const layout=SKY_LAYOUT[skyId],items=sky.placements.map((placement,index)=>({...placement,longitude:norm(placement.longitude),displayLongitude:norm(placement.longitude),lane:layout.defaultLane,house:houseFor(placement.longitude,cusps),sourceIndex:index}));
    let pairs=collisionPairs(items),groups=connectedComponents(items.length,pairs);groups.forEach(group=>solveGroup(items,group,layout));
    for(let pass=0;pass<PLACEMENT.maximumGlobalPasses;pass++){pairs=collisionPairs(items);if(!pairs.length)break;groups=mergeGroups(groups,pairs,items.length);groups.forEach(group=>solveGroup(items,group,layout));}return items;
  }

  function drawHouseRing(group,sky,cusps,skyId){
    if(!sky||!cusps)return;const inner=skyId==='A'?R.aIn:R.bIn,outer=skyId==='A'?R.aOut:R.bOut;
    cusps.forEach((start,i)=>{const end=cusps[(i+1)%12],path=svgEl('path');path.setAttribute('d',annularPath(inner,outer,start,end));path.setAttribute('fill',COLORS[i]);path.setAttribute('fill-opacity','.5');path.dataset.interactive='house';path.dataset.sky=skyId;path.dataset.house=String(i+1);group.appendChild(path);line(group,inner,outer,end,'house-divider',sky.color);text(group,(inner+outer)/2,start+norm(end-start)/2,String(i+1),'house-number');});
  }

  function updateShell(){
    const A=documentData.skies.A,B=documentData.skies.B;
    const update=(slot,sky)=>{const card=document.querySelector(`.scn-sky-${slot.toLowerCase()}-card`);if(!card)return;card.hidden=!sky;if(!sky)return;card.querySelector('.scn-card-heading strong').textContent=sky.name;const copy=card.querySelector('.scn-card-heading + p'),meta=sky.metadata||{};copy.innerHTML=[meta.dateLabel,meta.locationLabel].filter(Boolean).join('<br>')||'Placement data supplied';};
    update('A',A);update('B',B);
    const select=document.getElementById('houseSystem');if(select&&select.value!==documentData.display.houseSystem)select.value=documentData.display.houseSystem;
  }

  async function render(){
    const status=document.getElementById('wheelStatus');status.hidden=false;status.textContent='Resolving canonical masters…';
    const system=document.getElementById('houseSystem')?.value||documentData.display.houseSystem;documentData.display.houseSystem=system;
    const A=documentData.skies.A,B=documentData.skies.B,frameA=selectedFrame(A,system),frameB=B?selectedFrame(B,system):null,cuspA=frameA.cusps,cuspB=frameB?.cusps||null;
    updateShell();
    const svg=svgEl('svg');svg.setAttribute('viewBox','0 0 1200 1200');svg.setAttribute('class','scn-wheel');svg.setAttribute('role','img');svg.setAttribute('aria-label',B?'Two-sky rainbow house comparison wheel':'Single-sky rainbow house wheel');
    const title=svgEl('title');title.textContent=B?'Sky Chart comparison wheel':'Sky Chart wheel';svg.appendChild(title);
    const bg=svgEl('circle');bg.setAttribute('cx',C.x);bg.setAttribute('cy',C.y);bg.setAttribute('r',R.aOut+8);bg.setAttribute('fill','#fffdf8');bg.setAttribute('stroke','rgba(23,23,23,.12)');bg.dataset.clearFocus='true';svg.appendChild(bg);
    const groups={};['bHouses','zodiac','aHouses','leaders','ticks','outlines','glyphs'].forEach(key=>{groups[key]=svgEl('g');groups[key].dataset.layer=key;svg.appendChild(groups[key]);});
    drawHouseRing(groups.bHouses,B,cuspB,'B');drawHouseRing(groups.aHouses,A,cuspA,'A');
    const glyphJobs=[];
    for(let i=0;i<12;i++){const start=i*30,path=svgEl('path');path.setAttribute('d',annularPath(R.zIn,R.zOut,start,start+30));path.setAttribute('fill',COLORS[i]);path.setAttribute('fill-opacity','.78');path.dataset.interactive='sign';path.dataset.sign=SIGNS[i];groups.zodiac.appendChild(path);line(groups.zodiac,R.zIn,R.zOut,start,'zodiac-cusp');const point=polar((R.zIn+R.zOut)/2,start+15),glyphGroup=svgEl('g');glyphGroup.setAttribute('transform',`translate(${point.x} ${point.y})`);groups.zodiac.appendChild(glyphGroup);glyphJobs.push(window.SkyChartNextGlyphs.uncircled(glyphGroup,SIGNS[i],{size:19,color:'#171717'}));}
    [R.bIn,R.zIn,R.zOut,R.aOut].forEach(radius=>{const circle=svgEl('circle');circle.setAttribute('cx',C.x);circle.setAttribute('cy',C.y);circle.setAttribute('r',radius);circle.setAttribute('class','ring-outline');groups.outlines.appendChild(circle);});
    for(let degree=0;degree<360;degree++){let halfLength=DEGREE_TICK.one,tickClass='degree-tick degree-tick-one';if(degree%10===0){halfLength=DEGREE_TICK.ten;tickClass='degree-tick degree-tick-ten';}else if(degree%5===0){halfLength=DEGREE_TICK.five;tickClass='degree-tick degree-tick-five';}if(B)line(groups.ticks,R.bDegree-halfLength,R.bDegree+halfLength,degree,tickClass);line(groups.ticks,R.aDegree-halfLength,R.aDegree+halfLength,degree,tickClass);}
    const laidOut={A:layoutPlacements(A,cuspA,'A'),B:layoutPlacements(B,cuspB,'B')};
    async function drawPlacement(item,skyId){const sky=documentData.skies[skyId],degreeRadius=SKY_LAYOUT[skyId].degreeRadius,exactPoint=polar(degreeRadius,item.longitude),displayPoint=polar(item.lane,item.displayLongitude),leader=svgEl('line');leader.setAttribute('x1',displayPoint.x);leader.setAttribute('y1',displayPoint.y);leader.setAttribute('x2',exactPoint.x);leader.setAttribute('y2',exactPoint.y);leader.setAttribute('stroke',sky.color);leader.setAttribute('class','placement-leader');groups.leaders.appendChild(leader);const glyphGroup=svgEl('g');glyphGroup.setAttribute('transform',`translate(${displayPoint.x} ${displayPoint.y})`);glyphGroup.dataset.interactive='placement';glyphGroup.dataset.sky=skyId;glyphGroup.dataset.placement=item.id;glyphGroup.dataset.house=String(item.house);glyphGroup.dataset.longitude=String(item.longitude);glyphGroup.dataset.displayLongitude=String(item.displayLongitude);glyphGroup.dataset.lane=String(item.lane);if(item.retrograde)glyphGroup.dataset.retrograde='true';groups.glyphs.appendChild(glyphGroup);await window.SkyChartNextGlyphs.inscribed(glyphGroup,item.id,{size:PLACEMENT.size,color:sky.color});}
    laidOut.A.forEach(item=>glyphJobs.push(drawPlacement(item,'A')));laidOut.B.forEach(item=>glyphJobs.push(drawPlacement(item,'B')));await Promise.all(glyphJobs);
    document.getElementById('wheelMount').replaceChildren(svg);status.hidden=true;renderLedgers(cuspA,cuspB);
    window.dispatchEvent(new CustomEvent('sky-chart-next:rendered',{detail:{document:getDocument()}}));
  }

  function renderLedgers(cuspA,cuspB){
    function ledger(id,sky,cusps){const mount=document.getElementById(id);if(!mount)return;mount.replaceChildren();if(!sky||!cusps)return;sky.placements.forEach(placement=>{const glyph=placement.id,long=placement.longitude,row=document.createElement('div');row.className='scn-ledger-row';const stage=document.createElement('span');stage.className='scn-ledger-glyph';const svg=svgEl('svg');svg.setAttribute('viewBox','-16 -16 32 32');stage.appendChild(svg);window.SkyChartNextGlyphs.uncircled(svg,glyph,{size:11,color:sky.color});const sign=Math.floor(long/30),degree=long-sign*30,label=document.createElement('span'),entry=window.SkyChartNextGlyphs.entries[glyph];label.textContent=`${entry?entry[0]:placement.label||glyph} in ${SIGN_NAMES[sign]} ${Math.floor(degree)}°${placement.retrograde?' ℞':''}`;const house=document.createElement('strong');house.textContent=`H${houseFor(long,cusps)}`;row.append(stage,label,house);mount.appendChild(row);});}
    ledger('skyALedger',documentData.skies.A,cuspA);ledger('skyBLedger',documentData.skies.B,cuspB);
  }

  function getDocument(){return clone(documentData);}
  function setDocument(next){documentData=normalizeDocument(next);return render().then(getDocument);}
  window.SkyChartNextRenderer={getDocument,setDocument,render:()=>render()};

  document.getElementById('houseSystem')?.addEventListener('change',()=>render().catch(showError));
  document.getElementById('resetSelection')?.addEventListener('click',()=>render().catch(showError));
  function showError(error){console.error(error);const status=document.getElementById('wheelStatus');status.hidden=false;status.textContent='The canonical chart could not be completed: '+error.message;}
  render().catch(showError);
})();