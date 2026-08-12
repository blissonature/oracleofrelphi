// Keep the Placement popover structurally canonical: one table header, then real selection rows.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyPlacementPopoverCleanupV1)return;
  window.__relphiSkyPlacementPopoverCleanupV1=true;

  let queued=false;

  function clean(){
    queued=false;
    const menu=document.getElementById('skyChartPlacementPopover');
    if(!menu)return;

    // The current Placement control owns exactly one popover body. Older builds left
    // an extra Placement/A/B toolbar beside it; that shell fragment is redundant.
    let body=Array.from(menu.children).find(node=>node.classList?.contains('sky-chart-placement-filter-body'))||null;
    if(!body){
      body=document.createElement('div');
      body.className='sky-chart-placement-filter-body';
      menu.appendChild(body);
    }
    Array.from(menu.children).forEach(node=>{if(node!==body)node.remove()});

    const list=body.querySelector('.sky-chart-placement-list');
    if(!list)return;
    const children=Array.from(list.children);
    const header=children.find(node=>node.classList?.contains('sky-chart-placement-list-header'))||null;

    // Current selection rows always carry data-placement-list-item. Any extra direct
    // child after the canonical header is residue from the older Placement toolbar.
    children.forEach(node=>{
      if(node===header)return;
      if(node.hasAttribute('data-placement-list-item'))return;
      node.remove();
    });

    // There must be only one canonical table header.
    let seenHeader=false;
    Array.from(list.children).forEach(node=>{
      if(!node.classList?.contains('sky-chart-placement-list-header'))return;
      if(!seenHeader){seenHeader=true;return}
      node.remove();
    });
  }

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(clean);
  }

  function start(){
    clean();
    const root=document.getElementById('skyFoundationRelationships')||document.body;
    new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
    document.addEventListener('click',event=>{
      if(event.target.closest?.('[data-placement-filter-toggle]'))schedule();
    },true);
    ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-placement-multiselect-changed'].forEach(name=>window.addEventListener(name,schedule));
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
