import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const inline=readFileSync('sky-chart-inline-relationship-v5.js','utf8');
const wheel=readFileSync('sky-chart-foundation-interactions-v2.js','utf8');
assert.match(inline,/if\(openRow&&openRow!==row\)close\(openRow\);\s*if\(!row\.classList\.contains\('is-inline-expanded'\)\)open\(row\)/,'Wheel-triggered tile expansion must close prior tile first');
assert.match(inline,/collapse\(\)\{\s*if\(openRow\)close\(openRow\)/,'Expose collapse to clear selection');
assert.match(wheel,/window\.RelphiInlineRelationship\?\.collapse\?\.\(\)/,'Changing to a non-aspect selection collapses the tile');
const hover=wheel.slice(wheel.indexOf('function setHover'),wheel.indexOf('function toggleInteractiveNode'));assert.ok(!hover.includes('RelphiInlineRelationship?.collapse'),'Hover must not collapse a tile');
console.log('Exclusive tile selection contract passed');
