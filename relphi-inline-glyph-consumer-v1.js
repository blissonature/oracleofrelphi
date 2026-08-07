// Replaces visible astrology-symbol text with the approved Relphi glyph component.
// Symbol characters may remain in data/aliases, but they are not allowed to become a second visual canon.
(function () {
  'use strict';
  if (window.__relphiInlineGlyphConsumerV1) return;
  window.__relphiInlineGlyphConsumerV1 = true;

  const NS = 'http://www.w3.org/2000/svg';
  const TOKENS = Object.freeze({
    '☉':'sun','⊙':'sun','☽':'moon','☾':'moon','☿':'mercury','♀':'venus','♂':'mars',
    '♃':'jupiter','♄':'saturn','♅':'uranus','⛢':'uranus','♆':'neptune','♇':'pluto','⯓':'pluto',
    '☊':'north-node','☋':'south-node','⚸':'lilith','⊗':'part-of-fortune',
    '♈':'aries','♉':'taurus','♊':'gemini','♋':'cancer','♌':'leo','♍':'virgo',
    '♎':'libra','♏':'scorpio','♐':'sagittarius','♑':'capricorn','♒':'aquarius','♓':'pisces'
  });
  const pattern = new RegExp('(' + Object.keys(TOKENS).map(token => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'g');
  let queued = false;

  function canonicalSpan(id) {
    const host = document.createElement('span');
    host.className = 'relphi-inline-canonical-glyph';
    host.dataset.canonicalGlyphId = id;
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

    const bubble = window.RelphiGlyphComponent.createBubble(svg, id, { radius:19, padding:1, color:'currentColor' });
    bubble.circle.style.opacity = '0';
    bubble.circle.setAttribute('aria-hidden', 'true');
    Promise.resolve(bubble.ready).catch(() => host.replaceChildren());
    return host;
  }

  function eligible(node) {
    const parent = node.parentElement;
    if (!parent) return false;
    if (parent.closest('script,style,textarea,input,select,option,svg,.relphi-inline-canonical-glyph')) return false;
    return true;
  }

  function replaceTextNode(node) {
    if (!eligible(node)) return;
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

  function scan(root) {
    if (!window.RelphiGlyphRegistry || !window.RelphiGlyphComponent) return;
    const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(replaceTextNode);
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
    scan(document.body);
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true, characterData:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
