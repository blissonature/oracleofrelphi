// Preserve the PR #114 Here and Now shortcut without removing the distinct current-time-at-selected-location workflow.
// New Sky in Sky B and Card Hits fingerprint repair now live in their current owning modules.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyRegressionIntegrityV4)return;
window.__relphiSkyRegressionIntegrityV4=true;
window.__relphiSkyRegressionIntegrityV3=true;
window.__relphiSkyRegressionIntegrityV2=true;
window.__relphiSkyRegressionIntegrityV1=true;

const SLOT_KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const root=document.documentElement;
let queued=false;
let editSignature='';
let preserveTimer=0;

function installWheelContinuityStyle(){
  if(document.getElementById('skyWhereDrawerWheelContinuityV1'))return;
  const style=document.createElement('style');
  style.id='skyWhereDrawerWheelContinuityV1';
  style.textContent='html[data-sky-preserve-wheel="true"] #skyFoundationWheelMount{visibility:visible!important}';
  document.head.appendChild(style);
}
function storageSignature(){
  try{return JSON.stringify(Object.values(SLOT_KEYS).map(key=>localStorage.getItem(key)||''))}catch(_){return''}
}
function releaseWheelContinuity(){
  if(root.dataset.skyPreserveWheel!=='true')return;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{delete root.dataset.skyPreserveWheel}));
}
function preserveWheelForUnchangedClose(event){
  const active=event.detail?.active===true;
  if(active){
    editSignature=storageSignature();
    delete root.dataset.skyPreserveWheel;
    clearTimeout(preserveTimer);
    return;
  }
  if(!editSignature)return;
  const unchanged=storageSignature()===editSignature;
  editSignature='';
  if(!unchanged)return;
  root.dataset.skyPreserveWheel='true';
  clearTimeout(preserveTimer);
  preserveTimer=window.setTimeout(()=>{delete root.dataset.skyPreserveWheel},2500);
}

function ensureCurrentLocalTime(editor){
  const when=editor?.querySelector('[data-ww-when]');
  if(!when)return;
  let row=when.querySelector('.sky-where-when-now-row');
  let button=row?.querySelector('[data-ww-action="use-now"]');
  if(!row){
    row=document.createElement('div');
    row.className='sky-where-when-now-row';
    const grid=when.querySelector('.sky-where-when-grid');
    if(grid)grid.before(row);else when.appendChild(row);
  }
  if(!button){
    button=document.createElement('button');
    button.type='button';
    button.className='sky-where-when-button secondary sky-use-now-button';
    button.dataset.wwAction='use-now';
    row.prepend(button);
  }
  button.textContent='Current local time';
  button.setAttribute('aria-label','Use current local time at this location');
  button.title='Use current local time at this location';
  let help=Array.from(row.children).find(node=>node!==button&&node.tagName==='SPAN');
  if(!help){help=document.createElement('span');row.appendChild(help)}
  help.textContent='Use the current instant at this location.';
}

function ensureHereNow(editor){
  if(!editor)return;
  const slot=String(editor.dataset.slot||'');
  if(!SLOT_KEYS[slot])return;

  // Here and Now means this device's current location + current instant.
  // Current local time is intentionally separate: it keeps the selected customer location
  // and converts the current instant into that location's time zone.
  const currentLocation=editor.querySelector('[data-ww-action="use-current-location"]');
  const currentLocationRow=currentLocation?.closest('.sky-where-current-location-actions');
  if(currentLocationRow)currentLocationRow.remove();else currentLocation?.remove();
  ensureCurrentLocalTime(editor);

  let row=editor.querySelector('.sky-where-when-here-now-row');
  let button=row?.querySelector('[data-final-now]');
  if(!row){
    row=document.createElement('div');
    row.className='sky-where-when-here-now-row sky-where-when-inline-actions';
  }
  if(!button){
    button=document.createElement('button');
    button.type='button';
    button.className='sky-where-when-button primary sky-use-here-now-button';
    button.dataset.finalNow=slot;
    row.appendChild(button);
  }
  button.textContent='Here and Now';
  button.setAttribute('aria-label','Here and Now');
  button.title='Here and Now';

  // Remove every other final-now control, including the legacy footer Update to Now button.
  // Do not remove data-ww-action="use-now": it is the selected-location current-time action.
  editor.querySelectorAll('[data-final-now]').forEach(node=>{if(node!==button)node.remove()});

  const body=editor.querySelector(':scope > .sky-where-when-scroll-body');
  const target=body||editor;
  if(row.parentElement!==target||target.firstElementChild!==row)target.prepend(row);
}
function decorate(scope=document){
  if(scope?.matches?.('.sky-where-when-editor'))ensureHereNow(scope);
  scope?.querySelectorAll?.('.sky-where-when-editor').forEach(ensureHereNow);
}
function repair(){queued=false;decorate()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(repair)}
function start(){
  installWheelContinuityStyle();
  decorate();
  const foundation=document.getElementById('skyFoundationRoot')||document.body;
  new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes||[]){if(node.nodeType===1)decorate(node)}
    }
    schedule();
  }).observe(foundation,{childList:true,subtree:true});
  window.addEventListener('relphi:sky-where-when-edit-state-changed',preserveWheelForUnchangedClose);
  window.addEventListener('relphi:sky-foundation-interactions-ready',releaseWheelContinuity);
  ['relphi:sky-foundation-ready','relphi:sky-drawer-opened','relphi:sky-where-when-edit-state-changed','relphi:sky-where-when-committed']
    .forEach(name=>window.addEventListener(name,schedule));
  setTimeout(schedule,0);
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
