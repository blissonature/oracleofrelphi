// House Card Hits visual hierarchy + analytical house focus.
// The Houses panel delegates filtering to the shared Houses control so the
// Relationships list and wheel dim/isolate logic stay on one state contract.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyCardHitsVisualHierarchyV5)return;
window.__relphiSkyCardHitsVisualHierarchyV1=true;
window.__relphiSkyCardHitsVisualHierarchyV2=true;
window.__relphiSkyCardHitsVisualHierarchyV3=true;
window.__relphiSkyCardHitsVisualHierarchyV4=true;
window.__relphiSkyCardHitsVisualHierarchyV5=true;

const STYLE_ID='skyCardHitsVisualHierarchyV5Styles';
const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const SIGNS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
const HOUSES=Array.from({length:12},(_,i)=>String(i+1));
let queued=false;

function installStyles(){
  document.querySelectorAll('[id^="skyCardHitsVisualHierarchyV"][id$="Styles"],#skyCardHitsHouseUniformV1Styles').forEach(node=>node.remove());
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    .sky-card-house-row[data-house-number="1"]{--sky-house-unit-color:#e53935}
    .sky-card-house-row[data-house-number="2"]{--sky-house-unit-color:#f06b32}
    .sky-card-house-row[data-house-number="3"]{--sky-house-unit-color:#f39a2e}
    .sky-card-house-row[data-house-number="4"]{--sky-house-unit-color:#f5be3d}
    .sky-card-house-row[data-house-number="5"]{--sky-house-unit-color:#f1dc43}
    .sky-card-house-row[data-house-number="6"]{--sky-house-unit-color:#a9cf46}
    .sky-card-house-row[data-house-number="7"]{--sky-house-unit-color:#43a85b}
    .sky-card-house-row[data-house-number="8"]{--sky-house-unit-color:#2ca69b}
    .sky-card-house-row[data-house-number="9"]{--sky-house-unit-color:#3285c7}
    .sky-card-house-row[data-house-number="10"]{--sky-house-unit-color:#5961c8}
    .sky-card-house-row[data-house-number="11"]{--sky-house-unit-color:#8c4fb4}
    .sky-card-house-row[data-house-number="12"]{--sky-house-unit-color:#bd438e}

    .sky-card-house-span[data-visual-hierarchy="true"]{display:grid!important;gap:.34rem!important;min-width:0!important;padding-top:.7rem!important;border-top:1px solid rgba(31,27,24,.09)!important}
    .sky-card-house-span[data-visual-hierarchy="true"]:first-child{padding-top:0!important;border-top:0!important}
    .sky-card-house-span[data-visual-hierarchy="true"]>.sky-card-house-span-heading{display:block!important;min-width:0!important;margin:0!important;padding:0 .12rem!important;border:0!important;background:transparent!important;box-shadow:none!important;color:#2e2925!important;font:900 .59rem/1.18 system-ui,sans-serif!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
    .sky-card-house-span[data-visual-hierarchy="true"]>.sky-card-house-card-line{--sky-house-card-col:47px;--sky-house-card-art-w:43px;--sky-house-card-art-h:75px;display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;align-items:stretch!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;gap:0!important;padding:0!important;border:2px solid var(--sky-house-unit-color,#777)!important;border-radius:13px!important;overflow:hidden!important;background:#fffdfa!important;box-shadow:0 2px 6px rgba(31,27,24,.07)!important}
    .sky-card-house-span[data-visual-hierarchy="true"]>.sky-card-house-card-line::before,.sky-card-house-span[data-visual-hierarchy="true"]>.sky-card-house-card-line::after{content:none!important;display:none!important}
    .sky-card-house-governance{grid-column:1!important;display:grid!important;grid-template-columns:repeat(2,var(--sky-house-card-col))!important;align-items:start!important;align-self:stretch!important;gap:.34rem!important;min-width:0!important;box-sizing:border-box!important;padding:.55rem .42rem .52rem!important;background:color-mix(in srgb,var(--sky-house-unit-color,#777) 44%,#fffdfa)!important}
    .sky-card-house-decans-zone{grid-column:2!important;display:grid!important;grid-template-rows:auto 1fr!important;align-content:start!important;align-self:stretch!important;min-width:0!important;box-sizing:border-box!important;padding:.55rem .42rem .52rem!important;border-left:2px solid var(--sky-house-unit-color,#777)!important;background:#fffdfa!important}
    .sky-card-house-decans-heading{display:block!important;margin:0 0 .34rem!important;color:#332d28!important;font:950 .43rem/1 system-ui,sans-serif!important;letter-spacing:.065em!important;text-align:left!important;text-transform:uppercase!important}
    .sky-card-house-decans-grid{display:grid!important;grid-template-columns:repeat(auto-fit,var(--sky-house-card-col))!important;grid-auto-rows:auto!important;gap:.48rem .34rem!important;align-items:start!important;align-content:start!important;justify-content:start!important;min-width:0!important;max-width:100%!important}
    .sky-card-house-no-placements{display:flex!important;align-items:center!important;justify-content:flex-start!important;min-width:0!important;min-height:96px!important;padding:0 .08rem!important;color:#665e57!important;font:800 .5rem/1.25 system-ui,sans-serif!important;text-align:left!important}
    .sky-card-house-span[data-visual-hierarchy="true"] .sky-card-house-span-major,.sky-card-house-span[data-visual-hierarchy="true"] .sky-card-house-decan{display:grid!important;grid-template-rows:10px var(--sky-house-card-art-h) minmax(20px,auto)!important;justify-items:center!important;align-items:start!important;align-content:start!important;gap:.25rem!important;width:var(--sky-house-card-col)!important;min-width:var(--sky-house-card-col)!important;max-width:var(--sky-house-card-col)!important;margin:0!important}
    .sky-card-house-span[data-visual-hierarchy="true"] .sky-card-house-span-major-role{display:block!important;width:100%!important;color:#2c2723!important;font:950 .42rem/1 system-ui,sans-serif!important;letter-spacing:.06em!important;text-align:center!important;text-transform:uppercase!important}
    .sky-card-house-span[data-visual-hierarchy="true"] .sky-card-house-decan::before{content:none!important;display:none!important}
    .sky-card-house-span[data-visual-hierarchy="true"] .sky-card-house-span-major-art,.sky-card-house-span[data-visual-hierarchy="true"] .sky-card-house-decan-art{display:block!important;width:var(--sky-house-card-art-w)!important;max-width:var(--sky-house-card-art-w)!important;height:var(--sky-house-card-art-h)!important;aspect-ratio:500/866!important;margin:0!important;border:1px solid rgba(31,27,24,.22)!important;border-radius:5px!important;background:#eee!important;box-shadow:0 2px 6px rgba(31,27,24,.13)!important;overflow:hidden!important}
    .sky-card-house-span[data-visual-hierarchy="true"] .sky-card-house-span-major-art>img,.sky-card-house-span[data-visual-hierarchy="true"] .sky-card-house-decan-art>img{display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;border-radius:4px!important}
    .sky-card-house-span[data-visual-hierarchy="true"] .sky-card-house-span-major-name,.sky-card-house-span[data-visual-hierarchy="true"] .sky-card-house-decan-label{display:flex!important;flex-wrap:wrap!important;align-items:flex-start!important;justify-content:center!important;gap:.08rem!important;width:var(--sky-house-card-col)!important;max-width:var(--sky-house-card-col)!important;min-height:20px!important;margin:0!important;padding:0!important;overflow:visible!important;color:#29241f!important;font:900 .47rem/1.15 system-ui,sans-serif!important;text-align:center!important;text-overflow:clip!important;white-space:normal!important}
    .sky-card-house-span[data-visual-hierarchy="true"] .sky-card-house-decan-label .sky-card-inline-glyph{flex:0 0 12px!important;width:12px!important;height:12px!important}
    .sky-card-house-decan-multiplier{display:inline-block!important;flex:0 0 auto!important;margin-left:.06rem!important;color:color-mix(in srgb,var(--sky-house-unit-color,#555) 58%,#211d19)!important;font:1000 .5rem/1 system-ui,sans-serif!important;letter-spacing:.01em!important;white-space:nowrap!important}

    .sky-card-house-row[data-card-house-focused="true"]>.sky-card-house-toggle{background:color-mix(in srgb,var(--sky-house-unit-color,#777) 13%,#fffdfa)!important;box-shadow:inset 4px 0 0 var(--sky-house-unit-color,#777)!important}
    .sky-card-house-row[data-card-house-focused="true"]>.sky-card-house-toggle .sky-card-house-toggle-name{color:#211d19!important}
    .sky-card-house-row[data-card-house-focused="true"]{border-color:color-mix(in srgb,var(--sky-house-unit-color,#777) 55%,rgba(31,27,24,.12))!important}

    @media(max-width:520px){.sky-card-house-span[data-visual-hierarchy="true"]>.sky-card-house-card-line{--sky-house-card-col:44px;--sky-house-card-art-w:40px;--sky-house-card-art-h:69px}.sky-card-house-governance,.sky-card-house-decans-zone{padding:.5rem .32rem .48rem!important}.sky-card-house-governance{gap:.26rem!important}.sky-card-house-decans-grid{gap:.42rem .26rem!important}}
    @media(max-width:340px){.sky-card-house-span[data-visual-hierarchy="true"]>.sky-card-house-card-line{grid-template-columns:1fr!important}.sky-card-house-governance{grid-column:1!important;grid-row:1!important}.sky-card-house-decans-zone{grid-column:1!important;grid-row:2!important;border-left:0!important;border-top:2px solid var(--sky-house-unit-color,#777)!important}}
  `;
  document.head.appendChild(style);
}

function json(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
function rootFor(node){return node?.closest?.('.sky-card-hits-structure')||null}
function slotFor(node){return rootFor(node)?.dataset.cardHitsStructureSlot||''}
function houseFor(node){return Number(node?.closest?.('.sky-card-house-row')?.dataset.houseNumber)||0}
function signOfDecan(node){return String(node?.querySelector?.('[data-relphi-card-sign]')?.dataset.relphiCardSign||'').toLowerCase()}
function decanOf(node){const text=String(node?.querySelector?.('.sky-card-house-decan-label')?.textContent||''),match=text.match(/(\d+)\s*[–-]/);return match?Math.max(0,Math.min(2,Math.floor(Number(match[1])/10))):-1}
function modelCount(node){
  const slot=slotFor(node),house=houseFor(node),sign=signOfDecan(node),decan=decanOf(node);
  if(!KEYS[slot]||!house||!sign||decan<0)return NaN;
  const payload=json(KEYS[slot]),houseDecans=window.RelphiSkyCardHitsStructure?.houseDecans;
  if(!payload||typeof houseDecans!=='function')return NaN;
  try{const model=houseDecans(payload).find(item=>Number(item.house)===house),si=SIGNS.indexOf(sign),hit=model?.cards?.find(item=>Number(item.signIndex)===si&&Number(item.decan)===decan);return Number(hit?.count)}catch(_){return NaN}
}
function decanHitCount(node){
  const model=modelCount(node);if(Number.isFinite(model))return model;
  const stored=Number(node?.dataset?.houseDecanHitCount);if(Number.isFinite(stored))return stored;
  const chip=Number(node?.querySelector?.('.sky-card-house-decan-count')?.textContent);if(Number.isFinite(chip))return chip;
  const title=String(node?.title||'').match(/·\s*(\d+)\s+placements?\s*$/i);return title?Number(title[1]):NaN;
}
function applyDecanMultiplier(node){
  const hits=decanHitCount(node);if(Number.isFinite(hits))node.dataset.houseDecanHitCount=String(hits);
  node.querySelector('.sky-card-house-decan-count')?.remove();node.querySelector('.sky-card-house-decan-multiplier')?.remove();
  if(!Number.isFinite(hits)||hits<=1)return;
  const label=node.querySelector('.sky-card-house-decan-label');if(!label)return;
  const multiplier=document.createElement('span');multiplier.className='sky-card-house-decan-multiplier';multiplier.textContent=`×${hits}`;multiplier.setAttribute('aria-label',`${hits} placements in this decan`);label.appendChild(multiplier);
}
function ensureSpanHeading(span){
  let heading=span.querySelector(':scope > .sky-card-house-span-heading');if(heading)return heading;
  const aria=String(span.getAttribute('aria-label')||''),range=aria.split(':')[0].replace(/\s+to\s+/i,' → ').trim();if(!range)return null;
  heading=document.createElement('div');heading.className='sky-card-house-span-heading';heading.textContent=range;span.prepend(heading);return heading;
}
function enhanceSpan(span){
  if(!span)return;const line=span.querySelector(':scope > .sky-card-house-card-line');if(!line)return;ensureSpanHeading(span);
  if(span.dataset.visualHierarchy==='true'){line.querySelectorAll('.sky-card-house-decan').forEach(applyDecanMultiplier);return}
  const majors=[...line.querySelectorAll(':scope > .sky-card-house-span-major')],decans=[...line.querySelectorAll(':scope > .sky-card-house-decan')];if(majors.length<2)return;
  decans.forEach(applyDecanMultiplier);
  const governance=document.createElement('div');governance.className='sky-card-house-governance';majors.forEach(node=>governance.appendChild(node));
  const decanZone=document.createElement('div');decanZone.className='sky-card-house-decans-zone';
  const decanHeading=document.createElement('span');decanHeading.className='sky-card-house-decans-heading';decanHeading.textContent='Decan Hits';decanZone.appendChild(decanHeading);
  if(decans.length){const grid=document.createElement('div');grid.className='sky-card-house-decans-grid';decans.forEach(node=>grid.appendChild(node));decanZone.appendChild(grid)}
  else{const empty=document.createElement('span');empty.className='sky-card-house-no-placements';empty.textContent='No placements';decanZone.appendChild(empty)}
  line.replaceChildren(governance,decanZone);span.dataset.visualHierarchy='true';
}

function houseChoice(slot,house){return document.querySelector(`[data-house-choice="${String(slot).toLowerCase()}"][data-house-scope="house"][data-house-target="${house}"]`)}
function masterChoice(slot){return document.querySelector(`[data-house-choice="${String(slot).toLowerCase()}"][data-house-scope="all"][data-house-target="all"]`)}
function selectedHouses(slot){return HOUSES.filter(house=>houseChoice(slot,house)?.checked)}
function focusedHouse(slot){const selected=selectedHouses(slot);return selected.length===1?selected[0]:''}
function dispatchChoice(input,checked){if(!input)return false;input.checked=checked;input.dispatchEvent(new Event('change',{bubbles:true}));return true}
function setHouseFocus(slot,house){
  const target=String(house),master=masterChoice(slot);if(!KEYS[slot]||!HOUSES.includes(target)||!master||!houseChoice(slot,target))return false;
  const already=focusedHouse(slot)===target;
  if(already){dispatchChoice(master,true)}
  else{dispatchChoice(master,false);dispatchChoice(houseChoice(slot,target),true)}
  requestAnimationFrame(syncHouseFocusUI);
  window.dispatchEvent(new CustomEvent('relphi:sky-card-house-focus-changed',{detail:{slot,house:already?null:Number(target),active:!already}}));
  return true;
}
function syncHouseFocusUI(){
  document.querySelectorAll('.sky-card-hits-structure[data-card-hits-structure-slot]').forEach(root=>{
    const slot=root.dataset.cardHitsStructureSlot||'',focused=focusedHouse(slot);
    root.querySelectorAll('.sky-card-house-row[data-house-number]').forEach(row=>{
      const active=focused&&row.dataset.houseNumber===focused;
      row.dataset.cardHouseFocused=active?'true':'false';
      const button=row.querySelector(':scope > .sky-card-house-toggle');if(button)button.setAttribute('aria-pressed',active?'true':'false');
    });
  });
}
function enhanceAll(){queued=false;installStyles();document.querySelectorAll('.sky-card-house-span').forEach(enhanceSpan);syncHouseFocusUI()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(enhanceAll)}
function start(){
  installStyles();enhanceAll();
  new MutationObserver(schedule).observe(document.getElementById('skyFoundationRoot')||document.body,{childList:true,subtree:true});
  ['relphi:sky-drawer-opened','relphi:saved-sky-loaded','relphi:sky-house-multiselect-changed'].forEach(name=>window.addEventListener(name,schedule));
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-card-house-toggle]');if(!button)return;
    const slot=slotFor(button),house=Number(button.dataset.cardHouseToggle);if(slot&&house)setHouseFocus(slot,house);
  },false);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();