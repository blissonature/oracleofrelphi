import assert from 'node:assert/strict';
import fs from 'node:fs';

const controller = fs.readFileSync('sky-chart-foundation-interactions-v2.js', 'utf8');
const layout = fs.readFileSync('sky-chart-relationship-list-layout-v1.js', 'utf8');
const state = fs.readFileSync('relphi-canonical-glyph-state-v1.js', 'utf8');

const forbiddenController = [
  ['createBubble', /createBubble/],
  ['component draw', /RelphiGlyphComponent|\.draw\s*\(/],
  ['SVG construction', /createElementNS\s*\(/],
  ['relationship makeSvg helper', /function\s+makeSvg/],
  ['relationship radius option', /radius\s*:/],
  ['relationship padding option', /padding\s*:/],
  ['visible-bounds fitting', /getBBox\s*\(/],
  ['custom relationship glyph viewBox', /-20\s+-20\s+40\s+40/],
  ['relationship fallback set', /APPROVED_FALLBACKS/],
  ['procedural circle creation', /createElement(?:NS)?\s*\([^\n]*['"]circle['"]/]
];

for (const [label, pattern] of forbiddenController) {
  assert.equal(pattern.test(controller), false, `Relationships still contains ${label}.`);
}

assert.match(controller, /RelphiCanonicalGlyphState/);
assert.match(controller, /glyphSlot\('left'/);
assert.match(controller, /glyphSlot\('aspect'/);
assert.match(controller, /glyphSlot\('right'/);
assert.match(controller, /relation\.left\.id,'circled'/);
assert.match(controller, /relation\.aspect\.id,'plain'/);
assert.match(controller, /relation\.right\.id,'circled'/);
assert.match(controller, /dataset\.glyphUnavailable/);

const forbiddenLayout = [
  ['SVG descendant styling', />svg|svg>|svg\s*\{/],
  ['inner group styling', />g|g>|g\s*\{/],
  ['paint containment', /contain\s*:\s*paint/],
  ['any clipping', /overflow\s*:\s*hidden/],
  ['glyph transform', /transform\s*:/],
  ['retired stage cleanup', /sky-relationship-(?:canonical|master)/],
  ['retired master dataset cleanup', /relationshipMasterGlyphs/]
];

for (const [label, pattern] of forbiddenLayout) {
  assert.equal(pattern.test(layout), false, `Relationship layout still contains ${label}.`);
}

assert.match(layout, /sky-foundation-relationship-glyph--left/);
assert.match(layout, /sky-foundation-relationship-glyph--aspect/);
assert.match(layout, /sky-foundation-relationship-glyph--right/);
assert.match(layout, /overflow\s*:\s*visible/);

assert.match(state, /EXPECTED_GLYPH_COUNT\s*=\s*93/);
assert.match(state, /glyphs-unified-preview\.html/);
assert.match(state, /preserve its authored viewBox/);
assert.equal(/getBBox\s*\(/.test(state), false, 'State placer may not fit visible bounds.');
assert.equal(/createElement(?:NS)?\s*\([^\n]*['"]circle['"]/.test(state), false, 'State placer may not create circles.');
assert.equal(/setAttribute\s*\(\s*['"]viewBox['"]/.test(state), false, 'State placer may not rewrite viewBoxes.');

console.log('Relationship canonical state contract passed.');
