// Stable save-name dialog. It is intentionally separate from the Saved Skies popover
// so mobile virtual-keyboard viewport changes cannot destroy or replace the focused input.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkySavedSkyNameDialogV1)return;
  window.__relphiSkySavedSkyNameDialogV1=true;

  const LIBRARY_KEY='relphiSkyLibraryV1';
  const SLOT_KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const GENERIC_NAMES=new Set(['','current sky','sky a','sky b','standalone sky','comparison','unnamed sky','untitled sky','unsaved sky','now']);
  let activeSlot=null;
  let overlay=null;
  let input=null;
  let status=null;
  let editingRecordId='';
  let draft={owner:[],associate:[],groups:[]};
  let mergePending=null;
  let correctingSavedSky=false;

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
  function candidateName(value){
    for(const candidate of [value?.metadata?.savedSkyName,value?.name,value?.displayName,value?.skyName,value?.title,value?.calcProfile?.name,value?.calcProfile?.title]){
      const name=String(candidate||'').trim();
      if(!GENERIC_NAMES.has(normalize(name)))return name;
    }
    return '';
  }
  function applyNamedIdentity(value,name,id){
    const next=clone(value||{});
    next.name=name;next.title=name;next.displayName=name;next.skyName=name;
    next.metadata=next.metadata&&typeof next.metadata==='object'?next.metadata:{};
    next.metadata.savedSkyId=id;next.metadata.savedSkyName=name;next.metadata.savedSkyLoadedAt=new Date().toISOString();next.metadata.name=name;next.metadata.title=name;
    next.calcProfile=next.calcProfile&&typeof next.calcProfile==='object'?next.calcProfile:{};
    next.calcProfile.name=name;next.calcProfile.title=name;
    return next;
  }
  function announceName(slot,name,id){
    window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot,name,source:'saved-sky'}}));
    window.dispatchEvent(new CustomEvent('relphi:saved-sky-active-changed',{detail:{slot,name,id}}));
  }
  const records=()=>window.RelphiSkyLibraryRecords;
  const ehtml=x=>String(x==null?'':x).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[ch]));
  function activeSky(){return editingRecordId?records()?.library()?.find(r=>records().ref(r)===editingRecordId):payload(activeSlot)}
  function suggested(sky){return window.RelphiSkySuggestedName?.preferred?.(sky)||candidateName(sky)||''}
  function syncChosen(role){
    const host=overlay?.querySelector('[data-entity-picked="'+role+'"]');if(!host)return;
    host.replaceChildren();
    draft[role].forEach((entry,index)=>{
      const chip=document.createElement('span');chip.className='sky-save-entity-chip';
      const label=document.createElement('span');label.textContent=entry.name;
      const remove=document.createElement('button');remove.type='button';remove.textContent='×';
      remove.setAttribute('aria-label','Remove '+entry.name);remove.addEventListener('click',()=>{draft[role].splice(index,1);syncChosen(role)});
      chip.append(label,remove);host.appendChild(chip);
    });
  }
  function suggestEntities(role){
    const input=overlay?.querySelector('[data-entity-query="'+role+'"]'),host=overlay?.querySelector('[data-entity-options="'+role+'"]');
    if(!input||!host)return;
    const q=input.value.trim();host.replaceChildren();host.hidden=!q;if(!q)return;
    const people=records()?.entities()||[],matches=people.filter(x=>x.name.toLowerCase().includes(q.toLowerCase())).slice(0,8);
    const add=(label,data)=>{
      const button=document.createElement('button');button.type='button';button.className='sky-save-entity-option';button.textContent=label;
      button.addEventListener('click',()=>{if(!draft[role].some(x=>data.id?x.id===data.id:!x.id&&x.name===data.name))draft[role].push(data);input.value='';host.hidden=true;syncChosen(role)});
      host.appendChild(button);
    };
    matches.forEach(x=>add(x.name,{id:x.id,name:x.name}));
    add('Create Entity “'+q+'”',{name:q});
  }
  function syncGroups(){
    const host=overlay?.querySelector('[data-save-groups]');if(!host)return;host.replaceChildren();
    const names=[...new Set([...(records()?.groups()||[]),...draft.groups])];
    for(const name of names){
      const label=document.createElement('label');label.className='sky-save-group-item';
      const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=draft.groups.includes(name);
      checkbox.addEventListener('change',()=>{if(checkbox.checked)draft.groups.push(name);else draft.groups=draft.groups.filter(x=>x!==name)});
      label.append(checkbox,document.createTextNode(name));host.appendChild(label);
    }
  }
  function saveAs(slot,name){
    const sky=activeSky();if(!sky||!hasPlacements(sky))return{ok:false,message:'There is no sky to save.'};
    const defaultName=suggested(sky),chosen=String(name||'').trim()||defaultName;
    if(!chosen)return{ok:false,message:'No default sky name is available.'};
    const result=records()?.saveSky({sky,slot,name:chosen,defaultName,updateId:editingRecordId||undefined,owners:draft.owner,associates:draft.associate,groups:draft.groups});
    if(result?.duplicate)return{ok:false,duplicate:result.duplicate,message:'An identical sky already exists.'};
    if(!result?.ok)return result||{ok:false,message:'Sky Library is unavailable.'};
    window.RelphiSkyWorkingStorage?.releaseRecovery?.(sky);
    if(slot&&!editingRecordId){
      const active=clone(result.record);delete active.savedAt;delete active.updatedAt;
      if(!writeJson(SLOT_KEYS[slot],active))return{ok:false,message:'Saved to Library, but the active slot could not be updated.'};
      try{window.dispatchEvent(new StorageEvent('storage',{key:SLOT_KEYS[slot],newValue:window.RelphiSkyWorkingStorage.getItem(SLOT_KEYS[slot]),storageArea:localStorage}))}catch(_){}
      announceName(slot,chosen,result.record.id);
    }
    if(!String(name||'').trim())window.dispatchEvent(new CustomEvent('relphi:sky-default-name-restored',{detail:{name:chosen}}));
    return{ok:true,message:'Sky saved.'};
  }
  function renderMerge(conflict){
    mergePending=conflict;
    const targetOwners=new Set(records().links(conflict,'owner')),targetAssociates=new Set(records().links(conflict,'associate')),targetGroups=new Set(records().groupList(conflict));
    const allPeople=records().entities();
    const extras=[];
    for(const role of ['owner','associate']){
      for(const item of draft[role]){
        const already=item.id&&(role==='owner'?targetOwners:targetAssociates).has(item.id);
        if(!already)extras.push({role,...item});
      }
    }
    for(const name of draft.groups){if(!targetGroups.has(name))extras.push({role:'group',name})}
    const dialog=overlay.querySelector('.sky-save-name-dialog');
    let review=dialog.querySelector('[data-save-merge-review]');if(review)review.remove();
    review=document.createElement('section');review.dataset.saveMergeReview='true';review.className='sky-save-merge-review';
    const title=document.createElement('h3');title.textContent='Identical Sky Found';review.appendChild(title);
    const description=document.createElement('p');description.textContent='Keep “'+conflict.name+'”. Select any Owner, Associate, or Group assignments to transfer. The existing sky keeps its name.';review.appendChild(description);
    for(const item of extras){
      const line=document.createElement('label');line.className='sky-save-merge-option';
      const check=document.createElement('input');check.type='checkbox';check.checked=true;check.dataset.mergeRole=item.role;check.__mergeItem=item;
      line.append(check,document.createTextNode((item.role==='group'?'Group':item.role==='owner'?'Owner':'Associate')+': '+(item.name||allPeople.find(x=>x.id===item.id)?.name||item.id)));
      review.appendChild(line);
    }
    if(!extras.length){const p=document.createElement('p');p.textContent='No additional assignments are needed.';review.appendChild(p)}
    const actions=document.createElement('div');actions.className='sky-save-name-actions';
    const back=document.createElement('button');back.type='button';back.textContent='Back';back.addEventListener('click',()=>{review.remove();if(correctingSavedSky){closeDialog();return}dialog.querySelector('[data-save-main-fields]').hidden=false;mergePending=null});
    const confirm=document.createElement('button');confirm.type='button';confirm.textContent='Merge Skies';
    confirm.addEventListener('click',()=>{
      const entries=[...review.querySelectorAll('[data-merge-role]:checked')].map(x=>x.__mergeItem);
      const merged=records().mergeSky({targetId:records().ref(conflict),sourceId:editingRecordId||'',owners:entries.filter(x=>x.role==='owner'),associates:entries.filter(x=>x.role==='associate'),groups:entries.filter(x=>x.role==='group').map(x=>x.name)});
      if(!merged.ok){status.textContent=merged.message||'Merge could not be completed.';return}
      if(activeSlot)window.RelphiSkyWorkingStorage?.releaseRecovery?.(payload(activeSlot));
      if(activeSlot){const active=clone(merged.record);delete active.savedAt;delete active.updatedAt;writeJson(SLOT_KEYS[activeSlot],active);
        window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot:activeSlot,name:active.name,source:'merge'}}));
        try{window.dispatchEvent(new StorageEvent('storage',{key:SLOT_KEYS[activeSlot],storageArea:localStorage}))}catch(_){}
      }
      const corrected=correctingSavedSky&&activeSlot?activeSlot:null;
      closeDialog();
      if(corrected)window.RelphiSkyWhereWhen?.finishExternalCommit?.(corrected,{source:'where-when-merge'});
    });
    actions.append(back,confirm);review.append(actions);
    dialog.querySelector('[data-save-main-fields]').hidden=true;dialog.append(review);
  }

  function installStyles(){
    if(document.getElementById('skySavedSkyNameDialogStyles'))return;
    const style=document.createElement('style');
    style.id='skySavedSkyNameDialogStyles';
    style.textContent=`
      .sky-save-name-overlay{position:fixed;inset:0;z-index:30000;display:grid;place-items:center;padding:16px;box-sizing:border-box;background:rgba(28,24,21,.28);overscroll-behavior:contain}
      .sky-save-name-overlay[hidden]{display:none!important}
      .sky-save-name-dialog{width:min(520px,calc(100vw - 32px));box-sizing:border-box;padding:16px;border:1px solid rgba(31,27,24,.18);border-radius:14px;background:#fffdf8;box-shadow:0 22px 60px rgba(31,27,24,.28);color:#211d19}
      .sky-save-name-dialog h2{margin:0 0 4px;font:900 .9rem/1.15 system-ui,sans-serif}
      .sky-save-name-dialog p{margin:0 0 12px;color:#756c64;font:650 .62rem/1.35 system-ui,sans-serif}
      .sky-save-name-dialog label{display:grid;gap:5px}
      .sky-save-name-dialog label>span{font:800 .61rem/1.1 system-ui,sans-serif}
      .sky-save-name-dialog input{width:100%;min-height:42px;box-sizing:border-box;padding:8px 10px;border:1px solid rgba(31,27,24,.28);border-radius:9px;background:#fff;color:#211d19;font:700 16px/1.2 system-ui,sans-serif}
      .sky-save-name-dialog input:focus{outline:2px solid rgba(31,27,24,.16);outline-offset:1px;border-color:rgba(31,27,24,.5)}
      .sky-save-name-status{min-height:18px;margin:6px 0 0!important;color:#8a3f35!important;font-size:.58rem!important}
      .sky-save-name-section{display:grid;gap:.35rem;margin:.65rem 0} .sky-save-name-section>strong{font:800 .66rem/1.15 system-ui,sans-serif} .sky-save-entity-picked{display:flex;flex-wrap:wrap;gap:.3rem} .sky-save-entity-chip{display:inline-flex;align-items:center;gap:.3rem;border:1px solid #cfc4b8;border-radius:999px;padding:.18rem .4rem;font-size:.7rem} .sky-save-entity-chip button{border:0;background:none;cursor:pointer} .sky-save-entity-options{display:grid;gap:.2rem;max-height:150px;overflow:auto} .sky-save-entity-option{text-align:left;padding:.35rem;border:1px solid #ded8d0;border-radius:5px;background:white;cursor:pointer} .sky-save-group-items{display:flex;flex-wrap:wrap;gap:.35rem} .sky-save-group-item,.sky-save-merge-option{display:flex;align-items:center;gap:.3rem;font:.7rem/1.2 system-ui,sans-serif} .sky-save-merge-review{display:grid;gap:.4rem} .sky-save-merge-review h3{margin:.3rem 0} .sky-save-name-actions{display:flex;justify-content:flex-end;gap:7px;margin-top:10px}
      .sky-save-name-actions button{appearance:none;min-height:34px;padding:0 12px;border:1px solid rgba(31,27,24,.2);border-radius:999px;background:#fff;color:#29241f;cursor:pointer;font:800 .61rem/1 system-ui,sans-serif}
      .sky-save-name-actions button[type="submit"]{background:#27221e;color:#fff;border-color:#27221e}
      .sky-save-name-actions button:focus-visible{outline:2px solid rgba(31,27,24,.2);outline-offset:2px}
      @media(max-width:620px){.sky-save-name-overlay{place-items:start center;padding-top:max(18px,env(safe-area-inset-top))}.sky-save-name-dialog{margin-top:8vh}}
    `;
    document.head.appendChild(style);
  }
  function ensureDialog(){
    if(overlay?.isConnected)return;
    overlay=document.createElement('div');overlay.className='sky-save-name-overlay';overlay.hidden=true;overlay.setAttribute('role','presentation');
    const dialog=document.createElement('form');dialog.className='sky-save-name-dialog';dialog.dataset.saveSkyNameDialog='true';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','skySaveNameTitle');
    dialog.innerHTML=`<h2 id="skySaveNameTitle">Save Sky</h2><div data-save-main-fields><label><span>Sky name</span><input type="text" maxlength="120" autocomplete="off" enterkeyhint="done" data-save-sky-name-input></label><div class="sky-save-name-section"><strong>Owners (optional)</strong><div class="sky-save-entity-picked" data-entity-picked="owner"></div><input type="search" data-entity-query="owner" placeholder="Find or create an Entity"><div class="sky-save-entity-options" data-entity-options="owner" hidden></div></div><div class="sky-save-name-section"><strong>Associates (optional)</strong><div class="sky-save-entity-picked" data-entity-picked="associate"></div><input type="search" data-entity-query="associate" placeholder="Find or create an Entity"><div class="sky-save-entity-options" data-entity-options="associate" hidden></div></div><div class="sky-save-name-section"><strong>Groups (optional)</strong><div class="sky-save-group-items" data-save-groups></div><div style="display:flex;gap:.3rem"><input type="text" data-save-new-group placeholder="New group"><button type="button" data-save-add-group>Add</button></div></div><p class="sky-save-name-status" data-save-sky-name-status aria-live="polite"></p><div class="sky-save-name-actions"><button type="button" data-save-sky-name-cancel>Cancel</button><button type="submit">Save Sky</button></div></div>`;
    overlay.appendChild(dialog);document.body.appendChild(overlay);
    input=dialog.querySelector('[data-save-sky-name-input]');status=dialog.querySelector('[data-save-sky-name-status]');
    dialog.addEventListener('submit',event=>{event.preventDefault();if(!activeSlot&&!editingRecordId)return;const result=saveAs(activeSlot,input.value);status.textContent=result.message||'';if(result.duplicate)renderMerge(result.duplicate);else if(result.ok)closeDialog()});
    dialog.querySelectorAll('[data-entity-query]').forEach(node=>node.addEventListener('input',()=>suggestEntities(node.dataset.entityQuery)));
    dialog.querySelector('[data-save-add-group]').addEventListener('click',()=>{const field=dialog.querySelector('[data-save-new-group]'),n=field.value.trim();if(n&&!draft.groups.includes(n))draft.groups.push(n);field.value='';syncGroups()});
    dialog.querySelector('[data-save-sky-name-cancel]').addEventListener('click',closeDialog);
    overlay.addEventListener('pointerdown',event=>{if(event.target===overlay)event.preventDefault()});
  }
  function openDialog(slot){
    ensureDialog();activeSlot=slot;editingRecordId='';mergePending=null;correctingSavedSky=false;status.textContent='';draft={owner:[],associate:[],groups:[]};input.value=suggested(payload(slot));overlay.querySelector('[data-save-main-fields]').hidden=false;overlay.querySelector('[data-save-merge-review]')?.remove();syncChosen('owner');syncChosen('associate');syncGroups();overlay.querySelector('[data-save-sky-name-cancel]').hidden=true;overlay.hidden=false;document.documentElement.dataset.skySaveNameOpen='true';
    if(!matchMedia('(pointer:coarse)').matches)requestAnimationFrame(()=>input.focus({preventScroll:true}));
  }
  function closeDialog(){
    if(!overlay)return;overlay.hidden=true;activeSlot=null;editingRecordId='';mergePending=null;correctingSavedSky=false;document.documentElement.removeAttribute('data-sky-save-name-open');
    const trigger=document.querySelector('[data-saved-sky-trigger][aria-expanded="true"]');trigger?.focus?.({preventScroll:true});
  }
  function activeSlotFromPopover(){
    const trigger=document.querySelector('[data-saved-sky-trigger][aria-expanded="true"]');
    return trigger?.dataset.savedSkyTrigger||null;
  }
  function isUnsaved(slot){
    const state=window.RelphiSkySavedSkyIdentity?.identity?.(slot);
    return state?state.saved!==true:true;
  }

  installStyles();ensureDialog();
  // Unsaved skies use one stable naming dialog. Saved skies keep the Saved Skies
  // controller's Save Changes path because that operation overwrites an existing record.
  document.addEventListener('click',event=>{
    const action=event.target.closest?.('[data-saved-as],[data-sky-command="save"]');if(!action)return;
    const slot=activeSlotFromPopover();if(!slot)return;
    if(action.matches('[data-sky-command="save"]')&&!isUnsaved(slot))return;
    event.preventDefault();event.stopImmediatePropagation();openDialog(slot);
    const popover=document.getElementById('skySavedSkiesPopover');if(popover)popover.hidden=true;
    const trigger=document.querySelector(`[data-saved-sky-trigger="${slot}"]`);trigger?.setAttribute('aria-expanded','false');
  },true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&activeSlot&&!correctingSavedSky){event.preventDefault();event.stopImmediatePropagation();/* A new sky must be named before leaving this prompt. */}},true);
  function openRecord(recordId){
    const record=records()?.library()?.find(x=>records().ref(x)===recordId);if(!record)return;
    ensureDialog();editingRecordId=recordId;activeSlot=null;mergePending=null;correctingSavedSky=false;status.textContent='';
    const people=records().entities(),resolve=id=>{const x=people.find(p=>p.id===id);return x?{id:x.id,name:x.name}:null};
    draft={owner:records().links(record,'owner').map(resolve).filter(Boolean),associate:records().links(record,'associate').map(resolve).filter(Boolean),groups:records().groupList(record)};
    input.value=record.name||'';overlay.querySelector('[data-save-main-fields]').hidden=false;overlay.querySelector('[data-save-merge-review]')?.remove();
    syncChosen('owner');syncChosen('associate');syncGroups();overlay.querySelector('[data-save-sky-name-cancel]').hidden=false;overlay.hidden=false;
    document.documentElement.dataset.skySaveNameOpen='true';
  }
  function reviewDuplicateForEdit(slot,sourceId,target){
    const source=records()?.library()?.find(x=>records().ref(x)===sourceId);
    if(!source||!target)return false;
    ensureDialog();activeSlot=slot;editingRecordId=sourceId;correctingSavedSky=true;status.textContent='';
    const people=records().entities(),resolve=id=>{const p=people.find(x=>x.id===id);return p?{id:p.id,name:p.name}:null};
    draft={owner:records().links(source,'owner').map(resolve).filter(Boolean),associate:records().links(source,'associate').map(resolve).filter(Boolean),groups:records().groupList(source)};
    input.value=source.name;overlay.hidden=false;document.documentElement.dataset.skySaveNameOpen='true';
    renderMerge(target);return true;
  }
  window.RelphiSkySaveNameDialog=Object.freeze({open:openDialog,openRecord,reviewDuplicateForEdit,close:closeDialog});
})();