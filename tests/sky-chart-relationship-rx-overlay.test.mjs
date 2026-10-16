import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const js=fs.readFileSync('sky-chart-inline-expanded-header-v1.js','utf8');
const html=fs.readFileSync('sky-chart.html','utf8');
test('Relationship Retrograde uses transparent canonical mask with sky-owned color',()=>{
 assert.match(js,/sky-rx-owner="A"\]\{color:#c9211e\}/);
 assert.match(js,/sky-rx-owner="B"\]\{color:#2462d0\}/);
 assert.match(js,/width:36px;height:36px/);
 assert.match(js,/background-color:currentColor/);
 assert.match(js,/-webkit-mask:url\("assets\/planet-glyphs\/retrograde.svg"\)/);
 assert.match(js,/mask:url\("assets\/planet-glyphs\/retrograde.svg"\)/);
 assert.doesNotMatch(js,/background:#fffdfa;border-radius:2px/);
 assert.match(js,/glyph.dataset.skyRxOwner=sky/);
 assert.match(js,/delete glyph.dataset.skyRxOwner/);
 assert.doesNotMatch(js,/mark.innerHTML=window.RelphiSkyRetrogradeMark/);
 assert.ok(html.includes('sky-chart-inline-expanded-header-v1.js?v=9'));
});
