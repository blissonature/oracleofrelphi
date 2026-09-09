// Keep the live Where and When heptagram in the editor's static footer with its actions.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyStaticHeptagramV3)return;
window.__relphiSkyStaticHeptagramV3=true;
window.__relphiSkyStaticHeptagramV2=true;
window.__relphiSkyStaticHeptagramV1=true;

const SLOTS=['A','B'];
let queued=false,observer=null;

function installStyle(){
  document.getElementById('skyStaticHeptagramV1Style')?.remove();
  document.getElementById('skyStaticHeptagramV2Style')?.remove();
  if(document.getElementById('skyStaticHeptagramV3Style'))return;
  const style=document.createElement('style');
  style.id='skyStaticHeptagramV3Style';
  style.textContent=`
    /* The original preview mount remains immediately below Advanced so existing
       draft/render controllers keep their DOM contract, but it is only a source. */
    .sky-where-when-editor [data-ww-heptagram-slot]{
      position:absolute!important;width:1px!important;height:1px!important;min-width:0!important;min-height:0!important;
      margin:0!important;padding:0!important;overflow:hidden!important;opacity:0!important;pointer-events:none!important
    }
    .sky-where-when-footer{
      display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:auto auto!important;gap:8px!important;
      width:100%!important;margin:0!important;padding:8px 12px 12px!important;box-sizing:border-box!important;
      border-top:1px solid rgba(31,27,24,.12)!important;background:#fffdfa!important;
      box-shadow:0 -8px 18px rgba(255,253,250,.96)!important
    }
    .sky-where-when-footer-heptagram{
      display:grid;place-items:center;width:100%;min-width:0;min-height:0;padding:0;margin:0
    }
    .sky-where-when-footer-heptagram[hidden]{display:none!important}
    .sky-where-when-footer-heptagram>a,
    .sky-where-when-footer-heptagram>.sky-where-when-footer-heptagram-frame{
      display:grid;place-items:center;width:100%;min-width:0;margin:0;text-decoration:none
    }
    .sky-where-when-footer-heptagram .sky-ph-heptagram{
      display:block!important;width:min(100%,176px)!important;height:auto!important;max-height:176px!important;
      margin:0 auto!important;overflow:visible!important;visibility:visible!important
    }
    .sky-where-when-footer-actions{
      display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,2fr)!important;
      align-items:center;gap:7px;width:100%;min-width:0
    }
    .sky-where-when-footer-actions>.sky-where-when-button{
      width:100%!important;min-width:0!important;margin:0!important
    }
    .sky-where-when-footer-actions>.sky-where-when-button.primary{grid-column:auto!important}
    @media(max-width:620px){
      .sky-where-when-footer{padding:7px 10px 10px!important;gap:7px!important}
      .sky-where-when-footer-actions{grid-template-columns:minmax(0,.9fr) minmax(0,2.1fr)!important}
      .sky-where-when-footer-heptagram .sky-ph-heptagram{width:min(100%,168px)!important;max-height:168px!important}
    }
  `;
  document.head.appendChild(style);
}

function editor(slot){return document.querySelector(`.sky-where-when-editor[data-slot="${slot}"]`)}
function sourceFor(form,slot){
  const mount=form?.querySelector(`[data-ww-heptagram-slot="${slot}"]`);if(!mount)return null;
  const draft=mount.querySelector('[data-draft-where-when="true"]');
  const draftJump=mount.querySelector('.sky-where-when-ph-jump');
  if(draft&&draft.style.visibility!=='hidden')return{svg:draft,href:String(draftJump?.getAttribute('href')||''),title:'Open this draft moment in Planetary Hours'};
  const committed=mount.querySelector('[data-sky-heptagram-frame] .sky-ph-heptagram');
  const frame=committed?.closest?.('[data-sky-heptagram-frame]');
  return committed?{svg:committed,href:String(frame?.getAttribute('href')||''),title:String(frame?.getAttribute('title')||'Open this Sky in Planetary Hours')}:null;
}
function simpleHash(text){let hash=2166136261;for(let i=0;i<text.length;i+=1){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619)}return(hash>>>0).toString(36)}
function ensureStructure(form){
  const footer=form?.querySelector(':scope > .sky-where-when-footer');if(!footer)return null;
  let preview=footer.querySelector(':scope > .sky-where-when-footer-heptagram');
  if(!preview){preview=document.createElement('div');preview.className='sky-where-when-footer-heptagram';preview.hidden=true;footer.prepend(preview)}
  let actions=footer.querySelector(':scope > .sky-where-when-footer-actions');
  if(!actions){actions=document.createElement('div');actions.className='sky-where-when-footer-actions';footer.appendChild(actions)}
  Array.from(footer.children).forEach(node=>{
    if(node===preview||node===actions)return;
    if(node.matches?.('.sky-where-when-button'))actions.appendChild(node);
  });
  Array.from(actions.children).forEach(node=>{
    if(!node.matches?.('.sky-where-when-button'))return;
    if(node.matches('.sky-where-when-cancel'))node.dataset.footerAction='cancel';
    if(node.matches('[type="submit"]'))node.dataset.footerAction='confirm';
  });
  return{footer,preview,actions};
}
function renderSlot(slot){
  document.querySelectorAll(`#skyFoundation${slot} .sky-static-heptagram-panel`).forEach(node=>node.remove());
  const form=editor(slot);if(!form)return;
  const structure=ensureStructure(form);if(!structure)return;
  const source=sourceFor(form,slot);
  if(!source){structure.preview.hidden=true;structure.preview.replaceChildren();delete structure.preview.dataset.signature;return}
  const signature=simpleHash(`${source.href}|${source.svg.outerHTML}`);
  if(structure.preview.dataset.signature===signature){structure.preview.hidden=false;return}
  const clone=source.svg.cloneNode(true);
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
  clone.setAttribute('aria-hidden','true');
  clone.removeAttribute('role');
  clone.style.visibility='visible';
  let frame;
  if(source.href){frame=document.createElement('a');frame.href=source.href;frame.title=source.title;frame.setAttribute('aria-label',source.title)}
  else{frame=document.createElement('div');frame.className='sky-where-when-footer-heptagram-frame'}
  frame.appendChild(clone);structure.preview.replaceChildren(frame);structure.preview.dataset.signature=signature;structure.preview.hidden=false;
}
function render(){queued=false;installStyle();SLOTS.forEach(renderSlot)}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(render))}
function start(){
  installStyle();document.querySelectorAll('.sky-static-heptagram-panel').forEach(node=>node.remove());schedule();
  const root=document.getElementById('skyFoundationRoot')||document.body;
  observer=new MutationObserver(records=>{if(records.some(record=>!record.target?.closest?.('.sky-where-when-footer-heptagram')))schedule()});
  observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','href','style','data-draft-heptagram-ready','data-canonical-source-ready','data-canonical-heptagram-ready']});
  ['relphi:sky-drawer-opened','relphi:sky-drawer-closed','relphi:sky-where-when-edit-state-changed','relphi:sky-where-when-committed','relphi:sky-heptagram-source-ready','relphi:sky-heptagram-canonical-ready'].forEach(name=>window.addEventListener(name,schedule));
  document.addEventListener('input',event=>{if(event.target.closest?.('.sky-where-when-editor'))schedule()},true);
  document.addEventListener('change',event=>{if(event.target.closest?.('.sky-where-when-editor'))schedule()},true);
}
window.RelphiSkyStaticHeptagram=Object.freeze({render:schedule});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
