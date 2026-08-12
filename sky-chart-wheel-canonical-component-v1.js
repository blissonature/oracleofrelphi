// Retired on the Sky Chart contract branch.
// sky-chart-contract-renderer-v1.js directly creates the canonical public wheel.
(function(){
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  window.RelphiCanonicalSkyWheel = Object.freeze({ render:function(){} });
})();
