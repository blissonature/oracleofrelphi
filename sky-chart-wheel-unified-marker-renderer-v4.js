// Compatibility entry: load the shared glyph system, Sky Chart adapter, and tooltip behavior.
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
  load('relphi-unified-glyph-system-v1.js?v=1');
  load('sky-chart-wheel-unified-marker-renderer-v7.js?v=1');
  load('sky-chart-tooltip-close-v1.js?v=1');
})();
