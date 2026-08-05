// Multi-select aspect checklist for Sky Chart relationships and wheel lines.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyAspectMultiselectV1) return;
  window.__relphiSkyAspectMultiselectV1 = true;

  const ASPECTS = Object.freeze([
    { id:'conjunction', label:'Conjunction' },
    { id:'semi-sextile', label:'Semi-Sextile' },
    { id:'octile', label:'Octile' },
    { id:'sextile', label:'Sextile' },
    { id:'quintile', label:'Quintile' },
    { id:'square', label:'Square' },
    { id:'trine', label:'Trine' },
    { id:'tri-octile', label:'Tri-Octile' },
    { id:'bi-quintile', label:'Bi-Quintile' },
    { id:'quincunx', label:'Quincunx' },
    { id:'opposition', label:'Opposition' }
  ]);
  const IDS = ASPECTS.map(aspect => aspect.id);
  const LABELS = new Map(ASPECTS.map(aspect => [aspect.id, aspect.label]));
  const selected = new Set(IDS);
  let portalOwner = null;
  let queued = false;
  let countTimer = 0;

  function filterBar() {
    return document.querySelector('#skyFoundationRelationships .sky-chart-filter-bar');
  }

  function control() {
    return document.querySelector('[data-aspect-filter="combined"]');
  }

  function popover() {
    return document.getElementById('skyChartAspectPopover');
  }

  function normalize(value) {
    const key = String(value || '').trim().toLowerCase().replace(/[ _]+/g, '-');
    const aliases = {
      semisextile:'semi-sextile',
      'semi-sextile':'semi-sextile',
      semisquare:'octile',
      'semi-square':'octile',
      sesquisquare:'tri-octile',
      'sesqui-square':'tri-octile',
      sesquiquadrate:'tri-octile',
      biquintile:'bi-quintile',
      inconjunct:'quincunx'
    };
    return aliases[key] || key;
  }

  function summary() {
    if (!selected.size) return 'None';
    if (selected.size === IDS.length) return 'All';
    if (selected.size === 1) return LABELS.get(Array.from(selected)[0]) || '1 selected';
    return `${selected.size} of ${IDS.length}`;
  }

  function checkbox(id, labelText, master = false) {
    const label = document.createElement('label');
    label.className = `sky-chart-aspect-list-item${master ? ' sky-chart-aspect-list-item-master' : ''}`;
    label.dataset.aspectListItem = id;

    const text = document.createElement('span');
    text.className = 'sky-chart-aspect-list-label';
    text.textContent = labelText;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.dataset.aspectChoice = id;
    input.checked = master ? selected.size === IDS.length : selected.has(id);
    input.setAttribute('aria-label', labelText);

    label.append(text, input);
    return label;
  }

  function renderControl() {
    const body = popover()?.querySelector('.sky-chart-aspect-filter-body');
    if (!body) return;
    body.replaceChildren();

    const list = document.createElement('div');
    list.className = 'sky-chart-aspect-list';
    list.dataset.aspectList = 'combined';

    const header = document.createElement('div');
    header.className = 'sky-chart-aspect-list-header';
    header.innerHTML = '<strong>Aspect</strong><span>Show</span>';
    list.appendChild(header);
    list.appendChild(checkbox('all', 'All aspects', true));
    ASPECTS.forEach(aspect => list.appendChild(checkbox(aspect.id, aspect.label)));
    body.appendChild(list);
    updateControlStates();
  }

  function updateControlStates() {
    const owner = control();
    const menu = popover();
    if (!owner || !menu) return;
    const all = menu.querySelector('[data-aspect-choice="all"]');
    if (all) {
      all.checked = selected.size === IDS.length;
      all.indeterminate = selected.size > 0 && selected.size < IDS.length;
    }
    menu.querySelectorAll('[data-aspect-choice]:not([data-aspect-choice="all"])').forEach(input => {
      input.checked = selected.has(input.dataset.aspectChoice);
    });
    const status = owner.querySelector('[data-aspect-filter-summary]');
    if (status) status.textContent = summary();
    owner.dataset.selectionCount = String(selected.size);
  }

  function relationshipVisible(node) {
    const id = normalize(node.dataset.aspect);
    return !id || selected.has(id);
  }

  function updateVisibleCount() {
    clearTimeout(countTimer);
    countTimer = setTimeout(() => requestAnimationFrame(() => {
      const rows = Array.from(document.querySelectorAll('.sky-foundation-relationship-row'));
      const eligible = rows.filter(row => !row.classList.contains('sky-foundation-single-sky-cross-hidden'));
      const visible = eligible.filter(row =>
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
      const next = `${visible}/${eligible.length}`;
      if (count && count.textContent !== next) {
        count.textContent = next;
        count.dataset.total = String(eligible.length);
      }
      if (empty) empty.hidden = visible !== 0;
    }), 0);
  }

  function applyFilters() {
    document.querySelectorAll('.sky-foundation-relationship-row').forEach(row => {
      row.classList.toggle('sky-chart-aspect-multiselect-hidden', !relationshipVisible(row));
    });
    document.querySelectorAll('[data-layer="aspects"] > .sky-foundation-aspect').forEach(line => {
      line.classList.toggle('sky-chart-aspect-multiselect-hidden', !relationshipVisible(line));
    });
    updateControlStates();
    document.documentElement.dataset.skyAspectMultiselect = 'ready';
    document.documentElement.dataset.skyAspectSelection = `${selected.size}/${IDS.length}`;
    updateVisibleCount();
    window.dispatchEvent(new CustomEvent('relphi:sky-aspect-multiselect-changed', {
      detail:{ selected:Array.from(selected) }
    }));
  }

  function handleChange(event) {
    const input = event.target.closest?.('[data-aspect-choice]');
    if (!input) return;
    const id = input.dataset.aspectChoice;
    if (id === 'all') {
      selected.clear();
      if (input.checked) IDS.forEach(aspect => selected.add(aspect));
    } else if (input.checked) selected.add(id);
    else selected.delete(id);
    applyFilters();
  }

  function isOpen(owner) {
    return owner?.classList.contains('is-open');
  }

  function positionPortal() {
    const owner = portalOwner;
    const menu = popover();
    const head = owner?.querySelector('.sky-chart-aspect-filter-head');
    if (!isOpen(owner) || !menu?.classList.contains('is-portaled') || !head) return;
    const rect = head.getBoundingClientRect();
    const margin = 12;
    const width = Math.min(270, Math.max(240, window.innerWidth - margin * 2));
    const left = Math.min(window.innerWidth - width - margin, Math.max(margin, rect.left + rect.width / 2 - width / 2));
    const roomBelow = window.innerHeight - rect.bottom - margin;
    const roomAbove = rect.top - margin;
    const maxHeight = Math.max(220, Math.min(520, Math.max(roomBelow, roomAbove)));
    const placeAbove = roomBelow < 260 && roomAbove > roomBelow;
    const top = placeAbove ? Math.max(margin, rect.top - maxHeight - 6) : Math.min(window.innerHeight - maxHeight - margin, rect.bottom + 6);
    Object.assign(menu.style, {
      width:`${width}px`,
      maxHeight:`${maxHeight}px`,
      left:`${left}px`,
      top:`${Math.max(margin, top)}px`
    });
  }

  function open(owner) {
    const menu = owner.querySelector('.sky-chart-aspect-filter-popover') || popover();
    if (!menu) return;
    portalOwner = owner;
    owner.classList.add('is-open');
    menu.hidden = false;
    menu.classList.add('is-portaled');
    document.body.appendChild(menu);
    owner.querySelector('[data-aspect-filter-toggle]')?.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(positionPortal);
  }

  function close(owner) {
    const menu = popover();
    if (!menu || !owner) return;
    menu.hidden = true;
    menu.classList.remove('is-portaled');
    menu.removeAttribute('style');
    owner.appendChild(menu);
    owner.classList.remove('is-open');
    owner.querySelector('[data-aspect-filter-toggle]')?.setAttribute('aria-expanded', 'false');
    portalOwner = null;
  }

  function createControl() {
    const root = document.createElement('div');
    root.className = 'sky-chart-aspect-filter sky-chart-filter-aspect';
    root.dataset.aspectFilter = 'combined';

    const head = document.createElement('div');
    head.className = 'sky-chart-aspect-filter-head';

    const title = document.createElement('span');
    title.className = 'sky-chart-aspect-filter-label';
    title.textContent = 'Aspects';

    const value = document.createElement('button');
    value.type = 'button';
    value.className = 'sky-chart-aspect-filter-value';
    value.dataset.aspectFilterValue = 'true';
    value.setAttribute('aria-label', 'Open aspect filters');
    value.setAttribute('aria-haspopup', 'dialog');
    value.setAttribute('aria-expanded', 'false');
    value.setAttribute('aria-controls', 'skyChartAspectPopover');
    const status = document.createElement('span');
    status.dataset.aspectFilterSummary = 'true';
    status.textContent = 'All';
    value.appendChild(status);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'sky-chart-aspect-filter-toggle';
    toggle.dataset.aspectFilterToggle = 'true';
    toggle.setAttribute('aria-label', 'Open aspect filters');
    toggle.setAttribute('aria-haspopup', 'dialog');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'skyChartAspectPopover');
    toggle.textContent = '⌄';

    const menu = document.createElement('div');
    menu.id = 'skyChartAspectPopover';
    menu.className = 'sky-chart-aspect-filter-popover';
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-label', 'Aspect filters');
    menu.hidden = true;
    menu.innerHTML = '<div class="sky-chart-aspect-filter-body"></div>';

    head.append(title, value, toggle);
    root.append(head, menu);
    const toggleMenu = () => isOpen(root) ? close(root) : open(root);
    value.addEventListener('click', toggleMenu);
    toggle.addEventListener('click', toggleMenu);
    return root;
  }

  function ensureControl() {
    const bar = filterBar();
    if (!bar) return false;
    bar.querySelector('[data-filter="aspect"]')?.closest('label')?.remove();
    let owner = bar.querySelector('[data-aspect-filter="combined"]');
    if (!owner) owner = createControl();
    if (!owner.isConnected) {
      const orb = bar.querySelector('[data-filter="orb"]')?.closest('label');
      const placements = bar.querySelector('[data-placement-filter="combined"]');
      if (orb) orb.insertAdjacentElement('afterend', owner);
      else if (placements) placements.insertAdjacentElement('beforebegin', owner);
      else bar.prepend(owner);
    }
    bar.dataset.multiselectAspectFilters = 'true';
    if (!popover()?.querySelector('[data-aspect-list]')) renderControl();
    return true;
  }

  function refresh() {
    queued = false;
    if (!ensureControl()) return;
    applyFilters();
    positionPortal();
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(refresh);
  }

  function closeOutside(event) {
    const owner = portalOwner;
    const menu = popover();
    if (!isOpen(owner)) return;
    if (owner.contains(event.target) || menu?.contains(event.target)) return;
    close(owner);
  }

  function start() {
    const root = document.getElementById('skyFoundationRoot');
    if (root) new MutationObserver(records => {
      if (records.every(record => record.target?.closest?.('.sky-chart-aspect-filter'))) return;
      schedule();
    }).observe(root, { childList:true, subtree:true });

    [
      'relphi:sky-foundation-ready',
      'relphi:sky-foundation-interactions-ready',
      'relphi:sky-foundation-filter-changed',
      'relphi:sky-placement-multiselect-changed',
      'relphi:sky-house-multiselect-changed',
      'relphi:sky-single-sky-aspects-rendered'
    ].forEach(name => window.addEventListener(name, schedule));

    document.addEventListener('change', handleChange);
    document.addEventListener('pointerdown', closeOutside, true);
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !isOpen(portalOwner)) return;
      const owner = portalOwner;
      close(owner);
      owner.querySelector('[data-aspect-filter-toggle]')?.focus();
    });
    window.addEventListener('resize', positionPortal);
    window.addEventListener('scroll', positionPortal, true);
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
