import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const AUTHORIZED_COMMIT = '0d56ee7ec0ea0fc3e44debcb809afde09f3271ab';
const failures = [];

const gitShow = file => execFileSync('git',['show',`${AUTHORIZED_COMMIT}:${file}`],{cwd:ROOT});
const current = file => fs.readFileSync(path.join(ROOT,file));
const exists = file => fs.existsSync(path.join(ROOT,file));

const authorityFiles = [
  'glyphs-unified-preview.html',
  'relphi-glyph-registry-v1.js',
  'relphi-glyph-component-v1.js'
];

let approvedRegistry = '';
try { approvedRegistry = gitShow('relphi-glyph-registry-v1.js').toString('utf8'); }
catch (error) { failures.push(`Cannot read authorized registry from ${AUTHORIZED_COMMIT}: ${error.message}`); }

const approvedAssets = approvedRegistry
  ? [...new Set([...approvedRegistry.matchAll(/'(assets\/[^']+\.svg)'/g)].map(match => match[1]))]
  : [];

for (const file of [...authorityFiles,...approvedAssets]) {
  if (!exists(file)) {
    failures.push(`Authorized source is missing: ${file}`);
    continue;
  }
  try {
    const approved = gitShow(file);
    const actual = current(file);
    if (!approved.equals(actual)) failures.push(`${file} differs from the explicitly authorized source at ${AUTHORIZED_COMMIT}`);
  } catch (error) {
    failures.push(`Could not verify ${file}: ${error.message}`);
  }
}

const forbiddenPaths = [
  'relphi-glyph-source-integrity-v1.js',
  'relphi-canonical-glyph-loader-v1.js',
  'relphi-canonical-glyph-element-v1.js',
  'canonical-glyph-contract-v1.json',
  'docs/sky-chart-canonical-glyph-contract.md',
  'assets/canonical-glyphs/v1',
  'assets/planet-glyphs/part-of-fortune.svg',
  'relphi-glyph-canonical-frame-contract-v1.js',
  'sky-chart-glyph-audit-v1.js',
  'review/canonical-glyph-loader-prototype.html',
  'review/canonical-glyph-loader-prototype.mjs',
  'review/canonical-glyph-production-contract',
  'schemas/canonical-glyph-approval',
  'scripts/generate-glyph-canon-audit.mjs',
  'tools/bake-rendered-canonical-vectors.mjs',
  'tools/check-canonical-cutover-readiness.mjs',
  'tools/export-canonical-glyph-state-manifest.mjs',
  'tools/intake-canonical-glyph-source.mjs',
  'tools/run-canonical-shadow-acceptance.mjs',
  'tools/trace-canonical-glyph-runtime.mjs',
  'tools/verify-canonical-glyph-approvals.mjs',
  'tools/verify-canonical-source-package.mjs'
];
for (const file of forbiddenPaths) {
  if (exists(file)) failures.push(`Unauthorized competing glyph layer still exists: ${file}`);
}

const activeEntryPoints = [
  'glyphs-unified-preview.html',
  'glyphs.html',
  'sky-chart.html',
  'part1/sky-chart.html',
  'part2/sky-chart.html',
  'navloader.js'
];
const forbiddenTokens = [
  'relphi-glyph-source-integrity-v1.js',
  'relphi-canonical-glyph-loader-v1.js',
  'relphi-canonical-glyph-element-v1.js',
  'assets/canonical-glyphs/v1/'
];
for (const file of activeEntryPoints) {
  if (!exists(file)) continue;
  const source = current(file).toString('utf8');
  for (const token of forbiddenTokens) {
    if (source.includes(token)) failures.push(`${file} references unauthorized glyph layer: ${token}`);
  }
}

if (exists('relphi-glyph-registry-v1.js')) {
  const source=current('relphi-glyph-registry-v1.js').toString('utf8');
  if ((source.match(/window\.RelphiGlyphRegistry\s*=/g)||[]).length!==1) failures.push('Authorized registry definition is missing or duplicated.');
}
if (exists('relphi-glyph-component-v1.js')) {
  const source=current('relphi-glyph-component-v1.js').toString('utf8');
  if ((source.match(/window\.RelphiGlyphComponent\s*=/g)||[]).length!==1) failures.push('Authorized component definition is missing or duplicated.');
}

if (failures.length) {
  console.error('\nAUTHORIZED GLYPH SOURCE CHECK FAILED\n');
  failures.forEach((message,index)=>console.error(`${index+1}. ${message}`));
  process.exit(1);
}

console.log(`Authorized glyph source verified at ${AUTHORIZED_COMMIT}.`);
console.log(`${authorityFiles.length} authority files and ${approvedAssets.length} registry-referenced assets match exactly; no competing active glyph layer is present.`);
