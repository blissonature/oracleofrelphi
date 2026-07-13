// Consistency and encoding repairs for Astrology Foundations.
(function () {
  'use strict';
  if (!/(^|\/)astrology-foundations\.html$/.test(window.location.pathname)) return;

  const MOJIBAKE = new Map([
    ['Â·', '·'],
    ['â†’', '→'],
    ['â€”', '—'],
    ['â€“', '–'],
    ['â€™', '’'],
    ['â€œ', '“'],
    ['â€', '”'],
    ['â€¦', '…'],
    ['â—Ž', '◎'],
    ['â˜', '☍'],
    ['â–³', '△'],
    ['â–¡', '□'],
    ['âš¹', '⚹'],
    ['âˆ ', '∠'],
    ['âšº', '⚺']
  ]);

  const PLANET_BY_GLYPH = {
    '☉': 'sun', '⊙': 'sun',
    '☽': 'moon', '☾': 'moon',
    '☿': 'mercury',
    '♀': 'venus',
    '♂': 'mars',
    '♃': 'jupiter',
    '♄': 'saturn',
    '♅': 'uranus', '⛢': 'uranus',
    '♆': 'neptune',
    '♇': 'pluto', '⯓': 'pluto',
    '⊕': 'earth', '♁': 'earth', '🜨': 'earth'
  };

  function repairText(root) {
    const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      let value = node.nodeValue;
      MOJIBAKE.forEach(function (replacement, broken) {
        value = value.split(broken).join(replacement);
      });
      if (value !== node.nodeValue) node.nodeValue = value;
    });
  }

  function planetImage(name, className) {
    const img = document.createElement('img');
    img.src = `assets/planet-glyphs/${name}.svg`;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.className = className || `planet-svg planet-svg-${name} planet-glyph-approved`;
    img.decoding = 'async';
    return img;
  }

  function replaceEarthFallback(root) {
    const scope = root || document;
    const orderCard = scope.querySelector('.order-planet-card');
    const heading = orderCard && orderCard.querySelector('h3');
    const symbol = scope.querySelector('.order-grid .carousel-symbol');
    if (heading && symbol && heading.textContent.trim().toLowerCase() === 'earth') {
      const current = symbol.querySelector('img.planet-svg-earth');
      if (!current || symbol.children.length !== 1) symbol.replaceChildren(planetImage('earth'));
    }
  }

  function standardizeWheelGlyphs(root) {
    const scope = root || document;
    scope.querySelectorAll('.zw-ruler-glyph').forEach(function (textNode) {
      if (textNode.dataset.standardized === 'true') return;
      const raw = (textNode.textContent || '').trim();
      const name = PLANET_BY_GLYPH[raw];
      if (!name) return;

      const ns = 'http://www.w3.org/2000/svg';
      const image = document.createElementNS(ns, 'image');
      const x = parseFloat(textNode.getAttribute('x') || '0');
      const y = parseFloat(textNode.getAttribute('y') || '0');
      image.setAttribute('href', `assets/planet-glyphs/${name}.svg`);
      image.setAttribute('x', String(x - 10));
      image.setAttribute('y', String(y - 10));
      image.setAttribute('width', '20');
      image.setAttribute('height', '20');
      image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      image.setAttribute('class', textNode.getAttribute('class') || 'zw-ruler-glyph');
      image.dataset.standardized = 'true';
      textNode.replaceWith(image);
    });
  }

  function fixAll() {
    repairText(document.body);
    replaceEarthFallback(document);
    standardizeWheelGlyphs(document);
  }

  function start() {
    fixAll();
    let queued = false;
    new MutationObserver(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        fixAll();
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
