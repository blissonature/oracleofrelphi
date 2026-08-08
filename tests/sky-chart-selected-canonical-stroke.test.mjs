import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const css = fs.readFileSync(path.join(root, 'sky-chart-final-integrated-v1.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'sky-chart.html'), 'utf8');

test('selected mini-wheel placement groups never inject a presentation stroke into canonical art', () => {
  assert.match(css, /\.sky-selected-aspect-point\{stroke:none;/);
  assert.doesNotMatch(css, /\.sky-selected-aspect-point\{[^}]*stroke:#fffdf8/);
  assert.match(css, /Lilith's crescent was acquiring a fraudulent white outline/);
});

test('Sky Chart cache-busts the selected endpoint stroke correction', () => {
  assert.match(html, /sky-chart-final-integrated-v1\.css\?v=2/);
});
