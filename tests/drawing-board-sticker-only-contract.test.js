const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync('drawing-board-workflow-v2.css','utf8');
const rule=css.split('\n').find(x=>x.startsWith('#shortListPanel .card-row-workspace .card-row-item>.card-row-position-panel{'));
const editor=css.split('\n').find(x=>x.startsWith('#shortListPanel .card-row-workspace .card-row-item>.card-row-position-panel .card-row-position-editor{'));
for(const v of ['left:0!important','right:0!important','width:100%!important','box-sizing:border-box!important','bottom:100%!important','height:3rem!important','max-height:3rem!important'])assert.ok(rule.includes(v),v);
for(const v of ['-webkit-line-clamp:3!important','overflow:hidden!important','text-overflow:ellipsis!important'])assert.ok(editor.includes(v),v);
assert.doesNotMatch(rule,/left:\.25rem|right:\.25rem/);
console.log('Sticker-only alignment and truncation contracts pass');
