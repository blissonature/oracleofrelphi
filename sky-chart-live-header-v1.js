// Live-origin Sky header: age in five-minute increments + Update to Now refresh.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyLiveHeaderV1)return;
window.__relphiSkyLiveHeaderV1=true;

const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const STEP_MS=5*60*1000;
const LIVE_ORIGINS=new Set(['here-and-now','update-to-now']);
const STYLE_ID='skyLiveHeaderV3Styles';
let queued=false,timer=0;

function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
function write(slot,value){try{localStorage.setItem(KEYS[slot],JSON.stringify(value));return true}catch(_){return false}}
function profile(value){return value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{}}
function metadata(value){return value?.metadata&&typeof value.metadata==='object'?value.metadata:{}}
function normalize(value){return String(value||'').trim().toLowerCase().replace(/\s+/g,' ')}
function finiteCoordinate(value){const number=Number(value);return Number.isFinite(number)?number:null}
function savedIdentity(value){const m=metadata(value);return !!String(m.savedSkyId||m.savedSkyName||m.savedSkyLoadedAt||'').trim()}
function namedNow(value){
  const p=profile(value),m=metadata(value);
  return [value?.name,value?.title,value?.displayName,value?.skyName,p.name,p.title,m.name,m.title].some(v=>normalize(v)==='now');
}
function profileMs(value){
  const p=profile(value);
  if(p.instant){const direct=Date.parse(p.instant);if(Number.isFinite(direct))return direct}
  const dateTime=String(p.dateTime||value?.dateTime||'').trim();if(!dateTime)return NaN;
  const zone=String(p.timeZone||'').trim();
  try{if(window.luxon?.DateTime&&zone){const parsed=window.luxon.DateTime.fromISO(dateTime,{zone,setZone:true});if(parsed?.isValid)return parsed.toUTC().toMillis()}}catch(_){}
  const fallback=Date.parse(dateTime);return Number.isFinite(fallback)?fallback:NaN;
}
function markerMs(value){const parsed=Date.parse(metadata(value).liveNowAt||'');return Number.isFinite(parsed)?parsed:NaN}
function markedLive(value){
  if(!value||typeof value!=='object')return false;
  const m=metadata(value);if(!LIVE_ORIGINS.has(String(m.liveNowOrigin||'')))return false;
  const marker=markerMs(value),current=profileMs(value);if(!Number.isFinite(marker)||!Number.isFinite(current)||Math.abs(marker-current)>90*1000)return false;
  const p=profile(value),mlat=finiteCoordinate(m.liveNowLatitude),mlon=finiteCoordinate(m.liveNowLongitude),lat=finiteCoordinate(p.latitude),lon=finiteCoordinate(p.longitude);
  if(mlat!==null&&lat!==null&&Math.abs(mlat-lat)>0.00001)return false;
  if(mlon!==null&&lon!==null&&Math.abs(mlon-lon)>0.00001)return false;
  return true;
}
function legacyLive(value){
  if(!value||typeof value!=='object'||savedIdentity(value)||metadata(value).liveNowDisabled===true)return false;
  // Before live-origin metadata existed, Here and Now / Update to Now persisted the active sky as "Now".
  // That surviving unsaved identity is the migration signature for legacy live skies.
  return namedNow(value)&&Number.isFinite(profileMs(value));
}
function isLive(value){return markedLive(value)||legacyLive(value)}
function liveMs(value){const marker=markerMs(value);return Number.isFinite(marker)?marker:profileMs(value)}
function ageLabel(timestamp,now=Date.now()){
  const elapsed=Math.max(0,Number(now)-Number(timestamp));
  const minutes=Math.floor(elapsed/STEP_MS)*5;
  return minutes<5?'Now':`${minutes} minutes ago`;
}

function installStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');style.id=STYLE_ID;
  style.textContent=`
    .sky-card-title-stable[data-live-header-owned="true"]{
      display:grid!important;
      grid-template-columns:minmax(0,1fr) 44px!important;
      align-items:center!important;
      column-gap:6px!important;
      width:100%!important;
      height:44px!important;
      min-width:0!important;
      box-sizing:border-box!important;
      overflow:visible!important;
      padding:0 .45rem 0 .8rem!important;
      margin:0!important;
    }
    .sky-live-age{
      display:block!important;
      min-width:0!important;
      overflow:hidden!important;
      text-overflow:ellipsis!important;
      white-space:nowrap!important;
      padding:0!important;
      margin:0!important;
      border:0!important;
      background:none!important;
      box-shadow:none!important;
      color:#171411!important;
      font:800 .72rem/1.15 system-ui,sans-serif!important;
      text-align:left!important;
    }
    .sky-live-header-refresh{
      position:relative!important;
      display:grid!important;
      place-items:center!important;
      justify-self:end!important;
      width:44px!important;
      height:44px!important;
      min-width:44px!important;
      min-height:44px!important;
      box-sizing:border-box!important;
      padding:0!important;
      margin:0!important;
      border:0!important;
      border-radius:999px!important;
      background:transparent!important;
      box-shadow:none!important;
      color:#4f4943!important;
      cursor:pointer!important;
      touch-action:manipulation!important;
      -webkit-tap-highlight-color:transparent!important;
    }
    .sky-live-header-refresh svg{
      display:block!important;
      width:32px!important;
      height:32px!important;
      box-sizing:border-box!important;
      padding:5px!important;
      overflow:visible!important;
      border:1px solid rgba(31,27,24,.18)!important;
      border-radius:999px!important;
      background:#fffdf8!important;
      pointer-events:none!important;
    }
    .sky-live-header-refresh:hover,.sky-live-header-refresh:focus-visible{outline:none!important}
    .sky-live-header-refresh:hover svg,.sky-live-header-refresh:focus-visible svg{
      border-color:rgba(31,27,24,.34)!important;
      background:#f5f0e9!important;
    }
    .sky-live-header-refresh:focus-visible{box-shadow:0 0 0 2px rgba(31,27,24,.24)!important}
    .sky-live-header-refresh:disabled{cursor:progress!important;opacity:.5!important}
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
      .sky-card-title-stable[data-live-header-owned="true"]{
        grid-template-columns:minmax(0,1fr) 44px!important;
        column-gap:4px!important;
        padding:0 .45rem 0 .8rem!important;
      }
      .sky-live-age{font-size:.68rem!important}
    }
  `;
  document.head.appendChild(style);
}
function host(slot){return document.querySelector(`#skyFoundation${slot}>.sky-foundation-heading>.sky-card-title-stable`)}
function refreshButton(slot){
  const button=document.createElement('button');button.type='button';button.className='sky-live-header-refresh';
  button.dataset.finalNow=slot;button.dataset.liveHeaderRefresh=slot;button.dataset.tooltip='Update to Now';button.title='Update to Now';button.setAttribute('aria-label','Update to Now');
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M21 12a9 9 0 0 0-15.22-6.22L3 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 3v5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 12a9 9 0 0 0 15.22 6.22L21 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 16h5v5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  return button;
}
function renderLive(slot,container,value){
  const label=ageLabel(liveMs(value));
  container.dataset.liveHeaderOwned='true';
  let age=container.querySelector(':scope > .sky-live-age');
  let refresh=container.querySelector(`:scope > [data-live-header-refresh="${slot}"]`);
  if(!age||!refresh){
    age=document.createElement('span');age.className='sky-live-age';age.dataset.liveAge=slot;
    refresh=refreshButton(slot);container.replaceChildren(age,refresh);
  }
  if(age.textContent!==label)age.textContent=label;
  age.setAttribute('aria-label',`Sky age: ${label}`);
}
function release(slot,container){
  if(!container||container.dataset.liveHeaderOwned!=='true')return;
  delete container.dataset.liveHeaderOwned;container.replaceChildren();
  window.dispatchEvent(new CustomEvent('relphi:sky-live-header-released',{detail:{slot}}));
}
function renderSlot(slot){
  const container=host(slot);if(!container)return;
  const value=read(slot);if(isLive(value))renderLive(slot,container,value);else release(slot,container);
}
function nextDelay(){
  const now=Date.now();let soonest=Infinity;
  for(const slot of ['A','B']){const value=read(slot);if(!isLive(value))continue;const timestamp=liveMs(value);if(!Number.isFinite(timestamp))continue;const elapsed=Math.max(0,now-timestamp),next=(Math.floor(elapsed/STEP_MS)+1)*STEP_MS;soonest=Math.min(soonest,next-elapsed+40)}
  return Number.isFinite(soonest)?Math.max(1000,Math.min(STEP_MS,soonest)):0;
}
function plan(){clearTimeout(timer);const delay=nextDelay();if(delay)timer=setTimeout(schedule,delay)}
function render(){queued=false;installStyles();renderSlot('A');renderSlot('B');plan()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(render)}

function setDisabled(slot,disabled,reason){
  const value=read(slot);if(!value||typeof value!=='object')return;
  const m={...metadata(value)};
  if(disabled){m.liveNowDisabled=true;m.liveNowDisabledReason=reason||'custom'}
  else{delete m.liveNowDisabled;delete m.liveNowDisabledReason}
  value.metadata=m;if(write(slot,value))schedule();
}
function watchChange(slot,before,callback,timeout=10000){
  const started=Date.now();(function check(){const current=localStorage.getItem(KEYS[slot])||'';if(current!==before){callback();return}if(Date.now()-started<timeout)setTimeout(check,90)})();
}
function slotFor(node){return node?.closest?.('#skyFoundationA')?'A':node?.closest?.('#skyFoundationB')?'B':''}

document.addEventListener('submit',event=>{
  const form=event.target?.closest?.('.sky-where-when-editor');if(!form)return;const slot=form.dataset.slot||slotFor(form);if(!KEYS[slot])return;
  const before=localStorage.getItem(KEYS[slot])||'';watchChange(slot,before,()=>setDisabled(slot,true,'custom-where-when'));
},true);
window.addEventListener('relphi:sky-name-updated',event=>{
  const detail=event.detail||{},source=String(detail.source||'');
  if(detail.slot&&/^update-to-now(?:-stable)?$/.test(source))setDisabled(detail.slot,false);else schedule();
});
['storage','relphi:sky-foundation-ready','relphi:saved-sky-active-changed','relphi:saved-sky-library-changed'].forEach(name=>window.addEventListener(name,schedule));
new MutationObserver(records=>{
  // Ignore our own text changes; react when header hosts/panels are actually rebuilt.
  if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&n.closest?.('#skyFoundationA,#skyFoundationB'))))schedule();
}).observe(document.documentElement,{childList:true,subtree:true});

window.RelphiSkyLiveHeader={isLive,legacyLive,ageLabel,liveMs};
installStyles();schedule();
})();
