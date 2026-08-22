// Sky-card drawer contract: Where and When, Placements, and Card Hits are collapsible drawers.
// Where and When owns the encrypted heptagram summary; editing is one layer deeper.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyWhereWhenLayerV1)return;
window.__relphiSkyWhereWhenLayerV1=true;
window.__relphiSkyCardDrawersV1=true;

const VIEW_KEY='relphiSkyWhereWhenViewV1';
const SLOT_KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const openState={A:'',B:''};
let queued=false;
let observer=null;

function panel(slot){return document.getElementById(`skyFoundation${slot}`)}
function body(slot){return panel(slot)?.querySelector(':scope > .sky-foundation-body')||null}
function slotFor(node){return node?.closest('#skyFoundationA')?'A':node?.closest('#skyFoundationB')?'B':''}
function read(slot){try{return JSON.parse(localStorage.getItem(SLOT_KEYS[slot])||'null')}catch(_){return null}}
function profile(slot){const value=read(slot);return value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{}}
function complete(slot){const p=profile(slot);return!!(p&&p.dateTime&&p.location&&p.timeZone&&Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude)))}
function readView(){try{const value=JSON.parse(sessionStorage.getItem(VIEW_KEY)||'{}');return value&&typeof value==='object'?value:{}}catch(_){return{}}}
function writeView(slot,mode){try{const value=readView();value[slot]=mode;sessionStorage.setItem(VIEW_KEY,JSON.stringify(value))}catch(_){}}
function legacyAction(slot,action){return panel(slot)?.querySelector(`.sky-where-when-actions [data-ww-action="${action}"]`)||null}

function installStyles(){
  if(document.getElementById('skyCardDrawersV2Styles'))return;
  const style=document.createElement('style');
  style.id='skyCardDrawersV2Styles';
  style.textContent=`
    #skyFoundationA>.sky-foundation-heading,
    #skyFoundationB>.sky-foundation-heading{
      grid-template-rows:44px!important;
      min-height:44px!important;
    }
    .sky-card-drawers{display:grid;width:100%;min-width:0;border-top:1px solid rgba(31,27,24,.11)}
    .sky-card-drawer{min-width:0;margin:0;border:0;border-bottom:1px solid rgba(31,27,24,.11);background:#fffdfa}
    .sky-card-drawer>summary{
      display:grid;grid-template-columns:minmax(0,1fr) 18px;align-items:center;gap:.7rem;
      min-height:44px;box-sizing:border-box;padding:.7rem .82rem;list-style:none;
      color:#29231e;cursor:pointer;font:850 .72rem/1.2 system-ui,sans-serif;
      user-select:none;touch-action:manipulation;
    }
    .sky-card-drawer>summary::-webkit-details-marker{display:none}
    .sky-card-drawer-chevron{display:block;width:16px;height:16px;justify-self:end;fill:none;stroke:#696058;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:transform .14s ease;transform:rotate(0deg)}
    .sky-card-drawer[open]>.sky-card-drawer-summary .sky-card-drawer-chevron{transform:rotate(90deg)}
    .sky-card-drawer>summary:hover,.sky-card-drawer>summary:focus-visible{background:#f8f3ed;outline:none}
    .sky-card-drawer-body{min-width:0;overflow:visible}
    .sky-card-drawer-body>.sky-where-when-view,
    .sky-card-drawer-body>.sky-where-when-placement-view{visibility:visible!important;width:100%;min-width:0;box-sizing:border-box}
    .sky-card-drawer-body>.sky-where-when-view[hidden],
    .sky-card-drawer-body>.sky-where-when-placement-view[hidden]{display:none!important}

    .sky-card-drawer[data-sky-drawer="where"] .sky-where-when-confirmed{
      display:grid!important;justify-items:center;gap:.42rem!important;padding:.55rem .7rem .8rem!important;overflow:visible!important
    }
    .sky-card-drawer[data-sky-drawer="where"] .sky-where-when-facts,
    .sky-card-drawer[data-sky-drawer="where"] .sky-ph-jump-title,
    .sky-card-drawer[data-sky-drawer="where"] .sky-ph-summary,
    .sky-card-drawer[data-sky-drawer="where"] .sky-ph-node-label,
    .sky-card-drawer[data-sky-drawer="where"] .sky-ph-center-label{display:none!important}
    .sky-card-drawer[data-sky-drawer="where"] .sky-ph-jump[data-where-when-thumbnail="true"]{
      display:grid!important;place-items:center;width:100%;min-width:0;gap:0!important;margin:0!important;
      padding:.45rem .5rem .1rem!important;border:0!important;border-radius:0!important;background:transparent!important;
      box-shadow:none!important;overflow:visible!important;cursor:default!important;transform:none!important;pointer-events:none!important
    }
    .sky-card-drawer[data-sky-drawer="where"] .sky-ph-heptagram{
      display:block!important;width:min(184px,74vw)!important;max-width:100%!important;height:auto!important;
      max-height:none!important;margin:0 auto!important;overflow:visible!important
    }
    .sky-show-exact-where-when{
      appearance:none;display:inline-flex;align-items:center;justify-content:center;min-height:42px;
      border:0;border-radius:8px;background:transparent;color:#5b1715;padding:.48rem .7rem;
      font:850 .68rem/1.2 system-ui,sans-serif;text-decoration:underline;text-underline-offset:3px;
      cursor:pointer;touch-action:manipulation
    }
    .sky-show-exact-where-when:hover,.sky-show-exact-where-when:focus-visible{background:#fff3ef;outline:2px solid rgba(201,33,30,.16);outline-offset:1px}
    .sky-update-now-editor{margin-right:auto!important}
    @media(max-width:620px){
      .sky-card-drawer>summary{min-height:46px;padding:.75rem .85rem;font-size:.74rem}
      .sky-card-drawer[data-sky-drawer="where"] .sky-where-when-confirmed{padding:.78rem .6rem .9rem!important;overflow:visible!important}
      .sky-card-drawer[data-sky-drawer="where"] .sky-ph-jump[data-where-when-thumbnail="true"]{padding:1.05rem .45rem .12rem!important;overflow:visible!important}
      .sky-card-drawer[data-sky-drawer="where"] .sky-ph-heptagram{width:min(174px,72vw)!important;overflow:visible!important}
      .sky-show-exact-where-when{min-height:44px;font-size:.7rem}
    }
  `;
  document.head.appendChild(style);
}

function chevron(){
  return '<svg class="sky-card-drawer-chevron" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M5 3.5 10 8l-5 4.5"/></svg>';
}
function drawerMarkup(slot){
  const root=document.createElement('div');
  root.className='sky-card-drawers';
  root.dataset.skyCardDrawers=slot;
  const whereOpen=complete(slot);
  root.innerHTML=`
    <details class="sky-card-drawer" data-sky-drawer="where"${whereOpen?' open':''}><summary class="sky-card-drawer-summary"><span>Where and When</span>${chevron()}</summary><div class="sky-card-drawer-body" data-sky-drawer-mount="where"></div></details>
    <details class="sky-card-drawer" data-sky-drawer="placements"><summary class="sky-card-drawer-summary"><span>Placements</span>${chevron()}</summary><div class="sky-card-drawer-body" data-sky-drawer-mount="placements"></div></details>
    <details class="sky-card-drawer" data-sky-drawer="card-hits"><summary class="sky-card-drawer-summary"><span>Card Hits</span>${chevron()}</summary><div class="sky-card-drawer-body" data-sky-drawer-mount="card-hits"></div></details>`;
  if(whereOpen)openState[slot]='where';
  root.querySelectorAll('.sky-card-drawer').forEach(details=>details.addEventListener('toggle',()=>onToggle(slot,details)));
  return root;
}
function closeSiblings(root,except){root.querySelectorAll('.sky-card-drawer[open]').forEach(node=>{if(node!==except)node.open=false})}
function movePlacementView(slot){
  const b=body(slot),view=b?.querySelector('.sky-where-when-placement-view'),mount=b?.querySelector('[data-sky-drawer-mount="placements"]');
  if(view&&mount&&view.parentElement!==mount)mount.appendChild(view);
}
function moveWhereView(slot,target='where'){
  const b=body(slot),view=b?.querySelector('.sky-where-when-view'),mount=b?.querySelector(`[data-sky-drawer-mount="${target}"]`);
  if(view&&mount&&view.parentElement!==mount)mount.appendChild(view);
}
function requestConfirmed(slot){
  if(!complete(slot))return;
  writeView(slot,'confirmed');
  window.dispatchEvent(new Event('relphi:sky-foundation-ready'));
}
function activate(slot,type){
  if(type==='placements'){
    movePlacementView(slot);
    legacyAction(slot,'placements')?.click();
  }else if(type==='card-hits'){
    moveWhereView(slot,'card-hits');
    legacyAction(slot,'card-hits')?.click();
  }else if(type==='where'){
    moveWhereView(slot,'where');
    if(complete(slot))requestConfirmed(slot);
    else legacyAction(slot,'edit')?.click();
  }
  requestAnimationFrame(()=>requestAnimationFrame(()=>{placeViews(slot);compactWhere(slot)}));
}
function onToggle(slot,details){
  const root=details.closest('.sky-card-drawers');if(!root)return;
  if(details.open){
    const type=details.dataset.skyDrawer||'';
    openState[slot]=type;
    closeSiblings(root,details);
    activate(slot,type);
  }else if(openState[slot]===details.dataset.skyDrawer){
    openState[slot]='';
  }
}
function placeViews(slot){
  const b=body(slot),root=b?.querySelector(':scope > .sky-card-drawers');if(!b||!root)return;
  movePlacementView(slot);
  const active=root.querySelector('.sky-card-drawer[open]')?.dataset.skyDrawer||openState[slot];
  moveWhereView(slot,active==='card-hits'?'card-hits':'where');
}
function compactWhere(slot){
  const b=body(slot);if(!b)return;
  const where=b.querySelector('[data-sky-drawer-mount="where"]');
  const confirmed=where?.querySelector('.sky-where-when-confirmed');
  if(confirmed){
    const jump=confirmed.querySelector('.sky-ph-jump');
    if(jump){
      jump.dataset.whereWhenThumbnail='true';
      jump.removeAttribute('href');
      jump.removeAttribute('target');
      jump.setAttribute('tabindex','-1');
      jump.setAttribute('aria-label',`Sky ${slot} Where and When heptagram thumbnail`);
      const svg=jump.querySelector('.sky-ph-heptagram');
      if(svg){
        const mobile=window.matchMedia?.('(max-width:620px)')?.matches;
        svg.setAttribute('viewBox',mobile?'0 -18 360 378':'0 0 360 360');
      }
    }
    let reveal=confirmed.querySelector('.sky-show-exact-where-when');
    if(!reveal){
      reveal=document.createElement('button');
      reveal.type='button';
      reveal.className='sky-show-exact-where-when';
      reveal.dataset.wwAction='edit';
      reveal.textContent='Show exactly where and when';
      confirmed.appendChild(reveal);
    }
  }
  const editor=where?.querySelector('.sky-where-when-editor');
  if(editor){
    const footer=editor.querySelector('.sky-where-when-footer');
    if(footer&&!footer.querySelector('.sky-update-now-editor')){
      const button=document.createElement('button');
      button.type='button';
      button.className='sky-where-when-button secondary sky-update-now-editor';
      button.dataset.finalNow=slot;
      button.textContent='Update to Now';
      footer.prepend(button);
    }
  }
}
function ensure(slot){
  const b=body(slot);if(!b)return;
  let root=b.querySelector(':scope > .sky-card-drawers');
  const created=!root;
  if(!root){root=drawerMarkup(slot);b.prepend(root)}
  movePlacementView(slot);
  placeViews(slot);
  if(created&&complete(slot))requestConfirmed(slot);
  if(openState[slot]){
    const desired=root.querySelector(`[data-sky-drawer="${openState[slot]}"]`);
    if(desired&&!desired.open)desired.open=true;
  }
  compactWhere(slot);
}
function hydrate(){queued=false;installStyles();ensure('A');ensure('B')}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(hydrate))}
function start(){
  installStyles();
  schedule();
  ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-heptagram-source-ready','relphi:sky-name-updated'].forEach(name=>window.addEventListener(name,schedule));
  window.addEventListener('storage',event=>{if(!event.key||Object.values(SLOT_KEYS).includes(event.key))schedule()});
  const root=document.getElementById('skyFoundationRoot');
  if(root){
    observer=new MutationObserver(records=>{
      if(records.some(record=>record.type==='childList'))schedule();
    });
    observer.observe(root,{subtree:true,childList:true});
  }
}

document.addEventListener('click',event=>{
  const reveal=event.target.closest('.sky-show-exact-where-when');
  if(!reveal)return;
  const slot=slotFor(reveal);if(!slot)return;
  // Let the core Where/When controller own the actual editor render.
  requestAnimationFrame(()=>requestAnimationFrame(()=>compactWhere(slot)));
},true);

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
