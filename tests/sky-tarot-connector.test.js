'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const files = {
  explorer: fs.readFileSync('relphi-sky-tarot-explorer-v1.js', 'utf8'),
  tarot: fs.readFileSync('tarot.html', 'utf8'),
  sky: fs.readFileSync('sky-chart.html', 'utf8'),
  drawer: fs.readFileSync('sky-chart-card-hits-drawer-v3.js', 'utf8')
};
const storage = new Map();
const context = {
  window: {},
  location: {pathname:'/sky-chart.html'},
  localStorage: {getItem(key){ return storage.get(key) ?? null; }},
  document: {readyState:'loading', addEventListener(){}}
};
vm.runInNewContext(fs.readFileSync('tarot-cards.js','utf8'),context);
vm.runInNewContext(files.explorer,context);
const cards = context.window.RELPHI_TAROT_CARDS;
const api = context.window.RelphiSkyTarotExplorerV1;
const check = (condition,message) => assert.ok(condition,message);
const find = (output,id) => output.entries.find(e=>e.card.card_id===id);
check(api && cards.length===78,'The explorer loads the canonical 78-card deck');

const allDecans = {name:'All decans',calcProfile:{timeUnknown:true},placements:{}};
for(let i=0;i<36;i++) allDecans.placements['P'+i]={longitude:i*10+0.001};
const full=api.calculate(allDecans,cards);
assert.equal(full.entries.filter(e=>e.card.card_type==='Pip').length,36,'Must find all 36 unique decan pips');
assert.equal(full.entries.filter(e=>e.card.card_type==='Court').length,0,'Court cards are not sky-specific matches');
check(!full.entries.some(e=>e.card.card_id.startsWith('princess_')),'Princess quadrants are not ordinary court zodiac ranges');
check(full.entries.length>12,'No arbitrary 12-card truncation');
check(full.hitCount>full.entries.length,'Preserve all reasons when the same card matches several placements');
assert.equal(full.houseReady,false,'Unknown-time chart has no invented houses');
check(full.entries.every(e=>e.hits.every(h=>h.house===null)),'Unknown-time entries do not retain house numbers');

const ariesTen=api.calculate({placements:{Mars:{longitude:10}}},cards);
check(!!find(ariesTen,'three_of_wands'),'10° Aries matches Three of Wands');
check(!find(ariesTen,'two_of_wands'),'10° Aries does not match Two of Wands');
check(!find(ariesTen,'the_emperor'),'Major Arcana are not Sky Connector matches');
check(!find(ariesTen,'the_tower'),'Planetary Majors are not Sky Connector matches');
check(!find(ariesTen,'queen_of_wands'),'10° Aries does not pull in Court cards');
const natalMars=api.calculate({placements:{Mars:{longitude:150+17+52/60}}},cards);
check(!!find(natalMars,'nine_of_pentacles'),'Mars in Virgo second decan matches Venus in Virgo Nine of Pentacles');
check(find(natalMars,'nine_of_pentacles').hits.some(h=>h.body==='Mars'),'The matching body is Mars rather than the decan ruler Venus');
check(natalMars.entries.every(e=>e.card.arcana!=='Major'),'All matches are Minor Arcana');
const known={
  name:'Known-time',
  calcProfile:{timeUnknown:false,houseCusps:Array.from({length:12},(_,i)=>i*30)},
  placements:{Ascendant:{longitude:5},Sun:{longitude:123},Venus:{longitude:190}}
};
const result=api.calculate(known,cards);
assert.equal(result.houseReady,true,'Known house cusps enable house context');
check(result.entries.every(e=>e.card.arcana!=='Major'),'Houses never create Major Arcana matches');
check(result.entries.every(e=>e.hits.every(h=>h.type==='decan'||h.type==='court')),'Houses never generate a tarot match');
check(result.entries.some(e=>e.hits.some(h=>h.house===5)),'Existing house position can annotate a Minor match');
const partial={calcProfile:{houseCusps:[0,null,60,90,120,150,180,210,240,270,300,330]},placements:{Sun:{longitude:123}}};
assert.equal(api.calculate(partial,cards).houseReady,false,'Incomplete cusp data is not a valid set of 12 houses');
const unknown={...known,calcProfile:{...known.calcProfile,timeUnknown:true}};
assert.equal(api.calculate(unknown,cards).houseReady,false,'Explicit unknown-time overrides stale cusps');

storage.set('relphiSkyChartA',JSON.stringify(known));
storage.set('relphiSkyLibraryV1',JSON.stringify([{id:'fixture-sky',name:'Saved',placements:{Moon:{longitude:100}}}]));
check(api.options().some(s=>s.id==='A'),'Current Sky A is selectable');
check(api.options().some(s=>s.id==='saved:fixture-sky'),'Saved skies are selectable');
check(files.tarot.includes('relphi-sky-tarot-explorer-v1.js'),'Tarot Ledger loads explorer');
check(!files.sky.includes('relphi-sky-tarot-explorer-v1.js'),'Sky Chart ruler/house wheel remains independent of Tarot Ledger');
check(!files.drawer.includes('Rulers ↗')&&!files.drawer.includes('Houses ↗'),'Sky Chart Rulers and Houses remain native tabs');

check(!files.explorer.includes('body.sky-connector-open'),'No global visibility takeover of Tarot Ledger');
check(!files.explorer.includes('.sky-connector-cards'),'No replacement visual card grid');
check(files.explorer.includes("listPanel.insertBefore(panel,listPanel.querySelector('.cards-heading'))"),'Sky controls reuse the native index layout');
check(files.explorer.includes("cardList.querySelector('.tarot-result-grid')"),'Sky results filter the native Ledger card grid');
check(files.explorer.includes("showAll.addEventListener('click'"),'Native Show All Cards exits the sky filter');
check(files.explorer.includes("panel.querySelector('[data-sky-close]').addEventListener('click',close)"),'Sky controls have an explicit native-index return');
check(files.explorer.includes("badge.className='or-hit-badge'"),'Sky hit reasons use canonical badge styling');
check(files.explorer.includes("mark.className='relphi-connected-sky-mark'"),'Reuse the existing 12-color sky match marker');
check(files.explorer.includes("searchTerm=searchInput?.value.trim()||''"),'A blank search selects all matching Minors');
check(files.explorer.includes("searchTerm='';"),'Clearing a keyword restores all selected-sky matches');
check(files.explorer.includes('function markOrdinaryResults()'),'Ordinary search visually marks sky matches without filtering');
check(files.explorer.includes('else markOrdinaryResults();'),'Ordinary index begins in unfiltered marker mode');


console.log('Sky Connector: Minor-only planetary degrees, decans, courts, Mars in Virgo, empty search, native marker and index PASS.');
