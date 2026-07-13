// Minimal Static / Dynamic role controls for Sky Chart comparisons.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const STORAGE_KEY = 'relphiSkyChartRoles';
  const HELP = 'Static for a natal or reference chart. Dynamic for a moving transit or event sky.';
  const defaults = { chart: 'dynamic', currentSky: 'static' };
  let roles = loadRoles();

  function loadRoles() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return {
        chart: saved && saved.chart === 'static' ? 'static' : 'dynamic',
        currentSky: saved && saved.currentSky === 'dynamic' ? 'dynamic' : 'static'
      };
    } catch (error) {
      return Object.assign({}, defaults);
    }
  }

  function saveRoles() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(roles)); } catch (error) {}
    window.RelphiSkyRoles = Object.assign({}, roles);
    document.dispatchEvent(new CustomEvent('relphi:skyroleschange', { detail: window.RelphiSkyRoles }));
  }

  function setRole(target, role) {
    roles[target] = role === 'dynamic' ? 'dynamic' : 'static';
    document.querySelectorAll('[data-relphi-role-target="' + target + '"]').forEach(function (control) {
      control.querySelectorAll('button[data-role]').forEach(function (button) {
        const active = button.dataset.role === roles[target];
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    });
    saveRoles();
  }

  function makeControl(target, label) {
    const wrap = document.createElement('div');
    wrap.className = 'sky-role-control';
    wrap.dataset.relphiRoleTarget = target;
    wrap.innerHTML =
      '<span class="sky-role-label">' + label + ' type</span>' +
      '<div class="sky-role-toggle" role="group" aria-label="' + label + ' sky type">' +
        '<button type="button" data-role="static" aria-pressed="false">Static</button>' +
        '<button type="button" data-role="dynamic" aria-pressed="false">Dynamic</button>' +
      '</div>' +
      '<button type="button" class="sky-role-help" title="' + HELP + '" aria-label="' + HELP + '">?</button>';

    wrap.querySelectorAll('button[data-role]').forEach(function (button) {
      button.addEventListener('click', function () { setRole(target, button.dataset.role); });
    });
    return wrap;
  }

  function addStyles() {
    if (document.getElementById('sky-role-control-styles')) return;
    const style = document.createElement('style');
    style.id = 'sky-role-control-styles';
    style.textContent = `
      .sky-role-control{display:flex;align-items:center;gap:.45rem;flex-wrap:wrap;margin:.55rem 0 0;color:#222}
      .sky-role-label{font-size:.82rem;font-weight:800;letter-spacing:.02em}
      .sky-role-toggle{display:inline-flex;padding:2px;border:1px solid rgba(220,31,24,.3);border-radius:999px;background:#fff}
      .sky-role-toggle button{appearance:none;border:0;background:transparent;color:#333;border-radius:999px;padding:.38rem .68rem;font:inherit;font-size:.8rem;font-weight:800;cursor:pointer}
      .sky-role-toggle button.is-active{background:#111;color:#fff}
      .sky-role-help{width:1.55rem;height:1.55rem;padding:0;border:1px solid #999;border-radius:50%;background:#fff;color:#333;font:inherit;font-size:.78rem;font-weight:900;cursor:help}
      @media(max-width:600px){.sky-role-control{justify-content:flex-start}.sky-role-label{flex-basis:100%}}
    `;
    document.head.appendChild(style);
  }

  function install() {
    addStyles();

    const primaryAnchor = document.getElementById('skyWizardPrimaryStatus');
    if (primaryAnchor && !document.querySelector('[data-relphi-role-target="chart"]')) {
      primaryAnchor.insertAdjacentElement('afterend', makeControl('chart', 'First sky'));
    }

    const compareAnchor = document.getElementById('skyWizardCompareStatus');
    if (compareAnchor && !document.querySelector('[data-relphi-role-target="currentSky"]')) {
      compareAnchor.insertAdjacentElement('afterend', makeControl('currentSky', 'Second sky'));
    }

    setRole('chart', roles.chart);
    setRole('currentSky', roles.currentSky);
  }

  window.RelphiSkyRoles = Object.assign({}, roles);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
