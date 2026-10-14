import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source=fs.readFileSync('sky-chart-orb-control-v1.js','utf8');
const foundation=fs.readFileSync('sky-chart-foundation-interactions-v2.js','utf8');
const start=source.indexOf('  function relationshipSlots(row){');
const end=source.indexOf('  function ensureShowMoreRow(){',start);
assert.ok(start>=0&&end>start,'Harmonic endpoint reconciliation must be present');
assert.match(source,/identity=relationshipKey/,'Rows and aspect visibility use the same scoped relation key');
const selected=source.slice(start,end);

function reconcile(mode,visible){
 const names=['A:venus','B:dsc','B:moon','B:pluto'];
 const nodes=names.map(name=>{
   const [sky,placement]=name.split(':'),classes=new Set(['is-kept']);
   return{dataset:{sky,placement},classList:{
     toggle(value,enabled){if(enabled)classes.add(value);else classes.delete(value)},
     contains(value){return classes.has(value)}
   }};
 });
 const rows=[
  {dataset:{relationshipMode:'A-B',relationIndex:'7',leftSky:'A',leftPlacement:'venus',rightSky:'B',rightPlacement:'dsc'}},
  {dataset:{relationshipMode:'B-B',relationIndex:'7',leftSky:'B',leftPlacement:'dsc',rightSky:'B',rightPlacement:'moon'}},
  {dataset:{relationshipMode:'B-B',relationIndex:'8',leftSky:'B',leftPlacement:'dsc',rightSky:'B',rightPlacement:'pluto'}}
 ];
 const document={querySelectorAll:()=>nodes};
 const wheelState={kind:'placement',sky:'B',value:'dsc',mode};
 const api=new Function('document','wheelState',selected+'\nreturn{relationshipKey,reconcilePlacementIsolation}')(document,wheelState);
 api.reconcilePlacementIsolation(rows,new Set(visible));
 return names.filter((_,index)=>nodes[index].classList.contains('is-kept')).sort();
}

test('pending harmonic reconciliation must never erase endpoints during placement hover',()=>{
 assert.deepEqual(reconcile('hover',[]),['A:venus','B:dsc','B:moon','B:pluto']);
 assert.match(foundation,/function applyState\(\)/);
 assert.match(foundation,/node\.classList\.toggle\('is-kept',isKept\)/);
});

test('persistent placement selection honors visible intersky/intrasky relationships by scoped key',()=>{
 assert.deepEqual(reconcile('selected',['A-B::7','B-B::8']),['A:venus','B:dsc','B:pluto']);
});

test('selected placement with no visible counterparts keeps only its own orb',()=>{
 assert.deepEqual(reconcile('selected',[]),['B:dsc']);
});

test('Harmonic Window must not mutate placement highlights, even on selection',()=>{
 const apply=source.slice(source.indexOf('  function apply(){'),source.indexOf('  function schedule(){'));
 assert.doesNotMatch(apply,/reconcilePlacementIsolation\(/);
 assert.doesNotMatch(apply,/classList\.toggle\('is-kept'/);
});
test('Wheel brightness ignores Harmonic Window row-hidden state',()=>{
 const focus=fs.readFileSync('sky-chart-filter-wheel-focus-v1.js','utf8');
 assert.match(focus,/const matched=explicitlyMatched;/);
 assert.doesNotMatch(focus,/const matched=explicitlyMatched\.filter/);
 assert.match(focus,/const active=matched\.length>0&&matched\.length<rows\.length/);
});

test('Focus uses relationship endpoints and keeps all other placements visible',()=>{
 const css=fs.readFileSync('sky-chart-filter-wheel-focus-v1.css','utf8');
 const js=fs.readFileSync('sky-chart-filter-wheel-focus-v1.js','utf8');
 assert.match(js,/const relations=new Set\(\),placements=new Set\(\)/);
 assert.match(js,/row\.dataset\.leftPlacement\)placements\.add/);
 assert.match(js,/row\.dataset\.rightPlacement\)placements\.add/);
 assert.match(js,/placements\.has\(/);
 assert.match(css,/opacity:\.4!important/);
 assert.match(css,/opacity:1!important/);
 assert.doesNotMatch(css,/sky-foundation-house-sector/);
 assert.doesNotMatch(css,/sky-foundation-sign-sector/);
});

test('Focus endpoint logic treats all placement categories and both skies equally',()=>{
 const js=fs.readFileSync('sky-chart-filter-wheel-focus-v1.js','utf8');
 const groups=[
  ['sun','moon'],['mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'],
  ['asc','dsc','mc','ic'],['chiron','lilith','north-node','south-node','part-of-fortune','vertex','anti-vertex']
 ];
 assert.equal(groups.flat().length,21);
 assert.match(js,/slots\.left/);
 assert.match(js,/slots\.right/);
 assert.match(js,/\[data-layer="placements"\]/);
 assert.match(js,/\[data-layer="leaders"\]/);
});
test('leader integrity must not reintroduce Focus-menu dimming after page load',()=>{
 const leader=fs.readFileSync('sky-chart-leader-integrity-v1.js','utf8');
 const html=fs.readFileSync('sky-chart.html','utf8');
 assert.doesNotMatch(leader,/has-filter-focus[^\\n]*leaders/);
 assert.match(leader,/has-isolation[^\\n]*leaders/);
 assert.match(html,/sky-chart-leader-integrity-v1\\.js\\?v=5/);
});
