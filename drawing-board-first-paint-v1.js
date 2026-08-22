// Drawing Board first-paint guard: never expose Tarot Ledger while the standalone board boots.
(function () {
  'use strict';
  if (!/(^|\/)drawing-board\/tarot\.html$/.test(location.pathname)) return;

  const body = document.body;
  if (!body) return;

  function revealWhenBoardExists() {
    const panel = document.getElementById('shortListPanel');
    const board = panel?.querySelector('.card-row-drawing-board, .card-row-composer, .card-row-workspace');
    if (!panel || !board) {
      requestAnimationFrame(revealWhenBoardExists);
      return;
    }

    // The inherited Ledger markup owns this panel's initial hidden state.
    // Drawing Board becomes visible only after its real workspace exists.
    panel.hidden = false;
    panel.removeAttribute('hidden');
    body.classList.remove('relphi-drawing-board-preboot');
    document.documentElement.classList.add('relphi-drawing-board-ready');
  }

  revealWhenBoardExists();
})();
