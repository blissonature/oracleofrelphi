const assert = require('node:assert/strict');
const fs = require('node:fs');

const js = fs.readFileSync('tarot-app.js','utf8');

const fn = js.match(/function zodiacRangeGraphicHtml\(card\) \{[\s\S]*?\n  \}/);
assert.ok(fn,'zodiacRangeGraphicHtml must exist');
assert.match(fn[0],/COURT_RANGES\.find\(item=>item\.id===card\.card_id\)/);
assert.match(fn[0],/20°/);
assert.match(fn[0],/\[-–—\]/);
assert.match(js,/\{ id: 'knight_of_swords', start: 'Taurus', startDegree: 20, end: 'Gemini', endDegree: 20 \}/);

console.log('Court cards, including Knight of Swords, use canonical court ranges for the shared zodiac-range graphic.');
