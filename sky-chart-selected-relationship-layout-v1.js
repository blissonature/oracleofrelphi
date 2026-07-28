// Stable selected-relationship layout with event-scoped reassembly only.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  let queued = false;
  let retryTimer = 0;

  function singleCardContainer(card, host) {
    let node = card;
    let best = card;
    while (node.parentElement && node.parentElement !== host) {
      const parent = node.parentElement;
      if (parent.querySelectorAll('.relphi-dual-card-item').length !== 1) break;
      best = parent;
      node = parent;
    }
    return best;
  }

  function orbContainer(host, reading, cards) {
    const candidates = Array.from(host.querySelectorAll('svg,canvas')).filter(function (visual) {
      if (reading.contains(visual)) return false;
      if (cards.some(function (card) { return card.contains(visual); })) return false;
      const nearby = visual.closest('[class*="relationship"],[class*="aspect"],[class*="orb"],figure,section,article,div') || visual.parentElement;
      return /orb|chirality|left|right|neutral/i.test(String(nearby && nearby.textContent || ''));
    });
    if (!candidates.length) return null;

    let node = candidates[0];
    let best = node.parentElement || node;
    while (node.parentElement && node.parentElement !== host) {
      const parent = node.parentElement;
      if (parent.contains(reading)) break;
      if (cards.some(function (card) { return parent.contains(card); })) break;
      best = parent;
      node = parent;
    }
    return best;
  }

  function prepare(host) {
    if (!host || host.dataset.relphiSelectedReassembled === 'true') return true;

    const reading = host.querySelector('.relphi-progressive-reading,.relphi-canonical-relationship-reading');
    const markedCards = Array.from(host.querySelectorAll('.relphi-dual-card-item')).slice(0, 2);
    if (!reading || markedCards.length < 2) return false;

    const cardA = singleCardContainer(markedCards[0], host);
    const cardB = singleCardContainer(markedCards[1], host);
    if (!cardA || !cardB || cardA === cardB) return false;

    const originalChildren = Array.from(host.children);
    const orb = orbContainer(host, reading, [cardA, cardB]);
    const shell = document.createElement('div');
    shell.className = 'relphi-selected-closeup-shell';

    const readingRow = document.createElement('section');
    readingRow.className = 'relphi-selected-closeup-reading';
    readingRow.appendChild(reading);

    const orbRow = document.createElement('div');
    orbRow.className = 'relphi-selected-closeup-orb';
    if (orb && orb !== cardA && orb !== cardB && !orb.contains(cardA) && !orb.contains(cardB)) orbRow.appendChild(orb);

    const cardsRow = document.createElement('div');
    cardsRow.className = 'relphi-selected-closeup-cards';
    const aSlot = document.createElement('div');
    const bSlot = document.createElement('div');
    aSlot.className = 'relphi-selected-closeup-card is-a';
    bSlot.className = 'relphi-selected-closeup-card is-b';
    aSlot.appendChild(cardA);
    bSlot.appendChild(cardB);
    cardsRow.append(aSlot, bSlot);

    shell.appendChild(readingRow);
    if (orbRow.childElementCount) shell.appendChild(orbRow);
    shell.appendChild(cardsRow);
    host.appendChild(shell);

    originalChildren.forEach(function (child) {
      if (child === shell || shell.contains(child)) return;
      child.classList.add('relphi-selected-closeup-legacy');
    });

    host.classList.add('relphi-selected-relationship-reassembled');
    host.dataset.relphiSelectedReassembled = 'true';
    return true;
  }

  function run() {
    queued = false;
    let found = false;
    document.querySelectorAll('.relphi-mobile-dual-card-view').forEach(function (host) {
      found = prepare(host) || found;
    });
    return found;
  }

  function queue(delay) {
    clearTimeout(retryTimer);
    retryTimer = setTimeout(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(run);
    }, delay || 0);
  }

  function installStyles() {
    if (document.getElementById('relphi-selected-relationship-layout-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-selected-relationship-layout-style';
    style.textContent = `
      .relphi-selected-relationship-reassembled{display:block!important;position:relative!important;height:auto!important;min-height:0!important;overflow:visible!important}
      .relphi-selected-relationship-reassembled>.relphi-selected-closeup-legacy{display:none!important}
      .relphi-selected-closeup-shell{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:1rem!important;width:100%!important;min-width:0!important;height:auto!important;min-height:0!important;position:relative!important;z-index:1!important}
      .relphi-selected-closeup-reading{display:block!important;width:100%!important;max-width:none!important;min-width:0!important;margin:0!important;padding:1rem!important;position:relative!important;inset:auto!important;transform:none!important}
      .relphi-selected-closeup-reading .relphi-progressive-reading,.relphi-selected-closeup-reading .relphi-canonical-relationship-reading{display:block!important;width:100%!important;max-width:68ch!important;min-width:0!important;margin:0!important;line-height:1.55!important;overflow-wrap:normal!important;word-break:normal!important;white-space:normal!important}
      .relphi-selected-closeup-orb{display:flex!important;justify-content:center!important;align-items:flex-start!important;width:100%!important;min-width:0!important;position:relative!important;inset:auto!important;transform:none!important;z-index:1!important}
      .relphi-selected-closeup-orb>*{position:relative!important;inset:auto!important;transform:none!important;margin:0 auto!important;max-width:100%!important}
      .relphi-selected-closeup-cards{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:1rem!important;align-items:start!important;width:100%!important;min-width:0!important;position:relative!important;z-index:2!important}
      .relphi-selected-closeup-card,.relphi-selected-closeup-card>*{width:100%!important;max-width:100%!important;min-width:0!important;position:relative!important;inset:auto!important;transform:none!important;margin:0!important}
      @media(max-width:600px){.relphi-selected-closeup-shell{gap:.75rem!important}.relphi-selected-closeup-cards{gap:.55rem!important}.relphi-selected-closeup-reading{padding:.8rem!important}.relphi-selected-closeup-reading .relphi-progressive-reading,.relphi-selected-closeup-reading .relphi-canonical-relationship-reading{max-width:none!important;line-height:1.5!important}}
    `;
    document.head.appendChild(style);
  }

  function start() {
    installStyles();
    run();

    // Retry briefly for the initial asynchronous relationship render, then stop.
    [50, 150, 350, 700, 1200].forEach(function (delay) { setTimeout(run, delay); });

    // Reassemble only after genuine user/data events, never after our own DOM moves.
    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-relationship-index],.relationship-row,.relphi-relationship-row,[data-relphi-relationship]')) queue(40);
    }, true);
    window.addEventListener('storage', function () { queue(60); });
    window.addEventListener('relphi:extra-points-updated', function () { queue(60); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
