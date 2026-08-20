// Compact transit timing for relationship tiles.
// Dynamic-to-fixed relationships show active duration, direct/retrograde motion,
// applying/separating phase, and multiple exact passes when a retrograde cycle returns.
(function(){
'use strict';
if(window.__relphiSkyTransitTimelineV1)return;
window.__relphiSkyTransitTimelineV1=true;

const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const MOVING_B_KEY='relphiSkyTransitTimingMovingB';
const BODY={sun:'Sun',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',uranus:'Uranus',neptune:'Neptune',pluto:'Pluto'};
const ANGLE={conjunction:0,'semi-sextile':30,octile:45,sextile:60,quintile:72,square:90,trine:120,'tri-octile':135,'bi-quintile':144,quincunx:150,opposition:180};
const SETTINGS={moon:[.035,520],mercury:[.12,520],venus:[.18,520],mars:[.3,520],sun:[.18,520],jupiter:[.6,520],saturn:[.9,520],uranus:[1.2,520],neptune:[1.2,520],pluto:[1.2,520]};
const SERIES={mercury:[100,32],venus:[190,95],mars:[320,190],jupiter:[430,260],saturn:[520,320],uranus:[560,340],neptune:[560,340],pluto:[560,340]};
const SIGNS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
const ALIAS={rising:'asc',ascendant:'asc',ac:'asc',descendant:'dsc',dc:'dsc',midheaven:'mc','imum coeli':'ic',imumcoeli:'ic',vx:'vertex','north node':'north-node',node:'north-node','true node':'north-node','south node':'south-node',fortune:'part-of-fortune','part of fortune':'part-of-fortune',pof:'part-of-fortune'};
const DAY=86400000,cache=new Map();
let queued=false,runId=0;
const norm=value=>((Number(value)%360)+360)%360;
const wrap=value=>((Number(value)+540)%360)-180;
function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
function movingBOverride(){try{return localStorage.getItem(MOVING_B_KEY)==='true'}catch(_){return false}}
function writeMovingBOverride(value){
  const enabled=!!value;
  try{localStorage.setItem(MOVING_B_KEY,enabled?'true':'false')}catch(_){}
  document.documentElement.dataset.skyTransitTimingMovingB=enabled?'true':'false';
}
function source(payload){const value=[payload?.placements,payload?.positions,payload?.points,payload?.bodies].find(v=>v&&typeof v==='object')||payload||{};return Array.isArray(value)?value.map((v,i)=>[String(v?.name||v?.id||i),v]):Object.entries(value).filter(([,v])=>v&&typeof v==='object'&&!Array.isArray(v))}
function longitudeFromItem(item){if(Number.isFinite(Number(item?.longitude)))return norm(item.longitude);const sign=SIGNS.indexOf(String(item?.sign||item?.zodiac||'').trim().toLowerCase());return sign<0?NaN:norm(sign*30+Number(item?.degree||item?.degrees||0)+Number(item?.minute||item?.minutes||0)/60+Number(item?.second||item?.seconds||0)/3600)}
function canonical(key,item){const registry=window.RelphiGlyphRegistry;for(const candidate of [item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key]){if(!candidate)continue;const raw=String(candidate).trim(),entry=registry?.resolve?.(ALIAS[raw.toLowerCase()]||raw)||registry?.get?.(ALIAS[raw.toLowerCase()]||raw);if(entry)return entry}return null}
function endpoint(slot,id){for(const[key,item]of source(read(slot))){const entry=canonical(key,item),value=longitudeFromItem(item);if(entry?.id===id&&Number.isFinite(value))return{id:entry.id,entry,item,value,sky:slot}}return null}
function rowSlots(row){const mode=row.dataset.relationshipMode||document.documentElement.dataset.skyRelationshipMode||'';if(mode==='A-A')return['A','A'];if(mode==='B-B')return['B','B'];return[row.dataset.leftSky||'A',row.dataset.rightSky||'B']}
function relation(row){
  const[leftSky,rightSky]=rowSlots(row),left=endpoint(leftSky,row.dataset.leftPlacement),right=endpoint(rightSky,row.dataset.rightPlacement);
  if(!left||!right)return null;
  const harmonicOrder=Number(row.dataset.harmonicOrder),harmonicWindow=Number(row.dataset.harmonicWindow);
  return{row,left,right,leftSky,rightSky,aspect:{id:String(row.dataset.aspect||'')},orb:Number(row.dataset.sourceOrb||0),harmonicOrder:Number.isFinite(harmonicOrder)&&harmonicOrder>0?harmonicOrder:1,harmonicWindow:Number.isFinite(harmonicWindow)?harmonicWindow:NaN};
}
function profileDate(payload){const source=payload?.calcProfile||payload,raw=source?.instant||source?.dateTime;if(!raw)return null;const date=new Date(raw);return Number.isFinite(date.getTime())?date:null}
function textSignals(slot){const value=read(slot)||{},profile=value.calcProfile||{},metadata=value.metadata||{};return[value.name,value.title,value.displayName,value.skyName,profile.name,profile.title,profile.role,profile.type,metadata.role,metadata.type].filter(Boolean).join(' ')}
function movingSlot(){
  if(movingBOverride())return'B';
  const a=textSignals('A'),b=textSignals('B'),dynamic=/planetary hours|transit|current sky|\bnow\b|dynamic/i,staticSky=/birth|natal|radix|static|fixed/i;
  if(dynamic.test(a)!==dynamic.test(b))return dynamic.test(a)?'A':'B';
  if(staticSky.test(a)!==staticSky.test(b))return staticSky.test(a)?'B':'A';
  try{const roles=window.RelphiSkyRoles||JSON.parse(localStorage.getItem('relphiSkyChartRoles')||'null');if(roles?.chart==='dynamic'&&roles?.currentSky!=='dynamic')return'A';if(roles?.currentSky==='dynamic'&&roles?.chart!=='dynamic')return'B'}catch(_){}
  return null;
}
function astronomyLongitude(body,date){const astronomy=window.Astronomy,bodyValue=astronomy?.Body?.[BODY[body]]||BODY[body];if(!astronomy?.GeoVector||!astronomy?.Ecliptic||!bodyValue)return NaN;const vector=astronomy.GeoVector(bodyValue,date,true);return astronomy.Ecliptic(vector).elon}
function root(a,b,fn){let fa=fn(a),fb=fn(b);if(!Number.isFinite(fa)||!Number.isFinite(fb))return null;for(let i=0;i<36;i++){const mid=(a+b)/2,fm=fn(mid);if(!Number.isFinite(fm))return null;if(Math.sign(fa)===Math.sign(fm)){a=mid;fa=fm}else{b=mid;fb=fm}}return(a+b)/2}
function activeMasterWindow(rel){
  const input=Number(document.querySelector('[data-harmonic-window-input]')?.value);
  if(Number.isFinite(input)&&input>=0)return input;
  if(Number.isFinite(rel.harmonicWindow)&&rel.harmonicWindow>=0)return rel.harmonicWindow;
  const model=window.RelphiHarmonicOrb,value=Number(model?.windowFromControl?.()??model?.defaultWindow??6);
  return Number.isFinite(value)&&value>=0?value:6;
}
function modelFor(rel){
  const moving=movingSlot();
  if(!moving||rel.leftSky===rel.rightSky||!window.Astronomy)return null;
  const movingRecord=rel.leftSky===moving?rel.left:rel.rightSky===moving?rel.right:null,fixedRecord=movingRecord===rel.left?rel.right:rel.left;
  if(!movingRecord||!fixedRecord||!BODY[movingRecord.id])return null;
  const date=profileDate(read(moving)),angle=ANGLE[rel.aspect.id],settings=SETTINGS[movingRecord.id];
  if(!date||!Number.isFinite(angle)||!settings)return null;
  const masterWindow=activeMasterWindow(rel),harmonicOrder=rel.harmonicOrder||1,limit=masterWindow/harmonicOrder;
  if(!Number.isFinite(limit)||limit<=0)return null;
  return{moving,movingRecord,fixedRecord,date,angle,limit,settings,harmonicOrder,masterWindow};
}
function analyzer(model){const targetA=model.fixedRecord.value+model.angle,targetB=model.fixedRecord.value-model.angle;const errorAt=ms=>{const value=astronomyLongitude(model.movingRecord.id,new Date(ms));if(!Number.isFinite(value))return NaN;const a=wrap(value-targetA),b=wrap(value-targetB);return Math.abs(a)<=Math.abs(b)?a:b};const speedAt=ms=>{const probe=.04*DAY,a=astronomyLongitude(model.movingRecord.id,new Date(ms-probe)),b=astronomyLongitude(model.movingRecord.id,new Date(ms+probe));return Number.isFinite(a)&&Number.isFinite(b)?wrap(b-a)/.08:NaN};return{errorAt,speedAt}}
function boundary(center,direction,model,errorAt){const[stepDays,maxSteps]=model.settings,step=stepDays*DAY,fn=ms=>Math.abs(errorAt(ms))-model.limit;let previous=center,previousValue=fn(previous);if(!Number.isFinite(previousValue)||previousValue>1e-7)return null;for(let i=1;i<=maxSteps;i++){const next=center+direction*i*step,value=fn(next);if(!Number.isFinite(value))return null;if(value>0)return root(Math.min(previous,next),Math.max(previous,next),fn);previous=next;previousValue=value}return null}
function passSeries(model,errorAt,center){const config=SERIES[model.movingRecord.id];if(!config)return null;const[horizonDays,gapDays]=config,step=Math.max(.08,model.settings[0])*DAY,start=center-horizonDays*DAY,end=center+horizonDays*DAY,roots=[];let previous=start,previousError=errorAt(previous);for(let time=start+step;time<=end;time+=step){const error=errorAt(time);if(Number.isFinite(previousError)&&Number.isFinite(error)&&(previousError===0||error===0||Math.sign(previousError)!==Math.sign(error))){const exact=root(previous,time,errorAt);if(exact&&!roots.some(value=>Math.abs(value-exact)<.15*DAY))roots.push(exact)}previous=time;previousError=error}if(!roots.length)return null;roots.sort((a,b)=>a-b);const groups=[];roots.forEach(value=>{const group=groups[groups.length-1];if(!group||(value-group[group.length-1])/DAY>gapDays)groups.push([value]);else group.push(value)});const group=groups.reduce((best,current)=>{const distance=Math.min(...current.map(value=>Math.abs(value-center)));return !best||distance<best.distance?{values:current,distance}:best},null)?.values;if(!group?.length)return null;const completed=group.filter(value=>value<=center).length,currentIndex=Math.min(Math.max(completed+1,1),group.length);return{count:group.length,current:currentIndex,completed}}
function timing(model){const{errorAt,speedAt}=analyzer(model),center=model.date.getTime(),entry=boundary(center,-1,model,errorAt),exit=boundary(center,1,model,errorAt);if(!entry||!exit||exit<=entry)return null;const speed=speedAt(center),probe=Math.max(.015,model.settings[0]/2)*DAY,before=Math.abs(errorAt(center-probe)),after=Math.abs(errorAt(center+probe)),phase=after<before?'applying':'separating';return{entry,exit,duration:exit-entry,retrograde:Number.isFinite(speed)&&speed<0,stationary:Number.isFinite(speed)&&Math.abs(speed)<.015,phase,speed,currentError:Math.abs(errorAt(center)),passes:passSeries(model,errorAt,center)}}
function durationLabel(ms){const hours=ms/3600000,days=hours/24;if(hours<48)return`${Math.max(1,Math.round(hours))} hr`;if(days<60)return`${Math.max(2,Math.round(days))} days`;const months=days/30.4375;return months<18?`${months.toFixed(months<3?1:0)} months`:`${(days/365.2425).toFixed(1)} years`}
function signature(row,model){return[row.dataset.leftSky||'',row.dataset.leftPlacement,row.dataset.aspect,row.dataset.rightSky||'',row.dataset.rightPlacement,model?.moving||'',model?.date?.toISOString?.()||'',model?.harmonicOrder||'',model?.masterWindow||'',model?.limit||''].join('|')}
function renderMeta(row,model,data){let host=row.querySelector(':scope>.sky-relationship-transit-meta');if(!host){host=document.createElement('span');host.className='sky-relationship-transit-meta';row.appendChild(host)}if(!model||!data){host.remove();return}const motion=data.stationary?(data.retrograde?'Stationing Rx':'Stationing direct'):(data.retrograde?'Retrograde':'Direct'),pass=data.passes?.count>1?`<span><strong>Pass:</strong> ${data.passes.current} of ${data.passes.count}</span>`:'';host.innerHTML=`<span><strong>Active:</strong> ${durationLabel(data.duration)}</span><span class="${data.retrograde?'is-rx':''}"><strong>Motion:</strong> ${motion}</span><span><strong>Phase:</strong> ${data.phase}</span>${pass}`;host.title=`${model.movingRecord.entry.name} is the moving endpoint. Active ordinary aperture: ±${model.limit.toFixed(2)}° from harmonic window ${model.masterWindow.toFixed(2)}° ÷ harmonic ${model.harmonicOrder}.${data.passes?.count>1?` Exact pass ${data.passes.current} of ${data.passes.count}.`:''}`}
async function annotate(row,id){const rel=relation(row),model=rel?modelFor(rel):null;if(!model){renderMeta(row,null,null);delete row.dataset.transitSignature;return}const sig=signature(row,model);if(row.dataset.transitSignature===sig&&row.querySelector(':scope>.sky-relationship-transit-meta'))return;row.dataset.transitSignature=sig;let data=cache.get(sig);if(data===undefined){try{data=timing(model)}catch(_){data=null}cache.set(sig,data)}if(id!==runId||!row.isConnected)return;renderMeta(row,model,data)}
function rowVisible(row){return!row.hidden&&!row.classList.contains('sky-relationship-mode-hidden')&&!row.classList.contains('sky-chart-orb-hidden')&&!row.classList.contains('sky-chart-filter-hidden')&&!row.classList.contains('sky-chart-multiselect-hidden')&&!row.classList.contains('sky-chart-house-multiselect-hidden')&&!row.classList.contains('sky-chart-aspect-multiselect-hidden')&&!row.classList.contains('sky-chart-sign-filter-hidden')}
async function run(){queued=false;const id=++runId,rows=[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row')].filter(rowVisible);for(const row of rows){if(id!==runId)return;await annotate(row,id);await new Promise(resolve=>setTimeout(resolve,0))}}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(run)}
function invalidateTiming(){
  cache.clear();
  document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row').forEach(row=>delete row.dataset.transitSignature);
  schedule();
}
function ensureMovingBControl(){
  const bar=document.querySelector('#skyFoundationRelationships .sky-chart-filter-bar');
  if(!bar)return false;
  let label=bar.querySelector('[data-transit-moving-b-control]');
  if(!label){
    label=document.createElement('label');
    label.className='sky-transit-moving-b-control';
    label.dataset.transitMovingBControl='true';
    const caption=document.createElement('span');caption.textContent='Transit timing';
    const choice=document.createElement('span');choice.className='sky-transit-moving-b-choice';
    const input=document.createElement('input');input.type='checkbox';input.dataset.transitMovingB='true';
    const text=document.createElement('span');text.textContent='Use Sky B for transit timing';
    choice.append(input,text);label.append(caption,choice);
    label.title='Hold Sky A fixed and calculate Sky B motion around Sky B’s selected Where and When. This does not change either sky’s moment.';
    const harmonic=bar.querySelector('[data-orb-field]');
    if(harmonic)harmonic.insertAdjacentElement('afterend',label);else bar.prepend(label);
    input.addEventListener('change',()=>{writeMovingBOverride(input.checked);invalidateTiming()});
  }
  const input=label.querySelector('[data-transit-moving-b]');
  const checked=movingBOverride();
  if(input&&input.checked!==checked)input.checked=checked;
  document.documentElement.dataset.skyTransitTimingMovingB=checked?'true':'false';
  return true;
}
function start(){
  ensureMovingBControl();
  ['relphi:sky-foundation-interactions-ready','relphi:sky-single-sky-aspects-rendered','relphi:sky-placement-multiselect-changed','relphi:sky-orb-limit-changed','relphi:sky-relationship-selected'].forEach(name=>window.addEventListener(name,()=>{ensureMovingBControl();schedule()}));
  window.addEventListener('relphi:sky-harmonic-window-visibility-changed',()=>{ensureMovingBControl();invalidateTiming()});
  window.addEventListener('storage',event=>{
    if(event.key===MOVING_B_KEY){ensureMovingBControl();invalidateTiming();return}
    if(!event.key||Object.values(KEYS).includes(event.key)){cache.clear();schedule()}
  });
  const list=document.getElementById('skyFoundationRelationshipList');if(list)new MutationObserver(records=>{if(records.some(record=>record.type==='childList')){ensureMovingBControl();schedule()}}).observe(list,{childList:true,subtree:false});
  schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();