// Structured Drawing Board spread prefabs: shipped layouts, custom design, snapshots, and Celtic center views.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;

  const CUSTOM_KEY = 'relphiDrawingBoardSpreadPrefabsV2';
  const LEGACY_KEY = 'relphiDrawingBoardStickerPrefabsV1';
  const MAX_CUSTOM = 40;
  const RETIRED_PREFAB_IDS = new Set(['celtic-cross-11']);
  let selectedId = '';
  let enhancing = false;
  let queued = false;
  let draftLayout = null;
  let draftName = '';
  let copySourceId = '';
  let templateMode = 'existing';
  let labelsOpen = false;
  let newPromptArmed = false;
  let suppressOmniboxHandler = false;
  const NEW_TEMPLATE_OPTION = 'New';
  const NEW_TEMPLATE_PROMPT = 'Enter a name for the new Spread Template…';

  const transform = (x, y, rotation = 0, scale = 1, zIndex = 1) => ({ x, y, rotation, scale, zIndex });
  const position = (id, label, drawOrder, value, semantics = {}) => ({
    id, label, drawOrder, transform:value, ...semantics
  });
  const gridPositions = labels => {
    const count = labels.length;
    const cols = Math.min(count, count > 6 ? 3 : count > 3 ? 2 : count);
    const rows = Math.ceil(count / cols);
    const scale = count > 6 ? .52 : count > 3 ? .62 : .72;
    return labels.map((label, index) => position(
      'position-' + (index + 1),
      label,
      index + 1,
      transform(
        .05 + (index % cols) * (.82 / Math.max(1, cols - 1)),
        .08 + Math.floor(index / cols) * (.72 / Math.max(1, rows - 1)),
        0,
        scale
      )
    ));
  };

  const SHIPPED = Object.freeze([
    {
      id:'past-present-future-3',
      name:'Past, Present, Future',
      cardCount:3,
      source:'shipped',
      editable:false,
      positions:[
        position('past', 'Past', 1, transform(.05, .22, 0, .72)),
        position('present', 'Present', 2, transform(.36, .22, 0, .72)),
        position('future', 'Future', 3, transform(.67, .22, 0, .72))
      ]
    },
    {
      id:'situation-challenge-strategy-3',
      name:'Situation, Challenge, Strategy',
      cardCount:3,
      source:'shipped',
      editable:false,
      positions:gridPositions(['Situation', 'Challenge', 'Strategy'])
    },
    {
      id:'choice-path-3',
      name:'Choice Path',
      cardCount:3,
      source:'shipped',
      editable:false,
      positions:gridPositions(['Option A', 'Option B', 'Advice'])
    },
    {
      id:'relationship-check-in-5',
      name:'Relationship Check-in',
      cardCount:5,
      source:'shipped',
      editable:false,
      positions:gridPositions(['You', 'Other', 'Bond', 'Challenge', 'Next step'])
    },
    {
      id:'hope-and-comfort-5',
      name:'Hope and Comfort',
      cardCount:5,
      source:'shipped',
      editable:false,
      positions:gridPositions(['Confusion', 'Comfort', 'Lesson', 'Support', 'Next step'])
    },
    {
      id:'saturn-square-9',
      name:'Saturn Square',
      cardCount:9,
      source:'shipped',
      editable:false,
      positions:[
        position('past-mind', 'Past Mind', 1, transform(.04, .03, 0, .52)),
        position('present-mind', 'Present Mind', 2, transform(.35, .03, 0, .52)),
        position('future-mind', 'Future Mind', 3, transform(.66, .03, 0, .52)),
        position('past-body', 'Past Body', 4, transform(.04, .34, 0, .52)),
        position('present-body', 'Present Body', 5, transform(.35, .34, 0, .52)),
        position('future-body', 'Future Body', 6, transform(.66, .34, 0, .52)),
        position('past-spirit', 'Past Spirit', 7, transform(.04, .65, 0, .52)),
        position('present-spirit', 'Present Spirit', 8, transform(.35, .65, 0, .52)),
        position('future-spirit', 'Future Spirit', 9, transform(.66, .65, 0, .52))
      ]
    },
    {
      id:'celtic-cross-10',
      name:'Celtic Cross',
      cardCount:10,
      source:'shipped',
      editable:false,
      helper:'celtic-center',
      positions:[
        position('covering', '1 · What covers you', 1, transform(.25, .326, 0, .45, 20), {
          role:'covering',
          openTransform:transform(.25, .326, 0, .45, 20)
        }),
        position('crossing', '2 · What crosses you', 2, transform(.25, .326, 90, .45, 30), {
          role:'crossing',
          crosses:'covering',
          openTransform:transform(.355, .326, 0, .45, 30)
        }),
        position('crowning', '3 · What crowns you', 3, transform(.25, .10, 0, .45, 4)),
        position('beneath', '4 · What is beneath you', 4, transform(.25, .552, 0, .45, 4)),
        position('behind', '5 · What is behind you', 5, transform(.04, .326, 0, .45, 4)),
        position('before', '6 · What is before you', 6, transform(.46, .326, 0, .45, 4)),
        position('self', '7 · Yourself', 7, transform(.76, .48, 0, .45, 4)),
        position('house', '8 · Your house', 8, transform(.76, .36, 0, .45, 4)),
        position('hopes-fears', '9 · Your hopes or fears', 9, transform(.76, .24, 0, .45, 4)),
        position('outcome', '10 · What will come', 10, transform(.76, .12, 0, .45, 4))
      ]
    },
    {
      id:'six-polarities-houses-12',
      name:'Six Polarities of the Houses',
      cardCount:12,
      source:'shipped',
      editable:false,
      positions:[
        position('aries', 'Aries', 1, transform(.035, .12, 0, .40)),
        position('libra', 'Libra', 2, transform(.035, .56, 0, .40)),
        position('taurus', 'Taurus', 3, transform(.195, .12, 0, .40)),
        position('scorpio', 'Scorpio', 4, transform(.195, .56, 0, .40)),
        position('gemini', 'Gemini', 5, transform(.355, .12, 0, .40)),
        position('sagittarius', 'Sagittarius', 6, transform(.355, .56, 0, .40)),
        position('cancer', 'Cancer', 7, transform(.515, .12, 0, .40)),
        position('capricorn', 'Capricorn', 8, transform(.515, .56, 0, .40)),
        position('leo', 'Leo', 9, transform(.675, .12, 0, .40)),
        position('aquarius', 'Aquarius', 10, transform(.675, .56, 0, .40)),
        position('virgo', 'Virgo', 11, transform(.835, .12, 0, .40)),
        position('pisces', 'Pisces', 12, transform(.835, .56, 0, .40))
      ]
    },
    {
      id:'focus-1',
      name:'Focus',
      cardCount:1,
      source:'shipped',
      editable:false,
      positions:gridPositions(['Focus'])
    }
  ]);

  function bridge() { return window.RelphiDrawingBoardPrefabsBridge; }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function withDefaultRules(prefab) {
    const ready = clone(prefab);
    ready.rules = {
      ...(ready.rules || {}),
      allowReversals:ready.rules?.allowReversals !== false,
      allowRepeats:!!ready.rules?.allowRepeats,
      drawScope:String(ready.rules?.drawScope || 'full')
    };
    return ready;
  }
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    })[character]);
  }
  function displayName(prefab) { return prefab.cardCount + ' | ' + prefab.name; }
  function labelsValue(prefab) {
    return (prefab?.positions || []).slice().sort((a,b) => Number(a.drawOrder) - Number(b.drawOrder)).map(item => item.label).join(', ');
  }
  function uniqueId(name) {
    const stem = String(name || 'custom-spread').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'custom-spread';
    const occupied = new Set([...SHIPPED, ...customPrefabs()].map(item => item.id));
    let id = stem + '-' + Date.now().toString(36);
    let suffix = 2;
    while (occupied.has(id)) id = stem + '-' + Date.now().toString(36) + '-' + suffix++;
    return id;
  }
  function sanitizeCustom(prefab) {
    if (!prefab || !Array.isArray(prefab.positions) || !prefab.positions.length) return null;
    const positions = prefab.positions.slice(0, 40).map((item, index) => ({
      id:String(item.id || 'position-' + (index + 1)).slice(0, 80),
      label:String(item.label || 'Position ' + (index + 1)).slice(0, 90),
      drawOrder:index + 1,
      transform:{
        x:Math.max(0, Math.min(1, Number(item.transform?.x) || 0)),
        y:Math.max(0, Math.min(1, Number(item.transform?.y) || 0)),
        rotation:Math.max(-180, Math.min(180, Number(item.transform?.rotation) || 0)),
        scale:Math.max(.45, Math.min(2.5, Number(item.transform?.scale) || 1)),
        zIndex:Math.max(0, Math.min(100, Number(item.transform?.zIndex) || 1))
      },
      ...(item.role ? { role:String(item.role) } : {}),
      ...(item.covers ? { covers:String(item.covers) } : {}),
      ...(item.crosses ? { crosses:String(item.crosses) } : {}),
      ...(item.openTransform ? { openTransform:clone(item.openTransform) } : {})
    }));
    return {
      version:1,
      id:String(prefab.id || uniqueId(prefab.name)).slice(0, 100),
      name:String(prefab.name || 'Custom spread').trim().slice(0, 60),
      cardCount:positions.length,
      source:'custom',
      editable:true,
      basedOn:prefab.basedOn ? String(prefab.basedOn).slice(0, 100) : null,
      positions,
      rules:{
        allowReversals:prefab.rules?.allowReversals !== false,
        allowRepeats:!!prefab.rules?.allowRepeats,
        drawScope:String(prefab.rules?.drawScope || 'full')
      }
    };
  }
  function migrateLegacy() {
    if (localStorage.getItem(CUSTOM_KEY)) return;
    let legacy = [];
    try { legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || '[]'); } catch (_) {}
    if (!Array.isArray(legacy) || !legacy.length) return;
    const converted = legacy.flatMap(item => {
      if (!item?.name || !Array.isArray(item.labels) || !item.labels.length) return [];
      const count = Math.min(40, item.labels.length);
      const cols = Math.min(3, count);
      const rows = Math.ceil(count / cols);
      return [sanitizeCustom({
        id:uniqueId(item.name),
        name:item.name,
        positions:item.labels.slice(0, 40).map((label, index) => position(
          'position-' + (index + 1),
          label,
          index + 1,
          transform(.05 + (index % cols) * (.82 / Math.max(1, cols - 1)), .05 + Math.floor(index / cols) * (.76 / Math.max(1, rows - 1)), 0, count > 6 ? .52 : .72)
        ))
      })];
    }).filter(Boolean);
    try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(converted)); } catch (_) {}
  }
  function customPrefabs() {
    try {
      const value = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]');
      return Array.isArray(value) ? value.map(sanitizeCustom).filter(Boolean).filter(item => !RETIRED_PREFAB_IDS.has(item.id)) : [];
    } catch (_) { return []; }
  }
  function writeCustomPrefabs(prefabs) {
    const clean = prefabs.map(sanitizeCustom).filter(Boolean).filter(item => !RETIRED_PREFAB_IDS.has(item.id)).filter(item => !SHIPPED.some(shipped => shipped.id === item.id)).slice(0, MAX_CUSTOM);
    try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(clean)); return true; }
    catch (_) { return false; }
  }
  function saveCustom(prefab) {
    const clean = sanitizeCustom(prefab);
    if (!clean || SHIPPED.some(item => item.id === clean.id)) return false;
    const list = customPrefabs();
    const index = list.findIndex(item => item.id === clean.id);
    if (index >= 0) list[index] = clean; else list.push(clean);
    return writeCustomPrefabs(list);
  }
  function allPrefabs() {
    const rank = item => item.cardCount === 1 ? 99 : item.cardCount;
    const seen = new Set();
    return [...SHIPPED.map(clone), ...customPrefabs()].filter(item => {
      const identity = item.cardCount + '|' + normalizedName(item.name);
      if (seen.has(identity)) return false;
      seen.add(identity);
      return true;
    }).sort((a,b) => rank(a) - rank(b) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  }
  function prefabById(id) { return allPrefabs().find(item => item.id === id) || null; }
  function normalizedName(value) {
    return String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  }
  function templateNameConflict(name, cardCount) {
    const normalized = normalizedName(name);
    return !!normalized && allPrefabs().some(item => item.cardCount === cardCount && normalizedName(item.name) === normalized);
  }
  function requireClear(action) {
    const state = bridge()?.getState();
    if (!state?.hasCards && !state?.locked) return true;
    window.alert('Clear the Drawing Board before you ' + action + '. The active reading keeps its layout snapshot locked.');
    return false;
  }
  function orderedPositions(prefab) {
    return (prefab?.positions || []).slice().sort((a,b) => Number(a.drawOrder) - Number(b.drawOrder));
  }
  function labelsForPrefab(prefab) {
    return orderedPositions(prefab).map((item, index) => String(item.label || ('Position #' + (index + 1))).trim());
  }
  function enablePositionStickers() {
    const toggle = document.querySelector('#shortListPanel #rowPositionStickersQuick');
    if (!toggle || toggle.checked) return;
    toggle.checked = true;
    toggle.dispatchEvent(new Event('input', { bubbles:true }));
    toggle.dispatchEvent(new Event('change', { bubbles:true }));
  }
  function dispatchPositionLabels(labels) {
    const field = document.querySelector('#shortListPanel #rowPositionLabels');
    if (!field) return false;
    const clean = (labels || []).map(value => String(value || '').trim()).filter(Boolean);
    const value = clean.join(', ');
    field.value = value;
    field.dataset.relphiManualValue = value;
    field.dispatchEvent(new Event('input', { bubbles:true }));
    field.dispatchEvent(new Event('change', { bubbles:true }));
    if (clean.length) enablePositionStickers();
    return true;
  }
  function ensurePositionSlots(count) {
    const panel = document.getElementById('shortListPanel');
    const add = panel?.querySelector('#addCardPlaceholder');
    if (!panel || !add || count < 1) return;
    let guard = 0;
    const currentCount = () => Math.max(
      Number(bridge()?.getState()?.slotCount) || 0,
      panel.querySelectorAll('.card-row-board .card-row-item').length
    );
    while (currentCount() < count && guard < count + 4) {
      const disabled = !!add.disabled;
      if (disabled) add.disabled = false;
      add.click();
      if (disabled) add.disabled = true;
      guard += 1;
    }
  }
  function stagePrefab(prefab) {
    const labels = labelsForPrefab(prefab);
    if (!labels.length) return;
    dispatchPositionLabels(labels);
    ensurePositionSlots(labels.length);
    dispatchPositionLabels(labels);
  }
  function applyForUse(prefab) {
    if (!prefab || !requireClear('choose another spread')) return;
    const ready = withDefaultRules(prefab);
    stagePrefab(ready);
    if (!bridge()?.applyLayout(ready, { designMode:false })) return;
    selectedId = prefab.id;
    draftLayout = null;
    draftName = '';
    copySourceId = '';
    templateMode = 'existing';
    schedule();
  }
  function beginDesign(prefab, options = {}) {
    if (!prefab || !requireClear('design a layout')) return;
    const copy = withDefaultRules(prefab);
    copy.id = uniqueId(copy.name + '-copy');
    copy.name = prefab.name;
    copy.source = 'custom';
    copy.editable = true;
    copy.basedOn = prefab.id;
    draftLayout = copy;
    draftName = prefab.name;
    copySourceId = prefab.id;
    selectedId = copy.id;
    labelsOpen = true;
    templateMode = 'existing';
    bridge()?.applyLayout(copy, { designMode:true });
    schedule();
  }
  function cancelDesign() {
    document.getElementById('clearShortList')?.click();
    selectedId = copySourceId || '';
    draftLayout = null;
    draftName = '';
    copySourceId = '';
    templateMode = 'existing';
    newPromptArmed = false;
    labelsOpen = true;
    schedule();
  }
  function beginCustomDesign() {
    if (!requireClear('design a layout')) return;
    const state = bridge()?.getState();
    const field = document.querySelector('#shortListPanel #rowPositionLabels');
    const labels = String(field?.value || '').split(',').map(value => value.trim()).filter(Boolean);
    let current = state?.currentLayout;
    if (labels.length) {
      current = {
        id:'untitled-spread',
        name:'Untitled spread',
        cardCount:labels.length,
        source:'active',
        editable:true,
        positions:gridPositions(labels)
      };
      stagePrefab(current);
    }
    if (!current?.positions?.length) return window.alert('Type at least one position label before designing the spread.');
    const name = String(draftName || '').trim();
    if (!name) return window.alert('Enter a template name before designing the spread.');
    draftLayout = {
      ...clone(current),
      id:uniqueId(name),
      name,
      source:'custom',
      editable:true,
      basedOn:null
    };
    draftName = name;
    copySourceId = '';
    selectedId = draftLayout.id;
    templateMode = 'new';
    bridge()?.applyLayout(clone(draftLayout), { designMode:true });
    schedule();
  }
  function duplicateCustom(prefab) {
    const copy = clone(prefab);
    copy.id = uniqueId(prefab.name + '-copy');
    copy.name = (prefab.name + ' copy').slice(0, 60);
    copy.basedOn = prefab.basedOn || prefab.id;
    if (saveCustom(copy)) {
      selectedId = copy.id;
      draftLayout = null;
      draftName = '';
      schedule();
    }
  }
  function deleteCustom(prefab) {
    if (!prefab || prefab.source !== 'custom') return;
    if (!window.confirm('Delete the custom spread design "' + displayName(prefab) + '"? Active readings will not be changed.')) return;
    writeCustomPrefabs(customPrefabs().filter(item => item.id !== prefab.id));
    selectedId = '';
    draftLayout = null;
    draftName = '';
    copySourceId = '';
    schedule();
  }
  function finishDesign(save) {
    const state = bridge()?.getState();
    if (!state?.designMode || !state.slotCount) return;
    const selected = draftLayout || prefabById(selectedId);
    const name = String(draftName || '').trim().replace(/\s+/g, ' ').slice(0, 60);
    if (save && !name) {
      window.alert('Enter a name for this spread template before saving it.');
      schedule();
      return;
    }
    if (save && templateNameConflict(name, state.slotCount)) {
      window.alert('A ' + state.slotCount + '-card spread template named "' + name + '" already exists. Choose a unique name.');
      schedule();
      return;
    }
    const snapshot = bridge().finishDesign({
      id:save ? uniqueId(name) : 'use-once-' + Date.now().toString(36),
      name:save ? name : 'One-time layout',
      source:save ? 'custom' : 'active',
      editable:!!save,
      basedOn:copySourceId || selected?.basedOn || null
    });
    if (save && snapshot) {
      if (!saveCustom(snapshot)) return window.alert('This browser could not save the custom spread design.');
      selectedId = snapshot.id;
    }
    draftLayout = null;
    draftName = '';
    copySourceId = '';
    templateMode = save ? 'existing' : templateMode;
    schedule();
  }
  function labelsFromHiddenField(field) {
    const labels = String(field?.value || '').split(',').map(value => value.trim());
    while (labels.length > 1 && !labels[labels.length - 1]) labels.pop();
    return labels.length ? labels : [''];
  }
  function writeLabelBuilderToHidden(field, builder) {
    if (!field || !builder) return;
    const labels = Array.from(builder.querySelectorAll('[data-relphi-label-input]')).map(input => String(input.value || '').trim());
    while (labels.length > 1 && !labels[labels.length - 1]) labels.pop();
    const clean = labels.filter(Boolean);
    const value = clean.join(', ');
    if (field.value !== value) {
      field.value = value;
      field.dataset.relphiManualValue = value;
      field.dispatchEvent(new Event('input', { bubbles:true }));
      field.dispatchEvent(new Event('change', { bubbles:true }));
    }
    if (clean.length) enablePositionStickers();
  }
  function labelsFromBuilder(builder) {
    return Array.from(builder?.querySelectorAll('[data-relphi-label-input]') || [])
      .map(input => String(input.value || '').trim())
      .filter(Boolean);
  }

  function saveLabelsAsTemplate(panel, field, builder, saver) {
    const nameField = saver?.querySelector('#relphiLabelTemplateName');
    const status = saver?.querySelector('.relphi-label-template-status');
    const labels = labelsFromBuilder(builder);
    const name = String(nameField?.value || '').trim().replace(/\s+/g, ' ').slice(0, 60);

    if (!labels.length) {
      if (status) status.textContent = 'Add at least one label first.';
      return;
    }
    if (!name) {
      if (status) status.textContent = 'Name the template first.';
      nameField?.focus();
      return;
    }
    if (templateNameConflict(name, labels.length)) {
      if (status) status.textContent = 'A ' + labels.length + '-card template with that name already exists.';
      return;
    }

    writeLabelBuilderToHidden(field, builder);
    ensurePositionSlots(labels.length);

    const live = bridge()?.getState();
    const current = live?.currentLayout;
    let positions = Array.isArray(current?.positions) && current.positions.length === labels.length
      ? current.positions.slice().sort((a,b) => Number(a.drawOrder) - Number(b.drawOrder)).map((item, index) => ({
          ...clone(item),
          id:String(item.id || ('position-' + (index + 1))),
          label:labels[index],
          drawOrder:index + 1
        }))
      : gridPositions(labels);

    const saved = sanitizeCustom({
      id:uniqueId(name),
      name,
      source:'custom',
      editable:true,
      positions,
      rules:{
        allowReversals:!!panel.querySelector('#rowAllowReversalsQuick')?.checked,
        allowRepeats:!!panel.querySelector('#rowAllowRepeats')?.checked,
        drawScope:String(panel.querySelector('#rowDrawScope')?.value || 'full')
      }
    });
    if (!saved || !saveCustom(saved)) {
      if (status) status.textContent = 'This browser could not save the template.';
      return;
    }

    selectedId = saved.id;
    draftLayout = null;
    draftName = '';
    copySourceId = '';
    templateMode = 'existing';
    if (status) status.textContent = 'Saved as ' + displayName(saved) + '.';
    schedule();
  }

  function ensureLabelTemplateSaver(panel, field, builder) {
    const host = builder?.closest('.board-setup-group--spread');
    if (!host || !field || !builder) return null;
    let saver = host.querySelector('.relphi-label-template-saver');
    if (!saver) {
      saver = document.createElement('div');
      saver.className = 'relphi-label-template-saver';
      saver.innerHTML =
        '<label>Template name<input id="relphiLabelTemplateName" type="text" maxlength="60" autocomplete="off" placeholder="Name this spread"></label>' +
        '<button type="button" class="primary" id="relphiSaveLabelsAsTemplate">Save as Template</button>' +
        '<small class="relphi-label-template-status" aria-live="polite"></small>';
      builder.insertAdjacentElement('afterend', saver);
      const nameField = saver.querySelector('#relphiLabelTemplateName');
      const save = saver.querySelector('#relphiSaveLabelsAsTemplate');
      const sync = () => {
        const labels = labelsFromBuilder(builder);
        save.disabled = !labels.length || !String(nameField.value || '').trim();
      };
      nameField.addEventListener('input', sync);
      save.addEventListener('click', () => saveLabelsAsTemplate(panel, field, builder, saver));
      builder.addEventListener('input', sync);
      sync();
    }
    return saver;
  }

  function renderLabelBuilder(panel, field, labels) {
    const host = field?.closest('.board-setup-group--spread');
    if (!host || !field) return null;
    let promptRow = host.querySelector('.relphi-label-template-row');
    if (!promptRow) {
      promptRow = document.createElement('div');
      promptRow.className = 'relphi-label-template-row';
      promptRow.innerHTML = '<strong>Add labels</strong><div class="relphi-template-inline-slot"></div>';
      host.querySelector('header')?.insertAdjacentElement('afterend', promptRow);
    }
    let builder = host.querySelector('.relphi-label-builder');
    if (!builder) {
      builder = document.createElement('div');
      builder.className = 'relphi-label-builder';
      builder.setAttribute('aria-label', 'Card labels');
      promptRow.insertAdjacentElement('afterend', builder);
    }
    const clean = (labels && labels.length ? labels : ['']).map(value => String(value || ''));
    const existing = Array.from(builder.querySelectorAll('.relphi-label-row'));
    clean.forEach((value, index) => {
      let row = existing[index];
      if (!row) {
        row = document.createElement('div');
        row.className = 'relphi-label-row';
        row.innerHTML =
          '<span class="relphi-label-number"></span>' +
          '<input type="text" data-relphi-label-input autocomplete="off">' +
          '<button type="button" class="relphi-label-add" title="Add label" aria-label="Add label">+</button>' +
          '<button type="button" class="relphi-label-remove" title="Remove label" aria-label="Remove label">×</button>';
        builder.appendChild(row);
        const input = row.querySelector('[data-relphi-label-input]');
        input.addEventListener('input', () => writeLabelBuilderToHidden(field, builder));
        input.addEventListener('change', () => writeLabelBuilderToHidden(field, builder));
        input.addEventListener('keydown', event => {
          if (event.key !== 'Enter') return;
          event.preventDefault();
          row.querySelector('.relphi-label-add')?.click();
        });
        row.querySelector('.relphi-label-add').addEventListener('click', () => {
          const values = Array.from(builder.querySelectorAll('[data-relphi-label-input]')).map(node => node.value);
          values.splice(index + 1, 0, '');
          renderLabelBuilder(panel, field, values);
          writeLabelBuilderToHidden(field, builder);
          builder.querySelectorAll('[data-relphi-label-input]')[index + 1]?.focus();
        });
        row.querySelector('.relphi-label-remove').addEventListener('click', () => {
          const values = Array.from(builder.querySelectorAll('[data-relphi-label-input]')).map(node => node.value);
          if (values.length <= 1) {
            values[0] = '';
          } else {
            values.splice(index, 1);
          }
          renderLabelBuilder(panel, field, values);
          writeLabelBuilderToHidden(field, builder);
          const inputs = builder.querySelectorAll('[data-relphi-label-input]');
          inputs[Math.min(index, inputs.length - 1)]?.focus();
        });
      }
      row.querySelector('.relphi-label-number').textContent = String(index + 1) + '.';
      const input = row.querySelector('[data-relphi-label-input]');
      if (document.activeElement !== input && input.value !== value) input.value = value;
    });
    existing.slice(clean.length).forEach(row => row.remove());
    const rows = Array.from(builder.querySelectorAll('.relphi-label-row'));
    rows.forEach((row, index) => {
      const add = row.querySelector('.relphi-label-add');
      const remove = row.querySelector('.relphi-label-remove');
      add.hidden = index !== rows.length - 1;
      remove.hidden = rows.length === 1;
    });
    ensureLabelTemplateSaver(panel, field, builder);
    return builder;
  }
  function syncBuilderFromHidden(panel, field) {
    const builder = field?.closest('.board-setup-group--spread')?.querySelector('.relphi-label-builder');
    if (!builder || !field) return;
    const hiddenLabels = labelsFromHiddenField(field);
    const visibleLabels = Array.from(builder.querySelectorAll('[data-relphi-label-input]')).map(input => input.value);
    if (JSON.stringify(hiddenLabels) !== JSON.stringify(visibleLabels)) renderLabelBuilder(panel, field, hiddenLabels);
  }

  function addLibrary(panel, state) {
    const host = panel.querySelector('.board-setup-group--spread');
    const field = panel.querySelector('#rowPositionLabels');
    if (!host || !field) return;

    const fieldLabel = field.closest('label');
    if (fieldLabel) {
      fieldLabel.classList.add('relphi-position-label-storage');
      fieldLabel.setAttribute('aria-hidden', 'true');
    }
    field.removeAttribute('list');
    field.setAttribute('aria-label', 'Position labels');
    field.tabIndex = -1;
    renderLabelBuilder(panel, field, labelsFromHiddenField(field));
    if (!field.dataset.relphiDirectPositionSync) {
      field.dataset.relphiDirectPositionSync = 'true';
      const syncTypedLabels = () => {
        const live = bridge()?.getState();
        const picker = host.querySelector('#relphiSpreadTemplateSelect');
        if (live?.designMode) return;
        const labels = String(field.value || '').split(',').map(value => value.trim()).filter(Boolean);
        if (!labels.length) return;
        ensurePositionSlots(labels.length);
        const items = Array.from(panel.querySelectorAll('.card-row-board .card-row-item'));
        labels.forEach((label, index) => {
          const editor = items[index]?.querySelector('[data-row-position-label-editor],.card-row-position-editor');
          if (!editor || editor.textContent.trim() === label) return;
          editor.textContent = label;
          editor.dispatchEvent(new Event('input', { bubbles:true }));
          editor.dispatchEvent(new Event('change', { bubbles:true }));
        });
      };
      field.addEventListener('input', () => requestAnimationFrame(syncTypedLabels));
      field.addEventListener('change', syncTypedLabels);
    }

    let library = host.querySelector('.relphi-spread-prefab-library');
    if (!library) {
      library = document.createElement('section');
      library.className = 'relphi-spread-prefab-library relphi-spread-prefab-library--inline';
      library.innerHTML =
        '<label class="relphi-template-select-label">Template' +
          '<span class="relphi-template-select-wrap">' +
            '<select id="relphiSpreadTemplateSelect" aria-label="Spread Template"></select>' +
            '<button id="relphiTemplateClear" class="relphi-template-clear" type="button" aria-label="Clear Spread Template" title="Clear Spread Template">×</button>' +
          '</span>' +
        '</label>' +
        '<div class="relphi-template-editor"></div>';
      const slot = host.querySelector('.relphi-template-inline-slot');
      (slot || host).appendChild(library);

      const select = library.querySelector('#relphiSpreadTemplateSelect');
      select.addEventListener('change', () => {
        const live = bridge()?.getState();
        if (live?.locked && !live?.designMode) return schedule();
        const value = select.value;
        if (!value) {
          selectedId = '';
          templateMode = 'custom';
          draftLayout = null;
          draftName = '';
          copySourceId = '';
          newPromptArmed = false;
          schedule();
          return;
        }
        const prefab = prefabById(value);
        if (prefab) applyForUse(prefab);
      });

      library.querySelector('#relphiTemplateClear').addEventListener('click', event => {
        event.preventDefault();
        const live = bridge()?.getState();
        if (live?.locked && !live?.designMode) return schedule();
        selectedId = '';
        templateMode = 'custom';
        draftLayout = null;
        draftName = '';
        copySourceId = '';
        newPromptArmed = false;
        select.value = '';
        schedule();
      });
    }

    const select = library.querySelector('#relphiSpreadTemplateSelect');
    const activePrefab = prefabById(state.activeLayout?.id);
    if (activePrefab && !state.designMode) selectedId = activePrefab.id;
    const choices = allPrefabs();
    const previous = select.value;
    const optionsHtml =
      '<option value="">Custom / no saved template</option>' +
      choices.map(prefab => '<option value="' + escapeHtml(prefab.id) + '">' + escapeHtml(displayName(prefab)) + '</option>').join('');
    if (select.innerHTML !== optionsHtml) select.innerHTML = optionsHtml;
    const desired = state.designMode
      ? (prefabById(selectedId)?.id || '')
      : (prefabById(selectedId)?.id || (previous && choices.some(item => item.id === previous) ? previous : ''));
    select.value = desired;
    syncBuilderFromHidden(panel, field);
    const structureLocked = !!state.locked && !state.designMode;
    select.disabled = structureLocked || !!state.designMode;
    host.querySelectorAll('.relphi-label-builder input,.relphi-label-builder button').forEach(control => {
      control.disabled = !!state.designMode;
    });

    const clear = library.querySelector('#relphiTemplateClear');
    clear.hidden = !select.value || structureLocked || !!state.designMode;
    clear.disabled = structureLocked || !!state.designMode;

    const editor = library.querySelector('.relphi-template-editor');
    const prefab = prefabById(selectedId) || draftLayout;
    const designing = !!state.designMode;
    const conflict = designing && templateNameConflict(draftName, Number(state.slotCount) || Number(draftLayout?.positions?.length) || 0);

    const editorHtml =
      (designing ?
        '<label class="relphi-spread-design-name">Template name<input id="relphiSpreadDesignName" type="text" maxlength="60" value="' + escapeHtml(draftName || prefab?.name || '') + '" placeholder="Name this template"></label>' +

        '<small id="relphiSpreadNameHelp" class="' + (conflict ? 'is-error' : '') + '">' +
          (conflict ? 'A template with this card count and name already exists.' : 'Move, rotate, label, add, or remove positions, then save the template.') +
        '</small>' : '') +
      '<div class="relphi-prefab-actions">' +
        (!designing && prefab?.source === 'custom' ? '<button type="button" data-prefab-action="edit">Edit Template</button><button type="button" class="danger" data-prefab-action="delete">Delete</button>' : '') +
        (designing ? '<button type="button" data-prefab-action="cancel">Cancel</button><button type="button" data-prefab-action="once">Use Once</button><button type="button" class="primary" data-prefab-action="save"' + (!String(draftName || '').trim() || conflict ? ' disabled' : '') + '>' + (copySourceId ? 'Save As Copy and Use' : 'Save Template and Use') + '</button>' : '') +
      '</div>';
    if (editor.innerHTML !== editorHtml) {
      editor.innerHTML = editorHtml;
      editor.dataset.relphiBindings = '';
    }

    const nameField = editor.querySelector('#relphiSpreadDesignName');
    if (editor.dataset.relphiBindings !== 'true') {
      editor.dataset.relphiBindings = 'true';
      nameField?.addEventListener('input', () => {
        draftName = String(nameField.value || '').slice(0, 60);
        if (draftLayout) draftLayout.name = draftName;
        const live = bridge()?.getState();
        const count = Number(live?.slotCount) || Number(draftLayout?.positions?.length) || 0;
        const conflictNow = !!live?.designMode && templateNameConflict(draftName, count);
        const help = editor.querySelector('#relphiSpreadNameHelp');
        const save = editor.querySelector('[data-prefab-action="save"]');
        if (help) {
          help.classList.toggle('is-error', conflictNow);
          const helpText = conflictNow
            ? 'A template with this card count and name already exists.'
            : 'Move, rotate, label, add, or remove positions, then save the template.';
          if (help.textContent !== helpText) help.textContent = helpText;
        }
        if (save) save.disabled = !draftName.trim() || conflictNow;
      });

      editor.querySelector('[data-prefab-action="edit"]')?.addEventListener('click', () => beginDesign(prefabById(selectedId)));
      editor.querySelector('[data-prefab-action="delete"]')?.addEventListener('click', () => deleteCustom(prefabById(selectedId)));
      editor.querySelector('[data-prefab-action="once"]')?.addEventListener('click', () => finishDesign(false));
      editor.querySelector('[data-prefab-action="cancel"]')?.addEventListener('click', cancelDesign);
      editor.querySelector('[data-prefab-action="save"]')?.addEventListener('click', () => finishDesign(true));
    }
  }
  function addDesignControls(panel, state) {
    panel.classList.toggle('relphi-layout-design-mode', !!state.designMode);
    const workspace = panel.querySelector('.card-row-workspace');
    if (!workspace) return;
    let banner = workspace.querySelector('.relphi-layout-status');
    if (!state.designMode) {
      banner?.remove();
      return;
    }
    if (!banner) {
      banner = document.createElement('aside');
      banner.className = 'relphi-layout-status';
      workspace.insertBefore(banner, workspace.firstChild);
    }
    const bannerHtml = '<strong>Designing Spread Template — card drawing is unavailable</strong><span>Move, rotate, label, add, or remove placeholders. Finish in Board Options.</span><div><button type="button" data-design-action="remove"' + (state.slotCount < 2 ? ' disabled' : '') + '>Remove selected position</button></div>';
    if (banner.innerHTML !== bannerHtml) {
      banner.innerHTML = bannerHtml;
      banner.querySelector('[data-design-action="remove"]')?.addEventListener('click', () => bridge()?.removePosition(state.transformTarget));
    }
  }
  function lockControls(panel, state) {
    const structureLocked = state.locked && !state.designMode;
    ['resetCardRowLayout','resetRowCardTransform'].forEach(id => {
      const control = panel.querySelector('#' + id);
      if (control) control.disabled = structureLocked;
    });
    const add = panel.querySelector('#addCardPlaceholder');
    if (add) add.disabled = structureLocked;
    const draw = panel.querySelector('#drawRandomRowCard');
    if (draw) {
      draw.disabled = !!state.designMode;
      draw.title = state.designMode ? 'Finish designing the layout before drawing' : 'Draw random card';
    }
    panel.querySelectorAll('[data-row-position-label-editor]').forEach(editor => {
      editor.contentEditable = 'true';
      editor.setAttribute('aria-readonly', 'false');
    });
  }
  function applyCenterView(panel, state) {
    const board = panel.querySelector('.card-row-board');
    const layout = state.activeLayout;
    panel.querySelectorAll('.relphi-celtic-crossing-rotated').forEach(item => item.classList.remove('relphi-celtic-crossing-rotated'));
    if (!board || !layout || layout.helper !== 'celtic-center') {
      panel.querySelector('.relphi-center-helper')?.remove();
      return;
    }
    layout.positions.forEach((position, index) => {
      if (!position.role || !['significator','covering','crossing'].includes(position.role)) return;
      const value = state.centerOpen && position.openTransform ? position.openTransform : position.transform;
      const item = board.querySelector('[data-row-index="' + index + '"]');
      if (!item || !value) return;
      item.style.left = Math.round(Number(value.x) * 900) + 'px';
      item.style.top = Math.round(Number(value.y) * 760) + 'px';
      item.style.zIndex = String(Number(value.zIndex) || 1);
      item.style.setProperty('--row-card-scale', String(Number(value.scale) || 1));
      item.style.setProperty('--row-card-rotation', (Number(value.rotation) || 0) + 'deg');
      item.classList.toggle(
        'relphi-celtic-crossing-rotated',
        position.role === 'crossing' && Math.abs(Number(value.rotation) || 0) % 180 === 90
      );
    });
    let helper = board.querySelector('.relphi-center-helper');
    if (!helper) {
      helper = document.createElement('button');
      helper.type = 'button';
      helper.className = 'relphi-center-helper';
      board.appendChild(helper);
    }
    helper.textContent = state.centerOpen ? 'Restore Cross' : 'Open Center';
    helper.setAttribute('aria-pressed', String(!!state.centerOpen));
    helper.onclick = event => {
      event.preventDefault();
      event.stopPropagation();
      bridge()?.setCenterOpen(!state.centerOpen);
      schedule();
    };
  }
  function addWorkspaceControls(panel) {
    const board = panel.querySelector('.card-row-board');
    const workspace = panel.querySelector('.card-row-workspace');
    const toolbar = panel.querySelector('.card-row-workspace-toolbar');
    if (!board || !workspace || !toolbar) return;

    const zoom = toolbar.querySelector('#rowZoom') || document.getElementById('rowZoom');
    if (zoom) {
      zoom.min = '.35';
      zoom.max = '2.4';
      zoom.step = '.025';
    }
    const zoomWord = toolbar.querySelector('.card-row-zoom-label>span');
    if (zoomWord) zoomWord.textContent = 'Zoom';
    const center = toolbar.querySelector('#resetCardRowPan');
    if (center) {
      center.hidden = true;
      center.tabIndex = -1;
      center.setAttribute('aria-hidden', 'true');
    }
    const panNote = toolbar.querySelector('.card-row-pan-note');
    if (panNote) panNote.hidden = true;
    toolbar.querySelector('.board-arrange-flyout')?.remove();

    let extents = toolbar.querySelector('#zoomCardRowExtents');
    if (!extents) {
      extents = document.createElement('button');
      extents.id = 'zoomCardRowExtents';
      extents.type = 'button';
      extents.title = 'Zoom to show all cards';
      extents.setAttribute('aria-label', 'Zoom to show all cards');
      extents.textContent = '⛶';
      extents.addEventListener('click', event => {
        event.preventDefault();
        document.getElementById('resetCardRowPan')?.click();
        const items = Array.from(board.querySelectorAll('.card-row-item'));
        if (!items.length) return;
        const liveZoom = document.getElementById('rowZoom');
        if (!liveZoom) return;
        const logical = items.map(item => {
          const left = Number.parseFloat(item.style.left) || 0;
          const top = Number.parseFloat(item.style.top) || 0;
          const scale = Number.parseFloat(item.style.getPropertyValue('--row-card-scale')) || 1;
          return { left, top, right:left + 210 * scale, bottom:top + 382 * scale };
        });
        const maxX = Math.max(...logical.map(value => value.right));
        const maxY = Math.max(...logical.map(value => value.bottom));
        const fit = Math.max(.35, Math.min(2.4, Math.min((workspace.clientWidth - 72) / Math.max(1, maxX), (workspace.clientHeight - 72) / Math.max(1, maxY))));
        liveZoom.value = String(fit);
        liveZoom.dispatchEvent(new Event('input', { bubbles:true }));
        liveZoom.dispatchEvent(new Event('change', { bubbles:true }));
      });
    }

    let zoomRow = toolbar.querySelector('.relphi-zoom-row');
    if (!zoomRow) {
      zoomRow = document.createElement('div');
      zoomRow.className = 'relphi-zoom-row';
      toolbar.prepend(zoomRow);
    }
    const zoomLabel = toolbar.querySelector('.card-row-zoom-label');
    if (zoomLabel && zoomLabel.parentElement !== zoomRow) zoomRow.appendChild(zoomLabel);
    if (extents && extents.parentElement !== zoomRow) zoomRow.appendChild(extents);
  }
  function enhance() {
    queued = false;
    if (enhancing) return;
    const panel = document.getElementById('shortListPanel');
    const api = bridge();
    if (!panel || panel.hidden || !api) return;
    enhancing = true;
    try {
      const state = api.getState();
      addLibrary(panel, state);
      addDesignControls(panel, state);
      lockControls(panel, state);
      applyCenterView(panel, state);
      addWorkspaceControls(panel);
    } finally {
      enhancing = false;
    }
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(enhance);
  }
  function installStyles() {
    if (document.getElementById('relphi-spread-prefab-styles')) return;
    const style = document.createElement('style');
    style.id = 'relphi-spread-prefab-styles';
    style.textContent = [
      '#shortListPanel .relphi-spread-prefab-library{display:grid;gap:.55rem;padding:.65rem .7rem;border:1px solid #d8cec5;border-radius:10px;background:#fffaf4}',
      '#shortListPanel .row-sticker-prefab-controls{display:none!important}',
      '#shortListPanel .relphi-prefab-heading{display:grid;gap:.15rem}',
      '#shortListPanel .relphi-prefab-heading span,#shortListPanel .relphi-spread-prefab-library small{color:#6b625c;font-size:.7rem;line-height:1.3}',
      '#shortListPanel .relphi-selected-design{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:.25rem .75rem;padding:.45rem .55rem;border:1px solid #e1d8d0;border-radius:7px;background:#fff}',
      '#shortListPanel .relphi-selected-design span{color:#6b625c;font-size:.68rem;font-weight:700}',
      '#shortListPanel .relphi-selected-design strong{font-size:.78rem}',
      '#shortListPanel .relphi-spread-design-name{display:grid!important;gap:.2rem!important;width:100%!important;padding:.55rem!important;border:1px solid #d8cec5!important;border-radius:8px!important;background:#fff!important}',
      '#shortListPanel .relphi-spread-design-name input{margin:0!important}',
      '#shortListPanel .relphi-spread-design-name small{font-weight:500!important}',
      '#shortListPanel .relphi-prefab-actions{display:flex;flex-wrap:wrap;gap:.4rem}',
      '#shortListPanel .relphi-prefab-actions .danger{color:#a01813;border-color:rgba(160,24,19,.45)}',
      '#shortListPanel .relphi-labels-toggle.is-open{border-color:#dc1f18!important;background:#fff4f1!important;color:#b81712!important}',
      '#shortListPanel .relphi-labels-drawer{display:grid;gap:.65rem;margin:0 .6rem .6rem;padding:.75rem;border:1px solid #d5cbc3;border-radius:10px;background:#fffaf4;box-shadow:0 7px 18px rgba(35,24,18,.09)}',
      '#shortListPanel .relphi-labels-drawer[hidden]{display:none!important}',
      '#shortListPanel .relphi-labels-drawer>header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding-bottom:.55rem;border-bottom:1px solid #e6ddd5}',
      '#shortListPanel .relphi-labels-drawer>header div{display:grid;gap:.12rem}',
      '#shortListPanel .relphi-labels-drawer>header strong{font-size:.94rem}',
      '#shortListPanel .relphi-labels-drawer>header span{color:#6b625c;font-size:.72rem;line-height:1.3}',
      '#shortListPanel .relphi-labels-close{min-height:2rem!important;padding:.3rem .55rem!important}',
      '#shortListPanel .relphi-labels-drawer button{min-height:2.25rem!important;padding:.4rem .65rem!important;border:1px solid #aaa098!important;border-radius:7px!important;background:#fff!important;color:#171412!important;font:inherit!important;font-size:.78rem!important;font-weight:800!important;line-height:1.1!important;box-shadow:none!important}',
      '#shortListPanel .relphi-labels-drawer button.primary{border-color:#dc1f18!important;background:#dc1f18!important;color:#fff!important}',
      '#shortListPanel .relphi-labels-field{display:grid!important;grid-template-columns:minmax(0,1fr)!important;align-items:end!important;gap:.55rem!important}',
      '#shortListPanel .relphi-template-omnibox{position:relative;display:grid;min-width:0}',
      '#shortListPanel .relphi-template-omnibox>label{display:grid!important;gap:.2rem!important;width:100%!important;margin:0!important;font-size:.78rem!important;font-weight:800!important}',
      '#shortListPanel .relphi-template-omnibox input[type="text"]{display:block!important;width:100%!important;min-height:2.35rem!important;margin:.2rem 0 0!important;padding:.45rem 2.35rem .45rem 2.65rem!important;border:1px solid #bdb3aa!important;border-radius:7px!important;background:#fff!important;box-sizing:border-box!important}',
      '#shortListPanel .relphi-template-clear{position:absolute!important;right:.25rem!important;bottom:.22rem!important;z-index:2!important;display:grid!important;place-items:center!important;width:1.9rem!important;min-width:1.9rem!important;height:1.9rem!important;min-height:1.9rem!important;padding:0!important;border:0!important;border-radius:999px!important;background:transparent!important;font-size:1.15rem!important;line-height:1!important}',
      '#shortListPanel .relphi-template-clear[hidden]{display:none!important}',
      '#shortListPanel .relphi-template-omnibox .quick-position-sticker-toggle{position:absolute!important;left:.25rem!important;bottom:.22rem!important;z-index:2!important;display:grid!important;place-items:center!important;width:1.9rem!important;min-width:1.9rem!important;height:1.9rem!important;min-height:1.9rem!important;margin:0!important;padding:0!important;border:0!important;border-radius:5px!important;background:transparent!important;color:#b4aca5!important;box-shadow:inset 0 1px 1px rgba(255,255,255,.9),inset 0 -1px 1px rgba(70,55,45,.08)!important;filter:drop-shadow(0 1px 0 rgba(255,255,255,.9));opacity:.72!important;box-sizing:border-box!important;cursor:pointer!important}',
      '#shortListPanel .relphi-template-omnibox .quick-position-sticker-toggle.is-visible{color:#171412!important;opacity:1!important}',
      '#shortListPanel .relphi-labels-field .quick-position-sticker-toggle input{position:absolute!important;width:1px!important;height:1px!important;margin:-1px!important;padding:0!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;white-space:nowrap!important;border:0!important}',
      '#shortListPanel .relphi-template-eye{display:block;width:1.2rem;height:1.2rem;pointer-events:none}',
      '#shortListPanel .relphi-template-eye svg{display:block;width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
      '#shortListPanel .quick-position-sticker-toggle.is-visible .relphi-eye-slash{display:none}',
      '#shortListPanel .relphi-labels-dynamic{display:grid;gap:.55rem}',
      '#shortListPanel #relphiSpreadNameHelp.is-error{color:#a01813!important;font-weight:750!important}',
      '#shortListPanel .relphi-layout-status{position:relative;z-index:1200;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.3rem 1rem;align-items:center;margin:.45rem;padding:.7rem .8rem;border:2px solid #171412;border-radius:10px;background:#fff;color:#171412;box-shadow:0 7px 18px rgba(35,24,18,.14)}',
      '#shortListPanel .relphi-layout-status>strong{font-size:.9rem}',
      '#shortListPanel .relphi-layout-status>span{grid-column:1;color:#5f5751;font-size:.74rem}',
      '#shortListPanel .relphi-layout-status>div{grid-column:2;grid-row:1/3;display:flex;flex-wrap:wrap;justify-content:flex-end;gap:.4rem}',
      '#shortListPanel .relphi-layout-status .primary{background:#dc1f18!important;color:#fff!important;border-color:#dc1f18!important}',
      '#shortListPanel .relphi-layout-design-mode .card-row-item{outline:1px dashed rgba(220,31,24,.35);outline-offset:3px}',
      '#shortListPanel button:disabled{opacity:.45!important;cursor:default!important}',
      '#shortListPanel .relphi-layout-design-mode #drawRandomRowCard{opacity:.52!important}',
      '#shortListPanel .relphi-center-helper{position:absolute;left:410px;top:610px;z-index:160!important;min-width:118px;min-height:46px;padding:.65rem .9rem;border:2px solid #171412;border-radius:999px;background:#fff!important;color:#171412!important;font:inherit;font-size:.78rem;font-weight:900;box-shadow:0 5px 14px rgba(30,20,15,.16);touch-action:manipulation}',
      '#shortListPanel .relphi-center-helper:focus-visible{outline:3px solid rgba(220,31,24,.35);outline-offset:3px}',
      '#shortListPanel .card-row-workspace{position:relative!important;overflow:hidden!important;background-image:var(--row-table-image,none),var(--relphi-board-texture,none)!important;background-position:center,center!important;background-size:cover,var(--relphi-board-texture-size,auto)!important;background-repeat:no-repeat,repeat!important;background-blend-mode:normal,soft-light!important;background-color:var(--row-table-bg,#7d1f28)!important}',
      '#shortListPanel .card-row-workspace .short-list-row.card-row-board{top:0!important;overflow:visible!important;background-image:var(--row-table-image,none),var(--relphi-board-texture,none)!important;background-position:center,center!important;background-size:cover,var(--relphi-board-texture-size,auto)!important;background-repeat:no-repeat,repeat!important;background-blend-mode:normal,soft-light!important;background-color:var(--row-table-bg,#7d1f28)!important}',
      'html body #shortListPanel .card-row-workspace .short-list-row.card-row-board>.card-row-item{position:absolute!important}',
      '#shortListPanel .card-row-workspace-toolbar{position:absolute!important;top:.55rem!important;left:.55rem!important;right:auto!important;z-index:1500!important;display:grid!important;grid-template-columns:1fr!important;justify-items:center!important;gap:.3rem!important;width:2.7rem!important;max-width:2.7rem!important;margin:0!important;padding:.4rem .28rem!important;border:1px solid rgba(23,20,18,.28)!important;border-radius:999px!important;background:rgba(255,250,244,.94)!important;box-shadow:0 4px 12px rgba(30,20,15,.12)!important;backdrop-filter:blur(4px);opacity:0!important;transition:opacity .35s ease!important}',
      '#shortListPanel .card-row-workspace-toolbar:hover,#shortListPanel .card-row-workspace-toolbar:focus-within,#shortListPanel .card-row-workspace-toolbar.is-recently-used{opacity:.96!important}',
      '#shortListPanel .card-row-zoom-label{display:grid!important;justify-items:center!important;gap:.2rem!important;width:auto!important;margin:0!important;padding:0!important}',
      '#shortListPanel .card-row-zoom-label>span{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important}',
      '#shortListPanel #rowZoom{writing-mode:vertical-lr!important;direction:rtl!important;appearance:slider-vertical!important;width:1rem!important;min-width:1rem!important;max-width:1rem!important;height:6.5rem!important;min-height:6.5rem!important;margin:.1rem 0!important;padding:0!important}',
      '#shortListPanel #rowZoomValue{font-size:.58rem!important;font-weight:800!important;line-height:1!important}',
      '#shortListPanel .card-row-workspace-toolbar>button{display:grid!important;place-items:center!important;width:2rem!important;min-width:2rem!important;height:2rem!important;min-height:2rem!important;margin:0!important;padding:0!important;border:1px solid #aaa098!important;border-radius:999px!important;background:#fff!important;color:#171412!important;font-size:1rem!important;line-height:1!important}',
      '#shortListPanel .card-row-drawing-board .card-row-workspace>.card-row-workspace-toolbar{grid-template-columns:1fr!important;grid-auto-flow:row!important;align-items:center!important;justify-content:center!important;height:auto!important;min-height:0!important;max-height:none!important}',
      '#shortListPanel .card-row-drawing-board .card-row-workspace>.card-row-workspace-toolbar .card-row-zoom-label{grid-column:1!important;grid-row:auto!important}',
      '#shortListPanel .card-row-drawing-board .card-row-workspace>.card-row-workspace-toolbar>button{grid-column:1!important;grid-row:auto!important}',
      'html body #shortListPanel .card-row-drawing-board .card-row-workspace>.card-row-workspace-toolbar>*{grid-column:1!important;grid-row:auto!important}',
      'html body #shortListPanel .card-row-drawing-board .card-row-workspace>.card-row-workspace-toolbar>#resetCardRowPan{grid-column:1!important;grid-row:auto!important}',
      '#shortListPanel .card-row-workspace-toolbar .board-arrange-flyout{width:2rem!important;min-width:2rem!important;margin:0!important}',
      '#shortListPanel .card-row-workspace-toolbar .board-arrange-flyout>button{width:2rem!important;min-width:2rem!important;height:2rem!important;min-height:2rem!important;padding:0!important;border-radius:999px!important;font-size:0!important}',
      '#shortListPanel .card-row-workspace-toolbar .board-arrange-flyout>button::before{content:"↔";font-size:1rem}',
      '#shortListPanel .card-row-workspace .relphi-layout-status{margin-left:3.8rem!important}',
      '@media(prefers-reduced-motion:reduce){#shortListPanel .card-row-workspace-toolbar{transition:none!important}}',
      '@media(max-width:700px){#shortListPanel .relphi-labels-field{grid-template-columns:minmax(0,1fr)!important;gap:.35rem!important}#shortListPanel .relphi-layout-status{grid-template-columns:1fr}#shortListPanel .relphi-layout-status>span,#shortListPanel .relphi-layout-status>div{grid-column:1;grid-row:auto}#shortListPanel .relphi-layout-status>div{justify-content:flex-start}#shortListPanel .relphi-prefab-actions button{flex:1 1 46%}}'
    ].join('');
    style.textContent += [
      '#shortListPanel .relphi-spread-prefab-library--inline{order:-1;display:grid!important;gap:.45rem!important;width:100%!important;padding:0!important;border:0!important;background:transparent!important}',
      '#shortListPanel .relphi-template-select-label{display:grid!important;gap:.2rem!important;width:100%!important;margin:0!important;font-size:.78rem!important;font-weight:800!important}',
      '#shortListPanel .relphi-template-select-wrap{position:relative!important;display:block!important;width:100%!important}',
      '#shortListPanel #relphiSpreadTemplateSelect{display:block!important;width:100%!important;min-height:2.35rem!important;margin:.2rem 0 0!important;padding:.45rem 4.2rem .45rem .6rem!important;border:1px solid #bdb3aa!important;border-radius:7px!important;background:#fff!important;color:#171412!important;font:inherit!important;font-size:.84rem!important;font-weight:600!important;box-sizing:border-box!important}',
      '#shortListPanel .relphi-template-select-wrap .relphi-template-clear{position:absolute!important;right:2.05rem!important;top:50%!important;transform:translateY(-43%)!important;z-index:2!important;display:grid!important;place-items:center!important;width:2rem!important;min-width:2rem!important;height:2rem!important;min-height:2rem!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:#5f5751!important;font-size:1.45rem!important;font-weight:500!important;line-height:1!important;box-shadow:none!important}',
      '#shortListPanel .relphi-template-select-wrap .relphi-template-clear:hover{color:#171412!important;background:transparent!important}',
      '#shortListPanel .relphi-template-select-wrap .relphi-template-clear[hidden]{display:none!important}',
      '#shortListPanel .relphi-template-editor{display:grid!important;gap:.45rem!important}',
      '#shortListPanel .board-setup-group--spread>.card-row-position-label{width:100%!important}',
      '#shortListPanel .board-setup-group--spread>.quick-position-sticker-toggle{width:100%!important}',
      '#shortListPanel .board-reading-toggle-stack>label::after{content:none!important;display:none!important}',
      '#shortListPanel .card-row-workspace .card-row-item.relphi-celtic-crossing-rotated{transform:scale(var(--row-card-scale,1))!important;transform-origin:0 0!important}',
      '#shortListPanel .card-row-workspace .card-row-item.relphi-celtic-crossing-rotated>.card-row-card-wrap,#shortListPanel .card-row-workspace .card-row-item.relphi-celtic-crossing-rotated>.card-row-drop-card{transform:rotate(90deg)!important;transform-origin:50% 50%!important}',
      '#shortListPanel .card-row-workspace .card-row-item.relphi-celtic-crossing-rotated>.card-row-drop-card>.card-row-drop-card-inner{transform:rotate(-90deg)!important}',
      '#shortListPanel .card-row-workspace .card-row-item.relphi-celtic-crossing-rotated>.card-row-position-panel{left:calc(100% + 3rem)!important;right:auto!important;top:50%!important;bottom:auto!important;width:7rem!important;max-width:7rem!important;transform:translateY(-50%)!important;white-space:normal!important}',
      '#shortListPanel .relphi-labels-toggle,#shortListPanel .relphi-labels-drawer{display:none!important}',
      '#shortListPanel .card-row-workspace-toolbar{position:absolute!important;top:auto!important;left:auto!important;right:.65rem!important;bottom:.65rem!important;z-index:1500!important;display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-end!important;gap:.38rem!important;width:auto!important;min-width:0!important;max-width:none!important;height:auto!important;min-height:0!important;margin:0!important;padding:.38rem .45rem!important;border:1px solid rgba(23,20,18,.24)!important;border-radius:10px!important;background:rgba(255,250,244,.95)!important;box-shadow:0 4px 12px rgba(30,20,15,.12)!important;opacity:1!important;transition:none!important}',
      '#shortListPanel .card-row-workspace-toolbar .card-row-zoom-label{display:flex!important;flex-direction:row!important;align-items:center!important;gap:.35rem!important;width:auto!important;margin:0!important;padding:0!important}',
      '#shortListPanel .card-row-workspace-toolbar .card-row-zoom-label>span{position:static!important;width:auto!important;height:auto!important;overflow:visible!important;clip:auto!important;white-space:nowrap!important;color:#171412!important;font-size:.68rem!important;font-weight:850!important}',
      '#shortListPanel #rowZoom{writing-mode:horizontal-tb!important;direction:ltr!important;appearance:auto!important;width:7.25rem!important;min-width:7.25rem!important;max-width:7.25rem!important;height:1rem!important;min-height:1rem!important;margin:0!important;padding:0!important}',
      '#shortListPanel #rowZoomValue{min-width:2.6rem!important;font-size:.62rem!important;font-weight:800!important;line-height:1!important;text-align:center!important}',
      '#shortListPanel #resetCardRowPan,#shortListPanel .card-row-workspace-toolbar .card-row-pan-note,#shortListPanel .card-row-workspace-toolbar .board-arrange-flyout{display:none!important}',
      '#shortListPanel .card-row-workspace-toolbar>#zoomCardRowExtents{display:grid!important;place-items:center!important;width:2rem!important;min-width:2rem!important;height:2rem!important;min-height:2rem!important;margin:0!important;padding:0!important;border:1px solid #aaa098!important;border-radius:7px!important;background:#fff!important;color:#171412!important;font-size:1rem!important;line-height:1!important}',
      '#shortListPanel .card-row-workspace-toolbar{display:inline-flex!important;flex-flow:row nowrap!important;align-items:center!important;justify-content:flex-end!important;white-space:nowrap!important;width:auto!important;min-width:max-content!important;max-width:calc(100% - 1.3rem)!important}',
      '#shortListPanel .card-row-workspace-toolbar .card-row-zoom-label{display:inline-flex!important;flex-flow:row nowrap!important;align-items:center!important;gap:.35rem!important;flex:0 0 auto!important;width:auto!important;min-width:0!important;white-space:nowrap!important}',
      '#shortListPanel .card-row-workspace-toolbar .card-row-zoom-label>span{display:inline!important;position:static!important;width:auto!important;height:auto!important;overflow:visible!important;clip:auto!important;white-space:nowrap!important}',
      '#shortListPanel #rowZoom{display:block!important;flex:0 0 7.25rem!important;width:7.25rem!important;min-width:7.25rem!important;max-width:7.25rem!important}',
      '#shortListPanel #rowZoomValue{display:none!important}',
      '#shortListPanel .card-row-workspace-toolbar>#zoomCardRowExtents{display:inline-grid!important;flex:0 0 2rem!important;align-self:center!important}',
      '#shortListPanel .card-row-workspace .relphi-layout-status{margin-left:.45rem!important;margin-right:.45rem!important}',
      '@media(max-width:620px){#shortListPanel #rowZoom{width:5.5rem!important;min-width:5.5rem!important;max-width:5.5rem!important}#shortListPanel .card-row-workspace-toolbar{right:.45rem!important;bottom:.45rem!important}}'
    ].join('');
    style.textContent += [
      '#shortListPanel .relphi-position-label-storage{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;white-space:nowrap!important}',
      '#shortListPanel .relphi-label-builder{display:grid!important;gap:.35rem!important;width:100%!important;margin:0!important}',
      '#shortListPanel .relphi-label-row{display:grid!important;grid-template-columns:1.65rem minmax(0,1fr) 2.15rem 2.15rem!important;gap:.3rem!important;align-items:center!important;width:100%!important}',
      '#shortListPanel .relphi-label-number{font-size:.78rem!important;font-weight:900!important;text-align:right!important}',
      '#shortListPanel .relphi-label-row input{width:100%!important;min-width:0!important;height:2.25rem!important;margin:0!important;padding:.4rem .55rem!important;border:1px solid #c9bfb7!important;border-radius:7px!important;background:#fff!important;box-sizing:border-box!important;font:inherit!important}',
      '#shortListPanel .relphi-label-row button{display:grid!important;place-items:center!important;width:2.15rem!important;min-width:2.15rem!important;height:2.15rem!important;min-height:2.15rem!important;margin:0!important;padding:0!important;border:1px solid #aaa098!important;border-radius:7px!important;background:#fff!important;color:#171412!important;font-size:1.15rem!important;font-weight:800!important;line-height:1!important}',
      '#shortListPanel .relphi-label-row button[hidden]{display:none!important}',
      '#shortListPanel .relphi-label-row button:disabled,#shortListPanel .relphi-label-row input:disabled{opacity:.45!important;cursor:default!important}',
      '#shortListPanel .relphi-spread-prefab-library--inline{margin-top:.15rem!important}',
      '@media(max-width:560px){#shortListPanel .relphi-label-row{grid-template-columns:1.45rem minmax(0,1fr) 2rem 2rem!important}}'
    ].join('');
    style.textContent += [
      '#shortListPanel .relphi-label-template-row{display:grid!important;grid-template-columns:auto minmax(15rem,1fr)!important;gap:.65rem!important;align-items:center!important;width:100%!important;margin:.05rem 0 .35rem!important}',
      '#shortListPanel .relphi-label-template-row>strong{font-size:.76rem!important;white-space:nowrap!important}',
      '#shortListPanel .relphi-template-inline-slot{min-width:0!important}',
      '#shortListPanel .relphi-template-inline-slot .relphi-spread-prefab-library--inline{margin:0!important}',
      '#shortListPanel .relphi-template-inline-slot .relphi-template-select-label{display:grid!important;grid-template-columns:auto minmax(0,1fr)!important;gap:.45rem!important;align-items:center!important;font-size:.72rem!important}',
      '#shortListPanel .relphi-template-inline-slot .relphi-template-select-wrap{min-width:0!important}',
      '#shortListPanel .relphi-template-inline-slot #relphiSpreadTemplateSelect{margin:0!important;min-height:2.25rem!important}',
      '@media(max-width:700px){#shortListPanel .relphi-label-template-row{grid-template-columns:1fr!important}#shortListPanel .relphi-template-inline-slot .relphi-template-select-label{grid-template-columns:1fr!important}}'
    ].join('');
    style.textContent += [
      '#shortListPanel .board-setup-group--spread .card-row-draw-scope-label{display:grid!important;gap:.2rem!important;width:100%!important;margin:.05rem 0!important;font-size:.76rem!important;font-weight:850!important}',
      '#shortListPanel .board-setup-group--spread .card-row-draw-scope-label select{width:100%!important;margin:0!important}',
      '#shortListPanel .board-reading-toggle-stack>label::after{justify-self:end!important}',
      '#shortListPanel .board-reading-toggle-stack>label:has(input:disabled){opacity:.5!important}'
    ].join('');
    style.textContent += [
      '#shortListPanel .card-row-workspace-toolbar{display:block!important;width:auto!important;min-width:0!important;max-width:none!important;padding:.38rem .45rem!important}',
      '#shortListPanel .card-row-workspace-toolbar .relphi-zoom-row{display:flex!important;flex-flow:row nowrap!important;align-items:center!important;justify-content:flex-start!important;gap:.38rem!important;width:max-content!important;min-width:max-content!important;max-width:none!important;white-space:nowrap!important}',
      '#shortListPanel .card-row-workspace-toolbar .relphi-zoom-row .card-row-zoom-label{display:flex!important;flex-flow:row nowrap!important;align-items:center!important;gap:.35rem!important;flex:0 0 auto!important;width:auto!important;min-width:0!important;margin:0!important;padding:0!important;white-space:nowrap!important}',
      '#shortListPanel .card-row-workspace-toolbar .relphi-zoom-row #rowZoom{display:block!important;flex:0 0 7.25rem!important;width:7.25rem!important;min-width:7.25rem!important;max-width:7.25rem!important;height:1rem!important;margin:0!important}',
      '#shortListPanel .card-row-workspace-toolbar .relphi-zoom-row #rowZoomValue{display:none!important}',
      '#shortListPanel .card-row-workspace-toolbar .relphi-zoom-row #zoomCardRowExtents{display:grid!important;place-items:center!important;flex:0 0 2rem!important;width:2rem!important;min-width:2rem!important;height:2rem!important;min-height:2rem!important;margin:0!important}',
      '@media(max-width:620px){#shortListPanel .card-row-workspace-toolbar .relphi-zoom-row #rowZoom{flex-basis:5.5rem!important;width:5.5rem!important;min-width:5.5rem!important;max-width:5.5rem!important}}'
    ].join('');
    style.textContent += [
      '#shortListPanel .board-setup-group--spread>header{display:flex!important;align-items:baseline!important;justify-content:space-between!important;gap:.65rem!important;flex-wrap:nowrap!important}',
      '#shortListPanel .board-setup-group--spread>header>strong{flex:0 0 auto!important}',
    ].join('');
    style.textContent += [
      'html body #shortListPanel .card-row-workspace .card-row-item.relphi-celtic-crossing-rotated{background:transparent!important;background-color:transparent!important;border-color:transparent!important;box-shadow:none!important}',
      'html body #shortListPanel .card-row-workspace .card-row-item.relphi-celtic-crossing-rotated>.card-row-position-panel{left:50%!important;right:auto!important;top:50%!important;bottom:auto!important;width:max-content!important;max-width:8.5rem!important;margin:0!important;transform:translate(-50%,-5.25rem)!important;z-index:160!important;white-space:normal!important}',
      'html body #shortListPanel .card-row-workspace .card-row-item.relphi-celtic-crossing-rotated>.card-row-drop-card>.card-row-drop-card-inner{display:none!important}'
    ].join('');
    style.textContent += [
      'html body #shortListPanel #addCardPlaceholder{display:none!important}',
      'html body #shortListPanel .drawing-board-top-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:.35rem!important;flex-wrap:wrap!important;margin:.35rem .45rem!important;padding:0!important;background:transparent!important}',
      'html body #shortListPanel .drawing-board-top-actions>button{flex:0 0 auto!important;width:auto!important;min-width:0!important;min-height:2.15rem!important;margin:0!important;padding:.38rem .68rem!important;border:1px solid #aaa098!important;border-radius:7px!important;background:#fff!important;color:#171412!important;font:inherit!important;font-size:.78rem!important;font-weight:850!important;line-height:1!important;box-shadow:none!important}',
      'html body #shortListPanel .drawing-board-top-actions>#drawRandomRowCard{border-color:#dc1f18!important;background:#dc1f18!important;color:#fff!important}',
      'html body #shortListPanel .drawing-board-top-actions>#clearShortListCardsOnly:not(:disabled){border-color:rgba(220,31,24,.45)!important;color:#b81712!important}',
      'html body #shortListPanel .card-row-workspace>.relphi-reading-options-drawer{width:min(29rem,calc(100% - 1rem))!important;max-width:min(29rem,calc(100% - 1rem))!important;max-height:min(72vh,42rem)!important}',
      'html body #shortListPanel .relphi-reading-options-drawer>.card-row-composer{display:block!important;width:100%!important;max-width:100%!important;padding:.45rem!important;box-sizing:border-box!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .card-row-control-block--setup{display:block!important;width:100%!important;max-width:100%!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .card-row-control-block--setup>.board-options-body{display:block!important;width:100%!important;max-width:100%!important;padding:0!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .board-setup-group--spread{display:flex!important;flex-direction:column!important;gap:.55rem!important;width:100%!important;max-width:100%!important;margin:0!important;padding:.65rem!important;box-sizing:border-box!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .board-setup-group--spread>.card-row-name-label{order:1!important;width:100%!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .relphi-label-template-row{order:2!important;display:grid!important;grid-template-columns:1fr!important;gap:.4rem!important;width:100%!important;align-items:start!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .relphi-label-template-row>strong{font-size:.78rem!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .relphi-template-inline-slot{width:100%!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .relphi-template-select-label{display:grid!important;grid-template-columns:1fr!important;gap:.18rem!important;width:100%!important}',
      'html body #shortListPanel .relphi-reading-options-drawer #relphiSpreadTemplateSelect{display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;padding-right:3.2rem!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .relphi-label-builder{order:3!important;display:grid!important;gap:.35rem!important;width:100%!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .relphi-label-row{display:grid!important;grid-template-columns:1.6rem minmax(0,1fr) 2.1rem 2.1rem!important;gap:.3rem!important;align-items:center!important;width:100%!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .relphi-label-row>input{width:100%!important;min-width:0!important;margin:0!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .relphi-label-template-saver{order:4!important;display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:.35rem!important;align-items:end!important;width:100%!important;padding-top:.15rem!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .relphi-label-template-saver>label{display:grid!important;gap:.18rem!important;width:100%!important;margin:0!important;font-size:.72rem!important;font-weight:800!important}',
      'html body #shortListPanel .relphi-reading-options-drawer #relphiLabelTemplateName{width:100%!important;min-width:0!important;margin:0!important}',
      'html body #shortListPanel .relphi-reading-options-drawer #relphiSaveLabelsAsTemplate{width:auto!important;min-width:max-content!important;min-height:2.35rem!important;margin:0!important;padding:.42rem .65rem!important;white-space:nowrap!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .relphi-label-template-status{grid-column:1/-1!important;min-height:0!important;color:#6b625c!important;font-size:.68rem!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .board-draw-settings-row{order:5!important;display:grid!important;grid-template-columns:minmax(9rem,1fr) auto!important;gap:.45rem!important;align-items:end!important;width:100%!important;margin:0!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .board-reading-toggle-stack{display:flex!important;align-items:center!important;gap:.3rem!important;flex-wrap:nowrap!important;width:auto!important;margin:0!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .board-reading-toggle-stack>label{display:inline-flex!important;align-items:center!important;gap:.28rem!important;flex:0 0 auto!important;width:auto!important;min-width:0!important;min-height:2.2rem!important;margin:0!important;padding:.34rem .48rem!important;white-space:nowrap!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .board-reset-action{order:6!important;align-self:flex-start!important;margin-top:.1rem!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .relphi-position-label-storage{display:none!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .relphi-template-editor:empty{display:none!important}',
      'html body #shortListPanel .relphi-snap-reset-layout{grid-column:1/-1!important;width:auto!important;justify-self:start!important;margin-top:.15rem!important}',
      '@media(max-width:620px){html body #shortListPanel .relphi-reading-options-drawer .board-draw-settings-row{grid-template-columns:1fr!important}html body #shortListPanel .relphi-reading-options-drawer .board-reading-toggle-stack{flex-wrap:wrap!important}html body #shortListPanel .relphi-reading-options-drawer .relphi-label-template-saver{grid-template-columns:1fr!important}html body #shortListPanel .relphi-reading-options-drawer #relphiSaveLabelsAsTemplate{justify-self:start!important}}'
    ].join('');
    style.textContent += [
      'html body #shortListPanel .drawing-board-top-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:.35rem!important;flex-wrap:nowrap!important;width:calc(100% - .9rem)!important;max-width:calc(100% - .9rem)!important;margin:.35rem .45rem!important}',
      'html body #shortListPanel .drawing-board-top-actions>#drawingBoardOptionsButton{order:0!important;flex:0 0 auto!important;margin-right:auto!important}',
      'html body #shortListPanel .drawing-board-top-actions>#drawRandomRowCard{order:10!important}',
      'html body #shortListPanel .drawing-board-top-actions>#undoShortList{order:11!important}',
      'html body #shortListPanel .drawing-board-top-actions>#redoShortList{order:12!important}',
      'html body #shortListPanel .drawing-board-top-actions>#clearShortListCardsOnly{order:13!important}',
      'html body #shortListPanel .drawing-board-top-actions>.board-history-icon{display:inline-grid!important;place-items:center!important;flex:0 0 2.25rem!important;width:2.25rem!important;min-width:2.25rem!important;max-width:2.25rem!important;height:2.25rem!important;min-height:2.25rem!important;padding:0!important;border-radius:7px!important}',
      'html body #shortListPanel .drawing-board-top-actions>.board-history-icon svg{width:1.2rem!important;height:1.2rem!important}',
      'html body #shortListPanel .card-row-workspace>.relphi-reading-options-drawer{left:.5rem!important;right:auto!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .card-row-composer.is-relphi-organized,html body #shortListPanel .relphi-reading-options-drawer .card-row-control-block--setup,html body #shortListPanel .relphi-reading-options-drawer .card-row-control-block--setup>.board-options-body,html body #shortListPanel .relphi-reading-options-drawer .board-setup-group--spread{width:100%!important;max-width:100%!important;box-sizing:border-box!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .board-setup-group--spread{display:flex!important;flex-direction:column!important;gap:.55rem!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .board-draw-settings-row{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:.38rem!important;width:100%!important;margin:0!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .board-draw-settings-row>.card-row-draw-scope-label{width:100%!important;max-width:100%!important;margin:0!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .board-draw-settings-row>.card-row-draw-scope-label select{width:100%!important;max-width:100%!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .board-reading-toggle-stack{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;align-items:stretch!important;gap:.35rem!important;width:100%!important;max-width:100%!important;margin:0!important}',
      'html body #shortListPanel .relphi-reading-options-drawer .board-reading-toggle-stack>label{display:flex!important;align-items:center!important;justify-content:flex-start!important;width:100%!important;min-width:0!important;max-width:none!important;margin:0!important;padding:.34rem .5rem!important;box-sizing:border-box!important;white-space:nowrap!important}',
      '@media(max-width:560px){html body #shortListPanel .drawing-board-top-actions{flex-wrap:wrap!important}html body #shortListPanel .relphi-reading-options-drawer .board-reading-toggle-stack{grid-template-columns:repeat(3,minmax(0,1fr))!important}}'
    ].join('');
    document.head.appendChild(style);
  }
  function start() {
    migrateLegacy();
    installStyles();
    document.addEventListener('relphi:drawing-board-rendered', schedule);
    document.addEventListener('relphi:drawing-board-center-view', schedule);
    new MutationObserver(records => {
      if (records.some(record => Array.from(record.addedNodes).some(node => node.nodeType === 1 && (node.id === 'shortListPanel' || node.querySelector?.('#shortListPanel,.card-row-drawing-board'))))) schedule();
    }).observe(document.body, { childList:true, subtree:true });
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
  window.RelphiDrawingBoardSpreadPrefabs = Object.freeze({
    shipped:SHIPPED.map(clone),
    list:allPrefabs
  });
})();
