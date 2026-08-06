import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const tool = path.join(root, 'tools/check-canonical-cutover-readiness.mjs');

test('current package is not ready and reports exactly the 58 external acquisitions', () => {
  const result = spawnSync(process.execPath, [tool], { cwd: root, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  const report = JSON.parse(result.stdout);
  assert.equal(report.ready, false);
  assert.equal(report.blocker_count, 58);
  assert.deepEqual(report.blocker_groups, { moon: 1, astrology_and_angles: 8, hebrew: 22, greek: 24, ruler_overlays: 3 });
  assert.equal(new Set(report.blockers.map(entry => `${entry.kind}:${entry.id}`)).size, 58);
  assert.deepEqual(report.blockers.slice(0, 9).map(entry => entry.name), ['Moon', 'Ascendant', 'Chiron', 'Descendant', 'Imum Coeli', 'Midheaven', 'North Node', 'South Node', 'Vertex']);
  assert.deepEqual(report.blockers.slice(-3).map(entry => entry.name), ['Day Ruler', 'Hour Ruler', 'Day-and-Hour Ruler']);
  assert.equal(report.blockers.filter(entry => entry.id.startsWith('hebrew-')).length, 22);
  assert.equal(report.blockers.filter(entry => entry.id.startsWith('greek-')).length, 24);
  assert.equal(Object.prototype.hasOwnProperty.call(report, 'broad_blockers'), false);
});

test('readiness checker is read-only and contains no mutation or generation path', async () => {
  const source = await readFile(tool, 'utf8');
  assert.doesNotMatch(source, /writeFile|rename|copyFile|mkdir|unlink|rm\(|commit|push|checkout|reset/i);
  assert.match(source, /git', \['apply', '--check'/);
});

