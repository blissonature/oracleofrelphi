// Renders Sky Chart comparison and relationship controls from the Master Glyph Set.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const aliases = new Map();
  const names = new Map();
  function add(identity, name, alternatives) {
    names.set(identity, name);
    [identity, name].concat(alternatives || []).forEach(function (value) { aliases.set(normalize(value), identity); });
  }
  function normalize(value) {
    return String(value || '').replace(/[\uFE0E\uFE0F]/g, '')
      .replace(/[☉☽☿♀♂♃♄♅♆♇⯓⚷⚸☊☋⊗♈-♓☌☍□△✶⚺⚻⚼∠]/g, ' ')
      .replace(/\b(?:bQ|bN|bS|tD|tS|ASC|DSC|MC|IC|Vx)\b/g, ' ')
      .replace(/[^a-z0-9]+/gi, ' ').trim().toLowerCase();
  }

  add('sun','Sun'); add('moon','Moon'); add('mercury','Mercury'); add('venus','Venus'); add('mars','Mars');
  add('jupiter','Jupiter'); add('saturn','Saturn'); add('uranus','Uranus'); add('neptune','Neptune'); add('pluto','Pluto');
  add('chiron','Chiron'); add('north-node','North Node',['True Node','Mean Node','Ascending Node','Node']);
  add('south-node','South Node',['Descending Node']); add('lilith','Lilith',['Black Moon Lilith','BML']);
  add('part-of-fortune','Part of Fortune',['Fortune','Pars Fortunae','PoF']); add('vertex','Vertex',['Vx']);
  add('asc','Ascendant',['Rising','ASC']); add('dsc','Descendant',['DSC']); add('mc','Midheaven',['MC']); add('ic','Imum Coeli',['IC']);
  ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'].forEach(function (name) { add(name.toLowerCase(),name); });
  add('conjunction','Conjunction',['Conjunct']); add('semi-sextile','Semisextile',['Semi-sextile','Semi sextile']);
  add('octile','Semisquare',['Semi-square','Semi square','Octile']); add('sextile','Sextile'); add('quintile','Quintile');
  add('square','Square'); add('trine','Trine'); add('tri-octile','Sesquiquadrate',['Sesquisquare','Sesqui-square','Tri-octile','Trioctile']);
  add('bi-quintile','Biquintile',['Bi-quintile','Bi quintile']); add('quincunx','Quincunx',['Inconjunct']); add('opposition','Opposition',['Opposite']);
  add('undecile','Undecile'); add('decile','Decile',['Semiquintile','Semi-quintile']); add('novile','Novile'); add('septile','Septile');
  add('binovile','Binovile',['Bi-novile','Bi novile']); add('biseptile','Biseptile',['Bi-septile','Bi septile']);
  add('tridecile','Tridecile',['Tri-decile','Tri decile']); add('triseptile','Triseptile',['Tri-septile','Tri septile']);

  function relevant(node) {
    return !!node.closest && !!node.closest('#chartPanel,#chartOutput,#currentSkyOutput,.relationship-list,.relationship-filters,.aspect-relationship-filters,[data-sky-chart-mode],[data-comparison-filter],[data-aspect-filter],[data-zodiac-filter],.relationship-list-row,.relphi-progressive-reading');
  }
  function identify(value) {
    const raw = String(value || '').replace(/[\uFE0E\uFE0F]/g,'').trim();
    const entry = window.RelphiGlyphRegistry && window.RelphiGlyphRegistry.resolve(raw);
    return entry ? entry.id : aliases.get(normalize(raw)) || null;
  }
  function canonicalIcon(identity) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','-12 -12 24 24'); svg.setAttribute('aria-hidden','true'); svg.classList.add('relphi-filter-canonical-glyph');
    const group = document.createElementNS('http://www.w3.org/2000/svg','g'); svg.appendChild(group);
    window.RelphiGlyphComponent.draw(group, identity, { radius:9.5, padding:.5, color:'#111' }).catch(function () {});
    return svg;
  }
  function displayName(identity, fallback) {
    return names.get(identity) || window.RelphiGlyphRegistry.get(identity)?.name || fallback || identity;
  }
  function decorateVisual(node) {
    if (!node || node.dataset.relphiCanonicalGlyphAsset === 'done') return;
    if (node.matches('input,select,textarea') || node.querySelector('input,select,textarea,img')) return;
    const identity = identify(node.textContent || node.getAttribute('aria-label') || node.dataset.value || '');
    if (!identity) return;
    const name = displayName(identity,node.textContent.trim());
    node.textContent = '';
    const icon = canonicalIcon(identity);
    if (node.classList.contains('relphi-progressive-glyph')) {
      node.append(icon); node.setAttribute('aria-label','Reveal ' + name);
    } else {
      const label = document.createElement('span'); label.className = 'relphi-filter-canonical-name'; label.textContent = name;
      node.append(icon,label);
    }
    node.dataset.relphiCanonicalGlyphAsset = 'done';
  }
  function cleanNativeOption(option) {
    if (!option || option.dataset.relphiCanonicalGlyphAsset === 'done') return;
    const identity = identify(option.textContent || option.label || option.value);
    if (!identity) return;
    const name = displayName(identity,option.textContent.trim());
    option.textContent = name; option.label = name; option.dataset.relphiCanonicalGlyphAsset = 'done';
  }
  function decorateLeadingText(root) {
    const walker = document.createTreeWalker(root,NodeFilter.SHOW_TEXT); const nodes=[];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      const parent=node.parentElement; if (!parent || parent.closest('.relphi-filter-canonical-label') || !relevant(parent)) return;
      const raw=node.nodeValue || '';
      const match=raw.match(/^\s*([☉☽☿♀♂♃♄♅♆♇⯓⚷⚸☊☋⊗♈-♓☌☍□△✶⚺⚻⚼∠]|bQ|ASC|DSC|MC|IC|Vx)\s+([A-Za-z][A-Za-z -]+)/);
      if (!match) return;
      const identity=identify(match[1]) || identify(match[2]); if (!identity) return;
      const wrap=document.createElement('span'); wrap.className='relphi-filter-canonical-label';
      wrap.append(canonicalIcon(identity),document.createTextNode(displayName(identity,match[2]) + raw.slice(match[0].length)));
      node.parentNode.replaceChild(wrap,node);
    });
  }
  function styles() {
    if (document.getElementById('relphi-filter-canonical-styles')) return;
    const style=document.createElement('style'); style.id='relphi-filter-canonical-styles';
    style.textContent='.relphi-filter-canonical-glyph{width:1.35em;height:1.35em;display:inline-block;flex:0 0 1.35em;vertical-align:-.28em;overflow:visible}.relphi-filter-canonical-name{min-width:0}.relphi-filter-canonical-label{display:inline-flex;align-items:center;gap:.28em}.relationship-list-row .relphi-filter-canonical-glyph,[role="option"] .relphi-filter-canonical-glyph{width:1.5em;height:1.5em;flex-basis:1.5em}.relphi-progressive-glyph .relphi-filter-canonical-glyph{width:1.2em;height:1.2em;vertical-align:-.22em}';
    document.head.appendChild(style);
  }
  function run() {
    if (!window.RelphiGlyphRegistry || !window.RelphiGlyphComponent) { setTimeout(schedule,50); return; }
    styles();
    document.querySelectorAll('option').forEach(function (option) { if (relevant(option)) cleanNativeOption(option); });
    document.querySelectorAll('button,[role="option"],[role="checkbox"],[data-body],[data-planet],[data-point],[data-sign],[data-aspect],.relationship-list-row span,.relationship-list-row strong,.relphi-progressive-glyph').forEach(function (node) { if (relevant(node)) decorateVisual(node); });
    document.querySelectorAll('.relationship-list-row,.relationship-list,.relationship-filters,.aspect-relationship-filters').forEach(decorateLeadingText);
  }
  let queued=false;
  function schedule() { if (queued) return; queued=true; requestAnimationFrame(function () { queued=false; run(); }); }
  run(); new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  window.RelphiSkyFilterGlyphs=Object.freeze({refresh:run});
})();