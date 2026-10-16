// Keep Sky Chart filter popovers interaction-stable without becoming another geometry owner.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyFilterPopoverStabilityV1)return;
  window.__relphiSkyFilterPopoverStabilityV1=true;

  // Menu geometry, scrolling, and outside-tap behavior are owned by
  // sky-chart-dropdown-position-v1.js. Do not lock document scrolling here.
  // This module is intentionally inert to preserve the existing script entry point.

})();
