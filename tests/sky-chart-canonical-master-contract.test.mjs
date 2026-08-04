import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const APPROVED_PAGE='https://oracleofrelphi.com/glyphs-unified-preview.html';
const APPROVED_COMMIT='0d56ee7ec0ea0fc3e44debcb809afde09f3271ab';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const show=file=>execFileSync('git',['show',`${APPROVED_COMMIT}:${file}`],{cwd:root});

execFileSync(process.execPath,['scripts/generate-glyph-canon-audit.mjs','glyph-canon-source-audit.json'],{cwd:root,stdio:'inherit'});
const audit=JSON.parse(read('glyph-canon-source-audit.json'));
const manifest=JSON.parse(read('glyph-canon-approved-source-manifest.json'));

assert.equal(audit.approvedSource.page,APPROVED_PAGE);
assert.equal(audit.approvedSource.commit,APPROVED_COMMIT);
assert.equal(manifest.authority.page,APPROVED_PAGE);
assert.equal(manifest.authority.commit,APPROVED_COMMIT);
assert.ok(audit.entries.length>80,'The complete approved registry must be audited.');
assert.ok(audit.approvedRuntimeFiles.every(item=>item.equal),'Every Sky Chart glyph runtime file must be byte-identical to the approved snapshot.');
assert.deepEqual(audit.competingSources,{
  forbiddenFilesPresent:[],
  angleAssetFiles:[],
  definitionViolations:[],
  mutationViolations:[],
  geometryViolations:[],
  staleReferences:[],
  consumerReferenceViolations:[]
});

// The permanent hosted reference page is not a branch preview and must not be
// changed by this PR.
execFileSync('git',['diff','--quiet','origin/main','--','glyphs-unified-preview.html'],{cwd:root});

for(const file of ['relphi-glyph-registry-v1.js','relphi-glyph-component-v1.js','assets/zodiac-glyphs/gemini.svg']){
  assert.equal(Buffer.compare(fs.readFileSync(path.join(root,file)),show(file)),0,`${file} must exactly match ${APPROVED_COMMIT}.`);
}
for(const item of audit.approvedRuntimeFiles){
  assert.equal(typeof manifest.runtime_files[item.file],'string',`${item.file} must be listed in the runtime source manifest.`);
}
assert.equal(Object.hasOwn(manifest.runtime_files,'glyphs-unified-preview.html'),false,'The permanent page must not be duplicated as a branch runtime file.');

const sky=read('sky-chart.html');
const foundation=read('sky-chart-foundation-v1.js');
const filters=read('sky-chart-multiselect-filters-v1.js');
const cardCss=read('sky-chart-selected-relationship-atomic-v1.css');
const integrity=read('relphi-glyph-source-integrity-v1.js');

assert.equal((sky.match(/relphi-glyph-registry-v1\.js/g)||[]).length,1);
assert.equal((sky.match(/relphi-glyph-component-v1\.js/g)||[]).length,1);
assert.match(sky,/relphi-glyph-source-integrity-v1\.js/);
assert.doesNotMatch(sky,/canon-binding|atomic-loader|neptune-cross|moon-stroke-preservation|glyph-framing|glyph-size-guard|live-integrity|angle-extreme-placement/i);

assert.match(integrity,/https:\/\/oracleofrelphi\.com\/glyphs-unified-preview\.html/);
assert.match(integrity,/0d56ee7ec0ea0fc3e44debcb809afde09f3271ab/);
assert.doesNotMatch(integrity,/window\.RelphiGlyphComponent\s*=|window\.RelphiGlyphRegistry\s*=/);
assert.match(foundation,/component\.draw\(parent, entry\.id, options\)/);
assert.match(foundation,/component\.createBubble\(parent, entry\.id, options\)/);
assert.match(foundation,/function drawUncircledBubble/);
assert.match(foundation,/frameRadius:19/);
assert.match(foundation,/bubble\.circle\.style\.opacity\s*=\s*['"]0['"]/);
assert.match(foundation,/bubble\.root\.dataset\.circlePresentation\s*=\s*['"]hidden-only['"]/);
assert.match(foundation,/drawUncircledBubble\(host,record\.id/);
assert.match(foundation,/A:Object\.freeze\(\[540,522,504\]\)/);
assert.match(foundation,/B:Object\.freeze\(\[202,220,238\]\)/);
assert.match(foundation,/edgeRadius:Object\.freeze\(\{A:R\.aOut,B:R\.bIn\}\)/);
assert.match(foundation,/extreme:Object\.freeze\(\{A:'outer',B:'inner'\}\)/);
assert.match(foundation,/const edge = ANGLE_LAYOUT\.edgeRadius\[slot\]/);
assert.match(foundation,/slot === 'A'[\s\S]*chosen\.radius \+ ANGLE_LAYOUT\.lineGap[\s\S]*chosen\.radius - ANGLE_LAYOUT\.lineGap/);
assert.match(foundation,/radialLine\(layers\.leaders,lineStart,lineEnd,record\.value,attrs\)/);
assert.match(foundation,/'data-axis-edge-radius':edge/);
assert.doesNotMatch(foundation,/lineSegmentLength|lineBands|beforeEnd|afterStart/);

// Zodiac signs must all use the same canonical hidden-circle composition.
assert.match(foundation,/function preserveCanonicalStrokeWeight\(root\)/);
assert.match(foundation,/const glyphRadius = 19/);
assert.match(foundation,/class:'sky-foundation-sign-glyph'/);
assert.match(foundation,/drawUncircledBubble\(host,id,\{/);
assert.match(foundation,/root\.dataset\.wheelPresentation = 'without-circles'/);
assert.match(foundation,/preserveCanonicalStrokeWeight\(root\)/);
assert.match(foundation,/node\.dataset\.canonicalSourceStroke/);
assert.match(foundation,/node\.dataset\.canonicalFittedStroke/);
assert.match(foundation,/node\.setAttribute\('vector-effect', 'non-scaling-stroke'\)/);
assert.match(foundation,/root\.dataset\.canonicalStrokePresentation = 'fitted-non-scaling'/);
assert.doesNotMatch(foundation,/id === ['"]gemini['"]|gemini.*\?\s*\d+\s*:\s*\d+/i);
assert.doesNotMatch(foundation,/data-angle-collision-error|ANGLE COLLISION|No legal canonical Angle lane/);
assert.doesNotMatch(foundation,/assets\/angle-glyphs|VECTOR_GLYPHS|const\s+PATHS\s*=/);

assert.match(filters,/ascendant:'asc', 'asc\.':'asc'/);
assert.match(filters,/planets:Object\.freeze\(\['mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'\]\)/);
assert.match(filters,/'angles-points':Object\.freeze\(\['asc','dsc','mc','ic'/);
assert.match(filters,/const id = canonicalId\(row\.dataset\.placement \|\| label\)/);

assert.match(cardCss,/padding:0 !important/);
assert.match(cardCss,/background:transparent !important/);
assert.match(cardCss,/data-selected-card="A"[\s\S]*border:3px solid var\(--sky-a\)/);
assert.match(cardCss,/data-selected-card="B"[\s\S]*border:3px solid var\(--sky-b\)/);
assert.match(cardCss,/border-radius:0 !important/);

console.log('Permanent canonical page untouched; Sky Chart uses one shared zodiac master composition and preserves authored stroke weight.');
