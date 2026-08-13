// Keep canonical endpoint glyphs centered in the inline relationship mini-wheel.
// The canonical SVG masters remain untouched; this only defines the viewport of the
// nested SVG that is mounted inside an exact-degree endpoint <g>.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyInlineEndpointViewportV1)return;
  window.__relphiSkyInlineEndpointViewportV1=true;

  const SIZE=38;
  const HALF=SIZE/2;
  let queued=false;

  function normalize(svg){
    if(!(svg instanceof SVGSVGElement))return;
    svg.setAttribute('x',String(-HALF));
    svg.setAttribute('y',String(-HALF));
    svg.setAttribute('width',String(SIZE));
    svg.setAttribute('height',String(SIZE));
    svg.setAttribute('preserveAspectRatio','xMidYMid meet');
    svg.style.setProperty('width',`${SIZE}px`,'important');
    svg.style.setProperty('height',`${SIZE}px`,'important');
    svg.style.setProperty('overflow','hidden','important');
    svg.style.pointerEvents='none';
    svg.dataset.inlineEndpointViewport='centered';
  }

  function apply(){
    queued=false;
    document.querySelectorAll('.inline-rel-canonical-point > svg').forEach(normalize);
  }
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(apply);
  }
  function start(){
    apply();
    const root=document.getElementById('skyFoundationRelationshipList')||document.getElementById('skyFoundationRelationships')||document.body;
    new MutationObserver(records=>{
      if(records.some(record=>Array.from(record.addedNodes).some(node=>node.nodeType===1&&(node.matches?.('.inline-rel-canonical-point > svg')||node.querySelector?.('.inline-rel-canonical-point > svg')))))schedule();
    }).observe(root,{childList:true,subtree:true});
    window.addEventListener('relphi:selected-relationship-rendered',schedule);
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
