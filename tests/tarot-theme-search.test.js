'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const cardsText=fs.readFileSync('tarot-cards.js','utf8');
const code=fs.readFileSync('tarot-theme-search-v1.js','utf8');
const app=fs.readFileSync('tarot-app.js','utf8');
const html=fs.readFileSync('tarot.html','utf8');
const audit=JSON.parse(fs.readFileSync('audits/tarot-direct-theme-coverage-20261030.json','utf8'));
const sandbox={window:{}};
vm.runInNewContext(cardsText,sandbox);
vm.runInNewContext(code,sandbox);
const cards=sandbox.window.RELPHI_TAROT_CARDS;
const engine=sandbox.window.RELPHI_THEME_SEARCH;
const actual=(term)=>Array.from(engine.directCardIds(term)).sort();
const direct=term=>Array.from(cards).filter(card=>(card.direct_themes||[]).includes(term)).map(c=>c.card_id).sort();
const exactly=(term,ids)=>assert.deepEqual(actual(term),ids.slice().sort(),term);
assert.equal(cards.length,78);
assert.equal(audit.reviewed_cards,78);
assert.equal(audit.records.length,78);
assert.equal(audit.added_assignments,394);
const directlySourced={"five_of_cups":["betrayal"],"two_of_cups":["friendship","passion"],"three_of_cups":["belonging","healing"],"nine_of_wands":["strength"],"ten_of_swords":["defeat","sadness"],"ten_of_cups":["harmony","friendship","home","contentment"],"seven_of_wands":["competition"],"four_of_wands":["concord"],"two_of_swords":["affection","friendship"],"five_of_swords":["loss"],"eight_of_wands":["message"]};
for(const [id,terms] of Object.entries(directlySourced)){
 const card=cards.find(c=>c.card_id===id);
 const row=audit.records.find(r=>r.card_id===id);
 for(const term of terms){
  assert.ok(card.direct_themes.includes(term),id+' direct theme '+term);
  assert.ok(row.new_direct_themes.includes(term),id+' audit trace '+term);
  assert.match([row.relphi_interpretation,row.traditional_upright,row.traditional_title].join(' ').toLowerCase(),new RegExp('\\b'+term+'\\b'),id+' source evidence for '+term);
 }
}

assert.equal(new Set(audit.records.map(row=>row.card_id)).size,78);
assert.equal(engine.themeCount,597);
assert.equal(engine.aliasCount,787);

// Every canonical theme is strictly equal to the original card-by-card membership.
// No card qualifies through shared planet, suit, a neighboring theme or a search substring.
const allThemes=[...new Set(cards.flatMap(c=>c.direct_themes||[]))];
for(const theme of allThemes)exactly(theme,direct(theme));
assert.equal(allThemes.length,597);

// No two card IDs in one theme; no unresolved card references.
const ids=new Set(cards.map(card=>card.card_id));
for(const name of allThemes){
 const members=actual(name);
 assert.equal(new Set(members).size,members.length,name);
 for(const id of members)assert.ok(ids.has(id),name+' / '+id);
}

// Catch source-explicit but unqualified search terms; distinguish sense errors explicitly.
const candidateSet=new Set(engine.candidates);
for(const theme of allThemes) assert.ok(!candidateSet.has(theme),'Stale unqualified canonical theme: '+theme);
const exceptions=audit.unqualified_source_exceptions;
const mention=(subject,text)=>{
 const escaped=subject.replaceAll(' ','\\s+');
 return new RegExp('(^|[^a-z])'+escaped+'([^a-z]|$)','i').test(text);
};
const reviewedExceptions=new Set();
for(const subject of engine.candidates){
 const sources=audit.records.filter(row=>
   mention(subject,[row.relphi_interpretation,row.traditional_upright,row.traditional_title].join(' ')));
 if(!sources.length)continue;
 const reviewed=exceptions[subject];
 assert.ok(reviewed&&reviewed.reason.length>=45,'Unreviewed literal theme false zero: '+subject);
 assert.deepEqual(sources.map(row=>row.card_id).sort(),reviewed.card_ids.slice().sort(),'Source mismatch: '+subject);
 reviewedExceptions.add(subject);
}
assert.deepEqual([...reviewedExceptions].sort(),Object.keys(exceptions).sort(),
 'Exception ledger must not contain outdated waivers');

// Positive search-language equivalents. Aliases inherit only their canonical membership.
const aliasPairs={
 'agony':'anguish','desperate':'desperation','heartache':'heartbreak',
 'abandoned':'abandonment','abandon a goal':'abandonment of pursuit',
 'abandoning a previous concern':'abandonment of pursuit','feeling abandoned':'being abandoned',
 'left behind':'being abandoned','forsaken':'being abandoned',
 'safe':'safety','feeling safe':'safety',
 'deprivation':'privation','destitution':'poverty','serenity':'peace',
 'tranquility':'peace','rebirth':'renewal','humiliated':'humiliation',
 'ostracism':'exclusion','left out':'exclusion','lied':'lies',
 'betray':'betrayal','fearful':'fear','grief-stricken':'grief',
 'defeated':'defeat','overwhelmed':'overwhelm',
 'secrets':'secrecy','heartbroken':'heartbreak','lost my job':'job loss',
 'feeling despair':'despair','hopelessness':'despair','suffered':'suffering',
 'anguished':'anguish','cruel':'cruelty','oppressed':'oppression',
 'ruined':'ruin','peaceful':'peace','negotiating':'negotiation',
 'developing':'development','reciprocal':'reciprocity',
 'material hardship':'financial hardship','widowed':'widowhood',
 'researching':'research','household harmony':'domestic harmony'
};
for(const [query,canonical] of Object.entries(aliasPairs)){
 assert.equal(engine.resolve(query).name,canonical,query);
 exactly(query,direct(canonical));
}

// Direct abandonment requires explicit source evidence, never inferred loss or departure.
exactly('abandonment',['eight_of_cups','the_star']);
exactly('being abandoned',['the_star']);
exactly('abandonment of pursuit',['eight_of_cups']);
exactly('abandon a goal',['eight_of_cups']);
exactly('feeling abandoned',['the_star']);
exactly('safety',['nine_of_pentacles']);
exactly('miscarriage',['nine_of_swords']);
for(const id of ['three_of_swords','five_of_cups','five_of_pentacles','six_of_swords'])
 assert.ok(!actual('abandonment').includes(id),'No second-degree abandonment: '+id);
assert.deepEqual(Array.from(audit.abandonment_review.direct.map(item=>item.card_id)).sort(), actual('abandonment'));
assert.equal(audit.abandonment_review.excluded.length,4);
exactly('despair',['nine_of_swords','ten_of_swords']);
exactly('suffering',['three_of_swords','nine_of_swords','ten_of_swords','five_of_pentacles']);
exactly('despair and suffering',['three_of_swords','nine_of_swords','ten_of_swords','five_of_pentacles']);
exactly('cruelty',['nine_of_swords']);
exactly('oppression',['ten_of_wands']);
exactly('ruin',['ten_of_swords','the_tower']);
exactly('peace',['four_of_wands','two_of_swords']);
exactly('development',['the_empress']);
exactly('secrecy',['seven_of_swords','the_high_priestess','the_moon','prince_of_cups']);
exactly('love',['ace_of_cups','two_of_cups','ten_of_cups','knight_of_cups','queen_of_cups','princess_of_cups','the_lovers']);
exactly('betrayal',['five_of_cups','three_of_swords','five_of_swords','seven_of_swords','ten_of_swords']);

// Distinct human events never inherit adjacent cards through vague links.
// Ordinary but not-directly-qualified subjects offer safe navigation instead of false card hits.
for(const q of ["depression","depressed","fraud","robbery","corruption","manipulation","injustice","unfairness","housing","injury"]){
 exactly(q,[]);
 assert.equal(engine.resolve(q).match,'unqualified',q);
 assert.ok(engine.related(q).length>0,q+' has related, separately qualified topics');
}
for(const q of ['divorce','infidelity']){
 exactly(q,[]);
 assert.equal(engine.resolve(q).match,'unqualified',q);
 assert.ok(engine.related(q).length>0,q+' related topic navigation exists');
 for(const theme of engine.related(q))assert.ok(actual(theme).length>0,q+' -> '+theme);
}
for(const q of ['love','betrayal','secrecy','despair','suffering','abandonment','being abandoned','safety','miscarriage','cheating','reconciliation','loneliness','shame','trust']){
 assert.equal(engine.resolve(q).match,'exact');
}
assert.ok(!actual('love').includes('seven_of_swords'));
assert.ok(!actual('love').includes('nine_of_swords'));
assert.ok(!actual('secrets').includes('three_of_swords'));
assert.ok(!actual('oppression').includes('the_tower'),'reversed-only reading excluded');
assert.equal(engine.resolve('ideas').name,'ideas','canonical theme outranks alias');
assert.equal(engine.resolve('messages').name,'messages','canonical theme outranks alias');
// Punctuation and ordinary prose must normalize without creating related-card leakage.
for(const [query,theme] of Object.entries({'despair?':'despair','“suffering!”':'suffering',"'heartache.'":'heartbreak','SECRETS.':'secrecy'})) exactly(query,direct(theme));
assert.ok(!actual('heartache').includes('seven_of_swords'));
assert.ok(!actual('serenity').includes('three_of_swords'));
assert.ok(!actual('deprivation').includes('ten_of_cups'));
assert.equal(engine.resolve('self control').name,'self-control');
assert.equal(engine.resolve('SELF–CONTROL').name,'self-control');
assert.deepEqual(actual('self control'),actual('self-control'));
assert.ok(engine.inflectionCount>120,'One-word inflections must be generated from the entire curated index');
assert.ok(engine.related('self-worth').length>0,'Hyphenated terms resolve separate related navigation');
assert.ok(!actual('love').includes('seven_of_swords'),'Cheating does not leak into love');
assert.deepEqual(actual('cheating'),['seven_of_swords']);
assert.ok(engine.suggest('secrects').some(item=>item.name==='secrecy'));
assert.ok(engine.suggest('despairr').some(item=>item.name==='despair'));
assert.ok(engine.matchingTagNames('secrets',['secrecy','betrayal','Cups']).includes('secrecy'));

// Browser integration: both interfaces load the same direct theme engine.
assert.match(app,/card\.direct_themes/);
assert.match(app,/RELPHI_THEME_SEARCH\?\.matchingTagNames/);
assert.match(app,/RELPHI_THEME_SEARCH\.directCardIds\(raw\)/);
assert.match(app,/RELPHI_THEME_SEARCH\?\.suggest/);
assert.match(app,/RELPHI_THEME_SEARCH\?\.related/);
assert.match(app,/data-row-theme-suggestion/);
assert.match(html,/<script src="tarot-theme-search-v1\.js\?v=1"><\/script>[\s\S]*<script src="tarot-app\.js\?v=416"><\/script>/);
console.log('PASS: 78 cards, 597 first-degree themes, 787 aliases, all 597 direct sets, source-gap guard, protected relevance and integrated searches.');
