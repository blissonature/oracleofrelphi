import assert from 'node:assert/strict';
import fs from 'node:fs';

const parity=fs.readFileSync('planetary-hours-sky-chart-visual-parity-v1.js','utf8');
const standardizer=fs.readFileSync('standardize-zodiac-wheels.js','utf8');

assert.match(standardizer,/sky-chart-wheel-spec-v1\.js\?v=6/);
assert.match(standardizer,/planetary-hours-sky-chart-visual-parity-v1\.js\?v=1/);

assert.match(parity,/MASTER_RADIUS=19,DISPLAY_RADIUS=17,MASTER_SCALE=DISPLAY_RADIUS\/MASTER_RADIUS/);
assert.match(parity,/DAY_RING_INNER_RADIUS=23,DAY_RING_OUTER_RADIUS=27/);
assert.match(parity,/component\.createBubble\(master,entry\.id/);
assert.match(parity,/root\.querySelectorAll\('text'\)\.forEach\(node=>node\.remove\(\)\)/);
assert.match(parity,/window\.RelphiSkyWheelSpec\?\.mini/);
assert.match(parity,/window\.RelphiSkyWheelSpec\?\.miniRole\?\.\('A'\)/);
assert.match(parity,/ph-parity-zodiac-sector/);
assert.match(parity,/ph-parity-house-sector/);
assert.match(parity,/bubble\(host,id,\{radius:zodiac\.glyphRadius\|\|14,color:'#514b45',plain:true/);
assert.match(parity,/bubble\(host,item\.id,\{radius:bubbleRadius,color:SKY_COLOR,fill:'#fffdfa',strokeWidth\}\)/);
assert.match(parity,/data-sky-chart-parity/);

console.log('Planetary Hours Sky Chart visual parity contract passed.');
