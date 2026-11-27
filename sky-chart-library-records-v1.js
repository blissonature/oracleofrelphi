// Authoritative permanent Sky Library records, Groups, Entities, and association ownership.
(function(){
'use strict';
if(window.RelphiSkyLibraryRecords)return;
const LIBRARY='relphiSkyLibraryV1', ENTITIES='relphiSkyEntitiesV1', GROUPS='relphiSkyGroupsV1';
const clone=x=>JSON.parse(JSON.stringify(x));
const clean=x=>String(x==null?'':x).trim();
const norm=x=>clean(x).toLocaleLowerCase().replace(/\s+/g,' ');
const id=prefix=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
function read(key){try{const x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)?x:[]}catch(_){return []}}
function library(){return read(LIBRARY)}
function entities(){return read(ENTITIES)}
function groups(){return read(GROUPS)}
function ref(s){return clean(s?.id||s?.metadata?.savedSkyId||s?.savedSkyId)}
function profile(s){return s?.calcProfile||s?.profile||s||{}}
function identity(s){
  const p=profile(s),lat=Number(p.latitude??s?.latitude),lon=Number(p.longitude??s?.longitude);
  const date=clean(p.dateTime||s?.dateTime),unknown=p.timeUnknown===true;
  if(!date||!Number.isFinite(lat)||!Number.isFinite(lon))return '';
  let moment=unknown?'unknown:'+date.slice(0,10):'';
  if(!unknown){
    const instant=clean(p.instant||s?.instant);
    const ms=instant?Date.parse(instant):NaN;
    if(Number.isFinite(ms))moment='instant:'+new Date(ms).toISOString();
    else if(window.luxon?.DateTime){
      const dt=window.luxon.DateTime.fromISO(date,{zone:clean(p.timeZone||s?.timeZone),setZone:true});
      if(dt?.isValid)moment='instant:'+dt.toUTC().toISO();
    }
    if(!moment)moment='local:'+date.slice(0,19)+'@'+clean(p.timeZone||s?.timeZone);
  }
  return JSON.stringify([moment,lat.toFixed(5),lon.toFixed(5)]);
}
function duplicate(s,exclude){const sig=identity(s);return sig?library().find(x=>ref(x)!==clean(exclude)&&identity(x)===sig)||null:null}
function links(s,role){const meta=s?.metadata||{};const values=role==='owner'?meta.skyOwners:meta.skyAssociates;return Array.isArray(values)?[...new Set(values.map(clean).filter(Boolean))]:[]}
function groupList(s){const g=s?.metadata?.skyGroups;return Array.isArray(g)?[...new Set(g.map(clean).filter(Boolean))]:[]}
function named(s,name,skyId,isDefault){
 const next=clone(s);next.id=skyId;next.name=name;next.displayName=name;next.skyName=name;next.title=name;
 next.metadata={...(next.metadata||{}),savedSkyId:skyId,savedSkyName:name,name,title:name,nameIsDefault:!!isDefault};
 next.calcProfile={...(next.calcProfile||{}),name,title:name};
 next.updatedAt=new Date().toISOString();next.savedAt=next.savedAt||next.updatedAt;
 return next;
}
function commitAll(skies,people,labels){
 const old=[LIBRARY,ENTITIES,GROUPS].map(key=>localStorage.getItem(key));
 try{
  localStorage.setItem(LIBRARY,JSON.stringify(skies));
  localStorage.setItem(ENTITIES,JSON.stringify(people));
  localStorage.setItem(GROUPS,JSON.stringify(labels));
 }catch(error){
  [LIBRARY,ENTITIES,GROUPS].forEach((key,i)=>{try{if(old[i]==null)localStorage.removeItem(key);else localStorage.setItem(key,old[i])}catch(_){}});
  return{ok:false,message:'Sky Library could not be saved. Existing records were retained.'};
 }
 window.dispatchEvent(new CustomEvent('relphi:saved-sky-library-changed'));
 return{ok:true};
}
function resolveEntities(input,existing){
 const used=[],records=existing;
 for(const item of Array.isArray(input)?input:[]){
  const existingId=clean(item?.id),name=clean(item?.name);
  let match=existingId?records.find(x=>x.id===existingId):null;
  if(!match&&name){match={id:id('entity'),name,createdAt:new Date().toISOString()};records.push(match)}
  if(match&&!used.includes(match.id))used.push(match.id);
 }
 return used;
}
function composeAssociations(record,owners,associates,selectedGroups,people){
 const own=resolveEntities(owners,people),associate=resolveEntities(associates,people).filter(v=>!own.includes(v));
 record.metadata={...(record.metadata||{}),skyOwners:own,skyAssociates:associate,skyGroups:[...new Set((selectedGroups||[]).map(clean).filter(Boolean))]};
 return record;
}
function saveSky(args){
 const sky=args?.sky,display=clean(args?.name),suggested=clean(args?.defaultName);
 if(!sky||!display)return{ok:false,message:'A sky name is required.'};
 const conflict=duplicate(sky,args?.updateId);
 if(conflict)return{ok:false,duplicate:conflict};
 const skies=library(),people=entities(),labels=groups(),current=skies.findIndex(x=>ref(x)===clean(args?.updateId));
 const skyId=current<0?id('sky'):ref(skies[current]);
 const old=current<0?null:skies[current];
 const record=named(sky,display,skyId,!!suggested&&display===suggested);
 composeAssociations(record,args?.owners??(old?links(old,'owner').map(v=>({id:v})):[]),args?.associates??(old?links(old,'associate').map(v=>({id:v})):[]),args?.groups??(old?groupList(old):[]),people);
 record.metadata.pinned=old?.metadata?.pinned===true;
 record.metadata.skyType=clean(args?.skyType??old?.metadata?.skyType??'');
 record.savedAt=old?.savedAt||record.savedAt;
 if(current<0)skies.push(record);else skies[current]=record;
 const mergedGroups=[...new Set([...labels,...groupList(record)])];
 const done=commitAll(skies,people,mergedGroups);
 return done.ok?{ok:true,record}:done;
}
function mergeSky(args){
 const targetId=clean(args?.targetId),sourceId=clean(args?.sourceId),skies=library(),people=entities(),labels=groups();
 const target=skies.find(x=>ref(x)===targetId),source=sourceId?skies.find(x=>ref(x)===sourceId):null;
 if(!target)return{ok:false,message:'The surviving sky could not be found.'};
 const selectedOwners=resolveEntities(args?.owners||[],people),selectedAssociates=resolveEntities(args?.associates||[],people);
 const combinedOwners=[...new Set([...links(target,'owner'),...selectedOwners])];
 const combinedAssociates=[...new Set([...links(target,'associate'),...selectedAssociates])].filter(x=>!combinedOwners.includes(x));
 const combinedGroups=[...new Set([...groupList(target),...(args?.groups||[]).map(clean).filter(Boolean)])];
 const merged=clone(target);merged.metadata={...(merged.metadata||{}),skyOwners:combinedOwners,skyAssociates:combinedAssociates,skyGroups:combinedGroups,pinned:merged.metadata?.pinned===true||source?.metadata?.pinned===true};
 merged.updatedAt=new Date().toISOString();
 const output=skies.filter(x=>ref(x)!==sourceId||ref(x)===targetId).map(x=>ref(x)===targetId?merged:x);
 const retainedIds=new Set(output.flatMap(x=>[...links(x,'owner'),...links(x,'associate')]));
 const done=commitAll(output,people.filter(x=>retainedIds.has(x.id)),[...new Set([...labels,...combinedGroups])]);
 return done.ok?{ok:true,record:merged}:done;
}
function deleteSky(skyId){
 const skies=library(),remaining=skies.filter(x=>ref(x)!==clean(skyId));
 if(remaining.length===skies.length)return{ok:false};
 const retained=new Set(remaining.flatMap(x=>[...links(x,'owner'),...links(x,'associate')]));
 const removed=entities().filter(x=>!retained.has(x.id));
 const done=commitAll(remaining,entities().filter(x=>retained.has(x.id)),groups());
 return done.ok?{ok:true,orphanEntities:removed}:done;
}
function deleteEntity(entityId){
 const key=clean(entityId),people=entities().filter(x=>x.id!==key),skies=library();
 const removedSkies=[];
 const output=[];
 for(const sky of skies){
  const owners=links(sky,'owner'),associates=links(sky,'associate');
  const nextOwners=owners.filter(x=>x!==key);
  const type=norm(sky?.metadata?.skyType);
  if(owners.includes(key)&&nextOwners.length===0&&(type==='natal'||type==='mortal')){removedSkies.push(sky);continue}
  const next=clone(sky);next.metadata={...(next.metadata||{}),skyOwners:nextOwners,skyAssociates:associates.filter(x=>x!==key)};
  output.push(next);
 }
 const retained=new Set(output.flatMap(x=>[...links(x,'owner'),...links(x,'associate')]));
 const done=commitAll(output,people.filter(x=>retained.has(x.id)),groups());
 return done.ok?{ok:true,deletedSkies:removedSkies}:done;
}
function renameSky(skyId,name,generated){
 const skies=library(),index=skies.findIndex(x=>ref(x)===clean(skyId));
 if(index<0)return{ok:false};
 const nextName=clean(name)||clean(generated);
 if(!nextName)return{ok:false,message:'No name could be generated.'};
 skies[index]=named(skies[index],nextName,ref(skies[index]),!clean(name));
 return commitAll(skies,entities(),groups());
}
function pin(skyId,value){
 const skies=library(),index=skies.findIndex(x=>ref(x)===clean(skyId));if(index<0)return false;
 const next=clone(skies[index]);next.metadata={...(next.metadata||{}),pinned:!!value};skies[index]=next;
 return commitAll(skies,entities(),groups()).ok;
}
window.RelphiSkyLibraryRecords=Object.freeze({library,entities,groups,ref,identity,duplicate,links,groupList,saveSky,mergeSky,deleteSky,deleteEntity,renameSky,pin});
})();