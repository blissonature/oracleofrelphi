// One Saved Sky field inside the expanded moment panel. The same field finds existing skies
// or names a new one; choosing a saved sky loads its Where and When preview in this panel.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiWhereWhenSavedSkiesV1)return;
  window.__relphiWhereWhenSavedSkiesV1=true;

  const LIBRARY_KEY='relphiSkyLibraryV1';
  const SLOT_KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const GENERIC_NAMES=new Set(['','current sky','sky a','sky b','standalone sky','comparison','unnamed sky','untitled sky','unsaved sky','now']);
  const pending={A:null,B:null};
  const state={A:{open:false,query:'',draftName:''},B:{open:false,query:'',draftName:''}};
  let queued=false;

  const normalize=value=>String(value||'').trim().toLowerCase().replace(/\s+/g,' ');
  const clone=value=>JSON.parse(JSON.stringify(value));
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch]));
  function readJson(key,fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch(_){return fallback}}
  function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch(_){return false}}
  function library(){const list=readJson(LIBRARY_KEY,[]);return Array.isArray(list)?list.filter(record=>record&&String(record.name||'').trim()):[]}
  function payload(slot){return readJson(SLOT_KEYS[slot],null)}
  function recordRef(record){return String(record?.id||record?.savedSkyId||record?.metadata?.savedSkyId||`legacy:${normalize(record?.name)}`)}
  function newId(){return `sky-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}
  function explicitRecord(value,records){
    const metadata=value?.metadata&&typeof value.metadata==='object'?value.metadata:{};
    const id=String(metadata.savedSkyId||'');
    if(id){const hit=records.find(record=>recordRef(record)===id||String(record.id||'')===id);if(hit)return hit}
    const name=normalize(metadata.savedSkyName);
    return name?records.find(record=>normalize(record?.name)===name)||null:null;
  }
  function candidateName(value){
    for(const candidate of [value?.name,value?.displayName,value?.skyName,value?.title,value?.calcProfile?.name,value?.calcProfile?.title]){
      const name=String(candidate||'').trim();
      if(name&&!GENERIC_NAMES.has(normalize(name)))return name;
    }
    return '';
  }
  function applyName(value,name){
    const next=clone(value||{}),clean=String(name||'').trim();
    next.name=clean||'Unsaved sky';next.title=next.name;next.displayName=next.name;next.skyName=next.name;
    next.calcProfile=next.calcProfile&&typeof next.calcProfile==='object'?next.calcProfile:{};
    next.calcProfile.name=next.name;next.calcProfile.title=next.name;
    next.metadata=next.metadata&&typeof next.metadata==='object'?next.metadata:{};
    next.metadata.name=next.name;next.metadata.title=next.name;
    return next;
  }
  function detachSavedIdentity(value){
    const next=clone(value||{});next.metadata=next.metadata&&typeof next.metadata==='object'?next.metadata:{};
    delete next.metadata.savedSkyId;delete next.metadata.savedSkyName;delete next.metadata.savedSkyLoadedAt;delete next.metadata.savedSkyDetached;
    return next;
  }
  function applySavedIdentity(value,name,id){
    const next=applyName(value,name);next.metadata=next.metadata&&typeof next.metadata==='object'?next.metadata:{};
    next.metadata.savedSkyId=id;next.metadata.savedSkyName=name;next.metadata.savedSkyLoadedAt=new Date().toISOString();
    return next;
  }
  function dispatchSlot(slot){
    try{window.dispatchEvent(new StorageEvent('storage',{key:SLOT_KEYS[slot],newValue:localStorage.getItem(SLOT_KEYS[slot]),storageArea:localStorage}))}
    catch(_){const event=new Event('storage');Object.defineProperty(event,'key',{value:SLOT_KEYS[slot]});window.dispatchEvent(event)}
    window.dispatchEvent(new CustomEvent('relphi:saved-sky-active-changed',{detail:{slot}}));
  }
  function activeRecord(slot){return explicitRecord(payload(slot),library())}
  function activeName(slot){const record=activeRecord(slot);return record?String(record.name||'').trim():state[slot].draftName||candidateName(payload(slot))}
  function shortMeta(record){
    const profile=record?.calcProfile&&typeof record.calcProfile==='object'?record.calcProfile:{};
    const raw=String(profile.dateTime||record?.dateTime||'');
    const date=raw.slice(0,10),time=/T(\d{2}:\d{2})/.exec(raw)?.[1]||'';
    const location=String(profile.location||record?.location||'').trim();
    return [[date,time].filter(Boolean).join(' · '),location].filter(Boolean).join(' · ');
  }
  function host(slot){return document.getElementById(`skyMomentDetails${slot}`)}
  function selector(slot){return host(slot)?.querySelector(`[data-ww-saved-sky-selector="${slot}"]`)||null}
  function ensureSelector(slot){
    const target=host(slot);if(!target)return null;
    let section=selector(slot);if(section)return section;
    const listId=`skyMomentSavedSkyList${slot}`;
    section=document.createElement('section');section.className='sky-moment-saved-sky';section.dataset.wwSavedSkySelector=slot;
    section.innerHTML=`<div class="sky-moment-saved-combobox"><input class="sky-moment-saved-input" type="text" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${listId}" data-ww-saved-sky-input="${slot}" placeholder="Find a saved sky or name a new sky"></div><div class="sky-moment-saved-list" id="${listId}" role="listbox" data-ww-saved-sky-list="${slot}" hidden></div>`;
    const facts=target.querySelector('.sky-moment-exact-facts');target.insertBefore(section,facts||target.firstChild);return section;
  }
  function renderList(slot){
    const section=ensureSelector(slot);if(!section)return;
    const input=section.querySelector('[data-ww-saved-sky-input]'),list=section.querySelector('[data-ww-saved-sky-list]');
    const open=state[slot].open;input?.setAttribute('aria-expanded',open?'true':'false');if(!list)return;
    list.hidden=!open;if(!open){list.replaceChildren();return}
    const query=String(state[slot].query||'').trim(),normalized=normalize(query),records=library().filter(record=>!normalized||normalize(record.name).includes(normalized));
    const current=activeRecord(slot),currentRef=current?recordRef(current):'';
    const savedMarkup=records.map(record=>{const ref=recordRef(record),meta=shortMeta(record),selected=ref===currentRef;return `<button type="button" class="sky-moment-saved-option${selected?' is-active':''}" role="option" aria-selected="${selected?'true':'false'}" data-ww-saved-sky-option="${escapeHtml(ref)}"><span>${escapeHtml(record.name)}</span>${meta?`<small>${escapeHtml(meta)}</small>`:''}</button>`}).join('');
    const exact=normalized&&library().some(record=>normalize(record.name)===normalized);
    const newMarkup=query&&!exact?`<button type="button" class="sky-moment-saved-option is-new" role="option" aria-selected="false" data-ww-new-sky-name="${escapeHtml(query)}"><span>New sky · ${escapeHtml(query)}</span><small>Use this name and edit its where and when</small></button>`:'';
    list.innerHTML=savedMarkup+newMarkup||'<p class="sky-moment-saved-empty">Type a saved-sky name or a new name.</p>';
  }
  function syncSelector(slot){
    const section=ensureSelector(slot);if(!section)return;
    const input=section.querySelector('[data-ww-saved-sky-input]');
    if(input&&document.activeElement!==input)input.value=activeName(slot)||'';
    renderList(slot);
  }
  function closeList(slot){state[slot].open=false;state[slot].query='';syncSelector(slot)}
  function loadRecord(slot,record){
    const id=recordRef(record),name=String(record.name||'Saved sky').trim(),active=applySavedIdentity(record,name,id);delete active.savedAt;delete active.updatedAt;
    if(!writeJson(SLOT_KEYS[slot],active))return false;
    state[slot].draftName='';state[slot].open=false;state[slot].query='';
    if(slot==='B'){try{localStorage.setItem('relphiSkyChartLastModeV1','comparison')}catch(_){}document.documentElement.dataset.skyLastMode='comparison'}
    dispatchSlot(slot);window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot,name,source:'saved-sky-field'}}));return true;
  }
  function beginNewSky(slot,name){
    const clean=String(name||'').trim();if(!clean)return false;
    if(library().some(record=>normalize(record.name)===normalize(clean)))return false;
    const current=payload(slot);if(!current||typeof current!=='object')return false;
    const next=applyName(detachSavedIdentity(current),clean);if(!writeJson(SLOT_KEYS[slot],next))return false;
    state[slot].draftName=clean;state[slot].open=false;state[slot].query='';dispatchSlot(slot);
    window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot,name:clean,source:'new-sky-field'}}));
    requestAnimationFrame(()=>document.querySelector(`#skyFoundation${slot} [data-ww-action="edit"]`)?.click());return true;
  }
  function saveAfterCalculation(slot,request){
    let value=payload(slot);if(!value||typeof value!=='object'||!request?.save)return;
    const records=library(),previous=request.previousRef?records.find(record=>recordRef(record)===request.previousRef):null;
    const clean=String(request.name||previous?.name||'').trim();if(!clean)return;
    const duplicate=records.find(record=>normalize(record.name)===normalize(clean)&&(!previous||recordRef(record)!==recordRef(previous)));if(duplicate)return;
    const id=previous?recordRef(previous):newId(),record=applySavedIdentity(value,clean,id);record.id=id;record.savedAt=previous?.savedAt||new Date().toISOString();record.updatedAt=new Date().toISOString();
    const index=previous?records.findIndex(item=>recordRef(item)===recordRef(previous)):-1;if(index>=0)records[index]=record;else records.push(record);
    if(!writeJson(LIBRARY_KEY,records))return;
    value=applySavedIdentity(value,clean,id);writeJson(SLOT_KEYS[slot],value);state[slot].draftName='';dispatchSlot(slot);
    window.dispatchEvent(new CustomEvent('relphi:saved-sky-library-changed',{detail:{slot,name:clean,id,action:index>=0?'update':'create'}}));
    window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot,name:clean,source:'where-when'}}));
  }
  function removeLegacyEditorControls(){document.querySelectorAll('.sky-where-when-identity').forEach(node=>node.remove())}
  function hydrate(){queued=false;removeLegacyEditorControls();['A','B'].forEach(syncSelector)}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(hydrate)}

  document.addEventListener('focusin',event=>{
    const input=event.target.closest?.('[data-ww-saved-sky-input]');if(!input)return;
    const slot=input.dataset.wwSavedSkyInput;if(!SLOT_KEYS[slot])return;
    state[slot].open=true;state[slot].query='';renderList(slot);requestAnimationFrame(()=>input.select());
  });
  document.addEventListener('input',event=>{
    const input=event.target.closest?.('[data-ww-saved-sky-input]');if(!input)return;
    const slot=input.dataset.wwSavedSkyInput;if(!SLOT_KEYS[slot])return;
    state[slot].open=true;state[slot].query=input.value;renderList(slot);
  });
  document.addEventListener('keydown',event=>{
    const input=event.target.closest?.('[data-ww-saved-sky-input]');if(!input)return;
    const slot=input.dataset.wwSavedSkyInput;if(!SLOT_KEYS[slot])return;
    if(event.key==='Escape'){event.preventDefault();closeList(slot);input.blur();return}
    if(event.key==='ArrowDown'){event.preventDefault();state[slot].open=true;renderList(slot);selector(slot)?.querySelector('.sky-moment-saved-option')?.focus();return}
    if(event.key==='Enter'&&state[slot].open){const first=selector(slot)?.querySelector('.sky-moment-saved-option');if(first){event.preventDefault();first.click()}}
  });
  document.addEventListener('click',event=>{
    const option=event.target.closest?.('[data-ww-saved-sky-option]');
    if(option){event.preventDefault();event.stopPropagation();const section=option.closest('[data-ww-saved-sky-selector]'),slot=section?.dataset.wwSavedSkySelector,record=library().find(item=>recordRef(item)===option.dataset.wwSavedSkyOption);if(slot&&record&&loadRecord(slot,record))schedule();return}
    const create=event.target.closest?.('[data-ww-new-sky-name]');
    if(create){event.preventDefault();event.stopPropagation();const slot=create.closest('[data-ww-saved-sky-selector]')?.dataset.wwSavedSkySelector;if(slot&&beginNewSky(slot,create.dataset.wwNewSkyName))schedule();return}
  },true);
  document.addEventListener('pointerdown',event=>{['A','B'].forEach(slot=>{const section=selector(slot);if(state[slot].open&&section&&!section.contains(event.target))closeList(slot)})},true);

  document.addEventListener('submit',event=>{
    const form=event.target.closest?.('.sky-where-when-editor');if(!form)return;
    const slot=form.dataset.slot;if(!SLOT_KEYS[slot])return;
    const current=activeRecord(slot),name=current?String(current.name||'').trim():state[slot].draftName||candidateName(payload(slot));
    pending[slot]={name,save:!!name,previousRef:current?recordRef(current):'',created:Date.now()};
    window.setTimeout(()=>{if(pending[slot]&&Date.now()-pending[slot].created>=4500)pending[slot]=null},4700);
  },true);

  window.addEventListener('storage',event=>{
    const slot=event.key===SLOT_KEYS.A?'A':event.key===SLOT_KEYS.B?'B':null;
    if(slot&&pending[slot]){const request=pending[slot];pending[slot]=null;const value=payload(slot),source=String(value?.calcProfile?.source||'');if(source==='where-when-v1')saveAfterCalculation(slot,request)}
    if(!event.key||event.key===LIBRARY_KEY||Object.values(SLOT_KEYS).includes(event.key))schedule();
  });
  ['relphi:sky-foundation-ready','relphi:sky-name-updated','relphi:saved-sky-library-changed','relphi:saved-sky-active-changed'].forEach(name=>window.addEventListener(name,schedule));
  new MutationObserver(records=>{if(records.some(record=>record.addedNodes.length||record.removedNodes.length))schedule()}).observe(document.documentElement,{childList:true,subtree:true});
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule,{once:true}):schedule();
})();
