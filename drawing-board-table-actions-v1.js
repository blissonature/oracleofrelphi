// Development branch: card-back placeholders, targeted draws, and table-level draw/history actions.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;

  const PANEL_ID = 'shortListPanel';
  const ACTION_BAR_CLASS = 'relphi-board-action-bar';
  const CARD_BACK_CLASS = 'relphi-card-back-button';
  let scheduled = false;
  let targetedDrawBusy = false;

  function panel() { return document.getElementById(PANEL_ID); }

  function placeholderItems(root) {
    return Array.from(root.querySelectorAll('.card-row-placeholder-item, .card-row-item')).filter(function (item) {
      return !item.querySelector('[data-row-card]') && (item.classList.contains('card-row-placeholder-item') || /card placeholder/i.test(item.textContent || ''));
    });
  }

  function positionLabel(item, index) {
    return item.querySelector('.card-row-position-editor, .card-row-position-label, [data-position-label]')?.textContent.trim() || 'Position ' + (index + 1);
  }

  function decoratePlaceholders(root) {
    placeholderItems(root).forEach(function (item, index) {
      item.classList.add('relphi-card-back-slot');
      let button = item.querySelector('.' + CARD_BACK_CLASS);
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = CARD_BACK_CLASS;
        button.innerHTML = '<span class="relphi-card-back-art" aria-hidden="true"><span class="relphi-card-back-frame"><img src="logo.png" alt=""></span></span><span class="relphi-card-back-label">Draw here</span>';
        const visual = item.querySelector('.card-row-drop-card, .card-row-card, .or-card, .relphi-surface') || item;
        visual.appendChild(button);
        button.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
          drawIntoSlot(item);
        });
      }
      const label = positionLabel(item, index);
      button.setAttribute('aria-label', 'Draw a card into ' + label);
      button.title = 'Draw a card into ' + label;
    });
  }

  function currentCardKeys(root) {
    return new Set(Array.from(root.querySelectorAll('[data-row-card]')).map(function (card) {
      return card.dataset.rowCard || card.getAttribute('data-row-card') || '';
    }).filter(Boolean));
  }

  function swapNodes(a, b) {
    if (!a || !b || a === b || !a.parentNode || !b.parentNode) return;
    const marker = document.createComment('relphi-target-slot');
    a.parentNode.insertBefore(marker, a);
    b.parentNode.insertBefore(a, b);
    marker.parentNode.insertBefore(b, marker);
    marker.remove();
  }

  function waitForTargetedCard(root, target, beforeKeys) {
    const started = Date.now();
    const observer = new MutationObserver(check);
    observer.observe(root, { childList:true, subtree:true, attributes:true, attributeFilter:['data-row-card','class'] });

    function finish() {
      observer.disconnect();
      targetedDrawBusy = false;
      target?.classList.remove('relphi-awaiting-draw');
      schedule();
    }

    function check() {
      if (!target?.isConnected) {
        finish();
        return;
      }
      if (target.querySelector('[data-row-card]')) {
        finish();
        return;
      }
      const newCard = Array.from(root.querySelectorAll('[data-row-card]')).find(function (card) {
        const key = card.dataset.rowCard || card.getAttribute('data-row-card') || '';
        return key && !beforeKeys.has(key);
      });
      if (newCard) {
        const newItem = newCard.closest('.card-row-item') || newCard.parentElement;
        if (newItem && target.isConnected && newItem !== target) swapNodes(newItem, target);
        finish();
        return;
      }
      if (Date.now() - started > 3500) finish();
    }

    check();
    setTimeout(check, 3600);
  }

  function drawIntoSlot(target) {
    if (targetedDrawBusy) return;
    const root = panel();
    const draw = root?.querySelector('#drawRandomRowCard');
    if (!root || !draw || draw.disabled) return;
    targetedDrawBusy = true;
    target.classList.add('relphi-awaiting-draw');
    const beforeKeys = currentCardKeys(root);
    waitForTargetedCard(root, target, beforeKeys);
    draw.click();
  }

  function actionButton(root, id) { return root.querySelector('#' + id); }

  function ensureActionBar(root) {
    const boardShell = root.querySelector('.card-row-drawing-board') || root.querySelector('.card-row-workspace')?.parentElement || root;
    const workspace = root.querySelector('.card-row-workspace') || root.querySelector('.short-list-row.card-row-board');
    if (!boardShell || !workspace) return;

    let bar = root.querySelector('.' + ACTION_BAR_CLASS);
    if (!bar) {
      bar = document.createElement('div');
      bar.className = ACTION_BAR_CLASS;
      bar.setAttribute('role', 'toolbar');
      bar.setAttribute('aria-label', 'Drawing Board actions');
      workspace.insertAdjacentElement('beforebegin', bar);
    }

    const draw = actionButton(root, 'drawRandomRowCard');
    const undo = actionButton(root, 'undoShortList');
    const redo = actionButton(root, 'redoShortList');

    if (draw && draw.parentElement !== bar) {
      draw.classList.add('relphi-board-draw-action');
      draw.textContent = 'Draw';
      bar.appendChild(draw);
    }
    if (undo && undo.parentElement !== bar) {
      undo.classList.add('relphi-board-history-icon');
      undo.textContent = '↶';
      undo.setAttribute('aria-label', 'Undo');
      undo.title = 'Undo';
      bar.appendChild(undo);
    }
    if (redo && redo.parentElement !== bar) {
      redo.classList.add('relphi-board-history-icon');
      redo.textContent = '↷';
      redo.setAttribute('aria-label', 'Redo');
      redo.title = 'Redo';
      bar.appendChild(redo);
    }

    root.querySelectorAll('.board-history-toggle').forEach(function (node) { node.remove(); });
    root.querySelectorAll('.board-history-menu').forEach(function (menu) {
      if (!menu.querySelector('#undoShortList,#redoShortList')) menu.remove();
    });
    root.querySelectorAll('.board-header-group--history').forEach(function (group) {
      if (!group.querySelector('#undoShortList,#redoShortList')) group.remove();
    });
  }

  function enhance() {
    scheduled = false;
    const root = panel();
    if (!root || root.hidden) return;
    ensureActionBar(root);
    decoratePlaceholders(root);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(enhance);
  }

  function start() {
    if (document.documentElement.dataset.relphiBoardTableActions === 'true') return;
    document.documentElement.dataset.relphiBoardTableActions = 'true';
    const style = document.createElement('style');
    style.textContent = `
#shortListPanel .${ACTION_BAR_CLASS}{display:flex;align-items:center;justify-content:center;gap:.5rem;flex-wrap:wrap;margin:.55rem 0 .65rem;padding:.45rem .55rem;border:1px solid rgba(220,31,24,.18);border-radius:999px;background:rgba(255,253,248,.94);box-shadow:0 8px 24px rgba(31,23,18,.08)}
#shortListPanel .${ACTION_BAR_CLASS} button{min-height:2.35rem!important;margin:0!important;border-radius:999px!important;font-weight:850!important}
#shortListPanel .relphi-board-draw-action{min-width:7rem!important;padding:.5rem 1.15rem!important;border-color:#dc1f18!important;background:#dc1f18!important;color:#fff!important}
#shortListPanel .relphi-board-history-icon{width:2.4rem!important;min-width:2.4rem!important;padding:.35rem!important;border:1px solid #b9afa7!important;background:#fff!important;color:#171412!important;font-size:1.25rem!important;line-height:1!important}
#shortListPanel .relphi-card-back-slot{position:relative}
#shortListPanel .relphi-card-back-slot .card-row-drop-card,#shortListPanel .relphi-card-back-slot .card-row-card{position:relative;min-height:11rem}
#shortListPanel .${CARD_BACK_CLASS}{display:grid!important;place-items:center!important;gap:.45rem!important;width:min(100%,10rem)!important;min-height:10rem!important;margin:auto!important;padding:.55rem!important;border:0!important;border-radius:14px!important;background:transparent!important;color:#fff!important;box-shadow:none!important;cursor:pointer!important}
#shortListPanel .relphi-card-back-art{display:block;width:100%;aspect-ratio:320/554;padding:.42rem;border-radius:12px;background:linear-gradient(145deg,#71120f,#dc1f18 48%,#8d1712);box-shadow:0 8px 18px rgba(28,13,10,.24),inset 0 0 0 2px rgba(255,255,255,.88),inset 0 0 0 7px rgba(255,218,185,.33)}
#shortListPanel .relphi-card-back-frame{display:grid;place-items:center;width:100%;height:100%;border:1px solid rgba(255,244,230,.8);border-radius:8px;background:repeating-linear-gradient(45deg,rgba(255,255,255,.055) 0 6px,rgba(0,0,0,.035) 6px 12px)}
#shortListPanel .relphi-card-back-frame img{width:46%!important;height:auto!important;filter:drop-shadow(0 2px 4px rgba(0,0,0,.32))}
#shortListPanel .relphi-card-back-label{display:inline-block;padding:.28rem .55rem;border-radius:999px;background:#171412;color:#fff;font-size:.72rem;font-weight:850;letter-spacing:.04em}
#shortListPanel .relphi-card-back-slot.relphi-awaiting-draw .relphi-card-back-art{animation:relphiCardBackPulse .8s ease-in-out infinite alternate}
#shortListPanel .relphi-card-back-slot>:not(.${CARD_BACK_CLASS}){ }
@keyframes relphiCardBackPulse{to{transform:translateY(-2px);box-shadow:0 12px 24px rgba(220,31,24,.3),0 0 0 4px rgba(220,31,24,.18),inset 0 0 0 2px rgba(255,255,255,.9),inset 0 0 0 7px rgba(255,218,185,.38)}}
@media(max-width:600px){#shortListPanel .${ACTION_BAR_CLASS}{position:sticky;top:.4rem;z-index:15;justify-content:flex-start;width:max-content;max-width:calc(100% - .5rem);margin-left:auto;margin-right:auto}#shortListPanel .${CARD_BACK_CLASS}{width:min(100%,8rem)!important;min-height:8rem!important}}
`;
    document.head.appendChild(style);
    schedule();
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['hidden','class'] });
    window.addEventListener('pageshow', schedule);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
