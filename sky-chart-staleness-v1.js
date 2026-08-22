// Show age + refresh only for skies explicitly created from Here and Now / Update to Now.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyStalenessV1)return;
window.__relphiSkyStalenessV1=true;

const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const STEP_MS=5*60*1000;
const LIVE_ORIGINS=new Set(['here-and-now','update-to-now']);
const STYLE_ID='skyStalenessV1Styles';
let renderQueued=false;
let boundaryTimer=0;

function read(slot){
  try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}
}
function write(slot,value){
  try{localStorage.setItem(KEYS[slot],JSON.stringify(value));return true}catch(_){return false}
}
function panel(slot){return document.getElementById(`skyFoundation${slot}`)}
function profile(value){return value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{}}
function finiteCoordinate(value){const number=Number(value);return Number.isFinite(number)?number:null}

function profileInstantMs(value){
  const data=profile(value);
  if(data.instant){
    const direct=Date.parse(data.instant);
    if(Number.isFinite(direct))return direct;
  }
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
  // If a custom Where/When calculation replaced the live moment, the marker no longer applies.
  if(Math.abs(marker-current)>90*1000)return false;
  return coordinatesStillMatch(value);
}

function ageLabel(timestamp,now=Date.now()){
  const elapsed=Math.max(0,Number(now)-Number(timestamp));
  const minutes=Math.floor(elapsed/STEP_MS)*5;
  return minutes<5?'Now':`${minutes} minutes ago`;
}

function installStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    #skyFoundationA .sky-where-when-actions [data-final-now]:not([data-staleness-refresh]),
    #skyFoundationB .sky-where-when-actions [data-final-now]:not([data-staleness-refresh]){
      display:none!important;
    }
    .sky-staleness-control{
      display:inline-flex!important;
      align-items:center!important;
      gap:.18rem!important;
      flex:0 0 auto!important;
      min-width:0!important;
      margin:0 .28rem 0 0!important;
      white-space:nowrap!important;
    }
    .sky-staleness-age{
      display:inline!important;
      padding:0!important;
      margin:0!important;
      border:0!important;
      border-radius:0!important;
      background:none!important;
      box-shadow:none!important;
      color:inherit!important;
      font:inherit!important;
      font-size:.88rem!important;
      font-weight:650!important;
      line-height:1.2!important;
      opacity:.72!important;
      cursor:default!important;
    }
    .sky-staleness-refresh{
      position:relative!important;
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      width:44px!important;
      height:44px!important;
      min-width:44px!important;
      min-height:44px!important;
      padding:0!important;
      margin:0!important;
      border:0!important;
      border-radius:999px!important;
      background:transparent!important;
      box-shadow:none!important;
      color:currentColor!important;
      cursor:pointer!important;
      touch-action:manipulation!important;
      -webkit-tap-highlight-color:transparent!important;
    }
    .sky-staleness-refresh svg{
      width:21px!important;
      height:21px!important;
      display:block!important;
      pointer-events:none!important;
    }
    .sky-staleness-refresh:hover,
    .sky-staleness-refresh:focus-visible{
      background:rgba(0,0,0,.07)!important;
      outline:none!important;
    }
    .sky-staleness-refresh:focus-visible{
      box-shadow:0 0 0 2px currentColor!important;
    }
    .sky-staleness-refresh:disabled{
      cursor:progress!important;
      opacity:.5!important;
    }
    @media (hover:hover){
      .sky-staleness-refresh::after{
        content:attr(data-tooltip);
        position:absolute;
        left:50%;
        bottom:calc(100% + 6px);
        z-index:80;
        transform:translateX(-50%) translateY(2px);
        padding:.38rem .52rem;
        border-radius:.42rem;
        background:#111;
        color:#fff;
        font-size:.76rem;
        font-weight:700;
        line-height:1;
        white-space:nowrap;
        opacity:0;
        pointer-events:none;
        transition:opacity .12s ease,transform .12s ease;
      }
      .sky-staleness-refresh:hover::after,
      .sky-staleness-refresh:focus-visible::after{
        opacity:1;
        transform:translateX(-50%) translateY(0);
      }
    }
  `;
  document.head.appendChild(style);
}

function buildControl(slot,actions){
  const group=document.createElement('span');
  group.className='sky-staleness-control';
  group.dataset.stalenessControl=slot;

  const age=document.createElement('span');
  age.className='sky-staleness-age';
  age.dataset.stalenessAge=slot;

  const refresh=document.createElement('button');
  refresh.type='button';
  refresh.className='sky-staleness-refresh';
  refresh.dataset.finalNow=slot;
  refresh.dataset.stalenessRefresh=slot;
  refresh.dataset.tooltip='Update to Now';
  refresh.title='Update to Now';
  refresh.setAttribute('aria-label','Update to Now');
  refresh.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 11a8.1 8.1 0 1 0 2 5.3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M20 4v7h-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  group.append(age,refresh);
  actions.prepend(group);
  return group;
}

function renderSlot(slot){
  const actions=panel(slot)?.querySelector('.sky-where-when-actions');
  if(!actions)return;
  const value=read(slot);
  let control=actions.querySelector(`[data-staleness-control="${slot}"]`);
  if(!isLiveOrigin(value)){
    control?.remove();
    return;
  }
  if(!control)control=buildControl(slot,actions);
  const label=ageLabel(markerInstantMs(value));
  const age=control.querySelector('[data-staleness-age]');
  if(age&&age.textContent!==label)age.textContent=label;
  if(age)age.setAttribute('aria-label',`Sky age: ${label}`);
}

function nextBoundaryDelay(){
  const now=Date.now();
  let soonest=Infinity;
  for(const slot of ['A','B']){
    const value=read(slot);
    if(!isLiveOrigin(value))continue;
    const timestamp=markerInstantMs(value);
    if(!Number.isFinite(timestamp))continue;
    if(now<timestamp){soonest=Math.min(soonest,timestamp-now+STEP_MS+40);continue}
    const elapsed=now-timestamp;
    const next=(Math.floor(elapsed/STEP_MS)+1)*STEP_MS;
    soonest=Math.min(soonest,next-elapsed+40);
  }
  return Number.isFinite(soonest)?Math.max(1000,Math.min(STEP_MS,soonest)):0;
}

function planBoundaryRender(){
  clearTimeout(boundaryTimer);
  const delay=nextBoundaryDelay();
  if(delay)boundaryTimer=setTimeout(scheduleRender,delay);
}

function renderAll(){
  renderQueued=false;
  installStyles();
  renderSlot('A');
  renderSlot('B');
  planBoundaryRender();
}
function scheduleRender(){
  if(renderQueued)return;
  renderQueued=true;
  requestAnimationFrame(renderAll);
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
  value.metadata=metadata;
  if(!write(slot,value))return false;
  window.dispatchEvent(new CustomEvent('relphi:sky-live-origin-changed',{detail:{slot,origin}}));
  scheduleRender();
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
  window.dispatchEvent(new CustomEvent('relphi:sky-live-origin-changed',{detail:{slot,origin:null,reason:reason||'cleared'}}));
  scheduleRender();
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
  const direct=slotFromNode(node);
  if(direct)return direct;
  const builder=inferBuilderSlot();
  if(builder)return builder;
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
    if(value&&Number.isFinite(timestamp)&&Math.abs(timestamp-startedAt)<=10*60*1000){
      markLive(slot,'here-and-now');
      return;
    }
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
    const before=localStorage.getItem(KEYS[slot])||'';
    watchHereNow(slot,before,Date.now());
    return;
  }

  const load=target.closest('[data-saved-sky-ref],[data-load-name]');
  if(load){
    const slot=expandedSavedSlot()||inferredActiveSlot(load);
    const before=localStorage.getItem(KEYS[slot])||'';
    watchForChange(slot,before,()=>clearLive(slot,'loaded-sky'),8000);
  }
}

function onSubmit(event){
  const form=event.target?.closest?.('.sky-where-when-editor');
  if(!form)return;
  const slot=form.dataset.slot||slotFromNode(form);
  if(!KEYS[slot])return;
  const before=localStorage.getItem(KEYS[slot])||'';
  // Only clear after the editor actually writes a replacement sky. Validation failures leave live status intact.
  watchForChange(slot,before,()=>clearLive(slot,'custom-where-when'),8000);
}

function onSkyNameUpdated(event){
  const detail=event.detail||{};
  const source=String(detail.source||'');
  if(detail.slot&&/^update-to-now(?:-stable)?$/.test(source))markLive(detail.slot,'update-to-now');
  else scheduleRender();
}

window.RelphiSkyStaleness={
  markLive,
  clearLive,
  isLiveOrigin,
  ageLabel
};

installStyles();
window.addEventListener('click',onCaptureClick,true);
document.addEventListener('submit',onSubmit,true);
window.addEventListener('relphi:sky-name-updated',onSkyNameUpdated);
['storage','relphi:sky-foundation-ready','relphi:saved-sky-active-changed','relphi:saved-sky-library-changed','relphi:sky-live-origin-changed'].forEach(name=>window.addEventListener(name,scheduleRender));
new MutationObserver(scheduleRender).observe(document.documentElement,{childList:true,subtree:true});
scheduleRender();
})();
