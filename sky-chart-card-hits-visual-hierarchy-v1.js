// House Card Hits visual hierarchy + analytical house focus.
// Expanded Houses pair ruler/sign governance, then give decan hits the full reading width.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyCardHitsVisualHierarchyV7)return;
window.__relphiSkyCardHitsVisualHierarchyV1=true;
window.__relphiSkyCardHitsVisualHierarchyV2=true;
window.__relphiSkyCardHitsVisualHierarchyV3=true;
window.__relphiSkyCardHitsVisualHierarchyV4=true;
window.__relphiSkyCardHitsVisualHierarchyV5=true;
window.__relphiSkyCardHitsVisualHierarchyV6=true;
window.__relphiSkyCardHitsVisualHierarchyV7=true;

const STYLE_ID='skyCardHitsVisualHierarchyV7Styles';
const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const HOUSES=Array.from({length:12},(_,i)=>String(i+1));
let queued=false;

function installStyles(){
  document.querySelectorAll('[id^="skyCardHitsVisualHierarchyV"][id$="Styles"],#skyCardHitsHouseUniformV1Styles').forEach(node=>node.remove());
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');style.id=STYLE_ID;
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

    /* Collapsed = scan-first. Keep the exact degrees, but let the canonical sign glyphs breathe. */
    .sky-card-house-toggle-range{gap:.22rem!important;font-size:.61rem!important;line-height:1.15!important}
    .sky-card-house-toggle-glyph{display:inline-block!important;flex:0 0 23px!important;width:23px!important;height:23px!important}

    .sky-card-house-detail{gap:.82rem!important}
    .sky-card-house-first-tip{display:flex;align-items:center;justify-content:space-between;gap:.65rem;padding:.56rem .62rem;border:1px solid color-mix(in srgb,var(--sky-house-unit-color,#777) 38%,rgba(31,27,24,.12));border-radius:.65rem;background:color-mix(in srgb,var(--sky-house-unit-color,#777) 7%,#fffdfa);color:#514a44;font:760 .62rem/1.38 system-ui,sans-serif}
    .sky-card-house-first-tip button{appearance:none;flex:0 0 auto;border:1px solid rgba(31,27,24,.16);border-radius:999px;background:#fff;padding:.32rem .52rem;color:#332d28;cursor:pointer;font:850 .58rem/1 system-ui,sans-serif}
    .sky-card-house-first-tip button:hover,.sky-card-house-first-tip button:focus-visible{background:#f6f1ea;outline:none}

    .sky-card-house-meaning{display:grid;gap:.36rem;justify-items:start;padding:.12rem .1rem .06rem}
    .sky-card-house-name{font-size:.78rem!important;color:#27221e!important}
    .sky-card-house-span{display:grid!important;gap:.54rem!important;min-width:0!important;padding-top:.82rem!important;border-top:1px solid color-mix(in srgb,var(--sky-house-unit-color,#777) 28%,rgba(31,27,24,.08))!important}
    .sky-card-house-span:first-of-type{padding-top:.76rem!important;border-top:1px solid color-mix(in srgb,var(--sky-house-unit-color,#777) 28%,rgba(31,27,24,.08))!important}
    .sky-card-house-span-heading{display:block!important;min-width:0!important;margin:0!important;padding:0 .08rem!important;border:0!important;background:transparent!important;color:#342f2a!important;font:900 .66rem/1.35 system-ui,sans-serif!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important}

    /* Ruler + Sign are one governance relationship. Present them together, not as two long stacked rows. */
    .sky-card-house-detail-stack{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:.52rem!important;min-width:0!important;align-items:start!important}
    .sky-card-house-detail-row:not(.sky-card-house-detail-row-decan){display:grid!important;grid-template-columns:minmax(0,1fr)!important;align-content:start!important;justify-items:center!important;gap:.32rem!important;min-width:0!important;padding:.5rem .42rem .56rem!important;border:1px solid rgba(31,27,24,.09)!important;border-top:3px solid var(--sky-house-unit-color,#777)!important;border-left:1px solid rgba(31,27,24,.09)!important;border-radius:.72rem!important;background:#fffdfa!important;box-shadow:0 1px 3px rgba(31,27,24,.035)!important;text-align:center!important}
    .sky-card-house-detail-row:not(.sky-card-house-detail-row-decan) .sky-card-house-detail-role{justify-self:start!important;width:100%!important;padding:0!important;color:#665d55!important;font:950 .5rem/1 system-ui,sans-serif!important;letter-spacing:.07em!important;text-align:left!important;text-transform:uppercase!important;white-space:nowrap!important}
    .sky-card-house-span-major-art{display:block!important;width:52px!important;height:90px!important;max-width:52px!important;aspect-ratio:500/866!important;margin:.02rem auto 0!important;border:1px solid rgba(31,27,24,.2)!important;border-radius:5px!important;background:#eee!important;box-shadow:0 2px 6px rgba(31,27,24,.12)!important;overflow:hidden!important}
    .sky-card-house-span-major-art>img{display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;border-radius:4px!important}
    .sky-card-house-detail-row:not(.sky-card-house-detail-row-decan) .sky-card-house-detail-copy{display:grid!important;align-content:start!important;justify-items:center!important;gap:.25rem!important;width:100%!important;min-width:0!important;text-align:center!important}
    .sky-card-house-detail-row:not(.sky-card-house-detail-row-decan) .sky-card-house-detail-card-name{display:block!important;max-width:100%!important;color:#655d56!important;font:760 .61rem/1.22 system-ui,sans-serif!important;white-space:normal!important;overflow-wrap:anywhere!important}
    .sky-card-house-detail-row:not(.sky-card-house-detail-row-decan) .sky-card-house-detail-name-line{display:flex!important;align-items:center!important;justify-content:center!important;flex-wrap:wrap!important;gap:.24rem!important;min-width:0!important;width:100%!important}

    /* When someone asks for meaning, turn the pair into a reading layout so the definition gets real width. */
    .sky-card-house-detail-stack:has(> .sky-card-house-detail-row:not(.sky-card-house-detail-row-decan) .sky-card-house-progressive-name[aria-expanded="true"]){grid-template-columns:minmax(0,1fr)!important}
    .sky-card-house-detail-stack:has(> .sky-card-house-detail-row:not(.sky-card-house-detail-row-decan) .sky-card-house-progressive-name[aria-expanded="true"]) > .sky-card-house-detail-row:not(.sky-card-house-detail-row-decan){grid-template-columns:64px minmax(0,1fr)!important;grid-template-areas:"role role" "art copy"!important;align-items:center!important;justify-items:start!important;text-align:left!important}
    .sky-card-house-detail-stack:has(> .sky-card-house-detail-row:not(.sky-card-house-detail-row-decan) .sky-card-house-progressive-name[aria-expanded="true"]) > .sky-card-house-detail-row:not(.sky-card-house-detail-row-decan) .sky-card-house-detail-role{grid-area:role!important}
    .sky-card-house-detail-stack:has(> .sky-card-house-detail-row:not(.sky-card-house-detail-row-decan) .sky-card-house-progressive-name[aria-expanded="true"]) > .sky-card-house-detail-row:not(.sky-card-house-detail-row-decan) .sky-card-house-span-major-art{grid-area:art!important;margin:0!important;width:58px!important;height:100px!important;max-width:58px!important}
    .sky-card-house-detail-stack:has(> .sky-card-house-detail-row:not(.sky-card-house-detail-row-decan) .sky-card-house-progressive-name[aria-expanded="true"]) > .sky-card-house-detail-row:not(.sky-card-house-detail-row-decan) .sky-card-house-detail-copy{grid-area:copy!important;justify-items:start!important;text-align:left!important}
    .sky-card-house-detail-stack:has(> .sky-card-house-detail-row:not(.sky-card-house-detail-row-decan) .sky-card-house-progressive-name[aria-expanded="true"]) > .sky-card-house-detail-row:not(.sky-card-house-detail-row-decan) .sky-card-house-detail-name-line{justify-content:flex-start!important}

    .sky-card-house-detail-copy{display:grid;align-content:center;justify-items:start;gap:.28rem;min-width:0}
    .sky-card-house-detail-card-name{display:block;max-width:100%;color:#655d56;font:760 .64rem/1.24 system-ui,sans-serif;white-space:normal;overflow-wrap:anywhere}
    .sky-card-house-detail-name-line{display:flex;align-items:center;gap:.3rem;min-width:0}
    .sky-card-house-detail-glyph{display:inline-block!important;flex:0 0 25px!important;width:25px!important;height:25px!important}
    .sky-card-house-progressive-name{appearance:none;display:inline-block;max-width:100%;margin:0;padding:.08rem .15rem;border:0;border-radius:4px;background:transparent;color:#27221f;cursor:pointer;font:900 .72rem/1.22 system-ui,sans-serif;text-align:left;white-space:normal;overflow-wrap:anywhere;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
    .sky-card-house-progressive-name:hover{background:color-mix(in srgb,var(--sky-house-unit-color,#777) 9%,transparent)}
    .sky-card-house-progressive-name:focus-visible{outline:2px solid var(--sky-house-unit-color,#777);outline-offset:2px}
    .sky-card-house-progressive-name[aria-expanded="true"]{background:color-mix(in srgb,var(--sky-house-unit-color,#777) 9%,transparent)}
    .sky-card-house-progressive-referent{display:block;max-width:42rem;margin:.08rem 0 0;padding:.36rem .42rem;border-radius:.42rem;background:rgba(45,39,34,.05);color:#5d554e;font:680 .63rem/1.42 system-ui,sans-serif;white-space:normal;overflow-wrap:anywhere}
    .sky-card-house-progressive-referent[hidden]{display:none!important}

    /* Decan Hits already names the role at section level, so the repeated DECAN column is redundant. */
    .sky-card-house-decans-zone{display:grid!important;grid-column:1/-1!important;gap:.46rem!important;min-width:0!important;margin-top:.08rem!important;padding-top:.56rem!important;border-top:1px solid rgba(31,27,24,.08)!important;background:transparent!important}
    .sky-card-house-decans-heading{display:block!important;margin:0 .06rem!important;color:#413b36!important;font:950 .52rem/1 system-ui,sans-serif!important;letter-spacing:.07em!important;text-align:left!important;text-transform:uppercase!important}
    .sky-card-house-decans-list{display:grid!important;gap:.48rem!important;min-width:0!important}
    .sky-card-house-detail-row-decan{display:grid!important;grid-template-columns:58px minmax(0,1fr)!important;align-items:start!important;gap:.58rem!important;min-width:0!important;padding:.56rem!important;border:1px solid rgba(31,27,24,.09)!important;border-left:3px solid var(--sky-house-unit-color,#777)!important;border-radius:.72rem!important;background:color-mix(in srgb,var(--sky-house-unit-color,#777) 3%,#fffdfa)!important;box-shadow:0 1px 3px rgba(31,27,24,.035)!important}
    .sky-card-house-detail-row-decan > .sky-card-house-detail-role{display:none!important}
    .sky-card-house-decan-art{display:block!important;width:58px!important;height:100px!important;max-width:58px!important;aspect-ratio:500/866!important;margin:0!important;border:1px solid rgba(31,27,24,.2)!important;border-radius:5px!important;background:#eee!important;box-shadow:0 2px 6px rgba(31,27,24,.12)!important;overflow:hidden!important}
    .sky-card-house-decan-art>img{display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;border-radius:4px!important}
    .sky-card-house-decan-meta{display:block!important;color:#403a35!important;font:850 .68rem/1.26 system-ui,sans-serif!important;white-space:normal!important}
    .sky-card-house-face{display:grid!important;gap:.22rem!important;min-width:0!important;margin-top:.12rem!important}
    .sky-card-house-face-line{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:.28rem!important;min-width:0!important}
    .sky-card-house-face-label{color:#655d56!important;font:820 .61rem/1.15 system-ui,sans-serif!important;white-space:nowrap!important}
    .sky-card-house-face-name{font-size:.69rem!important;padding:.05rem .1rem!important}
    .sky-card-house-no-placements{display:block!important;grid-column:1/-1!important;min-width:0!important;min-height:0!important;margin:0!important;padding:.42rem .52rem!important;border:1px dashed color-mix(in srgb,var(--sky-house-unit-color,#777) 32%,rgba(31,27,24,.12))!important;border-radius:.6rem!important;background:rgba(45,39,34,.025)!important;color:#655d56!important;font:760 .62rem/1.35 system-ui,sans-serif!important;text-align:left!important}

    .sky-card-house-row[data-card-house-focused="true"]>.sky-card-house-toggle{background:color-mix(in srgb,var(--sky-house-unit-color,#777) 13%,#fffdfa)!important;box-shadow:inset 4px 0 0 var(--sky-house-unit-color,#777)!important}
    .sky-card-house-row[data-card-house-focused="true"]{border-color:color-mix(in srgb,var(--sky-house-unit-color,#777) 55%,rgba(31,27,24,.12))!important}

    @media(max-width:520px){
      .sky-card-house-detail{padding:.7rem .62rem .78rem!important}
      .sky-card-house-toggle-range{font-size:.59rem!important}
      .sky-card-house-toggle-glyph{flex-basis:22px!important;width:22px!important;height:22px!important}
      .sky-card-house-detail-stack{gap:.46rem!important}
      .sky-card-house-detail-row:not(.sky-card-house-detail-row-decan){padding:.46rem .36rem .52rem!important}
      .sky-card-house-span-major-art{width:50px!important;height:87px!important;max-width:50px!important}
      .sky-card-house-detail-glyph{flex-basis:24px!important;width:24px!important;height:24px!important}
      .sky-card-house-progressive-name{font-size:.7rem!important}
      .sky-card-house-detail-card-name{font-size:.62rem!important}
      .sky-card-house-progressive-referent{font-size:.62rem!important;line-height:1.42!important}
      .sky-card-house-detail-row-decan{grid-template-columns:56px minmax(0,1fr)!important;gap:.52rem!important;padding:.52rem!important}
      .sky-card-house-decan-art{width:56px!important;height:97px!important;max-width:56px!important}
      .sky-card-house-decan-meta{font-size:.66rem!important}
      .sky-card-house-first-tip{align-items:flex-start}
    }
  `;
  document.head.appendChild(style);
}

function rootFor(node){return node?.closest?.('.sky-card-hits-structure')||null}
function slotFor(node){return rootFor(node)?.dataset.cardHitsStructureSlot||''}
function houseChoice(slot,house){return document.querySelector(`[data-house-choice="${String(slot).toLowerCase()}"][data-house-scope="house"][data-house-target="${house}"]`)}
function masterChoice(slot){return document.querySelector(`[data-house-choice="${String(slot).toLowerCase()}"][data-house-scope="all"][data-house-target="all"]`)}
function selectedHouses(slot){return HOUSES.filter(house=>houseChoice(slot,house)?.checked)}
function focusedHouse(slot){const selected=selectedHouses(slot);return selected.length===1?selected[0]:''}
function dispatchChoice(input,checked){if(!input)return false;input.checked=checked;input.dispatchEvent(new Event('change',{bubbles:true}));return true}
function setHouseFocus(slot,house){
  const target=String(house),master=masterChoice(slot);if(!KEYS[slot]||!HOUSES.includes(target)||!master||!houseChoice(slot,target))return false;
  const already=focusedHouse(slot)===target;
  if(already)dispatchChoice(master,true);else{dispatchChoice(master,false);dispatchChoice(houseChoice(slot,target),true)}
  requestAnimationFrame(syncHouseFocusUI);
  window.dispatchEvent(new CustomEvent('relphi:sky-card-house-focus-changed',{detail:{slot,house:already?null:Number(target),active:!already}}));return true;
}
function syncHouseFocusUI(){
  document.querySelectorAll('.sky-card-hits-structure[data-card-hits-structure-slot]').forEach(root=>{
    const slot=root.dataset.cardHitsStructureSlot||'',focused=focusedHouse(slot);
    root.querySelectorAll('.sky-card-house-row[data-house-number]').forEach(row=>{
      const active=!!focused&&row.dataset.houseNumber===focused;row.dataset.cardHouseFocused=active?'true':'false';
      const button=row.querySelector(':scope > .sky-card-house-toggle');if(button)button.setAttribute('aria-pressed',active?'true':'false');
    });
  });
}
function enhanceAll(){queued=false;installStyles();syncHouseFocusUI()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(enhanceAll)}
function start(){
  installStyles();enhanceAll();
  new MutationObserver(schedule).observe(document.getElementById('skyFoundationRoot')||document.body,{childList:true,subtree:true});
  ['relphi:sky-drawer-opened','relphi:saved-sky-loaded','relphi:sky-house-multiselect-changed'].forEach(name=>window.addEventListener(name,schedule));
  document.addEventListener('click',event=>{const button=event.target.closest?.('[data-card-house-toggle]');if(!button)return;const slot=slotFor(button),house=Number(button.dataset.cardHouseToggle);if(slot&&house)setHouseFocus(slot,house)},false);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
