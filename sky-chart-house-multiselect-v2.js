// Shared Houses checklist for Sky A and Sky B; chart angles remain placement-only filters.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyHouseMultiselectV2) return;
  window.__relphiSkyHouseMultiselectV2 = true;

  const SLOTS = ['A','B'];
  const HOUSES = Array.from({ length:12 }, (_, index) => String(index + 1));
  const state = { A:new Set(HOUSES), B:new Set(HOUSES) };
  let queued = false;
  let portalOwner = null;
  let countTimer = 0;
  let announcedSelection = '';

  const angleId = value => {
    const key = String(value || '').trim().toLowerCase().replace(/[._-]+/g, ' ').replace(/\s+/g, ' ');
    if (['asc','ascendant','ac','rising'].includes(key)) return 'asc';
    if (['dsc','desc','descendant','dc'].includes(key)) return 'dsc';
    if (['mc','midheaven','medium coeli'].includes(key)) return 'mc';
    if (['ic','imum coeli','imumcoeli'].includes(key)) return 'ic';
    return '';
  };

  function filterBar() { return document.querySelector('#skyFoundationRelationships .sky-chart-filter-bar'); }
  function control() { return document.querySelector('[data-house-filter="combined"]'); }
  function popover() { return document.getElementById('skyChartHousePopover'); }
  function idsFor(scope, target) { return scope === 'all' ? HOUSES : HOUSES.includes(target) ? [target] : []; }
  function setSelection(ids, slot, checked) { ids.forEach(id => checked ? state[slot].add(id) : state[slot].delete(id)); }

  function summary(slot) {
    const count = state[slot].size;
    if (!count) return 'None';
    if (count === HOUSES.length) return 'All';
    if (count === 1) return `House ${Array.from(state[slot])[0]}`;
    return `${count} of ${HOUSES.length}`;
  }

  function combinedSummary() {
    const a = summary('A');
    const b = summary('B');
    if (a === 'All' && b === 'All') return 'All';
    if (a === 'None' && b === 'None') return 'None';
    return `A: ${a} · B: ${b}`;
  }

  function updateChoice(input) {
    const ids = idsFor(input.dataset.houseScope, input.dataset.houseTarget);
    const slots = input.dataset.houseChoice === 'all' ? SLOTS : [input.dataset.houseChoice.toUpperCase()];
    const available = ids.length * slots.length;
    const selected = slots.reduce((sum, slot) => sum + ids.filter(id => state[slot].has(id)).length, 0);
    input.checked = available > 0 && selected === available;
    input.indeterminate = selected > 0 && selected < available;
  }

  function updateControl() {
    const owner = control();
    const menu = popover();
    if (!owner || !menu) return;
    owner.querySelectorAll('[data-house-choice]').forEach(updateChoice);
    if (!owner.contains(menu)) menu.querySelectorAll('[data-house-choice]').forEach(updateChoice);
    const status = owner.querySelector('[data-house-filter-summary]');
    if (status) status.textContent = combinedSummary();
  }

  function choice(scope, target, kind, rowLabel) {
    const label = document.createElement('label');
    label.className = `sky-chart-house-choice sky-chart-house-choice-${kind}`;
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.dataset.houseScope = scope;
    input.dataset.houseTarget = target;
    input.dataset.houseChoice = kind;
    input.setAttribute('aria-label', `${rowLabel}: ${kind === 'all' ? 'All skies' : `Sky ${kind.toUpperCase()}`}`);
    const text = document.createElement('span');
    text.textContent = kind === 'all' ? 'All' : kind.toUpperCase();
    label.append(input, text);
    return label;
  }

  function row(scope, target, labelText, kind) {
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
    ['all','a','b'].forEach(kindName => choices.appendChild(choice(scope, target, kindName, labelText)));
    item.append(label, choices);
    return item;
  }

  function renderList() {
    const body = popover()?.querySelector('.sky-chart-house-filter-body');
    if (!body) return;
    body.replaceChildren();
    const list = document.createElement('div');
    list.className = 'sky-chart-house-list';
    list.dataset.houseList = 'combined';
    const header = document.createElement('div');
    header.className = 'sky-chart-house-list-header';
    header.innerHTML = '<strong>House</strong><span>All</span><span>A</span><span>B</span>';
    list.append(header, row('all','all','All houses','master'));
    HOUSES.forEach(house => list.appendChild(row('house', house, `House ${house}`, 'house')));
    body.appendChild(list);
    updateControl();
  }

  function relationshipSlots(node) {
    const mode = document.documentElement.dataset.skyRelationshipMode || 'A-B';
    return {
      left:node.dataset.leftSky || (mode === 'B-B' ? 'B' : 'A'),
      right:node.dataset.rightSky || (mode === 'A-A' ? 'A' : 'B')
    };
  }

  function endpointVisible(node, side, slot) {
    if (angleId(node.dataset[`${side}Placement`])) return true;
    const house = String(node.dataset[`${side}House`] || '');
    return !house || state[slot].has(house);
  }

  function visible(node) {
    const slots = relationshipSlots(node);
    return endpointVisible(node, 'left', slots.left) && endpointVisible(node, 'right', slots.right);
  }

  function updateCount() {
    clearTimeout(countTimer);
    countTimer = setTimeout(() => requestAnimationFrame(() => {
      const rows = Array.from(document.querySelectorAll('.sky-foundation-relationship-row'))
        .filter(row => !row.classList.contains('sky-foundation-single-sky-cross-hidden'));
      const shown = rows.filter(row =>
        !row.hidden &&
        !row.classList.contains('sky-chart-filter-hidden') &&
        !row.classList.contains('sky-chart-orb-hidden') &&
        !row.classList.contains('sky-orb-filter-hidden') &&
        !row.classList.contains('sky-chart-multiselect-hidden') &&
        !row.classList.contains('sky-chart-house-multiselect-hidden') &&
        !row.classList.contains('sky-chart-aspect-multiselect-hidden')
      ).length;
      const count = document.getElementById('skyFoundationRelationshipCount');
      const empty = document.getElementById('skyFoundationRelationshipEmpty');
      if (count) count.textContent = `${shown}/${rows.length}`;
      if (empty) empty.hidden = shown !== 0;
    }), 0);
  }

  function apply() {
    document.querySelectorAll('.sky-foundation-relationship-row, [data-layer="aspects"] > .sky-foundation-aspect').forEach(node => {
      node.classList.toggle('sky-chart-house-multiselect-hidden', !visible(node));
    });
    updateControl();
    document.documentElement.dataset.skyHouseMultiselect = 'ready';
    document.documentElement.dataset.skyAHouseSelection = `${state.A.size}/${HOUSES.length}`;
    document.documentElement.dataset.skyBHouseSelection = `${state.B.size}/${HOUSES.length}`;
    updateCount();
    const detail = { A:Array.from(state.A), B:Array.from(state.B) };
    const signature = `${detail.A.join(',')}|${detail.B.join(',')}`;
    if (signature !== announcedSelection) {
      announcedSelection = signature;
      window.dispatchEvent(new CustomEvent('relphi:sky-house-multiselect-changed', { detail }));
    }
  }

  function handleChange(event) {
    const input = event.target.closest?.('[data-house-choice]');
    if (!input) return;
    const slots = input.dataset.houseChoice === 'all' ? SLOTS : [input.dataset.houseChoice.toUpperCase()];
    const ids = idsFor(input.dataset.houseScope, input.dataset.houseTarget);
    slots.forEach(slot => setSelection(ids, slot, input.checked));
    apply();
  }

  function isOpen(owner) { return owner?.classList.contains('is-open'); }
  function position() {
    const owner = portalOwner;
    const menu = popover();
    const head = owner?.querySelector('.sky-chart-house-filter-head');
    if (!isOpen(owner) || !menu?.classList.contains('is-portaled') || !head) return;
    const rect = head.getBoundingClientRect();
    const margin = 12;
    const width = Math.min(330, Math.max(280, window.innerWidth - margin * 2));
    const left = Math.min(window.innerWidth - width - margin, Math.max(margin, rect.left + rect.width / 2 - width / 2));
    const below = window.innerHeight - rect.bottom - margin;
    const above = rect.top - margin;
    const maxHeight = Math.max(220, Math.min(560, Math.max(below, above)));
    const top = below < 280 && above > below ? Math.max(margin, rect.top - maxHeight - 6) : Math.min(window.innerHeight - maxHeight - margin, rect.bottom + 6);
    Object.assign(menu.style, { width:`${width}px`, maxHeight:`${maxHeight}px`, left:`${left}px`, top:`${Math.max(margin, top)}px` });
  }

  function open(owner) {
    const menu = owner.querySelector('.sky-chart-house-filter-popover') || popover();
    if (!menu) return;
    portalOwner = owner;
    owner.classList.add('is-open');
    menu.hidden = false;
    menu.classList.add('is-portaled');
    document.body.appendChild(menu);
    owner.querySelector('[data-house-filter-toggle]')?.setAttribute('aria-expanded','true');
    requestAnimationFrame(position);
  }

  function close(owner) {
    const menu = popover();
    if (!menu || !owner) return;
    menu.hidden = true;
    menu.classList.remove('is-portaled');
    menu.removeAttribute('style');
    owner.appendChild(menu);
    owner.classList.remove('is-open');
    owner.querySelector('[data-house-filter-toggle]')?.setAttribute('aria-expanded','false');
    portalOwner = null;
  }

  function createControl() {
    const root = document.createElement('div');
    root.className = 'sky-chart-house-filter sky-chart-house-filter-combined';
    root.dataset.houseFilter = 'combined';
    root.innerHTML = '<div class="sky-chart-house-filter-head"><span class="sky-chart-house-filter-label">Houses</span><div class="sky-chart-house-summary-choices" role="group" aria-label="All houses"></div><button type="button" class="sky-chart-house-filter-toggle" data-house-filter-toggle aria-label="Open house filters" aria-haspopup="dialog" aria-expanded="false" aria-controls="skyChartHousePopover">⌄</button><span class="sky-chart-house-filter-status" data-house-filter-summary aria-live="polite">All</span></div><div id="skyChartHousePopover" class="sky-chart-house-filter-popover" role="dialog" aria-label="House filters" hidden><div class="sky-chart-house-filter-body"></div></div>';
    const choices = root.querySelector('.sky-chart-house-summary-choices');
    ['all','a','b'].forEach(kind => choices.appendChild(choice('all','all',kind,'All houses')));
    root.querySelector('[data-house-filter-toggle]').addEventListener('click', () => isOpen(root) ? close(root) : open(root));
    return root;
  }

  function ensure() {
    const bar = filterBar();
    if (!bar) return false;
    bar.querySelector('[data-filter="houseA"]')?.closest('label')?.remove();
    bar.querySelector('[data-filter="houseB"]')?.closest('label')?.remove();
    let owner = bar.querySelector('[data-house-filter="combined"]');
    if (!owner) owner = createControl();
    if (!owner.isConnected) {
      const placements = bar.querySelector('[data-placement-filter="combined"]');
      const system = bar.querySelector('[data-house-system-filter]')?.closest('label');
      if (placements) placements.insertAdjacentElement('afterend', owner);
      else if (system) system.insertAdjacentElement('beforebegin', owner);
      else bar.appendChild(owner);
    }
    bar.dataset.multiselectHouseFilters = 'true';
    if (!popover()?.querySelector('[data-house-list]')) renderList();
    return true;
  }

  function refresh() {
    queued = false;
    if (!ensure()) return;
    apply();
    position();
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(refresh); } }

  function start() {
    const root = document.getElementById('skyFoundationRoot');
    if (root) new MutationObserver(records => {
      if (records.every(record => record.target?.closest?.('.sky-chart-house-filter'))) return;
      schedule();
    }).observe(root, { childList:true, subtree:true });
    ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-foundation-filter-changed','relphi:sky-placement-multiselect-changed','relphi:sky-aspect-multiselect-changed','relphi:sky-single-sky-aspects-rendered'].forEach(name => window.addEventListener(name, schedule));
    document.addEventListener('change', handleChange);
    document.addEventListener('pointerdown', event => {
      if (!isOpen(portalOwner)) return;
      if (portalOwner.contains(event.target) || popover()?.contains(event.target)) return;
      close(portalOwner);
    }, true);
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !isOpen(portalOwner)) return;
      const owner = portalOwner;
      close(owner);
      owner.querySelector('[data-house-filter-toggle]')?.focus();
    });
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
