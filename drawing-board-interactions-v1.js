// Drawing Board interactions. This owner handles input behavior only; it never
// assigns position, left/top, translate, transform, z-index, or spread geometry.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiDrawingBoardInteractionsV2) return;
  window.__relphiDrawingBoardInteractionsV2 = true;

  const PANEL = '#shortListPanel';
  let activeTarget = false;
  function root() { return document.querySelector(PANEL); }
  function isEmptyItem(item) {
    return !!item && !item.querySelector('[data-row-card]') && item.classList.contains('card-row-placeholder-item');
  }
  function bridge() { return window.RelphiDrawingBoardPrefabsBridge || null; }

  function historyIcons(panel) {
    const svg = kind => kind === 'undo'
      ? '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M9 7 4 12l5 5"></path><path d="M4 12h9a7 7 0 0 1 7 7"></path></svg>'
      : '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="m15 7 5 5-5 5"></path><path d="M20 12h-9a7 7 0 0 0-7 7"></path></svg>';
    [['undoShortList','undo','Undo'],['redoShortList','redo','Redo']].forEach(([id,kind,label]) => {
      const button = panel.querySelector('#' + id);
      if (!button) return;
      button.classList.add('board-history-icon');
      if (button.dataset.relphiHistoryIcon !== kind) {
        button.dataset.relphiHistoryIcon = kind;
        button.innerHTML = svg(kind);
      }
      button.setAttribute('aria-label',label);
      button.title = label;
    });
  }

  function drawInto(item) {
    const panel = root();
    if (!panel || activeTarget || !isEmptyItem(item) || bridge()?.getState?.()?.designMode) return;
    const draw = panel.querySelector('#drawRandomRowCard');
    if (!draw || draw.disabled) return;
    const targetIndex = Number(item.dataset.rowIndex);
    const drawnIndex = panel.querySelectorAll('.card-row-board [data-row-card]').length;
    if (!Number.isInteger(targetIndex) || targetIndex < 0) return;
    activeTarget = true;
    window.RelphiDrawingBoardSetPositionStickers?.(true);
    draw.click();
    if (targetIndex !== drawnIndex) bridge()?.swapPositionSlots?.(drawnIndex,targetIndex);
    activeTarget = false;
  }

  function bindTargetedDraw(panel) {
    panel.querySelectorAll('.card-row-board>.card-row-item').forEach(item => {
      if (!isEmptyItem(item) || item.dataset.relphiTargetDrawBound === 'true') return;
      item.dataset.relphiTargetDrawBound = 'true';
      item.classList.add('relphi-clickable-placeholder');
      item.title = 'Draw a card into this position';
      item.addEventListener('click', event => {
        if (event.target.closest('input,textarea,select,label,a,button,.card-row-position-panel,[data-row-transform-handle]')) return;
        event.preventDefault();
        event.stopPropagation();
        drawInto(item);
      });
    });
  }

  function bindCardLinks(panel) {
    panel.querySelectorAll('.card-row-board .or-card-title-banner').forEach(title => {
      if (title.dataset.relphiLedgerLink === 'true') return;
      title.dataset.relphiLedgerLink = 'true';
      title.classList.add('relphi-card-title-link');
      title.setAttribute('role','button');
      title.tabIndex = 0;
      const open = event => {
        if (event.type === 'keydown' && !['Enter',' '].includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();
        const card = title.closest('[data-row-card]');
        const id = card?.dataset.rowCard || '';
        const command = document.getElementById('oracleCommand');
        const run = document.getElementById('runCommand');
        if (command && run) {
          command.value = title.textContent.trim() || id.replace(/_/g,' ');
          command.dispatchEvent(new Event('input',{bubbles:true}));
          run.click();
          window.setTimeout(() => document.getElementById('cardDetail')?.scrollIntoView({behavior:'smooth',block:'start'}),50);
        }
      };
      title.addEventListener('click',open);
      title.addEventListener('keydown',open);
    });
  }

  function bindPinchZoom(panel) {
    const workspace = panel.querySelector('.card-row-workspace');
    if (!workspace || workspace.dataset.relphiPinchZoomV2 === 'true') return;
    workspace.dataset.relphiPinchZoomV2 = 'true';
    let pinching = false, startDistance = 0, startZoom = 1;
    const input = () => panel.querySelector('#rowZoom');
    const distance = touches => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    workspace.addEventListener('touchstart', event => {
      if (event.touches.length !== 2 || !input()) return;
      pinching = true;
      startDistance = distance(event.touches);
      startZoom = Number(input().value) || 1;
      event.preventDefault();
    },{passive:false});
    workspace.addEventListener('touchmove', event => {
      if (!pinching || event.touches.length !== 2 || !startDistance || !input()) return;
      const control = input();
      const next = Math.max(Number(control.min)||.35,Math.min(Number(control.max)||2.4,startZoom * distance(event.touches) / startDistance));
      control.value = String(next);
      control.dispatchEvent(new Event('input',{bubbles:true}));
      event.preventDefault();
    },{passive:false});
    const finish = event => {
      if (!pinching || event.touches?.length > 1) return;
      pinching = false;
      input()?.dispatchEvent(new Event('change',{bubbles:true}));
    };
    workspace.addEventListener('touchend',finish,{passive:true});
    workspace.addEventListener('touchcancel',finish,{passive:true});
  }

  function enhance() {
    const panel = root();
    if (!panel || panel.hidden) return;
    historyIcons(panel);
    bindTargetedDraw(panel);
    bindCardLinks(panel);
    bindPinchZoom(panel);
  }

  function installStyle() {
    if (document.getElementById('relphi-drawing-board-interactions-style-v2')) return;
    const style = document.createElement('style');
    style.id = 'relphi-drawing-board-interactions-style-v2';
    style.textContent = `
      #shortListPanel .relphi-clickable-placeholder{cursor:pointer!important}
      #shortListPanel .relphi-card-title-link{cursor:pointer!important;text-decoration-thickness:1px}
      #shortListPanel .board-history-icon{appearance:none!important;display:inline-grid!important;place-items:center!important;width:2.6rem!important;min-width:2.6rem!important;height:2.6rem!important;padding:0!important;border:2px solid #171412!important;border-radius:9px!important;background:#fff!important;color:#171412!important;box-shadow:none!important}
      #shortListPanel .board-history-icon:disabled{opacity:.4!important;border:1px solid rgba(17,17,17,.28)!important;color:rgba(17,17,17,.48)!important}
      html body #shortListPanel #drawRandomRowCard{appearance:none!important;border:2px solid #b81712!important;background:#dc1f18!important;color:#fff!important;box-shadow:none!important}
      html body #shortListPanel .card-row-workspace-toolbar input[type="range"]{accent-color:#dc1f18!important}
    `;
    document.head.appendChild(style);
  }

  installStyle();
  document.addEventListener('relphi:drawing-board-rendered',enhance);
  new MutationObserver(records => {
    if (records.some(record => record.type === 'childList' && record.addedNodes.length)) requestAnimationFrame(enhance);
  }).observe(document.documentElement,{childList:true,subtree:true});
  enhance();
})();
