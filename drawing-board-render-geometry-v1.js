// Drawing Board geometry loader. Repair persisted Celtic state before any viewport-specific owner paints it.
(function(){
  'use strict';
  if(!/(^|\/)tarot\.html$/.test(location.pathname))return;

  window.__relphiDrawingBoardRenderGeometryV1=true;
  window.__relphiDrawingBoardRenderGeometryV2=true;
  window.__relphiDrawingBoardRenderGeometryV3=true;

  function append(src,onload){
    var script=document.createElement('script');
    script.async=false;
    script.src=src;
    if(onload)script.addEventListener('load',onload,{once:true});
    document.head.appendChild(script);
  }

  append('drawing-board-celtic-state-repair-v1.js?v=1',function(){
    if(window.matchMedia&&window.matchMedia('(max-width:700px)').matches)return;
    append('drawing-board-render-geometry-desktop-v4.js?v=2');
  });
})();