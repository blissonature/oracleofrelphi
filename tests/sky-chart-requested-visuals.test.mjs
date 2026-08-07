import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const css = fs.readFileSync(path.join(root, 'sky-chart-foundation-v1.css'), 'utf8');
const relationships = fs.readFileSync(path.join(root, 'sky-chart-relationship-list-layout-v1.js'), 'utf8');
const heptagram = fs.readFileSync(path.join(root, 'sky-chart-heptagram-canonical-v1.js'), 'utf8');
const registry = fs.readFileSync(path.join(root, 'relphi-glyph-registry-v1.js'), 'utf8');
const component = fs.readFileSync(path.join(root, 'relphi-glyph-component-v1.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'sky-chart.html'), 'utf8');

test('wheel house numbers use the enlarged desktop treatment', () => {
  assert.match(css, /\.sky-foundation-house-number\s*\{[\s\S]*font:800 22px\/1 Georgia,serif;/);
  assert.match(css, /#skyFoundationWheelMount \.sky-foundation-house-number\s*\{[\s\S]*font-size:24px;/);
});

test('relationship glyphs preserve the exact uncircled Master Glyph List artboard', () => {
  assert.match(relationships, /const MASTER_VIEWBOX = '-32 -32 64 64';/);
  assert.match(relationships, /const MASTER_RADIUS = 19;/);
  assert.match(relationships, /host\.setAttribute\('viewBox', MASTER_VIEWBOX\)/);
  assert.match(relationships, /component\.createBubble\(host, entry\.id/);
  assert.match(relationships, /bubble\.circle\.style\.opacity = '0'/);
  assert.doesNotMatch(relationships, /-16 -16 32 32/);
  assert.doesNotMatch(relationships, /radius:13/);
  assert.match(relationships, /sky-foundation-relationship-glyph--left'\), row\.dataset\.leftPlacement, 'plain'/);
  assert.match(relationships, /sky-foundation-relationship-glyph--aspect'\), aspect, 'plain'/);
  assert.match(relationships, /sky-foundation-relationship-glyph--right'\), row\.dataset\.rightPlacement, 'plain'/);
});

test('relationship labels stay paired with their own glyph slots', () => {
  assert.match(relationships, /relationship-copy:nth-child\(2\)\{grid-area:left-copy\}/);
  assert.match(relationships, /relationship-copy:nth-child\(5\)\{grid-area:right-copy\}/);
  assert.doesNotMatch(relationships, /relationship-copy:nth-of-type/);
});

test('Planetary Hours heptagram scales the complete circled master as one unit', () => {
  assert.match(heptagram, /const MASTER_RADIUS = 19;/);
  assert.match(heptagram, /const MASTER_SCALE = DISPLAY_RADIUS \/ MASTER_RADIUS;/);
  assert.match(heptagram, /master\.setAttribute\('transform', `scale\(\$\{MASTER_SCALE\}\)`\)/);
  assert.match(heptagram, /component\.createBubble\(master, entry\.id/);
  assert.match(heptagram, /canonicalGlyphPresentation = 'circled'/);
  assert.match(heptagram, /glyphPresentation = 'circled'/);
  assert.doesNotMatch(heptagram, /radius:17/);
});

test('Lilith uses the same static-master path as the planetary SVG masters', () => {
  assert.match(registry, /\['lilith','Lilith',[^\n]+,1,0,0,null,'static-master'\]/);
  assert.doesNotMatch(component, /entry\.id === 'lilith'/);
  assert.doesNotMatch(component, /entry\.fitMode === 'lilith'/);
});

test('Sky Chart cache keys point at the corrected glyph consumers', () => {
  assert.match(html, /relphi-glyph-registry-v1\.js\?v=27/);
  assert.match(html, /relphi-glyph-component-v1\.js\?v=30/);
  assert.match(html, /sky-chart-foundation-v1\.css\?v=7/);
  assert.match(html, /sky-chart-relationship-list-layout-v1\.js\?v=16/);
  assert.match(html, /sky-chart-heptagram-canonical-v1\.js\?v=11/);
});