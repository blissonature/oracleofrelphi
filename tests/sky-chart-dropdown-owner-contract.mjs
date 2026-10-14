import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
const html=read('sky-chart.html');
const owner=read('sky-chart-dropdown-position-v1.js');
assert.match(html,/sky-chart-dropdown-position-v1\.js\?v=1/);
assert.ok(html.indexOf('sky-chart-dropdown-position-v1.js')<html.indexOf('sky-chart-placement-multiselect-v4.js'));
assert.match(owner,/window\.RelphiSkyDropdownPosition=position/);
assert.match(owner,/window\.RelphiSkyDropdownLifecycle=Object.freeze/);
assert.match(owner,/pointermove/);
assert.match(owner,/pointercancel/);
assert.match(owner,/rect\.bottom\+gap:rect\.top-gap-height/);
assert.match(owner,/overflowY:natural>height\?'auto':'hidden'/);
for(const name of ['sky-chart-zodiac-filter-v1.js','sky-chart-vocab-tab-v1.js','sky-chart-placement-multiselect-v4.js','sky-chart-house-multiselect-v2.js']){
  assert.match(read(name),/window\.RelphiSkyDropdownPosition\(/,name+' must delegate geometry');
}
for(const name of ['sky-chart-zodiac-filter-v1.js','sky-chart-vocab-tab-v1.js','sky-chart-placement-multiselect-v4.js','sky-chart-house-multiselect-v2.js']){
  assert.match(read(name),/window\\.RelphiSkyDropdownLifecycle\\.register\\(/,name+' must register shared lifecycle');
}
assert.doesNotMatch(read('sky-chart-zodiac-filter-v1.css'),/position:absolute;top:100%;left:0;bottom:auto/);
console.log('Canonical dropdown ownership contract passed');
