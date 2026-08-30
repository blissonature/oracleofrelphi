// Standalone Drawing Board: use the real Tarot Ledger browse layout below the board.
(function () {
  'use strict';
  if (!/(^|\/)drawing-board\/tarot\.html$/.test(location.pathname)) return;
  if (document.documentElement.dataset.relphiStandaloneDrawingBoardV2 === 'true') return;
  document.documentElement.dataset.relphiStandaloneDrawingBoardV2 = 'true';

  const PANEL = '#shortListPanel';
  const CHOICE = '[data-relphi-placeholder-choice]';
  let activeDraw = false;
  let pendingCardId = '';
  let selectedCardId = '';
  let dragGesture = null;
  let renderQueued = false;
  let boardObserver = null;
  let ledgerObserver = null;
  let seededLedger = false;

  function root() { return document.querySelector(PANEL); }
  function cards() { return Array.isArray(window.RELPHI_TAROT_CARDS) ? window.RELPHI_TAROT_CARDS : []; }
  function normalize(value) { return String(value || '').toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function cssEscape(value) { return window.CSS?.escape ? window.CSS.escape(String(value || '')) : String(value || '').replace(/[^a-zA-Z0-9_-]/g, '\\$&'); }
  function cardName(card) { return String(card?.name || card?.title || card?.card_name || card?.card_id || '').trim(); }
  function cardById(id) { return cards().find(card => card?.card_id === id) || null; }
  function cardMeta(card) {
    const suit = String(card?.suit || '').trim();
    const type = String(card?.card_type || '').trim();
    if (suit) return suit.charAt(0).toUpperCase() + suit.slice(1);
    if (type) return type.charAt(0).toUpperCase() + type.slice(1);
    return 'Tarot card';
  }
  function cardSearchText(card) {
    const astrology = card?.astrology || {};
    return normalize([
      card?.card_id, cardName(card), card?.card_type, card?.rank, card?.suit,
      ...(Array.isArray(card?.tags) ? card.tags : []),
      astrology.planet, astrology.zodiac_sign, astrology.sign, astrology.element, astrology.hebrew_letter
    ].filter(Boolean).join(' '));
  }
  function usedCardIds() {
    return new Set(Array.from(document.querySelectorAll(PANEL + ' [data-row-card]')).map(node => node.dataset.rowCard).filter(Boolean));
  }
  function repeatsAllowed() { return !!document.querySelector(PANEL + ' #rowAllowRepeats')?.checked; }
  function isEmptyItem(item) {
    return !!item && !item.querySelector('[data-row-card]') && item.classList.contains('card-row-placeholder-item');
  }

  function installStyle() {
    if (document.getElementById('relphiStandaloneDrawingBoardV2Style')) return;
    const style = document.createElement('style');
    style.id = 'relphiStandaloneDrawingBoardV2Style';
    style.textContent = `
      body.relphi-drawing-board-page .tarot-entry-panel,
      body.relphi-drawing-board-page .tarot-mode-bar,
      body.relphi-drawing-board-page #tarotSummary,
      body.relphi-drawing-board-page #visibilityPanel,
      body.relphi-drawing-board-page #datePanel,
      body.relphi-drawing-board-page #chartPanel,
      body.relphi-drawing-board-page #spreadPanel,
      body.relphi-drawing-board-page .tarot-command-drawer>details{display:none!important}
      body.relphi-drawing-board-page .tarot-command-panel{display:block!important}
      body.relphi-drawing-board-page #shortListPanel{display:block!important}
      body.relphi-drawing-board-page #browsePanel{display:grid!important}
      #shortListPanel .card-row-board .or-card-layer.relphi-info-layer,
      #shortListPanel .card-row-board .or-layer-scroll{display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important}
      #shortListPanel .card-row-board [data-row-card]{cursor:pointer}
      #shortListPanel .card-row-board [data-row-card]:focus-visible{outline:3px solid rgba(220,31,24,.35)!important;outline-offset:3px!important}
      #shortListPanel .card-row-placeholder-item{isolation:isolate}
      #shortListPanel .card-row-placeholder-item>.card-row-drop-card{position:relative}
      #shortListPanel .card-row-placeholder-item>.card-row-drop-card>.card-row-drop-card-inner,
      #shortListPanel .card-row-placeholder-item>.card-row-drop-card>img{opacity:.18}
      #shortListPanel .relphi-placeholder-choice{position:absolute;inset:0;z-index:12;display:flex;align-items:center;justify-content:center;padding:.55rem;border-radius:inherit;background:rgba(255,253,248,.86);font:inherit;cursor:default}
      #shortListPanel .relphi-placeholder-choice-actions{display:flex;gap:.38rem;align-items:center;justify-content:center;flex-wrap:wrap}
      #shortListPanel .relphi-placeholder-choice button{appearance:none;border:1px solid rgba(24,20,18,.28);border-radius:999px;background:#fffdf8;color:#171412;padding:.44rem .7rem;font:800 .76rem/1 Inter,Montserrat,"Segoe UI",Arial,sans-serif;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.06)}
      #shortListPanel .relphi-placeholder-choice button:hover,#shortListPanel .relphi-placeholder-choice button:focus-visible{border-color:#dc1f18;outline:2px solid rgba(220,31,24,.18);outline-offset:1px}
      #shortListPanel .relphi-placeholder-search-panel{position:absolute;inset:.35rem;display:flex;flex-direction:column;gap:.3rem;padding:.38rem;border:1px solid rgba(24,20,18,.2);border-radius:.75rem;background:#fffdf8;box-shadow:0 8px 24px rgba(0,0,0,.12);overflow:hidden}
      #shortListPanel .relphi-placeholder-search-panel[hidden]{display:none}
      #shortListPanel .relphi-placeholder-search-head{display:flex;gap:.25rem;align-items:center}
      #shortListPanel .relphi-placeholder-search-head input{min-width:0;flex:1;border:1px solid rgba(24,20,18,.25);border-radius:.55rem;background:#fff;padding:.42rem .48rem;font:700 .73rem/1.2 Inter,Montserrat,"Segoe UI",Arial,sans-serif}
      #shortListPanel .relphi-placeholder-search-close{padding:.4rem .5rem!important}
      #shortListPanel .relphi-placeholder-search-results{min-height:0;overflow:auto;display:flex;flex-direction:column;gap:.18rem}
      #shortListPanel .relphi-placeholder-search-results button{width:100%;border-radius:.48rem;text-align:left;padding:.38rem .42rem;box-shadow:none;background:#fff}
      #shortListPanel .relphi-placeholder-search-results button span{display:block;font-size:.72rem;line-height:1.15}
      #shortListPanel .relphi-placeholder-search-results button small{display:block;margin-top:.08rem;color:#6d6259;font-size:.62rem;line-height:1.1}
      #shortListPanel .relphi-placeholder-search-status{margin:auto .15rem;color:#6d6259;font:700 .67rem/1.25 Inter,Montserrat,"Segoe UI",Arial,sans-serif;text-align:center}
      #browsePanel .or-card[hidden]{display:none!important}
      #browsePanel .or-card.is-detail-selected{outline:3px solid rgba(220,31,24,.28);outline-offset:3px}
      @media(max-width:640px){#shortListPanel .relphi-placeholder-choice{padding:.35rem}#shortListPanel .relphi-placeholder-choice button{font-size:.68rem;padding:.38rem .56rem}}
    `;
    document.head.appendChild(style);
  }

  function configureShell() {
    document.body?.classList.add('relphi-drawing-board-page');
    document.title = 'Drawing Board · Oracle of Relphi';
    const hero = document.querySelector('.tarot-hero h1');
    if (hero) hero.innerHTML = 'Drawing <span class="red">Board</span>';

    const panel = root();
    if (panel) {
      panel.hidden = false;
      panel.setAttribute('aria-label', 'Drawing Board');
    }

    ['tarotSummary','visibilityPanel','datePanel','chartPanel','spreadPanel'].forEach(id => {
      const node = document.getElementById(id);
      if (node) node.hidden = true;
    });

    const browse = document.getElementById('browsePanel');
    if (browse) {
      browse.hidden = false;
      browse.setAttribute('aria-label', 'Cards in this Drawing');
      const heading = browse.querySelector('.cards-heading');
      if (heading && !heading.dataset.drawingBoardHeading) {
        heading.dataset.drawingBoardHeading = 'true';
        const count = document.getElementById('resultInlineCount');
        heading.replaceChildren(document.createTextNode('Cards in this Drawing '));
        if (count) heading.appendChild(count);
      }
    }
  }

  function closeSearch(choice) {
    const panel = choice?.querySelector('[data-relphi-placeholder-search-panel]');
    const toggle = choice?.querySelector('[data-relphi-placeholder-search]');
    if (panel) panel.hidden = true;
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  function renderSearch(choice) {
    const input = choice?.querySelector('[data-relphi-placeholder-query]');
    const results = choice?.querySelector('[data-relphi-placeholder-search-results]');
    if (!input || !results) return;
    const term = normalize(input.value);
    results.replaceChildren();
    if (!term) {
      const status = document.createElement('p');
      status.className = 'relphi-placeholder-search-status';
      status.textContent = 'Type a card name or correspondence.';
      results.appendChild(status);
      return;
    }
    const tokens = term.split(' ').filter(Boolean);
    const used = usedCardIds();
    const allowRepeats = repeatsAllowed();
    const matches = cards().filter(card => {
      if (!allowRepeats && used.has(card.card_id)) return false;
      const text = cardSearchText(card);
      return tokens.every(token => text.includes(token));
    }).slice(0, 8);
    if (!matches.length) {
      const status = document.createElement('p');
      status.className = 'relphi-placeholder-search-status';
      status.textContent = 'No matching cards.';
      results.appendChild(status);
      return;
    }
    matches.forEach(card => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.relphiPlaceholderResult = card.card_id;
      const title = document.createElement('span');
      const meta = document.createElement('small');
      title.textContent = cardName(card);
      meta.textContent = cardMeta(card);
      button.append(title, meta);
      results.appendChild(button);
    });
  }

  function dropCardInto(item, cardId) {
    if (!item?.isConnected || !cardId) return false;
    const target = item.matches('[data-row-placeholder]') ? item : item.querySelector('[data-row-placeholder]');
    if (!target) return false;
    pendingCardId = cardId;
    const transfer = {
      files: [], items: [], types: ['application/x-relphi-card-id','text/x-relphi-card-id','text/plain'],
      getData(type) {
        if (type === 'application/x-relphi-card-id' || type === 'text/x-relphi-card-id' || type === 'text/plain') return cardId;
        return '';
      }
    };
    const event = new Event('drop', { bubbles:true, cancelable:true });
    try { Object.defineProperty(event, 'dataTransfer', { value:transfer }); }
    catch (_) { event.dataTransfer = transfer; }
    target.dispatchEvent(event);
    return true;
  }

  function drawInto(item) {
    const panel = root();
    if (!panel || !isEmptyItem(item) || activeDraw) return;
    const draw = panel.querySelector('#drawRandomRowCard');
    if (!draw || draw.disabled) return;
    activeDraw = true;
    const before = new Set(Array.from(panel.querySelectorAll('[data-row-card]')).map(node => node.dataset.rowCard + ':' + node.closest('.card-row-item')?.dataset.rowIndex));
    const beforeCount = panel.querySelectorAll('[data-row-card]').length;
    draw.click();
    const started = Date.now();
    (function finish() {
      const nextPanel = root();
      if (!nextPanel) { activeDraw = false; return; }
      const rowCards = Array.from(nextPanel.querySelectorAll('[data-row-card]'));
      if (rowCards.length > beforeCount) {
        const added = rowCards.find(node => !before.has(node.dataset.rowCard + ':' + node.closest('.card-row-item')?.dataset.rowIndex)) || rowCards[rowCards.length - 1];
        activeDraw = false;
        if (added?.dataset.rowCard) {
          pendingCardId = added.dataset.rowCard;
          queueEnhance();
        }
        return;
      }
      if (Date.now() - started > 1800) { activeDraw = false; return; }
      requestAnimationFrame(finish);
    })();
  }

  function installPlaceholder(item) {
    if (!isEmptyItem(item) || item.querySelector(CHOICE)) return;
    const choice = document.createElement('div');
    choice.className = 'relphi-placeholder-choice';
    choice.dataset.relphiPlaceholderChoice = 'true';
    choice.innerHTML = `
      <span class="relphi-placeholder-choice-actions">
        <button type="button" data-relphi-placeholder-draw>Draw</button>
        <button type="button" data-relphi-placeholder-search aria-expanded="false">Search</button>
      </span>
      <span class="relphi-placeholder-search-panel" data-relphi-placeholder-search-panel hidden>
        <span class="relphi-placeholder-search-head">
          <input type="search" data-relphi-placeholder-query placeholder="Search a card…" autocomplete="off" aria-label="Search cards for this position">
          <button class="relphi-placeholder-search-close" type="button" data-relphi-placeholder-search-close aria-label="Close card search">×</button>
        </span>
        <span class="relphi-placeholder-search-results" data-relphi-placeholder-search-results role="listbox"></span>
      </span>`;
    (item.querySelector(':scope > .card-row-drop-card') || item).appendChild(choice);
    renderSearch(choice);
  }

  function boardEntries() {
    const panel = root();
    if (!panel) return [];
    return Array.from(panel.querySelectorAll('.card-row-item')).map((item, index) => {
      const node = item.querySelector('[data-row-card]');
      if (!node) return null;
      return { id: node.dataset.rowCard || '', index };
    }).filter(entry => entry?.id);
  }

  function detailMatches(cardId) {
    const detail = document.getElementById('cardDetail');
    return !!detail?.querySelector('[data-shortlist="' + cssEscape(cardId) + '"]');
  }

  function markLedgerSelection(cardId) {
    document.querySelectorAll('#cardList .or-card[data-id]').forEach(surface => {
      surface.classList.toggle('is-detail-selected', surface.dataset.id === cardId);
    });
  }

  function activateLedgerCard(cardId, scroll) {
    if (!cardId) return false;
    const list = document.getElementById('cardList');
    const surface = list?.querySelector('.or-card[data-id="' + cssEscape(cardId) + '"]');
    if (!surface) return false;
    selectedCardId = cardId;
    markLedgerSelection(cardId);
    surface.click();
    requestAnimationFrame(() => {
      configureShell();
      markLedgerSelection(cardId);
      if (scroll !== false) document.getElementById('cardDetail')?.scrollIntoView({ behavior:'smooth', block:'start' });
    });
    return true;
  }

  function seedNativeLedger() {
    const list = document.getElementById('cardList');
    if (!list || list.querySelector('.or-card[data-id]')) return true;
    const showAll = document.getElementById('showAllCards');
    if (!showAll || showAll.disabled) return false;
    if (!seededLedger) {
      seededLedger = true;
      showAll.click();
      configureShell();
    }
    return !!list.querySelector('.or-card[data-id]');
  }

  function syncNativeLedgerBottom() {
    configureShell();
    const browse = document.getElementById('browsePanel');
    const list = document.getElementById('cardList');
    const detail = document.getElementById('cardDetail');
    if (!browse || !list || !detail) return;

    const entries = boardEntries();
    const ids = entries.map(entry => entry.id);
    const idSet = new Set(ids);
    const count = document.getElementById('resultInlineCount');
    if (count) count.textContent = ids.length ? ids.length + (ids.length === 1 ? ' card' : ' cards') : 'No cards';

    if (!ids.length) {
      selectedCardId = '';
      detail.replaceChildren();
      list.querySelectorAll('.or-card[data-id]').forEach(surface => { surface.hidden = true; });
      return;
    }

    if (!seedNativeLedger()) {
      requestAnimationFrame(queueEnhance);
      return;
    }

    const surfaces = Array.from(list.querySelectorAll('.or-card[data-id]'));
    surfaces.forEach(surface => { surface.hidden = !idSet.has(surface.dataset.id); });

    const grid = list.querySelector('.tarot-result-grid');
    if (grid) {
      const visibleOrder = Array.from(grid.querySelectorAll(':scope > .or-card[data-id]:not([hidden])')).map(node => node.dataset.id);
      if (visibleOrder.join('|') !== ids.join('|')) {
        ids.forEach(id => {
          const surface = grid.querySelector(':scope > .or-card[data-id="' + cssEscape(id) + '"]');
          if (surface) grid.appendChild(surface);
        });
      }
    }

    if (pendingCardId && idSet.has(pendingCardId)) {
      selectedCardId = pendingCardId;
      pendingCardId = '';
    }
    if (!idSet.has(selectedCardId)) selectedCardId = ids[0];

    markLedgerSelection(selectedCardId);
    if (!detailMatches(selectedCardId)) activateLedgerCard(selectedCardId, false);
  }

  function cardFromEvent(event) {
    const card = event.target.closest?.(PANEL + ' .card-row-board [data-row-card]');
    if (!card) return null;
    if (event.target.closest('button,input,textarea,select,label,a,[data-shortlist],[data-filter],[data-row-transform-handle],[data-row-reverse],.card-row-sense-panel,.card-row-position-panel,.card-row-remove,[data-remove-card]')) return null;
    return card;
  }

  function enhanceBoard() {
    configureShell();
    const panel = root();
    if (!panel) return;
    panel.querySelectorAll('.card-row-item.card-row-placeholder-item').forEach(installPlaceholder);
    panel.querySelectorAll('.card-row-board [data-row-card]').forEach(node => {
      if (!node.hasAttribute('tabindex')) node.tabIndex = 0;
      node.setAttribute('role', 'button');
      const data = cardById(node.dataset.rowCard);
      node.setAttribute('aria-label', 'Show full entry for ' + (cardName(data) || node.dataset.rowCard.replace(/_/g, ' ')));
    });
    syncNativeLedgerBottom();
  }

  function queueEnhance() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(function () {
      renderQueued = false;
      enhanceBoard();
    });
  }

  function installObservers() {
    const panel = root();
    if (panel && !boardObserver) {
      boardObserver = new MutationObserver(queueEnhance);
      boardObserver.observe(panel, { childList:true, subtree:true, attributes:true, attributeFilter:['class','data-row-card','data-row-reversed'] });
    }
    const browse = document.getElementById('browsePanel');
    if (browse && !ledgerObserver) {
      ledgerObserver = new MutationObserver(queueEnhance);
      ledgerObserver.observe(browse, { childList:true, subtree:true });
    }
  }

  window.addEventListener('pointerdown', event => {
    const choice = event.target.closest?.(CHOICE);
    if (choice) event.stopPropagation();
    const card = cardFromEvent(event);
    if (card) dragGesture = { card, x:event.clientX, y:event.clientY, moved:false };
  }, true);

  window.addEventListener('pointermove', event => {
    if (!dragGesture) return;
    if (Math.hypot(event.clientX - dragGesture.x, event.clientY - dragGesture.y) > 7) dragGesture.moved = true;
  }, true);

  window.addEventListener('pointerup', () => {
    window.setTimeout(() => { dragGesture = null; }, 120);
  }, true);

  window.addEventListener('click', event => {
    const choice = event.target.closest?.(CHOICE);
    if (choice) {
      const item = choice.closest('.card-row-item.card-row-placeholder-item');
      const draw = event.target.closest('[data-relphi-placeholder-draw]');
      const search = event.target.closest('[data-relphi-placeholder-search]');
      const close = event.target.closest('[data-relphi-placeholder-search-close]');
      const result = event.target.closest('[data-relphi-placeholder-result]');
      if (draw) { event.preventDefault(); event.stopImmediatePropagation(); drawInto(item); return; }
      if (search) {
        event.preventDefault(); event.stopImmediatePropagation();
        const searchPanel = choice.querySelector('[data-relphi-placeholder-search-panel]');
        if (searchPanel) searchPanel.hidden = false;
        search.setAttribute('aria-expanded', 'true');
        renderSearch(choice);
        choice.querySelector('[data-relphi-placeholder-query]')?.focus();
        return;
      }
      if (close) {
        event.preventDefault(); event.stopImmediatePropagation();
        closeSearch(choice);
        choice.querySelector('[data-relphi-placeholder-search]')?.focus();
        return;
      }
      if (result) {
        event.preventDefault(); event.stopImmediatePropagation();
        dropCardInto(item, result.dataset.relphiPlaceholderResult);
        closeSearch(choice);
        return;
      }
      event.stopPropagation();
      return;
    }

    const boardCard = cardFromEvent(event);
    if (boardCard) {
      if (dragGesture?.card === boardCard && dragGesture.moved) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      selectedCardId = boardCard.dataset.rowCard || '';
      activateLedgerCard(selectedCardId, true);
      return;
    }

    const ledgerCard = event.target.closest?.('#cardList .or-card[data-id]');
    if (ledgerCard && usedCardIds().has(ledgerCard.dataset.id)) {
      selectedCardId = ledgerCard.dataset.id;
      requestAnimationFrame(() => markLedgerSelection(selectedCardId));
    }
  }, true);

  window.addEventListener('input', event => {
    const input = event.target.closest?.('[data-relphi-placeholder-query]');
    if (!input) return;
    event.stopPropagation();
    renderSearch(input.closest(CHOICE));
  }, true);

  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      const choice = event.target.closest?.(CHOICE);
      if (choice) {
        event.preventDefault();
        closeSearch(choice);
        choice.querySelector('[data-relphi-placeholder-search]')?.focus();
        return;
      }
    }
    const card = event.target.closest?.(PANEL + ' .card-row-board [data-row-card]');
    if (card && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      selectedCardId = card.dataset.rowCard || '';
      activateLedgerCard(selectedCardId, true);
    }
  }, true);

  installStyle();
  configureShell();
  installObservers();
  queueEnhance();
  document.addEventListener('relphi:drawing-board-rendered', queueEnhance);
  window.addEventListener('relphi:tarot-enhancements-ready', queueEnhance);
})();
