// Relationship display mode + mobile relationship-list scrolling.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyRelationshipDisplayV1)return;
window.__relphiSkyRelationshipDisplayV1=true;

const STORAGE_KEY='relphiSkyRelationshipDisplayV1';
const MODES=new Set(['glyphs','names','referents']);
const STYLE_ID='skyRelationshipDisplayV1Styles';
let queued=false;

function readMode(){
  try{const value=localStorage.getItem(STORAGE_KEY);return MODES.has(value)?value:'glyphs'}catch(_){return'glyphs'}
}
function writeMode(value){
  const mode=MODES.has(value)?value:'glyphs';
  try{localStorage.setItem(STORAGE_KEY,mode)}catch(_){}
  document.documentElement.dataset.relationshipDisplay=mode;
  return mode;
}
function modeLevel(mode){return mode==='referents'?2:mode==='names'?1:0}

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
function applyMode(root=document,force=false){
  const mode=readMode(),level=modeLevel(mode);
  document.documentElement.dataset.relationshipDisplay=mode;
  root.querySelectorAll?.('.sky-progressive-token').forEach(token=>applyProgressiveToken(token,level,force));
  root.querySelectorAll?.('.inline-rel-progressive-token').forEach(token=>applyInlineToken(token,level,force));
  const select=document.querySelector('[data-relationship-display-select]');
  if(select&&select.value!==mode)select.value=mode;
}

function installStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    #skyFoundationRelationships .sky-relationship-display-control{min-width:0!important}
    #skyFoundationRelationships .sky-relationship-display-control select{touch-action:manipulation!important}
    @media(min-width:901px){
      #skyFoundationRelationships .sky-chart-filter-bar>.sky-relationship-display-control{
        grid-column:1 / span 2!important;
        max-width:280px!important;
      }
    }
    @media(max-width:620px){
      #skyFoundationRelationships{overflow:visible!important}
      #skyFoundationRelationships #skyFoundationRelationshipList,
      #skyFoundationRelationships #skyFoundationRelationshipList:has(> .sky-foundation-relationship-row.is-inline-expanded){
        max-height:none!important;
        height:auto!important;
        overflow:visible!important;
        overscroll-behavior-y:auto!important;
        -webkit-overflow-scrolling:auto!important;
        touch-action:pan-y!important;
        padding-bottom:max(28px,env(safe-area-inset-bottom))!important;
      }
      #skyFoundationRelationships .sky-foundation-relationship-row.is-inline-expanded{
        overflow:visible!important;
      }
    }
  `;
  document.head.appendChild(style);
}

function ensureControl(){
  const bar=document.querySelector('#skyFoundationRelationships .sky-chart-filter-bar');
  if(!bar)return false;
  let label=bar.querySelector('[data-relationship-display-control]');
  if(!label){
    label=document.createElement('label');
    label.className='sky-relationship-display-control';
    label.dataset.relationshipDisplayControl='true';
    const caption=document.createElement('span');
    caption.textContent='Display';
    const select=document.createElement('select');
    select.dataset.relationshipDisplaySelect='true';
    select.setAttribute('aria-label','Relationship display');
    select.innerHTML='<option value="glyphs">Glyphs only</option><option value="names">Glyphs + names</option><option value="referents">Glyphs + names + referents</option>';
    select.value=readMode();
    select.addEventListener('change',()=>{
      writeMode(select.value);
      applyMode(document,true);
      window.dispatchEvent(new CustomEvent('relphi:relationship-display-changed',{detail:{mode:select.value}}));
    });
    label.append(caption,select);
    bar.appendChild(label);
  }
  return true;
}

function reconcile(){
  queued=false;
  installStyles();
  ensureControl();
  applyMode(document,false);
}
function schedule(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>requestAnimationFrame(reconcile));
}

function start(){
  installStyles();
  writeMode(readMode());
  reconcile();
  const root=document.getElementById('skyFoundationRelationships')||document.body;
  new MutationObserver(records=>{
    if(records.some(record=>record.addedNodes.length||record.removedNodes.length))schedule();
  }).observe(root,{childList:true,subtree:true});
  ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-foundation-filter-changed','relphi:selected-relationship-rendered','relphi:sky-progressive-symbols-ready'].forEach(name=>window.addEventListener(name,schedule));
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
window.RelphiSkyRelationshipDisplay={getMode:readMode,setMode:mode=>{writeMode(mode);applyMode(document,true);},apply:root=>applyMode(root||document,false)};
})();
