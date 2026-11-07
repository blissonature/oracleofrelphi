// Regression: Drawing Board auto-fit must not endlessly restore and rerender.
// Run: node tests/drawing-board-free-grid-no-loop.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const slice=(a,b)=>{const start=source.indexOf(a),end=source.indexOf(b,start);assert.ok(start>=0&&end>start);return source.slice(start,end)};
const code=slice('  function genericPositions(labels','  function legacyDenseAutoLayout(')+
  slice('  function fitFreeReadingGrid(root=panel()) {','  function enhance(root = panel()) {');
assert.doesNotMatch(source,/if \(fitFreeReadingGrid\(root\)\) \{ requestAnimationFrame\(\(\)=>enhance\(root\)\)/,
 'Fitter must not schedule an additional enhancement after snapshot restore');
const root={dataset:{},querySelector:()=>null};
const snapshot={shortList:Array.from({length:37},(_,i)=>i),rowEnvelopeLayout:{},rowCardTransforms:{}};
let restores=0,renderDepth=0;
const env={
 window:{innerWidth:1280,innerHeight:900},
 panel:()=>root,CANVAS_W:900,CANVAS_H:760,CARD_W:174,CARD_H:174*866/500,
 LABEL_H:68,START_EDGE_GUTTER:4,
 clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
 transform:(x,y,scale,rotation=0,zIndex=1)=>({x,y,scale,rotation,zIndex}),
 position:(id,label,order,transform)=>({id,label,order,transform}),
 // Simulate fluctuating toolbar height during the restoration-triggered render.
 autoLayoutViewport:()=>({width:1140,height:renderDepth?500:570}),
 settingsOpen:false,craftedReadingActive:false,boardHasCraftedStructure:()=>false,
 requestAnimationFrame:()=>{},zoomExtents:()=>{},freeAutoLayoutBusy:false
};
let fit;
env.optionsBridge=()=>({capture:()=>JSON.parse(JSON.stringify(snapshot)),restore(next){
 restores++;
 assert.ok(restores<5,'Unexpected endless layout restore loop');
 Object.assign(snapshot,next);
 renderDepth++;
 fit(root); // The real bridge emits relphi:drawing-board-rendered synchronously.
 renderDepth--;
}});
fit=vm.runInNewContext(code+'\nfitFreeReadingGrid;',env);
assert.equal(fit(root),true);
assert.equal(restores,1,'One initial restore, no recurring restore');
assert.equal(fit(root),false,'Identical drawing must not refit on next render');
assert.equal(restores,1,'No second restore');
assert.ok(new Set(Object.values(snapshot.rowEnvelopeLayout).map(v=>v.y)).size>1,'37 cards still span rows');
console.log('PASS 37-card re-entrant render; one restore; no auto-fit feedback loop');
