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
        position('covering', '1 · What covers you', 1, transform(.31, .31, 0, .45, 20), {
          role:'covering',
          openTransform:transform(.22, .43, 0, .45, 20)
        }),
        position('crossing', '2 · What crosses you', 2, transform(.31, .31, 90, .45, 30), {
          role:'crossing',
          crosses:'covering',
          openTransform:transform(.42, .43, 0, .45, 30)
        }),
        position('crowning', '3 · What crowns you', 3, transform(.31, .00, 0, .45, 4)),
        position('beneath', '4 · What is beneath you', 4, transform(.31, .68, 0, .45, 4)),
        position('behind', '5 · What is behind you', 5, transform(.62, .31, 0, .45, 4)),
        position('before', '6 · What is before you', 6, transform(.00, .31, 0, .45, 4)),
        position('self', '7 · Yourself', 7, transform(.82, .68, 0, .45, 4)),
        position('house', '8 · Your house', 8, transform(.82, .45, 0, .45, 4)),
        position('hopes-fears', '9 · Your hopes or fears', 9, transform(.82, .22, 0, .45, 4)),
        position('outcome', '10 · What will come', 10, transform(.82, .00, 0, .45, 4))
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
        position('significator', 'Significator', 1, transform(.31, .31, 0, .45, 10), {
          role:'significator',
          openTransform:transform(.13, .43, 0, .45, 10)
        }),
        position('covering', '1 · What covers you', 2, transform(.31, .31, 0, .45, 20), {
          role:'covering',
          covers:'significator',
          openTransform:transform(.31, .43, 0, .45, 20)
        }),
        position('crossing', '2 · What crosses you', 3, transform(.31, .31, 90, .45, 30), {
          role:'crossing',
          crosses:'covering',
          openTransform:transform(.49, .43, 0, .45, 30)
        }),
        position('crowning', '3 · What crowns you', 4, transform(.31, .00, 0, .45, 4)),
        position('beneath', '4 · What is beneath you', 5, transform(.31, .68, 0, .45, 4)),
        position('behind', '5 · What is behind you', 6, transform(.62, .31, 0, .45, 4)),
        position('before', '6 · What is before you', 7, transform(.00, .31, 0, .45, 4)),
        position('self', '7 · Yourself', 8, transform(.82, .68, 0, .45, 4)),
        position('house', '8 · Your house', 9, transform(.82, .45, 0, .45, 4)),
        position('hopes-fears', '9 · Your hopes or fears', 10, transform(.82, .22, 0, .45, 4)),
        position('outcome', '10 · What will come', 11, transform(.82, .00, 0, .45, 4))
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
  function applyForUse(prefab) {
    if (!prefab || !requireClear('choose another spread')) return;
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
    copy.name = '';
    copy.source = 'custom';
    copy.editable = true;
    copy.basedOn = prefab.id;
    draftLayout = copy;
    draftName = '';
    copySourceId = prefab.id;
    selectedId = copy.id;
    labelsOpen = true;
    templateMode = 'existing';
    bridge()?.applyLayout(copy, { designMode:true });
    schedule();
  }
  function beginCustomDesign() {
    if (!requireClear('design a layout')) return;
    const state = bridge()?.getState();
    const current = state?.currentLayout;
    if (!current?.positions?.length) return window.alert('Type at least one position sticker before designing the spread.');
    const name = draftName || '';
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
    labelsOpen = true;
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
  function renderOmniboxOptions(datalist) {
    datalist.innerHTML = allPrefabs().map(prefab => {
      const group = prefab.source === 'shipped' ? 'Shipped spread' : 'My spread';
      return '<option value="' + escapeHtml(displayName(prefab)) + '" label="' + escapeHtml(group + ': ' + labelsValue(prefab)) + '"></option>';
    }).join('');
  }
  function unifiedLibraryMarkup(prefab, state) {
    const shipped = prefab?.source === 'shipped';
    const custom = prefab?.source === 'custom';
    const designing = !!state.designMode;
    const activeLineage = custom && prefab.basedOn
      ? '<small>Based on: ' + escapeHtml(prefabById(prefab.basedOn) ? displayName(prefabById(prefab.basedOn)) : prefab.basedOn) + '</small>'
      : '';
    const currentDesign = prefab
      ? '<div class="relphi-selected-design"><span>Selected spread design</span><strong>' + escapeHtml(displayName(prefab)) + '</strong></div>'
      : '<div class="relphi-selected-design"><span>Custom position stickers</span><strong>Not saved as a spread design</strong></div>';
    const nameField = designing
      ? '<label class="relphi-spread-design-name">Spread design name<input id="relphiSpreadDesignName" type="text" maxlength="60" value="' + escapeHtml(draftName || prefab?.name || '') + '" placeholder="Name this reusable spread design"><small>This names the reusable design, not this reading.</small></label>'
      : '';
    return '<div class="relphi-prefab-heading"><span>Position stickers, placement, rotation, and scale are properties of one spread design.</span></div>' +
      currentDesign + nameField +
      '<div class="relphi-prefab-actions">' +
        (!designing && prefab ? '<button type="button" data-prefab-action="use"' + (state.hasCards || state.locked ? ' disabled' : '') + '>Use Spread</button>' : '') +
        (!designing && shipped ? '<button type="button" data-prefab-action="copy"' + (state.hasCards || state.locked ? ' disabled' : '') + '>Customize a Copy</button>' : '') +
        (!designing && custom ? '<button type="button" data-prefab-action="edit"' + (state.hasCards || state.locked ? ' disabled' : '') + '>Edit Spread Design</button><button type="button" data-prefab-action="duplicate">Duplicate</button><button type="button" class="danger" data-prefab-action="delete">Delete</button>' : '') +
        (!designing && !prefab ? '<button type="button" data-prefab-action="design"' + (!state.slotCount || state.hasCards || state.locked ? ' disabled' : '') + '>Design These Positions</button>' : '') +
      '</div>' + activeLineage;
  }
  function addLibrary(panel, state) {
    const host = panel.querySelector('.board-setup-group--spread') || panel.querySelector('#rowPositionLabels')?.closest('label');
    const field = panel.querySelector('#rowPositionLabels');
    const datalist = panel.querySelector('#rowStickerPresetList');
    if (!host || !field || !datalist) return;
    const available = allPrefabs();
    const activePrefab = prefabById(state.activeLayout?.id);
    const normalizedValue = String(field.value || '').trim().toLowerCase();
    const exactValue = available.find(item => displayName(item).toLowerCase() === normalizedValue);
    const labelValue = available.find(item => labelsValue(item).toLowerCase() === normalizedValue);
    if (activePrefab) selectedId = activePrefab.id;
    else if (exactValue) selectedId = exactValue.id;
    else if (!state.designMode && labelValue) selectedId = labelValue.id;
    else if (!state.designMode && normalizedValue) selectedId = '';
    renderOmniboxOptions(datalist);
    field.setAttribute('list', 'rowStickerPresetList');
    field.setAttribute('placeholder', 'Choose a spread design or type comma-separated position stickers…');
    field.setAttribute('aria-label', 'Position stickers and spread designs');
    if (!field.dataset.relphiSpreadOmniboxBound) {
      field.dataset.relphiSpreadOmniboxBound = 'true';
      const chooseFromOmnibox = event => {
        if (bridge()?.getState()?.designMode) return;
        const match = allPrefabs().find(item => displayName(item).toLowerCase() === String(field.value || '').trim().toLowerCase());
        if (match) {
          event.preventDefault();
          event.stopImmediatePropagation();
          selectedId = match.id;
          draftLayout = null;
          draftName = '';
          schedule();
          return;
        }
        selectedId = '';
        draftLayout = null;
        draftName = '';
        schedule();
      };
      field.addEventListener('input', chooseFromOmnibox, true);
      field.addEventListener('change', chooseFromOmnibox, true);
    }
    let library = host.querySelector('.relphi-spread-prefab-library');
    const prefab = prefabById(selectedId) || draftLayout;
    if (!library) {
      library = document.createElement('section');
      library.className = 'relphi-spread-prefab-library';
      field.closest('label')?.insertAdjacentElement('afterend', library);
    }
    library.innerHTML = unifiedLibraryMarkup(prefab, state);
    const nameField = library.querySelector('#relphiSpreadDesignName');
    nameField?.addEventListener('input', () => {
      draftName = String(nameField.value || '').slice(0, 60);
      if (draftLayout) draftLayout.name = draftName;
    });
    library.querySelector('[data-prefab-action="use"]')?.addEventListener('click', () => applyForUse(prefabById(selectedId)));
    library.querySelector('[data-prefab-action="copy"]')?.addEventListener('click', () => beginDesign(prefabById(selectedId), { copy:true }));
    library.querySelector('[data-prefab-action="edit"]')?.addEventListener('click', () => beginDesign(prefabById(selectedId)));
    library.querySelector('[data-prefab-action="duplicate"]')?.addEventListener('click', () => duplicateCustom(prefabById(selectedId)));
    library.querySelector('[data-prefab-action="delete"]')?.addEventListener('click', () => deleteCustom(prefabById(selectedId)));
    library.querySelector('[data-prefab-action="design"]')?.addEventListener('click', beginCustomDesign);
  }
  function labelsDrawerMarkup(prefab, state) {
    const designing = !!state.designMode;
    const custom = prefab?.source === 'custom' && !designing;
    const count = Number(state.slotCount) || Number(draftLayout?.positions?.length) || 0;
    const conflict = designing && templateNameConflict(draftName, count);
    const copySource = copySourceId ? prefabById(copySourceId) : null;
    const selection = templateMode === 'existing' && prefab && !designing
      ? '<div class="relphi-selected-design"><span>Selected template</span><strong>' + escapeHtml(displayName(prefab)) + '</strong></div>'
      : templateMode === 'new' && !designing
        ? '<div class="relphi-selected-design"><span>New template</span><strong>' + (count ? count + ' labels ready to design' : 'Type labels in the field above') + '</strong></div>'
        : '';
    const nameField = designing
      ? '<label class="relphi-spread-design-name">Spread Template name<input id="relphiSpreadDesignName" type="text" maxlength="60" value="' + escapeHtml(draftName) + '" placeholder="' + escapeHtml(copySource ? copySource.name + ' copy' : 'Name this reusable template') + '" aria-describedby="relphiSpreadNameHelp"><small id="relphiSpreadNameHelp" class="' + (conflict ? 'is-error' : '') + '">' + (conflict ? 'That ' + count + '-card name already exists. Enter a unique name.' : 'The card count plus template name must be unique. This does not name the reading.') + '</small></label>'
      : '';
    return selection + nameField + '<div class="relphi-prefab-actions">' +
      (!designing && templateMode === 'existing' && prefab ? '<button type="button" data-prefab-action="use"' + (state.hasCards || state.locked ? ' disabled' : '') + '>Use Template</button><button type="button" data-prefab-action="copy"' + (state.hasCards || state.locked ? ' disabled' : '') + '>Edit as Copy</button>' : '') +
      (!designing && templateMode === 'existing' && custom ? '<button type="button" class="danger" data-prefab-action="delete">Delete</button>' : '') +
      (!designing && templateMode === 'new' ? '<button type="button" data-prefab-action="design"' + (!state.slotCount || state.hasCards || state.locked ? ' disabled' : '') + '>Design Template</button>' : '') +
      (designing ? '<button type="button" data-prefab-action="once">Use Once</button><button type="button" class="primary" data-prefab-action="save"' + (!draftName.trim() || conflict ? ' disabled' : '') + '>' + (copySourceId ? 'Save As Copy and Use' : 'Save Template and Use') + '</button>' : '') +
      '</div>';
  }
  function addLabelsDrawer(panel, state) {
    const field = panel.querySelector('#rowPositionLabels');
    const datalist = panel.querySelector('#rowStickerPresetList');
    const board = panel.querySelector('.card-row-drawing-board');
    const toolbar = panel.querySelector('.card-row-icon-toolbar');
    if (!board || !toolbar || !field || !datalist) return;
    if (state.designMode && !draftLayout && state.currentLayout?.positions?.length) {
      draftLayout = clone(state.currentLayout);
      copySourceId = String(state.currentLayout.basedOn || '');
      draftName = copySourceId || String(state.currentLayout.name || '').trim() === 'Untitled spread' ? '' : String(state.currentLayout.name || '');
      templateMode = copySourceId ? 'existing' : 'new';
    }

    let toggle = panel.querySelector('#relphiLabelsToggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.id = 'relphiLabelsToggle';
      toggle.type = 'button';
      toggle.className = 'relphi-labels-toggle';
      toggle.textContent = 'Labels';
      toolbar.appendChild(toggle);
      toggle.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        labelsOpen = !labelsOpen;
        if (labelsOpen && board.tagName === 'DETAILS') board.open = true;
        schedule();
      });
    }
    toggle.setAttribute('aria-expanded', String(labelsOpen));
    toggle.classList.toggle('is-open', labelsOpen);

    let drawer = board.querySelector('.relphi-labels-drawer');
    if (!drawer) {
      drawer = document.createElement('section');
      drawer.className = 'relphi-labels-drawer';
      drawer.innerHTML = '<header><div><strong>Labels</strong><span>Position labels, placement, rotation, and scale belong to a Spread Template.</span></div><button type="button" class="relphi-labels-close" aria-label="Close Labels">Close</button></header><fieldset class="relphi-template-mode"><legend>Spread Template</legend><label><input type="radio" name="relphiTemplateMode" value="existing"> Existing</label><label><input type="radio" name="relphiTemplateMode" value="new"> New</label></fieldset><div class="relphi-labels-field"></div><div class="relphi-labels-dynamic"></div>';
      board.querySelector(':scope > summary')?.insertAdjacentElement('afterend', drawer);
      drawer.querySelector('.relphi-labels-close')?.addEventListener('click', () => {
        labelsOpen = false;
        schedule();
      });
      drawer.querySelectorAll('input[name="relphiTemplateMode"]').forEach(input => input.addEventListener('change', () => {
        templateMode = input.value;
        selectedId = '';
        draftLayout = null;
        draftName = '';
        copySourceId = '';
        field.value = '';
        field.dispatchEvent(new Event('input', { bubbles:true }));
        schedule();
      }));
    }
    drawer.hidden = !labelsOpen;
    drawer.querySelectorAll('input[name="relphiTemplateMode"]').forEach(input => {
      input.checked = input.value === templateMode;
      input.disabled = !!state.designMode;
    });
    const fieldHost = drawer.querySelector('.relphi-labels-field');
    const fieldLabel = field.closest('label');
    const quickLabel = panel.querySelector('#rowPositionStickersQuick')?.closest('label');
    if (fieldLabel && fieldLabel.parentElement !== fieldHost) fieldHost.appendChild(fieldLabel);
    if (quickLabel && quickLabel.parentElement !== fieldHost) fieldHost.appendChild(quickLabel);
    panel.querySelector('.board-labels-staging')?.remove();

    const available = allPrefabs();
    const activePrefab = prefabById(state.activeLayout?.id);
    const normalizedValue = String(field.value || '').trim().toLowerCase();
    const exactValue = available.find(item => displayName(item).toLowerCase() === normalizedValue);
    const labelValue = available.find(item => labelsValue(item).toLowerCase() === normalizedValue);
    if (activePrefab && !state.designMode) selectedId = activePrefab.id;
    else if (templateMode === 'existing' && exactValue) selectedId = exactValue.id;
    else if (templateMode === 'existing' && !state.designMode && labelValue) selectedId = labelValue.id;
    else if (!state.designMode && normalizedValue) selectedId = '';
    renderOmniboxOptions(datalist);
    field.setAttribute('list', 'rowStickerPresetList');
    field.setAttribute('placeholder', templateMode === 'existing' ? 'Choose a saved Spread Template…' : 'Type comma-separated position labels…');
    field.setAttribute('aria-label', 'Spread Template labels');
    if (!field.dataset.relphiLabelsDrawerBound) {
      field.dataset.relphiLabelsDrawerBound = 'true';
      const chooseFromOmnibox = event => {
        if (bridge()?.getState()?.designMode) return;
        const match = templateMode === 'existing' && allPrefabs().find(item => displayName(item).toLowerCase() === String(field.value || '').trim().toLowerCase());
        if (match) {
          event.preventDefault();
          event.stopImmediatePropagation();
          selectedId = match.id;
          draftLayout = null;
          draftName = '';
          copySourceId = '';
          schedule();
          return;
        }
        selectedId = '';
        draftLayout = null;
        draftName = '';
        copySourceId = '';
        schedule();
      };
      field.addEventListener('input', chooseFromOmnibox, true);
      field.addEventListener('change', chooseFromOmnibox, true);
    }

    const prefab = prefabById(selectedId) || draftLayout;
    const dynamic = drawer.querySelector('.relphi-labels-dynamic');
    dynamic.innerHTML = labelsDrawerMarkup(prefab, state);
    const nameField = dynamic.querySelector('#relphiSpreadDesignName');
    nameField?.addEventListener('input', () => {
      draftName = String(nameField.value || '').slice(0, 60);
      if (draftLayout) draftLayout.name = draftName;
      const count = Number(bridge()?.getState()?.slotCount) || 0;
      const conflict = templateNameConflict(draftName, count);
      const help = dynamic.querySelector('#relphiSpreadNameHelp');
      const save = dynamic.querySelector('[data-prefab-action="save"]');
      if (help) {
        help.classList.toggle('is-error', conflict);
        help.textContent = conflict
          ? 'That ' + count + '-card name already exists. Enter a unique name.'
          : 'The card count plus template name must be unique. This does not name the reading.';
      }
      if (save) save.disabled = !draftName.trim() || conflict;
    });
    dynamic.querySelector('[data-prefab-action="use"]')?.addEventListener('click', () => applyForUse(prefabById(selectedId)));
    dynamic.querySelector('[data-prefab-action="copy"]')?.addEventListener('click', () => beginDesign(prefabById(selectedId), { copy:true }));
    dynamic.querySelector('[data-prefab-action="delete"]')?.addEventListener('click', () => deleteCustom(prefabById(selectedId)));
    dynamic.querySelector('[data-prefab-action="design"]')?.addEventListener('click', beginCustomDesign);
    dynamic.querySelector('[data-prefab-action="once"]')?.addEventListener('click', () => finishDesign(false));
    dynamic.querySelector('[data-prefab-action="save"]')?.addEventListener('click', () => finishDesign(true));
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
      banner.innerHTML = '<strong>Designing Spread Template — card drawing is unavailable</strong><span>Move, rotate, label, add, or remove placeholders. Finish from the Labels drawer.</span><div><button type="button" data-design-action="remove"' + (state.slotCount < 2 ? ' disabled' : '') + '>Remove selected position</button></div>';
      banner.querySelector('[data-design-action="remove"]')?.addEventListener('click', () => bridge()?.removePosition(state.transformTarget));
    } else {
      banner.innerHTML = '<strong>Active layout locked</strong><span>' + (state.activeLayout ? displayName(state.activeLayout) : 'Custom layout') + ' is snapshotted for this reading. Clear the board to choose or redesign a spread.</span>';
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
  function enhance() {
    queued = false;
    if (enhancing) return;
    const panel = document.getElementById('shortListPanel');
    const api = bridge();
    if (!panel || panel.hidden || !api) return;
    enhancing = true;
    try {
      const state = api.getState();
      addLabelsDrawer(panel, state);
      addDesignControls(panel, state);
      lockControls(panel, state);
      applyCenterView(panel, state);
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
      '#shortListPanel .relphi-template-mode{display:flex;flex-wrap:wrap;align-items:center;gap:.45rem .8rem;margin:0;padding:.5rem .6rem;border:1px solid #ded5cd;border-radius:8px;background:#fff}',
      '#shortListPanel .relphi-template-mode legend{padding:0 .25rem;font-size:.76rem;font-weight:900}',
      '#shortListPanel .relphi-template-mode label{display:inline-flex!important;align-items:center!important;gap:.35rem!important;width:auto!important;margin:0!important;font-size:.78rem!important}',
      '#shortListPanel .relphi-template-mode input{margin:0!important;accent-color:#111}',
      '#shortListPanel .relphi-labels-field{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:.55rem}',
      '#shortListPanel .relphi-labels-field>label:first-child{display:grid!important;gap:.2rem!important;width:100%!important;margin:0!important;font-size:.78rem!important;font-weight:800!important}',
      '#shortListPanel .relphi-labels-field input[type="text"]{display:block!important;width:100%!important;min-height:2.35rem!important;margin:.2rem 0 0!important;padding:.45rem .6rem!important;border:1px solid #bdb3aa!important;border-radius:7px!important;background:#fff!important;box-sizing:border-box!important}',
      '#shortListPanel .relphi-labels-field .quick-position-sticker-toggle{display:flex!important;align-items:center!important;gap:.4rem!important;min-height:2.35rem!important;margin:0!important;padding:.4rem .55rem!important;border:1px solid #ded5cd!important;border-radius:8px!important;background:#fff!important;white-space:nowrap!important}',
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
      '@media(max-width:700px){#shortListPanel .relphi-labels-field{grid-template-columns:1fr}#shortListPanel .relphi-layout-status{grid-template-columns:1fr}#shortListPanel .relphi-layout-status>span,#shortListPanel .relphi-layout-status>div{grid-column:1;grid-row:auto}#shortListPanel .relphi-layout-status>div{justify-content:flex-start}#shortListPanel .relphi-prefab-actions button{flex:1 1 46%}}'
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
