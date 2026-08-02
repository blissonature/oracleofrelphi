// One categorized placement checklist for both skies, with fast whole-sky clearing.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyMultiselectFiltersV1) return;
  window.__relphiSkyMultiselectFiltersV1 = true;

  const SLOTS = ['A', 'B'];
  const GROUPS = Object.freeze([
    { id: 'luminaries', label: 'Luminaries', members: new Set(['sun', 'moon']) },
    { id: 'planets', label: 'Planets', members: new Set(['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']) },
    { id: 'angles-points', label: 'Angles and Points', members: null }
  ]);
  const state = {
    A: { available: new Map(), selected: new Set(), initialized: false, signature: '' },
    B: { available: new Map(), selected: new Set(), initialized: false, signature: '' }
  };
  let queued = false;
  let counting = false;
  let portalOwner = null;

  function filterBar() {
    return document.querySelector('#skyFoundationRelationships .sky-chart-filter-bar');
  }

  function control() {
    return document.querySelector('[data-placement-filter="combined"]');
  }

  function popover() {
    return document.getElementById('skyChartPlacementPopover');
  }

  function categoryFor(id) {
    if (GROUPS[0].members.has(id)) return GROUPS[0].id;
    if (GROUPS[1].members.has(id)) return GROUPS[1].id;
    return GROUPS[2].id;
  }

  function entriesFor(slot) {
    const panel = document.getElementById(slot === 'A' ? 'skyFoundationA' : 'skyFoundationB');
    const seen = new Set();
    return Array.from(panel?.querySelectorAll('.sky-foundation-row[data-placement]') || []).map(row => {
      const id = String(row.dataset.placement || '').trim();
      const label = String(row.querySelector('.sky-foundation-row-name')?.textContent || id).trim();
      if (!id || seen.has(id)) return null;
      seen.add(id);
      return { id, label, group: categoryFor(id) };
    }).filter(Boolean);
  }

  function sameSet(left, right) {
    return left.size === right.size && Array.from(left).every(value => right.has(value));
  }

  function groupIds(slot, groupId) {
    return Array.from(state[slot].available.values())
      .filter(entry => entry.group === groupId)
      .map(entry => entry.id);
  }

  function matrixEntries(groupId) {
    const combined = new Map();
    SLOTS.forEach(slot => {
      state[slot].available.forEach(entry => {
        if (entry.group !== groupId) return;
        if (!combined.has(entry.id)) combined.set(entry.id, { id: entry.id, label: entry.label });
      });
    });
    return Array.from(combined.values()).sort((left, right) => left.label.localeCompare(right.label));
  }

  function slotSummary(slot) {
    const current = state[slot];
    const total = current.available.size;
    const chosen = current.selected.size;
    if (!chosen) return 'None';
    if (chosen === total) return 'All';
    for (const group of GROUPS) {
      const ids = new Set(groupIds(slot, group.id));
      if (ids.size && sameSet(ids, current.selected)) return group.label;
    }
    if (chosen === 1) return current.available.get(Array.from(current.selected)[0])?.label || '1 selected';
    return `${chosen} of ${total}`;
  }

  function combinedSummary() {
    const a = slotSummary('A');
    const b = slotSummary('B');
    if (a === 'All' && b === 'All') return 'All';
    if (a === 'None' && b === 'None') return 'None';
    if (a === 'None' && b === 'All') return 'Sky A off';
    if (a === 'All' && b === 'None') return 'Sky B off';
    return `A: ${a} · B: ${b}`;
  }

  function updateSlotStates(slot, root) {
    const current = state[slot];
    const skyToggle = root.querySelector(`[data-placement-sky-toggle="${slot}"]`);
    if (skyToggle) {
      skyToggle.checked = current.available.size > 0 && current.selected.size === current.available.size;
      skyToggle.indeterminate = current.selected.size > 0 && current.selected.size < current.available.size;
      skyToggle.disabled = current.available.size === 0;
    }

    GROUPS.forEach(group => {
      const toggle = root.querySelector(`[data-placement-group-toggle="${group.id}"][data-slot="${slot}"]`);
      if (!toggle) return;
      const ids = groupIds(slot, group.id);
      const selectedCount = ids.filter(id => current.selected.has(id)).length;
      toggle.checked = ids.length > 0 && selectedCount === ids.length;
      toggle.indeterminate = selectedCount > 0 && selectedCount < ids.length;
      toggle.disabled = ids.length === 0;
    });

    const summary = root.querySelector(`[data-placement-sky-summary="${slot}"]`);
    const nextSummary = slotSummary(slot);
    if (summary && summary.textContent !== nextSummary) summary.textContent = nextSummary;
  }

  function updateControlStates() {
    const root = popover();
    const owner = control();
    if (!root || !owner) return;
    SLOTS.forEach(slot => updateSlotStates(slot, root));
    const summary = owner.querySelector('[data-placement-filter-summary]');
    const nextSummary = combinedSummary();
    if (summary && summary.textContent !== nextSummary) summary.textContent = nextSummary;
    owner.dataset.skyASelectionCount = String(state.A.selected.size);
    owner.dataset.skyBSelectionCount = String(state.B.selected.size);
  }

  function checkbox(slot, attributes) {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.dataset.slot = slot;
    Object.entries(attributes).forEach(([name, value]) => {
      input.dataset[name] = value;
    });
    return input;
  }

  function skyHeaderCell(slot) {
    const cell = document.createElement('div');
    cell.className = `sky-chart-placement-matrix-sky sky-chart-placement-matrix-sky-${slot.toLowerCase()}`;
    cell.dataset.placementSkyHeader = slot;

    const label = document.createElement('label');
    const toggle = checkbox(slot, { placementSkyToggle: slot });
    const title = document.createElement('strong');
    title.textContent = `Sky ${slot}`;
    const status = document.createElement('span');
    status.dataset.placementSkySummary = slot;
    label.append(toggle, title, status);

    const actions = document.createElement('div');
    actions.className = 'sky-chart-placement-filter-actions sky-chart-placement-sky-actions';
    ['all', 'none'].forEach(preset => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.placementPreset = preset;
      button.dataset.slot = slot;
      button.textContent = preset === 'all' ? 'All' : 'None';
      actions.appendChild(button);
    });
    cell.append(label, actions);
    return cell;
  }

  function groupToggleCell(slot, group) {
    const cell = document.createElement('label');
    cell.className = `sky-chart-placement-matrix-check sky-chart-placement-matrix-check-${slot.toLowerCase()}`;
    const input = checkbox(slot, { placementGroupToggle: group.id });
    const text = document.createElement('span');
    text.textContent = `Sky ${slot}`;
    cell.append(input, text);
    return cell;
  }

  function placementCell(slot, entry) {
    const cell = document.createElement('label');
    cell.className = `sky-chart-placement-matrix-check sky-chart-placement-matrix-check-${slot.toLowerCase()}`;
    if (!state[slot].available.has(entry.id)) {
      cell.classList.add('is-unavailable');
      cell.setAttribute('aria-label', `${entry.label} is not available in Sky ${slot}`);
      cell.textContent = '—';
      return cell;
    }
    const input = checkbox(slot, { placementOption: entry.id });
    input.value = entry.id;
    input.checked = state[slot].selected.has(entry.id);
    const text = document.createElement('span');
    text.textContent = `Sky ${slot}`;
    cell.append(input, text);
    return cell;
  }

  function groupSection(group) {
    const section = document.createElement('section');
    section.className = 'sky-chart-placement-matrix-group';
    section.dataset.placementGroup = group.id;

    const heading = document.createElement('div');
    heading.className = 'sky-chart-placement-matrix-group-heading';
    const title = document.createElement('strong');
    title.textContent = group.label;
    heading.append(title, groupToggleCell('A', group), groupToggleCell('B', group));
    section.appendChild(heading);

    matrixEntries(group.id).forEach(entry => {
      const row = document.createElement('div');
      row.className = 'sky-chart-placement-matrix-row';
      row.dataset.placementMatrixRow = entry.id;
      const label = document.createElement('span');
      label.className = 'sky-chart-placement-matrix-label';
      label.textContent = entry.label;
      row.append(label, placementCell('A', entry), placementCell('B', entry));
      section.appendChild(row);
    });
    return section;
  }

  function renderControl() {
    const body = popover()?.querySelector('.sky-chart-placement-filter-body');
    if (!body) return;
    body.replaceChildren();

    const globalActions = document.createElement('div');
    globalActions.className = 'sky-chart-placement-filter-actions sky-chart-placement-global-actions';
    ['all', 'none'].forEach(preset => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.placementPreset = preset;
      button.dataset.slot = 'both';
      button.textContent = preset === 'all' ? 'Select all' : 'Clear all';
      globalActions.appendChild(button);
    });

    const matrix = document.createElement('div');
    matrix.className = 'sky-chart-placement-matrix';
    matrix.dataset.placementMatrix = 'combined';
    const header = document.createElement('div');
    header.className = 'sky-chart-placement-matrix-header';
    const title = document.createElement('strong');
    title.textContent = 'Placement';
    header.append(title, skyHeaderCell('A'), skyHeaderCell('B'));
    matrix.appendChild(header);
    GROUPS.forEach(group => matrix.appendChild(groupSection(group)));
    body.append(globalActions, matrix);
    updateControlStates();
  }

  function handlePopoverClick(event) {
    const preset = event.target.closest('[data-placement-preset]');
    if (!preset) return;
    event.preventDefault();
    const slots = preset.dataset.slot === 'both' ? SLOTS : [preset.dataset.slot];
    slots.forEach(slot => {
      if (preset.dataset.placementPreset === 'all') state[slot].selected = new Set(state[slot].available.keys());
      else state[slot].selected.clear();
    });
    syncControl();
  }

  function handlePopoverChange(event) {
    const option = event.target.closest('[data-placement-option]');
    if (option) {
      const slot = option.dataset.slot;
      if (option.checked) state[slot].selected.add(option.value);
      else state[slot].selected.delete(option.value);
      syncControl();
      return;
    }

    const groupToggle = event.target.closest('[data-placement-group-toggle]');
    if (groupToggle) {
      const slot = groupToggle.dataset.slot;
      groupIds(slot, groupToggle.dataset.placementGroupToggle).forEach(id => {
        if (groupToggle.checked) state[slot].selected.add(id);
        else state[slot].selected.delete(id);
      });
      syncControl();
      return;
    }

    const skyToggle = event.target.closest('[data-placement-sky-toggle]');
    if (skyToggle) {
      const slot = skyToggle.dataset.placementSkyToggle;
      if (skyToggle.checked) state[slot].selected = new Set(state[slot].available.keys());
      else state[slot].selected.clear();
      syncControl();
    }
  }

  function positionPortal() {
    const owner = portalOwner;
    const menu = popover();
    const summary = owner?.querySelector('summary');
    if (!owner?.open || !menu?.classList.contains('is-portaled') || !summary) return;

    const rect = summary.getBoundingClientRect();
    const margin = 12;
    const width = Math.min(620, Math.max(300, window.innerWidth - margin * 2));
    const left = Math.min(
      window.innerWidth - width - margin,
      Math.max(margin, rect.left + rect.width / 2 - width * 0.34)
    );
    const roomBelow = window.innerHeight - rect.bottom - margin;
    const roomAbove = rect.top - margin;
    const maxHeight = Math.max(220, Math.min(540, Math.max(roomBelow, roomAbove)));
    const placeAbove = roomBelow < 280 && roomAbove > roomBelow;
    const top = placeAbove
      ? Math.max(margin, rect.top - maxHeight - 6)
      : Math.min(window.innerHeight - maxHeight - margin, rect.bottom + 6);

    Object.assign(menu.style, {
      width: `${width}px`,
      maxHeight: `${maxHeight}px`,
      left: `${left}px`,
      top: `${Math.max(margin, top)}px`
    });
  }

  function portalOpen(owner) {
    const menu = owner.querySelector('.sky-chart-placement-filter-popover') || popover();
    if (!menu) return;
    portalOwner = owner;
    menu.hidden = false;
    menu.classList.add('is-portaled');
    document.body.appendChild(menu);
    owner.querySelector('summary')?.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(positionPortal);
  }

  function portalClose(owner) {
    const menu = popover();
    if (!menu) return;
    menu.hidden = true;
    menu.classList.remove('is-portaled');
    menu.removeAttribute('style');
    owner.appendChild(menu);
    menu.hidden = false;
    owner.querySelector('summary')?.setAttribute('aria-expanded', 'false');
    portalOwner = null;
  }

  function createControl() {
    const details = document.createElement('details');
    details.className = 'sky-chart-placement-filter sky-chart-placement-filter-combined';
    details.dataset.placementFilter = 'combined';
    details.innerHTML = '<summary aria-haspopup="dialog" aria-expanded="false" aria-controls="skyChartPlacementPopover"><span class="sky-chart-placement-filter-label">Placements</span><span class="sky-chart-placement-filter-value" data-placement-filter-summary>All</span></summary><div id="skyChartPlacementPopover" class="sky-chart-placement-filter-popover" role="dialog" aria-label="Placement filters"><div class="sky-chart-placement-filter-body"></div></div>';
    const menu = details.querySelector('.sky-chart-placement-filter-popover');
    menu.addEventListener('click', handlePopoverClick);
    menu.addEventListener('change', handlePopoverChange);
    details.addEventListener('toggle', () => {
      if (details.open) portalOpen(details);
      else portalClose(details);
    });
    return details;
  }

  function syncControl() {
    const root = popover();
    if (!root) return;
    root.querySelectorAll('[data-placement-option][data-slot]').forEach(input => {
      input.checked = state[input.dataset.slot].selected.has(input.value);
    });
    updateControlStates();
    applyPlacementFilters();
  }

  function refreshAvailable(slot) {
    const entries = entriesFor(slot);
    const signature = JSON.stringify(entries.map(entry => [entry.id, entry.label, entry.group]));
    const current = state[slot];
    if (current.signature === signature) return false;
    const previouslyAll = current.initialized && current.selected.size === current.available.size;
    const previous = new Set(current.selected);
    current.available = new Map(entries.map(entry => [entry.id, entry]));
    if (!current.initialized || previouslyAll) current.selected = new Set(current.available.keys());
    else current.selected = new Set(Array.from(previous).filter(id => current.available.has(id)));
    current.initialized = true;
    current.signature = signature;
    return true;
  }

  function decorateExistingControls(bar) {
    const map = [
      ['[data-filter="orb"]', 'sky-chart-filter-orb'],
      ['[data-filter="aspect"]', 'sky-chart-filter-aspect'],
      ['[data-filter="houseA"]', 'sky-chart-filter-house-a'],
      ['[data-filter="houseB"]', 'sky-chart-filter-house-b'],
      ['[data-house-system-filter]', 'sky-chart-filter-house-system']
    ];
    map.forEach(([selector, className]) => bar.querySelector(selector)?.closest('label')?.classList.add(className));
  }

  function ensureControl() {
    const bar = filterBar();
    if (!bar) return false;
    decorateExistingControls(bar);
    bar.querySelector('[data-filter="placement"]')?.closest('label')?.remove();
    bar.querySelectorAll('[data-placement-filter-sky]').forEach(node => node.remove());

    let combined = bar.querySelector('[data-placement-filter="combined"]');
    const aspectLabel = bar.querySelector('[data-filter="aspect"]')?.closest('label');
    if (!combined) combined = createControl();
    if (!combined.isConnected) {
      if (aspectLabel) aspectLabel.insertAdjacentElement('afterend', combined);
      else bar.prepend(combined);
    }
    bar.dataset.multiselectPlacementFilters = 'true';
    return true;
  }

  function rowHiddenByOtherFilters(row) {
    return row.hidden || row.classList.contains('sky-chart-filter-hidden') || row.classList.contains('sky-chart-orb-hidden') || row.classList.contains('sky-orb-filter-hidden');
  }

  function updateVisibleCount() {
    if (counting) return;
    counting = true;
    requestAnimationFrame(() => {
      const rows = Array.from(document.querySelectorAll('.sky-foundation-relationship-row'));
      const visible = rows.filter(row => !rowHiddenByOtherFilters(row) && !row.classList.contains('sky-chart-multiselect-hidden')).length;
      const count = document.getElementById('skyFoundationRelationshipCount');
      const empty = document.getElementById('skyFoundationRelationshipEmpty');
      const nextCount = `${visible}/${rows.length}`;
      if (count && count.textContent !== nextCount) count.textContent = nextCount;
      if (empty && empty.hidden === (visible === 0)) empty.hidden = visible !== 0;
      counting = false;
    });
  }

  function applyPlacementFilters() {
    const selectedA = state.A.selected;
    const selectedB = state.B.selected;
    document.querySelectorAll('.sky-foundation-relationship-row').forEach(row => {
      const visible = selectedA.has(row.dataset.leftPlacement) && selectedB.has(row.dataset.rightPlacement);
      row.classList.toggle('sky-chart-multiselect-hidden', !visible);
      document.querySelectorAll(`[data-layer="aspects"] [data-relation-index="${row.dataset.relationIndex}"]`).forEach(node => {
        node.classList.toggle('sky-chart-multiselect-hidden', !visible);
      });
    });
    document.documentElement.dataset.skyPlacementMultiselect = 'ready';
    document.documentElement.dataset.skyAPlacementSelection = `${selectedA.size}/${state.A.available.size}`;
    document.documentElement.dataset.skyBPlacementSelection = `${selectedB.size}/${state.B.available.size}`;
    updateVisibleCount();
    window.dispatchEvent(new CustomEvent('relphi:sky-placement-multiselect-changed', {
      detail: { A: Array.from(selectedA), B: Array.from(selectedB) }
    }));
  }

  function refresh() {
    queued = false;
    if (!ensureControl()) return;
    const changedA = refreshAvailable('A');
    const changedB = refreshAvailable('B');
    const menu = popover();
    if (changedA || changedB || !menu?.querySelector('[data-placement-matrix]')) renderControl();
    else updateControlStates();
    applyPlacementFilters();
    positionPortal();
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(refresh);
  }

  function closeFromOutside(event) {
    const owner = portalOwner;
    const menu = popover();
    if (!owner?.open) return;
    if (owner.contains(event.target) || menu?.contains(event.target)) return;
    owner.open = false;
  }

  function start() {
    const root = document.getElementById('skyFoundationRoot');
    if (root) new MutationObserver(records => {
      if (records.every(record => record.target?.closest?.('.sky-chart-placement-filter'))) return;
      schedule();
    }).observe(root, { childList: true, subtree: true });
    ['relphi:sky-foundation-ready', 'relphi:sky-foundation-interactions-ready', 'relphi:sky-foundation-filter-changed']
      .forEach(name => window.addEventListener(name, schedule));
    document.addEventListener('change', event => {
      if (event.target.closest('.sky-chart-filter-bar') && !event.target.closest('.sky-chart-placement-filter')) {
        setTimeout(updateVisibleCount, 0);
      }
    });
    document.addEventListener('pointerdown', closeFromOutside, true);
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const owner = portalOwner;
      if (owner?.open) {
        owner.open = false;
        owner.querySelector('summary')?.focus();
      }
    });
    window.addEventListener('resize', positionPortal);
    window.addEventListener('scroll', positionPortal, true);
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
