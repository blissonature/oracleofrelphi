// Run: node tests/drawing-board-clarifier-inherits-settings.test.js
// Isolate the production Clarifier insertion path and exercise its persisted snapshot.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync('drawing-board-workflow-v2.js','utf8');
const start=source.indexOf('  function appendBespokeQuestion(question) {');
const end=source.indexOf('  function promptForBespokeQuestion()',start);
assert.ok(start>=0&&end>start,'Clarifier insertion exists');
const method=source.slice(start,end);
const base=(repeats,reversals,pack)=>({
 shortListPositionLabels:['Question 1'],shortListPositionCardIds:['sun'],
 rowDrawScope:pack,rowAllowReversals:reversals,rowAllowRepeats:repeats,
 rowSelectedTags:['meaning'],rowTagMatchMode:'all',
 rowEnvelopeLayout:{0:{x:123,y:234}},rowCardTransforms:{0:{scale:1.3,rotation:27,zIndex:5}},
 rowPositionMeta:[{id:'original',drawScope:'majors',allowReversals:false,allowRepeats:false,cardCount:1,questionText:'Question 1'}],
 rowActiveLayout:{name:'Existing',positions:[{id:'original',label:'Question 1',drawOrder:1,transform:{x:.2,y:.3,scale:1.3,rotation:27}}]},
 rowLayoutLocked:false
});
for(const repeats of [false,true])for(const reversals of [false,true])for(const pack of ['full','majors','tags']){
 const snapshot=base(repeats,reversals,pack),expected=JSON.parse(JSON.stringify(snapshot));
 const ctx={panel:()=>({}),optionsBridge:()=>({capture:()=>snapshot,restore:s=>{ctx.restored=s}}),
 bespokeEditingAllowed:()=>true,MAX_POSITIONS:100,clone:x=>JSON.parse(JSON.stringify(x)),
 genericPositions:labels=>labels.map((label,i)=>({id:'new'+i,transform:{x:.1+i*.2,y:.4,scale:.6,rotation:0,zIndex:1}})),
 CANVAS_W:900,CANVAS_H:760,setBoardMode:()=>{},markSemanticPositions:()=>{},updateLayoutClasses:()=>{},zoomExtents:()=>{},
 nextUndrawnNativeIndex:()=>null,openAttune:()=>{},setTimeout:()=>{},craftedReadingActive:false,activeCraftedPath:''};
 vm.createContext(ctx);
 vm.runInContext(method+'\nthis.addClarifier=appendBespokeQuestion;',ctx);
 assert.equal(ctx.addClarifier('Clarification?'),true);
 const result=ctx.restored;
 const added=result.rowPositionMeta[1];
 assert.equal(added.allowRepeats,repeats,'repeats inherited');
 assert.equal(added.allowReversals,reversals,'reversals inherited');
 assert.equal(added.drawScope,pack,'sub-pack inherited');
 assert.deepEqual(result.rowSelectedTags,expected.rowSelectedTags,'tag selection preserved');
 assert.equal(result.rowTagMatchMode,'all','tag match mode preserved');
 assert.deepEqual(result.rowEnvelopeLayout[0],expected.rowEnvelopeLayout[0],'previous position intact');
 assert.deepEqual(result.rowCardTransforms[0],expected.rowCardTransforms[0],'previous transform intact');
 assert.deepEqual(result.rowActiveLayout.positions[0],expected.rowActiveLayout.positions[0],'existing layout intact');
 assert.equal(result.shortListPositionCardIds[0],'sun','drawn cards intact');
 assert.equal(result.rowPositionMeta[0].allowRepeats,false,'original question override intact');
}
console.log('PASS Clarifier inherits all 4 reversal/repeat combinations, 3 pack scopes, and preserves existing geometry/cards');
