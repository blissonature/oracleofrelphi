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
    the_fool: 'The leap out of the known changes direction: an uncommitted beginning is recalled before it becomes a journey, or a wandering possibility acquires a chosen destination. The Fool\'s freedom remains, but novelty alone no longer decides the course.',
    the_magician: 'The act of making a thought operative is undone or revised. Mercury brings a declaration back into consideration: a promise can be withdrawn, a message corrected, or a technique relinquished when the words no longer serve the intention.',
    the_high_priestess: 'The veil between the known and unknown begins to part. What had been held in silence, intuition, or secrecy becomes speakable or available to conscious examination; the reversal changes access to knowledge without requiring every mystery to be solved.',
    the_empress: 'The flow of generation is brought to a boundary. Venus may cease producing or nourishing an established form so that an offspring, relationship, or creation can develop apart from its source; care changes from provision to allowing independence.',
    the_emperor: 'The command structure releases its claim to unquestioned authority. Aries redirects protective force toward self-rule or shared decision, allowing a law, boundary, or hierarchy to be revised rather than enforced simply because it exists.',
    the_hierophant: 'An inherited teaching loses its status as an obligatory form. Taurus turns transmission into personal examination: a student may depart from doctrine, reinterpret a tradition, or keep its living value without retaining its old institution.',
    the_lovers: 'A joining becomes a distinction. Gemini separates voices, commitments, or alternatives that had been treated as one; the reversal is the moment choice becomes possible through differentiation rather than through automatic agreement.',
    the_chariot: 'The forces held together by sheer direction are permitted to move separately. Cancer changes victory through containment into a choice to stop driving, release the armor, or relinquish a destination that demanded too much enclosure.',
    strength: 'The need to master the living force gives way to relationship with it. Leo\'s heat is neither conquered nor performed: desire, anger, or courage can be acknowledged without demanding dominance over oneself or another.',
    the_hermit: 'The inward search reaches its threshold and turns outward. Virgoan discernment leaves private examination to offer its finding, request assistance, or enter imperfect participation; wisdom no longer requires continuing isolation.',
    wheel_of_fortune: 'The turning cycle is interrupted or its direction changes. Jupiterian increase no longer carries the situation along its established momentum; an apparent rise can reverse, or recurrence can be broken by recognizing the pattern.',
    justice: 'A settled balance is reopened because its terms no longer hold. Libra asks that evidence, responsibility, and unequal consequences be reweighed; the reversal is reconsideration of the measure itself, not simply an unfair verdict.',
    the_hanged_man: 'Suspension ends or loses its claim on the person held there. Neptune\'s surrender gives way to a recovered agency: sacrifice can be declined, the old viewpoint put into practice, or waiting stopped without pretending the pause taught nothing.',
    death: 'The process of ending changes course. Scorpio may return what was thought finished for one final reckoning, or free a person from an ending they have kept reenacting; reversal concerns whether the separation is undone or finally completed.',
    temperance: 'A mixture is separated into its constituent forces. Sagittarius restores differences that compromise had blurred, allowing purposes or parties to take distinct directions rather than treating harmony as endless blending.',
    the_devil: 'A binding arrangement begins to lose its authority. Capricorn\'s dependencies become visible as constructed ties that can be renegotiated, refused, or broken; reclaiming choice is the reversal of bondage, not simply another form of captivity.',
    the_tower: 'The collapse of a false structure is interrupted, contained, or turned into deliberate dismantling. Mars can direct the force of rupture toward removing what is unsound before destruction takes everything with it; the reversal changes the manner of breakdown, not the need to face instability.',
    the_star: 'A distant ideal becomes an immediate responsibility. Aquarius draws hope down from the imagined future into a specific act, commitment, or reachable relationship; possibility reverses from projection into something that can be tested in the world.',
    the_moon: 'The enchantment of an uncertain image begins to break. Pisces permits dream, fear, or projection to be distinguished from what actually stands before us; the reversal is an emergence from obscurity, not deeper obscurity by default.',
    the_sun: 'The light that made a person or situation visible is dimmed or turned away. Leo\'s recognition may be withdrawn, a public certainty questioned, or something once obvious pass out of view; reversal changes the availability of illumination.',
    judgement: 'A summons once treated as final is recalled or answered differently. Pluto\'s call to reckon with the past may be resisted, revised, or transformed into release from an old sentence; what had been pronounced irreversible becomes open to another decision.',
    the_world: 'A completed order reopens at its boundary. Saturn\'s finished structure ceases to be the only possible world: a role can end, a closed cycle begin again, or an established whole yield space for what lies beyond it.'
  });

  const COURT_SPECIFIC_REVERSED = Object.freeze({
    knight_of_wands: 'Fire of Fire ceases to recognize escalation as leadership. The one who had been driving the charge can hand initiative to others and discover that authority survives without constant demonstration of force.',
    queen_of_wands: 'Water of Fire stops sustaining another person\'s blaze. The capacity to hold intensity becomes the capacity to cool it: hospitality, loyalty, or attraction may remain while the emotional fuel that kept it burning is no longer supplied.',
    prince_of_wands: 'Air of Fire subjects inspiration to contradiction. A dazzling plan meets competing possibilities, and the first vision loses its monopoly; the reversal is the breaking of a compelling direction into choices that must be compared.',
    princess_of_wands: 'Earth of Fire is a seed that refuses its assigned vessel. An emerging talent or venture changes the conditions under which it will become tangible; the reversal is germination elsewhere, not merely a late beginning.',
    knight_of_cups: 'Fire of Water abandons the quest for an ideal feeling as something to conquer. The suitor, seeker, or champion of a desire ceases pursuing an image and faces what affection actually asks of them.',
    queen_of_cups: 'Water of Water ceases to function as an undifferentiated mirror. One person\'s feeling can be separated from another\'s; empathy becomes recognition of whose emotion it is, rather than endless absorption.',
    prince_of_cups: 'Air of Water interrupts the narrative that organized desire. Seduction, longing, or an imagined future loses its persuasive story, and feeling must be understood without the explanation that previously made it seem inevitable.',
    princess_of_cups: 'Earth of Water brings an unspoken tenderness to a threshold of expression. Instead of quietly becoming an attachment or promise, the feeling asks for a different concrete gesture—or is acknowledged without being promised.',
    knight_of_swords: 'Fire of Air loses the privilege of the first strike. The argument that once drove events must answer a counterargument; the reversal turns attack into accountability for the words already launched.',
    queen_of_swords: 'Water of Air stops holding a judgment as an enduring emotional truth. Grief-informed discernment can become fresh perception, allowing a person or situation to be seen without the old verdict governing every detail.',
    prince_of_swords: 'Air of Air multiplies distinctions until the ruling theory dismantles itself. What seemed like a decisive intellectual strategy becomes several incompatible claims, exposing assumptions that need testing rather than another clever conclusion.',
    princess_of_swords: 'Earth of Air refuses to turn a suspicion into an established fact. Observation stays provisional, evidence is sought, and a boundary or accusation is withheld until language has sufficient ground beneath it.',
    knight_of_disks: 'Fire of Earth reaches the point where perseverance no longer means progress. The cultivator stops tending an unresponsive field and redirects labor toward what can actually grow; endurance gives way to an assessment of yield.',
    queen_of_disks: 'Water of Earth distinguishes nourishment from possession. Care that once protected by holding resources close can become provision that permits independence, releasing someone from the obligation to remain inside the caregiver\'s shelter.',
    prince_of_disks: 'Air of Earth breaks a dependable production cycle into its component decisions. The builder questions efficiency, ownership, and purpose separately, replacing automatic continuation with a redesigned material process.',
    princess_of_disks: 'Earth of Earth reveals that a formed possibility is not yet an obligation to produce. The seed may be stored, transplanted, or deliberately left dormant; the reversal protects potential from premature commitment.'
  });

  const PIP_SPECIFIC_REVERSED = Object.freeze({
    ace_of_swords: 'The raised blade is lowered before the judgment becomes binding. Air\'s power to distinguish remains, but finality gives way to investigation and the possibility that the original distinction was mistaken.',
    two_of_swords: 'The equilibrium of indecision is deliberately disturbed. The Moon in Libra turns the protection of peace into the risk of choice: movement is possible once perfect balance is no longer required.',
    three_of_swords: 'The separation marked by sorrow ceases to be absolute. Saturn in Libra allows contact or comprehension across an old division, even when the event that caused the hurt cannot be undone.',
    four_of_swords: 'The ceasefire reaches its appointed end. Jupiter in Libra returns suspended disagreement to active dialogue, testing whether the quiet established genuine agreement or merely postponed a decision.',
    five_of_swords: 'The loser rejects the contest\'s definition of worth. Venus in Aquarius makes defeat reversible not by claiming a hidden victory but by leaving the terms under which dignity was measured.',
    six_of_swords: 'A convincing theory becomes a question again. Mercury in Aquarius exposes the limits of its own model; the apparent certainty of analysis gives way to a new experiment.',
    seven_of_swords: 'A futile strategy is abandoned rather than perfected. The Moon in Aquarius redirects ingenuity away from evasion and toward a goal that can survive contact with reality.',
    eight_of_swords: 'The interlocking constraints begin to come apart. Jupiter in Gemini opens alternative routes through a field of conflicting claims, so agency returns as the tangle is distinguished thread by thread.',
    nine_of_swords: 'The cutting word is deprived of its continuing authority. Mars in Gemini interrupts repeated accusation through refusal, retraction, or correction; cruelty no longer dictates the terms of thought.',
    ten_of_swords: 'The sentence of ruin is reopened after it seemed final. The Sun in Gemini reveals overlooked continuities and possible futures, overturning the conclusion that nothing can follow the ending.',
    ace_of_pentacles: 'The offered seed is reclaimed before planting. Earthly possibility remains intact while the decision to invest, accept, or commit returns to the person who controls the resources.',
    two_of_pentacles: 'The juggling stops because the cycle\'s rules are changed. Jupiter in Capricorn transforms adaptability into a stable allocation: a recurring demand no longer requires a fresh concession every time.',
    three_of_pentacles: 'The blueprint is reopened after work has begun. Mars in Capricorn changes cooperation from obedient execution to a renegotiation of roles, standards, and the result being built.',
    four_of_pentacles: 'The locked store is opened. The Sun in Capricorn converts power held through possession into power exercised through access, transfer, or the voluntary surrender of exclusive control.',
    five_of_pentacles: 'An uncertain shortage becomes a solvable material question. Mercury in Taurus changes worry into verification, assistance, and specific choices about what is needed.',
    six_of_pentacles: 'Success is brought back into exchange. The Moon in Taurus tests whether what was gained can circulate as mutual support instead of remaining proof of one person\'s security.',
    seven_of_pentacles: 'The verdict of failure is suspended. Saturn in Taurus distinguishes a dead investment from a slow-growing one, allowing deliberate replanting or abandonment instead of repeating the same frustrated effort.',
    eight_of_pentacles: 'The craftsperson stops polishing a method that has become its own end. The Sun in Virgo returns attention from faultless repetition to the purpose the practice was meant to serve.',
    nine_of_pentacles: 'The owner becomes free to part with what has been gained. Venus in Virgo transforms accumulation into discernment about which possessions sustain independence and which now demand its sacrifice.',
    ten_of_pentacles: 'The inherited order is treated as revisable rather than permanent. Mercury in Virgo separates continuity of care from continuity of ownership, opening established wealth or obligations to new terms.',
    ace_of_wands: 'The spark is contained before it becomes a declaration. Fire remains capable of ignition, but initiative passes from spontaneous discharge to choosing a worthy occasion; the reversal is conservation of the first impulse.',
    two_of_wands: 'Dominion meets the limit of its jurisdiction. Mars in Aries can still initiate, but the right to direct another\'s course is withdrawn; self-command replaces command over the field.',
    three_of_wands: 'A venture that has already been set in motion must return to its founding purpose. The Sun in Aries reverses outward expansion into an examination of why the work was begun, separating conviction from momentum.',
    four_of_wands: 'The ceremony of completion is interrupted by unfinished participation. Venus in Aries changes a settled celebration into an open agreement: those included in the structure regain a say in its terms.',
    five_of_wands: 'Strife loses its organizing center. Saturn in Leo no longer holds competitors in one contest, allowing energies previously defined by opposition to separate and find independent expression.',
    six_of_wands: 'The acclaim of victory is returned to its audience for judgment. Jupiter in Leo changes public triumph into an examination of whom the recognition excluded and whether the celebrated result merits the crown.',
    seven_of_wands: 'A defended height is voluntarily vacated. Mars in Leo transforms bravery from holding ground against all challengers to deciding that the contest itself no longer defines honor.',
    eight_of_wands: 'The message is intercepted before consequence outruns intention. Mercury in Sagittarius converts swift transmission into recall, revision, or a pause that allows meaning to catch up with velocity.',
    nine_of_wands: 'The watch ends. The Moon in Sagittarius permits a vigilant survivor to lay down the anticipatory defense, marking the shift from surviving the next challenge to inhabiting the safety already reached.',
    ten_of_wands: 'The carrier refuses to serve as the structure that holds every obligation together. Saturn in Sagittarius changes oppression through redistribution: the task must find more hands, a smaller scope, or its conclusion.',
    ace_of_cups: 'The chalice is turned from taking in toward pouring out. Water\'s potential becomes an act of offering, emptying, or declining to receive; the reversal changes the flow rather than assuming the feeling is damaged.',
    two_of_cups: 'A union makes room for two separate wills. Venus in Cancer changes emotional joining into differentiation, so affection need not imply consent to every shared arrangement.',
    three_of_cups: 'The chorus breaks into distinct voices. Mercury in Cancer transforms communal agreement into the recognition of experiences that celebration had gathered under a single shared account.',
    four_of_cups: 'The closed circle of familiar satisfaction is breached by an unfamiliar offering. The Moon in Cancer permits the protected emotional world to change without requiring its history to be disowned.',
    five_of_cups: 'The disappointing outcome loses its power to organize every feeling. Mars in Scorpio stops returning force to what was lost, allowing grief to become memory and attachment to find a living object.',
    six_of_cups: 'A remembered pleasure stops being the template for present affection. The Sun in Scorpio reveals what the memory concealed, allowing tenderness for the past without restoring its former conditions.',
    seven_of_cups: 'The spell of competing desires is broken by a concrete choice. Venus in Scorpio relinquishes the fascination of infinite possibilities, accepting the limits and consequences of one real attachment.',
    eight_of_cups: 'A departure is interrupted by the discovery that the abandoned matter is unfinished. Saturn in Pisces turns withdrawal back toward responsibility for what still needs to be felt, said, or resolved.',
    nine_of_cups: 'Contentment crosses the boundary of the self. Jupiter in Pisces transforms private gratification into sharing, generosity, or the recognition that a fulfilled wish need not keep expanding.',
    ten_of_cups: 'The claim of complete harmony is reopened. Mars in Pisces makes visible the effort needed to sustain emotional agreement; a supposedly finished arrangement must reckon with what one party could not receive or contribute.'
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
    if (card.card_type === 'Court') return COURT_SPECIFIC_REVERSED[card.card_id] || deriveCourt(card);
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