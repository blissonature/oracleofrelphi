// Keep Progressions alive when Sky A or Sky B is replaced in place (for example Update to Now).
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyProgressionsLiveRefreshV1)return;
  window.__relphiSkyProgressionsLiveRefreshV1=true;

  const SKY_KEYS=new Set(['relphiSkyChartA','relphiSkyChartB']);
  let pendingRefresh=false;
  let refreshToken=0;
  let observedMount=null;
  let observer=null;
  let lastBaseWheel=null;
  let retryTimer=0;

  function middle(){return document.getElementById('skyFoundationComparison')}
  function panel(){return document.getElementById('skyProgressionsPanel')}
  function baseMount(){return document.getElementById('skyFoundationWheelMount')}
  function baseWheel(){return baseMount()?.querySelector('.sky-foundation-wheel')||null}
  function progressionsActive(){
    const host=middle(),view=panel();
    return !!host&&!!view&&host.dataset.progressionsActive==='true'&&!view.hidden;
  }
  function preserveSelection(){
    const host=middle(),view=panel();if(!host||!view)return false;
    host.dataset.progressionsActive='true';view.hidden=false;
    host.querySelectorAll('[data-sky-middle-tab]').forEach(button=>{
      button.setAttribute('aria-selected',button.dataset.skyMiddleTab==='progressions'?'true':'false');
    });
    return true;
  }
  function clearRetry(){if(retryTimer){clearTimeout(retryTimer);retryTimer=0}}

  function rebind(token,attempt=0){
    if(token!==refreshToken||!pendingRefresh)return;
    if(!progressionsActive()){
      pendingRefresh=false;clearRetry();return;
    }
    preserveSelection();
    const source=baseWheel();
    if(!source||source===lastBaseWheel){
      if(attempt<40)retryTimer=setTimeout(()=>rebind(token,attempt+1),50);
      return;
    }
    clearRetry();
    lastBaseWheel=source;
    // The Progressions controller already knows how to clone the Comparison wheel.
    // Re-fire its foundation-ready contract only after the replacement wheel exists.
    window.dispatchEvent(new Event('relphi:sky-foundation-ready'));
    requestAnimationFrame(()=>{
      preserveSelection();
      window.dispatchEvent(new Event('relphi:progressions-ring-enforce'));
      pendingRefresh=false;
    });
  }
  function queueRebind(){
    if(!pendingRefresh||!progressionsActive())return;
    const token=refreshToken;
    requestAnimationFrame(()=>requestAnimationFrame(()=>rebind(token)));
  }
  function observeBaseMount(){
    const mount=baseMount();if(!mount||mount===observedMount)return;
    observer?.disconnect();observedMount=mount;lastBaseWheel=baseWheel();
    observer=new MutationObserver(()=>queueRebind());
    observer.observe(mount,{childList:true,subtree:false});
  }

  window.addEventListener('storage',event=>{
    if(!SKY_KEYS.has(event.key)||!progressionsActive())return;
    pendingRefresh=true;refreshToken+=1;preserveSelection();
    queueRebind();
  });

  // Update to Now dispatches a synthetic storage event in this same tab. Capture the
  // selected Progressions state before any downstream rerender gets a chance to hide it.
  document.addEventListener('click',event=>{
    if(!event.target.closest?.('[data-final-now]')||!progressionsActive())return;
    preserveSelection();
  },true);

  const structureObserver=new MutationObserver(()=>{
    observeBaseMount();
    if(pendingRefresh)queueRebind();
  });

  function start(){
    observeBaseMount();
    structureObserver.observe(document.body,{childList:true,subtree:true});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
