// Shared lunar libration status for Planetary Hours and Astrology Foundations.
// Uses Astronomy Engine's sub-Earth lunar libration longitude/latitude angles.
(function () {
  'use strict';
  if (window.__relphiMoonLibrationStatusV1) return;
  window.__relphiMoonLibrationStatusV1 = true;

  const ASTRONOMY_SRC = 'https://cdn.jsdelivr.net/gh/cosinekitty/astronomy@master/source/js/astronomy.browser.min.js';
  let astronomyPromise = null;
  let foundationTimer = 0;
  let planetaryRenderToken = 0;
  let foundationRenderToken = 0;

  function isPlanetaryHours() {
    return /(^|\/)planetaryhours\.html$/.test(location.pathname);
  }

  function isAstrologyFoundations() {
    return /(^|\/)astrology-foundations\.html$/.test(location.pathname);
  }

  function astronomyReady() {
    return Boolean(window.Astronomy && typeof window.Astronomy.Libration === 'function');
  }

  function ensureAstronomy() {
    if (astronomyReady()) return Promise.resolve(window.Astronomy);
    if (astronomyPromise) return astronomyPromise;

    astronomyPromise = new Promise((resolve, reject) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        if (!astronomyReady()) return;
        settled = true;
        resolve(window.Astronomy);
      };
      const fail = () => {
        if (settled) return;
        settled = true;
        reject(new Error('Astronomy Engine libration support is unavailable.'));
      };

      const existing = Array.from(document.scripts).find(script => /astronomy\.browser(?:\.min)?\.js/i.test(script.src || ''));
      if (existing) {
        finish();
        if (!settled) {
          existing.addEventListener('load', finish, { once:true });
          existing.addEventListener('error', fail, { once:true });
          setTimeout(() => astronomyReady() ? finish() : fail(), 7000);
        }
        return;
      }

      const script = document.createElement('script');
      script.src = ASTRONOMY_SRC;
      script.async = false;
      script.addEventListener('load', finish, { once:true });
      script.addEventListener('error', fail, { once:true });
      document.head.appendChild(script);
      setTimeout(() => astronomyReady() ? finish() : fail(), 7000);
    });

    return astronomyPromise;
  }

  function calculate(date) {
    if (!astronomyReady()) throw new Error('Astronomy Engine libration support is unavailable.');
    const value = window.Astronomy.Libration(date instanceof Date ? date : new Date(date));
    return {
      longitude:Number(value.elon),
      latitude:Number(value.elat),
      distanceKm:Number(value.dist_km),
      diameterDeg:Number(value.diam_deg)
    };
  }

  function signedDegrees(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '—';
    const sign = n > 0 ? '+' : n < 0 ? '−' : '';
    return sign + Math.abs(n).toFixed(1) + '°';
  }

  function spokenSignedDegrees(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 'unavailable';
    const prefix = n > 0 ? 'plus ' : n < 0 ? 'minus ' : '';
    return prefix + Math.abs(n).toFixed(1) + ' degrees';
  }

  function statusText(info) {
    return 'Longitude ' + signedDegrees(info.longitude) + ' · Latitude ' + signedDegrees(info.latitude);
  }

  function statusAria(info) {
    return 'Libration status: longitude ' + spokenSignedDegrees(info.longitude) + ', latitude ' + spokenSignedDegrees(info.latitude) + '.';
  }

  function ensureStyle() {
    if (document.getElementById('relphi-moon-libration-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-moon-libration-style';
    style.textContent = [
      '.ph-moon-libration{margin:.3rem 0 .55rem;line-height:1.25}',
      '.ph-moon-libration strong{display:block;margin-top:.15rem;font-size:1rem;font-weight:900;color:#111;font-variant-numeric:tabular-nums}',
      '.ph-moon-libration .ph-profile-label{font-size:.68rem}',
      '.relphi-libration-value{font-variant-numeric:tabular-nums}',
      '.relphi-libration-reference{display:block;margin-top:.15rem;font-size:.76rem;line-height:1.25;color:#555;font-weight:600}'
    ].join('');
    document.head.appendChild(style);
  }

  function planetarySelectedDate() {
    const useSystem = document.getElementById('useSystem');
    if (!useSystem || useSystem.checked) return new Date();
    const dateValue = document.getElementById('datePick')?.value;
    const timeValue = document.getElementById('timePick')?.value || '00:00';
    const zone = document.getElementById('tzSelect')?.value || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    if (!dateValue) return new Date();
    if (window.luxon?.DateTime) {
      const zoned = window.luxon.DateTime.fromISO(dateValue + 'T' + timeValue, { zone:zone });
      if (zoned.isValid) return zoned.toJSDate();
    }
    const fallback = new Date(dateValue + 'T' + timeValue);
    return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
  }

  function ensurePlanetaryRow() {
    const facts = document.querySelector('.ph-moon-frame .ph-moon-facts');
    if (!facts) return null;
    let row = document.getElementById('moonLibrationStatus');
    if (row) return row;
    row = document.createElement('p');
    row.id = 'moonLibrationStatus';
    row.className = 'ph-moon-libration';
    row.setAttribute('aria-live', 'polite');
    row.innerHTML = '<span class="ph-profile-label">Libration status</span><strong class="relphi-libration-value">—</strong>';
    const zodiac = document.getElementById('moonZodiacPosition');
    const phase = document.getElementById('moonPhase');
    if (zodiac && zodiac.parentNode === facts) zodiac.insertAdjacentElement('afterend', row);
    else if (phase && phase.parentNode === facts) phase.insertAdjacentElement('afterend', row);
    else facts.appendChild(row);
    return row;
  }

  async function renderPlanetaryLibration() {
    const token = ++planetaryRenderToken;
    const row = ensurePlanetaryRow();
    if (!row) return;
    const value = row.querySelector('.relphi-libration-value');
    if (!value) return;
    try {
      await ensureAstronomy();
      if (token !== planetaryRenderToken) return;
      const info = calculate(planetarySelectedDate());
      value.textContent = statusText(info);
      row.setAttribute('aria-label', statusAria(info));
      row.title = 'Sub-Earth libration relative to the Moon’s mean Earth-facing position.';
    } catch (error) {
      if (token !== planetaryRenderToken) return;
      value.textContent = 'Libration unavailable';
      row.removeAttribute('aria-label');
      row.title = String(error?.message || error);
    }
  }

  function startPlanetaryHours() {
    if (!document.querySelector('.ph-moon-frame')) return;
    ensureStyle();
    ensurePlanetaryRow();
    renderPlanetaryLibration();
    ['useSystem','datePick','timePick','tzSelect','applyDT'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', renderPlanetaryLibration);
      document.getElementById(id)?.addEventListener('click', () => setTimeout(renderPlanetaryLibration, 0));
    });
    const phase = document.getElementById('moonPhase');
    if (phase && window.MutationObserver) {
      new MutationObserver(renderPlanetaryLibration).observe(phase, { childList:true, characterData:true, subtree:true });
    }
    window.setInterval(() => {
      const useSystem = document.getElementById('useSystem');
      if (!useSystem || useSystem.checked) renderPlanetaryLibration();
    }, 30000);
  }

  function phaseFractionFromFoundation() {
    const slider = document.getElementById('moonPhaseSlider');
    if (!slider) return null;
    const value = Number(slider.value);
    return Number.isFinite(value) ? Math.max(0, Math.min(1, value / 1000)) : null;
  }

  function astroDate(value) {
    if (!value) return null;
    if (value.date instanceof Date) return value.date;
    if (value instanceof Date) return value;
    const date = new Date(value.date || value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function nearestDateForPhase(phaseFraction, anchorDate) {
    if (!astronomyReady()) throw new Error('Astronomy Engine libration support is unavailable.');
    const target = ((Number(phaseFraction) || 0) * 360) % 360;
    const anchor = anchorDate instanceof Date ? anchorDate : new Date(anchorDate || Date.now());
    const past = astroDate(window.Astronomy.SearchMoonPhase(target, anchor, -18));
    const future = astroDate(window.Astronomy.SearchMoonPhase(target, anchor, 18));
    if (!past) return future || anchor;
    if (!future) return past;
    return (anchor.getTime() - past.getTime()) <= (future.getTime() - anchor.getTime()) ? past : future;
  }

  function foundationDateLabel(date) {
    try {
      return date.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
    } catch (_) {
      return date.toISOString().slice(0, 10);
    }
  }

  function ensureFoundationRow() {
    const body = document.querySelector('.moon-info-card .mini-fields tbody');
    if (!body) return null;
    let row = body.querySelector('[data-relphi-moon-libration-row]');
    if (row) return row;
    row = document.createElement('tr');
    row.dataset.relphiMoonLibrationRow = 'true';
    row.innerHTML = '<th>Libration</th><td><span class="relphi-libration-value" id="foundationMoonLibration">—</span><span class="relphi-libration-reference" id="foundationMoonLibrationReference"></span></td>';
    const elevation = document.getElementById('moonElevation')?.closest('tr');
    if (elevation && elevation.parentNode === body) body.insertBefore(row, elevation);
    else body.appendChild(row);
    return row;
  }

  async function renderFoundationLibration() {
    const phaseFraction = phaseFractionFromFoundation();
    if (phaseFraction === null) return;
    const token = ++foundationRenderToken;
    ensureStyle();
    const row = ensureFoundationRow();
    if (!row) return;
    const value = row.querySelector('.relphi-libration-value');
    const reference = row.querySelector('.relphi-libration-reference');
    try {
      await ensureAstronomy();
      if (token !== foundationRenderToken) return;
      const referenceDate = nearestDateForPhase(phaseFraction, new Date());
      const info = calculate(referenceDate);
      const nextValue = statusText(info);
      const nextReference = 'Reference date: ' + foundationDateLabel(referenceDate);
      if (value.textContent !== nextValue) value.textContent = nextValue;
      if (reference.textContent !== nextReference) reference.textContent = nextReference;
      row.setAttribute('aria-label', statusAria(info) + ' Reference date ' + foundationDateLabel(referenceDate) + '.');
      row.title = 'The reference date is the nearest real occurrence of the phase selected in this teaching tool.';
    } catch (error) {
      if (token !== foundationRenderToken) return;
      if (value.textContent !== 'Libration unavailable') value.textContent = 'Libration unavailable';
      if (reference.textContent) reference.textContent = '';
      row.removeAttribute('aria-label');
      row.title = String(error?.message || error);
    }
  }

  function scheduleFoundationLibration() {
    clearTimeout(foundationTimer);
    foundationTimer = window.setTimeout(renderFoundationLibration, 70);
  }

  function startAstrologyFoundations() {
    ensureStyle();
    const grid = document.getElementById('foundationGrid');
    if (!grid) return;
    scheduleFoundationLibration();
    document.addEventListener('input', event => {
      if (event.target?.id === 'moonPhaseSlider') scheduleFoundationLibration();
    }, true);
    document.addEventListener('change', event => {
      if (['moonPhaseSlider','moonMonthSelect','moonYearInput'].includes(event.target?.id)) scheduleFoundationLibration();
    }, true);
    if (window.MutationObserver) {
      new MutationObserver(mutations => {
        const meaningful = mutations.some(mutation => {
          const target = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
          return !target?.closest?.('[data-relphi-moon-libration-row]');
        });
        if (meaningful) scheduleFoundationLibration();
      }).observe(grid, { childList:true, subtree:true });
    }
  }

  window.RelphiMoonLibration = Object.freeze({
    calculate,
    nearestDateForPhase,
    statusText
  });

  function start() {
    if (isPlanetaryHours()) startPlanetaryHours();
    if (isAstrologyFoundations()) startAstrologyFoundations();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
