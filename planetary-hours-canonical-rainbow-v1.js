// Canonical Planetary Hours glyphs and rainbow mini-wheel treatment.
// Canonical glyph source: 0d56ee7ec0ea0fc3e44debcb809afde09f3271ab.
// Rainbow geometry and palette follow the approved Sky Chart Next renderer.
(function () {
  'use strict';
  if (!/(^|\/)planetaryhours\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const CANONICAL_VERSION = '0d56ee7';
  const COLORS = [
    '#e53935', '#f06b32', '#f39a2e', '#f5be3d',
    '#f1dc43', '#a9cf46', '#43a85b', '#2ca69b',
    '#3285c7', '#5961c8', '#8c4fb4', '#bd438e'
  ];
  const SIGN_IDS = [
    'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
    'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
  ];
  const PLANET_IDS = new Set(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn']);

  let dependencyPromise = null;
  let queued = false;
  let heptagramGeneration = 0;
  const miniWheelGenerations = new WeakMap();

  function svgNode(name) {
    return document.createElementNS(NS, name);
  }

  function normalizeDegrees(value) {
    const number = Number(value) || 0;
    return ((number % 360) + 360) % 360;
  }

  function waitFor(test, label) {
    return new Promise(function (resolve, reject) {
      const started = Date.now();
      (function check() {
        if (test()) return resolve();
        if (Date.now() - started > 7000) return reject(new Error(label + ' did not load.'));
        setTimeout(check, 40);
      })();
    });
  }

  function loadDependency(src, test, label) {
    if (test()) return Promise.resolve();
    const base = src.split('?')[0];
    let script = document.querySelector('script[src^="' + base + '"]');
    if (!script) {
      script = document.createElement('script');
      script.async = false;
      script.src = src;
      document.body.appendChild(script);
    }
    return waitFor(test, label);
  }

  function ensureCanonicalGlyphSystem() {
    if (window.RelphiGlyphRegistry && window.RelphiGlyphComponent) return Promise.resolve();
    if (!dependencyPromise) {
      dependencyPromise = loadDependency(
        'relphi-glyph-registry-v1.js?v=' + CANONICAL_VERSION,
        function () { return Boolean(window.RelphiGlyphRegistry); },
        'Relphi canonical glyph registry'
      ).then(function () {
        return loadDependency(
          'relphi-glyph-component-v1.js?v=' + CANONICAL_VERSION,
          function () { return Boolean(window.RelphiGlyphComponent); },
          'Relphi canonical glyph component'
        );
      });
    }
    return dependencyPromise;
  }

  function ensureStyles() {
    if (document.getElementById('ph-canonical-rainbow-style')) return;
    const style = document.createElement('style');
    style.id = 'ph-canonical-rainbow-style';
    style.textContent = [
      '.ph-heptagram-canonical-glyph{pointer-events:none}',
      '.ph-current-wheel.ph-rainbow-wheel-ready .wheel-core{fill:#fffdf8}',
      '.ph-current-wheel .ph-rainbow-house-sector{stroke:none}',
      '.ph-current-wheel .ph-rainbow-zodiac-sector{stroke:none}',
      '.ph-current-wheel .ph-rainbow-zodiac-cusp{stroke:rgba(17,17,17,.52);stroke-width:.65}',
      '.ph-current-wheel .ph-rainbow-house-layer{pointer-events:none}',
      '.ph-current-wheel .ph-rainbow-zodiac-layer{pointer-events:none}',
      '.ph-current-wheel.ph-rainbow-wheel-ready .house-label{fill:#171717;font-size:7px;font-weight:900;paint-order:stroke;stroke:rgba(255,253,248,.86);stroke-width:2px}',
      '.ph-current-wheel.ph-rainbow-wheel-ready .house-cusp{stroke:#555;stroke-width:.7;opacity:.55}',
      '.ph-current-wheel .ph-mini-canonical-planet{pointer-events:none}',
      '.ph-current-wheel .ph-mini-canonical-sign{pointer-events:none}'
    ].join('');
    document.head.appendChild(style);
  }

  function resolvePlanetFromGroup(group) {
    const classPlanet = Array.from(group.classList || [])
      .map(function (name) { return /^p-(.+)$/.exec(name); })
      .find(Boolean);
    if (classPlanet && PLANET_IDS.has(classPlanet[1])) return classPlanet[1];

    const title = group.querySelector('title')?.textContent || '';
    const firstWord = title.trim().split(/\s+/)[0];
    const entry = window.RelphiGlyphRegistry?.resolve(firstWord);
    return entry && PLANET_IDS.has(entry.id) ? entry.id : null;
  }

  async function canonicalizeHeptagram() {
    const svg = document.getElementById('heptagramSvg');
    if (!svg) return;
    const sourceNodes = Array.from(svg.querySelectorAll('text.ph-heptagram-glyph'));
    if (!sourceNodes.length) return;

    const generation = ++heptagramGeneration;
    await ensureCanonicalGlyphSystem();
    if (!svg.isConnected || generation !== heptagramGeneration) return;

    const jobs = sourceNodes.map(function (source) {
      if (!source.isConnected) return Promise.resolve();
      const group = source.parentElement;
      const planetId = group && resolvePlanetFromGroup(group);
      const circle = group && group.querySelector('circle.ph-heptagram-node');
      if (!group || !planetId || !circle) return Promise.resolve();

      const x = Number(circle.getAttribute('cx'));
      const y = Number(circle.getAttribute('cy'));
      if (!Number.isFinite(x) || !Number.isFinite(y)) return Promise.resolve();

      const color = circle.classList.contains('current') ? '#fff' : getComputedStyle(group).color;
      source.remove();

      const host = svgNode('g');
      host.classList.add('ph-heptagram-canonical-glyph');
      host.dataset.glyphId = planetId;
      host.setAttribute('transform', 'translate(' + x + ' ' + y + ')');
      host.setAttribute('role', 'img');
      host.setAttribute('aria-label', window.RelphiGlyphRegistry.get(planetId)?.name || planetId);
      const label = group.querySelector('.ph-heptagram-label');
      group.insertBefore(host, label || null);

      return window.RelphiGlyphComponent.draw(host, planetId, {
        radius:13.4,
        padding:1.35,
        color:color
      });
    });

    await Promise.all(jobs);
    if (svg.isConnected && generation === heptagramGeneration) {
      svg.dataset.relphiCanonicalGlyphs = 'true';
      svg.dataset.relphiCanonicalSource = window.RelphiGlyphComponent.canonicalSource || CANONICAL_VERSION;
    }
  }

  function wheelCenter(svg) {
    const box = svg.viewBox && svg.viewBox.baseVal;
    if (box && box.width > 0 && box.height > 0) {
      return { x:box.x + box.width / 2, y:box.y + box.height / 2 };
    }
    return { x:110, y:110 };
  }

  function point(center, radius, screenDegrees) {
    const angle = screenDegrees * Math.PI / 180;
    return {
      x:center.x + Math.cos(angle) * radius,
      y:center.y + Math.sin(angle) * radius
    };
  }

  function annularPath(center, innerRadius, outerRadius, startDegrees, endDegrees) {
    const span = normalizeDegrees(endDegrees - startDegrees) || 360;
    const large = span > 180 ? 1 : 0;
    const outerStart = point(center, outerRadius, startDegrees);
    const outerEnd = point(center, outerRadius, startDegrees + span);
    const innerEnd = point(center, innerRadius, startDegrees + span);
    const innerStart = point(center, innerRadius, startDegrees);
    return [
      'M', outerStart.x, outerStart.y,
      'A', outerRadius, outerRadius, 0, large, 1, outerEnd.x, outerEnd.y,
      'L', innerEnd.x, innerEnd.y,
      'A', innerRadius, innerRadius, 0, large, 0, innerStart.x, innerStart.y,
      'Z'
    ].join(' ');
  }

  function screenAngle(center, x, y) {
    return normalizeDegrees(Math.atan2(y - center.y, x - center.x) * 180 / Math.PI);
  }

  function lineToRadius(line, center, radius) {
    const angle = screenAngle(
      center,
      Number(line.getAttribute('x2')),
      Number(line.getAttribute('y2'))
    );
    const end = point(center, radius, angle);
    line.setAttribute('x2', end.x.toFixed(2));
    line.setAttribute('y2', end.y.toFixed(2));
    return angle;
  }

  function nextMiniWheelGeneration(svg) {
    const generation = (miniWheelGenerations.get(svg) || 0) + 1;
    miniWheelGenerations.set(svg, generation);
    return generation;
  }

  function drawHouseRainbow(svg, center, zodiacInner) {
    const houseLayer = svg.querySelector('.house-layer');
    if (!houseLayer) return;
    const houseGroups = Array.from(houseLayer.children).filter(function (node) {
      return node.querySelector && node.querySelector('line.house-cusp');
    });
    if (houseGroups.length !== 12) return;

    const starts = houseGroups.map(function (group) {
      return lineToRadius(group.querySelector('line.house-cusp'), center, zodiacInner);
    });

    const rainbow = svgNode('g');
    rainbow.classList.add('ph-rainbow-house-layer');
    rainbow.setAttribute('aria-hidden', 'true');
    houseGroups.forEach(function (_, index) {
      const sector = svgNode('path');
      sector.classList.add('ph-rainbow-house-sector');
      sector.setAttribute('d', annularPath(center, 4, zodiacInner, starts[index], starts[(index + 1) % 12]));
      sector.setAttribute('fill', COLORS[index]);
      sector.setAttribute('fill-opacity', '.5');
      rainbow.appendChild(sector);
    });
    houseLayer.parentNode.insertBefore(rainbow, houseLayer);
  }

  function drawZodiacRainbow(svg, center, zodiacInner, zodiacOuter, generation) {
    const oldSignLayer = svg.querySelector('.sign-layer');
    if (oldSignLayer) oldSignLayer.style.display = 'none';

    const layer = svgNode('g');
    layer.classList.add('ph-rainbow-zodiac-layer');
    layer.setAttribute('aria-label', 'Canonical rainbow zodiac');

    const jobs = [];
    SIGN_IDS.forEach(function (signId, index) {
      const start = index * 30 + 180;
      const end = start + 30;
      const sector = svgNode('path');
      sector.classList.add('ph-rainbow-zodiac-sector');
      sector.dataset.sign = signId;
      sector.setAttribute('d', annularPath(center, zodiacInner, zodiacOuter, start, end));
      sector.setAttribute('fill', COLORS[index]);
      sector.setAttribute('fill-opacity', '.78');
      layer.appendChild(sector);

      const cuspStart = point(center, zodiacInner, start);
      const cuspEnd = point(center, zodiacOuter, start);
      const cusp = svgNode('line');
      cusp.classList.add('ph-rainbow-zodiac-cusp');
      cusp.setAttribute('x1', cuspStart.x.toFixed(2));
      cusp.setAttribute('y1', cuspStart.y.toFixed(2));
      cusp.setAttribute('x2', cuspEnd.x.toFixed(2));
      cusp.setAttribute('y2', cuspEnd.y.toFixed(2));
      layer.appendChild(cusp);

      const glyphPoint = point(center, (zodiacInner + zodiacOuter) / 2, start + 15);
      const host = svgNode('g');
      host.classList.add('ph-mini-canonical-sign');
      host.dataset.glyphId = signId;
      host.setAttribute('transform', 'translate(' + glyphPoint.x.toFixed(2) + ' ' + glyphPoint.y.toFixed(2) + ')');
      host.setAttribute('role', 'img');
      host.setAttribute('aria-label', window.RelphiGlyphRegistry.get(signId)?.name || signId);
      layer.appendChild(host);
      jobs.push(window.RelphiGlyphComponent.draw(host, signId, {
        radius:9.4,
        padding:1.1,
        color:'#171717'
      }));
    });

    const houseLayer = svg.querySelector('.house-layer');
    if (houseLayer) houseLayer.insertAdjacentElement('afterend', layer);
    else svg.insertBefore(layer, svg.querySelector('.angle-layer,.planet-layer') || null);

    return Promise.all(jobs).then(function () {
      if (miniWheelGenerations.get(svg) !== generation) layer.remove();
    });
  }

  function canonicalizeMiniPlanets(svg, generation) {
    const jobs = [];
    svg.querySelectorAll('g.planet-marker').forEach(function (marker) {
      if (marker.querySelector(':scope > .ph-mini-canonical-planet')) return;
      const planetId = resolvePlanetFromGroup(marker);
      const dot = marker.querySelector('circle.planet-dot');
      if (!planetId || !dot) return;

      marker.querySelectorAll(':scope > .planet-label,:scope > image.standardized-planet-glyph').forEach(function (node) {
        node.remove();
      });

      const x = Number(dot.getAttribute('cx'));
      const y = Number(dot.getAttribute('cy'));
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;

      const host = svgNode('g');
      host.classList.add('ph-mini-canonical-planet');
      host.dataset.glyphId = planetId;
      host.setAttribute('transform', 'translate(' + x + ' ' + y + ')');
      host.setAttribute('role', 'img');
      host.setAttribute('aria-label', window.RelphiGlyphRegistry.get(planetId)?.name || planetId);
      const title = marker.querySelector('title');
      marker.insertBefore(host, title || null);
      jobs.push(window.RelphiGlyphComponent.draw(host, planetId, {
        radius:5.25,
        padding:.65,
        color:'#111'
      }));
    });

    return Promise.all(jobs).then(function () {
      if (miniWheelGenerations.get(svg) !== generation) return;
      svg.dataset.relphiCanonicalPlanets = 'true';
    });
  }

  async function decorateMiniWheel() {
    const svg = document.querySelector('#phCurrentWheel svg.ph-current-wheel');
    if (!svg) return;
    await ensureCanonicalGlyphSystem();
    if (!svg.isConnected) return;

    const generation = nextMiniWheelGeneration(svg);
    const planetJob = canonicalizeMiniPlanets(svg, generation);
    if (svg.dataset.relphiRainbowReady === 'true') {
      await planetJob;
      return;
    }

    const center = wheelCenter(svg);
    const core = svg.querySelector('circle.wheel-core');
    const zodiacOuter = Number(core?.getAttribute('r')) || 78;
    const zodiacInner = Math.round(zodiacOuter * .628 * 100) / 100;

    drawHouseRainbow(svg, center, zodiacInner);
    const zodiacJob = drawZodiacRainbow(svg, center, zodiacInner, zodiacOuter, generation);
    await Promise.all([planetJob, zodiacJob]);

    if (!svg.isConnected || miniWheelGenerations.get(svg) !== generation) return;
    svg.classList.add('ph-rainbow-wheel-ready');
    svg.dataset.relphiRainbowReady = 'true';
    svg.dataset.relphiRainbowSource = 'sky-chart-next';
    svg.dataset.relphiCanonicalSource = window.RelphiGlyphComponent.canonicalSource || CANONICAL_VERSION;
    svg.setAttribute('aria-label', 'Current planetary placements mini wheel with rainbow houses, rainbow zodiac, and canonical glyphs');
  }

  function run() {
    Promise.all([
      canonicalizeHeptagram(),
      decorateMiniWheel()
    ]).catch(function (error) {
      console.error('Planetary Hours canonical rainbow enhancement failed:', error);
    });
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      run();
    });
  }

  function start() {
    ensureStyles();
    queue();
    new MutationObserver(queue).observe(document.body, {
      childList:true,
      subtree:true,
      characterData:true
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
