// True single-sky mode v2: final geometry is resolved before the wheel is mounted.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkySingleSkyModeV2)return;
window.__relphiSkySingleSkyModeV2=true;

const NS='http://www.w3.org/2000/svg';
const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const SIGNS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
const SIGN_NAMES=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const ORDER=['sun','moon','asc','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','north-node','south-node','chiron','lilith','part-of-fortune','vertex','mc','ic','dsc'];
const ANGLE_IDS=new Set(['asc','dsc','mc','ic']);
const ALIASES={rising:'asc',ascendant:'asc',asc:'asc',ac:'asc',descendant:'dsc',dsc:'dsc',dc:'dsc',midheaven:'mc','medium coeli':'mc',mc:'mc','imum coeli':'ic',imumcoeli:'ic',ic:'ic',vertex:'vertex',vx:'vertex','north node':'north-node',node:'north-node','true node':'north-node','mean node':'north-node','south node':'south-node',chiron:'chiron',lilith:'lilith','black moon lilith':'lilith',fortune:'part-of-fortune','part of fortune':'part-of-fortune',pof:'part-of-fortune'};
const cache=new Map();
let queued=false,token=0,preparedState=null;
const norm=v=>((Number(v)%360)+360)%360;
const separation=(a,b)=>Math.abs(((a-b+180)%360+360)%360-180);
function svg(name,attrs){const n=document.createElementNS(NS,name);Object.entries(attrs||{}).forEach(([k,v])=>n.setAttribute(k,String(v)));return n}
function point(center,radius,degree){const a=(norm(degree)-180)*Math.PI/180;return{x:center.x+radius*Math.cos(a),y:center.y+radius*Math.sin(a)}}
function annular(center,inner,outer,start,end){const span=norm(end-start)||360,large=span>180?1:0,a=point(center,outer,start),b=point(center,outer,start+span),c=point(center,inner,start+span),d=point(center,inner,start);return`M${a.x} ${a.y} A${outer} ${outer} 0 ${large} 1 ${b.x} ${b.y} L${c.x} ${c.y} A${inner} ${inner} 0 ${large} 0 ${d.x} ${d.y} Z`}
function radial(parent,center,inner,outer,degree,attrs){const a=point(center,inner,degree),b=point(center,outer,degree);parent.appendChild(svg('line',Object.assign({x1:a.x,y1:a.y,x2:b.x,y2:b.y},attrs||{})))}
function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
function source(value){if(!value||typeof value!=='object')return[];const known=[value.placements,value.positions,value.points,value.bodies].find(x=>x&&typeof x==='object'),raw=known||value;if(Array.isArray(raw))return raw.map((x,i)=>[String(x?.name||x?.label||x?.id||i),x]);return Object.entries(raw).filter(([k,x])=>x&&typeof x==='object'&&!Array.isArray(x)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(k)&&(Number.isFinite(Number(x.longitude))||x.sign||x.zodiac))}
function hasSky(slot){return source(read(slot)).length>0}
function longitude(item){if(Number.isFinite(Number(item?.longitude)))return norm(item.longitude);const s=SIGNS.indexOf(String(item?.sign||item?.zodiac||'').trim().toLowerCase());return s<0?NaN:norm(s*30+Number(item?.degree||item?.degrees||0)+Number(item?.minute||item?.minutes||0)/60+Number(item?.second||item?.seconds||0)/3600)}
function canonical(key,item){const registry=window.RelphiGlyphRegistry;if(!registry)return null;for(const candidate of [item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key]){if(candidate==null)continue;const raw=String(candidate).trim(),id=ALIASES[raw.toLowerCase()]||raw,e=registry.resolve?.(id)||registry.get?.(id);if(e)return e}return null}
function profile(v){return v?.calcProfile&&typeof v.calcProfile==='object'?v.calcProfile:{}}
function ascendant(v,list){const found=list.find(x=>x.id==='asc');if(found)return found.value;const raw=Number(profile(v).ascendant??v?.ascendant??v?.asc);return Number.isFinite(raw)?norm(raw):0}
function cusps(v,list){const p=profile(v);for(const raw of [p.houseCusps,p.cusps,v?.houseCusps,v?.cusps,v?.houses]){if(!raw)continue;const values=(Array.isArray(raw)?raw:Object.values(raw)).map(x=>typeof x==='object'?Number(x.longitude??x.value??x.cusp):Number(x)).slice(0,12);if(values.length===12&&values.every(Number.isFinite))return values.map(norm)}const asc=ascendant(v,list),system=String(p.houseSystem||v?.houseSystem||'whole-sign').toLowerCase(),start=system.includes('whole')?Math.floor(asc/30)*30:asc;return Array.from({length:12},(_,i)=>norm(start+i*30))}
function houseFor(value,houseCusps){for(let i=0;i<12;i++){const start=houseCusps[i],span=norm(houseCusps[(i+1)%12]-start)||30;if(norm(value-start)<span)return i+1}return 12}
function records(v){const seen=new Set(),list=source(v).map(([key,item])=>{const entry=canonical(key,item),value=longitude(item);if(!entry||!Number.isFinite(value)||seen.has(entry.id))return null;seen.add(entry.id);return{key,item,entry,id:entry.id,value,sky:'A'}}).filter(Boolean);const houseCusps=cusps(v,list);list.forEach(x=>{x.sign=Math.floor(x.value/30);x.house=houseFor(x.value,houseCusps)});list.sort((a,b)=>(ORDER.indexOf(a.id)<0?999:ORDER.indexOf(a.id))-(ORDER.indexOf(b.id)<0?999:ORDER.indexOf(b.id))||a.value-b.value);return{list,houseCusps}}
function coordinate(r){const i=r.item||{},s=SIGNS.indexOf(String(i.sign||i.zodiac||'').trim().toLowerCase()),d=Number(i.degree??i.degrees),m=Number(i.minute??i.minutes);if(s>=0&&Number.isFinite(d)&&Number.isFinite(m))return{sign:s,text:`${Math.trunc(d)}°${String(Math.trunc(m)).padStart(2,'0')}′`};const sign=Math.floor(r.value/30),within=r.value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60+1e-9);return{sign,text:`${degree}°${String(minute).padStart(2,'0')}′`}}
function cloneGlyph(id,color,radius,circled,fill='#fffdf8',strokeWidth=1.8){const key=[id,color,radius,circled?'c':'p',fill,strokeWidth].join('|');if(cache.has(key))return cache.get(key).then(x=>x.cloneNode(true));const task=(async()=>{const host=svg('g'),component=window.RelphiGlyphComponent,entry=window.RelphiGlyphMasterSource?.resolve?.(id);if(!entry||!component?.createBubble)throw new Error('Canonical Master Glyph List entry unavailable: '+id);const bubble=component.createBubble(host,entry.id,{radius,padding:1,color,fill,strokeWidth});if(!circled){bubble.circle.style.opacity='0';bubble.circle.setAttribute('aria-hidden','true')}await bubble.ready;if(!host.querySelector('.relphi-canonical-glyph'))throw new Error('Canonical Master Glyph List renderer produced no artwork for '+entry.name);return host})();cache.set(key,task);return task.then(x=>x.cloneNode(true))}
function circleClearance(candidate,other,gap){return Math.hypot(candidate.x-other.x,candidate.y-other.y)-(candidate.r+other.r+gap)}
function squareCircleHit(square,circle,gap){const dx=Math.max(Math.abs(circle.x-square.x)-square.half,0),dy=Math.max(Math.abs(circle.y-square.y)-square.half,0);return Math.hypot(dx,dy)<circle.r+gap}
function squareSquareHit(a,b,gap){return Math.abs(a.x-b.x)<a.half+b.half+gap&&Math.abs(a.y-b.y)<a.half+b.half+gap}
function obstacleHit(candidate,other,gap){
  if(candidate.kind==='square'&&other.kind==='square')return squareSquareHit(candidate,other,gap);
  if(candidate.kind==='square')return squareCircleHit(candidate,other,gap);
  if(other.kind==='square')return squareCircleHit(other,candidate,gap);
  return circleClearance(candidate,other,gap)<0;
}
function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy;if(l2<=1e-9)return Math.hypot(p.x-a.x,p.y-a.y);const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l2));return Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy))}
function obstacleRadius(obstacle){return obstacle.kind==='square'?obstacle.half*Math.SQRT2:obstacle.r}
function segmentHitsObstacle(segment,obstacle,gap){return segmentDistance(obstacle,{x:segment.x1,y:segment.y1},{x:segment.x2,y:segment.y2})<obstacleRadius(obstacle)+gap}
function orientation(a,b,c){return(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)}
function closePoint(a,b,epsilon=1.25){return Math.hypot(a.x-b.x,a.y-b.y)<=epsilon}
function segmentsCross(a,b){
  const a1={x:a.x1,y:a.y1},a2={x:a.x2,y:a.y2},b1={x:b.x1,y:b.y1},b2={x:b.x2,y:b.y2};
  if(closePoint(a1,b1)||closePoint(a1,b2)||closePoint(a2,b1)||closePoint(a2,b2))return false;
  const o1=orientation(a1,a2,b1),o2=orientation(a1,a2,b2),o3=orientation(b1,b2,a1),o4=orientation(b1,b2,a2),eps=.001;
  return((o1>eps&&o2<-eps)||(o1<-eps&&o2>eps))&&((o3>eps&&o4<-eps)||(o3<-eps&&o4>eps));
}
function sameSignDisplay(exact,display){const sign=Math.floor(norm(exact)/30),start=sign*30+.02,end=start+29.96,delta=((norm(display)-norm(exact)+540)%360)-180;return norm(Math.max(start,Math.min(end,norm(exact)+delta)))}
function leaderGeometry(center,target,radius){
  const dx=target.x-center.x,dy=target.y-center.y,d=Math.hypot(dx,dy)||1,edge=Math.min(d,Math.max(0,radius+1));
  return{x1:center.x+dx/d*edge,y1:center.y+dy/d*edge,x2:target.x,y2:target.y,length:Math.max(0,d-edge)};
}
function houseNumberObstacles(houseCusps,geometry,view){
  return houseCusps.map((start,index)=>{const end=houseCusps[(index+1)%12],span=norm(end-start)||30,p=point(view.center,geometry.house.numberRadius,start+span/2);return{kind:'circle',x:p.x,y:p.y,r:view.houseNumberObstacleRadius,type:'house-number',index:index+1}});
}
function orderedAngleRecords(angles){
  const rank=new Map([['asc',0],['dsc',1],['mc',2],['ic',3]]);
  return[...angles].sort((a,b)=>(rank.get(a.id)??99)-(rank.get(b.id)??99));
}
function splitAxis(center,degree,inner,outer,lane,half,gap){
  const openingInner=Math.max(inner,lane-half-gap),openingOuter=Math.min(outer,lane+half+gap),segments=[];
  if(openingInner>inner+.5){const a=point(center,inner,degree),b=point(center,openingInner,degree);segments.push({x1:a.x,y1:a.y,x2:b.x,y2:b.y})}
  if(outer>openingOuter+.5){const a=point(center,openingOuter,degree),b=point(center,outer,degree);segments.push({x1:a.x,y1:a.y,x2:b.x,y2:b.y})}
  return segments;
}
function layoutAngles(angles,geometry,view,houseCusps){
  const fixed=houseNumberObstacles(houseCusps,geometry,view),placed=[],segments=[],records=[],errors=[];
  for(const record of orderedAngleRecords(angles)){
    let chosen=null;
    for(const lane of view.angleLanes){
      if(lane-view.angleFrameHalf-view.boundaryClearance<=geometry.degree||lane+view.angleFrameHalf+view.boundaryClearance>=geometry.house.outer)continue;
      const p=point(view.center,lane,record.value),candidate={kind:'square',x:p.x,y:p.y,half:view.angleFrameHalf,type:'angle',id:record.id};
      if([...fixed,...placed].some(other=>obstacleHit(candidate,other,view.angleClearance)))continue;
      const axis=splitAxis(view.center,record.value,geometry.degree,geometry.house.outer,lane,view.angleFrameHalf,view.angleAxisGap);
      chosen={record,lane,p,candidate,axis};break;
    }
    if(!chosen){errors.push({type:'angle-collision',id:record.id,value:record.value});continue}
    placed.push(chosen.candidate);segments.push(...chosen.axis);records.push(chosen);
  }
  return{records,errors,obstacles:[...fixed,...placed],segments};
}
function placementLanes(geometry,view){
  const minimum=geometry.degree+view.placementFrameRadius+view.minimumVisibleLeader+1;
  const maximum=geometry.house.outer-view.placementFrameRadius-view.boundaryClearance;
  const step=view.placementFrameRadius*2+view.placementClearance+1,lanes=[];
  for(let lane=minimum;lane<=maximum+.001;lane+=step)lanes.push(Number(lane.toFixed(3)));
  if(lanes.length&&maximum-lanes[lanes.length-1]>view.placementFrameRadius*.7)lanes.push(Number(maximum.toFixed(3)));
  return lanes;
}
function placementCandidates(record,geometry,view){
  const lanes=placementLanes(geometry,view),offsets=[0];
  for(let amount=view.tangentialStep;amount<=view.tangentialLimit+.001;amount+=view.tangentialStep)offsets.push(-amount,amount);
  const target=point(view.center,geometry.degree,record.value),out=[];
  for(const offset of offsets){
    const display=sameSignDisplay(record.value,record.value+offset);
    for(let laneIndex=0;laneIndex<lanes.length;laneIndex++){
      const lane=lanes[laneIndex],p=point(view.center,lane,display),bubble={kind:'circle',x:p.x,y:p.y,r:view.placementFrameRadius,type:'placement',id:record.id},leader=leaderGeometry(p,target,view.placementFrameRadius);
      out.push({lane,laneIndex,p,bubble,leader,display,offset:Math.abs(((display-record.value+540)%360)-180)});
    }
  }
  return out;
}
function validPlacement(candidate,obstacles,segments,placed,view){
  if(candidate.leader.length<view.minimumVisibleLeader)return false;
  const allObstacles=[...obstacles,...placed.map(item=>item.bubble)];
  if(allObstacles.some(other=>obstacleHit(candidate.bubble,other,view.placementClearance)))return false;
  const allSegments=[...segments,...placed.map(item=>item.leader)];
  if(allSegments.some(segment=>segmentHitsObstacle(segment,candidate.bubble,view.lineClearance)))return false;
  if(allObstacles.some(other=>segmentHitsObstacle(candidate.leader,other,view.leaderClearance)))return false;
  if(allSegments.some(segment=>segmentsCross(candidate.leader,segment)))return false;
  return true;
}
function layoutPlacements(list,geometry,view,angleLayout){
  const placed=[],records=[],errors=[];
  for(const record of [...list].sort((a,b)=>a.value-b.value)){
    const chosen=placementCandidates(record,geometry,view).find(candidate=>validPlacement(candidate,angleLayout.obstacles,angleLayout.segments,placed,view));
    if(!chosen){errors.push({type:'placement-collision',id:record.id,value:record.value});continue}
    placed.push(chosen);records.push({...record,...chosen});
  }
  return{records,errors};
}

function singleView(shared){const base=shared.mini,baseGeometry=shared.miniRole('A');return{
 center:base.center,zodiac:base.zodiac,houseFillOpacity:base.houseFillOpacity,
 placementRadius:9.5,placementFrameRadius:10.5,placementClearance:2,leaderClearance:2.5,lineClearance:2.5,minimumVisibleLeader:6,
 tangentialStep:1,tangentialLimit:5,boundaryClearance:3,houseNumberObstacleRadius:7,
 angleFrameRadius:13,angleFrameHalf:13,angleClearance:4,angleAxisGap:2.5,angleLanes:[189,169,149],
 // Angles own exact-longitude radial lanes first. Ordinary placement bubbles
 // stay inside the house band and route around the complete angle frames.
 geometry:{house:{...baseGeometry.house,numberRadius:190},degree:baseGeometry.degree,placement:baseGeometry.placement,angle:[189,169,149],edge:baseGeometry.edge,side:baseGeometry.side}
}}

async function draw(prepared,current){const shared=window.RelphiSkyWheelSpec,mount=document.getElementById('skyFoundationWheelMount');if(!shared||!mount||current!==token)return null;const view=singleView(shared),g=view.geometry,{list,houseCusps}=prepared,ordinary=list.filter(x=>!shared.ANGLES.includes(x.id)),angles=list.filter(x=>shared.ANGLES.includes(x.id)),sourceErrors=[];mount.dataset.singleSkyPending='true';const wheel=svg('svg',{class:'sky-foundation-wheel sky-foundation-single-wheel relphi-canonical-ready',viewBox:'78 78 444 444',role:'img','aria-label':'Sky A standalone zodiac wheel','data-wheel-spec':'relphi-sky-wheel-v1','data-single-sky':'A'});wheel.appendChild(svg('circle',{cx:view.center.x,cy:view.center.y,r:g.house.outer+4,fill:'#fffdf8',stroke:'rgba(31,27,24,.14)'}));const layers={};['zodiac','a-houses','ticks','aspects','outlines','leaders','placements'].forEach(name=>{layers[name]=svg('g',{'data-layer':name});wheel.appendChild(layers[name])});
 houseCusps.forEach((start,index)=>{const end=houseCusps[(index+1)%12],span=norm(end-start)||30,mid=start+span/2;layers['a-houses'].appendChild(svg('path',{d:annular(view.center,g.house.inner,g.house.outer,start,end),fill:shared.COLORS[index],'fill-opacity':view.houseFillOpacity}));radial(layers['a-houses'],view.center,g.house.inner,g.house.outer,end,{stroke:shared.SKY.A,class:'sky-foundation-divider'});const p=point(view.center,g.house.numberRadius,mid),n=svg('text',{x:p.x,y:p.y,class:'sky-foundation-house-number sky-placement-mini-house-number',style:'font-size:12px;font-weight:800'});n.textContent=String(index+1);layers['a-houses'].appendChild(n)});
 const jobs=[];shared.SIGNS.forEach((id,index)=>{const start=index*30;layers.zodiac.appendChild(svg('path',{d:annular(view.center,view.zodiac.inner,view.zodiac.outer,start,start+30),fill:shared.COLORS[index],'fill-opacity':view.zodiac.fillOpacity}));radial(layers.zodiac,view.center,view.zodiac.inner,view.zodiac.outer,start,{stroke:'#423b35','stroke-width':'1.35','vector-effect':'non-scaling-stroke'});const p=point(view.center,(view.zodiac.inner+view.zodiac.outer)/2,start+15),host=svg('g',{transform:`translate(${p.x} ${p.y})`,class:'sky-foundation-sign-glyph','data-zodiac-sign':id});layers.zodiac.appendChild(host);jobs.push(cloneGlyph(id,'#171717',10,false,'#fffdf8',1.6).then(x=>host.appendChild(x)))});
 [g.house.inner,g.house.outer,view.zodiac.inner,view.zodiac.outer].forEach(radius=>layers.outlines.appendChild(svg('circle',{cx:view.center.x,cy:view.center.y,r:radius,class:'sky-foundation-ring'})));for(let degree=0;degree<360;degree++){const length=degree%10===0?12:degree%5===0?8:5;radial(layers.ticks,view.center,g.degree,g.degree+length,degree,{class:degree%10===0?'sky-foundation-tick sky-foundation-tick-major':'sky-foundation-tick'})}
 const angleLayout=layoutAngles(angles,g,view,houseCusps),layoutErrors=[...angleLayout.errors];
 angleLayout.records.forEach(item=>{
   item.axis.forEach(segment=>layers.leaders.appendChild(svg('line',{x1:segment.x1,y1:segment.y1,x2:segment.x2,y2:segment.y2,stroke:shared.SKY.A,class:'sky-foundation-angle-axis','stroke-width':'2.2','vector-effect':'non-scaling-stroke','data-sky':'A','data-placement':item.record.id,'data-angle':item.record.id,'data-exact-longitude':item.record.value.toFixed(8),'data-angle-lane':item.lane,'data-axis-opening':'canonical-frame'})));
   const host=svg('g',{transform:`translate(${item.p.x} ${item.p.y})`,'data-sky':'A','data-placement':item.record.id,'data-angle-axis':'true','data-house':item.record.house,'data-exact-longitude':item.record.value.toFixed(8),'data-display-longitude':item.record.value.toFixed(8),'data-angle-lane':item.lane,'data-placement-routing':'angle-radial-only'});
   layers.placements.appendChild(host);
   jobs.push(cloneGlyph(item.record.id,shared.SKY.A,view.angleFrameRadius,false,'#fffdf8',1.8).then(x=>host.appendChild(x)).catch(error=>{host.dataset.canonicalGlyphError=String(error?.message||error);sourceErrors.push({id:item.record.id,name:item.record.entry?.name||item.record.id,error:String(error?.message||error)});throw error}));
 });
 const placementLayout=layoutPlacements(ordinary,g,view,angleLayout);layoutErrors.push(...placementLayout.errors);
 placementLayout.records.forEach(record=>{
   const leader=svg('line',{x1:record.leader.x1,y1:record.leader.y1,x2:record.leader.x2,y2:record.leader.y2,stroke:shared.SKY.A,class:'sky-foundation-leader','data-sky':'A','data-placement':record.id,'data-exact-longitude':record.value.toFixed(8),'data-display-longitude':record.display.toFixed(8),'data-leader-routing':record.offset>0?'ordered-offset':'exact-radial','data-visible-leader-length':record.leader.length.toFixed(3)});
   layers.leaders.appendChild(leader);
   const host=svg('g',{transform:`translate(${record.p.x} ${record.p.y})`,'data-sky':'A','data-placement':record.id,'data-house':record.house,'data-exact-longitude':record.value.toFixed(8),'data-display-longitude':record.display.toFixed(8),'data-placement-lane':record.lane,'data-placement-routing':record.offset>0?'ordered-offset':'exact-radial','data-display-offset':record.offset.toFixed(3)});
   layers.placements.appendChild(host);
   jobs.push(cloneGlyph(record.id,shared.SKY.A,view.placementRadius,true).then(x=>host.appendChild(x)).catch(error=>{host.dataset.canonicalGlyphError=String(error?.message||error);leader.remove();sourceErrors.push({id:record.id,name:record.entry?.name||record.id,error:String(error?.message||error)});throw error}));
 });
 if(layoutErrors.length)console.error('[Standalone Sky layout unresolved]',layoutErrors);
 const settled=await Promise.allSettled(jobs);if(current!==token)return null;const uniqueErrors=[...new Map(sourceErrors.map(item=>[item.id,item])).values()];wheel.dataset.canonicalSourceReady=uniqueErrors.length?'error':'true';wheel.dataset.sourcePlacementCount=String(list.length);wheel.dataset.renderedPlacementCount=String(layers.placements.querySelectorAll(':scope>g[data-placement]:not([data-canonical-glyph-error])').length);wheel.dataset.glyphRenderFailures=String(uniqueErrors.length);wheel.dataset.canonicalSourceErrors=uniqueErrors.map(item=>item.id).join(',');wheel.dataset.layoutErrors=layoutErrors.map(item=>item.id).join(',');wheel.dataset.layoutErrorCount=String(layoutErrors.length);if(uniqueErrors.length)console.warn('[Standalone Sky canonical glyph source]',uniqueErrors);mount.replaceChildren(wheel);delete mount.dataset.singleSkyPending;return wheel}

function harmonicRelations(list){const H=window.RelphiHarmonicOrb,aspects=H?.aspects||[],w=H?.windowFromControl?.()??H?.defaultWindow??6,result=[];for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){const left=list[i],right=list[j];if(ANGLE_IDS.has(left.id)&&ANGLE_IDS.has(right.id))continue;const distance=separation(left.value,right.value);aspects.forEach(aspect=>{const relation=H?.relation?.(left,right,aspect,distance,w);if(relation)result.push(relation)})}return result.sort((a,b)=>a.phaseError-b.phaseError||a.harmonicOrder-b.harmonicOrder||a.orb-b.orb)}
function glyphSlot(role,label){const s=document.createElement('span');s.className=`sky-foundation-relationship-glyph sky-foundation-relationship-glyph--${role}`;s.dataset.glyphRole=role;s.setAttribute('aria-label',label);return s}
function renderRelations(prepared,current){if(current!==token)return;const listMount=document.getElementById('skyFoundationRelationshipList'),aspectLayer=document.querySelector('#skyFoundationWheelMount [data-layer="aspects"]'),count=document.getElementById('skyFoundationRelationshipCount'),empty=document.getElementById('skyFoundationRelationshipEmpty');if(!listMount||!aspectLayer)return;const relations=harmonicRelations(prepared.list),center=window.RelphiSkyWheelSpec?.mini?.center,degreeRadius=window.RelphiSkyWheelSpec?.miniRole?.('A')?.degree??window.RelphiSkyWheelSpec?.mini?.zodiac?.outer;listMount.replaceChildren();aspectLayer.replaceChildren();relations.forEach((r,index)=>{const from=point(center,degreeRadius,r.left.value),to=point(center,degreeRadius,r.right.value);aspectLayer.appendChild(svg('line',{x1:from.x,y1:from.y,x2:to.x,y2:to.y,stroke:r.aspect.color,class:'sky-foundation-aspect sky-foundation-single-sky-aspect','data-relation-index':index,'data-aspect':r.aspect.id,'data-left-placement':r.left.id,'data-right-placement':r.right.id,'data-left-sky':'A','data-right-sky':'A','data-orb':r.orb.toFixed(6),'data-phase-error':r.phaseError.toFixed(6),'data-harmonic-order':r.harmonicOrder}));const left=coordinate(r.left),right=coordinate(r.right),row=document.createElement('button');row.type='button';row.className='sky-foundation-relationship-row sky-foundation-single-sky-row';Object.assign(row.dataset,{relationshipSelection:'true',relationIndex:String(index),relationshipMode:'A-A',leftSky:'A',rightSky:'A',aspect:r.aspect.id,leftPlacement:r.left.id,rightPlacement:r.right.id,leftHouse:String(r.left.house),rightHouse:String(r.right.house),leftSign:String(left.sign),rightSign:String(right.sign),sourceOrb:r.orb.toFixed(6),harmonicOrder:String(r.harmonicOrder),harmonicNumerator:String(r.harmonicNumerator),phaseError:r.phaseError.toFixed(6),signedPhaseError:r.signedPhaseError.toFixed(6),harmonicWindow:r.masterWindow.toFixed(6),windowFraction:Number.isFinite(r.windowFraction)?r.windowFraction.toFixed(6):String(r.windowFraction),harmonicCoherence:r.coherence.toFixed(8)});row.setAttribute('aria-label',`Sky A ${r.left.entry.name} ${r.aspect.id} Sky A ${r.right.entry.name}, harmonic ${r.harmonicOrder}, phase error ${r.phaseError.toFixed(2)} degrees, coherence ${r.coherencePercent.toFixed(0)} percent`);const leftGlyph=glyphSlot('left',r.left.entry.name),aspectGlyph=glyphSlot('aspect',r.aspect.id),rightGlyph=glyphSlot('right',r.right.entry.name),leftCopy=document.createElement('span'),rightCopy=document.createElement('span');leftCopy.className=rightCopy.className='sky-foundation-relationship-copy';leftCopy.innerHTML=`${r.left.entry.name}<small>${left.text} ${SIGN_NAMES[left.sign]} · H${r.left.house}</small>`;rightCopy.innerHTML=`${r.right.entry.name}<small>${right.text} ${SIGN_NAMES[right.sign]} · H${r.right.house}</small>`;row.append(leftGlyph,leftCopy,aspectGlyph,rightGlyph,rightCopy);listMount.appendChild(row)});if(count){count.textContent=`${relations.length}/${relations.length}`;count.dataset.total=String(relations.length)}if(empty)empty.hidden=relations.length!==0;document.documentElement.dataset.skyRelationshipMode='A-A';window.dispatchEvent(new CustomEvent('relphi:sky-single-sky-aspects-rendered',{detail:{slot:'A',mode:'A-A',count:relations.length}}))}

function dispatchStorage(key){try{window.dispatchEvent(new StorageEvent('storage',{key,newValue:localStorage.getItem(key),storageArea:localStorage}))}catch(_){const e=new Event('storage');Object.defineProperty(e,'key',{value:key});window.dispatchEvent(e)}}
function removeSkyB(){localStorage.removeItem(KEYS.B);document.documentElement.removeAttribute('data-sky-b-editing');dispatchStorage(KEYS.B);queue()}
function openSkyBEditor(){document.documentElement.dataset.skyBEditing='true';const panel=document.getElementById('skyFoundationB');if(panel)panel.hidden=false;let tries=0;const open=()=>{const button=document.querySelector('#skyFoundationB [data-ww-action="edit"]');if(button){button.click();return}if(++tries<12)setTimeout(open,50)};open()}
function controls(present){const b=document.querySelector('#skyFoundationB .sky-foundation-heading'),c=document.querySelector('#skyFoundationComparison .sky-foundation-heading');if(b){let remove=b.querySelector('[data-remove-sky-b]');if(present&&!remove){remove=document.createElement('button');remove.type='button';remove.className='sky-slot-presence-button sky-slot-remove';remove.dataset.removeSkyB='true';remove.textContent='Remove Sky B';remove.addEventListener('click',removeSkyB);b.appendChild(remove)}if(remove)remove.hidden=!present}if(c){const title=c.querySelector('span:first-child');if(title)title.textContent=present?'Comparison':'Sky A';let add=c.querySelector('[data-add-sky-b]');if(!present&&!add){add=document.createElement('button');add.type='button';add.className='sky-slot-presence-button sky-slot-add';add.dataset.addSkyB='true';add.textContent='Add Sky B';add.addEventListener('click',openSkyBEditor);c.appendChild(add)}if(add)add.hidden=present}}
async function render(){const current=++token,present=hasSky('B');document.documentElement.dataset.skyBPresent=present?'true':'false';controls(present);if(present){preparedState=null;document.documentElement.removeAttribute('data-sky-b-editing');if(document.documentElement.dataset.skyRelationshipMode==='A-A')document.documentElement.dataset.skyRelationshipMode='A-B';return}if(!hasSky('A'))return;const prepared=records(read('A'));preparedState=prepared;await draw(prepared,current);if(current!==token)return;renderRelations(prepared,current)}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render().catch(console.error)})}
function refreshRelationsOnly(){if(document.documentElement.dataset.skyBPresent!=='false'||!preparedState)return;renderRelations(preparedState,token)}
function start(){queue();['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-comparison-yielded'].forEach(name=>window.addEventListener(name,queue));window.addEventListener('relphi:sky-orb-limit-changed',()=>requestAnimationFrame(refreshRelationsOnly));window.addEventListener('storage',e=>{if(e.key===KEYS.A||e.key===KEYS.B)queue()})}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
