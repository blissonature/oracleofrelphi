// Sky-card structure owner. Drawers, persistent view chrome, and drawer transitions live here.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyCardShellV2)return;
window.__relphiSkyCardShellV2=true;
window.__relphiSkyCardShellV1=true;

const PANELS={A:'skyFoundationA',B:'skyFoundationB'};
function installStyles(){
  if(document.getElementById('skyCardShellV2Styles'))return;
  const style=document.createElement('style');
  style.id='skyCardShellV2Styles';
  style.textContent=`
    .sky-placement-copy-row{display:flex;justify-content:space-between;align-items:center;gap:.65rem;padding:.42rem .62rem .12rem}
    .sky-placement-copy-title{min-width:0;margin:0;color:#241f1b;font:900 .9rem/1.15 system-ui,sans-serif}
    @media(max-width:620px){.sky-placement-copy-row{gap:.5rem;padding:.38rem .56rem .08rem}.sky-placement-copy-title{font-size:.86rem}}
  `;
  document.head.appendChild(style);
}
function profile(payload){return payload?.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:{}}
function complete(payload){const p=profile(payload);return!!(p&&p.dateTime&&p.location&&p.timeZone&&Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude)))}
function panel(slot){return document.getElementById(PANELS[slot]||'')}
function body(slot){return panel(slot)?.querySelector(':scope > .sky-foundation-body')||null}
function fingerprint(slot,name,label){return `<span class="sky-drawer-fingerprint sky-drawer-fingerprint-${name}" data-sky-drawer-fingerprint="${name}" data-sky-slot="${slot}" role="img" aria-label="${label}" hidden></span>`}
function markup(slot,hasProfile){
  return `<div class="sky-card-drawers" data-sky-card-drawers="${slot}" data-sky-initial-drawer="placements" data-where-editor-expanded="false">
    <div class="sky-card-fingerprint-tabs" data-sky-fingerprint-tabs="${slot}" role="group" aria-label="Sky ${slot} views">
      <button type="button" class="sky-card-fingerprint-tab" data-sky-drawer-tab="where" aria-label="Where and When" title="Where and When" aria-controls="skyDrawerBody${slot}Where">${fingerprint(slot,'where','Where and When fingerprint')}</button>
      <button type="button" class="sky-card-fingerprint-tab" data-sky-drawer-tab="placements" aria-label="Placements" title="Placements" aria-controls="skyDrawerBody${slot}Placements">${fingerprint(slot,'placements','Placements fingerprint')}</button>
      <button type="button" class="sky-card-fingerprint-tab" data-sky-drawer-tab="card-hits" aria-label="Card Hits" title="Card Hits" aria-controls="skyDrawerBody${slot}CardHits">${fingerprint(slot,'card-hits','Card Hits fingerprint')}</button>
    </div>
    <details class="sky-card-drawer" data-sky-drawer="where">
      <summary class="sky-card-drawer-summary" tabindex="-1" aria-hidden="true"><span>Where and When</span></summary>
      <div class="sky-card-drawer-body" id="skyDrawerBody${slot}Where" data-sky-drawer-mount="where">
        <section class="sky-where-when-summary" data-sky-where-summary="${slot}"${hasProfile?'':' hidden'}><a class="sky-ph-jump" data-sky-heptagram-frame="${slot}" href="planetaryhours.html" aria-label="Open this Sky in Planetary Hours"><svg class="sky-ph-heptagram" data-sky-heptagram="${slot}" data-canonical-source-ready="pending" viewBox="8 8 344 344" role="img" aria-label="Planetary Hours heptagram for Sky ${slot}"></svg></a></section>
        <div class="sky-where-when-editor-mount" id="skyWhereWhenEditor${slot}" data-ww-editor-mount="${slot}" hidden></div>
      </div>
    </details>
    <details class="sky-card-drawer" data-sky-drawer="placements" open>
      <summary class="sky-card-drawer-summary" tabindex="-1" aria-hidden="true"><span>Placements</span></summary>
      <div class="sky-card-drawer-body sky-where-when-placement-view" id="skyDrawerBody${slot}Placements" data-sky-drawer-mount="placements-view">
        <div class="sky-placement-copy-row"><strong class="sky-placement-copy-title">Placements</strong><button type="button" class="sky-quick-copy-button sky-placement-copy" data-copy-placements>Copy</button></div>
        <div data-sky-drawer-mount="placements"></div>
      </div>
    </details>
    <details class="sky-card-drawer" data-sky-drawer="card-hits">
      <summary class="sky-card-drawer-summary" tabindex="-1" aria-hidden="true"><span>Card Hits</span></summary>
      <div class="sky-card-drawer-body" id="skyDrawerBody${slot}CardHits" data-sky-drawer-mount="card-hits"></div>
    </details>
  </div>`;
}
function refs(slot){
  const root=body(slot)?.querySelector(':scope > .sky-card-drawers');if(!root)return null;
  return{
    root,
    where:root.querySelector('[data-sky-drawer-mount="where"]'),
    placements:root.querySelector('[data-sky-drawer-mount="placements"]'),
    placementsView:root.querySelector('[data-sky-drawer-mount="placements-view"]'),
    cardHits:root.querySelector('[data-sky-drawer-mount="card-hits"]'),
    whereFingerprint:root.querySelector('[data-sky-drawer-fingerprint="where"]'),
    placementFingerprint:root.querySelector('[data-sky-drawer-fingerprint="placements"]'),
    cardHitsFingerprint:root.querySelector('[data-sky-drawer-fingerprint="card-hits"]'),
    summary:root.querySelector('[data-sky-where-summary]'),
    heptagram:root.querySelector('[data-sky-heptagram]'),
    editor:root.querySelector('[data-ww-editor-mount]')
  };
}
function drawer(root,name){return root?.querySelector(`:scope > .sky-card-drawer[data-sky-drawer="${name}"]`)||null}
function syncTabs(root){
  root.querySelectorAll(':scope > .sky-card-fingerprint-tabs > [data-sky-drawer-tab]').forEach(button=>{
    const target=drawer(root,button.dataset.skyDrawerTab||''),active=!!target?.open;
    button.dataset.active=active?'true':'false';button.setAttribute('aria-expanded',active?'true':'false');
  });
}
function closeOthers(root,target){root.querySelectorAll(':scope > .sky-card-drawer[open]').forEach(other=>{if(other!==target)other.open=false})}
function activateDrawer(root,target){
  if(!target||target.open)return;
  const slot=String(root.dataset.skyCardDrawers||''),name=String(target.dataset.skyDrawer||'');
  if(name==='where')window.dispatchEvent(new CustomEvent('relphi:sky-drawer-preparing',{detail:{slot,drawer:'where'}}));
  closeOthers(root,target);
  target.open=true;
}
function installDrawerBehavior(slot,root){
  root.querySelectorAll(':scope > .sky-card-fingerprint-tabs > [data-sky-drawer-tab]').forEach(button=>{
    if(button.dataset.skyDrawerTabBound==='true')return;button.dataset.skyDrawerTabBound='true';
    button.addEventListener('click',()=>{const target=drawer(root,button.dataset.skyDrawerTab||'');if(!target)return;if(target.open)target.open=false;else activateDrawer(root,target)});
  });
  root.querySelectorAll(':scope > .sky-card-drawer').forEach(details=>{
    details.removeAttribute('inert');details.removeAttribute('aria-disabled');
    const summary=details.querySelector(':scope > summary');summary?.removeAttribute('inert');summary?.removeAttribute('aria-disabled');
    if(details.dataset.skyDrawerBound==='true')return;details.dataset.skyDrawerBound='true';
    details.addEventListener('toggle',()=>{
      const name=details.dataset.skyDrawer||'';
      if(details.open)closeOthers(root,details);
      syncTabs(root);
      window.dispatchEvent(new CustomEvent(details.open?'relphi:sky-drawer-opened':'relphi:sky-drawer-closed',{detail:{slot,drawer:name}}));
    });
  });
  syncTabs(root);
}
function sync(slot,payload){
  const current=refs(slot);if(!current)return null;
  const hasProfile=complete(payload),previous=current.root.dataset.whereWhenAvailable;
  current.summary.hidden=!hasProfile;current.root.dataset.whereWhenAvailable=hasProfile?'true':'false';
  if(previous==='true'&&!hasProfile){current.editor.hidden=true;current.editor.replaceChildren();current.root.dataset.whereEditorExpanded='false';current.summary?.classList.remove('is-editor-expanded')}
  return current;
}
function ensure(slot,payload){
  installStyles();const host=body(slot);if(!host)return null;host.removeAttribute('inert');
  let current=refs(slot);
  if(!current){const holder=document.createElement('div');holder.innerHTML=markup(slot,complete(payload)).trim();host.replaceChildren(holder.firstElementChild);current=refs(slot)}
  installDrawerBehavior(slot,current.root);return sync(slot,payload);
}
function setEditorExpanded(slot,expanded){const current=refs(slot);if(!current)return;current.editor.hidden=!expanded;current.summary?.classList.toggle('is-editor-expanded',!!expanded);current.root.dataset.whereEditorExpanded=expanded?'true':'false'}
function openDrawer(slot,name){const current=refs(slot);if(!current)return;activateDrawer(current.root,drawer(current.root,name))}
function repair(){['A','B'].forEach(slot=>{const current=refs(slot);if(!current)return;installDrawerBehavior(slot,current.root);current.root.removeAttribute('inert');current.root.dataset.whereEditorExpanded=current.editor&&!current.editor.hidden?'true':'false'})}
window.RelphiSkyCardShell=Object.freeze({ensure,get:refs,sync,setEditorExpanded,openDrawer,complete,repair});
window.addEventListener('relphi:sky-session-recovered',repair);
installStyles();
})();
