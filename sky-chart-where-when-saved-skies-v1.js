// Add elegant naming/saving to Where and When while sharing the canonical Saved Skies library.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiWhereWhenSavedSkiesV1)return;
  window.__relphiWhereWhenSavedSkiesV1=true;

  const LIBRARY_KEY='relphiSkyLibraryV1';
  const SLOT_KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const GENERIC_NAMES=new Set(['','current sky','sky a','sky b','standalone sky','comparison','unnamed sky','untitled sky','now']);
  const pending={A:null,B:null};
  let observer=null;

  const normalize=value=>String(value||'').trim().toLowerCase().replace(/\s+/g,' ');
  const clone=value=>JSON.parse(JSON.stringify(value));
  function readJson(key,fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch(_){return fallback}}
  function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch(_){return false}}
  function library(){const list=readJson(LIBRARY_KEY,[]);return Array.isArray(list)?list:[]}
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
  }
  function formStatus(form,message,error){
    const node=form?.querySelector('.sky-where-when-status');if(!node)return;
    node.textContent=message||'';node.classList.toggle('is-error',!!error);
  }

  function saveCalculatedSky(slot,request){
    let value=payload(slot);if(!value||typeof value!=='object')return;
    const records=library(),previous=explicitRecord(value,records),clean=String(request.name||'').trim();
    value=clean?applyName(value,clean):detachSavedIdentity(applyName(value,''));

    if(request.save){
      const current=previous||records.find(record=>request.previousRef&&recordRef(record)===request.previousRef)||null;
      const duplicate=records.find(record=>normalize(record?.name)===normalize(clean)&&(!current||recordRef(record)!==recordRef(current)));
      if(duplicate){
        value=detachSavedIdentity(value);writeJson(SLOT_KEYS[slot],value);dispatchSlot(slot);
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

    value=detachSavedIdentity(value);writeJson(SLOT_KEYS[slot],value);dispatchSlot(slot);
    window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot,name:value.name,source:'where-when'}}));
  }

  function inject(form){
    if(!form||form.dataset.savedSkiesControls==='true')return;
    const slot=form.dataset.slot;if(!SLOT_KEYS[slot])return;
    form.dataset.savedSkiesControls='true';
    const value=payload(slot),records=library(),record=explicitRecord(value,records),name=record?String(record.name||'').trim():candidateName(value);
    const section=document.createElement('section');section.className='sky-where-when-identity';section.dataset.wwSavedSkies='true';
    section.innerHTML=`
      <label class="sky-where-when-label sky-where-when-name-label">Sky name
        <input class="sky-where-when-input" data-ww-sky-name type="text" maxlength="80" autocomplete="off" placeholder="Optional" value="${String(name||'').replace(/[&<>\"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[ch]))}">
      </label>
      <label class="sky-where-when-save-choice">
        <input type="checkbox" data-ww-save-library${record?' checked':''}>
        <span>${record?'Save changes to Saved Skies':'Save to Saved Skies'}</span>
      </label>`;
    form.insertBefore(section,form.firstElementChild);
  }
  function hydrate(){document.querySelectorAll('.sky-where-when-editor').forEach(inject)}

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

  window.addEventListener('storage',event=>{
    const slot=event.key===SLOT_KEYS.A?'A':event.key===SLOT_KEYS.B?'B':null;if(!slot||!pending[slot])return;
    const request=pending[slot];pending[slot]=null;
    const value=payload(slot),source=String(value?.calcProfile?.source||'');
    if(!['where-when-v1','where-when-v2'].includes(source))return;
    saveCalculatedSky(slot,request);
  });

  function start(){
    hydrate();const root=document.getElementById('skyFoundationRoot')||document.body;
    observer=new MutationObserver(hydrate);observer.observe(root,{childList:true,subtree:true});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
