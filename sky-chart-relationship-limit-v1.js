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
let limit='all',queued=false,listObserver=null,countObserver=null,observedList=null,observedCount=null,lastState='';

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
#skyFoundationRelationships .sky-relationship-limit-control{align-self:end!important;min-width:0!important}
#skyFoundationRelationships .sky-relationship-limit-control>span{align-self:end;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--sky-filter-label-color,#4e463f);font:var(--sky-filter-label-font,800 .62rem/1.2 system-ui,sans-serif)}
@media(min-width:621px){
  body.sky-chart-page #skyFoundationRelationships .sky-chart-filter-bar>.sky-orb-number-field{grid-column:1/span 3!important;grid-row:2!important}
  body.sky-chart-page #skyFoundationRelationships .sky-chart-filter-bar>.sky-relationship-display-control{grid-column:4/span 3!important;grid-row:2!important}
  body.sky-chart-page #skyFoundationRelationships .sky-chart-filter-bar>.sky-relationship-sort-control{grid-column:7/span 4!important;grid-row:2!important}
  body.sky-chart-page #skyFoundationRelationships .sky-chart-filter-bar>.sky-relationship-limit-control{grid-column:11/span 2!important;grid-row:2!important}
}
`;
  document.head.appendChild(style);
}
function ensureControl(){
  installStyles();
  const bar=document.querySelector('#skyFoundationRelationships .sky-chart-filter-bar');
  if(!bar)return null;
  let control=bar.querySelector(':scope>.sky-relationship-limit-control');
  if(!control){
    control=document.createElement('label');
    control.className='sky-relationship-limit-control';
    const label=document.createElement('span');label.textContent='Limit';
    const select=document.createElement('select');
    select.dataset.relationshipLimit='true';
    select.setAttribute('aria-label','Limit shown relationships');
    [['10','10'],['20','20'],['50','50'],['all','All']].forEach(([value,text])=>{
      const option=document.createElement('option');option.value=value;option.textContent=text;select.appendChild(option);
    });
    select.value=limit;
    select.addEventListener('change',()=>setLimit(select.value));
    control.append(label,select);
  }
  const sort=bar.querySelector(':scope>.sky-relationship-sort-control');
  if(sort&&control.previousElementSibling!==sort)sort.after(control);
  else if(control.parentElement!==bar)bar.appendChild(control);
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
    const next=`${shown}/${all.length}`;
    if(count.textContent!==next)count.textContent=next;
    count.dataset.countLabel='shown';
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
function ensureObservers(){
  const list=document.getElementById('skyFoundationRelationshipList');
  if(list&&list!==observedList){
    listObserver?.disconnect();observedList=list;
    listObserver=new MutationObserver(records=>{
      if(records.some(record=>
        record.type==='childList'||
        record.attributeName==='hidden'||
        record.attributeName==='aria-hidden'||
        relevantClassMutation(record)
      ))schedule();
    });
    listObserver.observe(list,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','aria-hidden'],attributeOldValue:true});
  }
  const count=document.getElementById('skyFoundationRelationshipCount');
  if(count&&count!==observedCount){
    countObserver?.disconnect();observedCount=count;
    countObserver=new MutationObserver(()=>schedule());
    countObserver.observe(count,{childList:true,characterData:true,subtree:true});
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