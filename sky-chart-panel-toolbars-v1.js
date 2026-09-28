// Presentation bridge for the approved Sky Chart Focus / Relationships mockup.
// Existing filter controllers remain the source of truth; this file mirrors state only.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyPanelToolbarsV1)return;
window.__relphiSkyPanelToolbarsV1=true;

let queued=false,observer=null;

function text(node){return String(node?.textContent||'').replace(/\s+/g,' ').trim()}
function placeholder(owner,target,label,neutral=/^(all|everything)$/i){
  if(!owner||!target)return;
  const value=text(target);
  const empty=neutral.test(value);
  if(empty){
    owner.dataset.toolbarPlaceholder=label;
    target.dataset.toolbarPlaceholderTarget=label;
  }else{
    delete owner.dataset.toolbarPlaceholder;
    delete target.dataset.toolbarPlaceholderTarget;
  }
}
function syncFocus(){
  const display=document.querySelector('#skyFoundationFocus [data-relationship-display-control]');
  placeholder(display,display?.querySelector('[data-relationship-display-value-text]'),'Display');

  const placements=document.querySelector('#skyFoundationFocus [data-placement-filter="combined"]');
  placeholder(placements,placements?.querySelector('[data-placement-filter-summary]'),'Placements');

  const signs=document.querySelector('#skyFoundationFocus [data-zodiac-filter="true"]');
  placeholder(signs,signs?.querySelector('[data-zodiac-summary]'),'Signs');

  const houses=document.querySelector('#skyFoundationFocus [data-house-filter="combined"]');
  placeholder(houses,houses?.querySelector('[data-house-filter-summary]'),'Houses');
}
function activeConfigurationSummary(){
  const api=window.RelphiAspectConfigurations,matrix=api?.matrix?.(),types=api?.types||[];
  if(!matrix||!types.length)return'Configurations';
  const activeScopes=document.documentElement.dataset.skyBPresent==='true'?['A-A','B-B','A-B']:['A-A'];
  const selected=new Set(activeScopes.flatMap(scope=>Array.isArray(matrix[scope])?matrix[scope]:[]));
  const all=activeScopes.every(scope=>(matrix[scope]||[]).length===types.length);
  if(all)return'Configurations';
  if(selected.size===0)return'None';
  if(selected.size===1){
    const id=[...selected][0];
    return types.find(type=>type.id===id)?.label||'1 selected';
  }
  return selected.size+' selected';
}
function aspectSummary(){
  const value=text(document.querySelector('[data-aspect-filter-summary]'));
  return !value||/^all$/i.test(value)?'Aspects':value;
}
function positionAspectPopover(anchor,configuration=false){
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const pop=document.getElementById('skyChartAspectPopover');
    if(!pop||pop.hidden)return;
    const rect=anchor.getBoundingClientRect(),margin=12,gap=5;
    const width=Math.min(390,Math.max(280,window.innerWidth-margin*2));
    const left=Math.max(margin,Math.min(rect.left,window.innerWidth-width-margin));
    pop.style.position='fixed';
    pop.style.width=width+'px';
    pop.style.left=left+'px';
    pop.style.right='auto';
    pop.style.top=Math.min(window.innerHeight-margin,rect.bottom+gap)+'px';
    pop.style.bottom='auto';
    pop.style.zIndex='10000';
    if(configuration){
      const section=pop.querySelector('.sky-chart-configuration-section');
      section?.scrollIntoView?.({block:'nearest'});
      section?.classList.add('is-toolbar-target');
    }else{
      pop.querySelector('.sky-chart-configuration-section')?.classList.remove('is-toolbar-target');
      pop.scrollTop=0;
    }
  }));
}
function openAspectSurface(anchor,configuration){
  const real=document.querySelector('[data-aspect-filter-toggle]');
  const pop=document.getElementById('skyChartAspectPopover');
  if(!real)return;
  if(!pop||pop.hidden)real.click();
  positionAspectPopover(anchor,configuration);
}
function ensureProxy(actions,key,label,configuration){
  let button=actions.querySelector('[data-sky-toolbar-proxy="'+key+'"]');
  if(!button){
    button=document.createElement('button');
    button.type='button';
    button.className='sky-toolbar-proxy';
    button.dataset.skyToolbarProxy=key;
    button.setAttribute('aria-haspopup','dialog');
    button.addEventListener('click',()=>openAspectSurface(button,configuration));
    actions.insertBefore(button,actions.firstChild);
  }
  button.textContent=label;
  button.setAttribute('aria-label',label+' filters');
  return button;
}
function syncSort(){
  const select=document.querySelector('#skyFoundationRelationships .sky-relationship-sort-select');
  if(!select)return;
  const control=select.closest('.sky-relationship-sort-control');
  if(!control)return;
  if(!select.dataset.toolbarTouched){
    control.dataset.toolbarPlaceholder='Sort';
    select.setAttribute('aria-label','Sort relationships');
    const selected=select.selectedOptions?.[0];
    if(selected&&selected.dataset.toolbarOriginalLabel===undefined){
      selected.dataset.toolbarOriginalLabel=selected.textContent;
      selected.textContent='Sort';
    }
  }
  if(select.dataset.toolbarListener!=='true'){
    select.dataset.toolbarListener='true';
    select.addEventListener('change',()=>{
      select.querySelectorAll('option[data-toolbar-original-label]').forEach(option=>{
        option.textContent=option.dataset.toolbarOriginalLabel;
        delete option.dataset.toolbarOriginalLabel;
      });
      select.dataset.toolbarTouched='true';
      delete control.dataset.toolbarPlaceholder;
    });
  }
}
function syncRelationships(){
  const actions=document.querySelector('#skyFoundationRelationships .sky-foundation-relationships-heading>.sky-relationship-heading-actions');
  if(!actions)return;
  ensureProxy(actions,'aspects',aspectSummary(),false);
  ensureProxy(actions,'configurations',activeConfigurationSummary(),true);
  syncSort();
}
function sync(){
  queued=false;
  syncFocus();
  syncRelationships();
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(sync))}
function start(){
  schedule();
  ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-placement-multiselect-changed',
   'relphi:sky-house-multiselect-changed','relphi:sky-zodiac-filter-changed','relphi:sky-aspect-multiselect-changed',
   'relphi:sky-configuration-selection-changed','relphi:sky-configurations-detected','relphi:sky-display-changed',
   'relphi:relationship-display-changed'].forEach(name=>window.addEventListener(name,schedule));
  document.addEventListener('change',schedule,true);
  observer=new MutationObserver(schedule);
  observer.observe(document.getElementById('skyFoundationComparison')||document.body,{subtree:true,childList:true,characterData:true});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
