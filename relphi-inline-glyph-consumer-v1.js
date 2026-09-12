// Replaces visible astrology-symbol text with the approved Relphi glyph component.
// Symbol characters may remain as search/data aliases, but they cannot become a second visual canon.
(function () {
  'use strict';
  if (window.__relphiInlineGlyphConsumerV2) return;
  window.__relphiInlineGlyphConsumerV2 = true;

  const NS = 'http://www.w3.org/2000/svg';
  const TOKENS = Object.freeze({
    '☉':'sun','⊙':'sun','☽':'moon','☾':'moon','☿':'mercury','♀':'venus','♂':'mars',
    '♃':'jupiter','♄':'saturn','♅':'uranus','⛢':'uranus','♆':'neptune','♇':'pluto','⯓':'pluto',
    '☊':'north-node','☋':'south-node','⚸':'lilith','⊗':'part-of-fortune',
    '♈':'aries','♉':'taurus','♊':'gemini','♋':'cancer','♌':'leo','♍':'virgo',
    '♎':'libra','♏':'scorpio','♐':'sagittarius','♑':'capricorn','♒':'aquarius','♓':'pisces'
  });
  const SVG_TEXT_IDENTITIES = Object.freeze(Object.assign({}, TOKENS, {
    'ASC':'asc','Asc':'asc','DSC':'dsc','Dsc':'dsc','MC':'mc','IC':'ic','Vx':'vertex'
  }));
  const pattern = new RegExp('(' + Object.keys(TOKENS).map(token => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'g');
  let queued = false;

  function componentReady() {
    return Boolean(window.RelphiGlyphRegistry && window.RelphiGlyphComponent?.createBubble);
  }

  function canonicalBubble(parent, id, radius, color) {
    const registry = window.RelphiGlyphRegistry;
    const component = window.RelphiGlyphComponent;
    const entry = registry && (registry.get(id) || registry.resolve(id));
    if (!entry || !component?.createBubble) return null;
    const bubble = component.createBubble(parent, entry.id, {
      radius:Math.max(4, Number(radius) || 10),
      padding:0.6,
      color:color || 'currentColor'
    });
    bubble.circle.style.opacity = '0';
    bubble.circle.setAttribute('aria-hidden', 'true');
    return bubble;
  }

  function canonicalSpan(id) {
    const host = document.createElement('span');
    host.className = 'relphi-inline-canonical-glyph';
    host.dataset.canonicalGlyphId = id;
    host.dataset.masterGlyphSource = 'https://oracleofrelphi.com/glyphs-unified-preview.html';
    host.setAttribute('aria-label', id);
    host.style.display = 'inline-block';
    host.style.width = '1.15em';
    host.style.height = '1.15em';
    host.style.verticalAlign = '-0.16em';
    host.style.color = 'currentColor';

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '-19 -19 38 38');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.overflow = 'visible';
    host.appendChild(svg);

    const bubble = canonicalBubble(svg, id, 19, 'currentColor');
    if (!bubble) return host;
    Promise.resolve(bubble.ready).catch(() => host.replaceChildren());
    return host;
  }

  function eligibleTextNode(node) {
    const parent = node.parentElement;
    if (!parent) return false;
    if (parent.namespaceURI === NS) return false;
    if (parent.closest('script,style,textarea,input,select,option,.relphi-inline-canonical-glyph')) return false;
    return true;
  }

  function replaceHtmlTextNode(node) {
    if (!eligibleTextNode(node)) return;
    const value = node.nodeValue || '';
    pattern.lastIndex = 0;
    if (!pattern.test(value)) return;
    pattern.lastIndex = 0;

    const fragment = document.createDocumentFragment();
    let cursor = 0;
    let match;
    while ((match = pattern.exec(value))) {
      if (match.index > cursor) fragment.appendChild(document.createTextNode(value.slice(cursor, match.index)));
      fragment.appendChild(canonicalSpan(TOKENS[match[0]]));
      cursor = match.index + match[0].length;
    }
    if (cursor < value.length) fragment.appendChild(document.createTextNode(value.slice(cursor)));
    node.replaceWith(fragment);
  }

  function replaceSvgText(node) {
    if (!(node instanceof SVGTextElement) || node.closest('.relphi-inline-canonical-glyph')) return;
    const token = String(node.textContent || '').replace(/[\uFE0E\uFE0F]/g, '').trim();
    const id = SVG_TEXT_IDENTITIES[token];
    if (!id) return;

    let box;
    try { box = node.getBBox(); } catch (_) { return; }
    if (!box || (!box.width && !box.height)) return;

    const computed = getComputedStyle(node);
    const color = computed.fill && computed.fill !== 'none' ? computed.fill : (computed.color || 'currentColor');
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const radius = Math.min(18, Math.max(5, Math.max(box.width, box.height) / 2));
    const group = document.createElementNS(NS, 'g');
    const originalTransform = node.getAttribute('transform');
    group.setAttribute('transform', (originalTransform ? originalTransform + ' ' : '') + `translate(${cx} ${cy})`);
    group.setAttribute('aria-label', node.getAttribute('aria-label') || id);
    group.dataset.canonicalGlyphId = id;
    group.dataset.masterGlyphSource = 'https://oracleofrelphi.com/glyphs-unified-preview.html';
    Array.from(node.classList).forEach(name => group.classList.add(name));
    group.classList.add('relphi-inline-canonical-glyph');

    const bubble = canonicalBubble(group, id, radius, color);
    if (!bubble) return;
    node.replaceWith(group);
    Promise.resolve(bubble.ready).catch(() => group.replaceChildren());
  }

  function scan(root) {
    if (!componentReady()) return;
    const scope = root || document.body;
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach(replaceHtmlTextNode);
    if (scope.querySelectorAll) scope.querySelectorAll('svg text').forEach(replaceSvgText);
    if (scope.matches?.('svg text')) replaceSvgText(scope);
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      scan(document.body);
    });
  }

  function start() {
    if (!componentReady()) {
      setTimeout(start, 30);
      return;
    }
    scan(document.body);
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true, characterData:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
