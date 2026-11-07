'use strict';
// Independent semantic-coverage audit. The probe corpus is not generated from
// canonical theme names; this catches the omission pattern that missed abandonment.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const bank=JSON.parse(read('audits/tarot-human-topic-probes-20261030.json'));
const decisions=JSON.parse(read('audits/tarot-human-theme-decisions-20261030.json'));
const courts=JSON.parse(read('audits/tarot-court-first-degree-supplement-20261030.json'));
const dictionary=JSON.parse(read('audits/tarot-human-language-vocabulary-20261030.json'));
const sandbox={window:{}};
vm.runInNewContext(read('tarot-cards.js'),sandbox);
vm.runInNewContext(read('tarot-theme-search-v1.js'),sandbox);
const cards=sandbox.window.RELPHI_TAROT_CARDS;
const engine=sandbox.window.RELPHI_THEME_SEARCH;
const idsOf=query=>Array.from(engine.directCardIds(query)).sort();
const count={direct:0,alias:0,related:0};
const history={};
const seen=new Set();
assert.equal(bank.coverage_domains,8);
assert.equal(bank.probe_entries,373);
assert.equal(bank.domains.reduce((n,domain)=>n+domain.queries.length,0),373);
for(const domain of bank.domains){
 assert.ok(domain.queries.length>15,'Whole topic domain must have independent probes: '+domain.name);
 for(const sample of domain.queries){
  assert.ok(sample.query && sample.baseline,domain.name+' malformed sample');
  const query=sample.query;
  seen.add(query);
  const hit=engine.resolve(query);
  assert.ok(hit,'Zero-response subject (unindexed): '+domain.name+' / '+query);
  const direct=idsOf(query);
  if(hit.match==='unqualified'){
   assert.deepEqual(direct,[],'Unqualified cannot silently include cards: '+query);
   const alternatives=engine.related(query);
   assert.ok(alternatives.length>0,'Unqualified term with no useful navigation: '+query);
   assert.ok(alternatives.every(term=>engine.directCardIds(term).length>0),
     'Alternatives must be directly qualified: '+query);
   count.related++;
  } else {
   assert.ok(['exact','alias','inflection'].includes(hit.match),
     'Unexpected implicit association: '+query+' / '+hit.match);
   assert.ok(direct.length>0,'Recognized direct subject with no cards: '+query);
   if(hit.match==='exact') count.direct++; else count.alias++;
  }
  if(!history[query]) history[query]=new Set();
  history[query].add(hit.match);
 }
}
assert.equal(seen.size,332);
assert.deepEqual(count,{direct:257,alias:44,related:72},
 'Search coverage baseline must not regress by replacing direct hits with vague navigation.');
// No recognized but unqualified subject may leave a user at a dead end.
for(const candidate of engine.candidates) {
 assert.deepEqual(idsOf(candidate),[],'Unqualified registry must never return cards: '+candidate);
 assert.ok(engine.related(candidate).length>0,'No separate thematic navigation for '+candidate);
}
assert.equal(engine.themeCount,597);
assert.equal(engine.aliasCount,787);
assert.ok(engine.inflectionCount>120,'Inflections cover newly added themes without per-word patches');

// Every explicit editorial assignment is traceable to one card's direct themes.
for(const record of decisions.records){
 const card=cards.find(c=>c.card_id===record.card_id);
 assert.ok(card,record.card_id+' is present');
 assert.ok(record.interpretive_basis.length>=55,'Rationale needed for '+record.card_id);
 for(const term of record.topics){
  assert.ok(card.direct_themes.includes(term),record.card_id+' lacks reviewed '+term);
  assert.ok(idsOf(term).includes(card.card_id),record.card_id+' not returned by '+term);
 }
}
// All 78 cards have a specified provenance; the ten missing locked upright
// court descriptions are explicitly backed by Thoth upright source records,
// not fictitiously labeled as Relphi text or reversal-derived membership.
const original=JSON.parse(read('audits/tarot-direct-theme-coverage-20261030.json'));
const missingLocked=original.records.filter(row=>!row.relphi_interpretation&&!row.traditional_upright);
assert.equal(missingLocked.length,10);
assert.equal(courts.reviewed_cards,10);
assert.equal(courts.records.length,10);
assert.deepEqual(missingLocked.map(row=>row.card_id).sort(),courts.records.map(row=>row.card_id).sort());
for(const row of courts.records){
 assert.ok(row.source_url.startsWith('https://'),'Public source provenance: '+row.card_id);
 assert.ok(row.paraphrased_evidence.length>=90,'Source scope and support: '+row.card_id);
 assert.equal(row.source_scope,'upright positive character and direct symbolism');
 const card=cards.find(card=>card.card_id===row.card_id);
 for(const name of row.approved_direct_themes)
  assert.ok(card.direct_themes.includes(name),'Unsourced court theme '+row.card_id+':'+name);
}
for(const boundary of decisions.protected_boundaries)
 for(const id of boundary.must_exclude)
  assert.ok(!idsOf(boundary.query).includes(id),boundary.query+' incorrectly imported '+id);
for(const [query,target] of Object.entries(dictionary.aliases)){
 const hit=engine.resolve(query);
 assert.ok(hit && hit.name===target,'Reviewed lexical equivalent no longer resolves: '+query);
 assert.deepEqual(idsOf(query),idsOf(target),'Alias must preserve exact direct-card membership: '+query);
}
for(const [query,topics] of Object.entries(dictionary.related)){
 assert.deepEqual(idsOf(query),[],'Related subject must not silently qualify a card: '+query);
 assert.ok(topics.every(topic=>engine.directCardIds(topic).length>0),
   'Related suggestions must be independently qualified: '+query);
 const actual=engine.related(query);
 assert.ok(topics.some(t=>actual.includes(t)),'At least one actual related suggestion: '+query);
}
for(const [word,expected] of Object.entries({
 'anger':['knight_of_swords','princess_of_wands','princess_of_swords'],
 'shame':['five_of_swords','the_tower'],
 'trust':['two_of_cups','queen_of_cups','prince_of_disks'],
 'loyalty':['queen_of_cups'],
 'loneliness':['five_of_pentacles'],
 'cheating':['seven_of_swords'],
 'abuse':['the_devil','nine_of_swords'],
 'homelessness':['five_of_pentacles'],
 'unemployment':['five_of_pentacles'],
 'purpose':['ten_of_wands','strength','the_sun'],
 'reconciliation':['temperance'],
 'budget':['two_of_pentacles','four_of_pentacles'],
 'war':['the_chariot','knight_of_swords'],
 'gain':['nine_of_pentacles'],
 'arrival':['knight_of_cups']
})) assert.deepEqual(idsOf(word),expected.sort(),'Independent card set for '+word);

// Canonical theme noun plurals are applied safely. Existing canonicals and
// protected aliases take precedence; grammatical forms cannot merge card sets.
const canon=[...new Set(cards.flatMap(c=>c.direct_themes))];
for(const name of canon){
 if(!/^[a-z]{4,}$/.test(name)||/s$/.test(name))continue;
 const plural=/[^aeiou]y$/.test(name)?name.slice(0,-1)+'ies'
   :/(ch|sh|x|z)$/.test(name)?name+'es':name+'s';
 const hit=engine.resolve(plural);
 if(!hit || hit.match==='unqualified')continue;
 if(hit.match==='inflection')assert.deepEqual(idsOf(plural),idsOf(name),
   'Inflection must retain only first-degree card set: '+plural);
}
assert.deepEqual(idsOf('self control'),idsOf('self-control'));
assert.deepEqual(idsOf('SELF–CONTROL'),idsOf('self-control'));
assert.ok(!idsOf('love').includes('seven_of_swords'));
assert.ok(!idsOf('love').includes('nine_of_swords'));
console.log('PASS broad domain audit: 373 queries, 332 unique, 8 domains, '+count.direct+
 ' direct, '+count.alias+' lexical, '+count.related+' separately navigable; 597 themes and 787 aliases.');
