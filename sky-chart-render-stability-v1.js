(function(){
'use strict';
if(window.__relphiSkyRenderStabilityV1)return;window.__relphiSkyRenderStabilityV1=true;
const root=document.documentElement;
function hide(){delete root.dataset.skyWheelStable}
function show(){requestAnimationFrame(()=>requestAnimationFrame(()=>{root.dataset.skyWheelStable='true'}))}
hide();
window.addEventListener('relphi:sky-orb-limit-changed',hide,{capture:true});
window.addEventListener('storage',hide,{capture:true});
window.addEventListener('relphi:sky-foundation-ready',hide);
window.addEventListener('relphi:sky-foundation-interactions-ready',show);
if(document.getElementById('skyFoundationRoot')?.getAttribute('aria-busy')==='false')show();
})();