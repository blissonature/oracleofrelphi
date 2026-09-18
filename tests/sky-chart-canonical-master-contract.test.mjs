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
const foundation = read('sky-chart-foundation-v1.js');
const relationships = read('sky-chart-relationship-list-layout-v1.js');
const masterPage = read('glyphs-unified-preview.html');
const gemini = read('assets/zodiac-glyphs/gemini.svg');

assert.match(masterPage, /relphi-glyph-registry-v1\.js\?v=28/);
assert.match(masterPage, /relphi-glyph-component-v1\.js\?v=32/);
assert.match(component, /function\s+createBubble\s*\(/);
assert.match(component, /function\s+staticMaster\s*\(/);
assert.match(component, /entry\.fitMode\s*===\s*['"]static-master['"]\)\s*return\s+staticMaster/);
assert.match(foundation, /RelphiGlyphComponent/);
assert.match(foundation, /\.createBubble\s*\(/);
assert.match(relationships, /(?:MASTER_)?VIEWBOX\s*=\s*['"]-32 -32 64 64['"]/);
assert.match(relationships, /(?:MASTER_)?RADIUS\s*=\s*19\b/);
assert.match(relationships, /data-relationship-canonical-host/);
assert.match(registry, /\['gemini','Gemini',[\s\S]*?'assets\/zodiac-glyphs\/gemini\.svg'/);
assert.match(gemini, /viewBox="0 0 100 100"/);
assert.match(gemini, /fill="#111111"/);
assert.doesNotMatch(gemini, /stroke=|stroke-width=/);

console.log('Current Master Glyph List runtime contract is internally consistent and protected by the single-canon checks.');
