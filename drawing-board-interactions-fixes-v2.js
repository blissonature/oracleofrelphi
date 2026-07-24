// Follow-up fixes for Drawing Board interactions: reliable targeted draws, foreground UI, and unclipped controls.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;

  const PANEL = '#shortListPanel';
  let activeTarget = null;
  let restoreTimer = 0;

  function root() { return document.querySelector(PANEL); }

  function isEmptyItem(item) {
    return !!item && !item.querySelector('[data-row-card]') &&
      (item.classList.contains('card-row-placeholder-item') || item.classList.contains('relphi-target-draw-proxy'));
  }

  function swapItems(a, b) {
    if (!a || !b || a === b || !a.parentNode || !b.parentNode || a.parentNode !== b.parentNode) return false;
    const marker = document.createComment('relphi-target-position');
    a.parentNode.insertBefore(marker, a);
    b.parentNode.insertBefore(a, b);
    marker.parentNode.insertBefore(b, marker);
    marker.remove();
    return true;
  }

  function finishTargetedDraw(target, first, swapped) {
    clearTimeout(restoreTimer);
    const done = function () {
      if (swapped && target?.isConnected && first?.isConnected && target.parentNode === first.parentNode) {
        swapItems(target, first);
      }
      if (target?.isConnected) {
        target.classList.remove('relphi-target-draw-proxy', 'relphi-targeted-draw-pending');
        if (!target.querySelector('[data-row-card]')) target.classList.add('card-row-placeholder-item');
      }
      if (first?.isConnected && !first.querySelector('[data-row-card]')) first.classList.add('card-row-placeholder-item');
      activeTarget = null;
    };
    requestAnimationFrame(function () { requestAnimationFrame(done); });
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

  function install() {
    if (document.documentElement.dataset.relphiDrawingBoardInteractionFixes === 'true') return;
    document.documentElement.dataset.relphiDrawingBoardInteractionFixes = 'true';

    const style = document.createElement('style');
    style.id = 'relphi-drawing-board-interaction-fixes-style';
    style.textContent = [
      '#shortListPanel{overflow:visible!important}',
      '#shortListPanel .card-row-drawing-board,#shortListPanel .card-row-more-options,#shortListPanel .card-row-composer,#shortListPanel .card-row-control-block,#shortListPanel .board-options-body{overflow:visible!important}',
      '#shortListPanel .card-row-icon-toolbar,#shortListPanel .card-row-workspace-toolbar,#shortListPanel .board-options-tabs,#shortListPanel .board-arrange-flyout,#shortListPanel .board-history-menu{position:relative!important;z-index:10020!important;isolation:isolate}',
      '#shortListPanel .board-arrange-flyout .card-row-control-block,#shortListPanel .card-row-more-options[open],#shortListPanel .card-row-more-options[open] .card-row-composer{position:relative!important;z-index:10030!important}',
      '#shortListPanel .card-row-workspace,#shortListPanel .short-list-row.card-row-board{position:relative!important;z-index:1!important}',
      '#shortListPanel .card-row-item,#shortListPanel .card-row-board-grid{z-index:auto!important}',
      '#shortListPanel .card-row-position-label,#shortListPanel .row-sticker-prefab-controls{position:relative!important;z-index:10040!important;overflow:visible!important}',
      '#shortListPanel #rowPositionLabels{position:relative!important;z-index:10041!important}',
      '#shortListPanel .relphi-targeted-draw-pending{outline:4px solid rgba(220,31,24,.38)!important;outline-offset:4px!important;cursor:wait!important}'
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
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
