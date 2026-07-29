// Protected comparison-wheel structure: Sky A houses, Sky B houses, zodiac glyphs, degree ticks.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const KEYS = { skyA:'relphiSkyChartA', skyB:'relphiSkyChartB' };
  const COLORS = { skyA:'#dc1f18', skyB:'#3166e2' };
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const IDS = SIGNS.map(function (sign) { return sign.toLowerCase(); });
  const LAYER = 'relphi-dual-house-rings';
  const ZODIAC = 'relphi-zodiac-structure-ring';
  const SELECTOR = '.unified-sky-wheel > svg,.unified-sky-wheel svg.chart-wheel-svg,#chartOutput svg.chart-wheel-svg,#currentSkyOutput svg.chart-wheel-svg,.sky-output-box svg.chart-wheel-svg';
  let queued = false;

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }

  function placements(payload) {
    const value = payload && (payload.placements || payload);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function find(payload, names) {
    const map = placements(payload);
    const wanted = names.map(function (name) { return String(name).toLowerCase(); });
    const key = Object.keys(map).find(function (candidate) {
      return wanted.includes(String(candidate).trim().toLowerCase());
    });
    return key ? map[key] : null;
  }

  function longitude(item) {
    if (!item) return NaN;
    const signIndex = SIGNS.findIndex(function (sign) {
      return sign.toLowerCase() === String(item.sign || '').trim().toLowerCase();
    });
    return signIndex < 0 ? NaN : signIndex * 30 + Number(item.degree || 0) + Number(item.minute || 0) / 60;
  }

  function norm(value) {
    value %= 360;
    return value < 0 ? value + 360 : value;
  }

  function profile(payload) {
    return payload && payload.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {};
  }

  function cusps(payload) {
    const asc = longitude(find(payload, ['Rising','Ascendant','ASC','AC']));
    if (!Number.isFinite(asc)) return null;
    const p = profile(payload);
    const system = String(p.houseSystem || '').toLowerCase();
    if (/whole/.test(system)) {
      const start = Math.floor(asc / 30) * 30;
      return Array.from({ length:12 }, function (_, index) { return norm(start + index * 30); });
    }
    if (/equal/.test(system)) {
      return Array.from({ length:12 }, function (_, index) { return norm(asc + index * 30); });
    }
    for (const candidate of [p.houseCusps, p.cusps, payload && payload.houseCusps, payload && payload.cusps]) {
      if (!Array.isArray(candidate) || candidate.length < 12) continue;
      const values = candidate.slice(0, 12).map(Number);
      if (values.every(Number.isFinite)) return values.map(norm);
    }
    return null;
  }

  function svgNode(name, attributes) {
    const node = document.createElementNS(NS, name);
    Object.keys(attributes || {}).forEach(function (key) { node.setAttribute(key, String(attributes[key])); });
    return node;
  }

  function point(cx, cy, radius, degrees) {
    const angle = degrees * Math.PI / 180;
    return { x:cx + Math.cos(angle) * radius, y:cy + Math.sin(angle) * radius };
  }

  function wheelAngle(longitudeValue, asc) {
    return norm(180 + (longitudeValue - asc));
  }

  function geometry(svg) {
    const box = svg.viewBox && svg.viewBox.baseVal;
    if (box && box.width > 0 && box.height > 0) {
      return { cx:box.x + box.width / 2, cy:box.y + box.height / 2, span:Math.min(box.width, box.height) };
    }
    const width = Number(svg.getAttribute('width')) || svg.clientWidth || 800;
    const height = Number(svg.getAttribute('height')) || svg.clientHeight || 800;
    return { cx:width / 2, cy:height / 2, span:Math.min(width, height) };
  }

  function isActualWheel(svg) {
    return !!(svg && svg.isConnected && !svg.closest('#relphiPlanetaryHoursPortal,.relphi-ph-portal') &&
      svg.querySelector('.chart-wheel-placement-stick,.relphi-canonical-marker-layer,.chart-wheel-contact-dot'));
  }

  function signature(a, b, frame) {
    function one(payload) {
      const p = profile(payload);
      return [payload && payload.name, p.dateTime, p.houseSystem,
        longitude(find(payload, ['Rising','Ascendant','ASC','AC'])), JSON.stringify(cusps(payload))].join('|');
    }
    return [one(a), one(b), frame.span.toFixed(2)].join('|||');
  }

  function drawHouseRing(layer, payload, sky, baseAsc, outer, thickness) {
    const values = cusps(payload);
    if (!values) return false;
    const color = COLORS[sky];
    const inner = outer - thickness;
    const cx = Number(layer.dataset.cx);
    const cy = Number(layer.dataset.cy);
    const group = svgNode('g', {
      class:'relphi-house-ring relphi-house-ring-' + sky,
      'data-sky':sky,
      'aria-label':(sky === 'skyA' ? 'Sky A' : 'Sky B') + ' houses'
    });
    group.append(
      svgNode('circle', { cx, cy, r:outer, fill:'none', stroke:color, 'stroke-width':1.35, opacity:.82 }),
      svgNode('circle', { cx, cy, r:inner, fill:'none', stroke:color, 'stroke-width':1.05, opacity:.48 })
    );
    values.forEach(function (cusp, index) {
      const angle = wheelAngle(cusp, baseAsc);
      const next = wheelAngle(values[(index + 1) % 12], baseAsc);
      const sector = norm(next - angle) || 30;
      const start = point(cx, cy, inner, angle);
      const end = point(cx, cy, outer, angle);
      const midpoint = point(cx, cy, inner + thickness * .5, norm(angle + sector / 2));
      group.appendChild(svgNode('line', {
        x1:start.x, y1:start.y, x2:end.x, y2:end.y,
        stroke:color, 'stroke-width':1.1, opacity:.7, 'vector-effect':'non-scaling-stroke'
      }));
      const text = svgNode('text', {
        x:midpoint.x, y:midpoint.y, fill:color,
        'font-size':Math.max(10, thickness * .36), 'font-weight':800,
        'text-anchor':'middle', 'dominant-baseline':'central',
        'paint-order':'stroke', stroke:'#fff', 'stroke-width':3, 'stroke-linejoin':'round'
      });
      text.textContent = String(index + 1);
      group.appendChild(text);
    });
    layer.appendChild(group);
    return true;
  }

  function waitForGlyphComponent(timeout) {
    const started = Date.now();
    return new Promise(function (resolve, reject) {
      function check() {
        if (window.RelphiGlyphComponent && typeof window.RelphiGlyphComponent.draw === 'function' && window.RelphiGlyphRegistry) {
          resolve(window.RelphiGlyphComponent);
          return;
        }
        if (Date.now() - started >= timeout) {
          reject(new Error('Canonical glyph component was not ready.'));
          return;
        }
        setTimeout(check, 40);
      }
      check();
    });
  }

  async function drawZodiacRing(layer, baseAsc, outer, thickness) {
    const component = await waitForGlyphComponent(8000);
    const cx = Number(layer.dataset.cx);
    const cy = Number(layer.dataset.cy);
    const inner = outer - thickness;
    const glyphRadius = inner + thickness * .56;
    const group = svgNode('g', { class:ZODIAC, 'aria-label':'Zodiac signs and degree divisions' });
    group.append(
      svgNode('circle', { cx, cy, r:outer, fill:'none', stroke:'#111', 'stroke-width':1.15, opacity:.55 }),
      svgNode('circle', { cx, cy, r:inner, fill:'none', stroke:'#111', 'stroke-width':1.1, opacity:.72 })
    );

    for (let degree = 0; degree < 360; degree += 1) {
      const angle = wheelAngle(degree, baseAsc);
      const signBoundary = degree % 30 === 0;
      const decanBoundary = !signBoundary && degree % 10 === 0;
      const length = signBoundary ? thickness : decanBoundary ? thickness * .24 : thickness * .10;
      const width = signBoundary ? 1.45 : decanBoundary ? 1.05 : .55;
      const opacity = signBoundary ? .82 : decanBoundary ? .62 : .28;
      const start = point(cx, cy, inner, angle);
      const end = point(cx, cy, inner + length, angle);
      group.appendChild(svgNode('line', {
        class:signBoundary ? 'relphi-zodiac-sign-divider' : decanBoundary ? 'relphi-zodiac-decan-tick' : 'relphi-zodiac-degree-tick',
        x1:start.x, y1:start.y, x2:end.x, y2:end.y,
        stroke:'#111', 'stroke-width':width, opacity, 'vector-effect':'non-scaling-stroke'
      }));
    }

    layer.appendChild(group);
    const jobs = IDS.map(function (id, index) {
      const position = point(cx, cy, glyphRadius, wheelAngle(index * 30 + 15, baseAsc));
      const host = svgNode('g', {
        class:'relphi-zodiac-plain-host',
        'data-glyph-id':id,
        transform:'translate(' + position.x.toFixed(3) + ' ' + position.y.toFixed(3) + ')',
        'aria-label':SIGNS[index]
      });
      group.appendChild(host);
      return component.draw(host, id, {
        radius:Math.max(7, Math.min(9.5, thickness * .2)),
        padding:1,
        color:'#111',
        bubbleStrokeWidth:0
      }).then(function () {
        if (!host.querySelector('.relphi-canonical-glyph')) throw new Error('Missing canonical zodiac glyph: ' + id);
        host.dataset.ready = 'true';
        return host;
      });
    });

    const hosts = await Promise.all(jobs);
    if (hosts.length !== 12 || hosts.some(function (host) { return host.dataset.ready !== 'true'; })) {
      throw new Error('Canonical zodiac ring did not finish all twelve signs.');
    }
    return group;
  }

  function hideLegacyHouseNumbers(svg, limit) {
    const frame = geometry(svg);
    svg.querySelectorAll('.chart-wheel-house-number,.house-number,[data-house-number]').forEach(function (node) {
      if (!node.closest('.' + LAYER)) node.style.display = 'none';
    });
    svg.querySelectorAll('text').forEach(function (node) {
      if (node.closest('.' + LAYER + ',.relphi-canonical-marker-layer,.relphi-canonical-zodiac-ring')) return;
      const value = String(node.textContent || '').trim();
      if (!/^(?:[1-9]|1[0-2])$/.test(value)) return;
      try {
        const box = node.getBBox();
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        if (Math.hypot(x - frame.cx, y - frame.cy) < limit) node.style.display = 'none';
      } catch (_) {}
    });
  }

  function suppressCircledZodiac(svg, hasB) {
    if (!hasB) return;
    svg.querySelectorAll(':scope > .relphi-canonical-zodiac-ring').forEach(function (node) { node.remove(); });
    svg.querySelectorAll('.relphi-canonical-zodiac-source').forEach(function (node) {
      node.style.visibility = 'hidden';
      node.style.pointerEvents = 'none';
    });
  }

  async function renderSvg(svg) {
    if (!isActualWheel(svg)) return;
    const a = read(KEYS.skyA);
    const b = read(KEYS.skyB);
    if (!a) return;
    const asc = longitude(find(a, ['Rising','Ascendant','ASC','AC']));
    if (!Number.isFinite(asc)) return;

    const frame = geometry(svg);
    const nextSignature = signature(a, b, frame);
    const existing = svg.querySelector(':scope > .' + LAYER + '[data-ready="true"]');
    const hasB = !!b && Object.keys(placements(b)).length > 0;
    if (existing && existing.dataset.signature === nextSignature) {
      hideLegacyHouseNumbers(svg, Number(existing.dataset.innerLimit) || frame.span * .32);
      suppressCircledZodiac(svg, hasB);
      return;
    }

    const outer = frame.span * .487;
    const houseThickness = Math.max(20, Math.min(31, frame.span * .038));
    const zodiacThickness = Math.max(34, Math.min(48, frame.span * .058));
    const staging = svgNode('g', {
      class:LAYER + ' relphi-wheel-structure-staging',
      'pointer-events':'none',
      'data-signature':nextSignature,
      visibility:'hidden'
    });
    staging.dataset.cx = frame.cx;
    staging.dataset.cy = frame.cy;
    drawHouseRing(staging, a, 'skyA', asc, outer, houseThickness);
    let current = outer - houseThickness;
    if (hasB) {
      drawHouseRing(staging, b, 'skyB', asc, current, houseThickness);
      current -= houseThickness;
    }
    staging.dataset.innerLimit = String(current - zodiacThickness);
    svg.insertBefore(staging, svg.firstChild);

    try {
      await drawZodiacRing(staging, asc, current, zodiacThickness);
      staging.dataset.ready = 'true';
      staging.classList.remove('relphi-wheel-structure-staging');
      staging.removeAttribute('visibility');
      svg.querySelectorAll(':scope > .' + LAYER + '[data-ready="true"]').forEach(function (oldLayer) {
        if (oldLayer !== staging) oldLayer.remove();
      });
      hideLegacyHouseNumbers(svg, current - zodiacThickness + 6);
      suppressCircledZodiac(svg, hasB);
      window.dispatchEvent(new CustomEvent('relphi:wheel-structure-ready', {
        detail:{ svg, innerRadius:current - zodiacThickness }
      }));
    } catch (error) {
      staging.remove();
      console.error('Sky Chart zodiac structure render failed:', error);
    }
  }

  function run() {
    queued = false;
    document.querySelectorAll(SELECTOR).forEach(function (svg) { renderSvg(svg); });
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(run);
  }

  function onlyOurs(records) {
    return records.length > 0 && records.every(function (record) {
      if (record.target && record.target.closest && record.target.closest('.' + LAYER)) return true;
      const nodes = Array.from(record.addedNodes || []).concat(Array.from(record.removedNodes || [])).filter(function (node) {
        return node && node.nodeType === 1;
      });
      return nodes.length > 0 && nodes.every(function (node) {
        return (node.matches && node.matches('.' + LAYER)) || (node.closest && node.closest('.' + LAYER));
      });
    });
  }

  function start() {
    run();
    new MutationObserver(function (records) { if (!onlyOurs(records)) queue(); }).observe(document.body, { childList:true, subtree:true });
    window.addEventListener('storage', queue);
    window.addEventListener('relphi:sky-builder-v4-loaded', queue);
    window.addEventListener('relphi:extra-points-updated', queue);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
