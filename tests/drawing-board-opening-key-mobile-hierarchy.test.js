const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-crowley-harmonic-v1.js','utf8');

const gate = js.match(/function domainGateMarkup\(\)\{[\s\S]*?\n  \}/);
assert.ok(gate,'Opening domain gate markup must exist');
assert.match(gate[0],/Operation I · Question domain/);
assert.match(gate[0],/>Significator</);
assert.match(gate[0],/>Question domain</);
assert.match(gate[0],/>Invocation</);
assert.match(gate[0],/>Querent cut</);
assert.match(gate[0],/About Yod · Heh · Vav · Final Heh/);
assert.doesNotMatch(gate[0],/<b>[1234]\./);
assert.doesNotMatch(gate[0],/Commit to the expected domain/);

assert.match(js,/\.crowley-method-intro/);
assert.match(js,/\.crowley-domain-help/);
assert.match(js,/\.crowley-step-heading/);

console.log('Opening of the Key uses an unnumbered, compact ritual hierarchy with domain help disclosed on demand.');
