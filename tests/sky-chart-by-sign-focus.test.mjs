import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const matrix=fs.readFileSync('sky-chart-aspect-scope-matrix-v1.js','utf8');
const between=fs.readFileSync('sky-chart-foundation-interactions-v2.js','utf8');
const within=fs.readFileSync('sky-chart-intrasky-a-v1.js','utf8');
const harmonic=fs.readFileSync('sky-chart-orb-control-v1.js','utf8');
const html=fs.readFileSync('sky-chart.html','utf8');
test('By Sign has seven individual options and an indeterminate master',()=>{
 assert.match(matrix,/SIGN_ASPECTS=Object.freeze\(\['conjunction','semi-sextile','sextile','square','trine','quincunx','opposition'\]\)/);
 assert.match(matrix,/signChoice\('all'\)/);
 assert.match(matrix,/signChoice\(aspect.id\)/);
 assert.match(matrix,/input.indeterminate=id==='all'/);
 assert.match(matrix,/localStorage.setItem\(SIGN_STORAGE/);
});
test('By Sign produces independent candidate relationships for each scope',()=>{
 for(const source of [between,within]){
  assert.match(source,/bySignOnly:true/);
  assert.match(source,/bySign.enabled\(aspect.id\)/);
  assert.match(source,/bySign.steps\[aspect.id\]!==steps/);
  assert.match(source,/relphi:sky-by-sign-changed/);
 }
 assert.match(matrix,/node\?\.dataset\?\.bySignOnly==='true'/);
 assert.match(harmonic,/row.dataset.bySignOnly!=='true'/);
});
test('required script versions refreshed',()=>{
 for(const path of ['sky-chart-intrasky-a-v1.js?v=10','sky-chart-foundation-interactions-v2.js?v=25','sky-chart-orb-control-v1.js?v=30','sky-chart-aspect-scope-matrix-v1.js?v=17','sky-chart-aspect-multiselect-v1.css?v=7'])assert.ok(html.includes(path));
});
