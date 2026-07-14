// Emergency rollback: the cross-tool glyph bubble experiment is disabled.
// Keep the previously stable wheel renderer and remove only nodes created by
// the experimental treatment.
(function () {
  'use strict';

  function restoreStableWheel() {
    const style = document.getElementById('relphi-glyph-bubble-style');
    if (style) style.remove();

    document.querySelectorAll('image.relphi-bubble-glyph-image').forEach(function (node) {
      node.remove();
    });

    document.querySelectorAll('.ph-current-wheel .planet-label, .chart-wheel-marker-glyph, .mini-wheel-marker-glyph').forEach(function (node) {
      node.style.removeProperty('opacity');
      node.style.removeProperty('font-size');
      node.removeAttribute('visibility');
    });
  }

  restoreStableWheel();
  window.RelphiGlyphBubbles = { disabled: true, restore: restoreStableWheel };
})();
