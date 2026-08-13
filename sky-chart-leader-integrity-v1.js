// Keep every placement marker and its authored leader inseparable.
// The foundation renderer is the source of truth for leader identity; later interaction
// layers may decorate that identity but may never re-pair leaders by array position.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyLeaderIntegrityV2)return;
  window.__relphiSkyLeaderIntegrityV2=true;
  window.__relphiSkyLeaderIntegrityV1=true;

  let queued=false;
  let observer=null;

  function installStyle(){
    if(document.getElementById('skyLeaderIntegrityV2Style'))return;
    const style=document.createElement('style');
    style.id='skyLeaderIntegrityV2Style';
    style.textContent=`
      /* Marker and leader are one visual unit. Only a missing/hidden endpoint may
         make its leader disappear. Dim endpoints keep equally dim leaders. */
      [data-layer="leaders"] > line[data-leader-orphan="true"],
      [data-layer="leaders"] > line[data-endpoint-hidden="true"]{
        opacity:0!important;
        visibility:hidden!important;
      }
      .sky-foundation-wheel.has-isolation [data-layer="leaders"] > line[data-placement]:not(.is-kept){
        opacity:.08!important;
        visibility:visible!important;
      }
      .sky-foundation-wheel.has-isolation [data-layer="leaders"] > line[data-placement].is-kept{
        opacity:1!important;
        visibility:visible!important;
      }
      .sky-foundation-wheel.has-filter-focus:not(.has-isolation) [data-layer="leaders"] > line[data-placement]:not(.is-filter-kept){
        opacity:.08!important;
        visibility:visible!important;
      }
      .sky-foundation-wheel.has-filter-focus:not(.has-isolation) [data-layer="leaders"] > line[data-placement].is-filter-kept{
        opacity:1!important;
        visibility:visible!important;
      }
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

  function parseTranslate(node){
    const match=String(node?.getAttribute?.('transform')||'').match(/translate\(\s*([-+\d.eE]+)[ ,]+([-+\d.eE]+)\s*\)/);
    return match?{x:Number(match[1]),y:Number(match[2])}:null;
  }

  function distance(a,b){return a&&b?Math.hypot(a.x-b.x,a.y-b.y):Infinity}

  function markerFromGeometry(wheel,leader){
    // Ordinary leaders originate exactly at the displaced marker center. Matching the
    // SVG start point recovers the authored marker even if another layer overwrote data-*.
    if(leader.dataset.angle){
      const sky=leader.dataset.axisExtreme==='outer'?'A':leader.dataset.axisExtreme==='inner'?'B':leader.dataset.sky;
      return markerFor(wheel,sky,leader.dataset.angle)||wheel.querySelector(`[data-layer="placements"] > g[data-placement="${esc(leader.dataset.angle)}"][data-angle-axis="true"]`);
    }
    const start={x:Number(leader.getAttribute('x1')),y:Number(leader.getAttribute('y1'))};
    if(!Number.isFinite(start.x)||!Number.isFinite(start.y))return null;
    let best=null,bestDistance=.75;
    wheel.querySelectorAll('[data-layer="placements"] > g[data-sky][data-placement]').forEach(marker=>{
      const point=parseTranslate(marker),d=distance(start,point);
      if(d<bestDistance){best=marker;bestDistance=d}
    });
    return best;
  }

  function captureAuthoredIdentity(wheel){
    if(!wheel)return;
    wheel.querySelectorAll('[data-layer="leaders"] > line').forEach(leader=>{
      if(leader.dataset.authoredLeaderIdentity==='true')return;
      let sky=leader.dataset.sky||'';
      let placement=leader.dataset.angle||leader.dataset.placement||'';
      if(leader.dataset.angle){
        if(leader.dataset.axisExtreme==='outer')sky='A';
        else if(leader.dataset.axisExtreme==='inner')sky='B';
      }
      const marker=markerFromGeometry(wheel,leader);
      if(marker){sky=marker.dataset.sky||sky;placement=marker.dataset.placement||placement}
      if(!sky||!placement)return;
      leader.dataset.authoredSky=sky;
      leader.dataset.authoredPlacement=placement;
      leader.dataset.authoredLeaderIdentity='true';
    });
  }

  function restoreIdentity(wheel,leader){
    let sky=leader.dataset.authoredSky||'';
    let placement=leader.dataset.authoredPlacement||'';
    let marker=sky&&placement?markerFor(wheel,sky,placement):null;
    if(!marker){
      marker=markerFromGeometry(wheel,leader);
      if(marker){
        sky=marker.dataset.sky||'';
        placement=marker.dataset.placement||'';
        if(sky&&placement){
          leader.dataset.authoredSky=sky;
          leader.dataset.authoredPlacement=placement;
          leader.dataset.authoredLeaderIdentity='true';
        }
      }
    }
    if(sky)leader.dataset.sky=sky;
    if(placement)leader.dataset.placement=placement;
    if(placement){leader.dataset.focusPiece='leader';leader.classList.add('sky-foundation-focus-piece')}
    return{sky,placement,marker};
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

  function mirrorState(leader,marker){
    ['is-kept','is-filter-kept','is-aspect-endpoint'].forEach(name=>leader.classList.toggle(name,!!marker?.classList.contains(name)));
  }

  function sync(){
    queued=false;
    const wheel=document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
    if(!wheel)return;
    captureAuthoredIdentity(wheel);
    wheel.querySelectorAll('[data-layer="leaders"] > line').forEach(leader=>{
      const {sky,placement,marker}=restoreIdentity(wheel,leader);
      if(!sky||!placement){
        leader.removeAttribute('data-leader-orphan');
        leader.removeAttribute('data-endpoint-hidden');
        return;
      }
      const orphan=!marker;
      const endpointHidden=!orphan&&markerSuppressed(marker);
      leader.dataset.leaderOrphan=orphan?'true':'false';
      leader.dataset.endpointHidden=endpointHidden?'true':'false';
      if(marker){
        mirrorState(leader,marker);
        if(endpointHidden)leader.setAttribute('aria-hidden','true');
        else leader.removeAttribute('aria-hidden');
      }else{
        leader.classList.remove('is-kept','is-filter-kept','is-aspect-endpoint');
        leader.setAttribute('aria-hidden','true');
      }
    });
  }

  function schedule(){if(queued)return;queued=true;requestAnimationFrame(sync)}

  function foundationReady(){
    // Capture synchronously. The interaction controller responds to the same event by
    // scheduling a later animation-frame annotation pass, so this preserves the exact
    // identities authored by the renderer before any index-based legacy code can touch them.
    captureAuthoredIdentity(document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel'));
    schedule();
  }

  function start(){
    installStyle();
    window.addEventListener('relphi:sky-foundation-ready',foundationReady);
    ['relphi:sky-foundation-interactions-ready','relphi:sky-foundation-filter-changed','relphi:sky-placement-multiselect-changed',
     'relphi:sky-house-multiselect-changed','relphi:sky-aspect-multiselect-changed','relphi:sky-zodiac-filter-changed',
     'relphi:sky-harmonic-window-visibility-changed','relphi:sky-filter-wheel-focus-changed'].forEach(name=>window.addEventListener(name,schedule));

    const mount=document.getElementById('skyFoundationWheelMount');
    if(mount){
      observer=new MutationObserver(records=>{
        const relevant=records.some(record=>{
          if(record.type==='childList')return true;
          const target=record.target;
          // Never react to our own leader-class repairs; only endpoint/wheel state changes.
          if(target?.closest?.('[data-layer="leaders"]'))return false;
          return target?.matches?.('.sky-foundation-wheel,[data-layer="placements"] > g[data-sky][data-placement]');
        });
        if(relevant)schedule();
      });
      observer.observe(mount,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','aria-hidden']});
    }
    captureAuthoredIdentity(document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel'));
    schedule();
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
