import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('sky-chart-where-when-layout-density-v1.css','utf8');

assert.match(source,/\.sky-ph-jump-title\{[\s\S]*color:#191512!important;[\s\S]*text-decoration:none!important;/);
assert.doesNotMatch(source,/\.sky-ph-jump-title\{[\s\S]*color:#5b1715!important;/);
assert.doesNotMatch(source,/\.sky-ph-jump-title\{[\s\S]*text-decoration:underline!important;/);

console.log('Where and When Planetary Hours link style contract passed.');
