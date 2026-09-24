// Relationship display mode v3: global depth preset with local, mutation-safe application.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyRelationshipDisplayV3)return;
window.__relphiSkyRelationshipDisplayV1=true;window.__relphiSkyRelationshipDisplayV2=true;window.__relphiSkyRelationshipDisplayV3=true;

const SHARED_STORAGE_KEY='relphiSkyVocabDisplayV1';
const LEGACY_STORAGE_KEY='relphiSkyRelationshipDisplayV1';
const DISPLAY_ITEMS=Object.freeze([
  {id:'glyphs',label:'Glyphs'},
  {id:'referents',label:'Referents'},
  {id:'names',label:'Names'}
]);
const STYLE_ID='skyRelationshipDisplayV2Styles';
let queued=false,portalOwner=null,observer=null,observedRoot=null;

function normalizeState(value){
  return{
    glyphs:value?.glyphs!==false,
    names:value?.names!==false,
    referents:value?.referents!==false
  };
}
function legacyState(){
  try{
    const mode=localStorage.getItem(LEGACY_STORAGE_KEY);
    if(mode==='glyphs')return{glyphs:true,names:false,referents:false};
    if(mode==='names')return{glyphs:true,names:true,referents:false};
    if(mode==='referents')return{glyphs:true,names:true,referents:true};
  }catch(_){}
  return{glyphs:true,names:true,referents:true};
}
function readState(){
  try{
    const raw=localStorage.getItem(SHARED_STORAGE_KEY);
    if(raw){
      const parsed=JSON.parse(raw);
      if(parsed&&typeof parsed==='object')return normalizeState(parsed);
    }
  }catch(_){}
  return legacyState();
}
function writeState(next){
  const state=normalizeState(next);
  try{localStorage.setItem(SHARED_STORAGE_KEY,JSON.stringify(state))}catch(_){}
  document.documentElement.dataset.skyVocabGlyphs=state.glyphs?'true':'false';
  document.documentElement.dataset.skyVocabNames=state.names?'true':'false';
  document.documentElement.dataset.skyVocabReferents=state.referents?'true':'false';
  document.documentElement.dataset.relationshipDisplay=state.referents?'referents':state.names?'names':state.glyphs?'glyphs':'none';
  return state;
}
function control(){return document.querySelector('[data-relationship-display-control]')}
function popover(){return document.getElementById('skyRelationshipDisplayPopover')}
function isOpen(owner=control()){return owner?.classList.contains('is-open')===true}
function stateSummary(state=readState()){
  const selected=DISPLAY_ITEMS.filter(item=>state[item.id]);
  if(selected.length===DISPLAY_ITEMS.length)return'All';
  if(!selected.length)return'None';
  return selected.map(item=>item.label).join(' · ');
}
function applyProgressiveToken(token,state,force=false){
  if(!(token instanceof HTMLElement)||(!force&&token.dataset.relationshipDisplayDefault!==undefined))return;
  const byLevel={glyph:'glyphs',name:'names',meaning:'referents'};
  const numeric={glyph:0,name:1,meaning:2};
  let highest=-1;
  for(const button of token.querySelectorAll(':scope > .sky-progressive-level')){
    const key=byLevel[button.dataset.progressiveLevel],show=!!state[key];
    button.hidden=!show;
    button.setAttribute('aria-hidden',show?'false':'true');
    button.setAttribute('aria-expanded','false');
    button.tabIndex=show?0:-1;
    if(show)highest=Math.max(highest,numeric[button.dataset.progressiveLevel]??-1);
  }
  token.dataset.progressiveStage=highest===2?'meaning':highest===1?'name':'glyph';
  token.dataset.progressiveLevel=String(Math.max(0,highest));
  token.dataset.relationshipDisplayDefault=JSON.stringify(state);
}
function applyInlineToken(token,state,force=false){
  if(!(token instanceof HTMLElement)||(!force&&token.dataset.relationshipDisplayDefault!==undefined))return;
  const name=token.querySelector(':scope > [data-inline-progressive-level="name"]');
  const referent=token.querySelector(':scope > [data-inline-progressive-level="referent"]');
  if(name){name.hidden=!state.names;name.setAttribute('aria-expanded',state.referents?'true':'false')}
  if(referent)referent.hidden=!state.referents;
  token.hidden=!(state.names||state.referents);
  token.dataset.inlineProgressiveStage=state.referents?'2':state.names?'1':'0';
  token.dataset.relationshipDisplayDefault=JSON.stringify(state);
}
function applyState(root=document,force=false,state=readState()){
  const next=normalizeState(state);
  document.documentElement.dataset.relationshipDisplay=next.referents?'referents':next.names?'names':next.glyphs?'glyphs':'none';
  root.querySelectorAll?.('.sky-progressive-token').forEach(t=>applyProgressiveToken(t,next,force));
  root.querySelectorAll?.('.inline-rel-progressive-token').forEach(t=>applyInlineToken(t,next,force));
  syncControl(next);
  return next;
}
function applyAdded(node){
  if(!(node instanceof Element))return;
  const state=readState();
  if(node.matches('.sky-progressive-token'))applyProgressiveToken(node,state,false);
  if(node.matches('.inline-rel-progressive-token'))applyInlineToken(node,state,false);
  node.querySelectorAll?.('.sky-progressive-token').forEach(t=>applyProgressiveToken(t,state,false));
  node.querySelectorAll?.('.inline-rel-progressive-token').forEach(t=>applyInlineToken(t,state,false));
}
function setState(next,{announce=true}={}){
  const state=writeState(next);
  applyState(document,true,state);
  if(announce){
    window.dispatchEvent(new CustomEvent('relphi:sky-display-changed',{detail:{state}}));
    window.dispatchEvent(new CustomEvent('relphi:relationship-display-changed',{detail:{state}}));
  }
  return state;
}
function stateFromLegacyMode(mode){
  if(mode==='glyphs')return{glyphs:true,names:false,referents:false};
  if(mode==='names')return{glyphs:true,names:true,referents:false};
  return{glyphs:true,names:true,referents:true};
}
function legacyModeFromState(state=readState()){
  return state.referents?'referents':state.names?'names':'glyphs';
}
function setMode(mode,{announce=true}={}){
  try{localStorage.setItem(LEGACY_STORAGE_KEY,String(mode||''))}catch(_){}
  return setState(stateFromLegacyMode(mode),{announce});
}

function installStyles(){if(document.getElementById(STYLE_ID))return;const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
#skyFoundationFocus .sky-relationship-display-control{position:relative;display:inline-flex;align-items:center;min-width:0;color:#4e463f;font:800 .61rem/1 system-ui,sans-serif}
#skyFoundationFocus .sky-relationship-display-head{position:relative!important;display:flex!important;align-items:center!important;gap:4px!important;min-width:0!important;height:29px!important;padding:0!important;border:0!important;background:transparent!important}
#skyFoundationFocus .sky-relationship-display-label{min-width:0!important;padding:0!important;white-space:nowrap!important;color:#5a524b!important;font:800 .61rem/1 system-ui,sans-serif!important}
#skyFoundationFocus .sky-relationship-display-value{display:flex!important;align-items:center!important;width:auto!important;min-width:118px!important;max-width:170px!important;height:29px!important;box-sizing:border-box!important;margin:0!important;padding:0 30px 0 9px!important;border:1px solid rgba(31,27,24,.18)!important;border-radius:999px!important;background:#fff!important;color:#332e2a!important;font:800 .67rem/1 system-ui,sans-serif!important;overflow:hidden!important;text-align:left!important;cursor:pointer!important}
#skyFoundationFocus .sky-relationship-display-value-text{display:block!important;min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;pointer-events:none!important}
#skyFoundationFocus .sky-relationship-display-toggle{position:absolute!important;right:0!important;top:0!important;z-index:2!important;width:29px!important;min-width:29px!important;height:29px!important;box-sizing:border-box!important;margin:0!important;padding:0!important;border:0!important;border-radius:0 999px 999px 0!important;background-color:transparent!important;background-image:var(--sky-chart-filter-chevron)!important;background-repeat:no-repeat!important;background-position:center!important;background-size:14px 14px!important;color:transparent!important;font-size:0!important;cursor:pointer!important}
#skyFoundationFocus .sky-relationship-display-value:hover,#skyFoundationFocus .sky-relationship-display-value:focus-visible,#skyFoundationFocus .sky-relationship-display-toggle:hover,#skyFoundationFocus .sky-relationship-display-toggle:focus-visible{border-color:#6b625a!important;background-color:#fff!important;outline:none!important}
#skyFoundationFocus .sky-relationship-display-control.is-open .sky-relationship-display-value{border-color:#6b625a!important;box-shadow:0 0 0 2px rgba(31,27,24,.06)!important}
#skyFoundationFocus .sky-relationship-display-popover{position:absolute;top:calc(100% + 6px);right:0;width:min(280px,calc(100vw - 24px));box-sizing:border-box;padding:7px;border:1px solid rgba(31,27,24,.22);border-radius:13px;background:#fffdf8;box-shadow:0 16px 38px rgba(31,27,24,.2);pointer-events:auto}
#skyFoundationFocus .sky-relationship-display-popover[hidden]{display:none!important}.sky-relationship-display-popover.is-portaled{position:fixed!important;z-index:10000!important;right:auto!important;bottom:auto!important;margin:0!important;transform:none!important;isolation:isolate!important}.sky-relationship-display-list{overflow:hidden;border:1px solid rgba(31,27,24,.17);border-radius:9px;background:#fff}.sky-relationship-display-option{appearance:none;display:flex;width:100%;min-height:38px;align-items:center;justify-content:space-between;gap:10px;box-sizing:border-box;padding:8px 10px;border:0;border-top:1px solid rgba(31,27,24,.075);background:#fff;color:#29231e;font:750 .67rem/1.15 system-ui,sans-serif;text-align:left;cursor:pointer}.sky-relationship-display-option:first-child{border-top:0}.sky-relationship-display-option:hover,.sky-relationship-display-option:focus-visible{background:#f4efe8;outline:none}.sky-relationship-display-option:has(input:checked){background:#f4efe8;font-weight:900}.sky-relationship-display-option input{flex:0 0 auto;width:15px;height:15px;margin:0;accent-color:#191613}.sky-relationship-display-actions{display:flex;justify-content:flex-end;gap:5px;padding:0 0 6px}.sky-relationship-display-actions button{min-height:27px;padding:4px 8px;border:1px solid rgba(31,27,24,.22);border-radius:7px;background:#fff;color:#29231e;font:800 .6rem/1 system-ui,sans-serif;cursor:pointer}.sky-relationship-display-actions button:hover,.sky-relationship-display-actions button:focus-visible{background:#f4efe8;outline:none}
@media(max-width:620px){#skyFoundationRelationships{overflow:visible!important}#skyFoundationRelationships #skyFoundationRelationshipList,#skyFoundationRelationships #skyFoundationRelationshipList:has(>.sky-foundation-relationship-row.is-inline-expanded){max-height:none!important;height:auto!important;overflow:visible!important;overscroll-behavior-y:auto!important;-webkit-overflow-scrolling:auto!important;touch-action:pan-y!important;padding-bottom:max(28px,env(safe-area-inset-bottom))!important}#skyFoundationRelationships .sky-foundation-relationship-row.is-inline-expanded{overflow:visible!important}}
`;document.head.appendChild(style)}

function syncControl(state=readState()){
  const owner=control();if(!owner)return;
  const value=owner.querySelector('[data-relationship-display-value]');
  let text=value?.querySelector('[data-relationship-display-value-text]');
  if(value&&!text){text=document.createElement('span');text.className='sky-relationship-display-value-text';text.dataset.relationshipDisplayValueText='true';value.replaceChildren(text)}
  if(text)text.textContent=stateSummary(state);
  owner.querySelectorAll('[data-shared-display-layer]').forEach(input=>{input.checked=!!state[input.dataset.sharedDisplayLayer]});
}
function positionPortal(){const owner=portalOwner,menu=popover(),head=owner?.querySelector('.sky-relationship-display-head');if(!isOpen(owner)||!menu?.classList.contains('is-portaled')||!head)return;const rect=head.getBoundingClientRect(),margin=12,width=Math.min(280,Math.max(230,window.innerWidth-margin*2)),left=Math.min(window.innerWidth-width-margin,Math.max(margin,rect.left+rect.width/2-width/2)),menuHeight=Math.min(190,window.innerHeight-margin*2),roomBelow=window.innerHeight-rect.bottom-margin,above=roomBelow<menuHeight&&rect.top>roomBelow,top=above?Math.max(margin,rect.top-menuHeight-6):Math.min(window.innerHeight-menuHeight-margin,rect.bottom+6);Object.assign(menu.style,{width:`${width}px`,left:`${left}px`,top:`${Math.max(margin,top)}px`})}
function open(owner=control()){const menu=owner?.querySelector('.sky-relationship-display-popover')||popover();if(!owner||!menu)return;portalOwner=owner;owner.classList.add('is-open');menu.hidden=false;menu.classList.add('is-portaled');document.body.appendChild(menu);owner.querySelector('[data-relationship-display-value]')?.setAttribute('aria-expanded','true');owner.querySelector('[data-relationship-display-toggle]')?.setAttribute('aria-expanded','true');requestAnimationFrame(()=>{positionPortal();menu.querySelector('[data-shared-display-layer]')?.focus({preventScroll:true})})}
function close(owner=portalOwner||control(),{focus=false}={}){const menu=popover();if(!owner||!menu)return;menu.hidden=true;menu.classList.remove('is-portaled');menu.removeAttribute('style');owner.appendChild(menu);owner.classList.remove('is-open');owner.querySelector('[data-relationship-display-value]')?.setAttribute('aria-expanded','false');owner.querySelector('[data-relationship-display-toggle]')?.setAttribute('aria-expanded','false');portalOwner=null;if(focus)owner.querySelector('[data-relationship-display-value]')?.focus({preventScroll:true})}
function chooseLayer(id,checked){const state=readState();state[id]=!!checked;setState(state);syncControl(state)}
function createControl(){
  const owner=document.createElement('div');owner.className='sky-relationship-display-control';owner.dataset.relationshipDisplayControl='true';
  const head=document.createElement('div');head.className='sky-relationship-display-head';
  const label=document.createElement('span');label.className='sky-relationship-display-label';label.textContent='Display';
  const value=document.createElement('button');value.type='button';value.className='sky-relationship-display-value';value.dataset.relationshipDisplayValue='true';value.setAttribute('aria-label','Choose display layers');value.setAttribute('aria-haspopup','dialog');value.setAttribute('aria-expanded','false');value.setAttribute('aria-controls','skyRelationshipDisplayPopover');
  const valueText=document.createElement('span');valueText.className='sky-relationship-display-value-text';valueText.dataset.relationshipDisplayValueText='true';value.appendChild(valueText);
  const toggle=document.createElement('button');toggle.type='button';toggle.className='sky-relationship-display-toggle';toggle.dataset.relationshipDisplayToggle='true';toggle.setAttribute('aria-label','Choose display layers');toggle.setAttribute('aria-haspopup','dialog');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','skyRelationshipDisplayPopover');
  const menu=document.createElement('div');menu.id='skyRelationshipDisplayPopover';menu.className='sky-relationship-display-popover';menu.hidden=true;menu.setAttribute('role','dialog');menu.setAttribute('aria-label','Display layers');
  const actions=document.createElement('div');actions.className='sky-relationship-display-actions';
  const all=document.createElement('button');all.type='button';all.textContent='All';all.addEventListener('click',e=>{e.preventDefault();setState({glyphs:true,names:true,referents:true})});
  const none=document.createElement('button');none.type='button';none.textContent='None';none.addEventListener('click',e=>{e.preventDefault();setState({glyphs:false,names:false,referents:false})});
  actions.append(all,none);
  const list=document.createElement('div');list.className='sky-relationship-display-list';
  for(const item of DISPLAY_ITEMS){
    const option=document.createElement('label');option.className='sky-relationship-display-option';
    const text=document.createElement('span');text.textContent=item.label;
    const input=document.createElement('input');input.type='checkbox';input.dataset.sharedDisplayLayer=item.id;input.setAttribute('aria-label',item.label);input.addEventListener('change',()=>chooseLayer(item.id,input.checked));
    option.append(text,input);list.appendChild(option);
  }
  menu.append(actions,list);head.append(label,value,toggle);owner.append(head,menu);
  const toggleMenu=()=>isOpen(owner)?close(owner):open(owner);value.addEventListener('click',toggleMenu);toggle.addEventListener('click',toggleMenu);
  return owner;
}
function ensureControl(){
  const slot=document.querySelector('#skyFoundationFocus .sky-focus-heading-controls');if(!slot)return false;
  const stray=document.querySelector('#skyFoundationRelationships [data-relationship-display-control],#skyFoundationFocus .sky-chart-filter-bar [data-relationship-display-control]');
  if(stray&&stray.parentElement!==slot)stray.remove();
  let owner=slot.querySelector(':scope>[data-relationship-display-control]');
  if(owner&&!owner.querySelector('[data-shared-display-layer]')){owner.remove();owner=null}
  if(!owner){owner=createControl();slot.appendChild(owner)}
  syncControl();
  return true;
}
function reconcile(){queued=false;installStyles();ensureControl();const root=document.getElementById('skyFoundationRelationships')||document;applyState(root,false)}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(reconcile)}
function ensureObserver(){const root=document.getElementById('skyFoundationRelationships');if(!root||root===observedRoot)return;observer?.disconnect();observedRoot=root;observer=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)applyAdded(node)});observer.observe(root,{childList:true,subtree:true})}
function closeOutside(e){const owner=portalOwner,menu=popover();if(!isOpen(owner))return;if(owner?.contains(e.target)||menu?.contains(e.target))return;close(owner)}
function handleMenuKey(e){if(e.key==='Escape'&&isOpen(portalOwner)){e.preventDefault();close(portalOwner,{focus:true})}}
function start(){
  installStyles();writeState(readState());reconcile();ensureObserver();
  ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready'].forEach(name=>window.addEventListener(name,()=>{ensureObserver();schedule()}));
  ['relphi:sky-foundation-filter-changed','relphi:selected-relationship-rendered','relphi:sky-progressive-symbols-ready'].forEach(name=>window.addEventListener(name,()=>{const root=document.getElementById('skyFoundationRelationships');if(root)applyState(root,false)}));
  document.addEventListener('pointerdown',closeOutside,true);document.addEventListener('keydown',handleMenuKey,true);window.addEventListener('resize',positionPortal);window.addEventListener('scroll',positionPortal,true);
  window.addEventListener('storage',event=>{if(event.key===SHARED_STORAGE_KEY){const state=readState();syncControl(state);applyState(document,true,state)}});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
window.RelphiSkyRelationshipDisplay=Object.freeze({
  getMode:()=>legacyModeFromState(readState()),
  setMode:mode=>setMode(mode),
  getState:readState,
  setState,
  apply:(root,force=false)=>applyState(root||document,force)
});
})();
