// Relationship row centering v1: keep both Sky A and Sky B symbolic sentences centered inside each tile.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyRelationshipRowCenteringV1)return;
window.__relphiSkyRelationshipRowCenteringV1=true;
const STYLE_ID='skyRelationshipRowCenteringV1';
function install(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    .sky-foundation-relationship-row{
      grid-template-columns:minmax(0,1fr) minmax(68px,.48fr) minmax(0,1fr)!important;
      column-gap:4px!important;
      padding-left:16px!important;
      padding-right:12px!important;
    }
    .sky-foundation-relationship-placement--left,
    .sky-foundation-relationship-placement--right{
      min-width:0!important;
      width:100%!important;
      justify-self:stretch!important;
    }
    .sky-foundation-relationship-symbol-pair{
      justify-content:center!important;
      gap:3px!important;
      max-width:100%!important;
      margin-inline:auto!important;
    }
    .sky-foundation-relationship-aspect-pair{
      gap:3px!important;
      justify-self:center!important;
    }
    @media(max-width:620px){
      .sky-foundation-relationship-row{
        grid-template-columns:minmax(0,1fr) minmax(62px,.44fr) minmax(0,1fr)!important;
        column-gap:2px!important;
        padding-left:14px!important;
        padding-right:8px!important;
      }
      .sky-foundation-relationship-symbol-pair{gap:2px!important}
    }
  `;
  document.head.appendChild(style);
}
function start(){install()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
