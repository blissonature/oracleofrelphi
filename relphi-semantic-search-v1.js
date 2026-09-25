// Shared semantic-search primitives for Relphi surfaces.
(function(){
'use strict';
if(window.RelphiSemanticSearch)return;

function normalize(value){
  return String(value??'')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[“”]/g,'"')
    .replace(/[‘’]/g,"'")
    .replace(/[_./-]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function flatten(value,out=[],depth=0){
  if(depth>6||value==null)return out;
  if(typeof value==='string'||typeof value==='number'||typeof value==='boolean'){out.push(String(value));return out}
  if(Array.isArray(value)){value.forEach(item=>flatten(item,out,depth+1));return out}
  if(typeof value==='object'){
    Object.entries(value).forEach(([key,item])=>{out.push(String(key));flatten(item,out,depth+1)});
  }
  return out;
}
function corpus(){
  const parts=[];
  Array.from(arguments).forEach(value=>flatten(value,parts));
  return normalize(parts.join(' '));
}
function terms(value){
  return normalize(value).split(/\s+/).filter(Boolean);
}
function matches(corpusValue,query){
  const haystack=normalize(corpusValue),needles=terms(query);
  return !needles.length||needles.every(term=>haystack.includes(term));
}
window.RelphiSemanticSearch=Object.freeze({normalize,flatten,corpus,terms,matches});
})();