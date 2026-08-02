const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'sky-chart-final-pass-v1.js'), 'utf8');

assert.match(source, /button\.addEventListener\('click',\(\)=>updateToNow\(slot,button\)\)/);
assert.match(source, /async function currentLocationPacket\(\)/);
assert.match(source, /navigator\.geolocation\.getCurrentPosition/);
assert.match(source, /timezone=String\(zone\.timezone\|\|''\)/);
assert.match(source, /const packet=await currentLocationPacket\(\)/);
assert.match(source, /selectCurrentLocation\(slot,packet\)/);
assert.match(source, /DateTime\?\.now\(\)\.setZone\(packet\.timezone\)/);
assert.match(source, /sky-where-when-editor'\)\?\.requestSubmit\(\)/);
assert.doesNotMatch(source, /if\(!profile\.location\|\|!profile\.timeZone\)/);

console.log('Sky Chart Here and Now regression checks passed.');
