const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','sky-chart-intrasky-a-v1.js'),'utf8');
const legacy=fs.readFileSync(path.join(__dirname,'..','sky-chart-intrasky-relationships-v1.js'),'utf8');
const single=fs.readFileSync(path.join(__dirname,'..','sky-chart-single-sky-aspects-v1.js'),'utf8');

test('active intrasky generator deduplicates placement aliases by canonical id',()=>{
 assert.match(source,/records\.findIndex\(other=>other\.id===record\.id\)===index/);
 assert.match(legacy,/records\.findIndex\(other=>other\.id===record\.id\)===index/);
 assert.match(single,/records\.findIndex\(other => other\.id === record\.id\) === index/);
});
test('all intrasky relationship paths reject same-id endpoints, even if represented twice',()=>{
 assert.equal((source.match(/left\.id===right\.id\|\|redundantPair\(left\.id,right\.id\)/g)||[]).length,2);
 assert.equal((legacy.match(/left\.id===right\.id\|\|redundantPair\(left\.id,right\.id\)/g)||[]).length,2);
 assert.match(single,/if \(left\.id === right\.id\) continue;/);
});
