// Prevents iOS browser-chrome height changes from being treated as Sky Chart layout resizes.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  let width = document.documentElement.clientWidth;
  window.addEventListener('resize', function (event) {
    const nextWidth = document.documentElement.clientWidth;
    if (nextWidth === width) {
      event.stopImmediatePropagation();
      return;
    }
    width = nextWidth;
  }, { capture:true, passive:true });
})();
