// Keep the Where and When heptagram visible outside the collapsible drawer.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyStaticHeptagramV1)return;
window.__relphiSkyStaticHeptagramV1=true;

const SLOTS=['A','B'];
let queued=false,observer=null;

function installStyle(){
  if(document.getElementById('skyStaticHeptagramV1Style'))return;
  const style=document.createElement('style');
  style.id='skyStaticHeptagramV1Style';
  style.textContent=`
    .sky-static-heptagram-panel{
      display:grid;place-items:center;width:100%;min-width:0;min-height:0;
      box-sizing:border-box;padding:8px 8px 10px;border-bottom:1px solid rgba(31,27,24,.11);
      background:#fffdfa
    }
    .sky-static-heptagram-panel[hidden]{display:none!important}
    .sky-static-heptagram-panel>a,
    .sky-static-heptagram-panel>.sky-static-heptagram-frame{
      display:grid;place-items:center;width:100%;min-width:0;margin:0;text-decoration:none
    }
    .sky-static-heptagram-panel .sky-ph-heptagram{
      display:block!important;width:min(100%,188px)!important;height:auto!important;max-height:198px!important;
      margin:0 auto!important;overflow:visible!important
    }
    .sky-static-heptagram-panel .sky-where-when-draft-heptagram{
      width:min(100%,176px)!important;max-height:176px!important
    }
    @media(max-width:620px){
      .sky-static-heptagram-panel{padding:7px 6px 9px}
      .sky-static-heptagram-panel .sky-ph-heptagram{width:min(100%,178px)!important;max-height:188px!important}
      .sky-static-heptagram-panel .sky-where-when-draft-heptagram{width:min(100%,176px)!important;max-height:176px!important}
    }

    /* The original nodes stay alive as rendering sources, but no longer occupy the drawer. */
    .sky-card-drawer[data-sky-drawer="where"] [data-sky-heptagram-frame],
    .sky-card-drawer[data-sky-drawer="where"] .sky-where-when-heptagram-slot{
      position:absolute!important;width:1px!important;height:1px!important;min-width:0!important;min-height:0!important;
      margin:0!important;padding:0!important;overflow:hidden!important;opacity:0!important;pointer-events:none!important
    }
  `;
  document.head.appendChild(style);
}

function panel(slot){return document.getElementById(`skyFoundation${slot}`)}
function editor(slot){return panel(slot)?.querySelector(`.sky-where-when-editor[data-slot="${slot}"]`)||null}
function shell(slot){return window.RelphiSkyCardShell?.get?.(slot)||null}
function root(slot){return shell(slot)?.root||panel(slot)?.querySelector(':scope > .sky-foundation-body > .sky-card-drawers')||null}
function staticPanel(slot){return root(slot)?.querySelector(`:scope > [data-sky-static-heptagram="${slot}"]`)||null}

function ensurePanel(slot){
  const cardRoot=root(slot);if(!cardRoot)return null;
  let node=staticPanel(slot);
  if(!node){
    node=document.createElement('section');
    node.className='sky-static-heptagram-panel';
    node.dataset.skyStaticHeptagram=slot;
    node.setAttribute('aria-label',`Sky ${slot} planetary-hours heptagram`);
    node.hidden=true;
    const tabs=cardRoot.querySelector(':scope > .sky-card-fingerprint-tabs');
    if(tabs)tabs.insertAdjacentElement('afterend',node);else cardRoot.prepend(node);
  }
  return node;
}

function simpleHash(text){
  let hash=2166136261;
  for(let i=0;i<text.length;i+=1){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619)}
  return (hash>>>0).toString(36);
}
function sourceFor(slot){
  const card=panel(slot);if(!card)return null;
  const draft=card.querySelector('.sky-where-when-heptagram-slot [data-draft-where-when="true"]');
  const draftJump=card.querySelector('.sky-where-when-heptagram-slot .sky-where-when-ph-jump');
  if(editor(slot)&&draft)return{svg:draft,href:String(draftJump?.getAttribute('href')||''),title:'Open this draft moment in Planetary Hours',mode:'draft'};
  const refs=shell(slot),svg=refs?.heptagram;
  if(!svg||!svg.childElementCount)return null;
  const frame=svg.closest('[data-sky-heptagram-frame]');
  return{svg,href:String(frame?.getAttribute('href')||''),title:String(frame?.getAttribute('title')||'Open this Sky in Planetary Hours'),mode:'committed'};
}
function renderSlot(slot){
  const target=ensurePanel(slot);if(!target)return;
  const source=sourceFor(slot);
  if(!source){target.hidden=true;target.replaceChildren();delete target.dataset.staticHeptagramSignature;return}
  const raw=`${source.mode}|${source.href}|${source.svg.outerHTML}`;
  const signature=simpleHash(raw);
  if(target.dataset.staticHeptagramSignature===signature){target.hidden=false;return}
  const clone=source.svg.cloneNode(true);
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
  clone.setAttribute('aria-hidden','true');
  clone.removeAttribute('role');
  let frame;
  if(source.href){
    frame=document.createElement('a');
    frame.href=source.href;frame.title=source.title;
    frame.setAttribute('aria-label',source.title);
  }else{
    frame=document.createElement('div');
    frame.className='sky-static-heptagram-frame';
  }
  frame.appendChild(clone);
  target.replaceChildren(frame);
  target.dataset.staticHeptagramSignature=signature;
  target.dataset.staticHeptagramMode=source.mode;
  target.hidden=false;
}
function render(){queued=false;installStyle();SLOTS.forEach(renderSlot)}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(render))}
function relevantMutation(record){
  const target=record.target;
  if(target?.closest?.('[data-sky-static-heptagram]'))return false;
  return true;
}
function start(){
  installStyle();schedule();
  const foundation=document.getElementById('skyFoundationRoot')||document.body;
  observer=new MutationObserver(records=>{if(records.some(relevantMutation))schedule()});
  observer.observe(foundation,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','href','data-canonical-source-ready','data-canonical-heptagram-ready','data-draft-heptagram-ready']});
  [
    'relphi:sky-foundation-ready','relphi:sky-heptagram-source-ready','relphi:sky-heptagram-canonical-ready',
    'relphi:sky-drawer-opened','relphi:sky-drawer-closed','relphi:sky-where-when-edit-state-changed',
    'relphi:sky-where-when-committed','relphi:saved-sky-loaded','relphi:saved-sky-active-changed',
    'relphi:sky-live-origin-changed','relphi:sky-session-recovered'
  ].forEach(name=>window.addEventListener(name,schedule));
  document.addEventListener('input',event=>{if(event.target.closest?.('.sky-where-when-editor'))schedule()},true);
  document.addEventListener('change',event=>{if(event.target.closest?.('.sky-where-when-editor'))schedule()},true);
}
window.RelphiSkyStaticHeptagram=Object.freeze({render:schedule});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
