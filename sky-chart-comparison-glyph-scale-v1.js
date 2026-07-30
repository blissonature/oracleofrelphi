// Keeps every comparison-wheel glyph at one shared rendered size.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const GLYPH_FONT_SIZE = '13px';

  function baseTransform(host) {
    if (!host.dataset.uniformGlyphBaseTransform) {
      host.dataset.uniformGlyphBaseTransform = String(host.getAttribute('transform') || '')
        .replace(/\s+scale\([^)]*\)\s*$/, '')
        .trim();
    }
    return host.dataset.uniformGlyphBaseTransform;
  }

  function setHostScale(host, scale) {
    const base = baseTransform(host);
    host.setAttribute('transform', (base ? base + ' ' : '') + 'scale(' + scale + ')');
    host.dataset.visualScale = String(scale);
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

  function normalizeRenderedHosts(root) {
    const scope = root || document;
    const hosts = Array.from(scope.querySelectorAll('.relphi-comparison-candy[data-glyph-id]'));
    if (!hosts.length && scope !== document) {
      return normalizeRenderedHosts(document);
    }
    if (!hosts.length) return;

    hosts.forEach(function (host) { setHostScale(host, 1); });

    requestAnimationFrame(function () {
      const measurements = hosts.map(function (host) {
        const rect = host.getBoundingClientRect();
        return { host: host, size: Math.max(rect.width, rect.height) };
      }).filter(function (entry) {
        return Number.isFinite(entry.size) && entry.size > 0.25;
      });

      if (!measurements.length) return;

      // Preserve the established full-size set and enlarge every mini set to match it.
      const target = Math.max.apply(null, measurements.map(function (entry) { return entry.size; }));
      measurements.forEach(function (entry) {
        const scale = Math.max(0.25, Math.min(4, target / entry.size));
        setHostScale(entry.host, Number(scale.toFixed(4)));
      });
    });
  }

  function apply(root) {
    normalizeFallbackGlyphs(root);
    normalizeRenderedHosts(root);
  }

  window.addEventListener('relphi:comparison-lollipop-ready', function (event) {
    apply(event.detail?.svg || document);
  });
  window.addEventListener('relphi:wheel-structure-ready', function () {
    requestAnimationFrame(function () { apply(document); });
  });

  const observer = new MutationObserver(function (mutations) {
    if (mutations.some(function (mutation) { return mutation.addedNodes.length; })) {
      requestAnimationFrame(function () { apply(document); });
    }
  });

  function start() {
    apply(document);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
