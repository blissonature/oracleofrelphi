// Per-sky placement filters with checkbox groups and fast whole-sky clearing.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyMultiselectFiltersV1) return;
  window.__relphiSkyMultiselectFiltersV1 = true;

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

  function selectionSummary(slot) {
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

  function updateGroupStates(slot, control) {
    GROUPS.forEach(group => {
      const toggle = control.querySelector(`[data-placement-group-toggle="${group.id}"]`);
      if (!toggle) return;
      const ids = groupIds(slot, group.id);
      const selectedCount = ids.filter(id => state[slot].selected.has(id)).length;
      toggle.checked = ids.length > 0 && selectedCount === ids.length;
      toggle.indeterminate = selectedCount > 0 && selectedCount < ids.length;
      toggle.disabled = ids.length === 0;
    });
    const summary = control.querySelector('[data-placement-filter-summary]');
    if (summary) summary.textContent = selectionSummary(slot);
    control.dataset.selectionCount = String(state[slot].selected.size);
    control.dataset.availableCount = String(state[slot].available.size);
  }

  function checkboxRow(slot, entry) {
    const label = document.createElement('label');
    label.className = 'sky-chart-placement-option';
    label.innerHTML = `<input type="checkbox" value="${entry.id}" data-placement-option="${entry.id}"><span>${entry.label}</span>`;
    const input = label.querySelector('input');
    input.checked = state[slot].selected.has(entry.id);
    return label;
  }

  function renderControl(slot) {
    const control = document.querySelector(`[data-placement-filter-sky="${slot}"]`);
    if (!control) return;
    const body = control.querySelector('.sky-chart-placement-filter-body');
    if (!body) return;
    body.replaceChildren();

    const actions = document.createElement('div');
    actions.className = 'sky-chart-placement-filter-actions';
    actions.innerHTML = `<button type="button" data-placement-preset="all">All</button><button type="button" data-placement-preset="none">None</button>`;
    body.appendChild(actions);

    GROUPS.forEach(group => {
      const entries = Array.from(state[slot].available.values()).filter(entry => entry.group === group.id);
      if (!entries.length) return;
      const section = document.createElement('fieldset');
      section.className = 'sky-chart-placement-filter-group';
      section.dataset.placementGroup = group.id;
      const legend = document.createElement('legend');
      legend.innerHTML = `<label><input type="checkbox" data-placement-group-toggle="${group.id}"><span>${group.label}</span></label>`;
      section.appendChild(legend);
      const options = document.createElement('div');
      options.className = 'sky-chart-placement-filter-options';
      entries.forEach(entry => options.appendChild(checkboxRow(slot, entry)));
      section.appendChild(options);
      body.appendChild(section);
    });

    updateGroupStates(slot, control);
  }

  function createControl(slot) {
    const details = document.createElement('details');
    details.className = `sky-chart-placement-filter sky-chart-placement-filter-${slot.toLowerCase()}`;
    details.dataset.placementFilterSky = slot;
    details.innerHTML = `<summary><span class="sky-chart-placement-filter-label">Sky ${slot} placements</span><span class="sky-chart-placement-filter-value" data-placement-filter-summary>All</span></summary><div class="sky-chart-placement-filter-popover"><div class="sky-chart-placement-filter-body"></div></div>`;

    details.addEventListener('toggle', () => {
      if (!details.open) return;
      document.querySelectorAll('.sky-chart-placement-filter[open]').forEach(other => {
        if (other !== details) other.open = false;
      });
    });

    details.addEventListener('click', event => {
      const preset = event.target.closest('[data-placement-preset]');
      if (preset) {
        event.preventDefault();
        if (preset.dataset.placementPreset === 'all') state[slot].selected = new Set(state[slot].available.keys());
        else state[slot].selected.clear();
        syncControl(slot);
      }
    });

    details.addEventListener('change', event => {
      const option = event.target.closest('[data-placement-option]');
      if (option) {
        if (option.checked) state[slot].selected.add(option.value);
        else state[slot].selected.delete(option.value);
        syncControl(slot);
        return;
      }
      const groupToggle = event.target.closest('[data-placement-group-toggle]');
      if (groupToggle) {
        groupIds(slot, groupToggle.dataset.placementGroupToggle).forEach(id => {
          if (groupToggle.checked) state[slot].selected.add(id);
          else state[slot].selected.delete(id);
        });
        syncControl(slot);
      }
    });

    return details;
  }

  function syncControl(slot) {
    const control = document.querySelector(`[data-placement-filter-sky="${slot}"]`);
    if (!control) return;
    control.querySelectorAll('[data-placement-option]').forEach(input => {
      input.checked = state[slot].selected.has(input.value);
    });
    updateGroupStates(slot, control);
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
    renderControl(slot);
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

  function ensureControls() {
    const bar = filterBar();
    if (!bar) return false;
    decorateExistingControls(bar);
    const oldPlacement = bar.querySelector('[data-filter="placement"]')?.closest('label');
    oldPlacement?.remove();

    let controlA = bar.querySelector('[data-placement-filter-sky="A"]');
    let controlB = bar.querySelector('[data-placement-filter-sky="B"]');
    const aspectLabel = bar.querySelector('[data-filter="aspect"]')?.closest('label');
    if (!controlA) controlA = createControl('A');
    if (!controlB) controlB = createControl('B');
    if (!controlA.isConnected || !controlB.isConnected) {
      if (aspectLabel) {
        aspectLabel.insertAdjacentElement('afterend', controlB);
        aspectLabel.insertAdjacentElement('afterend', controlA);
      } else {
        bar.prepend(controlB);
        bar.prepend(controlA);
      }
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
      if (count) count.textContent = `${visible}/${rows.length}`;
      if (empty) empty.hidden = visible !== 0;
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
    if (!ensureControls()) return;
    refreshAvailable('A');
    refreshAvailable('B');
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
      document.querySelectorAll('.sky-chart-placement-filter[open]').forEach(details => {
        if (!details.contains(event.target)) details.open = false;
      });
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
