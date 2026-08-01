// Explicit maximum-orb filter for relationship rows and matching aspect lines.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyOrbFilterV1) return;
  window.__relphiSkyOrbFilterV1 = true;

  let maximumOrb = 3;
  let queued = false;

  function orbFor(row) {
    const stored = Number(row.dataset.orb);
    if (Number.isFinite(stored)) return stored;
    const match = String(row.getAttribute('aria-label') || '').match(/orb\s+([\d.]+)\s+degrees/i);
    const value = match ? Number(match[1]) : NaN;
    if (Number.isFinite(value)) row.dataset.orb = String(value);
    return value;
  }

  function updateOutput(input) {
    const output = document.querySelector('[data-orb-output]');
    if (output) output.textContent = `${Number(input.value).toFixed(1)}°`;
  }

  function apply() {
    queued = false;
    const rows = Array.from(document.querySelectorAll('.sky-foundation-relationship-row'));
    rows.forEach(row => {
      const orb = orbFor(row);
      const hidden = Number.isFinite(orb) && orb > maximumOrb;
      row.classList.toggle('sky-orb-filter-hidden', hidden);
      document.querySelectorAll(`[data-layer="aspects"] [data-relation-index="${CSS.escape(row.dataset.relationIndex || '')}"]`).forEach(line => {
        line.classList.toggle('sky-orb-filter-hidden', hidden);
      });
    });

    const visible = rows.filter(row => !row.classList.contains('sky-chart-filter-hidden') && !row.classList.contains('sky-orb-filter-hidden'));
    const count = document.getElementById('skyFoundationRelationshipCount');
    if (count) count.textContent = `${visible.length}/${rows.length}`;
    const empty = document.getElementById('skyFoundationRelationshipEmpty');
    if (empty) empty.hidden = visible.length !== 0;
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(apply);
  }

  function install() {
    const bar = document.querySelector('.sky-chart-filter-bar');
    if (!bar || bar.querySelector('[data-orb-filter]')) return false;
    const label = document.createElement('label');
    label.className = 'sky-orb-filter';
    label.innerHTML = '<span>Orb <output data-orb-output>3.0°</output></span><input data-orb-filter type="range" min="0" max="3" step="0.1" value="3" aria-label="Maximum relationship orb in degrees">';
    bar.appendChild(label);
    const input = label.querySelector('[data-orb-filter]');
    input.addEventListener('input', () => {
      maximumOrb = Number(input.value);
      updateOutput(input);
      apply();
    });
    input.addEventListener('change', apply);
    updateOutput(input);
    apply();
    return true;
  }

  function start() {
    install();
    const root = document.getElementById('skyFoundationRoot');
    if (root) new MutationObserver(() => { install(); schedule(); }).observe(root, { childList:true, subtree:true });
    window.addEventListener('relphi:sky-foundation-interactions-ready', () => { install(); schedule(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
