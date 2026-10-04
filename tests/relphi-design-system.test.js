const assert = require('node:assert/strict');
const fs = require('node:fs');

const tarotHtml = fs.readFileSync('tarot.html','utf8');
const skyHtml = fs.readFileSync('sky-chart.html','utf8');
const scss = fs.readFileSync('styles/relphi-design-system.scss','utf8');
const tokens = fs.readFileSync('styles/_tokens.scss','utf8');
const components = fs.readFileSync('styles/_components.scss','utf8');
const compiled = fs.readFileSync('relphi-design-system.css','utf8');
const crowley = fs.readFileSync('drawing-board-crowley-harmonic-v1.js','utf8');
const boardJs = fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const boardCss = fs.readFileSync('drawing-board-workflow-v2.css','utf8');
const skyWhereWhen = fs.readFileSync('sky-chart-where-when-v3.js','utf8');
const skyWhereWhenCss = fs.readFileSync('sky-chart-where-when-v1.css','utf8');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));

assert.match(pkg.scripts['styles:build'], /sass styles\/relphi-design-system\.scss relphi-design-system\.css/);
assert.match(scss, /@use "tokens"/);
assert.match(scss, /@use "components"/);
assert.match(tokens, /--relphi-board-red/);
assert.match(tokens, /--relphi-action-active-bg/);
assert.match(tokens, /--relphi-control-height-compact/);

[
  '.relphi-button',
  '.relphi-control--compact',
  '.relphi-icon-button',
  '.relphi-icon-button--utility',
  '.relphi-field',
  '.relphi-select',
  '.relphi-panel',
  '.relphi-card',
  '.relphi-fieldset',
  '.relphi-tabs',
  '.relphi-drawer',
  '.relphi-fingerprint',
  '.relphi-badge',
  '.relphi-heading',
  '.relphi-eyebrow',
  '.relphi-toolbar',
  '.relphi-focus-surface'
].forEach(name => assert.ok(components.includes(name), 'missing SASS primitive '+name));
['primary','secondary','utility','danger'].forEach(role => {
  assert.match(components,new RegExp('&--'+role+'\\s*\\{'),'missing SASS action role '+role);
});
assert.match(components,/&--vertical\s*\{/,'missing SASS fingerprint vertical modifier');

assert.ok(tarotHtml.indexOf('relphi-design-system.css?v=2') < tarotHtml.indexOf('drawing-board-workflow-v2.css?v=75'));
assert.ok(skyHtml.includes('relphi-design-system.css?v=2'),'Sky Chart must consume the shared Relphi design system');
assert.match(compiled, /\.relphi-button--secondary/);
assert.match(compiled, /\.relphi-button--utility/);
assert.match(compiled, /\.relphi-button--danger/);
assert.match(compiled, /\.relphi-control--compact/);
assert.match(compiled, /\.relphi-fingerprint--vertical/);

assert.match(crowley, /class="relphi-button relphi-button--primary"/);
assert.match(crowley, /class="relphi-fieldset"/);
assert.match(crowley, /class="relphi-focus-surface crowley-crafted-focus/);
assert.doesNotMatch(crowley, /#crowleyHarmonicGuide button,/);
assert.doesNotMatch(crowley, /#crowleySignificatorResults>button\{/);

assert.match(boardJs, /relphi-button--primary/);
assert.match(boardJs, /relphi-button--secondary/);
assert.match(boardJs, /relphi-button--utility/);
assert.match(boardJs, /relphi-button--danger/);
assert.match(skyWhereWhen, /relphi-button--primary/);
assert.match(skyWhereWhen, /relphi-button--secondary/);
assert.match(skyWhereWhen, /relphi-button--utility/);

assert.doesNotMatch(boardCss, /#shortListPanel\{--relphi-board-red:/);
assert.doesNotMatch(skyWhereWhenCss, /\.sky-where-when-button\.primary\s*\{/);
assert.doesNotMatch(skyWhereWhenCss, /\.sky-where-when-button\.secondary\s*\{/);

console.log('Relphi SASS design system is canonical across Tarot Ledger and Sky Chart actions.');
