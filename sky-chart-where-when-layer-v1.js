// Where and When view contract: the primary Where and When action opens the editor directly.
// The confirmed summary remains useful after saving, but it must never intercept the edit affordance.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyWhereWhenLayerV1)return;
window.__relphiSkyWhereWhenLayerV1=true;

function addEditControl(section){
  if(!section||section.querySelector('[data-ww-summary-edit]'))return;
  const facts=section.querySelector('.sky-where-when-facts');
  if(!facts)return;
  const button=document.createElement('button');
  button.type='button';
  button.className='sky-where-when-button secondary';
  button.dataset.wwAction='edit';
  button.dataset.wwSummaryEdit='true';
  button.textContent='Edit Where and When';
  facts.appendChild(button);
}

function hydrate(){
  document.querySelectorAll('.sky-where-when-confirmed').forEach(addEditControl);
  document.querySelectorAll('.sky-where-when-actions [data-ww-action="edit"]').forEach(button=>{
    button.setAttribute('aria-label','Edit Where and When');
  });
}

window.addEventListener('relphi:sky-heptagram-source-ready',()=>requestAnimationFrame(hydrate));
window.addEventListener('relphi:sky-foundation-ready',()=>requestAnimationFrame(hydrate));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(hydrate),{once:true});
else requestAnimationFrame(hydrate);
})();