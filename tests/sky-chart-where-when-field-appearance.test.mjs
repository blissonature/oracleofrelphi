import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const read=file=>fs.readFileSync(file,'utf8');
test('Sky A and Sky B Where and When sections retain full opacity when locked',()=>{
 const css=read('sky-chart-where-when-v1.css');
 const time=read('sky-chart-time-control-v1.css');
 const viewport=read('sky-chart-where-when-viewport-v3.js');
 const editor=read('sky-chart-where-when-v3.js');
 assert.match(css,/\.sky-where-when-section\[disabled\]\s*\{\s*opacity:1;/);
 assert.match(time,/\.sky-time-control\.is-disabled\{opacity:1\}/);
 assert.match(time,/\.sky-where-when-section\[disabled\] \.sky-time-control\{opacity:1\}/);
 assert.match(viewport,/\[data-ww-field="time"\]:disabled\{background:#fff!important/);
 assert.match(editor,/\[data-ww-field="time"\]:disabled\{opacity:1;background:#fff/);
 assert.match(editor,/function editorMarkup\(slot,p\)/);
 assert.match(editor,/time\.disabled=unknown/);
 const html=read('sky-chart.html');
 for(const v of ['sky-chart-where-when-v1.css?v=9','sky-chart-time-control-v1.css?v=8','sky-chart-where-when-viewport-v3.js?v=2','sky-chart-where-when-v3.js?v=13'])assert.ok(html.includes(v));
});
