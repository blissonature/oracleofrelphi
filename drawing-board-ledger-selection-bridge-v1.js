// Standalone Drawing Board -> Tarot Ledger detail bridge.
// Reuse the Ledger's own delegated card-selection path: its canonical clickable
// result is .or-card[data-id], while Drawing Board's selector initially finds
// the inner title span carrying data-card-id.
(function () {
  'use strict';
  if (!/(^|\/)drawing-board\/tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiDrawingBoardLedgerSelectionBridgeV1) return;
  window.__relphiDrawingBoardLedgerSelectionBridgeV1 = true;

  function cssEscape(value) {
    if (window.CSS?.escape) return CSS.escape(String(value || ''));
    return String(value || '').replace(/["\\]/g, '\\$&');
  }

  window.addEventListener('click', function (event) {
    const inner = event.target.closest?.('#cardList [data-card-id]');
    if (!inner) return;
    const cardId = String(inner.getAttribute('data-card-id') || '').trim();
    if (!cardId) return;
    const surface = document.querySelector('#cardList .or-card[data-id="' + cssEscape(cardId) + '"]');
    if (!surface || surface === event.target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    surface.click();
  }, true);
})();
