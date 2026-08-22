// Mobile interaction cleanup: Relationships use page scrolling, and the Harmonic Window
// stays at an iOS-safe input font size so Safari does not auto-zoom the page on focus.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyMobileScrollZoomV1)return;
window.__relphiSkyMobileScrollZoomV1=true;
const STYLE_ID='skyMobileScrollZoomV1Styles';
function install(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
    @media(max-width:620px){
      #skyFoundationRelationships,
      #skyFoundationRelationships #skyFoundationRelationshipList,
      #skyFoundationRelationships #skyFoundationRelationshipList:has(> .sky-foundation-relationship-row.is-inline-expanded){
        max-height:none!important;
        min-height:0!important;
        height:auto!important;
        overflow:visible!important;
        overscroll-behavior:auto!important;
        -webkit-overflow-scrolling:auto!important;
        scrollbar-gutter:auto!important;
      }
      #skyFoundationRelationships #skyFoundationRelationshipList{
        touch-action:pan-y pinch-zoom!important;
        padding-bottom:max(96px,calc(env(safe-area-inset-bottom) + 72px))!important;
      }
      #skyFoundationRelationships .sky-foundation-relationship-row,
      #skyFoundationRelationships .inline-rel-detail,
      #skyFoundationRelationships .inline-rel-visual{
        touch-action:pan-y pinch-zoom!important;
      }
      #skyFoundationRelationships [data-harmonic-window-input]{
        font-size:16px!important;
        line-height:1.2!important;
        touch-action:manipulation!important;
      }
    }
  `;document.head.appendChild(style);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
})();
