// Encoding repairs for Astrology Foundations. Glyph rendering is owned exclusively by the canonical consumer.
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

  function start() {
    repairText(document.body);
    let queued = false;
    new MutationObserver(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        repairText(document.body);
      });
    }).observe(document.body, { childList:true, subtree:true, characterData:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
