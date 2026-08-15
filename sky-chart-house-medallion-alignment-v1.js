// House medallion alignment v1: keep the compact house circles on a true vertical column.
// The coordinate occupies a fixed track, so one- and two-digit degrees cannot shift the medallion sideways.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyHouseMedallionAlignmentV1)return;
window.__relphiSkyHouseMedallionAlignmentV1=true;
const STYLE_ID='skyHouseMedallionAlignmentV1Styles';
function install(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    .sky-foundation-relationship-copy small.relphi-house-coordinate{
      display:grid!important;
      grid-template-columns:3.15rem 14px!important;
      grid-auto-flow:column!important;
      grid-auto-columns:max-content!important;
      align-items:center!important;
      justify-content:center!important;
      column-gap:4px!important;
      row-gap:0!important;
      width:100%!important;
      height:16px!important;
      margin:0!important;
      padding:0!important;
      text-align:center!important;
      white-space:nowrap!important;
    }
    .sky-foundation-relationship-copy small.relphi-house-coordinate>.relphi-house-medallion{
      justify-self:center!important;
      align-self:center!important;
      margin:0!important;
      transform:none!important;
    }
    .sky-foundation-relationship-row.is-inline-expanded .sky-foundation-relationship-copy small.relphi-house-coordinate{
      grid-template-columns:3.15rem 16px!important;
    }
    @media(max-width:620px){
      .sky-foundation-relationship-copy small.relphi-house-coordinate{
        grid-template-columns:3rem 14px!important;
        column-gap:3px!important;
      }
      .sky-foundation-relationship-row.is-inline-expanded .sky-foundation-relationship-copy small.relphi-house-coordinate{
        grid-template-columns:3rem 16px!important;
      }
    }
  `;
  document.head.appendChild(style);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install,{once:true}):install();
})();
