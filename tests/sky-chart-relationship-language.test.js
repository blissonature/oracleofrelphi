const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'sky-chart-relationship-language.js'), 'utf8');
const loader = fs.readFileSync(path.join(root, 'navloader.js'), 'utf8');

assert.match(source, /Pluto:'power, depth, transformation, and compulsion'/);
assert.match(source, /Scorpio:'intensity, secrecy, survival, bonding, and emotional truth'/);
assert.match(source, /Jupiter:'growth, confidence, meaning, and expansion'/);
assert.match(source, /Leo:'radiance, creativity, pride, loyalty, and recognition'/);
assert.match(source, /function progressiveToken\(glyph, name, meaning\)/);
assert.match(source, /In the same sky/);
assert.match(source, /relphi-progressive-name/);
assert.match(source, /relphi-progressive-meaning/);
assert.match(source, /meaningButton\.remove\(\)/);
assert.match(source, /existingName\.remove\(\)/);
assert.match(source, /event\.stopPropagation\(\)/);
assert.match(source, /ASPECT_GLYPH/);
assert.match(source, /ELEMENT_GLYPH/);
assert.match(source, /\['relphiSkyChartA', 'relphiSkyChartB'\]/);
assert.match(source, /verifiedOwner\(leftName, leftBody, leftSign, leftDegree\)/);
assert.match(source, /verifiedOwner\(rightName, rightBody, rightSign, rightDegree\)/);
assert.match(loader, /sky-chart-relationship-language\.js\?v=5/);

console.log('SkyChart relationship language progressively reveals and collapses symbolic meanings.');
