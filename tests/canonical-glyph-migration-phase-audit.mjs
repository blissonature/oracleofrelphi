#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const phaseArg = process.argv.find(value => value.startsWith('--phase='));
const phase = phaseArg?.slice('--phase='.length);
const phases = new Set(['source-package', 'shadow-cutover', 'production-cutover']);
if (!phases.has(phase)) throw new Error('Use --phase=source-package, --phase=shadow-cutover, or --phase=production-cutover.');

const result = { phase, valid: true, checks: [], lower_level_final_cutover_audits: ['tests/canonical-glyph-source-audit.mjs', 'tests/canonical-glyph-consumer-audit.mjs'] };
function check(name, callback) {
  try { callback(); result.checks.push({ name, valid: true }); }
  catch (error) { result.valid = false; result.checks.push({ name, valid: false, error: error.stderr?.toString() || error.stdout?.toString() || error.message }); }
}
function run(script, args = []) {
  execFileSync(process.execPath, [path.join(root, script), ...args], { cwd: root, stdio: 'pipe' });
}
function source(packageFile) { return readFileSync(path.join(root, packageFile), 'utf8'); }

check('installed source package', () => run('tools/verify-canonical-source-package.mjs', ['assets/canonical-glyphs/v1']));
check('immutable approval records', () => run('tools/verify-canonical-glyph-approvals.mjs', ['--package', 'assets/canonical-glyphs/v1', '--records', 'assets/canonical-glyphs/v1/approvals']));
check('no fallback in production loader', () => {
  const loader = source('relphi-canonical-glyph-loader-v1.js');
  if (/getBBox|createElementNS|createBubble|Unicode|font fallback|textGlyph|setAttribute\(['"]transform|\bradius\b|\bpadding\b/i.test(loader)) throw new Error('Production loader contains a prohibited rendering path.');
});
check('loader and element remain unreferenced by active entry points', () => {
  const allowed = new Set(['relphi-canonical-glyph-element-v1.js', 'relphi-canonical-glyph-loader-v1.js', 'canonical-glyphs-v1-preview.html']);
  const tracked = execFileSync('git', ['ls-files', '*.html', '*.js', '*.mjs'], { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
  const offenders = tracked.filter(file => !allowed.has(file) && !file.startsWith('review/') && !file.startsWith('tests/') && !file.startsWith('tools/') && /relphi-canonical-glyph-(?:loader|element)-v1\.js/.test(source(file)));
  if (offenders.length) throw new Error(`Active production imports found: ${offenders.join(', ')}`);
});

if (phase === 'shadow-cutover' || phase === 'production-cutover') {
  check('shadow loader contract tests exist', () => {
    for (const file of ['tests/canonical-glyph-loader-v1.test.mjs', 'tests/canonical-glyph-element-v1.test.mjs', 'tests/canonical-shadow-tooling.test.mjs']) if (!source(file).includes("test('")) throw new Error(`Missing shadow test coverage: ${file}`);
  });
  check('production contract harness covers 93 by five', () => {
    const harness = source('review/canonical-glyph-production-contract/harness.mjs');
    if (!harness.includes("['plain', 'circled', 'day-ruler', 'hour-ruler', 'day-and-hour-ruler']") || !harness.includes('manifest.identities')) throw new Error('Review harness does not enumerate every identity and legal state.');
  });
  check('shadow acceptance never authorizes mixed rendering', () => {
    const tooling = source('tools/run-canonical-shadow-acceptance.mjs');
    if (!tooling.includes('No safe all-canonical patch') || !tooling.includes("git', ['apply', '--check'")) throw new Error('Shadow tooling does not enforce patch safety.');
  });
}

if (phase === 'production-cutover') {
  check('lower-level canonical source final-cutover audit', () => run('tests/canonical-glyph-source-audit.mjs'));
  check('lower-level canonical consumer final-cutover audit', () => run('tests/canonical-glyph-consumer-audit.mjs'));
}

console.log(JSON.stringify(result, null, 2));
if (!result.valid) process.exitCode = 1;

