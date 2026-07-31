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

    const cardsRow = document.createElement('div');
    cardsRow.className = 'relphi-selected-closeup-cards';
    const aSlot = document.createElement('article');
    const bSlot = document.createElement('article');
    aSlot.className = 'relphi-selected-closeup-card is-a';
    bSlot.className = 'relphi-selected-closeup-card is-b';
    aSlot.appendChild(cardA);
    bSlot.appendChild(cardB);
    cardsRow.append(aSlot, bSlot);

    const orbRow = document.createElement('div');
    orbRow.className = 'relphi-selected-closeup-orb';
    if (orb && orb !== cardA && orb !== cardB && !orb.contains(cardA) && !orb.contains(cardB)) orbRow.appendChild(orb);

    const readingRow = document.createElement('section');
    readingRow.className = 'relphi-selected-closeup-reading';
    readingRow.appendChild(reading);

    shell.appendChild(cardsRow);
    if (orbRow.childElementCount) shell.appendChild(orbRow);
    shell.appendChild(readingRow);
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
      .relphi-selected-relationship-reassembled{display:block!important;position:relative!important;height:auto!important;min-height:0!important;overflow:visible!important;container-type:inline-size!important}
      .relphi-selected-relationship-reassembled,.relphi-selected-relationship-reassembled *{box-sizing:border-box}
      .relphi-selected-relationship-reassembled>.relphi-selected-closeup-legacy{display:none!important}
      .relphi-selected-closeup-shell{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:1rem!important;width:100%!important;min-width:0!important;height:auto!important;min-height:0!important;position:relative!important;z-index:1!important}
      .relphi-selected-closeup-cards{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:1rem!important;align-items:start!important;width:100%!important;min-width:0!important;position:relative!important;z-index:2!important}
      .relphi-selected-closeup-card{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;margin:0!important;padding:.85rem!important;position:relative!important;inset:auto!important;transform:none!important;border:1px solid rgba(35,31,27,.12)!important;border-radius:1rem!important;background:#fff!important;overflow:hidden!important}
      .relphi-selected-closeup-card>*{width:100%!important;max-width:100%!important;min-width:0!important;position:relative!important;inset:auto!important;transform:none!important;margin:0!important}
      .relphi-selected-closeup-card,.relphi-selected-closeup-card *{word-break:normal!important;overflow-wrap:normal!important;white-space:normal!important;writing-mode:horizontal-tb!important}
      .relphi-selected-closeup-card .relphi-dual-card-item{display:grid!important;grid-template-columns:minmax(84px,108px) minmax(0,1fr)!important;grid-template-rows:auto!important;gap:.8rem!important;align-items:start!important;width:100%!important;max-width:100%!important;min-width:0!important;padding:0!important}
      .relphi-selected-closeup-card .relphi-dual-card-item img,.relphi-selected-closeup-card .relphi-dual-card-item svg,.relphi-selected-closeup-card .relphi-dual-card-item canvas{grid-column:1!important;grid-row:1 / span 8!important;width:100%!important;max-width:108px!important;height:auto!important;margin:0 auto!important}
      .relphi-selected-closeup-card .relphi-dual-card-item>:not(img):not(svg):not(canvas){grid-column:2!important;min-width:0!important;max-width:100%!important;text-align:left!important}
      .relphi-selected-closeup-card h1,.relphi-selected-closeup-card h2,.relphi-selected-closeup-card h3,.relphi-selected-closeup-card h4,.relphi-selected-closeup-card p{width:auto!important;max-width:100%!important;margin-left:0!important;margin-right:0!important;text-align:left!important;line-height:1.25!important}
      .relphi-selected-closeup-orb{display:flex!important;justify-content:center!important;align-items:flex-start!important;width:100%!important;min-width:0!important;position:relative!important;inset:auto!important;transform:none!important;z-index:1!important;overflow:hidden!important}
      .relphi-selected-closeup-orb>*{position:relative!important;inset:auto!important;transform:none!important;margin:0 auto!important;max-width:min(100%,260px)!important}
      .relphi-selected-closeup-reading{display:block!important;width:100%!important;max-width:none!important;min-width:0!important;margin:0!important;padding:1rem!important;position:relative!important;inset:auto!important;transform:none!important;grid-column:1 / -1!important;border-radius:1rem!important;background:#f3f0ea!important}
      .relphi-selected-closeup-reading .relphi-progressive-reading,.relphi-selected-closeup-reading .relphi-canonical-relationship-reading{display:block!important;width:100%!important;max-width:none!important;min-width:0!important;margin:0!important;line-height:1.55!important;overflow-wrap:normal!important;word-break:normal!important;white-space:normal!important;text-align:left!important}
      .relphi-selected-closeup-reading p{max-width:none!important;width:100%!important;text-align:left!important}
      @container (min-width:620px){
        .relphi-selected-closeup-cards{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        .relphi-selected-closeup-card .relphi-dual-card-item{grid-template-columns:minmax(72px,92px) minmax(0,1fr)!important}
        .relphi-selected-closeup-card .relphi-dual-card-item img,.relphi-selected-closeup-card .relphi-dual-card-item svg,.relphi-selected-closeup-card .relphi-dual-card-item canvas{max-width:92px!important}
      }
      @media(max-width:600px){
        .relphi-selected-closeup-shell{gap:.75rem!important}
        .relphi-selected-closeup-card{padding:.7rem!important}
        .relphi-selected-closeup-card .relphi-dual-card-item{grid-template-columns:minmax(72px,92px) minmax(0,1fr)!important;gap:.65rem!important}
        .relphi-selected-closeup-card .relphi-dual-card-item img,.relphi-selected-closeup-card .relphi-dual-card-item svg,.relphi-selected-closeup-card .relphi-dual-card-item canvas{max-width:92px!important}
        .relphi-selected-closeup-reading{padding:.85rem!important}
      }
    `;
    document.head.appendChild(style);
  }

  function start() {
    installStyles();
    run();
    [50, 150, 350, 700, 1200].forEach(function (delay) { setTimeout(run, delay); });
    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-relationship-index],.relationship-row,.relphi-relationship-row,[data-relphi-relationship]')) queue(40);
    }, true);
    window.addEventListener('storage', function () { queue(60); });
    window.addEventListener('relphi:extra-points-updated', function () { queue(60); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
