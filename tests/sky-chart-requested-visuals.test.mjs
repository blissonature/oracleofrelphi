import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const css = fs.readFileSync(path.join(root, 'sky-chart-foundation-v1.css'), 'utf8');
const relationships = fs.readFileSync(path.join(root, 'sky-chart-relationship-list-layout-v1.js'), 'utf8');
const heptagram = fs.readFileSync(path.join(root, 'sky-chart-heptagram-canonical-v1.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'sky-chart.html'), 'utf8');

test('wheel house numbers use the enlarged desktop treatment', () => {
  assert.match(css, /\.sky-foundation-house-number\s*\{[\s\S]*font:800 22px\/1 Georgia,serif;/);
  assert.match(css, /#skyFoundationWheelMount \.sky-foundation-house-number\s*\{[\s\S]*font-size:24px;/);
});

test('relationship rows render canonical placement and aspect glyphs', () => {
  assert.match(relationships, /window\.RelphiGlyphComponent/);
  assert.match(relationships, /component\.createBubble\(host, entry\.id/);
  assert.match(relationships, /component\.draw\(host, entry\.id/);
  assert.match(relationships, /sky-foundation-relationship-glyph--left/);
  assert.match(relationships, /sky-foundation-relationship-glyph--aspect/);
  assert.match(relationships, /sky-foundation-relationship-glyph--right/);
});

test('Planetary Hours heptagram requests circled canonical glyphs', () => {
  assert.match(heptagram, /component\.createBubble\(mount, entry\.id/);
  assert.match(heptagram, /canonicalGlyphPresentation = 'circled'/);
  assert.match(heptagram, /glyphPresentation = 'circled'/);
  assert.doesNotMatch(heptagram, /await component\.draw\(mount, entry\.id/);
});

test('Sky Chart cache keys point at the updated visual consumers', () => {
  assert.match(html, /sky-chart-foundation-v1\.css\?v=7/);
  assert.match(html, /sky-chart-relationship-list-layout-v1\.js\?v=15/);
  assert.match(html, /sky-chart-heptagram-canonical-v1\.js\?v=10/);
});
