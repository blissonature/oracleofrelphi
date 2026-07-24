// Focused Drawing Board interactions: direct undo/redo, reliable targeted draws, and full card detail links.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;

  const PANEL = '#shortListPanel';
  let activeTarget = null;
  let restoreTimer = 0;

  function root() { return document.querySelector(PANEL); }
  function normalize(value) { return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase(); }
  function isEmptyItem(item) {
    return !!item && !item.querySelector('[data-row-card]') &&
      (item.classList.contains('card-row-placeholder-item') || item.classList.contains('relphi-target-draw-proxy'));
  }
  function swapItems(a, b) {
    if (!a || !b || a === b || !a.parentNode || a.parentNode !== b.parentNode) return false;
    const marker = document.createComment('relphi-target-position');
    a.parentNode.insertBefore(marker, a);
    b.parentNode.insertBefore(a, b);
    marker.parentNode.insertBefore(b, marker);
    marker.remove();
    return true;
  }

  function directHistoryControls(panel) {
    const toolbar = panel.querySelector('.card-row-icon-toolbar');
    if (!toolbar) return;
    let group = toolbar.querySelector('.board-header-group--history');
    if (!group) {
      group = document.createElement('span');
      group.className = 'board-header-group board-header-group--history';
      toolbar.insertBefore(group, toolbar.querySelector('#clearShortList') || null);
    }
    const undo = panel.querySelector('#undoShortList');
    const redo = panel.querySelector('#redoShortList');
    [[undo, '↶', 'Undo'], [redo, '↷', 'Redo']].forEach(function (entry) {
      const button = entry[0];
      if (!button) return;
      button.classList.add('board-history-icon');
      button.textContent = entry[1];
      button.setAttribute('aria-label', entry[2]);
      button.title = entry[2];
      if (button.parentElement !== group) group.appendChild(button);
    });
    panel.querySelectorAll('.board-history-toggle,.board-history-menu').forEach(function (node) { node.remove(); });
  }

  function finishTargetedDraw(target, first, swapped) {
    clearTimeout(restoreTimer);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (swapped && target?.isConnected && first?.isConnected && target.parentNode === first.parentNode) swapItems(target, first);
        if (target?.isConnected) {
          target.classList.remove('relphi-target-draw-proxy', 'relphi-targeted-draw-pending');
          if (!target.querySelector('[data-row-card]')) target.classList.add('card-row-placeholder-item');
        }
        if (first?.isConnected && !first.querySelector('[data-row-card]')) first.classList.add('card-row-placeholder-item');
        activeTarget = null;
      });
    });
  }

  function drawInto(item) {
    const panel = root();
    if (!panel || activeTarget || !isEmptyItem(item)) return;
    const draw = panel.querySelector('#drawRandomRowCard');
    if (!draw || draw.disabled) return;

    activeTarget = item;
    item.classList.add('relphi-targeted-draw-pending', 'relphi-target-draw-proxy');
    item.classList.remove('card-row-placeholder-item');

    const emptyItems = Array.from(panel.querySelectorAll('.card-row-item')).filter(isEmptyItem);
    const first = emptyItems[0] || item;
    const swapped = first !== item && swapItems(item, first);
    const observer = new MutationObserver(function () {
      if (!item.isConnected || item.querySelector('[data-row-card]')) {
        observer.disconnect();
        finishTargetedDraw(item, first, swapped);
      }
    });
    observer.observe(panel, { childList:true, subtree:true, attributes:true, attributeFilter:['class','data-row-card'] });
    draw.click();
    restoreTimer = window.setTimeout(function () {
      observer.disconnect();
      finishTargetedDraw(item, first, swapped);
    }, 5000);
  }

  function placeholderFromPointer(event) {
    const item = event.target.closest?.(PANEL + ' .card-row-item');
    if (!isEmptyItem(item)) return null;
    if (event.target.closest('input,textarea,select,label,a,.card-row-position-panel,.card-row-remove,[data-remove-card]')) return null;
    return item;
  }

  function cardIdentity(title) {
    const card = title.closest('[data-row-card]');
    return { id: card?.dataset.rowCard || '', title: title.textContent.trim() };
  }
  function findLedgerCard(identity) {
    const list = document.getElementById('cardList');
    if (!list) return null;
    const wanted = normalize(identity.title);
    return Array.from(list.querySelectorAll('button,[role="listitem"],li,article,[data-card-id],[data-card]')).find(function (node) {
      const id = node.getAttribute('data-card-id') || node.getAttribute('data-card') || node.getAttribute('data-id') || '';
      return (identity.id && id === identity.id) || normalize(node.textContent).includes(wanted);
    }) || null;
  }
  function revealFullCard(identity) {
    (document.getElementById('showAllCards') || document.getElementById('landingShowLedger'))?.click();
    const started = Date.now();
    (function tryOpen() {
      const match = findLedgerCard(identity);
      if (match) {
        (match.closest('button,[role="button"],[role="listitem"],li,article') || match).click();
        document.getElementById('browsePanel')?.removeAttribute('hidden');
        document.getElementById('cardDetail')?.scrollIntoView({ behavior:'smooth', block:'start' });
        return;
      }
      if (Date.now() - started < 1800) return requestAnimationFrame(tryOpen);
      const command = document.getElementById('oracleCommand');
      const run = document.getElementById('runCommand');
      if (command && run) {
        command.value = identity.title;
        command.dispatchEvent(new Event('input', { bubbles:true }));
        run.click();
      }
    })();
  }

  function enhance() {
    const panel = root();
    if (!panel || panel.hidden) return;
    directHistoryControls(panel);
    panel.querySelectorAll('.card-row-item').forEach(function (item) {
      if (isEmptyItem(item)) {
        item.classList.add('relphi-clickable-placeholder');
        item.title = 'Draw a card into this position';
      }
    });
    panel.querySelectorAll('.card-row-board .or-card-title-banner').forEach(function (title) {
      title.classList.add('relphi-card-title-link');
      title.setAttribute('role', 'button');
      title.setAttribute('tabindex', '0');
    });
  }

  function start() {
    if (document.documentElement.dataset.relphiDrawingBoardInteractions === 'true') return;
    document.documentElement.dataset.relphiDrawingBoardInteractions = 'true';

    const style = document.createElement('style');
    style.id = 'relphi-drawing-board-interactions-style';
    style.textContent = [
      '#shortListPanel{overflow:visible!important}',
      '#shortListPanel .card-row-drawing-board,#shortListPanel .card-row-more-options,#shortListPanel .card-row-composer,#shortListPanel .card-row-control-block,#shortListPanel .board-options-body{overflow:visible!important}',
      '#shortListPanel .card-row-icon-toolbar,#shortListPanel .card-row-workspace-toolbar,#shortListPanel .board-options-tabs,#shortListPanel .board-arrange-flyout,#shortListPanel .board-history-menu{position:relative!important;z-index:10020!important;isolation:isolate}',
      '#shortListPanel .board-arrange-flyout .card-row-control-block,#shortListPanel .card-row-more-options[open],#shortListPanel .card-row-more-options[open] .card-row-composer{position:relative!important;z-index:10030!important}',
      '#shortListPanel .card-row-workspace,#shortListPanel .short-list-row.card-row-board{position:relative!important;z-index:1!important}',
      '#shortListPanel .card-row-item,#shortListPanel .card-row-board-grid{z-index:auto!important}',
      '#shortListPanel .card-row-position-label,#shortListPanel .row-sticker-prefab-controls{position:relative!important;z-index:10040!important;overflow:visible!important}',
      '#shortListPanel #rowPositionLabels{position:relative!important;z-index:10041!important}',
      '#shortListPanel .board-header-group--history{display:inline-flex!important;align-items:center!important;gap:.3rem!important}',
      '#shortListPanel .board-history-icon{display:inline-grid!important;place-items:center!important;width:2.25rem!important;min-width:2.25rem!important;height:2.25rem!important;padding:0!important;border-radius:8px!important;font-size:1.25rem!important;line-height:1!important}',
      '#shortListPanel .relphi-clickable-placeholder,#shortListPanel .relphi-clickable-placeholder .card-row-drop-card,#shortListPanel .relphi-clickable-placeholder .card-row-card{cursor:pointer!important}',
      '#shortListPanel .relphi-targeted-draw-pending{outline:4px solid rgba(220,31,24,.38)!important;outline-offset:4px!important;cursor:wait!important}',
      '#shortListPanel .relphi-card-title-link{cursor:pointer!important;text-decoration:underline;text-decoration-thickness:.08em;text-underline-offset:.16em}',
      '#shortListPanel .relphi-card-title-link:focus-visible{outline:3px solid rgba(220,31,24,.28)!important;outline-offset:2px!important}'
    ].join('');
    document.head.appendChild(style);

    document.addEventListener('pointerdown', function (event) {
      if (event.button != null && event.button !== 0) return;
      const item = placeholderFromPointer(event);
      if (!item) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      drawInto(item);
    }, true);

    document.addEventListener('click', function (event) {
      const title = event.target.closest?.(PANEL + ' .card-row-board .or-card-title-banner');
      if (!title) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      revealFullCard(cardIdentity(title));
    }, true);

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const title = event.target.closest?.(PANEL + ' .card-row-board .or-card-title-banner');
      if (!title) return;
      event.preventDefault();
      revealFullCard(cardIdentity(title));
    }, true);

    new MutationObserver(function () { requestAnimationFrame(enhance); }).observe(document.body, {
      childList:true, subtree:true, attributes:true, attributeFilter:['hidden','class']
    });
    enhance();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
