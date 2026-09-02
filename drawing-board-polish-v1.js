// Drawing Board final UI pass: card-to-ledger navigation, parchment template picker,
// reliable new-template creation, and corrected 11-card Celtic Cross presentation.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname) && window.__relphiTarotPreviewDocument !== true) return;
  if (window.__relphiDrawingBoardPolishV1) return;
  window.__relphiDrawingBoardPolishV1 = true;

  const PANEL = '#shortListPanel';
  const CUSTOM_KEY = 'relphiDrawingBoardSpreadPrefabsV2';
  let popover = null;
  let templateNameInput = null;
  let templateLabelsInput = null;
  let statusNode = null;
  let renderQueued = false;

  function panel() { return document.querySelector(PANEL); }
  function normalize(value) { return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase(); }
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function displayName(prefab) { return Number(prefab?.cardCount || prefab?.positions?.length || 0) + ' | ' + String(prefab?.name || 'Untitled'); }

  function identityFromCard(card) {
    const title = card.querySelector('.or-card-title-banner')?.textContent?.trim() || card.getAttribute('aria-label') || '';
    return { id:String(card.dataset.rowCard || ''), title };
  }
  function findLedgerResult(identity) {
    const list = document.getElementById('cardList');
    if (!list) return null;
    const wanted = normalize(identity.title);
    return Array.from(list.querySelectorAll('button,[role="listitem"],li,article,[data-card-id],[data-card]')).find(node => {
      const id = node.getAttribute('data-card-id') || node.getAttribute('data-card') || node.getAttribute('data-id') || '';
      return (identity.id && id === identity.id) || (wanted && normalize(node.textContent).includes(wanted));
    }) || null;
  }
  function focusLedgerResult(identity) {
    (document.getElementById('showAllCards') || document.getElementById('landingShowLedger'))?.click();
    const started = Date.now();
    let searched = false;
    (function locate() {
      const match = findLedgerResult(identity);
      if (match) {
        const target = match.closest('button,[role="button"],[role="listitem"],li,article') || match;
        document.getElementById('browsePanel')?.removeAttribute('hidden');
        document.querySelectorAll('.relphi-board-ledger-target').forEach(node => node.classList.remove('relphi-board-ledger-target'));
        target.classList.add('relphi-board-ledger-target');
        target.scrollIntoView({ behavior:'smooth', block:'center' });
        window.setTimeout(() => target.classList.remove('relphi-board-ledger-target'), 2200);
        return;
      }
      if (!searched && Date.now() - started > 180) {
        const command = document.getElementById('oracleCommand');
        const run = document.getElementById('runCommand');
        if (command && run && identity.title) {
          searched = true;
          command.value = identity.title;
          command.dispatchEvent(new Event('input', { bubbles:true }));
          run.click();
        }
      }
      if (Date.now() - started < 2200) requestAnimationFrame(locate);
    })();
  }

  function allTemplates() {
    try {
      const api = window.RelphiDrawingBoardSpreadPrefabs;
      return Array.isArray(api?.list?.()) ? api.list() : Array.isArray(api?.shipped) ? api.shipped : [];
    } catch (_) { return []; }
  }
  function readCustom() {
    try {
      const value = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  }
  function gridPositions(labels) {
    const count = labels.length;
    const cols = Math.min(count, count > 6 ? 3 : count > 3 ? 2 : count);
    const rows = Math.ceil(count / cols);
    const scale = count > 6 ? .52 : count > 3 ? .62 : .72;
    return labels.map((label, index) => ({
      id:'position-' + (index + 1),
      label,
      drawOrder:index + 1,
      transform:{
        x:.05 + (index % cols) * (.82 / Math.max(1, cols - 1)),
        y:.08 + Math.floor(index / cols) * (.72 / Math.max(1, rows - 1)),
        rotation:0,
        scale,
        zIndex:1
      }
    }));
  }
  function uniqueTemplateId(name) {
    const stem = String(name || 'custom-spread').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'custom-spread';
    return stem + '-' + Date.now().toString(36);
  }

  function closePopover() {
    if (!popover) return;
    popover.hidden = true;
    const trigger = panel()?.querySelector('#relphiTemplatePickerTrigger');
    trigger?.setAttribute('aria-expanded', 'false');
  }
  function positionPopover(trigger) {
    if (!popover || !trigger) return;
    const root = panel();
    const anchor = root?.querySelector('.relphi-template-omnibox') || root?.querySelector('#rowPositionLabels') || trigger;
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(430, Math.max(300, rect.width));
    const left = Math.min(window.innerWidth - width - 10, Math.max(10, rect.left));
    let top = rect.bottom + 7;
    const availableBelow = window.innerHeight - top - 10;
    if (availableBelow < 260 && rect.top > 300) top = Math.max(10, rect.top - 430);
    popover.style.width = width + 'px';
    popover.style.left = left + 'px';
    popover.style.top = top + 'px';
    popover.style.maxHeight = Math.max(260, Math.min(480, window.innerHeight - top - 10)) + 'px';
  }
  function chooseTemplate(prefab) {
    const field = panel()?.querySelector('#rowPositionLabels');
    if (!field || !prefab) return;
    field.value = displayName(prefab);
    field.dispatchEvent(new Event('input', { bubbles:true }));
    field.dispatchEvent(new Event('change', { bubbles:true }));
    closePopover();
  }
  function renderTemplateList() {
    if (!popover) return;
    const list = popover.querySelector('.relphi-template-picker-list');
    if (!list) return;
    const templates = allTemplates();
    list.innerHTML = templates.map(prefab => {
      const kind = prefab.source === 'custom' ? 'My template' : 'Shipped template';
      const detail = (prefab.positions || []).slice(0, 4).map(position => position.label).join(' · ');
      return '<button type="button" class="relphi-template-picker-row" data-template-id="' + escapeHtml(prefab.id) + '"><strong>' + escapeHtml(displayName(prefab)) + '</strong><span>' + escapeHtml(kind + (detail ? ' · ' + detail : '')) + '</span></button>';
    }).join('');
    list.querySelectorAll('[data-template-id]').forEach(button => {
      button.addEventListener('click', () => chooseTemplate(templates.find(item => item.id === button.dataset.templateId)));
    });
  }
  function showNewTemplateForm() {
    if (!popover) return;
    const form = popover.querySelector('.relphi-new-template-form');
    const list = popover.querySelector('.relphi-template-picker-list');
    if (form) form.hidden = false;
    if (list) list.hidden = true;
    templateNameInput?.focus();
  }
  function hideNewTemplateForm() {
    if (!popover) return;
    const form = popover.querySelector('.relphi-new-template-form');
    const list = popover.querySelector('.relphi-template-picker-list');
    if (form) form.hidden = true;
    if (list) list.hidden = false;
    if (statusNode) statusNode.textContent = '';
  }
  function createTemplate() {
    const name = String(templateNameInput?.value || '').trim().replace(/\s+/g, ' ').slice(0, 60);
    const labels = String(templateLabelsInput?.value || '').split(',').map(value => value.trim()).filter(Boolean).slice(0, 40);
    if (!name) { statusNode.textContent = 'Give the template a name.'; templateNameInput?.focus(); return; }
    if (!labels.length) { statusNode.textContent = 'Add at least one position label.'; templateLabelsInput?.focus(); return; }
    const existing = allTemplates().some(item => Number(item.cardCount) === labels.length && normalize(item.name) === normalize(name));
    if (existing) { statusNode.textContent = 'A ' + labels.length + '-card template with that name already exists.'; return; }
    const prefab = {
      version:1,
      id:uniqueTemplateId(name),
      name,
      cardCount:labels.length,
      source:'custom',
      editable:true,
      basedOn:null,
      positions:gridPositions(labels),
      rules:{ allowReversals:false, allowRepeats:false, drawScope:'full' }
    };
    const custom = readCustom();
    custom.push(prefab);
    try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom.slice(-40))); }
    catch (_) { statusNode.textContent = 'This browser could not save the template.'; return; }

    const field = panel()?.querySelector('#rowPositionLabels');
    if (!field) return;
    field.value = displayName(prefab);
    field.dispatchEvent(new Event('input', { bubbles:true }));
    field.dispatchEvent(new Event('change', { bubbles:true }));
    const stickerToggle = panel()?.querySelector('#rowPositionStickersQuick');
    if (stickerToggle && !stickerToggle.checked) {
      stickerToggle.checked = true;
      stickerToggle.dispatchEvent(new Event('change', { bubbles:true }));
    }
    statusNode.textContent = 'Template created.';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const use = panel()?.querySelector('.relphi-labels-dynamic [data-prefab-action="use"]');
      use?.click();
      closePopover();
    }));
  }

  function ensurePopover() {
    if (popover?.isConnected) return popover;
    popover = document.createElement('section');
    popover.id = 'relphiTemplatePickerPopover';
    popover.className = 'relphi-template-picker-popover';
    popover.hidden = true;
    popover.innerHTML = '<header><strong>Spread Templates</strong><button type="button" data-close aria-label="Close">×</button></header><div class="relphi-template-picker-actions"><button type="button" class="primary" data-new-template>New template</button></div><div class="relphi-template-picker-list"></div><div class="relphi-new-template-form" hidden><label><span>Template name</span><input id="relphiQuickTemplateName" type="text" maxlength="60" autocomplete="off" placeholder="Name this spread"></label><label><span>Position labels</span><textarea id="relphiQuickTemplateLabels" rows="4" placeholder="Question one, Question two, Question three"></textarea></label><p class="relphi-template-picker-status" aria-live="polite"></p><div><button type="button" data-cancel-new>Back</button><button type="button" class="primary" data-create-template>Create and use</button></div></div>';
    document.body.appendChild(popover);
    templateNameInput = popover.querySelector('#relphiQuickTemplateName');
    templateLabelsInput = popover.querySelector('#relphiQuickTemplateLabels');
    statusNode = popover.querySelector('.relphi-template-picker-status');
    popover.querySelector('[data-close]')?.addEventListener('click', closePopover);
    popover.querySelector('[data-new-template]')?.addEventListener('click', showNewTemplateForm);
    popover.querySelector('[data-cancel-new]')?.addEventListener('click', hideNewTemplateForm);
    popover.querySelector('[data-create-template]')?.addEventListener('click', createTemplate);
    [templateNameInput, templateLabelsInput].forEach(input => input?.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); hideNewTemplateForm(); }
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); createTemplate(); }
    }));
    return popover;
  }

  function installTemplatePicker(root) {
    const field = root.querySelector('#rowPositionLabels');
    const omnibox = root.querySelector('.relphi-template-omnibox');
    if (!field || !omnibox) return;
    field.removeAttribute('list'); // never invoke the browser's black native datalist popup
    let trigger = omnibox.querySelector('#relphiTemplatePickerTrigger');
    if (!trigger) {
      trigger = document.createElement('button');
      trigger.id = 'relphiTemplatePickerTrigger';
      trigger.type = 'button';
      trigger.className = 'relphi-template-picker-trigger';
      trigger.setAttribute('aria-label', 'Choose a Spread Template');
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.innerHTML = '<span class="relphi-template-picker-chevron" aria-hidden="true"></span>';
      omnibox.appendChild(trigger);
      trigger.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        ensurePopover();
        const opening = popover.hidden;
        if (!opening) return closePopover();
        hideNewTemplateForm();
        renderTemplateList();
        positionPopover(trigger);
        popover.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
      });
    }
  }

  function correctCelticEleven(root) {
    const state = window.RelphiDrawingBoardPrefabsBridge?.getState?.();
    if (state?.activeLayout?.id !== 'celtic-cross-11' || state.centerOpen) return;
    const board = root.querySelector('.card-row-board');
    if (!board) return;
    // Traditional center: significator under the covering card, crossing card centered horizontally.
    // A small backing-card reveal keeps the significator legible in a digital layout without changing the cross.
    const values = [
      { index:0, left:208, top:262, rotation:0, scale:.45, z:10 },
      { index:1, left:225, top:248, rotation:0, scale:.45, z:20 },
      { index:2, left:225, top:248, rotation:90, scale:.45, z:30 }
    ];
    values.forEach(value => {
      const item = board.querySelector('[data-row-index="' + value.index + '"]');
      if (!item) return;
      item.style.left = value.left + 'px';
      item.style.top = value.top + 'px';
      item.style.zIndex = String(value.z);
      item.style.setProperty('--row-card-scale', String(value.scale));
      item.style.setProperty('--row-card-rotation', value.rotation + 'deg');
      item.querySelector('[data-row-card]')?.style.setProperty('transform-origin', '50% 50%', 'important');
    });
  }

  function placeBoardBelowLedger(root) {
    const browse = document.getElementById('browsePanel');
    if (!root || !browse || root.parentElement === browse.parentElement && root.previousElementSibling === browse) return;
    browse.insertAdjacentElement('afterend', root);
  }

  function enhance() {
    renderQueued = false;
    const root = panel();
    if (!root) return;
    placeBoardBelowLedger(root);
    if (root.hidden) return;
    installTemplatePicker(root);
    correctCelticEleven(root);
    root.querySelectorAll('.card-row-board [data-row-card]').forEach(card => {
      card.classList.add('relphi-board-card-link');
      card.setAttribute('role', 'link');
      if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', 'Open ' + (identityFromCard(card).title || 'this card') + ' in Tarot Ledger results');
    });
  }
  function schedule() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(enhance);
  }

  const style = document.createElement('style');
  style.id = 'relphi-drawing-board-polish-v1-style';
  style.textContent = [
    '#shortListPanel .card-row-board .or-layer-scroll{display:none!important;visibility:hidden!important;pointer-events:none!important}',
    '#shortListPanel .card-row-board [data-row-card].relphi-board-card-link{cursor:pointer!important}',
    '#shortListPanel .card-row-board [data-row-card].relphi-board-card-link:focus-visible{outline:3px solid rgba(220,31,24,.36)!important;outline-offset:3px!important}',
    '#shortListPanel .relphi-card-title-link:hover,#shortListPanel .relphi-card-title-link:focus-visible{background:transparent!important;color:inherit!important}',
    '.relphi-board-ledger-target{outline:3px solid rgba(220,31,24,.32)!important;outline-offset:3px!important;border-radius:9px!important}',
    '#shortListPanel .relphi-template-omnibox input[type="text"]{padding-right:4.45rem!important}',
    '#shortListPanel .relphi-template-picker-trigger{position:absolute!important;right:2.42rem!important;bottom:.28rem!important;z-index:3!important;display:grid!important;place-items:center!important;width:1.65rem!important;min-width:1.65rem!important;height:1.65rem!important;min-height:1.65rem!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;color:#81766c!important;cursor:pointer!important}',
    '#shortListPanel .relphi-template-picker-trigger:hover,#shortListPanel .relphi-template-picker-trigger:focus-visible{outline:none!important;border:0!important;background:transparent!important;box-shadow:none!important;color:#4f4943!important}',
    '#shortListPanel .relphi-template-picker-chevron{display:block;width:7px;height:7px;margin-top:-4px;border-right:1.6px solid currentColor;border-bottom:1.6px solid currentColor;transform:rotate(45deg);transform-origin:50% 50%;transition:transform .12s ease}',
    '#shortListPanel .relphi-template-picker-trigger[aria-expanded="true"] .relphi-template-picker-chevron{margin-top:4px;transform:rotate(225deg)}',
    '.relphi-template-picker-popover{position:fixed;z-index:13000;display:grid;grid-template-rows:auto auto minmax(0,1fr);overflow:hidden;box-sizing:border-box;border:1px solid rgba(31,27,24,.2);border-radius:13px;background:#fffdf8;box-shadow:0 18px 44px rgba(31,27,24,.22);color:#211d19}',
    '.relphi-template-picker-popover[hidden]{display:none!important}',
    '.relphi-template-picker-popover>header{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:42px;padding:0 10px 0 12px;border-bottom:1px solid rgba(31,27,24,.11);background:#f5f0e9}',
    '.relphi-template-picker-popover>header strong{font:900 .72rem/1.1 system-ui,sans-serif}',
    '.relphi-template-picker-popover>header button{appearance:none;display:grid;place-items:center;width:27px;height:27px;padding:0;border:0;border-radius:999px;background:transparent;color:#675f58;cursor:pointer;font:500 1.05rem/1 system-ui,sans-serif}',
    '.relphi-template-picker-popover>header button:hover,.relphi-template-picker-popover>header button:focus-visible{outline:none;background:#e9e2da;color:#1f1b18}',
    '.relphi-template-picker-actions{padding:7px 8px;border-bottom:1px solid rgba(31,27,24,.08);background:#fffdf8}',
    '.relphi-template-picker-actions button,.relphi-new-template-form button{appearance:none;min-height:31px;padding:0 10px;border:1px solid rgba(31,27,24,.18);border-radius:999px;background:#fff;color:#2a2521;cursor:pointer;font:800 .61rem/1 system-ui,sans-serif}',
    '.relphi-template-picker-actions button.primary,.relphi-new-template-form button.primary{border-color:#dc1f18;background:#dc1f18;color:#fff}',
    '.relphi-template-picker-list{overflow:auto;overscroll-behavior:contain;padding:6px}',
    '.relphi-template-picker-list[hidden]{display:none!important}',
    '.relphi-template-picker-row{appearance:none;display:grid;gap:2px;width:100%;padding:8px 9px;border:1px solid transparent;border-radius:9px;background:transparent;color:#211d19;cursor:pointer;text-align:left}',
    '.relphi-template-picker-row:hover,.relphi-template-picker-row:focus-visible{outline:none;border-color:rgba(31,27,24,.12);background:#f6f1ea}',
    '.relphi-template-picker-row strong{font:800 .68rem/1.2 system-ui,sans-serif}',
    '.relphi-template-picker-row span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#756c64;font:600 .57rem/1.2 system-ui,sans-serif}',
    '.relphi-new-template-form{display:grid;gap:10px;overflow:auto;padding:12px;background:#fffdf8}',
    '.relphi-new-template-form[hidden]{display:none!important}',
    '.relphi-new-template-form label{display:grid;gap:4px}',
    '.relphi-new-template-form label>span{font:800 .61rem/1.1 system-ui,sans-serif}',
    '.relphi-new-template-form input,.relphi-new-template-form textarea{width:100%;box-sizing:border-box;padding:7px 9px;border:1px solid rgba(31,27,24,.24);border-radius:8px;background:#fff;color:#211d19;font:700 .68rem/1.25 system-ui,sans-serif;resize:vertical}',
    '.relphi-new-template-form input:focus,.relphi-new-template-form textarea:focus{outline:2px solid rgba(31,27,24,.16);outline-offset:1px;border-color:rgba(31,27,24,.45)}',
    '.relphi-new-template-form>div{display:flex;justify-content:flex-end;gap:6px}',
    '.relphi-template-picker-status{min-height:.9rem;margin:0;color:#7d3c32;font:650 .58rem/1.25 system-ui,sans-serif}',
    '@media(max-width:620px){.relphi-template-picker-popover{max-width:calc(100vw - 16px)}}'
  ].join('');
  document.head.appendChild(style);

  document.addEventListener('click', event => {
    const card = event.target.closest?.(PANEL + ' .card-row-board [data-row-card]');
    if (!card) return;
    if (event.target.closest('input,select,textarea,button,a,[contenteditable="true"],[data-remove-card]')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    focusLedgerResult(identityFromCard(card));
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = event.target.closest?.(PANEL + ' .card-row-board [data-row-card]');
    if (!card) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    focusLedgerResult(identityFromCard(card));
  }, true);
  document.addEventListener('pointerdown', event => {
    if (!popover || popover.hidden) return;
    const trigger = panel()?.querySelector('#relphiTemplatePickerTrigger');
    if (popover.contains(event.target) || trigger?.contains(event.target)) return;
    closePopover();
  }, true);
  window.addEventListener('resize', closePopover);
  window.addEventListener('scroll', closePopover, true);
  document.addEventListener('relphi:drawing-board-rendered', schedule);
  document.addEventListener('relphi:drawing-board-center-view', schedule);
  new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['hidden','class'] });
  schedule();
})();
