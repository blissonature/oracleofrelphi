import assert from 'node:assert/strict';
import fs from 'node:fs';

const page=fs.readFileSync('planetaryhours.html','utf8');
const parity=fs.readFileSync('planetary-hours-sky-chart-visual-parity-v1.js','utf8');
const standardizer=fs.readFileSync('standardize-zodiac-wheels.js','utf8');
const nav=fs.readFileSync('navloader.js','utf8');
const integrity=fs.readFileSync('planetary-hours-active-time-integrity-v1.js','utf8');

assert.match(page,/Direct Sky Chart-matched heptagram renderer: core presentation, no post-processing/);
assert.match(page,/const heptagramCanonicalArt = Object\.freeze/);
assert.match(page,/const cx = 180, cy = 180, r = 142/);
assert.match(page,/ph-core-heptagram-day-ring inner/);
assert.match(page,/r=\"23\"/);
assert.match(page,/r=\"27\"/);
assert.match(page,/for \(let i = 0; i < 7; i\+\+\) svg \+= heptagramLine\(chaldean/);
assert.match(page,/directHeptagramPlanetMarkup\(key, dayKey, hourKey\)/);
assert.match(page,/data-direct-heptagram-ready|directHeptagramReady/);
assert.doesNotMatch(parity,/heptagramSvg|ph-heptagram-node|ph-core-heptagram/);
assert.match(parity,/Planetary Hours current-placements mini wheel/);
assert.doesNotMatch(nav,/relphi-ph-visual-boot-mask|ensurePlanetaryHoursVisualBootStyle/);
assert.doesNotMatch(integrity,/correctHour24|ph-heptagram-node/);
assert.doesNotMatch(standardizer,/installPlanetaryHoursBootMask|relphi-ph-visual-boot-mask/);
assert.match(standardizer,/isPlanetaryHoursOwnedSvg/);

console.log('Planetary Hours direct heptagram ownership contract passed.');
