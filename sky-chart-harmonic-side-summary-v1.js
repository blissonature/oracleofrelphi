// Compact Sky A/B harmonic signature with a full-width field inspector.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiHarmonicSideSummaryV1)return;
window.__relphiHarmonicSideSummaryV1=true;

const CORE_IDS=Object.freeze(['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','chiron','north-node','lilith']);
const CORE_SET=new Set(CORE_IDS);
const KEYS=Object.freeze({A:'relphiSkyChartA',B:'relphiSkyChartB'});
const FOLD=Object.freeze({2:'Twofold',3:'Threefold',4:'Fourfold',5:'Fivefold',6:'Sixfold',7:'Sevenfold',8:'Eightfold',9:'Ninefold',10:'Tenfold',11:'Elevenfold',12:'Twelvefold'});
const ALIASES=Object.freeze({sol:'sun',luna:'moon',node:'north-node','true-node':'north-node','north-node':'north-node',blackmoon:'lilith','black-moon':'lilith'});
let openState=null;

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch]));
const slug=value=>String(value??'').trim().toLowerCase().replace(/[\s_]+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-');
const norm=value=>((Number(value)%360)+360)%360;
const fold=order=>FOLD[order]||`${order}-fold`;
const signed=value=>{const n=Math.round((Number(value)||0)*100);return`${n>0?'+':''}${n}%`};
const pct=value=>`${Math.round(Math.max(0,Math.min(1,Number(value)||0))*100)}%`;

function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
function source(payload){
  if(!payload||typeof payload!=='object')return[];
  const known=[payload.placements,payload.positions,payload.points,payload.bodies].find(value=>value&&typeof value==='object'),value=known||payload;
  if(Array.isArray(value))return value.map((item,index)=>[String(item?.name||item?.label||item?.body||item?.planet||item?.point||item?.id||index),item]);
  return Object.entries(value).filter(([key,item])=>item&&typeof item==='object'&&!Array.isArray(item)&&!/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key));
}
function longitude(item){
  if(!item)return NaN;
  if(Number.isFinite(Number(item.longitude)))return norm(item.longitude);
  const signs=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  const sign=signs.indexOf(String(item.sign||item.zodiac||'').trim().toLowerCase());
  return sign<0?NaN:norm(sign*30+Number(item.degree||item.degrees||0)+Number(item.minute||item.minutes||0)/60+Number(item.second||item.seconds||0)/3600);
}
function canonical(key,item){
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
  source(payload).forEach(([key,item])=>{
    const id=canonical(key,item),value=longitude(item);
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
function spectrum(slot){
  const core=window.RelphiCollectiveHarmonicsCore,list=records(read(KEYS[slot])),windowValue=activeWindow();
  if(!core||list.length<2)return{list,windowValue,metrics:[]};
  return{list,windowValue,metrics:core.spectrum(list,windowValue,12)};
}
function status(metric){
  const shown=Math.round((Number(metric.net)||0)*100);
  if(shown===0)return metric.primitiveWindowHits?`Balanced despite ${metric.primitiveWindowHits} recognized hits`:'Balanced';
  if(metric.distinctive>1e-6)return'Distinctive field';
  if(metric.inheritedFrom&&metric.alignment>1e-6)return`Inherited from ${fold(metric.inheritedFrom)}`;
  return metric.net<0?'Resistance leads':'Mixed field';
}
function installStyles(){
  if(document.getElementById('relphiHarmonicSideSummaryStyles'))return;
  const style=document.createElement('style');style.id='relphiHarmonicSideSummaryStyles';style.textContent=`
  .sky-harmonic-signature{display:grid;gap:.65rem;padding:10px;color:#241f1b}
  .sky-harmonic-signature-head{display:flex;align-items:flex-start;justify-content:space-between;gap:.55rem}.sky-harmonic-signature-head h3{margin:0;font:900 .84rem/1.15 system-ui,sans-serif}.sky-harmonic-signature-head p{margin:.18rem 0 0;color:#6a625c;font:650 .62rem/1.35 system-ui,sans-serif}.sky-harmonic-signature-window{flex:none;border-radius:999px;background:#f0ece7;padding:.24rem .42rem;color:#514943;font:800 .6rem/1 system-ui,sans-serif}
  .sky-harmonic-signature-list{display:grid;gap:.34rem}.sky-harmonic-signature-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.12rem .45rem;padding:.5rem .55rem;border:1px solid rgba(31,27,24,.1);border-radius:10px;background:#fffdfa}.sky-harmonic-signature-name{font:900 .72rem/1.1 system-ui,sans-serif}.sky-harmonic-signature-net{font:950 .82rem/1 system-ui,sans-serif;font-variant-numeric:tabular-nums}.sky-harmonic-signature-status{grid-column:1/-1;color:#756d66;font:700 .58rem/1.2 system-ui,sans-serif}
  .sky-harmonic-open{appearance:none;width:100%;border:1px solid color-mix(in srgb,var(--slot-color,#6f6862) 28%,#d4cdc6);border-radius:10px;background:color-mix(in srgb,var(--slot-color,#6f6862) 6%,#fff);padding:.55rem .65rem;color:#302b27;font:900 .66rem/1 system-ui,sans-serif;cursor:pointer;box-shadow:0 1px 2px rgba(34,27,22,.06)}.sky-harmonic-open:hover{background:color-mix(in srgb,var(--slot-color,#6f6862) 10%,#fff);box-shadow:0 2px 5px rgba(34,27,22,.09)}
  .sky-harmonic-signature-method{color:#6a625c;font:650 .58rem/1.35 system-ui,sans-serif}.sky-harmonic-signature-method summary{cursor:pointer;font-weight:850}
  .sky-harmonic-inspector{width:min(760px,calc(100vw - 28px));max-height:min(86vh,900px);padding:0;border:1px solid #d2cbc4;border-radius:16px;background:#fbf9f6;color:#211d19;box-shadow:0 24px 70px rgba(29,24,20,.25);overflow:hidden}.sky-harmonic-inspector::backdrop{background:rgba(30,26,22,.36);backdrop-filter:blur(2px)}
  .sky-harmonic-inspector-shell{display:grid;grid-template-rows:auto minmax(0,1fr);max-height:min(86vh,900px)}.sky-harmonic-inspector-head{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.8rem .95rem;border-bottom:1px solid #ddd6cf;background:#fff}.sky-harmonic-inspector-head h3{margin:0;font:950 1rem/1.15 system-ui,sans-serif}.sky-harmonic-inspector-head p{margin:.17rem 0 0;color:#6f675f;font:650 .67rem/1.25 system-ui,sans-serif}.sky-harmonic-inspector-close{appearance:none;width:32px;height:32px;border:1px solid #d2cbc4;border-radius:999px;background:#fff;color:#3e3833;font:900 1rem/1 system-ui,sans-serif;cursor:pointer}.sky-harmonic-inspector-body{overflow:auto;padding:.85rem .95rem 1rem}
  .sky-side-modal-spectrum{display:grid;gap:.26rem}.sky-side-modal-spectrum-row{display:grid;grid-template-columns:92px minmax(150px,1fr) 48px 56px;align-items:center;gap:.5rem;width:100%;padding:.42rem .48rem;border:1px solid transparent;border-radius:9px;background:transparent;color:inherit;text-align:left;cursor:pointer}.sky-side-modal-spectrum-row:hover,.sky-side-modal-spectrum-row:focus-visible{outline:0;background:#f3efea;border-color:#ddd5ce}.sky-side-modal-spectrum-row[aria-pressed="true"]{background:#fff;border-color:#77706a;box-shadow:0 0 0 1px rgba(31,27,24,.06)}
  .sky-side-modal-name{font:900 .7rem/1.1 system-ui,sans-serif}.sky-side-modal-axis{display:grid;grid-template-columns:1fr 1fr;height:8px;position:relative}.sky-side-modal-axis::after{content:"";position:absolute;left:50%;top:-2px;bottom:-2px;width:1px;background:#716b66}.sky-side-modal-half{position:relative;overflow:hidden;background:#eee9e4}.sky-side-modal-half:first-child{border-radius:999px 0 0 999px}.sky-side-modal-half:last-child{border-radius:0 999px 999px 0}.sky-side-modal-half span{position:absolute;top:0;bottom:0}.sky-side-modal-half:first-child span{right:0;background:#aaa39d}.sky-side-modal-half:last-child span{left:0;background:#4f4a46}.sky-side-modal-net{text-align:right;font:950 .72rem/1 system-ui,sans-serif}.sky-side-modal-hits{justify-self:end;border-radius:999px;background:#eeeae5;padding:.2rem .35rem;color:#625b55;font:800 .58rem/1 system-ui,sans-serif;white-space:nowrap}
  .sky-side-modal-hint{margin:.5rem 0 0;padding:.6rem 0 0;border-top:1px solid #e2dcd6;text-align:center;color:#756d66;font:700 .62rem/1.3 system-ui,sans-serif}
  .sky-side-modal-detail{display:grid;gap:.65rem;margin-top:.7rem;padding-top:.7rem;border-top:1px solid #ddd7d0}.sky-side-modal-diagnosis{display:flex;align-items:baseline;justify-content:space-between;gap:1rem}.sky-side-modal-diagnosis h4{margin:0;font:950 .86rem/1.15 system-ui,sans-serif}.sky-side-modal-diagnosis p{margin:.15rem 0 0;color:#6f675f;font:700 .62rem/1.3 system-ui,sans-serif}.sky-side-modal-diagnosis strong{font:950 1rem/1 system-ui,sans-serif}
  .sky-side-modal-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.4rem}.sky-side-modal-stat{padding:.52rem .56rem;border:1px solid #e0d9d2;border-radius:9px;background:#fff;color:#6b635c;font:650 .6rem/1.25 system-ui,sans-serif}.sky-side-modal-stat strong{display:block;margin-bottom:.1rem;color:#201c18;font:900 .72rem/1.15 system-ui,sans-serif}
  .sky-side-modal-section{display:grid;gap:.34rem}.sky-side-modal-section h5{margin:0;font:900 .68rem/1.1 system-ui,sans-serif}.sky-side-modal-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:.5rem;align-items:center;padding:.42rem .5rem;border-radius:8px;background:#f3efea;font:700 .61rem/1.2 system-ui,sans-serif}.sky-side-modal-row small{color:#716861;font:700 .57rem/1 system-ui,sans-serif}.sky-side-modal-pressure{display:grid;grid-template-columns:1fr 1fr;gap:.42rem}.sky-side-modal-card{padding:.52rem .56rem;border:1px solid #e0d9d2;border-radius:9px;background:#fff}.sky-side-modal-card h6{margin:0 0 .3rem;font:900 .64rem/1.1 system-ui,sans-serif}.sky-side-modal-pressure-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.4rem;padding:.26rem 0;border-top:1px solid #eee8e2;font:700 .59rem/1.2 system-ui,sans-serif}.sky-side-modal-pressure-row:first-of-type{border-top:0}
  .sky-side-modal-method{margin-top:.7rem;color:#665e57;font:650 .61rem/1.4 system-ui,sans-serif}.sky-side-modal-method summary{cursor:pointer;font-weight:850}
  @media(max-width:620px){.sky-side-modal-spectrum-row{grid-template-columns:76px 1fr 42px}.sky-side-modal-hits{grid-column:2/4;justify-self:start}.sky-side-modal-stats,.sky-side-modal-pressure{grid-template-columns:1fr}}
  `;document.head.appendChild(style);
}
function pairText(pair){return`${esc(pair.left.name)} × ${esc(pair.right.name)}`}
function phase(pair){return`${Math.round((Number(pair?.phaseDistance)||0)*10)/10}°`}
function contribution(pair){const n=Math.round((Number(pair?.contribution)||0)*100);return`${n>0?'+':''}${n}%`}
function signatureMarkup(slot){
  const {list,windowValue,metrics}=spectrum(slot);
  if(!metrics.length)return`<section class="sky-harmonic-signature" data-side-harmonic-signature="${slot}"><header class="sky-harmonic-signature-head"><div><h3>Collective Harmonics</h3><p>Whole-field signature</p></div></header><p>At least two independent core placements are needed.</p></section>`;
  const leaders=[...metrics].sort((a,b)=>Math.abs(b.net)-Math.abs(a.net)||b.distinctive-a.distinctive||a.order-b.order).slice(0,3);
  return`<section class="sky-harmonic-signature" data-side-harmonic-signature="${slot}"><header class="sky-harmonic-signature-head"><div><h3>Collective Harmonics</h3><p>${list.length} independent core placements · strongest field signals</p></div><span class="sky-harmonic-signature-window">Window ${windowValue}°</span></header><div class="sky-harmonic-signature-list">${leaders.map(metric=>`<div class="sky-harmonic-signature-item"><span class="sky-harmonic-signature-name">${fold(metric.order)}</span><strong class="sky-harmonic-signature-net">${signed(metric.net)}</strong><span class="sky-harmonic-signature-status">${status(metric)} · ${metric.primitiveWindowHits} recognized hit${metric.primitiveWindowHits===1?'':'s'}</span></div>`).join('')}</div><button type="button" class="sky-harmonic-open" data-open-harmonic-field="${slot}">View full harmonic field</button><details class="sky-harmonic-signature-method"><summary>Method and scope</summary><p>Field scores use every independent pair. The Harmonic Window controls recognition, not the field score.</p></details></section>`;
}
function compactSide(root){
  const slot=root?.dataset?.collectiveSky;
  if(!slot||!['A','B'].includes(slot)||root.dataset.sideCompact==='true')return;
  root.dataset.sideCompact='true';root.innerHTML=signatureMarkup(slot);
}
function compactVisible(){document.querySelectorAll('#skyFoundationA .sky-fold-view[data-collective-sky],#skyFoundationB .sky-fold-view[data-collective-sky]').forEach(compactSide)}
function modalRow(metric,current){return`<button type="button" class="sky-side-modal-spectrum-row" data-side-modal-fold="${metric.order}" aria-pressed="${metric.order===current?'true':'false'}"><span class="sky-side-modal-name">${fold(metric.order)}</span><span class="sky-side-modal-axis" aria-label="Resistance ${pct(metric.resistance)}, support ${pct(metric.support)}"><span class="sky-side-modal-half"><span style="width:${pct(metric.resistance)}"></span></span><span class="sky-side-modal-half"><span style="width:${pct(metric.support)}"></span></span></span><span class="sky-side-modal-net">${signed(metric.net)}</span><span class="sky-side-modal-hits">${metric.primitiveWindowHits} hit${metric.primitiveWindowHits===1?'':'s'}</span></button>`}
function topology(prov){
  if(!prov.recognizedCount)return'<div class="sky-side-modal-stat"><strong>No recognized hits</strong><span>The field score still includes every pair.</span></div>';
  const hub=prov.hub?`${esc(prov.hub.label)} · ${prov.hub.degree}/${prov.recognizedCount}`:'None';
  return`<div class="sky-side-modal-stat"><strong>${prov.participantCount} placements</strong><span>recognized participation</span></div><div class="sky-side-modal-stat"><strong>${hub}</strong><span>busiest recognized hub</span></div><div class="sky-side-modal-stat"><strong>${prov.componentCount} components · ${prov.isolatedLinks} isolated · ${prov.cycleRank} loops</strong><span>recognized topology</span></div>`;
}
function recognized(prov){
  if(!prov.recognized.length)return'<div class="sky-side-modal-row"><span>No primitive relationships fall inside the current Harmonic Window.</span></div>';
  return prov.recognized.map(pair=>`<div class="sky-side-modal-row"><span>${pairText(pair)}</span><small>${phase(pair)} phase error</small><strong>${contribution(pair)}</strong></div>`).join('');
}
function pressure(pairs){
  if(!pairs.length)return'<div class="sky-side-modal-pressure-row"><span>No dominant pair</span><strong>—</strong></div>';
  return pairs.map(pair=>`<div class="sky-side-modal-pressure-row"><span>${pairText(pair)}</span><strong>${contribution(pair)}</strong></div>`).join('');
}
function detail(metric){
  const prov=window.RelphiHarmonicProvenance?.analyze(metric,'single');
  if(!prov)return'';
  return`<section class="sky-side-modal-detail"><div class="sky-side-modal-diagnosis"><div><h4>${fold(metric.order)} anatomy</h4><p>${status(metric)} · ${metric.primitiveWindowHits} recognized primitive hit${metric.primitiveWindowHits===1?'':'s'}</p></div><strong>${signed(metric.net)}</strong></div><div class="sky-side-modal-stats">${topology(prov)}</div><section class="sky-side-modal-section"><h5>Recognized structure · closest first</h5>${recognized(prov)}</section><section class="sky-side-modal-section"><h5>Whole-field pressure</h5><div class="sky-side-modal-pressure"><div class="sky-side-modal-card"><h6>Strongest support</h6>${pressure(prov.supporters)}</div><div class="sky-side-modal-card"><h6>Strongest resistance</h6>${pressure(prov.resistors)}</div></div></section></section>`;
}
function ensureDialog(){
  let dialog=document.getElementById('skyHarmonicFieldInspector');
  if(dialog)return dialog;
  dialog=document.createElement('dialog');dialog.id='skyHarmonicFieldInspector';dialog.className='sky-harmonic-inspector';document.body.appendChild(dialog);
  dialog.addEventListener('click',event=>{if(event.target===dialog){closeDialog();return}const close=event.target.closest('[data-close-harmonic-inspector]');if(close){closeDialog();return}const row=event.target.closest('[data-side-modal-fold]');if(row&&openState){const order=Number(row.dataset.sideModalFold);openState.selected=openState.selected===order?null:order;renderDialog();}});
  dialog.addEventListener('close',()=>{openState=null});
  return dialog;
}
function renderDialog(){
  if(!openState)return;
  const dialog=ensureDialog(),{slot,selected}=openState,{list,windowValue,metrics}=spectrum(slot),current=selected==null?null:metrics.find(metric=>metric.order===selected);
  dialog.innerHTML=`<div class="sky-harmonic-inspector-shell"><header class="sky-harmonic-inspector-head"><div><h3>Sky ${slot} · Collective Harmonics</h3><p>${list.length} independent core placements · complete field spectrum</p></div><button type="button" class="sky-harmonic-inspector-close" data-close-harmonic-inspector aria-label="Close harmonic field">×</button></header><div class="sky-harmonic-inspector-body"><div class="sky-side-modal-spectrum">${metrics.map(metric=>modalRow(metric,current?.order??null)).join('')}</div>${current?detail(current):'<div class="sky-side-modal-hint">Select a fold to inspect its anatomy.</div>'}<details class="sky-side-modal-method"><summary>Method and scope</summary><p>Field scores use every independent pair. The Harmonic Window only determines which primitive relationships are recognized in the provenance view. South Node, angles, Vertex, and Part of Fortune remain available in ordinary relationship analysis but are excluded from this independent collective core.</p></details></div></div>`;
}
function openDialog(slot){openState={slot,selected:null};renderDialog();const dialog=ensureDialog();if(!dialog.open)dialog.showModal()}
function closeDialog(){const dialog=document.getElementById('skyHarmonicFieldInspector');if(dialog?.open)dialog.close();else openState=null}

installStyles();
const observer=new MutationObserver(()=>compactVisible());observer.observe(document.documentElement,{subtree:true,childList:true});
document.addEventListener('click',event=>{const button=event.target.closest('[data-open-harmonic-field]');if(!button)return;event.preventDefault();event.stopImmediatePropagation();openDialog(button.dataset.openHarmonicField)},true);
['relphi:sky-foundation-ready','relphi:sky-harmonic-window-visibility-changed','relphi:sky-foundation-interactions-ready'].forEach(name=>window.addEventListener(name,()=>requestAnimationFrame(compactVisible)));
window.addEventListener('storage',event=>{if(!event.key||event.key===KEYS.A||event.key===KEYS.B)requestAnimationFrame(compactVisible)});
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',compactVisible,{once:true}):compactVisible();
})();