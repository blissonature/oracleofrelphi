import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('chrome-extension/relphi-sky-intake/recognizer.js','utf8');
const scope={Date,URL,URLSearchParams};vm.createContext(scope);vm.runInContext(source,scope);
const R=scope.RelphiSkyRecognizer;
function test(value,expected,options){
  const result=R.recognize(value,options);
  for(const[key,want]of Object.entries(expected))assert.equal(result[key],want,value+' · '+key+': '+JSON.stringify(result));
  return result;
}
test('Location: Salt Lake City, Utah\nDate: November 9, 2026\nTime: 3:15 AM',
  {date:'2026-11-09',time:'03:15',location:'Salt Lake City, Utah',complete:true});
test('Where: Malden, Massachusetts\nDate: 8 October 1985\nTime: 04:37',
  {date:'1985-10-08',time:'04:37',location:'Malden, Massachusetts',complete:true});
test('Date: 2024-02-29\nTime unknown\nPlace: Rome, Italy',
  {date:'2024-02-29',timeUnknown:true,location:'Rome, Italy',complete:true});
assert.ok(test('Date: 2026-02-30',{date:'',complete:false}).errors.length,'Invalid day must not pass');
assert.ok(test('11/09/2026',{date:''}).errors.some(x=>x.includes('Ambiguous')),'Ambiguous slash date must not pass');
test('11/09/2026',{date:'2026-11-09'},{dateOrder:'mdy'});
test('09/11/2026',{date:'2026-11-09'},{dateOrder:'dmy'});
test('13/11/2026',{date:'2026-11-13'});
assert.ok(test('Nov 9, 2026 and Nov 10, 2026',{}).errors.some(x=>x.includes('Multiple')));
test('2026-11-09',{date:'2026-11-09',time:'',location:'',complete:false,hasAny:true});
test('Where: 10 Downing Street, London',{location:'10 Downing Street, London',date:'',hasAny:true});
const addresses=R.addresses('Visit 1600 Pennsylvania Avenue NW, Washington, DC 20500 or 10 Downing Street, London.');
assert.ok(addresses.length>=2,'Recognize two independent street addresses: '+JSON.stringify(addresses));
assert.ok(addresses[0].value.includes('Washington, DC'),'Keep city and region with the street address: '+JSON.stringify(addresses));
assert.equal(R.links('Nov 9, 2026 in Salt Lake City, Utah',{}).length,0,'Opt-in defaults to no inline links');
const dates=R.links('Nov 9, 2026 in Salt Lake City, Utah',{linkDates:true});
assert.ok(dates.length===1&&dates[0].kind==='date','Date linking works independently');
const cities=R.links('Nov 9, 2026 in Salt Lake City, Utah',{linkAddresses:true});
assert.ok(cities.length===1&&cities[0].kind==='address','Address linking works independently');
assert.equal(R.candidate('date','November 9, 2026').location,'','Date-only cannot borrow a location');
assert.equal(R.candidate('address','Salt Lake City, Utah').date,'','Address-only cannot borrow a date');
const url=R.skyURL(R.candidate('selection','Location: Salt Lake City, Utah\nDate: November 9, 2026\nTime: 3:15 AM'));
const packet=JSON.parse(new URLSearchParams(new URL(url).hash.slice(1)).get('relphiSkyIntake'));
assert.equal(packet.date,'2026-11-09');
assert.equal(packet.location,'Salt Lake City, Utah');
assert.equal(packet.time,'03:15');
console.log('Recognizer accepted full/partial dates, local times, unknown time, independent links, and rejected ambiguous/invalid dates.');

assert.match(R.destination('preview'),/sky-chart-preview\/sky-chart\.html\?ref=/);
assert.equal(R.destination('live'),'https://oracleofrelphi.com/sky-chart.html');
