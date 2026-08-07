import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SELF = 'tools/check-single-glyph-canon.mjs';
const failures = [];
const productionExt = /\.(?:html|js|mjs|css|json|yml|yaml)$/i;
const skipDirs = new Set(['.git', 'node_modules', 'coverage', 'tests', 'test']);

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes:true })) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (productionExt.test(entry.name)) out.push(full);
  }
  return out;
}

function text(file) {
  return fs.readFileSync(file, 'utf8');
}

function fail(message) {
  failures.push(message);
}

const files = walk(ROOT);
// Production/runtime source only. Diagnostic tooling may discuss old paths, but it cannot be loaded by the site.
const sourceFiles = files.filter(file => {
  const name = rel(file);
  return name !== SELF &&
    !name.startsWith('tools/') &&
    !name.startsWith('.github/') &&
    !name.startsWith('schemas/') &&
    !name.startsWith('assets/canonical-glyphs/v1/');
});

const forbiddenRefs = [
  'relphi-moon-stroke-preservation-v1.js',
  'relphi-neptune-cross-connection-v1.js',
  'relphi-canonical-glyph-state-v1.js',
  'RelphiCanonicalGlyphState',
  'assets/planet-glyphs/ascendant.svg',
  'assets/planet-glyphs/midheaven.svg',
  'assets/planet-glyphs/earth.svg',
  'assets/canonical-glyphs/v1/',
  'assets/angle-glyphs/',
  'https://oracleofrelphi.com/relphi-glyph-registry-v1.js',
  'https://oracleofrelphi.com/relphi-glyph-component-v1.js'
];

for (const file of sourceFiles) {
  const body = text(file);
  for (const token of forbiddenRefs) {
    if (body.includes(token)) fail(`${rel(file)} references forbidden competing glyph source: ${token}`);
  }
}

const registryDefinitions = sourceFiles.filter(file => text(file).includes('window.RelphiGlyphRegistry ='));
const componentDefinitions = sourceFiles.filter(file => text(file).includes('window.RelphiGlyphComponent ='));
if (registryDefinitions.length !== 1 || rel(registryDefinitions[0] || '') !== 'relphi-glyph-registry-v1.js') {
  fail(`Expected exactly one RelphiGlyphRegistry definition in relphi-glyph-registry-v1.js; found: ${registryDefinitions.map(rel).join(', ') || 'none'}`);
}
if (componentDefinitions.length !== 1 || rel(componentDefinitions[0] || '') !== 'relphi-glyph-component-v1.js') {
  fail(`Expected exactly one RelphiGlyphComponent definition in relphi-glyph-component-v1.js; found: ${componentDefinitions.map(rel).join(', ') || 'none'}`);
}

const forbiddenFiles = [
  'relphi-moon-stroke-preservation-v1.js',
  'relphi-neptune-cross-connection-v1.js',
  'relphi-canonical-glyph-state-v1.js',
  'relphi-glyph-canon-binding-v1.js',
  'relphi-glyph-component-e9344099.js',
  'sky-chart-angle-glyph-fit-v1.js',
  'sky-chart-canonical-glyph-correction-v1.js',
  'sky-chart-wheel-e9344099-canonical-master-v1.js',
  'sky-chart-wheel-canonical-component-v1.js',
  'assets/planet-glyphs/ascendant.svg',
  'assets/planet-glyphs/midheaven.svg',
  'assets/planet-glyphs/earth.svg',
  'assets/canonical-glyphs/v1/manifest.json',
  'canonical-glyphs-v1-preview.html',
  'glyph-canon-approved-source-manifest.json'
];
for (const name of forbiddenFiles) {
  if (fs.existsSync(path.join(ROOT, name))) fail(`Forbidden competing glyph source still exists: ${name}`);
}
if (fs.existsSync(path.join(ROOT, 'assets/angle-glyphs'))) fail('assets/angle-glyphs/ is forbidden; angles come from the Master Glyph List registry treatment.');

const registryPath = path.join(ROOT, 'relphi-glyph-registry-v1.js');
const componentPath = path.join(ROOT, 'relphi-glyph-component-v1.js');
const integrityPath = path.join(ROOT, 'relphi-glyph-source-integrity-v1.js');
const inlineConsumerPath = path.join(ROOT, 'relphi-inline-glyph-consumer-v1.js');
const foundationsConsumerPath = path.join(ROOT, 'astrology-foundations-canonical-glyphs-v1.js');
const navloaderPath = path.join(ROOT, 'navloader.js');
const marsPath = path.join(ROOT, 'assets/planet-glyphs/mars.svg');
const moonPath = path.join(ROOT, 'assets/planet-glyphs/moon.svg');
for (const [file, label] of [
  [registryPath,'relphi-glyph-registry-v1.js'],
  [componentPath,'relphi-glyph-component-v1.js'],
  [integrityPath,'relphi-glyph-source-integrity-v1.js'],
  [inlineConsumerPath,'relphi-inline-glyph-consumer-v1.js'],
  [foundationsConsumerPath,'astrology-foundations-canonical-glyphs-v1.js'],
  [navloaderPath,'navloader.js'],
  [marsPath,'approved Mars asset'],
  [moonPath,'approved Moon asset']
]) {
  if (!fs.existsSync(file)) fail(`Missing ${label}`);
}

let registry = '';
if (fs.existsSync(registryPath)) {
  registry = text(registryPath);
  const angleRules = [
    ["['asc','Ascendant',['asc','ascendant','rising','ac'],null,1,0,0,'Asc','letter','700']", 'Ascendant'],
    ["['dsc','Descendant',['dsc','descendant','dc'],null,1,0,0,'Dsc','letter','700']", 'Descendant'],
    ["['mc','Midheaven',['mc','midheaven'],null,1,0,0,'MC','letter','700']", 'Midheaven'],
    ["['ic','Imum Coeli',['ic','imum coeli','imumcoeli'],null,1,0,0,'IC','letter','700']", 'Imum Coeli']
  ];
  for (const [snippet, label] of angleRules) {
    if (!registry.includes(snippet)) fail(`${label} no longer uses the approved Master Glyph List text treatment.`);
  }
  for (const id of ['sun','moon','mercury','venus','jupiter','saturn','uranus','neptune','pluto']) {
    const pattern = new RegExp(`\\['${id}'[^\\n]+?'static-master'\\]`);
    if (!pattern.test(registry)) fail(`${id} is not pinned to the recovered static-master path.`);
  }
  if (!registry.includes("['mars','Mars',['mars','♂'],'assets/planet-glyphs/mars.svg',1,-0.95,0.9,null,'circle']")) {
    fail('Mars registry treatment changed from the explicitly approved corrected source path.');
  }
}

// Every SVG in the planet-glyph folder must be explicitly referenced by the one registry.
const planetDir = path.join(ROOT, 'assets/planet-glyphs');
if (fs.existsSync(planetDir) && registry) {
  for (const entry of fs.readdirSync(planetDir, { withFileTypes:true })) {
    if (!entry.isFile() || !entry.name.endsWith('.svg')) continue;
    const assetPath = `assets/planet-glyphs/${entry.name}`;
    if (!registry.includes(`'${assetPath}'`)) fail(`Unregistered planet-glyph SVG can masquerade as authority: ${assetPath}`);
  }
}

if (fs.existsSync(componentPath)) {
  const component = text(componentPath);
  if (!component.includes("if (entry.fitMode === 'static-master') return;")) fail('Static masters are no longer protected from runtime fitting.');
  if (!component.includes("if (entry.fitMode === 'static-master') return staticMaster")) fail('Static-master draw path is missing.');
  if (component.includes('function sun(')) fail('Procedural Sun renderer returned; Sun must come from the shared asset source.');
}

if (fs.existsSync(integrityPath)) {
  const integrity = text(integrityPath);
  if (!integrity.includes("Object.defineProperty(window, 'RelphiGlyphRegistry'")) fail('Registry global is no longer locked.');
  if (!integrity.includes("Object.defineProperty(window, 'RelphiGlyphComponent'")) fail('Component global is no longer locked.');
}

if (fs.existsSync(navloaderPath)) {
  const nav = text(navloaderPath);
  for (const snippet of [
    "appendScript('relphi-glyph-registry-v1.js?v=26'",
    "appendScript('relphi-glyph-component-v1.js?v=29'",
    "appendScript('relphi-glyph-source-integrity-v1.js?v=2'",
    "appendScript('relphi-inline-glyph-consumer-v1.js?v=2'",
    "appendScript('astrology-foundations-canonical-glyphs-v1.js?v=2'"
  ]) {
    if (!nav.includes(snippet)) fail(`navloader lost required single-canon route: ${snippet}`);
  }
}

const expectedMars = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Mars"><g fill="none" stroke="#111111" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="42" cy="60" r="25"/><path d="M60.5 41.5L84 17M69 17H84V32"/></g></svg>';
if (fs.existsSync(marsPath) && text(marsPath).trim() !== expectedMars) fail('Approved corrected Mars bytes changed.');

if (fs.existsSync(moonPath)) {
  const moon = text(moonPath);
  if (!moon.includes('M47.9220542672045 30.973850765136838')) fail('Approved thin Moon geometry changed.');
  if (!moon.includes('stroke-width="3.3114267878104444"')) fail('Approved thin Moon stroke changed.');
}

if (failures.length) {
  console.error('\nSINGLE GLYPH CANON CHECK FAILED\n');
  failures.forEach((message, index) => console.error(`${index + 1}. ${message}`));
  process.exit(1);
}

console.log('Single glyph canon check passed.');
console.log('One registry, one component, approved angle treatments, approved Mars/Moon, no unregistered planet SVGs, and no known competing production source paths.');
