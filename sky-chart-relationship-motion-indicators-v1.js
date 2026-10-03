// Visible motion state for relationship rows: aspect phase and raw angular distance.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiRelationshipMotionIndicatorsV1)return;
window.__relphiRelationshipMotionIndicatorsV1=true;
let queued=false;
function annotate(){
  queued=false;
  const api=window.RelphiRelationshipTransitMeta;
  if(!api?.motionSnapshotForRow)return;
  document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]').forEach(row=>{
    const motion=api.motionSnapshotForRow(row);if(!motion)return;
    row.dataset.relationshipPhase=motion.phase;row.dataset.relationshipDistance=motion.distance;
    row.dataset.relationshipApplyingRate=String(motion.applyingRate);row.dataset.relationshipSeparationRate=String(motion.separationRate);
  });
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(annotate))}
function start(){schedule();[
'relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-intrasky-relationships-ready','relphi:sky-intrasky-b-relationships-ready','relphi:sky-harmonic-window-visibility-changed','relphi:sky-live-origin-changed','relphi:relationship-display-changed'
].forEach(name=>window.addEventListener(name,schedule))}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();