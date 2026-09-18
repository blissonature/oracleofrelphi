import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = process.cwd();
const failures = [];
const rel = file => path.relative(ROOT, file).split(path.sep).join('/');
const read = file => fs.readFileSync(file, 'utf8');
const fail = message => failures.push(message);

const skippedDirs = new Set([
  '.git','node_modules','coverage','tests','test','tools','review','scripts','vendor','.github','assets'
]);
const dormantRootFiles = new Set([
  'relphi-canonical-glyph-loader-v1.js',
  'relphi-canonical-glyph-element-v1.js'
]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes:true })) {
    if (entry.isDirectory() && skippedDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(?:html|js|mjs|css)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

const productionFiles = walk(ROOT).filter(file => !dormantRootFiles.has(rel(file)));

const forbiddenActiveReferences = [
  'relphi-moon-stroke-preservation-v1.js',
  'relphi-neptune-cross-connection-v1.js',
  'relphi-canonical-glyph-state-v1.js',
  'RelphiCanonicalGlyphState',
  'assets/canonical-glyphs/v1/',
  'canonical-glyphs-v1-preview.html',
  'https://oracleofrelphi.com/relphi-glyph-registry-v1.js',
  'https://oracleofrelphi.com/relphi-glyph-component-v1.js'
];

for (const file of productionFiles) {
  const source = read(file);
  for (const token of forbiddenActiveReferences) {
    if (source.includes(token)) fail(`${rel(file)} references retired glyph runtime token: ${token}`);
  }
}

const registryPath = path.join(ROOT, 'relphi-glyph-registry-v1.js');
const componentPath = path.join(ROOT, 'relphi-glyph-component-v1.js');
const integrityPath = path.join(ROOT, 'relphi-glyph-source-integrity-v1.js');
const relationshipPath = path.join(ROOT, 'sky-chart-relationship-list-layout-v2.js');
const selectedPath = path.join(ROOT, 'sky-chart-selected-relationship-v4.js');
const navPath = path.join(ROOT, 'navloader.js');
const menuPath = path.join(ROOT, 'menu.js');

for (const [file,label] of [
  [registryPath,'glyph registry'],
  [componentPath,'glyph component'],
  [integrityPath,'glyph source-integrity guard'],
  [relationshipPath,'relationship glyph renderer'],
  [selectedPath,'selected relationship glyph consumer'],
  [navPath,'navigation loader'],
  [menuPath,'menu loader']
]) if (!fs.existsSync(file)) fail(`Missing ${label}: ${rel(file)}`);

const registryDefinitions = productionFiles.filter(file => read(file).includes('window.RelphiGlyphRegistry ='));
const componentDefinitions = productionFiles.filter(file => read(file).includes('window.RelphiGlyphComponent ='));
if (registryDefinitions.length !== 1 || rel(registryDefinitions[0] || '') !== 'relphi-glyph-registry-v1.js') {
  fail(`Expected one RelphiGlyphRegistry definition in relphi-glyph-registry-v1.js; found ${registryDefinitions.map(rel).join(', ') || 'none'}`);
}
if (componentDefinitions.length !== 1 || rel(componentDefinitions[0] || '') !== 'relphi-glyph-component-v1.js') {
  fail(`Expected one RelphiGlyphComponent definition in relphi-glyph-component-v1.js; found ${componentDefinitions.map(rel).join(', ') || 'none'}`);
}

let registry = null;
if (fs.existsSync(registryPath)) {
  try {
    const context = { window:{} };
    vm.runInNewContext(read(registryPath), context, { filename:'relphi-glyph-registry-v1.js' });
    registry = context.window.RelphiGlyphRegistry;
  } catch (error) {
    fail(`Registry cannot be evaluated: ${error.message}`);
  }
}
if (registry) {
  if (registry.entries.length !== 93) fail(`Expected 93 Master Glyph List entries; found ${registry.entries.length}`);
  const ids = registry.entries.map(entry => entry.id);
  if (new Set(ids).size !== ids.length) fail('Registry contains duplicate canonical glyph ids.');

  const staticMasters = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','lilith','part-of-fortune'];
  for (const id of staticMasters) {
    const entry = registry.get(id);
    if (!entry?.asset || entry.fitMode !== 'static-master' || entry.scale !== 1 || entry.dx !== 0 || entry.dy !== 0) {
      fail(`${id} is not using the shared static-master treatment.`);
      continue;
    }
    if (!fs.existsSync(path.join(ROOT, entry.asset))) fail(`${id} canonical asset is missing: ${entry.asset}`);
  }

  const textTreatments = {
    asc:['Asc','letter','700'],
    dsc:['Dsc','letter','700'],
    mc:['MC','letter','700'],
    ic:['IC','letter','700'],
    vertex:['Vx','letter','700']
  };
  for (const [id,[fallback,fitMode,fontWeight]] of Object.entries(textTreatments)) {
    const entry = registry.get(id);
    if (!entry || entry.asset || entry.fallback !== fallback || entry.fitMode !== fitMode || entry.fontWeight !== fontWeight) {
      fail(`${id} drifted from its Master Glyph List text treatment.`);
    }
  }
}

if (fs.existsSync(componentPath)) {
  const component = read(componentPath);
  if (!/function\s+createBubble\s*\(/.test(component)) fail('Shared component lost createBubble().');
  if (!/function\s+staticMaster\s*\(/.test(component)) fail('Shared component lost staticMaster().');
  if (!/entry\.fitMode\s*===\s*['"]static-master['"]\)\s*return\s+staticMaster/.test(component)) {
    fail('Static-master entries no longer route directly through staticMaster().');
  }
  if (/entry\.id\s*===\s*['"](?:lilith|part-of-fortune)['"]/.test(component)) {
    fail('Shared component contains identity-specific Lilith or Part of Fortune rendering.');
  }
}

if (fs.existsSync(relationshipPath)) {
  const source = read(relationshipPath);
  if (!/RelphiGlyphComponent/.test(source) || !/\.createBubble\s*\(/.test(source)) {
    fail('Relationship list is not rendering through the shared glyph component.');
  }
  if (!/(?:MASTER_)?VIEWBOX\s*=\s*['"]-32 -32 64 64['"]/.test(source)) {
    fail('Relationship list no longer preserves the 64×64 Master Glyph List artboard.');
  }
  if (!/(?:MASTER_)?RADIUS\s*=\s*19\b/.test(source)) {
    fail('Relationship list no longer uses the canonical radius 19.');
  }
  if (!/data-relationship-canonical-host/.test(source)) {
    fail('Relationship list no longer marks canonical glyph host ownership.');
  }
  if (/viewBox['"]?\s*,\s*['"]-16 -16 32 32['"]/.test(source) || /radius\s*:\s*13\b/.test(source)) {
    fail('Relationship list restored a cropped or refitted mini-artboard.');
  }
}

if (fs.existsSync(selectedPath)) {
  const source = read(selectedPath);
  if (!/RelphiGlyphComponent/.test(source) || !/\.createBubble\s*\(/.test(source)) {
    fail('Selected relationship view is not rendering through the shared glyph component.');
  }
  if (/RelphiCanonicalGlyphState/.test(source)) fail('Selected relationship restored the retired alternate glyph-state API.');
}

if (fs.existsSync(integrityPath)) {
  const source = read(integrityPath);
  for (const global of ['RelphiGlyphRegistry','RelphiGlyphComponent']) {
    if (!source.includes(`Object.defineProperty(window, '${global}'`)) fail(`${global} is not locked by the source-integrity guard.`);
  }
}

const requiredLoaderSnippets = [
  "relphi-glyph-registry-v1.js?v=28",
  "relphi-glyph-component-v1.js?v=32",
  "relphi-glyph-source-integrity-v1.js?v=2"
];
for (const [file,label] of [[navPath,'navloader'],[menuPath,'menu loader']]) {
  if (!fs.existsSync(file)) continue;
  const source = read(file);
  for (const snippet of requiredLoaderSnippets) {
    if (!source.includes(snippet)) fail(`${label} does not use the current local glyph runtime: ${snippet}`);
  }
  if (/https:\/\/oracleofrelphi\.com\/relphi-glyph-(?:registry|component)-v1\.js/.test(source)) {
    fail(`${label} still loads a remote duplicate of the canonical glyph runtime.`);
  }
}

const planetDir = path.join(ROOT, 'assets/planet-glyphs');
if (registry && fs.existsSync(planetDir)) {
  for (const entry of fs.readdirSync(planetDir, { withFileTypes:true })) {
    if (!entry.isFile() || !entry.name.endsWith('.svg')) continue;
    const asset = `assets/planet-glyphs/${entry.name}`;
    if (!registry.entries.some(item => item.asset === asset)) {
      fail(`Planet glyph asset is not registered in the Master Glyph List: ${asset}`);
    }
  }
}

if (failures.length) {
  console.error('\nSINGLE GLYPH CANON CHECK FAILED\n');
  failures.forEach((message,index) => console.error(`${index + 1}. ${message}`));
  process.exit(1);
}

console.log('Single glyph canon check passed.');
console.log('One local registry/component runtime, one relationship renderer, preserved Master Glyph List artboards, pinned static masters, and no active retired glyph runtime paths.');
