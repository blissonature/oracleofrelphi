// Focused Drawing Board interactions: direct undo/redo, targeted draws, full card detail links, and stable foreground controls.
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

  function ensureForegroundLayer(panel) {
    const drawer = panel.querySelector('.card-row-drawing-board');
    if (!drawer) return;
    let layer = drawer.querySelector(':scope > .relphi-board-ui-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'relphi-board-ui-layer';
      drawer.insertBefore(layer, drawer.firstChild);
    }
    const headerToolbar = panel.querySelector('.card-row-icon-toolbar');
    const workspaceToolbar = panel.querySelector('.card-row-workspace-toolbar');
    [headerToolbar, workspaceToolbar].forEach(function (toolbar) {
      if (toolbar && toolbar.parentElement !== layer) layer.appendChild(toolbar);
    });
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

  function installPositionStickerEditor(panel) {
    const field = panel.querySelector('#rowPositionLabels');
    if (!field || field.dataset.relphiStickerEditor === 'true') return;
    field.dataset.relphiStickerEditor = 'true';

    let userEditing = false;
    field.addEventListener('focus', function () { userEditing = true; });
    field.addEventListener('blur', function () { window.setTimeout(function () { userEditing = false; }, 150); });
    field.addEventListener('input', function (event) {
      if (event.isTrusted) {
        userEditing = true;
        field.dataset.relphiManualValue = field.value;
      } else if (userEditing && /^Position #\d+(?:\s*,\s*Position #\d+)*$/i.test(field.value.trim())) {
        field.value = field.dataset.relphiManualValue || '';
      }
    });

    let select = panel.querySelector('#rowPositionPrefabSelect');
    if (!select) {
      select = document.createElement('select');
      select.id = 'rowPositionPrefabSelect';
      select.className = 'relphi-position-prefab-select';
      select.setAttribute('aria-label', 'Choose a position-sticker prefab');
      field.insertAdjacentElement('afterend', select);
      select.addEventListener('change', function () {
        if (!select.value) return;
        field.value = select.value;
        field.dataset.relphiManualValue = select.value;
        field.dispatchEvent(new Event('input', { bubbles:true }));
        field.dispatchEvent(new Event('change', { bubbles:true }));
        select.selectedIndex = 0;
      });
    }

    const datalistId = field.getAttribute('list');
    const datalist = datalistId ? document.getElementById(datalistId) : panel.querySelector('#rowStickerPresetList');
    const values = datalist ? Array.from(datalist.querySelectorAll('option')).map(function (option) {
      return { value: option.value, label: option.label || option.value };
    }).filter(function (item) { return item.value; }) : [];
    const signature = JSON.stringify(values);
    if (select.dataset.signature !== signature) {
      select.dataset.signature = signature;
      select.innerHTML = '<option value="">Choose a position-sticker prefab…</option>' + values.map(function (item) {
        return '<option value="' + item.value.replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '">' + item.label.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</option>';
      }).join('');
    }
  }

  function enhance() {
    const panel = root();
    if (!panel || panel.hidden) return;
    ensureForegroundLayer(panel);
    directHistoryControls(panel);
    installPositionStickerEditor(panel);
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
      '#shortListPanel .card-row-drawing-board{position:relative!important;overflow:visible!important;isolation:isolate!important}',
      '#shortListPanel .relphi-board-ui-layer{position:sticky!important;top:.35rem!important;z-index:2147483000!important;display:flex!important;flex-wrap:wrap!important;align-items:center!important;justify-content:space-between!important;gap:.45rem!important;width:100%!important;overflow:visible!important;pointer-events:none!important;transform:none!important}',
      '#shortListPanel .relphi-board-ui-layer>.card-row-icon-toolbar,#shortListPanel .relphi-board-ui-layer>.card-row-workspace-toolbar{position:relative!important;z-index:2147483001!important;overflow:visible!important;pointer-events:auto!important;transform:none!important;isolation:isolate!important}',
      '#shortListPanel .card-row-workspace,#shortListPanel .short-list-row.card-row-board,#shortListPanel .card-row-board-grid,#shortListPanel .card-row-item,#shortListPanel .or-card,#shortListPanel .or-card-art{z-index:0!important}',
      '#shortListPanel .board-arrange-flyout,#shortListPanel .board-arrange-flyout .card-row-control-block,#shortListPanel .card-row-more-options[open],#shortListPanel .card-row-more-options[open] .card-row-composer{position:relative!important;z-index:2147483002!important;overflow:visible!important}',
      '#shortListPanel .board-header-group--history{display:inline-flex!important;align-items:center!important;gap:.4rem!important;min-width:5.4rem!important}',
      '#shortListPanel .board-history-icon{appearance:none!important;display:inline-grid!important;place-items:center!important;width:2.5rem!important;min-width:2.5rem!important;max-width:2.5rem!important;height:2.5rem!important;min-height:2.5rem!important;padding:0!important;border:2px solid #171412!important;border-radius:9px!important;background:#fff!important;color:#171412!important;box-shadow:0 2px 5px rgba(0,0,0,.12)!important;font-size:1.45rem!important;font-weight:900!important;line-height:1!important;opacity:1!important}',
      '#shortListPanel #drawRandomRowCard{border-color:#dc1f18!important;background:#dc1f18!important;color:#fff!important;box-shadow:none!important}',
      '#shortListPanel .card-row-position-label,#shortListPanel .row-sticker-prefab-controls{position:relative!important;z-index:20!important;overflow:visible!important}',
      '#shortListPanel #rowPositionLabels,#shortListPanel .relphi-position-prefab-select{display:block!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important;margin-top:.35rem!important;position:relative!important;z-index:21!important}',
      '#shortListPanel .relphi-position-prefab-select{min-height:2.45rem!important;border:1px solid #bdb3aa!important;border-radius:7px!important;background:#fff!important;color:#171412!important;padding:.45rem .6rem!important}',
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