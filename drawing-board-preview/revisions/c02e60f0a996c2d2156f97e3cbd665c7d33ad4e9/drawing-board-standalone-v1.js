// Standalone Drawing Board enhancements: Draw/Search placeholders and full-entry card inspector.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname) && !location.pathname.includes('/drawing-board-preview/')) return;
  if (document.documentElement.dataset.relphiStandaloneDrawingBoard === 'true') return;
  document.documentElement.dataset.relphiStandaloneDrawingBoard = 'true';

  const PANEL = '#shortListPanel';
  const CHOICE = '[data-relphi-placeholder-choice]';
  let activeDraw = false;
  let modal = null;
  let modalReturnFocus = null;
  let movedDetail = null;
  let originalDetail = null;
  let dragGesture = null;

  function root() { return document.querySelector(PANEL); }
  function cards() { return Array.isArray(window.RELPHI_TAROT_CARDS) ? window.RELPHI_TAROT_CARDS : []; }
  function normalize(value) { return String(value || '').toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function cardName(card) { return String(card?.name || card?.title || card?.card_name || card?.card_id || '').trim(); }
  function cssEscape(value) { return window.CSS?.escape ? window.CSS.escape(String(value || '')) : String(value || '').replace(/[^a-zA-Z0-9_-]/g, '\\$&'); }
  function cardMeta(card) {
    const suit = String(card?.suit || '').trim();
    const type = String(card?.card_type || '').trim();
    if (suit) return suit.charAt(0).toUpperCase() + suit.slice(1);
    if (type) return type.charAt(0).toUpperCase() + type.slice(1);
    return 'Tarot card';
  }
  function cardSearchText(card) {
    const a = card?.astrology || {};
    return normalize([
      card?.card_id, cardName(card), card?.card_type, card?.rank, card?.suit,
      ...(Array.isArray(card?.tags) ? card.tags : []),
      a.planet, a.zodiac_sign, a.sign, a.element, a.hebrew_letter
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
    if (document.getElementById('relphiStandaloneDrawingBoardStyleV1')) return;
    const style = document.createElement('style');
    style.id = 'relphiStandaloneDrawingBoardStyleV1';
    style.textContent = `
      #shortListPanel .card-row-board .or-card-layer.relphi-info-layer{display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important}
      #shortListPanel .card-row-placeholder-item{isolation:isolate}
      #shortListPanel .card-row-placeholder-item>.card-row-drop-card{position:relative}
      #shortListPanel .card-row-placeholder-item>.card-row-drop-card>.card-row-drop-card-inner,#shortListPanel .card-row-placeholder-item>.card-row-drop-card>img{opacity:.18}
      #shortListPanel .relphi-placeholder-choice{position:absolute;inset:0;z-index:12;display:flex;align-items:center;justify-content:center;padding:.55rem;border-radius:inherit;background:rgba(255,253,248,.82);font:inherit;cursor:default}
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
      .relphi-standalone-card-modal{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:clamp(.5rem,2vw,1.3rem);background:rgba(15,12,10,.72)}
      .relphi-standalone-card-modal[hidden]{display:none}
      .relphi-standalone-card-dialog{position:relative;width:min(1080px,96vw);max-height:94vh;overflow:auto;border:1px solid rgba(24,20,18,.18);border-radius:18px;background:#fffdf8;box-shadow:0 24px 80px rgba(0,0,0,.3)}
      .relphi-standalone-card-close{position:sticky;top:.65rem;float:right;z-index:4;margin:.65rem .65rem 0 0;width:2.35rem;height:2.35rem;border:1px solid rgba(24,20,18,.25);border-radius:999px;background:#fff;color:#171412;font:900 1.25rem/1 Inter,Montserrat,"Segoe UI",Arial,sans-serif;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.1)}
      .relphi-standalone-card-entry-body{clear:both;padding:0 clamp(.75rem,2.5vw,1.5rem) 1.5rem}
      .relphi-standalone-card-entry-body .relphi-full-ledger-link{display:inline-flex;align-items:center;margin:.25rem 0 .25rem .4rem;padding:.34rem .58rem;border:1px solid rgba(24,20,18,.22);border-radius:999px;color:#171412;background:#fff;text-decoration:none;font:800 .72rem/1 Inter,Montserrat,"Segoe UI",Arial,sans-serif;white-space:nowrap}
      .relphi-standalone-card-entry-body .relphi-full-ledger-link:hover,.relphi-standalone-card-entry-body .relphi-full-ledger-link:focus-visible{border-color:#dc1f18;color:#b31914;outline:none}
      .relphi-standalone-card-entry-body .full-entry-title-row{flex-wrap:wrap}
      @media(max-width:640px){#shortListPanel .relphi-placeholder-choice{padding:.35rem}#shortListPanel .relphi-placeholder-choice button{font-size:.68rem;padding:.38rem .56rem}.relphi-standalone-card-dialog{width:98vw;max-height:96vh;border-radius:14px}.relphi-standalone-card-entry-body{padding:0 .55rem 1rem}}
    `;
    document.head.appendChild(style);
  }

  function closeSearch(choice) {
    const panel = choice?.querySelector('[data-relphi-placeholder-search-panel]');
    const toggle = choice?.querySelector('[data-relphi-placeholder-search]');
    if (panel) panel.hidden = true;
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  function renderSearch(choice) {
    const input = choice.querySelector('[data-relphi-placeholder-query]');
    const results = choice.querySelector('[data-relphi-placeholder-search-results]');
    if (!input || !results) return;
    const term = normalize(input.value);
    results.replaceChildren();
    if (!term) {
      const status = document.createElement('p');
      status.className = 'relphi-placeholder-search-status';
      status.textContent = 'Type a card name.';
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
      button.innerHTML = '<span></span><small></small>';
      button.querySelector('span').textContent = cardName(card);
      button.querySelector('small').textContent = cardMeta(card);
      results.appendChild(button);
    });
  }

  function dropCardInto(item, cardId) {
    if (!item?.isConnected || !cardId) return false;
    const target = item.matches('[data-row-placeholder]') ? item : item.querySelector('[data-row-placeholder]');
    if (!target) return false;
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
    const beforeCount = panel.querySelectorAll('[data-row-card]').length;
    const wantedIndex = Number(item.dataset.rowPlaceholder ?? item.dataset.rowIndex);
    draw.click();
    const started = Date.now();
    (function finish() {
      const nextPanel = root();
      if (!nextPanel) { activeDraw = false; return; }
      const rowCards = Array.from(nextPanel.querySelectorAll('[data-row-card]'));
      const added = rowCards.length > beforeCount ? rowCards[Math.min(beforeCount, rowCards.length - 1)] : null;
      if (added) {
        const id = added.dataset.rowCard;
        const target = nextPanel.querySelector('.card-row-item.card-row-placeholder-item[data-row-placeholder="' + wantedIndex + '"]');
        if (target && Number.isFinite(wantedIndex)) dropCardInto(target, id);
        activeDraw = false;
        return;
      }
      if (Date.now() - started > 1800) { activeDraw = false; return; }
      requestAnimationFrame(finish);
    })();
  }

  function installPlaceholder(item) {
    if (!isEmptyItem(item) || item.querySelector(CHOICE)) return;
    const choice = document.createElement('label');
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

  function enhanceBoard() {
    const panel = root();
    if (!panel) return;
    panel.querySelectorAll('.card-row-item.card-row-placeholder-item').forEach(installPlaceholder);
  }

  function ensureModal() {
    if (modal?.isConnected) return modal;
    modal = document.createElement('div');
    modal.className = 'relphi-standalone-card-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <section class="relphi-standalone-card-dialog" role="dialog" aria-modal="true" aria-label="Full tarot card entry">
        <button class="relphi-standalone-card-close" type="button" aria-label="Close full card entry">×</button>
        <div class="relphi-standalone-card-entry-body"></div>
      </section>`;
    document.body.appendChild(modal);
    modal.querySelector('.relphi-standalone-card-close').addEventListener('click', closeModal);
    modal.addEventListener('mousedown', event => { if (event.target === modal) closeModal(); });
    return modal;
  }

  function addLedgerLink(container) {
    if (!container || container.querySelector('.relphi-full-ledger-link')) return;
    const glyphs = container.querySelector('.detail-glyph-panel');
    if (!glyphs) return;
    const link = document.createElement('a');
    link.className = 'relphi-full-ledger-link';
    link.href = '/tarot.html';
    link.target = '_top';
    link.textContent = 'Full Tarot Ledger';
    glyphs.insertAdjacentElement('afterend', link);
  }

  function syncBoardButton(container) {
    const btn = container?.querySelector('[data-shortlist]');
    if (!btn) return;
    const id = btn.dataset.shortlist;
    const onBoard = !!document.querySelector(PANEL + ' [data-row-card="' + cssEscape(id) + '"]');
    btn.setAttribute('aria-pressed', onBoard ? 'true' : 'false');
    const label = btn.querySelector('.row-add-label');
    if (label) label.textContent = onBoard ? 'Remove from Drawing Board' : 'Add to Drawing Board';
    const icon = btn.querySelector('.row-add-icon');
    if (icon) icon.textContent = onBoard ? '−' : '+';
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    const body = modal.querySelector('.relphi-standalone-card-entry-body');
    if (movedDetail && originalDetail?.isConnected && !originalDetail.childNodes.length) {
      while (movedDetail.firstChild) originalDetail.appendChild(movedDetail.firstChild);
    }
    movedDetail?.remove();
    movedDetail = null;
    originalDetail = null;
    modal.hidden = true;
    document.documentElement.style.removeProperty('overflow');
    const focus = modalReturnFocus;
    modalReturnFocus = null;
    if (focus?.isConnected) focus.focus({ preventScroll:true });
    if (body) body.replaceChildren();
  }

  function showRenderedDetail(cardId, trigger) {
    const detail = document.getElementById('cardDetail');
    if (!detail || !detail.querySelector('[data-shortlist="' + cssEscape(cardId) + '"]')) return false;
    const host = ensureModal();
    const body = host.querySelector('.relphi-standalone-card-entry-body');
    closeModal();
    const live = document.createElement('div');
    live.className = 'relphi-standalone-card-entry-live';
    while (detail.firstChild) live.appendChild(detail.firstChild);
    body.appendChild(live);
    movedDetail = live;
    originalDetail = detail;
    modalReturnFocus = trigger || null;
    addLedgerLink(live);
    syncBoardButton(live);
    host.hidden = false;
    document.documentElement.style.setProperty('overflow', 'hidden');
    host.querySelector('.relphi-standalone-card-close').focus({ preventScroll:true });
    return true;
  }

  function findLedgerCard(cardId) {
    const list = document.getElementById('cardList');
    if (!list) return null;
    return Array.from(list.querySelectorAll('[data-card-id],[data-id]')).find(node =>
      node.dataset.cardId === cardId || node.dataset.id === cardId
    ) || null;
  }

  function openFullCard(cardId, trigger) {
    if (!cardId) return;
    (document.getElementById('showAllCards') || document.getElementById('landingShowLedger'))?.click();
    const started = Date.now();
    (function tryOpen() {
      const existing = document.getElementById('cardDetail');
      if (existing?.querySelector('[data-shortlist="' + cssEscape(cardId) + '"]')) {
        showRenderedDetail(cardId, trigger);
        return;
      }
      const match = findLedgerCard(cardId);
      if (match) {
        const clickable = match.closest('button,[role="button"],[data-card-id],.or-card') || match;
        clickable.click();
      }
      if (showRenderedDetail(cardId, trigger)) return;
      if (Date.now() - started < 1800) requestAnimationFrame(tryOpen);
    })();
  }

  function cardFromEvent(event) {
    const card = event.target.closest?.(PANEL + ' .card-row-board [data-row-card]');
    if (!card) return null;
    if (event.target.closest('button,input,textarea,select,label,a,[data-shortlist],[data-filter],[data-row-transform-handle],[data-row-reverse],.card-row-sense-panel,.card-row-position-panel')) return null;
    return card;
  }

  document.addEventListener('pointerdown', event => {
    const choice = event.target.closest?.(CHOICE);
    if (choice) event.stopPropagation();
    const card = cardFromEvent(event);
    if (card) dragGesture = { card, x:event.clientX, y:event.clientY, moved:false };
  }, true);
  document.addEventListener('pointermove', event => {
    if (!dragGesture) return;
    if (Math.hypot(event.clientX - dragGesture.x, event.clientY - dragGesture.y) > 7) dragGesture.moved = true;
  }, true);
  document.addEventListener('pointerup', () => { window.setTimeout(() => { dragGesture = null; }, 120); }, true);

  document.addEventListener('click', event => {
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
        const panel = choice.querySelector('[data-relphi-placeholder-search-panel]');
        panel.hidden = false; search.setAttribute('aria-expanded','true');
        const input = choice.querySelector('[data-relphi-placeholder-query]');
        renderSearch(choice); input?.focus(); return;
      }
      if (close) { event.preventDefault(); event.stopImmediatePropagation(); closeSearch(choice); choice.querySelector('[data-relphi-placeholder-search]')?.focus(); return; }
      if (result) { event.preventDefault(); event.stopImmediatePropagation(); dropCardInto(item, result.dataset.relphiPlaceholderResult); return; }
      event.stopPropagation();
      return;
    }

    const card = cardFromEvent(event);
    if (card) {
      if (dragGesture?.card === card && dragGesture.moved) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openFullCard(card.dataset.rowCard, card);
      return;
    }

    if (modal && !modal.hidden && event.target.closest?.('.relphi-standalone-card-entry-body [data-shortlist]')) {
      window.setTimeout(() => { if (movedDetail) syncBoardButton(movedDetail); }, 40);
    }
  }, true);

  document.addEventListener('input', event => {
    const input = event.target.closest?.('[data-relphi-placeholder-query]');
    if (!input) return;
    event.stopPropagation();
    const choice = input.closest(CHOICE);
    renderSearch(choice);
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (modal && !modal.hidden) { event.preventDefault(); closeModal(); return; }
      const choice = event.target.closest?.(CHOICE);
      if (choice) { event.preventDefault(); closeSearch(choice); choice.querySelector('[data-relphi-placeholder-search]')?.focus(); return; }
    }
    const card = event.target.closest?.(PANEL + ' .card-row-board [data-row-card]');
    if (card && event.target === card && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault(); event.stopImmediatePropagation(); openFullCard(card.dataset.rowCard, card);
    }
  }, true);

  installStyle();
  enhanceBoard();
  const observer = new MutationObserver(() => {
    enhanceBoard();
    if (movedDetail) { addLedgerLink(movedDetail); syncBoardButton(movedDetail); }
  });
  observer.observe(document.documentElement, { childList:true, subtree:true });
  document.addEventListener('relphi:drawing-board-rendered', enhanceBoard);
})();