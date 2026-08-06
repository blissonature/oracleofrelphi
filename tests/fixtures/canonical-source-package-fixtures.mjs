import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { CANONICAL_IDENTITIES, LEGAL_STATES } from '../../tools/verify-canonical-source-package.mjs';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const validation = [100,400,1000].flatMap(size => [1,2].map(density => ({ size, density, differing_pixels:0, bounds_identical:true })));

export async function writeValidFixture(root) {
  const master = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Mercury"><circle cx="50" cy="50" r="10" fill="none" stroke="#111111"/></svg>\n';
  const overlay = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Circled backplate"><circle cx="50" cy="50" r="29.6875" fill="#fff" stroke="#111111" stroke-width="3.671875"/></svg>\n';
  const identities = CANONICAL_IDENTITIES.map(identity => {
    const exact = identity === 'mercury';
    return {
      canonical_identity:identity,
      display_name:identity === 'mercury' ? 'Mercury' : identity,
      proposed_canonical_filename:`${identity}.svg`,
      candidate_path:exact ? 'masters/mercury.svg' : null,
      status:exact ? 'exact-static-candidate' : 'blocked-missing-or-invalid-capture',
      source_provenance:exact ? { kind:'test-fixture' } : null,
      captured_authority_sha256:sha256(Buffer.from(`capture:${identity}`)),
      candidate_sha256:exact ? sha256(Buffer.from(master)) : null,
      viewBox:exact ? '0 0 100 100' : null,
      validation_matrix:exact ? validation : [],
      permitted_states:LEGAL_STATES,
      approval_status:exact ? 'awaiting-approval' : 'blocked',
      blocker:exact ? null : 'Fixture intentionally unavailable.'
    };
  });
  const manifest = {
    schema:'relphi-canonical-source-package/v1',
    package_status:'incomplete',
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
  await writeFile(path.join(root,'masters/mercury.svg'),master,'utf8');
  await writeFile(path.join(root,'overlays/circled.svg'),overlay,'utf8');
  await writeFile(path.join(root,'manifest.json'),`${JSON.stringify(manifest,null,2)}\n`,'utf8');
  return manifest;
}

export async function rewriteManifest(root, mutate) {
  const file=path.join(root,'manifest.json');
  const manifest=JSON.parse(await import('node:fs/promises').then(module=>module.readFile(file,'utf8')));
  mutate(manifest);
  await writeFile(file,`${JSON.stringify(manifest,null,2)}\n`,'utf8');
}
