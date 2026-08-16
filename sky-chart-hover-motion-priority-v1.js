// Keep wheel hover presentation immediate. The fast hover path already coalesces
// secondary work to animation frames, so do not add a pointer-settle delay here.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyHoverMotionPriorityV1)return;
  window.__relphiSkyHoverMotionPriorityV1=true;

  function installImmediatePaintStyle(){
    if(document.getElementById('skyHoverMotionPriorityStyle'))return;
    const style=document.createElement('style');
    style.id='skyHoverMotionPriorityStyle';
    style.textContent=`
      #skyFoundationWheelMount .sky-foundation-interactive,
      #skyFoundationWheelMount .sky-foundation-focus-piece,
      #skyFoundationWheelMount .sky-foundation-sign-glyph {
        transition:none!important;
        will-change:auto!important;
      }
    `;
    document.head.appendChild(style);
  }

  function start(){
    installImmediatePaintStyle();
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
