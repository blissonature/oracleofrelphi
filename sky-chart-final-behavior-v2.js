// Final interaction behavior: relationship selection does not replace exploration isolation.
(function(){
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyFinalBehaviorV2) return;
  window.__relphiSkyFinalBehaviorV2 = true;

  let queued=false;

  function preserveRowSelection(event){
    const row=event.target.closest?.('.sky-foundation-relationship-row[data-relation-index]');
    if(!row)return;
    const prior=row.getAttribute('data-interactive');
    row.removeAttribute('data-interactive');
    queueMicrotask(()=>{
      if(prior!=null)row.setAttribute('data-interactive',prior);
      else row.setAttribute('data-interactive','aspect');
    });
  }

  function expandHeptagrams(){
    document.querySelectorAll('.sky-ph-heptagram').forEach(svg=>{
      if(svg.dataset.finalExpanded==='true'||!svg.querySelector('.sky-ph-planet'))return;
      svg.dataset.finalExpanded='true';
      const transform='translate(180 180) scale(1.16) translate(-180 -180)';
      svg.querySelectorAll('.sky-ph-week-segment,.sky-ph-planet').forEach(node=>{
        const existing=node.getAttribute('transform');
        node.setAttribute('transform',existing?`${transform} ${existing}`:transform);
      });
    });
  }

  function removeAspectBoxes(){
    document.querySelectorAll('.sky-foundation-aspect-hit,[data-layer="aspects"] rect').forEach(node=>{
      node.setAttribute('fill','transparent');
      node.setAttribute('stroke','none');
      node.removeAttribute('tabindex');
      node.style.outline='none';
    });
  }

  function run(){queued=false;expandHeptagrams();removeAspectBoxes()}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(run)}

  function start(){
    const root=document.getElementById('skyFoundationRoot');
    root?.addEventListener('click',preserveRowSelection,true);
    root?.addEventListener('keydown',event=>{
      if(!['Enter',' '].includes(event.key))return;
      preserveRowSelection(event);
    },true);
    if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
    window.addEventListener('relphi:selected-relationship-rendered',schedule);
    window.addEventListener('relphi:sky-foundation-ready',schedule);
    schedule();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
