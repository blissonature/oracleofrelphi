// Default saved-sky reference shared by Sky Chart and Planetary Hours.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiDefaultSkyV1)return;
window.__relphiDefaultSkyV1=true;

const LIBRARY_KEY='relphiSkyLibraryV1';
const SLOT_KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const DEFAULT_KEY='relphiDefaultSkyIdV1';

function readJson(key,fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch(_){return fallback}}
function recordRef(record){return String(record?.id||record?.savedSkyId||record?.metadata?.savedSkyId||'')}
function library(){const api=window.RelphiSkySavedSkyIdentity?.library?.();const list=Array.isArray(api)?api:readJson(LIBRARY_KEY,[]);return Array.isArray(list)?list:[]}
function payload(slot){return readJson(SLOT_KEYS[slot],null)}
function defaultId(){try{return String(localStorage.getItem(DEFAULT_KEY)||'')}catch(_){return''}}
function currentRecord(slot){
  const value=payload(slot),records=library();
  if(!value||!records.length)return null;
  const explicit=String(value?.metadata?.savedSkyId||'');
  if(explicit){const hit=records.find(record=>recordRef(record)===explicit);if(hit)return hit}
  try{return window.RelphiSkySavedSkyIdentity?.matchingRecord?.(value,records)||null}catch(_){return null}
}
function validDefault(){
  const id=defaultId();
  if(!id)return null;
  const hit=library().find(record=>recordRef(record)===id)||null;
  if(!hit){try{localStorage.removeItem(DEFAULT_KEY)}catch(_){}}
  return hit;
}
function dispatch(record){
  const id=record?recordRef(record):'';
  window.dispatchEvent(new CustomEvent('relphi:default-sky-changed',{detail:{id,name:String(record?.name||'')}}));
  try{window.dispatchEvent(new StorageEvent('storage',{key:DEFAULT_KEY,newValue:id||null,storageArea:localStorage}))}catch(_){}
}
function setDefault(record){
  const id=recordRef(record);
  if(!id)return false;
  try{localStorage.setItem(DEFAULT_KEY,id)}catch(_){return false}
  dispatch(record);
  refreshAll();
  return true;
}
function clearDefault(record){
  const id=recordRef(record);
  if(!id||defaultId()!==id)return false;
  try{localStorage.removeItem(DEFAULT_KEY)}catch(_){return false}
  dispatch(null);
  refreshAll();
  return true;
}
function ensureStyles(){
  if(document.getElementById('skyDefaultSkyV1Styles'))return;
  const style=document.createElement('style');
  style.id='skyDefaultSkyV1Styles';
  style.textContent=`
    .sky-where-when-default-row{display:grid;grid-template-columns:auto minmax(0,1fr);gap:.55rem;align-items:start;margin:.5rem .62rem 0;padding:.62rem .7rem;border:1px solid rgba(31,27,24,.13);border-radius:.8rem;background:#fffaf6;color:#2b2622}
    .sky-where-when-default-row input{width:1.05rem;height:1.05rem;margin:.08rem 0 0;accent-color:#c9211e}
    .sky-where-when-default-copy{display:grid;gap:.14rem;min-width:0}
    .sky-where-when-default-copy strong{font:850 .72rem/1.2 system-ui,sans-serif}
    .sky-where-when-default-copy span{color:#645b53;font:650 .62rem/1.3 system-ui,sans-serif}
    .sky-where-when-default-row.is-unavailable{opacity:.62}
  `;
  document.head.appendChild(style);
}
function inject(form,slot){
  if(!form||form.querySelector('[data-ww-default-sky]'))return;
  ensureStyles();
  const row=document.createElement('label');
  row.className='sky-where-when-default-row';
  row.innerHTML='<input type="checkbox" data-ww-default-sky><span class="sky-where-when-default-copy"><strong>Default</strong><span data-ww-default-copy></span></span>';
  const scroll=form.querySelector('.sky-where-when-scroll-body');
  const advanced=form.querySelector('.sky-where-when-advanced');
  if(advanced&&scroll)scroll.insertBefore(row,advanced);
  else (scroll||form).appendChild(row);
  const input=row.querySelector('[data-ww-default-sky]');
  input.addEventListener('change',()=>{
    const record=currentRecord(slot);
    if(!record){input.checked=false;return}
    if(input.checked)setDefault(record);else clearDefault(record);
  });
  refreshForm(form,slot);
}
function refreshForm(form,slot){
  if(!form)return;
  const row=form.querySelector('.sky-where-when-default-row');
  const input=form.querySelector('[data-ww-default-sky]');
  const copy=form.querySelector('[data-ww-default-copy]');
  if(!row||!input||!copy)return;
  const record=currentRecord(slot),id=recordRef(record),isDefault=!!id&&defaultId()===id;
  input.disabled=!record;
  input.checked=isDefault;
  row.classList.toggle('is-unavailable',!record);
  copy.textContent=record
    ? (isDefault?'This saved sky is the default reference for Planetary Hours.':'Use this saved sky as the default reference for Planetary Hours.')
    : 'Save this sky first, then you can make it the default reference.';
}
function refreshAll(){
  validDefault();
  document.querySelectorAll('.sky-where-when-editor[data-slot]').forEach(form=>refreshForm(form,form.dataset.slot));
}
function onEditorReady(event){
  const slot=event?.detail?.slot;
  const form=event?.detail?.form||document.querySelector(`.sky-where-when-editor[data-slot="${slot}"]`);
  if(slot&&form)inject(form,slot);
}
function start(){
  ensureStyles();
  validDefault();
  window.addEventListener('relphi:sky-where-when-editor-ready',onEditorReady);
  window.addEventListener('relphi:saved-sky-library-changed',refreshAll);
  window.addEventListener('relphi:saved-sky-active-changed',refreshAll);
  window.addEventListener('relphi:sky-where-when-committed',refreshAll);
  window.addEventListener('storage',event=>{if(!event.key||event.key===LIBRARY_KEY||event.key===DEFAULT_KEY||Object.values(SLOT_KEYS).includes(event.key))refreshAll()});
  document.querySelectorAll('.sky-where-when-editor[data-slot]').forEach(form=>inject(form,form.dataset.slot));
}
window.RelphiDefaultSky=Object.freeze({key:DEFAULT_KEY,get:validDefault,set:setDefault,clear:clearDefault,id:defaultId});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();