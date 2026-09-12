import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('sky-chart-relationship-scope-sections-v1.js','utf8');

assert.match(source,/GLOBAL_SIGNIFICANCE_SORTS=new Set\(\['most-supportive','most-challenging'\]\)/);
assert.match(source,/if\(sortMode==='most-challenging'\)return\(a,b\)=>-supportiveCompare\(a,b,rows,familyCache\)/);
assert.doesNotMatch(source,/GLOBAL_TIMING_SORTS=new Set\([^\n]*began-most-recently/);
assert.doesNotMatch(source,/sortMode==='began-most-recently'\)return/);
assert.match(source,/if\(sorter\?\.compareRows\)section=section\.slice\(\)\.sort\(sorter\.compareRows\)/);
assert.match(source,/"Began Most Recently" is intentionally excluded/);

console.log('Relationship sort scope contract passed.');
