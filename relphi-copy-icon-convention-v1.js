// Canonical clipboard button presentation. Owner modules retain all clipboard logic.
(function(){
  'use strict';
  if(window.__relphiCopyIconConventionV1)return;
  window.__relphiCopyIconConventionV1=true;
  const SELECTORS=[
    '.sky-relationship-copy-button',
    '.sky-wheel-copy-button',
    '.sky-quick-copy-button',
    '.sky-card-hits-copy-all',
    '.sky-configuration-copy-button',
    '.sky-configuration-tile-copy',
    '#relphiCopyBespokeQuestions',
    '.relphi-copy-reading',
    '#copyLink'
  ].join(',');
  let queued=false;
  function apply(button){
    if(!(button instanceof HTMLButtonElement)||!button.matches(SELECTORS))return;
    const raw=String(button.textContent||'').trim();
    const done=/^Copied(?:\b|\s|\.)/i.test(raw);
    const failed=/^Copy failed\b/i.test(raw);
    const copying=/^Copying\b|^Preparing.*copy/i.test(raw);
    const state=done?'done':failed?'failed':copying?'copying':'idle';
    if(!button.dataset.relphiCopyIconAction){
      const action=button.getAttribute('aria-label')||button.title||(/^Copy\b/i.test(raw)?raw:'Copy');
      button.dataset.relphiCopyIconAction=action;
    }
    button.classList.add('relphi-copy-icon-button');
    if(button.dataset.relphiCopyFeedback!==state)button.dataset.relphiCopyFeedback=state;
    const label=state==='done'?raw||'Copied':state==='failed'?'Copy failed':state==='copying'?'Copying':button.dataset.relphiCopyIconAction;
    if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);
    if(button.title!==label)button.title=label;
  }
  function hydrate(){
    queued=false;
    document.querySelectorAll(SELECTORS).forEach(apply);
  }
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(hydrate);
  }
  function start(){
    hydrate();
    new MutationObserver(records=>{
      for(const record of records){
        if(record.type==='characterData'){
          if(record.target?.parentElement?.closest?.(SELECTORS)){schedule();return}
          continue;
        }
        if(record.type==='childList'&&[...record.addedNodes].some(node=>
          node.nodeType===1&&(node.matches?.(SELECTORS)||node.querySelector?.(SELECTORS))||
          node.parentElement?.closest?.(SELECTORS)
        )){schedule();return}
      }
    }).observe(document.body,{childList:true,characterData:true,subtree:true});
    window.addEventListener('relphi:sky-foundation-ready',schedule);
    window.addEventListener('relphi:sky-foundation-interactions-ready',schedule);
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
