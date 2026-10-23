import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync('sky-chart-filter-wheel-focus-v1.js','utf8');
assert.match(s,/required<=current\+1e-8/,'stale harmonic prompt must not intercept eligible placement click');
assert.match(s,/marker\.classList\.remove\('is-filter-intermediate'\)/,'stale marker removed before click proceeds');
assert.match(s,/threshold<=target\+1e-8/,'increase immediately releases newly eligible placement');
assert.match(s,/helperAccepted\.add\(key\)/,'Accepting helper records permission to select placement');
assert.match(s,/if\(helperAccepted\.has\(key\)\)return/,'Accepted Moon B cannot have its subsequent click swallowed');
assert.match(s,/hiddenNearest\.has\(key\)&&!helperAccepted\.has\(key\)/,'Async sync must not rearm prompt on an accepted placement');
assert.match(s,/const visibleMatch=eligibleRows\(\)\.some/,'Check actual visible relationships before intercepting Moon B');
assert.match(s,/if\(visibleMatch\)\{/,'Visible relationship makes helper relinquish click');
console.log('PASS helper cannot intercept Moon B once there is a visible relationship at current Harmonic Window');

const ownership=s.slice(s.indexOf('function onPlacementClick('),s.indexOf('function clearMarks('));
assert.doesNotMatch(ownership,/stopImmediatePropagation|stopPropagation|preventDefault/,'Harmonic helper must NEVER block a placement click');
assert.doesNotMatch(s,/document\.addEventListener\('pointerdown',onPlacementClick/,'Harmonic helper must not intercept pointerdown');
assert.match(s,/document\.addEventListener\('click',onPlacementClick,true\)/,'Mouse click may show advisory helper without consuming event');
console.log('PASS helper cannot steal placement selection clicks');
