// Makes the redesigned Sky Studio the direct edit destination from each Sky card.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  let opening=false;

  function relabel(){
    document.querySelectorAll('.relphi-v4-sky-panel [data-edit]').forEach(function(button){
      button.textContent='Sky Studio';
      button.setAttribute('aria-label','Open Sky Studio for '+(button.closest('.relphi-v4-sky-panel')?.querySelector('h3')?.textContent||'this sky'));
    });
  }

  document.addEventListener('click',function(event){
    const button=event.target.closest('.relphi-v4-sky-panel [data-edit]');
    if(!button||opening)return;
    opening=true;
    setTimeout(function waitForChoice(attempt){
      const placementChoice=document.querySelector('#relphiSkyBuilderV4 [data-action="placements"]');
      if(placementChoice){
        placementChoice.click();
        opening=false;
        return;
      }
      if(attempt<20)return setTimeout(function(){waitForChoice(attempt+1)},25);
      opening=false;
    },0,0);
  },true);

  function start(){
    relabel();
    new MutationObserver(relabel).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();