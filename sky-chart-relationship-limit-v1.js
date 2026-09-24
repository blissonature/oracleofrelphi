// Shared relationship result limit: caps the current sorted/filtered Relationships set without changing eligibility.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiRelationshipLimitV1)return;
window.__relphiRelationshipLimitV1=true;

const OPTIONS=Object.freeze(['10','20','50','all']);
const HIDDEN_CLASSES=Object.freeze([
  'sky-foundation-single-sky-cross-hidden','sky-chart-filter-hidden','sky-chart-orb-hidden','sky-orb-filter-hidden',
  'sky-chart-multiselect-hidden','sky-chart-house-multiselect-hidden','sky-chart-aspect-multiselect-hidden',
  'sky-chart-zodiac-filter-hidden','sky-chart-sign-filter-hidden','sky-chart-semantic-hidden'
]);
const CAP_CLASS='sky-chart-result-limit-hidden';
let limit='all',queued=false,listObserver=null,observedList=null,lastState='';

function normalize(value){const text=String(value??'all').toLowerCase();return OPTIONS.includes(text)?text:'all'}
function numericLimit(){return limit==='all'?Infinity:Number(limit)}
function hiddenByOther(row){
  if(!row||row.hidden||row.getAttribute('aria-hidden')==='true')return true;
  return HIDDEN_CLASSES.some(name=>row.classList.contains(name));
}
function rows(){
  return [...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]')];
}
function syncControl(){
  const select=document.querySelector('[data-relationship-limit]');
  if(select&&select.value!==limit)select.value=limit;
}
function installStyles(){
  if(document.getElementById('skyRelationshipLimitV1Styles'))return;
  const style=document.createElement('style');
  style.id='skyRelationshipLimitV1Styles';
  style.textContent=`
.sky-chart-result-limit-hidden{display:none!important}
#skyFoundationRelationships .sky-relationship-limit-control{display:inline-flex;align-items:center;gap:4px;min-width:0;white-space:nowrap}
#skyFoundationRelationships .sky-relationship-limit-control>span{color:#5a524b;font:800 .61rem/1 system-ui,sans-serif}
#skyFoundationRelationships .sky-relationship-limit-control>select{
  appearance:none;-webkit-appearance:none;width:auto;min-width:54px;height:29px;box-sizing:border-box;margin:0;padding:0 24px 0 8px;
  border:1px solid rgba(31,27,24,.18);border-radius:9px;background:#fff var(--sky-chart-filter-chevron) no-repeat right 6px center/14px 14px;color:#332e2a;
  font:800 .67rem/1 system-ui,sans-serif;cursor:pointer
}
#skyFoundationRelationships .sky-relationship-limit-control>select:hover,
#skyFoundationRelationships .sky-relationship-limit-control>select:focus-visible{border-color:#6b625a;outline:none}
@media(max-width:420px){#skyFoundationRelationships .sky-relationship-limit-control>span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%)}}
`;
  document.head.appendChild(style);
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
    const label=document.createElement('span');label.textContent='Max';
    const select=document.createElement('select');
    select.dataset.relationshipLimit='true';
    select.setAttribute('aria-label','Maximum shown relationships');
    [['10','10'],['20','20'],['50','50'],['all','All']].forEach(([value,text])=>{
      const option=document.createElement('option');option.value=value;option.textContent=text;select.appendChild(option);
    });
    select.value=limit;
    select.addEventListener('change',()=>setLimit(select.value));
    control.append(label,select);
  }
  const anchor=actions.querySelector('.sky-relationship-copy-button,#skyChartRelationshipsExport');
  if(control.parentElement!==actions||control.nextElementSibling!==anchor)actions.insertBefore(control,anchor||actions.firstChild);
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
  if(limit==='10')return'20';
  if(limit==='20')return'50';
  if(limit==='50')return'all';
  return'all';
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