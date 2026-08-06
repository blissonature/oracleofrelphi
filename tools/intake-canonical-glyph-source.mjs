#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

export const LEGAL_OVERLAYS = Object.freeze(['circled','day-ruler','hour-ruler','day-and-hour-ruler']);
export const ALLOWED_ELEMENTS = new Set(['svg','title','desc','g','path','circle','rect','line','polyline','polygon','ellipse']);
export const ALLOWED_ATTRIBUTES = new Set([
  'xmlns','viewBox','role','aria-label','aria-hidden','focusable','id','d','cx','cy','r','rx','ry','x','y','x1','x2','y1','y2',
  'width','height','points','fill','fill-rule','fill-opacity','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-miterlimit',
  'stroke-dasharray','stroke-dashoffset','stroke-opacity','opacity','vector-effect','paint-order'
]);
const FORBIDDEN_ELEMENTS = new Set(['text','script','image','foreignobject','filter','mask','clippath','symbol','use','style','animate','animatemotion','animatetransform','set','iframe','object','embed','link']);
const PAINT_OR_GEOMETRY = new Set(['path','circle','rect','line','polyline','polygon','ellipse']);
const SHA = /^[a-f0-9]{64}$/;
const GIT_SHA = /^[a-f0-9]{40}$/;
const sha256 = value => createHash('sha256').update(value).digest('hex');
const require = createRequire(import.meta.url);
const slash = value => value.replaceAll('\\','/');

export class IntakeError extends Error {
  constructor(code,message,details={}) { super(message); this.name='IntakeError'; this.code=code; this.details=details; }
}

function parseAttributes(source) {
  const attrs=[];
  const pattern=/([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match;
  while ((match=pattern.exec(source))) attrs.push([match[1],match[2] ?? match[3]]);
  return attrs;
}

export function auditSvg(source,{kind='master'}={}) {
  if (!source || !source.trim()) throw new IntakeError('EMPTY_SOURCE','SVG source is empty.');
  if (/<!DOCTYPE|<!ENTITY/i.test(source)) throw new IntakeError('EXTERNAL_REFERENCE','DOCTYPE and entity declarations are prohibited.');
  const root=source.match(/<svg\b([^>]*)>/i);
  if (!root || !/<\/svg\s*>/i.test(source)) throw new IntakeError('MALFORMED_SVG','A complete SVG root is required.');
  const rootAttrs=Object.fromEntries(parseAttributes(root[1]));
  if (rootAttrs.viewBox !== '0 0 100 100') throw new IntakeError('WRONG_VIEWBOX','SVG must use exactly viewBox="0 0 100 100".',{actual:rootAttrs.viewBox ?? null});
  const elements=[...source.matchAll(/<\/?\s*([A-Za-z][\w:-]*)\b([^>]*)>/g)].filter(m=>!m[0].startsWith('</'));
  const audit={kind,viewBox:rootAttrs.viewBox,elements:[],geometry_count:0,attributes:[],forbidden:[]};
  for (const match of elements) {
    const tag=match[1].toLowerCase();
    if (FORBIDDEN_ELEMENTS.has(tag) || !ALLOWED_ELEMENTS.has(tag)) throw new IntakeError('FORBIDDEN_ELEMENT',`Element <${tag}> is prohibited.`,{element:tag});
    audit.elements.push(tag);
    if (PAINT_OR_GEOMETRY.has(tag)) audit.geometry_count++;
    for (const [rawName,value] of parseAttributes(match[2])) {
      const name=rawName.toLowerCase();
      audit.attributes.push(name);
      if (name === 'transform') throw new IntakeError('TRANSFORM_PROHIBITED','Transforms are prohibited.');
      if (name === 'style' || name.startsWith('on')) throw new IntakeError('RUNTIME_METADATA_PROHIBITED',`Attribute ${rawName} is prohibited.`);
      if (!ALLOWED_ATTRIBUTES.has(rawName) && !ALLOWED_ATTRIBUTES.has(name)) throw new IntakeError('FORBIDDEN_ATTRIBUTE',`Attribute ${rawName} is not permitted.`,{attribute:rawName});
      if (/url\s*\(|(?:href|src)\s*=|javascript:/i.test(`${name}=${value}`)) throw new IntakeError('EXTERNAL_REFERENCE','External or indirect references are prohibited.');
      if (/font/i.test(name) || /font/i.test(value)) throw new IntakeError('FONT_PROHIBITED','Font metadata is prohibited.');
      if (/data-(?:fit|crop|radius|padding|runtime|fallback)/i.test(name)) throw new IntakeError('RUNTIME_METADATA_PROHIBITED',`Runtime metadata ${rawName} is prohibited.`);
    }
  }
  if (!audit.geometry_count) throw new IntakeError('EMPTY_ARTWORK','SVG contains no permitted visible geometry.');
  const normalized=source.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').trimEnd()+'\n';
  const geometrySignature=source
    .replace(/<\/?(?:title|desc)\b[^>]*>/gi,'').replace(/<(?:title|desc)\b[^>]*>[\s\S]*?<\/(?:title|desc)>/gi,'')
    .replace(/\s(?:role|aria-label|aria-hidden|focusable|id)=(?:"[^"]*"|'[^']*')/gi,'').replace(/>\s+</g,'><').trim();
  return {...audit,raw_sha256:sha256(Buffer.from(source)),normalized_source_sha256:sha256(Buffer.from(normalized)),geometry_signature_sha256:sha256(Buffer.from(geometrySignature)),normalized_byte_length:Buffer.byteLength(normalized)};
}

async function sharpModule() {
  try { return require('sharp'); }
  catch { throw new IntakeError('RASTER_DEPENDENCY_MISSING','Raster comparison requires the optional sharp dependency.'); }
}

async function rasterEvidence(svg,reference,output,slug) {
  if (!reference) return null;
  if (!fs.existsSync(reference)) throw new IntakeError('REFERENCE_MISSING',`Raster reference does not exist: ${reference}`);
  const sharp=await sharpModule();
  const results=[];
  for (const size of [100,400,1000]) for (const density of [1,2]) {
    const pixels=size*density, base=`${slug}-${size}-dpr${density}`;
    const candidate=await sharp(Buffer.from(svg)).resize(pixels,pixels,{fit:'fill'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const ref=await sharp(reference).resize(pixels,pixels,{fit:'fill'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let count=0,minX=pixels,minY=pixels,maxX=-1,maxY=-1;
    const diff=Buffer.alloc(candidate.data.length), overlay=Buffer.alloc(candidate.data.length);
    const visibleBounds=(data)=>{let x0=pixels,y0=pixels,x1=-1,y1=-1;for(let y=0;y<pixels;y++)for(let x=0;x<pixels;x++){if(data[(y*pixels+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}}return x1<0?null:{x:x0,y:y0,width:x1-x0+1,height:y1-y0+1};};
    for(let i=0;i<candidate.data.length;i+=4){const px=i/4,x=px%pixels,y=Math.floor(px/pixels);let changed=false;for(let c=0;c<4;c++){const delta=Math.abs(candidate.data[i+c]-ref.data[i+c]);diff[i+c]=c===3?255:delta;overlay[i+c]=c===3?255:Math.round((candidate.data[i+c]+ref.data[i+c])/2);if(delta)changed=true;}if(changed){count++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}}
    const files={candidate:`${base}-candidate.png`,reference:`${base}-reference.png`,overlay:`${base}-overlay.png`,difference:`${base}-difference.png`};
    await Promise.all([
      sharp(candidate.data,{raw:{width:pixels,height:pixels,channels:4}}).png().toFile(path.join(output,files.candidate)),
      sharp(ref.data,{raw:{width:pixels,height:pixels,channels:4}}).png().toFile(path.join(output,files.reference)),
      sharp(overlay,{raw:{width:pixels,height:pixels,channels:4}}).png().toFile(path.join(output,files.overlay)),
      sharp(diff,{raw:{width:pixels,height:pixels,channels:4}}).png().toFile(path.join(output,files.difference))
    ]);
    const cb=visibleBounds(candidate.data), rb=visibleBounds(ref.data);
    const whitespace=b=>b?{left:b.x,top:b.y,right:pixels-(b.x+b.width),bottom:pixels-(b.y+b.height)}:null;
    results.push({size,density,pixel_width:pixels,differing_pixels:count,difference_bounds:count?{x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1}:null,candidate_visible_bounds:cb,reference_visible_bounds:rb,candidate_whitespace:whitespace(cb),reference_whitespace:whitespace(rb),files});
  }
  return results;
}

function requiredPath(entry){ return `assets/canonical-glyphs/v1/masters/${entry.proposed_canonical_filename}`; }
function overlayPath(state){ return `assets/canonical-glyphs/v1/overlays/${state}.svg`; }

export async function intake({manifestPath='assets/canonical-glyphs/v1/manifest.json',submissions,outputDirectory,replacementReview=false,sharingApproval=null,approvalRecord=null}) {
  const manifestSource=await readFile(manifestPath,'utf8');
  const manifest=JSON.parse(manifestSource);
  const referencePackageHash=sha256(Buffer.from(manifestSource));
  if (!Array.isArray(manifest.identities) || manifest.identities.length!==93) throw new IntakeError('MALFORMED_MANIFEST','Expected a 93-entry canonical manifest.');
  if (!Array.isArray(submissions) || !submissions.length) throw new IntakeError('NO_SUBMISSIONS','At least one submission is required.');
  await mkdir(outputDirectory,{recursive:true});
  const installedPaths=new Map(manifest.identities.filter(x=>x.candidate_path).map(x=>[x.candidate_path,x.canonical_identity]));
  const seenPaths=new Map(), seenGeometry=new Map();
  let sharing=null;
  if (sharingApproval) {
    sharing=JSON.parse(await readFile(sharingApproval,'utf8'));
    if(sharing.record_type!=='shared-geometry-approval'||sharing.decision_type!=='approve-shared-geometry'||!sharing.approving_authority||!sharing.signature?.value||sharing.reference_package_hash!==referencePackageHash||sharing.no_fallback_or_runtime_fitting_authorized!==true)throw new IntakeError('INVALID_SHARING_APPROVAL','Shared geometry declaration is not a complete, package-bound external approval.');
  }
  const reports=[];
  for (const submission of submissions) {
    const isOverlay=Boolean(submission.overlay);
    let identity=null, state=null, finalPath, status, display;
    if (isOverlay) {
      state=submission.overlay;
      if(!LEGAL_OVERLAYS.includes(state)) throw new IntakeError('UNKNOWN_OVERLAY_STATE',`Unknown overlay state: ${state}`);
      const manifestState=manifest.states.find(x=>x.state===state);
      if(!manifestState) throw new IntakeError('UNKNOWN_OVERLAY_STATE',`State ${state} is absent from the manifest.`);
      finalPath=overlayPath(state); status=manifestState.status; display=state;
      if(!['backplate','foreground'].includes(submission.zOrder)) throw new IntakeError('Z_ORDER_REQUIRED','Overlay z-order must be declared as backplate or foreground.');
    } else {
      identity=submission.identity;
      const entry=manifest.identities.find(x=>x.canonical_identity===identity);
      if(!entry) throw new IntakeError('UNKNOWN_IDENTITY',`Identity does not exist in the 93-entry manifest: ${identity}`);
      if(entry.candidate_path && !replacementReview) throw new IntakeError('IDENTITY_NOT_BLOCKED',`${identity} already has a source; use explicit replacement review.`);
      finalPath=requiredPath(entry); status=entry.status; display=entry.display_name;
    }
    if(seenPaths.has(finalPath)) throw new IntakeError('DUPLICATE_IDENTITY_PATH',`Required path was submitted more than once: ${finalPath}`);
    seenPaths.set(finalPath,identity||state);
    const source=await readFile(submission.file,'utf8');
    const audit=auditSvg(source,{kind:isOverlay?'overlay':'master'});
    if (!isOverlay) {
      const label=source.match(/<svg\b[^>]*\baria-label=(?:"([^"]*)"|'([^']*)')/i);
      if (label) {
        const normalized=String(label[1]??label[2]).trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
        const accepted=[identity,String(display).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')];
        if(!accepted.includes(normalized)) throw new IntakeError('MISMATCHED_IDENTITY',`SVG accessibility identity "${label[1]??label[2]}" does not match ${identity}.`);
      }
    }
    if (isOverlay && /data-(?:identity|glyph)/i.test(source)) throw new IntakeError('OVERLAY_IDENTITY_DEPENDENCY','Overlay must not depend on an identity.');
    if (isOverlay && /aria-label=(?:"|')[^"']*(?:sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|glyph)/i.test(source)) throw new IntakeError('OVERLAY_GLYPH_GEOMETRY','Overlay metadata indicates glyph geometry.');
    const prior=seenGeometry.get(audit.geometry_signature_sha256);
    if(prior && prior!==(identity||state)) {
      const approved=sharing && sharing.decision_type==='approve-shared-geometry' && Array.isArray(sharing.identities_or_states) && [prior,identity||state].every(x=>sharing.identities_or_states.includes(x));
      if(!approved) throw new IntakeError('UNDECLARED_SHARED_GEOMETRY',`Identical geometry was submitted for ${prior} and ${identity||state} without approved sharing.`);
    }
    seenGeometry.set(audit.geometry_signature_sha256,identity||state);
    if(!isOverlay) for(const entry of manifest.identities){if(entry.canonical_identity===identity||!entry.candidate_path)continue;const installed=await readFile(path.join(path.dirname(manifestPath),entry.candidate_path),'utf8');const installedAudit=auditSvg(installed);if(installedAudit.geometry_signature_sha256===audit.geometry_signature_sha256){const approved=sharing&&sharing.decision_type==='approve-shared-geometry'&&sharing.identities_or_states?.includes(identity)&&sharing.identities_or_states?.includes(entry.canonical_identity);if(!approved)throw new IntakeError('UNDECLARED_SHARED_GEOMETRY',`Geometry duplicates installed identity ${entry.canonical_identity} without approved sharing.`);}}
    const slug=identity||state;
    const renderDir=path.join(outputDirectory,slug,'renders'); await mkdir(renderDir,{recursive:true});
    await writeFile(path.join(outputDirectory,slug,'candidate.svg'),source,'utf8');
    const comparisons=await rasterEvidence(source,submission.reference,renderDir,slug);
    let externalApproval=null;
    if(approvalRecord){
      externalApproval=JSON.parse(await readFile(approvalRecord,'utf8'));
      if(externalApproval.candidate_sha256!==audit.raw_sha256||externalApproval.source_path!==finalPath||externalApproval.reference_package_hash!==referencePackageHash)throw new IntakeError('STALE_APPROVAL','Approval record hash, path, or package hash does not match this candidate.');
      const confirmations=['geometry','whitespace','scale','position','proportions','strokes'];
      const expectedRecordType=isOverlay?'overlay-approval':'master-approval';
      const allowedDecisions=isOverlay?['approve-static-overlay','replace-approved-overlay']:['approve-new-static-master','approve-failed-equivalence-candidate','approve-existing-repository-source','replace-approved-master'];
      const identityMatches=isOverlay?externalApproval.state===state:externalApproval.identity===identity;
      const zOrderMatches=!isOverlay||externalApproval.z_order===submission.zOrder;
      const signature=externalApproval.signature;
      if(externalApproval.record_type!==expectedRecordType||!identityMatches||!zOrderMatches||!allowedDecisions.includes(externalApproval.decision_type)||!externalApproval.approving_authority||!/^\d{4}-\d{2}-\d{2}$/.test(externalApproval.approval_date||'')||!GIT_SHA.test(externalApproval.baseline_commit||'')||!signature?.algorithm||!signature?.key_id||!SHA.test(signature?.signed_payload_sha256||'')||!signature?.value||externalApproval.no_fallback_or_runtime_fitting_authorized!==true||!confirmations.every(key=>externalApproval.geometry_confirmation?.[key]===true))throw new IntakeError('INVALID_EXTERNAL_APPROVAL','Approval record is incomplete, mismatched, or does not explicitly approve every preservation property.');
    }
    const report={kind:isOverlay?'overlay':'master',identity,state,display_name:display,manifest_status:status,submitted_file:slash(path.resolve(submission.file)),required_final_path:finalPath,declared_z_order:submission.zOrder||null,source_audit:audit,raster_comparisons:comparisons,structurally_valid:true,externally_approved:Boolean(externalApproval),approval_status:externalApproval?'external-record-present-review-still-required':'awaiting-explicit-external-approval',decision_required:isOverlay?`Approve or reject ${state} overlay ${audit.raw_sha256} for ${finalPath}; structural or raster results do not constitute approval.`:`Approve or reject ${identity} candidate ${audit.raw_sha256} for ${finalPath}; structural or raster results do not constitute approval.`};
    await writeFile(path.join(outputDirectory,slug,'report.json'),JSON.stringify(report,null,2)+'\n'); reports.push(report);
  }
  const consolidated={schema:'relphi-canonical-source-intake/v1',production_package_modified:false,review_only:true,submissions:reports};
  await writeFile(path.join(outputDirectory,'report.json'),JSON.stringify(consolidated,null,2)+'\n');
  return consolidated;
}

function args(argv){const out={identity:[],overlay:[],file:[],reference:[],zOrder:[]};for(let i=0;i<argv.length;i++){const key=argv[i];if(!key.startsWith('--'))continue;const name=key.slice(2);if(['replacement-review'].includes(name)){out.replacementReview=true;continue;}const value=argv[++i];if(['identity','overlay','file','reference','z-order'].includes(name)){const target=name==='z-order'?'zOrder':name;out[target].push(value);}else out[name]=value;}return out;}

async function main(){const a=args(process.argv.slice(2));if(!a.output)throw new IntakeError('OUTPUT_REQUIRED','--output is required.');if(a.file.length!==(a.identity.length+a.overlay.length))throw new IntakeError('ARGUMENT_MISMATCH','Provide one --file per --identity/--overlay.');const submissions=[];let cursor=0;for(const identity of a.identity)submissions.push({identity,file:a.file[cursor],reference:a.reference[cursor++]});for(let i=0;i<a.overlay.length;i++)submissions.push({overlay:a.overlay[i],file:a.file[cursor],reference:a.reference[cursor],zOrder:a.zOrder[i]});const result=await intake({manifestPath:a.manifest||'assets/canonical-glyphs/v1/manifest.json',submissions,outputDirectory:a.output,replacementReview:a.replacementReview,sharingApproval:a['sharing-approval'],approvalRecord:a.approval});console.log(JSON.stringify(result,null,2));}

if(path.resolve(process.argv[1]||'')===fileURLToPath(import.meta.url))main().catch(error=>{console.error(JSON.stringify({valid:false,code:error.code||'INTAKE_FAILED',message:error.message,details:error.details||{}},null,2));process.exit(1);});
