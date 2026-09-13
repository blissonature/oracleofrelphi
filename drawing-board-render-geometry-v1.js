// Drawing Board rendered-geometry loader. Mobile geometry is owned by drawing-board-mobile-celtic-v2.js.
(function(){
  'use strict';
  if(!/(^|\/)tarot\.html$/.test(location.pathname))return;
  if(window.matchMedia&&window.matchMedia('(max-width:700px)').matches)return;
  // Reserve the retired owner immediately; nested script loading must not create an ownership race.
  window.__relphiDrawingBoardRenderGeometryV1=true;
  var script=document.createElement('script');
  script.src='drawing-board-render-geometry-desktop-v2.js?v=2';
  document.head.appendChild(script);
})();
