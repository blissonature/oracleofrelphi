// Prompts first-time Planetary Hours visitors to replace the Greenwich demo with their own location.
(function () {
  'use strict';
  if (!/(^|\/)planetaryhours\.html$/.test(location.pathname)) return;

  const STORAGE_KEY = 'relphiPlanetaryHoursWhereWhen';
  const DISMISS_KEY = 'relphiPlanetaryHoursLocationPromptDismissed';

  function hasExplicitLocation() {
    try {
      const hash = new URLSearchParams(location.hash.slice(1));
      if (hash.has('lat') && hash.has('lon')) return true;
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const lat = Number(parsed.lat);
        const lon = Number(parsed.lon);
        if (Number.isFinite(lat) && Number.isFinite(lon)) return true;
      }
    } catch (error) {}
    return false;
  }

  function isStillGreenwichDemo() {
    const lat = Number(document.getElementById('lat') && document.getElementById('lat').value);
    const lon = Number(document.getElementById('lon') && document.getElementById('lon').value);
    const name = String(document.getElementById('locationSearch') && document.getElementById('locationSearch').value || '').toLowerCase();
    return Number.isFinite(lat) && Number.isFinite(lon) &&
      Math.abs(lat - 51.4769) < 0.01 && Math.abs(lon - (-0.0005)) < 0.01 &&
      (!name || name.includes('greenwich'));
  }

  function removePrompt() {
    const prompt = document.getElementById('phLocationPrompt');
    if (prompt) prompt.remove();
  }

  function showPrompt() {
    if (document.getElementById('phLocationPrompt')) return;

    const wrap = document.createElement('section');
    wrap.id = 'phLocationPrompt';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-labelledby', 'phLocationPromptTitle');
    wrap.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(17,17,17,.55);display:grid;place-items:center;padding:1rem;';

    const card = document.createElement('div');
    card.style.cssText = 'width:min(92vw,30rem);background:#fff;border:2px solid #dc1f18;border-radius:1.2rem;padding:1rem 1.05rem;box-shadow:0 1.2rem 3rem rgba(0,0,0,.28);text-align:left;';
    card.innerHTML = '<h2 id="phLocationPromptTitle" style="margin:.1rem 0 .45rem;text-align:left;">Use your location?</h2>' +
      '<p style="margin:.2rem 0 .9rem;line-height:1.45;">Planetary Hours is currently using the Greenwich demonstration location. Your planetary day, sunrise, sunset, and hour ruler should use your actual location.</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:.55rem;">' +
      '<button type="button" id="phPromptUseLocation" style="font:inherit;font-weight:800;border:0;border-radius:999px;background:#dc1f18;color:#fff;padding:.7rem 1rem;">Use my location</button>' +
      '<button type="button" id="phPromptKeepDemo" style="font:inherit;font-weight:800;border:1.5px solid #111;border-radius:999px;background:#fff;color:#111;padding:.7rem 1rem;">Keep Greenwich for now</button>' +
      '</div>';
    wrap.appendChild(card);
    document.body.appendChild(wrap);

    const use = document.getElementById('phPromptUseLocation');
    const keep = document.getElementById('phPromptKeepDemo');

    use.addEventListener('click', function () {
      removePrompt();
      const existing = document.getElementById('useGeo');
      if (existing) existing.click();
    });

    keep.addEventListener('click', function () {
      try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch (error) {}
      removePrompt();
    });

    use.focus();
  }

  function start() {
    if (hasExplicitLocation()) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') return;
    } catch (error) {}

    let attempts = 0;
    const timer = setInterval(function () {
      attempts += 1;
      if (document.getElementById('lat') && document.getElementById('useGeo')) {
        clearInterval(timer);
        if (isStillGreenwichDemo()) showPrompt();
      } else if (attempts > 40) {
        clearInterval(timer);
      }
    }, 150);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
