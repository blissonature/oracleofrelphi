// Per-sky House System controls for the Placements view, without standalone mini wheels.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyPlacementHouseSystemV1)return;
window.__relphiSkyPlacementHouseSystemV1=true;
const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const SYSTEMS={'whole-sign':'Whole Sign','equal-house':'Equal House',porphyry:'Porphyry',placidus:'Placidus',alcabitius:'Alcabitius',regiomontanus:'Regiomontanus',campanus:'Campanus',koch:'Koch'};
const SIGNS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
const ALIASES={rising:'asc',ascendant:'asc',asc:'asc',ac:'asc',descendant:'dsc',dsc:'dsc',dc:'dsc',midheaven:'mc',mc:'mc','imum coeli':'ic',imumcoeli:'ic',ic:'ic'};
let queued=false;
const norm=value=>((Number(value)%360)+360)%360;
function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
function write(slot,value){localStorage.setItem(KEYS[slot],JSON.stringify(value));try{window.dispatchEvent(new StorageEvent('storage',{key:KEYS[slot],newValue:localStorage.getItem(KEYS[slot]),storageArea:localStorage}))}catch(_){const event=new Event('storage');Object.defineProperty(event,'key',{value:KEYS[slot]});window.dispatchEvent(event)}}
function profile(value){return value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{}}
function source(value){if(!value||typeof value!=='object')return[];const raw=[value.placements,value.positions,value.points,value.bodies].find(item=>item&&typeof item==='object')||value;if(Array.isArray(raw))return raw.map((item,index)=>[String(item?.name||item?.label||item?.id||index),item]);return Object.entries(raw).filter(([key,item])=>item&&typeof item==='object'&&!Array.isArray(item)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key))}
function longitude(item){if(Number.isFinite(Number(item?.longitude)))return norm(item.longitude);const sign=SIGNS.indexOf(String(item?.sign||item?.zodiac||'').trim().toLowerCase());return sign<0?NaN:norm(sign*30+Number(item.degree||item.degrees||0)+Number(item.minute||item.minutes||0)/60+Number(item.second||item.seconds||0)/3600)}
function canonical(key,item){const registry=window.RelphiGlyphRegistry;for(const candidate of [item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key]){if(candidate==null)continue;const raw=String(candidate).trim(),id=ALIASES[raw.toLowerCase()]||raw,entry=registry?.resolve?.(id)||registry?.get?.(id);if(entry)return entry}return null}
function records(value){const seen=new Set();return source(value).map(([key,item])=>{const entry=canonical(key,item),degree=longitude(item);if(!entry||!Number.isFinite(degree)||seen.has(entry.id))return null;seen.add(entry.id);return{item,id:entry.id,value:degree}}).filter(Boolean)}
function houseFor(value,cusps){for(let index=0;index<12;index++){const start=norm(cusps[index]),span=norm(cusps[(index+1)%12]-start)||30;if(norm(value-start)<span)return index+1}return 12}
function changeHouseSystem(slot,system,select){
  try{
    const value=read(slot);if(!value)throw new Error(`Sky ${slot} is empty.`);
    const p=profile(value),raw=value.placements&&typeof value.placements==='object'?value.placements:{},list=records(value),asc=list.find(item=>item.id==='asc'),mc=list.find(item=>item.id==='mc');
    if(!asc||!mc)throw new Error(`Sky ${slot} needs Ascendant and Midheaven.`);
    if(!window.RelphiHouseSystems||!window.Astronomy)throw new Error('The house calculation engine is unavailable.');
    const instant=new Date(p.instant||p.dateTime||Date.now()),longitudeValue=Number(p.longitude),latitude=Number(p.latitude);
    if(!Number.isFinite(longitudeValue)||!Number.isFinite(latitude))throw new Error(`Sky ${slot} needs resolved coordinates.`);
    const siderealDegrees=norm(window.Astronomy.SiderealTime(instant)*15+longitudeValue),obliquityDegrees=Number(window.Astronomy.e_tilt(instant).tobl),result=window.RelphiHouseSystems.calculateCusps({system,ascendant:asc.value,midheaven:mc.value,siderealDegrees,obliquityDegrees,latitude});
    value.calcProfile={...p,houseSystem:result.system,houseCusps:result.cusps,cusps:result.cusps,houseSystemNote:result.note};value.houseCusps=result.cusps;
    Object.values(raw).forEach(item=>{if(Number.isFinite(Number(item?.longitude)))item.house=houseFor(Number(item.longitude),result.cusps)});
    select?.setCustomValidity('');write(slot,value);schedule();
  }catch(error){console.error(error);if(select){select.setCustomValidity(error.message);select.reportValidity()}}
}
function control(slot,value){const label=document.createElement('label');label.className='sky-placement-house-system-inline';label.innerHTML=`<span>House System</span><select data-placement-house-system="${slot}">${Object.entries(SYSTEMS).map(([id,name])=>`<option value="${id}"${id===String(profile(value).houseSystem||value?.houseSystem||'whole-sign')?' selected':''}>${name}</option>`).join('')}</select>`;return label}
function decorate(slot){
  const panel=document.getElementById(`skyFoundation${slot}`),view=panel?.querySelector('.sky-where-when-placement-view');if(!view)return;
  view.querySelector(':scope > .sky-placement-mini-shell')?.remove();
  const existing=view.querySelector(':scope > .sky-placement-house-system-inline');
  if(view.hidden){existing?.remove();return}
  const value=read(slot);if(!value){existing?.remove();return}
  const next=control(slot,value);existing?.replaceWith(next);if(!existing)view.prepend(next);
}
function removeRelationshipHouseSystem(){document.querySelector('[data-house-system-filter]')?.closest('label')?.remove()}
function hydrate(){queued=false;removeRelationshipHouseSystem();decorate('A');decorate('B')}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(hydrate)}
function installStyles(){if(document.getElementById('skyPlacementHouseSystemV1Styles'))return;const style=document.createElement('style');style.id='skyPlacementHouseSystemV1Styles';style.textContent=`
.sky-placement-house-system-inline{display:grid;grid-template-columns:auto minmax(128px,190px);align-items:center;justify-content:end;gap:8px;margin:0 0 .55rem;color:#554c44;font:800 .62rem/1.2 system-ui,sans-serif}.sky-placement-house-system-inline select{width:100%;min-height:35px;border:1px solid rgba(31,27,24,.22);border-radius:9px;background:#fff;padding:.45rem .55rem;color:#211d19;font:750 .68rem/1.2 system-ui,sans-serif}@media(max-width:620px){.sky-placement-house-system-inline{grid-template-columns:1fr;margin-bottom:.65rem}.sky-placement-house-system-inline select{font-size:16px}}
`;document.head.appendChild(style)}
document.addEventListener('change',event=>{const select=event.target.closest('[data-placement-house-system]');if(select)changeHouseSystem(select.dataset.placementHouseSystem,select.value,select)});
document.addEventListener('click',event=>{if(event.target.closest('.sky-where-when-actions [data-ww-action="placements"]'))setTimeout(schedule,0)},true);
['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-house-multiselect-changed'].forEach(name=>window.addEventListener(name,schedule));window.addEventListener('storage',event=>{if(Object.values(KEYS).includes(event.key))schedule()});
function start(){installStyles();schedule()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
