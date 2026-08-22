// Keep Sky A and Sky B headers aligned and keep active Sky naming authoritative.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyHeaderStateV2)return;
window.__relphiSkyHeaderStateV1=true;
window.__relphiSkyHeaderStateV2=true;
const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const GENERIC_NAMES=new Set(['','current sky','sky a','sky b','standalone sky','comparison','unnamed sky','untitled sky','unsaved sky','now']);
let nameQueued=false;
function installStyles(){if(document.getElementById('skyHeaderStateStylesV2'))return;document.getElementById('skyHeaderStateStyles')?.remove();const style=document.createElement('style');style.id='skyHeaderStateStylesV2';style.textContent=`
#skyFoundationA>.sky-foundation-heading,#skyFoundationB>.sky-foundation-heading{position:relative!important;display:grid!important;grid-template-columns:68px minmax(0,1fr) auto!important;grid-template-rows:44px!important;align-items:center!important;min-height:44px!important;height:44px!important;padding:0!important;overflow:visible!important}
#skyFoundationA>.sky-foundation-heading>.sky-foundation-slot,#skyFoundationB>.sky-foundation-heading>.sky-foundation-slot{grid-column:1!important;grid-row:1!important;align-self:stretch!important;display:flex!important;align-items:center!important;justify-content:center!important;width:68px!important;min-width:68px!important;max-width:68px!important;box-sizing:border-box!important;padding:0 .35rem!important;margin:0!important;white-space:nowrap!important;overflow:visible!important;text-align:center!important;line-height:1!important}
#skyFoundationA>.sky-foundation-heading>.sky-foundation-name,#skyFoundationB>.sky-foundation-heading>.sky-foundation-name{grid-column:2!important;grid-row:1!important;min-width:0!important;overflow:visible!important;line-height:1.2!important;padding:0 .45rem 0 .8rem!important;margin:0!important}
#skyFoundationA>.sky-foundation-heading>.sky-slot-card-control,#skyFoundationB>.sky-foundation-heading>.sky-slot-card-control{grid-column:3!important;grid-row:1!important;margin:0 .45rem 0 .15rem!important}
`;document.head.appendChild(style)}
function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
function write(slot,value){try{localStorage.setItem(KEYS[slot],JSON.stringify(value));return true}catch(_){return false}}
function slotFrom(node){const panel=node?.closest?.('#skyFoundationA,#skyFoundationB');return panel?.id==='skyFoundationA'?'A':panel?.id==='skyFoundationB'?'B':null}
function isUpdateNow(button){return /update\s+to\s+now/i.test(String(button?.textContent||'').replace(/\s+/g,' ').trim())}
function currentName(){return'Now'}
function normalize(value){return String(value||'').trim().toLowerCase().replace(/\s+/g,' ')}
function deliberateName(slot){const value=read(slot);if(!value||typeof value!=='object')return'';const metadata=value.metadata&&typeof value.metadata==='object'?value.metadata:{},profile=value.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{};for(const candidate of[metadata.savedSkyName,value.name,value.displayName,value.skyName,value.title,profile.name,profile.title]){const name=String(candidate||'').trim();if(name&&!GENERIC_NAMES.has(normalize(name)))return name}return''}
function applyAuthoritativeName(slot){const name=deliberateName(slot);if(!name)return;const panel=document.getElementById(`skyFoundation${slot}`),container=panel?.querySelector(':scope > .sky-foundation-heading > .sky-foundation-name'),button=container?.querySelector('[data-saved-sky-trigger]'),label=button?.querySelector('.sky-saved-name-label');if(!button||!label)return;if(label.textContent!==name)label.textContent=name;button.title=button.classList.contains('is-saved')?name:`${name} · open Saved skies`;button.setAttribute('aria-label',`${name}. Open Saved skies for Sky ${slot}.`);button.dataset.activeNameAuthority='payload'}
function applyAllAuthoritativeNames(){nameQueued=false;applyAuthoritativeName('A');applyAuthoritativeName('B')}
function scheduleAuthoritativeNames(){if(nameQueued)return;nameQueued=true;requestAnimationFrame(()=>requestAnimationFrame(applyAllAuthoritativeNames))}
function applyDisplay(slot){const panel=document.getElementById(`skyFoundation${slot}`),name=panel?.querySelector(':scope > .sky-foundation-heading .sky-foundation-name');if(name){name.textContent=currentName();name.title=currentName()}}
function renamePayload(slot){const value=read(slot);if(!value||typeof value!=='object')return false;const name=currentName();value.name=name;value.title=name;value.displayName=name;value.skyName=name;value.metadata=value.metadata&&typeof value.metadata==='object'?value.metadata:{};delete value.metadata.savedSkyId;delete value.metadata.savedSkyName;delete value.metadata.savedSkyLoadedAt;value.metadata.name=name;value.metadata.title=name;value.calcProfile=value.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{};value.calcProfile.name=name;value.calcProfile.title=name;return write(slot,value)}
function reconcile(slot,attempt){renamePayload(slot);applyDisplay(slot);window.dispatchEvent(new CustomEvent('relphi:sky-name-updated',{detail:{slot,name:currentName(),source:'update-to-now'}}));if(attempt<6)setTimeout(()=>reconcile(slot,attempt+1),attempt<2?180:420)}
document.addEventListener('click',event=>{const button=event.target.closest('button');if(!button||!isUpdateNow(button))return;const slot=slotFrom(button);if(!slot)return;setTimeout(()=>reconcile(slot,0),0)},true);
window.addEventListener('storage',event=>{if(!event.key||Object.values(KEYS).includes(event.key))scheduleAuthoritativeNames()});
['relphi:sky-foundation-ready','relphi:sky-name-updated','relphi:saved-sky-library-changed','relphi:saved-sky-active-changed'].forEach(name=>window.addEventListener(name,scheduleAuthoritativeNames));
function align(){installStyles();scheduleAuthoritativeNames()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',align,{once:true});else align();
})();
