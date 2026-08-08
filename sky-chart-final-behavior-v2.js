// Final interaction behavior: relationship selection does not replace exploration isolation. Event-driven only.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyFinalBehaviorV3)return;
window.__relphiSkyFinalBehaviorV2=true;window.__relphiSkyFinalBehaviorV3=true;
let queued=false,selectedIndex=null;
function preserveRowSelection(event){const row=event.target.closest?.('.sky-foundation-relationship-row[data-relation-index]');if(!row)return;const prior=row.getAttribute('data-interactive');row.removeAttribute('data-interactive');queueMicrotask(()=>{if(prior!=null)row.setAttribute('data-interactive',prior);else row.setAttribute('data-interactive','aspect')})}
function restoreSelectedMarker(){if(!Number.isInteger(selectedIndex))return;document.querySelectorAll('.sky-foundation-relationship-row[data-relation-index]').forEach(row=>row.setAttribute('aria-current',Number(row.dataset.relationIndex)===selectedIndex?'true':'false'));document.querySelectorAll('.sky-foundation-aspect[data-relation-index]').forEach(line=>line.dataset.selectedRelation=Number(line.dataset.relationIndex)===selectedIndex?'true':'false')}
function removeAspectBoxes(){document.querySelectorAll('.sky-foundation-aspect-hit,[data-layer="aspects"] rect').forEach(node=>{node.setAttribute('fill','transparent');node.setAttribute('stroke','transparent');node.setAttribute('pointer-events','stroke');node.removeAttribute('tabindex');node.style.outline='none'})}
function run(){queued=false;removeAspectBoxes();restoreSelectedMarker()}function schedule(){if(queued)return;queued=true;requestAnimationFrame(run)}
function start(){const root=document.getElementById('skyFoundationRoot');root?.addEventListener('click',preserveRowSelection,true);root?.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key))preserveRowSelection(event)},true);window.addEventListener('relphi:selected-relationship-rendered',event=>{const index=Number(event.detail?.index);if(Number.isInteger(index))selectedIndex=index;schedule()});['relphi:sky-foundation-ready','relphi:sky-foundation-filter-changed'].forEach(name=>window.addEventListener(name,schedule));schedule()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();