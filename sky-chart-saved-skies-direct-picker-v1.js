// Saved Skies direct-picker presentation extension.
// The picker is finalized synchronously in the same click task so users never see the intermediate command view.
(function(){
'use strict';
if(window.__relphiSkySavedSkiesDirectPickerV2)return;
window.__relphiSkySavedSkiesDirectPickerV1=true;
window.__relphiSkySavedSkiesDirectPickerV2=true;
let queued=false;

function ensureNewSky(list){
  let row=list.querySelector(':scope > [data-sky-create-new]');
  if(row)return row;
  row=document.createElement('div');row.className='sky-create-new-row';row.dataset.skyCreateNew='true';
  const button=document.createElement('button');button.type='button';button.className='sky-create-new-button';button.dataset.skyCommand='new';button.setAttribute('aria-label','Create a new blank sky');
  const plus=document.createElement('span');plus.className='sky-create-new-plus';plus.setAttribute('aria-hidden','true');plus.textContent='+';
  const label=document.createElement('span');label.className='sky-create-new-label';label.textContent='New Sky';
  button.append(plus,label);row.appendChild(button);list.prepend(row);return row;
}
function normalizePicker(){
  queued=false;
  const popover=document.getElementById('skySavedSkiesPopover');if(!popover||popover.hidden)return;
  const load=popover.querySelector('[data-sky-command="load"]');if(load)load.click();
  const heading=popover.querySelector('.sky-saved-subview-head strong');if(heading&&heading.textContent!=='Saved Skies')heading.textContent='Saved Skies';
  const list=popover.querySelector('.sky-saved-list');if(!list)return;
  ensureNewSky(list);
  // These run synchronously/microtask-only; neither owns a DOM observer anymore.
  window.RelphiSkyPrivateLoad?.redactNow?.();
  window.RelphiSkySavedSkiesLabels?.decorateNow?.();
}
function schedule(){if(queued)return;queued=true;queueMicrotask(normalizePicker)}
function start(){
  document.addEventListener('click',event=>{
    if(event.target.closest?.('[data-saved-sky-trigger]')){normalizePicker();return}
    if(event.target.closest?.('#skySavedSkiesPopover'))schedule();
  },true);
  ['relphi:saved-sky-library-changed','relphi:saved-sky-active-changed'].forEach(name=>window.addEventListener(name,schedule));
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
