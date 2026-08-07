import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const html = fs.readFileSync(path.join(root, 'sky-chart.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'sky-chart-card-hits-v2.js'), 'utf8');

test('Sky Chart loads only the stable Chart Card Hits renderer', () => {
  assert.match(html, /sky-chart-card-hits-v2\.js\?v=1/);
  assert.doesNotMatch(html, /sky-chart-card-hits-v1\.js/);
});

test('Chart Card Hits lives outside the foundation-owned body', () => {
  assert.match(source, /document\.getElementById\(`skyFoundation\$\{slot\}`\)/);
  assert.match(source, /panel\.querySelector\(`:scope > \.sky-card-hits/);
  assert.match(source, /panel\.insertBefore\(section,body\.nextSibling\)|panel\.appendChild\(section\)/);
  assert.doesNotMatch(source, /body\.appendChild\(section\)/);
});

test('unchanged tallies do not recreate card images', () => {
  assert.match(source, /const renderSignature = \{ A:'', B:'' \}/);
  assert.match(source, /if \(renderSignature\[slot\] === signature && section\.firstElementChild\) \{\s*syncSelection\(slot,section,hits\);\s*return;/);
  assert.match(source, /renderSignature\[slot\] = signature;/);
});

test('selection changes update state without rebuilding card art', () => {
  assert.match(source, /function syncSelection\(slot,section,hits\)/);
  assert.match(source, /button\.setAttribute\('aria-pressed'/);
  assert.match(source, /if \(detail\.innerHTML !== markup\) detail\.innerHTML = markup;/);
  assert.match(source, /button\.focus\(\{preventScroll:true\}\);/);
});
