import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('sky-chart-where-when-layout-density-v1.css','utf8');
const draft=fs.readFileSync('sky-chart-where-when-draft-heptagram-v4.js','utf8');

const linkRule=source.match(/\.sky-where-when-editor \.sky-where-when-heptagram-slot \.sky-ph-jump\{([\s\S]*?)\n\}/)?.[1]||'';
assert.match(linkRule,/width:176px!important;/);
assert.match(linkRule,/border-radius:50%!important;/);
assert.match(linkRule,/background:transparent!important;/);
assert.match(linkRule,/cursor:pointer!important;/);
assert.match(source,/\.sky-ph-jump:focus-visible\{[\s\S]*?outline:2px solid #2462d0!important;/);
assert.doesNotMatch(source,/\.sky-ph-jump-title\{/);
assert.doesNotMatch(draft,/Jump to this time in Planetary Hours/);
assert.match(draft,/aria-label','Open this moment in Planetary Hours'/);

console.log('Where and When heptagram-only Planetary Hours link style contract passed.');
