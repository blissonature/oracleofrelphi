// Structured Drawing Board spread prefabs: shipped layouts, custom design, snapshots, and Celtic center views.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;

  const CUSTOM_KEY = 'relphiDrawingBoardSpreadPrefabsV2';
  const LEGACY_KEY = 'relphiDrawingBoardStickerPrefabsV1';
  const MAX_CUSTOM = 40;
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
        position('self', '7 · Yourself', 7, transform(.76, .718, 0, .45, 4)),
        position('house', '8 · Your house', 8, transform(.76, .492, 0, .45, 4)),
        position('hopes-fears', '9 · Your hopes or fears', 9, transform(.76, .266, 0, .45, 4)),
        position('outcome', '10 · What will come', 10, transform(.76, .04, 0, .45, 4))
      ]
    },
    {
      id:'celtic-cross-11',
      name:'Celtic Cross',
      cardCount:11,
      source:'shipped',
      editable:false,
      helper:'celtic-center',
      positions:[
        position('significator', 'Significator', 1, transform(.25, .326, 0, .45, 10), {
          role:'significator',
          openTransform:transform(.145, .326, 0, .45, 10)
        }),
        position('covering', '1 · What covers you', 2, transform(.25, .326, 0, .45, 20), {
          role:'covering',
          covers:'significator',
          openTransform:transform(.25, .326, 0, .45, 20)
        }),
        position('crossing', '2 · What crosses you', 3, transform(.25, .326, 90, .45, 30), {
          role:'crossing',
          crosses:'covering',
          openTransform:transform(.355, .326, 0, .45, 30)
        }),
        position('crowning', '3 · What crowns you', 4, transform(.25, .10, 0, .45, 4)),
        position('beneath', '4 · What is beneath you', 5, transform(.25, .552, 0, .45, 4)),
        position('behind', '5 · What is behind you', 6, transform(.04, .326, 0, .45, 4)),
        position('before', '6 · What is before you', 7, transform(.46, .326, 0, .45, 4)),
        position('self', '7 · Yourself', 8, transform(.76, .718, 0, .45, 4)),
        position('house', '8 · Your house', 9, transform(.76, .492, 0, .45, 4)),
        position('hopes-fears', '9 · Your hopes or fears', 10, transform(.76, .266, 0, .45, 4)),
        position('outcome', '10 · What will come', 11, transform(.76, .04, 0, .45, 4))
      ]
    },
    {
      id:'six-polarities-houses-12',
      name:'Six Polarities of the Houses',
      cardCount:12,
      source:'shipped',
      editable:false,
      positions:[
        position('aries', 'Aries', 1, transform(.06, .02, 0, .40)),
        position('libra', 'Libra', 2, transform(.68, .02, 0, .40)),
        position('taurus', 'Taurus', 3, transform(.06, .18, 0, .40)),
        position('scorpio', 'Scorpio', 4, transform(.68, .18, 0, .40)),
        position('gemini', 'Gemini', 5, transform(.06, .34, 0, .40)),
        position('sagittarius', 'Sagittarius', 6, transform(.68, .34, 0, .40)),
        position('cancer', 'Cancer', 7, transform(.06, .50, 0, .40)),
        position('capricorn', 'Capricorn', 8, transform(.68, .50, 0, .40)),
        position('leo', 'Leo', 9, transform(.06, .66, 0, .40)),
        position('aquarius', 'Aquarius', 10, transform(.68, .66, 0, .40)),
        position('virgo', 'Virgo', 11, transform(.06, .82, 0, .40)),
        position('pisces', 'Pisces', 12, transform(.68, .82, 0, .40))
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
        allowReversals:!!prefab.rules?.allowReversals,
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
      return Array.isArray(value) ? value.map(sanitizeCustom).filter(Boolean) : [];
    } catch (_) { return []; }
  }
  function writeCustomPrefabs(prefabs) {
    const clean = prefabs.map(sanitizeCustom).filter(Boolean).filter(item => !SHIPPED.some(shipped => shipped.id === item.id)).slice(0, MAX_CUSTOM);
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
  function dispatchPositionLabels(labels) {
    const field = document.querySelector('#shortListPanel #rowPositionLabels');
    if (!field) return false;
    const value = (labels || []).join(', ');
    field.value = value;
    field.dataset.relphiManualValue = value;
    field.dispatchEvent(new Event('input', { bubbles:true }));
    field.dispatchEvent(new Event('change', { bubbles:true }));
    return true;
  }
  function ensurePositionSlots(count) {
    const panel = document.getElementById('shortListPanel');
    const add = panel?.querySelector('#addCardPlaceholder');
    if (!panel || !add || count < 1) return;
    let guard = 0;
    while (Number(bridge()?.getState()?.slotCount || panel.querySelectorAll('.card-row-board .card-row-item').length) < count && guard < count + 4) {
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
    stagePrefab(prefab);
    if (!bridge()?.applyLayout(clone(prefab), { designMode:false })) return;
    selectedId = prefab.id;
    draftLayout = null;
    draftName = '';
    copySourceId = '';
    templateMode = 'existing';
    schedule();
  }
  function beginDesign(prefab, options = {}) {
    if (!prefab || !requireClear('design a layout')) return;
    const copy = clone(prefab);
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
  function addLibrary(panel, state) {
    const host = panel.querySelector('.board-setup-group--spread');
    const field = panel.querySelector('#rowPositionLabels');
    if (!host || !field) return;

    const fieldLabel = field.closest('label');
    if (fieldLabel && !fieldLabel.dataset.relphiPositionLabel) {
      const textNode = Array.from(fieldLabel.childNodes).find(node => node.nodeType === 3);
      if (textNode) textNode.nodeValue = 'Position labels ';
      fieldLabel.dataset.relphiPositionLabel = 'true';
    }
    field.removeAttribute('list');
    field.setAttribute('placeholder', 'Aries, Libra, Taurus, Scorpio…');
    field.setAttribute('aria-label', 'Position labels');
    if (!field.dataset.relphiDirectPositionSync) {
      field.dataset.relphiDirectPositionSync = 'true';
      const syncTypedLabels = () => {
        const live = bridge()?.getState();
        const picker = host.querySelector('#relphiSpreadTemplateSelect');
        if (live?.locked || live?.designMode || (picker?.value && picker.value !== '__new__')) return;
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
        '<label class="relphi-template-select-label">Spread Template' +
          '<span class="relphi-template-select-wrap">' +
            '<select id="relphiSpreadTemplateSelect" aria-label="Spread Template"></select>' +
            '<button id="relphiTemplateClear" class="relphi-template-clear" type="button" aria-label="Clear Spread Template" title="Clear Spread Template">×</button>' +
          '</span>' +
        '</label>' +
        '<div class="relphi-settings-lock-note" role="note" hidden></div>' +
        '<div class="relphi-template-editor"></div>';
      host.insertBefore(library, fieldLabel || host.firstChild);

      const select = library.querySelector('#relphiSpreadTemplateSelect');
      select.addEventListener('change', () => {
        const live = bridge()?.getState();
        if (live?.locked && !live?.designMode) return schedule();
        const value = select.value;
        if (value === '__new__') {
          selectedId = '';
          templateMode = 'new';
          draftLayout = null;
          draftName = '';
          copySourceId = '';
          newPromptArmed = false;
          if (!String(field.value || '').trim()) dispatchPositionLabels([]);
          schedule();
          return;
        }
        if (!value) {
          selectedId = '';
          templateMode = 'new';
          draftLayout = null;
          draftName = '';
          copySourceId = '';
          newPromptArmed = false;
          dispatchPositionLabels([]);
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
        templateMode = 'new';
        draftLayout = null;
        draftName = '';
        copySourceId = '';
        newPromptArmed = false;
        select.value = '';
        dispatchPositionLabels([]);
        schedule();
      });
    }

    const select = library.querySelector('#relphiSpreadTemplateSelect');
    const activePrefab = prefabById(state.activeLayout?.id);
    if (activePrefab && !state.designMode) selectedId = activePrefab.id;
    const choices = allPrefabs();
    const previous = select.value;
    select.innerHTML =
      '<option value="">Custom / no saved template</option>' +
      '<option value="__new__">New template…</option>' +
      choices.map(prefab => '<option value="' + escapeHtml(prefab.id) + '">' + escapeHtml(displayName(prefab)) + '</option>').join('');
    const desired = state.designMode
      ? (prefabById(selectedId)?.id || '')
      : (prefabById(selectedId)?.id || (previous && choices.some(item => item.id === previous) ? previous : ''));
    select.value = desired;
    const structureLocked = !!state.locked && !state.designMode;
    select.disabled = structureLocked || !!state.designMode;

    const clear = library.querySelector('#relphiTemplateClear');
    clear.hidden = !select.value || select.value === '__new__' || structureLocked || !!state.designMode;
    clear.disabled = structureLocked || !!state.designMode;

    const lockNote = library.querySelector('.relphi-settings-lock-note');
    lockNote.hidden = !structureLocked;
    lockNote.textContent = structureLocked
      ? 'Spread and draw settings are locked while cards are on the board. Clear the board to change them.'
      : '';

    const editor = library.querySelector('.relphi-template-editor');
    const prefab = prefabById(selectedId) || draftLayout;
    const designing = !!state.designMode;
    const isNew = templateMode === 'new' && !designing;
    const conflict = designing && templateNameConflict(draftName, Number(state.slotCount) || Number(draftLayout?.positions?.length) || 0);

    editor.innerHTML =
      ((isNew || designing) ?
        '<label class="relphi-spread-design-name">Template name<input id="relphiSpreadDesignName" type="text" maxlength="60" value="' + escapeHtml(draftName || prefab?.name || '') + '" placeholder="Name this template"></label>' : '') +
      (designing ?
        '<small id="relphiSpreadNameHelp" class="' + (conflict ? 'is-error' : '') + '">' +
          (conflict ? 'A template with this card count and name already exists.' : 'Move, rotate, label, add, or remove positions, then save the template.') +
        '</small>' : '') +
      '<div class="relphi-prefab-actions">' +
        (!designing && isNew ? '<button type="button" class="primary" data-prefab-action="design">Design Template</button>' : '') +
        (!designing && prefab?.source === 'shipped' ? '<button type="button" data-prefab-action="copy">Customize a Copy</button>' : '') +
        (!designing && prefab?.source === 'custom' ? '<button type="button" data-prefab-action="edit">Edit Template</button><button type="button" class="danger" data-prefab-action="delete">Delete</button>' : '') +
        (designing ? '<button type="button" data-prefab-action="cancel">Cancel</button><button type="button" data-prefab-action="once">Use Once</button><button type="button" class="primary" data-prefab-action="save"' + (!String(draftName || '').trim() || conflict ? ' disabled' : '') + '>' + (copySourceId ? 'Save As Copy and Use' : 'Save Template and Use') + '</button>' : '') +
      '</div>';

    const nameField = editor.querySelector('#relphiSpreadDesignName');
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
        help.textContent = conflictNow
          ? 'A template with this card count and name already exists.'
          : 'Move, rotate, label, add, or remove positions, then save the template.';
      }
      if (save) save.disabled = !draftName.trim() || conflictNow;
    });

    editor.querySelector('[data-prefab-action="design"]')?.addEventListener('click', beginCustomDesign);
    editor.querySelector('[data-prefab-action="copy"]')?.addEventListener('click', () => beginDesign(prefabById(selectedId), { copy:true }));
    editor.querySelector('[data-prefab-action="edit"]')?.addEventListener('click', () => beginDesign(prefabById(selectedId)));
    editor.querySelector('[data-prefab-action="delete"]')?.addEventListener('click', () => deleteCustom(prefabById(selectedId)));
    editor.querySelector('[data-prefab-action="once"]')?.addEventListener('click', () => finishDesign(false));
    editor.querySelector('[data-prefab-action="cancel"]')?.addEventListener('click', cancelDesign);
    editor.querySelector('[data-prefab-action="save"]')?.addEventListener('click', () => finishDesign(true));
  }
  function addDesignControls(panel, state) {
    panel.classList.toggle('relphi-layout-design-mode', !!state.designMode);
    const workspace = panel.querySelector('.card-row-workspace');
    if (!workspace) return;
    let banner = workspace.querySelector('.relphi-layout-status');
    if (!state.designMode && !state.activeLayout) {
      banner?.remove();
      return;
    }
    if (!banner) {
      banner = document.createElement('aside');
      banner.className = 'relphi-layout-status';
      workspace.insertBefore(banner, workspace.firstChild);
    }
    if (state.designMode) {
      banner.innerHTML = '<strong>Designing Spread Template — card drawing is unavailable</strong><span>Move, rotate, label, add, or remove placeholders. Finish in Board Options.</span><div><button type="button" data-design-action="remove"' + (state.slotCount < 2 ? ' disabled' : '') + '>Remove selected position</button></div>';
      banner.querySelector('[data-design-action="remove"]')?.addEventListener('click', () => bridge()?.removePosition(state.transformTarget));
    } else {
      banner.innerHTML = '<strong>Active layout locked</strong><span>' + (state.activeLayout ? displayName(state.activeLayout) : 'Custom layout') + ' is locked for this reading. Clear the board to change the spread or draw settings.</span>';
    }
  }
  function lockControls(panel, state) {
    const structureLocked = state.locked && !state.designMode;
    ['rowPositionLabels','rowDrawScope','rowAllowRepeats','rowAllowReversalsQuick','rowSnapEnabled','rowRotationSnapEnabled','resetCardRowLayout','resetRowCardTransform'].forEach(id => {
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
      editor.contentEditable = state.designMode || !state.locked ? 'true' : 'false';
      editor.setAttribute('aria-readonly', state.designMode || !state.locked ? 'false' : 'true');
    });
  }
  function applyCenterView(panel, state) {
    const board = panel.querySelector('.card-row-board');
    const layout = state.activeLayout;
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
      toolbar.appendChild(extents);
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
      '#shortListPanel .relphi-center-helper{position:absolute;left:540px;top:610px;z-index:160!important;min-width:118px;min-height:46px;padding:.65rem .9rem;border:2px solid #171412;border-radius:999px;background:#fff!important;color:#171412!important;font:inherit;font-size:.78rem;font-weight:900;box-shadow:0 5px 14px rgba(30,20,15,.16);touch-action:manipulation}',
      '#shortListPanel .relphi-center-helper:focus-visible{outline:3px solid rgba(220,31,24,.35);outline-offset:3px}',
      '#shortListPanel .card-row-workspace{position:relative!important;overflow:hidden!important;background:var(--row-table-image,none) center/cover no-repeat,repeating-linear-gradient(0deg,transparent 0 calc(var(--row-grid-size,48px) - 1px),rgba(26,22,18,.09) calc(var(--row-grid-size,48px) - 1px) var(--row-grid-size,48px)),repeating-linear-gradient(90deg,transparent 0 calc(var(--row-grid-size,48px) - 1px),rgba(26,22,18,.09) calc(var(--row-grid-size,48px) - 1px) var(--row-grid-size,48px)),var(--row-table-bg,#fffaf0)!important}',
      '#shortListPanel .card-row-workspace .short-list-row.card-row-board{top:0!important;overflow:visible!important;background:var(--row-table-image,none) center/cover no-repeat,repeating-linear-gradient(0deg,transparent 0 calc(var(--row-grid-size,48px) - 1px),rgba(26,22,18,.09) calc(var(--row-grid-size,48px) - 1px) var(--row-grid-size,48px)),repeating-linear-gradient(90deg,transparent 0 calc(var(--row-grid-size,48px) - 1px),rgba(26,22,18,.09) calc(var(--row-grid-size,48px) - 1px) var(--row-grid-size,48px)),var(--row-table-bg,#fffaf0)!important}',
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
      '#shortListPanel .relphi-settings-lock-note{padding:.48rem .55rem!important;border-left:3px solid #171412!important;background:#f4efe9!important;color:#4f4741!important;font-size:.72rem!important;font-weight:700!important;line-height:1.3!important}',
      '#shortListPanel .relphi-settings-lock-note[hidden]{display:none!important}',
      '#shortListPanel .board-setup-group--spread>.card-row-position-label{width:100%!important}',
      '#shortListPanel .board-setup-group--spread>.quick-position-sticker-toggle{width:100%!important}',
      '#shortListPanel .board-setup-group--draw .spread-toggle::after,#shortListPanel .board-setup-group--draw .quick-reversal-toggle::after{content:"OFF";margin-left:auto!important;padding:.16rem .38rem!important;border:1px solid #b8aea6!important;border-radius:999px!important;background:#fff!important;color:#6b625c!important;font-size:.62rem!important;font-weight:900!important;letter-spacing:.05em!important}',
      '#shortListPanel .board-setup-group--draw .spread-toggle:has(input:checked)::after,#shortListPanel .board-setup-group--draw .quick-reversal-toggle:has(input:checked)::after{content:"ON";border-color:#171412!important;background:#171412!important;color:#fff!important}',
      '#shortListPanel .relphi-labels-toggle,#shortListPanel .relphi-labels-drawer{display:none!important}',
      '#shortListPanel .card-row-workspace-toolbar{position:absolute!important;top:auto!important;left:auto!important;right:.65rem!important;bottom:.65rem!important;z-index:1500!important;display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-end!important;gap:.38rem!important;width:auto!important;min-width:0!important;max-width:none!important;height:auto!important;min-height:0!important;margin:0!important;padding:.38rem .45rem!important;border:1px solid rgba(23,20,18,.24)!important;border-radius:10px!important;background:rgba(255,250,244,.95)!important;box-shadow:0 4px 12px rgba(30,20,15,.12)!important;opacity:1!important;transition:none!important}',
      '#shortListPanel .card-row-workspace-toolbar .card-row-zoom-label{display:flex!important;flex-direction:row!important;align-items:center!important;gap:.35rem!important;width:auto!important;margin:0!important;padding:0!important}',
      '#shortListPanel .card-row-workspace-toolbar .card-row-zoom-label>span{position:static!important;width:auto!important;height:auto!important;overflow:visible!important;clip:auto!important;white-space:nowrap!important;color:#171412!important;font-size:.68rem!important;font-weight:850!important}',
      '#shortListPanel #rowZoom{writing-mode:horizontal-tb!important;direction:ltr!important;appearance:auto!important;width:7.25rem!important;min-width:7.25rem!important;max-width:7.25rem!important;height:1rem!important;min-height:1rem!important;margin:0!important;padding:0!important}',
      '#shortListPanel #rowZoomValue{min-width:2.6rem!important;font-size:.62rem!important;font-weight:800!important;line-height:1!important;text-align:center!important}',
      '#shortListPanel #resetCardRowPan,#shortListPanel .card-row-workspace-toolbar .card-row-pan-note,#shortListPanel .card-row-workspace-toolbar .board-arrange-flyout{display:none!important}',
      '#shortListPanel .card-row-workspace-toolbar>#zoomCardRowExtents{display:grid!important;place-items:center!important;width:2rem!important;min-width:2rem!important;height:2rem!important;min-height:2rem!important;margin:0!important;padding:0!important;border:1px solid #aaa098!important;border-radius:7px!important;background:#fff!important;color:#171412!important;font-size:1rem!important;line-height:1!important}',
      '#shortListPanel .card-row-workspace .relphi-layout-status{margin-left:.45rem!important;margin-right:.45rem!important}',
      '@media(max-width:620px){#shortListPanel #rowZoom{width:5.5rem!important;min-width:5.5rem!important;max-width:5.5rem!important}#shortListPanel .card-row-workspace-toolbar{right:.45rem!important;bottom:.45rem!important}}'
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
