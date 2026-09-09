(function(){
'use strict';
if(window.__relphiSkyRenderStabilityV2)return;
window.__relphiSkyRenderStabilityV2=true;
window.__relphiSkyRenderStabilityV1=true;
const root=document.documentElement;
let revealTimer=0;
function hide(){
  clearTimeout(revealTimer);
  delete root.dataset.skyWheelStable;
}
function wheelReady(){
  const foundation=document.getElementById('skyFoundationRoot');
  const wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
  return !!wheel&&foundation?.getAttribute('aria-busy')==='false';
}
function reveal(){
  if(wheelReady())root.dataset.skyWheelStable='true';
}
function show(){
  requestAnimationFrame(()=>requestAnimationFrame(reveal));
}
function showAfterFoundation(){
  // The foundation is already the completed replacement wheel. Do not strand it hidden
  // if the interaction pass elects not to run (for example while a Where/When editor remains open).
  show();
  clearTimeout(revealTimer);
  revealTimer=window.setTimeout(reveal,180);
}
hide();
window.addEventListener('relphi:sky-orb-limit-changed',hide,{capture:true});
window.addEventListener('storage',hide,{capture:true});
window.addEventListener('relphi:sky-foundation-ready',showAfterFoundation);
window.addEventListener('relphi:sky-foundation-interactions-ready',show);
if(document.getElementById('skyFoundationRoot')?.getAttribute('aria-busy')==='false')show();
})();
