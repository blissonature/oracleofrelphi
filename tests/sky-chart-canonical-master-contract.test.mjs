import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const APPROVED_PAGE='https://oracleofrelphi.com/glyphs-unified-preview.html';
const APPROVED_COMMIT='047fd8a7bf764e285dcb6ae012048a965840ea39';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

execFileSync(process.execPath,['scripts/generate-glyph-canon-audit.mjs','glyph-canon-source-audit.json'],{cwd:root,stdio:'inherit'});
const audit=JSON.parse(read('glyph-canon-source-audit.json'));
const manifest=JSON.parse(read('glyph-canon-approved-source-manifest.json'));

assert.equal(audit.approvedSource.page,APPROVED_PAGE);
assert.equal(audit.approvedSource.commit,APPROVED_COMMIT);
assert.equal(manifest.authority.page,APPROVED_PAGE);
assert.equal(manifest.authority.commit,APPROVED_COMMIT);
assert.ok(audit.entries.length>80,'The complete approved registry must be audited.');
assert.ok(audit.approvedRuntimeFiles.every(item=>item.equal),'Every approved runtime file must match the manifest.');
assert.deepEqual(audit.competingSources,{
  forbiddenFilesPresent:[],
  angleAssetFiles:[],
  definitionViolations:[],
  mutationViolations:[],
  geometryViolations:[],
  staleReferences:[],
  consumerReferenceViolations:[]
});

execFileSync('git',['diff','--quiet','origin/main','--','glyphs-unified-preview.html'],{cwd:root});
for(const item of audit.approvedRuntimeFiles){
  assert.equal(typeof manifest.runtime_files[item.file],'string',`${item.file} must be listed in the runtime source manifest.`);
}
assert.equal(Object.hasOwn(manifest.runtime_files,'glyphs-unified-preview.html'),false);

const sky=read('sky-chart.html');
const foundation=read('sky-chart-foundation-v1.js');
const filters=read('sky-chart-multiselect-filters-v1.js');
const cardCss=read('sky-chart-selected-relationship-atomic-v1.css');
const integrity=read('relphi-glyph-source-integrity-v1.js');
const gemini=read('assets/zodiac-glyphs/gemini.svg');

assert.equal((sky.match(/relphi-glyph-registry-v1\.js/g)||[]).length,1);
assert.equal((sky.match(/relphi-glyph-component-v1\.js/g)||[]).length,1);
assert.match(sky,/relphi-glyph-source-integrity-v1\.js/);
assert.doesNotMatch(sky,/canon-binding|atomic-loader|neptune-cross|moon-stroke-preservation|glyph-framing|glyph-size-guard|live-integrity|angle-extreme-placement/i);
assert.match(integrity,/https:\/\/oracleofrelphi\.com\/glyphs-unified-preview\.html/);
assert.match(integrity,/047fd8a7bf764e285dcb6ae012048a965840ea39/);
assert.doesNotMatch(integrity,/window\.RelphiGlyphComponent\s*=|window\.RelphiGlyphRegistry\s*=/);

assert.match(gemini,/viewBox="0 0 100 100"/);
assert.match(gemini,/fill="#111111"/);
assert.match(gemini,/fill-rule="evenodd"/);
assert.doesNotMatch(gemini,/stroke=|stroke-width=/);

assert.match(foundation,/component\.draw\(parent, entry\.id, options\)/);
assert.match(foundation,/component\.createBubble\(parent, entry\.id, options\)/);
assert.match(foundation,/function drawUncircledBubble/);
assert.match(foundation,/frameRadius:19/);
assert.match(foundation,/bubble\.circle\.style\.opacity\s*=\s*['"]0['"]/);
assert.match(foundation,/A:Object\.freeze\(\[540,522,504\]\)/);
assert.match(foundation,/B:Object\.freeze\(\[202,220,238\]\)/);
assert.match(foundation,/edgeRadius:Object\.freeze\(\{A:R\.aOut,B:R\.bIn\}\)/);
assert.match(foundation,/const glyphRadius = 19/);
assert.doesNotMatch(foundation,/id === ['"]gemini['"]|gemini.*\?\s*\d+\s*:\s*\d+/i);
assert.doesNotMatch(foundation,/data-angle-collision-error|ANGLE COLLISION|No legal canonical Angle lane/);
assert.doesNotMatch(foundation,/assets\/angle-glyphs|VECTOR_GLYPHS|const\s+PATHS\s*=/);

assert.match(filters,/ascendant:'asc', 'asc\.':'asc'/);
assert.match(filters,/planets:Object\.freeze\(\['mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'\]\)/);
assert.match(filters,/'angles-points':Object\.freeze\(\['asc','dsc','mc','ic'/);
assert.match(cardCss,/padding:0 !important/);
assert.match(cardCss,/background:transparent !important/);
assert.match(cardCss,/data-selected-card="A"[\s\S]*border:3px solid var\(--sky-a\)/);
assert.match(cardCss,/data-selected-card="B"[\s\S]*border:3px solid var\(--sky-b\)/);

console.log('Gemini is a filled canonical silhouette and all zodiac signs share one wheel presentation size.');
