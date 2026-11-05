import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const legacy=readFileSync('sky-chart-relationship-color-hints.js','utf8');
const harmonic=readFileSync('sky-chart-harmonic-orb-v1.js','utf8');
const css=readFileSync('sky-chart-foundation-interactions-v1.css','utf8');
const expected={conjunction:'#e53935',semisextile:'#7c9b49',semisquare:'#b86d43',sextile:'#d3b727',quintile:'#8b6cc2',square:'#d6534d',trine:'#4e9e69',sesquiquadrate:'#9f5944',biquintile:'#7655aa',quincunx:'#4b8e88',opposition:'#5961c8'};
for(const [key,color] of Object.entries(expected)){
 assert.ok(legacy.includes(key+":'"+color+"'"),'Color overlay must use original '+key+' color');
 const alias={'semisextile':'semi-sextile','semisquare':'octile','sesquiquadrate':'tri-octile','biquintile':'bi-quintile'}[key]||key;
 assert.ok(harmonic.includes("id:'"+alias+"'")&&harmonic.includes("color:'"+color+"'"),'The harmonic aspect '+alias+' retains its original color');
 assert.ok(css.includes('data-aspect="'+alias+'"] { --relationship-aspect-color:'+color), 'The Relationships tile matches '+alias);
}
assert.ok(legacy.includes('result[aspect.key] = CANONICAL[aspect.key] || colorForDegrees(aspect.degrees)'),'New harmonic-only aspects retain deterministic fallback colors');
console.log('Canonical palette consistent in wheel overlay, harmonics, and Relationships.');
