// Keep only the full-size canonical placement bubbles on the main comparison wheel.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  let queued = false;

  const LEGACY_MARKER_SELECTOR = [
    '.unified-sky-wheel .chart-wheel-marker-glyph',
    '.unified-sky-wheel .chart-wheel-stick-knob',
    '.unified-sky-wheel .chart-wheel-marker-disc',
    '.unified-sky-wheel .chart-wheel-marker-object',
    '.unified-sky-wheel .chart-wheel-marker-frame',
    '.unified-sky-wheel .chart-wheel-marker-planet',
    '.unified-sky-wheel .mini-wheel-marker',
    '.unified-sky-wheel .mini-wheel-marker-glyph'
  ].join(', ');

  function containsCanonicalBubble(node) {
    return node.matches?.('.relphi-comparison-candy[data-glyph-id]') ||
      node.closest?.('.relphi-comparison-candy[data-glyph-id]') ||
      node.querySelector?.('.relphi-comparison-candy[data-glyph-id]');
  }

  function hideNativeTinyMarkers() {
    document.querySelectorAll(LEGACY_MARKER_SELECTOR).forEach(function (node) {
      if (containsCanonicalBubble(node)) return;
      node.style.setProperty('display', 'none', 'important');
      node.setAttribute('aria-hidden', 'true');
    });
  }

  function restoreCanonicalBubbles() {
    document.querySelectorAll('.unified-sky-wheel .relphi-comparison-candy[data-glyph-id]').forEach(function (host) {
      host.style.removeProperty('display');
      host.style.setProperty('visibility', 'visible', 'important');
      host.style.setProperty('opacity', '1', 'important');
      host.removeAttribute('aria-hidden');
    });
  }

  function installCssGuard() {
    let style = document.getElementById('sky-chart-no-native-tiny-markers');
    if (!style) {
      style = document.createElement('style');
      style.id = 'sky-chart-no-native-tiny-markers';
      document.head.appendChild(style);
    }

    style.textContent = [
      '.unified-sky-wheel .chart-wheel-marker-glyph,',
      '.unified-sky-wheel .chart-wheel-stick-knob,',
      '.unified-sky-wheel .chart-wheel-marker-disc,',
      '.unified-sky-wheel .mini-wheel-marker,',
      '.unified-sky-wheel .mini-wheel-marker-glyph {',
      '  display: none !important;',
      '}',
      '.unified-sky-wheel .chart-wheel-marker-object:not(:has(.relphi-comparison-candy[data-glyph-id])),',
      '.unified-sky-wheel .chart-wheel-marker-frame:not(:has(.relphi-comparison-candy[data-glyph-id])),',
      '.unified-sky-wheel .chart-wheel-marker-planet:not(:has(.relphi-comparison-candy[data-glyph-id])) {',
      '  display: none !important;',
      '}',
      '.unified-sky-wheel .relphi-comparison-candy[data-glyph-id] {',
      '  visibility: visible !important;',
      '  opacity: 1 !important;',
      '}'
    ].join('\n');
  }

  function apply() {
    installCssGuard();
    hideNativeTinyMarkers();
    restoreCanonicalBubbles();
  }

  function queueApply() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      apply();
    });
  }

  window.addEventListener('relphi:comparison-lollipop-ready', queueApply);
  window.addEventListener('relphi:wheel-structure-ready', queueApply);

  function start() {
    apply();
    const observer = new MutationObserver(function (mutations) {
      if (mutations.some(function (mutation) { return mutation.addedNodes.length; })) queueApply();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
