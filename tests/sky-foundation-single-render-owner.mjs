import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=readFileSync('sky-chart-foundation-v2.js','utf8');
const render=s.slice(s.indexOf('async function render(force=false)'),s.indexOf('function start(){shell();'));
assert.ok(render.indexOf('rendering=true')<render.indexOf("await backfillKnownTimeChiron('A'"),'Acquire render ownership before first await');
assert.ok(render.includes('let renderSucceeded=false'),'Track successful work to avoid infinite failure retries');
assert.ok(render.includes('if(renderSucceeded&&(rerender||signature(read(KEYS.A),read(KEYS.B))!==lastSignature))'),'Catch one latest state after async work');
console.log('Foundation single-owner pre-await render guard passed');
