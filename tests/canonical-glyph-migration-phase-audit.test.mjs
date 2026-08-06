import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const script = path.join(root, 'tests/canonical-glyph-migration-phase-audit.mjs');
const run = phase => spawnSync(process.execPath, [script, `--phase=${phase}`], { cwd: root, encoding: 'utf8' });

test('source-package phase passes while production renderers are deliberately deferred', () => {
  const result = run('source-package');
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(JSON.parse(result.stdout).valid, true);
});

test('shadow-cutover phase verifies inert loader, harness, tests, and patch safety', () => {
  const result = run('shadow-cutover');
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(JSON.parse(result.stdout).valid, true);
});

test('production-cutover phase retains and fails the lower-level final gates', () => {
  const result = run('production-cutover');
  assert.notEqual(result.status, 0);
  const report = JSON.parse(result.stdout);
  assert.equal(report.valid, false);
  assert.deepEqual(report.lower_level_final_cutover_audits, ['tests/canonical-glyph-source-audit.mjs', 'tests/canonical-glyph-consumer-audit.mjs']);
  assert.ok(report.checks.filter(check => check.name.startsWith('lower-level')).every(check => !check.valid));
});

