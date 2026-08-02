// One categorized placement checklist for both skies, with fast whole-sky clearing.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyMultiselectFiltersV1) return;
  window.__relphiSkyMultiselectFiltersV1 = true;

  const SLOTS = ['A','B'];
  const GROUPS = Object.freeze([
    { id:'luminaries', label:'Luminaries', members:new Set(['sun','moon']) },
    { id:'planets', label:'Planets', members:new Set(['mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto']) },
    { id:'angles-points', label:'Angles and Points', members:null }
  ]);
  const state = {
    A:{ available:new Map(), selected:new Set(), initialized:false, signature:'' },
    B:{ available:new Map(), selected:new Set(), initialized:false, signature:'' }
  };
  let queued = false;
  let counting = false;

  function filterBar() {
    return document.querySelector('#skyFoundationRelationships .sky-chart-filter-bar');
  }

  function control() {
    return document.querySelector('[data-placement-filter="combined"]');
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
      return { id, label, group:categoryFor(id) };
    }).filter(Boolean);
  }

  function sameSet(left, right) {
    return left.size === right.size && Array.from(left).every(value => right.has(value));
  }

  function groupIds(slot, groupId) {
    return Array.from(state[slot].available.values()).filter(entry => entry.group === groupId).map(entry => entry.id);
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
    if (summary) summary.textContent = slotSummary(slot);
    const section = root.querySelector(`[data-placement-sky-section="${slot}"]`);
    if (section) {
      section.dataset.selectionCount = String(current.selected.size);
      section.dataset.availableCount = String(current.available.size);
    }
  }

  function updateControlStates() {
    const root = control();
    if (!root) return;
    SLOTS.forEach(slot => updateSlotStates(slot, root));
    const summary = root.querySelector('[data-placement-filter-summary]');
    if (summary) summary.textContent = combinedSummary();
    root.dataset.skyASelectionCount = String(state.A.selected.size);
    root.dataset.skyBSelectionCount = String(state.B.selected.size);
  }

  function checkboxRow(slot, entry) {
    const label = document.createElement('label');
    label.className = 'sky-chart-placement-option';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = entry.id;
    input.dataset.placementOption = entry.id;
    input.dataset.slot = slot;
    input.checked = state[slot].selected.has(entry.id);
    const text = document.createElement('span');
    text.textContent = entry.label;
    label.append(input, text);
    return label;
  }

  function groupLegend(slot, group) {
    const legend = document.createElement('legend');
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.dataset.placementGroupToggle = group.id;
    input.dataset.slot = slot;
    const text = document.createElement('span');
    text.textContent = group.label;
    label.append(input, text);
    legend.appendChild(label);
    return legend;
  }

  function skySection(slot) {
    const section = document.createElement('section');
    section.className = `sky-chart-placement-sky sky-chart-placement-sky-${slot.toLowerCase()}`;
    section.dataset.placementSkySection = slot;

    const heading = document.createElement('div');
    heading.className = 'sky-chart-placement-sky-heading';
    const toggleLabel = document.createElement('label');
    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.dataset.placementSkyToggle = slot;
    const title = document.createElement('strong');
    title.textContent = `Sky ${slot}`;
    const status = document.createElement('span');
    status.dataset.placementSkySummary = slot;
    toggleLabel.append(toggle, title);
    heading.append(toggleLabel, status);

    const actions = document.createElement('div');
    actions.className = 'sky-chart-placement-filter-actions sky-chart-placement-sky-actions';
    ['all','none'].forEach(preset => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.placementPreset = preset;
      button.dataset.slot = slot;
      button.textContent = preset === 'all' ? 'All' : 'None';
      actions.appendChild(button);
    });

    section.append(heading, actions);
    GROUPS.forEach(group => {
      const entries = Array.from(state[slot].available.values()).filter(entry => entry.group === group.id);
      if (!entries.length) return;
      const fieldset = document.createElement('fieldset');
      fieldset.className = 'sky-chart-placement-filter-group';
      fieldset.dataset.placementGroup = group.id;
      fieldset.dataset.slot = slot;
      fieldset.appendChild(groupLegend(slot, group));
      const options = document.createElement('div');
      options.className = 'sky-chart-placement-filter-options';
      entries.forEach(entry => options.appendChild(checkboxRow(slot, entry)));
      fieldset.appendChild(options);
      section.appendChild(fieldset);
    });
    return section;
  }

  function renderControl() {
    const root = control();
    const body = root?.querySelector('.sky-chart-placement-filter-body');
    if (!root || !body) return;
    body.replaceChildren();

    const globalActions = document.createElement('div');
    globalActions.className = 'sky-chart-placement-filter-actions sky-chart-placement-global-actions';
    ['all','none'].forEach(preset => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.placementPreset = preset;
      button.dataset.slot = 'both';
      button.textContent = preset === 'all' ? 'Select all' : 'Clear all';
      globalActions.appendChild(button);
    });

    const skies = document.createElement('div');
    skies.className = 'sky-chart-placement-filter-skies';
    SLOTS.forEach(slot => skies.appendChild(skySection(slot)));
    body.append(globalActions, skies);
    updateControlStates();
  }

  function createControl() {
    const details = document.createElement('details');
    details.className = 'sky-chart-placement-filter sky-chart-placement-filter-combined';
    details.dataset.placementFilter = 'combined';
    details.innerHTML = '<summary><span class="sky-chart-placement-filter-label">Placements</span><span class="sky-chart-placement-filter-value" data-placement-filter-summary>All</span></summary><div class="sky-chart-placement-filter-popover"><div class="sky-chart-placement-filter-body"></div></div>';

    details.addEventListener('click', event => {
      const preset = event.target.closest('[data-placement-preset]');
      if (!preset) return;
      event.preventDefault();
      const slots = preset.dataset.slot === 'both' ? SLOTS : [preset.dataset.slot];
      slots.forEach(slot => {
        if (preset.dataset.placementPreset === 'all') state[slot].selected = new Set(state[slot].available.keys());
        else state[slot].selected.clear();
      });
      syncControl();
    });

    details.addEventListener('change', event => {
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
    });

    return details;
  }

  function syncControl() {
    const root = control();
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
      ['[data-filter="orb"]','sky-chart-filter-orb'],
      ['[data-filter="aspect"]','sky-chart-filter-aspect'],
      ['[data-filter="houseA"]','sky-chart-filter-house-a'],
      ['[data-filter="houseB"]','sky-chart-filter-house-b'],
      ['[data-house-system-filter]','sky-chart-filter-house-system']
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
      detail:{ A:Array.from(selectedA), B:Array.from(selectedB) }
    }));
  }

  function refresh() {
    queued = false;
    if (!ensureControl()) return;
    const changedA = refreshAvailable('A');
    const changedB = refreshAvailable('B');
    if (changedA || changedB || !control()?.querySelector('[data-placement-sky-section]')) renderControl();
    else updateControlStates();
    applyPlacementFilters();
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(refresh);
  }

  function start() {
    const root = document.getElementById('skyFoundationRoot');
    if (root) new MutationObserver(schedule).observe(root, { childList:true, subtree:true });
    ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-foundation-filter-changed']
      .forEach(name => window.addEventListener(name, schedule));
    document.addEventListener('change', event => {
      if (event.target.closest('.sky-chart-filter-bar') && !event.target.closest('.sky-chart-placement-filter')) {
        setTimeout(updateVisibleCount, 0);
      }
    });
    document.addEventListener('pointerdown', event => {
      const open = document.querySelector('.sky-chart-placement-filter[open]');
      if (open && !open.contains(event.target)) open.open = false;
    });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const open = document.querySelector('.sky-chart-placement-filter[open]');
      if (open) {
        open.open = false;
        open.querySelector('summary')?.focus();
      }
    });
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
