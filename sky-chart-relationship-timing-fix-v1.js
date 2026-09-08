// Relationship timing and sort repair.
// Ensures timing sorts actually reorder the active relationship list and supplies
// timing for calculated/moving points that the legacy transit metadata cannot time.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiRelationshipTimingFixV1)return;
window.__relphiRelationshipTimingFixV1=true;

const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const BODY={sun:'Sun',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',uranus:'Uranus',neptune:'Neptune',pluto:'Pluto'};
const ANGLE={conjunction:0,'semi-sextile':30,octile:45,sextile:60,quintile:72,square:90,trine:120,'tri-octile':135,'bi-quintile':144,quincunx:150,opposition:180};
const ALIAS={rising:'asc',ascendant:'asc',asc:'asc',ac:'asc',descendant:'dsc',dsc:'dsc',dc:'dsc',midheaven:'mc',mc:'mc','imum coeli':'ic',imumcoeli:'ic',ic:'ic',vx:'vertex',vertex:'vertex','north node':'north-node',node:'north-node','true node':'north-node','mean node':'north-node','south node':'south-node',chiron:'chiron',lilith:'lilith','black moon lilith':'lilith',fortune:'part-of-fortune','part of fortune':'part-of-fortune',pof:'part-of-fortune'};
const SIGNS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
const LIVE_ORIGINS=new Set(['here-and-now','update-to-now','use-now']);
const DAY=86400000;
const MEAN_LUNAR_INCLINATION=5.1453964;
const MIN_STEP={asc:.0007,dsc:.0007,mc:.0007,ic:.0007,vertex:.0007,'part-of-fortune':.0007,moon:.01,mercury:.03,venus:.04,mars:.06,sun:.06,jupiter:.12,saturn:.18,uranus:.25,neptune:.3,pluto:.35,chiron:.18,'north-node':.15,'south-node':.15,lilith:.15};
const MAX_STEP={asc:.01,dsc:.01,mc:.01,ic:.01,vertex:.01,'part-of-fortune':.01,moon:.2,mercury:.5,venus:.7,mars:1,sun:1,jupiter:4,saturn:7,uranus:10,neptune:12,pluto:14,chiron:4,'north-node':5,'south-node':5,lilith:5};
const MIN_HORIZON={asc:2,dsc:2,mc:2,ic:2,vertex:2,'part-of-fortune':2,moon:45,mercury:400,venus:700,mars:1200,sun:800,jupiter:3000,saturn:4500,uranus:6000,neptune:7000,pluto:8000,chiron:3000,'north-node':4000,'south-node':4000,lilith:2500};
const MAX_HORIZON=12000;
const TIMING_MODES=new Set(['duration-longest','duration-shortest','began-most-recently','ends-soonest','ends-last']);
const cache=new Map();
const readCache={A:{raw:null,value:null},B:{raw:null,value:null}};
const recordCache=new WeakMap(),profileDateCache=new WeakMap(),liveOriginCache=new WeakMap();
let observer=null,queued=false,baseApi=null;

const norm=value=>((Number(value)%360)+360)%360;
const wrap=value=>((Number(value)+540)%360)-180;
const rad=value=>Number(value)*Math.PI/180;
const deg=value=>Number(value)*180/Math.PI;
function clamp(value,min,max){return Math.max(min,Math.min(max,value))}
function read(slot){
  const raw=localStorage.getItem(KEYS[slot])||'null',entry=readCache[slot];
  if(entry.raw===raw)return entry.value;
  let value=null;try{value=JSON.parse(raw)}catch(_){}
  entry.raw=raw;entry.value=value;return value;
}
function source(payload){const raw=[payload?.placements,payload?.positions,payload?.points,payload?.bodies].find(value=>value&&typeof value==='object')||payload||{};return Array.isArray(raw)?raw.map((value,index)=>[String(value?.name||value?.id||index),value]):Object.entries(raw)}
function longitudeValue(item){if(Number.isFinite(Number(item?.longitude)))return norm(item.longitude);const sign=SIGNS.indexOf(String(item?.sign||item?.zodiac||'').trim().toLowerCase());return sign<0?NaN:norm(sign*30+Number(item.degree||item.degrees||0)+Number(item.minute||item.minutes||0)/60+Number(item.second||item.seconds||0)/3600)}
function canonicalId(key,item){const registry=window.RelphiGlyphRegistry;for(const candidate of[item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key]){if(candidate==null)continue;const raw=String(candidate).trim(),id=ALIAS[raw.toLowerCase()]||raw,entry=registry?.resolve?.(id)||registry?.get?.(id);if(entry?.id)return entry.id}return''}
function recordMap(slot){
  const payload=read(slot);if(!payload||typeof payload!=='object')return null;
  if(recordCache.has(payload))return recordCache.get(payload);
  const map=new Map();
  for(const[key,item]of source(payload)){
    if(!item||typeof item!=='object'||Array.isArray(item))continue;
    const id=canonicalId(key,item),value=longitudeValue(item);
    if(id&&Number.isFinite(value)&&!map.has(id))map.set(id,{id,value});
  }
  recordCache.set(payload,map);return map;
}
function findRecord(slot,id){return recordMap(slot)?.get(id)||null}
function profile(slot){const value=read(slot);return value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{}}
function profileDate(slot){
  const payload=read(slot);if(!payload||typeof payload!=='object')return null;
  if(profileDateCache.has(payload))return profileDateCache.get(payload);
  const p=profile(slot),raw=p.instant||p.dateTime||payload.instant||payload.dateTime;
  let result=null;
  if(raw){
    if(p.instant){const date=new Date(p.instant);if(Number.isFinite(date.getTime()))result=date}
    if(!result)try{if(window.luxon?.DateTime&&p.timeZone){const dt=window.luxon.DateTime.fromISO(String(p.dateTime||raw),{zone:String(p.timeZone),setZone:true});if(dt?.isValid)result=dt.toUTC().toJSDate()}}catch(_){}
    if(!result){const date=new Date(raw);if(Number.isFinite(date.getTime()))result=date}
  }
  profileDateCache.set(payload,result);return result;
}
function liveOrigin(slot){
  const payload=read(slot);if(!payload||typeof payload!=='object')return'';
  if(liveOriginCache.has(payload))return liveOriginCache.get(payload);
  const metadata=payload.metadata&&typeof payload.metadata==='object'?payload.metadata:{},explicit=String(metadata.liveNowOrigin||'');
  let result='';
  if(LIVE_ORIGINS.has(explicit))result=explicit;
  else{
    const p=profile(slot),name=String(payload.name||payload.title||'').trim().toLowerCase(),query=String(p.locationQuery||'').trim().toLowerCase(),location=String(p.location||'').trim().toLowerCase(),saved=!!(metadata.savedSkyId||metadata.savedSkyName||metadata.savedSkyLoadedAt);
    if(!saved&&name==='now'){if(query==='my current location')result='update-to-now';else if(query==='current location'||location==='current location')result='here-and-now'}
  }
  liveOriginCache.set(payload,result);return result;
}
function isLive(slot){return LIVE_ORIGINS.has(liveOrigin(slot))}
function rowSky(row,side){const explicit=row.dataset[side==='left'?'leftSky':'rightSky'];if(explicit==='A'||explicit==='B')return explicit;const mode=String(row.dataset.relationshipMode||'A-B');if(mode==='A-A')return'A';if(mode==='B-B')return'B';return side==='left'?'A':'B'}
function angularLimit(row){const aspect=String(row.dataset.aspect||''),model=window.RelphiHarmonicOrb,entry=model?.byId?.(aspect),harmonic=Number(row.dataset.harmonicOrder||entry?.harmonic||1)||1,input=document.querySelector('[data-harmonic-window-input]'),phase=Number(String(input?.value??model?.defaultWindow??6).replace(',','.')),safe=Number.isFinite(phase)&&phase>=0?phase:Number(model?.defaultWindow)||6;return Math.max(.0001,safe/harmonic)}
function julianCenturies(date){return((date.getTime()/DAY+2440587.5)-2451545)/36525}
function meanNodeLongitude(date){const T=julianCenturies(date);return norm(125.04452-1934.136261*T+.0020708*T*T+(T*T*T)/450000)}
function meanLilithLongitude(date){
  const T=julianCenturies(date),perigee=83.3532465+4069.0137287*T-.01032*T*T-(T*T*T)/80053+(T*T*T*T)/18999000,apogee=norm(perigee+180),node=meanNodeLongitude(date),relative=rad(norm(apogee-node));
  return norm(deg(Math.atan2(Math.sin(relative)*Math.cos(rad(MEAN_LUNAR_INCLINATION)),Math.cos(relative)))+node);
}
function siderealDegrees(date,longitude){const A=window.Astronomy;return A?.SiderealTime?norm(A.SiderealTime(date)*15+Number(longitude||0)):NaN}
function obliquity(date){const A=window.Astronomy;return A?.e_tilt?Number(A.e_tilt(date).tobl):NaN}
function ascendantLongitude(date,slot){const p=profile(slot),latitude=Number(p.latitude),longitude=Number(p.longitude);if(!Number.isFinite(latitude)||!Number.isFinite(longitude))return NaN;const theta=siderealDegrees(date,longitude)*Math.PI/180,phi=latitude*Math.PI/180,epsilon=obliquity(date)*Math.PI/180;if(![theta,phi,epsilon].every(Number.isFinite))return NaN;return norm(Math.atan2(-Math.cos(theta),Math.sin(theta)*Math.cos(epsilon)+Math.tan(phi)*Math.sin(epsilon))*180/Math.PI+180)}
function midheavenLongitude(date,slot){const p=profile(slot),longitude=Number(p.longitude);if(!Number.isFinite(longitude))return NaN;const theta=siderealDegrees(date,longitude)*Math.PI/180,epsilon=obliquity(date)*Math.PI/180;if(![theta,epsilon].every(Number.isFinite))return NaN;return norm(Math.atan2(Math.sin(theta),Math.cos(theta)*Math.cos(epsilon))*180/Math.PI)}
function vertexLongitude(date,slot){const p=profile(slot),latitude=Number(p.latitude),longitude=Number(p.longitude);if(!Number.isFinite(latitude)||!Number.isFinite(longitude))return NaN;const armc=siderealDegrees(date,longitude),epsilon=obliquity(date);if(!Number.isFinite(armc)||!Number.isFinite(epsilon))return NaN;const x=norm(armc-90),poleLatitude=latitude>=0?90-latitude:-90-latitude,numerator=Math.sin(rad(x)),denominator=Math.cos(rad(epsilon))*Math.cos(rad(x))-Math.sin(rad(epsilon))*Math.tan(rad(poleLatitude));let vertex=norm(deg(Math.atan2(numerator,denominator)));if(Math.abs(latitude)<=epsilon){const mc=midheavenLongitude(date,slot);if(Number.isFinite(mc)&&wrap(vertex-mc)>0)vertex=norm(vertex+180)}return vertex}
function fortuneLongitude(date,slot){
  const asc=ascendantLongitude(date,slot),sun=ephemerisLongitude('sun',date,slot),moon=ephemerisLongitude('moon',date,slot),p=profile(slot),latitude=Number(p.latitude),longitude=Number(p.longitude);
  if(![asc,sun,moon].every(Number.isFinite))return NaN;
  let day=true;
  try{if(window.SunCalc&&Number.isFinite(latitude)&&Number.isFinite(longitude))day=window.SunCalc.getPosition(date,latitude,longitude).altitude>0}catch(_){}
  return norm(day?asc+moon-sun:asc+sun-moon);
}
function ephemerisLongitude(id,date,slot){
  if(id==='north-node')return meanNodeLongitude(date);
  if(id==='south-node')return norm(meanNodeLongitude(date)+180);
  if(id==='lilith')return meanLilithLongitude(date);
  if(id==='vertex')return vertexLongitude(date,slot);
  if(id==='part-of-fortune')return fortuneLongitude(date,slot);
  if(id==='asc')return ascendantLongitude(date,slot);
  if(id==='dsc'){const value=ascendantLongitude(date,slot);return Number.isFinite(value)?norm(value+180):NaN}
  if(id==='mc')return midheavenLongitude(date,slot);
  if(id==='ic'){const value=midheavenLongitude(date,slot);return Number.isFinite(value)?norm(value+180):NaN}
  if(id==='chiron'){
    try{return Number(window.RelphiChironEphemeris?.calculateSync?.(date)?.longitude)}catch(_){return NaN}
  }
  const astronomy=window.Astronomy,bodyName=BODY[id],bodyValue=astronomy?.Body?.[bodyName]||bodyName;
  if(!bodyName||!astronomy?.GeoVector||!astronomy?.Ecliptic||!bodyValue)return NaN;
  try{if(id==='moon'&&typeof astronomy.EclipticGeoMoon==='function')return norm(astronomy.EclipticGeoMoon(date).lon);return norm(astronomy.Ecliptic(astronomy.GeoVector(bodyValue,date,true)).elon)}catch(_){return NaN}
}
function endpoint(row,side){const sky=rowSky(row,side),id=String(row.dataset[side==='left'?'leftPlacement':'rightPlacement']||''),record=findRecord(sky,id),date=profileDate(sky);return{side,sky,id,record,date,live:isLive(sky),timed:!!date}}
function signedAspectError(a,b,angle){const delta=wrap(Number(a)-Number(b)),positive=wrap(delta-angle),negative=wrap(delta+angle);return Math.abs(positive)<=Math.abs(negative)?positive:negative}
function modelFor(row){
  const aspect=String(row?.dataset?.aspect||''),angle=ANGLE[aspect];if(!Number.isFinite(angle))return null;
  const left=endpoint(row,'left'),right=endpoint(row,'right'),limit=angularLimit(row);if(!left.record||!right.record)return null;
  const sameSky=left.sky===right.sky,timedIntrasky=sameSky&&left.timed&&right.timed;
  let movingEndpoints=[];
  if(timedIntrasky)movingEndpoints=[left,right];
  else{
    const live=[left,right].filter(ep=>ep.live&&ep.timed);
    if(live.length)movingEndpoints=live;else if(right.timed)movingEndpoints=[right];else if(left.timed)movingEndpoints=[left];
  }
  if(!movingEndpoints.length)return null;
  const center=(timedIntrasky?left.date:movingEndpoints[0].date).getTime(),movingSet=new Set(movingEndpoints),centerEphemeris=new Map();
  for(const ep of movingEndpoints){const value=ephemerisLongitude(ep.id,ep.date,ep.sky);if(!Number.isFinite(value))return null;centerEphemeris.set(ep,value)}
  const valueAt=(ep,ms)=>{
    if(!movingSet.has(ep))return ep.record.value;
    const baseline=centerEphemeris.get(ep),date=new Date(ep.date.getTime()+(ms-center)),value=ephemerisLongitude(ep.id,date,ep.sky);
    return Number.isFinite(value)?norm(ep.record.value+wrap(value-baseline)):NaN;
  };
  const signedErrorAt=ms=>{const a=valueAt(left,ms),b=valueAt(right,ms);return Number.isFinite(a)&&Number.isFinite(b)?signedAspectError(a,b,angle):NaN};
  return{row,left,right,limit,center,movingEndpoints,valueAt,signedErrorAt,errorAt:ms=>Math.abs(signedErrorAt(ms))};
}
function speedEstimate(model){const half=.04,a=model.signedErrorAt(model.center-half*DAY),b=model.signedErrorAt(model.center+half*DAY);return Number.isFinite(a)&&Number.isFinite(b)?Math.abs(wrap(b-a))/(2*half):NaN}
function settings(model){
  const ids=model.movingEndpoints.map(ep=>ep.id),minStep=Math.min(...ids.map(id=>MIN_STEP[id]??.05)),maxStep=Math.min(...ids.map(id=>MAX_STEP[id]??2)),minHorizon=Math.max(...ids.map(id=>MIN_HORIZON[id]??1200)),speed=speedEstimate(model),estimate=Number.isFinite(speed)&&speed>1e-6?model.limit/speed:NaN;
  return{step:Number.isFinite(estimate)?clamp(estimate/5,minStep,maxStep):maxStep,horizon:Math.min(MAX_HORIZON,Math.max(minHorizon,Number.isFinite(estimate)?estimate*16:0))};
}
function refineBoundary(insideMs,outsideMs,inside){let yes=insideMs,no=outsideMs;for(let i=0;i<32;i++){const mid=(yes+no)/2;if(inside(mid))yes=mid;else no=mid}return(yes+no)/2}
function root(a,b,fn){let fa=fn(a),fb=fn(b);if(!Number.isFinite(fa)||!Number.isFinite(fb)||Math.sign(fa)===Math.sign(fb))return NaN;for(let i=0;i<36;i++){const mid=(a+b)/2,fm=fn(mid);if(!Number.isFinite(fm))return NaN;if(Math.abs(fm)<1e-10)return mid;if(Math.sign(fa)===Math.sign(fm)){a=mid;fa=fm}else{b=mid;fb=fm}}return(a+b)/2}
function currentWindow(model){
  const{step,horizon}=settings(model),inside=ms=>model.errorAt(ms)<=model.limit+1e-8;
  if(!inside(model.center))return null;
  function boundary(direction){
    let last=model.center;
    for(let day=step;day<=horizon+1e-9;day+=step){const next=model.center+direction*Math.min(day,horizon)*DAY;if(!inside(next))return refineBoundary(last,next,inside);last=next}
    return NaN;
  }
  const startMs=boundary(-1),endMs=boundary(1);if(!Number.isFinite(startMs)||!Number.isFinite(endMs)||endMs<=startMs)return null;
  const exacts=[],sampleStep=Math.max(step,(endMs-startMs)/DAY/80),firstError=model.signedErrorAt(startMs);let previous={ms:startMs,error:firstError};
  for(let ms=Math.min(endMs,startMs+sampleStep*DAY);ms<=endMs+1;ms=Math.min(endMs,ms+sampleStep*DAY)){
    const current={ms,error:model.signedErrorAt(ms)};
    if(Number.isFinite(previous.error)&&Number.isFinite(current.error)&&Math.sign(previous.error)!==Math.sign(current.error)){
      const exact=root(previous.ms,current.ms,model.signedErrorAt);if(Number.isFinite(exact)&&!exacts.some(value=>Math.abs(value-exact)<.0005*DAY))exacts.push(exact);
    }
    if(ms===endMs)break;previous=current;
  }
  return{startMs,endMs,exacts,durationDays:(endMs-startMs)/DAY};
}
function signature(row){return[row?.dataset?.relationshipMode||'',row?.dataset?.relationIndex||'',row?.dataset?.aspect||'',row?.dataset?.leftPlacement||'',row?.dataset?.rightPlacement||'',angularLimit(row).toFixed(8),['A','B'].map(slot=>`${slot}:${profileDate(slot)?.toISOString()||''}:${liveOrigin(slot)}`).join('|')].join('|')}
function timingForRow(row){
  if(!row?.isConnected)return null;const key=signature(row);if(cache.has(key))return cache.get(key);
  const model=modelFor(row),timeline=model?currentWindow(model):null,result=timeline?{model,timeline,durationDays:timeline.durationDays,endsInDays:(timeline.endMs-model.center)/DAY,startedDaysAgo:(model.center-timeline.startMs)/DAY}:null;
  cache.set(key,result);return result;
}
function writeTiming(row,timing){
  if(Number.isFinite(timing?.durationDays))row.dataset.transitDurationDays=String(timing.durationDays);else delete row.dataset.transitDurationDays;
  if(Number.isFinite(timing?.endsInDays))row.dataset.transitEndsInDays=String(timing.endsInDays);else delete row.dataset.transitEndsInDays;
  if(Number.isFinite(timing?.startedDaysAgo))row.dataset.transitStartedDaysAgo=String(timing.startedDaysAgo);else delete row.dataset.transitStartedDaysAgo;
}
function estimatedTimingForRow(row){const timing=timingForRow(row);writeTiming(row,timing);return timing}
function exportTimingForRow(row){
  const original=baseApi?.exportTimingForRow?.(row);if(original?.kind==='dynamic')return original;
  const timing=timingForRow(row);if(!timing)return original||{kind:'unavailable',reason:'Timing unavailable.'};
  return{kind:'dynamic',startMs:timing.timeline.startMs,endMs:timing.timeline.endMs,exacts:[...timing.timeline.exacts],durationDays:timing.durationDays,passCount:timing.timeline.exacts.length,motion:'',timingConvention:'calculated-point-fallback'};
}
function clearDurationCache(){
  cache.clear();baseApi?.clearDurationCache?.();
  document.querySelectorAll('#skyFoundationRelationshipList .sky-foundation-relationship-row').forEach(row=>{delete row.dataset.transitDurationDays;delete row.dataset.transitEndsInDays;delete row.dataset.transitStartedDaysAgo});
}
function installApi(){
  const current=window.RelphiRelationshipTransitMeta;if(current?.__timingFixV1)return;
  baseApi=current||null;
  window.RelphiRelationshipTransitMeta=Object.freeze({...(current||{}),__timingFixV1:true,estimatedTimingForRow,exportTimingForRow,clearDurationCache});
}
function applySort(){
  const list=document.getElementById('skyFoundationRelationshipList'),compare=window.RelphiRelationshipSort?.compareRows;if(!list||typeof compare!=='function')return;
  const rows=[...list.querySelectorAll(':scope>.sky-foundation-relationship-row')];rows.sort((a,b)=>compare(a,b));rows.forEach(row=>list.appendChild(row));
}
function durationLabel(days){if(days<1){const minutes=days*24*60;if(minutes<90)return`${Math.max(1,Math.round(minutes))} min`;return`${Math.max(1,Math.round(days*24*10)/10)} hr`}if(days<14)return`${Math.round(days*10)/10} days`;if(days<75)return`${Math.round(days)} days`;if(days<730)return`${Math.round(days/30.4375*10)/10} months`;return`${Math.round(days/365.25*10)/10} years`}
function dateLabel(ms){return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(ms))}
function rowMarkup(label,value){const line=document.createElement('span');line.className='inline-rel-transit-row';const key=document.createElement('b');key.textContent=label;const text=document.createElement('span');text.textContent=value;line.append(key,text);return line}
function patchExpanded(){
  queued=false;installApi();
  const row=document.querySelector('#skyFoundationRelationshipList .sky-foundation-relationship-row.is-inline-expanded');if(!row)return;
  const meta=row.querySelector(':scope>.inline-rel-detail .inline-rel-progressive-strip [data-inline-progressive-token="aspect"]>.inline-rel-transit-window');
  if(!meta||meta.dataset.transitKind!=='unavailable')return;
  const timing=timingForRow(row);if(!timing)return;
  const exactText=timing.timeline.exacts.length?timing.timeline.exacts.map(dateLabel).join(' · '):'near pass',passText=timing.timeline.exacts.length===1?'1 exact pass':`${timing.timeline.exacts.length} exact passes`;
  meta.replaceChildren(rowMarkup('Start',dateLabel(timing.timeline.startMs)),rowMarkup('Exact',exactText),rowMarkup('End',dateLabel(timing.timeline.endMs)),rowMarkup('Duration',durationLabel(timing.durationDays)),rowMarkup('Passes',passText));
  meta.dataset.transitReady='true';meta.dataset.transitKind='dynamic';meta.title=`Active from ${dateLabel(timing.timeline.startMs)} to ${dateLabel(timing.timeline.endMs)}; ${durationLabel(timing.durationDays)} current activation window.`;meta.setAttribute('aria-label',meta.title);
}
function schedulePatch(delay=0){if(queued)return;queued=true;setTimeout(()=>requestAnimationFrame(patchExpanded),delay)}
function invalidate(){cache.clear();installApi();schedulePatch(30)}
function primeChiron(){
  const service=window.RelphiChironEphemeris;if(!service?.ready)return;
  service.ready().then(()=>{
    invalidate();
    document.querySelectorAll('#skyFoundationRelationshipList .inline-rel-transit-window[data-transit-kind="unavailable"]').forEach(meta=>{meta.dataset.transitReady='false';delete meta.dataset.transitSignature});
    schedulePatch(0);
    const sort=window.RelphiRelationshipSort,mode=sort?.mode?.();if(TIMING_MODES.has(mode))sort.setMode?.(mode);
  }).catch(error=>console.error('[Relationship timing Chiron]',error));
}
function start(){
  installApi();
  window.addEventListener('relphi:relationship-sort-changed',()=>requestAnimationFrame(applySort));
  ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-intrasky-relationships-ready','relphi:sky-intrasky-b-relationships-ready','relphi:sky-harmonic-window-visibility-changed','relphi:sky-live-origin-changed','relphi:relationship-display-changed'].forEach(name=>window.addEventListener(name,()=>{invalidate();requestAnimationFrame(applySort)}));
  document.addEventListener('click',event=>{if(event.target.closest?.('.sky-foundation-relationship-row[data-relation-index]'))schedulePatch(80)},true);
  const list=document.getElementById('skyFoundationRelationshipList');if(list){observer=new MutationObserver(()=>schedulePatch(60));observer.observe(list,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-transit-kind']})}
  primeChiron();
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();