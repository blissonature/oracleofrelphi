// Keep the main comparison wheel to one full-size canonical placement layer per sky.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SKY_B_DRAFT_KEY = 'relphiSkyChartSkyBDraftV1';
  let queued = false;

  function installFallbackGuard() {
    let style = document.getElementById('sky-chart-full-size-placement-only');
    if (!style) {
      style = document.createElement('style');
      style.id = 'sky-chart-full-size-placement-only';
      document.head.appendChild(style);
    }

    style.textContent = [
      '.unified-sky-wheel .chart-wheel-placement-stick:has(.relphi-comparison-candy[data-glyph-id]) > .chart-wheel-marker-glyph,',
      '.unified-sky-wheel .chart-wheel-placement-stick:has(.relphi-comparison-candy[data-glyph-id]) > .chart-wheel-marker-object,',
      '.unified-sky-wheel .chart-wheel-placement-stick:has(.relphi-comparison-candy[data-glyph-id]) > .chart-wheel-marker-frame,',
      '.unified-sky-wheel .chart-wheel-placement-stick:has(.relphi-comparison-candy[data-glyph-id]) > .chart-wheel-marker-planet,',
      '.unified-sky-wheel .chart-wheel-placement-stick:has(.relphi-comparison-candy[data-glyph-id]) > .chart-wheel-marker-disc,',
      '.unified-sky-wheel .chart-wheel-placement-stick:has(.relphi-comparison-candy[data-glyph-id]) > .chart-wheel-stick-knob,',
      '.unified-sky-wheel .chart-wheel-placement:has(.relphi-comparison-candy[data-glyph-id]) > .chart-wheel-marker-glyph,',
      '.unified-sky-wheel .chart-wheel-placement:has(.relphi-comparison-candy[data-glyph-id]) > .chart-wheel-marker-object,',
      '.unified-sky-wheel .chart-wheel-placement:has(.relphi-comparison-candy[data-glyph-id]) > .chart-wheel-marker-frame,',
      '.unified-sky-wheel .chart-wheel-placement:has(.relphi-comparison-candy[data-glyph-id]) > .chart-wheel-marker-planet,',
      '.unified-sky-wheel .chart-wheel-placement:has(.relphi-comparison-candy[data-glyph-id]) > .chart-wheel-marker-disc,',
      '.unified-sky-wheel .chart-wheel-placement:has(.relphi-comparison-candy[data-glyph-id]) > .chart-wheel-stick-knob,',
      '.unified-sky-wheel .mini-wheel-marker,',
      '.unified-sky-wheel .mini-wheel-marker-glyph {',
      '  display: none !important;',
      '}',
      '.unified-sky-wheel .relphi-comparison-candy[data-glyph-id] {',
      '  display: inline !important;',
      '  visibility: visible !important;',
      '  opacity: 1 !important;',
      '}'
    ].join('\n');
  }

  function restoreCanonicalVisibility(root) {
    const scope = root || document;
    scope.querySelectorAll('.unified-sky-wheel .relphi-comparison-candy[data-glyph-id]').forEach(function (host) {
      host.style.removeProperty('display');
      host.style.setProperty('visibility', 'visible', 'important');
      host.style.setProperty('opacity', '1', 'important');
      host.removeAttribute('aria-hidden');
    });
  }

  function apply(root) {
    installFallbackGuard();
    restoreCanonicalVisibility(root);
  }

  function queueApply(root) {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      apply(root || document);
    });
  }

  function saveSkyBDraft() {
    const target = document.getElementById('skyCalcTarget');
    if (!target || target.value !== 'currentSky') return;
    const read = function (id) { return document.getElementById(id)?.value || ''; };
    try {
      localStorage.setItem(SKY_B_DRAFT_KEY, JSON.stringify({
        name: read('skyCalcName'),
        dateTime: read('skyCalcDateTime'),
        timeZone: read('skyCalcTimeZone'),
        location: read('skyCalcLocation'),
        latitude: read('skyCalcLatitude'),
        longitude: read('skyCalcLongitude'),
        houseSystem: read('skyCalcHouseSystem')
      }));
    } catch (error) {}
  }

  window.addEventListener('relphi:comparison-lollipop-ready', function (event) {
    queueApply(event.detail?.svg || document);
  });

  window.addEventListener('relphi:wheel-structure-ready', function () {
    queueApply(document);
  });

  function start() {
    apply(document);
    document.addEventListener('change', function (event) {
      if (event.target.closest?.('.sky-calc-panel')) saveSkyBDraft();
    });
    const observer = new MutationObserver(function (mutations) {
      if (mutations.some(function (mutation) { return mutation.addedNodes.length; })) queueApply(document);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
