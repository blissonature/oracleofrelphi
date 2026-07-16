// Restore the progressive Sky Wizard: naming first, then one decision at a time.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  function install() {
    if (document.getElementById('relphi-progressive-wizard-fix')) return;
    const style = document.createElement('style');
    style.id = 'relphi-progressive-wizard-fix';
    style.textContent = `
      body.sky-chart-page .sky-wizard-shell-frictionless,
      body.sky-chart-page .sky-wizard-shell:not([data-relphi-wizard-v2]) {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once:true });
  } else {
    install();
  }
})();
