import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = process.cwd();
const failures = [];
const required = (name) => path.join(ROOT, name);
const read = (name) => fs.readFileSync(required(name), 'utf8');
const fail = (message) => failures.push(message);

function requireFile(name) {
  if (!fs.existsSync(required(name))) fail(`Missing required file: ${name}`);
}

const requiredFiles = [
  'relphi-glyph-registry-v1.js',
  'relphi-glyph-component-v1.js',
  'relphi-glyph-source-integrity-v1.js',
  'glyphs-unified-preview.html',
  'assets/planet-glyphs/part-of-fortune.svg',
  'sky-chart.html',
  'sky-chart-foundation-v1.js',
  'sky-chart-calculated-points-v1.js',
  'sky-chart-angle-placements-v1.js',
  'sky-chart-card-hits-v2.js',
  'sky-chart-heptagram-canonical-v1.js',
  'sky-chart-relationship-list-layout-v1.js'
];
requiredFiles.forEach(requireFile);

if (fs.existsSync(required('assets/canonical-glyphs/v1'))) {
  fail('Dormant assets/canonical-glyphs/v1 package returned; it is a forbidden competing authority reservoir.');
}

let registry;
if (fs.existsSync(required('relphi-glyph-registry-v1.js'))) {
  try {
    const context = { window:{} };
    vm.runInNewContext(read('relphi-glyph-registry-v1.js'), context, { filename:'relphi-glyph-registry-v1.js' });
    registry = context.window.RelphiGlyphRegistry;
  } catch (error) {
    fail(`Registry could not be evaluated: ${error.message}`);
  }
}

const skyIdentities = [
  'sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto',
  'chiron','north-node','south-node','lilith','part-of-fortune','vertex','asc','dsc','mc','ic'
];

if (registry) {
  for (const id of skyIdentities) {
    const entry = registry.get(id);
    if (!entry) fail(`Sky Chart identity missing from the one registry: ${id}`);
  }

  const staticMasters = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','lilith','part-of-fortune'];
  for (const id of staticMasters) {
    const entry = registry.get(id);
    if (!entry?.asset || entry.fitMode !== 'static-master' || entry.scale !== 1 || entry.dx !== 0 || entry.dy !== 0) {
      fail(`${id} must use the shared recovered static Master Glyph List treatment.`);
    }
  }

  const exactTreatments = {
    chiron: ['⚷','symbol','400'],
    'north-node': ['☊','symbol','400'],
    'south-node': ['☋','symbol','400'],
    vertex: ['Vx','letter','700'],
    asc: ['Asc','letter','700'],
    dsc: ['Dsc','letter','700'],
    mc: ['MC','letter','700'],
    ic: ['IC','letter','700']
  };
  for (const [id, [fallback, fitMode, fontWeight]] of Object.entries(exactTreatments)) {
    const entry = registry.get(id);
    if (!entry || entry.fallback !== fallback || entry.fitMode !== fitMode || (fontWeight !== undefined && entry.fontWeight !== fontWeight)) {
      fail(`${id} drifted from the Master Glyph List treatment.`);
    }
  }
}

if (fs.existsSync(required('sky-chart.html'))) {
  const html = read('sky-chart.html');
  const scripts = [
    'relphi-glyph-registry-v1.js',
    'relphi-glyph-component-v1.js',
    'relphi-glyph-source-integrity-v1.js',
    'sky-chart-foundation-v1.js'
  ];
  let previous = -1;
  for (const script of scripts) {
    const index = html.indexOf(script);
    if (index < 0) fail(`Sky Chart does not load ${script}.`);
    else if (index <= previous) fail(`Sky Chart glyph boot order is wrong at ${script}.`);
    previous = index;
  }
  for (const forbidden of [
    'relphi-moon-stroke-preservation-v1.js',
    'relphi-neptune-cross-connection-v1.js',
    'relphi-canonical-glyph-state-v1.js',
    'https://oracleofrelphi.com/relphi-glyph-registry-v1.js',
    'https://oracleofrelphi.com/relphi-glyph-component-v1.js'
  ]) {
    if (html.includes(forbidden)) fail(`Sky Chart still loads a competing glyph path: ${forbidden}`);
  }
}

if (fs.existsSync(required('glyphs-unified-preview.html'))) {
  const preview = read('glyphs-unified-preview.html');
  for (const script of ['relphi-glyph-registry-v1.js','relphi-glyph-component-v1.js','relphi-glyph-source-integrity-v1.js']) {
    if (!preview.includes(script)) fail(`Master Glyph List no longer uses local ${script}.`);
  }
  for (const forbidden of ['relphi-moon-stroke-preservation-v1.js','relphi-neptune-cross-connection-v1.js']) {
    if (preview.includes(forbidden)) fail(`Master Glyph List still depends on mutation wrapper: ${forbidden}`);
  }
}

if (fs.existsSync(required('sky-chart-foundation-v1.js'))) {
  const foundation = read('sky-chart-foundation-v1.js');
  for (const snippet of [
    'window.RelphiGlyphRegistry',
    'window.RelphiGlyphComponent',
    'component.draw',
    'component.createBubble',
    'Canonical Master Glyph List entry unavailable'
  ]) {
    if (!foundation.includes(snippet)) fail(`Sky Chart foundation lost canonical glyph contract: ${snippet}`);
  }
  if (foundation.includes('assets/planet-glyphs/ascendant.svg') || foundation.includes('assets/planet-glyphs/midheaven.svg')) {
    fail('Sky Chart foundation references invented Ascendant/Midheaven artwork.');
  }
}

if (fs.existsSync(required('sky-chart-calculated-points-v1.js'))) {
  const points = read('sky-chart-calculated-points-v1.js');
  const ids = ['north-node','south-node','lilith','asc','dsc','mc','ic','vertex','part-of-fortune'];
  for (const id of ids) {
    if (!points.includes(`glyphId:'${id}'`)) fail(`Calculated point data is not canonical-ID based for ${id}.`);
  }
  for (const visual of ["glyph:'☊'","glyph:'☋'","glyph:'⚸'","glyph:'ASC'","glyph:'DSC'","glyph:'MC'","glyph:'IC'","glyph:'Vx'","glyph:'⊗'"]) {
    if (points.includes(visual)) fail(`Calculated point data still embeds visual fallback ${visual}.`);
  }
}

if (fs.existsSync(required('sky-chart-angle-placements-v1.js'))) {
  const angles = read('sky-chart-angle-placements-v1.js');
  if (!angles.includes('function renderedAngle(row)')) fail('Angle ledger grouping no longer keys off rendered canonical identity.');
  if (!angles.includes("row.style.order = String(1001 + position)")) fail('Angle ledger grouping no longer preserves DOM identity order while visually grouping angles.');
  if (angles.includes('ledger.appendChild(match[1])')) fail('Angle ledger returned to DOM reordering that can cross-wire glyph identities.');
}

if (fs.existsSync(required('sky-chart-card-hits-v2.js'))) {
  const hits = read('sky-chart-card-hits-v2.js');
  if (!hits.includes("judgement:Object.freeze({kind:'placement',value:'pluto'")) fail('Judgement no longer isolates Pluto.');
  if (!hits.includes("kind:'sign',value:SIGNS.indexOf(sign)")) fail('Sign-attributed cards no longer isolate their zodiac sign.');
  if (!hits.includes("dispatchEvent(new MouseEvent('click'")) fail('Chart Hit cards no longer route through the same wheel isolation interaction.');
  if (hits.includes('sky-card-hit-detail')) fail('Chart Hit static detail panel returned; card clicks should isolate the chart instead.');
}

if (fs.existsSync(required('sky-chart-heptagram-canonical-v1.js'))) {
  const heptagram = read('sky-chart-heptagram-canonical-v1.js');
  if (!heptagram.includes('component.createBubble')) fail('Planetary heptagram no longer consumes the canonical circled glyph component path.');
  if (!heptagram.includes('MASTER_RADIUS = 19')) fail('Planetary heptagram no longer starts from the exact Master Glyph List radius.');
  if (!heptagram.includes('MASTER_SCALE = DISPLAY_RADIUS / MASTER_RADIUS')) fail('Planetary heptagram no longer scales the complete master as one unit.');
  if (heptagram.includes('RelphiCanonicalGlyphState')) fail('Removed alternate glyph-state renderer returned to the heptagram.');
}

if (fs.existsSync(required('sky-chart-relationship-list-layout-v1.js'))) {
  const relationships = read('sky-chart-relationship-list-layout-v1.js');
  if (!relationships.includes("MASTER_VIEWBOX = '-32 -32 64 64'")) fail('Relationship glyphs no longer preserve the exact Master Glyph List artboard.');
  if (!relationships.includes('MASTER_RADIUS = 19')) fail('Relationship glyphs no longer render at the canonical master radius before CSS scaling.');
  if (relationships.includes("viewBox', '-16 -16 32 32'") || relationships.includes('radius:13')) fail('Relationship glyphs returned to a cropped or refitted mini-artboard.');
}

if (fs.existsSync(required('relphi-glyph-source-integrity-v1.js'))) {
  const integrity = read('relphi-glyph-source-integrity-v1.js');
  for (const global of ['RelphiGlyphRegistry','RelphiGlyphComponent']) {
    if (!integrity.includes(`Object.defineProperty(window, '${global}'`)) fail(`${global} is not locked by the integrity guard.`);
  }
}

if (failures.length) {
  console.error('\nSKY CHART GLYPH READINESS FAILED\n');
  failures.forEach((failure, index) => console.error(`${index + 1}. ${failure}`));
  process.exit(1);
}

console.log('Sky Chart glyph readiness passed.');
console.log('Sky Chart is cleared for feature work with glyph rendering frozen to the single Master Glyph List authority, static Part of Fortune and Lilith masters, stable Angle ledger identities, and Chart Hit correspondence isolation.');