// Adds the Moon's current tropical zodiac position to the Planetary Hours Moon panel.
(function () {
  'use strict';

  const SIGNS = [
    { name:'Aries', glyph:'♈' },
    { name:'Taurus', glyph:'♉' },
    { name:'Gemini', glyph:'♊' },
    { name:'Cancer', glyph:'♋' },
    { name:'Leo', glyph:'♌' },
    { name:'Virgo', glyph:'♍' },
    { name:'Libra', glyph:'♎' },
    { name:'Scorpio', glyph:'♏' },
    { name:'Sagittarius', glyph:'♐' },
    { name:'Capricorn', glyph:'♑' },
    { name:'Aquarius', glyph:'♒' },
    { name:'Pisces', glyph:'♓' }
  ];

  function normalizeDegrees(value) {
    const degrees = Number(value) || 0;
    return ((degrees % 360) + 360) % 360;
  }

  function selectedDate() {
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

  function moonLongitude(date) {
    const astronomy = window.Astronomy;
    if (!astronomy) throw new Error('Astronomy Engine is unavailable.');
    if (typeof astronomy.EclipticGeoMoon === 'function') {
      return normalizeDegrees(astronomy.EclipticGeoMoon(date).lon);
    }
    const vector = astronomy.GeoVector('Moon', date, true);
    return normalizeDegrees(astronomy.Ecliptic(vector).elon);
  }

  function formatPlacement(longitude) {
    const totalMinutes = Math.round(normalizeDegrees(longitude) * 60) % (360 * 60);
    const signIndex = Math.floor(totalMinutes / (30 * 60));
    const minutesInSign = totalMinutes % (30 * 60);
    const degree = Math.floor(minutesInSign / 60);
    const minute = minutesInSign % 60;
    const sign = SIGNS[signIndex];
    return sign.glyph + ' ' + sign.name + ' ' + degree + '° ' + String(minute).padStart(2, '0') + '′';
  }

  function ensurePositionElement() {
    const facts = document.querySelector('.ph-moon-frame .ph-moon-facts');
    if (!facts) return null;

    let position = document.getElementById('moonZodiacPosition');
    if (position) return position;

    position = document.createElement('p');
    position.id = 'moonZodiacPosition';
    position.className = 'ph-moon-position';
    position.setAttribute('aria-live', 'polite');
    position.innerHTML = '<span class="ph-profile-label">Current zodiac position</span><strong>—</strong>';

    const phase = document.getElementById('moonPhase');
    if (phase && phase.parentNode === facts) phase.insertAdjacentElement('afterend', position);
    else facts.insertBefore(position, facts.firstChild);
    return position;
  }

  function ensureStyle() {
    if (document.getElementById('ph-moon-position-style')) return;
    const style = document.createElement('style');
    style.id = 'ph-moon-position-style';
    style.textContent = [
      '.ph-moon-position{margin:.3rem 0 .55rem;line-height:1.25}',
      '.ph-moon-position strong{display:block;margin-top:.15rem;font-size:1.08rem;font-weight:900;color:#111}',
      '.ph-moon-position .ph-profile-label{font-size:.68rem}'
    ].join('');
    document.head.appendChild(style);
  }

  function renderMoonPosition() {
    const position = ensurePositionElement();
    if (!position) return;
    const value = position.querySelector('strong');
    try {
      value.textContent = formatPlacement(moonLongitude(selectedDate()));
      position.removeAttribute('title');
    } catch (error) {
      value.textContent = 'Position unavailable';
      position.title = String(error?.message || error);
    }
  }

  function start() {
    if (!document.querySelector('.ph-moon-frame')) return;
    ensureStyle();
    renderMoonPosition();

    ['useSystem','datePick','timePick','tzSelect','applyDT'].forEach(function (id) {
      document.getElementById(id)?.addEventListener('change', renderMoonPosition);
      document.getElementById(id)?.addEventListener('click', function () { setTimeout(renderMoonPosition, 0); });
    });

    const phase = document.getElementById('moonPhase');
    if (phase && window.MutationObserver) {
      new MutationObserver(renderMoonPosition).observe(phase, { childList:true, characterData:true, subtree:true });
    }

    window.setInterval(function () {
      const useSystem = document.getElementById('useSystem');
      if (!useSystem || useSystem.checked) renderMoonPosition();
    }, 30000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
