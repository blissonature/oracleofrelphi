// Keeps comparison and relationship filter labels aligned with the canonical Sky Chart glyph vocabulary.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const LABELS = new Map();
  function add(glyph, name, aliases) {
    [name].concat(aliases || []).forEach(function (alias) {
      LABELS.set(normalize(alias), glyph + ' ' + name);
    });
  }
  function normalize(value) {
    return String(value || '')
      .replace(/[☉☽☿♀♂♃♄♅♆♇⯓⚷⚸☊☋⊗♈-♓☌☍□△✶⚺⚻⚼∠]/g, ' ')
      .replace(/\b(?:bQ|bN|bS|tD|tS|ASC|DSC|MC|IC|Vx)\b/g, ' ')
      .replace(/[^a-z0-9]+/gi, ' ')
      .trim()
      .toLowerCase();
  }

  add('☉','Sun'); add('☽','Moon'); add('☿','Mercury'); add('♀','Venus'); add('♂','Mars');
  add('♃','Jupiter'); add('♄','Saturn'); add('♅','Uranus'); add('♆','Neptune'); add('⯓','Pluto');
  add('⚷','Chiron'); add('☊','North Node',['True Node','Mean Node','Ascending Node','Node']);
  add('☋','South Node',['Descending Node']); add('⚸','Lilith',['Black Moon Lilith','BML']);
  add('⊗','Part of Fortune',['Fortune','Pars Fortunae','PoF']); add('Vx','Vertex');
  add('ASC','Ascendant',['Rising','ASC']); add('DSC','Descendant',['DSC']);
  add('MC','Midheaven',['MC']); add('IC','Imum Coeli',['IC']);

  [['♈','Aries'],['♉','Taurus'],['♊','Gemini'],['♋','Cancer'],['♌','Leo'],['♍','Virgo'],
   ['♎','Libra'],['♏','Scorpio'],['♐','Sagittarius'],['♑','Capricorn'],['♒','Aquarius'],['♓','Pisces']]
    .forEach(function (pair) { add(pair[0], pair[1]); });

  add('☌','Conjunction',['Conjunct']);
  add('⚺','Semisextile',['Semi-sextile','Semi sextile']);
  add('U','Undecile');
  add('D','Decile',['Semiquintile','Semi-quintile']);
  add('N','Novile');
  add('∠','Semisquare',['Semi-square','Semi square','Octile']);
  add('S','Septile');
  add('✶','Sextile');
  add('Q','Quintile');
  add('bN','Binovile',['Bi-novile','Bi novile']);
  add('□','Square');
  add('bS','Biseptile',['Bi-septile','Bi septile']);
  add('tD','Tridecile',['Tri-decile','Tri decile']);
  add('△','Trine');
  add('⚼','Sesquiquadrate',['Sesquisquare','Sesqui-square','Tri-octile','Trioctile']);
  add('bQ','Biquintile',['Bi-quintile','Bi quintile']);
  add('⚻','Quincunx',['Inconjunct']);
  add('tS','Triseptile',['Tri-septile','Tri septile']);
  add('☍','Opposition',['Opposite']);

  function decorateOption(option) {
    if (!option || option.dataset.relphiCanonicalGlyphLabel === 'done') return;
    const key = normalize(option.textContent || option.label || option.value);
    const label = LABELS.get(key);
    if (!label) return;
    option.textContent = label;
    option.label = label;
    option.dataset.relphiCanonicalGlyphLabel = 'done';
  }

  function decorateButton(button) {
    if (!button || button.dataset.relphiCanonicalGlyphLabel === 'done') return;
    if (button.querySelector('svg,img,input,select')) return;
    const key = normalize(button.textContent);
    const label = LABELS.get(key);
    if (!label) return;
    button.textContent = label;
    button.dataset.relphiCanonicalGlyphLabel = 'done';
  }

  function relevant(node) {
    return !!node.closest([
      '#chartPanel','#chartOutput','#currentSkyOutput',
      '.relationship-list','.relationship-filters','.aspect-relationship-filters',
      '[data-sky-chart-mode]','[data-comparison-filter]','[data-aspect-filter]','[data-zodiac-filter]'
    ].join(','));
  }

  function run() {
    document.querySelectorAll('option').forEach(function (option) {
      if (relevant(option)) decorateOption(option);
    });
    document.querySelectorAll('button,[role="option"],[role="checkbox"]').forEach(function (button) {
      if (relevant(button)) decorateButton(button);
    });
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; run(); });
  }

  run();
  new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true });
  window.RelphiSkyFilterGlyphs = Object.freeze({ refresh:run });
})();