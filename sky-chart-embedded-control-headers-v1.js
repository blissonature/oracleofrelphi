// Sky Chart compact embedded control headers.
// Presentation only: does not own filter state, relationship eligibility, or wheel rendering.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyEmbeddedControlHeadersV1)return;
window.__relphiSkyEmbeddedControlHeadersV1=true;

const STYLE_ID='skyEmbeddedControlHeadersV1Styles';
let queued=false,observer=null;

function installStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
/* External captions collapse; the closed control itself carries the neutral header. */
#skyFoundationFocus .sky-relationship-display-label,
#skyFoundationFocus .sky-chart-placement-filter-label,
#skyFoundationFocus .sky-chart-zodiac-filter-label,
#skyFoundationFocus .sky-chart-house-filter-label,
#skyFoundationRelationships .sky-chart-aspect-filter-label{
  display:none!important;
}

/* Focus controls: one compact visual grammar. */
#skyFoundationFocus .sky-relationship-display-head,
#skyFoundationFocus .sky-chart-placement-filter-head,
#skyFoundationFocus .sky-chart-house-filter-head{
  grid-template-rows:29px!important;
  grid-template-areas:"field field"!important;
  gap:0!important;
}
#skyFoundationFocus .sky-chart-placement-summary-choices,
#skyFoundationFocus .sky-chart-house-summary-choices{
  grid-row:1!important;
}
#skyFoundationFocus .sky-chart-placement-filter-toggle,
#skyFoundationFocus .sky-chart-house-filter-toggle{
  grid-row:1!important;
}
#skyFoundationFocus .sky-chart-zodiac-filter{
  display:block!important;
}
#skyFoundationFocus .sky-chart-zodiac-filter-toggle{
  width:100%!important;
  min-width:0!important;
  height:29px!important;
  box-sizing:border-box!important;
  padding:0 30px 0 9px!important;
  border:1px solid rgba(31,27,24,.18)!important;
  border-radius:9px!important;
  background:#fff var(--sky-chart-filter-chevron) no-repeat right 7px center/14px 14px!important;
  color:#332e2a!important;
  font:800 .67rem/1 system-ui,sans-serif!important;
  text-align:left!important;
}

/* Neutral captions are shown inside the controls. */
[data-embedded-neutral="true"] [data-relationship-display-value-text],
[data-embedded-neutral="true"] [data-placement-filter-summary],
[data-embedded-neutral="true"] [data-house-filter-summary],
[data-embedded-neutral="true"] [data-zodiac-summary],
[data-embedded-neutral="true"] [data-aspect-filter-summary]{
  font-size:0!important;
  color:transparent!important;
}
[data-embedded-neutral="true"] [data-relationship-display-value-text]::after,
[data-embedded-neutral="true"] [data-placement-filter-summary]::after,
[data-embedded-neutral="true"] [data-house-filter-summary]::after,
[data-embedded-neutral="true"] [data-zodiac-summary]::after,
[data-embedded-neutral="true"] [data-aspect-filter-summary]::after{
  content:attr(data-embedded-label);
  color:#332e2a;
  font:800 .67rem/1 system-ui,sans-serif;
}

/* Relationships header: Sort and Max are independent lanes. Never overlap. */
#skyFoundationRelationships .sky-relationship-heading-actions{
  display:flex!important;
  align-items:center!important;
  gap:8px!important;
  min-width:0!important;
  flex-wrap:nowrap!important;
}
#skyFoundationRelationships .sky-relationship-sort-control{
  flex:0 0 166px!important;
  width:166px!important;
  min-width:166px!important;
  max-width:166px!important;
}
#skyFoundationRelationships .sky-relationship-sort-select{
  width:166px!important;
  min-width:166px!important;
  max-width:166px!important;
}
#skyFoundationRelationships .sky-relationship-limit-control{
  flex:0 0 auto!important;
  min-width:74px!important;
  margin-left:0!important;
}
#skyFoundationRelationships .sky-relationship-limit-control>select{
  width:74px!important;
  min-width:74px!important;
}
#skyFoundationRelationships .sky-relationship-limit-control>input:not([hidden]){
  width:64px!important;
  min-width:64px!important;
}
#skyFoundationRelationships #skyFoundationRelationshipCount{
  margin-left:auto!important;
  flex:0 0 auto!important;
}

/* Sort itself uses the embedded header until the user makes an explicit choice. */
#skyFoundationRelationships .sky-relationship-sort-select[data-embedded-sort-neutral="true"]{
  color:#332e2a!important;
  font-weight:800!important;
}

@media(max-width:760px){
  #skyFoundationRelationships .sky-relationship-heading-actions{
    display:grid!important;
    grid-template-columns:minmax(0,1fr) 80px auto auto auto!important;
    gap:7px!important;
  }
  #skyFoundationRelationships .sky-relationship-sort-control,
  #skyFoundationRelationships .sky-relationship-sort-select{
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
  }
  #skyFoundationRelationships .sky-relationship-limit-control{
    min-width:0!important;
  }
  #skyFoundationRelationships #skyFoundationRelationshipCount{
    margin-left:0!important;
  }
}
`;
  document.head.appendChild(style);
}

function text(node){return String(node?.textContent||'').replace(/\s+/g,' ').trim()}
function neutral(owner,target,label,matcher){
  if(!owner||!target)return;
  target.dataset.embeddedLabel=label;
  owner.dataset.embeddedNeutral=matcher(text(target))?'true':'false';
}
function syncFocus(){
  const display=document.querySelector('#skyFoundationFocus [data-relationship-display-control]');
  neutral(display,display?.querySelector('[data-relationship-display-value-text]'),'Display',value=>/^(all|glyphs · referents · names)$/i.test(value));

  const placements=document.querySelector('#skyFoundationFocus [data-placement-filter="combined"]');
  neutral(placements,placements?.querySelector('[data-placement-filter-summary]'),'Placements',value=>/^all$/i.test(value));

  const signs=document.querySelector('#skyFoundationFocus [data-zodiac-filter="true"]');
  neutral(signs,signs?.querySelector('[data-zodiac-summary]'),'Signs',value=>/^all$/i.test(value));

  const houses=document.querySelector('#skyFoundationFocus [data-house-filter="combined"]');
  neutral(houses,houses?.querySelector('[data-house-filter-summary]'),'Houses',value=>/^all$/i.test(value));
}
function syncRelationships(){
  const aspects=document.querySelector('[data-aspect-filter="combined"]');
  const aspectSummary=aspects?.querySelector('[data-aspect-filter-summary]');
  if(aspects&&aspectSummary){
    aspectSummary.dataset.embeddedLabel='Aspects';
    aspects.dataset.embeddedNeutral=/^all$/i.test(text(aspectSummary))?'true':'false';
  }

  const sort=document.querySelector('#skyFoundationRelationships .sky-relationship-sort-select');
  if(sort&&!sort.dataset.embeddedSortInitialized){
    sort.dataset.embeddedSortInitialized='true';
    sort.dataset.embeddedSortNeutral='true';
    const selected=sort.selectedOptions?.[0];
    if(selected){
      selected.dataset.embeddedOriginalText=selected.textContent||'';
      selected.textContent='Sort';
    }
    sort.addEventListener('change',()=>{
      sort.querySelectorAll('option[data-embedded-original-text]').forEach(option=>{
        option.textContent=option.dataset.embeddedOriginalText;
        delete option.dataset.embeddedOriginalText;
      });
      sort.dataset.embeddedSortNeutral='false';
    },{once:true});
  }
}
function sync(){
  queued=false;
  installStyles();
  syncFocus();
  syncRelationships();
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(sync))}
function start(){
  sync();
  ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-display-changed',
   'relphi:sky-placement-multiselect-changed','relphi:sky-house-multiselect-changed',
   'relphi:sky-zodiac-filter-changed','relphi:sky-aspect-multiselect-changed',
   'relphi:relationship-sort-changed'].forEach(name=>window.addEventListener(name,schedule));
  observer=new MutationObserver(schedule);
  observer.observe(document.getElementById('skyFoundationComparison')||document.body,{childList:true,subtree:true,characterData:true});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();