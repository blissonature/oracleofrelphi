// Transactional Drawing Board Options. Draft edits never mutate the board.
// OK hands one complete draft to the state-level layout controller; Cancel does
// nothing to board state; Reset delegates one authoritative blank-board action.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiDrawingBoardTransactionalOptionsV2) return;
  window.__relphiDrawingBoardTransactionalOptionsV2 = true;
  window.__relphiDrawingBoardTransactionalOptionsV1 = true; // compatibility filename

  const PANEL = '#shortListPanel';
  const CORE = '#relphiSpreadTemplateSelect,#rowPositionLabels,#rowDrawScope,#rowPositionStickersQuick,#rowAllowReversalsQuick,#rowAllowRepeats,.relphi-label-builder [data-relphi-label-input]';
  let session = null;
  let scheduled = false;

  const panel = () => document.querySelector(PANEL);
  const drawer = root => root?.querySelector('.relphi-reading-options-drawer') || null;
  const controller = () => window.RelphiDrawingBoardLayoutController || null;
  function templates() {
    try { return window.RelphiDrawingBoardSpreadPrefabs?.list?.() || []; }
    catch (_) { return []; }
  }
  const templateById = id => templates().find(item => item?.id === id) || null;
  const ordered = layout => Array.isArray(layout?.positions) ? layout.positions.slice().sort((a,b) => Number(a.drawOrder||0)-Number(b.drawOrder||0)) : [];
  const clean = values => (values || []).map(v => String(v || '').trim()).filter(Boolean);

  function visibleLabels(root) {
    const inputs = Array.from(root?.querySelectorAll('.relphi-label-builder [data-relphi-label-input]') || []);
    if (inputs.length) return clean(inputs.map(input => input.value));
    return clean(String(root?.querySelector('#rowPositionLabels')?.value || '').split(','));
  }
  function readDraft(root=panel()) {
    return {
      template:String(root?.querySelector('#relphiSpreadTemplateSelect')?.value || ''),
      labels:visibleLabels(root),
      pack:String(root?.querySelector('#rowDrawScope')?.value || 'full'),
      stickers:root?.querySelector('#rowPositionStickersQuick')?.checked !== false,
      reversals:root?.querySelector('#rowAllowReversalsQuick')?.checked !== false,
      repeats:!!root?.querySelector('#rowAllowRepeats')?.checked
    };
  }

  function setOpen(root,open) {
    if (!root) return;
    root.dataset.relphiReadingOptionsOpen = open ? 'true' : 'false';
    root.classList.toggle('relphi-options-transaction-active',open);
    const box = drawer(root);
    if (box) {
      box.open = true;
      box.classList.toggle('is-reading-options-open',open);
    }
    const trigger = root.querySelector('#drawingBoardOptionsButton');
    if (trigger) {
      trigger.setAttribute('aria-expanded',String(open));
      trigger.classList.toggle('is-active',open);
      trigger.title = open ? 'Options are open' : 'Open Options';
    }
  }

  function setBuilderLabels(root,labels) {
    const builder = root?.querySelector('.relphi-label-builder');
    const hidden = root?.querySelector('#rowPositionLabels');
    const wanted = (labels?.length ? labels : ['']).map(v => String(v || ''));
    if (!builder) {
      if (hidden) hidden.value = clean(wanted).join(', ');
      return;
    }
    let guard = 0;
    while (builder.querySelectorAll('[data-relphi-label-input]').length < wanted.length && guard++ < 45) {
      const rows = builder.querySelectorAll('.relphi-label-row');
      rows[rows.length - 1]?.querySelector('.relphi-label-add')?.click();
    }
    guard = 0;
    while (builder.querySelectorAll('[data-relphi-label-input]').length > wanted.length && guard++ < 45) {
      const rows = builder.querySelectorAll('.relphi-label-row');
      rows[rows.length - 1]?.querySelector('.relphi-label-remove')?.click();
    }
    Array.from(builder.querySelectorAll('[data-relphi-label-input]')).forEach((input,index) => { input.value = wanted[index] || ''; });
    if (hidden) {
      hidden.value = clean(wanted).join(', ');
      hidden.dataset.relphiManualValue = hidden.value;
    }
  }

  function setRules(root,prefab) {
    const rules = prefab?.rules || {};
    const pack = root?.querySelector('#rowDrawScope');
    if (pack) pack.value = String(rules.drawScope || 'full');
    const stickers = root?.querySelector('#rowPositionStickersQuick');
    if (stickers) stickers.checked = true;
    const reversals = root?.querySelector('#rowAllowReversalsQuick');
    if (reversals) reversals.checked = rules.allowReversals !== false;
    const repeats = root?.querySelector('#rowAllowRepeats');
    if (repeats) repeats.checked = !!rules.allowRepeats;
  }

  function syncEditorFromBoard(root) {
    const live = window.RelphiDrawingBoardPrefabsBridge?.getState?.();
    const layout = live?.activeLayout;
    const select = root?.querySelector('#relphiSpreadTemplateSelect');
    if (layout?.id && select && templateById(layout.id)) select.value = layout.id;
    if (layout?.positions?.length) setBuilderLabels(root,ordered(layout).map(item => item.label));
    if (!layout && !live?.slotCount) {
      if (select) select.value = '';
      setBuilderLabels(root,[]);
    }
  }

  function begin(root) {
    syncEditorFromBoard(root);
    session = { draft:readDraft(root) };
    setOpen(root,true);
  }
  function cancel(root) {
    session = null;
    setOpen(root,false);
  }
  function commit(root) {
    if (!session) return cancel(root);
    session.draft = readDraft(root);
    const draft = JSON.parse(JSON.stringify(session.draft));
    session = null;
    setOpen(root,false);
    controller()?.applyDraft?.(draft);
  }
  function reset(root) {
    session = null;
    // Close first, without calling the workflow's Cancel path. The root survives
    // the native board re-render, so the Options button remains a stable control.
    setOpen(root,false);
    controller()?.resetBoard?.();
  }

  function templateChanged(root,select) {
    const prefab = templateById(select.value);
    if (prefab) {
      setBuilderLabels(root,ordered(prefab).map(item => item.label));
      setRules(root,prefab);
    } else {
      setBuilderLabels(root,[]);
    }
    if (session) session.draft = readDraft(root);
  }

  function installBar(root) {
    const box = drawer(root);
    if (!box) return false;
    let bar = box.querySelector(':scope > .relphi-options-commit-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'relphi-options-commit-bar';
      const summary = box.querySelector(':scope > summary');
      summary ? summary.insertAdjacentElement('afterend',bar) : box.prepend(bar);
    }
    if (bar.dataset.relphiTransactionOwner !== 'v2') {
      bar.dataset.relphiTransactionOwner = 'v2';
      bar.innerHTML = '<button type="button" class="relphi-options-reset">Reset Board</button><span class="relphi-options-right"><button type="button" class="relphi-options-cancel">Cancel</button><button type="button" class="relphi-options-ok">OK</button></span>';
    }
    return true;
  }

  function normalizePrompt(root) {
    const empty = root?.querySelector('#relphiSpreadTemplateSelect option[value=""]');
    if (empty) empty.textContent = 'Choose a template';
  }

  function enhance() {
    scheduled = false;
    const root = panel();
    if (!root || root.hidden) return;
    installBar(root);
    normalizePrompt(root);
    if (root.dataset.relphiReadingOptionsOpen === 'true' && !session) begin(root);
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(enhance);
  }

  function installStyle() {
    if (document.getElementById('relphi-transactional-options-v2-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-transactional-options-v2-style';
    style.textContent = `
      #shortListPanel .drawing-board-top-actions>#clearShortList,#shortListPanel .card-row-action-staging>#clearShortList{display:none!important}
      html body #shortListPanel .drawing-board-top-actions>#drawingBoardOptionsButton{order:0!important;flex:0 0 auto!important;margin-left:0!important;margin-right:auto!important}
      #shortListPanel[data-relphi-reading-options-open="true"] .drawing-board-top-actions,#shortListPanel.relphi-options-transaction-active .drawing-board-top-actions{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
      #shortListPanel .relphi-reading-options-drawer>.relphi-options-commit-bar{position:sticky!important;top:0!important;z-index:4250!important;display:flex!important;align-items:center!important;width:100%!important;min-height:3.5rem!important;padding:.55rem .65rem!important;margin:0!important;box-sizing:border-box!important;background:rgba(255,253,248,.98)!important;border-bottom:1px solid #d8cec5!important;box-shadow:0 4px 12px rgba(35,24,18,.08)!important}
      #shortListPanel .relphi-options-commit-bar .relphi-options-right{margin-left:auto!important;display:flex!important;gap:.7rem!important}
      #shortListPanel .relphi-options-commit-bar button{appearance:none!important;min-height:2.45rem!important;padding:.48rem .9rem!important;border:1px solid #aaa098!important;border-radius:8px!important;background:#fff!important;color:#171412!important;font:inherit!important;font-size:.82rem!important;font-weight:850!important;box-shadow:none!important;cursor:pointer!important}
      #shortListPanel .relphi-options-commit-bar .relphi-options-reset{border-color:rgba(184,23,18,.58)!important;color:#a01813!important}
      #shortListPanel .relphi-options-commit-bar .relphi-options-ok{border-color:#b81712!important;background:#dc1f18!important;color:#fff!important}
    `;
    document.head.appendChild(style);
  }

  // Own the Options trigger before the workflow's target listener. This prevents
  // a second baseline/cancel transaction from existing at the same time.
  document.addEventListener('click',event => {
    const root = panel();
    if (!root) return;
    const trigger = event.target.closest?.('#drawingBoardOptionsButton');
    if (trigger && root.contains(trigger)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (root.dataset.relphiReadingOptionsOpen === 'true') cancel(root); else begin(root);
      return;
    }
    const box = drawer(root);
    if (!box) return;
    const resetButton = event.target.closest?.('.relphi-options-reset');
    if (resetButton && box.contains(resetButton)) {
      event.preventDefault(); event.stopImmediatePropagation(); reset(root); return;
    }
    const cancelButton = event.target.closest?.('.relphi-options-cancel');
    if (cancelButton && box.contains(cancelButton)) {
      event.preventDefault(); event.stopImmediatePropagation(); cancel(root); return;
    }
    const okButton = event.target.closest?.('.relphi-options-ok');
    if (okButton && box.contains(okButton)) {
      event.preventDefault(); event.stopImmediatePropagation(); commit(root); return;
    }
    const clear = event.target.closest?.('#relphiTemplateClear');
    if (clear && box.contains(clear) && root.dataset.relphiReadingOptionsOpen === 'true') {
      event.preventDefault(); event.stopImmediatePropagation();
      const select = root.querySelector('#relphiSpreadTemplateSelect');
      if (select) select.value = '';
      setBuilderLabels(root,[]);
      if (session) session.draft = readDraft(root);
    }
  },true);

  document.addEventListener('input',event => {
    const root = panel(), box = drawer(root), target = event.target;
    if (!root || !box || root.dataset.relphiReadingOptionsOpen !== 'true' || !box.contains(target) || !target.matches?.(CORE)) return;
    event.stopImmediatePropagation();
    if (session) session.draft = readDraft(root);
  },true);

  document.addEventListener('change',event => {
    const root = panel(), box = drawer(root), target = event.target;
    if (!root || !box || root.dataset.relphiReadingOptionsOpen !== 'true' || !box.contains(target) || !target.matches?.(CORE)) return;
    event.stopImmediatePropagation();
    if (target.id === 'relphiSpreadTemplateSelect') templateChanged(root,target);
    else if (session) session.draft = readDraft(root);
  },true);

  installStyle();
  document.addEventListener('relphi:drawing-board-rendered',schedule);
  new MutationObserver(records => {
    if (records.some(record => record.type === 'childList' && record.addedNodes.length)) schedule();
  }).observe(document.documentElement,{childList:true,subtree:true});
  schedule();
})();
