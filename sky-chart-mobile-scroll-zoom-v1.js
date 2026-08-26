// Mobile interaction cleanup v2: every Relationships surface yields vertical drags to page scrolling.
// A movement threshold keeps scroll gestures from being mistaken for taps/reveals.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyMobileScrollZoomV2)return;
window.__relphiSkyMobileScrollZoomV1=true;
window.__relphiSkyMobileScrollZoomV2=true;
const STYLE_ID='skyMobileScrollZoomV2Styles';
let gesture=null;
let suppressClickUntil=0;

function inRelationshipList(target){
  return target instanceof Element&&!!target.closest('#skyFoundationRelationshipList');
}
function install(){
  document.getElementById('skyMobileScrollZoomV1Styles')?.remove();
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
      /* Any place a finger lands inside Relationships must still be a page-scroll surface.
         Taps continue to work because pan-y does not suppress ordinary tap/click activation. */
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

function onPointerDown(event){
  if((event.pointerType!=='touch'&&event.pointerType!=='pen')||!inRelationshipList(event.target))return;
  gesture={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};
}
function onPointerMove(event){
  if(!gesture||gesture.id!==event.pointerId)return;
  const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
  if(Math.abs(dy)>=8&&Math.abs(dy)>=Math.abs(dx)*.7)gesture.moved=true;
}
function onPointerUp(event){
  if(!gesture||gesture.id!==event.pointerId)return;
  const moved=gesture.moved&&inRelationshipList(event.target);
  gesture=null;
  if(!moved)return;
  suppressClickUntil=performance.now()+650;
  // This runs on window capture, before the document-level relationship reveal handlers.
  // Native scrolling has already owned the gesture; stop only the app's pointer-up reaction.
  event.stopImmediatePropagation();
}
function onPointerCancel(event){if(gesture&&gesture.id===event.pointerId)gesture=null}
function onClick(event){
  if(performance.now()>=suppressClickUntil||!inRelationshipList(event.target))return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

window.addEventListener('pointerdown',onPointerDown,{capture:true,passive:true});
window.addEventListener('pointermove',onPointerMove,{capture:true,passive:true});
window.addEventListener('pointerup',onPointerUp,true);
window.addEventListener('pointercancel',onPointerCancel,true);
window.addEventListener('click',onClick,true);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
})();
