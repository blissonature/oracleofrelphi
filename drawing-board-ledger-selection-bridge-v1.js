// Drawing Board -> Tarot Ledger selection bridge.
// The Ledger list puts data-card-id on an inner title span, while its selection
// behavior is owned by the surrounding card-entry container. Forward synthetic
// inner-span clicks to that existing container so Drawing Board can reuse the
// Ledger's full-entry renderer without duplicating card-detail logic.
(function () {
  'use strict';
  if (!/(^|\/)drawing-board\/tarot\.html$/.test(location.pathname)) return;
  if (document.documentElement.dataset.relphiDrawingBoardLedgerSelectionBridge === 'true') return;
  document.documentElement.dataset.relphiDrawingBoardLedgerSelectionBridge = 'true';

  document.addEventListener('click', function (event) {
    const inner = event.target.closest?.('#cardList [data-card-id]');
    if (!inner) return;
    const container = inner.closest('button,[role="button"],[role="listitem"],li,article');
    if (!container || container === inner) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    container.click();
  }, true);
})();
