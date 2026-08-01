const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('sky-chart-heptagram-canonical-v1.js', 'utf8');

assert.match(source, /canonicalHeptagramV1 === 'pending'/,
  'A heptagram correction already in progress must not be started again by its own DOM mutations.');
assert.match(source, /canonicalHeptagramV1 = 'pending'/,
  'The correction must mark the SVG before it begins mutating the heptagram.');
assert.match(source, /delete svg\.dataset\.canonicalHeptagramV1/,
  'A failed or incomplete correction must clear the in-progress marker so it can be retried.');
