// Render a live-origin sky's age in the header itself, with an adjacent refresh control.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyLiveHeaderV1)return;
window.__relphiSkyLiveHeaderV1=true;

const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const STEP_MS=5*60*1000;
const LIVE_ORIGINS=new Set(['here-and-now','update-to-now']);
const STYLE_ID='skyLiveHeaderV1Styles';
let queued=false;
let timer=0;

function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
function profile(value){return value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{}}
function markerMs(value){const parsed=Date.parse(value?.metadata?.liveNowAt||'');return Number.isFinite(parsed)?parsed:NaN}
function finiteCoordinate(value){const number=Number(value);return Number.isFinite(number)?number:null}

function profileMs(value){
  const data=profile(value);
  if(data.instant){const parsed=Date.parse(data.instant);if(Number.isFinite(parsed))return parsed}
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

function isLive(value){
  if(window.RelphiSkyStaleness?.isLiveOrigin)return window.RelphiSkyStaleness.isLiveOrigin(value);
  if(!value||typeof value!=='object')return false;
  const metadata=value.metadata&&typeof value.metadata==='object'?value.metadata:{};
  if(!LIVE_ORIGINS.has(String(metadata.liveNowOrigin||'')))return false;
  const marker=markerMs(value),current=profileMs(value);
  if(!Number.isFinite(marker)||!Number.isFinite(current)||Math.abs(marker-current)>90*1000)return false;
  const data=profile(value);
  const markerLat=finiteCoordinate(metadata.liveNowLatitude),markerLon=finiteCoordinate(metadata.liveNowLongitude);
  const currentLat=finiteCoordinate(data.latitude),currentLon=finiteCoordinate(data.longitude);
  if(markerLat!==null&&currentLat!==null&&Math.abs(markerLat-currentLat)>0.00001)return false;
  if(markerLon!==null&&currentLon!==null&&Math.abs(markerLon-currentLon)>0.00001)return false;
  return true;
}

function ageLabel(timestamp,now=Date.now()){
  if(window.RelphiSkyStaleness?.ageLabel)return window.RelphiSkyStaleness.ageLabel(timestamp,now);
  const elapsed=Math.max(0,Number(now)-Number(timestamp));
  const minutes=Math.floor(elapsed/STEP_MS)*5;
  return minutes<5?'Now':`${minutes} minutes ago`;
}

function installStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    .sky-foundation-name.is-live-now{
      display:flex!important;
      align-items:center!important;
      justify-content:flex-start!important;
      gap:.12rem!important;
      min-width:0!important;
      overflow:visible!important;
    }
    .sky-foundation-name.is-live-now .sky-saved-name-trigger{
      flex:0 1 auto!important;
      width:auto!important;
      min-width:0!important;
      min-height:30px!important;
      padding:0 .18rem!important;
      border:0!important;
      border-radius:0!important;
      background:transparent!important;
      box-shadow:none!important;
      color:inherit!important;
      opacity:1!important;
      cursor:default!important;
      pointer-events:none!important;
    }
    .sky-foundation-name.is-live-now .sky-saved-name-trigger:hover,
    .sky-foundation-name.is-live-now .sky-saved-name-trigger:focus-visible{
      border:0!important;
      background:transparent!important;
      box-shadow:none!important;
      outline:none!important;
    }
    .sky-foundation-name.is-live-now .sky-saved-name-trigger[data-live-age] .sky-saved-name-label,
    .sky-foundation-name.is-live-now .sky-saved-name-trigger .sky-saved-name-chevron{
      display:none!important;
    }
    .sky-foundation-name.is-live-now .sky-saved-name-trigger[data-live-age]::before{
      content:attr(data-live-age);
      display:block;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
      color:#171411;
      font:800 .72rem/1.15 system-ui,sans-serif;
    }
    .sky-live-header-refresh{
      position:relative!important;
      display:inline-flex!important;
      flex:0 0 44px!important;
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
      color:#544d46!important;
      cursor:pointer!important;
      touch-action:manipulation!important;
      -webkit-tap-highlight-color:transparent!important;
    }
    .sky-live-header-refresh svg{width:21px!important;height:21px!important;display:block!important;pointer-events:none!important}
    .sky-live-header-refresh:hover,.sky-live-header-refresh:focus-visible{background:rgba(31,27,24,.07)!important;outline:none!important}
    .sky-live-header-refresh:focus-visible{box-shadow:0 0 0 2px currentColor!important}
    .sky-live-header-refresh:disabled{cursor:progress!important;opacity:.5!important}
    .sky-where-when-actions .sky-staleness-control{display:none!important}
    @media(hover:hover){
      .sky-live-header-refresh::after{
        content:attr(data-tooltip);
        position:absolute;
        left:50%;
        bottom:calc(100% + 5px);
        z-index:90;
        transform:translateX(-50%) translateY(2px);
        padding:.38rem .52rem;
        border-radius:.42rem;
        background:#111;
        color:#fff;
        font:700 .76rem/1 system-ui,sans-serif;
        white-space:nowrap;
        opacity:0;
        pointer-events:none;
        transition:opacity .12s ease,transform .12s ease;
      }
      .sky-live-header-refresh:hover::after,.sky-live-header-refresh:focus-visible::after{opacity:1;transform:translateX(-50%) translateY(0)}
    }
    @media(max-width:620px){
      .sky-foundation-name.is-live-now{gap:0!important;padding-left:.55rem!important;padding-right:.1rem!important}
      .sky-foundation-name.is-live-now .sky-saved-name-trigger[data-live-age]::before{font-size:.66rem!important}
    }
  `;
  document.head.appendChild(style);
}

function refreshButton(slot,container){
  let button=container.querySelector(`[data-live-header-refresh="${slot}"]`);
  if(button)return button;
  button=document.createElement('button');
  button.type='button';
  button.className='sky-live-header-refresh';
  button.dataset.finalNow=slot;
  button.dataset.stalenessRefresh=slot;
  button.dataset.liveHeaderRefresh=slot;
  button.dataset.tooltip='Update to Now';
  button.title='Update to Now';
  button.setAttribute('aria-label','Update to Now');
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 11a8.1 8.1 0 1 0 2 5.3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M20 4v7h-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  container.appendChild(button);
  return button;
}

function restore(slot,container){
  if(!container)return;
  container.classList.remove('is-live-now');
  container.querySelector(`[data-live-header-refresh="${slot}"]`)?.remove();
  const trigger=container.querySelector('[data-saved-sky-trigger]');
  if(trigger){
    trigger.disabled=false;
    trigger.removeAttribute('data-live-age');
    trigger.removeAttribute('aria-disabled');
  }
}

function renderSlot(slot){
  const container=document.querySelector(`#skyFoundation${slot}>.sky-foundation-heading>.sky-foundation-name`);
  if(!container)return;
  const value=read(slot);
  if(!isLive(value)){restore(slot,container);return}
  const trigger=container.querySelector('[data-saved-sky-trigger]');
  if(!trigger)return;
  const label=ageLabel(markerMs(value));
  container.classList.add('is-live-now');
  trigger.disabled=true;
  trigger.dataset.liveAge=label;
  trigger.setAttribute('aria-disabled','true');
  trigger.title='';
  trigger.setAttribute('aria-label',`Sky age: ${label}`);
  refreshButton(slot,container);
}

function nextBoundaryDelay(){
  const now=Date.now();
  let soonest=Infinity;
  for(const slot of ['A','B']){
    const value=read(slot);
    if(!isLive(value))continue;
    const timestamp=markerMs(value);
    if(!Number.isFinite(timestamp))continue;
    const elapsed=Math.max(0,now-timestamp);
    const next=(Math.floor(elapsed/STEP_MS)+1)*STEP_MS;
    soonest=Math.min(soonest,next-elapsed+40);
  }
  return Number.isFinite(soonest)?Math.max(1000,Math.min(STEP_MS,soonest)):0;
}

function plan(){clearTimeout(timer);const delay=nextBoundaryDelay();if(delay)timer=setTimeout(schedule,delay)}
function render(){queued=false;installStyles();renderSlot('A');renderSlot('B');plan()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(render)}

installStyles();
['storage','relphi:sky-foundation-ready','relphi:sky-name-updated','relphi:saved-sky-active-changed','relphi:saved-sky-library-changed','relphi:sky-live-origin-changed'].forEach(name=>window.addEventListener(name,schedule));
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
schedule();
})();
