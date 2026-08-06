import assert from 'node:assert/strict';
import fs from 'node:fs';

const controller = fs.readFileSync('sky-chart-foundation-interactions-v2.js', 'utf8');
const layout = fs.readFileSync('sky-chart-relationship-list-layout-v1.js', 'utf8');
const selected = fs.readFileSync('sky-chart-selected-relationship-v4.js', 'utf8');
const selectedCss = fs.readFileSync('sky-chart-selected-understanding-v1.css', 'utf8');
const progressive = fs.readFileSync('sky-chart-progressive-comparison-v1.js', 'utf8');
const progressiveCss = fs.readFileSync('sky-chart-progressive-comparison-v1.css', 'utf8');
const signHouseCorrection = fs.readFileSync('sky-chart-sign-house-and-aspect-isolate-v1.js', 'utf8');
const state = fs.readFileSync('relphi-canonical-glyph-state-v1.js', 'utf8');

const relationshipSources = [
  ['Relationship list', controller],
  ['Selected relationship', selected],
  ['Progressive relationship', progressive],
  ['Sign and house correction', signHouseCorrection]
];
const forbiddenRelationshipCode = [
  ['createBubble', /createBubble/],
  ['component draw', /RelphiGlyphComponent|\.draw\s*\(/],
  ['SVG construction', /createElementNS\s*\(/],
  ['relationship makeSvg helper', /function\s+makeSvg/],
  ['relationship radius option', /radius\s*:/],
  ['relationship padding option', /padding\s*:/],
  ['visible-bounds fitting', /getBBox\s*\(/],
  ['custom relationship glyph viewBox', /viewBox\s*=|setAttribute\s*\(\s*['"]viewBox['"]|-20\s+-20\s+40\s+40|-28\s+-28\s+56\s+56/],
  ['relationship fallback set', /APPROVED_FALLBACKS/],
  ['procedural circle creation', /createElement(?:NS)?\s*\([^\n]*['"]circle['"]/],
  ['circle visibility manipulation', /circle\.style|circle\.setAttribute/],
  ['relationship SVG identity inference', /querySelectorAll\s*\(\s*['"]svg['"]\s*\)/]
];

for (const [surface, source] of relationshipSources) {
  for (const [label, pattern] of forbiddenRelationshipCode) {
    assert.equal(pattern.test(source), false, `${surface} still contains ${label}.`);
  }
}

assert.match(controller, /RelphiCanonicalGlyphState/);
assert.match(controller, /glyphSlot\('left'/);
assert.match(controller, /glyphSlot\('aspect'/);
assert.match(controller, /glyphSlot\('right'/);
assert.match(controller, /relation\.left\.id,'circled'/);
assert.match(controller, /relation\.aspect\.id,'plain'/);
assert.match(controller, /relation\.right\.id,'circled'/);
assert.match(controller, /dataset\.glyphUnavailable/);

assert.match(selected, /RelphiCanonicalGlyphState/);
assert.match(selected, /r\.left\.id,COLORS\.A,'circled'/);
assert.match(selected, /r\.aspect\.id,r\.aspect\.color,'plain'/);
assert.match(selected, /r\.right\.id,COLORS\.B,'circled'/);
assert.match(selected, /class="token-glyph" data-glyph=/);

assert.match(progressive, /RelphiCanonicalGlyphState/);
assert.match(progressive, /sky-progressive-canonical-slot/);
assert.match(progressive, /state:'plain'/);
assert.equal(/<svg/.test(progressive), false, 'Progressive relationship may not author SVG hosts.');

assert.equal(/selectedRelationData|replaceMiddleAspect|drawBubble|data-isolate/.test(signHouseCorrection), false, 'Sign and house correction may not render selected-relationship glyphs.');
assert.match(signHouseCorrection, /contains no glyph or selected-relationship rendering/);

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

assert.equal(/\.token-glyph\s+svg|\.token-glyph,\.token-glyph\s+svg/.test(selectedCss), false, 'Selected relationship CSS may not style canonical SVG descendants.');
assert.match(selectedCss, /\.token-glyph>\.relphi-canonical-glyph-state\{width:100%!important;height:100%!important\}/);
assert.equal(/sky-progressive-glyph\s+svg|sky-progressive-glyph>svg/.test(progressiveCss), false, 'Progressive relationship CSS may not style canonical SVG descendants.');
assert.equal(/data-canonical-ledger-glyph/.test(progressiveCss), false, 'Progressive CSS may not clip or repair ledger glyphs.');
assert.match(progressiveCss, /sky-progressive-canonical-slot>\.relphi-canonical-glyph-state\{width:100%!important;height:100%!important\}/);

assert.match(state, /EXPECTED_GLYPH_COUNT\s*=\s*93/);
assert.match(state, /glyphs-unified-preview\.html/);
assert.match(state, /preserve its authored viewBox/);
assert.equal(/getBBox\s*\(/.test(state), false, 'State placer may not fit visible bounds.');
assert.equal(/createElement(?:NS)?\s*\([^\n]*['"]circle['"]/.test(state), false, 'State placer may not create circles.');
assert.equal(/setAttribute\s*\(\s*['"]viewBox['"]/.test(state), false, 'State placer may not rewrite viewBoxes.');

console.log('Relationship canonical state contract passed.');
