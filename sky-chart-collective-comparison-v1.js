// Collective harmonic comparison: every independent Sky A × Sky B pair contributes.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiCollectiveComparisonV1)return;
  window.__relphiCollectiveComparisonV1=true;

  const CORE_IDS=Object.freeze(['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','chiron','north-node','lilith']);
  const CORE_SET=new Set(CORE_IDS);
  const KEYS=Object.freeze({A:'relphiSkyChartA',B:'relphiSkyChartB'});
  const ALIASES=Object.freeze({sol:'sun',luna:'moon',node:'north-node','true-node':'north-node','north-node':'north-node',blackmoon:'lilith','black-moon':'lilith'});
  const FOLD=Object.freeze({1:'Onefold',2:'Twofold',3:'Threefold',4:'Fourfold',5:'Fivefold',6:'Sixfold',7:'Sevenfold',8:'Eightfold',9:'Ninefold',10:'Tenfold',11:'Elevenfold',12:'Twelvefold'});
  let queued=false;

  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const slug=value=>String(value??'').trim().toLowerCase().replace(/[\s_]+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-');
  const norm=value=>((Number(value)%360)+360)%360;
  function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch(_){return null}}
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
    if(sign<0)return NaN;
    return norm(sign*30+Number(item.degree||item.degrees||0)+Number(item.minute||item.minutes||0)/60+Number(item.second||item.seconds||0)/3600);
  }
  function canonicalId(key,item){
    const registry=window.RelphiGlyphRegistry;
    for(const candidate of [item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key]){
      if(candidate==null)continue;
      const raw=slug(candidate),aliased=ALIASES[raw]||raw,entry=registry?.resolve?.(aliased)||registry?.get?.(aliased),id=slug(entry?.id||aliased);
      if(CORE_SET.has(id))return id;
    }
    return '';
  }
  function records(payload){
    const registry=window.RelphiGlyphRegistry,seen=new Set(),result=[];
    placementSource(payload).forEach(([key,item])=>{
      const id=canonicalId(key,item),value=longitude(item);
      if(!id||!Number.isFinite(value)||seen.has(id))return;
      seen.add(id);const entry=registry?.get?.(id)||registry?.resolve?.(id);
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
  function pct(value){return `${Math.round(Math.max(0,Math.min(1,Number(value)||0))*100)}%`}
  function signedPct(value){const n=Math.round((Number(value)||0)*100);return `${n>0?'+':''}${n}%`}
  function pairLabel(pair){return `${esc(pair.left.name)} → ${esc(pair.right.name)} · ${Math.round(pair.phaseDistance*10)/10}° phase error`}
  function fold(order){return FOLD[order]||`${order}-fold`}
  function installStyles(){
    let style=document.getElementById('relphiCollectiveComparisonStyles');
    if(!style){style=document.createElement('style');style.id='relphiCollectiveComparisonStyles';document.head.appendChild(style)}
    style.textContent=`
      .sky-collective-comparison{margin:.9rem .75rem 1rem;padding:.9rem;border:1px solid rgba(31,27,24,.14);border-radius:16px;background:#fffdfa;text-align:left}.sky-collective-comparison-head{display:flex;align-items:flex-start;justify-content:space-between;gap:.7rem;margin-bottom:.65rem}.sky-collective-comparison h3{margin:0;font-size:.92rem}.sky-collective-comparison-head p{margin:.2rem 0 0;color:#655d57;font-size:.72rem;line-height:1.35}.sky-collective-comparison-window{flex:none;padding:.25rem .45rem;border-radius:999px;background:#eee9e4;color:#514943;font-size:.68rem;font-weight:800}.sky-collective-comparison-note{margin:-.25rem 0 .7rem;color:#6b635d;font-size:.67rem;line-height:1.35}.sky-collective-comparison-list{display:grid;gap:.45rem}.sky-collective-comparison-row{border:1px solid rgba(31,27,24,.12);border-radius:11px;background:#fff;overflow:hidden}.sky-collective-comparison-row summary{list-style:none;cursor:pointer;padding:.58rem .65rem}.sky-collective-comparison-row summary::-webkit-details-marker{display:none}.sky-collective-comparison-row summary:focus-visible{outline:3px solid rgba(31,27,24,.18);outline-offset:-3px}.sky-collective-comparison-line{display:grid;grid-template-columns:minmax(76px,auto) minmax(0,1fr) auto;gap:.55rem;align-items:center}.sky-collective-comparison-fold{font-size:.79rem;font-weight:850;white-space:nowrap}.sky-collective-comparison-status{min-width:0;color:#5f5751;font-size:.69rem;line-height:1.25}.sky-collective-comparison-score{font-size:.8rem;font-weight:900;font-variant-numeric:tabular-nums}.sky-collective-comparison-pressure{display:grid;grid-template-columns:1fr 1fr;gap:0;height:7px;margin-top:.48rem;position:relative}.sky-collective-comparison-pressure::after{content:"";position:absolute;left:50%;top:-2px;bottom:-2px;width:1px;background:#6f6964}.sky-collective-comparison-half{position:relative;background:#eeeae5;overflow:hidden}.sky-collective-comparison-half:first-child{border-radius:999px 0 0 999px}.sky-collective-comparison-half:last-child{border-radius:0 999px 999px 0}.sky-collective-comparison-half span{position:absolute;top:0;bottom:0}.sky-collective-comparison-half:first-child span{right:0;background:#aaa39d}.sky-collective-comparison-half:last-child span{left:0;background:#4f4a46}.sky-collective-comparison-meta{display:flex;justify-content:space-between;gap:.7rem;margin-top:.32rem;color:#746c66;font-size:.64rem;line-height:1.2}.sky-collective-hit-badge{white-space:nowrap;font-weight:750}.sky-collective-comparison-detail{padding:.6rem .65rem .7rem;border-top:1px solid rgba(31,27,24,.09);background:#fffdf9;font-size:.69rem;line-height:1.45}.sky-collective-comparison-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.4rem;margin-bottom:.5rem}.sky-collective-comparison-metrics strong{display:block;font-size:.77rem}.sky-collective-comparison-pair{margin-top:.28rem;padding:.32rem .4rem;border-radius:8px;background:#f4f0eb}.sky-collective-comparison-method{margin-top:.55rem;color:#5f5751;font-size:.68rem;line-height:1.45}.sky-collective-comparison-method summary{cursor:pointer;font-weight:800}.sky-collective-comparison-method p{margin:.4rem 0 0}.sky-collective-comparison-empty{margin:.25rem 0;color:#68605a;font-size:.72rem}@media(max-width:700px){.sky-collective-comparison-head{display:block}.sky-collective-comparison-window{display:inline-block;margin-top:.35rem}.sky-collective-comparison-line{grid-template-columns:minmax(68px,auto) 1fr auto}.sky-collective-comparison-metrics{grid-template-columns:1fr 1fr}}
    `;
  }
  function status(metric){
    const shown=Math.round((Number(metric.net)||0)*100);
    if(shown===0)return metric.primitiveWindowHits>0?`Balanced despite ${metric.primitiveWindowHits} recognized hit${metric.primitiveWindowHits===1?'':'s'}`:'Balanced field';
    if(metric.distinctive>1e-6)return `Distinctive field`;
    if(metric.inheritedFrom&&metric.alignment>1e-6)return `Inherited from ${fold(metric.inheritedFrom)}`;
    if(metric.net<0)return `Resistance leads`;
    return 'Mixed field';
  }
  function row(metric){
    const supporters=metric.topSupport.filter(pair=>pair.contribution>.05).slice(0,2),resistors=metric.topResistance.filter(pair=>pair.contribution<-.05).slice(0,2);
    const pairRows=[...supporters.map(pair=>`<div class="sky-collective-comparison-pair"><strong>Supports:</strong> ${pairLabel(pair)}</div>`),...resistors.map(pair=>`<div class="sky-collective-comparison-pair"><strong>Resists:</strong> ${pairLabel(pair)}</div>`)].join('');
    return `<details class="sky-collective-comparison-row"><summary><div class="sky-collective-comparison-line"><span class="sky-collective-comparison-fold">${fold(metric.order)}</span><span class="sky-collective-comparison-status">${status(metric)}</span><span class="sky-collective-comparison-score">${signedPct(metric.net)}</span></div><div class="sky-collective-comparison-pressure" aria-label="Resistance ${pct(metric.resistance)}, support ${pct(metric.support)}"><span class="sky-collective-comparison-half"><span style="width:${pct(metric.resistance)}"></span></span><span class="sky-collective-comparison-half"><span style="width:${pct(metric.support)}"></span></span></div><div class="sky-collective-comparison-meta"><span>resistance ${pct(metric.resistance)} · support ${pct(metric.support)}</span><span class="sky-collective-hit-badge">${metric.primitiveWindowHits} hit${metric.primitiveWindowHits===1?'':'s'} · window ${activeWindow()}°</span></div></summary><div class="sky-collective-comparison-detail"><div class="sky-collective-comparison-metrics"><span><strong>${pct(metric.fieldCoupling)}</strong>Field coupling</span><span><strong>${signedPct(metric.phaseAgreement)}</strong>Phase agreement</span><span><strong>${Math.round(metric.phaseOffset)}°</strong>Field offset</span><span><strong>${metric.pairCount}</strong>All cross-pairs</span><span><strong>${metric.primitiveWindowHits}</strong>Primitive hits</span><span><strong>${metric.inheritedWindowHits}</strong>Inherited hits</span></div>${pairRows||'<div class="sky-collective-comparison-pair">No single cross-pair dominates this harmonic.</div>'}</div></details>`;
  }
  function render(){
    queued=false;installStyles();
    const core=window.RelphiCollectiveHarmonicsCore,panel=document.getElementById('skyFoundationComparison');if(!core||!panel)return;
    panel.querySelector('.sky-collective-comparison')?.remove();
    const a=records(read(KEYS.A)),b=records(read(KEYS.B)),section=document.createElement('section');section.className='sky-collective-comparison';section.dataset.collectiveComparison='true';
    if(a.length<2||b.length<2){section.innerHTML='<div class="sky-collective-comparison-head"><div><h3>Comparison Harmonics</h3><p>Whole-field Sky A × Sky B phase balance</p></div></div><p class="sky-collective-comparison-empty">Both skies need at least two independent core placements.</p>';panel.appendChild(section);return}
    const windowValue=activeWindow(),spectrum=core.crossSpectrum(a,b,windowValue,12),ranked=spectrum.slice().sort((x,y)=>y.distinctive-x.distinctive||y.net-x.net||y.primitiveWindowHits-x.primitiveWindowHits||x.order-y.order),featured=ranked.slice(0,4);
    section.innerHTML=`<div class="sky-collective-comparison-head"><div><h3>Comparison Harmonics</h3><p>${a.length} × ${b.length} independent placements · ${a.length*b.length} cross-pairs</p></div><span class="sky-collective-comparison-window">Window ${windowValue}°</span></div><p class="sky-collective-comparison-note">Field scores use every pair. The Harmonic Window changes recognition counts, not the field score.</p><div class="sky-collective-comparison-list">${featured.map(row).join('')}</div><details class="sky-collective-comparison-method"><summary>Why this differs from the aspect list</summary><p>The Harmonic Window decides which cross-pairs earn aspect-family recognition. The field score does not discard the rest: every independent core cross-pair contributes a cosine phase value, so out-of-phase relationships create resistance and can cancel many isolated hits. Proper-divisor inheritance prevents lower-order structure from being counted again as a new higher-order discovery. South Node, angles, Vertex, and Part of Fortune remain visible in ordinary relationship results but are excluded here so deterministic or formula-derived geometry does not inflate the collective field. These are geometric comparison scores, not causal or statistical significance claims.</p></details>`;
    const anchor=document.getElementById('skyFoundationRelationships');
    if(anchor&&anchor.parentElement===panel)panel.insertBefore(section,anchor);else panel.appendChild(section);
    section.dataset.harmonicWindow=String(windowValue);section.dataset.crossPairCount=String(a.length*b.length);
    window.dispatchEvent(new CustomEvent('relphi:sky-collective-comparison-rendered',{detail:{aCount:a.length,bCount:b.length,crossPairs:a.length*b.length,harmonicWindow:windowValue,spectrum}}));
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(render)}
  function start(){schedule();['relphi:sky-foundation-ready','relphi:sky-harmonic-window-visibility-changed','relphi:sky-foundation-interactions-ready'].forEach(name=>window.addEventListener(name,schedule));window.addEventListener('storage',event=>{if(!event.key||event.key===KEYS.A||event.key===KEYS.B)schedule()})}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
