const assert=require('node:assert/strict');
const engine=require('../relphi-astrology-significance-v1.js');

const kendra={name:'Kendra',placements:{
  Sun:{sign:'Libra',degree:2+56/60,house:5},Moon:{sign:'Leo',degree:20+16/60,house:4},
  Mercury:{sign:'Libra',degree:0+35/60,house:5},Venus:{sign:'Scorpio',degree:15+40/60,house:6},
  Mars:{sign:'Libra',degree:4+10/60,house:5},Jupiter:{sign:'Cancer',degree:9+8/60,house:2},
  Saturn:{sign:'Capricorn',degree:7+28/60,house:8},Uranus:{sign:'Capricorn',degree:1+26/60,house:7},
  Neptune:{sign:'Capricorn',degree:9+36/60,house:8},Pluto:{sign:'Scorpio',degree:13+30/60,house:6},
  Chiron:{sign:'Cancer',degree:15+54/60,house:2},Lilith:{sign:'Libra',degree:25+33/60,house:5},
  Fortune:{name:'Part of Fortune',sign:'Cancer',degree:23+1/60,house:2},Vertex:{sign:'Scorpio',degree:4+37/60,house:6},
  MC:{name:'Medium Coeli',sign:'Aquarius',degree:14+34/60,house:10},NorthNode:{name:'North Node',sign:'Aquarius',degree:23+35/60,house:10},
  SouthNode:{name:'South Node',sign:'Leo',degree:23+35/60,house:4},Asc:{name:'Ascendant',sign:'Gemini',degree:10+21/60,house:1},
  Desc:{name:'Descendant',sign:'Sagittarius',degree:10+21/60,house:7},IC:{name:'Imum Coeli',sign:'Leo',degree:14+34/60,house:4}
}};
const analysis=engine.synthesize({skyA:kendra,maxFactors:7});
assert.ok(analysis.factors.length>=4&&analysis.factors.length<=7);
const text=analysis.factors.map(f=>f.title+' '+f.claim).join('\n');
assert.match(text,/Chart-ruler dispositor structure/);
assert.match(text,/Empowered polarity/);
assert.match(text,/Libra|House 5|Mercury conjunct Sun|Mercury conjunct Mars/);
assert.match(text,/Reinforced meridian complex/);
assert.doesNotMatch(JSON.stringify(analysis),/tarot|card-hit|seven_of_cups/i);
const meridian=analysis.factors.find(f=>f.kind==='axis'&&/meridian/i.test(f.title));
assert.ok(meridian.evidence.some(e=>/Venus square MC|Venus square IC/.test(e.text)));
assert.ok(meridian.evidence.some(e=>/Pluto square MC|Pluto square IC/.test(e.text)));
assert.ok(analysis.factors.every(f=>f.question&&f.evidence.length));
console.log('Significant Factors compress Kendra into non-Tarot astrological structures.');
