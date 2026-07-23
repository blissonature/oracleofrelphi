// Canonical SVG glyph rendering for Sky Chart, including Chiron.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const GLYPHS = {
    sun:'sun', moon:'moon', mercury:'mercury', venus:'venus', mars:'mars',
    jupiter:'jupiter', saturn:'saturn', uranus:'uranus', neptune:'neptune',
    pluto:'pluto', chiron:'chiron'
  };
  const SYMBOLS = {
    '☉':'sun', '☽':'moon', '☿':'mercury', '♀':'venus', '♂':'mars',
    '♃':'jupiter', '♄':'saturn', '♅':'uranus', '♆':'neptune',
    '♇':'pluto', '⯓':'pluto', '⚷':'chiron'
  };
  const NAMES = Object.keys(GLYPHS);

  function canonicalName(value) {
    const normalized = String(value || '').trim().toLowerCase().replace(/[^a-z]/g, '');
    if (normalized === 'sol') return 'sun';
    if (normalized === 'luna') return 'moon';
    return GLYPHS[normalized] ? normalized : '';
  }

  function glyphUrl(name) {
    return 'assets/planet-glyphs/' + GLYPHS[name] + '.svg';
  }

  function makeImage(name, className) {
    const image = document.createElement('img');
    image.className = className || 'relphi-canonical-planet-glyph';
    image.src = glyphUrl(name);
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    image.dataset.relphiPlanet = name;
    return image;
  }

  function ensureStyles() {
    if (document.getElementById('relphi-canonical-sky-glyph-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-canonical-sky-glyph-style';
    style.textContent = [
      '.relphi-canonical-planet-glyph{width:1.15em;height:1.15em;display:inline-block;object-fit:contain;vertical-align:-.18em;flex:0 0 auto}',
      '.relphi-canonical-glyph-label{display:inline-flex;align-items:center;gap:.3em}',
      '.relphi-canonical-wheel-glyph{width:100%;height:100%;display:block;object-fit:contain;pointer-events:none}',
      '.relphi-chiron-supported{--relphi-chiron-supported:1}'
    ].join('\n');
    document.head.appendChild(style);
    document.documentElement.classList.add('relphi-chiron-supported');
  }

  function replaceTextGlyph(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE || !node.nodeValue) return;
    const match = node.nodeValue.match(/[☉☽☿♀♂♃♄♅♆♇⯓⚷]/);
    if (!match) return;
    const name = SYMBOLS[match[0]];
    const parent = node.parentElement;
    if (!parent || parent.closest('script,style,textarea,input,option')) return;
    const before = node.nodeValue.slice(0, match.index);
    const after = node.nodeValue.slice(match.index + match[0].length);
    const fragment = document.createDocumentFragment();
    if (before) fragment.appendChild(document.createTextNode(before));
    fragment.appendChild(makeImage(name));
    if (after) fragment.appendChild(document.createTextNode(after));
    parent.replaceChild(fragment, node);
    parent.classList.add('relphi-canonical-glyph-label');
  }

  function bodyFromElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return '';
    const values = [
      element.dataset.planet, element.dataset.body, element.dataset.object,
      element.getAttribute('aria-label'), element.getAttribute('title'),
      element.getAttribute('data-name'), element.className
    ];
    for (const value of values) {
      const text = String(value || '').toLowerCase();
      for (const name of NAMES) if (new RegExp('(^|[^a-z])' + name + '([^a-z]|$)').test(text)) return name;
    }
    const exact = canonicalName(element.textContent);
    return exact;
  }

  function replaceGlyphElement(element) {
    if (!element || element.dataset.relphiCanonicalGlyph === 'true') return;
    if (element.matches('img.relphi-canonical-planet-glyph')) return;
    const name = bodyFromElement(element);
    if (!name) return;
    const text = String(element.textContent || '').trim();
    const symbolOnly = /^[☉☽☿♀♂♃♄♅♆♇⯓⚷]$/.test(text);
    const glyphClass = /wheel|marker|glyph/i.test(String(element.className || ''));
    if (!symbolOnly && !glyphClass) return;
    element.textContent = '';
    element.appendChild(makeImage(name, glyphClass ? 'relphi-canonical-wheel-glyph' : 'relphi-canonical-planet-glyph'));
    element.dataset.relphiCanonicalGlyph = 'true';
    element.setAttribute('aria-label', element.getAttribute('aria-label') || name.charAt(0).toUpperCase() + name.slice(1));
  }

  function ensureChironOptions(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('select').forEach(function (select) {
      const values = Array.from(select.options).map(function (option) { return canonicalName(option.value || option.textContent); });
      if (!values.some(Boolean) || values.includes('chiron')) return;
      const option = document.createElement('option');
      option.value = 'Chiron';
      option.textContent = 'Chiron';
      select.appendChild(option);
    });
  }

  function run(root) {
    ensureStyles();
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('*').forEach(replaceGlyphElement);
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach(replaceTextGlyph);
    ensureChironOptions(scope);
  }

  function start() {
    run(document);
    let queued = false;
    new MutationObserver(function (mutations) {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        mutations.forEach(function (mutation) {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType === Node.ELEMENT_NODE) run(node);
            else if (node.nodeType === Node.TEXT_NODE) replaceTextGlyph(node);
          });
        });
      });
    }).observe(document.body, { childList:true, subtree:true });

    window.RelphiCanonicalSkyGlyphs = {
      glyphs:Object.assign({}, GLYPHS),
      symbols:Object.assign({}, SYMBOLS),
      url:glyphUrl,
      image:makeImage,
      refresh:function () { run(document); }
    };
    window.dispatchEvent(new CustomEvent('relphi:canonical-sky-glyphs-ready', { detail:{ chiron:true } }));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
