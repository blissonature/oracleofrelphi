// Compact ephemeris timing for fully expanded relationship tiles.
// Adds current transit-window length and direct/retrograde state to the existing orb line
// without increasing the expanded tile's vertical structure.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiRelationshipTransitMetaV1)return;
window.__relphiRelationshipTransitMetaV1=true;

const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const BODY={sun:'Sun',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',uranus:'Uranus',neptune:'Neptune',pluto:'Pluto'};
const ANGLE={conjunction:0,'semi-sextile':30,octile:45,sextile:60,quintile:72,square:90,trine:120,'tri-octile':135,'bi-quintile':144,quincunx:150,opposition:180};
const STEP={moon:.03,mercury:.12,venus:.18,mars:.3,sun:.2,jupiter:.6,saturn:.9,uranus:1.25,neptune:1.5,pluto:1.75};
const HORIZON={moon:24,mercury:300,venus:520,mars:900,sun:450,jupiter:1600,saturn:2200,uranus:3000,neptune:3400,pluto:3800};
const SIGNS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
const ALIAS={rising:'asc',ascendant:'asc',ac:'asc',descendant:'dsc',dc:'dsc',midheaven:'mc','imum coeli':'ic',imumcoeli:'ic',vx:'vertex','north node':'north-node',node:'north-node','true node':'north-node','south node':'south-node',fortune:'part-of-fortune','part of fortune':'part-of-fortune',pof:'part-of-fortune'};
const DAY=86400000;
let generation=0,observer=null,observedList=null;

const norm=value=>((Number(value)%360)+360)%360;
const wrap=value=>((Number(value)+540)%360)-180;
function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
function source(payload){const raw=[payload?.placements,payload?.positions,payload?.points,payload?.bodies].find(value=>value&&typeof value==='object')||payload||{};return Array.isArray(raw)?raw.map((value,index)=>[String(value?.name||value?.id||index),value]):Object.entries(raw)}
function longitudeValue(item){if(Number.isFinite(Number(item?.longitude)))return norm(item.longitude);const sign=SIGNS.indexOf(String(item?.sign||item?.zodiac||'').trim().toLowerCase());return sign<0?NaN:norm(sign*30+Number(item.degree||item.degrees||0)+Number(item.minute||item.minutes||0)/60+Number(item.second||item.seconds||0)/3600)}
function canonicalId(key,item){const registry=window.RelphiGlyphRegistry;for(const candidate of [item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key]){if(candidate==null)continue;const raw=String(candidate).trim(),id=ALIAS[raw.toLowerCase()]||raw,entry=registry?.resolve?.(id)||registry?.get?.(id);if(entry?.id)return entry.id}return''}
function findRecord(slot,id){for(const[key,item]of source(read(slot))){if(!item||typeof item!=='object'||Array.isArray(item))continue;if(canonicalId(key,item)!==id)continue;const value=longitudeValue(item);if(Number.isFinite(value))return{id,value}}return null}
function profileDate(slot){const payload=read(slot),profile=payload?.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:payload,raw=profile?.instant||profile?.dateTime;if(!raw)return null;const date=new Date(raw);return Number.isFinite(date.getTime())?date:null}
function movingSlot(){
  const a=read('A'),b=read('B'),an=String(a?.name||''),bn=String(b?.name||''),dynamic=/planetary hours|transit|current sky|\bnow\b/i,staticSky=/birth|natal|static|fixed/i;
  try{const roles=window.RelphiSkyRoles||JSON.parse(localStorage.getItem('relphiSkyChartRoles')||'null');if(roles?.chart==='dynamic'&&roles?.currentSky!=='dynamic')return'A';if(roles?.currentSky==='dynamic'&&roles?.chart!=='dynamic')return'B'}catch(_){}
  if(dynamic.test(an)!==dynamic.test(bn))return dynamic.test(an)?'A':'B';
  if(staticSky.test(an)!==staticSky.test(bn))return staticSky.test(an)?'B':'A';
  const ad=profileDate('A'),bd=profileDate('B');
  if(ad&&bd&&Math.abs(ad-bd)>DAY)return ad>bd?'A':'B';
  return null;
}
function angularLimit(row){
  const aspect=String(row.dataset.aspect||''),model=window.RelphiHarmonicOrb,entry=model?.byId?.(aspect),harmonic=Number(row.dataset.harmonicOrder||entry?.harmonic||1)||1;
  const input=document.querySelector('[data-harmonic-window-input]'),phase=Number(String(input?.value??model?.defaultWindow??6).replace(',','.'));
  const safePhase=Number.isFinite(phase)&&phase>=0?phase:Number(model?.defaultWindow)||6;
  return Math.max(.0001,safePhase/harmonic);
}
function astronomyLongitude(body,date){const astronomy=window.Astronomy,bodyValue=astronomy?.Body?.[BODY[body]]||BODY[body];if(!astronomy?.GeoVector||!astronomy?.Ecliptic||!bodyValue)return NaN;return astronomy.Ecliptic(astronomy.GeoVector(bodyValue,date,true)).elon}
function modelFor(row){
  const moving=movingSlot();if(!moving||!window.Astronomy)return null;
  const movingId=String(row.dataset[moving==='A'?'leftPlacement':'rightPlacement']||''),fixedId=String(row.dataset[moving==='A'?'rightPlacement':'leftPlacement']||''),angle=ANGLE[String(row.dataset.aspect||'')],date=profileDate(moving);
  if(!BODY[movingId]||!fixedId||!Number.isFinite(angle)||!date)return null;
  const fixed=findRecord(moving==='A'?'B':'A',fixedId);if(!fixed)return null;
  return{moving,movingId,fixedId,fixedLongitude:fixed.value,angle,date,limit:angularLimit(row),step:STEP[movingId]||.5,horizon:HORIZON[movingId]||1200};
}
function analyzer(model){
  const targetA=model.fixedLongitude+model.angle,targetB=model.fixedLongitude-model.angle;
  const errorAt=ms=>{const value=astronomyLongitude(model.movingId,new Date(ms));if(!Number.isFinite(value))return Infinity;const a=Math.abs(wrap(value-targetA)),b=Math.abs(wrap(value-targetB));return Math.min(a,b)};
  const speedAt=ms=>wrap(astronomyLongitude(model.movingId,new Date(ms+.06*DAY))-astronomyLongitude(model.movingId,new Date(ms-.06*DAY)))/.12;
  return{errorAt,speedAt};
}
function refineEdge(insideMs,outsideMs,inside){let yes=insideMs,no=outsideMs;for(let index=0;index<28;index+=1){const mid=(yes+no)/2;if(inside(mid))yes=mid;else no=mid}return(yes+no)/2}
function findEdge(center,direction,stepDays,horizonDays,inside){let lastInside=center;for(let elapsed=stepDays;elapsed<=horizonDays;elapsed+=stepDays){const candidate=center+direction*elapsed*DAY;if(!inside(candidate))return refineEdge(lastInside,candidate,inside);lastInside=candidate}return null}
function durationLabel(days){
  if(days<1)return`${Math.max(1,Math.round(days*24))}h`;
  if(days<14)return`${Math.round(days*10)/10}d`;
  if(days<75)return`${Math.round(days)}d`;
  if(days<730)return`${Math.round(days/30.4375*10)/10}mo`;
  return`${Math.round(days/365.25*10)/10}y`;
}
function bodyName(id){const entry=window.RelphiGlyphRegistry?.get?.(id)||window.RelphiGlyphRegistry?.resolve?.(id);return entry?.name||id}
function ensureMeta(row){
  const orb=row.querySelector(':scope>.inline-rel-detail .inline-rel-orb');if(!orb)return null;
  let meta=orb.querySelector(':scope>.inline-rel-transit-meta');if(!meta){meta=document.createElement('small');meta.className='inline-rel-transit-meta';meta.hidden=true;orb.appendChild(meta)}return meta;
}
function finish(row,result){
  const meta=ensureMeta(row);if(!meta)return;
  meta.dataset.transitReady='true';
  if(!result){meta.hidden=true;meta.textContent='';meta.removeAttribute('title');return}
  meta.hidden=false;meta.classList.toggle('is-retrograde',result.retrograde);meta.textContent=`· ${result.duration} · ${result.retrograde?'Rx':'Dir'}`;
  const motion=result.retrograde?'retrograde':'direct';meta.title=`Transit window ${result.duration} at the current Harmonic Window; ${result.name} is ${motion}.`;meta.setAttribute('aria-label',`Transit length ${result.duration}; ${result.name} ${motion}`);
}
function calculate(row,token){
  if(!row?.isConnected||!row.classList.contains('is-inline-expanded'))return;
  const model=modelFor(row);if(!model){finish(row,null);return}
  const {errorAt,speedAt}=analyzer(model),center=model.date.getTime(),inside=ms=>errorAt(ms)<=model.limit;
  if(!inside(center)){finish(row,null);return}
  const start=findEdge(center,-1,model.step,model.horizon,inside),end=findEdge(center,1,model.step,model.horizon,inside);
  if(token!==generation||!row.isConnected||!row.classList.contains('is-inline-expanded'))return;
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start){finish(row,null);return}
  const days=(end-start)/DAY,speed=speedAt(center);
  finish(row,{duration:durationLabel(days),retrograde:Number.isFinite(speed)&&speed<0,name:bodyName(model.movingId)});
}
function decorate(){
  const row=document.querySelector('#skyFoundationRelationshipList .sky-foundation-relationship-row.is-inline-expanded');if(!row)return;
  const meta=ensureMeta(row);if(!meta)return;
  const signature=[row.dataset.relationIndex,row.dataset.aspect,row.dataset.leftPlacement,row.dataset.rightPlacement,document.querySelector('[data-harmonic-window-input]')?.value||''].join('|');
  if(meta.dataset.transitSignature===signature&&meta.dataset.transitReady==='true')return;
  meta.dataset.transitSignature=signature;meta.dataset.transitReady='false';
  const token=++generation;meta.hidden=false;meta.textContent='· …';meta.removeAttribute('title');
  const run=()=>calculate(row,token);
  if('requestIdleCallback'in window)requestIdleCallback(run,{timeout:120});else setTimeout(run,0);
}
function schedule(){requestAnimationFrame(()=>requestAnimationFrame(decorate))}
function relevantMutation(record){
  if(record.type==='attributes'&&record.attributeName==='class'&&record.target?.classList?.contains('sky-foundation-relationship-row'))return true;
  if(record.type!=='childList')return false;
  return Array.from(record.addedNodes||[]).some(node=>node.nodeType===1&&(node.matches?.('.inline-rel-detail,.sky-foundation-relationship-row')||node.querySelector?.('.inline-rel-detail')));
}
function attach(){
  const list=document.getElementById('skyFoundationRelationshipList');if(!list||list===observedList)return;
  observer?.disconnect();observedList=list;observer=new MutationObserver(records=>{if(records.some(relevantMutation))schedule()});observer.observe(list,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});schedule();
}
function installStyles(){if(document.getElementById('skyRelationshipTransitMetaV1Styles'))return;const style=document.createElement('style');style.id='skyRelationshipTransitMetaV1Styles';style.textContent=`
  .inline-rel-orb{width:min(100%,168px)!important;gap:4px!important;white-space:nowrap!important}
  .inline-rel-transit-meta{display:inline!important;flex:0 0 auto!important;margin:0!important;padding:0!important;background:none!important;color:#655d56!important;font:850 .5rem/1 system-ui,sans-serif!important;font-variant-numeric:tabular-nums!important;white-space:nowrap!important;overflow:visible!important}
  .inline-rel-transit-meta.is-retrograde{color:#8f312b!important}
  .inline-rel-transit-meta[hidden]{display:none!important}
  @media(max-width:620px){.inline-rel-orb{width:100%!important;gap:3px!important}.inline-rel-orb>span{width:46px!important}.inline-rel-transit-meta{font-size:.47rem!important}}
`;document.head.appendChild(style)}
function start(){installStyles();attach();['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-harmonic-window-visibility-changed'].forEach(name=>window.addEventListener(name,()=>{attach();schedule()}));document.addEventListener('click',event=>{if(event.target.closest('.sky-foundation-relationship-row[data-relation-index]'))schedule()},true)}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
