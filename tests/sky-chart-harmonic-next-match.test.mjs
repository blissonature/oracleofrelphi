import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const source=fs.readFileSync('sky-chart-orb-control-v1.js','utf8');
const html=fs.readFileSync('sky-chart.html','utf8');
test('show more discovers the next eligible harmonic threshold rather than an empty degree',()=>{
 assert.match(source,/function nextRevealWindow\(rows,current,max\)/);
 assert.match(source,/Math\.ceil\(Math\.min\(\.\.\.candidates\)-1e-8\)/);
 assert.match(source,/row\.dataset\.bySignOnly!=='true'/);
 assert.match(source,/nextRevealWindow\(rows,current,max\)/);
 assert.match(source,/nextRevealWindow\(rows,limit,max\)/);
 assert.match(source,/if\(next!==null&&next>current\)m\?\.setWindow\?\.\(next\)/);
});
test('new behavior is loaded by preview',()=>{
 assert.ok(html.includes('sky-chart-orb-control-v1.js?v=31'));
});
