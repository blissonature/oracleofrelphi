// Sky-card drawer contract: Where and When, Placements, and Card Hits are independent layers.
// Card Hits is placement-derived. Selecting a hit becomes a reversible chart lens rather than replacing the hit set.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname) || window.__relphiSkyCardTabsV1) return;
  window.__relphiSkyCardTabsV1 = true;

  const KEYS = { A:'relphiSkyChartA', B:'relphiSkyChartB' };
  const VIEW_KEY = 'relphiSkyWhereWhenViewV1';
  const DRAWER_KEY = 'relphiSkyCardDrawersV1';
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const SIGN_RULERS = ['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
  const EXALTATIONS = ['Sun','Moon','','Jupiter','','Mercury','Saturn','','','Mars','','Venus'];
  const DECAN_RULERS = [
    ['Mars','Sun','Venus'], ['Mercury','Moon','Saturn'], ['Jupiter','Mars','Sun'],
    ['Venus','Mercury','Moon'], ['Saturn','Jupiter','Mars'], ['Sun','Venus','Mercury'],
    ['Moon','Saturn','Jupiter'], ['Mars','Sun','Venus'], ['Mercury','Moon','Saturn'],
    ['Jupiter','Mars','Sun'], ['Venus','Mercury','Moon'], ['Saturn','Jupiter','Mars']
  ];
  const DECAN_CARDS = [
    ['two_of_wands','three_of_wands','four_of_wands'],
    ['five_of_pentacles','six_of_pentacles','seven_of_pentacles'],
    ['eight_of_swords','nine_of_swords','ten_of_swords'],
    ['two_of_cups','three_of_cups','four_of_cups'],
    ['five_of_wands','six_of_wands','seven_of_wands'],
    ['eight_of_pentacles','nine_of_pentacles','ten_of_pentacles'],
    ['two_of_swords','three_of_swords','four_of_swords'],
    ['five_of_cups','six_of_cups','seven_of_cups'],
    ['eight_of_wands','nine_of_wands','ten_of_wands'],
    ['two_of_pentacles','three_of_pentacles','four_of_pentacles'],
    ['five_of_swords','six_of_swords','seven_of_swords'],
    ['eight_of_cups','nine_of_cups','ten_of_cups']
  ];
  const PLANET_NAMES = new Set(['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto']);
  const OUTER_PLANET_CARDS = { Uranus:'the_fool', Neptune:'the_hanged_man', Pluto:'judgement' };
  const BODY_ALIASES = {
    sun:'Sun',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',
    uranus:'Uranus',neptune:'Neptune',pluto:'Pluto',asc:'Ascendant',rising:'Ascendant',ascendant:'Ascendant',
    dsc:'Descendant',descendant:'Descendant',mc:'Midheaven',midheaven:'Midheaven',ic:'Imum Coeli',
    'north-node':'North Node','north node':'North Node',node:'North Node','south-node':'South Node',
    'south node':'South Node',chiron:'Chiron',lilith:'Lilith',vertex:'Vertex',
    'part-of-fortune':'Part of Fortune','part of fortune':'Part of Fortune',fortune:'Part of Fortune'
  };
  const PLACEMENT_ID_ALIASES = {
    ascendant:'asc',rising:'asc',asc:'asc',ac:'asc',
    descendant:'dsc',dsc:'dsc',dc:'dsc',
    midheaven:'mc',mc:'mc',
    'imum-coeli':'ic','imum coeli':'ic',imumcoeli:'ic',ic:'ic',
    'north-node':'north-node','north node':'north-node',node:'north-node','true-node':'north-node','true node':'north-node',
    'south-node':'south-node','south node':'south-node',
    'part-of-fortune':'part-of-fortune','part of fortune':'part-of-fortune',fortune:'part-of-fortune',pof:'part-of-fortune',
    vertex:'vertex',vx:'vertex'
  };
  const THUMB = Object.freeze({ width:48, height:83, quality:50 });
  const selectedCard = { A:'', B:'' };
  const relationshipFocus = { A:'', B:'' };
  const requestingWhere = { A:false, B:false };

  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const norm = value => ((Number(value) % 360) + 360) % 360;

  function readPayload(slot) {
    try { return JSON.parse(localStorage.getItem(KEYS[slot]) || 'null'); }
    catch (_) { return null; }
  }
  function placementSource(payload) {
    if (!payload || typeof payload !== 'object') return [];
    const known = [payload.placements,payload.positions,payload.points,payload.bodies].find(value => value && typeof value === 'object');
    const source = known || payload;
    if (Array.isArray(source)) return source.map((item,index) => [String(item?.name || item?.label || item?.id || index),item]);
    return Object.entries(source).filter(([key,value]) => value && typeof value === 'object' && !Array.isArray(value) && !/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key));
  }
  function longitude(item) {
    if (Number.isFinite(Number(item?.longitude))) return norm(item.longitude);
    const sign = SIGNS.findIndex(name => name.toLowerCase() === String(item?.sign || item?.zodiac || '').trim().toLowerCase());
    if (sign < 0) return NaN;
    return norm(sign * 30 + Number(item?.degree || item?.degrees || 0) + Number(item?.minute || item?.minutes || 0)/60 + Number(item?.second || item?.seconds || 0)/3600);
  }
  function bodyName(key,item) {
    const candidates = [item?.name,item?.label,item?.body,item?.planet,item?.point,item?.id,item?.glyphId,key];
    for (const candidate of candidates) {
      if (candidate == null) continue;
      const raw = String(candidate).trim();
      const normalized = raw.toLowerCase().replace(/_/g,'-');
      if (BODY_ALIASES[normalized]) return BODY_ALIASES[normalized];
      const entry = window.RelphiGlyphRegistry?.resolve?.(raw) || window.RelphiGlyphRegistry?.get?.(raw);
      if (entry?.name) return entry.name;
    }
    return String(key || 'Placement');
  }
  function placementId(key,item,body) {
    const candidates = [item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key,body];
    for (const candidate of candidates) {
      if (candidate == null) continue;
      const raw = String(candidate).trim();
      const normalized = raw.toLowerCase().replace(/_/g,'-');
      const alias = PLACEMENT_ID_ALIASES[normalized] || normalized;
      const entry = window.RelphiGlyphRegistry?.resolve?.(alias) || window.RelphiGlyphRegistry?.get?.(alias);
      if (entry?.id) return entry.id;
      if (/^(sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|chiron|lilith|vertex)$/.test(alias)) return alias;
      if (PLACEMENT_ID_ALIASES[normalized]) return alias;
    }
    return '';
  }
  function houseNumber(item) {
    const value = Number(item?.house ?? item?.houseNumber ?? item?.house_number);
    return Number.isFinite(value) && value >= 1 && value <= 12 ? Math.trunc(value) : null;
  }
  function records(slot) {
    return placementSource(readPayload(slot)).map(([key,item],index) => {
      const value = longitude(item);
      if (!Number.isFinite(value)) return null;
      const longSign = Math.floor(value/30);
      const explicitSign = SIGNS.findIndex(name => name.toLowerCase() === String(item?.sign || item?.zodiac || '').trim().toLowerCase());
      const signIndex = explicitSign >= 0 ? explicitSign : longSign;
      const within = value - longSign*30;
      const explicitDegree = Number(item?.degree ?? item?.degrees);
      const explicitMinute = Number(item?.minute ?? item?.minutes);
      const degree = Number.isFinite(explicitDegree) ? Math.max(0,Math.min(29,Math.trunc(explicitDegree))) : Math.floor(within);
      const minute = Number.isFinite(explicitMinute) ? Math.max(0,Math.min(59,Math.trunc(explicitMinute))) : Math.floor((within-Math.floor(within))*60 + 1e-8);
      const body = bodyName(key,item);
      return {
        id:`${index}:${key}`,
        placementId:placementId(key,item,body),
        key,item,body,value,signIndex,sign:SIGNS[signIndex],degree,minute,
        house:houseNumber(item),decan:Math.min(2,Math.floor(degree/10))
      };
    }).filter(Boolean);
  }

  function cards() { return Array.isArray(window.RELPHI_TAROT_CARDS) ? window.RELPHI_TAROT_CARDS : []; }
  function cardById(id) { return cards().find(card => card.card_id === id || card.stable_symbol_id === id) || null; }
  function splitValues(value) { return String(value || '').split(',').map(item => item.trim()).filter(Boolean); }
  function cardForPlanet(planet) {
    return cards().find(card => card.arcana === 'Major' && splitValues(card.astrology?.planet).includes(planet)) || cardById(OUTER_PLANET_CARDS[planet]);
  }
  function cardForSign(sign) { return cards().find(card => card.arcana === 'Major' && splitValues(card.astrology?.sign).includes(sign)) || null; }
  function cardForDecan(record) { return cardById(DECAN_CARDS[record.signIndex]?.[record.decan]); }
  function displayName(card) { return String(card?.name || card?.title || card?.card_name || card?.card_id || 'Card').replace(/_/g,' '); }
  function thumbnailFor(card,w=THUMB.width,h=THUMB.height) {
    const id = encodeURIComponent(card?.card_id || card?.stable_symbol_id || '');
    const source = new URL(`assets/tarot/rws/${id}.webp`, document.baseURI).href;
    const thumb = new URL('https://wsrv.nl/');
    thumb.searchParams.set('url',source); thumb.searchParams.set('w',String(w)); thumb.searchParams.set('h',String(h));
    thumb.searchParams.set('fit','cover'); thumb.searchParams.set('output','webp'); thumb.searchParams.set('q',String(THUMB.quality));
    return thumb.href;
  }

  function associationEntries(record) {
    const entries = [];
    if (PLANET_NAMES.has(record.body)) entries.push([cardForPlanet(record.body),`${record.body} is the placed planetary power`]);
    entries.push([cardForSign(record.sign),`${record.sign} supplies the zodiacal archetype`]);
    entries.push([cardForDecan(record),`${record.sign} decan ${record.decan+1}`]);
    const signRuler = SIGN_RULERS[record.signIndex];
    entries.push([cardForPlanet(signRuler),`${signRuler} rules ${record.sign}`]);
    const exalted = EXALTATIONS[record.signIndex];
    if (exalted) entries.push([cardForPlanet(exalted),`${exalted} is exalted in ${record.sign}`]);
    const decanRuler = DECAN_RULERS[record.signIndex]?.[record.decan];
    if (decanRuler) entries.push([cardForPlanet(decanRuler),`${record.sign} decan ${record.decan+1} is ruled by ${decanRuler}`]);
    return entries.filter(([card]) => card);
  }
  function buildTally(slot) {
    const tally = new Map();
    records(slot).forEach(record => {
      associationEntries(record).forEach(([card,why]) => {
        const id = card.card_id || card.stable_symbol_id;
        if (!id) return;
        let hit = tally.get(id);
        if (!hit) { hit = { id,card,placements:new Map() }; tally.set(id,hit); }
        let placement = hit.placements.get(record.id);
        if (!placement) { placement = { record,associations:new Set() }; hit.placements.set(record.id,placement); }
        placement.associations.add(why);
      });
    });
    return Array.from(tally.values())
      .map(hit => ({...hit,placements:Array.from(hit.placements.values()),count:hit.placements.size}))
      .sort((a,b) => b.count-a.count || displayName(a.card).localeCompare(displayName(b.card)));
  }

  function readViewState() {
    try { const value=JSON.parse(sessionStorage.getItem(VIEW_KEY)||'{}'); return value&&typeof value==='object'?value:{}; }
    catch (_) { return {}; }
  }
  function writeViewState(slot,mode) {
    const value=readViewState(); value[slot]=mode;
    try { sessionStorage.setItem(VIEW_KEY,JSON.stringify(value)); } catch (_) {}
  }
  function readDrawerState() {
    try {
      const value=JSON.parse(sessionStorage.getItem(DRAWER_KEY)||'{}');
      return value&&typeof value==='object'?value:{};
    } catch (_) { return {}; }
  }
  function drawerState(slot) {
    const state=readDrawerState()[slot];
    return {
      where:state?.where !== false,
      placements:!!state?.placements,
      cardHits:!!state?.cardHits
    };
  }
  function writeDrawerState(slot,next) {
    const value=readDrawerState();
    value[slot]={...drawerState(slot),...next};
    try { sessionStorage.setItem(DRAWER_KEY,JSON.stringify(value)); } catch (_) {}
  }

  function panel(slot) { return document.getElementById(`skyFoundation${slot}`); }
  function viewNodes(slot) {
    const card=panel(slot), body=card?.querySelector(':scope > .sky-foundation-body');
    return {
      card,body,
      placement:body?.querySelector('.sky-where-when-placement-view'),
      view:body?.querySelector('.sky-where-when-view')
    };
  }
  function completeProfile(slot) {
    const profile=readPayload(slot)?.calcProfile;
    return !!(profile&&profile.dateTime&&profile.location&&profile.timeZone&&Number.isFinite(Number(profile.latitude))&&Number.isFinite(Number(profile.longitude)));
  }
  function ensureCompatActions(slot) {
    const heading=panel(slot)?.querySelector('.sky-foundation-heading');
    const actions=heading?.querySelector('.sky-where-when-actions');
    if(!actions)return null;
    let cardHits=actions.querySelector('[data-ww-action="card-hits"]');
    if(!cardHits){
      cardHits=document.createElement('button');
      cardHits.type='button';
      cardHits.className='sky-where-when-action';
      cardHits.dataset.wwAction='card-hits';
      cardHits.textContent='Card Hits';
      actions.appendChild(cardHits);
    }
    actions.hidden=true;
    actions.setAttribute('aria-hidden','true');
    return actions;
  }
  function drawerMarkup(key,label) {
    const section=document.createElement('section');
    section.className='sky-card-drawer';
    section.dataset.skyDrawer=key;
    const toggle=document.createElement('button');
    toggle.type='button';
    toggle.className='sky-card-drawer-toggle';
    toggle.dataset.skyDrawerToggle=key;
    toggle.innerHTML=`<span>${label}</span><span class="sky-card-drawer-chevron" aria-hidden="true"></span>`;
    const body=document.createElement('div');
    body.className='sky-card-drawer-body';
    body.dataset.skyDrawerBody=key;
    section.append(toggle,body);
    return section;
  }
  function ensureDrawers(slot) {
    const {card,body,placement,view}=viewNodes(slot);
    if(!card||!body||!placement||!view)return null;
    ensureCompatActions(slot);
    let root=body.querySelector(':scope > .sky-card-drawers');
    if(!root){
      root=document.createElement('div');
      root.className='sky-card-drawers';
      root.dataset.skyCardDrawers=slot;
      root.append(
        drawerMarkup('where','Where and When'),
        drawerMarkup('placements','Placements'),
        drawerMarkup('cardHits','Card Hits')
      );
      body.prepend(root);
    }
    root.querySelector('[data-sky-drawer-body="where"]')?.appendChild(view);
    root.querySelector('[data-sky-drawer-body="placements"]')?.appendChild(placement);
    const hitBody=root.querySelector('[data-sky-drawer-body="cardHits"]');
    if(hitBody&&!hitBody.querySelector('.sky-card-hits-host')){
      const host=document.createElement('div');
      host.className='sky-card-hits-host';
      host.dataset.cardHitsHost=slot;
      hitBody.appendChild(host);
    }
    return root;
  }
  function requestWhereContent(slot) {
    if(requestingWhere[slot])return;
    const {view}=viewNodes(slot);
    if(!view||view.childElementCount)return;
    const actions=ensureCompatActions(slot);
    const edit=actions?.querySelector('[data-ww-action="edit"]');
    if(!edit)return;
    requestingWhere[slot]=true;
    if(completeProfile(slot)) writeViewState(slot,'confirmed');
    edit.click();
    requestAnimationFrame(()=>{requestingWhere[slot]=false;hydrateSlot(slot)});
  }
  function syncDrawerVisibility(slot) {
    const root=ensureDrawers(slot);
    if(!root)return;
    const state=drawerState(slot);
    const {placement,view}=viewNodes(slot);
    ['where','placements','cardHits'].forEach(key=>{
      const section=root.querySelector(`[data-sky-drawer="${key}"]`);
      const toggle=section?.querySelector('[data-sky-drawer-toggle]');
      const drawerBody=section?.querySelector('[data-sky-drawer-body]');
      const open=!!state[key];
      section?.classList.toggle('is-open',open);
      toggle?.setAttribute('aria-expanded',open?'true':'false');
      if(drawerBody) drawerBody.hidden=!open;
    });
    if(view) view.hidden=!state.where;
    if(placement) placement.hidden=!state.placements;
    if(state.where) requestWhereContent(slot);
    if(state.cardHits) renderCardHits(slot);
  }

  function placementText(record) {
    const coordinate=`${record.degree}°${String(record.minute).padStart(2,'0')}′`;
    return { main:`${record.body} in ${record.sign}`, meta:`${coordinate}${record.house ? ` · H${record.house}` : ''}` };
  }
  function detailMarkup(hit) {
    if(!hit)return '';
    return `<div class="sky-card-hit-detail-view"><div class="sky-card-hit-detail-head"><div class="sky-card-hit-detail-art"><img src="${esc(thumbnailFor(hit.card,58,100))}" alt="" width="58" height="100"></div><div class="sky-card-hit-detail-copy"><h3>${esc(displayName(hit.card))} ×${hit.count}</h3><p>${hit.count} placement${hit.count===1?'':'s'} in this sky associate with this card.</p><button class="sky-card-hit-clear" type="button" data-card-hit-clear>Clear card focus</button></div></div><ul class="sky-card-hit-placements">${hit.placements.map(entry=>{const text=placementText(entry.record);return `<li class="sky-card-hit-placement"><span class="sky-card-hit-placement-main">${esc(text.main)}</span><span class="sky-card-hit-placement-meta">${esc(text.meta)}</span><span class="sky-card-hit-placement-why">${esc(Array.from(entry.associations).join(' · '))}</span></li>`}).join('')}</ul></div>`;
  }
  function gridMarkup(slot,hits) {
    const placementCount=records(slot).length;
    const selected=selectedCard[slot];
    const relationship=relationshipFocus[slot];
    const focusActive=!!(selected||relationship);
    const buttons=hits.map(hit=>{
      const isSelected=hit.id===selected;
      const isRelationship=hit.id===relationship;
      const dimmed=focusActive&&!isSelected&&!isRelationship;
      const classes=['sky-card-hit',isSelected?'is-selected':'',isRelationship?'is-relationship-match':'',dimmed?'is-dimmed':''].filter(Boolean).join(' ');
      const action=isSelected?'Clear card focus':'Focus chart through this card';
      return `<button class="${classes}" type="button" data-card-hit-id="${esc(hit.id)}" aria-pressed="${isSelected?'true':'false'}" aria-label="${esc(displayName(hit.card))}, ${hit.count} associated placement${hit.count===1?'':'s'}. ${action}."><span class="sky-card-hit-art"><img src="${esc(thumbnailFor(hit.card))}" alt="" width="${THUMB.width}" height="${THUMB.height}" loading="lazy" decoding="async" fetchpriority="low"><span class="sky-card-hit-chip">×${hit.count}</span></span><span class="sky-card-hit-name">${esc(displayName(hit.card))}</span></button>`;
    }).join('');
    const selectedHit=hits.find(hit=>hit.id===selected);
    return `<section class="sky-card-hits-tab" data-card-hits-slot="${slot}"><header class="sky-card-hits-tab-header"><span class="sky-card-hits-tab-total">${hits.length} card${hits.length===1?'':'s'} · ${placementCount} placement${placementCount===1?'':'s'}</span></header>${hits.length?`<div class="sky-card-hits-grid">${buttons}</div>`:'<p class="sky-card-hits-empty">Add placements to see their Tarot correspondences.</p>'}${detailMarkup(selectedHit)}</section>`;
  }
  function host(slot) {
    return panel(slot)?.querySelector(`[data-card-hits-host="${slot}"]`) || null;
  }
  function renderCardHits(slot) {
    const node=host(slot);
    if(!node)return;
    const hits=buildTally(slot);
    if(selectedCard[slot]&&!hits.some(hit=>hit.id===selectedCard[slot])) selectedCard[slot]='';
    node.innerHTML=gridMarkup(slot,hits);
  }
  function selectionFor(slot) {
    if(!selectedCard[slot])return null;
    const hit=buildTally(slot).find(item=>item.id===selectedCard[slot]);
    if(!hit)return null;
    const placements=Array.from(new Set(hit.placements.map(entry=>entry.record.placementId).filter(Boolean)));
    return {cardId:hit.id,placements};
  }
  function emitSelection() {
    window.dispatchEvent(new CustomEvent('relphi:sky-card-hit-selection-changed',{
      detail:{A:selectionFor('A'),B:selectionFor('B')}
    }));
  }

  function hydrateSlot(slot) {
    const root=ensureDrawers(slot);
    if(!root)return;
    syncDrawerVisibility(slot);
    renderCardHits(slot);
  }
  function hydrate() {
    ['A','B'].forEach(hydrateSlot);
    emitSelection();
  }

  document.addEventListener('click',event=>{
    const toggle=event.target.closest('[data-sky-drawer-toggle]');
    if(toggle){
      const slot=toggle.closest('#skyFoundationA')?'A':toggle.closest('#skyFoundationB')?'B':'';
      if(!slot)return;
      event.preventDefault();
      const key=toggle.dataset.skyDrawerToggle;
      const state=drawerState(slot);
      writeDrawerState(slot,{[key]:!state[key]});
      syncDrawerVisibility(slot);
      return;
    }
    const cardButton=event.target.closest('.sky-card-hit[data-card-hit-id]');
    if(cardButton){
      const slot=cardButton.closest('[data-card-hits-slot]')?.dataset.cardHitsSlot;
      if(!slot)return;
      event.preventDefault();
      const id=cardButton.dataset.cardHitId||'';
      selectedCard[slot]=selectedCard[slot]===id?'':id;
      renderCardHits(slot);
      emitSelection();
      return;
    }
    const clear=event.target.closest('[data-card-hit-clear]');
    if(clear){
      const slot=clear.closest('[data-card-hits-slot]')?.dataset.cardHitsSlot;
      if(!slot)return;
      event.preventDefault();
      selectedCard[slot]='';
      renderCardHits(slot);
      emitSelection();
      return;
    }
    if(event.target.closest('[data-ww-action="edit"],[data-final-now]')){
      const slot=event.target.closest('#skyFoundationA')?'A':event.target.closest('#skyFoundationB')?'B':'';
      if(slot)requestAnimationFrame(()=>hydrateSlot(slot));
    }
  },true);

  window.addEventListener('relphi:sky-relationship-card-focus',event=>{
    const detail=event.detail||{};
    relationshipFocus.A=detail.active?String(detail.A||''):'';
    relationshipFocus.B=detail.active?String(detail.B||''):'';
    ['A','B'].forEach(slot=>{
      if(panel(slot)?.querySelector(`[data-card-hits-host="${slot}"]`)) renderCardHits(slot);
    });
  });
  window.addEventListener('relphi:sky-card-hit-clear-requested',()=>{
    selectedCard.A='';
    selectedCard.B='';
    ['A','B'].forEach(renderCardHits);
    emitSelection();
  });
  window.addEventListener('storage',event=>{
    if(Object.values(KEYS).includes(event.key)) requestAnimationFrame(hydrate);
  });
  window.addEventListener('relphi:sky-foundation-ready',()=>requestAnimationFrame(hydrate));
  window.addEventListener('relphi:sky-foundation-interactions-ready',()=>requestAnimationFrame(hydrate));
  window.addEventListener('relphi:sky-heptagram-source-ready',()=>requestAnimationFrame(hydrate));

  function start(){requestAnimationFrame(hydrate)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();