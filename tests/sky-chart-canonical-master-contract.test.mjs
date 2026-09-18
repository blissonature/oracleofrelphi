import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

for (const script of [
  'tools/check-single-glyph-canon.mjs',
  'tools/check-planet-glyph-hashes.mjs',
  'tools/check-sky-chart-glyph-readiness.mjs'
]) {
  execFileSync(process.execPath, [script], { cwd:root, stdio:'inherit' });
}

const registry = read('relphi-glyph-registry-v1.js');
const component = read('relphi-glyph-component-v1.js');
const wheelSpec = read('sky-chart-wheel-spec-v1.js');
const foundation = read('sky-chart-foundation-v2.js');
const relationships = read('sky-chart-relationship-list-layout-v2.js');
const sky = read('sky-chart.html');
const masterPage = read('glyphs-unified-preview.html');
const gemini = read('assets/zodiac-glyphs/gemini.svg');

assert.match(sky, /relphi-glyph-registry-v1\.js\?v=28/);
assert.match(sky, /relphi-glyph-component-v1\.js\?v=32/);
assert.match(sky, /sky-chart-wheel-spec-v1\.js\?v=6/);
assert.match(sky, /sky-chart-foundation-v2\.js\?v=18/);
assert.match(sky, /sky-chart-relationship-list-layout-v2\.js\?v=5/);
assert.match(masterPage, /relphi-glyph-registry-v1\.js\?v=28/);
assert.match(masterPage, /relphi-glyph-component-v1\.js\?v=32/);

assert.match(component, /function\s+createBubble\s*\(/);
assert.match(component, /function\s+staticMaster\s*\(/);
assert.match(component, /entry\.fitMode\s*===\s*['"]static-master['"]\)\s*return\s+staticMaster/);

assert.match(wheelSpec, /glyphRadius:24/);
assert.match(wheelSpec, /placementRadius:18\.5/);
assert.match(wheelSpec, /function role\(slot\)\{return slot==='A'\?comparison\.inner:comparison\.outer\}/);

assert.match(foundation, /function addZodiac\(/);
assert.match(foundation, /radius=Number\(z\.glyphRadius\)\|\|19/);
assert.match(foundation, /drawBubble\(host,id,\{radius,padding:1,color:'#171717',strokeWidth:z\.strokeWidth\|\|2\.35\},true\)/);
assert.match(foundation, /sky-foundation-wheel relphi-canonical-ready/);

assert.match(relationships, /VIEWBOX='-32 -32 64 64'/);
assert.match(relationships, /RADIUS=19/);
assert.match(relationships, /OWNER='relationship-layout-v35'/);
assert.match(relationships, /component\.createBubble\(/);
assert.match(relationships, /data-relationship-canonical-host/);

assert.match(registry, /\['gemini','Gemini',[\s\S]*?'assets\/zodiac-glyphs\/gemini\.svg'/);
assert.match(gemini, /viewBox="0 0 100 100"/);
assert.match(gemini, /fill="#111111"/);
assert.doesNotMatch(gemini, /stroke=|stroke-width=/);

console.log('Active Sky Chart v2 glyph stack uses the shared registry/component, wheel spec, and v35 relationship renderer.');
