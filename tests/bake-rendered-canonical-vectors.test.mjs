import assert from 'node:assert/strict';
import { access, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';

import {
  bakeCapturedSvg,
  compareSvgPair,
  equivalencePassed,
  parseXml,
  transformPathData,
  writeCandidateAfterEquivalence
} from '../tools/bake-rendered-canonical-vectors.mjs';

const require=createRequire(import.meta.url);
const sharp=require('sharp');

const ring='<circle cx="0" cy="0" r="19" fill="#fff" stroke="#111111" stroke-width="2.35" aria-hidden="true" style="opacity: 0;"></circle>';
const vectorCapture=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-32 -32 64 64" aria-label="Fixture"><g class="relphi-glyph-bubble">${ring}<g class="relphi-canonical-glyph" transform="translate(2 3) scale(0.5)"><path d="M-10 -10L10 -10L10 10L-10 10Z" fill="none" stroke="#111111" stroke-width="2"/></g></g></svg>`;
const vectorPlain=vectorCapture.replace(ring,'');

test('rejects text and font-backed visible artwork',()=>{
  const source=`<svg viewBox="-32 -32 64 64"><g class="relphi-glyph-bubble">${ring}<text class="relphi-canonical-glyph" font-family="Arial">Asc</text></g></svg>`;
  const result=bakeCapturedSvg(source,{identity:'asc',name:'Ascendant'});
  assert.equal(result.status,'blocked-font-or-text');
  assert.match(result.blocker,/text|font/i);
});

test('rejects unsupported clipping features',()=>{
  const source=`<svg viewBox="-32 -32 64 64"><g class="relphi-glyph-bubble">${ring}<g class="relphi-canonical-glyph" clip-path="url(#crop)"><path d="M0 0L1 1"/></g></g></svg>`;
  const result=bakeCapturedSvg(source,{identity:'blocked',name:'Blocked'});
  assert.equal(result.status,'blocked-unsupported-vector-feature');
});

test('flattens transforms, emits exact canvas, and scales stroke width proportionally',()=>{
  const result=bakeCapturedSvg(vectorCapture,{identity:'fixture',name:'Fixture'});
  assert.equal(result.status,'exact-static-candidate');
  assert.match(result.output,/viewBox="0 0 100 100"/);
  assert.doesNotMatch(result.output,/\btransform=|<text\b|\bfont/i);
  assert.match(result.output,/stroke-width="1\.5625"/);
  assert.deepEqual(result.transforms,['translate(2 3) scale(0.5)']);
});

test('ring conversion is independently calculated exactly',()=>{
  const source=`<svg viewBox="-32 -32 64 64">${ring.replace(' style="opacity: 0;"','')}</svg>`;
  const result=bakeCapturedSvg(source,{identity:'state:circled',name:'Circled backplate',removeRing:false});
  assert.equal(result.status,'exact-static-candidate');
  const root=parseXml(result.output);
  const circle=root.children.find(node=>node.name==='circle');
  assert.equal(circle.attributes.cx,'50');
  assert.equal(circle.attributes.cy,'50');
  assert.equal(circle.attributes.r,'29.6875');
  assert.equal(circle.attributes['stroke-width'],'3.671875');
});

test('output bytes are deterministic',()=>{
  const first=bakeCapturedSvg(vectorCapture,{identity:'fixture',name:'Fixture'});
  const second=bakeCapturedSvg(vectorCapture,{identity:'fixture',name:'Fixture'});
  assert.equal(first.output,second.output);
});

test('zero-difference raster proof retains bounds and whitespace',async()=>{
  const result=bakeCapturedSvg(vectorCapture,{identity:'fixture',name:'Fixture'});
  const comparisons=await compareSvgPair(sharp,vectorPlain,result.output,[100,400,1000],[1,2]);
  assert.equal(comparisons.length,6);
  assert.equal(equivalencePassed(comparisons),true);
  for(const comparison of comparisons){
    assert.equal(comparison.differingPixels,0);
    assert.deepEqual(comparison.firstVisibleBounds,comparison.secondVisibleBounds);
    assert.ok(comparison.firstVisibleBounds.x>0&&comparison.firstVisibleBounds.y>0,'expected preserved outer whitespace');
  }
});

test('path coordinate conversion is deterministic and removes relative commands',()=>{
  const output=transformPathData('M0 0h10v10h-10z',[1.5625,0,0,1.5625,50,50]);
  assert.equal(output,'M50 50L65.625 50L65.625 65.625L50 65.625Z');
});

test('Neptune retains the complete connected trident as one path',async()=>{
  const neptuneRing=ring.replace('style="opacity: 0;"','style="opacity: 0;"');
  const neptunePath='<path d="M12 17L17 11L22 17M17 11V34C17 49 29 60 44 62H56C71 60 83 49 83 34V11M78 17L83 11L88 17M45 17L50 11L55 17M50 11V88M37 75H63" fill="none" stroke="#111111" stroke-width="6.4" stroke-linecap="round" stroke-linejoin="round" style="opacity: 1;"></path>';
  const source=`<svg viewBox="-32 -32 64 64" aria-label="Neptune"><g class="relphi-glyph-bubble">${neptuneRing}<g class="relphi-canonical-glyph" transform="translate(0 1.3) scale(0.28701701344882896) translate(-50 -49.5)">${neptunePath}</g></g></svg>`;
  const result=bakeCapturedSvg(source,{identity:'neptune',name:'Neptune'});
  assert.equal(result.status,'exact-static-candidate');
  assert.equal(result.geometryElementCount,1);
  assert.equal((result.output.match(/<path\b/g)||[]).length,1);
  assert.equal((result.output.match(/M/g)||[]).length,6);
  assert.match(result.output,/57\.63705104392244L52\.690784501082774 57\.63705104392244/);
  const comparisons=await compareSvgPair(sharp,source.replace(neptuneRing,''),result.output,[100,400,1000],[1,2]);
  assert.equal(equivalencePassed(comparisons),true);
});

test('failed equivalence removes any stale candidate and emits nothing',async()=>{
  const directory=await mkdtemp(path.join(os.tmpdir(),'relphi-bake-test-'));
  const candidate=path.join(directory,'candidate.svg');
  try{
    await writeFile(candidate,'stale','utf8');
    const written=await writeCandidateAfterEquivalence(candidate,'new',[{differingPixels:1,firstVisibleBounds:null,secondVisibleBounds:null}]);
    assert.equal(written,false);
    await assert.rejects(access(candidate));
  }finally{
    await rm(directory,{recursive:true,force:true});
  }
});
