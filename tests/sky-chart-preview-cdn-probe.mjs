import assert from 'node:assert/strict';
const ref=process.env.PREVIEW_REF;
assert.match(ref||'',/^[0-9a-f]{40}$/);
const origins=[
 ['statically',`https://cdn.statically.io/gh/blissonature/oracleofrelphi@${ref}/`],
 ['jsdelivr',`https://cdn.jsdelivr.net/gh/blissonature/oracleofrelphi@${ref}/`],
 ['rawgithub',`https://raw.githubusercontent.com/blissonature/oracleofrelphi/${ref}/`],
];
const assets=['sky-chart-where-when-v3.js','sky-chart-foundation-v1.css','relphi-icons.svg'];
for(const [provider,base] of origins){
 for(const asset of assets){
  const url=base+asset;
  try{
   const response=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(12000)});
   const bytes=await response.arrayBuffer();
   const contentType=response.headers.get('content-type');
   console.log('PROBE',JSON.stringify({provider,asset,status:response.status,type:contentType,size:bytes.byteLength,finalUrl:response.url,preview:new TextDecoder().decode(bytes.slice(0,60))}));
  }catch(err){console.log('PROBE_ERROR',JSON.stringify({provider,asset,error:String(err)}))}
 }
}
