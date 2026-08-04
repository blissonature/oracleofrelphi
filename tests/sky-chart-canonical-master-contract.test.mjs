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
for(const item of audit.approvedRuntimeFiles){
  assert.equal(typeof manifest.runtime_files[item.file],'string',`${item.file} must be listed in the runtime source manifest.`);
}
assert.equal(Object.hasOwn(manifest.runtime_files,'glyphs-unified-preview.html'),false);

const sky=read('sky-chart.html');
const component=read('relphi-glyph-component-v1.js');
const foundation=read('sky-chart-foundation-v1.js');
const filters=read('sky-chart-multiselect-filters-v1.js');
const angleVisibility=read('sky-chart-angle-placement-visibility-v1.js');
const cardCss=read('sky-chart-selected-relationship-atomic-v1.css');
const integrity=read('relphi-glyph-source-integrity-v1.js');
const gemini=read('assets/zodiac-glyphs/gemini.svg');

assert.equal((sky.match(/relphi-glyph-registry-v1\.js/g)||[]).length,1);
assert.equal((sky.match(/relphi-glyph-component-v1\.js/g)||[]).length,1);
assert.match(sky,/relphi-glyph-component-v1\.js\?v=25/);
assert.match(sky,/sky-chart-multiselect-filters-v1\.js\?v=9/);
assert.match(sky,/sky-chart-angle-placement-visibility-v1\.js\?v=2/);
assert.match(sky,/relphi-glyph-source-integrity-v1\.js/);
assert.doesNotMatch(sky,/canon-binding|atomic-loader|neptune-cross|moon-stroke-preservation|glyph-framing|glyph-size-guard|live-integrity|angle-extreme-placement/i);
assert.match(integrity,/https:\/\/oracleofrelphi\.com\/glyphs-unified-preview\.html/);
assert.match(integrity,/047fd8a7bf764e285dcb6ae012048a965840ea39/);
assert.doesNotMatch(integrity,/window\.RelphiGlyphComponent\s*=|window\.RelphiGlyphRegistry\s*=/);

assert.match(component,/art\.setAttribute\('visibility', 'hidden'\)/);
assert.match(component,/fit\(art, radius, padding, entry, bubbleStrokeWidth\)/);
assert.match(component,/art\.dataset\.glyphPresentation = 'canonical-fitted-before-reveal'/);
assert.match(component,/art\.removeAttribute\('visibility'\)/);
assert.doesNotMatch(component,/requestAnimationFrame/);

assert.match(gemini,/viewBox="0 0 100 100"/);
assert.match(gemini,/fill="#111111"/);
assert.doesNotMatch(gemini,/stroke=|stroke-width=/);

assert.match(foundation,/component\.draw\(parent, entry\.id, options\)/);
assert.match(foundation,/component\.createBubble\(parent, entry\.id, options\)/);
assert.match(foundation,/function drawUncircledBubble/);
assert.match(foundation,/bubble\.circle\.style\.opacity\s*=\s*['"]0['"]/);
assert.match(foundation,/const glyphRadius = 19/);
assert.doesNotMatch(foundation,/id === ['"]gemini['"]|gemini.*\?\s*\d+\s*:\s*\d+/i);

assert.match(filters,/label:'Planets', members:new Set\(\['mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'\]\)/);
assert.match(filters,/id:'chart-angles', label:'Chart Angles', members:new Set\(\['asc','dsc','mc','ic'\]\)/);
assert.match(filters,/'chart-angles':Object\.freeze\(\['asc','dsc','mc','ic'\]\)/);
assert.match(filters,/id:'points', label:'Points'/);
assert.doesNotMatch(filters,/label:'Planets'[^\n]+asc/);
assert.doesNotMatch(filters,/Angles and Points/);

assert.match(angleVisibility,/const hidden = choice \? !choice\.checked : false/);
assert.match(angleVisibility,/Absence is not deselection/);
assert.match(angleVisibility,/\[data-angle="\$\{id\}"\]/);

assert.match(cardCss,/padding:0 !important/);
assert.match(cardCss,/background:transparent !important/);
assert.match(cardCss,/data-selected-card="A"[\s\S]*border:3px solid var\(--sky-a\)/);
assert.match(cardCss,/data-selected-card="B"[\s\S]*border:3px solid var\(--sky-b\)/);

console.log('Chart Angles are separate from Planets, and Asc remains visible unless explicitly deselected.');
