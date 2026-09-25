// Shared relationship result limit: caps the current sorted/filtered Relationships set without changing eligibility.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiRelationshipLimitV1)return;
window.__relphiRelationshipLimitV1=true;

const PRESETS=Object.freeze([10,20,50]);
const HIDDEN_CLASSES=Object.freeze([
  'sky-foundation-single-sky-cross-hidden','sky-chart-filter-hidden','sky-chart-orb-hidden','sky-orb-filter-hidden',
  'sky-chart-multiselect-hidden','sky-chart-house-multiselect-hidden','sky-chart-aspect-multiselect-hidden',
  'sky-chart-zodiac-filter-hidden','sky-chart-sign-filter-hidden','sky-chart-semantic-hidden'
]);
const CAP_CLASS='sky-chart-result-limit-hidden';
let limit='all',queued=false,listObserver=null,observedList=null,lastState='';

function normalize(value){
  const text=String(value??'all').trim().toLowerCase();
  if(text==='all'||text==='max'||text==='')return'all';
  const number=Number(text);
  return Number.isInteger(number)&&number>0?String(number):'all';
}
function numericLimit(){return limit==='all'?Infinity:Number(limit)}
function hiddenByOther(row){
  if(!row||row.hidden||row.getAttribute('aria-hidden')==='true')return true;
  return HIDDEN_CLASSES.some(name=>row.classList.contains(name));
}
function rows(){
  return [...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]')];
}
function syncControl(){
  const input=document.querySelector('[data-relationship-limit]');
  if(!input)return;
  const next=limit==='all'?'':limit;
  if(input.value!==next)input.value=next;
  input.placeholder='Max';
}
function installStyles(){
  if(document.getElementById('skyRelationshipLimitV1Styles'))return;
  const style=document.createElement('style');
  style.id='skyRelationshipLimitV1Styles';
  style.textContent=`
.sky-chart-result-limit-hidden{display:none!important}
#skyFoundationRelationships .sky-relationship-limit-control{display:inline-flex;align-items:center;min-width:0;white-space:nowrap}
#skyFoundationRelationships .sky-relationship-limit-control>input{
  appearance:textfield;-moz-appearance:textfield;width:62px;min-width:62px;height:29px;box-sizing:border-box;margin:0;padding:0 8px;
  border:1px solid rgba(31,27,24,.18);border-radius:9px;background:#fff;color:#332e2a;
  font:800 .67rem/1 system-ui,sans-serif;text-align:center
}
#skyFoundationRelationships .sky-relationship-limit-control>input::-webkit-outer-spin-button,
#skyFoundationRelationships .sky-relationship-limit-control>input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
#skyFoundationRelationships .sky-relationship-limit-control>input:hover,
#skyFoundationRelationships .sky-relationship-limit-control>input:focus-visible{border-color:#6b625a;outline:none}
#skyFoundationRelationships .sky-relationship-limit-control>input::placeholder{color:#332e2a;opacity:1}
`;
  document.head.appendChild(style);
}
function placeMatchCount(actions){
  const count=document.getElementById('skyFoundationRelationshipCount');if(!actions||!count)return;
  const pill=actions.querySelector('.sky-relationship-copy-button,#skyChartRelationshipsExport');
  if(count.parentElement!==actions||count.nextElementSibling!==pill)actions.insertBefore(count,pill||null);
}
function ensureHeadingActions(){
  const heading=document.querySelector('#skyFoundationRelationships .sky-foundation-relationships-heading');
  if(!heading)return null;
  let actions=heading.querySelector(':scope>.sky-relationship-heading-actions');
  if(!actions){
    actions=document.createElement('span');
    actions.className='sky-relationship-heading-actions';
    const clear=heading.querySelector(':scope>#skyFoundationClearIsolation');
    heading.insertBefore(actions,clear||null);
    const copy=heading.querySelector(':scope>.sky-relationship-copy-button');
    const download=heading.querySelector(':scope>#skyChartRelationshipsExport');
    if(copy)actions.appendChild(copy);
    if(download)actions.appendChild(download);
  }
  placeMatchCount(actions);
  return actions;
}
function ensureControl(){
  installStyles();
  const actions=ensureHeadingActions();
  if(!actions)return null;
  let control=document.querySelector('#skyFoundationRelationships .sky-relationship-limit-control');
  if(!control){
    control=document.createElement('label');
    control.className='sky-relationship-limit-control';
    const input=document.createElement('input');
    input.type='number';
    input.min='1';
    input.step='1';
    input.inputMode='numeric';
    input.pattern='[0-9]*';
    input.dataset.relationshipLimit='true';
    input.setAttribute('aria-label','Maximum shown relationships');
    input.placeholder='Max';
    input.value=limit==='all'?'':limit;
    const commit=()=>{
      const raw=input.value.trim();
      if(raw===''){setLimit('all');return}
      const number=Number(raw);
      if(Number.isInteger(number)&&number>0){setLimit(String(number));return}
      syncControl();
    };
    input.addEventListener('change',commit);
    input.addEventListener('blur',commit);
    input.addEventListener('keydown',event=>{
      if(event.key==='Enter'){event.preventDefault();commit();input.blur()}
      if(event.key==='Escape'){event.preventDefault();syncControl();input.blur()}
    });
    control.appendChild(input);
  }
  const count=document.getElementById('skyFoundationRelationshipCount');
  const pill=actions.querySelector('.sky-relationship-copy-button,#skyChartRelationshipsExport');
  const anchor=count?.parentElement===actions?count:pill;
  if(control.parentElement!==actions||control.nextElementSibling!==anchor)actions.insertBefore(control,anchor||pill||null);
  placeMatchCount(actions);
  syncControl();
  return control;
}
function ensureHelper(){
  const list=document.getElementById('skyFoundationRelationshipList');if(!list)return null;
  let button=list.querySelector(':scope>[data-result-limit-show-more]');
  if(!button){
    button=document.createElement('button');
    button.type='button';
    button.className='sky-foundation-harmonic-show-more sky-foundation-result-limit-show-more';
    button.dataset.resultLimitShowMore='true';
    button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();revealMore()});
  }
  const harmonic=list.querySelector(':scope>[data-harmonic-show-more]');
  if(harmonic){if(button.nextElementSibling!==harmonic)list.insertBefore(button,harmonic)}
  else if(button!==list.lastElementChild)list.appendChild(button);
  return button;
}
function nextLimit(){
  if(limit==='all')return'all';
  const current=Number(limit),preset=PRESETS.find(value=>value>current);
  return preset?String(preset):'all';
}
function revealMore(){if(limit!=='all')setLimit(nextLimit())}
function setLimit(value){
  const next=normalize(value);
  if(next===limit){syncControl();schedule();return limit}
  limit=next;
  document.documentElement.dataset.skyRelationshipLimit=limit;
  syncControl();
  window.dispatchEvent(new CustomEvent('relphi:relationship-limit-changed',{detail:{limit}}));
  schedule();
  return limit;
}
function apply(){
  queued=false;
  ensureControl();
  const all=rows(),cap=numericLimit();
  all.forEach(row=>row.classList.remove(CAP_CLASS));
  const eligible=all.filter(row=>!hiddenByOther(row));
  eligible.forEach((row,index)=>row.classList.toggle(CAP_CLASS,index>=cap));
  const shown=Math.min(eligible.length,Number.isFinite(cap)?cap:eligible.length);
  const hiddenByLimit=Math.max(0,eligible.length-shown);
  const count=document.getElementById('skyFoundationRelationshipCount');
  if(count){
    const next=String(eligible.length);
    count.dataset.matchCount=next;
    if(count.textContent!==next)count.textContent=next;
    count.dataset.countLabel='matches';
    count.setAttribute('aria-label',eligible.length+' matching relationships');
  }
  const helper=ensureHelper();
  if(helper){
    helper.hidden=hiddenByLimit===0;
    helper.textContent=hiddenByLimit?`${hiddenByLimit} more matching result${hiddenByLimit===1?'':'s'} · Show more`:'';
    helper.setAttribute('aria-label',hiddenByLimit?`Show more of the ${eligible.length} matching relationships`:'Show more matching relationships');
  }
  const empty=document.getElementById('skyFoundationRelationshipEmpty');
  if(empty&&shown>0)empty.hidden=true;
  const state=`${limit}|${shown}|${eligible.length}|${all.length}`;
  if(state!==lastState){
    lastState=state;
    window.dispatchEvent(new CustomEvent('relphi:relationship-limit-applied',{detail:{limit,shown,matching:eligible.length,total:all.length}}));
  }
}
function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>requestAnimationFrame(apply));
}
function relevantClassMutation(record){
  if(record.type!=='attributes'||record.attributeName!=='class')return false;
  const row=record.target?.matches?.('.sky-foundation-relationship-row')?record.target:null;
  if(!row)return false;
  const before=new Set(String(record.oldValue||'').split(/\s+/).filter(Boolean));
  return HIDDEN_CLASSES.some(name=>before.has(name)!==row.classList.contains(name));
}
function rowListMutation(record){
  if(record.type!=='childList'||record.target!==observedList)return false;
  return [...record.addedNodes,...record.removedNodes].some(node=>node instanceof Element&&node.matches?.('.sky-foundation-relationship-row'));
}
function rowVisibilityMutation(record){
  return record.type==='attributes'&&record.target?.matches?.('.sky-foundation-relationship-row')&&(record.attributeName==='hidden'||record.attributeName==='aria-hidden');
}
function ensureObservers(){
  const list=document.getElementById('skyFoundationRelationshipList');
  if(list&&list!==observedList){
    listObserver?.disconnect();observedList=list;
    listObserver=new MutationObserver(records=>{
      if(records.some(record=>rowListMutation(record)||rowVisibilityMutation(record)||relevantClassMutation(record)))schedule();
    });
    listObserver.observe(list,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','aria-hidden'],attributeOldValue:true});
  }
}
function start(){
  document.documentElement.dataset.skyRelationshipLimit=limit;
  const events=[
    'relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-intrasky-relationships-ready',
    'relphi:sky-intrasky-b-relationships-ready','relphi:sky-placement-multiselect-changed','relphi:sky-house-multiselect-changed',
    'relphi:sky-aspect-multiselect-changed','relphi:sky-zodiac-filter-changed','relphi:sky-foundation-filter-changed',
    'relphi:sky-harmonic-window-model-changed','relphi:sky-harmonic-window-visibility-changed','relphi:relationship-sort-changed'
  ];
  events.forEach(name=>window.addEventListener(name,()=>{ensureObservers();schedule()}));
  ensureObservers();ensureControl();schedule();
}
window.RelphiRelationshipLimit=Object.freeze({
  options:OPTIONS,
  get:()=>limit,
  set:setLimit,
  revealMore,
  apply:()=>{apply();return limit}
});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();