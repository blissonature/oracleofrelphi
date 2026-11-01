/* Sky Connector is a mode of Tarot Ledger, not Drawing Board. Shared attribution engine for Sky A/B and saved skies. */
(function () {
  'use strict';
  if (window.RelphiSkyTarotExplorerV1) return;
  const SKY_PAGE = /(?:^|\/)sky-chart\.html$/.test(location.pathname);
  const TAROT_PAGE = /(?:^|\/)tarot\.html$/.test(location.pathname);
  if (!SKY_PAGE && !TAROT_PAGE) return;
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const RULERS = ['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
  const FACES = [['Mars','Sun','Venus'],['Mercury','Moon','Saturn'],['Jupiter','Mars','Sun'],['Venus','Mercury','Moon'],['Saturn','Jupiter','Mars'],['Sun','Venus','Mercury'],['Moon','Saturn','Jupiter'],['Mars','Sun','Venus'],['Mercury','Moon','Saturn'],['Jupiter','Mars','Sun'],['Venus','Mercury','Moon'],['Saturn','Jupiter','Mars']];
  const KEYS = { A:'relphiSkyChartA', B:'relphiSkyChartB' };
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) { return null; } };
  const norm = n => ((n % 360) + 360) % 360;
  const clean = s => String(s || '').trim().toLowerCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ');
  const contains = (lon, a, b) => norm(lon - a) < norm(b - a);
  const label = p => String(p?.name || p?.metadata?.savedSkyName || p?.metadata?.name || p?.calcProfile?.name || p?.calcProfile?.location || p?.location || 'Untitled sky');
  function library() { const a = read('relphiSkyLibraryV1'); return Array.isArray(a) ? a : []; }
  function savedId(p) { return String(p?.id || p?.savedSkyId || p?.metadata?.savedSkyId || ''); }
  function options() { return [...Object.keys(KEYS).filter(slot => !!read(KEYS[slot])).map(slot => ({id:slot,name:'Sky '+slot+' · '+label(read(KEYS[slot])),sky:read(KEYS[slot])})),...library().filter(p=>savedId(p)).map(p=>({id:'saved:'+savedId(p),name:'Saved · '+label(p),sky:p}))]; }
  function choose(id) { if (KEYS[id]) return read(KEYS[id]); if (id.startsWith('saved:')) return library().find(p=>savedId(p)===id.slice(6)) || null; return null; }
  function longitude(item) {
    if (!item || typeof item !== 'object') return NaN;
    if (item.longitude != null && item.longitude !== '' && Number.isFinite(Number(item.longitude))) return norm(Number(item.longitude));
    const si = SIGNS.findIndex(s=>clean(s)===clean(item.sign || item.zodiac));
    if (si < 0) return NaN;
    return norm(si*30 + Number(item.degree ?? item.degrees ?? 0) + Number(item.minute ?? item.minutes ?? 0)/60 + Number(item.second ?? item.seconds ?? 0)/3600);
  }
  function placements(sky) {
    const raw = [sky?.placements,sky?.positions,sky?.points,sky?.bodies].find(v=>v && typeof v==='object') || sky || {};
    const entries = Array.isArray(raw) ? raw.map((v,i)=>[String(v?.name || v?.id || i),v]) : Object.entries(raw);
    return entries.map(([key,p]) => {
      const lon = longitude(p); if (!Number.isFinite(lon)) return null;
      const rawName = String(p?.name || p?.label || p?.body || p?.planet || p?.point || key).trim();
      const aliases = {asc:'Ascendant',rising:'Ascendant',mc:'Midheaven',ic:'Imum Coeli',dsc:'Descendant',sun:'Sun',moon:'Moon','north node':'North Node','south node':'South Node'};
      const name = aliases[clean(rawName)] || rawName.replace(/[_-]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
      const si = Math.floor(lon/30), degree = lon - si*30;
      const house = Number(p?.house ?? p?.houseNumber ?? p?.house_number);
      return {name,lon,si,degree,decan:Math.min(2,Math.floor(degree/10)),house:Number.isInteger(house)&&house>=1&&house<=12?house:null};
    }).filter(Boolean);
  }
  function cusps(sky) {
    if (sky?.calcProfile?.timeUnknown === true || sky?.profile?.timeUnknown === true) return null;
    const p = sky?.calcProfile || {};
    for (const obj of [p.houseCusps,p.cusps,sky?.houseCusps,sky?.cusps,sky?.houses]) {
      if (!obj) continue;
      let a;
      if (Array.isArray(obj)) a = obj.slice(0,12);
      else if (typeof obj === 'object') a = Array.from({length:12},(_,i)=>obj[i+1]??obj[String(i+1)]??obj['h'+(i+1)]??obj['house'+(i+1)]);
      if (!a || a.length < 12) continue;
      const numbers = a.map(x=>Number(typeof x==='object'?(x?.longitude??x?.value??x?.degree):x));
      if (numbers.every(Number.isFinite)) return numbers.map(norm);
    }
    return null; // No invented equal houses for an incomplete or unknown-time chart.
  }
  function houseAt(lon,c) { if (!c) return null; for(let i=0;i<12;i++) if (contains(lon,c[i],c[(i+1)%12])) return i+1; return null; }
  function cardIndex(cards) {
    const byId = new Map(cards.map(c=>[c.card_id,c]));
    const planets = new Map(), signs = new Map(), decans = new Map(), courts = [];
    cards.forEach(c=>{
      const a = c.astrology || {}, type = clean(a.attribution_type);
      if(c.arcana==='Major' && type.includes('planet')) {
        for(const p of ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn']) if (String(a.planet || '').split(/\s*\/\s*|\s*,\s*/).some(v=>clean(v)===clean(p))) planets.set(p,c);
      }
      if(c.arcana==='Major' && type==='sign') signs.set(clean(a.sign),c);
      if(c.card_type==='Pip' && a.sign && a.degree_span) {
        const match = String(a.degree_span).match(/^\s*(\d+)\s*(?:degrees|°)/i);
        if(match) decans.set(clean(a.sign)+':'+Math.floor(Number(match[1])/10),c);
      }
      if(c.card_type==='Court' && /(?:Knight|Queen|Prince)/i.test(c.name||'') && !/Princess/i.test(c.name||'')) {
        const m=String(a.zodiac_range||'').match(/(\d+)°\s*([A-Za-z]+)\s*[–-]\s*(\d+)°\s*([A-Za-z]+)/);
        if(m) { const si=SIGNS.findIndex(s=>clean(s)===clean(m[2])),ei=SIGNS.findIndex(s=>clean(s)===clean(m[4])); if(si>=0&&ei>=0)courts.push({card:c,start:si*30+Number(m[1]),end:ei*30+Number(m[3])}); }
      }
    });
    return {byId,planets,signs,decans,courts};
  }
  function calculate(sky,cards) {
    if (!sky) return {entries:[],houseReady:false,placementCount:0,hitCount:0};
    const index=cardIndex(cards),pl=placements(sky),cp=cusps(sky),ledger=new Map();
    function add(card,type,reason,record,houseOverride) {
      if(!card) return;
      const id=card.card_id;
      if(!ledger.has(id)) ledger.set(id,{card,hits:[]});
      const house=houseOverride===undefined?record?.house??null:houseOverride;
      const item={type,reason,house,body:record?.name||''};
      if(!ledger.get(id).hits.some(h=>h.type===type&&h.reason===reason&&h.house===house))ledger.get(id).hits.push(item);
    }
    const locationText=r=>r.name+' · '+(Math.floor(r.degree))+'°'+String(Math.floor((r.degree%1)*60+1e-7)).padStart(2,'0')+'′ '+SIGNS[r.si]+(r.house?' · H'+r.house:'');
    pl.forEach(r=>{
      r.house = cp ? (r.house || houseAt(r.lon,cp)) : null;
      const sign=SIGNS[r.si],position=locationText(r),ruler=RULERS[r.si],face=FACES[r.si][r.decan];
      add(index.planets.get(r.name),'direct','Direct planetary correspondence: '+position+'.',r);
      add(index.signs.get(clean(sign)),'sign','Zodiac correspondence: '+position+' occupies '+sign+'.',r);
      add(index.decans.get(clean(sign)+':'+r.decan),'decan','Exact decan: '+position+' falls in '+sign+' '+(r.decan*10)+'°–'+((r.decan+1)*10)+'°.',r);
      index.courts.forEach(c=>{if(contains(r.lon,c.start,c.end))add(c.card,'court','Court range: '+position+' falls within '+c.card.astrology.zodiac_range+'.',r)});
      add(index.planets.get(ruler),'sign-ruler','Sign ruler: '+ruler+' governs '+sign+', occupied by '+r.name+'.',r);
      add(index.planets.get(face),'decan-ruler','Decan ruler: '+face+' governs the '+['first','second','third'][r.decan]+' decan of '+sign+', occupied by '+r.name+'.',r);
    });
    if(cp){cp.forEach((lon,i)=>{const sign=SIGNS[Math.floor(lon/30)],ruler=RULERS[Math.floor(lon/30)];
      add(index.signs.get(clean(sign)),'house-sign','House '+(i+1)+' cusp is in '+sign+'.',null,i+1);
      add(index.planets.get(ruler),'house-ruler','House '+(i+1)+' cusp in '+sign+' is ruled by '+ruler+'.',null,i+1);
    })}
    const asc=pl.find(r=>clean(r.name)==='ascendant');
    if(asc && cp)add(index.planets.get(RULERS[asc.si]),'chart-ruler','Chart ruler: '+RULERS[asc.si]+' rules the Ascendant in '+SIGNS[asc.si]+'.',asc);
    const profile=sky.calcProfile||{};
    [['dayRuler','planetary day'],['hourRuler','planetary hour'],['planetaryDayRuler','planetary day'],['planetaryHourRuler','planetary hour']].forEach(([key,title])=>{const name=String(profile[key]||sky[key]||'');if(name)add(index.planets.get(name),'time-ruler',name+' rules the '+title+'.',null)});
    const entries=Array.from(ledger.values()).map(e=>({...e,hits:e.hits.sort((a,b)=>(a.house||99)-(b.house||99)||a.reason.localeCompare(b.reason)),hitCount:e.hits.length})).sort((a,b)=>b.hitCount-a.hitCount||a.card.name.localeCompare(b.card.name));
    return {entries,houseReady:!!cp,placementCount:pl.length,hitCount:entries.reduce((n,e)=>n+e.hitCount,0)};
  }
  const modeHits = (entry,mode) => mode==='rulers' ? entry.hits.filter(h=>['direct','sign-ruler','decan-ruler','house-ruler','chart-ruler','time-ruler'].includes(h.type)) : mode==='houses' ? entry.hits.filter(h=>h.house!=null) : entry.hits;
  const image = card => 'assets/tarot/rws/'+encodeURIComponent(card.card_id)+'.webp';
  function initSkyChart() {
    // Native links allow normal browser navigation, including open in new tab.
    document.addEventListener('click',event=>{
      const tab=event.target.closest?.('[data-card-hits-view]');
      const fingerprint=event.target.closest?.('[data-sky-drawer-tab="card-hits"]');
      if(!tab&&!fingerprint)return;
      const slot = tab?.closest('[data-card-hits-structure-slot]')?.dataset.cardHitsStructureSlot || fingerprint?.closest('[data-sky-card-drawers]')?.dataset.skyCardDrawers || fingerprint?.closest('#skyFoundationB')&&'B' || 'A';
      if(!KEYS[slot]||!read(KEYS[slot]))return;
      event.preventDefault();event.stopImmediatePropagation();
      const view=tab?.dataset.cardHitsView==='houses'?'houses':tab?'rulers':'all';
      location.assign('tarot.html?skyConnector='+encodeURIComponent(slot)+'&view='+view);
    },true);
  }
  function initLedger() {
    const main=document.querySelector('main.tarot-app-shell');if(!main)return;
    const button=document.createElement('button');button.type='button';button.id='openSkyConnector';button.textContent='Sky Connector';
    button.setAttribute('aria-controls','skyConnectorPanel');main.querySelector('.tarot-home-actions')?.appendChild(button);
    const panel=document.createElement('section');panel.id='skyConnectorPanel';panel.className='sky-connector-mode';panel.hidden=true;panel.setAttribute('aria-label','Sky Connector');
    panel.innerHTML='<div class="sky-connector-head"><div><p class="sky-connector-eyebrow">Tarot Ledger · Sky Connector</p><h2>Explore a sky through tarot</h2><p>Every card below has an explicit correspondence to the selected sky. Open a card to see every activation.</p></div><button type="button" data-sky-close>Back to Ledger</button></div><div class="sky-connector-controls"><label>Sky <select id="skyConnectorSky"></select></label><div role="group" aria-label="Sky match views"><button type="button" data-sky-view="all">All matches</button><button type="button" data-sky-view="rulers">Rulers</button><button type="button" data-sky-view="houses">Houses</button></div></div><p id="skyConnectorSummary" role="status" aria-live="polite"></p><div id="skyConnectorCards" class="sky-connector-cards"></div>';
    main.insertBefore(panel,document.getElementById('browsePanel'));
    const style=document.createElement('style');style.textContent=`
    body.sky-connector-open main.tarot-app-shell > :not(.tarot-hero):not(.tarot-home-actions):not(#skyConnectorPanel){display:none!important}
    body.sky-connector-open #skyConnectorPanel{display:block!important}
    .sky-connector-mode{margin:1rem auto 3rem;max-width:1260px;padding:clamp(12px,3vw,26px);border:1px solid #ddd3c8;border-radius:17px;background:#fffcf7;color:#241f1b}
    .sky-connector-head{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem}.sky-connector-head h2{margin:.15rem 0;font:700 clamp(1.35rem,3vw,2rem)/1.15 Georgia,serif}.sky-connector-head p{max-width:67ch;line-height:1.45}.sky-connector-eyebrow{margin:0;font-size:.75rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#7a625a}
    .sky-connector-controls{display:flex;flex-wrap:wrap;justify-content:space-between;gap:1rem;align-items:end;margin:1.25rem 0}.sky-connector-controls label{display:grid;gap:.3rem;flex:1 1 230px;font-weight:750;font-size:.8rem}.sky-connector-controls select{width:100%;min-height:42px;border:1px solid #aa9c8e;border-radius:7px;background:#fff;padding:.45rem;color:#241f1b}.sky-connector-controls [role=group]{display:flex;flex-wrap:wrap;gap:.4rem}
    .sky-connector-mode button{cursor:pointer}.sky-connector-controls button,.sky-connector-head button{padding:.62rem .85rem;border:1px solid #9c8980;border-radius:8px;background:#fffdf9;color:#30251e;font-weight:750}.sky-connector-controls button[aria-pressed=true]{background:#493931;color:#fff}
    #skyConnectorSummary{margin:.5rem 0 1rem;font-size:.9rem;font-weight:650}.sky-connector-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem;align-items:start}.sky-connector-card{min-width:0;border:1px solid #d9d0c7;border-radius:10px;background:white;overflow:hidden}.sky-connector-card[open]{grid-column:span 2;border-color:#a38e7e;box-shadow:0 4px 24px #211b151c}.sky-connector-card summary{display:grid;justify-items:center;gap:.45rem;cursor:pointer;padding:.75rem;list-style:none}.sky-connector-card summary::-webkit-details-marker{display:none}.sky-connector-card summary:focus-visible,.sky-connector-mode button:focus-visible{outline:3px solid #8b5791;outline-offset:2px}.sky-connector-card img{width:100px;max-width:100%;aspect-ratio:2/3;object-fit:contain}.sky-connector-card strong{text-align:center;font-size:.85rem}.sky-connector-count{font-size:.74rem;color:#60483f;font-weight:750}.sky-connector-reasons{padding:.75rem;border-top:1px solid #e6ddd5}.sky-connector-reasons ol{margin:0 0 .8rem;padding-left:1.15rem;display:grid;gap:.55rem}.sky-connector-reasons li{font-size:.8rem;line-height:1.4;overflow-wrap:anywhere}.sky-connector-reasons button{padding:.5rem .65rem;border:1px solid #9d8177;border-radius:7px;background:#f9f3ed;color:#35271e;font-weight:700}
    @media(max-width:600px){.sky-connector-head{flex-wrap:wrap}.sky-connector-controls [role=group]{width:100%}.sky-connector-controls [role=group] button{flex:1}.sky-connector-cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:.55rem}.sky-connector-card[open]{grid-column:span 2}.sky-connector-card summary{padding:.5rem}.sky-connector-card img{width:86px}.sky-connector-reasons{padding:.6rem}}
    `;document.head.appendChild(style);
    let skyId='',view='all';
    const selector=panel.querySelector('#skyConnectorSky'),cardsEl=panel.querySelector('#skyConnectorCards'),summary=panel.querySelector('#skyConnectorSummary');
    function updateUrl(open) { const url=new URL(location.href);if(open){url.searchParams.set('skyConnector',skyId);url.searchParams.set('view',view)}else{url.searchParams.delete('skyConnector');url.searchParams.delete('view')}history.replaceState(history.state,'',url); }
    function render() {
      const skies=options();selector.innerHTML=skies.map(o=>'<option value="'+esc(o.id)+'"'+(o.id===skyId?' selected':'')+'>'+esc(o.name)+'</option>').join('') || '<option value="">No available skies</option>';
      if(!skies.some(x=>x.id===skyId))skyId=skies[0]?.id||'';
      selector.value=skyId;
      panel.querySelectorAll('[data-sky-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.skyView===view)));
      const sky=choose(skyId),index=calculate(sky,window.RELPHI_TAROT_CARDS||[]);
      if(!sky){summary.textContent='No sky available. Create or load a sky in Sky Chart, then return here.';cardsEl.replaceChildren();return}
      if(view==='houses'&&!index.houseReady){summary.textContent='Houses require an exact birth time and calculated house cusps. Rulers and all matches remain available.';cardsEl.replaceChildren();return}
      const matches=index.entries.map(entry=>({...entry,visibleHits:modeHits(entry,view)})).filter(e=>e.visibleHits.length);
      const total=matches.reduce((n,e)=>n+e.visibleHits.length,0);
      summary.textContent=label(sky)+' · '+matches.length+' matching cards · '+total+' activations · '+index.placementCount+' placements'+(view==='houses'?' · houses by cusp and placement':'')+'. No results are truncated.';
      cardsEl.innerHTML=matches.map(e=>`<details class="sky-connector-card"><summary><img src="${esc(image(e.card))}" alt="" loading="lazy"><strong>${esc(e.card.name)}</strong><span class="sky-connector-count">${e.visibleHits.length} ${e.visibleHits.length===1?'match':'matches'}</span></summary><div class="sky-connector-reasons"><ol>${e.visibleHits.map(h=>`<li>${esc(h.reason)}</li>`).join('')}</ol><button type="button" data-sky-ledger-card="${esc(e.card.card_id)}" data-sky-ledger-name="${esc(e.card.name)}">Open full Ledger entry</button></div></details>`).join('');
    }
    function open(id,v) { if(id)skyId=id;view=['all','rulers','houses'].includes(v)?v:'all';panel.hidden=false;document.body.classList.add('sky-connector-open');button.setAttribute('aria-expanded','true');render();updateUrl(true); }
    function close(){panel.hidden=true;document.body.classList.remove('sky-connector-open');button.setAttribute('aria-expanded','false');updateUrl(false)}
    button.addEventListener('click',()=>open(skyId,view));panel.querySelector('[data-sky-close]').addEventListener('click',close);
    selector.addEventListener('change',()=>{skyId=selector.value;render();updateUrl(true)});
    panel.querySelectorAll('[data-sky-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.skyView;render();updateUrl(true)}));
    panel.addEventListener('click',e=>{const hit=e.target.closest('[data-sky-ledger-card]');if(!hit)return;const name=hit.dataset.skyLedgerName;close();const input=document.getElementById('oracleCommand');if(input){input.value=name;input.dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('runCommand')?.click();}});
    const params=new URLSearchParams(location.search);if(params.has('skyConnector'))open(params.get('skyConnector'),params.get('view'));
  }
  window.RelphiSkyTarotExplorerV1=Object.freeze({calculate,placements,cusps,modeHits,options});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',SKY_PAGE?initSkyChart:initLedger,{once:true});else (SKY_PAGE?initSkyChart:initLedger)();
})();