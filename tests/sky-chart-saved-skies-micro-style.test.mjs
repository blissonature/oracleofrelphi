import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const js=fs.readFileSync('sky-chart-saved-skies-private-load-v1.js','utf8');
const html=fs.readFileSync('sky-chart.html','utf8');
const begin=js.indexOf('function savedSkyRuler(');
const end=js.indexOf('\nfunction placementSource(',begin);
assert.ok(begin>=0&&end>begin,'Saved Skies microheptagram renderer is present');
const render=js.slice(begin,end);

test('picker uses full weekly and hourly geometry with seven ruler positions',()=>{
 assert.match(render,/CHALDEAN\.forEach\(\(key,index\)=>line/);
 assert.match(render,/CHALDEAN\.forEach\(key=>savedSkyRuler/);
 assert.match(render,/root\.dataset\.dayRuler=dayKey/);
 assert.match(render,/root\.dataset\.hourRuler=current\.ruler/);
 assert.match(render,/if\(!day&&!hour\)/);
 assert.match(render,/class:'sky-ph-micro-idle-node'/);
 assert.match(render,/17\/19\*1\.45/);
 assert.match(render,/component\.createBubble\(master,entry\.id/);
});
test('picker styling has solid gray future paths and one red weight',()=>{
 const block=js.slice(js.indexOf('/* Match the approved Sky Card'),js.indexOf('.sky-saved-fingerprint-piece .sky-card-hits-fingerprint-strip'));
 assert.match(block,/stroke-width:5!important;stroke-dasharray:none!important/);
 assert.match(block,/stroke:#77736e!important/);
 assert.match(block,/stroke:#c9211e!important/);
 assert.match(block,/sky-ph-week-segment\.current/);
 assert.match(block,/sky-ph-hour-segment\.current/);
 assert.match(block,/sky-saved-microheptagram \*\{vector-effect:none!important\}/);
 assert.doesNotMatch(block,/stroke-dasharray:[^n]/);
});
test('new renderer is loaded with a fresh cache key',()=>{
 assert.match(html,/sky-chart-saved-skies-private-load-v1\.js\?v=5/);
});
