import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const node = process.execPath;

test('shadow acceptance classifies exact identity and overlay blockers without producing fallback patches', async t => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'canonical-shadow-'));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const patches = path.join(temp, 'patches');
  const output = path.join(temp, 'output');
  await mkdir(patches);
  const audit = { consumers: [
    { consumer: 'master.js', entry_point: 'page.html', classification: 'blocked', required_identities: ['moon', 'mercury'], required_states: ['plain'] },
    { consumer: 'overlay.js', entry_point: 'page.html', classification: 'blocked', required_identities: ['mercury'], required_states: ['day-ruler'] },
    { consumer: 'both.js', entry_point: 'page.html', classification: 'blocked', required_identities: ['moon'], required_states: ['hour-ruler'] },
    { consumer: 'ready.js', entry_point: 'page.html', classification: 'coordinated', required_identities: ['mercury'], required_states: ['circled'] },
    { consumer: 'old.js', entry_point: 'none', classification: 'obsolete', required_identities: [], required_states: ['plain'] }
  ] };
  const auditPath = path.join(temp, 'audit.json');
  await writeFile(auditPath, JSON.stringify(audit));
  execFileSync(node, [path.join(root, 'tools/run-canonical-shadow-acceptance.mjs'), '--audit', auditPath, '--patches', patches, '--output', output], { cwd: root });
  const report = JSON.parse(await readFile(path.join(output, 'shadow-acceptance.json'), 'utf8'));
  assert.deepEqual(report.consumers.map(row => row.classification), ['blocked-by-missing-master', 'blocked-by-missing-overlay', 'blocked-by-master-and-overlay', 'cutover-ready-now-but-coordinated-hold', 'obsolete-or-unreferenced']);
  assert.deepEqual(report.consumers[0].missing_identities, ['moon']);
  assert.deepEqual(report.consumers[1].missing_states, ['day-ruler']);
  assert.equal(report.patch_checks.length, 0);
  assert.match(await readFile(path.join(patches, 'master-js.blocked.json'), 'utf8'), /No safe all-canonical patch/);
});

test('shadow acceptance runs git apply --check for supplied independent patches', async t => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'canonical-patch-check-'));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const patches = path.join(temp, 'patches');
  const output = path.join(temp, 'output');
  await mkdir(patches);
  const auditPath = path.join(temp, 'audit.json');
  await writeFile(auditPath, JSON.stringify({ consumers: [] }));
  await writeFile(path.join(patches, 'independent.patch'), 'this is not a patch\n');
  assert.throws(() => execFileSync(node, [path.join(root, 'tools/run-canonical-shadow-acceptance.mjs'), '--audit', auditPath, '--patches', patches, '--output', output], { cwd: root, stdio: 'pipe' }));
  const report = JSON.parse(await readFile(path.join(output, 'shadow-acceptance.json'), 'utf8'));
  assert.equal(report.patch_checks[0].valid, false);
});
