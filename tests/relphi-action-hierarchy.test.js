const assert = require('node:assert/strict');
const fs = require('node:fs');

const components = fs.readFileSync('styles/_components.scss','utf8');
const boardJs = fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const boardCss = fs.readFileSync('drawing-board-workflow-v2.css','utf8');
const skyJs = fs.readFileSync('sky-chart-where-when-v3.js','utf8');
const skyCss = fs.readFileSync('sky-chart-where-when-v1.css','utf8');
const densityCss = fs.readFileSync('sky-chart-where-when-layout-density-v1.css','utf8');

function blocksContaining(css, token) {
  const blocks=[];
  const re=/([^{}]+)\{([^{}]*)\}/g;
  let match;
  while((match=re.exec(css))) {
    if(match[1].includes(token)) blocks.push({selector:match[1].trim(),body:match[2]});
  }
  return blocks;
}
function assertNoFeatureSkin(css, token, label) {
  const forbidden=/\b(?:background(?:-color)?|border(?:-color|-radius)?|color|font(?:-size|-weight)?|box-shadow)\s*:/;
  for(const block of blocksContaining(css,token)) {
    assert.doesNotMatch(block.body,forbidden,label+' must not be reskinned by feature CSS: '+block.selector);
  }
}

// Canonical hierarchy is authored in SASS.
assert.match(components,/&--primary\s*\{/);
assert.match(components,/&--secondary\s*\{/);
assert.match(components,/&--utility\s*\{/);
assert.match(components,/&--danger\s*\{/);
assert.match(components,/&\.is-active,[\s\S]*?var\(--relphi-action-active-bg\)/);

// Drawing Board semantics: Draw / Settings / Reset / utilities.
assert.match(boardJs,/draw\.classList\.add\('relphi-button','relphi-button--primary','relphi-control--compact'\)/);
assert.match(boardJs,/settingsButton\.classList\.add\('relphi-button','relphi-button--secondary','relphi-control--compact'\)/);
assert.match(boardJs,/reset\.classList\.add\('relphi-button','relphi-button--danger','relphi-control--compact'\)/);
assert.match(boardJs,/clear\.classList\.add\('relphi-button','relphi-button--utility','relphi-control--compact'\)/);
assert.match(boardJs,/relphi-icon-button--utility/);

// Where & When semantics: commit / high-level shortcut / utilities.
assert.match(skyJs,/sky-where-when-here-now[^"]*relphi-button--secondary/);
assert.match(skyJs,/relphi-button--utility[^>]*data-ww-action="use-here"/);
assert.match(skyJs,/relphi-button--utility[^>]*data-ww-action="search-location"/);
assert.match(skyJs,/sky-use-now-button[^"]*relphi-button--utility/);
assert.match(skyJs,/sky-where-when-cancel[^"]*relphi-button--secondary/);
assert.match(skyJs,/relphi-button--primary[^>]*type="submit"/);

// Feature CSS may arrange semantic actions, but may not invent their skin.
assertNoFeatureSkin(boardCss,'#relphiBoardSettingsButton','Drawing Board Settings');
assertNoFeatureSkin(boardCss,'#relphiResetBoard','Drawing Board Reset');
assertNoFeatureSkin(boardCss,'#drawRandomRowCard','Drawing Board Draw');
assertNoFeatureSkin(boardCss,'#clearShortListCardsOnly','Drawing Board Clear');
assertNoFeatureSkin(skyCss,'.sky-where-when-button','Sky Chart Where and When buttons');

const footerButtonBlocks=blocksContaining(densityCss,'.sky-where-when-footer-actions .sky-where-when-button');
for(const block of footerButtonBlocks) {
  assert.doesNotMatch(block.body,/\b(?:padding|font-size|line-height|min-height|height)\s*:/,'Where and When footer layout must not resize branded buttons');
}

console.log('Relphi action hierarchy uses one SASS-owned visual brand.');
