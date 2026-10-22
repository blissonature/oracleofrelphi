// Verify all 21x21 pairing pages are genuinely static, internally linked, and indexable after approval.
// Intended for GitHub Actions; no web access is required.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const builder=vm.runInNewContext(read('tools/build-astrology-pairs.mjs')+'\nRelphiPairBuilder;',{}, {filename:'tools/build-astrology-pairs.mjs'});
const catalog=vm.runInNewContext(read('glossary-stub-catalog.js')+'\nRelphiGlossaryStubCatalog;',{}, {filename:'glossary-stub-catalog.js'});
assert.equal(builder.placements.length,21);
assert.equal(builder.aspects.length,11);
assert.equal(builder.placements.length*builder.placements.length,441);
assert.deepEqual(Array.from(builder.placements,x=>x.id),Array.from(catalog.placements,x=>x.id));
assert.deepEqual(Array.from(builder.aspects,x=>x.id),Array.from(catalog.aspects,x=>x.id));
const urls=new Set(),metas=new Set();
for(const source of builder.placements){
 for(const target of builder.placements){
 const path=builder.file(source.id,target.id),html=read(path),url='https://oracleofrelphi.com/'+path;
 assert.equal(html,builder.page(source.id,target.id),path+' not reproducible');
 assert.ok(html.includes('<meta name="robots" content="index,follow">'),path+' missing index directive');
 assert.ok(!html.includes('noindex'),path+' unexpectedly noindex');
 assert.ok(html.includes('<link rel="canonical" href="'+url+'">'),path+' canonical mismatch');
 assert.ok(html.includes('data-pair-source="'+source.id+'"'));
 assert.ok(html.includes('data-pair-target="'+target.id+'"'));
 assert.ok(html.includes('<base href="../../">'),'Preview-relative assets are necessary');
 assert.ok(html.includes('Transiting '+source.name+' aspect natal '+target.name));
 assert.ok(html.includes('Natal '+source.name+' aspect '+target.name));
 assert.ok(html.includes('astrology-pair-interactions.js'));
 assert.ok(html.includes('All 11 aspects'));
 assert.equal((html.match(/<li><a href="astrology\/pairs\//g)||[]).length,11,path+' must have all 11 aspect anchors');
 const jsonld=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
 assert.ok(jsonld);
 const data=JSON.parse(jsonld[1]);
 assert.ok(data.some(x=>x['@type']==='DefinedTerm'));
 const title=html.match(/<title>(.*?)<\/title>/)?.[1];
 assert.ok(title,'missing title '+path);
 assert.ok(!metas.has(title),'repeated title '+title);metas.add(title);
 assert.ok(!urls.has(url),'duplicate URL');urls.add(url);
 }
}
const index=read('astrology-pairs.html');
assert.equal(index,builder.directory());
for(const url of urls)assert.ok(builder.sitemap().includes('<loc>'+url+'</loc>'),url+' not in sitemap');
assert.equal(read('sitemap.xml'),builder.sitemap());
assert.equal((index.match(/class="pair-link"/g)||[]).length,441,'Directory must link every page without JavaScript');
assert.ok(index.includes('<meta name="robots" content="index,follow">'));
assert.ok(read('index.html').includes('href="astrology-pairs.html"'),'Home should link to directory');
assert.ok(read('astrology-glossary.html').includes('href="astrology-pairs.html"'),'Glossary should link to directory');
assert.ok(read('glossary-stubs.html').includes('name="robots" content="noindex'),'Full combinatorial workbench stays private from indexing');
assert.ok(!read('sitemap.xml').includes('<loc>https://oracleofrelphi.com/glossary-stubs.html</loc>'));
assert.ok(!read('sitemap.xml').includes('<loc>https://oracleofrelphi.com/astrology-glossary.html</loc>'));
console.log('Passed: 441 crawlable, reproducible pair pages, unique canonicals/titles, 11 aspect links each, static directory, and sitemap; draft workbench remains noindex.');
