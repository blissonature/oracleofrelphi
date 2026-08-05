// Selected relationship identity: card border color only; no redundant title or Sky labels.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkySelectedCardIdentityV1)return;
  window.__relphiSkySelectedCardIdentityV1=true;

  let queued=false;

  function installStyles(){
    if(document.getElementById('skySelectedCardIdentityStyles'))return;
    const style=document.createElement('style');
    style.id='skySelectedCardIdentityStyles';
    style.textContent=`
      #skySelectedRelationship .sky-redundancy-title{display:none!important}
      #skySelectedRelationship .sky-selected-card-label{display:none!important}
      #skySelectedRelationship .sky-selected-card[data-selected-card="A"]{
        border:3px solid #c9211e!important;
        box-shadow:none!important;
      }
      #skySelectedRelationship .sky-selected-card[data-selected-card="B"]{
        border:3px solid #2462d0!important;
        box-shadow:none!important;
      }
      #skySelectedRelationship .sky-selected-card{
        padding-top:.7rem!important;
      }
    `;
    document.head.appendChild(style);
  }

  function apply(){
    queued=false;
    const panel=document.getElementById('skySelectedRelationship');
    if(!panel||panel.hidden)return;
    panel.querySelectorAll('.sky-redundancy-title').forEach(node=>node.remove());
    panel.querySelectorAll('.sky-selected-card-label').forEach(node=>node.remove());
    const cardA=panel.querySelector('.sky-selected-card[data-selected-card="A"]');
    const cardB=panel.querySelector('.sky-selected-card[data-selected-card="B"]');
    if(cardA){cardA.dataset.skyIdentity='border-red';cardA.setAttribute('aria-label','Sky A card')}
    if(cardB){cardB.dataset.skyIdentity='border-blue';cardB.setAttribute('aria-label','Sky B card')}
    panel.dataset.cardIdentityPresentation='border-color-only';
  }

  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(apply))}
  function start(){
    installStyles();
    ['relphi:selected-relationship-rendered','relphi:selected-relationship-redundancy-pass-ready'].forEach(name=>window.addEventListener(name,schedule));
    new MutationObserver(mutations=>{if(mutations.some(m=>m.addedNodes.length))schedule()}).observe(document.body,{childList:true,subtree:true});
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
