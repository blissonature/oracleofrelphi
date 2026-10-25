// Explicitly export a SMALL, filtered subset of draft JSON stubs.
// Examples:
// node tools/glossary-stub-batch.mjs --count
// node tools/glossary-stub-batch.mjs --source=uranus --aspect=opposition --target=part-of-fortune --sourceSign=gemini --targetSign=sagittarius --sourceHouse=10 --targetHouse=3 --sourceRx=1 --limit=1
// Add --out=./drafts/uranus-example.json to save; never writes HTML/sitemaps.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const context=vm.createContext({URLSearchParams});
vm.runInContext(readFileSync(resolve(root,'glossary-stub-catalog.js'),'utf8'),context);
const catalog=context.RelphiGlossaryStubCatalog;
const raw={};
for(const token of process.argv.slice(2)){
 const match=/^--([a-zA-Z]+)(?:=(.*))?$/.exec(token);
 if(!match)throw new Error('Use --name=value options');
 raw[match[1]]=match[2]??'1';
}
if(raw.count){console.log(catalog.count().toLocaleString('en-US')+' theoretical base combinations (no Rx flags)');process.exit(0);}
const {out,limit:rawLimit,...filter}=raw;
for(const key of Object.keys(filter))if(!['scope','source','aspect','target','sourceSign','sourceHouse','targetSign','targetHouse','sourceRx','targetRx'].includes(key))throw new Error('Unknown filter: '+key);
if(out&&!['source','aspect','target'].every(key=>filter[key]))throw new Error('Saving requires explicit --source, --aspect, --target to avoid enormous vague batches.');
const limit=rawLimit===undefined?20:Number(rawLimit);
const data=Array.from(catalog.enumerate({filter,limit}));
const json=JSON.stringify({schemaVersion:1,generatedStatus:'unpublished-stubs',records:data},null,2)+'\n';
if(out){
 const path=resolve(process.cwd(),out);
 mkdirSync(dirname(path),{recursive:true});writeFileSync(path,json,'utf8');
 console.log('Wrote '+data.length+' unindexed draft stubs to '+path);
}else{process.stdout.write(json);}
