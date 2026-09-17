// Mobile interaction cleanup v4: Relationships yields vertical drags to native page scrolling.
// Tap-versus-pan arbitration belongs to the browser via touch-action. This helper owns layout only;
// relationship row expansion and progressive reveals retain sole ownership of activation events.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyMobileScrollZoomV4)return;
window.__relphiSkyMobileScrollZoomV1=true;
window.__relphiSkyMobileScrollZoomV2=true;
window.__relphiSkyMobileScrollZoomV3=true;
window.__relphiSkyMobileScrollZoomV4=true;
const STYLE_ID='skyMobileScrollZoomV4Styles';

function install(){
  document.getElementById('skyMobileScrollZoomV1Styles')?.remove();
  document.getElementById('skyMobileScrollZoomV2Styles')?.remove();
  document.getElementById('skyMobileScrollZoomV3Styles')?.remove();
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
    @media(max-width:620px){
      #skyFoundationRelationships,
      #skyFoundationRelationships #skyFoundationRelationshipList,
      #skyFoundationRelationships #skyFoundationRelationshipList:has(> .sky-foundation-relationship-row.is-inline-expanded),
      #skyFoundationRelationships .sky-foundation-relationship-row,
      #skyFoundationRelationships .inline-rel-detail{
        max-height:none!important;
        min-height:0!important;
        height:auto!important;
        overflow:visible!important;
        overscroll-behavior:auto!important;
        overscroll-behavior-y:auto!important;
        -webkit-overflow-scrolling:auto!important;
        scrollbar-gutter:auto!important;
      }
      #skyFoundationRelationships #skyFoundationRelationshipList{
        padding-bottom:max(96px,calc(env(safe-area-inset-bottom) + 72px))!important;
      }
      /* The browser owns the distinction between a tap and a vertical pan. Do not
         intercept pointer/click events here; the row and progressive-reveal controllers
         are the only activation owners. */
      #skyFoundationRelationships #skyFoundationRelationshipList,
      #skyFoundationRelationships #skyFoundationRelationshipList *{
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
