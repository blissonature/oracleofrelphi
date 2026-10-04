const assert=require('node:assert/strict');
const engine=require('../relphi-astrology-significance-v2.js');

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
assert.match(text,/Libra–Capricorn cluster square/);
assert.match(text,/Reinforced meridian complex/);
assert.doesNotMatch(JSON.stringify(analysis),/tarot|card-hit|seven_of_cups/i);
const meridian=analysis.factors.find(f=>f.kind==='axis'&&/meridian/i.test(f.title));
assert.ok(meridian.evidence.some(e=>/Venus square MC|Venus square IC/.test(e.text)));
assert.ok(meridian.evidence.some(e=>/Pluto square MC|Pluto square IC/.test(e.text)));
assert.ok(!meridian.evidence.some(e=>/MC occupies|IC occupies/.test(e.text)),'angles should not count themselves as reinforcement');
assert.ok(!meridian.evidence.some(e=>/MC occupies|IC occupies/.test(e.text)),'the meridian must not count its own angles as reinforcement');
const clusterSquare=analysis.factors.find(f=>f.kind==='cluster-relationship'&&/Libra–Capricorn cluster square/.test(f.title));
assert.ok(clusterSquare,'Libra and Capricorn stellia should synthesize into one square structure');
assert.ok(clusterSquare.meta.links.length>=3,'cluster relationship requires multiple direct cross-links');
assert.ok(clusterSquare.meta.left.coverage>=.5&&clusterSquare.meta.right.coverage>=.5,'both clusters must materially participate');
assert.ok(!analysis.factors.some(f=>f.kind==='concentration'&&/Libra|Capricorn/.test(f.title)),'combined cluster relationship should suppress redundant concentration factors');
assert.ok(analysis.factors.every(f=>f.question&&Array.isArray(f.evidence)&&f.evidence.length));
assert.ok(analysis.skies.flatMap(s=>s.candidates).every(f=>Array.isArray(f.evidence)),'every candidate must expose evidence as an array');
console.log('Significant Factors compress Kendra into non-Tarot astrological structures.');

const defensive=engine.synthesize({skyA:kendra,maxFactors:7});
const candidate=defensive.skies.flatMap(s=>s.candidates).find(f=>f.kind==='relationship');
if(candidate){
  candidate.evidence=candidate.evidence[0];
  // Public synthesis starts clean, but the evidence contract must also tolerate a singular legacy value.
  assert.ok(candidate.evidence && !Array.isArray(candidate.evidence));
}

const unrelated={name:'Unrelated clusters',placements:{
  Sun:{sign:'Aries',degree:1,house:1},Mercury:{sign:'Aries',degree:12,house:1},Venus:{sign:'Aries',degree:23,house:1},
  Mars:{sign:'Virgo',degree:2,house:4},Jupiter:{sign:'Virgo',degree:14,house:4},Saturn:{sign:'Virgo',degree:26,house:4},
  Asc:{name:'Ascendant',sign:'Virgo',degree:10,house:1},MC:{name:'Medium Coeli',sign:'Gemini',degree:10,house:10}
}};
const unrelatedAnalysis=engine.synthesize({skyA:unrelated,maxFactors:7});
assert.ok(!unrelatedAnalysis.factors.some(f=>f.kind==='cluster-relationship'),'two concentrations without enough actual cross-aspects must remain separate');
