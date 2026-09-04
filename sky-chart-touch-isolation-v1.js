// Sky Chart touch isolation v1: make comparison-wheel taps use the same latched click path as mouse input.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyTouchIsolationV1)return;
window.__relphiSkyTouchIsolationV1=true;

const MOVE_THRESHOLD=10;
const CLICK_SUPPRESS_MS=700;
let gesture=null;
let suppressNativeClickUntil=0;
let dispatchingSyntheticClick=false;

function asElement(target){return target instanceof Element?target:null}
function inWheel(target){return !!asElement(target)?.closest('#skyFoundationWheelMount .sky-foundation-wheel')}
function interactiveTarget(target){return asElement(target)?.closest('#skyFoundationWheelMount [data-interactive]')||null}

function onPointerDown(event){
  if((event.pointerType!=='touch'&&event.pointerType!=='pen')||!inWheel(event.target))return;
  gesture={
    id:event.pointerId,
    x:event.clientX,
    y:event.clientY,
    moved:false,
    target:interactiveTarget(event.target),
    fallback:asElement(event.target)
  };
}

function onPointerMove(event){
  if(!gesture||gesture.id!==event.pointerId)return;
  const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
  if(Math.hypot(dx,dy)>=MOVE_THRESHOLD)gesture.moved=true;
}

function onPointerUp(event){
  if(!gesture||gesture.id!==event.pointerId)return;
  const finished=gesture;
  gesture=null;
  suppressNativeClickUntil=performance.now()+CLICK_SUPPRESS_MS;
  if(finished.moved)return;

  const target=finished.target||asElement(event.target)||finished.fallback;
  if(!target||!inWheel(target))return;

  // The foundation interaction controller already owns lock/unlock semantics on click.
  // Dispatch one click at the original touch target so a sign/house/placement latches,
  // or so a blank-area tap clears the current isolation.
  event.preventDefault();
  dispatchingSyntheticClick=true;
  try{
    target.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
  }finally{
    dispatchingSyntheticClick=false;
  }
}

function onPointerCancel(event){if(gesture&&gesture.id===event.pointerId)gesture=null}

function onClick(event){
  if(dispatchingSyntheticClick)return;
  if(performance.now()>=suppressNativeClickUntil||!inWheel(event.target))return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

window.addEventListener('pointerdown',onPointerDown,{capture:true,passive:true});
window.addEventListener('pointermove',onPointerMove,{capture:true,passive:true});
window.addEventListener('pointerup',onPointerUp,{capture:true,passive:false});
window.addEventListener('pointercancel',onPointerCancel,true);
window.addEventListener('click',onClick,true);
})();
