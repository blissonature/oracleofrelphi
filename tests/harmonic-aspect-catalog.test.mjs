import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const win={addEventListener(){},dispatchEvent(){}};
const context=vm.createContext({window:win,localStorage:{getItem(){return null},setItem(){}},document:{addEventListener(){},querySelectorAll(){return []},querySelector(){return null},documentElement:{dataset:{}}}});
function load(name){vm.runInContext(fs.readFileSync(join(root,name),'utf8'),context,{filename:name})}
load('relphi-harmonic-aspect-catalog-v1.js');
load('relphi-glyph-registry-v1.js');
load('sky-chart-harmonic-orb-v1.js');
const cat=win.RelphiHarmonicAspectCatalog;
const orb=win.RelphiHarmonicOrb;
const gcd=(a,b)=>b?gcd(b,a%b):a;

test('harmonics 1–40 have unique irreducible aspect angles and retain original 11 names',()=>{
 assert.equal(cat.maxOrder,40);
 assert.equal(cat.legacyIds.length,11);
 const ids=new Set(),fractions=new Set();
 for(const a of cat.aspects){
  assert.ok(!ids.has(a.id),'duplicate aspect id: '+a.id);ids.add(a.id);
  assert.ok(Number.isFinite(a.angle)&&a.angle>=0&&a.angle<=180);
  assert.ok(!fractions.has(a.harmonic+':'+a.numerator),'duplicate fraction: '+a.id);
  fractions.add(a.harmonic+':'+a.numerator);
  if(a.numerator)assert.equal(gcd(a.harmonic,a.numerator),1,a.id);
  assert.ok(Math.abs(a.angle-360*a.numerator/a.harmonic)<1e-9);
 }
 for(const id of cat.legacyIds)assert.ok(cat.byId(id)?.legacy,'legacy id lost: '+id);
});

test('named harmonic families and exact fractional angles are present',()=>{
 for(const [id,angle] of Object.entries({
  septile:360/7,'bi-septile':720/7,'tri-septile':1080/7,
  novile:40,'bi-novile':80,'quadri-novile':160,
  decile:36,'tri-decile':108,undecile:360/11,
  quindecile:24,vigintile:18,'semi-duodecile':15,
  trigintasextile:10,quadragintile:9,
  'harmonic-13-1':360/13
 })){
  assert.ok(cat.byId(id),'missing '+id);
  assert.ok(Math.abs(cat.byId(id).angle-angle)<1e-9,id);
 }
 assert.equal(cat.byId('tridecile').id,'tri-decile');
 assert.equal(cat.byId('elftile').id,'undecile');
});

test('phase orb scales proportionally to fundamental harmonic order',()=>{
 for(const a of cat.aspects){
  const exact=orb.metrics(a.angle,a,7);
  assert.ok(exact.active,a.id);
  assert.ok(Math.abs(exact.phaseError)<1e-9,a.id);
  const within=orb.metrics(a.angle+Math.min(0.15,3/a.harmonic),a,7);
  if(a.angle+Math.min(0.15,3/a.harmonic)<=180)assert.ok(within.active,a.id);
 }
 const decile=cat.byId('tri-decile');
 assert.equal(orb.metrics(109,decile,7).phaseError,10);
 assert.equal(orb.metrics(109,decile,7).active,false);
 assert.equal(orb.metrics(108.5,decile,7).active,true);
});

test('every calculated fraction has a canonical glyph-registry identity',()=>{
 for(const a of cat.aspects){
  assert.ok(win.RelphiGlyphRegistry.get(a.id),'no registry identity: '+a.id);
 }
 assert.equal(win.RelphiGlyphRegistry.resolve('Tridecile').id,'tri-decile');
});
