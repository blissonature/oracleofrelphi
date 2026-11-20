import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const files=['sky-chart-vocab-tab-v1.js','sky-chart-inline-relationship-copy-v1.js'];
const html=fs.readFileSync('sky-chart.html','utf8');
const defs=fs.readFileSync('sky-chart-term-definitions-v1.js','utf8');
const sandbox={window:null,location:{pathname:'/sky-chart.html'}};
sandbox.window=sandbox;
const context=vm.createContext(sandbox);
vm.runInContext(defs,context,{filename:'sky-chart-term-definitions-v1.js'});
const vocabulary=sandbox.RelphiTermDefinitions;
assert.ok(vocabulary,'Definitions must initialize as a single owner');
assert.equal(vocabulary.SIGNS.length,12);
assert.equal(vocabulary.HOUSE_NAMES.length,13);
assert.equal(Object.keys(vocabulary.SIGN_REFERENTS).length,12);
assert.equal(Object.keys(vocabulary.ASPECT_REFERENTS).length,11);
assert.ok(vocabulary.PLACEMENT_REFERENTS['asteroid-lilith'],'Additional points remain in canonical vocabulary');
assert.equal(vocabulary.EXPANDED_PLACEMENT_REFERENTS['asteroid-lilith'],vocabulary.PLACEMENT_REFERENTS['asteroid-lilith'],'Expanded text falls back to short referent for new points');
assert.equal(vocabulary.SIGN_REFERENTS.Gemini,'writing, speech, learning, information exchange, and interpretation');
assert.equal(vocabulary.EXPANDED_SIGN_REFERENTS.Gemini,'language, exchange, curiosity, movement, and multiplicity');
for(const file of files){
 const content=fs.readFileSync(file,'utf8');
 assert.doesNotMatch(content,/const (?:SIGN_REFERENTS|HOUSE_REFERENTS|PLACEMENT_REFERENTS|ASPECT_REFERENTS|ASPECT_NAMES|HOUSE_NAMES|SIGNS)=\s*[\[{]/,'Consumers must not independently author the same dictionaries: '+file);
 assert.match(content,/RelphiTermDefinitions\./,'Consumer must use the shared owner: '+file);
}
assert.ok(vocabulary.CONFIGS,'Configurations remain in the single definitions owner');
assert.doesNotMatch(html,/sky-chart-relationship-vocab-v1\.js/,'Removed unauthorized Relationship Vocab must not be loaded');
const first=html.indexOf('sky-chart-term-definitions-v1.js');
assert.ok(first>0);
for(const file of files)assert.ok(first<html.indexOf(file),'Definitions must load before '+file);
vm.runInContext(fs.readFileSync('sky-chart-inline-relationship-copy-v1.js','utf8'),context,{filename:'sky-chart-inline-relationship-copy-v1.js'});
const groups=sandbox.RelphiRelationshipCopySerializer.fullDictionary();
assert.deepEqual(Array.from(groups,g=>g.category),['Planets, Angles, and Other Points','Signs','Houses','Aspect Types']);
const pointEntries=groups[0].sections[2].entries;
assert.ok(pointEntries.some(item=>item.label==='asteroid lilith'&&item.text===vocabulary.PLACEMENT_REFERENTS['asteroid-lilith']),'Chart-independent PDF includes additional points without a duplicate definition');
assert.equal(groups[1].sections[0].entries.find(x=>x.label==='Gemini').text,vocabulary.EXPANDED_SIGN_REFERENTS.Gemini);
console.log('One shared vocabulary owner; compact Vocab, expanded exports, and complete PDF dictionary verified.');
