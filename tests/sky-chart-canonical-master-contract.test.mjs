import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

const registry=read('relphi-glyph-registry-v1.js');
const component=read('relphi-glyph-component-v1.js');
const integrity=read('relphi-glyph-source-integrity-v1.js');
const foundation=read('sky-chart-foundation-v2.js');
const relationships=read('sky-chart-relationship-list-layout-v2.js');
const inline=read('sky-chart-inline-relationship-v5.js');
const heptagram=read('sky-chart-heptagram-canonical-v1.js');
const sky=read('sky-chart.html');

assert.match(sky,/relphi-glyph-registry-v1\.js/);
assert.match(sky,/relphi-glyph-component-v1\.js/);
assert.match(sky,/relphi-glyph-source-integrity-v1\.js/);
assert.match(sky,/sky-chart-foundation-v2\.js/);
assert.match(sky,/sky-chart-relationship-list-layout-v2\.js/);
assert.match(sky,/sky-chart-inline-relationship-v5\.js/);
assert.doesNotMatch(sky,/relphi-canonical-glyph-state-v1|sky-chart-selected-relationship-v4|sky-chart-progressive-comparison-v1/);

for(const snippet of [
  "['asc','Ascendant',['asc','ascendant','rising','ac'],null,1,0,0,'Asc','letter','700']",
  "['dsc','Descendant',['dsc','descendant','dc'],null,1,0,0,'Dsc','letter','700']",
  "['mc','Midheaven',['mc','midheaven'],null,1,0,0,'MC','letter','700']",
  "['ic','Imum Coeli',['ic','imum coeli','imumcoeli'],null,1,0,0,'IC','letter','700']"
])assert.ok(registry.includes(snippet),`Registry treatment drifted: ${snippet.slice(0,18)}…`);

for(const id of ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','lilith','part-of-fortune']){
  assert.match(registry,new RegExp(`\\['${id}'[^\\n]+?,1,0,0,null,'static-master'\\]`),`${id} must remain a static master`);
}

assert.match(component,/if \(entry\.fitMode === 'static-master'\) return true;/);
assert.match(component,/if \(entry\.fitMode === 'static-master'\) return staticMaster/);
assert.match(component,/window\.RelphiGlyphComponent = Object\.freeze\(\{ draw, createBubble, fit, recolor \}\)/);
assert.doesNotMatch(component,/entry\.id === 'lilith'|entry\.id === 'part-of-fortune'/);

assert.match(integrity,/Object\.defineProperty\(window, 'RelphiGlyphRegistry'/);
assert.match(integrity,/Object\.defineProperty\(window, 'RelphiGlyphComponent'/);

assert.match(foundation,/window\.RelphiGlyphRegistry/);
assert.match(foundation,/window\.RelphiGlyphComponent/);
assert.match(foundation,/component\.draw\(/);
assert.match(foundation,/component\.createBubble\(/);

assert.match(relationships,/VIEWBOX='-32 -32 64 64'/);
assert.match(relationships,/RADIUS=19/);
assert.match(relationships,/component\.createBubble\(/);
assert.match(relationships,/data-relationship-canonical-host/);
assert.match(relationships,/slot\.replaceChildren\(clone\)/);
assert.doesNotMatch(inline,/createBubble\(|RelphiCanonicalGlyphState/);

assert.match(heptagram,/MASTER_RADIUS = 19/);
assert.match(heptagram,/MASTER_SCALE = DISPLAY_RADIUS \/ MASTER_RADIUS/);
assert.match(heptagram,/component\.createBubble/);
assert.doesNotMatch(heptagram,/RelphiCanonicalGlyphState/);

console.log('Current canonical glyph ownership contract passed: one registry, one component, locked globals, foundation v2, relationship layout v2, inline controller separation, and heptagram consumer.');
