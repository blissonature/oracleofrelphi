// Complete, compact Planetary Hours heptagrams for skinny Sky Cards.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const KEYS = { skyA:'relphiSkyChartA', skyB:'relphiSkyChartB' };
  const CHALDEAN = ['saturn','jupiter','mars','sun','venus','mercury','moon'];
  const WEEKDAY_RULER = {0:'sun',1:'moon',2:'mars',3:'mercury',4:'jupiter',5:'venus',6:'saturn'};
  let dependenciesPromise = null;
  let queued = false;

  function read(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } }
  function profile(payload) { return payload && payload.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {}; }
  function loadScript(src, test) {
    if (test()) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      const base = src.split('?')[0];
      let script = document.querySelector('script[src^="' + base + '"]');
      if (script) {
        script.addEventListener('load', resolve, {once:true});
        script.addEventListener('error', reject, {once:true});
        return;
      }
      script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.addEventListener('load', resolve, {once:true});
      script.addEventListener('error', reject, {once:true});
      document.head.appendChild(script);
    });
  }
  function dependencies() {
    if (!dependenciesPromise) dependenciesPromise = Promise.all([
      loadScript('https://unpkg.com/suncalc@1.9.0/suncalc.js', function () { return !!window.SunCalc; }),
      loadScript('https://cdn.jsdelivr.net/npm/luxon@3/build/global/luxon.min.js', function () { return !!window.luxon?.DateTime; }),
      loadScript('planetary-hours-heptagram-component-v1.js?v=1', function () { return !!window.RelphiPlanetaryHoursHeptagram; })
    ]);
    return dependenciesPromise;
  }
  function dataFor(slot) {
    const payload = read(KEYS[slot]);
    const p = profile(payload);
    const lat = Number(p.latitude), lon = Number(p.longitude);
    if (!payload || !p.dateTime || !Number.isFinite(lat) || !Number.isFinite(lon) || !p.timeZone) return null;
    return { payload, datetime:String(p.dateTime), lat, lon, tz:String(p.timeZone), loc:String(p.location || '') };
  }
  function localNoon(dt) { return dt.startOf('day').plus({hours:12}).toJSDate(); }
  function momentFor(data) {
    const DateTime = window.luxon.DateTime;
    const selected = DateTime.fromISO(data.datetime, {zone:data.tz});
    if (!selected.isValid) throw new Error('Invalid selected date or time');
    const instant = selected.toJSDate();
    let dayDate = selected;
    let times = SunCalc.getTimes(localNoon(selected), data.lat, data.lon);
    let sunrise = times.sunrise, sunset = times.sunset;
    if (!(sunrise instanceof Date) || !(sunset instanceof Date)) throw new Error('Sunrise unavailable');
    if (instant < sunrise) {
      dayDate = selected.minus({days:1});
      times = SunCalc.getTimes(localNoon(dayDate), data.lat, data.lon);
      sunrise = times.sunrise;
      sunset = times.sunset;
    }
    const nextSunrise = SunCalc.getTimes(localNoon(dayDate.plus({days:1})), data.lat, data.lon).sunrise;
    if (!(nextSunrise instanceof Date)) throw new Error('Next sunrise unavailable');
    const bright = instant >= sunrise && instant < sunset;
    const halfStart = bright ? sunrise : sunset;
    const halfEnd = bright ? sunset : nextSunrise;
    const hourLength = (halfEnd - halfStart) / 12;
    const elapsed = Math.max(0, Math.min(12, (instant - halfStart) / hourLength));
    const halfIndex = Math.max(0, Math.min(11, Math.floor(elapsed)));
    const ordinalIndex = bright ? halfIndex : 12 + halfIndex;
    const hourProgress = Math.max(0, Math.min(1, elapsed - halfIndex));
    const localSunrise = DateTime.fromJSDate(sunrise).setZone(data.tz);
    const dayRuler = WEEKDAY_RULER[localSunrise.weekday % 7];
    const sequence24 = Array.from({length:24}, function (_, i) {
      return CHALDEAN[(CHALDEAN.indexOf(dayRuler) + i) % 7];
    });
    return { dayRuler, sequence24, selectedPosition:ordinalIndex + 1 + hourProgress };
  }
  function linkFor(data) {
    const url = new URL('planetaryhours.html', location.href);
    url.searchParams.set('datetime', data.datetime);
    url.searchParams.set('lat', data.lat);
    url.searchParams.set('lon', data.lon);
    url.searchParams.set('tz', data.tz);
    if (data.loc) url.searchParams.set('loc', data.loc);
    url.searchParams.set('useSystem', '0');
    return url.pathname + url.search;
  }
  async function drawSlot(slot) {
    const card = document.querySelector('.relphi-workspace-sky[data-workspace-slot="' + slot + '"]');
    const solo = card?.querySelector('.relphi-skinny-solo');
    const data = dataFor(slot);
    if (!card || !solo || !data) return false;

    let portal = card.querySelector('.relphi-skinny-heptagram');
    if (!portal) {
      portal = document.createElement('a');
      portal.className = 'relphi-skinny-heptagram';
      portal.setAttribute('aria-label', 'Open this sky in Planetary Hours');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 220 220');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', 'Planetary Hours heptagram');
      portal.appendChild(svg);
      solo.before(portal);
    }

    await dependencies();
    const moment = momentFor(data);
    portal.href = linkFor(data);
    const svg = portal.querySelector('svg');
    svg.replaceChildren();
    svg.dataset.ready = 'pending';
    const result = window.RelphiPlanetaryHoursHeptagram.render(svg, {
      dayRuler:moment.dayRuler,
      sequence24:moment.sequence24,
      selectedPosition:moment.selectedPosition,
      glyphComponent:window.RelphiGlyphComponent,
      showLabels:false,
      showRulerRings:true
    });
    await result.ready;
    svg.dataset.ready = 'true';
    return true;
  }
  function draw() {
    queued = false;
    drawSlot('skyA').catch(function () {});
    drawSlot('skyB').catch(function () {});
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(draw);
  }
  function styles() {
    if (document.getElementById('relphi-skinny-heptagram-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-skinny-heptagram-style';
    style.textContent = `
      .relphi-skinny-heptagram{display:block;width:58px;height:58px;margin:.28rem auto .08rem;text-decoration:none;overflow:visible}
      .relphi-skinny-heptagram svg{display:block;width:58px;height:58px;overflow:visible}
      .relphi-skinny-heptagram .relphi-glyph-bubble>circle{fill:#fff!important}
      .relphi-skinny-heptagram:focus-visible{outline:2px solid color-mix(in srgb,var(--panel-accent) 35%,transparent);outline-offset:2px;border-radius:50%}
      @media(max-width:760px){.relphi-skinny-heptagram{width:64px;height:64px}.relphi-skinny-heptagram svg{width:64px;height:64px}}
    `;
    document.head.appendChild(style);
  }
  function start() {
    styles();
    draw();
    [100, 300, 700, 1200].forEach(function (delay) { setTimeout(draw, delay); });
    window.addEventListener('storage', schedule);
    window.addEventListener('relphi:extra-points-updated', schedule);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();