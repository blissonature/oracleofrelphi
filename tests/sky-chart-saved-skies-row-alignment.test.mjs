import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const labels=fs.readFileSync('sky-chart-saved-skies-labels-v1.js','utf8');
const base=fs.readFileSync('sky-chart-final-pass-v1.css','utf8');
const saved=fs.readFileSync('sky-chart-saved-skies-private-load-v1.js','utf8');
const html=fs.readFileSync('sky-chart.html','utf8');

test('Saved Skies overrides inherited 270px minimum SVG height',()=>{
  assert.match(base,/\.sky-ph-heptagram\s*\{[^}]*min-height:270px/s);
  assert.match(saved,/miniature\.classList\.add\('sky-saved-microheptagram'\)/);
  assert.match(labels,/#skySavedSkiesPopover \.sky-saved-canonical-heptagram > svg\.sky-saved-microheptagram\s*\{/);
  const block=labels.match(/#skySavedSkiesPopover \.sky-saved-canonical-heptagram > svg\.sky-saved-microheptagram\s*\{([^}]*)\}/)?.[1]||'';
  assert.match(block,/height:44px!important/);
  assert.match(block,/min-height:0!important/);
  assert.match(block,/max-height:44px!important/);
  assert.match(block,/transform:none!important/);
  assert.ok(html.includes('sky-chart-saved-skies-labels-v1.js?v=10'));
});

test('Saved Skies retains independent fingerprints per row',()=>{
  assert.match(saved,/item\.replaceChildren\(triptych\(record\),check\)/);
  assert.match(saved,/root\.append\(piece\('where',whereFingerprint\(record\)\)/);
});
