(function () {
  const cards = Array.isArray(window.RELPHI_TAROT_CARDS) ? window.RELPHI_TAROT_CARDS : [];


  const $ = (id) => document.getElementById(id);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const SIGN_DATA = {
    Aries: { ruler: 'Mars', exaltation: 'Sun', detriment: 'Venus', fall: 'Saturn', element: 'Fire', mode: 'Cardinal', polarity: 'Active', major: 'The Emperor' },
    Taurus: { ruler: 'Venus', exaltation: 'Moon', detriment: 'Mars', fall: '', element: 'Earth', mode: 'Fixed', polarity: 'Passive', major: 'The Hierophant' },
    Gemini: { ruler: 'Mercury', exaltation: '', detriment: 'Jupiter', fall: '', element: 'Air', mode: 'Mutable', polarity: 'Active', major: 'The Lovers' },
    Cancer: { ruler: 'Moon', exaltation: 'Jupiter', detriment: 'Saturn', fall: 'Mars', element: 'Water', mode: 'Cardinal', polarity: 'Passive', major: 'The Chariot' },
    Leo: { ruler: 'Sun', exaltation: '', detriment: 'Saturn', fall: '', element: 'Fire', mode: 'Fixed', polarity: 'Active', major: 'Strength / Lust' },
    Virgo: { ruler: 'Mercury', exaltation: 'Mercury', detriment: 'Jupiter', fall: 'Venus', element: 'Earth', mode: 'Mutable', polarity: 'Passive', major: 'The Hermit' },
    Libra: { ruler: 'Venus', exaltation: 'Saturn', detriment: 'Mars', fall: 'Sun', element: 'Air', mode: 'Cardinal', polarity: 'Active', major: 'Justice / Adjustment' },
    Scorpio: { ruler: 'Mars', exaltation: '', detriment: 'Venus', fall: 'Moon', element: 'Water', mode: 'Fixed', polarity: 'Passive', major: 'Death' },
    Sagittarius: { ruler: 'Jupiter', exaltation: '', detriment: 'Mercury', fall: '', element: 'Fire', mode: 'Mutable', polarity: 'Active', major: 'Temperance / Art' },
    Capricorn: { ruler: 'Saturn', exaltation: 'Mars', detriment: 'Moon', fall: 'Jupiter', element: 'Earth', mode: 'Cardinal', polarity: 'Passive', major: 'The Devil' },
    Aquarius: { ruler: 'Saturn', exaltation: '', detriment: 'Sun', fall: '', element: 'Air', mode: 'Fixed', polarity: 'Active', major: 'The Star' },
    Pisces: { ruler: 'Jupiter', exaltation: 'Venus', detriment: 'Mercury', fall: 'Mercury', element: 'Water', mode: 'Mutable', polarity: 'Passive', major: 'The Moon' }
  };
  const HOUSE_TOPICS = [
    'identity/body topics', 'money/value topics', 'speech/sibling/local-world topics', 'home/ancestry/foundation topics',
    'pleasure/children/creative-risk topics', 'work/illness/service topics', 'partnership/open-enemy topics',
    'debt/death/shared-resource topics', 'God/travel/study/law topics', 'career/public-role topics',
    'friends/allies/future-hopes topics', 'hiddenness/exile/retreat topics'
  ];
  const HOUSE_NAMES = ['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh','twelfth'];
  const BODIES = ['Sun','Moon','Rising','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','Node','Lilith','Chiron','Fortune','Vertex','MC'];
  const CURRENT_BODIES = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','Node','Lilith','Chiron','Fortune','Vertex','Rising','MC'];
  const WEEKDAY_PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
  const PLANET_THEMES = {
    Sun: ['vitality','visibility','identity','radiance'], Moon: ['memory','body','need','rhythm'], Mercury: ['speech','signal','learning','exchange'],
    Venus: ['beauty','relation','pleasure','value'], Mars: ['force','conflict','desire','severance'], Jupiter: ['increase','blessing','faith','generosity'],
    Saturn: ['boundary','time','pressure','consequence'], Neptune: ['dream','mist','vision','dissolution'], Pluto: ['depth','compulsion','underworld','transformation']
  };

  const BODY_GLOSSES = {
    Sun: 'identity, vitality, and will',
    Moon: 'need, memory, and instinct',
    Rising: 'body, presence, and first impression',
    Mercury: 'speech, thought, and interpretation',
    Venus: 'love, beauty, and desire',
    Mars: 'action, drive, and defense',
    Jupiter: 'growth, faith, and blessing',
    Saturn: 'boundary, time, and consequence',
    Neptune: 'dream, surrender, and dissolution',
    Pluto: 'depth, power, and transformation'
  };
  const BODY_GLYPHS = { Sun:'☉', Moon:'☽', Rising:'ASC', Mercury:'☿', Venus:'♀', Mars:'♂', Jupiter:'♃', Saturn:'♄', Uranus:'♅', Neptune:'♆', Pluto:'⯓', Node:'☊', Lilith:'⚸', Chiron:'⚷', Fortune:'$', Vertex:'Vx', MC:'MC' };
  function glyphLengthClass(glyph) {
    const len = String(glyph || '').replace(/\s+/g, '').length;
    if (len >= 3) return ' is-long-glyph';
    if (len >= 2) return ' is-text-glyph';
    return '';
  }
  const SIGN_GLYPHS = { Aries:'♈︎', Taurus:'♉︎', Gemini:'♊︎', Cancer:'♋︎', Leo:'♌︎', Virgo:'♍︎', Libra:'♎︎', Scorpio:'♏︎', Sagittarius:'♐︎', Capricorn:'♑︎', Aquarius:'♒︎', Pisces:'♓︎' };
  const ELEMENT_GLYPHS = { Fire:'🜂', Water:'🜄', Air:'🜁', Earth:'🜃' };
  const HEBREW_LETTER_GLYPHS = {
    Aleph:'א', Beth:'ב', Bet:'ב', Gimel:'ג', Daleth:'ד', Dalet:'ד', Heh:'ה', He:'ה', Vav:'ו', Waw:'ו', Zayin:'ז', Cheth:'ח', Chet:'ח', Teth:'ט', Tet:'ט', Yod:'י', Kaph:'כ', Kaf:'כ', Lamed:'ל', Mem:'מ', Nun:'נ', Samekh:'ס', Samek:'ס', Ayin:'ע', Peh:'פ', Pe:'פ', Tzaddi:'צ', Tzadi:'צ', Qoph:'ק', Qof:'ק', Resh:'ר', Shin:'ש', Tav:'ת', Tau:'ת'
  };
  const PLANET_ACTIONS = {
    Sun: 'brings vitality, visibility, and will',
    Moon: 'brings feeling, memory, and rhythm',
    Mercury: 'brings analysis, exchange, and craft',
    Venus: 'brings attraction, pleasure, and value',
    Mars: 'brings force, heat, and severance',
    Jupiter: 'brings expansion, perspective, and reconciliation',
    Saturn: 'presses consequence and boundary',
    Neptune: 'brings dream, surrender, and dissolution',
    Pluto: 'brings depth, power, and transformation'
  };
  const SIGN_FIELD_THEMES = {
    Aries: 'action, assertion, conflict, and courage',
    Taurus: 'embodiment, pleasure, stability, and value',
    Gemini: 'speech, choice, exchange, and motion',
    Cancer: 'care, memory, protection, and belonging',
    Leo: 'radiance, courage, sovereignty, and heart',
    Virgo: 'craft, discernment, service, and embodiment',
    Libra: 'beauty, balance, value, and relation',
    Scorpio: 'depth, desire, danger, and transformation',
    Sagittarius: 'faith, travel, law, and horizon',
    Capricorn: 'structure, labor, consequence, and command',
    Aquarius: 'pattern, distance, groups, and future vision',
    Pisces: 'dream, compassion, surrender, and dissolution'
  };
  const HOUSE_TOPIC_PLAIN = [
    'identity and body', 'money and value', 'speech, siblings, and the local world', 'home, ancestry, and foundation',
    'pleasure, children, and creative risk', 'work, illness, and service', 'partnership and direct others',
    'shared resources, debt, inheritance, loss, and release', 'belief, travel, study, and law', 'career and public role',
    'friends, allies, and future hopes', 'hiddenness, retreat, exile, and undoing'
  ];
  const HOUSE_AXIS_PHRASES = {
    '1-7': 'self and body meet partners, opponents, and direct others',
    '2-8': 'your money and your values meet shared resources, debt, inheritance, loss, and release',
    '3-9': 'local speech and daily learning meet belief, law, travel, and higher study',
    '4-10': 'home and roots meet career, visibility, and public role',
    '5-11': 'personal joy and creative risk meet friends, groups, and future hopes',
    '6-12': 'work, service, and illness meet retreat, hiddenness, and undoing'
  };
  const CARD_THEME_PHRASES = {
    Dominion: 'dominion, initiative, and directed force', Virtue: 'virtue, integrity, and stable fire', Completion: 'completion, settlement, and established fire',
    Strife: 'strife, pressure, and contest', Victory: 'victory, confidence, and public force', Valour: 'valour, courage, and resistance',
    Swiftness: 'swiftness, signal, and rapid movement', Strength: 'strength, endurance, and gathered fire', Oppression: 'oppression, burden, and excess force',
    Love: 'love, attraction, and joining', Abundance: 'abundance, overflow, and celebration', Luxury: 'fullness, comfort, and emotional saturation',
    Disappointment: 'disappointment, loss, and drained feeling', Pleasure: 'pleasure, sweetness, and restored feeling', Debauch: 'debauch, overflow, and temptation',
    Indolence: 'indolence, stagnation, and exhausted feeling', Happiness: 'happiness, fulfillment, and emotional increase', Satiety: 'satiety, completion, and emotional excess',
    Peace: 'peace, balance, and mental poise', Sorrow: 'sorrow, separation, and painful clarity', Truce: 'pause, settlement, and strategic quiet',
    Defeat: 'defeat, loss, and mental strain', Science: 'science, analysis, and clear ordering', Futility: 'futility, scattered effort, and unstable thought',
    Interference: 'interference, restriction, and blocked movement', Cruelty: 'cruelty, severity, and piercing thought', Ruin: 'ruin, collapse, and exhausted thought',
    Change: 'change, rhythm, and material movement', Work: 'work, craft, and construction', Power: 'power, structure, and material command',
    Worry: 'worry, instability, and material strain', Success: 'success, support, and material increase', Failure: 'failure, delay, and barren effort',
    Prudence: 'prudence, cultivation, and careful skill', Gain: 'gain, harvest, and material growth', Wealth: 'embodiment, inheritance, and accumulated value'
  };
  const PLANET_MAJOR_IDS = {
    Sun: 'the_sun', Moon: 'the_high_priestess', Mercury: 'the_magician', Venus: 'the_empress', Mars: 'the_tower', Jupiter: 'wheel_of_fortune', Saturn: 'the_world', Uranus: 'the_fool', Neptune: 'the_hanged_man'
  };
  const ACE_BY_ELEMENT = { Fire: 'ace_of_wands', Water: 'ace_of_cups', Air: 'ace_of_swords', Earth: 'ace_of_pentacles' };
  const COURT_RANGES = [
    { id: 'knight_of_wands', start: 'Scorpio', startDegree: 20, end: 'Sagittarius', endDegree: 20 },
    { id: 'queen_of_wands', start: 'Pisces', startDegree: 20, end: 'Aries', endDegree: 20 },
    { id: 'prince_of_wands', start: 'Cancer', startDegree: 20, end: 'Leo', endDegree: 20 },
    { id: 'knight_of_cups', start: 'Aquarius', startDegree: 20, end: 'Pisces', endDegree: 20 },
    { id: 'queen_of_cups', start: 'Gemini', startDegree: 20, end: 'Cancer', endDegree: 20 },
    { id: 'prince_of_cups', start: 'Libra', startDegree: 20, end: 'Scorpio', endDegree: 20 },
    { id: 'knight_of_swords', start: 'Taurus', startDegree: 20, end: 'Gemini', endDegree: 20 },
    { id: 'queen_of_swords', start: 'Virgo', startDegree: 20, end: 'Libra', endDegree: 20 },
    { id: 'prince_of_swords', start: 'Capricorn', startDegree: 20, end: 'Aquarius', endDegree: 20 },
    { id: 'knight_of_disks', start: 'Leo', startDegree: 20, end: 'Virgo', endDegree: 20 },
    { id: 'queen_of_disks', start: 'Sagittarius', startDegree: 20, end: 'Capricorn', endDegree: 20 },
    { id: 'prince_of_disks', start: 'Aries', startDegree: 20, end: 'Taurus', endDegree: 20 }
  ];
  const CELTIC_CROSS_POSITIONS = [
    { title: 'What covers', meaning: 'The matter as it stands.' },
    { title: 'What crosses', meaning: 'The crossing force.' },
    { title: 'What crowns', meaning: 'What is above.' },
    { title: 'What is beneath', meaning: 'What is below.' },
    { title: 'What is behind', meaning: 'What is passing.' },
    { title: 'What is before', meaning: 'What approaches.' },
    { title: 'The self', meaning: 'The querent.' },
    { title: 'The house', meaning: 'The surrounding field.' },
    { title: 'Hopes or fears', meaning: 'The charged expectation.' },
    { title: 'What will come', meaning: 'The likely development.' }
  ];
  const TIME_MIND_BODY_SPIRIT_POSITIONS = [
    { title: 'Past / Mind', meaning: 'The earlier thought, language, interpretation, or mental pattern behind the reading.' },
    { title: 'Past / Body', meaning: 'The earlier material, embodied, practical, or physical condition behind the reading.' },
    { title: 'Past / Spirit', meaning: 'The earlier meaning, devotion, calling, or animating principle behind the reading.' },
    { title: 'Present / Mind', meaning: 'The thought, language, interpretation, or mental pattern active now.' },
    { title: 'Present / Body', meaning: 'The material, embodied, practical, or physical condition active now.' },
    { title: 'Present / Spirit', meaning: 'The meaning, devotion, calling, or animating principle active now.' },
    { title: 'Future / Mind', meaning: 'The thought, language, interpretation, or mental pattern that may develop next.' },
    { title: 'Future / Body', meaning: 'The material, embodied, practical, or physical condition that may develop next.' },
    { title: 'Future / Spirit', meaning: 'The meaning, devotion, calling, or animating principle that may develop next.' }
  ];
  const SPREADS = {
    pastPresentFuture: ['Past','Present','Future'].map(title => ({ title, meaning: title === 'Past' ? 'What is behind.' : title === 'Present' ? 'What is active.' : 'What approaches.' })),
    timeMindBodySpirit: TIME_MIND_BODY_SPIRIT_POSITIONS,
    celticCross: CELTIC_CROSS_POSITIONS
  };
  const SPREAD_LABELS = { pastPresentFuture: 'Past / Present / Future', timeMindBodySpirit: '3×3 Time · Mind / Body / Spirit', celticCross: 'Celtic Cross' };
  const STICKER_PRESETS = [
    { group: 'Daily', name: 'One-card focus', labels: ['Focus'] },
    { group: 'Timeline', name: 'Past / Present / Future', labels: ['Past','Present','Future'] },
    { group: '3×3', name: 'Past / Present / Future × Mind / Body / Spirit', labels: TIME_MIND_BODY_SPIRIT_POSITIONS.map(item => item.title) },
    { group: 'Clarity', name: 'Situation / Challenge / Strategy', labels: ['Situation','Challenge','Strategy'] },
    { group: 'Decision', name: 'Choice path', labels: ['Option A','Option B','Advice'] },
    { group: 'Relationship', name: 'Relationship check-in', labels: ['You','Other','Bond','Challenge','Next step'] },
    { group: 'Comfort', name: 'Hope and comfort', labels: ['Confusion','Comfort','Lesson','Support','Next step'] },
    { group: 'Cross', name: 'Celtic Cross', labels: CELTIC_CROSS_POSITIONS.map(item => item.title) }
  ];
  function stickerPresetDisplay(preset) {
    return preset ? `${preset.group} · ${preset.name}` : '';
  }
  function stickerPresetForValue(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return null;
    return STICKER_PRESETS.find(preset => stickerPresetDisplay(preset).toLowerCase() === normalized || preset.name.toLowerCase() === normalized) || null;
  }
  function parsePositionLabels(value) {
    return String(value || '').split(',').map(x => x.trim().slice(0,90)).filter((x, i, arr) => x || i < arr.length - 1);
  }

  const HEBREW_SPELL_LETTERS = [
    { name:'Aleph', glyphs:['א'], latin:['a','e','aleph','alef'], cardId:'the_fool' },
    { name:'Beth', glyphs:['ב'], latin:['b','beth','bet'], cardId:'the_magician' },
    { name:'Gimel', glyphs:['ג'], latin:['g','gimel'], cardId:'the_high_priestess' },
    { name:'Daleth', glyphs:['ד'], latin:['d','daleth','dalet'], cardId:'the_empress' },
    { name:'Heh', glyphs:['ה'], latin:['h','heh','he'], cardId:'the_emperor' },
    { name:'Vav', glyphs:['ו'], latin:['v','u','vav','waw'], cardId:'the_hierophant' },
    { name:'Zayin', glyphs:['ז'], latin:['z','zayin'], cardId:'the_lovers' },
    { name:'Cheth', glyphs:['ח'], latin:['c','ch','cheth','heth','chet'], cardId:'the_chariot' },
    { name:'Teth', glyphs:['ט'], latin:['t','teth','tet'], cardId:'strength' },
    { name:'Yod', glyphs:['י'], latin:['y','i','j','yod'], cardId:'the_hermit' },
    { name:'Kaph', glyphs:['כ','ך'], latin:['k','kh','kaph','kaf'], cardId:'wheel_of_fortune' },
    { name:'Lamed', glyphs:['ל'], latin:['l','lamed'], cardId:'justice' },
    { name:'Mem', glyphs:['מ','ם'], latin:['m','mem'], cardId:'the_hanged_man' },
    { name:'Nun', glyphs:['נ','ן'], latin:['n','nun'], cardId:'death' },
    { name:'Samekh', glyphs:['ס'], latin:['s','samekh','samek'], cardId:'temperance' },
    { name:'Ayin', glyphs:['ע'], latin:['o','ayin'], cardId:'the_devil' },
    { name:'Peh', glyphs:['פ','ף'], latin:['p','peh','pe'], cardId:'the_tower' },
    { name:'Tzaddi', glyphs:['צ','ץ'], latin:['x','tz','ts','tzaddi','tzadi'], cardId:'the_star' },
    { name:'Qoph', glyphs:['ק'], latin:['q','qoph','qof'], cardId:'the_moon' },
    { name:'Resh', glyphs:['ר'], latin:['r','resh'], cardId:'the_sun' },
    { name:'Shin', glyphs:['ש'], latin:['w','sh','shin'], cardId:'judgement' },
    { name:'Tav', glyphs:['ת'], latin:['f','th','tav','tau'], cardId:'the_world' }
  ];
  const HEBREW_SPELL_BY_GLYPH = new Map();
  const HEBREW_SPELL_BY_LATIN = new Map();
  HEBREW_SPELL_LETTERS.forEach(item => {
    item.glyphs.forEach(glyph => HEBREW_SPELL_BY_GLYPH.set(glyph, item));
    item.latin.forEach(alias => HEBREW_SPELL_BY_LATIN.set(alias.toLowerCase(), item));
  });
  const HEBREW_COMBINING_MARKS = /[\u0591-\u05C7]/g;
  const LATIN_SPELL_TOKEN_ORDER = Array.from(HEBREW_SPELL_BY_LATIN.keys()).sort((a,b) => b.length - a.length);
  function parseSpellSequence(raw) {
    const source = String(raw || '').trim();
    const sequence = [];
    if (!source) return sequence;
    const text = source.normalize('NFC').replace(HEBREW_COMBINING_MARKS, '');
    if (/[\u05D0-\u05EA]/.test(text)) {
      Array.from(text).forEach(ch => {
        const item = HEBREW_SPELL_BY_GLYPH.get(ch);
        if (item) sequence.push({ ...item, input: ch });
      });
      return sequence;
    }
    const words = text.toLowerCase().split(/[\s,;|/._-]+/).filter(Boolean);
    if (words.length > 1 && words.every(word => HEBREW_SPELL_BY_LATIN.has(word))) {
      words.forEach(word => sequence.push({ ...HEBREW_SPELL_BY_LATIN.get(word), input: word }));
      return sequence;
    }
    const compact = text.toLowerCase().replace(/[^a-z]/g, '');
    let i = 0;
    while (i < compact.length) {
      const match = LATIN_SPELL_TOKEN_ORDER.find(token => compact.startsWith(token, i));
      if (match) {
        const item = HEBREW_SPELL_BY_LATIN.get(match);
        sequence.push({ ...item, input: compact.slice(i, i + match.length) });
        i += match.length;
      } else {
        i += 1;
      }
    }
    return sequence;
  }
  function openSpellSequence(raw) {
    const source = String(raw || '').trim();
    const sequence = parseSpellSequence(source);
    if (!sequence.length) return false;
    state.rowAllowRepeats = true;
    state.shortListName = `Spell: ${source}`.slice(0, 80);
    state.shortListPositionLabels = sequence.map(item => `${item.input} / ${item.name}`.slice(0, 90));
    state.shortListPositionCardIds = [];
    commitShortList(sequence.map(item => item.cardId));
    state.shortListSelection = [];
    state.shortListSelectMode = false;
    state.mode = 'all';
    state.query = '';
    if ($('oracleCommand')) $('oracleCommand').value = `/spell ${source}`;
    showPanel('browsePanel');
    setVisible('visibilityPanel', false);
    renderBrowse();
    updateSummary(sequence.map(item => cardById(item.cardId)).filter(Boolean));
    hideCommandMenu();
    pushHistory();
    return true;
  }

  const UHN_CARD_IDS = ['the_fool','the_magician','the_high_priestess','the_empress','the_emperor','the_tower','wheel_of_fortune','the_world','the_hanged_man'];
  const UHN_ORDER = new Map(UHN_CARD_IDS.map((id, index) => [id, index]));
  const UHN_FORMULAS = {
    the_fool: 'a₀ = 1',
    the_magician: 'a₁ = ((√3 + 1) / 2)²',
    the_high_priestess: 'a₂ = a₁^(3/4)φ',
    the_empress: 'a₃ = a₂^(3/4)((√6 + √2) / 2)',
    the_emperor: 'a₄ = a₃(√2 + 2)',
    the_tower: 'a₅ = a₄(2cos(π / 8))',
    wheel_of_fortune: 'a₆ = 2a₅',
    the_world: 'a₇ = (π / 2)a₆',
    the_hanged_man: 'a₈ = a₇ + λ(a₇ − a₆), λ = 103 / 125'
  };
  const UHN_INTERPRETATIONS = {
    the_fool: 'Identity at the solar origin: before measure begins, the self is the reference point from which every interval is read.',
    the_magician: 'Understanding: identity crosses from Sun to Mercury, where the self becomes signal, speech, naming, and exchange.',
    the_high_priestess: 'Affection: Mercury’s signal crosses into Venus, where meaning becomes felt relation and receptive connection.',
    the_empress: 'Subsistence: Venusian relation crosses into Earth, where affection becomes body, nourishment, fertility, and support.',
    the_emperor: 'Protection: Earthly subsistence crosses into Mars, where life becomes boundary, defense, and durable structure.',
    the_tower: 'Participation: Martial protection crosses into Jupiter, where force enters consequence, society, law, and the shared field.',
    wheel_of_fortune: 'Freedom: Jupiter’s participation crosses into Saturn, where expansion meets limit and becomes lawful freedom.',
    the_world: 'Creation: Saturnian structure crosses into Uranus, where completed form becomes the condition for breakthrough and new pattern.',
    the_hanged_man: 'Leisure: Uranian creation crosses into Neptune, where breakthrough releases into suspension, dream, spaciousness, and rest.'
  };
  function uhnFormulaHtml(card) {
    const formula = UHN_FORMULAS[card?.card_id];
    return formula ? `<section class="uhn-formula-card"><h3>Universal Human Needs</h3><p><code>${escapeHtml(formula)}</code></p></section>` : '';
  }
  function uhnPanelHtml(card) {
    if (!UHN_ORDER.has(card?.card_id)) return '';
    const formula = UHN_FORMULAS[card.card_id] || '';
    const interpretation = UHN_INTERPRETATIONS[card.card_id] || lockedRelphiInterpretation(card) || '';
    const rel = card.relphi?.universal_human_needs || {};
    const interval = rel.interval ? `<p class="uhn-interval"><strong>Planetary interval harmonic:</strong> ${escapeHtml(rel.interval)}</p>` : '';
    const need = rel.need ? `<p class="uhn-need"><strong>Need:</strong> ${escapeHtml(rel.need)}</p>` : '';
    const position = UHN_ORDER.get(card.card_id);
    const positionText = position === 0 ? 'origin a₀' : `interval a${toSubscript(position)}`;
    return `<section class="uhn-panel system-card"><h3>Relphi-derived interpretation</h3><p>${escapeHtml(interpretation)}</p><p class="generated-note">Universal Human Needs · Planetary interval harmonics · ${escapeHtml(positionText)} of a${toSubscript(UHN_CARD_IDS.length - 1)}</p>${need}${interval}${formula ? `<p class="uhn-formula-line"><strong>Ingredients:</strong> <code>${escapeHtml(formula)}</code></p>` : ''}</section>`;
  }

  const state = {
    mode: 'idle', query: '', selected: null, currentSpread: [], currentSpreadKey: '', chart: {}, currentSky: {}, lastDateField: null, activeCelticCard: null, revealGuideActive: false, revealGuideEnabled: true, crossedLayout: true, positionStickers: true, transitFilters: { aspect:['conjunction','opposition','trine','square','sextile'], house:'all', sign:'all', placement:'all', orb:'3' }, cardFilters: [], shortList: [], shortListUndo: [], shortListRedo: [], shortListSelection: [], shortListSelectMode: false, shortListPositionLabels: [], shortListPositionCardIds: [], rowDrawScope: 'full', rowAllowRepeats: false, rowAllowReversals: true, rowDrawDeck: [], rowDrawDeckSignature: '', rowCardReversals: {}, rowSenseSelections: {}, rowSenseNotes: {}, shortListName: '', shortListNotes: '', rowZoom: 1, rowPanX: 0, rowPanY: 0, rowSnapEnabled: true, rowSnapGrid: 'one-eighth', rowRotationSnapEnabled: true, rowRotationSnapDegrees: 15, rowShuffled: false, rowShuffleCount: 0, resultScale: 'medium', resultZoom: 1, resultLayout: 'auto', resultGlyphsVisible: false, rowEnvelopeLayout: {}, rowCardTransforms: {}, rowTransformTarget: 0, rowEnvelopeColor: '#f3f0ea', rowEnvelopeArt: {}, rowTableColor: '#fffaf0', rowTableImage: '', rowCustomArtTarget: '', customCardArt: {}, rowActiveLayout: null, rowPositionMeta: [], rowLayoutDesignMode: false, rowLayoutLocked: false, rowCenterOpen: false, chartName: '', chartNotes: '', currentSkyName: '', currentSkyNotes: '', skyChartMode: 'single', skyBuilderUiMode: 'wizard', skyCreatorTarget: 'chart', skyCreatorDrawerAutoClosed: false, skyEntrySource: { chart:'', currentSky:'' }, skyEntryMethod: { chart:'', currentSky:'' }, skyEntryPendingSource: { chart:'', currentSky:'' }, skyLibrarySelection: { chart:'', currentSky:'' }, relationshipFilterOpenMenu:'', cardRowBoardOpen: true, cardRowSettingsOpen: false
  };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function foldText(value) { return String(value || '').trim().toLowerCase(); }
  function slug(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function toSubscript(value) { return String(value).replace(/[0-9]/g, ch => '₀₁₂₃₄₅₆₇₈₉'[Number(ch)] || ch); }
  const LOCKED_INTERPRETATION_DATA = window.RELPHI_LOCKED_INTERPRETATIONS || { ingredient_definitions: {}, cards: [] };
  const LOCKED_INGREDIENTS = LOCKED_INTERPRETATION_DATA.ingredient_definitions || {};
  const LOCKED_CARD_INDEX = (() => {
    const index = new Map();
    const add = (key, value) => {
      const normalized = normalizeSearch(String(key || ''));
      if (normalized && !index.has(normalized)) index.set(normalized, value);
    };
    (LOCKED_INTERPRETATION_DATA.cards || []).forEach(item => {
      add(item.card_id, item);
      add(item.name, item);
      String(item.name || '').split('/').forEach(part => add(part.trim(), item));
      const eq = item.traditional_equivalent || {};
      Object.values(eq).forEach(value => add(value, item));
    });
    return index;
  })();
  function lockedCardData(card) {
    if (!card) return null;
    const candidates = [];
    if (card.card_type === 'Court') {
      const suit = card.suit || (card.thoth_suit === 'Disks' ? 'Pentacles' : card.thoth_suit) || '';
      if (card.rws_rank && suit) candidates.push(`${card.rws_rank} of ${suit}`);
      if (card.systems?.golden_dawn_rws?.display_name) candidates.push(card.systems.golden_dawn_rws.display_name);
      if (card.systems?.thoth?.display_name) candidates.push(card.systems.thoth.display_name);
    }
    candidates.push(
      card.card_id,
      card.name,
      title(card),
      normalizedTitle(card),
      card.systems?.thoth?.display_name,
      card.systems?.golden_dawn_rws?.display_name,
      card.systems?.thoth?.title,
      card.systems?.golden_dawn_rws?.title
    );
    for (const candidate of candidates) {
      const match = LOCKED_CARD_INDEX.get(normalizeSearch(candidate));
      if (match) return match;
    }
    return null;
  }
  function lockedRelphiInterpretation(card) {
    return lockedCardData(card)?.relphi_derived_interpretation || '';
  }
  function ingredientTypeLabel(ref, item, index) {
    const key = String(ref || '').toLowerCase();
    const name = String(item?.name || '').toLowerCase();
    if (/^(ace|two|three|four|five|six|seven|eight|nine|ten|page|knight|queen|king)/.test(key)) return /page|knight|queen|king/.test(key) ? 'Court rank' : 'Number';
    if (/^(fire|water|air|earth)/.test(key)) return 'Suit / element';
    if (/^(aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces)$/.test(key)) return 'Sign';
    if (/^(sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto)$/.test(key)) return 'Planet';
    if (key.includes('letter_class') || name.includes('letter class')) return 'Letter class';
    if (/^(aleph|beth|gimel|daleth|heh|vav|zayin|cheth|teth|yod|kaph|lamed|mem|nun|samekh|ayin|peh|tzaddi|qoph|resh|shin|tav)$/.test(key)) return 'Letter';
    return `Ingredient ${index + 1}`;
  }
  function lockedIngredientsHtml(card) {
    const locked = lockedCardData(card);
    if (!locked?.ingredient_refs?.length) return '';
    const items = locked.ingredient_refs.map(ref => ({ ref, item: LOCKED_INGREDIENTS[ref] })).filter(entry => entry.item);
    if (!items.length) return '';
    const baseId = `ingredients-${escapeHtml(card.card_id || 'card')}`;
    const tabs = items.map((entry, index) => `<button class="locked-ingredient-tab ${index === 0 ? 'is-active' : ''}" type="button" data-ingredient-tab="${baseId}-${index}" aria-selected="${index === 0 ? 'true' : 'false'}">${escapeHtml(ingredientTypeLabel(entry.ref, entry.item, index))}</button>`).join('');
    const panels = items.map((entry, index) => { const item = entry.item; return `<article class="locked-ingredient-panel ${index === 0 ? 'is-active' : ''}" data-ingredient-panel="${baseId}-${index}" ${index === 0 ? '' : 'hidden'}><h4>${escapeHtml(item.name)}</h4><dl><dt>Operation</dt><dd>${escapeHtml(item.operation)}</dd><dt>Question</dt><dd>${escapeHtml(item.question)}</dd><dt>Contribution</dt><dd>${escapeHtml(item.contribution)}</dd></dl></article>`; }).join('');
    return `<section class="locked-ingredients locked-ingredients--tabs"><h3>Ingredients</h3><div class="locked-ingredient-tabs" role="tablist">${tabs}</div><div class="locked-ingredient-panels">${panels}</div></section>`;
  }
  function lockedTraditionalTitleHtml(locked) {
    if (!locked) return '';
    const parts = [];
    if (locked.traditional_title) parts.push(`<p><strong>Traditional title:</strong> ${escapeHtml(locked.traditional_title)}</p>`);
    const eq = locked.traditional_equivalent || {};
    Object.entries(eq).forEach(([key, value]) => parts.push(`<p><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</p>`));
    return parts.length ? `<div class="locked-traditional-meta">${parts.join('')}</div>` : '';
  }
  function lockedInterpretationComparisonHtml(card) {
    const locked = lockedCardData(card);
    if (!locked) return '';
    const common = locked.common_traditional_interpretation || {};
    const traditionalMeta = lockedTraditionalTitleHtml(locked);
    const commonHtml = common.upright || common.reversed ? `<div class="locked-common-lines"><p><strong>Upright:</strong> ${escapeHtml(common.upright || '')}</p><p><strong>Reversed:</strong> ${escapeHtml(common.reversed || '')}</p></div>` : '<p>No common/traditional value has been added for this card yet.</p>';
    return `<section class="locked-interpretation-comparison locked-interpretation-comparison--traditional"><article class="system-card locked-common-traditional"><h3>Common / Traditional interpretation</h3>${traditionalMeta}${commonHtml}</article></section>`;
  }
  function localTimestampSlug(date = new Date()) {
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
  }
  function timestampFormatOptions(timeZone = '') {
    const options = {
      year:'numeric', month:'short', day:'numeric',
      hour:'numeric', minute:'2-digit', second:'2-digit',
      timeZoneName:'short'
    };
    if (String(timeZone || '').trim()) options.timeZone = String(timeZone).trim();
    return options;
  }
  function localTimestampLabel(date = new Date()) {
    try { return new Intl.DateTimeFormat(undefined, timestampFormatOptions()).format(date); }
    catch (error) { return date.toLocaleString(); }
  }
  function timestampLabelInZone(date = new Date(), timeZone = '') {
    const zone = String(timeZone || '').trim();
    if (!zone) return localTimestampLabel(date);
    try { return new Intl.DateTimeFormat(undefined, timestampFormatOptions(zone)).format(date); }
    catch (error) { return localTimestampLabel(date); }
  }
  function updateClearKeywordButtons() {
    const hasKeywords = !!String(state.query || $('oracleCommand')?.value || '').trim();
    ['clearSearchKeywords','clearSearchKeywordsCollapsed'].forEach(id => { const btn = $(id); if (btn) btn.disabled = !hasKeywords; });
  }
  function collapseCardRow() {
    const details = document.querySelector('#shortListPanel details.short-list-drawer');
    if (details) details.open = false;
  }
  function expandCardRow() {
    const details = document.querySelector('#shortListPanel details.short-list-drawer');
    if (details) details.open = true;
  }
  const CUSTOM_CARD_ART_KEY = 'relphiCustomCardArtV1';
  function readCustomCardArtStore() {
    try { const parsed = JSON.parse(localStorage.getItem(CUSTOM_CARD_ART_KEY) || '{}'); return parsed && typeof parsed === 'object' ? parsed : {}; }
    catch (error) { return {}; }
  }
  function writeCustomCardArtStore(store) {
    try { localStorage.setItem(CUSTOM_CARD_ART_KEY, JSON.stringify(store || {})); } catch (error) {}
  }
  let customCardArtStore = readCustomCardArtStore();
  state.customCardArt = customCardArtStore;
  function customCardArtFor(card) { return ''; }
  const RWS_ART_VERSION = 'border-preserving-crop-352';
  function rwsImagePath(card) { return card?.card_id ? `assets/tarot/rws/${card.card_id}.webp?v=${RWS_ART_VERSION}` : ''; }
  function rwsExportImagePath(card) { return rwsImagePath(card); }
  function rwsImageAlt(card) { return `${title(card)} card art`; }
  const RWS_RESULT_TOP_CROP = {
    'ace_of_cups': 3.01, 'ace_of_pentacles': 3.12, 'ace_of_wands': 1.61, 'death': 2.66,
    'eight_of_cups': 4.07, 'eight_of_pentacles': 2.1, 'eight_of_swords': 1.86, 'eight_of_wands': 1.86,
    'five_of_cups': 1.99, 'five_of_pentacles': 1.39, 'five_of_swords': 1.85, 'five_of_wands': 1.73,
    'four_of_cups': 2.33, 'four_of_pentacles': 2.31, 'four_of_swords': 2.21, 'judgement': 1.86,
    'justice': 2.21, 'knight_of_cups': 1.99, 'knight_of_disks': 3.46, 'knight_of_swords': 3.03,
    'knight_of_wands': 2.18, 'nine_of_cups': 3.14, 'nine_of_pentacles': 4.27, 'nine_of_swords': 1.63,
    'nine_of_wands': 1.63, 'prince_of_cups': 2.54, 'prince_of_disks': 1.74, 'prince_of_swords': 2.2,
    'prince_of_wands': 2.32, 'princess_of_cups': 2.32, 'princess_of_disks': 1.85, 'princess_of_swords': 1.5,
    'princess_of_wands': 2.54, 'queen_of_cups': 2.44, 'queen_of_disks': 2.31, 'queen_of_swords': 2.18,
    'queen_of_wands': 2.33, 'seven_of_cups': 1.62, 'seven_of_pentacles': 2.44, 'seven_of_swords': 2.56,
    'seven_of_wands': 2.31, 'six_of_cups': 1.39, 'six_of_pentacles': 2.89, 'six_of_swords': 4.17,
    'six_of_wands': 3.03, 'strength': 1.97, 'temperance': 2.42, 'ten_of_cups': 2.54,
    'ten_of_pentacles': 1.86, 'ten_of_swords': 1.85, 'ten_of_wands': 2.64, 'the_chariot': 2.66,
    'the_devil': 1.82, 'the_emperor': 3.26, 'the_empress': 2.57, 'the_fool': 2.74,
    'the_hanged_man': 2.62, 'the_hermit': 2.34, 'the_hierophant': 2.9, 'the_high_priestess': 2.56,
    'the_lovers': 1.52, 'the_moon': 1.97, 'the_star': 1.51, 'the_sun': 2.56,
    'the_tower': 2.54, 'the_world': 2.09, 'three_of_cups': 1.51, 'three_of_pentacles': 3.35,
    'three_of_swords': 2.3, 'two_of_cups': 2.08, 'two_of_pentacles': 2.78, 'two_of_swords': 3.04,
    'two_of_wands': 2.79, 'wheel_of_fortune': 2.41
  };
  function combineParallelTitles(left, right) {
    if (!left || !right || left === right) return left || right || '';
    const ofMatchLeft = left.match(/^(.+?) of (.+)$/);
    const ofMatchRight = right.match(/^(.+?) of (.+)$/);
    if (ofMatchLeft && ofMatchRight && ofMatchLeft[2] === ofMatchRight[2]) return `${ofMatchLeft[1]}/${ofMatchRight[1]} of ${ofMatchLeft[2]}`;
    if (ofMatchLeft && ofMatchRight && ofMatchLeft[1] === ofMatchRight[1]) return `${ofMatchLeft[1]} of ${ofMatchLeft[2]}/${ofMatchRight[2]}`;
    if (left === 'The High Priestess' && right === 'The Priestess') return 'The (High) Priestess';
    if (left === 'The Priestess' && right === 'The High Priestess') return 'The (High) Priestess';
    if (left.startsWith('The ') && right.startsWith('The ')) return `The ${left.slice(4)}/${right.slice(4)}`;
    if (left === 'Wheel of Fortune' && right === 'Fortune') return '(Wheel of) Fortune';
    if (left === 'Fortune' && right === 'Wheel of Fortune') return '(Wheel of) Fortune';
    if (right.startsWith('The ') && left && !left.startsWith('The ')) return `${left}/${right}`;
    return `${left}/${right}`;
  }
  function title(card) {
    if (!card) return '';
    const rwsName = card.systems?.golden_dawn_rws?.display_name || card.name || '';
    const thothName = card.systems?.thoth?.display_name || card.name || '';
    return combineParallelTitles(rwsName || card.name, thothName || card.name);
  }
  function rwsTitle(card) {
    if (!card) return '';
    return card.systems?.golden_dawn_rws?.display_name || card.name || '';
  }
  function chartResultTitle(card) {
    // Keep the site's parallel RWS + Thoth naming convention in chart results.
    // The art may be RWS, but the symbolic label stays combined.
    return title(card);
  }
  function titleWithBreaksHtml(card) { return escapeHtml(title(card)).replace(/\//g, '/<wbr>'); }

  const CARD_SENSE_DATA = window.RELPHI_CARD_SENSES || { cards: [] };
  const CARD_SENSE_ID_ALIASES = {
    princess_of_wands:'page_of_wands',
    knight_of_wands:'king_of_wands',
    princess_of_cups:'page_of_cups',
    knight_of_cups:'king_of_cups',
    princess_of_swords:'page_of_swords',
    knight_of_swords:'king_of_swords',
    princess_of_disks:'page_of_pentacles',
    queen_of_disks:'queen_of_pentacles',
    knight_of_disks:'king_of_pentacles',
    ace_of_disks:'ace_of_pentacles',
    two_of_disks:'two_of_pentacles',
    three_of_disks:'three_of_pentacles',
    four_of_disks:'four_of_pentacles',
    five_of_disks:'five_of_pentacles',
    six_of_disks:'six_of_pentacles',
    seven_of_disks:'seven_of_pentacles',
    eight_of_disks:'eight_of_pentacles',
    nine_of_disks:'nine_of_pentacles',
    ten_of_disks:'ten_of_pentacles'
  };
  const CARD_SENSE_INDEX = (() => {
    const index = new Map();
    (CARD_SENSE_DATA.cards || []).forEach(item => {
      if (item?.card_id) index.set(String(item.card_id), item);
    });
    Object.entries(CARD_SENSE_ID_ALIASES).forEach(([alias, canonical]) => {
      if (index.has(canonical)) index.set(alias, index.get(canonical));
    });
    return index;
  })();
  function cardSenseData(card) {
    const id = String(card?.card_id || '');
    if (!id) return null;
    // Direct card sense entries win. This keeps the Air-rank courts
    // (RWS Knights / Thoth Princes) separate from the Fire-rank
    // courts (RWS Kings / Thoth Knights).
    return CARD_SENSE_INDEX.get(id) || CARD_SENSE_INDEX.get(CARD_SENSE_ID_ALIASES[id]) || null;
  }
  function cardSenseChoices(card) {
    const data = cardSenseData(card);
    const senses = Array.isArray(data?.senses) ? data.senses.filter(sense => sense && (sense.label || sense.panel_phrase || sense.key)) : [];
    const seen = new Set();
    return senses.filter(sense => {
      const key = String(sense.key || sense.label || sense.panel_phrase || '').trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  function rowSenseKey(index, cardId) {
    return `${Math.max(0, Number(index) || 0)}:${String(cardId || '')}`;
  }
  function rowSelectedSenseKey(index, card) {
    const data = cardSenseData(card);
    if (!data) return '';
    return state.rowSenseSelections?.[rowSenseKey(index, card.card_id)] || '';
  }
  function rowSenseValueForStorage(index, card) {
    return String(state.rowSenseSelections?.[rowSenseKey(index, card?.card_id)] || '').trim();
  }
  function findSenseByInputValue(card, value) {
    const data = cardSenseData(card);
    const input = String(value || '').trim();
    if (!data || !input) return null;
    const fold = text => String(text || '').trim().toLowerCase();
    return cardSenseChoices(card).find(sense => [sense.key, sense.label, sense.panel_phrase, sense.relationship_phrase].some(part => fold(part) === fold(input))) || null;
  }
  function rowSelectedSense(index, card) {
    const data = cardSenseData(card);
    if (!data) return null;
    const stored = rowSenseValueForStorage(index, card);
    const key = rowSelectedSenseKey(index, card);
    const choices = cardSenseChoices(card);
    const sense = choices.find(item => item.key === key) || findSenseByInputValue(card, stored);
    if (sense) return sense;
    if (stored) return { key:stored, label:stored, panel_phrase:stored, relationship_phrase:stored, custom:true };
    return null;
  }
  function rowSenseNote(index, card) {
    return String(state.rowSenseNotes?.[rowSenseKey(index, card?.card_id)] || '').slice(0, 240);
  }
  function rowSenseInputValue(index, card) {
    const stored = rowSenseValueForStorage(index, card);
    const data = cardSenseData(card);
    const storedSense = findSenseByInputValue(card, stored) || cardSenseChoices(card).find(sense => sense.key === stored);
    if (stored && !storedSense) return stored;
    if (storedSense) return storedSense.label || storedSense.panel_phrase || stored;
    return stored || '';
  }
  function storeRowSenseInput(index, cardId, value) {
    const card = cardById(cardId) || (state.shortList?.[index] ? cardById(state.shortList[index]) : null);
    const data = cardSenseData(card);
    const raw = String(value || '').trim().slice(0, 160);
    state.rowSenseSelections ||= {};
    const key = rowSenseKey(index, cardId || card?.card_id || '');
    if (!raw) {
      delete state.rowSenseSelections[key];
      return;
    }
    const sense = findSenseByInputValue(card, raw) || cardSenseChoices(card).find(item => item.key === raw);
    state.rowSenseSelections[key] = sense?.key || raw;
  }
  function currentStickerPresetByLabels() {
    const labels = (state.shortListPositionLabels || []).map(label => String(label || '').trim().toLowerCase());
    if (!labels.length) return null;
    return STICKER_PRESETS.find(preset => {
      const presetLabels = (preset.labels || []).map(label => String(label || '').trim().toLowerCase());
      return presetLabels.length === labels.length && presetLabels.every((label, index) => label === labels[index]);
    }) || null;
  }
  function rowSenseDomain() {
    const preset = currentStickerPresetByLabels();
    return preset?.group === 'Relationship' ? 'relationship' : 'general';
  }
  function rowSensePhrase(index, card) {
    const sense = rowSelectedSense(index, card);
    if (!sense) return '';
    if (rowSenseDomain() === 'relationship' && sense.relationship_phrase) return sense.relationship_phrase;
    return sense.panel_phrase || sense.label || '';
  }
  function rowSenseSummary(index, card) {
    const sense = rowSelectedSense(index, card);
    const phrase = rowSensePhrase(index, card);
    const note = rowSenseNote(index, card);
    const pieces = [];
    const fold = value => String(value || '').trim().toLowerCase();
    if (sense?.label) pieces.push(sense.label);
    if (phrase && fold(phrase) !== fold(sense?.label)) pieces.push(phrase);
    if (note) pieces.push(`Note: ${note}`);
    return pieces.join(' — ');
  }
  function rowCardInterpretation(card, index = 0) {
    return layerInterpretationForOrientation(card, rowCardIsReversed(index));
  }
  function cardSensePanelHtml(card, index) {
    const data = cardSenseData(card);
    const choices = cardSenseChoices(card);
    if (!data || choices.length < 2) return '';
    const inputValue = rowSenseInputValue(index, card);
    const optionsId = `card-row-sense-options-${index}-${String(card.card_id || '').replace(/[^a-z0-9_-]/gi, '-')}`;
    const options = choices.map(sense => `<option value="${escapeHtml(sense.label || sense.panel_phrase || sense.key)}"></option>`).join('');
    const prompt = data.panel_prompt || 'Select a sense';
    const domainClass = rowSenseDomain() === 'relationship' ? ' is-relationship-sense' : '';
    return `<div class="card-row-sense-panel${domainClass}" data-row-sense-panel="${index}" aria-label="${escapeHtml(prompt)} for ${escapeHtml(title(card))}"><label><span>${escapeHtml(prompt)}</span><input class="card-row-sense-input" type="text" list="${escapeHtml(optionsId)}" data-row-sense-input="${index}" data-row-sense-card-id="${escapeHtml(card.card_id)}" value="${escapeHtml(inputValue)}" placeholder="Choose or type…" autocomplete="off" aria-label="${escapeHtml(prompt)} for ${escapeHtml(title(card))}"><datalist id="${escapeHtml(optionsId)}">${options}</datalist></label></div>`;
  }
  function thothTitle(card) { return card?.systems?.thoth?.display_name || card?.name || ''; }
  function cardById(id) { return cards.find(card => card.card_id === id) || null; }
  function cardByThothDisplay(name) { return cards.find(card => card.systems?.thoth?.display_name === name || card.name === name) || null; }
  function cardBySignMajor(sign) { return cards.find(card => card.card_type === 'Major' && card.astrology?.sign === sign) || null; }
  function cardByPlanetMajor(planet) {
    const target = String(planet || '').trim();
    if (!target) return null;
    const modernCardMatches = {
      Uranus: 'the_fool',
      Neptune: 'the_hanged_man',
      Pluto: 'judgement'
    };
    if (modernCardMatches[target]) return cardById(modernCardMatches[target]);
    return cards.find(card => {
      if (card.card_type !== 'Major') return false;
      const value = String(card.astrology?.planet || '').trim();
      if (value === target) return true;
      return value.split('/').map(part => part.trim()).includes(target);
    }) || null;
  }

  const ROMAN_TO_NUMBER = { I:1, II:2, III:3, IV:4, V:5, VI:6, VII:7, VIII:8, IX:9, X:10, XI:11, XII:12, XIII:13, XIV:14, XV:15, XVI:16, XVII:17, XVIII:18, XIX:19, XX:20, XXI:21 };
  const NUMBER_TO_ROMAN = Object.fromEntries(Object.entries(ROMAN_TO_NUMBER).map(([k,v]) => [v,k]));
  const RANK_NUMBERS = { Ace:1, Two:2, Three:3, Four:4, Five:5, Six:6, Seven:7, Eight:8, Nine:9, Ten:10 };
  const COURT_RANK_CODES = { Page:'C1', Princess:'C1', Knight:'C2', Prince:'C2', Queen:'C3', King:'C4' };
  const COURT_CODE_RANKS = { C1:['Page','Princess'], C2:['Knight','Prince'], C3:['Queen'], C4:['King'] };
  function titleNoThe(value) { return String(value || '').replace(/^The\s+/,''); }
  function normalizedTitle(card) { return title(card); }
  function rankNumber(card) {
    if (!card) return null;
    if (card.card_type === 'Major') {
      const n = Number(card.systems?.thoth?.number ?? card.systems?.golden_dawn_rws?.number);
      return Number.isFinite(n) ? n : null;
    }
    if (card.card_type === 'Ace') return 1;
    if (card.card_type === 'Pip') return RANK_NUMBERS[card.rank] || RANK_NUMBERS[card.rws_rank] || null;
    return null;
  }
  function rankRoman(card) { const n = rankNumber(card); return n != null ? NUMBER_TO_ROMAN[n] || String(n) : ''; }
  function courtRankCode(card) {
    if (card?.card_type !== 'Court') return '';
    const thoth = String(card.rank || '').trim();
    const rws = String(card.rws_rank || '').trim();
    return COURT_RANK_CODES[rws] || COURT_RANK_CODES[thoth] || '';
  }
  function glyphSvg(label, inner, cls='') {
    return `<svg class="glyph-svg ${escapeHtml(cls)}" viewBox="0 0 100 100" aria-label="${escapeHtml(label)}" role="img" focusable="false">${inner}</svg>`;
  }
  function pentacleSvg(label='Pentacle') {
    return glyphSvg(label, '<circle cx="50" cy="50" r="42"/><path d="M50 8 L74 82 L12 36 L88 36 L26 82 Z"/>', 'pentacle-svg');
  }
  function wandSvg(label='Wands') {
    return glyphSvg(label, '<path d="M50 12 L50 88"/><path d="M50 14 C39 24 37 36 48 45 C61 34 63 23 50 14 Z"/><path d="M50 50 C62 54 68 65 63 78 C51 73 46 63 50 50 Z"/>', 'wand-svg');
  }
  function cupSvg(label='Cups') {
    return glyphSvg(label, '<path d="M26 22 H74 C72 49 62 61 50 61 C38 61 28 49 26 22 Z"/><path d="M50 61 V78"/><path d="M33 84 H67"/><path d="M28 28 C18 34 19 50 31 54"/><path d="M72 28 C82 34 81 50 69 54"/>', 'cup-svg');
  }
  function swordSvg(label='Swords') {
    return glyphSvg(label, '<path d="M50 8 L58 60 L50 76 L42 60 Z"/><path d="M30 62 H70"/><path d="M50 62 V91"/><path d="M43 91 H57"/>', 'sword-svg');
  }
  function suitDisplay(card) { return card?.suit === 'Pentacles' ? 'Pentacles/Disks' : (card?.suit || ''); }
  function suitGlyph(card) {
    const suit = card?.suit || '';
    if (suit === 'Wands') return wandSvg('Wands');
    if (suit === 'Cups') return cupSvg('Cups');
    if (suit === 'Swords') return swordSvg('Swords');
    if (suit === 'Pentacles') return pentacleSvg('Pentacles/Disks');
    return '';
  }
  function cardGlyphItems(card) {
    const a = card?.astrology || {};
    const items = [];
    const courtCode = courtRankCode(card);
    const roman = rankRoman(card);
    if (roman) {
      const rk = rankKey(card);
      const isPagePrincess = rk === 'Page' || rk === 'Princess';
      const glyph = courtCode || roman;
      const rankLabel = courtCode ? `${rk} court rank ${courtCode}` : rk === 'Ace' ? 'Aces' : rk === 'Major' ? `Major ${roman}` : `${rk}s`;
      items.push({ glyph, filter: card?.card_type === 'Major' ? `major:${roman}` : `rank:${rk}`, label: rankLabel, className: courtCode ? 'or-chip--court-rank' : (card?.card_type === 'Major' ? 'or-chip--number' : 'or-chip--rank') });
    }
    if (card?.suit) items.push({ glyph: suitGlyph(card), filter: suitDisplay(card), label: suitDisplay(card), className: 'or-chip--suit' });
    if (a.planet) {
      String(a.planet)
        .split(/[,/]/)
        .map(x => x.trim())
        .filter(Boolean)
        .forEach(body => {
          if (BODY_GLYPHS[body]) items.push({ glyph: BODY_GLYPHS[body], filter: body, label: body, className: 'or-chip--planet' });
        });
    }
    if (a.sign) signList(a.sign).slice(0,2).forEach(sign => items.push({ glyph: SIGN_GLYPHS[sign] || sign, filter: sign, label: sign, className: 'or-chip--sign' }));
    const derivedElementForGlyphs = card?.element || signList(a.sign).map(sign => SIGN_DATA[sign]?.element).find(Boolean) || '';
    if (derivedElementForGlyphs) items.push({ glyph: ELEMENT_GLYPHS[derivedElementForGlyphs] || derivedElementForGlyphs, filter: derivedElementForGlyphs, label: derivedElementForGlyphs, className: 'or-chip--element' });
    if (card?.hebrew?.letter) {
      const letterName = card.hebrew.letter_name || card.hebrew.letter;
      const hebrewGlyph = HEBREW_LETTER_GLYPHS[letterName] || HEBREW_LETTER_GLYPHS[card.hebrew.letter] || card.hebrew.letter;
      items.push({ glyph: hebrewGlyph, filter: letterName, label: `Hebrew letter ${letterName}`, className: 'or-chip--hebrew' });
    }
    if (UHN_ORDER.has(card?.card_id)) {
      const needNumber = UHN_ORDER.get(card.card_id) + 1;
      items.push({ glyph: 'UHN', filter: 'Universal Human Needs', label: `Universal Human Needs ${needNumber}`, className: 'or-chip--uhn' });
    }
    return items.filter(item => item.glyph && item.filter);
  }
  function cardGlyphParts(card) {
    return cardGlyphItems(card).flatMap(item => [item.glyph, item.filter, item.label]).filter(Boolean);
  }
  function cardEssenceLabel(card) {
    if (!card) return '';
    const a = card.astrology || {};
    const element = card.element || signList(a.sign).map(sign => SIGN_DATA[sign]?.element).find(Boolean) || '';
    const elementGlyph = element ? (ELEMENT_GLYPHS[element] || element) : '';
    if (card.card_type === 'Ace') return elementGlyph ? `Root ${elementGlyph}` : 'Root';
    if (card.card_type === 'Pip') {
      const planet = String(a.decan_ruler || a.planet || '').split(/[,/]/).map(x => x.trim()).find(Boolean) || '';
      const sign = signList(a.sign)[0] || '';
      const planetGlyph = planet ? (BODY_GLYPHS[planet] || planet) : '';
      const signGlyph = sign ? (SIGN_GLYPHS[sign] || sign) : '';
      return [planetGlyph, signGlyph].filter(Boolean).join(' in ');
    }
    if (card.card_type === 'Court') {
      const rank = String(card.rank || card.rws_rank || '').trim();
      const rankElement = ({ Page:'Earth', Princess:'Earth', Knight:'Air', Prince:'Air', Queen:'Water', King:'Fire' })[rank] || '';
      const rankGlyph = rankElement ? (ELEMENT_GLYPHS[rankElement] || rankElement) : rank;
      return [rankGlyph, elementGlyph].filter(Boolean).join(' of ');
    }
    if (card.card_type === 'Major') {
      const letterName = card.hebrew?.letter_name || card.hebrew?.letter || '';
      const letterGlyph = HEBREW_LETTER_GLYPHS[letterName] || '';
      const letterImage = String(card.hebrew?.image || '').trim();
      const planet = String(a.planet || '').split(/[,/]/).map(x => x.trim()).find(Boolean) || '';
      const sign = signList(a.sign)[0] || '';
      const bodyGlyph = planet ? (BODY_GLYPHS[planet] || planet) : (sign ? (SIGN_GLYPHS[sign] || sign) : elementGlyph);
      return [letterGlyph || letterName, letterImage, bodyGlyph].filter(Boolean).join('\n');
      const bodyText = [letterImage, bodyGlyph].filter(Boolean).join(' · ');
      return [letterGlyph || letterName, bodyText].filter(Boolean).join(' · ');
    }
    return elementGlyph || title(card);
  }
  function cardSearchTokens(card) {
    const n = rankNumber(card), roman = rankRoman(card);
    const rwsName = card?.systems?.golden_dawn_rws?.display_name || card?.name || '';
    const thothName = card?.systems?.thoth?.display_name || card?.name || '';
    const aliases = [normalizedTitle(card), rwsName, thothName, titleNoThe(rwsName), titleNoThe(thothName), card?.name, card?.systems?.thoth?.title, card?.systems?.golden_dawn_rws?.title];
    if (n != null) aliases.push(String(n), roman, roman?.toLowerCase());
    if (card?.rank) aliases.push(card.rank); const courtCode = courtRankCode(card); if (courtCode) aliases.push(courtCode, courtCode.toLowerCase());
    const suitLetter = { Wands:'W', Cups:'C', Swords:'S', Pentacles:'P' }[card?.suit] || '';
    const suitAltLetter = card?.suit === 'Pentacles' ? 'D' : '';
    const rn = rankNumber(card);
    const rankShort = card?.card_type === 'Ace' ? 'A' : (card?.card_type === 'Pip' ? String(rn) : courtCode);
    if (rankShort && suitLetter) aliases.push(rankShort + suitLetter, suitLetter + rankShort, (rankShort + suitLetter).toLowerCase(), (suitLetter + rankShort).toLowerCase());
    if (rankShort && suitAltLetter) aliases.push(rankShort + suitAltLetter, suitAltLetter + rankShort, (rankShort + suitAltLetter).toLowerCase(), (suitAltLetter + rankShort).toLowerCase());
    if (card?.card_type === 'Ace') aliases.push('one', '1', 'I');
    if (card?.suit === 'Pentacles') aliases.push('Disks', 'Pentacles/Disks');
    return aliases.filter(Boolean).join(' ');
  }
  function cardInfoLine(card) {
    const a = card?.astrology || {};
    return [card?.card_type, suitDisplay(card), card?.element, a.planet, a.sign, a.decan, card?.systems?.thoth?.title].filter(Boolean).join(' · ');
  }
  function renderGlyphChips(card) {
    return cardGlyphItems(card).map(item => `<button class="or-chip relphi-filter-chip ${escapeHtml(item.className || '')}" type="button" data-filter="${escapeHtml(item.filter)}" title="${escapeHtml(item.label)}" aria-label="Filter by ${escapeHtml(item.label)}">${item.glyph}</button>`).join('');
  }
  function flexibleTitlePattern(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escaped
      .replace(/\\\s\+/g, '\\s+')
      .replace(/\\ \/\\ /g, '\\s*\\/\\s*')
      .replace(/\\\//g, '\\s*\\/\\s*')
      .replace(/\s+/g, '\\s+');
  }
  function cardTitleVariantsForStripping(card, layerTitle='') {
    const raw = [
      layerTitle,
      normalizedTitle(card),
      title(card),
      card?.name,
      card?.systems?.golden_dawn_rws?.display_name,
      card?.systems?.golden_dawn_rws?.title,
      card?.systems?.thoth?.display_name,
      card?.systems?.thoth?.title
    ].filter(Boolean).map(v => String(v).trim()).filter(Boolean);
    const expanded = [];
    raw.forEach(v => {
      expanded.push(v);
      if (v === 'The (High) Priestess') expanded.push('The High Priestess', 'The Priestess', 'High Priestess', 'Priestess');
      const paren = v.match(/^(.+?)\s*\(([^)]+)\)\s*(.+)$/);
      if (paren) {
        expanded.push(`${paren[1].trim()} ${paren[3].trim()}`.replace(/\s+/g, ' '));
        expanded.push(`${paren[1].trim()} ${paren[2].trim()} ${paren[3].trim()}`.replace(/\s+/g, ' '));
      }
      if (v.includes('/')) v.split('/').map(x => x.trim()).filter(Boolean).forEach(x => expanded.push(x));
    });
    return Array.from(new Set(expanded)).sort((a,b) => b.length - a.length);
  }
  function stripLeadingCardTitle(text, card, layerTitle='') {
    let value = String(text || '').trim();
    if (!value || !card) return value;
    const variants = cardTitleVariantsForStripping(card, layerTitle);
    for (const variant of variants) {
      const pattern = flexibleTitlePattern(variant);
      if (!pattern) continue;
      const re = new RegExp('^' + pattern + '\\s*(?:[–—-]|:|\\.)?\\s*(?:(?:is|are)\\s+)?', 'i');
      const next = value.replace(re, '').trim();
      if (next && next !== value) {
        value = sentenceCaseFragment(next);
        break;
      }
    }
    value = value.replace(/^\/\s*[^.?!:;]{1,64}?\s+(?:is|are)\s+/i, '').trim();
    if (value) value = sentenceCaseFragment(value);
    return value;
  }
  function renderCardSurface(card, options={}) {
    const context = options.context || 'browse';
    const glyphTags = context === 'short-list' ? '' : renderGlyphChips(card);
    const inShortList = state.shortList.includes(card.card_id);
    const selected = !!options.selected;
    const detailSelected = !!options.detailSelected;
    const uniqueHitSources = Array.from(new Set((options.hitSources || []).map(item => String(item || '').trim()).filter(Boolean)));
    const hitSourceText = uniqueHitSources.join(' · ');
    const hitLabel = options.hitCount === 1 ? 'placement' : 'placements';
    const badge = options.hitCount ? `<button class="or-hit-badge" type="button" data-placement-toggle aria-label="Show ${escapeHtml(options.hitCount)} chart ${escapeHtml(hitLabel)}" title="${escapeHtml(hitSourceText || `${options.hitCount} chart ${hitLabel}`)}">×${options.hitCount}</button>` : '';
    const addLabel = inShortList ? 'Remove card from Drawing Board' : 'Add card to Drawing Board';
    const add = options.selectable === false ? '' : `<button class="or-card-add or-card-layer-add" type="button" data-shortlist="${escapeHtml(card.card_id)}" aria-pressed="${inShortList?'true':'false'}" aria-label="${addLabel}" title="${addLabel}">${inShortList?'−':'+'}</button>`;
    const layerSources = '';
    const layerTitle = String(options.layerTitle || normalizedTitle(card)).trim();
    const rawLayerText = String(options.layerText || layerInterpretation(card)).trim();
    const layerText = stripLeadingCardTitle(rawLayerText, card, layerTitle);
    const essenceText = cardEssenceLabel(card);
    const essenceClass = card.card_type === 'Major' ? ' or-card-essence--major' : '';
    const dragAttrs = context === 'short-list'
      ? ' draggable="true" data-row-card="' + escapeHtml(card.card_id) + '"'
      : (context === 'browse' ? ' draggable="true" data-drag-card="' + escapeHtml(card.card_id) + '"' : '');
    const positionLabel = String(options.positionLabel || '').trim().slice(0, 96);
    const placementText = String(options.placementText || positionLabel || '').trim();
    const placementGlyph = String(options.placementGlyph || options.positionGlyph || '').trim();
    const placementLines = uniqueHitSources.length ? uniqueHitSources : (placementText ? [placementText] : []);
    const placementHeader = String(options.placementHeader || '').trim() || (options.hitCount ? `${options.hitCount} chart ${hitLabel}` : placementText || 'Placement');
    const positionSticker = positionLabel ? `<span class="or-position-sticker relphi-sticker relphi-sticker--position" title="${escapeHtml(positionLabel)}"><strong>${escapeHtml(positionLabel)}</strong></span>` : '';
    const houseNumberSticker = options.houseNumber ? `<span class="or-house-number-sticker relphi-sticker relphi-sticker--position" title="House ${escapeHtml(String(options.houseNumber))}"><strong>${escapeHtml(String(options.houseNumber))}</strong></span>` : '';
    const inlinePositionSticker = context === 'short-list' ? '' : positionSticker;
    const showPlacementBubble = placementText && !options.hitCount && !['chart-placement','chart-hit','chart-house'].includes(context);
    const placementBubble = showPlacementBubble ? `<button class="or-placement-bubble relphi-filter-chip" type="button" data-placement-toggle aria-label="Show placement ${escapeHtml(placementText)}" title="${escapeHtml(placementText)}">${escapeHtml(placementGlyph || '◎')}</button>` : '';
    const placementBody = placementLines.length
      ? `<ul class="or-placement-list">${placementLines.map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul>`
      : '';
    const placementLayer = placementBody ? `<div class="or-card-layer or-card-layer--placement relphi-info-layer" data-placement-layer hidden><div class="or-layer-head relphi-info-static"><strong>${escapeHtml(placementHeader)}</strong></div><div class="or-layer-scroll relphi-info-scroll">${placementBody}</div></div>` : '';
    const layerTitleHtml = escapeHtml(layerTitle).replace(/\//g, '/<wbr>');
    const resultTopCrop = 0;
    const resultCropStyle = resultTopCrop ? ` style="--rws-result-top-crop:${resultTopCrop.toFixed(2)}%;"` : '';
    return `<article class="or-card tarot-card-surface relphi-surface relphi-surface--card ${context === 'short-list' ? 'short-list-card' : ''} ${selected ? 'is-row-selected' : ''} ${detailSelected ? 'is-detail-selected' : ''}" data-id="${escapeHtml(card.card_id)}" data-tags="${escapeHtml(publicTags(card).join('|'))}"${dragAttrs}${resultCropStyle} tabindex="0">
      <img class="or-card-art relphi-surface-face" src="${escapeHtml(rwsImagePath(card))}" alt="${escapeHtml(rwsImageAlt(card))}" loading="lazy">
      ${inlinePositionSticker}${houseNumberSticker}
      ${glyphTags ? `<div class="or-card-badges relphi-sticker-row">${glyphTags}</div>` : ''}${badge}${placementBubble}
      <div class="or-card-layer relphi-info-layer" data-id="${escapeHtml(card.card_id)}"><div class="or-layer-head relphi-info-static"><span class="or-card-title-banner card-title-link" role="button" tabindex="0" data-card-id="${escapeHtml(card.card_id)}">${layerTitleHtml}</span>${add}</div><div class="or-card-essence${essenceClass}">${escapeHtml(essenceText)}</div><div class="or-layer-scroll relphi-info-scroll"><span>${escapeHtml(nbHyphens(layerText))}</span>${layerSources}</div></div>${placementLayer}
    </article>`;
  }
  function cloneBoardValue(value, fallback = {}) {
    try { return JSON.parse(JSON.stringify(value == null ? fallback : value)); }
    catch (error) { return JSON.parse(JSON.stringify(fallback)); }
  }
  function boardSnapshot() {
    return {
      shortList: (state.shortList || []).slice(),
      shortListPositionLabels: (state.shortListPositionLabels || []).slice(),
      shortListPositionCardIds: (state.shortListPositionCardIds || []).slice(),
      shortListSelection: (state.shortListSelection || []).slice(),
      shortListSelectMode: !!state.shortListSelectMode,
      shortListName: String(state.shortListName || ''),
      shortListNotes: String(state.shortListNotes || ''),
      rowDrawScope: state.rowDrawScope || 'full',
      rowAllowRepeats: !!state.rowAllowRepeats,
      rowAllowReversals: !!state.rowAllowReversals,
      rowDrawDeck: (state.rowDrawDeck || []).slice(),
      rowDrawDeckSignature: String(state.rowDrawDeckSignature || ''),
      rowCardReversals: { ...(state.rowCardReversals || {}) },
      rowSenseSelections: { ...(state.rowSenseSelections || {}) },
      rowSenseNotes: { ...(state.rowSenseNotes || {}) },
      rowZoom: Number(state.rowZoom) || 1,
      rowPanX: Number(state.rowPanX) || 0,
      rowPanY: Number(state.rowPanY) || 0,
      rowSnapEnabled: state.rowSnapEnabled !== false,
      rowSnapGrid: state.rowSnapGrid || 'one-eighth',
      rowRotationSnapEnabled: state.rowRotationSnapEnabled !== false,
      rowRotationSnapDegrees: Number(state.rowRotationSnapDegrees) || 15,
      rowShuffled: !!state.rowShuffled,
      rowShuffleCount: Number(state.rowShuffleCount) || 0,
      resultScale: state.resultScale || 'medium',
      resultZoom: Number(state.resultZoom) || 1,
      resultLayout: state.resultLayout || 'auto',
      resultGlyphsVisible: !!state.resultGlyphsVisible,
      rowEnvelopeLayout: cloneBoardValue(state.rowEnvelopeLayout, {}),
      rowCardTransforms: cloneBoardValue(state.rowCardTransforms, {}),
      rowTransformTarget: Number(state.rowTransformTarget) || 0,
      rowActiveLayout: cloneBoardValue(state.rowActiveLayout, null),
      rowPositionMeta: cloneBoardValue(state.rowPositionMeta, []),
      rowLayoutDesignMode: !!state.rowLayoutDesignMode,
      rowLayoutLocked: !!state.rowLayoutLocked,
      rowEnvelopeColor: String(state.rowEnvelopeColor || '#f3f0ea'),
      rowEnvelopeArt: cloneBoardValue(state.rowEnvelopeArt, {}),
      rowTableColor: String(state.rowTableColor || '#fffaf0'),
      rowTableImage: String(state.rowTableImage || ''),
      rowCustomArtTarget: String(state.rowCustomArtTarget || ''),
      customCardArt: cloneBoardValue(state.customCardArt, {}),
      cardRowBoardOpen: state.cardRowBoardOpen !== false,
      cardRowSettingsOpen: !!state.cardRowSettingsOpen
    };
  }
  function restoreBoardSnapshot(snapshot) {
    if (Array.isArray(snapshot)) {
      state.shortList = snapshot.slice().filter(id => cardById(id));
      state.shortListSelection = state.shortListSelection.filter(id => state.shortList.includes(id));
      setRowCardReversalArray(rowCardReversalArray(state.shortList.length));
      return;
    }
    if (!snapshot || typeof snapshot !== 'object') return;
    const has = key => Object.prototype.hasOwnProperty.call(snapshot, key);
    state.shortList = Array.isArray(snapshot.shortList) ? snapshot.shortList.slice().filter(id => cardById(id)) : [];
    state.shortListPositionLabels = Array.isArray(snapshot.shortListPositionLabels) ? snapshot.shortListPositionLabels.slice() : [];
    state.shortListPositionCardIds = Array.isArray(snapshot.shortListPositionCardIds) ? snapshot.shortListPositionCardIds.slice() : [];
    state.shortListSelection = (Array.isArray(snapshot.shortListSelection) ? snapshot.shortListSelection : []).filter(id => state.shortList.includes(id));
    if (has('shortListSelectMode')) state.shortListSelectMode = !!snapshot.shortListSelectMode;
    if (has('shortListName')) state.shortListName = String(snapshot.shortListName || '').slice(0, 80);
    if (has('shortListNotes')) state.shortListNotes = String(snapshot.shortListNotes || '').slice(0, 4000);
    if (has('rowDrawScope')) state.rowDrawScope = snapshot.rowDrawScope || 'full';
    if (has('rowAllowRepeats')) state.rowAllowRepeats = !!snapshot.rowAllowRepeats;
    if (has('rowAllowReversals')) state.rowAllowReversals = !!snapshot.rowAllowReversals;
    if (has('rowDrawDeck')) state.rowDrawDeck = Array.isArray(snapshot.rowDrawDeck) ? snapshot.rowDrawDeck.slice() : [];
    if (has('rowDrawDeckSignature')) state.rowDrawDeckSignature = String(snapshot.rowDrawDeckSignature || '');
    state.rowCardReversals = { ...(snapshot.rowCardReversals || {}) };
    state.rowEnvelopeLayout = cloneBoardValue(snapshot.rowEnvelopeLayout, {});
    state.rowCardTransforms = cloneBoardValue(snapshot.rowCardTransforms, {});
    state.rowActiveLayout = cloneBoardValue(snapshot.rowActiveLayout, null);
    state.rowPositionMeta = Array.isArray(snapshot.rowPositionMeta) ? cloneBoardValue(snapshot.rowPositionMeta, []) : [];
    state.rowLayoutDesignMode = !!snapshot.rowLayoutDesignMode && !(state.shortList || []).length;
    state.rowLayoutLocked = !!snapshot.rowLayoutLocked || !!(state.shortList || []).length;
    state.rowCenterOpen = false;
    state.rowSenseSelections = { ...(snapshot.rowSenseSelections || {}) };
    state.rowSenseNotes = { ...(snapshot.rowSenseNotes || {}) };
    state.rowTransformTarget = Number(snapshot.rowTransformTarget) || 0;
    if (has('rowZoom')) state.rowZoom = Math.max(.25, Math.min(4, Number(snapshot.rowZoom) || 1));
    if (has('rowPanX')) state.rowPanX = Number(snapshot.rowPanX) || 0;
    if (has('rowPanY')) state.rowPanY = Number(snapshot.rowPanY) || 0;
    if (has('rowSnapEnabled')) state.rowSnapEnabled = snapshot.rowSnapEnabled !== false;
    if (has('rowSnapGrid')) state.rowSnapGrid = snapshot.rowSnapGrid || 'one-eighth';
    if (has('rowRotationSnapEnabled')) state.rowRotationSnapEnabled = snapshot.rowRotationSnapEnabled !== false;
    if (has('rowRotationSnapDegrees')) state.rowRotationSnapDegrees = Number(snapshot.rowRotationSnapDegrees) || 15;
    if (has('rowShuffled')) state.rowShuffled = !!snapshot.rowShuffled;
    if (has('rowShuffleCount')) state.rowShuffleCount = Number(snapshot.rowShuffleCount) || 0;
    if (has('resultScale')) state.resultScale = snapshot.resultScale || 'medium';
    if (has('resultZoom')) state.resultZoom = Number(snapshot.resultZoom) || 1;
    if (has('resultLayout')) state.resultLayout = snapshot.resultLayout || 'auto';
    if (has('resultGlyphsVisible')) state.resultGlyphsVisible = !!snapshot.resultGlyphsVisible;
    if (has('rowEnvelopeColor')) state.rowEnvelopeColor = String(snapshot.rowEnvelopeColor || '#f3f0ea');
    if (has('rowEnvelopeArt')) state.rowEnvelopeArt = cloneBoardValue(snapshot.rowEnvelopeArt, {});
    if (has('rowTableColor')) state.rowTableColor = String(snapshot.rowTableColor || '#fffaf0');
    if (has('rowTableImage')) state.rowTableImage = String(snapshot.rowTableImage || '');
    if (has('rowCustomArtTarget')) state.rowCustomArtTarget = String(snapshot.rowCustomArtTarget || '');
    if (has('customCardArt')) state.customCardArt = cloneBoardValue(snapshot.customCardArt, {});
    if (has('cardRowBoardOpen')) state.cardRowBoardOpen = snapshot.cardRowBoardOpen !== false;
    if (has('cardRowSettingsOpen')) state.cardRowSettingsOpen = !!snapshot.cardRowSettingsOpen;
  }

  const DRAWING_BOARD_STORAGE_KEY = 'relphiDrawingBoardSessionV1';
  let drawingBoardSaveTimer = 0;
  let drawingBoardPersistenceReady = false;
  let drawingBoardRestoring = false;

  function drawingBoardHasContent(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return false;
    return !!(
      (snapshot.shortList || []).length ||
      (snapshot.shortListPositionLabels || []).some(Boolean) ||
      (snapshot.shortListPositionCardIds || []).some(Boolean) ||
      String(snapshot.shortListName || '').trim() ||
      String(snapshot.shortListNotes || '').trim() ||
      Object.keys(snapshot.rowEnvelopeLayout || {}).length ||
      Object.keys(snapshot.rowCardTransforms || {}).length ||
      !!snapshot.rowActiveLayout ||
      Object.keys(snapshot.rowSenseNotes || {}).length ||
      String(snapshot.rowTableImage || '') ||
      Object.keys(snapshot.rowEnvelopeArt || {}).length ||
      Object.keys(snapshot.customCardArt || {}).length
    );
  }
  function storedDrawingBoardSnapshot() {
    try {
      const value = JSON.parse(localStorage.getItem(DRAWING_BOARD_STORAGE_KEY) || 'null');
      return value && typeof value === 'object' ? value : null;
    } catch (error) { return null; }
  }
  function saveDrawingBoardSession() {
    if (!drawingBoardPersistenceReady || drawingBoardRestoring) return false;
    const snapshot = { version:1, savedAt:new Date().toISOString(), ...boardSnapshot() };
    try {
      if (!drawingBoardHasContent(snapshot)) {
        localStorage.removeItem(DRAWING_BOARD_STORAGE_KEY);
        return true;
      }
      localStorage.setItem(DRAWING_BOARD_STORAGE_KEY, JSON.stringify(snapshot));
      return true;
    } catch (error) {
      // Keep the cards, layout, positions, notes, and reversals even when large
      // user-supplied image data exceeds the browser's storage quota.
      const lightweight = {
        ...snapshot,
        rowTableImage:'',
        rowEnvelopeArt:{},
        customCardArt:{},
        largeArtOmitted:true
      };
      try {
        localStorage.setItem(DRAWING_BOARD_STORAGE_KEY, JSON.stringify(lightweight));
        return true;
      } catch (fallbackError) {
        console.warn('Drawing Board could not be saved in this browser.', fallbackError);
        return false;
      }
    }
  }
  function queueDrawingBoardSave() {
    if (!drawingBoardPersistenceReady || drawingBoardRestoring) return;
    clearTimeout(drawingBoardSaveTimer);
    drawingBoardSaveTimer = setTimeout(saveDrawingBoardSession, 120);
  }
  function flushDrawingBoardSave() {
    clearTimeout(drawingBoardSaveTimer);
    saveDrawingBoardSession();
  }
  function openRestoredDrawingBoard() {
    const openButton = document.getElementById('landingOpenBoard');
    if (openButton) openButton.click();
    const panel = document.getElementById('shortListPanel');
    if (panel) panel.hidden = false;
    expandCardRow();
  }
  function restoreDrawingBoardSession() {
    const snapshot = storedDrawingBoardSnapshot();
    drawingBoardRestoring = true;
    if (drawingBoardHasContent(snapshot)) {
      restoreBoardSnapshot(snapshot);
      state.shortListUndo = [];
      state.shortListRedo = [];
      refreshShortListViews();
    }
    drawingBoardRestoring = false;
    drawingBoardPersistenceReady = true;
    if (drawingBoardHasContent(snapshot)) {
      setTimeout(openRestoredDrawingBoard, 0);
      queueDrawingBoardSave();
      return true;
    }
    return false;
  }
  function installDrawingBoardPersistence() {
    const restore = () => setTimeout(restoreDrawingBoardSession, 0);
    if (document.readyState === 'complete') restore();
    else window.addEventListener('load', restore, { once:true });

    const watchBoardEvent = event => {
      if (event.target && event.target.closest && event.target.closest('#shortListPanel')) queueDrawingBoardSave();
    };
    ['input','change','click','pointerup'].forEach(type => document.addEventListener(type, watchBoardEvent, false));
    document.addEventListener('toggle', watchBoardEvent, true);
    window.addEventListener('beforeunload', flushDrawingBoardSave);
    window.addEventListener('pagehide', flushDrawingBoardSave);
    window.addEventListener('pageshow', event => {
      if (!event.persisted) return;
      drawingBoardPersistenceReady = false;
      restoreDrawingBoardSession();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushDrawingBoardSave();
    });
  }
  installDrawingBoardPersistence();

  function pushBoardUndo() {
    state.shortListUndo.push(boardSnapshot());
    if (state.shortListUndo.length > 50) state.shortListUndo.shift();
    state.shortListRedo = [];
  }
  function shortListSame(a, b) {
    return a.length === b.length && a.every((id, i) => id === b[i]);
  }
  function refreshShortListViews() {
    renderShortList();
    if (state.mode === 'all' || state.mode === 'search') renderBrowse();
    if (state.selected) renderDetail(state.selected);
    if (state.activeCelticCard) renderSpread();
    queueDrawingBoardSave();
  }
  function scrollCardRowToEnd() {
    requestAnimationFrame(() => {
      const row = document.querySelector('.short-list-row');
      if (row) row.scrollTo({ left: row.scrollWidth, behavior: 'smooth' });
    });
  }

  function commitShortList(next) {
    next = next.filter(Boolean);
    if (shortListSame(state.shortList, next)) return;
    if (next.length && state.rowLayoutDesignMode) return;
    pushBoardUndo();
    if (next.length) {
      state.rowLayoutLocked = true;
      state.rowLayoutDesignMode = false;
    }
    state.shortList = next;
    state.shortListSelection = state.shortListSelection.filter(id => next.includes(id));
    setRowCardReversalArray(rowCardReversalArray(next.length));
    refreshShortListViews();
  }
  function undoShortList() {
    if (!state.shortListUndo.length) return;
    state.shortListRedo.push(boardSnapshot());
    restoreBoardSnapshot(state.shortListUndo.pop());
    refreshShortListViews();
  }
  function redoShortList() {
    if (!state.shortListRedo.length) return;
    state.shortListUndo.push(boardSnapshot());
    restoreBoardSnapshot(state.shortListRedo.pop());
    refreshShortListViews();
  }
  function shortListCards(scope='active') {
    const full = state.shortList.map(cardById).filter(Boolean);
    const selected = state.shortListSelection.map(cardById).filter(Boolean);
    return scope === 'selected' && selected.length ? selected : full;
  }
  function countBy(items, fn) {
    const counts = {};
    items.forEach(item => {
      const values = fn(item);
      (Array.isArray(values) ? values : [values]).filter(Boolean).forEach(value => { counts[value] = (counts[value] || 0) + 1; });
    });
    return counts;
  }
  function topCounts(counts, limit=4) {
    return Object.entries(counts).sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([k,v]) => `${k} ${v}`).join(' · ') || '—';
  }
  function rowStats(items) {
    return {
      count: items.length,
      types: topCounts(countBy(items, card => card.card_type)),
      suits: topCounts(countBy(items, card => suitDisplay(card))),
      elements: topCounts(countBy(items, card => card.element || elementKey(card))),
      planets: topCounts(countBy(items, card => signList(card.astrology?.planet || card.astrology?.decan_ruler))),
      signs: topCounts(countBy(items, card => signList(card.astrology?.sign)))
    };
  }
  function rowStatsHtml(fullItems, selectedItems) {
    const active = selectedItems.length ? selectedItems : fullItems;
    const s = rowStats(active);
    const label = selectedItems.length ? `Selected ${selectedItems.length} of ${fullItems.length}` : `Full row ${fullItems.length}`;
    return `<div class="card-row-stats" aria-live="polite"><strong>${escapeHtml(label)}</strong><span>Type: ${escapeHtml(s.types)}</span><span>Suit: ${escapeHtml(s.suits)}</span><span>Element: ${escapeHtml(s.elements)}</span><span>Planet: ${escapeHtml(s.planets)}</span><span>Sign: ${escapeHtml(s.signs)}</span></div>`;
  }
  function factorsFor(n) {
    const pairs = [];
    for (let r=1; r<=n; r++) if (n % r === 0) pairs.push([r, n/r]);
    return pairs.length ? pairs : [[1, Math.max(1,n)]];
  }
  function shortListExportData() {
    const full = state.shortList.map(cardById).filter(Boolean);
    const selected = state.shortListSelection.map(cardById).filter(Boolean);
    const active = selected.length ? selected : full;
    const createdAt = new Date();
    return {
      name: state.shortListName || '',
      createdAt: createdAt.toISOString(),
      createdAtLocal: localTimestampLabel(createdAt),
      scope: selected.length ? 'selected' : 'full row',
      count: active.length,
      notes: state.shortListNotes || '',
      zoom: state.rowZoom || 1,
      pan: { x: rowPanXValue(), y: rowPanYValue() },
      snapEnabled: !!state.rowSnapEnabled,
      envelopeColor: state.rowEnvelopeColor || '',
      tableColor: state.rowTableColor || '',
      hasTableImage: !!state.rowTableImage,
      customEnvelopeArtSlots: Object.keys(state.rowEnvelopeArt || {}).filter(index => state.rowEnvelopeArt[index]),
      customCardArtIds: [],
      layout: state.rowEnvelopeLayout || {},
      transforms: state.rowCardTransforms || {},
      senseSelections: state.rowSenseSelections || {},
      senseNotes: state.rowSenseNotes || {},
      stats: rowStats(active),
      cards: active.map((card, i) => ({ position: state.shortListPositionLabels[i] || String(i+1), positionStickerCardId: state.shortListPositionCardIds?.[i] || '', cardId: card.card_id, title: title(card), reversed: rowCardIsReversed(i), orientation: rowCardIsReversed(i) ? 'reversed' : 'upright', transform: rowCardTransform(i), selectedSenseKey: rowSelectedSenseKey(i, card), selectedSenseLabel: rowSelectedSense(i, card)?.label || '', selectedSensePhrase: rowSensePhrase(i, card), senseNote: rowSenseNote(i, card), interpretation: rowCardInterpretation(card, i) }))
    };
  }

  function rowOrientationMethodText() {
    return 'Same card, same ingredients, inverted orientation. Begin with the card’s raw symbolism, then consider what changes when above and below are exchanged.';
  }
  function rowCardOrientationLabel(index) {
    return rowCardIsReversed(index) ? 'Reversed orientation' : 'Upright orientation';
  }

  async function imageDataUrlForExport(src) {
    if (String(src || '').startsWith('data:')) return src;
    const tryCanvas = async () => {
      const img = await loadImage(src);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    };
    try { return await tryCanvas(); }
    catch (canvasError) {
      try {
        const response = await fetch(src, { cache: 'force-cache' });
        if (!response.ok) throw new Error('image fetch failed');
        const blob = await response.blob();
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (fetchError) {
        return src;
      }
    }
  }


  function positionLengthClass(value) {
    const len = String(value || '').trim().length;
    if (len > 76) return 'is-xs';
    if (len > 52) return 'is-sm';
    if (len > 30) return 'is-md';
    return '';
  }

  function cleanSenseExportLine(c) {
    const fold = value => String(value || '').trim().toLowerCase();
    const label = String(c.selectedSenseLabel || '').trim();
    const phrase = String(c.selectedSensePhrase || '').trim();
    const note = String(c.senseNote || '').trim();
    const parts = [];
    if (label) parts.push(label);
    if (phrase && fold(phrase) !== fold(label)) parts.push(phrase);
    if (note) parts.push(`Note: ${note}`);
    return parts.join(' — ');
  }

  async function downloadShortListHtml() {
    return downloadShortListReadingHtml({ includeArt: true });
  }

  async function downloadShortListTextHtml() {
    return downloadShortListReadingHtml({ includeArt: false });
  }

  async function downloadShortListReadingHtml({ includeArt = true } = {}) {
    const data = shortListExportData();
    if (!data.cards.length) return;
    const cardsForExport = shortListCards('active');
    const imageSources = includeArt ? await Promise.all(cardsForExport.map(card => imageDataUrlForExport(rwsExportImagePath(card)))) : [];
    const createdAt = new Date();
    const createdLabel = localTimestampLabel(createdAt);
    const createdSlug = localTimestampSlug(createdAt);
    const positionClass = value => positionLengthClass(value) ? ' ' + positionLengthClass(value) : '';
    const orientationMethod = rowOrientationMethodText();
    const titleLine = c => `${escapeHtml(c.title)}${c.reversed ? ' · reversed' : ''}`;
    const senseLine = c => {
      const sense = cleanSenseExportLine(c);
      return sense ? `<p class="sense-line"><strong>Sense:</strong> ${escapeHtml(sense)}</p>` : '';
    };
    const reverseLine = c => c.reversed ? `<p class="orientation-note"><strong>Reversed:</strong> ${escapeHtml(orientationMethod)}</p>` : '';
    const interpretationLine = c => `<p class="relphi-definition">${escapeHtml(c.interpretation || '')}</p>`;
    const cardsHtml = data.cards.map((c, i) => `<article class="export-card${c.reversed ? ' is-reversed' : ''}${includeArt ? '' : ' export-card-text-only'}"><div class="export-position${positionClass(c.position)}"><strong>${escapeHtml(c.position || ('Position ' + (i + 1)))}</strong></div>${includeArt ? `<img class="export-card-art${c.reversed ? ' is-reversed' : ''}" src="${imageSources[i] || ''}" alt="${escapeHtml(c.title)} card art${c.reversed ? ', reversed' : ''}">` : ''}<h2>${titleLine(c)}</h2>${reverseLine(c)}${senseLine(c)}${interpretationLine(c)}</article>`).join('');
    const style = `@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;700;800&display=swap');body{font-family:'Montserrat',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:${includeArt ? '1120' : '860'}px;margin:40px auto;line-height:1.52;background:#fffaf0;color:#111;padding:0 1rem}h1{font-family:'Montserrat',system-ui,sans-serif;letter-spacing:.04em}.meta{border:1px solid rgba(220,31,24,.45);border-radius:18px;padding:1rem;margin:1rem 0;background:#fffdf8}.stamp{font-size:.9rem;color:#666}.card-grid{display:grid;grid-template-columns:${includeArt ? 'repeat(auto-fill,minmax(180px,205px))' : '1fr'};justify-content:start;align-items:start;gap:1.1rem;margin:1.2rem 0}.export-card{border:1px solid rgba(17,17,17,.82);border-radius:14px;padding:.8rem;background:#fff;box-shadow:0 8px 20px rgba(0,0,0,.07);max-width:${includeArt ? '205px' : 'none'}}.export-card-text-only{max-width:none}.export-card.is-reversed{border-width:2px}.export-position{font-weight:800;margin-bottom:.55rem;border:1px solid rgba(17,17,17,.22);border-radius:10px;background:#fffaf0;padding:.42rem .55rem;min-height:2.4rem;display:grid;place-items:center;text-align:center;box-sizing:border-box;line-height:1.15}.export-position.is-md{font-size:.82rem}.export-position.is-sm{font-size:.72rem}.export-position.is-xs{font-size:.62rem;line-height:1.02}.export-card img{display:block;width:100%;max-width:172px;max-height:295px;margin:0 auto;border-radius:10px;border:1px solid #222;object-fit:contain}.export-card img.is-reversed{transform:rotate(180deg)}.export-card h2{font-size:1.05rem;margin:.6rem 0 .3rem;text-transform:capitalize}.export-card p{font-size:.95rem}.orientation-note{border-left:3px solid #111;padding-left:.55rem;background:#fffaf0}.sense-line{border:1px solid rgba(17,17,17,.18);border-radius:10px;padding:.45rem;background:#fffaf0;font-size:.88rem}.relphi-definition{margin:.55rem 0 0}`;
    const fileSuffix = includeArt ? 'with-art' : 'text-only';
    download(`drawing-board-${fileSuffix}-${createdSlug}.html`, `<!doctype html><html><head><meta charset="utf-8"><title>Drawing Board</title><style>${style}</style></head><body><h1>Drawing Board</h1><div class="meta">${data.name ? `<p><strong>${escapeHtml(data.name)}</strong></p>` : ''}<p>${escapeHtml(data.scope)} · ${data.count} cards</p><p class="stamp">Created ${escapeHtml(createdLabel)}</p>${data.notes ? `<p><strong>Notes:</strong> ${escapeHtml(data.notes)}</p>` : ''}</div><section class="card-grid">${cardsHtml}</section></body></html>`, 'text/html');
  }

  function downloadShortListJson() {
    const data = shortListExportData();
    if (!data.cards.length) return;
    download(`drawing-board-${localTimestampSlug(new Date())}.json`, JSON.stringify(data, null, 2), 'application/json');
  }
  function openCardRowPrintDialog() {
    const items = shortListCards('active');
    if (!items.length) return;
    const existing = document.getElementById('cardRowPrintDialog');
    if (existing) existing.remove();
    const pairs = factorsFor(items.length);
    const dialog = document.createElement('dialog');
    dialog.id = 'cardRowPrintDialog';
    dialog.className = 'card-row-print-dialog';
    dialog.innerHTML = `<form method="dialog"><h3>Save Drawing Board image</h3><label>Rows × columns <select id="cardRowGridChoice">${pairs.map(([r,c]) => `<option value="${r}x${c}">${r} × ${c}</option>`).join('')}</select></label><label>File type <select id="cardRowImageType"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option></select></label><label><input id="cardRowIncludeTitles" type="checkbox" checked> Include titles</label><label><input id="cardRowIncludeStats" type="checkbox" checked> Include compact stats</label><menu><button value="cancel">Cancel</button><button id="saveCardRowImage" type="button" value="default">Save image</button></menu></form>`;
    document.body.appendChild(dialog);
    dialog.querySelector('#saveCardRowImage').addEventListener('click', event => { event.preventDefault(); saveCardRowImage(dialog); });
    dialog.showModal();
  }
  function loadImage(src) {
    return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src; });
  }
  function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y); ctx.closePath();
  }
  function wrapCanvasLines(ctx, text, maxWidth, maxLines) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    words.forEach(word => {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width <= maxWidth || !line) line = test;
      else { lines.push(line); line = word; }
    });
    if (line) lines.push(line);
    if (lines.length > maxLines) {
      const clipped = lines.slice(0, maxLines);
      while (ctx.measureText(clipped[clipped.length - 1] + '…').width > maxWidth && clipped[clipped.length - 1].length > 1) clipped[clipped.length - 1] = clipped[clipped.length - 1].slice(0, -1);
      clipped[clipped.length - 1] = clipped[clipped.length - 1] + '…';
      return clipped;
    }
    return lines;
  }
  function drawPositionPanelOnCanvas(ctx, label, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(17,17,17,.48)';
    ctx.lineWidth = 1.2;
    drawRoundedRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.stroke();
    const text = String(label || '').trim();
    if (text) {
      const maxW = w - 18;
      let fontSize = text.length > 76 ? 10 : text.length > 52 ? 11 : text.length > 30 ? 12 : 13;
      let lines;
      do {
        ctx.font = `800 ${fontSize}px Montserrat, Arial, sans-serif`;
        lines = wrapCanvasLines(ctx, text, maxW, 3);
        if (lines.length <= 3 || fontSize <= 8) break;
        fontSize -= 1;
      } while (fontSize > 8);
      const lh = fontSize + 3;
      const total = lines.length * lh;
      ctx.fillStyle = '#111';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = `800 ${fontSize}px Montserrat, Arial, sans-serif`;
      const startY = y + Math.max(5, (h - total) / 2);
      lines.slice(0,3).forEach((line, li) => ctx.fillText(line, x + w / 2, startY + li * lh));
    }
    ctx.restore();
  }
  async function saveCardRowImage(dialog) {
    const items = shortListCards('active');
    if (!items.length) return;
    const [rows, cols] = String(dialog.querySelector('#cardRowGridChoice').value || '1x1').split('x').map(Number);
    const type = dialog.querySelector('#cardRowImageType').value || 'image/png';
    const includeTitles = dialog.querySelector('#cardRowIncludeTitles').checked;
    const includeStats = dialog.querySelector('#cardRowIncludeStats').checked;
    const cardW = 220, cardH = 381, positionH = 58, nameH = includeTitles ? 28 : 0, panelGap = 8, groupPad = 10, gap = 28;
    const topPad = includeStats ? 128 : 28;
    const groupW = cardW + groupPad * 2;
    const groupH = groupPad + positionH + panelGap + nameH + panelGap + cardH + groupPad;
    const canvas = document.createElement('canvas');
    canvas.width = cols * groupW + (cols + 1) * gap;
    canvas.height = topPad + rows * groupH + (rows + 1) * gap;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fffaf0'; ctx.fillRect(0,0,canvas.width,canvas.height);
    const createdAt = new Date();
    if (includeStats) {
      const stats = rowStats(items);
      ctx.fillStyle = '#111'; ctx.font = '800 20px Montserrat, Arial, sans-serif';
      ctx.fillText(`${state.shortListName ? state.shortListName + ' · ' : ''}Drawing Board · ${items.length} cards`, gap, 30);
      ctx.font = '600 13px Montserrat, Arial, sans-serif';
      ctx.fillStyle = '#555'; ctx.fillText(`Created ${localTimestampLabel(createdAt)}`, gap, 52);
      ctx.fillStyle = '#111'; ctx.font = '14px Montserrat, Arial, sans-serif';
      ctx.fillText(`Elements: ${stats.elements}   Planets: ${stats.planets}`, gap, 80);
      ctx.fillText(`Suits: ${stats.suits}   Signs: ${stats.signs}`, gap, 100);
    }
    const images = await Promise.all(items.map(card => loadImage(rwsExportImagePath(card)).catch(() => null)));
    items.forEach((card, i) => {
      const r = Math.floor(i / cols), c = i % cols;
      const gx = gap + c * (groupW + gap), gy = topPad + gap + r * groupH;
      const x = gx + groupPad;
      const positionY = gy + groupPad;
      const nameY = positionY + positionH + panelGap;
      const artY = nameY + nameH + panelGap;
      ctx.fillStyle = state.rowEnvelopeColor || '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
      drawRoundedRect(ctx, gx, gy, groupW, groupH, 14); ctx.fill(); ctx.stroke();
      const positionLabel = String(state.shortListPositionLabels[i] || '').trim();
      drawPositionPanelOnCanvas(ctx, positionLabel || ('Position ' + (i + 1)), x, positionY, cardW, positionH);
      if (includeTitles) {
        ctx.fillStyle = '#111'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '800 14px Montserrat, Arial, sans-serif';
        const label = `${title(card)}${rowCardIsReversed(i) ? ' · Reversed' : ''}`.slice(0, 42);
        ctx.fillText(label, x + cardW / 2, nameY + nameH / 2);
      }
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
      drawRoundedRect(ctx, x, artY, cardW, cardH, 12); ctx.fill(); ctx.stroke();
      const img = images[i];
      if (img) {
        const scale = Math.min(cardW / img.width, cardH / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.save();
        if (rowCardIsReversed(i)) {
          ctx.translate(x + cardW / 2, artY + cardH / 2);
          ctx.rotate(Math.PI);
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
        } else {
          ctx.drawImage(img, x + (cardW-w)/2, artY + (cardH-h)/2, w, h);
        }
        ctx.restore();
      } else {
        ctx.fillStyle = '#111'; ctx.font = '800 16px Montserrat, Arial, sans-serif'; ctx.textAlign = 'left';
        title(card).split(' ').forEach((word, line) => ctx.fillText(word, x + 18, artY + 36 + line * 22));
      }
    });
    const finish = blob => {
      const stamp = localTimestampSlug(createdAt);
      const filename = `drawing-board-${stamp}.${type === 'image/jpeg' ? 'jpg' : 'png'}`;
      if (!blob) {
        const dataUrl = canvas.toDataURL(type, .92);
        const a = document.createElement('a');
        a.href = dataUrl; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
        dialog.close(); dialog.remove(); return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href=url; a.download=filename; a.rel='noopener'; document.body.appendChild(a); a.click(); a.remove();
      const status = $('downloadStatus');
      if (status) status.innerHTML = `Image created. If it did not save automatically, use this link: <a href="${url}" download="${a.download}">${a.download}</a>`;
      dialog.close(); dialog.remove();
    };
    if (canvas.toBlob) canvas.toBlob(finish, type, .92);
    else finish(null);
  }
  async function downloadCardRowArrangementSnapshot() {
    const slots = rowSlotCount();
    if (!slots) return;
    const createdAt = new Date();
    const positions = Array.from({ length: slots }, (_, i) => rowEnvelopePosition(i));
    const minX = Math.min(...positions.map(pos => pos.x), 0);
    const minY = Math.min(...positions.map(pos => pos.y), 0);
    const maxX = Math.max(...positions.map(pos => pos.x + CARD_ROW_ENVELOPE_W), CARD_ROW_ENVELOPE_W);
    const maxY = Math.max(...positions.map(pos => pos.y + CARD_ROW_ENVELOPE_H), CARD_ROW_ENVELOPE_H);
    const margin = 36;
    const headerH = state.shortListNotes ? 118 : 82;
    const scale = 1.08;
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil((maxX - minX) * scale + margin * 2);
    canvas.height = Math.ceil((maxY - minY) * scale + margin * 2 + headerH);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = state.rowTableColor || '#fffaf0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111';
    ctx.font = '900 22px Montserrat, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${state.shortListName ? state.shortListName + ' · ' : ''}Drawing Board arrangement`, margin, 22);
    ctx.font = '600 12px Montserrat, Arial, sans-serif';
    ctx.fillStyle = '#555';
    ctx.fillText(`Snapshot ${localTimestampLabel(createdAt)} · ${slots} envelope${slots === 1 ? '' : 's'} · ${Math.round((state.rowZoom || 1) * 100)}% view`, margin, 50);
    if (state.shortListNotes) {
      ctx.font = '600 13px Montserrat, Arial, sans-serif';
      ctx.fillStyle = '#222';
      wrapCanvasLines(ctx, state.shortListNotes, canvas.width - margin * 2, 2).forEach((line, li) => ctx.fillText(line, margin, 74 + li * 18));
    }
    const cards = state.shortList.map(cardById);
    const tableImage = state.rowTableImage ? await loadImage(state.rowTableImage).catch(() => null) : null;
    if (tableImage) {
      const bgX = margin;
      const bgY = headerH;
      const bgW = canvas.width - margin * 2;
      const bgH = canvas.height - headerH - margin;
      const s = Math.max(bgW / tableImage.width, bgH / tableImage.height);
      const w = tableImage.width * s, h = tableImage.height * s;
      ctx.drawImage(tableImage, bgX + (bgW - w) / 2, bgY + (bgH - h) / 2, w, h);
    }
    const images = await Promise.all(Array.from({ length: slots }, (_, i) => {
      const card = cards[i];
      const envelopeArt = rowEnvelopeArtFor(i);
      return card ? loadImage(rwsExportImagePath(card)).catch(() => null) : envelopeArt ? loadImage(envelopeArt).catch(() => null) : Promise.resolve(null);
    }));
    const groupW = CARD_ROW_ENVELOPE_W * scale;
    const positionH = 54 * scale;
    const gap = 10 * scale;
    const cardW = 160 * scale;
    const cardH = 277 * scale;
    Array.from({ length: slots }, (_, i) => i).forEach(i => {
      const pos = positions[i];
      const x = margin + (pos.x - minX) * scale;
      const y = margin + headerH + (pos.y - minY) * scale;
      const card = cards[i];
      const position = String(state.shortListPositionLabels[i] || `Position ${i + 1}`).trim();
      const t = rowCardTransform(i);
      ctx.save();
      const centerX = x + groupW / 2;
      const centerY = y + (CARD_ROW_ENVELOPE_H * scale) / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((t.rotation || 0) * Math.PI / 180);
      ctx.scale(t.scale || 1, t.scale || 1);
      ctx.translate(-centerX, -centerY);
      ctx.fillStyle = state.rowEnvelopeColor || '#fff';
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1.5;
      drawRoundedRect(ctx, x, y, groupW, CARD_ROW_ENVELOPE_H * scale, 14);
      ctx.fill();
      ctx.stroke();
      drawPositionPanelOnCanvas(ctx, position, x + 12 * scale, y + 12 * scale, groupW - 24 * scale, positionH);
      const artX = x + (groupW - cardW) / 2;
      const artY = y + 12 * scale + positionH + gap;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = card ? '#111' : 'rgba(17,17,17,.55)';
      ctx.setLineDash(card ? [] : [8, 7]);
      drawRoundedRect(ctx, artX, artY, cardW, cardH, 12);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      const img = images[i];
      if (img) {
        const s = Math.min(cardW / img.width, cardH / img.height);
        const w = img.width * s, h = img.height * s;
        ctx.save();
        if (card && rowCardIsReversed(i)) {
          ctx.translate(artX + cardW / 2, artY + cardH / 2);
          ctx.rotate(Math.PI);
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
        } else {
          ctx.drawImage(img, artX + (cardW - w) / 2, artY + (cardH - h) / 2, w, h);
        }
        ctx.restore();
      } else {
        ctx.fillStyle = 'rgba(17,17,17,.62)';
        ctx.font = `900 ${13 * scale}px Montserrat, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Undrawn', artX + cardW / 2, artY + cardH / 2 - 8);
        ctx.font = `700 ${10 * scale}px Montserrat, Arial, sans-serif`;
        ctx.fillText('card envelope', artX + cardW / 2, artY + cardH / 2 + 12);
      }
      if (card) {
        ctx.fillStyle = '#111';
        ctx.font = `800 ${12 * scale}px Montserrat, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        wrapCanvasLines(ctx, `${title(card)}${rowCardIsReversed(i) ? ' · Reversed' : ''}`, groupW - 16 * scale, 2).forEach((line, li) => ctx.fillText(line, x + groupW / 2, artY + cardH + 10 * scale + li * 15 * scale));
      }
      ctx.restore();
    });
    const finish = blob => {
      const filename = `drawing-board-arrangement-${localTimestampSlug(createdAt)}.png`;
      if (!blob) {
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = filename;
        document.body.appendChild(a); a.click(); a.remove(); return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
      const status = $('downloadStatus');
      if (status) status.innerHTML = `Arrangement snapshot created. If it did not save automatically, use this link: <a href="${url}" download="${filename}">${filename}</a>`;
    };
    if (canvas.toBlob) canvas.toBlob(finish, 'image/png'); else finish(null);
  }

  function rowDrawPool(scope, options = {}) {
    const key = scope || state.rowDrawScope || 'full';
    const visible = currentCards();
    const planetaryBodies = new Set(['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn']);
    let pool;
    if (key === 'shown') pool = visible.length ? visible : cards;
    else if (key === 'majors') pool = cards.filter(card => card.card_type === 'Major');
    else if (key === 'uhn') pool = UHN_CARD_IDS.map(cardById).filter(Boolean);
    else if (key === 'planetary-majors') pool = cards.filter(card => card.card_type === 'Major' && planetaryBodies.has(card.astrology?.planet));
    else if (key === 'zodiac-majors') pool = cards.filter(card => card.card_type === 'Major' && !!card.astrology?.sign);
    else if (key === 'aces') pool = cards.filter(card => card.card_type === 'Ace');
    else if (key === 'courts') pool = cards.filter(card => card.card_type === 'Court');
    else if (key === 'pips') pool = cards.filter(card => card.card_type === 'Pip');
    else if (key === 'decans') pool = cards.filter(card => card.card_type === 'Pip' && !!card.astrology?.decan);
    else if (key === 'wands') pool = cards.filter(card => card.suit === 'Wands');
    else if (key === 'cups') pool = cards.filter(card => card.suit === 'Cups');
    else if (key === 'swords') pool = cards.filter(card => card.suit === 'Swords');
    else if (key === 'pentacles') pool = cards.filter(card => card.suit === 'Pentacles');
    else pool = cards;
    if (!state.rowAllowRepeats && !options.ignoreUsed) {
      const used = new Set([...(state.shortList || []), ...(state.shortListPositionCardIds || [])]);
      pool = pool.filter(card => !used.has(card.card_id));
    }
    return sortCardsForDisplay(pool);
  }
  function randomInt(max) {
    max = Math.floor(Number(max) || 0);
    if (max <= 0) return 0;
    const cryptoObj = window.crypto || window.msCrypto;
    if (cryptoObj?.getRandomValues) {
      const range = 0x100000000;
      const limit = range - (range % max);
      const bucket = new Uint32Array(1);
      do { cryptoObj.getRandomValues(bucket); } while (bucket[0] >= limit);
      return bucket[0] % max;
    }
    return Math.floor(Math.random() * max);
  }

  function shuffleArray(items) {
    const next = items.slice();
    for (let i = next.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
  }

  function rowDrawSignature() {
    const key = state.rowDrawScope || 'full';
    const visibleIds = key === 'shown' ? currentCards().map(card => card.card_id).join('|') : '';
    return JSON.stringify({
      scope: key,
      shown: visibleIds,
      repeats: !!state.rowAllowRepeats,
      reversals: !!state.rowAllowReversals
    });
  }

  function resetRowDrawDeck() {
    state.rowDrawDeck = [];
    state.rowDrawDeckSignature = '';
    state.rowShuffleCount = 0;
  }

  function buildRowDrawDeck() {
    const pool = rowDrawPool(state.rowDrawScope);
    const entries = pool.map(card => ({
      cardId: card.card_id,
      reversed: !!state.rowAllowReversals && randomInt(2) === 1
    }));
    state.rowDrawDeck = shuffleArray(entries);
    state.rowDrawDeckSignature = rowDrawSignature();
    state.rowShuffleCount = (Number(state.rowShuffleCount) || 0) + 1;
    return state.rowDrawDeck;
  }

  function drawFromRowDeck() {
    const signature = rowDrawSignature();
    if (!Array.isArray(state.rowDrawDeck) || state.rowDrawDeckSignature !== signature) buildRowDrawDeck();
    const used = new Set([...(state.shortList || []), ...(state.shortListPositionCardIds || [])]);
    while (state.rowDrawDeck.length) {
      const entry = state.rowDrawDeck.shift();
      const card = cardById(entry?.cardId);
      if (!card) continue;
      if (!state.rowAllowRepeats && used.has(card.card_id)) continue;
      return { card, reversed: !!entry.reversed };
    }
    return null;
  }

  function randomRowDraw(pool, allowReversals) {
    if (!pool.length) return null;
    if (!allowReversals) return { card: pool[randomInt(pool.length)], reversed: false };
    const stateIndex = randomInt(pool.length * 2);
    return { card: pool[Math.floor(stateIndex / 2)], reversed: stateIndex % 2 === 1 };
  }

  function drawRandomRowCard() {
    if (state.rowLayoutDesignMode) {
      const status = $('downloadStatus');
      if (status) status.textContent = 'Finish the layout design before drawing cards.';
      return;
    }
    let draw;
    if (state.rowAllowRepeats) {
      const pool = rowDrawPool(state.rowDrawScope);
      if (!pool.length) {
        const status = $('downloadStatus');
        if (status) status.textContent = 'No cards are available in that pack.';
        return;
      }
      draw = randomRowDraw(pool, !!state.rowAllowReversals);
    } else {
      draw = drawFromRowDeck();
      if (!draw?.card) {
        const status = $('downloadStatus');
        if (status) status.textContent = 'The current draw pile is exhausted. Clear the board or allow repeats to keep drawing.';
        refreshShortListViews();
        return;
      }
    }
    if (!draw?.card) return;
    const index = (state.shortList || []).length;
    commitShortList([...state.shortList, draw.card.card_id]);
    setRowCardReversed(index, !!draw.reversed);
    refreshShortListViews();
    expandCardRow();
    scrollCardRowToEnd();
  }
  function setDragCardPayload(event, cardId, rowIndex = '') {
    if (!event?.dataTransfer || !cardId) return;
    event.dataTransfer.effectAllowed = 'copyMove';
    event.dataTransfer.setData('application/x-relphi-card-id', cardId);
    event.dataTransfer.setData('text/x-relphi-card-id', cardId);
    if (rowIndex !== '') event.dataTransfer.setData('application/x-relphi-row-index', String(rowIndex));
    event.dataTransfer.setData('text/plain', rowIndex !== '' ? String(rowIndex) : cardId);
  }
  function droppedCardId(event) {
    return String(event?.dataTransfer?.getData('application/x-relphi-card-id') || event?.dataTransfer?.getData('text/x-relphi-card-id') || '').trim();
  }
  function placeCardInRow(cardId, targetIndex) {
    if (state.rowLayoutDesignMode) return;
    cardId = String(cardId || '').trim();
    if (!cardById(cardId)) return;
    const next = state.shortList.slice();
    const reversals = rowCardReversalArray(next.length);
    const existing = next.indexOf(cardId);
    const movedReversal = existing >= 0 ? reversals[existing] : false;
    if (existing >= 0) { next.splice(existing, 1); reversals.splice(existing, 1); }
    if (!state.rowAllowRepeats && existing < 0 && next.includes(cardId)) return;
    const index = Math.max(0, Math.min(Number(targetIndex) || 0, next.length));
    next.splice(index, 0, cardId);
    reversals.splice(index, 0, movedReversal);
    setRowCardReversalArray(reversals);
    commitShortList(next);
  }
  function positionStickerCardHtml(cardId, index) {
    const card = cardById(cardId);
    if (!card) return '';
    return `<button class="card-position-art-sticker" type="button" data-position-card="${escapeHtml(card.card_id)}" data-position-index="${index}" title="${escapeHtml(title(card))} position sticker"><img src="${escapeHtml(rwsImagePath(card))}" alt="${escapeHtml(title(card))} position sticker art" loading="lazy"><span>${escapeHtml(title(card))}</span><b aria-hidden="true">×</b></button>`;
  }
  function setPositionStickerCard(cardId, targetIndex, options = {}) {
    cardId = String(cardId || '').trim();
    if (!cardById(cardId)) return;
    const index = Math.max(0, Number(targetIndex) || 0);
    pushBoardUndo();
    const nextStickers = (state.shortListPositionCardIds || []).slice();
    nextStickers[index] = cardId;
    state.shortListPositionCardIds = nextStickers;
    if (options.removeFromRow) {
      state.shortList = (state.shortList || []).filter((id, i) => !(id === cardId && String(i) === String(options.fromIndex)));
      state.shortListSelection = state.shortListSelection.filter(id => state.shortList.includes(id));
    }
    refreshShortListViews();
  }
  function clearPositionStickerCard(index) {
    pushBoardUndo();
    const nextStickers = (state.shortListPositionCardIds || []).slice();
    nextStickers[Number(index) || 0] = '';
    state.shortListPositionCardIds = nextStickers;
    refreshShortListViews();
  }

  const CARD_ROW_ENVELOPE_W = 174;
  const CARD_ROW_ENVELOPE_H = 390;
  const CARD_ROW_TABLE_COLS = 3;
  const CARD_ROW_TABLE_ROWS = 5;
  const CARD_ROW_SNAP_GRIDS = { 'one-sixteenth': { label: '1/16 card', fraction: 1/16 }, 'one-eighth': { label: '1/8 card', fraction: 1/8 }, 'one-sixth': { label: '1/6 card', fraction: 1/6 }, 'one-fourth': { label: '1/4 card', fraction: 1/4 }, 'one-third': { label: '1/3 card', fraction: 1/3 }, 'one-half': { label: '1/2 card', fraction: 1/2 }, 'one-card': { label: '1 card', fraction: 1 } };
  const CARD_ROW_SNAP_ORDER = ['one-sixteenth','one-eighth','one-sixth','one-fourth','one-third','one-half','one-card'];
  const CARD_ROW_ROTATION_SNAP_STEPS = [1, 5, 10, 15, 30, 45, 90];
  const CARD_ROW_LEGACY_DEFAULT_GAPS = [
    { x: 42, y: 56 },
    { x: 24, y: 28 }
  ];
  const CARD_ROW_DEFAULT_GAP_X_PX = 0;
  const CARD_ROW_DEFAULT_GAP_Y_PX = 0;
  function rowZoomValue() { return Math.max(.45, Math.min(2.4, Number(state.rowZoom) || 1)); }
  function rowPanXValue() { return Number.isFinite(Number(state.rowPanX)) ? Number(state.rowPanX) : 0; }
  function rowPanYValue() { return Number.isFinite(Number(state.rowPanY)) ? Number(state.rowPanY) : 0; }
  function rowSnapGridValue() { return CARD_ROW_SNAP_GRIDS[state.rowSnapGrid] ? state.rowSnapGrid : 'one-eighth'; }
  function rowSnapGrid() { return CARD_ROW_SNAP_GRIDS[rowSnapGridValue()]; }
  function rowSnapStepX() { return CARD_ROW_ENVELOPE_W * rowSnapGrid().fraction; }
  function rowSnapStepY() { return CARD_ROW_ENVELOPE_H * rowSnapGrid().fraction; }
  function rowRotationSnapDegrees() { const n = Number(state.rowRotationSnapDegrees) || 15; return CARD_ROW_ROTATION_SNAP_STEPS.includes(n) ? n : 15; }
  function stepValueInList(list, current, direction) { const idx = Math.max(0, list.indexOf(current)); return list[Math.max(0, Math.min(list.length - 1, idx + direction))] || current; }
  function rowDefaultStepX() { return CARD_ROW_ENVELOPE_W + CARD_ROW_DEFAULT_GAP_X_PX; }
  function rowDefaultStepY() { return CARD_ROW_ENVELOPE_H + CARD_ROW_DEFAULT_GAP_Y_PX; }
  function rowSlotCount(itemsLength = (state.shortList || []).length) {
    return Math.max(itemsLength, (state.shortListPositionLabels || []).length, (state.shortListPositionCardIds || []).length, 0);
  }
  function cardRowAvailableWidth() {
    const panel = $('shortListPanel');
    const width = panel?.clientWidth || Math.min(window.innerWidth || 980, 1180);
    return Math.max(CARD_ROW_ENVELOPE_W, width - 48);
  }
  function rowDefaultColumnCount() {
    // The default spread should not reflow while zooming. Zoom scales the table; it does not
    // recompute the envelope grid or move cards into different rows.
    const logicalWidth = cardRowAvailableWidth();
    return Math.max(1, Math.floor(logicalWidth / rowDefaultStepX()));
  }
  function rowDefaultRowCount(slotCount = rowSlotCount()) {
    return Math.max(1, Math.ceil(Math.max(1, slotCount) / rowDefaultColumnCount()));
  }
  function rowTableLogicalWidth(slotCount = rowSlotCount()) {
    const cols = Math.min(Math.max(1, slotCount || 1), rowDefaultColumnCount());
    return CARD_ROW_ENVELOPE_W + rowDefaultStepX() * (cols - 1);
  }
  function rowTableLogicalHeight(slotCount = rowSlotCount()) {
    const rows = rowDefaultRowCount(slotCount);
    return CARD_ROW_ENVELOPE_H + rowDefaultStepY() * (rows - 1);
  }
  function rowEnvelopeDefaultPosition(index) {
    const cols = rowDefaultColumnCount();
    return { x: (index % cols) * rowDefaultStepX(), y: Math.floor(index / cols) * rowDefaultStepY() };
  }
  function rowEnvelopeLegacyDefaultPosition(index, gap) {
    const oldStepX = CARD_ROW_ENVELOPE_W + gap.x;
    const oldStepY = CARD_ROW_ENVELOPE_H + gap.y;
    const cols = Math.max(1, Math.floor(cardRowAvailableWidth() / oldStepX));
    return { x: (index % cols) * oldStepX, y: Math.floor(index / cols) * oldStepY };
  }
  function isRowOldDefaultPosition(index, saved) {
    return CARD_ROW_LEGACY_DEFAULT_GAPS.some(gap => {
      const old = rowEnvelopeLegacyDefaultPosition(index, gap);
      return Math.abs(Number(saved.x) - old.x) <= 1 && Math.abs(Number(saved.y) - old.y) <= 1;
    });
  }
  function rowEnvelopePosition(index) {
    const saved = state.rowEnvelopeLayout?.[index];
    if (saved && Number.isFinite(Number(saved.x)) && Number.isFinite(Number(saved.y))) {
      if (!state.rowLayoutSpacingAccepted && isRowOldDefaultPosition(index, saved)) return rowEnvelopeDefaultPosition(index);
      return { x: Number(saved.x), y: Number(saved.y) };
    }
    return rowEnvelopeDefaultPosition(index);
  }
  function rowCardTransform(index) {
    const saved = state.rowCardTransforms?.[index] || {};
    const scale = Math.max(.45, Math.min(2.5, Number(saved.scale) || 1));
    const rotation = Math.max(-180, Math.min(180, Number(saved.rotation) || 0));
    const zIndex = Math.max(0, Math.min(100, Number(saved.zIndex) || 1));
    return { scale, rotation, zIndex };
  }
  function rowCardIsReversed(index) {
    return !!(state.rowCardReversals && state.rowCardReversals[Math.max(0, Number(index) || 0)]);
  }
  function setRowCardReversed(index, reversed) {
    const i = Math.max(0, Number(index) || 0);
    state.rowCardReversals ||= {};
    if (reversed) state.rowCardReversals[i] = true;
    else delete state.rowCardReversals[i];
  }
  function rowCardReversalArray(length = (state.shortList || []).length) {
    return Array.from({ length }, (_, i) => rowCardIsReversed(i));
  }
  function setRowCardReversalArray(values = []) {
    state.rowCardReversals = {};
    values.forEach((value, index) => { if (value) state.rowCardReversals[index] = true; });
  }
  function toggleRowCardReversal(index, options = {}) {
    const i = Math.max(0, Number(index) || 0);
    if (!options.skipUndo) pushBoardUndo();
    setRowCardReversed(i, !rowCardIsReversed(i));
    state.rowTransformTarget = i;
    refreshShortListViews();
  }
  function rowTransformTargetIndex(slotCount = rowSlotCount()) {
    const max = Math.max(0, slotCount - 1);
    const raw = Number.isFinite(Number(state.rowTransformTarget)) ? Number(state.rowTransformTarget) : 0;
    return Math.max(0, Math.min(max, raw));
  }
  function setRowCardTransform(index, updates = {}) {
    if (state.rowLayoutLocked && !state.rowLayoutDesignMode) return;
    const i = Math.max(0, Number(index) || 0);
    state.rowCardTransforms ||= {};
    const current = rowCardTransform(i);
    const next = {
      scale: updates.scale == null ? current.scale : Math.max(.45, Math.min(2.5, Number(updates.scale) || 1)),
      rotation: updates.rotation == null ? current.rotation : Math.max(-180, Math.min(180, Number(updates.rotation) || 0)),
      zIndex: updates.zIndex == null ? current.zIndex : Math.max(0, Math.min(100, Number(updates.zIndex) || 1))
    };
    if (Math.abs(next.scale - 1) < .001 && Math.abs(next.rotation) < .001 && next.zIndex === 1) delete state.rowCardTransforms[i];
    else state.rowCardTransforms[i] = next;
    state.rowTransformTarget = i;
  }
  function resetRowCardTransform(index) {
    if (state.rowLayoutLocked && !state.rowLayoutDesignMode) return;
    state.rowCardTransforms ||= {};
    delete state.rowCardTransforms[Math.max(0, Number(index) || 0)];
  }
  function snapRowCoord(value, axis = 'x') {
    const raw = Math.max(0, Number(value) || 0);
    if (!state.rowSnapEnabled) return raw;
    const logicalStep = axis === 'y' ? rowSnapStepY() : rowSnapStepX();
    return Math.max(0, Math.round(raw / logicalStep) * logicalStep);
  }
  function setRowEnvelopePosition(index, x, y) {
    if (state.rowLayoutLocked && !state.rowLayoutDesignMode) return;
    state.rowEnvelopeLayout ||= {};
    state.rowEnvelopeLayout[index] = { x: snapRowCoord(x, 'x'), y: snapRowCoord(y, 'y') };
  }
  function cssUrlValue(value) {
    const v = String(value || '').trim();
    return v ? `url(${v.replace(/\)/g, '%29')})` : 'none';
  }
  function cardRowBoardMetrics(slotCount) {
    if (!slotCount) return { width: Math.max(CARD_ROW_ENVELOPE_W + 48, cardRowAvailableWidth()), height: 240 };
    const count = Math.max(1, slotCount);
    const placeholderOnly = !(state.shortList || []).length;
    const envelopeHeight = placeholderOnly ? Math.ceil(CARD_ROW_ENVELOPE_W * 866 / 500) + 55 : CARD_ROW_ENVELOPE_H;
    const positions = Array.from({ length: count }, (_, i) => rowEnvelopePosition(i));
    const extents = positions.map((pos, i) => {
      const t = rowCardTransform(i);
      const radians = Math.abs(t.rotation) * Math.PI / 180;
      const rotatedW = (Math.abs(Math.cos(radians)) * CARD_ROW_ENVELOPE_W + Math.abs(Math.sin(radians)) * CARD_ROW_ENVELOPE_H) * t.scale;
      const rotatedH = (Math.abs(Math.sin(radians)) * CARD_ROW_ENVELOPE_W + Math.abs(Math.cos(radians)) * envelopeHeight) * t.scale;
      return { x: pos.x + Math.max(CARD_ROW_ENVELOPE_W, rotatedW), y: pos.y + Math.max(envelopeHeight, rotatedH) };
    });
    const maxX = Math.max(...extents.map(pos => pos.x), rowTableLogicalWidth(slotCount));
    const maxY = Math.max(...extents.map(pos => pos.y), placeholderOnly ? envelopeHeight : rowTableLogicalHeight(slotCount));
    return { width: Math.ceil(maxX + 48), height: Math.ceil(maxY + 48) };
  }
  function cardRowWorkspaceStyle(slotCount) {
    const zoom = rowZoomValue();
    const metrics = cardRowBoardMetrics(slotCount);
    const placeholderOnly = !(state.shortList || []).length;
    const minHeight = !slotCount ? 300 : (placeholderOnly ? Math.max(390, Math.min(760, Math.ceil(metrics.height) + 60)) : Math.max(620, Math.min(1100, Math.ceil(metrics.height) + 92)));
    const tableColor = state.rowTableColor || '#fffaf0';
    const tableImage = cssUrlValue(state.rowTableImage || '');
    return `--row-table-bg:${tableColor};--row-table-image:${tableImage};min-height:${minHeight}px;`;
  }
  function cardRowBoardStyle(slotCount) {
    const zoom = rowZoomValue();
    const metrics = cardRowBoardMetrics(slotCount);
    const envelopeColor = state.rowEnvelopeColor || '#f3f0ea';
    const tableColor = state.rowTableColor || '#fffaf0';
    const tableImage = cssUrlValue(state.rowTableImage || '');
    return `--row-zoom:${zoom};--row-envelope-w:${CARD_ROW_ENVELOPE_W}px;--row-envelope-h:${CARD_ROW_ENVELOPE_H}px;--row-grid-x:${rowSnapStepX().toFixed(2)}px;--row-grid-y:${rowSnapStepY().toFixed(2)}px;--relphi-envelope-bg:${envelopeColor};--relphi-card-envelope-bg:${envelopeColor};--row-table-bg:${tableColor};--row-table-image:${tableImage};width:${metrics.width}px;height:${metrics.height}px;min-height:${metrics.height}px;min-width:${metrics.width}px;transform:translate(${Math.round(rowPanXValue())}px, ${Math.round(rowPanYValue())}px) scale(${zoom});`;
  }
  function cardRowItemStyle(index) {
    const pos = rowEnvelopePosition(index);
    const t = rowCardTransform(index);
    return `left:${Math.round(pos.x)}px;top:${Math.round(pos.y)}px;z-index:${t.zIndex};--row-card-scale:${t.scale};--row-card-rotation:${t.rotation}deg;`;
  }
  function rowHasPositionSticker(index) {
    const label = String((state.shortListPositionLabels || [])[index] || '').trim();
    const stickerCard = String((state.shortListPositionCardIds || [])[index] || '').trim();
    return !!(label || stickerCard);
  }
  function rowPositionPanelHtml(index, options = {}) {
    const position = String((state.shortListPositionLabels || [])[index] || '').trim();
    const stickerCardId = String((state.shortListPositionCardIds || [])[index] || '').trim();
    if (!position && !stickerCardId && !options.force) return '';
    const posClass = positionLengthClass(position);
    const stickerArt = positionStickerCardHtml(stickerCardId, index);
    return `<div class="card-row-position-panel${position ? '' : ' is-empty'}${posClass ? ' ' + posClass : ''}" data-row-position-target="${index}">${stickerArt}<span class="card-row-position-editor" contenteditable="true" role="textbox" aria-readonly="false" aria-label="Edit significance for position ${index + 1}" spellcheck="true" data-row-position-label-editor="${index}" data-placeholder="Position ${index + 1}">${position ? escapeHtml(position) : ''}</span></div>`;
  }
  function addCardPlaceholder() {
    if (state.rowLayoutLocked && !state.rowLayoutDesignMode) return;
    pushBoardUndo();
    const labels = (state.shortListPositionLabels || []).slice();
    const stickers = (state.shortListPositionCardIds || []).slice();
    const index = rowSlotCount();
    labels[index] = labels[index] || `Position ${index + 1}`;
    stickers[index] = stickers[index] || '';
    state.shortListPositionLabels = labels;
    state.shortListPositionCardIds = stickers;
    state.rowTransformTarget = index;
    // This creates a real position sticker/slot. The next drawn card fills this slot;
    // cards drawn without a prepared slot do not get a default sticker panel.
    renderShortList();
  }
  function resetCardRowLayout() {
    if (state.rowLayoutLocked && !state.rowLayoutDesignMode) return;
    pushBoardUndo();
    state.rowEnvelopeLayout = {};
    state.rowCardTransforms = {};
    state.rowTransformTarget = 0;
    renderShortList();
  }
  const PREFAB_CANVAS_WIDTH = 900;
  const PREFAB_CANVAS_HEIGHT = 760;
  function normalizedPrefabTransform(value = {}) {
    return {
      x: Math.max(0, Math.min(1, Number(value.x) || 0)),
      y: Math.max(0, Math.min(1, Number(value.y) || 0)),
      rotation: Math.max(-180, Math.min(180, Number(value.rotation) || 0)),
      scale: Math.max(.45, Math.min(2.5, Number(value.scale) || 1)),
      zIndex: Math.max(0, Math.min(100, Number(value.zIndex) || 1))
    };
  }
  function prefabPositionId(position, index) {
    const supplied = String(position?.id || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return supplied || `position-${index + 1}`;
  }
  function layoutSnapshotFromBoard(details = {}) {
    const count = rowSlotCount();
    const positions = Array.from({ length:count }, (_, index) => {
      const meta = state.rowPositionMeta?.[index] || {};
      const point = rowEnvelopePosition(index);
      const transform = rowCardTransform(index);
      const result = {
        id: prefabPositionId(meta, index),
        label: String(state.shortListPositionLabels?.[index] || `Position ${index + 1}`).trim().slice(0, 90),
        drawOrder: index + 1,
        transform: normalizedPrefabTransform({
          x:point.x / PREFAB_CANVAS_WIDTH,
          y:point.y / PREFAB_CANVAS_HEIGHT,
          rotation:transform.rotation,
          scale:transform.scale,
          zIndex:transform.zIndex
        })
      };
      ['role','covers','crosses'].forEach(key => { if (meta[key]) result[key] = String(meta[key]); });
      if (meta.openTransform) result.openTransform = normalizedPrefabTransform(meta.openTransform);
      return result;
    });
    return {
      version:1,
      id:String(details.id || state.rowActiveLayout?.id || 'active-layout'),
      name:String(details.name || state.rowActiveLayout?.name || 'Custom spread').trim().slice(0, 60),
      cardCount:positions.length,
      source:String(details.source || state.rowActiveLayout?.source || 'custom'),
      editable:details.editable !== false,
      basedOn:details.basedOn || state.rowActiveLayout?.basedOn || null,
      positions,
      rules:{
        allowReversals:!!state.rowAllowReversals,
        allowRepeats:!!state.rowAllowRepeats,
        drawScope:state.rowDrawScope || 'full'
      }
    };
  }
  function applyPrefabLayout(prefab, options = {}) {
    if (!prefab || !Array.isArray(prefab.positions) || !prefab.positions.length) return false;
    if ((state.shortList || []).length || (state.rowLayoutLocked && !state.rowLayoutDesignMode)) return false;
    pushBoardUndo();
    const positions = prefab.positions.slice().sort((a,b) => Number(a.drawOrder) - Number(b.drawOrder));
    state.shortList = [];
    state.shortListSelection = [];
    state.shortListPositionLabels = positions.map((position, index) => String(position.label || `Position ${index + 1}`).slice(0, 90));
    state.shortListPositionCardIds = positions.map(() => '');
    state.rowEnvelopeLayout = {};
    state.rowCardTransforms = {};
    state.rowPositionMeta = positions.map((position, index) => {
      const transform = normalizedPrefabTransform(position.canonicalTransform || position.transform);
      state.rowEnvelopeLayout[index] = { x:transform.x * PREFAB_CANVAS_WIDTH, y:transform.y * PREFAB_CANVAS_HEIGHT };
      state.rowCardTransforms[index] = { scale:transform.scale, rotation:transform.rotation, zIndex:transform.zIndex };
      return {
        id:prefabPositionId(position, index),
        role:position.role || '',
        covers:position.covers || '',
        crosses:position.crosses || '',
        openTransform:position.openTransform ? normalizedPrefabTransform(position.openTransform) : null
      };
    });
    state.rowActiveLayout = cloneBoardValue({
      ...prefab,
      cardCount:positions.length,
      positions:positions.map((position, index) => ({
        ...cloneBoardValue(position, {}),
        id:prefabPositionId(position, index),
        drawOrder:index + 1,
        transform:normalizedPrefabTransform(position.canonicalTransform || position.transform)
      }))
    }, null);
    state.rowLayoutDesignMode = !!options.designMode;
    state.rowLayoutLocked = !state.rowLayoutDesignMode;
    state.rowCenterOpen = false;
    state.rowTransformTarget = 0;
    state.rowPanX = 0;
    state.rowPanY = 0;
    const rules = prefab.rules || {};
    state.rowAllowReversals = rules.allowReversals !== false;
    state.rowAllowRepeats = !!rules.allowRepeats;
    state.rowDrawScope = rules.drawScope || 'full';
    resetRowDrawDeck();
    const maxX = Math.max(...positions.map((position, index) => {
      const transform = normalizedPrefabTransform(position.canonicalTransform || position.transform);
      return transform.x * PREFAB_CANVAS_WIDTH + CARD_ROW_ENVELOPE_W * transform.scale;
    }), CARD_ROW_ENVELOPE_W);
    state.rowZoom = Math.max(.45, Math.min(1, (cardRowAvailableWidth() - 24) / Math.max(maxX, 1)));
    renderShortList();
    return true;
  }
  function finishPrefabDesign(details = {}) {
    if (!state.rowLayoutDesignMode || (state.shortList || []).length) return null;
    state.rowActiveLayout = layoutSnapshotFromBoard(details);
    state.rowPositionMeta = state.rowActiveLayout.positions.map(position => ({
      id:position.id,
      role:position.role || '',
      covers:position.covers || '',
      crosses:position.crosses || '',
      openTransform:position.openTransform || null
    }));
    state.rowLayoutDesignMode = false;
    state.rowLayoutLocked = true;
    state.rowCenterOpen = false;
    renderShortList();
    return cloneBoardValue(state.rowActiveLayout, null);
  }
  function removePrefabPosition(index) {
    if (!state.rowLayoutDesignMode || (state.shortList || []).length) return false;
    const target = Math.max(0, Math.min(rowSlotCount() - 1, Number(index) || 0));
    pushBoardUndo();
    state.shortListPositionLabels.splice(target, 1);
    state.shortListPositionCardIds.splice(target, 1);
    state.rowPositionMeta.splice(target, 1);
    const shift = value => Object.fromEntries(Object.entries(value || {}).flatMap(([key, item]) => {
      const numeric = Number(key);
      if (numeric === target) return [];
      return [[String(numeric > target ? numeric - 1 : numeric), item]];
    }));
    state.rowEnvelopeLayout = shift(state.rowEnvelopeLayout);
    state.rowCardTransforms = shift(state.rowCardTransforms);
    state.rowEnvelopeArt = shift(state.rowEnvelopeArt);
    state.rowTransformTarget = Math.max(0, Math.min(target, rowSlotCount() - 1));
    renderShortList();
    return true;
  }
  function drawingBoardPrefabState() {
    return cloneBoardValue({
      designMode:!!state.rowLayoutDesignMode,
      locked:!!state.rowLayoutLocked,
      hasCards:!!(state.shortList || []).length,
      slotCount:rowSlotCount(),
      transformTarget:rowTransformTargetIndex(),
      centerOpen:!!state.rowCenterOpen,
      activeLayout:state.rowActiveLayout,
      currentLayout:layoutSnapshotFromBoard()
    }, {});
  }
  window.RelphiDrawingBoardPrefabsBridge = Object.freeze({
    applyLayout:applyPrefabLayout,
    captureLayout:layoutSnapshotFromBoard,
    finishDesign:finishPrefabDesign,
    removePosition:removePrefabPosition,
    getState:drawingBoardPrefabState,
    setCenterOpen(value) {
      state.rowCenterOpen = !!value;
      document.dispatchEvent(new CustomEvent('relphi:drawing-board-center-view', { detail:{ open:state.rowCenterOpen } }));
      return state.rowCenterOpen;
    },
    refresh:renderShortList
  });
  function rowEnvelopeArtFor(index) { return state.rowEnvelopeArt?.[index] || ''; }
  function setRowEnvelopeArt(index, dataUrl) {
    if (!Number.isInteger(Number(index)) || Number(index) < 0) return;
    state.rowEnvelopeArt ||= {};
    if (dataUrl) state.rowEnvelopeArt[Number(index)] = dataUrl; else delete state.rowEnvelopeArt[Number(index)];
    renderShortList();
  }
  function rowCustomArtTargetOptions(items, rowSlots = rowSlotCount(items.length)) {
    const options = [];
    const seen = new Set();
    items.forEach((card, index) => {
      if (!card || seen.has(card.card_id)) return;
      seen.add(card.card_id);
      options.push(`<option value="card:${escapeHtml(card.card_id)}" ${state.rowCustomArtTarget === 'card:' + card.card_id ? 'selected' : ''}>Card ${index + 1}: ${escapeHtml(title(card))}</option>`);
    });
    for (let i = 0; i < rowSlots; i++) {
      const value = `slot:${i}`;
      options.push(`<option value="${escapeHtml(value)}" ${state.rowCustomArtTarget === value ? 'selected' : ''}>Envelope ${i + 1}${rowEnvelopeArtFor(i) ? ' · custom art' : ''}</option>`);
    }
    return options.join('');
  }
  function applyRowArtTarget(targetValue, dataUrl) {
    const target = String(targetValue || '').trim();
    if (target.startsWith('card:')) return setCustomCardArt(target.slice(5), dataUrl);
    if (target.startsWith('slot:')) return setRowEnvelopeArt(Number(target.slice(5)), dataUrl);
  }
  function imageFileFromTransfer(dataTransfer) {
    const files = Array.from(dataTransfer?.files || []);
    return files.find(file => String(file.type || '').startsWith('image/')) || null;
  }
  function readImageFile(file, callback) {
    if (!file) return false;
    const reader = new FileReader();
    reader.onload = () => callback(String(reader.result || ''));
    reader.readAsDataURL(file);
    return true;
  }
  function setCustomCardArt(cardId, dataUrl) {
    if (!cardId || !cardById(cardId)) return;
    state.customCardArt ||= {};
    if (dataUrl) state.customCardArt[cardId] = dataUrl; else delete state.customCardArt[cardId];
    customCardArtStore = { ...(state.customCardArt || {}) };
    writeCustomCardArtStore(customCardArtStore);
    refreshShortListViews();
  }
  function bindRowCustomArtUpload(items) {
    const fileInput = $('rowCustomArtFile');
    const target = $('rowCustomArtTarget');
    const uploadBtn = $('rowCustomArtUpload');
    const resetBtn = $('rowCustomArtReset');
    if (target) target.addEventListener('change', () => { state.rowCustomArtTarget = target.value || ''; });
    if (uploadBtn && fileInput) uploadBtn.addEventListener('click', event => { event.preventDefault(); fileInput.click(); });
    if (fileInput) fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      const chosen = target?.value || (items[0]?.card_id ? 'card:' + items[0].card_id : 'slot:0');
      if (!file || !chosen) return;
      readImageFile(file, dataUrl => applyRowArtTarget(chosen, dataUrl));
      fileInput.value = '';
    });
    if (resetBtn) resetBtn.addEventListener('click', event => { event.preventDefault(); const chosen = target?.value || ''; if (chosen) applyRowArtTarget(chosen, ''); });
  }
  function bindCardRowEnvelopeMovement(wrap) {
    const board = wrap.querySelector('.short-list-row.card-row-board');
    if (!board) return;
    qsa('.card-row-item[data-row-index]', board).forEach(item => {
      item.addEventListener('pointerdown', event => {
        if (event.button !== 0) return;
        if (event.target.closest?.('input, textarea, select, label, [data-row-transform-handle], .card-row-position-editor, .or-card-layer, .relphi-info-layer, .relphi-info-scroll')) return;
        event.preventDefault();
        event.stopPropagation();
        const index = Number(item.dataset.rowIndex) || 0;
        state.rowTransformTarget = index;
        const start = rowEnvelopePosition(index);
        const startX = event.clientX;
        const startY = event.clientY;
        const zoom = rowZoomValue();
        item.classList.add('is-moving');
        item.setPointerCapture?.(event.pointerId);
        const move = moveEvent => {
          const nextX = Math.max(0, start.x + (moveEvent.clientX - startX) / zoom);
          const nextY = Math.max(0, start.y + (moveEvent.clientY - startY) / zoom);
          const liveX = state.rowSnapEnabled ? snapRowCoord(nextX, 'x') : nextX;
          const liveY = state.rowSnapEnabled ? snapRowCoord(nextY, 'y') : nextY;
          item.style.left = `${Math.round(liveX)}px`;
          item.style.top = `${Math.round(liveY)}px`;
        };
        const up = upEvent => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          const nextX = Math.max(0, start.x + (upEvent.clientX - startX) / zoom);
          const nextY = Math.max(0, start.y + (upEvent.clientY - startY) / zoom);
          setRowEnvelopePosition(index, nextX, nextY);
          item.classList.remove('is-moving');
          renderShortList();
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up, { once: true });
      });
    });
  }
  function bindCardRowWorkspacePan(wrap) {
    const workspace = wrap.querySelector('.card-row-workspace');
    const board = wrap.querySelector('.short-list-row.card-row-board');
    if (!workspace || !board) return;
    if (!workspace.dataset.resizeBound) {
      workspace.dataset.resizeBound = '1';
      window.addEventListener('resize', () => applyCardRowLayoutLive(wrap));
    }
    workspace.addEventListener('wheel', event => {
      // Two-finger trackpad scrolling should scroll the page/area, not zoom the table.
      // Trackpad pinch-to-zoom is reported by Chromium/Edge as a wheel event with ctrlKey.
      // Some platforms use metaKey for zoom gestures, so accept either modifier.
      const pinchZoomGesture = !!(event.ctrlKey || event.metaKey);
      if (!pinchZoomGesture) return;
      event.preventDefault();
      const current = rowZoomValue();
      const delta = event.deltaY < 0 ? 0.08 : -0.08;
      state.rowZoom = Math.max(.45, Math.min(2.4, current + delta));
      const zoomInput = $('rowZoom');
      const zoomValue = $('rowZoomValue');
      if (zoomInput) zoomInput.value = String(rowZoomValue());
      if (zoomValue) zoomValue.textContent = `${Math.round(rowZoomValue() * 100)}%`;
      applyCardRowLayoutLive(wrap);
    }, { passive: false });
    workspace.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      const interactive = event.target.closest?.('button, input, textarea, select, label, .card-row-item');
      if (interactive) return;
      event.preventDefault();
      const startX = event.clientX;
      const startY = event.clientY;
      const panStartX = rowPanXValue();
      const panStartY = rowPanYValue();
      workspace.classList.add('is-panning');
      workspace.setPointerCapture?.(event.pointerId);
      const move = moveEvent => {
        state.rowPanX = panStartX + (moveEvent.clientX - startX);
        state.rowPanY = panStartY + (moveEvent.clientY - startY);
        board.style.cssText = cardRowBoardStyle(rowSlotCount());
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        workspace.classList.remove('is-panning');
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up, { once: true });
    });
  }

  function applyCardRowLayoutLive(wrap = $('shortListPanel')) {
    if (!wrap) return;
    const board = wrap.querySelector('.short-list-row.card-row-board');
    if (!board) return;
    const slots = rowSlotCount();
    const workspace = wrap.querySelector('.card-row-workspace');
    if (workspace) workspace.style.cssText = cardRowWorkspaceStyle(slots);
    board.style.cssText = cardRowBoardStyle(slots);
    qsa(':scope > .card-row-item[data-row-index]', board).forEach(item => {
      item.style.cssText = cardRowItemStyle(Number(item.dataset.rowIndex) || 0);
    });
  }

  function rowCardEnvelopeHtml(card, index, panel) {
    const selected = state.shortListSelection.includes(card.card_id);
    const transformTarget = index === rowTransformTargetIndex(rowSlotCount());
    const transform = rowCardTransform(index);
    const miniDescription = Number(transform?.scale) > 0 && Number(transform.scale) < 0.72;
    const reversed = rowCardIsReversed(index);
    let cardHtml = renderCardSurface(card, {
      context: 'short-list',
      selected,
      positionLabel: '',
      selectable: true,
      layerText: rowCardInterpretation(card, index),
      layerTitle: `${title(card)}${reversed ? ' · Reversed' : ''}`
    });
    cardHtml = cardHtml.replace('<article class="or-card', `<article class="or-card card-row-card${reversed ? ' is-row-reversed' : ''}`);
    cardHtml = cardHtml.replace(' tabindex="0">', ` draggable="true" data-row-card="${escapeHtml(card.card_id)}" data-row-reversed="${reversed ? 'true' : 'false'}" tabindex="0" aria-label="${escapeHtml(title(card))}${reversed ? ', reversed' : ''}">`);
    const reverseLabel = reversed ? 'Set card upright' : 'Reverse card';
    const reverseButton = `<button class="card-row-reverse-toggle${reversed ? ' is-active' : ''}" type="button" data-row-reverse="${index}" aria-pressed="${reversed ? 'true' : 'false'}" title="${escapeHtml(reverseLabel)}" aria-label="${escapeHtml(reverseLabel + ': ' + title(card))}">↕</button>`;
    const transformHandles = `<span class="card-row-transform-box" aria-hidden="true"><span class="card-row-scale-handle card-row-scale-handle--nw" data-row-transform-handle="scale" data-corner="nw"></span><span class="card-row-rotate-handle card-row-rotate-handle--ne" data-row-transform-handle="rotate" data-corner="ne"></span><span class="card-row-scale-handle card-row-scale-handle--sw" data-row-transform-handle="scale" data-corner="sw"></span><span class="card-row-scale-handle card-row-scale-handle--se" data-row-transform-handle="scale" data-corner="se"></span></span>`;
    return `<div class="card-row-item${selected ? ' is-row-selected' : ''}${transformTarget ? ' is-transform-target' : ''}${miniDescription ? ' is-description-mini' : ''}${reversed ? ' is-row-reversed' : ''}" data-row-index="${index}" style="${cardRowItemStyle(index)}">${panel}<div class="card-row-card-wrap">${cardHtml}${reverseButton}${transformHandles}</div>${cardSensePanelHtml(card, index)}</div>`;
  }

  function bindCardRowDirectTransform(wrap) {
    const board = wrap.querySelector('.short-list-row.card-row-board');
    if (!board) return;
    qsa('[data-row-transform-handle]', board).forEach(handle => {
      handle.addEventListener('pointerdown', event => {
        if (event.button !== 0) return;
        const item = handle.closest('.card-row-item[data-row-index]');
        if (!item) return;
        event.preventDefault();
        event.stopPropagation();
        const index = Number(item.dataset.rowIndex) || 0;
        state.rowTransformTarget = index;
        const mode = handle.dataset.rowTransformHandle;
        const start = rowCardTransform(index);
        const rect = item.getBoundingClientRect();
        const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        const startPointer = { x: event.clientX, y: event.clientY };
        const startDistance = Math.max(8, Math.hypot(startPointer.x - center.x, startPointer.y - center.y));
        const startAngle = Math.atan2(startPointer.y - center.y, startPointer.x - center.x) * 180 / Math.PI;
        item.classList.add(mode === 'rotate' ? 'is-rotating' : 'is-scaling');
        handle.setPointerCapture?.(event.pointerId);
        const move = moveEvent => {
          if (mode === 'scale') {
            const distance = Math.max(8, Math.hypot(moveEvent.clientX - center.x, moveEvent.clientY - center.y));
            const nextScale = Math.max(.45, Math.min(2.5, start.scale * (distance / startDistance)));
            setRowCardTransform(index, { scale: nextScale });
          } else {
            const angle = Math.atan2(moveEvent.clientY - center.y, moveEvent.clientX - center.x) * 180 / Math.PI;
            let nextRotation = start.rotation + (angle - startAngle);
            while (nextRotation > 180) nextRotation -= 360;
            while (nextRotation < -180) nextRotation += 360;
            if (state.rowRotationSnapEnabled || moveEvent.shiftKey) { const step = rowRotationSnapDegrees(); nextRotation = Math.round(nextRotation / step) * step; }
            setRowCardTransform(index, { rotation: nextRotation });
          }
          item.style.cssText = cardRowItemStyle(index);
        };
        const up = () => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          item.classList.remove('is-scaling', 'is-rotating');
          try { handle.releasePointerCapture?.(event.pointerId); } catch (error) {}
          document.body.style.cursor = '';
          renderShortList();
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up, { once: true });
      });
    });
  }

  function renderShortList() {
    const wrap = $('shortListPanel');
    if (!wrap) return;
    const boardDrawerWasOpen = wrap.querySelector('.card-row-drawing-board')?.open;
    const optionsWasOpen = wrap.querySelector('.card-row-more-options')?.open;
    const items = state.shortList.map(cardById).filter(Boolean);
    state.shortListSelection = state.shortListSelection.filter(id => state.shortList.includes(id));
    const selectedItems = state.shortListSelection.map(cardById).filter(Boolean);
    wrap.hidden = false;
    const positionValue = state.shortListPositionLabels.join(', ');
    const rowName = state.shortListName || '';
    const rowNotes = state.shortListNotes || '';
    const rowZoom = rowZoomValue();
    const rowSlots = rowSlotCount(items.length);
    const transformTarget = rowTransformTargetIndex(rowSlots);
    const transformValue = rowCardTransform(transformTarget);
    const transformOptions = Array.from({ length: rowSlots }, (_, i) => {
      const card = items[i];
      const label = card ? `Card ${i + 1}: ${title(card)}` : `Position ${i + 1}`;
      return `<option value="${i}" ${transformTarget === i ? 'selected' : ''}>${escapeHtml(label)}</option>`;
    }).join('');
    const drawScope = state.rowDrawScope || 'full';
    const pileIsShuffled = !!state.rowShuffled;
    const option = (value, label) => `<option value="${value}" ${drawScope === value ? 'selected' : ''}>${label}</option>`;
    const displaySlots = rowSlots;
    const boardDrawerOpen = boardDrawerWasOpen !== false || state.cardRowBoardOpen;
    const optionsOpen = !!(optionsWasOpen || state.cardRowSettingsOpen);
    const boardHtml = `${items.length ? rowStatsHtml(items, selectedItems) : '<p class="short-list-empty card-row-board-empty">Draw a card or add placeholders. The board is ready.</p>'}<div class="card-row-workspace" style="${cardRowWorkspaceStyle(displaySlots)}" aria-label="Pan-and-zoom Drawing Board workspace"><div class="card-row-workspace-toolbar"><label class="card-row-zoom-label" title="Zoom the board">Zoom <input id="rowZoom" type="range" min="0.45" max="2.4" step="0.01" value="${rowZoom}"><span id="rowZoomValue">${Math.round(rowZoom * 100)}%</span></label><button type="button" id="resetCardRowPan" title="Center the Drawing Board">Center</button><span class="card-row-pan-note">Drag the table background to pan. Position stickers appear only when you add a placeholder or type a sticker.</span></div><div class="short-list-row card-row-board" style="${cardRowBoardStyle(displaySlots)}" aria-label="Movable Drawing Board">${Array.from({ length: displaySlots }).map((_, i) => { const card = items[i]; const envelopeArt = rowEnvelopeArtFor(i); const panel = rowPositionPanelHtml(i, { force: !card }); if (card) { return rowCardEnvelopeHtml(card, i, panel); } return `<div class="card-row-item card-row-placeholder-item" data-row-index="${i}" data-row-placeholder="${i}" style="${cardRowItemStyle(i)}">${panel}<div class="card-row-drop-card${envelopeArt ? ' has-custom-envelope-art' : ''}" tabindex="0">${envelopeArt ? `<img src="${escapeHtml(envelopeArt)}" alt="Custom placeholder art for position ${i + 1}">` : '<span class="card-row-drop-card-inner">Position placeholder</span>'}</div></div>`; }).join('')}</div></div>`;
    const moreOptionsHtml = `<details class="card-row-more-options card-row-settings-panel"><summary>More Board Options</summary><div class="card-row-tools card-row-composer"><label class="card-row-name-label">Name <input id="rowName" type="text" value="${escapeHtml(rowName)}" placeholder="Reading name"></label><label class="card-row-position-label">Position stickers <input id="rowPositionLabels" type="text" list="rowStickerPresetList" value="${escapeHtml(positionValue)}" placeholder="Type stickers, or choose a spread…"><datalist id="rowStickerPresetList">${STICKER_PRESETS.map(preset => `<option value="${escapeHtml(stickerPresetDisplay(preset))}">${escapeHtml(preset.labels.join(', '))}</option>`).join('')}</datalist></label><label class="card-row-draw-scope-label">Pack <select id="rowDrawScope">${option('full','Full Pack')}${option('shown','Shown cards')}${option('uhn','Universal Human Needs')}${option('majors','Majors')}${option('planetary-majors','Planetary Majors')}${option('zodiac-majors','Zodiac Majors')}${option('aces','Aces')}${option('courts','Courts')}${option('pips','Pips')}${option('decans','Decan pips')}${option('wands','Wands')}${option('cups','Cups')}${option('swords','Swords')}${option('pentacles','Pentacles / Disks')}</select></label><label class="spread-toggle"><input id="rowAllowRepeats" type="checkbox" ${state.rowAllowRepeats ? 'checked' : ''}> Repeats</label><label class="spread-toggle"><input id="rowSnapEnabled" type="checkbox" ${state.rowSnapEnabled ? 'checked' : ''}> Align</label><label class="spread-toggle"><input id="rowRotationSnapEnabled" type="checkbox" ${state.rowRotationSnapEnabled ? 'checked' : ''}> Rotation snap</label><span class="card-row-snap-steppers"><button type="button" id="rowSnapGridMinus" aria-label="Smaller alignment snap">−</button><span id="rowSnapGridValue">${escapeHtml(rowSnapGrid().label)}</span><button type="button" id="rowSnapGridPlus" aria-label="Larger alignment snap">+</button><button type="button" id="rowRotationSnapMinus" aria-label="Smaller rotation snap">−</button><span id="rowRotationSnapValue">${rowRotationSnapDegrees()}°</span><button type="button" id="rowRotationSnapPlus" aria-label="Larger rotation snap">+</button></span><label class="card-row-color-label">Placeholder color <input id="rowEnvelopeColor" type="color" value="${escapeHtml(state.rowEnvelopeColor || '#f3f0ea')}"></label><label class="card-row-table-color-label">Table <input id="rowTableColor" type="color" value="${escapeHtml(state.rowTableColor || '#fffaf0')}"></label><button type="button" id="rowTableImageUpload">Upload table image</button><button type="button" id="rowTableImageReset" ${state.rowTableImage ? '' : 'disabled'}>Reset table</button><button type="button" id="resetCardRowLayout" ${displaySlots ? '' : 'disabled'}>Reset layout</button><button type="button" id="resetRowCardTransform" ${displaySlots ? '' : 'disabled'}>Reset selected card</button><button type="button" id="selectAllRow" ${items.length ? '' : 'disabled'}>Select all</button><button type="button" id="clearRowSelection" ${state.shortListSelection.length ? '' : 'disabled'}>Clear selection</button><button type="button" id="snapshotCardRowArrangement" ${displaySlots ? '' : 'disabled'}>Snapshot</button><button type="button" id="downloadRowHtml" ${items.length ? '' : 'disabled'}>Board with art</button><button type="button" id="downloadRowTextHtml" ${items.length ? '' : 'disabled'}>Text only</button><button type="button" id="downloadRowJson" ${items.length ? '' : 'disabled'}>Board data</button><button type="button" id="printCardRowImage" ${items.length ? '' : 'disabled'}>Image</button><label class="card-row-notes-label">Notes <textarea id="rowNotes" rows="1" placeholder="Board notes">${escapeHtml(rowNotes)}</textarea></label><input id="rowTableImageFile" type="file" accept="image/*" hidden></div></details>`;
    wrap.innerHTML = `<details class="short-list-drawer card-row-drawing-board"><summary><strong>Drawing Board <span class="card-row-count">${items.length}</span></strong><span class="short-list-actions card-row-icon-toolbar" aria-label="Drawing Board quick actions"><button type="button" id="drawRandomRowCard" title="Draw random card" aria-label="Draw random card">Draw</button><button type="button" id="addCardPlaceholder" title="Add placeholder" aria-label="Add placeholder">Add placeholder</button><label class="quick-reversal-toggle" title="Allow reversed cards in future draws"><input id="rowAllowReversalsQuick" type="checkbox" ${state.rowAllowReversals ? 'checked' : ''}> Reversals</label><button type="button" id="undoShortList" ${state.shortListUndo.length ? '' : 'disabled'} title="Undo" aria-label="Undo">Undo</button><button type="button" id="redoShortList" ${state.shortListRedo.length ? '' : 'disabled'} title="Redo" aria-label="Redo">Redo</button><button type="button" id="clearShortList" ${displaySlots ? '' : 'disabled'} title="Clear board" aria-label="Clear Drawing Board">Clear</button></span></summary>${moreOptionsHtml}${boardHtml}</details>`;
    const renderedBoardDrawer = wrap.querySelector('.card-row-drawing-board');
    if (renderedBoardDrawer) {
      renderedBoardDrawer.open = boardDrawerOpen;
      renderedBoardDrawer.addEventListener('toggle', () => { state.cardRowBoardOpen = renderedBoardDrawer.open; });
    }
    const renderedOptionsDrawer = wrap.querySelector('.card-row-more-options');
    if (renderedOptionsDrawer) {
      renderedOptionsDrawer.open = optionsOpen;
      renderedOptionsDrawer.addEventListener('toggle', () => { state.cardRowSettingsOpen = renderedOptionsDrawer.open; });
    }
    prepareExamplePlaceholders(wrap);
    bindCardRowEnvelopeMovement(wrap);
    bindCardRowWorkspacePan(wrap);
    bindCardRowDirectTransform(wrap);
    // Keep the per-card orientation toggle independent from board dragging/transform layers.
    // This delegated capture handler catches the small flip control before card selection,
    // panning, or transform affordances can swallow the click.
    wrap.addEventListener('pointerdown', event => {
      const button = event.target.closest?.('[data-row-reverse]');
      if (!button || !wrap.contains(button)) return;
      event.preventDefault();
      event.stopPropagation();
    }, { capture:true });
    wrap.addEventListener('click', event => {
      const button = event.target.closest?.('[data-row-reverse]');
      if (!button || !wrap.contains(button)) return;
      event.preventDefault();
      event.stopPropagation();
      toggleRowCardReversal(button.dataset.rowReverse);
    }, { capture:true });
    const clear = $('clearShortList');
    if (clear) clear.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      pushBoardUndo();
      state.shortListName = '';
      state.shortListNotes = '';
      state.shortListPositionLabels = [];
      state.shortListPositionCardIds = [];
      state.rowCardReversals = {};
      state.rowSenseSelections = {};
      state.rowSenseNotes = {};
      state.rowEnvelopeLayout = {};
      state.rowCardTransforms = {};
      state.rowActiveLayout = null;
      state.rowPositionMeta = [];
      state.rowLayoutDesignMode = false;
      state.rowLayoutLocked = false;
      state.rowDrawScope = 'full';
      state.rowAllowRepeats = false;
      state.rowAllowReversals = true;
      state.rowCenterOpen = false;
      state.rowEnvelopeArt = {};
      state.rowEnvelopeColor = '#f3f0ea';
      state.rowTableColor = '#fffaf0';
      state.rowTableImage = '';
      state.rowPanX = 0;
      state.rowPanY = 0;
      state.rowTransformTarget = 0;
      state.shortListSelection = [];
      state.shortList = [];
      state.customCardArt = {};
      customCardArtStore = {};
      writeCustomCardArtStore(customCardArtStore);
      resetRowDrawDeck();
      refreshShortListViews();
    });
    const undo = $('undoShortList');
    if (undo) undo.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); undoShortList(); });
    const redo = $('redoShortList');
    if (redo) redo.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); redoShortList(); });
    const toggle = $('toggleRowSelect');
    if (toggle) toggle.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); state.shortListSelectMode = !state.shortListSelectMode; renderShortList(); });
    const selectAll = $('selectAllRow');
    if (selectAll) selectAll.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); state.shortListSelection = items.map(card => card.card_id); state.shortListSelectMode = true; renderShortList(); });
    const clearSel = $('clearRowSelection');
    if (clearSel) clearSel.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); state.shortListSelection = []; renderShortList(); });
    const dlHtml = $('downloadRowHtml'); if (dlHtml) dlHtml.addEventListener('click', downloadShortListHtml);
    const dlTextHtml = $('downloadRowTextHtml'); if (dlTextHtml) dlTextHtml.addEventListener('click', downloadShortListTextHtml);
    const dlJson = $('downloadRowJson'); if (dlJson) dlJson.addEventListener('click', downloadShortListJson);
    const printBtn = $('printCardRowImage'); if (printBtn) printBtn.addEventListener('click', openCardRowPrintDialog);
    const rowNameInput = $('rowName');
    if (rowNameInput) {
      rowNameInput.addEventListener('input', () => { state.shortListName = rowNameInput.value.trim().slice(0, 80); });
      rowNameInput.addEventListener('change', () => { state.shortListName = rowNameInput.value.trim().slice(0, 80); renderShortList(); });
    }
    const rowNotesInput = $('rowNotes');
    if (rowNotesInput) {
      rowNotesInput.addEventListener('input', () => { state.shortListNotes = rowNotesInput.value.slice(0, 4000); });
      rowNotesInput.addEventListener('change', () => { state.shortListNotes = rowNotesInput.value.slice(0, 4000); });
    }
    const resetPanBtn = $('resetCardRowPan');
    if (resetPanBtn) resetPanBtn.addEventListener('click', event => { event.preventDefault(); state.rowPanX = 0; state.rowPanY = 0; applyCardRowLayoutLive(wrap); });
    const zoomInput = $('rowZoom');
    if (zoomInput) {
      zoomInput.addEventListener('input', () => {
        state.rowZoom = Math.max(.45, Math.min(2.4, Number(zoomInput.value) || 1));
        const zoomValue = $('rowZoomValue');
        if (zoomValue) zoomValue.textContent = `${Math.round(rowZoomValue() * 100)}%`;
        applyCardRowLayoutLive(wrap);
      });
      zoomInput.addEventListener('change', () => {
        state.rowZoom = Math.max(.45, Math.min(2.4, Number(zoomInput.value) || 1));
        applyCardRowLayoutLive(wrap);
      });
    }
    const colorInput = $('rowEnvelopeColor');
    if (colorInput) colorInput.addEventListener('input', () => { state.rowEnvelopeColor = colorInput.value || '#f3f0ea'; const board = wrap.querySelector('.card-row-board'); if (board) { board.style.setProperty('--relphi-envelope-bg', state.rowEnvelopeColor); board.style.setProperty('--relphi-card-envelope-bg', state.rowEnvelopeColor); } });
    if (colorInput) colorInput.addEventListener('change', () => { state.rowEnvelopeColor = colorInput.value || '#f3f0ea'; renderShortList(); });
    const tableColorInput = $('rowTableColor');
    if (tableColorInput) tableColorInput.addEventListener('input', () => { state.rowTableColor = tableColorInput.value || '#fffaf0'; const board = wrap.querySelector('.card-row-board'); if (board) board.style.setProperty('--row-table-bg', state.rowTableColor); });
    if (tableColorInput) tableColorInput.addEventListener('change', () => { state.rowTableColor = tableColorInput.value || '#fffaf0'; renderShortList(); });
    const tableImageFile = $('rowTableImageFile');
    const tableImageUpload = $('rowTableImageUpload');
    const tableImageReset = $('rowTableImageReset');
    if (tableImageUpload && tableImageFile) tableImageUpload.addEventListener('click', event => { event.preventDefault(); tableImageFile.click(); });
    if (tableImageFile) tableImageFile.addEventListener('change', () => {
      const file = tableImageFile.files?.[0];
      if (!file) return;
      readImageFile(file, dataUrl => { state.rowTableImage = dataUrl; renderShortList(); });
      tableImageFile.value = '';
    });
    if (tableImageReset) tableImageReset.addEventListener('click', event => { event.preventDefault(); state.rowTableImage = ''; renderShortList(); });
    const snapInput = $('rowSnapEnabled');
    if (snapInput) snapInput.addEventListener('change', () => { state.rowSnapEnabled = snapInput.checked; renderShortList(); });
    const stepAlignSnap = direction => { const current = rowSnapGridValue(); state.rowSnapGrid = stepValueInList(CARD_ROW_SNAP_ORDER, current, direction); renderShortList(); };
    const snapMinus = $('rowSnapGridMinus'); if (snapMinus) snapMinus.addEventListener('click', event => { event.preventDefault(); stepAlignSnap(-1); });
    const snapPlus = $('rowSnapGridPlus'); if (snapPlus) snapPlus.addEventListener('click', event => { event.preventDefault(); stepAlignSnap(1); });
    const rotSnapInput = $('rowRotationSnapEnabled');
    if (rotSnapInput) rotSnapInput.addEventListener('change', () => { state.rowRotationSnapEnabled = rotSnapInput.checked; renderShortList(); });
    const stepRotationSnap = direction => { state.rowRotationSnapDegrees = stepValueInList(CARD_ROW_ROTATION_SNAP_STEPS, rowRotationSnapDegrees(), direction); renderShortList(); };
    const rotMinus = $('rowRotationSnapMinus'); if (rotMinus) rotMinus.addEventListener('click', event => { event.preventDefault(); stepRotationSnap(-1); });
    const rotPlus = $('rowRotationSnapPlus'); if (rotPlus) rotPlus.addEventListener('click', event => { event.preventDefault(); stepRotationSnap(1); });
    const transformTargetInput = $('rowTransformTarget');
    const transformScaleInput = $('rowTransformScale');
    const transformScaleValue = $('rowTransformScaleValue');
    const transformRotationInput = $('rowTransformRotation');
    const transformRotationValue = $('rowTransformRotationValue');
    const resetTransformBtn = $('resetRowCardTransform');
    const syncTransformControls = () => {
      const targetIndex = rowTransformTargetIndex(rowSlots);
      const transform = rowCardTransform(targetIndex);
      if (transformTargetInput) transformTargetInput.value = String(targetIndex);
      if (transformScaleInput) transformScaleInput.value = String(transform.scale);
      if (transformScaleValue) transformScaleValue.textContent = `${Math.round(transform.scale * 100)}%`;
      if (transformRotationInput) transformRotationInput.value = String(Math.round(transform.rotation));
      if (transformRotationValue) transformRotationValue.textContent = `${Math.round(transform.rotation)}°`;
    };
    const applyTransformLive = () => {
      const targetIndex = rowTransformTargetIndex(rowSlots);
      const item = wrap.querySelector(`.card-row-item[data-row-index="${targetIndex}"]`);
      if (item) item.style.cssText = cardRowItemStyle(targetIndex);
      const board = wrap.querySelector('.short-list-row.card-row-board');
      const workspace = wrap.querySelector('.card-row-workspace');
      if (board) board.style.cssText = cardRowBoardStyle(rowSlots);
      if (workspace) workspace.style.cssText = cardRowWorkspaceStyle(rowSlots);
    };
    if (transformTargetInput) transformTargetInput.addEventListener('change', () => {
      state.rowTransformTarget = Number(transformTargetInput.value) || 0;
      syncTransformControls();
    });
    if (transformScaleInput) transformScaleInput.addEventListener('input', () => {
      const index = rowTransformTargetIndex(rowSlots);
      setRowCardTransform(index, { scale: Number(transformScaleInput.value) || 1 });
      if (transformScaleValue) transformScaleValue.textContent = `${Math.round(rowCardTransform(index).scale * 100)}%`;
      applyTransformLive();
    });
    if (transformScaleInput) transformScaleInput.addEventListener('change', () => renderShortList());
    if (transformRotationInput) transformRotationInput.addEventListener('input', () => {
      const index = rowTransformTargetIndex(rowSlots);
      setRowCardTransform(index, { rotation: Number(transformRotationInput.value) || 0 });
      if (transformRotationValue) transformRotationValue.textContent = `${Math.round(rowCardTransform(index).rotation)}°`;
      applyTransformLive();
    });
    if (transformRotationInput) transformRotationInput.addEventListener('change', () => renderShortList());
    if (resetTransformBtn) resetTransformBtn.addEventListener('click', event => {
      event.preventDefault();
      const index = rowTransformTargetIndex(rowSlots);
      resetRowCardTransform(index);
      renderShortList();
    });
    const addPlaceholderBtn = $('addCardPlaceholder'); if (addPlaceholderBtn) addPlaceholderBtn.addEventListener('click', addCardPlaceholder);
    const resetLayoutBtn = $('resetCardRowLayout'); if (resetLayoutBtn) resetLayoutBtn.addEventListener('click', resetCardRowLayout);
    const snapshotArrangementBtn = $('snapshotCardRowArrangement'); if (snapshotArrangementBtn) snapshotArrangementBtn.addEventListener('click', downloadCardRowArrangementSnapshot);
    const labels = $('rowPositionLabels');
    if (labels) {
      labels.addEventListener('input', () => {
        const preset = stickerPresetForValue(labels.value);
        if (!preset) state.shortListPositionLabels = parsePositionLabels(labels.value);
      });
      labels.addEventListener('change', () => {
        const preset = stickerPresetForValue(labels.value);
        pushBoardUndo();
        state.shortListPositionLabels = preset ? preset.labels.slice() : parsePositionLabels(labels.value);
        renderShortList();
      });
    }
    const scope = $('rowDrawScope'); if (scope) scope.addEventListener('change', () => { state.rowDrawScope = scope.value; resetRowDrawDeck(); renderShortList(); });
    const repeats = $('rowAllowRepeats'); if (repeats) repeats.addEventListener('change', () => { state.rowAllowRepeats = repeats.checked; resetRowDrawDeck(); renderShortList(); });
    const reversals = $('rowAllowReversals'); if (reversals) reversals.addEventListener('change', () => { state.rowAllowReversals = reversals.checked; resetRowDrawDeck(); renderShortList(); });
    const quickReversals = $('rowAllowReversalsQuick'); if (quickReversals) quickReversals.addEventListener('change', () => { state.rowAllowReversals = quickReversals.checked; resetRowDrawDeck(); renderShortList(); });
    qsa('[data-row-reverse]', wrap).forEach(button => button.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); toggleRowCardReversal(button.dataset.rowReverse); }));
    qsa('[data-row-sense-input]', wrap).forEach(input => {
      const syncPhrase = () => {
        const index = Number(input.dataset.rowSenseInput) || 0;
        const cardId = input.dataset.rowSenseCardId || state.shortList[index] || '';
        storeRowSenseInput(index, cardId, input.value);
        const card = cardById(cardId);
        const phrase = wrap.querySelector(`[data-row-sense-phrase="${index}"]`);
        if (phrase && card) phrase.textContent = rowSensePhrase(index, card);
      };
      ['pointerdown','click','mousedown','mouseup','keydown','touchstart'].forEach(type => input.addEventListener(type, event => event.stopPropagation()));
      input.addEventListener('input', syncPhrase);
      input.addEventListener('change', event => { event.preventDefault(); event.stopPropagation(); syncPhrase(); renderShortList(); });
    });
    qsa('[data-row-sense-choice]', wrap).forEach(button => {
      ['pointerdown','click','mousedown','mouseup','keydown','touchstart'].forEach(type => button.addEventListener(type, event => event.stopPropagation()));
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        const index = Number(button.dataset.rowSenseChoice) || 0;
        const cardId = button.dataset.rowSenseCardId || state.shortList[index] || '';
        const value = button.dataset.rowSenseValue || button.textContent || '';
        storeRowSenseInput(index, cardId, value);
        const input = wrap.querySelector(`[data-row-sense-input="${index}"]`);
        if (input) input.value = value;
        renderShortList();
      });
    });
    const drawOne = $('drawRandomRowCard'); if (drawOne) drawOne.addEventListener('click', drawRandomRowCard);
    qsa('[data-row-card]', wrap).forEach(cardEl => {
      cardEl.addEventListener('click', event => {
        if (event.target.closest('[data-shortlist], [data-filter], .card-row-sense-panel, [data-row-transform-handle], [data-row-reverse]')) return;
        const rowItem = cardEl.closest('.card-row-item[data-row-index]');
        if (rowItem && cardEl.closest('.card-row-board')) {
          event.preventDefault();
          event.stopPropagation();
          state.rowTransformTarget = Number(rowItem.dataset.rowIndex) || 0;
          renderShortList();
          return;
        }
        const placementToggle = event.target.closest('[data-placement-toggle]');
        if (placementToggle) { event.preventDefault(); event.stopPropagation(); const layer = cardEl.querySelector('[data-placement-layer]'); if (layer) { const open = layer.hidden; cardEl.classList.toggle('placement-layer-active', open); layer.hidden = !open; } return; }
        if (window.getSelection && window.getSelection().toString().trim()) return;
        const id = cardEl.dataset.rowCard;
        if (state.shortListSelectMode || event.shiftKey || event.ctrlKey || event.metaKey) {
          event.preventDefault();
          state.shortListSelection = state.shortListSelection.includes(id) ? state.shortListSelection.filter(x => x !== id) : [...state.shortListSelection, id];
          renderShortList();
        } else openFullEntryById(id);
      });
      cardEl.addEventListener('dragstart', event => { if (event.target.closest('.or-card-layer')) { event.preventDefault(); return; } setDragCardPayload(event, cardEl.dataset.rowCard, cardEl.dataset.rowIndex || String(state.shortList.indexOf(cardEl.dataset.rowCard))); cardEl.classList.add('dragging'); });
      cardEl.addEventListener('dragend', () => cardEl.classList.remove('dragging'));
      cardEl.addEventListener('dragover', event => event.preventDefault());
      cardEl.addEventListener('drop', event => {
        event.preventDefault();
        const toIndex = Number(cardEl.dataset.rowIndex);
        if (imageFileFromTransfer(event.dataTransfer)) return;
        const cardId = droppedCardId(event);
        if (cardId) { placeCardInRow(cardId, toIndex); return; }
        const fromIndex = Number(event.dataTransfer.getData('application/x-relphi-row-index') || event.dataTransfer.getData('text/plain'));
        if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex) || fromIndex === toIndex) return;
        const next = state.shortList.slice();
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        commitShortList(next);
      });
    });
    function normalizeInlinePositionLabel(value) {
      return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 90);
    }
    function syncPositionLabelInput() {
      const positionInput = $('rowPositionLabels');
      if (positionInput) positionInput.value = (state.shortListPositionLabels || []).join(', ');
    }
    qsa('[data-row-position-label-editor]', wrap).forEach(editor => {
      editor.addEventListener('pointerdown', event => { event.stopPropagation(); });
      editor.addEventListener('focus', () => { editor.dataset.originalValue = String(editor.textContent || ''); });
      editor.addEventListener('click', event => { event.stopPropagation(); });
      editor.addEventListener('keydown', event => {
        event.stopPropagation();
        if (event.key === 'Enter') { event.preventDefault(); editor.blur(); }
        if (event.key === 'Escape') { event.preventDefault(); const index = Number(editor.dataset.rowPositionLabelEditor); const labelsNext = (state.shortListPositionLabels || []).slice(); labelsNext[index] = normalizeInlinePositionLabel(editor.dataset.originalValue || ''); state.shortListPositionLabels = labelsNext; renderShortList(); }
      });
      editor.addEventListener('input', () => {
        const index = Number(editor.dataset.rowPositionLabelEditor);
        if (!Number.isFinite(index)) return;
        const labelsNext = (state.shortListPositionLabels || []).slice();
        labelsNext[index] = normalizeInlinePositionLabel(editor.textContent);
        state.shortListPositionLabels = labelsNext;
        syncPositionLabelInput();
      });
      editor.addEventListener('blur', () => {
        const index = Number(editor.dataset.rowPositionLabelEditor);
        if (!Number.isFinite(index)) return;
        const labelsNext = (state.shortListPositionLabels || []).slice();
        const nextValue = normalizeInlinePositionLabel(editor.textContent);
        if (nextValue !== normalizeInlinePositionLabel(editor.dataset.originalValue || '')) pushBoardUndo();
        labelsNext[index] = nextValue;
        state.shortListPositionLabels = labelsNext;
        renderShortList();
      });
    });
    qsa('[data-row-position-target]', wrap).forEach(panel => {
      panel.addEventListener('dragover', event => { event.preventDefault(); panel.classList.add('is-drop-ready'); });
      panel.addEventListener('dragleave', () => panel.classList.remove('is-drop-ready'));
      panel.addEventListener('drop', event => {
        event.preventDefault();
        event.stopPropagation();
        panel.classList.remove('is-drop-ready');
        const cardId = droppedCardId(event);
        if (!cardId) return;
        const fromIndex = event.dataTransfer?.getData('application/x-relphi-row-index') || '';
        setPositionStickerCard(cardId, Number(panel.dataset.rowPositionTarget), { removeFromRow: fromIndex !== '', fromIndex });
      });
    });
    qsa('[data-position-card]', wrap).forEach(btn => {
      btn.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); clearPositionStickerCard(btn.dataset.positionIndex); });
    });
    qsa('[data-row-placeholder]', wrap).forEach(slot => {
      slot.addEventListener('dragover', event => { event.preventDefault(); slot.classList.add('is-drop-ready'); });
      slot.addEventListener('dragleave', () => slot.classList.remove('is-drop-ready'));
      slot.addEventListener('drop', event => {
        event.preventDefault();
        slot.classList.remove('is-drop-ready');
        const slotIndex = Number(slot.dataset.rowPlaceholder);
        if (imageFileFromTransfer(event.dataTransfer)) return;
        const cardId = droppedCardId(event);
        if (!cardId) return;
        placeCardInRow(cardId, slotIndex);
      });
    });
    document.dispatchEvent(new CustomEvent('relphi:drawing-board-rendered', { detail:drawingBoardPrefabState() }));
  }
  function toggleShortList(id) {
    if (!id) return;
    const adding = !state.shortList.includes(id);
    const next = adding ? [...state.shortList, id] : state.shortList.filter(x => x !== id);
    commitShortList(next);
    if (adding) scrollCardRowToEnd();
  }
  function applyChipFilter(value) {
    value = String(value || '').trim();
    if (!value) return;
    if (!state.cardFilters.includes(value)) state.cardFilters.push(value);
    state.mode = state.query ? 'search' : 'all';
    showPanel('browsePanel'); renderBrowse(); pushHistory();
  }
  function passesCardFilters(card) {
    if (!state.cardFilters.length) return true;
    const text = compactText(card) + ' ' + cardSearchTokens(card) + ' ' + cardGlyphParts(card).map(x => String(x).replace(/<[^>]+>/g,'')).join(' ');
    return state.cardFilters.every(f => {
      const filter = String(f || '');
      if (filter.startsWith('rank:')) {
        const key = filter.slice(5);
        const n = RANK_NUMBERS[key];
        return n ? rankNumber(card) === n : card.card_type !== 'Major' && rankKey(card) === key;
      }
      if (filter.startsWith('major:')) {
        const roman = filter.slice(6);
        return card.card_type === 'Major' && rankRoman(card) === roman;
      }
      return text.toLowerCase().includes(filter.toLowerCase());
    });
  }
  function rankKey(card) {
    if (card.card_type === 'Major') return 'Major';
    if (card.card_type === 'Ace') return 'Ace';
    return card.rank || '';
  }
  function elementKey(card) {
    const element = card.element || card.rank_element || '';
    return ['Fire','Water','Air','Earth'].includes(element) ? element : 'Mixed';
  }
  function compactText(card) {
    const safeJoin = (value) => Array.isArray(value) ? value.join(' ') : (value || '');
    const safeValues = (value) => value && typeof value === 'object' ? Object.values(value).map(v => typeof v === 'object' ? JSON.stringify(v) : v).join(' ') : '';
    return [
      title(card), card.name, card.card_type, card.arcana, card.suit, card.thoth_suit, card.rank, card.rws_rank, card.element, card.rank_element,
      card.elemental_formula, card.polarity, safeJoin(card.tags), safeValues(card.astrology), safeValues(card.hebrew),
      safeValues(card.systems?.golden_dawn_rws), safeValues(card.systems?.thoth), JSON.stringify(card), safeSearchStatement(card), cardSearchTokens(card)
    ].join(' ').toLowerCase();
  }
  function checkedValues(group) {
    return qsa(`input[data-filter-group="${group}"]`).filter(i => i.checked).map(i => i.value);
  }
  function includedByVisibility(card) {
    return checkedValues('type').includes(card.card_type) && (!card.suit || checkedValues('suit').includes(card.suit)) && checkedValues('rank').includes(rankKey(card)) && checkedValues('element').includes(elementKey(card));
  }
  function normalizeSearch(value) {
    return String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").trim();
  }
  function safeSearchStatement(card) {
    try { return statementForCard(card) || ''; }
    catch (error) { return ''; }
  }
  function cardTypeBucket(card) {
    if (card.card_type === 'Major') return 0;
    if (card.card_type === 'Ace') return 1;
    if (card.card_type === 'Pip') return 2;
    if (card.card_type === 'Court') return 3;
    return 4;
  }
  function searchDisplayOrder(card) {
    return cardTypeBucket(card) * 1000 + displayOrder(card);
  }
  function exactTitleScore(card, q) {
    const values = [title(card), card.name, card.systems?.golden_dawn_rws?.display_name, card.systems?.thoth?.display_name, titleNoThe(title(card)), titleNoThe(card.name), titleNoThe(card.systems?.golden_dawn_rws?.display_name || ''), titleNoThe(card.systems?.thoth?.display_name || '')].filter(Boolean).map(normalizeSearch);
    return values.includes(q) ? 10000 : 0;
  }
  function exactFormulaScore(card, q) {
    return normalizeSearch(card.elemental_formula || '') === q ? 9500 : 0;
  }
  function moonClusterScore(card, q) {
    if (q !== 'moon') return 0;
    const t = normalizeSearch(title(card));
    if (t === 'the moon' || t === 'moon') return 9000;
    if (t.includes('high priestess')) return 8900;
    if (t.includes('chariot')) return 8800;
    return searchCorpus(card).includes('moon') ? 5000 - searchDisplayOrder(card) : 0;
  }
  function resultScore(card, q, terms) {
    const haystack = searchCorpus(card) + ' ' + normalizeSearch(cardSearchTokens(card));
    if (!terms.every(term => haystack.includes(term))) return -1;
    let score = 1000;
    score += exactTitleScore(card, q);
    score += exactFormulaScore(card, q);
    score += moonClusterScore(card, q);
    if (normalizeSearch(card.astrology?.planet || '') === q) score += 4200;
    if (normalizeSearch(card.astrology?.sign || '') === q) score += 3600;
    if (normalizeSearch(card.suit || '') === q || normalizeSearch(card.thoth_suit || '') === q) score += 1800;
    score -= searchDisplayOrder(card) / 10;
    return score;
  }
  function searchCorpus(card) {
    return normalizeSearch([
      title(card), card.name, card.card_id, card.card_type, card.arcana, card.suit, card.thoth_suit, card.rank, card.rws_rank,
      card.element, card.rank_element, card.elemental_formula, card.polarity, (card.tags || []).join(' '),
      JSON.stringify(card.astrology || {}), JSON.stringify(card.hebrew || {}), JSON.stringify(card.systems || {}),
      safeSearchStatement(card)
    ].filter(Boolean).join(' '));
  }
  function typedRankNumber(query) {
    const cleaned = String(query || '').trim().toLowerCase();
    const wordMap = { one: 1, ace: 1, aces: 1, two: 2, twos: 2, three: 3, threes: 3, four: 4, fours: 4, five: 5, fives: 5, six: 6, sixes: 6, seven: 7, sevens: 7, eight: 8, eights: 8, nine: 9, nines: 9, ten: 10, tens: 10 };
    if (/^(10|[1-9])$/.test(cleaned)) return Number(cleaned);
    const romanValue = ROMAN_TO_NUMBER[String(query || '').trim().toUpperCase()];
    if (romanValue) return romanValue;
    return wordMap[cleaned] || null;
  }
  function exactShorthandResults(raw) {
    const found = resolveCardToken(raw);
    return found ? [found] : [];
  }
  function courtRanksForCode(code) {
    return COURT_CODE_RANKS[code] ? code : null;
  }
  function suitFromLetter(letter) {
    return { W:'Wands', C:'Cups', S:'Swords', D:'Pentacles', P:'Pentacles' }[String(letter || '').toUpperCase()] || '';
  }
  function cardMatchesSuit(card, suit) {
    return card.suit === suit || (suit === 'Pentacles' && card.thoth_suit === 'Disks');
  }
  function resolveCardToken(raw) {
    const original = String(raw || '').trim();
    const q = original.toUpperCase().replace(/\s+/g, '');
    if (!q) return null;
    const suitMap = { W:'Wands', C:'Cups', S:'Swords', D:'Pentacles', P:'Pentacles' };
    const rankMap = { A:'Ace', '2':'Two', '3':'Three', '4':'Four', '5':'Five', '6':'Six', '7':'Seven', '8':'Eight', '9':'Nine', '10':'Ten' };
    const courtRanks = courtRanksForCode(q);
    if (courtRanks) return null;
    let m = q.match(/^(C[1-4])([WCSDP])$/);
    if (m) {
      const ranks = courtRanksForCode(m[1]); const suit = suitMap[m[2]];
      return cards.find(card => card.card_type === 'Court' && courtRankCode(card) === m[1] && cardMatchesSuit(card, suit)) || null;
    }
    m = q.match(/^([WCSDP])(C[1-4])$/);
    if (m) {
      const suit = suitMap[m[1]]; const ranks = courtRanksForCode(m[2]);
      return cards.find(card => card.card_type === 'Court' && courtRankCode(card) === m[2] && cardMatchesSuit(card, suit)) || null;
    }
    m = q.match(/^(10|[2-9]|A)([WCSDP])$/);
    if (m) return cards.find(card => rankKey(card) === rankMap[m[1]] && cardMatchesSuit(card, suitMap[m[2]])) || null;
    m = q.match(/^([WCSDP])(10|[2-9]|A)$/);
    if (m) return cards.find(card => rankKey(card) === rankMap[m[2]] && cardMatchesSuit(card, suitMap[m[1]])) || null;
    m = q.match(/^Q([WCSDP])$/);
    if (m) return cards.find(card => card.card_type === 'Court' && (card.rank || card.rws_rank) === 'Queen' && cardMatchesSuit(card, suitMap[m[1]])) || null;
    m = q.match(/^K([WCSDP])$/);
    if (m) return cards.find(card => card.card_type === 'Court' && courtRankCode(card) === 'C4' && cardMatchesSuit(card, suitMap[m[1]])) || null;
    const normalized = normalizeSearch(original);
    return cards.find(card => normalizeSearch(title(card)) === normalized || normalizeSearch(card.name) === normalized || normalizeSearch(card.systems?.thoth?.display_name) === normalized || normalizeSearch(titleNoThe(card.systems?.golden_dawn_rws?.display_name || '')) === normalized || normalizeSearch(titleNoThe(card.systems?.thoth?.display_name || '')) === normalized) || null;
  }
  function orderedCardTokenResults(raw) {
    const text = String(raw || '').trim();
    if (!/[\s,;]+/.test(text)) return [];
    const tokens = text.split(/[\s,;]+/).map(x => x.trim()).filter(Boolean);
    if (tokens.length < 2) return [];
    const resolved = tokens.map(resolveCardToken);
    if (resolved.some(card => !card)) return [];
    const seen = new Set();
    return resolved.filter(card => { if (seen.has(card.card_id)) return false; seen.add(card.card_id); return true; });
  }
  function searchResults() {
    const raw = state.query.trim().replace(/^\//, '');
    const query = normalizeSearch(raw);
    if (!query) return [];
    const ordered = orderedCardTokenResults(raw);
    if (ordered.length) return ordered;
    const courtCode = courtRanksForCode(String(raw || '').trim().toUpperCase().replace(/\s+/g, ''));
    if (courtCode) return sortCardsForDisplay(cards.filter(card => card.card_type === 'Court' && courtRankCode(card) === courtCode));
    const exact = exactShorthandResults(raw);
    const terms = query.split(/\s+/).filter(Boolean);
    const rank = typedRankNumber(raw);
    if (rank != null) {
      return sortCardsForDisplay(cards.filter(card => rankNumber(card) === rank));
    }
    if (query.length === 1) return [];
    const scored = cards.map(card => ({ card, score: resultScore(card, query, terms) })).filter(item => item.score >= 0);
    if (exact.length) {
      exact.forEach(card => { const found = scored.find(item => item.card.card_id === card.card_id); if (found) found.score += 12000; else scored.push({ card, score: 12000 }); });
    }
    return scored.sort((a,b) => b.score - a.score || searchDisplayOrder(a.card) - searchDisplayOrder(b.card) || title(a.card).localeCompare(title(b.card))).map(item => item.card);
  }
  function displayOrder(card) {
    const suitOrder = { Wands: 100, Cups: 120, Swords: 140, Pentacles: 160 };
    if (card.card_type === 'Major') return rankNumber(card) ?? 0;
    const base = suitOrder[card.suit] ?? 200;
    return base + (rankNumber(card) || 0);
  }
  function sortCardsForDisplay(list) {
    const uhnContext = state.rowDrawScope === 'uhn' || state.cardFilters.includes('Universal Human Needs') || normalizeSearch(state.query).includes('universal human needs') || (list.length > 0 && list.every(card => UHN_ORDER.has(card.card_id)));
    return list.slice().sort((a, b) => {
      if (uhnContext) {
        const au = UHN_ORDER.has(a.card_id) ? UHN_ORDER.get(a.card_id) : Infinity;
        const bu = UHN_ORDER.has(b.card_id) ? UHN_ORDER.get(b.card_id) : Infinity;
        if (au !== bu) return au - bu;
      }
      return displayOrder(a) - displayOrder(b) || title(a).localeCompare(title(b));
    });
  }
  function currentCards() {
    if (state.mode === 'all') return sortCardsForDisplay(cards.filter(includedByVisibility).filter(passesCardFilters));
    if (state.mode === 'search' && state.lastDateField?.query && state.query === state.lastDateField.query) {
      return state.lastDateField.cards.map(hit => cardById(hit.cardId)).filter(Boolean).filter(passesCardFilters);
    }
    if (state.mode === 'search') return searchResults().filter(passesCardFilters);
    return [];
  }
  function setVisible(id, visible) { const el = $(id); if (el) el.hidden = !visible; }
  function setSummaryVisible(visible) { const el = $('tarotSummary'); if (el) el.hidden = !visible; }
  function isDedicatedSkyChartPage() { return document.body?.classList?.contains('sky-chart-page'); }
  function historySnapshot() {
    return { relphiTarot: true, mode:isDedicatedSkyChartPage() ? 'chart' : state.mode, query:state.query };
  }
  function pushHistory() {
    if (state.suppressHistory) return;
    const snapshot = historySnapshot();
    const hash = snapshot.mode === 'idle' ? 'tarot' : 'tarot-' + snapshot.mode + (snapshot.query ? '-' + slug(snapshot.query) : '');
    if (isDedicatedSkyChartPage()) history.replaceState(snapshot, '', location.pathname + location.search + '#' + hash);
    else history.pushState(snapshot, '', '#' + hash);
  }
  function replaceHistory() {
    const snapshot = historySnapshot();
    const hash = snapshot.mode === 'idle' ? 'tarot' : `tarot-${snapshot.mode}`;
    history.replaceState(snapshot, '', location.pathname + location.search + '#' + hash);
  }
  function showPanel(id) {
    ['browsePanel','visibilityPanel','spreadPanel','datePanel','chartPanel','currentSkyPanel'].forEach(panel => setVisible(panel, false));
    if (id) setVisible(id, true);
    updateClearKeywordButtons();
  }
  function updateSummary(list) {
    const count = list.length;
    const summaryModes = ['idle', 'all', 'search'];
    setSummaryVisible(summaryModes.includes(state.mode));
    if (!summaryModes.includes(state.mode)) return;
    $('resultCount').textContent = count ? String(count) : 'No';
    $('resultNoun').textContent = count === 1 ? ' card shown' : ' cards shown';
    const inlineCount = $('resultInlineCount');
    if (inlineCount) inlineCount.textContent = `${count ? String(count) : 'No'} ${count === 1 ? 'card' : 'cards'} shown`;
    if (state.mode === 'idle') $('activeSummary').textContent = 'Begin with a search, a spread, a date, a chart placement, or show the full deck.';
    if (state.mode === 'all') $('activeSummary').textContent = state.cardFilters.length ? `Filters: ${state.cardFilters.join(', ')}.` : '';
    if (state.mode === 'search') {
      if (state.lastDateField?.query && state.query === state.lastDateField.query) {
        const date = new Date(state.lastDateField.date + 'T12:00:00');
        $('activeSummary').textContent = `Date lookup for ${date.toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' })}.`;
      } else {
        $('activeSummary').textContent = `Search results for “${state.query}”.`;
      }
    }
  }
  function filterDisplayName(value) {
    const text = String(value || '');
    if (text.startsWith('rank:')) return text.slice(5);
    if (text.startsWith('major:')) return `Major ${text.slice(6)}`;
    return text;
  }
  function renderBrowse() {
    const list = currentCards();
    updateSummary(list);
    if (list.length && (!state.selected || !list.some(card => card.card_id === state.selected.card_id))) state.selected = list[0];
    const activeDetailId = state.selected && list.some(c => c.card_id === state.selected.card_id) ? state.selected.card_id : '';
    const panel = $('cardList');
    const resultTools = list.length ? `<button type="button" data-add-results-to-row>Add shown to Drawing Board</button>` : '';
    const resultZoom = Math.max(0.35, Math.min(4.8, Number(state.resultZoom) || 1));
    const resultCardWidth = Math.max(3.5, Math.min(48, 10 * resultZoom)).toFixed(2) + 'rem';
    const visualTools = list.length ? `<div class="result-visual-tools" aria-label="Visual result controls"><div class="result-zoom-control" aria-label="Results zoom"><span>Zoom</span><button type="button" data-result-zoom-step="-0.1" aria-label="Zoom results out">−</button><input data-result-zoom type="range" min="0.35" max="4.8" step="0.01" value="${resultZoom}" aria-label="Results zoom"><button type="button" data-result-zoom-step="0.1" aria-label="Zoom results in">+</button><output>${Math.round(resultZoom * 100)}%</output></div><button type="button" class="result-glyph-toggle" data-result-glyph-toggle aria-pressed="${state.resultGlyphsVisible ? 'true' : 'false'}">${state.resultGlyphsVisible ? 'Hide glyphs' : 'Show glyphs'}</button><label>Arrange <select data-result-layout><option value="auto" ${state.resultLayout === 'auto' ? 'selected' : ''}>Auto flow</option><option value="2" ${state.resultLayout === '2' ? 'selected' : ''}>2 columns</option><option value="3" ${state.resultLayout === '3' ? 'selected' : ''}>3 columns</option><option value="4" ${state.resultLayout === '4' ? 'selected' : ''}>4 columns</option></select></label></div>` : '';
    const filterBar = (state.cardFilters.length || resultTools || visualTools) ? `<div class="active-filter-row active-filter-row--results">${state.cardFilters.length ? `<strong>Filters</strong>${state.cardFilters.map(f => `<button type="button" data-remove-filter="${escapeHtml(f)}">${escapeHtml(filterDisplayName(f))} ×</button>`).join('')}<button type="button" data-clear-filters>Clear filters</button>` : ''}${resultTools}${visualTools}</div>` : '';
    panel.innerHTML = `${filterBar}<div class="or-card-grid tarot-result-grid" style="--result-zoom:${resultZoom};--result-card-w:${resultCardWidth};" data-result-layout="${escapeHtml(state.resultLayout || 'auto')}" data-result-glyphs="${state.resultGlyphsVisible ? 'on' : 'off'}">${list.map(card => renderCardSurface(card,{context:'browse', detailSelected: card.card_id === activeDetailId})).join('') || '<p class="empty-state">No cards are showing.</p>'}</div>`;
    const applyResultZoom = () => {
      const grid = panel.querySelector('.tarot-result-grid');
      if (!grid) return;
      const widthRem = Math.max(3.5, Math.min(48, 10 * (Number(state.resultZoom) || 1)));
      const width = widthRem.toFixed(2) + 'rem';
      const layoutCount = Number(state.resultLayout);
      const gapRem = 0.28;
      const zoom = Math.max(0.35, Math.min(4.8, Number(state.resultZoom) || 1));
      const density = zoom < 0.56 ? 'tiny' : (zoom < 0.78 ? 'compact' : 'normal');
      const glyphLaneRem = 0;
      const controlLaneRem = 0;
      const artWidthRem = Math.max(1.8, widthRem - glyphLaneRem);
      const cardHeightRem = (artWidthRem * 864 / 500) + controlLaneRem;
      grid.style.setProperty('--result-card-w', width);
      grid.style.setProperty('--result-card-h', cardHeightRem.toFixed(2) + 'rem');
      grid.style.setProperty('--result-card-glyph-lane', glyphLaneRem.toFixed(2) + 'rem');
      grid.style.setProperty('--result-card-control-lane', controlLaneRem.toFixed(2) + 'rem');
      grid.dataset.resultDensity = density;
      grid.style.maxWidth = layoutCount ? ((widthRem * layoutCount) + gapRem * (layoutCount - 1)).toFixed(2) + 'rem' : '';
      grid.querySelectorAll('.or-card.tarot-card-surface').forEach(cardEl => {
        cardEl.style.setProperty('width', width, 'important');
        cardEl.style.setProperty('min-width', width, 'important');
        cardEl.style.setProperty('max-width', width, 'important');
        cardEl.style.setProperty('height', cardHeightRem.toFixed(2) + 'rem', 'important');
        cardEl.style.setProperty('flex-basis', width, 'important');
      });
    };
    applyResultZoom();
    qsa('[data-remove-filter]', panel).forEach(btn => btn.addEventListener('click', () => { state.cardFilters = state.cardFilters.filter(f => f !== btn.dataset.removeFilter); renderBrowse(); }));
    const clearFilters = panel.querySelector('[data-clear-filters]');
    if (clearFilters) clearFilters.addEventListener('click', () => { state.cardFilters = []; renderBrowse(); });
    const addShown = panel.querySelector('[data-add-results-to-row]');
    if (addShown) addShown.addEventListener('click', () => {
      const ids = list.map(card => card.card_id);
      const next = state.rowAllowRepeats ? [...state.shortList, ...ids] : [...state.shortList, ...ids.filter(id => !state.shortList.includes(id))];
      commitShortList(next);
    });
    const resultZoomControl = panel.querySelector('[data-result-zoom]');
    const setResultZoom = value => {
      state.resultZoom = Math.max(0.35, Math.min(4.8, Number(value) || 1));
      const grid = panel.querySelector('.tarot-result-grid');
      if (grid) {
        grid.style.setProperty('--result-zoom', state.resultZoom);
      }
      applyResultZoom();
      if (resultZoomControl) resultZoomControl.value = String(state.resultZoom);
      const output = panel.querySelector('.result-zoom-control output');
      if (output) output.textContent = Math.round(state.resultZoom * 100) + '%';
    };
    if (resultZoomControl) resultZoomControl.addEventListener('input', () => setResultZoom(resultZoomControl.value));
    qsa('[data-result-zoom-step]', panel).forEach(btn => btn.addEventListener('click', () => setResultZoom((Number(state.resultZoom) || 1) + Number(btn.dataset.resultZoomStep || 0))));
    const resultGlyphToggle = panel.querySelector('[data-result-glyph-toggle]');
    if (resultGlyphToggle) resultGlyphToggle.addEventListener('click', () => { state.resultGlyphsVisible = !state.resultGlyphsVisible; renderBrowse(); });
    const resultLayoutControl = panel.querySelector('[data-result-layout]');
    if (resultLayoutControl) resultLayoutControl.addEventListener('change', () => { state.resultLayout = resultLayoutControl.value || '3'; renderBrowse(); });
    panel.addEventListener('click', (event) => { if (userHasTextSelection()) return; const titleBtn = event.target.closest('[data-card-id]'); if (titleBtn && panel.contains(titleBtn)) { event.preventDefault(); event.stopPropagation(); inspectBrowseResult(titleBtn.dataset.cardId); return; } const cardEl = event.target.closest('.or-card[data-id]'); if (!cardEl || !panel.contains(cardEl) || event.target.closest('[data-shortlist]') || event.target.closest('[data-filter]') || event.target.closest('.or-card-layer')) return; const id = cardEl.dataset.id; event.preventDefault(); inspectBrowseResult(id); });
    qsa('[data-shortlist]', panel).forEach(btn => btn.addEventListener('click', (event) => { event.stopPropagation(); toggleShortList(btn.dataset.shortlist); }));
    qsa('[data-filter]', panel).forEach(chip => chip.addEventListener('click', (event) => { event.stopPropagation(); applyChipFilter(chip.dataset.filter); }));
    const resultGrid = panel.querySelector('.tarot-result-grid');
    if (resultGrid) {
      qsa('.or-chip.relphi-filter-chip', resultGrid).forEach(chip => {
        const surfaceGlyphs = () => { resultGrid.dataset.resultGlyphHover = 'on'; };
        const settleGlyphs = () => { window.setTimeout(() => { if (!resultGrid.matches(':has(.or-chip.relphi-filter-chip:hover), :has(.or-chip.relphi-filter-chip:focus-visible)')) resultGrid.dataset.resultGlyphHover = 'off'; }, 40); };
        chip.addEventListener('pointerenter', surfaceGlyphs);
        chip.addEventListener('focus', surfaceGlyphs);
        chip.addEventListener('pointerleave', settleGlyphs);
        chip.addEventListener('blur', settleGlyphs);
      });
    }
    qsa('[data-drag-card]', panel).forEach(cardEl => cardEl.addEventListener('dragstart', event => { if (event.target.closest('.or-card-layer')) { event.preventDefault(); return; } setDragCardPayload(event, cardEl.dataset.dragCard || cardEl.dataset.id); }));
    renderDetail(state.selected && list.some(c => c.card_id === state.selected.card_id) ? state.selected : null);
    renderShortList();
  }
  function inspectBrowseResult(id) {
    const card = cardById(id);
    if (!card) return;
    state.selected = card;
    renderDetail(card);
    const detail = $('cardDetail');
    if (detail) detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function isPrincessCourt(card) {
    return card?.card_type === 'Court' && String(card.rank || '').toLowerCase() === 'princess';
  }
  function acePrincessRangeForSuit(suit) {
    const s = suit === 'Pentacles' || suit === 'Disks' ? 'Pentacles' : suit;
    return {
      Wands: { label: 'Cancer 0° through Virgo 30°', startSign: 'Cancer', startDegree: 0, endSign: 'Virgo', endDegree: 30, note: 'Ace of Wands and Princess/Page of Wands share the Cancer–Leo–Virgo quadrant.' },
      Cups: { label: 'Libra 0° through Sagittarius 30°', startSign: 'Libra', startDegree: 0, endSign: 'Sagittarius', endDegree: 30, note: 'Ace of Cups and Princess/Page of Cups share the Libra–Scorpio–Sagittarius quadrant.' },
      Swords: { label: 'Capricorn 0° through Pisces 30°', startSign: 'Capricorn', startDegree: 0, endSign: 'Pisces', endDegree: 30, note: 'Ace of Swords and Princess/Page of Swords share the Capricorn–Aquarius–Pisces quadrant.' },
      Pentacles: { label: 'Aries 0° through Gemini 30°', startSign: 'Aries', startDegree: 0, endSign: 'Gemini', endDegree: 30, note: 'Ace of Disks/Pentacles and Princess/Page of Disks/Pentacles share the Aries–Taurus–Gemini quadrant.' }
    }[s] || null;
  }
  function acePrincessRangeForCard(card) {
    return (card?.card_type === 'Ace' || isPrincessCourt(card)) ? acePrincessRangeForSuit(card.suit || card.thoth_suit) : null;
  }
  function zodiacRangeLabelForCard(card) {
    const shared = acePrincessRangeForCard(card);
    if (shared) return shared.label;
    const a = card?.astrology || {};
    if (isPrincessCourt(card)) return '';
    const raw = String(a.degree_span || a.zodiac_range || '').trim();
    if (!raw) return '';
    return /\d|°|degree|through|to/i.test(raw) ? raw : '';
  }
  function subline(card) {
    const parts = [];
    if (card.card_type) parts.push(card.card_type);
    if (card.suit) parts.push(card.suit === 'Pentacles' ? 'Pentacles / Disks' : card.suit);
    if (card.element) parts.push(card.element);
    if (isPrincessCourt(card)) parts.push('no solar-date range');
    else if (card.astrology?.sign) parts.push(card.astrology.sign);
    if (card.astrology?.planet) parts.push(card.astrology.planet);
    if (card.hebrew?.letter) parts.push(card.hebrew.letter);
    return parts.filter(Boolean).join(' · ');
  }
  function selectCard(id) {
    state.selected = cards.find(card => card.card_id === id) || null;
    renderBrowse();
  }
  function field(label, value) {
    if (!value) return '';
    return `<div class="detail-field"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`;
  }
  function aceSummary(card) {
    const fields = {
      Fire: 'will, heat, ignition, courage, and the first active spark of the suit',
      Water: 'feeling, receptivity, memory, devotion, and the first flowing source of the suit',
      Air: 'thought, word, breath, distinction, and the first cutting clarity of the suit',
      Earth: 'body, matter, value, seed, and the first material root of the suit'
    };
    const field = fields[card.element] || 'the pure elemental source of the suit';
    const shared = acePrincessRangeForCard(card);
    return `${card.name} opens the root of ${card.element}: ${field}. It is the suit before it enters a decan. ${shared ? shared.note : ''}`;
  }
  function relphiNote(card) {
    const summary = card.relphi?.summary || card.relphi?.dossier_note || '';
    return summary ? ` Relphi note: ${summary}` : '';
  }
  function planetMajorField(planet) {
    const p = String(planet || '');
    if (p.includes('Saturn') && p.includes('Earth')) return 'Saturnian boundary, time, completion, embodiment, and the material field brought to closure';
    if (p.includes('Saturn')) return 'boundary, time, structure, consequence, and durable form';
    if (p.includes('Earth')) return 'embodiment, matter, ground, and manifest reality';
    if (p.includes('Sun')) return 'identity, vitality, visibility, center, and will';
    if (p.includes('Moon')) return 'need, memory, body, rhythm, and reflection';
    if (p.includes('Mercury')) return 'speech, thought, exchange, interpretation, and crossing';
    if (p.includes('Venus')) return 'attraction, pleasure, beauty, value, and relation';
    if (p.includes('Mars')) return 'action, force, severance, defense, and courage';
    if (p.includes('Jupiter')) return 'growth, faith, blessing, meaning, and expansion';
    return 'major arcana force';
  }
  function majorSummary(card, compact = false) {
    const a = card.astrology || {};
    const h = card.hebrew || {};
    const signInfo = SIGN_DATA[a.sign] || {};
    const letterNote = h.letter && h.image ? `${h.letter} — ${h.image}` : (h.letter || h.image || '');
    if (a.sign) {
      const signShape = [signInfo.mode, signInfo.element].filter(Boolean).join(' ');
      const ruler = signInfo.ruler ? `${signInfo.ruler}-ruled ` : '';
      const field = SIGN_FIELD_THEMES[a.sign] || 'the sign field';
      const exalt = signInfo.exaltation ? ` ${signInfo.exaltation} is exalted here, adding a special strength or lift.` : '';
      return `${card.name} carries ${a.sign}, ${ruler}${signShape}: ${field}.${exalt}${letterNote ? ` ${letterNote}.` : ''}${relphiNote(card)}`;
    }
    if (a.planet) {
      return `${card.name} carries ${a.planet}: ${planetMajorField(a.planet)}.${letterNote ? ` ${letterNote}.` : ''}${relphiNote(card)}`;
    }
    if (a.attribution_type === 'Element' || a.zodiac_range || a.logic) {
      const element = a.zodiac_range || a.logic || 'Elemental attribution';
      return `${card.name} carries ${element}.${letterNote ? ` ${letterNote}.` : ''}${relphiNote(card)}`;
    }
    return `${card.name} carries ${letterNote || 'Major Arcana'}${relphiNote(card)}.`;
  }
  function decanRulerInteraction(card) {
    if (!card || card.card_type !== 'Pip') return '';
    const a = card.astrology || {};
    const rws = card.systems?.golden_dawn_rws || {};
    const thoth = card.systems?.thoth || {};
    const titleText = thoth.title || rws.title || card.name;
    const sign = a.sign || '';
    const signInfo = SIGN_DATA[sign] || {};
    const signRuler = a.sign_ruler || signInfo.ruler || '';
    const decanRuler = a.decan_ruler || a.planet || '';
    if (!sign || !signRuler || !decanRuler) return '';
    const decan = a.decan ? `${a.decan.toLowerCase()} of ` : '';
    const mode = signInfo.mode ? `${signInfo.mode.toLowerCase()} ` : '';
    const element = card.element || signInfo.element || '';
    const decanLocation = `${decan}${mode}${element}, ${sign}`.replace(/\s+/g, ' ').trim();
    const decanEffect = PLANET_ACTIONS[decanRuler] || 'brings its force';
    const signFieldText = signField(sign);
    const theme = cardThemePhrase(card);
    let condition = '';
    if (decanRuler === signRuler) condition = `${decanRuler} rules both the decan and the sign, concentrating the card through one planetary voice.`;
    else if (signInfo.exaltation === decanRuler) condition = `${decanRuler} is exalted in ${sign}, giving the card unusual strength inside ${signRuler}’s field.`;
    else if (signInfo.detriment === decanRuler) condition = `${decanRuler} is in detriment in ${sign}, so the card carries friction inside ${signRuler}’s field.`;
    else if (signInfo.fall === decanRuler) condition = `${decanRuler} is in fall in ${sign}, lowering or complicating its expression inside ${signRuler}’s field.`;
    const themeSentence = sentenceCaseFragment(theme);
    return `The ${decanLocation} carries ${decanRuler.toLowerCase()} force through ${signRuler}-ruled ${sign}: ${signFieldText}. ${condition ? condition + ' ' : ''}${themeSentence}.`;
  }
  const ELEMENT_LAYER_SIGNATURES = {
    Fire: 'heat, will, ignition, and visible courage',
    Water: 'feeling, memory, receptivity, and emotional current',
    Air: 'thought, word, tension, and clarifying distance',
    Earth: 'body, value, patience, and material consequence'
  };
  const RANK_LAYER_SIGNATURES = {
    Ace: 'the first pure source of the suit before it takes shape',
    Two: 'a first exchange, polarity, or mirrored relation',
    Three: 'growth from the first relation into expression',
    Four: 'a stabilizing form that can shelter or hold too tightly',
    Five: 'a pressure point where the pattern is disturbed',
    Six: 'a rebalancing movement after pressure',
    Seven: 'a test of direction, desire, or trust',
    Eight: 'a pattern of force, motion, adjustment, or containment',
    Nine: 'a concentrated threshold where the suit becomes personal',
    Ten: 'an overflow, completion, or consequence of the suit',
    Page: 'the suit as a young messenger, seed, or first embodiment',
    Princess: 'the suit as a young bearer, seed, or embodied field',
    Prince: 'the suit in active motion and directed force',
    Queen: 'the suit as reception, maturity, and inward power',
    Knight: 'the suit as outward charge, mastery, or visible force',
    King: 'the suit as outward charge, mastery, or visible force'
  };
  function courtRoleCode(card) {
    if (card?.card_type !== 'Court') return '';
    return courtRankCode(card);
  }
  function courtRoleLabel(card) {
    const code = courtRoleCode(card);
    return { C1:'Page/Princess', C2:'Knight/Prince', C3:'Queen', C4:'King/Knight' }[code] || (card?.rank || card?.rws_rank || 'Court');
  }
  function layerRankKey(card) {
    if (card?.card_type === 'Court') return courtRoleLabel(card);
    return card?.rank || card?.rws_rank || card?.card_type || '';
  }
  function layerSuitFeel(card) {
    const element = card?.element || elementKey(card);
    const suit = suitDisplay(card);
    return [suit, ELEMENT_LAYER_SIGNATURES[element]].filter(Boolean).join(': ');
  }
  const ELEMENT_DERIVATIONS = {
    Earth: 'matter, body, substance, food, touch, resources, and the thing itself',
    Air: 'distinction, comparison, relation, language, thought, distance, and pattern',
    Water: 'feeling, memory, receptivity, bonding, rhythm, mood, care, belonging, containment, and emotional continuity',
    Fire: 'will, heat, action, ignition, courage, visibility, appetite, spirit, assertion, and transforming force'
  };
  const MODE_DERIVATIONS = {
    Cardinal: 'initiating, setting something in motion, and beginning a field of action',
    Fixed: 'holding, keeping, stabilizing, preserving, and maintaining',
    Mutable: 'adapting, translating, distributing, loosening, shifting, dissolving, exchanging, and preparing transition'
  };
  const RANK_DERIVATIONS = {
    Ace: 'the suit at first emergence, before it divides into events',
    Two: 'first relation, polarity, pairing, or exchange',
    Three: 'expression, growth, and the first visible development',
    Four: 'form, stability, containment, and structure',
    Five: 'disturbance, pressure, disruption, or contest',
    Six: 'rebalancing, support, harmony, and reorganization after pressure',
    Seven: 'testing, direction, desire, strategy, or uncertainty',
    Eight: 'movement, adjustment, patterning, labor, or force under repetition',
    Nine: 'concentration, ripening, personal threshold, or internalization',
    Ten: 'completion, overflow, consequence, or the suit reaching saturation',
    Page: 'the suit as first embodiment, message, and learning body',
    Princess: 'the suit as first embodiment, message, and learning body',
    Knight: 'the suit as outward command, mastery, and visible administration',
    Prince: 'the suit as active motion, quest, and directed force',
    Queen: 'the suit as reception, inward authority, and mature containment',
    King: 'the suit as outward command, mastery, and visible administration'
  };
  function dignityConditionsFor(sign) {
    const d = SIGN_DATA[sign] || {};
    const bits = [];
    if (d.ruler) bits.push(`${d.ruler} rules the field`);
    if (d.exaltation) bits.push(`${d.exaltation} has special strength there`);
    if (d.detriment) bits.push(`${d.detriment} works against the grain there`);
    if (d.fall) bits.push(`${d.fall} is lowered or made difficult there`);
    return bits;
  }
  function cardTitleNote(card) { return ''; }
  function numberFunction(card) {
    const raw = card?.number ?? card?.rank ?? card?.systems?.golden_dawn_rws?.number ?? '';
    const n = Number(raw);
    const map = {
      0: 'Zero is the uncounted origin before sequence, measure, interval, or exchange.',
      1: 'One is first appearance, source, and directed beginning.',
      2: 'Two is polarity, mirror, relation, and first difference.',
      3: 'Three is relation becoming expression, growth, or a third term.',
      4: 'Four is form, container, stability, and held structure.',
      5: 'Five is disturbance, pressure, disruption, or contest.',
      6: 'Six is rebalancing, support, harmony, and reorganization after pressure.',
      7: 'Seven is test, direction, desire, strategy, or uncertainty.',
      8: 'Eight is movement, adjustment, patterning, labor, or force under repetition.',
      9: 'Nine is concentration, ripening, threshold, or internalization.',
      10: 'Ten is completion, overflow, consequence, or saturation.'
    };
    return map[n] || `Number ${raw} sets the card's sequence function.`;
  }
  function cleanSentence(value) { return String(value || '').replace(/\s+/g, ' ').trim(); }
  function nbHyphens(value) { return String(value || '').replace(/-/g, '‑'); }
  function letterLayer(card) {
    const letter = card?.hebrew?.letter_name || card?.hebrew?.letter || '';
    const image = card?.hebrew?.image || '';
    return letter ? `${letter}${image ? ` / ${image}` : ''} gives the letter-image layer.` : '';
  }
  function relphiLayer(card) { return card?.relphi?.summary || card?.relphi?.dossier_note || ''; }
  function signDerivation(sign) {
    const d = SIGN_DATA[sign] || {};
    const element = d.element || '';
    const mode = d.mode || '';
    const modeText = MODE_DERIVATIONS[mode] || '';
    const elementText = ELEMENT_DERIVATIONS[element] || '';
    const conditions = dignityConditionsFor(sign).filter(line => !line.startsWith((d.ruler || '') + ' rules'));
    return cleanSentence(`${sign} is ${mode} ${element}: ${modeText}${modeText && elementText ? '; ' : ''}${elementText}. ${d.ruler ? `${d.ruler} rules the field. ` : ''}${conditions.length ? `Conditions: ${conditions.join('; ')}.` : ''}`);
  }
  function planetDerivation(planet) { return `${planet}: ${PLANET_ACTIONS[planet] || 'supplies its planetary force'}.`; }
  const MAJOR_EMERGENCE = {
    the_fool: 'Emergence: beginning before definition.',
    the_magician: 'Emergence: the first act of translation.',
    the_high_priestess: 'Emergence: the passage through which signal becomes felt knowledge.',
    the_empress: 'Emergence: value becoming generative form.',
    the_emperor: 'Emergence: command as visible initiating fire.',
    the_hierophant: 'Emergence: value fixed into a form that can be taught, preserved, and handed down.',
    the_lovers: 'Emergence: choice made through distinction.',
    the_chariot: 'Emergence: a protected center moving through feeling.',
    strength: 'Emergence: life-force held without being denied.',
    the_hermit: 'Emergence: wisdom through exacting contact with the real.',
    wheel_of_fortune: 'Emergence: the field turning by increase, chance, and received motion.',
    justice: 'Emergence: relation brought under living measure.',
    the_hanged_man: 'Emergence: life released from command into suspension, receptivity, and altered relation.',
    death: 'Emergence: deep continuity transformed by necessary severance.',
    temperance: 'Emergence: fire made capable of mixture, travel, and meaning.',
    the_devil: 'Emergence: desire bound into material consequence.',
    the_tower: 'Emergence: force breaking a container that can no longer hold.',
    the_star: 'Emergence: hope as pattern held beyond the personal self.',
    the_moon: 'Emergence: feeling without firm edges.',
    the_sun: 'Emergence: life made visible without disguise.',
    judgement: 'Emergence: the call that changes the state of the whole field.',
    the_world: 'Emergence: the whole field made complete enough to bear reality.'
  };
  function aceSentence(name, element) {
    const line = {
      Fire: 'Fire at first appearance: the spark before the path. Will has not yet become action; it has only announced that action is possible.',
      Water: 'Water at first appearance: the open vessel before memory gathers. Feeling has not yet become story; it has only become receptive.',
      Air: 'Air at first appearance: the first distinction before argument, language, or judgment. Thought has not yet chosen a side; it has only made difference visible.',
      Earth: 'Earth at first appearance: the first substance before labor, possession, or exchange. Value has not yet become wealth; it has only become holdable.'
    }[element] || 'The suit appears at source before it becomes a situation.';
    return `${name}. ${line}`;
  }
  function courtSentence(card, name, element, elementText) {
    const rank = layerRankKey(card);
    const suit = suitDisplay(card);
    const formula = card.elemental_formula || card.systems?.thoth?.title || '';
    const a = card.astrology || {};
    const signs = signList(a.sign);
    const fields = signs.length ? signFieldForRange(signs) : '';
    const rulers = signRulersFor(card);
    const range = a.zodiac_range || a.degree_span || '';
    const fieldLine = fields ? ` Field: ${fields}.` : '';
    const rulerLine = rulers.length ? ` Ruling medium: ${rulers.join(' and ')}.` : '';
    const rangeLine = range ? ` Range: ${range}.` : '';
    const roleCode = courtRoleCode(card);
    const roleLine = roleCode === 'C1' ? 'The Page/Princess is first embodiment: the suit as seed, message, and learning body.'
      : roleCode === 'C2' ? 'The Knight/Prince is directed motion: the suit sent outward as quest, pursuit, argument, or charge.'
      : roleCode === 'C3' ? 'The Queen is reception with inward authority: the suit deepens, contains, and governs from within.'
      : 'The King/Knight is visible command: the suit administered outward as mastery, projection, or enacted authority.';
    const emergence = roleCode === 'C1' ? `Emergence: the first embodied ${suit} force, something that can be carried, fed, protected, or mishandled.`
      : roleCode === 'C2' ? `Emergence: ${suit} in pursuit, the field moving toward decision and consequence.`
      : roleCode === 'C3' ? `Emergence: ${suit} with inward authority, a field strong enough to receive and hold its own power.`
      : `Emergence: ${suit} under visible command, the field made capable of directing matter, feeling, thought, or fire.`;
    return cleanSentence(`${name}. ${formula ? `${formula}. ` : ''}${roleLine} ${suit} / ${element} gives the field: ${elementText}.${rangeLine}${fieldLine}${rulerLine} ${emergence}`);
  }
  function derivedMeaning(card) {
    if (!card) return '';
    const name = title(card);
    const a = card.astrology || {};
    const sign = a.sign || '';
    const signInfo = SIGN_DATA[sign] || {};
    const element = card.element || elementKey(card) || signInfo.element || '';
    const elementText = ELEMENT_DERIVATIONS[element] || ELEMENT_LAYER_SIGNATURES[element] || '';
    const rankKey = layerRankKey(card);
    const rankText = RANK_DERIVATIONS[rankKey] || RANK_DERIVATIONS[card.card_type] || 'a tarot function taking form';

    if (card.card_type === 'Major') {
      const parts = [`${name}.`, numberFunction(card)];
      if (sign) parts.push(signDerivation(sign));
      const planet = a.planet || '';
      if (planet) String(planet).split('/').map(x => x.trim()).filter(Boolean).forEach(p => parts.push(planetDerivation(p)));
      const rawElement = (a.zodiac_range || '').split('/').map(x => x.trim()).find(x => ELEMENT_DERIVATIONS[x]) || element;
      if (!sign && !planet && rawElement && ELEMENT_DERIVATIONS[rawElement]) parts.push(`${rawElement}: ${ELEMENT_DERIVATIONS[rawElement]}.`);
      if (a.zodiac_range && a.zodiac_range.includes('Earth') && !parts.join(' ').includes('Earth:')) parts.push(`Earth: ${ELEMENT_DERIVATIONS.Earth}.`);
      const letter = letterLayer(card); if (letter) parts.push(letter);
      const relphi = relphiLayer(card); if (relphi) parts.push(relphi);
      parts.push(MAJOR_EMERGENCE[card.card_id] || 'Emergence: the structural ingredients become a major station of experience.');
      return cleanSentence(parts.join(' '));
    }
    if (card.card_type === 'Ace') return cleanSentence(aceSentence(name, element));
    if (card.card_type === 'Court') return courtSentence(card, name, element, elementText);
    if (card.card_type === 'Pip') {
      const decanRuler = a.decan_ruler || a.planet || '';
      const force = decanRuler ? planetDerivation(decanRuler) : '';
      const signLine = sign ? signDerivation(sign) : '';
      return cleanSentence(`${rankText} applied to ${suitDisplay(card)} / ${element}. Element field: ${elementText}. ${force ? `Decan force: ${force} ` : ''}${signLine ? `Zodiac field: ${signLine} ` : ''}Emergence: number gives the event shape; element gives the field; planet, sign, ruler, and conditions decide how the event behaves.`);
    }
    return cleanSentence(`${card.card_type || 'Tarot'} structure taking form.`);
  }
  function displayMeaning(card) {
    return cleanSentence((derivedMeaning(card) || '').replace(/\bEmergence:\s*/g, ''));
  }
  const ELEMENT_REVERSAL_LENSES = {
    Earth: 'Earth reversed asks where matter, body, labor, money, food, or touch has become stuck, neglected, overcontrolled, or treated as the whole truth.',
    Air: 'Air reversed asks where language, comparison, distance, ideas, or judgment has become scattered, frozen, distorted, overexplained, or cut off from lived reality.',
    Water: 'Water reversed asks where feeling, memory, bonding, care, or receptivity has become withheld, flooded, confused, sentimentalized, or unable to circulate.',
    Fire: 'Fire reversed asks where will, appetite, courage, anger, visibility, or creative heat has become suppressed, reckless, exhausted, misdirected, or afraid to ignite.'
  };
  const MODE_REVERSAL_LENSES = {
    Cardinal: 'The initiating mode reverses into false starts, premature action, blocked beginnings, or a need to begin again with cleaner intent.',
    Fixed: 'The fixed mode reverses into rigidity, refusal, stagnation, overholding, or the need to release what has been preserved too tightly.',
    Mutable: 'The mutable mode reverses into drift, diffusion, mixed signals, nervous dispersal, or the need to choose what is actually changing.'
  };
  const RANK_REVERSAL_LENSES = {
    Ace: 'The first seed is present, but access to it is delayed, doubted, hidden, or not yet embodied.',
    Two: 'Relation turns into imbalance, projection, avoidance, or a polarity that has not found honest exchange.',
    Three: 'Expression and growth are blocked, scattered, performative, or developing without enough root.',
    Four: 'Structure becomes too tight, too defended, too inert, or too dependent on control.',
    Five: 'Pressure repeats without useful release, or conflict is turned inward, denied, exaggerated, or mishandled.',
    Six: 'Rebalancing is incomplete: help, harmony, recovery, or recognition may be uneven, conditional, or not yet trusted.',
    Seven: 'Testing becomes confusion, evasion, defensiveness, fantasy, or strategy without grounded direction.',
    Eight: 'Movement and adjustment become strain, compulsion, delay, overwork, misalignment, or pattern without freedom.',
    Nine: 'Ripeness turns inward as saturation, isolation, guardedness, private burden, or a threshold not yet crossed.',
    Ten: 'Completion becomes excess, exhaustion, consequence, burden, or a cycle that needs to end but keeps circulating.',
    Page: 'The first embodiment of the suit is unsure, untrained, overexposed, or still learning how to carry the message.',
    Princess: 'The first embodiment of the suit is unsure, untrained, overexposed, or still learning how to carry the message.',
    Knight: 'The outward command of the suit is misdirected, domineering, performative, or unable to govern its own force.',
    Prince: 'The moving Air-rank of the suit is in pursuit, but the motion may be scattered, reactive, impatient, or not yet answerable to consequence.',
    Queen: 'Inward authority is blocked, overprotective, flooded, withholding, or unsure what it can safely receive.',
    King: 'Visible command is inverted into control, overreach, abdication, pressure to perform, or authority not yet integrated.'
  };
  const PLANET_REVERSAL_LENSES = {
    Sun: 'The Sun reversed turns visibility inward: identity, vitality, confidence, or recognition may be dimmed, overexposed, or seeking a truer center.',
    Moon: 'The Moon reversed turns rhythm and memory into fluctuation, sleeplessness, mood-fog, projection, or feeling that needs containment.',
    Mercury: 'Mercury reversed turns the parser back on itself: words, signals, choices, data, and translation need review before they can be trusted.',
    Venus: 'Venus reversed asks whether value, pleasure, beauty, desire, money, or affection is being withheld, distorted, or offered without true consent.',
    Mars: 'Mars reversed asks whether force is suppressed, misdirected, inflamed, defensive, or unable to act cleanly.',
    Jupiter: 'Jupiter reversed asks whether growth, faith, generosity, meaning, or opportunity has become inflated, delayed, overpromised, or unintegrated.',
    Saturn: 'Saturn reversed asks whether structure, duty, time, fear, limits, or authority has become internalized, heavy, avoidant, or too severe.',
    Uranus: 'Uranus reversed asks whether breakthrough is trapped inside the system, erupting sideways, or refusing ordinary continuity.',
    Neptune: 'Neptune reversed asks where vision, longing, compassion, glamour, or dissolution has become fog, leakage, escape, or disillusionment.',
    Pluto: 'Pluto reversed asks where power, compulsion, grief, survival, or transformation is working below the surface before it can be named.'
  };
  function rankReversalLens(card) {
    if (!card) return '';
    if (card.card_type === 'Court') return RANK_REVERSAL_LENSES[card.rank] || RANK_REVERSAL_LENSES[card.rws_rank] || RANK_REVERSAL_LENSES[courtRoleLabel(card)] || '';
    return RANK_REVERSAL_LENSES[card.rank] || RANK_REVERSAL_LENSES[card.rws_rank] || RANK_REVERSAL_LENSES[card.card_type] || '';
  }
  function signReversalLens(sign) {
    const d = SIGN_DATA[sign] || {};
    const mode = d.mode || '';
    const element = d.element || '';
    const pieces = [];
    if (sign) pieces.push(`${sign} reversed asks for repair in its ${mode || 'zodiac'} ${element || 'field'}.`);
    if (mode && MODE_REVERSAL_LENSES[mode]) pieces.push(MODE_REVERSAL_LENSES[mode]);
    if (element && ELEMENT_REVERSAL_LENSES[element]) pieces.push(ELEMENT_REVERSAL_LENSES[element]);
    if (d.ruler && PLANET_REVERSAL_LENSES[d.ruler]) pieces.push(`Because ${d.ruler} rules the field: ${PLANET_REVERSAL_LENSES[d.ruler]}`);
    return cleanSentence(pieces.join(' '));
  }
  function planetReversalLens(planet) {
    return planet ? (PLANET_REVERSAL_LENSES[planet] || `${planet} reversed turns its planetary force inward, delayed, exaggerated, or misdirected until it can be integrated.`) : '';
  }
  function reversedDerivedMeaning(card) {
    if (!card) return '';
    const name = title(card);
    const a = card.astrology || {};
    const signs = signList(a.sign);
    const planetList = signList(a.planet || a.decan_ruler);
    const signInfo = SIGN_DATA[signs[0]] || {};
    const element = card.element || elementKey(card) || signInfo.element || '';
    const pieces = [`${name} reversed shows its core operation turning inward, meeting obstruction, becoming overextended, or returning for correction.`];
    if (card.card_type === 'Major') {
      const lens = planetReversalLens(planetList[0]) || (element && ELEMENT_REVERSAL_LENSES[element]) || rankReversalLens(card);
      if (lens) pieces.push(lens);
      return cleanSentence(pieces.join(' '));
    }
    const rankLine = rankReversalLens(card);
    if (rankLine) pieces.push(rankLine);
    else if (element && ELEMENT_REVERSAL_LENSES[element]) pieces.push(ELEMENT_REVERSAL_LENSES[element]);
    return cleanSentence(pieces.join(' '));
  }
  function layerInterpretationForOrientation(card, reversed = false) {
    return reversed ? reversedDerivedMeaning(card) : layerInterpretation(card);
  }
  function manualLayerInterpretation(card) {
    const map = {
      the_emperor: 'Protection: Earthly subsistence crosses into Mars, where life becomes boundary, defense, durable structure, and directed force.',
      the_star: 'The Star carries Aquarius, Saturn-ruled fixed Air: pattern, distance, groups, and future vision. Tzaddi, the fish-hook, draws possibility out of the unseen and gives hope a shape.'
    };
    return map[card?.card_id] || '';
  }
  function layerInterpretation(card) {
    return manualLayerInterpretation(card) || lockedRelphiInterpretation(card) || displayMeaning(card);
  }
  function statementForCard(card) {
    const locked = lockedRelphiInterpretation(card);
    if (locked) return locked;
    const raw = derivedMeaning(card) || '';
    const priority = detailSummaryForCard(card);
    if (!priority) return displayMeaning(card);
    const escapeRe = value => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let body = cleanSentence(raw.replace(/\bEmergence:\s*/g, '').trim());
    body = cleanSentence(body.replace(new RegExp('\\s*' + escapeRe(priority).replace(/\\\.$/, '') + '\\.?', 'i'), ' ').trim());
    return cleanSentence(`${priority} ${body}`);
  }
  function spreadStatementForCard(card) {
    return layerInterpretation(card);
  }

  function detailSummaryForCard(card) {
    if (!card) return '';
    const text = derivedMeaning(card) || '';
    const idx = text.indexOf('Emergence:');
    if (idx >= 0) return cleanSentence(text.slice(idx).replace(/^Emergence:\s*/,'').trim());
    if (card.card_type === 'Ace') return cleanSentence(text.replace(/^.*?\.\s*/, '').trim());
    return '';
  }
  function dignityLine(sign) {
    const d = SIGN_DATA[sign];
    if (!d) return '';
    const bits = [`${sign} is ruled by ${d.ruler}`];
    if (d.exaltation) bits.push(`${d.exaltation} is exalted there`);
    if (d.detriment) bits.push(`${d.detriment} is in detriment`);
    if (d.fall) bits.push(`${d.fall} is in fall`);
    return bits.join('; ') + '.';
  }
  function signList(value) {
    return String(value || '').split(',').map(x => x.trim()).filter(Boolean);
  }
  function unique(values) {
    return Array.from(new Set(values.filter(Boolean)));
  }
  function signRulersFor(card) {
    const a = card?.astrology || {};
    const explicit = signList(a.sign_ruler);
    if (explicit.length) return unique(explicit);
    return unique(signList(a.sign).map(sign => SIGN_DATA[sign]?.ruler));
  }
  function signFieldForRange(signs) {
    return signs.map(sign => {
      const field = signField(sign);
      return field ? `${sign}'s field of ${field}` : sign;
    }).join('; ');
  }
  function courtRulerInteraction(card) {
    if (!card || card.card_type !== 'Court') return '';
    const a = card.astrology || {};
    const formula = card.elemental_formula || card.systems?.thoth?.title || card.name;
    const titleText = title(card);
    if (isPrincessCourt(card)) {
      const shared = acePrincessRangeForCard(card);
      return `${formula}. ${shared ? shared.note : 'Princesses share the quadrant of the Ace of their suit.'}`;
    }
    const signs = signList(a.sign);
    const rulers = signRulersFor(card).filter(Boolean);
    const range = a.zodiac_range || a.degree_span || '';
    const rangeText = signs.length ? `${range || signs.join(' through ')}` : 'its zodiac range';
    const signFieldText = signs.length ? signFieldForRange(signs) : '';
    const titleFormula = formula || titleText;
    const rulerPhrase = rulers.length === 1 ? `${rulers[0]}-ruled` : rulers.length ? `${rulers.join(' and ')}-ruled` : '';
    if (signFieldText) {
      return `${titleFormula} moves through ${rangeText}${rulerPhrase ? ` in the ${rulerPhrase} fields` : ''}: ${signFieldText}.`;
    }
    return `${titleFormula} moves through ${rangeText}.`;
  }


  function publicTags(card) {
    const hidden = new Set([
      'Relphi', 'Pluto', 'Minimization', 'Burial', 'Internal', 'Active',
      'stable_symbol_id', 'stable_symbol_kind'
    ]);
    const names = new Set([
      title(card), normalizedTitle(card), card?.name, card?.systems?.golden_dawn_rws?.display_name, card?.systems?.thoth?.display_name, card?.systems?.thoth?.title
    ].filter(Boolean).map(value => String(value).toLowerCase()));
    return (card.tags || []).filter(tag => {
      const text = String(tag || '').trim();
      if (!text || hidden.has(text)) return false;
      return !names.has(text.toLowerCase());
    }).slice(0, 8);
  }

  function relphiLayerHtml(card) {
    if (UHN_ORDER.has(card?.card_id)) return '';
    const rel = card?.relphi;
    if (!rel) return '';
    const fields = [];
    if (rel.title) fields.push(field('Relphi title', rel.title));
    if (rel.summary) fields.push(field('Summary', rel.summary));
    const needs = rel.universal_human_needs;
    if (needs) {
      if (needs.role) fields.push(field('Role', needs.role));
      if (needs.station) fields.push(field('Station', needs.station));
      if (needs.interval) fields.push(field('Planetary interval', needs.interval));
      if (needs.need) fields.push(field('Unmet need', needs.need));
      if (needs.transformation) fields.push(field('Transformation', needs.transformation));
    }
    if (rel.dossier_note && !rel.pluto_note) fields.push(field('Note', rel.dossier_note));
    if (!fields.length) return '';
    return `<section class="relphi-layer system-card"><h3>Relphi</h3><dl>${fields.join('')}</dl></section>`;
  }

  function systemNamesHtml(card) { return ''; }

  function zodiacRangeGraphicHtml(card) {
    const a = card?.astrology || {};
    const shared = acePrincessRangeForCard(card);
    const range = shared ? shared.label : (a.degree_span || a.zodiac_range || '');
    const signIndex = Object.fromEntries(SIGNS.map((s,i)=>[s,i]));
    const numberWord = { zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15, sixteen:16, seventeen:17, eighteen:18, nineteen:19, twenty:20, thirty:30 };
    const num = v => numberWord[String(v||'').toLowerCase()] ?? Number(v);
    const elementColor = { Fire:'#ff4a4f', Earth:'#58c63b', Air:'#f4de49', Water:'#4b89e8' };
    const signData = sign => SIGN_DATA[sign] || {};
    const polar = (deg, r) => { const rad = (deg + 180) * Math.PI / 180; return [120 + r * Math.cos(rad), 120 + r * Math.sin(rad)]; };
    const arc = (start, end, r) => { const [sx,sy]=polar(start,r), [ex,ey]=polar(end,r); const diff=((end-start)%360+360)%360 || 360; const large=diff>180?1:0; return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`; };
    const ringWedge = (start, end, r1, r2) => { const [sx,sy]=polar(start,r2), [ex,ey]=polar(end,r2), [ix,iy]=polar(end,r1), [jx,jy]=polar(start,r1); const diff=((end-start)%360+360)%360 || 360; const large=diff>180?1:0; return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r2} ${r2} 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)} L ${ix.toFixed(2)} ${iy.toFixed(2)} A ${r1} ${r1} 0 ${large} 0 ${jx.toFixed(2)} ${jy.toFixed(2)} Z`; };
    let start=null,end=null,label='';
    if (shared) {
      start = signIndex[shared.startSign]*30 + shared.startDegree;
      end = signIndex[shared.endSign]*30 + shared.endDegree;
      if (end <= start) end += 360;
      label = shared.label;
    } else {
      let m = String(range).match(/(\d+(?:\.\d+)?|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty) degrees ([A-Za-z]+) through (\d+(?:\.\d+)?|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty) degrees ([A-Za-z]+)/i);
      if (m && signIndex[m[2]] != null && signIndex[m[4]] != null) {
        start = signIndex[m[2]]*30 + num(m[1]); end = signIndex[m[4]]*30 + num(m[3]); if (end <= start) end += 360; label = `${m[2]} ${num(m[1])}° → ${m[4]} ${num(m[3])}°`;
      } else if (a.sign && signIndex[a.sign] != null) {
        start = signIndex[a.sign]*30; end = start + 30; label = `${a.sign} 0° → 30°`;
      } else return '';
    }
    const signs = SIGNS.map((sign,i)=>{const s=i*30,e=s+30,mid=s+15;const [tx,ty]=polar(mid,95);const data=signData(sign);return `<path class="zodiac-range-sign ${String(data.element||'').toLowerCase()}" d="${arc(s,e,78)}"></path><text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(SIGN_GLYPHS[sign]||sign[0])}</text>`}).join('');
    const [a1x,a1y]=polar(start,66), [a2x,a2y]=polar(end,66);
    const spanPath = ringWedge(start,end,54,72);
    const primarySign = shared?.startSign || a.sign || Object.keys(signIndex).find(sign => start >= signIndex[sign]*30 && start < signIndex[sign]*30+30) || '';
    const color = elementColor[signData(primarySign).element || card.element] || '#dc1f18';
    return `<section class="zodiac-range-graphic"><h3>Zodiac range</h3><svg viewBox="0 0 240 240" role="img" aria-label="${escapeHtml(label)}"><circle class="zodiac-range-base" cx="120" cy="120" r="80"></circle>${signs}<path class="zodiac-range-active" d="${spanPath}" style="--range-color:#dc1f18"></path><circle class="zodiac-range-center" cx="120" cy="120" r="20"></circle></svg></section>`;
  }
  const CARD_NOTES_KEY = 'relphiTarotCardNotesV1';
  function readCardNotesStore() {
    try { const parsed = JSON.parse(localStorage.getItem(CARD_NOTES_KEY) || '{}'); return parsed && typeof parsed === 'object' ? parsed : {}; }
    catch (error) { return {}; }
  }
  function writeCardNotesStore(notes) { localStorage.setItem(CARD_NOTES_KEY, JSON.stringify(notes || {})); }
  function getCardNote(cardId) { return String(readCardNotesStore()[cardId] || ''); }
  function setCardNote(cardId, value) {
    if (!cardId) return;
    const notes = readCardNotesStore();
    const text = String(value || '').slice(0, 12000);
    if (text.trim()) notes[cardId] = text; else delete notes[cardId];
    writeCardNotesStore(notes);
  }
  function cardNotesHtml(card) {
    const note = getCardNote(card.card_id);
    return `<section class="card-user-notes" data-card-note-box="${escapeHtml(card.card_id)}"><h3>Your notes</h3><textarea data-card-note="${escapeHtml(card.card_id)}" rows="6" placeholder="Ex. Add your own notes for ${escapeHtml(title(card))}. These save in this browser.">${escapeHtml(note)}</textarea><p class="generated-note card-note-status" data-card-note-status="${escapeHtml(card.card_id)}">${note ? 'Saved locally in this browser.' : 'No note saved yet.'}</p></section>`;
  }
  function bindCardNoteEditor(root) {
    if (!root) return;
    qsa('[data-card-note]', root).forEach(textarea => {
      if (textarea.dataset.noteReady) return;
      let timer = null;
      const status = root.querySelector(`[data-card-note-status="${textarea.dataset.cardNote.replace(/"/g, '\\"')}"]`);
      const save = () => {
        setCardNote(textarea.dataset.cardNote, textarea.value);
        if (status) status.textContent = textarea.value.trim() ? 'Saved locally in this browser.' : 'No note saved yet.';
      };
      textarea.addEventListener('input', () => {
        if (status) status.textContent = 'Saving…';
        window.clearTimeout(timer);
        timer = window.setTimeout(save, 220);
      });
      textarea.addEventListener('change', save);
      textarea.dataset.noteReady = 'true';
    });
  }

  function cardDetailHtml(card, eyebrow = 'Selected card') {
    if (!card) return '<h2>No card selected</h2><p>Search, show all, or draw a spread to inspect cards.</p>';
    const inShortList = state.shortList.includes(card.card_id);
    const rowButtonLabel = inShortList ? 'Remove from Drawing Board' : 'Add to Drawing Board';
    const glyphTags = renderGlyphChips(card);
    return `
      <p class="eyebrow">${escapeHtml(eyebrow)}</p>
      <div class="tarot-detail-head full-entry-priority full-entry-consolidated">
        <div class="full-entry-main">
          <section class="full-entry-hero system-card">
            <figure class="tarot-card-art tarot-card-art--corner">
              <img src="${escapeHtml(rwsImagePath(card))}" alt="${escapeHtml(rwsImageAlt(card))}" loading="lazy">
              <figcaption>Rider-Waite-Smith card art</figcaption>
            </figure>
            <div class="full-entry-title-block">
              <div class="full-entry-title-row"><h2>${titleWithBreaksHtml(card)}</h2><div class="or-card-badges relphi-sticker-row detail-glyph-panel" aria-label="Clickable card filters">${glyphTags}</div></div>
              ${UHN_ORDER.has(card.card_id) ? uhnPanelHtml(card) : (lockedRelphiInterpretation(card) ? `<section class="interpretation-card--priority locked-relphi-priority"><h3>Relphi-derived interpretation</h3><p>${escapeHtml(lockedRelphiInterpretation(card))}</p></section>` : '')}
              <button class="significator-pick full-entry-row-button" type="button" data-shortlist="${escapeHtml(card.card_id)}" aria-label="${escapeHtml(rowButtonLabel)}" aria-pressed="${inShortList?'true':'false'}"><span class="row-add-label">${rowButtonLabel}</span><span class="row-add-icon" aria-hidden="true">${inShortList?'−':'+'}</span></button>
            </div>
            ${lockedIngredientsHtml(card)}
          </section>
          ${lockedInterpretationComparisonHtml(card)}
          ${zodiacRangeGraphicHtml(card)}
          ${signList(card.astrology?.sign).length === 1 && SIGN_DATA[card.astrology?.sign] ? `<p class="generated-note">${escapeHtml(dignityLine(card.astrology.sign))}</p>` : ''}
          ${card.card_type === 'Pip' ? `<section class="ruler-interaction"><p class="eyebrow">Ruler interaction</p><p>${escapeHtml(decanRulerInteraction(card))}</p></section>` : ''}
          ${card.card_type === 'Court' ? `<section class="ruler-interaction"><p class="eyebrow">Formula interaction</p><p>${escapeHtml(courtRulerInteraction(card))}</p></section>` : ''}
          ${relphiLayerHtml(card)}
          ${cardNotesHtml(card)}
        </div>
      </div>`;
  }
  function bindDetailCustomArt(root) {
    if (!root) return;
    qsa('[data-detail-art-upload]', root).forEach(btn => {
      btn.addEventListener('click', event => {
        event.preventDefault();
        const cardId = btn.dataset.detailArtUpload || '';
        const fileInput = qsa('[data-detail-art-file]', root).find(input => input.dataset.detailArtFile === cardId);
        if (fileInput) fileInput.click();
      });
    });
    qsa('[data-detail-art-file]', root).forEach(input => {
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        const cardId = input.dataset.detailArtFile;
        if (!file || !cardId) return;
        const reader = new FileReader();
        reader.onload = () => setCustomCardArt(cardId, String(reader.result || ''));
        reader.readAsDataURL(file);
        input.value = '';
      });
    });
    qsa('[data-detail-art-reset]', root).forEach(btn => {
      btn.addEventListener('click', event => { event.preventDefault(); setCustomCardArt(btn.dataset.detailArtReset, ''); });
    });
  }
  function renderDetail(card) {
    const panel = $('cardDetail');
    panel.innerHTML = cardDetailHtml(card);
    bindCardNoteEditor(panel);

  }
  function spreadPositionDetailHtml(item) {
    if (!item) return '';
    const number = item.number ? `Card ${item.number}` : 'Spread position';
    return `<section class="spread-position-detail">
      <p class="eyebrow">Position significance</p>
      <h3>${escapeHtml(number)}: ${escapeHtml(item.position || 'Position')}</h3>
      <p>${escapeHtml(item.meaning || 'Position meaning.')}</p>
    </section>`;
  }
  function renderSpreadCardDetail(card, item) {
    const panel = $('spreadCardDetail');
    if (!panel) return;
    panel.hidden = false;
    panel.innerHTML = spreadPositionDetailHtml(item) + cardDetailHtml(card, 'Spread card database entry');
    bindCardNoteEditor(panel);

    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }


  function showAll() {
    state.mode = 'all'; state.query = ''; state.cardFilters = []; $('oracleCommand').value = ''; showPanel('browsePanel'); setVisible('visibilityPanel', false); renderBrowse(); pushHistory();
  }
  function clearToIdle() {
    collapseCardRow();
    state.mode = 'idle'; state.query = ''; state.selected = null; state.cardFilters = []; $('oracleCommand').value = ''; showPanel(null); updateSummary([]); hideCommandMenu(); pushHistory();
  }
  function dateInputValueFromDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function parseDateSearchQuery(value) {
    const text = String(value || '').trim();
    if (!text || !/\d/.test(text)) return null;
    const monthName = /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i;
    const dateLike = /^\d{4}-\d{1,2}-\d{1,2}$/.test(text) || /^\d{1,2}[\/.-]\d{1,2}(?:[\/.-]\d{2,4})?$/.test(text) || monthName.test(text);
    if (!dateLike) return null;
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0);
  }
  function openDateFromSearch(value) {
    const parsed = parseDateSearchQuery(value);
    if (!parsed) return false;
    const dateValue = dateInputValueFromDate(parsed);
    $('dateInput').value = dateValue;
    readDate();
    state.mode = 'search';
    state.query = `date:${dateValue}`;
    state.cardFilters = [];
    state.selected = null;
    showPanel('browsePanel');
    setVisible('visibilityPanel', false);
    hideCommandMenu();
    renderBrowse();
    pushHistory();
    return true;
  }

  function skySearchLooksLikePlacements(text) {
    const value = String(text || '').trim();
    if (!value) return false;
    const bodyNames = ['Part of Fortune','North Node','Ascendant','Rising','Midheaven','Mercury','Jupiter','Saturn','Uranus','Neptune','Chiron','Lilith','Vertex','Fortune','Pluto','Venus','Moon','Mars','Node','Sun','ASC','MC'];
    const signNames = SIGNS.concat(['Ari','Tau','Gem','Can','Vir','Lib','Sco','Scorp','Sag','Cap','Aqu','Pis']);
    const countMatches = list => list.reduce((count, item) => count + (new RegExp(`\\b${item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi').test(value) ? 1 : 0), 0);
    const bodyCount = countMatches(bodyNames);
    const signCount = countMatches(signNames);
    return /[°º]|[♈♉♊♋♌♍♎♏♐♑♒♓]|\n|\bHouse\b|\bretrograde\b|\bRx\b/i.test(value) || (bodyCount >= 2 && signCount >= 2);
  }
  function openSkyChartFromPastedSearch(value) {
    const text = String(value || '').trim();
    if (!text || !skySearchLooksLikePlacements(text)) return false;
    const payload = parseSkyText(text);
    const placements = payload.placements || {};
    if (Object.keys(placements).filter(body => placements[body]?.sign).length < 2) return false;
    openChart();
    setSkyCreatorKind('chart');
    const box = $('skyCreatorPaste') || $('astroSeekPaste');
    if (box) box.value = text;
    applySkyPayload('chart', payload);
    resetSkyCreatorBuilder();
    renderSkyCreator();
    renderChart();
    renderCurrentSky();
    return true;
  }

  function runSearch(raw, saveHistory = true, preserveFilters = false) {
    const value = (raw ?? $('oracleCommand').value).trim();
    if (!value) { clearToIdle(); return; }
    if (value.startsWith('/')) { handleSlash(value); return; }
    if (openSkyChartFromPastedSearch(value)) return;
    if (openDateFromSearch(value)) return;
    if (!preserveFilters) state.cardFilters = [];
    state.mode = 'search'; state.query = value; showPanel('browsePanel'); setVisible('visibilityPanel', false); hideCommandMenu(); renderBrowse(); if (saveHistory) pushHistory();
  }
  function clearSearchKeywordsKeepFilters() {
    state.query = '';
    if ($('oracleCommand')) $('oracleCommand').value = '';
    updateClearKeywordButtons();
    state.selected = null;
    if (!['all','search'].includes(state.mode)) {
      hideCommandMenu();
      return;
    }
    if (state.cardFilters.length) {
      state.mode = 'all';
      showPanel('browsePanel');
      setVisible('visibilityPanel', false);
      renderBrowse();
    } else {
      clearToIdle();
      return;
    }
    hideCommandMenu();
    pushHistory();
  }
  let commandSkyImportTimer = null;
  function handleSearchInput(event) {
    updateClearKeywordButtons();
    renderCommandMenu();
    window.clearTimeout(commandSkyImportTimer);
    const value = $('oracleCommand')?.value || '';
    if (!String(value).trim().startsWith('/') && skySearchLooksLikePlacements(value)) {
      commandSkyImportTimer = window.setTimeout(() => openSkyChartFromPastedSearch(value), 520);
    }
  }
  function signFromCommandText(text) {
    const lower = String(text || '').toLowerCase();
    return SIGNS.find(sign => lower.includes(sign.toLowerCase())) || '';
  }
  function setChartPlacement(body, sign, options = {}) {
    if (!body || !sign || !SIGNS.includes(sign)) return false;
    const placements = { ...(state.chart || {}) };
    placements[body] = { ...(placements[body] || {}), sign, degree: options.degree ?? null, minute: options.minute ?? null, house: options.house ?? null, retrograde: !!options.retrograde };
    state.chart = placements;
    renderChartForm();
    writeChartForm(placements, { forcePasteSync: true, skipRender: true });
    syncSkyPasteFromPlacements('chart', placements, true);
    renderChart();
    return true;
  }

  function handleSlash(value) {
    const text = value.slice(1).trim();
    const lower = text.toLowerCase();
    if (!text || lower === 'show all' || lower === 'all') { showAll(); return; }
    if (lower.startsWith('draw')) { openSpread(); return; }
    if (lower.startsWith('spell')) { const spellText = text.replace(/^spell\s*/i, ''); if (spellText && openSpellSequence(spellText)) return; updateSummary([]); hideCommandMenu(); return; }
    if (lower.startsWith('date')) { const dateText = text.replace(/^date\s*/i, ''); if (dateText && openDateFromSearch(dateText)) return; openDate(); return; }
    if (lower.startsWith('current') || lower.startsWith('sky') || lower.startsWith('chart placement')) { openChart(); return; }
    if (lower.startsWith('rising') || lower.startsWith('ascendant') || lower.startsWith('asc ')) {
      openChart();
      const sign = signFromCommandText(text);
      if (sign) setChartPlacement('Rising', sign);
      return;
    }
    if (lower.startsWith('horizon') || lower.startsWith('observe') || lower.startsWith('where ') || lower.startsWith('can i see')) {
      const body = BODIES.find(b => lower.includes(b.toLowerCase())) || 'Saturn';
      window.location.href = `planetaryhours.html?body=${encodeURIComponent(body)}`;
      return;
    }
    if (lower.startsWith('chart') || BODIES.some(b => lower.startsWith(b.toLowerCase()))) { openChart(); return; }
    if (lower.startsWith('theme ')) { runSearch(text.replace(/^theme\s*/i, '')); return; }
    if (lower.startsWith('planet ')) { runSearch(text.replace(/^planet\s*/i, '')); return; }
    if (lower.startsWith('sign ')) { runSearch(text.replace(/^sign\s*/i, '')); return; }
    if (lower.startsWith('card ')) { runSearch(text.replace(/^card\s*/i, '')); return; }
    runSearch(text);
  }
  function commandSuggestions(value) {
    const raw = value || '';
    if (!raw.startsWith('/')) return [];
    const term = raw.slice(1).trim().toLowerCase();
    const base = [
      ['show all','Show All Cards'], ['draw','Draw Cards'], ['date ','Look Up a Date'], ['spell ','Spell Hebrew letters as cards'], ['chart','Chart Placement'], ['card ','Look Up a Card'], ['planet ','Filter by Planet'], ['sign ','Filter by Sign'], ['theme ','Search a Theme'], ['rising ','Add Rising Sign']
    ];
    return base.filter(([cmd, label]) => !term || cmd.includes(term) || label.toLowerCase().includes(term)).slice(0, 8);
  }
  function renderCommandMenu() {
    const menu = $('commandMenu');
    const suggestions = commandSuggestions($('oracleCommand').value);
    if (!suggestions.length) { hideCommandMenu(); return; }
    menu.hidden = false;
    menu.innerHTML = suggestions.map(([cmd, label]) => `<button type="button" data-command="/${escapeHtml(cmd)}"><span>${escapeHtml(label)}</span><small>/${escapeHtml(cmd)}</small></button>`).join('');
    qsa('button', menu).forEach(btn => btn.addEventListener('click', () => { $('oracleCommand').value = btn.dataset.command; $('oracleCommand').focus(); if (!btn.dataset.command.endsWith(' ')) runSearch(btn.dataset.command); else hideCommandMenu(); }));
  }
  function hideCommandMenu() { $('commandMenu').hidden = true; $('commandMenu').innerHTML = ''; }

  const RANK_MODE_GROUPS = { cardinal: ['Two','Three','Four'], fixed: ['Five','Six','Seven'], mutable: ['Eight','Nine','Ten'] };
  function rankInput(value) { return document.querySelector(`input[data-filter-group="rank"][value="${value}"]`); }
  function syncRankModeToggles() {
    qsa('input[data-rank-mode]').forEach(toggle => {
      const values = RANK_MODE_GROUPS[toggle.dataset.rankMode] || [];
      toggle.checked = values.every(value => rankInput(value)?.checked);
    });
  }
  function setRankMode(mode, checked) {
    (RANK_MODE_GROUPS[mode] || []).forEach(value => { const input = rankInput(value); if (input) input.checked = checked; });
    syncRankModeToggles();
    renderBrowse();
  }
  function resetVisibility() { qsa('input[data-filter-group]').forEach(i => i.checked = true); syncRankModeToggles(); renderBrowse(); }
  function showDecansOnly() {
    qsa('input[data-filter-group]').forEach(i => { i.checked = false; });
    qsa('input[data-filter-group="type"][value="Pip"], input[data-filter-group="rank"][value="Two"], input[data-filter-group="rank"][value="Three"], input[data-filter-group="rank"][value="Four"], input[data-filter-group="rank"][value="Five"], input[data-filter-group="rank"][value="Six"], input[data-filter-group="rank"][value="Seven"], input[data-filter-group="rank"][value="Eight"], input[data-filter-group="rank"][value="Nine"], input[data-filter-group="rank"][value="Ten"], input[data-filter-group="suit"], input[data-filter-group="element"]')
      .forEach(i => i.checked = true);
    syncRankModeToggles();
    renderBrowse();
  }

  function spreadViewChoices(key) { return []; }
  function renderSpreadViewOptions() {}
  function currentSpreadView(key) { return 'responsive'; }
  function syncSpreadControls(key = $('spreadSelect')?.value || state.currentSpreadKey || 'pastPresentFuture') {
    const toggle = $('crossedLayoutToggle');
    if (!toggle) return;
    const label = toggle.closest('label');
    const active = key === 'celticCross';
    toggle.disabled = !active;
    toggle.setAttribute('aria-disabled', active ? 'false' : 'true');
    if (label) label.classList.toggle('is-disabled', !active);
  }
  function openSpread() { collapseCardRow(); state.mode = 'spread'; showPanel('spreadPanel'); updateSummary(state.currentSpread); hideCommandMenu(); syncSpreadControls(); pushHistory(); }
  function drawSpread() {
    const key = $('spreadSelect').value, positions = SPREADS[key];
    const deck = cards.slice(), drawn = [];
    positions.forEach((position, index) => {
      const idx = Math.floor(Math.random() * deck.length);
      drawn.push({
        number: index + 1,
        position: position.title || String(position),
        meaning: position.meaning || '',
        card: deck.splice(idx, 1)[0],
        orientation: 'upright',
        revealed: false,
        interpretationRevealed: false,
        crossingUpright: false
      });
    });
    state.currentSpread = drawn;
    state.currentSpreadKey = key;
    syncSpreadControls(key);
    state.revealGuideActive = state.revealGuideEnabled;
    if ($('spreadCardDetail')) { $('spreadCardDetail').hidden = true; $('spreadCardDetail').innerHTML = ''; }
    renderSpread(); updateSummary([]);
  }
  function spreadCardMarkup(item, index, isCeltic = false) {
    const cardNo = item.number || index + 1;
    const firstHidden = state.currentSpread.findIndex(x => !x.revealed);
    const guideClass = state.revealGuideActive && !item.revealed && index === firstHidden ? ' next-to-reveal' : '';
    const baseClass = `spread-card relphi-surface relphi-surface--spread${isCeltic ? ` celtic-position celtic-pos-${cardNo}` : ''}${guideClass}`;
    const meaning = item.meaning || 'Position meaning.';
    const showPositionSticker = state.positionStickers;
    const tutorialBadge = state.revealGuideEnabled ? `<small class="tutorial-order-badge">${cardNo}</small>` : '';
    const sticker = showPositionSticker ? `<div class="spread-position-panel"><span class="position-sticker relphi-sticker relphi-sticker--position">${tutorialBadge}<strong>${escapeHtml(item.position)}</strong></span></div>` : '';
    if (!item.revealed) {
      return `<article class="${baseClass} is-facedown" data-spread-index="${index}" data-card-number="${cardNo}" data-index="${index}" tabindex="0" aria-label="Reveal ${escapeHtml(item.position)}. ${escapeHtml(meaning)}">
        ${sticker}
        <button class="question-card turn-card card-back-tile" type="button" data-index="${index}" aria-label="Reveal ${escapeHtml(item.position)}">
          <img class="card-back-art" src="assets/tarot/rws/card-back.png" alt="" aria-hidden="true" loading="lazy">
          <span class="card-back-pattern" aria-hidden="true"></span>
        </button>
      </article>`;
    }
    const eyebrow = state.revealGuideEnabled ? `Step ${cardNo}` : item.position;
    return `<article class="${baseClass} is-revealed is-card-face" data-spread-index="${index}" data-card-number="${cardNo}" data-index="${index}" tabindex="0" aria-label="${escapeHtml(title(item.card))}. Focus or hover for interpretation.">
      ${sticker}
      <img class="spread-card-art relphi-surface-face" src="${escapeHtml(rwsImagePath(item.card))}" alt="${escapeHtml(rwsImageAlt(item.card))}" loading="lazy">
      <div class="spread-info-layer relphi-info-layer">
        <div class="spread-info-head relphi-info-static">
          <p class="eyebrow">${escapeHtml(eyebrow)}</p>
          <button class="card-title-link inspect-card" type="button" data-id="${escapeHtml(item.card.card_id)}" data-index="${index}">${escapeHtml(normalizedTitle(item.card))}</button>
          <p class="position-meaning">${escapeHtml(item.position)}</p>
        </div>
        <div class="spread-info-scroll relphi-info-scroll">
          <p>${escapeHtml(nbHyphens(spreadStatementForCard(item.card)))}</p>
        </div>
      </div>
    </article>`;
  }

  function revealSpreadItem(index) {
    const n = Number(index);
    if (state.revealGuideActive) {
      const firstHidden = state.currentSpread.findIndex(x => !x.revealed);
      if (n !== firstHidden) state.revealGuideActive = false;
    }
    const item = state.currentSpread[n];
    if (item) { item.revealed = true; item.interpretationRevealed = false; }
    renderSpread();
    updateSummary(state.currentSpread.filter(x => x.revealed));
  }
  function setSpreadInterpretation(index, value) {
    const item = state.currentSpread[Number(index)];
    if (item) item.interpretationRevealed = value;
  }
  function inspectSpreadCardButton(btn) {
    const card = cards.find(c => c.card_id === btn.dataset.id);
    const item = state.currentSpread[Number(btn.dataset.index)];
    state.selected = card || state.selected;
    renderSpreadCardDetail(card, item);
  }
  function activateSpreadCard(card) {
    const index = card.dataset.index;
    if (card.classList.contains('is-facedown')) revealSpreadItem(index);
  }
  function handleSpreadClick(event) {
    const out = $('spreadOutput');
    const inspect = event.target.closest('.inspect-card');
    if (inspect && out.contains(inspect)) { event.stopPropagation(); inspectSpreadCardButton(inspect); return; }
    const card = event.target.closest('.spread-card');
    if (!card || !out.contains(card)) return;
    event.preventDefault();
    activateSpreadCard(card);
  }
  function handleSpreadKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const out = $('spreadOutput');
    const card = event.target.closest('.spread-card');
    if (!card || !out.contains(card)) return;
    if (event.target.closest('.inspect-card')) return;
    event.preventDefault();
    activateSpreadCard(card);
  }

  function clearCelticFitDiagram(out) {
    if (!out) return;
    out.classList.remove('celtic-fit-diagram');
    ['--cc-card-w','--cc-card-h','--cc-frame-w','--cc-frame-h'].forEach(name => out.style.removeProperty(name));
    out.querySelectorAll('.celtic-position').forEach(card => {
      ['--cc-left','--cc-top','--cc-card-w','--cc-card-h','--cc-transform'].forEach(name => card.style.removeProperty(name));
    });
  }
  function fitCelticCrossToFold() {
    const out = $('spreadOutput');
    if (!out || !out.classList.contains('celtic-cross-spread') || !state.currentSpread.length) {
      clearCelticFitDiagram(out);
      return;
    }
    const cardsInSpread = Array.from(out.querySelectorAll('.celtic-position'));
    if (!cardsInSpread.length) return;
    const outRect = out.getBoundingClientRect();
    const computed = window.getComputedStyle(out);
    const padX = (parseFloat(computed.paddingLeft) || 0) + (parseFloat(computed.paddingRight) || 0);
    const padY = (parseFloat(computed.paddingTop) || 0) + (parseFloat(computed.paddingBottom) || 0);
    const viewportH = window.innerHeight || document.documentElement.clientHeight || 720;
    const viewportW = window.innerWidth || document.documentElement.clientWidth || 1024;
    const availableW = Math.max(360, Math.min(out.clientWidth - padX, viewportW - 36));
    const availableH = Math.max(300, viewportH - Math.max(0, outRect.top) - 24 - padY);
    const ratio = 866 / 500;
    const gapU = 0.12;
    const ladderGapU = 0.55;
    const widthFactor = 5 + (3 * gapU) + ladderGapU;
    const heightFactor = (4 * ratio) + (3 * gapU);
    // Size is width-governed so turning a card does not resize the whole spread.
    const rawW = Math.min(availableW / widthFactor, 160);
    const w = Math.max(96, Math.floor(rawW));
    const h = Math.round(w * ratio);
    const gap = Math.max(8, Math.round(w * gapU));
    const ladderGap = Math.max(16, Math.round(w * ladderGapU));
    const row0 = 0;
    const row1 = h + gap;
    const row2 = (h + gap) * 2;
    const row3 = (h + gap) * 3;

    const behindX = 0;
    const coverSideX = behindX + w + gap;
    const crossSideX = coverSideX + w + gap;
    const beforeX = crossSideX + w + gap;
    const axis = ((coverSideX + (w / 2)) + (crossSideX + (w / 2))) / 2;
    const crownX = Math.round(axis - (w / 2));
    const beneathX = crownX;
    const ladderX = beforeX + w + ladderGap;
    const rotatedW = h;
    const rotatedH = w;
    const coverCrossedX = Math.round(axis - (w / 2));
    const crossCrossedX = coverCrossedX;
    const crossCrossedY = row1;

    const positions = {
      1: state.crossedLayout ? [coverCrossedX, row1, 'none'] : [coverSideX, row1, 'none'],
      2: state.crossedLayout ? [crossCrossedX, crossCrossedY, 'rotate(90deg)'] : [crossSideX, row1, 'none'],
      3: [crownX, row0, 'none'],
      4: [beneathX, row2, 'none'],
      5: [behindX, row1, 'none'],
      6: [beforeX, row1, 'none'],
      7: [ladderX, row3, 'none'],
      8: [ladderX, row2, 'none'],
      9: [ladderX, row1, 'none'],
      10: [ladderX, row0, 'none']
    };
    const frameW = ladderX + w;
    const frameH = row3 + h;
    const offsetX = Math.max(0, Math.floor((availableW - frameW) / 2));
    out.classList.add('celtic-fit-diagram');
    out.style.setProperty('--cc-card-w', `${w}px`);
    out.style.setProperty('--cc-card-h', `${h}px`);
    out.style.setProperty('--cc-frame-w', `${frameW}px`);
    out.style.setProperty('--cc-frame-h', `${frameH}px`);
    cardsInSpread.forEach(card => {
      const n = Number(card.dataset.cardNumber || card.dataset.index || 0);
      const pos = positions[n];
      if (!pos) return;
      card.style.setProperty('--cc-left', `${Math.round(offsetX + pos[0])}px`);
      card.style.setProperty('--cc-top', `${Math.round(pos[1])}px`);
      card.style.setProperty('--cc-card-w', `${w}px`);
      card.style.setProperty('--cc-card-h', `${h}px`);
      card.style.setProperty('--cc-transform', pos[2]);
    });
  }
  function scheduleCelticFit() {
    window.requestAnimationFrame(fitCelticCrossToFold);
  }

  function renderSpread() {
    const out = $('spreadOutput');
    const key = state.currentSpreadKey || $('spreadSelect').value;
    if (!state.currentSpread.length) {
      out.className = 'spread-output';
      out.innerHTML = '<p class="empty-state">No spread drawn yet.</p>';
      renderSpreadAnalysis();
      return;
    }
    syncSpreadControls(key);
    const isCeltic = key === 'celticCross';
    const isNineGrid = key === 'timeMindBodySpirit';
    out.className = isCeltic ? `spread-output celtic-cross-spread ${state.crossedLayout ? 'crossed-layout' : 'side-by-side-layout'} ${state.positionStickers ? 'position-stickers-on' : 'position-stickers-off'}` : `${isNineGrid ? 'spread-output nine-grid-spread saturn-square-spread' : 'spread-output ' + slug(key)} ${state.positionStickers ? 'position-stickers-on' : 'position-stickers-off'}`;
    out.innerHTML = state.currentSpread.map((item, index) => spreadCardMarkup(item, index, isCeltic)).join('');
    if (isCeltic) scheduleCelticFit(); else clearCelticFitDiagram(out);
    renderSpreadAnalysis();
  }
  function analyzeCards(items) {
    const counts = { suits:{}, ranks:{}, elements:{}, signs:{}, planets:{}, themes:{} };
    const inc = (bucket, key) => { if (key) counts[bucket][key] = (counts[bucket][key] || 0) + 1; };
    const genericThemeTags = new Set(['sign','planet','major','minor','pip','court','ace','zodiac','decan','ruler','card']);
    items.forEach(item => {
      const c = item.card || item;
      inc('suits', c.suit === 'Pentacles' ? 'Pentacles / Disks' : c.suit);
      inc('ranks', rankKey(c));
      inc('elements', c.element);
      (c.astrology?.sign || '').split(',').map(s => s.trim()).forEach(s => inc('signs', s));
      [c.astrology?.planet, c.astrology?.decan_ruler, c.astrology?.sign_ruler].filter(Boolean).forEach(p => String(p).split(',').map(x => x.trim()).forEach(x => inc('planets', x)));
      (c.tags || []).forEach(t => {
        const key = String(t).trim();
        if (key && !genericThemeTags.has(key.toLowerCase())) inc('themes', key);
      });
    });
    return counts;
  }
  function topList(obj, max = 8) { return Object.entries(obj).sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0])).slice(0,max); }
  function saturnSquareReadingMapHtml() {
    if ((state.currentSpreadKey || $('spreadSelect')?.value) !== 'timeMindBodySpirit' || !state.currentSpread.length) return '';
    const labelFor = idx => {
      const item = state.currentSpread[idx];
      if (!item) return '';
      const cardName = item.revealed && item.card ? title(item.card) : item.position;
      return `<span><b>${escapeHtml(String(idx + 1))}</b> ${escapeHtml(cardName)}</span>`;
    };
    const line = (heading, indexes, note) => `<article class="saturn-square-line"><h4>${escapeHtml(heading)}</h4><p>${indexes.map(labelFor).join('<em>→</em>')}</p><small>${escapeHtml(note)}</small></article>`;
    return `<section class="saturn-square-reading-map" aria-label="3×3 reading paths">
      <h3>3×3 reading paths</h3>
      <p class="saturn-square-reading-note">Read the nine positions as a three-by-three field: rows move from past to future, while each row distinguishes mind, body, and spirit.</p>
      <div class="saturn-square-line-grid">
        ${line('Top row', [0,1,2], 'past mind, past body, and past spirit')}
        ${line('Middle row', [3,4,5], 'present mind, present body, and present spirit')}
        ${line('Bottom row', [6,7,8], 'future mind, future body, and future spirit')}
        ${line('Left column', [0,3,6], 'mind moving through past, present, and future')}
        ${line('Middle column', [1,4,7], 'body moving through past, present, and future')}
        ${line('Right column', [2,5,8], 'spirit moving through past, present, and future')}
        ${line('Main diagonal', [0,4,8], 'past mind through present body into future spirit')}
        ${line('Cross diagonal', [2,4,6], 'past spirit through present body into future mind')}
      </div>
    </section>`;
  }
  function renderSpreadAnalysis() {
    const box = $('spreadAnalysis');
    if (!state.currentSpread.length) { box.innerHTML = ''; return; }
    const revealed = state.currentSpread.filter(item => item.revealed);
    const saturnMap = saturnSquareReadingMapHtml();
    if (!revealed.length) { box.innerHTML = `<h3>Pattern Ledger</h3><p class="empty-state">No cards revealed yet. The tally will update as you turn cards over.</p>${saturnMap}`; return; }
    const counts = analyzeCards(revealed);
    const section = (label, obj) => `<div class="mini-ledger"><h3>${label}</h3><ul>${topList(obj).map(([k,v]) => `<li>${escapeHtml(k)} <strong>${v}</strong></li>`).join('') || '<li>None found.</li>'}</ul></div>`;
    box.innerHTML = `<h3>Pattern Ledger</h3><p>${revealed.length} of ${state.currentSpread.length} cards revealed.</p><div class="ledger-grid">${section('Suits', counts.suits)}${section('Values / ranks', counts.ranks)}${section('Elements', counts.elements)}${section('Signs', counts.signs)}${section('Planets / rulers', counts.planets)}${section('Theme tags', counts.themes)}</div>${saturnMap}`;
  }
  function revealAllSpreadCards() {
    if (!state.currentSpread.length) return;
    state.revealGuideActive = false;
    state.currentSpread.forEach(item => { item.revealed = true; item.interpretationRevealed = false; });
    renderSpread();
    updateSummary(state.currentSpread);
  }
  function clearSpread() { state.currentSpread = []; state.currentSpreadKey = ''; state.revealGuideActive = false; $('spreadOutput').innerHTML = ''; $('spreadAnalysis').innerHTML = ''; if ($('spreadCardDetail')) { $('spreadCardDetail').hidden = true; $('spreadCardDetail').innerHTML = ''; } updateSummary([]); }
  function download(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    const statusHtml = 'Download requested. If nothing saved, use this link: <a href="' + url + '" download="' + escapeHtml(filename) + '">' + escapeHtml(filename) + '</a>';
    const status = $('downloadStatus');
    if (status) status.innerHTML = statusHtml;
    const chartStatus = $('chartDownloadStatus');
    if (chartStatus) chartStatus.innerHTML = statusHtml;
    // Keep the fallback link alive for this page session; local-file browsers can miss delayed object URLs if revoked too soon.
  }
  function spreadData() {
    const key = state.currentSpreadKey || $('spreadSelect').value;
    return { spreadName: SPREAD_LABELS[key], createdAt: new Date().toISOString(), notes: $('spreadNotes').value, cards: state.currentSpread.map(x => ({ number: x.number, position: x.position, meaning: x.meaning, revealed: !!x.revealed, cardId: x.card.card_id, card: title(x.card), statement: statementForCard(x.card), orientation: x.orientation })) };
  }
  async function downloadSpreadHtml() {
    if (!state.currentSpread.length) return;
    const data = spreadData();
    const spreadCards = state.currentSpread.map(x => x.card).filter(Boolean);
    const imageSources = await Promise.all(spreadCards.map(card => imageDataUrlForExport(rwsExportImagePath(card))));
    const cardsHtml = data.cards.map((c, i) => `<article class="export-card"><div class="export-position">${escapeHtml(c.position)}</div><img src="${imageSources[i] || ''}" alt="${escapeHtml(c.card)} card art"><h2>${escapeHtml(c.card)}</h2><p>${escapeHtml(c.statement)}</p></article>`).join('');
    const rows = data.cards.map((c, i) => `<tr><th>${escapeHtml(c.position)}</th><td>${escapeHtml(c.card)}</td><td><img class="table-art" src="${imageSources[i] || ''}" alt="${escapeHtml(c.card)} card art"></td><td>${escapeHtml(c.statement)}</td></tr>`).join('');
    download(`${slug(data.spreadName)}-${localTimestampSlug(new Date())}.html`, `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(data.spreadName)}</title><style>body{font-family:Georgia,serif;max-width:1100px;margin:40px auto;line-height:1.5;background:#fffaf0;color:#111}h1{font-family:system-ui,sans-serif;letter-spacing:.04em}.meta{border:1px solid #d33;border-radius:18px;padding:1rem;margin:1rem 0}.card-grid,.spread-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,190px));justify-content:start;gap:1.1rem;margin:1.2rem 0}.export-card{border:1px solid #111;border-radius:14px;padding:.75rem;background:#fff;box-shadow:0 8px 20px rgba(0,0,0,.08);max-width:190px}.export-position{font-weight:800;margin-bottom:.45rem;border:1px solid rgba(17,17,17,.22);border-radius:10px;background:#fffaf0;padding:.45rem .55rem;min-height:2.2rem}.export-card img{display:block;width:100%;max-width:165px;max-height:285px;margin:0 auto;border-radius:10px;border:1px solid #222;object-fit:contain}.export-card h2{font-size:1.05rem;margin:.55rem 0 .25rem}.export-card p{font-size:.95rem}table{border-collapse:collapse;width:100%;margin-top:1rem}th,td{border:1px solid #111;padding:.7em;text-align:left;vertical-align:top}.table-art{width:80px;border:1px solid #222;border-radius:6px}</style></head><body><h1>${escapeHtml(data.spreadName)}</h1><div class="meta"><p>${escapeHtml(new Date().toLocaleString())}</p></div><section class="spread-grid">${cardsHtml}</section><table>${rows}</table><h2>Notes</h2><p>${escapeHtml(data.notes).replace(/\n/g,'<br>')}</p></body></html>`, 'text/html');
  }

  function openDate() { collapseCardRow(); state.mode = 'date'; showPanel('datePanel'); updateSummary([]); hideCommandMenu(); pushHistory(); }
  function setDateFromText(text) { const parsed = new Date(text); if (!Number.isNaN(parsed.getTime())) { $('dateInput').value = parsed.toISOString().slice(0,10); readDate(); } }
  function solarSign(month, day) {
    const md = month * 100 + day;
    if (md >= 321 && md <= 419) return 'Aries'; if (md >= 420 && md <= 520) return 'Taurus'; if (md >= 521 && md <= 620) return 'Gemini';
    if (md >= 621 && md <= 722) return 'Cancer'; if (md >= 723 && md <= 822) return 'Leo'; if (md >= 823 && md <= 922) return 'Virgo';
    if (md >= 923 && md <= 1022) return 'Libra'; if (md >= 1023 && md <= 1121) return 'Scorpio'; if (md >= 1122 && md <= 1221) return 'Sagittarius';
    if (md >= 1222 || md <= 119) return 'Capricorn'; if (md >= 120 && md <= 218) return 'Aquarius'; return 'Pisces';
  }
  function dayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    return Math.floor((date - start) / 86400000);
  }
  function solarStartDate(year, sign) {
    const starts = { Aries:[3,21], Taurus:[4,20], Gemini:[5,21], Cancer:[6,21], Leo:[7,23], Virgo:[8,23], Libra:[9,23], Scorpio:[10,23], Sagittarius:[11,22], Capricorn:[12,22], Aquarius:[1,20], Pisces:[2,19] };
    const [month, day] = starts[sign];
    return new Date(year, month - 1, day, 12, 0, 0);
  }
  function solarDegreeForDate(date, sign) {
    let start = solarStartDate(date.getFullYear(), sign);
    if (sign === 'Capricorn' && date.getMonth() === 0) start = solarStartDate(date.getFullYear() - 1, sign);
    const signIndex = SIGNS.indexOf(sign);
    let next = solarStartDate(start.getFullYear(), SIGNS[(signIndex + 1) % 12]);
    if (next <= start) next = solarStartDate(start.getFullYear() + 1, SIGNS[(signIndex + 1) % 12]);
    const progress = Math.max(0, Math.min(1, (date - start) / (next - start)));
    return Math.min(29.999, progress * 30);
  }
  function absoluteDegree(sign, degree) { return SIGNS.indexOf(sign) * 30 + Number(degree || 0); }
  function rangeContains(start, end, value) {
    if (start <= end) return value >= start && value < end;
    return value >= start || value < end;
  }
  function courtForSolarPosition(sign, degree) {
    const value = absoluteDegree(sign, degree);
    const found = COURT_RANGES.find(range => rangeContains(absoluteDegree(range.start, range.startDegree), absoluteDegree(range.end, range.endDegree), value));
    return found ? cardById(found.id) : null;
  }
  function addDateHit(map, card, source) {
    if (!card) return;
    const id = card.card_id;
    if (!map[id]) map[id] = { card, sources: [] };
    map[id].sources.push(source);
  }
  function readDate() {
    const value = $('dateInput').value; if (!value) return;
    const date = new Date(value + 'T12:00:00');
    const planet = WEEKDAY_PLANETS[date.getDay()];
    const sign = solarSign(date.getMonth()+1, date.getDate());
    const solarDegree = solarDegreeForDate(date, sign);
    const signInfo = SIGN_DATA[sign];
    const decan = decanCardFor(sign, solarDegree);
    const hits = {};
    addDateHit(hits, cardById(PLANET_MAJOR_IDS[planet]), `${planet} planetary day`);
    addDateHit(hits, cardById(PLANET_MAJOR_IDS[signInfo?.ruler]), `${signInfo?.ruler} rules ${sign}`);
    addDateHit(hits, cardBySignMajor(sign), `Sun in ${sign}`);
    addDateHit(hits, cardById(ACE_BY_ELEMENT[signInfo?.element]), `${sign} is ${signInfo?.element}`);
    addDateHit(hits, courtForSolarPosition(sign, solarDegree), `active Thoth court range for ${Math.floor(solarDegree)} degrees ${sign}`);
    addDateHit(hits, decan, `exact solar decan: ${decan ? decan.systems?.thoth?.title + ', ' + decan.astrology?.planet + ' in ' + sign : ''}`);
    addDateHit(hits, cardById(PLANET_MAJOR_IDS[decan?.astrology?.planet]), `${decan?.astrology?.planet} rules the active decan`);
    const related = Object.values(hits);
    state.lastDateField = { query: `date:${value}`, date: value, planet, sign, degree: solarDegree, cards: related.map(hit => ({ cardId: hit.card.card_id, sources: hit.sources })) };
    const ruleText = 'These cards follow the Thoth date-field rule: day ruler, sign ruler, solar sign, elemental Ace, active non-princess court range, exact decan, and decan ruler. Repeated derivations are counted on one card.';
    const planetGlyph = BODY_GLYPHS[planet] || planet;
    const signGlyph = SIGN_GLYPHS[sign] || sign;
    const phHash = 'planetaryhours.html#dt=' + encodeURIComponent(date.toISOString());
    $('dateOutput').innerHTML = `<h3>Date Field</h3><p><strong>${escapeHtml(date.toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' }))}</strong></p><p><a class="date-ph-link" href="${escapeHtml(phHash)}">Jump to this date in Planetary Hours</a></p><ul class="date-fact-list"><li title="Planetary day ruler"><strong>${escapeHtml(planetGlyph)}</strong> ${escapeHtml(planet)}</li><li title="Approximate solar sign"><strong>${escapeHtml(signGlyph)}</strong> ${escapeHtml(sign)} ${Math.floor(solarDegree)}°</li><li title="Theme tags">${escapeHtml([...(PLANET_THEMES[planet] || []), signInfo.element, signInfo.mode].filter(Boolean).join(', '))}</li></ul><h3>Derived cards <span class="generated-note date-field-rule" title="${escapeHtml(ruleText)}">?<span class="rule-text">${escapeHtml(ruleText)}</span></span></h3><div class="mini-card-row">${related.map(hitCardButton).join('')}</div>`;
    qsa('[data-card-id]', $('dateOutput')).forEach(btn => btn.addEventListener('click', () => openFullEntryById(btn.dataset.cardId)));
    qsa('.or-card[data-id]', $('dateOutput')).forEach(cardEl => cardEl.addEventListener('click', (event) => { if (event.target.closest('[data-shortlist]') || event.target.closest('[data-filter]') || event.target.closest('[data-card-id]')) return; openFullEntryById(cardEl.dataset.id); }));
  }


  
  function normalizeBodyName(value) {
    const v = String(value || '').trim().toLowerCase();
    const map = { asc:'Rising', ascendant:'Rising', rising:'Rising', mc:'MC', midheaven:'MC', 'north node':'Node', node:'Node', fortune:'Fortune', 'part of fortune':'Fortune', vertex:'Vertex', lilith:'Lilith', chiron:'Chiron', sun:'Sun', moon:'Moon', mercury:'Mercury', venus:'Venus', mars:'Mars', jupiter:'Jupiter', saturn:'Saturn', uranus:'Uranus', neptune:'Neptune', pluto:'Pluto' };
    return map[v] || value;
  }
  function parseAstroSeekPositions(text) {
    const chart = {};
    const signAliases = {
      aries:'Aries', ari:'Aries', '♈':'Aries',
      taurus:'Taurus', tau:'Taurus', '♉':'Taurus',
      gemini:'Gemini', gem:'Gemini', '♊':'Gemini',
      cancer:'Cancer', can:'Cancer', '♋':'Cancer',
      leo:'Leo', '♌':'Leo',
      virgo:'Virgo', vir:'Virgo', '♍':'Virgo',
      libra:'Libra', lib:'Libra', '♎':'Libra',
      scorpio:'Scorpio', sco:'Scorpio', scorp:'Scorpio', '♏':'Scorpio',
      sagittarius:'Sagittarius', sag:'Sagittarius', '♐':'Sagittarius',
      capricorn:'Capricorn', cap:'Capricorn', '♑':'Capricorn',
      aquarius:'Aquarius', aqu:'Aquarius', aq:'Aquarius', '♒':'Aquarius',
      pisces:'Pisces', pis:'Pisces', '♓':'Pisces'
    };
    const bodyAliases = [
      ['Part of Fortune','Fortune'], ['North Node','Node'], ['Ascendant','Rising'], ['Rising','Rising'], ['Midheaven','MC'],
      ['Sun','Sun'], ['Moon','Moon'], ['Mercury','Mercury'], ['Venus','Venus'], ['Mars','Mars'], ['Jupiter','Jupiter'], ['Saturn','Saturn'], ['Uranus','Uranus'], ['Neptune','Neptune'], ['Pluto','Pluto'], ['Chiron','Chiron'], ['Lilith','Lilith'], ['Node','Node'], ['Fortune','Fortune'], ['Vertex','Vertex'], ['ASC','Rising'], ['MC','MC']
    ];
    function spacedLine(line) {
      return String(line || '')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Za-z])([♈♉♊♋♌♍♎♏♐♑♒♓])/g, '$1 $2')
        .replace(/([♈♉♊♋♌♍♎♏♐♑♒♓])(\d)/g, '$1 $2')
        .replace(/([A-Za-z])(?=\d)/g, '$1 ')
        .replace(/(\d)([A-Za-z♈♉♊♋♌♍♎♏♐♑♒♓])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim();
    }
    function findBody(clean) {
      if (/^\s*(?:H(?:ouse)?\s*)?\d{1,2}(?:st|nd|rd|th)?\s+House\b/i.test(clean) || /^\s*H(?:ouse)?\s*\d{1,2}\b/i.test(clean)) return '';
      for (const [alias, body] of bodyAliases) {
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (new RegExp(`(^|\\b)${escaped}(\\b|$)`, 'i').test(clean)) return body;
      }
      return '';
    }
    function findSign(clean) {
      const tokens = clean.split(/\s+|[,;|/]+/).filter(Boolean);
      for (const token of tokens) {
        const stripped = token.replace(/[^A-Za-z♈♉♊♋♌♍♎♏♐♑♒♓]/g, '').toLowerCase();
        const glyph = token.match(/[♈♉♊♋♌♍♎♏♐♑♒♓]/)?.[0];
        if (glyph && signAliases[glyph]) return signAliases[glyph];
        if (signAliases[stripped]) return signAliases[stripped];
      }
      return '';
    }
    function findDegree(clean) {
      let m = clean.match(/\b(\d{1,2})\s*[°º]\s*(\d{1,2})?\s*[’'′m]?/);
      if (m) return { degree: Number(m[1]), minute: m[2] == null ? 0 : Number(m[2]) };
      m = clean.match(/\b(\d{1,2})\s+deg(?:ree)?s?\s*(\d{1,2})?\s*(?:min(?:ute)?s?)?/i);
      if (m) return { degree: Number(m[1]), minute: m[2] == null ? 0 : Number(m[2]) };
      return { degree: null, minute: 0 };
    }
    const normalizedText = String(text || '')
      .replace(/\r/g, '\n')
      .replace(/\s+(?=(?:Part of Fortune|North Node|Ascendant|Rising|Midheaven|Mercury|Jupiter|Saturn|Uranus|Neptune|Chiron|Lilith|Vertex|Fortune|Pluto|Venus|Moon|Mars|Node|Sun|ASC|MC)\b)/gi, '\n');
    normalizedText.split(/\n+/).forEach(line => {
      const clean = spacedLine(line);
      if (!clean) return;
      const body = findBody(clean);
      const sign = findSign(clean);
      const { degree, minute } = findDegree(clean);
      if (!body || !sign || !SIGNS.includes(sign)) return;
      if (degree != null && (Number.isNaN(degree) || degree < 0 || degree >= 30 || minute < 0 || minute >= 60)) return;
      const houseMatch = clean.match(/(?:in\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+House/i) || clean.match(/\bH(?:ouse)?\s*(\d{1,2})\b/i);
      chart[body] = { sign, degree: degree == null ? null : degree, minute: degree == null ? null : (minute || 0), retrograde: /retrograde|\bR\b|\bRx\b/i.test(clean) };
      if (houseMatch) chart[body].house = Number(houseMatch[1]);
    });
    return chart;
  }

  function importAstroSeekChart() {
    const box = $('astroSeekPaste');
    if (!box) return;
    const payload = parseSkyText(box.value);
    const parsed = payload.placements || {};
    if (!Object.keys(parsed).length) return;
    if (payload.name || payload.notes) writeSkyMeta('chart', payload.name, payload.notes);
    renderChartForm();
    writeChartForm(parsed);
    readChartForm();
    renderChart();
    requestAnimationFrame(() => { readChartForm(); renderChart(); });
    setTimeout(() => { readChartForm(); renderChart(); }, 80);
  }

  function importAstroSeekCurrentSky() {
    const box = $('currentSkyAstroSeekPaste');
    if (!box) return;
    const payload = parseSkyText(box.value);
    const parsed = payload.placements || {};
    if (!Object.keys(parsed).length) return;
    if (payload.name || payload.notes) writeSkyMeta('currentSky', payload.name, payload.notes);
    renderCurrentSkyForm();
    const currentOnly = {};
    CURRENT_BODIES.forEach(body => { if (parsed[body]) currentOnly[body] = parsed[body]; });
    writeCurrentSkyForm(currentOnly);
    readCurrentSkyForm();
    renderCurrentSky();
    requestAnimationFrame(() => { readCurrentSkyForm(); renderCurrentSky(); });
    setTimeout(() => { readCurrentSkyForm(); renderCurrentSky(); }, 80);
  }

  function autoImportAstroSeekChart() {
    const box = $('astroSeekPaste');
    if (!box) return;
    const payload = parseSkyText(box.value);
    const parsed = payload.placements || {};
    if (!Object.keys(parsed).length) return;
    if (payload.name || payload.notes) writeSkyMeta('chart', payload.name, payload.notes);
    renderChartForm();
    writeChartForm(parsed);
    readChartForm();
    renderChart();
    requestAnimationFrame(() => { readChartForm(); renderChart(); });
  }

  function autoImportAstroSeekCurrentSky() {
    const box = $('currentSkyAstroSeekPaste');
    if (!box) return;
    const payload = parseSkyText(box.value);
    const parsed = payload.placements || {};
    if (!Object.keys(parsed).length) return;
    if (payload.name || payload.notes) writeSkyMeta('currentSky', payload.name, payload.notes);
    renderCurrentSkyForm();
    const currentOnly = {};
    CURRENT_BODIES.forEach(body => { if (parsed[body]) currentOnly[body] = parsed[body]; });
    if (!Object.keys(currentOnly).length) return;
    writeCurrentSkyForm(currentOnly);
    readCurrentSkyForm();
    renderCurrentSky();
    requestAnimationFrame(() => { readCurrentSkyForm(); renderCurrentSky(); });
  }

  function bindAstroTextAutoImport() {
    const bindings = $('skyCreatorPaste') ? [
      ['skyCreatorPaste', autoImportSkyCreatorPaste]
    ] : [
      ['astroSeekPaste', autoImportAstroSeekChart],
      ['currentSkyAstroSeekPaste', autoImportAstroSeekCurrentSky]
    ];
    bindings.forEach(([id, fn]) => {
      const box = $(id);
      if (!box || box.dataset.autoImportReady) return;
      let timer = null;
      const schedule = () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(fn, 260);
      };
      ['input','change','paste'].forEach(evt => box.addEventListener(evt, schedule));
      box.dataset.autoImportReady = 'true';
    });
  }

  const SKY_CHART_MODE_CONFIG = {
    single: { label:'One sky', needsB:false, a:'Sky', b:'Sky B', relation:'internal', title:'Internal aspects', help:'Build or read one sky. Sky B stays hidden until you choose a comparison mode.' },
    transit: { label:'Transits', needsB:true, a:'Base chart', b:'Transit sky', relation:'transit', title:'Transit relationships', help:'Compare a base chart with a moving or current sky.' },
    synastry: { label:'Synastry', needsB:true, a:'Person / Chart A', b:'Person / Chart B', relation:'synastry', title:'Synastry relationships', help:'Compare two peer charts without making one the default copy of the other.' },
    compare: { label:'Compare two skies', needsB:true, a:'Sky A', b:'Sky B', relation:'compare', title:'Sky-to-sky relationships', help:'Compare two charts or events in neutral language.' }
  };
  function skyChartMode() {
    const mode = state.skyChartMode || 'single';
    return SKY_CHART_MODE_CONFIG[mode] ? mode : 'single';
  }
  function skyChartModeConfig(mode = skyChartMode()) { return SKY_CHART_MODE_CONFIG[mode] || SKY_CHART_MODE_CONFIG.single; }
  function skyChartNeedsB(mode = skyChartMode()) { return !!skyChartModeConfig(mode).needsB; }
  function skyRoleLabel(kind, fallback='') {
    const cfg = skyChartModeConfig();
    return kind === 'currentSky' ? (cfg.b || fallback || 'Sky B') : (cfg.a || fallback || 'Sky A');
  }
  function skyRelationshipTitle() { return skyChartModeConfig().title || 'Aspect relationships'; }
  function setSkyChartMode(mode, options = {}) {
    state.skyChartMode = SKY_CHART_MODE_CONFIG[mode] ? mode : 'single';
    if (!skyChartNeedsB()) {
      if (skyCreatorKind() === 'currentSky') setSkyCreatorKind('chart');
      const calcTarget = $('skyCalcTarget');
      if (calcTarget && calcTarget.value === 'currentSky') calcTarget.value = 'chart';
      state.skyAspectUi = { ...skyAspectUiState(), mode:'aa', showA:true, showB:false, selected:null, selectedRelationship:null };
    } else {
      state.skyAspectUi = { ...skyAspectUiState(), mode: state.skyChartMode === 'transit' ? 'transit' : 'ab', showA:true, showB:true, selected:null, selectedRelationship:null };
    }
    updateSkyChartModeUi();
    if (!options.skipRender) { resetSkyCreatorBuilder(); renderSkyCreator(); renderChart(); }
  }
  window.RelphiSkyChartController = {
    setMode: mode => setSkyChartMode(mode),
    getMode: () => skyChartMode(),
    needsComparison: () => skyChartNeedsB(),
    render: () => renderChart()
  };
  function optionTextForSkyKind(kind) {
    const role = skyRoleLabel(kind, kind === 'currentSky' ? 'Sky B' : 'Sky A');
    if (kind === 'currentSky' && !skyChartNeedsB()) return `${role} · choose a comparison mode first`;
    return kind === 'currentSky' ? `${role} · second sky` : `${role} · primary`;
  }
  function updateSkyChartModeUi() {
    const panel = $('chartPanel');
    if (panel) panel.dataset.skyChartMode = skyChartMode();
    qsa('[data-sky-chart-mode]').forEach(btn => {
      const active = btn.dataset.skyChartMode === skyChartMode();
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    ['skyCreatorTarget','skyCalcTarget'].forEach(id => {
      const sel = $(id);
      if (!sel) return;
      const chartOpt = sel.querySelector('option[value="chart"]');
      const bOpt = sel.querySelector('option[value="currentSky"]');
      if (chartOpt) chartOpt.textContent = optionTextForSkyKind('chart');
      if (bOpt) { bOpt.textContent = optionTextForSkyKind('currentSky'); bOpt.disabled = !skyChartNeedsB(); }
      if (!skyChartNeedsB() && sel.value === 'currentSky') sel.value = 'chart';
    });
    const status = $('skyCreatorDrawerStatus');
    if (status) status.textContent = skyChartModeConfig().help;
    if (typeof updateSkyWizardTargets === 'function') updateSkyWizardTargets();
    if (typeof updateSkyBuilderUiMode === 'function') updateSkyBuilderUiMode();
  }
  function updateSkyBuilderUiMode() {
    const mode = state.skyBuilderUiMode === 'advanced' ? 'advanced' : 'wizard';
    const panel = $('chartPanel');
    if (panel) panel.dataset.skyBuilderUi = mode;
    qsa('[data-sky-builder-ui]').forEach(btn => {
      const active = btn.dataset.skyBuilderUi === mode;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    const drawer = $('skyCreatorDrawer');
    if (drawer && mode === 'advanced') drawer.open = true;
  }
  function setSkyBuilderUiMode(mode) {
    state.skyBuilderUiMode = mode === 'advanced' ? 'advanced' : 'wizard';
    updateSkyBuilderUiMode();
  }
  function skyEntrySourceForButton(btn) {
    if (!btn) return '';
    if (btn.hasAttribute('data-sky-here-now')) return 'here-now';
    if (btn.hasAttribute('data-use-ph-settings')) return 'planetary-hours';
    if (btn.hasAttribute('data-open-sky-calc')) return 'calculated';
    if (btn.hasAttribute('data-focus-sky-paste')) return 'paste';
    if (btn.hasAttribute('data-focus-sky-manual')) return 'manual';
    if (btn.hasAttribute('data-focus-sky-library')) return 'stored';
    return '';
  }
  function setSkyEntrySource(kind, source = '') {
    const targetKind = kind === 'currentSky' ? 'currentSky' : 'chart';
    state.skyEntrySource = { chart:'', currentSky:'', ...(state.skyEntrySource || {}) };
    state.skyEntryMethod = { chart:'', currentSky:'', ...(state.skyEntryMethod || {}) };
    state.skyEntrySource[targetKind] = source;
    state.skyEntryMethod[targetKind] = source;
    state.skyLibrarySelection = { chart:'', currentSky:'', ...(state.skyLibrarySelection || {}) };
    if (source && source !== 'stored' && source !== 'calculated') state.skyLibrarySelection[targetKind] = '';
    updateSkyEntryActionUi();
    if (typeof updateSkyCreatorDeleteStoredButton === 'function') updateSkyCreatorDeleteStoredButton();
  }
  function setSkyEntryMethod(kind, method = '') {
    const targetKind = kind === 'currentSky' ? 'currentSky' : 'chart';
    state.skyEntryMethod = { chart:'', currentSky:'', ...(state.skyEntryMethod || {}) };
    state.skyEntryMethod[targetKind] = method;
    updateSkyEntryActionUi();
  }
  function setSkyPendingEntrySource(kind, source = '') {
    const targetKind = kind === 'currentSky' ? 'currentSky' : 'chart';
    state.skyEntryPendingSource = { chart:'', currentSky:'', ...(state.skyEntryPendingSource || {}) };
    state.skyEntryPendingSource[targetKind] = source;
  }
  function consumeSkyPendingEntrySource(kind, fallback = '') {
    const targetKind = kind === 'currentSky' ? 'currentSky' : 'chart';
    state.skyEntryPendingSource = { chart:'', currentSky:'', ...(state.skyEntryPendingSource || {}) };
    const source = state.skyEntryPendingSource[targetKind] || fallback;
    state.skyEntryPendingSource[targetKind] = '';
    return source;
  }
  function updateSkyEntryActionUi() {
    state.skyEntrySource = { chart:'', currentSky:'', ...(state.skyEntrySource || {}) };
    state.skyEntryMethod = { chart:'', currentSky:'', ...(state.skyEntryMethod || {}) };
    qsa('.sky-wizard-action[data-sky-entry-kind]').forEach(btn => {
      const kind = btn.dataset.skyEntryKind === 'currentSky' ? 'currentSky' : 'chart';
      const selectedMethod = state.skyEntryMethod[kind] || state.skyEntrySource[kind] || '';
      const active = !!selectedMethod && selectedMethod === skyEntrySourceForButton(btn);
      btn.classList.toggle('is-selected', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }
  function skyCreatorNameIsLibrarySearch() {
    const input = $('skyCreatorName');
    return !!input?.dataset?.librarySearch;
  }
  function beginSkyCreatorLibrarySearch(kind = skyCreatorKind()) {
    const input = $('skyCreatorName');
    if (!input) return;
    const targetKind = kind === 'currentSky' ? 'currentSky' : 'chart';
    input.dataset.librarySearch = 'true';
    input.dataset.libraryKind = targetKind;
    input.value = '';
    updateSkyCreatorNameClearButton();
    updateSkyCreatorDeleteStoredButton();
    renderSkyCreatorSuggestions();
  }
  function skyCreatorLibraryTargetKind() {
    const input = $('skyCreatorName');
    if (input?.dataset?.librarySearch) {
      return input.dataset.libraryKind === 'currentSky' ? 'currentSky' : 'chart';
    }
    return skyCreatorKind();
  }
  function endSkyCreatorLibrarySearch({ restore = true } = {}) {
    const input = $('skyCreatorName');
    if (!input?.dataset?.librarySearch) return;
    const kind = input.dataset.libraryKind === 'currentSky' ? 'currentSky' : 'chart';
    delete input.dataset.librarySearch;
    delete input.dataset.libraryKind;
    if (restore) {
      const meta = skyFields(kind);
      input.value = state[meta.nameKey] || '';
    }
    updateSkyCreatorNameClearButton();
    updateSkyCreatorDeleteStoredButton();
  }

  function isGeneratedSkyCalculationNote(note = '') {
    return /^Calculated with Astronomy Engine\b/i.test(String(note || '').trim());
  }
  function skyWizardLoadedHeading(kind = 'chart') {
    const meta = skyFields(kind);
    const name = String(state[meta.nameKey] || '').trim();
    const count = skyPlacementCount(kind);
    if (!count) return kind === 'currentSky' ? 'Comparison sky' : 'Here and Now';
    if (/^here and now$/i.test(name)) return 'Here and Now';
    return name || (kind === 'currentSky' ? 'Comparison sky' : 'First sky');
  }
  function skyWizardLoadedHelp(kind = 'chart') {
    const count = skyPlacementCount(kind);
    if (!count) return kind === 'currentSky'
      ? 'Choose how to enter the second sky.'
      : 'Use the current place and time, or choose another where and when.';
    const source = state.skyEntrySource?.[kind] || '';
    if (source === 'stored') return 'Loaded from your stored skies. Choose another entry method to inspect or revise it.';
    if (source === 'here-now') return 'Using the current place and time.';
    if (source === 'planetary-hours') return 'Using the shared Planetary Hours place and time.';
    if (source === 'calculated') return 'Calculated from its saved date, place, time zone, and house system.';
    if (source === 'paste') return 'Loaded from pasted sky data.';
    if (source === 'manual') return 'Entered and maintained through the placement fields.';
    return 'The loaded placements remain in this sky until you replace or edit them.';
  }
  function updateSkyWizardCalculationDetails(kind = 'chart') {
    const isB = kind === 'currentSky';
    const details = $(isB ? 'skyWizardCompareCalculationDetails' : 'skyWizardPrimaryCalculationDetails');
    const summary = $(isB ? 'skyWizardCompareCalculationSummary' : 'skyWizardPrimaryCalculationSummary');
    const text = $(isB ? 'skyWizardCompareCalculationText' : 'skyWizardPrimaryCalculationText');
    if (!details || !summary || !text) return;
    const meta = skyFields(kind);
    const note = String(state[meta.notesKey] || '').trim();
    const profile = currentSkyCalcProfile(kind);
    const show = isGeneratedSkyCalculationNote(note) || hasSkyCalcData(profile);
    details.hidden = !show;
    if (!show) { details.open = false; summary.textContent = 'Calculation details'; text.textContent = ''; return; }
    const bits = [];
    if (isGeneratedSkyCalculationNote(note)) bits.push('Astronomy Engine');
    if (profile.houseSystem) bits.push(skyHouseSystemLabel(profile.houseSystem));
    if (profile.timeZone) bits.push(profile.timeZone);
    summary.textContent = `Calculation details${bits.length ? ` · ${bits.join(' · ')}` : ''}`;
    text.textContent = note || [
      profile.location ? `Location: ${profile.location}.` : '',
      profile.timeZone ? `Time zone: ${profile.timeZone}.` : '',
      profile.houseSystem ? `House system: ${skyHouseSystemLabel(profile.houseSystem)}.` : ''
    ].filter(Boolean).join(' ');
  }

  function updateSkyWizardTargets() {
    const needsB = skyChartNeedsB();
    const aStatus = $('skyWizardPrimaryStatus');
    const bStatus = $('skyWizardCompareStatus');
    if (aStatus) aStatus.textContent = skyLoadedSummary('chart');
    if (bStatus) bStatus.textContent = needsB ? skyLoadedSummary('currentSky') : 'Second sky: not started';
    const aHeading = $('skyWizardPrimaryHeading');
    const aHelp = $('skyWizardPrimaryHelp');
    if (aHeading) aHeading.textContent = skyWizardLoadedHeading('chart');
    if (aHelp) aHelp.textContent = skyWizardLoadedHelp('chart');
    updateSkyWizardCalculationDetails('chart');
    updateSkyWizardCalculationDetails('currentSky');
    const hasB = skyPlacementCount('currentSky') > 0;
    const comparePanel = $('skyWizardComparePanel');
    if (comparePanel) comparePanel.hidden = !needsB;
    const compareBtn = $('skyWizardCompareButton');
    if (compareBtn) {
      compareBtn.textContent = hasB ? 'Comparison sky added' : (needsB ? 'Choose comparison sky' : 'Compare to another sky');
      compareBtn.classList.toggle('is-selected', hasB);
      compareBtn.setAttribute('aria-pressed', hasB ? 'true' : 'false');
      compareBtn.setAttribute('aria-expanded', needsB ? 'true' : 'false');
    }
    const readHelp = $('skyWizardReadHelp');
    if (readHelp) {
      readHelp.textContent = needsB
        ? `${skyRelationshipTitle()} will be generated after the second sky has placements.`
        : 'The wheel appears as soon as the first sky has placements. Use Compare to another sky when you need relationships.';
    }
    updateSkyEntryActionUi();
  }
  function ensureSecondSkyMode(mode = 'transit') {
    if (!skyChartNeedsB()) setSkyChartMode(mode, { skipRender:true });
    const panel = $('skyWizardComparePanel');
    if (panel) panel.hidden = false;
    setSkyCreatorKind('currentSky');
    if (typeof switchSkyCalculationTarget === 'function') switchSkyCalculationTarget('currentSky');
    updateSkyChartModeUi();
  }
  function prepareSkyEntryAction(btn) {
    const desired = btn?.dataset?.skyEntryKind === 'currentSky' ? 'currentSky' : 'chart';
    if (desired === 'currentSky') ensureSecondSkyMode(skyChartMode() === 'single' ? 'transit' : skyChartMode());
    else {
      setSkyCreatorKind('chart');
      if (typeof switchSkyCalculationTarget === 'function') switchSkyCalculationTarget('chart');
    }
    return desired;
  }
  const skyWizardInlineHomes = {};
  const skyWizardInlineActive = { chart:'', currentSky:'' };
  const SKY_WIZARD_INLINE_SECTIONS = {
    calc: { selector:'.sky-calc-drawer', title:'Calculate placements' },
    paste: { selector:'.sky-paste-panel', title:'Type or paste placements' },
    manual: { selector:'.placement-entry-drawer', title:'Add placements manually' },
    library: { selector:'.sky-creator-name-label', title:'Use stored sky' }
  };
  function rememberSkyWizardHome(key, node) {
    if (!key || !node) return;
    const existing = skyWizardInlineHomes[key];
    if (!existing) {
      skyWizardInlineHomes[key] = { node, parent:node.parentNode, next:node.nextSibling };
      return;
    }
    existing.node = node;
    // A fresh render may replace the shared editor node. Refresh its real home
    // only while it is sitting in the advanced editor, never while it is inside
    // one of the wizard's temporary inline bodies.
    if (node.parentNode && !node.parentNode.closest?.('.sky-wizard-inline-entry-body')) {
      existing.parent = node.parentNode;
      existing.next = node.nextSibling;
    }
  }
  function restoreSkyWizardNode(key) {
    const home = skyWizardInlineHomes[key];
    const node = home?.node;
    if (!home || !node || !home.parent) return;
    if (node.parentNode === home.parent) return;
    const anchor = home.next && home.next.parentNode === home.parent ? home.next : null;
    home.parent.insertBefore(node, anchor);
  }
  function restoreSkyWizardBody(body) {
    if (!body) return;
    Object.keys(skyWizardInlineHomes).forEach(key => {
      const node = skyWizardInlineHomes[key]?.node;
      if (node && node.parentNode === body) restoreSkyWizardNode(key);
    });
    // Never leave a stale detached placeholder behind. An empty body is valid
    // only while its containing panel is hidden.
    Array.from(body.children).forEach(child => {
      if (!Object.values(skyWizardInlineHomes).some(home => home?.node === child)) child.remove();
    });
  }
  function skyWizardNodeForSection(section) {
    const config = SKY_WIZARD_INLINE_SECTIONS[section];
    if (!config) return { key:'', node:null, title:'Enter sky' };
    const cached = skyWizardInlineHomes[section]?.node;
    const node = document.querySelector(config.selector) || cached || null;
    return { key:section, node, title:config.title };
  }
  function openSkyWizardInlineEntry(section = '', kind = skyCreatorKind()) {
    if (state.skyBuilderUiMode === 'advanced') return false;
    const targetKind = kind === 'currentSky' ? 'currentSky' : 'chart';
    const panel = targetKind === 'currentSky' ? $('skyWizardCompareEntryPanel') : $('skyWizardPrimaryEntryPanel');
    const body = targetKind === 'currentSky' ? $('skyWizardCompareEntryBody') : $('skyWizardPrimaryEntryBody');
    const title = targetKind === 'currentSky' ? $('skyWizardCompareEntryTitle') : $('skyWizardPrimaryEntryTitle');
    if (!panel || !body) return false;
    const item = skyWizardNodeForSection(section);
    if (!item.node) return false;
    rememberSkyWizardHome(item.key, item.node);

    // Put the previous tool back before inserting the requested one. The former
    // replaceChildren() call detached that tool from the document, which is why
    // the panel could retain its title while its body became empty.
    restoreSkyWizardBody(body);
    const otherKind = targetKind === 'chart' ? 'currentSky' : 'chart';
    const otherBody = otherKind === 'currentSky' ? $('skyWizardCompareEntryBody') : $('skyWizardPrimaryEntryBody');
    const otherPanel = otherKind === 'currentSky' ? $('skyWizardCompareEntryPanel') : $('skyWizardPrimaryEntryPanel');
    if (item.node.parentNode === otherBody) {
      restoreSkyWizardBody(otherBody);
      if (otherPanel) otherPanel.hidden = true;
      skyWizardInlineActive[otherKind] = '';
    }

    body.replaceChildren();
    body.appendChild(item.node);
    item.node.hidden = false;
    if ('open' in item.node) item.node.open = true;
    item.node.setAttribute?.('open', '');
    panel.hidden = false;
    skyWizardInlineActive[targetKind] = section;
    if (title) title.textContent = item.title;

    // Keep the advanced drawer from opening just to use the wizard.
    const creator = $('skyCreatorDrawer');
    if (creator && state.skyBuilderUiMode !== 'advanced') creator.open = false;
    panel.scrollIntoView({ block:'nearest', behavior:'smooth' });
    return true;
  }
  function closeSkyWizardInline(kind = '') {
    const targetKind = kind === 'currentSky' ? 'currentSky' : 'chart';
    const panel = targetKind === 'currentSky' ? $('skyWizardCompareEntryPanel') : $('skyWizardPrimaryEntryPanel');
    const body = targetKind === 'currentSky' ? $('skyWizardCompareEntryBody') : $('skyWizardPrimaryEntryBody');
    restoreSkyWizardBody(body);
    if (panel) panel.hidden = true;
    skyWizardInlineActive[targetKind] = '';
    endSkyCreatorLibrarySearch({ restore:true });
  }
  function openSkyCreatorDrawerSection(section = '') {
    if (openSkyWizardInlineEntry(section, skyCreatorKind())) return;
    const creator = $('skyCreatorDrawer');
    if (creator) creator.open = true;
    if (section === 'calc') document.querySelector('.sky-calc-drawer')?.setAttribute('open', '');
    if (section === 'manual') document.querySelector('.placement-entry-drawer')?.setAttribute('open', '');
  }
  async function setHereAndNowForSky(kind = 'currentSky') {
    // Protect the other sky before any shared editor or mode switch runs.
    // The previous protection began inside runSkyCalculation(), which was too
    // late: switching the shared target could already overwrite the other
    // slot's name or metadata before the snapshot was taken.
    const targetKind = kind === 'currentSky' ? 'currentSky' : 'chart';
    const protectedKind = targetKind === 'currentSky' ? 'chart' : 'currentSky';
    const protectedSnapshot = captureSkySlot(protectedKind);
    if (targetKind === 'currentSky') ensureSecondSkyMode('transit');
    else setSkyCreatorKind('chart');
    if (typeof switchSkyCalculationTarget === 'function') switchSkyCalculationTarget(targetKind);
    else setSkyCreatorKind(targetKind);
    const now = new Date();
    const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    let profile = readPlanetaryHoursWhereWhenSettings() || {};
    profile = { ...profile, dateTime: localDateTimeValueInZone(now, profile.timeZone || browserZone), timeZone: profile.timeZone || browserZone, name: kind === 'currentSky' ? 'Here and now' : 'Here and now' };
    const haveCoords = hasSkyCalcData(profile);
    if (!haveCoords && navigator.geolocation) {
      try {
        const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy:true, maximumAge:60000, timeout:10000 }));
        profile.latitude = Number(position.coords.latitude).toFixed(4);
        profile.longitude = Number(position.coords.longitude).toFixed(4);
        profile.location = profile.location || 'Here';
      } catch (error) {
        skyCalcStatus(error?.message || 'Here is not available yet. Grant location permission once, or use Planetary Hours/Advanced to set a place.', true);
        return;
      }
    }
    if (!hasSkyCalcData(profile)) {
      skyCalcStatus('Here is not available yet. Grant location permission once, or use Planetary Hours/Advanced to set a place.', true);
      return;
    }
    writeSkyCalcInputs(profile, { force:true });
    const name = $('skyCalcName');
    if (name) name.value = profile.name || 'Here and now';
    try { await enrichSkyCalcFromCoordinates({ forceLocation:true, forceTimeZone:true, setDateTimeToNow:true }); } catch (error) {}
    setSkyPendingEntrySource(targetKind, 'here-now');
    const calculated = await runSkyCalculation(targetKind);
    // Restore the untouched slot after the entire Here-and-Now workflow,
    // including all shared-control target changes and renders.
    restoreSkySlot(protectedKind, protectedSnapshot);
    if (!calculated) {
      renderSkyCreator();
      renderChart();
      return;
    }
    renderSkyCreator();
    renderChart();
    closeSkyWizardInline(targetKind);
    document.getElementById('skyCreatorDrawer')?.removeAttribute('open');
    document.querySelector('.sky-calc-drawer')?.removeAttribute('open');
  }
  function skyCreatorKind() { if (!skyChartNeedsB()) return 'chart'; return $('skyCreatorTarget')?.value || state.skyCreatorTarget || 'chart'; }
  function setSkyCreatorKind(kind) { state.skyCreatorTarget = (kind === 'currentSky' && skyChartNeedsB()) ? 'currentSky' : 'chart'; const sel = $('skyCreatorTarget'); if (sel) sel.value = state.skyCreatorTarget; const calc = $('skyCalcTarget'); if (calc) calc.value = state.skyCreatorTarget; updateSkyChartModeUi(); }
  function actualPlacementKind(kind) { return kind === 'skyCreator' ? skyCreatorKind() : kind; }
  function resetSkyCreatorBuilder() { const form = $('skyCreatorForm'); if (form) { delete form.dataset.compactReady; form.innerHTML = ''; } }
  function openChart() { collapseCardRow(); state.mode = 'chart'; showPanel('chartPanel'); setVisible('currentSkyPanel', false); updateSummary([]); hideCommandMenu(); renderSkyCreator(); renderChart(); renderCurrentSky(); pushHistory(); }
  function placementBodiesForKind(kind) { const realKind = actualPlacementKind(kind); return realKind === 'currentSky' ? CURRENT_BODIES : BODIES; }
  function placementEditorIds(kind) {
    if (kind === 'skyCreator') {
      return { form:'skyCreatorForm', body:'skyCreatorPlacementBody', sign:'skyCreatorPlacementSign', degree:'skyCreatorPlacementDegree', minute:'skyCreatorPlacementMinute', house:'skyCreatorPlacementHouse', retro:'skyCreatorPlacementRetro', add:'skyCreatorPlacementAdd', remove:'skyCreatorPlacementRemove', clear:'skyCreatorPlacementClear', strip:'skyCreatorPlacementStrip' };
    }
    const prefix = kind === 'currentSky' ? 'currentSky' : 'chart';
    return {
      form: kind === 'currentSky' ? 'currentSkyForm' : 'chartForm',
      body: `${prefix}PlacementBody`, sign: `${prefix}PlacementSign`, degree: `${prefix}PlacementDegree`, minute: `${prefix}PlacementMinute`, house: `${prefix}PlacementHouse`, retro: `${prefix}PlacementRetro`,
      add: `${prefix}PlacementAdd`, remove: `${prefix}PlacementRemove`, clear: `${prefix}PlacementClear`, strip: `${prefix}PlacementStrip`
    };
  }
  function statePlacementsForKind(kind) { const realKind = actualPlacementKind(kind); return realKind === 'currentSky' ? (state.currentSky || {}) : (state.chart || {}); }
  function setStatePlacementsForKind(kind, placements) { const realKind = actualPlacementKind(kind); if (realKind === 'currentSky') state.currentSky = placements || {}; else state.chart = placements || {}; }
  function planetThumbClass(body) { return `planet-thumb planet-thumb--${String(body || '').toLowerCase().replace(/[^a-z0-9]+/g,'-')}`; }
  function placementDegreeText(p) {
    if (p?.degree == null || Number.isNaN(Number(p.degree))) return '';
    const minute = p?.minute == null || Number.isNaN(Number(p.minute)) ? '00' : String(Number(p.minute)).padStart(2, '0');
    return `${Number(p.degree)}°${minute}′`;
  }
  function placementCompactSignText(p) {
    const signGlyph = SIGN_GLYPHS[p?.sign] || p?.sign || '';
    const degree = placementDegreeText(p);
    return [signGlyph, degree].filter(Boolean).join(' ');
  }
  function placementTokenLabel(body, p) {
    const degree = p?.degree == null || Number.isNaN(Number(p.degree)) ? '' : ` ${Number(p.degree)}°${p.minute != null && !Number.isNaN(Number(p.minute)) ? String(Number(p.minute)).padStart(2, '0') + '′' : ''}`;
    const house = p?.house ? ` · H${p.house}` : '';
    return `${body} ${p?.sign || ''}${degree}${house}${p?.retrograde ? ' ℞' : ''}${p?.station ? ' station' : ''}`.trim();
  }

  function selectedValuesFromMaybeArray(value) {
    return Array.isArray(value) ? value : (value && value !== 'all' ? [value] : []);
  }
  function placementTokenHtml(kind, body, p) {
    const glyph = BODY_GLYPHS[body] || (body === 'Rising' ? 'ASC' : body === 'MC' ? 'MC' : body.slice(0,2));
    const signGlyph = SIGN_GLYPHS[p?.sign] || p?.sign || '';
    const degree = placementDegreeText(p) || '—';
    const metaBits = [p?.house ? `H${p.house}` : '', p?.retrograde ? '℞' : '', p?.station ? 'station' : ''].filter(Boolean);
    const filterActive = selectedValuesFromMaybeArray(exactAspectFilters().placement).includes(body);
    const buttonClass = `placement-token placement-token--o-eq-o${kind === 'skyCreator' ? ' is-filter-pill' : ''}${filterActive ? ' is-active-filter' : ''}`;
    const title = kind === 'skyCreator'
      ? `Filter Sky Ledger by ${placementTokenLabel(body,p)}`
      : `Edit ${placementTokenLabel(body,p)}`;
    return `<button class="${buttonClass}" type="button" data-body="${escapeHtml(body)}" ${kind === 'skyCreator' ? `data-filter-placement-body="${escapeHtml(body)}"` : `data-edit-placement="${escapeHtml(kind)}"`} title="${escapeHtml(title)}" aria-pressed="${kind === 'skyCreator' ? (filterActive ? 'true' : 'false') : 'false'}"><span class="placement-token-node placement-token-node--body"><span class="${escapeHtml(planetThumbClass(body))}" aria-hidden="true"><span class="planet-thumb-glyph">${escapeHtml(glyph)}</span></span><small>${escapeHtml(body)}</small></span><span class="placement-token-axis"><span class="placement-token-degree">${escapeHtml(degree)}</span></span><span class="placement-token-node placement-token-node--sign"><span class="placement-token-sign-glyph">${escapeHtml(signGlyph)}</span><small>${escapeHtml(p?.sign || '')}</small></span>${metaBits.length ? `<span class="placement-token-extra">${escapeHtml(metaBits.join(' · '))}</span>` : ''}</button>`;
  }
  function renderPlacementStrip(kind) {
    const ids = placementEditorIds(kind);
    const strip = $(ids.strip);
    if (!strip) return;
    const placements = statePlacementsForKind(kind);
    const entries = placementBodiesForKind(kind).map(body => [body, placements[body]]).filter(([,p]) => p && p.sign);
    strip.innerHTML = entries.length ? entries.map(([body,p]) => placementTokenHtml(kind, body, p)).join('') : '<p class="placement-empty-note">No placements yet. Choose a body, sign, and degree, then add it.</p>';
    qsa('[data-edit-placement]', strip).forEach(btn => btn.addEventListener('click', () => loadPlacementIntoEditor(kind, btn.dataset.body)));
    qsa('[data-filter-placement-body]', strip).forEach(btn => btn.addEventListener('click', () => toggleSkyComparisonPlacementFilter(btn.dataset.filterPlacementBody)));
  }

  function skyFilterPlacementPillHtml(kind, body, p) {
    const glyph = BODY_GLYPHS[body] || (body === 'Rising' ? 'ASC' : body === 'MC' ? 'MC' : body.slice(0,2));
    const compactText = placementCompactSignText(p);
    const metaBits = [p?.house ? `H${p.house}` : '', p?.retrograde ? '℞' : '', p?.station ? 'station' : ''].filter(Boolean);
    const active = selectedValuesFromMaybeArray(exactAspectFilters().placement).includes(body);
    return `<button class="placement-token is-filter-pill sky-filter-pill${active ? ' is-active-filter' : ''}" type="button" data-filter-placement-body="${escapeHtml(body)}" title="Filter relationships by ${escapeHtml(placementTokenLabel(body,p))}" aria-pressed="${active ? 'true' : 'false'}"><span class="${escapeHtml(planetThumbClass(body))}" aria-hidden="true"><span class="planet-thumb-glyph">${escapeHtml(glyph)}</span></span><span class="placement-token-text"><span class="placement-token-primary">${compactText ? escapeHtml(compactText) : escapeHtml(glyph)}</span><span class="placement-token-secondary">${escapeHtml(metaBits.join(' · ') || 'Filter')}</span></span></button>`;
  }
  function renderSkyLedgerFilterRows(entriesA, entriesB) {
    const row = (kind, label, entries) => {
      if (!entries?.length) return '';
      const pills = entries.map(([body,p]) => skyFilterPlacementPillHtml(kind, body, p)).join('');
      return `<div class="sky-ledger-filter-row"><strong class="sky-ledger-filter-name">${escapeHtml(label)}</strong><div class="sky-ledger-filter-pills">${pills}</div></div>`;
    };
    const rows = [row('chart', skyDisplayLabel('chart','Sky A'), entriesA), row('currentSky', skyDisplayLabel('currentSky','Sky B'), entriesB)].filter(Boolean).join('');
    return rows ? `<section class="sky-ledger-filter-panel" aria-label="Sky placement filters">${rows}</section>` : '';
  }
  function fillPlacementEditor(kind, body, p = {}) {
    const ids = placementEditorIds(kind);
    const set = (id, value) => { const el = $(id); if (el) el.value = value ?? ''; };
    set(ids.body, body || ''); set(ids.sign, p.sign || ''); set(ids.degree, p.degree ?? ''); set(ids.minute, p.minute ?? ''); set(ids.house, p.house ?? '');
    const retro = $(ids.retro); if (retro) retro.checked = !!p.retrograde;
  }
  function loadPlacementIntoEditor(kind, body) { fillPlacementEditor(kind, body, statePlacementsForKind(kind)[body] || {}); }
  function readPlacementEditor(kind) {
    const ids = placementEditorIds(kind);
    const body = $(ids.body)?.value || '';
    const sign = $(ids.sign)?.value || '';
    const degreeRaw = $(ids.degree)?.value ?? '';
    const minuteRaw = $(ids.minute)?.value ?? '';
    const houseRaw = $(ids.house)?.value ?? '';
    const retrograde = !!$(ids.retro)?.checked;
    return { body, placement: { sign, degree: degreeRaw === '' ? null : Number(degreeRaw), minute: minuteRaw === '' ? null : Number(minuteRaw), house: houseRaw === '' ? null : Number(houseRaw), retrograde } };
  }
  function upsertPlacementFromEditor(kind) {
    const { body, placement } = readPlacementEditor(kind);
    if (!body || !placement.sign) return;
    const placements = { ...statePlacementsForKind(kind) };
    placements[body] = placement;
    const realKind = actualPlacementKind(kind);
    setStatePlacementsForKind(kind, placements);
    syncSkyPasteFromPlacements(realKind, placements, true);
    renderPlacementStrip(kind);
    if (kind === 'skyCreator') { setSkyEntrySource(realKind, 'manual'); readSkyCreatorMeta(); renderChart(); renderCurrentSky(); }
    else if (realKind === 'currentSky') renderCurrentSky(); else renderChart();
  }
  function removePlacementFromEditor(kind) {
    const { body } = readPlacementEditor(kind);
    if (!body) return;
    const placements = { ...statePlacementsForKind(kind) };
    delete placements[body];
    const realKind = actualPlacementKind(kind);
    setStatePlacementsForKind(kind, placements);
    fillPlacementEditor(kind, '', {});
    syncSkyPasteFromPlacements(realKind, placements, true);
    renderPlacementStrip(kind);
    if (kind === 'skyCreator') { readSkyCreatorMeta(); renderChart(); renderCurrentSky(); }
    else if (realKind === 'currentSky') renderCurrentSky(); else renderChart();
  }
  function renderPlacementBuilder(kind) {
    const ids = placementEditorIds(kind);
    const form = $(ids.form);
    if (!form) return;
    const bodies = placementBodiesForKind(kind);
    const bodyOptions = '<option value="">Choose body or point…</option>' + bodies.map(body => `<option value="${escapeHtml(body)}">${escapeHtml(BODY_GLYPHS[body] ? `${BODY_GLYPHS[body]}  ${body}` : body)}</option>`).join('');
    const signOptions = '<option value=""></option>' + SIGNS.map(sign => `<option value="${escapeHtml(sign)}">${escapeHtml(SIGN_GLYPHS[sign] ? `${SIGN_GLYPHS[sign]}  ${sign}` : sign)}</option>`).join('');
    if (!form.dataset.compactReady) {
      form.innerHTML = `<div class="placement-builder-single placement-builder-refined"><div class="placement-builder-fields"><label class="placement-builder-field placement-builder-field--body">Planet / point<select id="${ids.body}" class="placement-body">${bodyOptions}</select></label><label class="placement-builder-field placement-builder-field--degree">Degree<input id="${ids.degree}" class="placement-degree" type="number" min="0" max="29" inputmode="numeric" placeholder="0–29"></label><label class="placement-builder-field placement-builder-field--minute">Minute<input id="${ids.minute}" class="placement-minute" type="number" min="0" max="59" inputmode="numeric" placeholder="00"></label><label class="placement-builder-field placement-builder-field--sign">Sign<select id="${ids.sign}" class="placement-sign">${signOptions}</select></label><label class="placement-builder-field placement-builder-field--house">House<input id="${ids.house}" class="placement-house" type="number" min="1" max="12" inputmode="numeric" placeholder="optional"></label><label class="placement-builder-field placement-builder-field--retro retro-label"><input id="${ids.retro}" class="placement-retro" type="checkbox"> <span>Retrograde</span></label></div><div class="placement-builder-buttons"><button id="${ids.add}" type="button">Add / update placement</button><button id="${ids.remove}" type="button">Remove selected</button><button id="${ids.clear}" type="button">Clear fields</button></div></div><div id="${ids.strip}" class="placement-token-strip" aria-label="Entered placements"></div>`;
      $(ids.add)?.addEventListener('click', () => upsertPlacementFromEditor(kind));
      $(ids.remove)?.addEventListener('click', () => removePlacementFromEditor(kind));
      $(ids.clear)?.addEventListener('click', () => fillPlacementEditor(kind, '', {}));
      $(ids.body)?.addEventListener('change', () => { const body = $(ids.body).value; if (body && statePlacementsForKind(kind)[body]) loadPlacementIntoEditor(kind, body); });
      form.dataset.compactReady = 'true';
    }
    renderPlacementStrip(kind);
  }
  function renderChartForm() { if ($('skyCreatorForm')) renderSkyCreator(); else renderPlacementBuilder('chart'); }
  function readChartForm() {
    const form = $('chartForm');
    const oldRows = form ? qsa('.placement-row', form) : [];
    if (oldRows.length) {
      const chart = {};
      oldRows.forEach(row => { const body = row.dataset.body, sign = row.querySelector('.placement-sign').value, degree = row.querySelector('.placement-degree').value, minute = row.querySelector('.placement-minute').value, house = row.querySelector('.placement-house')?.value || '', retrograde = row.querySelector('.placement-retro').checked; if (sign) chart[body] = { sign, degree: degree === '' ? null : Number(degree), minute: minute === '' ? null : Number(minute), retrograde, house: house === '' ? null : Number(house) }; });
      state.chart = chart;
    }
    return state.chart || {};
  }
  function writeChartForm(chart, options = {}) {
    state.chart = { ...(chart || {}) };
    if ($('skyCreatorForm') && skyCreatorKind() === 'chart') renderSkyCreator(); else { renderChartForm(); renderPlacementStrip('chart'); }
    if (!options.skipPasteSync) syncSkyPasteFromPlacements('chart', state.chart || {}, !!options.forcePasteSync);
    if (!options.skipRender) renderChart();
  }
  function houseForSign(rising, sign) {
    if (!rising || !sign) return null;
    const diff = (SIGNS.indexOf(sign) - SIGNS.indexOf(rising) + 12) % 12;
    return { number: diff + 1, name: HOUSE_NAMES[diff], topics: HOUSE_TOPICS[diff], plainTopics: HOUSE_TOPIC_PLAIN[diff] };
  }
  const RISING_OFFSET_DATA = window.RELPHI_RISING_SIGN_HOUSE_OFFSET_EFFECTS || { entries: [] };
  const RISING_OFFSET_BY_RISING_SIGN = (() => {
    const map = new Map();
    (RISING_OFFSET_DATA.entries || []).forEach(entry => {
      if (!entry || !entry.risingSign || !entry.sign) return;
      const key = `${entry.risingSign}|${entry.sign}`;
      map.set(key, entry);
    });
    return map;
  })();
  function risingHouseOffsetEntry(rising, sign) {
    if (!rising || !sign) return null;
    return RISING_OFFSET_BY_RISING_SIGN.get(`${rising}|${sign}`) || null;
  }
  function risingHouseOffsetDescription(rising, sign, house) {
    const entry = risingHouseOffsetEntry(rising, sign);
    if (entry?.description) return entry.description;
    return `${sign} becomes House ${house?.number || ''}: ${signField(sign)}`.trim();
  }
  function risingHouseOffsetTitle(rising, sign, house) {
    const entry = risingHouseOffsetEntry(rising, sign);
    return entry?.title || `${sign} as House ${house?.number || ''}`.trim();
  }
  function bodyInRisingHousePhrase(body, p, rising, house) {
    const entry = risingHouseOffsetEntry(rising, p?.sign);
    const titleText = entry?.title || `${p?.sign || 'Sign'} as House ${house?.number || ''}`;
    const bodyLayer = bodyGloss(body, !!p?.retrograde);
    const degree = p?.degree == null || Number.isNaN(p.degree) ? '' : ` at ${p.degree}°${p.minute != null && !Number.isNaN(p.minute) ? ' ' + p.minute + '′' : ''}`;
    return `${body}${p?.retrograde ? ' retrograde' : ''}${degree} occupies ${titleText}: ${bodyLayer} works through ${entry?.description || house?.plainTopics || 'this house field'}`;
  }
  function decanCardFor(sign, degree) {
    if (!sign || degree == null || Number.isNaN(degree)) return null;
    const decanIndex = degree < 10 ? 'First decan' : degree < 20 ? 'Second decan' : 'Third decan';
    return cards.find(c => c.card_type === 'Pip' && c.astrology?.sign === sign && c.astrology?.decan === decanIndex) || null;
  }
  function cardTitle(card) { return card?.systems?.thoth?.title || card?.systems?.golden_dawn_rws?.title || ''; }
  function cardThemePhrase(card) { return CARD_THEME_PHRASES[cardTitle(card)] || String(cardTitle(card) || 'this theme').toLowerCase(); }
  function miniArt(card, className = 'mini-card-art') {
    if (!card) return '';
    return `<button class="mini-art-button relphi-mini-card" type="button" data-card-id="${escapeHtml(card.card_id)}" aria-label="Open full entry for ${escapeHtml(title(card))}"><img class="${escapeHtml(className)} relphi-surface-face" src="${escapeHtml(rwsImagePath(card))}" alt="${escapeHtml(rwsImageAlt(card))}" loading="lazy"></button>`;
  }
  function cardCellHtml(card) {
    if (!card) return '';
    return `<span class="ledger-card-cell">${miniArt(card, 'ledger-card-art')}<span>${escapeHtml(title(card))}</span></span>`;
  }
  function hitCardButton(hit) {
    return renderCardSurface(hit.card, { context:'date-field', hitCount: hit.sources.length, hitSources: hit.sources });
  }
  function faceLord(card) { return card?.astrology?.decan_ruler || card?.astrology?.planet || ''; }
  function placementChip(body, p) {
    const glyph = BODY_GLYPHS[body] || body;
    const degree = p.degree == null || Number.isNaN(p.degree) ? '' : ` ${p.degree}°${p.minute != null && !Number.isNaN(p.minute) ? ' ' + p.minute + '′' : ''}`;
    return `<span class="placement-chip" title="${escapeHtml(body)} ${escapeHtml(p.sign || '')}${escapeHtml(degree)}"><b class="placement-chip-glyph${glyphLengthClass(glyph)}">${escapeHtml(glyph)}</b><small>${escapeHtml(body)}${escapeHtml(degree)}</small></span>`;
  }
  function fullSignHouseCard(sign, house, placements = [], rising = '') {
    const major = cardBySignMajor(sign);
    const offsetTitle = risingHouseOffsetTitle(rising, sign, house);
    const offsetDescription = risingHouseOffsetDescription(rising, sign, house);
    const placementLines = placements.map(([body, p]) => bodyInRisingHousePhrase(body, p, rising, house));
    const houseText = `House ${house.number} · ${offsetTitle}: ${house.plainTopics || house.topics || 'house topics'}`;
    if (major) {
      return renderCardSurface(major, {
        context: 'chart-house',
        hitCount: placements.length,
        hitSources: placementLines,
        placementGlyph: `H${house.number}`,
        placementText: houseText,
        placementHeader: `Placements in ${offsetTitle}`,
        houseNumber: house.number,
        layerTitle: offsetTitle,
        layerText: offsetDescription
      });
    }
    return `<article class="or-card tarot-card-surface relphi-surface relphi-surface--card house-sign-card no-card-art" tabindex="0"><div class="or-card-art relphi-surface-face chart-result-placeholder"><span class="or-house-number-sticker relphi-sticker relphi-sticker--position"><strong>${escapeHtml(String(house.number))}</strong></span>${escapeHtml(SIGN_GLYPHS[sign] || sign)}</div>${placements.length ? `<button class="or-hit-badge" type="button" data-placement-toggle aria-label="Show ${placements.length} chart placements" title="${escapeHtml(placementLines.join(' · '))}">×${placements.length}</button>` : ''}<div class="or-card-layer relphi-info-layer"><div class="or-layer-head relphi-info-static"><strong>${escapeHtml(offsetTitle)}</strong></div><div class="or-layer-scroll relphi-info-scroll"><span>${escapeHtml(offsetDescription)}</span></div></div><div class="or-card-layer or-card-layer--placement relphi-info-layer" data-placement-layer hidden><div class="or-layer-head relphi-info-static"><strong>${escapeHtml(houseText)}</strong></div><div class="or-layer-scroll relphi-info-scroll"><ul class="or-placement-list">${placementLines.map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul></div></div></article>`;
  }
  function signField(sign) { return SIGN_FIELD_THEMES[sign] || `${sign} concerns`; }
  function bodyGloss(body, retrograde) {
    const gloss = BODY_GLOSSES[body] || body.toLowerCase();
    return retrograde ? `${gloss} in a revising, inward mode` : gloss;
  }
  function skyAHitSentence(body, p, decan, house) {
    const data = SIGN_DATA[p.sign] || {};
    const decanRuler = decan.astrology?.planet || decan.astrology?.decan_ruler || 'the decan ruler';
    const signRuler = data.ruler || decan.astrology?.sign_ruler || 'the sign ruler';
    const housePhrase = house ? `, especially through matters of ${house.plainTopics}` : '';
    return `<strong>${escapeHtml(body)}${p.retrograde ? ' retrograde' : ''}</strong> falls in the <strong>${escapeHtml(title(decan))} — ${escapeHtml(cardTitle(decan))}</strong> decan: <strong>${escapeHtml(decanRuler)}</strong> ${escapeHtml(PLANET_ACTIONS[decanRuler] || 'brings its force')} into <strong>${escapeHtml(signRuler)}-ruled ${escapeHtml(p.sign)}</strong>’s field of ${escapeHtml(signField(p.sign))}, so ${escapeHtml(cardThemePhrase(decan))} touch ${escapeHtml(bodyGloss(body, p.retrograde))}${escapeHtml(housePhrase)}.`;
  }
  function skyAHitFields(body, p, decan, house) {
    const data = SIGN_DATA[p.sign] || {};
    const decanRuler = decan.astrology?.planet || decan.astrology?.decan_ruler || '';
    return `<table class="mini-fields"><tbody><tr><th>House No.</th><td>${house ? house.number : ''}</td></tr><tr><th>House topics</th><td>${house ? escapeHtml(house.plainTopics) : ''}</td></tr><tr><th>Decan ruler</th><td>${escapeHtml(decanRuler)}</td></tr><tr><th>Sign ruler</th><td>${escapeHtml(data.ruler || '')}</td></tr><tr><th>Exaltation</th><td>${escapeHtml(data.exaltation || '')}</td></tr><tr><th>Body layer</th><td>${escapeHtml(bodyGloss(body, p.retrograde))}</td></tr></tbody></table>`;
  }
  function aspectBySign(signA, signB) {
    const diff = (SIGNS.indexOf(signB) - SIGNS.indexOf(signA) + 12) % 12;
    const distance = Math.min(diff, 12 - diff);
    return { 0:'conjunction', 2:'sextile', 3:'square', 4:'trine', 6:'opposition' }[distance] || '';
  }
  function houseAxisPhrase(houseA, houseB) {
    if (!houseA || !houseB) return '';
    const a = Math.min(houseA.number, houseB.number), b = Math.max(houseA.number, houseB.number);
    return HOUSE_AXIS_PHRASES[`${a}-${b}`] || `matters of ${houseA.plainTopics} meet matters of ${houseB.plainTopics}`;
  }
  function aspectSentence(a, pa, b, pb, rising) {
    const aspect = aspectBySign(pa.sign, pb.sign);
    if (!aspect) return '';
    const da = SIGN_DATA[pa.sign] || {}, db = SIGN_DATA[pb.sign] || {};
    const ha = houseForSign(rising, pa.sign), hb = houseForSign(rising, pb.sign);
    const A = `<strong>${escapeHtml(a)}</strong> in <strong>${escapeHtml(da.ruler || '')}-ruled ${escapeHtml(pa.sign)}</strong>`;
    const B = `<strong>${escapeHtml(b)}</strong> in <strong>${escapeHtml(db.ruler || '')}-ruled ${escapeHtml(pb.sign)}</strong>`;
    const ga = escapeHtml(bodyGloss(a, pa.retrograde)), gb = escapeHtml(bodyGloss(b, pb.retrograde));
    const axis = houseAxisPhrase(ha, hb);
    if (aspect === 'opposition') return `${A} and ${B} face each other by sign, making you more aware of the tension between ${ga} and ${gb}${axis ? `, especially where ${escapeHtml(axis)}` : ''}.`;
    if (aspect === 'conjunction') return `${A} and ${B} share the same sign, concentrating ${ga} with ${gb}${ha ? ` through matters of ${escapeHtml(ha.plainTopics)}` : ''}.`;
    if (aspect === 'square') return `${A} and ${B} press against each other by sign, creating friction between ${ga} and ${gb}${axis ? `, especially where ${escapeHtml(axis)}` : ''}.`;
    if (aspect === 'trine') return `${A} and ${B} support each other by sign, allowing flow between ${ga} and ${gb}${axis ? `, especially where ${escapeHtml(axis)}` : ''}.`;
    if (aspect === 'sextile') return `${A} and ${B} cooperate by sign, opening opportunity between ${ga} and ${gb}${axis ? `, especially where ${escapeHtml(axis)}` : ''}.`;
    return '';
  }
  function chartPlacementSticker(body, p) {
    const glyph = BODY_GLYPHS[body] || body;
    const degree = p.degree == null || Number.isNaN(p.degree) ? '' : `${p.degree}°${p.minute != null && !Number.isNaN(p.minute) ? ' ' + p.minute + '′' : ''}`;
    return `<span class="chart-placement-sticker relphi-sticker relphi-sticker--placement${glyphLengthClass(glyph)}" title="${escapeHtml(body)} in ${escapeHtml(p.sign || '')}${degree ? ' ' + escapeHtml(degree) : ''}${p.retrograde ? ' retrograde' : ''}">${escapeHtml(glyph)}</span>`;
  }
  function placementLayerHtml(card, label, placementLines, factsLine='') {
    const interpretation = card ? layerInterpretation(card) : '';
    return `<div class="chart-card-overlay relphi-info-layer">
      <h4>${escapeHtml(label)}</h4>
      ${interpretation ? `<p>${escapeHtml(interpretation)}</p>` : ''}
      ${placementLines?.length ? `<p>${escapeHtml(placementLines.join(' • '))}</p>` : ''}
      ${factsLine ? `<p>${factsLine}</p>` : ''}
    </div>`;
  }
  function chartPlacementCard(body, p, rising) {
    const data = SIGN_DATA[p.sign] || {};
    const house = p.house ? { number:p.house, name:HOUSE_NAMES[p.house-1] || `${p.house}`, topics:HOUSE_TOPICS[p.house-1] || '', plainTopics:HOUSE_TOPIC_PLAIN[p.house-1] || '' } : houseForSign(rising, p.sign);
    const decan = decanCardFor(p.sign, p.degree);
    const signMajor = cardBySignMajor(p.sign);
    const displayCard = decan || signMajor;
    const degree = p.degree == null || Number.isNaN(p.degree) ? '' : `${p.degree}°${p.minute != null && !Number.isNaN(p.minute) ? ' ' + p.minute + '′' : ''}`;
    const cardLabel = displayCard ? title(displayCard) : `${p.sign || body} placement`;
    const lines = [`${body} in ${p.sign || ''}${degree ? ' ' + degree : ''}${p.retrograde ? ' retrograde' : ''}${house ? ` — House ${house.number}` : ''}`];
    const facts = `Ruler: ${escapeHtml(data.ruler || '—')}. Exaltation: ${escapeHtml(data.exaltation || '—')}. Face lord: ${escapeHtml(faceLord(decan) || '—')}.`;
    return `<article class="chart-card-reveal relphi-surface relphi-surface--chart placement-result-card${displayCard ? '' : ' no-card-art'}">
      ${displayCard ? miniArt(displayCard, 'chart-result-art') : `<div class="chart-result-art relphi-surface-face chart-result-placeholder">${escapeHtml(BODY_GLYPHS[body] || body)}</div>`}
      <div class="chart-placement-sticker-row">${chartPlacementSticker(body, p)}</div>
      ${placementLayerHtml(displayCard, cardLabel, lines, facts)}
    </article>`;
  }
  function chartPlacementGroupCards(entries, rising) {
    const groups = [];
    const byKey = {};
    entries.forEach(([body, p]) => {
      const decan = decanCardFor(p.sign, p.degree);
      const signMajor = cardBySignMajor(p.sign);
      const cardsForPlacement = [signMajor, decan].filter((card, index, arr) => card && arr.findIndex(c => c?.card_id === card.card_id) === index);
      if (!cardsForPlacement.length) cardsForPlacement.push(null);
      cardsForPlacement.forEach(displayCard => {
        const key = displayCard ? displayCard.card_id : `placement-${body}-${p.sign || 'none'}`;
        if (!byKey[key]) {
          byKey[key] = { card: displayCard, placements: [] };
          groups.push(byKey[key]);
        }
        byKey[key].placements.push([body, p]);
      });
    });
    return groups.map(group => {
      const [body, p] = group.placements[0];
      const card = group.card;
      const lines = group.placements.map(([b, pl]) => {
        const house = houseForSign(rising, pl.sign);
        const degree = pl.degree == null || Number.isNaN(pl.degree) ? '' : `${pl.degree}°${pl.minute != null && !Number.isNaN(pl.minute) ? ' ' + pl.minute + '′' : ''}`;
        return `${b} in ${pl.sign || ''}${degree ? ' ' + degree : ''}${pl.retrograde ? ' retrograde' : ''}${house ? ` — House ${house.number}` : ''}`;
      });
      if (!card) {
        return `<article class="chart-card-reveal relphi-surface relphi-surface--chart placement-result-card no-card-art"><div class="chart-result-art relphi-surface-face chart-result-placeholder">${escapeHtml(BODY_GLYPHS[body] || body)}</div>${placementLayerHtml(null, `${p.sign || body} placement`, lines, '')}</article>`;
      }
      return renderCardSurface(card, {
        context: 'chart-placement',
        hitCount: group.placements.length,
        hitSources: lines,
        positionLabel: '',
        placementGlyph: BODY_GLYPHS[body] || '◎',
        placementText: card ? title(card) : `${p.sign || body} placement`,
        placementHeader: card ? `${title(card)} placements` : `${p.sign || body} placements`
      });
    }).join('');
  }

  function addChartHit(map, card, source) {
    if (!card || !card.card_id) return;
    if (!map[card.card_id]) map[card.card_id] = { card, sources: [] };
    map[card.card_id].sources.push(source);
  }
  function chartDerivedHits(chart, rising) {
    const hitMap = {};
    Object.entries(chart).forEach(([body, p]) => {
      const signData = SIGN_DATA[p.sign] || {};
      const decan = decanCardFor(p.sign, p.degree);
      addChartHit(hitMap, cardByPlanetMajor(body), `${body} appears as a placement body`);
      addChartHit(hitMap, cardBySignMajor(p.sign), `${body} in ${p.sign}: sign major`);
      addChartHit(hitMap, decan, `${body} in ${p.sign}: decan card`);
      addChartHit(hitMap, cardByPlanetMajor(signData.ruler), `${body} in ${p.sign}: ruler ${signData.ruler}`);
      addChartHit(hitMap, cardByPlanetMajor(signData.exaltation), `${body} in ${p.sign}: exaltation ${signData.exaltation}`);
      addChartHit(hitMap, cardByPlanetMajor(faceLord(decan)), `${body} in ${p.sign}: face lord ${faceLord(decan)}`);
      const house = p.house ? { number:p.house, name:HOUSE_NAMES[p.house-1] || `${p.house}`, topics:HOUSE_TOPICS[p.house-1] || '', plainTopics:HOUSE_TOPIC_PLAIN[p.house-1] || '' } : houseForSign(rising, p.sign);
      if (house) addChartHit(hitMap, cardBySignMajor(p.sign), `${body} activates House ${house.number}: ${house.plainTopics}`);
    });
    return Object.values(hitMap).sort((a,b) => b.sources.length - a.sources.length || title(a.card).localeCompare(title(b.card)));
  }
  function majorArcanaCards() {
    return cards.filter(card => card.card_type === 'Major').sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0));
  }
  function chartHitTile(hit) {
    const count = hit?.sources?.length || 0;
    const html = renderCardSurface(hit.card, {context:'chart-hit', hitCount: count, hitSources: hit.sources || []});
    const stateClass = count ? 'chart-hit-match' : 'chart-hit-miss';
    return html.replace('or-card tarot-card-surface', `or-card ${stateClass} tarot-card-surface`);
  }
  function renderChartHitGrid(chart, rising) {
    const hits = chartDerivedHits(chart, rising);
    const hitMap = Object.fromEntries(hits.map(hit => [hit.card.card_id, hit]));
    const allMajors = majorArcanaCards().map(card => hitMap[card.card_id] || { card, sources: [] });
    return `<h3>Chart card hits</h3><p class="generated-note">All 22 Major Arcana are shown. Matched cards appear in full color with a count chip; unmatched cards stay pale.</p><div class="chart-hit-grid chart-hit-grid--all-majors">${allMajors.map(chartHitTile).join('')}</div>`;
  }
  function chartResultsState() {
    const raw = state.chartResultsTool || {};
    return {
      group: ['card','sign','house','decan'].includes(raw.group) ? raw.group : 'card',
      source: ['chart','currentSky','both'].includes(raw.source) ? raw.source : 'both',
      show: ['hits','all'].includes(raw.show) ? raw.show : 'hits',
      sort: ['natural','count'].includes(raw.sort) ? raw.sort : 'natural'
    };
  }
  function skyKindClass(kind) { return kind === 'currentSky' ? 'sky-b' : 'sky-a'; }
  function skyKindLabel(kind) { return kind === 'currentSky' ? skyDisplayLabel('currentSky', 'Sky B') : skyDisplayLabel('chart', 'Sky A'); }
  function placementBubbleHtml(item) {
    const p = item?.p || {};
    const body = item?.body || '';
    const glyph = BODY_GLYPHS[body] || body;
    const signGlyph = SIGN_GLYPHS[p.sign] || p.sign || '';
    const label = `${item?.label || skyKindLabel(item?.kind)} ${placementDisplay(body, p)}${item?.reason ? ` · ${item.reason}` : ''}`;
    return `<button type="button" class="result-placement-bubble ${skyKindClass(item?.kind)}" title="${escapeHtml(label)}" data-filter-placement-body="${escapeHtml(body)}"><span class="result-placement-glyph${glyphLengthClass(glyph)}">${escapeHtml(glyph)}</span><small>${escapeHtml(signGlyph)}</small></button>`;
  }
  function resultCardTile({ card=null, titleText='', subtitle='', key='', contributions=[], placeholderGlyph='' }) {
    const count = contributions.length;
    const miss = count ? '' : ' is-miss';
    const image = card ? `<img class="result-card-image" src="${escapeHtml(rwsImagePath(card))}" alt="${escapeHtml(rwsImageAlt(card))}" loading="lazy">` : `<div class="result-card-placeholder">${escapeHtml(placeholderGlyph || '◇')}</div>`;
    const titleLabel = card ? chartResultTitle(card) : titleText;
    const bubbles = contributions.length ? contributions.slice(0, 24).map(placementBubbleHtml).join('') : '<span class="result-no-hit">No contributing placements</span>';
    const overflow = contributions.length > 24 ? `<span class="result-overflow">+${contributions.length - 24}</span>` : '';
    const detailLines = contributions.map(item => `<li><span class="result-detail-source ${skyKindClass(item.kind)}">${escapeHtml(item.label)}</span> ${escapeHtml(placementDisplay(item.body, item.p))}${item.reason ? ` — ${escapeHtml(item.reason)}` : ''}</li>`).join('');
    return `<article class="unified-result-card${miss}" data-result-key="${escapeHtml(key)}">${count ? `<span class="or-hit-badge result-count">×${count}</span>` : ''}<div class="result-card-art">${image}</div><h4>${card ? `<button type="button" class="result-card-title" data-card-id="${escapeHtml(card.card_id)}">${escapeHtml(titleLabel)}</button>` : escapeHtml(titleLabel)}</h4>${subtitle ? `<p class="result-card-subtitle">${escapeHtml(subtitle)}</p>` : ''}<div class="result-placement-bubbles">${bubbles}${overflow}</div>${count ? `<details class="result-card-details"><summary>Details</summary><ul>${detailLines}</ul></details>` : ''}</article>`;
  }
  function addUnifiedContribution(map, key, base, contribution) {
    if (!key) return;
    if (!map[key]) map[key] = { ...base, key, contributions: [] };
    map[key].contributions.push(contribution);
  }
  function collectUnifiedResultData(entriesA, entriesB) {
    const sets = { card:{}, sign:{}, house:{}, decan:{} };
    const addForEntry = (kind, label, body, p) => {
      if (!p?.sign) return;
      const contributionBase = { kind, label, body, p };
      const signData = SIGN_DATA[p.sign] || {};
      const decan = decanCardFor(p.sign, p.degree);
      const house = p.house ? { number:p.house, name:HOUSE_NAMES[p.house-1] || `House ${p.house}`, topics:HOUSE_TOPICS[p.house-1] || '', plainTopics:HOUSE_TOPIC_PLAIN[p.house-1] || '' } : null;
      const addCard = (card, reason) => addUnifiedContribution(sets.card, card?.card_id, { card, titleText: card ? title(card) : '' }, { ...contributionBase, reason });
      addCard(cardByPlanetMajor(body), 'body');
      addCard(cardBySignMajor(p.sign), 'sign');
      addCard(decan, 'decan');
      addCard(cardByPlanetMajor(signData.ruler), `ruler ${signData.ruler || ''}`.trim());
      addCard(cardByPlanetMajor(signData.exaltation), `exaltation ${signData.exaltation || ''}`.trim());
      addCard(cardByPlanetMajor(faceLord(decan)), `face lord ${faceLord(decan) || ''}`.trim());
      if (house) addCard(cardBySignMajor(p.sign), `house ${house.number}`);
      addUnifiedContribution(sets.sign, p.sign, { titleText:`${SIGN_GLYPHS[p.sign] || ''} ${p.sign}`, placeholderGlyph:SIGN_GLYPHS[p.sign] || p.sign, card:cardBySignMajor(p.sign), subtitle:`${signData.ruler ? `${signData.ruler}-ruled ` : ''}${p.sign}` }, { ...contributionBase, reason:'sign placement' });
      if (house) addUnifiedContribution(sets.house, String(house.number), { titleText:`House ${house.number}`, placeholderGlyph:`H${house.number}`, subtitle:house.plainTopics || house.topics || '' }, { ...contributionBase, reason:`House ${house.number}` });
      if (decan) {
        const decanNumber = Math.min(3, Math.max(1, Math.floor((Number(p.degree)||0) / 10) + 1));
        const decanKey = `${p.sign}-${decanNumber}`;
        addUnifiedContribution(sets.decan, decanKey, { card:decan, titleText:chartResultTitle(decan), subtitle:`${p.sign} decan ${decanNumber}` }, { ...contributionBase, reason:'decan placement' });
      }
    };
    entriesA.forEach(([body,p]) => addForEntry('chart', skyDisplayLabel('chart', 'Sky A'), body, p));
    entriesB.forEach(([body,p]) => addForEntry('currentSky', skyDisplayLabel('currentSky', 'Sky B'), body, p));
    return sets;
  }
  function filterUnifiedContribs(group, source) {
    const next = { ...group, contributions: (group.contributions || []).filter(c => source === 'both' || c.kind === source) };
    return next;
  }
  function naturalUnifiedGroups(kind, data, settings) {
    if (kind === 'card') {
      const seen = new Set();
      const hitCards = Object.values(data.card || {}).map(group => group.card).filter(Boolean);
      const baseCards = settings.show === 'all' ? cards.slice() : hitCards;
      const ordered = baseCards
        .filter(card => card && !seen.has(card.card_id) && seen.add(card.card_id))
        .sort((a,b) => {
          const ca = data.card[a.card_id]?.contributions?.length || 0;
          const cb = data.card[b.card_id]?.contributions?.length || 0;
          if (settings.show !== 'all' && cb !== ca) return cb - ca;
          return (Number(a.number) || 99) - (Number(b.number) || 99) || chartResultTitle(a).localeCompare(chartResultTitle(b));
        });
      return ordered.map(card => ({ card, titleText:chartResultTitle(card), key:card.card_id, contributions:(data.card[card.card_id]?.contributions || []) }));
    }
    if (kind === 'sign') return SIGNS.map(sign => data.sign[sign] || { key:sign, titleText:`${SIGN_GLYPHS[sign] || ''} ${sign}`, placeholderGlyph:SIGN_GLYPHS[sign] || sign, card:cardBySignMajor(sign), contributions:[] });
    if (kind === 'house') return Array.from({length:12}, (_,i) => data.house[String(i+1)] || { key:String(i+1), titleText:`House ${i+1}`, placeholderGlyph:`H${i+1}`, subtitle:HOUSE_TOPIC_PLAIN[i] || HOUSE_TOPICS[i] || '', contributions:[] });
    if (kind === 'decan') {
      const rows = [];
      SIGNS.forEach(sign => [1,2,3].forEach(n => {
        const key = `${sign}-${n}`;
        const deg = (n-1)*10;
        const card = decanCardFor(sign, deg);
        rows.push(data.decan[key] || { key, card, titleText: card ? chartResultTitle(card) : `${sign} decan ${n}`, subtitle:`${sign} decan ${n}`, contributions:[] });
      }));
      return rows;
    }
    return [];
  }
  function renderUnifiedChartResults(entriesA, entriesB) {
    const settings = chartResultsState();
    const data = collectUnifiedResultData(entriesA, entriesB);
    let groups = naturalUnifiedGroups(settings.group, data, settings).map(group => filterUnifiedContribs(group, settings.source));
    if (settings.show === 'hits') groups = groups.filter(group => group.contributions.length);
    if (settings.sort === 'count') groups.sort((a,b) => (b.contributions.length - a.contributions.length) || String(a.titleText || chartResultTitle(a.card)).localeCompare(String(b.titleText || chartResultTitle(b.card))));
    const opts = (name, values, current) => values.map(([value,label]) => `<option value="${escapeHtml(value)}" ${current===value?'selected':''}>${escapeHtml(label)}</option>`).join('');
    const aSourceLabel = skyRoleLabel('chart','Sky A');
    const bSourceLabel = skyRoleLabel('currentSky','Sky B');
    const sourceOptions = skyChartNeedsB() ? [['both',`${aSourceLabel} + ${bSourceLabel}`],['chart',aSourceLabel],['currentSky',bSourceLabel]] : [['chart',aSourceLabel]];
    if (!skyChartNeedsB() && settings.source !== 'chart') settings.source = 'chart';
    const controls = `<div class="unified-results-controls"><label>Group by <select data-chart-results-setting="group">${opts('group', [['card','Card'],['sign','Sign'],['house','House'],['decan','Decan']], settings.group)}</select></label><label>Show placements from <select data-chart-results-setting="source">${opts('source', sourceOptions, settings.source)}</select></label><label>Show <select data-chart-results-setting="show">${opts('show', [['hits','Hits only'],['all','All cards']], settings.show)}</select></label><label>Sort <select data-chart-results-setting="sort">${opts('sort', [['natural','Natural order'],['count','Count']], settings.sort)}</select></label></div>`;
    return `<section class="unified-chart-results"><div class="unified-results-head"><h3>Chart Card Results</h3><p class="generated-note">Card results show contributing placements by default. Choose All cards only when you want to audit empty placeholders. Red bubbles are Sky A; blue bubbles are Sky B.</p></div>${controls}<div class="unified-results-grid unified-results-grid--${escapeHtml(settings.group)}">${groups.map(resultCardTile).join('')}</div></section>`;
  }
  function bindUnifiedChartResults(rootId='chartOutput') {
    const root = $(rootId);
    if (!root) return;
    qsa('[data-chart-results-setting]', root).forEach(control => control.addEventListener('change', () => {
      state.chartResultsTool = { ...chartResultsState(), [control.dataset.chartResultsSetting]: control.value };
      renderChart();
    }));
  }
  function chartExportData() {
    const chart = state.chart || {};
    const rising = chart.Rising?.sign;
    const createdAt = new Date();
    return {
      name: state.chartName || '',
      notes: state.chartNotes || '',
      createdAt: createdAt.toISOString(),
      createdAtLocal: localTimestampLabel(createdAt),
      placements: chart,
      derivedCards: chartDerivedHits(chart, rising).map(hit => ({ cardId: hit.card.card_id, card: title(hit.card), count: hit.sources.length, sources: hit.sources }))
    };
  }
  function skyProvenanceDateLabel(kind) {
    const profile = currentSkyCalcProfile(kind);
    const raw = String(profile.dateTime || '').trim();
    if (!raw) return '';
    try {
      const date = dateFromLocalDateTimeInZone(raw, profile.timeZone || '');
      const options = { year:'numeric', month:'long', day:'numeric', hour:'numeric', minute:'2-digit' };
      if (String(profile.timeZone || '').trim()) {
        options.timeZone = String(profile.timeZone).trim();
        options.timeZoneName = 'short';
      }
      return new Intl.DateTimeFormat(undefined, options).format(date);
    } catch (error) {
      return raw.replace('T', ' ');
    }
  }
  function skyProvenanceLocationLabel(kind) {
    const profile = currentSkyCalcProfile(kind);
    const location = String(profile.location || '').trim();
    if (location) return location;
    const latitude = String(profile.latitude || '').trim();
    const longitude = String(profile.longitude || '').trim();
    return latitude && longitude ? `${latitude}, ${longitude}` : '';
  }
  function skyProvenanceLabel(kind) {
    const date = skyProvenanceDateLabel(kind);
    const location = skyProvenanceLocationLabel(kind);
    return [date, location].filter(Boolean).join(' · ') || 'Date, time, and location not attached';
  }
  function compactPlacementExportLine(body, placement) {
    const canonical = canonicalRelationshipBody(body);
    const bodyLabel = relationshipBodyGlyphLabel(canonical);
    const signGlyph = SIGN_GLYPHS[placement?.sign] || '';
    const sign = [signGlyph, placement?.sign || ''].filter(Boolean).join(' ');
    const degree = placementDegreeText(placement);
    const extras = [];
    if (placement?.house) extras.push(`H${placement.house}`);
    if (placement?.retrograde) extras.push('R');
    if (placement?.station) extras.push('station');
    return `${bodyLabel} — ${sign}${degree ? ` ${degree}` : ''}${extras.length ? ` · ${extras.join(' · ')}` : ''}`;
  }
  function compactSkyExportSection(kind, heading) {
    const placements = statePlacementsForKind(kind);
    const lines = Object.entries(placements || {})
      .filter(([, placement]) => placement?.sign)
      .map(([body, placement]) => compactPlacementExportLine(body, placement));
    return [`${heading} — ${skyProvenanceLabel(kind)}`, ...lines];
  }
  function reportAspectNames(filters) {
    if (aspectSelectionIsNone(filters)) return [];
    const selected = selectedAspectNames(filters);
    return selected.length ? selected : EXACT_ASPECT_DEFS.map(def => def.name);
  }
  function reportRelationshipPairs(entriesA, entriesB, relation, filters) {
    const maxOrb = Math.max(0, Number(filters.orb) || 0);
    const allowed = new Set(reportAspectNames(filters));
    if (!allowed.size) return [];
    return exactAspectPairs(entriesA, entriesB || entriesA, maxOrb, relation, filters.chirality || 'both')
      .filter(pair => allowed.has(pair.aspect.name));
  }
  function compactRelationshipEndpoint(item, provenance) {
    return `[${provenance}] ${relationshipBodyGlyphLabel(item.body)} ${SIGN_GLYPHS[item.p?.sign] || ''} ${item.p?.sign || ''} ${placementDegreeText(item.p)}`.replace(/\s+/g, ' ').trim();
  }
  function compactRelationshipExportLine(pair, leftProvenance, rightProvenance) {
    const applying = aspectApplyingStatus(pair);
    const prefix = [applying, pair.aspect.glyph].filter(Boolean).join(' ');
    const left = compactRelationshipEndpoint(pair.a, leftProvenance);
    const right = compactRelationshipEndpoint(pair.b, rightProvenance);
    const arrow = pair.relation === 'transit' || pair.relation === 'progression' ? '→' : '↔';
    return `${prefix} ${left} ${arrow} ${right} · orb ${formatOrb(pair.aspect.orb)} · ${pair.aspect.chirality || 'neutral'} chirality`.trim();
  }
  function compactRelationshipSection(titleText, pairs, leftProvenance, rightProvenance=leftProvenance) {
    return [titleText, ...(pairs.length ? pairs.map(pair => compactRelationshipExportLine(pair, leftProvenance, rightProvenance)) : ['No matching relationships.'])];
  }
  function buildSkyReadingExportText() {
    const entriesA = skyEntries('chart');
    const entriesB = skyChartNeedsB() ? skyEntries('currentSky') : [];
    if (!entriesA.length) return '';
    const filters = exactAspectFilters();
    const provenanceA = skyProvenanceLabel('chart');
    const provenanceB = skyProvenanceLabel('currentSky');
    const scopeAspects = reportAspectNames(filters).map(name => EXACT_ASPECT_DEFS.find(def => def.name === name)?.glyph || name).join(' ');
    const lines = [
      'ORACLE OF RELPHI — SKY READING',
      `Exported: ${localTimestampLabel(new Date())}`,
      `Relationship scope: ${scopeAspects || 'none'} · maximum orb ${formatOrb(Math.max(0, Number(filters.orb) || 0))} · ${filters.chirality || 'both'} chirality`,
      ''
    ];
    lines.push(...compactSkyExportSection('chart', 'SKY A'), '');
    if (entriesB.length) lines.push(...compactSkyExportSection('currentSky', 'SKY B'), '');
    const internalA = reportRelationshipPairs(entriesA, entriesA, 'internal', filters);
    lines.push(...compactRelationshipSection(`INTERNAL RELATIONSHIPS — ${provenanceA}`, internalA, provenanceA), '');
    if (entriesB.length) {
      const internalB = reportRelationshipPairs(entriesB, entriesB, 'internal', filters);
      lines.push(...compactRelationshipSection(`INTERNAL RELATIONSHIPS — ${provenanceB}`, internalB, provenanceB), '');
      let crossRelation = skyChartMode() === 'transit' ? 'transit' : skyChartMode() === 'compare' ? 'compare' : 'synastry';
      let crossA = entriesA, crossB = entriesB, leftProvenance = provenanceA, rightProvenance = provenanceB;
      if (crossRelation === 'transit') {
        crossA = entriesB;
        crossB = entriesA;
        leftProvenance = provenanceB;
        rightProvenance = provenanceA;
      }
      const cross = reportRelationshipPairs(crossA, crossB, crossRelation, filters);
      lines.push(...compactRelationshipSection(`SKY A ↔ SKY B RELATIONSHIPS — ${provenanceA} ↔ ${provenanceB}`, cross, leftProvenance, rightProvenance), '');
    }
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }
  function exportChartData() {
    readChartForm();
    const text = buildSkyReadingExportText();
    if (!text) return;
    download(`oracle-of-relphi-sky-reading-${localTimestampSlug(new Date())}.txt`, text, 'text/plain');
  }
  const EXACT_ASPECT_DEFS = [
    { name:'conjunction', angle:0, glyph:'☌', family:'major' },
    { name:'opposition', angle:180, glyph:'☍', family:'major' },
    { name:'trine', angle:120, glyph:'△', family:'major' },
    { name:'square', angle:90, glyph:'□', family:'major' },
    { name:'sextile', angle:60, glyph:'✶', family:'major' },
    { name:'quincunx', angle:150, glyph:'⚻', family:'adjustment' },
    { name:'semisextile', angle:30, glyph:'⚺', family:'minor' },
    { name:'semisquare', angle:45, glyph:'∠', family:'minor' },
    { name:'sesquisquare', angle:135, glyph:'⚼', family:'minor' },
    { name:'quintile', angle:72, glyph:'Q', family:'creative' },
    { name:'biquintile', angle:144, glyph:'bQ', family:'creative' }
  ];
  const RELATIONSHIP_PLANET_BODIES = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
  const RELATIONSHIP_POINT_BODIES = ['ASC','MC','DSC','IC','Node','South Node','Lilith','Chiron','Fortune','Vertex'];
  const SKY_WHEEL_GEOMETRY = Object.freeze({
    houseNumRadius:34,
    coreWheelRadius:180,
    signGlyphRadius:154,
    lollipopRadius:240
  });
  function canonicalRelationshipBody(body) {
    const value = String(body || '').trim();
    const key = value.toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (key === 'rising' || key === 'asc' || key === 'ascendant') return 'ASC';
    if (key === 'midheaven' || key === 'mc') return 'MC';
    if (key === 'descendant' || key === 'dsc') return 'DSC';
    if (key === 'imumcoeli' || key === 'ic') return 'IC';
    if (key === 'northnode' || key === 'node') return 'Node';
    if (key === 'southnode') return 'South Node';
    if (key === 'partoffortune' || key === 'pof' || key === 'fortune') return 'Fortune';
    return RELATIONSHIP_PLANET_BODIES.find(item => item.toLowerCase() === value.toLowerCase())
      || RELATIONSHIP_POINT_BODIES.find(item => item.toLowerCase() === value.toLowerCase())
      || value;
  }
  function relationshipPlacementUniverse() {
    return [...RELATIONSHIP_PLANET_BODIES, ...RELATIONSHIP_POINT_BODIES];
  }
  function relationshipBodyDisplayName(body) {
    const canonical = canonicalRelationshipBody(body);
    if (canonical === 'MC') return 'Midheaven';
    if (canonical === 'ASC') return 'Ascendant';
    if (canonical === 'DSC') return 'Descendant';
    if (canonical === 'IC') return 'Imum Coeli';
    if (canonical === 'Node') return 'North Node';
    if (canonical === 'Fortune') return 'Part of Fortune';
    return canonical;
  }
  function relationshipBodyGlyphLabel(body) {
    const canonical = canonicalRelationshipBody(body);
    const glyph = BODY_GLYPHS[canonical] || '';
    const name = relationshipBodyDisplayName(canonical);
    return glyph ? `${glyph} ${name}` : name;
  }
  function relationshipPlacementFilterSelection(value) {
    const universe = relationshipPlacementUniverse();
    const raw = selectedValuesFromMaybeArray(value);
    const none = raw.includes('__none');
    const selected = Array.from(new Set(raw
      .filter(item => item !== '__none')
      .map(canonicalRelationshipBody)
      .filter(item => universe.includes(item))));
    return { none, all:!none && selected.length === 0, selected };
  }
  function normDeg(value) {
    const number = Number(value) || 0;
    return ((number % 360) + 360) % 360;
  }
  function placementLongitude(p) {
    if (!p || !p.sign) return null;
    // Calculated placements retain a precise longitude even when their visible
    // degree/minute label follows the chart table's completed-arcminute style.
    // Prefer that exact value so aspects and wheel geometry do not lose precision.
    const exactLongitude = Number(p.longitude);
    if (Number.isFinite(exactLongitude)) return normDeg(exactLongitude);
    const i = SIGNS.indexOf(p.sign);
    if (i < 0) return null;
    const degree = p.degree == null || Number.isNaN(Number(p.degree)) ? 0 : Number(p.degree);
    const minute = p.minute == null || Number.isNaN(Number(p.minute)) ? 0 : Number(p.minute);
    return normDeg(i * 30 + degree + minute / 60);
  }
  function exactAngularDistance(a, b) {
    let d = Math.abs(normDeg(a) - normDeg(b));
    return d > 180 ? 360 - d : d;
  }
  function angularDistanceToCenter(value, center) {
    const delta = Math.abs(normDeg(value - center));
    return Math.min(delta, 360 - delta);
  }
  function aspectCentersForChirality(sourceLongitude, def, chirality='both') {
    const lon = normDeg(sourceLongitude);
    if (!def || def.angle === 0) return [{ side:'neutral', center:lon }];
    if (def.angle === 180) return [{ side:'neutral', center:normDeg(lon + 180) }];
    const centers = [];
    if (chirality === 'left' || chirality === 'both') centers.push({ side:'left', center:normDeg(lon - def.angle) });
    if (chirality === 'right' || chirality === 'both') centers.push({ side:'right', center:normDeg(lon + def.angle) });
    return centers;
  }
  function exactAspectHitsBetween(pa, pb, maxOrb, chirality='both', aspectDefs=EXACT_ASPECT_DEFS) {
    const a = placementLongitude(pa), b = placementLongitude(pb);
    if (a == null || b == null) return [];
    const distance = exactAngularDistance(a, b);
    return (aspectDefs || EXACT_ASPECT_DEFS).flatMap(def => aspectCentersForChirality(a, def, chirality).map(centerDef => {
      const orb = angularDistanceToCenter(b, centerDef.center);
      return orb <= maxOrb ? { ...def, orb, distance, chirality:centerDef.side, targetLongitude:centerDef.center } : null;
    }).filter(Boolean)).sort((x,y) => x.orb - y.orb || x.angle - y.angle);
  }
  function exactAspectBetween(pa, pb, maxOrb, chirality='both') {
    return exactAspectHitsBetween(pa, pb, maxOrb, chirality)[0] || null;
  }
  function formatDegreeMinute(value) {
    if (value == null || Number.isNaN(Number(value))) return '';
    const degree = Math.floor(Math.abs(Number(value)));
    const minute = Math.round((Math.abs(Number(value)) - degree) * 60);
    return minute ? `${degree}° ${minute}′` : `${degree}°`;
  }
  function formatOrb(value) {
    const degree = Math.floor(value);
    const minute = Math.round((value - degree) * 60);
    return `${degree}°${minute ? ' ' + minute + '′' : ''}`;
  }
  function placementDisplay(body, p) {
    const degree = p.degree == null || Number.isNaN(Number(p.degree)) ? '' : `${p.degree}°${p.minute != null && !Number.isNaN(Number(p.minute)) ? ' ' + p.minute + '′' : ''}`;
    return `${relationshipBodyDisplayName(body)}${p.station ? ' station' : ''} in ${p.sign || ''}${degree ? ' ' + degree : ''}${p.retrograde ? ' retrograde' : ''}`;
  }
  function chartResultFilterKey(rootId) { return rootId === 'currentSkyOutput' ? 'currentSky' : 'chart'; }
  function chartResultFilters(kind) { return state.chartResultFilters?.[kind] || []; }
  function chartFilterBar(kind) {
    const filters = chartResultFilters(kind);
    return `<div class="chart-local-filter-bar" data-chart-filter-bar="${kind}"><strong>Chart filters</strong>${filters.length ? filters.map(tag => `<button type="button" data-chart-filter-remove="${escapeHtml(tag)}">${escapeHtml(tag)} ×</button>`).join('') + `<button type="button" data-chart-filter-clear>Clear filters</button>` : '<span class="generated-note">Click glyph bubbles on chart cards to filter this result set.</span>'}</div>`;
  }
  function applyChartResultFilters(rootId) {
    const root = $(rootId);
    if (!root) return;
    const kind = chartResultFilterKey(rootId);
    const filters = chartResultFilters(kind);
    qsa('.chart-result-grid .or-card[data-tags], .chart-hit-grid .or-card[data-tags]', root).forEach(card => {
      const tags = String(card.dataset.tags || '').split('|');
      card.closest('.chart-card-reveal, .or-card')?.classList.toggle('is-chart-filtered-out', filters.length && !filters.every(tag => tags.includes(tag)));
    });
  }
  function toggleChartResultFilter(rootId, tag) {
    const kind = chartResultFilterKey(rootId);
    state.chartResultFilters ||= { chart: [], currentSky: [] };
    const list = new Set(state.chartResultFilters[kind] || []);
    if (list.has(tag)) list.delete(tag); else list.add(tag);
    state.chartResultFilters[kind] = Array.from(list);
    if (kind === 'currentSky') renderCurrentSky(); else renderChart();
  }
  function clearChartResultFilters(kind) {
    state.chartResultFilters ||= { chart: [], currentSky: [] };
    state.chartResultFilters[kind] = [];
    if (kind === 'currentSky') renderCurrentSky(); else renderChart();
  }
  function toggleSkyComparisonPlacementFilter(body) {
    const canonical = canonicalRelationshipBody(body);
    if (!canonical) return;
    state.transitFilters = state.transitFilters || { aspect:[], house:[], sign:[], placement:[], orb:'3', chirality:'both' };
    const selection = relationshipPlacementFilterSelection(state.transitFilters.placement);
    const universe = relationshipPlacementUniverse();
    const current = new Set(selection.none ? [] : (selection.all ? [] : selection.selected));
    if (current.has(canonical)) current.delete(canonical); else current.add(canonical);
    state.transitFilters.placement = current.size ? universe.filter(item => current.has(item)) : ['__none'];
    renderSkyCreator();
    renderChart();
    renderCurrentSky();
  }

  function exactAspectFilters() {
    const f = state.transitFilters || {};
    return { aspect:f.aspect || [], house:f.house || [], sign:f.sign || [], placement:f.placement || [], orb:f.orb || '3', chirality:f.chirality || state.skyAspectUi?.chirality || 'both' };
  }
  function selectedAspectNames(filters = exactAspectFilters()) {
    return selectedValuesFromMaybeArray(filters.aspect).filter(name => EXACT_ASPECT_DEFS.some(def => def.name === name));
  }
  function aspectSelectionIsNone(filters = exactAspectFilters()) {
    return selectedValuesFromMaybeArray(filters.aspect).includes('__none');
  }
  function aspectSelectionIsAll(filters = exactAspectFilters()) {
    return !aspectSelectionIsNone(filters) && selectedAspectNames(filters).length === 0;
  }
  function aspectIsSelectedForFilter(aspectName, filters = exactAspectFilters()) {
    if (aspectSelectionIsNone(filters)) return false;
    const selected = selectedAspectNames(filters);
    return !selected.length || selected.includes(aspectName);
  }
  function aspectFilterSummary(filters = exactAspectFilters()) {
    if (aspectSelectionIsNone(filters)) return 'No aspect types are included.';
    const selected = selectedAspectNames(filters);
    if (!selected.length) return 'All aspect types are included.';
    return `Including ${selected.length} aspect type${selected.length === 1 ? '' : 's'}: ${selected.join(', ')}.`;
  }
  function wheelActiveAspectNames(ui = skyAspectUiState(), filters = exactAspectFilters()) {
    if (aspectSelectionIsNone(filters)) return [];
    const selected = selectedAspectNames(filters);
    if (selected.length) return selected;
    if (ui?.selectedRelationship && ui?.aspect) return [ui.aspect];
    return EXACT_ASPECT_DEFS.map(def => def.name);
  }
  function wheelAspectDefs(ui = skyAspectUiState(), filters = exactAspectFilters()) {
    const names = wheelActiveAspectNames(ui, filters);
    return names.map(name => EXACT_ASPECT_DEFS.find(def => def.name === name)).filter(Boolean);
  }
  function aspectHitsForPlacementPair(sourcePlacement, targetPlacement, aspectDefs, maxOrb, chirality='both') {
    const sourceLongitude = placementLongitude(sourcePlacement);
    const targetLongitude = placementLongitude(targetPlacement);
    if (sourceLongitude == null || targetLongitude == null) return [];
    return (aspectDefs || []).flatMap(def => aspectCentersForChirality(sourceLongitude, def, chirality).map(centerDef => {
      const orb = angularDistanceToCenter(targetLongitude, centerDef.center);
      return orb <= maxOrb ? { ...def, orb, chirality:centerDef.side, targetLongitude:centerDef.center } : null;
    }).filter(Boolean)).sort((a,b) => a.orb - b.orb || a.angle - b.angle);
  }
  function renderAspectChipSelector(prefix, filters = exactAspectFilters(), extraClass = '', options = {}) {
    const selected = selectedAspectNames(filters);
    const noneActive = aspectSelectionIsNone(filters);
    const allActive = !noneActive && !selected.length;
    const majorNames = EXACT_ASPECT_DEFS.filter(def => def.family === 'major').map(def => def.name);
    const majorActive = !noneActive && selected.length === majorNames.length && majorNames.every(name => selected.includes(name));
    const preset = (key, label, active) => `<button type="button" class="aspect-filter-pill aspect-filter-preset ${active ? 'is-active' : ''}" data-${prefix}-aspect-mode="${escapeHtml(key)}" aria-pressed="${active ? 'true' : 'false'}">${escapeHtml(label)}</button>`;
    const chips = EXACT_ASPECT_DEFS.map(def => {
      const active = !noneActive && (allActive || selected.includes(def.name));
      return `<button type="button" class="aspect-filter-pill aspect-filter-chip ${active ? 'is-active' : ''}" data-${prefix}-aspect-toggle="${escapeHtml(def.name)}" aria-pressed="${active ? 'true' : 'false'}"><span class="aspect-filter-glyph">${escapeHtml(def.glyph)}</span><span>${escapeHtml(def.name)}</span></button>`;
    }).join('');
    const chrome = options.compact
      ? ''
      : `<div class="aspect-filter-head"><strong>Aspect types</strong><span>${escapeHtml(aspectFilterSummary(filters))}</span></div><div class="aspect-filter-presets">${preset('all','All',allActive)}${preset('major','Major',majorActive)}${preset('none','None',noneActive)}</div>`;
    return `<div class="aspect-filter-fieldset aspect-chip-selector ${escapeHtml(extraClass)}" role="group" aria-label="Aspect types">${chrome}<div class="aspect-filter-pills">${chips}</div></div>`;
  }
  function renderWheelAspectPills(ui = skyAspectUiState(), filters = exactAspectFilters()) {
    return renderAspectChipSelector('sky', filters, 'sky-wheel-aspect-fieldset');
  }

  function relationshipEndpointMatchesFilters(body, placement, filters = exactAspectFilters()) {
    const placementState = relationshipPlacementFilterSelection(filters.placement);
    const signState = relationshipFilterSelection(filters.sign, SIGNS);
    const houseValues = Array.from({ length:12 }, (_, index) => String(index + 1));
    const houseState = relationshipFilterSelection(filters.house, houseValues);
    if (placementState.none || signState.none || houseState.none) return false;
    if (!placementState.all && !placementState.selected.includes(canonicalRelationshipBody(body))) return false;
    if (!signState.all && !signState.selected.includes(placement?.sign)) return false;
    if (!houseState.all && !houseState.selected.includes(String(placement?.house || ''))) return false;
    return placementLongitude(placement) != null;
  }
  function exactAspectMatches(pair, filters) {
    if (aspectSelectionIsNone(filters)) return false;
    const placements = [pair.a, pair.b];
    const aspectFilters = selectedAspectNames(filters);
    const signState = relationshipFilterSelection(filters.sign, SIGNS);
    const houseValues = Array.from({ length:12 }, (_, index) => String(index + 1));
    const houseState = relationshipFilterSelection(filters.house, houseValues);
    const placementState = relationshipPlacementFilterSelection(filters.placement);
    const selected = skyAspectUiState().selectedRelationship ? null : skyAspectUiState().selected;
    if (aspectFilters.length && !aspectFilters.includes(pair.aspect.name)) return false;
    if (signState.none || houseState.none || placementState.none) return false;
    // Entity filters mean “relationships involving this placement/sign/house.”
    // Require one endpoint to satisfy the active entity filters together rather
    // than requiring both endpoints to be the same selected body, sign, or house.
    const entityFilterActive = !signState.all || !houseState.all || !placementState.all;
    if (entityFilterActive && !placements.some(item => relationshipEndpointMatchesFilters(item.body, item.p, filters))) return false;
    if (selected?.kind && selected?.body && !placements.some(item => item.kind === selected.kind && item.body === selected.body)) return false;
    return true;
  }
  function wheelPlacementMatchesFilters(body, placement, filters = exactAspectFilters()) {
    return relationshipEndpointMatchesFilters(body, placement, filters);
  }
  function exactAspectPairs(entriesA, entriesB, maxOrb, relation='internal', chirality='both') {
    const pairs = [];
    const pairPlacement = (body, p, meta={}) => ({ body, p, kind:meta.kind || '', label:meta.label || '' });
    const aspectDefs = EXACT_ASPECT_DEFS;
    if (relation !== 'internal') {
      entriesA.forEach(([bodyA, pa, metaA]) => entriesB.forEach(([bodyB, pb, metaB]) => {
        exactAspectHitsBetween(pa, pb, maxOrb, chirality, aspectDefs).forEach(aspect => {
          pairs.push({ relation, aspect, a:pairPlacement(bodyA, pa, metaA), b:pairPlacement(bodyB, pb, metaB) });
        });
      }));
    } else {
      for (let i=0; i<entriesA.length; i++) for (let j=i+1; j<entriesA.length; j++) {
        const [bodyA, pa, metaA] = entriesA[i], [bodyB, pb, metaB] = entriesA[j];
        exactAspectHitsBetween(pa, pb, maxOrb, chirality, aspectDefs).forEach(aspect => {
          pairs.push({ relation, aspect, a:pairPlacement(bodyA, pa, metaA), b:pairPlacement(bodyB, pb, metaB) });
        });
      }
    }
    return pairs.sort((x,y) => x.aspect.orb - y.aspect.orb || x.aspect.angle - y.aspect.angle);
  }
  function zodiacPlotPoint(longitude, radius=162, cx=210, cy=210) {
    // Standard zodiac wheel orientation for this tool: zero degrees Aries at 9 o'clock.
    // Longitudes advance clockwise around the wheel so Aries begins at the left edge.
    const a = (normDeg(longitude) + 180) * Math.PI / 180;
    return { x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius };
  }
  function zodiacPlotLinePoint(placement, radius) {
    const longitude = placementLongitude(placement);
    return longitude == null ? null : zodiacPlotPoint(longitude, radius);
  }

  function placementEntriesHouseCusps(entries) {
    const cleaned = (entries || []).filter(([,p]) => p && p.sign);
    const cuspEntries = cleaned.filter(([body]) => String(body).startsWith('_'));
    const explicitCusps = [];
    cleaned.forEach(([body, p]) => {
      const match = String(body || '').match(/^_?house\s*(\d{1,2})$/i);
      if (match && placementLongitude(p) != null) explicitCusps[Number(match[1])-1] = placementLongitude(p);
    });
    if (explicitCusps.filter(v => v != null).length >= 2) return explicitCusps.map((v,i) => v == null ? normDeg((explicitCusps.find(x=>x!=null)||0) + i*30) : normDeg(v));
    const rising = cleaned.find(([body]) => body === 'Rising' || String(body).toUpperCase() === 'ASC')?.[1];
    if (!rising?.sign) return [];
    const ascLon = placementLongitude(rising);
    const wholeSignStart = SIGNS.indexOf(rising.sign) >= 0 ? SIGNS.indexOf(rising.sign) * 30 : null;
    const useAsc = Number.isFinite(ascLon) ? ascLon : wholeSignStart;
    if (useAsc == null) return [];
    return Array.from({ length:12 }, (_, i) => normDeg(useAsc + i * 30));
  }
  function zodiacHouseOverlay(entries, cx=210, cy=210, innerR=70, outerR=188, labelR=92, cssClass='sky-a') {
    const cusps = placementEntriesHouseCusps(entries);
    if (!cusps.length) return '';
    const lines = cusps.map((lon, i) => {
      const a = zodiacPlotPoint(lon, innerR, cx, cy);
      const b = zodiacPlotPoint(lon, outerR, cx, cy);
      const next = cusps[(i + 1) % cusps.length];
      const mid = normDeg(lon + (forwardArc(lon, next || lon + 30) || 30) / 2);
      const label = zodiacPlotPoint(mid, labelR, cx, cy);
      return `<g class="chart-wheel-house-cusp ${escapeHtml(cssClass)}"><line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}"></line><text x="${label.x.toFixed(1)}" y="${label.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${i+1}</text><title>House ${i+1}</title></g>`;
    }).join('');
    return `<g class="chart-wheel-houses ${escapeHtml(cssClass)}" aria-label="House cusps and house numbers">${lines}</g>`;
  }
  function zodiacPlacementPlotHtml(titleText, entriesA, entriesB=null, relation='internal', options={}) {
    entriesA = (entriesA || []).filter(([,p]) => placementLongitude(p) != null);
    entriesB = (entriesB || []).filter(([,p]) => placementLongitude(p) != null);
    if (!entriesA.length && !entriesB.length) return '';
    const filters = exactAspectFilters();
    const maxOrb = Math.max(0, Number(filters.orb) || 3);
    const pairs = exactAspectPairs(entriesA, entriesB.length ? entriesB : entriesA, maxOrb, entriesB.length ? 'cross' : relation, filters.chirality || 'both');
    const cx = 210, cy = 210, outer = 180, labelR = 196;
    const signTicks = SIGNS.map((sign, i) => {
      const start = i * 30;
      const endP = zodiacPlotPoint(start, outer, cx, cy);
      const inP = zodiacPlotPoint(start, 132, cx, cy);
      const labelP = zodiacPlotPoint(start + 15, labelR, cx, cy);
      return `<line class="chart-wheel-sign-tick" x1="${inP.x.toFixed(1)}" y1="${inP.y.toFixed(1)}" x2="${endP.x.toFixed(1)}" y2="${endP.y.toFixed(1)}"></line><text class="chart-wheel-sign-label" x="${labelP.x.toFixed(1)}" y="${labelP.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(SIGN_GLYPHS[sign] || sign[0])}</text>`;
    }).join('');
    const angleLabels = ['ASC','MC','DSC','IC'];
    const cardinalAngleNames = new Set(angleLabels);
    const aspectLines = pairs.map(pair => {
      const aR = outer;
      const bR = outer;
      const a = zodiacPlotLinePoint(pair.a.p, aR);
      const b = zodiacPlotLinePoint(pair.b.p, bR);
      if (!a || !b) return '';
      const cls = String(pair.aspect.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `<line class="chart-wheel-aspect chart-wheel-aspect-${cls}" x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}"><title>${escapeHtml(pair.a.body)} ${escapeHtml(pair.aspect.name)} ${escapeHtml(pair.b.body)} · orb ${escapeHtml(formatOrb(pair.aspect.orb))}</title></line>`;
    }).join('');
    const plotLabels = options.labels || ['Sky A','Sky B'];
    const markerHtml = (entries, skyLabel, radius, cls) => entries.map(([body, p]) => {
      const longitude = placementLongitude(p);
      if (longitude == null) return '';
      const dot = zodiacPlotPoint(longitude, radius, cx, cy);
      const isAngle = cardinalAngleNames.has(String(body || '').toUpperCase());
      const label = zodiacPlotPoint(longitude, radius + (isAngle ? 26 : 24), cx, cy);
      const display = placementDisplay(body, p);
      const bodyText = isAngle ? String(body || '').toUpperCase() : (BODY_GLYPHS[body] || body.slice(0,2));
      const signText = placementCompactSignText(p);
      const markerRadius = isAngle ? 14 : 12;
      return `<g class="chart-wheel-placement ${cls}${isAngle ? ' is-angle' : ''}" data-sky="${escapeHtml(skyLabel)}"><line class="chart-wheel-radius ${cls}" x1="${cx}" y1="${cy}" x2="${dot.x.toFixed(1)}" y2="${dot.y.toFixed(1)}"></line><circle class="chart-wheel-marker-disc" cx="${dot.x.toFixed(1)}" cy="${dot.y.toFixed(1)}" r="${markerRadius}"></circle><text class="chart-wheel-marker-glyph${glyphLengthClass(bodyText)}" x="${dot.x.toFixed(1)}" y="${(dot.y + 0.8).toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(bodyText)}</text>${signText ? `<text class="chart-wheel-marker-degree" x="${label.x.toFixed(1)}" y="${label.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(signText)}</text>` : ''}<title>${escapeHtml(skyLabel)} · ${escapeHtml(display)}</title></g>`;
    }).join('');
    const aMarkers = markerHtml(entriesA, plotLabels[0] || 'Sky A', outer, 'sky-a');
    const bMarkers = markerHtml(entriesB, plotLabels[1] || 'Sky B', outer, 'sky-b');
    const aspectCount = pairs.length;
    const legend = entriesB.length
      ? `<span><i class="chart-wheel-key-a"></i> ${escapeHtml(plotLabels[0] || 'Sky A')}</span><span><i class="chart-wheel-key-b"></i> ${escapeHtml(plotLabels[1] || 'Sky B')}</span>`
      : `<span><i class="chart-wheel-key-a"></i> ${escapeHtml(plotLabels[0] || 'Sky A')} placements</span>`;
    const houseOverlayA = zodiacHouseOverlay(entriesA, cx, cy, 76, outer, 104, 'sky-a');
    const houseOverlayB = entriesB.length ? zodiacHouseOverlay(entriesB, cx, cy, 64, outer - 12, 88, 'sky-b') : '';
    return `<section class="chart-wheel-panel"><div class="chart-wheel-head"><h3>${escapeHtml(titleText)}</h3><p class="generated-note">Placement marks show zodiac longitude and sky home. Aspect lines show exact major aspects within ${escapeHtml(formatOrb(maxOrb))}. House cusps are included when Rising is available.</p></div><svg class="chart-wheel-plot" viewBox="0 0 420 420" role="img" aria-label="${escapeHtml(titleText)}"><circle class="chart-wheel-bg" cx="210" cy="210" r="180"></circle><circle class="chart-wheel-inner" cx="210" cy="210" r="132"></circle>${signTicks}<g class="chart-wheel-house-layer">${houseOverlayA}${houseOverlayB}</g><g class="chart-wheel-aspects">${aspectLines}</g><g class="chart-wheel-markers">${aMarkers}${bMarkers}</g><circle class="chart-wheel-center" cx="210" cy="210" r="4"></circle></svg><div class="chart-wheel-legend">${legend}<span>${aspectCount} aspect${aspectCount === 1 ? '' : 's'} plotted</span></div></section>`;
  }
  function relationshipFilterSelection(value, allValues=[]) {
    const raw = selectedValuesFromMaybeArray(value);
    const none = raw.includes('__none');
    const selected = raw.filter(item => item !== '__none' && allValues.includes(item));
    return { none, all:!none && selected.length === 0, selected };
  }
  function relationshipBodyFilterLabel(body) {
    return relationshipBodyGlyphLabel(body);
  }
  function relationshipCheckbox(label, attributes, checked=false, options={}) {
    const classes = ['relationship-filter-check'];
    if (options.master) classes.push('is-master');
    if (options.compact) classes.push('is-compact');
    const title = options.title ? ` title="${escapeHtml(options.title)}"` : '';
    const aria = options.ariaLabel ? ` aria-label="${escapeHtml(options.ariaLabel)}"` : '';
    return `<label class="${classes.join(' ')}"${title}><input type="checkbox" ${attributes}${checked ? ' checked' : ''}${aria}><span>${escapeHtml(label)}</span></label>`;
  }
  function relationshipFilterSummaryText(stateForField, selectedLabels, allLabel='All') {
    if (stateForField.none) return 'None';
    if (stateForField.all) return allLabel;
    if (!selectedLabels.length) return 'None';
    if (selectedLabels.length <= 2) return selectedLabels.join(', ');
    return `${selectedLabels.length} selected`;
  }
  function exactAspectControlHtml(allPairs, filters) {
    const openMenu = String(state.relationshipFilterOpenMenu || '');
    const menuHtml = (key, label, summary, content) => `<details class="relationship-filter-menu relationship-filter-menu--${escapeHtml(key)}" data-relationship-filter-menu="${escapeHtml(key)}"${openMenu === key ? ' open' : ''}><summary><span>${escapeHtml(label)}</span><strong>${escapeHtml(summary)}</strong></summary><div class="relationship-filter-menu-panel">${content}</div></details>`;
    const optionSection = (label, content) => `<section class="relationship-filter-option-section"><h5>${escapeHtml(label)}</h5><div class="relationship-checkbox-stack">${content}</div></section>`;

    const aspectNames = EXACT_ASPECT_DEFS.map(def => def.name);
    const majorNames = EXACT_ASPECT_DEFS.filter(def => def.family === 'major').map(def => def.name);
    const minorNames = EXACT_ASPECT_DEFS.filter(def => def.family !== 'major').map(def => def.name);
    const aspectState = relationshipFilterSelection(filters.aspect, aspectNames);
    const selectedAspectSet = new Set(aspectState.selected);
    const majorActive = !aspectState.none && !aspectState.all && aspectState.selected.length === majorNames.length && majorNames.every(name => selectedAspectSet.has(name));
    const minorActive = !aspectState.none && !aspectState.all && aspectState.selected.length === minorNames.length && minorNames.every(name => selectedAspectSet.has(name));
    const aspectChecks = EXACT_ASPECT_DEFS.map(def => relationshipCheckbox(`${def.glyph} ${def.name}`, `data-exact-aspect-check="${escapeHtml(def.name)}"`, aspectState.all || selectedAspectSet.has(def.name), { title:def.name, ariaLabel:def.name })).join('');
    const aspectMasters = [
      relationshipCheckbox('All', 'data-exact-aspect-master="all"', aspectState.all, { master:true }),
      relationshipCheckbox('None', 'data-exact-aspect-master="none"', aspectState.none, { master:true }),
      relationshipCheckbox('Major', 'data-exact-aspect-master="major"', majorActive, { master:true }),
      relationshipCheckbox('Minor', 'data-exact-aspect-master="minor"', minorActive, { master:true })
    ].join('');
    const aspectSummary = aspectState.none ? 'None' : aspectState.all ? 'All' : majorActive ? 'Major' : minorActive ? 'Minor' : relationshipFilterSummaryText(aspectState, aspectState.selected);
    const aspectMenu = menuHtml('aspects', 'Aspects', aspectSummary, `${optionSection('Sets', aspectMasters)}${optionSection('Individual aspects', aspectChecks)}`);

    const placementUniverse = relationshipPlacementUniverse();
    const placementState = relationshipPlacementFilterSelection(filters.placement);
    const selectedPlacementSet = new Set(placementState.selected);
    const planetsChecked = !placementState.none && (placementState.all || RELATIONSHIP_PLANET_BODIES.every(body => selectedPlacementSet.has(body)));
    const pointsChecked = !placementState.none && (placementState.all || RELATIONSHIP_POINT_BODIES.every(body => selectedPlacementSet.has(body)));
    const groupOnlyPlanets = planetsChecked && !pointsChecked && placementState.selected.length === RELATIONSHIP_PLANET_BODIES.length;
    const groupOnlyPoints = pointsChecked && !planetsChecked && placementState.selected.length === RELATIONSHIP_POINT_BODIES.length;
    const placementMasters = `${relationshipCheckbox('All', 'data-exact-placement-master="all"', placementState.all, { master:true })}${relationshipCheckbox('None', 'data-exact-placement-master="none"', placementState.none, { master:true })}`;
    const placementGroups = `${relationshipCheckbox('Planets', 'data-exact-placement-group="planets"', planetsChecked)}${relationshipCheckbox('Angles/Points', 'data-exact-placement-group="points"', pointsChecked)}`;
    const planetChecks = RELATIONSHIP_PLANET_BODIES.map(body => relationshipCheckbox(relationshipBodyFilterLabel(body), `data-exact-placement-check="${escapeHtml(body)}"`, placementState.all || selectedPlacementSet.has(body))).join('');
    const pointChecks = RELATIONSHIP_POINT_BODIES.map(body => relationshipCheckbox(relationshipBodyFilterLabel(body), `data-exact-placement-check="${escapeHtml(body)}"`, placementState.all || selectedPlacementSet.has(body))).join('');
    const placementSummary = placementState.none ? 'None' : placementState.all ? 'All' : groupOnlyPlanets ? 'Planets' : groupOnlyPoints ? 'Angles/Points' : relationshipFilterSummaryText(placementState, placementState.selected);
    const placementMenu = menuHtml('placements', 'Placements', placementSummary, `${optionSection('Sets', placementMasters)}${optionSection('Groups', placementGroups)}${optionSection('Planets', planetChecks)}${optionSection('Angles and points', pointChecks)}`);

    const signState = relationshipFilterSelection(filters.sign, SIGNS);
    const signChecks = SIGNS.map(sign => relationshipCheckbox(`${SIGN_GLYPHS[sign] || ''} ${sign}`.trim(), `data-exact-sign-check="${escapeHtml(sign)}"`, signState.all || signState.selected.includes(sign))).join('');
    const signContent = `${optionSection('Sets', `${relationshipCheckbox('All', 'data-exact-sign-master="all"', signState.all, { master:true })}${relationshipCheckbox('None', 'data-exact-sign-master="none"', signState.none, { master:true })}`)}${optionSection('Signs', signChecks)}`;
    const signMenu = menuHtml('signs', 'Signs', relationshipFilterSummaryText(signState, signState.selected), signContent);

    const houseValues = Array.from({ length:12 }, (_, index) => String(index + 1));
    const houseState = relationshipFilterSelection(filters.house, houseValues);
    const houseChecks = houseValues.map(house => relationshipCheckbox(`House ${house}`, `data-exact-house-check="${house}"`, houseState.all || houseState.selected.includes(house), { ariaLabel:`House ${house}` })).join('');
    const houseContent = `${optionSection('Sets', `${relationshipCheckbox('All', 'data-exact-house-master="all"', houseState.all, { master:true })}${relationshipCheckbox('None', 'data-exact-house-master="none"', houseState.none, { master:true })}`)}${optionSection('Houses', houseChecks)}`;
    const houseMenu = menuHtml('houses', 'Houses', relationshipFilterSummaryText(houseState, houseState.selected), houseContent);

    return `<div class="relationship-filter-dashboard relationship-filter-dropdown-dashboard">
      <div class="relationship-filter-dropdown-row">${aspectMenu}${placementMenu}${signMenu}${houseMenu}</div>
      <div class="relationship-filter-utility-row"><label class="relationship-filter-field"><span>Max orb</span><input data-exact-filter="orb" type="number" min="0" max="30" step="0.1" value="${escapeHtml(filters.orb)}"></label><label class="relationship-filter-field"><span>Chirality</span><select data-exact-filter="chirality"><option value="both" ${filters.chirality==='both'?'selected':''}>Both</option><option value="left" ${filters.chirality==='left'?'selected':''}>Left</option><option value="right" ${filters.chirality==='right'?'selected':''}>Right</option></select></label></div>
    </div>`;
  }
  function bodyShortLabel(body) {
    const map = {
      Sun:'Sun', Moon:'Moon', Mercury:'Merc', Venus:'Venus', Mars:'Mars', Jupiter:'Jup', Saturn:'Sat', Uranus:'Uran', Neptune:'Nep', Pluto:'Pluto',
      Rising:'ASC', ASC:'ASC', MC:'MC', IC:'IC', DSC:'DSC', Node:'Node', Lilith:'Lilith', Chiron:'Chiron', Fortune:'Fort', Vertex:'Vertex'
    };
    const value = map[body] || String(body || 'Point');
    return value.length > 7 ? value.slice(0, 7) : value;
  }
  function exactAspectMiniWheel(pair) {
    const cx = 80, cy = 80, outer = 50;
    const lonA = placementLongitude(pair.a.p);
    const lonB = placementLongitude(pair.b.p);
    const a = lonA == null ? null : zodiacPlotPoint(lonA, outer, cx, cy);
    const b = lonB == null ? null : zodiacPlotPoint(lonB, outer, cx, cy);
    const labelPoint = (lon) => zodiacPlotPoint(lon, 66, cx, cy);
    const aLabel = lonA == null ? null : labelPoint(lonA);
    const bLabel = lonB == null ? null : labelPoint(lonB);
    const tickHtml = SIGNS.map((sign, i) => {
      const p1 = zodiacPlotPoint(i * 30, 43, cx, cy);
      const p2 = zodiacPlotPoint(i * 30, outer, cx, cy);
      return `<line x1="${p1.x.toFixed(1)}" y1="${p1.y.toFixed(1)}" x2="${p2.x.toFixed(1)}" y2="${p2.y.toFixed(1)}"></line>`;
    }).join('');
    const cls = String(pair.aspect.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const aName = bodyShortLabel(pair.a.body);
    const bName = bodyShortLabel(pair.b.body);
    const maxOrb = Math.max(Number(exactAspectFilters().orb) || 3, Number(pair.aspect.orb) || 0);
    const activeChirality = pair.aspect.chirality || exactAspectFilters().chirality || 'both';
    const rangeHtml = lonA == null ? '' : aspectRangeArcsFromLongitude(lonA, pair.aspect.name, maxOrb, cx, cy, 39, 'mini-wheel-aspect-range', activeChirality);
    const houseMiniA = zodiacHouseOverlay([[pair.a.body, pair.a.p]], cx, cy, 22, 50, 31, 'sky-a');
    const houseMiniB = zodiacHouseOverlay([[pair.b.body, pair.b.p]], cx, cy, 18, 46, 26, 'sky-b');
    return `<svg class="exact-aspect-mini-wheel" viewBox="0 0 160 160" role="img" aria-label="${escapeHtml(pair.a.body)} ${escapeHtml(pair.aspect.name)} ${escapeHtml(pair.b.body)}"><circle class="mini-wheel-bg" cx="80" cy="80" r="50"></circle><g class="mini-wheel-ticks">${tickHtml}</g><g class="chart-wheel-house-layer mini-house-layer">${houseMiniA}${houseMiniB}</g><g class="mini-wheel-aspect-ranges">${rangeHtml}</g>${a ? `<line class="mini-wheel-radius is-a" x1="80" y1="80" x2="${a.x.toFixed(1)}" y2="${a.y.toFixed(1)}"></line>` : ''}${b ? `<line class="mini-wheel-radius is-b" x1="80" y1="80" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}"></line>` : ''}${a && b ? `<line class="chart-wheel-aspect chart-wheel-aspect-${cls}" x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}"></line>` : ''}${a ? `<circle class="mini-wheel-marker" cx="${a.x.toFixed(1)}" cy="${a.y.toFixed(1)}" r="9"></circle><text class="mini-wheel-marker-glyph" x="${a.x.toFixed(1)}" y="${(a.y + 0.5).toFixed(1)}" text-anchor="middle" dominant-baseline="middle">A</text>${aLabel ? `<text class="mini-wheel-body-label" x="${aLabel.x.toFixed(1)}" y="${aLabel.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(aName)}</text>` : ''}` : ''}${b ? `<circle class="mini-wheel-marker is-b" cx="${b.x.toFixed(1)}" cy="${b.y.toFixed(1)}" r="9"></circle><text class="mini-wheel-marker-glyph is-b" x="${b.x.toFixed(1)}" y="${(b.y + 0.5).toFixed(1)}" text-anchor="middle" dominant-baseline="middle">B</text>${bLabel ? `<text class="mini-wheel-body-label is-b" x="${bLabel.x.toFixed(1)}" y="${bLabel.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(bName)}</text>` : ''}` : ''}<circle class="chart-wheel-center" cx="80" cy="80" r="3"></circle></svg>`;
  }
  function exactAspectPairDataAttributes(pair) {
    const sourceKind = pair?.a?.kind || 'chart';
    const targetKind = pair?.b?.kind || 'chart';
    const chirality = pair?.aspect?.chirality || 'neutral';
    const sourceDisplay = placementRelationshipHubTitle(pair?.a || {}, pair?.a?.label || 'Source');
    const targetDisplay = placementRelationshipHubTitle(pair?.b || {}, pair?.b?.label || 'Target');
    const label = `Open ${sourceDisplay} ${pair?.aspect?.name || 'aspect'} ${targetDisplay}`;
    return `data-aspect-focus-kind="${escapeHtml(sourceKind)}" data-aspect-focus-body="${escapeHtml(pair?.a?.body || '')}" data-aspect-focus-target-kind="${escapeHtml(targetKind)}" data-aspect-focus-target-body="${escapeHtml(pair?.b?.body || '')}" data-aspect-focus-aspect="${escapeHtml(pair?.aspect?.name || '')}" data-aspect-focus-chirality="${escapeHtml(chirality)}" data-aspect-focus-orb="${escapeHtml(String(pair?.aspect?.orb ?? ''))}" aria-label="${escapeHtml(label)}"`;
  }
  function placementRelationshipHubKey(item) {
    return `${item?.kind || 'chart'}|${item?.body || ''}`;
  }
  function placementRelationshipHubTitle(item, fallbackLabel='Sky') {
    const glyph = BODY_GLYPHS[item?.body] || item?.body || '';
    return `${glyph ? glyph + ' ' : ''}${fallbackLabel} ${item?.body || 'Placement'}${item?.p?.sign ? ` in ${item.p.sign}` : ''}${placementDegreeText(item?.p) ? ` ${placementDegreeText(item.p)}` : ''}`;
  }
  function placementGlyphCluster(item) {
    const bodyGlyph = BODY_GLYPHS[item?.body] || item?.body || '◎';
    const signGlyph = SIGN_GLYPHS[item?.p?.sign] || '';
    const degree = placementDegreeText(item?.p) || '';
    const retro = item?.p?.retrograde ? '℞' : '';
    return [bodyGlyph, signGlyph, degree, retro].filter(Boolean).join(' ');
  }
  function aspectGlyphOnly(pair) {
    return pair?.aspect?.glyph || pair?.aspect?.name || '△';
  }

  function renderPlacementRelationshipHubs(pairs, labels=['Placement A','Placement B']) {
    if (!pairs?.length) return '';
    const groups = new Map();
    pairs.forEach(pair => {
      const key = placementRelationshipHubKey(pair.a);
      if (!groups.has(key)) groups.set(key, { source: pair.a, pairs: [] });
      groups.get(key).pairs.push(pair);
    });
    const hubs = Array.from(groups.values()).map(group => {
      const sourceLabel = group.source.label || labels[0] || 'Source';
      const bodyGlyph = BODY_GLYPHS[group.source.body] || group.source.body || '◎';
      const sourceTitle = placementRelationshipHubTitle(group.source, sourceLabel);
      const aspectChips = group.pairs.map(pair => {
        const targetTitle = placementRelationshipHubTitle(pair.b, pair.b.label || labels[1] || 'Target');
        const cls = String(pair.aspect.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const glyphLine = `${aspectGlyphOnly(pair)} ${placementGlyphCluster(pair.b)} · ${formatOrb(pair.aspect.orb)}`;
        return `<button type="button" class="relationship-hub-mini relationship-hub-mini--compact aspect-${escapeHtml(cls)}" ${exactAspectPairDataAttributes(pair)} title="${escapeHtml(pair.aspect.name)} · ${escapeHtml(targetTitle)} · orb ${escapeHtml(formatOrb(pair.aspect.orb))}">${exactAspectMiniWheel(pair)}<span class="relationship-hub-mini-caption"><strong>${escapeHtml(glyphLine)}</strong></span></button>`;
      }).join('');
      return `<article class="relationship-hub relationship-hub--compact relationship-hub--mini"><h4><span class="hub-source-glyph">${escapeHtml(bodyGlyph)}</span><span title="${escapeHtml(sourceTitle)}">${escapeHtml(placementGlyphCluster(group.source))}</span><span class="hub-count">${group.pairs.length}</span></h4><div class="relationship-hub-mini-grid relationship-hub-mini-grid--compact">${aspectChips}</div></article>`;
    }).join('');
    return `<details class="relationship-hub-panel relationship-hub-panel--compact" open><summary>Placement hubs <span>${groups.size} sources</span></summary><div class="relationship-hub-grid relationship-hub-grid--compact">${hubs}</div></details>`;
  }
  function symbolHelpPayload(type, key, extra = {}) {
    return `data-symbol-help="${escapeHtml(type)}" data-symbol-key="${escapeHtml(key || '')}"${extra.body ? ` data-symbol-body="${escapeHtml(extra.body)}"` : ''}${extra.sign ? ` data-symbol-sign="${escapeHtml(extra.sign)}"` : ''}${extra.degree ? ` data-symbol-degree="${escapeHtml(extra.degree)}"` : ''}${extra.minute ? ` data-symbol-minute="${escapeHtml(extra.minute)}"` : ''}${extra.house ? ` data-symbol-house="${escapeHtml(extra.house)}"` : ''}${extra.cardId ? ` data-card-id="${escapeHtml(extra.cardId)}"` : ''}`;
  }
  function relationshipExploreChip(type, label, key, extra = {}) {
    return `<button type="button" class="relationship-explore-chip" ${symbolHelpPayload(type, key, extra)}>${escapeHtml(label)}</button>`;
  }
  function conciseRelationshipReading(pair, leftLabel='Placement A', rightLabel='Placement B') {
    const a = compactPlacementName(leftLabel, pair.a.body, pair.a.p);
    const b = compactPlacementName(rightLabel, pair.b.body, pair.b.p);
    const aspect = String(pair.aspect.name || 'relationship').toLowerCase();
    const da = SIGN_DATA[pair.a.p.sign] || {}, db = SIGN_DATA[pair.b.p.sign] || {};
    const sameSign = pair.a.p.sign && pair.a.p.sign === pair.b.p.sign;
    const sameElement = da.element && db.element && da.element === db.element;
    const sameMode = da.mode && db.mode && da.mode === db.mode;
    const decanA = decanCardFor(pair.a.p.sign, pair.a.p.degree);
    const decanB = decanCardFor(pair.b.p.sign, pair.b.p.degree);
    const sameDecan = !!(decanA && decanB && decanA.card_id === decanB.card_id);
    const orbRef = lockedIngredient(orbIntensityRef(pair.aspect.orb, exactAspectAllowedOrb()));
    const orbTone = orbRef?.name ? String(orbRef.name).toLowerCase() : formatOrb(pair.aspect.orb);
    const sentences = [];
    sentences.push(`${a} ${aspect === 'conjunction' ? 'conjoins' : `forms ${nameWithArticle(aspect)} with`} ${b}.`);
    if (sameSign) {
      sentences.push(sameSignContextSentence(pair));
      sentences.push(aspectContactSentence(pair, true, sameDecan));
    } else {
      sentences.push(`The contact is ${aspectAdjectivalPhrase(aspect)}.`);
      if (sameElement || sameMode) {
        const shared = [sameElement ? `${da.element.toLowerCase()} element` : '', sameMode ? `${da.mode.toLowerCase()} modality` : ''].filter(Boolean);
        sentences.push(`Shared ${humanJoin(shared)} gives the contact a recognizable rhythm.`);
      }
    }
    sentences.push(`Orb: ${formatOrb(pair.aspect.orb)} · ${orbTone}.`);
    return cleanSentence(sentences.filter(Boolean).join(' '));
  }
  function componentProfileText(type, key, dataset={}) {
    const t = String(type || '').toLowerCase();
    const k = String(key || '').trim();
    if (t === 'body') {
      const phrase = relIngredientPhrase(bodyIngredientRef(k), bodyRole(k));
      return { title: relationshipBodyGlyphLabel(k), eyebrow:'Body / point profile', body: phraseNoPeriod(phrase), action:'Open the full body or point profile.' };
    }
    if (t === 'sign') {
      const data = SIGN_DATA[k] || {};
      const phrase = relIngredientPhrase(signIngredientRef(k), signField(k));
      const meta = [data.element, data.mode, data.ruler ? `ruled by ${data.ruler}` : ''].filter(Boolean).join(' · ');
      return { title: `${SIGN_GLYPHS[k] || ''} ${k}`.trim(), eyebrow:'Sign profile', body: `${phraseNoPeriod(phrase)}${meta ? ` (${meta}).` : '.'}`, action:'Open the sign profile for element, modality, ruler, dignity, and house meanings.' };
    }
    if (t === 'aspect') {
      const def = EXACT_ASPECT_DEFS.find(item => item.name === k) || {};
      const phrase = relIngredientPhrase(aspectIngredientRef(k), aspectAdjectivalPhrase(k));
      return { title: `${def.glyph || ''} ${k}`.trim(), eyebrow:'Aspect geometry', body: `${sentenceCaseFragment(phrase)}. Exact angle: ${def.angle ?? '—'} degrees.`, action:'Open the aspect geometry view for angle, orb, chirality, and a playable mini-wheel.' };
    }
    if (t === 'coordinate') {
      const body = dataset.symbolBody || dataset.body || '';
      const sign = dataset.symbolSign || dataset.sign || '';
      const degree = dataset.symbolDegree || dataset.degree || '';
      const minute = dataset.symbolMinute || dataset.minute || '';
      const house = dataset.symbolHouse || dataset.house || '';
      return { title: `${body} ${sign} ${degree}°${minute || '00'}′`.trim(), eyebrow:'Placement coordinate', body: `This coordinate places ${body || 'the placement'} at a specific degree and minute of ${sign || 'the sign'}.${house ? ` It is assigned to House ${house}.` : ''}`, action:'Open coordinate details for decan, bounds, card correspondence, source, and house assignment.' };
    }
    if (t === 'orb') {
      return { title:`Orb ${k}`, eyebrow:'Orb strength', body:`The orb tells how far the aspect is from exact. This contact is ${String(lockedIngredient(orbIntensityRef(Number(k) || 0, exactAspectAllowedOrb()))?.name || 'within range').toLowerCase()}.`, action:'Open orb details for exact, close, moderate, wide, and outside-range contacts.' };
    }
    if (t === 'chirality') {
      return { title:`${k || 'neutral'} chirality`, eyebrow:'Aspect branch', body: phraseNoPeriod(relIngredientPhrase(chiralityIngredientRef(k), 'Chirality marks the branch of the aspect geometry.')), action:'Left and right are geometric branch choices, not chronological order.' };
    }
    return { title:k || 'Symbol', eyebrow:'Symbol helper', body:'Tap this symbol to explore its profile and examples.', action:'' };
  }
  function showSymbolHelperFromElement(el) {
    const type = el?.dataset?.symbolHelp || '';
    const key = el?.dataset?.symbolKey || '';
    const info = componentProfileText(type, key, el?.dataset || {});
    let panel = document.querySelector('.symbol-helper-popover');
    if (!panel) {
      panel = document.createElement('aside');
      panel.className = 'symbol-helper-popover';
      panel.setAttribute('role','dialog');
      panel.setAttribute('aria-live','polite');
      document.body.appendChild(panel);
    }
    panel.innerHTML = `<button type="button" class="symbol-helper-close" aria-label="Close helper">×</button><p class="symbol-helper-eyebrow">${escapeHtml(info.eyebrow)}</p><h3>${escapeHtml(info.title)}</h3><p>${escapeHtml(info.body)}</p>`;
    panel.hidden = false;
    panel.querySelector('.symbol-helper-close')?.addEventListener('click', () => { panel.hidden = true; });
  }
  function relationshipPlacementCardHtml(label, item, card, skyClass) {
    const body = item?.body || '';
    const p = item?.p || {};
    const degreeText = placementDegreeText(p);
    const cardTitle = card ? title(card) : `${body || 'Placement'} in ${p.sign || ''}`.trim();
    const cardArt = card ? `<button type="button" class="relationship-card-art-button" data-card-id="${escapeHtml(card.card_id)}" aria-label="Open ${escapeHtml(cardTitle)} full card entry"><img class="relationship-card-art" src="${escapeHtml(rwsImagePath(card))}" alt="${escapeHtml(rwsImageAlt(card))}" loading="lazy"></button>` : `<div class="relationship-card-placeholder">${escapeHtml(BODY_GLYPHS[body] || body || '◎')}</div>`;
    const titleButton = card ? `<button class="relationship-card-title card-title-link" type="button" data-card-id="${escapeHtml(card.card_id)}">${escapeHtml(cardTitle)}</button>` : `<span class="relationship-card-title">${escapeHtml(cardTitle)}</span>`;
    const bodyToken = `<button type="button" class="relationship-component-link" ${symbolHelpPayload('body', body)}>${escapeHtml(relationshipBodyGlyphLabel(body))}</button>`;
    const signToken = p.sign ? `<button type="button" class="relationship-component-link" ${symbolHelpPayload('sign', p.sign)}>${escapeHtml(SIGN_GLYPHS[p.sign] || '')} ${escapeHtml(p.sign)}</button>` : '';
    const coordToken = degreeText ? `<button type="button" class="relationship-component-link" ${symbolHelpPayload('coordinate', `${body}-${p.sign}-${degreeText}`, { body, sign:p.sign, degree:p.degree, minute:p.minute, house:p.house })}>${escapeHtml(degreeText)}${p.house ? ` · H${escapeHtml(String(p.house))}` : ''}</button>` : '';
    return `<section class="relationship-placement-card ${escapeHtml(skyClass)}"><span class="relationship-sky-label">${escapeHtml(label)}</span><div class="relationship-card-frame">${cardArt}</div><div class="relationship-card-caption">${titleButton}<p class="relationship-component-row">${bodyToken}${signToken}${coordToken}</p><div class="chart-placement-sticker-row relationship-sticker-row">${chartPlacementSticker(body, p)}</div></div></section>`;
  }
  function relationshipExplorePiecesHtml(pair, cardA, cardB) {
    const chips = [];
    chips.push(relationshipExploreChip('body', relationshipBodyGlyphLabel(pair.a.body), pair.a.body));
    if (pair.a.p.sign) chips.push(relationshipExploreChip('sign', `${SIGN_GLYPHS[pair.a.p.sign] || ''} ${pair.a.p.sign}`.trim(), pair.a.p.sign));
    chips.push(relationshipExploreChip('aspect', `${pair.aspect.glyph || ''} ${pair.aspect.name}`.trim(), pair.aspect.name));
    chips.push(relationshipExploreChip('body', relationshipBodyGlyphLabel(pair.b.body), pair.b.body));
    if (pair.b.p.sign) chips.push(relationshipExploreChip('sign', `${SIGN_GLYPHS[pair.b.p.sign] || ''} ${pair.b.p.sign}`.trim(), pair.b.p.sign));
    if (cardA) chips.push(`<button type="button" class="relationship-explore-chip" data-card-id="${escapeHtml(cardA.card_id)}">${escapeHtml(title(cardA))}</button>`);
    if (cardB && (!cardA || cardB.card_id !== cardA.card_id)) chips.push(`<button type="button" class="relationship-explore-chip" data-card-id="${escapeHtml(cardB.card_id)}">${escapeHtml(title(cardB))}</button>`);
    return `<nav class="relationship-explore-pieces" aria-label="Explore relationship pieces"><strong>Explore the pieces</strong><div>${chips.join('')}</div></nav>`;
  }
  const TERM_LENGTH_RULES = [
    { label:'Momentary', detail:'minutes to a few hours', bodies:['Rising','ASC','Ascendant','MC','Midheaven','IC','DSC','Descendant'] },
    { label:'Daily / short-term', detail:'hours to two days', bodies:['Moon'] },
    { label:'Weekly / passing weather', detail:'days to two weeks', bodies:['Sun','Mercury','Venus','Mars'] },
    { label:'Monthly / seasonal', detail:'several weeks to a few months', bodies:['Jupiter','North Node','South Node','Node'] },
    { label:'Long-term / structural', detail:'several months; the closest passage can remain active for weeks', bodies:['Saturn'] },
    { label:'Long-term / structural', detail:'many months to years', bodies:['Uranus','Neptune','Pluto'] }
  ];
  function termLengthForBody(body) {
    const b = canonicalRelationshipBody(body);
    const found = TERM_LENGTH_RULES.find(rule => rule.bodies.some(item => canonicalRelationshipBody(item).toLowerCase() === String(b).toLowerCase()));
    return found || { label:'Term unknown', detail:'duration depends on motion data' };
  }
  function movingAndFixedEndpoints(pair) {
    const relation = String(pair?.relation || 'internal').toLowerCase();
    if (relation !== 'transit' && relation !== 'progression') return null;
    const endpoints = [pair?.a, pair?.b].filter(Boolean);
    const moving = endpoints.find(item => item?.kind === 'currentSky') || pair?.a || null;
    const fixed = endpoints.find(item => item !== moving) || pair?.b || null;
    return moving && fixed ? { moving, fixed } : null;
  }
  function aspectTermLength(pair) {
    const relation = String(pair?.relation || 'internal').toLowerCase();
    if (relation === 'transit' || relation === 'progression') {
      const endpoints = movingAndFixedEndpoints(pair);
      return termLengthForBody(endpoints?.moving?.body);
    }
    if (relation === 'internal') {
      const a = termLengthForBody(pair?.a?.body);
      const b = termLengthForBody(pair?.b?.body);
      const order = ['Momentary','Daily / short-term','Weekly / passing weather','Monthly / seasonal','Long-term / structural','Term unknown'];
      const ai = order.indexOf(a.label), bi = order.indexOf(b.label);
      return ai >= bi ? a : b;
    }
    return null;
  }
  function aspectApplyingStatus(pair) {
    const relation = String(pair?.relation || 'internal').toLowerCase();
    if (relation !== 'transit' && relation !== 'progression') return null;

    const endpoints = movingAndFixedEndpoints(pair);
    const movingPlacement = endpoints?.moving?.p || {};
    const fixedPlacement = endpoints?.fixed?.p || {};
    const movingLongitude = placementLongitude(movingPlacement);
    const fixedLongitude = placementLongitude(fixedPlacement);
    const movingSpeed = Number(movingPlacement.motionSpeedDegPerDay);
    const angle = Number(pair?.aspect?.angle);

    if (movingLongitude == null || fixedLongitude == null || !Number.isFinite(movingSpeed) || !Number.isFinite(angle)) return null;

    const orbAt = movingLon => Math.abs(exactAngularDistance(movingLon, fixedLongitude) - angle);
    const currentOrb = orbAt(movingLongitude);
    const nextOrb = orbAt(normDeg(movingLongitude + movingSpeed / 24));

    if (!Number.isFinite(currentOrb) || !Number.isFinite(nextOrb)) return null;
    if (Math.abs(nextOrb - currentOrb) < 0.0005) return 'Stationary / exacting';
    return nextOrb < currentOrb ? 'Applying' : 'Separating';
  }
  function aspectTimingBadgeHtml(pair) {
    const term = aspectTermLength(pair);
    const applying = aspectApplyingStatus(pair);
    const bits = [];
    if (applying) bits.push(applying);
    if (term?.label) bits.push(term.label);
    const title = term?.detail ? ` title="${escapeHtml(term.detail)}"` : '';
    return bits.length ? `<p class="relationship-timing-line"${title}>${escapeHtml(bits.join(' · '))}${term?.detail ? ` <span>${escapeHtml(term.detail)}</span>` : ''}</p>` : '';
  }
  function exactAspectCard(pair, leftLabel='Placement A', rightLabel='Placement B') {
    const cardA = decanCardFor(pair.a.p.sign, pair.a.p.degree) || cardBySignMajor(pair.a.p.sign);
    const cardB = decanCardFor(pair.b.p.sign, pair.b.p.degree) || cardBySignMajor(pair.b.p.sign);
    const leftClass = pair.a.kind === 'currentSky' ? 'is-sky-b' : 'is-sky-a';
    const rightClass = pair.b.kind === 'currentSky' ? 'is-sky-b' : 'is-sky-a';
    const interpretation = conciseRelationshipReading(pair, leftLabel, rightLabel);
    const aspectName = `${pair.aspect.glyph || ''} ${pair.aspect.name}`.trim();
    const aspectHelper = symbolHelpPayload('aspect', pair.aspect.name);
    const orbHelper = symbolHelpPayload('orb', String(pair.aspect.orb));
    const chiralityHelper = symbolHelpPayload('chirality', pair.aspect.chirality || 'neutral');
    return `<article class="transit-aspect-tile exact-aspect-tile relationship-reading-tile relationship-symbol-envelope" tabindex="0" data-aspect="${escapeHtml(pair.aspect.name)}" data-orb="${pair.aspect.orb.toFixed(4)}" data-relationship-mode="${escapeHtml(pair.relation || 'internal')}" ${exactAspectPairDataAttributes(pair)}><header class="relationship-reading-head"><button type="button" class="relationship-reading-mini relationship-helper-button" ${aspectHelper} aria-label="Open ${escapeHtml(pair.aspect.name)} aspect helper">${exactAspectMiniWheel(pair)}</button><div><h4><button type="button" class="relationship-aspect-title" ${aspectHelper}>${escapeHtml(aspectName)}</button></h4><p><button type="button" class="relationship-meta-link" ${chiralityHelper}>${escapeHtml(pair.aspect.chirality || 'neutral')} chirality</button> · <button type="button" class="relationship-meta-link" ${orbHelper}>orb ${escapeHtml(formatOrb(pair.aspect.orb))}</button></p>${aspectTimingBadgeHtml(pair)}</div></header><div class="relationship-reading-pair">${relationshipPlacementCardHtml(leftLabel, pair.a, cardA, leftClass)}<button type="button" class="relationship-aspect-seal" ${aspectHelper} title="${escapeHtml(pair.aspect.name)} · orb ${escapeHtml(formatOrb(pair.aspect.orb))}">${escapeHtml(pair.aspect.glyph)}</button>${relationshipPlacementCardHtml(rightLabel, pair.b, cardB, rightClass)}</div><section class="relationship-prose-panel"><div class="relationship-prose-title">Relationship reading</div><p>${escapeHtml(interpretation)}</p>${relationshipExplorePiecesHtml(pair, cardA, cardB)}</section></article>`;
  }
  function relationshipModeNote(relation, labels=['Placement A','Placement B']) {
    const r = String(relation || 'internal').toLowerCase();
    if (r === 'transit') return `Transit mode reads ${labels[0]} as the moving sky and ${labels[1]} as the natal or reference sky. Timing fields belong here: start, exact pass or passes, end, duration, and recurrence frequency.`;
    if (r === 'progression') return `Progression mode reads ${labels[0]} as the progressed sky and ${labels[1]} as the natal or reference sky. It describes symbolic development through time, not an external sky event.`;
    if (r === 'synastry') return `Synastry compares two peer skies: ${labels[0]} and ${labels[1]}.`;
    if (r === 'compare') return `Compare mode reads two skies neutrally, without making one a transit or relationship chart.`;
    return `Internal mode reads one sky against itself. It describes chart structure, not duration or recurrence.`;
  }

  function activePlacementFilterNames(filters) {
    const selection = relationshipPlacementFilterSelection(filters?.placement);
    return selection.none || selection.all ? [] : selection.selected;
  }
  function renderCompactRelationshipChips(filteredPairs, filters, labels=['Placement A','Placement B']) {
    if (!filteredPairs?.length) {
      const active = activePlacementFilterNames(filters);
      if (!active.length) return '';
      const names = active.map(body => relationshipBodyGlyphLabel(body)).join(', ');
      return `<section class="relationship-chip-panel"><h4>Relationships: ${escapeHtml(names)}</h4><p class="generated-note">No matching aspects are inside the current orb, chirality, and aspect filters.</p></section>`;
    }
    const active = activePlacementFilterNames(filters);
    const title = active.length
      ? `Relationships: ${active.map(body => relationshipBodyGlyphLabel(body)).join(', ')}`
      : 'Relationship chips';
    const chips = filteredPairs.map(pair => {
      const a = placementGlyphCluster(pair.a);
      const b = placementGlyphCluster(pair.b);
      const cls = String(pair.aspect.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const titleText = `${placementRelationshipHubTitle(pair.a, pair.a.label || labels[0])} ${pair.aspect.name} ${placementRelationshipHubTitle(pair.b, pair.b.label || labels[1])} · ${pair.aspect.chirality || 'neutral'} · orb ${formatOrb(pair.aspect.orb)}`;
      return `<button type="button" class="relationship-chip aspect-${escapeHtml(cls)}" ${exactAspectPairDataAttributes(pair)} title="${escapeHtml(titleText)}">${exactAspectMiniWheel(pair)}<span class="relationship-chip-label"><strong>${escapeHtml(pair.aspect.glyph || '')}</strong><span>${escapeHtml(a)} → ${escapeHtml(b)}</span><em>${escapeHtml(formatOrb(pair.aspect.orb))}</em></span></button>`;
    }).join('');
    return `<details class="relationship-chip-panel" open><summary>${escapeHtml(title)} <span>${filteredPairs.length}</span></summary><div class="relationship-chip-grid">${chips}</div></details>`;
  }
  function relationshipPairMatchesUiSelection(pair) {
    const ui = skyAspectUiState();
    const rel = ui.selectedRelationship;
    if (!rel) return false;
    const sameEndpoints = rel.sourceKind === (pair.a.kind || 'chart')
      && rel.sourceBody === (pair.a.body || '')
      && rel.targetKind === (pair.b.kind || 'chart')
      && rel.targetBody === (pair.b.body || '');
    if (!sameEndpoints) return false;
    const sameAspect = !ui.aspect || ui.aspect === (pair.aspect.name || '');
    const sameChirality = !ui.chirality || ui.chirality === 'both' || ui.chirality === (pair.aspect.chirality || 'neutral');
    return sameAspect && sameChirality;
  }
  function relationshipListRowHtml(pair, selected, labels=['Placement A','Placement B']) {
    const a = placementGlyphCluster(pair.a);
    const b = placementGlyphCluster(pair.b);
    const cls = String(pair.aspect.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const titleText = `${placementRelationshipHubTitle(pair.a, pair.a.label || labels[0])} ${pair.aspect.name} ${placementRelationshipHubTitle(pair.b, pair.b.label || labels[1])} · ${pair.aspect.chirality || 'neutral'} · orb ${formatOrb(pair.aspect.orb)}`;
    return `<button type="button" class="relationship-list-row aspect-${escapeHtml(cls)}${selected ? ' is-selected' : ''}" ${exactAspectPairDataAttributes(pair)} aria-pressed="${selected ? 'true' : 'false'}" title="${escapeHtml(titleText)}"><span class="relationship-list-points"><strong>${escapeHtml(pair.aspect.glyph || '')}</strong><span>${escapeHtml(a)}</span><span aria-hidden="true">→</span><span>${escapeHtml(b)}</span></span><span class="relationship-list-meta"><span>${escapeHtml(formatOrb(pair.aspect.orb))}</span><span>${escapeHtml(pair.aspect.chirality || 'neutral')}</span></span></button>`;
  }
  function renderRelationshipMasterDetail(filteredPairs, filters, labels=['Placement A','Placement B']) {
    if (!filteredPairs?.length) {
      return '<p class="generated-note">No exact aspects match the selected filters.</p>';
    }
    const active = activePlacementFilterNames(filters);
    const title = active.length
      ? `Relationships: ${active.map(body => relationshipBodyGlyphLabel(body)).join(', ')}`
      : 'Relationships';
    const selectedPair = filteredPairs.find(relationshipPairMatchesUiSelection) || filteredPairs[0];
    const rows = filteredPairs.map(pair => relationshipListRowHtml(pair, pair === selectedPair, labels)).join('');
    return `<section class="relationship-master-detail" aria-label="Aspect relationships"><aside class="relationship-master-list"><h4>${escapeHtml(title)} <span>${filteredPairs.length}</span></h4><div class="relationship-list-rows">${rows}</div></aside><div class="relationship-detail-panel"><div class="relationship-detail-kicker">Selected relationship</div>${exactAspectCard(selectedPair, labels[0], labels[1])}</div></section>`;
  }
  function renderExactAspectPanel(titleText, entriesA, entriesB=null, relation='internal', labels=['Placement A','Placement B']) {
    const filters = exactAspectFilters();
    const maxOrb = Math.max(0, Number(filters.orb) || 0);
    const allPairs = exactAspectPairs(entriesA, entriesB || entriesA, maxOrb, relation, filters.chirality || 'both');
    const note = relationshipModeNote(relation, labels);
    if (!allPairs.length) return `<details class="chart-comparison-drawer exact-aspect-drawer"><summary>${escapeHtml(titleText)}</summary><p class="generated-note">${escapeHtml(note)}</p>${exactAspectControlHtml([], filters)}<p class="generated-note">No exact major aspects are within ${escapeHtml(formatOrb(maxOrb))}.</p></details>`;
    const filtered = allPairs.filter(pair => exactAspectMatches(pair, filters));
    const relationships = renderRelationshipMasterDetail(filtered, filters, labels);
    return `<details class="chart-comparison-drawer exact-aspect-drawer" open><summary>${escapeHtml(titleText)}</summary><p class="generated-note">${escapeHtml(note)}</p><p class="generated-note">These relationships use the entered degrees and minutes, keep sign geometry separate from degree geometry, and sort the tightest contacts first. ${escapeHtml(aspectFilterSummary(filters))}</p>${exactAspectControlHtml(allPairs, filters)}${relationships}</details>`;
  }
  function rerenderExactAspectRoot(rootId) {
    const scrollX = window.scrollX || window.pageXOffset || 0;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    if (rootId === 'chartOutput') renderChart(); else renderCurrentSky();
    window.requestAnimationFrame(() => window.scrollTo(scrollX, scrollY));
  }
  function bindExactAspectFilters(rootId) {
    const root = $(rootId);
    if (!root) return;
    const ensureFilters = () => {
      state.transitFilters ||= {};
      const filters = state.transitFilters;
      if (!('aspect' in filters)) filters.aspect = [];
      if (!('house' in filters)) filters.house = [];
      if (!('sign' in filters)) filters.sign = [];
      if (!('placement' in filters)) filters.placement = [];
      if (!('orb' in filters)) filters.orb = '3';
      if (!('chirality' in filters)) filters.chirality = 'both';
      return filters;
    };
    const normalizeSelection = (selected, universe) => {
      const values = universe.filter(value => selected.has(value));
      if (!values.length) return ['__none'];
      if (values.length === universe.length) return [];
      return values;
    };
    const changeSelectionItem = (field, universe, value, checked) => {
      const filters = ensureFilters();
      const stateForField = relationshipFilterSelection(filters[field], universe);
      const selected = new Set(stateForField.all ? universe : stateForField.selected);
      if (stateForField.none) selected.clear();
      if (checked) selected.add(value); else selected.delete(value);
      filters[field] = normalizeSelection(selected, universe);
    };
    const setMaster = (field, mode, checked=true) => {
      const filters = ensureFilters();
      if (mode === 'none') filters[field] = checked ? ['__none'] : [];
      else filters[field] = checked ? [] : ['__none'];
    };

    qsa('[data-relationship-filter-menu]', root).forEach(menu => menu.addEventListener('toggle', () => {
      if (menu.open) {
        state.relationshipFilterOpenMenu = menu.dataset.relationshipFilterMenu || '';
        qsa('[data-relationship-filter-menu]', root).forEach(other => { if (other !== menu) other.open = false; });
      } else if (state.relationshipFilterOpenMenu === menu.dataset.relationshipFilterMenu) {
        state.relationshipFilterOpenMenu = '';
      }
    }));

    qsa('[data-exact-aspect-master]', root).forEach(control => control.addEventListener('change', () => {
      const filters = ensureFilters();
      const mode = control.dataset.exactAspectMaster;
      if (!control.checked) filters.aspect = mode === 'none' ? [] : ['__none'];
      else if (mode === 'none') filters.aspect = ['__none'];
      else if (mode === 'major') filters.aspect = EXACT_ASPECT_DEFS.filter(def => def.family === 'major').map(def => def.name);
      else if (mode === 'minor') filters.aspect = EXACT_ASPECT_DEFS.filter(def => def.family !== 'major').map(def => def.name);
      else filters.aspect = [];
      setSkyAspectUi({ selected:null, selectedRelationship:null });
      rerenderExactAspectRoot(rootId);
    }));
    qsa('[data-exact-aspect-check]', root).forEach(control => control.addEventListener('change', () => {
      changeSelectionItem('aspect', EXACT_ASPECT_DEFS.map(def => def.name), control.dataset.exactAspectCheck, control.checked);
      setSkyAspectUi({ selected:null, selectedRelationship:null });
      rerenderExactAspectRoot(rootId);
    }));

    qsa('[data-exact-placement-master]', root).forEach(control => control.addEventListener('change', () => {
      setMaster('placement', control.dataset.exactPlacementMaster, control.checked);
      setSkyAspectUi({ selected:null, selectedRelationship:null });
      rerenderExactAspectRoot(rootId);
    }));
    qsa('[data-exact-placement-group]', root).forEach(control => control.addEventListener('change', () => {
      const members = control.dataset.exactPlacementGroup === 'points' ? RELATIONSHIP_POINT_BODIES : RELATIONSHIP_PLANET_BODIES;
      const filters = ensureFilters();
      // Group controls are isolation macros. Checking Angles/Points means
      // Angles/Points only; checking Planets means Planets only.
      filters.placement = control.checked ? members.slice() : ['__none'];
      setSkyAspectUi({ selected:null, selectedRelationship:null });
      rerenderExactAspectRoot(rootId);
    }));
    qsa('[data-exact-placement-check]', root).forEach(control => control.addEventListener('change', () => {
      const universe = relationshipPlacementUniverse();
      const filters = ensureFilters();
      const currentState = relationshipPlacementFilterSelection(filters.placement);
      const selected = new Set(currentState.all ? universe : currentState.selected);
      if (currentState.none) selected.clear();
      const body = canonicalRelationshipBody(control.dataset.exactPlacementCheck);
      if (control.checked) selected.add(body); else selected.delete(body);
      filters.placement = normalizeSelection(selected, universe);
      setSkyAspectUi({ selected:null, selectedRelationship:null });
      rerenderExactAspectRoot(rootId);
    }));

    qsa('[data-exact-sign-master]', root).forEach(control => control.addEventListener('change', () => {
      setMaster('sign', control.dataset.exactSignMaster, control.checked);
      setSkyAspectUi({ selected:null, selectedRelationship:null });
      rerenderExactAspectRoot(rootId);
    }));
    qsa('[data-exact-sign-check]', root).forEach(control => control.addEventListener('change', () => {
      changeSelectionItem('sign', SIGNS, control.dataset.exactSignCheck, control.checked);
      setSkyAspectUi({ selected:null, selectedRelationship:null });
      rerenderExactAspectRoot(rootId);
    }));

    qsa('[data-exact-house-master]', root).forEach(control => control.addEventListener('change', () => {
      setMaster('house', control.dataset.exactHouseMaster, control.checked);
      setSkyAspectUi({ selected:null, selectedRelationship:null });
      rerenderExactAspectRoot(rootId);
    }));
    qsa('[data-exact-house-check]', root).forEach(control => control.addEventListener('change', () => {
      const houses = Array.from({ length:12 }, (_, index) => String(index + 1));
      changeSelectionItem('house', houses, control.dataset.exactHouseCheck, control.checked);
      setSkyAspectUi({ selected:null, selectedRelationship:null });
      rerenderExactAspectRoot(rootId);
    }));

    qsa('[data-exact-filter]', root).forEach(control => {
      control.addEventListener('change', () => {
        const filters = ensureFilters();
        filters[control.dataset.exactFilter] = control.value || (control.dataset.exactFilter === 'chirality' ? 'both' : '0');
        if (control.dataset.exactFilter === 'chirality') setSkyAspectUi({ chirality: control.value || 'both' });
        if (control.dataset.exactFilter === 'orb') setSkyAspectUi({ orb: Number(control.value) || 0 });
        rerenderExactAspectRoot(rootId);
      });
      if (control.dataset.exactFilter === 'orb') control.addEventListener('input', () => {
        const filters = ensureFilters();
        filters.orb = control.value || '0';
        setSkyAspectUi({ orb: Number(control.value) || 0 });
      });
    });
  }
  function renderAspectsBySign(chart, rising) {
    const entries = Object.entries(chart || {}).filter(([,p]) => p.sign);
    if (entries.length < 2) return '';
    const label = skyDisplayLabel('chart', 'Sky A');
    return renderExactAspectPanel(`${label} exact aspects`, entries, null, 'internal', [label,label]);
  }

  function recoverSkyFromPaste(kind) {
    const isCurrent = kind === 'currentSky';
    const box = $(isCurrent ? 'currentSkyAstroSeekPaste' : 'astroSeekPaste');
    if (!box || !String(box.value || '').trim()) return false;
    const payload = parseSkyText(box.value);
    let placements = payload.placements || {};
    if (isCurrent) {
      const currentOnly = {};
      CURRENT_BODIES.forEach(body => { if (placements[body]) currentOnly[body] = placements[body]; });
      placements = currentOnly;
    }
    if (!Object.keys(placements).length) return false;
    if (payload.name || payload.notes) writeSkyMeta(kind, payload.name, payload.notes);
    if (isCurrent) {
      state.currentSky = placements;
      writeCurrentSkyForm(placements, { skipRender:true });
    } else {
      state.chart = placements;
      writeChartForm(placements, { skipRender:true });
    }
    return true;
  }

  function lockedIngredient(ref) { return LOCKED_INGREDIENTS?.[ref] || null; }
  function lockedContribution(ref) { return lockedIngredient(ref)?.contribution || ''; }
  function lockedOperation(ref) { return lockedIngredient(ref)?.operation || ''; }
  function ingredientRefFromName(prefix, value) { return `${prefix}_${slug(value).replace(/-/g, '_')}`; }
  function ingredientPhrase(ref, fallback='') {
    const item = lockedIngredient(ref);
    if (!item) return fallback;
    return item.contribution || item.operation || fallback;
  }
  function signIngredientRef(sign) { return slug(sign).replace(/-/g, '_'); }
  function bodyIngredientRef(body) {
    const base = slug(body).replace(/-/g, '_');
    const aliases = { rising:'rising', asc:'rising', mc:'mc', node:'north_node', fortune:'part_of_fortune', vertex:'vertex', lilith:'lilith', chiron:'chiron' };
    return aliases[base] || base;
  }
  function houseIngredientRef(house) {
    const n = Number(house);
    if (!n || n < 1 || n > 12) return '';
    const words = ['one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
    return `house_${words[n-1]}`;
  }
  function aspectIngredientRef(name) { return `aspect_${slug(name).replace(/-/g, '_')}`; }
  function chiralityIngredientRef(chirality) {
    const c = String(chirality || 'neutral').toLowerCase();
    if (c === 'left') return 'chirality_left';
    if (c === 'right') return 'chirality_right';
    return 'chirality_neutral';
  }
  function elementRelationRef(a, b) { return `element_relation_${slug(a).replace(/-/g, '_')}_${slug(b).replace(/-/g, '_')}`; }
  function modalityRelationRef(a, b) { return `modality_relation_${slug(a).replace(/-/g, '_')}_${slug(b).replace(/-/g, '_')}`; }
  function exactAspectAllowedOrb() { return Math.max(0, Number(exactAspectFilters().orb) || 0); }
  function orbIntensityRef(actualOrb) {
    // Interpretive language must be stable. The user's maximum-orb filter only
    // determines inclusion and must never change the meaning of the same orb.
    const orb = Math.max(0, Number(actualOrb) || 0);
    if (orb <= (1 / 60)) return 'orb_exact';       // up to 1 arcminute
    if (orb <= 0.5) return 'orb_very_close';       // up to 30 arcminutes
    if (orb <= 1) return 'orb_close';
    if (orb <= 2) return 'orb_moderate';
    if (orb <= 3) return 'orb_wide';
    return 'orb_outside';
  }
  function placementIngredientRefs(body, p) {
    const refs = [bodyIngredientRef(body), signIngredientRef(p?.sign), houseIngredientRef(p?.house)].filter(Boolean);
    return refs.filter(ref => lockedIngredient(ref));
  }
  function relationIngredientRefs(pair, allowedOrb=null) {
    const da = SIGN_DATA[pair.a.p.sign] || {};
    const db = SIGN_DATA[pair.b.p.sign] || {};
    const refs = [
      bodyIngredientRef(pair.a.body),
      bodyIngredientRef(pair.b.body),
      aspectIngredientRef(pair.aspect.name),
      chiralityIngredientRef(pair.aspect.chirality),
      orbIntensityRef(pair.aspect.orb, allowedOrb),
      signIngredientRef(pair.a.p.sign),
      signIngredientRef(pair.b.p.sign),
      houseIngredientRef(pair.a.p.house),
      houseIngredientRef(pair.b.p.house),
      dignityRefFor(pair.a.body, pair.a.p.sign),
      dignityRefFor(pair.b.body, pair.b.p.sign),
      da.element && db.element ? elementRelationRef(da.element, db.element) : '',
      da.mode && db.mode ? modalityRelationRef(da.mode, db.mode) : ''
    ].filter(Boolean);
    return refs.filter(ref => lockedIngredient(ref));
  }
  function relationshipResonanceSentence(pair) {
    const da = SIGN_DATA[pair.a.p.sign] || {}, db = SIGN_DATA[pair.b.p.sign] || {};
    const notes = [];
    if (pair.a.p.sign && pair.a.p.sign === pair.b.p.sign) notes.push(`the same sign, ${pair.a.p.sign}`);
    if (da.element && db.element && da.element === db.element) notes.push(`the same ${da.element.toLowerCase()} element`);
    if (da.mode && db.mode && da.mode === db.mode) notes.push(`the same ${da.mode.toLowerCase()} modality`);
    if (pair.a.body && pair.a.body === pair.b.body) notes.push(`the same planetary or point function, ${pair.a.body}`);
    if (!notes.length) return '';
    return `Because the placements share ${humanJoin(notes)}, the relationship has a built-in resonance before the aspect is even interpreted.`;
  }
  function relIngredientPhrase(ref, fallback='') {
    const item = lockedIngredient(ref);
    return item?.relationship_contribution || item?.contribution || item?.operation || fallback;
  }
  function articleForWord(value) {
    return /^[aeiou]/i.test(String(value || '').trim()) ? 'an' : 'a';
  }
  function nameWithArticle(value) {
    const text = String(value || '').trim();
    return text ? `${articleForWord(text)} ${text}` : '';
  }
  function userHasTextSelection() {
    const selection = window.getSelection ? window.getSelection() : null;
    return !!selection && String(selection.toString() || '').trim().length > 0;
  }
  function phraseNoPeriod(value) {
    return String(value || '').trim().replace(/[.]+$/,'');
  }
  function sentenceCaseFragment(value) {
    const text = phraseNoPeriod(value);
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
  }
  function humanJoin(items) {
    const list = (items || []).filter(Boolean);
    if (list.length <= 1) return list.join('');
    if (list.length === 2) return `${list[0]} and ${list[1]}`;
    return `${list.slice(0, -1).join(', ')}, and ${list[list.length - 1]}`;
  }
  function relationClauseSubject(pair) {
    return `the ${String(pair?.aspect?.name || 'relationship').toLowerCase()}`;
  }
  function relationshipContextSentence(pair, leftLabel, rightLabel) {
    const relation = String(pair?.relation || 'internal').toLowerCase();
    if (relation === 'transit') return `Transit mode reads ${leftLabel} as a timed sky event moving toward ${rightLabel}.`;
    if (relation === 'progression') return `Progression mode reads ${leftLabel} as an internal developmental phase unfolding toward ${rightLabel}.`;
    if (relation === 'synastry') return `Synastry mode reads from ${leftLabel} toward ${rightLabel}; reversing direction changes the point of view, not the geometry.`;
    return `Internal mode reads both placements as one chart structure.`;
  }
  function houseNameForNumber(house) {
    const n = Number(house);
    if (!n || n < 1 || n > 12) return '';
    const name = HOUSE_NAMES?.[n - 1] || `House ${n}`;
    const topics = HOUSE_TOPIC_PLAIN?.[n - 1] || HOUSE_TOPICS?.[n - 1] || '';
    return topics ? `${name}, the field of ${phraseNoPeriod(topics)}` : name;
  }
  function houseRelationshipSentence(pair) {
    const aHouse = pair?.a?.p?.house, bHouse = pair?.b?.p?.house;
    if (!aHouse && !bHouse) return '';
    if (aHouse && bHouse && Number(aHouse) === Number(bHouse)) return `Both placements occupy ${houseNameForNumber(aHouse)}, so the relationship concentrates itself in one life field instead of spreading across separate arenas.`;
    if (aHouse && bHouse) return `In house terms, ${houseNameForNumber(aHouse)} meets ${houseNameForNumber(bHouse)}, so the aspect connects two lived arenas rather than remaining only zodiacal.`;
    if (aHouse) return `The source placement is grounded in ${houseNameForNumber(aHouse)}, giving the relationship a visible life field on that side.`;
    return `The target placement is grounded in ${houseNameForNumber(bHouse)}, giving the relationship a visible life field on that side.`;
  }
  function bodyPhrase(body, p) {
    return relIngredientPhrase(bodyIngredientRef(body), bodyGloss(body, p?.retrograde));
  }
  function signPhrase(sign) {
    return relIngredientPhrase(signIngredientRef(sign), sign || 'unknown sign');
  }
  function signAdjective(sign) {
    const map = { Aries:'Arian', Taurus:'Taurean', Gemini:'Geminian', Cancer:'Cancerian', Leo:'Leonine', Virgo:'Virgoan', Libra:'Libran', Scorpio:'Scorpionic', Sagittarius:'Sagittarian', Capricorn:'Capricornian', Aquarius:'Aquarian', Pisces:'Piscean' };
    return map[sign] || String(sign || '').trim();
  }
  function bodyRole(body) {
    const key = String(body || '').toLowerCase().replace(/\s+/g, ' ');
    const map = {
      sun: 'identity, vitality, purpose, and conscious direction',
      moon: 'feeling, memory, security, habit, and emotional need',
      mercury: 'speech, thought, exchange, translation, and linkage',
      venus: 'value, pleasure, beauty, relation, and coherence',
      mars: 'force, desire, defense, friction, and active contact',
      jupiter: 'meaning, increase, confidence, blessing, and wider permission',
      saturn: 'boundary, time, pressure, consequence, endurance, and structure',
      uranus: 'rupture, awakening, invention, liberation, and future pattern',
      neptune: 'dream, vision, surrender, enchantment, and boundary-loss',
      pluto: 'burial, compulsion, elimination, depth, and sealed pressure',
      lilith: 'refusal, exile, autonomy, and undomesticated material',
      node: 'growth, appetite, increase, and future-facing pull',
      'north node': 'growth, appetite, increase, and future-facing pull',
      'south node': 'release, inheritance, familiar pattern, and past-facing ease',
      chiron: 'injury becoming knowledge, bridge, and skill',
      vertex: 'threshold, encounter, and outside event meeting the chart',
      fortune: 'embodied fortune, flow, support, and lived circumstance',
      'part of fortune': 'embodied fortune, flow, support, and lived circumstance',
      asc: 'embodiment, first contact, and the way life is entered',
      ascendant: 'embodiment, first contact, and the way life is entered',
      rising: 'embodiment, first contact, and the way life is entered',
      dsc: 'encounter, counterpart, and the relational horizon',
      descendant: 'encounter, counterpart, and the relational horizon',
      mc: 'vocation, visibility, responsibility, and worldly direction',
      midheaven: 'vocation, visibility, responsibility, and worldly direction',
      ic: 'root, private foundation, home, and the inward base of the chart'
    };
    return map[key] || phraseNoPeriod(bodyPhrase(body, {})) || String(body || 'the source function');
  }
  function bodyRoleNoun(body) {
    const role = bodyRole(body);
    return role ? `${body}'s ${role}` : String(body || 'the planetary function');
  }
  function bodyCoreNoun(body) {
    const key = String(body || '').toLowerCase().replace(/\s+/g, ' ');
    const map = {
      sun: 'identity', moon: 'feeling', mercury: 'mind', venus: 'relation', mars: 'force', jupiter: 'meaning', saturn: 'structure', uranus: 'liberation', neptune: 'dream', pluto: 'depth', lilith: 'refusal', node: 'growth', 'north node': 'growth', 'south node': 'release', chiron: 'wound-wisdom', vertex: 'threshold', fortune: 'fortune', 'part of fortune': 'fortune', rising: 'embodiment', asc: 'embodiment', ascendant: 'embodiment', mc: 'vocation', midheaven: 'vocation', ic: 'root', dsc: 'encounter', descendant: 'encounter'
    };
    return map[key] || String(body || 'function').toLowerCase();
  }
  function sameSignContextSentence(pair) {
    const sign = pair?.a?.p?.sign;
    if (!sign || sign !== pair?.b?.p?.sign) return '';
    const signRuler = SIGN_DATA[sign]?.ruler || '';
    const aRole = bodyCoreNoun(pair.a.body);
    const bRole = bodyCoreNoun(pair.b.body);
    const decanA = decanCardFor(pair.a.p.sign, pair.a.p.degree);
    const decanB = decanCardFor(pair.b.p.sign, pair.b.p.degree);
    const sameDecan = decanA && decanB && decanA.card_id === decanB.card_id;
    if (sameDecan) {
      const ruler = faceLord(decanA) || decanA.astrology?.planet || '';
      return `This joins ${aRole} and ${bRole} in the same ${ruler ? `${ruler}-ruled ` : ''}${title(decanA)} decan of the ${signRuler ? `${signRuler}-ruled ` : ''}sign of ${sign}.`;
    }
    return `This joins ${aRole} and ${bRole} in the same ${signRuler ? `${signRuler}-ruled ` : ''}sign of ${sign}.`;
  }
  function aspectContactSentence(pair, sameSign=false, sameDecan=false) {
    const aspect = String(pair?.aspect?.name || 'contact').toLowerCase();
    const quality = aspectAdjectivalPhrase(aspect);
    if (sameSign && !sameDecan) return `The ${aspect} brings them into contact; the shared sign gives the exchange a common style.`;
    return `The contact is ${quality}.`;
  }
  function statusVerb(status) {
    return status === 'domicile' ? 'speaks directly through' : status === 'exaltation' ? 'is strengthened and dignified by' : status === 'detriment' ? 'has to work against the grain of' : status === 'fall' ? 'is humbled and complicated by' : 'is colored by';
  }
  function statusNoun(status) {
    return status === 'domicile' ? 'domicile' : status === 'exaltation' ? 'exaltation' : status === 'detriment' ? 'detriment' : status === 'fall' ? 'fall' : status || '';
  }
  function bodyRelationshipSentence(pair) {
    const aBody = pair.a.body || 'source';
    const bBody = pair.b.body || 'target';
    if (aBody === bBody) {
      return `Both sides are working through ${bodyRole(aBody)}, so the relationship concentrates one function and shows how it changes when carried by two different placements.`;
    }
    return `${aBody} and ${bBody} are working in direct relationship here.`;
  }
  function aspectNaturalSentence(pair) {
    const aspect = lockedIngredient(aspectIngredientRef(pair.aspect.name));
    const aspectName = String(pair.aspect.name || 'relationship').toLowerCase();
    if (!aspect?.contribution) return '';
    return `As ${nameWithArticle(aspectName)}, the contact ${phraseNoPeriod(aspect.contribution)}.`;
  }
  function elementNaturalSentence(pair) {
    const da = SIGN_DATA[pair.a.p.sign] || {}, db = SIGN_DATA[pair.b.p.sign] || {};
    const item = lockedIngredient(da.element && db.element ? elementRelationRef(da.element, db.element) : '');
    if (!item?.contribution) return '';
    if (da.element && db.element && da.element === db.element) {
      return `Because both signs are ${da.element.toLowerCase()}, ${relationClauseSubject(pair)} moves through a shared elemental substance: ${phraseNoPeriod(item.contribution)}.`;
    }
    return `Elementally, ${relationClauseSubject(pair)} ${phraseNoPeriod(item.contribution)}.`;
  }
  function modalityNaturalSentence(pair) {
    const da = SIGN_DATA[pair.a.p.sign] || {}, db = SIGN_DATA[pair.b.p.sign] || {};
    const item = lockedIngredient(da.mode && db.mode ? modalityRelationRef(da.mode, db.mode) : '');
    if (!item?.contribution) return '';
    if (da.mode && db.mode && da.mode === db.mode) {
      return `Because both signs are ${da.mode.toLowerCase()}, ${relationClauseSubject(pair)} repeats the same strategy of action: ${phraseNoPeriod(item.contribution)}.`;
    }
    return `By mode of action, ${relationClauseSubject(pair)} ${phraseNoPeriod(item.contribution)}.`;
  }
  function rulershipSentence(pair) {
    const da = SIGN_DATA[pair.a.p.sign] || {}, db = SIGN_DATA[pair.b.p.sign] || {};
    const ar = da.ruler || '', br = db.ruler || '';
    if (!ar && !br) return '';
    if (ar && br && ar === br) return `Both signs answer to ${ar}, so one planetary ruler keeps returning on both sides.`;
    if (ar && br) return `${pair.a.p.sign} answers to ${ar}, while ${pair.b.p.sign} answers to ${br}; the relationship therefore has to translate between two ruling logics.`;
    return ar ? `${pair.a.p.sign} answers to ${ar}.` : `${pair.b.p.sign} answers to ${br}.`;
  }
  function decanRulerRelationshipSentence(pair, leftLabel, rightLabel) {
    const ai = decanRulerInfo(pair.a.p.sign, pair.a.p.degree);
    const bi = decanRulerInfo(pair.b.p.sign, pair.b.p.degree);
    if (!ai.ruler && !bi.ruler) return '';
    if (ai.ruler && bi.ruler && ai.ruler === bi.ruler) return `The decans repeat ${ai.ruler}, so the undertone reinforces the same ruler instead of adding a new one.`;
    if (ai.ruler && bi.ruler) return `At the decan level, ${ai.ruler} meets ${bi.ruler}, adding a quieter second layer beneath the sign rulers.`;
    if (ai.ruler) return `${leftLabel}'s decan is ${ai.ruler}-ruled.`;
    return `${rightLabel}'s decan is ${bi.ruler}-ruled.`;
  }
  function signConditionNatural(sign, skipBodies=[]) {
    const data = SIGN_DATA[sign] || {};
    const skip = new Set((skipBodies || []).map(x => String(x || '').toLowerCase()));
    const parts = [];
    if (data.exaltation && !skip.has(String(data.exaltation).toLowerCase())) parts.push(`gives extra dignity to ${data.exaltation}'s ${bodyRole(data.exaltation)}`);
    const detriment = data.detriment && !skip.has(String(data.detriment).toLowerCase()) ? data.detriment : '';
    const fall = data.fall && !skip.has(String(data.fall).toLowerCase()) ? data.fall : '';
    if (detriment && fall && detriment === fall) parts.push(`makes ${detriment}'s ${bodyRole(detriment)} less direct, asking it to soften certainty and move by intuition rather than clean separation`);
    else {
      if (detriment) parts.push(`asks ${detriment}'s ${bodyRole(detriment)} to work through conditions that do not naturally center it`);
      if (fall) parts.push(`complicates ${fall}'s ${bodyRole(fall)}, lowering its usual directness into a more conditional expression`);
    }
    if (!parts.length) return '';
    return `${sign} also ${humanJoin(parts)}.`;
  }
  function signConditionPairSentence(pair) {
    const seen = new Set();
    const skipA = [pair.a.body, (SIGN_DATA[pair.a.p.sign] || {}).ruler].filter(Boolean);
    const skipB = [pair.b.body, (SIGN_DATA[pair.b.p.sign] || {}).ruler].filter(Boolean);
    const bits = [];
    [[pair.a.p.sign, skipA], [pair.b.p.sign, skipB]].forEach(([sign, skip]) => {
      if (!sign || seen.has(sign)) return;
      seen.add(sign);
      const sentence = signConditionNatural(sign, skip);
      if (sentence) bits.push(sentence);
    });
    return bits.join(' ');
  }
  function dignityInteractionSentence(pair, leftLabel='Source', rightLabel='Target') {
    const rows = [
      { label:leftLabel, body:pair.a.body, sign:pair.a.p.sign },
      { label:rightLabel, body:pair.b.body, sign:pair.b.p.sign }
    ];
    const bits = rows.map(row => {
      const status = dignityStatus(row.body, row.sign);
      if (!status) return '';
      if (status === 'domicile') return `${row.label}'s ${row.body} is at home in ${row.sign}, so its ${bodyRole(row.body)} can speak directly through the sign.`;
      if (status === 'exaltation') return `${row.label}'s ${row.body} is lifted by ${row.sign}, so its ${bodyRole(row.body)} gains emphasis, dignity, and ceremonial strength.`;
      if (status === 'detriment') return `${row.label}'s ${row.body} moves through ${row.sign} against the grain, so its ${bodyRole(row.body)} has to translate itself before it can act cleanly.`;
      if (status === 'fall') return `${row.label}'s ${row.body} is humbled by ${row.sign}, so its ${bodyRole(row.body)} becomes less straightforward and more dependent on context.`;
      return '';
    }).filter(Boolean);
    return bits.join(' ');
  }
  function cardRelationshipSentence(pair) {
    const cardA = decanCardFor(pair.a.p.sign, pair.a.p.degree) || cardBySignMajor(pair.a.p.sign);
    const cardB = decanCardFor(pair.b.p.sign, pair.b.p.degree) || cardBySignMajor(pair.b.p.sign);
    if (!cardA && !cardB) return '';
    if (cardA && cardB && cardA.card_id === cardB.card_id) return `Shared card: ${title(cardA)}.`;
    const parts = [];
    if (cardA) parts.push(`${title(cardA)} carries ${cardBrief(cardA)}`);
    if (cardB) parts.push(`${title(cardB)} carries ${cardBrief(cardB)}`);
    let bridge = parts.length ? `${parts.join(', while ')}.` : '';
    if (cardA && cardB) {
      if (cardA.rank && cardA.rank === cardB.rank) bridge += ` Both cards share the ${cardA.rank} principle, so the number remains stable while the sign and suit expression changes.`;
      else if (cardA.suit && cardA.suit === cardB.suit) bridge += ` Both cards belong to ${suitDisplay(cardA)}, so they share an elemental family while changing rank or decan expression.`;
      else if (cardA.astrology?.planet && cardA.astrology.planet === cardB.astrology?.planet) bridge += ` Both cards are carried by ${cardA.astrology.planet}, so the same planetary thread appears on each side.`;
    }
    return bridge;
  }
  function cardBrief(card) {
    if (!card) return 'no card correspondence';
    const rank = card.rank ? `${card.rank}'s ${rankContributionText(card.rank)}` : '';
    const suit = card.suit ? `${suitDisplay(card)}'s ${card.element ? card.element.toLowerCase() : 'elemental'} field` : '';
    const planet = card.astrology?.planet ? `${card.astrology.planet}'s ${bodyRole(card.astrology.planet)}` : '';
    const sign = card.astrology?.sign ? `${card.astrology.sign}'s ${phraseNoPeriod(signPhrase(card.astrology.sign)).replace(/^the\s+/i,'')}` : '';
    return humanJoin([rank, suit, planet, sign].filter(Boolean));
  }
  function rankContributionText(rank) {
    const map = {
      Ace: 'origin and undivided beginning',
      One: 'origin and undivided beginning',
      Two: 'polarity and first relation',
      Three: 'growth, triangulation, and first stable pattern',
      Four: 'stability, container, and inhabitable form',
      Five: 'disturbance, pressure, and disruption',
      Six: 'coordination, balance, and restored relation',
      Seven: 'test, threshold, defense, and asymmetry',
      Eight: 'motion through system, rhythm, and repetition',
      Nine: 'concentration, culmination, and inner reserve',
      Ten: 'completion, totalization, and consequence',
      Page: 'first embodiment, message, and learning body',
      Princess: 'first embodiment, message, and learning body',
      Knight: 'outward charge, mastery, and visible force',
      Prince: 'directed motion, quest, and pursuit',
      Queen: 'reception, maturity, and inward power',
      King: 'visible command and outward administration'
    };
    return map[rank] || String(rank || 'card');
  }
  function chiralityNaturalSentence(pair) {
    const chirality = lockedIngredient(chiralityIngredientRef(pair.aspect.chirality));
    if (!chirality?.contribution) return '';
    const side = String(pair.aspect.chirality || 'neutral').toLowerCase();
    if (side === 'neutral') return `Here the geometry is neutral: ${phraseNoPeriod(chirality.contribution)}.`;
    return `Geometrically, the contact uses the ${side}-hand branch from the selected source point, so ${phraseNoPeriod(chirality.contribution)}.`;
  }
  function orbNaturalSentence(pair, allowedOrb) {
    const orb = lockedIngredient(orbIntensityRef(pair.aspect.orb, allowedOrb));
    if (!orb?.contribution) return '';
    return `With ${String(orb.name || 'this orb').toLowerCase()}, the contact ${phraseNoPeriod(orb.contribution)}.`;
  }
  function synthesisSentence(pair, leftLabel, rightLabel) {
    const aspectName = String(pair.aspect.name || 'relationship').toLowerCase();
    const da = SIGN_DATA[pair.a.p.sign] || {}, db = SIGN_DATA[pair.b.p.sign] || {};
    const shared = [];
    if (pair.a.p.sign && pair.a.p.sign === pair.b.p.sign) shared.push(`the same ${pair.a.p.sign} sign field`);
    if (da.element && db.element && da.element === db.element) shared.push(`${da.element.toLowerCase()} substance`);
    if (da.mode && db.mode && da.mode === db.mode) shared.push(`${da.mode.toLowerCase()} action`);
    if (pair.a.body && pair.a.body === pair.b.body) shared.push(`the same ${pair.a.body} function`);
    const sharedClause = shared.length ? ` Because ${humanJoin(shared)} is shared, the relationship has coherence before interpretation is added.` : '';
    const aspectTone = aspectAdjectivalPhrase(pair.aspect.name);
    const aSign = pair.a.p.sign || 'its sign';
    const bSign = pair.b.p.sign || 'its sign';
    return `Taken together, ${leftLabel}'s ${pair.a.body} carries ${bodyRole(pair.a.body)} through ${aSign}, and ${rightLabel}'s ${pair.b.body} carries ${bodyRole(pair.b.body)} through ${bSign}; the ${aspectName} lets those two streams meet as ${aspectTone} contact rather than isolated placements.${sharedClause}`;
  }
  function dignityStatus(body, sign) {
    const data = SIGN_DATA[sign] || {};
    const b = String(body || '');
    if (!b || !sign) return '';
    if (data.ruler === b) return 'domicile';
    if (data.exaltation === b) return 'exaltation';
    if (data.detriment === b) return 'detriment';
    if (data.fall === b) return 'fall';
    return '';
  }
  function dignityRefFor(body, sign) {
    const status = dignityStatus(body, sign);
    return status ? `dignity_${status}` : '';
  }
  function dignitySentence(label, body, sign) {
    const status = dignityStatus(body, sign);
    const item = lockedIngredient(status ? `dignity_${status}` : '');
    if (!status || !item) return '';
    const prefix = status === 'domicile' ? 'in domicile' : status === 'exaltation' ? 'exalted' : `in ${status}`;
    return `${label}'s ${body} is ${prefix} in ${sign}, so ${item.contribution}.`;
  }
  function signConditionSentence(sign) {
    const data = SIGN_DATA[sign] || {};
    const bits = [];
    if (data.ruler) bits.push(`${sign} is ruled by ${data.ruler}`);
    if (data.exaltation) bits.push(`${data.exaltation} is exalted in ${sign}`);
    if (data.detriment) bits.push(`${data.detriment} is in detriment in ${sign}`);
    if (data.fall) bits.push(`${data.fall} is in fall in ${sign}`);
    return bits.length ? `${bits.join('; ')}.` : '';
  }
  function decanRulerInfo(sign, degree) {
    const card = decanCardFor(sign, degree);
    const ruler = card?.astrology?.planet || card?.astrology?.decan_ruler || '';
    return { card, ruler, dignity: ruler ? dignityStatus(ruler, sign) : '' };
  }
  function decanRulerSentence(label, body, p) {
    const info = decanRulerInfo(p?.sign, p?.degree);
    if (!info.ruler) return '';
    const dignity = info.dignity ? `; ${info.ruler} is ${info.dignity === 'exaltation' ? 'exalted' : 'in ' + info.dignity} in ${p.sign}` : '';
    return `${label}'s ${body} falls in the ${info.ruler}-ruled decan of ${p.sign}${dignity}.`;
  }
  function aspectMeasurementPhrase(pair, allowedOrb) {
    const signAspect = aspectBySign(pair.a.p.sign, pair.b.p.sign);
    const aspectName = String(pair.aspect.name || '').toLowerCase();
    const degreeText = pair.aspect?.orb == null ? '' : `The degree orb is ${formatOrb(pair.aspect.orb)}.`;
    if (signAspect && signAspect === aspectName) return `The signs and the degrees agree: this is ${nameWithArticle(aspectName)} by sign, and the specific placements also form ${nameWithArticle(aspectName)} within the chosen orb. ${degreeText}`;
    if (signAspect) return `The sign relationship and degree relationship differ: ${pair.a.p.sign} and ${pair.b.p.sign} are ${nameWithArticle(signAspect)} by sign, while these exact degrees create ${nameWithArticle(aspectName)} within the chosen orb. ${degreeText}`;
    return degreeText;
  }
  function compactPlacementName(label, body, p) {
    const deg = p?.degree == null || Number.isNaN(Number(p.degree)) ? '' : ` ${Number(p.degree)}°${p.minute != null && !Number.isNaN(Number(p.minute)) ? String(Number(p.minute)).padStart(2,'0') + '′' : ''}`;
    return `${label}'s ${body}${p?.sign ? ` in ${p.sign}` : ''}${deg}`;
  }
  function aspectAdjectivalPhrase(name) {
    const key = String(name || '').toLowerCase();
    const map = {
      conjunction: 'fused, identity-making',
      opposition: 'polarized, mirroring',
      trine: 'flowing, supportive, low-resistance',
      square: 'active, pressurized, challenging',
      sextile: 'available, cooperative, opportunity-opening',
      quincunx: 'adjusting, misaligned, recalibrating',
      semisextile: 'adjacent, subtle, transitional',
      semisquare: 'irritating, frictional, activating',
      sesquisquare: 'pressurized, reactive, crisis-shaping',
      quintile: 'creative, pattern-making',
      biquintile: 'creative, specialized, pattern-linking'
    };
    return map[key] || `${name || 'relationship'}`;
  }
  function compactElementModeSentence(pair) {
    const da = SIGN_DATA[pair.a.p.sign] || {}, db = SIGN_DATA[pair.b.p.sign] || {};
    if (pair.a.p.sign && pair.a.p.sign === pair.b.p.sign) {
      const bits = [da.element ? `${da.element.toLowerCase()} substance` : '', da.mode ? `${da.mode.toLowerCase()} action` : ''].filter(Boolean);
      return bits.length ? `Because both placements share ${pair.a.p.sign}, they move through the same ${humanJoin(bits)}.` : '';
    }
    const bits = [];
    if (da.element && db.element) bits.push(da.element === db.element ? `shared ${da.element.toLowerCase()} substance` : `${da.element.toLowerCase()} substance meeting ${db.element.toLowerCase()} substance`);
    if (da.mode && db.mode) bits.push(da.mode === db.mode ? `shared ${da.mode.toLowerCase()} action` : `${da.mode.toLowerCase()} action meeting ${db.mode.toLowerCase()} action`);
    return bits.length ? `Element and modality keep the contact grounded: ${humanJoin(bits)}.` : '';
  }
  function compactCardRelationshipSentence(pair) {
    const cardA = decanCardFor(pair.a.p.sign, pair.a.p.degree) || cardBySignMajor(pair.a.p.sign);
    const cardB = decanCardFor(pair.b.p.sign, pair.b.p.degree) || cardBySignMajor(pair.b.p.sign);
    if (!cardA && !cardB) return '';
    if (cardA && cardB && cardA.card_id === cardB.card_id) return `Both sides point through ${title(cardA)}, so the same card image appears on both sides.`;
    if (cardA && cardB) return `${title(cardA)} sits beside ${title(cardB)}, giving the relationship a visual contrast to study.`;
    return `${(cardA || cardB) ? title(cardA || cardB) : 'The card correspondence'} gives the contact a visual anchor.`;
  }
  function compactDignitySentence(pair, leftLabel='Source', rightLabel='Target') {
    const parts = [
      { label:leftLabel, body:pair.a.body, sign:pair.a.p.sign },
      { label:rightLabel, body:pair.b.body, sign:pair.b.p.sign }
    ].map(row => {
      const status = dignityStatus(row.body, row.sign);
      if (!status) return '';
      if (status === 'domicile') return `${row.label}'s ${row.body} is at home in ${row.sign}`;
      if (status === 'exaltation') return `${row.label}'s ${row.body} is dignified in ${row.sign}`;
      if (status === 'detriment') return `${row.label}'s ${row.body} works against the grain in ${row.sign}`;
      if (status === 'fall') return `${row.label}'s ${row.body} is humbled in ${row.sign}`;
      return '';
    }).filter(Boolean);
    return parts.length ? `Essential dignity adds a condition: ${humanJoin(parts)}.` : '';
  }
  function compactGeometrySentence(pair, allowedOrb) {
    const signAspect = aspectBySign(pair.a.p.sign, pair.b.p.sign);
    const aspectName = String(pair.aspect.name || '').toLowerCase();
    const pieces = [];
    if (signAspect && signAspect !== aspectName) pieces.push(`by sign, ${pair.a.p.sign} and ${pair.b.p.sign} form ${nameWithArticle(signAspect)}`);
    if (signAspect && signAspect === aspectName) pieces.push(`the sign relationship and degree relationship agree`);
    pieces.push(`the degree orb is ${formatOrb(pair.aspect.orb)}`);
    const orb = lockedIngredient(orbIntensityRef(pair.aspect.orb, allowedOrb));
    if (orb?.name) pieces.push(`the contact is ${String(orb.name).toLowerCase()}`);
    return `Geometrically, ${humanJoin(pieces)}.`;
  }
  function compactBranchSentence(pair) {
    const side = String(pair.aspect.chirality || 'neutral').toLowerCase();
    if (!side || side === 'neutral') return '';
    return `The ${side}-hand branch shows which geometric path is active.`;
  }
  function compactSynthesisSentence(pair, leftLabel, rightLabel) {
    const aspectName = String(pair.aspect.name || 'relationship').toLowerCase();
    const sharedSign = pair.a.p.sign && pair.a.p.sign === pair.b.p.sign ? ` inside the shared field of ${pair.a.p.sign}` : '';
    return `Taken together, ${compactPlacementName(leftLabel, pair.a.body, pair.a.p)} and ${compactPlacementName(rightLabel, pair.b.body, pair.b.p)} meet through ${nameWithArticle(aspectName)}${sharedSign}.`;
  }
  function buildLockedRelationshipInterpretation(pair, leftLabel='Placement A', rightLabel='Placement B') {
    const allowedOrb = exactAspectAllowedOrb();
    const aName = compactPlacementName(leftLabel, pair.a.body, pair.a.p);
    const bName = compactPlacementName(rightLabel, pair.b.body, pair.b.p);
    const chiralityText = pair.aspect.chirality && pair.aspect.chirality !== 'neutral' ? `${pair.aspect.chirality}-hand ` : '';
    const aspectPhrase = aspectAdjectivalPhrase(pair.aspect.name);
    const aspectName = String(pair.aspect.name || 'relationship').toLowerCase();
    const bodyA = phraseNoPeriod(bodyPhrase(pair.a.body, pair.a.p));
    const bodyB = phraseNoPeriod(bodyPhrase(pair.b.body, pair.b.p));
    const signA = phraseNoPeriod(signPhrase(pair.a.p.sign));
    const signB = phraseNoPeriod(signPhrase(pair.b.p.sign));
    const lines = [];
    lines.push(relationshipContextSentence(pair, leftLabel, rightLabel));
    if (pair.a.p.sign && pair.a.p.sign === pair.b.p.sign) {
      lines.push(`${aName}, ${bodyA}, and ${bName}, ${bodyB}, both stand in ${signA}. Their ${aspectName} is ${aspectPhrase} contact inside one sign field.`);
    } else {
      lines.push(`${aName}, ${bodyA}, stands in ${signA}. It forms ${nameWithArticle(aspectPhrase)} ${chiralityText}${aspectName} with ${bName}, ${bodyB}, rooted in ${signB}.`);
    }
    [
      compactElementModeSentence(pair),
      rulershipSentence(pair),
      compactDignitySentence(pair, leftLabel, rightLabel),
      decanRulerRelationshipSentence(pair, leftLabel, rightLabel),
      compactCardRelationshipSentence(pair),
      compactBranchSentence(pair),
      compactGeometrySentence(pair, allowedOrb),
      compactSynthesisSentence(pair, leftLabel, rightLabel)
    ].filter(Boolean).forEach(line => lines.push(line));
    const seen = new Set();
    const deduped = lines.filter(line => {
      const key = phraseNoPeriod(line).toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return cleanSentence(deduped.join(' '));
  }
  function relationshipFormulaListHtml(pair) {
    const refs = relationIngredientRefs(pair, exactAspectAllowedOrb());
    if (!refs.length) return '';
    const labels = refs.map(ref => lockedIngredient(ref)?.name).filter(Boolean);
    return `<p class="generated-note relationship-formula"><strong>Ingredients:</strong> ${escapeHtml(labels.join(' + '))}</p>`;
  }
  function relationshipIngredientsDetailsHtml(pair) {
    // Derivation detail is already covered by the active “Explore the pieces” chips.
    // Keep this function inert so the old inactive details panel cannot appear.
    return '';
  }
  function skyAspectUiState() {
    const ui = state.skyAspectUi || {};
    return {
      showA: ui.showA !== false,
      showB: ui.showB !== false,
      mode: ui.mode || 'aa',
      aspect: ui.aspect || 'conjunction',
      chirality: ui.chirality || 'both',
      orb: ui.orb == null ? Number(exactAspectFilters().orb || 3) || 3 : Number(ui.orb) || 0,
      selected: ui.selected || null,
      selectedRelationship: ui.selectedRelationship || null
    };
  }
  function setSkyAspectUi(patch) { state.skyAspectUi = { ...skyAspectUiState(), ...patch }; }
  function skyEntries(kind) {
    const isCurrent = kind === 'currentSky';
    const label = skyDisplayLabel(kind, isCurrent ? 'Sky B' : 'Sky A');
    return Object.entries(isCurrent ? (state.currentSky || {}) : (state.chart || {}))
      .filter(([,p]) => p?.sign && placementLongitude(p) != null)
      .map(([body,p]) => [body, p, { kind, label }]);
  }
  function skyAspectModeEntries(mode) {
    const a = skyEntries('chart');
    const b = skyEntries('currentSky');
    const aLabel = skyDisplayLabel('chart', 'Sky A');
    const bLabel = skyDisplayLabel('currentSky', 'Sky B');
    if (mode === 'bb') return { entriesA:b, entriesB:null, relation:'internal', labels:[bLabel,bLabel], title:`${bLabel} internal` };
    if (mode === 'ba') return { entriesA:b, entriesB:a, relation:'synastry', labels:[bLabel,aLabel], title:`Synastry: ${bLabel} to ${aLabel}` };
    if (mode === 'transit') return { entriesA:b, entriesB:a, relation:'transit', labels:[bLabel,aLabel], title:`Transit: ${bLabel} to ${aLabel}` };
    if (mode === 'progression') return { entriesA:b, entriesB:a, relation:'progression', labels:[bLabel,aLabel], title:`Progression: ${bLabel} to ${aLabel}` };
    if (mode === 'ab') return { entriesA:a, entriesB:b, relation:skyChartMode()==='compare'?'compare':'synastry', labels:[aLabel,bLabel], title:`${skyRelationshipTitle()}: ${aLabel} to ${bLabel}` };
    return { entriesA:a, entriesB:null, relation:'internal', labels:[aLabel,aLabel], title:`${aLabel} internal` };
  }
  function signDegreeLabel(longitude) {
    const lon = normDeg(longitude);
    const sign = SIGNS[Math.floor(lon / 30)] || 'Aries';
    const within = lon % 30;
    const degree = Math.floor(within);
    const minute = Math.round((within - degree) * 60);
    return `${sign} ${degree}°${String(minute).padStart(2,'0')}′`;
  }

  const SKY_CALC_BODIES = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
  function longitudeToPlacement(longitude, minuteStyle = 'nearest') {
    const lon = normDeg(longitude);
    const signIndex = Math.floor(lon / 30);
    const sign = SIGNS[signIndex] || 'Aries';
    const within = lon - signIndex * 30;
    let degree = Math.floor(within);
    const rawMinute = (within - degree) * 60;
    // Planet tables in the user's canonical chart show completed arcminutes
    // rather than rounding a partial minute upward. Angles keep nearest-minute
    // labels because their displayed value is coordinate-sensitive.
    let minute = minuteStyle === 'completed'
      ? Math.floor(rawMinute + 1e-9)
      : Math.round(rawMinute);
    if (minute >= 60) { minute = 0; degree += 1; }
    if (degree >= 30) { degree = 0; }
    return { sign, degree, minute, longitude: Number(lon.toFixed(6)) };
  }
  function zodiacSignedDelta(fromLongitude, toLongitude) {
    return ((normDeg(toLongitude) - normDeg(fromLongitude) + 540) % 360) - 180;
  }
  function astronomyBodyForName(body) {
    const A = window.Astronomy;
    return A?.Body?.[body] || body;
  }
  function astronomyLongitude(body, date) {
    const A = window.Astronomy;
    if (!A) throw new Error('Astronomy Engine is not loaded.');
    const astroBody = astronomyBodyForName(body);
    if (body === 'Moon' && typeof A.EclipticGeoMoon === 'function') return normDeg(A.EclipticGeoMoon(date).lon);
    // Use apparent geocentric ecliptic longitude for every planet.
    // Astronomy.EclipticLongitude is heliocentric for planets and is not suitable for natal/transit chart placement.
    const vec = A.GeoVector(astroBody, date, true);
    return normDeg(A.Ecliptic(vec).elon);
  }
  function calculatedMotionForBody(body, date) {
    const sampleHours = body === 'Moon' ? 6 : 24;
    const before = new Date(date.getTime() - sampleHours * 60 * 60 * 1000);
    const after = new Date(date.getTime() + sampleHours * 60 * 60 * 1000);
    const lonBefore = astronomyLongitude(body, before);
    const lonAfter = astronomyLongitude(body, after);
    const delta = zodiacSignedDelta(lonBefore, lonAfter);
    const speed = delta / ((sampleHours * 2) / 24);
    const stationThreshold = body === 'Moon' ? 0.05 : 0.03;
    return {
      retrograde: speed < -stationThreshold,
      station: Math.abs(speed) <= stationThreshold,
      motionSpeedDegPerDay: Number(speed.toFixed(4)),
      motionSource: 'Astronomy Engine',
      sampleHours
    };
  }
  function localSiderealDegrees(date, longitude) {
    const A = window.Astronomy;
    if (!A || typeof A.SiderealTime !== 'function') throw new Error('Astronomy Engine sidereal time is not available.');
    return normDeg(A.SiderealTime(date) * 15 + Number(longitude || 0));
  }
  function trueObliquityDegrees(date) {
    const A = window.Astronomy;
    if (!A || typeof A.e_tilt !== 'function') throw new Error('Astronomy Engine obliquity data is not available.');
    return Number(A.e_tilt(date).tobl);
  }
  function ascendantLongitude(date, latitude, longitude) {
    const theta = localSiderealDegrees(date, longitude) * Math.PI / 180;
    const phi = Number(latitude) * Math.PI / 180;
    const eps = trueObliquityDegrees(date) * Math.PI / 180;
    return normDeg(Math.atan2(-Math.cos(theta), Math.sin(theta) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)) * 180 / Math.PI + 180);
  }
  function midheavenLongitude(date, longitude) {
    const theta = localSiderealDegrees(date, longitude) * Math.PI / 180;
    const eps = trueObliquityDegrees(date) * Math.PI / 180;
    return normDeg(Math.atan2(Math.sin(theta), Math.cos(theta) * Math.cos(eps)) * 180 / Math.PI);
  }
  function wholeSignHouseNumber(risingSign, sign) {
    if (!risingSign || !sign) return null;
    const risingIndex = SIGNS.indexOf(risingSign);
    const signIndex = SIGNS.indexOf(sign);
    if (risingIndex < 0 || signIndex < 0) return null;
    return ((signIndex - risingIndex + 12) % 12) + 1;
  }
  function normalizeSkyHouseSystem(system) {
    if (window.RelphiHouseSystems?.normalizeSystem) return window.RelphiHouseSystems.normalizeSystem(system);
    const s = String(system || 'whole-sign').trim().toLowerCase().replace(/\s+/g, '-');
    if (/^whole/.test(s)) return 'whole-sign';
    if (/^equal/.test(s)) return 'equal-house';
    if (/porphyry/.test(s)) return 'porphyry';
    if (/placidus/.test(s)) return 'placidus';
    if (/alc?habitius|alcabitius/.test(s)) return 'alcabitius';
    if (/regio/.test(s)) return 'regiomontanus';
    if (/campanus/.test(s)) return 'campanus';
    if (/koch/.test(s)) return 'koch';
    return 'whole-sign';
  }
  function skyHouseSystemLabel(system) {
    const key = normalizeSkyHouseSystem(system);
    return window.RelphiHouseSystems?.label ? window.RelphiHouseSystems.label(key) : ({ 'whole-sign':'Whole Sign', 'equal-house':'Equal House', porphyry:'Porphyry', placidus:'Placidus', alcabitius:'Alcabitius', regiomontanus:'Regiomontanus', campanus:'Campanus', koch:'Koch' })[key] || 'Whole Sign';
  }
  function forwardArc(from, to) { return (normDeg(to) - normDeg(from) + 360) % 360; }
  function interpZodiac(from, to, fraction) { return normDeg(normDeg(from) + forwardArc(from, to) * fraction); }
  function computedHouseCusps(placements, houseSystem = 'whole-sign') {
    const rising = placements?.Rising;
    const mc = placements?.MC;
    const asc = Number(rising?.longitude);
    const mcLon = Number(mc?.longitude);
    const system = normalizeSkyHouseSystem(houseSystem);
    if (!Number.isFinite(asc)) return [];
    if (window.RelphiHouseSystems?.calculateCusps) {
      const ctx = placements?._houseContext || {};
      const result = window.RelphiHouseSystems.calculateCusps({
        system,
        ascendant: asc,
        midheaven: mcLon,
        latitude: ctx.latitude,
        longitude: ctx.longitude,
        siderealDegrees: ctx.siderealDegrees,
        obliquityDegrees: ctx.obliquityDegrees
      });
      placements._houseCalculation = result;
      return result.cusps || [];
    }
    if (system === 'whole-sign') {
      const start = Math.max(0, SIGNS.indexOf(rising?.sign || 'Aries')) * 30;
      return Array.from({ length:12 }, (_, i) => normDeg(start + i * 30));
    }
    if (system === 'equal-house' || !Number.isFinite(mcLon)) return Array.from({ length:12 }, (_, i) => normDeg(asc + i * 30));
    const dsc = normDeg(asc + 180);
    const ic = normDeg(mcLon + 180);
    return [
      asc,
      interpZodiac(asc, ic, 1/3),
      interpZodiac(asc, ic, 2/3),
      ic,
      interpZodiac(ic, dsc, 1/3),
      interpZodiac(ic, dsc, 2/3),
      dsc,
      interpZodiac(dsc, mcLon, 1/3),
      interpZodiac(dsc, mcLon, 2/3),
      mcLon,
      interpZodiac(mcLon, asc, 1/3),
      interpZodiac(mcLon, asc, 2/3)
    ].map(normDeg);
  }
  function houseFromCusps(longitude, cusps) {
    const lon = normDeg(longitude);
    for (let i = 0; i < cusps.length; i++) {
      const start = normDeg(cusps[i]);
      const end = normDeg(cusps[(i + 1) % cusps.length]);
      const span = forwardArc(start, end) || 30;
      const offset = forwardArc(start, lon);
      if (offset < span || Math.abs(offset - span) < 1e-7) return i + 1;
    }
    return null;
  }
  function assignCalculatedHouses(placements, houseSystem = 'whole-sign') {
    const system = normalizeSkyHouseSystem(houseSystem);
    const cusps = computedHouseCusps(placements, system);
    const risingSign = placements?.Rising?.sign;
    Object.entries(placements || {}).forEach(([body, placement]) => {
      if (!placement?.sign) return;
      if (system === 'whole-sign') placement.house = body === 'Rising' ? 1 : wholeSignHouseNumber(risingSign, placement.sign);
      else placement.house = houseFromCusps(placement.longitude, cusps);
      placement.houseSystem = skyHouseSystemLabel(system);
    });
    placements._houseCusps = cusps.map((longitude, index) => ({ house:index + 1, ...longitudeToPlacement(longitude) }));
    placements._houseSystem = skyHouseSystemLabel(system);
    return placements;
  }
  function intlTimeZoneOffsetMs(date, timeZone) {
    if (!timeZone || !Intl?.DateTimeFormat) return 0;
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12:false,
      year:'numeric', month:'2-digit', day:'2-digit',
      hour:'2-digit', minute:'2-digit', second:'2-digit'
    });
    const parts = Object.fromEntries(formatter.formatToParts(date).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
    let hour = Number(parts.hour || 0);
    if (hour === 24) hour = 0;
    const asUtc = Date.UTC(Number(parts.year), Number(parts.month)-1, Number(parts.day), hour, Number(parts.minute || 0), Number(parts.second || 0));
    return asUtc - date.getTime();
  }
  function dateFromLocalDateTimeInZone(value, timeZone='') {
    const raw = String(value || '').trim();
    if (!raw) return new Date();
    if (!timeZone) return new Date(raw);
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!match) return new Date(raw);
    const [, y, mo, d, h, mi] = match.map(Number);
    let utcGuess = new Date(Date.UTC(y, mo-1, d, h, mi, 0));
    for (let i=0; i<3; i++) utcGuess = new Date(Date.UTC(y, mo-1, d, h, mi, 0) - intlTimeZoneOffsetMs(utcGuess, timeZone));
    return utcGuess;
  }
  function localDateTimeValueInZone(date = new Date(), timeZone='') {
    if (!timeZone || !Intl?.DateTimeFormat) return localDateTimeInputValue(date);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12:false,
      year:'numeric', month:'2-digit', day:'2-digit',
      hour:'2-digit', minute:'2-digit'
    });
    const parts = Object.fromEntries(formatter.formatToParts(date).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
    const hour = parts.hour === '24' ? '00' : parts.hour;
    return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}`;
  }
  function calculateSkyWithAstronomy(date, latitude, longitude, houseSystem = 'whole-sign') {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) throw new Error('Choose a valid date and time.');
    if (!window.Astronomy) throw new Error('Astronomy Engine is not available.');
    if (String(latitude || '').trim() === '') throw new Error('Enter a latitude, or search/use your location first.');
    if (String(longitude || '').trim() === '') throw new Error('Enter a longitude, or search/use your location first.');
    const lat = Number(latitude), lonObs = Number(longitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new Error('Enter a valid latitude between minus 90 and 90.');
    if (!Number.isFinite(lonObs) || lonObs < -180 || lonObs > 180) throw new Error('Enter a valid longitude between minus 180 and 180.');
    const placements = SKY_CALC_BODIES.reduce((acc, body) => {
      const lon = astronomyLongitude(body, date);
      const placement = longitudeToPlacement(lon, 'completed');
      const motion = calculatedMotionForBody(body, date);
      acc[body] = { ...placement, retrograde: !!motion.retrograde, station: !!motion.station, motionSpeedDegPerDay: motion.motionSpeedDegPerDay, motionSource: motion.motionSource, calculatedAt: date.toISOString() };
      return acc;
    }, {});
    const rising = longitudeToPlacement(ascendantLongitude(date, lat, lonObs));
    const mc = longitudeToPlacement(midheavenLongitude(date, lonObs));
    placements.Rising = { ...rising, house: 1, calculatedAt: date.toISOString(), angleSource: 'Astronomy Engine' };
    placements.MC = { ...mc, calculatedAt: date.toISOString(), angleSource: 'Astronomy Engine' };
    placements._houseContext = {
      dateISO: date.toISOString(),
      latitude: lat,
      longitude: lonObs,
      siderealDegrees: localSiderealDegrees(date, lonObs),
      obliquityDegrees: trueObliquityDegrees(date)
    };
    return assignCalculatedHouses(placements, houseSystem);
  }
  function localDateTimeInputValue(date = new Date()) {
    const pad = value => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  function skyCalcStatus(message, isError=false) {
    const el = $('skyCalcStatus');
    if (el) { el.textContent = message; el.classList.toggle('is-error', !!isError); }
  }

  function ensureSkyCalcProfiles() { state.skyCalcProfiles ||= { chart:{}, currentSky:{} }; return state.skyCalcProfiles; }
  function skyCalcTargetKind() { return ($('skyCalcTarget')?.value === 'currentSky' && skyChartNeedsB()) ? 'currentSky' : 'chart'; }
  function activeSkyCalcTargetKind() { return (state.skyCalcActiveTarget === 'currentSky' && skyChartNeedsB()) ? 'currentSky' : 'chart'; }
  function currentSkyCalcProfile(kind = activeSkyCalcTargetKind()) { return { ...(ensureSkyCalcProfiles()[kind] || {}) }; }
  function setSkyCalcProfile(kind, profile) { ensureSkyCalcProfiles()[kind] = { ...(profile || {}) }; }
  function readSkyCalcInputs() {
    return {
      dateTime: $('skyCalcDateTime')?.value || '',
      latitude: $('skyCalcLatitude')?.value || '',
      longitude: $('skyCalcLongitude')?.value || '',
      location: $('skyCalcLocation')?.value?.trim() || '',
      timeZone: $('skyCalcTimeZone')?.value?.trim() || '',
      name: $('skyCalcName')?.value?.trim() || '',
      houseSystem: normalizeSkyHouseSystem($('skyCalcHouseSystem')?.value || 'whole-sign')
    };
  }
  function writeSkyCalcInputs(profile = {}, options = {}) {
    const p = meaningfulSkyCalcProfile(profile);
    const setValue = (id, value) => {
      const el = $(id);
      if (!el) return;
      if (options.force || (!el.value && value)) el.value = value || '';
    };
    setValue('skyCalcDateTime', p.dateTime);
    setValue('skyCalcLatitude', p.latitude);
    setValue('skyCalcLongitude', p.longitude);
    setValue('skyCalcLocation', p.location);
    setValue('skyCalcTimeZone', p.timeZone);
    setValue('skyCalcName', p.name);
    { const el = $('skyCalcHouseSystem'); if (el) el.value = normalizeSkyHouseSystem(p.houseSystem || 'whole-sign'); }
  }
  function normalizeLocalDateTimeValue(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) return raw.slice(0,16);
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? '' : localDateTimeInputValue(d);
  }
  function parseSkyCalcProfileFromText(name='', notes='') {
    const text = `${name || ''}
${notes || ''}`;
    const iso = text.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(?:Z|[+-]\d{2}:?\d{2})?)/);
    const mdyt = text.match(/(\d{1,2}\/\d{1,2}\/\d{4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)/i);
    const lat = text.match(/latitude\s+(-?\d+(?:\.\d+)?)/i) || text.match(/lat(?:itude)?\s*[:=]\s*(-?\d+(?:\.\d+)?)/i);
    const lon = text.match(/longitude\s+(-?\d+(?:\.\d+)?)/i) || text.match(/lon(?:gitude)?\s*[:=]\s*(-?\d+(?:\.\d+)?)/i);
    const loc = text.match(/Location:\s*([^\.\n]+)/i);
    const tz = text.match(/(?:Time zone|Timezone|IANA time zone):\s*([^\.\n]+)/i);
    const system = text.match(/Houses assigned by\s+([^\.\n]+)/i);
    const normalizedSystem = normalizeSkyHouseSystem(system?.[1] || 'whole-sign');
    return {
      dateTime: normalizeLocalDateTimeValue(iso?.[1] || (mdyt ? `${mdyt[1]} ${mdyt[2]}` : '')),
      latitude: lat?.[1] || '',
      longitude: lon?.[1] || '',
      location: loc?.[1]?.trim() || '',
      timeZone: tz?.[1]?.trim() || '',
      houseSystem: normalizedSystem
    };
  }
  function meaningfulSkyCalcProfile(profile = {}) {
    return {
      dateTime: String(profile.dateTime || '').trim(),
      latitude: String(profile.latitude || '').trim(),
      longitude: String(profile.longitude || '').trim(),
      location: String(profile.location || '').trim(),
      timeZone: String(profile.timeZone || '').trim(),
      name: String(profile.name || '').trim(),
      houseSystem: normalizeSkyHouseSystem(profile.houseSystem || 'whole-sign')
    };
  }
  function hasSkyCalcData(profile = {}) {
    const p = meaningfulSkyCalcProfile(profile);
    return !!(p.dateTime || p.latitude || p.longitude || p.location || p.timeZone);
  }
  function readPlanetaryHoursWhereWhenSettings() {
    try {
      const raw = localStorage.getItem('relphiPlanetaryHoursWhereWhen');
      if (!raw) return null;
      const data = JSON.parse(raw);
      return meaningfulSkyCalcProfile({
        dateTime: normalizeLocalDateTimeValue(data.datetime || ''),
        latitude: data.lat || data.latitude || '',
        longitude: data.lon || data.longitude || '',
        location: data.loc || data.location || data.locationName || '',
        timeZone: data.tz || data.timeZone || '',
        name: 'Planetary Hours Where and When'
      });
    } catch (error) {
      return null;
    }
  }
  function applyPlanetaryHoursWhereWhenSettings() {
    const profile = readPlanetaryHoursWhereWhenSettings();
    if (!profile || !hasSkyCalcData(profile)) {
      skyCalcStatus('Open Planetary Hours once, or use its Sky Chart jump, so those Where and When settings can be shared.', true);
      return false;
    }
    writeSkyCalcInputs(profile, { force:true });
    maybeRememberSkyCalcProfile();
    skyCalcStatus('Using Planetary Hours Where and When settings.');
    return true;
  }
  function knownSkyCalculationSeed(kind, name='', placements={}) {
    // Public-safe: do not infer or ship anyone's private birth date, time, or birthplace.
    // Backward compatibility comes only from saved/imported calculation metadata.
    return {};
  }
  function skyCalculationSeedFor(kind = skyCalcTargetKind()) {
    const f = skyFields(kind);
    const placements = state[f.stateKey] || {};
    const name = state[f.nameKey] || $(f.name)?.value || '';
    const notes = state[f.notesKey] || $(f.notes)?.value || '';
    const profile = currentSkyCalcProfile(kind);
    const parsed = parseSkyCalcProfileFromText(name, notes);
    const known = knownSkyCalculationSeed(kind, name, placements);
    return meaningfulSkyCalcProfile({ ...known, ...parsed, ...profile, name: profile.name || name || known.name || '' });
  }
  function hydrateSkyCalculationPanel(kind = skyCalcTargetKind(), options = {}) {
    kind = (kind === 'currentSky' && skyChartNeedsB()) ? 'currentSky' : 'chart';
    const target = $('skyCalcTarget'); if (target) target.value = kind;
    state.skyCalcActiveTarget = kind;
    const seed = skyCalculationSeedFor(kind);
    writeSkyCalcInputs(seed, { ...options, force: options.force !== false });
    const nameEl = $('skyCalcName');
    if (nameEl) nameEl.placeholder = `Auto: ${defaultSkyName(kind)}`;
    return seed;
  }
  function maybeRememberSkyCalcProfile(kind = activeSkyCalcTargetKind(), options = {}) {
    kind = kind === 'currentSky' ? 'currentSky' : 'chart';
    const profile = meaningfulSkyCalcProfile(readSkyCalcInputs());
    if (options.allowBlank || hasSkyCalcData(profile) || profile.name) setSkyCalcProfile(kind, profile);
    return profile;
  }
  function saveActiveSkyCalcPanelProfile(options = {}) {
    return maybeRememberSkyCalcProfile(activeSkyCalcTargetKind(), { allowBlank: !!options.allowBlank });
  }
  function switchSkyCalculationTarget(kind) {
    if (kind === 'currentSky' && !skyChartNeedsB()) kind = 'chart';
    kind = kind === 'currentSky' ? 'currentSky' : 'chart';
    const previous = activeSkyCalcTargetKind();
    if (previous !== kind) saveActiveSkyCalcPanelProfile({ allowBlank:true });
    setSkyCreatorKind?.(kind);
    const seed = hydrateSkyCalculationPanel(kind, { force:true });
    skyCalcStatus(hasSkyCalcData(seed) || seed.name ? `${skyCreatorLabel(kind)} calculation fields restored from its own saved metadata.` : `${skyCreatorLabel(kind)} has its own empty calculation fields. It will not inherit the other sky.`);
    return seed;
  }
  function attachSkyCalcProfileToSelectedSky(kind = skyCalcTargetKind()) {
    const f = skyFields(kind);
    if (kind === 'currentSky') readCurrentSkyForm(); else readChartForm();
    readSkyMeta(kind);
    const profile = meaningfulSkyCalcProfile(readSkyCalcInputs());
    if (!hasSkyCalcData(profile)) { skyCalcStatus('Enter a date/time or location before attaching calculation data to this sky.', true); return; }
    const placements = state[f.stateKey] || {};
    const name = profile.name || state[f.nameKey] || skyRecordName(kind, '');
    setSkyCalcProfile(kind, { ...profile, name });
    if (!state[f.nameKey] && profile.name) writeSkyMeta(kind, profile.name, state[f.notesKey] || '');
    upsertSkyLibrary(kind, state[f.nameKey] || name, state[f.notesKey] || '', placements, currentSkyCalcProfile(kind));
    skyCalcStatus(`Calculation fields attached to ${skyCreatorLabel(kind)}. Save/load will now restore this date, time, and location metadata.`);
  }
  async function resolveSkyCalcTimeZone(latitude, longitude) {
    const lat = Number(latitude), lon = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current=temperature_2m&timezone=auto`;
    const response = await fetch(url, { headers: { 'Accept':'application/json' } });
    if (!response.ok) throw new Error(`Time zone lookup failed with status ${response.status}.`);
    const data = await response.json();
    return {
      timeZone: data?.timezone || '',
      utcOffsetSeconds: Number.isFinite(Number(data?.utc_offset_seconds)) ? Number(data.utc_offset_seconds) : null,
      abbreviation: data?.timezone_abbreviation || '',
      localTime: data?.current?.time || ''
    };
  }
  async function reverseSkyCalcLocation(latitude, longitude) {
    const lat = Number(latitude), lon = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return '';
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
    const response = await fetch(url, { headers: { 'Accept':'application/json' } });
    if (!response.ok) throw new Error(`Reverse location lookup failed with status ${response.status}.`);
    const data = await response.json();
    return data?.display_name || '';
  }
  async function enrichSkyCalcFromCoordinates(options = {}) {
    const latEl = $('skyCalcLatitude'), lonEl = $('skyCalcLongitude'), locEl = $('skyCalcLocation'), tzEl = $('skyCalcTimeZone'), dtEl = $('skyCalcDateTime');
    const latitude = latEl?.value || '', longitude = lonEl?.value || '';
    if (!latitude || !longitude) return meaningfulSkyCalcProfile(readSkyCalcInputs());
    let location = locEl?.value?.trim() || '';
    let timeZone = tzEl?.value?.trim() || '';
    try {
      if ((!location || options.forceLocation) && options.reverseLocation !== false) {
        location = await reverseSkyCalcLocation(latitude, longitude);
        if (locEl && location) locEl.value = location;
      }
    } catch (error) {
      // Keep going: time zone is more important for calculation.
    }
    try {
      if (!timeZone || options.forceTimeZone) {
        const zone = await resolveSkyCalcTimeZone(latitude, longitude);
        timeZone = zone?.timeZone || timeZone;
        if (tzEl && timeZone) tzEl.value = timeZone;
        if (dtEl && (options.setDateTimeToNow || !dtEl.value) && timeZone) dtEl.value = localDateTimeValueInZone(new Date(), timeZone);
      }
    } catch (error) {
      if (options.requireTimeZone) throw error;
    }
    maybeRememberSkyCalcProfile();
    return meaningfulSkyCalcProfile(readSkyCalcInputs());
  }
  async function searchSkyCalcLocation() {
    const query = $('skyCalcLocation')?.value?.trim() || $('skyCalcName')?.value?.trim() || '';
    if (!query) { skyCalcStatus('Type a location label first, then search.', true); return; }
    try {
      skyCalcStatus(`Searching for ${query}…`);
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
      const response = await fetch(url, { headers: { 'Accept':'application/json' } });
      if (!response.ok) throw new Error(`Location search failed with status ${response.status}.`);
      const results = await response.json();
      const first = Array.isArray(results) ? results[0] : null;
      if (!first) throw new Error('No location match found. Try a more specific place name.');
      if ($('skyCalcLatitude')) $('skyCalcLatitude').value = Number(first.lat).toFixed(4);
      if ($('skyCalcLongitude')) $('skyCalcLongitude').value = Number(first.lon).toFixed(4);
      if ($('skyCalcLocation')) $('skyCalcLocation').value = first.display_name || query;
      const profile = await enrichSkyCalcFromCoordinates({ forceTimeZone:true, reverseLocation:false });
      skyCalcStatus(`Location found: ${first.display_name}. Coordinates stored from OpenStreetMap Nominatim${profile.timeZone ? `; time zone resolved as ${profile.timeZone}.` : '.'}`);
    } catch (error) {
      skyCalcStatus(error?.message || 'Could not search that location.', true);
    }
  }

  function skyReverseTargetsForKind(kind = (typeof skyCreatorKind === 'function' ? skyCreatorKind() : skyCalcTargetKind())) {
    const f = skyFields(kind);
    if (kind === 'currentSky') readCurrentSkyForm(); else readChartForm();
    return { kind, fields:f, placements: state[f.stateKey] || {} };
  }
  function placementTargetLongitude(p) {
    const lon = placementLongitude(p);
    return lon == null ? null : lon;
  }
  function reverseScoreDate(date, targets, weights = {}) {
    let score = 0, count = 0;
    for (const item of targets) {
      const weight = weights[item.body] ?? 1;
      try {
        const actual = astronomyLongitude(item.body, date);
        const delta = exactAngularDistance(actual, item.longitude);
        score += weight * delta * delta;
        count += weight;
      } catch (error) {}
    }
    return count ? score / count : Infinity;
  }
  function reverseKeepBest(list, item, limit) {
    list.push(item);
    list.sort((a,b) => a.score - b.score);
    if (list.length > limit) list.length = limit;
  }
  function signedGeoLongitude(value) {
    return ((normDeg(value) + 540) % 360) - 180;
  }
  function eclipticRightAscensionDegrees(longitude, date) {
    const lam = normDeg(longitude) * Math.PI / 180;
    const eps = trueObliquityDegrees(date) * Math.PI / 180;
    return normDeg(Math.atan2(Math.sin(lam) * Math.cos(eps), Math.cos(lam)) * 180 / Math.PI);
  }
  function observerLongitudeFromMC(date, mcLongitude) {
    const gmst = localSiderealDegrees(date, 0);
    const ra = eclipticRightAscensionDegrees(mcLongitude, date);
    return signedGeoLongitude(ra - gmst);
  }
  function solveLatitudeFromAsc(date, observerLongitude, ascLongitude) {
    let best = { latitude:0, error:Infinity };
    const test = lat => {
      const actual = ascendantLongitude(date, lat, observerLongitude);
      const error = exactAngularDistance(actual, ascLongitude);
      if (error < best.error) best = { latitude:lat, error };
    };
    for (let lat=-89; lat<=89; lat+=0.5) test(lat);
    const start = Math.max(-89.9, best.latitude - 1.5);
    const end = Math.min(89.9, best.latitude + 1.5);
    for (let lat=start; lat<=end; lat+=0.02) test(lat);
    return { latitude:Number(best.latitude.toFixed(4)), error:best.error };
  }
  async function inferSkyCalcFromPlacements() {
    try {
      const { kind, fields, placements } = skyReverseTargetsForKind();
      const targets = SKY_CALC_BODIES.map(body => ({ body, longitude:placementTargetLongitude(placements[body]) })).filter(item => item.longitude != null);
      const sun = targets.find(item => item.body === 'Sun');
      const moon = targets.find(item => item.body === 'Moon');
      const ascLon = placementTargetLongitude(placements.Rising);
      const mcLon = placementTargetLongitude(placements.MC);
      if (!window.Astronomy) throw new Error('Astronomy Engine is not available.');
      if (targets.length < 4 || !sun || !moon) throw new Error('To infer a date from placements, include at least Sun, Moon, and several planets.');
      if (ascLon == null || mcLon == null) throw new Error('To infer place from placements, include both Rising/Ascendant and MC.');
      skyCalcStatus('Inferring date from planetary placements. This may take a moment…');
      const slowWeights = { Sun:3, Mercury:.7, Venus:.7, Mars:1.2, Jupiter:3, Saturn:4, Uranus:5, Neptune:5, Pluto:5 };
      const allWeights = { Sun:3, Moon:9, Mercury:1.7, Venus:1.7, Mars:2, Jupiter:3, Saturn:4, Uranus:5, Neptune:5, Pluto:5 };
      const coarse = [];
      for (let year=1900; year<=2100; year++) {
        const start = Date.UTC(year, 0, 1, 12, 0, 0);
        const end = Date.UTC(year + 1, 0, 1, 12, 0, 0);
        for (let t=start; t<end; t += 24*60*60*1000) {
          const date = new Date(t);
          const sunDist = exactAngularDistance(astronomyLongitude('Sun', date), sun.longitude);
          if (sunDist <= 2.2) {
            const score = reverseScoreDate(date, targets.filter(x => x.body !== 'Moon'), slowWeights) + sunDist * sunDist;
            reverseKeepBest(coarse, { date, score }, 96);
          }
        }
      }
      if (!coarse.length) throw new Error('Could not find a candidate date from the Sun placement.');
      const hourly = [];
      coarse.forEach(candidate => {
        const center = candidate.date.getTime();
        for (let dt=-42*60*60*1000; dt<=42*60*60*1000; dt += 2*60*60*1000) {
          const date = new Date(center + dt);
          const score = reverseScoreDate(date, targets, allWeights);
          reverseKeepBest(hourly, { date, score }, 36);
        }
      });
      const fiveMinute = [];
      hourly.slice(0, 18).forEach(candidate => {
        const center = candidate.date.getTime();
        for (let dt=-150*60*1000; dt<=150*60*1000; dt += 5*60*1000) {
          const date = new Date(center + dt);
          const score = reverseScoreDate(date, targets, allWeights);
          reverseKeepBest(fiveMinute, { date, score }, 12);
        }
      });
      const minute = [];
      fiveMinute.slice(0, 6).forEach(candidate => {
        const center = candidate.date.getTime();
        for (let dt=-12*60*1000; dt<=12*60*1000; dt += 60*1000) {
          const date = new Date(center + dt);
          const score = reverseScoreDate(date, targets, allWeights);
          reverseKeepBest(minute, { date, score }, 5);
        }
      });
      const best = minute[0] || fiveMinute[0] || hourly[0] || coarse[0];
      if (!best) throw new Error('Could not infer a date/time from these placements.');
      const longitude = observerLongitudeFromMC(best.date, mcLon);
      const latSolve = solveLatitudeFromAsc(best.date, longitude, ascLon);
      const latitude = latSolve.latitude;
      if (!Number.isFinite(latitude) || latSolve.error > 1.5) throw new Error('Date was inferred, but the Rising/MC did not produce a reliable latitude.');
      if ($('skyCalcTarget')) $('skyCalcTarget').value = kind;
      if ($('skyCalcLatitude')) $('skyCalcLatitude').value = Number(latitude).toFixed(4);
      if ($('skyCalcLongitude')) $('skyCalcLongitude').value = Number(longitude).toFixed(4);
      if ($('skyCalcName')) $('skyCalcName').value = state[fields.nameKey] || $(fields.name)?.value || skyCreatorLabel(kind);
      let location = '';
      let timeZone = '';
      try {
        location = await reverseSkyCalcLocation(latitude, longitude);
        if ($('skyCalcLocation')) $('skyCalcLocation').value = location;
      } catch (error) {}
      try {
        const tzInfo = await resolveSkyCalcTimeZone(latitude, longitude);
        timeZone = tzInfo?.timeZone || '';
        if ($('skyCalcTimeZone')) $('skyCalcTimeZone').value = timeZone;
      } catch (error) {}
      if ($('skyCalcDateTime')) $('skyCalcDateTime').value = localDateTimeValueInZone(best.date, timeZone);
      const profile = meaningfulSkyCalcProfile(readSkyCalcInputs());
      setSkyCalcProfile(kind, profile);
      skyCalcStatus(`Inferred from placements: ${profile.dateTime || best.date.toISOString()}${timeZone ? ` (${timeZone})` : ''}, latitude ${Number(latitude).toFixed(4)}, longitude ${Number(longitude).toFixed(4)}${location ? `, ${location}` : ''}. Attach to sky to save this metadata.`);
    } catch (error) {
      skyCalcStatus(error?.message || 'Could not infer date/place from placements.', true);
    }
  }

  async function runSkyCalculation(explicitTarget = '') {
    const dateEl = $('skyCalcDateTime');
    const requestedTarget = explicitTarget === 'currentSky' || explicitTarget === 'chart' ? explicitTarget : '';
    const target = requestedTarget === 'currentSky' && skyChartNeedsB()
      ? 'currentSky'
      : requestedTarget === 'chart'
        ? 'chart'
        : skyCalcTargetKind();
    const targetSelect = $('skyCalcTarget');
    if (targetSelect) targetSelect.value = target;
    const protectedKind = target === 'currentSky' ? 'chart' : 'currentSky';
    const protectedSnapshot = captureSkySlot(protectedKind);
    const existingTargetPlacements = cloneSkySlotValue(statePlacementsForKind(target));
    const selectedStoredRecordId = state.skyLibrarySelection?.[target] || '';
    if (typeof skyCreatorKind === 'function' && skyCreatorKind() !== target) {
      setSkyCreatorKind(target);
      writeSkyCreatorMeta?.(target);
    } else {
      readSkyCreatorMeta?.();
    }
    state.skyCalcActiveTarget = target;
    const raw = dateEl?.value || '';
    const latitude = $('skyCalcLatitude')?.value ?? '';
    const longitude = $('skyCalcLongitude')?.value ?? '';
    const houseSystem = normalizeSkyHouseSystem($('skyCalcHouseSystem')?.value || 'whole-sign');
    const locationLabel = $('skyCalcLocation')?.value?.trim() || '';
    try {
      const enteredTimeZone = $('skyCalcTimeZone')?.value?.trim() || '';
      const resolved = enteredTimeZone
        ? { timeZone:enteredTimeZone }
        : await enrichSkyCalcFromCoordinates({ forceLocation:false, forceTimeZone:true, reverseLocation:false, requireTimeZone:false });
      const timeZone = resolved.timeZone || $('skyCalcTimeZone')?.value?.trim() || '';
      const date = dateFromLocalDateTimeInZone(raw, timeZone);
      const calculatedPlacements = calculateSkyWithAstronomy(date, latitude, longitude, houseSystem);
      const prefersAscLabel = !!existingTargetPlacements.ASC && !existingTargetPlacements.Rising;
      if (prefersAscLabel && calculatedPlacements.Rising) {
        calculatedPlacements.ASC = calculatedPlacements.Rising;
        delete calculatedPlacements.Rising;
      }
      const preservedCustomPlacements = {};
      Object.entries(existingTargetPlacements || {}).forEach(([body, placement]) => {
        if (!SKY_CALC_BODIES.includes(body) && body !== 'Rising' && body !== 'ASC' && body !== 'MC' && !String(body).startsWith('_')) {
          preservedCustomPlacements[body] = cloneSkySlotValue(placement);
        }
      });
      const placements = { ...preservedCustomPlacements, ...calculatedPlacements };
      const label = $('skyCalcName')?.value?.trim() || defaultSkyName(target, date, timeZone);
      if ($('skyCalcName') && !$('skyCalcName').value.trim()) $('skyCalcName').value = label;
      const profile = { dateTime: raw, latitude:String(latitude), longitude:String(longitude), location:$('skyCalcLocation')?.value?.trim() || locationLabel, timeZone:$('skyCalcTimeZone')?.value?.trim() || '', name:label, houseSystem };
      setSkyCalcProfile(target, profile);
      const risingPlacement = placements.Rising || placements.ASC;
      const risingLabel = risingPlacement ? `${risingPlacement.sign} Rising` : 'Rising unavailable';
      const locationNote = profile.location ? ` Location: ${profile.location}.` : '';
      const timeZoneNote = profile.timeZone ? ` Time zone: ${profile.timeZone}.` : '';
      const notes = `Calculated with Astronomy Engine by Don Cross (MIT). Geocentric ecliptic longitudes. Rising and Midheaven computed from latitude ${Number(latitude).toFixed(4)} and longitude ${Number(longitude).toFixed(4)}. Houses assigned by ${skyHouseSystemLabel(houseSystem)} from the calculated angles.${locationNote}${timeZoneNote} Motion state sampled around ${date.toISOString()}.`;
      writeSkyMeta(target, label, notes);
      if (target === 'currentSky') writeCurrentSkyForm(placements, { forcePasteSync:true });
      else writeChartForm(placements, { forcePasteSync:true });
      setSkyCreatorKind(target);
      writeSkyCreatorMeta(target);
      restoreSkySlot(protectedKind, protectedSnapshot);
      if (selectedStoredRecordId) {
        replaceSkyLibraryRecord(selectedStoredRecordId, {
          name:label,
          notes,
          placements:cloneSkySlotValue(placements),
          calcProfile:cloneSkySlotValue(profile)
        });
        state.skyLibrarySelection = { chart:'', currentSky:'', ...(state.skyLibrarySelection || {}) };
        state.skyLibrarySelection[target] = selectedStoredRecordId;
      }
      renderSkyCreator();
      renderChart();
      setSkyEntrySource(target, consumeSkyPendingEntrySource(target, 'calculated'));
      updateSkyCreatorDeleteStoredButton();
      skyCalcStatus(`Calculated ${skyCreatorLabel(target)} for ${timestampLabelInZone(date, profile.timeZone)} at ${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}${profile.timeZone ? ` (${profile.timeZone})` : ''}. Stored Rising, Midheaven, ${skyHouseSystemLabel(houseSystem)} houses, and planetary retrograde/station states. ${risingLabel}.${selectedStoredRecordId ? ' The loaded stored sky was updated.' : ''}`);
      return true;
    } catch (error) {
      restoreSkySlot(protectedKind, protectedSnapshot);
      consumeSkyPendingEntrySource(target, '');
      skyCalcStatus(error?.message || 'Could not calculate sky positions.', true);
      return false;
    }
  }
  function bindSkyCalculationPanel() {
    const dateEl = $('skyCalcDateTime');
    const initialKind = typeof skyCreatorKind === 'function' ? skyCreatorKind() : skyCalcTargetKind();
    state.skyCalcActiveTarget = initialKind === 'currentSky' ? 'currentSky' : 'chart';
    hydrateSkyCalculationPanel(state.skyCalcActiveTarget, { force:true });
    $('skyCalcTarget')?.addEventListener('change', () => {
      switchSkyCalculationTarget(skyCalcTargetKind());
    });
    $('skyCalcSeed')?.addEventListener('click', () => {
      const kind = activeSkyCalcTargetKind();
      const target = $('skyCalcTarget');
      if (target) target.value = kind;
      const seed = hydrateSkyCalculationPanel(kind, { force:true });
      skyCalcStatus(hasSkyCalcData(seed) ? `Calculation fields filled from saved/imported metadata for ${skyCreatorLabel(kind)}.` : `No calculation metadata is saved for ${skyCreatorLabel(kind)} yet. Loading placements does not reveal the original date/time/place. Enter date/time and location, then Attach to sky.`);
    });
    $('skyCalcAttach')?.addEventListener('click', () => attachSkyCalcProfileToSelectedSky(activeSkyCalcTargetKind()));
    $('skyCalcUsePlanetaryHours')?.addEventListener('change', event => {
      if (event.currentTarget.checked) applyPlanetaryHoursWhereWhenSettings();
    });
    $('skyCalcNow')?.addEventListener('click', async () => {
      try {
        const profile = await enrichSkyCalcFromCoordinates({ forceTimeZone:true, reverseLocation:false });
        const timeZone = profile.timeZone || $('skyCalcTimeZone')?.value?.trim() || '';
        if (dateEl) dateEl.value = localDateTimeValueInZone(new Date(), timeZone);
        maybeRememberSkyCalcProfile();
        skyCalcStatus(timeZone ? `Date/time set to now in ${timeZone}.` : 'Date/time set to now in your browser time zone.');
      } catch (error) {
        if (dateEl) dateEl.value = localDateTimeInputValue(new Date());
        maybeRememberSkyCalcProfile();
        skyCalcStatus('Date/time set to now in your browser time zone. Resolve coordinates to set a location time zone.', true);
      }
    });
    $('skyCalcSearchLocation')?.addEventListener('click', searchSkyCalcLocation);
    $('skyCalcResolveCoords')?.addEventListener('click', () => {
      enrichSkyCalcFromCoordinates({ forceLocation:true, forceTimeZone:true }).then(profile => {
        skyCalcStatus(`Coordinates resolved${profile.location ? `: ${profile.location}` : ''}${profile.timeZone ? `. Time zone: ${profile.timeZone}` : ''}.`);
      }).catch(error => skyCalcStatus(error?.message || 'Could not resolve those coordinates.', true));
    });
    $('skyCalcReverseSolve')?.addEventListener('click', inferSkyCalcFromPlacements);
    $('skyCalcGeo')?.addEventListener('click', () => {
      if (!navigator.geolocation) { skyCalcStatus('Geolocation is not available in this browser.', true); return; }
      navigator.geolocation.getCurrentPosition(position => {
        const latEl = $('skyCalcLatitude');
        const lonEl = $('skyCalcLongitude');
        if (latEl) latEl.value = Number(position.coords.latitude).toFixed(4);
        if (lonEl) lonEl.value = Number(position.coords.longitude).toFixed(4);
        enrichSkyCalcFromCoordinates({ forceLocation:true, forceTimeZone:true, setDateTimeToNow:true }).then(profile => {
          skyCalcStatus(`Location captured${profile.location ? `: ${profile.location}` : ''}${profile.timeZone ? `. Time zone resolved as ${profile.timeZone}` : ''}. Review, then calculate the sky.`);
        }).catch(err => {
          maybeRememberSkyCalcProfile();
          skyCalcStatus(err?.message || 'Location captured, but lookup details could not be resolved. Review, then calculate the sky.', true);
        });
      }, error => {
        skyCalcStatus(error?.message || 'Could not retrieve your location.', true);
      }, { enableHighAccuracy:true, maximumAge:60000, timeout:10000 });
    });
    ['skyCalcDateTime','skyCalcLatitude','skyCalcLongitude','skyCalcLocation','skyCalcTimeZone','skyCalcName','skyCalcHouseSystem'].forEach(id => $(id)?.addEventListener('change', () => maybeRememberSkyCalcProfile()));
    qsa('[data-open-sky-calc]').forEach(btn => {
      if (btn.dataset.skyCalcOpenReady) return;
      btn.dataset.skyCalcOpenReady = 'true';
      btn.addEventListener('click', event => {
        event.preventDefault();
        const kind = prepareSkyEntryAction(btn);
        setSkyEntryMethod(kind, 'calculated');
        setSkyPendingEntrySource(kind, 'calculated');
        if (typeof switchSkyCalculationTarget === 'function') switchSkyCalculationTarget(kind);
        openSkyCreatorDrawerSection('calc');
        const first = $('skyCalcLocation') || $('skyCalcDateTime') || $('skyCalcRun');
        first?.scrollIntoView({ block:'center', behavior:'smooth' });
        setTimeout(() => first?.focus?.(), 180);
      });
    });
    qsa('[data-sky-here-now]').forEach(btn => {
      if (btn.dataset.hereNowReady) return;
      btn.dataset.hereNowReady = 'true';
      btn.addEventListener('click', event => {
        event.preventDefault();
        const kind = prepareSkyEntryAction(btn);
        setSkyEntryMethod(kind, 'here-now');
        setHereAndNowForSky(kind);
      });
    });
    qsa('[data-use-ph-settings]').forEach(btn => {
      if (btn.dataset.phSettingsReady) return;
      btn.dataset.phSettingsReady = 'true';
      btn.addEventListener('click', event => {
        event.preventDefault();
        const kind = prepareSkyEntryAction(btn);
        setSkyEntryMethod(kind, 'planetary-hours');
        setSkyPendingEntrySource(kind, 'planetary-hours');
        if (typeof switchSkyCalculationTarget === 'function') switchSkyCalculationTarget(kind);
        const ok = applyPlanetaryHoursWhereWhenSettings();
        const toggle = $('skyCalcUsePlanetaryHours');
        if (toggle) toggle.checked = !!ok;
        if (ok) { runSkyCalculation(kind).then(() => { document.getElementById('skyCreatorDrawer')?.removeAttribute('open'); document.querySelector('.sky-calc-drawer')?.removeAttribute('open'); }); }
      });
    });
    qsa('[data-focus-sky-paste]').forEach(btn => {
      if (btn.dataset.focusPasteReady) return;
      btn.dataset.focusPasteReady = 'true';
      btn.addEventListener('click', event => {
        event.preventDefault();
        const kind = prepareSkyEntryAction(btn);
        setSkyEntryMethod(kind, 'paste');
        openSkyCreatorDrawerSection('paste');
        const paste = $('skyCreatorPaste'); setTimeout(() => paste?.focus?.({ preventScroll:true }), 160);
      });
    });
    qsa('[data-focus-sky-manual]').forEach(btn => {
      if (btn.dataset.focusManualReady) return;
      btn.dataset.focusManualReady = 'true';
      btn.addEventListener('click', event => {
        event.preventDefault();
        const kind = prepareSkyEntryAction(btn);
        setSkyEntryMethod(kind, 'manual');
        openSkyCreatorDrawerSection('manual');
        const body = $('skyCreatorPlacementBody'); setTimeout(() => body?.focus?.({ preventScroll:true }), 160);
      });
    });
    qsa('[data-focus-sky-library]').forEach(btn => {
      if (btn.dataset.focusLibraryReady) return;
      btn.dataset.focusLibraryReady = 'true';
      btn.addEventListener('click', event => {
        event.preventDefault();
        const kind = prepareSkyEntryAction(btn);
        setSkyEntryMethod(kind, 'stored');
        openSkyCreatorDrawerSection('library');
        beginSkyCreatorLibrarySearch(kind);
        const name = $('skyCreatorName');
        // Keep the stored-sky picker contained. Do not recenter the whole page into
        // the middle of the advanced editor just because a library option was opened.
        setTimeout(() => name?.focus?.({ preventScroll:true }), 160);
      });
    });
    $('skyCalcRun')?.addEventListener('click', runSkyCalculation);
  }
  function describeAspectRange(selected, aspectNames, orb) {
    if (!selected) return 'Click any placement point on the wheel to focus it. Then adjust the aspect types and orb to highlight matching relationships.';
    const lon = placementLongitude(selected.p);
    if (lon == null) return '';
    const chirality = skyAspectUiState().chirality || 'both';
    const defs = (aspectNames || []).map(name => EXACT_ASPECT_DEFS.find(x => x.name === name)).filter(Boolean);
    if (!defs.length) return `${selected.label} ${selected.body} at ${signDegreeLabel(lon)}. No aspect types are currently selected.`;
    if (defs.length === 1) {
      const def = defs[0];
      const ranges = aspectCentersForChirality(lon, def, chirality).map(r => ({ label: r.side === 'left' ? 'left chirality range' : r.side === 'right' ? 'right chirality range' : (def.angle === 180 ? 'opposition range' : 'same-point range'), center:r.center }));
      const target = ranges.map(r => `${r.label}: ${signDegreeLabel(r.center - orb)} to ${signDegreeLabel(r.center + orb)}`).join(' • ');
      return `${selected.label} ${selected.body} at ${signDegreeLabel(lon)} → ${def.name} ${def.glyph}, ${chirality} chirality, orb ${formatOrb(orb)}. ${lockedContribution(aspectIngredientRef(def.name)) || ''} ${target}`;
    }
    return `${selected.label} ${selected.body} at ${signDegreeLabel(lon)} with ${defs.length} aspect types active, ${chirality} chirality, and orb ${formatOrb(orb)}. Active types: ${defs.map(def => `${def.glyph} ${def.name}`).join(', ')}.`;
  }
  function arcPath(cx, cy, radius, startDeg, endDeg) {
    const start = zodiacPlotPoint(startDeg, radius, cx, cy);
    const end = zodiacPlotPoint(endDeg, radius, cx, cy);
    const delta = normDeg(endDeg - startDeg);
    const large = delta > 180 ? 1 : 0;
    return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${large} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
  }
  function aspectRangeCenters(sourceLongitude, aspectName, chirality='both') {
    const def = EXACT_ASPECT_DEFS.find(x => x.name === aspectName) || EXACT_ASPECT_DEFS[0];
    return aspectCentersForChirality(sourceLongitude, def, chirality).map(item => ({ def, center:item.center, side:item.side }));
  }
  function aspectRangeArcsFromLongitude(sourceLongitude, aspectName, orb, cx=210, cy=210, radius=154, classPrefix='chart-wheel-aspect-range', chirality='both') {
    const safeOrb = Math.max(0, Number(orb) || 0);
    if (sourceLongitude == null || !safeOrb) return '';
    return aspectRangeCenters(sourceLongitude, aspectName, chirality).map(({ def, center, side }, i) => {
      const r = side === 'left' ? radius - 6 : side === 'right' ? radius + 6 : radius;
      const startDeg = center - safeOrb;
      const endDeg = center + safeOrb;
      const start = zodiacPlotPoint(startDeg, r, cx, cy);
      const end = zodiacPlotPoint(endDeg, r, cx, cy);
      const mid = zodiacPlotPoint(center, r, cx, cy);
      const aspectClass = `aspect-${String(def.name || aspectName || '').toLowerCase().replace(/[^a-z0-9]+/g,'-')}`;
      return `<g class="${classPrefix}-group ${aspectClass} range-${i} chirality-${escapeHtml(side)}"><path class="${classPrefix} ${aspectClass}" d="${arcPath(cx, cy, r, startDeg, endDeg)}"><title>${escapeHtml(def.name)} ${escapeHtml(side)} range: ${escapeHtml(signDegreeLabel(startDeg))} to ${escapeHtml(signDegreeLabel(endDeg))}</title></path><line class="chart-wheel-aspect-boundary ${aspectClass}" x1="${cx}" y1="${cy}" x2="${start.x.toFixed(1)}" y2="${start.y.toFixed(1)}"></line><line class="chart-wheel-aspect-boundary ${aspectClass}" x1="${cx}" y1="${cy}" x2="${end.x.toFixed(1)}" y2="${end.y.toFixed(1)}"></line><circle class="chart-wheel-aspect-center ${aspectClass}" cx="${mid.x.toFixed(1)}" cy="${mid.y.toFixed(1)}" r="3.8"></circle></g>`;
    }).join('');
  }
  function aspectRangeArcs(selected, aspectNames, orb, cx=210, cy=210, radius=154, chirality='both') {
    if (!selected) return '';
    const lon = placementLongitude(selected.p);
    const names = Array.isArray(aspectNames) ? aspectNames : [aspectNames];
    return names.filter(Boolean).map(name => aspectRangeArcsFromLongitude(lon, name, orb, cx, cy, radius, `chart-wheel-aspect-range aspect-${String(name).toLowerCase().replace(/[^a-z0-9]+/g,'-')}`, chirality)).join('');
  }
  function zodiacAnnularSectorPath(cx, cy, innerR, outerR, startDeg, endDeg) {
    const outerStart = zodiacPlotPoint(startDeg, outerR, cx, cy);
    const outerEnd = zodiacPlotPoint(endDeg, outerR, cx, cy);
    const innerEnd = zodiacPlotPoint(endDeg, innerR, cx, cy);
    const innerStart = zodiacPlotPoint(startDeg, innerR, cx, cy);
    const delta = normDeg(endDeg - startDeg);
    const large = delta > 180 ? 1 : 0;
    return `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)} A ${outerR} ${outerR} 0 ${large} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)} L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)} A ${innerR} ${innerR} 0 ${large} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)} Z`;
  }
  function zodiacWheelPatternDefs() {
    const defs = SIGNS.map((sign, i) => {
      const data = SIGN_DATA[sign] || {};
      const mode = String(data.mode || '').toLowerCase();
      const id = `relphi-${mode || 'sign'}-${i}`;
      const centerAngle = i * 30 + 15;
      const rotate = `rotate(${(centerAngle - 90).toFixed(2)} 210 210)`;
      if (mode === 'cardinal') {
        // Cardinal is true zig-zag banding: angular rows, not brickwork.
        return `<pattern id="${id}" x="0" y="0" width="28" height="12" patternUnits="userSpaceOnUse"><path d="M-6 4 L1 4 L7 1 L13 4 L19 1 L25 4 L34 4" fill="none" stroke="rgba(17,17,17,.78)" stroke-width="1.75" stroke-linecap="square" stroke-linejoin="miter" vector-effect="non-scaling-stroke"/><path d="M-6 10 L1 10 L7 7 L13 10 L19 7 L25 10 L34 10" fill="none" stroke="rgba(17,17,17,.78)" stroke-width="1.75" stroke-linecap="square" stroke-linejoin="miter" vector-effect="non-scaling-stroke"/></pattern>`;
      }
      if (mode === 'fixed') {
        // Fixed is masonry: black field with staggered white mortar.
        return `<pattern id="${id}" x="0" y="0" width="24" height="16" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="24" height="16" fill="rgba(17,17,17,.70)"/><path d="M0 0H24V16H0Z M0 8H24 M12 0V8 M6 8V16 M18 8V16" fill="none" stroke="rgba(255,253,248,.96)" stroke-width="1.65" stroke-linecap="square" vector-effect="non-scaling-stroke"/></pattern>`;
      }
      // Mutable is terrain/topographic material: irregular nested landform contours, not waves.
      return `<pattern id="${id}" x="0" y="0" width="72" height="72" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="72" height="72" fill="rgba(255,253,248,.08)"/><path d="M8 16 C13 6 29 4 39 10 C50 17 59 8 67 18 C75 28 61 39 48 36 C37 34 32 45 20 40 C8 35 1 27 8 16Z" fill="none" stroke="rgba(17,17,17,.16)" stroke-width="1.25"/><path d="M18 19 C24 12 36 12 42 18 C48 24 42 31 34 30 C27 29 25 35 19 31 C14 28 13 23 18 19Z" fill="none" stroke="rgba(17,17,17,.22)" stroke-width="1.15"/><path d="M45 49 C51 40 65 41 69 52 C73 63 58 70 48 65 C39 60 38 55 45 49Z" fill="none" stroke="rgba(17,17,17,.18)" stroke-width="1.2"/><path d="M2 58 C12 46 25 50 31 60 C36 69 20 77 8 70 C1 66 -3 63 2 58Z" fill="none" stroke="rgba(17,17,17,.14)" stroke-width="1.2"/><path d="M-5 31 C5 21 17 24 22 33 C29 45 11 51 1 43 C-6 38 -10 35 -5 31Z" fill="none" stroke="rgba(17,17,17,.11)" stroke-width="1.05"/><path d="M28 -5 C39 -13 57 -8 60 6 C64 22 42 21 34 12 C29 7 23 -1 28 -5Z" fill="none" stroke="rgba(17,17,17,.12)" stroke-width="1.05"/></pattern>`;
    }).join('');
    return `<defs>${defs}</defs>`;
  }
  function normalizeWheelDegrees(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    let out = n % 360;
    if (out < 0) out += 360;
    return out;
  }
  function wheelPlacementLayoutKey(kind, body) {
    return `${String(kind || '')}::${String(body || '')}`;
  }
  function sharedRingDisplayAngleMap(entriesA, entriesB, minGapDeg=5.4) {
    const items = [];
    entriesA.forEach(([body, p]) => {
      const lon = placementLongitude(p);
      if (lon != null) items.push({ kind:'chart', body, lon:normalizeWheelDegrees(lon) });
    });
    entriesB.forEach(([body, p]) => {
      const lon = placementLongitude(p);
      if (lon != null) items.push({ kind:'currentSky', body, lon:normalizeWheelDegrees(lon) });
    });
    if (!items.length) return new Map();
    items.sort((a, b) => a.lon - b.lon);
    const groups = [];
    let current = [items[0]];
    for (let i = 1; i < items.length; i += 1) {
      const prev = items[i - 1];
      const item = items[i];
      if ((item.lon - prev.lon) <= minGapDeg) current.push(item);
      else { groups.push(current); current = [item]; }
    }
    groups.push(current);
    if (groups.length > 1) {
      const first = groups[0];
      const last = groups[groups.length - 1];
      const wrapGap = (first[0].lon + 360) - last[last.length - 1].lon;
      if (wrapGap <= minGapDeg) {
        groups[0] = [...last, ...first.map(item => ({ ...item, lon:item.lon + 360 }))];
        groups.pop();
      }
    }
    const out = new Map();
    groups.forEach(group => {
      if (group.length === 1) {
        const item = group[0];
        out.set(wheelPlacementLayoutKey(item.kind, item.body), normalizeWheelDegrees(item.lon));
        return;
      }
      const avg = group.reduce((sum, item) => sum + item.lon, 0) / group.length;
      const start = avg - ((group.length - 1) * minGapDeg / 2);
      group.forEach((item, index) => {
        const display = normalizeWheelDegrees(start + index * minGapDeg);
        out.set(wheelPlacementLayoutKey(item.kind, item.body), display);
      });
    });
    return out;
  }
  function skyWheelHouseStructure(entries, cx, cy, geometry=SKY_WHEEL_GEOMETRY) {
    let cusps = placementEntriesHouseCusps(entries);
    if (cusps.length !== 12) cusps = Array.from({ length:12 }, (_, index) => index * 30);
    const houseLines = cusps.map((longitude, index) => {
      const edge = zodiacPlotPoint(longitude, geometry.coreWheelRadius, cx, cy);
      const next = cusps[(index + 1) % cusps.length];
      const span = forwardArc(longitude, next) || 30;
      const midpoint = normDeg(longitude + span / 2);
      const label = zodiacPlotPoint(midpoint, geometry.houseNumRadius, cx, cy);
      return `<g class="chart-wheel-house-cusp sky-a"><line x1="${cx}" y1="${cy}" x2="${edge.x.toFixed(1)}" y2="${edge.y.toFixed(1)}"></line><text x="${label.x.toFixed(1)}" y="${label.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${index + 1}</text><title>House ${index + 1}</title></g>`;
    }).join('');
    return `<g class="chart-wheel-houses sky-a" aria-label="House dividers and house numbers">${houseLines}</g>`;
  }
  function skyWheelSignTrack(cx, cy, geometry=SKY_WHEEL_GEOMETRY) {
    return SIGNS.map((sign, index) => {
      const boundary = index * 30;
      const tickInner = zodiacPlotPoint(boundary, geometry.coreWheelRadius - 12, cx, cy);
      const tickOuter = zodiacPlotPoint(boundary, geometry.coreWheelRadius, cx, cy);
      const glyphPoint = zodiacPlotPoint(boundary + 15, geometry.signGlyphRadius, cx, cy);
      return `<g class="chart-wheel-sign-sector"><line class="chart-wheel-sign-tick" x1="${tickInner.x.toFixed(1)}" y1="${tickInner.y.toFixed(1)}" x2="${tickOuter.x.toFixed(1)}" y2="${tickOuter.y.toFixed(1)}"></line><text class="chart-wheel-sign-label" x="${glyphPoint.x.toFixed(1)}" y="${glyphPoint.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(SIGN_GLYPHS[sign] || sign[0])}</text><title>${escapeHtml(sign)}</title></g>`;
    }).join('');
  }
  function skyPointButtonHtml(entries, kind, label, ballRadius, cls, cx=210, cy=210, stateClassFor=null, coreWheelRadius=180, displayAngleMap=null) {
    return entries.map(([body,p]) => {
      const longitude = placementLongitude(p);
      if (longitude == null) return '';
      const displayLongitude = displayAngleMap?.get(wheelPlacementLayoutKey(kind, body)) ?? longitude;
      const clustered = Math.abs((((displayLongitude - longitude) % 360) + 540) % 360 - 180) > 0.05;
      const contact = zodiacPlotPoint(longitude, coreWheelRadius, cx, cy);
      const ball = zodiacPlotPoint(displayLongitude, ballRadius, cx, cy);
      const degreePoint = zodiacPlotPoint(displayLongitude, ballRadius + 16, cx, cy);
      const namePoint = zodiacPlotPoint(displayLongitude, ballRadius + 30, cx, cy);
      const glyph = BODY_GLYPHS[body] || body.slice(0,2);
      const stateClass = typeof stateClassFor === 'function' ? stateClassFor(kind, body, p) : '';
      const degreeText = placementDegreeText(p);
      const displayName = relationshipBodyDisplayName(body);
      return `<g class="chart-wheel-placement chart-wheel-placement-stick ${cls}${stateClass}${clustered ? ' is-clustered' : ''}" role="button" tabindex="0" data-sky-point-kind="${escapeHtml(kind)}" data-sky-point-body="${escapeHtml(body)}" aria-label="${escapeHtml(label)} ${escapeHtml(displayName)} ${escapeHtml(degreeText || '')}"><line class="chart-wheel-radius chart-wheel-center-ray ${cls}" x1="${cx}" y1="${cy}" x2="${contact.x.toFixed(1)}" y2="${contact.y.toFixed(1)}"></line><circle class="chart-wheel-contact-dot ${cls}" cx="${contact.x.toFixed(1)}" cy="${contact.y.toFixed(1)}" r="2.7"></circle><line class="chart-wheel-stick ${cls}" x1="${contact.x.toFixed(1)}" y1="${contact.y.toFixed(1)}" x2="${ball.x.toFixed(1)}" y2="${ball.y.toFixed(1)}"></line><circle class="chart-wheel-stick-knob" cx="${ball.x.toFixed(1)}" cy="${ball.y.toFixed(1)}" r="10"></circle><text class="chart-wheel-marker-glyph" x="${ball.x.toFixed(1)}" y="${ball.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(glyph)}</text>${degreeText ? `<text class="chart-wheel-marker-degree" x="${degreePoint.x.toFixed(1)}" y="${degreePoint.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(degreeText)}</text>` : ''}<text class="chart-wheel-marker-name" x="${namePoint.x.toFixed(1)}" y="${namePoint.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(displayName)}</text><title>${escapeHtml(label)} · ${escapeHtml(placementDisplay(body,p))}</title></g>`;
    }).join('');
  }
  function renderUnifiedSkyWheel(entriesA, entriesB, options = {}) {
    const ui = skyAspectUiState();
    const filters = exactAspectFilters();
    const wheelTitle = options.titleText || 'Sky relationships wheel';
    const wheelHelp = options.helpText || 'Click a placement orb or aspect line to focus the shared relationship readout.';
    const aLabel = skyDisplayLabel('chart', 'Sky A');
    const bLabel = skyDisplayLabel('currentSky', 'Sky B');
    const pairKind = item => item?.kind === 'currentSky' ? 'currentSky' : 'chart';
    const pointKey = (kind, body) => `${kind}:${body}`;
    const rawPairsForWheel = Array.isArray(options.plotPairs) ? options.plotPairs : null;
    // A filtered relationship needs both endpoints visible so its line never
    // terminates at a hidden point. The endpoint matching the entity filter is
    // primary; its counterpart remains visible as subdued relationship context.
    const primaryEntriesA = entriesA.filter(([body, placement]) => wheelPlacementMatchesFilters(body, placement, filters));
    const primaryEntriesB = entriesB.filter(([body, placement]) => wheelPlacementMatchesFilters(body, placement, filters));
    const rawEndpointKeys = new Set();
    (rawPairsForWheel || []).forEach(pair => {
      rawEndpointKeys.add(pointKey(pairKind(pair.a), pair.a?.body));
      rawEndpointKeys.add(pointKey(pairKind(pair.b), pair.b?.body));
    });
    const visibleEntriesA = entriesA.filter(([body, placement]) =>
      placementLongitude(placement) != null && (
        wheelPlacementMatchesFilters(body, placement, filters) || rawEndpointKeys.has(pointKey('chart', body))
      )
    );
    const visibleEntriesB = entriesB.filter(([body, placement]) =>
      placementLongitude(placement) != null && (
        wheelPlacementMatchesFilters(body, placement, filters) || rawEndpointKeys.has(pointKey('currentSky', body))
      )
    );
    const primaryPointKeys = new Set([
      ...primaryEntriesA.map(([body]) => pointKey('chart', body)),
      ...primaryEntriesB.map(([body]) => pointKey('currentSky', body))
    ]);
    const activeAspectDefs = wheelAspectDefs(ui, filters);
    const activeAspectNames = activeAspectDefs.map(def => def.name);
    let selected = ui.selectedRelationship ? { kind:ui.selectedRelationship.sourceKind, body:ui.selectedRelationship.sourceBody } : ui.selected;
    let focusedTarget = null;
    if (ui.selectedRelationship) {
      const targetSource = ui.selectedRelationship.targetKind === 'currentSky' ? visibleEntriesB : visibleEntriesA;
      const foundTarget = targetSource.find(([body]) => body === ui.selectedRelationship.targetBody);
      focusedTarget = foundTarget ? { kind:ui.selectedRelationship.targetKind, body:ui.selectedRelationship.targetBody, p:foundTarget[1], label:ui.selectedRelationship.targetKind === 'currentSky' ? bLabel : aLabel } : null;
    }
    if (selected) {
      const source = selected.kind === 'currentSky' ? visibleEntriesB : visibleEntriesA;
      const found = source.find(([body]) => body === selected.body);
      selected = found ? { kind:selected.kind, body:selected.body, p:found[1], label:selected.kind === 'currentSky' ? bLabel : aLabel } : null;
    }

    const geometry = SKY_WHEEL_GEOMETRY;
    const cx = 280;
    const cy = 280;
    const aspectAnchorRadius = geometry.coreWheelRadius;
    const visibleEntries = [
      ...(ui.showA ? visibleEntriesA.map(item => [...item, 'chart']) : []),
      ...(ui.showB ? visibleEntriesB.map(item => [...item, 'currentSky']) : [])
    ];
    const pointIsVisible = (kind, body) => visibleEntries.some(([entryBody, p, meta, entryKind]) => entryKind === kind && entryBody === body && placementLongitude(p) != null);
    const pairsForWheel = rawPairsForWheel ? rawPairsForWheel.filter(pair => {
      const aKind = pairKind(pair.a);
      const bKind = pairKind(pair.b);
      return pointIsVisible(aKind, pair.a?.body) && pointIsVisible(bKind, pair.b?.body);
    }) : null;
    const plottedEndpointKeys = new Set();
    (pairsForWheel || []).forEach(pair => {
      plottedEndpointKeys.add(pointKey(pairKind(pair.a), pair.a?.body));
      plottedEndpointKeys.add(pointKey(pairKind(pair.b), pair.b?.body));
    });

    const selectedLon = selected ? placementLongitude(selected.p) : null;
    const hitStateFor = (kind, body, p) => {
      const key = pointKey(kind, body);
      const contextClass = primaryPointKeys.has(key) ? '' : ' is-filter-context';
      if (selected && kind === selected.kind && body === selected.body) return `${contextClass} is-selected`;
      if (focusedTarget) {
        if (kind === focusedTarget.kind && body === focusedTarget.body) return `${contextClass} is-aspect-hit is-focused-target`;
        return plottedEndpointKeys.has(key) ? `${contextClass} is-aspect-endpoint` : `${contextClass} is-muted`;
      }
      if (selectedLon != null) {
        const hits = aspectHitsForPlacementPair(selected?.p, p, activeAspectDefs, Number(ui.orb) || 0, ui.chirality || 'both');
        if (hits.length) return `${contextClass} is-aspect-hit`;
        return plottedEndpointKeys.has(key) ? `${contextClass} is-aspect-endpoint` : `${contextClass} is-muted`;
      }
      return plottedEndpointKeys.has(key) ? `${contextClass} is-aspect-endpoint` : contextClass;
    };

    const selectedPoint = selected ? zodiacPlotPoint(placementLongitude(selected.p), aspectAnchorRadius, cx, cy) : null;
    const focusedTargetPoint = focusedTarget?.p ? zodiacPlotPoint(placementLongitude(focusedTarget.p), aspectAnchorRadius, cx, cy) : null;
    const selectedRelationshipLine = selected && selectedPoint && focusedTarget && focusedTargetPoint
      ? (() => {
          const cls = String(ui.aspect || 'relationship').toLowerCase().replace(/[^a-z0-9]+/g, '-');
          return `<line class="chart-wheel-selected-aspect chart-wheel-selected-aspect-${cls} chart-wheel-selected-aspect-focused" x1="${selectedPoint.x.toFixed(1)}" y1="${selectedPoint.y.toFixed(1)}" x2="${focusedTargetPoint.x.toFixed(1)}" y2="${focusedTargetPoint.y.toFixed(1)}"><title>${escapeHtml(selected.body)} ${escapeHtml(ui.aspect || 'aspect')} ${escapeHtml(focusedTarget.body)}${ui.selectedRelationship?.orb ? ` · orb ${escapeHtml(formatOrb(Number(ui.selectedRelationship.orb)))}` : ''}</title></line>`;
        })()
      : '';
    const selectedAspectLines = selectedRelationshipLine || (selected && selectedPoint ? visibleEntries.map(([body, p, meta, kind]) => {
      if (kind === selected.kind && body === selected.body) return '';
      const targetLongitude = placementLongitude(p);
      if (targetLongitude == null) return '';
      const targetPoint = zodiacPlotPoint(targetLongitude, aspectAnchorRadius, cx, cy);
      const hits = aspectHitsForPlacementPair(selected.p, p, activeAspectDefs, Number(ui.orb) || 0, ui.chirality || 'both');
      if (!hits.length) return '';
      const hit = hits[0];
      const cls = String(hit.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `<line class="chart-wheel-selected-aspect chart-wheel-selected-aspect-${cls}" x1="${selectedPoint.x.toFixed(1)}" y1="${selectedPoint.y.toFixed(1)}" x2="${targetPoint.x.toFixed(1)}" y2="${targetPoint.y.toFixed(1)}"><title>${escapeHtml(selected.body)} ${escapeHtml(hit.name)} ${escapeHtml(body)} · orb ${escapeHtml(formatOrb(hit.orb))}</title></line>`;
    }).join('') : '');

    const placementDisplayAngles = sharedRingDisplayAngleMap(
      ui.showA ? visibleEntriesA : [],
      ui.showB ? visibleEntriesB : [],
      7.2
    );
    const markersA = ui.showA ? skyPointButtonHtml(visibleEntriesA, 'chart', aLabel, geometry.lollipopRadius, 'sky-a', cx, cy, hitStateFor, geometry.coreWheelRadius, placementDisplayAngles) : '';
    const markersB = ui.showB ? skyPointButtonHtml(visibleEntriesB, 'currentSky', bLabel, geometry.lollipopRadius, 'sky-b', cx, cy, hitStateFor, geometry.coreWheelRadius, placementDisplayAngles) : '';
    const houseReferenceEntries = ui.showA && entriesA.length ? entriesA : entriesB;
    const houseStructure = skyWheelHouseStructure(houseReferenceEntries, cx, cy, geometry);
    const signTrack = skyWheelSignTrack(cx, cy, geometry);
    const arc = aspectRangeArcs(selected, activeAspectNames, ui.orb, cx, cy, geometry.coreWheelRadius - 8, ui.chirality || 'both');

    const allAspectLines = pairsForWheel ? pairsForWheel.map(pair => {
      const aLon = placementLongitude(pair.a?.p);
      const bLon = placementLongitude(pair.b?.p);
      if (aLon == null || bLon == null) return '';
      const aPoint = zodiacPlotPoint(aLon, aspectAnchorRadius, cx, cy);
      const bPoint = zodiacPlotPoint(bLon, aspectAnchorRadius, cx, cy);
      const cls = String(pair.aspect?.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `<line class="chart-wheel-aspect chart-wheel-aspect-${cls}" data-aspect-a-kind="${escapeHtml(pair.a?.kind || 'chart')}" data-aspect-a-body="${escapeHtml(pair.a?.body || '')}" data-aspect-b-kind="${escapeHtml(pair.b?.kind || 'chart')}" data-aspect-b-body="${escapeHtml(pair.b?.body || '')}" data-aspect-name="${escapeHtml(pair.aspect?.name || '')}" data-aspect-chirality="${escapeHtml(pair.aspect?.chirality || 'neutral')}" data-aspect-orb="${escapeHtml(String(pair.aspect?.orb ?? ''))}" x1="${aPoint.x.toFixed(1)}" y1="${aPoint.y.toFixed(1)}" x2="${bPoint.x.toFixed(1)}" y2="${bPoint.y.toFixed(1)}"><title>${escapeHtml(pair.a?.body || '')} ${escapeHtml(pair.aspect?.name || 'aspect')} ${escapeHtml(pair.b?.body || '')} · orb ${escapeHtml(formatOrb(pair.aspect?.orb || 0))}</title></line>`;
    }).join('') : visibleEntries.flatMap((a, index) => visibleEntries.slice(index + 1).map(b => {
      if (a[3] === b[3] && a[0] === b[0]) return '';
      const aLon = placementLongitude(a[1]);
      const bLon = placementLongitude(b[1]);
      if (aLon == null || bLon == null) return '';
      const hits = aspectHitsForPlacementPair(a[1], b[1], activeAspectDefs, Number(ui.orb) || 0, ui.chirality || 'both');
      if (!hits.length) return '';
      const aPoint = zodiacPlotPoint(aLon, aspectAnchorRadius, cx, cy);
      const bPoint = zodiacPlotPoint(bLon, aspectAnchorRadius, cx, cy);
      const hit = hits[0];
      const cls = String(hit.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `<line class="chart-wheel-aspect chart-wheel-aspect-${cls}" data-aspect-a-kind="${escapeHtml(a[3])}" data-aspect-a-body="${escapeHtml(a[0])}" data-aspect-b-kind="${escapeHtml(b[3])}" data-aspect-b-body="${escapeHtml(b[0])}" data-aspect-name="${escapeHtml(hit.name || '')}" data-aspect-chirality="${escapeHtml(hit.chirality || 'neutral')}" data-aspect-orb="${escapeHtml(String(hit.orb ?? ''))}" x1="${aPoint.x.toFixed(1)}" y1="${aPoint.y.toFixed(1)}" x2="${bPoint.x.toFixed(1)}" y2="${bPoint.y.toFixed(1)}"><title>${escapeHtml(a[0])} ${escapeHtml(hit.name)} ${escapeHtml(b[0])} · orb ${escapeHtml(formatOrb(hit.orb))}</title></line>`;
    })).join('');

    const axisHtmlFor = (entries, kind, label) => {
      const rising = entries.find(([body]) => body === 'Rising' || String(body).toUpperCase() === 'ASC')?.[1];
      const mc = entries.find(([body]) => String(body).toUpperCase() === 'MC')?.[1];
      const axisLine = (placement, axis, aText, bText) => {
        const longitude = placementLongitude(placement);
        if (longitude == null) return '';
        const a = zodiacPlotPoint(longitude, geometry.coreWheelRadius, cx, cy);
        const b = zodiacPlotPoint(longitude + 180, geometry.coreWheelRadius, cx, cy);
        const aLabelPoint = zodiacPlotPoint(longitude, geometry.coreWheelRadius - 13, cx, cy);
        const bLabelPoint = zodiacPlotPoint(longitude + 180, geometry.coreWheelRadius - 13, cx, cy);
        return `<g class="chart-wheel-axis chart-wheel-axis-${escapeHtml(axis)} ${escapeHtml(kind)}"><line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}"></line><text x="${aLabelPoint.x.toFixed(1)}" y="${aLabelPoint.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(aText)}</text><text x="${bLabelPoint.x.toFixed(1)}" y="${bLabelPoint.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(bText)}</text><title>${escapeHtml(label)} ${escapeHtml(aText)} / ${escapeHtml(bText)} axis</title></g>`;
      };
      return `${axisLine(rising, 'asc', 'ASC', 'DSC')}${axisLine(mc, 'mc', 'MC', 'IC')}`;
    };
    const axes = ui.showA ? axisHtmlFor(visibleEntriesA, 'sky-a', aLabel) : '';
    const aspectKey = `<div class="chart-wheel-aspect-key" aria-label="Aspect color key"><span class="key-conjunction">☌ conjunction</span><span class="key-opposition">☍ opposition</span><span class="key-trine">△ trine</span><span class="key-square">□ square</span><span class="key-sextile">✶ sextile</span><span class="key-quincunx">⚻ quincunx</span></div>`;
    return `<section class="chart-wheel-panel unified-sky-wheel sky-relationships-wheel"><div class="chart-wheel-head"><h3>${escapeHtml(wheelTitle)}</h3><p class="generated-note">${escapeHtml(wheelHelp)}</p></div><p class="sky-ring-legend"><span class="legend-chip sky-a"></span> ${escapeHtml(aLabel)}${entriesB.length ? ` <span class="legend-sep">·</span> <span class="legend-chip sky-b"></span> ${escapeHtml(bLabel)}` : ''}</p>${aspectKey}<svg class="chart-wheel-plot" viewBox="-20 -20 600 600" role="img" aria-label="${escapeHtml(wheelTitle)}"><circle class="chart-wheel-core" cx="${cx}" cy="${cy}" r="${geometry.coreWheelRadius}"></circle><g class="chart-wheel-house-layer">${houseStructure}</g><g class="chart-wheel-all-aspects">${allAspectLines}</g><g class="chart-wheel-axes">${axes}</g><g class="chart-wheel-aspect-ranges">${arc}</g><g class="chart-wheel-selected-aspects">${selectedAspectLines}</g><g class="chart-wheel-sign-track">${signTrack}</g><g class="chart-wheel-markers">${markersA}${markersB}</g><circle class="chart-wheel-center" cx="${cx}" cy="${cy}" r="4"></circle></svg></section>`;
  }
  function skyRelationshipControlHtml(allPairs, filters) {
    return `<div class="sky-relationships-control-strip">${exactAspectControlHtml(allPairs, filters)}</div>`;
  }
  function renderSkyRelationshipsPanel(entriesA, entriesB) {
    const filters = exactAspectFilters();
    const cfg = skyChartModeConfig();
    let modeKey = 'aa';
    if (skyChartMode() === 'transit') modeKey = 'transit';
    else if (skyChartNeedsB()) modeKey = 'ab';
    const mode = skyAspectModeEntries(modeKey);
    const ui = skyAspectUiState();
    setSkyAspectUi({ mode:modeKey, showA: ui.showA !== false, showB: skyChartNeedsB() ? ui.showB !== false : false, orb:Number(filters.orb) || 0, chirality:filters.chirality || 'both' });
    const nextUi = skyAspectUiState();
    const maxOrb = Math.max(0, Number(filters.orb) || 0);
    const allPairs = exactAspectPairs(mode.entriesA, mode.entriesB || mode.entriesA, maxOrb, mode.relation, filters.chirality || 'both');
    const filtered = allPairs.filter(pair => exactAspectMatches(pair, filters));
    const note = relationshipModeNote(mode.relation, mode.labels);
    const empty = !allPairs.length ? `<p class="generated-note">No exact major aspects are within ${escapeHtml(formatOrb(maxOrb))}.</p>` : '';
    const details = filtered.length ? renderRelationshipMasterDetail(filtered, filters, mode.labels) : `<p class="generated-note">No exact aspects match the selected filters.</p>`;
    const relationshipTitle = (() => {
      const active = activePlacementFilterNames(filters);
      return active.length
        ? `Relationships: ${active.map(body => relationshipBodyGlyphLabel(body)).join(', ')}`
        : 'Relationships';
    })();
    const selectedPair = filtered.find(relationshipPairMatchesUiSelection) || filtered[0];
    const relationshipRows = filtered.length
      ? filtered.map(pair => relationshipListRowHtml(pair, pair === selectedPair, mode.labels)).join('')
      : '';
    const controls = skyRelationshipControlHtml(allPairs, filters);
    const listPanel = `<aside class="sky-relationships-side-panel sky-relationships-list-panel" aria-label="Exact relationships"><h4>Exact relationships</h4>${empty || (filtered.length ? `<div class="relationship-master-list"><h4>${escapeHtml(relationshipTitle)} <span>${filtered.length}</span></h4><div class="relationship-list-rows">${relationshipRows}</div></div>` : details)}</aside>`;
    const wheelPanel = `<div class="sky-relationships-wheel-panel"><div class="sky-relationships-wheel-controls" aria-label="Relationship filters">${controls}</div>${renderUnifiedSkyWheel(entriesA, entriesB, { plotPairs: filtered, titleText:'Relationship wheel', helpText:'' })}${listPanel}</div>`;
    const detailPanel = `<aside class="sky-relationships-side-panel sky-relationships-detail-panel" aria-label="Selected relationship"><h4>Selected relationship</h4>${selectedPair ? exactAspectCard(selectedPair, mode.labels[0], mode.labels[1]) : details}</aside>`;
    return `<section class="sky-relationships-panel" aria-label="Sky Relationships"><div class="sky-relationships-three-panel">${wheelPanel}${detailPanel}</div></section>`;
  }
  function renderSkyAspectModePanel() {
    return renderSkyRelationshipsPanel(skyEntries('chart'), skyChartNeedsB() ? skyEntries('currentSky') : []);
  }
  function compactSkyResultChip(kind, label, body, p) {
    const glyph = BODY_GLYPHS[body] || body;
    return `<button type="button" class="sky-result-pill sky-result-pill--compact ${escapeHtml(kind)}" data-filter-placement-body="${escapeHtml(body)}" title="${escapeHtml(label)} ${escapeHtml(body)} ${escapeHtml(p?.sign || '')} ${escapeHtml(placementDegreeText(p))}"><b>${escapeHtml(label)}</b><span>${escapeHtml(glyph)}</span><span>${escapeHtml(placementDegreeText(p))}</span></button>`;
  }
  function renderPlacementsBySign(entriesA, entriesB) {
    const aLabel = skyDisplayLabel('chart', 'Sky A');
    const bLabel = skyDisplayLabel('currentSky', 'Sky B');
    const rows = SIGNS.map(sign => {
      const items = [];
      entriesA.filter(([,p]) => p.sign === sign).forEach(([body,p]) => items.push(compactSkyResultChip('sky-a', aLabel, body, p)));
      entriesB.filter(([,p]) => p.sign === sign).forEach(([body,p]) => items.push(compactSkyResultChip('sky-b', bLabel, body, p)));
      if (!items.length) return '';
      return `<article class="sky-result-row sky-result-row--compact"><h4>${escapeHtml(SIGN_GLYPHS[sign] || '')} ${escapeHtml(sign)} <span>${items.length}</span></h4><div class="sky-result-chipline">${items.join('')}</div></article>`;
    }).join('');
    return `<details class="sky-results-section sky-results-section--compact"><summary>Results by sign</summary><div class="sky-result-list sky-result-list--compact">${rows || '<p class="generated-note">No placements yet.</p>'}</div></details>`;
  }
  function decanNameForPlacement(p) {
    const deg = p.degree == null || Number.isNaN(Number(p.degree)) ? 0 : Number(p.degree);
    const n = Math.min(3, Math.max(1, Math.floor(deg / 10) + 1));
    const start = (n - 1) * 10;
    const end = n * 10;
    return `${p.sign} decan ${n} (${start}°–${end}°)`;
  }
  function renderPlacementsByDecan(entriesA, entriesB) {
    const aLabel = skyDisplayLabel('chart', 'Sky A');
    const bLabel = skyDisplayLabel('currentSky', 'Sky B');
    const all = [...entriesA.map(([body,p]) => ({kind:'sky-a', label:aLabel, body, p})), ...entriesB.map(([body,p]) => ({kind:'sky-b', label:bLabel, body, p}))];
    const groups = {};
    all.forEach(item => { (groups[decanNameForPlacement(item.p)] ||= []).push(item); });
    const rows = Object.entries(groups).map(([key, items]) => {
      const card = decanCardFor(items[0].p.sign, items[0].p.degree);
      return `<article class="sky-result-row sky-result-row--compact"><h4>${escapeHtml(key)}${card ? ` — ${escapeHtml(cardTitle(card))}` : ''}<span>${items.length}</span></h4><div class="sky-result-chipline">${items.map(item => compactSkyResultChip(item.kind, item.label, item.body, item.p)).join('')}</div></article>`;
    }).join('');
    return `<details class="sky-results-section sky-results-section--compact"><summary>Results by decan</summary><div class="sky-result-list sky-result-list--compact">${rows || '<p class="generated-note">No decan placements yet.</p>'}</div></details>`;
  }
  function bindUnifiedSkyControls() {
    const root = $('chartOutput');
    if (!root) return;
    qsa('[data-sky-ui]', root).forEach(control => {
      const key = control.dataset.skyUi;
      const handler = () => {
        if (key === 'showA' || key === 'showB') setSkyAspectUi({ [key]: !!control.checked });
        else if (key === 'orb') { setSkyAspectUi({ orb: Number(control.value) || 0 }); state.transitFilters = { ...(state.transitFilters || {}), orb: String(Number(control.value) || 0) }; }
        else { setSkyAspectUi({ [key]: control.value }); if (key === 'chirality') state.transitFilters = { ...(state.transitFilters || {}), chirality: control.value || 'both' }; }
        renderChart();
      };
      control.addEventListener(key === 'orb' ? 'input' : 'change', handler);
    });
    const setAspectHover = line => {
      const aKind = line?.dataset.aspectAKind || '';
      const aBody = line?.dataset.aspectABody || '';
      const bKind = line?.dataset.aspectBKind || '';
      const bBody = line?.dataset.aspectBBody || '';
      root.classList.toggle('is-aspect-hovering', !!line);
      qsa('.chart-wheel-aspect', root).forEach(item => item.classList.toggle('is-hovered-aspect', item === line));
      qsa('[data-sky-point-kind][data-sky-point-body]', root).forEach(point => {
        const hit = !!line && ((point.dataset.skyPointKind === aKind && point.dataset.skyPointBody === aBody) || (point.dataset.skyPointKind === bKind && point.dataset.skyPointBody === bBody));
        point.classList.toggle('is-aspect-endpoint', hit);
        point.classList.toggle('is-aspect-dimmed', !!line && !hit);
      });
    };
    qsa('.chart-wheel-aspect[data-aspect-a-kind]', root).forEach(line => {
      line.addEventListener('mouseenter', () => setAspectHover(line));
      line.addEventListener('focus', () => setAspectHover(line));
      line.addEventListener('mouseleave', () => setAspectHover(null));
      line.addEventListener('blur', () => setAspectHover(null));
      line.addEventListener('click', event => {
        event.preventDefault();
        if (userHasTextSelection()) return;
        const chirality = ['left','right'].includes(line.dataset.aspectChirality) ? line.dataset.aspectChirality : 'both';
        setSkyAspectUi({
          selected:{ kind:line.dataset.aspectAKind || 'chart', body:line.dataset.aspectABody || '' },
          selectedRelationship:{
            sourceKind:line.dataset.aspectAKind || 'chart',
            sourceBody:line.dataset.aspectABody || '',
            targetKind:line.dataset.aspectBKind || 'chart',
            targetBody:line.dataset.aspectBBody || '',
            orb:line.dataset.aspectOrb || ''
          },
          aspect:line.dataset.aspectName || skyAspectUiState().aspect,
          chirality,
          showA:true,
          showB:skyChartNeedsB()
        });
        renderChart();
      });
    });
    qsa('[data-sky-aspect-mode]', root).forEach(control => control.addEventListener('click', () => {
      const mode = control.dataset.skyAspectMode;
      state.transitFilters = state.transitFilters || { aspect:[], house:[], sign:[], placement:[], orb:'3', chirality:'both' };
      if (mode === 'major') state.transitFilters.aspect = EXACT_ASPECT_DEFS.filter(def => def.family === 'major').map(def => def.name);
      else if (mode === 'none') state.transitFilters.aspect = ['__none'];
      else state.transitFilters.aspect = [];
      renderChart();
    }));
    qsa('[data-sky-aspect-toggle]', root).forEach(control => control.addEventListener('click', () => {
      const name = control.dataset.skyAspectToggle;
      state.transitFilters = state.transitFilters || { aspect:[], house:[], sign:[], placement:[], orb:'3', chirality:'both' };
      const selected = new Set(selectedAspectNames(state.transitFilters));
      const wasActive = !aspectSelectionIsNone(state.transitFilters) && (!selected.size || selected.has(name));
      if (!selected.size && !aspectSelectionIsNone(state.transitFilters)) EXACT_ASPECT_DEFS.forEach(def => selected.add(def.name));
      if (wasActive) selected.delete(name); else selected.add(name);
      state.transitFilters.aspect = selected.size === 0 ? ['__none'] : selected.size === EXACT_ASPECT_DEFS.length ? [] : Array.from(selected);
      renderChart();
    }));
    qsa('[data-sky-point-kind][data-sky-point-body]', root).forEach(node => {
      const lift = () => {
        const parent = node.parentNode;
        if (parent && parent.lastChild !== node) parent.appendChild(node);
      };
      // Keep hover static: do not reorder SVG nodes while the pointer is resting on them.
      // Selected/focused points are already rendered with visual emphasis.
      if (node.classList.contains('is-selected') || node.classList.contains('is-focused-target')) lift();
      const select = () => {
        lift();
        if (userHasTextSelection()) return;
        const kind = node.dataset.skyPointKind;
        const body = node.dataset.skyPointBody;
        const currentUi = skyAspectUiState();
        const currentFilter = selectedValuesFromMaybeArray(exactAspectFilters().placement);
        const isSameSelected = currentUi.selected && currentUi.selected.kind === kind && currentUi.selected.body === body && !currentUi.selectedRelationship;
        if (isSameSelected && currentFilter.length === 1 && currentFilter[0] === body) {
          state.transitFilters = { ...(state.transitFilters || {}), placement: [] };
          setSkyAspectUi({ selected:null, selectedRelationship:null });
        } else {
          state.transitFilters = { ...(state.transitFilters || {}), placement: [body], aspect: [] };
          setSkyAspectUi({ selected:{ kind, body }, selectedRelationship:null, showA: currentUi.showA || kind === 'chart', showB: currentUi.showB || kind === 'currentSky' });
        }
        renderChart();
      };
      node.addEventListener('click', select);
      node.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); } });
    });
    qsa('[data-aspect-focus-kind][data-aspect-focus-body][data-aspect-focus-aspect]', root).forEach(node => {
      node.addEventListener('click', event => {
        event.preventDefault();
        if (userHasTextSelection()) return;
        const selectedRelationship = node.dataset.aspectFocusTargetBody ? {
          sourceKind: node.dataset.aspectFocusKind || 'chart',
          sourceBody: node.dataset.aspectFocusBody || '',
          targetKind: node.dataset.aspectFocusTargetKind || 'chart',
          targetBody: node.dataset.aspectFocusTargetBody || '',
          orb: node.dataset.aspectFocusOrb || ''
        } : null;
        const chirality = ['left','right'].includes(node.dataset.aspectFocusChirality) ? node.dataset.aspectFocusChirality : 'both';
        const showA = (node.dataset.aspectFocusKind === 'chart') || (node.dataset.aspectFocusTargetKind === 'chart') || skyAspectUiState().showA;
        const showB = (node.dataset.aspectFocusKind === 'currentSky') || (node.dataset.aspectFocusTargetKind === 'currentSky') || skyAspectUiState().showB;
        setSkyAspectUi({ selected:{ kind:node.dataset.aspectFocusKind, body:node.dataset.aspectFocusBody }, selectedRelationship, aspect:node.dataset.aspectFocusAspect, chirality, showA, showB });
        renderChart();
      });
    });
  }

  function renderChart() {
    if ($('chartSkyName') || $('chartSkyNotes')) readSkyMeta('chart');
    if ($('chartForm')?.querySelector('.placement-sign')) readChartForm();
    if ($('skyCreatorTarget')) readSkyCreatorMeta();
    let chart = state.chart || {};
    let currentSky = state.currentSky || {};
    let entriesA = Object.entries(chart).filter(([,p]) => p?.sign);
    let entriesB = Object.entries(currentSky).filter(([,p]) => p?.sign);
    if (!entriesA.length && recoverSkyFromPaste('chart')) { chart = state.chart || {}; entriesA = Object.entries(chart).filter(([,p]) => p?.sign); }
    if (!entriesB.length && recoverSkyFromPaste('currentSky')) { currentSky = state.currentSky || {}; entriesB = Object.entries(currentSky).filter(([,p]) => p?.sign); }
    if (entriesA.length) syncSkyPasteFromPlacements('chart', chart, true);
    if (entriesB.length) syncSkyPasteFromPlacements('currentSky', currentSky, true);
    entriesA = skyEntries('chart');
    entriesB = skyChartNeedsB() ? skyEntries('currentSky') : [];
    const aLabel = skyDisplayLabel('chart', 'Sky A');
    const bLabel = skyDisplayLabel('currentSky', 'Sky B');
    const aIntro = `${state.chartNotes && !isGeneratedSkyCalculationNote(state.chartNotes) ? `<p class="generated-note">${escapeHtml(state.chartNotes).replace(/\n/g,'<br>')}</p>` : ''}`;
    const bIntro = skyChartNeedsB() ? `${state.currentSkyNotes && !isGeneratedSkyCalculationNote(state.currentSkyNotes) ? `<p class="generated-note">${escapeHtml(state.currentSkyNotes).replace(/\n/g,'<br>')}</p>` : ''}` : '';
    const hasEntries = entriesA.length || entriesB.length;
    const relationships = renderSkyRelationshipsPanel(entriesA, entriesB);
    const unifiedResults = renderUnifiedChartResults(entriesA, entriesB);
    const output = $('chartOutput');
    if (!output) return;
    const skyResultsHeading = isDedicatedSkyChartPage() ? (entriesB.length ? 'Sky comparison' : 'Sky placements') : 'Sky Ledger';
    output.innerHTML = hasEntries
      ? `<h3>${skyResultsHeading}</h3>${aIntro}${bIntro}${relationships}${unifiedResults}`
      : '<p>No placements entered yet.</p>';
    const hiddenB = $('currentSkyOutput');
    if (hiddenB) { hiddenB.hidden = true; hiddenB.innerHTML = ''; }
    bindUnifiedSkyControls();
    bindExactAspectFilters('chartOutput');
    bindUnifiedChartResults('chartOutput');
    applyChartResultFilters('chartOutput');
    qsa('button[data-id]', $('chartOutput')).forEach(btn => btn.addEventListener('click', () => openFullEntryById(btn.dataset.id)));
    updateSkyCreatorDrawerState();
  }

  function skySlotStorageKey(kind) {
    if (isDedicatedSkyChartPage()) return kind === 'currentSky' ? 'relphiSkyChartB' : 'relphiSkyChartA';
    return kind === 'currentSky' ? 'relphiCurrentSky' : 'relphiTarotChart';
  }
  function saveChart() { readChartForm(); readSkyMeta('chart'); localStorage.setItem(skySlotStorageKey('chart'), JSON.stringify({ name: state.chartName, notes: state.chartNotes, placements: state.chart })); upsertSkyLibrary('chart', state.chartName, state.chartNotes, state.chart, currentSkyCalcProfile('chart')); renderChart(); }
  function loadChart() { const saved = localStorage.getItem(skySlotStorageKey('chart')); if (saved) { const payload = JSON.parse(saved); const placements = payload.placements || payload; writeSkyMeta('chart', payload.name || '', payload.notes || ''); setSkyCalcProfile('chart', meaningfulSkyCalcProfile({ ...(payload.calcProfile || parseSkyCalcProfileFromText(payload.name || '', payload.notes || '')), name: payload.name || '' })); if (skyCalcTargetKind() === 'chart') hydrateSkyCalculationPanel('chart', { force:true }); writeChartForm(placements); setTimeout(() => { readChartForm(); renderChart(); }, 0); } }
  function clearChart() { writeSkyMeta('chart', '', ''); writeChartForm({}); }

  function openCurrentSky() { setSkyCreatorKind('currentSky'); openChart(); }
  function renderCurrentSkyForm() { if ($('skyCreatorForm')) renderSkyCreator(); else renderPlacementBuilder('currentSky'); }
  function readCurrentSkyForm() {
    const form = $('currentSkyForm');
    const oldRows = form ? qsa('.placement-row', form) : [];
    if (oldRows.length) {
      const currentSky = {};
      oldRows.forEach(row => { const body = row.dataset.body; const sign = row.querySelector('.placement-sign').value; const degree = row.querySelector('.placement-degree').value; const minute = row.querySelector('.placement-minute').value; const house = row.querySelector('.placement-house')?.value || ''; const retrograde = row.querySelector('.placement-retro').checked; if (sign) currentSky[body] = { sign, degree: degree === '' ? null : Number(degree), minute: minute === '' ? null : Number(minute), house: house === '' ? null : Number(house), retrograde }; });
      state.currentSky = currentSky;
    }
    return state.currentSky || {};
  }
  function writeCurrentSkyForm(currentSky, options = {}) {
    state.currentSky = { ...(currentSky || {}) };
    if ($('skyCreatorForm') && skyCreatorKind() === 'currentSky') renderSkyCreator(); else { renderCurrentSkyForm(); renderPlacementStrip('currentSky'); }
    if (!options.skipPasteSync) syncSkyPasteFromPlacements('currentSky', state.currentSky || {}, !!options.forcePasteSync);
    if (!options.skipRender) renderCurrentSky();
  }
  const SKY_LIBRARY_KEY = 'relphiSkyLibraryV1';
  function skyFields(kind) {
    return kind === 'currentSky'
      ? { name:'currentSkyName', notes:'currentSkyNotes', select:'currentSkyLibrary', list:'currentSkyLibraryList', file:'currentSkyTextFile', typeLabel:skyRoleLabel('currentSky','Sky B'), stateKey:'currentSky', nameKey:'currentSkyName', notesKey:'currentSkyNotes' }
      : { name:'chartSkyName', notes:'chartSkyNotes', select:'chartSkyLibrary', list:'chartSkyLibraryList', file:'chartSkyTextFile', typeLabel:skyRoleLabel('chart','Sky A'), stateKey:'chart', nameKey:'chartName', notesKey:'chartNotes' };
  }
  function skyDisplayLabel(kind, fallback) {
    const f = skyFields(kind);
    const name = String(state[f.nameKey] || '').trim();
    return name || skyRoleLabel(kind, fallback || f.typeLabel);
  }
  function readSkyMeta(kind) {
    const f = skyFields(kind);
    const nameEl = $(f.name), notesEl = $(f.notes);
    if (nameEl) state[f.nameKey] = nameEl.value.trim().slice(0, 100);
    if (notesEl) state[f.notesKey] = notesEl.value.slice(0, 4000);
  }
  function writeSkyMeta(kind, name, notes) {
    const f = skyFields(kind);
    state[f.nameKey] = String(name || '').slice(0, 100);
    state[f.notesKey] = String(notes || '').slice(0, 4000);
    if ($(f.name)) $(f.name).value = state[f.nameKey];
    if ($(f.notes)) $(f.notes).value = state[f.notesKey];
  }
  function cloneSkySlotValue(value) {
    try { return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)); }
    catch (error) { return JSON.parse(JSON.stringify(value || {})); }
  }
  function captureSkySlot(kind) {
    const targetKind = kind === 'currentSky' ? 'currentSky' : 'chart';
    const f = skyFields(targetKind);
    return {
      placements: cloneSkySlotValue(state[f.stateKey] || {}),
      name: state[f.nameKey] || '',
      notes: state[f.notesKey] || '',
      calcProfile: cloneSkySlotValue(currentSkyCalcProfile(targetKind))
    };
  }
  function restoreSkySlot(kind, snapshot) {
    if (!snapshot) return;
    const targetKind = kind === 'currentSky' ? 'currentSky' : 'chart';
    const f = skyFields(targetKind);
    state[f.stateKey] = cloneSkySlotValue(snapshot.placements || {});
    state[f.nameKey] = String(snapshot.name || '');
    state[f.notesKey] = String(snapshot.notes || '');
    setSkyCalcProfile(targetKind, cloneSkySlotValue(snapshot.calcProfile || {}));
  }
  function getSkyLibrary() {
    try { const parsed = JSON.parse(localStorage.getItem(SKY_LIBRARY_KEY) || '[]'); return Array.isArray(parsed) ? parsed : []; }
    catch (error) { return []; }
  }
  function setSkyLibrary(list) { localStorage.setItem(SKY_LIBRARY_KEY, JSON.stringify(list.slice(0, 80))); }
  function selectedSkyLibraryRecord(kind = skyCreatorKind()) {
    const targetKind = kind === 'currentSky' ? 'currentSky' : 'chart';
    state.skyLibrarySelection = { chart:'', currentSky:'', ...(state.skyLibrarySelection || {}) };
    const selectedId = state.skyLibrarySelection[targetKind] || '';
    const library = getSkyLibrary();
    if (selectedId) {
      const selected = library.find(item => item.id === selectedId);
      if (selected) return selected;
    }
    const meta = skyFields(targetKind);
    const name = String(state[meta.nameKey] || '').trim().toLowerCase();
    if (!name) return null;
    return library.find(item => item.kind === targetKind && String(item.name || '').trim().toLowerCase() === name)
      || library.find(item => String(item.name || '').trim().toLowerCase() === name)
      || null;
  }
  function updateSkyCreatorDeleteStoredButton() {
    const button = $('skyCreatorDeleteStored');
    if (!button) return;
    if (skyCreatorNameIsLibrarySearch()) {
      button.hidden = true;
      button.disabled = true;
      return;
    }
    const kind = skyCreatorKind();
    const record = selectedSkyLibraryRecord(kind);
    button.hidden = !record;
    button.disabled = !record;
    button.dataset.skyRecordId = record?.id || '';
    button.textContent = record ? `Delete stored sky: ${record.name}` : 'Delete stored sky';
  }
  function replaceSkyLibraryRecord(recordId, patch = {}) {
    if (!recordId) return null;
    const library = getSkyLibrary();
    const index = library.findIndex(item => item.id === recordId);
    if (index < 0) return null;
    const updated = { ...library[index], ...patch, id:library[index].id, savedAt:new Date().toISOString(), savedAtLocal:localTimestampLabel(new Date()) };
    library[index] = updated;
    setSkyLibrary(library);
    refreshSkyLibrarySelects();
    return updated;
  }
  function deleteSelectedSkyCreatorRecord() {
    const kind = skyCreatorKind();
    const button = $('skyCreatorDeleteStored');
    const requestedId = button?.dataset?.skyRecordId || state.skyLibrarySelection?.[kind] || '';
    const record = getSkyLibrary().find(item => item.id === requestedId) || selectedSkyLibraryRecord(kind);
    if (!record) {
      updateSkyCreatorDeleteStoredButton();
      return false;
    }
    if (!window.confirm(`Delete the stored sky “${record.name}”? The sky currently open on the wheel will remain until you clear or replace it.`)) return false;
    setSkyLibrary(getSkyLibrary().filter(item => item.id !== record.id));
    const selections = { chart:'', currentSky:'', ...(state.skyLibrarySelection || {}) };
    if (selections.chart === record.id) selections.chart = '';
    if (selections.currentSky === record.id) selections.currentSky = '';
    state.skyLibrarySelection = selections;
    refreshSkyLibrarySelects();
    refreshSkyCreatorLibrary();
    renderSkyCreatorSuggestions();
    updateSkyCreatorDeleteStoredButton();
    return true;
  }
  function recalculableSkyRecordProfile(record) {
    const parsedLegacyProfile = parseSkyCalcProfileFromText(record?.name || '', record?.notes || '');
    return meaningfulSkyCalcProfile({ ...parsedLegacyProfile, ...(record?.calcProfile || {}) });
  }
  function skyRecordHasRecalculableProfile(record) {
    const profile = recalculableSkyRecordProfile(record);
    // A complete saved date/place profile is authoritative. Older records may
    // keep that profile in their legacy name/notes metadata rather than the
    // calcProfile field. Recalculate either form on load so stale placements
    // cannot survive beside reproducible date, place, and time-zone data.
    return !!String(profile.dateTime || '').trim()
      && !!String(profile.latitude || '').trim()
      && !!String(profile.longitude || '').trim();
  }
  function refreshedCalculatedSkyRecord(record) {
    if (!skyRecordHasRecalculableProfile(record) || !window.Astronomy) return record;
    try {
      const profile = recalculableSkyRecordProfile(record);
      const date = dateFromLocalDateTimeInZone(profile.dateTime, profile.timeZone || '');
      const calculated = calculateSkyWithAstronomy(date, profile.latitude, profile.longitude, profile.houseSystem || 'whole-sign');
      const prefersAscLabel = !!record?.placements?.ASC && !record?.placements?.Rising;
      if (prefersAscLabel && calculated.Rising) {
        calculated.ASC = calculated.Rising;
        delete calculated.Rising;
      }
      const custom = {};
      Object.entries(record.placements || {}).forEach(([body, placement]) => {
        if (!SKY_CALC_BODIES.includes(body) && body !== 'Rising' && body !== 'ASC' && body !== 'MC' && !String(body).startsWith('_')) {
          custom[body] = cloneSkySlotValue(placement);
        }
      });
      return { ...record, placements:{ ...custom, ...calculated }, calcProfile:profile };
    } catch (error) {
      return record;
    }
  }
  function skyRecordName(kind, name) { return String(name || '').trim() || `${skyFields(kind).typeLabel} ${localTimestampLabel(new Date())}`; }
  function upsertSkyLibrary(kind, name, notes, placements, calcProfile=null) {
    const recordName = skyRecordName(kind, name);
    const id = `${kind}:${slug(recordName) || Date.now()}`;
    const next = getSkyLibrary().filter(item => !(item.kind === kind && item.name === recordName));
    const record = { id, kind, name: recordName, notes: String(notes || ''), placements: placements || {}, calcProfile: calcProfile || currentSkyCalcProfile(kind), savedAt: new Date().toISOString(), savedAtLocal: localTimestampLabel(new Date()) };
    next.unshift(record);
    setSkyLibrary(next);
    refreshSkyLibrarySelects();
    return record;
  }
  function refreshSkyLibrarySelects() {
    ['chart','currentSky'].forEach(kind => {
      const f = skyFields(kind);
      const options = getSkyLibrary().filter(item => item.kind === kind);
      const select = $(f.select);
      if (select) {
        const current = select.value;
        select.innerHTML = `<option value="">Choose saved sky…</option>` + options.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('');
        if (options.some(item => item.id === current)) select.value = current;
      }
      const list = $(f.list);
      if (list) list.innerHTML = options.map(item => `<option value="${escapeHtml(item.name)}"></option>`).join('');
    });
    if ($('skyCreatorLibrary')) refreshSkyCreatorLibrary();
  }
  function normalizeSkyBody(raw) {
    const clean = String(raw || '').trim().replace(/[^A-Za-z0-9 ]/g, '').replace(/\s+/g, '');
    const lower = clean.toLowerCase();
    if (lower === 'asc' || lower === 'ascendant' || lower === 'rising') return 'Rising';
    if (lower === 'mc' || lower === 'midheaven') return 'MC';
    if (/^h?0?1$/.test(lower) || /^h?10$/.test(lower)) return '';
    if (lower === 'northnode' || lower === 'nnode') return 'Node';
    if (lower === 'partoffortune' || lower === 'pof') return 'Fortune';
    const found = [...BODIES, ...CURRENT_BODIES].find(body => body.toLowerCase() === lower);
    return found || '';
  }
  function serializeSkyText(kind, placements, name, notes) {
    const profile = currentSkyCalcProfile(kind);
    const lines = ['Oracle of Relphi Sky', `Kind: ${kind}`, `Name: ${skyRecordName(kind, name)}`];
    if (profile.dateTime) lines.push(`Calculation Date: ${profile.dateTime}`);
    if (profile.latitude) lines.push(`Latitude: ${profile.latitude}`);
    if (profile.longitude) lines.push(`Longitude: ${profile.longitude}`);
    if (profile.location) lines.push(`Location: ${profile.location}`);
    if (profile.houseSystem) lines.push(`House System: ${skyHouseSystemLabel(profile.houseSystem)}`);
    lines.push('Notes:');
    String(notes || '').split(/\r?\n/).forEach(line => lines.push(line));
    lines.push('Placements:', 'Body,Sign,Degree,Minute,House,Retrograde');
    Object.entries(placements || {}).forEach(([body, p]) => {
      if (!p || !p.sign) return;
      lines.push([body, p.sign || '', p.degree ?? '', p.minute ?? '', p.house ?? '', p.retrograde ? 'R' : ''].join(','));
    });
    return lines.join('\n') + '\n';
  }
  function parseSkyText(text) {
    const result = { kind:'chart', name:'', notes:'', placements:{}, calcProfile:{} };
    let section = '';
    const noteLines = [];
    String(text || '').split(/\r?\n/).forEach(rawLine => {
      const line = rawLine.trim();
      if (!line) { if (section === 'notes') noteLines.push(''); return; }
      const kindMatch = line.match(/^Kind\s*:\s*(.+)$/i); if (kindMatch) { result.kind = kindMatch[1].trim() === 'currentSky' ? 'currentSky' : 'chart'; return; }
      const nameMatch = line.match(/^Name\s*:\s*(.+)$/i); if (nameMatch) { result.name = nameMatch[1].trim(); return; }
      const calcDateMatch = line.match(/^Calculation Date\s*:\s*(.+)$/i); if (calcDateMatch) { result.calcProfile.dateTime = normalizeLocalDateTimeValue(calcDateMatch[1].trim()); return; }
      const latMatch = line.match(/^Latitude\s*:\s*(.+)$/i); if (latMatch) { result.calcProfile.latitude = latMatch[1].trim(); return; }
      const lonMatch = line.match(/^Longitude\s*:\s*(.+)$/i); if (lonMatch) { result.calcProfile.longitude = lonMatch[1].trim(); return; }
      const locMatch = line.match(/^Location\s*:\s*(.+)$/i); if (locMatch) { result.calcProfile.location = locMatch[1].trim(); return; }
      const systemMatch = line.match(/^House System\s*:\s*(.+)$/i); if (systemMatch) { const t = systemMatch[1].trim(); result.calcProfile.houseSystem = normalizeSkyHouseSystem(t); return; }
      if (/^Notes\s*:?$/i.test(line)) { section = 'notes'; return; }
      if (/^Placements\s*:?$/i.test(line)) { section = 'placements'; return; }
      if (/^Body\s*,\s*Sign/i.test(line)) return;
      if (section === 'notes') { noteLines.push(rawLine.replace(/^>\s?/, '')); return; }
      const parts = line.split(',').map(part => part.trim());
      if (parts.length >= 2) {
        const body = normalizeSkyBody(parts[0]);
        const sign = SIGNS.find(s => s.toLowerCase() === String(parts[1] || '').toLowerCase()) || '';
        if (body && sign) {
          const dm = String(parts[2] || '').match(/(\d{1,2})(?:\D+(\d{1,2}))?/);
          let degree = dm ? Number(dm[1]) : (parts[2] === '' || parts[2] == null ? null : Number(parts[2]));
          let minute = dm && dm[2] != null ? Number(dm[2]) : (parts[3] === '' || parts[3] == null ? null : Number(parts[3]));
          const house = parts[4] === '' || parts[4] == null ? null : Number(parts[4]);
          result.placements[body] = { sign, degree: Number.isFinite(degree) ? degree : null, minute: Number.isFinite(minute) ? minute : null, house: Number.isFinite(house) ? house : null, retrograde: /^r|true|yes|1$/i.test(parts[5] || '') };
        }
      }
    });
    result.notes = noteLines.join('\n').trim();
    const astroSeekPlacements = parseAstroSeekPositions(text);
    // Merge AstroSeek-style parsing even when the comma parser captured only the first body.
    // This lets one-line strings like "Sun,Cancer,2°55' Moon,Scorpio,1°40' ..." open Sky Chart.
    if (Object.keys(astroSeekPlacements || {}).length) {
      result.placements = { ...result.placements, ...astroSeekPlacements };
    }
    return result;
  }
  function placementPasteLine(body, p) {
    if (!p || !p.sign) return '';
    const minute = p.minute == null || Number.isNaN(Number(p.minute)) ? 0 : Number(p.minute);
    const degree = p.degree == null || Number.isNaN(Number(p.degree)) ? '' : `${Number(p.degree)}°${String(minute).padStart(2, '0')}′`;
    const parts = [body, p.sign, degree, p.house || '', p.retrograde ? 'R' : ''];
    return parts.join(',').replace(/,+$/,'');
  }
  function placementsPasteText(placements) {
    return Object.entries(placements || {}).filter(([,p]) => p && p.sign).map(([body,p]) => placementPasteLine(body,p)).filter(Boolean).join('\n');
  }
  function textLooksLikePlacementList(text) {
    const value = String(text || '').trim();
    if (!value) return false;
    const parsed = parseSkyText(value).placements || {};
    return Object.keys(parsed).length >= 2;
  }
  function normalizeLoadedSkyPayload(payload = {}) {
    const notes = String(payload.notes || '');
    const noteParsed = textLooksLikePlacementList(notes) ? parseSkyText(notes) : null;
    const mergedPlacements = { ...(noteParsed?.placements || {}), ...(payload.placements || {}) };
    const cleanedNotes = noteParsed ? '' : notes;
    const calcProfile = payload.calcProfile && Object.keys(payload.calcProfile || {}).length
      ? payload.calcProfile
      : (noteParsed?.calcProfile || {});
    return { ...payload, notes: cleanedNotes, placements: mergedPlacements, calcProfile };
  }
  function syncSkyPasteFromPlacements(kind, placements, force = false) {
    const targetKind = kind === 'currentSky' ? 'currentSky' : 'chart';
    const creatorBox = $('skyCreatorPaste');
    const box = creatorBox && skyCreatorKind() === targetKind ? creatorBox : $(targetKind === 'currentSky' ? 'currentSkyAstroSeekPaste' : 'astroSeekPaste');
    if (!box) return;
    if (creatorBox && box === creatorBox) box.dataset.skyKind = targetKind;
    if (!force && document.activeElement === box) return;
    box.value = placementsPasteText(placements);
  }

  function exportSkyText(kind) {
    const f = skyFields(kind);
    if (kind === 'currentSky') readCurrentSkyForm(); else readChartForm();
    readSkyMeta(kind);
    const placements = state[f.stateKey] || {};
    const name = state[f.nameKey] || '';
    const notes = state[f.notesKey] || '';
    if (!Object.keys(placements).length) return;
    const text = serializeSkyText(kind, placements, name, notes);
    download(`${slug(skyRecordName(kind, name)) || kind}-${localTimestampSlug(new Date())}.txt`, text, 'text/plain');
    upsertSkyLibrary(kind, name, notes, placements, currentSkyCalcProfile(kind));
  }
  function applySkyPayload(kind, payload, options = {}) {
    payload = normalizeLoadedSkyPayload(payload || {});
    const f = skyFields(kind);
    const placements = payload.placements || {};
    writeSkyMeta(kind, payload.name || state[f.nameKey] || '', payload.notes || '');
    const parsedProfile = payload.calcProfile && Object.keys(payload.calcProfile).length ? payload.calcProfile : parseSkyCalcProfileFromText(payload.name || state[f.nameKey] || '', payload.notes || '');
    const profile = meaningfulSkyCalcProfile({ ...parsedProfile, name: payload.name || state[f.nameKey] || '' });
    setSkyCalcProfile(kind, profile);
    if (skyCalcTargetKind() === kind) hydrateSkyCalculationPanel(kind, { force:true });
    if (kind === 'currentSky') { writeCurrentSkyForm(placements, { forcePasteSync:true }); state.currentSky = placements; syncSkyPasteFromPlacements('currentSky', placements, true); renderCurrentSky(); }
    else { writeChartForm(placements, { forcePasteSync:true }); state.chart = placements; syncSkyPasteFromPlacements('chart', placements, true); renderChart(); }
    if (options.persist !== false) upsertSkyLibrary(kind, state[f.nameKey], state[f.notesKey], placements, currentSkyCalcProfile(kind));
  }
  async function importSkyTextFile(kind, file) {
    if (!file) return;
    const text = await file.text();
    const parsed = parseSkyText(text);
    applySkyPayload(kind, parsed);
  }
  function loadSkyFromLibrary(kind) {
    const targetKind = kind === 'currentSky' ? 'currentSky' : 'chart';
    const protectedKind = targetKind === 'currentSky' ? 'chart' : 'currentSky';
    const protectedSnapshot = captureSkySlot(protectedKind);
    const f = skyFields(targetKind);
    const select = $(f.select);
    const id = select?.value || '';
    const selectedName = select?.selectedOptions?.[0]?.textContent || '';
    const typedName = $(f.name)?.value?.trim() || '';
    const library = getSkyLibrary();
    const lowerTyped = typedName.toLowerCase();
    let record = library.find(item => item.id === id)
      || library.find(item => item.kind === targetKind && item.name === selectedName)
      || library.find(item => item.name === selectedName)
      || library.find(item => item.kind === targetKind && item.name.toLowerCase() === lowerTyped)
      || library.find(item => item.name.toLowerCase() === lowerTyped)
      || (lowerTyped ? library.find(item => item.kind === targetKind && item.name.toLowerCase().startsWith(lowerTyped)) : null)
      || (lowerTyped ? library.find(item => item.name.toLowerCase().startsWith(lowerTyped)) : null);
    if (!record) return false;
    const refreshed = refreshedCalculatedSkyRecord(record);
    if (refreshed !== record || refreshed.placements !== record.placements) {
      record = replaceSkyLibraryRecord(record.id, {
        name:refreshed.name,
        notes:refreshed.notes,
        placements:refreshed.placements,
        calcProfile:refreshed.calcProfile
      }) || refreshed;
    }
    state.skyLibrarySelection = { chart:'', currentSky:'', ...(state.skyLibrarySelection || {}) };
    state.skyLibrarySelection[targetKind] = record.id || '';
    applySkyPayload(targetKind, record, { persist:false });
    restoreSkySlot(protectedKind, protectedSnapshot);
    setSkyEntrySource(targetKind, 'stored');
    updateSkyCreatorDeleteStoredButton();
    return true;
  }
  function bindSkyWorkbench(kind) {
    const f = skyFields(kind);
    const nameEl = $(f.name), notesEl = $(f.notes);
    if (nameEl) {
      nameEl.addEventListener('input', () => readSkyMeta(kind));
      nameEl.addEventListener('change', () => loadSkyFromLibrary(kind));
    }
    if (notesEl) notesEl.addEventListener('input', () => readSkyMeta(kind));
    const exportBtn = $(kind === 'currentSky' ? 'exportCurrentSkyText' : 'exportChartSkyText');
    const importBtn = $(kind === 'currentSky' ? 'importCurrentSkyText' : 'importChartSkyText');
    const fileEl = $(f.file);
    const loadBtn = $(kind === 'currentSky' ? 'loadCurrentSkyFromLibrary' : 'loadChartSkyFromLibrary');
    if (exportBtn) exportBtn.addEventListener('click', () => exportSkyText(kind));
    if (importBtn && fileEl) importBtn.addEventListener('click', () => fileEl.click());
    if (fileEl) fileEl.addEventListener('change', () => { importSkyTextFile(kind, fileEl.files?.[0]); fileEl.value = ''; });
    if (loadBtn) loadBtn.addEventListener('click', () => loadSkyFromLibrary(kind));
  }


  function skyCreatorFields() {
    return { name:'skyCreatorName', notes:'skyCreatorNotes', select:'skyCreatorLibrary', list:'skyCreatorLibraryList', suggestions:'skyCreatorSuggestions', file:'skyCreatorTextFile', paste:'skyCreatorPaste' };
  }
  function skyCreatorLabel(kind) { return skyRoleLabel(kind, kind === 'currentSky' ? 'Sky B' : 'Sky A'); }
  function defaultSkyName(kind = 'chart', date = new Date(), timeZone = '') { return `${skyCreatorLabel(kind)} · ${timestampLabelInZone(date, timeZone)}`; }
  function skyPlacementCount(kind) {
    return Object.values(kind === 'currentSky' ? (state.currentSky || {}) : (state.chart || {})).filter(p => p?.sign).length;
  }
  function skyLoadedSummary(kind) {
    const label = kind === 'currentSky' ? 'Sky B' : 'Sky A';
    const count = skyPlacementCount(kind);
    if (!count) return `${label}: empty`;
    return `${label}: ${skyProvenanceLabel(kind)} · ${count} placement${count === 1 ? '' : 's'}`;
  }
  function updateSkyResultsToolbar() {
    const toolbar = $('skyResultsToolbar');
    const label = $('skyResultsToolbarLabel');
    if (!toolbar || !label) return;
    const countA = skyPlacementCount('chart');
    const countB = skyPlacementCount('currentSky');
    toolbar.hidden = !countA;
    if (!countA) { label.innerHTML = ''; return; }
    const summary = (kind, skyLabel, count) => `<span class="sky-results-toolbar-sky"><b>${escapeHtml(skyLabel)}</b><span>${escapeHtml(skyProvenanceLabel(kind))}</span><em>${count} placement${count === 1 ? '' : 's'}</em></span>`;
    label.innerHTML = summary('chart', 'Sky A', countA) + (skyChartNeedsB() && countB ? summary('currentSky', 'Sky B', countB) : '');
  }
  function updateSkyCreatorDrawerState() {
    const drawer = $('skyCreatorDrawer');
    const status = $('skyCreatorDrawerStatus');
    updateSkyResultsToolbar();
    if (!drawer && !status) return;
    const aReady = skyPlacementCount('chart') > 0;
    const bReady = skyPlacementCount('currentSky') > 0;
    if (status) status.textContent = skyChartNeedsB() ? `${skyLoadedSummary('chart')} · ${skyLoadedSummary('currentSky')}` : skyLoadedSummary('chart');
    if (!drawer) return;
    if (aReady && (!skyChartNeedsB() || bReady) && !state.skyCreatorDrawerAutoClosed) {
      drawer.open = false;
      state.skyCreatorDrawerAutoClosed = true;
    }
    if ((!aReady || (skyChartNeedsB() && !bReady)) && state.skyCreatorDrawerAutoClosed) {
      drawer.open = true;
      state.skyCreatorDrawerAutoClosed = false;
    }
  }
  function currentSkyCreatorStateFields() {
    const kind = skyCreatorKind();
    return { kind, meta: skyFields(kind), placements: statePlacementsForKind(kind) };
  }
  function readSkyCreatorMeta() {
    const { kind, meta } = currentSkyCreatorStateFields();
    const f = skyCreatorFields();
    const nameEl = $(f.name), notesEl = $(f.notes);
    if (nameEl && !skyCreatorNameIsLibrarySearch()) state[meta.nameKey] = nameEl.value.trim().slice(0, 100);
    if (notesEl) state[meta.notesKey] = notesEl.value.slice(0, 4000);
    updateSkyCreatorNameClearButton();
    updateSkyCreatorDeleteStoredButton();
    return kind;
  }
  function updateSkyCreatorNameClearButton() {
    const btn = $('skyCreatorNameClear');
    const input = $('skyCreatorName');
    if (btn && input) btn.hidden = !String(input.value || '').length;
  }
  function writeSkyCreatorMeta(kind = skyCreatorKind()) {
    const meta = skyFields(kind);
    const f = skyCreatorFields();
    if ($(f.name) && !skyCreatorNameIsLibrarySearch()) $(f.name).value = state[meta.nameKey] || '';
    if ($(f.notes)) $(f.notes).value = state[meta.notesKey] || '';
    updateSkyCreatorNameClearButton();
    refreshSkyCreatorLibrary();
    updateSkyCreatorDeleteStoredButton();
  }
  function skyCreatorLibraryOptions() {
    return getSkyLibrary();
  }
  function closeSkyCreatorSuggestions() {
    const f = skyCreatorFields();
    const box = $(f.suggestions);
    if (box) { box.hidden = true; box.innerHTML = ''; }
  }
  function renderSkyCreatorSuggestions() {
    const f = skyCreatorFields();
    const input = $(f.name);
    const box = $(f.suggestions);
    if (!input || !box) return;
    const targetKind = skyCreatorLibraryTargetKind();
    const typed = String(input.value || '').trim().toLowerCase();
    const options = skyCreatorLibraryOptions();
    const matches = options
      .filter(item => !typed || item.name.toLowerCase().includes(typed))
      .slice(0, 10);
    if (!matches.length) { closeSkyCreatorSuggestions(); return; }
    box.innerHTML = matches.map(item => `<div class="sky-creator-suggestion-row"><button type="button" class="sky-creator-suggestion-load" data-sky-suggestion="${escapeHtml(item.id)}"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(skyCreatorLabel(item.kind))}</small></button><button type="button" class="sky-creator-suggestion-delete" data-delete-sky-suggestion="${escapeHtml(item.id)}" aria-label="Delete stored sky ${escapeHtml(item.name)}" title="Delete stored sky">Delete</button></div>`).join('');
    box.hidden = false;
    qsa('[data-sky-suggestion]', box).forEach(btn => btn.addEventListener('click', event => {
      event.preventDefault();
      const scrollY = window.scrollY;
      const record = options.find(item => item.id === btn.dataset.skySuggestion);
      if (!record) return;
      input.value = record.name;
      const select = $(f.select);
      if (select) select.value = record.id;
      closeSkyCreatorSuggestions();
      loadSkyCreatorFromLibrary({ targetKind, recordId: record.id });
      requestAnimationFrame(() => window.scrollTo({ top: scrollY, left: window.scrollX, behavior: 'auto' }));
    }));
    qsa('[data-delete-sky-suggestion]', box).forEach(btn => btn.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const record = options.find(item => item.id === btn.dataset.deleteSkySuggestion);
      if (!record) return;
      if (!window.confirm(`Delete the stored sky “${record.name}”? Any copy already open on the wheel will remain until you clear or replace it.`)) return;
      setSkyLibrary(getSkyLibrary().filter(item => item.id !== record.id));
      const selections = { chart:'', currentSky:'', ...(state.skyLibrarySelection || {}) };
      if (selections.chart === record.id) selections.chart = '';
      if (selections.currentSky === record.id) selections.currentSky = '';
      state.skyLibrarySelection = selections;
      refreshSkyLibrarySelects();
      refreshSkyCreatorLibrary();
      renderSkyCreatorSuggestions();
      updateSkyCreatorDeleteStoredButton();
    }));
  }
  function refreshSkyCreatorLibrary() {
    const f = skyCreatorFields();
    const kind = skyCreatorKind();
    const options = skyCreatorLibraryOptions();
    const select = $(f.select);
    if (select) {
      const current = select.value;
      select.innerHTML = `<option value="">Choose saved ${skyCreatorLabel(kind)}…</option>` + options.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('');
      if (options.some(item => item.id === current)) select.value = current;
    }
    const list = $(f.list);
    if (list) list.innerHTML = '';
  }
  function syncSkyCreatorButtons() {
    const kind = skyCreatorKind();
    const label = skyCreatorLabel(kind);
    const set = (id, text) => { const el = $(id); if (el) el.textContent = text; };
    set('skyCreatorSaveWizard', 'Save');
    set('skyCreatorClear', `Clear ${label}`);
    set('skyCreatorExportText', `Export ${label} placements`);
  }
  function renderSkyCreator() {
    const form = $('skyCreatorForm');
    if (!form) return;
    updateSkyChartModeUi();
    const kind = skyCreatorKind();
    setSkyCreatorKind(kind);
    const calcTarget = $('skyCalcTarget');
    if (calcTarget) calcTarget.value = kind;
    syncSkyCreatorButtons();
    writeSkyCreatorMeta(kind);
    refreshSkyCreatorLibrary();
    syncSkyPasteFromPlacements(kind, statePlacementsForKind(kind), false);
    renderPlacementBuilder('skyCreator');
    updateSkyCreatorDrawerState();
  }
  function switchSkyCreatorTarget(kind) {
    if (kind === 'currentSky' && !skyChartNeedsB()) kind = 'chart';
    readSkyCreatorMeta();
    setSkyCreatorKind(kind);
    const calcTarget = $('skyCalcTarget');
    if (calcTarget) calcTarget.value = skyCreatorKind();
    const meta = skyFields(skyCreatorKind());
    const placements = statePlacementsForKind(skyCreatorKind());
    if (!Object.keys(placements || {}).length && !state[meta.notesKey]) state[meta.nameKey] = '';
    resetSkyCreatorBuilder();
    renderSkyCreator();
    renderChart();
    renderCurrentSky();
  }
  function skyCreatorParsedPlacements(kind, payload) {
    const placements = payload.placements || {};
    if (kind !== 'currentSky') return placements;
    const currentOnly = {};
    CURRENT_BODIES.forEach(body => { if (placements[body]) currentOnly[body] = placements[body]; });
    return currentOnly;
  }
  function importSkyCreatorPaste(options = {}) {
    const box = $('skyCreatorPaste');
    if (!box) return false;
    const payload = parseSkyText(box.value);
    const stampedKind = box.dataset.skyKind === 'currentSky' ? 'currentSky' : box.dataset.skyKind === 'chart' ? 'chart' : skyCreatorKind();
    const requestedKind = options.targetKind === 'currentSky' ? 'currentSky' : options.targetKind === 'chart' ? 'chart' : stampedKind;
    const inferredKind = (/^currentSky|Sky B$/i.test(String(payload.kind || '')) && skyChartNeedsB()) ? 'currentSky' : requestedKind;
    setSkyCreatorKind(inferredKind);
    const placements = skyCreatorParsedPlacements(inferredKind, payload);
    if (!Object.keys(placements).length) return false;
    const meta = skyFields(inferredKind);
    if (payload.name || payload.notes) writeSkyMeta(inferredKind, payload.name || state[meta.nameKey], payload.notes || state[meta.notesKey]);
    else readSkyCreatorMeta();
    setStatePlacementsForKind(inferredKind, placements);
    if (options.markSource !== false) setSkyEntrySource(inferredKind, 'paste');
    resetSkyCreatorBuilder();
    renderSkyCreator();
    renderChart();
    renderCurrentSky();
    return true;
  }
  function autoImportSkyCreatorPaste() { importSkyCreatorPaste(); }
  function saveSkyCreator() {
    importSkyCreatorPaste({ markSource:false });
    const kind = readSkyCreatorMeta();
    const meta = skyFields(kind);
    const placements = statePlacementsForKind(kind);
    const record = upsertSkyLibrary(kind, state[meta.nameKey], state[meta.notesKey], placements, currentSkyCalcProfile(kind));
    state.skyLibrarySelection = { chart:'', currentSky:'', ...(state.skyLibrarySelection || {}) };
    state.skyLibrarySelection[kind] = record?.id || '';
    refreshSkyCreatorLibrary();
    updateSkyCreatorDeleteStoredButton();
    renderChart();
    renderCurrentSky();
  }
  function clearSkyCreator() {
    const kind = readSkyCreatorMeta();
    const meta = skyFields(kind);
    state[meta.stateKey] = {};
    state[meta.nameKey] = '';
    state[meta.notesKey] = '';
    state.skyLibrarySelection = { chart:'', currentSky:'', ...(state.skyLibrarySelection || {}) };
    state.skyLibrarySelection[kind] = '';
    setSkyEntrySource(kind, '');
    const f = skyCreatorFields();
    if ($(f.paste)) $(f.paste).value = '';
    resetSkyCreatorBuilder();
    renderSkyCreator();
    renderChart();
    renderCurrentSky();
  }
  function loadSkyCreatorFromLibrary(options = {}) {
    const eventLike = options && typeof options === 'object' && typeof options.preventDefault === 'function';
    if (eventLike) options.preventDefault();
    const requestedKind = !eventLike && options?.targetKind ? options.targetKind : skyCreatorLibraryTargetKind();
    const kind = requestedKind === 'currentSky' && skyChartNeedsB() ? 'currentSky' : 'chart';
    const protectedKind = kind === 'currentSky' ? 'chart' : 'currentSky';
    const protectedSnapshot = captureSkySlot(protectedKind);
    const f = skyCreatorFields();
    const select = $(f.select);
    const id = (!eventLike && options?.recordId) || select?.value || '';
    const selectedName = select?.selectedOptions?.[0]?.textContent || '';
    const typedName = $(f.name)?.value?.trim() || '';
    const library = getSkyLibrary();
    const lowerTyped = typedName.toLowerCase();
    const exactNameMatches = lowerTyped ? library.filter(item => item.name.toLowerCase() === lowerTyped) : [];
    let record = library.find(item => item.id === id)
      || library.find(item => item.name === selectedName && item.kind === kind)
      || library.find(item => item.name === selectedName)
      || exactNameMatches.find(item => item.kind === kind)
      || exactNameMatches[0];
    if (!record) return false;
    const refreshed = refreshedCalculatedSkyRecord(record);
    if (refreshed !== record || refreshed.placements !== record.placements) {
      record = replaceSkyLibraryRecord(record.id, {
        name:refreshed.name,
        notes:refreshed.notes,
        placements:refreshed.placements,
        calcProfile:refreshed.calcProfile
      }) || refreshed;
    }
    endSkyCreatorLibrarySearch({ restore:false });
    setSkyCreatorKind(kind);
    state.skyLibrarySelection = { chart:'', currentSky:'', ...(state.skyLibrarySelection || {}) };
    state.skyLibrarySelection[kind] = record.id || '';
    applySkyPayload(kind, record, { persist:false });
    restoreSkySlot(protectedKind, protectedSnapshot);
    setSkyEntrySource(kind, 'stored');
    resetSkyCreatorBuilder();
    renderSkyCreator();
    renderChart();
    renderCurrentSky();
    closeSkyCreatorSuggestions();
    closeSkyWizardInline(kind);
    return true;
  }
  function exportSkyCreatorText() {
    importSkyCreatorPaste({ markSource:false });
    const kind = readSkyCreatorMeta();
    const meta = skyFields(kind);
    const placements = statePlacementsForKind(kind);
    if (!Object.keys(placements).length) return;
    const text = serializeSkyText(kind, placements, state[meta.nameKey], state[meta.notesKey]);
    download(`${slug(skyRecordName(kind, state[meta.nameKey])) || kind}-${localTimestampSlug(new Date())}.txt`, text, 'text/plain');
    upsertSkyLibrary(kind, state[meta.nameKey], state[meta.notesKey], placements, currentSkyCalcProfile(kind));
    refreshSkyCreatorLibrary();
  }
  async function importSkyCreatorTextFile(file) {
    if (!file) return;
    const text = await file.text();
    const parsed = parseSkyText(text);
    const kind = parsed.kind === 'currentSky' ? 'currentSky' : skyCreatorKind();
    setSkyCreatorKind(kind);
    applySkyPayload(kind, parsed);
    resetSkyCreatorBuilder();
    renderSkyCreator();
    renderChart();
    renderCurrentSky();
  }
  function bindSkyCreator() {
    qsa('[data-sky-chart-mode]').forEach(btn => btn.addEventListener('click', () => {
      setSkyChartMode(btn.dataset.skyChartMode);
      if (skyChartNeedsB()) setSkyCreatorKind('currentSky');
    }));
    $('skyWizardCompareButton')?.addEventListener('click', () => ensureSecondSkyMode('transit'));
    qsa('[data-sky-builder-ui]').forEach(btn => btn.addEventListener('click', () => setSkyBuilderUiMode(btn.dataset.skyBuilderUi)));
    qsa('[data-sky-wizard-target]').forEach(btn => btn.addEventListener('click', () => { if (!btn.disabled) { setSkyCreatorKind(btn.dataset.skyWizardTarget); if (typeof switchSkyCalculationTarget === 'function') switchSkyCalculationTarget(state.skyCreatorTarget); } }));
    qsa('[data-close-sky-inline]').forEach(btn => btn.addEventListener('click', () => closeSkyWizardInline(btn.dataset.closeSkyInline)));
    $('skyCreatorSaveWizard')?.addEventListener('click', saveSkyCreator);
    updateSkyChartModeUi();
    const target = $('skyCreatorTarget');
    if (target) target.addEventListener('change', () => {
      if ($('skyCalcTarget') && typeof switchSkyCalculationTarget === 'function') switchSkyCalculationTarget(target.value);
      else switchSkyCreatorTarget(target.value);
    });
    const nameEl = $('skyCreatorName');
    if (nameEl) {
      nameEl.addEventListener('input', () => {
        if (!skyCreatorNameIsLibrarySearch()) readSkyCreatorMeta();
        updateSkyCreatorNameClearButton();
        updateSkyCreatorDeleteStoredButton();
        renderSkyCreatorSuggestions();
      });
      nameEl.addEventListener('focus', () => { updateSkyCreatorNameClearButton(); updateSkyCreatorDeleteStoredButton(); renderSkyCreatorSuggestions(); });
      nameEl.addEventListener('change', () => {
        if (skyCreatorNameIsLibrarySearch()) {
          loadSkyCreatorFromLibrary();
          return;
        }
        readSkyCreatorMeta();
        closeSkyCreatorSuggestions();
        renderChart();
      });
      nameEl.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          closeSkyCreatorSuggestions();
          return;
        }
        if (event.key === 'Enter' && skyCreatorNameIsLibrarySearch()) {
          event.preventDefault();
          loadSkyCreatorFromLibrary();
        }
      });
    }
    $('skyCreatorNameClear')?.addEventListener('click', event => {
      event.preventDefault();
      const input = $('skyCreatorName');
      if (input) { input.value = ''; input.focus(); }
      if (!skyCreatorNameIsLibrarySearch()) readSkyCreatorMeta();
      closeSkyCreatorSuggestions();
      updateSkyCreatorNameClearButton();
      updateSkyCreatorDeleteStoredButton();
    });
    document.addEventListener('click', event => { if (!event.target.closest?.('.sky-creator-name-label')) closeSkyCreatorSuggestions(); });
    const notesEl = $('skyCreatorNotes');
    if (notesEl) notesEl.addEventListener('input', readSkyCreatorMeta);
    $('skyCreatorLoad')?.addEventListener('click', loadSkyCreatorFromLibrary);
    $('skyCreatorDeleteStored')?.addEventListener('click', event => { event.preventDefault(); deleteSelectedSkyCreatorRecord(); });
    $('skyCreatorClear')?.addEventListener('click', clearSkyCreator);
    $('skyCreatorExportText')?.addEventListener('click', exportSkyCreatorText);
    $('skyCreatorImportText')?.addEventListener('click', () => $('skyCreatorTextFile')?.click());
    $('skyCreatorTextFile')?.addEventListener('change', () => { importSkyCreatorTextFile($('skyCreatorTextFile').files?.[0]); $('skyCreatorTextFile').value = ''; });
    refreshSkyCreatorLibrary();
    renderSkyCreator();
  }

  function currentSkySentence(body, p, decan, house) {
    const data = SIGN_DATA[p.sign] || {};
    const decanRuler = decan?.astrology?.planet || decan?.astrology?.decan_ruler || '';
    const signRuler = data.ruler || decan?.astrology?.sign_ruler || '';
    const exaltedHere = data.exaltation && data.exaltation === body ? ` <strong>${escapeHtml(body)}</strong> is exalted in ${escapeHtml(p.sign)}, strengthening this current placement.` : '';
    const housePhrase = house ? `, especially through matters of ${house.plainTopics}` : '';
    if (decan) {
      return `<strong>${escapeHtml(skyDisplayLabel('currentSky', 'Sky B'))} ${escapeHtml(body)}${p.retrograde ? ' retrograde' : ''}</strong> falls in the <strong>${escapeHtml(title(decan))} — ${escapeHtml(cardTitle(decan))}</strong> decan: <strong>${escapeHtml(decanRuler)}</strong> ${escapeHtml(PLANET_ACTIONS[decanRuler] || 'brings its force')} into <strong>${escapeHtml(signRuler)}-ruled ${escapeHtml(p.sign)}</strong>’s field of ${escapeHtml(signField(p.sign))}, so ${escapeHtml(cardThemePhrase(decan))} touch ${escapeHtml(bodyGloss(body, p.retrograde))}${escapeHtml(housePhrase)}.${exaltedHere}`;
    }
    return `<strong>${escapeHtml(skyDisplayLabel('currentSky', 'Sky B'))} ${escapeHtml(body)}${p.retrograde ? ' retrograde' : ''}</strong> is in <strong>${escapeHtml(signRuler)}-ruled ${escapeHtml(p.sign)}</strong>, bringing ${escapeHtml(bodyGloss(body, p.retrograde))} into ${escapeHtml(signField(p.sign))}${escapeHtml(housePhrase)}.${exaltedHere}`;
  }
  function transitPlacementCard(label, placements, card, skyClass) {
    const first = placements[0] || {};
    const body = first.body || '';
    const p = first.p || {};
    const placementText = placements.map(item => {
      const pl = item.p || {};
      const degree = pl.degree == null || Number.isNaN(pl.degree) ? '' : `${pl.degree}°${pl.minute != null && !Number.isNaN(pl.minute) ? ' ' + pl.minute + '′' : ''}`;
      return `${item.body} in ${pl.sign || ''}${degree ? ' ' + degree : ''}`;
    }).join(' • ');
    return `<div class="transit-sky-card ${skyClass}"><span class="transit-sky-label">${escapeHtml(label)}</span>${card ? miniArt(card, 'transit-card-art') : `<div class="transit-card-placeholder">${escapeHtml(BODY_GLYPHS[body] || body)}</div>`}<div class="chart-placement-sticker-row transit-sticker-row">${placements.map(item => chartPlacementSticker(item.body, item.p)).join('')}</div><p>${escapeHtml(placementText)}</p></div>`;
  }
  function renderSkyABComparison(skyA, skyB) {
    const skyAEntries = Object.entries(skyA || {}).filter(([,p]) => p.sign);
    const skyBEntries = Object.entries(skyB || {}).filter(([,p]) => p.sign);
    if (!skyAEntries.length || !skyBEntries.length) return '';
    const aLabel = skyDisplayLabel('chart', 'Sky A');
    const bLabel = skyDisplayLabel('currentSky', 'Sky B');
    return renderExactAspectPanel(`${aLabel} × ${bLabel} exact aspects`, skyAEntries, skyBEntries, 'cross', [aLabel,bLabel]);
  }
  function dualSkyPlacementPlots(skyAEntries, skyBEntries, aLabel, bLabel) {
    const left = skyAEntries.length ? zodiacPlacementPlotHtml(`${aLabel} placements`, skyAEntries, null, 'internal', { labels:[aLabel] }) : `<section class="chart-wheel-panel"><div class="chart-wheel-head"><h3>${escapeHtml(aLabel)} placements</h3></div><p class="generated-note">No placements entered yet.</p></section>`;
    const right = skyBEntries.length ? zodiacPlacementPlotHtml(`${bLabel} placements`, skyBEntries, null, 'internal', { labels:[bLabel] }) : `<section class="chart-wheel-panel"><div class="chart-wheel-head"><h3>${escapeHtml(bLabel)} placements</h3></div><p class="generated-note">No placements entered yet.</p></section>`;
    return `<section class="sky-plot-compare">${left}${right}</section>`;
  }


  function bindTransitComparisonFilters() {
    const root = $('currentSkyOutput');
    if (!root) return;
    qsa('[data-transit-filter]', root).forEach(select => {
      select.addEventListener('change', () => {
        const key = select.dataset.transitFilter;
        state.transitFilters = state.transitFilters || { aspect:'all', house:'all', sign:'all', placement:'all' };
        state.transitFilters[key] = select.value || 'all';
        renderCurrentSky();
      });
    });
  }


  function renderCurrentSky() {
    renderChart();
  }
  function saveCurrentSky() { readCurrentSkyForm(); readSkyMeta('currentSky'); localStorage.setItem(skySlotStorageKey('currentSky'), JSON.stringify({ name: state.currentSkyName, notes: state.currentSkyNotes, placements: state.currentSky })); upsertSkyLibrary('currentSky', state.currentSkyName, state.currentSkyNotes, state.currentSky, currentSkyCalcProfile('currentSky')); renderCurrentSky(); }
  function loadCurrentSky() { const saved = localStorage.getItem(skySlotStorageKey('currentSky')); if (saved) { const payload = JSON.parse(saved); const placements = payload.placements || payload; writeSkyMeta('currentSky', payload.name || '', payload.notes || ''); setSkyCalcProfile('currentSky', meaningfulSkyCalcProfile({ ...(payload.calcProfile || parseSkyCalcProfileFromText(payload.name || '', payload.notes || '')), name: payload.name || '' })); if (skyCalcTargetKind() === 'currentSky') hydrateSkyCalculationPanel('currentSky', { force:true }); writeCurrentSkyForm(placements); setTimeout(() => { readCurrentSkyForm(); renderCurrentSky(); }, 0); } }
  function clearCurrentSky() { writeSkyMeta('currentSky', '', ''); writeCurrentSkyForm({}); }

  function applyHistory(snapshot) {
    state.suppressHistory = true;
    const mode = snapshot?.mode || 'idle';
    if (mode === 'all') { state.mode = 'all'; state.query = ''; $('oracleCommand').value = ''; showPanel('browsePanel'); setVisible('visibilityPanel', false); renderBrowse(); }
    else if (mode === 'search') { state.mode = 'search'; state.query = snapshot.query || ''; $('oracleCommand').value = state.query; showPanel('browsePanel'); renderBrowse(); }
    else if (mode === 'spread') { state.mode = 'spread'; showPanel('spreadPanel'); updateSummary(state.currentSpread); renderSpread(); }
    else if (mode === 'date') { state.mode = 'date'; showPanel('datePanel'); updateSummary([]); }
    else if (mode === 'chart' || mode === 'currentSky') { state.mode = 'chart'; showPanel('chartPanel'); setVisible('currentSkyPanel', !isDedicatedSkyChartPage()); updateSummary([]); renderSkyCreator(); renderChartForm(); renderCurrentSkyForm(); renderChart(); renderCurrentSky(); }
    else if (isDedicatedSkyChartPage()) { state.mode = 'chart'; state.query = ''; state.selected = null; if ($('oracleCommand')) $('oracleCommand').value = ''; showPanel('chartPanel'); setVisible('currentSkyPanel', false); updateSummary([]); renderSkyCreator(); renderChart(); renderCurrentSky(); }
    else { state.mode = 'idle'; state.query = ''; state.selected = null; $('oracleCommand').value = ''; showPanel(null); updateSummary([]); }
    hideCommandMenu();
    state.suppressHistory = false;
  }

  function restoreDedicatedSkyChartView() {
    if (!isDedicatedSkyChartPage()) return false;
    applyHistory({ relphiTarot:true, mode:'chart', query:'' });
    const snapshot = historySnapshot();
    history.replaceState(snapshot, '', location.pathname + location.search + '#tarot-chart');
    return true;
  }

  function openDedicatedSkyCardInspector(card) {
    if (!card) return;
    let dialog = document.querySelector('#skyCardInspectorDialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'skyCardInspectorDialog';
      dialog.className = 'sky-card-inspector-dialog';
      dialog.innerHTML = `<div class="sky-card-inspector-shell"><button type="button" class="sky-card-inspector-close" aria-label="Close card details">×</button><article class="tarot-detail sky-card-inspector-detail"></article></div>`;
      document.body.appendChild(dialog);
      dialog.querySelector('.sky-card-inspector-close')?.addEventListener('click', () => dialog.close());
      dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
      dialog.addEventListener('cancel', event => { event.preventDefault(); dialog.close(); });
    }
    const panel = dialog.querySelector('.sky-card-inspector-detail');
    panel.innerHTML = cardDetailHtml(card, 'Card database entry');
    bindCardNoteEditor(panel);
    if (typeof dialog.showModal === 'function') { if (!dialog.open) dialog.showModal(); }
    else dialog.setAttribute('open', '');
  }
  function openFullEntryById(id) {
    const card = cardById(id);
    if (!card) return;
    if (isDedicatedSkyChartPage()) {
      openDedicatedSkyCardInspector(card);
      return;
    }
    state.cardFilters = [];
    qsa('input[data-filter-group]').forEach(i => i.checked = true);
    syncRankModeToggles();
    state.mode = 'all';
    state.selected = card;
    state.query = '';
    if ($('oracleCommand')) $('oracleCommand').value = '';
    showPanel('browsePanel');
    setVisible('visibilityPanel', false);
    renderBrowse();
    renderDetail(card);
    const detail = $('cardDetail');
    if (detail) detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    updateClearKeywordButtons();
    pushHistory();
  }


  function prepareExamplePlaceholders(root = document) {
    qsa('input[placeholder], textarea[placeholder]', root).forEach(el => {
      if (!el.dataset.relphiExamplePlaceholder) el.dataset.relphiExamplePlaceholder = el.getAttribute('placeholder') || '';
      if (!el.dataset.relphiExamplePlaceholder.startsWith('Ex. ')) {
        el.dataset.relphiExamplePlaceholder = 'Ex. ' + el.dataset.relphiExamplePlaceholder;
      }
      el.setAttribute('placeholder', el.dataset.relphiExamplePlaceholder);
      if (el.dataset.relphiPlaceholderReady) return;
      el.addEventListener('focus', () => { el.setAttribute('placeholder', ''); });
      el.addEventListener('blur', () => { el.setAttribute('placeholder', el.dataset.relphiExamplePlaceholder || ''); });
      el.dataset.relphiPlaceholderReady = 'true';
    });
  }

  function openDateFromHash(hashValue) {
    const rawHash = hashValue == null ? window.location.hash : hashValue;
    const rawSearch = hashValue == null ? window.location.search : '';
    const raw = decodeURIComponent([rawSearch.replace(/^\?/, ''), (rawHash || '').replace(/^#/, '')].filter(Boolean).join('&'));
    const match = raw.match(/(?:^|[&?])date=([0-9]{4}-[0-9]{2}-[0-9]{2})/) || raw.match(/^date:([0-9]{4}-[0-9]{2}-[0-9]{2})$/);
    if (!match) return false;
    const value = match[1];
    const input = $('dateInput');
    if (!input) return false;
    state.suppressHistory = true;
    state.mode = 'date';
    state.query = '';
    state.selected = null;
    input.value = value;
    showPanel('datePanel');
    updateSummary([]);
    hideCommandMenu();
    readDate();
    state.suppressHistory = false;
    return true;
  }



  function bindCardLayerWheelBridge() {
    document.addEventListener('wheel', event => {
      const layer = event.target && event.target.closest ? event.target.closest('.or-card-layer.relphi-info-layer') : null;
      if (!layer) return;
      if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const scrollBox = event.target.closest('.or-layer-scroll, .relphi-info-scroll') || layer.querySelector('.or-layer-scroll, .relphi-info-scroll');
      if (!scrollBox) return;
      const canScroll = scrollBox.scrollHeight > scrollBox.clientHeight + 2;
      const atTop = scrollBox.scrollTop <= 0;
      const atBottom = scrollBox.scrollTop + scrollBox.clientHeight >= scrollBox.scrollHeight - 2;
      if (layer.closest('.tarot-result-grid')) {
        if (canScroll && !((event.deltaY < 0 && atTop) || (event.deltaY > 0 && atBottom))) {
          event.preventDefault();
          event.stopImmediatePropagation();
          scrollBox.scrollTop += event.deltaY;
        } else {
          event.preventDefault();
          window.scrollBy({ top: event.deltaY, left: 0, behavior: 'auto' });
        }
        return;
      }
      if (!canScroll || (event.deltaY < 0 && atTop) || (event.deltaY > 0 && atBottom)) {
        event.preventDefault();
        window.scrollBy({ top: event.deltaY, left: 0, behavior: 'auto' });
      }
    }, { passive: false });
  }
  function bindResultPanelWheelBridge() {
    document.addEventListener('wheel', event => {
      if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const panel = event.target && event.target.closest ? event.target.closest('.tarot-list-panel') : null;
      if (!panel || !panel.querySelector('#cardList')) return;
      const canScroll = panel.scrollHeight > panel.clientHeight + 2;
      if (!canScroll) return;
      const atTop = panel.scrollTop <= 0;
      const atBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 2;
      if ((event.deltaY < 0 && atTop) || (event.deltaY > 0 && atBottom)) {
        event.preventDefault();
        window.scrollBy({ top: event.deltaY, left: 0, behavior: 'auto' });
        return;
      }
      event.preventDefault();
      panel.scrollTop += event.deltaY;
    }, { passive: false });
  }
  function bindDetailPanelWheelBridge() {
    document.addEventListener('wheel', event => {
      if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const panel = event.target && event.target.closest ? event.target.closest('#cardDetail.tarot-detail') : null;
      if (!panel) return;
      const canScroll = panel.scrollHeight > panel.clientHeight + 2;
      if (!canScroll) return;
      const atTop = panel.scrollTop <= 0;
      const atBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 2;
      if ((event.deltaY < 0 && atTop) || (event.deltaY > 0 && atBottom)) {
        event.preventDefault();
        window.scrollBy({ top: event.deltaY, left: 0, behavior: 'auto' });
      }
    }, { passive: false });
  }

  function init() {
    const initialHash = window.location.hash;
    replaceHistory();
    window.addEventListener('popstate', (event) => {
      if (isDedicatedSkyChartPage()) { restoreDedicatedSkyChartView(); return; }
      if (event.state?.relphiTarot) applyHistory(event.state);
      else openDateFromHash();
    });
    window.addEventListener('hashchange', () => {
      if (isDedicatedSkyChartPage()) { restoreDedicatedSkyChartView(); return; }
      openDateFromHash();
    });
    window.addEventListener('pageshow', () => {
      if (isDedicatedSkyChartPage()) restoreDedicatedSkyChartView();
    });
    window.addEventListener('resize', scheduleCelticFit);
    prepareExamplePlaceholders(document);
    bindCardLayerWheelBridge();
    bindResultPanelWheelBridge();
    bindDetailPanelWheelBridge();
    document.addEventListener('keydown', event => {
      const target = event.target;
      const editing = target && (target.closest('input, textarea, select') || target.isContentEditable);
      if (editing || !(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey) { event.preventDefault(); undoShortList(); }
      if (key === 'y' || (key === 'z' && event.shiftKey)) { event.preventDefault(); redoShortList(); }
    });
    $('showAllCards').addEventListener('click', showAll); $('hideAllCards').addEventListener('click', clearToIdle); $('clearSearch').addEventListener('click', clearToIdle);
    $('runCommand').addEventListener('click', () => runSearch()); if ($('clearSearchKeywords')) $('clearSearchKeywords').addEventListener('click', clearSearchKeywordsKeepFilters); if ($('clearSearchKeywordsCollapsed')) $('clearSearchKeywordsCollapsed').addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); clearSearchKeywordsKeepFilters(); }); qsa('[data-clear-search-terms]').forEach(btn => btn.addEventListener('click', clearSearchKeywordsKeepFilters)); $('oracleCommand').addEventListener('input', handleSearchInput); $('oracleCommand').addEventListener('paste', () => window.setTimeout(() => openSkyChartFromPastedSearch($('oracleCommand').value), 0)); $('oracleCommand').addEventListener('keydown', e => { if (e.key === 'Enter') runSearch(); if (e.key === 'Escape') hideCommandMenu(); });
    $('resetVisibility').addEventListener('click', resetVisibility); $('showDecansOnly').addEventListener('click', showDecansOnly); qsa('input[data-rank-mode]').forEach(i => i.addEventListener('change', () => setRankMode(i.dataset.rankMode, i.checked))); qsa('input[data-filter-group]').forEach(i => i.addEventListener('change', () => { if (i.dataset.filterGroup === 'rank') syncRankModeToggles(); renderBrowse(); })); syncRankModeToggles();
    $('drawMode')?.addEventListener('click', openSpread); $('spreadSelect').addEventListener('change', () => { syncSpreadControls(); if (state.currentSpread.length) renderSpread(); }); $('spreadOutput').addEventListener('click', handleSpreadClick); $('spreadOutput').addEventListener('keydown', handleSpreadKeydown); $('drawSpread').addEventListener('click', drawSpread); if ($('revealSpread')) $('revealSpread').addEventListener('click', revealAllSpreadCards); $('clearSpread').addEventListener('click', clearSpread); $('downloadSpreadHtml').addEventListener('click', downloadSpreadHtml); $('downloadSpreadJson').addEventListener('click', () => state.currentSpread.length && download('spread-data.json', JSON.stringify(spreadData(), null, 2), 'application/json')); if ($('crossedLayoutToggle')) $('crossedLayoutToggle').addEventListener('change', e => { state.crossedLayout = e.target.checked; renderSpread(); }); if ($('positionStickerToggle')) $('positionStickerToggle').addEventListener('change', e => { state.positionStickers = e.target.checked; renderSpread(); }); if ($('tutorialOrderToggle')) $('tutorialOrderToggle').addEventListener('change', e => { state.revealGuideEnabled = e.target.checked; state.revealGuideActive = e.target.checked && state.currentSpread.some(x => !x.revealed); renderSpread(); });

    ['cardDetail','spreadCardDetail','shortListPanel'].forEach(id => { const el = $(id); if (el) el.addEventListener('click', event => {
      const ingredientTab = event.target.closest('[data-ingredient-tab]');
      if (ingredientTab) {
        event.preventDefault(); event.stopPropagation();
        const tabsRoot = ingredientTab.closest('.locked-ingredients--tabs');
        const targetId = ingredientTab.dataset.ingredientTab;
        if (tabsRoot && targetId) {
          tabsRoot.querySelectorAll('[data-ingredient-tab]').forEach(tab => { const active = tab === ingredientTab; tab.classList.toggle('is-active', active); tab.setAttribute('aria-selected', active ? 'true' : 'false'); });
          tabsRoot.querySelectorAll('[data-ingredient-panel]').forEach(panel => { const active = panel.dataset.ingredientPanel === targetId; panel.hidden = !active; panel.classList.toggle('is-active', active); });
        }
        return;
      }
      const filter = event.target.closest('[data-filter]');
      if (filter) { event.preventDefault(); event.stopPropagation(); applyChipFilter(filter.dataset.filter); return; }
      const btn = event.target.closest('[data-shortlist]');
      if (btn) { event.preventDefault(); event.stopPropagation(); toggleShortList(btn.dataset.shortlist); return; }
      const fullEntry = event.target.closest('[data-card-id]');
      if (fullEntry) { event.preventDefault(); event.stopPropagation(); openFullEntryById(fullEntry.dataset.cardId); return; }
    }); });
    ['dateOutput','chartOutput','currentSkyOutput'].forEach(id => { const el = $(id); if (el) el.addEventListener('click', event => {
      if (userHasTextSelection()) return;
      const rootId = id;
      const symbolHelp = event.target.closest('[data-symbol-help]');
      if (symbolHelp) { event.preventDefault(); event.stopPropagation(); showSymbolHelperFromElement(symbolHelp); return; }
      const filter = event.target.closest('[data-filter]');
      if (filter) { event.preventDefault(); event.stopPropagation(); if (id === 'chartOutput' || id === 'currentSkyOutput') toggleChartResultFilter(rootId, filter.dataset.filter); else applyChipFilter(filter.dataset.filter); return; }
      const removeChartFilter = event.target.closest('[data-chart-filter-remove]');
      if (removeChartFilter) { event.preventDefault(); event.stopPropagation(); toggleChartResultFilter(rootId, removeChartFilter.dataset.chartFilterRemove); return; }
      const clearLocalFilters = event.target.closest('[data-chart-filter-clear]');
      if (clearLocalFilters) { event.preventDefault(); event.stopPropagation(); clearChartResultFilters(chartResultFilterKey(rootId)); return; }
      const shortlist = event.target.closest('[data-shortlist]');
      if (shortlist) { event.preventDefault(); event.stopPropagation(); toggleShortList(shortlist.dataset.shortlist); return; }
      const btn = event.target.closest('[data-card-id]');
      if (btn) { event.preventDefault(); event.stopPropagation(); openFullEntryById(btn.dataset.cardId); return; }
      const placementToggle = event.target.closest('[data-placement-toggle]');
      if (placementToggle) { event.preventDefault(); event.stopPropagation(); const card = placementToggle.closest('.or-card'); const layer = card?.querySelector('[data-placement-layer]'); if (card && layer) { const open = layer.hidden; card.classList.toggle('placement-layer-active', open); layer.hidden = !open; } return; }
      const cardEl = event.target.closest('.or-card[data-id]');
      if (cardEl && !event.target.closest('.or-card-add,.or-chip,.relphi-filter-chip,.or-placement-bubble')) { event.preventDefault(); openFullEntryById(cardEl.dataset.id); }
    }); });
    $('dateMode').addEventListener('click', openDate); $('readDate').addEventListener('click', readDate);
    bindAstroTextAutoImport();
    $('chartMode')?.addEventListener('click', openChart);
    $('saveChart')?.addEventListener('click', saveChart);
    $('loadChart')?.addEventListener('click', loadChart);
    $('clearChart')?.addEventListener('click', clearChart);
    if ($('exportChart')) $('exportChart').addEventListener('click', exportChartData);
    if ($('parseAstroSeek')) $('parseAstroSeek').addEventListener('click', importAstroSeekChart);
    if ($('parseCurrentAstroSeek')) $('parseCurrentAstroSeek').addEventListener('click', importAstroSeekCurrentSky);
    $('currentSkyMode')?.addEventListener('click', openCurrentSky);
    $('saveCurrentSky')?.addEventListener('click', saveCurrentSky);
    $('loadCurrentSky')?.addEventListener('click', loadCurrentSky);
    $('clearCurrentSky')?.addEventListener('click', clearCurrentSky);
    bindSkyWorkbench('chart');
    bindSkyWorkbench('currentSky');
    bindSkyCreator();
    bindSkyCalculationPanel();
    refreshSkyLibrarySelects();
    function showDrawingBoardFromLanding(draw=false) {
      state.mode = 'board';
      const commandDetails = document.querySelector('.tarot-command-drawer > details');
      if (commandDetails) commandDetails.open = true;
      setVisible('shortListPanel', true);
      ['browsePanel','visibilityPanel','spreadPanel','datePanel','chartPanel','currentSkyPanel'].forEach(id => setVisible(id, false));
      renderShortList();
      expandCardRow();
      if (draw) drawRandomRowCard();
      else $('shortListPanel')?.scrollIntoView({ behavior:'smooth', block:'start' });
      updateSummary([]);
    }
    const landingDraw = $('landingDrawCard'); if (landingDraw) landingDraw.addEventListener('click', event => { event.preventDefault(); showDrawingBoardFromLanding(true); });
    const landingBoard = $('landingOpenBoard'); if (landingBoard) landingBoard.addEventListener('click', event => { event.preventDefault(); showDrawingBoardFromLanding(false); });
    const landingLedger = $('landingShowLedger'); if (landingLedger) landingLedger.addEventListener('click', event => { event.preventDefault(); collapseCardRow(); setVisible('shortListPanel', false); state.mode = 'all'; state.query = ''; state.cardFilters = []; state.selected = null; renderBrowse(); showPanel('browsePanel'); $('browsePanel')?.scrollIntoView({ behavior:'smooth', block:'start' }); });
    renderShortList();
    updateClearKeywordButtons();
    if (isDedicatedSkyChartPage()) requestAnimationFrame(restoreDedicatedSkyChartView);
    else if (!openDateFromHash(initialHash)) updateSummary([]);
  }
  document.addEventListener('DOMContentLoaded', init);
})();
