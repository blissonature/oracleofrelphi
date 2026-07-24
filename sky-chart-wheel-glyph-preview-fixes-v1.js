// Preview-only cleanup: remove duplicate source glyphs and load one unified finalizer.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const PLACEMENT = '.chart-wheel-placement-stick';
  let queued = false;

  function appendOnce(src) {
    const base = src.split('?')[0];
    if (document.querySelector('script[src^="' + base + '"]')) return;
    const script = document.createElement('script');
    script.async = false;
    script.src = src;
    document.body.appendChild(script);
  }

  function removeDuplicateGlyphs(group) {
    if (!group.querySelector('svg.relphi-bold-inline-glyph')) return;
    group.querySelectorAll(
      '.chart-wheel-marker-glyph, image.relphi-bubble-glyph-image, image.relphi-angle-glyph-image, svg.relphi-colored-glyph, .relphi-wheel-planet-glyph'
    ).forEach(function (node) {
      if (node.matches('svg.relphi-bold-inline-glyph')) return;
      node.remove();
    });
  }

  function run() {
    queued = false;
    document.querySelectorAll(PLACEMENT).forEach(removeDuplicateGlyphs);
  }

  function schedule() {
    if (queued) return;
    queued = true;
    queueMicrotask(run);
  }

  function install() {
    appendOnce('sky-chart-extra-points-support-v1.js?v=1');
    appendOnce('sky-chart-calculated-points-v1.js?v=2');
    appendOnce('sky-chart-wheel-special-points-final-v1.js?v=1');
    schedule();
    window.addEventListener('relphi:sky-builder-v4-loaded', schedule);
    window.addEventListener('relphi:extra-points-updated', schedule);
    new MutationObserver(function (records) {
      if (records.some(function (record) {
        return Array.from(record.addedNodes || []).some(function (node) {
          return node.nodeType === Node.ELEMENT_NODE &&
            (node.matches?.(PLACEMENT) || node.querySelector?.(PLACEMENT) || node.matches?.('svg.relphi-bold-inline-glyph'));
        });
      })) schedule();
    }).observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();