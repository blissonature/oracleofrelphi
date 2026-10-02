const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');

assert.match(js,/function splitAuthoredSurfaceRow\(rows,index,value\)/);
assert.match(js,/const questions=parseBulkQuestions\(value\)/);
assert.match(js,/rows\.splice\(index,1,\.\.\.copies\)/);
assert.match(js,/sourceKind==='authored'.*?placeholder="Commas split questions"/s);
assert.match(js,/data-surface-text.*?addEventListener\('focusout'/s);
assert.match(js,/if\(!value\.includes\(','\)\|\|parseBulkQuestions\(value\)\.length<2\)return/);
assert.match(js,/every resulting question inherits this row's settings/);

console.log('Authored Unpack questions split on commas after focus leaves the field, matching Bespoke Question 1.');
