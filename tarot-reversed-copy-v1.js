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

  const COURT_SPECIFIC_REVERSED = Object.freeze({
    knight_of_wands: 'Fire of Fire no longer charges straight outward. Commanding will can be called back, relinquished, or redirected before force becomes action; the reversal changes who or what receives the flame, rather than merely weakening courage.',
    queen_of_wands: 'Water of Fire changes from containing and sustaining passion to releasing what it has held. A receptive command of desire can open its boundaries, cease feeding a flame, or return energy to its source without denying its warmth.',
    prince_of_wands: 'Air of Fire interrupts its own forward-moving vision. An inspired course can be questioned, revised, or redirected as thought takes the reins from momentum; the reversal turns propulsion into reconsideration rather than simply stalled ambition.',
    princess_of_wands: 'Earth of Fire alters the passage from spark into embodiment. A promising initiative may be unplanted, reshaped, or returned to preparation so that its eventual form differs from the one first imagined.',
    knight_of_cups: 'Fire of Water redirects the active pursuit of feeling. An emotional offer may be withdrawn, a longing renounced, or desire put into a different relationship; the reversal concerns where the seeking current now flows.',
    queen_of_cups: 'Water of Water loosens the reflecting vessel. Feeling once mirrored or absorbed can be returned to its owner, released, or distinguished from the self; the reversal separates receptivity from indefinite emotional containment.',
    prince_of_cups: 'Air of Water changes the interpretation or direction of feeling. A carefully imagined connection may be reconsidered, its promise renamed, or its emotional strategy abandoned when the story no longer fits what is felt.',
    princess_of_cups: 'Earth of Water reopens the form given to a feeling. An attachment, message, or tender possibility may remain unexpressed, be returned to the inner world, or find a different vessel before it becomes real.',
    knight_of_swords: 'Fire of Air draws back or redirects the decisive strike. An argument can be retracted, a pursuit halted, or intellectual force turned toward correcting its own premise rather than defeating another position.',
    queen_of_swords: 'Water of Air changes how discernment is held. A hard distinction may soften into renewed listening, or an absorbed narrative may be released so a boundary can be redrawn without carrying another person\'s judgment.',
    prince_of_swords: 'Air of Air turns analysis back upon its own machinery. A strategy, judgment, or ingenious argument may be dismantled or revised, making room for uncertainty where reasoning once insisted on command.',
    princess_of_swords: 'Earth of Air alters how a message becomes a fact on the ground. A conclusion may be withheld, evidence reexamined, or a proposed boundary reworked before thought is fixed into action.',
    knight_of_disks: 'Fire of Earth redirects the drive to cultivate and secure. Sustained material effort can be stopped, transferred, or brought to harvest rather than continued by duty alone; the reversal changes what labor is serving.',
    queen_of_disks: 'Water of Earth loosens the hold of material caretaking. Resources and bodily support may be offered outward, reclaimed for the self, or allowed to change hands instead of remaining within one protective enclosure.',
    prince_of_disks: 'Air of Earth revises the plan by which value is built. A practical system can be dismantled, its pace recalculated, or its resources assigned to a different end when steady growth no longer answers the real need.',
    princess_of_disks: 'Earth of Earth shifts what is ready to take form. A material beginning may be delayed by choice, returned to seed, transplanted, or released from its original container so it can grow under different conditions.'
  });

  const PIP_SPECIFIC_REVERSED = Object.freeze({
    ace_of_swords: 'A distinction once ready to be cut may be sheathed, withdrawn, or reconsidered. Air returns from declaration to discernment: an argument can be suspended, a judgment revoked, or a boundary redrawn rather than sharpened further.',
    two_of_swords: 'The held balance of opposing thoughts begins to shift. The Moon in Libra can release a stalemate through a choice, disclosure, or changed terms; peace achieved by suspension no longer has to remain motionless.',
    three_of_swords: 'Sorrow\'s fixed division begins to mend or be understood differently. Saturn in Libra can loosen a painful judgment, allow grief to move, or restore contact across a separation without pretending the hurt did not occur.',
    four_of_swords: 'A truce ceases to be a sealed pause. Jupiter in Libra can reopen negotiation, turn rest into renewed exchange, or dissolve an agreement that merely postponed disagreement; the suspended conversation moves again.',
    five_of_swords: 'Defeat loses its claim to be the final verdict. Venus in Aquarius redirects attention from winning or losing toward recovering dignity, withdrawing from a hostile contest, or rebuilding connection on different terms.',
    six_of_swords: 'A settled explanation or intellectual method is reopened for revision. Mercury in Aquarius can move from confident analysis into questioning its own assumptions; science becomes discovery again when an accepted answer is no longer treated as complete.',
    seven_of_swords: 'A strategy judged futile changes course. The Moon in Aquarius can release scattered effort, disclose what was being avoided, or redirect cleverness toward a purpose that can actually be sustained.',
    eight_of_swords: 'Interference begins to lift. Jupiter in Gemini opens a path through competing demands, crossed signals, or restrictive explanations; movement and choice return as the entanglement is clarified or undone.',
    nine_of_swords: 'The operation of cruelty begins to lose its hold. Mars in Gemini withdraws force from accusation, torment, or cutting thought; a harmful message may be challenged, retracted, or refused rather than repeated.',
    ten_of_swords: 'Ruin is no longer the unquestioned endpoint. The Sun in Gemini illuminates what remains after a conclusion collapses, allowing a fatal judgment to be overturned or a new account to emerge from the wreckage.',
    ace_of_pentacles: 'An offered material beginning is withdrawn, returned, or redirected before taking root. Earth remains potential: resources can be reclaimed, a commitment reconsidered, or a different foundation chosen instead of accepting the first available form.',
    two_of_pentacles: 'An ongoing cycle of adjustment changes its rhythm or stops. Jupiter in Capricorn may turn perpetual accommodation into a firm choice, a stable boundary, or a different distribution of resources rather than another turn of the same exchange.',
    three_of_pentacles: 'Established work is taken apart, revised, or reassigned. Mars in Capricorn redirects effort from carrying out an agreed design toward changing its structure, participants, or division of labor.',
    four_of_pentacles: 'Held power begins to loosen its grip. The Sun in Capricorn can shift possession into sharing, release a rigid claim, or expose where control was mistaken for security; resources need not remain locked in one hand.',
    five_of_pentacles: 'Worry about material insufficiency begins to give way to practical movement. Mercury in Taurus can replace repetitive concern with clearer information, obtainable support, or a revised assessment of what is actually lacking.',
    six_of_pentacles: 'A recognized success or settled exchange is reopened. The Moon in Taurus may redistribute what was received, question whether support was reciprocal, or turn private security into assistance for another.',
    seven_of_pentacles: 'An apparent failure ceases to dictate the next step. Saturn in Taurus can release a fruitless investment, change the measure of results, or permit cultivation to resume on more viable ground.',
    eight_of_pentacles: 'Prudent repetition gives way to a revised method or a deliberate pause. The Sun in Virgo can redirect care from perfecting the existing routine toward recognizing when more refinement no longer serves the work.',
    nine_of_pentacles: 'Accumulated gain changes hands, purpose, or measure. Venus in Virgo may turn private sufficiency into sharing, exchange possession for freedom, or reassess whether what has been acquired is still worth maintaining.',
    ten_of_pentacles: 'An established material inheritance or system of wealth begins to be redistributed or restructured. Mercury in Virgo can reopen its rules, ownership, or obligations so continuity no longer depends on preserving every former arrangement.',
    ace_of_wands: 'The spark withdraws from immediate expression, returning Fire to potential rather than action. What would have been launched can be withheld, rekindled in another direction, or deliberately left unignited; the reversal changes the passage from desire into deed.',
    two_of_wands: 'Dominion begins to loosen: a will that directed the field may relinquish command, meet an opposing will, or cease to govern its former territory. Mars in Aries redirects initiative from exercising control toward deciding what is actually one\'s own to direct.',
    three_of_wands: 'An outward-growing purpose turns back for reconsideration. With the Sun in Aries, the energy once invested in extending an undertaking can return to its source, so the course is revised before further expansion rather than merely pushed forward.',
    four_of_wands: 'Completion ceases to be a settled endpoint. Venus in Aries releases an established arrangement back into negotiation or independent movement; what appeared finished becomes open to alteration, departure, or a different way of belonging.',
    five_of_wands: 'Strife begins to unwind as competing forces disengage from the contest. Saturn in Leo can redirect the energy once spent resisting or proving strength into setting boundaries; the struggle loses its power to dictate every move.',
    six_of_wands: 'Victory is relinquished, overturned, or no longer accepted as the measure of success. Jupiter in Leo redirects the desire for public recognition toward reassessing what the achievement cost and whether the triumph still deserves to be claimed.',
    seven_of_wands: 'The defended position is no longer held by sheer force. Mars in Leo can redirect courage from resistance to withdrawal, concession, or a different ground on which to act; ending a defense is not the same as losing all agency.',
    eight_of_wands: 'Rapid movement slows, changes course, or is called back before reaching its destination. Mercury in Sagittarius turns momentum into revision: a message can be reconsidered, a journey redirected, or a sequence interrupted before it runs to completion.',
    nine_of_wands: 'The guarded reserve of strength begins to stand down. The Moon in Sagittarius releases the demand for constant endurance, allowing protection to become rest, assistance, or a different use of energy rather than another test of stamina.',
    ten_of_wands: 'The accumulated burden begins to be set down. Saturn in Sagittarius loosens the hold of duty or mission: a load can be shared, refused, completed, or released instead of carried farther simply because it has already been carried so long.',
    ace_of_cups: 'The opened vessel changes its direction of flow. Water that was ready to be received may instead be withheld, poured out, or returned to its source; the reversal concerns whether feeling is entering, leaving, or being deliberately contained.',
    two_of_cups: 'The joining of two emotional currents begins to separate or be renegotiated. Venus in Cancer turns union into differentiation: affection may remain, but agreement, reciprocity, or the assumption of mutual availability can no longer be taken for granted.',
    three_of_cups: 'The shared emotional circle opens or disperses. Mercury in Cancer redirects feeling from collective celebration toward private understanding, separate voices, or a conversation that changes the group\'s former agreement.',
    four_of_cups: 'A settled emotional container begins to open. The Moon in Cancer loosens familiarity\'s hold so that a new offering, feeling, or arrangement can be received; security is no longer maintained solely by keeping everything as it was.',
    five_of_cups: 'The hold of loss begins to release. Mars in Scorpio withdraws force from the wound or struggle, making room to recover what remains, grieve without reenacting the injury, or redirect attachment toward life beyond the disappointment.',
    six_of_cups: 'The past ceases to govern the present in the same way. The Sun in Scorpio brings an old loyalty, pleasure, or memory into new light so it can be revised, relinquished, or received without restoring the former bond on its old terms.',
    seven_of_cups: 'An alluring image loses its power to substitute for reality. Venus in Scorpio turns desire away from proliferating possibilities toward a discerning choice, withdrawal from fantasy, or release of an attachment that cannot be realized.',
    eight_of_cups: 'The movement away from an unsatisfying situation changes direction. Saturn in Pisces may halt a departure, prompt a return to unfinished feeling, or dissolve the obligation to keep withdrawing; the reversal asks what is being revisited rather than assuming further abandonment.',
    nine_of_cups: 'Private satisfaction is no longer a closed endpoint. Jupiter in Pisces may release a pleasure once kept for oneself, revise what counts as enough, or turn fulfilled desire outward into generosity; enjoyment changes its direction or measure.',
    ten_of_cups: 'An apparently complete emotional arrangement begins to come undone or be renegotiated. Mars in Pisces releases pressure from sustaining its appearance of harmony; what was treated as fulfilled can be reopened so that overlooked needs, unequal effort, or an unacknowledged ending may be recognized.'
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