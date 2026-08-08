import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const css = fs.readFileSync(path.join(root, 'sky-chart-foundation-v1.css'), 'utf8');
const interactionCss = fs.readFileSync(path.join(root, 'sky-chart-foundation-interactions-v1.css'), 'utf8');
const interactions = fs.readFileSync(path.join(root, 'sky-chart-foundation-interactions-v2.js'), 'utf8');
const relationships = fs.readFileSync(path.join(root, 'sky-chart-relationship-list-layout-v1.js'), 'utf8');
const selectedRelationship = fs.readFileSync(path.join(root, 'sky-chart-selected-relationship-v4.js'), 'utf8');
const heptagram = fs.readFileSync(path.join(root, 'sky-chart-heptagram-canonical-v1.js'), 'utf8');
const heptagramCss = fs.readFileSync(path.join(root, 'sky-chart-heptagram-canonical-v1.css'), 'utf8');
const registry = fs.readFileSync(path.join(root, 'relphi-glyph-registry-v1.js'), 'utf8');
const component = fs.readFileSync(path.join(root, 'relphi-glyph-component-v1.js'), 'utf8');
const fortune = fs.readFileSync(path.join(root, 'assets/planet-glyphs/part-of-fortune.svg'), 'utf8');
const angles = fs.readFileSync(path.join(root, 'sky-chart-angle-placements-v1.js'), 'utf8');
const hits = fs.readFileSync(path.join(root, 'sky-chart-card-hits-v2.js'), 'utf8');
const navloader = fs.readFileSync(path.join(root, 'navloader.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'sky-chart.html'), 'utf8');

test('wheel house numbers use the enlarged desktop treatment and shared silver glow', () => {
  assert.match(css, /--sky-silver-glow:drop-shadow/);
  assert.match(css, /\.sky-foundation-house-number\s*\{[\s\S]*font:800 22px\/1 Georgia,serif;[\s\S]*filter:var\(--sky-silver-glow\)/);
  assert.match(css, /\[data-layer="zodiac"\] \.sky-foundation-sign-glyph\s*\{\s*filter:var\(--sky-silver-glow\)/);
  assert.match(css, /#skyFoundationWheelMount \.sky-foundation-house-number\s*\{[\s\S]*font-size:24px;/);
});

test('wheel hover has immediate direct feedback instead of relying only on delayed interaction state', () => {
  assert.match(interactionCss, /transition:opacity \.07s ease-out,filter \.07s ease-out,stroke-width \.07s ease-out/);
  assert.match(interactionCss, /\.sky-foundation-wheel:not\(\.has-isolation\) \.sky-foundation-house-sector:hover/);
  assert.match(interactionCss, /\.sky-foundation-wheel:not\(\.has-isolation\) \.sky-foundation-placement:hover/);
  assert.match(interactionCss, /\.sky-foundation-wheel:not\(\.has-isolation\) \.sky-foundation-aspect:hover/);
  assert.match(interactionCss, /drop-shadow\(0 0 7px rgba\(126,143,164/);
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

test('relationship glyph slots have one renderer owner, one canonical subtree, and one fixed display box', () => {
  assert.match(relationships, /const OWNER = 'relationship-layout-v19';/);
  assert.match(relationships, /const DISPLAY_SIZE = 28;/);
  assert.match(relationships, /data-relationship-canonical-host/);
  assert.match(relationships, /slot\.replaceChildren\(host\)/);
  assert.match(relationships, /slot\.dataset\.relationshipGlyphOwner = OWNER/);
  assert.match(relationships, /host\.childElementCount !== 1/);
  assert.match(relationships, /g\.relphi-glyph-bubble/);
  assert.match(relationships, /arts\.length !== 1/);
  assert.match(relationships, /relphi-glyph-' \+ entry\.id/);
  assert.match(relationships, /width:\$\{DISPLAY_SIZE\}px!important/);
  assert.match(relationships, /height:\$\{DISPLAY_SIZE\}px!important/);
  assert.match(relationships, /record\.target instanceof Element \? record\.target\.closest\('\.sky-foundation-relationship-row'\)/);
});

test('interaction controller creates relationship slots but never paints glyphs', () => {
  assert.match(interactions, /function glyphSlot\(role,label\)/);
  assert.doesNotMatch(interactions, /RelphiCanonicalGlyphState/);
  assert.doesNotMatch(interactions, /placeCanonicalGlyph\(/);
  assert.doesNotMatch(interactions, /createBubble\(/);
  assert.doesNotMatch(interactions, /RelphiGlyphComponent/);
});

test('selected relationship tokens use the same shared component method', () => {
  assert.doesNotMatch(selectedRelationship, /RelphiCanonicalGlyphState/);
  assert.match(selectedRelationship, /window\.RelphiGlyphComponent/);
  assert.match(selectedRelationship, /component\.createBubble\(svg,entry\.id,\{radius:19,padding:1,color\}\)/);
  assert.match(selectedRelationship, /svg\.setAttribute\('viewBox','-32 -32 64 64'\)/);
});

test('relationship labels stay paired with their own glyph slots', () => {
  assert.match(relationships, /relationship-copy:nth-child\(2\)\{grid-area:left-copy\}/);
  assert.match(relationships, /relationship-copy:nth-child\(5\)\{grid-area:right-copy\}/);
  assert.doesNotMatch(relationships, /relationship-copy:nth-of-type/);
});

test('relationship Orb badge is centered directly beneath the aspect glyph', () => {
  assert.match(relationships, /"left-glyph left-copy aspect right-glyph right-copy"/);
  assert.match(relationships, /"\. \. orb \. \."/);
  assert.match(relationships, /\.sky-foundation-relationship-glyph--aspect\{grid-area:aspect;justify-self:center;align-self:end\}/);
  assert.match(relationships, /\.sky-foundation-relationship-orb\{[\s\S]*grid-area:orb;[\s\S]*justify-self:center;/);
});

test('relationship placement signs are canonical glyphs rather than sign-name text', () => {
  assert.match(relationships, /const SIGN_IDS = Object\.freeze\(\['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'\]\)/);
  assert.match(relationships, /className = 'sky-foundation-relationship-sign'/);
  assert.match(relationships, /paintGlyph\(signSlot, signId, 'plain', color, signName\)/);
  assert.match(relationships, /ensureSignGlyph\(row, 'left', SKY_COLORS\.A\)/);
  assert.match(relationships, /ensureSignGlyph\(row, 'right', SKY_COLORS\.B\)/);
  assert.match(relationships, /small\.replaceChildren\(/);
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

test('Planetary Hours heptagram keeps day and hour states visibly distinct without altering master glyph geometry', () => {
  assert.match(heptagram, /const DAY_RING_INNER_RADIUS = 23;/);
  assert.match(heptagram, /const DAY_RING_OUTER_RADIUS = 27;/);
  assert.match(heptagram, /if \(state\.day\) addDayRulerHalo\(master, planetColor\)/);
  assert.match(heptagram, /dayRulerRing\(DAY_RING_INNER_RADIUS, color, 'inner'\)/);
  assert.match(heptagram, /dayRulerRing\(DAY_RING_OUTER_RADIUS, color, 'outer'\)/);
  assert.match(heptagram, /color:state\.hour \? '#ffffff' : planetColor/);
  assert.match(heptagram, /fill:state\.hour \? planetColor : '#ffffff'/);
  assert.match(heptagram, /bubble\.circle\.setAttribute\('stroke', planetColor\)/);
  assert.match(heptagram, /day-and-hour-ruler/);
  assert.match(heptagram, /day-double-ring-hour-fill/);
  assert.match(heptagramCss, /\.sky-ph-day-ruler-ring--inner/);
  assert.match(heptagramCss, /\.sky-ph-day-ruler-ring--outer/);
  assert.match(heptagramCss, /\.sky-ph-planet\.is-hour-ruler \.relphi-glyph-bubble>circle/);
  assert.match(heptagramCss, /\.sky-ph-planet\.is-day-ruler\.is-hour-ruler \.sky-ph-day-ruler-ring--outer/);
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

test('dynamic SVG glyph fitting is identity-stable even inside hidden relationship rows', () => {
  assert.match(component, /const fitMetrics = new Map\(\);/);
  assert.match(component, /const cached = fitMetrics\.get\(entry\.id\);/);
  assert.match(component, /const box = mountedBox\(node\) \|\| probeBox\(node\);/);
  assert.match(component, /probe\.dataset\.relphiGlyphMeasureProbe = 'true';/);
  assert.match(component, /fitMetrics\.set\(entry\.id, metrics\);/);
  assert.match(component, /node\.dataset\.fitMetricsSource = 'identity-cache';/);
  assert.match(component, /const fitted = fit\(art, radius, padding, entry, bubbleStrokeWidth\);/);
  assert.match(component, /if \(fitted\) art\.style\.visibility = '';/);
  assert.doesNotMatch(component, /if \(needsFittedReveal\) art\.style\.visibility = '';/);
});

test('shared pages and Sky Chart use the same component version', () => {
  assert.match(navloader, /appendScript\('relphi-glyph-component-v1\.js\?v=32'/);
  assert.match(html, /relphi-glyph-component-v1\.js\?v=32/);
});

test('Sky Chart cache keys point at the corrected consumers', () => {
  assert.match(html, /navloader\.js\?v=54/);
  assert.match(html, /relphi-glyph-registry-v1\.js\?v=28/);
  assert.match(html, /relphi-glyph-component-v1\.js\?v=32/);
  assert.match(html, /sky-chart-foundation-v1\.css\?v=8/);
  assert.match(html, /sky-chart-foundation-interactions-v1\.css\?v=2/);
  assert.match(html, /sky-chart-foundation-interactions-v2\.js\?v=9/);
  assert.match(html, /sky-chart-angle-placements-v1\.js\?v=6/);
  assert.match(html, /sky-chart-relationship-list-layout-v1\.js\?v=19/);
  assert.match(html, /sky-chart-selected-relationship-v4\.js\?v=4/);
  assert.match(html, /sky-chart-heptagram-canonical-v1\.css\?v=8/);
  assert.match(html, /sky-chart-heptagram-canonical-v1\.js\?v=13/);
  assert.match(html, /sky-chart-card-hits-v2\.js\?v=3/);
});