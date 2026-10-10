// Relationship sorting consumes the single transit timing owner.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiRelationshipTimingFixV1)return;
window.__relphiRelationshipTimingFixV1=true;
const TIMING_MODES=new Set(['duration-longest','duration-shortest','began-most-recently','ends-soonest','ends-last']);
let sortQueued=false;
function applySort(){const list=document.getElementById('skyFoundationRelationshipList'),compare=window.RelphiRelationshipSort?.compareRows;if(!list||typeof compare!=='function')return;const rows=[...list.querySelectorAll(':scope>.sky-foundation-relationship-row')];rows.sort((a,b)=>compare(a,b));rows.forEach(row=>list.appendChild(row))}
function scheduleSortRefresh(){const sort=window.RelphiRelationshipSort,mode=sort?.mode?.(),select=document.querySelector('select[data-relationship-sort]');if(!TIMING_MODES.has(mode)||select?.getAttribute('aria-busy')==='true'||sortQueued)return;sortQueued=true;requestAnimationFrame(()=>{sortQueued=false;applySort()})}
function start(){window.addEventListener('relphi:relationship-sort-changed',scheduleSortRefresh);['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-intrasky-relationships-ready','relphi:sky-intrasky-b-relationships-ready','relphi:sky-harmonic-window-visibility-changed','relphi:sky-live-origin-changed','relphi:relationship-display-changed'].forEach(name=>window.addEventListener(name,scheduleSortRefresh));}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
