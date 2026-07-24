// Uses the canonical circled glyph component in Sky Ledger filter controls.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const GLYPHS = {
    '☉': 'sun',
    '☽': 'moon',
    '☿': 'mercury',
    '♀': 'venus',
    '♂': 'mars',
    '♃': 'jupiter',
    '♄': 'saturn',
    '♅': 'uranus',
    '♆': 'neptune',
    '♇': 'pluto',
    '⯓': 'pluto'
  };

  function ensureStyles() {
    if (document.getElementById('relphi-sky-ledger-glyph-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-sky-ledger-glyph-style';
    style.textContent = [
      '.relphi-filter-planet-glyph{',
      '  width:1.42em;',
      '  height:1.42em;',
      '  display:inline-block;',
      '  flex:0 0 auto;',
      '  vertical-align:-0.24em;',
      '  margin-right:.34em;',
      '  overflow:visible;',
      '}',
      'label.relphi-filter-glyph-label{display:flex;align-items:center;}',
      'label.relphi-filter-glyph-label input{flex:0 0 auto;}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function makeBubble(identity, label) {
    const svg = document.createElementNS(NS, 'svg');
    svg.classList.add('relphi-filter-planet-glyph');
    svg.setAttribute('viewBox', '-21 -21 42 42');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const color = getComputedStyle(label).color || '#111111';
    const bubble = window.RelphiGlyphComponent.createBubble(svg, identity, {
      radius: 19,
      padding: 1,
      strokeWidth: 2.35,
      color,
      fill: '#ffffff'
    });
    bubble.ready.catch(function (error) { console.error(error); });
    return svg;
  }

  function replaceGlyphInLabel(label) {
    if (!label || label.dataset.relphiGlyphAligned === 'true') return;
    if (!label.querySelector('input[type="checkbox"], input[type="radio"]')) return;
    if (!window.RelphiGlyphRegistry || !window.RelphiGlyphComponent) return;

    let targetNode = null;
    let symbol = '';
    Array.prototype.some.call(label.childNodes, function (node) {
      if (node.nodeType !== Node.TEXT_NODE) return false;
      const match = (node.nodeValue || '').match(/[☉☽☿♀♂♃♄♅♆♇⯓]/);
      if (!match) return false;
      targetNode = node;
      symbol = match[0];
      return true;
    });

    const identity = GLYPHS[symbol];
    if (!targetNode || !identity) return;

    const bubble = makeBubble(identity, label);
    targetNode.nodeValue = targetNode.nodeValue.replace(symbol, '');
    label.insertBefore(bubble, targetNode);
    label.classList.add('relphi-filter-glyph-label');
    label.dataset.relphiGlyphAligned = 'true';
  }

  function run(root) {
    ensureStyles();
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('label').forEach(replaceGlyphInLabel);
    if (root && root.matches && root.matches('label')) replaceGlyphInLabel(root);
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
          });
        });
      });
    }).observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();