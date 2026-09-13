// Drawing Board chrome loader. Desktop chrome owns UI only; mobile owns its dedicated geometry/UI.
(function(){
  'use strict';
  if(!/(^|\/)tarot\.html$/.test(location.pathname))return;
  var mobile=window.matchMedia&&window.matchMedia('(max-width:700px)').matches;
  var script=document.createElement('script');
  window.__relphiDrawingBoardChromeOwnershipV1=true;
  if(mobile){
    script.src='drawing-board-mobile-celtic-v2.js?v=3';
  }else{
    window.__relphiDrawingBoardChromeUIV2=true;
    script.src='drawing-board-chrome-ui-desktop-v3.js?v=1';
  }
  document.head.appendChild(script);
})();