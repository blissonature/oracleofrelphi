// Sky freshness is secondary state. It never replaces the persistent Sky title/menu.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyLiveHeaderV5)return;
window.__relphiSkyLiveHeaderV1=true;
window.__relphiSkyLiveHeaderV2=true;
window.__relphiSkyLiveHeaderV3=true;
window.__relphiSkyLiveHeaderV4=true;
window.__relphiSkyLiveHeaderV5=true;

const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const AGE_KEYS={A:'relphiSkyLiveAgeAnchorA',B:'relphiSkyLiveAgeAnchorB'};
const LIVE_ORIGINS=new Set(['here-and-now','update-to-now','use-now']);
const STEP_MS=5*60*1000;
const STYLE_ID='skyLiveHeaderV12Styles';
let queued=false,timer=0;

function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
function write(slot,value){try{localStorage.setItem(KEYS[slot],JSON.stringify(value));return true}catch(_){return false}}
function metadata(value){return value?.metadata&&typeof value.metadata==='object'?value.metadata:{}}
function profile(value){return value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{}}
function saved(value){const m=metadata(value);return!!String(m.savedSkyId||m.savedSkyName||m.savedSkyLoadedAt||'').trim()}
function disabled(value){return metadata(value).liveNowDisabled===true}
function parseMs(value){
  const p=profile(value);
  if(p.instant){const ms=Date.parse(p.instant);if(Number.isFinite(ms))return ms}
  const raw=String(p.dateTime||value?.dateTime||'').trim();if(!raw)return NaN;
  try{if(window.luxon?.DateTime&&p.timeZone){const dt=window.luxon.DateTime.fromISO(raw,{zone:p.timeZone,setZone:true});if(dt?.isValid)return dt.toUTC().toMillis()}}catch(_){}
  const ms=Date.parse(raw);return Number.isFinite(ms)?ms:NaN;
}
function explicitOrigin(value){const m=String(metadata(value).liveNowOrigin||''),p=String(profile(value).liveNowOrigin||'');return LIVE_ORIGINS.has(m)?m:LIVE_ORIGINS.has(p)?p:''}
function liveOrigin(value){return explicitOrigin(value)||window.RelphiSkyLiveOriginMigration?.legacyOrigin?.(value)||''}
function markerMs(value){const a=Date.parse(metadata(value).liveAgeAnchorAt||''),b=Date.parse(metadata(value).liveNowAt||profile(value).liveNowAt||'');return Number.isFinite(a)?a:Number.isFinite(b)?b:parseMs(value)}
function ageRecord(slot){try{const raw=JSON.parse(localStorage.getItem(AGE_KEYS[slot])||'null'),at=Date.parse(raw?.at||'');return Number.isFinite(at)&&LIVE_ORIGINS.has(String(raw?.origin||''))?{origin:String(raw.origin),at}:null}catch(_){return null}}
function saveAge(slot,origin,at){if(!LIVE_ORIGINS.has(origin)||!Number.isFinite(at))return;try{localStorage.setItem(AGE_KEYS[slot],JSON.stringify({origin,at:new Date(at).toISOString()}))}catch(_){}}
function clearAge(slot){try{localStorage.removeItem(AGE_KEYS[slot])}catch(_){}}
function persistAge(slot,value,origin,at){
  if(!value||!LIVE_ORIGINS.has(origin)||!Number.isFinite(at))return;
  const iso=new Date(at).toISOString(),m={...metadata(value)};
  if(m.liveAgeAnchorAt!==iso){m.liveAgeAnchorAt=iso;value.metadata=m;write(slot,value)}
  saveAge(slot,origin,at);
}
function freshness(slot,value){
  if(!value||saved(value)||disabled(value)){clearAge(slot);return null}
  const existing=ageRecord(slot);if(existing)return existing;
  const origin=liveOrigin(value);if(!origin)return null;
  const at=markerMs(value);if(!Number.isFinite(at))return null;
  persistAge(slot,value,origin,at);return{origin,at};
}
function ageLabel(at,now=Date.now()){
  const minutes=Math.floor(Math.max(0,now-Number(at))/STEP_MS)*5;
  return minutes<5?'Now':`${minutes}m`;
}

function installStyles(){
  if(document.getElementById(STYLE_ID))return;
  document.querySelectorAll('[id^="skyLiveHeaderV"][id$="Styles"]').forEach(node=>node.remove());
  const style=document.createElement('style');style.id=STYLE_ID;
  style.textContent=`
    #skyFoundationA>.sky-foundation-heading>.sky-card-title-stable,
    #skyFoundationB>.sky-foundation-heading>.sky-card-title-stable{flex:1 1 auto!important;min-width:0!important}
    .sky-live-header-control{
      position:relative;appearance:none;display:flex;align-items:center;justify-content:center;gap:4px;
      flex:0 0 auto;min-width:34px;height:32px;padding:0 6px;border:1px solid transparent;border-radius:999px;
      background:transparent;color:#625951;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent
    }
    .sky-live-header-age{font:800 .58rem/1 system-ui,sans-serif;white-space:nowrap}
    .sky-live-header-refresh{display:grid;place-items:center;width:17px;height:17px;flex:0 0 17px}
    .sky-live-header-refresh svg{display:block;width:17px;height:17px;overflow:visible}
    .sky-live-header-control:hover,.sky-live-header-control:focus-visible{outline:none;border-color:rgba(31,27,24,.15);background:rgba(31,27,24,.045);color:#201c18}
    .sky-live-header-control:focus-visible{box-shadow:0 0 0 2px rgba(31,27,24,.18)}
    .sky-live-header-control:disabled{cursor:progress;opacity:.5}
    @media(max-width:620px){.sky-live-header-age{display:none}.sky-live-header-control{width:30px;min-width:30px;padding:0}}
  `;
  document.head.appendChild(style);
}
function heading(slot){return document.querySelector(`#skyFoundation${slot}>.sky-foundation-heading`)}
function icon(){return '<span class="sky-live-header-refresh" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M20 6v5h-5" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 18v-5h5" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.6 10A7 7 0 0 0 6.1 6.8L4 9" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.4 14A7 7 0 0 0 17.9 17.2L20 15" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/></svg></span>'}
function ensureControl(slot){
  const head=heading(slot);if(!head)return null;
  let control=head.querySelector(`:scope > [data-live-header-control="${slot}"]`);
  if(!control){
    control=document.createElement('button');control.type='button';control.className='sky-live-header-control';control.dataset.liveHeaderControl=slot;control.dataset.finalNow=slot;
    control.innerHTML=`<span class="sky-live-header-age" data-live-age="${slot}"></span>${icon()}`;
  }
  const remove=head.querySelector(':scope > [data-remove-sky-b],:scope > .sky-slot-card-control--remove');
  if(control.parentElement!==head){if(remove)head.insertBefore(control,remove);else head.appendChild(control)}
  else if(remove&&control.nextElementSibling!==remove)head.insertBefore(control,remove);
  return control;
}
function release(slot){heading(slot)?.querySelector(`:scope > [data-live-header-control="${slot}"]`)?.remove()}
function renderSlot(slot){
  const state=freshness(slot,read(slot));if(!state){release(slot);return}
  const control=ensureControl(slot);if(!control)return;
  const label=ageLabel(state.at),age=control.querySelector('[data-live-age]');if(age)age.textContent=label;
  control.title=`Update to Now · ${label}`;control.setAttribute('aria-label',`Update to Now. Sky age: ${label}.`);
}
function nextDelay(){
  const now=Date.now();let soon=Infinity;
  ['A','B'].forEach(slot=>{const state=freshness(slot,read(slot));if(!state)return;const elapsed=Math.max(0,now-state.at),next=(Math.floor(elapsed/STEP_MS)+1)*STEP_MS;soon=Math.min(soon,next-elapsed+40)});
  return Number.isFinite(soon)?Math.max(1000,Math.min(STEP_MS,soon)):0;
}
function plan(){clearTimeout(timer);const delay=nextDelay();if(delay)timer=setTimeout(schedule,delay)}
function render(){queued=false;installStyles();renderSlot('A');renderSlot('B');plan()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(render)}
function stamp(event){
  const d=event?.detail||{},slot=d.slot,origin=String(d.origin||''),at=Date.parse(d.at||'');
  if(KEYS[slot]&&LIVE_ORIGINS.has(origin)&&Number.isFinite(at)){const value=read(slot);if(value)persistAge(slot,value,origin,at);else saveAge(slot,origin,at)}
  else if(KEYS[slot]&&!origin)clearAge(slot);
  schedule();
}
function start(){
  installStyles();render();
  window.addEventListener('relphi:sky-live-origin-changed',stamp);
  window.addEventListener('storage',event=>{if(!event.key||Object.values(KEYS).includes(event.key)||Object.values(AGE_KEYS).includes(event.key))schedule()});
  ['relphi:sky-foundation-ready','relphi:saved-sky-active-changed','relphi:saved-sky-library-changed','relphi:sky-name-updated','relphi:sky-b-restored','relphi:sky-session-recovered'].forEach(name=>window.addEventListener(name,schedule));
  new MutationObserver(schedule).observe(document.getElementById('skyFoundationRoot')||document.body,{childList:true,subtree:true});
}
window.RelphiSkyLiveHeader=Object.freeze({freshness,ageLabel});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
