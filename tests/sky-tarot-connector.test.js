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
assert.equal(full.entries.filter(e=>e.card.card_type==='Court').length,12,'Must find all 12 range-attributed courts');
check(!full.entries.some(e=>e.card.card_id.startsWith('princess_')),'Princess quadrants are not ordinary court zodiac ranges');
check(full.entries.length>12,'No arbitrary 12-card truncation');
check(full.hitCount>full.entries.length,'Preserve all reasons when the same card matches several placements');
assert.equal(full.houseReady,false,'Unknown-time chart has no invented houses');
check(full.entries.every(e=>e.hits.every(h=>h.house===null)),'Unknown-time entries do not retain house numbers');

const ariesTen=api.calculate({placements:{Mars:{longitude:10}}},cards);
check(!!find(ariesTen,'three_of_wands'),'10° Aries matches Three of Wands');
check(!find(ariesTen,'two_of_wands'),'10° Aries does not match Two of Wands');
check(!!find(ariesTen,'the_emperor'),'Aries matches Emperor major');
check(!!find(ariesTen,'the_tower'),'Mars matches Tower major');
check(!!find(ariesTen,'queen_of_wands'),'10° Aries matches Queen of Wands range');

const known={
  name:'Known-time',
  calcProfile:{timeUnknown:false,houseCusps:Array.from({length:12},(_,i)=>i*30)},
  placements:{Ascendant:{longitude:5},Sun:{longitude:123},Venus:{longitude:190}}
};
const result=api.calculate(known,cards);
assert.equal(result.houseReady,true,'Known house cusps enable House view');
check(find(result,'strength').hits.some(h=>h.house===5),'The Leo Sun is in house 5');
check(find(result,'the_tower').hits.some(h=>h.type==='chart-ruler'),'Mars is the chart ruler for Aries rising');
check(result.entries.some(e=>api.modeHits(e,'houses').length>0),'House filter keeps house matches');
check(result.entries.some(e=>api.modeHits(e,'rulers').length>0),'Rulers filter keeps ruler matches');
const partial={calcProfile:{houseCusps:[0,null,60,90,120,150,180,210,240,270,300,330]},placements:{Sun:{longitude:123}}};
assert.equal(api.calculate(partial,cards).houseReady,false,'Incomplete cusp data is not a valid set of 12 houses');
const unknown={...known,calcProfile:{...known.calcProfile,timeUnknown:true}};
assert.equal(api.calculate(unknown,cards).houseReady,false,'Explicit unknown-time overrides stale cusps');

storage.set('relphiSkyChartA',JSON.stringify(known));
storage.set('relphiSkyLibraryV1',JSON.stringify([{id:'fixture-sky',name:'Saved',placements:{Moon:{longitude:100}}}]));
check(api.options().some(s=>s.id==='A'),'Current Sky A is selectable');
check(api.options().some(s=>s.id==='saved:fixture-sky'),'Saved skies are selectable');
check(files.tarot.includes('relphi-sky-tarot-explorer-v1.js'),'Tarot Ledger loads explorer');
check(files.sky.includes('relphi-sky-tarot-explorer-v1.js'),'Sky Chart loads explorer');
check(files.explorer.includes("window.addEventListener('click',event=>"),'Sky Chart navigation precedes legacy document click handling');
check(files.explorer.includes("location.assign('tarot.html?skyConnector='"),'Sky Chart routes into the Ledger, not Drawing Board');
check(files.drawer.includes('Rulers ↗')&&files.drawer.includes('Houses ↗'),'Sky Chart tabs indicate navigation');

console.log('Sky Connector: 78-card deck, all 36 decans, 12 courts, exact boundaries, all hits, houses, unknown time, saved skies, navigation PASS.');
