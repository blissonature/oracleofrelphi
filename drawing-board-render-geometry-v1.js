// Drawing Board desktop geometry loader. The shipped prefab owns the traditional Celtic coordinates.
(function(){
  'use strict';
  if(!/(^|\/)tarot\.html$/.test(location.pathname))return;
  if(window.matchMedia&&window.matchMedia('(max-width:700px)').matches)return;
  window.__relphiDrawingBoardRenderGeometryV1=true;
  window.__relphiDrawingBoardRenderGeometryV2=true;
  window.__relphiDrawingBoardRenderGeometryV3=true;
  var script=document.createElement('script');
  script.src='drawing-board-render-geometry-desktop-v4.js?v=1';
  document.head.appendChild(script);
})();