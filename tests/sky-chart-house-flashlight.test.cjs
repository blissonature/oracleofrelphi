const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {polar,segments}=require('../sky-chart-house-flashlight-v1.js');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'sky-chart.html'),'utf8');
const source=fs.readFileSync(path.join(root,'sky-chart-foundation-v2.js'),'utf8');
const controller=fs.readFileSync(path.join(root,'sky-chart-house-flashlight-v1.js'),'utf8');
const interactions=fs.readFileSync(path.join(root,'sky-chart-foundation-interactions-v2.js'),'utf8');
test('cusp rays use same-degree geometry as canonical shared zodiac wheel',()=>{
 const p=polar({x:600,y:600},414,180);
 assert.ok(Math.abs(p.x-1014)<1e-6);
 assert.ok(Math.abs(p.y-600)<1e-6);
 const q=polar({x:600,y:600},414,90);
 assert.ok(Math.abs(q.x-600)<1e-6);
 assert.ok(Math.abs(q.y-186)<1e-6);
});
test('A house illumination crosses A ring, zodiac ring, and B house ring',()=>{
 assert.deepEqual(segments({slot:'A',inside:166,zIn:323,zOut:414,outside:574,comparable:true}),[
 {role:'home',from:166,to:323},{role:'zodiac',from:323,to:414},{role:'other',from:414,to:574}
 ]);
});
test('B illumination reaches inward through zodiac into A house ring',()=>{
 assert.deepEqual(segments({slot:'B',inside:166,zIn:323,zOut:414,outside:574,comparable:true}),[
 {role:'other',from:166,to:323},{role:'zodiac',from:323,to:414},{role:'home',from:414,to:574}
 ]);
});
test('standalone A rays stop at zodiac outer edge and unknown-time B is excluded',()=>{
 assert.deepEqual(segments({slot:'A',inside:166,zIn:323,zOut:414,outside:414,comparable:false}),[
 {role:'home',from:166,to:323},{role:'zodiac',from:323,to:414}
 ]);
 assert.equal(segments({slot:'B',inside:166,zIn:323,zOut:414,outside:414,comparable:false}),null);
 assert.equal(segments({slot:'C',inside:166,zIn:323,zOut:414,outside:574,comparable:true}),null);
});
test('flashlight derives cusps from the rendered sectors and accepts house focus bridge events',()=>{
 assert.match(source,/'data-house-cusp-start':String\(norm\(start\)\)/);
 assert.match(source,/'data-house-cusp-end':String\(norm\(end\)\)/);
 assert.match(controller,/data-house-cusp-start/);
 assert.match(controller,/relphi:sky-house-focus-bridge-changed/);
 assert.match(controller,/relphi:sky-foundation-ready/);
 assert.match(controller,/pointerover/);
 assert.match(controller,/pointerout/);
 assert.match(controller,/pointer-events':'none'/);
 assert.match(html,/sky-chart-house-flashlight-v1\.js/);
 assert.match(html,/sky-chart-house-flashlight-v1\.css/);
});

test('comparison-sky house focus is geometric, not matched by house number',()=>{
 assert.match(interactions,/function houseFocusPlacements\(state\)/);
 assert.match(interactions,/norm\(record.value-start\)<span/);
 assert.match(interactions,/rowMatchesState\(row,filterState,filterKeep\.houseKeys\)/);
});
