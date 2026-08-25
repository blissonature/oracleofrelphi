// Live-origin Sky header: persistent age in five-minute increments + Update to Now refresh.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyLiveHeaderV1)return;
window.__relphiSkyLiveHeaderV1=true;

const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const AGE_KEYS={A:'relphiSkyLiveAgeAnchorA',B:'relphiSkyLiveAgeAnchorB'};
const SLOT_BY_KEY=new Map(Object.entries(KEYS).map(([slot,key])=>[key,slot]));
const STEP_MS=5*60*1000;
const LIVE_ORIGINS=new Set(['here-and-now','update-to-now']);
const STYLE_ID='skyLiveHeaderV8Styles';
let queued=false,timer=0;

function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
function write(slot,value){try{localStorage.setItem(KEYS[slot],JSON.stringify(value));return true}catch(_){return false}}
function profile(value){return value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{}}
function metadata(value){return value?.metadata&&typeof value.metadata==='object'?value.metadata:{}}
function finiteCoordinate(value){const number=Number(value);return Number.isFinite(number)?number:null}
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
  const m=metadata(value);
  if(m.liveNowDisabled===true||!LIVE_ORIGINS.has(String(m.liveNowOrigin||'')))return false;
  const marker=markerMs(value),current=profileMs(value);if(!Number.isFinite(marker)||!Number.isFinite(current)||Math.abs(marker-current)>90*1000)return false;
  const p=profile(value),mlat=finiteCoordinate(m.liveNowLatitude),mlon=finiteCoordinate(m.liveNowLongitude),lat=finiteCoordinate(p.latitude),lon=finiteCoordinate(p.longitude);
  if(mlat!==null&&lat!==null&&Math.abs(mlat-lat)>0.00001)return false;
  if(mlon!==null&&lon!==null&&Math.abs(mlon-lon)>0.00001)return false;
  return true;
}
function legacyLive(value){
  if(!value||typeof value!=='object'||metadata(value).liveNowDisabled===true)return false;
  const origin=window.RelphiSkyLiveOriginMigration?.legacyOrigin?.(value)||'';
  return LIVE_ORIGINS.has(origin);
}
function isLive(value){return markedLive(value)||legacyLive(value)}
function liveOrigin(value){
  const marked=String(metadata(value).liveNowOrigin||'');
  if(LIVE_ORIGINS.has(marked))return marked;
  const legacy=window.RelphiSkyLiveOriginMigration?.legacyOrigin?.(value)||'';
  return LIVE_ORIGINS.has(legacy)?legacy:'';
}
function liveMs(value){const marker=markerMs(value);return Number.isFinite(marker)?marker:profileMs(value)}
function parseAgeRecord(slot){
  try{
    const raw=JSON.parse(localStorage.getItem(AGE_KEYS[slot])||'null');
    const at=Date.parse(raw?.at||'');
    return Number.isFinite(at)?{at,origin:String(raw?.origin||'')} : null;
  }catch(_){return null}
}
function saveAgeRecord(slot,origin,timestamp){
  if(!AGE_KEYS[slot]||!LIVE_ORIGINS.has(origin)||!Number.isFinite(timestamp))return false;
  try{localStorage.setItem(AGE_KEYS[slot],JSON.stringify({origin,at:new Date(timestamp).toISOString()}));return true}catch(_){return false}
}
function clearAgeRecord(slot){try{if(AGE_KEYS[slot])localStorage.removeItem(AGE_KEYS[slot])}catch(_){}}
function payloadAgeMs(value){const parsed=Date.parse(metadata(value).liveAgeAnchorAt||'');return Number.isFinite(parsed)?parsed:NaN}
function persistAgeAnchor(slot,value,origin,timestamp){
  if(!value||typeof value!=='object'||!LIVE_ORIGINS.has(origin)||!Number.isFinite(timestamp))return timestamp;
  const iso=new Date(timestamp).toISOString();
  const m={...metadata(value)};
  if(m.liveAgeAnchorAt!==iso){m.liveAgeAnchorAt=iso;value.metadata=m;write(slot,value)}
  saveAgeRecord(slot,origin,timestamp);
  return timestamp;
}
function ageAnchorMs(slot,value){
  const origin=liveOrigin(value);if(!origin)return NaN;
  const payloadAnchor=payloadAgeMs(value);
  if(Number.isFinite(payloadAnchor)){saveAgeRecord(slot,origin,payloadAnchor);return payloadAnchor}
  const record=parseAgeRecord(slot);
  if(record&&record.origin===origin)return record.at;

  // Legacy live skies predate an immutable refresh timestamp. Adopt the surviving
  // live calculation timestamp once, and never let a page-load recalculation promote
  // that legacy state to "Now". A real Update-to-Now action replaces this anchor.
  const surviving=liveMs(value);if(!Number.isFinite(surviving))return NaN;
  const adopted=Math.min(surviving,Date.now()-STEP_MS);
  return persistAgeAnchor(slot,value,origin,adopted);
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
    #skyFoundationB>.sky-foundation-heading>.sky-card-title-stable[data-live-header-owned="true"]{
      grid-column:2!important;grid-row:1!important;align-self:stretch!important;display:block!important;width:auto!important;height:44px!important;min-width:0!important;box-sizing:border-box!important;overflow:visible!important;padding:0 .2rem 0 .8rem!important;margin:0!important;
    }
    #skyFoundationA>.sky-foundation-heading>.sky-card-title-stable[data-live-header-owned="true"]>.sky-live-status,
    #skyFoundationB>.sky-foundation-heading>.sky-card-title-stable[data-live-header-owned="true"]>.sky-live-status{
      position:relative!important;display:grid!important;grid-template-columns:minmax(0,1fr) 34px!important;grid-template-rows:44px!important;align-items:center!important;column-gap:2px!important;width:100%!important;height:44px!important;min-width:0!important;min-height:44px!important;box-sizing:border-box!important;padding:0!important;margin:0!important;border:0!important;border-radius:8px!important;background:transparent!important;box-shadow:none!important;color:#171411!important;cursor:pointer!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;text-align:left!important;
    }
    .sky-live-status>.sky-live-age{grid-column:1!important;grid-row:1!important;align-self:center!important;display:block!important;min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;padding:0!important;margin:0!important;border:0!important;background:none!important;box-shadow:none!important;color:inherit!important;font:800 .72rem/1.15 system-ui,sans-serif!important;text-align:left!important;pointer-events:none!important}
    .sky-live-status>.sky-live-refresh-icon{grid-column:2!important;grid-row:1!important;align-self:center!important;justify-self:center!important;display:grid!important;place-items:center!important;width:34px!important;height:44px!important;color:#625951!important;pointer-events:none!important;visibility:visible!important;opacity:1!important}
    .sky-live-status>.sky-live-refresh-icon svg{display:block!important;width:19px!important;height:19px!important;overflow:visible!important;visibility:visible!important;opacity:1!important;pointer-events:none!important}
    .sky-live-status:hover,.sky-live-status:focus-visible{outline:none!important;background:rgba(31,27,24,.045)!important}
    .sky-live-status:hover>.sky-live-refresh-icon,.sky-live-status:focus-visible>.sky-live-refresh-icon{color:#201c18!important}
    .sky-live-status:focus-visible{box-shadow:0 0 0 2px rgba(31,27,24,.22)!important}
    .sky-live-status:disabled{cursor:progress!important;opacity:.5!important}
    @media(hover:hover){
      .sky-live-status::after{content:attr(data-tooltip);position:absolute;left:50%;bottom:calc(100% + 5px);z-index:90;transform:translateX(-50%) translateY(2px);padding:.38rem .52rem;border-radius:.42rem;background:#111;color:#fff;font:700 .76rem/1 system-ui,sans-serif;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .12s ease,transform .12s ease}
      .sky-live-status:hover::after,.sky-live-status:focus-visible::after{opacity:1;transform:translateX(-50%) translateY(0)}
    }
    @media(max-width:620px){
      #skyFoundationA>.sky-foundation-heading>.sky-card-title-stable[data-live-header-owned="true"],#skyFoundationB>.sky-foundation-heading>.sky-card-title-stable[data-live-header-owned="true"]{padding:0 .1rem 0 .65rem!important}
      .sky-live-status{grid-template-columns:minmax(0,1fr) 32px!important}
      .sky-live-status>.sky-live-age{font-size:.68rem!important}
      .sky-live-status>.sky-live-refresh-icon{width:32px!important}
    }
  `;
  document.head.appendChild(style);
}
function host(slot,create=false){
  const heading=document.querySelector(`#skyFoundation${slot}>.sky-foundation-heading`);if(!heading)return null;
  let container=heading.querySelector(':scope > .sky-card-title-stable');
  if(!container&&create){
    container=document.createElement('span');container.className='sky-card-title-stable';
    const foundationName=heading.querySelector(':scope > .sky-foundation-name');
    if(foundationName)heading.insertBefore(container,foundationName);else heading.appendChild(container);
  }
  return container;
}
function statusButton(slot){
  const button=document.createElement('button');
  button.type='button';button.className='sky-live-status';button.dataset.finalNow=slot;button.dataset.liveHeaderRefresh=slot;button.dataset.tooltip='Update to Now';button.title='Update to Now';button.setAttribute('aria-label','Update to Now');
  const age=document.createElement('span');age.className='sky-live-age';age.dataset.liveAge=slot;
  const icon=document.createElement('span');icon.className='sky-live-refresh-icon';icon.setAttribute('aria-hidden','true');
  icon.innerHTML='<svg viewBox="0 0 24 24" focusable="false"><path d="M20 6v5h-5" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 18v-5h5" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.6 10A7 7 0 0 0 6.1 6.8L4 9" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.4 14A7 7 0 0 0 17.9 17.2L20 15" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  button.append(age,icon);return button;
}
function renderLive(slot,container,value){
  const label=ageLabel(ageAnchorMs(slot,value));container.dataset.liveHeaderOwned='true';
  let control=container.querySelector(`:scope > [data-live-header-refresh="${slot}"]`);
  if(!control){control=statusButton(slot);container.replaceChildren(control)}
  const age=control.querySelector('.sky-live-age');if(age&&age.textContent!==label)age.textContent=label;
  control.setAttribute('aria-label',`Update to Now. Sky age: ${label}`);
}
function release(slot,container){
  if(!container||container.dataset.liveHeaderOwned!=='true')return;
  delete container.dataset.liveHeaderOwned;container.replaceChildren();window.dispatchEvent(new CustomEvent('relphi:sky-live-header-released',{detail:{slot}}));
}
function renderSlot(slot){
  const value=read(slot);
  if(isLive(value)){const container=host(slot,true);if(container)renderLive(slot,container,value);return}
  clearAgeRecord(slot);release(slot,host(slot,false));
}
function nextDelay(){
  const now=Date.now();let soonest=Infinity;
  for(const slot of ['A','B']){const value=read(slot);if(!isLive(value))continue;const timestamp=ageAnchorMs(slot,value);if(!Number.isFinite(timestamp))continue;const elapsed=Math.max(0,now-timestamp),next=(Math.floor(elapsed/STEP_MS)+1)*STEP_MS;soonest=Math.min(soonest,next-elapsed+40)}
  return Number.isFinite(soonest)?Math.max(1000,Math.min(STEP_MS,soonest)):0;
}
function plan(){clearTimeout(timer);const delay=nextDelay();if(delay)timer=setTimeout(schedule,delay)}
function render(){queued=false;installStyles();renderSlot('A');renderSlot('B');plan()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(render)}
function clearManualLiveIdentity(slot){
  const value=read(slot);if(!value||typeof value!=='object')return false;const p={...profile(value)};if(String(p.source||'')!=='where-when-v2')return false;const m={...metadata(value)};
  const hadLive=!!(m.liveNowOrigin||m.liveNowAt||p.liveNowOrigin||p.liveNowAt||m.liveNowDisabled!==true);if(!hadLive)return false;
  delete m.liveNowOrigin;delete m.liveNowAt;delete m.liveAgeAnchorAt;delete m.liveNowLatitude;delete m.liveNowLongitude;delete m.liveNowMigrated;m.liveNowDisabled=true;m.liveNowDisabledReason='custom-where-when';delete p.liveNowOrigin;delete p.liveNowAt;value.metadata=m;value.calcProfile=p;
  clearAgeRecord(slot);
  if(!write(slot,value))return false;window.dispatchEvent(new CustomEvent('relphi:sky-live-origin-changed',{detail:{slot,origin:'',reason:'custom-where-when'}}));return true;
}
function stampAgeFromLiveEvent(event){
  const detail=event?.detail||{},slot=detail.slot,origin=String(detail.origin||''),at=Date.parse(detail.at||'');
  if(KEYS[slot]&&LIVE_ORIGINS.has(origin)&&Number.isFinite(at)){
    const value=read(slot);if(value&&typeof value==='object')persistAgeAnchor(slot,value,origin,at);else saveAgeRecord(slot,origin,at);
  }
  schedule();
}
function onStorage(event){const slot=SLOT_BY_KEY.get(event?.key);if(slot)clearManualLiveIdentity(slot);schedule()}
window.addEventListener('relphi:sky-name-updated',event=>{
  const detail=event.detail||{},source=String(detail.source||'');
  if(detail.slot&&/^update-to-now(?:-stable)?$/.test(source)){const value=read(detail.slot);if(value&&typeof value==='object'){const m={...metadata(value)};delete m.liveNowDisabled;delete m.liveNowDisabledReason;value.metadata=m;write(detail.slot,value)}}
  schedule();
});
window.addEventListener('relphi:sky-live-origin-changed',stampAgeFromLiveEvent);
window.addEventListener('storage',onStorage);
['relphi:sky-foundation-ready','relphi:saved-sky-active-changed','relphi:saved-sky-library-changed','relphi:sky-name-updated'].forEach(name=>window.addEventListener(name,schedule));
window.RelphiSkyLiveHeader=Object.freeze({isLive,legacyLive,ageLabel,liveMs,ageAnchorMs});
function start(){installStyles();schedule()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
