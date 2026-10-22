import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import vm from 'node:vm';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
function setup(matrix,domCells={}){
 const store=new Map([
  ['relphiSkyAspectMatrixV1',JSON.stringify(matrix)],
  ['relphiSkyChartA',JSON.stringify({placements:{saturn:{longitude:235.56667}}})],
  ['relphiSkyChartB',JSON.stringify({placements:{moon:{longitude:120.4}}})]
 ]);
 const window={addEventListener(){},dispatchEvent(){},RelphiRelationshipExportHouses:{include:()=>false}};
 const document={readyState:'loading',addEventListener(){},documentElement:{dataset:{relationshipDisplay:'referents'}},querySelector(selector){
   const match=selector.match(/data-aspect-matrix-scope="([^"]+)"\]\[data-aspect-matrix-aspect="([^"]+)"/);
   if(match&&Object.hasOwn(domCells,match[1]+':'+match[2]))return {checked:domCells[match[1]+':'+match[2]]};
   return null;
 }};
 const location={pathname:'/sky-chart.html'};
 const localStorage={getItem:key=>store.get(key)||null,setItem:(key,v)=>store.set(key,v)};
 const context=vm.createContext({window,document,location,localStorage,URLSearchParams,console});
 for(const path of ['relphi-harmonic-aspect-catalog-v1.js','relphi-glyph-registry-v1.js','sky-chart-relationship-scope-sections-v1.js','sky-chart-inline-relationship-copy-v1.js']){
  vm.runInContext(readFileSync(join(root,path),'utf8'),context,{filename:path});
 }
 return {window,document,store};
}
function empty(){return{'A-A':[],'A-B':[],'B-B':[]}}

test('export recognizes newly selected harmonics without reporting Aspects: None',()=>{
 const matrix=empty();matrix['A-A']=['harmonic-19-5','septile'];
 const {window}=setup(matrix);
 const focus=window.RelphiRelationshipExportFocus.matrix();
 assert.match(focus.aspects,/Harmonic 19 · 5\/19/);
 assert.match(focus.aspects,/Septile/);
 assert.equal(focus.scopes,'A↔A');
 assert.doesNotMatch(focus.aspects,/None/);
});

test('export reports None only when the complete harmonic matrix is unselected',()=>{
 const {window}=setup(empty());
 const focus=window.RelphiRelationshipExportFocus.matrix();
 assert.equal(focus.aspects,'None');
 assert.equal(focus.scopes,'None');
});

test('full harmonic selection reports All across all three scopes',()=>{
 const ctx=setup(empty());
 const ids=ctx.window.RelphiHarmonicAspectCatalog.aspects.map(a=>a.id);
 ctx.store.set('relphiSkyAspectMatrixV1',JSON.stringify({'A-A':ids,'B-B':ids,'A-B':ids}));
 const focus=ctx.window.RelphiRelationshipExportFocus.matrix();
 assert.equal(focus.aspects,'A↔A: All · B↔B: All · A↔B: All');
 assert.equal(focus.scopes,'A↔A · B↔B · A↔B');
});

test('semantic serializer gives an unnamed aspect a readable fractional label and nonzero small orb',()=>{
 const {window}=setup(empty());
 const row={dataset:{
   aspect:'harmonic-19-5',sourceOrb:'0.003509',
   leftPlacement:'saturn',rightPlacement:'vertex',leftSky:'A',rightSky:'A',
   leftSign:'7',rightSign:'11',leftHouse:'3',rightHouse:'6',relationshipMode:'A-A'
 },querySelector(){return null},querySelectorAll(){return []},classList:{contains(){return false}}};
 const s=window.RelphiRelationshipCopySerializer.serialize(row,{level:2});
 assert.match(s,/Harmonic 19 · 5\/19 · 0\.0035°/);
 assert.doesNotMatch(s,/harmonic-19-5|0\.00°/);
 assert.match(s,/19 division of the zodiacal circle/);
});
