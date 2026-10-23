import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const orb=readFileSync('sky-chart-orb-control-v1.js','utf8');
const scope=readFileSync('sky-chart-relationship-scope-sections-v1.js','utf8');
const vocab=readFileSync('sky-chart-relationship-vocab-v1.js','utf8');
assert.ok(scope.includes('desired.push(...helpers)'),'Relationship sort retains helpers after matches');
assert.ok(!orb.includes('else if(button!==list.lastElementChild)list.appendChild(button)'),'Orb controller does not compete for helper ordering');
assert.ok(!vocab.includes("svg.style.visibility='hidden';holder.appendChild(svg)"),'Glyph does not start permanently invisible');
console.log('Relationships helper order and glyph visibility regression passed');
