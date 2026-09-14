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
      trigger.textContent = open ? 'Close Options' : 'Options';
      trigger.title = open ? 'Close Options' : 'Open Options';
    }
  }

  function requestSpreadControls(root) {
    if (root?.querySelector('#relphiSpreadTemplateSelect')) return true;
    if (!root?.querySelector('.board-setup-group--spread') || !root?.querySelector('#rowPositionLabels')) return false;
    if (root.dataset.relphiSpreadRefreshPending === 'true') return false;
    root.dataset.relphiSpreadRefreshPending = 'true';
    requestAnimationFrame(() => {
      delete root.dataset.relphiSpreadRefreshPending;
      // Spread-prefabs already owns this refresh signal. Request its UI again
      // after the native board has rebuilt and workflow grouping is stable.
      document.dispatchEvent(new CustomEvent('relphi:drawing-board-center-view', {
        detail:{ source:'transactional-options-rehydrate' }
      }));
    });
    return false;
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
    const layout = live?.activeLayout || live?.currentLayout || null;
    const select = root?.querySelector('#relphiSpreadTemplateSelect');
    if (layout?.id && select && templateById(layout.id)) select.value = layout.id;
    if (layout?.positions?.length) setBuilderLabels(root,ordered(layout).map(item => item.label));
    if (!layout && !live?.slotCount) {
      if (select) select.value = '';
      setBuilderLabels(root,[]);
    }
  }

  function begin(root) {
    setOpen(root,true);
    if (!requestSpreadControls(root)) return;
    syncEditorFromBoard(root);
    session = { draft:readDraft(root) };
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
    setOpen(root,false);
    controller()?.resetBoard?.();
  }

  function templateChanged(root,select) {
    const prefab = templateById(select.value);
    if (prefab) {
      setBuilderLabels(root,ordered(prefab).map(item => item.label));
      setRules(root,prefab);
    } else setBuilderLabels(root,[]);
    if (session) session.draft = readDraft(root);
  }

  function installBar(root) {
    const box = drawer(root);
    if (!box) return false;
    let bar = box.querySelector(':scope > .relphi-options-commit-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'relphi-options-commit-bar';
    }
    if (bar.dataset.relphiTransactionOwner !== 'v2') {
      bar.dataset.relphiTransactionOwner = 'v2';
      bar.innerHTML = '<button type="button" class="relphi-options-reset">Reset Board</button><span class="relphi-options-right"><button type="button" class="relphi-options-cancel">Cancel</button><button type="button" class="relphi-options-ok">OK</button></span>';
    }
    // The commit bar belongs at the end of the scroll surface so sticky-bottom
    // behavior is deterministic on mobile and cannot sit behind board actions.
    if (bar.parentElement !== box || box.lastElementChild !== bar) box.appendChild(bar);
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
    const open = root.dataset.relphiReadingOptionsOpen === 'true';
    if (open && !session) begin(root);
    else setOpen(root,open);
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
      #shortListPanel[data-relphi-reading-options-open="true"] .drawing-board-top-actions{z-index:2800!important;background:transparent!important;border-color:transparent!important;box-shadow:none!important;backdrop-filter:none!important;pointer-events:none!important}
      #shortListPanel[data-relphi-reading-options-open="true"] .drawing-board-top-actions>button:not(#drawingBoardOptionsButton),#shortListPanel[data-relphi-reading-options-open="true"] .drawing-board-top-actions>.board-history-icon{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
      #shortListPanel[data-relphi-reading-options-open="true"] .drawing-board-top-actions>#drawingBoardOptionsButton{visibility:visible!important;opacity:1!important;pointer-events:auto!important}
      #shortListPanel[data-relphi-reading-options-open="true"] .card-row-workspace>.relphi-reading-options-drawer{z-index:2700!important}
      #shortListPanel .relphi-reading-options-drawer>.relphi-options-commit-bar{position:sticky!important;top:auto!important;bottom:0!important;z-index:4250!important;display:flex!important;align-items:center!important;width:100%!important;min-height:3.5rem!important;padding:.55rem .65rem!important;margin:.55rem 0 0!important;box-sizing:border-box!important;background:rgba(255,253,248,.98)!important;border-top:1px solid #d8cec5!important;border-bottom:0!important;box-shadow:0 -4px 12px rgba(35,24,18,.08)!important}
      #shortListPanel .relphi-options-commit-bar .relphi-options-right{margin-left:auto!important;display:flex!important;gap:.7rem!important}
      #shortListPanel .relphi-options-commit-bar button{appearance:none!important;min-height:2.45rem!important;padding:.48rem .9rem!important;border:1px solid #aaa098!important;border-radius:8px!important;background:#fff!important;color:#171412!important;font:inherit!important;font-size:.82rem!important;font-weight:850!important;box-shadow:none!important;cursor:pointer!important}
      #shortListPanel .relphi-options-commit-bar .relphi-options-reset{border-color:rgba(184,23,18,.58)!important;color:#a01813!important}
      #shortListPanel .relphi-options-commit-bar .relphi-options-ok{border-color:#b81712!important;background:#dc1f18!important;color:#fff!important}
      @media(max-width:700px){
        #shortListPanel[data-relphi-reading-options-open="true"] .card-row-workspace>.relphi-reading-options-drawer{top:.45rem!important;right:.45rem!important;bottom:.45rem!important;left:.45rem!important}
        #shortListPanel[data-relphi-reading-options-open="true"] .drawing-board-top-actions>#drawingBoardOptionsButton{position:fixed!important;top:.8rem!important;right:.8rem!important;left:auto!important;z-index:2810!important;margin:0!important}
      }
    `;
    document.head.appendChild(style);
  }

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