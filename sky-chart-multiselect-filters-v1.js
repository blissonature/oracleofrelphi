// Categorized placement filters for both skies.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyMultiselectFiltersV2) return;
  window.__relphiSkyMultiselectFiltersV1 = true;
  window.__relphiSkyMultiselectFiltersV2 = true;

  const SLOTS = ['A','B'];
  const GROUPS = Object.freeze([
    { id:'luminaries', label:'Luminaries', members:new Set(['sun','moon']) },
    { id:'planets', label:'Planets', members:new Set(['mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto']) },
    { id:'chart-angles', label:'Chart Angles', members:new Set(['asc','dsc','mc','ic']) },
    { id:'points', label:'Points', members:null }
  ]);
  const ORDER = Object.freeze({
    luminaries:Object.freeze(['sun','moon']),
    planets:Object.freeze(['mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto']),
    'chart-angles':Object.freeze(['asc','dsc','mc','ic']),
    points:Object.freeze(['north-node','south-node','chiron','lilith','part-of-fortune','vertex'])
  });
  const ALIASES = Object.freeze({
    ascendant:'asc','asc.':'asc',rising:'asc',ac:'asc',
    descendant:'dsc','desc.':'dsc',desc:'dsc',dc:'dsc',
    midheaven:'mc','medium coeli':'mc',
    'imum coeli':'ic',imumcoeli:'ic',
    'north node':'north-node','south node':'south-node',
    'part of fortune':'part-of-fortune',fortune:'part-of-fortune'
  });
  const state = {
    A:{ available:new Map(), selected:new Set(), initialized:false, signature:'' },
    B:{ available:new Map(), selected:new Set(), initialized:false, signature:'' }
  };
  let queued = false;
  let portalOwner = null;

  const canonicalId = value => {
    const raw = String(value || '').trim().toLowerCase().replace(/\s+/g,' ');
    return ALIASES[raw] || raw;
  };

  function categoryFor(id) {
    const canonical = canonicalId(id);
    for (const group of GROUPS) {
      if (group.members?.has(canonical)) return group.id;
    }
    return 'points';
  }

  function filterBar() {
    return document.querySelector('#skyFoundationRelationships .sky-chart-filter-bar');
  }
  function control() {
    return document.querySelector('[data-placement-filter="combined"]');
  }
  function popover() {
    return document.getElementById('skyChartPlacementPopover');
  }

  function entriesFor(slot) {
    const panel = document.getElementById(slot === 'A' ? 'skyFoundationA' : 'skyFoundationB');
    const seen = new Set();
    return Array.from(panel?.querySelectorAll('.sky-foundation-row[data-placement]') || []).map(row => {
      const label = String(row.querySelector('.sky-foundation-row-name')?.textContent || row.dataset.placement || '').trim();
      const id = canonicalId(row.dataset.placement || label);
      if (!id || seen.has(id)) return null;
      seen.add(id);
      return { id, label, group:categoryFor(id) };
    }).filter(Boolean);
  }

  function groupIds(slot, groupId) {
    return Array.from(state[slot].available.values()).filter(entry => entry.group === groupId).map(entry => entry.id);
  }

  function listEntries(groupId) {
    const combined = new Map();
    SLOTS.forEach(slot => state[slot].available.forEach(entry => {
      if (entry.group === groupId && !combined.has(entry.id)) combined.set(entry.id,{id:entry.id,label:entry.label});
    }));
    const order = ORDER[groupId] || [];
    const rank = id => {
      const index = order.indexOf(id);
      return index < 0 ? Number.MAX_SAFE_INTEGER : index;
    };
    return Array.from(combined.values()).sort((a,b) => rank(a.id)-rank(b.id) || a.label.localeCompare(b.label));
  }

  function idsFor(scope,target,slot) {
    if (scope === 'all') return Array.from(state[slot].available.keys());
    if (scope === 'group') return groupIds(slot,target);
    if (scope === 'placement' && state[slot].available.has(target)) return [target];
    return [];
  }

  function setSelection(ids,slot,selected) {
    ids.forEach(id => selected ? state[slot].selected.add(id) : state[slot].selected.delete(id));
  }

  function sameSet(left,right) {
    return left.size === right.size && Array.from(left).every(value => right.has(value));
  }

  function slotSummary(slot) {
    const current = state[slot];
    if (!current.selected.size) return 'None';
    if (current.selected.size === current.available.size) return 'All';
    for (const group of GROUPS) {
      const ids = new Set(groupIds(slot,group.id));
      if (ids.size && sameSet(ids,current.selected)) return group.label;
    }
    if (current.selected.size === 1) return current.available.get(Array.from(current.selected)[0])?.label || '1 selected';
    return `${current.selected.size} of ${current.available.size}`;
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

  function choiceControl(scope,target,choice,rowLabel) {
    const label = document.createElement('label');
    label.className = `sky-chart-placement-choice sky-chart-placement-choice-${choice}`;
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.dataset.placementScope = scope;
    input.dataset.placementTarget = target;
    input.dataset.placementChoice = choice;
    input.setAttribute('aria-label',`${rowLabel}: ${choice === 'all' ? 'All skies' : `Sky ${choice.toUpperCase()}`}`);
    if (choice === 'a' || choice === 'b') {
      const slot = choice.toUpperCase();
      input.dataset.slot = slot;
      if (scope === 'group') input.dataset.placementGroupToggle = target;
      if (scope === 'placement') {
        input.dataset.placementOption = target;
        input.value = target;
      }
    }
    const text = document.createElement('span');
    text.textContent = choice === 'all' ? 'All' : choice.toUpperCase();
    label.append(input,text);
    return label;
  }

  function listItem(scope,target,labelText,kind) {
    const item = document.createElement('div');
    item.className = `sky-chart-placement-list-item sky-chart-placement-list-item-${kind}`;
    item.dataset.placementListItem = target;
    item.dataset.placementScope = scope;
    item.dataset.placementTarget = target;
    const label = document.createElement('strong');
    label.className = 'sky-chart-placement-list-label';
    label.textContent = labelText;
    const choices = document.createElement('div');
    choices.className = 'sky-chart-placement-list-choices';
    choices.setAttribute('role','group');
    choices.setAttribute('aria-label',labelText);
    ['all','a','b'].forEach(choice => choices.appendChild(choiceControl(scope,target,choice,labelText)));
    item.append(label,choices);
    return item;
  }

  function updateChoiceState(input) {
    const scope = input.dataset.placementScope;
    const target = input.dataset.placementTarget;
    const choice = input.dataset.placementChoice;
    const slots = choice === 'all' ? SLOTS : [choice.toUpperCase()];
    let available = 0;
    let selected = 0;
    slots.forEach(slot => {
      const ids = idsFor(scope,target,slot);
      available += ids.length;
      selected += ids.filter(id => state[slot].selected.has(id)).length;
    });
    input.checked = available > 0 && selected === available;
    input.indeterminate = selected > 0 && selected < available;
    input.disabled = available === 0;
  }

  function updateControlStates() {
    const owner = control();
    const menu = popover();
    if (!owner || !menu) return;
    owner.querySelectorAll('[data-placement-choice]').forEach(updateChoiceState);
    if (!owner.contains(menu)) menu.querySelectorAll('[data-placement-choice]').forEach(updateChoiceState);
    const status = owner.querySelector('[data-placement-filter-summary]');
    if (status) status.textContent = combinedSummary();
  }

  function renderControl() {
    const body = popover()?.querySelector('.sky-chart-placement-filter-body');
    if (!body) return;
    const list = document.createElement('div');
    list.className = 'sky-chart-placement-list';
    list.dataset.placementList = 'combined';
    list.appendChild(listItem('all','all','All placements','master'));
    GROUPS.forEach(group => {
      list.appendChild(listItem('group',group.id,group.label,'group'));
      listEntries(group.id).forEach(entry => list.appendChild(listItem('placement',entry.id,entry.label,'placement')));
    });
    body.replaceChildren(list);
    updateControlStates();
  }

  function createControl() {
    const root = document.createElement('div');
    root.className = 'sky-chart-placement-filter sky-chart-placement-filter-combined';
    root.dataset.placementFilter = 'combined';
    const head = document.createElement('div');
    head.className = 'sky-chart-placement-filter-head';
    const title = document.createElement('span');
    title.className = 'sky-chart-placement-filter-label';
    title.textContent = 'Placements';
    const choices = document.createElement('div');
    choices.className = 'sky-chart-placement-summary-choices';
    choices.setAttribute('role','group');
    choices.setAttribute('aria-label','All placements');
    ['all','a','b'].forEach(choice => choices.appendChild(choiceControl('all','all',choice,'All placements')));
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'sky-chart-placement-filter-toggle';
    toggle.dataset.placementFilterToggle = 'true';
    toggle.setAttribute('aria-label','Open placement filters');
    toggle.setAttribute('aria-haspopup','dialog');
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-controls','skyChartPlacementPopover');
    toggle.textContent = '⌄';
    const status = document.createElement('span');
    status.className = 'sky-chart-placement-filter-status';
    status.dataset.placementFilterSummary = 'true';
    status.setAttribute('aria-live','polite');
    status.textContent = 'All';
    const menu = document.createElement('div');
    menu.id = 'skyChartPlacementPopover';
    menu.className = 'sky-chart-placement-filter-popover';
    menu.setAttribute('role','dialog');
    menu.setAttribute('aria-label','Placement filters');
    menu.hidden = true;
    menu.innerHTML = '<div class="sky-chart-placement-filter-body"></div>';
    head.append(title,choices,toggle,status);
    root.append(head,menu);
    toggle.addEventListener('click',() => isOpen(root) ? portalClose(root) : portalOpen(root));
    return root;
  }

  function isOpen(owner) {
    return owner?.classList.contains('is-open');
  }

  function positionPortal() {
    const owner = portalOwner;
    const menu = popover();
    const head = owner?.querySelector('.sky-chart-placement-filter-head');
    if (!isOpen(owner) || !menu?.classList.contains('is-portaled') || !head) return;
    const rect = head.getBoundingClientRect();
    const margin = 12;
    const width = Math.min(430,Math.max(300,window.innerWidth-margin*2));
    const left = Math.min(window.innerWidth-width-margin,Math.max(margin,rect.left+rect.width/2-width*.32));
    const roomBelow = window.innerHeight-rect.bottom-margin;
    const roomAbove = rect.top-margin;
    const maxHeight = Math.max(220,Math.min(560,Math.max(roomBelow,roomAbove)));
    const above = roomBelow < 280 && roomAbove > roomBelow;
    const top = above ? Math.max(margin,rect.top-maxHeight-6) : Math.min(window.innerHeight-maxHeight-margin,rect.bottom+6);
    Object.assign(menu.style,{width:`${width}px`,maxHeight:`${maxHeight}px`,left:`${left}px`,top:`${Math.max(margin,top)}px`});
  }

  function portalOpen(owner) {
    const menu = owner.querySelector('.sky-chart-placement-filter-popover') || popover();
    if (!menu) return;
    portalOwner = owner;
    owner.classList.add('is-open');
    menu.hidden = false;
    menu.classList.add('is-portaled');
    document.body.appendChild(menu);
    owner.querySelector('[data-placement-filter-toggle]')?.setAttribute('aria-expanded','true');
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
    owner.querySelector('[data-placement-filter-toggle]')?.setAttribute('aria-expanded','false');
    portalOwner = null;
  }

  function ensureControl() {
    const bar = filterBar();
    if (!bar) return false;
    bar.querySelector('[data-filter="placement"]')?.closest('label')?.remove();
    bar.querySelectorAll('[data-placement-filter-sky]').forEach(node => node.remove());
    let combined = bar.querySelector('[data-placement-filter="combined"]');
    const aspectLabel = bar.querySelector('[data-filter="aspect"]')?.closest('label');
    if (!combined) combined = createControl();
    if (!combined.isConnected) aspectLabel ? aspectLabel.insertAdjacentElement('afterend',combined) : bar.prepend(combined);
    bar.dataset.multiselectPlacementFilters = 'true';
    return true;
  }

  function refreshAvailable(slot) {
    const entries = entriesFor(slot);
    const signature = JSON.stringify(entries.map(entry => [entry.id,entry.label,entry.group]));
    const current = state[slot];
    if (current.signature === signature) return false;
    const previouslyAll = current.initialized && current.selected.size === current.available.size;
    const previous = new Set(current.selected);
    current.available = new Map(entries.map(entry => [entry.id,entry]));
    current.selected = !current.initialized || previouslyAll
      ? new Set(current.available.keys())
      : new Set(Array.from(previous).filter(id => current.available.has(id)));
    current.initialized = true;
    current.signature = signature;
    return true;
  }

  function updateVisibleCount() {
    const rows = Array.from(document.querySelectorAll('.sky-foundation-relationship-row'));
    const visible = rows.filter(row => !row.hidden && !row.classList.contains('sky-chart-filter-hidden') && !row.classList.contains('sky-chart-multiselect-hidden')).length;
    const count = document.getElementById('skyFoundationRelationshipCount');
    const empty = document.getElementById('skyFoundationRelationshipEmpty');
    if (count) count.textContent = `${visible}/${rows.length}`;
    if (empty) empty.hidden = visible !== 0;
  }

  function applyPlacementFilters() {
    const selectedA = state.A.selected;
    const selectedB = state.B.selected;
    document.querySelectorAll('.sky-foundation-relationship-row').forEach(row => {
      const visible = selectedA.has(row.dataset.leftPlacement) && selectedB.has(row.dataset.rightPlacement);
      row.classList.toggle('sky-chart-multiselect-hidden',!visible);
      document.querySelectorAll(`[data-layer="aspects"] [data-relation-index="${row.dataset.relationIndex}"]`).forEach(node => node.classList.toggle('sky-chart-multiselect-hidden',!visible));
    });
    document.documentElement.dataset.skyPlacementMultiselect = 'ready';
    updateVisibleCount();
    window.dispatchEvent(new CustomEvent('relphi:sky-placement-multiselect-changed',{detail:{A:Array.from(selectedA),B:Array.from(selectedB)}}));
  }

  function refresh() {
    queued = false;
    if (!ensureControl()) return;
    const changed = refreshAvailable('A') || refreshAvailable('B');
    const menu = popover();
    if (changed || !menu?.querySelector('[data-placement-list]')) renderControl();
    else updateControlStates();
    applyPlacementFilters();
    positionPortal();
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(refresh);
  }

  function handleChoiceChange(event) {
    const input = event.target.closest('[data-placement-choice]');
    if (!input) return;
    const slots = input.dataset.placementChoice === 'all' ? SLOTS : [input.dataset.placementChoice.toUpperCase()];
    slots.forEach(slot => setSelection(idsFor(input.dataset.placementScope,input.dataset.placementTarget,slot),slot,input.checked));
    updateControlStates();
    applyPlacementFilters();
  }

  function start() {
    const root = document.getElementById('skyFoundationRoot');
    if (root) new MutationObserver(records => {
      if (records.every(record => record.target?.closest?.('.sky-chart-placement-filter'))) return;
      schedule();
    }).observe(root,{childList:true,subtree:true});
    ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-foundation-filter-changed'].forEach(name => window.addEventListener(name,schedule));
    document.addEventListener('change',event => {
      if (event.target.closest('[data-placement-choice]')) handleChoiceChange(event);
      else if (event.target.closest('.sky-chart-filter-bar')) requestAnimationFrame(updateVisibleCount);
    });
    document.addEventListener('pointerdown',event => {
      const menu = popover();
      if (isOpen(portalOwner) && !portalOwner.contains(event.target) && !menu?.contains(event.target)) portalClose(portalOwner);
    },true);
    document.addEventListener('keydown',event => {
      if (event.key === 'Escape' && isOpen(portalOwner)) portalClose(portalOwner);
    });
    window.addEventListener('resize',positionPortal);
    window.addEventListener('scroll',positionPortal,true);
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
