import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const APPROVED_PAGE = 'https://oracleofrelphi.com/glyphs-unified-preview.html';

execFileSync(process.execPath, ['scripts/generate-glyph-canon-audit.mjs', 'glyph-canon-source-audit.json'], { cwd: root, stdio: 'inherit' });
const audit = JSON.parse(read('glyph-canon-source-audit.json'));
const manifest = JSON.parse(read('glyph-canon-approved-source-manifest.json'));
const component = read('relphi-glyph-component-v1.js');
const registry = read('relphi-glyph-registry-v1.js');
const foundation = read('sky-chart-foundation-v1.js');
const sky = read('sky-chart.html');
const masterPage = read('glyphs-unified-preview.html');
const gemini = read('assets/zodiac-glyphs/gemini.svg');

assert.equal(audit.approvedSource.page, APPROVED_PAGE);
assert.equal(manifest.authority.page, APPROVED_PAGE);
assert.ok(audit.approvedRuntimeFiles.every(item => item.equal), 'Every canonical runtime file must match the pinned manifest.');
assert.deepEqual(audit.competingSources, {
  forbiddenFilesPresent: [],
  angleAssetFiles: [],
  definitionViolations: [],
  mutationViolations: [],
  geometryViolations: [],
  staleReferences: [],
  consumerReferenceViolations: []
});

assert.match(sky, /relphi-glyph-component-v1\.js\?v=26/);
assert.match(masterPage, /relphi-glyph-component-v1\.js\?v=26/);
assert.match(component, /const CANONICAL_BUBBLE_RADIUS = 19/);
assert.match(component, /const CANONICAL_BUBBLE_STROKE = 2\.35/);
assert.match(component, /const requestedRadius = Number\(options\?\.radius \|\| CANONICAL_BUBBLE_RADIUS\)/);
assert.match(component, /const scale = requestedRadius \/ CANONICAL_BUBBLE_RADIUS/);
assert.match(component, /root\.setAttribute\('transform', `scale\(\$\{scale\}\)`\)/);
assert.match(component, /circle\.setAttribute\('r', String\(CANONICAL_BUBBLE_RADIUS\)\)/);
assert.match(component, /circle\.setAttribute\('stroke-width', String\(CANONICAL_BUBBLE_STROKE\)\)/);
assert.match(component, /radius: CANONICAL_BUBBLE_RADIUS/);
assert.match(component, /bubbleStrokeWidth: CANONICAL_BUBBLE_STROKE/);
assert.match(component, /canonicalBubblePresentation = 'uniform-master-scale'/);
assert.doesNotMatch(component, /circle\.setAttribute\('r', String\(requestedRadius\)\)/);

assert.match(foundation, /component\.createBubble\(parent, entry\.id, options\)/);
assert.match(foundation, /bubble\.circle\.style\.opacity\s*=\s*['"]0['"]/);
assert.doesNotMatch(foundation, /id === ['"]gemini['"]|gemini.*\?\s*\d+\s*:\s*\d+/i);

assert.match(registry, /\['gemini','Gemini',[\s\S]*?'assets\/zodiac-glyphs\/gemini\.svg'/);
assert.match(gemini, /viewBox="0 0 100 100"/);
assert.match(gemini, /fill="#111111"/);
assert.doesNotMatch(gemini, /stroke=|stroke-width=/);

console.log('Circled glyphs are uniform scales of the exact canonical master; Gemini uses the single filled canonical asset.');
