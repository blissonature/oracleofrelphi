import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const js=fs.readFileSync('sky-chart-inline-expanded-header-v1.js','utf8');
const html=fs.readFileSync('sky-chart.html','utf8');
test('Relationship Retrograde consumes the one canonical glyph component with sky-owned color',()=>{
  assert.match(js,/sky-rx-owner="A"\]\{color:#c9211e\}/);
  assert.match(js,/sky-rx-owner="B"\]\{color:#2462d0\}/);
  assert.match(js,/right:-6px;bottom:-3px;width:26px;height:26px/);
  assert.match(js,/component\.draw\(svg,'retrograde',\{radius:19,padding:1,color:'currentColor'\}\)/);
  assert.match(js,/mark\.appendChild\(svg\)/);
  assert.match(js,/glyph\.dataset\.skyRxOwner=sky/);
  assert.match(js,/delete glyph\.dataset\.skyRxOwner/);
  assert.doesNotMatch(js,/-webkit-mask:|mask:url\(|background-color:currentColor/);
  assert.match(html,/sky-chart-inline-expanded-header-v1\.js\?v=\d+/);
});
