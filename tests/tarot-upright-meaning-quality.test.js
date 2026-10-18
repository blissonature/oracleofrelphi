const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync('relphi-locked-interpretations.js','utf8'),sandbox);
const data=sandbox.window.RELPHI_LOCKED_INTERPRETATIONS;
assert.equal(data.cards.length,78);
const seen=new Set();
for(const card of data.cards){
 assert.ok(!seen.has(card.card_id),'Duplicate '+card.card_id);
 seen.add(card.card_id);
 assert.ok(typeof card.relphi_derived_interpretation==='string' && card.relphi_derived_interpretation.length>90,card.card_id);
 assert.doesNotMatch(card.relphi_derived_interpretation,/^The (?:Ace|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten) of .* is (?:material|feeling|thought|active)/i);
}
assert.match(data.cards.find(c=>c.card_id==='seven_of_cups').relphi_derived_interpretation,/Venus in Scorpio/);
assert.match(data.cards.find(c=>c.card_id==='eight_of_swords').relphi_derived_interpretation,/Jupiter in Gemini/);
console.log('All 78 upright readings have distinct substantive text');
