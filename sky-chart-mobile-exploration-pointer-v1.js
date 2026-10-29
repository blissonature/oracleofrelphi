// Mobile-only virtual exploration cursor for Sky Chart.
// The four-way navigation cross is the drag target; the arrow TIP owns hit-testing.
// The foundation interaction controller remains the sole owner of focus/selection.
(function(){
 'use strict';
 if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiMobileExplorePointerV1)return;
 window.__relphiMobileExplorePointerV1=true;
 const query='(max-width: 650px) and (pointer: coarse)';
 const media=matchMedia(query);
 const NS='http://www.w3.org/2000/svg';
 let mount=null,cursor=null,grip=null,drag=null,tip=null,frame=0;
 const TIP_X=2.5,TIP_Y=3;
 const HOME_INSET_X=120; // keep full grip on-screen at initial upper-right parking
 let scrollRestore=null;
 function lockScroll(){
  if(scrollRestore)return;
  const html=document.documentElement,body=document.body;
  const y=window.scrollY,x=window.scrollX;
  const old={overflow:html.style.overflow,overscroll:html.style.overscrollBehavior,
   position:body.style.position,top:body.style.top,left:body.style.left,
   width:body.style.width,bodyOverscroll:body.style.overscrollBehavior};
  html.style.overflow='hidden';html.style.overscrollBehavior='none';
  body.style.position='fixed';body.style.top=(-y)+'px';body.style.left=(-x)+'px';
  body.style.width='100%';body.style.overscrollBehavior='none';
  scrollRestore=()=>{
   html.style.overflow=old.overflow;html.style.overscrollBehavior=old.overscroll;
   body.style.position=old.position;body.style.top=old.top;
   body.style.left=old.left;body.style.width=old.width;
   body.style.overscrollBehavior=old.bodyOverscroll;
   scrollRestore=null;window.scrollTo(x,y);
  };
 }
 function unlockScroll(){scrollRestore?.()}
 function blockTouchScroll(event){if(drag&&event.cancelable)event.preventDefault()}
 document.addEventListener('touchmove',blockTouchScroll,{passive:false,capture:true});
 document.addEventListener('gesturestart',blockTouchScroll,{passive:false,capture:true});
 document.addEventListener('gesturechange',blockTouchScroll,{passive:false,capture:true});
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const controller=()=>window.RelphiSkyFoundationInteractions;
 const wheel=()=>document.querySelector('#skyFoundationWheelMount > svg.sky-foundation-wheel');
 function clientTip(){
  if(!tip||!mount)return null;
  const b=mount.getBoundingClientRect();
  // Use the visible pointer tip, never a silently clamped substitute.
  // Outside the wheel, hit testing naturally returns no chart target.
  return{x:b.left+tip.x,y:b.top+tip.y};
 }
 function wheelBox(){
  const el=wheel();
  return el?.getBoundingClientRect()||null;
 }
 function withinWheel(x,y){
  const box=wheelBox(),host=mount?.getBoundingClientRect();
  if(!box||!host)return null;
  // Keep the arrow's tip inside the actual SVG, independent of phone zoom.
  return {
   x:clamp(x,box.left-host.left+3,box.right-host.left-3),
   y:clamp(y,box.top-host.top+3,box.bottom-host.top-3)
  };
 }
 function paint(){
  if(!cursor||!tip)return;
  cursor.style.left=(tip.x-TIP_X)+'px';
  cursor.style.top=(tip.y-TIP_Y)+'px';
  cursor.dataset.dragging=drag?'true':'false';
 }
 function moveTip(x,y){
  // During drag keep the physical handle-to-pointer offset constant.
  // Clamping the visible artwork lets the thumb overtake the pointer.
  // Off-wheel tips simply clear the preview rather than acting elsewhere.
  if(drag){tip={x,y};paint();return}
  const clipped=withinWheel(x,y);
  if(!clipped)return;
  tip=clipped;paint();
 }
 function broadcastHouse(focus){
  window.dispatchEvent(new CustomEvent('relphi:sky-virtual-house-hover',{detail:focus?.kind==='house'?{sky:focus.sky,house:Number(focus.value)}:null}));
 }
 function hover(){
  frame=0;
  if(!drag)return;
  const p=clientTip();
  if(p){const focus=controller()?.previewVirtualPointer?.(p.x,p.y);broadcastHouse(focus)}
 }
 function requestHover(){
  if(!frame)frame=requestAnimationFrame(hover);
 }
 function pointerMove(event){
  if(!drag||drag.id!==event.pointerId)return;
  event.preventDefault();
  moveTip(drag.startX+event.clientX-drag.clientX,drag.startY+event.clientY-drag.clientY);
  requestHover();
 }
 function pointerDown(event){
  if(drag||!tip)return;
  if(event.pointerType==='mouse'&&event.button!==0)return;
  event.preventDefault();event.stopPropagation();
  drag={id:event.pointerId,clientX:event.clientX,clientY:event.clientY,startX:tip.x,startY:tip.y};
  lockScroll();
  try{grip.setPointerCapture(event.pointerId)}catch(_){}
  controller()?.beginVirtualPointer?.();
  requestHover();
 }
 function endDrag(event,commit){
  if(!drag||drag.id!==event.pointerId)return;
  if(frame){cancelAnimationFrame(frame);frame=0}
  // Commit after updating the position, even when pointerup arrived without
  // a preceding pointermove (short drags and accessibility gestures).
  if(commit)pointerMove(event);
  const p=clientTip();
  const active=commit&&p?controller()?.commitVirtualPointer?.(p.x,p.y):null;
  if(!commit)controller()?.clearVirtualPointer?.();
  broadcastHouse(null);
  drag=null;
  // Once the thumb lifts, park the cursor tip back inside the wheel.
  const parked=withinWheel(tip.x,tip.y);
  if(parked)tip=parked;
  unlockScroll();paint();
  try{if(grip.hasPointerCapture(event.pointerId))grip.releasePointerCapture(event.pointerId)}catch(_){}
  if(active)cursor.dataset.focus=active.kind;else delete cursor.dataset.focus;
  event.preventDefault();event.stopPropagation();
 }
 function onKey(event){
  if(!tip)return;
  const delta=event.shiftKey?20:8;
  const offsets={ArrowLeft:[-delta,0],ArrowRight:[delta,0],ArrowUp:[0,-delta],ArrowDown:[0,delta]};
  if(offsets[event.key]){
   event.preventDefault();event.stopPropagation();
   const d=offsets[event.key];
   if(!drag)controller()?.beginVirtualPointer?.();
   moveTip(tip.x+d[0],tip.y+d[1]);
   const p=clientTip();
   if(p)controller()?.previewVirtualPointer?.(p.x,p.y);
  }else if(event.key==='Enter'||event.key===' '){
   event.preventDefault();event.stopPropagation();
   const p=clientTip();
   if(p)controller()?.commitVirtualPointer?.(p.x,p.y);
  }else if(event.key==='Escape'){
   event.preventDefault();controller()?.clearVirtualPointer?.();broadcastHouse(null);
  }
 }
 function updateMode(){
  if(!mount)return;
  const mobile=media.matches;
  cursor.hidden=!mobile;
  if(!mobile&&drag){
   drag=null;unlockScroll();controller()?.clearVirtualPointer?.();broadcastHouse(null);
  }
 }
 function resetPosition(){
  if(!mount||drag)return;
  const box=wheelBox(),host=mount.getBoundingClientRect();
  if(!box)return;
  if(!tip){
   // Park in the wheel's upper-right corner with enough room for the
   // 42px artwork and the drag cross, rather than in the chart's center.
   tip={x:box.right-host.left-HOME_INSET_X,y:box.top-host.top+25};
  }
  moveTip(tip.x,tip.y);
 }
 function attach(){
  const target=document.getElementById('skyFoundationComparison');
  if(!target||!wheel())return;
  if(target===mount){
   // The foundation replaces wheelMount children on a chart redraw.
   // Reattach the existing controls without losing their state/handlers.
   if(cursor&&!cursor.isConnected)target.appendChild(cursor);
   resetPosition();updateMode();return;
  }
  mount=target;
  cursor=document.createElement('div');
  cursor.className='relphi-mobile-exploration-cursor';
  cursor.id='relphiMobileExplorationCursor';
  cursor.setAttribute('role','group');
  cursor.setAttribute('aria-label','Draggable exploration cursor');
  // Pointer tip (5,6) and midpoint of the other arrowhead tips\n  // (75,46) and (38,82) => (56.5,64) define the diagonal axis.\n  // The move cross center (82,93) extends that axis with a small visual gap.\n  // Vector artwork modeled on the user's outlined arrow + four-way move cross.
  // The complete drawing never intercepts a wheel tap; only the cross does.
  cursor.innerHTML='<svg viewBox="0 0 200 195" width="100" height="97.5" aria-hidden="true" focusable="false">'
    +'<path class="relphi-mobile-cursor-arrow" d="M5 6 L75 46 L50 57 L38 82 Z"/>'
    +'<g class="relphi-mobile-cursor-cross" transform="translate(126.65 143)">'
    +'<path d="M0 -15 V15 M-15 0 H15 M-4 -11 L0 -15 L4 -11 M-4 11 L0 15 L4 11 M-11 -4 L-15 0 L-11 4 M11 -4 L15 0 L11 4"/>'
    +'<circle class="relphi-mobile-pointer-touch-area" r="32"/>'
    +'</g></svg>';
  grip=cursor.querySelector('.relphi-mobile-cursor-cross');
  grip.setAttribute('role','button');
  grip.setAttribute('tabindex','0');
  grip.setAttribute('aria-label','Drag to explore the wheel. Release to select. Arrow keys also move the pointer.');
  grip.addEventListener('pointerdown',pointerDown);
  grip.addEventListener('pointermove',pointerMove);
  grip.addEventListener('pointerup',event=>endDrag(event,true));
  grip.addEventListener('pointercancel',event=>endDrag(event,false));
  grip.addEventListener('lostpointercapture',event=>endDrag(event,false));
  grip.addEventListener('keydown',onKey);
  grip.addEventListener('click',event=>{event.preventDefault();event.stopPropagation()});
  target.appendChild(cursor);
  resetPosition();updateMode();
 }
 let queued=false,observedMount=null;
 const watcher=new MutationObserver(()=>{if(!cursor?.isConnected)schedule()});
 function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{
   queued=false;
   attach();
   // On slower mobile initialization the wheel SVG may appear after
   // DOMContentLoaded and after the first ready event. Attach when it arrives,
   // rather than leaving the pointer permanently absent.
   const host=document.getElementById('skyFoundationWheelMount');
   if(host&&host!==observedMount){
    watcher.disconnect();observedMount=host;
    watcher.observe(host,{childList:true});
   }
  });
 }
 window.addEventListener('relphi:sky-foundation-ready',schedule);
 window.addEventListener('resize',schedule);
 window.addEventListener('load',schedule);
 if(media.addEventListener)media.addEventListener('change',updateMode);
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule,{once:true}):schedule();
 window.RelphiMobileExplorationPointer=Object.freeze({
  isEnabled:()=>media.matches,
  getTip:()=>tip?{...tip}:null
 });
})();
