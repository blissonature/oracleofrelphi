// Drawing Board first-paint guard: never expose Tarot Ledger while the standalone board boots.
(function () {
  'use strict';
  if (!/(^|\/)drawing-board\/tarot\.html$/.test(location.pathname)) return;

  const body = document.body;
  if (!body) return;

  function revealWhenBoardExists() {
    const board = document.querySelector('#shortListPanel .card-row-drawing-board, #shortListPanel .card-row-composer, #shortListPanel .card-row-workspace');
    if (!board) {
      requestAnimationFrame(revealWhenBoardExists);
      return;
    }
    body.classList.remove('relphi-drawing-board-preboot');
    document.documentElement.classList.add('relphi-drawing-board-ready');
  }

  revealWhenBoardExists();
})();
