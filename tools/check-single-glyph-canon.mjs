import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const failures=[];
const productionExt=/\.(?:html|js|mjs|css|json)$/i;
const skipDirs=new Set(['.git','node_modules','coverage','tests','test','review','tools','scripts','.github','schemas']);
const rel=file=>path.relative(ROOT,file).split(path.sep).join('/');
const read=file=>fs.readFileSync(file,'utf8');
const fail=message=>failures.push(message);

function walk(dir,out=[]){
  if(!fs.existsSync(dir))return out;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(entry.isDirectory()&&skipDirs.has(entry.name))continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())walk(full,out);
    else if(productionExt.test(entry.name))out.push(full);
  }
  return out;
}

const files=walk(ROOT);
const forbiddenRefs=[
  'relphi-moon-stroke-preservation-v1.js',
  'relphi-neptune-cross-connection-v1.js',
  'relphi-canonical-glyph-state-v1.js',
  'RelphiCanonicalGlyphState',
  'assets/canonical-glyphs/v1/',
  'assets/angle-glyphs/',
  'assets/planet-glyphs/ascendant.svg',
  'assets/planet-glyphs/midheaven.svg',
  'assets/planet-glyphs/earth.svg',
  'https://oracleofrelphi.com/relphi-glyph-registry-v1.js',
  'https://oracleofrelphi.com/relphi-glyph-component-v1.js'
];
for(const file of files){
  const body=read(file);
  for(const token of forbiddenRefs)if(body.includes(token))fail(`${rel(file)} references retired competing glyph source: ${token}`);
}

const registryDefinitions=files.filter(file=>read(file).includes('window.RelphiGlyphRegistry ='));
const componentDefinitions=files.filter(file=>read(file).includes('window.RelphiGlyphComponent ='));
if(registryDefinitions.length!==1||rel(registryDefinitions[0]||'')!=='relphi-glyph-registry-v1.js')fail(`Expected one RelphiGlyphRegistry definition; found ${registryDefinitions.map(rel).join(', ')||'none'}`);
if(componentDefinitions.length!==1||rel(componentDefinitions[0]||'')!=='relphi-glyph-component-v1.js')fail(`Expected one RelphiGlyphComponent definition; found ${componentDefinitions.map(rel).join(', ')||'none'}`);

const directAsset=/assets\/(?:planet|zodiac|aspect|element)-glyphs\/[a-z0-9._/-]+\.svg/gi;
for(const file of files){
  const name=rel(file);
  if(name==='relphi-glyph-registry-v1.js'||name==='sky-chart-glyph-audit-v1.js')continue;
  const matches=[...new Set(read(file).match(directAsset)||[])];
  if(matches.length)fail(`${name} bypasses the registry with direct glyph asset reference(s): ${matches.join(', ')}`);
}

const required=[
  'relphi-glyph-registry-v1.js',
  'relphi-glyph-component-v1.js',
  'relphi-glyph-source-integrity-v1.js',
  'sky-chart-foundation-v2.js',
  'sky-chart-relationship-list-layout-v2.js',
  'sky-chart-inline-relationship-v5.js',
  'sky-chart-heptagram-canonical-v1.js',
  'sky-chart.html',
  'navloader.js',
  'menu.js'
];
for(const file of required)if(!fs.existsSync(path.join(ROOT,file)))fail(`Missing current canonical glyph owner/consumer: ${file}`);

const registryPath=path.join(ROOT,'relphi-glyph-registry-v1.js');
const componentPath=path.join(ROOT,'relphi-glyph-component-v1.js');
const integrityPath=path.join(ROOT,'relphi-glyph-source-integrity-v1.js');
const foundationPath=path.join(ROOT,'sky-chart-foundation-v2.js');
const relationshipPath=path.join(ROOT,'sky-chart-relationship-list-layout-v2.js');
const inlinePath=path.join(ROOT,'sky-chart-inline-relationship-v5.js');
const heptagramPath=path.join(ROOT,'sky-chart-heptagram-canonical-v1.js');
const htmlPath=path.join(ROOT,'sky-chart.html');

if(fs.existsSync(registryPath)){
  const registry=read(registryPath);
  for(const snippet of [
    "['asc','Ascendant',['asc','ascendant','rising','ac'],null,1,0,0,'Asc','letter','700']",
    "['dsc','Descendant',['dsc','descendant','dc'],null,1,0,0,'Dsc','letter','700']",
    "['mc','Midheaven',['mc','midheaven'],null,1,0,0,'MC','letter','700']",
    "['ic','Imum Coeli',['ic','imum coeli','imumcoeli'],null,1,0,0,'IC','letter','700']"
  ])if(!registry.includes(snippet))fail(`Registry drifted from approved angle treatment: ${snippet.slice(0,18)}…`);
  for(const id of ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','lilith','part-of-fortune']){
    const pattern=new RegExp(`\\['${id}'[^\\n]+?,1,0,0,null,'static-master'\\]`);
    if(!pattern.test(registry))fail(`${id} is not pinned to static-master treatment.`);
  }
  const planetDir=path.join(ROOT,'assets/planet-glyphs');
  if(fs.existsSync(planetDir))for(const entry of fs.readdirSync(planetDir,{withFileTypes:true})){
    if(!entry.isFile()||!entry.name.endsWith('.svg'))continue;
    const asset=`assets/planet-glyphs/${entry.name}`;
    if(!registry.includes(`'${asset}'`))fail(`Unregistered planet glyph asset: ${asset}`);
  }
}

if(fs.existsSync(componentPath)){
  const component=read(componentPath);
  if(!/if \(entry\.fitMode === 'static-master'\) return true;/.test(component))fail('Static masters are no longer excluded from runtime fitting.');
  if(!component.includes("if (entry.fitMode === 'static-master') return staticMaster"))fail('Static-master draw path is missing.');
  if(!component.includes("window.RelphiGlyphComponent = Object.freeze({ draw, createBubble, fit, recolor })"))fail('Canonical component public API drifted.');
}

if(fs.existsSync(integrityPath)){
  const integrity=read(integrityPath);
  for(const global of ['RelphiGlyphRegistry','RelphiGlyphComponent'])if(!integrity.includes(`Object.defineProperty(window, '${global}'`))fail(`${global} is not locked by source integrity.`);
}

if(fs.existsSync(foundationPath)){
  const foundation=read(foundationPath);
  for(const token of ['window.RelphiGlyphRegistry','window.RelphiGlyphComponent','component.draw(','component.createBubble('])if(!foundation.includes(token))fail(`Foundation v2 lost canonical component contract: ${token}`);
}

if(fs.existsSync(relationshipPath)){
  const relationship=read(relationshipPath);
  for(const token of ['window.RelphiGlyphComponent','component.createBubble(','data-relationship-canonical-host','slot.replaceChildren(clone)'])if(!relationship.includes(token))fail(`Relationship layout v2 lost canonical ownership contract: ${token}`);
  if(!relationship.includes("if(svg.querySelector('[data-fit-state=\"unresolved\"]'))"))fail('Relationship template owner no longer rejects unresolved canonical art.');
}

if(fs.existsSync(inlinePath)){
  const inline=read(inlinePath);
  if(inline.includes('createBubble(')||inline.includes('RelphiCanonicalGlyphState'))fail('Inline relationship controller must not become a second relationship glyph painter.');
}

if(fs.existsSync(heptagramPath)){
  const heptagram=read(heptagramPath);
  for(const token of ['component.createBubble','MASTER_RADIUS = 19','MASTER_SCALE = DISPLAY_RADIUS / MASTER_RADIUS'])if(!heptagram.includes(token))fail(`Heptagram lost canonical component contract: ${token}`);
}

if(fs.existsSync(htmlPath)){
  const html=read(htmlPath);
  const order=['relphi-glyph-registry-v1.js','relphi-glyph-component-v1.js','relphi-glyph-source-integrity-v1.js','sky-chart-foundation-v2.js'];
  let previous=-1;
  for(const script of order){const index=html.indexOf(script);if(index<0)fail(`Sky Chart does not load ${script}`);else if(index<=previous)fail(`Sky Chart glyph boot order is wrong at ${script}`);previous=index}
  if(!html.includes('sky-chart-relationship-list-layout-v2.js'))fail('Sky Chart does not load relationship layout v2.');
  if(!html.includes('sky-chart-inline-relationship-v5.js'))fail('Sky Chart does not load inline relationship v5.');
  for(const retired of ['sky-chart-selected-relationship-v4.js','sky-chart-progressive-comparison-v1.js','relphi-canonical-glyph-state-v1.js'])if(html.includes(retired))fail(`Sky Chart still loads retired glyph/relationship owner: ${retired}`);
}

for(const entryFile of ['navloader.js','menu.js']){
  const file=path.join(ROOT,entryFile);if(!fs.existsSync(file))continue;const body=read(file);
  for(const token of ['relphi-glyph-registry-v1.js','relphi-glyph-component-v1.js','relphi-glyph-source-integrity-v1.js'])if(!body.includes(token))fail(`${entryFile} lost canonical runtime route: ${token}`);
  for(const retired of ['relphi-moon-stroke-preservation-v1.js','relphi-neptune-cross-connection-v1.js'])if(body.includes(retired))fail(`${entryFile} still loads retired glyph mutation wrapper: ${retired}`);
}

if(fs.existsSync(path.join(ROOT,'assets/canonical-glyphs/v1')))fail('Dormant assets/canonical-glyphs/v1 package returned as a competing authority.');
if(fs.existsSync(path.join(ROOT,'assets/angle-glyphs')))fail('assets/angle-glyphs returned; angles belong to the registry treatment.');

if(failures.length){
  console.error('\nSINGLE GLYPH CANON CHECK FAILED\n');
  failures.forEach((message,index)=>console.error(`${index+1}. ${message}`));
  process.exit(1);
}
console.log('Single glyph canon check passed.');
console.log('One registry, one component, locked globals, registry-only production asset addressing, current foundation/relationship/heptagram consumers, and no retired runtime owners.');
