// Present Sky B comparison presence as paired card-local icon controls.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkySlotCardControlsV1)return;
  window.__relphiSkySlotCardControlsV1=true;

  let queued=false;

  function icon(kind){
    const span=document.createElement('span');
    span.className=`sky-slot-card-icon sky-slot-card-icon--${kind}`;
    span.setAttribute('aria-hidden','true');
    return span;
  }

  function ensureAddProxy(){
    const heading=document.querySelector('#skyFoundationA > .sky-foundation-heading');
    if(!heading)return;
    let button=heading.querySelector('[data-card-add-sky-b]');
    if(!button){
      button=document.createElement('button');
      button.type='button';
      button.className='sky-slot-card-control sky-slot-card-control--add';
      button.dataset.cardAddSkyB='true';
      button.setAttribute('aria-label','Add Sky B');
      button.title='Add Sky B';
      button.appendChild(icon('plus'));
      button.addEventListener('click',event=>{
        event.preventDefault();
        event.stopPropagation();
        document.querySelector('#skyFoundationComparison [data-add-sky-b]')?.click();
      });
      heading.appendChild(button);
    }
    const present=document.documentElement.dataset.skyBPresent==='true';
    const editing=document.documentElement.dataset.skyBEditing==='true';
    button.hidden=present||editing;
  }

  function styleRemove(){
    const remove=document.querySelector('#skyFoundationB > .sky-foundation-heading [data-remove-sky-b]');
    if(!remove)return;
    if(remove.dataset.cardIconified==='true')return;
    remove.dataset.cardIconified='true';
    remove.classList.add('sky-slot-card-control','sky-slot-card-control--remove');
    remove.setAttribute('aria-label','Remove Sky B');
    remove.title='Remove Sky B';
    remove.replaceChildren(icon('minus'));
  }

  function suppressInternalAdd(){
    const add=document.querySelector('#skyFoundationComparison > .sky-foundation-heading [data-add-sky-b]');
    if(add){
      add.classList.add('sky-slot-internal-add');
      add.setAttribute('aria-hidden','true');
      add.tabIndex=-1;
    }
  }

  function sync(){
    queued=false;
    suppressInternalAdd();
    ensureAddProxy();
    styleRemove();
  }

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(sync);
  }

  function start(){
    sync();
    const root=document.getElementById('skyFoundationRoot')||document.body;
    new MutationObserver(schedule).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
    new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-sky-b-present','data-sky-b-editing','data-sky-last-mode']});
    window.addEventListener('storage',schedule);
    window.addEventListener('relphi:sky-foundation-ready',schedule);
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
