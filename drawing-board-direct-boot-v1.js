// Standalone Drawing Board direct boot: initialize the board without exposing Tarot Ledger.
(function () {
  'use strict';
  if (!/(^|\/)drawing-board\/tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiDrawingBoardDirectBootV1) return;
  window.__relphiDrawingBoardDirectBootV1 = true;

  let attempts = 0;
  const MAX_ATTEMPTS = 120;

  function boardExists(panel) {
    return !!panel?.querySelector('.card-row-drawing-board,.card-row-composer,.card-row-workspace');
  }

  function boot() {
    const panel = document.getElementById('shortListPanel');
    if (!panel) {
      if (attempts++ < MAX_ATTEMPTS) setTimeout(boot, 50);
      return;
    }

    panel.hidden = false;
    panel.removeAttribute('hidden');

    if (boardExists(panel)) {
      document.getElementById('drawingBoardBootStatus')?.remove();
      document.body?.classList.add('relphi-drawing-board-ready');
      return;
    }

    const open = document.getElementById('landingOpenBoard');
    if (open) open.click();

    if (attempts++ < MAX_ATTEMPTS) {
      setTimeout(boot, 75);
      return;
    }

    const status = document.getElementById('drawingBoardBootStatus');
    if (status) status.textContent = 'Drawing Board could not finish loading. Refresh this preview to try again.';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
  window.addEventListener('load', boot, { once:true });
})();
