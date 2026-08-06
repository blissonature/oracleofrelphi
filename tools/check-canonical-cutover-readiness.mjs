#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { verifyCanonicalSourcePackage } from './verify-canonical-source-package.mjs';
import { verifyApprovals } from './verify-canonical-glyph-approvals.mjs';

const argv = process.argv.slice(2);
const option = name => { const index = argv.indexOf(name); return index < 0 ? null : argv[index + 1]; };
const packageDirectory = option('--package') || 'assets/canonical-glyphs/v1';
const planPath = option('--plan');
const patchDirectory = option('--patches');
const shadowReportPath = option('--shadow-report');
const manifest = JSON.parse(await readFile(path.join(packageDirectory, 'manifest.json'), 'utf8'));
const packageVerification = await verifyCanonicalSourcePackage(packageDirectory);
let approvalVerification;
try { approvalVerification = await verifyApprovals({ packageDirectory, records: path.join(packageDirectory, 'approvals') }); }
catch (error) { approvalVerification = { valid: false, code: error.code, message: error.message, records: [] }; }

const blockedIdentities = manifest.identities.filter(entry => !entry.candidate_path);
const moon = blockedIdentities.filter(entry => entry.canonical_identity === 'moon');
const astrology = blockedIdentities.filter(entry => !entry.canonical_identity.startsWith('hebrew-') && !entry.canonical_identity.startsWith('greek-') && entry.canonical_identity !== 'moon');
const hebrew = blockedIdentities.filter(entry => entry.canonical_identity.startsWith('hebrew-'));
const greek = blockedIdentities.filter(entry => entry.canonical_identity.startsWith('greek-'));
const blockedStates = manifest.states.filter(entry => entry.state !== 'plain' && entry.state !== 'circled' && !entry.overlay_path);
const stateNames = { 'day-ruler': 'Day Ruler', 'hour-ruler': 'Hour Ruler', 'day-and-hour-ruler': 'Day-and-Hour Ruler' };
const blocker = (kind, id, name) => Object.freeze({ kind, id, name });
const blockers = Object.freeze([
  ...moon.map(entry => blocker('master', entry.canonical_identity, entry.display_name)),
  ...astrology.map(entry => blocker('master', entry.canonical_identity, entry.display_name)),
  ...hebrew.map(entry => blocker('master', entry.canonical_identity, entry.display_name)),
  ...greek.map(entry => blocker('master', entry.canonical_identity, entry.display_name)),
  ...blockedStates.map(entry => blocker('overlay', entry.state, stateNames[entry.state]))
]);

async function readableJson(file) {
  if (!file) return null;
  try { await access(file); return JSON.parse(await readFile(file, 'utf8')); }
  catch { return null; }
}
const plan = await readableJson(planPath);
const shadow = await readableJson(shadowReportPath);
let patchesCurrent = false;
if (patchDirectory && shadow?.patch_checks) {
  patchesCurrent = shadow.patch_checks.every(check => check.valid);
  for (const check of shadow.patch_checks) {
    if (!check.valid) continue;
    try { execFileSync('git', ['apply', '--check', path.join(patchDirectory, check.file)], { stdio: 'pipe' }); }
    catch { patchesCurrent = false; }
  }
}
const activePlanCoverage = plan?.consumers?.length === 40;
const shadowPassing = shadow?.consumers?.length === 40 && shadow.patch_checks?.every(check => check.valid);
let productionAuditReady = false;
try {
  execFileSync(process.execPath, ['tests/canonical-glyph-migration-phase-audit.mjs', '--phase=production-cutover'], { stdio: 'pipe' });
  productionAuditReady = true;
} catch {}

const conditions = Object.freeze({
  approved_masters_93: manifest.identities.length === 93 && blockedIdentities.length === 0,
  circled_approved: Boolean(manifest.states.find(entry => entry.state === 'circled')?.overlay_path),
  ruler_overlays_approved: blockedStates.length === 0,
  no_failed_or_blocked_identity: blockedIdentities.length === 0,
  source_hashes_valid: packageVerification.valid,
  approval_records_valid: approvalVerification.valid === true,
  consumer_patches_current: patchesCurrent,
  shadow_acceptance_passing: shadowPassing,
  active_consumers_in_plan: activePlanCoverage,
  production_cutover_audit_ready: productionAuditReady
});
const ready = blockers.length === 0 && Object.values(conditions).every(Boolean);
const report = Object.freeze({
  schema: 'relphi-canonical-cutover-readiness/v1',
  ready,
  conditions,
  blocker_count: blockers.length,
  blocker_groups: Object.freeze({ moon: moon.length, astrology_and_angles: astrology.length, hebrew: hebrew.length, greek: greek.length, ruler_overlays: blockedStates.length }),
  blockers
});
console.log(JSON.stringify(report, null, 2));
if (!ready) process.exitCode = 1;

