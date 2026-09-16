// Live traditional sect, halb, and hayz summary for Planetary Hours.
// Planet glyphs are rendered only through the canonical Relphi glyph component.
(function () {
  'use strict';
  if (!/(^|\/)planetaryhours\.html$/.test(location.pathname) || window.__relphiPlanetaryHoursSectV1) return;
  window.__relphiPlanetaryHoursSectV1 = true;

  const PLANETS = Object.freeze([
    Object.freeze({ id:'sun', body:'Sun', sect:'diurnal', gender:'masculine' }),
    Object.freeze({ id:'moon', body:'Moon', sect:'nocturnal', gender:'feminine' }),
    Object.freeze({ id:'mercury', body:'Mercury', sect:'variable', gender:'variable' }),
    Object.freeze({ id:'venus', body:'Venus', sect:'nocturnal', gender:'feminine' }),
    Object.freeze({ id:'mars', body:'Mars', sect:'nocturnal', gender:'masculine' }),
    Object.freeze({ id:'jupiter', body:'Jupiter', sect:'diurnal', gender:'masculine' }),
    Object.freeze({ id:'saturn', body:'Saturn', sect:'diurnal', gender:'masculine' })
  ]);
  const PLANET_BY_ID = new Map(PLANETS.map(planet => [planet.id, planet]));
  const WATCH_IDS = new Set([
    'useSystem','datePick','timePick','tzSelect','lat','lon','setLatLon','useGeo','applyLocation','applyDT',
    'heptagramHour','heptagramPrev','heptagramNext','heptagramNow','prevDayCue','nextDayCue'
  ]);
  let renderGeneration = 0;
  let scheduled = false;
  let lastSignature = '';

  function normDeg(value) { const n = Number(value) || 0; return ((n % 360) + 360) % 360; }
  function signedDeg(value) { const n = normDeg(value); return n > 180 ? n - 360 : n; }
  function isPreviewing() { return /^Previewing\b/i.test(document.getElementById('heptagramHourLabel')?.textContent?.trim() || ''); }
  function zone() { return document.getElementById('tzSelect')?.value || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; }

  function parseZonedDateTime(value, timeZone) {
    if (!value) return null;
    if (window.luxon?.DateTime) {
      const dt = window.luxon.DateTime.fromISO(String(value), { zone:timeZone || zone() });
      if (dt.isValid) return dt.toJSDate();
    }
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  function wheelContext() {
    const card = document.getElementById('phCurrentWheelCard');
    if (!card?.href) return null;
    try {
      const url = new URL(card.href, location.href);
      const latitude = Number(url.searchParams.get('lat'));
      const longitude = Number(url.searchParams.get('lon'));
      const timeZone = url.searchParams.get('tz') || zone();
      const instant = parseZonedDateTime(url.searchParams.get('datetime'), timeZone);
      return instant && Number.isFinite(latitude) && Number.isFinite(longitude) ? { instant, latitude, longitude, timeZone } : null;
    } catch (_) { return null; }
  }

  function controlsContext() {
    const latitude = Number(document.getElementById('lat')?.value);
    const longitude = Number(document.getElementById('lon')?.value);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    const timeZone = zone();
    if (document.getElementById('useSystem')?.checked !== false) return { instant:new Date(), latitude, longitude, timeZone };
    const date = document.getElementById('datePick')?.value;
    const time = document.getElementById('timePick')?.value;
    const instant = parseZonedDateTime(date && time ? date + 'T' + time : '', timeZone);
    return instant ? { instant, latitude, longitude, timeZone } : null;
  }

  function activeContext() {
    const linked = wheelContext();
    const controls = controlsContext();
    if (isPreviewing() && linked) return linked;
    if (document.getElementById('useSystem')?.checked !== false && controls) return controls;
    return linked || controls;
  }

  function eclipticLongitude(body, instant) {
    const A = window.Astronomy;
    if (!A) throw new Error('Astronomy Engine is unavailable.');
    if (body === 'Moon' && typeof A.EclipticGeoMoon === 'function') return normDeg(A.EclipticGeoMoon(instant).lon);
    return normDeg(A.Ecliptic(A.GeoVector(body, instant, true)).elon);
  }

  function altitude(body, instant, observer) {
    const A = window.Astronomy;
    const equator = A.Equator(body, instant, observer, true, true);
    return Number(A.Horizon(instant, observer, equator.ra, equator.dec, 'normal').altitude);
  }

  function signGender(longitude) { return Math.floor(normDeg(longitude) / 30) % 2 === 0 ? 'masculine' : 'feminine'; }

  function mercuryCondition(mercuryLongitude, sunLongitude) {
    const elongation = signedDeg(mercuryLongitude - sunLongitude);
    const oriental = elongation <= 0;
    return {
      sect: oriental ? 'diurnal' : 'nocturnal',
      gender: oriental ? 'masculine' : 'feminine',
      phase: oriental ? 'oriental / morning star' : 'occidental / evening star',
      elongation
    };
  }

  function calculate(context) {
    if (!window.Astronomy) throw new Error('Astronomy Engine is unavailable.');
    const observer = new window.Astronomy.Observer(context.latitude, context.longitude, 0);
    const longitudes = new Map();
    const positions = new Map();

    PLANETS.forEach(planet => {
      const longitude = eclipticLongitude(planet.body, context.instant);
      longitudes.set(planet.id, longitude);
      positions.set(planet.id, {
        id:planet.id,
        body:planet.body,
        longitude,
        signGender:signGender(longitude),
        altitude:altitude(planet.body, context.instant, observer)
      });
    });

    const mercury = mercuryCondition(longitudes.get('mercury'), longitudes.get('sun'));
    const sunAbove = positions.get('sun').altitude >= 0;
    const chartSect = sunAbove ? 'diurnal' : 'nocturnal';
    const sectLight = chartSect === 'diurnal' ? 'sun' : 'moon';
    const sectBenefic = chartSect === 'diurnal' ? 'jupiter' : 'venus';
    const sectMalefic = chartSect === 'diurnal' ? 'saturn' : 'mars';

    positions.forEach(position => {
      const definition = PLANET_BY_ID.get(position.id);
      position.sect = definition.sect === 'variable' ? mercury.sect : definition.sect;
      position.gender = definition.gender === 'variable' ? mercury.gender : definition.gender;
      position.above = position.altitude >= 0;
      position.ofSect = position.sect === chartSect;
      position.halb = position.sect === 'diurnal' ? position.above === sunAbove : position.above !== sunAbove;
      position.hayz = position.ofSect && position.halb && position.signGender === position.gender;
      position.isLight = position.id === sectLight;
      position.isBenefic = position.id === sectBenefic;
      position.isMalefic = position.id === sectMalefic;
    });

    return { chartSect, sunAbove, sectLight, sectBenefic, sectMalefic, mercury, positions };
  }

  function ensureStyle() {
    if (document.getElementById('ph-sect-style-v1')) return;
    const style = document.createElement('style');
    style.id = 'ph-sect-style-v1';
    style.textContent = [
      '.ph-sect-line{grid-column:1/-1;display:flex;align-items:center;justify-content:center;gap:.5em;width:100%;max-width:100%;margin:.25rem 0 .1rem;padding:.38em .1em;box-sizing:border-box;white-space:nowrap;overflow:hidden;font-size:12.5px;line-height:1.15;color:#2f2a27}',
      '.ph-sect-heading{font-weight:950;flex:0 0 auto}',
      '.ph-sect-planet{display:inline-flex;align-items:center;gap:.22em;flex:0 0 auto}',
      '.ph-sect-planet::before{content:"·";margin-right:.28em;color:#8a817a;font-weight:900}',
      '.ph-sect-glyph-host{display:inline-grid;place-items:center;width:1.4em;height:1.4em;flex:0 0 1.4em}',
      '.ph-sect-glyph{display:block;width:100%;height:100%;overflow:visible}',
      '.ph-sect-statuses{display:inline-flex;align-items:center;gap:.22em;font-weight:820}',
      '.ph-sect-status{white-space:nowrap}',
      '.ph-sect-status-short{display:none}',
      '@media(max-width:760px){.ph-sect-line{font-size:11px;gap:.28em;padding:.3em 0}.ph-sect-planet{gap:.12em}.ph-sect-planet::before{margin-right:.12em}.ph-sect-status-full{display:none}.ph-sect-status-short{display:inline}.ph-sect-statuses{gap:.12em}.ph-sect-glyph-host{width:1.28em;height:1.28em;flex-basis:1.28em}}',
      '@media(max-width:420px){.ph-sect-line{font-size:10px;gap:.18em}.ph-sect-planet::before{margin-right:.08em}.ph-sect-statuses{gap:.08em}}'
    ].join('');
    document.head.appendChild(style);
  }

  function ensureLine() {
    let line = document.getElementById('phSectLine');
    const grid = document.querySelector('.ph-summary-grid-consolidated');
    if (!grid) return null;
    if (!line) {
      line = document.createElement('div');
      line.id = 'phSectLine';
      line.className = 'ph-sect-line';
      line.dataset.method = 'al-biruni';
      line.setAttribute('aria-live', 'polite');
    }
    const table = document.getElementById('tableSection');
    if (table && table.parentElement === grid) grid.insertBefore(line, table);
    else if (line.parentElement !== grid) grid.appendChild(line);
    return line;
  }

  function fitLine(line) {
    if (!line?.parentElement) return;
    line.style.removeProperty('font-size');
    requestAnimationFrame(() => {
      const available = Math.max(1, line.clientWidth - 2);
      const natural = Math.max(1, line.scrollWidth);
      if (natural <= available) return;
      const current = parseFloat(getComputedStyle(line).fontSize) || 11;
      line.style.fontSize = Math.max(8.5, current * available / natural).toFixed(2) + 'px';
    });
  }

  function glyph(container, id, title, generation) {
    const registry = window.RelphiGlyphRegistry;
    const component = window.RelphiGlyphComponent;
    const entry = registry?.get(id) || registry?.resolve(id);
    if (!entry || !component?.draw) throw new Error('Canonical glyph unavailable: ' + id);
    const host = document.createElement('span');
    host.className = 'ph-sect-glyph-host';
    host.setAttribute('role', 'img');
    host.setAttribute('aria-label', entry.name);
    if (title) host.title = title;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('ph-sect-glyph');
    svg.setAttribute('viewBox', '-19 -19 38 38');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    host.appendChild(svg);
    container.appendChild(host);
    return Promise.resolve(component.draw(svg, entry.id, { radius:18, padding:0, color:'currentColor' })).then(() => {
      if (generation !== renderGeneration) host.remove();
    });
  }

  function status(container, full, short, title) {
    const item = document.createElement('span');
    item.className = 'ph-sect-status';
    if (title) item.title = title;
    const fullNode = document.createElement('span');
    fullNode.className = 'ph-sect-status-full';
    fullNode.textContent = full;
    const shortNode = document.createElement('span');
    shortNode.className = 'ph-sect-status-short';
    shortNode.textContent = short;
    item.append(fullNode, shortNode);
    container.appendChild(item);
  }

  function planetToken(position, result, generation) {
    const token = document.createElement('span');
    token.className = 'ph-sect-planet';
    const jobs = [glyph(token, position.id, position.body, generation)];
    const statuses = document.createElement('span');
    statuses.className = 'ph-sect-statuses';
    token.appendChild(statuses);

    if (position.isLight) status(statuses, 'Light', 'L', 'Sect light');
    if (position.isBenefic) status(statuses, 'Benefic', 'B', 'Benefic of sect');
    if (position.isMalefic) status(statuses, 'Malefic', 'M', 'Malefic of sect');
    if (position.id === 'mercury') status(statuses, position.sect === 'diurnal' ? 'Diurnal' : 'Nocturnal', position.sect === 'diurnal' ? 'D' : 'N', result.mercury.phase);
    status(statuses, position.ofSect ? 'Sect' : 'Contrary', position.ofSect ? 'S' : 'C', position.ofSect ? 'Of sect' : 'Contrary to sect');
    if (position.halb) status(statuses, 'Halb', 'H', 'In Halb');
    if (position.hayz) status(statuses, 'Hayz', 'Y', 'In Hayz');

    token.title = [
      position.body,
      position.isLight ? 'sect light' : '',
      position.isBenefic ? 'benefic of sect' : '',
      position.isMalefic ? 'malefic of sect' : '',
      position.id === 'mercury' ? result.mercury.phase : '',
      position.ofSect ? 'of sect' : 'contrary to sect',
      position.halb ? 'Halb' : '',
      position.hayz ? 'Hayz' : ''
    ].filter(Boolean).join(' · ');
    return { token, jobs };
  }

  async function render(force) {
    const line = ensureLine();
    if (!line || !window.Astronomy || !window.RelphiGlyphRegistry || !window.RelphiGlyphComponent?.draw) return;
    const context = activeContext();
    if (!context) return;
    const signature = [Math.floor(context.instant.getTime() / 15000), context.latitude.toFixed(5), context.longitude.toFixed(5), isPreviewing() ? 'preview' : 'active'].join('|');
    if (!force && signature === lastSignature) return;
    lastSignature = signature;

    const generation = ++renderGeneration;
    try {
      const result = calculate(context);
      line.replaceChildren();
      line.removeAttribute('title');
      const heading = document.createElement('span');
      heading.className = 'ph-sect-heading';
      heading.textContent = result.chartSect === 'diurnal' ? 'Day Sect' : 'Night Sect';
      heading.title = result.sunAbove ? 'Sun above the local horizon' : 'Sun below the local horizon';
      line.appendChild(heading);

      const jobs = [];
      PLANETS.forEach(definition => {
        const built = planetToken(result.positions.get(definition.id), result, generation);
        line.appendChild(built.token);
        jobs.push(...built.jobs);
      });

      line.setAttribute('aria-label', (result.chartSect === 'diurnal' ? 'Day sect. ' : 'Night sect. ') + PLANETS.map(definition => {
        const p = result.positions.get(definition.id);
        const parts = [p.body];
        if (p.isLight) parts.push('sect light');
        if (p.isBenefic) parts.push('benefic of sect');
        if (p.isMalefic) parts.push('malefic of sect');
        if (p.id === 'mercury') parts.push(result.mercury.sect, result.mercury.phase);
        parts.push(p.ofSect ? 'of sect' : 'contrary to sect');
        if (p.halb) parts.push('Halb');
        if (p.hayz) parts.push('Hayz');
        return parts.join(', ');
      }).join('. '));

      await Promise.allSettled(jobs);
      if (generation === renderGeneration) fitLine(line);
    } catch (error) {
      console.error('[Relphi Planetary Hours Sect]', error);
      if (generation === renderGeneration) {
        line.textContent = 'Sect unavailable';
        line.title = String(error?.message || error);
      }
    }
  }

  function schedule(force) {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      setTimeout(() => { void render(Boolean(force)); }, 0);
    });
  }

  function observeAuthoritativeMoment() {
    const card = document.getElementById('phCurrentWheelCard');
    const label = document.getElementById('heptagramHourLabel');
    if (!window.MutationObserver) return;
    const observer = new MutationObserver(() => schedule(true));
    if (card) observer.observe(card, { attributes:true, attributeFilter:['href'] });
    if (label) observer.observe(label, { childList:true, characterData:true, subtree:true });
  }

  function start() {
    ensureStyle();
    ensureLine();
    observeAuthoritativeMoment();
    document.addEventListener('change', event => { if (WATCH_IDS.has(event.target?.id)) schedule(true); }, true);
    document.addEventListener('input', event => { if (WATCH_IDS.has(event.target?.id)) schedule(false); }, true);
    document.addEventListener('click', event => { if (WATCH_IDS.has(event.target?.id)) setTimeout(() => schedule(true), 40); }, true);
    window.addEventListener('resize', () => { const line = document.getElementById('phSectLine'); if (line) fitLine(line); });
    schedule(true);
    setInterval(() => {
      if (document.getElementById('useSystem')?.checked !== false && !isPreviewing()) schedule(false);
    }, 15000);
  }

  window.RelphiPlanetaryHoursSect = Object.freeze({ calculate, render });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
