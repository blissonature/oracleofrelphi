import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const sortSource=readFileSync('sky-chart-relationship-sort-v1.js','utf8');
const scopeSource=readFileSync('sky-chart-relationship-scope-sections-v1.js','utf8');
const timingSource=readFileSync('sky-chart-relationship-timing-fix-v1.js','utf8');
const pageSource=readFileSync('sky-chart.html','utf8');

// The registered comparator—not a parallel mock implementation—decides the order.
const window={dispatchEvent(){}};
const document={readyState:'loading',addEventListener(){},getElementById(){return null},
  createElement(){return{style:{}}},head:{appendChild(){}}};
runInNewContext(sortSource,{window,document,location:{pathname:'/sky-chart.html'},
  setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(){},
  CustomEvent:class{constructor(type){this.type=type}},console});
const api=window.RelphiRelationshipSort;
assert.ok(api,'Existing Relationships sort owner must register');
function row(age,scope,index){
  return{dataset:{...(age===null?{}:{transitStartedDaysAgo:String(age)}),
    relationshipMode:scope,relationIndex:String(index),phaseError:String(index),harmonicOrder:'1',sourceOrb:'0.1'}};
}
const rows=[row(2,'A-B',1),row(365,'B-B',2),row(null,'A-A',3),row(18,'A-A',4),row(90,'A-B',5)];
api.setMode('began-longest-ago');
assert.equal(api.mode(),'began-longest-ago');
assert.deepEqual([...rows].sort(api.compareRows).map(x=>Number(x.dataset.relationIndex)),[2,5,4,1,3],
  'Longest ago must rank greatest time-since-start first, across all sky scopes; missing timings remain last');
api.setMode('began-most-recently');
assert.deepEqual([...rows].sort(api.compareRows).map(x=>Number(x.dataset.relationIndex)),[1,4,5,2,3],
  'Most recently must remain its precise reverse, with missing timings still last');

assert.match(sortSource,/\[MODES\.beganLongestAgo,'Began Longest Ago'\]/);
assert.match(scopeSource,/GLOBAL_SORTS=new Set\(\[[^\n]*'began-longest-ago'/);
assert.match(timingSource,/TIMING_MODES=new Set\(\[[^\n]*'began-longest-ago'/);
assert.match(pageSource,/sky-chart-relationship-sort-v1\.js\?v=16/);
assert.match(pageSource,/sky-chart-relationship-timing-fix-v1\.js\?v=5/);
assert.match(pageSource,/sky-chart-relationship-scope-sections-v1\.js\?v=19/);
console.log('Began Longest Ago: comparator reversal, global scopes, incomplete timing and script ownership PASS');
