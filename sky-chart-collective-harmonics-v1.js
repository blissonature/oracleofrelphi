// Collective harmonic field: whole-sky support, resistance, and fundamental lift.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiCollectiveHarmonicsV1)return;
  window.__relphiCollectiveHarmonicsV1=true;

  const CORE_IDS=Object.freeze(['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','chiron','north-node','lilith']);
  const CORE_SET=new Set(CORE_IDS);
  const KEYS=Object.freeze({A:'relphiSkyChartA',B:'relphiSkyChartB'});
  const ALIASES=Object.freeze({
    sol:'sun',luna:'moon',rising:'asc',ascendant:'asc',asc:'asc',ac:'asc',descendant:'dsc',dsc:'dsc',dc:'dsc',
    midheaven:'mc','medium-coeli':'mc','imum-coeli':'ic',node:'north-node','true-node':'north-node','north-node':'north-node',
    'south-node':'south-node',fortune:'part-of-fortune','part-of-fortune':'part-of-fortune',pof:'part-of-fortune',blackmoon:'lilith','black-moon':'lilith'
  });
  const HARMONIC_WORD=Object.freeze({2:'twofold',3:'threefold',4:'fourfold',5:'fivefold',6:'sixfold',7:'sevenfold',8:'eightfold',9:'ninefold',10:'tenfold',11:'elevenfold',12:'twelvefold'});
  const HARMONIC_COLOR=Object.freeze({2:'#5961c8',3:'#4e9e69',4:'#d6534d',5:'#8b6cc2',6:'#d3b727',7:'#2ca69b',8:'#b86d43',9:'#3285c7',10:'#7655aa',11:'#bd438e',12:'#4b8e88'});
  let queued=false;

  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const norm=value=>((Number(value)%360)+360)%360;
  const slug=value=>String(value??'').trim().toLowerCase().replace(/[\s_]+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-');
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
      const raw=slug(candidate),aliased=ALIASES[raw]||raw;
      const entry=registry?.resolve?.(aliased)||registry?.get?.(aliased);
      const id=slug(entry?.id||aliased);
      if(CORE_SET.has(id))return id;
    }
    return '';
  }
  function coreRecords(payload){
    const registry=window.RelphiGlyphRegistry,seen=new Set(),records=[];
    placementSource(payload).forEach(([key,item])=>{
      const id=canonicalId(key,item),value=longitude(item);
      if(!id||!Number.isFinite(value)||seen.has(id))return;
      seen.add(id);
      const entry=registry?.get?.(id)||registry?.resolve?.(id);
      records.push({id,name:entry?.name||String(item?.name||item?.label||key||id),longitude:value});
    });
    return records.sort((a,b)=>CORE_IDS.indexOf(a.id)-CORE_IDS.indexOf(b.id));
  }
  function activeWindow(){
    const input=document.querySelector('[data-harmonic-window-input]'),raw=Number(String(input?.value||'').trim().replace(',','.'));
    if(Number.isFinite(raw)&&raw>=0)return raw;
    const root=Number(document.documentElement.dataset.skyHarmonicWindow);
    if(Number.isFinite(root)&&root>=0)return root;
    return Number(window.RelphiHarmonicOrb?.defaultWindow)||6;
  }
  function pct(value){return `${Math.round(Math.max(0,Math.min(1,Number(value)||0))*100)}%`}
  function signedPct(value){const n=Math.round((Number(value)||0)*100);return `${n>0?'+':''}${n}%`}
  function pairLabel(pair){
    if(!pair)return '';
    const phase=Math.round(pair.phaseDistance*10)/10;
    return `${esc(pair.left.name)} × ${esc(pair.right.name)} · ${phase}° phase error`;
  }
  function installStyles(){
    if(document.getElementById('relphiCollectiveHarmonicsStyles'))return;
    const style=document.createElement('style');style.id='relphiCollectiveHarmonicsStyles';style.textContent=`
      .sky-collective-harmonics{margin:1rem 0 0;padding:.9rem;border:1px solid rgba(31,27,24,.13);border-radius:16px;background:rgba(255,253,249,.86);text-align:left}
      .sky-collective-head{display:flex;gap:.7rem;align-items:flex-start;justify-content:space-between;margin-bottom:.7rem}.sky-collective-head h3{margin:0;font-size:.9rem;letter-spacing:.04em}.sky-collective-head p{margin:.18rem 0 0;color:#665e58;font-size:.72rem;line-height:1.35}.sky-collective-window{flex:none;padding:.25rem .45rem;border-radius:999px;background:#f0ece7;color:#514943;font-size:.68rem;font-weight:750}
      .sky-collective-featured{display:grid;gap:.55rem}.sky-collective-row{--harmonic:#777;border:1px solid rgba(31,27,24,.11);border-left:4px solid var(--harmonic);border-radius:12px;background:#fff;overflow:hidden}.sky-collective-row summary{list-style:none;cursor:pointer;padding:.62rem .68rem}.sky-collective-row summary::-webkit-details-marker{display:none}.sky-collective-row summary:focus-visible{outline:3px solid color-mix(in srgb,var(--harmonic) 34%,white);outline-offset:-3px}.sky-collective-line{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:.55rem;align-items:center}.sky-collective-h{font-weight:850;font-size:.82rem;white-space:nowrap}.sky-collective-score{font-variant-numeric:tabular-nums;font-size:.78rem;font-weight:800}.sky-collective-sub{margin:.22rem 0 0;color:#675f59;font-size:.68rem;line-height:1.3}
      .sky-collective-pressure{display:grid;grid-template-columns:1fr 1fr;gap:2px;height:7px;margin-top:.45rem}.sky-collective-pressure-half{position:relative;background:#eee9e4;border-radius:999px;overflow:hidden}.sky-collective-pressure-half:first-child span{right:0}.sky-collective-pressure-half:last-child span{left:0}.sky-collective-pressure-half span{position:absolute;top:0;bottom:0;background:var(--harmonic);opacity:.88}.sky-collective-pressure-half:first-child span{filter:saturate(.45);opacity:.48}
      .sky-collective-detail{padding:.62rem .68rem .72rem;border-top:1px solid rgba(31,27,24,.09);background:#fffdfa;font-size:.7rem;line-height:1.45}.sky-collective-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.35rem .65rem;margin-bottom:.55rem}.sky-collective-metric strong{display:block;font-size:.78rem}.sky-collective-pairs{display:grid;gap:.25rem}.sky-collective-pair{padding:.32rem .4rem;border-radius:8px;background:#f5f1ed}.sky-collective-spectrum{margin-top:.65rem}.sky-collective-spectrum summary,.sky-collective-method summary{cursor:pointer;font-size:.72rem;font-weight:800}.sky-collective-spectrum-list{display:grid;gap:.24rem;margin-top:.5rem}.sky-collective-spectrum-item{display:grid;grid-template-columns:42px 1fr auto;gap:.45rem;align-items:center;font-size:.68rem}.sky-collective-mini{height:5px;border-radius:999px;background:#ece7e1;overflow:hidden}.sky-collective-mini span{display:block;height:100%;background:var(--harmonic);width:var(--value)}.sky-collective-method{margin-top:.55rem;color:#5d554f;font-size:.68rem;line-height:1.45}.sky-collective-method p{margin:.45rem 0 0}.sky-collective-empty{margin:.35rem 0 0;color:#6b635d;font-size:.72rem}
      @media(max-width:700px){.sky-collective-head{display:block}.sky-collective-window{display:inline-block;margin-top:.4rem}.sky-collective-metrics{grid-template-columns:1fr 1fr}.sky-collective-line{grid-template-columns:auto 1fr auto}}
    `;document.head.appendChild(style);
  }
  function inheritanceText(metric){
    if(metric.distinctive>1e-6)return `Distinctive ${pct(metric.distinctive)}`;
    if(metric.inheritedFrom&&metric.alignment>1e-6)return `Inherited from H${metric.inheritedFrom}`;
    if(metric.net<0)return `Counterbalanced ${pct(metric.counterbalance)}`;
    return 'Mixed field';
  }
  function detailMarkup(metric){
    const supporters=metric.topSupport.filter(pair=>pair.contribution>0.05).slice(0,2),resistors=metric.topResistance.filter(pair=>pair.contribution<-0.05).slice(0,2);
    const pairRows=[...supporters.map(pair=>`<div class="sky-collective-pair"><strong>Supports:</strong> ${pairLabel(pair)}</div>`),...resistors.map(pair=>`<div class="sky-collective-pair"><strong>Resists:</strong> ${pairLabel(pair)}</div>`)].join('');
    return `<div class="sky-collective-detail"><div class="sky-collective-metrics">
      <span class="sky-collective-metric"><strong>${pct(metric.support)}</strong>Support</span>
      <span class="sky-collective-metric"><strong>${pct(metric.resistance)}</strong>Resistance</span>
      <span class="sky-collective-metric"><strong>${signedPct(metric.net)}</strong>Net balance</span>
      <span class="sky-collective-metric"><strong>${pct(metric.distinctive)}</strong>Distinctive coherence</span>
      <span class="sky-collective-metric"><strong>${metric.primitiveWindowHits}</strong>Primitive window hits</span>
      <span class="sky-collective-metric"><strong>${metric.inheritedWindowHits}</strong>Inherited window hits</span>
    </div><div class="sky-collective-pairs">${pairRows||'<div class="sky-collective-pair">No pair dominates this harmonic field.</div>'}</div></div>`;
  }
  function rowMarkup(metric){
    const color=HARMONIC_COLOR[metric.order]||'#777',supportWidth=pct(metric.support),resistanceWidth=pct(metric.resistance);
    return `<details class="sky-collective-row" style="--harmonic:${color}"><summary><div class="sky-collective-line"><span class="sky-collective-h">H${metric.order} · ${HARMONIC_WORD[metric.order]||''}</span><span><strong>${inheritanceText(metric)}</strong><div class="sky-collective-sub">Support ${pct(metric.support)} · Resistance ${pct(metric.resistance)} · ${metric.primitiveWindowHits} primitive hit${metric.primitiveWindowHits===1?'':'s'} in window</div></span><span class="sky-collective-score">${signedPct(metric.net)}</span></div><div class="sky-collective-pressure" aria-hidden="true"><span class="sky-collective-pressure-half"><span style="width:${resistanceWidth}"></span></span><span class="sky-collective-pressure-half"><span style="width:${supportWidth}"></span></span></div></summary>${detailMarkup(metric)}</details>`;
  }
  function spectrumMarkup(spectrum){
    return spectrum.map(metric=>`<div class="sky-collective-spectrum-item" style="--harmonic:${HARMONIC_COLOR[metric.order]||'#777'}"><strong>H${metric.order}</strong><span class="sky-collective-mini"><span style="--value:${pct(metric.distinctive||metric.alignment)}"></span></span><span>${metric.distinctive>1e-6?pct(metric.distinctive):signedPct(metric.net)}</span></div>`).join('');
  }
  function renderSlot(slot){
    const core=window.RelphiCollectiveHarmonicsCore,panel=document.getElementById(slot==='A'?'skyFoundationA':'skyFoundationB'),body=panel?.querySelector('.sky-foundation-body');
    if(!core||!body)return;
    body.querySelector('.sky-collective-harmonics')?.remove();
    const records=coreRecords(read(KEYS[slot]));
    const section=document.createElement('section');section.className='sky-collective-harmonics';section.dataset.collectiveSky=slot;
    if(records.length<2){section.innerHTML=`<div class="sky-collective-head"><div><h3>Collective Harmonics</h3><p>Whole-field phase balance</p></div></div><p class="sky-collective-empty">At least two independent core placements are needed.</p>`;body.appendChild(section);return}
    const windowValue=activeWindow(),spectrum=core.spectrum(records,windowValue,12);
    const ranked=spectrum.slice().sort((a,b)=>b.distinctive-a.distinctive||b.net-a.net||b.primitiveWindowHits-a.primitiveWindowHits||a.order-b.order),featured=ranked.slice(0,4);
    section.innerHTML=`<div class="sky-collective-head"><div><h3>Collective Harmonics</h3><p>All-pairs field geometry · ${records.length} independent core placements</p></div><span class="sky-collective-window">Window ${windowValue}°</span></div><div class="sky-collective-featured">${featured.map(rowMarkup).join('')}</div><details class="sky-collective-spectrum"><summary>Full H2–H12 spectrum</summary><div class="sky-collective-spectrum-list">${spectrumMarkup(spectrum)}</div></details><details class="sky-collective-method"><summary>How this is calculated</summary><p>Support is the mean positive cosine of every pair's harmonic phase; resistance is the mean negative cosine magnitude; net balance is support minus resistance. Distinctive coherence removes the strongest proper-divisor alignment, so an overtone is not mistaken for a new fundamental harmonic. Window hits are reported separately and only “primitive” hits count fractions that do not reduce to a lower harmonic. The core field excludes South Node, the four angles, Vertex, and Part of Fortune so deterministic or formula-derived points do not manufacture collective structure. This is a geometric field score, not a p-value or a claim of causal strength.</p></details>`;
    body.appendChild(section);
    section.dataset.collectiveCount=String(records.length);section.dataset.harmonicWindow=String(windowValue);
  }
  function render(){queued=false;installStyles();renderSlot('A');renderSlot('B');window.dispatchEvent(new CustomEvent('relphi:collective-harmonics-rendered',{detail:{harmonicWindow:activeWindow()}}))}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(render)}
  function start(){
    installStyles();schedule();
    ['relphi:sky-foundation-ready','relphi:sky-harmonic-window-visibility-changed','relphi:sky-update-now-complete'].forEach(name=>window.addEventListener(name,schedule));
    window.addEventListener('storage',event=>{if(!event.key||event.key===KEYS.A||event.key===KEYS.B)schedule()});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
