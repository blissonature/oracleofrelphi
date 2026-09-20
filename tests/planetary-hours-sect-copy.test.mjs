import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('planetary-hours-sect-v1.js','utf8');
const sandbox={
  window:{},
  document:{readyState:'loading',addEventListener(){}},
  location:{pathname:'/planetaryhours.html'},
  Intl,
  Date,
  Map,
  Set,
  Object,
  Number,
  String,
  Math,
  console,
  setTimeout(){},
  clearTimeout(){},
  requestAnimationFrame(){}
};
sandbox.window.window=sandbox.window;
vm.runInNewContext(source,sandbox,{filename:'planetary-hours-sect-v1.js'});

const api=sandbox.window.RelphiPlanetaryHoursSect;
assert.ok(api?.serializeCopy,'Sect copy serializer must be exposed for deterministic testing');

const positions=new Map([
  ['sun',{id:'sun',body:'Sun',sect:'diurnal',isLight:false,isBenefic:false,isMalefic:false,ofSect:false,halb:true,hayz:false}],
  ['moon',{id:'moon',body:'Moon',sect:'nocturnal',isLight:true,isBenefic:false,isMalefic:false,ofSect:true,halb:false,hayz:false}],
  ['mercury',{id:'mercury',body:'Mercury',sect:'diurnal',isLight:false,isBenefic:false,isMalefic:false,ofSect:false,halb:true,hayz:false}],
  ['venus',{id:'venus',body:'Venus',sect:'nocturnal',isLight:false,isBenefic:true,isMalefic:false,ofSect:true,halb:false,hayz:false}],
  ['mars',{id:'mars',body:'Mars',sect:'nocturnal',isLight:false,isBenefic:false,isMalefic:true,ofSect:true,halb:false,hayz:false}],
  ['jupiter',{id:'jupiter',body:'Jupiter',sect:'diurnal',isLight:false,isBenefic:false,isMalefic:false,ofSect:false,halb:true,hayz:false}],
  ['saturn',{id:'saturn',body:'Saturn',sect:'diurnal',isLight:false,isBenefic:false,isMalefic:false,ofSect:false,halb:false,hayz:false}]
]);

const text=api.serializeCopy({chartSect:'nocturnal',positions});
assert.equal(
  text,
  'Night Sect · ☉ Contrary Halb · ☽ Light Sect · ☿ Diurnal Contrary Halb · ♀ Benefic Sect · ♂ Malefic Sect · ♃ Contrary Halb · ♄ Contrary'
);

assert.match(source,/document\.addEventListener\('copy', copySectSelection, true\)/);
assert.match(source,/event\.clipboardData\.setData\('text\/plain', text\)/);
assert.match(source,/event\.clipboardData\.setData\('text\/html', htmlForCopy\(text\)\)/);
assert.doesNotMatch(text,/svg|\*\*/i);

console.log('Planetary Hours Sect semantic copy serializer passed.');
