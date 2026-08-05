import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const APPROVED_PAGE='https://oracleofrelphi.com/glyphs-unified-preview.html';
const APPROVED_COMMIT='047fd8a7bf764e285dcb6ae012048a965840ea39';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.resolve(root,process.argv[2]||'glyph-canon-source-audit.json');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'glyph-canon-approved-source-manifest.json'),'utf8'));
const run=(args,input)=>execFileSync('git',args,{cwd:root,input,encoding:input===undefined?undefined:'utf8'});
const show=file=>run(['show',`${APPROVED_COMMIT}:${file}`]);
const blobSha=file=>run(['hash-object',file]).toString().trim();
const bufferBlob=buffer=>run(['hash-object','--stdin'],buffer).toString().trim();

function walk(directory,files=[]){
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
    if(['.git','node_modules'].includes(entry.name))continue;
    const absolute=path.join(directory,entry.name);
    if(entry.isDirectory())walk(absolute,files);
    else files.push(path.relative(root,absolute).replaceAll(path.sep,'/'));
  }
  return files;
}

const registrySource=show('relphi-glyph-registry-v1.js').toString('utf8');
const context={window:{},Object,Map,String};
vm.runInNewContext(registrySource,context,{filename:'relphi-glyph-registry-v1.js'});
const entries=Array.from(context.window.RelphiGlyphRegistry.entries,entry=>({
  id:entry.id,name:entry.name,aliases:Array.from(entry.aliases),asset:entry.asset??null,
  fallback:entry.fallback??null,scale:entry.scale,dx:entry.dx,dy:entry.dy,
  fitMode:entry.fitMode??null,fontWeight:entry.fontWeight??null
}));

const runtimeFiles=[
  'relphi-glyph-registry-v1.js','relphi-glyph-component-v1.js',
  ...new Set(entries.map(entry=>entry.asset).filter(Boolean))
];

const equality=runtimeFiles.map(file=>{
  const currentPath=path.join(root,file);
  const exists=fs.existsSync(currentPath);
  const currentBlob=exists?blobSha(file):null;
  const manifestBlob=manifest.runtime_files[file]||null;
  let permanentBlob=null;
  try{permanentBlob=bufferBlob(show(file));}catch{}
  const explicitlyRevised=!!manifestBlob&&!!permanentBlob&&manifestBlob!==permanentBlob;
  return{
    file,exists,currentBlob,manifestBlob,permanentBlob,explicitlyRevised,
    source:explicitlyRevised?'approved-runtime-manifest':APPROVED_COMMIT,
    equal:exists&&currentBlob===manifestBlob&&(
      explicitlyRevised||Buffer.compare(show(file),fs.readFileSync(currentPath))===0
    )
  };
});

const allFiles=walk(root);
const sourceFiles=allFiles.filter(file=>/\.(?:js|mjs|html)$/.test(file));
const productionSourceFiles=sourceFiles.filter(file=>!file.startsWith('tests/')&&!file.startsWith('scripts/'));
const permanentPageSupport=new Set(['glyphs-unified-preview.html','relphi-moon-stroke-preservation-v1.js','relphi-neptune-cross-connection-v1.js']);
const genericConsumers=productionSourceFiles.filter(file=>{
  if(permanentPageSupport.has(file))return false;
  return /RelphiGlyphRegistry|RelphiGlyphComponent/.test(fs.readFileSync(path.join(root,file),'utf8'));
});

const forbiddenFiles=[
  'relphi-glyph-canon-binding-v1.js','relphi-glyph-atomic-loader-v1.js','relphi-glyph-component-e9344099.js',
  'sky-chart-angle-glyph-fit-v1.js','sky-chart-canonical-glyph-correction-v1.js','sky-chart-canonical-relationship-ui-v1.js',
  'sky-chart-glyph-framing-v1.js','sky-chart-glyph-size-guard-v1.js','sky-chart-live-integrity-v1.js',
  'sky-chart-r31-finalize-v1.js','sky-chart-extra-points-support-v1.js','sky-chart-wheel-canonical-component-v1.js',
  'sky-chart-wheel-e9344099-canonical-master-v1.js','sky-chart-wheel-glyph-preview-fixes-v1.js',
  'sky-chart-wheel-glyph-preview-tuning-v1.js','sky-chart-wheel-glyph-preview-v1.js',
  'sky-chart-wheel-marker-interaction-v1.js','sky-chart-wheel-solid-hover-v1.js',
  'sky-chart-wheel-unified-marker-renderer-v1.js','sky-chart-wheel-unified-marker-renderer-v2.js',
  'sky-chart-wheel-unified-marker-renderer-v3.js','sky-chart-wheel-unified-marker-renderer-v4.js',
  'sky-chart-wheel-unified-marker-renderer-v5.js','sky-chart-wheel-unified-marker-renderer-v6.js',
  'sky-chart-wheel-special-points-final-v1.js','sky-chart-special-point-polish-v1.js',
  'sky-chart-special-point-source-normalizer-v1.js','sky-chart-special-point-static-v1.js',
  'sky-chart-special-vector-color-v1.js','sky-chart-comparison-glyph-scale-v1.js','sky-chart-ph-glyph-style-v1.js'
];
const forbiddenSkyScripts=['relphi-moon-stroke-preservation-v1.js','relphi-neptune-cross-connection-v1.js',...forbiddenFiles];
const skyConsumers=['sky-chart.html','part1/sky-chart.html','part2/sky-chart.html','glyphs.html','navloader.js']
  .filter(file=>fs.existsSync(path.join(root,file)));

const forbiddenPresent=forbiddenFiles.filter(file=>fs.existsSync(path.join(root,file)));
const angleAssetFiles=allFiles.filter(file=>file.startsWith('assets/angle-glyphs/'));
const definitionViolations=[];
const mutationViolations=[];
const geometryViolations=[];
const staleReferences=[];
const consumerReferenceViolations=[];

for(const file of productionSourceFiles){
  if(['relphi-glyph-registry-v1.js','relphi-glyph-component-v1.js'].includes(file)||permanentPageSupport.has(file))continue;
  const text=fs.readFileSync(path.join(root,file),'utf8');
  const usesRuntime=/RelphiGlyphRegistry|RelphiGlyphComponent/.test(text);
  if(/window\.RelphiGlyphRegistry\s*=|Object\.defineProperty\(window\s*,\s*['"]RelphiGlyphRegistry/.test(text))definitionViolations.push({file,global:'RelphiGlyphRegistry'});
  if(/window\.RelphiGlyphComponent\s*=|Object\.defineProperty\(window\s*,\s*['"]RelphiGlyphComponent/.test(text))definitionViolations.push({file,global:'RelphiGlyphComponent'});
  if(usesRuntime&&/\b(?:entry|registry\.get\([^)]*\))\.(?:asset|fallback|scale|dx|dy|fitMode|fontWeight|canonicalRotation)\s*=(?!=)/.test(text))mutationViolations.push(file);
  if(/\bVECTOR_GLYPHS\s*=|assets\/angle-glyphs\//.test(text)||(/\bPATHS\s*=/.test(text)&&/(glyph|marker|special-point)/i.test(file)))geometryViolations.push(file);
  forbiddenFiles.forEach(forbidden=>{if(text.includes(forbidden))staleReferences.push({file,forbidden});});
}
for(const file of skyConsumers){
  const text=fs.readFileSync(path.join(root,file),'utf8');
  forbiddenSkyScripts.forEach(forbidden=>{if(text.includes(forbidden))consumerReferenceViolations.push({file,forbidden});});
}

const componentText=fs.readFileSync(path.join(root,'relphi-glyph-component-v1.js'),'utf8');
const componentContractViolations=[];
if(!/const CANONICAL_BUBBLE_RADIUS = 19/.test(componentText))componentContractViolations.push('component does not define the approved 19-unit circled master');
if(!/const CANONICAL_BUBBLE_STROKE = 2\.35/.test(componentText))componentContractViolations.push('component does not define the approved circle stroke');
if(!/const scale = requestedRadius \/ CANONICAL_BUBBLE_RADIUS/.test(componentText))componentContractViolations.push('component does not uniformly scale the finished circled master');
if(!/circle\.setAttribute\('r', String\(CANONICAL_BUBBLE_RADIUS\)\)/.test(componentText))componentContractViolations.push('component constructs a noncanonical circle radius');
if(!/radius: CANONICAL_BUBBLE_RADIUS/.test(componentText)||!/bubbleStrokeWidth: CANONICAL_BUBBLE_STROKE/.test(componentText))componentContractViolations.push('component refits circled glyphs at the requested display radius');
if(/circle\.setAttribute\('r', String\(requestedRadius\)\)/.test(componentText))componentContractViolations.push('component substitutes requested radius for canonical bubble geometry');
if(!/canonicalBubblePresentation = 'uniform-master-scale'/.test(componentText))componentContractViolations.push('component does not mark uniform canonical master scaling');

const audit={
  generatedAt:new Date().toISOString(),
  approvedSource:{page:APPROVED_PAGE,commit:APPROVED_COMMIT,registry:'relphi-glyph-registry-v1.js',component:'glyph-canon-approved-source-manifest.json'},
  approvedRuntimeFiles:equality,
  entries:entries.map(entry=>({...entry,sourceCommit:APPROVED_COMMIT,sourcePage:APPROVED_PAGE,consumers:genericConsumers})),
  componentContractViolations,
  competingSources:{forbiddenFilesPresent:forbiddenPresent,angleAssetFiles,definitionViolations,mutationViolations,geometryViolations,staleReferences,consumerReferenceViolations}
};
fs.writeFileSync(output,JSON.stringify(audit,null,2)+'\n');

const failures=[
  ...equality.filter(item=>!item.equal).map(item=>`${item.file} does not match its approved source ${item.source}`),
  ...componentContractViolations,
  ...forbiddenPresent.map(file=>`forbidden competing file exists: ${file}`),
  ...angleAssetFiles.map(file=>`forged Angle asset exists: ${file}`),
  ...definitionViolations.map(item=>`${item.file} redefines ${item.global}`),
  ...mutationViolations.map(file=>`${file} mutates approved registry fields`),
  ...geometryViolations.map(file=>`${file} contains substitute glyph geometry`),
  ...staleReferences.map(item=>`${item.file} still references deleted competing source ${item.forbidden}`),
  ...consumerReferenceViolations.map(item=>`${item.file} loads non-Sky-Chart support script ${item.forbidden}`)
];
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}
else console.log(`Glyph consumer audit passed: ${entries.length} identities point to ${APPROVED_PAGE}; circled consumers uniformly scale the exact 19-unit canonical master.`);
