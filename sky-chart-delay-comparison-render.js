// Prevents Add a comparison sky from rendering an empty Sky B before it is named.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  let suppressTargetEvents = false;

  document.addEventListener('click', function (event) {
    const button = event.target.closest && event.target.closest('#relphiAddComparison');
    if (!button) return;

    // The Wizard's own handler still changes its internal active kind and the
    // selector values to Sky B. We suppress only the immediate renderer events.
    suppressTargetEvents = true;
    window.setTimeout(function () {
      suppressTargetEvents = false;
    }, 0);
  }, true);

  function suppressPrematureTargetRender(event) {
    if (!suppressTargetEvents) return;
    const target = event.target;
    if (!target || (target.id !== 'skyCreatorTarget' && target.id !== 'skyCalcTarget')) return;
    event.stopImmediatePropagation();
  }

  document.addEventListener('input', suppressPrematureTargetRender, true);
  document.addEventListener('change', suppressPrematureTargetRender, true);
})();
