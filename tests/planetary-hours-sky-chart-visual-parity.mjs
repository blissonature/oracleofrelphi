import assert from 'node:assert/strict';
import fs from 'node:fs';

const parity=fs.readFileSync('planetary-hours-sky-chart-visual-parity-v1.js','utf8');
const standardizer=fs.readFileSync('standardize-zodiac-wheels.js','utf8');
const navloader=fs.readFileSync('navloader.js','utf8');

assert.match(standardizer,/sky-chart-wheel-spec-v1\.js\?v=6/);
assert.match(standardizer,/planetary-hours-sky-chart-visual-parity-v1\.js\?v=3/);
assert.match(standardizer,/installPlanetaryHoursBootMask\(\)/);
assert.match(standardizer,/isPlanetaryHoursOwnedSvg\(svg\)/);
assert.match(standardizer,/if \(isPlanetaryHoursOwnedSvg\(svg\) \|\| !looksLikeWheel\(svg\)\) return/);

assert.match(navloader,/ensurePlanetaryHoursVisualBootStyle/);
assert.match(navloader,/#heptagramSvg:not\(\[data-sky-chart-parity-ready="true"\]\)/);
assert.match(navloader,/planetary-hours-sky-chart-visual-parity-v1\.js\?v=3/);
assert.match(navloader,/if \(isPlanetaryHoursContext\(\)\) ensurePlanetaryHoursVisualBootStyle\(\)/);

assert.match(parity,/__relphiPlanetaryHoursSkyChartVisualParityV3/);
assert.match(parity,/MASTER_RADIUS=19,DISPLAY_RADIUS=17,MASTER_SCALE=DISPLAY_RADIUS\/MASTER_RADIUS/);
assert.match(parity,/DAY_RING_INNER_RADIUS=23,DAY_RING_OUTER_RADIUS=27/);
assert.match(parity,/async function buildHeptagramDisplay\(source\)/);
assert.match(parity,/const display=source\.cloneNode\(true\)/);
assert.match(parity,/display\.dataset\.skyChartParityDisplay='true'/);
assert.match(parity,/node\.classList\.add\('ph-parity-anchor'\)/);
assert.match(parity,/component\.createBubble\(master,entry\.id/);
assert.match(parity,/display\.dataset\.skyChartParityReady='true'/);
assert.match(parity,/heptagramSourceObserver=new MutationObserver/);
assert.match(parity,/heptagramSource\.replaceWith\(display\)/);
assert.match(parity,/visible\.replaceWith\(display\)/);
assert.match(parity,/heptagramSourceObserver\.observe\(heptagramSource/);
assert.doesNotMatch(parity,/heptagramSource\.removeAttribute\('data-sky-chart-parity-ready'\)/);

assert.match(parity,/window\.RelphiSkyWheelSpec\?\.mini/);
assert.match(parity,/window\.RelphiSkyWheelSpec\?\.miniRole\?\.\('A'\)/);
assert.match(parity,/ph-parity-zodiac-sector/);
assert.match(parity,/ph-parity-house-sector/);
assert.match(parity,/bubble\(host,id,\{radius:zodiac\.glyphRadius\|\|14,color:'#514b45',plain:true/);
assert.match(parity,/bubble\(host,item\.id,\{radius:bubbleRadius,color:SKY_COLOR,fill:'#fffdfa',strokeWidth\}\)/);
assert.match(parity,/mount\.dataset\.skyChartParityReady='true'/);

console.log('Planetary Hours Sky Chart visual parity contract passed.');