// Where and When viewport v2. Content stays compact; only the field body scrolls when the viewport actually requires it.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyWhereWhenViewportV2)return;
window.__relphiSkyWhereWhenViewportV2=true;
window.__relphiSkyWhereWhenViewportV1=true;

const slots=['A','B'];
let queued=false;

function installStyle(){
  if(document.getElementById('skyWhereWhenViewportStyleV2'))return;
  const node=document.createElement('style');
  node.id='skyWhereWhenViewportStyleV2';
  node.textContent=`
    .sky-where-when-scroll-body{display:contents}
    @media(min-width:621px){
      .sky-where-when-grid{
        grid-template-columns:minmax(118px,1.15fr) minmax(96px,.85fr)!important
      }
    }
    @media(min-width:901px){
      .sky-where-when-editor{
        display:grid!important;
        grid-template-rows:auto auto!important;
        height:auto!important;
        max-height:none!important;
        min-height:0!important;
        align-self:start!important;
        align-content:start!important;
        padding:0!important;
        gap:0!important;
        overflow:visible!important;
      }
      .sky-where-when-scroll-body{
        display:grid!important;
        grid-auto-rows:max-content!important;
        align-content:start!important;
        gap:12px!important;
        width:100%!important;
        height:auto!important;
        min-width:0!important;
        min-height:0!important;
        max-width:100%!important;
        box-sizing:border-box!important;
        overflow-y:auto!important;
        overflow-x:hidden!important;
        overscroll-behavior:contain;
        scrollbar-gutter:auto;
        padding:12px!important;
      }
      .sky-where-when-footer{
        position:relative!important;
        inset:auto!important;
        z-index:30!important;
        display:grid!important;
        grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
        gap:7px!important;
        width:100%!important;
        margin:0!important;
        padding:8px 12px 12px!important;
        box-sizing:border-box!important;
        border-top:1px solid rgba(31,27,24,.12)!important;
        background:#fffdfa!important;
        box-shadow:0 -8px 18px rgba(255,253,250,.96)!important;
      }
      .sky-where-when-footer .sky-where-when-button{
        width:100%!important;
        min-width:0!important;
        margin:0!important;
      }
      .sky-where-when-footer .sky-update-now-editor{margin:0!important}
      .sky-where-when-footer .sky-where-when-button.primary{grid-column:1/-1}
    }
  `;
  document.head.appendChild(node);
}

function editor(slot){return document.querySelector(`.sky-where-when-editor[data-slot="${slot}"]`)}
function wrapForm(form){
  if(!form)return null;
  let body=form.querySelector(':scope > .sky-where-when-scroll-body');
  const footer=form.querySelector(':scope > .sky-where-when-footer');
  if(!footer)return null;
  if(!body){
    body=document.createElement('div');
    body.className='sky-where-when-scroll-body';
    body.dataset.wwScrollBody='true';
    const children=Array.from(form.children).filter(node=>node!==footer);
    form.insertBefore(body,footer);
    children.forEach(node=>body.appendChild(node));
  }else if(body.nextElementSibling!==footer){
    form.insertBefore(body,footer);
  }
  return body;
}
function sizeBody(form,body){
  if(!form||!body)return;
  if(!window.matchMedia?.('(min-width:901px)')?.matches){body.style.removeProperty('max-height');return}
  const footer=form.querySelector(':scope > .sky-where-when-footer');
  const top=Math.max(0,form.getBoundingClientRect().top);
  const footerHeight=Math.ceil(footer?.getBoundingClientRect().height||0);
  const available=Math.max(260,Math.floor(window.innerHeight-top-footerHeight-10));
  body.style.maxHeight=`${available}px`;
}
function normalize(slot){
  const form=editor(slot);if(!form)return;
  const body=wrapForm(form);if(!body)return;
  const preview=body.querySelector(`[data-ww-heptagram-slot="${slot}"]`);
  const advanced=body.querySelector('.sky-where-when-advanced');
  if(preview&&advanced&&preview.nextElementSibling!==advanced)advanced.before(preview);
  sizeBody(form,body);
  if(preview&&preview.dataset.draftHeptagramReady!=='true')window.RelphiSkyWhereWhenDraftHeptagram?.render?.(slot);
}
function normalizeAll(){queued=false;slots.forEach(normalize)}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(normalizeAll))}

installStyle();schedule();
const root=document.getElementById('skyFoundationRoot');
if(root){
  new MutationObserver(records=>{
    if(records.some(record=>Array.from(record.addedNodes).some(node=>node.nodeType===1&&(node.matches?.('.sky-where-when-editor,.sky-where-when-footer,[data-ww-heptagram-slot]')||node.querySelector?.('.sky-where-when-editor,.sky-where-when-footer,[data-ww-heptagram-slot]')))))schedule();
  }).observe(root,{subtree:true,childList:true});
}
window.addEventListener('relphi:sky-where-when-edit-state-changed',schedule);
window.addEventListener('resize',schedule,{passive:true});
window.visualViewport?.addEventListener('resize',schedule,{passive:true});
})();
