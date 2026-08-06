// Adds the Moon's current tropical zodiac position to the Planetary Hours Moon panel.
// Glyph geometry comes only from https://oracleofrelphi.com/glyphs-unified-preview.html.
(function () {
  'use strict';

  const SIGNS = [
    { id:'aries', name:'Aries' }, { id:'taurus', name:'Taurus' },
    { id:'gemini', name:'Gemini' }, { id:'cancer', name:'Cancer' },
    { id:'leo', name:'Leo' }, { id:'virgo', name:'Virgo' },
    { id:'libra', name:'Libra' }, { id:'scorpio', name:'Scorpio' },
    { id:'sagittarius', name:'Sagittarius' }, { id:'capricorn', name:'Capricorn' },
    { id:'aquarius', name:'Aquarius' }, { id:'pisces', name:'Pisces' }
  ];
  let renderRequest = 0;

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
    if (typeof astronomy.EclipticGeoMoon === 'function') return normalizeDegrees(astronomy.EclipticGeoMoon(date).lon);
    const vector = astronomy.GeoVector('Moon', date, true);
    return normalizeDegrees(astronomy.Ecliptic(vector).elon);
  }

  function placementFromLongitude(longitude) {
    const totalMinutes = Math.round(normalizeDegrees(longitude) * 60) % (360 * 60);
    const signIndex = Math.floor(totalMinutes / (30 * 60));
    const minutesInSign = totalMinutes % (30 * 60);
    const degree = Math.floor(minutesInSign / 60);
    const minute = minutesInSign % 60;
    const sign = SIGNS[signIndex];
    return { sign, degree, minute, text:sign.name + ' ' + degree + '° ' + String(minute).padStart(2, '0') + '′' };
  }

  function waitForCanonicalRuntime() {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      (function check() {
        if (window.RelphiGlyphRegistry && window.RelphiGlyphComponent?.createBubble) return resolve();
        if (Date.now() - started > 6000) return reject(new Error('The canonical glyph runtime did not load.'));
        setTimeout(check, 40);
      })();
    });
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
    position.innerHTML = [
      '<span class="ph-profile-label">Current zodiac position</span>',
      '<span class="ph-moon-placement-line">',
      '<svg class="ph-moon-sign-glyph" viewBox="-19 -19 38 38" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false"></svg>',
      '<strong>—</strong>',
      '</span>'
    ].join('');
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
      '.ph-moon-placement-line{display:flex;align-items:center;gap:.42rem;margin-top:.15rem}',
      '.ph-moon-sign-glyph{display:block;width:1.72rem;height:1.72rem;flex:0 0 1.72rem;overflow:visible}',
      '.ph-moon-position strong{display:block;font-size:1.08rem;font-weight:900;color:#111}',
      '.ph-moon-position .ph-profile-label{font-size:.68rem}'
    ].join('');
    document.head.appendChild(style);
  }

  async function drawCanonicalSign(svgElement, signId, requestId) {
    if (!svgElement) return;
    await waitForCanonicalRuntime();
    if (requestId !== renderRequest) return;
    svgElement.replaceChildren();
    const registry = window.RelphiGlyphRegistry;
    const component = window.RelphiGlyphComponent;
    const entry = registry.get(signId) || registry.resolve(signId);
    if (!entry) throw new Error('Canonical sign unavailable: ' + signId);
    const bubble = component.createBubble(svgElement, entry.id, { radius:19, padding:1, color:'#111' });
    bubble.circle.style.opacity = '0';
    bubble.circle.setAttribute('aria-hidden', 'true');
    bubble.root.dataset.masterGlyphSource = 'https://oracleofrelphi.com/glyphs-unified-preview.html';
    await bubble.ready;
    if (requestId !== renderRequest) svgElement.replaceChildren();
  }

  async function renderMoonPosition() {
    const requestId = ++renderRequest;
    const position = ensurePositionElement();
    if (!position) return;
    const value = position.querySelector('strong');
    const glyph = position.querySelector('.ph-moon-sign-glyph');
    try {
      const placement = placementFromLongitude(moonLongitude(selectedDate()));
      value.textContent = placement.text;
      position.setAttribute('aria-label', 'Current zodiac position: ' + placement.text);
      position.removeAttribute('title');
      await drawCanonicalSign(glyph, placement.sign.id, requestId);
    } catch (error) {
      if (requestId !== renderRequest) return;
      if (glyph) glyph.replaceChildren();
      value.textContent = 'Position unavailable';
      position.title = String(error?.message || error);
    }
  }

  function start() {
    if (!document.querySelector('.ph-moon-frame')) return;
    ensureStyle();
    ensurePositionElement();
    renderMoonPosition();
    ['useSystem','datePick','timePick','tzSelect','applyDT'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', renderMoonPosition);
      document.getElementById(id)?.addEventListener('click', () => setTimeout(renderMoonPosition, 0));
    });
    const phase = document.getElementById('moonPhase');
    if (phase && window.MutationObserver) new MutationObserver(renderMoonPosition).observe(phase, { childList:true, characterData:true, subtree:true });
    window.setInterval(() => {
      const useSystem = document.getElementById('useSystem');
      if (!useSystem || useSystem.checked) renderMoonPosition();
    }, 30000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
