// Uses the approved planetary SVGs in Sky Ledger filter controls.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

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
      '  width:1.08em;',
      '  height:1.08em;',
      '  display:inline-block;',
      '  flex:0 0 auto;',
      '  object-fit:contain;',
      '  vertical-align:-0.16em;',
      '  margin-right:.32em;',
      '}',
      'label.relphi-filter-glyph-label{display:flex;align-items:center;}',
      'label.relphi-filter-glyph-label input{flex:0 0 auto;}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function replaceGlyphInLabel(label) {
    if (!label || label.dataset.relphiGlyphAligned === 'true') return;
    if (!label.querySelector('input[type="checkbox"], input[type="radio"]')) return;

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

    if (!targetNode || !GLYPHS[symbol]) return;

    const image = document.createElement('img');
    image.className = 'relphi-filter-planet-glyph';
    image.src = 'assets/planet-glyphs/' + GLYPHS[symbol] + '.svg';
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');

    targetNode.nodeValue = targetNode.nodeValue.replace(symbol, '');
    label.insertBefore(image, targetNode);
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
