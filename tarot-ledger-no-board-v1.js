// Tarot Ledger boundary: keep the Ledger a card-reference and reading tool, with Drawing Board isolated elsewhere.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname) || /(^|\/)drawing-board\/tarot\.html$/.test(location.pathname)) return;
  if (document.documentElement.dataset.relphiTarotLedgerNoBoard === 'true') return;
  document.documentElement.dataset.relphiTarotLedgerNoBoard = 'true';

  function installStyle() {
    if (document.getElementById('relphiTarotLedgerNoBoardStyle')) return;
    const style = document.createElement('style');
    style.id = 'relphiTarotLedgerNoBoardStyle';
    style.textContent = [
      '#shortListPanel{display:none!important}',
      '[data-shortlist]{display:none!important}',
      '.row-add-button,[data-row-add-card]{display:none!important}'
    ].join('');
    document.head.appendChild(style);
  }

  function scrubBoardUi() {
    document.getElementById('landingOpenBoard')?.remove();
    const panel = document.getElementById('shortListPanel');
    if (panel) panel.hidden = true;

    document.querySelectorAll('[data-shortlist],.row-add-button,[data-row-add-card]').forEach(node => node.remove());

    const entry = document.querySelector('.tarot-entry-panel');
    const heading = entry?.querySelector('h2');
    const copy = entry?.querySelector('article > p:not(.eyebrow)');
    if (heading) heading.textContent = 'Search, draw, or browse the deck.';
    if (copy) copy.textContent = 'Tarot Ledger is a symbolic reference and reading tool. Search the deck, inspect complete card entries, or draw cards.';

    const clear = document.getElementById('clearSearch');
    if (clear) {
      clear.textContent = 'Hide Cards';
      clear.title = 'Hide card results';
    }

    const command = document.getElementById('oracleCommand');
    if (command && /\/board/i.test(command.placeholder || '')) {
      command.placeholder = 'Ex. /draw or Saturn, Libra, Sorrow, Lamed, Cups';
    }
  }

  function start() {
    installStyle();
    scrubBoardUi();
    new MutationObserver(function () {
      requestAnimationFrame(scrubBoardUi);
    }).observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
