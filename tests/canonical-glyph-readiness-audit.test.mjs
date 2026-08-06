import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root=path.resolve(import.meta.dirname,'..'),pkg=path.join(root,'assets/canonical-glyphs/v1');
const manifest=JSON.parse(fs.readFileSync(path.join(pkg,'manifest.json'),'utf8'));
const tracked=execFileSync('git',['ls-files'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');

test('production code does not import dormant loader prototype',()=>{const offenders=[];for(const rel of tracked.filter(x=>/\.(?:html|m?js)$/.test(x)&&!x.startsWith('review/')&&!x.startsWith('tests/'))){if(fs.readFileSync(path.join(root,rel),'utf8').includes('canonical-glyph-loader-prototype'))offenders.push(rel);}assert.deepEqual(offenders,[]);});
test('only the static preview and unreferenced v1 loader consume the package outside review tooling',()=>{const consumers=[];for(const rel of tracked.filter(x=>/\.(?:html|m?js)$/.test(x)&&!x.startsWith('review/')&&!x.startsWith('tests/')&&!x.startsWith('tools/')&&!x.startsWith('assets/'))){const source=fs.readFileSync(path.join(root,rel),'utf8');if(source.includes('assets/canonical-glyphs/v1'))consumers.push(rel);}assert.deepEqual(consumers,['canonical-glyphs-v1-preview.html','relphi-canonical-glyph-loader-v1.js']);const activeImports=[];for(const rel of tracked.filter(x=>/\.(?:html|m?js)$/.test(x)&&!x.startsWith('review/')&&!x.startsWith('tests/')&&x!=='relphi-canonical-glyph-loader-v1.js')){if(fs.readFileSync(path.join(root,rel),'utf8').includes('relphi-canonical-glyph-loader-v1.js'))activeImports.push(rel);}assert.deepEqual(activeImports,[]);});
test('blocked identities have no path, hash, Unicode, font, or shared fallback',()=>{const blocked=manifest.identities.filter(x=>!x.candidate_path);assert.equal(blocked.length,55);assert.equal(blocked.filter(x=>x.status==='blocked-font-or-text').length,54);assert.deepEqual(blocked.filter(x=>x.status==='failed-pixel-equivalence').map(x=>x.canonical_identity),['moon']);for(const entry of blocked){assert.equal(entry.candidate_path,null);assert.equal(entry.candidate_sha256,null);assert.ok(!('fallback' in entry));assert.doesNotMatch(JSON.stringify(entry),/unicode|font-family|shared fallback/i);}});
test('no generated intake review output is committed',()=>{assert.deepEqual(tracked.filter(x=>/(?:^|\/)(?:incoming|intake-output|candidate-renders|consolidated-intake-report)(?:\/|$)/i.test(x)),[]);assert.ok(tracked.every(x=>!x.startsWith('outputs/')));});
test('no unavailable ruler overlay exists without approval',()=>{for(const state of ['day-ruler','hour-ruler','day-and-hour-ruler']){const row=manifest.states.find(x=>x.state===state);assert.equal(row.overlay_path,null);assert.equal(row.sha256,null);assert.equal(fs.existsSync(path.join(pkg,'overlays',`${state}.svg`)),false);}});
test('every installed file still matches the reviewed hash lock',()=>{for(const entry of manifest.identities.filter(x=>x.candidate_path))assert.equal(sha(path.join(pkg,entry.candidate_path)),entry.candidate_sha256,entry.canonical_identity);for(const state of manifest.states.filter(x=>x.overlay_path))assert.equal(sha(path.join(pkg,state.overlay_path)),state.sha256,state.state);});
