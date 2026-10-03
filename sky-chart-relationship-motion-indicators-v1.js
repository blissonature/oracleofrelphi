// Visible motion state for relationship rows: aspect phase and raw angular distance.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiRelationshipMotionIndicatorsV1)return;
window.__relphiRelationshipMotionIndicatorsV1=true;
let queued=false;
function indicator(kind,text,title){
  const span=document.createElement('span');
  span.className='sky-relationship-motion-indicator sky-relationship-motion-indicator--'+kind;
  span.textContent=text;span.title=title;span.setAttribute('aria-label',title);return span;
}
function annotate(){
  queued=false;
  const api=window.RelphiRelationshipTransitMeta;
  if(!api?.motionSnapshotForRow)return;
  document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]').forEach(row=>{
    row.querySelector(':scope>.sky-relationship-motion')?.remove();
    const motion=api.motionSnapshotForRow(row);if(!motion)return;
    row.dataset.relationshipPhase=motion.phase;row.dataset.relationshipDistance=motion.distance;
    row.dataset.relationshipApplyingRate=String(motion.applyingRate);row.dataset.relationshipSeparationRate=String(motion.separationRate);
    if(!row.classList.contains('is-inline-expanded'))return;
    const transit=row.querySelector(':scope>.inline-rel-detail .inline-rel-progressive-strip [data-inline-progressive-token="aspect"]>.inline-rel-transit-window');
    if(!transit)return;
    const host=document.createElement('span');host.className='sky-relationship-motion';
    const phaseLabel=motion.phase==='applying'?'Applying':motion.phase==='separating'?'Separating':motion.phase==='exact'?'Exact':'Steady';
    const distanceLabel=motion.distance==='closing'?'Closing':motion.distance==='opening'?'Opening':'Steady';
    host.append(
      indicator('phase',phaseLabel,phaseLabel+' relative to exact aspect'),
      indicator('distance',distanceLabel,distanceLabel+' in angular separation')
    );
    transit.prepend(host);
  });
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(annotate))}
function installStyles(){
  if(document.getElementById('skyRelationshipMotionIndicatorsV1Styles'))return;
  const style=document.createElement('style');style.id='skyRelationshipMotionIndicatorsV1Styles';
  style.textContent=`
#skyFoundationRelationshipList .inline-rel-transit-window>.sky-relationship-motion{display:flex;align-items:center;gap:4px;margin:0 0 3px;padding:0;white-space:nowrap}
#skyFoundationRelationshipList .sky-relationship-motion-indicator{display:inline-flex;align-items:center;min-height:18px;padding:1px 6px;border:1px solid rgba(31,27,24,.16);border-radius:999px;background:rgba(255,255,255,.72);color:#514942;font:750 .58rem/1 system-ui,sans-serif;letter-spacing:.01em}
@media(max-width:620px){#skyFoundationRelationshipList .inline-rel-transit-window>.sky-relationship-motion{margin:0 0 3px;padding:0}}
`;document.head.appendChild(style);
}
function start(){installStyles();schedule();[
'relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-intrasky-relationships-ready','relphi:sky-intrasky-b-relationships-ready','relphi:sky-harmonic-window-visibility-changed','relphi:sky-live-origin-changed','relphi:relationship-display-changed'
].forEach(name=>window.addEventListener(name,schedule))}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();