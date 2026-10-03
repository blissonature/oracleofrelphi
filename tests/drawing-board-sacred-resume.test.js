const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const css = fs.readFileSync('drawing-board-workflow-v2.css','utf8');

assert.match(js,/function interruptedSacredReading\(root=panel\(\)\)/);
assert.match(js,/function installSacredResumeGate\(root=panel\(\)\)/);
assert.match(js,/Sacred Reading Mode/);
assert.match(js,/Resume Sacred-Reading Mode/);
assert.match(js,/>Conclude</);
assert.match(js,/function concludeSacredReading\(root=panel\(\)\)/);
assert.match(js,/function resumeSacredReading\(root=panel\(\)\)/);
assert.match(js,/if\(installSacredResumeGate\(root\)\)return/);
assert.match(js,/if\(interruptedSacredReading\(root\)\)sacredResumeGateHandled=false/);
assert.match(css,/\.relphi-sacred-resume-gate/);
assert.match(css,/\.relphi-sacred-resume-actions/);

console.log('Sacred Reading resume/conclude lifecycle gate verified.');
