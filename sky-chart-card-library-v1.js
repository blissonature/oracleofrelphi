/* Sky Card library: an intentionally compact fingerprint browser, not an address-book list. */
(function(){
'use strict';
if(window.__relphiSkyCardLibraryV1)return;window.__relphiSkyCardLibraryV1=true;
const KEY='relphiSkyCardFoldersV1',POPOVER='#skySavedSkiesPopover',DEFAULTS=['All','Family','Clients','Events','Study','Unfiled'];
let filter='All',query='',editingFolder='',queued=false;
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(_){return {}}};
const write=data=>{try{localStorage.setItem(KEY,JSON.stringify(data));return true}catch(_){return false}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
const library=()=>window.RelphiSkySavedSkyIdentity?.library?.()||[];
const id=r=>String(r?.id||r?.savedSkyId||r?.metadata?.savedSkyId||'');
function decorate(){
  queued=false;const pop=document.querySelector(POPOVER);
  if(!pop||pop.hidden)return;const list=pop.querySelector('.sky-saved-list');if(!list)return;
  pop.classList.add('sky-library-redesigned');
  let toolbar=list.querySelector(':scope > .sky-library-controls');
  if(!toolbar){
    toolbar=document.createElement('div');toolbar.className='sky-library-controls';
    toolbar.innerHTML='<div class="sky-library-heading"><strong>Saved skies</strong><span>Fingerprint library</span></div><label class="sky-library-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.4"/><path d="m15.5 15.5 4.5 4.5"/></svg><input type="search" data-sky-library-search placeholder="Find a saved sky…" autocomplete="off" aria-label="Search saved skies by name"></label><div class="sky-library-folders" aria-label="Saved sky folders"></div><div class="sky-library-utility"><span data-sky-library-count></span><span>Hover or hold a fingerprint to see its name</span></div>';
    list.prepend(toolbar);
  }
  const records=library(),data=read();
  const custom=[...new Set(Object.values(data).filter(v=>typeof v==='string'&&v&&!DEFAULTS.includes(v)))].sort((a,b)=>a.localeCompare(b));
  const folders=[...DEFAULTS,...custom];if(!folders.includes(filter))filter='All';
  const chips=toolbar.querySelector('.sky-library-folders');
  const chipHtml=folders.map(folder=>'<button type="button" class="sky-library-folder'+(folder===filter?' is-selected':'')+'" data-sky-library-folder="'+esc(folder)+'" aria-pressed="'+(folder===filter)+'">'+esc(folder)+'</button>').join('')+'<button type="button" class="sky-library-folder sky-library-add-folder" data-sky-library-add-folder aria-label="Create a folder">+ Folder</button>';
  if(chips.dataset.list!==chipHtml){chips.innerHTML=chipHtml;chips.dataset.list=chipHtml}
  const input=toolbar.querySelector('[data-sky-library-search]');if(input!==document.activeElement&&input.value!==query)input.value=query;
  const normalized=query.trim().toLocaleLowerCase();
  let visible=0;
  list.querySelectorAll('.sky-saved-list-row').forEach(row=>{
    const button=row.querySelector('[data-saved-sky-ref]');if(!button)return;
    const record=records.find(r=>id(r)===button.dataset.savedSkyRef);if(!record)return;
    const name=String(record.name||'Saved sky');
    const folder=data[id(record)]||'Unfiled';
    const show=(!normalized||name.toLocaleLowerCase().includes(normalized))&&(filter==='All'||filter===folder);
    row.hidden=!show;if(show)visible++;
    // Overlay occupies the exact fingerprint footprint: there is no reserved
    // name/date/location column, even when privacy detail is revealed.
    let overlay=button.querySelector('.sky-library-identity-overlay');
    if(!overlay){overlay=document.createElement('span');overlay.className='sky-library-identity-overlay';overlay.setAttribute('aria-hidden','true');button.appendChild(overlay)}
    overlay.textContent=name;
    button.dataset.skyLibraryFolder=folder;
    const detail=button.querySelector('[data-saved-fingerprint-copy]');
    if(detail)detail.hidden=true;
    let controls=row.querySelector('.sky-library-row-actions');
    if(!controls){
      controls=document.createElement('div');controls.className='sky-library-row-actions';
      controls.innerHTML='<button type="button" data-sky-folder-edit aria-label="Organize saved sky" title="Organize">⋯</button><select data-sky-folder-select aria-label="Move saved sky to folder" hidden></select>';
      row.appendChild(controls);
    }
    const select=controls.querySelector('select');
    if(controls.dataset.folders!==folders.join('|')){
      select.replaceChildren(...folders.filter(x=>x!=='All').map(folder=>new Option(folder,folder)));
      controls.dataset.folders=folders.join('|');
    }
    if(select.value!==folder)select.value=folder;
  });
  toolbar.querySelector('[data-sky-library-count]').textContent=visible+' of '+records.length+' skies';
  let empty=list.querySelector(':scope > .sky-library-empty-results');
  if(!empty){empty=document.createElement('p');empty.className='sky-library-empty-results';list.appendChild(empty)}
  empty.textContent=normalized?'No skies match that name.':'No skies in this folder.';
  empty.hidden=visible!==0;
  list.querySelector('.sky-saved-library-instruction')?.remove();
  const top=pop.querySelector('.sky-library-slot-actions');
  if(!top){const actions=document.createElement('div');actions.className='sky-library-slot-actions';actions.innerHTML='<button type="button" data-sky-card-swap>⇄ <span>Swap A / B</span></button><button type="button" data-sky-card-promote>← <span>Move B to A</span></button><button type="button" data-sky-card-unload>× <span>Unload</span></button>';pop.prepend(actions)}
  const controlsTop=pop.querySelector('.sky-library-slot-actions');
  const slot=document.querySelector('[data-saved-sky-trigger][aria-expanded="true"]')?.dataset.savedSkyTrigger||'A';
  const hasB=window.RelphiSkySlotControls?.hasSkyB?.()===true;
  controlsTop.querySelector('[data-sky-card-swap]').disabled=!hasB;
  controlsTop.querySelector('[data-sky-card-promote]').disabled=!hasB;
  controlsTop.querySelector('[data-sky-card-unload] span').textContent='Unload Sky '+slot;
}
function schedule(){if(queued)return;queued=true;queueMicrotask(decorate)}
document.addEventListener('input',e=>{if(e.target.matches?.(POPOVER+' [data-sky-library-search]')){query=e.target.value;schedule()}},true);
document.addEventListener('click',e=>{
 const p=e.target.closest?.(POPOVER);if(!p)return;
 const folder=e.target.closest('[data-sky-library-folder]');if(folder){e.preventDefault();e.stopImmediatePropagation();filter=folder.dataset.skyLibraryFolder;schedule();return}
 if(e.target.closest('[data-sky-library-add-folder]')){
   e.preventDefault();e.stopImmediatePropagation();
   const value=window.prompt('New folder name (e.g., Research)', '');
   const folder=String(value||'').trim().slice(0,44);
   if(folder){const map=read();map['__folder__'+folder]=folder;write(map);filter=folder;schedule()}return;
 }
 const organize=e.target.closest('[data-sky-folder-edit]');
 if(organize){e.preventDefault();e.stopImmediatePropagation();const select=organize.parentElement.querySelector('select');select.hidden=!select.hidden;if(!select.hidden)select.focus();return}
 const action=e.target.closest('[data-sky-card-swap],[data-sky-card-promote],[data-sky-card-unload]');
 if(action){
   e.preventDefault();e.stopImmediatePropagation();
   const controls=window.RelphiSkySlotControls,slot=document.querySelector('[data-saved-sky-trigger][aria-expanded="true"]')?.dataset.savedSkyTrigger||'A';
   if(action.hasAttribute('data-sky-card-swap'))controls?.swapSkies?.();
   if(action.hasAttribute('data-sky-card-promote'))(function(){localStorage.removeItem('relphiSkyChartA');window.dispatchEvent(new StorageEvent('storage',{key:'relphiSkyChartA'}));controls?.promoteSkyBToA?.()})()
   if(action.hasAttribute('data-sky-card-unload')){
     if(slot==='B')controls?.removeSkyB?.();
     else if(controls?.hasSkyB?.()){localStorage.removeItem('relphiSkyChartA');window.dispatchEvent(new StorageEvent('storage',{key:'relphiSkyChartA'}));controls?.promoteSkyBToA?.();}
     else {localStorage.removeItem('relphiSkyChartA');window.dispatchEvent(new StorageEvent('storage',{key:'relphiSkyChartA'}));}
   }
   p.hidden=true;document.querySelectorAll('[data-saved-sky-trigger]').forEach(node=>node.setAttribute('aria-expanded','false'));
   return;
 }
},true);
document.addEventListener('change',e=>{
 if(!e.target.matches?.(POPOVER+' [data-sky-folder-select]'))return;
 e.stopImmediatePropagation();
 const ref=e.target.closest('.sky-saved-list-row')?.querySelector('[data-saved-sky-ref]')?.dataset.savedSkyRef;
 if(!ref)return;const map=read();map[ref]=e.target.value;write(map);e.target.hidden=true;schedule();
},true);
['relphi:saved-sky-library-changed','relphi:saved-sky-active-changed','relphi:sky-slots-swapped'].forEach(name=>window.addEventListener(name,schedule));
document.addEventListener('click',e=>{if(e.target.closest?.('[data-saved-sky-trigger],'+POPOVER))schedule()},true);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule,{once:true}):schedule();
window.RelphiSkyCardLibrary={refresh:schedule};
})();
