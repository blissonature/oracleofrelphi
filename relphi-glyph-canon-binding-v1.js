// Sky Chart bindings to the authored Relphi glyph canon.
(function () {
  'use strict';
  if (window.__relphiGlyphCanonBindingV1) return;
  const registry = window.RelphiGlyphRegistry;
  if (!registry) throw new Error('Relphi glyph registry must load before canon bindings.');
  window.__relphiGlyphCanonBindingV1 = true;

  function bindUnicode(id, character) {
    const entry = registry.get(id);
    if (!entry) throw new Error('Canonical glyph entry unavailable: ' + id);
    entry.canonicalUnicode = character;
    entry.copyUnicode = character;
    entry.canonicalSource = `unicode:${character}`;
  }

  function bindAuthoredAsset(id, asset) {
    const entry = registry.get(id);
    if (!entry) throw new Error('Canonical authored entry unavailable: ' + id);
    entry.asset = asset;
    entry.fallback = null;
    entry.fitMode = 'canonical-viewbox';
    entry.scale = 1;
    entry.dx = 0;
    entry.dy = 0;
    entry.canonicalPreserveViewBox = true;
    entry.canonicalRotation = 0;
    entry.canonicalSource = asset;
    entry.copyUnicode = '';
  }

  bindUnicode('north-node', '☊');
  bindUnicode('south-node', '☋');

  // Four independent, upright, authored angle glyphs. Never synthesize one
  // angle from another and never replace them with browser text.
  bindAuthoredAsset('asc', 'assets/angle-glyphs/asc.svg');
  bindAuthoredAsset('dsc', 'assets/angle-glyphs/dsc.svg');
  bindAuthoredAsset('mc', 'assets/angle-glyphs/mc.svg');
  bindAuthoredAsset('ic', 'assets/angle-glyphs/ic.svg');

  // Use the current authored connected-trident asset directly in the atomic
  // construction stage. No late Neptune wrapper may redraw or refit it.
  bindAuthoredAsset('neptune', 'assets/planet-glyphs/neptune.svg');
})();
