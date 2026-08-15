// Keep the foundation aspect web inside the canonical maximum harmonic phase window.
// The legacy foundation renderer uses one ordinary-orb ceiling for every aspect; this
// removes candidates that exceed maxWindow once the aspect's harmonic order is applied.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiHarmonicCandidatePruneV1)return;
window.__relphiHarmonicCandidatePruneV1=true;

function prune(){
  const model=window.RelphiHarmonicOrb,wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
  if(!model||!wheel)return;
  const max=Number(model.maxWindow)||12,layer=wheel.querySelector('[data-layer="aspects"]');
  if(!layer)return;
  const lines=[...layer.querySelectorAll(':scope > line[data-aspect][data-orb]')];
  let removed=0;
  for(const line of lines){
    const aspect=model.byId?.(line.dataset.aspect),orb=Math.abs(Number(line.dataset.orb));
    if(!aspect||!Number.isFinite(orb))continue;
    const phase=orb*Number(aspect.harmonic||1);
    line.dataset.phaseError=phase.toFixed(6);
    line.dataset.harmonicOrder=String(aspect.harmonic||1);
    if(phase>max+1e-9){line.remove();removed+=1}
  }
  layer.dataset.harmonicCandidateCeiling=String(max);
  layer.dataset.harmonicCandidatesRemoved=String(removed);
  layer.dataset.harmonicCandidatesKept=String(lines.length-removed);
  wheel.dataset.harmonicCandidatePrune='ready';
}
window.RelphiHarmonicCandidatePrune=Object.freeze({prune});
window.addEventListener('relphi:sky-foundation-ready',prune);
if(document.readyState!=='loading')requestAnimationFrame(prune);
})();