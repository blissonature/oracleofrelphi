function primeChiron(){
  const service=window.RelphiChironEphemeris;if(!service?.ready)return;
  service.ready().then(()=>{
    window.RelphiRelationshipTransitMeta?.clearDurationCache?.();
    document.querySelectorAll('#skyFoundationRelationshipList .inline-rel-transit-window[data-transit-kind="unavailable"]').forEach(meta=>{meta.dataset.transitReady='false';delete meta.dataset.transitSignature});
    const sort=window.RelphiRelationshipSort,mode=sort?.mode?.();if(TIMING_MODES.has(mode))sort.setMode?.(mode);
  }).catch(error=>console.error('[Relationship timing Chiron]',error));
}
function start(){
  window.addEventListener('relphi:relationship-sort-changed',scheduleSortRefresh);
  ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-intrasky-relationships-ready','relphi:sky-intrasky-b-relationships-ready','relphi:sky-harmonic-window-visibility-changed','relphi:sky-live-origin-changed','relphi:relationship-display-changed'].forEach(name=>window.addEventListener(name,()=>{window.RelphiRelationshipTransitMeta?.clearDurationCache?.();scheduleSortRefresh()}));
  primeChiron();
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
