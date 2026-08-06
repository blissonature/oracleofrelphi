import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { CANONICAL_IDENTITIES, LEGAL_STATES } from '../../tools/verify-canonical-source-package.mjs';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const validation = [100,400,1000].flatMap(size => [1,2].map(density => ({ size, density, differing_pixels:0, bounds_identical:true })));

export async function writeValidFixture(root) {
  const master = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Mercury"><circle cx="50" cy="50" r="10" fill="none" stroke="#111111"/></svg>\n';
  const approvedMaster = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Sun"><circle cx="50" cy="50" r="12" fill="none" stroke="#111111"/></svg>\n';
  const overlay = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Circled backplate"><circle cx="50" cy="50" r="29.6875" fill="#fff" stroke="#111111" stroke-width="3.671875"/></svg>\n';
  const referencePackageHash='a'.repeat(64),difference={size:1000,density:1,differing_pixels:1,bounding_box:{x:50,y:50,width:1,height:1},cause:'fixture edge',finding:'Fixture documented difference.'};
  const identities = CANONICAL_IDENTITIES.map(identity => {
    const exact = identity === 'mercury';
    const approvedDifference = identity === 'sun';
    const available=exact||approvedDifference;
    return {
      canonical_identity:identity,
      display_name:identity === 'mercury' ? 'Mercury' : identity === 'sun' ? 'Sun' : identity,
      proposed_canonical_filename:`${identity}.svg`,
      candidate_path:exact ? 'masters/mercury.svg' : approvedDifference ? 'masters/sun.svg' : null,
      status:exact ? 'exact-static-candidate' : approvedDifference ? 'approved-with-documented-raster-difference' : identity==='moon' ? 'failed-pixel-equivalence' : 'blocked-font-or-text',
      source_provenance:exact ? { kind:'test-fixture' } : approvedDifference ? {kind:'test-fixture-approved-difference',approval_record:'approvals/sun-approved-difference.json'} : null,
      captured_authority_sha256:sha256(Buffer.from(`capture:${identity}`)),
      candidate_sha256:exact ? sha256(Buffer.from(master)) : approvedDifference ? sha256(Buffer.from(approvedMaster)) : null,
      viewBox:available ? '0 0 100 100' : null,
      validation_matrix:exact ? validation : approvedDifference ? validation.map((row,index)=>index===4?{...row,differing_pixels:1}:row) : [],
      ...(approvedDifference?{documented_raster_difference:[difference]}:{}),
      permitted_states:LEGAL_STATES,
      approval_status:exact ? 'awaiting-approval' : approvedDifference ? 'approved' : 'blocked',
      blocker:available ? null : 'Fixture intentionally unavailable.'
    };
  });
  const manifest = {
    schema:'relphi-canonical-source-package/v1',
    package_status:'incomplete',
    approval_reference_package_sha256:referencePackageHash,
    counts:{identity_total:93,available_masters:2,unavailable_masters:91,exact_static_masters:1,approved_with_documented_raster_difference:1,failed_equivalence_identities:1,font_or_text_blocked_identities:90},
    identities,
    states:[
      { state:'plain', status:'intrinsic', overlay_path:null, sha256:null, blocker:null },
      { state:'circled', status:'exact-static-candidate', overlay_path:'overlays/circled.svg', sha256:sha256(Buffer.from(overlay)), blocker:null },
      { state:'day-ruler', status:'blocked-missing-or-invalid-capture', overlay_path:null, sha256:null, blocker:'Unavailable.' },
      { state:'hour-ruler', status:'blocked-missing-or-invalid-capture', overlay_path:null, sha256:null, blocker:'Unavailable.' },
      { state:'day-and-hour-ruler', status:'blocked-missing-or-invalid-capture', overlay_path:null, sha256:null, blocker:'Unavailable.' }
    ]
  };
  await mkdir(path.join(root,'masters'),{recursive:true});
  await mkdir(path.join(root,'overlays'),{recursive:true});
  await mkdir(path.join(root,'approvals'),{recursive:true});
  await writeFile(path.join(root,'masters/mercury.svg'),master,'utf8');
  await writeFile(path.join(root,'masters/sun.svg'),approvedMaster,'utf8');
  await writeFile(path.join(root,'overlays/circled.svg'),overlay,'utf8');
  const approval={record_type:'failed-equivalence-decision',identity:'sun',candidate_sha256:sha256(Buffer.from(approvedMaster)),source_path:'assets/canonical-glyphs/v1/masters/sun.svg',approving_authority:'Fixture authority',approval_date:'2026-08-06',baseline_commit:'0'.repeat(40),reference_package_hash:referencePackageHash,decision_type:'approve-named-baked-candidate-with-documented-raster-difference',notes:'fixture',documented_raster_difference:difference,no_geometry_value_changed_to_force_equivalence:true,geometry_confirmation:{geometry:true,whitespace:true,scale:true,position:true,proportions:true,strokes:true},no_fallback_or_runtime_fitting_authorized:true};
  approval.signature={algorithm:'fixture',key_id:'fixture',signed_payload_sha256:sha256(Buffer.from(JSON.stringify(approval))),value:'fixture'};
  await writeFile(path.join(root,'approvals/sun-approved-difference.json'),`${JSON.stringify(approval,null,2)}\n`,'utf8');
  await writeFile(path.join(root,'manifest.json'),`${JSON.stringify(manifest,null,2)}\n`,'utf8');
  return manifest;
}

export async function rewriteManifest(root, mutate) {
  const file=path.join(root,'manifest.json');
  const manifest=JSON.parse(await import('node:fs/promises').then(module=>module.readFile(file,'utf8')));
  mutate(manifest);
  await writeFile(file,`${JSON.stringify(manifest,null,2)}\n`,'utf8');
}
