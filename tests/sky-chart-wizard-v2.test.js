const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'sky-chart-wizard-v2.js'), 'utf8');
const nav = fs.readFileSync(path.join(root, 'navloader.js'), 'utf8');
const page = fs.readFileSync(path.join(root, 'sky-chart.html'), 'utf8');
const provenance = fs.readFileSync(path.join(root, 'sky-chart-provenance-fix.js'), 'utf8');

assert.ok(!/const encoded = '[^']+'/.test(source), 'The retired compressed wizard payload returned.');
[
  'Give this sky an identity',
  'What will you call this sky?',
  'Use existing sky data',
  'Calculate a sky',
  'Here and Now',
  'skyCreatorTarget',
  'skyCalcTarget',
  'currentSky'
].forEach(fragment => assert.ok(source.includes(fragment), 'Missing Wizard behavior: ' + fragment));

assert.ok(!nav.includes("appendScript('sky-chart-wizard-v2.js?v=1')"), 'The retired wizard must not compete with the current foundation interface.');
assert.ok(page.includes('id="skyFoundationRoot"'), 'The current foundation interface is missing.');
assert.ok(page.includes('relphi-glyph-masters-v1.js?v=1'), 'The foundation must load the immutable glyph masters.');
assert.ok(nav.includes("'sky-chart-provenance-fix.js?v=1'"), 'The factual provenance repair is not listed for the legacy path.');
assert.ok(nav.includes("appendScript(preview === 'pr22' ? 'sky-chart-relationship-color-hints-pr22.js?v=1' : 'sky-chart-relationship-color-hints.js?v=3')"), 'The Music Theory aspect colors are not cache-busted.');
assert.ok(provenance.includes("input.value.trim() === 'Planetary Hours date'"), 'The false Planetary Hours default is not removed.');
assert.ok(provenance.includes("if (params.has('name')) return"), 'An explicitly supplied sky name could be erased.');

console.log('current Sky Creator regression checks passed');
