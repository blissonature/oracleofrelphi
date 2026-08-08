import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const selected = fs.readFileSync(path.join(root, 'sky-chart-selected-relationship-v4.js'), 'utf8');
const progressive = fs.readFileSync(path.join(root, 'sky-chart-progressive-comparison-v1.js'), 'utf8');

test('selected relationship uses the historical exact mini-wheel coordinate method', () => {
  assert.match(selected, /function miniPoint\(degree,radius\)\{const angle=\(norm\(degree\)-180\)\*Math\.PI\/180;/);
  assert.match(selected, /const a=ASPECTS\[r\.aspect\.id\],pointA=miniPoint\(r\.left\.value,MINI\.aspectRadius\),pointB=miniPoint\(r\.right\.value,MINI\.aspectRadius\)/);
  assert.match(selected, /class="sky-selected-aspect-radius sky-a"[^>]+x2="\$\{pointA\.x\}" y2="\$\{pointA\.y\}"/);
  assert.match(selected, /class="sky-selected-aspect-radius sky-b"[^>]+x2="\$\{pointB\.x\}" y2="\$\{pointB\.y\}"/);
  assert.match(selected, /class="sky-selected-isolated-aspect"[^>]+x1="\$\{pointA\.x\}" y1="\$\{pointA\.y\}" x2="\$\{pointB\.x\}" y2="\$\{pointB\.y\}"/);
  assert.match(selected, /data-mini-placement="left" transform="translate\(\$\{pointA\.x\} \$\{pointA\.y\}\)"/);
  assert.match(selected, /data-mini-placement="right" transform="translate\(\$\{pointB\.x\} \$\{pointB\.y\}\)"/);
  assert.match(selected, /data-zodiac-origin="aries-0-at-9"/);
});

test('progressive reveal remains connected beneath the selected mini wheel', () => {
  assert.match(selected, /<section class="sky-selected-progressive" aria-label="Progressive comparison reading"><\/section>/);
  assert.match(selected, /dispatchEvent\(new CustomEvent\('relphi:selected-relationship-rendered'/);
  assert.match(progressive, /panel\?\.querySelector\('\.sky-selected-progressive'\)/);
  assert.match(progressive, /window\.addEventListener\('relphi:selected-relationship-rendered',render\)/);
});
