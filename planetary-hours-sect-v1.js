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

  function normDeg(value) {
    const number = Number(value) || 0;
    return ((number % 360) + 360) % 360;
  }

  function signedDeg(value) {
    const normalized = normDeg(value);
    return normalized > 180 ? normalized - 360 : normalized;
  }

  function isPreviewing() {
    return /^Previewing\b/i.test(document.getElementById('heptagramHourLabel')?.textContent?.trim() || '');
  }

  function zone() {
    return document.getElementById('tzSelect')?.value || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }

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
      if (!instant || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      return { instant, latitude, longitude, timeZone };
    } catch (error) {
      return null;
    }
  }

  function controlsContext() {
    const latitude = Number(document.getElementById('lat')?.value);
    const longitude = Number(document.getElementById('lon')?.value);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    const timeZone = zone();
    const useSystem = document.getElementById('useSystem')?.checked !== false;
    if (useSystem) return { instant:new Date(), latitude, longitude, timeZone };
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
    const astronomy = window.Astronomy;
    if (!astronomy) throw new Error('Astronomy Engine is unavailable.');
    if (body === 'Moon' && typeof astronomy.EclipticGeoMoon === 'function') return normDeg(astronomy.EclipticGeoMoon(instant).lon);
    return normDeg(astronomy.Ecliptic(astronomy.GeoVector(body, instant, true)).elon);
  }

  function altitude(body, instant, observer) {
    const astronomy = window.Astronomy;
    const equator = astronomy.Equator(body, instant, observer, true, true);
    return Number(astronomy.Horizon(instant, observer, equator.ra, equator.dec, 'normal').altitude);
  }

  function signGender(longitude) {
    return Math.floor(normDeg(longitude) / 30) % 2 === 0 ? 'masculine' : 'feminine';
  }

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

    positions.forEach(position => {
      const definition = PLANET_BY_ID.get(position.id);
      position.sect = definition.sect === 'variable' ? mercury.sect : definition.sect;
      position.gender = definition.gender === 'variable' ? mercury.gender : definition.gender;
      position.above = position.altitude >= 0;
      position.ofSect = position.sect === chartSect;
      position.halb = position.sect === 'diurnal' ? position.above === sunAbove : position.above !== sunAbove;
      position.hayz = position.ofSect && position.halb && position.signGender === position.gender;
    });

    return {
      chartSect,
      sunAbove,
      sectLight:chartSect === 'diurnal' ? 'sun' : 'moon',
      sectBenefic:chartSect === 'diurnal' ? 'jupiter' : 'venus',
      sectMalefic:chartSect === 'diurnal' ? 'saturn' : 'mars',
      mercury,
      halb:Array.from(positions.values()).filter(position => position.halb).map(position => position.id),
      hayz:Array.from(positions.values()).filter(position => position.hayz).map(position => position.id),
      ofSect:Array.from(positions.values()).filter(position => position.ofSect).map(position => position.id),
      contrary:Array.from(positions.values()).filter(position => !position.ofSect).map(position => position.id),
      positions
    };
  }

  function ensureStyle() {
    if (document.getElementById('ph-sect-style-v1')) return;
    const style = document.createElement('style');
    style.id = 'ph-sect-style-v1';
    style.textContent = [
      '.ph-sect-line{grid-column:1/-1;display:flex;align-items:center;justify-content:center;gap:.55em;width:100%;max-width:100%;margin:.25rem 0 .1rem;padding:.38em .15em;box-sizing:border-box;white-space:nowrap;overflow:visible;font-size:12.5px;line-height:1.15;color:#2f2a27}',
      '.ph-sect-part{display:inline-flex;align-items:center;gap:.24em;flex:0 0 auto}',
      '.ph-sect-part+.ph-sect-part::before{content:"·";margin-right:.3em;color:#8a817a;font-weight:900}',
      '.ph-sect-label{font-weight:900;color:#514943}',
      '.ph-sect-value{font-weight:800}',
      '.ph-sect-glyph-host{display:inline-grid;place-items:center;width:1.42em;height:1.42em;flex:0 0 1.42em;vertical-align:-.14em}',
      '.ph-sect-glyph{display:block;width:100%;height:100%;overflow:visible}',
      '@media(max-width:760px){.ph-sect-line{margin:.15rem 0 .05rem;padding:.3em .05em}}'
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
    line.style.fontSize = '12.5px';
    const available = Math.max(1, line.parentElement.clientWidth - 8);
    const natural = Math.max(1, line.scrollWidth);
    if (natural <= available) return;
    const fitted = Math.max(7.25, 12.5 * available / natural);
    line.style.fontSize = fitted.toFixed(2) + 'px';
  }

  function part(label, title) {
    const node = document.createElement('span');
    node.className = 'ph-sect-part';
    if (title) node.title = title;
    if (label) {
      const labelNode = document.createElement('span');
      labelNode.className = 'ph-sect-label';
      labelNode.textContent = label;
      node.appendChild(labelNode);
    }
    return node;
  }

  function valueText(container, text) {
    const value = document.createElement('span');
    value.className = 'ph-sect-value';
    value.textContent = text;
    container.appendChild(value);
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

  function glyphList(container, ids, generation, titlePrefix) {
    if (!ids.length) {
      valueText(container, 'none');
      return [];
    }
    return ids.map(id => glyph(container, id, titlePrefix ? titlePrefix + PLANET_BY_ID.get(id).body : '', generation));
  }

  async function render(force) {
    const line = ensureLine();
    if (!line) return;
    if (!window.Astronomy || !window.RelphiGlyphRegistry || !window.RelphiGlyphComponent?.draw) return;
    const context = activeContext();
    if (!context) return;
    const signature = [
      Math.floor(context.instant.getTime() / 15000),
      context.latitude.toFixed(5),
      context.longitude.toFixed(5),
      isPreviewing() ? 'preview' : 'active'
    ].join('|');
    if (!force && signature === lastSignature) return;
    lastSignature = signature;

    const generation = ++renderGeneration;
    try {
      const result = calculate(context);
      line.replaceChildren();
      line.removeAttribute('title');
      const jobs = [];

      const sect = part('Sect', result.sunAbove ? 'Sun is above the local horizon: day sect.' : 'Sun is below the local horizon: night sect.');
      valueText(sect, result.chartSect === 'diurnal' ? 'Day' : 'Night');
      line.appendChild(sect);

      const light = part('Light', 'The luminary of sect.');
      jobs.push(glyph(light, result.sectLight, 'Sect light', generation));
      line.appendChild(light);

      const benefic = part('Benefic', 'Benefic belonging to the chart sect.');
      jobs.push(glyph(benefic, result.sectBenefic, 'Benefic of sect', generation));
      line.appendChild(benefic);

      const malefic = part('Malefic', 'Malefic belonging to the chart sect.');
      jobs.push(glyph(malefic, result.sectMalefic, 'Malefic of sect', generation));
      line.appendChild(malefic);

      const mercury = part('Mercury', result.mercury.phase + ': Mercury is treated as ' + result.mercury.sect + ' and ' + result.mercury.gender + ' here.');
      jobs.push(glyph(mercury, 'mercury', result.mercury.phase, generation));
      valueText(mercury, result.mercury.sect === 'diurnal' ? 'Diurnal' : 'Nocturnal');
      line.appendChild(mercury);

      const ofSect = part('Of sect', 'Planets whose own sect matches this day/night chart.');
      jobs.push(...glyphList(ofSect, result.ofSect, generation, 'Of sect: '));
      line.appendChild(ofSect);

      const contrary = part('Contrary', 'Planets whose own sect is opposite the chart sect.');
      jobs.push(...glyphList(contrary, result.contrary, generation, 'Contrary to sect: '));
      line.appendChild(contrary);

      const halb = part('Halb', 'Halb: diurnal planets share the Sun’s horizon hemisphere; nocturnal planets occupy the opposite hemisphere.');
      jobs.push(...glyphList(halb, result.halb, generation, 'In Halb: '));
      line.appendChild(halb);

      const hayz = part('Hayz', 'Hayz: a planet belongs to the chart sect, is in Halb, and is in a sign matching its gender.');
      jobs.push(...glyphList(hayz, result.hayz, generation, 'In Hayz: '));
      line.appendChild(hayz);

      const names = ids => ids.map(id => PLANET_BY_ID.get(id).body).join(', ') || 'none';
      line.setAttribute('aria-label', [
        (result.chartSect === 'diurnal' ? 'Day' : 'Night') + ' sect',
        'sect light ' + PLANET_BY_ID.get(result.sectLight).body,
        'benefic of sect ' + PLANET_BY_ID.get(result.sectBenefic).body,
        'malefic of sect ' + PLANET_BY_ID.get(result.sectMalefic).body,
        'Mercury ' + result.mercury.sect,
        'of sect ' + names(result.ofSect),
        'contrary ' + names(result.contrary),
        'Halb ' + names(result.halb),
        'Hayz ' + names(result.hayz)
      ].join('. '));

      await Promise.allSettled(jobs);
      if (generation === renderGeneration) requestAnimationFrame(() => fitLine(line));
    } catch (error) {
      console.error('[Relphi Planetary Hours Sect]', error);
      if (generation === renderGeneration) {
        line.replaceChildren();
        valueText(line, 'Sect unavailable');
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
    window.addEventListener('resize', () => { const line = document.getElementById('phSectLine'); if (line) requestAnimationFrame(() => fitLine(line)); });
    schedule(true);
    setInterval(() => {
      if (document.getElementById('useSystem')?.checked !== false && !isPreviewing()) schedule(false);
    }, 15000);
  }

  window.RelphiPlanetaryHoursSect = Object.freeze({ calculate, render });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
