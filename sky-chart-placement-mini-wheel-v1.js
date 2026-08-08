// Placements tab: one standalone zodiac wheel per Sky, visually derived from the comparison wheel.
// Same rainbow zodiac/house bands, ring treatment, ticks, canonical glyph presentation, and sky-color placement lane.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyPlacementMiniWheelV2)return;
window.__relphiSkyPlacementMiniWheelV1=true;
window.__relphiSkyPlacementMiniWheelV2=true;

const NS='http://www.w3.org/2000/svg';
const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const SKY={A:'#c9211e',B:'#2462d0'};
const COLORS=['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
const SIGNS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
const SYSTEMS={'whole-sign':'Whole Sign','equal-house':'Equal House',porphyry:'Porphyry',placidus:'Placidus',alcabitius:'Alcabitius',regiomontanus:'Regiomontanus',campanus:'Campanus',koch:'Koch'};
const ALIASES={rising:'asc',ascendant:'asc',asc:'asc',ac:'asc',descendant:'dsc',dsc:'dsc',dc:'dsc',midheaven:'mc',mc:'mc','imum coeli':'ic',imumcoeli:'ic',ic:'ic',vertex:'vertex',vx:'vertex','north node':'north-node',node:'north-node','true node':'north-node','south node':'south-node',chiron:'chiron',lilith:'lilith','black moon lilith':'lilith',fortune:'part-of-fortune','part of fortune':'part-of-fortune',pof:'part-of-fortune'};
const ANGLES=new Set(['asc','dsc','mc','ic']);
const C={x:300,y:300};
// Exact 1:2 scale of the comparison wheel's outer-Sky geometry.
const R={center:83,zIn:161.5,zOut:207,hIn:207,hOut:287,degree:207};
const PLACEMENT={bubbleRadius:17.2,clearance:6,lanes:[225,220,230],tangentialStep:.75,tangentialLimit:15};
const ANGLE={frameRadius:19,frameStrokeWidth:2.35,clearance:6,lineGap:17,lanes:[270,261,252],edge:R.hOut};
const templateCache=new Map();
let queued=false;

const norm=value=>((Number(value)%360)+360)%360;
const separation=(a,b)=>Math.abs(((a-b+180)%360+360)%360-180);
function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
function write(slot,value){localStorage.setItem(KEYS[slot],JSON.stringify(value));try{window.dispatchEvent(new StorageEvent('storage',{key:KEYS[slot],newValue:localStorage.getItem(KEYS[slot]),storageArea:localStorage}))}catch(_){const event=new Event('storage');Object.defineProperty(event,'key',{value:KEYS[slot]});window.dispatchEvent(event)}}
function profile(value){return value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{}}
function placementSource(value){if(!value||typeof value!=='object')return[];const known=[value.placements,value.positions,value.points,value.bodies].find(item=>item&&typeof item==='object');const source=known||value;if(Array.isArray(source))return source.map((item,index)=>[String(item?.name||item?.label||item?.id||index),item]);return Object.entries(source).filter(([key,item])=>item&&typeof item==='object'&&!Array.isArray(item)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key)&&(Number.isFinite(Number(item.longitude))||item.sign||item.zodiac))}
function longitude(item){if(Number.isFinite(Number(item?.longitude)))return norm(item.longitude);const sign=SIGNS.indexOf(String(item?.sign||item?.zodiac||'').trim().toLowerCase());return sign<0?NaN:norm(sign*30+Number(item.degree||item.degrees||0)+Number(item.minute||item.minutes||0)/60+Number(item.second||item.seconds||0)/3600)}
function canonical(key,item){const registry=window.RelphiGlyphRegistry;if(!registry)return null;for(const candidate of [item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key]){if(candidate==null)continue;const raw=String(candidate).trim(),id=ALIASES[raw.toLowerCase()]||raw,entry=registry.resolve?.(id)||registry.get?.(id);if(entry)return entry}return null}
function records(value){return placementSource(value).map(([key,item])=>{const entry=canonical(key,item),degree=longitude(item);return entry&&Number.isFinite(degree)?{key,item,id:entry.id,name:entry.name,value:degree}:null}).filter(Boolean)}
function ascendant(value,list){const found=list.find(item=>item.id==='asc');if(found)return found.value;const raw=Number(profile(value).ascendant??value?.ascendant??value?.asc);return Number.isFinite(raw)?norm(raw):0}
function cusps(value,list){const p=profile(value);for(const raw of [p.houseCusps,p.cusps,value?.houseCusps,value?.cusps,value?.houses]){if(!raw)continue;const values=(Array.isArray(raw)?raw:Object.values(raw)).map(item=>typeof item==='object'?Number(item.longitude??item.value??item.cusp):Number(item)).slice(0,12);if(values.length===12&&values.every(Number.isFinite))return values.map(norm)}const asc=ascendant(value,list),system=String(p.houseSystem||value?.houseSystem||'whole-sign').toLowerCase(),start=system.includes('whole')?Math.floor(asc/30)*30:asc;return Array.from({length:12},(_,index)=>norm(start+index*30))}
function houseFor(value,houseCusps){for(let index=0;index<12;index++){const start=houseCusps[index],span=norm(houseCusps[(index+1)%12]-start)||30;if(norm(value-start)<span)return index+1}return 12}
function svg(name,attrs){const node=document.createElementNS(NS,name);Object.entries(attrs||{}).forEach(([key,value])=>node.setAttribute(key,String(value)));return node}
function point(radius,degree){const angle=(norm(degree)-180)*Math.PI/180;return{x:C.x+Math.cos(angle)*radius,y:C.y+Math.sin(angle)*radius}}
function annular(inner,outer,start,end){const span=norm(end-start)||360,large=span>180?1:0,a=point(outer,start),b=point(outer,start+span),c=point(inner,start+span),d=point(inner,start);return`M${a.x} ${a.y} A${outer} ${outer} 0 ${large} 1 ${b.x} ${b.y} L${c.x} ${c.y} A${inner} ${inner} 0 ${large} 0 ${d.x} ${d.y} Z`}
function radialLine(parent,inner,outer,degree,attrs){const a=point(inner,degree),b=point(outer,degree);parent.appendChild(svg('line',Object.assign({x1:a.x,y1:a.y,x2:b.x,y2:b.y},attrs||{})))}
function cloneTemplate(id,color,radius,circled,fill='#fffdf8',strokeWidth=2.35){const key=[id,color,radius,circled?'c':'p',fill,strokeWidth].join('|');if(templateCache.has(key))return templateCache.get(key).then(node=>node.cloneNode(true));const task=(async()=>{const host=svg('g'),component=window.RelphiGlyphComponent,entry=window.RelphiGlyphRegistry?.resolve?.(id)||window.RelphiGlyphRegistry?.get?.(id);if(!entry||!component?.createBubble)throw new Error('Canonical glyph unavailable: '+id);const bubble=component.createBubble(host,entry.id,{radius,padding:1,color,fill,strokeWidth});if(!circled){bubble.circle.style.opacity='0';bubble.circle.setAttribute('aria-hidden','true');bubble.root.dataset.circlePresentation='hidden-only'}await bubble.ready;return host})();templateCache.set(key,task);return task.then(node=>node.cloneNode(true))}
function collides(candidate,placed){return placed.some(other=>Math.hypot(candidate.x-other.x,candidate.y-other.y)<candidate.radius+other.radius+PLACEMENT.clearance)}
function spread(list){const placed=[],result=[],steps=Math.floor(PLACEMENT.tangentialLimit/PLACEMENT.tangentialStep);for(const record of [...list].sort((a,b)=>a.value-b.value)){let chosen=null;for(let step=0;step<=steps&&!chosen;step++){const magnitude=step*PLACEMENT.tangentialStep,offsets=step===0?[0]:[magnitude,-magnitude];for(const offset of offsets){for(const lane of PLACEMENT.lanes){const display=norm(record.value+offset),p=point(lane,display),candidate={x:p.x,y:p.y,radius:PLACEMENT.bubbleRadius};if(collides(candidate,placed))continue;chosen={...record,display,lane};placed.push(candidate);break}if(chosen)break}}if(!chosen){chosen={...record,display:record.value,lane:PLACEMENT.lanes[0]};const p=point(chosen.lane,chosen.display);placed.push({x:p.x,y:p.y,radius:PLACEMENT.bubbleRadius})}result.push(chosen)}return result}

async function drawWheel(slot,mount){
  const value=read(slot);if(!value)return;
  const list=records(value),houseCusps=cusps(value,list);
  mount.replaceChildren();
  const wheel=svg('svg',{class:'sky-placement-mini-wheel sky-foundation-wheel relphi-canonical-ready',viewBox:'0 0 600 600',role:'img','aria-label':`Sky ${slot} standalone zodiac wheel`});
  mount.appendChild(wheel);
  wheel.appendChild(svg('circle',{cx:C.x,cy:C.y,r:R.hOut+4,fill:'#fffdf8',stroke:'rgba(31,27,24,.14)'}));
  const layers={};['zodiac','houses','ticks','outlines','leaders','placements'].forEach(name=>{layers[name]=svg('g',{'data-mini-layer':name});wheel.appendChild(layers[name])});

  // Houses: same .5 rainbow fill and sky-colored radial dividers as comparison wheel.
  houseCusps.forEach((start,index)=>{
    const end=houseCusps[(index+1)%12],span=norm(end-start)||30,mid=start+span/2;
    layers.houses.appendChild(svg('path',{d:annular(R.hIn,R.hOut,start,end),fill:COLORS[index],'fill-opacity':'.5'}));
    radialLine(layers.houses,R.hIn,R.hOut,end,{stroke:SKY[slot],class:'sky-foundation-divider'});
    const hp=point((R.hIn+R.hOut)/2,mid),hn=svg('text',{x:hp.x,y:hp.y,class:'sky-foundation-house-number sky-placement-mini-house-number'});hn.textContent=String(index+1);layers.houses.appendChild(hn);
  });

  // Zodiac: same band proportions, opacity, dark boundaries, and black uncircled canonical signs.
  const glyphJobs=[];
  SIGNS.forEach((id,index)=>{
    const start=index*30;
    layers.zodiac.appendChild(svg('path',{d:annular(R.zIn,R.zOut,start,start+30),fill:COLORS[index],'fill-opacity':'.82'}));
    radialLine(layers.zodiac,R.zIn,R.zOut,start,{stroke:'#423b35','stroke-width':'1.35','vector-effect':'non-scaling-stroke'});
    const gp=point((R.zIn+R.zOut)/2,start+15),host=svg('g',{transform:`translate(${gp.x} ${gp.y})`,class:'sky-foundation-sign-glyph','data-zodiac-sign':id});
    layers.zodiac.appendChild(host);
    glyphJobs.push(cloneTemplate(id,'#171717',19,false,'#fffdf8',2.35).then(glyph=>host.appendChild(glyph)).catch(console.error));
  });

  // Same structural rings and degree ticks used by the comparison wheel.
  [R.zIn,R.zOut,R.hOut].forEach(radius=>layers.outlines.appendChild(svg('circle',{cx:C.x,cy:C.y,r:radius,class:'sky-foundation-ring'})));
  for(let degree=0;degree<360;degree++){
    const length=degree%10===0?12:degree%5===0?8:5,className=degree%10===0?'sky-foundation-tick sky-foundation-tick-major':'sky-foundation-tick';
    radialLine(layers.ticks,R.degree-length,R.degree+length,degree,{class:className});
  }

  // Ordinary placements use the comparison wheel's circled, white-filled, sky-color presentation.
  spread(list.filter(record=>!ANGLES.has(record.id))).forEach(record=>{
    const exact=point(R.degree,record.value),display=point(record.lane,record.display);
    layers.leaders.appendChild(svg('line',{x1:display.x,y1:display.y,x2:exact.x,y2:exact.y,stroke:SKY[slot],class:'sky-foundation-leader'}));
    const host=svg('g',{transform:`translate(${display.x} ${display.y})`,'data-sky':slot,'data-placement':record.id,'data-house':houseFor(record.value,houseCusps)});
    layers.placements.appendChild(host);
    glyphJobs.push(cloneTemplate(record.id,SKY[slot],16,true,'#fffdf8',2.35).then(glyph=>host.appendChild(glyph)).catch(console.error));
  });

  // Angles retain the comparison wheel convention: uncircled canonical identity with an exact radial axis.
  list.filter(record=>ANGLES.has(record.id)).forEach((record,index)=>{
    const lane=ANGLE.lanes[index%ANGLE.lanes.length],p=point(lane,record.value),lineInner=Math.min(ANGLE.edge,lane+ANGLE.lineGap),lineOuter=Math.max(ANGLE.edge,lane+ANGLE.lineGap);
    radialLine(layers.leaders,lineInner,lineOuter,record.value,{stroke:SKY[slot],class:'sky-foundation-angle-axis','stroke-width':'2.6','vector-effect':'non-scaling-stroke','data-sky':slot,'data-angle':record.id});
    const host=svg('g',{transform:`translate(${p.x} ${p.y})`,'data-sky':slot,'data-placement':record.id,'data-angle-axis':'true','data-house':houseFor(record.value,houseCusps)});
    layers.placements.appendChild(host);
    glyphJobs.push(cloneTemplate(record.id,SKY[slot],ANGLE.frameRadius,false,'#fffdf8',ANGLE.frameStrokeWidth).then(glyph=>host.appendChild(glyph)).catch(console.error));
  });

  await Promise.allSettled(glyphJobs);
  wheel.dataset.canonicalSourceReady='true';
}

function houseSystemControl(slot,value){const p=profile(value),current=String(p.houseSystem||value?.houseSystem||'whole-sign');const label=document.createElement('label');label.className='sky-placement-house-system';label.innerHTML=`<span>House System</span><select data-placement-house-system="${slot}">${Object.entries(SYSTEMS).map(([id,name])=>`<option value="${id}"${id===current?' selected':''}>${name}</option>`).join('')}</select>`;return label}
function changeHouseSystem(slot,system,select){try{const value=read(slot);if(!value)throw new Error(`Sky ${slot} is empty.`);const p=profile(value),source=value.placements&&typeof value.placements==='object'?value.placements:{},list=records(value),asc=list.find(item=>item.id==='asc'),mc=list.find(item=>item.id==='mc');if(!asc||!mc)throw new Error(`Sky ${slot} needs Ascendant and Midheaven.`);if(!window.RelphiHouseSystems||!window.Astronomy)throw new Error('The house calculation engine is unavailable.');const instant=new Date(p.instant||p.dateTime||Date.now()),longitudeValue=Number(p.longitude),latitude=Number(p.latitude);if(!Number.isFinite(longitudeValue)||!Number.isFinite(latitude))throw new Error(`Sky ${slot} needs resolved coordinates.`);const siderealDegrees=norm(window.Astronomy.SiderealTime(instant)*15+longitudeValue),obliquityDegrees=Number(window.Astronomy.e_tilt(instant).tobl),result=window.RelphiHouseSystems.calculateCusps({system,ascendant:asc.value,midheaven:mc.value,siderealDegrees,obliquityDegrees,latitude});value.calcProfile={...p,houseSystem:result.system,houseCusps:result.cusps,cusps:result.cusps,houseSystemNote:result.note};value.houseCusps=result.cusps;Object.values(source).forEach(item=>{if(Number.isFinite(Number(item?.longitude)))item.house=houseFor(Number(item.longitude),result.cusps)});select?.setCustomValidity('');write(slot,value);requestAnimationFrame(hydrate)}catch(error){console.error(error);if(select){select.setCustomValidity(error.message);select.reportValidity()}}}
function removeRelationshipHouseSystem(){document.querySelector('[data-house-system-filter]')?.closest('label')?.remove()}
function decoratePlacements(slot){const panel=document.getElementById(`skyFoundation${slot}`),view=panel?.querySelector('.sky-where-when-placement-view');if(!view||view.hidden)return;let shell=view.querySelector(':scope > .sky-placement-mini-shell');if(!shell){shell=document.createElement('section');shell.className='sky-placement-mini-shell';shell.innerHTML='<div class="sky-placement-mini-head"><strong>Standalone Sky</strong></div><div class="sky-placement-mini-wheel-mount"></div>';view.prepend(shell)}const head=shell.querySelector('.sky-placement-mini-head');head.querySelector('.sky-placement-house-system')?.remove();const value=read(slot);if(value)head.appendChild(houseSystemControl(slot,value));drawWheel(slot,shell.querySelector('.sky-placement-mini-wheel-mount')).catch(console.error)}
function installStyles(){if(document.getElementById('skyPlacementMiniWheelV2Styles'))return;document.getElementById('skyPlacementMiniWheelV1Styles')?.remove();const style=document.createElement('style');style.id='skyPlacementMiniWheelV2Styles';style.textContent=`.sky-placement-mini-shell{display:grid;gap:.45rem;margin:0 0 .7rem;padding:.55rem;border:1px solid rgba(31,27,24,.13);border-radius:12px;background:#fffdfa}.sky-placement-mini-head{display:flex;align-items:end;justify-content:space-between;gap:.55rem}.sky-placement-mini-head>strong{font:900 .72rem/1.2 system-ui,sans-serif}.sky-placement-house-system{display:grid;gap:3px;min-width:120px;color:#554c44;font:800 .58rem/1.2 system-ui,sans-serif}.sky-placement-house-system select{width:100%;min-width:0;border:1px solid rgba(31,27,24,.22);border-radius:8px;background:#fff;padding:.42rem .5rem;color:#211d19;font:750 .64rem/1.2 system-ui,sans-serif}.sky-placement-mini-wheel-mount{display:grid;place-items:center}.sky-placement-mini-wheel{display:block;width:min(100%,360px);height:auto;overflow:visible}.sky-placement-mini-wheel .sky-foundation-house-number{font-size:18px}.sky-placement-mini-wheel .sky-foundation-sign-glyph{filter:var(--sky-silver-glow,none)}.sky-chart-filter-bar>label:has([data-house-system-filter]){display:none!important}@media(max-width:620px){.sky-placement-mini-head{align-items:stretch;flex-direction:column}.sky-placement-house-system{width:100%}.sky-placement-mini-wheel{width:min(100%,320px)}}`;document.head.appendChild(style)}
function hydrate(){queued=false;removeRelationshipHouseSystem();decoratePlacements('A');decoratePlacements('B')}
function schedule(){if(!queued){queued=true;requestAnimationFrame(hydrate)}}
document.addEventListener('change',event=>{const select=event.target.closest('[data-placement-house-system]');if(!select)return;changeHouseSystem(select.dataset.placementHouseSystem,select.value,select)});
['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-house-multiselect-changed'].forEach(name=>window.addEventListener(name,schedule));
window.addEventListener('storage',event=>{if(Object.values(KEYS).includes(event.key))schedule()});
document.addEventListener('click',event=>{if(event.target.closest('.sky-where-when-actions [data-ww-action="placements"]'))setTimeout(schedule,0)},true);
function start(){installStyles();schedule()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();