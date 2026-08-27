import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const css = fs.readFileSync(path.join(root, 'sky-chart-foundation-v1.css'), 'utf8');
const interactionCss = fs.readFileSync(path.join(root, 'sky-chart-foundation-interactions-v1.css'), 'utf8');
const interactions = fs.readFileSync(path.join(root, 'sky-chart-foundation-interactions-v2.js'), 'utf8');
const relationships = fs.readFileSync(path.join(root, 'sky-chart-relationship-list-layout-v1.js'), 'utf8');
const relationshipCopy = fs.readFileSync(path.join(root, 'sky-chart-relationship-copy-v1.js'), 'utf8');
const coordinatePrecision = fs.readFileSync(path.join(root, 'sky-chart-coordinate-precision-v1.js'), 'utf8');
const intraskyA = fs.readFileSync(path.join(root, 'sky-chart-intrasky-a-v1.js'), 'utf8');
const aspectMultiselect = fs.readFileSync(path.join(root, 'sky-chart-aspect-multiselect-v1.js'), 'utf8');
const cardHitsDrawer = fs.readFileSync(path.join(root, 'sky-chart-card-hits-drawer-v1.js'), 'utf8');
const selectedRelationship = fs.readFileSync(path.join(root, 'sky-chart-selected-relationship-v4.js'), 'utf8');
const selectedRelationshipCss = fs.readFileSync(path.join(root, 'sky-chart-selected-understanding-v1.css'), 'utf8');
const progressive = fs.readFileSync(path.join(root, 'sky-chart-progressive-comparison-v1.js'), 'utf8');
const progressiveCss = fs.readFileSync(path.join(root, 'sky-chart-progressive-comparison-v1.css'), 'utf8');
const progressiveContract = fs.readFileSync(path.join(root, 'sky-chart-progressive-reveal-contract-v1.js'), 'utf8');
const heptagram = fs.readFileSync(path.join(root, 'sky-chart-heptagram-canonical-v1.js'), 'utf8');
const heptagramCss = fs.readFileSync(path.join(root, 'sky-chart-heptagram-canonical-v1.css'), 'utf8');
const registry = fs.readFileSync(path.join(root, 'relphi-glyph-registry-v1.js'), 'utf8');
const component = fs.readFileSync(path.join(root, 'relphi-glyph-component-v1.js'), 'utf8');
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
});

test('relationship glyph slots have one renderer owner and one comparison-wheel nominal scale', () => {
  assert.match(relationships, /const OWNER = 'relationship-layout-v28';/);
  assert.match(relationships, /const GLYPH_DISPLAY_SIZE = 38;/);
  assert.doesNotMatch(relationships, /ASPECT_DISPLAY_SIZE/);
  assert.doesNotMatch(relationships, /SIGN_DISPLAY_SIZE/);
  assert.doesNotMatch(relationships, /part-of-fortune.*scale|scale.*part-of-fortune/i);
  assert.match(relationships, /data-relationship-canonical-host/);
  assert.match(relationships, /slot\.replaceChildren\(host\)/);
  assert.match(relationships, /slot\.dataset\.relationshipGlyphOwner = OWNER/);
  assert.match(relationships, /host\.childElementCount !== 1/);
  assert.match(relationships, /g\.relphi-glyph-bubble/);
  assert.match(relationships, /arts\.length !== 1/);
  assert.match(relationships, /width:\$\{GLYPH_DISPLAY_SIZE\}px!important/);
  assert.match(relationships, /max-width:\$\{GLYPH_DISPLAY_SIZE\}px/);
});

test('relationship rows are three equal centered thirds: placement in sign, aspect, placement in sign', () => {
  assert.match(relationships, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(relationships, /"left aspect right"/);
  assert.match(relationships, /"left orb right"/);
  assert.match(relationships, /grid-template-rows:\$\{GLYPH_DISPLAY_SIZE\}px 12px/);
  assert.match(relationships, /min-height:58px/);
  assert.match(relationships, /\.sky-foundation-relationship-placement--left\{grid-area:left\}/);
  assert.match(relationships, /\.sky-foundation-relationship-placement--right\{grid-area:right\}/);
  assert.match(relationships, /\.sky-foundation-relationship-symbol-pair\{[\s\S]*display:flex;[\s\S]*justify-content:center;[\s\S]*gap:6px/);
  assert.match(relationships, /\.sky-foundation-relationship-copy small\{[\s\S]*text-align:center/);
  assert.doesNotMatch(relationships, /min-height:101px/);
});

test('relationship renderer virtualizes canonical glyph DOM around the relationship viewport', () => {
  assert.match(relationships, /new IntersectionObserver\(entries =>/);
  assert.match(relationships, /\{ root:list, rootMargin:'80px 0px', threshold:0\.01 \}/);
  assert.match(relationships, /row\.dataset\.relationshipInViewport = 'true'/);
  assert.match(relationships, /row\.dataset\.relationshipInViewport = 'false'/);
  assert.match(relationships, /function unpaintRowGlyphs\(row\)/);
  assert.match(relationships, /clearGlyphSlot\(row\.querySelector\('\.sky-foundation-relationship-glyph--aspect'\)\)/);
  assert.match(relationships, /listMutations\.observe\(list, \{ childList:true, subtree:false \}\)/);
  assert.doesNotMatch(relationships, /visibleRows\.unobserve/);
  assert.doesNotMatch(relationships, /observe\(document\.documentElement/);
});

test('relationship structure updates remain idempotent', () => {
  assert.match(relationships, /function ensurePlacementGroup\(row, side\)/);
  assert.match(relationships, /const alreadyComposed =/);
  assert.match(relationships, /if \(!alreadyComposed\) \{/);
  assert.match(relationships, /if \(copy\.parentElement !== group\) group\.appendChild\(copy\)/);
  assert.match(relationships, /const extras = Array\.from\(copy\.childNodes\)\.filter\(node => node !== small\)/);
  assert.match(relationships, /if \(extras\.length\) extras\.forEach\(node => node\.remove\(\)\)/);
  assert.match(relationships, /if \(badge\.textContent !== orbText\) badge\.textContent = orbText/);
});

test('interaction controller creates relationship slots but never paints glyphs', () => {
  assert.match(interactions, /function glyphSlot\(role,label\)/);
  assert.doesNotMatch(interactions, /RelphiCanonicalGlyphState/);
  assert.doesNotMatch(interactions, /placeCanonicalGlyph\(/);
  assert.doesNotMatch(interactions, /createBubble\(/);
  assert.doesNotMatch(interactions, /RelphiGlyphComponent/);
});

test('selected relationship keeps exact mini-wheel geometry, permanent Tarot art, and uncircled identity glyphs', () => {
  assert.doesNotMatch(selectedRelationship, /RelphiCanonicalGlyphState/);
  assert.match(selectedRelationship, /function miniPoint\(degree,radius\)\{const angle=\(norm\(degree\)-180\)\*Math\.PI\/180;/);
  assert.match(selectedRelationship, /data-zodiac-origin="aries-0-at-9"/);
  assert.match(selectedRelationship, /data-left-longitude=/);
  assert.match(selectedRelationship, /data-right-longitude=/);
  assert.match(selectedRelationship, /sky-selected-isolated-aspect/);
  assert.match(selectedRelationship, /data-mini-placement="left"/);
  assert.match(selectedRelationship, /data-mini-placement="right"/);
  assert.match(selectedRelationship, /data-mini-sign=/);
  assert.match(selectedRelationship, /<figure class="correspondence-card-art"><img/);
  assert.match(selectedRelationship, /data-selected-card=/);
  assert.doesNotMatch(selectedRelationship, /card-flip/);
  assert.doesNotMatch(selectedRelationship, /card-back/);
  assert.doesNotMatch(selectedRelationship, /data-flip/);
  assert.doesNotMatch(selectedRelationship, /durationMarkup/);
  assert.doesNotMatch(selectedRelationship, /relationship-mini-wheel-meta/);
  assert.match(selectedRelationshipCss, /\.relationship-visual\{display:grid;grid-template-columns:minmax\(112px,150px\) minmax\(220px,270px\) minmax\(112px,150px\)/);
  assert.match(selectedRelationshipCss, /\.correspondence-card-art img\{[\s\S]*aspect-ratio:352\/600/);
  assert.match(selectedRelationshipCss, /\.sky-selected-aspect-point>\.relphi-glyph-bubble>circle\{opacity:0!important\}/);
  assert.doesNotMatch(selectedRelationshipCss, /\.card-back/);
  assert.doesNotMatch(selectedRelationshipCss, /\.card-inner/);
});

test('progressive relationship view is only glyph to name to referent', () => {
  assert.match(progressive, /Progressive symbolic reading: glyph -> name -> referent/);
  assert.match(progressive, /function symbolicReading\(relation\)/);
  assert.match(progressive, /data-progressive-stage="glyph"/);
  assert.match(progressive, /data-progressive-level="name"/);
  assert.match(progressive, /data-progressive-level="meaning"/);
  assert.match(progressive, /Reveal the referent of/);
  assert.match(progressive, /component\.createBubble\(svg,entry\.id,\{radius:19,padding:1,color\}\)/);
  assert.match(progressive, /class="sky-progressive-orb"/);
  assert.doesNotMatch(progressive, /RelphiCanonicalGlyphState/);
  assert.doesNotMatch(progressive, /proseReading/);
  assert.doesNotMatch(progressive, /stelliumDisclosure/);
  assert.doesNotMatch(progressive, /sky-transit-timeline-pending/);
  assert.match(progressiveCss, /\.sky-progressive-symbol-row\{display:grid/);
  assert.match(progressiveCss, /\.sky-progressive-glyph\{display:grid;place-items:center;width:56px;height:56px/);
});

test('progressive reveal contract is event-driven rather than watching the entire document', () => {
  assert.match(progressiveContract, /Progressive reveal: glyph -> name -> referent, event-driven only|Cumulative progressive reveal: glyph -> name -> referent, event-driven only/);
  assert.match(progressiveContract, /relphi:selected-relationship-rendered/);
  assert.match(progressiveContract, /relphi:sky-progressive-symbols-ready/);
  assert.doesNotMatch(progressiveContract, /new MutationObserver/);
  assert.doesNotMatch(progressiveContract, /observe\(document\.body/);
});

test('relationship rows are glyph-first and leave names for progressive reveal', () => {
  assert.match(relationships, /small\.replaceChildren\(document\.createTextNode\(coordinate\)\)/);
  assert.match(relationships, /if \(glyph\.parentElement !== pair\) pair\.appendChild\(glyph\)/);
  assert.match(relationships, /if \(signSlot\.parentElement !== pair\) pair\.appendChild\(signSlot\)/);
  assert.doesNotMatch(relationships, /document\.createTextNode\(` · H\$\{house\}`\)/);
});

test('relationship aspect is the visual hinge and the orb sits directly beneath it without a separate aspect scale', () => {
  assert.match(relationships, /\.sky-foundation-relationship-glyph--aspect\{grid-area:aspect/);
  assert.match(relationships, /\.sky-foundation-relationship-orb\{[\s\S]*grid-area:orb;[\s\S]*justify-self:center;/);
  assert.match(relationships, /if \(badge\.textContent !== orbText\) badge\.textContent = orbText/);
  assert.doesNotMatch(relationships, /badge\.textContent = `Orb /);
});

test('relationship placement signs are canonical glyphs rather than sign-name text', () => {
  assert.match(relationships, /const SIGN_IDS = Object\.freeze\(\['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'\]\)/);
  assert.match(relationships, /signSlot\.className = 'sky-foundation-relationship-sign'/);
  assert.match(relationships, /function ensurePlacementGroup\(row, side\)/);
  assert.match(relationships, /paintGlyph\(leftSign\.signSlot, leftSign\.signId, 'plain', SKY_COLORS\.A/);
  assert.match(relationships, /paintGlyph\(rightSign\.signSlot, rightSign\.signId, 'plain', SKY_COLORS\.B/);
});

test('relationship copying serializes semantic rows with explicit planet-in-sign grammar and one block-level house context', () => {
  assert.match(relationshipCopy, /const PLACEMENT_SYMBOLS=Object\.freeze/);
  assert.match(relationshipCopy, /const SIGN_SYMBOLS=Object\.freeze/);
  assert.match(relationshipCopy, /const ASPECT_SYMBOLS=Object\.freeze/);
  assert.match(relationshipCopy, /function serializeRow\(row\)/);
  assert.match(relationshipCopy, /placementSymbol\(leftId\)\} in \$\{leftSign\} \$\{leftCoordinate\}/);
  assert.match(relationshipCopy, /placementSymbol\(rightId\)\} in \$\{rightSign\} \$\{rightCoordinate\}/);
  assert.match(relationshipCopy, /function copyContext\(\)/);
  assert.match(relationshipCopy, /Sky \$\{selectedIsolation\.sky\} · House \$\{selectedIsolation\.value\}/);
  assert.match(relationshipCopy, /relphi:sky-house-multiselect-changed/);
  assert.match(relationshipCopy, /return context\?`Relationships — \$\{context\}\\n\$\{lines\.join\('\\n'\)\}`:lines\.join\('\\n'\)/);
  assert.match(relationshipCopy, /document\.addEventListener\('copy'/);
  assert.match(relationshipCopy, /range\.intersectsNode\(row\)/);
  assert.match(relationshipCopy, /Copy visible relationships with active filter context/);
  assert.doesNotMatch(relationshipCopy, /sourceOrb|Orb /);
});

test('finite longitude is the coordinate authority across active Sky Chart presentation paths', () => {
  assert.match(coordinatePrecision, /A finite longitude is the coordinate authority/);
  assert.match(coordinatePrecision, /function longitude\(item\)/);
  assert.match(coordinatePrecision, /const value = longitude\(item\)/);
  assert.match(coordinatePrecision, /const signIndex = Math\.floor\(value \/ 30\)/);
  assert.match(coordinatePrecision, /function repairRedundantCoordinateFields\(slot,payload\)/);
  assert.match(coordinatePrecision, /localStorage\.setItem\(KEYS\[slot\], JSON\.stringify\(payload\)\)/);
  assert.match(coordinatePrecision, /function correctRelationships\(mapsA,mapsB\)/);
  assert.match(coordinatePrecision, /small\.dataset\.relationshipCoordinate = left\.text/);
  assert.match(coordinatePrecision, /longitude-authoritative-by-row-sky/);
  assert.match(intraskyA, /function coordinate\(record\)\{const value=norm\(record\.value\)/);
  assert.match(aspectMultiselect, /function coordinate\(record\) \{[\s\S]*const value = norm\(record\.value\);/);
  assert.doesNotMatch(aspectMultiselect, /const explicitSign =/);
  assert.match(cardHitsDrawer, /const signIndex=Math\.floor\(value\/30\)/);
  assert.doesNotMatch(cardHitsDrawer, /explicitSign/);
  assert.doesNotMatch(coordinatePrecision, /new MutationObserver/);
  assert.doesNotMatch(coordinatePrecision, /observe\(document\.documentElement/);
  assert.match(html, /sky-chart-coordinate-precision-v1\.js\?v=5/);
  assert.match(html, /sky-chart-intrasky-a-v1\.js\?v=2/);
  assert.match(html, /sky-chart-aspect-multiselect-v1\.js\?v=4/);
  assert.match(html, /sky-chart-card-hits-drawer-v1\.js\?v=3/);
});

test('Planetary Hours heptagram scales the complete circled master as one unit', () => {
  assert.match(heptagram, /const MASTER_RADIUS = 19;/);
  assert.match(heptagram, /const MASTER_SCALE = DISPLAY_RADIUS \/ MASTER_RADIUS;/);
  assert.match(heptagram, /master\.setAttribute\('transform', `scale\(\$\{MASTER_SCALE\}\)`\)/);
  assert.match(heptagram, /component\.createBubble\(master, entry\.id/);
  assert.match(heptagram, /canonicalGlyphPresentation = 'circled'/);
  assert.match(heptagram, /glyphPresentation = 'circled'/);
});

test('Planetary Hours heptagram keeps day and hour states visibly distinct without altering master glyph geometry', () => {
  assert.match(heptagram, /const DAY_RING_INNER_RADIUS = 23;/);
  assert.match(heptagram, /const DAY_RING_OUTER_RADIUS = 27;/);
  assert.match(heptagram, /if \(state\.day\) addDayRulerHalo\(master, planetColor\)/);
  assert.match(heptagram, /dayRulerRing\(DAY_RING_INNER_RADIUS, color, 'inner'\)/);
  assert.match(heptagram, /dayRulerRing\(DAY_RING_OUTER_RADIUS, color, 'outer'\)/);
  assert.match(heptagram, /color:state\.hour \? '#ffffff' : planetColor/);
  assert.match(heptagram, /fill:state\.hour \? planetColor : '#ffffff'/);
  assert.match(heptagram, /day-and-hour-ruler/);
  assert.match(heptagramCss, /\.sky-ph-day-ruler-ring--inner/);
  assert.match(heptagramCss, /\.sky-ph-day-ruler-ring--outer/);
});

test('Planetary Hours heptagram is glyph-only inside the SVG', () => {
  assert.match(heptagram, /function clearHeptagramWords\(svg\)/);
  assert.match(heptagram, /svg\.querySelectorAll\('text'\)\.forEach\(node => node\.remove\(\)\)/);
  assert.match(heptagram, /wordPresentation = 'glyph-only'/);
  assert.match(heptagramCss, /\.sky-ph-heptagram text\{display:none!important\}/);
});

test('Lilith keeps the explicitly authorized fitted asset treatment', () => {
  assert.match(registry, /\['lilith','Lilith',[^\n]+assets\/planet-glyphs\/lilith\.svg',1\.05,0,0,null,'circle','400'\]/);
  assert.match(component, /entry\.fitMode === 'lilith'/);
});

test('Part of Fortune keeps the explicitly authorized procedural fallback', () => {
  assert.match(registry, /\['part-of-fortune','Part of Fortune',[^\n]+,null,\.92,0,0,'fortune','circle'\]/);
  assert.match(component, /function fortune\(parent, color\)/);
  assert.match(component, /entry\.fallback === 'fortune'/);
});

test('Chart Card Hits explain their evidence instead of acting as relationship filters', () => {
  assert.match(hits, /Card clicks explain accumulated hit evidence; they never filter the Sky Chart/);
  assert.match(hits, /function detailMarkup\(hit\)/);
  assert.match(hits, /aspect relationships are not part of the tally/);
  assert.match(hits, /nothing on the wheel or in Relationships is filtered/);
  assert.doesNotMatch(hits, /function primaryCorrespondence\(/);
  assert.doesNotMatch(hits, /function activateCorrespondence\(/);
});

test('Chart Card Hits never count relationship aspects as activations', () => {
  assert.doesNotMatch(hits, /function addAspectHits\(/);
  assert.doesNotMatch(hits, /addAspectHits\(tally,slot\)/);
  assert.doesNotMatch(hits, /sky-foundation-relationship-row\[data-relation-index\]/);
});

test('Chart Card Hits keep real art while requesting only very low-resolution thumbnails', () => {
  assert.match(hits, /tiny 48x83 WebP thumbnails/);
  assert.match(hits, /const THUMB = Object\.freeze\(\{ width:48, height:83, quality:50 \}\)/);
  assert.match(hits, /function thumbnailFor\(card\)/);
  assert.match(hits, /new URL\('https:\/\/wsrv\.nl\/'\)/);
  assert.match(hits, /thumb\.searchParams\.set\('w', String\(THUMB\.width\)\)/);
  assert.match(hits, /thumb\.searchParams\.set\('h', String\(THUMB\.height\)\)/);
  assert.match(hits, /thumb\.searchParams\.set\('q', String\(THUMB\.quality\)\)/);
  assert.match(hits, /loading="lazy" decoding="async" fetchpriority="low"/);
  assert.match(hits, /section\.dataset\.cardMedia = `thumbnail-\$\{THUMB\.width\}x\$\{THUMB\.height\}`/);
  assert.match(hits, /\.sky-card-hit-art\{[^}]*overflow:visible/);
  assert.match(hits, /\.sky-card-hit-art img\{[^}]*border-radius:\.26rem/);
  assert.doesNotMatch(hits, /src="assets\/tarot\/rws\//);
  assert.doesNotMatch(hits, /new MutationObserver/);
  assert.doesNotMatch(html, /sky-chart-card-image-budget-v1\.js/);
  assert.match(html, /sky-chart-card-hits-v2\.js\?v=10/);
});

test('Chart Card Hit detail remains open until explicit close or another card selection and avoids redundant render events', () => {
  assert.match(hits, /Detail selection is independent from wheel\/relationship clearing and remains open until the user closes it or selects another card/);
  assert.match(hits, /const explicitDegree = Number\(item\?\.degree \?\? item\?\.degrees\)/);
  assert.match(hits, /const explicitMinute = Number\(item\?\.minute \?\? item\?\.minutes\)/);
  assert.doesNotMatch(hits, /clearCardSelection/);
  assert.doesNotMatch(hits, /relphi:sky-foundation-clear-selection/);
  assert.doesNotMatch(hits, /relphi:sky-foundation-rendered/);
  assert.doesNotMatch(hits, /relphi:sky-foundation-interactions-ready/);
  assert.match(hits, /\['relphi:sky-foundation-ready','relphi:sky-heptagram-source-ready'\]/);
});

test('Chart Angles are grouped visually without reordering ledger row identity', () => {
  assert.match(angles, /function renderedAngle\(row\)/);
  assert.match(angles, /row\.querySelector\(`\.relphi-glyph-\$\{angle\.id\}`\)/);
  assert.match(angles, /row\.style\.order = String\(1001 \+ position\)/);
  assert.match(angles, /heading\.style\.order = '1000'/);
  assert.doesNotMatch(angles, /ledger\.appendChild\(match\[1\]\)/);
});

test('glyph fitting keeps the explicitly authorized browser-measured implementation', () => {
  assert.match(component, /node\.getBBox\(\)/);
  assert.match(component, /await new Promise\(resolve => requestAnimationFrame\(resolve\)\)/);
  assert.match(component, /Number\(entry\.scale\) \|\| 1/);
  assert.match(component, /entry\.dx \|\| 0/);
  assert.match(component, /entry\.dy \|\| 0/);
  assert.doesNotMatch(component, /fitMetrics/);
  assert.doesNotMatch(component, /probeBox/);
  assert.doesNotMatch(component, /staticMaster/);
});

test('shared pages and Sky Chart use the same component version', () => {
  assert.match(navloader, /appendScript\('relphi-glyph-component-v1\.js\?v=33'/);
  assert.match(html, /relphi-glyph-component-v1\.js\?v=33/);
});

test('Sky Chart cache keys point at the compact relationship, copy, coordinate, and thumbnail preview', () => {
  assert.match(html, /sky-chart-relationship-list-layout-v1\.js\?v=28/);
  assert.match(html, /sky-chart-relationship-copy-v1\.js\?v=3/);
  assert.match(html, /sky-chart-coordinate-precision-v1\.js\?v=3/);
  assert.match(html, /sky-chart-progressive-comparison-v1\.css\?v=11/);
  assert.match(html, /sky-chart-selected-understanding-v1\.css\?v=8/);
  assert.match(html, /sky-chart-selected-relationship-v4\.js\?v=9/);
  assert.match(html, /sky-chart-progressive-comparison-v1\.js\?v=10/);
  assert.match(html, /sky-chart-progressive-reveal-contract-v1\.js\?v=2/);
  assert.match(html, /sky-chart-heptagram-canonical-v1\.js\?v=14/);
  assert.match(html, /sky-chart-card-hits-v2\.js\?v=10/);
});