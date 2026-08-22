// Standalone Drawing Board boot cleanup.
// The HTML is already Drawing Board from first paint; this only removes the boot note
// once the real workspace has been created by the shared board runtime.
(function () {
  'use strict';
  if (!/(^|\/)drawing-board\/tarot\.html$/.test(location.pathname)) return;

  function finishWhenBoardExists() {
    const panel = document.getElementById('shortListPanel');
    const board = panel?.querySelector('.card-row-drawing-board, .card-row-composer, .card-row-workspace');
    if (!panel || !board) {
      requestAnimationFrame(finishWhenBoardExists);
      return;
    }

    panel.hidden = false;
    panel.removeAttribute('hidden');
    document.getElementById('drawingBoardBootStatus')?.remove();
    document.documentElement.classList.add('relphi-drawing-board-ready');
  }

  finishWhenBoardExists();
})();
