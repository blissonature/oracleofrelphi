// Keeps every comparison-wheel glyph at one shared displayed size.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const GLYPH_FONT_SIZE = '13px';

  function normalizeCanonicalHosts(root) {
    (root || document).querySelectorAll('.relphi-comparison-candy[data-glyph-id]').forEach(function (host) {
      const transform = String(host.getAttribute('transform') || '').replace(/\s+scale\([^)]*\)\s*$/, '');
      host.setAttribute('transform', transform + ' scale(1)');
      host.dataset.visualScale = '1';
    });
  }

  function normalizeFallbackGlyphs(root) {
    (root || document).querySelectorAll(
      '.unified-sky-wheel .chart-wheel-marker-glyph, ' +
      '.unified-sky-wheel .planet-thumb-glyph, ' +
      '.relphi-comparison-candy text'
    ).forEach(function (glyph) {
      glyph.setAttribute('font-size', GLYPH_FONT_SIZE);
      glyph.style.setProperty('font-size', GLYPH_FONT_SIZE, 'important');
      glyph.style.setProperty('line-height', '1', 'important');
    });
  }

  function apply(root) {
    normalizeCanonicalHosts(root);
    normalizeFallbackGlyphs(root);
  }

  window.addEventListener('relphi:comparison-lollipop-ready', function (event) {
    apply(event.detail?.svg || document);
  });
  window.addEventListener('relphi:wheel-structure-ready', function () {
    requestAnimationFrame(function () { apply(document); });
  });

  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function (node) {
        if (node.nodeType === 1) apply(node);
      });
    });
  });

  function start() {
    apply(document);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
