// Adds protected outer house rings plus a plain canonical zodiac-and-degree ring.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const SLOT_KEYS = { skyA:'relphiSkyChartA', skyB:'relphiSkyChartB' };
  const COLORS = { skyA:'#dc1f18', skyB:'#3166e2' };
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const SIGN_IDS = SIGNS.map(function (sign) { return sign.toLowerCase(); });
  const LAYER_CLASS = 'relphi-dual-house-rings';
  const ZODIAC_CLASS = 'relphi-zodiac-structure-ring';
  const WHEEL_SELECTOR = '.unified-sky-wheel > svg,.unified-sky-wheel svg.chart-wheel-svg,#chartOutput svg.chart-wheel-svg,#currentSkyOutput svg.chart-wheel-svg,.sky-output-box svg.chart-wheel-svg';
  let queued = false;

  function read(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } }
  function placements(payload) { const value = payload && (payload.placements || payload); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
  function findPlacement(payload, names) {
    const map = placements(payload);
    const wanted = names.map(function (name) { return String(name).toLowerCase(); });
    const key = Object.keys(map).find(function (candidate) { return wanted.includes(String(candidate).trim().toLowerCase()); });
    return key ? map[key] : null;
  }
  function longitude(item) {
    if (!item) return NaN;
    const signIndex = SIGNS.findIndex(function (sign) { return sign.toLowerCase() === String(item.sign || '').trim().toLowerCase(); });
    if (signIndex < 0) return NaN;
    return signIndex * 30 + Number(item.degree || 0) + Number(item.minute || 0) / 60;
  }
  function normalized(value) { value %= 360; return value < 0 ? value + 360 : value; }
  function profile(payload) { return payload && payload.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {}; }
  function houseSystem(payload) { return String(profile(payload).houseSystem || '').trim().toLowerCase(); }
  function cuspArray(payload) {
    const p = profile(payload);
    const candidates = [p.houseCusps, p.cusps, payload && payload.houseCusps, payload && payload.cusps];
    for (const candidate of candidates) {
      if (!Array.isArray(candidate) || candidate.length < 12) continue;
      const values = candidate.slice(0,12).map(Number);
      if (values.every(Number.isFinite)) return values.map(normalized);
    }
    return null;
  }
  function calculatedCusps(payload) {
    const asc = longitude(findPlacement(payload,['Rising','Ascendant','ASC','AC']));
    if (!Number.isFinite(asc)) return null;
    const system = houseSystem(payload);
    if (/whole/.test(system)) {
      const start = Math.floor(asc / 30) * 30;
      return Array.from({length:12}, function (_, index) { return normalized(start + index * 30); });
    }
    if (/equal/.test(system)) return Array.from({length:12}, function (_, index) { return normalized(asc + index * 30); });
    return cuspArray(payload);
  }
  function point(cx, cy, radius, degrees) {
    const radians = degrees * Math.PI / 180;
    return { x:cx + Math.cos(radians) * radius, y:cy + Math.sin(radians) * radius };
  }
  function angularSpan(from, to) { return normalized(to - from); }
  function chartAngle(longitudeValue, baseAsc) { return normalized(180 + (longitudeValue - baseAsc)); }
  function svgNode(name, attrs) {
    const node = document.createElementNS(NS,name);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key,String(attrs[key])); });
    return node;
  }
  function wheelCenter(svg) {
    const box = svg.viewBox && svg.viewBox.baseVal;
    if (box && box.width > 0 && box.height > 0) return { cx:box.x + box.width/2, cy:box.y + box.height/2, span:Math.min(box.width,box.height) };
    const width = Number(svg.getAttribute('width')) || svg.clientWidth || 800;
    const height = Number(svg.getAttribute('height')) || svg.clientHeight || 800;
    return { cx:width/2, cy:height/2, span:Math.min(width,height) };
  }
  function isActualChartWheel(svg) {
    if (!svg || !svg.isConnected) return false;
    if (svg.closest('#relphiPlanetaryHoursPortal,.relphi-ph-portal')) return false;
    return !!svg.querySelector('.chart-wheel-placement-stick,.relphi-canonical-marker-layer,.chart-wheel-contact-dot');
  }
  function isComparisonWheel() {
    const b = read(SLOT_KEYS.skyB);
    return !!b && Object.keys(placements(b)).length > 0;
  }
  function addHouseRing(layer, payload, sky, baseAsc, outerRadius, thickness) {
    const cusps = calculatedCusps(payload);
    const asc = longitude(findPlacement(payload,['Rising','Ascendant','ASC','AC']));
    if (!cusps || !Number.isFinite(asc)) return false;
    const color = COLORS[sky];
    const innerRadius = outerRadius - thickness;
    const group = svgNode('g', { class:'relphi-house-ring relphi-house-ring-' + sky, 'data-sky':sky, 'aria-label':(sky === 'skyA' ? 'Sky A' : 'Sky B') + ' houses' });
    group.appendChild(svgNode('circle',{ cx:layer.dataset.cx, cy:layer.dataset.cy, r:outerRadius, fill:'none', stroke:color, 'stroke-width':1.35, opacity:.82 }));
    group.appendChild(svgNode('circle',{ cx:layer.dataset.cx, cy:layer.dataset.cy, r:innerRadius, fill:'none', stroke:color, 'stroke-width':1.05, opacity:.48 }));
    const cx = Number(layer.dataset.cx), cy = Number(layer.dataset.cy);
    cusps.forEach(function (cusp,index) {
      const angle = chartAngle(cusp,baseAsc);
      const nextAngle = chartAngle(cusps[(index+1)%12],baseAsc);
      const span = angularSpan(angle,nextAngle) || 30;
      const dividerStart = point(cx,cy,innerRadius,angle);
      const dividerEnd = point(cx,cy,outerRadius,angle);
      group.appendChild(svgNode('line',{ x1:dividerStart.x, y1:dividerStart.y, x2:dividerEnd.x, y2:dividerEnd.y, stroke:color, 'stroke-width':1.1, opacity:.7, 'vector-effect':'non-scaling-stroke' }));
      const middle = normalized(angle + span/2);
      const labelPoint = point(cx,cy,innerRadius + thickness*.5,middle);
      const text = svgNode('text',{ x:labelPoint.x, y:labelPoint.y, fill:color, 'font-size':Math.max(10,thickness*.36), 'font-weight':800, 'text-anchor':'middle', 'dominant-baseline':'central', 'paint-order':'stroke', stroke:'#fff', 'stroke-width':3, 'stroke-linejoin':'round' });
      text.textContent = String(index+1);
      group.appendChild(text);
    });
    layer.appendChild(group);
    return true;
  }
  function addZodiacRing(layer, baseAsc, outerRadius, thickness) {
    const cx = Number(layer.dataset.cx), cy = Number(layer.dataset.cy);
    const innerRadius = outerRadius - thickness;
    const glyphRadius = innerRadius + thickness * .58;
    const group = svgNode('g',{class:ZODIAC_CLASS,'aria-label':'Zodiac signs and degree divisions'});
    group.appendChild(svgNode('circle',{cx:cx,cy:cy,r:outerRadius,fill:'none',stroke:'#111','stroke-width':1.15,opacity:.55}));
    group.appendChild(svgNode('circle',{cx:cx,cy:cy,r:innerRadius,fill:'none',stroke:'#111','stroke-width':1.1,opacity:.72}));

    for (let degree=0; degree<360; degree+=1) {
      const angle = chartAngle(degree,baseAsc);
      const isSign = degree % 30 === 0;
      const isDecan = degree % 10 === 0;
      const length = isSign ? thickness*.34 : isDecan ? thickness*.23 : thickness*.10;
      const width = isSign ? 1.45 : isDecan ? 1.05 : .55;
      const opacity = isSign ? .76 : isDecan ? .62 : .28;
      const a = point(cx,cy,innerRadius,angle);
      const b = point(cx,cy,innerRadius + length,angle);
      group.appendChild(svgNode('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'#111','stroke-width':width,opacity:opacity,'vector-effect':'non-scaling-stroke'}));
    }

    const ready=[];
    SIGN_IDS.forEach(function (id,index) {
      const angle = chartAngle(index*30+15,baseAsc);
      const p = point(cx,cy,glyphRadius,angle);
      const host = svgNode('g',{class:'relphi-zodiac-plain-host','data-glyph-id':id,transform:'translate('+p.x.toFixed(3)+' '+p.y.toFixed(3)+')','aria-label':SIGNS[index]});
      group.appendChild(host);
      if (window.RelphiGlyphComponent?.draw) {
        const job = window.RelphiGlyphComponent.draw(host,id,{radius:Math.max(10,Math.min(14,thickness*.26)),padding:1,color:'#111',bubbleStrokeWidth:0});
        ready.push(job);
      }
    });
    layer.appendChild(group);
    return Promise.allSettled(ready);
  }
  function hideLegacyHouseNumbers(svg, innerProtectedRadius) {
    const geometry = wheelCenter(svg);
    svg.querySelectorAll('.chart-wheel-house-number,.house-number,[data-house-number]').forEach(function (node) {
      if (!node.closest('.' + LAYER_CLASS)) node.style.display = 'none';
    });
    svg.querySelectorAll('text').forEach(function (node) {
      if (node.closest('.' + LAYER_CLASS + ',.relphi-canonical-marker-layer,.relphi-canonical-zodiac-ring')) return;
      const value = String(node.textContent || '').trim();
      if (!/^(?:[1-9]|1[0-2])$/.test(value)) return;
      try {
        const box = node.getBBox();
        const x = box.x + box.width/2, y = box.y + box.height/2;
        if (Math.hypot(x-geometry.cx,y-geometry.cy) < innerProtectedRadius) node.style.display='none';
      } catch (_) {}
    });
  }
  function suppressCircledZodiac(svg) {
    if (!isComparisonWheel()) return;
    svg.querySelectorAll(':scope > .relphi-canonical-zodiac-ring').forEach(function (node) { node.remove(); });
    svg.querySelectorAll('.relphi-canonical-zodiac-source').forEach(function (node) { node.style.visibility='hidden'; node.style.pointerEvents='none'; });
  }
  async function renderSvg(svg) {
    if (!isActualChartWheel(svg)) return;
    svg.querySelectorAll(':scope > .' + LAYER_CLASS).forEach(function (node) { node.remove(); });
    const a = read(SLOT_KEYS.skyA), b = read(SLOT_KEYS.skyB);
    if (!a) return;
    const ascA = longitude(findPlacement(a,['Rising','Ascendant','ASC','AC']));
    if (!Number.isFinite(ascA)) return;
    const geometry = wheelCenter(svg);
    const outerRadius = geometry.span * .487;
    const houseThickness = Math.max(20,Math.min(31,geometry.span * .038));
    const zodiacThickness = Math.max(34,Math.min(48,geometry.span * .058));
    const layer = svgNode('g',{ class:LAYER_CLASS, 'pointer-events':'none' });
    layer.dataset.cx = geometry.cx; layer.dataset.cy = geometry.cy;
    const hasB = !!b && Object.keys(placements(b)).length;
    addHouseRing(layer,a,'skyA',ascA,outerRadius,houseThickness);
    let currentOuter = outerRadius-houseThickness;
    if (hasB) { addHouseRing(layer,b,'skyB',ascA,currentOuter,houseThickness); currentOuter -= houseThickness; }
    await addZodiacRing(layer,ascA,currentOuter,zodiacThickness);
    svg.insertBefore(layer,svg.firstChild);
    hideLegacyHouseNumbers(svg,currentOuter-zodiacThickness+6);
    suppressCircledZodiac(svg);
  }
  function cleanNonWheelSvgs() {
    document.querySelectorAll('svg .' + LAYER_CLASS).forEach(function (layer) {
      const svg = layer.closest('svg');
      if (!isActualChartWheel(svg)) layer.remove();
    });
  }
  function run() {
    queued = false;
    cleanNonWheelSvgs();
    document.querySelectorAll(WHEEL_SELECTOR).forEach(function (svg) { renderSvg(svg); });
  }
  function queue() { if (queued) return; queued = true; requestAnimationFrame(run); }
  function start() {
    run();
    new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});
    window.addEventListener('storage',queue);
    window.addEventListener('relphi:sky-builder-v4-loaded',queue);
    window.addEventListener('relphi:extra-points-updated',queue);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();