// Synchronize relationship rows to the exact aspect indices retained by wheel isolation.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiIsolationResultsIndexV1)return;
  window.__relphiIsolationResultsIndexV1=true;

  let queued=false;
  let wheelObserver=null;

  function relationshipHeading(){
    return Array.from(document.querySelectorAll('h1,h2,h3,h4,[role="heading"]')).find(node=>/^relationships$/i.test(String(node.textContent||'').trim()))||null;
  }

  function relationshipRegion(){
    const heading=relationshipHeading();
    if(!heading)return null;
    let node=heading.parentElement;
    while(node&&node!==document.body){
      if(node.querySelector('[data-relationship-index],.relationship-row,.relphi-relationship-row,.relationship-list-row,[data-relphi-relationship]'))return node;
      node=node.parentElement;
    }
    return heading.parentElement;
  }

  function rows(){
    const region=relationshipRegion();
    if(!region)return[];
    const selectors='[data-relationship-index],.relationship-row,.relphi-relationship-row,.relationship-list-row,[data-relphi-relationship]';
    const candidates=Array.from(region.querySelectorAll(selectors));
    const seen=new Set();
    return candidates.map(node=>{
      let host=node;
      while(host.parentElement&&host.parentElement!==region){
        const parent=host.parentElement;
        if(parent.querySelectorAll(selectors).length!==1)break;
        host=parent;
      }
      return host;
    }).filter(host=>{
      if(seen.has(host))return false;
      seen.add(host);
      return true;
    });
  }

  function activeIndices(svg){
    if(!svg?.classList.contains('has-isolation'))return null;
    const values=new Set();
    svg.querySelectorAll('[data-interactive="aspect"].is-kept,[data-interactive="aspect"].is-related,[data-interactive="aspect"].is-selected').forEach(line=>{
      const index=Number(line.dataset.aspectIndex);
      if(Number.isInteger(index)&&index>=0)values.add(index);
    });
    return values;
  }

  function badge(){
    const heading=relationshipHeading();
    const scope=heading?.parentElement;
    return Array.from(scope?.querySelectorAll('span,output,strong,b')||[]).find(node=>/^\d+(?:\s*\/\s*\d+)?$/.test(String(node.textContent||'').trim()))||null;
  }

  function apply(){
    queued=false;
    const svg=document.querySelector('.unified-sky-wheel>.scn-live-wheel[data-ready="true"]');
    const active=activeIndices(svg);
    const list=rows();
    if(!list.length)return;

    list.forEach((row,index)=>{
      const explicit=Number(row.dataset.relationshipIndex ?? row.querySelector('[data-relationship-index]')?.dataset.relationshipIndex);
      const relationshipIndex=Number.isInteger(explicit)&&explicit>=0?explicit:index;
      row.dataset.relphiResolvedRelationshipIndex=String(relationshipIndex);
      row.classList.toggle('relphi-index-filtered-out',!!active&&!active.has(relationshipIndex));
    });

    const count=badge();
    if(count){
      if(!count.dataset.relphiTotal)count.dataset.relphiTotal=String(list.length||Number(count.textContent)||0);
      count.textContent=active?String(list.filter(row=>!row.classList.contains('relphi-index-filtered-out')).length)+' / '+count.dataset.relphiTotal:count.dataset.relphiTotal;
    }
  }

  function queue(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>requestAnimationFrame(apply));
  }

  function bindWheel(){
    const svg=document.querySelector('.unified-sky-wheel>.scn-live-wheel[data-ready="true"]');
    if(!svg)return;
    wheelObserver?.disconnect();
    wheelObserver=new MutationObserver(queue);
    wheelObserver.observe(svg,{attributes:true,subtree:true,attributeFilter:['class']});
    svg.addEventListener('click',queue,true);
    svg.addEventListener('keydown',queue,true);
  }

  function style(){
    if(document.getElementById('relphi-index-isolation-style'))return;
    const node=document.createElement('style');
    node.id='relphi-index-isolation-style';
    node.textContent='.relphi-index-filtered-out{display:none!important}';
    document.head.appendChild(node);
  }

  function start(){
    style();
    bindWheel();
    apply();
    window.addEventListener('relphi:sky-chart-next-display-ready',()=>{bindWheel();queue()});
    new MutationObserver(mutations=>{
      if(mutations.some(m=>Array.from(m.addedNodes).some(node=>node.nodeType===1&&(node.matches?.('.scn-live-wheel,[data-relationship-index],.relationship-row,.relphi-relationship-row,.relationship-list-row,[data-relphi-relationship]')||node.querySelector?.('.scn-live-wheel,[data-relationship-index],.relationship-row,.relphi-relationship-row,.relationship-list-row,[data-relphi-relationship]'))))){bindWheel();queue()}
    }).observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();