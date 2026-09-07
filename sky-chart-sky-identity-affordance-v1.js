// Sky Chart identity workflow: Saved Skies is the direct picker and Where & When owns naming + persistence.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyIdentityAffordanceV2)return;
window.__relphiSkyIdentityAffordanceV2=true;
window.__relphiSkyIdentityAffordanceV1=true;

const LIBRARY_KEY='relphiSkyLibraryV1';
const SLOT_KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const GENERIC_NAMES=new Set(['','current sky','sky a','sky b','standalone sky','comparison','unnamed sky','untitled sky','new sky','where and when','now']);
const pendingSave={A:null,B:null};
let queued=false;

const style=document.createElement('style');
style.id='sky-chart-identity-workflow-v2-style';
style.textContent=`
#skySavedSkiesPopover [data-sky-command="save"],
#skySavedSkiesPopover [data-sky-command-save-form]{display:none!important}
#skySavedSkiesPopover .sky-create-new-row{padding:6px 6px 2px}
#skySavedSkiesPopover .sky-create-new-button{width:100%;display:flex;align-items:center;gap:10px;border:1px solid rgba(76,67,55,.18);border-radius:12px;background:rgba(255,255,255,.72);color:inherit;padding:11px 13px;font:inherit;font-weight:750;text-align:left;cursor:pointer}
#skySavedSkiesPopover .sky-create-new-button:hover,#skySavedSkiesPopover .sky-create-new-button:focus-visible{background:rgba(255,255,255,.96);outline:none;box-shadow:0 0 0 2px rgba(201,33,30,.14)}
#skySavedSkiesPopover .sky-create-new-plus{font-size:1.25em;line-height:1;color:#c9211e}
.sky-where-when-name-section{margin-top:10px}
.sky-where-when-name-help{margin:6px 0 0;color:var(--muted,#756f67);font-size:.88em;line-height:1.35}
.sky-where-when-name-conflict{margin-top:9px;padding:10px 11px;border:1px solid rgba(201,33,30,.24);border-radius:10px;background:rgba(201,33,30,.055)}
.sky-where-when-name-conflict p{margin:0 0 8px;font-size:.9em;line-height:1.35}
.sky-where-when-name-conflict-actions{display:flex;flex-wrap:wrap;gap:7px}
.sky-where-when-name-conflict button{font:inherit;border:1px solid rgba(76,67,55,.22);border-radius:9px;background:#fff;padding:7px 10px;cursor:pointer}
.sky-where-when-name-conflict button:first-child{font-weight:750}
`;
document.head.appendChild(style);

function readJson(key,fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch(_){return fallback}}
function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch(_){return false}}
function clone(value){return JSON.parse(JSON.stringify(value))}
function normalize(value){return String(value||'').trim().toLowerCase().replace(/\s+/g,' ')}
function payload(slot){return readJson(SLOT_KEYS[slot],null)}
function rawLibrary(){const list=readJson(LIBRARY_KEY,[]);return Array.isArray(list)?list.filter(record=>record&&typeof record==='object'):[]}
function realRecordId(record){return String(record?.id||record?.savedSkyId||record?.metadata?.savedSkyId||'').trim()}
function newId(){return `sky-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}
function hasPlacements(value){const source=value&&(value.placements||value.positions||value.points||value.bodies);return!!(source&&typeof source==='object'&&!Array.isArray(source)&&Object.keys(source).length)}
function candidateName(value){for(const candidate of [value?.metadata?.savedSkyName,value?.name,value?.displayName,value?.skyName,value?.title]){const clean=String(candidate||'').trim();if(clean&&!GENERIC_NAMES.has(normalize(clean)))return clean}return''}
function activeRecord(slot,records=rawLibrary()){
  const value=payload(slot),meta=value?.metadata&&typeof value.metadata==='object'?value.metadata:{};
  const id=String(meta.savedSkyId||'').trim();
  if(id){const hit=records.find(record=>realRecordId(record)===id);if(hit)return hit}
  const savedName=normalize(meta.savedSkyName);
  if(savedName){const hit=records.find(record=>normalize(record.name)===savedName);if(hit)return hit}
  try{const hit=window.RelphiSkySavedSkyIdentity?.identity?.(slot)?.record;if(hit){const rid=realRecordId(hit),rname=normalize(hit.name);return records.find(record=>(rid&&realRecordId(record)===rid)||(!rid&&rname&&normalize(record.name)===rname))||hit}}catch(_){}
  return null;
}
function dispatchSlot(slot){
  const key=SLOT_KEYS[slot];
  try{window.dispatchEvent(new StorageEvent('storage',{key,newValue:localStorage.getItem(key),storageArea:localStorage}))}
  catch(_){const event=new Event('storage');Object.defineProperty(event,'key',{value:key});window.dispatchEvent(event)}
  window.dispatchEvent(new CustomEvent('relphi:saved-sky-active-changed',{detail:{slot}}));
}
function blankPayload(){return{name:'Where and When',title:'Where and When',displayName:'Where and When',skyName:'Where and When',saved:false,placements:{},metadata:{name:'Where and When',title:'Where and When'},calcProfile:{name:'Where and When',title:'Where and When'}}}
function slotFromOpenTrigger(){for(const slot of ['A','B']){const trigger=document.querySelector(`#skyFoundation${slot} [data-saved-sky-trigger]`);if(trigger?.getAttribute('aria-expanded')==='true')return slot}return null}
function closePicker(slot){const trigger=document.querySelector(`#skyFoundation${slot} [data-saved-sky-trigger]`);if(trigger?.getAttribute('aria-expanded')==='true')trigger.click()}
function openBlankWhereWhen(slot){
  const blank=blankPayload();
  pendingSave[slot]=null;
  document.querySelectorAll(`#skyFoundation${slot} [data-sky-heptagram-frame="${slot}"]`).forEach(node=>node.remove());
  writeJson(SLOT_KEYS[slot],blank);
  dispatchSlot(slot);
  window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot,name:'Where and When',source:'create-new'}}));
  requestAnimationFrame(()=>{
    window.RelphiSkyCardShell?.ensure?.(slot,blank);
    window.RelphiSkyCardShell?.openDrawer?.(slot,'where');
    requestAnimationFrame(()=>{
      if(!document.querySelector(`#skyFoundation${slot} .sky-where-when-editor[data-slot="${slot}"]`))window.dispatchEvent(new CustomEvent('relphi:sky-drawer-opened',{detail:{slot,drawer:'where'}}));
    });
  });
}
function createNew(slot){if(!SLOT_KEYS[slot])return;closePicker(slot);openBlankWhereWhen(slot)}

function directToLibrary(trigger){
  if(!trigger||trigger.getAttribute('aria-expanded')!=='true')return;
  const popover=document.getElementById('skySavedSkiesPopover');
  const load=popover?.querySelector('[data-sky-command="load"]');
  if(load)load.click();
}
function decorateLibrary(){
  const popover=document.getElementById('skySavedSkiesPopover');if(!popover)return;
  const list=popover.querySelector('.sky-saved-list');if(!list)return;
  const heading=popover.querySelector('.sky-saved-subview-head strong');if(heading&&normalize(heading.textContent)==='load sky')heading.textContent='Saved Skies';
  if(!list.querySelector('[data-sky-create-new]')){
    const row=document.createElement('div');row.className='sky-create-new-row';row.dataset.skyCreateNew='true';
    const button=document.createElement('button');button.type='button';button.className='sky-create-new-button';button.dataset.skyCreateNewButton='true';button.setAttribute('aria-label','Create a new blank sky');
    const plus=document.createElement('span');plus.className='sky-create-new-plus';plus.setAttribute('aria-hidden','true');plus.textContent='+';
    const label=document.createElement('span');label.textContent='Create New';
    button.append(plus,label);row.appendChild(button);list.prepend(row);
  }
}

function skyNameForEditor(slot){
  const records=rawLibrary(),record=activeRecord(slot,records);if(record?.name)return String(record.name).trim();
  return candidateName(payload(slot));
}
function injectNameField(form){
  if(!form||form.querySelector('[data-ww-sky-name]'))return;
  const slot=form.dataset.slot;if(!SLOT_KEYS[slot])return;
  const section=document.createElement('fieldset');section.className='sky-where-when-section sky-where-when-name-section';section.dataset.wwSkyNameSection='true';
  const legend=document.createElement('legend');legend.textContent='Name';
  const label=document.createElement('label');label.className='sky-where-when-label';label.append('Sky name');
  const input=document.createElement('input');input.className='sky-where-when-input';input.dataset.wwSkyName='true';input.type='text';input.maxLength=80;input.autocomplete='off';input.placeholder='Name this sky';input.value=skyNameForEditor(slot);
  const help=document.createElement('p');help.className='sky-where-when-name-help';help.dataset.wwSkyNameHelp='true';help.textContent='This sky will be saved when you use this Where and When.';
  const conflict=document.createElement('div');conflict.className='sky-where-when-name-conflict';conflict.dataset.wwSkyNameConflict='true';conflict.hidden=true;
  label.appendChild(input);section.append(legend,label,help,conflict);
  const heptagram=form.querySelector('[data-ww-heptagram-slot]');
  if(heptagram)heptagram.insertAdjacentElement('afterend',section);else form.querySelector('.sky-where-when-status')?.insertAdjacentElement('beforebegin',section);
}
function availableName(name,records,excludeRecord){
  const excludedId=realRecordId(excludeRecord),excludedName=normalize(excludeRecord?.name);
  const taken=new Set(records.filter(record=>{
    if(record===excludeRecord)return false;
    const rid=realRecordId(record);if(excludedId&&rid===excludedId)return false;
    if(!excludedId&&excludedName&&normalize(record.name)===excludedName)return false;
    return true;
  }).map(record=>normalize(record.name)).filter(Boolean));
  const match=String(name).trim().match(/^(.*?)(?:\s+(\d+))?$/),hasSuffix=match?.[2]&&Number(match[2])>=2,root=(hasSuffix?match[1]:String(name).trim()).trim();let n=hasSuffix?Number(match[2])+1:2,candidate=`${root} ${n}`;
  while(taken.has(normalize(candidate))){n+=1;candidate=`${root} ${n}`}
  return candidate;
}
function showNameProblem(form,message){const help=form.querySelector('[data-ww-sky-name-help]');if(help){help.textContent=message;help.style.color='#a51d1a'}form.querySelector('[data-ww-sky-name]')?.focus()}
function clearNameProblem(form){const help=form.querySelector('[data-ww-sky-name-help]');if(help){help.textContent='This sky will be saved when you use this Where and When.';help.style.color=''}}
function showConflict(form,name,suggestion,resume){
  const box=form.querySelector('[data-ww-sky-name-conflict]');if(!box)return;
  box.replaceChildren();box.hidden=false;box.dataset.resume=resume;box.dataset.suggestion=suggestion;
  const text=document.createElement('p');text.textContent=`“${name}” is already used. Save this sky with the next available name, or rename it.`;
  const actions=document.createElement('div');actions.className='sky-where-when-name-conflict-actions';
  const use=document.createElement('button');use.type='button';use.dataset.wwNameUseSuggestion='true';use.textContent=`Use “${suggestion}”`;
  const rename=document.createElement('button');rename.type='button';rename.dataset.wwNameRename='true';rename.textContent='Rename';
  actions.append(use,rename);box.append(text,actions);
}
function prepareSave(form,resume){
  injectNameField(form);
  const slot=form.dataset.slot,input=form.querySelector('[data-ww-sky-name]'),name=String(input?.value||'').trim();
  clearNameProblem(form);
  const box=form.querySelector('[data-ww-sky-name-conflict]');if(box)box.hidden=true;
  if(!name){showNameProblem(form,'Name this sky before using this Where and When.');input?.focus();return false}
  const records=rawLibrary(),previous=activeRecord(slot,records),previousId=realRecordId(previous),previousName=String(previous?.name||'').trim();
  const duplicate=records.find(record=>{
    if(record===previous)return false;
    const rid=realRecordId(record);if(previousId&&rid===previousId)return false;
    if(!previousId&&previousName&&normalize(record.name)===normalize(previousName))return false;
    return normalize(record.name)===normalize(name);
  });
  if(duplicate){showConflict(form,name,availableName(name,records,previous),resume);return false}
  pendingSave[slot]={name,previousId,previousName};
  return true;
}
function applyNamedIdentity(value,name,id){
  const next=clone(value||{});next.name=name;next.title=name;next.displayName=name;next.skyName=name;next.saved=true;
  next.metadata=next.metadata&&typeof next.metadata==='object'?next.metadata:{};next.metadata.savedSkyId=id;next.metadata.savedSkyName=name;next.metadata.savedSkyLoadedAt=new Date().toISOString();next.metadata.name=name;next.metadata.title=name;
  next.calcProfile=next.calcProfile&&typeof next.calcProfile==='object'?next.calcProfile:{};next.calcProfile.name=name;next.calcProfile.title=name;
  return next;
}
function commitPending(slot){
  const pending=pendingSave[slot];if(!pending)return;
  const value=payload(slot);if(!value||!hasPlacements(value))return;
  pendingSave[slot]=null;
  const records=rawLibrary();let index=-1;
  if(pending.previousId)index=records.findIndex(record=>realRecordId(record)===pending.previousId);
  if(index<0&&pending.previousName)index=records.findIndex(record=>normalize(record.name)===normalize(pending.previousName));
  const previous=index>=0?records[index]:null,id=realRecordId(previous)||newId(),now=new Date().toISOString(),active=applyNamedIdentity(value,pending.name,id),record=clone(active);
  delete active.savedAt;delete active.updatedAt;
  record.id=id;record.savedAt=previous?.savedAt||record.savedAt||now;record.updatedAt=now;
  if(index>=0)records[index]=record;else records.push(record);
  if(!writeJson(LIBRARY_KEY,records)||!writeJson(SLOT_KEYS[slot],active))return;
  dispatchSlot(slot);
  window.dispatchEvent(new CustomEvent('relphi:saved-sky-library-changed',{detail:{slot,name:pending.name,id,action:index>=0?'update':'create'}}));
  window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot,name:pending.name,source:'where-when-auto-save'}}));
}

function decorate(){
  document.querySelectorAll('.sky-where-when-editor[data-slot]').forEach(injectNameField);
  decorateLibrary();
  document.querySelectorAll('#skySavedSkiesPopover [data-sky-command="save"],#skySavedSkiesPopover [data-sky-command-save-form]').forEach(node=>node.hidden=true);
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate()})}

// Saved-sky chevrons go straight through the old command shell into the fingerprint library.
document.addEventListener('click',event=>{
  const trigger=event.target.closest('[data-saved-sky-trigger]');if(!trigger)return;
  requestAnimationFrame(()=>directToLibrary(trigger));
});
// The library back arrow now closes the picker instead of revealing the obsolete command menu.
document.addEventListener('click',event=>{
  const back=event.target.closest('#skySavedSkiesPopover [data-sky-menu-back]');if(!back)return;
  const slot=slotFromOpenTrigger();if(!slot)return;event.preventDefault();event.stopImmediatePropagation();closePicker(slot);
},true);
document.addEventListener('click',event=>{
  const create=event.target.closest('[data-sky-create-new-button]');if(create){event.preventDefault();event.stopImmediatePropagation();const slot=slotFromOpenTrigger();if(slot)createNew(slot);return}
  const suggestion=event.target.closest('[data-ww-name-use-suggestion]');if(suggestion){event.preventDefault();const form=suggestion.closest('.sky-where-when-editor'),box=form?.querySelector('[data-ww-sky-name-conflict]'),input=form?.querySelector('[data-ww-sky-name]');if(!form||!box||!input)return;input.value=box.dataset.suggestion||input.value;box.hidden=true;const resume=box.dataset.resume||'submit';if(resume==='use-now')form.querySelector('[data-ww-action="use-now"]')?.click();else form.requestSubmit();return}
  const rename=event.target.closest('[data-ww-name-rename]');if(rename){event.preventDefault();const form=rename.closest('.sky-where-when-editor'),box=form?.querySelector('[data-ww-sky-name-conflict]'),input=form?.querySelector('[data-ww-sky-name]');if(box)box.hidden=true;input?.focus();input?.select();return}
  const cancel=event.target.closest('[data-ww-action="cancel"]');if(cancel){const form=cancel.closest('.sky-where-when-editor');if(form?.dataset.slot)pendingSave[form.dataset.slot]=null}
},true);
// Use Now is also a commit path in the existing Where & When controller, so it obeys the same naming rules.
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-ww-action="use-now"]');if(!button)return;const form=button.closest('.sky-where-when-editor');if(!form)return;
  if(!prepareSave(form,'use-now')){event.preventDefault();event.stopImmediatePropagation()}
},true);
// Normal final confirmation: validate name first, then let the native Where & When calculation run unchanged.
document.addEventListener('submit',event=>{
  const form=event.target.closest('.sky-where-when-editor');if(!form)return;
  if(!prepareSave(form,'submit')){event.preventDefault();event.stopImmediatePropagation()}
},true);
document.addEventListener('input',event=>{const input=event.target.closest('[data-ww-sky-name]');if(!input)return;const form=input.closest('.sky-where-when-editor'),box=form?.querySelector('[data-ww-sky-name-conflict]');if(box)box.hidden=true;clearNameProblem(form)});
window.addEventListener('relphi:sky-working-copy-updated',event=>{const slot=event.detail?.slot;if(SLOT_KEYS[slot]&&event.detail?.source==='where-when')commitPending(slot)});
window.addEventListener('relphi:sky-where-when-committed',event=>{(event.detail?.slots||[]).forEach(slot=>{if(SLOT_KEYS[slot])commitPending(slot)})});
window.addEventListener('relphi:saved-sky-library-changed',schedule);
window.addEventListener('relphi:sky-foundation-ready',schedule);
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-expanded','hidden']});
schedule();
})();
