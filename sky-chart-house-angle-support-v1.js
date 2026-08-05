// Extend the shared Houses matrix with Asc., Desc., MC, and IC as independently filterable endpoints.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyHouseAngleSupportV1) return;
  window.__relphiSkyHouseAngleSupportV1 = true;

  const SLOTS = ['A', 'B'];
  const HOUSES = Array.from({ length: 12 }, (_, index) => String(index + 1));
  const ANGLES = Object.freeze([
    { id: 'asc', label: 'Asc.' },
    { id: 'dsc', label: 'Desc.' },
    { id: 'mc', label: 'MC' },
    { id: 'ic', label: 'IC' }
  ]);
  const ANGLE_IDS = ANGLES.map(angle => angle.id);
  const TOTAL = HOUSES.length + ANGLE_IDS.length;
  const state = {
    A: new Set(ANGLE_IDS),
    B: new Set(ANGLE_IDS)
  };
  let frame = 0;
  let timer = 0;
  let applying = false;

  function owner() {
    return document.querySelector('[data-house-filter="combined"]');
  }

  function menu() {
    return document.getElementById('skyChartHousePopover');
  }

  function list() {
    return menu()?.querySelector('[data-house-list="combined"]');
  }

  function injectStyle() {
    if (document.getElementById('skyChartHouseAngleSupportStyle')) return;
    const style = document.createElement('style');
    style.id = 'skyChartHouseAngleSupportStyle';
    style.textContent = `
      .sky-chart-house-list-item-angle-group{
        min-height:38px;
        border-top:1px solid rgba(31,27,24,.16);
        border-bottom:1px solid rgba(31,27,24,.12);
        background:#f4efe8;
      }
      .sky-chart-house-list-item-angle-group .sky-chart-house-list-label{
        font-weight:900;
      }
      .sky-chart-house-list-item-angle .sky-chart-house-list-label{
        padding-left:18px;
      }
    `;
    document.head.appendChild(style);
  }

  function choiceControl(scope, target, choice, rowLabel) {
    const label = document.createElement('label');
    label.className = `sky-chart-house-choice sky-chart-house-choice-${choice}`;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.dataset.houseAngleScope = scope;
    input.dataset.houseAngleTarget = target;
    input.dataset.houseAngleChoice = choice;
    input.setAttribute('aria-label', `${rowLabel}: ${choice === 'all' ? 'All skies' : `Sky ${choice.toUpperCase()}`}`);

    const text = document.createElement('span');
    text.textContent = choice === 'all' ? 'All' : choice.toUpperCase();
    label.append(input, text);
    return label;
  }

  function listItem(scope, target, labelText, kind) {
    const item = document.createElement('div');
    item.className = `sky-chart-house-list-item sky-chart-house-list-item-${kind}`;
    item.dataset.houseAngleListItem = target;

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

  function ensureAngleRows() {
    const matrix = list();
    if (!matrix) return false;
    if (matrix.dataset.angleSupport !== 'true') matrix.dataset.angleSupport = 'true';
    const header = matrix.querySelector('.sky-chart-house-list-header strong');
    if (header && header.textContent !== 'House / angle') header.textContent = 'House / angle';
    const masterLabel = matrix.querySelector('.sky-chart-house-list-item-master .sky-chart-house-list-label');
    if (masterLabel && masterLabel.textContent !== 'All houses + angles') masterLabel.textContent = 'All houses + angles';
    const group = matrix.querySelector('.sky-chart-house-list-item-angle-group');
    const angleRows = Array.from(matrix.querySelectorAll('.sky-chart-house-list-item-angle'));
    const complete = group && angleRows.length === ANGLES.length && angleRows.every((row, index) =>
      row.dataset.houseAngleListItem === ANGLES[index].id &&
      row.querySelector('.sky-chart-house-list-label')?.textContent === ANGLES[index].label
    );
    if (!complete) {
      group?.remove();
      angleRows.forEach(node => node.remove());
      matrix.appendChild(listItem('angles', 'angles', 'Angles', 'angle-group'));
      ANGLES.forEach(angle => matrix.appendChild(listItem('angle', angle.id, angle.label, 'angle')));
    }

    const root = owner();
    const summary = root?.querySelector('.sky-chart-house-summary-choices');
    if (summary?.getAttribute('aria-label') !== 'All houses and angles') summary?.setAttribute('aria-label', 'All houses and angles');
    const toggle = root?.querySelector('[data-house-filter-toggle]');
    if (toggle?.getAttribute('aria-label') !== 'Open house and angle filters') toggle?.setAttribute('aria-label', 'Open house and angle filters');
    const popover = menu();
    if (popover?.getAttribute('aria-label') !== 'House and angle filters') popover?.setAttribute('aria-label', 'House and angle filters');
    return true;
  }

  function setAngles(ids, slot, selected) {
    ids.forEach(id => {
      if (selected) state[slot].add(id);
      else state[slot].delete(id);
    });
  }

  function angleIds(scope, target) {
    if (scope === 'angles') return ANGLE_IDS;
    if (scope === 'angle' && ANGLE_IDS.includes(target)) return [target];
    return [];
  }

  function selectedHouses(slot) {
    const inputs = Array.from(document.querySelectorAll(
      `#skyChartHousePopover [data-house-scope="house"][data-house-choice="${slot.toLowerCase()}"]`
    ));
    if (!inputs.length) return new Set(HOUSES);
    return new Set(inputs.filter(input => input.checked).map(input => input.dataset.houseTarget));
  }

  function selectedTargets(slot) {
    return new Set([...selectedHouses(slot), ...state[slot]]);
  }

  function updateAngleInput(input) {
    const ids = angleIds(input.dataset.houseAngleScope, input.dataset.houseAngleTarget);
    const choice = input.dataset.houseAngleChoice;
    const slots = choice === 'all' ? SLOTS : [choice.toUpperCase()];
    let available = 0;
    let selected = 0;
    slots.forEach(slot => {
      available += ids.length;
      selected += ids.filter(id => state[slot].has(id)).length;
    });
    input.checked = available > 0 && selected === available;
    input.indeterminate = selected > 0 && selected < available;
  }

  function updateCombinedInput(input) {
    const choice = input.dataset.houseChoice;
    if (input.dataset.houseScope !== 'all' || !['all', 'a', 'b'].includes(choice)) return;
    const slots = choice === 'all' ? SLOTS : [choice.toUpperCase()];
    let selected = 0;
    slots.forEach(slot => selected += selectedTargets(slot).size);
    const available = TOTAL * slots.length;
    input.checked = selected === available;
    input.indeterminate = selected > 0 && selected < available;
  }

  function summaryFor(slot) {
    const selected = selectedTargets(slot);
    if (!selected.size) return 'None';
    if (selected.size === TOTAL) return 'All';
    if (selected.size === 1) {
      const id = Array.from(selected)[0];
      const angle = ANGLES.find(entry => entry.id === id);
      return angle?.label || `House ${id}`;
    }
    if (selected.size === ANGLE_IDS.length && ANGLE_IDS.every(id => selected.has(id))) return 'Angles';
    return `${selected.size} of ${TOTAL}`;
  }

  function updateControls() {
    document.querySelectorAll('[data-house-angle-choice]').forEach(updateAngleInput);
    document.querySelectorAll('[data-house-scope="all"][data-house-choice]').forEach(updateCombinedInput);
    const status = owner()?.querySelector('[data-house-filter-summary]');
    if (status) {
      const a = summaryFor('A');
      const b = summaryFor('B');
      status.textContent = a === 'All' && b === 'All' ? 'All' : a === 'None' && b === 'None' ? 'None' : `A: ${a} · B: ${b}`;
    }
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

  function slotsFor(node) {
    const mode = document.documentElement.dataset.skyRelationshipMode || 'A-B';
    return {
      left: node.dataset.leftSky || (mode === 'B-B' ? 'B' : 'A'),
      right: node.dataset.rightSky || (mode === 'A-A' ? 'A' : 'B')
    };
  }

  function visible(node, selected) {
    const leftKey = endpointKey(node, 'left');
    const rightKey = endpointKey(node, 'right');
    if (!leftKey || !rightKey) return true;
    const slots = slotsFor(node);
    return selected[slots.left].has(leftKey) && selected[slots.right].has(rightKey);
  }

  function updateCount() {
    const rows = Array.from(document.querySelectorAll('.sky-foundation-relationship-row'));
    const shown = rows.filter(row =>
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
    const text = `${shown}/${rows.length}`;
    if (count && count.textContent !== text) {
      count.textContent = text;
      count.dataset.total = String(rows.length);
    }
    if (empty) empty.hidden = shown !== 0;
  }

  function apply() {
    frame = 0;
    clearTimeout(timer);
    timer = 0;
    if (applying || !ensureAngleRows()) return;
    applying = true;
    const selected = { A: selectedTargets('A'), B: selectedTargets('B') };
    document.querySelectorAll(
      '.sky-foundation-relationship-row, [data-layer="aspects"] > .sky-foundation-aspect'
    ).forEach(node => {
      const hide = !visible(node, selected);
      if (node.classList.contains('sky-chart-house-multiselect-hidden') !== hide) {
        node.classList.toggle('sky-chart-house-multiselect-hidden', hide);
      }
    });
    updateControls();
    document.documentElement.dataset.skyHouseAngleSupport = 'ready';
    document.documentElement.dataset.skyAHouseSelection = `${selected.A.size}/${TOTAL}`;
    document.documentElement.dataset.skyBHouseSelection = `${selected.B.size}/${TOTAL}`;
    updateCount();
    applying = false;
  }

  function schedule(delay = 0) {
    if (delay) {
      clearTimeout(timer);
      timer = setTimeout(apply, delay);
      return;
    }
    if (frame) return;
    frame = requestAnimationFrame(apply);
  }

  function settle() {
    apply();
    schedule();
    schedule(80);
    setTimeout(apply, 360);
  }

  function handleChange(event) {
    const angleInput = event.target.closest?.('[data-house-angle-choice]');
    if (angleInput) {
      const ids = angleIds(angleInput.dataset.houseAngleScope, angleInput.dataset.houseAngleTarget);
      const choice = angleInput.dataset.houseAngleChoice;
      const slots = choice === 'all' ? SLOTS : [choice.toUpperCase()];
      slots.forEach(slot => setAngles(ids, slot, angleInput.checked));
      settle();
      window.dispatchEvent(new CustomEvent('relphi:sky-house-angle-support-changed', {
        detail: { A: Array.from(state.A), B: Array.from(state.B) }
      }));
      return;
    }

    const houseInput = event.target.closest?.('[data-house-choice]');
    if (!houseInput) return;
    if (houseInput.dataset.houseScope === 'all') {
      const choice = houseInput.dataset.houseChoice;
      const slots = choice === 'all' ? SLOTS : [choice.toUpperCase()];
      slots.forEach(slot => setAngles(ANGLE_IDS, slot, houseInput.checked));
    }
    settle();
  }

  function relevantMutation(record) {
    if (record.type === 'attributes') {
      return record.target.matches?.('.sky-foundation-relationship-row,.sky-foundation-aspect');
    }
    if (record.type !== 'childList') return false;
    if (record.target.closest?.('#skyChartHousePopover,#skyFoundationRelationshipList,[data-layer="aspects"]')) return true;
    return Array.from(record.addedNodes).some(node =>
      node.nodeType === 1 && (
        node.matches?.('[data-house-list="combined"],.sky-foundation-relationship-row,.sky-foundation-aspect') ||
        node.querySelector?.('[data-house-list="combined"],.sky-foundation-relationship-row,.sky-foundation-aspect')
      )
    );
  }

  function start() {
    injectStyle();
    document.addEventListener('change', handleChange);
    [
      'relphi:sky-foundation-ready',
      'relphi:sky-foundation-filter-changed',
      'relphi:sky-house-multiselect-changed',
      'relphi:sky-placement-multiselect-changed',
      'relphi:sky-single-sky-aspects-rendered'
    ].forEach(name => window.addEventListener(name, settle));

    new MutationObserver(records => {
      if (!applying && records.some(relevantMutation)) schedule();
    }).observe(document.documentElement, {
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
    settle();
  }

  window.RelphiSkyHouseAngleSupport = Object.freeze({
    apply,
    angles: ANGLES.map(angle => ({ ...angle }))
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
