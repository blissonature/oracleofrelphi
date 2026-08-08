// Stable Chart Card Hits tally beneath each independent sky.
// Card clicks explain accumulated hit evidence; they never filter the Sky Chart.
// Card art is requested only as tiny 48x83 WebP thumbnails; the browser never requests full card files here.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyChartCardHitsV8) return;
  window.__relphiSkyChartCardHitsV2 = true;
  window.__relphiSkyChartCardHitsV3 = true;
  window.__relphiSkyChartCardHitsV4 = true;
  window.__relphiSkyChartCardHitsV5 = true;
  window.__relphiSkyChartCardHitsV6 = true;
  window.__relphiSkyChartCardHitsV7 = true;
  window.__relphiSkyChartCardHitsV8 = true;

  const KEYS = { A:'relphiSkyChartA', B:'relphiSkyChartB' };
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
  const MAJOR_CODES = Object.freeze({
    the_fool:'0',the_magician:'I',the_high_priestess:'II',the_empress:'III',the_emperor:'IV',the_hierophant:'V',the_lovers:'VI',the_chariot:'VII',strength:'VIII',the_hermit:'IX',wheel_of_fortune:'X',justice:'XI',the_hanged_man:'XII',death:'XIII',temperance:'XIV',the_devil:'XV',the_tower:'XVI',the_star:'XVII',the_moon:'XVIII',the_sun:'XIX',judgement:'XX',the_world:'XXI'
  });
  const RANK_CODES = Object.freeze({two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9',ten:'10'});
  const SUIT_CODES = Object.freeze({wands:'W',cups:'C',swords:'S',pentacles:'P'});
  const THUMB = Object.freeze({ width:48, height:83, quality:30 });
  const selectedCard = { A:'', B:'' };
  const renderSignature = { A:'', B:'' };
  let scheduled = false;

  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[character]));
  const norm = value => ((Number(value) % 360) + 360) % 360;

  function installStyles() {
    if (document.getElementById('skyChartCardHitsStylesV8')) return;
    ['skyChartCardHitsStylesV7','skyChartCardHitsStylesV6','skyChartCardHitsStylesV5','skyChartCardHitsStylesV4','skyChartCardHitsStylesV3','skyChartCardHitsStylesV2'].forEach(id => document.getElementById(id)?.remove());
    const style = document.createElement('style');
    style.id = 'skyChartCardHitsStylesV8';
    style.textContent = `
      .sky-card-hits{--sky-hit-color:#555;margin:1rem 0 0;padding:.9rem;border:1px solid rgba(31,27,24,.16);border-top:5px solid var(--sky-hit-color);border-radius:1rem;background:#fffdfa;min-width:0;box-sizing:border-box}
      #skyFoundationA>.sky-card-hits{--sky-hit-color:#c9211e}#skyFoundationB>.sky-card-hits{--sky-hit-color:#2462d0}
      .sky-card-hits-header{display:flex;align-items:baseline;justify-content:space-between;gap:.7rem;margin:0 0 .7rem}
      .sky-card-hits-title{margin:0;font:850 1rem/1.1 system-ui,sans-serif;letter-spacing:.02em}
      .sky-card-hits-total{font:700 .72rem/1.2 system-ui,sans-serif;color:#625d58;text-align:right}
      .sky-card-hits-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(62px,1fr));gap:.48rem;align-items:start}
      .sky-card-hit{position:relative;display:grid;grid-template-rows:auto auto;justify-items:center;gap:.28rem;width:100%;min-width:0;margin:0;padding:.22rem;border:2px solid transparent;border-radius:.7rem;background:transparent;color:#171717;cursor:pointer;box-sizing:border-box}
      .sky-card-hit:hover,.sky-card-hit:focus-visible{border-color:var(--sky-hit-color);outline:0;background:#fff}
      .sky-card-hit[aria-pressed="true"]{border-color:var(--sky-hit-color);background:#fff;box-shadow:0 0 0 2px color-mix(in srgb,var(--sky-hit-color) 16%,transparent)}
      .sky-card-hit-art{position:relative;display:grid;place-items:center;width:${THUMB.width}px;height:${THUMB.height}px;border:1px solid color-mix(in srgb,var(--sky-hit-color) 45%,#8d837b);border-radius:.3rem;overflow:hidden;background:linear-gradient(180deg,#fffdf8,#eee8df);box-shadow:0 1px 3px rgba(0,0,0,.1)}
      .sky-card-hit-code{padding:.15rem;color:#4d4640;font:900 .72rem/1 Georgia,serif;text-align:center}
      .sky-card-hit-art img{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover;image-rendering:auto}
      .sky-card-hit-chip{position:absolute;z-index:2;right:-.5rem;top:-.45rem;display:grid;place-items:center;min-width:1.65rem;height:1.65rem;padding:0 .28rem;border:2px solid #fff;border-radius:999px;background:var(--sky-hit-color);color:#fff;font:900 .7rem/1 system-ui,sans-serif;box-shadow:0 1px 4px rgba(0,0,0,.2)}
      .sky-card-hit-name{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;max-width:100%;font:750 .66rem/1.1 system-ui,sans-serif;text-align:center}
      .sky-card-hits-empty{margin:0;font:600 .8rem/1.4 system-ui,sans-serif;color:#625d58}
      .sky-card-hit-detail{margin-top:.8rem;padding:.75rem;border:1px solid color-mix(in srgb,var(--sky-hit-color) 28%,#d9d4ce);border-radius:.85rem;background:#fff;box-shadow:0 6px 18px rgba(31,27,24,.06)}
      .sky-card-hit-detail[hidden]{display:none!important}
      .sky-card-hit-detail-header{display:flex;align-items:start;justify-content:space-between;gap:.65rem;margin-bottom:.35rem}
      .sky-card-hit-detail-title{display:grid;gap:.1rem;min-width:0}.sky-card-hit-detail-title strong{font:900 .82rem/1.15 system-ui,sans-serif}.sky-card-hit-detail-title span{font:800 .68rem/1.2 system-ui,sans-serif;color:var(--sky-hit-color)}
      .sky-card-hit-detail-close{display:grid;place-items:center;width:1.8rem;height:1.8rem;padding:0;border:1px solid rgba(31,27,24,.16);border-radius:999px;background:#fff;color:#403a35;font:900 1rem/1 system-ui,sans-serif;cursor:pointer}
      .sky-card-hit-detail-note{margin:.2rem 0 .5rem;color:#625d58;font:650 .68rem/1.35 system-ui,sans-serif}
      .sky-card-hit-reasons{display:grid;gap:.35rem;max-height:220px;margin:0;padding:.15rem .2rem .1rem 1.15rem;overflow:auto;color:#403a35;font:650 .67rem/1.35 system-ui,sans-serif;scrollbar-width:thin}
      .sky-card-hit-reasons li::marker{color:var(--sky-hit-color);font-weight:900}
      @media(max-width:620px){.sky-card-hits{padding:.75rem}.sky-card-hits-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:.38rem}.sky-card-hit{padding:.18rem}.sky-card-hit-name{font-size:.62rem}.sky-card-hit-detail{padding:.65rem}}
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
  function cardCode(card) {
    const id=String(card?.card_id||card?.stable_symbol_id||'');
    if (MAJOR_CODES[id]) return MAJOR_CODES[id];
    const parts=id.split('_of_');
    if (parts.length===2) return `${RANK_CODES[parts[0]]||parts[0].slice(0,2).toUpperCase()}${SUIT_CODES[parts[1]]||parts[1].slice(0,1).toUpperCase()}`;
    return 'RWS';
  }
  function thumbnailFor(card) {
    const id = encodeURIComponent(card?.card_id || card?.stable_symbol_id || '');
    const source = new URL(`assets/tarot/rws/${id}.webp`, document.baseURI).href;
    const thumb = new URL('https://wsrv.nl/');
    thumb.searchParams.set('url', source);
    thumb.searchParams.set('w', String(THUMB.width));
    thumb.searchParams.set('h', String(THUMB.height));
    thumb.searchParams.set('fit', 'cover');
    thumb.searchParams.set('output', 'webp');
    thumb.searchParams.set('q', String(THUMB.quality));
    return thumb.href;
  }
  function positionLabel(record) { return `${record.body} at ${record.degree}°${String(record.minute).padStart(2,'0')}′ ${record.sign}`; }

  function addHit(tally,card,reason,key) {
    if (!card || !reason) return;
    const id = card.card_id || card.stable_symbol_id;
    if (!id) return;
    let hit = tally.get(id);
    if (!hit) { hit = { id,card,reasons:[],keys:new Set() }; tally.set(id,hit); }
    const unique = key || `${id}|${reason}`;
    if (hit.keys.has(unique)) return;
    hit.keys.add(unique);
    hit.reasons.push(reason);
  }

  function addPlacementHits(tally,record,index) {
    const source = `placement-${index}-${record.key}`;
    const position = positionLabel(record);
    if (PLANET_NAMES.has(record.body)) addHit(tally,cardForPlanet(record.body),`${position}: ${record.body} is the placed planetary power.`,`${source}|body`);
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
  function capitalize(value) { const text = String(value || '').toLowerCase(); return text ? text[0].toUpperCase() + text.slice(1) : ''; }

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

  function buildTally(slot) {
    const tally = new Map();
    records(slot).forEach((record,index) => addPlacementHits(tally,record,index));
    addPlanetaryHourHits(tally,slot);
    return Array.from(tally.values()).map(hit => ({ ...hit,count:hit.reasons.length })).sort((a,b) =>
      b.count - a.count || (a.card.arcana === b.card.arcana ? 0 : a.card.arcana === 'Major' ? -1 : 1) || displayName(a.card).localeCompare(displayName(b.card))
    );
  }

  function ensureSection(slot) {
    const panel = document.getElementById(`skyFoundation${slot}`);
    if (!panel) return null;
    const body = panel.querySelector(':scope > .sky-foundation-body');
    let section = panel.querySelector(`:scope > .sky-card-hits[data-sky-slot="${slot}"]`);
    if (!section) {
      section = document.createElement('section');
      section.className = 'sky-card-hits';
      section.dataset.skySlot = slot;
      section.setAttribute('aria-label',`Chart Card Hits for Sky ${slot}`);
      if (body?.nextSibling) panel.insertBefore(section,body.nextSibling);
      else panel.appendChild(section);
    }
    return section;
  }

  function tallySignature(hits) { return JSON.stringify(hits.map(hit => [hit.id,hit.count,hit.reasons])); }

  function detailMarkup(hit) {
    return `<div class="sky-card-hit-detail-header"><div class="sky-card-hit-detail-title"><strong>${esc(displayName(hit.card))}</strong><span>${hit.count} activation${hit.count === 1 ? '' : 's'}</span></div><button class="sky-card-hit-detail-close" type="button" data-card-hit-close aria-label="Close card-hit explanation">×</button></div><p class="sky-card-hit-detail-note">Why this card appears in this sky. These are contributing chart facts; aspect relationships are not part of the tally and nothing on the wheel or in Relationships is filtered.</p><ol class="sky-card-hit-reasons">${hit.reasons.map(reason => `<li>${esc(reason)}</li>`).join('')}</ol>`;
  }

  function syncSelection(slot,section,hits) {
    section.querySelectorAll('.sky-card-hit[data-card-hit-id]').forEach(button => button.setAttribute('aria-pressed',button.dataset.cardHitId === selectedCard[slot] ? 'true' : 'false'));
    const detail = section.querySelector('.sky-card-hit-detail');
    if (!detail) return;
    const hit = (hits || buildTally(slot)).find(item => item.id === selectedCard[slot]);
    if (!hit) { detail.hidden = true; detail.replaceChildren(); delete detail.dataset.cardHitId; return; }
    const signature = JSON.stringify([hit.id,hit.count,hit.reasons]);
    if (detail.dataset.detailSignature !== signature) {
      detail.innerHTML = detailMarkup(hit);
      detail.dataset.detailSignature = signature;
      detail.dataset.cardHitId = hit.id;
    }
    detail.hidden = false;
  }

  function renderSlot(slot) {
    const section = ensureSection(slot);
    if (!section) return;
    const hits = buildTally(slot);
    const activationCount = hits.reduce((sum,hit) => sum + hit.count,0);
    const signature = tallySignature(hits);
    if (renderSignature[slot] === signature && section.firstElementChild) { syncSelection(slot,section,hits); return; }
    if (!hits.some(hit => hit.id === selectedCard[slot])) selectedCard[slot] = '';
    section.innerHTML = `<header class="sky-card-hits-header"><h3 class="sky-card-hits-title">Chart Card Hits</h3><span class="sky-card-hits-total">${activationCount} activation${activationCount === 1 ? '' : 's'} · ${hits.length} card${hits.length === 1 ? '' : 's'}</span></header>` +
      (hits.length ? `<div class="sky-card-hits-grid">${hits.map(hit => `<button class="sky-card-hit" type="button" data-card-hit-id="${esc(hit.id)}" aria-pressed="${selectedCard[slot] === hit.id ? 'true' : 'false'}" aria-label="${esc(displayName(hit.card))}, ${hit.count} hits. Show why this card appears."><span class="sky-card-hit-art"><span class="sky-card-hit-code" aria-hidden="true">${esc(cardCode(hit.card))}</span><img src="${esc(thumbnailFor(hit.card))}" alt="" width="${THUMB.width}" height="${THUMB.height}" loading="lazy" decoding="async" fetchpriority="low"><span class="sky-card-hit-chip">×${hit.count}</span></span><span class="sky-card-hit-name">${esc(displayName(hit.card))}</span></button>`).join('')}</div><div class="sky-card-hit-detail" hidden></div>` : '<p class="sky-card-hits-empty">Add placements to see which cards the sky activates.</p>');
    renderSignature[slot] = signature;
    section.dataset.hitCount = String(activationCount);
    section.dataset.cardCount = String(hits.length);
    section.dataset.cardMedia = `thumbnail-${THUMB.width}x${THUMB.height}`;
    syncSelection(slot,section,hits);
  }

  function render() {
    scheduled = false;
    if (!window.RELPHI_TAROT_CARDS) return;
    renderSlot('A'); renderSlot('B');
  }
  function schedule() { if (scheduled) return; scheduled = true; requestAnimationFrame(() => requestAnimationFrame(render)); }

  function handleClick(event) {
    const close = event.target.closest('[data-card-hit-close]');
    if (close) {
      const section = close.closest('.sky-card-hits'),slot = section?.dataset.skySlot;
      if (!slot) return;
      selectedCard[slot] = ''; syncSelection(slot,section,buildTally(slot)); return;
    }
    const button = event.target.closest('.sky-card-hit');
    if (!button) return;
    const section = button.closest('.sky-card-hits'),slot = section?.dataset.skySlot;
    if (!slot) return;
    const id = button.dataset.cardHitId || '';
    selectedCard[slot] = selectedCard[slot] === id ? '' : id;
    syncSelection(slot,section,buildTally(slot));
    button.focus({preventScroll:true});
  }

  function clearCardSelection() {
    selectedCard.A = ''; selectedCard.B = '';
    document.querySelectorAll('.sky-card-hits').forEach(section => syncSelection(section.dataset.skySlot,section,buildTally(section.dataset.skySlot)));
  }

  function start() {
    installStyles();
    document.addEventListener('click',handleClick);
    window.addEventListener('relphi:sky-foundation-clear-selection',clearCardSelection);
    ['relphi:sky-foundation-ready','relphi:sky-foundation-rendered','relphi:sky-foundation-interactions-ready','relphi:sky-heptagram-source-ready'].forEach(name => window.addEventListener(name,schedule));
    window.addEventListener('storage',event => { if (Object.values(KEYS).includes(event.key)) schedule(); });
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
