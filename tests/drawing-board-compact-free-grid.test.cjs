// Regression: Free card faces pack against each other with a tiny felt reveal.
// Run from repository root: node tests/drawing-board-compact-free-grid.test.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const extract=(from,to)=>{const a=source.indexOf(from),b=source.indexOf(to,a);assert.ok(a>=0&&b>a);return source.slice(a,b)};
const code=extract('  function genericPositions(labels','  function legacyDenseAutoLayout(')+
 extract('  function fitFreeReadingGrid(root=panel()) {','  function enhance(root = panel()) {');
const counts=[12,37,78];
for(const count of counts){
 const snap={shortList:Array.from({length:count},(_,i)=>({id:i})),rowEnvelopeLayout:{},rowCardTransforms:{}};
 const root={dataset:{},querySelector:()=>null};let writes=0;
 const env={window:{innerWidth:1280,innerHeight:900},panel:()=>root,CANVAS_W:900,CANVAS_H:760,CARD_W:174,CARD_H:174*866/500,LABEL_H:68,START_EDGE_GUTTER:4,
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  position:(id,label,drawOrder,point)=>({id,label,drawOrder,transform:point}),
  transform:(x,y,scale,rotation=0,zIndex=1)=>({x,y,scale,rotation,zIndex}),
  autoLayoutViewport:()=>({width:1140,height:570}),
  optionsBridge:()=>({capture:()=>snap,restore:()=>{writes++}}),settingsOpen:false,craftedReadingActive:false,
  boardHasCraftedStructure:()=>false,requestAnimationFrame:()=>{},zoomExtents:()=>{},freeAutoLayoutBusy:false};
 const fn=vm.runInNewContext(code+'\nfitFreeReadingGrid;',env);
 assert.equal(fn(root),true);
 assert.equal(writes,1);
 const positions=Object.values(snap.rowEnvelopeLayout),scale=snap.rowCardTransforms[0].scale;
 const y=[...new Set(positions.map(p=>p.y))].sort((a,b)=>a-b);
 assert.equal(positions[0].y,4,'Cards begin at the tiny edge gutter');
 assert.ok(y.length>1);
 for(let i=1;i<y.length;i++)assert.ok(Math.abs(y[i]-y[i-1]-174*866/500*scale)<.01,'No gaps between rows');
}
// Do not eliminate the question-label area from Bespoke.
assert.ok(code.includes('cardFacesOnly?0:LABEL_H*scale'),'Question labels retain their own spacing');
console.log('PASS compact Free grid for 12, 37 and 78 cards; label-bearing layouts remain separate');
