// Native Sky-card structure. This module owns the stable drawer DOM; feature modules render only into its mounts.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyCardShellV1)return;
window.__relphiSkyCardShellV1=true;

const PANELS={A:'skyFoundationA',B:'skyFoundationB'};
function profile(payload){return payload?.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:{}}
function complete(payload){const p=profile(payload);return!!(p&&p.dateTime&&p.location&&p.timeZone&&Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude)))}
function panel(slot){return document.getElementById(PANELS[slot]||'')}
function body(slot){return panel(slot)?.querySelector(':scope > .sky-foundation-body')||null}
function chevron(className='sky-card-drawer-chevron'){return `<svg class="${className}" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M5 3.5 10 8l-5 4.5"/></svg>`}
function fingerprint(slot,name,label){return `<span class="sky-drawer-fingerprint sky-drawer-fingerprint-${name}" data-sky-drawer-fingerprint="${name}" data-sky-slot="${slot}" role="img" aria-label="${label}" hidden></span>`}
function markup(slot,hasProfile){const initial='placements';return `<div class="sky-card-drawers" data-sky-card-drawers="${slot}" data-sky-initial-drawer="${initial}"><details class="sky-card-drawer" data-sky-drawer="where"${initial==='where'?' open':''}><summary class="sky-card-drawer-summary"><span>Where and When</span>${fingerprint(slot,'where','Where and When fingerprint')}${chevron()}</summary><div class="sky-card-drawer-body" data-sky-drawer-mount="where"><section class="sky-where-when-summary" data-sky-where-summary="${slot}"${hasProfile?'':' hidden'}><a class="sky-ph-jump" data-sky-heptagram-frame="${slot}" href="planetaryhours.html" aria-label="Open this Sky in Planetary Hours"><svg class="sky-ph-heptagram" data-sky-heptagram="${slot}" data-canonical-source-ready="pending" viewBox="8 8 344 344" role="img" aria-label="Planetary Hours heptagram for Sky ${slot}"></svg></a></section><div class="sky-where-when-editor-mount" id="skyWhereWhenEditor${slot}" data-ww-editor-mount="${slot}" hidden></div></div></details><details class="sky-card-drawer" data-sky-drawer="placements"${initial==='placements'?' open':''}><summary class="sky-card-drawer-summary"><span>Placements</span>${fingerprint(slot,'placements','Placements fingerprint')}${chevron()}</summary><div class="sky-card-drawer-body sky-where-when-placement-view" data-sky-drawer-mount="placements"></div></details><details class="sky-card-drawer" data-sky-drawer="card-hits"><summary class="sky-card-drawer-summary"><span>Card Hits</span>${fingerprint(slot,'card-hits','Card Hits fingerprint')}${chevron()}</summary><div class="sky-card-drawer-body" data-sky-drawer-mount="card-hits"></div></details></div>`}
function refs(slot){const root=body(slot)?.querySelector(':scope > .sky-card-drawers');if(!root)return null;return{root,where:root.querySelector('[data-sky-drawer-mount="where"]'),placements:root.querySelector('[data-sky-drawer-mount="placements"]'),cardHits:root.querySelector('[data-sky-drawer-mount="card-hits"]'),whereFingerprint:root.querySelector('[data-sky-drawer-fingerprint="where"]'),placementFingerprint:root.querySelector('[data-sky-drawer-fingerprint="placements"]'),cardHitsFingerprint:root.querySelector('[data-sky-drawer-fingerprint="card-hits"]'),summary:root.querySelector('[data-sky-where-summary]'),heptagram:root.querySelector('[data-sky-heptagram]'),disclosure:root.querySelector('[data-ww-disclosure]'),editor:root.querySelector('[data-ww-editor-mount]')}}
function drawer(root,name){return root?.querySelector(`:scope > .sky-card-drawer[data-sky-drawer="${name}"]`)||null}
function installDrawerBehavior(slot,root){
  root.querySelectorAll(':scope > .sky-card-drawer').forEach(details=>{
    details.removeAttribute('inert');
    details.removeAttribute('aria-disabled');
    const summary=details.querySelector(':scope > summary');
    summary?.removeAttribute('inert');
    summary?.removeAttribute('aria-disabled');
    if(details.dataset.skyDrawerBound==='true')return;
    details.dataset.skyDrawerBound='true';
    details.addEventListener('toggle',()=>{
      if(!details.open)return;
      root.querySelectorAll(':scope > .sky-card-drawer[open]').forEach(other=>{if(other!==details)other.open=false});
      window.dispatchEvent(new CustomEvent('relphi:sky-drawer-opened',{detail:{slot,drawer:details.dataset.skyDrawer||''}}));
    });
  });
}
function sync(slot,payload){const current=refs(slot);if(!current)return null;const hasProfile=complete(payload),previous=current.root.dataset.whereWhenAvailable;current.summary.hidden=!hasProfile;current.root.dataset.whereWhenAvailable=hasProfile?'true':'false';if(previous==='false'&&hasProfile){const target=drawer(current.root,'placements');if(target&&!target.open)target.open=true}else if(previous==='true'&&!hasProfile){current.editor.hidden=true;current.editor.replaceChildren();const target=drawer(current.root,'placements');if(target&&!target.open)target.open=true}return current}
function ensure(slot,payload){const host=body(slot);if(!host)return null;host.removeAttribute('inert');let current=refs(slot);if(!current){const holder=document.createElement('div');holder.innerHTML=markup(slot,complete(payload)).trim();const root=holder.firstElementChild;host.replaceChildren(root);current=refs(slot)}installDrawerBehavior(slot,current.root);return sync(slot,payload)}
function setEditorExpanded(slot,expanded){const current=refs(slot);if(!current)return;current.editor.hidden=!expanded;current.summary?.classList.toggle('is-editor-expanded',!!expanded)}
function openDrawer(slot,name){const current=refs(slot);if(!current)return;const target=drawer(current.root,name);if(target&&!target.open)target.open=true}
function repair(){
  ['A','B'].forEach(slot=>{
    const current=refs(slot);
    if(!current)return;
    installDrawerBehavior(slot,current.root);
    current.root.removeAttribute('inert');
  });
}
window.RelphiSkyCardShell=Object.freeze({ensure,get:refs,sync,setEditorExpanded,openDrawer,complete,repair});
window.addEventListener('relphi:sky-session-recovered',repair);
})();
