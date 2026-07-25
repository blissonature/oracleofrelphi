// Focused Drawing Board interactions: direct undo/redo, targeted draws, full card detail links, and mobile-safe zoom.
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

  function restoreToolbarPlacement(panel) {
    const drawer = panel.querySelector('.card-row-drawing-board');
    const workspace = panel.querySelector('.card-row-workspace');
    const headerToolbar = panel.querySelector('.card-row-icon-toolbar');
    const workspaceToolbar = panel.querySelector('.card-row-workspace-toolbar');
    const layer = drawer?.querySelector(':scope > .relphi-board-ui-layer');

    if (drawer && headerToolbar && headerToolbar.parentElement === layer) {
      drawer.insertBefore(headerToolbar, workspace || layer);
    }
    if (workspace && workspaceToolbar && workspaceToolbar.parentElement === layer) {
      workspace.insertBefore(workspaceToolbar, workspace.firstChild);
    }
    layer?.remove();
  }

  function iconSvg(kind) {
    const path = kind === 'undo'
      ? '<path d="M9 7 4 12l5 5"/><path d="M4 12h9a7 7 0 0 1 7 7"/>'
      : '<path d="m15 7 5 5-5 5"/><path d="M20 12h-9a7 7 0 0 0-7 7"/>';
    return '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>';
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
    [[panel.querySelector('#undoShortList'), 'undo', 'Undo'], [panel.querySelector('#redoShortList'), 'redo', 'Redo']].forEach(function (entry) {
      const button = entry[0];
      if (!button) return;
      button.classList.add('board-history-icon');
      button.innerHTML = iconSvg(entry[1]);
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
    if (window.RelphiDrawingBoardPrefabsBridge?.getState()?.designMode) return;
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

  function keepBoardCloseAfterPlaceholder(panel) {
    const add = panel.querySelector('#addCardPlaceholder');
    if (!add || add.dataset.relphiCloseOptions === 'true') return;
    add.dataset.relphiCloseOptions = 'true';
    add.addEventListener('click', function () {
      window.setTimeout(function () {
        const options = panel.querySelector('.card-row-more-options');
        if (options) options.open = false;
        panel.querySelector('.card-row-workspace')?.scrollIntoView({ behavior:'smooth', block:'start' });
      }, 80);
    });
  }

  function installPinchZoom(panel) {
    const workspace = panel.querySelector('.card-row-workspace');
    if (!workspace || workspace.dataset.relphiPinchZoom === 'true') return;
    workspace.dataset.relphiPinchZoom = 'true';

    let pinching = false;
    let startDistance = 0;
    let startZoom = 100;
    let disabledCards = [];

    function zoomInput() {
      return workspace.querySelector('.card-row-workspace-toolbar input[type="range"]') ||
        panel.querySelector('.card-row-workspace-toolbar input[type="range"]');
    }
    function distance(touches) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.hypot(dx, dy);
    }
    function begin(event) {
      if (event.touches.length !== 2) return;
      const input = zoomInput();
      if (!input) return;
      pinching = true;
      startDistance = distance(event.touches);
      startZoom = Number(input.value) || 100;
      disabledCards = Array.from(workspace.querySelectorAll('[draggable="true"], .card-row-item [data-row-card]')).map(function (node) {
        const wasDraggable = node.draggable;
        node.draggable = false;
        return [node, wasDraggable];
      });
      workspace.classList.add('relphi-is-pinching');
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    function move(event) {
      if (!pinching || event.touches.length !== 2) return;
      const input = zoomInput();
      if (!input || !startDistance) return;
      const min = Number(input.min || 25);
      const max = Number(input.max || 250);
      const next = Math.max(min, Math.min(max, startZoom * (distance(event.touches) / startDistance)));
      input.value = String(next);
      input.dispatchEvent(new Event('input', { bubbles:true }));
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    function end(event) {
      if (!pinching || event.touches.length > 1) return;
      pinching = false;
      disabledCards.forEach(function (entry) {
        if (entry[0].isConnected) entry[0].draggable = entry[1];
      });
      disabledCards = [];
      workspace.classList.remove('relphi-is-pinching');
      zoomInput()?.dispatchEvent(new Event('change', { bubbles:true }));
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    workspace.addEventListener('touchstart', begin, { capture:true, passive:false });
    workspace.addEventListener('touchmove', move, { capture:true, passive:false });
    workspace.addEventListener('touchend', end, { capture:true, passive:false });
    workspace.addEventListener('touchcancel', end, { capture:true, passive:false });
  }

  function enhance() {
    const panel = root();
    if (!panel || panel.hidden) return;
    restoreToolbarPlacement(panel);
    directHistoryControls(panel);
    installPositionStickerEditor(panel);
    keepBoardCloseAfterPlaceholder(panel);
    installPinchZoom(panel);
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
      '#shortListPanel .relphi-board-ui-layer{display:none!important}',
      '#shortListPanel .card-row-workspace{position:relative!important;isolation:isolate!important}',
      '#shortListPanel .card-row-workspace-toolbar{position:relative!important;z-index:1000!important;background:#fff!important;opacity:1!important}',
      '#shortListPanel .card-row-board,#shortListPanel .card-row-board-grid,#shortListPanel .card-row-item{position:relative!important;z-index:1!important}',
      '#shortListPanel .board-header-group--history{display:inline-flex!important;align-items:center!important;gap:.4rem!important;min-width:5.4rem!important}',
      '#shortListPanel .board-history-icon{appearance:none!important;display:inline-grid!important;place-items:center!important;width:2.6rem!important;min-width:2.6rem!important;max-width:2.6rem!important;height:2.6rem!important;min-height:2.6rem!important;padding:0!important;border:2px solid #171412!important;border-radius:9px!important;background:#fff!important;color:#171412!important;box-shadow:none!important;opacity:1!important}',
      'html body #shortListPanel .board-history-icon:disabled{opacity:.4!important;border:1px solid rgba(17,17,17,.28)!important;background:#fffdf8!important;color:rgba(17,17,17,.48)!important;box-shadow:none!important;cursor:default!important}',
      '#shortListPanel .board-history-icon svg{display:block!important;width:1.4rem!important;height:1.4rem!important}',
      'html body #shortListPanel #drawRandomRowCard,html body #shortListPanel #drawRandomRowCard:hover,html body #shortListPanel #drawRandomRowCard:focus,html body #shortListPanel #drawRandomRowCard:active{appearance:none!important;-webkit-appearance:none!important;border:2px solid #b81712!important;background:#dc1f18!important;background-color:#dc1f18!important;background-image:none!important;color:#fff!important;box-shadow:none!important}',
      'html body #shortListPanel .card-row-workspace-toolbar input[type="range"],html body #shortListPanel .card-row-workspace-toolbar meter,html body #shortListPanel .card-row-workspace-toolbar progress{accent-color:#dc1f18!important;color:#dc1f18!important}',
      'html body #shortListPanel .card-row-workspace-toolbar input[type="range"]::-webkit-slider-runnable-track{background:#d8cec5!important}',
      'html body #shortListPanel .card-row-workspace-toolbar input[type="range"]::-webkit-slider-thumb{background:#fff!important;border:2px solid #171412!important}',
      'html body #shortListPanel .card-row-workspace-toolbar meter::-webkit-meter-optimum-value,html body #shortListPanel .card-row-workspace-toolbar progress::-webkit-progress-value{background:#dc1f18!important}',
      'html body #shortListPanel .card-row-workspace-toolbar meter::-webkit-meter-bar,html body #shortListPanel .card-row-workspace-toolbar progress::-webkit-progress-bar{background:#d8cec5!important}',
      'html body #shortListPanel .card-row-workspace-toolbar input[type="range"]::-moz-range-track{background:#d8cec5!important}',
      'html body #shortListPanel .card-row-workspace-toolbar input[type="range"]::-moz-range-progress{background:#dc1f18!important}',
      'html body #shortListPanel .card-row-workspace-toolbar input[type="range"]::-moz-range-thumb{background:#fff!important;border:2px solid #171412!important}',
      '#shortListPanel .board-arrange-flyout{position:relative!important;z-index:1100!important;max-width:100%!important}',
      '#shortListPanel .board-arrange-flyout .card-row-control-block{position:static!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important;background:#fff!important;opacity:1!important;overflow:visible!important}',
      '#shortListPanel .board-arrange-flyout .board-options-body{background:#fff!important;opacity:1!important}',
      '#shortListPanel .relphi-card-title-link{cursor:pointer!important;text-decoration:none!important;border-radius:.25rem!important;transition:background-color .15s ease,color .15s ease!important}',
      '#shortListPanel .relphi-card-title-link:hover,#shortListPanel .relphi-card-title-link:focus-visible{background:#fff1ee!important;color:#b81712!important;outline:none!important}',
      '#shortListPanel .relphi-position-prefab-select{display:block!important;width:100%!important;max-width:100%!important;min-height:2.45rem!important;margin-top:.35rem!important;border:1px solid #bdb3aa!important;border-radius:7px!important;background:#fff!important;color:#171412!important;padding:.45rem .6rem!important;box-sizing:border-box!important}',
      '#shortListPanel .relphi-clickable-placeholder,#shortListPanel .relphi-clickable-placeholder .card-row-drop-card,#shortListPanel .relphi-clickable-placeholder .card-row-card{cursor:pointer!important}',
      '#shortListPanel .relphi-targeted-draw-pending{outline:4px solid rgba(220,31,24,.38)!important;outline-offset:4px!important;cursor:wait!important}',
      '#shortListPanel .card-row-workspace.relphi-is-pinching,#shortListPanel .card-row-workspace.relphi-is-pinching *{touch-action:none!important;user-select:none!important;-webkit-user-select:none!important}',
      '@media(max-width:700px){#shortListPanel .board-arrange-flyout{display:flex!important;flex-wrap:wrap!important;width:100%!important}#shortListPanel .board-arrange-flyout>.board-arrange-trigger{flex:0 0 auto!important}#shortListPanel .board-arrange-flyout>.card-row-control-block{flex:1 0 100%!important;margin-top:.35rem!important;max-height:none!important;overflow:visible!important;border:1px solid #d8cec5!important;border-radius:10px!important;box-shadow:none!important}#shortListPanel .board-arrange-flyout .board-options-body{display:grid!important;grid-template-columns:1fr!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important}}'
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
