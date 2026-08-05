// Selected Relationship v4: one compact progressive-reveal composition.
(function () {
  'use strict';
  if (window.__relphiSkySelectedRelationshipV3) return;
  window.__relphiSkySelectedRelationshipV3 = true;
  // Compatibility marker retained for existing integrations that only test v2.
  window.__relphiSkySelectedRelationshipV2 = true;

  const KEYS = { A:'relphiSkyChartA', B:'relphiSkyChartB' };
  const COLORS = { A:'#c9211e', B:'#2462d0' };
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ASPECT_COLORS = {
    conjunction:'#e53935', 'semi-sextile':'#7c9b49', octile:'#b86d43', sextile:'#d3b727',
    quintile:'#8b6cc2', square:'#d6534d', trine:'#4e9e69', 'tri-octile':'#9f5944',
    'bi-quintile':'#7655aa', quincunx:'#4b8e88', opposition:'#5961c8'
  };
  const ASPECTS = {
    conjunction:['Conjunction',0,'Two placements occupy nearly the same zodiac degree, concentrating their functions in one field.'],
    'semi-sextile':['Semi-Sextile',30,'Neighboring functions make a subtle adjustment that becomes useful through attention and practice.'],
    octile:['Octile',45,'Focused friction presses for a precise change in approach.'],
    sextile:['Sextile',60,'A cooperative opening becomes useful through deliberate participation.'],
    quintile:['Quintile',72,'Creative patterning supports craft, invention, and intentional expression.'],
    square:['Square',90,'Pressure between different modes of action asks for effort, adjustment, and developed skill.'],
    trine:['Trine',120,'Compatible pathways support a fluent, readily available exchange.'],
    'tri-octile':['Tri-Octile',135,'Accumulated friction presses a developing adjustment into action.'],
    'bi-quintile':['Bi-Quintile',144,'Creative coordination develops through refinement and specialized practice.'],
    quincunx:['Quincunx',150,'Unlike systems require continuing calibration and translation.'],
    opposition:['Opposition',180,'A polarity creates awareness through contrast, exchange, and balance.']
  };
  const PLACEMENT_MEANINGS = {
    sun:'Identity, vitality, and conscious purpose.',
    moon:'Feelings, instincts, memory, and emotional needs.',
    mercury:'Thought, perception, language, and communication.',
    venus:'Values, attraction, affection, pleasure, and relating.',
    mars:'Drive, assertion, desire, conflict, and action.',
    jupiter:'Growth, confidence, meaning, opportunity, and expansion.',
    saturn:'Structure, limits, responsibility, time, and commitment.',
    uranus:'Freedom, disruption, originality, awakening, and change.',
    neptune:'Imagination, sensitivity, surrender, ideals, and vision.',
    pluto:'Power, depth, compulsion, elimination, and transformation.',
    chiron:'The wound, the intelligence developed around it, and the capacity to guide healing.',
    'north-node':'Growth through unfamiliar experience and developing capacity.',
    'south-node':'Familiar patterns, inherited capacity, and the known path.',
    lilith:'Instinctive autonomy, refusal, exile, and uncompromised desire.',
    'part-of-fortune':'The meeting place of body, feeling, circumstance, and ease.',
    vertex:'Encounters that feel consequential or outside ordinary control.',
    asc:'The way a person enters life, meets the world, and is immediately perceived.',
    dsc:'The way a person meets partners and encounters the other.',
    mc:'Public direction, vocation, visibility, and the role a person grows toward.',
    ic:'Roots, home, private foundations, and inherited belonging.'
  };
  const DECANS = [
    [['two_of_wands','Two of Wands'],['three_of_wands','Three of Wands'],['four_of_wands','Four of Wands']],
    [['five_of_pentacles','Five of Pentacles'],['six_of_pentacles','Six of Pentacles'],['seven_of_pentacles','Seven of Pentacles']],
    [['eight_of_swords','Eight of Swords'],['nine_of_swords','Nine of Swords'],['ten_of_swords','Ten of Swords']],
    [['two_of_cups','Two of Cups'],['three_of_cups','Three of Cups'],['four_of_cups','Four of Cups']],
    [['five_of_wands','Five of Wands'],['six_of_wands','Six of Wands'],['seven_of_wands','Seven of Wands']],
    [['eight_of_pentacles','Eight of Pentacles'],['nine_of_pentacles','Nine of Pentacles'],['ten_of_pentacles','Ten of Pentacles']],
    [['two_of_swords','Two of Swords'],['three_of_swords','Three of Swords'],['four_of_swords','Four of Swords']],
    [['five_of_cups','Five of Cups'],['six_of_cups','Six of Cups'],['seven_of_cups','Seven of Cups']],
    [['eight_of_wands','Eight of Wands'],['nine_of_wands','Nine of Wands'],['ten_of_wands','Ten of Wands']],
    [['two_of_pentacles','Two of Pentacles'],['three_of_pentacles','Three of Pentacles'],['four_of_pentacles','Four of Pentacles']],
    [['five_of_swords','Five of Swords'],['six_of_swords','Six of Swords'],['seven_of_swords','Seven of Swords']],
    [['eight_of_cups','Eight of Cups'],['nine_of_cups','Nine of Cups'],['ten_of_cups','Ten of Cups']]
  ];
  const ALIASES = {
    rising:'asc', ascendant:'asc', asc:'asc', ac:'asc',
    descendant:'dsc', dsc:'dsc', dc:'dsc',
    midheaven:'mc', mc:'mc', 'imum coeli':'ic', imumcoeli:'ic', ic:'ic',
    vertex:'vertex', vx:'vertex',
    'north node':'north-node', node:'north-node', 'true node':'north-node',
    'south node':'south-node', fortune:'part-of-fortune',
    'part of fortune':'part-of-fortune', pof:'part-of-fortune'
  };
  const APPROVED_FALLBACKS = new Set(['chiron','north-node','south-node','part-of-fortune','vertex']);

  let mount = null;
  let selectedIndex = null;
  let renderToken = 0;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[char]));
  const norm = value => ((Number(value) % 360) + 360) % 360;

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }

  function source(payload) {
    const known = [payload?.placements, payload?.positions, payload?.points, payload?.bodies]
      .find(value => value && typeof value === 'object');
    const value = known || payload || {};
    return Array.isArray(value)
      ? value.map((item, index) => [String(item?.name || item?.id || index), item])
      : Object.entries(value);
  }

  function longitude(item) {
    if (Number.isFinite(Number(item?.longitude))) return norm(item.longitude);
    const sign = SIGNS.findIndex(name => name.toLowerCase() === String(item?.sign || item?.zodiac || '').trim().toLowerCase());
    if (sign < 0) return NaN;
    return norm(sign * 30 + Number(item.degree || item.degrees || 0) + Number(item.minute || item.minutes || 0) / 60);
  }

  function canonical(key, item) {
    const registry = window.RelphiGlyphRegistry;
    if (!registry) return null;
    for (const candidate of [item?.glyphId, item?.id, item?.name, item?.label, item?.body, item?.planet, item?.point, key]) {
      if (candidate == null) continue;
      const raw = String(candidate).trim();
      const alias = ALIASES[raw.toLowerCase()] || raw;
      const entry = registry.resolve?.(alias) || registry.get?.(alias);
      if (entry?.asset || entry?.fallback || APPROVED_FALLBACKS.has(entry?.id)) return entry;
    }
    return null;
  }

  function recordFor(slot, id, row) {
    for (const [key, item] of source(read(KEYS[slot]))) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const entry = canonical(key, item);
      const value = longitude(item);
      if (entry?.id === id && Number.isFinite(value)) {
        return {
          id,
          entry,
          item,
          value,
          sky:slot,
          house:Number(row.dataset[slot === 'A' ? 'leftHouse' : 'rightHouse']),
          sign:Number(row.dataset[slot === 'A' ? 'leftSign' : 'rightSign'])
        };
      }
    }
    return null;
  }

  function relationshipRow(index) {
    return document.querySelector(`.sky-foundation-relationship-row[data-relation-index="${index}"]`);
  }

  function relationFromRow(index) {
    const row = relationshipRow(index);
    if (!row) return null;
    const left = recordFor('A', row.dataset.leftPlacement, row);
    const right = recordFor('B', row.dataset.rightPlacement, row);
    const aspectId = row.dataset.aspect || row.querySelectorAll('svg')[1]?.getAttribute('aria-label') || '';
    const orbMatch = row.getAttribute('aria-label')?.match(/orb\s+([\d.]+)/i);
    if (!left || !right || !ASPECTS[aspectId]) return null;
    return {
      index,
      row,
      left,
      right,
      aspect:{ id:aspectId, color:ASPECT_COLORS[aspectId] || '#e53935' },
      orb:Number(row.dataset.sourceOrb || orbMatch?.[1] || 0)
    };
  }

  function position(record) {
    const value = norm(record.value);
    const sign = Math.floor(value / 30);
    const within = value - sign * 30;
    let degree = Math.floor(within);
    let minute = Math.round((within - degree) * 60);
    if (minute === 60) { degree += 1; minute = 0; }
    return { sign, degree, label:`${degree}°${String(minute).padStart(2, '0')}′ ${SIGNS[sign]}` };
  }

  function orbLabel(value) {
    let minutes = Math.round(Number(value) * 60);
    const degrees = Math.floor(minutes / 60);
    minutes %= 60;
    return `${degrees}°${String(minutes).padStart(2, '0')}′`;
  }

  function cardFor(record) {
    const p = position(record);
    const decanIndex = Math.min(2, Math.floor(p.degree / 10));
    const [cardId, title] = DECANS[p.sign][decanIndex];
    return {
      cardId,
      title,
      sign:SIGNS[p.sign],
      decan:decanIndex + 1,
      image:`assets/tarot/rws/${cardId}.webp?v=border-preserving-crop-352`
    };
  }

  function ensureMount() {
    if (mount?.isConnected) return mount;
    const relationships = document.getElementById('skyFoundationRelationships');
    if (!relationships) return null;
    mount = document.createElement('section');
    mount.id = 'skySelectedRelationship';
    mount.className = 'sky-selected-relationship sky-selected-simple';
    mount.hidden = true;
    mount.setAttribute('aria-label', 'Selected relationship');
    mount.innerHTML = '<div class="sky-selected-body"></div>';
    relationships.insertAdjacentElement('afterend', mount);
    return mount;
  }

  async function drawBubble(target, id, color, radius = 23) {
    const registry = window.RelphiGlyphRegistry;
    const component = window.RelphiGlyphComponent;
    const entry = registry?.get?.(id) || registry?.resolve?.(id);
    if ((!entry?.asset && !entry?.fallback && !APPROVED_FALLBACKS.has(entry?.id)) || !component?.createBubble) {
      target?.replaceChildren();
      target?.classList.add('sky-selected-canonical-error');
      return;
    }
    try {
      const bubble = component.createBubble(target, entry.id, {
        radius,
        padding:1,
        color,
        fill:'#fffdf8',
        strokeWidth:2.35
      });
      await bubble.ready;
    } catch (_) {
      target.replaceChildren();
      target.classList.add('sky-selected-canonical-error');
    }
  }

  function markSelected(index) {
    const active = Number.isInteger(index);
    document.querySelectorAll('.sky-foundation-relationship-row[data-relation-index]').forEach(row => {
      if (!active) row.removeAttribute('aria-current');
      else row.setAttribute('aria-current', Number(row.dataset.relationIndex) === index ? 'true' : 'false');
    });
    document.querySelectorAll('.sky-foundation-aspect[data-relation-index]').forEach(line => {
      if (!active) delete line.dataset.selectedRelation;
      else line.dataset.selectedRelation = Number(line.dataset.relationIndex) === index ? 'true' : 'false';
    });
  }

  function clearSelection(source = 'white-space') {
    selectedIndex = null;
    markSelected(null);
    const panel = ensureMount();
    if (panel) {
      panel.hidden = true;
      delete panel.dataset.relationIndex;
      panel.dataset.selectionSource = source;
    }
    window.dispatchEvent(new CustomEvent('relphi:selected-relationship-cleared', { detail:{ source } }));
  }

  function symbolMarkup(key, slot, name, color, detail) {
    const className = slot ? `is-sky-${slot.toLowerCase()}` : 'is-aspect';
    const dataGraphic = slot === 'A' ? ' data-selected-graphic-a' : slot === 'B' ? ' data-selected-graphic-b' : ' data-selected-graphic-aspect';
    return `<article class="sky-selected-symbol-item ${className}" data-progressive-item="${key}" style="--item-color:${esc(color)}">
      <button type="button" class="sky-selected-glyph-button" data-reveal-glyph="${key}" aria-label="Reveal ${esc(name)}" aria-expanded="false" aria-controls="sky-selected-name-${key}">
        <svg viewBox="-28 -28 56 56" aria-hidden="true"><g data-glyph-host="${key}"${dataGraphic}></g></svg>
      </button>
      <button type="button" class="sky-selected-name-button" id="sky-selected-name-${key}" data-reveal-name="${key}" aria-expanded="false" aria-controls="sky-selected-meaning-${key}" hidden>${esc(name)}</button>
      <div class="sky-selected-meaning" id="sky-selected-meaning-${key}" hidden>${detail}</div>
    </article>`;
  }

  function placementDetail(record) {
    const p = position(record);
    return `<p>${esc(PLACEMENT_MEANINGS[record.id] || 'A calculated point in this sky.')}</p><p class="sky-selected-meta">Sky ${record.sky} · ${esc(p.label)} · H${record.house}</p>`;
  }

  function aspectDetail(relation) {
    const aspect = ASPECTS[relation.aspect.id];
    return `<p>${esc(aspect[2])}</p><p class="sky-selected-meta">${orbLabel(relation.orb)} orb · ${aspect[1]}°</p>`;
  }

  function cardMarkup(slot, card, disclosureKey) {
    return `<article class="sky-selected-card is-sky-${slot.toLowerCase()}" data-selected-card="${slot}" data-card-title="${esc(card.title)}" data-card-decan="${card.decan}">
      <button type="button" class="sky-selected-card-button" data-reveal-card="${disclosureKey}" aria-label="Reveal the Sky ${slot} card name" aria-expanded="false" aria-controls="sky-selected-card-name-${disclosureKey}">
        <span class="sky-selected-card-sky" aria-hidden="true">${slot}</span>
        <img src="${esc(card.image)}" alt="Tarot card for Sky ${slot}">
      </button>
    </article>`;
  }

  function cardDisclosures(cardA, cardB) {
    if (cardA.title === cardB.title) {
      const sameDecan = cardA.sign === cardB.sign && cardA.decan === cardB.decan;
      const explanation = sameDecan
        ? `Both selected degrees fall in ${cardA.sign} decan ${cardA.decan}.`
        : `Sky A derives this card from ${cardA.sign} decan ${cardA.decan}; Sky B derives it from ${cardB.sign} decan ${cardB.decan}.`;
      return {
        keyA:'shared',
        keyB:'shared',
        markup:`<div class="sky-selected-card-disclosures"><div class="sky-selected-card-disclosure" data-card-disclosure="shared" hidden><button type="button" class="sky-selected-card-name-button" id="sky-selected-card-name-shared" data-reveal-card-name="shared" aria-expanded="false" aria-controls="sky-selected-card-meaning-shared">${esc(cardA.title)}</button><p id="sky-selected-card-meaning-shared" hidden>${esc(explanation)}</p></div></div>`
      };
    }
    return {
      keyA:'a',
      keyB:'b',
      markup:`<div class="sky-selected-card-disclosures"><div class="sky-selected-card-disclosure" data-card-disclosure="a" hidden><button type="button" class="sky-selected-card-name-button" id="sky-selected-card-name-a" data-reveal-card-name="a" aria-expanded="false" aria-controls="sky-selected-card-meaning-a">${esc(cardA.title)}</button><p id="sky-selected-card-meaning-a" hidden>Sky A derives this card from ${esc(cardA.sign)} decan ${cardA.decan}.</p></div><div class="sky-selected-card-disclosure" data-card-disclosure="b" hidden><button type="button" class="sky-selected-card-name-button" id="sky-selected-card-name-b" data-reveal-card-name="b" aria-expanded="false" aria-controls="sky-selected-card-meaning-b">${esc(cardB.title)}</button><p id="sky-selected-card-meaning-b" hidden>Sky B derives this card from ${esc(cardB.sign)} decan ${cardB.decan}.</p></div></div>`
    };
  }

  function setHidden(node, hidden) {
    if (!node) return;
    node.hidden = hidden;
  }

  function toggleGlyph(panel, key) {
    const glyph = panel.querySelector(`[data-reveal-glyph="${key}"]`);
    const nameButton = panel.querySelector(`[data-reveal-name="${key}"]`);
    const meaning = panel.querySelector(`#sky-selected-meaning-${key}`);
    const opening = !!nameButton?.hidden;
    setHidden(nameButton, !opening);
    glyph?.setAttribute('aria-expanded', opening ? 'true' : 'false');
    if (!opening) {
      setHidden(meaning, true);
      nameButton?.setAttribute('aria-expanded', 'false');
    }
  }

  function toggleName(panel, key) {
    const nameButton = panel.querySelector(`[data-reveal-name="${key}"]`);
    const meaning = panel.querySelector(`#sky-selected-meaning-${key}`);
    const opening = !!meaning?.hidden;
    setHidden(meaning, !opening);
    nameButton?.setAttribute('aria-expanded', opening ? 'true' : 'false');
  }

  function toggleCard(panel, key) {
    const disclosure = panel.querySelector(`[data-card-disclosure="${key}"]`);
    const controls = panel.querySelectorAll(`[data-reveal-card="${key}"]`);
    const opening = !!disclosure?.hidden;
    setHidden(disclosure, !opening);
    controls.forEach(control => control.setAttribute('aria-expanded', opening ? 'true' : 'false'));
    if (!opening) {
      const nameButton = disclosure?.querySelector('[data-reveal-card-name]');
      const meaning = disclosure?.querySelector('p');
      setHidden(meaning, true);
      nameButton?.setAttribute('aria-expanded', 'false');
    }
  }

  function toggleCardName(panel, key) {
    const disclosure = panel.querySelector(`[data-card-disclosure="${key}"]`);
    const nameButton = disclosure?.querySelector('[data-reveal-card-name]');
    const meaning = disclosure?.querySelector('p');
    const opening = !!meaning?.hidden;
    setHidden(meaning, !opening);
    nameButton?.setAttribute('aria-expanded', opening ? 'true' : 'false');
  }

  async function render(index, initiator) {
    const relation = relationFromRow(index);
    const panel = ensureMount();
    if (!relation || !panel) return;
    const token = ++renderToken;
    document.getElementById('skyFoundationRoot')?.removeAttribute('data-relationship-selection-cleared');
    selectedIndex = index;
    markSelected(index);
    panel.hidden = false;
    panel.dataset.relationIndex = String(index);
    panel.dataset.selectionSource = initiator;
    panel.dataset.selectedRelationshipVersion = 'simple-v1';

    const body = panel.querySelector('.sky-selected-body');
    const cardA = cardFor(relation.left);
    const cardB = cardFor(relation.right);
    const cards = cardDisclosures(cardA, cardB);
    const aspect = ASPECTS[relation.aspect.id];

    body.innerHTML = `<div class="sky-selected-symbols" aria-label="Selected relationship symbols">
      ${symbolMarkup('left','A',relation.left.entry.name,COLORS.A,placementDetail(relation.left))}
      ${symbolMarkup('aspect',null,aspect[0],relation.aspect.color,aspectDetail(relation))}
      ${symbolMarkup('right','B',relation.right.entry.name,COLORS.B,placementDetail(relation.right))}
    </div>
    <div class="sky-selected-cards" data-identical-cards="${cardA.title === cardB.title ? 'true' : 'false'}">
      ${cardMarkup('A',cardA,cards.keyA)}
      ${cardMarkup('B',cardB,cards.keyB)}
    </div>
    ${cards.markup}`;

    const jobs = [
      drawBubble(body.querySelector('[data-glyph-host="left"]'), relation.left.id, COLORS.A, 23),
      drawBubble(body.querySelector('[data-glyph-host="aspect"]'), relation.aspect.id, relation.aspect.color, 21),
      drawBubble(body.querySelector('[data-glyph-host="right"]'), relation.right.id, COLORS.B, 23)
    ];
    await Promise.allSettled(jobs);
    if (token !== renderToken) return;
    window.dispatchEvent(new CustomEvent('relphi:selected-relationship-rendered', {
      detail:{ index, relation, source:initiator, version:'simple-v1' }
    }));
  }

  function indexFrom(node) {
    const value = Number(node?.dataset?.relationIndex);
    return Number.isInteger(value) ? value : null;
  }

  document.addEventListener('click', event => {
    const panel = event.target.closest?.('#skySelectedRelationship');
    const glyph = event.target.closest?.('[data-reveal-glyph]');
    if (panel && glyph) { toggleGlyph(panel, glyph.dataset.revealGlyph); return; }
    const nameButton = event.target.closest?.('[data-reveal-name]');
    if (panel && nameButton) { toggleName(panel, nameButton.dataset.revealName); return; }
    const card = event.target.closest?.('[data-reveal-card]');
    if (panel && card) { toggleCard(panel, card.dataset.revealCard); return; }
    const cardName = event.target.closest?.('[data-reveal-card-name]');
    if (panel && cardName) { toggleCardName(panel, cardName.dataset.revealCardName); return; }

    const row = event.target.closest?.('.sky-foundation-relationship-row[data-relation-index]');
    if (!row) return;
    const index = indexFrom(row);
    if (index != null) queueMicrotask(() => render(index, 'relationship-list'));
  });

  window.addEventListener('relphi:sky-foundation-clear-selection', event => {
    clearSelection(event.detail?.source || 'white-space');
  });

  function onReady(force = false) {
    const panel = ensureMount();
    if (!panel) return;
    if (document.getElementById('skyFoundationRoot')?.dataset.relationshipSelectionCleared === 'true') return;
    if (selectedIndex != null && relationshipRow(selectedIndex)) {
      if (force) render(selectedIndex, 'foundation-rerender');
      return;
    }
    const first = Array.from(document.querySelectorAll('.sky-foundation-relationship-row[data-relation-index]'))
      .find(row => !row.hidden);
    const index = indexFrom(first);
    if (index != null) render(index, 'initial-relationship');
  }

  window.addEventListener('relphi:sky-foundation-ready', () => onReady(true));
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(() => onReady(false)), { once:true });
  } else {
    requestAnimationFrame(() => onReady(false));
  }
})();
