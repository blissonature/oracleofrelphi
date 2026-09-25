// Shared relationship result limit: caps the current sorted/filtered Relationships set without changing eligibility.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiRelationshipLimitV1)return;
window.__relphiRelationshipLimitV1=true;

const OPTIONS=Object.freeze(['10','20','50','100','all','custom']);
const PRESETS=Object.freeze(['10','20','50','100']);
const NAMED=Object.freeze(['start','midpoint','end','max','all']);
const HIDDEN_CLASSES=Object.freeze([
  'sky-foundation-single-sky-cross-hidden','sky-chart-filter-hidden','sky-chart-orb-hidden','sky-orb-filter-hidden',
  'sky-chart-multiselect-hidden','sky-chart-house-multiselect-hidden','sky-chart-aspect-multiselect-hidden',
  'sky-chart-zodiac-filter-hidden','sky-chart-sign-filter-hidden','sky-chart-theme-filter-hidden','sky-chart-semantic-hidden'
]);
const CAP_CLASS='sky-chart-result-limit-hidden';
let limit='all',queued=false,listObserver=null,observedList=null,lastState='',editing=false,menuOpen=false,outsideBound=false;

function normalize(value){
  let text=String(value??'all').trim().toLowerCase().replace(/[–—]/g,'-').replace(/\s+/g,'');
  if(!text||text==='max'||text==='all'||text==='end')return'all';
  if(text==='customrange'||text==='custom')return'custom';
  if(/^\d+$/.test(text))return String(Math.max(1,Number(text)));
  if(text==='midpoint'||text==='start')return text;
  const range=text.match(/^([^\-:.]+)(?:-|\.\.|:)([^\-:.]+)$/);
  if(range&&[range[1],range[2]].every(token=>/^\d+$/.test(token)||NAMED.includes(token)))return range[1]+'-'+range[2];
  return'';
}
function tokenValue(token,total){
  const text=String(token||'').toLowerCase();
  if(/^\d+$/.test(text))return Math.max(1,Math.min(total,Number(text)));
  if(text==='start')return total?1:0;
  if(text==='midpoint')return total?Math.ceil(total/2):0;
  if(text==='end'||text==='max'||text==='all')return total;
  return NaN;
}
function resolvedRange(spec,total){
  if(total<=0)return{start:0,end:0,shown:0};
  const normalized=normalize(spec);
  if(!normalized||normalized==='custom')return null;
  if(normalized==='all')return{start:1,end:total,shown:total};
  if(/^\d+$/.test(normalized)){
    const end=Math.min(total,Number(normalized));
    return{start:1,end,shown:end};
  }
  if(normalized==='start')return{start:1,end:1,shown:1};
  if(normalized==='midpoint'){
    const end=Math.ceil(total/2);
    return{start:1,end,shown:end};
  }
  const [a,b]=normalized.split('-');
  let start=tokenValue(a,total),end=tokenValue(b,total);
  if(!Number.isFinite(start)||!Number.isFinite(end))return null;
  if(start>end)[start,end]=[end,start];
  return{start,end,shown:Math.max(0,end-start+1)};
}
function hiddenByOther(row){
  if(!row||row.hidden||row.getAttribute('aria-hidden')==='true')return true;
  return HIDDEN_CLASSES.some(name=>row.classList.contains(name));
}
function rows(){
  return [...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row[data-relation-index]')];
}
function displayValue(spec=limit){
  if(spec==='all')return'Max';
  if(spec==='custom')return'';
  return spec;
}
function syncControl(){
  const input=document.querySelector('[data-relationship-limit]');
  if(!input||editing||document.activeElement===input)return;
  const next=displayValue();
  if(input.value!==next)input.value=next;
}
function installStyles(){
  if(document.getElementById('skyRelationshipLimitV1Styles'))return;
  const style=document.createElement('style');
  style.id='skyRelationshipLimitV1Styles';
  style.textContent=`
.sky-chart-result-limit-hidden{display:none!important}
#skyFoundationRelationshipList>.sky-foundation-result-limit-show-more{order:2147483646!important}
#skyFoundationRelationshipList>[data-harmonic-show-more]{order:2147483647!important}
#skyFoundationRelationships .sky-relationship-limit-control{position:relative;display:inline-flex;align-items:center;min-width:0;white-space:nowrap}
#skyFoundationRelationships .sky-relationship-limit-control>input{
  width:92px;min-width:54px;height:29px;box-sizing:border-box;margin:0;padding:0 27px 0 8px;
  border:1px solid rgba(31,27,24,.18);border-radius:9px;background:#fff;color:#332e2a;
  font:800 .67rem/1 system-ui,sans-serif;cursor:text
}
#skyFoundationRelationships .sky-relationship-limit-control>input:hover,
#skyFoundationRelationships .sky-relationship-limit-control>input:focus-visible{border-color:#6b625a;outline:none}
#skyFoundationRelationships .sky-relationship-limit-toggle{
  position:absolute;right:0;top:0;width:27px;height:29px;margin:0;padding:0;border:0;border-radius:0 9px 9px 0;
  background:transparent var(--sky-chart-filter-chevron) no-repeat center/14px 14px;color:transparent;font-size:0;cursor:pointer
}
#skyFoundationRelationships .sky-relationship-limit-menu{
  position:absolute;z-index:10020;top:calc(100% + 5px);right:0;min-width:118px;box-sizing:border-box;padding:5px;
  border:1px solid rgba(31,27,24,.22);border-radius:10px;background:#fffdf8;box-shadow:0 12px 28px rgba(31,27,24,.18)
}
#skyFoundationRelationships .sky-relationship-limit-menu[hidden]{display:none!important}
#skyFoundationRelationships .sky-relationship-limit-menu button{
  display:block;width:100%;min-height:32px;box-sizing:border-box;margin:0;padding:6px 8px;border:0;border-radius:7px;
  background:transparent;color:#29231e;font:800 .65rem/1.1 system-ui,sans-serif;text-align:left;cursor:pointer
}
#skyFoundationRelationships .sky-relationship-limit-menu button:hover,
#skyFoundationRelationships .sky-relationship-limit-menu button:focus-visible{background:#f4efe8;outline:none}
#skyFoundationRelationships .sky-relationship-limit-menu button[aria-current="true"]{background:#eee7df}
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
  }
  const count=heading.querySelector('#skyFoundationRelationshipCount');
  const copy=heading.querySelector('.sky-relationship-copy-button');
  const download=heading.querySelector('#skyChartRelationshipsExport');
  if(count)actions.insertBefore(count,actions.querySelector('.sky-relationship-copy-button,#skyChartRelationshipsExport')||null);
  if(copy&&copy.parentElement!==actions)actions.insertBefore(copy,actions.querySelector('#skyChartRelationshipsExport')||null);
  if(download&&download.parentElement!==actions)actions.appendChild(download);
  return actions;
}
function ensureControl(){
  installStyles();
  const actions=ensureHeadingActions();
  if(!actions)return null;
  let control=document.querySelector('#skyFoundationRelationships .sky-relationship-limit-control');
  if(!control){
    control=document.createElement('span');
    control.className='sky-relationship-limit-control';

    const input=document.createElement('input');
    input.type='text';
    input.inputMode='text';
    input.autocomplete='off';
    input.spellcheck=false;
    input.dataset.relationshipLimit='true';
    input.setAttribute('role','combobox');
    input.setAttribute('aria-autocomplete','list');
    input.setAttribute('aria-haspopup','listbox');
    input.setAttribute('aria-expanded','false');
    input.setAttribute('aria-controls','skyRelationshipLimitMenu');
    input.setAttribute('aria-label','Maximum relationships shown or custom range');
    input.setAttribute('aria-description','Choose 10, 20, 50, 100, or Max. Or type a positive number or range such as 3, 1-7, midpoint, midpoint-end, or end.');
    input.title='Choose 10, 20, 50, 100, or Max; or type a custom number/range';
    input.value=displayValue();

    const toggle=document.createElement('button');
    toggle.type='button';
    toggle.className='sky-relationship-limit-toggle';
    toggle.setAttribute('aria-label','Choose relationship maximum');
    toggle.setAttribute('aria-haspopup','listbox');
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-controls','skyRelationshipLimitMenu');

    const menu=document.createElement('div');
    menu.id='skyRelationshipLimitMenu';
    menu.className='sky-relationship-limit-menu';
    menu.hidden=true;
    menu.setAttribute('role','listbox');
    menu.setAttribute('aria-label','Relationship maximum presets');
    [
      ['10','10'],['20','20'],['50','50'],['100','100'],['all','Max'],['custom','Custom Range']
    ].forEach(([value,label])=>{
      const option=document.createElement('button');
      option.type='button';
      option.dataset.relationshipLimitPreset=value;
      option.setAttribute('role','option');
      option.textContent=label;
      option.addEventListener('click',event=>{
        event.preventDefault();
        if(value==='custom'){
          closeMenu();
          editing=true;
          input.value='';
          input.focus({preventScroll:true});
          return;
        }
        setLimit(value,{immediate:true});
        editing=false;
        input.value=displayValue();
        closeMenu();
        input.focus({preventScroll:true});
        input.select();
      });
      menu.appendChild(option);
    });

    const openMenu=()=>{
      menuOpen=true;menu.hidden=false;input.setAttribute('aria-expanded','true');toggle.setAttribute('aria-expanded','true');
      menu.querySelectorAll('[data-relationship-limit-preset]').forEach(option=>{
        const value=option.dataset.relationshipLimitPreset;
        option.setAttribute('aria-current',(value===limit||(value==='all'&&limit==='all'))?'true':'false');
      });
    };
    const closeMenu=()=>{
      menuOpen=false;menu.hidden=true;input.setAttribute('aria-expanded','false');toggle.setAttribute('aria-expanded','false');
    };
    control._openRelationshipLimitMenu=openMenu;
    control._closeRelationshipLimitMenu=closeMenu;

    toggle.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();menuOpen?closeMenu():openMenu()});
    input.addEventListener('focus',()=>{editing=true});
    input.addEventListener('input',()=>{
      editing=true;
      const next=normalize(input.value);
      if(next&&next!=='custom')setLimit(next,{fromInput:true,immediate:true});
    });
    input.addEventListener('keydown',event=>{
      if(event.key==='ArrowDown'&&!menuOpen){event.preventDefault();openMenu();menu.querySelector('button')?.focus({preventScroll:true});return}
      if(event.key==='Enter'){
        event.preventDefault();
        const next=normalize(input.value);
        if(next&&next!=='custom')setLimit(next,{fromInput:true,immediate:true});
        editing=false;closeMenu();input.blur();syncControl();
      }else if(event.key==='Escape'){
        event.preventDefault();editing=false;closeMenu();input.value=displayValue();input.blur();
      }
    });
    input.addEventListener('blur',()=>{
      window.setTimeout(()=>{
        if(menuOpen&&control.contains(document.activeElement))return;
        const next=normalize(input.value);
        if(next&&next!=='custom')setLimit(next,{fromInput:true,immediate:true});
        editing=false;closeMenu();syncControl();
      },0);
    });
    menu.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();closeMenu();input.focus({preventScroll:true});return}
      const buttons=[...menu.querySelectorAll('button')],index=buttons.indexOf(document.activeElement);
      if(event.key==='ArrowDown'){event.preventDefault();buttons[(index+1+buttons.length)%buttons.length]?.focus()}
      if(event.key==='ArrowUp'){event.preventDefault();buttons[(index-1+buttons.length)%buttons.length]?.focus()}
    });

    control.append(input,toggle,menu);
    if(!outsideBound){
      outsideBound=true;
      document.addEventListener('pointerdown',event=>{
        const current=document.querySelector('#skyFoundationRelationships .sky-relationship-limit-control');
        if(current&&!current.contains(event.target))current._closeRelationshipLimitMenu?.();
      },true);
      document.addEventListener('keydown',event=>{
        if(event.key==='Escape')document.querySelector('#skyFoundationRelationships .sky-relationship-limit-control')?._closeRelationshipLimitMenu?.();
      },true);
    }
  }
  const anchor=actions.querySelector('#skyFoundationRelationshipCount,.sky-relationship-copy-button,#skyChartRelationshipsExport');
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
    const harmonic=list.querySelector(':scope>[data-harmonic-show-more]');
    if(harmonic)list.insertBefore(button,harmonic);
    else list.appendChild(button);
  }
  return button;
}
function nextLimit(){
  if(/^\d+$/.test(limit)){
    const n=Number(limit);
    if(n<10)return'10';
    if(n<20)return'20';
    if(n<50)return'50';
    if(n<100)return'100';
  }
  if(limit==='10')return'20';
  if(limit==='20')return'50';
  if(limit==='50')return'100';
  if(limit==='100')return'all';
  return'all';
}
function revealMore(){
  if(limit==='all')return;
  if(limit.includes('-')||limit==='midpoint'||limit==='start')setLimit('all');
  else setLimit(nextLimit());
}
function setLimit(value,{fromInput=false,immediate=false}={}){
  const next=normalize(value);
  if(!next||next==='custom'){if(!fromInput)syncControl();return limit}
  if(next===limit){
    if(!fromInput)syncControl();
    if(immediate)apply();else schedule();
    return limit;
  }
  limit=next;
  document.documentElement.dataset.skyRelationshipLimit=limit;
  if(!fromInput)syncControl();
  window.dispatchEvent(new CustomEvent('relphi:relationship-limit-changed',{detail:{limit}}));
  if(immediate)apply();else schedule();
  return limit;
}
function apply(){
  queued=false;
  ensureControl();
  const all=rows();
  all.forEach(row=>row.classList.remove(CAP_CLASS));
  const eligible=all.filter(row=>!hiddenByOther(row));
  const range=resolvedRange(limit,eligible.length)||resolvedRange('all',eligible.length);
  eligible.forEach((row,index)=>{
    const position=index+1;
    row.classList.toggle(CAP_CLASS,position<range.start||position>range.end);
  });
  const shown=range.shown;
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
    const customSlice=range.start>1;
    helper.textContent=hiddenByLimit?(customSlice?`${hiddenByLimit} outside current range · Show all`:`${hiddenByLimit} more matching result${hiddenByLimit===1?'':'s'} · Show more`):'';
    helper.setAttribute('aria-label',hiddenByLimit?(customSlice?`Show all ${eligible.length} matching relationships`:`Show more of the ${eligible.length} matching relationships`):'Show more matching relationships');
  }
  const empty=document.getElementById('skyFoundationRelationshipEmpty');
  if(empty&&shown>0)empty.hidden=true;
  const state=`${limit}|${shown}|${eligible.length}|${all.length}`;
  if(state!==lastState){
    lastState=state;
    window.dispatchEvent(new CustomEvent('relphi:relationship-limit-applied',{detail:{limit,range:{start:range.start,end:range.end},shown,matching:eligible.length,total:all.length}}));
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
    'relphi:sky-harmonic-window-model-changed','relphi:sky-harmonic-window-visibility-changed','relphi:relationship-sort-changed','relphi:sky-theme-filter-changed'
  ];
  events.forEach(name=>window.addEventListener(name,()=>{ensureObservers();schedule()}));
  ensureObservers();ensureControl();schedule();
}
window.RelphiRelationshipLimit=Object.freeze({
  options:OPTIONS,
  presets:PRESETS,
  named:NAMED,
  get:()=>limit,
  resolve:total=>resolvedRange(limit,Number(total)||0),
  set:setLimit,
  revealMore,
  apply:()=>{apply();return limit}
});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();