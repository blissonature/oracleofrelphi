// Keep Drawing Board out of the Tarot Ledger surface while preserving legacy app compatibility.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  const params = new URLSearchParams(location.search);
  if (params.get('standaloneDrawingBoard') === '1') return;

  function extract() {
    const styleId = 'relphi-tarot-board-extraction-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = '#landingOpenBoard,#viewBoard,#shortListPanel{display:none!important}';
      document.head.appendChild(style);
    }

    const openBoard = document.getElementById('landingOpenBoard');
    const boardTab = document.getElementById('viewBoard');
    const board = document.getElementById('shortListPanel');
    [openBoard, boardTab, board].forEach(function (node) {
      if (!node) return;
      node.hidden = true;
      node.setAttribute('aria-hidden', 'true');
      if ('tabIndex' in node) node.tabIndex = -1;
    });

    // If an old saved view tries to reopen the embedded Board, return to the Ledger surface.
    if (board && !board.hidden) board.hidden = true;
    const ledgerEntry = document.getElementById('landingShowLedger') || document.getElementById('showAllCards');
    const boardSelected = boardTab && boardTab.getAttribute('aria-selected') === 'true';
    if (boardSelected && ledgerEntry) ledgerEntry.click();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', extract, { once:true });
  else extract();
  window.addEventListener('relphi:drawing-board-ready', extract);
})();
