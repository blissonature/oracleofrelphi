// House Card Hits visual hierarchy: governance on a house-color field,
// occupied decans on a white field outlined in the same house color.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyCardHitsVisualHierarchyV2)return;
window.__relphiSkyCardHitsVisualHierarchyV1=true;
window.__relphiSkyCardHitsVisualHierarchyV2=true;

const STYLE_ID='skyCardHitsVisualHierarchyV2Styles';
let queued=false;

function installStyles(){
  if(document.getElementById(STYLE_ID))return;
  document.querySelectorAll('[id^="skyCardHitsVisualHierarchyV"][id$="Styles"]').forEach(node=>node.remove());
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

    .sky-card-house-span[data-visual-hierarchy="true"]{
      gap:0!important;
      min-width:0!important;
    }
    .sky-card-house-span[data-visual-hierarchy="true"]>.sky-card-house-card-line{
      --sky-house-card-col:46px;
      --sky-house-card-art-w:42px;
      --sky-house-card-art-h:73px;
      display:grid!important;
      grid-template-columns:auto minmax(0,1fr)!important;
      grid-template-rows:auto auto!important;
      width:100%!important;
      max-width:100%!important;
      min-width:0!important;
      box-sizing:border-box!important;
      gap:0!important;
      padding:0!important;
      border:2px solid var(--sky-house-unit-color,#777)!important;
      border-radius:13px!important;
      overflow:hidden!important;
      background:#fffdfa!important;
      box-shadow:0 1px 3px rgba(31,27,24,.06)!important;
    }
    .sky-card-house-span[data-visual-hierarchy="true"]>.sky-card-house-card-line::before,
    .sky-card-house-span[data-visual-hierarchy="true"]>.sky-card-house-card-line::after{
      content:none!important;
      display:none!important;
    }
    .sky-card-house-span[data-visual-hierarchy="true"] .sky-card-house-span-heading{
      grid-column:1/-1!important;
      grid-row:1!important;
      display:block!important;
      min-width:0!important;
      margin:0!important;
      padding:.34rem .48rem .32rem .62rem!important;
      border:0!important;
      border-bottom:1px solid color-mix(in srgb,var(--sky-house-unit-color,#777) 48%,rgba(31,27,24,.08))!important;
      background:color-mix(in srgb,var(--sky-house-unit-color,#777) 18%,#fffdfa)!important;
      box-shadow:inset 5px 0 0 var(--sky-house-unit-color,#777)!important;
      color:#4e4741!important;
      font:850 .55rem/1.15 system-ui,sans-serif!important;
      white-space:nowrap!important;
      overflow:hidden!important;
      text-overflow:ellipsis!important;
    }
    .sky-card-house-governance{
      grid-column:1!important;
      grid-row:2!important;
      display:grid!important;
      grid-template-columns:repeat(2,var(--sky-house-card-col))!important;
      gap:.3rem!important;
      align-items:start!important;
      min-width:0!important;
      padding:.48rem .38rem .48rem!important;
      background:color-mix(in srgb,var(--sky-house-unit-color,#777) 32%,#fffdfa)!important;
    }
    .sky-card-house-decans-zone{
      grid-column:2!important;
      grid-row:2!important;
      display:grid!important;
      grid-template-rows:auto 1fr!important;
      align-content:start!important;
      min-width:0!important;
      box-sizing:border-box!important;
      padding:.48rem .38rem .48rem!important;
      border-left:2px solid var(--sky-house-unit-color,#777)!important;
      background:#fffdfa!important;
    }
    .sky-card-house-decans-heading{
      display:block!important;
      margin:0 0 .28rem!important;
      color:color-mix(in srgb,var(--sky-house-unit-color,#555) 72%,#332d28)!important;
      font:900 .42rem/1 system-ui,sans-serif!important;
      letter-spacing:.06em!important;
      text-align:left!important;
      text-transform:uppercase!important;
    }
    .sky-card-house-decans-grid{
      display:grid!important;
      grid-template-columns:repeat(2,var(--sky-house-card-col))!important;
      grid-auto-rows:auto!important;
      gap:.42rem .3rem!important;
      align-items:start!important;
      justify-content:start!important;
      min-width:0!important;
      max-width:100%!important;
    }
    .sky-card-house-no-placements{
      display:flex!important;
      align-items:center!important;
      justify-content:flex-start!important;
      min-width:0!important;
      min-height:91px!important;
      padding:0 .1rem!important;
      color:#81776f!important;
      font:800 .49rem/1.2 system-ui,sans-serif!important;
      text-align:left!important;
    }
    .sky-card-house-span[data-visual-hierarchy="true"] .sky-card-house-span-major,
    .sky-card-house-span[data-visual-hierarchy="true"] .sky-card-house-decan{
      display:grid!important;
      grid-template-rows:10px var(--sky-house-card-art-h) minmax(18px,auto)!important;
      justify-items:center!important;
      align-items:start!important;
      align-content:start!important;
      gap:.24rem!important;
      width:var(--sky-house-card-col)!important;
      min-width:var(--sky-house-card-col)!important;
      max-width:var(--sky-house-card-col)!important;
      margin:0!important;
    }
    .sky-card-house-span[data-visual-hierarchy="true"] .sky-card-house-span-major-role{
      display:block!important;
      width:100%!important;
      color:color-mix(in srgb,var(--sky-house-unit-color,#555) 82%,#2f2924)!important;
      font:900 .42rem/1 system-ui,sans-serif!important;
      letter-spacing:.055em!important;
      text-align:center!important;
      text-transform:uppercase!important;
    }
    .sky-card-house-span[data-visual-hierarchy="true"] .sky-card-house-decan::before{
      content:none!important;
      display:none!important;
    }
    .sky-card-house-span[data-visual-hierarchy="true"] .sky-card-house-span-major-art,
    .sky-card-house-span[data-visual-hierarchy="true"] .sky-card-house-decan-art{
      display:block!important;
      width:var(--sky-house-card-art-w)!important;
      max-width:var(--sky-house-card-art-w)!important;
      height:var(--sky-house-card-art-h)!important;
      aspect-ratio:500/866!important;
      margin:0!important;
      border:1px solid rgba(31,27,24,.16)!important;
      border-radius:5px!important;
      box-shadow:0 2px 6px rgba(31,27,24,.11)!important;
      overflow:hidden!important;
    }
    .sky-card-house-span[data-visual-hierarchy="true"] .sky-card-house-span-major-art>img,
    .sky-card-house-span[data-visual-hierarchy="true"] .sky-card-house-decan-art>img{
      display:block!important;
      width:100%!important;
      height:100%!important;
      object-fit:cover!important;
      border-radius:4px!important;
    }
    .sky-card-house-span[data-visual-hierarchy="true"] .sky-card-house-span-major-name,
    .sky-card-house-span[data-visual-hierarchy="true"] .sky-card-house-decan-label{
      display:flex!important;
      align-items:flex-start!important;
      justify-content:center!important;
      gap:.08rem!important;
      width:var(--sky-house-card-col)!important;
      max-width:var(--sky-house-card-col)!important;
      min-height:18px!important;
      margin:0!important;
      padding:0!important;
      overflow:visible!important;
      color:#332d28!important;
      font:850 .46rem/1.15 system-ui,sans-serif!important;
      text-align:center!important;
      text-overflow:clip!important;
      white-space:normal!important;
    }
    .sky-card-house-span[data-visual-hierarchy="true"] .sky-card-house-decan-label .sky-card-inline-glyph{
      flex:0 0 12px!important;
      width:12px!important;
      height:12px!important;
    }
    @media(max-width:520px){
      .sky-card-house-span[data-visual-hierarchy="true"]>.sky-card-house-card-line{
        --sky-house-card-col:44px;
        --sky-house-card-art-w:40px;
        --sky-house-card-art-h:69px;
      }
      .sky-card-house-governance,.sky-card-house-decans-zone{padding:.44rem .3rem .44rem!important}
      .sky-card-house-governance,.sky-card-house-decans-grid{column-gap:.24rem!important}
    }
    @media(max-width:340px){
      .sky-card-house-span[data-visual-hierarchy="true"]>.sky-card-house-card-line{
        grid-template-columns:1fr!important;
      }
      .sky-card-house-governance{grid-column:1!important;grid-row:2!important}
      .sky-card-house-decans-zone{grid-column:1!important;grid-row:3!important;border-left:0!important;border-top:2px solid var(--sky-house-unit-color,#777)!important}
    }
  `;
  document.head.appendChild(style);
}

function enhanceSpan(span){
  if(!span||span.dataset.visualHierarchy==='true')return;
  const line=span.querySelector(':scope > .sky-card-house-card-line');
  if(!line)return;
  const majors=[...line.querySelectorAll(':scope > .sky-card-house-span-major')];
  const decans=[...line.querySelectorAll(':scope > .sky-card-house-decan')];
  if(majors.length<2)return;

  const heading=span.querySelector(':scope > .sky-card-house-span-heading');
  const governance=document.createElement('div');
  governance.className='sky-card-house-governance';
  majors.forEach(node=>governance.appendChild(node));

  const decanZone=document.createElement('div');
  decanZone.className='sky-card-house-decans-zone';
  const decanHeading=document.createElement('span');
  decanHeading.className='sky-card-house-decans-heading';
  decanHeading.textContent='Decans';
  decanZone.appendChild(decanHeading);

  if(decans.length){
    const grid=document.createElement('div');
    grid.className='sky-card-house-decans-grid';
    decans.forEach(node=>grid.appendChild(node));
    decanZone.appendChild(grid);
  }else{
    const empty=document.createElement('span');
    empty.className='sky-card-house-no-placements';
    empty.textContent='No placements';
    decanZone.appendChild(empty);
  }

  line.replaceChildren();
  if(heading)line.appendChild(heading);
  line.append(governance,decanZone);
  span.dataset.visualHierarchy='true';
}

function enhanceAll(){
  queued=false;
  installStyles();
  document.querySelectorAll('.sky-card-house-span').forEach(enhanceSpan);
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(enhanceAll)}
function start(){
  installStyles();enhanceAll();
  new MutationObserver(schedule).observe(document.getElementById('skyFoundationRoot')||document.body,{childList:true,subtree:true});
  ['relphi:sky-drawer-opened','relphi:saved-sky-loaded','relphi:sky-house-multiselect-changed'].forEach(name=>window.addEventListener(name,schedule));
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();