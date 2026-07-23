// Adds a synchronized 3D zodiac-placement handoff to Planetary Hours.
(function () {
  'use strict';

  function build3dHref() {
    const source = document.getElementById('dateFieldLink') || document.getElementById('phCurrentWheelCard');
    if (!source) return 'zodiac-placements-3d.html';
    try {
      const existing = new URL(source.href, location.href);
      const params = new URLSearchParams(existing.search);
      params.set('source', 'planetary-hours');
      return 'zodiac-placements-3d.html?' + params.toString();
    } catch (_) {
      return 'zodiac-placements-3d.html';
    }
  }

  function ensureLink() {
    const card = document.getElementById('phCurrentWheelCard');
    if (!card || document.getElementById('ph3dPlacementsLink')) return false;

    const link = document.createElement('a');
    link.id = 'ph3dPlacementsLink';
    link.className = 'ph-btn ph-3d-placements-link';
    link.textContent = 'Explore these placements in 3D';
    link.href = build3dHref();
    link.setAttribute('aria-label', 'Open these planetary placements in the 3D zodiac viewer');

    const wrap = document.createElement('p');
    wrap.className = 'ph-3d-placements-wrap';
    wrap.appendChild(link);
    card.insertAdjacentElement('afterend', wrap);

    const style = document.createElement('style');
    style.id = 'ph3dPlacementsStyle';
    style.textContent = [
      '.ph-3d-placements-wrap{margin:.55rem 0 0;text-align:center}',
      '.ph-3d-placements-link{display:inline-flex!important;align-items:center;justify-content:center;gap:.4rem;white-space:normal!important;line-height:1.2!important}',
      '.ph-3d-placements-link::before{content:"✦";font-size:.9em}',
      '@media(max-width:560px){.ph-3d-placements-link{width:100%;box-sizing:border-box}}'
    ].join('');
    document.head.appendChild(style);

    const sync = function () { link.href = build3dHref(); };
    const observer = new MutationObserver(sync);
    observer.observe(document.getElementById('dateFieldLink') || card, { attributes:true, attributeFilter:['href'] });
    window.addEventListener('hashchange', sync);
    setInterval(sync, 30000);
    return true;
  }

  function start() {
    if (ensureLink()) return;
    let tries = 0;
    const timer = setInterval(function () {
      tries += 1;
      if (ensureLink() || tries > 80) clearInterval(timer);
    }, 100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
