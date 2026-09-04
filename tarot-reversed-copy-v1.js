// Tarot reversed-card copy: remove the repeated orientation boilerplate and keep the Relphi meaning.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiTarotReversedCopyV1) return;
  window.__relphiTarotReversedCopyV1 = true;

  const GENERIC_REVERSED_PREFIX = /^.*?\breversed shows its core operation turning inward, meeting obstruction, becoming overextended, or returning for correction\.\s*/i;
  let queued = false;

  function cleanSpan(span) {
    if (!(span instanceof HTMLElement)) return;
    const text = String(span.textContent || '');
    if (!GENERIC_REVERSED_PREFIX.test(text)) return;
    const specific = text.replace(GENERIC_REVERSED_PREFIX, '').trim();
    if (!specific || specific === text.trim()) return;
    span.textContent = specific;
    span.dataset.relphiReversedCopy = 'specific';
  }

  function clean(root = document) {
    const spans = [];
    if (root instanceof HTMLElement && root.matches('.or-layer-scroll > span,.relphi-info-scroll > span')) spans.push(root);
    if (root.querySelectorAll) spans.push(...root.querySelectorAll('.or-layer-scroll > span,.relphi-info-scroll > span'));
    spans.forEach(cleanSpan);
  }

  function schedule(root = document) {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      clean(root);
    });
  }

  document.addEventListener('relphi:drawing-board-rendered', () => schedule(document));
  document.addEventListener('relphi:drawing-board-center-view', () => schedule(document));

  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'characterData') {
        schedule(record.target.parentElement || document);
        return;
      }
      for (const node of record.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          schedule(node);
          return;
        }
      }
    }
  }).observe(document.documentElement, { childList:true, subtree:true, characterData:true });

  schedule(document);
})();