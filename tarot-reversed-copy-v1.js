// Tarot reversed-card copy: remove repeated orientation boilerplate and keep only the Relphi reversed meaning.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiTarotReversedCopyV1) return;
  window.__relphiTarotReversedCopyV1 = true;

  const GENERIC_REVERSED_PREFIX = /^.*?\breversed\s+shows\s+its\s+core\s+operation\s+turning\s+inward,\s*meeting\s+obstruction,\s*becoming\s+overextended,\s*or\s+returning\s+for\s+correction(?:[.!?])?\s*/i;
  const EXPORT_ACTIONS = '#printRowPdf,#downloadRowOptimizedHtml,#printCardRowImage,[data-row-export],[data-row-print]';
  let queued = false;

  function specificReversedText(value) {
    const text = String(value || '').trim();
    if (!text) return text;
    return text.replace(GENERIC_REVERSED_PREFIX, '').trim();
  }

  function cleanSpan(span) {
    if (!span || span.nodeType !== Node.ELEMENT_NODE) return;
    const text = String(span.textContent || '').trim();
    const specific = specificReversedText(text);
    if (!specific || specific === text) return;
    span.textContent = specific;
    span.dataset.relphiReversedCopy = 'specific';
  }

  function clean(root = document) {
    const spans = [];
    if (root?.matches?.('.or-layer-scroll span,.relphi-info-scroll span')) spans.push(root);
    if (root?.querySelectorAll) spans.push(...root.querySelectorAll('.or-layer-scroll span,.relphi-info-scroll span'));
    spans.forEach(cleanSpan);
  }

  function cleanNow() {
    clean(document);
  }

  function schedule(root = document) {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      clean(root);
    });
  }

  // Clean immediately before print/export handlers read the DOM.
  document.addEventListener('click', event => {
    if (event.target?.closest?.(EXPORT_ACTIONS)) cleanNow();
  }, true);
  document.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target?.closest?.(EXPORT_ACTIONS)) cleanNow();
  }, true);

  document.addEventListener('relphi:drawing-board-rendered', cleanNow);
  document.addEventListener('relphi:drawing-board-center-view', cleanNow);

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

  window.RelphiTarotSpecificReversedText = specificReversedText;
  cleanNow();
})();