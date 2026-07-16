// Keeps the public Sky Chart language source-neutral and the Wizard headings method-neutral.
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

  function enforceWizardLanguage() {
    const heading = document.getElementById('skyWizardPrimaryHeading');
    const help = document.getElementById('skyWizardPrimaryHelp');
    const step = document.querySelector('.sky-wizard-step-first .sky-wizard-step-copy .eyebrow');

    if (heading && /^here and now$/i.test(heading.textContent.trim())) {
      heading.textContent = 'Choose how to create this sky';
    }
    if (help && /current place and time|here and now/i.test(help.textContent)) {
      help.textContent = 'Use existing placements, open a saved sky, or calculate the sky from a time and place.';
    }
    if (step && /^where and when$/i.test(step.textContent.trim())) {
      step.textContent = 'First sky';
    }
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
    enforceWizardLanguage();
  }

  function install() {
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
      enforceWizardLanguage();
    }).observe(document.body, { childList:true, subtree:true, characterData:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
