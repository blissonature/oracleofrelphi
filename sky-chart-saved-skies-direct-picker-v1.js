// Saved Skies direct-picker presentation extension.
(function(){
'use strict';
if(window.__relphiSkySavedSkiesDirectPickerV1)return;
window.__relphiSkySavedSkiesDirectPickerV1=true;
let observer=null,queued=false;
function normalizePicker(){
  queued=false;
  const popover=document.getElementById('skySavedSkiesPopover');if(!popover||popover.hidden)return;
  const load=popover.querySelector('[data-sky-command="load"]');if(load){load.click();return}
  const heading=popover.querySelector('.sky-saved-subview-head strong');if(heading&&heading.textContent!=='Saved Skies')heading.textContent='Saved Skies';
  const list=popover.querySelector('.sky-saved-list');if(!list)return;
  if(!list.querySelector('[data-sky-create-new]')){
    const row=document.createElement('div');row.className='sky-create-new-row';row.dataset.skyCreateNew='true';
    const button=document.createElement('button');button.type='button';button.className='sky-create-new-button';button.dataset.skyCommand='new';button.setAttribute('aria-label','Create a new blank sky');
    const plus=document.createElement('span');plus.className='sky-create-new-plus';plus.setAttribute('aria-hidden','true');plus.textContent='+';
    const label=document.createElement('span');label.textContent='New Sky';button.append(plus,label);row.appendChild(button);list.prepend(row);
  }
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(normalizePicker)}
function watch(){const popover=document.getElementById('skySavedSkiesPopover');if(!popover){requestAnimationFrame(watch);return}observer=new MutationObserver(schedule);observer.observe(popover,{childList:true,subtree:true});normalizePicker()}
document.addEventListener('click',event=>{if(event.target.closest?.('[data-saved-sky-trigger]'))requestAnimationFrame(normalizePicker)},true);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',watch,{once:true}):watch();
})();
