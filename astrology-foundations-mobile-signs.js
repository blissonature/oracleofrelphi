// Mobile sizing for Astrology Foundations signs.
// Preserve the authored four-column matrix while fitting it on narrow phones.
(function(){
  'use strict';
  if(!/(^|\/)astrology-foundations\.html$/.test(location.pathname))return;
  document.getElementById('astrology-foundations-mobile-signs')?.remove();
  const style=document.createElement('style');
  style.id='astrology-foundations-mobile-signs';
  style.textContent=`
    @media (max-width:560px){
      .foundation-page{padding-left:.45rem!important;padding-right:.45rem!important}
      .foundation-panel{padding:.55rem!important}
      .matrix-scroll{overflow-x:hidden!important;overflow-y:hidden!important;padding-bottom:0!important}
      .foundation-matrix:not(.house-matrix){
        min-width:0!important;
        width:100%!important;
        max-width:100%!important;
        grid-template-columns:minmax(3.2rem,3.65rem) repeat(3,minmax(0,1fr))!important;
        gap:.28rem!important;
      }
      .foundation-matrix:not(.house-matrix) .matrix-corner{
        display:grid!important;
        grid-column:auto!important;
        min-width:0!important;
      }
      .foundation-matrix:not(.house-matrix) .matrix-row-label{
        display:grid!important;
        grid-column:auto!important;
        min-width:0!important;
        margin:0!important;
        padding:.24rem .12rem!important;
        border:1.25px solid #111!important;
        border-radius:.68rem!important;
        box-shadow:none!important;
        background:#fff!important;
        font-size:.66rem!important;
        line-height:1.02!important;
        letter-spacing:0!important;
        text-align:center!important;
        overflow-wrap:anywhere!important;
      }
      .foundation-matrix:not(.house-matrix) .matrix-head{
        min-width:0!important;
        padding:.3rem .08rem!important;
        border-radius:.62rem!important;
        font-size:.61rem!important;
        line-height:1.02!important;
        overflow-wrap:anywhere!important;
      }
      .foundation-matrix:not(.house-matrix) .flip-tile{
        min-width:0!important;
        width:100%!important;
        height:4.05rem!important;
      }
      .foundation-matrix:not(.house-matrix) .flip-face{
        min-width:0!important;
        padding:.18rem!important;
        border-radius:.68rem!important;
      }
      .foundation-matrix:not(.house-matrix) svg.front-glyph{
        width:72px!important;
        height:72px!important;
        max-width:96%!important;
        max-height:96%!important;
        transform:none!important;
      }
      .foundation-matrix:not(.house-matrix) .flip-back{
        padding:.2rem!important;
        font-size:.58rem!important;
        line-height:1.05!important;
        overflow-wrap:anywhere!important;
      }
      .matrix-corner .hemi-toggle,
      .hemisphere-filters button.hemi-toggle{
        width:1.08rem!important;
        height:1.08rem!important;
      }
      .element-filters{gap:.28rem!important;margin-bottom:.55rem!important}
      .element-filters button{padding:.38rem .52rem!important;font-size:.76rem!important}
    }
    @media (max-width:350px){
      .foundation-page{padding-left:.3rem!important;padding-right:.3rem!important}
      .foundation-panel{padding:.42rem!important}
      .foundation-matrix:not(.house-matrix){
        grid-template-columns:minmax(2.9rem,3.2rem) repeat(3,minmax(0,1fr))!important;
        gap:.22rem!important;
      }
      .foundation-matrix:not(.house-matrix) .matrix-head{font-size:.57rem!important}
      .foundation-matrix:not(.house-matrix) .matrix-row-label{font-size:.61rem!important}
      .foundation-matrix:not(.house-matrix) svg.front-glyph{width:64px!important;height:64px!important}
    }
  `;
  document.head.appendChild(style);
})();
