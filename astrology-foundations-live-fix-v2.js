// Direct, cache-busted repairs for Astrology Foundations.
(function () {
  'use strict';
  if (!/(^|\/)astrology-foundations\.html$/.test(location.pathname)) return;

  const VALID_TABS = new Set(['houses','signs','planets','moon','aspects','tonic','systems','ancient','orders','wheel']);
  const PLANET_BY_GLYPH = {
    '☉':'sun','⊙':'sun','☽':'moon','☾':'moon','☿':'mercury','♀':'venus','♂':'mars',
    '♃':'jupiter','♄':'saturn','♅':'uranus','⛢':'uranus','♆':'neptune','♇':'pluto','⯓':'pluto',
    '⊕':'earth','♁':'earth','🜨':'earth'
  };
  const REPAIRS = [
    [/Â·/g,'·'],[/â†’/g,'→'],[/â€”/g,'—'],[/â€“/g,'–'],[/â€™/g,'’'],
    [/â€œ/g,'“'],[/â€/g,'”'],[/â€¦/g,'…'],[/â—Ž/g,'◎'],[/â˜/g,'☍'],
    [/â–³/g,'△'],[/â–¡/g,'□'],[/âš¹/g,'⚹'],[/âˆ /g,'∠'],[/âšº/g,'⚺']
  ];

  let applyingHistory = false;

  function repairString(value) {
    let next = value;
    REPAIRS.forEach(function (pair) { next = next.replace(pair[0], pair[1]); });
    return next;
  }

  function repairVisibleText(root) {
    const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      const fixed = repairString(node.nodeValue || '');
      if (fixed !== node.nodeValue) node.nodeValue = fixed;
    });
    if (document.title) document.title = repairString(document.title);
  }

  function planetImage(name, extraClass) {
    const img = document.createElement('img');
    img.src = 'assets/planet-glyphs/' + name + '.svg?v=2';
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.decoding = 'async';
    img.className = extraClass || ('planet-svg planet-svg-' + name + ' planet-glyph-approved');
    return img;
  }

  function repairEarthOrder() {
    const card = document.querySelector('.order-planet-card');
    const heading = card && card.querySelector('h3');
    const symbol = document.querySelector('.order-grid .carousel-symbol');
    if (!heading || !symbol || heading.textContent.trim().toLowerCase() !== 'earth') return;
    if (symbol.querySelector('img.planet-svg-earth') && symbol.children.length === 1) return;
    symbol.replaceChildren(planetImage('earth'));
  }

  function standardizeWheel() {
    document.querySelectorAll('text.zw-ruler-glyph').forEach(function (node) {
      const glyph = (node.textContent || '').trim();
      const name = PLANET_BY_GLYPH[glyph];
      if (!name) return;

      const ns = 'http://www.w3.org/2000/svg';
      const image = document.createElementNS(ns, 'image');
      Array.from(node.attributes).forEach(function (attribute) {
        if (!['x','y','text-anchor'].includes(attribute.name)) image.setAttribute(attribute.name, attribute.value);
      });
      const x = Number(node.getAttribute('x') || 0);
      const y = Number(node.getAttribute('y') || 0);
      image.setAttribute('href', 'assets/planet-glyphs/' + name + '.svg?v=2');
      image.setAttribute('x', String(x - 10));
      image.setAttribute('y', String(y - 10));
      image.setAttribute('width', '20');
      image.setAttribute('height', '20');
      image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      image.setAttribute('aria-label', name.charAt(0).toUpperCase() + name.slice(1));
      image.classList.add('zw-ruler-glyph-svg');
      node.replaceWith(image);
    });
  }

  function tabFromHash() {
    const raw = location.hash.replace(/^#/, '').split('/')[0].toLowerCase();
    return VALID_TABS.has(raw) ? raw : 'houses';
  }

  function activateTabFromLocation() {
    const kind = tabFromHash();
    const button = document.querySelector('.foundation-tabs button[data-kind="' + kind + '"]');
    if (!button || button.getAttribute('aria-pressed') === 'true') return;
    applyingHistory = true;
    button.click();
    requestAnimationFrame(function () { applyingHistory = false; });
  }

  function installHistory() {
    document.addEventListener('click', function (event) {
      const button = event.target.closest('.foundation-tabs button[data-kind]');
      if (!button || applyingHistory) return;
      const kind = button.dataset.kind;
      if (!VALID_TABS.has(kind)) return;
      const nextHash = '#' + kind;
      if (location.hash !== nextHash) history.pushState({ foundationTab: kind }, '', nextHash);
    }, true);

    window.addEventListener('popstate', activateTabFromLocation);
    window.addEventListener('hashchange', activateTabFromLocation);
    activateTabFromLocation();
  }

  function runRepairs() {
    repairVisibleText(document.body);
    repairEarthOrder();
    standardizeWheel();
  }

  function start() {
    installHistory();
    runRepairs();
    let queued = false;
    new MutationObserver(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        runRepairs();
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
