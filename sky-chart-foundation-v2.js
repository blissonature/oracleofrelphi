// Native Sky Chart foundation v2.
// The shared wheel specification is the single geometry source: Sky A is inner, Sky B is outer.
// Collision resolution runs on the detached SVG before insertion, so no corrective geometry is painted.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyFoundationV2)return;
window.__relphiSkyFoundationV2=true;
window.__relphiSkyFoundationV1=true;

const NS='http://www.w3.org/2000/svg';
const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const ORDER=['sun','moon','asc','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','north-node','south-node','chiron','lilith','part-of-fortune','vertex','mc','ic','dsc'];
const ANGLE_IDS=new Set(['asc','dsc','mc','ic']);
const APPROVED_COMPONENT_MASTERS=new Set(['chiron','north-node','south-node','part-of-fortune','vertex','asc','dsc','mc','ic']);
const ALIASES={rising:'asc',ascendant:'asc',asc:'asc',ac:'asc',descendant:'dsc',dsc:'dsc',dc:'dsc',midheaven:'mc',mc:'mc','imum coeli':'ic',imumcoeli:'ic',ic:'ic',vertex:'vertex',vx:'vertex','north node':'north-node',node:'north-node','true node':'north-node','south node':'south-node',fortune:'part-of-fortune','part of fortune':'part-of-fortune',pof:'part-of-fortune'};
const ASPECTS=[{id:'conjunction',angle:0,color:'#e53935'},{id:'semi-sextile',angle:30,color:'#7c9b49'},{id:'octile',angle:45,color:'#b86d43'},{id:'sextile',angle:60,color:'#d3b727'},{id:'quintile',angle:72,color:'#8b6cc2'},{id:'square',angle:90,color:'#d6534d'},{id:'trine',angle:120,color:'#4e9e69'},{id:'tri-octile',angle:135,color:'#9f5944'},{id:'bi-quintile',angle:144,color:'#7655aa'},{id:'quincunx',angle:150,color:'#4b8e88'},{id:'opposition',angle:180,color:'#5961c8'}];
const SIGN_NAMES=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
let lastSignature='',rendering=false,rerender=false;

const norm=value=>((Number(value)%360)+360)%360;
const separation=(a,b)=>Math.abs(((a-b+180)%360+360)%360-180);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
function spec(){return window.RelphiSkyWheelSpec||null}
function comparison(){return spec()?.comparison||null}
function geometry(slot){return spec()?.role?.(slot)||null}
function center(){return comparison()?.center||{x:600,y:600}}
function svg(name,attrs){const node=document.createElementNS(NS,name);Object.entries(attrs||{}).forEach(([key,value])=>node.setAttribute(key,String(value)));return node}
function polar(radius,degree){const c=center(),angle=(norm(degree)-180)*Math.PI/180;return{x:c.x+radius*Math.cos(angle),y:c.y+radius*Math.sin(angle)}}
function radialLine(parent,inner,outer,degree,attrs){const a=polar(inner,degree),b=polar(outer,degree),line=svg('line',Object.assign({x1:a.x,y1:a.y,x2:b.x,y2:b.y},attrs||{}));parent.appendChild(line);return line}
function annular(inner,outer,start,end){const span=norm(end-start)||360,large=span>180?1:0,a=polar(outer,start),b=polar(outer,start+span),c=polar(inner,start+span),d=polar(inner,start);return`M${a.x} ${a.y} A${outer} ${outer} 0 ${large} 1 ${b.x} ${b.y} L${c.x} ${c.y} A${inner} ${inner} 0 ${large} 0 ${d.x} ${d.y} Z`}
function read(key){
  try{
    const startup=window.RelphiSkyStartupMode;
    if(typeof startup?.read==='function')return startup.read(key);
    return JSON.parse(localStorage.getItem(key)||'null');
  }catch(_){return null}
}
function requestedOrb(){const input=document.querySelector('[data-filter="orb"]'),value=Number(input?.value);return Number.isFinite(value)&&value>=0?Math.min(360,value):1}
function source(payload){if(!payload||typeof payload!=='object')return[];const known=[payload.placements,payload.positions,payload.points,payload.bodies].find(value=>value&&typeof value==='object'),raw=known||payload;if(Array.isArray(raw))return raw.map((item,index)=>[String(item?.name||item?.label||item?.id||index),item]);return Object.entries(raw).filter(([key,item])=>item&&typeof item==='object'&&!Array.isArray(item)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key)&&(Number.isFinite(Number(item.longitude))||item.sign||item.zodiac))}
function longitude(item){if(Number.isFinite(Number(item?.longitude)))return norm(item.longitude);const signs=spec()?.SIGNS||[],sign=signs.indexOf(String(item?.sign||item?.zodiac||'').trim().toLowerCase());return sign<0?NaN:norm(sign*30+Number(item?.degree||item?.degrees||0)+Number(item?.minute||item?.minutes||0)/60+Number(item?.second||item?.seconds||0)/3600)}
function canonicalEntry(key,item){const registry=window.RelphiGlyphRegistry;if(!registry)return null;for(const candidate of[item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key]){if(candidate==null)continue;const raw=String(candidate).trim(),id=ALIASES[raw.toLowerCase()]||raw,entry=registry.resolve?.(id)||registry.get?.(id);if(entry?.asset||APPROVED_COMPONENT_MASTERS.has(entry?.id))return entry}return null}
function records(payload){const seen=new Set();return source(payload).map(([key,item])=>{const entry=canonicalEntry(key,item),value=longitude(item);if(!entry||!Number.isFinite(value)||seen.has(entry.id))return null;seen.add(entry.id);return{key,item,entry,id:entry.id,value}}).filter(Boolean).sort((a,b)=>{const ai=ORDER.indexOf(a.id),bi=ORDER.indexOf(b.id);return(ai<0?999:ai)-(bi<0?999:bi)||a.value-b.value})}
function profile(payload){return payload?.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:{}}
function ascendant(payload,list){const record=list.find(item=>item.id==='asc');if(record)return record.value;const value=Number(profile(payload).ascendant??payload?.ascendant??payload?.asc);return Number.isFinite(value)?norm(value):0}
function houseCusps(payload,list){const p=profile(payload);for(const raw of[p.houseCusps,p.cusps,payload?.houseCusps,payload?.cusps,payload?.houses]){if(!raw)continue;const values=(Array.isArray(raw)?raw:Object.values(raw)).map(item=>typeof item==='object'?Number(item.longitude??item.value??item.cusp):Number(item)).slice(0,12);if(values.length===12&&values.every(Number.isFinite))return values.map(norm)}const asc=ascendant(payload,list),system=String(p.houseSystem||payload?.houseSystem||'whole-sign').toLowerCase(),start=system.includes('whole')?Math.floor(asc/30)*30:asc;return Array.from({length:12},(_,index)=>norm(start+index*30))}
function houseFor(value,cusps){for(let index=0;index<12;index+=1){const start=cusps[index],span=norm(cusps[(index+1)%12]-start)||30;if(norm(value-start)<span)return index+1}return 12}
function coordinate(record){const value=norm(record.value),sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within),minute=Math.floor((within-degree)*60+1e-9);return{sign,text:`${degree}°${String(minute).padStart(2,'0')}′`}}
function shell(){let root=document.getElementById('skyFoundationRoot');if(root)return root;const panel=document.getElementById('chartPanel');if(!panel)return null;root=document.createElement('section');root.id='skyFoundationRoot';root.setAttribute('aria-label','Sky Chart foundation');root.innerHTML='<aside id="skyFoundationA" class="sky-foundation-panel" aria-label="Sky A"><header class="sky-foundation-heading"><span class="sky-foundation-slot" style="--slot-color:#c9211e">Sky A</span><span class="sky-foundation-name">Sky A</span></header><div class="sky-foundation-body"></div></aside><section id="skyFoundationComparison" class="sky-foundation-panel" aria-label="Comparison zodiac wheel"><header class="sky-foundation-heading"><span>Comparison</span></header><div id="skyFoundationWheelMount"></div></section><aside id="skyFoundationB" class="sky-foundation-panel" aria-label="Sky B"><header class="sky-foundation-heading"><span class="sky-foundation-slot" style="--slot-color:#2462d0">Sky B</span><span class="sky-foundation-name">Sky B</span></header><div class="sky-foundation-body"></div></aside>';panel.prepend(root);return root}
function masterAvailable(entry){return!!entry&&(!!entry.asset||APPROVED_COMPONENT_MASTERS.has(entry.id))}
async function drawCanonical(parent,id,options){const registry=window.RelphiGlyphRegistry,component=window.RelphiGlyphComponent,entry=registry?.get(id)||registry?.resolve(id);if(!masterAvailable(entry)||!component?.draw)throw new Error('Canonical Master Glyph List entry unavailable: '+id);return component.draw(parent,entry.id,options)}
async function drawBubble(parent,id,options,uncircled=false){const registry=window.RelphiGlyphRegistry,component=window.RelphiGlyphComponent,entry=registry?.get(id)||registry?.resolve(id);if(!masterAvailable(entry)||!component?.createBubble)throw new Error('Canonical Master Glyph List entry unavailable: '+id);const bubble=component.createBubble(parent,entry.id,options);if(uncircled){bubble.circle.style.opacity='0';bubble.circle.setAttribute('aria-hidden','true')}await bubble.ready;return bubble.root}
function glyphFailure(host,error){host.dataset.relphiGlyphError=error?.message||'canonical-glyph-failed';console.error(error)}
function renderCard(slot,payload,list,cusps){const panel=document.getElementById(`skyFoundation${slot}`);if(!panel)return[];panel.querySelector('.sky-foundation-name').textContent=payload?.name||`Sky ${slot}`;const refs=window.RelphiSkyCardShell?.ensure?.(slot,payload),mount=refs?.placements||panel.querySelector('.sky-foundation-body');mount.replaceChildren();if(!list.length){mount.innerHTML='<p class="sky-foundation-empty">No approved canonical placements are available for this sky.</p>';return[]}const ledger=document.createElement('div');ledger.className='sky-foundation-ledger';mount.appendChild(ledger);const color=spec()?.SKY?.[slot]||'#333',jobs=[];list.forEach(record=>{const position=coordinate(record),row=document.createElement('div');row.className='sky-foundation-row';row.innerHTML=`<svg viewBox="-20 -20 40 40" aria-label="${esc(record.entry.name)}"></svg><span class="sky-foundation-row-name">${esc(record.entry.name)}</span><span class="sky-foundation-coordinate">${position.text} ${SIGN_NAMES[position.sign]}</span><span class="sky-foundation-house">H${houseFor(record.value,cusps)}</span>`;ledger.appendChild(row);const host=row.querySelector('svg');jobs.push(drawCanonical(host,record.id,{radius:16,padding:1,color}).catch(error=>glyphFailure(host,error)))});return jobs}
function relationships(a,b){const result=[],limit=Math.min(180,requestedOrb()),same=a===b;a.forEach((left,i)=>b.forEach((right,j)=>{if(same&&j<=i)return;const distance=separation(left.value,right.value);ASPECTS.forEach(aspect=>{const orb=Math.abs(distance-aspect.angle);if(orb<=limit)result.push({left,right,aspect,orb})})}));return result.sort((x,y)=>x.orb-y.orb)}
function segmentDistance(point,a,b){const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy;if(l2<=1e-9)return Math.hypot(point.x-a.x,point.y-a.y);const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/l2));return Math.hypot(point.x-(a.x+t*dx),point.y-(a.y+t*dy))}
function circleCollision(a,b,clearance){return Math.hypot(a.x-b.x,a.y-b.y)<a.r+b.r+clearance}
function squareCircle(square,circle,clearance){const dx=Math.max(Math.abs(square.x-circle.x)-square.half,0),dy=Math.max(Math.abs(square.y-circle.y)-square.half,0);return Math.hypot(dx,dy)<circle.r+clearance}
function squareSquare(a,b,clearance){return Math.abs(a.x-b.x)<a.half+b.half+clearance&&Math.abs(a.y-b.y)<a.half+b.half+clearance}
function obstacleCollision(candidate,obstacles,clearance){return obstacles.some(obstacle=>obstacle.kind==='square'?squareSquare(candidate,obstacle,clearance):squareCircle(candidate,obstacle,clearance))}
function houseLayer(parent,slot,cusps,g,obstacles){const colors=spec()?.COLORS||[],color=spec()?.SKY?.[slot]||'#333',opacity=comparison()?.houseFillOpacity??.5;cusps.forEach((start,index)=>{const end=cusps[(index+1)%12],mid=start+(norm(end-start)||30)/2;parent.appendChild(svg('path',{d:annular(g.inner,g.outer,start,end),fill:colors[index]||'#ddd','fill-opacity':opacity}));radialLine(parent,g.inner,g.outer,end,{stroke:color,class:'sky-foundation-divider'});const p=polar((g.inner+g.outer)/2,mid),text=svg('text',{x:p.x,y:p.y,class:'sky-foundation-house-number'});text.textContent=String(index+1);parent.appendChild(text);obstacles.push({kind:'circle',x:p.x,y:p.y,r:11})})}
function addZodiac(layer,obstacles,jobs){const shared=spec(),z=comparison()?.zodiac;if(!shared||!z)return;for(let index=0;index<12;index+=1){const id=shared.SIGNS[index],start=index*30;layer.appendChild(svg('path',{d:annular(z.inner,z.outer,start,start+30),fill:shared.COLORS[index],'fill-opacity':z.fillOpacity}));radialLine(layer,z.inner,z.outer,start,{stroke:'#423b35','stroke-width':'1.35','vector-effect':'non-scaling-stroke'});const p=polar((z.inner+z.outer)/2,start+15),radius=Number(z.glyphRadius)||19,host=svg('g',{transform:`translate(${p.x} ${p.y})`,class:'sky-foundation-sign-glyph','data-zodiac-sign':id});layer.appendChild(host);obstacles.push({kind:'circle',x:p.x,y:p.y,r:radius+1});jobs.push(drawBubble(host,id,{radius,padding:1,color:'#171717',strokeWidth:z.strokeWidth||2.35},true).catch(error=>glyphFailure(host,error)))}}
function addOrdinary(layerLeaders,layerPlacements,slot,list,cusps,g,obstacles,jobs){const color=spec()?.SKY?.[slot]||'#333',lane=Number(g.placement?.[0]),bubbleRadius=Number(comparison()?.placementBubbleRadius)||17.2;if(!Number.isFinite(lane))return;list.filter(record=>!ANGLE_IDS.has(record.id)).forEach(record=>{const exact=polar(g.degree,record.value),display=polar(lane,record.value);layerLeaders.appendChild(svg('line',{x1:display.x,y1:display.y,x2:exact.x,y2:exact.y,stroke:color,class:'sky-foundation-leader','data-sky':slot,'data-placement':record.id,'data-exact-longitude':record.value.toFixed(8)}));const host=svg('g',{transform:`translate(${display.x} ${display.y})`,'data-sky':slot,'data-placement':record.id,'data-house':houseFor(record.value,cusps),'data-placement-lane':lane,'data-display-longitude':record.value.toFixed(8),'data-exact-longitude':record.value.toFixed(8)});layerPlacements.appendChild(host);obstacles.push({kind:'circle',x:display.x,y:display.y,r:bubbleRadius});jobs.push(drawBubble(host,record.id,{radius:Number(comparison()?.placementRadius)||16,padding:1,color,fill:'#fffdf8',strokeWidth:2.35}).catch(error=>glyphFailure(host,error)))})}
function addAngles(layerLeaders,layerPlacements,slot,list,cusps,g,obstacles,jobs){const color=spec()?.SKY?.[slot]||'#333',frameRadius=19,half=frameRadius+1.2,clearance=6,angleGap=Number(comparison()?.angleGap)||17;list.filter(record=>ANGLE_IDS.has(record.id)).forEach(record=>{let chosen=null;for(const lane of g.angle||[]){const p=polar(lane,record.value),candidate={kind:'square',x:p.x,y:p.y,half};if(lane-half-clearance<=g.inner||lane+half+clearance>=g.outer||obstacleCollision(candidate,obstacles,clearance))continue;chosen={lane,p,candidate};break}if(!chosen){const lane=Number(g.angle?.[0]),p=polar(lane,record.value);chosen={lane,p,candidate:{kind:'square',x:p.x,y:p.y,half},fallback:true}}const labelSide=g.side==='inner'?chosen.lane-angleGap:chosen.lane+angleGap,lineStart=Math.min(g.edge,labelSide),lineEnd=Math.max(g.edge,labelSide);if(lineEnd>lineStart)radialLine(layerLeaders,lineStart,lineEnd,record.value,{stroke:color,class:'sky-foundation-angle-axis','stroke-width':'2.6','vector-effect':'non-scaling-stroke','data-sky':slot,'data-placement':record.id,'data-angle':record.id,'data-exact-longitude':record.value.toFixed(8),'data-angle-lane':chosen.lane,'data-axis-extreme':g.side,'data-axis-edge-radius':g.edge});const host=svg('g',{transform:`translate(${chosen.p.x} ${chosen.p.y})`,'data-sky':slot,'data-placement':record.id,'data-angle-axis':'true','data-house':houseFor(record.value,cusps),'data-angle-lane':chosen.lane,'data-angle-longitude':record.value.toFixed(8),'data-exact-longitude':record.value.toFixed(8),'data-angle-extreme':g.side,'data-angle-lane-fallback':chosen.fallback?'true':'false'});layerPlacements.appendChild(host);obstacles.push(chosen.candidate);jobs.push(drawBubble(host,record.id,{radius:frameRadius,padding:1,color,strokeWidth:2.35},true).catch(error=>glyphFailure(host,error)))})}
function buildWheel(listA,listB,cuspsA,cuspsB){const shared=spec(),cmp=comparison(),gA=geometry('A'),gB=geometry('B');if(!shared||!cmp||!gA||!gB)throw new Error('Shared Sky wheel specification is unavailable.');const c=center(),outerRadius=Math.max(gA.outer,gB.outer,cmp.zodiac.outer),chart=svg('svg',{viewBox:cmp.viewBox.join(' '),role:'img','aria-label':'Sky A and Sky B rainbow comparison wheel',class:'sky-foundation-wheel relphi-canonical-ready','data-ring-order':'A-inner-B-outer','data-inner-sky':'A','data-outer-sky':'B','data-wheel-spec':'relphi-sky-wheel-v1'});chart.appendChild(svg('circle',{cx:c.x,cy:c.y,r:outerRadius+8,fill:'#fffdf8',stroke:'rgba(31,27,24,.14)'}));const layers={};['a-houses','zodiac','b-houses','ticks','aspects','outlines','leaders','placements'].forEach(name=>{layers[name]=svg('g',{'data-layer':name});chart.appendChild(layers[name])});const jobs=[],obstacles=[];houseLayer(layers['a-houses'],'A',cuspsA,gA,obstacles);houseLayer(layers['b-houses'],'B',cuspsB,gB,obstacles);addZodiac(layers.zodiac,obstacles,jobs);[gA.inner,cmp.zodiac.inner,cmp.zodiac.outer,gB.outer].forEach(radius=>layers.outlines.appendChild(svg('circle',{cx:c.x,cy:c.y,r:radius,class:'sky-foundation-ring'})));for(let degree=0;degree<360;degree+=1){const length=degree%10===0?12:degree%5===0?8:5,className=degree%10===0?'sky-foundation-tick sky-foundation-tick-major':'sky-foundation-tick';radialLine(layers.ticks,gA.degree-length,gA.degree,degree,{class:className});radialLine(layers.ticks,gB.degree,gB.degree+length,degree,{class:className})}const aspectRadius=Math.max(1,gA.inner-1);relationships(listA,listB).forEach(relation=>{const from=polar(aspectRadius,relation.left.value),to=polar(aspectRadius,relation.right.value);layers.aspects.appendChild(svg('line',{x1:from.x,y1:from.y,x2:to.x,y2:to.y,stroke:relation.aspect.color,class:'sky-foundation-aspect','data-aspect':relation.aspect.id,'data-left-placement':relation.left.id,'data-right-placement':relation.right.id,'data-orb':relation.orb.toFixed(6)}))});addOrdinary(layers.leaders,layers.placements,'A',listA,cuspsA,gA,obstacles,jobs);addOrdinary(layers.leaders,layers.placements,'B',listB,cuspsB,gB,obstacles,jobs);addAngles(layers.leaders,layers.placements,'A',listA,cuspsA,gA,obstacles,jobs);addAngles(layers.leaders,layers.placements,'B',listB,cuspsB,gB,obstacles,jobs);window.RelphiPlacementCollisionOrder?.arrange?.(chart);chart.dataset.finalGeometryReady='true';return{chart,jobs}}
function buildSingleWheel(listA,cuspsA){
  const shared=spec(),cmp=comparison(),gA=geometry('A');
  if(!shared||!cmp||!gA)throw new Error('Shared Sky wheel specification is unavailable.');
  const c=center(),outerRadius=cmp.zodiac.outer;
  const chart=svg('svg',{
    viewBox:cmp.viewBox.join(' '),role:'img','aria-label':'Sky A zodiac wheel',
    class:'sky-foundation-wheel relphi-canonical-ready',
    'data-ring-order':'A-houses-inner-zodiac-outer','data-inner-sky':'A',
    'data-wheel-spec':'relphi-sky-wheel-v1','data-single-sky':'A','data-wheel-geometry':'comparison'
  });
  chart.appendChild(svg('circle',{cx:c.x,cy:c.y,r:outerRadius+8,fill:'#fffdf8',stroke:'rgba(31,27,24,.14)'}));
  const layers={};
  ['a-houses','zodiac','ticks','aspects','outlines','leaders','placements'].forEach(name=>{
    layers[name]=svg('g',{'data-layer':name});chart.appendChild(layers[name]);
  });
  const jobs=[],obstacles=[];
  // Same inner Sky A house geometry and same zodiac ring as comparison mode.
  houseLayer(layers['a-houses'],'A',cuspsA,gA,obstacles);
  addZodiac(layers.zodiac,obstacles,jobs);
  [gA.inner,cmp.zodiac.inner,cmp.zodiac.outer].forEach(radius=>layers.outlines.appendChild(svg('circle',{cx:c.x,cy:c.y,r:radius,class:'sky-foundation-ring'})));
  for(let degree=0;degree<360;degree+=1){
    const length=degree%10===0?12:degree%5===0?8:5,className=degree%10===0?'sky-foundation-tick sky-foundation-tick-major':'sky-foundation-tick';
    radialLine(layers.ticks,gA.degree-length,gA.degree,degree,{class:className});
  }
  // Same aspect boundary as the comparison wheel: aspects live inside the house ring.
  const aspectRadius=Math.max(1,gA.inner-1);
  relationships(listA,listA).forEach(relation=>{
    const from=polar(aspectRadius,relation.left.value),to=polar(aspectRadius,relation.right.value);
    layers.aspects.appendChild(svg('line',{
      x1:from.x,y1:from.y,x2:to.x,y2:to.y,stroke:relation.aspect.color,
      class:'sky-foundation-aspect','data-aspect':relation.aspect.id,
      'data-left-placement':relation.left.id,'data-right-placement':relation.right.id,
      'data-orb':relation.orb.toFixed(6),'data-relationship-mode':'A-A'
    }));
  });
  // Exact same Sky A placement and angle functions as comparison mode.
  addOrdinary(layers.leaders,layers.placements,'A',listA,cuspsA,gA,obstacles,jobs);
  addAngles(layers.leaders,layers.placements,'A',listA,cuspsA,gA,obstacles,jobs);
  window.RelphiPlacementCollisionOrder?.arrange?.(chart);
  chart.dataset.finalGeometryReady='true';
  return{chart,jobs};
}
function signature(a,b){try{return JSON.stringify([a,b,requestedOrb()])}catch(_){return String(Date.now())}}
function whereWhenEditing(){return document.documentElement.dataset.skyWhereWhenEditing==='true'}
async function render(force=false){if(whereWhenEditing())return;if(rendering){rerender=true;return}const root=shell();if(!root)return;const registry=window.RelphiGlyphRegistry,component=window.RelphiGlyphComponent;if(!registry||!component?.draw||!component?.createBubble||!spec()){setTimeout(()=>render(true),20);return}const payloadA=read(KEYS.A),payloadB=read(KEYS.B),nextSignature=signature(payloadA,payloadB);if(!force&&nextSignature===lastSignature)return;rendering=true;rerender=false;try{const listA=records(payloadA),listB=records(payloadB),cuspsA=houseCusps(payloadA,listA),cuspsB=houseCusps(payloadB,listB),cardJobs=[...renderCard('A',payloadA,listA,cuspsA),...renderCard('B',payloadB,listB,cuspsB)],mount=document.getElementById('skyFoundationWheelMount');
    if(!listA.length){
      // With no Sky A, the comparison foundation owns the empty state.
      mount.innerHTML='<p class="sky-foundation-empty">Sky A needs approved canonical placements.</p>';
      await Promise.allSettled(cardJobs);
    }else if(!listB.length){
      delete mount.dataset.comparisonYieldedToSingleSky;
      const wheel=buildSingleWheel(listA,cuspsA);
      await Promise.allSettled([...cardJobs,...wheel.jobs]);
      if(!records(read(KEYS.B)).length)mount.replaceChildren(wheel.chart);
      else rerender=true;
    }else{
      delete mount.dataset.comparisonYieldedToSingleSky;
      const wheel=buildWheel(listA,listB,cuspsA,cuspsB);
      await Promise.allSettled([...cardJobs,...wheel.jobs]);
      // Sky B may have been removed while canonical glyph jobs were resolving.
      // Re-check ownership before replacing the shared mount.
      if(records(read(KEYS.B)).length)mount.replaceChildren(wheel.chart);
      else{
        const single=buildSingleWheel(listA,cuspsA);
        await Promise.allSettled(single.jobs);
        mount.replaceChildren(single.chart);
      }
    }
    root.setAttribute('aria-busy','false');lastSignature=nextSignature;window.dispatchEvent(new Event('relphi:sky-foundation-ready'))}catch(error){console.error('Sky Chart foundation render failed:',error);const mount=document.getElementById('skyFoundationWheelMount');if(records(read(KEYS.B)).length)mount.innerHTML='<p class="sky-foundation-empty">The canonical foundation could not render.</p>';else window.dispatchEvent(new CustomEvent('relphi:sky-comparison-yielded',{detail:{mode:'A-A',error:true}}))}finally{rendering=false;if(rerender)requestAnimationFrame(()=>render(true))}}
function start(){shell();void render(true);window.addEventListener('storage',event=>{if((!event.key||event.key===KEYS.A||event.key===KEYS.B)&&!whereWhenEditing())void render(true)});window.addEventListener('relphi:sky-orb-limit-changed',()=>{if(!whereWhenEditing())void render(true)});window.addEventListener('relphi:sky-where-when-committed',()=>void render(true));window.addEventListener('relphi:sky-where-when-edit-state-changed',event=>{if(event.detail?.active===false)void render(true)});window.addEventListener('relphi:sky-b-removed',()=>void render(true));window.addEventListener('relphi:sky-b-restored',()=>void render(true));window.addEventListener('relphi:saved-sky-loaded',()=>{if(!whereWhenEditing())void render(true)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
