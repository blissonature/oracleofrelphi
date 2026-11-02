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
  let workingSky=null;
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) { return null; } };
  const norm = n => ((n % 360) + 360) % 360;
  const clean = s => String(s || '').trim().toLowerCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ');
  const contains = (lon, a, b) => norm(lon - a) < norm(b - a);
  const label = p => String(p?.name || p?.metadata?.savedSkyName || p?.metadata?.name || p?.calcProfile?.name || p?.calcProfile?.location || p?.location || 'Untitled sky');
  function library() { const a = read('relphiSkyLibraryV1'); return Array.isArray(a) ? a : []; }
  function savedId(p) { return String(p?.id || p?.savedSkyId || p?.metadata?.savedSkyId || ''); }
  function options() { return [...(workingSky?[{id:'working',name:label(workingSky),sky:workingSky}]:[]),...Object.keys(KEYS).filter(slot => !!read(KEYS[slot])).map(slot => ({id:slot,name:'Sky '+slot+' · '+label(read(KEYS[slot])),sky:read(KEYS[slot])})),...library().filter(p=>savedId(p)).map(p=>({id:'saved:'+savedId(p),name:'Saved · '+label(p),sky:p}))]; }
  function choose(id) { if(id==='working')return workingSky;if (KEYS[id]) return read(KEYS[id]); if (id.startsWith('saved:')) return library().find(p=>savedId(p)===id.slice(6)) || null; return null; }
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
      // Only position-specific Minor Arcana qualify. The planet occupying
      // a decan is the trigger; the decan's traditional ruler need not be it.
      add(index.decans.get(clean(sign)+':'+r.decan),'decan','Exact decan: '+position+' falls in '+sign+' '+(r.decan*10)+'°–'+((r.decan+1)*10)+'°.',r);
      // Court cards do not qualify as sky-specific Minor Arcana matches.
    });
    const entries=Array.from(ledger.values()).map(e=>({...e,hits:e.hits.sort((a,b)=>(a.house||99)-(b.house||99)||a.reason.localeCompare(b.reason)),hitCount:e.hits.length})).sort((a,b)=>b.hitCount-a.hitCount||a.card.name.localeCompare(b.card.name));
    return {entries,houseReady,placementCount:pl.length,hitCount:entries.reduce((n,e)=>n+e.hitCount,0)};
  }
  const modeHits = entry => entry.hits;
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
  // Keep the legacy Drawing Board context API, but not its obsolete selector.
  const legacyControlStyle=document.createElement('style');
  legacyControlStyle.textContent='#shortListPanel .relphi-sky-connector{display:none!important}#skyConnectorPanel{box-sizing:border-box;max-width:100%}#skyConnectorPanel label{min-width:0}#skyConnectorPanel select{max-width:100%;min-width:0}';
  document.head.appendChild(legacyControlStyle);
  const panel=document.createElement('section');
  panel.id='skyConnectorPanel';
  panel.className='active-filter-row active-filter-row--results';
  panel.setAttribute('aria-label','Sky Connector filters');
  panel.hidden=true;
  panel.innerHTML='<strong>Sky Connector</strong> <label>Sky <select id="skyConnectorSky" aria-label="Choose sky"></select></label> <button type="button" id="skyConnectorHereNow">Here &amp; Now</button> <button type="button" id="skyConnectorWhenToggle" aria-expanded="false">Where &amp; When</button> <button type="button" data-sky-close>Show All Cards</button> <span id="skyConnectorSummary" role="status" aria-live="polite"></span><div id="skyConnectorWhenPanel" hidden><label>Date and time (device local time) <input type="datetime-local" id="skyConnectorDateTime"></label> <label>Latitude <input id="skyConnectorLat" type="number" min="-90" max="90" step="any" placeholder="Optional"></label> <label>Longitude <input id="skyConnectorLon" type="number" min="-180" max="180" step="any" placeholder="Optional"></label> <button type="button" id="skyConnectorCalculate">Explore this sky</button><span id="skyConnectorCalcStatus" role="status"></span><p>Coordinates are optional for planetary matches; add both to calculate house context using the existing Ledger calculator.</p></div>';
  // A GitHack preview has separate local storage from oracleofrelphi.com.
  // Let the user populate this origin without inventing or copying their sky.
  const sourceHelpNode=document.createElement('div');
  sourceHelpNode.id='skyConnectorSourceHelp';
  sourceHelpNode.hidden=true;
  sourceHelpNode.innerHTML='<p>This preview cannot read saved skies from oracleofrelphi.com. Use Here &amp; Now or Where &amp; When above to explore a real sky without files.</p><a href="sky-chart.html">Open Sky Chart in this preview</a>';
  panel.appendChild(sourceHelpNode);
  listPanel.insertBefore(panel,listPanel.querySelector('.cards-heading'));
  // No replacement card grid, typography, palette, or page-wide hiding rules.
  let active=false,skyId='',searchTerm='',openingIndex=false,queued=false;
  const selector=panel.querySelector('#skyConnectorSky');
  const summary=panel.querySelector('#skyConnectorSummary');
  const sourceHelp=panel.querySelector('#skyConnectorSourceHelp');
  const whenPanel=panel.querySelector('#skyConnectorWhenPanel');
  const whenToggle=panel.querySelector('#skyConnectorWhenToggle');
  const whenInput=panel.querySelector('#skyConnectorDateTime');
  const latInput=panel.querySelector('#skyConnectorLat');
  const lonInput=panel.querySelector('#skyConnectorLon');
  const calcStatus=panel.querySelector('#skyConnectorCalcStatus');
  const localStamp=date=>{
    const n=x=>String(x).padStart(2,'0');
    return date.getFullYear()+'-'+n(date.getMonth()+1)+'-'+n(date.getDate())+'T'+n(date.getHours())+':'+n(date.getMinutes());
  };
  // The astronomy engine is loaded by the Ledger itself. Geocentric longitudes
  // do not need a location; only the optional house calculation does.
  function calculateMoment(date,latitude='',longitude=''){
    if(!(date instanceof Date)||!Number.isFinite(date.getTime()))throw Error('Enter a valid date and time.');
    const A=window.Astronomy;
    if(!A)throw Error('Astronomy Engine is unavailable.');
    const coordinatesProvided=latitude!==''||longitude!=='';
    if(coordinatesProvided&&(latitude===''||longitude===''))throw Error('Provide both latitude and longitude.');
    if(coordinatesProvided){
      if(!Number.isFinite(Number(latitude))||Math.abs(Number(latitude))>90||!Number.isFinite(Number(longitude))||Math.abs(Number(longitude))>180)throw Error('Invalid coordinates.');
      const bridge=window.RelphiTarotLedgerBridge?.calculateSkyForConnector;
      if(typeof bridge!=='function')throw Error('House calculator is not ready.');
      const result=bridge(date.toISOString(),latitude,longitude,'porphyry');
      return {name:'Where & When · '+date.toLocaleString(),placements:result,calcProfile:{timeUnknown:false,houseSystem:'porphyry'}};
    }
    const placements={};
    const bodies=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
    bodies.forEach(body=>{
      const lon=body==='Moon'&&typeof A.EclipticGeoMoon==='function'
        ?A.EclipticGeoMoon(date).lon:A.Ecliptic(A.GeoVector(body,date,true)).elon;
      if(!Number.isFinite(lon))throw Error('Cannot calculate '+body+'.');
      placements[body]={longitude:norm(lon)};
    });
    return {name:'Here & Now · '+date.toLocaleString(),placements,calcProfile:{timeUnknown:true}};
  }
  function useMoment(date,lat='',lon=''){
    workingSky=calculateMoment(date,lat,lon);
    skyId='working';
    searchTerm='';
    const input=document.getElementById('oracleCommand');
    if(input)input.value='';
    showNativeIndex();
    apply();
    updateUrl(true);
    calcStatus.textContent='Exploring '+label(workingSky)+'.';
  }
  panel.querySelector('#skyConnectorHereNow').addEventListener('click',()=>{
    try{useMoment(new Date());}
    catch(error){calcStatus.textContent=error.message;whenPanel.hidden=false;whenToggle.setAttribute('aria-expanded','true');}
  });
  whenToggle.addEventListener('click',()=>{
    whenPanel.hidden=!whenPanel.hidden;
    whenToggle.setAttribute('aria-expanded',String(!whenPanel.hidden));
    if(!whenInput.value)whenInput.value=localStamp(new Date());
  });
  panel.querySelector('#skyConnectorCalculate').addEventListener('click',()=>{
    try{
      if(!whenInput.value)throw Error('Select a date and time.');
      useMoment(new Date(whenInput.value),latInput.value,lonInput.value);
    }catch(error){calcStatus.textContent=error.message;}
  });
  function updateUrl(isOpen){
    const url=new URL(location.href);
    if(isOpen){url.searchParams.set('skyConnector',skyId);url.searchParams.delete('view');}
    else{url.searchParams.delete('skyConnector');url.searchParams.delete('view');}
    history.replaceState(history.state,'',url);
  }
  function refreshControls(){
    const skies=options();
    if(!skies.some(o=>o.id===skyId))skyId=skies[0]?.id||'';
    selector.innerHTML=skies.map(o=>'<option value="'+esc(o.id)+'">'+esc(o.name)+'</option>').join('')||'<option value="">No skies available</option>';
    selector.value=skyId;
    sourceHelp.hidden=skies.length>0;
    selector.disabled=skies.length===0;
  }
  function showNativeIndex(){
    openingIndex=true;
    const input=document.getElementById('oracleCommand');
    const value=input?.value||'';
    try{showAll.click();}finally{openingIndex=false;if(input)input.value=value;}
  }
  function clearSkyState(){
    active=false;
    panel.hidden=true;
    button.setAttribute('aria-expanded','false');
    button.setAttribute('aria-pressed','false');
    // Card list is re-rendered by native actions; do not mutate its original
    // cards when exiting to search, a spread, or Drawing Board.
    updateUrl(false);
    queueMicrotask(markOrdinaryResults);
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
    const term=clean(searchTerm);
    const placed=placements(sky);
    const matchingBodies=new Set(placed.filter(r=>!term ||
      clean(r.name).includes(term) || clean(SIGNS[r.si]).includes(term)
    ).map(r=>clean(r.name)));
    const placementQuery=!!term && matchingBodies.size>0;
    // A planet/sign query selects sky placements first, then their Minor
    // Arcana correspondences. Other queries intersect card metadata.
    result.entries.forEach(entry=>{
      if(entry.card.card_type!=='Pip')return;
      const hits=modeHits(entry).filter(hit=>!term || (placementQuery
        ? matchingBodies.has(clean(hit.body))
        : clean([entry.card.name,entry.card.card_id,entry.card.suit,
                 entry.card.astrology?.planet,entry.card.astrology?.sign].join(' ')).includes(term)));
      if(hits.length)matches.set(entry.card.card_id,hits);
    });
    const grid=cardList.querySelector('.tarot-result-grid');
    if(grid){
      grid.querySelectorAll('.or-card[data-id]').forEach(card=>{
        const hits=matches.get(card.dataset.id);
        card.hidden=!hits;
        if(hits)card.style.removeProperty('display');
        else card.style.setProperty('display','none','important');
        card.querySelector('[data-sky-hit-badge]')?.remove();
        card.querySelector('[data-sky-hit-reasons]')?.remove();
        card.classList.remove('placement-layer-active');
        card.querySelectorAll('.relphi-connected-sky-mark').forEach(mark=>mark.remove());
        if(!hits)return;
        // Reuse the established twelve-color connected-sky marker verbatim.
        const mark=document.createElement('span');
        mark.className='relphi-connected-sky-mark';
        mark.dataset.connectedSkyCard=card.dataset.id;
        mark.title=hits.map(hit=>hit.reason).join(' · ');
        mark.setAttribute('aria-label',hits.length+' connected sky activation'+(hits.length===1?'':'s'));
        mark.innerHTML='<span aria-hidden="true"></span><b>×'+hits.length+'</b>';
        card.appendChild(mark);
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
    if(!sky)summary.textContent='Choose a sky in this preview to see its Minor Arcana matches.';
    else summary.textContent=visible+' matching Minor Arcana · '+activations+' placement correspondences'+(term?' · '+searchTerm:'')+'.';
    const inlineCount=document.getElementById('resultInlineCount');
    if(inlineCount)inlineCount.textContent=visible+(visible===1?' card':' cards')+' shown';
    const resultCount=document.getElementById('resultCount');
    if(resultCount)resultCount.textContent=visible?String(visible):'No';
    const resultNoun=document.getElementById('resultNoun');
    if(resultNoun)resultNoun.textContent=visible===1?' card shown':' cards shown';
    const activeSummary=document.getElementById('activeSummary');
    if(activeSummary)activeSummary.textContent='Sky Connector · '+(sky?label(sky):'Choose a sky');
  }
  // Ordinary Ledger searches retain their full results. Only visually mark
  // the cards that are activated by the current selected sky.
  function markOrdinaryResults(){
    if(active)return;
    const selected=choose(skyId || options()[0]?.id || '');
    const ids=new Map(calculate(selected,window.RELPHI_TAROT_CARDS||[]).entries
      .filter(e=>e.card.card_type==='Pip').map(e=>[e.card.card_id,e.hits]));
    cardList.querySelectorAll('.or-card[data-id]').forEach(card=>{
      const hits=ids.get(card.dataset.id);
      const existing=card.querySelector('.relphi-connected-sky-mark');
      if(!hits?.length){existing?.remove();return;}
      if(existing)return;
      const mark=document.createElement('span');
      mark.className='relphi-connected-sky-mark';
      mark.dataset.connectedSkyCard=card.dataset.id;
      mark.title=hits.map(hit=>hit.reason).join(' · ');
      mark.setAttribute('aria-label',hits.length+' connected sky activation'+(hits.length===1?'':'s'));
      mark.innerHTML='<span aria-hidden="true"></span><b>×'+hits.length+'</b>';
      card.appendChild(mark);
    });
  }
  function schedule(){
    if(queued)return;
    queued=true;
    queueMicrotask(()=>{queued=false;if(active)apply();else markOrdinaryResults();});
  }
  // Observe native index redraws in either mode; we never replace its cards.
  new MutationObserver(mutations=>{
    if(mutations.some(m=>m.type==='childList'))schedule();
  }).observe(cardList,{childList:true});
  function open(id){
    skyId=id||skyId;
    searchTerm='';
    active=true;
    panel.hidden=false;
    button.setAttribute('aria-expanded','true');
    button.setAttribute('aria-pressed','true');
    showNativeIndex();
    // On a phone, default the native Ledger zoom to a two-across overview.
    // Respect an existing custom zoom setting; the user can always change it.
    if (window.matchMedia?.('(max-width: 700px)').matches) {
      const zoom=cardList.querySelector('[data-result-zoom]');
      if (zoom && Math.abs(Number(zoom.value)-1)<0.001) {
        zoom.value='0.82';
        zoom.dispatchEvent(new Event('input',{bubbles:true}));
      }
    }
    apply();
    updateUrl(true);
  }
  button.addEventListener('click',()=>active?close():open(skyId));
  panel.querySelector('[data-sky-close]').addEventListener('click',close);
  selector.addEventListener('change',()=>{skyId=selector.value;apply();updateUrl(true);});
  showAll.addEventListener('click',()=>{if(active&&!openingIndex)clearSkyState();},true);
  // Sky Connector is a search mode, not an alternative renderer.
  // Capture the normal Search action before the Ledger changes its dataset.
  const searchInput=document.getElementById('oracleCommand');
  function searchSky(event){
    if(!active)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    searchTerm=searchInput?.value.trim()||'';
    showNativeIndex();
    apply();
  }
  document.getElementById('runCommand')?.addEventListener('click',searchSky,true);
  // Clearing the ordinary search text restores all selected-sky matches,
  // without closing the connector or changing the native card index.
  document.querySelectorAll('[data-clear-search-terms]').forEach(control=>{
    control.addEventListener('click',event=>{
      if(!active)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if(searchInput)searchInput.value='';
      searchTerm='';
      showNativeIndex();
      apply();
    },true);
  });

  searchInput?.addEventListener('keydown',event=>{
    if(active&&event.key==='Enter')searchSky(event);
  },true);
  ['clearSearch','relphiOpenDrawingBoardCurrent','landingOpenBoard','landingDrawCard','landingShowLedger'].forEach(id=>{
    document.getElementById(id)?.addEventListener('click',()=>{if(active)clearSkyState();},true);
  });
  window.addEventListener('storage',e=>{
    if(active&&(!e.key||Object.values(KEYS).includes(e.key)||e.key==='relphiSkyLibraryV1'))schedule();
  });
  const params=new URLSearchParams(location.search);
  if(params.has('skyConnector'))open(params.get('skyConnector'));
  else markOrdinaryResults();
}
  window.RelphiSkyTarotExplorerV1=Object.freeze({calculate,placements,cusps,modeHits,options});
  // Sky Chart owns its own rulers, houses and comparison-wheel interactions.
  if(TAROT_PAGE){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initLedger,{once:true});else initLedger();}
})();