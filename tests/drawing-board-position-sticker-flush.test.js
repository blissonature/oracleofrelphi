const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync('drawing-board-workflow-v2.css','utf8');
const rule=css.split('\n').find(line=>line.startsWith('#shortListPanel .card-row-workspace .card-row-item>.card-row-position-panel{'));
assert.ok(rule,'position sticker rule exists');
for(const declaration of ['left:0!important','right:0!important','bottom:100%!important','width:100%!important','box-sizing:border-box!important','margin:0!important'])assert.ok(rule.includes(declaration),declaration);
assert.doesNotMatch(rule,/left:\.25rem|right:\.25rem/);
assert.match(css, /\.card-row-item\{[^\n]*width:var\(--row-envelope-w,174px\)/);
console.log('Position stickers sit flush and match card envelope width');
