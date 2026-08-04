// Keep chart-axis labels and their short axis strokes at the radial extreme
// opposite the ordinary placement lanes. Also removes visible diagnostic text.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyAngleExtremePlacementV1) return;
  window.__relphiSkyAngleExtremePlacementV1 = true;

  const NS = 'http://www.w3.org/2000/svg';
  const CENTER = Object.freeze({ x:600, y:600 });
  const SKY = Object.freeze({ A:'#c9211e', B:'#2462d0' });
  const KEYS = Object.freeze({ A:'relphiSkyChartA', B:'relphiSkyChartB' });
  const ANGLES = Object.freeze(['asc','dsc','mc','ic']);
  const ALIASES = Object.freeze({
    asc:'asc', ascendant:'asc', rising:'asc', ac:'asc',
    dsc:'dsc', descendant:'dsc', dc:'dsc',
    mc:'mc', midheaven:'mc',
    ic:'ic', 'imum coeli':'ic', imumcoeli:'ic'
  });
  const BAND = Object.freeze({
    A:Object.freeze({ inner:414, outer:574, lanes:Object.freeze([540,522,504]), lineStart:500, lineEnd:570 }),
    B:Object.freeze({ inner:166, outer:323, lanes:Object.freeze([202,220,238]), lineStart:170, lineEnd:242 })
  });
  const FRAME_RADIUS = 19;
  const FRAME_STROKE = 2.35;
  const HALF = FRAME_RADIUS + FRAME_STROKE / 2;
  const CLEARANCE = 5;
  const LINE_GAP = 15;
  let scheduled = false;

  const svg = (name, attrs) => {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs || {}).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  };
  const norm = value => ((Number(value) % 360) + 360) % 360;
  const polar = (radius, degree) => {
    const angle = (degree - 180) * Math.PI / 180;
    return { x:CENTER.x + radius * Math.cos(angle), y:CENTER.y + radius * Math.sin(angle) };
  };
  const parseTranslate = value => {
    const match = /translate\(\s*([-\d.]+)(?:[ ,]+)([-\d.]+)\s*\)/.exec(value || '');
    return match ? { x:Number(match[1]), y:Number(match[2]) } : null;
  };

  function read(slot) {
    try { return JSON.parse(localStorage.getItem(KEYS[slot]) || 'null'); }
    catch (_) { return null; }
  }

  function sourceEntries(payload) {
    if (!payload || typeof payload !== 'object') return [];
    const source = [payload.placements,payload.positions,payload.points,payload.bodies]
      .find(value => value && typeof value === 'object') || payload;
    if (Array.isArray(source)) return source.map((item,index) => [String(item?.name || item?.label || item?.id || index),item]);
    return Object.entries(source).filter(([,value]) => value && typeof value === 'object' && !Array.isArray(value));
  }

  function identity(key, item) {
    for (const candidate of [item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key]) {
      const id = ALIASES[String(candidate || '').trim().toLowerCase()];
      if (id) return id;
    }
    return '';
  }

  function longitude(item) {
    if (Number.isFinite(Number(item?.longitude))) return norm(item.longitude);
    const signs = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
    const sign = signs.indexOf(String(item?.sign || item?.zodiac || '').trim().toLowerCase());
    if (sign < 0) return NaN;
    return norm(sign * 30 + Number(item?.degree || item?.degrees || 0) + Number(item?.minute || item?.minutes || 0) / 60 + Number(item?.second || item?.seconds || 0) / 3600);
  }

  function angleRecords(slot) {
    const result = new Map();
    sourceEntries(read(slot)).forEach(([key,item]) => {
      const id = identity(key,item);
      const value = longitude(item);
      if (id && Number.isFinite(value)) result.set(id,{id,value,item});
    });
    return result;
  }

  function houseCusps(payload, ascendant) {
    const profile = payload?.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {};
    for (const raw of [profile.houseCusps,profile.cusps,payload?.houseCusps,payload?.cusps,payload?.houses]) {
      if (!raw) continue;
      const values = (Array.isArray(raw) ? raw : Object.values(raw))
        .map(item => typeof item === 'object' ? Number(item.longitude ?? item.value ?? item.cusp) : Number(item))
        .slice(0,12);
      if (values.length === 12 && values.every(Number.isFinite)) return values.map(norm);
    }
    const start = String(profile.houseSystem || payload?.houseSystem || 'whole-sign').toLowerCase().includes('whole')
      ? Math.floor(ascendant / 30) * 30
      : ascendant;
    return Array.from({length:12},(_,index) => norm(start + index * 30));
  }

  function houseFor(value, cusps) {
    for (let index=0; index<12; index+=1) {
      const start = cusps[index];
      const span = norm(cusps[(index+1)%12] - start) || 30;
      if (norm(value - start) < span) return index + 1;
    }
    return 12;
  }

  function removeDiagnostics(chart) {
    chart.querySelectorAll('[data-angle-collision-error],[data-canonical-glyph-error]').forEach(node => node.remove());
    chart.dataset.angleCollisionState = 'resolved';
    delete chart.dataset.angleCollisionCount;
  }

  function collectObstacles(chart, ignoredHost) {
    const obstacles = [];
    chart.querySelectorAll('[data-layer="placements"] > g[data-placement], [data-layer="zodiac"] > g').forEach(host => {
      if (host === ignoredHost) return;
      const point = parseTranslate(host.getAttribute('transform'));
      if (!point) return;
      const isAngle = host.dataset.angleAxis === 'true';
      obstacles.push({kind:isAngle?'square':'circle',x:point.x,y:point.y,half:HALF,radius:isAngle?0:18});
    });
    chart.querySelectorAll('.sky-foundation-house-number').forEach(node => {
      const x = Number(node.getAttribute('x'));
      const y = Number(node.getAttribute('y'));
      if (Number.isFinite(x) && Number.isFinite(y)) obstacles.push({kind:'circle',x,y,radius:11});
    });
    return obstacles;
  }

  function squareCircleCollision(square, circle) {
    const dx = Math.max(Math.abs(square.x - circle.x) - square.half,0);
    const dy = Math.max(Math.abs(square.y - circle.y) - square.half,0);
    return Math.hypot(dx,dy) < circle.radius + CLEARANCE;
  }

  function squareSquareCollision(left,right) {
    return Math.abs(left.x-right.x) < left.half+right.half+CLEARANCE &&
      Math.abs(left.y-right.y) < left.half+right.half+CLEARANCE;
  }

  function chooseLane(chart, slot, degree, host) {
    const obstacles = collectObstacles(chart,host);
    for (const radius of BAND[slot].lanes) {
      const point = polar(radius,degree);
      const candidate = {kind:'square',x:point.x,y:point.y,half:HALF};
      const blocked = obstacles.some(obstacle => obstacle.kind === 'square'
        ? squareSquareCollision(candidate,obstacle)
        : squareCircleCollision(candidate,obstacle));
      if (!blocked) return {radius,point};
    }
    const radius = BAND[slot].lanes[0];
    return {radius,point:polar(radius,degree)};
  }

  function drawAxisLines(chart, slot, id, degree, radius) {
    const leaders = chart.querySelector('[data-layer="leaders"]');
    if (!leaders) return;
    leaders.querySelectorAll(`.sky-foundation-angle-axis[data-sky="${slot}"][data-angle="${id}"]`).forEach(line => line.remove());
    const attrs = {
      stroke:SKY[slot],
      class:'sky-foundation-angle-axis',
      'stroke-width':'2.6',
      'vector-effect':'non-scaling-stroke',
      'data-sky':slot,
      'data-angle':id,
      'data-exact-longitude':degree.toFixed(8),
      'data-angle-lane':radius,
      'data-axis-extreme':slot === 'A' ? 'outer' : 'inner'
    };
    const add = (start,end) => {
      if (end <= start) return;
      const a = polar(start,degree);
      const b = polar(end,degree);
      leaders.appendChild(svg('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,...attrs}));
    };
    add(BAND[slot].lineStart,Math.max(BAND[slot].lineStart,radius-LINE_GAP));
    add(Math.min(BAND[slot].lineEnd,radius+LINE_GAP),BAND[slot].lineEnd);
  }

  function ensureHost(chart, slot, record, cusps) {
    const placements = chart.querySelector('[data-layer="placements"]');
    if (!placements) return null;
    let host = placements.querySelector(`:scope > g[data-angle-axis="true"][data-sky="${slot}"][data-placement="${record.id}"]`);
    if (host) return host;
    host = svg('g',{
      'data-sky':slot,
      'data-placement':record.id,
      'data-angle-axis':'true',
      'data-house':houseFor(record.value,cusps),
      'data-angle-longitude':record.value.toFixed(8),
      'data-canonical-master':'glyphs-unified-preview.html',
      'data-canonical-viewbox':'-32 -32 64 64'
    });
    placements.appendChild(host);
    const component = window.RelphiGlyphComponent;
    if (!component?.createBubble) return host;
    try {
      const bubble = component.createBubble(host,record.id,{
        radius:FRAME_RADIUS,padding:1,color:SKY[slot],strokeWidth:FRAME_STROKE
      });
      bubble.circle.style.opacity='0';
      bubble.circle.setAttribute('aria-hidden','true');
      bubble.root.dataset.circlePresentation='hidden-only';
      bubble.ready.then(() => {
        bubble.root.dataset.canonicalMaster='glyphs-unified-preview.html';
        host.dataset.uncircledCanonical='true';
      }).catch(error => {
        host.dataset.relphiGlyphError=error?.message || 'canonical-glyph-failed';
        console.error(error);
      });
    } catch (error) {
      host.dataset.relphiGlyphError=error?.message || 'canonical-glyph-failed';
      console.error(error);
    }
    return host;
  }

  function repairAngles(chart) {
    for (const slot of ['A','B']) {
      const payload = read(slot);
      const records = angleRecords(slot);
      const asc = records.get('asc')?.value || 0;
      const cusps = houseCusps(payload,asc);
      for (const id of ANGLES) {
        const record = records.get(id);
        if (!record) continue;
        const host = ensureHost(chart,slot,record,cusps);
        if (!host) continue;
        const chosen = chooseLane(chart,slot,record.value,host);
        host.setAttribute('transform',`translate(${chosen.point.x} ${chosen.point.y})`);
        host.dataset.angleLane=String(chosen.radius);
        host.dataset.angleLongitude=record.value.toFixed(8);
        host.dataset.angleExtreme=slot === 'A' ? 'outer' : 'inner';
        host.dataset.house=String(houseFor(record.value,cusps));
        drawAxisLines(chart,slot,id,record.value,chosen.radius);
      }
    }
  }

  function repairGemini(chart) {
    const zodiac = chart.querySelector('[data-layer="zodiac"]');
    if (!zodiac) return;
    const art = zodiac.querySelector('.relphi-glyph-gemini');
    const host = art?.parentElement;
    if (!art || !host) return;
    if (!host.dataset.geminiBaseTransform) host.dataset.geminiBaseTransform=host.getAttribute('transform') || '';
    host.setAttribute('transform',`${host.dataset.geminiBaseTransform} scale(1.32)`);
    host.dataset.geminiPresentation='enlarged-for-wheel-legibility';
  }

  function repair() {
    scheduled=false;
    const chart=document.querySelector('.sky-foundation-wheel');
    if (!chart) return;
    removeDiagnostics(chart);
    repairAngles(chart);
    repairGemini(chart);
  }

  function schedule() {
    if (scheduled) return;
    scheduled=true;
    requestAnimationFrame(repair);
  }

  function start() {
    new MutationObserver(schedule).observe(document.getElementById('skyFoundationWheelMount') || document.body,{childList:true,subtree:true});
    window.addEventListener('relphi:sky-foundation-ready',schedule);
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
