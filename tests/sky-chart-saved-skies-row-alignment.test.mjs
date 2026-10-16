import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source=fs.readFileSync('sky-chart-saved-skies-labels-v1.js','utf8');
const html=fs.readFileSync('sky-chart.html','utf8');
const privateSource=fs.readFileSync('sky-chart-saved-skies-private-load-v1.js','utf8');

test('Saved Skies aligns fingerprint, record identity and selection in one row',()=>{
  assert.match(source,/\.sky-saved-list-row\{\s*display:grid!important;/);
  assert.match(source,/\.sky-saved-list-item\[data-private-sky-fingerprint="true"\]\{\s*grid-column:1!important;\s*grid-row:1!important;/);
  assert.match(source,/grid-template-areas:"fingerprint copy check"!important/);
  assert.match(source,/\.sky-saved-fingerprint-triptych\{\s*grid-area:fingerprint!important;\s*grid-column:1!important;\s*grid-row:1!important;/);
  assert.match(source,/\.sky-saved-fingerprint-copy\{\s*grid-area:copy!important;\s*grid-column:2!important;\s*grid-row:1!important;/);
  assert.match(source,/\.sky-saved-list-check\{\s*grid-area:check!important;\s*grid-column:3!important;\s*grid-row:1!important;/);
  assert.match(source,/@media\(max-width:420px\)/);
  assert.match(source,/@media\(max-width:320px\)/);
  assert.ok(html.includes('sky-chart-saved-skies-labels-v1.js?v=9'));
});

test('Every Saved Sky row owns its own triptych and identity',()=>{
  assert.match(privateSource,/item\.replaceChildren\(triptych\(record\),check\)/);
  assert.match(source,/row\.querySelector\('\[data-saved-sky-ref\]\[data-private-sky-fingerprint="true"\]'\)/);
  assert.match(source,/item\.insertBefore\(copy,check\)/);
});
