// Drawing Board workflow: adjacent defaults, optional numbered stickers, prefabs, full clear, and lean exports.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;

  const STICKER_TOGGLE_KEY = 'relphiDrawingBoardPositionStickersV2';
  const CARD_BACKGROUND_KEY = 'relphiDrawingBoardCardBackgroundV1';
  const BOARD_TEXTURE_KEY = 'relphiDrawingBoardTextureV1';
  const DEFAULT_BOARD_TEXTURE = 'felt';
  const DEFAULT_BOARD_COLOR = '#7d1f28';
  const BOARD_TEXTURES = Object.freeze({
    plain:{ label:'Plain', size:'auto', svg:'' },
    felt:{
      label:'Felt',
      size:'180px 180px',
      svg:'<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="4" seed="17"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .32"/></feComponentTransfer></filter><rect width="180" height="180" fill="#fff" filter="url(#n)"/></svg>'
    },
    linen:{
      label:'Linen',
      size:'26px 26px',
      svg:'<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26"><path d="M0 6.5h26M0 19.5h26M6.5 0v26M19.5 0v26" stroke="#fff" stroke-opacity=".28" stroke-width=".7"/><path d="M0 13h26M13 0v26" stroke="#000" stroke-opacity=".16" stroke-width=".7"/></svg>'
    },
    herringbone:{
      label:'Herringbone',
      size:'44px 44px',
      svg:'<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><path d="M-11 11L11-11M0 22L22 0M11 33L33 11M22 44L44 22M33 55L55 33" stroke="#fff" stroke-opacity=".24" stroke-width="5"/><path d="M-11 33L11 55M0 22L22 44M11 11L33 33M22 0L44 22M33-11L55 11" stroke="#000" stroke-opacity=".12" stroke-width="5"/></svg>'
    }
  });
  let scheduled = false;
  let descriptionSelectionCard = null;

  function stickersEnabled() {
    try { return localStorage.getItem(STICKER_TOGGLE_KEY) === '1'; }
    catch (_) { return false; }
  }
  function setStickersEnabled(value) {
    try { localStorage.setItem(STICKER_TOGGLE_KEY, value ? '1' : '0'); } catch (_) {}
  }
  function boardTexture() {
    try {
      const value = localStorage.getItem(BOARD_TEXTURE_KEY) || DEFAULT_BOARD_TEXTURE;
      return BOARD_TEXTURES[value] ? value : DEFAULT_BOARD_TEXTURE;
    } catch (_) { return DEFAULT_BOARD_TEXTURE; }
  }
  function setBoardTexture(value) {
    const key = BOARD_TEXTURES[value] ? value : DEFAULT_BOARD_TEXTURE;
    try { localStorage.setItem(BOARD_TEXTURE_KEY, key); } catch (_) {}
    return key;
  }
  function textureImage(value) {
    const texture = BOARD_TEXTURES[value] || BOARD_TEXTURES[DEFAULT_BOARD_TEXTURE];
    return texture.svg ? 'url("data:image/svg+xml,' + encodeURIComponent(texture.svg) + '")' : 'none';
  }
  function applyBoardTexture(panel) {
    const workspace = panel.querySelector('.card-row-workspace');
    const board = panel.querySelector('.card-row-board');
    const key = boardTexture();
    const texture = BOARD_TEXTURES[key];
    [workspace, board].filter(Boolean).forEach(node => {
      node.dataset.relphiBoardTexture = key;
      node.style.setProperty('--relphi-board-texture', textureImage(key));
      node.style.setProperty('--relphi-board-texture-size', texture.size);
    });
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
    label.innerHTML = '<input id="rowPositionStickersQuick" type="checkbox"' + (stickersEnabled() ? ' checked' : '') + '> Labels';
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
      panel.removeAttribute('hidden');
      requestAnimationFrame(() => {
        panel.hidden = false;
        panel.removeAttribute('hidden');
        const drawer = panel.querySelector('.card-row-drawing-board');
        if (drawer?.tagName === 'DETAILS') drawer.open = true;
        syncBoardEntryButton();
        scheduleEnhance();
        requestAnimationFrame(() => {
          panel.hidden = false;
          panel.removeAttribute('hidden');
          panel.scrollIntoView({ behavior:'smooth', block:'start' });
        });
      });
      return;
    }
    setReadingOptionsOpen(panel, false);
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
    if (panel) {
      panel.dataset.relphiReadingOptionsOpen = 'false';
      panel.hidden = true;
    }
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
      applyBoardTexture(panel);
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

    const textureRow = document.createElement('div');
    textureRow.className = 'relphi-background-row relphi-texture-row';
    textureRow.innerHTML =
      '<strong>Texture</strong><select id="workspaceBoardTexture" aria-label="Board texture">' +
      Object.entries(BOARD_TEXTURES).map(([value, texture]) => '<option value="' + value + '">' + texture.label + '</option>').join('') +
      '</select>';
    const textureSelect = textureRow.querySelector('#workspaceBoardTexture');
    textureSelect.value = boardTexture();
    backgroundRows.appendChild(textureRow);
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
    textureSelect?.addEventListener('change', () => {
      setBoardTexture(textureSelect.value);
      applyBoardTexture(panel);
    });
    boardReset?.addEventListener('click', () => {
      setBoardTexture(DEFAULT_BOARD_TEXTURE);
      if (textureSelect) textureSelect.value = DEFAULT_BOARD_TEXTURE;
      if (boardColor) {
        boardColor.value = DEFAULT_BOARD_COLOR;
        boardColor.dispatchEvent(new Event('input',{bubbles:true}));
        boardColor.dispatchEvent(new Event('change',{bubbles:true}));
      }
      applyBoardTexture(panel);
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
    applyBoardTexture(panel);
  }

  function installBoardControllerAutoHide(panel) {
    const workspace = panel.querySelector('.card-row-workspace');
    if (!workspace) return;



    const controllers = [
      { key:'actions', node:workspace.querySelector(':scope > .drawing-board-primary-actions') },
      { key:'tools', node:workspace.querySelector(':scope > .relphi-workspace-tools') },
      { key:'zoom', node:workspace.querySelector(':scope > .card-row-workspace-toolbar') }
    ].filter(item => item.node);

    controllers.forEach(({ key, node }) => {
      node.classList.add('relphi-board-controller', 'relphi-board-controller--' + key);
      let zone = workspace.querySelector(':scope > .relphi-board-controller-hotzone[data-controller="' + key + '"]');
      if (!zone) {
        zone = document.createElement('div');
        zone.className = 'relphi-board-controller-hotzone relphi-board-controller-hotzone--' + key;
        zone.dataset.controller = key;
        zone.setAttribute('aria-hidden', 'true');
        workspace.appendChild(zone);
      }

      const reveal = () => {
        if (node._relphiControllerTimer) window.clearTimeout(node._relphiControllerTimer);
        node._relphiControllerTimer = 0;
        node.classList.remove('is-controller-idle');
        node.classList.add('is-controller-visible');
      };
      const hide = () => {
        node._relphiControllerTimer = 0;
        if (node.matches(':hover') || node.contains(document.activeElement)) return;
        if (key === 'tools' && !node.querySelector('.relphi-workspace-flyout')?.hidden) return;
        node.classList.remove('is-controller-visible');
        node.classList.add('is-controller-idle');
      };
      const scheduleHide = () => {
        if (node._relphiControllerTimer) window.clearTimeout(node._relphiControllerTimer);
        node._relphiControllerTimer = window.setTimeout(hide, 1000);
      };

      if (node.dataset.relphiControllerAutoHideBound !== 'true') {
        node.dataset.relphiControllerAutoHideBound = 'true';
        zone.addEventListener('mouseenter', reveal);
        zone.addEventListener('mouseleave', scheduleHide);
        node.addEventListener('mouseenter', reveal);
        node.addEventListener('mouseleave', scheduleHide);
        node.addEventListener('focusin', reveal);
        node.addEventListener('focusout', event => {
          if (!node.contains(event.relatedTarget)) scheduleHide();
        });
        node.addEventListener('click', () => {
          reveal();
          scheduleHide();
        }, true);
      }

      if (!node.classList.contains('is-controller-visible') && !node.classList.contains('is-controller-idle')) {
        reveal();
        scheduleHide();
      }
    });
  }

  function setReadingOptionsOpen(panel, open) {
    const drawer = panel.querySelector('.relphi-reading-options-drawer');
    if (!drawer) return;
    drawer.open = true;
    panel.dataset.relphiReadingOptionsOpen = open ? 'true' : 'false';
    drawer.classList.toggle('is-reading-options-open', !!open);
    const trigger = panel.querySelector('#drawingBoardOptionsButton');
    if (trigger) {
      trigger.setAttribute('aria-expanded', String(!!open));
      trigger.classList.toggle('is-active', !!open);
      trigger.title = open ? 'Hide Options' : 'Open Options';
    }
  }

  function syncReadingOptionsDrawer(panel) {
    const drawer = panel.querySelector('.relphi-reading-options-drawer');
    if (!drawer) return;
    const open = panel.dataset.relphiReadingOptionsOpen === 'true';
    drawer.open = true;
    drawer.classList.toggle('is-reading-options-open', open);
    const trigger = panel.querySelector('#drawingBoardOptionsButton');
    if (trigger) {
      trigger.setAttribute('aria-expanded', String(open));
      trigger.classList.toggle('is-active', open);
    }
  }

  function installReadingOptionsDrawer(panel) {
    const drawer = panel.querySelector('.card-row-more-options');
    const summary = drawer?.querySelector(':scope > summary');
    const boardDrawer = panel.querySelector('.card-row-drawing-board');
    const workspace = panel.querySelector('.card-row-workspace');
    if (!drawer || !summary || !boardDrawer || !workspace) return;

    drawer.classList.add('relphi-reading-options-drawer');
    drawer.open = true;
    summary.textContent = 'Board Options';
    summary.hidden = true;
    summary.setAttribute('aria-hidden', 'true');

    if (drawer.parentElement !== workspace) {
      workspace.insertAdjacentElement('afterbegin', drawer);
    }
    if (panel.dataset.relphiReadingOptionsOpen !== 'true') panel.dataset.relphiReadingOptionsOpen = 'false';
    syncReadingOptionsDrawer(panel);
  }

  function installOptionsButton(panel) {
    const reset = panel.querySelector('#clearShortList');
    if (!reset) return;
    if (reset.dataset.relphiTextureResetBound !== 'true') {
      reset.dataset.relphiTextureResetBound = 'true';
      reset.addEventListener('click', () => {
        window.setTimeout(() => {
          setBoardTexture(DEFAULT_BOARD_TEXTURE);
          applyBoardTexture(panel);
        }, 0);
      });
    }

    let button = panel.querySelector('#drawingBoardOptionsButton');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.id = 'drawingBoardOptionsButton';
      button.textContent = 'Options';
      button.setAttribute('aria-controls', 'drawingBoardReadingOptions');
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        const opening = panel.dataset.relphiReadingOptionsOpen !== 'true';
        setReadingOptionsOpen(panel, opening);
      });
    }

    const drawer = panel.querySelector('.relphi-reading-options-drawer');
    if (drawer) drawer.id = 'drawingBoardReadingOptions';

    const actionButtons = panel.querySelector('.drawing-board-action-buttons');
    if (actionButtons && button.parentElement !== actionButtons) {
      actionButtons.appendChild(button);
    }
    button.setAttribute('aria-expanded', String(panel.dataset.relphiReadingOptionsOpen === 'true'));
    button.classList.toggle('is-active', panel.dataset.relphiReadingOptionsOpen === 'true');
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
    const spreadSetup = setupGroup(setup, 'spread', '', '');

    const readingName = control('rowName');
    if (readingName) {
      const textNode = Array.from(readingName.childNodes).find(node => node.nodeType === 3);
      if (textNode) textNode.textContent = 'Reading Name ';
    }
    move(spreadSetup, readingName);
    move(spreadSetup, control('rowPositionLabels'));

    const drawSettingsRow = document.createElement('div');
    drawSettingsRow.className = 'board-draw-settings-row';
    spreadSetup.appendChild(drawSettingsRow);

    const packControl = control('rowDrawScope');
    if (packControl) {
      packControl.classList.remove('relphi-fixed-full-pack');
      move(drawSettingsRow, packControl);
    }

    const toggleStack = document.createElement('div');
    toggleStack.className = 'board-reading-toggle-stack';
    const stickerToggle = control('rowPositionStickersQuick');
    const repeatsToggle = control('rowAllowRepeats');
    const reversalsToggle = control('rowAllowReversalsQuick');
    const renameToggle = (label, text) => {
      if (!label) return;
      const textNode = Array.from(label.childNodes).find(node => node.nodeType === 3);
      if (textNode) textNode.textContent = ' ' + text;
      label.title = text;
    };
    renameToggle(stickerToggle, 'Labels');
    renameToggle(reversalsToggle, 'Reversals');
    renameToggle(repeatsToggle, 'Repeats');
    if (stickerToggle) toggleStack.appendChild(stickerToggle);
    if (reversalsToggle) toggleStack.appendChild(reversalsToggle);
    if (repeatsToggle) toggleStack.appendChild(repeatsToggle);
    drawSettingsRow.appendChild(toggleStack);

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
    const resetBoard = panel.querySelector('#clearShortList');
    if (resetBoard) {
      resetBoard.textContent = 'Reset Board';
      resetBoard.title = 'Reset the entire Drawing Board';
      resetBoard.setAttribute('aria-label', 'Reset the entire Drawing Board');
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

      let actionButtons = primaryActions.querySelector('.drawing-board-action-buttons');
      if (!actionButtons) {
        actionButtons = document.createElement('div');
        actionButtons.className = 'drawing-board-action-buttons';
        primaryActions.appendChild(actionButtons);
      }
      ['drawRandomRowCard','undoShortList','clearRowCardsOnly'].forEach(id => {
        const button = panel.querySelector('#' + id);
        if (button) actionButtons.appendChild(button);
      });

      const staging = panel.querySelector('.card-row-action-staging');
      ['redoShortList','addCardPlaceholder'].forEach(id => {
        const button = panel.querySelector('#' + id);
        if (button && staging) staging.appendChild(button);
      });

      if (resetBoard) {
        resetBoard.classList.add('board-reset-action');
        spreadSetup.appendChild(resetBoard);
      }
    }
    panel.querySelector('.card-row-action-staging:empty')?.remove();

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
    installOptionsButton(panel);
    installBoardControllerAutoHide(panel);
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
  function start() {setArrivalState();
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
      const openOptionsPanel = document.querySelector('#shortListPanel .relphi-reading-options-drawer.is-reading-options-open');
      if (openOptionsPanel && !event.target.closest?.('#drawingBoardOptionsButton,.relphi-reading-options-drawer')) {
        const panel = document.getElementById('shortListPanel');
        if (panel) setReadingOptionsOpen(panel, false);
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
