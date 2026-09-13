// Drawing Board chrome loader: mobile uses the dedicated mobile owner; desktop uses the preserved core.
(function(){
  'use strict';
  if(!/(^|\/)tarot\.html$/.test(location.pathname))return;
  var script=document.createElement('script');
  if(window.matchMedia&&window.matchMedia('(max-width:700px)').matches){
    script.src='drawing-board-mobile-celtic-v2.js?v=2';
  }else{
    script.src='drawing-board-chrome-ownership-desktop-core-v1.js?v=1';
  }
  document.head.appendChild(script);
})();
