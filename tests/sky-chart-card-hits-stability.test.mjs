import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const source = fs.readFileSync(path.join(root, 'sky-chart-card-hits-v1.js'), 'utf8');

test('Chart Card Hits keeps existing card-art DOM when the tally is unchanged', () => {
  assert.match(source, /const renderSignature = \{ A:'', B:'' \}/);
  assert.match(source, /if \(renderSignature\[slot\] === signature && section\.firstElementChild\) \{\s*syncSelection\(slot,section,hits\);\s*return;/);
  assert.match(source, /renderSignature\[slot\] = signature;/);
});

test('selection changes update state without requiring image replacement', () => {
  assert.match(source, /function syncSelection\(slot,section,hits\)/);
  assert.match(source, /button\.setAttribute\('aria-pressed'/);
  assert.match(source, /if \(detail\.innerHTML !== markup\) detail\.innerHTML = markup;/);
  assert.match(source, /button\.focus\(\{preventScroll:true\}\);/);
});

test('card art still has a stable source URL', () => {
  assert.match(source, /assets\/tarot\/rws\/\$\{encodeURIComponent\(card\.card_id\)\}\.webp\?v=chart-card-hits-v1/);
});
