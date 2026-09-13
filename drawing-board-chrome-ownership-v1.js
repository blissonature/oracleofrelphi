// Drawing Board chrome loader. Desktop chrome owns UI only; mobile owns its dedicated geometry/UI.
(function(){
  'use strict';
  if(!/(^|\/)tarot\.html$/.test(location.pathname))return;
  var mobile=window.matchMedia&&window.matchMedia('(max-width:700px)').matches;
  var script=document.createElement('script');
  if(mobile){
    // Reserve the legacy chrome flag before the async child attaches so no desktop/legacy owner can race it.
    window.__relphiDrawingBoardChromeOwnershipV1=true;
    script.src='drawing-board-mobile-celtic-v2.js?v=3';
  }else{
    // The retired desktop core mixed chrome, mobile geometry and sticker CSS. Block it permanently.
    window.__relphiDrawingBoardChromeOwnershipV1=true;
    script.src='drawing-board-chrome-ui-desktop-v2.js?v=1';
  }
  document.head.appendChild(script);
})();
