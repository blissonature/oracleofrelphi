// Compact sky command menu: the title chevron is the only open/close affordance.
// Sky title rendering belongs to sky-chart-sky-card-title-integrity; this module owns menu behavior and saved-sky state only.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkySavedSkiesV6)return;
  window.__relphiSkySavedSkiesV6=true;
  window.__relphiSkySavedSkiesV5=true;
  window.__relphiSkySavedSkiesV4=true;
  window.__relphiSkySavedSkiesV3=true;
  window.__relphiSkySavedSkiesV2=true;
  window.__relphiSkySavedSkiesV1=true;

  const LIBRARY_KEY='relphiSkyLibraryV1';
  const SLOT_KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const GENERIC_NAMES=new Set(['','current sky','sky a','sky b','standalone sky','comparison','unnamed sky','untitled sky','new sky','where and when']);
  let openSlot=null,queued=false,popover=null;
  let deletePendingRef='',menuView='load',libraryQuery='',groupFilter='All',libraryView='saved',entityFilter='',entityDeletePending='';

  const normalize=value=>String(value||'').trim().toLowerCase().replace(/\s+/g,' ');
  const clone=value=>JSON.parse(JSON.stringify(value));

  function readJson(key,fallback){try{const raw=window.RelphiSkyWorkingStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch(_){return fallback}}
  function writeJson(key,value){try{window.RelphiSkyWorkingStorage.setItem(key,JSON.stringify(value));return true}catch(_){return false}}
  function payload(slot){return readJson(SLOT_KEYS[slot],null)}
  function placementSource(value){
    if(!value||typeof value!=='object')return{};
    const source=[value.placements,value.positions,value.points,value.bodies].find(candidate=>candidate&&typeof candidate==='object'&&!Array.isArray(candidate))||value;
    return Object.fromEntries(Object.entries(source).filter(([key,item])=>item&&typeof item==='object'&&!Array.isArray(item)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key)&&(Number.isFinite(Number(item.longitude))||item.sign||item.zodiac)));
  }
  function hasPlacements(value){return Object.keys(placementSource(value)).length>0}
  function library(){const list=readJson(LIBRARY_KEY,[]);return Array.isArray(list)?list.filter(record=>record&&String(record.name||'').trim()&&hasPlacements(record)):[]}
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
  function canonicalCoordinate(value){const n=Number(value);return Number.isFinite(n)?Number(n.toFixed(6)):null}
  function canonicalInstant(value){
    const profile=value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{};
    const direct=String(profile.instant||value?.instant||'').trim();
    if(direct){const ms=Date.parse(direct);if(Number.isFinite(ms))return new Date(ms).toISOString()}
    const raw=String(profile.dateTime||value?.dateTime||'').trim(),zone=String(profile.timeZone||value?.timeZone||'').trim();
    if(raw&&zone&&window.luxon?.DateTime){try{const dt=window.luxon.DateTime.fromISO(raw,{zone,setZone:true});if(dt?.isValid)return dt.toUTC().toISO()}catch(_){}}
    return raw;
  }
  function skySettingsSignature(value){
    const profile=value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{};
    return JSON.stringify({
      instant:canonicalInstant(value),
      latitude:canonicalCoordinate(profile.latitude??value?.latitude),
      longitude:canonicalCoordinate(profile.longitude??value?.longitude),
      timeZone:normalize(profile.timeZone??value?.timeZone??''),
      timeUnknown:profile.timeUnknown===true
    });
  }
  function skySignature(value){return JSON.stringify({settings:skySettingsSignature(value),placements:placementSignature(value)})}

  function explicitRecord(value,records){
    const metadata=value?.metadata&&typeof value.metadata==='object'?value.metadata:{};
    const id=String(metadata.savedSkyId||'');
    if(id){const hit=records.find(record=>recordRef(record)===id||String(record.id||'')===id);if(hit)return hit}
    const savedName=normalize(metadata.savedSkyName);
    if(savedName){const hit=records.find(record=>normalize(record.name)===savedName);if(hit)return hit}
    return null;
  }
  function matchingRecord(value,records){
    if(!value||!hasPlacements(value))return null;
    const explicit=explicitRecord(value,records);if(explicit)return explicit;
    const signature=skySettingsSignature(value);
    return records.find(record=>skySettingsSignature(record)===signature)||null;
  }
  function isDirty(value,record){return!!record&&skySettingsSignature(value)!==skySettingsSignature(record)}
  function isNearNow(value){
    const profile=value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{};
    const raw=profile.instant||profile.dateTime||value?.instant||value?.dateTime;if(!raw)return false;
    const date=new Date(raw);return!Number.isNaN(date.getTime())&&Math.abs(Date.now()-date.getTime())<10*60*1000;
  }
  function candidateName(value){
    for(const candidate of [value?.name,value?.displayName,value?.skyName,value?.title]){
      const name=String(candidate||'').trim();if(!GENERIC_NAMES.has(normalize(name))&&normalize(name)!=='now')return name;
    }
    return '';
  }
  function identity(slot){
    const value=payload(slot),records=library(),record=matchingRecord(value,records);
    if(record)return{name:String(record.name).trim(),record,dirty:isDirty(value,record),saved:true,matchedBySettings:!explicitRecord(value,records)};
    const custom=candidateName(value);if(custom)return{name:custom,record:null,dirty:false,saved:false};
    if(isNearNow(value))return{name:'Now',record:null,dirty:false,saved:false};
    return{name:'Where and When',record:null,dirty:false,saved:false};
  }

  function applyNamedIdentity(value,name,id){
    const next=clone(value||{});next.name=name;next.title=name;next.displayName=name;next.skyName=name;
    next.metadata=next.metadata&&typeof next.metadata==='object'?next.metadata:{};
    next.metadata.savedSkyId=id;next.metadata.savedSkyName=name;next.metadata.savedSkyLoadedAt=new Date().toISOString();next.metadata.name=name;next.metadata.title=name;
    next.calcProfile=next.calcProfile&&typeof next.calcProfile==='object'?next.calcProfile:{};next.calcProfile.name=name;next.calcProfile.title=name;
    return next;
  }
  function applyWorkingIdentity(value,name){
    const next=clone(value||{}),clean=String(name||'').trim()||'Where and When';next.name=clean;next.title=clean;next.displayName=clean;next.skyName=clean;
    next.metadata=next.metadata&&typeof next.metadata==='object'?next.metadata:{};
    delete next.metadata.savedSkyId;delete next.metadata.savedSkyName;delete next.metadata.savedSkyLoadedAt;next.metadata.name=clean;next.metadata.title=clean;
    next.calcProfile=next.calcProfile&&typeof next.calcProfile==='object'?next.calcProfile:{};next.calcProfile.name=clean;next.calcProfile.title=clean;
    return next;
  }

  function dispatchStorage(slot){
    const key=SLOT_KEYS[slot];
    try{window.dispatchEvent(new StorageEvent('storage',{key,newValue:window.RelphiSkyWorkingStorage.getItem(key),storageArea:localStorage}))}
    catch(_){const event=new Event('storage');Object.defineProperty(event,'key',{value:key});window.dispatchEvent(event)}
    window.dispatchEvent(new CustomEvent('relphi:saved-sky-active-changed',{detail:{slot}}));
  }
  function saveActive(slot,name,overwriteRecord=null){
    const value=payload(slot);if(!value||!hasPlacements(value))return{ok:false,message:'There is no sky to save.'};
    const generated=window.RelphiSkySuggestedName?.format?.(value)||'';
    const clean=String(name||'').trim()||generated;
    const result=window.RelphiSkyLibraryRecords?.saveSky?.({sky:value,name:clean,defaultName:generated,updateId:overwriteRecord?recordRef(overwriteRecord):undefined});
    if(result?.duplicate)return{ok:false,duplicate:result.duplicate,message:'An identical saved sky already exists. Open Sky Library to review its associations.'};
    if(!result?.ok)return result||{ok:false,message:'Sky Library is unavailable.'};
    window.RelphiSkyWorkingStorage?.releaseRecovery?.(value);
    const active=clone(result.record);delete active.savedAt;delete active.updatedAt;
    writeJson(SLOT_KEYS[slot],active);dispatchStorage(slot);
    window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot,name:clean,source:'saved-skies'}}));
    return{ok:true,message:'Sky saved.'};
  }

  function applyIdentityChoice(slot,name,save){
    const value=payload(slot);if(!value||!hasPlacements(value))return{ok:false,message:'There is no sky to update.'};
    const active=identity(slot),clean=String(name||'').trim();if(save)return saveActive(slot,clean,active.record||null);
    const working=applyWorkingIdentity(value,clean);if(!writeJson(SLOT_KEYS[slot],working))return{ok:false,message:'The working sky could not be renamed.'};
    dispatchStorage(slot);window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot,name:working.name,source:'saved-skies-working-copy'}}));
    return{ok:true,message:active.record?'Working copy updated. Saved sky unchanged.':'Working sky updated.'};
  }
  function closeWhereWhenEditor(slot){
    if(!SLOT_KEYS[slot])return;const transaction=window.RelphiSkyWhereWhenTransaction;
    try{transaction?.cancel?.(slot)}catch(_){}try{window.RelphiSkyCardShell?.setEditorExpanded?.(slot,false)}catch(_){}
    document.querySelectorAll(`.sky-where-when-editor[data-slot="${slot}"]`).forEach(form=>form.remove());
    try{if(transaction?.active?.()===false){document.documentElement.dataset.skyWhereWhenEditing='false';document.documentElement.dataset.skyWhereWhenEditingSlots=''}}catch(_){}
  }
  function closeWhereWhenEditors(){
    const transaction=window.RelphiSkyWhereWhenTransaction,slots=new Set();
    try{(transaction?.slots?.()||[]).forEach(slot=>{if(SLOT_KEYS[slot])slots.add(slot)})}catch(_){}
    document.querySelectorAll('.sky-where-when-editor[data-slot]').forEach(form=>{if(SLOT_KEYS[form.dataset.slot])slots.add(form.dataset.slot)});
    slots.forEach(slot=>{try{transaction?.cancel?.(slot)}catch(_){}try{window.RelphiSkyCardShell?.setEditorExpanded?.(slot,false)}catch(_){}document.querySelectorAll(`.sky-where-when-editor[data-slot="${slot}"]`).forEach(form=>form.remove())});
    try{if(transaction?.active?.()===false){document.documentElement.dataset.skyWhereWhenEditing='false';document.documentElement.dataset.skyWhereWhenEditingSlots=''}}catch(_){}
  }
  function loadRecord(slot,record){
    closeWhereWhenEditors();const previous=payload(slot),priorRaw=window.RelphiSkyWorkingStorage.getItem(SLOT_KEYS[slot]);const id=recordRef(record),active=applyNamedIdentity(record,String(record.name||'Saved sky').trim(),id);delete active.savedAt;delete active.updatedAt;
    if(!writeJson(SLOT_KEYS[slot],active))return false;
    if(slot==='B'){try{window.RelphiSkyWorkingStorage.setItem('relphiSkyChartLastModeV1','comparison')}catch(_){}document.documentElement.dataset.skyLastMode='comparison'}
    dispatchStorage(slot);window.dispatchEvent(new CustomEvent('relphi:saved-sky-loaded',{detail:{slot,id,name:String(record.name||'Saved sky').trim()}}));
    if(priorRaw&&hasPlacements(previous)&&String(previous?.metadata?.savedSkyId||'')!==id)window.RelphiSkySlotControls?.offerUndo?.(slot,priorRaw,'Sky '+slot+' loaded from Sky Library');
    return true;
  }
  function deleteRecord(ref){
    const result=window.RelphiSkyLibraryRecords?.deleteSky?.(ref);if(!result?.ok)return false;
    ['A','B'].forEach(slot=>{const value=payload(slot);if(String(value?.metadata?.savedSkyId||'')!==String(ref))return;
      newSky(slot);
    });
    return true;
  }

  function blankPayload(){return{name:'Where and When',title:'Where and When',displayName:'Where and When',skyName:'Where and When',saved:false,placements:{},metadata:{name:'Where and When',title:'Where and When'},calcProfile:{name:'Where and When',title:'Where and When'}}}
  function openBlankWhereWhen(slot){
    const value=payload(slot);window.RelphiSkyCardShell?.ensure?.(slot,value);window.RelphiSkyCardShell?.openDrawer?.(slot,'where');
    requestAnimationFrame(()=>requestAnimationFrame(()=>{if(document.querySelector(`#skyFoundation${slot} .sky-where-when-editor[data-slot="${slot}"]`))return;window.dispatchEvent(new CustomEvent('relphi:sky-drawer-opened',{detail:{slot,drawer:'where'}}))}));
  }
  function reportCleared(slot,action){window.dispatchEvent(new CustomEvent('relphi:sky-working-slot-cleared',{detail:{slot,action}}))}
  function newSky(slot){
    if(!SLOT_KEYS[slot])return false;closeWhereWhenEditor(slot);
    if(slot==='B'){
      try{window.RelphiSkyWorkingStorage.removeItem(SLOT_KEYS.B)}catch(_){return false}
      reportCleared('B','new');dispatchStorage('B');
      window.RelphiSkySlotControls?.addSkyB?.();
      window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot:'B',name:'Where and When',source:'new-sky'}}));
      schedule();return true;
    }
    if(!writeJson(SLOT_KEYS.A,blankPayload()))return false;reportCleared('A','new');dispatchStorage('A');window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot:'A',name:'Where and When',source:'new-sky'}}));openBlankWhereWhen('A');return true;
  }
  function removeSky(slot){
    if(!SLOT_KEYS[slot])return false;closeWhereWhenEditor(slot);
    if(slot==='B'){window.RelphiSkySlotControls?.removeSkyB?.();return true}
    try{window.RelphiSkyWorkingStorage.removeItem(SLOT_KEYS.A)}catch(_){return false}reportCleared('A','remove');dispatchStorage('A');window.RelphiSkyCardShell?.sync?.('A',null);window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot:'A',name:'Where and When',source:'remove-sky'}}));return true;
  }
  function addSkyB(){window.RelphiSkySlotControls?.addSkyB?.()}
  function shortMeta(record){const profile=record?.calcProfile&&typeof record.calcProfile==='object'?record.calcProfile:{},date=String(profile.dateTime||record?.dateTime||'').slice(0,10),location=String(profile.location||record?.location||'').trim();return[date,location].filter(Boolean).join(' · ')}
  function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}

  function ensurePopover(){
    if(popover?.isConnected)return popover;popover=document.createElement('div');popover.id='skySavedSkiesPopover';popover.className='sky-saved-skies-popover';popover.hidden=true;popover.setAttribute('role','dialog');popover.setAttribute('aria-label','Sky menu');document.body.appendChild(popover);return popover;
  }
  function applyLibraryFilter(){
    if(!popover)return;
    const needle=normalize(libraryQuery);
    let visible=0;
    popover.querySelectorAll('.sky-saved-list-row').forEach(row=>{
      const words=normalize(row.dataset.searchText),groups=String(row.dataset.skyGroups||'').split('|');
      const associated=String(row.dataset.entityIds||'').split('|');
      const show=(!needle||words.includes(needle))&&(groupFilter==='All'||groups.includes(groupFilter))&&(libraryView!=='saved'||!entityFilter||associated.includes(entityFilter));
      row.hidden=!show;if(show)visible++;
    });
    const count=popover.querySelector('[data-library-match-count]');if(count)count.textContent=visible+' matching skies';
    const empty=popover.querySelector('[data-library-no-results]');if(empty)empty.hidden=visible>0;
  }
  function renderPopover(){
    const menu=ensurePopover();if(!openSlot)return;
    const active=identity(openSlot),value=payload(openSlot),hasSky=hasPlacements(value),records=library();
    if(menuView==='load'){
      const activeRef=active.record?recordRef(active.record):'';
      const api=window.RelphiSkyLibraryRecords,people=api?.entities?.()||[],allGroups=api?.groups?.()||[];
      const sorted=libraryQuery.trim()?records:[...records].sort((a,b)=>Number(b?.metadata?.pinned===true)-Number(a?.metadata?.pinned===true));
      const items=sorted.length?sorted.map(record=>{
        const ref=recordRef(record),name=String(record.name||'Saved sky'),meta=shortMeta(record),current=ref===activeRef,confirming=ref===deletePendingRef;
        const own=(api?.links?.(record,'owner')||[]).map(id=>people.find(p=>p.id===id)?.name||'Unknown Entity');
        const associates=(api?.links?.(record,'associate')||[]).map(id=>people.find(p=>p.id===id)?.name||'Unknown Entity');
        const groups=api?.groupList?.(record)||[],pinned=record?.metadata?.pinned===true;
        const search=[name,meta,...own,...associates,...groups].join(' ');
        const linkedIds=[...(api?.links?.(record,'owner')||[]),...(api?.links?.(record,'associate')||[])];
        const lastEntities=people.filter(entity=>linkedIds.includes(entity.id)&&records.filter(other=>recordRef(other)!==ref).every(other=>![...(api?.links?.(other,'owner')||[]),...(api?.links?.(other,'associate')||[])].includes(entity.id)));
        const notice='Owners: '+(own.join(', ')||'None')+'; Associates: '+(associates.join(', ')||'None')+'; Groups: '+(groups.join(', ')||'None')+(lastEntities.length?'; Entities losing their last sky: '+lastEntities.map(e=>e.name).join(', '):'');
        const confirmation=confirming?'<div class="sky-saved-delete-confirmation" role="group"><span>Delete sky and remove its associations?<small>'+escapeHtml(notice)+'</small></span><button type="button" data-saved-delete-cancel>Cancel</button><button type="button" class="is-danger" data-saved-delete-confirm="'+escapeHtml(ref)+'">Delete</button></div>':'';
        return '<div class="sky-saved-list-row'+(current?' is-active':'')+'" data-search-text="'+escapeHtml(search)+'" data-sky-groups="'+escapeHtml(groups.join('|'))+'" data-entity-ids="'+escapeHtml(linkedIds.join('|'))+'"><button type="button" class="sky-saved-list-item" data-saved-sky-ref="'+escapeHtml(ref)+'" aria-label="Load '+escapeHtml(name)+' into Sky '+openSlot+'"><span class="sky-saved-list-name">'+escapeHtml(name)+'</span><span class="sky-saved-list-meta">'+escapeHtml(meta)+'</span></button><button type="button" data-library-pin-ref="'+escapeHtml(ref)+'" aria-pressed="'+String(pinned)+'" aria-label="'+(pinned?'Unpin':'Pin')+' '+escapeHtml(name)+'" title="'+(pinned?'Unpin':'Pin')+'">'+'📌'+'</button><button type="button" data-library-manage-ref="'+escapeHtml(ref)+'" title="Name, Entities and Groups" aria-label="Edit '+escapeHtml(name)+'">✎</button><button type="button" class="sky-saved-list-delete" data-saved-delete-ref="'+escapeHtml(ref)+'" aria-label="Delete '+escapeHtml(name)+'">×</button>'+confirmation+'</div>';
      }).join(''):'<p class="sky-saved-empty">No saved skies yet.</p>';
      const recoveryState=window.RelphiSkyWorkingStorage?.recovery?.()||{recent:[],eviction:[]};
      const recoveries=libraryView==='eviction'?recoveryState.eviction:recoveryState.recent;
      const recoveryItems=recoveries.map(item=>{
        const name=window.RelphiSkySuggestedName?.format?.(item.sky)||String(item.sky?.name||'Recovered Sky');
        const detail=String(item.sky?.calcProfile?.location||'')+' · Last used '+new Date(item.lastUsedAt).toLocaleDateString();
        const command=libraryView==='eviction'?'<button type="button" data-library-save-recovery="'+escapeHtml(item.id)+'">Save</button>':'<button type="button" data-library-load-recovery="'+escapeHtml(item.id)+'">Load</button>';
        return '<div class="sky-saved-list-row" data-search-text="'+escapeHtml(name+' '+detail)+'" data-sky-groups=""><span class="sky-saved-list-item"><span class="sky-saved-list-name">'+escapeHtml(name)+'</span><span class="sky-saved-list-meta">'+escapeHtml(detail)+'</span></span>'+command+'</div>';
      }).join('');
      const entityItems=people.map(entity=>{
        const related=records.filter(sky=>[...(api?.links?.(sky,'owner')||[]),...(api?.links?.(sky,'associate')||[])].includes(entity.id));
        const toDelete=related.filter(sky=>{const owners=api?.links?.(sky,'owner')||[];return owners.length===1&&owners[0]===entity.id&&['natal','mortal'].includes(String(sky?.metadata?.skyType||'').toLowerCase())});
        const notice=related.length+' associated '+(related.length===1?'sky':'skies')+'. '+(toDelete.length?toDelete.length+' solely owned Natal/Mortal '+(toDelete.length===1?'sky will':'skies will')+' also be deleted: '+toDelete.map(s=>s.name).join(', ')+'. ':'')+'Shared and other skies will remain, with this Entity detached.';
        const confirmation=entityDeletePending===entity.id?'<div class="sky-saved-delete-confirmation" role="group"><span>Delete Entity “'+escapeHtml(entity.name)+'”?<small>'+escapeHtml(notice)+'</small></span><button type="button" data-entity-delete-cancel>Cancel</button><button type="button" class="is-danger" data-entity-delete-confirm="'+escapeHtml(entity.id)+'">Delete Entity</button></div>':'';
        return '<div class="sky-saved-list-row" data-search-text="'+escapeHtml(entity.name+' '+related.map(s=>s.name).join(' '))+'"><button type="button" class="sky-saved-list-item" data-library-entity-ref="'+escapeHtml(entity.id)+'"><span class="sky-saved-list-name">'+escapeHtml(entity.name)+'</span><span class="sky-saved-list-meta">'+related.length+' associated '+(related.length===1?'sky':'skies')+'</span></button><button type="button" class="sky-saved-list-delete" data-entity-delete-ref="'+escapeHtml(entity.id)+'" aria-label="Delete Entity '+escapeHtml(entity.name)+'">×</button>'+confirmation+'</div>';
      }).join('');
      const displayed=libraryView==='saved'?items:libraryView==='entities'?entityItems:recoveryItems;
      const tabs=[['saved','Saved',records.length],['entities','Entities',people.length],['recovery','Recovery',recoveryState.recent.length],['eviction','Eviction',recoveryState.eviction.length]].map(([key,label,count])=>'<button type="button" data-library-view="'+key+'" aria-pressed="'+String(libraryView===key)+'">'+label+' ('+count+')</button>').join('');
      const selectedEntity=people.find(x=>x.id===entityFilter);
      const groupOptions=['All',...allGroups].map(name=>'<option value="'+escapeHtml(name)+'"'+(groupFilter===name?' selected':'')+'>'+escapeHtml(name)+'</option>').join('');
      menu.innerHTML='<div class="sky-library-browser-head"><strong>Sky Library</strong><span data-library-match-count></span><button type="button" data-library-close aria-label="Close Sky Library">×</button></div><div class="sky-library-tabs">'+tabs+'</div>'+(selectedEntity&&libraryView==='saved'?'<div class="sky-library-entity-filter">Associated with '+escapeHtml(selectedEntity.name)+' <button type="button" data-library-clear-entity>Clear</button></div>':'')<div class="sky-library-search-row"><input type="search" data-library-query aria-label="Search Sky Library" placeholder="Search name, date, location or Entity" value="'+escapeHtml(libraryQuery)+'"><select data-library-group aria-label="Filter by Group"'+(libraryView==='saved'?'':' hidden')+'>'+groupOptions+'</select></div><div class="sky-saved-list">'+displayed+'<p data-library-no-results hidden>No matching skies.</p></div>';
      applyLibraryFilter();
      window.RelphiSkyPrivateLoad?.redactNow?.();
      positionPopover();return;
    }
    if(menuView==='save'){
      const label=active.saved?'Save Changes':'Save Sky',name=active.saved?active.name:(window.RelphiSkySuggestedName?.preferred?.(value)||((active.name==='New Sky'||active.name==='Where and When'||active.name===`Sky ${openSlot}`||active.name==='Unsaved sky')?'':active.name));
      menu.innerHTML=`<div class="sky-saved-subview-head"><button type="button" class="sky-saved-back" data-sky-menu-back aria-label="Back">‹</button><strong>${label}</strong></div><form class="sky-saved-command-save" data-sky-command-save-form><label><span>Sky name</span><input type="text" maxlength="80" autocomplete="off" data-sky-command-save-name value="${escapeHtml(name)}" placeholder="Name this sky"></label><button type="submit">${label}</button><p data-sky-command-status aria-live="polite"></p></form>`;positionPopover();return;
    }
    const hasB=window.RelphiSkySlotControls?.hasStoredSkyB?.()===true,canAddB=openSlot==='A'&&!window.RelphiSkySlotControls?.hasSkyB?.(),newButton=hasSky?'<button type="button" class="sky-saved-command" data-sky-command="new"><span>New Sky</span></button>':'',saveButton=hasSky?`<button type="button" class="sky-saved-command" data-sky-command="save"><span>${active.saved?'Save Changes':'Save Sky'}</span></button>`:'',swapButton=hasB?'<button type="button" class="sky-saved-command" data-sky-command="swap"><span>Swap Sky A ↔ Sky B</span></button>':'',addB=canAddB?'<button type="button" class="sky-saved-command" data-sky-command="add-b"><span>Add Sky B</span></button>':'',removeButton=openSlot==='B'?'<button type="button" class="sky-saved-command is-danger" data-sky-command="remove"><span>Remove Sky</span></button>':'';
    menu.innerHTML=`<div class="sky-saved-command-list">${newButton}<button type="button" class="sky-saved-command" data-sky-command="load"><span>Load Sky</span></button>${saveButton}${swapButton}${addB}${removeButton}</div>`;positionPopover();
  }
  function triggerFor(slot){return document.querySelector(`#skyFoundation${slot} [data-sky-library-browse]`)||document.querySelector(`#skyFoundation${slot}>.sky-foundation-heading>.sky-card-title-stable [data-saved-sky-trigger]`)||document.querySelector(`#skyFoundation${slot}>.sky-foundation-heading [data-saved-sky-trigger]`)}
  function positionPopover(){
    if(!openSlot||!popover||popover.hidden)return;
    const mobile=window.matchMedia('(max-width:620px)').matches;
    Object.assign(popover.style,{position:'fixed',width:mobile?'100vw':'min(880px,calc(100vw - 40px))',maxWidth:'none',height:mobile?'100dvh':'min(76vh,720px)',maxHeight:mobile?'100dvh':'min(76vh,720px)',minHeight:'0',top:mobile?'0':'50%',left:mobile?'0':'50%',right:'auto',bottom:'auto',transform:mobile?'none':'translate(-50%,-50%)',overflowY:'auto',zIndex:'4000'});
  }
  function open(slot){openSlot=slot;deletePendingRef='';entityDeletePending='';entityFilter='';libraryQuery='';groupFilter='All';menuView='load';libraryView='saved';const menu=ensurePopover();menu.hidden=false;renderPopover();triggerFor(slot)?.setAttribute('aria-expanded','true')}
  function close(){if(!popover)return;triggerFor(openSlot)?.setAttribute('aria-expanded','false');popover.hidden=true;popover.removeAttribute('style');openSlot=null;deletePendingRef='';menuView='load'}

  // Title/menu trigger rendering has one owner: sky-chart-sky-card-title-integrity.
  // Saved Skies only consumes that trigger and never manufactures competing card chrome.
  function sync(){queued=false;if(openSlot)positionPopover()}
  function refreshOpenPopover(){if(openSlot&&!popover?.hidden)renderPopover();else if(openSlot)positionPopover()}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(sync)}

  document.addEventListener('click',event=>{
    const trigger=event.target.closest?.('[data-sky-library-browse]');
    if(trigger){event.preventDefault();event.stopPropagation();const slot=trigger.dataset.slot||trigger.dataset.savedSkyTrigger;if(openSlot===slot&&!popover?.hidden)close();else open(slot);return}
    if(event.target.closest?.('[data-saved-close]')){close();return}
    const detach=event.target.closest?.('[data-sky-loaded-detach]');if(detach){event.preventDefault();event.stopPropagation();const slot=detach.dataset.slot;newSky(slot);schedule();return}
    const entity=event.target.closest?.('[data-library-entity-ref]');
    if(entity){event.preventDefault();event.stopPropagation();entityFilter=entity.dataset.libraryEntityRef;libraryView='saved';libraryQuery='';groupFilter='All';renderPopover();return}
    if(event.target.closest?.('[data-library-clear-entity]')){event.preventDefault();entityFilter='';renderPopover();return}
    const deleteEntity=event.target.closest?.('[data-entity-delete-ref]');
    if(deleteEntity){event.preventDefault();event.stopPropagation();entityDeletePending=deleteEntity.dataset.entityDeleteRef;renderPopover();return}
    if(event.target.closest?.('[data-entity-delete-cancel]')){event.preventDefault();entityDeletePending='';renderPopover();return}
    const confirmEntity=event.target.closest?.('[data-entity-delete-confirm]');
    if(confirmEntity){event.preventDefault();event.stopPropagation();const result=window.RelphiSkyLibraryRecords?.deleteEntity?.(confirmEntity.dataset.entityDeleteConfirm);
      if(result?.ok){const removed=new Set((result.deletedSkies||[]).map(x=>recordRef(x)));for(const slot of ['A','B']){if(removed.has(String(payload(slot)?.metadata?.savedSkyId||'')))newSky(slot)}entityDeletePending='';entityFilter='';libraryView='entities';renderPopover()}return}
    if(event.target.closest?.('[data-library-close]')){event.preventDefault();close();return}
    const view=event.target.closest?.('[data-library-view]');if(view){event.preventDefault();event.stopPropagation();libraryView=view.dataset.libraryView;libraryQuery='';groupFilter='All';entityFilter='';entityDeletePending='';renderPopover();return}
    const recoveryLoad=event.target.closest?.('[data-library-load-recovery],[data-library-save-recovery]');
    if(recoveryLoad&&openSlot){
      event.preventDefault();event.stopPropagation();
      const slot=openSlot,recoveryId=recoveryLoad.dataset.libraryLoadRecovery||recoveryLoad.dataset.librarySaveRecovery;
      const previous=payload(slot),raw=window.RelphiSkyWorkingStorage.getItem(SLOT_KEYS[slot]),sky=window.RelphiSkyWorkingStorage?.loadRecovery?.(recoveryId);
      if(!sky)return;
      if(!writeJson(SLOT_KEYS[slot],sky))return;
      if(slot==='B'){window.RelphiSkyStartupMode?.writeMode?.('comparison');window.RelphiSkyStartupMode?.syncRoot?.()}
      dispatchStorage(slot);close();schedule();
      if(raw&&hasPlacements(previous))window.RelphiSkySlotControls?.offerUndo?.(slot,raw,'Sky '+slot+' loaded from Recovery');
      if(recoveryLoad.hasAttribute('data-library-save-recovery'))window.RelphiSkySaveNameDialog?.open?.(slot);
      return;
    }
    const manage=event.target.closest?.('[data-library-manage-ref]');if(manage){event.preventDefault();event.stopPropagation();close();window.RelphiSkySaveNameDialog?.openRecord?.(manage.dataset.libraryManageRef);return}
    const pin=event.target.closest?.('[data-library-pin-ref]');if(pin){event.preventDefault();event.stopPropagation();const rec=library().find(x=>recordRef(x)===pin.dataset.libraryPinRef);if(rec&&window.RelphiSkyLibraryRecords?.pin?.(recordRef(rec),rec?.metadata?.pinned!==true)){renderPopover()}return}
    if(event.target.closest?.('[data-sky-menu-back]')&&openSlot){menuView='commands';deletePendingRef='';renderPopover();return}
    const command=event.target.closest?.('[data-sky-command]');
    if(command&&openSlot){
      event.preventDefault();event.stopPropagation();const action=command.dataset.skyCommand,slot=openSlot;
      if(action==='load'){menuView='load';renderPopover();return}
      if(action==='save'){menuView='save';renderPopover();requestAnimationFrame(()=>popover?.querySelector('[data-sky-command-save-name]')?.focus({preventScroll:true}));return}
      if(action==='new'){close();newSky(slot);schedule();return}
      if(action==='remove'){close();removeSky(slot);schedule();return}
      if(action==='swap'){close();window.RelphiSkySlotControls?.swapSkies?.();schedule();return}
      if(action==='add-b'){close();addSkyB();schedule();return}
    }
    const deleteButton=event.target.closest?.('[data-saved-delete-ref]'),deleteConfirm=event.target.closest?.('[data-saved-delete-confirm]');
    if(deleteConfirm&&openSlot){event.preventDefault();event.stopPropagation();const ref=deleteConfirm.dataset.savedDeleteConfirm;deletePendingRef='';if(deleteRecord(ref)){renderPopover();schedule()}return}
    if(event.target.closest?.('[data-saved-delete-cancel]')&&openSlot){event.preventDefault();event.stopPropagation();deletePendingRef='';renderPopover();return}
    if(deleteButton&&openSlot){event.preventDefault();event.stopPropagation();const ref=deleteButton.dataset.savedDeleteRef,record=library().find(entry=>recordRef(entry)===ref);if(!record)return;deletePendingRef=ref;renderPopover();return}
    const item=event.target.closest?.('[data-saved-sky-ref]');
    if(item&&openSlot){event.preventDefault();event.stopPropagation();deletePendingRef='';const record=library().find(entry=>recordRef(entry)===item.dataset.savedSkyRef);if(record&&loadRecord(openSlot,record)){close();schedule()}return}
  },true);

  document.addEventListener('input',event=>{const target=event.target.closest?.('[data-library-query]');if(!target)return;libraryQuery=target.value;applyLibraryFilter()});
  document.addEventListener('change',event=>{const target=event.target.closest?.('[data-library-group]');if(!target)return;groupFilter=target.value;applyLibraryFilter()});
  document.addEventListener('submit',event=>{
    const form=event.target.closest?.('[data-sky-command-save-form]');if(!form||!openSlot)return;
    event.preventDefault();event.stopPropagation();const input=form.querySelector('[data-sky-command-save-name]'),status=form.querySelector('[data-sky-command-status]'),active=identity(openSlot),result=saveActive(openSlot,input?.value||'',active.record||null);
    if(status)status.textContent=result.message;if(result.ok){menuView='commands';renderPopover();schedule()}else input?.focus({preventScroll:true});
  });

  document.addEventListener('pointerdown',event=>{if(!openSlot||popover?.hidden)return;if(popover.contains(event.target)||triggerFor(openSlot)?.contains(event.target))return;close()},true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&openSlot){const trigger=triggerFor(openSlot);close();trigger?.focus()}});
  window.addEventListener('resize',positionPopover,{passive:true});window.visualViewport?.addEventListener('resize',positionPopover,{passive:true});window.visualViewport?.addEventListener('scroll',positionPopover,{passive:true});window.addEventListener('scroll',positionPopover,{passive:true,capture:true});
  window.addEventListener('storage',event=>{if(!event.key||event.key===LIBRARY_KEY||Object.values(SLOT_KEYS).includes(event.key))schedule();if(event.key===LIBRARY_KEY)refreshOpenPopover()});
  ['relphi:sky-foundation-ready','relphi:sky-name-updated','relphi:sky-where-when-committed'].forEach(name=>window.addEventListener(name,schedule));
  window.addEventListener('relphi:saved-sky-library-changed',()=>{schedule();refreshOpenPopover()});
  window.addEventListener('relphi:sky-recovery-changed',()=>{if(openSlot&&libraryView!=='saved')refreshOpenPopover()});

  window.RelphiSkySavedSkyIdentity=Object.freeze({identity,matchingRecord,settingsSignature:skySettingsSignature,library,openPicker:open,detach:newSky});
  function start(){ensurePopover();schedule()}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();