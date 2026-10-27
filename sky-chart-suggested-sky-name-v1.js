// Sky name suggestion uses the working Sky's local clock and location, not browser time.
(function(){
'use strict';
if(window.RelphiSkySuggestedName)return;
const generic=new Set(['','now','current sky','sky a','sky b','standalone sky','comparison',
 'unnamed sky','untitled sky','new sky','where and when','unsaved sky']);
const normalize=text=>String(text||'').trim().toLowerCase().replace(/\s+/g,' ');
function datePart(raw){
 const m=String(raw||'').match(/^(\d{4})-(\d{2})-(\d{2})/);
 return m?Number(m[2])+'/'+Number(m[3])+'/'+m[1]:'';
}
function place(value){
 const p=value?.calcProfile||{},m=value?.metadata||{};
 const raw=[p.location,p.locationName,p.place,p.placeName,m.location,m.locationName,value?.location,value?.locationName]
  .map(x=>String(x||'').trim()).find(Boolean)||'';
 // Keep city and region; the full location remains stored in Sky data.
 return raw.split(',').map(s=>s.trim()).filter(Boolean).slice(0,2).join(', ');
}
function clock(raw){
 const m=String(raw||'').match(/^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})/);
 if(!m)return'';
 const h=Number(m[1]);
 return(h%12||12)+':'+m[2]+' '+(h<12?'AM':'PM');
}
function format(value){
 if(!value)return'';
 const p=value.calcProfile||{},unknown=p.timeUnknown===true||value.timeUnknown===true;
 const raw=String(p.dateTime||value.dateTime||'').trim(),zone=String(p.timeZone||value.timeZone||'').trim();
 let time=unknown?'Time unknown':clock(raw),day=datePart(raw);
 if((!day||(!time&&!unknown))&&(p.instant||value.instant)&&window.luxon?.DateTime){
  let date=window.luxon.DateTime.fromISO(String(p.instant||value.instant),{setZone:true});
  if(date.isValid&&zone)date=date.setZone(zone);
  if(date.isValid){
   day=day||date.toFormat('M/d/yyyy');
   if(!time&&!unknown)time=date.toFormat('h:mm a');
  }
 }
 const suggestion=[[time,day].filter(Boolean).join(' '),place(value)].filter(Boolean).join(' · ');
 return suggestion.slice(0,80).trim();
}
function preferred(value){
 if(!value)return'';
 const suggested=format(value);
 const candidates=[value.metadata?.savedSkyName,value.name,value.displayName,value.skyName,value.title,value.calcProfile?.name,value.calcProfile?.title];
 for(const item of candidates){
  const name=String(item||'').trim();
  if(generic.has(normalize(name)))continue;
  // Upgrade the legacy unsaved timestamp name with location.
  if(/^\d{1,2}:\d{2}\s*(?:AM|PM)\s+\d{1,2}\/\d{1,2}\/\d{4}$/i.test(name)&&suggested)return suggested;
  return name.slice(0,80);
 }
 return suggested;
}
window.RelphiSkySuggestedName=Object.freeze({format,preferred});
})();
