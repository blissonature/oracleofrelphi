// Wheel visibility contract. Rendering decisions belong to the foundation; this module only prevents partial paint.
(function(){
'use strict';
if(window.__relphiSkyRenderStabilityV4)return;
window.__relphiSkyRenderStabilityV4=true;
window.__relphiSkyRenderStabilityV3=true;
window.__relphiSkyRenderStabilityV2=true;
window.__relphiSkyRenderStabilityV1=true;

const root=document.documentElement;
let revealTimer=0;
function hide(){clearTimeout(revealTimer);delete root.dataset.skyWheelStable}
function wheelReady(){const foundation=document.getElementById('skyFoundationRoot'),wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');return!!wheel&&foundation?.getAttribute('aria-busy')==='false'}
function reveal(){if(wheelReady())root.dataset.skyWheelStable='true'}
function show(){requestAnimationFrame(()=>requestAnimationFrame(reveal))}
function showAfterFoundation(){show();clearTimeout(revealTimer);revealTimer=window.setTimeout(reveal,180)}

hide();
window.addEventListener('relphi:sky-orb-limit-changed',hide,{capture:true});
window.addEventListener('storage',event=>{if(!event.key||event.key==='relphiSkyChartA'||event.key==='relphiSkyChartB')hide()},{capture:true});
window.addEventListener('relphi:sky-foundation-ready',showAfterFoundation);
window.addEventListener('relphi:sky-foundation-interactions-ready',show);
if(document.getElementById('skyFoundationRoot')?.getAttribute('aria-busy')==='false')show();
})();
