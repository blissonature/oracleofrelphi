// Collective harmonic field: tabbed diagnosis with fold-level provenance.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiCollectiveHarmonicsV3)return;
window.__relphiCollectiveHarmonicsV3=true;
window.__relphiCollectiveHarmonicsV2=true;
window.__relphiCollectiveHarmonicsV1=true;

const CORE_IDS=Object.freeze(['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','chiron','north-node','lilith']);
const CORE_SET=new Set(CORE_IDS);
const KEYS=Object.freeze({A:'relphiSkyChartA',B:'relphiSkyChartB'});
const VIEW_KEY='relphiSkyWhereWhenViewV1';
const VIEW_ACTIONS=Object.freeze(['edit','placements','card-hits','harmonics']);
const ALIASES=Object.freeze({sol:'sun',luna:'moon',node:'north-node','true-node':'north-node','north-node':'north-node',blackmoon:'lilith','black-moon':'lilith'});
const FOLD=Object.freeze({1:'Onefold',2:'Twofold',3:'Threefold',4:'Fourfold',5:'Fivefold',6:'Sixfold',7:'Sevenfold',8:'Eightfold',9:'Ninefold',10:'Tenfold',11:'Elevenfold',12:'Twelvefold'});
const selected={A:null,B:null};
let queued=false;

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch]));
const norm=value=>((Number(value)%360)+360)%360;
const slug=value=>String(value??'').trim().toLowerCase().replace(/[\s_]+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-');
const fold=order=>FOLD[order]||`${order}-fold`;

function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
function viewState(){try{const value=JSON.parse(sessionStorage.getItem(VIEW_KEY)||'{}');return value&&typeof value==='object'?value:{}}catch(_){return{}}}
function writeView(slot,mode){const value=viewState();value[slot]=mode;try{sessionStorage.setItem(VIEW_KEY,JSON.stringify(value))}catch(_){}}
function placementSource(payload){
  if(!payload||typeof payload!=='object')return[];
  const known=[payload.placements,payload.positions,payload.points,payload.bodies].find(value=>value&&typeof value==='object'),source=known||payload;
  if(Array.isArray(source))return source.map((item,index)=>[String(item?.name||item?.label||item?.body||item?.planet||item?.point||item?.id||index),item]);
  return Object.entries(source).filter(([key,value])=>value&&typeof value==='object'&&!Array.isArray(value)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key));
}
function longitude(item){
  if(!item)return NaN;
  if(Number.isFinite(Number(item.longitude)))return norm(item.longitude);
  const signs=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  const sign=signs.indexOf(String(item.sign||item.zodiac||'').trim().toLowerCase());
  return sign<0?NaN:norm(sign*30+Number(item.degree||item.degrees||0)+Number(item.minute||item.minutes||0)/60+Number(item.second||item.seconds||0)/3600);
}
function canonicalId(key,item){
  const registry=window.RelphiGlyphRegistry;
  for(const candidate of [item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key]){
    if(candidate==null)continue;
    const raw=slug(candidate),aliased=ALIASES[raw]||raw,entry=registry?.resolve?.(aliased)||registry?.get?.(aliased),id=slug(entry?.id||aliased);
    if(CORE_SET.has(id))return id;
  }
  return'';
}
function records(payload){
  const registry=window.RelphiGlyphRegistry,seen=new Set(),result=[];
  placementSource(payload).forEach(([key,item])=>{
    const id=canonicalId(key,item),value=longitude(item);
    if(!id||!Number.isFinite(value)||seen.has(id))return;
    seen.add(id);
    const entry=registry?.get?.(id)||registry?.resolve?.(id);
    result.push({id,name:entry?.name||String(item?.name||item?.label||key||id),longitude:value});
  });
  return result.sort((a,b)=>CORE_IDS.indexOf(a.id)-CORE_IDS.indexOf(b.id));
}
function activeWindow(){
  const input=document.querySelector('[data-harmonic-window-input]'),raw=Number(String(input?.value||'').trim().replace(',','.'));
  if(Number.isFinite(raw)&&raw>=0)return raw;
  const root=Number(document.documentElement.dataset.skyHarmonicWindow);
  return Number.isFinite(root)&&root>=0?root:Number(window.RelphiHarmonicOrb?.defaultWindow)||6;
}
function signed(value){const n=Math.round((Number(value)||0)*100);return`${n>0?'+':''}${n}%`}
function percent(value){return`${Math.round(Math.max(0,Math.min(1,Number(value)||0))*100)}%`}
function status(metric){
  const shown=Math.round((Number(metric.net)||0)*100);
  if(shown===0)return metric.primitiveWindowHits?`Balanced despite ${metric.primitiveWindowHits} recognized hit${metric.primitiveWindowHits===1?'':'s'}`:'Balanced';
  if(metric.distinctive>1e-6)return'Distinctive';
  if(metric.inheritedFrom&&metric.alignment>1e-6)return`Inherited from ${fold(metric.inheritedFrom)}`;
  return metric.net<0?'Resistance leads':'Mixed field';
}
function pairText(pair,arrow='×'){return`${esc(pair.left.name)} ${arrow} ${esc(pair.right.name)}`}
function contribution(pair){const n=Math.round((Number(pair?.contribution)||0)*100);return`${n>0?'+':''}${n}%`}
function phase(pair){return`${Math.round((Number(pair?.phaseDistance)||0)*10)/10}°`}

function installStyles(){
  let style=document.getElementById('relphiCollectiveHarmonicsStyles');
  if(!style){style=document.createElement('style');style.id='relphiCollectiveHarmonicsStyles';document.head.appendChild(style)}
  style.textContent=`
  .sky-where-when-actions{display:grid!important;grid-template-columns:1fr!important;gap:6px!important;width:100%;padding:0!important;background:transparent!important}
  .sky-card-now-row{display:flex;align-items:center;justify-content:flex-start;min-width:0}
  .sky-card-view-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px;padding:3px;border:1px solid color-mix(in srgb,var(--slot-color,#6f6862) 18%,#d8d1ca);border-radius:13px;background:color-mix(in srgb,var(--slot-color,#6f6862) 6%,#f3efe9);box-shadow:inset 0 1px 0 rgba(255,255,255,.8)}
  .sky-card-view-tabs .sky-where-when-action{appearance:none!important;width:100%!important;min-width:0!important;min-height:32px!important;margin:0!important;padding:.38rem .28rem!important;border:1px solid transparent!important;border-radius:9px!important;background:transparent!important;color:#4a433d!important;box-shadow:none!important;font:820 .59rem/1.05 system-ui,sans-serif!important;text-align:center!important;text-wrap:balance;cursor:pointer;transition:background .14s ease,border-color .14s ease,box-shadow .14s ease,transform .14s ease}
  .sky-card-view-tabs .sky-where-when-action:hover{background:rgba(255,255,255,.62)!important;color:#211d19!important}
  .sky-card-view-tabs .sky-where-when-action:focus-visible{outline:2px solid color-mix(in srgb,var(--slot-color,#6f6862) 48%,#fff);outline-offset:1px}
  .sky-card-view-tabs .sky-where-when-action[aria-pressed="true"]{border-color:color-mix(in srgb,var(--slot-color,#6f6862) 25%,#d3ccc5)!important;background:#fff!important;color:#201c18!important;box-shadow:0 1px 3px rgba(34,27,22,.12),inset 0 -2px 0 var(--slot-color,#6f6862)!important}
  .sky-card-now-row .sky-where-when-action{appearance:none!important;width:auto!important;min-height:28px!important;margin:0!important;padding:.35rem .58rem!important;border:1px solid color-mix(in srgb,var(--slot-color,#6f6862) 28%,#d5cec7)!important;border-radius:999px!important;background:color-mix(in srgb,var(--slot-color,#6f6862) 7%,#fff)!important;color:color-mix(in srgb,var(--slot-color,#6f6862) 82%,#2d2925)!important;box-shadow:0 1px 2px rgba(34,27,22,.08)!important;font:850 .58rem/1 system-ui,sans-serif!important;white-space:nowrap;cursor:pointer}
  .sky-card-now-row .sky-where-when-action:hover{background:color-mix(in srgb,var(--slot-color,#6f6862) 12%,#fff)!important;box-shadow:0 2px 5px rgba(34,27,22,.1)!important}
  .sky-card-now-row:empty{display:none}
  .sky-fold-view{display:grid;gap:.68rem;padding:10px;min-width:0;color:#241f1b}
  .sky-fold-head{display:flex;align-items:flex-start;justify-content:space-between;gap:.65rem}.sky-fold-head h3{margin:0;font:900 .84rem/1.15 system-ui,sans-serif}.sky-fold-head p{margin:.18rem 0 0;color:#6a625c;font:650 .64rem/1.35 system-ui,sans-serif}.sky-fold-window{flex:none;border-radius:999px;background:#f0ece7;padding:.25rem .45rem;color:#514943;font:800 .64rem/1 system-ui,sans-serif}
  .sky-fold-spectrum{display:grid;gap:.22rem}.sky-fold-spectrum-row{display:grid;grid-template-columns:minmax(76px,auto) minmax(90px,1fr) 42px auto;align-items:center;gap:.42rem;width:100%;border:1px solid transparent;border-radius:9px;background:transparent;color:inherit;padding:.34rem .4rem;cursor:pointer;text-align:left}.sky-fold-spectrum-row:hover,.sky-fold-spectrum-row:focus-visible{background:#f7f4f0;outline:0;border-color:rgba(31,27,24,.14)}.sky-fold-spectrum-row[aria-pressed="true"]{background:#fff;border-color:#77706a;box-shadow:0 0 0 1px rgba(31,27,24,.08)}
  .sky-fold-name{font:850 .69rem/1.1 system-ui,sans-serif}.sky-fold-axis{display:grid;grid-template-columns:1fr 1fr;height:7px;position:relative}.sky-fold-axis::after{content:"";position:absolute;left:50%;top:-2px;bottom:-2px;width:1px;background:#706a65}.sky-fold-half{position:relative;background:#eee9e4;overflow:hidden}.sky-fold-half:first-child{border-radius:999px 0 0 999px}.sky-fold-half:last-child{border-radius:0 999px 999px 0}.sky-fold-half span{position:absolute;top:0;bottom:0}.sky-fold-half:first-child span{right:0;background:#aaa39d}.sky-fold-half:last-child span{left:0;background:#4f4a46}.sky-fold-net{font:900 .68rem/1 system-ui,sans-serif;text-align:right;font-variant-numeric:tabular-nums}.sky-fold-hits{border-radius:999px;background:#eeeae5;padding:.2rem .35rem;color:#625b55;font:800 .58rem/1 system-ui,sans-serif;white-space:nowrap}
  .sky-fold-selection-hint{margin:.08rem 0 0;padding-top:.5rem;border-top:1px solid rgba(31,27,24,.09);color:#746c66;font:700 .61rem/1.3 system-ui,sans-serif;text-align:center}
  .sky-fold-diagnosis{display:grid;grid-template-columns:1fr auto;gap:.55rem;align-items:baseline;border-top:1px solid rgba(31,27,24,.1);padding-top:.62rem}.sky-fold-diagnosis h4{margin:0;font:900 .8rem/1.1 system-ui,sans-serif}.sky-fold-diagnosis strong{font:950 .96rem/1 system-ui,sans-serif}.sky-fold-status{margin:.14rem 0 0;color:#6a625c;font:700 .61rem/1.25 system-ui,sans-serif}
  .sky-fold-anatomy{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.36rem}.sky-fold-stat{padding:.48rem .52rem;border:1px solid rgba(31,27,24,.11);border-radius:9px;background:#fffdfa;color:#675f59;font:650 .59rem/1.25 system-ui,sans-serif}.sky-fold-stat strong{display:block;margin-bottom:.07rem;color:#211d19;font:900 .7rem/1.15 system-ui,sans-serif}
  #skyFoundationA .sky-fold-anatomy,#skyFoundationB .sky-fold-anatomy{grid-template-columns:1fr;gap:.28rem}
  #skyFoundationA .sky-fold-stat,#skyFoundationB .sky-fold-stat{display:grid;grid-template-columns:minmax(78px,auto) minmax(0,1fr);gap:.45rem;align-items:baseline;padding:.4rem .48rem}
  #skyFoundationA .sky-fold-stat strong,#skyFoundationB .sky-fold-stat strong{margin:0;font-size:.66rem}
  .sky-fold-section{display:grid;gap:.35rem}.sky-fold-section h5{margin:0;font:900 .68rem/1.1 system-ui,sans-serif}.sky-fold-structure-list,.sky-fold-pressure-grid{display:grid;gap:.3rem}.sky-fold-structure{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:.42rem;align-items:center;padding:.4rem .48rem;border-radius:8px;background:#f5f1ed;font:700 .61rem/1.2 system-ui,sans-serif}.sky-fold-structure small{color:#716861;font:700 .57rem/1 system-ui,sans-serif}.sky-fold-pressure-grid{grid-template-columns:1fr 1fr}.sky-fold-pressure-card{padding:.48rem .52rem;border:1px solid rgba(31,27,24,.1);border-radius:9px;background:#fff}.sky-fold-pressure-card h6{margin:0 0 .3rem;font:900 .62rem/1.1 system-ui,sans-serif}.sky-fold-pressure-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.35rem;padding:.25rem 0;border-top:1px solid rgba(31,27,24,.07);font:700 .58rem/1.2 system-ui,sans-serif}.sky-fold-pressure-item:first-of-type{border-top:0}
  .sky-fold-side-more{border-top:1px solid rgba(31,27,24,.08);padding-top:.36rem;color:#625a54;font:650 .6rem/1.35 system-ui,sans-serif}.sky-fold-side-more>summary{cursor:pointer;font-weight:850;list-style:none}.sky-fold-side-more>summary::-webkit-details-marker{display:none}.sky-fold-side-more>summary::after{content:" +"}.sky-fold-side-more[open]>summary::after{content:" −"}.sky-fold-side-more-body{display:grid;gap:.62rem;margin-top:.55rem}
  #skyFoundationA .sky-fold-pressure-grid,#skyFoundationB .sky-fold-pressure-grid{grid-template-columns:1fr}
  .sky-fold-method{color:#625a54;font:650 .61rem/1.4 system-ui,sans-serif}.sky-fold-method summary{cursor:pointer;font-weight:850}.sky-fold-method p{margin:.35rem 0 0}
  @media(max-width:620px){.sky-card-view-tabs .sky-where-when-action{font-size:.57rem}.sky-fold-spectrum-row{grid-template-columns:minmax(68px,auto) 1fr 38px}.sky-fold-hits{grid-column:2/5;justify-self:start}.sky-fold-anatomy{grid-template-columns:1fr}.sky-fold-pressure-grid{grid-template-columns:1fr}}
  `;
}

function panel(slot){return document.getElementById(`skyFoundation${slot}`)}
function nodes(slot){const card=panel(slot),body=card?.querySelector(':scope > .sky-foundation-body');return{card,body,placement:body?.querySelector('.sky-where-when-placement-view'),view:body?.querySelector('.sky-where-when-view')}}
function ensureTab(slot){
  const actions=panel(slot)?.querySelector('.sky-where-when-actions');
  if(!actions)return null;
  let button=actions.querySelector('[data-ww-action="harmonics"]');
  if(!button){
    button=document.createElement('button');button.type='button';button.className='sky-where-when-action';button.dataset.wwAction='harmonics';button.textContent='Harmonics';button.setAttribute('aria-label',`Show Harmonics for Sky ${slot}`);actions.appendChild(button);
  }
  return button;
}
function beautifyTabs(slot){
  const actions=panel(slot)?.querySelector('.sky-where-when-actions');
  if(!actions)return;
  let nowRow=actions.querySelector(':scope > .sky-card-now-row');
  if(!nowRow){nowRow=document.createElement('div');nowRow.className='sky-card-now-row';actions.prepend(nowRow)}
  let viewTabs=actions.querySelector(':scope > .sky-card-view-tabs');
  if(!viewTabs){viewTabs=document.createElement('div');viewTabs.className='sky-card-view-tabs';viewTabs.setAttribute('role','tablist');viewTabs.setAttribute('aria-label',`Sky ${slot} views`);actions.appendChild(viewTabs)}
  const buttons=[...actions.querySelectorAll('.sky-where-when-action')].filter(button=>button.closest('.sky-where-when-actions')===actions);
  VIEW_ACTIONS.forEach(action=>{
    const button=buttons.find(item=>item.dataset.wwAction===action);
    if(!button)return;
    if(button.parentElement!==viewTabs)viewTabs.appendChild(button);
    button.setAttribute('role','tab');
  });
  buttons.filter(button=>!VIEW_ACTIONS.includes(button.dataset.wwAction)).forEach(button=>{
    if(button.parentElement!==nowRow)nowRow.appendChild(button);
    button.removeAttribute('role');button.removeAttribute('aria-selected');
  });
  nowRow.hidden=!nowRow.querySelector('.sky-where-when-action');
  actions.dataset.skyTabsPolished='true';
}
function syncTabs(slot){
  const actions=panel(slot)?.querySelector('.sky-where-when-actions'),mode=viewState()[slot];
  if(!actions)return;
  const harmonic=actions.querySelector('[data-ww-action="harmonics"]');
  if(harmonic)harmonic.setAttribute('aria-pressed',mode==='harmonics'?'true':'false');
  if(mode==='harmonics')actions.querySelectorAll('.sky-card-view-tabs .sky-where-when-action:not([data-ww-action="harmonics"])').forEach(button=>button.setAttribute('aria-pressed','false'));
  actions.querySelectorAll('.sky-card-view-tabs .sky-where-when-action').forEach(button=>button.setAttribute('aria-selected',button.getAttribute('aria-pressed')==='true'?'true':'false'));
}
function spectrumButton(metric,current){
  return`<button type="button" class="sky-fold-spectrum-row" data-fold-order="${metric.order}" aria-pressed="${metric.order===current?'true':'false'}"><span class="sky-fold-name">${fold(metric.order)}</span><span class="sky-fold-axis" aria-label="Resistance ${percent(metric.resistance)}, support ${percent(metric.support)}"><span class="sky-fold-half"><span style="width:${percent(metric.resistance)}"></span></span><span class="sky-fold-half"><span style="width:${percent(metric.support)}"></span></span></span><span class="sky-fold-net">${signed(metric.net)}</span><span class="sky-fold-hits">${metric.primitiveWindowHits} hit${metric.primitiveWindowHits===1?'':'s'}</span></button>`;
}
function topologyMarkup(prov){
  if(!prov.recognizedCount)return'<div class="sky-fold-stat"><strong>No recognized hits</strong><span>The field still includes every pair.</span></div>';
  const hub=prov.hub?`${esc(prov.hub.label)} · ${prov.hub.degree}/${prov.recognizedCount}`:'None';
  return`<div class="sky-fold-stat"><strong>${prov.participantCount} placements</strong><span>recognized participation</span></div><div class="sky-fold-stat"><strong>${hub}</strong><span>busiest recognized hub</span></div><div class="sky-fold-stat"><strong>${prov.componentCount} components · ${prov.isolatedLinks} isolated · ${prov.cycleRank} loops</strong><span>recognized topology</span></div>`;
}
function recognizedMarkup(prov){
  if(!prov.recognized.length)return'<div class="sky-fold-structure">No primitive relationships fall inside the current Harmonic Window.</div>';
  return prov.recognized.map(pair=>`<div class="sky-fold-structure"><span>${pairText(pair)}</span><small>${phase(pair)} phase error</small><strong>${contribution(pair)}</strong></div>`).join('');
}
function pressureItems(pairs){
  if(!pairs.length)return'<div class="sky-fold-pressure-item"><span>No dominant pair</span><strong>—</strong></div>';
  return pairs.map(pair=>`<div class="sky-fold-pressure-item"><span>${pairText(pair)}</span><strong>${contribution(pair)}</strong></div>`).join('');
}
function detail(metric){
  const provenance=window.RelphiHarmonicProvenance?.analyze(metric,'single');
  if(!provenance)return'';
  return`<div class="sky-fold-diagnosis"><div><h4>${fold(metric.order)} anatomy</h4><p class="sky-fold-status">${status(metric)} · ${metric.primitiveWindowHits} recognized primitive hit${metric.primitiveWindowHits===1?'':'s'}</p></div><strong>${signed(metric.net)}</strong></div><div class="sky-fold-anatomy">${topologyMarkup(provenance)}</div><details class="sky-fold-side-more"><summary>Explore anatomy</summary><div class="sky-fold-side-more-body"><section class="sky-fold-section"><h5>Recognized structure · closest first</h5><div class="sky-fold-structure-list">${recognizedMarkup(provenance)}</div></section><section class="sky-fold-section"><h5>Whole-field pressure</h5><div class="sky-fold-pressure-grid"><div class="sky-fold-pressure-card"><h6>Strongest support</h6>${pressureItems(provenance.supporters)}</div><div class="sky-fold-pressure-card"><h6>Strongest resistance</h6>${pressureItems(provenance.resistors)}</div></div></section></div></details>`;
}
function render(slot){
  const core=window.RelphiCollectiveHarmonicsCore,{view}=nodes(slot);
  if(!core||!view)return;
  const list=records(read(KEYS[slot])),windowValue=activeWindow();
  if(list.length<2){view.innerHTML='<section class="sky-fold-view"><div class="sky-fold-head"><div><h3>Collective Harmonics</h3><p>Whole-field phase balance</p></div></div><p>At least two independent core placements are needed.</p></section>';return}
  const spectrum=core.spectrum(list,windowValue,12);
  if(selected[slot]!=null&&!spectrum.some(item=>item.order===selected[slot]))selected[slot]=null;
  const current=selected[slot]==null?null:spectrum.find(item=>item.order===selected[slot]);
  view.innerHTML=`<section class="sky-fold-view" data-collective-sky="${slot}"><header class="sky-fold-head"><div><h3>Collective Harmonics</h3><p>Field diagnosis across ${list.length} independent core placements</p></div><span class="sky-fold-window">Window ${windowValue}°</span></header><div class="sky-fold-spectrum" aria-label="Twofold through Twelvefold harmonic spectrum">${spectrum.map(metric=>spectrumButton(metric,current?.order??null)).join('')}</div>${current?detail(current):'<div class="sky-fold-selection-hint">Select a fold to inspect its anatomy.</div>'}<details class="sky-fold-method"><summary>Method and scope</summary><p>Field scores use every independent pair. The Harmonic Window only controls which primitive relationships are recognized in the structure list. Provenance reports graph anatomy without assigning extra astrological meaning to hubs, components, or loops. South Node, angles, Vertex, and Part of Fortune remain available in ordinary relationship analysis but are excluded from this collective core so dependent geometry does not manufacture field structure.</p></details></section>`;
}
function show(slot){
  const {placement,view}=nodes(slot);
  if(!placement||!view)return;
  writeView(slot,'harmonics');placement.hidden=true;view.hidden=false;render(slot);syncTabs(slot);
}
function hydrate(){
  installStyles();
  ['A','B'].forEach(slot=>{ensureTab(slot);beautifyTabs(slot);if(viewState()[slot]==='harmonics')show(slot);else syncTabs(slot)});
}
function schedule(){
  if(queued)return;queued=true;
  requestAnimationFrame(()=>{queued=false;hydrate();['A','B'].forEach(slot=>{if(viewState()[slot]==='harmonics')render(slot)})});
}
document.addEventListener('click',event=>{
  const harmonicTab=event.target.closest('.sky-where-when-actions [data-ww-action="harmonics"]');
  if(harmonicTab){const slot=harmonicTab.closest('#skyFoundationA')?'A':harmonicTab.closest('#skyFoundationB')?'B':'';if(!slot)return;event.preventDefault();event.stopImmediatePropagation();show(slot);return}
  const foldButton=event.target.closest('.sky-fold-spectrum-row[data-fold-order]');
  if(foldButton){const slot=foldButton.closest('[data-collective-sky]')?.dataset.collectiveSky;if(!slot)return;const order=Number(foldButton.dataset.foldOrder);selected[slot]=selected[slot]===order?null:order;render(slot);return}
  const other=event.target.closest('.sky-where-when-actions [data-ww-action]');
  if(other){const slot=other.closest('#skyFoundationA')?'A':other.closest('#skyFoundationB')?'B':'';if(slot)requestAnimationFrame(()=>syncTabs(slot))}
},true);
['relphi:sky-foundation-ready','relphi:sky-harmonic-window-visibility-changed','relphi:sky-foundation-interactions-ready'].forEach(name=>window.addEventListener(name,schedule));
window.addEventListener('storage',event=>{if(!event.key||event.key===KEYS.A||event.key===KEYS.B)schedule()});
window.RelphiCollectiveHarmonicsUI=Object.freeze({show,render,hydrate});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',hydrate,{once:true}):hydrate();
})();
