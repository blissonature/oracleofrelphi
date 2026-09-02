// Capture Drawing Board card activation before the older title-only detail handler.
// Also keeps the corrected 11-card Celtic Cross geometry stable when zoom rerenders the board.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname) && window.__relphiTarotPreviewDocument !== true) return;
  if (window.__relphiDrawingBoardCardClickGuardV1) return;
  window.__relphiDrawingBoardCardClickGuardV1 = true;

  const PANEL = '#shortListPanel';
  const normalize = value => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  function identity(card) {
    return {
      id:String(card?.dataset?.rowCard || ''),
      title:card?.querySelector('.or-card-title-banner')?.textContent?.trim() || card?.getAttribute('aria-label') || ''
    };
  }
  function findResult(value) {
    const list = document.getElementById('cardList');
    if (!list) return null;
    const wanted = normalize(value.title);
    return Array.from(list.querySelectorAll('button,[role="listitem"],li,article,[data-card-id],[data-card]')).find(node => {
      const id = node.getAttribute('data-card-id') || node.getAttribute('data-card') || node.getAttribute('data-id') || '';
      return (value.id && id === value.id) || (wanted && normalize(node.textContent).includes(wanted));
    }) || null;
  }
  function go(value) {
    (document.getElementById('showAllCards') || document.getElementById('landingShowLedger'))?.click();
    const started = Date.now();
    let searched = false;
    (function locate() {
      const match = findResult(value);
      if (match) {
        const target = match.closest('button,[role="button"],[role="listitem"],li,article') || match;
        document.getElementById('browsePanel')?.removeAttribute('hidden');
        document.querySelectorAll('.relphi-board-ledger-target').forEach(node => node.classList.remove('relphi-board-ledger-target'));
        target.classList.add('relphi-board-ledger-target');
        target.scrollIntoView({behavior:'smooth',block:'center'});
        window.setTimeout(() => target.classList.remove('relphi-board-ledger-target'), 2200);
        return;
      }
      if (!searched && Date.now() - started > 180) {
        const command = document.getElementById('oracleCommand');
        const run = document.getElementById('runCommand');
        if (command && run && value.title) {
          searched = true;
          command.value = value.title;
          command.dispatchEvent(new Event('input', {bubbles:true}));
          run.click();
        }
      }
      if (Date.now() - started < 2200) requestAnimationFrame(locate);
    })();
  }
  function cardFor(event) {
    return event.target?.closest?.(PANEL + ' .card-row-board [data-row-card]') || null;
  }

  function correctCelticEleven() {
    const root = document.querySelector(PANEL);
    const state = window.RelphiDrawingBoardPrefabsBridge?.getState?.();
    if (!root || state?.activeLayout?.id !== 'celtic-cross-11' || state.centerOpen) return;
    const board = root.querySelector('.card-row-board');
    if (!board) return;
    [
      {index:0,left:208,top:262,rotation:0,scale:.45,z:10},
      {index:1,left:225,top:248,rotation:0,scale:.45,z:20},
      {index:2,left:225,top:248,rotation:90,scale:.45,z:30}
    ].forEach(value => {
      const item = board.querySelector('[data-row-index="' + value.index + '"]');
      if (!item) return;
      item.style.left = value.left + 'px';
      item.style.top = value.top + 'px';
      item.style.zIndex = String(value.z);
      item.style.setProperty('--row-card-scale', String(value.scale));
      item.style.setProperty('--row-card-rotation', value.rotation + 'deg');
      item.querySelector('[data-row-card]')?.style.setProperty('transform-origin','50% 50%','important');
    });
  }
  function restoreCelticAfterZoom() {
    requestAnimationFrame(() => requestAnimationFrame(correctCelticEleven));
  }

  window.addEventListener('click', event => {
    const card = cardFor(event);
    if (!card) return;
    if (event.target.closest('input,select,textarea,button,a,[contenteditable="true"],[data-remove-card]')) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    go(identity(card));
  }, true);
  window.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = cardFor(event);
    if (!card) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    go(identity(card));
  }, true);

  document.addEventListener('input', event => {
    if (event.target?.id === 'rowZoom') restoreCelticAfterZoom();
  }, true);
  document.addEventListener('change', event => {
    if (event.target?.id === 'rowZoom') restoreCelticAfterZoom();
  }, true);
  document.addEventListener('wheel', event => {
    if (!event.target?.closest?.(PANEL + ' .card-row-workspace')) return;
    restoreCelticAfterZoom();
  }, {capture:true,passive:true});
  document.addEventListener('relphi:drawing-board-rendered', restoreCelticAfterZoom);
  document.addEventListener('relphi:drawing-board-center-view', restoreCelticAfterZoom);
  correctCelticEleven();
})();
