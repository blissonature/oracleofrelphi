// Tarot Ledger quick result state: browse only cards currently on the Drawing Board.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;

  const BUTTON_ID = 'showDrawnCards';
  const PANEL_ID = 'shortListPanel';
  const LIST_ID = 'cardList';
  let active = false;
  let internalShowAll = false;
  let refreshTimer = 0;
  let lastSignature = '';

  function normalize(value) {
    return String(value || '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function drawnCards() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) return [];
    const seen = new Set();
    return Array.from(panel.querySelectorAll('.card-row-item [data-row-card]')).map(function (card, index) {
      const id = String(card.dataset.rowCard || '').trim();
      const title = card.querySelector('.or-card-title-banner')?.textContent.trim() || id.replace(/_/g, ' ');
      const key = id || normalize(title);
      return { id:id, title:title, key:key, index:index };
    }).filter(function (card) {
      if (!card.key || seen.has(card.key)) return false;
      seen.add(card.key);
      return true;
    });
  }

  function signature(cards) {
    return cards.map(function (card) { return card.id || normalize(card.title); }).join('|');
  }

  function resultItems(list) {
    return Array.from(list?.children || []).filter(function (node) { return node.nodeType === 1; });
  }

  function itemIdentity(item) {
    const identityNode = item.matches('[data-card-id],[data-card],[data-id]')
      ? item
      : item.querySelector('[data-card-id],[data-card],[data-id]');
    const id = identityNode?.getAttribute('data-card-id') || identityNode?.getAttribute('data-card') || identityNode?.getAttribute('data-id') || '';
    const titleNode = item.querySelector('.card-name,.tarot-card-name,.or-card-title-banner,[data-card-name],h3,h4,strong');
    const title = titleNode?.getAttribute('data-card-name') || titleNode?.textContent || item.textContent || '';
    return { id:String(id).trim(), title:normalize(title) };
  }

  function matchesCard(item, card) {
    const identity = itemIdentity(item);
    if (card.id && identity.id === card.id) return true;
    const wanted = normalize(card.title || card.id);
    if (!wanted) return false;
    if (identity.title === wanted) return true;
    const text = normalize(item.textContent);
    return text === wanted || text.startsWith(wanted + ' ') || text.includes(' ' + wanted + ' ');
  }

  function clearResultDecorations() {
    const list = document.getElementById(LIST_ID);
    if (!list) return;
    const items = resultItems(list);
    const originalOrder = items
      .filter(function (item) { return item.dataset.relphiDrawnIndex !== undefined; })
      .sort(function (a, b) { return Number(a.dataset.relphiDrawnIndex) - Number(b.dataset.relphiDrawnIndex); });
    if (originalOrder.length === items.length) {
      const fragment = document.createDocumentFragment();
      originalOrder.forEach(function (item) { fragment.appendChild(item); });
      list.appendChild(fragment);
    }
    delete list.dataset.relphiDrawnCards;
    resultItems(list).forEach(function (item) {
      if (item.dataset.relphiDrawnHidden === 'true') item.hidden = false;
      delete item.dataset.relphiDrawnHidden;
      delete item.dataset.relphiDrawnIndex;
      item.classList.remove('relphi-drawn-card-result');
    });
  }

  function setButtonState() {
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

  function setSummary(count) {
    const summaryCount = document.querySelector('#tarotSummary .tarot-summary-count');
    if (summaryCount) summaryCount.hidden = false;
    const resultCount = document.getElementById('resultCount');
    const resultNoun = document.getElementById('resultNoun');
    const inlineCount = document.getElementById('resultInlineCount');
    const activeSummary = document.getElementById('activeSummary');
    if (resultCount) resultCount.textContent = String(count);
    if (resultNoun) resultNoun.textContent = count === 1 ? ' card shown' : ' cards shown';
    if (inlineCount) inlineCount.textContent = count === 1 ? '1 card shown' : count + ' cards shown';
    if (activeSummary) activeSummary.textContent = count
      ? 'Showing ' + count + ' drawn card' + (count === 1 ? '' : 's') + ' from the Drawing Board.'
      : 'No cards are currently drawn on the Drawing Board.';
  }

  function applyDrawnResults(cards) {
    const list = document.getElementById(LIST_ID);
    const browse = document.getElementById('browsePanel');
    if (!list) return false;

    clearResultDecorations();
    list.dataset.relphiDrawnCards = 'true';
    const items = resultItems(list);
    items.forEach(function (item, index) { item.dataset.relphiDrawnIndex = String(index); });
    const matched = new Set();
    const orderedMatches = [];

    cards.forEach(function (card) {
      const match = items.find(function (item) { return !matched.has(item) && matchesCard(item, card); });
      if (!match) return;
      matched.add(match);
      orderedMatches.push(match);
      match.hidden = false;
      match.classList.add('relphi-drawn-card-result');
    });

    items.forEach(function (item) {
      if (matched.has(item)) return;
      item.hidden = true;
      item.dataset.relphiDrawnHidden = 'true';
    });

    const fragment = document.createDocumentFragment();
    orderedMatches.forEach(function (item) { fragment.appendChild(item); });
    list.appendChild(fragment);

    if (browse) browse.hidden = false;
    setSummary(matched.size);
    return matched.size === cards.length;
  }

  function refreshDrawnResults() {
    if (!active) return;
    const cards = drawnCards();
    lastSignature = signature(cards);
    setButtonState();

    if (!cards.length) {
      clearResultDecorations();
      const list = document.getElementById(LIST_ID);
      if (list) {
        resultItems(list).forEach(function (item) {
          item.hidden = true;
          item.dataset.relphiDrawnHidden = 'true';
        });
        list.dataset.relphiDrawnCards = 'true';
      }
      const detail = document.getElementById('cardDetail');
      if (detail) detail.innerHTML = '';
      setSummary(0);
      return;
    }

    const showAll = document.getElementById('showAllCards') || document.getElementById('landingShowLedger');
    if (!showAll) return;
    clearResultDecorations();
    internalShowAll = true;
    showAll.click();
    internalShowAll = false;

    const started = Date.now();
    (function tryApply() {
      if (!active) return;
      if (applyDrawnResults(cards)) return;
      if (Date.now() - started < 1800) requestAnimationFrame(tryApply);
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
    lastSignature = '';
    clearResultDecorations();
    setButtonState();
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
    setButtonState();
  }

  function installStyles() {
    if (document.getElementById('relphi-show-drawn-cards-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-show-drawn-cards-style';
    style.textContent = [
      '#showDrawnCards.is-active{box-shadow:inset 0 -3px 0 #dc1f18!important}',
      '#showDrawnCards:disabled{opacity:.45!important;cursor:default!important}'
    ].join('');
    document.head.appendChild(style);
  }

  function scheduleBoardRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(function () {
      const cards = drawnCards();
      const nextSignature = signature(cards);
      setButtonState();
      if (active && nextSignature !== lastSignature) refreshDrawnResults();
    }, 60);
  }

  function installExitHooks() {
    ['showAllCards', 'landingShowLedger', 'runCommand', 'clearSearch', 'drawMode', 'dateMode', 'chartMode', 'currentSkyMode'].forEach(function (id) {
      document.getElementById(id)?.addEventListener('click', function () {
        if (id === 'showAllCards' && internalShowAll) return;
        deactivate();
      }, true);
    });
  }

  function observeBoard() {
    const panel = document.getElementById(PANEL_ID);
    if (!panel || panel.dataset.relphiShowDrawnObserved === 'true') return;
    panel.dataset.relphiShowDrawnObserved = 'true';
    new MutationObserver(scheduleBoardRefresh).observe(panel, {
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
    setButtonState();

    const bodyObserver = new MutationObserver(function () {
      if (!document.getElementById(BUTTON_ID)) installButton();
      observeBoard();
      setButtonState();
    });
    bodyObserver.observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
