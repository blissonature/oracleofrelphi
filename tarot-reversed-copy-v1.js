// Canonical Relphi reversed meanings: derive once, show in full entries, Drawing Board layers, and exports.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiTarotReversedCopyV1) return;
  window.__relphiTarotReversedCopyV1 = true;

  const EXPORT_ACTIONS = '#printRowPdf,#downloadRowOptimizedHtml,#printCardRowImage,[data-row-export],[data-row-print]';
  const DETAIL_BLOCK_SELECTOR = '#cardDetail .full-entry-title-block,#spreadCardDetail .full-entry-title-block,.sky-card-inspector-detail .full-entry-title-block';
  let queued = false;
  let applying = false;

  const MAJOR_REVERSED = Object.freeze({
    the_fool: 'Breakthrough is trapped inside the system or erupts sideways. Freedom becomes flight, disruption without direction, or refusal of the continuity needed to make a new pattern real.',
    the_magician: 'Mercury’s act of naming and directing signal loops back on itself. Skill, speech, choice, or intention can fragment, manipulate, or stall until the message and the will behind it agree.',
    the_high_priestess: 'Receptivity turns into withholding or projection. Memory, intuition, secrecy, and the unseen can flood the inner field or become so sealed that nothing can pass through.',
    the_empress: 'Venusian generation loses proportion. Care, beauty, pleasure, fertility, money, or affection can become smothering, excessive, withheld, or disconnected from what actually nourishes.',
    the_emperor: 'Protective structure hardens or fails. Boundary can become domination, defensiveness, brittle control, or an inability to use force cleanly enough to keep life safe.',
    the_hierophant: 'Transmission hardens into doctrine or loses its living chain. Teaching, tradition, value, and embodied practice can become obedience without understanding—or rejection before the lesson has been metabolized.',
    the_lovers: 'Mercurial exchange splits into mixed signals. Choice, relationship, language, and mirroring can become projection or indecision until the parties say what they actually mean.',
    the_chariot: 'Containment becomes armor. Feeling and memory may be driven, suppressed, or overprotected, so forward motion depends on restoring an inner container that can hold contrary forces without clamping them down.',
    strength: 'Solar courage becomes performance, suppression, or depletion. Appetite, anger, sexuality, visibility, or creative heat needs integration rather than domination.',
    the_hermit: 'Discernment contracts into isolation or perfectionism. Analysis and service can become endless correction, withdrawal, or fear of contamination until the signal is simple enough to carry.',
    wheel_of_fortune: 'Jupiterian increase becomes inflation or repetition. Opportunity, meaning, luck, and expansion can keep turning without integration, making the cycle larger without making it wiser.',
    justice: 'Balance becomes scorekeeping, avoidance, or a frozen verdict. Relation and consequence need to be reweighed so reciprocity is restored instead of merely appearing equal.',
    the_hanged_man: 'Suspension loses its purpose. Surrender becomes stagnation, escape, martyrdom, or indefinite waiting until the pause reveals what must actually be released.',
    death: 'The ending is being held in place. Grief, desire, attachment, or survival force keeps circulating beneath the surface because transformation cannot complete until something is allowed to die.',
    temperance: 'Integration becomes dilution or overmixing. Meaning, faith, movement, and difference blur together until the right proportions—and the boundary between unlike things—are restored.',
    the_devil: 'Capricornian structure begins to loosen its grip. Bondage, compulsion, control, or material fixation is being exposed so that what has hardened can be released or consciously renegotiated.',
    the_tower: 'The protective structure is rupturing from within. Force that was contained, denied, or misdirected breaks through as crisis, defensiveness, or collapse so the false boundary can no longer pretend to be stable.',
    the_star: 'Future vision loses its vessel. Hope, distance, community, and pattern can become abstraction, dissociation, or idealism that cannot land until possibility is given a form.',
    the_moon: 'Vision and feeling lose reliable edges. Dream, fear, projection, longing, and memory can blend into fog until the image is separated from the thing it represents.',
    the_sun: 'Visibility turns into overexposure or dimming. Confidence, identity, vitality, and recognition lose their center until radiance comes from presence rather than performance.',
    judgement: 'The call to transformation is heard below the surface but not yet answered. Compulsion, grief, power, or awakening can repeat as pressure until what is being summoned is consciously named.',
    the_world: 'Completion becomes a closed system or an unfinished ending. Structure, duty, time, and mastery can harden around what is already complete—or refuse the final boundary that would let the next cycle begin.'
  });

  const PIP_SPECIFIC_REVERSED = Object.freeze({
    ace_of_cups: 'The capacity to receive feeling is present, but its opening may be guarded, flooded, or held back. Water has not disappeared; the vessel needs a boundary that lets affection and care enter without demanding either complete exposure or complete closure.',
    two_of_cups: 'An offered connection does not yet become mutual exchange. Venus in Cancer may protect the bond by concealing a need or giving more than can be received in return; affection requires room for both people to answer freely.',
    three_of_cups: 'Shared feeling struggles to find a common language. Mercury in Cancer can turn belonging into assumptions, unspoken expectations, or conversations that circle around what matters; communion is restored by making room for each voice instead of presuming agreement.',
    four_of_cups: 'Emotional security has become too enclosed to remain receptive. The Moon in Cancer protects what is familiar, yet the same shelter can screen out a needed change or offering; comfort must open enough to receive without losing its roots.',
    five_of_cups: 'Pain threatens to become the only bond with what was lost. Mars in Scorpio can keep grief active as blame, struggle, or defensive attachment; the reversal asks whether that force can protect what still matters instead of repeatedly reopening the wound.',
    six_of_cups: 'Recognition of past affection is unsettled: memory may idealize what was, or an old bond may be ready to be understood differently. The Sun in Scorpio exposes where loyalty, tenderness, and identity have become entangled; returning to the past need not mean remaining inside it.',
    seven_of_cups: 'Desire casts images that are difficult to distinguish from what can truly be shared. Venus in Scorpio may cling to a compelling possibility or fear the vulnerability of choosing one real connection; clarity comes from testing attraction against reciprocity and consequence.',
    eight_of_cups: 'Leaving and remaining are both held under the weight of an unmet need. Saturn in Pisces may turn necessary withdrawal into prolonged endurance, guilt, or resignation; the reversal asks whether a boundary can be made consciously rather than through silent depletion.',
    nine_of_cups: 'Pleasure or fulfillment is available, yet it may not be trusted, shared, or allowed to settle. Jupiter in Pisces can enlarge longing beyond what any satisfaction can hold; the reversal asks what would make enough genuinely receivable instead of endlessly deferred or consumed.',
    ten_of_cups: 'The emotional field is saturated, but fullness no longer guarantees nourishment. Under Mars in Pisces, feeling may be pushed beyond its capacity to contain or express it, becoming overwhelm, forced harmony, or exhaustion. The question is what needs release, rather than how to hold on to the appearance of completion.'
  });

  const ACE_REVERSED = Object.freeze({
    Fire: 'The seed of Fire is present, but ignition is delayed or misdirected. Desire, courage, anger, visibility, or creative force has not yet found a clean way into action.',
    Water: 'The seed of Water is present, but receptivity is obstructed or overflowing its container. Feeling, memory, care, or attachment needs a cleaner channel before it can circulate.',
    Air: 'The seed of Air is present, but the cut has not become clarity. Thought, language, judgment, or decision may be scattered, overabstracted, or delayed until the signal can be trusted.',
    Earth: 'The seed of Earth is present, but embodiment is delayed or overcontrolled. Money, work, body, food, touch, or material support needs a viable form before the promise becomes real.'
  });

  const RANK_REVERSED = Object.freeze({
    Two: { issue:'relation becomes imbalance, projection, avoidance, or a polarity without honest exchange', repair:'restore reciprocity without erasing difference' },
    Three: { issue:'expression and growth scatter, become performative, or develop without enough root', repair:'give the emerging form a stable base' },
    Four: { issue:'structure hardens into defense, inertia, or dependence on control', repair:'loosen the structure enough for life to move' },
    Five: { issue:'pressure repeats without useful release, turning conflict inward or exaggerating it', repair:'name the pressure and give it a clean outlet' },
    Six: { issue:'rebalancing is incomplete; help, harmony, recovery, or recognition becomes uneven or conditional', repair:'let balance become reciprocal rather than performative' },
    Seven: { issue:'testing becomes confusion, evasion, defensiveness, fantasy, or strategy without ground', repair:'choose a real test and commit to it' },
    Eight: { issue:'movement and adjustment become strain, compulsion, delay, overwork, or misalignment', repair:'change the pattern instead of merely repeating motion' },
    Nine: { issue:'ripeness turns inward as saturation, isolation, guardedness, or a threshold not yet crossed', repair:'let what is mature become shareable or complete' },
    Ten: { issue:'completion becomes excess, exhaustion, burden, or a cycle that keeps circulating after it should end', repair:'finish the cycle and release what belongs to it' }
  });

  const PLANET_PRESSURE = Object.freeze({
    Sun: 'visibility and will may be dimmed, overexposed, or seeking a truer center',
    Moon: 'feeling and memory may spill into projection, fluctuation, or overcontainment',
    Mercury: 'words, signals, choices, and interpretation may need review before they can be trusted',
    Venus: 'value, desire, money, beauty, or affection may be withheld or distorted',
    Mars: 'force may be suppressed, misdirected, inflamed, or defensive',
    Jupiter: 'growth, faith, generosity, or meaning may inflate, overpromise, or fail to integrate',
    Saturn: 'structure, duty, fear, limits, or authority may become heavy, avoidant, or too severe',
    Uranus: 'breakthrough may be trapped inside the system or erupt sideways',
    Neptune: 'vision, longing, compassion, or surrender may blur into fog, leakage, escape, or disillusionment',
    Pluto: 'power, compulsion, grief, survival, or transformation may work below the surface before it can be named'
  });

  const ELEMENT_COURT_PRESSURE = Object.freeze({
    Fire: 'Enthusiasm, anger, courage, visibility, or creative heat may be scattered, premature, overexposed, or exhausted.',
    Water: 'Receptivity can become flooding, withholding, overprotection, or uncertainty about what is safe to receive.',
    Air: 'Thought and speech can become reactive, overexplained, cutting, scattered, or detached from lived reality.',
    Earth: 'Embodiment and value can harden into control, inertia, overwork, scarcity, or dependence on what can be possessed.'
  });

  const COURT_ROLE = Object.freeze({
    Princess: { opening: formula => `${formula} is not yet settled into embodiment.`, repair:'Learn to carry the message without forcing it to arrive fully formed.' },
    Page: { opening: formula => `${formula} is not yet settled into embodiment.`, repair:'Learn to carry the message without forcing it to arrive fully formed.' },
    Prince: { opening: formula => `${formula} loses clean direction in motion.`, repair:'Choose a direction that can answer to consequence instead of motion for its own sake.' },
    Knight: { opening: formula => `${formula} overreaches or loses command of its own force.`, repair:'Integrate authority before trying to direct the field around it.' },
    Queen: { opening: formula => `${formula} loses its clean container.`, repair:'Restore a boundary that can receive without flooding or shutting down.' },
    King: { opening: formula => `${formula} overreaches or abdicates visible authority.`, repair:'Integrate authority before trying to direct the field around it.' }
  });

  function cards() { return Array.isArray(window.RELPHI_TAROT_CARDS) ? window.RELPHI_TAROT_CARDS : []; }
  function cardById(id) { return cards().find(card => card?.card_id === id || card?.stable_symbol_id === id) || null; }
  function firstValue(value) { return String(value || '').split(',').map(part => part.trim()).filter(Boolean)[0] || ''; }
  function theme(card) { return String(card?.systems?.thoth?.title || card?.systems?.golden_dawn_rws?.title || card?.name || '').trim(); }
  function cardFormula(card) {
    return String(card?.elemental_formula || card?.systems?.thoth?.title || card?.systems?.golden_dawn_rws?.title || [card?.rank_element, card?.element].filter(Boolean).join(' of ') || card?.name || 'the court formula').trim();
  }
  function sentence(value) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    return /[.!?]$/.test(text) ? text : text + '.';
  }

  function derivePip(card) {
    const rank = String(card?.rank || card?.rws_rank || '').trim();
    const mechanism = RANK_REVERSED[rank];
    const cardTheme = theme(card) || card?.name || 'The card';
    const astrology = card?.astrology || {};
    const planet = firstValue(astrology.decan_ruler || astrology.planet);
    const sign = firstValue(astrology.sign);
    const pressure = PLANET_PRESSURE[planet] || '';
    const first = mechanism
      ? `${cardTheme} turns inward: ${mechanism.issue}.`
      : `${cardTheme} turns inward and its usual operation loses clean proportion.`;
    const locus = planet && sign ? `With ${planet} in ${sign}, ${pressure || 'the decan force is redirected inward'}`
      : planet ? `${planet} is the pressure point: ${pressure || 'its force is redirected inward'}`
      : `${card?.element || 'The suit'} carries the pressure inward`;
    const repair = mechanism?.repair ? `; the correction is to ${mechanism.repair}.` : '.';
    return sentence(first + ' ' + locus + repair);
  }

  function deriveCourt(card) {
    const formula = cardFormula(card);
    const roleName = String(card?.rank || card?.rws_rank || '').trim();
    const role = COURT_ROLE[roleName] || COURT_ROLE[String(card?.rws_rank || '').trim()] || COURT_ROLE.Princess;
    const element = String(card?.element || '').trim();
    const pressure = ELEMENT_COURT_PRESSURE[element] || 'The suit’s force can become blocked, exaggerated, or misdirected.';
    return sentence(`${role.opening(formula)} ${pressure} ${role.repair}`);
  }

  function derive(cardOrId) {
    const card = typeof cardOrId === 'string' ? cardById(cardOrId) : cardOrId;
    if (!card) return '';
    if (MAJOR_REVERSED[card.card_id]) return MAJOR_REVERSED[card.card_id];
    if (card.card_type === 'Ace') return PIP_SPECIFIC_REVERSED[card.card_id] || ACE_REVERSED[card.element] || 'The elemental seed is present, but access to it is delayed, distorted, or not yet embodied.';
    if (card.card_type === 'Pip') return PIP_SPECIFIC_REVERSED[card.card_id] || derivePip(card);
    if (card.card_type === 'Court') return deriveCourt(card);
    return 'The card’s usual operation has turned inward and needs to be brought back into proportion before it can move cleanly.';
  }

  function buildIndex() {
    const out = {};
    cards().forEach(card => { if (card?.card_id) out[card.card_id] = derive(card); });
    return out;
  }

  function isReversed(item, cardNode) {
    return !!item?.classList?.contains('is-row-reversed') || cardNode?.dataset?.rowReversed === 'true' || cardNode?.classList?.contains('is-row-reversed');
  }

  function boardCards(root = document) {
    return Array.from(root.querySelectorAll?.('#shortListPanel .card-row-item[data-row-index]') || []);
  }

  function applyBoard(root = document) {
    const activeLayout=window.RelphiDrawingBoardPrefabsBridge?.getState?.()?.activeLayout;
    const contextualCeltic=activeLayout?.id==='celtic-cross-10' || activeLayout?.basedOn==='celtic-cross-10';
    boardCards(root).forEach(item => {
      const cardNode = item.querySelector('[data-row-card]');
      if (!cardNode || !isReversed(item, cardNode)) return;
      // tarot-app already composes reversed meaning with the Celtic position.
      // Do not replace that contextual reading with the generic reversed copy.
      if(contextualCeltic)return;
      const id = cardNode.dataset.rowCard || cardNode.dataset.id || '';
      const meaning = derive(id);
      if (!meaning) return;
      const span = cardNode.querySelector('.or-layer-scroll span,.relphi-info-scroll span');
      if (!span) return;
      if (span.textContent.trim() !== meaning) span.textContent = meaning;
      span.dataset.relphiReversedMeaning = id;
    });
  }

  function detailCardId(block) {
    return block?.querySelector('[data-shortlist]')?.dataset?.shortlist || '';
  }

  function reversedSection(card) {
    const section = document.createElement('section');
    section.className = 'interpretation-card--priority relphi-reversed-priority';
    section.dataset.relphiReversedSection = card.card_id;
    const heading = document.createElement('h3');
    heading.textContent = 'Relphi-derived reversed interpretation';
    const body = document.createElement('p');
    body.textContent = derive(card);
    section.append(heading, body);
    return section;
  }

  function applyDetailBlock(block) {
    if (!block) return;
    const id = detailCardId(block);
    const card = cardById(id);
    if (!card) return;
    const meaning = derive(card);
    if (!meaning) return;
    let section = block.querySelector(':scope > [data-relphi-reversed-section]');
    if (!section) {
      section = reversedSection(card);
      const upright = block.querySelector(':scope > .locked-relphi-priority,:scope > .uhn-panel');
      const addButton = block.querySelector(':scope > [data-shortlist]');
      if (upright) upright.insertAdjacentElement('afterend', section);
      else if (addButton) addButton.insertAdjacentElement('beforebegin', section);
      else block.appendChild(section);
    } else {
      section.dataset.relphiReversedSection = card.card_id;
      const p = section.querySelector('p');
      if (p && p.textContent.trim() !== meaning) p.textContent = meaning;
    }
  }

  function applyDetails(root = document) {
    const scope = root.querySelectorAll ? root : document;
    const blocks = [];
    if (root?.matches?.('.full-entry-title-block')) blocks.push(root);
    blocks.push(...Array.from(scope.querySelectorAll?.(DETAIL_BLOCK_SELECTOR) || []));
    blocks.forEach(applyDetailBlock);
  }

  function applyAll(root = document) {
    if (applying) return;
    applying = true;
    try {
      applyBoard(root);
      applyDetails(root);
    } finally {
      applying = false;
    }
  }

  function schedule(root = document) {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      applyAll(root);
    });
  }

  function applyBeforeExport() {
    applyAll(document);
  }

  document.addEventListener('click', event => {
    if (event.target?.closest?.(EXPORT_ACTIONS)) applyBeforeExport();
    if (event.target?.closest?.('[data-row-reverse],.card-row-reverse,.row-reverse-card')) queueMicrotask(() => schedule(document));
  }, true);
  document.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target?.closest?.(EXPORT_ACTIONS)) applyBeforeExport();
  }, true);
  document.addEventListener('relphi:drawing-board-rendered', () => applyAll(document));
  document.addEventListener('relphi:drawing-board-center-view', () => applyAll(document));

  new MutationObserver(records => {
    if (applying) return;
    for (const record of records) {
      if (record.type === 'childList' && record.addedNodes.length) { schedule(document); return; }
      if (record.type === 'attributes' && (record.attributeName === 'class' || record.attributeName === 'data-row-reversed')) { schedule(document); return; }
    }
  }).observe(document.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:['class','data-row-reversed'] });

  window.RelphiTarotReversedMeanings = Object.freeze({
    derive,
    meaningFor: id => derive(id),
    all: () => ({ ...buildIndex() }),
    apply: () => applyAll(document)
  });
  // Backwards-compatible hook retained for anything that called the old cleanup helper.
  window.RelphiTarotSpecificReversedText = value => String(value || '').trim();

  applyAll(document);
})();