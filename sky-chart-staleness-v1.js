// Track live-origin skies for the header staleness display. This module owns state only;
// the visible age + refresh control is rendered exclusively by sky-chart-live-header-v1.js.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyStalenessV1)return;
window.__relphiSkyStalenessV1=true;

const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const STEP_MS=5*60*1000;
const LIVE_ORIGINS=new Set(['here-and-now','update-to-now']);

function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
function write(slot,value){try{localStorage.setItem(KEYS[slot],JSON.stringify(value));return true}catch(_){return false}}
function profile(value){return value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{}}
function finiteCoordinate(value){const number=Number(value);return Number.isFinite(number)?number:null}

function profileInstantMs(value){
  const data=profile(value);
  if(data.instant){const direct=Date.parse(data.instant);if(Number.isFinite(direct))return direct}
  const dateTime=String(data.dateTime||'').trim();
  if(!dateTime)return NaN;
  const zone=String(data.timeZone||'').trim();
  try{
    if(window.luxon?.DateTime&&zone){
      const parsed=window.luxon.DateTime.fromISO(dateTime,{zone,setZone:true});
      if(parsed?.isValid)return parsed.toUTC().toMillis();
    }
  }catch(_){}
  const fallback=Date.parse(dateTime);
  return Number.isFinite(fallback)?fallback:NaN;
}

function markerInstantMs(value){
  const marker=Date.parse(value?.metadata?.liveNowAt||'');
  return Number.isFinite(marker)?marker:NaN;
}

function coordinatesStillMatch(value){
  const metadata=value?.metadata&&typeof value.metadata==='object'?value.metadata:{};
  const data=profile(value);
  const markerLat=finiteCoordinate(metadata.liveNowLatitude);
  const markerLon=finiteCoordinate(metadata.liveNowLongitude);
  const currentLat=finiteCoordinate(data.latitude);
  const currentLon=finiteCoordinate(data.longitude);
  if(markerLat!==null&&currentLat!==null&&Math.abs(markerLat-currentLat)>0.00001)return false;
  if(markerLon!==null&&currentLon!==null&&Math.abs(markerLon-currentLon)>0.00001)return false;
  return true;
}

function isLiveOrigin(value){
  if(!value||typeof value!=='object')return false;
  const metadata=value.metadata&&typeof value.metadata==='object'?value.metadata:{};
  if(!LIVE_ORIGINS.has(String(metadata.liveNowOrigin||'')))return false;
  const marker=markerInstantMs(value),current=profileInstantMs(value);
  if(!Number.isFinite(marker)||!Number.isFinite(current))return false;
  if(Math.abs(marker-current)>90*1000)return false;
  return coordinatesStillMatch(value);
}

function ageLabel(timestamp,now=Date.now()){
  const elapsed=Math.max(0,Number(now)-Number(timestamp));
  const minutes=Math.floor(elapsed/STEP_MS)*5;
  return minutes<5?'Now':`${minutes} minutes ago`;
}

function notify(slot,origin,reason){
  window.dispatchEvent(new CustomEvent('relphi:sky-live-origin-changed',{detail:{slot,origin,reason:reason||''}}));
}

function markLive(slot,origin){
  if(!KEYS[slot]||!LIVE_ORIGINS.has(origin))return false;
  const value=read(slot);
  if(!value||typeof value!=='object')return false;
  const timestamp=profileInstantMs(value);
  if(!Number.isFinite(timestamp))return false;
  const data=profile(value);
  const metadata=value.metadata&&typeof value.metadata==='object'?{...value.metadata}:{};
  metadata.liveNowOrigin=origin;
  metadata.liveNowAt=new Date(timestamp).toISOString();
  metadata.liveNowLatitude=String(data.latitude??'');
  metadata.liveNowLongitude=String(data.longitude??'');
  delete metadata.liveNowDisabled;
  delete metadata.liveNowDisabledReason;
  value.metadata=metadata;
  if(!write(slot,value))return false;
  notify(slot,origin);
  return true;
}

function clearLive(slot,reason){
  if(!KEYS[slot])return false;
  const value=read(slot);
  const metadata=value?.metadata&&typeof value.metadata==='object'?{...value.metadata}:null;
  if(!value||!metadata)return false;
  if(!('liveNowOrigin'in metadata)&&!('liveNowAt'in metadata))return false;
  delete metadata.liveNowOrigin;
  delete metadata.liveNowAt;
  delete metadata.liveNowLatitude;
  delete metadata.liveNowLongitude;
  value.metadata=metadata;
  if(!write(slot,value))return false;
  notify(slot,null,reason||'cleared');
  return true;
}

function inferBuilderSlot(){
  try{
    const state=JSON.parse(sessionStorage.getItem('relphiSkyBuilderV4State')||'null');
    if(state?.editingSlot==='skyB')return'B';
    if(state?.editingSlot==='skyA')return'A';
  }catch(_){}
  return null;
}
function slotFromNode(node){
  const card=node?.closest?.('#skyFoundationA,#skyFoundationB');
  if(card?.id==='skyFoundationA')return'A';
  if(card?.id==='skyFoundationB')return'B';
  return null;
}
function inferredActiveSlot(node){
  const direct=slotFromNode(node);if(direct)return direct;
  const builder=inferBuilderSlot();if(builder)return builder;
  const intended=window.RelphiSkyCoreTargetFix?.getIntendedTarget?.();
  if(intended==='currentSky'||document.body?.dataset?.relphiPendingSkyKind==='currentSky')return'B';
  return'A';
}
function expandedSavedSlot(){
  for(const slot of ['A','B']){
    if(document.querySelector(`#skyFoundation${slot} [data-saved-sky-trigger][aria-expanded="true"]`))return slot;
  }
  return null;
}
function watchForChange(slot,before,onChange,timeout=30000){
  if(!KEYS[slot])return;
  const started=Date.now();
  (function check(){
    const current=localStorage.getItem(KEYS[slot])||'';
    if(current!==before){onChange?.(current);return}
    if(Date.now()-started>=timeout)return;
    setTimeout(check,90);
  })();
}
function watchHereNow(slot,before,startedAt){
  if(!KEYS[slot])return;
  const started=Date.now();
  (function check(){
    const current=localStorage.getItem(KEYS[slot])||'';
    const value=current!==before?read(slot):null;
    const timestamp=value?profileInstantMs(value):NaN;
    if(value&&Number.isFinite(timestamp)&&Math.abs(timestamp-startedAt)<=10*60*1000){markLive(slot,'here-and-now');return}
    if(Date.now()-started>=30000)return;
    setTimeout(check,90);
  })();
}

function onCaptureClick(event){
  const target=event.target instanceof Element?event.target:null;
  if(!target)return;
  const hereNow=target.closest('#relphiHereNow,[data-action="quick-now"],[data-here-now]');
  if(hereNow){
    const slot=inferredActiveSlot(hereNow);
    watchHereNow(slot,localStorage.getItem(KEYS[slot])||'',Date.now());
    return;
  }
  const load=target.closest('[data-saved-sky-ref],[data-load-name]');
  if(load){
    const slot=expandedSavedSlot()||inferredActiveSlot(load);
    watchForChange(slot,localStorage.getItem(KEYS[slot])||'',()=>clearLive(slot,'loaded-sky'),8000);
  }
}

function onSubmit(event){
  const form=event.target?.closest?.('.sky-where-when-editor');
  if(!form)return;
  const slot=form.dataset.slot||slotFromNode(form);
  if(!KEYS[slot])return;
  const before=localStorage.getItem(KEYS[slot])||'';
  watchForChange(slot,before,()=>clearLive(slot,'custom-where-when'),8000);
}

function onSkyNameUpdated(event){
  const detail=event.detail||{};
  const source=String(detail.source||'');
  if(detail.slot&&/^update-to-now(?:-stable)?$/.test(source))markLive(detail.slot,'update-to-now');
}

window.RelphiSkyStaleness={markLive,clearLive,isLiveOrigin,ageLabel};
window.addEventListener('click',onCaptureClick,true);
document.addEventListener('submit',onSubmit,true);
window.addEventListener('relphi:sky-name-updated',onSkyNameUpdated);
})();
