const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('tarot.html','utf8');
const scss = fs.readFileSync('styles/relphi-design-system.scss','utf8');
const tokens = fs.readFileSync('styles/_tokens.scss','utf8');
const components = fs.readFileSync('styles/_components.scss','utf8');
const compiled = fs.readFileSync('relphi-design-system.css','utf8');
const crowley = fs.readFileSync('drawing-board-crowley-harmonic-v1.js','utf8');
const boardCss = fs.readFileSync('drawing-board-workflow-v2.css','utf8');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));

assert.match(pkg.scripts['styles:build'], /sass styles\/relphi-design-system\.scss relphi-design-system\.css/);
assert.match(scss, /@use "tokens"/);
assert.match(scss, /@use "components"/);
assert.match(tokens, /--relphi-board-red/);
[
  '.relphi-button',
  '.relphi-icon-button',
  '.relphi-field',
  '.relphi-select',
  '.relphi-panel',
  '.relphi-card',
  '.relphi-fieldset',
  '.relphi-tabs',
  '.relphi-drawer',
  '.relphi-fingerprint',
  '.relphi-fingerprint--vertical',
  '.relphi-badge',
  '.relphi-heading',
  '.relphi-eyebrow',
  '.relphi-toolbar',
  '.relphi-focus-surface'
].forEach(name => assert.ok(components.includes(name), 'missing SASS primitive '+name));

assert.ok(html.indexOf('relphi-design-system.css?v=1') < html.indexOf('drawing-board-workflow-v2.css?v=75'));
assert.match(compiled, /\.relphi-fingerprint--vertical/);
assert.match(crowley, /class="relphi-button relphi-button--primary"/);
assert.match(crowley, /class="relphi-fieldset"/);
assert.match(crowley, /class="relphi-focus-surface crowley-crafted-focus/);
assert.doesNotMatch(crowley, /#crowleyHarmonicGuide button,/);
assert.doesNotMatch(crowley, /#crowleySignificatorResults>button\{/);
assert.doesNotMatch(boardCss, /#shortListPanel\{--relphi-board-red:/);

console.log('Relphi SASS design-system foundation is canonical and Opening consumes it.');
