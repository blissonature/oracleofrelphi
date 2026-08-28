// Persistent Sky freshness header v4.
// A successful Update to Now owns the freshness clock. Manual/saved skies clear it.
// The age + refresh control is a direct Sky-heading child, outside Saved-skies title ownership.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyLiveHeaderV4)return;
window.__relphiSkyLiveHeaderV4=true;
window.__relphiSkyLiveHeaderV3=true;
window.__relphiSkyLiveHeaderV2=true;
window.__relphiSkyLiveHeaderV1=true;

const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const AGE_KEYS={A:'relphiSkyLiveAgeAnchorA',B:'relphiSkyLiveAgeAnchorB'};
const STEP_MS=5*60*1000;
const LIVE_ORIGINS=new Set(['here-and-now','update-to-now','use-now']);
const STYLE_ID='skyLiveHeaderV11Styles';
let queued=false,timer=0;

const normalize=value=>String(value||'').trim().toLowerCase().replace(/\s+/g,' ');
function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
function write(slot,value){try{localStorage.setItem(KEYS[slot],JSON.stringify(value));return true}catch(_){return false}}
function profile(value){return value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{}}
function metadata(value){return value?.metadata&&typeof value.metadata==='object'?value.metadata:{}}
function savedSky(value){const m=metadata(value);return !!String(m.savedSkyId||m.savedSkyName||m.savedSkyLoadedAt||'').trim()}
function disabledSky(value){return metadata(value).liveNowDisabled===true}
function profileMs(value){
  const p=profile(value);
  if(p.instant){const direct=Date.parse(p.instant);if(Number.isFinite(direct))return direct}
  const raw=String(p.dateTime||value?.dateTime||'').trim();if(!raw)return NaN;
  const zone=String(p.timeZone||'').trim();
  try{if(window.luxon?.DateTime&&zone){const parsed=window.luxon.DateTime.fromISO(raw,{zone,setZone:true});if(parsed?.isValid)return parsed.toUTC().toMillis()}}catch(_){}
  const fallback=Date.parse(raw);return Number.isFinite(fallback)?fallback:NaN;
}
function markerMs(value){const parsed=Date.parse(metadata(value).liveNowAt||profile(value).liveNowAt||'');return Number.isFinite(parsed)?parsed:NaN}
function payloadAgeMs(value){const parsed=Date.parse(metadata(value).liveAgeAnchorAt||'');return Number.isFinite(parsed)?parsed:NaN}
function explicitOrigin(value){
  const m=String(metadata(value).liveNowOrigin||''),p=String(profile(value).liveNowOrigin||'');
  if(LIVE_ORIGINS.has(m))return m;
  if(LIVE_ORIGINS.has(p))return p;
  return'';
}
function legacyOrigin(value){
  const migrated=window.RelphiSkyLiveOriginMigration?.legacyOrigin?.(value)||'';
  if(LIVE_ORIGINS.has(migrated))return migrated;
  if(!value||savedSky(value)||disabledSky(value))return'';
  const p=profile(value),m=metadata(value);
  const names=[value.name,value.title,value.displayName,value.skyName,p.name,p.title,m.name,m.title].map(normalize);
  const query=normalize(p.locationQuery),location=normalize(p.location);
  const currentLocation=query==='my current location'||query==='current location'||location==='current location';
  if(names.includes('now')&&currentLocation&&Number.isFinite(profileMs(value)))return'update-to-now';
  return'';
}
function liveOrigin(value){return explicitOrigin(value)||legacyOrigin(value)}
function liveMs(value){const marked=markerMs(value);return Number.isFinite(marked)?marked:profileMs(value)}

function parseAgeRecord(slot){
  try{
    const raw=JSON.parse(localStorage.getItem(AGE_KEYS[slot])||'null'),at=Date.parse(raw?.at||'');
    return Number.isFinite(at)&&LIVE_ORIGINS.has(String(raw?.origin||''))?{origin:String(raw.origin),at}:null;
  }catch(_){return null}
}
function saveAgeRecord(slot,origin,timestamp){
  if(!AGE_KEYS[slot]||!LIVE_ORIGINS.has(origin)||!Number.isFinite(timestamp))return false;
  try{localStorage.setItem(AGE_KEYS[slot],JSON.stringify({origin,at:new Date(timestamp).toISOString()}));return true}catch(_){return false}
}
function clearAgeRecord(slot){try{localStorage.removeItem(AGE_KEYS[slot])}catch(_){}}
function persistAgeAnchor(slot,value,origin,timestamp){
  if(!value||typeof value!=='object'||!LIVE_ORIGINS.has(origin)||!Number.isFinite(timestamp))return;
  const iso=new Date(timestamp).toISOString(),m={...metadata(value)};
  if(m.liveAgeAnchorAt!==iso){m.liveAgeAnchorAt=iso;value.metadata=m;write(slot,value)}
  saveAgeRecord(slot,origin,timestamp);
}

function freshness(slot,value){
  if(!value||savedSky(value)||disabledSky(value)){
    clearAgeRecord(slot);
    return null;
  }

  // The immutable local record is authoritative once Update to Now succeeds.
  // Calculator/version strings do not invalidate it.
  const record=parseAgeRecord(slot);
  if(record)return record;

  const origin=liveOrigin(value);
  const payloadAnchor=payloadAgeMs(value);
  if(Number.isFinite(payloadAnchor)){
    const resolved=origin||'update-to-now';
    saveAgeRecord(slot,resolved,payloadAnchor);
    return{origin:resolved,at:payloadAnchor};
  }
  if(!origin)return null;

  // Recover legacy/damaged live skies as stale. Never promote them to Now merely
  // because the page loaded or a foundation module recalculated the payload.
  const surviving=liveMs(value);
  if(!Number.isFinite(surviving))return null;
  const adopted=Math.min(surviving,Date.now()-STEP_MS);
  persistAgeAnchor(slot,value,origin,adopted);
  return{origin,at:adopted};
}
function ageLabel(timestamp,now=Date.now()){
  const elapsed=Math.max(0,Number(now)-Number(timestamp));
  const minutes=Math.floor(elapsed/STEP_MS)*5;
  return minutes<5?'Now':`${minutes} minutes ago`;
}

function installStyles(){
  if(document.getElementById(STYLE_ID))return;
  document.querySelectorAll('[id^="skyLiveHeaderV"][id$="Styles"]').forEach(node=>node.remove());
  const style=document.createElement('style');style.id=STYLE_ID;
  style.textContent=`
    #skyFoundationA>.sky-foundation-heading>.sky-card-title-stable[data-live-header-owned="true"],
    #skyFoundationB>.sky-foundation-heading>.sky-card-title-stable[data-live-header-owned="true"]{display:none!important}
    .sky-live-header-control{position:relative;appearance:none;display:grid;grid-template-columns:minmax(0,1fr) 34px;align-items:center;gap:3px;flex:1 1 auto;min-width:0;height:43px;margin:0;padding:0 0 0 .8rem;border:0;border-radius:8px;background:transparent;color:#171411;cursor:pointer;text-align:left;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
    .sky-live-header-age{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:800 .72rem/1.15 system-ui,sans-serif;pointer-events:none}
    .sky-live-header-refresh{display:grid!important;place-items:center;width:34px;height:43px;color:#625951;pointer-events:none;visibility:visible!important;opacity:1!important}
    .sky-live-header-refresh svg{display:block!important;width:21px;height:21px;overflow:visible;visibility:visible!important;opacity:1!important}
    .sky-live-header-control:hover,.sky-live-header-control:focus-visible{outline:none;background:rgba(31,27,24,.045)}
    .sky-live-header-control:hover .sky-live-header-refresh,.sky-live-header-control:focus-visible .sky-live-header-refresh{color:#201c18}
    .sky-live-header-control:focus-visible{box-shadow:0 0 0 2px rgba(31,27,24,.22)}
    .sky-live-header-control:disabled{cursor:progress;opacity:.5}
    @media(hover:hover){.sky-live-header-control::after{content:attr(data-tooltip);position:absolute;left:50%;bottom:calc(100% + 5px);z-index:90;transform:translateX(-50%) translateY(2px);padding:.38rem .52rem;border-radius:.42rem;background:#111;color:#fff;font:700 .76rem/1 system-ui,sans-serif;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .12s ease,transform .12s ease}.sky-live-header-control:hover::after,.sky-live-header-control:focus-visible::after{opacity:1;transform:translateX(-50%) translateY(0)}}
    @media(max-width:620px){.sky-live-header-control{grid-template-columns:minmax(0,1fr) 32px;padding-left:.65rem}.sky-live-header-age{font-size:.68rem}.sky-live-header-refresh{width:32px}}
  `;
  document.head.appendChild(style);
}
function heading(slot){return document.querySelector(`#skyFoundation${slot}>.sky-foundation-heading`)}
function titleHost(slot,create=false){
  const head=heading(slot);if(!head)return null;
  let host=head.querySelector(':scope > .sky-card-title-stable');
  if(!host&&create){
    host=document.createElement('span');host.className='sky-card-title-stable';
    const source=head.querySelector(':scope > .sky-foundation-name');
    if(source)head.insertBefore(host,source);else head.appendChild(host);
  }
  return host;
}
function makeControl(slot){
  const button=document.createElement('button');
  button.type='button';button.className='sky-live-header-control';button.dataset.liveHeaderControl=slot;button.dataset.finalNow=slot;button.dataset.tooltip='Update to Now';button.title='Update to Now';
  const age=document.createElement('span');age.className='sky-live-header-age';age.dataset.liveAge=slot;
  const icon=document.createElement('span');icon.className='sky-live-header-refresh';icon.setAttribute('aria-hidden','true');
  icon.innerHTML='<svg viewBox="0 0 24 24" focusable="false"><path d="M20 6v5h-5" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 18v-5h5" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.6 10A7 7 0 0 0 6.1 6.8L4 9" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.4 14A7 7 0 0 0 17.9 17.2L20 15" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  button.append(age,icon);
  return button;
}
function ensureControl(slot){
  const head=heading(slot);if(!head)return null;
  let control=head.querySelector(`:scope > [data-live-header-control="${slot}"]`);
  if(control)return control;
  control=makeControl(slot);
  const trailing=head.querySelector(':scope > [data-remove-sky-b],:scope > [data-card-add-sky-b],:scope > .sky-slot-card-control');
  if(trailing)head.insertBefore(control,trailing);else head.appendChild(control);
  return control;
}
function renderFresh(slot,state){
  const host=titleHost(slot,true),control=ensureControl(slot);if(!host||!control)return;
  host.dataset.liveHeaderOwned='true';
  const label=ageLabel(state.at),age=control.querySelector('.sky-live-header-age');
  if(age&&age.textContent!==label)age.textContent=label;
  control.setAttribute('aria-label',`Update to Now. Sky age: ${label}`);
}
function release(slot){
  heading(slot)?.querySelector(`:scope > [data-live-header-control="${slot}"]`)?.remove();
  const host=titleHost(slot,false);if(!host||host.dataset.liveHeaderOwned!=='true')return;
  delete host.dataset.liveHeaderOwned;host.replaceChildren();
  window.dispatchEvent(new CustomEvent('relphi:sky-live-header-released',{detail:{slot}}));
}
function renderSlot(slot){const state=freshness(slot,read(slot));if(state)renderFresh(slot,state);else release(slot)}
function nextDelay(){
  const now=Date.now();let soonest=Infinity;
  for(const slot of ['A','B']){
    const state=freshness(slot,read(slot));if(!state)continue;
    const elapsed=Math.max(0,now-state.at),next=(Math.floor(elapsed/STEP_MS)+1)*STEP_MS;
    soonest=Math.min(soonest,next-elapsed+40);
  }
  return Number.isFinite(soonest)?Math.max(1000,Math.min(STEP_MS,soonest)):0;
}
function plan(){clearTimeout(timer);const delay=nextDelay();if(delay)timer=setTimeout(schedule,delay)}
function render(){queued=false;installStyles();renderSlot('A');renderSlot('B');plan()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(render)}

function stamp(event){
  const detail=event?.detail||{},slot=detail.slot,origin=String(detail.origin||''),at=Date.parse(detail.at||'');
  if(KEYS[slot]&&LIVE_ORIGINS.has(origin)&&Number.isFinite(at)){
    const value=read(slot);
    if(value&&typeof value==='object')persistAgeAnchor(slot,value,origin,at);else saveAgeRecord(slot,origin,at);
  }else if(KEYS[slot]&&!origin){
    clearAgeRecord(slot);
  }
  schedule();
}
function onStorage(event){
  if(!event?.key||Object.values(KEYS).includes(event.key)||Object.values(AGE_KEYS).includes(event.key))schedule();
}
window.addEventListener('relphi:sky-live-origin-changed',stamp);
window.addEventListener('storage',onStorage);
['relphi:sky-foundation-ready','relphi:saved-sky-active-changed','relphi:saved-sky-library-changed','relphi:sky-name-updated'].forEach(name=>window.addEventListener(name,schedule));
window.RelphiSkyLiveHeader=Object.freeze({freshness,ageLabel,liveMs});
function start(){installStyles();render()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
