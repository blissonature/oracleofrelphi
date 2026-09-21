import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [skyHtml,defaultSky,planetaryHours]=await Promise.all([
  readFile('sky-chart.html','utf8'),
  readFile('sky-chart-default-sky-v1.js','utf8'),
  readFile('planetaryhours.html','utf8')
]);

assert.match(skyHtml,/sky-chart-default-sky-v1\.js\?v=1/);
assert.match(defaultSky,/const DEFAULT_KEY='relphiDefaultSkyIdV1'/);
assert.match(defaultSky,/data-ww-default-sky/);
assert.match(defaultSky,/Use this saved sky as the default reference for Planetary Hours/);
assert.match(defaultSky,/RelphiSkySavedSkyIdentity\?\.matchingRecord/);
assert.match(defaultSky,/localStorage\.setItem\(DEFAULT_KEY,id\)/);
assert.match(defaultSky,/localStorage\.removeItem\(DEFAULT_KEY\)/);
assert.match(planetaryHours,/id="calendarPersonalSkySelect"/);
assert.match(planetaryHours,/const defaultSkyStorageKey = 'relphiDefaultSkyIdV1'/);
assert.match(planetaryHours,/function defaultSkyRecord\(\)/);
assert.match(planetaryHours,/savedSkyRecordRef\(item\) === id/);
assert.match(planetaryHours,/setDefaultSkyId\(el\.calendarPersonalSkySelect\.value\)/);
assert.doesNotMatch(planetaryHours,/my birth chart/i);
assert.doesNotMatch(planetaryHours,/natalChartRecord/);

console.log('Default saved-sky reference is ID-based across Sky Chart and Planetary Hours.');
