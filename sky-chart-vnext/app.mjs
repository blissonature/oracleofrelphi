import { createStore, modeOf } from './core/store.mjs';
import {
  ASPECTS,
  PLACEMENT_GROUPS,
  SIGNS,
  canonicalId,
  calculateRelationshipPool,
  coordinateText,
  houseFor,
  placementEntries,
  skyCusps
} from './core/model.mjs';
import {
  placementPassesFilters,
  relationshipMode,
  relationshipPassesFilters
} from './core/filters.mjs';
import {
  isSavedSky,
  loadSavedSky,
  nameExists,
  readLibrary,
  readWorkspace,
  saveNewSky,
  saveWorkspace,
  suggestUniqueName,
  updateSavedSky
} from './core/storage.mjs';
import {
  calculateHereNow,
  calculateSky,
  currentLocationPacket,
  exactInstant
} from './core/astronomy.mjs';
import { applyTransientFocus, renderWheel } from './ui/wheel.mjs';

const root = document.getElementById('skyChartApp');
const dialog = document.getElementById('skyChartDialog');
const dialogBody = document.getElementById('skyDialogBody');
const dialogTitle = document.getElementById('skyDialogTitle');
const store = createStore(readWorkspace() || {});

const SLOT_COLOR = { A: '#c9211e', B: '#2462d0' };
const GLYPH_ID = {
  Ascendant: 'asc', Descendant: 'dsc', Midheaven: 'mc', 'Imum Coeli': 'ic',
  'North Node': 'north-node', 'South Node': 'south-node',
  'Part of Fortune': 'part-of-fortune', Vertex: 'vertex', Lilith: 'lilith', Chiron: 'chiron'
};
const HOUSE_SYSTEMS = [
  ['whole-sign', 'Whole Sign'], ['equal-house', 'Equal House'], ['porphyry', 'Porphyry'],
  ['placidus', 'Placidus'], ['alcabitius', 'Alcabitius'], ['regiomontanus', 'Regiomontanus'],
  ['campanus', 'Campanus'], ['koch', 'Koch']
];
const HOUSES = Array.from({ length: 12 }, (_, index) => String(index + 1));
const SIGN_IDS = SIGNS.map(canonicalId);

let lastStructure = { A: undefined, B: undefined, orb: undefined };
let currentWheelModel = { placements: [], relationships: [], cusps: { A: null, B: null } };

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));
const formatMeta = sky => {
  const profile = sky?.calcProfile || {};
  return [String(profile.dateTime || '').replace('T', ' '), String(profile.location || '')].filter(Boolean).join(' · ');
};
const savedRef = record => String(record?.id || record?.metadata?.savedSkyId || '');
const nowLocalValue = () => {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};
const excludedSet = (state, kind, slot) => new Set(
  kind === 'aspects' ? state.filters.aspects : state.filters?.[kind]?.[slot] || []
);

function slotStatus(sky) {
  const saved = isSavedSky(sky);
  if (saved.saved) return saved.dirty ? 'Saved · unsaved changes' : 'Saved';
  return sky?.name === 'Now' ? 'Temporary · Now' : 'Not saved';
}

function glyphId(name) {
  return GLYPH_ID[name] || canonicalId(name);
}

function ledgerHtml(slot, sky, state) {
  const cusps = skyCusps(sky);
  const selected = state.selectedPlacement;
  return `<div class="sky-ledger">${placementEntries(sky).map(item => {
    const key = `${slot}:${item.id}`;
    const house = item.house || houseFor(item.longitude, cusps) || '—';
    const active = selected?.slot === slot && selected?.id === item.id;
    return `<div class="sky-ledger-row${active ? ' is-selected' : ''}" data-placement-key="${escapeHtml(key)}" tabindex="0">
      <svg class="sky-ledger-glyph" viewBox="-18 -18 36 36" data-glyph="${escapeHtml(glyphId(item.name))}" data-glyph-color="${SLOT_COLOR[slot]}" aria-hidden="true"></svg>
      <span class="sky-ledger-name">${escapeHtml(item.name)}</span>
      <span class="sky-ledger-coordinate">${escapeHtml(coordinateText(item.longitude))}</span>
      <span class="sky-ledger-house">H${house}</span>
    </div>`;
  }).join('')}</div>`;
}

function slotHtml(slot, sky, state) {
  const canAdd = slot === 'A' || !!state.slots.A;
  if (!sky) {
    return `<aside class="sky-slot" data-slot="${slot}">
      <div class="sky-slot-head"><div class="sky-slot-title"><span class="sky-slot-dot"></span><span>Sky ${slot}</span></div></div>
      <div class="sky-empty-slot">${canAdd
        ? `<button class="sky-add-button" type="button" data-add-sky="${slot}"><span class="plus">＋</span>Add Sky ${slot}</button>`
        : '<span class="sky-status">Add Sky A first.</span>'}</div>
    </aside>`;
  }
  const saved = isSavedSky(sky);
  return `<aside class="sky-slot" data-slot="${slot}">
    <div class="sky-slot-head">
      <div class="sky-slot-title"><span class="sky-slot-dot"></span><span class="sky-slot-name" title="${escapeHtml(sky.name)}">${escapeHtml(sky.name)}</span></div>
      <div class="sky-slot-actions">
        ${(!saved.saved || saved.dirty) ? `<button class="sky-text-button" type="button" data-save-slot="${slot}">${saved.dirty ? 'Save changes' : 'Save'}</button>` : ''}
        <button class="sky-text-button" type="button" data-update-now="${slot}">Now</button>
        <button class="sky-icon-button" type="button" data-replace-slot="${slot}" aria-label="Replace Sky ${slot}" title="Replace">↻</button>
        <button class="sky-icon-button" type="button" data-clear-slot="${slot}" aria-label="Clear Sky ${slot}" title="Clear">×</button>
      </div>
    </div>
    <div class="sky-slot-body">
      <div class="sky-status"><strong>${escapeHtml(slotStatus(sky))}</strong>${formatMeta(sky) ? ` · ${escapeHtml(formatMeta(sky))}` : ''}</div>
      ${ledgerHtml(slot, sky, state)}
    </div>
  </aside>`;
}

function availablePlacementNames(state) {
  const map = new Map();
  for (const slot of ['A', 'B']) {
    for (const item of placementEntries(state.slots[slot])) {
      if (!map.has(item.id)) map.set(item.id, { id: item.id, name: item.name });
    }
  }
  return Array.from(map.values());
}

function filterCheckbox({ kind, slot = '', value, label, state, className = '' }) {
  const excluded = excludedSet(state, kind, slot);
  return `<label class="sky-filter-check ${className}"><input type="checkbox" data-filter-item="${kind}"${slot ? ` data-filter-slot="${slot}"` : ''} value="${escapeHtml(value)}" ${excluded.has(String(value)) ? '' : 'checked'}><span>${escapeHtml(label)}</span></label>`;
}

function masterCheckbox(kind, slot, label) {
  return `<label class="sky-filter-check sky-filter-master"><input type="checkbox" data-filter-master="${kind}" data-filter-slot="${slot}"><span>${escapeHtml(label)}</span></label>`;
}

function placementFilterHtml(state) {
  const placements = availablePlacementNames(state);
  const entriesA = placementEntries(state.slots.A);
  const entriesB = placementEntries(state.slots.B);
  const groups = Object.entries(PLACEMENT_GROUPS).map(([group, names]) => {
    const available = placements.filter(item => names.includes(item.name));
    if (!available.length) return '';
    return `<div class="sky-filter-group">
      <strong>${escapeHtml(group[0].toUpperCase() + group.slice(1))}</strong>
      <div class="sky-filter-group-masters">
        ${state.slots.A ? `<label class="sky-filter-check"><input type="checkbox" data-filter-group="${group}" data-filter-slot="A"><span>A</span></label>` : ''}
        ${state.slots.B ? `<label class="sky-filter-check"><input type="checkbox" data-filter-group="${group}" data-filter-slot="B"><span>B</span></label>` : ''}
      </div>
    </div>`;
  }).join('');
  const rows = placements.map(item => `<div class="sky-filter-row">
    <span>${escapeHtml(item.name)}</span>
    <div>
      ${entriesA.some(value => value.id === item.id) ? filterCheckbox({ kind: 'placements', slot: 'A', value: item.id, label: 'A', state }) : ''}
      ${entriesB.some(value => value.id === item.id) ? filterCheckbox({ kind: 'placements', slot: 'B', value: item.id, label: 'B', state }) : ''}
    </div>
  </div>`).join('');
  return `<details class="sky-filter" data-filter-panel="placements"><summary>Placements <span data-filter-summary="placements">All</span></summary>
    <div class="sky-filter-popover">
      <div class="sky-filter-masters">${masterCheckbox('placements', 'all', 'All')}${state.slots.A ? masterCheckbox('placements', 'A', 'A') : ''}${state.slots.B ? masterCheckbox('placements', 'B', 'B') : ''}</div>
      ${groups}<div class="sky-filter-list">${rows}</div>
    </div>
  </details>`;
}

function aspectFilterHtml(state) {
  return `<details class="sky-filter" data-filter-panel="aspects"><summary>Aspects <span data-filter-summary="aspects">All</span></summary>
    <div class="sky-filter-popover"><div class="sky-filter-masters">${masterCheckbox('aspects', 'all', 'All')}</div>
      <div class="sky-filter-list">${ASPECTS.map(aspect => filterCheckbox({ kind: 'aspects', value: aspect.id, label: `${aspect.label} · ${aspect.angle}°`, state, className: 'sky-filter-wide' })).join('')}</div>
    </div>
  </details>`;
}

function matrixFilterHtml(state, kind, title, values, labelFor) {
  const rows = values.map(value => `<div class="sky-filter-row"><span>${escapeHtml(labelFor(value))}</span><div>
    ${state.slots.A ? filterCheckbox({ kind, slot: 'A', value, label: 'A', state }) : ''}
    ${state.slots.B ? filterCheckbox({ kind, slot: 'B', value, label: 'B', state }) : ''}
  </div></div>`).join('');
  return `<details class="sky-filter" data-filter-panel="${kind}"><summary>${title} <span data-filter-summary="${kind}">All</span></summary>
    <div class="sky-filter-popover"><div class="sky-filter-masters">${masterCheckbox(kind, 'all', 'All')}${state.slots.A ? masterCheckbox(kind, 'A', 'A') : ''}${state.slots.B ? masterCheckbox(kind, 'B', 'B') : ''}</div><div class="sky-filter-list">${rows}</div></div>
  </details>`;
}

function relationshipTitle(mode) {
  if (mode === 'A-B') return 'Sky A ↔ Sky B';
  if (mode === 'B-B') return 'Relationships within Sky B';
  if (mode === 'A-A') return 'Relationships within Sky A';
  return 'Relationships';
}

function filterBarHtml(state) {
  return `<div class="sky-filter-bar">
    <label class="sky-filter-field">Orb <select data-orb>${[1, 2, 3, 5, 8].map(value => `<option value="${value}"${Number(state.orb) === value ? ' selected' : ''}>${value}°</option>`).join('')}</select></label>
    ${aspectFilterHtml(state)}
    ${placementFilterHtml(state)}
    ${matrixFilterHtml(state, 'houses', 'Houses', HOUSES, value => `House ${value}`)}
    ${matrixFilterHtml(state, 'signs', 'Signs', SIGN_IDS, value => SIGNS[SIGN_IDS.indexOf(value)] || value)}
    <button type="button" class="sky-text-button sky-reset-filters" data-reset-filters>Reset</button>
  </div>`;
}

function relationshipsHtml(state) {
  if (!state.slots.A) return '';
  const pool = calculateRelationshipPool(state.slots.A, state.slots.B, state.orb);
  const mode = relationshipMode(state);
  return `<section class="sky-relationships">
    ${filterBarHtml(state)}
    <div class="sky-rel-head"><h2 data-relationship-heading>${relationshipTitle(mode)}</h2><span class="sky-status" data-rel-count></span></div>
    <div class="sky-rel-detail" data-rel-detail hidden></div>
    <div class="sky-rel-list">${pool.map(relation => `<button type="button" class="sky-rel${state.selectedRelationship === relation.id ? ' is-selected' : ''}" data-relationship-id="${escapeHtml(relation.id)}">
      <strong>${escapeHtml(relation.left.name)} ${escapeHtml(relation.label)} ${escapeHtml(relation.right.name)}</strong>
      <span>${relation.orb.toFixed(2)}° orb</span>
    </button>`).join('')}</div>
  </section>`;
}

function stageHtml(state) {
  const mode = modeOf(state);
  const title = mode === 'comparison' ? 'Comparison' : mode === 'single' ? 'Sky A' : 'Sky Chart';
  return `<section class="sky-stage"><div class="sky-stage-head"><h2>${title}</h2></div><div id="skyWheelMount" class="sky-wheel-wrap"></div></section>`;
}

async function hydrateGlyphs(scope) {
  const component = window.RelphiGlyphComponent;
  const registry = window.RelphiGlyphRegistry;
  if (!component?.draw || !registry) return;
  await Promise.all(Array.from(scope.querySelectorAll('svg[data-glyph]')).map(async host => {
    const entry = registry.resolve?.(host.dataset.glyph) || registry.get?.(host.dataset.glyph);
    if (!entry) return;
    try { await component.draw(host, entry.id, { radius: 13, padding: 1, color: host.dataset.glyphColor || '#4a332e' }); } catch {}
  }));
}

function filterValues(state, kind, slot) {
  if (kind === 'aspects') return ASPECTS.map(item => item.id);
  if (kind === 'houses') return HOUSES;
  if (kind === 'signs') return SIGN_IDS;
  if (kind === 'placements') return placementEntries(state.slots[slot]).map(item => item.id);
  return [];
}

function updateCheck(node, values, excluded) {
  const enabled = values.filter(value => !excluded.has(String(value))).length;
  node.checked = values.length > 0 && enabled === values.length;
  node.indeterminate = enabled > 0 && enabled < values.length;
  node.disabled = values.length === 0;
}

function syncFilterControls(state) {
  root.querySelectorAll('[data-filter-item]').forEach(node => {
    const kind = node.dataset.filterItem;
    const slot = node.dataset.filterSlot || '';
    node.checked = !excludedSet(state, kind, slot).has(String(node.value));
  });
  root.querySelectorAll('[data-filter-master]').forEach(node => {
    const kind = node.dataset.filterMaster;
    const slot = node.dataset.filterSlot;
    if (kind === 'aspects') return updateCheck(node, filterValues(state, 'aspects'), excludedSet(state, 'aspects', ''));
    const slots = slot === 'all' ? ['A', 'B'].filter(value => state.slots[value]) : [slot];
    const values = slots.flatMap(value => filterValues(state, kind, value).map(item => `${value}:${item}`));
    const excluded = new Set(slots.flatMap(value => Array.from(excludedSet(state, kind, value)).map(item => `${value}:${item}`)));
    updateCheck(node, values, excluded);
  });
  root.querySelectorAll('[data-filter-group]').forEach(node => {
    const slot = node.dataset.filterSlot;
    const names = PLACEMENT_GROUPS[node.dataset.filterGroup] || [];
    const values = placementEntries(state.slots[slot]).filter(item => names.includes(item.name)).map(item => item.id);
    updateCheck(node, values, excludedSet(state, 'placements', slot));
  });
  for (const kind of ['placements', 'houses', 'signs']) {
    let hidden = 0;
    for (const slot of ['A', 'B']) {
      if (!state.slots[slot]) continue;
      const values = filterValues(state, kind, slot);
      const excluded = excludedSet(state, kind, slot);
      hidden += values.filter(value => excluded.has(String(value))).length;
    }
    const summary = root.querySelector(`[data-filter-summary="${kind}"]`);
    if (summary) summary.textContent = hidden ? `${hidden} off` : 'All';
  }
  const aspectSummary = root.querySelector('[data-filter-summary="aspects"]');
  if (aspectSummary) aspectSummary.textContent = state.filters.aspects.length ? `${state.filters.aspects.length} off` : 'All';
}

function syncRelationshipDetail(state) {
  const detail = root.querySelector('[data-rel-detail]');
  if (!detail) return;
  const relation = currentWheelModel.relationships.find(item => item.id === state.selectedRelationship);
  if (!relation) { detail.hidden = true; detail.replaceChildren(); return; }
  detail.hidden = false;
  detail.innerHTML = `<strong>${escapeHtml(relation.left.name)} ${escapeHtml(relation.label)} ${escapeHtml(relation.right.name)}</strong><span>${relation.distance.toFixed(3)}° separation · ${relation.orb.toFixed(3)}° orb · ${escapeHtml(relation.scope)}</span>`;
}

function syncSelection(state) {
  const placementKey = state.selectedPlacement ? `${state.selectedPlacement.slot}:${state.selectedPlacement.id}` : '';
  root.querySelectorAll('[data-placement-key]').forEach(node => node.classList.toggle('is-selected', !!placementKey && node.dataset.placementKey === placementKey));
  root.querySelectorAll('[data-relationship-id]').forEach(node => node.classList.toggle('is-selected', !!state.selectedRelationship && node.dataset.relationshipId === state.selectedRelationship));
  root.querySelectorAll('.aspect-line').forEach(node => node.classList.toggle('is-selected', !!state.selectedRelationship && node.dataset.relationshipId === state.selectedRelationship));
  syncRelationshipDetail(state);
}

function syncFilters(state) {
  const relationById = new Map(currentWheelModel.relationships.map(relation => [relation.id, relation]));
  let visibleCount = 0;
  root.querySelectorAll('.sky-rel[data-relationship-id]').forEach(node => {
    const relation = relationById.get(node.dataset.relationshipId);
    const visible = !!relation && relationshipPassesFilters(state, relation);
    node.hidden = !visible;
    if (visible) visibleCount++;
  });
  root.querySelectorAll('.aspect-line[data-relationship-id]').forEach(node => {
    const relation = relationById.get(node.dataset.relationshipId);
    node.classList.toggle('is-filter-hidden', !relation || !relationshipPassesFilters(state, relation));
  });
  for (const item of currentWheelModel.placements) {
    const key = `${item.slot}:${item.id}`;
    const passes = placementPassesFilters(state, item.slot, item);
    root.querySelectorAll(`[data-placement-key="${CSS.escape(key)}"]`).forEach(node => node.classList.toggle('is-filter-hidden', !passes));
    root.querySelectorAll(`.leader[data-placement-key="${CSS.escape(key)}"]`).forEach(node => node.classList.toggle('is-filter-hidden', !passes));
  }
  const mode = relationshipMode(state);
  const heading = root.querySelector('[data-relationship-heading]');
  const count = root.querySelector('[data-rel-count]');
  if (heading) heading.textContent = relationshipTitle(mode);
  if (count) count.textContent = `${visibleCount} visible`;
  syncFilterControls(state);
}

function renderWorkspace(state) {
  root.innerHTML = `<div class="sky-workspace">${slotHtml('A', state.slots.A, state)}${stageHtml(state)}${slotHtml('B', state.slots.B, state)}</div>${relationshipsHtml(state)}`;
  const mount = document.getElementById('skyWheelMount');
  currentWheelModel = renderWheel(mount, {
    skyA: state.slots.A,
    skyB: state.slots.B,
    orb: state.orb,
    selectedPlacement: state.selectedPlacement,
    selectedRelationship: state.selectedRelationship
  });
  hydrateGlyphs(root);
  syncFilters(state);
  syncSelection(state);
}

function render(state) {
  const structural = lastStructure.A !== state.slots.A || lastStructure.B !== state.slots.B || lastStructure.orb !== state.orb;
  if (structural) {
    renderWorkspace(state);
    lastStructure = { A: state.slots.A, B: state.slots.B, orb: state.orb };
  } else {
    syncFilters(state);
    syncSelection(state);
  }
  renderDialog(state.dialog);
}

function choice(title, copy, attributes) {
  return `<button type="button" class="sky-choice" ${attributes}><strong>${escapeHtml(title)}</strong><span>${escapeHtml(copy)}</span></button>`;
}

function setDialog(title, html) {
  dialogTitle.textContent = title;
  dialogBody.innerHTML = html;
  if (!dialog.open) dialog.showModal();
}

function renderDialog(spec) {
  if (!spec) { if (dialog.open) dialog.close(); return; }
  const slot = spec.slot === 'B' ? 'B' : 'A';
  if (spec.type === 'add' && spec.step === 'root') {
    setDialog(`Add Sky ${slot}`, `<div class="sky-choice-grid">${choice('Existing', 'Choose one of your saved skies.', `data-add-existing="${slot}"`)}${choice('New', 'Create a sky from a new time and place.', `data-add-new="${slot}"`)}</div>`);
    return;
  }
  if (spec.type === 'add' && spec.step === 'new') {
    setDialog(`New Sky ${slot}`, `<div class="sky-choice-grid">${choice('Here and Now', 'Use your current time and device location.', `data-new-now="${slot}"`)}${choice('Enter Exactly Where and When', 'Choose the exact date, time, location, time zone, and house system.', `data-new-exact="${slot}"`)}</div><div class="sky-dialog-actions"><button class="sky-text-button" type="button" data-dialog-back="${slot}">Back</button></div>`);
    return;
  }
  if (spec.type === 'add' && spec.step === 'existing') {
    const records = readLibrary();
    setDialog(`Existing Sky → Sky ${slot}`, `${records.length ? `<div class="sky-saved-list">${records.map(record => `<button type="button" class="sky-saved-choice" data-load-saved="${escapeHtml(savedRef(record))}" data-load-slot="${slot}"><strong>${escapeHtml(record.name)}</strong><small>${escapeHtml(formatMeta(record) || 'Saved sky')}</small></button>`).join('')}</div>` : '<p class="sky-dialog-note">You do not have any saved skies yet.</p>'}<div class="sky-dialog-actions"><button class="sky-text-button" type="button" data-dialog-back="${slot}">Back</button></div>`);
    return;
  }
  if (spec.type === 'add' && spec.step === 'exact') {
    const systems = HOUSE_SYSTEMS.map(([value, label]) => `<option value="${value}"${value === 'whole-sign' ? ' selected' : ''}>${label}</option>`).join('');
    setDialog(`Exact Sky ${slot}`, `<form class="sky-form" data-exact-form data-slot="${slot}">
      <label>Optional working name<input name="name" maxlength="80" placeholder="Unsaved sky"></label>
      <label>Date and time<input name="dateTime" type="datetime-local" value="${nowLocalValue()}" required></label>
      <label>Location name<input name="location" autocomplete="off" placeholder="Ex. City, State or Country"></label>
      <div class="sky-form-row"><label>Latitude<input name="latitude" type="number" step="any" min="-90" max="90" required></label><label>Longitude<input name="longitude" type="number" step="any" min="-180" max="180" required></label></div>
      <label>Time zone<input name="timeZone" value="${escapeHtml(Intl.DateTimeFormat().resolvedOptions().timeZone || '')}" placeholder="Ex. America/New_York" required></label>
      <label>House system<select name="houseSystem">${systems}</select></label>
      <div><button type="button" class="sky-text-button" data-fill-current-location>Use my current location</button></div>
      <p class="sky-dialog-note">This creates the sky first. Saving it is a separate action.</p><p class="sky-dialog-error" data-form-status></p>
      <div class="sky-dialog-actions"><button class="sky-text-button" type="button" data-dialog-back-new="${slot}">Back</button><button class="sky-primary-button" type="submit">Create Sky ${slot}</button></div>
    </form>`);
    return;
  }
  if (spec.type === 'save') {
    const sky = store.getState().slots[slot];
    const candidate = sky?.name && sky.name !== 'Now' && sky.name !== 'Unsaved sky' ? sky.name : '';
    setDialog(`Save Sky ${slot}`, `<form class="sky-form" data-save-form data-slot="${slot}"><label>Name this sky<input name="name" maxlength="80" autocomplete="off" value="${escapeHtml(candidate)}" required></label><p class="sky-dialog-error" data-name-status></p><div class="sky-dialog-actions"><button class="sky-text-button" type="button" data-dialog-close>Cancel</button><button class="sky-primary-button" type="submit" data-save-submit>Save Sky</button></div></form>`);
    requestAnimationFrame(() => { const input = dialogBody.querySelector('input[name="name"]'); input?.focus({ preventScroll: true }); input?.select(); validateSaveName(input); });
  }
}

function validateSaveName(input) {
  if (!input) return;
  const records = readLibrary();
  const name = input.value.trim();
  const status = dialogBody.querySelector('[data-name-status]');
  const submit = dialogBody.querySelector('[data-save-submit]');
  if (!name) { status.textContent = 'Give this sky a name.'; submit.disabled = true; return; }
  if (nameExists(name, records)) {
    const suggestion = suggestUniqueName(name, records);
    status.innerHTML = `That name is already in Saved skies. <button type="button" class="sky-text-button" data-name-suggestion="${escapeHtml(suggestion)}">Use “${escapeHtml(suggestion)}”</button>`;
    submit.disabled = true;
    return;
  }
  status.textContent = '';
  submit.disabled = false;
}

async function createNow(slot) {
  setDialog(`New Sky ${slot}`, '<p class="sky-dialog-note"><span class="sky-spinner"></span>Resolving your current place and calculating the sky…</p>');
  try {
    const sky = await calculateHereNow('whole-sign');
    store.dispatch({ type: 'SET_SLOT', slot, sky });
    store.dispatch({ type: 'CLOSE_DIALOG' });
  } catch (error) {
    setDialog(`New Sky ${slot}`, `<p class="sky-dialog-error">${escapeHtml(error?.code === 1 ? 'Location permission was denied.' : error?.message || 'Here and Now could not be created.')}</p><div class="sky-dialog-actions"><button class="sky-text-button" type="button" data-dialog-back-new="${slot}">Back</button></div>`);
  }
}

async function updateSlotToNow(slot, button) {
  if (button?.dataset.busy === 'true') return;
  if (button) { button.dataset.busy = 'true'; button.disabled = true; button.setAttribute('aria-busy', 'true'); }
  try {
    const system = store.getState().slots[slot]?.calcProfile?.houseSystem || 'whole-sign';
    const sky = await calculateHereNow(system);
    store.dispatch({ type: 'SET_SLOT', slot, sky });
  } catch (error) {
    window.alert(error?.code === 1 ? 'Location permission was denied.' : error?.message || 'Here and Now could not be created.');
  } finally {
    if (button?.isConnected) { delete button.dataset.busy; button.disabled = false; button.removeAttribute('aria-busy'); }
  }
}

function setKindForSlots(state, kind, slots, enabled, valuesForSlot) {
  for (const slot of slots) {
    const current = excludedSet(state, kind, slot);
    const values = valuesForSlot(slot);
    for (const value of values) enabled ? current.delete(String(value)) : current.add(String(value));
    store.dispatch({ type: 'SET_FILTER_EXCLUDED', kind, slot, values: Array.from(current) });
  }
}

root.addEventListener('click', event => {
  const add = event.target.closest('[data-add-sky],[data-replace-slot]');
  if (add) { const slot = add.dataset.addSky || add.dataset.replaceSlot; store.dispatch({ type: 'OPEN_DIALOG', dialog: { type: 'add', slot, step: 'root' } }); return; }
  const clear = event.target.closest('[data-clear-slot]');
  if (clear) { store.dispatch({ type: 'CLEAR_SLOT', slot: clear.dataset.clearSlot }); return; }
  const updateNow = event.target.closest('[data-update-now]');
  if (updateNow) { updateSlotToNow(updateNow.dataset.updateNow, updateNow); return; }
  const save = event.target.closest('[data-save-slot]');
  if (save) {
    const slot = save.dataset.saveSlot, sky = store.getState().slots[slot], status = isSavedSky(sky);
    if (status.saved && status.dirty) { const result = updateSavedSky(sky); if (result.ok) store.dispatch({ type: 'SET_SLOT', slot, sky: result.active }); }
    else store.dispatch({ type: 'OPEN_DIALOG', dialog: { type: 'save', slot } });
    return;
  }
  if (event.target.closest('[data-reset-filters]')) { store.dispatch({ type: 'RESET_FILTERS' }); return; }
  const placementNode = event.target.closest('[data-placement-key]');
  if (placementNode) { const [slot, id] = placementNode.dataset.placementKey.split(':'); store.dispatch({ type: 'SELECT_PLACEMENT', value: { slot, id } }); return; }
  const relationship = event.target.closest('[data-relationship-id]');
  if (relationship) { store.dispatch({ type: 'SELECT_RELATIONSHIP', value: relationship.dataset.relationshipId }); }
});

root.addEventListener('change', event => {
  const target = event.target;
  if (target.matches('[data-orb]')) { store.dispatch({ type: 'SET_ORB', value: target.value }); return; }
  if (target.matches('[data-filter-item]')) {
    store.dispatch({ type: 'TOGGLE_FILTER_ITEM', kind: target.dataset.filterItem, slot: target.dataset.filterSlot, value: target.value, enabled: target.checked });
    return;
  }
  if (target.matches('[data-filter-master]')) {
    const state = store.getState(), kind = target.dataset.filterMaster, selectedSlot = target.dataset.filterSlot;
    if (kind === 'aspects') {
      store.dispatch({ type: 'SET_FILTER_EXCLUDED', kind: 'aspects', values: target.checked ? [] : ASPECTS.map(item => item.id) });
      return;
    }
    const slots = selectedSlot === 'all' ? ['A', 'B'].filter(slot => state.slots[slot]) : [selectedSlot];
    setKindForSlots(state, kind, slots, target.checked, slot => filterValues(state, kind, slot));
    return;
  }
  if (target.matches('[data-filter-group]')) {
    const state = store.getState(), slot = target.dataset.filterSlot, names = PLACEMENT_GROUPS[target.dataset.filterGroup] || [];
    setKindForSlots(state, 'placements', [slot], target.checked, value => placementEntries(state.slots[value]).filter(item => names.includes(item.name)).map(item => item.id));
  }
});

root.addEventListener('pointerover', event => {
  const node = event.target.closest('[data-placement-key]');
  if (node && !node.classList.contains('is-filter-hidden')) applyTransientFocus(root, node.dataset.placementKey);
});
root.addEventListener('pointerout', event => {
  const node = event.target.closest('[data-placement-key]');
  if (node && !node.contains(event.relatedTarget)) applyTransientFocus(root, '');
});
root.addEventListener('keydown', event => {
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.sky-ledger-row,[data-placement-key].placement')) { event.preventDefault(); event.target.click(); }
});

dialog.addEventListener('cancel', event => { event.preventDefault(); store.dispatch({ type: 'CLOSE_DIALOG' }); });
dialog.addEventListener('click', event => {
  if (event.target.closest('[data-dialog-close]')) { store.dispatch({ type: 'CLOSE_DIALOG' }); return; }
  const existing = event.target.closest('[data-add-existing]');
  if (existing) { store.dispatch({ type: 'OPEN_DIALOG', dialog: { type: 'add', slot: existing.dataset.addExisting, step: 'existing' } }); return; }
  const fresh = event.target.closest('[data-add-new]');
  if (fresh) { store.dispatch({ type: 'OPEN_DIALOG', dialog: { type: 'add', slot: fresh.dataset.addNew, step: 'new' } }); return; }
  const back = event.target.closest('[data-dialog-back]');
  if (back) { store.dispatch({ type: 'OPEN_DIALOG', dialog: { type: 'add', slot: back.dataset.dialogBack, step: 'root' } }); return; }
  const backNew = event.target.closest('[data-dialog-back-new]');
  if (backNew) { store.dispatch({ type: 'OPEN_DIALOG', dialog: { type: 'add', slot: backNew.dataset.dialogBackNew, step: 'new' } }); return; }
  const now = event.target.closest('[data-new-now]');
  if (now) { createNow(now.dataset.newNow); return; }
  const exact = event.target.closest('[data-new-exact]');
  if (exact) { store.dispatch({ type: 'OPEN_DIALOG', dialog: { type: 'add', slot: exact.dataset.newExact, step: 'exact' } }); return; }
  const saved = event.target.closest('[data-load-saved]');
  if (saved) { const record = readLibrary().find(item => savedRef(item) === saved.dataset.loadSaved); if (record) { store.dispatch({ type: 'SET_SLOT', slot: saved.dataset.loadSlot, sky: loadSavedSky(record) }); store.dispatch({ type: 'CLOSE_DIALOG' }); } return; }
  const suggestion = event.target.closest('[data-name-suggestion]');
  if (suggestion) { const input = dialogBody.querySelector('input[name="name"]'); input.value = suggestion.dataset.nameSuggestion; validateSaveName(input); input.focus(); return; }
  const fill = event.target.closest('[data-fill-current-location]');
  if (fill) {
    const form = fill.closest('form'), status = form.querySelector('[data-form-status]'); fill.disabled = true; status.innerHTML = '<span class="sky-spinner"></span>Resolving current location…';
    currentLocationPacket().then(packet => { form.elements.location.value = packet.location; form.elements.latitude.value = packet.latitude; form.elements.longitude.value = packet.longitude; form.elements.timeZone.value = packet.timeZone; status.textContent = ''; }).catch(error => { status.textContent = error.message; }).finally(() => { fill.disabled = false; });
  }
});
dialog.addEventListener('input', event => { if (event.target.matches('[data-save-form] input[name="name"]')) validateSaveName(event.target); });
dialog.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.target;
  if (form.matches('[data-save-form]')) {
    const slot = form.dataset.slot, sky = store.getState().slots[slot], name = new FormData(form).get('name'), result = saveNewSky(sky, name);
    if (result.ok) { store.dispatch({ type: 'SET_SLOT', slot, sky: result.active }); store.dispatch({ type: 'CLOSE_DIALOG' }); }
    else form.querySelector('[data-name-status]').textContent = result.message || 'Sky could not be saved.';
    return;
  }
  if (form.matches('[data-exact-form]')) {
    const slot = form.dataset.slot, data = Object.fromEntries(new FormData(form)), status = form.querySelector('[data-form-status]'), submit = form.querySelector('[type="submit"]');
    submit.disabled = true; status.innerHTML = '<span class="sky-spinner"></span>Calculating…';
    try {
      const instant = await exactInstant(data.dateTime, data.timeZone);
      const sky = calculateSky({ name: data.name || 'Unsaved sky', instant, localDateTime: data.dateTime, latitude: data.latitude, longitude: data.longitude, location: data.location, timeZone: data.timeZone, houseSystem: data.houseSystem, source: 'exact-vnext' });
      store.dispatch({ type: 'SET_SLOT', slot, sky }); store.dispatch({ type: 'CLOSE_DIALOG' });
    } catch (error) { status.textContent = error.message || 'The sky could not be calculated.'; submit.disabled = false; }
  }
});

store.subscribe(state => { saveWorkspace(state); render(state); });
render(store.getState());