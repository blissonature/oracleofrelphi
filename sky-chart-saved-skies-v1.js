// Compact saved-sky library: the sky-name dropdown owns loading, naming, working-copy identity, and saving.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkySavedSkiesV2)return;
  window.__relphiSkySavedSkiesV2=true;
  window.__relphiSkySavedSkiesV1=true;

  const LIBRARY_KEY='relphiSkyLibraryV1';
  const SLOT_KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const GENERIC_NAMES=new Set(['','current sky','sky a','sky b','standalone sky','comparison','unnamed sky','untitled sky']);
  let openSlot=null,queued=false,popover=null,observer=null;
  let deletePendingRef='';

  const normalize=value=>String(value||'').trim().toLowerCase().replace(/\s+/g,' ');
  const clone=value=>JSON.parse(JSON.stringify(value));

  function readJson(key,fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch(_){return fallback}}
  function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch(_){return false}}
  function payload(slot){return readJson(SLOT_KEYS[slot],null)}
  function placementSource(value){
    if(!value||typeof value!=='object')return{};
    const source=[value.placements,value.positions,value.points,value.bodies].find(candidate=>candidate&&typeof candidate==='object'&&!Array.isArray(candidate))||value;
    return Object.fromEntries(Object.entries(source).filter(([key,item])=>item&&typeof item==='object'&&!Array.isArray(item)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key)&&(Number.isFinite(Number(item.longitude))||item.sign||item.zodiac)));
  }
  function hasPlacements(value){return Object.keys(placementSource(value)).length>0}
  function library(){const list=readJson(LIBRARY_KEY,[]);return Array.isArray(list)?list.filter(record=>record&&String(record.name||'').trim()&&hasPlacements(record)):[]}
  function writeLibrary(list){return writeJson(LIBRARY_KEY,list)}
  function recordRef(record){return String(record?.id||record?.savedSkyId||record?.metadata?.savedSkyId||`legacy:${normalize(record?.name)}`)}
  function newId(){return `sky-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}

  function longitude(item){
    if(Number.isFinite(Number(item?.longitude)))return ((Number(item.longitude)%360)+360)%360;
    const signs=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
    const sign=signs.indexOf(String(item?.sign||item?.zodiac||'').trim().toLowerCase());
    if(sign<0)return NaN;
    return sign*30+Number(item.degree??item.degrees??0)+Number(item.minute??item.minutes??0)/60+Number(item.second??item.seconds??0)/3600;
  }
  function placementSignature(value){
    return JSON.stringify(Object.entries(placementSource(value)).map(([key,item])=>{
      const lon=longitude(item);
      return [normalize(item?.name||item?.label||key),Number.isFinite(lon)?Number(lon.toFixed(6)):null,!!item?.retrograde];
    }).sort((a,b)=>a[0].localeCompare(b[0])));
  }
  function skySignature(value){
    const profile=value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{};
    return JSON.stringify({
      placements:placementSignature(value),
      dateTime:profile.dateTime||value?.dateTime||'',
      instant:profile.instant||value?.instant||'',
      latitude:String(profile.latitude??value?.latitude??''),
      longitude:String(profile.longitude??value?.longitude??''),
      timeZone:String(profile.timeZone??value?.timeZone??''),
      location:String(profile.location??value?.location??''),
      houseSystem:String(profile.houseSystem??value?.houseSystem??'')
    });
  }

  function explicitRecord(value,records){
    const metadata=value?.metadata&&typeof value.metadata==='object'?value.metadata:{};
    const id=String(metadata.savedSkyId||'');
    if(id){const hit=records.find(record=>recordRef(record)===id||String(record.id||'')===id);if(hit)return hit}
    const savedName=normalize(metadata.savedSkyName);
    if(savedName){const hit=records.find(record=>normalize(record.name)===savedName);if(hit)return hit}
    return null;
  }
  function matchingRecord(value,records){
    // A working sky belongs to Saved skies only when it carries an explicit
    // saved-sky identity. Never silently reattach an unsaved working copy by
    // matching its placements or date/time to a library record.
    if(!value||!hasPlacements(value))return null;
    return explicitRecord(value,records);
  }
  function isDirty(value,record){return!!record&&skySignature(value)!==skySignature(record)}
  function isNearNow(value){
    const profile=value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{};
    const raw=profile.instant||profile.dateTime||value?.instant||value?.dateTime;
    if(!raw)return false;
    const date=new Date(raw);return!Number.isNaN(date.getTime())&&Math.abs(Date.now()-date.getTime())<10*60*1000;
  }
  function candidateName(value){
    for(const candidate of [value?.name,value?.displayName,value?.skyName,value?.title]){
      const name=String(candidate||'').trim();
      if(!GENERIC_NAMES.has(normalize(name))&&normalize(name)!=='now')return name;
    }
    return '';
  }
  function identity(slot){
    const value=payload(slot),records=library(),record=matchingRecord(value,records);
    if(record)return{name:String(record.name).trim(),record,dirty:isDirty(value,record),saved:true};
    const custom=candidateName(value);
    if(custom)return{name:custom,record:null,dirty:false,saved:false};
    if(isNearNow(value))return{name:'Now',record:null,dirty:false,saved:false};
    return{name:'Unsaved sky',record:null,dirty:false,saved:false};
  }

  function applyNamedIdentity(value,name,id){
    const next=clone(value||{});
    next.name=name;next.title=name;next.displayName=name;next.skyName=name;
    next.metadata=next.metadata&&typeof next.metadata==='object'?next.metadata:{};
    next.metadata.savedSkyId=id;next.metadata.savedSkyName=name;next.metadata.savedSkyLoadedAt=new Date().toISOString();
    next.metadata.name=name;next.metadata.title=name;
    next.calcProfile=next.calcProfile&&typeof next.calcProfile==='object'?next.calcProfile:{};
    next.calcProfile.name=name;next.calcProfile.title=name;
    return next;
  }
  function applyWorkingIdentity(value,name){
    const next=clone(value||{}),clean=String(name||'').trim()||'Unsaved sky';
    next.name=clean;next.title=clean;next.displayName=clean;next.skyName=clean;
    next.metadata=next.metadata&&typeof next.metadata==='object'?next.metadata:{};
    delete next.metadata.savedSkyId;delete next.metadata.savedSkyName;delete next.metadata.savedSkyLoadedAt;
    next.metadata.name=clean;next.metadata.title=clean;
    next.calcProfile=next.calcProfile&&typeof next.calcProfile==='object'?next.calcProfile:{};
    next.calcProfile.name=clean;next.calcProfile.title=clean;
    return next;
  }
  function recordFrom(value,name,id,previous){
    const next=applyNamedIdentity(value,name,id);
    next.id=id;
    next.savedAt=previous?.savedAt||next.savedAt||new Date().toISOString();
    next.updatedAt=new Date().toISOString();
    return next;
  }

  function dispatchStorage(slot){
    const key=SLOT_KEYS[slot];
    try{window.dispatchEvent(new StorageEvent('storage',{key,newValue:localStorage.getItem(key),storageArea:localStorage}))}
    catch(_){const event=new Event('storage');Object.defineProperty(event,'key',{value:key});window.dispatchEvent(event)}
    window.dispatchEvent(new CustomEvent('relphi:saved-sky-active-changed',{detail:{slot}}));
  }
  function saveActive(slot,name,overwriteRecord=null){
    const value=payload(slot);if(!value||!hasPlacements(value))return{ok:false,message:'There is no sky to save.'};
    const clean=String(name||'').trim();if(!clean)return{ok:false,message:'Give this sky a name.'};
    const records=library();
    const duplicate=records.find(record=>normalize(record.name)===normalize(clean)&&(!overwriteRecord||recordRef(record)!==recordRef(overwriteRecord)));
    if(duplicate)return{ok:false,message:'That name is already in Saved skies.'};
    const previous=overwriteRecord||null;
    const id=previous?recordRef(previous):newId();
    const nextRecord=recordFrom(value,clean,id,previous);
    const index=previous?records.findIndex(record=>recordRef(record)===recordRef(previous)):-1;
    if(index>=0)records[index]=nextRecord;else records.push(nextRecord);
    if(!writeLibrary(records))return{ok:false,message:'Saved skies could not be written.'};
    const active=applyNamedIdentity(value,clean,id);
    writeJson(SLOT_KEYS[slot],active);dispatchStorage(slot);
    window.dispatchEvent(new CustomEvent('relphi:saved-sky-library-changed',{detail:{slot,name:clean,id,action:index>=0?'update':'create'}}));
    window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot,name:clean,source:'saved-skies-dropdown'}}));
    return{ok:true,message:index>=0?'Saved sky updated.':'Sky saved.'};
  }
  function applyIdentityChoice(slot,name,save){
    const value=payload(slot);if(!value||!hasPlacements(value))return{ok:false,message:'There is no sky to update.'};
    const active=identity(slot),clean=String(name||'').trim();
    if(save)return saveActive(slot,clean,active.record||null);
    const working=applyWorkingIdentity(value,clean);
    if(!writeJson(SLOT_KEYS[slot],working))return{ok:false,message:'The working sky could not be renamed.'};
    dispatchStorage(slot);
    window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot,name:working.name,source:'saved-skies-working-copy'}}));
    return{ok:true,message:active.record?'Working copy updated. Saved sky unchanged.':'Working sky updated.'};
  }
  function closeWhereWhenEditors(){
    // Loading a saved record replaces the working sky. Release every live or
    // stale Where and When transaction first, because foundation rendering is
    // globally paused while any editor owns the transaction lock.
    const transaction=window.RelphiSkyWhereWhenTransaction,slots=new Set();
    try{(transaction?.slots?.()||[]).forEach(slot=>{if(SLOT_KEYS[slot])slots.add(slot)})}catch(_){}
    document.querySelectorAll('.sky-where-when-editor[data-slot]').forEach(form=>{if(SLOT_KEYS[form.dataset.slot])slots.add(form.dataset.slot)});
    slots.forEach(slot=>{
      try{transaction?.cancel?.(slot)}catch(_){}
      try{window.RelphiSkyCardShell?.setEditorExpanded?.(slot,false)}catch(_){}
      document.querySelectorAll(`.sky-where-when-editor[data-slot="${slot}"]`).forEach(form=>form.remove());
    });
    try{
      if(transaction?.active?.()===false){
        document.documentElement.dataset.skyWhereWhenEditing='false';
        document.documentElement.dataset.skyWhereWhenEditingSlots='';
      }
    }catch(_){}
  }
  function loadRecord(slot,record){
    // Loading replaces the working sky. Close any stale Where and When draft
    // first so the committed saved sky is allowed to rebuild the chart.
    closeWhereWhenEditors();
    const id=recordRef(record),active=applyNamedIdentity(record,String(record.name||'Saved sky').trim(),id);
    delete active.savedAt;delete active.updatedAt;
    if(!writeJson(SLOT_KEYS[slot],active))return false;
    if(slot==='B'){try{localStorage.setItem('relphiSkyChartLastModeV1','comparison')}catch(_){}document.documentElement.dataset.skyLastMode='comparison'}
    dispatchStorage(slot);
    window.dispatchEvent(new CustomEvent('relphi:saved-sky-loaded',{detail:{slot,id,name:String(record.name||'Saved sky').trim()}}));
    return true;
  }
  function deleteRecord(ref){
    const records=library(),index=records.findIndex(record=>recordRef(record)===String(ref||''));
    if(index<0)return false;
    const [removed]=records.splice(index,1);
    if(!writeLibrary(records))return false;
    ['A','B'].forEach(slot=>{
      const value=payload(slot),active=explicitRecord(value,[removed]);
      if(!active)return;
      const next=clone(value);
      next.metadata=next.metadata&&typeof next.metadata==='object'?next.metadata:{};
      delete next.metadata.savedSkyId;delete next.metadata.savedSkyName;delete next.metadata.savedSkyLoadedAt;
      writeJson(SLOT_KEYS[slot],next);dispatchStorage(slot);
    });
    window.dispatchEvent(new CustomEvent('relphi:saved-sky-library-changed',{detail:{name:String(removed?.name||''),id:recordRef(removed),action:'delete'}}));
    return true;
  }

  function shortMeta(record){
    const profile=record?.calcProfile&&typeof record.calcProfile==='object'?record.calcProfile:{};
    const date=String(profile.dateTime||record?.dateTime||'').slice(0,10);
    const location=String(profile.location||record?.location||'').trim();
    return [date,location].filter(Boolean).join(' · ');
  }
  function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}

  function ensurePopover(){
    if(popover?.isConnected)return popover;
    popover=document.createElement('div');
    popover.id='skySavedSkiesPopover';popover.className='sky-saved-skies-popover';popover.hidden=true;
    popover.setAttribute('role','dialog');popover.setAttribute('aria-label','Saved skies');
    document.body.appendChild(popover);return popover;
  }
  function renderPopover(){
    const menu=ensurePopover();if(!openSlot)return;
    const records=library(),active=identity(openSlot),activeRef=active.record?recordRef(active.record):'';
    const items=records.length?records.map(record=>{
      const ref=recordRef(record),meta=shortMeta(record),current=ref===activeRef,name=String(record.name||'Saved sky'),confirming=ref===deletePendingRef;
      const confirmation=confirming?`<div class="sky-saved-delete-confirmation" role="group" aria-label="Delete ${escapeHtml(name)}?"><span>Delete this saved sky?</span><button type="button" data-saved-delete-cancel>Cancel</button><button type="button" class="is-danger" data-saved-delete-confirm="${escapeHtml(ref)}">Delete</button></div>`:'';
      return `<div class="sky-saved-list-row${current?' is-active':''}${confirming?' is-confirming-delete':''}"><button type="button" class="sky-saved-list-item" data-saved-sky-ref="${escapeHtml(ref)}" aria-label="Load ${escapeHtml(name)} into Sky ${openSlot}"><span class="sky-saved-list-name">${escapeHtml(name)}</span>${meta?`<span class="sky-saved-list-meta">${escapeHtml(meta)}</span>`:''}<span class="sky-saved-list-check" aria-hidden="true">${current?'✓':''}</span></button><button type="button" class="sky-saved-list-delete" data-saved-delete-ref="${escapeHtml(ref)}" aria-label="Delete ${escapeHtml(name)} from Saved skies" title="Delete from Saved skies">×</button>${confirmation}</div>`;
    }).join(''):'<p class="sky-saved-empty">No saved skies yet.</p>';
    const status=active.saved?(active.dirty?'Unsaved changes':'Saved'):'Not saved';
    const saveLabel=active.saved?`Update “${escapeHtml(active.record?.name||active.name)}” in Saved skies`:'Save to Saved skies';
    const saveHelp=active.saved?'Unchecked keeps this as a working copy; the saved sky will not change.':'Unchecked keeps this sky on the chart without adding it to Saved skies.';
    menu.innerHTML=`<div class="sky-saved-popover-head"><strong>Saved skies</strong><button type="button" data-saved-close aria-label="Close saved skies">×</button></div><div class="sky-saved-list">${items}</div><div class="sky-saved-popover-foot"><div class="sky-saved-active-status"><span>${escapeHtml(active.name)}</span><small>${status}</small></div><form class="sky-saved-identity-form" data-saved-identity-form><label class="sky-saved-identity-name"><span>Sky name</span><input type="text" maxlength="80" autocomplete="off" data-saved-identity-name value="${escapeHtml(active.name==='Unsaved sky'?'':active.name)}" placeholder="Optional"></label><div class="sky-saved-identity-save-stack"><label class="sky-saved-identity-save-choice"><input type="checkbox" data-saved-identity-save><span>${saveLabel}</span></label><small>${saveHelp}</small></div><div class="sky-saved-identity-actions"><button type="submit">Apply</button></div><p data-saved-form-status aria-live="polite"></p></form></div>`;
    positionPopover();
  }
  function triggerFor(slot){
    // The visible title lives in .sky-card-title-stable; foundation also keeps a
    // hidden owned name node. Always prefer the stable, visible trigger.
    return document.querySelector(`#skyFoundation${slot}>.sky-foundation-heading>.sky-card-title-stable [data-saved-sky-trigger]`)||
      document.querySelector(`#skyFoundation${slot}>.sky-foundation-heading [data-saved-sky-trigger]`);
  }
  function positionPopover(){
    if(!openSlot||!popover||popover.hidden)return;
    const trigger=triggerFor(openSlot);if(!trigger)return;
    const rect=trigger.getBoundingClientRect(),margin=12,gap=6,width=Math.min(440,window.innerWidth-margin*2);
    const left=Math.max(margin,Math.min(rect.left,window.innerWidth-width-margin));
    const below=window.innerHeight-rect.bottom-margin-gap,above=rect.top-margin-gap;
    const openAbove=below<280&&above>below;
    const maxHeight=Math.min(520,Math.max(230,openAbove?above:below));
    Object.assign(popover.style,{width:`${width}px`,maxHeight:`${maxHeight}px`,left:`${left}px`,top:openAbove?'auto':`${rect.bottom+gap}px`,bottom:openAbove?`${window.innerHeight-rect.top+gap}px`:'auto'});
  }
  function open(slot){
    openSlot=slot;deletePendingRef='';
    const menu=ensurePopover();menu.hidden=false;renderPopover();triggerFor(slot)?.setAttribute('aria-expanded','true');
  }
  function close(){
    if(!popover)return;triggerFor(openSlot)?.setAttribute('aria-expanded','false');popover.hidden=true;popover.removeAttribute('style');openSlot=null;deletePendingRef='';
  }

  function renderIdentity(slot){
    const panel=document.getElementById(`skyFoundation${slot}`),container=panel?.querySelector(':scope > .sky-foundation-heading > .sky-foundation-name');
    if(!container)return;
    const state=identity(slot);let button=container.querySelector('[data-saved-sky-trigger]');
    if(!button){
      container.replaceChildren();button=document.createElement('button');button.type='button';button.className='sky-saved-name-trigger';button.dataset.savedSkyTrigger=slot;button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
      const label=document.createElement('span');label.className='sky-saved-name-label';const chevron=document.createElement('span');chevron.className='sky-saved-name-chevron';chevron.setAttribute('aria-hidden','true');button.append(label,chevron);container.appendChild(button);
    }
    const label=button.querySelector('.sky-saved-name-label');if(label&&label.textContent!==state.name)label.textContent=state.name;
    button.title=state.saved?(state.dirty?`${state.name} · unsaved changes`:state.name):`${state.name} · open Saved skies`;
    button.classList.toggle('is-saved',state.saved);button.classList.toggle('is-dirty',state.dirty);
    button.setAttribute('aria-label',`${state.name}. Open Saved skies for Sky ${slot}.`);
  }
  function sync(){
    queued=false;
    renderIdentity('A');
    renderIdentity('B');
    // Keep the open popover DOM stable. Chart/foundation mutations can happen
    // repeatedly while a finger is down on mobile; replacing innerHTML during
    // that gesture cancels the synthesized click. Explicit Saved Skies actions
    // render the popover themselves, so background sync only repositions it.
    if(openSlot)positionPopover();
  }
  function refreshOpenPopover(){
    if(openSlot&&!popover?.hidden)renderPopover();
    else if(openSlot)positionPopover();
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(sync)}

  document.addEventListener('click',event=>{
    const trigger=event.target.closest?.('[data-saved-sky-trigger]');
    if(trigger){event.preventDefault();event.stopPropagation();const slot=trigger.dataset.savedSkyTrigger;if(openSlot===slot&&!popover?.hidden)close();else open(slot);return}
    if(event.target.closest?.('[data-saved-close]')){close();return}
    const deleteButton=event.target.closest?.('[data-saved-delete-ref]');
    const deleteConfirm=event.target.closest?.('[data-saved-delete-confirm]');
    if(deleteConfirm&&openSlot){
      event.preventDefault();event.stopPropagation();
      const ref=deleteConfirm.dataset.savedDeleteConfirm;
      deletePendingRef='';
      if(deleteRecord(ref)){renderPopover();schedule()}
      return;
    }
    if(event.target.closest?.('[data-saved-delete-cancel]')&&openSlot){
      event.preventDefault();event.stopPropagation();deletePendingRef='';renderPopover();return;
    }
    if(deleteButton&&openSlot){
      event.preventDefault();event.stopPropagation();
      const ref=deleteButton.dataset.savedDeleteRef,record=library().find(entry=>recordRef(entry)===ref);
      if(!record)return;
      deletePendingRef=ref;renderPopover();return;
    }
    const item=event.target.closest?.('[data-saved-sky-ref]');
    if(item&&openSlot){event.preventDefault();event.stopPropagation();deletePendingRef='';const record=library().find(entry=>recordRef(entry)===item.dataset.savedSkyRef);if(record&&loadRecord(openSlot,record)){close();schedule()}return}
  },true);

  document.addEventListener('submit',event=>{
    const form=event.target.closest?.('[data-saved-identity-form]');if(!form||!openSlot)return;
    event.preventDefault();event.stopPropagation();
    const input=form.querySelector('[data-saved-identity-name]'),status=form.querySelector('[data-saved-form-status]'),save=!!form.querySelector('[data-saved-identity-save]')?.checked;
    const result=applyIdentityChoice(openSlot,input?.value||'',save);
    if(status)status.textContent=result.message;
    if(result.ok){renderPopover();schedule()}
    else input?.focus({preventScroll:true});
  });

  document.addEventListener('pointerdown',event=>{
    if(!openSlot||popover?.hidden)return;
    if(popover.contains(event.target)||triggerFor(openSlot)?.contains(event.target))return;
    close();
  },true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&openSlot){const trigger=triggerFor(openSlot);close();trigger?.focus()}});
  window.addEventListener('resize',positionPopover,{passive:true});
  window.visualViewport?.addEventListener('resize',positionPopover,{passive:true});
  window.visualViewport?.addEventListener('scroll',positionPopover,{passive:true});
  window.addEventListener('scroll',positionPopover,{passive:true,capture:true});
  window.addEventListener('storage',event=>{
    if(!event.key||event.key===LIBRARY_KEY||Object.values(SLOT_KEYS).includes(event.key))schedule();
    if(event.key===LIBRARY_KEY)refreshOpenPopover();
  });
  ['relphi:sky-foundation-ready','relphi:sky-name-updated'].forEach(name=>window.addEventListener(name,schedule));
  window.addEventListener('relphi:saved-sky-library-changed',()=>{
    schedule();
    refreshOpenPopover();
  });

  function start(){
    ensurePopover();schedule();
    const root=document.getElementById('skyFoundationRoot')||document.body;
    observer=new MutationObserver(records=>{if(records.every(record=>record.target?.closest?.('.sky-saved-skies-popover')))return;schedule()});
    observer.observe(root,{childList:true,subtree:true});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();