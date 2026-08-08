// Where and When view contract: tab opens the confirmed heptagram/date-time summary; editing is one layer deeper.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyWhereWhenLayerV1)return;
window.__relphiSkyWhereWhenLayerV1=true;
const VIEW_KEY='relphiSkyWhereWhenViewV1';
const SLOT_KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const updateEditorPass={A:0,B:0};
function slotFor(node){return node?.closest('#skyFoundationA')?'A':node?.closest('#skyFoundationB')?'B':''}
function profile(slot){try{const value=JSON.parse(localStorage.getItem(SLOT_KEYS[slot])||'null');return value?.calcProfile||{}}catch(_){return{}}}
function complete(p){return !!(p&&p.dateTime&&p.location&&p.timeZone&&Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude)))}
function writeConfirmed(slot){try{const state=JSON.parse(sessionStorage.getItem(VIEW_KEY)||'{}');state[slot]='confirmed';sessionStorage.setItem(VIEW_KEY,JSON.stringify(state))}catch(_){}}
function requestConfirmed(slot){writeConfirmed(slot);window.dispatchEvent(new Event('relphi:sky-foundation-ready'))}
function addEditControl(section){if(!section||section.querySelector('[data-ww-summary-edit]'))return;const facts=section.querySelector('.sky-where-when-facts');if(!facts)return;const button=document.createElement('button');button.type='button';button.className='sky-where-when-button secondary';button.dataset.wwAction='edit';button.dataset.wwSummaryEdit='true';button.textContent='Edit Where and When';facts.appendChild(button)}
function hydrate(){document.querySelectorAll('.sky-where-when-confirmed').forEach(addEditControl);document.querySelectorAll('.sky-where-when-actions [data-ww-action="edit"]').forEach(button=>{button.setAttribute('aria-label','Show current Where and When')})}

// Update to Now legitimately needs to pass through the summary tab and open the editor
// programmatically. Mark that intent at the originating click, then consume it when the
// existing update routine clicks the Where and When action after geolocation resolves.
document.addEventListener('click',event=>{const update=event.target.closest('[data-final-now]');if(!update)return;const slot=slotFor(update);if(slot)updateEditorPass[slot]=Date.now()+30000},true);

document.addEventListener('click',event=>{const tab=event.target.closest('.sky-where-when-actions [data-ww-action="edit"]');if(!tab)return;const slot=slotFor(tab);if(!slot)return;if(updateEditorPass[slot]>Date.now()){updateEditorPass[slot]=0;return}if(!complete(profile(slot)))return;event.preventDefault();event.stopImmediatePropagation();requestConfirmed(slot);requestAnimationFrame(hydrate)},true);
window.addEventListener('relphi:sky-heptagram-source-ready',()=>requestAnimationFrame(hydrate));
window.addEventListener('relphi:sky-foundation-ready',()=>requestAnimationFrame(hydrate));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(hydrate),{once:true});else requestAnimationFrame(hydrate);
})();