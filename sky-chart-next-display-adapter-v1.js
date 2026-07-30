// Sky Chart display adapter: use the current Sky Chart Next rainbow-house renderer with live Sky A/Sky B data.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const COLORS = ['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
  const SIGNS = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  const SKY = { A:'#c9211e', B:'#2462d0' };
  const CENTER = { x:600, y:600 };
  const R = { bIn:165, bOut:330, bDegree:330, zIn:330, zOut:420, aDegree:420, aIn:420, aOut:575 };
  const KEYS = { A:'relphiSkyChartA', B:'relphiSkyChartB' };
  const PLACEMENT_SIZE = 16;

  let timer = 0;
  let rendering = false;
  let rerenderRequested = false;
  let lastSignature = '';

  function svgNode(name, attrs) {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs || {}).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  }

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }

  function norm(value) {
    value = Number(value) || 0;
    return ((value % 360) + 360) % 360;
  }

  function polar(radius, degrees) {
    const angle = (degrees - 180) * Math.PI / 180;
    return {
      x:CENTER.x + radius * Math.cos(angle),
      y:CENTER.y + radius * Math.sin(angle)
    };
  }

  function annularPath(innerRadius, outerRadius, start, end) {
    const span = norm(end - start) || 360;
    const large = span > 180 ? 1 : 0;
    const p1 = polar(outerRadius, start);
    const p2 = polar(outerRadius, start + span);
    const p3 = polar(innerRadius, start + span);
    const p4 = polar(innerRadius, start);
    return `M${p1.x} ${p1.y} A${outerRadius} ${outerRadius} 0 ${large} 1 ${p2.x} ${p2.y} L${p3.x} ${p3.y} A${innerRadius} ${innerRadius} 0 ${large} 0 ${p4.x} ${p4.y} Z`;
  }

  function line(parent, radiusA, radiusB, degrees, className, color) {
    const a = polar(radiusA, degrees);
    const b = polar(radiusB, degrees);
    const node = svgNode('line', { x1:a.x, y1:a.y, x2:b.x, y2:b.y, class:className || '' });
    if (color) node.setAttribute('stroke', color);
    parent.appendChild(node);
    return node;
  }

  function text(parent, radius, degrees, value, className) {
    const point = polar(radius, degrees);
    const node = svgNode('text', { x:point.x, y:point.y, class:className || '' });
    node.textContent = value;
    parent.appendChild(node);
    return node;
  }

  function placementEntries(payload) {
    if (!payload) return [];
    const candidates = [payload.placements, payload.positions, payload.points, payload.bodies, payload];
    const source = candidates.find(value => value && typeof value === 'object');
    if (!source) return [];
    if (Array.isArray(source)) {
      return source.map((item, index) => [String(item?.name || item?.label || item?.body || item?.planet || item?.point || item?.id || index), item]);
    }
    return Object.entries(source).filter(([, item]) => item && typeof item === 'object' && !Array.isArray(item));
  }

  function longitude(item) {
    if (!item) return NaN;
    if (Number.isFinite(Number(item.longitude))) return norm(Number(item.longitude));
    const signName = String(item.sign || item.zodiac || '').trim().toLowerCase();
    const sign = SIGNS.indexOf(signName);
    if (sign < 0) return NaN;
    return norm(sign * 30 + Number(item.degree || item.degrees || 0) + Number(item.minute || item.minutes || 0) / 60 + Number(item.second || item.seconds || 0) / 3600);
  }

  function glyphId(key, item) {
    const candidates = [key, item?.name, item?.label, item?.body, item?.planet, item?.point, item?.glyphId, item?.id];
    for (const candidate of candidates) {
      if (!candidate) continue;
      try {
        const entry = window.RelphiGlyphRegistry?.resolve(candidate) || window.RelphiGlyphRegistry?.get(candidate);
        if (entry?.id) return entry.id;
      } catch (_) {}
    }
    return '';
  }

  function records(payload) {
    return placementEntries(payload).map(([key, item]) => ({
      id:glyphId(key, item),
      value:longitude(item),
      source:item
    })).filter(record => record.id && Number.isFinite(record.value));
  }

  function ascLongitude(payload, items) {
    const entry = placementEntries(payload).find(([key, item]) => /^(asc|ascendant|rising|ac)$/i.test(String(key)) || /^(asc|ascendant|rising|ac)$/i.test(String(item?.name || item?.label || item?.body || '')));
    if (entry) {
      const value = longitude(entry[1]);
      if (Number.isFinite(value)) return value;
    }
    const asc = items.find(item => /ascendant|rising|asc/i.test(item.id));
    return asc ? asc.value : 0;
  }

  function houseCusps(payload, asc) {
    const possible = [payload?.houseCusps, payload?.cusps, payload?.houses];
    for (const candidate of possible) {
      if (!candidate) continue;
      const values = Array.isArray(candidate)
        ? candidate.map(item => typeof item === 'object' ? Number(item.longitude ?? item.value ?? item.cusp) : Number(item))
        : Object.values(candidate).map(item => typeof item === 'object' ? Number(item.longitude ?? item.value ?? item.cusp) : Number(item));
      const valid = values.filter(Number.isFinite).slice(0, 12);
      if (valid.length === 12) return valid.map(norm);
    }
    const system = String(payload?.houseSystem || payload?.house_system || '').toLowerCase();
    const start = system.includes('whole') ? Math.floor(asc / 30) * 30 : asc;
    return Array.from({ length:12 }, (_, index) => norm(start + index * 30));
  }

  function drawHouseBand(parent, cusps, innerRadius, outerRadius, skyColor, skyId) {
    cusps.forEach((start, index) => {
      const end = cusps[(index + 1) % 12];
      parent.appendChild(svgNode('path', {
        d:annularPath(innerRadius, outerRadius, start, end),
        fill:COLORS[index],
        'fill-opacity':'.5',
        'data-sky':skyId,
        'data-house':index + 1
      }));
      line(parent, innerRadius, outerRadius, end, 'scn-house-divider', skyColor);
      text(parent, (innerRadius + outerRadius) / 2, start + norm(end - start) / 2, String(index + 1), 'scn-house-number');
    });
  }

  function spreadPlacements(items, lane) {
    const sorted = items.slice().sort((a, b) => a.value - b.value).map(item => ({ ...item, display:item.value, lane }));
    const minimum = 7.5;
    for (let pass = 0; pass < 8; pass += 1) {
      let moved = false;
      for (let index = 1; index < sorted.length; index += 1) {
        const gap = sorted[index].display - sorted[index - 1].display;
        if (gap >= minimum) continue;
        const push = (minimum - gap) / 2;
        sorted[index - 1].display -= push;
        sorted[index].display += push;
        moved = true;
      }
      if (!moved) break;
    }
    sorted.forEach(item => { item.display = norm(item.display); });
    return sorted;
  }

  async function drawPlacement(parent, leaders, item, skyId, exactRadius, displayRadius) {
    const exact = polar(exactRadius, item.value);
    const display = polar(displayRadius, item.display);
    leaders.appendChild(svgNode('line', {
      x1:display.x, y1:display.y, x2:exact.x, y2:exact.y,
      stroke:SKY[skyId], class:'scn-placement-leader'
    }));
    const host = svgNode('g', {
      transform:`translate(${display.x} ${display.y})`,
      'data-sky':skyId,
      'data-glyph-id':item.id,
      'data-longitude':item.value
    });
    parent.appendChild(host);
    await window.SkyChartNextGlyphs.inscribed(host, item.id, {
      size:PLACEMENT_SIZE,
      color:SKY[skyId],
      fill:'#fffdf8'
    });
  }

  function ensureStyle() {
    if (document.getElementById('sky-chart-next-display-adapter-style')) return;
    const style = document.createElement('style');
    style.id = 'sky-chart-next-display-adapter-style';
    style.textContent = `
      .unified-sky-wheel{min-height:0!important}
      .unified-sky-wheel .scn-live-wheel{display:block!important;visibility:visible!important;opacity:1!important;width:100%;height:auto;overflow:visible;background:#fffdf8;border-radius:1rem}
      .scn-live-wheel .scn-ring{fill:none;stroke:#201d19;stroke-width:1.2}
      .scn-live-wheel .scn-house-divider{stroke-width:3;vector-effect:non-scaling-stroke}
      .scn-live-wheel .scn-house-number{font:700 16px/1 Georgia,serif;fill:#26211d;text-anchor:middle;dominant-baseline:middle}
      .scn-live-wheel .scn-zodiac-cusp{stroke:#4c433a;stroke-width:1.6;vector-effect:non-scaling-stroke}
      .scn-live-wheel .scn-degree-tick{stroke:rgba(23,23,23,.52);stroke-width:1.15;vector-effect:non-scaling-stroke}
      .scn-live-wheel .scn-degree-tick.major{stroke:rgba(23,23,23,.82);stroke-width:1.8}
      .scn-live-wheel .scn-placement-leader{fill:none;stroke-width:1.55;opacity:.7;vector-effect:non-scaling-stroke}
    `;
    document.head.appendChild(style);
  }

  function signature(payloadA, payloadB) {
    try { return JSON.stringify([payloadA, payloadB]); }
    catch (_) { return String(Date.now()); }
  }

  async function buildWheel(payloadA, payloadB, itemsA, itemsB) {
    const ascA = ascLongitude(payloadA, itemsA);
    const ascB = itemsB.length ? ascLongitude(payloadB, itemsB) : ascA;
    const cuspsA = houseCusps(payloadA, ascA);
    const cuspsB = houseCusps(payloadB, ascB);

    const svg = svgNode('svg', {
      viewBox:'0 0 1200 1200',
      class:'scn-live-wheel relphi-canonical-ready',
      role:'img',
      'aria-label':'Rainbow two-sky comparison wheel with houses',
      'data-ready':'false'
    });
    svg.appendChild(svgNode('circle', { cx:CENTER.x, cy:CENTER.y, r:R.aOut + 8, fill:'#fffdf8', stroke:'rgba(23,23,23,.12)' }));

    const bHouses = svgNode('g', { 'data-layer':'sky-b-houses' });
    const zodiac = svgNode('g', { 'data-layer':'fixed-zodiac' });
    const aHouses = svgNode('g', { 'data-layer':'sky-a-houses' });
    const ticks = svgNode('g', { 'data-layer':'degree-ticks' });
    const leaders = svgNode('g', { 'data-layer':'placement-leaders' });
    const glyphs = svgNode('g', { 'data-layer':'placement-glyphs' });
    const outlines = svgNode('g', { 'data-layer':'ring-outlines' });
    svg.append(bHouses, zodiac, aHouses, ticks, outlines, leaders, glyphs);

    drawHouseBand(bHouses, cuspsB, R.bIn, R.bOut, SKY.B, 'B');
    drawHouseBand(aHouses, cuspsA, R.aIn, R.aOut, SKY.A, 'A');

    const jobs = [];
    for (let index = 0; index < 12; index += 1) {
      const start = index * 30;
      zodiac.appendChild(svgNode('path', {
        d:annularPath(R.zIn, R.zOut, start, start + 30),
        fill:COLORS[index],
        'fill-opacity':'.78'
      }));
      line(zodiac, R.zIn, R.zOut, start, 'scn-zodiac-cusp');
      const point = polar((R.zIn + R.zOut) / 2, start + 15);
      const host = svgNode('g', { transform:`translate(${point.x} ${point.y})` });
      zodiac.appendChild(host);
      jobs.push(window.SkyChartNextGlyphs.uncircled(host, SIGNS[index], { size:19, color:'#171717' }));
    }

    [R.bIn, R.zIn, R.zOut, R.aOut].forEach(radius => {
      outlines.appendChild(svgNode('circle', { cx:CENTER.x, cy:CENTER.y, r:radius, class:'scn-ring' }));
    });

    for (let degree = 0; degree < 360; degree += 1) {
      const length = degree % 10 === 0 ? 12 : degree % 5 === 0 ? 8 : 5;
      const cls = degree % 10 === 0 ? 'scn-degree-tick major' : 'scn-degree-tick';
      line(ticks, R.bDegree - length, R.bDegree + length, degree, cls);
      line(ticks, R.aDegree - length, R.aDegree + length, degree, cls);
    }

    spreadPlacements(itemsA, R.aDegree + 34).forEach(item => jobs.push(drawPlacement(glyphs, leaders, item, 'A', R.aDegree, R.aDegree + 34)));
    spreadPlacements(itemsB, R.bDegree - 34).forEach(item => jobs.push(drawPlacement(glyphs, leaders, item, 'B', R.bDegree, R.bDegree - 34)));

    await Promise.all(jobs);
    svg.dataset.ready = 'true';
    return svg;
  }

  async function render(force) {
    if (rendering) {
      rerenderRequested = true;
      return;
    }

    const container = document.querySelector('.unified-sky-wheel');
    if (!container || !window.SkyChartNextGlyphs) {
      schedule(180, true);
      return;
    }

    const payloadA = read(KEYS.A);
    const payloadB = read(KEYS.B);
    const itemsA = records(payloadA);
    const itemsB = records(payloadB);
    if (!itemsA.length) {
      schedule(220, true);
      return;
    }

    const nextSignature = signature(payloadA, payloadB);
    const mounted = container.querySelector(':scope > .scn-live-wheel[data-ready="true"]');
    if (!force && mounted && nextSignature === lastSignature) return;

    rendering = true;
    rerenderRequested = false;
    try {
      ensureStyle();
      const svg = await buildWheel(payloadA, payloadB, itemsA, itemsB);
      if (!container.isConnected) return;

      // Atomic swap: no intermediate blank state and no repeated clearing.
      container.querySelectorAll(':scope > svg').forEach(node => node.remove());
      container.appendChild(svg);
      container.dataset.displayMethod = 'sky-chart-next-rainbow-houses';
      lastSignature = nextSignature;
      window.RelphiSkyRenderGate?.reveal?.();
      window.dispatchEvent(new CustomEvent('relphi:sky-chart-next-display-ready', { detail:{ svg } }));
    } catch (error) {
      console.error('Sky Chart Next display adapter failed:', error);
    } finally {
      rendering = false;
      if (rerenderRequested) schedule(80, true);
    }
  }

  function schedule(delay, force) {
    clearTimeout(timer);
    timer = setTimeout(function () { render(!!force); }, Number(delay) || 0);
  }

  function start() {
    schedule(0, true);

    window.addEventListener('storage', event => {
      if (!event.key || event.key === KEYS.A || event.key === KEYS.B) schedule(100, true);
    });
    window.addEventListener('relphi:extra-points-updated', () => schedule(100, true));
    window.addEventListener('relphi:house-system-changed', () => schedule(100, true));
    window.addEventListener('relphi:sky-builder-v4-loaded', () => schedule(180, true));

    // Watch only for the wheel mount being replaced or our mounted SVG being removed.
    new MutationObserver(function () {
      const container = document.querySelector('.unified-sky-wheel');
      if (!container) return;
      if (!container.querySelector(':scope > .scn-live-wheel[data-ready="true"]')) schedule(180, true);
    }).observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();