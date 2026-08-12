// Retired on the Sky Chart contract branch.
// sky-chart-contract-controller-v1.js exclusively owns hover, focus, selection,
// isolation, relationship filtering, and selected-relationship activation.
(function(){
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  window.__relphiLegacyWheelMarkerInteractionRetired = true;
})();
