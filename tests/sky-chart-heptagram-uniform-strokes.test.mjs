import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const css=fs.readFileSync('sky-chart-heptagram-geometry-v1.css','utf8');
const html=fs.readFileSync('sky-chart.html','utf8');

test('Every Sky Chart heptagram size shares the microheptagram stroke contract',()=>{
  for(const selector of ['.sky-ph-heptagram','.sky-where-fingerprint-heptagram','.sky-saved-microheptagram']){
    for(const line of ['.sky-ph-week-segment','.sky-ph-hour-segment']){
      assert.ok(css.includes(selector+' '+line),selector+' '+line+' is covered');
    }
  }
  assert.match(css,/stroke-width:5!important/);
  assert.match(css,/stroke-dasharray:none!important/);
  assert.match(css,/vector-effect:none!important/);
  assert.match(css,/filter:none!important/);
  assert.doesNotMatch(css,/stroke-dasharray:\s*[\d.]+/);
  assert.doesNotMatch(css,/stroke-width:\s*5\.5/);
  assert.ok(html.includes('sky-chart-heptagram-geometry-v1.css?v=3'));
});

test('Traced week is uniformly red and future paths are solid gray',()=>{
  assert.match(css,/\.sky-ph-heptagram \.sky-ph-week-segment\.past/);
  assert.match(css,/\.sky-ph-heptagram \.sky-ph-week-segment\.current/);
  assert.match(css,/\.sky-ph-heptagram \.sky-ph-week-segment\.future/);
  assert.match(css,/stroke:#c9211e!important/);
  assert.match(css,/stroke:#77736e!important/);
});
