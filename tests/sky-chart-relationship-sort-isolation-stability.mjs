import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('sky-chart-relationship-sort-v1.js','utf8');
const match=source.match(/function rowEligibleForSignificanceFamily\(row\)\{([\s\S]*?)\n\}/);
assert.ok(match,'rowEligibleForSignificanceFamily must exist');

const body=match[1];
assert.doesNotMatch(body,/row\.hidden|getAttribute\?\.\('aria-hidden'\)/,'transient wheel isolation must not alter significance-family membership');
assert.match(body,/SIGNIFICANCE_HIDDEN_CLASSES\.some/,'persistent relationship filters must still remove rows from significance-family ranking');

console.log('Relationship sort isolation stability contract passed.');
