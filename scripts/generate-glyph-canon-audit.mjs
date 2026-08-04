import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const APPROVED = '0d56ee7ec0ea0fc3e44debcb809afde09f3271ab';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const output = path.resolve(root, process.argv[2] || 'glyph-canon-source-audit.json');

function show(file) {
  return execFileSync('git', ['show', `${APPROVED}:${file}`], { cwd:root });
}

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes:true })) {
    if (['.git','node_modules'].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, files);
    else files.push(path.relative(root, absolute).replaceAll(path.sep, '/'));
  }
  return files;
}

const approvedRegistrySource = show('relphi-glyph-registry-v1.js').toString('utf8');
const context = { window:{}, Object, Map, String };
vm.runInNewContext(approvedRegistrySource, context, { filename:'relphi-glyph-registry-v1.js' });
const entries = Array.from(context.window.RelphiGlyphRegistry.entries, entry => ({
  id:entry.id,
  name:entry.name,
  aliases:Array.from(entry.aliases),
  asset:entry.asset ?? null,
  fallback:entry.fallback ?? null,
  scale:entry.scale,
  dx:entry.dx,
  dy:entry.dy,
  fitMode:entry.fitMode ?? null,
  fontWeight:entry.fontWeight ?? null
}));

const approvedFiles = [
  'glyphs-unified-preview.html',
  'relphi-glyph-registry-v1.js',
  'relphi-glyph-component-v1.js',
  ...new Set(entries.map(entry => entry.asset).filter(Boolean))
];

const equality = approvedFiles.map(file => {
  const approved = show(file);
  const currentPath = path.join(root, file);
  const exists = fs.existsSync(currentPath);
  const current = exists ? fs.readFileSync(currentPath) : null;
  return { file, exists, equal:exists && Buffer.compare(approved, current) === 0 };
});

const allFiles = walk(root);
const sourceFiles = allFiles.filter(file => /\.(?:js|mjs|html)$/.test(file));
const productionSourceFiles = sourceFiles.filter(file => !file.startsWith('tests/') && !file.startsWith('scripts/'));
const genericConsumers = productionSourceFiles.filter(file => {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  return /RelphiGlyphRegistry|RelphiGlyphComponent/.test(text);
});

const forbiddenFiles = [
  'relphi-glyph-canon-binding-v1.js',
  'relphi-neptune-cross-connection-v1.js',
  'relphi-glyph-atomic-loader-v1.js',
  'relphi-moon-stroke-preservation-v1.js',
  'relphi-glyph-component-e9344099.js',
  'sky-chart-angle-glyph-fit-v1.js',
  'sky-chart-canonical-glyph-correction-v1.js',
  'sky-chart-glyph-framing-v1.js',
  'sky-chart-glyph-size-guard-v1.js',
  'sky-chart-live-integrity-v1.js',
  'sky-chart-wheel-canonical-component-v1.js',
  'sky-chart-wheel-e9344099-canonical-master-v1.js',
  'sky-chart-wheel-glyph-preview-fixes-v1.js',
  'sky-chart-wheel-glyph-preview-tuning-v1.js',
  'sky-chart-wheel-glyph-preview-v1.js',
  'sky-chart-wheel-marker-interaction-v1.js',
  'sky-chart-wheel-solid-hover-v1.js',
  'sky-chart-wheel-unified-marker-renderer-v1.js',
  'sky-chart-wheel-unified-marker-renderer-v2.js',
  'sky-chart-wheel-unified-marker-renderer-v3.js',
  'sky-chart-wheel-unified-marker-renderer-v4.js',
  'sky-chart-wheel-unified-marker-renderer-v5.js',
  'sky-chart-wheel-unified-marker-renderer-v6.js',
  'sky-chart-wheel-special-points-final-v1.js',
  'sky-chart-special-point-polish-v1.js',
  'sky-chart-special-point-source-normalizer-v1.js',
  'sky-chart-special-point-static-v1.js',
  'sky-chart-special-vector-color-v1.js',
  'sky-chart-comparison-glyph-scale-v1.js',
  'sky-chart-ph-glyph-style-v1.js'
];

const forbiddenPresent = forbiddenFiles.filter(file => fs.existsSync(path.join(root, file)));
const angleAssetFiles = allFiles.filter(file => file.startsWith('assets/angle-glyphs/'));
const definitionViolations = [];
const mutationViolations = [];
const geometryViolations = [];

for (const file of productionSourceFiles) {
  if (file === 'relphi-glyph-registry-v1.js' || file === 'relphi-glyph-component-v1.js') continue;
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  const usesGlyphRuntime = /RelphiGlyphRegistry|RelphiGlyphComponent/.test(text);
  if (/window\.RelphiGlyphRegistry\s*=|Object\.defineProperty\(window\s*,\s*['"]RelphiGlyphRegistry/.test(text)) {
    definitionViolations.push({ file, global:'RelphiGlyphRegistry' });
  }
  if (/window\.RelphiGlyphComponent\s*=|Object\.defineProperty\(window\s*,\s*['"]RelphiGlyphComponent/.test(text)) {
    definitionViolations.push({ file, global:'RelphiGlyphComponent' });
  }
  if (usesGlyphRuntime && /\b(?:entry|registry\.get\([^)]*\))\.(?:asset|fallback|scale|dx|dy|fitMode|fontWeight|canonicalRotation)\s*=/.test(text)) {
    mutationViolations.push(file);
  }
  if (/\bVECTOR_GLYPHS\s*=|assets\/angle-glyphs\//.test(text) ||
      (/\bPATHS\s*=/.test(text) && /(glyph|marker|special-point)/i.test(file))) {
    geometryViolations.push(file);
  }
}

const audit = {
  generatedAt:new Date().toISOString(),
  approvedSource:{
    page:'https://oracleofrelphi.com/glyphs-unified-preview.html',
    commit:APPROVED,
    registry:'relphi-glyph-registry-v1.js',
    component:'relphi-glyph-component-v1.js'
  },
  approvedFiles:equality,
  entries:entries.map(entry => ({ ...entry, sourceCommit:APPROVED, consumers:genericConsumers })),
  competingSources:{
    forbiddenFilesPresent:forbiddenPresent,
    angleAssetFiles,
    definitionViolations,
    mutationViolations,
    geometryViolations
  }
};

fs.writeFileSync(output, JSON.stringify(audit, null, 2) + '\n');

const failures = [
  ...equality.filter(item => !item.equal).map(item => `${item.file} differs from ${APPROVED}`),
  ...forbiddenPresent.map(file => `forbidden competing file exists: ${file}`),
  ...angleAssetFiles.map(file => `forged Angle asset exists: ${file}`),
  ...definitionViolations.map(item => `${item.file} redefines ${item.global}`),
  ...mutationViolations.map(file => `${file} mutates approved registry fields`),
  ...geometryViolations.map(file => `${file} contains substitute glyph geometry`)
];

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Approved glyph audit passed: ${entries.length} identities, ${approvedFiles.length} byte-identical source files, no competing canon.`);
}
