// Keeps every canonical comparison-wheel glyph at one shared visual size.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  function scaleFor() {
    return 1;
  }

  function apply(root) {
    (root || document).querySelectorAll('.relphi-comparison-candy[data-glyph-id]').forEach(function (host) {
      const scale = scaleFor();
      const transform = String(host.getAttribute('transform') || '').replace(/\s+scale\([^)]*\)\s*$/, '');
      host.setAttribute('transform', transform + ' scale(' + scale + ')');
      host.dataset.visualScale = String(scale);
    });
  }

  window.addEventListener('relphi:comparison-lollipop-ready', function (event) {
    apply(event.detail?.svg || document);
  });
  window.addEventListener('relphi:wheel-structure-ready', function () { requestAnimationFrame(function () { apply(document); }); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { apply(document); }, { once:true });
  else apply(document);
})();