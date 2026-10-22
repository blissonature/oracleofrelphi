// Saved Skies is fingerprint-first and private by default. Personal details are revealed deliberately.
// New Sky behavior belongs to the core Saved Skies controller; this layer only decorates picker content.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkySavedSkiesLabelsV5)return;
window.__relphiSkySavedSkiesLabelsV5=true;
window.__relphiSkySavedSkiesLabelsV4=true;
window.__relphiSkySavedSkiesLabelsV3=true;
window.__relphiSkySavedSkiesLabelsV2=true;
window.__relphiSkySavedSkiesLabelsV1=true;

const LIBRARY_KEY='relphiSkyLibraryV1';
let queued=false;

function readJson(key,fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch(_){return fallback}}
function normalize(value){return String(value||'').trim().toLowerCase().replace(/\s+/g,' ')}
function recordRef(record){return String(record?.id||record?.savedSkyId||record?.metadata?.savedSkyId||`legacy:${normalize(record?.name)}`)}
function library(){const fromApi=window.RelphiSkySavedSkyIdentity?.library?.();const list=Array.isArray(fromApi)?fromApi:readJson(LIBRARY_KEY,[]);return Array.isArray(list)?list:[]}
function profile(record){return record?.calcProfile&&typeof record.calcProfile==='object'?record.calcProfile:{}}
function metadata(record){return record?.metadata&&typeof record.metadata==='object'?record.metadata:{}}
function activePickerSlot(){return document.querySelector('[data-saved-sky-trigger][aria-expanded="true"]')?.dataset.savedSkyTrigger||''}

function installStyle(){
  if(document.getElementById('skySavedSkiesLabelsV2Style'))return;
  const style=document.createElement('style');style.id='skySavedSkiesLabelsV2Style';style.textContent=`
#skySavedSkiesPopover .sky-saved-list-item[data-private-sky-fingerprint="true"]{
  display:grid!important;
  grid-template-columns:max-content minmax(0,1fr) 20px!important;
  grid-template-areas:"fingerprint copy check"!important;
  column-gap:12px!important;
  align-items:center!important;
  min-height:64px!important;
  padding:6px 8px!important;
}
/* Global .sky-ph-heptagram has min-height:270px. At 44px wide, the
   preserved SVG aspect ratio centers its drawing in that tall viewport,
   visually shifting it into a different Saved Sky row. Constrain the actual
   SVG viewport, not the row or the source geometry. */
#skySavedSkiesPopover .sky-saved-canonical-heptagram{
  display:grid!important;
  place-items:center!important;
  width:44px!important;
  height:44px!important;
  min-width:0!important;
  min-height:0!important;
}
#skySavedSkiesPopover .sky-saved-canonical-heptagram > svg.sky-saved-microheptagram{
  display:block!important;
  width:44px!important;
  height:44px!important;
  min-width:0!important;
  min-height:0!important;
  max-width:44px!important;
  max-height:44px!important;
  margin:0!important;
  transform:none!important;
}
#skySavedSkiesPopover .sky-saved-microheptagram *{vector-effect:none!important}
#skySavedSkiesPopover .sky-saved-microheptagram .sky-ph-week-segment,
#skySavedSkiesPopover .sky-saved-microheptagram .sky-ph-hour-segment{
  stroke-width:5!important;stroke-dasharray:none!important;stroke-linecap:round!important;filter:none!important;
}
#skySavedSkiesPopover .sky-saved-microheptagram .sky-ph-week-segment.future,
#skySavedSkiesPopover .sky-saved-microheptagram .sky-ph-hour-segment.future{
  stroke:#77736e!important;opacity:.7!important;
}
#skySavedSkiesPopover .sky-saved-microheptagram .sky-ph-week-segment.past,
#skySavedSkiesPopover .sky-saved-microheptagram .sky-ph-week-segment.current,
#skySavedSkiesPopover .sky-saved-microheptagram .sky-ph-hour-segment.current{
  stroke:#c9211e!important;opacity:1!important;
}
#skySavedSkiesPopover .sky-saved-microheptagram .sky-ph-day-ruler-ring,
#skySavedSkiesPopover .sky-saved-microheptagram .sky-ph-node-glyph{filter:none!important}
#skySavedSkiesPopover .sky-saved-fingerprint-copy{
  grid-area:copy;display:grid;align-content:center;gap:2px;min-width:0;text-align:left
}
#skySavedSkiesPopover .sky-saved-fingerprint-copy-name{
  min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#211d19;
  font:800 .68rem/1.18 system-ui,sans-serif
}
#skySavedSkiesPopover .sky-saved-fingerprint-copy-when,
#skySavedSkiesPopover .sky-saved-fingerprint-copy-where{
  min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#756c64;
  font:650 .57rem/1.2 system-ui,sans-serif
}
#skySavedSkiesPopover .sky-saved-fingerprint-triptych{grid-area:fingerprint}
@media(max-width:420px){
  #skySavedSkiesPopover .sky-saved-list-item[data-private-sky-fingerprint="true"]{column-gap:9px!important}
  #skySavedSkiesPopover .sky-saved-fingerprint-copy-name{font-size:.65rem}
  #skySavedSkiesPopover .sky-saved-fingerprint-copy-when,
  #skySavedSkiesPopover .sky-saved-fingerprint-copy-where{font-size:.54rem}
  /* Match the actual artwork widths instead of squeezing a 128px triptych into 90px. */
  #skySavedSkiesPopover .sky-saved-list-row{grid-template-columns:minmax(0,1fr) 25px!important}
  #skySavedSkiesPopover .sky-saved-list-item[data-private-sky-fingerprint="true"]{
    grid-template-columns:132px minmax(0,1fr) 14px!important;
    grid-template-areas:"fingerprint copy check"!important;
    column-gap:6px!important;min-width:0!important;width:100%!important;
    padding:6px!important;box-sizing:border-box!important;
  }
  #skySavedSkiesPopover .sky-saved-fingerprint-triptych{
    display:grid!important;grid-template-columns:44px 44px 28px!important;
    gap:6px!important;width:128px!important;max-width:128px!important;
    min-width:0!important;align-items:center!important;
  }
  #skySavedSkiesPopover .sky-saved-fingerprint-piece{
    width:44px!important;height:44px!important;min-width:0!important;
  }
  #skySavedSkiesPopover .sky-saved-fingerprint-piece[data-fingerprint-part="card"]{width:28px!important}
  #skySavedSkiesPopover .sky-saved-fingerprint-piece svg{width:44px!important;height:44px!important}
  #skySavedSkiesPopover .sky-saved-canonical-heptagram,
  #skySavedSkiesPopover .sky-saved-canonical-heptagram > svg.sky-saved-microheptagram{
    width:44px!important;height:44px!important;min-height:0!important;
  }
  #skySavedSkiesPopover .sky-saved-fingerprint-copy{
    min-width:0!important;max-width:100%!important;overflow:hidden!important;
  }

/* Modern private Sky cards: the three data-derived fingerprints are the identity.
   The layout never starts with a person's name, birth details, or location. */
#skySavedSkiesPopover .sky-saved-list{
  display:flex;
  flex-direction:column;
  gap:5px;
  padding:8px 8px 12px;
}
#skySavedSkiesPopover .sky-saved-library-instruction{
  display:flex;justify-content:space-between;align-items:center;gap:8px;
  padding:7px 4px 4px;
  color:#77716c;
  font:650 .61rem/1.35 system-ui,sans-serif;
}
#skySavedSkiesPopover .sky-saved-library-instruction strong{
  color:#4a423a;font:800 .65rem/1.25 system-ui,sans-serif;
}
#skySavedSkiesPopover .sky-saved-list-row{
  position:relative;
  display:grid;
  grid-template-columns:minmax(0,1fr) 30px;
  align-items:stretch;
  gap:5px;
  padding:0;
  border:1px solid rgba(31,27,24,.12);
  border-radius:12px;
  background:#fff;
  transition:background-color .14s,border-color .14s,box-shadow .14s;
}
#skySavedSkiesPopover .sky-saved-list-row.is-active{
  background:#f9f4ee;
  border-color:#b9aa99;
  box-shadow:inset 3px 0 #8d7766;
}
#skySavedSkiesPopover .sky-saved-list-row:is(:hover,:focus-within,.is-identity-revealed){
  z-index:2;border-color:rgba(70,58,49,.34);
  box-shadow:0 2px 10px rgba(45,36,29,.07);
}
#skySavedSkiesPopover .sky-saved-list-item[data-private-sky-fingerprint="true"]{
  display:grid!important;
  grid-template-columns:136px minmax(0,1fr) 14px!important;
  grid-template-areas:"fingerprint copy check"!important;
  column-gap:6px!important;
  min-width:0!important;
  min-height:62px!important;
  width:100%!important;
  padding:7px 7px!important;
  border-radius:11px!important;
}
#skySavedSkiesPopover .sky-saved-fingerprint-triptych{
  display:grid!important;grid-template-columns:44px 44px 28px!important;
  gap:6px!important;width:128px!important;max-width:128px!important;
  align-items:center!important;justify-content:start!important;
}
#skySavedSkiesPopover .sky-saved-fingerprint-piece{
  width:44px!important;height:44px!important;min-width:0!important;
}
#skySavedSkiesPopover .sky-saved-fingerprint-piece[data-fingerprint-part="card"]{width:28px!important}
#skySavedSkiesPopover .sky-saved-fingerprint-piece svg{width:44px!important;height:44px!important}
#skySavedSkiesPopover .sky-saved-fingerprint-copy{
  grid-area:copy;min-width:0;max-width:100%;
  display:grid;align-content:center;gap:2px;
  visibility:hidden;opacity:0;
  pointer-events:none;
  transition:opacity .13s ease;
}
#skySavedSkiesPopover .sky-saved-fingerprint-copy-when,
#skySavedSkiesPopover .sky-saved-fingerprint-copy-where{
  color:#746b63;font:600 .59rem/1.26 system-ui,sans-serif;
}
#skySavedSkiesPopover .sky-saved-list-check{
  grid-area:check;align-self:center;justify-self:center;
  font-size:.82rem;
}
#skySavedSkiesPopover .sky-saved-list-delete{
  margin-right:3px;align-self:center;justify-self:center;
  background:transparent;
  color:#7c7168;
}
@media (hover:hover) and (pointer:fine){
  #skySavedSkiesPopover .sky-saved-list-row:hover .sky-saved-fingerprint-copy{
    visibility:visible;opacity:1;
  }
}
#skySavedSkiesPopover .sky-saved-list-row:is(:focus-within,.is-identity-revealed) .sky-saved-fingerprint-copy{
  visibility:visible;opacity:1;
}
#skySavedSkiesPopover .sky-saved-list-item:focus-visible{
  outline:2px solid #2462d0!important;outline-offset:1px!important;
}
#skySavedSkiesPopover .sky-saved-list-row.is-confirming-delete{
  border-color:#b7817e;background:#fff8f7;
}
@media(max-width:420px){
  #skySavedSkiesPopover .sky-saved-list-item[data-private-sky-fingerprint="true"]{
    grid-template-columns:132px minmax(0,1fr) 14px!important;
    grid-template-areas:"fingerprint copy check"!important;
  }
  #skySavedSkiesPopover .sky-saved-fingerprint-copy{
    min-width:0!important;
    overflow:hidden!important;
  }
}
@media(max-width:335px){
  #skySavedSkiesPopover .sky-saved-list-item[data-private-sky-fingerprint="true"]{
    grid-template-columns:128px minmax(0,1fr) 12px!important;
    column-gap:3px!important;
  }
}
@media(prefers-reduced-motion:reduce){
  #skySavedSkiesPopover .sky-saved-list-row,
  #skySavedSkiesPopover .sky-saved-fingerprint-copy{transition:none}
}

}
`;
  document.head.appendChild(style);
}

function dateTime(record){
  const p=profile(record),zone=String(p.timeZone||record?.timeZone||'').trim(),instant=String(p.instant||record?.instant||'').trim(),raw=String(p.dateTime||record?.dateTime||'').trim();
  const unknown=p.timeUnknown===true||record?.profile?.timeUnknown===true||record?.timeUnknown===true;
  if(window.luxon?.DateTime){
    try{
      let dt=null;
      // Unknown-time skies retain their calendar date; their stored midnight is a placeholder.
      if(unknown&&raw)dt=window.luxon.DateTime.fromISO(raw,zone?{zone,setZone:true}:{setZone:true});
      else if(instant){dt=window.luxon.DateTime.fromISO(instant,{setZone:true});if(dt?.isValid&&zone)dt=dt.setZone(zone)}
      else if(raw){dt=window.luxon.DateTime.fromISO(raw,zone?{zone,setZone:true}:{setZone:true})}
      if(dt?.isValid)return unknown?`${dt.toFormat('MMM d, yyyy')} · unknown time`:dt.toFormat('MMM d, yyyy · h:mm a ZZZZ');
    }catch(_){}
  }
  if(unknown){const date=String(raw||instant).slice(0,10);return[date,'unknown time'].filter(Boolean).join(' · ')}
  if(raw)return raw.replace('T',' · ');
  if(instant){const parsed=new Date(instant);if(!Number.isNaN(parsed.getTime()))return parsed.toLocaleString()}
  return'';
}
function place(record){
  const p=profile(record),m=metadata(record);
  for(const candidate of [p.location,p.locationName,p.place,p.placeName,m.location,m.locationName,record?.location,record?.locationName]){
    const text=String(candidate||'').trim();if(text)return text;
  }
  const lat=Number(p.latitude??record?.latitude),lon=Number(p.longitude??record?.longitude);
  return Number.isFinite(lat)&&Number.isFinite(lon)?`${lat.toFixed(3)}°, ${lon.toFixed(3)}°`:'';
}
function copyFor(record){
  const root=document.createElement('span');root.className='sky-saved-fingerprint-copy';root.dataset.savedFingerprintCopy='true';root.setAttribute('aria-hidden','true');
  const name=document.createElement('span');name.className='sky-saved-fingerprint-copy-name';name.textContent=String(record?.name||'Saved sky').trim()||'Saved sky';
  const when=document.createElement('span');when.className='sky-saved-fingerprint-copy-when';when.textContent=dateTime(record);
  const where=document.createElement('span');where.className='sky-saved-fingerprint-copy-where';where.textContent=place(record);
  root.append(name);if(when.textContent)root.append(when);if(where.textContent)root.append(where);return root;
}
function signature(record){return JSON.stringify([String(record?.name||''),dateTime(record),place(record)])}

function ensureAddSkyB(popover){
  const list=popover.querySelector('.sky-saved-list');if(!list)return;
  const existing=list.querySelector('[data-sky-add-b-row]');
  const shouldShow=activePickerSlot()==='A'&&!window.RelphiSkySlotControls?.hasSkyB?.();
  if(!shouldShow){existing?.remove();return}
  if(existing)return;
  const row=document.createElement('div');row.className='sky-create-new-row';row.dataset.skyAddBRow='true';
  const button=document.createElement('button');button.type='button';button.className='sky-create-new-button';button.dataset.skyCommand='add-b';button.setAttribute('aria-label','Add Sky B for comparison');
  const plus=document.createElement('span');plus.className='sky-create-new-plus';plus.setAttribute('aria-hidden','true');plus.textContent='+';
  const label=document.createElement('span');label.textContent='Add Sky B';button.append(plus,label);row.appendChild(button);
  const newRow=list.querySelector('[data-sky-create-new]');
  if(newRow)newRow.insertAdjacentElement('afterend',row);else list.prepend(row);
}

function decorate(){
  queued=false;installStyle();
  const popover=document.getElementById('skySavedSkiesPopover');if(!popover||popover.hidden)return;
  ensureAddSkyB(popover);
  const list=popover.querySelector('.sky-saved-list');
  if(list&&!list.querySelector('.sky-saved-library-instruction')){
    const hint=document.createElement('div');hint.className='sky-saved-library-instruction';
    hint.innerHTML='<strong>Saved skies</strong><span>Hover or hold to identify</span>';
    const first=list.querySelector('.sky-saved-list-row,.sky-saved-empty');
    if(first)list.insertBefore(hint,first);else list.appendChild(hint);
  }
  const byRef=new Map(library().map(record=>[recordRef(record),record]));
  popover.querySelectorAll('.sky-saved-list-row').forEach(row=>{
    const item=row.querySelector('[data-saved-sky-ref][data-private-sky-fingerprint="true"]');if(!item)return;
    const record=byRef.get(String(item.dataset.savedSkyRef||''));if(!record)return;
    const sig=signature(record);let copy=item.querySelector('[data-saved-fingerprint-copy]');
    if(!copy){copy=copyFor(record);const check=item.querySelector('.sky-saved-list-check');if(check)item.insertBefore(copy,check);else item.appendChild(copy)}
    else if(copy.dataset.signature!==sig){copy.replaceWith(copyFor(record));copy=item.querySelector('[data-saved-fingerprint-copy]')}
    if(copy)copy.dataset.signature=sig;
    item.setAttribute('aria-label',row.classList.contains('is-active')?'Current saved sky. Activate to load.':'Load saved sky identified by three fingerprints');
    item.removeAttribute('title');
    const del=row.querySelector('[data-saved-delete-ref]');if(del){del.setAttribute('aria-label','Delete this saved sky');del.title='Delete saved sky'}
    const confirmation=row.querySelector('.sky-saved-delete-confirmation');if(confirmation)confirmation.setAttribute('aria-label','Delete this saved sky?');
  });
}

let heldItem=null,heldPointer=null,holdTimer=0,holdStart=null,skipNextClick=null,clearSkipTimer=0;
function clearHold(){
  if(holdTimer)clearTimeout(holdTimer);
  holdTimer=0;heldItem=null;heldPointer=null;holdStart=null;
}
function reveal(item){
  const row=item?.closest('.sky-saved-list-row');if(!row)return;
  const popover=row.closest('#skySavedSkiesPopover');
  popover?.querySelectorAll('.sky-saved-list-row.is-identity-revealed').forEach(other=>{if(other!==row)other.classList.remove('is-identity-revealed')});
  row.classList.add('is-identity-revealed');
}
function listenPrivateReveal(){
  document.addEventListener('pointerdown',event=>{
    const item=event.target.closest?.('#skySavedSkiesPopover .sky-saved-list-item[data-private-sky-fingerprint="true"]');
    if(!item){clearHold();return}
    if(event.pointerType!=='touch'&&event.pointerType!=='pen')return;
    clearHold();heldItem=item;heldPointer=event.pointerId;holdStart={x:event.clientX,y:event.clientY};
    holdTimer=setTimeout(()=>{
      if(!heldItem?.isConnected)return;
      reveal(heldItem);
      skipNextClick=heldItem;
      clearTimeout(clearSkipTimer);
      clearSkipTimer=setTimeout(()=>{skipNextClick=null},1100);
      holdTimer=0;
    },520);
  },true);
  document.addEventListener('pointermove',event=>{
    if(!heldItem||event.pointerId!==heldPointer||!holdStart)return;
    if(Math.hypot(event.clientX-holdStart.x,event.clientY-holdStart.y)>11)clearHold();
  },true);
  document.addEventListener('pointerup',event=>{
    if(heldItem&&event.pointerId===heldPointer)clearHold();
  },true);
  document.addEventListener('pointercancel',clearHold,true);
  // Suppress only the synthetic click following the long press. A later normal
  // tap still loads the sky through the existing picker controller.
  document.addEventListener('click',event=>{
    if(!skipNextClick)return;
    const item=event.target.closest?.('#skySavedSkiesPopover .sky-saved-list-item');
    if(item!==skipNextClick)return;
    event.preventDefault();event.stopImmediatePropagation();skipNextClick=null;clearTimeout(clearSkipTimer);
  },true);
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    const popover=document.getElementById('skySavedSkiesPopover');
    if(!popover||popover.hidden)return;
    const revealed=popover.querySelector('.sky-saved-list-row.is-identity-revealed');
    if(revealed){event.stopImmediatePropagation();event.preventDefault();revealed.classList.remove('is-identity-revealed');}
  },true);
}

function schedule(){if(queued)return;queued=true;queueMicrotask(decorate)}

function start(){
  installStyle();schedule();listenPrivateReveal();
  window.addEventListener('relphi:saved-sky-library-changed',schedule);
  window.addEventListener('relphi:sky-b-removed',schedule);
  window.addEventListener('relphi:sky-b-restored',schedule);
  window.addEventListener('storage',event=>{if(!event.key||event.key===LIBRARY_KEY)schedule()});
  document.addEventListener('click',event=>{
    if(event.target.closest?.('[data-saved-sky-trigger],#skySavedSkiesPopover'))schedule();
  },true);
}
window.RelphiSkySavedSkiesLabels=Object.freeze({refresh:schedule,decorateNow:decorate});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();