// Keep single-sky relationship rows visible after the cross-sky placement filter refreshes.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkySingleSkyPresentationV1) return;
  window.__relphiSkySingleSkyPresentationV1 = true;

  let queued = false;

  function isSingleSkyMode() {
    return /^(A-A|B-B)$/.test(document.documentElement.dataset.skyRelationshipMode || '');
  }

  function hiddenByOtherFilters(row) {
    return row.classList.contains('sky-chart-filter-hidden') ||
      row.classList.contains('sky-chart-orb-hidden') ||
      row.classList.contains('sky-orb-filter-hidden');
  }

  function repair() {
    queued = false;
    if (!isSingleSkyMode()) return;

    const rows = Array.from(document.querySelectorAll('.sky-foundation-single-sky-row'));
    document.querySelectorAll('.sky-foundation-single-sky-aspect').forEach(line => {
      line.classList.remove('sky-chart-multiselect-hidden');
    });
    rows.forEach(row => {
      row.classList.remove('sky-chart-multiselect-hidden');
      row.hidden = false;
      row.setAttribute('aria-hidden', hiddenByOtherFilters(row) ? 'true' : 'false');
    });

    const visible = rows.filter(row => !hiddenByOtherFilters(row)).length;
    const count = document.getElementById('skyFoundationRelationshipCount');
    const empty = document.getElementById('skyFoundationRelationshipEmpty');
    const next = `${visible}/${rows.length}`;
    if (count && count.textContent !== next) {
      count.textContent = next;
      count.dataset.total = String(rows.length);
    }
    if (empty) empty.hidden = visible !== 0;
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(repair);
  }

  function start() {
    const root = document.getElementById('skyFoundationRoot');
    if (root) {
      new MutationObserver(schedule).observe(root, {
        childList:true,
        subtree:true,
        attributes:true,
        attributeFilter:['class','hidden']
      });
    }
    [
      'relphi:sky-single-sky-aspects-rendered',
      'relphi:sky-placement-multiselect-changed',
      'relphi:sky-foundation-filter-changed'
    ].forEach(name => window.addEventListener(name, schedule));
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
