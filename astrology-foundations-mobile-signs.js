// Mobile sizing for Astrology Foundations signs.
// Preserve the authored four-column matrix: hemisphere/season labels stay at left.
(function(){
  'use strict';
  if(!/(^|\/)astrology-foundations\.html$/.test(location.pathname))return;
  if(document.getElementById('astrology-foundations-mobile-signs'))return;
  const style=document.createElement('style');
  style.id='astrology-foundations-mobile-signs';
  style.textContent=`
    @media (max-width:560px){
      .matrix-scroll{overflow-x:auto!important;overflow-y:hidden!important}
      .foundation-matrix:not(.house-matrix){
        min-width:40rem!important;
        grid-template-columns:minmax(4.7rem,5.2rem) repeat(3,minmax(9rem,1fr))!important;
        gap:.36rem!important;
      }
      .foundation-matrix:not(.house-matrix) .matrix-corner{
        display:grid!important;
        grid-column:auto!important;
      }
      .foundation-matrix:not(.house-matrix) .matrix-row-label{
        display:grid!important;
        grid-column:auto!important;
        margin:0!important;
        padding:.35rem .2rem!important;
        border:1.5px solid #111!important;
        border-radius:1rem!important;
        box-shadow:0 4px 16px rgba(0,0,0,.04)!important;
        background:#fff!important;
        font-size:.82rem!important;
        line-height:1!important;
      }
      .foundation-matrix:not(.house-matrix) .matrix-head{
        min-width:0!important;
        padding:.38rem .2rem!important;
        font-size:.7rem!important;
        line-height:1.05!important;
      }
      .foundation-matrix:not(.house-matrix) .flip-tile{height:4.35rem!important}
      .foundation-matrix:not(.house-matrix) .flip-face{padding:.28rem!important}
      .foundation-matrix:not(.house-matrix) .front-glyph{line-height:1!important}
    }
  `;
  document.head.appendChild(style);
})();
