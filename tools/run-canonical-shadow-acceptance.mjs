#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const argv = process.argv.slice(2);
const option = (name, fallback = null) => { const index = argv.indexOf(name); return index < 0 ? fallback : argv[index + 1]; };
const auditPath = option('--audit');
const patchDirectory = option('--patches');
const outputDirectory = option('--output');
if (!auditPath || !patchDirectory || !outputDirectory) throw new Error('Usage: run-canonical-shadow-acceptance.mjs --audit <execution-plan.json> --patches <directory> --output <directory>');

const audit = JSON.parse(await readFile(auditPath, 'utf8'));
const manifest = JSON.parse(await readFile('assets/canonical-glyphs/v1/manifest.json', 'utf8'));
const identities = new Map(manifest.identities.map(entry => [entry.canonical_identity, entry]));
const states = new Map(manifest.states.map(entry => [entry.state, entry]));
await mkdir(patchDirectory, { recursive: true });
await mkdir(outputDirectory, { recursive: true });

function slug(value) { return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function classify(consumer, missingIdentities, missingStates) {
  if (consumer.classification === 'obsolete') return 'obsolete-or-unreferenced';
  if (consumer.classification === 'review') return 'review-only';
  if (['standardize-zodiac-wheels.js', 'light-tone-zodiac.html', 'forsacreduseonly.html'].includes(consumer.consumer)) return 'requires-loader-contract-adjustment';
  if (missingIdentities.length && missingStates.length) return 'blocked-by-master-and-overlay';
  if (missingIdentities.length) return 'blocked-by-missing-master';
  if (missingStates.length) return 'blocked-by-missing-overlay';
  if (!(consumer.required_identities ?? []).length) return 'requires-loader-contract-adjustment';
  return 'cutover-ready-now-but-coordinated-hold';
}

const patchFiles = (await readdir(patchDirectory)).filter(file => file.endsWith('.patch')).sort();
const patchChecks = [];
for (const file of patchFiles) {
  try {
    execFileSync('git', ['apply', '--check', path.resolve(patchDirectory, file)], { stdio: 'pipe' });
    patchChecks.push({ file, valid: true, error: null });
  } catch (error) {
    patchChecks.push({ file, valid: false, error: error.stderr?.toString() || error.message });
  }
}

const consumers = [];
for (const consumer of audit.consumers ?? []) {
  const requiredIdentities = consumer.required_identities ?? [];
  const requiredStates = consumer.required_states ?? consumer.legal_states_needed ?? [];
  const missingIdentities = requiredIdentities.filter(identity => !identities.get(identity)?.candidate_path);
  const missingStates = requiredStates.filter(state => state !== 'plain' && !states.get(state)?.overlay_path);
  const classification = classify(consumer, missingIdentities, missingStates);
  const patch = patchFiles.find(file => file.startsWith(`${slug(consumer.consumer)}.`)) ?? null;
  const record = { consumer: consumer.consumer, entry_point: consumer.entry_point, classification, required_identities: requiredIdentities, required_states: requiredStates, missing_identities: missingIdentities, missing_states: missingStates, patch, patch_check: patch ? patchChecks.find(row => row.file === patch)?.valid ?? false : null, acceptance: classification === 'cutover-ready-now-but-coordinated-hold' && patch ? 'ready-for-shadow-run' : 'blocked-before-patch-application' };
  consumers.push(record);
  if (!patch && !['obsolete-or-unreferenced', 'review-only'].includes(classification)) {
    await writeFile(path.join(patchDirectory, `${slug(consumer.consumer)}.blocked.json`), `${JSON.stringify({ consumer: consumer.consumer, reason: 'No safe all-canonical patch can be produced while these prerequisites are unavailable; retaining any old renderer would violate the no-mixed-system contract.', missing_identities: missingIdentities, missing_states: missingStates }, null, 2)}\n`);
  }
}

const report = { schema: 'relphi-canonical-shadow-acceptance/v1', audited_consumers: consumers.length, patch_checks: patchChecks, consumers };
await writeFile(path.join(outputDirectory, 'shadow-acceptance.json'), `${JSON.stringify(report, null, 2)}\n`);
const rows = consumers.map(row => `| ${row.consumer} | ${row.classification} | ${row.missing_identities.join(', ') || '—'} | ${row.missing_states.join(', ') || '—'} | ${row.patch ?? 'withheld: prerequisites incomplete'} | ${row.patch_check ?? 'n/a'} |`).join('\n');
await writeFile(path.join(outputDirectory, 'shadow-acceptance.md'), `# Shadow cutover acceptance\n\nA patch is intentionally withheld when applying it would either mix glyph systems or replace unavailable canonical material with a fallback.\n\n| Consumer | Classification | Missing identities | Missing states | Patch | apply check |\n|---|---|---|---|---|---|\n${rows}\n`);
console.log(JSON.stringify({ valid: patchChecks.every(row => row.valid), consumerCount: consumers.length, patchCount: patchFiles.length, classifications: Object.fromEntries([...new Set(consumers.map(row => row.classification))].map(value => [value, consumers.filter(row => row.classification === value).length])) }, null, 2));
if (patchChecks.some(row => !row.valid)) process.exitCode = 1;
