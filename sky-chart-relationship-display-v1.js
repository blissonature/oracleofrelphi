// Relationship display mode: one authoritative global default with the same dropdown grammar as the other relationship controls.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyRelationshipDisplayV2)return;
window.__relphiSkyRelationshipDisplayV2=true;
window.__relphiSkyRelationshipDisplayV1=true;

const STORAGE_KEY='relphiSkyRelationshipDisplayV1';
const MODES=Object.freeze([
  {id:'glyphs',label:'Glyphs only',level:0},
  {id:'names',label:'Glyphs + names',level:1},
  {id:'referents',label:'Glyphs + names + referents',level:2}
]);
const BY_ID=new Map(MODES.map(mode=>[mode.id,mode]));
const STYLE_ID='skyRelationshipDisplayV2Styles';
let queued=false;
let portalOwner=null;

function readMode(){
  try{const value=localStorage.getItem(STORAGE_KEY);return BY_ID.has(value)?value:'glyphs'}catch(_){return'glyphs'}
}
function current(){return BY_ID.get(readMode())||MODES[0]}
function writeMode(value){
  const mode=BY_ID.has(value)?value:'glyphs';
  try{localStorage.setItem(STORAGE_KEY,mode)}catch(_){}
  document.documentElement.dataset.relationshipDisplay=mode;
  return mode;
}
function control(){return document.querySelector('[data-relationship-display-control]')}
function popover(){return document.getElementById('skyRelationshipDisplayPopover')}
function isOpen(owner=control()){return owner?.classList.contains('is-open')===true}

function applyProgressiveToken(token,level,force=false){
  if(!(token instanceof HTMLElement))return;
  if(!force&&token.dataset.relationshipDisplayDefault!==undefined)return;
  const levels={glyph:0,name:1,meaning:2};
  const names=['glyph','name','meaning'];
  token.dataset.progressiveStage=names[level];
  token.dataset.progressiveLevel=String(level);
  token.dataset.relationshipDisplayDefault=String(level);
  token.querySelectorAll(':scope > .sky-progressive-level').forEach(button=>{
    const numeric=levels[button.dataset.progressiveLevel];
    const visible=Number.isInteger(numeric)&&numeric<=level;
    button.hidden=!visible;
    button.setAttribute('aria-hidden',visible?'false':'true');
    button.setAttribute('aria-expanded',Number.isInteger(numeric)&&numeric<level?'true':'false');
    button.tabIndex=visible?0:-1;
  });
}
function applyInlineToken(token,level,force=false){
  if(!(token instanceof HTMLElement))return;
  if(!force&&token.dataset.relationshipDisplayDefault!==undefined)return;
  const name=token.querySelector(':scope > [data-inline-progressive-level="name"]');
  const referent=token.querySelector(':scope > [data-inline-progressive-level="referent"]');
  token.dataset.inlineProgressiveStage=String(level);
  token.dataset.relationshipDisplayDefault=String(level);
  token.hidden=level===0;
  if(name){name.hidden=level===0;name.setAttribute('aria-expanded',level===2?'true':'false')}
  if(referent)referent.hidden=level<2;
}
function applyMode(root=document,force=false,modeId=readMode()){
  const mode=BY_ID.get(modeId)||MODES[0],level=mode.level;
  document.documentElement.dataset.relationshipDisplay=mode.id;
  root.querySelectorAll?.('.sky-progressive-token').forEach(token=>applyProgressiveToken(token,level,force));
  root.querySelectorAll?.('.inline-rel-progressive-token').forEach(token=>applyInlineToken(token,level,force));
  syncControl(mode.id);
  return mode.id;
}
function setMode(modeId,{announce=true}={}){
  const mode=writeMode(modeId);
  applyMode(document,true,mode);
  if(announce)window.dispatchEvent(new CustomEvent('relphi:relationship-display-changed',{detail:{mode}}));
  return mode;
}

function installStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    #skyFoundationRelationships .sky-relationship-display-control{position:relative;align-self:end!important;min-width:0!important;color:var(--sky-filter-label-color,#4e463f)!important;font:var(--sky-filter-label-font,800 .62rem/1.2 system-ui,sans-serif)!important}
    #skyFoundationRelationships .sky-relationship-display-head{display:grid!important;grid-template-columns:minmax(0,1fr) 32px!important;grid-template-rows:auto var(--sky-filter-height,35px)!important;grid-template-areas:"label label" "field field"!important;align-items:center!important;gap:4px 0!important;min-height:0!important;height:auto!important;padding:0!important;border:0!important;background:transparent!important}
    #skyFoundationRelationships .sky-relationship-display-label{grid-area:label!important;align-self:end!important;min-width:0!important;padding:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;color:var(--sky-filter-label-color,#4e463f)!important;font:var(--sky-filter-label-font,800 .62rem/1.2 system-ui,sans-serif)!important}
    #skyFoundationRelationships .sky-relationship-display-value{grid-area:field!important;grid-column:1/3!important;grid-row:2!important;display:flex!important;align-items:center!important;width:100%!important;min-width:0!important;height:var(--sky-filter-height,35px)!important;box-sizing:border-box!important;margin:0!important;padding:var(--sky-filter-control-padding,.52rem .58rem)!important;padding-right:40px!important;border:var(--sky-filter-border,1px solid rgba(31,27,24,.2))!important;border-radius:var(--sky-filter-radius,9px)!important;background:#fff!important;color:var(--sky-filter-control-color,#191613)!important;font:var(--sky-filter-control-font,700 .68rem/1.2 system-ui,sans-serif)!important;overflow:hidden!important;text-align:left!important;cursor:pointer!important}
    #skyFoundationRelationships .sky-relationship-display-value-text{display:block!important;flex:1 1 auto!important;min-width:0!important;max-width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;pointer-events:none!important}
    #skyFoundationRelationships .sky-relationship-display-toggle{grid-column:2!important;grid-row:2!important;align-self:stretch!important;justify-self:stretch!important;z-index:2!important;width:32px!important;min-width:32px!important;height:var(--sky-filter-height,35px)!important;box-sizing:border-box!important;margin:0!important;padding:0!important;border:0!important;border-radius:0 var(--sky-filter-radius,9px) var(--sky-filter-radius,9px) 0!important;background-color:transparent!important;background-image:var(--sky-chart-filter-chevron)!important;background-repeat:no-repeat!important;background-position:center!important;background-size:15px 15px!important;box-shadow:none!important;color:transparent!important;font-size:0!important;cursor:pointer!important}
    #skyFoundationRelationships .sky-relationship-display-value:hover,#skyFoundationRelationships .sky-relationship-display-value:focus-visible,#skyFoundationRelationships .sky-relationship-display-toggle:hover,#skyFoundationRelationships .sky-relationship-display-toggle:focus-visible{background-color:#f5f1eb!important;outline:none!important}
    #skyFoundationRelationships .sky-relationship-display-control.is-open .sky-relationship-display-value{border-color:rgba(31,27,24,.42)!important;box-shadow:0 0 0 2px rgba(31,27,24,.08)!important}
    #skyFoundationRelationships .sky-relationship-display-popover{position:absolute;top:calc(100% + 6px);left:50%;width:min(280px,calc(100vw - 24px));box-sizing:border-box;padding:7px;border:1px solid rgba(31,27,24,.22);border-radius:13px;background:#fffdf8;box-shadow:0 16px 38px rgba(31,27,24,.2);transform:translateX(-50%);pointer-events:auto}
    #skyFoundationRelationships .sky-relationship-display-popover[hidden]{display:none!important}
    .sky-relationship-display-popover.is-portaled{position:fixed!important;z-index:10000!important;right:auto!important;bottom:auto!important;margin:0!important;transform:none!important;isolation:isolate!important}
    .sky-relationship-display-list{overflow:hidden;border:1px solid rgba(31,27,24,.17);border-radius:9px;background:#fff}
    .sky-relationship-display-option{appearance:none;display:flex;width:100%;min-height:38px;align-items:center;justify-content:space-between;gap:10px;box-sizing:border-box;padding:8px 10px;border:0;border-top:1px solid rgba(31,27,24,.075);background:#fff;color:#29231e;font:750 .67rem/1.15 system-ui,sans-serif;text-align:left;cursor:pointer}
    .sky-relationship-display-option:first-child{border-top:0}.sky-relationship-display-option:hover,.sky-relationship-display-option:focus-visible{background:#f4efe8;outline:none}.sky-relationship-display-option[aria-selected="true"]{background:#f4efe8;font-weight:900}
    .sky-relationship-display-option[aria-selected="true"]::after{content:"✓";flex:0 0 auto;color:#191613;font:900 13px/1 Arial,sans-serif}
    @media(min-width:901px){#skyFoundationRelationships .sky-chart-filter-bar>.sky-relationship-display-control{grid-column:1/span 2!important;max-width:280px!important}}
    @media(max-width:620px){#skyFoundationRelationships{overflow:visible!important}#skyFoundationRelationships #skyFoundationRelationshipList,#skyFoundationRelationships #skyFoundationRelationshipList:has(>.sky-foundation-relationship-row.is-inline-expanded){max-height:none!important;height:auto!important;overflow:visible!important;overscroll-behavior-y:auto!important;-webkit-overflow-scrolling:auto!important;touch-action:pan-y!important;padding-bottom:max(28px,env(safe-area-inset-bottom))!important}#skyFoundationRelationships .sky-foundation-relationship-row.is-inline-expanded{overflow:visible!important}}
  `;
  document.head.appendChild(style);
}

function syncControl(modeId=readMode()){
  const owner=control();if(!owner)return;
  const mode=BY_ID.get(modeId)||MODES[0];
  const value=owner.querySelector('[data-relationship-display-value]');
  let text=value?.querySelector('[data-relationship-display-value-text]');
  if(value&&!text){text=document.createElement('span');text.className='sky-relationship-display-value-text';text.dataset.relationshipDisplayValueText='true';value.replaceChildren(text)}
  if(text&&text.textContent!==mode.label)text.textContent=mode.label;
  owner.querySelectorAll('[data-relationship-display-option]').forEach(option=>{
    const selected=option.dataset.relationshipDisplayOption===mode.id;
    option.setAttribute('aria-selected',selected?'true':'false');
    option.tabIndex=selected?0:-1;
  });
  owner.dataset.relationshipDisplayMode=mode.id;
}
function positionPortal(){
  const owner=portalOwner,menu=popover(),head=owner?.querySelector('.sky-relationship-display-head');
  if(!isOpen(owner)||!menu?.classList.contains('is-portaled')||!head)return;
  const rect=head.getBoundingClientRect(),margin=12,width=Math.min(280,Math.max(230,window.innerWidth-margin*2));
  const left=Math.min(window.innerWidth-width-margin,Math.max(margin,rect.left+rect.width/2-width/2));
  const menuHeight=Math.min(150,window.innerHeight-margin*2),roomBelow=window.innerHeight-rect.bottom-margin,placeAbove=roomBelow<menuHeight&&rect.top>roomBelow;
  const top=placeAbove?Math.max(margin,rect.top-menuHeight-6):Math.min(window.innerHeight-menuHeight-margin,rect.bottom+6);
  Object.assign(menu.style,{width:`${width}px`,left:`${left}px`,top:`${Math.max(margin,top)}px`});
}
function open(owner=control()){
  const menu=owner?.querySelector('.sky-relationship-display-popover')||popover();if(!owner||!menu)return;
  portalOwner=owner;owner.classList.add('is-open');menu.hidden=false;menu.classList.add('is-portaled');document.body.appendChild(menu);
  owner.querySelector('[data-relationship-display-value]')?.setAttribute('aria-expanded','true');
  owner.querySelector('[data-relationship-display-toggle]')?.setAttribute('aria-expanded','true');
  requestAnimationFrame(()=>{positionPortal();menu.querySelector('[aria-selected="true"]')?.focus({preventScroll:true})});
}
function close(owner=portalOwner||control(),{focus=false}={}){
  const menu=popover();if(!owner||!menu)return;
  menu.hidden=true;menu.classList.remove('is-portaled');menu.removeAttribute('style');owner.appendChild(menu);owner.classList.remove('is-open');
  owner.querySelector('[data-relationship-display-value]')?.setAttribute('aria-expanded','false');
  owner.querySelector('[data-relationship-display-toggle]')?.setAttribute('aria-expanded','false');
  portalOwner=null;if(focus)owner.querySelector('[data-relationship-display-value]')?.focus({preventScroll:true});
}
function choose(modeId){setMode(modeId);syncControl(modeId);close();}

function createControl(){
  const owner=document.createElement('div');owner.className='sky-relationship-display-control';owner.dataset.relationshipDisplayControl='true';
  const head=document.createElement('div');head.className='sky-relationship-display-head';
  const label=document.createElement('span');label.className='sky-relationship-display-label';label.textContent='Display';
  const value=document.createElement('button');value.type='button';value.className='sky-relationship-display-value';value.dataset.relationshipDisplayValue='true';value.setAttribute('aria-label','Choose relationship display');value.setAttribute('aria-haspopup','listbox');value.setAttribute('aria-expanded','false');value.setAttribute('aria-controls','skyRelationshipDisplayPopover');
  const valueText=document.createElement('span');valueText.className='sky-relationship-display-value-text';valueText.dataset.relationshipDisplayValueText='true';value.appendChild(valueText);
  const toggle=document.createElement('button');toggle.type='button';toggle.className='sky-relationship-display-toggle';toggle.dataset.relationshipDisplayToggle='true';toggle.setAttribute('aria-label','Choose relationship display');toggle.setAttribute('aria-haspopup','listbox');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','skyRelationshipDisplayPopover');
  const menu=document.createElement('div');menu.id='skyRelationshipDisplayPopover';menu.className='sky-relationship-display-popover';menu.hidden=true;menu.setAttribute('role','listbox');menu.setAttribute('aria-label','Relationship display');
  const list=document.createElement('div');list.className='sky-relationship-display-list';
  MODES.forEach(mode=>{const option=document.createElement('button');option.type='button';option.className='sky-relationship-display-option';option.dataset.relationshipDisplayOption=mode.id;option.setAttribute('role','option');option.textContent=mode.label;option.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();choose(mode.id)});list.appendChild(option)});
  menu.appendChild(list);head.append(label,value,toggle);owner.append(head,menu);
  const toggleMenu=()=>isOpen(owner)?close(owner):open(owner);value.addEventListener('click',toggleMenu);toggle.addEventListener('click',toggleMenu);
  return owner;
}
function ensureControl(){
  const bar=document.querySelector('#skyFoundationRelationships .sky-chart-filter-bar');if(!bar)return false;
  bar.querySelector('[data-relationship-display-control] select')?.closest('[data-relationship-display-control]')?.remove();
  let owner=bar.querySelector('[data-relationship-display-control]');if(!owner){owner=createControl();bar.appendChild(owner)}
  syncControl();return true;
}

function reconcile(){queued=false;installStyles();ensureControl();applyMode(document,false)}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(reconcile))}
function closeOutside(event){const owner=portalOwner,menu=popover();if(!isOpen(owner))return;if(owner?.contains(event.target)||menu?.contains(event.target))return;close(owner)}
function handleMenuKey(event){
  if(!isOpen(portalOwner))return;
  const options=[...popover().querySelectorAll('[data-relationship-display-option]')];if(!options.length)return;
  const active=document.activeElement,index=Math.max(0,options.indexOf(active));
  if(event.key==='Escape'){event.preventDefault();close(portalOwner,{focus:true});return}
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();const delta=event.key==='ArrowDown'?1:-1;options[(index+delta+options.length)%options.length].focus();return}
  if((event.key==='Enter'||event.key===' ')&&active?.dataset?.relationshipDisplayOption){event.preventDefault();choose(active.dataset.relationshipDisplayOption)}
}

function start(){
  installStyles();writeMode(readMode());reconcile();
  const root=document.getElementById('skyFoundationRelationships')||document.body;
  new MutationObserver(records=>{if(records.some(record=>record.addedNodes.length||record.removedNodes.length))schedule()}).observe(root,{childList:true,subtree:true});
  ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-foundation-filter-changed','relphi:selected-relationship-rendered','relphi:sky-progressive-symbols-ready'].forEach(name=>window.addEventListener(name,schedule));
  document.addEventListener('pointerdown',closeOutside,true);document.addEventListener('keydown',handleMenuKey,true);window.addEventListener('resize',positionPortal);window.addEventListener('scroll',positionPortal,true);
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
window.RelphiSkyRelationshipDisplay=Object.freeze({getMode:readMode,setMode:mode=>setMode(mode),apply:(root,force=false)=>applyMode(root||document,force)});
})();
