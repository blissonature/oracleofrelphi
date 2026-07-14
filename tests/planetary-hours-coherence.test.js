const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const geometry = require('../planetary-hours-geometry.js');

const clockwise = geometry.solveCluster([
  { longitude:100, halfSpan:4 }, { longitude:101, halfSpan:4 }
], 99, 140, 1);
assert.equal(clockwise.mode, 'clockwise');
assert.ok(geometry.signed(clockwise.angles[0], clockwise.angles[1]) > 0, 'clockwise cluster keeps zodiac order');

const counterclockwise = geometry.solveCluster([
  { longitude:100, halfSpan:4 }, { longitude:101, halfSpan:4 }
], 60, 102, 1);
assert.equal(counterclockwise.mode, 'counterclockwise');

const split = geometry.solveCluster([
  { longitude:101, halfSpan:3 }, { longitude:101.2, halfSpan:3 }, { longitude:101.4, halfSpan:3 }
], 90, 112, 1);
assert.equal(split.mode, 'split');
assert.ok(split.angles.every(Number.isFinite));

const html = fs.readFileSync(path.join(__dirname, '..', 'planetaryhours.html'), 'utf8');
const wandererBlock = html.match(/function renderWandererGrid[\s\S]*?function renderSkyOrientation/)?.[0] || '';
assert.match(html, /planetary-hours-geometry\.js\?v=1/);
assert.match(html, /data-true-longitude/);
assert.match(wandererBlock, /<details class="ph-wanderer-item/);
assert.match(wandererBlock, /wandererDisclosureState\.has\(item\.body\)[^\n]*: item\.above/);
assert.match(wandererBlock, /wandererDisclosureState\.set/);
assert.doesNotMatch(wandererBlock, /state\.skyBody === body/, 'wanderer disclosure no longer uses a separate selected body');
assert.match(html, /lastAutoScrolledHour/);
assert.match(html, /tableManuallyScrolled/);
assert.match(html, /relphiPlanetaryHoursWhereWhen/);
assert.match(html, /wrap\.scrollTo/);
console.log('Planetary Hours coherence regression tests passed');
