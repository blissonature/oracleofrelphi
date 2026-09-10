// Present Sky B comparison presence as paired card-local icon controls.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkySlotCardControlsV3)return;
  window.__relphiSkySlotCardControlsV1=true;
  window.__relphiSkySlotCardControlsV2=true;
  window.__relphiSkySlotCardControlsV3=true;

  const SKY_A_KEY='relphiSkyChartA';
  const SKY_B_KEY='relphiSkyChartB';
  const LIVE_AGE_KEYS={A:'relphiSkyLiveAgeAnchorA',B:'relphiSkyLiveAgeAnchorB'};
  let queued=false;
  let undoTimer=0;
  let promoting=false;

  function icon(kind){
    const span=document.createElement('span');
    span.className=`sky-slot-card-icon sky-slot-card-icon--${kind}`;
    span.setAttribute('aria-hidden','true');
    return span;
  }
  function storedSkyBRaw(){
    try{return localStorage.getItem(SKY_B_KEY)}catch(_){return null}
  }
  function hasStoredSkyB(){
    try{
      const startup=window.RelphiSkyStartupMode;
      if(typeof startup?.hasStoredSkyB==='function')return startup.hasStoredSkyB();
      return !!startup?.read?.(SKY_B_KEY);
    }catch(_){return false}
  }

  function skyBPresent(){
    return document.documentElement.dataset.skyBPresent==='true';
  }

  function startAddSkyB(){
    if(skyBPresent()||document.documentElement.dataset.skyBEditing==='true')return;
    // A hidden/stale B payload must not suppress the user's Add Sky B control
    // or silently restore an old comparison. Add Sky B always starts a fresh B workflow.
    if(hasStoredSkyB()){
      try{localStorage.removeItem(SKY_B_KEY)}catch(_){}
      dispatchSkyBStorage(null);
    }
    const internal=document.querySelector('#skyFoundationComparison [data-add-sky-b]');
    if(internal){internal.click();return}

    const root=document.documentElement;
    root.dataset.skyBEditing='true';
    const startup=window.RelphiSkyStartupMode;
    if(startup?.writeMode)startup.writeMode('comparison');
    else{
      root.dataset.skyLastMode='comparison';
      try{localStorage.setItem('relphiSkyChartLastModeV1','comparison')}catch(_){}
    }
    startup?.syncRoot?.();

    const panel=document.getElementById('skyFoundationB');
    if(panel)panel.hidden=false;
    window.RelphiSkyCardShell?.ensure?.('B',null);
    window.RelphiSkyCardShell?.openDrawer?.('B','where');

    requestAnimationFrame(()=>{
      if(document.querySelector('#skyFoundationB .sky-where-when-editor'))return;
      window.dispatchEvent(new CustomEvent('relphi:sky-drawer-opened',{detail:{slot:'B',drawer:'where'}}));
    });
  }
  function releaseSkyBWhereWhen(){
    const transaction=window.RelphiSkyWhereWhenTransaction;
    try{transaction?.cancel?.('B')}catch(_){}
    try{window.RelphiSkyCardShell?.setEditorExpanded?.('B',false)}catch(_){}
    document.querySelectorAll('.sky-where-when-editor[data-slot="B"]').forEach(form=>form.remove());
    try{
      if(transaction?.active?.()===false){
        document.documentElement.dataset.skyWhereWhenEditing='false';
        document.documentElement.dataset.skyWhereWhenEditingSlots='';
      }
    }catch(_){}
  }
  function removeSkyB(){
    releaseSkyBWhereWhen();
    try{localStorage.removeItem(SKY_B_KEY)}catch(_){return}
    delete document.documentElement.dataset.skyBEditing;
    const startup=window.RelphiSkyStartupMode;
    startup?.writeMode?.('single');
    startup?.syncRoot?.();
    document.documentElement.dataset.skyLastMode='single';
    document.documentElement.dataset.skyBPresent='false';
    dispatchSkyBStorage(null);
    window.dispatchEvent(new CustomEvent('relphi:sky-b-removed'));
  }
  function ensureRemoveControl(){
    const heading=document.querySelector('#skyFoundationB > .sky-foundation-heading');
    if(!heading)return;
    const present=skyBPresent()&&hasStoredSkyB();
    let remove=heading.querySelector('[data-remove-sky-b]');
    if(present&&!remove){
      remove=document.createElement('button');
      remove.type='button';
      remove.className='sky-slot-presence-button sky-slot-remove';
      remove.dataset.removeSkyB='true';
      remove.textContent='Remove Sky B';
      remove.addEventListener('click',event=>{
        event.preventDefault();
        event.stopPropagation();
        removeSkyB();
      });
      heading.appendChild(remove);
    }
    if(remove)remove.hidden=!present;
  }

  function dismissUndo(){
    clearTimeout(undoTimer);
    undoTimer=0;
    document.querySelector('.sky-slot-undo-toast')?.remove();
  }
  function dispatchStorage(key,raw){
    try{
      window.dispatchEvent(new StorageEvent('storage',{key,newValue:raw,storageArea:localStorage}));
      return;
    }catch(_){}
    const event=new Event('storage');
    try{Object.defineProperty(event,'key',{value:key})}catch(_){}
    try{Object.defineProperty(event,'newValue',{value:raw})}catch(_){}
    window.dispatchEvent(event);
  }
  function dispatchSkyAStorage(raw){dispatchStorage(SKY_A_KEY,raw)}
  function dispatchSkyBStorage(raw){dispatchStorage(SKY_B_KEY,raw)}
  function restoreSkyB(raw){
    if(!raw)return;
    try{localStorage.setItem(SKY_B_KEY,raw)}catch(_){return}
    delete document.documentElement.dataset.skyBEditing;
    const startup=window.RelphiSkyStartupMode;
    if(startup?.writeMode)startup.writeMode('comparison');
    else{
      document.documentElement.dataset.skyLastMode='comparison';
      try{localStorage.setItem('relphiSkyChartLastModeV1','comparison')}catch(_){}
    }
    startup?.syncRoot?.();
    document.documentElement.dataset.skyLastMode='comparison';
    document.documentElement.dataset.skyBPresent='true';
    dispatchSkyBStorage(raw);
    window.dispatchEvent(new CustomEvent('relphi:sky-b-restored'));
    dismissUndo();
  }
  function showUndo(raw){
    if(!raw)return;
    dismissUndo();
    const toast=document.createElement('div');
    toast.className='sky-slot-undo-toast';
    toast.setAttribute('role','status');
    toast.setAttribute('aria-live','polite');
    const message=document.createElement('span');
    message.textContent='Sky B removed';
    const undo=document.createElement('button');
    undo.type='button';
    undo.className='sky-slot-undo-button';
    undo.textContent='Undo';
    undo.addEventListener('click',event=>{
      event.preventDefault();event.stopPropagation();restoreSkyB(raw);
    });
    toast.append(message,undo);
    document.body.appendChild(toast);
    undoTimer=window.setTimeout(dismissUndo,6000);
  }
  function bindRemoveUndo(remove){
    if(remove.dataset.cardUndoBound==='true')return;
    remove.dataset.cardUndoBound='true';
    remove.addEventListener('click',()=>{
      const snapshot=storedSkyBRaw();
      if(!snapshot)return;
      setTimeout(()=>{
        if(!hasStoredSkyB())showUndo(snapshot);
      },0);
    },true);
  }
  function styleRemove(){
    const remove=document.querySelector('#skyFoundationB > .sky-foundation-heading [data-remove-sky-b]');
    if(!remove)return;
    bindRemoveUndo(remove);
    if(remove.dataset.cardIconified==='close')return;
    remove.dataset.cardIconified='close';
    remove.classList.add('sky-slot-card-control','sky-slot-card-control--remove');
    remove.setAttribute('aria-label','Remove Sky B');
    remove.title='Remove Sky B';
    remove.replaceChildren(icon('close'));
  }

  function suppressInternalAdd(){
    const add=document.querySelector('#skyFoundationComparison > .sky-foundation-heading [data-add-sky-b]');
    if(add){
      add.classList.add('sky-slot-internal-add');
      add.setAttribute('aria-hidden','true');
      add.tabIndex=-1;
    }
  }

  // Keep slot identity canonical: when A is removed while B still exists,
  // the remaining sky becomes A and comparison mode collapses to standalone.
  function promoteSkyBToA(){
    if(promoting)return false;
    let rawB=null,activeA=null;
    try{
      activeA=localStorage.getItem(SKY_A_KEY);
      rawB=localStorage.getItem(SKY_B_KEY);
    }catch(_){return false}
    if(activeA||!rawB)return false;

    promoting=true;
    let promoted=null;
    try{
      localStorage.setItem(SKY_A_KEY,rawB);
      try{promoted=JSON.parse(rawB)}catch(_){}
      const ageB=localStorage.getItem(LIVE_AGE_KEYS.B);
      if(ageB===null)localStorage.removeItem(LIVE_AGE_KEYS.A);
      else localStorage.setItem(LIVE_AGE_KEYS.A,ageB);
      localStorage.removeItem(LIVE_AGE_KEYS.B);
    }catch(_){promoting=false;return false}

    dispatchSkyAStorage(rawB);
    removeSkyB();
    window.dispatchEvent(new CustomEvent('relphi:sky-b-promoted-to-a',{detail:{from:'B',to:'A'}}));

    // The original A-removal handler may still finish by syncing A with null.
    // Reassert the promoted payload on the next frame after that handler returns.
    requestAnimationFrame(()=>{
      try{window.RelphiSkyCardShell?.sync?.('A',promoted)}catch(_){}
      dispatchSkyAStorage(rawB);
      const name=String(promoted?.name||promoted?.displayName||promoted?.skyName||promoted?.title||'Where and When');
      window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot:'A',name,source:'promote-sky-b'}}));
      promoting=false;
      schedule();
    });
    return true;
  }

  function sync(){
    queued=false;
    suppressInternalAdd();
    document.querySelectorAll('#skyFoundationA > .sky-foundation-heading [data-card-add-sky-b]').forEach(node=>node.remove());
    ensureRemoveControl();
    styleRemove();
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(sync)}
  function handleStorage(event){
    if(event?.key===SKY_A_KEY){
      let hasA=false;
      try{hasA=!!localStorage.getItem(SKY_A_KEY)}catch(_){}
      if(!hasA&&storedSkyBRaw())promoteSkyBToA();
    }
    schedule();
  }
  function start(){
    sync();
    const root=document.getElementById('skyFoundationRoot')||document.body;
    new MutationObserver(schedule).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
    new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-sky-b-present','data-sky-b-editing','data-sky-last-mode']});
    window.addEventListener('storage',handleStorage);
    window.addEventListener('relphi:sky-foundation-ready',schedule);
    window.addEventListener('relphi:sky-session-recovered',schedule);
    window.addEventListener('relphi:sky-where-when-edit-state-changed',event=>{
      const slots=Array.isArray(event.detail?.slots)?event.detail.slots:[];
      if(slots.includes('B')||hasStoredSkyB()||document.documentElement.dataset.skyBEditing!=='true')return schedule();
      delete document.documentElement.dataset.skyBEditing;
      const startup=window.RelphiSkyStartupMode;
      startup?.writeMode?.('single');
      startup?.syncRoot?.();
      document.documentElement.dataset.skyLastMode='single';
      document.documentElement.dataset.skyBPresent='false';
      schedule();
    });
  }
  window.RelphiSkySlotControls=Object.freeze({
    addSkyB:startAddSkyB,
    removeSkyB,
    promoteSkyBToA,
    hasSkyB:skyBPresent,
    hasStoredSkyB
  });
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
