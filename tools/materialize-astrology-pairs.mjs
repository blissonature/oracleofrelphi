// Deterministically rebuild 441 static placement-pair HTML pages, their directory, and sitemap.
// Run: node tools/materialize-astrology-pairs.mjs --check (default) or --write
// Do not automatically publish/merge the generated files.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const generator=readFileSync(resolve(root,'tools/build-astrology-pairs.mjs'),'utf8');
const builder=vm.runInNewContext(generator+'\nRelphiPairBuilder;',{}, {filename:'tools/build-astrology-pairs.mjs'});
const write=process.argv.includes('--write');
const check=process.argv.includes('--check')||!write;
const targets=[];
for(const a of builder.placements)for(const b of builder.placements)targets.push([builder.file(a.id,b.id),builder.page(a.id,b.id)]);
targets.push(['astrology-pairs.html',builder.directory()]);
targets.push(['sitemap.xml',builder.sitemap()]);
let changed=0;
for(const [name,content] of targets){
 const dest=resolve(root,name);
 if(write){mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,content,'utf8');changed++;}
 else if(check){assert.equal(readFileSync(dest,'utf8'),content,name+' differs from the generator; regenerate and review before committing');changed++;}
}
console.log((write?'Materialized ':'Verified ')+(changed-2)+' index-ready static pair pages plus the directory and sitemap.');
