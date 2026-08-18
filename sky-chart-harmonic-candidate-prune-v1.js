// Keep the foundation aspect web inside the canonical maximum harmonic phase window.
// The foundation builds one stable ordinary-orb candidate set; prune it synchronously when
// the wheel already exists so an overbroad aspect web never gets a visible first paint.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiHarmonicCandidatePruneV1)return;
window.__relphiHarmonicCandidatePruneV1=true;

function prune(){
  const model=window.RelphiHarmonicOrb,wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
  if(!model||!wheel)return false;
  const max=Number(model.maxWindow)||12,layer=wheel.querySelector('[data-layer="aspects"]');
  if(!layer)return false;
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
  return true;
}
window.RelphiHarmonicCandidatePrune=Object.freeze({prune});
window.addEventListener('relphi:sky-foundation-ready',prune);
// Foundation is evaluated immediately before this script. Its wheel is inserted synchronously
// before glyph promises settle, so prune now rather than waiting for requestAnimationFrame.
prune();
})();