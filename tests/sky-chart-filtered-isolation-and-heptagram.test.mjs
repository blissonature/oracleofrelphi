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


test('configuration overlay does not double-stroke ordinary aspects and only appears for emphasis',()=>{
  const configurations=fs.readFileSync(path.join(root,'sky-chart-aspect-configurations-v1.css'),'utf8');
  assert.match(configurations,/\.sky-chart-configuration-line\{[^}]*stroke-width:4\.25;[^}]*opacity:0;/s);
  assert.match(configurations,/\.is-peer-hover \.sky-chart-configuration-line\.is-configuration-peer-line\{[^}]*opacity:\.96;/s);
  assert.doesNotMatch(configurations,/has-focus-composition \.sky-chart-configuration-line/);
  assert.match(html,/sky-chart-aspect-configurations-v1\.css\?v=33/);
  assert.match(html,/sky-chart-filter-wheel-focus-v1\.js\?v=9/);
});
