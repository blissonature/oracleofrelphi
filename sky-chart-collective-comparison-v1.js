// Comparison harmonics: tabbed cross-field diagnosis with fold-level provenance.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiCollectiveComparisonV3)return;
window.__relphiCollectiveComparisonV3=true;
window.__relphiCollectiveComparisonV2=true;
window.__relphiCollectiveComparisonV1=true;

const CORE_IDS=Object.freeze(['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','chiron','north-node','lilith']);
const CORE_SET=new Set(CORE_IDS);
const KEYS=Object.freeze({A:'relphiSkyChartA',B:'relphiSkyChartB'});
const STATE_KEY='relphiSkyComparisonViewV1';
const ALIASES=Object.freeze({sol:'sun',luna:'moon',node:'north-node','true-node':'north-node','north-node':'north-node',blackmoon:'lilith','black-moon':'lilith'});
const FOLD=Object.freeze({1:'Onefold',2:'Twofold',3:'Threefold',4:'Fourfold',5:'Fivefold',6:'Sixfold',7:'Sevenfold',8:'Eightfold',9:'Ninefold',10:'Tenfold',11:'Elevenfold',12:'Twelvefold'});
let selected=null,queued=false;

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch]));
const norm=value=>((Number(value)%360)+360)%360;
const slug=value=>String(value??'').trim().toLowerCase().replace(/[\s_]+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-');
const fold=order=>FOLD[order]||`${order}-fold`;

function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
function mode(){try{return sessionStorage.getItem(STATE_KEY)||'relationships'}catch(_){return'relationships'}}
function writeMode(value){try{sessionStorage.setItem(STATE_KEY,value)}catch(_){}}
function placementSource(payload){
  if(!payload||typeof payload!=='object')return[];
  const known=[payload.placements,payload.positions,payload.points,payload.bodies].find(value=>value&&typeof value==='object'),source=known||payload;
  if(Array.isArray(source))return source.map((item,index)=>[String(item?.name||item?.label||item?.body||item?.planet||item?.point||item?.id||index),item]);
  return Object.entries(source).filter(([key,value])=>value&&typeof value==='object'&&!Array.isArray(value)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key));
}
function longitude(item){
  if(!item)return NaN;
  if(Number.isFinite(Number(item.longitude)))return norm(item.longitude);
  const signs=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'],sign=signs.indexOf(String(item.sign||item.zodiac||'').trim().toLowerCase());
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
function pairText(pair){return`${esc(pair.left.name)} → ${esc(pair.right.name)}`}
function contribution(pair){const n=Math.round((Number(pair?.contribution)||0)*100);return`${n>0?'+':''}${n}%`}
function phase(pair){return`${Math.round((Number(pair?.phaseDistance)||0)*10)/10}°`}

function installStyles(){
  let style=document.getElementById('relphiCollectiveComparisonStyles');
  if(!style){style=document.createElement('style');style.id='relphiCollectiveComparisonStyles';document.head.appendChild(style)}
  style.textContent=`
  .sky-comparison-tabs{display:grid;grid-template-columns:1fr 1fr;gap:3px;margin:.75rem .75rem 0;padding:3px;border:1px solid #d8d1ca;border-radius:13px;background:#f2eee9;box-shadow:inset 0 1px 0 rgba(255,255,255,.82)}
  .sky-comparison-tab{appearance:none;min-height:32px;border:1px solid transparent;border-radius:9px;background:transparent;color:#4a433d;padding:.4rem .6rem;font:850 .65rem/1 system-ui,sans-serif;cursor:pointer;transition:background .14s ease,border-color .14s ease,box-shadow .14s ease}
  .sky-comparison-tab:hover{background:rgba(255,255,255,.65);color:#211d19}.sky-comparison-tab:focus-visible{outline:2px solid #a9a19a;outline-offset:1px}.sky-comparison-tab[aria-pressed="true"]{border-color:#d1c9c2;background:#fff;color:#201c18;box-shadow:0 1px 3px rgba(34,27,22,.12),inset 0 -2px 0 #6f6862}
  .sky-comparison-harmonics-host{margin:.5rem .75rem 1rem}.sky-comparison-harmonics-host[hidden]{display:none}.sky-comparison-harmonics-host .sky-fold-view{padding:0}.sky-comparison-harmonics-host .sky-fold-selection-hint{margin-top:.3rem}
  .sky-fold-components{display:grid;gap:.28rem}.sky-fold-component{display:flex;justify-content:space-between;gap:.5rem;padding:.32rem .42rem;border-radius:7px;background:#f5f1ed;color:#645c56;font:700 .58rem/1.2 system-ui,sans-serif}.sky-fold-all-hits{color:#625a54;font:650 .6rem/1.35 system-ui,sans-serif}.sky-fold-all-hits summary{cursor:pointer;font-weight:850;margin-top:.1rem}.sky-fold-all-hits .sky-fold-structure-list{margin-top:.35rem}
  `;
}
function ensureShell(){
  const panel=document.getElementById('skyFoundationComparison'),relationships=document.getElementById('skyFoundationRelationships');
  if(!panel||!relationships||!relationships.parentElement)return null;
  let tabs=panel.querySelector('.sky-comparison-tabs');
  if(!tabs){
    tabs=document.createElement('div');tabs.className='sky-comparison-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Comparison result view');
    tabs.innerHTML='<button type="button" role="tab" class="sky-comparison-tab" data-comparison-view="relationships">Relationships</button><button type="button" role="tab" class="sky-comparison-tab" data-comparison-view="harmonics">Harmonics</button>';
    relationships.parentElement.insertBefore(tabs,relationships);
  }
  let host=panel.querySelector('.sky-comparison-harmonics-host');
  if(!host){host=document.createElement('section');host.className='sky-comparison-harmonics-host';host.hidden=true;relationships.parentElement.insertBefore(host,relationships)}
  return{panel,relationships,tabs,host};
}
function sync(){
  const shell=ensureShell();if(!shell)return;
  const current=mode();
  shell.tabs.querySelectorAll('[data-comparison-view]').forEach(button=>{
    const active=button.dataset.comparisonView===current;
    button.setAttribute('aria-pressed',active?'true':'false');button.setAttribute('aria-selected',active?'true':'false');
  });
  shell.relationships.hidden=current==='harmonics';shell.host.hidden=current!=='harmonics';
  if(current==='harmonics')render();
}
function spectrumButton(metric,current){
  return`<button type="button" class="sky-fold-spectrum-row" data-comparison-fold="${metric.order}" aria-pressed="${metric.order===current?'true':'false'}"><span class="sky-fold-name">${fold(metric.order)}</span><span class="sky-fold-axis" aria-label="Resistance ${percent(metric.resistance)}, support ${percent(metric.support)}"><span class="sky-fold-half"><span style="width:${percent(metric.resistance)}"></span></span><span class="sky-fold-half"><span style="width:${percent(metric.support)}"></span></span></span><span class="sky-fold-net">${signed(metric.net)}</span><span class="sky-fold-hits">${metric.primitiveWindowHits} hit${metric.primitiveWindowHits===1?'':'s'}</span></button>`;
}
function topology(prov){
  if(!prov.recognizedCount)return'<div class="sky-fold-stat"><strong>No recognized primitive cross-hits</strong>The field score still includes every cross-pair.</div>';
  const hub=prov.hub?`${esc(prov.hub.label)} · ${prov.hub.degree}/${prov.recognizedCount} hits`:'None';
  return`<div class="sky-fold-stat"><strong>${prov.participantCount} placements</strong>participate in recognized cross-hits</div><div class="sky-fold-stat"><strong>${hub}</strong>busiest recognized hub</div><div class="sky-fold-stat"><strong>${prov.componentCount} component${prov.componentCount===1?'':'s'} · ${prov.isolatedLinks} isolated · ${prov.cycleRank} loop${prov.cycleRank===1?'':'s'}</strong>recognized-hit topology</div>`;
}
function structureRows(pairs){
  if(!pairs.length)return'<div class="sky-fold-structure">No primitive relationships fall inside the current Harmonic Window.</div>';
  return pairs.map(pair=>`<div class="sky-fold-structure"><span>${pairText(pair)}</span><small>${phase(pair)} phase error</small><strong>${contribution(pair)}</strong></div>`).join('');
}
function componentRows(prov){
  if(!prov.components.length)return'';
  return prov.components.map((component,index)=>`<div class="sky-fold-component"><span>Structure ${index+1}</span><span>${component.nodeCount} placements · ${component.edgeCount} links${component.cycleRank?` · ${component.cycleRank} loop${component.cycleRank===1?'':'s'}`:''}</span></div>`).join('');
}
function pressureItems(pairs){
  if(!pairs.length)return'<div class="sky-fold-pressure-item"><span>No dominant pair</span><strong>—</strong></div>';
  return pairs.map(pair=>`<div class="sky-fold-pressure-item"><span>${pairText(pair)}</span><strong>${contribution(pair)}</strong></div>`).join('');
}
function detail(metric){
  const prov=window.RelphiHarmonicProvenance?.analyze(metric,'cross');if(!prov)return'';
  const closest=prov.recognized.slice(0,4);
  return`<div class="sky-fold-diagnosis"><div><h4>${fold(metric.order)} anatomy</h4><p class="sky-fold-status">${status(metric)} · Window recognizes ${metric.primitiveWindowHits} primitive cross-hit${metric.primitiveWindowHits===1?'':'s'}; field score uses every cross-pair.</p></div><strong>${signed(metric.net)}</strong></div><div class="sky-fold-anatomy">${topology(prov)}</div>${prov.components.length?`<section class="sky-fold-section"><h5>Recognized topology</h5><div class="sky-fold-components">${componentRows(prov)}</div></section>`:''}<section class="sky-fold-section"><h5>Closest recognized cross-hits</h5><div class="sky-fold-structure-list">${structureRows(closest)}</div>${prov.recognized.length>closest.length?`<details class="sky-fold-all-hits"><summary>All ${prov.recognized.length} recognized cross-hits</summary><div class="sky-fold-structure-list">${structureRows(prov.recognized)}</div></details>`:''}</section><section class="sky-fold-section"><h5>Whole-field pressure</h5><div class="sky-fold-pressure-grid"><div class="sky-fold-pressure-card"><h6>Strongest support</h6>${pressureItems(prov.supporters)}</div><div class="sky-fold-pressure-card"><h6>Strongest resistance</h6>${pressureItems(prov.resistors)}</div></div></section>`;
}
function render(){
  const shell=ensureShell(),core=window.RelphiCollectiveHarmonicsCore;
  if(!shell||!core||mode()!=='harmonics')return;
  const a=records(read(KEYS.A)),b=records(read(KEYS.B)),windowValue=activeWindow();
  if(a.length<2||b.length<2){shell.host.innerHTML='<section class="sky-fold-view"><div class="sky-fold-head"><div><h3>Comparison Harmonics</h3><p>Whole-field Sky A × Sky B phase balance</p></div></div><p>Both skies need at least two independent core placements.</p></section>';return}
  const spectrum=core.crossSpectrum(a,b,windowValue,12);
  if(selected!=null&&!spectrum.some(item=>item.order===selected))selected=null;
  const current=selected==null?null:spectrum.find(item=>item.order===selected);
  shell.host.innerHTML=`<section class="sky-fold-view" data-comparison-harmonics="true"><header class="sky-fold-head"><div><h3>Comparison Harmonics</h3><p>${a.length} × ${b.length} = ${a.length*b.length} independent cross-pairs</p></div><span class="sky-fold-window">Window ${windowValue}°</span></header><div class="sky-fold-spectrum" aria-label="Twofold through Twelvefold comparison harmonic spectrum">${spectrum.map(metric=>spectrumButton(metric,current?.order??null)).join('')}</div>${current?detail(current):'<div class="sky-fold-selection-hint">Select a fold to reveal its provenance.</div>'}<details class="sky-fold-method"><summary>Method and scope</summary><p>The field score uses every independent Sky A × Sky B pair; the Harmonic Window only changes which primitive cross-hits appear in recognized structure. Provenance reports where the result comes from: participating placements, hub concentration, connected components, closest recognized hits, and the pairs contributing the strongest support and resistance. Topology is descriptive geometry, not an added astrological weight.</p></details></section>`;
}
function show(value){writeMode(value==='harmonics'?'harmonics':'relationships');sync()}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync()})}
document.addEventListener('click',event=>{
  const tab=event.target.closest('.sky-comparison-tab[data-comparison-view]');
  if(tab){event.preventDefault();show(tab.dataset.comparisonView);return}
  const foldButton=event.target.closest('[data-comparison-fold]');
  if(foldButton){const order=Number(foldButton.dataset.comparisonFold);selected=selected===order?null:order;render()}
},true);
['relphi:sky-foundation-ready','relphi:sky-harmonic-window-visibility-changed','relphi:sky-foundation-interactions-ready'].forEach(name=>window.addEventListener(name,schedule));
window.addEventListener('storage',event=>{if(!event.key||event.key===KEYS.A||event.key===KEYS.B)schedule()});
window.RelphiCollectiveComparisonUI=Object.freeze({show,render,sync});
function start(){installStyles();sync()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
