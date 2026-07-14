// Stable fallback for Sky Chart wheel glyphs.
//
// The SVG-path enhancer is intentionally disabled until each source glyph can be
// normalized and mounted inside its own marker without shared transforms or
// asynchronous render races. Keep the original text glyphs visible and remove
// any enhanced path groups left by an earlier render.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const GLYPHS = new Set([
    '☉', '☽', '☿', '♀', '♂', '♃', '♄', '♅', '♆', '♇', '⯓'
  ]);
  let queued = false;

  function restoreTextGlyph(text) {
    if (!text || !GLYPHS.has((text.textContent || '').trim())) return;
    text.removeAttribute('visibility');
    text.style.removeProperty('visibility');
    delete text.dataset.relphiWheelGlyphAligned;
    delete text.dataset.relphiWheelGlyphPending;
  }

  function clean(root) {
    const scope = root && root.querySelectorAll ? root : document;

    scope.querySelectorAll('.relphi-wheel-planet-glyph').forEach(function (group) {
      group.remove();
    });

    scope.querySelectorAll('svg text').forEach(restoreTextGlyph);
    if (root && root.matches && root.matches('svg text')) restoreTextGlyph(root);
  }

  function scheduleClean() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      clean(document);
    });
  }

  function start() {
    clean(document);
    new MutationObserver(scheduleClean).observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  window.RelphiWheelGlyphFallback = { clean: clean };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
