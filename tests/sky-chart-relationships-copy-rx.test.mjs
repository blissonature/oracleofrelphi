import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const read=name=>fs.readFileSync(name,'utf8');
const html=read('sky-chart.html');

test('Relationships copy serializes Rx independently on each sky-owned endpoint',()=>{
 const copy=read('sky-chart-relationship-copy-v1.js');
 const scope=read('sky-chart-relationship-scope-sections-v1.js');
 for(const js of [copy,scope]){
   assert.match(js,/RelphiSkyRetrograde\?\.forPlacement\?\.\(sky,id\)/);
   assert.match(js,/placementWithMotion\(row,'left',/);
   assert.match(js,/placementWithMotion\(row,'right',/);
   assert.match(js,/\?' Rx':''/);
 }
 assert.ok(/sky-chart-relationship-copy-v1\.js\?v=\d+/.test(html));
 assert.ok(html.includes('sky-chart-relationship-scope-sections-v1.js?v=13'));
});

test('Expanded semantic relationship copy includes Rx on the appropriate planet name',()=>{
 const js=read('sky-chart-inline-relationship-copy-v1.js');
 assert.match(js,/const sky=rowSky\(row,side\),retrograde=sky&&id&&window.RelphiSkyRetrograde\?\.forPlacement\?\.\(sky,id\)/);
 assert.match(js,/name:placementName\(id\)\+\(retrograde\?' Rx':''\)/);
 assert.ok(/sky-chart-inline-relationship-copy-v1\.js\?v=\d+/.test(html));
});
