import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root=path.resolve(import.meta.dirname,'..');
const orb=fs.readFileSync(path.join(root,'sky-chart-orb-control-v1.js'),'utf8');
const heptagramCss=fs.readFileSync(path.join(root,'sky-chart-heptagram-geometry-v1.css'),'utf8');
const html=fs.readFileSync(path.join(root,'sky-chart.html'),'utf8');

test('placement isolation cannot keep endpoints whose relationships are filtered out',()=>{
  assert.match(orb,/function reconcilePlacementIsolation\(rows,visibleIndexes\)/);
  assert.match(orb,/if\(wheelState\?\.kind!=='placement'\)return/);
  assert.match(orb,/keptPlacements\.add\(`A:\$\{row\.dataset\.leftPlacement\}`\)/);
  assert.match(orb,/keptPlacements\.add\(`B:\$\{row\.dataset\.rightPlacement\}`\)/);
  assert.match(orb,/node\.classList\.toggle\('is-kept',keptPlacements\.has\(key\)\)/);
  assert.match(orb,/reconcilePlacementIsolation\(rows,visibleIndexes\)/);
});

test('the undrawn weekly heptagram path is dotted while traced time stays solid',()=>{
  assert.match(heptagramCss,/\.sky-ph-week-segment\.future\{stroke-dasharray:2\.5 6;stroke-linecap:round\}/);
  assert.match(heptagramCss,/\.sky-ph-week-segment\.past\{[^}]*stroke-dasharray:none/);
  assert.match(heptagramCss,/\.sky-ph-week-segment\.current\{[^}]*stroke-dasharray:none/);
  assert.match(html,/sky-chart-heptagram-geometry-v1\.css\?v=2/);
  assert.match(html,/sky-chart-orb-control-v1\.js\?v=4/);
});
