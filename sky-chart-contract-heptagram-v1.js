// Data-driven Planetary Hours heptagram flaps for canonical Sky cards.
// Geometry and progression follow the Planetary Hours living heptagram:
// sunrise-to-sunrise day, Chaldean 24-hour sequence, weekday star path,
// partial day/hour traces, and canonical planetary glyphs.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyContractHeptagramV1) return;
  window.__relphiSkyContractHeptagramV1 = true;

  const NS = 'http://www.w3.org/2000/svg';
  const KEYS = { A:'relphiSkyChartA', B:'relphiSkyChartB' };
  const CHALDEAN = ['saturn','jupiter','mars','sun','venus','mercury','moon'];
  const WEEK_PATH = ['sun','moon','mars','mercury','jupiter','venus','saturn','sun'];
  const WEEKDAY_RULER = { 0:'sun', 1:'moon', 2:'mars', 3:'mercury', 4:'jupiter', 5:'venus', 6:'saturn' };
  const PLANET_NAME = { saturn:'Saturn', jupiter:'Jupiter', mars:'Mars', sun:'Sun', venus:'Venus', mercury:'Mercury', moon:'Moon' };
  const PLANET_COLOR = { saturn:'#8c7a42', jupiter:'#41752f', mars:'#dc1f18', sun:'#d08a00', venus:'#b23b79', mercury:'#277390', moon:'#58628a' };
  const CENTER = { x:180, y:180 };
  const POINT_RADIUS = 118;
  const SOLAR_ZENITH = 90.833;
  let observer = null;
  let queued = false;

  const svgNode = (name, attrs) => {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs || {}).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  };
  const radians = degrees => degrees * Math.PI / 180;
  const degrees = radiansValue => radiansValue * 180 / Math.PI;
  const normalizeDegrees = value => ((value % 360) + 360) % 360;
  const normalizeHours = value => ((value % 24) + 24) % 24;

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }

  function profile(payload) {
    const existing = payload?.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {};
    const notes = String(payload?.notes || '');
    const instant = notes.match(/Motion state sampled around\s+(\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?Z)/i)?.[1] || '';
    const coordinates = notes.match(/latitude\s+(-?\d+(?:\.\d+)?)\s+and longitude\s+(-?\d+(?:\.\d+)?)/i);
    const timeZone = existing.timeZone || notes.match(/Time zone:\s*([^\.]+)\./i)?.[1]?.trim() || 'UTC';
    const location = existing.location || notes.match(/Location:\s*(.+?)\.\s*Time zone:/i)?.[1]?.trim() || '';
    return {
      dateTime:existing.dateTime || '',
      instant,
      latitude:existing.latitude ?? coordinates?.[1] ?? '',
      longitude:existing.longitude ?? coordinates?.[2] ?? '',
      timeZone,
      location
    };
  }

  function formatterParts(date, timeZone) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year:'numeric', month:'2-digit', day:'2-digit',
      hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23'
    }).formatToParts(date);
    const values = Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));
    return { year:values.year, month:values.month, day:values.day, hour:values.hour, minute:values.minute, second:values.second };
  }

  function localDateTimeToInstant(value, timeZone) {
    const match = String(value || '').match(/^(\d{4})-(\d\d)-(\d\d)[T ](\d\d):(\d\d)(?::(\d\d))?/);
    if (!match) return null;
    const target = { year:Number(match[1]), month:Number(match[2]), day:Number(match[3]), hour:Number(match[4]), minute:Number(match[5]), second:Number(match[6] || 0) };
    const targetStamp = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute, target.second);
    let instant = targetStamp;
    try {
      for (let pass = 0; pass < 4; pass += 1) {
        const observed = formatterParts(new Date(instant), timeZone);
        const observedStamp = Date.UTC(observed.year, observed.month - 1, observed.day, observed.hour, observed.minute, observed.second);
        const correction = targetStamp - observedStamp;
        instant += correction;
        if (Math.abs(correction) < 1000) break;
      }
      return new Date(instant);
    } catch (_) {
      const fallback = new Date(value);
      return Number.isNaN(fallback.getTime()) ? null : fallback;
    }
  }

  function context(payload) {
    const value = profile(payload);
    const latitude = Number(value.latitude);
    const longitude = Number(value.longitude);
    let sample = value.dateTime ? localDateTimeToInstant(value.dateTime, value.timeZone) : null;
    if (!sample && value.instant) sample = new Date(value.instant);
    if (!sample || Number.isNaN(sample.getTime()) || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { sample, latitude, longitude, timeZone:value.timeZone || 'UTC', location:value.location || payload?.name || '' };
  }

  function localDateParts(date, timeZone) {
    const parts = formatterParts(date, timeZone);
    return { year:parts.year, month:parts.month, day:parts.day };
  }

  function addLocalDays(parts, amount) {
    const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + amount, 12));
    return { year:date.getUTCFullYear(), month:date.getUTCMonth() + 1, day:date.getUTCDate() };
  }

  function dayOfYear(parts) {
    const start = Date.UTC(parts.year, 0, 1);
    const current = Date.UTC(parts.year, parts.month - 1, parts.day);
    return Math.floor((current - start) / 86400000) + 1;
  }

  function sameLocalDate(date, parts, timeZone) {
    const value = localDateParts(date, timeZone);
    return value.year === parts.year && value.month === parts.month && value.day === parts.day;
  }

  function solarUtcHour(parts, latitude, longitude, rising) {
    const n = dayOfYear(parts);
    const longitudeHour = longitude / 15;
    const t = n + ((rising ? 6 : 18) - longitudeHour) / 24;
    const meanAnomaly = 0.9856 * t - 3.289;
    let trueLongitude = meanAnomaly + 1.916 * Math.sin(radians(meanAnomaly)) + 0.020 * Math.sin(radians(2 * meanAnomaly)) + 282.634;
    trueLongitude = normalizeDegrees(trueLongitude);
    let rightAscension = degrees(Math.atan(0.91764 * Math.tan(radians(trueLongitude))));
    rightAscension = normalizeDegrees(rightAscension);
    const longitudeQuadrant = Math.floor(trueLongitude / 90) * 90;
    const ascensionQuadrant = Math.floor(rightAscension / 90) * 90;
    rightAscension = (rightAscension + longitudeQuadrant - ascensionQuadrant) / 15;
    const sinDeclination = 0.39782 * Math.sin(radians(trueLongitude));
    const cosDeclination = Math.cos(Math.asin(sinDeclination));
    const cosHour = (Math.cos(radians(SOLAR_ZENITH)) - sinDeclination * Math.sin(radians(latitude))) / (cosDeclination * Math.cos(radians(latitude)));
    if (cosHour > 1 || cosHour < -1) return NaN;
    let hourAngle = rising ? 360 - degrees(Math.acos(cosHour)) : degrees(Math.acos(cosHour));
    hourAngle /= 15;
    const localMeanTime = hourAngle + rightAscension - 0.06571 * t - 6.622;
    return normalizeHours(localMeanTime - longitudeHour);
  }

  function solarEvent(parts, latitude, longitude, timeZone, rising) {
    if (window.SunCalc?.getTimes) {
      try {
        const noon = localDateTimeToInstant(`${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}T12:00`, timeZone);
        const times = window.SunCalc.getTimes(noon, latitude, longitude);
        const event = rising ? times.sunrise : times.sunset;
        if (event instanceof Date && !Number.isNaN(event.getTime())) return event;
      } catch (_) {}
    }
    const utcHour = solarUtcHour(parts, latitude, longitude, rising);
    if (!Number.isFinite(utcHour)) return null;
    const base = Date.UTC(parts.year, parts.month - 1, parts.day) + utcHour * 3600000;
    const candidates = [-1, 0, 1].map(offset => new Date(base + offset * 86400000));
    return candidates.find(date => sameLocalDate(date, parts, timeZone)) || new Date(base);
  }

  function solarTimes(parts, latitude, longitude, timeZone) {
    const sunrise = solarEvent(parts, latitude, longitude, timeZone, true);
    const sunset = solarEvent(parts, latitude, longitude, timeZone, false);
    if (sunrise && sunset && sunset > sunrise) return { sunrise, sunset };
    const fallbackRise = localDateTimeToInstant(`${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}T06:00`, timeZone);
    const fallbackSet = localDateTimeToInstant(`${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}T18:00`, timeZone);
    return { sunrise:fallbackRise, sunset:fallbackSet };
  }

  function dayFrame(ctx) {
    const todayParts = localDateParts(ctx.sample, ctx.timeZone);
    const today = solarTimes(todayParts, ctx.latitude, ctx.longitude, ctx.timeZone);
    if (ctx.sample >= today.sunrise) {
      const nextParts = addLocalDays(todayParts, 1);
      const next = solarTimes(nextParts, ctx.latitude, ctx.longitude, ctx.timeZone);
      return { start:today.sunrise, sunrise:today.sunrise, sunset:today.sunset, end:next.sunrise, sample:ctx.sample };
    }
    const previousParts = addLocalDays(todayParts, -1);
    const previous = solarTimes(previousParts, ctx.latitude, ctx.longitude, ctx.timeZone);
    return { start:previous.sunrise, sunrise:previous.sunrise, sunset:previous.sunset, end:today.sunrise, sample:ctx.sample };
  }

  function weekdayIndex(date, timeZone) {
    const name = new Intl.DateTimeFormat('en-US', { timeZone, weekday:'short' }).format(date);
    return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(name);
  }

  function rotateTo(dayKey) {
    const start = CHALDEAN.indexOf(dayKey);
    return Array.from({ length:24 }, (_, index) => CHALDEAN[(start + index) % 7]);
  }

  function buildHours(frame, dayKey) {
    const sequence = rotateTo(dayKey);
    const daylight = frame.sunset.getTime() - frame.sunrise.getTime();
    const night = frame.end.getTime() - frame.sunset.getTime();
    const brightLength = daylight / 12;
    const darkLength = night / 12;
    const rows = [];
    let timestamp = frame.start.getTime();
    for (let index = 0; index < 24; index += 1) {
      const isBright = index < 12;
      const length = isBright ? brightLength : darkLength;
      rows.push({ index:index + 1, key:sequence[index], start:new Date(timestamp), end:new Date(timestamp + length), isBright });
      timestamp += length;
    }
    return rows;
  }

  function currentHour(rows, sample) {
    const timestamp = sample.getTime();
    const index = rows.findIndex(row => timestamp >= row.start.getTime() && timestamp < row.end.getTime());
    return Math.max(0, index < 0 ? (timestamp < rows[0].start.getTime() ? 0 : rows.length - 1) : index);
  }

  function pointFor(key) {
    const index = CHALDEAN.indexOf(key);
    const angle = radians(-90 + index * (360 / CHALDEAN.length));
    return { x:CENTER.x + Math.cos(angle) * POINT_RADIUS, y:CENTER.y + Math.sin(angle) * POINT_RADIUS };
  }

  function line(parent, aKey, bKey, className, fraction) {
    const a = pointFor(aKey), b = pointFor(bKey);
    const amount = fraction == null ? 1 : Math.max(0, Math.min(1, Number(fraction) || 0));
    parent.appendChild(svgNode('line', {
      x1:a.x.toFixed(2), y1:a.y.toFixed(2),
      x2:(a.x + (b.x - a.x) * amount).toFixed(2),
      y2:(a.y + (b.y - a.y) * amount).toFixed(2),
      class:className
    }));
  }

  function formatTime(date, timeZone) {
    return new Intl.DateTimeFormat('en-US', { timeZone, hour:'numeric', minute:'2-digit' }).format(date);
  }

  async function renderSvg(svg, ctx) {
    const frame = dayFrame(ctx);
    const dayKey = WEEKDAY_RULER[weekdayIndex(frame.start, ctx.timeZone)];
    const rows = buildHours(frame, dayKey);
    const hourIndex = currentHour(rows, frame.sample);
    const row = rows[hourIndex];
    const hourSpan = Math.max(1, row.end.getTime() - row.start.getTime());
    const hourFraction = Math.max(0, Math.min(.999, (frame.sample.getTime() - row.start.getTime()) / hourSpan));
    const selectedPosition = hourIndex + 1 + hourFraction;
    const dayFraction = Math.max(0, Math.min(1, (selectedPosition - 1) / 23));
    const weekIndex = Math.max(0, WEEK_PATH.indexOf(dayKey));

    svg.replaceChildren();
    svg.setAttribute('viewBox', '0 0 360 360');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `${PLANET_NAME[dayKey]} day, ${PLANET_NAME[row.key]} hour, ${formatTime(row.start, ctx.timeZone)} to ${formatTime(row.end, ctx.timeZone)}`);
    svg.appendChild(svgNode('circle', { cx:180, cy:180, r:118, class:'relphi-contract-heptagram-circle' }));
    svg.appendChild(svgNode('circle', { cx:180, cy:180, r:78, class:'relphi-contract-heptagram-guide' }));

    for (let index = 0; index < 7; index += 1) {
      const a = WEEK_PATH[index], b = WEEK_PATH[index + 1];
      if (index < weekIndex) line(svg, a, b, 'relphi-contract-heptagram-star past');
      else if (index === weekIndex) {
        line(svg, a, b, 'relphi-contract-heptagram-star future');
        line(svg, a, b, 'relphi-contract-heptagram-star current', dayFraction);
      } else line(svg, a, b, 'relphi-contract-heptagram-star future');
    }

    for (let index = 0; index < 23; index += 1) {
      if (index < hourIndex) line(svg, rows[index].key, rows[index + 1].key, 'relphi-contract-heptagram-hour past');
      else if (index === hourIndex) {
        line(svg, rows[index].key, rows[index + 1].key, 'relphi-contract-heptagram-hour future');
        line(svg, rows[index].key, rows[index + 1].key, 'relphi-contract-heptagram-hour current', hourFraction);
      } else line(svg, rows[index].key, rows[index + 1].key, 'relphi-contract-heptagram-hour future');
    }

    const jobs = [];
    CHALDEAN.forEach(key => {
      const point = pointFor(key);
      const group = svgNode('g', { transform:`translate(${point.x} ${point.y})`, style:`color:${PLANET_COLOR[key]}` });
      const circle = svgNode('circle', {
        cx:0, cy:0, r:18,
        class:'relphi-contract-heptagram-node' + (key === row.key ? ' current' : '') + (key === dayKey ? ' day-ruler' : '')
      });
      const glyph = svgNode('g', { class:'relphi-contract-heptagram-glyph', 'pointer-events':'none' });
      group.append(circle, glyph);
      svg.appendChild(group);
      const component = window.RelphiGlyphComponent;
      const entry = window.RelphiGlyphRegistry?.get(key) || window.RelphiGlyphRegistry?.resolve(key);
      if (!component?.draw || !entry) {
        group.remove();
        return;
      }
      jobs.push(component.draw(glyph, entry.id, { radius:12, padding:1, color:'currentColor' }));
    });
    await Promise.allSettled(jobs);
    svg.dataset.ready = 'true';
    return { dayKey, hourKey:row.key, row, frame };
  }

  async function decorateCard(slot, payload) {
    const panel = document.getElementById(slot === 'A' ? 'relphiSkyAPanel' : 'relphiSkyBPanel');
    const header = panel?.querySelector('.relphi-contract-card-header');
    const chip = header?.querySelector('.relphi-contract-sky-chip');
    if (!header || !chip) return;
    const ctx = context(payload);
    let link = header.querySelector('.relphi-contract-heptagram-link');
    if (!link) {
      link = document.createElement('a');
      link.className = 'relphi-contract-heptagram-link';
      link.innerHTML = '<svg class="relphi-contract-heptagram-svg" viewBox="0 0 360 360"></svg><span class="relphi-contract-heptagram-caption">Planetary Hours</span>';
      chip.insertAdjacentElement('afterend', link);
    }
    if (!ctx) {
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
      link.querySelector('svg')?.replaceWith(Object.assign(document.createElement('span'), { className:'relphi-contract-heptagram-error', textContent:'Time/place unavailable' }));
      return;
    }
    const signature = JSON.stringify([ctx.sample.toISOString(), ctx.latitude, ctx.longitude, ctx.timeZone, ctx.location]);
    if (link.dataset.signature === signature && link.querySelector('svg[data-ready="true"]')) return;
    link.dataset.signature = signature;
    link.removeAttribute('aria-disabled');
    const params = new URLSearchParams({ lat:String(ctx.latitude), lon:String(ctx.longitude), tz:ctx.timeZone, loc:ctx.location, dt:ctx.sample.toISOString() });
    link.href = 'planetaryhours.html#' + params.toString();
    link.setAttribute('aria-label', `Open ${payload?.name || 'Sky ' + slot} in Planetary Hours`);
    let svg = link.querySelector('svg');
    if (!svg) {
      link.querySelector('.relphi-contract-heptagram-error')?.remove();
      svg = svgNode('svg', { class:'relphi-contract-heptagram-svg', viewBox:'0 0 360 360' });
      link.prepend(svg);
    }
    try {
      const result = await renderSvg(svg, ctx);
      const caption = link.querySelector('.relphi-contract-heptagram-caption');
      if (caption) caption.textContent = `${PLANET_NAME[result.dayKey]} · ${PLANET_NAME[result.hourKey]}`;
      link.title = `${PLANET_NAME[result.dayKey]} day · ${PLANET_NAME[result.hourKey]} hour · ${formatTime(result.row.start, ctx.timeZone)}–${formatTime(result.row.end, ctx.timeZone)}`;
    } catch (error) {
      console.error('Sky-card Planetary Hours heptagram failed:', error);
      svg.replaceWith(Object.assign(document.createElement('span'), { className:'relphi-contract-heptagram-error', textContent:'Heptagram unavailable' }));
    }
  }

  function decorate() {
    queued = false;
    const a = read(KEYS.A), b = read(KEYS.B);
    Promise.allSettled([decorateCard('A', a), decorateCard('B', b)]);
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(decorate);
  }

  function start() {
    queue();
    const root = document.getElementById('relphiSkyChartContractRoot');
    if (root) {
      observer = new MutationObserver(mutations => {
        if (mutations.some(mutation => Array.from(mutation.addedNodes).some(node => node.nodeType === 1 && (node.matches?.('.relphi-contract-card-header') || node.querySelector?.('.relphi-contract-card-header'))))) queue();
      });
      observer.observe(root, { childList:true, subtree:true });
    }
    window.addEventListener('relphi:sky-chart-next-display-ready', queue);
    window.addEventListener('storage', event => { if (!event.key || event.key === KEYS.A || event.key === KEYS.B) queue(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
