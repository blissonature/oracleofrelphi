// Reapply the shared Houses selection whenever relationship rows are rebuilt or another filter refreshes them.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyHouseFilterEnforcerV1) return;
  window.__relphiSkyHouseFilterEnforcerV1 = true;

  const HOUSES = Array.from({ length: 12 }, (_, index) => String(index + 1));
  let frame = 0;
  let timer = 0;
  let applying = false;

  function selected(slot) {
    const menuInputs = Array.from(document.querySelectorAll(
      `#skyChartHousePopover [data-house-scope="house"][data-house-choice="${slot.toLowerCase()}"]`
    ));
    if (!menuInputs.length) return new Set(HOUSES);
    return new Set(menuInputs.filter(input => input.checked).map(input => input.dataset.houseTarget));
  }

  function slotsFor(node) {
    const mode = document.documentElement.dataset.skyRelationshipMode || 'A-B';
    return {
      left: node.dataset.leftSky || (mode === 'B-B' ? 'B' : 'A'),
      right: node.dataset.rightSky || (mode === 'A-A' ? 'A' : 'B')
    };
  }

  function visibleByHouse(node, chosen) {
    const leftHouse = String(node.dataset.leftHouse || '');
    const rightHouse = String(node.dataset.rightHouse || '');
    if (!leftHouse || !rightHouse) return true;
    const slots = slotsFor(node);
    return Boolean(chosen[slots.left]?.has(leftHouse) && chosen[slots.right]?.has(rightHouse));
  }

  function updateCount() {
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
    if (count) {
      count.textContent = `${visible}/${rows.length}`;
      count.dataset.total = String(rows.length);
    }
    if (empty) empty.hidden = visible !== 0;
  }

  function apply() {
    frame = 0;
    clearTimeout(timer);
    timer = 0;
    if (applying || !document.querySelector('[data-house-filter="combined"]')) return;
    applying = true;
    const chosen = { A: selected('A'), B: selected('B') };
    const nodes = document.querySelectorAll(
      '.sky-foundation-relationship-row, [data-layer="aspects"] > .sky-foundation-aspect'
    );
    nodes.forEach(node => {
      node.classList.toggle('sky-chart-house-multiselect-hidden', !visibleByHouse(node, chosen));
    });
    document.documentElement.dataset.skyAHouseSelection = `${chosen.A.size}/12`;
    document.documentElement.dataset.skyBHouseSelection = `${chosen.B.size}/12`;
    updateCount();
    applying = false;
  }

  function schedule(delay = 0) {
    if (delay > 0) {
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
    schedule(60);
    setTimeout(apply, 260);
  }

  function start() {
    document.addEventListener('change', event => {
      if (!event.target.closest?.('[data-house-choice]')) return;
      settle();
    });

    [
      'relphi:sky-house-multiselect-changed',
      'relphi:sky-single-sky-aspects-rendered',
      'relphi:sky-placement-multiselect-changed',
      'relphi:sky-foundation-filter-changed',
      'relphi:sky-foundation-ready'
    ].forEach(name => window.addEventListener(name, settle));

    const root = document.getElementById('skyFoundationRoot');
    if (root) {
      new MutationObserver(records => {
        if (applying) return;
        const relevant = records.some(record => {
          if (record.type === 'childList') return record.addedNodes.length || record.removedNodes.length;
          if (record.type === 'attributes') {
            return record.target.matches?.('.sky-foundation-relationship-row,.sky-foundation-aspect');
          }
          return false;
        });
        if (relevant) schedule();
      }).observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'hidden', 'data-left-house', 'data-right-house', 'data-left-sky', 'data-right-sky']
      });
    }

    settle();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
