// Aspect scope enforcer v1: keeps matrix scope filtering authoritative across legacy refresh passes.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyAspectScopeEnforcerV1)return;
window.__relphiSkyAspectScopeEnforcerV1=true;

const HIDDEN='sky-chart-aspect-multiselect-hidden';
let observer=null,observedRoot=null,queued=false,enforcing=false;

function normalize(value){
  const key=String(value||'').trim().toLowerCase().replace(/[ _]+/g,'-');
  return({semisextile:'semi-sextile','semi-sextile':'semi-sextile',semisquare:'octile','semi-square':'octile',sesquisquare:'tri-octile','sesqui-square':'tri-octile',sesquiquadrate:'tri-octile',biquintile:'bi-quintile',inconjunct:'quincunx'})[key]||key;
}
function relationshipMode(node){
  const explicit=String(node?.dataset?.relationshipMode||'').toUpperCase();
  if(explicit==='A-A'||explicit==='B-B'||explicit==='A-B')return explicit;
  if(explicit==='B-A')return'A-B';
  const left=String(node?.dataset?.leftSky||'').toUpperCase(),right=String(node?.dataset?.rightSky||'').toUpperCase();
  if(left&&right)return left===right?`${left}-${right}`:'A-B';
  const single=String(node?.dataset?.singleSky||'').toUpperCase();
  if(single==='A'||single==='B')return`${single}-${single}`;
  return'A-B';
}
function matrixChoice(node){
  const aspect=normalize(node?.dataset?.aspect||'');
  if(!aspect)return null;
  const scope=relationshipMode(node);
  return document.querySelector(`#skyChartAspectPopover [data-aspect-matrix-scope="${scope}"][data-aspect-matrix-aspect="${aspect}"]`);
}
function shouldShow(node){
  const choice=matrixChoice(node);
  return choice?choice.checked:true;
}
function enforceNode(node){
  if(!node?.classList)return;
  const hide=!shouldShow(node);
  if(node.classList.contains(HIDDEN)!==hide)node.classList.toggle(HIDDEN,hide);
}
function updateCount(){
  requestAnimationFrame(()=>{
    const rows=[...document.querySelectorAll('.sky-foundation-relationship-row')].filter(row=>!row.classList.contains('sky-foundation-single-sky-cross-hidden'));
    const shown=rows.filter(row=>!row.hidden&&!row.classList.contains('sky-chart-filter-hidden')&&!row.classList.contains('sky-chart-orb-hidden')&&!row.classList.contains('sky-orb-filter-hidden')&&!row.classList.contains('sky-chart-multiselect-hidden')&&!row.classList.contains('sky-chart-house-multiselect-hidden')&&!row.classList.contains(HIDDEN)&&!row.classList.contains('sky-chart-sign-filter-hidden')&&!row.classList.contains('sky-chart-semantic-hidden')).length;
    const count=document.getElementById('skyFoundationRelationshipCount'),empty=document.getElementById('skyFoundationRelationshipEmpty');
    if(count)count.textContent=`${shown}/${rows.length}`;
    if(empty)empty.hidden=shown!==0;
  });
}
function enforceAll(){
  queued=false;
  if(enforcing)return;
  enforcing=true;
  document.querySelectorAll('.sky-foundation-relationship-row,[data-layer="aspects"]>.sky-foundation-aspect').forEach(enforceNode);
  enforcing=false;
  updateCount();
}
function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(enforceAll);
}
function relevantNode(node){
  return node instanceof Element&&(node.matches?.('.sky-foundation-relationship-row,[data-layer="aspects"]>.sky-foundation-aspect')||node.querySelector?.('.sky-foundation-relationship-row,[data-layer="aspects"]>.sky-foundation-aspect'));
}
function bindObserver(){
  const root=document.getElementById('skyFoundationRoot');
  if(!root||root===observedRoot)return;
  observer?.disconnect();observedRoot=root;
  observer=new MutationObserver(records=>{
    if(enforcing)return;
    const relevant=records.some(record=>record.type==='attributes'?relevantNode(record.target):[...record.addedNodes,...record.removedNodes].some(relevantNode));
    if(relevant)schedule();
  });
  observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
}
function start(){
  bindObserver();schedule();
  document.addEventListener('change',event=>{
    if(event.target.closest?.('[data-aspect-matrix-scope][data-aspect-matrix-aspect]'))enforceAll();
  });
  window.addEventListener('relphi:sky-aspect-multiselect-changed',enforceAll);
  ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-intrasky-relationships-ready','relphi:sky-intrasky-b-relationships-ready','relphi:sky-single-sky-aspects-rendered'].forEach(name=>window.addEventListener(name,()=>{bindObserver();schedule()}));
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
