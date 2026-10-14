import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const js=fs.readFileSync('sky-chart-foundation-v2.js','utf8');
const html=fs.readFileSync('sky-chart.html','utf8');
test('Sky Card retrograde marker uses explicit motion or stored-instant fallback',()=>{
 assert.match(js,/function recordRetrograde\(record,payload\)/);
 assert.match(js,/typeof item\.retrograde==='boolean'/);
 assert.match(js,/typeof item\.isRetrograde==='boolean'/);
 assert.match(js,/function retrogradeAtInstant\(record,payload\)/);
 assert.match(js,/profile\(payload\)\.instant/);
 assert.match(js,/GeoVector\(name,date,true\)/);
 assert.match(js,/recordRetrograde\(record,payload\)/);
 assert.ok(html.includes('sky-chart-foundation-v2.js?v=31'));
});
