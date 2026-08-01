const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'sky-chart-where-when-v1.js'), 'utf8');
assert.doesNotMatch(source, /placeholder="[^"]*Malden/i);
assert.match(source, /placeholder="Ex\. City, State or Country"/);

console.log('Sky Chart location privacy regression checks passed.');
