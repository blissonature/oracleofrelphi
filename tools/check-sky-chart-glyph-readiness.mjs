import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT=process.cwd(),failures=[];
const file=name=>path.join(ROOT,name);
const read=name=>fs.readFileSync(file(name),'utf8');
const fail=message=>failures.push(message);
const required=[
  'relphi-glyph-registry-v1.js',
  'relphi-glyph-component-v1.js',
  'relphi-glyph-source-integrity-v1.js',
  'glyphs-unified-preview.html',
  'sky-chart.html',
  'sky-chart-foundation-v2.js',
  'sky-chart-angle-placements-v1.js',
  'sky-chart-heptagram-canonical-v1.js',
  'sky-chart-relationship-list-layout-v2.js',
  'sky-chart-inline-relationship-v5.js'
];
for(const name of required)if(!fs.existsSync(file(name)))fail(`Missing required file: ${name}`);
if(fs.existsSync(file('assets/canonical-glyphs/v1')))fail('Dormant canonical-glyph package returned as a competing authority.');

let registry;
try{
  const context={window:{}};
  vm.runInNewContext(read('relphi-glyph-registry-v1.js'),context,{filename:'relphi-glyph-registry-v1.js'});
  registry=context.window.RelphiGlyphRegistry;
}catch(error){fail(`Registry could not be evaluated: ${error.message}`)}

const identities=['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','chiron','north-node','south-node','lilith','part-of-fortune','vertex','asc','dsc','mc','ic'];
if(registry){
  for(const id of identities)if(!registry.get(id))fail(`Sky Chart identity missing from the registry: ${id}`);
  for(const id of ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','lilith','part-of-fortune']){
    const entry=registry.get(id);
    if(!entry?.asset||entry.fitMode!=='static-master'||entry.scale!==1||entry.dx!==0||entry.dy!==0)fail(`${id} drifted from static-master treatment.`);
  }
  const exact={
    chiron:['⚷','symbol','400'],
    'north-node':['☊','symbol','400'],
    'south-node':['☋','symbol','400'],
    vertex:['Vx','letter','700'],asc:['Asc','letter','700'],dsc:['Dsc','letter','700'],mc:['MC','letter','700'],ic:['IC','letter','700']
  };
  for(const [id,[fallback,fitMode,fontWeight]] of Object.entries(exact)){
    const entry=registry.get(id);
    if(!entry||entry.fallback!==fallback||entry.fitMode!==fitMode||entry.fontWeight!==fontWeight)fail(`${id} drifted from the canonical registry treatment.`);
  }
}

if(fs.existsSync(file('sky-chart.html'))){
  const html=read('sky-chart.html');
  const scripts=['relphi-glyph-registry-v1.js','relphi-glyph-component-v1.js','relphi-glyph-source-integrity-v1.js','sky-chart-foundation-v2.js'];
  let previous=-1;
  for(const script of scripts){const index=html.indexOf(script);if(index<0)fail(`Sky Chart does not load ${script}.`);else if(index<=previous)fail(`Sky Chart glyph boot order is wrong at ${script}.`);previous=index}
  for(const requiredScript of ['sky-chart-relationship-list-layout-v2.js','sky-chart-inline-relationship-v5.js','sky-chart-heptagram-canonical-v1.js'])if(!html.includes(requiredScript))fail(`Sky Chart does not load current glyph consumer ${requiredScript}.`);
  for(const retired of ['relphi-moon-stroke-preservation-v1.js','relphi-neptune-cross-connection-v1.js','relphi-canonical-glyph-state-v1.js','sky-chart-selected-relationship-v4.js','sky-chart-progressive-comparison-v1.js'])if(html.includes(retired))fail(`Sky Chart still loads retired owner ${retired}.`);
}

if(fs.existsSync(file('sky-chart-foundation-v2.js'))){
  const source=read('sky-chart-foundation-v2.js');
  for(const token of ['window.RelphiGlyphRegistry','window.RelphiGlyphComponent','component.draw(','component.createBubble('])if(!source.includes(token))fail(`Foundation v2 lost canonical glyph contract: ${token}`);
}

if(fs.existsSync(file('sky-chart-angle-placements-v1.js'))){
  const source=read('sky-chart-angle-placements-v1.js');
  if(!source.includes('function renderedAngle(row)'))fail('Angle ledger grouping no longer keys off rendered canonical identity.');
  if(source.includes('assets/planet-glyphs/ascendant.svg')||source.includes('assets/planet-glyphs/midheaven.svg'))fail('Angle placement owner references invented angle artwork.');
}

if(fs.existsSync(file('sky-chart-heptagram-canonical-v1.js'))){
  const source=read('sky-chart-heptagram-canonical-v1.js');
  for(const token of ['component.createBubble','MASTER_RADIUS = 19','MASTER_SCALE = DISPLAY_RADIUS / MASTER_RADIUS'])if(!source.includes(token))fail(`Heptagram lost canonical contract: ${token}`);
  if(source.includes('RelphiCanonicalGlyphState'))fail('Alternate glyph-state renderer returned to heptagram.');
}

if(fs.existsSync(file('sky-chart-relationship-list-layout-v2.js'))){
  const source=read('sky-chart-relationship-list-layout-v2.js');
  for(const token of ["VIEWBOX='-32 -32 64 64'","RADIUS=19",'component.createBubble(','data-relationship-canonical-host','slot.replaceChildren(clone)'])if(!source.includes(token))fail(`Relationship layout v2 lost canonical contract: ${token}`);
}

if(fs.existsSync(file('sky-chart-inline-relationship-v5.js'))){
  const source=read('sky-chart-inline-relationship-v5.js');
  if(source.includes('createBubble(')||source.includes('RelphiCanonicalGlyphState'))fail('Inline relationship controller became a second glyph painter.');
}

if(fs.existsSync(file('relphi-glyph-source-integrity-v1.js'))){
  const source=read('relphi-glyph-source-integrity-v1.js');
  for(const global of ['RelphiGlyphRegistry','RelphiGlyphComponent'])if(!source.includes(`Object.defineProperty(window, '${global}'`))fail(`${global} is not locked by source integrity.`);
}

if(failures.length){
  console.error('\nSKY CHART GLYPH READINESS FAILED\n');
  failures.forEach((message,index)=>console.error(`${index+1}. ${message}`));
  process.exit(1);
}
console.log('Sky Chart glyph readiness passed.');
console.log('Current registry/component ownership, canonical angle treatments, foundation v2, relationship layout v2, inline relationship v5, and heptagram consumer are coherent.');
