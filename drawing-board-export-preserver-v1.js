// Preserve Drawing Board export controls that predate the organized workflow UI.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;

  const IDS = [
    'snapshotCardRowArrangement',
    'printCardRowImage',
    'downloadRowHtml',
    'downloadRowTextHtml'
  ];
  const preserved = new Map();
  let queued = false;

  function ensureStash() {
    let stash = document.getElementById('relphiDrawingBoardExportStash');
    if (stash) return stash;
    stash = document.createElement('div');
    stash.id = 'relphiDrawingBoardExportStash';
    stash.hidden = true;
    stash.setAttribute('aria-hidden', 'true');
    document.body.appendChild(stash);
    return stash;
  }

  function captureControls() {
    const panel = document.getElementById('shortListPanel');
    if (!panel) return;
    const stash = ensureStash();

    IDS.forEach(function (id) {
      const candidates = Array.from(document.querySelectorAll('[id="' + id + '"]'));
      const node = candidates.find(function (candidate) {
        return panel.contains(candidate) && !candidate.closest('#board-options-export');
      });
      if (!node) return;
      const prior = preserved.get(id);
      if (prior && prior !== node && prior.isConnected) prior.remove();
      node.dataset.relphiPreservedExport = 'true';
      stash.appendChild(node);
      preserved.set(id, node);
    });
  }

  function restoreControls() {
    const panel = document.getElementById('shortListPanel');
    const composer = panel && panel.querySelector('.card-row-composer.is-relphi-organized');
    const destination = panel && panel.querySelector('#board-options-export .board-options-body');
    if (!composer || !destination) return false;

    const anchor = destination.querySelector('#downloadRowOptimizedHtml') || destination.firstChild;
    IDS.forEach(function (id) {
      const node = preserved.get(id);
      if (!node) return;
      if (node.closest && node.closest('#board-options-export') === destination.closest('#board-options-export')) return;
      destination.insertBefore(node, anchor || null);
      node.hidden = false;
      node.removeAttribute('aria-hidden');
      node.dataset.relphiExportRestored = 'true';
    });
    return true;
  }

  function reconcile() {
    queued = false;
    captureControls();
    if (!restoreControls()) requestAnimationFrame(schedule);
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(reconcile);
  }

  function start() {
    ensureStash();
    schedule();
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true });
    window.addEventListener('pageshow', schedule);
    window.addEventListener('relphi:drawing-board-restored', schedule);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();