// One shared Houses and Angles checklist for Sky A and Sky B.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyHouseAndAngleMultiselectV2) return;
  window.__relphiSkyHouseAndAngleMultiselectV2 = true;

  const SLOTS = ['A', 'B'];
  const HOUSES = Array.from({ length: 12 }, (_, index) => String(index + 1));
  const ANGLES = Object.freeze([
    { id: 'asc', label: 'Asc.' },
    { id: 'dsc', label: 'Desc.' },
    { id: 'mc', label: 'MC' },
    { id: 'ic', label: 'IC' }
  ]);
  const ANGLE_IDS = ANGLES.map(angle => angle.id);
  const TARGETS = [...HOUSES, ...ANGLE_IDS];
  const state = {
    A: new Set(TARGETS),
    B: new Set(TARGETS)
  };
  let queued = false;
  let countTimer = 0;
  let portalOwner = null;
  let applying = false;

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
    if (scope === 'all') return TARGETS;
    if (scope === 'house' && HOUSES.includes(target)) return [target];
    if (scope === 'angle-group') return ANGLE_IDS;
    if (scope === 'angle' && ANGLE_IDS.includes(target)) return [target];
    return [];
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
    const chosen = state[slot];
    if (!chosen.size) return 'None';
    if (chosen.size === TARGETS.length) return 'All';
    if (chosen.size === ANGLE_IDS.length && ANGLE_IDS.every(id => chosen.has(id))) return 'Angles';
    if (chosen.size === 1) {
      const id = Array.from(chosen)[0];
      const angle = ANGLES.find(entry => entry.id === id);
      return angle?.label || `House ${id}`;
    }
    return `${chosen.size} of ${TARGETS.length}`;
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
    const summary = combinedSummary();
    if (status && status.textContent !== summary) status.textContent = summary;
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
    if (scope === 'angle' || scope === 'angle-group') {
      input.dataset.houseAngleScope = scope === 'angle-group' ? 'angles' : 'angle';
      input.dataset.houseAngleTarget = target;
      input.dataset.houseAngleChoice = choice;
    }
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
    if (scope === 'angle' || scope === 'angle-group') item.dataset.houseAngleListItem = target;

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
    list.dataset.angleSupport = 'true';

    const header = document.createElement('div');
    header.className = 'sky-chart-house-list-header';
    header.innerHTML = '<strong>House / angle</strong><span>All</span><span>A</span><span>B</span>';
    list.appendChild(header);
    list.appendChild(listItem('all', 'all', 'All houses + angles', 'master'));
    HOUSES.forEach(house => list.appendChild(listItem('house', house, `House ${house}`, 'house')));
    list.appendChild(listItem('angle-group', 'angles', 'Angles', 'angle-group'));
    ANGLES.forEach(angle => list.appendChild(listItem('angle', angle.id, angle.label, 'angle')));
    body.appendChild(list);
    updateControlStates();
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
    choices.setAttribute('aria-label', 'All houses and angles');
    ['all', 'a', 'b'].forEach(choice => choices.appendChild(choiceControl('all', 'all', choice, 'All houses and angles')));

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'sky-chart-house-filter-toggle';
    toggle.dataset.houseFilterToggle = 'true';
    toggle.setAttribute('aria-label', 'Open house and angle filters');
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
    menu.setAttribute('aria-label', 'House and angle filters');
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

  function normalizeAngle(value) {
    const key = String(value || '').trim().toLowerCase().replace(/[._]/g, ' ').replace(/\s+/g, ' ');
    if (['asc', 'ascendant', 'ac', 'rising'].includes(key)) return 'asc';
    if (['dsc', 'desc', 'descendant', 'dc'].includes(key)) return 'dsc';
    if (['mc', 'midheaven', 'medium coeli'].includes(key)) return 'mc';
    if (['ic', 'imum coeli', 'imumcoeli'].includes(key)) return 'ic';
    return '';
  }

  function endpointKey(node, side) {
    const angle = normalizeAngle(node.dataset[`${side}Placement`]);
    if (angle) return angle;
    const house = String(node.dataset[`${side}House`] || '');
    return HOUSES.includes(house) ? house : '';
  }

  function relationshipSlots(node) {
    const mode = document.documentElement.dataset.skyRelationshipMode || 'A-B';
    return {
      left: node.dataset.leftSky || (mode === 'B-B' ? 'B' : 'A'),
      right: node.dataset.rightSky || (mode === 'A-A' ? 'A' : 'B')
    };
  }

  function isVisible(node) {
    const leftKey = endpointKey(node, 'left');
    const rightKey = endpointKey(node, 'right');
    if (!leftKey || !rightKey) return true;
    const slots = relationshipSlots(node);
    return state[slots.left].has(leftKey) && state[slots.right].has(rightKey);
  }

  function updateVisibleCount() {
    clearTimeout(countTimer);
    countTimer = setTimeout(() => requestAnimationFrame(() => {
      const rows = Array.from(document.querySelectorAll('.sky-foundation-relationship-row'));
      const visible = rows.filter(row =>
        !row.hidden &&
        !row.classList.contains('sky-chart-filter-hidden') &&
        !row.classList.contains('sky-chart-orb-hidden') &&
        !row.classList.contains('sky-orb-filter-hidden') &&
        !row.classList.contains('sky-chart-multiselect-hidden') &&
        !row.classList.contains('sky-chart-house-multiselect-hidden') &&
        !row.classList.contains('sky-foundation-single-sky-cross-hidden')
      ).length;
      const count = document.getElementById('skyFoundationRelationshipCount');
      const empty = document.getElementById('skyFoundationRelationshipEmpty');
      const text = `${visible}/${rows.length}`;
      if (count && count.textContent !== text) {
        count.textContent = text;
        count.dataset.total = String(rows.length);
      }
      if (empty) empty.hidden = visible !== 0;
    }), 0);
  }

  function applyFilters() {
    if (applying || !ensureControl()) return;
    applying = true;
    document.querySelectorAll(
      '.sky-foundation-relationship-row, [data-layer="aspects"] > .sky-foundation-aspect'
    ).forEach(node => {
      const hidden = !isVisible(node);
      if (node.classList.contains('sky-chart-house-multiselect-hidden') !== hidden) {
        node.classList.toggle('sky-chart-house-multiselect-hidden', hidden);
      }
    });
    updateControlStates();
    document.documentElement.dataset.skyHouseMultiselect = 'ready';
    document.documentElement.dataset.skyHouseAngleSupport = 'ready';
    document.documentElement.dataset.skyAHouseSelection = `${state.A.size}/${TARGETS.length}`;
    document.documentElement.dataset.skyBHouseSelection = `${state.B.size}/${TARGETS.length}`;
    updateVisibleCount();
    applying = false;
  }

  function handleChoiceChange(event) {
    const input = event.target.closest?.('[data-house-choice]');
    if (!input) return;
    const ids = idsFor(input.dataset.houseScope, input.dataset.houseTarget);
    const choice = input.dataset.houseChoice;
    const slots = choice === 'all' ? SLOTS : [choice.toUpperCase()];
    slots.forEach(slot => setSelection(ids, slot, input.checked));
    applyFilters();
    window.dispatchEvent(new CustomEvent('relphi:sky-house-multiselect-changed', {
      detail: { A: Array.from(state.A), B: Array.from(state.B) }
    }));
  }

  function refresh() {
    queued = false;
    applyFilters();
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

  function relevantMutation(record) {
    if (record.target?.closest?.('.sky-chart-house-filter,#skyChartHousePopover')) return false;
    if (record.type === 'attributes') {
      return record.target.matches?.('.sky-foundation-relationship-row,.sky-foundation-aspect');
    }
    if (record.type !== 'childList') return false;
    if (record.target.closest?.('#skyFoundationRelationshipList,[data-layer="aspects"]')) return true;
    return Array.from(record.addedNodes).some(node =>
      node.nodeType === 1 && (
        node.matches?.('.sky-foundation-relationship-row,.sky-foundation-aspect') ||
        node.querySelector?.('.sky-foundation-relationship-row,.sky-foundation-aspect')
      )
    );
  }

  function injectAngleStyles() {
    if (document.getElementById('skyChartHouseAngleStylesV2')) return;
    const style = document.createElement('style');
    style.id = 'skyChartHouseAngleStylesV2';
    style.textContent = `
      .sky-chart-house-list-item-angle-group{
        min-height:38px;
        border-top:1px solid rgba(31,27,24,.16);
        border-bottom:1px solid rgba(31,27,24,.12);
        background:#f4efe8;
      }
      .sky-chart-house-list-item-angle-group .sky-chart-house-list-label{font-weight:900}
      .sky-chart-house-list-item-angle .sky-chart-house-list-label{padding-left:18px}
    `;
    document.head.appendChild(style);
  }

  function start() {
    injectAngleStyles();
    document.addEventListener('change', event => {
      if (event.target.closest?.('[data-house-choice]')) handleChoiceChange(event);
      else if (event.target.closest?.('.sky-chart-filter-bar')) setTimeout(applyFilters, 0);
    });

    [
      'relphi:sky-foundation-ready',
      'relphi:sky-foundation-interactions-ready',
      'relphi:sky-foundation-filter-changed',
      'relphi:sky-placement-multiselect-changed',
      'relphi:sky-single-sky-aspects-rendered'
    ].forEach(name => window.addEventListener(name, schedule));

    const root = document.getElementById('skyFoundationRoot');
    if (root) {
      new MutationObserver(records => {
        if (!applying && records.some(relevantMutation)) schedule();
      }).observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [
          'class',
          'hidden',
          'data-left-house',
          'data-right-house',
          'data-left-placement',
          'data-right-placement',
          'data-left-sky',
          'data-right-sky'
        ]
      });
    }

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

  window.RelphiSkyHouseAndAngleMultiselect = Object.freeze({
    apply: applyFilters,
    houses: HOUSES.slice(),
    angles: ANGLES.map(angle => ({ ...angle }))
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
