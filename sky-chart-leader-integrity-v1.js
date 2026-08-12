// Keep every placement leader inseparable from its actual endpoint marker.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyLeaderIntegrityV1)return;
  window.__relphiSkyLeaderIntegrityV1=true;

  let queued=false;
  let observer=null;

  function installStyle(){
    if(document.getElementById('skyLeaderIntegrityV1Style'))return;
    const style=document.createElement('style');
    style.id='skyLeaderIntegrityV1Style';
    style.textContent=`
      /* A leader without an active endpoint is visual noise, not context. */
      .sky-foundation-wheel.has-isolation [data-layer="leaders"] > line[data-placement]:not(.is-kept){opacity:0!important;visibility:hidden!important}
      [data-layer="leaders"] > line[data-leader-orphan="true"]{opacity:0!important;visibility:hidden!important}
      [data-layer="leaders"] > line[data-endpoint-hidden="true"]{opacity:0!important;visibility:hidden!important}
    `;
    document.head.appendChild(style);
  }

  function esc(value){
    if(window.CSS?.escape)return CSS.escape(String(value));
    return String(value).replace(/["\\]/g,'\\$&');
  }

  function markerFor(wheel,sky,placement){
    if(!wheel||!sky||!placement)return null;
    return wheel.querySelector(`[data-layer="placements"] > g[data-sky="${esc(sky)}"][data-placement="${esc(placement)}"]`);
  }

  function markerSuppressed(marker){
    if(!marker)return true;
    if(marker.hidden||marker.getAttribute('aria-hidden')==='true')return true;
    const classes=[
      'sky-chart-multiselect-hidden','sky-chart-house-multiselect-hidden','sky-chart-aspect-multiselect-hidden',
      'sky-chart-sign-filter-hidden','sky-chart-orb-hidden','sky-foundation-single-sky-cross-hidden'
    ];
    if(classes.some(name=>marker.classList.contains(name)))return true;
    const inline=marker.style;
    if(inline?.display==='none'||inline?.visibility==='hidden')return true;
    return false;
  }

  function normalizeLeader(leader){
    const placement=leader.dataset.placement||leader.dataset.angle||'';
    const sky=leader.dataset.sky||'';
    if(placement&&!leader.dataset.placement)leader.dataset.placement=placement;
    if(placement)leader.dataset.focusPiece='leader';
    if(placement)leader.classList.add('sky-foundation-focus-piece');
    return{sky,placement};
  }

  function sync(){
    queued=false;
    const wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
    if(!wheel)return;
    const isolated=wheel.classList.contains('has-isolation');
    wheel.querySelectorAll('[data-layer="leaders"] > line').forEach(leader=>{
      const {sky,placement}=normalizeLeader(leader);
      if(!sky||!placement){
        // Non-placement geometry is not governed by endpoint visibility.
        leader.removeAttribute('data-leader-orphan');
        leader.removeAttribute('data-endpoint-hidden');
        return;
      }
      const marker=markerFor(wheel,sky,placement);
      const orphan=!marker;
      const endpointHidden=!orphan&&markerSuppressed(marker);
      leader.dataset.leaderOrphan=orphan?'true':'false';
      leader.dataset.endpointHidden=endpointHidden?'true':'false';

      // The marker is the authority. Never let an index-based annotation keep the wrong leader alive.
      if(marker){
        const kept=marker.classList.contains('is-kept');
        leader.classList.toggle('is-kept',kept);
        leader.classList.toggle('is-aspect-endpoint',marker.classList.contains('is-aspect-endpoint'));
        if(isolated&&!kept)leader.setAttribute('aria-hidden','true');
        else if(!endpointHidden)leader.removeAttribute('aria-hidden');
      }else{
        leader.classList.remove('is-kept','is-aspect-endpoint');
        leader.setAttribute('aria-hidden','true');
      }
    });
  }

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(sync);
  }

  function start(){
    installStyle();
    ['relphi:sky-foundation-ready','relphi:sky-foundation-filter-changed','relphi:sky-placement-multiselect-changed',
     'relphi:sky-house-multiselect-changed','relphi:sky-aspect-multiselect-changed','relphi:sky-zodiac-filter-changed',
     'relphi:sky-orb-limit-changed'].forEach(name=>window.addEventListener(name,schedule));

    const mount=document.getElementById('skyFoundationWheelMount');
    if(mount){
      observer=new MutationObserver(records=>{
        if(records.some(record=>record.type==='childList'||record.attributeName==='class'||record.attributeName==='hidden'||record.attributeName==='aria-hidden'))schedule();
      });
      observer.observe(mount,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','aria-hidden']});
    }
    schedule();
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
