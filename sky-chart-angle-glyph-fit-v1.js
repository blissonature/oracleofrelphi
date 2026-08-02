// Fit outlined Asc., Desc., MC, and IC artwork inside the canonical glyph bubble.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyAngleGlyphFitV1) return;
  window.__relphiSkyAngleGlyphFitV1 = true;

  const registry = window.RelphiGlyphRegistry;
  if (!registry) return;

  ['asc','dsc','mc','ic'].forEach(id => {
    const entry = registry.get(id);
    if (!entry) return;
    entry.fitMode = 'box';
    entry.scale = 0.9;
    entry.dx = 0;
    entry.dy = 0;
  });
})();
