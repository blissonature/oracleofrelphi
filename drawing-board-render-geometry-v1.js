// Drawing Board rendered-geometry loader. Mobile geometry is owned by drawing-board-mobile-celtic-v2.js.
(function(){
  'use strict';
  if(!/(^|\/)tarot\.html$/.test(location.pathname))return;
  if(window.matchMedia&&window.matchMedia('(max-width:700px)').matches)return;
  // Reserve every retired geometry owner immediately; child loading cannot create a race.
  window.__relphiDrawingBoardRenderGeometryV1=true;
  window.__relphiDrawingBoardRenderGeometryV2=true;
  var script=document.createElement('script');
  script.src='drawing-board-render-geometry-desktop-v3.js?v=1';
  document.head.appendChild(script);
})();
