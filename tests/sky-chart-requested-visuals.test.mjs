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
const fortune = fs.readFileSync(path.join(root, 'assets/planet-glyphs/part-of-fortune.svg'), 'utf8');
const angles = fs.readFileSync(path.join(root, 'sky-chart-angle-placements-v1.js'), 'utf8');
const hits = fs.readFileSync(path.join(root, 'sky-chart-card-hits-v2.js'), 'utf8');
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

test('Part of Fortune is a full-sized static master rather than a procedural insert', () => {
  assert.match(registry, /\['part-of-fortune','Part of Fortune',[^\n]+assets\/planet-glyphs\/part-of-fortune\.svg',1,0,0,null,'static-master'\]/);
  assert.match(fortune, /<circle cx="50" cy="50" r="20"/);
  assert.match(fortune, /stroke-width="3\.3"/);
  assert.doesNotMatch(component, /entry\.id === 'part-of-fortune'/);
  assert.doesNotMatch(component, /function fortune\(/);
});

test('Chart Hit cards isolate their primary chart correspondence instead of opening static detail text', () => {
  assert.match(hits, /judgement:Object\.freeze\(\{kind:'placement',value:'pluto',label:'Pluto'\}\)/);
  assert.match(hits, /kind:'sign',value:SIGNS\.indexOf\(sign\),label:sign/);
  assert.match(hits, /dispatchEvent\(new MouseEvent\('click'/);
  assert.doesNotMatch(hits, /sky-card-hit-detail/);
  assert.doesNotMatch(hits, /detailMarkup/);
});

test('Chart Card Hits remain invariant under relationship filtering and isolation', () => {
  assert.match(hits, /Chart Card Hits describe the sky itself/);
  assert.match(hits, /document\.querySelectorAll\('\.sky-foundation-relationship-row\[data-relation-index\]'\)\.forEach/);
  assert.doesNotMatch(hits, /function rowIncluded\(/);
  assert.doesNotMatch(hits, /if \(!rowIncluded\(row\)\) return/);
});

test('Chart Angles are grouped visually without reordering ledger row identity', () => {
  assert.match(angles, /function renderedAngle\(row\)/);
  assert.match(angles, /row\.querySelector\(`\.relphi-glyph-\$\{angle\.id\}`\)/);
  assert.match(angles, /row\.style\.order = String\(1001 \+ position\)/);
  assert.match(angles, /heading\.style\.order = '1000'/);
  assert.doesNotMatch(angles, /ledger\.appendChild\(match\[1\]\)/);
});

test('dynamic SVG glyphs stay invisible until their fitted transform exists', () => {
  assert.match(component, /art\.style\.visibility = 'hidden';/);
  assert.match(component, /needsFittedReveal = true;/);
  assert.match(component, /fit\(art, radius, padding, entry, bubbleStrokeWidth\);\n    if \(needsFittedReveal\) art\.style\.visibility = '';/);
});

test('Sky Chart cache keys point at the corrected consumers', () => {
  assert.match(html, /relphi-glyph-registry-v1\.js\?v=28/);
  assert.match(html, /relphi-glyph-component-v1\.js\?v=32/);
  assert.match(html, /sky-chart-foundation-v1\.css\?v=7/);
  assert.match(html, /sky-chart-angle-placements-v1\.js\?v=6/);
  assert.match(html, /sky-chart-relationship-list-layout-v1\.js\?v=16/);
  assert.match(html, /sky-chart-heptagram-canonical-v1\.js\?v=11/);
  assert.match(html, /sky-chart-card-hits-v2\.js\?v=3/);
});