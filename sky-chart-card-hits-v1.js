// Restore the historical Chart Card Hits tally beneath each independent sky.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyChartCardHitsV1) return;
  window.__relphiSkyChartCardHitsV1 = true;

  const KEYS = { A:'relphiSkyChartA', B:'relphiSkyChartB' };
  const COLORS = { A:'#c9211e', B:'#2462d0' };
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const SIGN_RULERS = ['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
  const EXALTATIONS = ['Sun','Moon','', 'Jupiter','', 'Mercury','Saturn','', '', 'Mars','', 'Venus'];
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
    sun:'Sun', moon:'Moon', mercury:'Mercury', venus:'Venus', mars:'Mars', jupiter:'Jupiter', saturn:'Saturn',
    uranus:'Uranus', neptune:'Neptune', pluto:'Pluto', asc:'Ascendant', rising:'Ascendant', ascendant:'Ascendant',
    dsc:'Descendant', descendant:'Descendant', mc:'Midheaven', midheaven:'Midheaven', ic:'Imum Coeli',
    'north-node':'North Node', 'north node':'North Node', node:'North Node', 'south-node':'South Node',
    'south node':'South Node', chiron:'Chiron', lilith:'Lilith', vertex:'Vertex',
    'part-of-fortune':'Part of Fortune', 'part of fortune':'Part of Fortune', fortune:'Part of Fortune'
  };
  const PLANET_CLASS = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
  const selectedCard = { A:'', B:'' };
  let scheduled = false;
  let observer = null;

  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[character]));
  const norm = value => ((Number(value) % 360) + 360) % 360;

  function installStyles() {
    if (document.getElementById('skyChartCardHitsStylesV1')) return;
    const style = document.createElement('style');
    style.id = 'skyChartCardHitsStylesV1';
    style.textContent = `
      .sky-card-hits{--sky-hit-color:#555;margin:1rem 0 0;padding:.9rem;border:1px solid rgba(31,27,24,.16);border-top:5px solid var(--sky-hit-color);border-radius:1rem;background:#fffdfa;min-width:0;box-sizing:border-box}
      .sky-card-hits[data-sky-slot="A"]{--sky-hit-color:#c9211e}.sky-card-hits[data-sky-slot="B"]{--sky-hit-color:#2462d0}
      .sky-card-hits-header{display:flex;align-items:baseline;justify-content:space-between;gap:.7rem;margin:0 0 .7rem}
      .sky-card-hits-title{margin:0;font:850 1rem/1.1 system-ui,sans-serif;letter-spacing:.02em}
      .sky-card-hits-total{font:700 .72rem/1.2 system-ui,sans-serif;color:#625d58;text-align:right}
      .sky-card-hits-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(62px,1fr));gap:.55rem;align-items:start}
      .sky-card-hit{position:relative;display:grid;grid-template-rows:auto auto;justify-items:center;gap:.3rem;width:100%;min-width:0;margin:0;padding:.25rem;border:2px solid transparent;border-radius:.7rem;background:transparent;color:#171717;cursor:pointer;box-sizing:border-box}
      .sky-card-hit:hover,.sky-card-hit:focus-visible{border-color:var(--sky-hit-color);outline:0;background:#fff}
      .sky-card-hit[aria-pressed="true"]{border-color:var(--sky-hit-color);background:#fff;box-shadow:0 0 0 2px color-mix(in srgb,var(--sky-hit-color) 16%,transparent)}
      .sky-card-hit-art{position:relative;display:block;width:min(100%,68px);aspect-ratio:352/608;border-radius:.3rem;overflow:hidden;background:#eee9e3;box-shadow:0 1px 4px rgba(0,0,0,.14)}
      .sky-card-hit-art img{display:block;width:100%;height:100%;object-fit:cover}
      .sky-card-hit-chip{position:absolute;right:-.25rem;top:-.35rem;display:grid;place-items:center;min-width:1.75rem;height:1.75rem;padding:0 .32rem;border:2px solid #fff;border-radius:999px;background:var(--sky-hit-color);color:#fff;font:900 .73rem/1 system-ui,sans-serif;box-shadow:0 1px 4px rgba(0,0,0,.22)}
      .sky-card-hit-name{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;max-width:100%;font:750 .68rem/1.12 system-ui,sans-serif;text-align:center}
      .sky-card-hit-detail{margin:.75rem 0 0;padding:.75rem;border-radius:.75rem;background:#f3f0ec;text-align:left}
      .sky-card-hit-detail[hidden]{display:none!important}.sky-card-hit-detail h4{margin:0 0 .45rem;font:850 .95rem/1.2 system-ui,sans-serif}
      .sky-card-hit-reasons{margin:0;padding-left:1.25rem;font:500 .79rem/1.38 system-ui,sans-serif;color:#35312e}.sky-card-hit-reasons li+li{margin-top:.3rem}
      .sky-card-hits-empty{margin:0;font:600 .8rem/1.4 system-ui,sans-serif;color:#625d58}
      @media(max-width:620px){
        .sky-card-hits{padding:.75rem}.sky-card-hits-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:.42rem}
        .sky-card-hit{padding:.2rem}.sky-card-hit-name{font-size:.64rem}.sky-card-hit-detail{padding:.7rem}.sky-card-hit-reasons{font-size:.78rem}
      }
      @media(max-width:390px){.sky-card-hits-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
    `;
    document.head.appendChild(style);
  }

  function readPayload(slot) {
    try { return JSON.parse(localStorage.getItem(KEYS[slot]) || 'null'); }
    catch (_) { return null; }
  }

  function placementSource(payload) {
    if (!payload || typeof payload !== 'object') return [];
    const known = [payload.placements,payload.positions,payload.points,payload.bodies]
      .find(value => value && typeof value === 'object');
    const source = known || payload;
    if (Array.isArray(source)) return source.map((item,index) => [String(item?.name || item?.label || item?.id || index),item]);
    return Object.entries(source).filter(([key,value]) => value && typeof value === 'object' && !Array.isArray(value) &&
      !/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key));
  }

  function longitude(item) {
    if (Number.isFinite(Number(item?.longitude))) return norm(item.longitude);
    const sign = SIGNS.findIndex(name => name.toLowerCase() === String(item?.sign || item?.zodiac || '').trim().toLowerCase());
    if (sign < 0) return NaN;
    return norm(sign * 30 + Number(item?.degree || item?.degrees || 0) + Number(item?.minute || item?.minutes || 0) / 60 + Number(item?.second || item?.seconds || 0) / 3600);
  }

  function bodyName(key,item) {
    const candidates = [item?.name,item?.label,item?.body,item?.planet,item?.point,item?.id,item?.glyphId,key];
    for (const candidate of candidates) {
      if (candidate == null) continue;
      const raw = String(candidate).trim();
      const normalized = raw.toLowerCase().replace(/_/g,'-');
      if (BODY_ALIASES[normalized]) return BODY_ALIASES[normalized];
      const registry = window.RelphiGlyphRegistry;
      const entry = registry?.resolve?.(raw) || registry?.get?.(raw);
      if (entry?.name) return entry.name;
    }
    return String(key || 'Placement');
  }

  function records(slot) {
    return placementSource(readPayload(slot)).map(([key,item]) => {
      const value = longitude(item);
      if (!Number.isFinite(value)) return null;
      const signIndex = Math.floor(value / 30);
      const within = value - signIndex * 30;
      const degree = Math.floor(within);
      const minute = Math.floor((within - degree) * 60 + 1e-8);
      return { key,item,body:bodyName(key,item),value,signIndex,sign:SIGNS[signIndex],degree,minute,decan:Math.min(2,Math.floor(degree / 10)) };
    }).filter(Boolean);
  }

  function cards() { return Array.isArray(window.RELPHI_TAROT_CARDS) ? window.RELPHI_TAROT_CARDS : []; }
  function cardById(id) { return cards().find(card => card.card_id === id || card.stable_symbol_id === id) || null; }
  function splitValues(value) { return String(value || '').split(',').map(item => item.trim()).filter(Boolean); }

  function cardForPlanet(planet) {
    const direct = cards().find(card => card.arcana === 'Major' && splitValues(card.astrology?.planet).includes(planet));
    if (direct) return direct;
    return cardById(OUTER_PLANET_CARDS[planet]);
  }

  function cardForSign(sign) {
    return cards().find(card => card.arcana === 'Major' && splitValues(card.astrology?.sign).includes(sign)) || null;
  }

  function cardForDecan(record) { return cardById(DECAN_CARDS[record.signIndex]?.[record.decan]); }
  function displayName(card) { return card?.systems?.golden_dawn_rws?.display_name || card?.name || String(card?.card_id || '').replace(/_/g,' '); }
  function imageFor(card) { return `assets/tarot/rws/${encodeURIComponent(card.card_id)}.webp?v=chart-card-hits-v1`; }
  function positionLabel(record) { return `${record.body} at ${record.degree}°${String(record.minute).padStart(2,'0')}′ ${record.sign}`; }

  function addHit(tally,card,reason,key) {
    if (!card || !reason) return;
    const id = card.card_id || card.stable_symbol_id;
    if (!id) return;
    let hit = tally.get(id);
    if (!hit) {
      hit = { id,card,reasons:[],keys:new Set() };
      tally.set(id,hit);
    }
    const unique = key || `${id}|${reason}`;
    if (hit.keys.has(unique)) return;
    hit.keys.add(unique);
    hit.reasons.push(reason);
  }

  function addPlacementHits(tally,record,index) {
    const source = `placement-${index}-${record.key}`;
    const position = positionLabel(record);
    if (PLANET_NAMES.has(record.body)) {
      addHit(tally,cardForPlanet(record.body),`${position}: ${record.body} is the placed planetary power.`,`${source}|body`);
    }
    addHit(tally,cardForSign(record.sign),`${position}: ${record.sign} supplies the zodiacal archetype.`,`${source}|sign`);
    addHit(tally,cardForDecan(record),`${position}: the exact degree occupies ${record.sign} decan ${record.decan + 1}.`,`${source}|decan-card`);

    const signRuler = SIGN_RULERS[record.signIndex];
    addHit(tally,cardForPlanet(signRuler),`${position}: ${signRuler} rules ${record.sign}.`,`${source}|sign-ruler`);

    const exalted = EXALTATIONS[record.signIndex];
    if (exalted) addHit(tally,cardForPlanet(exalted),`${position}: ${exalted} is exalted in ${record.sign}.`,`${source}|exaltation`);

    const decanRuler = DECAN_RULERS[record.signIndex][record.decan];
    addHit(tally,cardForPlanet(decanRuler),`${position}: ${record.sign} decan ${record.decan + 1} is ruled by ${decanRuler}.`,`${source}|decan-ruler`);
  }

  function planetFromHeptagramGroup(group) {
    if (!group) return '';
    const className = String(group.className?.baseVal || group.className || '');
    const key = PLANET_CLASS.find(planet => className.includes(`sky-ph-${planet}`));
    return key ? key[0].toUpperCase() + key.slice(1) : '';
  }

  function addPlanetaryHourHits(tally,slot) {
    const panel = document.getElementById(`skyFoundation${slot}`);
    if (!panel) return;
    let day = planetFromHeptagramGroup(panel.querySelector('.sky-ph-planet.is-day-ruler,.sky-ph-node.day')?.closest?.('.sky-ph-planet'));
    let hour = planetFromHeptagramGroup(panel.querySelector('.sky-ph-planet.is-hour-ruler,.sky-ph-node.hour')?.closest?.('.sky-ph-planet'));
    const caption = panel.querySelector('.sky-ph-caption,.sky-ph-summary')?.textContent || panel.textContent || '';
    if (!day) day = (caption.match(/\b(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn)\s+day\b/i) || [])[1] || '';
    if (!hour) hour = (caption.match(/\b(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn)\s+hour\b/i) || [])[1] || '';
    if (day) addHit(tally,cardForPlanet(capitalize(day)),`${capitalize(day)} is the planetary day ruler.`,`planetary-day|${capitalize(day)}`);
    if (hour) addHit(tally,cardForPlanet(capitalize(hour)),`${capitalize(hour)} is the planetary hour ruler.`,`planetary-hour|${capitalize(hour)}`);
  }

  function capitalize(value) { const text = String(value || '').toLowerCase(); return text ? text[0].toUpperCase() + text.slice(1) : ''; }

  function rowIncluded(row) {
    if (!row || row.hidden || row.getAttribute('aria-hidden') === 'true') return false;
    if (row.dataset.filteredOut === 'true' || row.dataset.relationshipVisible === 'false') return false;
    const style = getComputedStyle(row);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  function endpointName(row,side) {
    const data = side === 'left' ? row.dataset.leftPlacement : row.dataset.rightPlacement;
    const normalized = String(data || '').toLowerCase().replace(/_/g,'-');
    return BODY_ALIASES[normalized] || data || '';
  }

  function aspectName(row) {
    const raw = String(row.dataset.aspect || '').replace(/-/g,' ');
    return raw ? raw.replace(/\b\w/g,letter => letter.toUpperCase()) : 'Aspect';
  }

  function addAspectHits(tally,slot) {
    document.querySelectorAll('.sky-foundation-relationship-row[data-relation-index]').forEach(row => {
      if (!rowIncluded(row)) return;
      const leftSlot = row.dataset.leftSky || row.dataset.skyA || 'A';
      const rightSlot = row.dataset.rightSky || row.dataset.skyB || 'B';
      const left = endpointName(row,'left');
      const right = endpointName(row,'right');
      const aspect = aspectName(row);
      const relation = row.dataset.relationIndex || `${left}|${aspect}|${right}`;
      if (leftSlot === slot && PLANET_NAMES.has(left)) {
        addHit(tally,cardForPlanet(left),`${left} participates in the ${aspect.toLowerCase()} with ${right || 'the other placement'}.`,`aspect|${relation}|${slot}|left`);
      }
      if (rightSlot === slot && PLANET_NAMES.has(right)) {
        addHit(tally,cardForPlanet(right),`${right} participates in the ${aspect.toLowerCase()} with ${left || 'the other placement'}.`,`aspect|${relation}|${slot}|right`);
      }
    });
  }

  function buildTally(slot) {
    const tally = new Map();
    records(slot).forEach((record,index) => addPlacementHits(tally,record,index));
    addPlanetaryHourHits(tally,slot);
    addAspectHits(tally,slot);
    return Array.from(tally.values()).map(hit => ({ ...hit,count:hit.reasons.length })).sort((a,b) =>
      b.count - a.count || (a.card.arcana === b.card.arcana ? 0 : a.card.arcana === 'Major' ? -1 : 1) || displayName(a.card).localeCompare(displayName(b.card))
    );
  }

  function ensureSection(slot) {
    const body = document.querySelector(`#skyFoundation${slot} .sky-foundation-body`);
    if (!body) return null;
    let section = body.querySelector(`:scope > .sky-card-hits[data-sky-slot="${slot}"]`);
    if (!section) {
      section = document.createElement('section');
      section.className = 'sky-card-hits';
      section.dataset.skySlot = slot;
      section.setAttribute('aria-label',`Chart Card Hits for Sky ${slot}`);
      body.appendChild(section);
    }
    return section;
  }

  function detailMarkup(hit) {
    if (!hit) return '';
    return `<h4>${esc(displayName(hit.card))} ×${hit.count}</h4><ol class="sky-card-hit-reasons">${hit.reasons.map(reason => `<li>${esc(reason)}</li>`).join('')}</ol>`;
  }

  function renderSlot(slot) {
    const section = ensureSection(slot);
    if (!section) return;
    const hits = buildTally(slot);
    const activationCount = hits.reduce((sum,hit) => sum + hit.count,0);
    const selected = hits.find(hit => hit.id === selectedCard[slot]) || null;
    if (!selected) selectedCard[slot] = '';

    section.innerHTML = `<header class="sky-card-hits-header"><h3 class="sky-card-hits-title">Chart Card Hits</h3><span class="sky-card-hits-total">${activationCount} activation${activationCount === 1 ? '' : 's'} · ${hits.length} card${hits.length === 1 ? '' : 's'}</span></header>` +
      (hits.length ? `<div class="sky-card-hits-grid">${hits.map(hit => `<button class="sky-card-hit" type="button" data-card-hit-id="${esc(hit.id)}" aria-pressed="${selectedCard[slot] === hit.id ? 'true' : 'false'}" aria-label="${esc(displayName(hit.card))}, ${hit.count} hits. Show sources."><span class="sky-card-hit-art"><img src="${esc(imageFor(hit.card))}" alt="" loading="lazy"><span class="sky-card-hit-chip">×${hit.count}</span></span><span class="sky-card-hit-name">${esc(displayName(hit.card))}</span></button>`).join('')}</div><div class="sky-card-hit-detail" ${selected ? '' : 'hidden'} aria-live="polite">${detailMarkup(selected)}</div>` : '<p class="sky-card-hits-empty">Add placements to see which cards the sky activates.</p>');
    section.dataset.hitCount = String(activationCount);
    section.dataset.cardCount = String(hits.length);
  }

  function render() {
    scheduled = false;
    if (!window.RELPHI_TAROT_CARDS) return;
    renderSlot('A');
    renderSlot('B');
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => requestAnimationFrame(render));
  }

  function handleClick(event) {
    const button = event.target.closest('.sky-card-hit');
    if (!button) return;
    const section = button.closest('.sky-card-hits');
    const slot = section?.dataset.skySlot;
    if (!slot) return;
    const id = button.dataset.cardHitId || '';
    selectedCard[slot] = selectedCard[slot] === id ? '' : id;
    renderSlot(slot);
    section.querySelector(`[data-card-hit-id="${CSS.escape(selectedCard[slot] || id)}"]`)?.focus({preventScroll:true});
  }

  function start() {
    installStyles();
    document.addEventListener('click',handleClick);
    ['relphi:sky-foundation-rendered','relphi:sky-foundation-interactions-ready','relphi:sky-foundation-filter-changed','relphi:sky-heptagram-source-ready'].forEach(name => window.addEventListener(name,schedule));
    window.addEventListener('storage',event => { if (Object.values(KEYS).includes(event.key)) schedule(); });
    observer = new MutationObserver(mutations => {
      if (mutations.some(mutation => {
        const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
        if (target?.closest?.('.sky-card-hits')) return false;
        return mutation.addedNodes.length || mutation.removedNodes.length || mutation.type === 'attributes';
      })) schedule();
    });
    observer.observe(document.getElementById('skyFoundationRoot') || document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','style','class','aria-hidden']});
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
