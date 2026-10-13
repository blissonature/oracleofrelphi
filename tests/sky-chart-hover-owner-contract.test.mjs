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

test('all Focus menu filters leave placements, leaders, houses and signs undimmed',()=>{
 const css=fs.readFileSync('sky-chart-filter-wheel-focus-v1.css','utf8');
 const js=fs.readFileSync('sky-chart-filter-wheel-focus-v1.js','utf8');
 assert.match(css,/has-filter-focus:not\(\.has-isolation\) \[data-layer="aspects"\]/);
 assert.doesNotMatch(css,/has-filter-focus[^\\n{]*\[data-layer="placements"\]/);
 assert.doesNotMatch(css,/has-filter-focus[^\\n{]*\[data-layer="leaders"\]/);
 assert.doesNotMatch(css,/has-filter-focus[^\\n{]*sky-foundation-house-sector/);
 assert.doesNotMatch(css,/has-filter-focus[^\\n{]*sky-foundation-sign-sector/);
 assert.doesNotMatch(js,/placements\.has\(/);
 assert.doesNotMatch(js,/houses\.has\(/);
 assert.doesNotMatch(js,/signs\.has\(/);
 assert.match(js,/const explicitlyMatched=explicitRows\(rows\)/);
 assert.match(js,/node\.classList\.toggle\('is-filter-kept',relations\.has\(/);
});
