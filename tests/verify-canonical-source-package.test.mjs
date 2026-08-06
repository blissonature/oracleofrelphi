import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { verifyCanonicalSourcePackage } from '../tools/verify-canonical-source-package.mjs';
import { rewriteManifest, writeValidFixture } from './fixtures/canonical-source-package-fixtures.mjs';

async function fixture(t) {
  const root=await mkdtemp(path.join(os.tmpdir(),'relphi-source-package-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  await writeValidFixture(root);
  return root;
}

test('accepts a valid fail-closed package without rewriting it',async t=>{
  const root=await fixture(t);
  const before=await import('node:fs/promises').then(module=>module.readFile(path.join(root,'manifest.json'),'utf8'));
  const result=await verifyCanonicalSourcePackage(root);
  const after=await import('node:fs/promises').then(module=>module.readFile(path.join(root,'manifest.json'),'utf8'));
  assert.equal(result.valid,true,result.errors.join('\n'));
  assert.equal(result.identityCount,93);
  assert.equal(result.availableCount,2);
  assert.equal(result.exactCount,1);
  assert.equal(result.approvedDifferenceCount,1);
  assert.equal(after,before);
});

test('rejects a missing identity',async t=>{
  const root=await fixture(t);
  await rewriteManifest(root,manifest=>manifest.identities.pop());
  const result=await verifyCanonicalSourcePackage(root);
  assert.equal(result.valid,false);
  assert.match(result.errors.join('\n'),/exactly 93|identity set/);
});

test('rejects a substitute path on a blocked identity',async t=>{
  const root=await fixture(t);
  await rewriteManifest(root,manifest=>{manifest.identities.find(item=>item.canonical_identity==='moon').candidate_path='masters/mercury.svg'});
  const result=await verifyCanonicalSourcePackage(root);
  assert.equal(result.valid,false);
  assert.match(result.errors.join('\n'),/fail closed/);
});

test('rejects hash mismatches',async t=>{
  const root=await fixture(t);
  await rewriteManifest(root,manifest=>{manifest.identities.find(item=>item.canonical_identity==='mercury').candidate_sha256='0'.repeat(64)});
  const result=await verifyCanonicalSourcePackage(root);
  assert.equal(result.valid,false);
  assert.match(result.errors.join('\n'),/SHA-256 mismatch/);
});

test('rejects transforms and font-backed SVG artwork',async t=>{
  const root=await fixture(t);
  await writeFile(path.join(root,'masters/mercury.svg'),'<svg viewBox="0 0 100 100" role="img" aria-label="Mercury"><g transform="scale(2)"><text font-family="Arial">M</text></g></svg>\n','utf8');
  await rewriteManifest(root,manifest=>{const record=manifest.identities.find(item=>item.canonical_identity==='mercury');record.candidate_sha256=awaitHash('<svg viewBox="0 0 100 100" role="img" aria-label="Mercury"><g transform="scale(2)"><text font-family="Arial">M</text></g></svg>\n')});
  const result=await verifyCanonicalSourcePackage(root);
  assert.equal(result.valid,false);
  assert.match(result.errors.join('\n'),/prohibited|font dependency/);
});

test('rejects an available ruler overlay invented from missing authority',async t=>{
  const root=await fixture(t);
  await rewriteManifest(root,manifest=>{const state=manifest.states.find(item=>item.state==='day-ruler');state.status='exact-static-candidate';state.overlay_path='overlays/circled.svg';state.blocker=null});
  const result=await verifyCanonicalSourcePackage(root);
  assert.equal(result.valid,false);
  assert.match(result.errors.join('\n'),/day-ruler must be blocked/);
});

test('rejects a missing approved-difference record',async t=>{const root=await fixture(t);await rm(path.join(root,'approvals/sun-approved-difference.json'));const result=await verifyCanonicalSourcePackage(root);assert.equal(result.valid,false);assert.match(result.errors.join('\n'),/approval record/);});
test('rejects changed documented difference evidence',async t=>{const root=await fixture(t);await rewriteManifest(root,manifest=>{manifest.identities.find(item=>item.canonical_identity==='sun').documented_raster_difference[0].differing_pixels=2});const result=await verifyCanonicalSourcePackage(root);assert.equal(result.valid,false);assert.match(result.errors.join('\n'),/difference evidence changed/);});
test('rejects an approved-difference source relabeled as exact',async t=>{const root=await fixture(t);await rewriteManifest(root,manifest=>{const row=manifest.identities.find(item=>item.canonical_identity==='sun');row.status='exact-static-candidate';row.approval_status='awaiting-approval';manifest.counts.exact_static_masters=2;manifest.counts.approved_with_documented_raster_difference=0});const result=await verifyCanonicalSourcePackage(root);assert.equal(result.valid,false);assert.match(result.errors.join('\n'),/incorrectly claims exact equivalence/);});
test('installed package reports the approved 38/55 split',async()=>{const result=await verifyCanonicalSourcePackage(path.resolve(import.meta.dirname,'../assets/canonical-glyphs/v1'));assert.equal(result.valid,true,result.errors.join('\n'));assert.deepEqual({available:result.availableCount,unavailable:result.blockedCount,exact:result.exactCount,approvedDifference:result.approvedDifferenceCount,failed:result.failedEquivalenceCount,fontText:result.fontTextBlockedCount},{available:38,unavailable:55,exact:33,approvedDifference:5,failed:1,fontText:54});});

function awaitHash(value) {
  return createHash('sha256').update(value).digest('hex');
}
