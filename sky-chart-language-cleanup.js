// Keeps the public Sky Chart language source-neutral and preserves the progressive Wizard.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const replacements = [
    [/Paste from Astro-Seek/gi, 'Type or paste'],
    [/Astro-Seek paste/gi, 'Type or paste'],
    [/AstroSeek paste/gi, 'Type or paste'],
    [/Paste or type/gi, 'Type or paste'],
    [/from Astro-Seek/gi, 'from typed or pasted placements'],
    [/Astro-Seek/gi, 'another chart source']
  ];

  function cleaned(value) {
    return replacements.reduce(function (text, pair) {
      return text.replace(pair[0], pair[1]);
    }, String(value || ''));
  }

  function hideRetiredWizard() {
    if (document.getElementById('relphi-progressive-wizard-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-progressive-wizard-style';
    style.textContent = `
      body.sky-chart-page .sky-wizard-shell-frictionless,
      body.sky-chart-page .sky-wizard-shell:not([data-relphi-wizard-v2]) {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function cleanElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return;
    ['placeholder', 'title', 'aria-label'].forEach(function (attribute) {
      if (!element.hasAttribute(attribute)) return;
      const before = element.getAttribute(attribute) || '';
      const after = cleaned(before);
      if (after !== before) element.setAttribute(attribute, after);
    });
  }

  function clean(root) {
    const scope = root && root.nodeType ? root : document.body;
    if (!scope) return;
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      const before = node.nodeValue || '';
      const after = cleaned(before);
      if (after !== before) node.nodeValue = after;
    });
    if (scope.nodeType === Node.ELEMENT_NODE) cleanElement(scope);
    scope.querySelectorAll?.('*').forEach(cleanElement);
    hideRetiredWizard();
  }

  function install() {
    hideRetiredWizard();
    clean(document.body);
    new MutationObserver(function (records) {
      records.forEach(function (record) {
        record.addedNodes.forEach(function (node) {
          if (node.nodeType === Node.TEXT_NODE) {
            const after = cleaned(node.nodeValue || '');
            if (after !== node.nodeValue) node.nodeValue = after;
          } else clean(node);
        });
      });
      hideRetiredWizard();
    }).observe(document.body, { childList:true, subtree:true, characterData:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
