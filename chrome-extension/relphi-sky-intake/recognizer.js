// Shared deterministic recognizer for the extension worker, page links, and preview.
// Place coordinates and historical time zone are verified by Sky Chart, not guessed here.
(function(root){
'use strict';
const months={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
const monthNames='Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?';
const regions='Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming|District of Columbia';
const places='(?:'+regions+'|AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|UK|USA|US|Canada|Mexico|France|Germany|Italy|Spain|Ireland|United Kingdom|United States|Australia|India|Japan|Brazil|Portugal|Greece|Netherlands|Switzerland|New Zealand)';
const road='Street|St|Road|Rd|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Place|Pl|Terrace|Ter|Circle|Cir|Parkway|Pkwy|Highway|Hwy';
const reStreet=new RegExp('\\b\\d{1,6}\\s+(?:[A-Z][A-Za-zÀ-ž\\u2019.-]*\\s+){1,5}(?:'+road+')\\.?\\b(?:\\s+(?:NE|NW|SE|SW|N|S|E|W))?(?:\\s*,\\s*[A-Z][A-Za-zÀ-ž\\u2019.-]+(?:\\s+[A-Z][A-Za-zÀ-ž\\u2019.-]+){0,3})?(?:\\s*,\\s*'+places+')?(?:\\s+\\d{5}(?:-\\d{4})?)?','g');
const reCity=new RegExp('\\b[A-Z][A-Za-zÀ-ž\\u2019-]+(?:\\s+[A-Z][A-Za-zÀ-ž\\u2019-]+){0,3},\\s*'+places+'\\b','g');
const reIso=/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g;
const reName=new RegExp('\\b('+monthNames+')\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s*,?\\s*(\\d{4})\\b','gi');
const reReverse=new RegExp('\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+('+monthNames+')\\.?\\s+(\\d{4})\\b','gi');
const reSlash=/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g;
const pad=n=>String(n).padStart(2,'0');
const unique=a=>[...new Set(a)];
const trim=s=>String(s||'').trim().replace(/[\s,;.]+$/,'');
function calendar(year,month,day){
  const y=Number(year),m=Number(month),d=Number(day);
  if(!Number.isInteger(y)||y<1000||y>2999||!Number.isInteger(m)||m<1||m>12||!Number.isInteger(d)||d<1||d>31)return'';
  const date=new Date(Date.UTC(y,m-1,d));
  return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d?String(y)+'-'+pad(m)+'-'+pad(d):'';
}
function dates(text,prefs){
  const found=[],order=prefs?.dateOrder||'unambiguous';
  const add=(m,y,month,d,ambiguous=false)=>found.push({kind:'date',start:m.index,end:m.index+m[0].length,value:m[0],date:calendar(y,month,d),ambiguous});
  for(const m of text.matchAll(reIso))add(m,m[1],m[2],m[3]);
  for(const m of text.matchAll(reName))add(m,m[3],months[m[1].slice(0,3).toLowerCase()],m[2]);
  for(const m of text.matchAll(reReverse))add(m,m[3],months[m[2].slice(0,3).toLowerCase()],m[1]);
  for(const m of text.matchAll(reSlash)){
    const a=Number(m[1]),b=Number(m[2]);
    const values=order==='mdy'?[a,b]:order==='dmy'?[b,a]:a>12?[b,a]:b>12?[a,b]:[];
    add(m,m[3],values[0],values[1],!values.length);
  }
  return found.sort((a,b)=>a.start-b.start||b.end-a.end).filter((x,i,all)=>!all.slice(0,i).some(y=>x.start<y.end));
}
function addresses(text){
  const found=[];
  for(const pattern of [reStreet,reCity])for(const m of text.matchAll(pattern))
    found.push({kind:'address',start:m.index,end:m.index+m[0].length,value:trim(m[0])});
  return found.sort((a,b)=>a.start-b.start||b.end-a.end).filter((x,i,all)=>!all.slice(0,i).some(y=>x.start<y.end));
}
function clock(hour,minute,meridiem){
  let h=Number(hour),m=Number(minute);
  if(!Number.isInteger(h)||!Number.isInteger(m)||m<0||m>59)return'';
  const part=String(meridiem||'').toUpperCase().replace(/\./g,'');
  if(part){if(h<1||h>12)return'';h=h%12+(part[0]==='P'?12:0)}
  else if(h<0||h>23)return'';
  return pad(h)+':'+pad(m);
}
function times(text){
  const values=[];
  // Ignore timezone offsets as separate clock times.
  const withoutOffsets=text.replace(/(?:Z|[+-]\d{2}:\d{2})(?=\s|[,;]|$)/gi,' ');
  for(const m of withoutOffsets.matchAll(/\b(\d{1,2}):(\d{2})(?::\d{2})?\s*(a\.?m\.?|p\.?m\.?)?\b/gi))
    values.push({time:clock(m[1],m[2],m[3])});
  if(!values.length)for(const m of withoutOffsets.matchAll(/\b(\d{1,2})\s*(a\.?m\.?|p\.?m\.?)\b/gi))
    values.push({time:clock(m[1],0,m[2])});
  return values;
}
function place(text){
  const label=text.match(/(?:^|\n)\s*(?:where|location|address|birth\s*place|birthplace|city|venue|place)\s*[:=]\s*([^\n\r]+)/im);
  if(label)return trim(label[1].split(/\s+(?:(?:date|time|timezone|time zone)\s*:)/i)[0]).slice(0,180);
  const hits=addresses(text);if(hits.length===1)return hits[0].value.slice(0,180);
  const inPlace=text.match(/\b(?:in|at|born in)\s+([A-Z][A-Za-zÀ-ž '\u2019-]+,\s*[A-Z][A-Za-zÀ-ž '\u2019-]+)(?=\s*(?:at\b|on\b|[.;\n]|$))/);
  return inPlace?trim(inPlace[1]).slice(0,180):'';
}
function recognize(input,prefs={}){
  const text=String(input||'').slice(0,5000),errors=[];
  const d=dates(text,prefs),good=unique(d.filter(x=>x.date).map(x=>x.date)),invalid=d.filter(x=>!x.date);
  if(invalid.some(x=>x.ambiguous))errors.push('Ambiguous numeric date: spell out the month or set date order in preferences.');
  else if(invalid.length)errors.push('Invalid calendar date.');
  if(good.length>1)errors.push('Multiple distinct dates.');
  const t=times(text),valid=unique(t.filter(x=>x.time).map(x=>x.time));
  if(t.some(x=>!x.time))errors.push('Invalid clock time.');
  if(valid.length>1)errors.push('Multiple distinct clock times.');
  const unknown=/\b(?:time\s+(?:is\s+)?unknown|unknown\s+(?:birth\s+)?time|birth\s+time\s+unknown)\b/i.test(text);
  if(unknown&&valid.length)errors.push('Conflicting known and unknown times.');
  if(/\b(?:PST|PDT|MST|MDT|CST|CDT|EST|EDT|BST|IST)\b/.test(text)&&valid.length)
    errors.push('Time-zone abbreviation needs review; time must be local to the selected place.');
  const location=place(text),date=good.length===1?good[0]:'',time=valid.length===1?valid[0]:'';
  return{date,time,timeUnknown:unknown,location,errors:unique(errors),
    hasAny:!!(date||time||unknown||location),
    complete:!!(date&&(time||unknown)&&location&&!errors.length)};
}
function candidate(kind,value,prefs={}){
  const data=recognize(value,prefs);
  if(kind==='date')return{...data,time:'',timeUnknown:false,location:'',hasAny:!!data.date};
  if(kind==='address')return{...data,date:'',time:'',timeUnknown:false,location:trim(value).slice(0,180),hasAny:!!trim(value)};
  return data;
}
function links(input,prefs={}){
  const text=String(input||'').slice(0,10000),found=[];
  if(prefs.linkDates)found.push(...dates(text,prefs).filter(x=>x.date));
  if(prefs.linkAddresses)found.push(...addresses(text));
  return found.sort((a,b)=>a.start-b.start||b.end-a.end).filter((x,i,all)=>!all.slice(0,i).some(y=>x.start<y.end));
}
// Review builds target the immutable, browser-verified Sky Chart receiver until merged.
function destination(choice='preview'){
  return choice==='live'?'https://oracleofrelphi.com/sky-chart.html':
    'https://oracleofrelphi.com/sky-chart-preview/sky-chart.html?ref=647d58eec821fab85730ce77dbf73cc8ac1e469f';
}
function skyURL(data,base=destination()){
  if(!data?.hasAny||data.errors?.length)throw new Error('A recognizable, unambiguous date or address is required.');
  const url=new URL(base);if(!['http:','https:'].includes(url.protocol))throw new Error('Invalid Sky Chart URL.');
  const packet={v:1,date:data.date||'',time:data.time||'',timeUnknown:!!data.timeUnknown,location:data.location||''};
  url.hash='relphiSkyIntake='+encodeURIComponent(JSON.stringify(packet));
  return url.toString();
}
root.RelphiSkyRecognizer=Object.freeze({recognize,candidate,links,skyURL,destination,dates,addresses,calendar});
})(globalThis);
