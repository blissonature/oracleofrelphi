// Exact selected-relationship view for the approved Sky Chart foundation.
// The relationship row, wheel line, cards, title, facts, and reveal all consume
// one object from RelphiSkyFoundationV1.getCurrent().relations[index].
(function () {
  'use strict';
  if (window.__relphiSkySelectedRelationshipV1) return;
  window.__relphiSkySelectedRelationshipV1 = true;

  const NS = 'http://www.w3.org/2000/svg';
  const API = 'RelphiSkyFoundationV1';
  const COLORS = { A:'#c9211e', B:'#2462d0' };
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const MAJORS = [
    ['the_emperor','The Emperor'],['the_hierophant','The Hierophant'],['the_lovers','The Lovers'],
    ['the_chariot','The Chariot'],['strength','Strength'],['the_hermit','The Hermit'],
    ['justice','Justice'],['death','Death'],['temperance','Temperance'],['the_devil','The Devil'],
    ['the_star','The Star'],['the_moon','The Moon']
  ];
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
  const ASPECT_COPY = {
    conjunction:['Conjunction','Two placements occupy nearly the same degree, concentrating their functions into one field of action.'],
    opposition:['Opposition','Two placements face one another across the zodiac, creating a polarity that asks for awareness, exchange, and balance.'],
    trine:['Trine','Two placements move through compatible elemental pathways, making their exchange fluent and readily available.'],
    square:['Square','Two placements meet at a right angle, producing pressure that asks for action, adjustment, and developed skill.'],
    sextile:['Sextile','Two placements offer a cooperative opening that becomes useful through deliberate participation.'],
    quincunx:['Quincunx','Two placements share no common mode or element, asking for continual calibration rather than a single resolution.'],
    'semi-sextile':['Semi-sextile','Neighboring signs exchange information indirectly, asking each placement to notice what the other carries.'],
    octile:['Octile','A compact friction pattern builds momentum and makes a subtle conflict difficult to ignore.'],
    'tri-octile':['Tri-octile','Accumulated friction presses the relationship toward a decisive adjustment.'],
    quintile:['Quintile','A fifth-harmonic relationship emphasizes craft, pattern-making, and creative arrangement.'],
    'bi-quintile':['Bi-quintile','A fifth-harmonic relationship connects the placements through developed technique and unusual synthesis.']
  };

  let selectedIndex = null;
  let mount = null;

  const svgNode = (name, attrs) => {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs || {}).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  };
  const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const normalize = value => ((Number(value) % 360) + 360) % 360;

  function foundation() { return window[API]?.getCurrent?.() || null; }
  function relationAt(index) { return foundation()?.relations?.[index] || null; }
  function recordName(record) { return record?.entry?.name || record?.name || record?.id || 'Placement'; }
  function recordId(record) { return record?.entry?.id || record?.id || ''; }
  function aspectId(relation) { return relation?.aspect?.id || relation?.aspect?.name || 'relationship'; }
  function aspectLabel(relation) {
    const id = aspectId(relation);
    return ASPECT_COPY[id]?.[0] || id.replace(/(^|-)([a-z])/g, (_, space, letter) => (space ? ' ' : '') + letter.toUpperCase());
  }
  function position(record) {
    const longitude = normalize(record?.value ?? record?.longitude);
    const signIndex = Math.floor(longitude / 30);
    const within = longitude - signIndex * 30;
    const degree = Math.floor(within);
    const minute = Math.round((within - degree) * 60) % 60;
    return { longitude, signIndex, degree, minute, label:`${degree}°${String(minute).padStart(2,'0')}′ ${SIGNS[signIndex]}` };
  }
  function cardFor(record) {
    const p = position(record);
    const decan = Math.min(2, Math.floor(p.degree / 10));
    const [cardId, title] = DECANS[p.signIndex][decan];
    const [majorId, majorTitle] = MAJORS[p.signIndex];
    return {
      cardId,
      title,
      majorId,
      majorTitle,
      image:`assets/tarot/rws/${cardId}.webp?v=border-preserving-crop-352`,
      sign:SIGNS[p.signIndex],
      decan:decan + 1
    };
  }

  function ensureMount() {
    if (mount?.isConnected) return mount;
    const relationships = document.getElementById('skyFoundationRelationships');
    const center = relationships?.parentElement;
    if (!center) return null;
    mount = document.createElement('section');
    mount.id = 'skySelectedRelationship';
    mount.className = 'sky-selected-relationship';
    mount.hidden = true;
    mount.setAttribute('aria-label','Selected Relationship');
    mount.innerHTML = '<h2 class="sky-selected-heading">Selected Relationship</h2><div class="sky-selected-body"></div>';
    relationships.insertAdjacentElement('afterend', mount);
    return mount;
  }

  async function drawCanonical(target, id, options) {
    const registry = window.RelphiGlyphRegistry;
    const component = window.RelphiGlyphComponent;
    const entry = registry?.get?.(id) || registry?.resolve?.(id);
    if (!entry || !component?.draw) {
      target.replaceChildren();
      target.classList.add('sky-selected-canonical-error');
      target.dataset.missingCanonicalGlyph = id || 'unknown';
      return false;
    }
    try {
      await component.draw(target, entry.id, options);
      return true;
    } catch (error) {
      target.replaceChildren();
      target.classList.add('sky-selected-canonical-error');
      target.dataset.missingCanonicalGlyph = entry.id;
      return false;
    }
  }

  async function drawBubble(target, id, options) {
    const registry = window.RelphiGlyphRegistry;
    const component = window.RelphiGlyphComponent;
    const entry = registry?.get?.(id) || registry?.resolve?.(id);
    if (!entry || !component?.createBubble) {
      target.replaceChildren();
      target.classList.add('sky-selected-canonical-error');
      target.dataset.missingCanonicalGlyph = id || 'unknown';
      return false;
    }
    try {
      const bubble = component.createBubble(target, entry.id, options);
      await bubble.ready;
      return true;
    } catch (error) {
      target.replaceChildren();
      target.classList.add('sky-selected-canonical-error');
      target.dataset.missingCanonicalGlyph = entry.id;
      return false;
    }
  }

  function selectedState(index) {
    document.querySelectorAll('.sky-foundation-relationship-row[data-relation-index]').forEach(row => {
      row.setAttribute('aria-current', Number(row.dataset.relationIndex) === index ? 'true' : 'false');
    });
    document.querySelectorAll('.sky-foundation-aspect[data-relation-index]').forEach(line => {
      line.dataset.selectedRelation = Number(line.dataset.relationIndex) === index ? 'true' : 'false';
    });
  }

  function cardMarkup(slot, record, card) {
    return `<article class="sky-selected-card" data-selected-card="${slot}">
      <p class="sky-selected-card-label">Sky ${slot} · ${escapeHtml(recordName(record))}</p>
      <img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.title)} card art">
      <h4>${escapeHtml(card.title)}</h4>
      <p>${escapeHtml(card.sign)} · decan ${card.decan}<br>${escapeHtml(card.majorTitle)} governs the sign.</p>
    </article>`;
  }

  function interpretation(relation, cardA, cardB) {
    const id = aspectId(relation);
    const aspectMeaning = ASPECT_COPY[id]?.[1] || 'These two placements form a measurable angular relationship in the comparison chart.';
    const aName = recordName(relation.a), bName = recordName(relation.b);
    return {
      aspectMeaning,
      cardMeaning:`${cardA.title} gives Sky A a ${cardA.sign} decan image; ${cardB.title} gives Sky B a ${cardB.sign} decan image. Read the cards as the visual vocabulary of the exact degrees involved, not as replacements for the placements themselves.`,
      synthesis:`Between ${aName} in Sky A and ${bName} in Sky B, the ${aspectLabel(relation).toLowerCase()} connects ${cardA.title} with ${cardB.title}. The useful question is how the first image enters the second image’s field: where they reinforce one another, where they require translation, and what becomes possible when both are held in view.`
    };
  }

  async function render(index, source) {
    const relation = relationAt(index);
    const panel = ensureMount();
    if (!relation || !panel) return;
    selectedIndex = index;
    selectedState(index);
    panel.hidden = false;
    panel.dataset.relationIndex = String(index);
    panel.dataset.selectionSource = source || 'unknown';
    const body = panel.querySelector('.sky-selected-body');
    const pA = position(relation.a), pB = position(relation.b);
    const cardA = cardFor(relation.a), cardB = cardFor(relation.b);
    const copy = interpretation(relation, cardA, cardB);
    body.innerHTML = `<div class="sky-selected-graphic">
        <svg viewBox="0 0 360 130" role="img" aria-label="${escapeHtml(recordName(relation.a))} ${escapeHtml(aspectLabel(relation))} ${escapeHtml(recordName(relation.b))}">
          <line class="sky-selected-graphic-line" x1="78" y1="65" x2="282" y2="65" stroke="${escapeHtml(relation.aspect?.color || '#555')}"></line>
          <g data-selected-graphic-a transform="translate(78 65)"></g>
          <g data-selected-graphic-aspect transform="translate(180 65)"></g>
          <g data-selected-graphic-b transform="translate(282 65)"></g>
        </svg>
      </div>
      <header class="sky-selected-facts">
        <h3>${escapeHtml(recordName(relation.a))} ${escapeHtml(aspectLabel(relation))} ${escapeHtml(recordName(relation.b))}</h3>
        <p>Sky A ${escapeHtml(pA.label)} · Sky B ${escapeHtml(pB.label)} · Orb ${Number(relation.orb || 0).toFixed(2)}°</p>
      </header>
      <div class="sky-selected-cards">
        ${cardMarkup('A', relation.a, cardA)}
        <div class="sky-selected-aspect-symbol"><svg viewBox="-22 -22 44 44" aria-label="${escapeHtml(aspectLabel(relation))}"></svg></div>
        ${cardMarkup('B', relation.b, cardB)}
      </div>
      <section class="sky-selected-progressive" aria-label="Progressive relationship interpretation">
        <details class="sky-selected-reveal" data-reveal-level="symbol">
          <summary>1 · See the relationship</summary>
          <div class="sky-selected-reveal-content"><span class="sky-selected-reveal-glyph"><svg viewBox="-20 -20 40 40" aria-hidden="true"></svg></span><strong>${escapeHtml(aspectLabel(relation))}</strong><p>${escapeHtml(copy.aspectMeaning)}</p></div>
        </details>
        <details class="sky-selected-reveal" data-reveal-level="cards">
          <summary>2 · Read the two cards</summary>
          <div class="sky-selected-reveal-content"><p>${escapeHtml(copy.cardMeaning)}</p></div>
        </details>
        <details class="sky-selected-reveal" data-reveal-level="synthesis">
          <summary>3 · Bring the relationship together</summary>
          <div class="sky-selected-reveal-content"><p>${escapeHtml(copy.synthesis)}</p></div>
        </details>
      </section>`;

    const graphic = body.querySelector('.sky-selected-graphic svg');
    await Promise.allSettled([
      drawBubble(graphic.querySelector('[data-selected-graphic-a]'), recordId(relation.a), { radius:20, padding:1, color:COLORS.A, fill:'#fffdf8', strokeWidth:2.4 }),
      drawBubble(graphic.querySelector('[data-selected-graphic-aspect]'), aspectId(relation), { radius:18, padding:1, color:relation.aspect?.color || '#222', fill:'#fffdf8', strokeWidth:2.2 }),
      drawBubble(graphic.querySelector('[data-selected-graphic-b]'), recordId(relation.b), { radius:20, padding:1, color:COLORS.B, fill:'#fffdf8', strokeWidth:2.4 }),
      drawBubble(body.querySelector('.sky-selected-aspect-symbol svg'), aspectId(relation), { radius:18, padding:1, color:'#171717', fill:'#fffdf8', strokeWidth:2.4 }),
      drawCanonical(body.querySelector('[data-reveal-level="symbol"] svg'), aspectId(relation), { radius:15, padding:1, color:relation.aspect?.color || '#222' })
    ]);
    panel.scrollIntoView({ behavior:'smooth', block:'nearest' });
    window.dispatchEvent(new CustomEvent('relphi:selected-relationship-rendered', { detail:{ index, relation, source } }));
  }

  function relationIndexFrom(target) {
    const node = target.closest?.('[data-relation-index]');
    if (!node) return null;
    const index = Number(node.dataset.relationIndex);
    return Number.isInteger(index) ? index : null;
  }

  document.addEventListener('click', event => {
    const row = event.target.closest?.('.sky-foundation-relationship-row[data-relation-index]');
    const line = event.target.closest?.('.sky-foundation-aspect[data-relation-index]');
    if (!row && !line) return;
    const index = relationIndexFrom(row || line);
    if (index == null) return;
    queueMicrotask(() => render(index, row ? 'relationship-list' : 'comparison-wheel'));
  });

  document.addEventListener('keydown', event => {
    if (!['Enter',' '].includes(event.key)) return;
    const line = event.target.closest?.('.sky-foundation-aspect[data-relation-index]');
    if (!line) return;
    const index = relationIndexFrom(line);
    if (index == null) return;
    event.preventDefault();
    render(index, 'comparison-wheel-keyboard');
  });

  window.addEventListener('relphi:sky-foundation-rendered', () => {
    ensureMount();
    if (selectedIndex == null) return;
    const relations = foundation()?.relations || [];
    if (relations[selectedIndex]) render(selectedIndex, 'foundation-rerender');
    else {
      selectedIndex = null;
      if (mount) mount.hidden = true;
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureMount, { once:true });
  else ensureMount();
})();
