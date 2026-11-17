import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const source=fs.readFileSync(path.join(root,'sky-chart-preview/sky-chart.html'),'utf8');
const original=fs.readFileSync(path.join(root,'sky-chart.html'),'utf8');
const match=source.match(/<script>([\s\S]*?)<\/script>/i);
assert.ok(match,'Preview loader must retain exactly one executable inline script');
assert.equal([...source.matchAll(/<\/script>/gi)].length,1,'Loader must not close its own script prematurely');
const scripts=[...original.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi)]
  .map(entry=>entry[1]).filter(src=>!/^https?:/i.test(src));
const styles=[...original.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi)]
  .map(entry=>entry[0].match(/\bhref=["']([^"']+)["']/i)?.[1]).filter(Boolean)
  .filter(href=>!/^https?:/i.test(href));
assert.ok(scripts.length>100,'Exercise real multi-script Sky Chart dependency graph');
const commit='a'.repeat(40),prefix='https://raw.githubusercontent.com/blissonature/oracleofrelphi/'+commit+'/';
const status={textContent:''};
const doc={written:null,opened:false,closed:false,
  getElementById(id){return id==='previewStatus'?status:null},
  open(){this.opened=true},write(html){this.written=html},close(){this.closed=true}};
const fakeFetch=async uri=>{
  const url=String(uri);
  if(!url.startsWith(prefix))throw new Error('Unexpected dependency host: '+url);
  const relative=decodeURIComponent(url.slice(prefix.length).split('?')[0]);
  if(relative.includes('..')||relative.startsWith('/'))throw new Error('Unsafe dependency path');
  const filename=path.join(root,relative);
  if(!fs.existsSync(filename))return{ok:false,status:404,text:async()=>''};
  return{ok:true,status:200,text:async()=>fs.readFileSync(filename,'utf8')};
};
const context={document:doc,location:{search:'?ref='+commit},URLSearchParams,URL,AbortSignal,
  fetch:fakeFetch,console,Math,Promise,Array,Map,RegExp,Error,Date,String};
await vm.runInNewContext(match[1],context,{timeout:2000});
assert.equal(status.textContent,'','All local dependencies must be resolvable');
assert.equal(doc.opened,true,'Loader replaces preview shell');
assert.equal(doc.closed,true,'Loader completes the replacement document');
const html=doc.written||'';
assert.equal([...html.matchAll(/<style data-preview-css=/g)].length,styles.length,'Every local stylesheet is embedded');
assert.equal([...html.matchAll(/<script data-preview-js=/g)].length,scripts.length,'Every local script is embedded');
for(const item of scripts)assert.ok(html.includes('data-preview-js="'+item+'"'),'Missing source '+item);
assert.ok(html.indexOf('data-preview-js="'+scripts[0]+'"')<html.indexOf('data-preview-js="'+scripts.at(-1)+'"'),
  'The first/last script execution order must match the application');
// Scripts can legitimately contain literal <script src=...> examples in their own source.
// The preceding data-preview-js identities validate each replaced executable dependency.
assert.ok(html.includes('<base href="https://cdn.statically.io/gh/'),'Commit-specific base remains available for dynamic resources');
console.log('PASS preview loader bundled',styles.length,'CSS files and',scripts.length,'ordered local scripts from exact commit');
