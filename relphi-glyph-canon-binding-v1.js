// Bind consuming tools to the exact Master Glyph List contract.
(function () {
  'use strict';
  if (window.__relphiGlyphCanonBindingV4) return;

  const registry = window.RelphiGlyphRegistry;
  if (!registry) throw new Error('Relphi glyph registry must load before canon bindings.');

  window.__relphiGlyphCanonBindingV1 = true;
  window.__relphiGlyphCanonBindingV2 = true;
  window.__relphiGlyphCanonBindingV3 = true;
  window.__relphiGlyphCanonBindingV4 = true;

  const MASTER_PAGE = 'glyphs-unified-preview.html';
  const MASTER_STAGE_VIEW_BOX = '-32 -32 64 64';

  registry.entries.forEach(entry => {
    // Do not replace or reinterpret the registry's identity, asset, fallback,
    // fitting mode, scale, offset, weight, or orientation.
    entry.canonicalMasterPage = MASTER_PAGE;
    entry.canonicalCirclePresentation = 'same-master-opacity-toggle';
    entry.canonicalIntentionalWhitespace = true;

    if (entry.asset) {
      // Asset-backed masters always load the one repository file named by the
      // registry. Embedded copies and identity-specific rendering branches are
      // not canonical sources.
      entry.canonicalSource = entry.asset;
      entry.canonicalSourceType = 'registry-asset-file';
      entry.canonicalPreserveViewBox = true;
    } else {
      // Font/symbol entries are the exact component masters displayed by the
      // Master Glyph List. Their 64x64 stage is part of the composition.
      entry.canonicalSource = `${MASTER_PAGE}#${entry.id}`;
      entry.canonicalSourceType = 'master-component-entry';
      entry.canonicalMasterViewBox = MASTER_STAGE_VIEW_BOX;
    }
  });

  const north = registry.get('north-node');
  const south = registry.get('south-node');
  if (north) north.copyUnicode = '☊';
  if (south) south.copyUnicode = '☋';

  const required = Object.freeze(Object.fromEntries(
    ['neptune','asc','dsc','mc','ic','north-node','south-node'].map(id => {
      const entry = registry.get(id);
      if (!entry) throw new Error('Canonical Master Glyph List entry unavailable: ' + id);
      return [id, Object.freeze({
        source:entry.canonicalSource,
        sourceType:entry.canonicalSourceType,
        viewBox:entry.asset ? null : MASTER_STAGE_VIEW_BOX,
        circlePresentation:'same-master-opacity-toggle',
        intentionalWhitespace:true
      })];
    })
  ));

  window.RelphiCanonicalMasterContract = Object.freeze({
    page:MASTER_PAGE,
    stageViewBox:MASTER_STAGE_VIEW_BOX,
    required
  });
})();
