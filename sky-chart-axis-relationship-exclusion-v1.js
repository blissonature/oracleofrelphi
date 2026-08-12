// Chart axes are structural wheel geometry, not ordinary relationship participants.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyAxisRelationshipExclusionV1)return;
window.__relphiSkyAxisRelationshipExclusionV1=true;
const AXES=new Set(['asc','dsc','mc','ic']);
let queued=false;
const isAxis=value=>AXES.has(String(value||'').trim().toLowerCase());
function updateCount(){
  const rows=[...document.querySelectorAll('.sky-foundation-relationship-row')];
  const visible=rows.filter(row=>!row.hidden&&!row.classList.contains('sky-chart-filter-hidden')&&!row.classList.contains('sky-chart-multiselect-hidden')&&!row.classList.contains('sky-chart-sign-filter-hidden')).length;
  const count=document.getElementById('skyFoundationRelationshipCount');
  const empty=document.getElementById('skyFoundationRelationshipEmpty');
  if(count){count.textContent=`${visible}/${rows.length}`;count.dataset.total=String(rows.length)}
  if(empty)empty.hidden=visible!==0;
}
function prune(){
  queued=false;
  document.querySelectorAll('.sky-foundation-relationship-row').forEach(row=>{
    if(isAxis(row.dataset.leftPlacement)||isAxis(row.dataset.rightPlacement))row.remove();
  });
  document.querySelectorAll('[data-layer="aspects"] [data-left-placement],[data-layer="aspects"] [data-right-placement]').forEach(line=>{
    if(isAxis(line.dataset.leftPlacement)||isAxis(line.dataset.rightPlacement))line.remove();
  });
  updateCount();
  document.documentElement.dataset.skyAxisRelationships='excluded';
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(prune))}
[
  'relphi:sky-foundation-ready',
  'relphi:sky-foundation-interactions-ready',
  'relphi:sky-single-sky-aspects-rendered',
  'relphi:sky-orb-limit-changed',
  'relphi:sky-placement-multiselect-changed',
  'relphi:sky-house-multiselect-changed',
  'relphi:sky-aspect-multiselect-changed',
  'relphi:sky-zodiac-filter-changed'
].forEach(name=>window.addEventListener(name,schedule));
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule,{once:true}):schedule();
})();
