// Shared House System control for the native Placements drawers.
// One comparison-level system is applied to both skies; each sky still computes its own cusps.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyPlacementHouseSystemV4)return;
window.__relphiSkyPlacementHouseSystemV1=true;
window.__relphiSkyPlacementHouseSystemV2=true;
window.__relphiSkyPlacementHouseSystemV3=true;
window.__relphiSkyPlacementHouseSystemV4=true;
const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const SHARED_KEY='relphiSkySharedHouseSystemV1';
const SYSTEMS={'whole-sign':'Whole Sign','equal-house':'Equal House',porphyry:'Porphyry',placidus:'Placidus',alcabitius:'Alcabitius',regiomontanus:'Regiomontanus',campanus:'Campanus',koch:'Koch'};
const SIGNS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
const ALIASES={rising:'asc',ascendant:'asc',asc:'asc',ac:'asc',descendant:'dsc',dsc:'dsc',dc:'dsc',midheaven:'mc',mc:'mc','imum coeli':'ic',imumcoeli:'ic',ic:'ic'};
let queued=false,syncing=false,houseChangeQueued=false,pendingChange=null;
const norm=value=>((Number(value)%360)+360)%360;
function read(slot){try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}catch(_){return null}}
function write(slot,value){localStorage.setItem(KEYS[slot],JSON.stringify(value))}
function profile(value){return value?.calcProfile&&typeof value.calcProfile==='object'?value.calcProfile:{}}
function source(value){if(!value||typeof value!=='object')return[];const raw=[value.placements,value.positions,value.points,value.bodies].find(item=>item&&typeof item==='object')||value;if(Array.isArray(raw))return raw.map((item,index)=>[String(item?.name||item?.label||item?.id||index),item]);return Object.entries(raw).filter(([key,item])=>item&&typeof item==='object'&&!Array.isArray(item)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key))}
function longitude(item){if(Number.isFinite(Number(item?.longitude)))return norm(item.longitude);const sign=SIGNS.indexOf(String(item?.sign||item?.zodiac||'').trim().toLowerCase());return sign<0?NaN:norm(sign*30+Number(item.degree||item.degrees||0)+Number(item.minute||item.minutes||0)/60+Number(item.second||item.seconds||0)/3600)}
function canonical(key,item){const registry=window.RelphiGlyphRegistry;for(const candidate of[item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key]){if(candidate==null)continue;const raw=String(candidate).trim(),id=ALIASES[raw.toLowerCase()]||raw,entry=registry?.resolve?.(id)||registry?.get?.(id);if(entry)return entry}return null}
function records(value){const seen=new Set();return source(value).map(([key,item])=>{const entry=canonical(key,item),degree=longitude(item);if(!entry||!Number.isFinite(degree)||seen.has(entry.id))return null;seen.add(entry.id);return{item,id:entry.id,value:degree}}).filter(Boolean)}
function houseFor(value,cusps){for(let index=0;index<12;index++){const start=norm(cusps[index]),span=norm(cusps[(index+1)%12]-start)||30;if(norm(value-start)<span)return index+1}return 12}
function sharedSystem(){const stored=localStorage.getItem(SHARED_KEY);if(stored&&SYSTEMS[stored])return stored;for(const slot of['A','B']){const value=read(slot),candidate=String(profile(value).houseSystem||value?.houseSystem||'');if(SYSTEMS[candidate]){localStorage.setItem(SHARED_KEY,candidate);return candidate}}localStorage.setItem(SHARED_KEY,'whole-sign');return'whole-sign'}
function applySystem(slot,value,system){const p=profile(value),raw=value.placements&&typeof value.placements==='object'?value.placements:{},list=records(value),asc=list.find(item=>item.id==='asc'),mc=list.find(item=>item.id==='mc');if(!asc||!mc)throw new Error(`Sky ${slot} needs Ascendant and Midheaven.`);if(!window.RelphiHouseSystems||!window.Astronomy)throw new Error('The house calculation engine is unavailable.');const instant=new Date(p.instant||p.dateTime||Date.now()),longitudeValue=Number(p.longitude),latitude=Number(p.latitude);if(!Number.isFinite(longitudeValue)||!Number.isFinite(latitude))throw new Error(`Sky ${slot} needs resolved coordinates.`);const siderealDegrees=norm(window.Astronomy.SiderealTime(instant)*15+longitudeValue),obliquityDegrees=Number(window.Astronomy.e_tilt(instant).tobl),result=window.RelphiHouseSystems.calculateCusps({system,ascendant:asc.value,midheaven:mc.value,siderealDegrees,obliquityDegrees,latitude});value.calcProfile={...p,houseSystem:result.system,houseCusps:result.cusps,cusps:result.cusps,houseSystemNote:result.note};value.houseCusps=result.cusps;Object.values(raw).forEach(item=>{if(Number.isFinite(Number(item?.longitude)))item.house=houseFor(Number(item.longitude),result.cusps)});return value}
function syncControls(system){document.querySelectorAll('[data-placement-house-system]').forEach(select=>{if(select.value!==system)select.value=system})}
function dispatchFoundationOnce(slots){const slot=slots.includes('A')?'A':slots.includes('B')?'B':'';if(!slot)return;try{window.dispatchEvent(new StorageEvent('storage',{key:KEYS[slot],newValue:localStorage.getItem(KEYS[slot]),storageArea:localStorage}))}catch(_){const event=new Event('storage');Object.defineProperty(event,'key',{value:KEYS[slot]});window.dispatchEvent(event)}}
function announce(system,slots){window.dispatchEvent(new CustomEvent('relphi:sky-house-system-changed',{detail:{system,slots}}));dispatchFoundationOnce(slots)}
function commitHouseChange(){houseChangeQueued=false;const change=pendingChange;pendingChange=null;if(!change)return;const{system,select,previous}=change;try{syncing=true;const next={};for(const slot of['A','B']){const value=read(slot);if(!value)continue;next[slot]=applySystem(slot,value,system)}Object.entries(next).forEach(([slot,value])=>write(slot,value));localStorage.setItem(SHARED_KEY,system);syncControls(system);select?.setCustomValidity('');announce(system,Object.keys(next));schedule()}catch(error){console.error(error);localStorage.setItem(SHARED_KEY,previous);syncControls(previous);if(select){select.setCustomValidity(error.message);select.reportValidity()}}finally{syncing=false}if(pendingChange&&!houseChangeQueued){houseChangeQueued=true;requestAnimationFrame(commitHouseChange)}}
function changeHouseSystem(system,select){if(!SYSTEMS[system])return;const previous=sharedSystem();localStorage.setItem(SHARED_KEY,system);syncControls(system);select?.setCustomValidity('');pendingChange={system,select,previous};if(houseChangeQueued)return;houseChangeQueued=true;requestAnimationFrame(commitHouseChange)}
function syncSharedSystem(){if(syncing)return;const system=sharedSystem(),needs=[];for(const slot of['A','B']){const value=read(slot);if(!value)continue;const current=String(profile(value).houseSystem||value?.houseSystem||'whole-sign');if(current!==system)needs.push(slot)}if(!needs.length){syncControls(system);return}try{syncing=true;const changed=[];needs.forEach(slot=>{const value=read(slot);if(!value)return;changed.push([slot,applySystem(slot,value,system)])});changed.forEach(([slot,value])=>write(slot,value));syncControls(system);announce(system,changed.map(([slot])=>slot))}catch(error){console.error('[Sky Chart] Could not synchronize shared House System',error)}finally{syncing=false}}
function control(slot){
  const system=sharedSystem(),label=document.createElement('label');
  label.className='sky-placement-house-system-inline';
  label.title='House System';
  label.innerHTML=`<span class="sky-placement-house-system-label">House System</span><select data-placement-house-system="${slot}" aria-label="House System for both skies">${Object.entries(SYSTEMS).map(([id,name])=>`<option value="${id}"${id===system?' selected':''}>${name}</option>`).join('')}</select>`;
  return label
}
function placementView(slot){return window.RelphiSkyCardShell?.get?.(slot)?.placements||document.getElementById(`skyFoundation${slot}`)?.querySelector('.sky-where-when-placement-view')||null}
function angleHeading(slot){return document.querySelector(`#skyFoundation${slot} .sky-foundation-ledger-angle-heading[data-placement-section="chart-angles"]`)||null}
function decorate(slot){
  const view=placementView(slot);if(!view)return;
  view.querySelectorAll(':scope > .sky-placement-house-system-inline').forEach(node=>node.remove());
  const heading=angleHeading(slot);if(!heading)return;
  let target=heading.querySelector(':scope > [data-placement-house-system-mount]');
  if(!target){
    target=document.createElement('span');
    target.className='sky-foundation-ledger-angle-house-system';
    target.dataset.placementHouseSystemMount=slot;
    heading.appendChild(target);
  }
  const system=sharedSystem(),existing=target.querySelector(':scope > .sky-placement-house-system-inline');
  if(existing){
    const select=existing.querySelector('[data-placement-house-system]');
    if(select&&select.value!==system)select.value=system;
    return
  }
  target.replaceChildren(control(slot))
}
function removeRelationshipHouseSystem(){document.querySelector('[data-house-system-filter]')?.closest('label')?.remove()}
function hydrate(){queued=false;removeRelationshipHouseSystem();decorate('A');decorate('B')}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(hydrate)}
function installStyles(){
  if(document.getElementById('skyPlacementHouseSystemV4Styles'))return;
  ['skyPlacementHouseSystemV3Styles','skyPlacementHouseSystemV2Styles','skyPlacementHouseSystemV1Styles'].forEach(id=>document.getElementById(id)?.remove());
  const style=document.createElement('style');style.id='skyPlacementHouseSystemV4Styles';
  style.textContent=`
    .sky-foundation-ledger-angle-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:34px;padding:5px 8px;box-sizing:border-box}
    .sky-foundation-ledger-angle-title{min-width:0;font:850 .64rem/1.15 system-ui,sans-serif;letter-spacing:.035em;text-transform:uppercase;color:#5d554e}
    .sky-foundation-ledger-angle-house-system{display:flex;align-items:center;justify-content:flex-end;min-width:0;margin-left:auto}
    .sky-placement-house-system-inline{display:block;margin:0;padding:0;color:#554c44;font:800 .62rem/1.2 system-ui,sans-serif}
    .sky-placement-house-system-label{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
    .sky-placement-house-system-inline select{width:auto;max-width:154px;min-width:118px;min-height:30px;border:1px solid rgba(31,27,24,.22);border-radius:8px;background:#fff;padding:.3rem 1.55rem .3rem .48rem;color:#211d19;font:750 .66rem/1.2 system-ui,sans-serif}
    @media(max-width:620px){.sky-foundation-ledger-angle-heading{padding:5px 7px}.sky-placement-house-system-inline select{min-width:116px;max-width:146px;min-height:32px;font-size:16px;padding:.28rem 1.45rem .28rem .42rem}}
  `;
  document.head.appendChild(style)
}
document.addEventListener('change',event=>{const select=event.target.closest('[data-placement-house-system]');if(select)changeHouseSystem(select.value,select)});
['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-house-multiselect-changed'].forEach(name=>window.addEventListener(name,schedule));
window.addEventListener('storage',event=>{if(Object.values(KEYS).includes(event.key)){if(!syncing)syncSharedSystem();schedule()}});
window.RelphiSkyPlacementHouseSystem=Object.freeze({mount:decorate,sync:syncControls});
function start(){installStyles();syncSharedSystem();schedule()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
