// Stabilizes the selected-relationship close-up: full-width reading, centered orb, two-card row.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  let queued = false;

  function branchUnder(host, node) {
    if (!host || !node || !host.contains(node)) return null;
    let branch = node;
    while (branch.parentElement && branch.parentElement !== host) branch = branch.parentElement;
    return branch.parentElement === host ? branch : null;
  }

  function prepare(host) {
    const reading = host.querySelector('.relphi-progressive-reading,.relphi-canonical-relationship-reading');
    const cards = Array.from(host.querySelectorAll('.relphi-dual-card-item')).slice(0, 2);
    if (!reading || cards.length < 2) return;

    const readingBranch = branchUnder(host, reading);
    const cardABranch = branchUnder(host, cards[0]);
    const cardBBranch = branchUnder(host, cards[1]);
    if (!readingBranch || !cardABranch || !cardBBranch) return;

    host.classList.add('relphi-selected-relationship-layout');
    Array.from(host.children).forEach(function (child) {
      child.classList.remove(
        'relphi-selected-reading-row',
        'relphi-selected-card-a',
        'relphi-selected-card-b',
        'relphi-selected-orb-row'
      );
    });

    readingBranch.classList.add('relphi-selected-reading-row');
    cardABranch.classList.add('relphi-selected-card-a');
    cardBBranch.classList.add('relphi-selected-card-b');

    const occupied = new Set([readingBranch, cardABranch, cardBBranch]);
    const orbBranch = Array.from(host.children).find(function (child) {
      if (occupied.has(child)) return false;
      const text = String(child.textContent || '');
      return !!child.querySelector('svg,canvas') && /orb|chirality|left|right|neutral/i.test(text);
    });
    if (orbBranch) orbBranch.classList.add('relphi-selected-orb-row');
  }

  function run() {
    queued = false;
    document.querySelectorAll('.relphi-mobile-dual-card-view').forEach(prepare);
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(run);
  }

  function installStyles() {
    if (document.getElementById('relphi-selected-relationship-layout-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-selected-relationship-layout-style';
    style.textContent = `
      .relphi-selected-relationship-layout{
        display:grid!important;
        grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
        align-items:start!important;
        gap:1rem!important;
        min-width:0!important;
        height:auto!important;
        min-height:0!important;
      }
      .relphi-selected-relationship-layout>.relphi-selected-reading-row{
        grid-column:1/-1!important;
        grid-row:1!important;
        width:100%!important;
        max-width:none!important;
        min-width:0!important;
        margin:0!important;
      }
      .relphi-selected-relationship-layout>.relphi-selected-reading-row .relphi-progressive-reading,
      .relphi-selected-relationship-layout>.relphi-selected-reading-row .relphi-canonical-relationship-reading{
        display:block!important;
        width:100%!important;
        max-width:68ch!important;
        min-width:0!important;
        margin:0!important;
        line-height:1.55!important;
        overflow-wrap:normal!important;
        word-break:normal!important;
        white-space:normal!important;
      }
      .relphi-selected-relationship-layout>.relphi-selected-orb-row{
        grid-column:1/-1!important;
        grid-row:2!important;
        position:relative!important;
        inset:auto!important;
        transform:none!important;
        z-index:auto!important;
        justify-self:center!important;
        align-self:start!important;
        width:auto!important;
        max-width:100%!important;
        min-height:0!important;
        margin:0 auto!important;
      }
      .relphi-selected-relationship-layout>.relphi-selected-card-a{
        grid-column:1!important;
        grid-row:3!important;
      }
      .relphi-selected-relationship-layout>.relphi-selected-card-b{
        grid-column:2!important;
        grid-row:3!important;
      }
      .relphi-selected-relationship-layout>.relphi-selected-card-a,
      .relphi-selected-relationship-layout>.relphi-selected-card-b{
        position:relative!important;
        inset:auto!important;
        transform:none!important;
        width:100%!important;
        max-width:none!important;
        min-width:0!important;
        margin:0!important;
        align-self:start!important;
      }
      .relphi-selected-relationship-layout>.relphi-selected-card-a .relphi-dual-card-item,
      .relphi-selected-relationship-layout>.relphi-selected-card-b .relphi-dual-card-item{
        width:100%!important;
        max-width:100%!important;
        min-width:0!important;
      }
      @media(max-width:600px){
        .relphi-selected-relationship-layout{gap:.75rem!important}
        .relphi-selected-relationship-layout>.relphi-selected-reading-row .relphi-progressive-reading,
        .relphi-selected-relationship-layout>.relphi-selected-reading-row .relphi-canonical-relationship-reading{
          max-width:none!important;
          line-height:1.5!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function start() {
    installStyles();
    run();
    new MutationObserver(queue).observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
