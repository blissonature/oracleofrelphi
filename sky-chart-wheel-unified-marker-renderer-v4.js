// Compatibility entry: load the referenced-proportion marker renderer and close tooltip positioning.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  function load(src) {
    if (document.querySelector('script[src^="' + src.split('?')[0] + '"]')) return;
    const script = document.createElement('script');
    script.async = false;
    script.src = src;
    document.body.appendChild(script);
  }
  load('sky-chart-wheel-unified-marker-renderer-v5.js?v=1');
  load('sky-chart-tooltip-close-v1.js?v=1');
})();