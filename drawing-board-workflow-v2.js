// Drawing Board workflow: adjacent defaults, optional numbered stickers, prefabs, full clear, and lean exports.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;

  const STICKER_TOGGLE_KEY = 'relphiDrawingBoardPositionStickersV2';
  const CARD_BACKGROUND_KEY = 'relphiDrawingBoardCardBackgroundV1';
  let scheduled = false;
  let descriptionSelectionCard = null;

  function stickersEnabled() {
    try { return localStorage.getItem(STICKER_TOGGLE_KEY) === '1'; }
    catch (_) { return false; }
  }
  function setStickersEnabled(value) {
    try { localStorage.setItem(STICKER_TOGGLE_KEY, value ? '1' : '0'); } catch (_) {}
  }
  function labelsFromField(field) {
    return String(field?.value || '').split(',').map(value => value.trim()).filter(Boolean);
  }
  function setLabels(field, labels) {
    if (!field) return;
    field.value = labels.join(', ');
    field.dispatchEvent(new Event('input', { bubbles:true }));
    field.dispatchEvent(new Event('change', { bubbles:true }));
  }
  function ensureReadyToDrawDefaults(panel) {
    if (!panel || panel.dataset.relphiReadyDefaultsApplied === 'true') return;
    const drawScope = panel.querySelector('#rowDrawScope');
    const reversals = panel.querySelector('#rowAllowReversalsQuick');
    if (!drawScope || !reversals) return;

    const hasCards = !!panel.querySelector('.card-row-board [data-row-card]');
    const hasLabels = labelsFromField(panel.querySelector('#rowPositionLabels')).length > 0;
    if (!hasCards && !hasLabels) {
      const fullPack = Array.from(drawScope.options || []).some(option => option.value === 'full');
      if (fullPack && drawScope.value !== 'full') {
        drawScope.value = 'full';
        drawScope.dispatchEvent(new Event('input', { bubbles:true }));
        drawScope.dispatchEvent(new Event('change', { bubbles:true }));
      }
      if (!reversals.checked) {
        reversals.checked = true;
        reversals.dispatchEvent(new Event('input', { bubbles:true }));
        reversals.dispatchEvent(new Event('change', { bubbles:true }));
      }
      setStickersEnabled(false);
      const stickers = panel.querySelector('#rowPositionStickersQuick');
      if (stickers?.checked) {
        stickers.checked = false;
        stickers.dispatchEvent(new Event('input', { bubbles:true }));
        stickers.dispatchEvent(new Event('change', { bubbles:true }));
      }
    }
    panel.dataset.relphiReadyDefaultsApplied = 'true';
  }
  function addStickerToggle(panel) {
    const toolbar = panel.querySelector('.card-row-icon-toolbar');
    if (!toolbar || panel.querySelector('#rowPositionStickersQuick')) return;
    const label = document.createElement('label');
    label.className = 'quick-position-sticker-toggle';
    label.title = 'Show position labels when you add them';
    label.innerHTML = '<input id="rowPositionStickersQuick" type="checkbox"' + (stickersEnabled() ? ' checked' : '') + '> Show position stickers';
    const reversals = toolbar.querySelector('.quick-reversal-toggle');
    toolbar.insertBefore(label, reversals || toolbar.firstChild);
    label.querySelector('input').addEventListener('change', event => {
      setStickersEnabled(event.currentTarget.checked);
      scheduleEnhance();
    });
  }
  function addHelpfulTip(panel) {
    const drawer = panel.querySelector('.card-row-drawing-board');
    if (!drawer || panel.querySelector('.drawing-board-helpful-tip')) return;
    const tip = document.createElement('aside');
    tip.className = 'drawing-board-helpful-tip';
    tip.innerHTML = '<strong>Helpful tip</strong><span>Use the magnet and picture controls on the board for snaps and backgrounds.</span>';
    drawer.insertAdjacentElement('afterend', tip);
  }

  function removeUnavailableSelectionControls(panel) {
    ['resetRowCardTransform', 'selectAllRow', 'clearRowSelection'].forEach(id => {
      panel.querySelector('#' + id)?.remove();
    });
  }

  function syncBoardEntryButton() {
    const panel = document.getElementById('shortListPanel');
    const trigger = document.getElementById('relphiOpenDrawingBoardCurrent');
    if (!panel || !trigger) return;
    const open = !panel.hidden;
    trigger.setAttribute('aria-expanded', String(open));
    trigger.textContent = open ? 'Close Drawing Board' : 'Open Drawing Board';
  }
  function openBoardFromLedger() {
    const panel = document.getElementById('shortListPanel');
    if (!panel) return;
    if (panel.hidden) {
      document.getElementById('landingOpenBoard')?.click();
      panel.hidden = false;
      requestAnimationFrame(() => {
        const drawer = panel.querySelector('.card-row-drawing-board');
        if (drawer?.tagName === 'DETAILS') drawer.open = true;
        syncBoardEntryButton();
        scheduleEnhance();
        panel.scrollIntoView({ behavior:'smooth', block:'start' });
      });
      return;
    }
    panel.hidden = true;
    syncBoardEntryButton();
  }
  function setArrivalState() {
    const clear = document.getElementById('clearSearch');
    if (clear) {
      clear.textContent = 'Hide Cards';
      clear.title = 'Hide card results without clearing the Drawing Board';
    }
    const panel = document.getElementById('shortListPanel');
    if (panel) panel.hidden = true;
    const trigger = document.getElementById('relphiOpenDrawingBoardCurrent');
    if (trigger && !trigger.dataset.relphiBoardEntryBound) {
      trigger.dataset.relphiBoardEntryBound = 'true';
      trigger.addEventListener('click', event => {
        event.preventDefault();
        openBoardFromLedger();
      });
    }
    syncBoardEntryButton();
  }
  function cardExportData(panel) {
    return Array.from(panel.querySelectorAll('.card-row-item[data-row-index]')).map((item, index) => {
      const card = item.querySelector('[data-row-card]');
      if (!card) return null;
      const id = card.dataset.rowCard || '';
      const title = card.querySelector('.or-card-title-banner')?.textContent.trim() || id.replace(/_/g, ' ');
      const position = item.querySelector('.card-row-position-editor')?.textContent.trim() || 'Position #' + (index + 1);
      const interpretation = card.querySelector('.or-layer-scroll span')?.textContent.trim() || '';
      return { id, title, position, interpretation, reversed:item.classList.contains('is-row-reversed') || card.dataset.rowReversed === 'true' };
    }).filter(Boolean);
  }
  function printableHtml(panel) {
    const cards = cardExportData(panel);
    const name = panel.querySelector('#rowName')?.value.trim() || 'Drawing Board';
    const notes = panel.querySelector('#rowNotes')?.value.trim() || '';
    const exportedAt = new Intl.DateTimeFormat(undefined, { dateStyle:'long', timeStyle:'short' }).format(new Date());
    const logoUrl = new URL('logo.png', location.href).href;
    const cardHtml = cards.map((card, index) => '<article class="card"><div class="position"><span>' + escapeHtml(card.position) + '</span><b>' + String(index + 1).padStart(2, '0') + '</b></div><div class="art-frame"><img class="' + (card.reversed ? 'reversed' : '') + '" src="' + optimizedCardUrl(card.id) + '" alt="' + escapeHtml(card.title + (card.reversed ? ', reversed' : ', upright')) + '"></div><div class="card-copy"><div class="card-heading"><h2>' + escapeHtml(card.title) + '</h2><span class="orientation ' + (card.reversed ? 'is-reversed' : '') + '">' + (card.reversed ? 'Reversed' : 'Upright') + '</span></div><p>' + escapeHtml(card.interpretation) + '</p></div></article>').join('');
    const notesHtml = notes ? '<section class="reading-notes"><span>Reading notes</span><p>' + escapeHtml(notes) + '</p></section>' : '';
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escapeHtml(name) + ' · Oracle of Relphi</title><style>' +
      '@page{size:A4;margin:10mm}*{box-sizing:border-box}html{background:#eee7df}body{--red:#dc1f18;--ink:#111;--paper:#fffdf8;--muted:#665e58;margin:0;font-family:Inter,Montserrat,"Segoe UI",Arial,sans-serif;color:var(--ink);background:linear-gradient(135deg,#f2ebe3,#fffaf4 46%,#eee6dd);line-height:1.45}.page{width:min(1380px,calc(100% - 32px));margin:24px auto;background:var(--paper);border:1px solid rgba(17,17,17,.14);box-shadow:0 24px 70px rgba(40,28,20,.13)}.masthead{display:grid;grid-template-columns:auto 1fr auto;gap:20px;align-items:center;padding:24px 30px;border-top:8px solid var(--red);border-bottom:1px solid rgba(17,17,17,.16);background:#111;color:#fff}.brand-mark{width:58px;height:58px;object-fit:cover;background:#fff;border:4px solid #fff}.brand-copy span,.reading-kicker,.reading-notes>span{display:block;text-transform:uppercase;letter-spacing:.15em;font-size:11px;font-weight:900;color:#ff6a62}.brand-copy strong{display:block;font-family:Georgia,serif;font-size:25px;line-height:1.05}.export-meta{text-align:right;color:#d5cec8;font-size:12px}.reading-head{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:end;padding:32px 30px 26px}.reading-head h1{margin:4px 0 0;font-family:Georgia,"Times New Roman",serif;font-size:clamp(34px,5vw,66px);line-height:.96;letter-spacing:-.035em}.reading-count{min-width:120px;text-align:center;padding:14px 18px;border:1px solid rgba(17,17,17,.18);border-radius:999px;font-weight:900}.reading-count b{color:var(--red)}.reading-notes{margin:0 30px 28px;padding:18px 20px;border-left:5px solid var(--red);background:#f7f0e9}.reading-notes p{margin:5px 0 0;white-space:pre-wrap}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;padding:0 30px 34px}.card{break-inside:avoid;display:grid;grid-template-rows:auto auto 1fr;min-width:0;border:1px solid rgba(17,17,17,.18);border-radius:18px;overflow:hidden;background:#fff;box-shadow:0 10px 28px rgba(34,24,18,.08)}.position{display:flex;justify-content:space-between;gap:12px;align-items:center;min-height:44px;padding:9px 12px;background:#111;color:#fff;font-weight:900}.position span{overflow-wrap:anywhere}.position b{color:#ff6a62;font-size:12px;letter-spacing:.12em}.art-frame{display:grid;place-items:center;aspect-ratio:320/554;padding:8px;background:linear-gradient(145deg,#f5ede5,#fff)}.card img{display:block;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 5px 8px rgba(17,17,17,.14))}.card img.reversed{transform:rotate(180deg)}.card-copy{padding:13px 14px 16px}.card-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.card h2{margin:0;font-family:Georgia,"Times New Roman",serif;font-size:18px;line-height:1.05}.orientation{flex:none;padding:4px 7px;border:1px solid rgba(17,17,17,.2);border-radius:999px;text-transform:uppercase;letter-spacing:.08em;font-size:8px;font-weight:900;color:var(--muted)}.orientation.is-reversed{border-color:rgba(220,31,24,.45);color:var(--red);background:#fff2f0}.card p{margin:9px 0 0;color:#3f3833;font-size:12px;line-height:1.45}.footer{display:flex;justify-content:space-between;gap:20px;padding:20px 30px;border-top:1px solid rgba(17,17,17,.14);color:var(--muted);font-size:12px}.footer strong{color:#111}@media(max-width:1100px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:820px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.masthead{grid-template-columns:auto 1fr}.export-meta{grid-column:1/-1;text-align:left}.reading-head{grid-template-columns:1fr}.reading-count{justify-self:start}}@media(max-width:580px){.page{width:100%;margin:0;border:0}.masthead,.reading-head{padding-left:20px;padding-right:20px}.grid{grid-template-columns:1fr;padding-left:20px;padding-right:20px}.reading-notes{margin-left:20px;margin-right:20px}.footer{flex-direction:column;padding-left:20px;padding-right:20px}}@media print{html,body{background:#fff}.page{width:100%;margin:0;border:0;box-shadow:none}.masthead{padding:12mm 8mm 7mm}.brand-mark{width:13mm;height:13mm}.reading-head{padding:8mm 8mm 6mm}.reading-head h1{font-size:28pt}.reading-notes{margin:0 8mm 7mm}.grid{grid-template-columns:repeat(3,1fr);gap:5mm;padding:0 8mm 8mm}.card{border-radius:3mm;box-shadow:none}.position{min-height:10mm;padding:2mm 3mm}.art-frame{padding:2mm}.card-copy{padding:3mm}.card h2{font-size:11pt}.card p{font-size:8pt}.footer{padding:5mm 8mm}}' +
      '</style></head><body><main class="page"><header class="masthead"><img class="brand-mark" src="' + logoUrl + '" alt="Oracle of Relphi mark"><div class="brand-copy"><span>Tarot Ledger</span><strong>Oracle of Relphi</strong></div><div class="export-meta">Prepared ' + escapeHtml(exportedAt) + '<br>Drawing Board reading</div></header><section class="reading-head"><div><span class="reading-kicker">A Relphi reading</span><h1>' + escapeHtml(name) + '</h1></div><div class="reading-count"><b>' + cards.length + '</b> card' + (cards.length === 1 ? '' : 's') + '</div></section>' + notesHtml + '<section class="grid">' + cardHtml + '</section><footer class="footer"><span><strong>Oracle of Relphi</strong> · Tarot Ledger</span><span>Created with the Relphi Drawing Board</span></footer></main></body></html>';
  }
  function optimizedCardUrl(id) {
    return new URL('assets/tarot/rws-export/' + encodeURIComponent(id) + '.webp', location.href).href;
  }
  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
  }
  function addLeanExports(panel) {
    const tools = panel.querySelector('.card-row-composer');
    if (!tools || panel.querySelector('#printRowPdf')) return;
    const optimized = document.createElement('button');
    optimized.type = 'button';
    optimized.id = 'downloadRowOptimizedHtml';
    optimized.textContent = 'Download web version';
    const pdf = document.createElement('button');
    pdf.type = 'button';
    pdf.id = 'printRowPdf';
    pdf.textContent = 'Print / save PDF';
    const imageButton = tools.querySelector('#printCardRowImage');
    tools.insertBefore(optimized, imageButton?.nextSibling || null);
    tools.insertBefore(pdf, optimized.nextSibling);
    optimized.addEventListener('click', () => {
      const blob = new Blob([printableHtml(panel)], { type:'text/html' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const rawName = panel.querySelector('#rowName')?.value.trim() || 'Drawing Board';
      const safeName = rawName.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim() || 'Drawing Board';
      link.download = safeName + '.html';
      document.body.appendChild(link); link.click(); link.remove();
    });
    pdf.addEventListener('click', () => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return window.alert('Allow pop-ups to open the PDF print view.');
      try { printWindow.opener = null; } catch (_) {}
      printWindow.document.open();
      printWindow.document.write(printableHtml(panel));
      printWindow.document.close();
      printWindow.addEventListener('load', () => setTimeout(() => printWindow.print(), 250), { once:true });
    });
  }
  function relphiLockedInterpretation(cardId) {
    const id = String(cardId || '');
    const senseCard = window.RELPHI_CARD_SENSES?.cards?.find?.(item => item.card_id === id);
    if (senseCard?.locked_relphi_interpretation) return senseCard.locked_relphi_interpretation;
    const lockedCard = window.RELPHI_LOCKED_INTERPRETATIONS?.cards?.find?.(item => item.card_id === id);
    return lockedCard?.relphi_derived_interpretation || '';
  }
  function syncDescriptionLayers(panel) {
    panel.querySelectorAll('[data-row-card]').forEach(card => {
      const id = card.dataset.rowCard || '';
      const item = card.closest('.card-row-item');
      const reversed = !!item?.classList.contains('is-row-reversed') || card.dataset.rowReversed === 'true';
      let scroll = card.querySelector('.or-layer-scroll');
      let text = scroll?.querySelector('span') || null;
      const current = text?.textContent?.trim() || '';
      const locked = relphiLockedInterpretation(id);
      const interpretation = reversed ? (current || locked) : (locked || current);
      if (!interpretation) return;
      const layer = card.querySelector('.or-card-layer.relphi-info-layer');
      if (!scroll && layer) {
        scroll = document.createElement('div');
        scroll.className = 'or-layer-scroll relphi-description-scroll';
        text = document.createElement('span');
        scroll.appendChild(text);
        layer.appendChild(scroll);
      }
      if (text) text.textContent = interpretation;
      if (layer) layer.dataset.relphiDescriptionSource = 'locked-interpretation';
    });
  }
  function workspacePictureIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"></rect><circle cx="9" cy="9" r="1.6"></circle><path d="M5.5 17l4.7-4.7 3.2 3.2 2.3-2.3 2.8 3.8"></path></svg>';
  }
  function workspaceMagnetIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3v8a6 6 0 0 0 12 0V3"></path><path d="M6 7h4M14 7h4"></path></svg>';
  }
  function workspaceMoveIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M3 12h18"></path><path d="M12 3l-2 2m2-2 2 2M12 21l-2-2m2 2 2-2M3 12l2-2m-2 2 2 2M21 12l-2-2m2 2-2 2"></path></svg>';
  }
  function cardBackgroundImage() {
    try { return localStorage.getItem(CARD_BACKGROUND_KEY) || ''; } catch (_) { return ''; }
  }
  function setCardBackgroundImage(value) {
    try {
      if (value) localStorage.setItem(CARD_BACKGROUND_KEY, value);
      else localStorage.removeItem(CARD_BACKGROUND_KEY);
    } catch (_) {}
  }
  function applyWorkspaceCardBackground(panel) {
    const board = panel.querySelector('.card-row-board');
    if (!board) return;
    const value = cardBackgroundImage();
    board.classList.toggle('has-workspace-card-background', !!value);
    if (value) board.style.setProperty('--workspace-card-background', 'url("' + value.replace(/"/g, '%22') + '")');
    else board.style.removeProperty('--workspace-card-background');
  }
  function installWorkspaceTools(panel) {
    const workspace = panel.querySelector('.card-row-workspace');
    if (!workspace) return;
    const existing = workspace.querySelector('.relphi-workspace-tools');
    if (existing) {
      applyWorkspaceCardBackground(panel);
      return;
    }

    const takeInput = id => {
      const input = panel.querySelector('#' + id);
      if (!input) return null;
      const label = input.closest('label');
      if (label && label !== input) {
        label.insertAdjacentElement('afterend', input);
        label.remove();
      }
      return input;
    };
    const take = id => panel.querySelector('#' + id);

    const alignCheck = takeInput('rowSnapEnabled');
    const alignMinus = take('rowSnapGridMinus');
    const alignValue = take('rowSnapGridValue');
    const alignPlus = take('rowSnapGridPlus');
    const rotateCheck = takeInput('rowRotationSnapEnabled');
    const rotateMinus = take('rowRotationSnapMinus');
    const rotateValue = take('rowRotationSnapValue');
    const rotatePlus = take('rowRotationSnapPlus');
    const cardColor = takeInput('rowEnvelopeColor');
    const boardColor = takeInput('rowTableColor');
    const boardUpload = take('rowTableImageUpload');
    const boardReset = take('rowTableImageReset');
    panel.querySelector('.card-row-snap-steppers')?.remove();

    const tools = document.createElement('div');
    tools.className = 'relphi-workspace-tools';
    tools.innerHTML =
      '<div class="relphi-workspace-tool-buttons">' +
        '<button type="button" class="relphi-workspace-tool-trigger" data-tool="snaps" title="Snaps" aria-label="Snaps" aria-expanded="false">' + workspaceMagnetIcon() + '</button>' +
        '<button type="button" class="relphi-workspace-tool-trigger" data-tool="background" title="Background" aria-label="Background" aria-expanded="false">' + workspacePictureIcon() + '</button>' +
      '</div>' +
      '<section class="relphi-workspace-flyout" hidden>' +
        '<div class="relphi-workspace-section" data-section="snaps"><h4>Snaps</h4><div class="relphi-snap-rows"></div></div>' +
        '<div class="relphi-workspace-section" data-section="background"><h4>Background</h4><div class="relphi-background-rows"></div></div>' +
      '</section>';

    const snapRows = tools.querySelector('.relphi-snap-rows');
    const addSnapRow = (checkbox, minus, value, plus, icon) => {
      const row = document.createElement('div');
      row.className = 'relphi-snap-row';
      if (checkbox) row.appendChild(checkbox);
      const iconWrap = document.createElement('span');
      iconWrap.className = 'relphi-snap-icon';
      iconWrap.innerHTML = icon;
      row.appendChild(iconWrap);
      if (minus) row.appendChild(minus);
      const measure = document.createElement('span');
      measure.className = 'relphi-snap-measure';
      if (value) measure.appendChild(value);
      row.appendChild(measure);
      if (plus) row.appendChild(plus);
      snapRows.appendChild(row);
    };
    if (alignCheck) alignCheck.setAttribute('aria-label','Enable position snap');
    if (rotateCheck) rotateCheck.setAttribute('aria-label','Enable rotation snap');
    addSnapRow(alignCheck, alignMinus, alignValue, alignPlus, workspaceMoveIcon());
    addSnapRow(rotateCheck, rotateMinus, rotateValue, rotatePlus, '<span class="relphi-rotate-glyph" aria-hidden="true">↻</span>');

    const backgroundRows = tools.querySelector('.relphi-background-rows');
    const cardRow = document.createElement('div');
    cardRow.className = 'relphi-background-row';
    cardRow.innerHTML =
      '<strong>Card</strong>' +
      '<button type="button" id="workspaceCardImageUpload" class="relphi-picture-action" title="Upload card background image" aria-label="Upload card background image">' + workspacePictureIcon() + '</button>' +
      '<span class="relphi-card-color-slot"></span>' +
      '<button type="button" id="workspaceCardBackgroundReset" class="relphi-reset-action" title="Clear card background" aria-label="Clear card background">×</button>' +
      '<input id="workspaceCardImageFile" type="file" accept="image/*" hidden>';
    if (cardColor) cardRow.querySelector('.relphi-card-color-slot').appendChild(cardColor);
    backgroundRows.appendChild(cardRow);

    const boardRow = document.createElement('div');
    boardRow.className = 'relphi-background-row';
    boardRow.innerHTML =
      '<strong>Board</strong><span class="relphi-board-image-slot"></span><span class="relphi-board-color-slot"></span><span class="relphi-board-reset-slot"></span>';
    if (boardUpload) {
      boardUpload.textContent = '';
      boardUpload.innerHTML = workspacePictureIcon();
      boardUpload.classList.add('relphi-picture-action');
      boardUpload.title = 'Upload board background image';
      boardUpload.setAttribute('aria-label','Upload board background image');
      boardRow.querySelector('.relphi-board-image-slot').appendChild(boardUpload);
    }
    if (boardColor) boardRow.querySelector('.relphi-board-color-slot').appendChild(boardColor);
    if (boardReset) {
      boardReset.disabled = false;
      boardReset.textContent = '×';
      boardReset.classList.add('relphi-reset-action');
      boardReset.title = 'Clear board background';
      boardReset.setAttribute('aria-label','Clear board background');
      boardRow.querySelector('.relphi-board-reset-slot').appendChild(boardReset);
    }
    backgroundRows.appendChild(boardRow);
    workspace.appendChild(tools);

    const flyout = tools.querySelector('.relphi-workspace-flyout');
    const triggers = Array.from(tools.querySelectorAll('.relphi-workspace-tool-trigger'));
    const setOpen = section => {
      const closing = !flyout.hidden && flyout.dataset.section === section;
      flyout.hidden = closing;
      flyout.dataset.section = closing ? '' : section;
      triggers.forEach(button => {
        const active = !closing && button.dataset.tool === section;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-expanded', String(active));
      });
      tools.querySelectorAll('.relphi-workspace-section').forEach(node => node.classList.toggle('is-current', !closing && node.dataset.section === section));
    };
    triggers.forEach(button => button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      setOpen(button.dataset.tool);
    }));

    const cardFile = tools.querySelector('#workspaceCardImageFile');
    tools.querySelector('#workspaceCardImageUpload')?.addEventListener('click', event => {
      event.preventDefault();
      cardFile?.click();
    });
    cardFile?.addEventListener('change', () => {
      const file = cardFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setCardBackgroundImage(String(reader.result || ''));
        applyWorkspaceCardBackground(panel);
      };
      reader.readAsDataURL(file);
      cardFile.value = '';
    });
    tools.querySelector('#workspaceCardBackgroundReset')?.addEventListener('click', event => {
      event.preventDefault();
      setCardBackgroundImage('');
      if (cardColor) {
        cardColor.value = '#f3f0ea';
        cardColor.dispatchEvent(new Event('input',{bubbles:true}));
        cardColor.dispatchEvent(new Event('change',{bubbles:true}));
      }
      applyWorkspaceCardBackground(panel);
    });
    boardReset?.addEventListener('click', () => {
      if (boardColor) {
        boardColor.value = '#fffaf0';
        boardColor.dispatchEvent(new Event('input',{bubbles:true}));
        boardColor.dispatchEvent(new Event('change',{bubbles:true}));
      }
    });
    document.addEventListener('click', event => {
      if (flyout.hidden || event.target.closest?.('.relphi-workspace-tools')) return;
      flyout.hidden = true;
      flyout.dataset.section = '';
      triggers.forEach(button => {
        button.classList.remove('is-active');
        button.setAttribute('aria-expanded','false');
      });
    });
    applyWorkspaceCardBackground(panel);
  }

  function readingOptionsResetState(panel) {
    const board = panel.querySelector('.card-row-board');
    const hasCards = !!board?.querySelector('[data-row-card]');
    const hasPositions = !!board?.querySelector('.card-row-item');
    const hasLabels = labelsFromField(panel.querySelector('#rowPositionLabels')).length > 0;
    return !hasCards && !hasPositions && !hasLabels;
  }

  function setReadingOptionsOpen(panel, open, mode) {
    const drawer = panel.querySelector('.relphi-reading-options-drawer');
    const summary = drawer?.querySelector(':scope > summary');
    if (!drawer || !summary) return;
    drawer.open = true;
    panel.dataset.relphiReadingOptionsOpen = open ? 'true' : 'false';
    if (mode) panel.dataset.relphiReadingOptionsMode = mode;
    drawer.classList.toggle('is-reading-options-open', !!open);
    summary.setAttribute('aria-expanded', String(!!open));
    summary.title = open ? 'Hide Reading Options' : 'Show Reading Options · labels, templates, and draw settings';
    summary.setAttribute('aria-label', summary.title);
  }

  function syncReadingOptionsDrawer(panel) {
    const drawer = panel.querySelector('.relphi-reading-options-drawer');
    if (!drawer) return;
    const reset = readingOptionsResetState(panel);
    const current = reset ? 'true' : 'false';
    const previous = panel.dataset.relphiReadingOptionsResetState;
    if (previous === undefined) {
      panel.dataset.relphiReadingOptionsResetState = current;
      setReadingOptionsOpen(panel, reset, reset ? 'auto-reset' : 'closed');
      return;
    }
    if (previous === current) return;
    panel.dataset.relphiReadingOptionsResetState = current;
    if (reset) {
      setReadingOptionsOpen(panel, true, 'auto-reset');
    } else if (panel.dataset.relphiReadingOptionsMode === 'auto-reset') {
      setReadingOptionsOpen(panel, false, 'closed');
    }
  }

  function installReadingOptionsDrawer(panel) {
    const drawer = panel.querySelector('.card-row-more-options');
    const summary = drawer?.querySelector(':scope > summary');
    const boardDrawer = panel.querySelector('.card-row-drawing-board');
    const workspace = panel.querySelector('.card-row-workspace');
    if (!drawer || !summary || !boardDrawer || !workspace) return;

    drawer.classList.add('relphi-reading-options-drawer');
    drawer.classList.remove('is-reading-options-idle');
    drawer.open = true;
    summary.innerHTML = '<span>Reading Options</span><small>Labels · Templates · Full Pack · Reversals</small><span class="relphi-reading-options-chevron" aria-hidden="true">⌄</span>';
    summary.setAttribute('role', 'button');

    boardDrawer.querySelectorAll(':scope > .relphi-reading-options-hotzone').forEach(node => node.remove());
    if (drawer.parentElement !== boardDrawer || drawer.nextElementSibling !== workspace) {
      workspace.insertAdjacentElement('beforebegin', drawer);
    }

    if (summary.dataset.relphiReadingOptionsBound !== 'true') {
      summary.dataset.relphiReadingOptionsBound = 'true';
      summary.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        const opening = panel.dataset.relphiReadingOptionsOpen !== 'true';
        setReadingOptionsOpen(panel, opening, opening ? 'manual' : 'closed');
      });
      summary.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        summary.click();
      });
    }
    syncReadingOptionsDrawer(panel);
  }

  function organizeBoardOptions(panel) {
    const composer = panel.querySelector('.card-row-composer');
    if (!composer || composer.classList.contains('is-relphi-organized')) return;
    composer.classList.add('is-relphi-organized');

    const control = id => {
      const element = panel.querySelector('#' + id);
      return element?.closest('label') || element;
    };
    const move = (destination, node) => { if (destination && node) destination.appendChild(node); };
    const section = (kind, host = composer) => {
      const node = document.createElement('section');
      node.className = 'card-row-control-block card-row-control-block--' + kind;
      node.id = 'board-options-' + kind;
      node.innerHTML = '<div class="board-options-body"></div>';
      host.appendChild(node);
      return node;
    };
    const setupGroup = (host, kind, title, description) => {
      const group = document.createElement('section');
      group.className = 'board-setup-group board-setup-group--' + kind;
      group.innerHTML = '<header><strong>' + title + '</strong><span>' + description + '</span></header>';
      host.appendChild(group);
      return group;
    };

    const setupSection = section('setup');
    const setup = setupSection.querySelector('.board-options-body');
    const spreadSetup = setupGroup(setup, 'spread', 'What would you like to know?', '');

    move(spreadSetup, control('rowPositionLabels'));
    move(spreadSetup, control('rowDrawScope'));

    const toggleStack = document.createElement('div');
    toggleStack.className = 'board-reading-toggle-stack';
    const stickerToggle = control('rowPositionStickersQuick');
    const repeatsToggle = control('rowAllowRepeats');
    const reversalsToggle = control('rowAllowReversalsQuick');
    if (stickerToggle) {
      const textNode = Array.from(stickerToggle.childNodes).find(node => node.nodeType === 3);
      if (textNode) textNode.textContent = ' Position stickers';
      toggleStack.appendChild(stickerToggle);
    }
    if (repeatsToggle) toggleStack.appendChild(repeatsToggle);
    if (reversalsToggle) toggleStack.appendChild(reversalsToggle);
    spreadSetup.appendChild(toggleStack);

    const boardDrawer = panel.querySelector('.card-row-drawing-board');
    const workspace = panel.querySelector('.card-row-workspace');
    installWorkspaceTools(panel);
    let afterCanvas = boardDrawer?.querySelector('#drawing-board-after-canvas');
    if (boardDrawer && workspace && !afterCanvas) {
      afterCanvas = document.createElement('section');
      afterCanvas.id = 'drawing-board-after-canvas';
      afterCanvas.className = 'drawing-board-after-canvas';
      workspace.insertAdjacentElement('afterend', afterCanvas);
    }
    if (afterCanvas) {
      let titleSection = afterCanvas.querySelector('#drawing-board-title');
      if (!titleSection) {
        titleSection = document.createElement('section');
        titleSection.id = 'drawing-board-title';
        titleSection.className = 'drawing-board-post-section drawing-board-title';
        titleSection.innerHTML = '<header><strong>Reading title</strong><span>Optional title for saving and export.</span></header><div class="drawing-board-post-body"></div>';
        afterCanvas.appendChild(titleSection);
      }
      move(titleSection.querySelector('.drawing-board-post-body'), control('rowName'));

      let notesSection = afterCanvas.querySelector('#drawing-board-notes');
      if (!notesSection) {
        notesSection = document.createElement('section');
        notesSection.id = 'drawing-board-notes';
        notesSection.className = 'drawing-board-post-section drawing-board-notes';
        notesSection.innerHTML = '<header><strong>Notes</strong><span>Write interpretation notes after you can see the cards.</span></header><div class="drawing-board-post-body"></div>';
        afterCanvas.appendChild(notesSection);
      }
      move(notesSection.querySelector('.drawing-board-post-body'), control('rowNotes'));

      let exportSection = afterCanvas.querySelector('#drawing-board-post-export');
      if (!exportSection) {
        exportSection = document.createElement('section');
        exportSection.id = 'drawing-board-post-export';
        exportSection.className = 'drawing-board-post-section drawing-board-export';
        exportSection.innerHTML = '<header><strong>Save & export</strong><span>Save or export after the reading is on the board.</span></header><div class="board-options-body"></div>';
        afterCanvas.appendChild(exportSection);
      }
      ['downloadRowHtml', 'downloadRowTextHtml', 'printCardRowImage', 'snapshotCardRowArrangement'].forEach(id => panel.querySelector('#' + id)?.remove());
      const data = panel.querySelector('#downloadRowJson');
      if (data) {
        data.textContent = 'Download board data (JSON)';
        if (!data.dataset.relphiNamedExport) {
          data.dataset.relphiNamedExport = 'true';
          data.addEventListener('click', event => {
            event.preventDefault();
            event.stopImmediatePropagation();
            const rawName = panel.querySelector('#rowName')?.value.trim() || 'Drawing Board';
            const safeName = rawName.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim() || 'Drawing Board';
            const payload = {
              name: rawName,
              notes: panel.querySelector('#rowNotes')?.value || '',
              cards: cardExportData(panel)
            };
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = safeName + '.json';
            document.body.appendChild(link);
            link.click();
            link.remove();
          }, true);
        }
      }
      move(exportSection.querySelector('.board-options-body'), panel.querySelector('#downloadRowOptimizedHtml'));
      move(exportSection.querySelector('.board-options-body'), panel.querySelector('#printRowPdf'));
      move(exportSection.querySelector('.board-options-body'), data);
    }
    move(composer, panel.querySelector('#rowTableImageFile'));

    installReadingOptionsDrawer(panel);

    organizeBoardHeader(panel);

    let primaryActions = workspace?.querySelector(':scope > .drawing-board-primary-actions');
    if (workspace && !primaryActions) {
      primaryActions = document.createElement('div');
      primaryActions.className = 'drawing-board-primary-actions';
      workspace.insertBefore(primaryActions, workspace.firstChild);
    }
    if (primaryActions) {
      let clearCards = panel.querySelector('#clearRowCardsOnly');
      if (!clearCards) {
        clearCards = document.createElement('button');
        clearCards.type = 'button';
        clearCards.id = 'clearRowCardsOnly';
        clearCards.textContent = 'Clear Cards';
        clearCards.title = 'Remove drawn cards but keep the spread and board layout';
        clearCards.setAttribute('aria-label','Clear cards and keep the board layout');
        clearCards.addEventListener('click', event => {
          event.preventDefault();
          event.stopImmediatePropagation();
          const removeNext = () => {
            const currentPanel = document.getElementById('shortListPanel');
            const remove = currentPanel?.querySelector('.card-row-board [data-shortlist][aria-pressed="true"]');
            if (!remove) {
              scheduleEnhance();
              return;
            }
            remove.click();
            window.setTimeout(removeNext, 30);
          };
          removeNext();
        }, true);
      }
      const hasCards = !!panel.querySelector('.card-row-board [data-row-card]');
      clearCards.disabled = !hasCards;
      ['undoShortList','redoShortList','drawRandomRowCard','addCardPlaceholder','clearRowCardsOnly'].forEach(id => {
        const button = panel.querySelector('#' + id);
        if (button) primaryActions.appendChild(button);
      });
    }
    const resetBoard = panel.querySelector('#clearShortList');
    if (resetBoard) {
      resetBoard.textContent = 'Reset Board';
      resetBoard.title = 'Reset the entire Drawing Board';
      resetBoard.setAttribute('aria-label', 'Reset the entire Drawing Board');
    }

    const envelopeColor = panel.querySelector('#rowEnvelopeColor');
    const applyEnvelopeColor = () => {
      const color = envelopeColor?.value || '#f3f0ea';
      const board = panel.querySelector('.short-list-row.card-row-board');
      board?.style.setProperty('--relphi-envelope-bg', color);
      board?.style.setProperty('--relphi-card-envelope-bg', color);
      board?.querySelectorAll('.card-row-item,.card-row-drop-card,.card-row-position-panel,.or-card,.relphi-surface').forEach(element => {
        element.style.setProperty('background-color', color, 'important');
      });
    };
    if (envelopeColor) {
      envelopeColor.addEventListener('input', applyEnvelopeColor);
      envelopeColor.addEventListener('change', applyEnvelopeColor);
      applyEnvelopeColor();
    }
  }
  function organizeBoardHeader(panel) {
    const toolbar = panel.querySelector('.card-row-icon-toolbar');
    if (!toolbar) return;
    toolbar.classList.add('is-relphi-modern');
    panel.querySelectorAll('.board-history-toggle,.board-history-menu,.board-header-group--history').forEach(node => {
      if (!node.querySelector?.('#undoShortList,#redoShortList')) node.remove();
    });
  }
  function reinforceReversalUi(panel) {
    const allowed = !!panel.querySelector('#rowAllowReversalsQuick')?.checked;
    panel.classList.toggle('row-reversals-disabled', !allowed);
    panel.querySelectorAll('.card-row-item.is-row-reversed').forEach(item => {
      item.querySelectorAll('.or-card-art, .spread-card-art').forEach(image => { image.style.transform = 'rotate(180deg)'; });
    });
  }
  function normalizeDisabledButtonCursors(panel) {
    panel.querySelectorAll('.card-row-drawing-board button:disabled').forEach(button => {
      button.style.setProperty('cursor', 'default', 'important');
    });
  }
  function enhance() {
    scheduled = false;
    const panel = document.getElementById('shortListPanel');
    if (!panel || panel.hidden) {
      syncBoardEntryButton();
      return;
    }
    syncBoardEntryButton();
    addStickerToggle(panel);
        ensureReadyToDrawDefaults(panel);
panel.classList.toggle('row-position-stickers-disabled', !stickersEnabled());
    addHelpfulTip(panel);
    removeUnavailableSelectionControls(panel);
    addLeanExports(panel);
    organizeBoardOptions(panel);
    syncReadingOptionsDrawer(panel);
    syncDescriptionLayers(panel);
    reinforceReversalUi(panel);
    normalizeDisabledButtonCursors(panel);
  }
  function scheduleEnhance() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(enhance);
  }
  function descriptionLayerFromEvent(event) {
    return event.target.closest?.('#shortListPanel .card-row-board .or-card-layer.relphi-info-layer, #shortListPanel .card-row-board .relphi-info-scroll');
  }
  function beginDescriptionSelection(event) {
    const description = descriptionLayerFromEvent(event);
    if (!description || event.button !== 0) return;
    const card = description.closest('[data-row-card]');
    if (!card) return;
    descriptionSelectionCard = card;
    card.draggable = false;
    card.dataset.descriptionSelecting = 'true';
    event.stopImmediatePropagation();
  }
  function endDescriptionSelection() {
    const card = descriptionSelectionCard;
    descriptionSelectionCard = null;
    if (!card) return;
    setTimeout(() => {
      if (!card.isConnected) return;
      card.draggable = true;
      delete card.dataset.descriptionSelecting;
    }, 0);
  }
  function start() {
    const style = document.createElement('style');
    style.textContent = '.quick-position-sticker-toggle{display:inline-flex;align-items:center;gap:.35rem;font-weight:750}.row-position-stickers-disabled .card-row-item:not(.card-row-placeholder-item)>.card-row-position-panel{display:none!important}.row-reversals-disabled .card-row-reverse-toggle{display:none!important}.row-sticker-prefab-controls{display:flex;align-items:center;gap:.55rem;flex-wrap:wrap;margin-top:.45rem}.row-sticker-prefab-controls small{color:#665e58;font-weight:500}.short-list-row.card-row-board .card-row-card,.short-list-row.card-row-board .card-row-drop-card{width:100%!important;margin-left:0!important;margin-right:0!important}.short-list-row.card-row-board .card-row-position-panel{margin-left:0!important;margin-right:0!important}.card-row-workspace .card-row-item .or-card-layer.relphi-info-layer,.card-row-workspace .card-row-item .or-card-layer.relphi-info-layer *{user-select:text!important;-webkit-user-select:text!important;cursor:text!important}.drawing-board-helpful-tip{display:flex;gap:.65rem;align-items:baseline;margin:.7rem .2rem 0;padding:.7rem .9rem;border-left:4px solid #dc1f18;border-radius:.65rem;background:#fff8f3;color:#3f3732}.drawing-board-helpful-tip strong{white-space:nowrap}.card-row-composer.is-relphi-organized{--board-red:#dc1f18;--board-ink:#171412;--board-line:#d8cec5;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem!important;align-items:start;padding:.9rem!important;background:#f7f2ec!important;border-radius:18px}.card-row-composer.is-relphi-organized>.card-row-control-block{display:flex!important;align-content:flex-start;align-items:center;gap:.7rem!important;min-width:0;margin:0!important;padding:1rem!important;border:1px solid var(--board-line)!important;border-radius:14px!important;background:#fff!important;box-shadow:none!important}.card-row-composer.is-relphi-organized>.card-row-control-block--writing,.card-row-composer.is-relphi-organized>.card-row-control-block--export{grid-column:1/-1}.board-options-heading{flex:0 0 100%;margin:0 0 .1rem;padding:0 0 .7rem;border-bottom:1px solid #ece4dd}.board-options-heading h4{margin:0;color:var(--board-ink);font-size:1rem;line-height:1.2}.board-options-heading p{margin:.25rem 0 0;color:#6b625c;font-size:.78rem;line-height:1.35}.card-row-composer.is-relphi-organized label{color:var(--board-ink);font-weight:750}.card-row-composer.is-relphi-organized input[type=text],.card-row-composer.is-relphi-organized select,.card-row-composer.is-relphi-organized textarea{border:1px solid #bdb3aa!important;border-radius:9px!important;background:#fff!important}.card-row-control-block--writing .card-row-name-label,.card-row-control-block--writing .card-row-position-label{flex:1 1 18rem}.card-row-control-block--writing .card-row-notes-label{flex:1 0 100%}.card-row-control-block--draw .card-row-draw-scope-label{flex:1 1 13rem}.board-snap-control{display:grid;grid-template-columns:minmax(8.5rem,1fr) 2.35rem minmax(5rem,auto) 2.35rem;align-items:center;gap:.35rem;flex:1 1 100%;padding:.45rem;border:1px solid #e1d8d0;border-radius:11px;background:#fbf8f5}.board-snap-control>label{margin:0!important}.board-snap-control>button,.card-row-composer.is-relphi-organized button{min-height:2.35rem;padding:.48rem .78rem!important;border:1px solid #aaa098!important;border-radius:9px!important;background:#fff!important;color:var(--board-ink)!important;box-shadow:none!important;font-weight:800!important}.board-snap-control>button{min-width:2.35rem;padding:.35rem!important}.board-snap-control>span{min-width:0;text-align:center;font-weight:800;color:#5f5751}.card-row-control-block--table .card-row-color-label,.card-row-control-block--table .card-row-table-color-label{display:flex;align-items:center;gap:.45rem;padding:.35rem .55rem;border:1px solid #e1d8d0;border-radius:9px;background:#fbf8f5}.card-row-control-block--table input[type=color]{width:2.4rem;height:2rem;padding:2px;border:0;background:transparent}.card-row-control-block--export #downloadRowOptimizedHtml{border-color:var(--board-red)!important;background:var(--board-red)!important;color:#fff!important}.card-row-control-block--export button{flex:1 1 10rem}.card-row-composer.is-relphi-organized button:hover:not(:disabled){border-color:var(--board-red)!important}.card-row-composer.is-relphi-organized button:focus-visible,.card-row-composer.is-relphi-organized input:focus-visible,.card-row-composer.is-relphi-organized select:focus-visible,.card-row-composer.is-relphi-organized textarea:focus-visible{outline:3px solid rgba(220,31,24,.22)!important;outline-offset:2px}.card-row-composer.is-relphi-organized button:disabled{opacity:.45}.card-row-composer.is-relphi-organized>#rowTableImageFile{display:none}@media(max-width:850px){.card-row-composer.is-relphi-organized{grid-template-columns:1fr}.card-row-composer.is-relphi-organized>.card-row-control-block{grid-column:1}.board-snap-control{grid-template-columns:minmax(7.5rem,1fr) 2.35rem minmax(4.5rem,auto) 2.35rem}}@media(max-width:520px){.board-snap-control{grid-template-columns:1fr repeat(3,auto)}.card-row-composer.is-relphi-organized>.card-row-control-block{padding:.8rem!important}}';
    style.textContent += '.card-row-drawing-board .card-row-workspace-toolbar{border-radius:12px!important}.card-row-drawing-board .card-row-workspace-toolbar .card-row-zoom-label{border-radius:8px!important}.card-row-composer.is-relphi-organized{grid-template-columns:1fr!important;gap:.35rem!important;padding:.45rem!important;background:#f7f2ec!important;border-radius:12px!important}.card-row-composer.is-relphi-organized>.card-row-control-block{display:block!important;grid-column:1!important;max-width:100%!important;box-sizing:border-box!important;overflow:visible!important;padding:0!important;border-radius:10px!important}.card-row-composer.is-relphi-organized>.card-row-control-block>*{max-width:100%;box-sizing:border-box}.card-row-composer.is-relphi-organized .board-options-heading{width:100%!important;margin:0!important;padding:0!important;border:0!important}.card-row-composer.is-relphi-organized .board-options-toggle{display:flex!important;width:100%!important;min-height:2.35rem!important;align-items:center!important;justify-content:space-between!important;gap:.75rem!important;padding:.45rem .65rem!important;border:0!important;border-radius:9px!important;background:#fff!important;color:#171412!important;text-align:left!important}.card-row-composer.is-relphi-organized .board-options-toggle:hover,.card-row-composer.is-relphi-organized .board-options-toggle:focus-visible{background:#fff8f3!important;color:#171412!important}.board-options-toggle>span:first-child{font-size:.9rem;font-weight:900}.board-options-chevron{color:#dc1f18;font-size:1.15rem;font-weight:900;line-height:1}.card-row-control-block:not(.is-collapsed) .board-options-chevron{transform:rotate(45deg)}.card-row-composer.is-relphi-organized .board-options-body{display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:.6rem!important;width:100%!important;padding:.65rem!important;border-top:1px solid #ece4dd!important}.card-row-composer.is-relphi-organized .card-row-control-block.is-collapsed>.board-options-body{display:none!important}.card-row-composer.is-relphi-organized .board-snap-control{width:100%!important}';
    style.textContent += '.card-row-composer.is-relphi-organized .card-row-control-block--layout .board-options-body{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:.5rem!important}.card-row-composer.is-relphi-organized .card-row-control-block--layout.is-collapsed>.board-options-body{display:none!important}.card-row-composer.is-relphi-organized .board-snap-control{grid-template-columns:minmax(6.5rem,1fr) 2rem minmax(3.7rem,auto) 2rem!important;width:auto!important;min-height:2.55rem!important;padding:.25rem!important;gap:.25rem!important}.card-row-composer.is-relphi-organized .board-snap-control>button{min-width:2rem!important;min-height:2rem!important;padding:.2rem!important}.card-row-composer.is-relphi-organized .board-snap-control>label{font-size:.82rem!important}.card-row-composer.is-relphi-organized .board-snap-control>span{font-size:.8rem!important}@media(max-width:720px){.card-row-composer.is-relphi-organized .card-row-control-block--layout .board-options-body{grid-template-columns:1fr!important}}';
    style.textContent += '.card-row-workspace .or-card-layer.relphi-info-layer,.card-row-workspace .or-card-layer.relphi-info-layer *,.card-row-workspace .relphi-info-scroll,.card-row-workspace .relphi-info-scroll *{pointer-events:auto!important;user-select:text!important;-webkit-user-select:text!important;-webkit-user-drag:none!important;touch-action:pan-y!important}';
    style.textContent += 'html body #shortListPanel .card-row-drawing-board,html body #shortListPanel .card-row-drawing-board button,html body #shortListPanel .card-row-drawing-board input,html body #shortListPanel .card-row-drawing-board select,html body #shortListPanel .card-row-drawing-board textarea{font-family:Montserrat,"Segoe UI",Arial,sans-serif!important}html body #shortListPanel .card-row-composer.is-relphi-organized{display:block!important;margin:0!important;padding:.45rem!important;border-radius:10px!important;background:#f5f0ea!important}html body #shortListPanel .board-options-tabs{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:.35rem!important;margin:0!important}html body #shortListPanel .board-options-tabs .board-options-toggle{width:100%!important;min-width:0!important;min-height:2.25rem!important;padding:.4rem .5rem!important;border:1px solid #c9c0b8!important;border-radius:8px!important;background:#fff!important;color:#171412!important;font-size:.78rem!important;font-weight:800!important;line-height:1.15!important;text-align:center!important;white-space:normal!important;box-shadow:none!important}html body #shortListPanel .board-options-tabs .board-options-toggle[aria-expanded="true"]{border-color:#dc1f18!important;background:#fff4f1!important;color:#b81712!important}html body #shortListPanel .card-row-composer.is-relphi-organized>.card-row-control-block{display:block!important;width:100%!important;margin:.4rem 0 0!important;padding:0!important;border:1px solid #d8cec5!important;border-radius:9px!important;background:#fff!important;box-shadow:none!important}html body #shortListPanel .card-row-composer.is-relphi-organized>.card-row-control-block.is-collapsed{display:none!important}html body #shortListPanel .card-row-composer.is-relphi-organized .board-options-body{display:flex!important;flex-wrap:wrap!important;align-items:end!important;gap:.5rem!important;width:100%!important;padding:.6rem!important;border:0!important}html body #shortListPanel .card-row-control-block--writing .board-options-body{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;align-items:start!important}html body #shortListPanel .card-row-control-block--writing .card-row-name-label{grid-column:1!important}html body #shortListPanel .card-row-control-block--writing .card-row-position-label{grid-column:2!important}html body #shortListPanel .card-row-control-block--writing .card-row-notes-label{grid-column:1/-1!important}html body #shortListPanel .card-row-composer.is-relphi-organized label{min-width:0!important;margin:0!important;color:#171412!important;font-size:.78rem!important;font-weight:800!important;line-height:1.2!important}html body #shortListPanel .card-row-composer.is-relphi-organized input[type="text"],html body #shortListPanel .card-row-composer.is-relphi-organized select,html body #shortListPanel .card-row-composer.is-relphi-organized textarea{display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;min-height:2.35rem!important;margin:.25rem 0 0!important;padding:.45rem .6rem!important;border:1px solid #bdb3aa!important;border-radius:7px!important;background:#fff!important;color:#171412!important;font-size:.84rem!important;font-weight:600!important;line-height:1.25!important;box-sizing:border-box!important;box-shadow:none!important}html body #shortListPanel .card-row-composer.is-relphi-organized textarea{height:2.75rem!important;resize:vertical!important}html body #shortListPanel .row-sticker-prefab-controls{display:flex!important;align-items:center!important;gap:.45rem!important;margin:.35rem 0 0!important}html body #shortListPanel .row-sticker-prefab-controls small{font-size:.7rem!important;line-height:1.2!important;color:#6b625c!important}html body #shortListPanel .card-row-composer.is-relphi-organized button:not(.board-options-toggle){min-height:2.25rem!important;padding:.4rem .65rem!important;border:1px solid #aaa098!important;border-radius:7px!important;background:#fff!important;color:#171412!important;font-size:.78rem!important;font-weight:800!important;line-height:1.1!important;box-shadow:none!important}html body #shortListPanel .card-row-drawing-board input[type="checkbox"]{accent-color:#111!important}html body #shortListPanel .card-row-icon-toolbar button,html body #shortListPanel .card-row-icon-toolbar label{border-radius:8px!important;font-size:.78rem!important}html body #shortListPanel .card-row-control-block--layout .board-options-body{grid-template-columns:repeat(2,minmax(0,1fr))!important}html body #shortListPanel .board-snap-control{min-width:0!important;border-radius:7px!important;background:#faf7f3!important}html body #shortListPanel .card-row-control-block--table .card-row-color-label,html body #shortListPanel .card-row-control-block--table .card-row-table-color-label{border-radius:7px!important}@media(max-width:760px){html body #shortListPanel .board-options-tabs{grid-template-columns:repeat(2,minmax(0,1fr))!important}html body #shortListPanel .card-row-control-block--writing .board-options-body{grid-template-columns:1fr!important}html body #shortListPanel .card-row-control-block--writing .card-row-name-label,html body #shortListPanel .card-row-control-block--writing .card-row-position-label,html body #shortListPanel .card-row-control-block--writing .card-row-notes-label{grid-column:1!important}html body #shortListPanel .card-row-control-block--layout .board-options-body{grid-template-columns:1fr!important}}';
    style.textContent += 'html body #shortListPanel .board-options-tabs{grid-template-columns:repeat(3,minmax(0,1fr))!important}html body #shortListPanel .card-row-control-block--setup .board-options-body{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;align-items:start!important}html body #shortListPanel .card-row-control-block--setup .card-row-name-label{grid-column:1!important}html body #shortListPanel .card-row-control-block--setup .card-row-position-label{grid-column:2!important}html body #shortListPanel .card-row-control-block--setup .card-row-draw-scope-label{grid-column:1!important}html body #shortListPanel .card-row-control-block--setup .spread-toggle{grid-column:2!important;align-self:end!important;min-height:2.35rem!important;display:flex!important;align-items:center!important;gap:.4rem!important}html body #shortListPanel .card-row-control-block--setup .card-row-notes-label{grid-column:1/-1!important}html body #shortListPanel .card-row-control-block--tools .board-options-body{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;align-items:end!important}html body #shortListPanel .card-row-control-block--tools .board-snap-control{width:100%!important}html body #shortListPanel .card-row-control-block--tools button{width:100%!important}@media(max-width:760px){html body #shortListPanel .board-options-tabs{grid-template-columns:1fr!important}html body #shortListPanel .card-row-control-block--setup .board-options-body,html body #shortListPanel .card-row-control-block--tools .board-options-body{grid-template-columns:1fr!important}html body #shortListPanel .card-row-control-block--setup .card-row-name-label,html body #shortListPanel .card-row-control-block--setup .card-row-position-label,html body #shortListPanel .card-row-control-block--setup .card-row-draw-scope-label,html body #shortListPanel .card-row-control-block--setup .spread-toggle,html body #shortListPanel .card-row-control-block--setup .card-row-notes-label{grid-column:1!important}}';
    style.textContent += 'html body #shortListPanel .board-options-tabs{grid-template-columns:repeat(2,minmax(0,1fr))!important}html body #shortListPanel .board-arrange-flyout{position:relative!important;display:block!important;margin-left:auto!important;font-family:Montserrat,"Segoe UI",Arial,sans-serif!important}html body #shortListPanel .board-arrange-trigger{min-height:1.8rem!important;padding:.22rem .55rem!important;border:1px solid #aaa098!important;border-radius:7px!important;background:#fff!important;color:#171412!important;font-size:.74rem!important;font-weight:800!important;box-shadow:none!important}html body #shortListPanel .board-arrange-trigger[aria-expanded="true"]{border-color:#dc1f18!important;background:#fff4f1!important;color:#b81712!important}html body #shortListPanel .board-arrange-flyout>.card-row-control-block{position:absolute!important;top:calc(100% + .35rem)!important;right:0!important;z-index:120!important;display:block!important;width:min(34rem,calc(100vw - 3rem))!important;margin:0!important;padding:0!important;border:1px solid #cfc5bc!important;border-radius:9px!important;background:#fff!important;box-shadow:0 12px 30px rgba(30,20,15,.16)!important}html body #shortListPanel .board-arrange-flyout>.card-row-control-block.is-collapsed{display:none!important}html body #shortListPanel .board-arrange-flyout .board-options-body{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;align-items:end!important;gap:.4rem!important;padding:.45rem!important}html body #shortListPanel .board-arrange-flyout .board-snap-control{grid-template-columns:minmax(5.5rem,1fr) 1.8rem minmax(3.4rem,auto) 1.8rem!important;min-height:2.25rem!important;width:100%!important;padding:.2rem!important;border-radius:7px!important}html body #shortListPanel .board-arrange-flyout .board-snap-control>button{min-width:1.8rem!important;min-height:1.8rem!important;padding:.15rem!important;border-radius:6px!important}html body #shortListPanel .board-arrange-flyout label{min-width:0!important;margin:0!important;font-size:.72rem!important;font-weight:800!important;line-height:1.15!important}html body #shortListPanel .board-arrange-flyout button:not(.board-arrange-trigger){min-height:2rem!important;padding:.3rem .5rem!important;border:1px solid #aaa098!important;border-radius:7px!important;background:#fff!important;color:#171412!important;font-size:.72rem!important;font-weight:800!important;box-shadow:none!important}html body #shortListPanel .board-arrange-flyout input[type="color"]{width:2.2rem!important;height:1.8rem!important}html body #shortListPanel .short-list-row.card-row-board .card-row-placeholder-item{height:max-content!important;min-height:0!important;max-height:none!important;grid-template-rows:auto auto!important}html body #shortListPanel .short-list-row.card-row-board .card-row-placeholder-item .card-row-drop-card{height:auto!important;min-height:0!important;max-height:none!important;aspect-ratio:500/866!important}@media(max-width:700px){html body #shortListPanel .board-arrange-flyout .board-options-body{grid-template-columns:1fr!important}html body #shortListPanel .board-options-tabs{grid-template-columns:1fr!important}}';
    style.textContent += 'html body #shortListPanel .card-row-control-block--setup .card-row-position-label{grid-column:1/-1!important;grid-row:1!important}html body #shortListPanel .card-row-control-block--setup .card-row-name-label{grid-column:1!important;grid-row:2!important}html body #shortListPanel .card-row-control-block--setup .card-row-draw-scope-label{grid-column:2!important;grid-row:2!important}html body #shortListPanel .card-row-control-block--setup .spread-toggle{grid-column:1!important;grid-row:3!important}html body #shortListPanel .card-row-control-block--setup .card-row-notes-label{grid-column:2!important;grid-row:3!important}@media(max-width:760px){html body #shortListPanel .card-row-control-block--setup .card-row-position-label,html body #shortListPanel .card-row-control-block--setup .card-row-name-label,html body #shortListPanel .card-row-control-block--setup .card-row-draw-scope-label,html body #shortListPanel .card-row-control-block--setup .spread-toggle,html body #shortListPanel .card-row-control-block--setup .card-row-notes-label{grid-column:1!important;grid-row:auto!important}}';
    style.textContent += 'html body #shortListPanel .short-list-drawer.card-row-drawing-board>summary{padding:.65rem .75rem!important;border-bottom:1px solid #e6ddd5!important}html body #shortListPanel .card-row-icon-toolbar.is-relphi-modern{display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:.35rem!important}html body #shortListPanel .board-header-group{display:inline-flex!important;align-items:center!important;gap:.3rem!important}html body #shortListPanel .board-header-group--create{padding-right:.35rem!important;border-right:1px solid #ddd4cc!important}html body #shortListPanel .board-header-group--choices{gap:.5rem!important}html body #shortListPanel .board-header-group--choices label{display:inline-flex!important;align-items:center!important;gap:.3rem!important;min-height:2.2rem!important;margin:0!important;padding:.35rem .5rem!important;border:1px solid #d0c7bf!important;border-radius:8px!important;background:#fff!important;font-size:.76rem!important;font-weight:800!important;white-space:nowrap!important}html body #shortListPanel .board-header-group--history{position:relative!important}html body #shortListPanel .board-history-toggle::after{content:" ▾";font-size:.68rem}html body #shortListPanel .board-history-menu{position:absolute!important;right:0!important;top:calc(100% + .35rem)!important;z-index:140!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:.3rem!important;min-width:10rem!important;padding:.4rem!important;border:1px solid #cec4bb!important;border-radius:9px!important;background:#fff!important;box-shadow:0 12px 28px rgba(30,20,15,.15)!important}html body #shortListPanel .board-history-menu[hidden]{display:none!important}html body #shortListPanel .board-clear-action:not(:disabled){border-color:rgba(220,31,24,.48)!important;color:#b81712!important}html body #shortListPanel .card-row-more-options>summary{text-transform:none!important;letter-spacing:0!important;font-size:.78rem!important}html body #shortListPanel .card-row-control-block--setup .board-options-body{display:grid!important;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr) minmax(0,.85fr)!important;gap:.55rem!important;padding:.55rem!important;align-items:stretch!important}html body #shortListPanel .board-setup-group{display:flex!important;flex-direction:column!important;gap:.45rem!important;min-width:0!important;padding:.6rem!important;border:1px solid #ded5cd!important;border-radius:9px!important;background:#fff!important}html body #shortListPanel .board-setup-group>header{display:flex!important;flex-direction:column!important;gap:.12rem!important;padding-bottom:.42rem!important;border-bottom:1px solid #eee7e1!important}html body #shortListPanel .board-setup-group>header strong{font-size:.82rem!important;line-height:1.15!important}html body #shortListPanel .board-setup-group>header span{color:#6b625c!important;font-size:.68rem!important;font-weight:550!important;line-height:1.25!important}html body #shortListPanel .board-setup-group label{width:100%!important}html body #shortListPanel .board-setup-group .card-row-position-label,html body #shortListPanel .board-setup-group .card-row-name-label,html body #shortListPanel .board-setup-group .card-row-draw-scope-label,html body #shortListPanel .board-setup-group .card-row-notes-label,html body #shortListPanel .board-setup-group .spread-toggle{grid-column:auto!important;grid-row:auto!important}html body #shortListPanel .board-setup-group--draw .spread-toggle{margin-top:auto!important;min-height:2.35rem!important;display:flex!important;align-items:center!important;gap:.4rem!important}html body #shortListPanel .card-row-workspace-toolbar{display:grid!important;grid-template-columns:auto minmax(12rem,1fr) auto auto!important;align-items:center!important;gap:.45rem!important;padding:.38rem .5rem!important;border:1px solid #d5ccc4!important;background:rgba(255,253,248,.95)!important}html body #shortListPanel .card-row-workspace-toolbar .card-row-zoom-label{grid-column:1!important;grid-row:1!important;margin:0!important}html body #shortListPanel .card-row-workspace-toolbar .card-row-pan-note{grid-column:2!important;grid-row:1!important;min-width:0!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}html body #shortListPanel .card-row-workspace-toolbar #resetCardRowPan{grid-column:3!important;grid-row:1!important}html body #shortListPanel .card-row-workspace-toolbar .board-arrange-flyout{grid-column:4!important;grid-row:1!important;margin:0!important}@media(max-width:940px){html body #shortListPanel .card-row-control-block--setup .board-options-body{grid-template-columns:1fr 1fr!important}html body #shortListPanel .board-setup-group--spread{grid-column:1/-1!important}}@media(max-width:720px){html body #shortListPanel .short-list-drawer.card-row-drawing-board>summary{align-items:flex-start!important}html body #shortListPanel .card-row-icon-toolbar.is-relphi-modern{justify-content:flex-start!important}html body #shortListPanel .board-header-group--choices{order:4!important;flex-basis:100%!important}html body #shortListPanel .card-row-control-block--setup .board-options-body{grid-template-columns:1fr!important}html body #shortListPanel .board-setup-group--spread{grid-column:auto!important}html body #shortListPanel .card-row-workspace-toolbar{grid-template-columns:1fr auto auto!important}html body #shortListPanel .card-row-workspace-toolbar .card-row-zoom-label{grid-column:1/-1!important;grid-row:1!important}html body #shortListPanel .card-row-workspace-toolbar .card-row-pan-note{grid-column:1!important;grid-row:2!important}html body #shortListPanel .card-row-workspace-toolbar #resetCardRowPan{grid-column:2!important;grid-row:2!important}html body #shortListPanel .card-row-workspace-toolbar .board-arrange-flyout{grid-column:3!important;grid-row:2!important}}';
    style.textContent += 'html body #shortListPanel .card-row-composer.is-relphi-organized .card-row-control-block--setup .board-options-body{display:grid!important;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr) minmax(0,.85fr)!important;align-items:stretch!important}html body #shortListPanel .card-row-composer.is-relphi-organized .board-setup-group>label{flex:none!important}html body #shortListPanel .board-setup-group .quick-position-sticker-toggle,html body #shortListPanel .board-setup-group .quick-reversal-toggle{display:flex!important;flex-direction:row!important;align-items:center!important;gap:.4rem!important;min-height:2.35rem!important;margin-top:auto!important;padding:.4rem .55rem!important;border:1px solid #ded5cd!important;border-radius:8px!important;background:#fbf8f5!important}html body #shortListPanel .board-setup-group .quick-position-sticker-toggle input,html body #shortListPanel .board-setup-group .quick-reversal-toggle input{margin:0!important}@media(max-width:940px){html body #shortListPanel .card-row-composer.is-relphi-organized .card-row-control-block--setup .board-options-body{grid-template-columns:1fr 1fr!important}}@media(max-width:720px){html body #shortListPanel .card-row-composer.is-relphi-organized .card-row-control-block--setup .board-options-body{grid-template-columns:1fr!important}}';
    style.textContent += 'html body #shortListPanel .board-setup-group--draw .spread-toggle,html body #shortListPanel .board-setup-group--draw .quick-reversal-toggle{display:flex!important;flex-direction:row!important;align-items:center!important;gap:.4rem!important;width:100%!important;min-height:2.35rem!important;margin-top:auto!important;padding:.4rem .55rem!important;border:1px solid #ded5cd!important;border-radius:8px!important;background:#fbf8f5!important;box-sizing:border-box!important}html body #shortListPanel .board-setup-group--draw .spread-toggle input,html body #shortListPanel .board-setup-group--draw .quick-reversal-toggle input{flex:0 0 auto!important;width:1rem!important;height:1rem!important;margin:0!important}html body #shortListPanel #undoShortList:disabled,html body #shortListPanel #redoShortList:disabled,html body #shortListPanel #clearShortList:disabled{opacity:.4!important;border:1px solid rgba(17,17,17,.28)!important;background:#fffdf8!important;color:rgba(17,17,17,.48)!important;box-shadow:none!important;cursor:default!important}';
    style.textContent += 'html body #shortListPanel .board-labels-staging{display:none!important}html body #shortListPanel .card-row-composer.is-relphi-organized .card-row-control-block--setup .board-options-body{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important}';
    style.textContent += 'html body #shortListPanel .card-row-composer.is-relphi-organized{padding:.55rem!important;background:#f5f0ea!important}html body #shortListPanel .card-row-composer.is-relphi-organized>.card-row-control-block{display:block!important;width:100%!important;margin:0 0 .55rem!important;padding:0!important;border:1px solid #d8cec5!important;border-radius:9px!important;background:#fff!important}html body #shortListPanel .card-row-control-block--setup .board-options-body{display:grid!important;grid-template-columns:minmax(0,1.35fr) minmax(0,.9fr) minmax(0,.95fr)!important;gap:.55rem!important;padding:.55rem!important}html body #shortListPanel .card-row-control-block--tools .board-options-body{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:.5rem!important;padding:.6rem!important;align-items:end!important}html body #shortListPanel .card-row-control-block--tools .board-options-heading{grid-column:1/-1!important}html body #shortListPanel .board-setup-group--draw .spread-toggle,html body #shortListPanel .board-setup-group--draw .quick-reversal-toggle{border:2px solid #cfc5bc!important;background:#fffaf4!important;font-weight:900!important}html body #shortListPanel .board-setup-group--draw .spread-toggle:has(input:checked),html body #shortListPanel .board-setup-group--draw .quick-reversal-toggle:has(input:checked){border-color:#171412!important;background:#f1ece6!important}html body #shortListPanel .drawing-board-after-canvas{display:grid!important;gap:.65rem!important;margin:.7rem 0 0!important}html body #shortListPanel .drawing-board-post-section{display:grid!important;gap:.5rem!important;padding:.7rem!important;border:1px solid #d8cec5!important;border-radius:10px!important;background:#fff!important}html body #shortListPanel .drawing-board-post-section>header{display:flex!important;flex-direction:column!important;gap:.12rem!important}html body #shortListPanel .drawing-board-post-section>header strong{font-size:.9rem!important}html body #shortListPanel .drawing-board-post-section>header span{color:#6b625c!important;font-size:.72rem!important}html body #shortListPanel .drawing-board-post-body,html body #shortListPanel #drawing-board-post-export .board-options-body{display:flex!important;flex-wrap:wrap!important;gap:.5rem!important;align-items:end!important}html body #shortListPanel #drawing-board-notes .card-row-notes-label{width:100%!important;margin:0!important}html body #shortListPanel #drawing-board-notes textarea{display:block!important;width:100%!important;min-height:6rem!important;margin:.3rem 0 0!important;box-sizing:border-box!important}html body #shortListPanel #drawing-board-post-export button{flex:1 1 12rem!important}html body #shortListPanel .card-row-workspace .or-card-layer.relphi-info-layer .or-layer-scroll{display:block!important;visibility:visible!important;opacity:1!important}html body #shortListPanel .card-row-workspace .or-card-layer.relphi-info-layer .or-layer-scroll span{white-space:normal!important}@media(max-width:940px){html body #shortListPanel .card-row-control-block--setup .board-options-body{grid-template-columns:1fr 1fr!important}html body #shortListPanel .board-setup-group--spread{grid-column:1/-1!important}}@media(max-width:700px){html body #shortListPanel .card-row-control-block--setup .board-options-body,html body #shortListPanel .card-row-control-block--tools .board-options-body{grid-template-columns:1fr!important}html body #shortListPanel .board-setup-group--spread{grid-column:auto!important}}';
    style.textContent += 'html body #shortListPanel .card-row-control-block--setup .board-options-body{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;align-items:start!important;gap:.55rem!important}html body #shortListPanel .board-setup-group--arrange{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:.42rem!important;align-content:start!important}html body #shortListPanel .board-setup-group--arrange>header{grid-column:1/-1!important;margin:0!important;padding-bottom:.35rem!important}html body #shortListPanel .board-setup-group--arrange .board-snap-control{display:grid!important;grid-template-columns:minmax(4.4rem,1fr) 1.85rem minmax(2.7rem,auto) 1.85rem!important;gap:.22rem!important;min-height:2.15rem!important;width:100%!important;padding:.22rem!important;border-radius:8px!important;box-sizing:border-box!important}html body #shortListPanel .board-setup-group--arrange .board-snap-control>label{font-size:.72rem!important;line-height:1.1!important;text-align:left!important}html body #shortListPanel .board-setup-group--arrange .board-snap-control>button{min-width:1.85rem!important;width:1.85rem!important;min-height:1.85rem!important;height:1.85rem!important;padding:.1rem!important}html body #shortListPanel .board-setup-group--arrange .board-snap-control>span{font-size:.72rem!important;white-space:nowrap!important}html body #shortListPanel .board-arrange-colors{grid-column:1/-1!important;display:flex!important;align-items:end!important;gap:.7rem!important;padding:.08rem 0!important}html body #shortListPanel .board-arrange-colors>label{flex:0 1 auto!important;width:auto!important;font-size:.72rem!important;white-space:nowrap!important}html body #shortListPanel .board-arrange-colors input[type="color"]{display:block!important;width:3rem!important;height:1.8rem!important;margin-top:.18rem!important}html body #shortListPanel .board-arrange-actions{grid-column:1/-1!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:.35rem!important}html body #shortListPanel .board-arrange-actions>button{width:100%!important;min-height:2rem!important;padding:.32rem .4rem!important;font-size:.7rem!important;line-height:1.1!important}html body #shortListPanel .card-row-composer.is-relphi-organized>.card-row-control-block--tools{display:none!important}@media(max-width:860px){html body #shortListPanel .card-row-control-block--setup .board-options-body{grid-template-columns:1fr!important}html body #shortListPanel .board-setup-group--arrange{grid-template-columns:1fr 1fr!important}}@media(max-width:560px){html body #shortListPanel .board-setup-group--arrange{grid-template-columns:1fr!important}html body #shortListPanel .board-setup-group--arrange>header,html body #shortListPanel .board-arrange-colors,html body #shortListPanel .board-arrange-actions{grid-column:1!important}html body #shortListPanel .board-arrange-actions{grid-template-columns:1fr!important}}';
    style.textContent += 'html body #shortListPanel .card-row-drawing-board:has(.card-row-composer:not(.is-relphi-organized)){visibility:hidden!important}html body #shortListPanel .card-row-drawing-board:has(.card-row-composer.is-relphi-organized){visibility:visible!important}';
    style.textContent += 'html body #shortListPanel .board-setup-group--spread>header span:empty{display:none!important}html body #shortListPanel .board-reading-behavior-row{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:.4rem!important;align-items:stretch!important;width:100%!important;margin-top:.1rem!important}html body #shortListPanel .board-reading-behavior-row>label{display:flex!important;align-items:center!important;gap:.4rem!important;min-height:2.25rem!important;margin:0!important;padding:.38rem .5rem!important;border:1px solid #ded5cd!important;border-radius:8px!important;background:#fbf8f5!important;box-sizing:border-box!important}html body #shortListPanel .board-reading-behavior-row>label::after{margin-left:auto!important}@media(max-width:620px){html body #shortListPanel .board-reading-behavior-row{grid-template-columns:1fr!important}}';
    style.textContent += 'html body #shortListPanel .card-row-control-block--setup .board-options-body{display:block!important;padding:.55rem!important}html body #shortListPanel .board-setup-group--spread{display:flex!important;flex-direction:column!important;gap:.5rem!important;width:100%!important;max-width:none!important}html body #shortListPanel .board-setup-group--spread .card-row-draw-scope-label{order:30!important;width:100%!important;margin:.05rem 0!important}html body #shortListPanel .board-reading-toggle-stack{order:40!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:.32rem!important;width:100%!important}html body #shortListPanel .board-reading-toggle-stack>label{display:grid!important;grid-template-columns:1rem minmax(0,1fr) auto!important;align-items:center!important;column-gap:.55rem!important;width:100%!important;min-height:2.25rem!important;margin:0!important;padding:.38rem .55rem!important;border:1px solid #ded5cd!important;border-radius:8px!important;background:#fbf8f5!important;box-sizing:border-box!important;font-weight:800!important}html body #shortListPanel .board-reading-toggle-stack>label input[type="checkbox"]{grid-column:1!important;width:1rem!important;height:1rem!important;margin:0!important}html body #shortListPanel .board-reading-toggle-stack>label::after{grid-column:3!important;margin:0!important}html body #shortListPanel .drawing-board-primary-actions{display:flex!important;flex-wrap:wrap!important;justify-content:flex-end!important;gap:.4rem!important;margin:.5rem .45rem!important;padding:.5rem!important;border:1px solid #ded5cd!important;border-radius:9px!important;background:#fffaf4!important}html body #shortListPanel .drawing-board-primary-actions button{min-height:2.35rem!important;padding:.45rem .75rem!important;border:1px solid #aaa098!important;border-radius:8px!important;background:#fff!important;color:#171412!important;font-weight:850!important}html body #shortListPanel .drawing-board-primary-actions #drawRandomRowCard{border-color:#dc1f18!important;background:#dc1f18!important;color:#fff!important}html body #shortListPanel .drawing-board-primary-actions #clearShortList:not(:disabled){border-color:rgba(220,31,24,.45)!important;color:#b81712!important}html body #shortListPanel .board-header-group--create{display:none!important}html body #shortListPanel .relphi-workspace-tools{position:absolute!important;left:.65rem!important;bottom:.65rem!important;z-index:1600!important;display:flex!important;align-items:flex-end!important;gap:.35rem!important;font-family:Montserrat,"Segoe UI",Arial,sans-serif!important}html body #shortListPanel .relphi-workspace-tool-buttons{display:flex!important;gap:.25rem!important;padding:.26rem!important;border:1px solid rgba(23,20,18,.24)!important;border-radius:9px!important;background:rgba(255,250,244,.96)!important;box-shadow:0 4px 12px rgba(30,20,15,.12)!important}html body #shortListPanel .relphi-workspace-tool-trigger,html body #shortListPanel .relphi-picture-action,html body #shortListPanel .relphi-reset-action,html body #shortListPanel .relphi-snap-row>button{display:grid!important;place-items:center!important;width:2rem!important;min-width:2rem!important;height:2rem!important;min-height:2rem!important;margin:0!important;padding:.3rem!important;border:1px solid #aaa098!important;border-radius:7px!important;background:#fff!important;color:#171412!important;box-shadow:none!important}html body #shortListPanel .relphi-workspace-tool-trigger svg,html body #shortListPanel .relphi-picture-action svg,html body #shortListPanel .relphi-snap-measure svg{display:block!important;width:1.05rem!important;height:1.05rem!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important}html body #shortListPanel .relphi-workspace-tool-trigger.is-active{border-color:#171412!important;background:#f1ece6!important}html body #shortListPanel .relphi-workspace-flyout{position:absolute!important;left:0!important;bottom:calc(100% + .4rem)!important;width:min(22rem,calc(100vw - 2rem))!important;padding:.7rem!important;border:1px solid #cfc5bc!important;border-radius:10px!important;background:#fffaf4!important;box-shadow:0 12px 28px rgba(30,20,15,.16)!important}html body #shortListPanel .relphi-workspace-flyout[hidden]{display:none!important}html body #shortListPanel .relphi-workspace-section{display:grid!important;gap:.42rem!important;padding:.15rem 0!important}html body #shortListPanel .relphi-workspace-section+ .relphi-workspace-section{margin-top:.7rem!important;padding-top:.7rem!important;border-top:1px solid #e6ddd5!important}html body #shortListPanel .relphi-workspace-section h4{margin:0!important;font-size:1rem!important}html body #shortListPanel .relphi-snap-rows,html body #shortListPanel .relphi-background-rows{display:grid!important;gap:.4rem!important}html body #shortListPanel .relphi-snap-row{display:grid!important;grid-template-columns:1.2rem 2rem minmax(5rem,1fr) 2rem!important;gap:.35rem!important;align-items:center!important}html body #shortListPanel .relphi-snap-row>input[type="checkbox"]{width:1rem!important;height:1rem!important;margin:0!important}html body #shortListPanel .relphi-snap-measure{display:flex!important;align-items:center!important;justify-content:center!important;gap:.35rem!important;min-height:2rem!important;padding:.25rem .45rem!important;border:1px solid #e1d8d0!important;border-radius:7px!important;background:#fff!important;font-weight:850!important;white-space:nowrap!important}html body #shortListPanel .relphi-snap-value-slot>span{font-size:.78rem!important;font-weight:850!important}html body #shortListPanel .relphi-rotate-glyph{font-size:1.1rem!important}html body #shortListPanel .relphi-background-row{display:grid!important;grid-template-columns:minmax(3.8rem,1fr) 2rem 2.6rem 2rem!important;gap:.35rem!important;align-items:center!important}html body #shortListPanel .relphi-background-row>strong{font-size:.82rem!important}html body #shortListPanel .relphi-background-row input[type="color"]{display:block!important;width:2.6rem!important;height:2rem!important;margin:0!important;padding:2px!important;border:1px solid #aaa098!important;border-radius:7px!important;background:#fff!important}html body #shortListPanel .relphi-reset-action{font-size:1.15rem!important;font-weight:700!important}html body #shortListPanel .card-row-board.has-workspace-card-background .card-row-drop-card,html body #shortListPanel .card-row-board.has-workspace-card-background .card-row-card,html body #shortListPanel .card-row-board.has-workspace-card-background .or-card{background-image:var(--workspace-card-background)!important;background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important}@media(max-width:620px){html body #shortListPanel .drawing-board-primary-actions{justify-content:stretch!important}html body #shortListPanel .drawing-board-primary-actions button{flex:1 1 45%!important}html body #shortListPanel .relphi-workspace-tools{left:.45rem!important;bottom:.45rem!important}}';
    style.textContent += [
      '#shortListPanel .drawing-board-primary-actions{position:relative!important;z-index:1450!important;display:flex!important;flex-flow:row wrap!important;align-items:center!important;gap:.4rem!important;width:max-content!important;max-width:calc(100% - 1rem)!important;margin:.5rem!important;padding:.38rem!important;border:1px solid rgba(23,20,18,.22)!important;border-radius:10px!important;background:rgba(255,250,244,.96)!important;box-shadow:0 3px 10px rgba(30,20,15,.08)!important}',
      '#shortListPanel .drawing-board-primary-actions button{margin:0!important;min-height:2.2rem!important}',
      '#shortListPanel .relphi-snap-row{display:grid!important;grid-template-columns:1.2rem 1.65rem 2rem minmax(3.6rem,auto) 2rem!important;gap:.28rem!important;align-items:center!important}',
      '#shortListPanel .relphi-snap-icon{display:grid!important;place-items:center!important;width:1.5rem!important;height:1.5rem!important}',
      '#shortListPanel .relphi-snap-icon svg{width:1.25rem!important;height:1.25rem!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important}',
      '#shortListPanel .relphi-snap-measure{display:grid!important;place-items:center!important;min-width:3.6rem!important;padding:.2rem .35rem!important;border:1px solid rgba(17,17,17,.12)!important;border-radius:999px!important;background:#faf8f2!important;font-weight:900!important;white-space:nowrap!important}',
      '#shortListPanel .card-row-workspace .short-list-row.card-row-board>.card-row-item{position:absolute!important;grid-template-rows:minmax(0,1fr)!important;overflow:visible!important}',
      '#shortListPanel .card-row-workspace .short-list-row.card-row-board>.card-row-item>.card-row-position-panel{position:absolute!important;left:.55rem!important;right:.55rem!important;bottom:calc(100% - .55rem)!important;width:auto!important;margin:0 0 .35rem!important;z-index:120!important;box-sizing:border-box!important}',
      '#shortListPanel .card-row-workspace .short-list-row.card-row-board>.card-row-item>.card-row-position-panel .card-row-position-editor{min-height:1.25em!important;max-height:none!important}',
      '#shortListPanel .card-row-workspace .short-list-row.card-row-board>.card-row-item>.card-row-card,#shortListPanel .card-row-workspace .short-list-row.card-row-board>.card-row-item>.or-card{grid-row:1!important;align-self:start!important}',
      '@media(max-width:620px){#shortListPanel .drawing-board-primary-actions{width:calc(100% - 1rem)!important;max-width:calc(100% - 1rem)!important}#shortListPanel .relphi-snap-row{grid-template-columns:1.1rem 1.45rem 1.9rem minmax(3.2rem,1fr) 1.9rem!important}}'
    ].join('');
    style.textContent += [
      'html body #shortListPanel .card-row-drawing-board{position:relative!important}',
      'html body #shortListPanel .relphi-reading-options-drawer{position:relative!important;display:block!important;width:calc(100% - 1rem)!important;max-width:none!important;max-height:3rem!important;margin:.45rem .5rem .25rem!important;border:1px solid #cfc5bc!important;border-radius:11px!important;background:#f5f0ea!important;box-shadow:0 3px 10px rgba(35,25,18,.07)!important;overflow:hidden!important;transform:none!important;transition:max-height .24s ease,box-shadow .24s ease!important;box-sizing:border-box!important}',
      'html body #shortListPanel .relphi-reading-options-drawer.is-reading-options-open{max-height:min(72vh,48rem)!important;box-shadow:0 10px 24px rgba(35,25,18,.12)!important}',
      'html body #shortListPanel .relphi-reading-options-drawer>summary{position:relative!important;display:grid!important;grid-template-columns:auto 1fr auto!important;align-items:center!important;gap:.65rem!important;width:100%!important;min-width:0!important;min-height:2.9rem!important;margin:0!important;padding:.55rem .75rem!important;border:0!important;border-radius:10px!important;background:#fffaf4!important;color:#171412!important;writing-mode:horizontal-tb!important;text-orientation:mixed!important;font-size:.82rem!important;font-weight:900!important;letter-spacing:0!important;cursor:pointer!important;list-style:none!important;box-shadow:none!important;box-sizing:border-box!important}',
      'html body #shortListPanel .relphi-reading-options-drawer>summary::-webkit-details-marker{display:none!important}',
      'html body #shortListPanel .relphi-reading-options-drawer>summary>small{min-width:0!important;color:#756b64!important;font-size:.72rem!important;font-weight:650!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}',
      'html body #shortListPanel .relphi-reading-options-chevron{font-size:1.15rem!important;color:#dc1f18!important;line-height:1!important;transition:transform .2s ease!important}',
      'html body #shortListPanel .relphi-reading-options-drawer.is-reading-options-open .relphi-reading-options-chevron{transform:rotate(180deg)!important}',
      'html body #shortListPanel .relphi-reading-options-drawer>.card-row-composer{display:block!important;max-height:calc(72vh - 3.2rem)!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;margin:0!important;padding:.6rem!important;border-top:1px solid #dfd6ce!important;border-radius:0 0 10px 10px!important}',
      'html body #shortListPanel .relphi-reading-options-drawer:not(.is-reading-options-open)>.card-row-composer{visibility:hidden!important;pointer-events:none!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .card-row-control-block--setup{margin:0!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .board-options-tabs{display:none!important}',
      '@media(max-width:700px){html body #shortListPanel .relphi-reading-options-drawer{width:calc(100% - .7rem)!important;margin:.35rem!important}html body #shortListPanel .relphi-reading-options-drawer>summary{grid-template-columns:auto 1fr auto!important;padding:.5rem .6rem!important}html body #shortListPanel .relphi-reading-options-drawer>summary>small{font-size:.66rem!important}}',
      '@media(prefers-reduced-motion:reduce){html body #shortListPanel .relphi-reading-options-drawer{transition:none!important}html body #shortListPanel .relphi-reading-options-chevron{transition:none!important}}'
    ].join('');
    document.head.appendChild(style);
    setArrivalState();
    new MutationObserver(records => {
      if (records.some(record => record.type === 'attributes' && record.target?.id === 'shortListPanel')) syncBoardEntryButton();
      scheduleEnhance();
    }).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['hidden'] });
    document.addEventListener('pointerdown', beginDescriptionSelection, true);
    window.addEventListener('pointerup', endDescriptionSelection, true);
    window.addEventListener('pointercancel', endDescriptionSelection, true);
    document.addEventListener('dragstart', event => {
      if (!descriptionLayerFromEvent(event)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
    document.addEventListener('selectstart', event => {
      if (descriptionLayerFromEvent(event)) event.stopImmediatePropagation();
    }, true);
    document.addEventListener('click', event => {
      const openArrange = document.querySelector('#shortListPanel .board-arrange-flyout>.card-row-control-block:not(.is-collapsed)');
      if (openArrange && !event.target.closest?.('.board-arrange-flyout')) {
        openArrange.classList.add('is-collapsed');
        document.querySelector('#shortListPanel .board-arrange-trigger')?.setAttribute('aria-expanded', 'false');
      }
      const openHistory = document.querySelector('#shortListPanel .board-history-menu:not([hidden])');
      if (openHistory && !event.target.closest?.('.board-header-group--history')) {
        openHistory.hidden = true;
        document.querySelector('#shortListPanel .board-history-toggle')?.setAttribute('aria-expanded', 'false');
      }
      const description = event.target.closest?.('#shortListPanel .or-card-layer.relphi-info-layer');
      if (description && !event.target.closest('button,a,input,select,textarea')) {
        event.stopImmediatePropagation();
        return;
      }
      const clear = event.target.closest?.('#clearShortList');
      if (!clear) return;
      if (window.confirm('Reset the entire Drawing Board, including cards, position stickers, backgrounds, notes, and layout?')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
    scheduleEnhance();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
