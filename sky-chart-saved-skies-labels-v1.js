// Saved Skies stays fingerprint-first, with readable identity and Where/When beside each fingerprint.
// New Sky behavior belongs to the core Saved Skies controller; this layer only decorates picker content.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkySavedSkiesLabelsV4)return;
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
}
`;
  document.head.appendChild(style);
}

function dateTime(record){
  const p=profile(record),zone=String(p.timeZone||record?.timeZone||'').trim(),instant=String(p.instant||record?.instant||'').trim(),raw=String(p.dateTime||record?.dateTime||'').trim();
  if(window.luxon?.DateTime){
    try{
      let dt=null;
      if(instant){dt=window.luxon.DateTime.fromISO(instant,{setZone:true});if(dt?.isValid&&zone)dt=dt.setZone(zone)}
      else if(raw){dt=window.luxon.DateTime.fromISO(raw,zone?{zone,setZone:true}:{setZone:true})}
      if(dt?.isValid)return dt.toFormat('MMM d, yyyy · h:mm a ZZZZ');
    }catch(_){}
  }
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
  const root=document.createElement('span');root.className='sky-saved-fingerprint-copy';root.dataset.savedFingerprintCopy='true';
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
  const byRef=new Map(library().map(record=>[recordRef(record),record]));
  popover.querySelectorAll('.sky-saved-list-row').forEach(row=>{
    const item=row.querySelector('[data-saved-sky-ref][data-private-sky-fingerprint="true"]');if(!item)return;
    const record=byRef.get(String(item.dataset.savedSkyRef||''));if(!record)return;
    const sig=signature(record);let copy=item.querySelector('[data-saved-fingerprint-copy]');
    if(!copy){copy=copyFor(record);const check=item.querySelector('.sky-saved-list-check');if(check)item.insertBefore(copy,check);else item.appendChild(copy)}
    else if(copy.dataset.signature!==sig){copy.replaceWith(copyFor(record));copy=item.querySelector('[data-saved-fingerprint-copy]')}
    if(copy)copy.dataset.signature=sig;
    const name=String(record.name||'Saved sky').trim()||'Saved sky',when=dateTime(record),where=place(record),parts=[name,when,where].filter(Boolean);
    item.setAttribute('aria-label',`Load ${parts.join('. ')}.`);
    const del=row.querySelector('[data-saved-delete-ref]');if(del){del.setAttribute('aria-label',`Delete ${name} from Saved Skies`);del.title=`Delete ${name}`}
    const confirmation=row.querySelector('.sky-saved-delete-confirmation');if(confirmation)confirmation.setAttribute('aria-label',`Delete ${name}?`);
  });
}
function schedule(){if(queued)return;queued=true;queueMicrotask(decorate)}

function start(){
  installStyle();schedule();
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