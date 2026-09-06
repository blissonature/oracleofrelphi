// Sky identity affordance: make naming/saving discoverable without mixing it into Where and When.
// Also presents the Planetary Hours jump as a secondary tool action.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyIdentityAffordanceV1)return;
window.__relphiSkyIdentityAffordanceV1=true;

const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
let queued=false,observer=null;

function installStyle(){
  if(document.getElementById('skyIdentityAffordanceStyleV1'))return;
  const style=document.createElement('style');
  style.id='skyIdentityAffordanceStyleV1';
  style.textContent=`
    .sky-saved-name-trigger .sky-header-save-state{
      flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;
      margin-left:auto;padding:2px 5px;border-radius:999px;background:#f2ece5;color:#6a625a;
      font:850 .46rem/1 system-ui,sans-serif;letter-spacing:.035em;text-transform:uppercase
    }
    .sky-saved-name-trigger .sky-saved-name-label{flex:1 1 auto}
    .sky-sky-save-cue{
      display:flex;align-items:center;justify-content:center;gap:6px;min-width:0;width:100%;box-sizing:border-box;
      padding:6px 7px;border:1px solid rgba(31,27,24,.12);border-radius:10px;background:#faf7f2;color:#665e57;
      font:700 .59rem/1.25 system-ui,sans-serif;text-align:center
    }
    .sky-sky-save-cue strong{color:#2b2622;font-weight:900}
    .sky-sky-save-cue .sky-open-sky-menu{flex:0 0 auto;width:auto!important;padding:.45rem .62rem!important;font-size:.59rem!important}
    .sky-where-when-ph-jump.sky-where-when-button{
      display:inline-flex!important;align-items:center;justify-content:center;justify-self:center;width:auto!important;
      position:static!important;margin:0 auto!important;padding:.52rem .72rem!important;text-decoration:none!important;color:#211d19!important
    }
    .sky-saved-command[data-sky-command="save"].sky-name-save-primary{
      border-color:rgba(31,27,24,.2);background:#f5f0e9;font-weight:900
    }
    .sky-save-edit-note{
      margin:6px;padding:9px 10px;border:1px solid rgba(31,27,24,.12);border-radius:9px;background:#faf7f2;
      color:#625950;font:700 .62rem/1.35 system-ui,sans-serif;text-align:center
    }
    @media(max-width:620px){
      .sky-sky-save-cue{flex-wrap:wrap}
      .sky-saved-name-trigger .sky-header-save-state{display:none}
    }
  `;
  document.head.appendChild(style);
}
function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
function hasPlacements(value){
  if(!value||typeof value!=='object')return false;
  const source=[value.placements,value.positions,value.points,value.bodies].find(candidate=>candidate&&typeof candidate==='object'&&!Array.isArray(candidate));
  return!!source&&Object.values(source).some(item=>item&&typeof item==='object'&&!Array.isArray(item)&&(Number.isFinite(Number(item.longitude))||String(item.sign||item.zodiac||'').trim()));
}
function editing(slot){
  try{if(window.RelphiSkyWhereWhenTransaction?.slots?.().includes(slot))return true}catch(_){}
  return!!document.querySelector(`.sky-where-when-editor[data-slot="${slot}"]`);
}
function state(slot){
  try{const result=window.RelphiSkySavedSkyIdentity?.identity?.(slot);if(result)return result}catch(_){}
  const value=read(slot),meta=value?.metadata&&typeof value.metadata==='object'?value.metadata:{};
  return{name:String(meta.savedSkyName||value?.name||'Where and When'),saved:!!String(meta.savedSkyId||meta.savedSkyName||'').trim(),dirty:false};
}
function trigger(slot){return document.querySelector(`#skyFoundation${slot} [data-saved-sky-trigger="${slot}"]`)}
function decorateHeader(slot){
  const button=trigger(slot);if(!button)return;
  const info=state(slot),value=read(slot),show=!editing(slot)&&!info.saved&&hasPlacements(value);
  let badge=button.querySelector(':scope > .sky-header-save-state');
  if(!show){badge?.remove();return}
  if(!badge){badge=document.createElement('span');badge.className='sky-header-save-state';badge.setAttribute('aria-hidden','true');const chevron=button.querySelector(':scope > .sky-saved-name-chevron');button.insertBefore(badge,chevron||null)}
  if(badge.textContent!=='Unsaved')badge.textContent='Unsaved';
}
function cue(slot){
  const box=document.createElement('div');box.className='sky-sky-save-cue';box.dataset.skySaveCue=slot;
  const text=document.createElement('span');text.innerHTML='<strong>Unsaved sky</strong> · Name &amp; save in';
  const button=document.createElement('button');button.type='button';button.className='sky-where-when-button secondary sky-open-sky-menu';button.dataset.openSkyMenu=slot;button.textContent='Sky menu';
  box.append(text,button);return box;
}
function decorateCue(slot){
  const panel=document.getElementById(`skyFoundation${slot}`);if(!panel)return;
  const info=state(slot),value=read(slot),isEditing=editing(slot),show=!isEditing&&!info.saved&&hasPlacements(value);
  let existing=panel.querySelector(`[data-sky-save-cue="${slot}"]`);
  if(!show){existing?.remove();return}
  const confirmed=panel.querySelector('.sky-where-when-confirmed');
  if(confirmed&&!confirmed.closest('[hidden]')){
    if(existing&&existing.parentElement===confirmed)return;
    existing?.remove();confirmed.appendChild(cue(slot));return;
  }
  existing?.remove();
}
function decoratePlanetaryHours(){
  document.querySelectorAll('.sky-where-when-editor .sky-where-when-ph-jump').forEach(link=>{
    if(link.dataset.skyPhAction==='true')return;
    link.dataset.skyPhAction='true';link.classList.add('sky-where-when-button','secondary');
    link.textContent='Open in Planetary Hours';
    link.setAttribute('aria-label','Open this moment in Planetary Hours');
  });
}
function expandedSlot(){
  const open=document.querySelector('[data-saved-sky-trigger][aria-expanded="true"]');
  const slot=String(open?.dataset?.savedSkyTrigger||'').toUpperCase();return slot==='A'||slot==='B'?slot:'';
}
function editNote(){const note=document.createElement('div');note.className='sky-save-edit-note';note.dataset.skySaveEditNote='true';note.textContent='Confirm with “Use This Where and When” before naming or saving this sky.';return note}
function decorateMenu(){
  const menu=document.getElementById('skySavedSkiesPopover');if(!menu||menu.hidden)return;
  const slot=expandedSlot();if(!slot)return;
  menu.querySelectorAll('[data-sky-save-edit-note]').forEach(node=>node.remove());
  const isEditing=editing(slot),info=state(slot),save=menu.querySelector('[data-sky-command="save"]'),saveForm=menu.querySelector('[data-sky-command-save-form]');
  if(isEditing){
    if(save)save.hidden=true;
    if(saveForm){saveForm.hidden=true;saveForm.before(editNote())}
    else{const list=menu.querySelector('.sky-saved-command-list');if(list)list.prepend(editNote())}
    return;
  }
  if(save)save.hidden=false;
  if(saveForm)saveForm.hidden=false;
  if(save){
    save.classList.toggle('sky-name-save-primary',!info.saved);
    const label=save.querySelector('span');if(label&&!info.saved&&label.textContent!=='Name & Save Sky')label.textContent='Name & Save Sky';
    if(!info.saved&&save.parentElement?.classList.contains('sky-saved-command-list')&&save.parentElement.firstElementChild!==save)save.parentElement.prepend(save);
  }
  if(!info.saved){
    const head=menu.querySelector('.sky-saved-subview-head strong');if(head&&head.textContent.trim()==='Save Sky')head.textContent='Name & Save Sky';
    const submit=menu.querySelector('[data-sky-command-save-form] button[type="submit"]');if(submit&&submit.textContent.trim()==='Save Sky')submit.textContent='Name & Save Sky';
  }
}
function apply(){queued=false;installStyle();decoratePlanetaryHours();['A','B'].forEach(slot=>{decorateHeader(slot);decorateCue(slot)});decorateMenu()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(apply))}

document.addEventListener('click',event=>{
  const opener=event.target.closest?.('[data-open-sky-menu]');if(!opener)return;
  event.preventDefault();event.stopPropagation();const slot=String(opener.dataset.openSkyMenu||'').toUpperCase(),button=trigger(slot);if(!button)return;
  if(button.getAttribute('aria-expanded')!=='true')button.click();
},true);

function start(){
  installStyle();schedule();
  observer=new MutationObserver(records=>{
    if(records.every(record=>record.target?.closest?.('[data-sky-save-cue],.sky-header-save-state,[data-sky-save-edit-note]')))return;
    schedule();
  });
  observer.observe(document.body,{childList:true,subtree:true});
  ['storage','relphi:sky-foundation-ready','relphi:sky-name-updated','relphi:saved-sky-library-changed','relphi:saved-sky-active-changed','relphi:sky-where-when-edit-state-changed','relphi:sky-where-when-committed'].forEach(name=>window.addEventListener(name,schedule));
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
