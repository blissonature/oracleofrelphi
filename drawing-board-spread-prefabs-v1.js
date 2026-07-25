// Structured Drawing Board spread prefabs: shipped layouts, custom design, snapshots, and Celtic center views.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;

  const CUSTOM_KEY = 'relphiDrawingBoardSpreadPrefabsV2';
  const LEGACY_KEY = 'relphiDrawingBoardStickerPrefabsV1';
  const MAX_CUSTOM = 40;
  let selectedId = 'past-present-future-3';
  let enhancing = false;
  let queued = false;

  const transform = (x, y, rotation = 0, scale = 1, zIndex = 1) => ({ x, y, rotation, scale, zIndex });
  const position = (id, label, drawOrder, value, semantics = {}) => ({
    id, label, drawOrder, transform:value, ...semantics
  });

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
    }
  ]);

  function bridge() { return window.RelphiDrawingBoardPrefabsBridge; }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function displayName(prefab) { return prefab.cardCount + ' | ' + prefab.name; }
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
    return [...SHIPPED.map(clone), ...customPrefabs()].sort((a,b) => a.cardCount - b.cardCount || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  }
  function prefabById(id) { return allPrefabs().find(item => item.id === id) || null; }
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
    schedule();
  }
  function beginDesign(prefab, options = {}) {
    if (!prefab || !requireClear('design a layout')) return;
    const copy = clone(prefab);
    if (options.copy) {
      copy.id = uniqueId(copy.name + '-copy');
      copy.name = (copy.name + ' copy').slice(0, 60);
      copy.source = 'custom';
      copy.editable = true;
      copy.basedOn = prefab.id;
      if (!saveCustom(copy)) return window.alert('This browser could not save the custom prefab.');
    }
    selectedId = copy.id;
    bridge()?.applyLayout(copy, { designMode:true });
    schedule();
  }
  function duplicateCustom(prefab) {
    const copy = clone(prefab);
    copy.id = uniqueId(prefab.name + '-copy');
    copy.name = (prefab.name + ' copy').slice(0, 60);
    copy.basedOn = prefab.basedOn || prefab.id;
    if (saveCustom(copy)) {
      selectedId = copy.id;
      schedule();
    }
  }
  function deleteCustom(prefab) {
    if (!prefab || prefab.source !== 'custom') return;
    if (!window.confirm('Delete the custom prefab "' + displayName(prefab) + '"? Active readings will not be changed.')) return;
    writeCustomPrefabs(customPrefabs().filter(item => item.id !== prefab.id));
    selectedId = SHIPPED[0].id;
    schedule();
  }
  function finishDesign(save) {
    const state = bridge()?.getState();
    if (!state?.designMode || !state.slotCount) return;
    const selected = prefabById(selectedId);
    let name = selected?.name || 'Custom spread';
    let id = selected?.source === 'custom' ? selected.id : uniqueId(name);
    if (save && selected?.source !== 'custom') {
      name = String(window.prompt('Name this custom spread:', name) || '').trim();
      if (!name) return;
      id = uniqueId(name);
    }
    const snapshot = bridge().finishDesign({
      id:save ? id : 'use-once-' + Date.now().toString(36),
      name:save ? name : 'One-time layout',
      source:save ? 'custom' : 'active',
      editable:!!save,
      basedOn:selected?.basedOn || (selected?.source === 'shipped' ? selected.id : null)
    });
    if (save && snapshot) {
      if (!saveCustom(snapshot)) return window.alert('This browser could not save the custom prefab.');
      selectedId = snapshot.id;
    }
    schedule();
  }
  function renderOptions(select) {
    const groups = new Map();
    allPrefabs().forEach(prefab => {
      const key = prefab.source === 'shipped' ? 'Shipped spreads' : 'My custom spreads';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(prefab);
    });
    select.innerHTML = '<option value="">Choose a spread prefab…</option>' + Array.from(groups, ([label, prefabs]) =>
      '<optgroup label="' + label + '">' + prefabs.map(prefab =>
        '<option value="' + prefab.id + '"' + (prefab.id === selectedId ? ' selected' : '') + '>' + displayName(prefab) + '</option>'
      ).join('') + '</optgroup>'
    ).join('');
  }
  function libraryMarkup(prefab, state) {
    const shipped = prefab?.source === 'shipped';
    const custom = prefab?.source === 'custom';
    const activeLineage = custom && prefab.basedOn ? '<small>Based on: ' + (prefabById(prefab.basedOn) ? displayName(prefabById(prefab.basedOn)) : prefab.basedOn) + '</small>' : '';
    return '<div class="relphi-prefab-heading"><strong>Spread prefabs</strong><span>Layouts save positions and transforms only—never drawn cards.</span></div>' +
      '<select id="relphiSpreadPrefabSelect" aria-label="Spread prefab"></select>' +
      '<div class="relphi-prefab-actions">' +
        '<button type="button" data-prefab-action="use"' + (!prefab || state.hasCards || state.locked ? ' disabled' : '') + '>Use Spread</button>' +
        (shipped ? '<button type="button" data-prefab-action="copy"' + (state.hasCards || state.locked ? ' disabled' : '') + '>Customize a Copy</button>' : '') +
        (custom ? '<button type="button" data-prefab-action="edit"' + (state.hasCards || state.locked ? ' disabled' : '') + '>Edit Prefab</button><button type="button" data-prefab-action="duplicate">Duplicate</button><button type="button" class="danger" data-prefab-action="delete">Delete</button>' : '') +
      '</div>' + activeLineage;
  }
  function addLibrary(panel, state) {
    const host = panel.querySelector('.board-setup-group--spread') || panel.querySelector('#rowPositionLabels')?.closest('label');
    if (!host) return;
    let library = host.querySelector('.relphi-spread-prefab-library');
    const prefab = prefabById(selectedId) || SHIPPED[0];
    if (!library) {
      library = document.createElement('section');
      library.className = 'relphi-spread-prefab-library';
      host.insertBefore(library, host.firstChild);
    }
    library.innerHTML = libraryMarkup(prefab, state);
    const select = library.querySelector('#relphiSpreadPrefabSelect');
    renderOptions(select);
    select.addEventListener('change', () => {
      selectedId = select.value || SHIPPED[0].id;
      schedule();
    });
    library.querySelector('[data-prefab-action="use"]')?.addEventListener('click', () => applyForUse(prefabById(selectedId)));
    library.querySelector('[data-prefab-action="copy"]')?.addEventListener('click', () => beginDesign(prefabById(selectedId), { copy:true }));
    library.querySelector('[data-prefab-action="edit"]')?.addEventListener('click', () => beginDesign(prefabById(selectedId)));
    library.querySelector('[data-prefab-action="duplicate"]')?.addEventListener('click', () => duplicateCustom(prefabById(selectedId)));
    library.querySelector('[data-prefab-action="delete"]')?.addEventListener('click', () => deleteCustom(prefabById(selectedId)));
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
      banner.innerHTML = '<strong>Designing layout — card drawing is unavailable</strong><span>Move, rotate, label, add, or remove placeholders before beginning the reading.</span><div><button type="button" data-design-action="remove"' + (state.slotCount < 2 ? ' disabled' : '') + '>Remove selected position</button><button type="button" data-design-action="once">Use Once</button><button type="button" class="primary" data-design-action="save">Save as Prefab and Use</button></div>';
      banner.querySelector('[data-design-action="remove"]')?.addEventListener('click', () => bridge()?.removePosition(state.transformTarget));
      banner.querySelector('[data-design-action="once"]')?.addEventListener('click', () => finishDesign(false));
      banner.querySelector('[data-design-action="save"]')?.addEventListener('click', () => finishDesign(true));
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
      addLibrary(panel, state);
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
      '#shortListPanel .relphi-spread-prefab-library{display:grid;gap:.55rem;padding:.7rem;border:1px solid #d8cec5;border-radius:10px;background:#fffaf4}',
      '#shortListPanel .row-sticker-prefab-controls{display:none!important}',
      '#shortListPanel .relphi-prefab-heading{display:grid;gap:.15rem}',
      '#shortListPanel .relphi-prefab-heading strong{font-size:.86rem}',
      '#shortListPanel .relphi-prefab-heading span,#shortListPanel .relphi-spread-prefab-library small{color:#6b625c;font-size:.7rem;line-height:1.3}',
      '#shortListPanel #relphiSpreadPrefabSelect{width:100%;min-height:2.55rem;padding:.45rem .6rem;border:1px solid #aaa098;border-radius:7px;background:#fff;color:#171412;font:inherit;font-weight:750}',
      '#shortListPanel .relphi-prefab-actions{display:flex;flex-wrap:wrap;gap:.4rem}',
      '#shortListPanel .relphi-prefab-actions .danger{color:#a01813;border-color:rgba(160,24,19,.45)}',
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
      '@media(max-width:700px){#shortListPanel .relphi-layout-status{grid-template-columns:1fr}#shortListPanel .relphi-layout-status>span,#shortListPanel .relphi-layout-status>div{grid-column:1;grid-row:auto}#shortListPanel .relphi-layout-status>div{justify-content:flex-start}#shortListPanel .relphi-prefab-actions button{flex:1 1 46%}}'
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
