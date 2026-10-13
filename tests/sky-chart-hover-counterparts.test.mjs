import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source=fs.readFileSync('sky-chart-orb-control-v1.js','utf8');
const begin=source.indexOf('  function relationshipSlots(row){');
const end=source.indexOf('  function ensureShowMoreRow(){',begin);
assert.ok(begin>=0&&end>begin,'Harmonic controller reconciliation functions present');
const functions=source.slice(begin,end);
assert.match(source,/identity=relationshipKey/,'Row/line visibility and placement reconciliation must use a shared identity');

function hover(slot,id,rows,visible){
  const nodes=['A:sun','B:moon','A:venus','B:dsc','B:pluto'].map(name=>{
    const [sky,placement]=name.split(':');
    return{dataset:{sky,placement},isKept:false,classList:{toggle(key,value){if(key==='is-kept')this.owner.isKept=value}}};
  });
  nodes.forEach(node=>node.classList.owner=node);
  const document={querySelectorAll(){return nodes}};
  const wheelState={kind:'placement',sky:slot,value:id,mode:'hover'};
  const controller=new Function('document','wheelState',functions+';return{relationshipKey,reconcilePlacementIsolation};')(document,wheelState);
  controller.reconcilePlacementIsolation(rows,new Set(visible));
  return nodes.filter(node=>node.isKept).map(node=>node.dataset.sky+':'+node.dataset.placement).sort();
}
const row=(mode,index,leftSky,leftPlacement,rightSky,rightPlacement)=>({dataset:{relationshipMode:mode,relationIndex:index,leftSky,leftPlacement,rightSky,rightPlacement}});

test('hovering a placement illuminates counterparts for visible intersky and intrasky relationships',()=>{
 const rows=[row('A-B','4','A','venus','B','dsc'),row('B-B','4','B','dsc','B','moon'),row('B-B','8','B','dsc','B','pluto'),row('A-B','9','A','sun','B','dsc')];
 assert.deepEqual(hover('B','dsc',rows,['A-B::4','B-B::8']),['A:venus','B:dsc','B:pluto']);
});
test('hover excludes Harmonic Window-hidden relationships and preserves the hovered orb',()=>{
 const rows=[row('A-B','4','A','venus','B','dsc')];
 assert.deepEqual(hover('B','dsc',rows,[]),['B:dsc']);
});
