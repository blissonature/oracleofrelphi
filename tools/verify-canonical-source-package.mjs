#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CANONICAL_IDENTITIES = [
  'sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','chiron','north-node','south-node','lilith','part-of-fortune','vertex','asc','dsc','mc','ic',
  'aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces','fire','water','air','earth',
  'conjunction','opposition','trine','square','sextile','semi-sextile','quincunx','octile','tri-octile','quintile','bi-quintile',
  'hebrew-aleph','hebrew-beth','hebrew-gimel','hebrew-daleth','hebrew-heh','hebrew-vav','hebrew-zayin','hebrew-cheth','hebrew-teth','hebrew-yod','hebrew-kaph','hebrew-lamed','hebrew-mem','hebrew-nun','hebrew-samekh','hebrew-ayin','hebrew-peh','hebrew-tzaddi','hebrew-qoph','hebrew-resh','hebrew-shin','hebrew-tav',
  'greek-alpha','greek-beta','greek-gamma','greek-delta','greek-epsilon','greek-zeta','greek-eta','greek-theta','greek-iota','greek-kappa','greek-lambda','greek-mu','greek-nu','greek-xi','greek-omicron','greek-pi','greek-rho','greek-sigma','greek-tau','greek-upsilon','greek-phi','greek-chi','greek-psi','greek-omega'
].sort();

export const LEGAL_STATES = ['plain','circled','day-ruler','hour-ruler','day-and-hour-ruler'];
const EXACT_STATUS = 'exact-static-candidate';
const APPROVED_DIFFERENCE_STATUS = 'approved-with-documented-raster-difference';
const AVAILABLE_STATUSES = new Set([EXACT_STATUS,APPROVED_DIFFERENCE_STATUS]);
const ALLOWED_STATUSES = new Set([...AVAILABLE_STATUSES,'blocked-font-or-text','blocked-unsupported-vector-feature','blocked-missing-or-invalid-capture','failed-pixel-equivalence']);
const PROHIBITED_TAG = /<(?:text|script|foreignObject|image|use|filter|mask|clipPath|iframe|object|embed|style|symbol|pattern|linearGradient|radialGradient|marker)\b/i;
const PROHIBITED_ATTRIBUTE = /\s(?:transform|href|xlink:href|filter|mask|clip-path|on[a-z]+|font-family|font-size|font-weight|vector-effect)\s*=/i;
const EXTERNAL_REFERENCE = /url\s*\(|(?:https?:|data:|javascript:)/i;
const HASH = /^[a-f0-9]{64}$/;

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function assert(condition, message, errors) {
  if (!condition) errors.push(message);
}

function safePackagePath(root, relative, label, errors) {
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative) || relative.includes('\\')) {
    errors.push(`${label} must be a nonempty forward-slash relative path.`);
    return null;
  }
  const resolved = path.resolve(root, relative);
  const inside = path.relative(root, resolved);
  if (!inside || inside.startsWith('..') || path.isAbsolute(inside)) {
    errors.push(`${label} escapes or resolves to the package root.`);
    return null;
  }
  return resolved;
}

function inspectSvg(source, label, expectedName, errors) {
  assert(/^<svg\b/i.test(source.trimStart()), `${label} is not an SVG document.`, errors);
  assert(/\bviewBox="0 0 100 100"/.test(source), `${label} must use viewBox="0 0 100 100".`, errors);
  assert(!PROHIBITED_TAG.test(source), `${label} contains a prohibited SVG element.`, errors);
  assert(!PROHIBITED_ATTRIBUTE.test(source), `${label} contains a prohibited SVG attribute.`, errors);
  assert(!EXTERNAL_REFERENCE.test(source.replace('http://www.w3.org/2000/svg','')), `${label} contains an external or embedded reference.`, errors);
  assert(!/\bfont(?:-family|-size|-weight)?\b/i.test(source), `${label} contains a font dependency.`, errors);
  assert(/<(?:path|circle|rect)\b/i.test(source), `${label} contains no path or basic shape.`, errors);
  if (expectedName) assert(source.includes(`aria-label="${expectedName.replaceAll('&','&amp;').replaceAll('"','&quot;')}"`), `${label} lacks identity-specific accessibility metadata.`, errors);
}

export async function verifyCanonicalSourcePackage(packageRoot) {
  const root = path.resolve(packageRoot);
  const errors = [];
  let manifest;
  try { manifest = JSON.parse(await readFile(path.join(root,'manifest.json'),'utf8')); }
  catch (error) { return { valid:false, errors:[`Cannot read manifest.json: ${error.message}`], identityCount:0, exactCount:0 }; }

  assert(manifest.schema === 'relphi-canonical-source-package/v1', 'Unsupported or missing manifest schema.', errors);
  assert(manifest.package_status === 'incomplete', 'Package must remain fail-closed and declare package_status "incomplete".', errors);
  assert(Array.isArray(manifest.identities), 'Manifest identities must be an array.', errors);
  const identities = Array.isArray(manifest.identities) ? manifest.identities : [];
  assert(identities.length === 93, `Manifest must contain exactly 93 identities; found ${identities.length}.`, errors);
  const names = identities.map(record => record.canonical_identity);
  assert(JSON.stringify(names) === JSON.stringify([...names].sort()), 'Manifest identities are not in deterministic canonical-identity order.', errors);
  assert(JSON.stringify(names) === JSON.stringify(CANONICAL_IDENTITIES), 'Manifest identity set does not equal the approved 93 identities.', errors);

  assert(Array.isArray(manifest.states), 'Manifest states must be an array.', errors);
  const states = Array.isArray(manifest.states) ? manifest.states : [];
  assert(JSON.stringify(states.map(state => state.state)) === JSON.stringify(LEGAL_STATES), 'Legal states are missing, duplicated, or out of deterministic order.', errors);
  const plain = states.find(state => state.state === 'plain');
  assert(plain?.status === 'intrinsic' && plain?.overlay_path === null, 'Plain state must be intrinsic with no overlay path.', errors);
  const circled = states.find(state => state.state === 'circled');
  assert(circled?.status === EXACT_STATUS && typeof circled?.overlay_path === 'string', 'Circled state must reference an exact static overlay.', errors);
  for (const stateName of ['day-ruler','hour-ruler','day-and-hour-ruler']) {
    const state = states.find(item => item.state === stateName);
    assert(state?.status === 'blocked-missing-or-invalid-capture' && state?.overlay_path === null && Boolean(state?.blocker), `${stateName} must be blocked with a null path and explicit blocker.`, errors);
  }

  const paths = new Set();
  let exactCount = 0, approvedDifferenceCount = 0, fontTextBlockedCount = 0, failedEquivalenceCount = 0;
  for (const record of identities) {
    const label = `identity ${record.canonical_identity}`;
    assert(ALLOWED_STATUSES.has(record.status), `${label} has an invalid status.`, errors);
    assert(Array.isArray(record.permitted_states) && JSON.stringify(record.permitted_states) === JSON.stringify(LEGAL_STATES), `${label} has invalid legal-state declarations.`, errors);
    assert(typeof record.captured_authority_sha256 === 'string' && HASH.test(record.captured_authority_sha256), `${label} lacks a valid captured-authority SHA-256.`, errors);
    assert(typeof record.proposed_canonical_filename === 'string' && record.proposed_canonical_filename.endsWith('.svg'), `${label} lacks a proposed canonical filename.`, errors);
    if (!AVAILABLE_STATUSES.has(record.status)) {
      if(record.status==='blocked-font-or-text')fontTextBlockedCount++;
      if(record.status==='failed-pixel-equivalence')failedEquivalenceCount++;
      assert(record.candidate_path === null, `${label} must fail closed with candidate_path null.`, errors);
      assert(record.candidate_sha256 === null, `${label} must not carry a substitute candidate hash.`, errors);
      assert(record.viewBox === null, `${label} must not claim a candidate viewBox.`, errors);
      assert(Boolean(record.blocker), `${label} must state its blocker.`, errors);
      continue;
    }
    const approvedDifference=record.status===APPROVED_DIFFERENCE_STATUS;
    if(approvedDifference)approvedDifferenceCount++;else exactCount++;
    assert(record.approval_status === (approvedDifference?'approved':'awaiting-approval'), `${label} has an invalid approval status.`, errors);
    assert(record.viewBox === '0 0 100 100', `${label} has an invalid viewBox declaration.`, errors);
    assert(typeof record.candidate_sha256 === 'string' && HASH.test(record.candidate_sha256), `${label} lacks a valid candidate SHA-256.`, errors);
    assert(Array.isArray(record.validation_matrix) && record.validation_matrix.length === 6, `${label} lacks six validation results.`, errors);
    if(approvedDifference)assert(record.validation_matrix?.some(item=>item.differing_pixels>0)&&record.validation_matrix?.every(item=>Number.isInteger(item.differing_pixels)&&item.differing_pixels>=0),`${label} must retain its documented non-zero raster difference.`,errors);
    else assert(record.validation_matrix?.every(item => item.differing_pixels === 0 && item.bounds_identical === true), `${label} incorrectly claims exact equivalence.`, errors);
    assert(typeof record.candidate_path === 'string' && record.candidate_path.startsWith('masters/'), `${label} must use an identity-specific masters path.`, errors);
    assert(!paths.has(record.candidate_path), `${label} reuses candidate path ${record.candidate_path}.`, errors);
    paths.add(record.candidate_path);
    const file = safePackagePath(root,record.candidate_path,`${label} candidate_path`,errors);
    if (!file) continue;
    try {
      const bytes = await readFile(file);
      assert(sha256(bytes) === record.candidate_sha256, `${label} candidate SHA-256 mismatch.`, errors);
      inspectSvg(bytes.toString('utf8'),label,record.display_name,errors);
    } catch (error) { errors.push(`${label} candidate cannot be read: ${error.message}`); }
    if(approvedDifference){
      const approvalRelative=record.source_provenance?.approval_record;
      assert(typeof approvalRelative==='string'&&approvalRelative.startsWith('approvals/'),`${label} lacks a package approval record.`,errors);
      const approvalFile=approvalRelative?safePackagePath(root,approvalRelative,`${label} approval record`,errors):null;
      if(approvalFile)try{
        const approval=JSON.parse(await readFile(approvalFile,'utf8'));
        const expectedSource=`assets/canonical-glyphs/v1/${record.candidate_path}`;
        assert(approval.record_type==='failed-equivalence-decision'&&approval.identity===record.canonical_identity,`${label} approval identity or type mismatch.`,errors);
        assert(approval.decision_type==='approve-named-baked-candidate-with-documented-raster-difference',`${label} approval decision mismatch.`,errors);
        assert(approval.candidate_sha256===record.candidate_sha256&&approval.source_path===expectedSource,`${label} approval hash or path mismatch.`,errors);
        assert(approval.reference_package_hash===manifest.approval_reference_package_sha256,`${label} approval reference package mismatch.`,errors);
        assert(approval.no_geometry_value_changed_to_force_equivalence===true&&approval.no_fallback_or_runtime_fitting_authorized===true,`${label} approval authorizes geometry changes or fallback.`,errors);
        assert(['geometry','whitespace','scale','position','proportions','strokes'].every(key=>approval.geometry_confirmation?.[key]===true),`${label} approval lacks preservation confirmation.`,errors);
        assert(Array.isArray(record.documented_raster_difference)&&record.documented_raster_difference.length===1&&JSON.stringify(record.documented_raster_difference[0])===JSON.stringify(approval.documented_raster_difference),`${label} documented difference evidence changed.`,errors);
        const unsigned={...approval};delete unsigned.signature;
        assert(approval.signature?.signed_payload_sha256===sha256(Buffer.from(JSON.stringify(unsigned)))&&Boolean(approval.signature?.value),`${label} approval signature payload is stale.`,errors);
      }catch(error){errors.push(`${label} approval record cannot be read or validated: ${error.message}`);}
    }
  }

  const availableCount=exactCount+approvedDifferenceCount,blockedCount=identities.length-availableCount;
  const actualCounts={identity_total:identities.length,available_masters:availableCount,unavailable_masters:blockedCount,exact_static_masters:exactCount,approved_with_documented_raster_difference:approvedDifferenceCount,failed_equivalence_identities:failedEquivalenceCount,font_or_text_blocked_identities:fontTextBlockedCount};
  assert(JSON.stringify(manifest.counts)===JSON.stringify(actualCounts),'Manifest counts do not match independently verified status totals.',errors);
  assert(identities.find(record=>record.canonical_identity==='moon')?.status==='failed-pixel-equivalence','Moon must remain the sole failed-equivalence identity.',errors);

  if (circled?.overlay_path) {
    const file = safePackagePath(root,circled.overlay_path,'circled overlay_path',errors);
    if (file) try {
      const bytes = await readFile(file);
      assert(sha256(bytes) === circled.sha256, 'Circled overlay SHA-256 mismatch.', errors);
      const source = bytes.toString('utf8');
      inspectSvg(source,'circled overlay','Circled backplate',errors);
      assert(/<circle\s[^>]*cx="50"[^>]*cy="50"[^>]*r="29\.6875"[^>]*fill="#fff"[^>]*stroke="#111111"[^>]*stroke-width="3\.671875"/i.test(source), 'Circled overlay geometry or paint differs from the approved static backplate.', errors);
    } catch (error) { errors.push(`Circled overlay cannot be read: ${error.message}`); }
  }

  for (const forbidden of ['fallback','unicode','font','substitute_path','alternate_source']) assert(!(forbidden in manifest), `Manifest contains prohibited fallback field ${forbidden}.`, errors);
  return { valid:errors.length === 0, errors, identityCount:identities.length, availableCount, blockedCount, exactCount, approvedDifferenceCount, failedEquivalenceCount, fontTextBlockedCount, stateCount:states.length };
}

function usage() {
  return 'Usage: node tools/verify-canonical-source-package.mjs <canonical-package-directory>';
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  if (process.argv.length !== 3) { console.error(usage()); process.exitCode=2; }
  else {
    const result = await verifyCanonicalSourcePackage(process.argv[2]);
    console.log(JSON.stringify(result,null,2));
    if (!result.valid) process.exitCode=1;
  }
}
