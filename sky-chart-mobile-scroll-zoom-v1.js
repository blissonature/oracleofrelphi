// Mobile interaction cleanup: Relationships use page scrolling, and the Harmonic Window
// stays at an iOS-safe input font size so Safari does not auto-zoom the page on focus.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyMobileScrollZoomV1)return;
window.__relphiSkyMobileScrollZoomV1=true;
const STYLE_ID='skyMobileScrollZoomV1Styles';
function install(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
    @media(max-width:620px){
      #skyFoundationRelationships,
      #skyFoundationRelationships #skyFoundationRelationshipList,
      #skyFoundationRelationships #skyFoundationRelationshipList:has(> .sky-foundation-relationship-row.is-inline-expanded){
        max-height:none!important;
        min-height:0!important;
        height:auto!important;
        overflow:visible!important;
        overscroll-behavior:auto!important;
        -webkit-overflow-scrolling:auto!important;
        scrollbar-gutter:auto!important;
      }
      #skyFoundationRelationships #skyFoundationRelationshipList{
        touch-action:pan-y pinch-zoom!important;
        padding-bottom:max(96px,calc(env(safe-area-inset-bottom) + 72px))!important;
      }
      #skyFoundationRelationships .sky-foundation-relationship-row,
      #skyFoundationRelationships .inline-rel-detail,
      #skyFoundationRelationships .inline-rel-visual{
        touch-action:pan-y pinch-zoom!important;
      }
      #skyFoundationRelationships [data-harmonic-window-input]{
        font-size:16px!important;
        line-height:1.2!important;
        touch-action:manipulation!important;
      }
    }
  `;document.head.appendChild(style);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
})();

// Restore the compact Sky-card drawer architecture. The legacy Where/When and Card Hits
// controllers remain the calculation/rendering engines, but their old top-row buttons are
// hidden and used only as internal triggers. The visible card surface is three drawers.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyCardDrawersV1)return;
window.__relphiSkyCardDrawersV1=true;

const VIEW_KEY='relphiSkyWhereWhenViewV1';
const SLOT_KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const openState={A:'',B:''};
let queued=false,observer=null;

function panel(slot){return document.getElementById(`skyFoundation${slot}`)}
function body(slot){return panel(slot)?.querySelector(':scope > .sky-foundation-body')||null}
function read(slot){try{return JSON.parse(localStorage.getItem(SLOT_KEYS[slot])||'null')}catch(_){return null}}
function profile(slot){const value=read(slot);return value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{}}
function complete(slot){const p=profile(slot);return!!(p&&p.dateTime&&p.location&&p.timeZone&&Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude)))}
function writeView(slot,mode){try{const value=JSON.parse(sessionStorage.getItem(VIEW_KEY)||'{}');value[slot]=mode;sessionStorage.setItem(VIEW_KEY,JSON.stringify(value))}catch(_){}}
function legacyAction(slot,action){return panel(slot)?.querySelector(`.sky-where-when-actions [data-ww-action="${action}"]`)||null}

function installStyles(){
  if(document.getElementById('skyCardDrawersV1Styles'))return;
  const style=document.createElement('style');style.id='skyCardDrawersV1Styles';style.textContent=`
    #skyFoundationA>.sky-foundation-heading,
    #skyFoundationB>.sky-foundation-heading{
      grid-template-rows:44px!important;
      min-height:44px!important;
    }
    #skyFoundationA>.sky-foundation-heading>.sky-where-when-actions,
    #skyFoundationB>.sky-foundation-heading>.sky-where-when-actions,
    .sky-where-when-actions{
      display:none!important;
    }
    .sky-card-drawers{
      display:grid;
      width:100%;
      min-width:0;
      border-top:1px solid rgba(31,27,24,.11);
    }
    .sky-card-drawer{
      min-width:0;
      margin:0;
      border:0;
      border-bottom:1px solid rgba(31,27,24,.11);
      background:#fffdfa;
    }
    .sky-card-drawer>summary{
      position:relative;
      display:flex;
      align-items:center;
      min-height:42px;
      box-sizing:border-box;
      padding:.68rem 2.25rem .68rem .78rem;
      list-style:none;
      color:#29231e;
      cursor:pointer;
      font:850 .72rem/1.2 system-ui,sans-serif;
      user-select:none;
      touch-action:manipulation;
    }
    .sky-card-drawer>summary::-webkit-details-marker{display:none}
    .sky-card-drawer>summary::after{
      content:'⌄';
      position:absolute;
      right:.82rem;
      top:50%;
      transform:translateY(-54%);
      color:#696058;
      font:800 1rem/1 system-ui,sans-serif;
      transition:transform .14s ease;
    }
    .sky-card-drawer[open]>summary::after{transform:translateY(-48%) rotate(180deg)}
    .sky-card-drawer>summary:hover,
    .sky-card-drawer>summary:focus-visible{background:#f8f3ed;outline:none}
    .sky-card-drawer-body{min-width:0;overflow:visible}
    .sky-card-drawer-body>.sky-where-when-view,
    .sky-card-drawer-body>.sky-where-when-placement-view{width:100%;min-width:0;box-sizing:border-box}
    .sky-card-drawer-body>.sky-where-when-view[hidden],
    .sky-card-drawer-body>.sky-where-when-placement-view[hidden]{display:none!important}

    /* The Where/When summary is intentionally encrypted: heptagram only. */
    .sky-card-drawer[data-sky-drawer="where"] .sky-where-when-confirmed{
      display:grid!important;
      justify-items:center;
      gap:.42rem!important;
      padding:.55rem .7rem .8rem!important;
      overflow:visible!important;
    }
    .sky-card-drawer[data-sky-drawer="where"] .sky-where-when-facts,
    .sky-card-drawer[data-sky-drawer="where"] .sky-ph-jump-title,
    .sky-card-drawer[data-sky-drawer="where"] .sky-ph-summary{
      display:none!important;
    }
    .sky-card-drawer[data-sky-drawer="where"] .sky-ph-jump[data-where-when-thumbnail="true"]{
      display:grid!important;
      place-items:center;
      width:100%;
      min-width:0;
      gap:0!important;
      margin:0!important;
      padding:.45rem .5rem .1rem!important;
      border:0!important;
      border-radius:0!important;
      background:transparent!important;
      box-shadow:none!important;
      overflow:visible!important;
      cursor:default!important;
      transform:none!important;
      pointer-events:none!important;
    }
    .sky-card-drawer[data-sky-drawer="where"] .sky-ph-heptagram{
      display:block!important;
      width:min(184px,74vw)!important;
      max-width:100%!important;
      height:auto!important;
      max-height:none!important;
      margin:0 auto!important;
      overflow:visible!important;
    }
    .sky-show-exact-where-when{
      appearance:none;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      min-height:42px;
      border:0;
      border-radius:8px;
      background:transparent;
      color:#5b1715;
      padding:.48rem .7rem;
      font:850 .68rem/1.2 system-ui,sans-serif;
      text-decoration:underline;
      text-underline-offset:3px;
      cursor:pointer;
      touch-action:manipulation;
    }
    .sky-show-exact-where-when:hover,
    .sky-show-exact-where-when:focus-visible{background:#fff3ef;outline:2px solid rgba(201,33,30,.16);outline-offset:1px}
    .sky-update-now-editor{margin-right:auto!important}

    @media(max-width:620px){
      .sky-card-drawer>summary{min-height:46px;padding:.74rem 2.4rem .74rem .82rem;font-size:.74rem}
      .sky-card-drawer[data-sky-drawer="where"] .sky-where-when-confirmed{
        padding:.7rem .6rem .9rem!important;
        overflow:visible!important;
      }
      .sky-card-drawer[data-sky-drawer="where"] .sky-ph-jump[data-where-when-thumbnail="true"]{
        padding:1rem .45rem .12rem!important;
        overflow:visible!important;
      }
      .sky-card-drawer[data-sky-drawer="where"] .sky-ph-heptagram{
        width:min(174px,72vw)!important;
        overflow:visible!important;
      }
      .sky-show-exact-where-when{min-height:44px;font-size:.7rem}
    }
  `;document.head.appendChild(style);
}

function drawerMarkup(slot){
  const root=document.createElement('div');root.className='sky-card-drawers';root.dataset.skyCardDrawers=slot;
  root.innerHTML=`
    <details class="sky-card-drawer" data-sky-drawer="where"><summary>Where and When</summary><div class="sky-card-drawer-body" data-sky-drawer-mount="where"></div></details>
    <details class="sky-card-drawer" data-sky-drawer="placements"><summary>Placements</summary><div class="sky-card-drawer-body" data-sky-drawer-mount="placements"></div></details>
    <details class="sky-card-drawer" data-sky-drawer="card-hits"><summary>Card Hits</summary><div class="sky-card-drawer-body" data-sky-drawer-mount="card-hits"></div></details>`;
  root.querySelectorAll('.sky-card-drawer').forEach(details=>details.addEventListener('toggle',()=>onToggle(slot,details)));
  return root;
}

function closeSiblings(root,except){root.querySelectorAll('.sky-card-drawer[open]').forEach(node=>{if(node!==except)node.open=false})}
function moveView(slot,target){const b=body(slot),view=b?.querySelector('.sky-where-when-view'),mount=b?.querySelector(`[data-sky-drawer-mount="${target}"]`);if(view&&mount&&view.parentElement!==mount)mount.appendChild(view)}
function movePlacements(slot){const b=body(slot),view=b?.querySelector('.sky-where-when-placement-view'),mount=b?.querySelector('[data-sky-drawer-mount="placements"]');if(view&&mount&&view.parentElement!==mount)mount.appendChild(view)}

function activate(slot,type){
  const b=body(slot);if(!b)return;
  if(type==='placements'){
    movePlacements(slot);
    legacyAction(slot,'placements')?.click();
  }else if(type==='card-hits'){
    moveView(slot,'card-hits');
    legacyAction(slot,'card-hits')?.click();
  }else if(type==='where'){
    moveView(slot,'where');
    if(complete(slot)){
      writeView(slot,'confirmed');
      legacyAction(slot,'edit')?.click();
    }else{
      legacyAction(slot,'edit')?.click();
    }
  }
  requestAnimationFrame(()=>requestAnimationFrame(()=>{placeViews(slot);compactWhere(slot)}));
}

function onToggle(slot,details){
  const root=details.closest('.sky-card-drawers');if(!root)return;
  if(details.open){
    const type=details.dataset.skyDrawer||'';openState[slot]=type;closeSiblings(root,details);activate(slot,type);
  }else if(openState[slot]===details.dataset.skyDrawer){
    openState[slot]='';
  }
}

function placeViews(slot){
  const b=body(slot),root=b?.querySelector(':scope > .sky-card-drawers');if(!b||!root)return;
  movePlacements(slot);
  const active=root.querySelector('.sky-card-drawer[open]')?.dataset.skyDrawer||openState[slot];
  moveView(slot,active==='card-hits'?'card-hits':'where');
}

function removeStandaloneNow(slot){
  panel(slot)?.querySelectorAll('.sky-where-when-actions [data-final-now]').forEach(node=>node.remove());
}

function compactWhere(slot){
  const b=body(slot);if(!b)return;
  removeStandaloneNow(slot);
  const where=b.querySelector('[data-sky-drawer-mount="where"]');
  const confirmed=where?.querySelector('.sky-where-when-confirmed');
  if(confirmed){
    confirmed.querySelector('.sky-where-when-facts')?.setAttribute('hidden','');
    confirmed.querySelector('.sky-ph-jump-title')?.setAttribute('hidden','');
    confirmed.querySelector('.sky-ph-summary')?.setAttribute('hidden','');
    const jump=confirmed.querySelector('.sky-ph-jump');
    if(jump){
      jump.dataset.whereWhenThumbnail='true';
      jump.removeAttribute('href');
      jump.removeAttribute('target');
      jump.setAttribute('aria-label',`Sky ${slot} Where and When heptagram thumbnail`);
      jump.querySelectorAll('svg text').forEach(node=>node.remove());
      const svg=jump.querySelector('.sky-ph-heptagram');
      if(svg){
        const mobile=window.matchMedia?.('(max-width:620px)')?.matches;
        svg.setAttribute('viewBox',mobile?'0 -16 360 376':'0 0 360 360');
      }
    }
    let reveal=confirmed.querySelector('.sky-show-exact-where-when');
    if(!reveal){
      reveal=document.createElement('button');reveal.type='button';reveal.className='sky-show-exact-where-when';
      reveal.dataset.wwAction='edit';reveal.textContent='Show exactly where and when';confirmed.appendChild(reveal);
    }
  }
  const editor=where?.querySelector('.sky-where-when-editor');
  if(editor){
    const footer=editor.querySelector('.sky-where-when-footer');
    if(footer&&!footer.querySelector('[data-final-now]')){
      const button=document.createElement('button');button.type='button';button.className='sky-where-when-button secondary sky-update-now-editor';
      button.dataset.finalNow=slot;button.textContent='Update to Now';footer.prepend(button);
    }
  }
}

function ensure(slot){
  const b=body(slot);if(!b)return;
  removeStandaloneNow(slot);
  let root=b.querySelector(':scope > .sky-card-drawers');
  if(!root){root=drawerMarkup(slot);b.prepend(root)}
  movePlacements(slot);
  placeViews(slot);
  if(openState[slot]){
    const desired=root.querySelector(`[data-sky-drawer="${openState[slot]}"]`);
    if(desired&&!desired.open)desired.open=true;
  }
  compactWhere(slot);
}

function hydrate(){queued=false;installStyles();ensure('A');ensure('B')}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(hydrate))}

function start(){
  installStyles();schedule();
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

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();

// Ring-order is intentionally allowed to rebuild the wheel first. It currently owns ring roles
// and will replace placement leaders after the collision solver's early pass. This post-solve
// runs after those rebuilds so the zero-cross/order-preserving resolver is the final geometry owner.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyLeaderPostsolveV1)return;
window.__relphiSkyLeaderPostsolveV1=true;
let queued=false,solving=false,observer=null;
function solve(){
  queued=false;if(solving)return;solving=true;
  try{window.RelphiPlacementCollisionOrder?.arrangeCurrent?.()}
  finally{solving=false}
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(solve))}
function observe(){
  const mount=document.getElementById('skyFoundationWheelMount');if(!mount)return;
  observer?.disconnect();
  observer=new MutationObserver(records=>{
    if(solving)return;
    const relevant=records.some(record=>record.type==='childList'&&(
      record.target?.closest?.('[data-layer="leaders"],[data-layer="placements"]')||
      Array.from(record.addedNodes||[]).some(node=>node.nodeType===1&&(node.matches?.('.sky-foundation-wheel,line,g')||node.querySelector?.('[data-layer="leaders"],[data-layer="placements"]')))
    ));
    if(relevant)schedule();
  });
  observer.observe(mount,{subtree:true,childList:true});
}
function start(){
  observe();schedule();
  ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready'].forEach(name=>window.addEventListener(name,schedule));
  window.addEventListener('storage',schedule);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
