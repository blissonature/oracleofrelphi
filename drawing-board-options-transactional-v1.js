// Transactional Reading Setup editor for Drawing Board Options.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiDrawingBoardTransactionalOptionsV1) return;
  window.__relphiDrawingBoardTransactionalOptionsV1 = true;

  const PANEL = '#shortListPanel';
  const CORE_CONTROL_SELECTOR = [
    '#relphiSpreadTemplateSelect',
    '#rowPositionLabels',
    '#rowDrawScope',
    '#rowPositionStickersQuick',
    '#rowAllowReversalsQuick',
    '#rowAllowRepeats',
    '.relphi-label-builder [data-relphi-label-input]'
  ].join(',');

  let session = null;
  let applying = false;
  let queued = false;

  function panel() { return document.querySelector(PANEL); }
  function drawer(root = panel()) { return root?.querySelector('.relphi-reading-options-drawer') || null; }
  function optionsOpen(root = panel()) { return !!root && root.dataset.relphiReadingOptionsOpen === 'true'; }
  function prefabs() {
    try { return window.RelphiDrawingBoardSpreadPrefabs?.list?.() || []; }
    catch (_) { return []; }
  }
  function prefabById(id) { return prefabs().find(item => item.id === id) || null; }
  function labelsForPrefab(prefab) {
    return (prefab?.positions || []).slice().sort((a,b) => Number(a.drawOrder || 0) - Number(b.drawOrder || 0))
      .map((item,index) => String(item?.label || ('Position #' + (index + 1))).trim()).filter(Boolean);
  }
  function cleanLabels(values) {
    return (values || []).map(value => String(value || '').trim()).filter(Boolean);
  }
  function builderLabels(root = panel()) {
    const inputs = Array.from(root?.querySelectorAll('.relphi-reading-options-drawer .relphi-label-builder [data-relphi-label-input]') || []);
    if (inputs.length) return cleanLabels(inputs.map(input => input.value));
    return cleanLabels(String(root?.querySelector('#rowPositionLabels')?.value || '').split(','));
  }
  function readDraft(root = panel()) {
    return {
      template:String(root?.querySelector('#relphiSpreadTemplateSelect')?.value || ''),
      labels:builderLabels(root),
      pack:String(root?.querySelector('#rowDrawScope')?.value || 'full'),
      stickers:root?.querySelector('#rowPositionStickersQuick')?.checked !== false,
      reversals:root?.querySelector('#rowAllowReversalsQuick')?.checked !== false,
      repeats:!!root?.querySelector('#rowAllowRepeats')?.checked
    };
  }
  function sameDraft(a,b) { return JSON.stringify(a || {}) === JSON.stringify(b || {}); }
  function structureChanged(a,b) {
    if (!a || !b) return false;
    return a.template !== b.template || JSON.stringify(a.labels) !== JSON.stringify(b.labels);
  }

  function setCheckbox(root,id,value) {
    const input = root?.querySelector('#' + id);
    if (input) input.checked = !!value;
  }
  function setDraftRules(root,prefab) {
    const rules = prefab?.rules || {};
    const pack = root?.querySelector('#rowDrawScope');
    if (pack) pack.value = String(rules.drawScope || 'full');
    setCheckbox(root,'rowPositionStickersQuick',true);
    setCheckbox(root,'rowAllowReversalsQuick',rules.allowReversals !== false);
    setCheckbox(root,'rowAllowRepeats',!!rules.allowRepeats);
  }

  function setBuilderLabels(root,labels) {
    const builder = root?.querySelector('.relphi-reading-options-drawer .relphi-label-builder');
    const hidden = root?.querySelector('#rowPositionLabels');
    const clean = labels.length ? labels.map(value => String(value || '')) : [''];
    if (!builder) {
      if (hidden) hidden.value = cleanLabels(clean).join(', ');
      return;
    }

    let guard = 0;
    while (builder.querySelectorAll('[data-relphi-label-input]').length < clean.length && guard++ < 45) {
      const rows = builder.querySelectorAll('.relphi-label-row');
      const add = rows[rows.length - 1]?.querySelector('.relphi-label-add');
      if (!add) break;
      add.click();
    }
    guard = 0;
    while (builder.querySelectorAll('[data-relphi-label-input]').length > clean.length && guard++ < 45) {
      const rows = builder.querySelectorAll('.relphi-label-row');
      const remove = rows[rows.length - 1]?.querySelector('.relphi-label-remove');
      if (!remove) break;
      remove.click();
    }

    Array.from(builder.querySelectorAll('[data-relphi-label-input]')).forEach((input,index) => {
      input.value = clean[index] || '';
    });
    if (hidden) {
      hidden.value = cleanLabels(clean).join(', ');
      hidden.dataset.relphiManualValue = hidden.value;
    }
  }

  function liveBoardState() {
    try { return window.RelphiDrawingBoardPrefabsBridge?.getState?.() || null; }
    catch (_) { return null; }
  }
  function orderedLayoutLabels(layout) {
    return (layout?.positions || []).slice().sort((a,b) => Number(a?.drawOrder || 0) - Number(b?.drawOrder || 0))
      .map((item,index) => String(item?.label || ('Position #' + (index + 1))).trim()).filter(Boolean);
  }
  function clearEditorStructure(root) {
    const select = root?.querySelector('#relphiSpreadTemplateSelect');
    if (select) select.value = '';
    setBuilderLabels(root,[]);
    normalizeTemplatePrompt(root);
  }
  function syncLiveStructureIntoEditor(root = panel()) {
    if (!root) return;
    const state = liveBoardState();
    if (!state) return;
    const layout = [state.activeLayout,state.currentLayout].find(candidate => Array.isArray(candidate?.positions) && candidate.positions.length);
    if (layout) {
      const select = root.querySelector('#relphiSpreadTemplateSelect');
      const known = prefabById(layout.id);
      if (select && known) select.value = known.id;
      setBuilderLabels(root,orderedLayoutLabels(layout));
      return;
    }
    const domSlots = root.querySelectorAll('.card-row-board .card-row-item').length;
    const slotCount = Math.max(domSlots,Number(state.slotCount) || 0);
    if (!state.hasCards && slotCount === 0) clearEditorStructure(root);
  }

  function beginSession(root = panel()) {
    if (!root || session) return;
    syncLiveStructureIntoEditor(root);
    const baseline = readDraft(root);
    session = { baseline, draft:JSON.parse(JSON.stringify(baseline)) };
    root.classList.add('relphi-options-transaction-active');
  }
  function endSession(root = panel()) {
    session = null;
    root?.classList.remove('relphi-options-transaction-active');
  }
  function refreshDraft(root = panel()) {
    if (!session || !root) return;
    session.draft = readDraft(root);
  }

  function installStyle() {
    if (document.getElementById('relphi-transactional-options-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-transactional-options-style';
    style.textContent = `
      #shortListPanel .drawing-board-top-actions>#clearShortList,
      #shortListPanel .card-row-action-staging>#clearShortList{display:none!important}
      #shortListPanel[data-relphi-reading-options-open="true"] .drawing-board-top-actions,
      #shortListPanel.relphi-options-transaction-active .drawing-board-top-actions,
      #shortListPanel[data-relphi-reading-options-open="true"] .drawing-board-primary-actions,
      #shortListPanel.relphi-options-transaction-active .drawing-board-primary-actions{
        visibility:hidden!important;opacity:0!important;pointer-events:none!important
      }
      #shortListPanel[data-relphi-reading-options-open="true"] .relphi-reading-options-drawer,
      #shortListPanel.relphi-options-transaction-active .relphi-reading-options-drawer{z-index:4200!important}
      #shortListPanel .relphi-reading-options-drawer>.relphi-options-commit-bar{
        position:sticky!important;top:0!important;z-index:4250!important;display:flex!important;align-items:center!important;
        width:100%!important;min-height:3.5rem!important;padding:.55rem .65rem!important;margin:0!important;box-sizing:border-box!important;
        background:rgba(255,253,248,.98)!important;border-bottom:1px solid #d8cec5!important;box-shadow:0 4px 12px rgba(35,24,18,.08)!important;
        backdrop-filter:blur(6px)!important
      }
      #shortListPanel .relphi-options-commit-bar .relphi-options-right{margin-left:auto!important;display:flex!important;align-items:center!important;gap:.7rem!important}
      #shortListPanel .relphi-options-commit-bar button{
        appearance:none!important;min-height:2.45rem!important;padding:.48rem .9rem!important;border:1px solid #aaa098!important;border-radius:8px!important;
        background:#fff!important;color:#171412!important;font:inherit!important;font-size:.82rem!important;font-weight:850!important;line-height:1!important;
        box-shadow:none!important;cursor:pointer!important
      }
      #shortListPanel .relphi-options-commit-bar .relphi-options-reset{border-color:rgba(184,23,18,.58)!important;color:#a01813!important}
      #shortListPanel .relphi-options-commit-bar .relphi-options-ok{border-color:#b81712!important;background:#dc1f18!important;color:#fff!important}
      #shortListPanel .relphi-options-commit-bar button:focus-visible{outline:3px solid rgba(220,31,24,.22)!important;outline-offset:2px!important}
      #shortListPanel .relphi-reading-options-drawer>.card-row-composer{padding-top:.55rem!important}
      @media(max-width:700px){
        #shortListPanel[data-relphi-reading-options-open="true"] .relphi-reading-options-drawer,
        #shortListPanel.relphi-options-transaction-active .relphi-reading-options-drawer{
          isolation:isolate!important;box-shadow:0 16px 42px rgba(30,20,15,.26)!important
        }
      }
      @media(max-width:520px){
        #shortListPanel .relphi-options-commit-bar{padding:.5rem!important}
        #shortListPanel .relphi-options-commit-bar button{padding:.45rem .65rem!important;font-size:.76rem!important}
        #shortListPanel .relphi-options-commit-bar .relphi-options-right{gap:.4rem!important}
      }
    `;
    document.head.appendChild(style);
  }

  function installActionBar(root = panel()) {
    const box = drawer(root);
    if (!box) return;
    let bar = box.querySelector(':scope > .relphi-options-commit-bar');
    if (!bar) { bar = document.createElement('div'); bar.className = 'relphi-options-commit-bar'; }
    if (bar.dataset.relphiTransactional !== 'true') {
      bar.dataset.relphiTransactional = 'true';
      bar.innerHTML = '<button type="button" class="relphi-options-reset">Reset Board</button>' +
        '<span class="relphi-options-right"><button type="button" class="relphi-options-cancel">Cancel</button><button type="button" class="relphi-options-ok">OK</button></span>';
    }
    const summary = box.querySelector(':scope > summary');
    if (summary) summary.insertAdjacentElement('afterend',bar); else box.prepend(bar);
  }

  function normalizeTemplatePrompt(root = panel()) {
    const first = root?.querySelector('#relphiSpreadTemplateSelect option[value=""]');
    if (first && first.textContent !== 'Choose a template') first.textContent = 'Choose a template';
  }
  function closeThroughExistingCancel() {
    const root = panel();
    if (!root || !optionsOpen(root)) return;
    endSession(root);
    window.RelphiDrawingBoardToggleOptions?.();
  }
  function dispatch(control,type) { control?.dispatchEvent(new Event(type,{bubbles:true})); }
  function waitForControls(callback,attempt = 0) {
    const root = panel();
    const ready = root?.querySelector('#rowDrawScope') && root?.querySelector('#rowPositionLabels');
    if (ready) return callback(root);
    if (attempt < 30) window.setTimeout(() => waitForControls(callback,attempt + 1),35);
  }

  function structuralBlankSnapshot(snapshot) {
    return {
      ...snapshot,shortList:[],shortListSelection:[],shortListSelectMode:false,shortListPositionLabels:[],shortListPositionCardIds:[],
      rowCardReversals:{},rowEnvelopeLayout:{},rowCardTransforms:{},rowActiveLayout:null,rowPositionMeta:[],rowLayoutDesignMode:false,
      rowLayoutLocked:false,rowCenterOpen:false,rowEnvelopeArt:{},rowDrawDeck:[],rowDrawDeckSignature:'',rowShuffled:false,rowShuffleCount:0,customCardArt:{}
    };
  }

  function applyRules(root,draft) {
    const pack = root.querySelector('#rowDrawScope');
    if (pack) { pack.value = draft.pack || 'full'; dispatch(pack,'input'); dispatch(pack,'change'); }
    [['rowPositionStickersQuick',draft.stickers],['rowAllowReversalsQuick',draft.reversals],['rowAllowRepeats',draft.repeats]].forEach(([id,value]) => {
      const input = root.querySelector('#' + id);
      if (!input) return;
      input.checked = !!value; dispatch(input,'input'); dispatch(input,'change');
    });
  }
  function applyLabelsAndRules(draft,applyLabels) {
    waitForControls(root => {
      if (applyLabels) {
        const hidden = root.querySelector('#rowPositionLabels');
        hidden.value = cleanLabels(draft.labels).join(', ');
        hidden.dataset.relphiManualValue = hidden.value;
        dispatch(hidden,'input'); dispatch(hidden,'change');
      }
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
        const liveRoot = panel();
        if (liveRoot) applyRules(liveRoot,draft);
        applying = false;
      }));
    });
  }

  function applyDraft(draft,baseline) {
    applying = true;
    const structural = structureChanged(draft,baseline);
    const bridge = window.RelphiDrawingBoardOptionsBridge;
    if (!structural) {
      applyLabelsAndRules(draft,false);
      return;
    }
    if (bridge?.capture && bridge?.restore) {
      const live = bridge.capture();
      bridge.restore(structuralBlankSnapshot(live));
    }
    waitForControls(root => {
      const select = root.querySelector('#relphiSpreadTemplateSelect');
      if (select) { select.value = draft.template || ''; dispatch(select,'change'); }
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => applyLabelsAndRules(draft,true)));
    });
  }

  function ok() {
    const root = panel();
    if (!root || !session) return;
    refreshDraft(root);
    const draft = JSON.parse(JSON.stringify(session.draft));
    const baseline = JSON.parse(JSON.stringify(session.baseline));
    closeThroughExistingCancel();
    window.setTimeout(() => applyDraft(draft,baseline),0);
  }

  function clearTemplateSelection(after) {
    let attempts = 0;
    const clear = () => {
      attempts += 1;
      const root = panel();
      const select = root?.querySelector('#relphiSpreadTemplateSelect');
      if (select) {
        applying = true;
        select.value = '';
        dispatch(select,'change');
        clearEditorStructure(root);
        applying = false;
        normalizeTemplatePrompt(root);
        if (after) after();
        return;
      }
      if (attempts < 30) return window.setTimeout(clear,35);
      if (after) after();
    };
    clear();
  }
  function reopenOptions() {
    let attempts = 0;
    const open = () => {
      attempts += 1;
      const root = panel();
      if (root && !optionsOpen(root)) { window.RelphiDrawingBoardToggleOptions?.(); schedule(); return; }
      if (!root && attempts < 30) window.setTimeout(open,35);
    };
    window.setTimeout(open,0);
  }
  function resetBoard() {
    const root = panel();
    if (!root) return;
    closeThroughExistingCancel();
    window.setTimeout(() => {
      const liveRoot = panel();
      const nativeReset = liveRoot?.querySelector('#clearShortList');
      if (nativeReset && !nativeReset.disabled) nativeReset.click();
      window.setTimeout(() => clearTemplateSelection(reopenOptions),0);
    },0);
  }

  function draftTemplateChanged(root,select) {
    const prefab = prefabById(select.value);
    if (prefab) {
      setBuilderLabels(root,labelsForPrefab(prefab));
      setDraftRules(root,prefab);
    } else if (!select.value) {
      setBuilderLabels(root,[]);
    }
    refreshDraft(root);
  }
  function interceptDraftEvent(event) {
    if (applying) return;
    const root = panel();
    const box = drawer(root);
    const target = event.target;
    if (!root || !box || !optionsOpen(root) || !box.contains(target) || !target.matches?.(CORE_CONTROL_SELECTOR)) return;
    event.stopImmediatePropagation();
    if (target.id === 'relphiSpreadTemplateSelect' && event.type === 'change') draftTemplateChanged(root,target);
    else refreshDraft(root);
  }

  function handleClick(event) {
    const root = panel();
    const box = drawer(root);
    if (!root || !box) return;
    const reset = event.target.closest?.('.relphi-options-reset');
    if (reset && box.contains(reset)) { event.preventDefault(); event.stopImmediatePropagation(); resetBoard(); return; }
    const cancel = event.target.closest?.('.relphi-options-cancel');
    if (cancel && box.contains(cancel)) { event.preventDefault(); event.stopImmediatePropagation(); closeThroughExistingCancel(); return; }
    const confirm = event.target.closest?.('.relphi-options-ok');
    if (confirm && box.contains(confirm)) { event.preventDefault(); event.stopImmediatePropagation(); ok(); return; }
    const templateClear = event.target.closest?.('#relphiTemplateClear');
    if (templateClear && optionsOpen(root)) {
      event.preventDefault(); event.stopImmediatePropagation();
      const select = root.querySelector('#relphiSpreadTemplateSelect');
      if (select) select.value = '';
      setBuilderLabels(root,[]);
      refreshDraft(root); schedule(); return;
    }
    const saveTemplate = event.target.closest?.('#relphiSaveLabelsAsTemplate');
    if (saveTemplate && optionsOpen(root) && session) {
      refreshDraft(root);
      if (!sameDraft(session.baseline,session.draft)) {
        event.preventDefault(); event.stopImmediatePropagation();
        const status = root.querySelector('.relphi-label-template-status');
        if (status) status.textContent = 'Press OK to apply this setup before saving it as a template.';
        return;
      }
    }
    if (event.target.closest?.('.relphi-label-add,.relphi-label-remove') && optionsOpen(root)) window.setTimeout(() => refreshDraft(panel()),0);
  }

  function enhance() {
    queued = false;
    const root = panel();
    if (!root || root.hidden) return;
    installStyle(); installActionBar(root); normalizeTemplatePrompt(root);
    if (optionsOpen(root)) beginSession(root); else if (session) endSession(root);
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => requestAnimationFrame(enhance));
  }

  document.addEventListener('input',interceptDraftEvent,true);
  document.addEventListener('change',interceptDraftEvent,true);
  document.addEventListener('click',handleClick,true);
  document.addEventListener('relphi:drawing-board-rendered',schedule);
  document.addEventListener('relphi:drawing-board-options-toggle',() => window.setTimeout(schedule,0));
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-relphi-reading-options-open','hidden']});
  schedule();
})();