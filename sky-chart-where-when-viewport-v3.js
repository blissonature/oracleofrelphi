// Where and When viewport sizing only. Structure and presentation semantics belong to the controller.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyWhereWhenViewportV3)return;
window.__relphiSkyWhereWhenViewportV3=true;
window.__relphiSkyWhereWhenViewportV2=true;

let queued=false;
function installStyle(){
  if(document.getElementById('skyWhereWhenViewportV3Style'))return;
  const style=document.createElement('style');style.id='skyWhereWhenViewportV3Style';
  style.textContent=`
    .sky-where-when-scroll-body{scrollbar-gutter:stable}
    .sky-where-when-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
    .sky-where-search-row{align-items:end}
    @media(max-width:620px){.sky-where-when-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.sky-where-when-scroll-body{scrollbar-gutter:auto}}
  `;document.head.appendChild(style);
}
function sizeEditor(form){
  const body=form?.querySelector('.sky-where-when-scroll-body'),footer=form?.querySelector('.sky-where-when-footer');if(!body||!footer)return;
  const viewport=window.visualViewport?.height||window.innerHeight||800,rect=form.getBoundingClientRect(),available=Math.max(220,viewport-Math.max(0,rect.top)-footer.getBoundingClientRect().height-18);
  body.style.maxHeight=`${Math.floor(available)}px`;
}
function sizeAll(){queued=false;document.querySelectorAll('.sky-where-when-editor').forEach(sizeEditor)}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(sizeAll)}
function start(){installStyle();sizeAll();window.addEventListener('relphi:sky-where-when-editor-ready',schedule);window.addEventListener('resize',schedule,{passive:true});window.visualViewport?.addEventListener('resize',schedule,{passive:true})}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
