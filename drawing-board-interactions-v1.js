// Focused Drawing Board interactions: direct undo/redo, targeted placeholder draws, and full card detail links.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;

  const PANEL_SELECTOR = '#shortListPanel';
  const busyTargets = new WeakSet();
  let scheduled = false;

  function panel() {
    return document.querySelector(PANEL_SELECTOR);
  }

  function normalize(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function isPlaceholder(item) {
    return !!item && item.classList.contains('card-row-placeholder-item') && !item.querySelector('[data-row-card]');
  }

  function directHistoryControls(root) {
    const toolbar = root.querySelector('.card-row-icon-toolbar');
    if (!toolbar) return;

    let group = toolbar.querySelector('.board-header-group--history');
    if (!group) {
      group = document.createElement('span');
      group.className = 'board-header-group board-header-group--history';
      const clear = toolbar.querySelector('#clearShortList');
      toolbar.insertBefore(group, clear || null);
    }

    const undo = root.querySelector('#undoShortList');
    const redo = root.querySelector('#redoShortList');
    [undo, redo].forEach(function (button, index) {
      if (!button) return;
      button.classList.add('board-history-icon');
      button.textContent = index === 0 ? '↶' : '↷';
      button.setAttribute('aria-label', index === 0 ? 'Undo' : 'Redo');
      button.title = index === 0 ? 'Undo' : 'Redo';
      if (button.parentElement !== group) group.appendChild(button);
    });

    root.querySelectorAll('.board-history-toggle,.board-history-menu').forEach(function (node) {
      node.remove();
    });
  }

  function payload(item) {
    if (!item) return null;
    return item.querySelector(':scope > .card-row-drop-card, :scope > .card-row-card') ||
      item.querySelector('.card-row-drop-card, .card-row-card');
  }

  function swapNodes(first, second) {
    if (!first || !second || first === second || !first.parentNode || !second.parentNode) return false;
    const marker = document.createComment('relphi-targeted-draw');
    first.parentNode.insertBefore(marker, first);
    second.parentNode.insertBefore(first, second);
    marker.parentNode.insertBefore(second, marker);
    marker.remove();
    return true;
  }

  function transferOrientation(source, target) {
    const reversed = source.classList.contains('is-row-reversed');
    target.classList.toggle('is-row-reversed', reversed);
    source.classList.remove('is-row-reversed');
    const targetCard = target.querySelector('[data-row-card]');
    const sourceCard = source.querySelector('[data-row-card]');
    if (targetCard) targetCard.dataset.rowReversed = reversed ? 'true' : 'false';
    if (sourceCard) sourceCard.dataset.rowReversed = 'false';
  }

  function placeNewCardInTarget(sourceItem, targetItem) {
    if (!sourceItem || !targetItem || sourceItem === targetItem) return true;
    const sourcePayload = payload(sourceItem);
    const targetPayload = payload(targetItem);
    const swapped = swapNodes(sourcePayload, targetPayload) || swapNodes(sourceItem, targetItem);
    if (!swapped) return false;
    transferOrientation(sourceItem, targetItem);
    targetItem.classList.remove('card-row-placeholder-item', 'relphi-targeted-draw-pending');
    if (!sourceItem.querySelector('[data-row-card]')) sourceItem.classList.add('card-row-placeholder-item');
    targetItem.dispatchEvent(new CustomEvent('relphi:drawing-board-targeted-draw', {
      bubbles: true,
      detail: { sourceItem: sourceItem, targetItem: targetItem }
    }));
    return true;
  }

  function drawIntoPlaceholder(targetItem) {
    const root = panel();
    if (!root || !isPlaceholder(targetItem) || busyTargets.has(targetItem)) return;
    const drawButton = root.querySelector('#drawRandomRowCard');
    if (!drawButton || drawButton.disabled) return;

    busyTargets.add(targetItem);
    targetItem.classList.add('relphi-targeted-draw-pending');
    const existingCards = new Set(root.querySelectorAll('[data-row-card]'));
    const started = Date.now();
    const observer = new MutationObserver(check);

    function finish() {
      observer.disconnect();
      targetItem.classList.remove('relphi-targeted-draw-pending');
      busyTargets.delete(targetItem);
      scheduleEnhance();
    }

    function check() {
      if (!targetItem.isConnected) return finish();
      if (targetItem.querySelector('[data-row-card]')) return finish();
      const newCard = Array.from(root.querySelectorAll('[data-row-card]')).find(function (card) {
        return !existingCards.has(card);
      });
      if (newCard) {
        const sourceItem = newCard.closest('.card-row-item');
        if (sourceItem && placeNewCardInTarget(sourceItem, targetItem)) return finish();
      }
      if (Date.now() - started > 4500) finish();
    }

    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-row-card'] });
    drawButton.click();
    check();
    setTimeout(check, 4600);
  }

  function placeholderFromClick(event) {
    const item = event.target.closest?.(PANEL_SELECTOR + ' .card-row-placeholder-item');
    if (!isPlaceholder(item)) return null;
    if (event.target.closest('.card-row-position-panel,.card-row-remove,[data-remove-card],input,textarea,select,label,a')) return null;
    return item;
  }

  function cardIdentity(titleElement) {
    const card = titleElement.closest('[data-row-card]');
    return {
      id: card?.dataset.rowCard || card?.getAttribute('data-row-card') || '',
      title: titleElement.textContent.trim()
    };
  }

  function findLedgerCard(identity) {
    const list = document.getElementById('cardList');
    if (!list) return null;
    const id = identity.id;
    const escaped = window.CSS?.escape ? CSS.escape(id) : id.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
    if (id) {
      const direct = list.querySelector('[data-card-id="' + escaped + '"],[data-card="' + escaped + '"],[data-card-key="' + escaped + '"],[data-id="' + escaped + '"]');
      if (direct) return direct;
    }
    const wanted = normalize(identity.title);
    return Array.from(list.querySelectorAll('button,[role="listitem"],li,article,[data-card-id],[data-card]')).find(function (node) {
      return normalize(node.textContent).includes(wanted);
    }) || null;
  }

  function revealFullCard(identity) {
    const showAll = document.getElementById('showAllCards') || document.getElementById('landingShowLedger');
    if (showAll) showAll.click();

    const started = Date.now();
    function tryOpen() {
      const match = findLedgerCard(identity);
      if (match) {
        (match.closest('button,[role="button"],[role="listitem"],li,article') || match).click();
        const browse = document.getElementById('browsePanel');
        if (browse) browse.hidden = false;
        const detail = document.getElementById('cardDetail');
        if (detail) detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (Date.now() - started > 1800) {
        const command = document.getElementById('oracleCommand');
        const run = document.getElementById('runCommand');
        if (command && run) {
          command.value = identity.title;
          command.dispatchEvent(new Event('input', { bubbles: true }));
          run.click();
          setTimeout(function () {
            const retry = findLedgerCard(identity);
            if (retry) (retry.closest('button,[role="button"],[role="listitem"],li,article') || retry).click();
            document.getElementById('cardDetail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 120);
        }
        return;
      }
      requestAnimationFrame(tryOpen);
    }
    requestAnimationFrame(tryOpen);
  }

  function handleCapturedClick(event) {
    const placeholder = placeholderFromClick(event);
    if (placeholder) {
      event.preventDefault();
      event.stopImmediatePropagation();
      drawIntoPlaceholder(placeholder);
      return;
    }

    const title = event.target.closest?.(PANEL_SELECTOR + ' .card-row-board .or-card-layer.relphi-info-layer .or-card-title-banner,' +
      PANEL_SELECTOR + ' .card-row-board .relphi-info-scroll .or-card-title-banner');
    if (!title) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    revealFullCard(cardIdentity(title));
  }

  function enhance() {
    scheduled = false;
    const root = panel();
    if (!root || root.hidden) return;
    directHistoryControls(root);
    root.querySelectorAll('.card-row-placeholder-item').forEach(function (item) {
      if (!item.querySelector('[data-row-card]')) {
        item.classList.add('relphi-clickable-placeholder');
        item.setAttribute('title', 'Draw a card into this position');
      }
    });
    root.querySelectorAll('.card-row-board .or-card-title-banner').forEach(function (title) {
      title.classList.add('relphi-card-title-link');
      title.setAttribute('role', 'button');
      title.setAttribute('tabindex', '0');
      title.setAttribute('aria-label', 'Open full card view for ' + title.textContent.trim());
    });
  }

  function scheduleEnhance() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(enhance);
  }

  function start() {
    if (document.documentElement.dataset.relphiDrawingBoardInteractions === 'true') return;
    document.documentElement.dataset.relphiDrawingBoardInteractions = 'true';

    const style = document.createElement('style');
    style.id = 'relphi-drawing-board-interactions-style';
    style.textContent = [
      '#shortListPanel .board-header-group--history{display:inline-flex!important;align-items:center!important;gap:.3rem!important}',
      '#shortListPanel .board-history-icon{display:inline-grid!important;place-items:center!important;width:2.25rem!important;min-width:2.25rem!important;height:2.25rem!important;padding:0!important;border-radius:8px!important;font-size:1.25rem!important;line-height:1!important}',
      '#shortListPanel .relphi-clickable-placeholder{cursor:pointer!important}',
      '#shortListPanel .relphi-clickable-placeholder .card-row-drop-card,#shortListPanel .relphi-clickable-placeholder .card-row-card{cursor:pointer!important}',
      '#shortListPanel .relphi-targeted-draw-pending{opacity:.72}',
      '#shortListPanel .relphi-targeted-draw-pending .card-row-drop-card,#shortListPanel .relphi-targeted-draw-pending .card-row-card{outline:3px solid rgba(220,31,24,.32)!important;outline-offset:3px!important}',
      '#shortListPanel .relphi-card-title-link{cursor:pointer!important;text-decoration:underline;text-decoration-thickness:.08em;text-underline-offset:.16em}',
      '#shortListPanel .relphi-card-title-link:focus-visible{outline:3px solid rgba(220,31,24,.28)!important;outline-offset:2px!important}'
    ].join('');
    document.head.appendChild(style);

    document.addEventListener('click', handleCapturedClick, true);
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const title = event.target.closest?.(PANEL_SELECTOR + ' .card-row-board .or-card-title-banner');
      if (!title) return;
      event.preventDefault();
      revealFullCard(cardIdentity(title));
    }, true);

    new MutationObserver(scheduleEnhance).observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['hidden', 'class']
    });
    scheduleEnhance();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
