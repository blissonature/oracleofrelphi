import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

const binding=read('relphi-glyph-canon-binding-v1.js');
const foundation=read('sky-chart-foundation-v1.js');
const angles=read('sky-chart-angle-placements-v1.js');
const audit=read('sky-chart-glyph-audit-v1.js');
const html=read('sky-chart.html');
const master=read('glyphs-unified-preview.html');
const neptune=read('assets/planet-glyphs/neptune.svg');

assert.match(binding,/glyphs-unified-preview\.html/);
assert.match(binding,/same-master-opacity-toggle/);
assert.match(binding,/entry\.canonicalSource\s*=\s*entry\.asset/);
assert.match(binding,/entry\.canonicalPreserveViewBox\s*=\s*true/);
assert.doesNotMatch(binding,/assets\/angle-glyphs/);
assert.doesNotMatch(binding,/if\s*\(\s*entry\.id\s*===\s*['"]neptune/);
assert.doesNotMatch(angles,/assets\/angle-glyphs|patchRegistryAssets/);
assert.doesNotMatch(binding,/entry\.asset\s*=|entry\.fallback\s*=/);

assert.match(neptune,/viewBox="0 0 100 100"/);
assert.match(neptune,/M12 17L17 11L22 17/);
assert.match(neptune,/44 62H56/);

assert.match(foundation,/lanes:Object\.freeze\(\{\s*A:Object\.freeze\(\[448,494,540\]\),\s*B:Object\.freeze\(\[202,244,286\]\)/s);
assert.match(foundation,/No legal canonical Angle lane/);
assert.match(foundation,/data-angle-collision-error/);
assert.match(foundation,/glyphs-unified-preview\.html/);
assert.doesNotMatch(foundation,/for\s*\(let attempt\s*=\s*0;\s*attempt\s*<\s*3/);
assert.doesNotMatch(foundation,/getBBox\s*\(/);
assert.doesNotMatch(foundation,/getBoundingClientRect\s*\(/);

assert.match(audit,/Comparison wheel has .* Angle labels instead of 8/);
assert.match(audit,/moved off its exact longitude/);
assert.match(audit,/a zodiac glyph/);
assert.match(audit,/a house number/);
assert.match(audit,/a placement bubble/);
assert.match(audit,/outside its sky-owned band/);
assert.match(audit,/wrong sky color/);

assert.doesNotMatch(html,/relphi-neptune-cross-connection-v1\.js/);
assert.match(html,/relphi-glyph-canon-binding-v1\.js\?v=4/);
assert.match(html,/relphi-glyph-atomic-loader-v1\.js\?v=7/);
assert.match(html,/sky-chart-foundation-v1\.js\?v=5/);
assert.match(html,/sky-chart-glyph-audit-v1\.js\?v=4/);
assert.doesNotMatch(master,/relphi-neptune-cross-connection-v1\.js/);
assert.match(master,/relphi-glyph-canon-binding-v1\.js\?v=4/);
assert.match(master,/relphi-glyph-atomic-loader-v1\.js\?v=7/);
for(const file of ['assets/angle-glyphs/asc.svg','assets/angle-glyphs/dsc.svg','assets/angle-glyphs/mc.svg','assets/angle-glyphs/ic.svg','sky-chart-angle-glyph-fit-v1.js']){
  assert.equal(fs.existsSync(path.join(root,file)),false,`${file} must not exist.`);
}

console.log('Master Glyph List source, sole Neptune asset, one-pass source-viewBox construction, and deterministic Angle lanes passed static verification.');
