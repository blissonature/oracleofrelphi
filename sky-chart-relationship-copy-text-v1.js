// Gives canonical SVG relationship readings a durable plain-text copy representation.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  function tokenName(token) {
    const glyph = token.matches?.('.relphi-canonical-token-glyph,.relphi-progressive-glyph')
      ? token
      : token.querySelector?.('.relphi-canonical-token-glyph,.relphi-progressive-glyph');
    const label = glyph?.getAttribute('aria-label') || '';
    return label.replace(/^Reveal\s+/i, '').trim();
  }

  function plainTextFromSelection(selection) {
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return '';
    const fragment = selection.getRangeAt(0).cloneContents();
    const host = document.createElement('div');
    host.appendChild(fragment);

    host.querySelectorAll('.relphi-canonical-token,.relphi-progressive-token').forEach(function (token) {
      const name = tokenName(token);
      token.replaceWith(document.createTextNode(name || token.textContent || ''));
    });
    host.querySelectorAll('.relphi-canonical-token-glyph,.relphi-progressive-glyph').forEach(function (glyph) {
      const name = tokenName(glyph);
      glyph.replaceWith(document.createTextNode(name || glyph.textContent || ''));
    });

    return (host.innerText || host.textContent || '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }

  document.addEventListener('copy', function (event) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const anchor = selection.anchorNode?.nodeType === Node.ELEMENT_NODE ? selection.anchorNode : selection.anchorNode?.parentElement;
    const focus = selection.focusNode?.nodeType === Node.ELEMENT_NODE ? selection.focusNode : selection.focusNode?.parentElement;
    const reading = anchor?.closest?.('.relphi-progressive-reading,.relphi-canonical-relationship-reading,.relationship-prose-panel') ||
      focus?.closest?.('.relphi-progressive-reading,.relphi-canonical-relationship-reading,.relationship-prose-panel');
    if (!reading) return;

    const text = plainTextFromSelection(selection);
    if (!text) return;
    event.preventDefault();
    event.clipboardData?.setData('text/plain', text);
  });
})();