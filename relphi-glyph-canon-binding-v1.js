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
    entry.canonicalSource = 'registry-unicode';
  }

  function bindAxis(id, asset, rotation) {
    const entry = registry.get(id);
    if (!entry) throw new Error('Canonical angle entry unavailable: ' + id);
    entry.asset = asset;
    entry.fallback = null;
    entry.fitMode = 'canonical-viewbox';
    entry.scale = 1;
    entry.dx = 0;
    entry.dy = 0;
    entry.canonicalRotation = Number(rotation) || 0;
    entry.canonicalPreserveViewBox = true;
    entry.canonicalSource = asset;
    entry.copyUnicode = '';
  }

  bindUnicode('north-node', '☊');
  bindUnicode('south-node', '☋');

  // The opposite ends of each axis use the same authored master, rotated as an
  // axis-opposite presentation. No substitute lettering or redrawn geometry.
  bindAxis('asc', 'assets/planet-glyphs/ascendant.svg', 0);
  bindAxis('dsc', 'assets/planet-glyphs/ascendant.svg', 180);
  bindAxis('mc', 'assets/planet-glyphs/midheaven.svg', 0);
  bindAxis('ic', 'assets/planet-glyphs/midheaven.svg', 180);
})();
