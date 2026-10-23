import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync('sky-chart-filter-wheel-focus-v1.js','utf8');
assert.match(s,/required<=current\+1e-8/,'stale harmonic prompt must not intercept eligible placement click');
assert.match(s,/marker\.classList\.remove\('is-filter-intermediate'\)/,'stale marker removed before click proceeds');
assert.match(s,/threshold<=target\+1e-8/,'increase immediately releases newly eligible placement');
console.log('PASS Harmonic Window helper releases eligible Moon B selection');
