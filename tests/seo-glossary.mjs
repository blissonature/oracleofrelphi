// Run from the repository root: node tests/seo-glossary.mjs
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const files=['astrology-glossary.html','transiting-uranus-retrograde-opposite-part-of-fortune.html','glossary-stubs.html'];
const sitemap=readFileSync(resolve(root,'sitemap.xml'),'utf8');
const home=readFileSync(resolve(root,'index.html'),'utf8');
const nav=readFileSync(resolve(root,'nav.html'),'utf8');
const robots=readFileSync(resolve(root,'robots.txt'),'utf8');
for(const file of files){
 const html=readFileSync(resolve(root,file),'utf8');
 const canonical='https://oracleofrelphi.com/'+file;
 assert.match(html,/<html lang="en">/);
 assert.match(html,/<main class="reference-shell">/);
 assert.match(html,/<h1\b[^>]*>[\s\S]*?<\/h1>/);
 assert.match(html,/<title>[^<]{20,}<\/title>/);
 assert.match(html,/<meta name="description" content=".{50,}">/);
 assert.match(html,/<meta name="robots" content="noindex/);
 if(file!=='glossary-stubs.html')assert.ok(html.includes('<link rel="canonical" href="'+canonical+'">'));
 assert.ok(!sitemap.includes('<loc>'+canonical+'</loc>'),'Draft page must not appear in sitemap');
 assert.ok(!/<meta name="robots" content="index,follow/.test(html),'Draft pages cannot be indexable');
 const matches=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
 if(file!=='glossary-stubs.html'){
 assert.equal(matches.length,1,'One server-present JSON-LD script');
 const data=JSON.parse(matches[0][1]);
 assert.ok(data.some(item=>item['@type']==='BreadcrumbList'));
 }else assert.equal(matches.length,0,'Workbench needs no structured data');
 for(const href of html.matchAll(/\bhref="([^"#?]+)(?:#[^"]*)?"/g)){
   if(/^(https?:|mailto:)/.test(href[1])) continue;
   assert.ok(existsSync(resolve(root,href[1])),file+' broken local link '+href[1]);
 }
}
assert.match(home,/href="astrology-glossary.html"/);
assert.match(nav,/href="astrology-glossary.html"/);
assert.match(robots,/Sitemap: https:\/\/oracleofrelphi.com\/sitemap.xml/);
assert.ok(!sitemap.includes('sky-chart.html'),'Do not place the noindex Sky Chart in sitemap');
console.log('Glossary draft visibility checks passed (noindex, metadata, JSON-LD, links and sitemap exclusion).');
