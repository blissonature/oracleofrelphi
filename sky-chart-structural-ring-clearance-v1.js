// Keeps canonical comparison placements inside the protected zodiac/house structure.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  let queued=false;

  function translate(node){
    const match=String(node.getAttribute('transform')||'').match(/translate\(\s*([-+\d.eE]+)[ ,]+([-+\d.eE]+)\s*\)/);
    return match?{x:Number(match[1]),y:Number(match[2])}:null;
  }
  function radiusFor(host){
    try{const box=host.getBBox();return Math.max(box.width,box.height)/2}catch(_){return 18}
  }
  function clampWheel(svg){
    const structure=svg.querySelector(':scope > .relphi-dual-house-rings');
    const markers=svg.querySelector(':scope > .relphi-canonical-marker-layer:not(.relphi-canonical-marker-staging)');
    if(!structure||!markers)return;
    const cx=Number(structure.dataset.cx),cy=Number(structure.dataset.cy),inner=Number(structure.dataset.innerLimit);
    if(!Number.isFinite(cx)||!Number.isFinite(cy)||!Number.isFinite(inner))return;
    const hosts=Array.from(markers.querySelectorAll('.relphi-canonical-marker-host'));
    const lines=Array.from(markers.querySelectorAll('.relphi-canonical-marker-leader'));
    hosts.forEach(function(host,index){
      const p=translate(host);if(!p)return;
      const dx=p.x-cx,dy=p.y-cy,distance=Math.hypot(dx,dy)||1,radius=radiusFor(host),maximum=Math.max(1,inner-radius-5);
      if(distance<=maximum)return;
      const x=cx+dx/distance*maximum,y=cy+dy/distance*maximum;
      host.setAttribute('transform','translate('+x.toFixed(3)+' '+y.toFixed(3)+')');
      host.dataset.relphiStructuralClearance='true';
      const line=lines[index];if(!line)return;
      const x1=Number(line.getAttribute('x1')),y1=Number(line.getAttribute('y1'));
      if(!Number.isFinite(x1)||!Number.isFinite(y1))return;
      const lx=x-x1,ly=y-y1,length=Math.hypot(lx,ly)||1;
      line.setAttribute('x2',(x-lx/length*(radius+1.5)).toFixed(3));
      line.setAttribute('y2',(y-ly/length*(radius+1.5)).toFixed(3));
    });
  }
  function run(){queued=false;document.querySelectorAll('.unified-sky-wheel svg,#chartOutput svg,#currentSkyOutput svg,.sky-output-box svg').forEach(clampWheel)}
  function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){requestAnimationFrame(run)})}
  function relevant(records){return records.some(function(record){return Array.from(record.addedNodes||[]).some(function(node){return node&&node.nodeType===1&&(node.matches?.('.relphi-canonical-marker-layer,.relphi-dual-house-rings')||node.querySelector?.('.relphi-canonical-marker-layer,.relphi-dual-house-rings'))})})}
  function start(){queue();new MutationObserver(function(records){if(relevant(records))queue()}).observe(document.body,{childList:true,subtree:true});window.addEventListener('relphi:wheel-structure-ready',queue);window.addEventListener('relphi:extra-points-updated',queue);window.addEventListener('resize',queue,{passive:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();