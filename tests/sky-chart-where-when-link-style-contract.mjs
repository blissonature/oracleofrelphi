import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('sky-chart-where-when-layout-density-v1.css','utf8');

const titleRule=source.match(/\.sky-where-when-editor \.sky-where-when-heptagram-slot \.sky-ph-jump-title\{([\s\S]*?)\n\}/)?.[1]||'';
assert.match(titleRule,/color:#211d19!important;/);
assert.match(titleRule,/text-decoration:none!important;/);
assert.match(titleRule,/border:1px solid rgba\(31,27,24,\.24\)!important;/);
assert.match(titleRule,/border-radius:999px!important;/);
assert.match(titleRule,/background:#fff!important;/);
assert.doesNotMatch(titleRule,/color:#5b1715!important;/);
assert.doesNotMatch(titleRule,/text-decoration:underline!important;/);

console.log('Where and When Planetary Hours pill style contract passed.');
