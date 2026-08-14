// Keep pointer motion authoritative: wheel paint stays immediate while expensive hover
// synchronization is withheld until the pointer has actually settled.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyHoverMotionPriorityV1)return;
  window.__relphiSkyHoverMotionPriorityV1=true;

  const EVENT='relphi:sky-foundation-filter-changed';
  const QUIET_MS=90;
  const REPLAY='motionPriorityReplay';
  let lastPointerMove=0;
  let pendingDetail=null;
  let timer=0;

  function installImmediatePaintStyle(){
    if(document.getElementById('skyHoverMotionPriorityStyle'))return;
    const style=document.createElement('style');
    style.id='skyHoverMotionPriorityStyle';
    style.textContent=`
      #skyFoundationWheelMount .sky-foundation-interactive,
      #skyFoundationWheelMount .sky-foundation-focus-piece,
      #skyFoundationWheelMount .sky-foundation-sign-glyph {
        transition:none!important;
        will-change:auto!important;
      }
    `;
    document.head.appendChild(style);
  }

  function overWheel(event){
    return event.target instanceof Element&&!!event.target.closest('#skyFoundationWheelMount');
  }

  function markMotion(event){
    if(overWheel(event))lastPointerMove=performance.now();
  }

  function scheduleFlush(){
    clearTimeout(timer);
    timer=setTimeout(flush,QUIET_MS);
  }

  function flush(){
    timer=0;
    if(!pendingDetail)return;
    const quietFor=performance.now()-lastPointerMove;
    if(quietFor<QUIET_MS){
      timer=setTimeout(flush,Math.max(8,QUIET_MS-quietFor));
      return;
    }
    const detail={...pendingDetail,[REPLAY]:true};
    pendingDetail=null;
    window.dispatchEvent(new CustomEvent(EVENT,{detail}));
  }

  function intercept(event){
    const detail=event.detail||{};
    if(detail[REPLAY])return;
    if(detail.state?.mode!=='hover')return;
    // This listener is installed before the downstream list/filter controllers. Stop
    // the per-hover broadcast here, remember only the newest state, and replay it once
    // the pointer is quiet. The wheel has already painted from the fast-path cache.
    event.stopImmediatePropagation();
    pendingDetail=detail;
    scheduleFlush();
  }

  function clearPending(){
    clearTimeout(timer);timer=0;pendingDetail=null;
  }

  function start(){
    installImmediatePaintStyle();
    document.addEventListener('pointermove',markMotion,true);
    window.addEventListener(EVENT,intercept);
    window.addEventListener('relphi:sky-foundation-ready',clearPending);
    window.addEventListener('storage',clearPending);
    window.addEventListener('pagehide',clearPending);
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
