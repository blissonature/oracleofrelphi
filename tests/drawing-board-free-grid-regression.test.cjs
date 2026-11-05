// Regression: free draws use the grid owner, including the legacy 37-card strip.
// Run from repository root: node tests/drawing-board-free-grid-regression.test.cjs
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync('drawing-board-workflow-v2.js','utf8');
assert.ok(!source.includes('snap.rowEnvelopeLayout[i]={x:i*CARD_W*scale,y:0}'),'No competing single-row writer');
const slice=(start,end)=>{const a=source.indexOf(start),b=source.indexOf(end,a);assert.ok(a>=0&&b>a);return source.slice(a,b)};
const methods=slice('  function genericPositions(labels) {','  function legacyDenseAutoLayout(')+
 slice('  function fitFreeReadingGrid(root=panel()) {','  function enhance(root = panel()) {');
let checks=0;
for(const scenario of ['legacy-strip','fresh','manual']){
 const snap={shortList:Array.from({length:37},(_,i)=>({id:i})),rowEnvelopeLayout:{},rowCardTransforms:{}};
 if(scenario!=='fresh')for(let i=0;i<37;i++){
  snap.rowEnvelopeLayout[i]={x:i*174+(scenario==='manual'&&i===1?12:0),y:0};
  snap.rowCardTransforms[i]={scale:1,rotation:0,zIndex:i+1};
 }
 const root={dataset:{},querySelector:()=>null};
 let restores=0;
 const env={window:{innerWidth:1280,innerHeight:900},panel:()=>root,CANVAS_W:900,CANVAS_H:760,CARD_W:174,CARD_H:174*866/500,
  LABEL_H:68,START_EDGE_GUTTER:4,
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  position:(id,label,drawOrder,point)=>({id,label,drawOrder,transform:point}),
  transform:(x,y,scale,rotation=0,zIndex=1)=>({x,y,scale,rotation,zIndex}),
  autoLayoutViewport:()=>({width:920,height:510}),
  optionsBridge:()=>({capture:()=>snap,restore:()=>{restores++}}),
  settingsOpen:false,craftedReadingActive:false,boardHasCraftedStructure:()=>false,
  requestAnimationFrame:()=>{},zoomExtents:()=>{},freeAutoLayoutBusy:false};
 const ctx=vm.createContext(env);
 const fit=vm.runInContext(methods+'\nfitFreeReadingGrid;',ctx);
 const changed=fit(root);
 if(scenario==='manual'){
  assert.equal(changed,false,'Reader-edited layout is not replaced');
  assert.equal(restores,0);
 }else{
  assert.equal(changed,true,'Untouched free reading gets arranged');
  assert.equal(restores,1);
  const y=new Set(Object.values(snap.rowEnvelopeLayout).map(p=>p.y));
  assert.ok(y.size>=2,'37 cards span multiple rows');
  assert.ok(Math.max(...Object.values(snap.rowEnvelopeLayout).map(p=>p.x))<900,'grid fits canvas');
 }
 checks++;
}
console.log('PASS '+checks+' free-grid scenarios; 37 cards reflow, untouched layout protected');
