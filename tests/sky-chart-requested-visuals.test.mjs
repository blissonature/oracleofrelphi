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
const selectedRelationshipCss = fs.readFileSync(path.join(root, 'sky-chart-selected-understanding-v1.css'), 'utf8');
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

test('relationship glyph slots have one renderer owner, one canonical subtree, and one enlarged display scale', () => {
  assert.match(relationships, /const OWNER = 'relationship-layout-v23';/);
  assert.match(relationships, /const GLYPH_DISPLAY_SIZE = 34;/);
  assert.doesNotMatch(relationships, /ASPECT_DISPLAY_SIZE/);
  assert.doesNotMatch(relationships, /SIGN_DISPLAY_SIZE/);
  assert.match(relationships, /data-relationship-canonical-host/);
  assert.match(relationships, /slot\.replaceChildren\(host\)/);
  assert.match(relationships, /slot\.dataset\.relationshipGlyphOwner = OWNER/);
  assert.match(relationships, /host\.childElementCount !== 1/);
  assert.match(relationships, /g\.relphi-glyph-bubble/);
  assert.match(relationships, /arts\.length !== 1/);
  assert.match(relationships, /relphi-glyph-' \+ entry\.id/);
  assert.match(relationships, /\.sky-foundation-relationship-glyph,\s*\n\s*\.sky-foundation-relationship-sign\{/);
  assert.match(relationships, /width:\$\{GLYPH_DISPLAY_SIZE\}px!important/);
  assert.match(relationships, /align-items:center;/);
  assert.match(relationships, /record\.target instanceof Element \? record\.target\.closest\('\.sky-foundation-relationship-row'\)/);
});

test('relationship renderer is idempotent under its own MutationObserver', () => {
  assert.match(relationships, /const alreadyComposed =/);
  assert.match(relationships, /if \(!alreadyComposed\) \{/);
  assert.match(relationships, /const extras = Array\.from\(copy\.childNodes\)\.filter\(node => node !== small\)/);
  assert.match(relationships, /if \(extras\.length\) extras\.forEach\(node => node\.remove\(\)\)/);
  assert.match(relationships, /const orbText = `\$\{orb\.toFixed\(2\)\}°`/);
  assert.match(relationships, /if \(badge\.textContent !== orbText\) badge\.textContent = orbText/);
});

test('interaction controller creates relationship slots but never paints glyphs', () => {
  assert.match(interactions, /function glyphSlot\(role,label\)/);
  assert.doesNotMatch(interactions, /RelphiCanonicalGlyphState/);
  assert.doesNotMatch(interactions, /placeCanonicalGlyph\(/);
  assert.doesNotMatch(interactions, /createBubble\(/);
  assert.doesNotMatch(interactions, /RelphiGlyphComponent/);
});

test('selected relationship inspection restores the exact isolated zodiac wheel and keeps Tarot secondary', () => {
  assert.doesNotMatch(selectedRelationship, /RelphiCanonicalGlyphState/);
  assert.match(selectedRelationship, /window\.RelphiGlyphComponent/);
  assert.match(selectedRelationship, /component\.createBubble\(svg,entry\.id,\{radius:19,padding:1,color\}\)/);
  assert.match(selectedRelationship, /svg\.setAttribute\('viewBox','-32 -32 64 64'\)/);
  assert.match(selectedRelationship, /Exact zodiac geometry · Tarot correspondence below/);
  assert.match(selectedRelationship, /function miniPoint\(degree,radius\)\{const angle=\(norm\(degree\)-180\)\*Math\.PI\/180;/);
  assert.match(selectedRelationship, /data-zodiac-origin="aries-0-at-9"/);
  assert.match(selectedRelationship, /data-left-longitude=/);
  assert.match(selectedRelationship, /data-right-longitude=/);
  assert.match(selectedRelationship, /sky-selected-isolated-aspect/);
  assert.match(selectedRelationship, /data-mini-placement="left"/);
  assert.match(selectedRelationship, /data-mini-placement="right"/);
  assert.match(selectedRelationship, /data-mini-sign=/);
  assert.match(selectedRelationship, /renderSvgGroup\(node,node\.dataset\.miniSign,'#514b45','plain',8\.4,1\.5\)/);
  assert.match(selectedRelationship, /Decan correspondences/);
  assert.match(selectedRelationshipCss, /\.relationship-hero\{display:grid;grid-template-columns:minmax\(0,1fr\) minmax\(210px,230px\) minmax\(0,1fr\)/);
  assert.match(selectedRelationshipCss, /\.relationship-mini-wheel \.sky-selected-isolated-aspect\{stroke-width:4\.2/);
  assert.match(selectedRelationshipCss, /\.understanding-cards\{display:grid;grid-template-columns:repeat\(2,minmax\(0,170px\)\)/);
});

test('relationship rows are glyph-first and leave names for progressive reveal', () => {
  assert.match(relationships, /small\.replaceChildren\(document\.createTextNode\(coordinate\), signSlot\)/);
  assert.match(relationships, /const extras = Array\.from\(copy\.childNodes\)\.filter\(node => node !== small\)/);
  assert.match(relationships, /if \(extras\.length\) extras\.forEach\(node => node\.remove\(\)\)/);
  assert.doesNotMatch(relationships, /document\.createTextNode\(` · H\$\{house\}`\)/);
});

test('relationship aspect is the visual hinge and the orb sits directly beneath it without a separate aspect scale', () => {
  assert.match(relationships, /"left-glyph left-copy aspect right-glyph right-copy"/);
  assert.match(relationships, /"\. \. orb \. \."/);
  assert.match(relationships, /\.sky-foundation-relationship-glyph--aspect\{grid-area:aspect\}/);
  assert.match(relationships, /\.sky-foundation-relationship-orb\{[\s\S]*grid-area:orb;[\s\S]*justify-self:center;/);
  assert.match(relationships, /const orbText = `\$\{orb\.toFixed\(2\)\}°`/);
  assert.doesNotMatch(relationships, /badge\.textContent = `Orb /);
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

test('Planetary Hours heptagram is glyph-only inside the SVG', () => {
  assert.match(heptagram, /function clearHeptagramWords\(svg\)/);
  assert.match(heptagram, /svg\.querySelectorAll\('text'\)\.forEach\(node => node\.remove\(\)\)/);
  assert.match(heptagram, /wordPresentation = 'glyph-only'/);
  assert.match(heptagramCss, /\.sky-ph-heptagram text\{display:none!important\}/);
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

test('Chart Card Hits explain their evidence instead of acting as relationship filters', () => {
  assert.match(hits, /Card clicks explain the accumulated hit evidence; they never filter the Sky Chart/);
  assert.match(hits, /function detailMarkup\(hit\)/);
  assert.match(hits, /sky-card-hit-detail-note/);
  assert.match(hits, /aspect relationships are not part of the tally/);
  assert.match(hits, /nothing on the wheel or in Relationships is filtered/);
  assert.match(hits, /hit\.reasons\.map\(reason =>/);
  assert.doesNotMatch(hits, /function primaryCorrespondence\(/);
  assert.doesNotMatch(hits, /function activateCorrespondence\(/);
  assert.doesNotMatch(hits, /dispatchEvent\(new MouseEvent\('click'/);
});

test('Chart Card Hits never count relationship aspects as activations', () => {
  assert.doesNotMatch(hits, /function addAspectHits\(/);
  assert.doesNotMatch(hits, /addAspectHits\(tally,slot\)/);
  assert.doesNotMatch(hits, /sky-foundation-relationship-row\[data-relation-index\]/);
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

test('Sky Chart cache keys point at the responsive glyph-first relationship preview', () => {
  assert.match(html, /navloader\.js\?v=54/);
  assert.match(html, /relphi-glyph-registry-v1\.js\?v=28/);
  assert.match(html, /relphi-glyph-component-v1\.js\?v=32/);
  assert.match(html, /sky-chart-foundation-v1\.css\?v=8/);
  assert.match(html, /sky-chart-foundation-interactions-v1\.css\?v=2/);
  assert.match(html, /sky-chart-foundation-interactions-v2\.js\?v=9/);
  assert.match(html, /sky-chart-angle-placements-v1\.js\?v=6/);
  assert.match(html, /sky-chart-relationship-list-layout-v1\.js\?v=23/);
  assert.match(html, /sky-chart-selected-understanding-v1\.css\?v=6/);
  assert.match(html, /sky-chart-selected-relationship-v4\.js\?v=6/);
  assert.match(html, /sky-chart-heptagram-canonical-v1\.css\?v=9/);
  assert.match(html, /sky-chart-heptagram-canonical-v1\.js\?v=14/);
  assert.match(html, /sky-chart-card-hits-v2\.js\?v=6/);
});
