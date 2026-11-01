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
      if (a.every(x=>x!=null && x!=='') && numbers.every(Number.isFinite)) return numbers.map(norm);
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
    const timeKnown=sky?.calcProfile?.timeUnknown!==true&&sky?.profile?.timeUnknown!==true;
    const houseReady=!!cp||(timeKnown&&pl.some(r=>r.house!=null));
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
      r.house = houseReady ? (r.house || houseAt(r.lon,cp)) : null;
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
    return {entries,houseReady,placementCount:pl.length,hitCount:entries.reduce((n,e)=>n+e.hitCount,0)};
  }
  const modeHits = (entry,mode) => mode==='rulers' ? entry.hits.filter(h=>['direct','sign-ruler','decan-ruler','house-ruler','chart-ruler','time-ruler'].includes(h.type)) : mode==='houses' ? entry.hits.filter(h=>h.house!=null) : entry.hits;
  const image = card => 'assets/tarot/rws/'+encodeURIComponent(card.card_id)+'.webp';
  function initSkyChart() {
    // Native links allow normal browser navigation, including open in new tab.
    // Window capture precedes Sky Chart's legacy document-level tab renderer.
    window.addEventListener('click',event=>{
      const tab=event.target.closest?.('[data-card-hits-view]');
      if(!tab)return;
      const slot=tab.closest('[data-card-hits-structure-slot]')?.dataset.cardHitsStructureSlot;
      if(!KEYS[slot]||!read(KEYS[slot]))return;
      event.preventDefault();event.stopImmediatePropagation();
      const view=tab.dataset.cardHitsView==='houses'?'houses':'rulers';
      location.assign('tarot.html?skyConnector='+encodeURIComponent(slot)+'&view='+view);
    },true);
  }
  function initLedger() {
  const main=document.querySelector('main.tarot-app-shell');
  const browse=document.getElementById('browsePanel');
  const cardList=document.getElementById('cardList');
  const listPanel=browse?.querySelector('.tarot-list-panel');
  const homeActions=main?.querySelector('.tarot-home-actions');
  const showAll=document.getElementById('showAllCards');
  if(!main||!browse||!cardList||!listPanel||!homeActions||!showAll)return;
  // Add only a native Ledger action and controls; its card grid, card artwork,
  // reading/detail behavior, colors, typography and zoom all remain untouched.
  const button=document.createElement('button');
  button.type='button';
  button.id='openSkyConnector';
  button.textContent='Sky Connector';
  button.setAttribute('aria-controls','skyConnectorPanel');
  button.setAttribute('aria-expanded','false');
  homeActions.appendChild(button);
  const panel=document.createElement('section');
  panel.id='skyConnectorPanel';
  panel.className='active-filter-row active-filter-row--results';
  panel.setAttribute('aria-label','Sky Connector filters');
  panel.hidden=true;
  panel.innerHTML='<strong>Sky Connector</strong> <label>Sky <select id="skyConnectorSky" aria-label="Choose sky"></select></label> <span role="group" aria-label="Sky match views"><button type="button" data-sky-view="all">All matches</button><button type="button" data-sky-view="rulers">Rulers</button><button type="button" data-sky-view="houses">Houses</button></span> <label class="sky-house-filter" hidden>House <select id="skyConnectorHouse" aria-label="Filter by house"></select></label> <button type="button" data-sky-close>Show All Cards</button> <span id="skyConnectorSummary" role="status" aria-live="polite"></span>';
  listPanel.insertBefore(panel,listPanel.querySelector('.cards-heading'));
  // No stylesheet rules, replacement card grids, or hidden Ledger sections.
  let active=false,skyId='',view='all',houseFilter=0,openingIndex=false,queued=false;
  const selector=panel.querySelector('#skyConnectorSky');
  const summary=panel.querySelector('#skyConnectorSummary');
  const houseSelect=panel.querySelector('#skyConnectorHouse');
  const houseLabel=panel.querySelector('.sky-house-filter');
  houseSelect.innerHTML='<option value="0">All houses</option>'+Array.from({length:12},(_,i)=>'<option value="'+(i+1)+'">House '+(i+1)+'</option>').join('');
  function updateUrl(isOpen){
    const url=new URL(location.href);
    if(isOpen){url.searchParams.set('skyConnector',skyId);url.searchParams.set('view',view);}
    else{url.searchParams.delete('skyConnector');url.searchParams.delete('view');}
    history.replaceState(history.state,'',url);
  }
  function refreshControls(){
    const skies=options();
    if(!skies.some(o=>o.id===skyId))skyId=skies[0]?.id||'';
    selector.innerHTML=skies.map(o=>'<option value="'+esc(o.id)+'">'+esc(o.name)+'</option>').join('')||'<option value="">No skies available</option>';
    selector.value=skyId;
    houseLabel.hidden=view!=='houses';
    houseSelect.value=String(houseFilter);
    panel.querySelectorAll('[data-sky-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.skyView===view)));
  }
  function showNativeIndex(){
    openingIndex=true;
    try{showAll.click();}finally{openingIndex=false;}
  }
  function clearSkyState(){
    active=false;
    panel.hidden=true;
    button.setAttribute('aria-expanded','false');
    button.setAttribute('aria-pressed','false');
    // Card list is re-rendered by native actions; do not mutate its original
    // cards when exiting to search, a spread, or Drawing Board.
    updateUrl(false);
  }
  function close(){
    if(!active)return;
    clearSkyState();
    showNativeIndex();
  }
  function apply(){
    queued=false;
    if(!active)return;
    refreshControls();
    const sky=choose(skyId);
    const result=calculate(sky,window.RELPHI_TAROT_CARDS||[]);
    const matches=new Map();
    if(sky && (view!=='houses'||result.houseReady)){
      result.entries.forEach(entry=>{
        const hits=modeHits(entry,view).filter(hit=>view!=='houses'||!houseFilter||hit.house===houseFilter);
        if(hits.length)matches.set(entry.card.card_id,hits);
      });
    }
    const grid=cardList.querySelector('.tarot-result-grid');
    if(grid){
      grid.querySelectorAll('.or-card[data-id]').forEach(card=>{
        const hits=matches.get(card.dataset.id);
        card.hidden=!hits;
        if(hits)card.style.removeProperty('display');
        else card.style.setProperty('display','none','important');
        card.querySelector('[data-sky-hit-badge]')?.remove();
        card.querySelector('[data-sky-hit-reasons]')?.remove();
        const oldMark=card.querySelector('.relphi-connected-sky-mark');
        if(oldMark)oldMark.hidden=!!hits;
        if(!hits)return;
        // Reuse the Ledger's existing hit badge and placement overlay classes.
        // Its delegated data-placement-toggle interaction opens all reasons.
        const badge=document.createElement('button');
        badge.type='button';
        badge.className='or-hit-badge';
        badge.dataset.placementToggle='';
        badge.dataset.skyHitBadge='true';
        badge.textContent='×'+hits.length;
        badge.setAttribute('aria-label','Show '+hits.length+' sky correspondences for '+(card.dataset.id||'card'));
        badge.title=hits.map(h=>h.reason).join('\n');
        const layer=document.createElement('div');
        layer.className='or-card-layer or-card-layer--placement relphi-info-layer';
        layer.dataset.placementLayer='';
        layer.dataset.skyHitReasons='true';
        layer.hidden=true;
        const head=document.createElement('div');
        head.className='or-layer-head relphi-info-static';
        const title=document.createElement('strong');
        title.textContent=hits.length+' sky '+(hits.length===1?'correspondence':'correspondences');
        head.appendChild(title);
        const scroll=document.createElement('div');
        scroll.className='or-layer-scroll relphi-info-scroll';
        const list=document.createElement('ol');
        list.className='or-placement-list';
        hits.forEach(hit=>{const item=document.createElement('li');item.textContent=hit.reason;list.appendChild(item);});
        scroll.appendChild(list);
        layer.append(head,scroll);
        card.append(badge,layer);
      });
    }
    const visible=grid?grid.querySelectorAll('.or-card[data-id]:not([hidden])').length:matches.size;
    const activations=Array.from(matches.values()).reduce((sum,hits)=>sum+hits.length,0);
    if(!sky)summary.textContent='Create or load a sky in Sky Chart to explore its tarot correspondences.';
    else if(view==='houses'&&!result.houseReady)summary.textContent='Houses require a reliable time and house cusps. All matches and Rulers remain available.';
    else summary.textContent=visible+' matching cards · '+activations+' correspondences'+(view==='houses'?' · '+(houseFilter?'House '+houseFilter:'All houses'):'')+'.';
    const inlineCount=document.getElementById('resultInlineCount');
    if(inlineCount)inlineCount.textContent=visible+(visible===1?' card':' cards')+' shown';
    const resultCount=document.getElementById('resultCount');
    if(resultCount)resultCount.textContent=visible?String(visible):'No';
    const resultNoun=document.getElementById('resultNoun');
    if(resultNoun)resultNoun.textContent=visible===1?' card shown':' cards shown';
    const activeSummary=document.getElementById('activeSummary');
    if(activeSummary)activeSummary.textContent='Sky Connector · '+(sky?label(sky):'Choose a sky');
  }
  function schedule(){
    if(!active||queued)return;
    queued=true;
    queueMicrotask(apply);
  }
  // Native card interactions, zoom controls, and full-entry selection can
  // re-render #cardList. Reapply the active sky filter without replacing them.
  new MutationObserver(mutations=>{
    if(mutations.some(m=>m.type==='childList'))schedule();
  }).observe(cardList,{childList:true});
  function open(id,nextView){
    skyId=id||skyId;
    view=['all','rulers','houses'].includes(nextView)?nextView:'all';
    houseFilter=0;
    active=true;
    panel.hidden=false;
    button.setAttribute('aria-expanded','true');
    button.setAttribute('aria-pressed','true');
    showNativeIndex();
    apply();
    updateUrl(true);
  }
  button.addEventListener('click',()=>active?close():open(skyId,view));
  panel.querySelector('[data-sky-close]').addEventListener('click',close);
  selector.addEventListener('change',()=>{skyId=selector.value;houseFilter=0;apply();updateUrl(true);});
  houseSelect.addEventListener('change',()=>{houseFilter=Number(houseSelect.value)||0;apply();});
  panel.querySelectorAll('[data-sky-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.skyView;houseFilter=0;apply();updateUrl(true);}));
  showAll.addEventListener('click',()=>{if(active&&!openingIndex)clearSkyState();},true);
  // Search, hiding the index, or opening the Drawing Board exits the filter,
  // leaving the native handler responsible for its own next view.
  ['runCommand','clearSearch','relphiOpenDrawingBoardCurrent','landingOpenBoard','landingDrawCard','landingShowLedger'].forEach(id=>{
    document.getElementById(id)?.addEventListener('click',()=>{if(active)clearSkyState();},true);
  });
  document.getElementById('oracleCommand')?.addEventListener('keydown',e=>{
    if(active&&e.key==='Enter')clearSkyState();
  },true);
  window.addEventListener('storage',e=>{
    if(active&&(!e.key||Object.values(KEYS).includes(e.key)||e.key==='relphiSkyLibraryV1'))schedule();
  });
  const params=new URLSearchParams(location.search);
  if(params.has('skyConnector'))open(params.get('skyConnector'),params.get('view'));
}
  window.RelphiSkyTarotExplorerV1=Object.freeze({calculate,placements,cusps,modeHits,options});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',SKY_PAGE?initSkyChart:initLedger,{once:true});else (SKY_PAGE?initSkyChart:initLedger)();
})();