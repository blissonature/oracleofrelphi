import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

// Evaluate the real relationship-key and endpoint reconciliation functions.
const source=fs.readFileSync('sky-chart-orb-control-v1.js','utf8');
const start=source.indexOf('  function relationshipSlots(row){');
const end=source.indexOf('  function ensureShowMoreRow(){',start);
assert.ok(start>=0&&end>start,'Harmonic Window controller must expose relationship reconciliation');
const functions=source.slice(start,end);
assert.match(source,/identity=relationshipKey/,'Line and row visibility must use the same scoped identity');

function simulate(state,rows,visible){
  const nodes=[
    ['A','dsc'],['B','dsc'],['A','venus'],['B','moon'],
    ['B','pluto'],['A','sun'],['A','mars'],['A','mercury']
  ].map(([sky,placement])=>{
    const classes=new Set();
    return{
      dataset:{sky,placement},
      classList:{toggle(name,on){if(on)classes.add(name);else classes.delete(name)},contains(name){return classes.has(name)}}
    };
  });
  const document={querySelectorAll(selector){
    assert.match(selector,/data-focus-piece="placement"/);
    return nodes;
  }};
  const api=new Function('document','wheelState',functions+'\nreturn{relationshipKey,reconcilePlacementIsolation};')(document,state);
  api.reconcilePlacementIsolation(rows,new Set(visible));
  return{
    key:api.relationshipKey,
    kept:new Set(nodes.filter(node=>node.classList.contains('is-kept')).map(node=>`${node.dataset.sky}:${node.dataset.placement}`))
  };
}
const row=(mode,index,leftSky,leftPlacement,rightSky,rightPlacement)=>({
  dataset:{relationshipMode:mode,relationIndex:index,leftSky,leftPlacement,rightSky,rightPlacement}
});

test('clicking a Sky B angle restores all visible A-B and B-B counterpart orbs',()=>{
  const rows=[
    row('A-B','21','A','venus','B','dsc'),
    row('B-B','21','B','dsc','B','moon'), // same index but filtered out
    row('B-B','24','B','dsc','B','pluto'),
    row('A-B','22','A','sun','B','dsc'), // hidden by Harmonic Window
    row('A-A','24','A','mars','A','mercury') // unrelated sky/scope
  ];
  const actual=simulate({kind:'placement',sky:'B',value:'dsc'},rows,['A-B::21','B-B::24','A-A::24']);
  assert.equal(actual.key(rows[0]),'A-B::21');
  assert.equal(actual.key(rows[1]),'B-B::21');
  assert.deepEqual([...actual.kept].sort(),['A:venus','B:dsc','B:pluto']);
});

test('Sky A angles keep only endpoints of visible intrasky relationships',()=>{
  const rows=[
    row('A-A','4','A','dsc','A','mercury'),
    row('A-A','5','A','dsc','A','sun')
  ];
  const actual=simulate({kind:'placement',sky:'A',value:'dsc'},rows,['A-A::4']);
  assert.deepEqual([...actual.kept].sort(),['A:dsc','A:mercury']);
});

test('an isolated angle with no visible relationships keeps itself only',()=>{
  const actual=simulate({kind:'placement',sky:'B',value:'dsc'},[
    row('A-B','2','A','venus','B','dsc')
  ],[]);
  assert.deepEqual([...actual.kept],['B:dsc']);
});
