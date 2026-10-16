const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

// Exercise the real layout functions without booting the browser application.
const source=fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const start=source.indexOf('  function legacyGenericPositions(labels) {');
const end=source.indexOf('  function migrateLegacyDenseAutoLayout(',start);
assert.ok(start>=0 && end>start,'generic layout functions are available');
const layoutCode=source.slice(start,end);

function setup(width,height,toolbar=40){
  const workspace={clientWidth:width,clientHeight:height};
  const root={clientWidth:width,querySelector:()=>workspace};
  const context={
    CANVAS_W:900,CANVAS_H:760,CARD_W:174,CARD_H:174*866/500,LABEL_H:68,
    GUTTER:0,START_EDGE_GUTTER:4,
    panel:()=>root,visibleToolbarHeight:()=>toolbar,
    clamp:(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0)),
    transform:(x,y,scale=.66,rotation=0,zIndex=1)=>({x,y,scale,rotation,zIndex}),
    position:(id,label,drawOrder,transform)=>({id,label,drawOrder,transform})
  };
  return vm.runInNewContext(layoutCode+'\n({genericPositions,legacyGenericPositions,legacyDenseAutoLayout})',context);
}
const labels=count=>Array.from({length:count},(_,i)=>'Question '+(i+1));
function dimensions(cards) {
  const distinct=key=>new Set(cards.map(card=>card.transform[key].toFixed(6))).size;
  return {cols:distinct('x'),rows:distinct('y')};
}

const desktop=setup(1140,580);
const twelve=desktop.genericPositions(labels(12));
assert.deepEqual(dimensions(twelve),{cols:6,rows:2},'wide workspace should arrange 12 cards six wide and two high');
assert.deepEqual(Array.from(twelve,p=>p.drawOrder),Array.from({length:12},(_,i)=>i+1),'card order preserved');
assert.deepEqual(dimensions(desktop.genericPositions(labels(6))),{cols:6,rows:1},'six cards occupy one row on a wide workspace');

const mobile=setup(360,530);
assert.deepEqual(dimensions(mobile.genericPositions(labels(12))),{cols:4,rows:3},'narrow workspace should choose a taller configuration');

const threeMobile=mobile.genericPositions(labels(3));
assert.equal(new Set(threeMobile.map(p=>p.transform.y.toFixed(6))).size,2,
  'three mobile placeholders use two rows rather than a tiny three-across strip');
assert.ok(Math.abs(threeMobile[2].transform.x-(threeMobile[0].transform.x+threeMobile[1].transform.x)/2)<.00001,
  'the last position is centered in its partial row');

const authoredStart=source.indexOf('  function usesAuthoredSpreadGeometry(prefab) {');
const authoredEnd=source.indexOf('  function launchConfiguredReading(root,draft)',authoredStart);
assert.ok(authoredStart>=0 && authoredEnd>authoredStart,'reading paths use shared adaptive geometry');
const authoredCode=source.slice(authoredStart,authoredEnd);
const authoredContext={
  RECURSION_ID:'relphi-recursion-22',
  genericPositions:mobile.genericPositions,
  ...{Set}
};
const {adaptiveReadingPrefab}=vm.runInNewContext(authoredCode+'\n({adaptiveReadingPrefab})',authoredContext);
for(const name of ['building-blocks','astrological-tarot','see-what-surfaces','custom-active']){
  const prefab={id:name,positions:labels(3).map((label,i)=>({id:'q'+i,label,drawOrder:i+1,transform:{x:i/3,y:0,scale:.3}}))};
  const adapted=adaptiveReadingPrefab(prefab);
  assert.equal(new Set(adapted.positions.map(p=>p.transform.y.toFixed(6))).size,2,
    name+' should use the shared adaptive 2-row mobile layout');
}
for(const id of ['saturn-square-9','celtic-cross-10','relphi-recursion-22']){
  const prefab={id,positions:[{id:'q1',label:'Question',drawOrder:1,transform:{x:.123,y:.456,scale:.5}}]};
  assert.equal(adaptiveReadingPrefab(prefab),prefab,id+' should retain authored geometry');
}

const old=desktop.legacyGenericPositions(labels(12));
const snapshot={
  rowEnvelopeLayout:Object.fromEntries(old.map((p,i)=>[i,{x:p.transform.x*900,y:p.transform.y*760}])),
  rowCardTransforms:Object.fromEntries(old.map((p,i)=>[i,{scale:p.transform.scale,rotation:0}]))
};
const custom={id:'custom-active',positions:old};
assert.ok(desktop.legacyDenseAutoLayout(custom,snapshot),'untouched historical layout can be migrated');
assert.equal(desktop.legacyDenseAutoLayout({id:'celtic-cross-10',positions:old},snapshot),false,'named spread geometry is preserved');
const moved=structuredClone(snapshot);
moved.rowEnvelopeLayout[2].x+=16;
assert.equal(desktop.legacyDenseAutoLayout(custom,moved),false,'manually moved cards must not be migrated');
const scaled=structuredClone(snapshot);
scaled.rowCardTransforms[2].scale+=.1;
assert.equal(desktop.legacyDenseAutoLayout(custom,scaled),false,'manually scaled cards must not be migrated');

console.log('Drawing Board adaptive layouts and safe migration passed.');
