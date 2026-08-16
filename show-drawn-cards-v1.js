// Tarot Ledger quick result state: browse only cards currently on the Drawing Board.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;

  const BUTTON_ID = 'showDrawnCards';
  const PANEL_ID = 'shortListPanel';
  const LIST_ID = 'cardList';
  let active = false;
  let internalRefresh = false;
  let boardRefreshTimer = 0;
  let lastBoardSignature = '';

  function normalize(value) {
    return String(value || '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function drawnCards() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return [];

    const seen = new Set();
    return Array.from(panel.querySelectorAll('.card-row-item [data-row-card]'))
      .map(function (card) {
        const id = String(card.dataset.rowCard || '').trim();
        const title = card.querySelector('.or-card-title-banner')?.textContent.trim() || id.replace(/_/g, ' ');
        return { id:id, title:title, key:id || normalize(title) };
      })
      .filter(function (card) {
        if (!card.key || seen.has(card.key)) return false;
        seen.add(card.key);
        return true;
      });
  }

  function boardSignature(cards) {
    return cards.map(function (card) { return card.key; }).join('|');
  }

  function resultItems() {
    const list = document.getElementById(LIST_ID);
    return list ? Array.from(list.children).filter(function (node) { return node.nodeType === 1; }) : [];
  }

  function itemIdentity(item) {
    const identityNode = item.matches('[data-card-id],[data-card],[data-id]')
      ? item
      : item.querySelector('[data-card-id],[data-card],[data-id]');

    const id = identityNode?.getAttribute('data-card-id') ||
      identityNode?.getAttribute('data-card') ||
      identityNode?.getAttribute('data-id') || '';

    const titleNode = item.querySelector('[data-card-name],.card-name,.tarot-card-name,.or-card-title-banner,h3,h4,strong');
    const title = titleNode?.getAttribute('data-card-name') || titleNode?.textContent || '';

    return {
      id:String(id).trim(),
      title:normalize(title),
      text:normalize(item.textContent)
    };
  }

  function itemMatchesCard(item, card) {
    const identity = itemIdentity(item);
    if (card.id && identity.id === card.id) return true;

    const wanted = normalize(card.title || card.id);
    if (!wanted) return false;
    if (identity.title === wanted) return true;

    return identity.text === wanted ||
      identity.text.startsWith(wanted + ' ') ||
      identity.text.includes(' ' + wanted + ' ');
  }

  function clearFilterClasses() {
    const list = document.getElementById(LIST_ID);
    if (!list) return;
    delete list.dataset.relphiDrawnCards;
    resultItems().forEach(function (item) {
      item.classList.remove('relphi-drawn-card-result');
    });
  }

  function updateButton() {
    const button = document.getElementById(BUTTON_ID);
    if (!button) return;
    const count = drawnCards().length;
    button.disabled = count === 0;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    button.title = count
      ? 'Show the cards currently on the Drawing Board in the Cards results list'
      : 'Draw cards on the Drawing Board to use this view';
  }

  function updateSummary(count) {
    const summaryCount = document.querySelector('#tarotSummary .tarot-summary-count');
    const resultCount = document.getElementById('resultCount');
    const resultNoun = document.getElementById('resultNoun');
    const inlineCount = document.getElementById('resultInlineCount');
    const activeSummary = document.getElementById('activeSummary');

    if (summaryCount) summaryCount.hidden = false;
    if (resultCount) resultCount.textContent = String(count);
    if (resultNoun) resultNoun.textContent = count === 1 ? ' card shown' : ' cards shown';
    if (inlineCount) inlineCount.textContent = count === 1 ? '1 card shown' : count + ' cards shown';
    if (activeSummary) {
      activeSummary.textContent = count
        ? 'Showing ' + count + ' drawn card' + (count === 1 ? '' : 's') + ' from the Drawing Board.'
        : 'No cards are currently drawn on the Drawing Board.';
    }
  }

  function applyFilter(cards) {
    const list = document.getElementById(LIST_ID);
    if (!list) return 0;

    const items = resultItems();
    const used = new Set();
    const matches = [];

    items.forEach(function (item) {
      item.classList.remove('relphi-drawn-card-result');
    });

    cards.forEach(function (card) {
      const match = items.find(function (item) {
        return !used.has(item) && itemMatchesCard(item, card);
      });
      if (!match) return;
      used.add(match);
      match.classList.add('relphi-drawn-card-result');
      matches.push(match);
    });

    // The data state plus CSS is the actual filter. This deliberately does not
    // rely on the HTML hidden attribute, because Tarot Ledger card styles can
    // override the browser's default [hidden] display rule.
    list.dataset.relphiDrawnCards = 'true';

    // Preserve Drawing Board order in the result list.
    const fragment = document.createDocumentFragment();
    matches.forEach(function (item) { fragment.appendChild(item); });
    list.appendChild(fragment);

    document.getElementById('browsePanel')?.removeAttribute('hidden');
    updateSummary(matches.length);
    return matches.length;
  }

  function refreshDrawnResults() {
    if (!active) return;

    const cards = drawnCards();
    lastBoardSignature = boardSignature(cards);
    updateButton();

    if (!cards.length) {
      const list = document.getElementById(LIST_ID);
      if (list) {
        resultItems().forEach(function (item) { item.classList.remove('relphi-drawn-card-result'); });
        list.dataset.relphiDrawnCards = 'true';
      }
      const detail = document.getElementById('cardDetail');
      if (detail) detail.innerHTML = '';
      updateSummary(0);
      return;
    }

    clearFilterClasses();

    const showAll = document.getElementById('showAllCards') || document.getElementById('landingShowLedger');
    if (!showAll) return;

    internalRefresh = true;
    showAll.click();
    internalRefresh = false;

    const started = Date.now();
    (function waitForCards() {
      if (!active) return;
      const matched = applyFilter(cards);
      if (matched === cards.length) return;
      if (Date.now() - started < 2000) requestAnimationFrame(waitForCards);
    })();
  }

  function activate() {
    if (!drawnCards().length) return;
    active = true;
    refreshDrawnResults();
  }

  function deactivate() {
    if (!active) return;
    active = false;
    lastBoardSignature = '';
    clearFilterClasses();
    updateButton();
  }

  function installButton() {
    const showAll = document.getElementById('showAllCards');
    if (!showAll || document.getElementById(BUTTON_ID)) return;

    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.type = 'button';
    button.textContent = 'Show Drawn Cards';
    button.setAttribute('aria-pressed', 'false');
    showAll.insertAdjacentElement('afterend', button);
    button.addEventListener('click', activate);
    updateButton();
  }

  function installStyles() {
    if (document.getElementById('relphi-show-drawn-cards-style')) return;

    const style = document.createElement('style');
    style.id = 'relphi-show-drawn-cards-style';
    style.textContent = [
      '#showDrawnCards.is-active{box-shadow:inset 0 -3px 0 #dc1f18!important}',
      '#showDrawnCards:disabled{opacity:.45!important;cursor:default!important}',
      '#cardList[data-relphi-drawn-cards="true"] > :not(.relphi-drawn-card-result){display:none!important}'
    ].join('');
    document.head.appendChild(style);
  }

  function installExitHooks() {
    ['showAllCards', 'landingShowLedger', 'runCommand', 'clearSearch', 'drawMode', 'dateMode', 'chartMode', 'currentSkyMode']
      .forEach(function (id) {
        document.getElementById(id)?.addEventListener('click', function () {
          if ((id === 'showAllCards' || id === 'landingShowLedger') && internalRefresh) return;
          deactivate();
        }, true);
      });
  }

  function observeBoard() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel || panel.dataset.relphiShowDrawnObserved === 'true') return;

    panel.dataset.relphiShowDrawnObserved = 'true';
    new MutationObserver(function () {
      clearTimeout(boardRefreshTimer);
      boardRefreshTimer = window.setTimeout(function () {
        const cards = drawnCards();
        const nextSignature = boardSignature(cards);
        updateButton();
        if (active && nextSignature !== lastBoardSignature) refreshDrawnResults();
      }, 80);
    }).observe(panel, {
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:['data-row-card']
    });
  }

  function start() {
    installStyles();
    installButton();
    installExitHooks();
    observeBoard();
    updateButton();

    new MutationObserver(function () {
      if (!document.getElementById(BUTTON_ID)) installButton();
      observeBoard();
      updateButton();
    }).observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once:true });
  } else {
    start();
  }
})();
