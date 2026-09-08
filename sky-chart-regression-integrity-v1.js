// Restore Sky B in-place New Sky, a single Here-and-Now action, and Card Hits fingerprints.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyRegressionIntegrityV1)return;
window.__relphiSkyRegressionIntegrityV1=true;

const SKY_B_KEY='relphiSkyChartB';
const SLOT_KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
let queued=false;

function blankPayload(){
  return{
    name:'Where and When',title:'Where and When',displayName:'Where and When',skyName:'Where and When',saved:false,
    placements:{},metadata:{name:'Where and When',title:'Where and When'},calcProfile:{name:'Where and When',title:'Where and When'}
  };
}
function dispatchStorage(slot){
  const key=SLOT_KEYS[slot];
  try{window.dispatchEvent(new StorageEvent('storage',{key,newValue:localStorage.getItem(key),storageArea:localStorage}));return}catch(_){}
  const event=new Event('storage');
  try{Object.defineProperty(event,'key',{value:key})}catch(_){}
  window.dispatchEvent(event);
}
function activePickerSlot(){
  return document.querySelector('[data-saved-sky-trigger][aria-expanded="true"]')?.dataset.savedSkyTrigger||'';
}
function closeSavedPicker(slot){
  const popover=document.getElementById('skySavedSkiesPopover');
  if(popover){popover.hidden=true;popover.removeAttribute('style')}
  document.querySelector(`[data-saved-sky-trigger="${slot}"]`)?.setAttribute('aria-expanded','false');
}
function resetSkyBInPlace(){
  const transaction=window.RelphiSkyWhereWhenTransaction;
  try{transaction?.cancel?.('B')}catch(_){}
  try{window.RelphiSkyCardShell?.setEditorExpanded?.('B',false)}catch(_){}
  document.querySelectorAll('.sky-where-when-editor[data-slot="B"]').forEach(form=>form.remove());

  const blank=blankPayload();
  try{localStorage.setItem(SKY_B_KEY,JSON.stringify(blank))}catch(_){return false}

  const root=document.documentElement,startup=window.RelphiSkyStartupMode;
  try{startup?.writeMode?.('comparison')}catch(_){}
  try{localStorage.setItem('relphiSkyChartLastModeV1','comparison')}catch(_){}
  root.dataset.skyLastMode='comparison';
  root.dataset.skyBPresent='true';
  delete root.dataset.skyBEditing;
  try{startup?.syncRoot?.()}catch(_){}

  const panel=document.getElementById('skyFoundationB');
  if(panel){panel.hidden=false;panel.removeAttribute('hidden')}
  dispatchStorage('B');
  window.dispatchEvent(new CustomEvent('relphi:saved-sky-active-changed',{detail:{slot:'B'}}));
  window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot:'B',name:'Where and When',source:'new-sky-in-place'}}));
  closeSavedPicker('B');

  requestAnimationFrame(()=>{
    window.RelphiSkyCardShell?.ensure?.('B',blank);
    window.RelphiSkyCardShell?.openDrawer?.('B','where');
    requestAnimationFrame(()=>{
      if(document.querySelector('#skyFoundationB .sky-where-when-editor[data-slot="B"]'))return;
      window.dispatchEvent(new CustomEvent('relphi:sky-drawer-opened',{detail:{slot:'B',drawer:'where'}}));
    });
  });
  return true;
}

// Window capture beats the legacy document-capture New Sky handler, which removes Sky B.
window.addEventListener('click',event=>{
  const command=event.target.closest?.('#skySavedSkiesPopover [data-sky-command="new"]');
  if(!command||activePickerSlot()!=='B')return;
  event.preventDefault();
  event.stopImmediatePropagation();
  resetSkyBInPlace();
},true);

function ensureHereNow(editor){
  if(!editor||editor.dataset.relphiHereNowIntegrity==='true')return;
  const slot=String(editor.dataset.slot||'');
  if(!SLOT_KEYS[slot])return;
  editor.dataset.relphiHereNowIntegrity='true';

  // Remove the three competing current-time/current-location shortcuts.
  const currentLocation=editor.querySelector('[data-ww-action="use-current-location"]');
  const currentLocationRow=currentLocation?.closest('.sky-where-current-location-actions');
  if(currentLocationRow)currentLocationRow.remove();else currentLocation?.remove();
  editor.querySelector('.sky-where-when-now-row')?.remove();
  editor.querySelector('.sky-update-now-editor[data-final-now]')?.remove();

  let row=editor.querySelector(':scope > .sky-where-when-here-now-row');
  if(!row){
    row=document.createElement('div');
    row.className='sky-where-when-here-now-row sky-where-when-inline-actions';
    const button=document.createElement('button');
    button.type='button';
    button.className='sky-where-when-button primary sky-use-here-now-button';
    button.dataset.finalNow=slot;
    button.textContent='Use Here and Now';
    row.appendChild(button);
    editor.prepend(row);
  }
}
function decorateEditors(scope=document){
  if(scope?.matches?.('.sky-where-when-editor'))ensureHereNow(scope);
  scope?.querySelectorAll?.('.sky-where-when-editor').forEach(ensureHereNow);
}

function restoreCardHitsFingerprint(slot){
  const payload=(()=>{try{return JSON.parse(localStorage.getItem(SLOT_KEYS[slot])||'null')}catch(_){return null}})();
  const mount=window.RelphiSkyCardShell?.get?.(slot)?.cardHitsFingerprint;
  const structure=window.RelphiSkyCardHitsStructure;
  if(!mount||!payload||!structure?.fingerprint)return;
  const fingerprint=structure.fingerprint(payload);
  if(!fingerprint){mount.replaceChildren();mount.hidden=true;mount.removeAttribute('aria-label');return}
  const ruler=fingerprint.dataset.chartRulerFingerprint||'';
  if(mount.firstElementChild?.dataset?.chartRulerFingerprint!==ruler){mount.replaceChildren(fingerprint)}
  mount.hidden=false;
  const label=fingerprint.getAttribute('aria-label');
  if(label)mount.setAttribute('aria-label',label);
}
function repairCardHits(){
  ['A','B'].forEach(restoreCardHitsFingerprint);
  // Let the Card Hits owner hydrate its canonical sign glyphs and any open drawer content.
  window.RelphiSkyCardHitsStructure?.render?.();
}
function repair(){
  queued=false;
  decorateEditors();
  repairCardHits();
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(repair)}

function start(){
  decorateEditors();
  schedule();
  const root=document.getElementById('skyFoundationRoot')||document.body;
  new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes||[]){if(node.nodeType===1)decorateEditors(node)}
    }
    schedule();
  }).observe(root,{childList:true,subtree:true});

  [
    'relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-drawer-opened',
    'relphi:saved-sky-active-changed','relphi:saved-sky-loaded','relphi:sky-b-restored','relphi:sky-session-recovered',
    'relphi:sky-where-when-committed','relphi:sky-live-origin-changed'
  ].forEach(name=>window.addEventListener(name,schedule));
  window.addEventListener('storage',event=>{if(!event.key||Object.values(SLOT_KEYS).includes(event.key))schedule()});
  setTimeout(schedule,0);
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
