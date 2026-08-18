// Saved-sky controls for the literal Where and When layer, sharing the canonical Saved Skies library.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiWhereWhenSavedSkiesV1)return;
  window.__relphiWhereWhenSavedSkiesV1=true;

  const LIBRARY_KEY='relphiSkyLibraryV1';
  const SLOT_KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const GENERIC_NAMES=new Set(['','current sky','sky a','sky b','standalone sky','comparison','unnamed sky','untitled sky','unsaved sky','now']);
  const pending={A:null,B:null};
  const selectorState={A:{open:false,query:''},B:{open:false,query:''}};
  let observer=null,queued=false;

  const normalize=value=>String(value||'').trim().toLowerCase().replace(/\s+/g,' ');
  const clone=value=>JSON.parse(JSON.stringify(value));
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

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
    const record=explicitRecord(value,library());
    if(record)return String(record.name||'').trim();
    for(const candidate of [value?.name,value?.displayName,value?.skyName,value?.title]){
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
    delete next.metadata.savedSkyId;delete next.metadata.savedSkyName;delete next.metadata.savedSkyLoadedAt;
    next.metadata.savedSkyDetached=true;
    return next;
  }
  function applySavedIdentity(value,name,id){
    const next=applyName(value,name);next.metadata=next.metadata&&typeof next.metadata==='object'?next.metadata:{};
    delete next.metadata.savedSkyDetached;
    next.metadata.savedSkyId=id;next.metadata.savedSkyName=name;next.metadata.savedSkyLoadedAt=new Date().toISOString();
    return next;
  }
  function dispatchSlot(slot){
    try{window.dispatchEvent(new StorageEvent('storage',{key:SLOT_KEYS[slot],newValue:localStorage.getItem(SLOT_KEYS[slot]),storageArea:localStorage}))}
    catch(_){const event=new Event('storage');Object.defineProperty(event,'key',{value:SLOT_KEYS[slot]});window.dispatchEvent(event)}
    window.dispatchEvent(new CustomEvent('relphi:saved-sky-active-changed',{detail:{slot}}));
  }
  function formStatus(form,message,error){
    const node=form?.querySelector('.sky-where-when-status');if(!node)return;
    node.textContent=message||'';node.classList.toggle('is-error',!!error);
  }

  function saveCalculatedSky(slot,request){
    let value=payload(slot);if(!value||typeof value!=='object')return;
    const records=library(),previous=explicitRecord(value,records),clean=String(request.name||'').trim();

    if(request.save){
      value=clean?applyName(value,clean):applyName(value,previous?.name||'');
      const current=previous||records.find(record=>request.previousRef&&recordRef(record)===request.previousRef)||null;
      const duplicate=records.find(record=>normalize(record?.name)===normalize(clean)&&(!current||recordRef(record)!==recordRef(current)));
      if(duplicate){
        value=detachSavedIdentity(applyName(value,''));writeJson(SLOT_KEYS[slot],value);dispatchSlot(slot);
        window.dispatchEvent(new CustomEvent('relphi:saved-sky-save-error',{detail:{slot,message:'That name is already in Saved skies.'}}));
        return;
      }
      const id=current?recordRef(current):newId(),record=applySavedIdentity(value,clean,id);
      record.id=id;record.savedAt=current?.savedAt||record.savedAt||new Date().toISOString();record.updatedAt=new Date().toISOString();
      const index=current?records.findIndex(item=>recordRef(item)===recordRef(current)):-1;
      if(index>=0)records[index]=record;else records.push(record);
      if(writeJson(LIBRARY_KEY,records)){
        value=applySavedIdentity(value,clean,id);
        writeJson(SLOT_KEYS[slot],value);dispatchSlot(slot);
        window.dispatchEvent(new CustomEvent('relphi:saved-sky-library-changed',{detail:{slot,name:clean,id,action:index>=0?'update':'create'}}));
        window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot,name:clean,source:'where-when'}}));
      }
      return;
    }

    value=detachSavedIdentity(applyName(value,''));
    writeJson(SLOT_KEYS[slot],value);dispatchSlot(slot);
    window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot,name:'Unsaved sky',source:'where-when'}}));
  }

  function loadRecord(slot,record){
    if(!SLOT_KEYS[slot]||!record)return false;
    const id=recordRef(record),name=String(record.name||'Saved sky').trim(),active=applySavedIdentity(record,name,id);
    delete active.savedAt;delete active.updatedAt;
    if(!writeJson(SLOT_KEYS[slot],active))return false;
    if(slot==='B'){
      try{localStorage.setItem('relphiSkyChartLastModeV1','comparison')}catch(_){}
      document.documentElement.dataset.skyLastMode='comparison';
    }
    dispatchSlot(slot);
    window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot,name,source:'saved-sky-selector'}}));
    return true;
  }
  function detachCurrent(slot){
    const value=payload(slot);if(!value||typeof value!=='object')return false;
    const detached=detachSavedIdentity(applyName(value,''));
    if(!writeJson(SLOT_KEYS[slot],detached))return false;
    dispatchSlot(slot);
    window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot,name:'Unsaved sky',source:'saved-sky-selector'}}));
    return true;
  }

  function shortMeta(record){
    const profile=record?.calcProfile&&typeof record.calcProfile==='object'?record.calcProfile:{};
    const date=String(profile.dateTime||record?.dateTime||'').slice(0,10);
    const location=String(profile.location||record?.location||'').trim();
    return [date,location].filter(Boolean).join(' · ');
  }
  function selectorHost(slot){return document.getElementById(`skyMomentDetails${slot}`)}
  function selectorNode(slot){return selectorHost(slot)?.querySelector(`[data-ww-saved-sky-selector="${slot}"]`)||null}
  function activeSavedRecord(slot){return explicitRecord(payload(slot),library())}

  function ensureSelector(slot){
    const host=selectorHost(slot);if(!host)return null;
    let section=selectorNode(slot);if(section)return section;
    const listId=`skyMomentSavedSkyList${slot}`;
    section=document.createElement('section');
    section.className='sky-moment-saved-sky';section.dataset.wwSavedSkySelector=slot;
    section.innerHTML=`
      <span class="sky-moment-saved-label">Saved sky</span>
      <div class="sky-moment-saved-combobox">
        <input class="sky-moment-saved-input" type="text" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${listId}" data-ww-saved-sky-input="${slot}" placeholder="Search My Saved Skies">
        <button class="sky-moment-saved-clear" type="button" data-ww-saved-sky-clear="${slot}" aria-label="Keep this sky as an unsaved copy" title="Keep this sky as an unsaved copy">×</button>
        <button class="sky-moment-saved-toggle" type="button" data-ww-saved-sky-toggle="${slot}" aria-label="Show My Saved Skies" aria-expanded="false"><span aria-hidden="true"></span></button>
      </div>
      <div class="sky-moment-saved-list" id="${listId}" role="listbox" data-ww-saved-sky-list="${slot}" hidden></div>`;
    const facts=host.querySelector('.sky-moment-exact-facts');
    host.insertBefore(section,facts||host.firstChild);
    return section;
  }
  function filteredLibrary(slot){
    const query=normalize(selectorState[slot].query);
    const records=library();
    if(!query)return records;
    return records.filter(record=>normalize(record.name).includes(query));
  }
  function renderSelectorList(slot){
    const section=ensureSelector(slot);if(!section)return;
    const list=section.querySelector('[data-ww-saved-sky-list]');
    const input=section.querySelector('[data-ww-saved-sky-input]');
    const toggle=section.querySelector('[data-ww-saved-sky-toggle]');
    const open=selectorState[slot].open;
    input?.setAttribute('aria-expanded',open?'true':'false');toggle?.setAttribute('aria-expanded',open?'true':'false');
    if(!list)return;
    list.hidden=!open;
    if(!open){list.replaceChildren();return}
    const active=activeSavedRecord(slot),activeRef=active?recordRef(active):'',records=filteredLibrary(slot);
    if(!records.length){list.innerHTML='<p class="sky-moment-saved-empty">No saved skies match.</p>';return}
    list.innerHTML=records.map(record=>{
      const ref=recordRef(record),current=ref===activeRef,meta=shortMeta(record);
      return `<button type="button" class="sky-moment-saved-option${current?' is-active':''}" role="option" aria-selected="${current?'true':'false'}" data-ww-saved-sky-option="${escapeHtml(ref)}"><span>${escapeHtml(record.name)}</span>${meta?`<small>${escapeHtml(meta)}</small>`:''}</button>`;
    }).join('');
  }
  function syncSelector(slot){
    const section=ensureSelector(slot);if(!section)return;
    const input=section.querySelector('[data-ww-saved-sky-input]');
    const clear=section.querySelector('[data-ww-saved-sky-clear]');
    const record=activeSavedRecord(slot),name=record?String(record.name||'').trim():'Unsaved sky';
    if(input&&document.activeElement!==input)input.value=name;
    if(clear)clear.hidden=!record;
    section.classList.toggle('is-saved',!!record);
    renderSelectorList(slot);
  }
  function openSelector(slot,focusInput){
    selectorState[slot].open=true;selectorState[slot].query='';
    syncSelector(slot);
    if(focusInput){
      requestAnimationFrame(()=>{
        const input=selectorNode(slot)?.querySelector('[data-ww-saved-sky-input]');
        input?.focus({preventScroll:true});input?.select();
      });
    }
  }
  function closeSelector(slot){
    selectorState[slot].open=false;selectorState[slot].query='';syncSelector(slot);
  }

  function inject(form){
    if(!form||form.dataset.savedSkiesControls==='true')return;
    const slot=form.dataset.slot;if(!SLOT_KEYS[slot])return;
    form.dataset.savedSkiesControls='true';
    const value=payload(slot),records=library(),record=explicitRecord(value,records),name=record?String(record.name||'').trim():candidateName(value);
    const section=document.createElement('section');section.className='sky-where-when-identity';section.dataset.wwSavedSkies='true';
    section.innerHTML=`
      <label class="sky-where-when-label sky-where-when-name-label">Sky name
        <input class="sky-where-when-input" data-ww-sky-name type="text" maxlength="80" autocomplete="off" placeholder="Optional" value="${escapeHtml(name)}">
      </label>
      <label class="sky-where-when-save-choice">
        <input type="checkbox" data-ww-save-library${record?' checked':''}>
        <span>${record?'Save changes to Saved Skies':'Save to Saved Skies'}</span>
      </label>`;
    form.insertBefore(section,form.firstElementChild);
  }
  function hydrate(){
    queued=false;
    document.querySelectorAll('.sky-where-when-editor').forEach(inject);
    ['A','B'].forEach(syncSelector);
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(hydrate)}

  document.addEventListener('submit',event=>{
    const form=event.target.closest?.('.sky-where-when-editor');if(!form)return;
    const slot=form.dataset.slot;if(!SLOT_KEYS[slot])return;
    const name=String(form.querySelector('[data-ww-sky-name]')?.value||'').trim(),save=!!form.querySelector('[data-ww-save-library]')?.checked;
    const records=library(),current=explicitRecord(payload(slot),records),duplicate=save&&name?records.find(record=>normalize(record?.name)===normalize(name)&&(!current||recordRef(record)!==recordRef(current))):null;
    if(save&&!name){
      event.preventDefault();event.stopImmediatePropagation();formStatus(form,'Name the sky before saving it to Saved Skies.',true);
      const input=form.querySelector('[data-ww-sky-name]');input?.setAttribute('aria-invalid','true');input?.focus();return;
    }
    if(duplicate){
      event.preventDefault();event.stopImmediatePropagation();formStatus(form,'That name is already in Saved Skies.',true);
      const input=form.querySelector('[data-ww-sky-name]');input?.setAttribute('aria-invalid','true');input?.focus();return;
    }
    form.querySelector('[data-ww-sky-name]')?.removeAttribute('aria-invalid');
    pending[slot]={name,save,previousRef:current?recordRef(current):'',created:Date.now()};
    window.setTimeout(()=>{if(pending[slot]&&Date.now()-pending[slot].created>=4500)pending[slot]=null},4700);
  },true);

  document.addEventListener('click',event=>{
    const toggle=event.target.closest?.('[data-ww-saved-sky-toggle]');
    if(toggle){
      event.preventDefault();event.stopPropagation();
      const slot=toggle.dataset.wwSavedSkyToggle;
      if(!SLOT_KEYS[slot])return;
      selectorState[slot].open?closeSelector(slot):openSelector(slot,true);
      return;
    }
    const clear=event.target.closest?.('[data-ww-saved-sky-clear]');
    if(clear){
      event.preventDefault();event.stopPropagation();
      const slot=clear.dataset.wwSavedSkyClear;
      if(SLOT_KEYS[slot]&&detachCurrent(slot)){selectorState[slot].open=false;selectorState[slot].query='';schedule()}
      return;
    }
    const option=event.target.closest?.('[data-ww-saved-sky-option]');
    if(option){
      event.preventDefault();event.stopPropagation();
      const section=option.closest?.('[data-ww-saved-sky-selector]'),slot=section?.dataset.wwSavedSkySelector;
      const record=library().find(item=>recordRef(item)===option.dataset.wwSavedSkyOption);
      if(slot&&record&&loadRecord(slot,record)){selectorState[slot].open=false;selectorState[slot].query='';schedule()}
    }
  },true);

  document.addEventListener('focusin',event=>{
    const input=event.target.closest?.('[data-ww-saved-sky-input]');if(!input)return;
    const slot=input.dataset.wwSavedSkyInput;if(!SLOT_KEYS[slot])return;
    if(!selectorState[slot].open)openSelector(slot,false);
    requestAnimationFrame(()=>input.select());
  });
  document.addEventListener('input',event=>{
    const input=event.target.closest?.('[data-ww-saved-sky-input]');
    if(input){
      const slot=input.dataset.wwSavedSkyInput;if(!SLOT_KEYS[slot])return;
      selectorState[slot].open=true;selectorState[slot].query=input.value;renderSelectorList(slot);return;
    }
  });
  document.addEventListener('keydown',event=>{
    const input=event.target.closest?.('[data-ww-saved-sky-input]');if(!input)return;
    const slot=input.dataset.wwSavedSkyInput;if(!SLOT_KEYS[slot])return;
    if(event.key==='Escape'){event.preventDefault();closeSelector(slot);input.blur();return}
    if(event.key==='ArrowDown'){
      event.preventDefault();selectorState[slot].open=true;renderSelectorList(slot);
      selectorNode(slot)?.querySelector('[data-ww-saved-sky-option]')?.focus();return;
    }
    if(event.key==='Enter'&&selectorState[slot].open){
      const first=selectorNode(slot)?.querySelector('[data-ww-saved-sky-option]');
      if(first){event.preventDefault();first.click()}
    }
  });
  document.addEventListener('pointerdown',event=>{
    ['A','B'].forEach(slot=>{
      if(!selectorState[slot].open)return;
      const section=selectorNode(slot);if(section?.contains(event.target))return;
      closeSelector(slot);
    });
  },true);

  window.addEventListener('storage',event=>{
    const slot=event.key===SLOT_KEYS.A?'A':event.key===SLOT_KEYS.B?'B':null;
    if(slot&&pending[slot]){
      const request=pending[slot];pending[slot]=null;
      const value=payload(slot),source=String(value?.calcProfile?.source||'');
      if(source==='where-when-v1')saveCalculatedSky(slot,request);
    }
    if(!event.key||event.key===LIBRARY_KEY||Object.values(SLOT_KEYS).includes(event.key))schedule();
  });
  ['relphi:sky-foundation-ready','relphi:sky-name-updated','relphi:saved-sky-library-changed','relphi:saved-sky-active-changed'].forEach(name=>window.addEventListener(name,schedule));

  function start(){
    hydrate();
    const root=document.getElementById('skyFoundationRoot')||document.body;
    observer=new MutationObserver(records=>{
      if(records.every(record=>record.target?.closest?.('[data-ww-saved-sky-selector]')))return;
      schedule();
    });
    observer.observe(root,{childList:true,subtree:true});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
