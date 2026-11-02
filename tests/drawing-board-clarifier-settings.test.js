const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('drawing-board-workflow-v2.js', 'utf8');
const append = source.match(/function appendBespokeQuestion\(question\) \{[\s\S]*?\n  \}/)[0];

// Execute the real append handoff with the production snapshot contract.
for (const reversals of [false, true]) for (const repeats of [false, true]) {
  let restored;
  const original = {drawScope:'majors', allowReversals:!reversals, allowRepeats:!repeats};
  const snapshot = {
    shortList:['existing-card'], shortListPositionLabels:['Original'],
    shortListPositionCardIds:['existing-card'], rowPositionMeta:[original],
    rowAllowReversals:reversals, rowAllowRepeats:repeats, rowDrawScope:'aces'
  };
  const context = {
    panel:()=>({}), optionsBridge:()=>({capture:()=>structuredClone(snapshot),restore:s=>{restored=s;}}),
    bespokeEditingAllowed:()=>true, MAX_POSITIONS:78, CANVAS_W:100, CANVAS_H:100,
    clone:structuredClone, genericPositions:labels=>labels.map((_,i)=>({id:String(i),transform:{x:0,y:0,scale:1}})),
    setBoardMode:()=>{}, setTimeout:()=>{}, craftedReadingActive:false, activeCraftedPath:''
  };
  vm.createContext(context);
  vm.runInContext(append+'; result=appendBespokeQuestion("Clarify");',context);
  assert.equal(context.result,true);
  assert.deepEqual(restored.shortList,snapshot.shortList);
  assert.equal(restored.rowPositionMeta[0].allowReversals,original.allowReversals);
  assert.equal(restored.rowPositionMeta[0].allowRepeats,original.allowRepeats);
  const added=restored.rowPositionMeta[1];
  assert.equal(added.allowReversals,reversals);
  assert.equal(added.allowRepeats,repeats);
  assert.equal(added.drawScope,'aces');
  assert.equal(restored.rowActiveLayout.positions[1].allowRepeats,repeats);
  assert.equal(restored.rowActiveLayout.positions[1].allowReversals,reversals);
}
console.log('Clarifier inherits all four board reversal/repeat combinations and pack; existing answers and overrides survive.');

// A one-card pack isolates the reported failure: once used, it is exhausted
// without repeats but must remain drawable when Clarifier inherits repeats on.
const native = fs.readFileSync('tarot-app.js','utf8');
const draw = native.match(/function drawRandomRowCard\(\) \{[\s\S]*?\n  \}/)[0];
const random = native.match(/function randomRowDraw\(pool, allowReversals\) \{[\s\S]*?\n  \}/)[0];
for (const reversals of [false,true]) for (const repeats of [false,true]) {
  const state={shortList:['only-card'],rowAllowRepeats:repeats,rowAllowReversals:reversals};
  let orientation, status={};
  const ctx={state,positionDrawScope:()=> 'aces',rowDrawPool:()=>[{card_id:'only-card'}],
    randomInt:n=>n-1,drawFromRowDeck:()=>null,$:()=>status,
    commitShortList:cards=>{state.shortList=cards;},setRowCardReversed:(i,r)=>{orientation=r;},
    refreshShortListViews:()=>{},expandCardRow:()=>{},scrollCardRowToEnd:()=>{}};
  vm.createContext(ctx);vm.runInContext(random+'\n'+draw+'\ndrawRandomRowCard();',ctx);
  assert.equal(state.shortList.length,repeats?2:1);
  if(repeats)assert.equal(orientation,reversals);
  else assert.match(status.textContent,/exhausted/);
}
console.log('An exhausted one-card pack draws a duplicate only with repeats on; reversals reach the native draw.');
