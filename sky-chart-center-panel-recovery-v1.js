// Restores the stable comparison wheel and gives the selected relationship a full-width row.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  let queued = false;
  let timer = 0;

  function restoreWheel() {
    document.querySelectorAll('.relphi-wheel-geometry-v2').forEach(function (overlay) { overlay.remove(); });
    document.querySelectorAll('[data-relphi-v2-hidden="true"]').forEach(function (host) {
      host.removeAttribute('data-relphi-v2-hidden');
      host.style.visibility = '';
      host.style.opacity = '';
    });
    document.querySelectorAll('[data-relphi-original-aspect="true"]').forEach(function (line) {
      line.removeAttribute('data-relphi-original-aspect');
      line.style.visibility = '';
    });
  }

  function fullWidthSelectedRelationship() {
    document.querySelectorAll('.relphi-mobile-dual-card-view').forEach(function (host) {
      host.classList.add('relphi-selected-full-row');
      let branch = host;
      let parent = branch.parentElement;
      while (parent && parent.id !== 'relphiSkyWorkspace') {
        if (getComputedStyle(parent).display === 'grid') {
          branch.classList.add('relphi-selected-grid-branch');
          break;
        }
        branch = parent;
        parent = branch.parentElement;
      }
    });
  }

  function run() {
    queued = false;
    restoreWheel();
    fullWidthSelectedRelationship();
  }

  function queue(delay) {
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(run);
    }, delay || 0);
  }

  function installStyles() {
    if (document.getElementById('relphi-center-panel-recovery-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-center-panel-recovery-style';
    style.textContent = `
      .relphi-selected-grid-branch{grid-column:1 / -1!important;width:100%!important;max-width:none!important;min-width:0!important}
      .relphi-selected-full-row{display:block!important;width:100%!important;max-width:none!important;min-width:0!important;height:auto!important;min-height:0!important;overflow:visible!important}
      .relphi-selected-full-row .relphi-progressive-reading,.relphi-selected-full-row .relphi-canonical-relationship-reading{width:100%!important;max-width:none!important;min-width:0!important;white-space:normal!important;overflow-wrap:normal!important;word-break:normal!important;line-height:1.5!important}
      .relphi-selected-full-row p,.relphi-selected-full-row li,.relphi-selected-full-row span{word-break:normal!important;overflow-wrap:normal!important}
    `;
    document.head.appendChild(style);
  }

  function start() {
    installStyles();
    run();
    [80, 220, 500, 900].forEach(function (delay) { setTimeout(run, delay); });
    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-relationship-index],.relationship-row,.relphi-relationship-row,[data-relphi-relationship]')) queue(50);
    }, true);
    window.addEventListener('storage', function () { queue(70); });
    window.addEventListener('relphi:extra-points-updated', function () { queue(70); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
