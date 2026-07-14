// Shared Static / Dynamic role contract for transit comparisons.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const STORAGE_KEY = 'relphiSkyChartRoles';
  const targets = ['chart', 'currentSky'];
  let roles = load();

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {};
      return { chart:saved.chart === 'dynamic' ? 'dynamic' : 'static', currentSky:saved.currentSky === 'static' ? 'static' : 'dynamic' };
    } catch (error) { return { chart:'static', currentSky:'dynamic' }; }
  }
  function mode() {
    return document.querySelector('[data-sky-chart-mode="transit"][aria-pressed="true"]') ? 'transit' : 'other';
  }
  function validity() {
    const values = targets.map(target => roles[target]);
    return values.filter(value => value === 'static').length === 1 && values.filter(value => value === 'dynamic').length === 1;
  }
  function contract() {
    return {
      chart:roles.chart,
      currentSky:roles.currentSky,
      valid:validity(),
      staticTarget:targets.find(target => roles[target] === 'static') || null,
      dynamicTarget:targets.find(target => roles[target] === 'dynamic') || null
    };
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(roles)); } catch (error) {}
    window.RelphiSkyRoles = contract();
    document.dispatchEvent(new CustomEvent('relphi:skyroleschange', { detail:window.RelphiSkyRoles }));
  }
  function syncCore(target) {
    const targetSelect = document.getElementById('skyCreatorTarget');
    const roleSelect = document.getElementById('skyMotionMode');
    if (!targetSelect || !roleSelect) return;
    const previous = targetSelect.value;
    targetSelect.value = target;
    targetSelect.dispatchEvent(new Event('change', { bubbles:true }));
    roleSelect.value = roles[target];
    roleSelect.dispatchEvent(new Event('change', { bubbles:true }));
    targetSelect.value = previous;
    targetSelect.dispatchEvent(new Event('change', { bubbles:true }));
  }
  function setRole(target, role) {
    roles[target] = role === 'dynamic' ? 'dynamic' : 'static';
    syncCore(target);
    render();
    save();
  }
  function control(target, label) {
    return '<article class="sky-role-card" data-relphi-role-target="' + target + '"><strong>' + label + '</strong><div class="sky-role-toggle" role="group" aria-label="' + label + ' transit role"><button type="button" data-role="static">Static</button><button type="button" data-role="dynamic">Dynamic</button></div><small>' + (roles[target] === 'static' ? 'Natal or fixed reference' : 'Moving transit sky') + '</small></article>';
  }
  function render() {
    const editor = document.getElementById('skyTransitRoleEditor');
    if (!editor) return;
    const transit = mode() === 'transit';
    editor.hidden = !transit;
    if (!transit) return;
    editor.innerHTML = '<div class="sky-role-grid">' + control('chart', 'Sky A') + control('currentSky', 'Sky B') + '</div><p class="sky-role-validation" role="status">' + (validity() ? 'Transit direction is explicit: one Static reference and one Dynamic moving sky.' : 'Choose exactly one Static sky and one Dynamic sky. Transit results are paused until the roles are corrected.') + '</p>';
    editor.querySelectorAll('[data-relphi-role-target]').forEach(function (card) {
      card.querySelectorAll('[data-role]').forEach(function (button) {
        const active = roles[card.dataset.relphiRoleTarget] === button.dataset.role;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
        button.addEventListener('click', function () { setRole(card.dataset.relphiRoleTarget, button.dataset.role); });
      });
    });
  }
  function install() {
    const tabs = document.querySelector('.sky-advanced-sky-tabs');
    if (tabs && !document.getElementById('skyTransitRoleEditor')) {
      const editor = document.createElement('section');
      editor.id = 'skyTransitRoleEditor';
      editor.className = 'sky-transit-role-editor';
      editor.setAttribute('aria-label', 'Transit roles');
      tabs.insertAdjacentElement('afterend', editor);
    }
    document.addEventListener('click', function (event) { if (event.target.closest('[data-sky-chart-mode]')) setTimeout(render); });
    render(); save();
  }
  window.RelphiSkyRoles = contract();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true }); else install();
})();
