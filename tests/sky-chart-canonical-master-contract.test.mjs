import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const APPROVED='0d56ee7ec0ea0fc3e44debcb809afde09f3271ab';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const show=file=>execFileSync('git',['show',`${APPROVED}:${file}`],{cwd:root});

execFileSync(process.execPath,['scripts/generate-glyph-canon-audit.mjs','glyph-canon-source-audit.json'],{cwd:root,stdio:'inherit'});
const audit=JSON.parse(read('glyph-canon-source-audit.json'));
const manifest=JSON.parse(read('glyph-canon-approved-source-manifest.json'));

assert.equal(audit.approvedSource.commit,APPROVED);
assert.equal(manifest.authority.commit,APPROVED);
assert.ok(audit.entries.length>80,'The complete approved Master Glyph List must be audited.');
assert.ok(audit.approvedFiles.every(item=>item.equal),'Every approved glyph source must be byte-identical.');
assert.deepEqual(audit.competingSources,{
  forbiddenFilesPresent:[],
  angleAssetFiles:[],
  definitionViolations:[],
  mutationViolations:[],
  geometryViolations:[],
  staleReferences:[]
});

for(const file of ['glyphs-unified-preview.html','relphi-glyph-registry-v1.js','relphi-glyph-component-v1.js']){
  assert.equal(Buffer.compare(fs.readFileSync(path.join(root,file)),show(file)),0,`${file} must exactly match ${APPROVED}.`);
}
for(const item of audit.approvedFiles){
  assert.equal(typeof manifest.files[item.file],'string',`${item.file} must be listed in the immutable source manifest.`);
}

const master=read('glyphs-unified-preview.html');
const sky=read('sky-chart.html');
const foundation=read('sky-chart-foundation-v1.js');
const integrity=read('relphi-glyph-source-integrity-v1.js');

assert.equal((master.match(/relphi-glyph-registry-v1\.js/g)||[]).length,1);
assert.equal((master.match(/relphi-glyph-component-v1\.js/g)||[]).length,1);
assert.doesNotMatch(master,/canon-binding|atomic-loader|neptune-cross|angle-glyph|glyph-size-guard/i);

assert.equal((sky.match(/relphi-glyph-registry-v1\.js/g)||[]).length,1);
assert.equal((sky.match(/relphi-glyph-component-v1\.js/g)||[]).length,1);
assert.match(sky,/relphi-glyph-source-integrity-v1\.js/);
assert.doesNotMatch(sky,/canon-binding|atomic-loader|neptune-cross|moon-stroke-preservation|glyph-framing|glyph-size-guard|live-integrity/i);

assert.match(integrity,/0d56ee7ec0ea0fc3e44debcb809afde09f3271ab/);
assert.doesNotMatch(integrity,/window\.RelphiGlyphComponent\s*=|window\.RelphiGlyphRegistry\s*=/);
assert.match(foundation,/component\.draw\(parent, entry\.id, options\)/);
assert.match(foundation,/component\.createBubble\(parent, entry\.id, options\)/);
assert.match(foundation,/data-angle-collision-error/);
assert.match(foundation,/No legal canonical Angle lane/);
assert.doesNotMatch(foundation,/assets\/angle-glyphs|VECTOR_GLYPHS|const\s+PATHS\s*=/);

console.log('Exact approved glyph sources, one registry, one component, no competing canon, and Sky Chart direct consumption passed.');
