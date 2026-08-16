const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('sky-chart.html','utf8');
const core=fs.readFileSync('sky-chart-interaction-core-v1.js','utf8');
const foundation=fs.readFileSync('sky-chart-foundation-v1.js','utf8');
const house=fs.readFileSync('sky-chart-house-medallion-v1.js','utf8');

assert.match(html,/sky-chart-interaction-core-v1\.js/);
assert.match(html,/sky-chart-interaction-core-v1\.css/);
for(const retired of ['sky-chart-foundation-interactions-v2.js','sky-chart-hover-fast-path-v1.js','sky-chart-hover-motion-priority-v1.js','sky-chart-inline-progressive-contract-v3.js','sky-chart-inline-relationship-v5.js','sky-chart-selected-relationship-wheel-bridge-v1.js','sky-chart-inline-expanded-header-v1.js','sky-chart-relationship-state-contract-v1.js'])assert.doesNotMatch(html,new RegExp(retired.replaceAll('.','\\.')));
assert.doesNotMatch(core,/addEventListener\('pointermove'/,'The replacement must use native hit targets, not a pointermove scan.');
assert.doesNotMatch(core,/getScreenCTM|getComputedStyle|getBoundingClientRect/,'The interaction core must not perform layout or style reads.');
assert.match(core,/sky-foundation-aspect-hit/);
assert.match(core,/data-relationship-id/);
assert.match(core,/REVEAL_FIELDS=\['left-placement','left-sign','left-house','aspect','right-placement','right-sign','right-house'\]/);
assert.match(core,/RelphiSkyInteractionMetrics/);
assert.match(foundation,/harmonic\.relation\(left,right,aspect,distance,windowValue\)/,'The foundation wheel and interaction model must share the canonical Harmonic Orb API.');
assert.match(house,/grid-template-columns:50px 18px/);
assert.match(house,/grid-template-columns:48px 18px/);
assert.match(core,/assets\/tarot\/rws-export\/\$\{id\}\.webp/);
console.log('Sky Chart interaction core contract passed.');
