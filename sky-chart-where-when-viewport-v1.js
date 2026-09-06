// Viewport ergonomics for the Sky Chart Where and When editor.
// Keeps the commit actions visible on desktop and makes the live draft heptagram
// part of the main editing flow before Advanced settings.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyWhereWhenViewportV1)return;
window.__relphiSkyWhereWhenViewportV1=true;

const slots=['A','B'];
const timers={A:0,B:0};
let queued=false;

function style(){
  if(document.getElementById('skyWhereWhenViewportStyleV1'))return;
  const node=document.createElement('style');
  node.id='skyWhereWhenViewportStyleV1';
  node.textContent=`
    @media (min-width:901px){
      .sky-where-when-editor{
        max-height:clamp(390px,calc(100dvh - 295px),680px);
        overflow-y:auto;
        overscroll-behavior:contain;
        scrollbar-gutter:stable;
      }
      .sky-where-when-footer{
        position:sticky;
        bottom:-12px;
        z-index:20;
        margin:0 -12px -12px;
        padding:8px 12px 12px;
        border-top:1px solid rgba(31,27,24,.12);
        background:#fffdfa;
        box-shadow:0 -8px 18px rgba(255,253,250,.96);
      }
    }
    .sky-where-when-heptagram-slot[data-draft-heptagram-ready="true"]{
      min-height:176px!important;
      padding:2px 0!important;
    }
    .sky-where-when-draft-heptagram{
      width:min(100%,172px)!important;
    }
    @media(max-width:620px){
      .sky-where-when-heptagram-slot[data-draft-heptagram-ready="true"]{
        min-height:164px!important;
      }
      .sky-where-when-draft-heptagram{
        width:min(100%,160px)!important;
      }
    }
  `;
  document.head.appendChild(node);
}

function editor(slot){return document.querySelector(`.sky-where-when-editor[data-slot="${slot}"]`)}
function previewApi(){return window.RelphiSkyWhereWhenDraftHeptagram||null}

function refresh(slot,delay=0){
  if(!slot||!(slot in timers))return;
  clearTimeout(timers[slot]);
  timers[slot]=window.setTimeout(()=>{
    timers[slot]=0;
    if(!editor(slot))return;
    previewApi()?.render?.(slot);
  },delay);
}

function normalize(slot){
  const form=editor(slot);if(!form)return;
  const preview=form.querySelector(`[data-ww-heptagram-slot="${slot}"]`);
  const advanced=form.querySelector('.sky-where-when-advanced');
  if(preview&&advanced&&preview.nextElementSibling!==advanced)advanced.before(preview);
  if(preview&&preview.dataset.draftHeptagramReady!=='true')refresh(slot,0);
}

function normalizeAll(){
  queued=false;
  slots.forEach(normalize);
}
function scheduleNormalize(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>requestAnimationFrame(normalizeAll));
}

function slotFor(target){
  const form=target?.closest?.('.sky-where-when-editor');
  return form?.dataset?.slot||'';
}

style();
scheduleNormalize();

const root=document.getElementById('skyFoundationRoot');
if(root){
  new MutationObserver(records=>{
    if(records.some(record=>Array.from(record.addedNodes).some(node=>node.nodeType===1&&(node.matches?.('.sky-where-when-editor,.sky-where-when-heptagram-slot')||node.querySelector?.('.sky-where-when-editor,.sky-where-when-heptagram-slot')))))scheduleNormalize();
  }).observe(root,{subtree:true,childList:true});
}

['input','change'].forEach(type=>document.addEventListener(type,event=>{
  const slot=slotFor(event.target);
  if(slot&&event.target.matches?.('[data-ww-field]'))refresh(slot,type==='input'?40:15);
},true));

document.addEventListener('click',event=>{
  const form=event.target.closest?.('.sky-where-when-editor');
  if(!form)return;
  const slot=form.dataset.slot;if(!slot)return;
  const action=event.target.closest?.('[data-ww-action]')?.dataset?.wwAction||'';
  if(['select-location','use-current-location','use-now','resolve-coordinates','apply-inference'].includes(action)){
    refresh(slot,0);
    window.setTimeout(()=>refresh(slot,0),160);
  }
},true);

window.addEventListener('relphi:sky-where-when-edit-state-changed',()=>{
  scheduleNormalize();
  window.setTimeout(()=>slots.forEach(slot=>{if(editor(slot))refresh(slot,0)}),80);
});
window.addEventListener('relphi:sky-heptagram-canonical-ready',()=>slots.forEach(slot=>{if(editor(slot))refresh(slot,0)}));
window.addEventListener('relphi:sky-heptagram-source-ready',()=>slots.forEach(slot=>{if(editor(slot))refresh(slot,0)}));
})();
