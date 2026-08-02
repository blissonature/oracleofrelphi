// One shared Houses checklist for Sky A and Sky B, parallel to Placements.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyHouseMultiselectV1) return;
  window.__relphiSkyHouseMultiselectV1 = true;

  const SLOTS = ['A', 'B'];
  const HOUSES = Array.from({ length: 12 }, (_, index) => String(index + 1));
  const state = {
    A: new Set(HOUSES),
    B: new Set(HOUSES)
  };
  let queued = false;
  let countTimer = 0;
  let portalOwner = null;

  function filterBar() {
    return document.querySelector('#skyFoundationRelationships .sky-chart-filter-bar');
  }

  function control() {
    return document.querySelector('[data-house-filter="combined"]');
  }

  function popover() {
    return document.getElementById('skyChartHousePopover');
  }

  function idsFor(scope, target) {
    return scope === 'all' ? HOUSES : HOUSES.includes(target) ? [target] : [];
  }

  function setSelection(ids, slot, selected) {
    ids.forEach(id => {
      if (selected) state[slot].add(id);
      else state[slot].delete(id);
    });
  }

  function selectedCount(ids, slot) {
    return ids.filter(id => state[slot].has(id)).length;
  }

  function slotSummary(slot) {
    const chosen = state[slot].size;
    if (!chosen) return 'None';
    if (chosen === HOUSES.length) return 'All';
    if (chosen === 1) return `House ${Array.from(state[slot])[0]}`;
    return `${chosen} of ${HOUSES.length}`;
  }

  function combinedSummary() {
    const a = slotSummary('A');
    const b = slotSummary('B');
    if (a === 'All' && b === 'All') return 'All';
    if (a === 'None' && b === 'None') return 'None';
    return `A: ${a} · B: ${b}`;
  }

  function updateChoiceState(input) {
    const ids = idsFor(input.dataset.houseScope, input.dataset.houseTarget);
    const choice = input.dataset.houseChoice;
    const slots = choice === 'all' ? SLOTS : [choice.toUpperCase()];
    let available = 0;
    let selected = 0;
    slots.forEach(slot => {
      available += ids.length;
      selected += selectedCount(ids, slot);
    });
    input.checked = available > 0 && selected === available;
    input.indeterminate = selected > 0 && selected < available;
  }

  function updateControlStates() {
    const owner = control();
    const menu = popover();
    if (!owner || !menu) return;
    owner.querySelectorAll('[data-house-choice]').forEach(updateChoiceState);
    if (!owner.contains(menu)) menu.querySelectorAll('[data-house-choice]').forEach(updateChoiceState);
    const status = owner.querySelector('[data-house-filter-summary]');
    if (status) status.textContent = combinedSummary();
    owner.dataset.skyASelectionCount = String(state.A.size);
    owner.dataset.skyBSelectionCount = String(state.B.size);
  }

  function choiceControl(scope, target, choice, rowLabel) {
    const label = document.createElement('label');
    label.className = `sky-chart-house-choice sky-chart-house-choice-${choice}`;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.dataset.houseScope = scope;
    input.dataset.houseTarget = target;
    input.dataset.houseChoice = choice;
    input.setAttribute('aria-label', `${rowLabel}: ${choice === 'all' ? 'All skies' : `Sky ${choice.toUpperCase()}`}`);

    const text = document.createElement('span');
    text.textContent = choice === 'all' ? 'All' : choice.toUpperCase();
    label.append(input, text);
    return label;
  }

  function listItem(scope, target, labelText, kind) {
    const item = document.createElement('div');
    item.className = `sky-chart-house-list-item sky-chart-house-list-item-${kind}`;
    item.dataset.houseListItem = target;

    const label = document.createElement('strong');
    label.className = 'sky-chart-house-list-label';
    label.textContent = labelText;

    const choices = document.createElement('div');
    choices.className = 'sky-chart-house-list-choices';
    choices.setAttribute('role', 'group');
    choices.setAttribute('aria-label', labelText);
    ['all', 'a', 'b'].forEach(choice => choices.appendChild(choiceControl(scope, target, choice, labelText)));
    item.append(label, choices);
    return item;
  }

  function renderControl() {
    const body = popover()?.querySelector('.sky-chart-house-filter-body');
    if (!body) return;
    body.replaceChildren();

    const list = document.createElement('div');
    list.className = 'sky-chart-house-list';
    list.dataset.houseList = 'combined';

    const header = document.createElement('div');
    header.className = 'sky-chart-house-list-header';
    header.innerHTML = '<strong>House</strong><span>All</span><span>A</span><span>B</span>';
    list.appendChild(header);
    list.appendChild(listItem('all', 'all', 'All houses', 'master'));
    HOUSES.forEach(house => list.appendChild(listItem('house', house, `House ${house}`, 'house')));
    body.appendChild(list);
    updateControlStates();
  }

  function handleChoiceChange(event) {
    const input = event.target.closest('[data-house-choice]');
    if (!input) return;
    const ids = idsFor(input.dataset.houseScope, input.dataset.houseTarget);
    const choice = input.dataset.houseChoice;
    const slots = choice === 'all' ? SLOTS : [choice.toUpperCase()];
    slots.forEach(slot => setSelection(ids, slot, input.checked));
    updateControlStates();
    applyHouseFilters();
  }

  function isOpen(owner) {
    return owner?.classList.contains('is-open');
  }

  function positionPortal() {
    const owner = portalOwner;
    const menu = popover();
    const head = owner?.querySelector('.sky-chart-house-filter-head');
    if (!isOpen(owner) || !menu?.classList.contains('is-portaled') || !head) return;

    const rect = head.getBoundingClientRect();
    const margin = 12;
    const width = Math.min(330, Math.max(280, window.innerWidth - margin * 2));
    const left = Math.min(window.innerWidth - width - margin, Math.max(margin, rect.left + rect.width / 2 - width / 2));
    const roomBelow = window.innerHeight - rect.bottom - margin;
    const roomAbove = rect.top - margin;
    const maxHeight = Math.max(220, Math.min(560, Math.max(roomBelow, roomAbove)));
    const placeAbove = roomBelow < 280 && roomAbove > roomBelow;
    const top = placeAbove ? Math.max(margin, rect.top - maxHeight - 6) : Math.min(window.innerHeight - maxHeight - margin, rect.bottom + 6);

    Object.assign(menu.style, {
      width: `${width}px`,
      maxHeight: `${maxHeight}px`,
      left: `${left}px`,
      top: `${Math.max(margin, top)}px`
    });
  }

  function portalOpen(owner) {
    const menu = owner.querySelector('.sky-chart-house-filter-popover') || popover();
    if (!menu) return;
    portalOwner = owner;
    owner.classList.add('is-open');
    menu.hidden = false;
    menu.classList.add('is-portaled');
    document.body.appendChild(menu);
    owner.querySelector('[data-house-filter-toggle]')?.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(positionPortal);
  }

  function portalClose(owner) {
    const menu = popover();
    if (!menu || !owner) return;
    menu.hidden = true;
    menu.classList.remove('is-portaled');
    menu.removeAttribute('style');
    owner.appendChild(menu);
    owner.classList.remove('is-open');
    owner.querySelector('[data-house-filter-toggle]')?.setAttribute('aria-expanded', 'false');
    portalOwner = null;
  }

  function togglePortal(owner) {
    if (isOpen(owner)) portalClose(owner);
    else portalOpen(owner);
  }

  function createControl() {
    const root = document.createElement('div');
    root.className = 'sky-chart-house-filter sky-chart-house-filter-combined';
    root.dataset.houseFilter = 'combined';

    const head = document.createElement('div');
    head.className = 'sky-chart-house-filter-head';

    const title = document.createElement('span');
    title.className = 'sky-chart-house-filter-label';
    title.textContent = 'Houses';

    const choices = document.createElement('div');
    choices.className = 'sky-chart-house-summary-choices';
    choices.setAttribute('role', 'group');
    choices.setAttribute('aria-label', 'All houses');
    ['all', 'a', 'b'].forEach(choice => choices.appendChild(choiceControl('all', 'all', choice, 'All houses')));

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'sky-chart-house-filter-toggle';
    toggle.dataset.houseFilterToggle = 'true';
    toggle.setAttribute('aria-label', 'Open house filters');
    toggle.setAttribute('aria-haspopup', 'dialog');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'skyChartHousePopover');
    toggle.textContent = '⌄';

    const status = document.createElement('span');
    status.className = 'sky-chart-house-filter-status';
    status.dataset.houseFilterSummary = 'true';
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'All';

    const menu = document.createElement('div');
    menu.id = 'skyChartHousePopover';
    menu.className = 'sky-chart-house-filter-popover';
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-label', 'House filters');
    menu.hidden = true;
    menu.innerHTML = '<div class="sky-chart-house-filter-body"></div>';

    head.append(title, choices, toggle, status);
    root.append(head, menu);
    toggle.addEventListener('click', () => togglePortal(root));
    return root;
  }

  function ensureControl() {
    const bar = filterBar();
    if (!bar) return false;
    bar.querySelector('[data-filter="houseA"]')?.closest('label')?.remove();
    bar.querySelector('[data-filter="houseB"]')?.closest('label')?.remove();

    let combined = bar.querySelector('[data-house-filter="combined"]');
    const placements = bar.querySelector('[data-placement-filter="combined"]');
    const houseSystem = bar.querySelector('[data-house-system-filter]')?.closest('label');
    if (!combined) combined = createControl();
    if (!combined.isConnected) {
      if (placements) placements.insertAdjacentElement('afterend', combined);
      else if (houseSystem) houseSystem.insertAdjacentElement('beforebegin', combined);
      else bar.appendChild(combined);
    }
    bar.dataset.multiselectHouseFilters = 'true';
    if (!popover()?.querySelector('[data-house-list]')) renderControl();
    return true;
  }

  function relationshipSlots(node) {
    const mode = document.documentElement.dataset.skyRelationshipMode || 'A-B';
    const left = node.dataset.leftSky || (mode === 'B-B' ? 'B' : 'A');
    const right = node.dataset.rightSky || (mode === 'A-A' ? 'A' : mode === 'B-B' ? 'B' : 'B');
    return { left, right };
  }

  function isHouseVisible(node) {
    const leftHouse = String(node.dataset.leftHouse || '');
    const rightHouse = String(node.dataset.rightHouse || '');
    if (!leftHouse || !rightHouse) return true;
    const slots = relationshipSlots(node);
    return state[slots.left].has(leftHouse) && state[slots.right].has(rightHouse);
  }

  function updateVisibleCount() {
    clearTimeout(countTimer);
    countTimer = setTimeout(() => requestAnimationFrame(() => {
      const rows = Array.from(document.querySelectorAll('.sky-foundation-relationship-row'));
      const visible = rows.filter(row => !row.hidden &&
        !row.classList.contains('sky-chart-filter-hidden') &&
        !row.classList.contains('sky-chart-orb-hidden') &&
        !row.classList.contains('sky-orb-filter-hidden') &&
        !row.classList.contains('sky-chart-multiselect-hidden') &&
        !row.classList.contains('sky-chart-house-multiselect-hidden')).length;
      const count = document.getElementById('skyFoundationRelationshipCount');
      const empty = document.getElementById('skyFoundationRelationshipEmpty');
      if (count) {
        count.textContent = `${visible}/${rows.length}`;
        count.dataset.total = String(rows.length);
      }
      if (empty) empty.hidden = visible !== 0;
    }), 0);
  }

  function applyHouseFilters() {
    document.querySelectorAll('.sky-foundation-relationship-row').forEach(row => {
      row.classList.toggle('sky-chart-house-multiselect-hidden', !isHouseVisible(row));
    });
    document.querySelectorAll('[data-layer="aspects"] > .sky-foundation-aspect').forEach(line => {
      line.classList.toggle('sky-chart-house-multiselect-hidden', !isHouseVisible(line));
    });
    document.documentElement.dataset.skyHouseMultiselect = 'ready';
    document.documentElement.dataset.skyAHouseSelection = `${state.A.size}/${HOUSES.length}`;
    document.documentElement.dataset.skyBHouseSelection = `${state.B.size}/${HOUSES.length}`;
    updateVisibleCount();
    window.dispatchEvent(new CustomEvent('relphi:sky-house-multiselect-changed', {
      detail: { A: Array.from(state.A), B: Array.from(state.B) }
    }));
  }

  function refresh() {
    queued = false;
    if (!ensureControl()) return;
    updateControlStates();
    applyHouseFilters();
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
    if (!isOpen(owner)) return;
    if (owner.contains(event.target) || menu?.contains(event.target)) return;
    portalClose(owner);
  }

  function start() {
    const root = document.getElementById('skyFoundationRoot');
    if (root) new MutationObserver(records => {
      if (records.every(record => record.target?.closest?.('.sky-chart-house-filter'))) return;
      schedule();
    }).observe(root, { childList: true, subtree: true });

    [
      'relphi:sky-foundation-ready',
      'relphi:sky-foundation-interactions-ready',
      'relphi:sky-foundation-filter-changed',
      'relphi:sky-placement-multiselect-changed',
      'relphi:sky-single-sky-aspects-rendered'
    ].forEach(name => window.addEventListener(name, schedule));

    document.addEventListener('change', event => {
      if (event.target.closest('[data-house-choice]')) {
        handleChoiceChange(event);
        return;
      }
      if (event.target.closest('.sky-chart-filter-bar')) setTimeout(applyHouseFilters, 0);
    });

    document.addEventListener('pointerdown', closeFromOutside, true);
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const owner = portalOwner;
      if (isOpen(owner)) {
        portalClose(owner);
        owner.querySelector('[data-house-filter-toggle]')?.focus();
      }
    });
    window.addEventListener('resize', positionPortal);
    window.addEventListener('scroll', positionPortal, true);
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
