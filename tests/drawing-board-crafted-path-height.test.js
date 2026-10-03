const assert = require('node:assert/strict');
const fs = require('node:fs');

const css = fs.readFileSync('drawing-board-workflow-v2.css','utf8');

assert.match(css,/\.relphi-board-settings-panel \.relphi-reading-options-drawer \.relphi-options-body\{[\s\S]*align-content:start!important;[\s\S]*grid-auto-rows:max-content!important;/);
assert.match(css,/\.relphi-referent-paths\{[\s\S]*grid-auto-rows:max-content!important;[\s\S]*align-content:start!important;[\s\S]*align-self:start!important;/);
assert.match(css,/\.relphi-referent-path\{[\s\S]*align-self:start!important;/);

console.log('Crafted path tiles remain content-sized after shared settings removal.');
