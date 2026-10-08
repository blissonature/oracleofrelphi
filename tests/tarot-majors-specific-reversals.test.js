const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('tarot-reversed-copy-v1.js','utf8');
const ids=['the_fool','the_magician','the_high_priestess','the_empress','the_emperor','the_hierophant','the_lovers','the_chariot','strength','the_hermit','wheel_of_fortune','justice','the_hanged_man','death','temperance','the_devil','the_tower','the_star','the_moon','the_sun','judgement','the_world'];
const lines=source.split('\n');
for(const id of ids){
 const line=lines.find(line=>line.trimStart().startsWith(id+': '));
 assert.ok(line,id+' must have a specific reversed operation');
 assert.ok(line.length>130,id+' must have substantive reversed meaning');
 assert.doesNotMatch(line,/turns inward:|core operation turning inward/i);
}
assert.match(source,/MAJOR_REVERSED\[card\.card_id\]/);
console.log('22 Major reversed interpretations covered');
