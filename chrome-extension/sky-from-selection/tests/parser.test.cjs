const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const parent = path.join(__dirname, '..');
const context = {};
vm.runInNewContext(fs.readFileSync(path.join(parent,'parser.js'),'utf8'), context);
const parser = context.RelphiSelectionParser;
const cases = [
 ['October 4, 1985, at approximately 8:34 p.m. E.D.T. in Massachusetts.', {date:'1985-10-04',time:'20:34',location:'Massachusetts',timeZoneAbbreviation:'EDT'}],
 ['October 4, 1985, at approximately 8:34 p.m. EDT in Massachusetts', {date:'1985-10-04',time:'20:34',location:'Massachusetts',timeZoneAbbreviation:'EDT'}],
 ['October 4, 1985, at 8:34 PM EDT, Malden, Massachusetts', {date:'1985-10-04',time:'20:34',location:'Malden, Massachusetts',timeZoneAbbreviation:'EDT'}],
 ['October 4, 1985 at 8:34 PM in Malden, Massachusetts', {date:'1985-10-04',time:'20:34',location:'Malden, Massachusetts',timeZoneAbbreviation:null}],
 ['December 12, 2001, 5:30 p.m. PST, 9600 Wilshire Boulevard, Beverly Hills, California 90212, U.S.A.', {date:'2001-12-12',time:'17:30',location:'9600 Wilshire Boulevard, Beverly Hills, California 90212, U.S.A.',timeZoneAbbreviation:'PST'}],
 ['October 29, 1971 at 11:00 AM in Rochester, New York',{date:'1971-10-29',time:'11:00',location:'Rochester, New York',timeZoneAbbreviation:null}],
 ['October 29, 1971 in Rochester, New York',{date:'1971-10-29',time:null,location:'Rochester, New York',timeZoneAbbreviation:null}],
];
for (const [input,expected] of cases){const actual=parser.parseSingle(input);for(const [key,value] of Object.entries(expected))assert.equal(actual[key],value,`${key} for ${input}`);}
const paired=parser.parse('Born October 4, 1985, at approximately 8:34 p.m. E.D.T. in Malden, Massachusetts; died October 29, 2020 at 11:00 a.m. E.D.T. in Boston, Massachusetts');
assert.equal(paired.length,2);assert.equal(paired[0].time,'20:34');assert.equal(paired[0].timeZoneAbbreviation,'EDT');assert.equal(paired[0].location,'Malden, Massachusetts');assert.equal(paired[1].time,'11:00');assert.equal(paired[1].timeZoneAbbreviation,'EDT');assert.equal(paired[1].location,'Boston, Massachusetts');
console.log('PASS: '+cases.length+' single-event cases and two-event comparison');