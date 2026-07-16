const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const root = path.join(__dirname, '..');
const bundle = fs.readFileSync(path.join(root, 'sky-chart-wizard-v2.js'), 'utf8');
const nav = fs.readFileSync(path.join(root, 'navloader.js'), 'utf8');
const provenance = fs.readFileSync(path.join(root, 'sky-chart-provenance-fix.js'), 'utf8');

const encoded = bundle.match(/const encoded = '([^']+)'/);
assert.ok(encoded, 'The guided Sky Creator payload is missing.');
const source = zlib.gunzipSync(Buffer.from(encoded[1], 'base64')).toString('utf8');

[
  'Give this sky an identity',
  'What will you call this sky?',
  'Use existing sky data',
  'Calculate a sky',
  'Paste from Astro-Seek',
  'Enter placements manually',
  'Open a saved sky',
  'Here and Now',
  'Choose another time and place',
  'Nothing is applied until you press Create this sky.',
  'Sky B · comparison sky',
  'skyCreatorTarget',
  'skyCalcTarget',
  'skyCreatorSaveWizard',
  'relphiWizardPaste',
  'dataset.skyKind',
  'currentSky'
].forEach(fragment => assert.ok(source.includes(fragment), 'Missing Wizard behavior: ' + fragment));

assert.ok(!source.includes('Where and When</p>\n            <h3 id="skyWizardPrimaryHeading">Here and Now'), 'The retired permanent Here and Now heading returned.');
assert.ok(source.includes('Nothing is applied until you press Create this sky.'), 'Pasting can occur without an explicit commit boundary.');
assert.ok(source.includes('It was created in ${"currentSky"===n?"Sky B":"Sky A"} as its own named sky.'), 'The completion state does not preserve each sky as a separate named object.');

assert.ok(nav.includes("appendScript('sky-chart-wizard-v2.js?v=1')"), 'The live Sky Chart does not load the new Wizard.');
assert.ok(nav.includes("appendScript('sky-chart-provenance-fix.js?v=1')"), 'The factual provenance repair is not loaded.');
assert.ok(nav.includes("appendScript('sky-chart-relationship-color-hints.js?v=3')"), 'The Music Theory aspect colors are not cache-busted.');
assert.ok(provenance.includes("input.value.trim() === 'Planetary Hours date'"), 'The false Planetary Hours default is not removed.');
assert.ok(provenance.includes("if (params.has('name')) return"), 'An explicitly supplied sky name could be erased.');

console.log('intentional Sky Creator regression checks passed');
