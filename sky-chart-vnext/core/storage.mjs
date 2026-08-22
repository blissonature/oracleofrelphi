import{normalizeName,normalizeSky,skySignature}from'./model.mjs';

export const LIBRARY_KEY='relphiSkyLibraryV1';
export const WORKSPACE_KEY='relphiSkyVNextWorkspaceV1';

const clone=value=>JSON.parse(JSON.stringify(value));
const readJson=(storage,key,fallback)=>{try{const raw=storage.getItem(key);return raw?JSON.parse(raw):fallback}catch{return fallback}};
const writeJson=(storage,key,value)=>{try{storage.setItem(key,JSON.stringify(value));return true}catch{return false}};

export function savedId(record){return String(record?.id||record?.savedSkyId||record?.metadata?.savedSkyId||'')}
export function readLibrary(storage=localStorage){
  const list=readJson(storage,LIBRARY_KEY,[]);
  return Array.isArray(list)?list.map(normalizeSky).filter(Boolean):[];
}
export function nameExists(name,records,exceptId=''){
  const wanted=normalizeName(name),except=String(exceptId||'');
  return records.some(record=>normalizeName(record.name)===wanted&&(!except||savedId(record)!==except));
}
export function suggestUniqueName(name,records){
  const base=String(name||'Sky').trim()||'Sky';
  if(!nameExists(base,records))return base;
  let index=2;
  while(nameExists(`${base} ${index}`,records))index++;
  return`${base} ${index}`;
}
function newId(){return`sky-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`}
function applyIdentity(payload,name,id){
  const next=normalizeSky(clone(payload));if(!next)return null;
  next.name=name;next.title=name;next.displayName=name;next.skyName=name;
  next.metadata={...(next.metadata||{}),savedSkyId:id,savedSkyName:name,savedSkyLoadedAt:new Date().toISOString()};
  next.calcProfile={...(next.calcProfile||{}),name,title:name};
  return next;
}
export function saveNewSky(payload,name,storage=localStorage){
  const records=readLibrary(storage),clean=String(name||'').trim();
  if(!normalizeSky(payload))return{ok:false,message:'There is no sky to save.'};
  if(!clean)return{ok:false,message:'Give this sky a name.'};
  if(nameExists(clean,records))return{ok:false,message:'That name is already in Saved skies.',suggestion:suggestUniqueName(clean,records)};
  const id=newId(),record=applyIdentity(payload,clean,id);record.id=id;record.savedAt=new Date().toISOString();record.updatedAt=record.savedAt;
  if(!writeJson(storage,LIBRARY_KEY,[...records,record]))return{ok:false,message:'Saved skies could not be written.'};
  return{ok:true,record,active:applyIdentity(payload,clean,id)};
}
export function updateSavedSky(payload,storage=localStorage){
  const records=readLibrary(storage),sky=normalizeSky(payload);if(!sky)return{ok:false,message:'There is no sky to save.'};
  const id=String(sky.metadata?.savedSkyId||''),index=records.findIndex(record=>savedId(record)===id);
  if(!id||index<0)return{ok:false,message:'This sky is not linked to a saved record.'};
  const name=String(sky.name||sky.metadata?.savedSkyName||'').trim();
  if(nameExists(name,records,id))return{ok:false,message:'That name is already in Saved skies.',suggestion:suggestUniqueName(name,records)};
  const record=applyIdentity(sky,name,id);record.id=id;record.savedAt=records[index].savedAt||new Date().toISOString();record.updatedAt=new Date().toISOString();
  const next=records.slice();next[index]=record;
  if(!writeJson(storage,LIBRARY_KEY,next))return{ok:false,message:'Saved skies could not be written.'};
  return{ok:true,record,active:applyIdentity(sky,name,id)};
}
export function isSavedSky(payload,storage=localStorage){
  const sky=normalizeSky(payload);if(!sky)return{saved:false,dirty:false,record:null};
  const id=String(sky.metadata?.savedSkyId||''),records=readLibrary(storage),record=records.find(item=>savedId(item)===id)||null;
  return{saved:!!record,dirty:!!record&&skySignature(sky)!==skySignature(record),record};
}
export function loadSavedSky(record){
  const id=savedId(record)||newId(),name=String(record?.name||'Saved sky').trim()||'Saved sky';
  return applyIdentity(record,name,id);
}
export function saveWorkspace(state,storage=sessionStorage){
  const compact={slots:{A:state?.slots?.A||null,B:state?.slots?.B||null},orb:Number(state?.orb||3),filters:state?.filters||null};
  return writeJson(storage,WORKSPACE_KEY,compact);
}
export function readWorkspace(storage=sessionStorage){
  const value=readJson(storage,WORKSPACE_KEY,null);if(!value||typeof value!=='object')return null;
  return{slots:{A:normalizeSky(value.slots?.A),B:normalizeSky(value.slots?.B)},orb:Number.isFinite(Number(value.orb))?Number(value.orb):3,filters:value.filters||null};
}
export function clearWorkspace(storage=sessionStorage){try{storage.removeItem(WORKSPACE_KEY)}catch{}}
