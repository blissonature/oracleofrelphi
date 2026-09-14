const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname,'..','drawing-board-workflow-v2.js'),'utf8');
const storage = new Map();
const sandbox = {
  location:{pathname:'/tarot.html'},
  localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value))},
  document:{readyState:'loading',addEventListener(){},getElementById(){return null;},body:{classList:{add(){},remove(){}}},querySelector(){return null;}},
  window:{addEventListener(){}}, Event, CustomEvent:class{}, setTimeout(){return 1;}, clearTimeout(){}, console
};
sandbox.window.document=sandbox.document; sandbox.window.localStorage=sandbox.localStorage;
vm.createContext(sandbox); vm.runInContext(source,sandbox);
const api=sandbox.window.RelphiDrawingBoardSpreadPrefabs;
assert.ok(api);
assert.equal(api.shipped.length,9);
assert.ok(api.shipped.every(item=>item.positions.length===item.cardCount));
const c=api.byId('celtic-cross-10');
assert.equal(c.positions[0].role,'covering');
assert.equal(c.positions[1].role,'crossing');
assert.equal(c.positions[1].crosses,'covering');
assert.equal(c.positions[1].canonicalTransform.rotation,0);
assert.equal(c.positions[1].crossedTransform.rotation,90);
assert.equal(c.positions[0].transform.x,.20);
assert.equal(c.positions[1].canonicalTransform.x,.35);
assert.equal(c.positions[4].transform.x,.02);
assert.equal(c.positions[5].transform.x,.50);
assert.deepEqual(Array.from(c.positions.slice(6),p=>p.transform.y),[.83,.555,.28,.005]);
assert.ok(!api.shipped.some(item=>item.id==='celtic-cross-11'));
const polarities=api.byId('six-polarities-houses-12');
assert.equal(polarities.cardCount,12);
assert.equal(polarities.positions[0].label,'1 · Aries · I');
assert.equal(polarities.positions[1].label,'7 · Libra · You');
console.log('Drawing Board spread registry checks passed.');
