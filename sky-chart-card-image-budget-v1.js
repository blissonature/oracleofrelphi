// Chart Card Hits media budget: keep full card art only near the viewport.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkyCardImageBudgetV1)return;
  window.__relphiSkyCardImageBudgetV1=true;

  let io=null;
  let mo=null;

  function dehydrate(img){
    if(!(img instanceof HTMLImageElement))return;
    const src=img.getAttribute('src');
    if(src&&!img.dataset.cardHitFullSrc)img.dataset.cardHitFullSrc=src;
    img.decoding='async';
    img.loading='lazy';
    img.setAttribute('fetchpriority','low');
    if(img.dataset.cardHitFullSrc&&img.getAttribute('src'))img.removeAttribute('src');
    img.dataset.cardHitMediaState='dehydrated';
  }

  function hydrate(img){
    const src=img?.dataset?.cardHitFullSrc;
    if(!src||img.getAttribute('src')===src)return;
    img.setAttribute('src',src);
    img.dataset.cardHitMediaState='hydrated';
  }

  function register(img){
    if(!(img instanceof HTMLImageElement)||!img.matches('.sky-card-hit-art img'))return;
    if(img.dataset.cardHitMediaBudget==='true')return;
    img.dataset.cardHitMediaBudget='true';
    dehydrate(img);
    if(io)io.observe(img);else hydrate(img);
  }

  function inspect(node){
    if(!(node instanceof Element))return;
    if(node.matches?.('.sky-card-hit-art img'))register(node);
    node.querySelectorAll?.('.sky-card-hit-art img').forEach(register);
  }

  function start(){
    if('IntersectionObserver' in window){
      io=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting)hydrate(entry.target);
          else dehydrate(entry.target);
        });
      },{root:null,rootMargin:'600px 0px',threshold:0.01});
    }
    document.querySelectorAll('.sky-card-hit-art img').forEach(register);
    const root=document.getElementById('skyFoundationRoot')||document.body;
    mo=new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(inspect)));
    mo.observe(root,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
