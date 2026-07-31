// Enforce one house-cell boundary: the right-hand divider only.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  const id='relphi-house-boundary-rule-v1';
  if(document.getElementById(id))return;
  const style=document.createElement('style');
  style.id=id;
  style.textContent=`
    .scn-live-wheel [data-layer="sky-a-houses"] path,
    .scn-live-wheel [data-layer="sky-b-houses"] path{
      stroke:none!important;
      stroke-width:0!important;
      outline:none!important;
      filter:none!important;
    }
    .scn-live-wheel [data-interactive="house"].is-hovered,
    .scn-live-wheel [data-interactive="house"].is-selected,
    .scn-live-wheel [data-interactive="house"].is-primary,
    .scn-live-wheel [data-interactive="house"].is-related{
      filter:none!important;
      outline:none!important;
      stroke:none!important;
    }
    .scn-live-wheel [data-layer="sky-a-houses"] .scn-house-divider{stroke:#c9211e!important}
    .scn-live-wheel [data-layer="sky-b-houses"] .scn-house-divider{stroke:#2462d0!important}
  `;
  document.head.appendChild(style);
})();