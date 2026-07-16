// Reliably starts a fresh Sky B workflow without disturbing Sky A.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  function byId(id) { return document.getElementById(id); }
  function fire(element, type) {
    if (element) element.dispatchEvent(new Event(type, { bubbles:true }));
  }

  function setComparisonTarget() {
    ['skyCreatorTarget', 'skyCalcTarget'].forEach(function (id) {
      const select = byId(id);
      if (!select) return;
      select.value = 'currentSky';
      fire(select, 'input');
      fire(select, 'change');
    });
  }

  function showNameStage() {
    ['relphiSkyNameStage','relphiSkyMethodStage','relphiExistingStage','relphiCalculateStage','relphiSkyCompleteStage'].forEach(function (id) {
      const stage = byId(id);
      if (stage) stage.hidden = id !== 'relphiSkyNameStage';
    });
  }

  function beginComparison(event) {
    const button = event.target.closest && event.target.closest('#relphiAddComparison');
    if (!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    setComparisonTarget();

    const eyebrow = byId('relphiSkyNameEyebrow');
    const heading = byId('relphiSkyNameHeading');
    const input = byId('relphiSkyNameInput');
    const error = byId('relphiSkyNameError');
    const methodHeading = byId('relphiSkyMethodHeading');

    if (eyebrow) eyebrow.textContent = 'Comparison sky';
    if (heading) heading.textContent = 'Give the comparison sky an identity';
    if (input) {
      input.value = '';
      input.placeholder = 'Comparison sky name';
    }
    if (error) error.textContent = '';
    if (methodHeading) methodHeading.textContent = 'How will you create this comparison sky?';

    showNameStage();

    requestAnimationFrame(function () {
      byId('relphiSkyNameStage')?.scrollIntoView({ block:'start', behavior:'smooth' });
      input?.focus();
    });
  }

  function install() {
    document.addEventListener('click', beginComparison, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
