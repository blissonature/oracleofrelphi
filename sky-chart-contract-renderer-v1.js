// Direct Oracle of Relphi Sky Chart renderer.
// Owns the public shell, wheel, sky ledgers, relationship list, and selected panel.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyChartContractRendererV1) return;
  window.__relphiSkyChartContractRendererV1 = true;

  const NS = 'http://www.w3.org/2000/svg';
  const KEYS = { A:'relphiSkyChartA', B:'relphiSkyChartB' };
  const SKY_COLOR = { A:'#c9211e', B:'#2462d0' };
  const RAINBOW = ['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
  const SIGNS = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  const SIGN_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ORDER = ['sun','moon','asc','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','north-node','south-node','chiron','lilith','part-of-fortune','vertex','mc','ic','dsc'];
  const ASPECTS = [
    { id:'conjunction', angle:0, orb:3, color:'#e53935' },
    { id:'semi-sextile', angle:30, orb:2, color:'#9b8ec4' },
    { id:'octile', angle:45, orb:2, color:'#9b6db0' },
    { id:'sextile', angle:60, orb:3, color:'#d3b727' },
    { id:'quintile', angle:72, orb:2, color:'#c87b36' },
    { id:'square', angle:90, orb:3, color:'#d6534d' },
    { id:'trine', angle:120, orb:3, color:'#4e9e69' },
    { id:'tri-octile', angle:135, orb:2, color:'#8d64a5' },
    { id:'bi-quintile', angle:144, orb:2, color:'#b96d3b' },
    { id:'quincunx', angle:150, orb:3, color:'#4c8fbd' },
    { id:'opposition', angle:180, orb:3, color:'#c9211e' }
  ];
  const C = { x:600, y:600 };
  const R = { bIn:165, bOut:325, zIn:325, zOut:415, aIn:415, aOut:575, bDegree:325, aDegree:415 };
  const PLACEMENT_RADIUS = 16;
  const ANGLE_ALIASES = Object.freeze({
    rising:'asc', ascendant:'asc', asc:'asc', ac:'asc',
    descendant:'dsc', dsc:'dsc', dc:'dsc',
    midheaven:'mc', mc:'mc',
    'imum coeli':'ic', imumcoeli:'ic', ic:'ic',
    vertex:'vertex', vx:'vertex',
    'north node':'north-node', node:'north-node', 'true node':'north-node',
    'south node':'south-node',
    fortune:'part-of-fortune', 'part of fortune':'part-of-fortune', pof:'part-of-fortune'
  });

  let lastSignature = '';
  let currentRelations = [];
  let currentSvg = null;
  let selectedRelationshipIndex = null;
  let renderBusy = false;
  let renderQueued = false;
  let syncingRelationship = false;
  let nativeObserver = null;
  let stateTimer = 0;

  const svgNode = (name, attrs) => {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs || {}).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  };
  const norm = value => ((Number(value) % 360) + 360) % 360;
  const polar = (radius, degree) => {
    const angle = (degree - 180) * Math.PI / 180;
    return { x:C.x + radius * Math.cos(angle), y:C.y + radius * Math.sin(angle) };
  };
  const separation = (a, b) => Math.abs(((a - b + 180) % 360 + 360) % 360 - 180);
  const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[char]);

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }

  function sourcePlacements(payload) {
    if (!payload) return [];
    const source = [payload.placements, payload.positions, payload.points, payload.bodies].find(value => value && typeof value === 'object') || null;
    if (!source) return [];
    if (Array.isArray(source)) return source.map((item, index) => [String(item?.name || item?.label || item?.body || item?.planet || item?.point || item?.id || index), item]);
    return Object.entries(source).filter(([, item]) => item && typeof item === 'object' && !Array.isArray(item));
  }

  function canonicalId(key, item) {
    const registry = window.RelphiGlyphRegistry;
    if (!registry) return '';
    const candidates = [item?.glyphId, item?.id, item?.name, item?.label, item?.body, item?.planet, item?.point, key];
    for (const candidate of candidates) {
      if (candidate == null) continue;
      const normalized = String(candidate).trim().toLowerCase();
      const alias = ANGLE_ALIASES[normalized] || candidate;
      const entry = registry.resolve(alias) || registry.get(alias);
      if (entry) return entry.id;
    }
    return '';
  }

  function longitude(item) {
    if (!item) return NaN;
    if (Number.isFinite(Number(item.longitude))) return norm(item.longitude);
    const sign = SIGNS.indexOf(String(item.sign || item.zodiac || '').trim().toLowerCase());
    if (sign < 0) return NaN;
    return norm(sign * 30 + Number(item.degree || item.degrees || 0) + Number(item.minute || item.minutes || 0) / 60 + Number(item.second || item.seconds || 0) / 3600);
  }

  function records(payload) {
    return sourcePlacements(payload).map(([key, item]) => {
      const id = canonicalId(key, item);
      const value = longitude(item);
      return { key, item, id, value, entry:id ? window.RelphiGlyphRegistry.get(id) || window.RelphiGlyphRegistry.resolve(id) : null };
    }).filter(record => record.entry && Number.isFinite(record.value)).sort((a, b) => {
      const ai = ORDER.indexOf(a.id), bi = ORDER.indexOf(b.id);
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) || a.value - b.value;
    });
  }

  function profile(payload) {
    return payload?.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {};
  }

  function ascLongitude(payload, list) {
    const asc = list.find(record => record.id === 'asc');
    if (asc) return asc.value;
    const direct = Number(profile(payload).ascendant ?? payload?.ascendant ?? payload?.asc);
    return Number.isFinite(direct) ? norm(direct) : 0;
  }

  function cusps(payload, list) {
    const p = profile(payload);
    for (const raw of [p.houseCusps, p.cusps, payload?.houseCusps, payload?.cusps, payload?.houses]) {
      if (!raw) continue;
      const values = (Array.isArray(raw) ? raw : Object.values(raw)).map(value => typeof value === 'object' ? Number(value.longitude ?? value.value ?? value.cusp) : Number(value)).slice(0, 12);
      if (values.length === 12 && values.every(Number.isFinite)) return values.map(norm);
    }
    const asc = ascLongitude(payload, list);
    const system = String(p.houseSystem || payload?.houseSystem || 'whole-sign').toLowerCase();
    const start = system.includes('whole') ? Math.floor(asc / 30) * 30 : asc;
    return Array.from({ length:12 }, (_, index) => norm(start + index * 30));
  }

  function houseFor(value, cuspList) {
    for (let index = 0; index < 12; index += 1) {
      const start = cuspList[index];
      const span = norm(cuspList[(index + 1) % 12] - start) || 30;
      if (norm(value - start) < span) return index + 1;
    }
    return 12;
  }

  function annular(innerRadius, outerRadius, start, end) {
    const span = norm(end - start) || 360;
    const large = span > 180 ? 1 : 0;
    const a = polar(outerRadius, start), b = polar(outerRadius, start + span);
    const c = polar(innerRadius, start + span), d = polar(innerRadius, start);
    return `M${a.x} ${a.y} A${outerRadius} ${outerRadius} 0 ${large} 1 ${b.x} ${b.y} L${c.x} ${c.y} A${innerRadius} ${innerRadius} 0 ${large} 0 ${d.x} ${d.y} Z`;
  }

  function radialLine(parent, innerRadius, outerRadius, degree, attrs) {
    const a = polar(innerRadius, degree), b = polar(outerRadius, degree);
    const node = svgNode('line', Object.assign({ x1:a.x, y1:a.y, x2:b.x, y2:b.y }, attrs || {}));
    parent.appendChild(node);
    return node;
  }

  function radialText(parent, radius, degree, value, attrs) {
    const point = polar(radius, degree);
    const node = svgNode('text', Object.assign({ x:point.x, y:point.y, 'text-anchor':'middle', 'dominant-baseline':'central' }, attrs || {}));
    node.textContent = value;
    parent.appendChild(node);
    return node;
  }

  function relaxedPlacements(list, exactRadius, direction) {
    const lane = exactRadius + direction * 36;
    const secondary = lane + direction * 38;
    const sorted = list.slice().sort((a, b) => a.value - b.value).map((record, index) => Object.assign({}, record, { display:record.value, lane:index % 4 === 3 ? secondary : lane }));
    const minimum = 7.5;
    for (let pass = 0; pass < 12; pass += 1) {
      let moved = false;
      for (let index = 1; index < sorted.length; index += 1) {
        if (sorted[index].lane !== sorted[index - 1].lane) continue;
        const gap = sorted[index].display - sorted[index - 1].display;
        if (gap >= minimum) continue;
        const push = (minimum - gap) / 2;
        sorted[index - 1].display -= push;
        sorted[index].display += push;
        moved = true;
      }
      if (!moved) break;
    }
    sorted.forEach(record => { record.display = norm(record.display); });
    return sorted;
  }

  function relationData(aRecords, bRecords) {
    const relations = [];
    aRecords.forEach(a => bRecords.forEach(b => {
      const distance = separation(a.value, b.value);
      ASPECTS.forEach(aspect => {
        const orb = Math.abs(distance - aspect.angle);
        if (orb <= aspect.orb) relations.push({ a, b, aspect, orb, distance });
      });
    }));
    return relations.sort((left, right) => left.orb - right.orb || left.aspect.angle - right.aspect.angle || left.a.value - right.a.value || left.b.value - right.b.value);
  }

  function ensureShell() {
    let root = document.getElementById('relphiSkyChartContractRoot');
    if (root) return root;
    const chartPanel = document.getElementById('chartPanel');
    if (!chartPanel) return null;
    root = document.createElement('section');
    root.id = 'relphiSkyChartContractRoot';
    root.setAttribute('aria-label', 'Canonical Sky Chart workspace');
    root.innerHTML = `
      <aside id="relphiSkyAPanel" class="relphi-contract-card relphi-contract-sky-a" aria-label="Sky A"></aside>
      <section class="relphi-contract-center">
        <section class="relphi-contract-wheel-panel" aria-label="Comparison zodiac wheel">
          <div id="relphiComparisonWheelMount" class="unified-sky-wheel"><p class="relphi-contract-wheel-status">Loading the canonical chart…</p></div>
        </section>
        <div class="relphi-contract-lower">
          <section class="relphi-contract-relationships" aria-label="Relationships">
            <header class="relphi-contract-section-heading"><h2>Relationships</h2><span id="relphiRelationshipCount" class="relphi-contract-count">0</span></header>
            <div id="relphiRelationshipList"></div>
          </section>
          <section class="relphi-contract-selected" aria-label="Selected Relationship">
            <header class="relphi-contract-section-heading"><h2>Selected Relationship</h2></header>
            <div id="relphiSelectedRelationshipMount"><p class="relphi-contract-selected-empty">Select an aspect line or relationship.</p></div>
          </section>
        </div>
      </section>
      <aside id="relphiSkyBPanel" class="relphi-contract-card relphi-contract-sky-b" aria-label="Sky B"></aside>`;
    chartPanel.prepend(root);
    document.body.classList.add('relphi-sky-contract-active');
    bindShell(root);
    observeNativeOutput();
    return root;
  }

  function bindShell(root) {
    root.addEventListener('click', event => {
      const edit = event.target.closest('[data-contract-edit]');
      if (edit) return openEditor(edit.dataset.contractEdit);
      const row = event.target.closest('.relphi-contract-relationship-row');
      if (row) activateRelationship(Number(row.dataset.relationshipIndex), false);
    });
  }

  function openEditor(sky) {
    const target = sky === 'B' ? 'currentSky' : 'chart';
    document.body.classList.add('relphi-sky-editor-open');
    ['skyCreatorTarget','skyCalcTarget'].forEach(id => {
      const control = document.getElementById(id);
      if (!control) return;
      control.value = target;
      control.dataset.relphiLockedTarget = target;
      control.dispatchEvent(new Event('change', { bubbles:true }));
    });
    document.getElementById('skyBuilderAdvancedMode')?.click();
    document.getElementById('skyCreatorDrawer')?.setAttribute('open', '');
    let back = document.getElementById('relphiReturnToChart');
    if (!back) {
      back = document.createElement('button');
      back.id = 'relphiReturnToChart';
      back.type = 'button';
      back.textContent = 'Back to Sky Chart';
      back.className = 'relphi-primary-action';
      back.addEventListener('click', () => {
        document.body.classList.remove('relphi-sky-editor-open');
        scheduleRender(true);
      });
      document.querySelector('#chartPanel > .sky-chart-hero-panel')?.appendChild(back);
    }
  }

  document.addEventListener('change', event => {
    const control = event.target.closest?.('#skyCreatorTarget,#skyCalcTarget');
    if (!control?.dataset.relphiLockedTarget) return;
    if (control.value !== control.dataset.relphiLockedTarget) {
      control.value = control.dataset.relphiLockedTarget;
      event.stopImmediatePropagation();
      control.dispatchEvent(new Event('change', { bubbles:true }));
    }
  }, true);

  async function drawCanonical(target, id, options) {
    const registry = window.RelphiGlyphRegistry;
    const component = window.RelphiGlyphComponent;
    const entry = registry?.get(id) || registry?.resolve(id);
    if (!entry || !component?.draw) throw new Error('Canonical glyph unavailable: ' + id);
    return component.draw(target, entry.id, options);
  }

  async function drawBubble(target, id, options) {
    const registry = window.RelphiGlyphRegistry;
    const component = window.RelphiGlyphComponent;
    const entry = registry?.get(id) || registry?.resolve(id);
    if (!entry || !component?.createBubble) throw new Error('Canonical glyph unavailable: ' + id);
    const bubble = component.createBubble(target, entry.id, options);
    await bubble.ready;
    return target;
  }

  function coordinate(record) {
    const sign = Math.floor(record.value / 30);
    const within = record.value - sign * 30;
    const degree = Math.floor(within);
    const minute = Math.round((within - degree) * 60) % 60;
    return { sign, degree, minute, text:`${degree}°${String(minute).padStart(2, '0')}′` };
  }

  function renderSkyCard(slot, payload, list, cuspList) {
    const panel = document.getElementById(slot === 'A' ? 'relphiSkyAPanel' : 'relphiSkyBPanel');
    const label = 'Sky ' + slot;
    const name = payload?.name || label;
    if (!panel) return Promise.resolve();
    panel.innerHTML = `<header class="relphi-contract-card-header"><span class="relphi-contract-sky-chip">${label}</span><h2 class="relphi-contract-card-title">${escapeHtml(name)}</h2><button type="button" class="relphi-contract-edit" data-contract-edit="${slot}">Edit</button></header><div class="relphi-contract-ledger"></div>`;
    const ledger = panel.querySelector('.relphi-contract-ledger');
    if (!list.length) {
      ledger.innerHTML = '<p class="relphi-contract-selected-empty">No placements saved.</p>';
      return Promise.resolve();
    }
    const jobs = [];
    list.forEach(record => {
      const position = coordinate(record);
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'relphi-contract-placement-row';
      row.dataset.sky = slot;
      row.dataset.placement = record.id;
      row.innerHTML = `<svg class="relphi-contract-placement-glyph" viewBox="-20 -20 40 40" aria-label="${escapeHtml(record.entry.name)}"></svg><span class="relphi-contract-placement-name">${escapeHtml(record.entry.name)}</span><span class="relphi-contract-placement-degree">${position.text} ${SIGN_NAMES[position.sign]}</span><span class="relphi-contract-placement-house">H${houseFor(record.value, cuspList)}</span>`;
      ledger.appendChild(row);
      const svg = row.querySelector('svg');
      jobs.push(drawCanonical(svg, record.id, { radius:16, padding:1, color:SKY_COLOR[slot] }).catch(error => {
        svg.remove();
        row.dataset.glyphError = error.message;
      }));
    });
    return Promise.allSettled(jobs);
  }

  async function buildWheel(payloadA, payloadB, listA, listB, cuspA, cuspB) {
    const svg = svgNode('svg', { viewBox:'0 0 1200 1200', class:'scn-live-wheel relphi-canonical-ready', role:'img', 'aria-label':'Two-sky rainbow house comparison wheel', 'data-ready':'false' });
    svg.appendChild(svgNode('circle', { cx:C.x, cy:C.y, r:R.aOut + 8, fill:'#fffdf8', stroke:'rgba(23,23,23,.14)' }));
    const layers = {};
    ['sky-b-houses','fixed-zodiac','sky-a-houses','degree-ticks','combined-aspects','ring-outlines','placement-leaders','placement-glyphs'].forEach(name => {
      layers[name] = svgNode('g', { 'data-layer':name });
      svg.appendChild(layers[name]);
    });

    function drawHouseBand(layer, cuspList, innerRadius, outerRadius, sky) {
      cuspList.forEach((start, index) => {
        const end = cuspList[(index + 1) % 12];
        const sector = svgNode('path', {
          d:annular(innerRadius, outerRadius, start, end), fill:RAINBOW[index], 'fill-opacity':'.5',
          class:'relphi-contract-house-sector', tabindex:'0', role:'button',
          'data-interactive':'house', 'data-focusable-piece':'house', 'data-sky':sky, 'data-house':index + 1,
          'aria-label':`Sky ${sky} house ${index + 1}`
        });
        layer.appendChild(sector);
        radialLine(layer, innerRadius, outerRadius, end, { stroke:SKY_COLOR[sky], class:'relphi-contract-house-divider' });
        radialText(layer, (innerRadius + outerRadius) / 2, start + (norm(end - start) || 30) / 2, index + 1, { class:'relphi-contract-house-number' });
      });
    }
    drawHouseBand(layers['sky-b-houses'], cuspB, R.bIn, R.bOut, 'B');
    drawHouseBand(layers['sky-a-houses'], cuspA, R.aIn, R.aOut, 'A');

    const jobs = [];
    for (let index = 0; index < 12; index += 1) {
      const start = index * 30;
      const sector = svgNode('path', {
        d:annular(R.zIn, R.zOut, start, start + 30), fill:RAINBOW[index], 'fill-opacity':'.8',
        class:'relphi-contract-sign-sector', tabindex:'0', role:'button',
        'data-interactive':'sign', 'data-focusable-piece':'sign', 'data-sign-index':index,
        'aria-label':SIGN_NAMES[index]
      });
      layers['fixed-zodiac'].appendChild(sector);
      radialLine(layers['fixed-zodiac'], R.zIn, R.zOut, start, { stroke:'#4b433c', 'stroke-width':'1.4', 'vector-effect':'non-scaling-stroke', 'pointer-events':'none' });
      const point = polar((R.zIn + R.zOut) / 2, start + 15);
      const host = svgNode('g', { transform:`translate(${point.x} ${point.y})`, 'pointer-events':'none' });
      layers['fixed-zodiac'].appendChild(host);
      jobs.push(drawCanonical(host, SIGNS[index], { radius:19, padding:1, color:'#171717' }));
    }

    [R.bIn,R.zIn,R.zOut,R.aOut].forEach(radius => layers['ring-outlines'].appendChild(svgNode('circle', { cx:C.x, cy:C.y, r:radius, class:'relphi-contract-ring' })));
    for (let degree = 0; degree < 360; degree += 1) {
      const length = degree % 10 === 0 ? 12 : degree % 5 === 0 ? 8 : 5;
      const cls = degree % 10 === 0 ? 'relphi-contract-tick major' : 'relphi-contract-tick';
      radialLine(layers['degree-ticks'], R.bDegree - length, R.bDegree + length, degree, { class:cls });
      radialLine(layers['degree-ticks'], R.aDegree - length, R.aDegree + length, degree, { class:cls });
    }

    currentRelations = relationData(listA, listB);
    currentRelations.forEach((relation, index) => {
      const from = polar(R.bIn - 1, relation.a.value), to = polar(R.bIn - 1, relation.b.value);
      const line = svgNode('line', {
        x1:from.x, y1:from.y, x2:to.x, y2:to.y, stroke:relation.aspect.color,
        class:'relphi-contract-aspect', tabindex:'0', role:'button',
        'data-interactive':'aspect', 'data-focusable-piece':'aspect', 'data-aspect-index':index,
        'data-aspect':relation.aspect.id, 'data-sky-a-placement':relation.a.id,
        'data-sky-b-placement':relation.b.id, 'data-orb':relation.orb.toFixed(2),
        'aria-label':`Sky A ${relation.a.entry.name} ${relation.aspect.id} Sky B ${relation.b.entry.name}`
      });
      layers['combined-aspects'].appendChild(line);
    });

    async function drawPlacements(list, sky, exactRadius, direction, cuspList) {
      for (const record of relaxedPlacements(list, exactRadius, direction)) {
        const exact = polar(exactRadius, record.value), display = polar(record.lane, record.display);
        const leader = svgNode('line', {
          x1:display.x, y1:display.y, x2:exact.x, y2:exact.y, stroke:SKY_COLOR[sky],
          class:'relphi-contract-leader', 'data-focusable-piece':'placement-leader',
          'data-sky':sky, 'data-placement':record.id, 'data-longitude':record.value,
          'data-house':houseFor(record.value, cuspList)
        });
        layers['placement-leaders'].appendChild(leader);
        const host = svgNode('g', {
          transform:`translate(${display.x} ${display.y})`, class:'relphi-contract-placement',
          tabindex:'0', role:'button', 'data-interactive':'placement', 'data-focusable-piece':'placement',
          'data-sky':sky, 'data-placement':record.id, 'data-glyph-id':record.id,
          'data-longitude':record.value, 'data-sign-index':Math.floor(record.value / 30),
          'data-house':houseFor(record.value, cuspList), 'aria-label':`Sky ${sky} ${record.entry.name}`
        });
        layers['placement-glyphs'].appendChild(host);
        jobs.push(drawBubble(host, record.id, { radius:PLACEMENT_RADIUS, padding:1, color:SKY_COLOR[sky], fill:'#fffdf8', strokeWidth:2.35 }).catch(error => {
          host.remove(); leader.remove(); console.error(error);
        }));
      }
    }
    await drawPlacements(listA, 'A', R.aDegree, 1, cuspA);
    await drawPlacements(listB, 'B', R.bDegree, -1, cuspB);
    await Promise.allSettled(jobs);
    svg.dataset.ready = 'true';
    return svg;
  }

  async function drawRelationshipRow(row, relation) {
    const left = row.querySelector('[data-side="a"] svg');
    const aspect = row.querySelector('.relphi-contract-aspect-glyph');
    const right = row.querySelector('[data-side="b"] svg');
    await Promise.allSettled([
      drawCanonical(left, relation.a.id, { radius:15, padding:1, color:SKY_COLOR.A }),
      drawCanonical(aspect, relation.aspect.id, { radius:15, padding:1, color:relation.aspect.color }),
      drawCanonical(right, relation.b.id, { radius:15, padding:1, color:SKY_COLOR.B })
    ]);
  }

  function renderRelationshipList() {
    const list = document.getElementById('relphiRelationshipList');
    const count = document.getElementById('relphiRelationshipCount');
    if (!list || !count) return;
    list.replaceChildren();
    count.textContent = String(currentRelations.length);
    count.dataset.relphiTotal = String(currentRelations.length);
    const jobs = [];
    currentRelations.forEach((relation, index) => {
      const a = coordinate(relation.a), b = coordinate(relation.b);
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'relphi-contract-relationship-row';
      row.dataset.relationshipIndex = String(index);
      row.innerHTML = `<span class="relphi-contract-relationship-side" data-side="a"><svg viewBox="-20 -20 40 40" aria-hidden="true"></svg><span class="relphi-contract-relationship-copy">${escapeHtml(relation.a.entry.name)} ${a.text}<span class="relphi-contract-relationship-orb">${escapeHtml(SIGN_NAMES[a.sign])}</span></span></span><svg class="relphi-contract-aspect-glyph" viewBox="-20 -20 40 40" aria-label="${escapeHtml(relation.aspect.id)}"></svg><span class="relphi-contract-relationship-side" data-side="b"><svg viewBox="-20 -20 40 40" aria-hidden="true"></svg><span class="relphi-contract-relationship-copy">${escapeHtml(relation.b.entry.name)} ${b.text}<span class="relphi-contract-relationship-orb">Orb ${relation.orb.toFixed(2)}°</span></span></span>`;
      list.appendChild(row);
      jobs.push(drawRelationshipRow(row, relation));
    });
    Promise.allSettled(jobs);
    window.dispatchEvent(new Event('relphi:relationships-rendered'));
  }

  async function renderProvisionalSelected(index) {
    const relation = currentRelations[index];
    const mount = document.getElementById('relphiSelectedRelationshipMount');
    if (!relation || !mount) return;
    selectedRelationshipIndex = index;
    document.querySelectorAll('.relphi-contract-relationship-row').forEach(row => row.setAttribute('aria-current', row.dataset.relationshipIndex === String(index) ? 'true' : 'false'));
    const a = coordinate(relation.a), b = coordinate(relation.b);
    mount.innerHTML = `<div class="relphi-contract-selected-shell"><div class="relphi-contract-selected-graphic"><svg viewBox="0 0 280 120" role="img" aria-label="${escapeHtml(relation.a.entry.name)} ${escapeHtml(relation.aspect.id)} ${escapeHtml(relation.b.entry.name)}"><line x1="62" y1="60" x2="218" y2="60" stroke="${relation.aspect.color}" stroke-width="3"/><g data-graphic-a transform="translate(62 60)"></g><g data-graphic-b transform="translate(218 60)"></g></svg></div><header class="relphi-contract-selected-facts"><h3>${escapeHtml(relation.a.entry.name)} ${escapeHtml(relation.aspect.id)} ${escapeHtml(relation.b.entry.name)}</h3><p>Orb ${relation.orb.toFixed(2)}° · Sky A ${a.text} ${escapeHtml(SIGN_NAMES[a.sign])} · Sky B ${b.text} ${escapeHtml(SIGN_NAMES[b.sign])}</p></header><div class="relphi-contract-selected-cards"><article class="relphi-contract-selected-card" data-contract-card="a"><p class="relphi-contract-selected-empty">Loading the first card…</p></article><div class="relphi-contract-selected-symbol"><svg viewBox="-22 -22 44 44" aria-label="${escapeHtml(relation.aspect.id)}"></svg></div><article class="relphi-contract-selected-card" data-contract-card="b"><p class="relphi-contract-selected-empty">Loading the second card…</p></article><section class="relphi-contract-selected-reveal"><p class="relphi-contract-selected-empty">Loading the progressive interpretation…</p></section></div></div>`;
    const graphic = mount.querySelector('.relphi-contract-selected-graphic svg');
    await Promise.allSettled([
      drawBubble(graphic.querySelector('[data-graphic-a]'), relation.a.id, { radius:18, padding:1, color:SKY_COLOR.A, fill:'#fffdf8', strokeWidth:2.35 }),
      drawBubble(graphic.querySelector('[data-graphic-b]'), relation.b.id, { radius:18, padding:1, color:SKY_COLOR.B, fill:'#fffdf8', strokeWidth:2.35 }),
      drawBubble(mount.querySelector('.relphi-contract-selected-symbol svg'), relation.aspect.id, { radius:18, padding:1, color:'#171717', fill:'#fffdf8', strokeWidth:2.35 })
    ]);
  }

  function nativeRows() {
    const output = document.querySelector('#chartOutput');
    if (!output) return [];
    const selectors = '[data-relationship-index],.relationship-row,.relphi-relationship-row,.relationship-list-row,[data-relphi-relationship]';
    return Array.from(output.querySelectorAll(selectors)).filter(row => !row.closest('#relphiSkyChartContractRoot'));
  }

  function activateNative(index) {
    const rows = nativeRows();
    const row = rows.find((candidate, fallback) => Number(candidate.dataset.relationshipIndex) === index || fallback === index);
    const control = row?.matches('button,a,[role="button"]') ? row : row?.querySelector('button,a,[role="button"]');
    control?.click();
  }

  function activateRelationship(index, fromWheel) {
    if (!Number.isInteger(index) || !currentRelations[index]) return;
    renderProvisionalSelected(index);
    if (!fromWheel && !syncingRelationship && currentSvg) {
      const line = currentSvg.querySelector(`[data-interactive="aspect"][data-aspect-index="${index}"]`);
      if (line) {
        syncingRelationship = true;
        line.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true, view:window }));
        syncingRelationship = false;
      }
    }
    activateNative(index);
    setTimeout(adoptNativeSelected, 30);
  }

  function likelyCardContainers(host) {
    const marked = Array.from(host.querySelectorAll('.relphi-dual-card-item')).slice(0, 2);
    if (marked.length === 2) return marked;
    const images = Array.from(host.querySelectorAll('img')).filter(image => (image.naturalWidth || image.width) > 50);
    const candidates = images.map(image => image.closest('.tarot-card,.spread-card,figure,article,[class*="card"]') || image.parentElement).filter(Boolean);
    return Array.from(new Set(candidates)).slice(0, 2);
  }

  function adoptNativeSelected() {
    if (selectedRelationshipIndex == null) return;
    const output = document.getElementById('chartOutput');
    const mount = document.getElementById('relphiSelectedRelationshipMount');
    if (!output || !mount) return;
    const reading = output.querySelector('.relphi-progressive-reading,.relphi-canonical-relationship-reading');
    if (!reading) return;
    let host = reading.parentElement;
    while (host && host !== output && likelyCardContainers(host).length < 2) host = host.parentElement;
    if (!host || host === output) return;
    const cards = likelyCardContainers(host);
    if (cards.length < 2) return;
    const left = mount.querySelector('[data-contract-card="a"]');
    const right = mount.querySelector('[data-contract-card="b"]');
    const reveal = mount.querySelector('.relphi-contract-selected-reveal');
    if (!left || !right || !reveal) return;
    [cards[0], cards[1], reading].forEach(node => {
      node.hidden = false;
      node.removeAttribute('hidden');
      node.style.removeProperty('position');
      node.style.removeProperty('width');
      node.style.removeProperty('max-width');
      node.style.removeProperty('min-width');
      node.style.removeProperty('transform');
    });
    left.replaceChildren(cards[0]);
    right.replaceChildren(cards[1]);
    reveal.replaceChildren(reading);
  }

  function observeNativeOutput() {
    if (nativeObserver) return;
    const output = document.getElementById('chartOutput');
    if (!output) return;
    nativeObserver = new MutationObserver(() => {
      if (selectedRelationshipIndex != null) requestAnimationFrame(adoptNativeSelected);
    });
    nativeObserver.observe(output, { childList:true, subtree:true });
  }

  function signature(a, b) {
    try { return JSON.stringify([a, b]); }
    catch (_) { return String(Date.now()); }
  }

  async function render(force) {
    if (renderBusy) { renderQueued = true; return; }
    const root = ensureShell();
    if (!root) return;
    const registry = window.RelphiGlyphRegistry, component = window.RelphiGlyphComponent;
    if (!registry || !component?.draw || !component?.createBubble) {
      document.querySelector('#relphiComparisonWheelMount .relphi-contract-wheel-status').textContent = 'Waiting for the canonical glyph system…';
      setTimeout(() => render(true), 40);
      return;
    }
    const a = read(KEYS.A), b = read(KEYS.B);
    const nextSignature = signature(a, b);
    if (!force && nextSignature === lastSignature) return;
    renderBusy = true;
    renderQueued = false;
    try {
      const listA = records(a), listB = records(b);
      const cuspA = cusps(a, listA), cuspB = cusps(b, listB.length ? listB : listA);
      await Promise.allSettled([renderSkyCard('A', a, listA, cuspA), renderSkyCard('B', b, listB, cuspB)]);
      const mount = document.getElementById('relphiComparisonWheelMount');
      if (!listA.length || !listB.length) {
        mount.innerHTML = `<p class="relphi-contract-wheel-status">${!listA.length ? 'Choose Sky A to begin.' : 'Choose Sky B to compare the skies.'}</p>`;
        currentRelations = [];
        currentSvg = null;
        renderRelationshipList();
      } else {
        const svg = await buildWheel(a, b, listA, listB, cuspA, cuspB);
        mount.replaceChildren(svg);
        currentSvg = svg;
        renderRelationshipList();
        window.dispatchEvent(new CustomEvent('relphi:sky-chart-next-display-ready', { detail:{ svg, container:mount } }));
      }
      lastSignature = nextSignature;
    } catch (error) {
      console.error('Sky Chart contract render failed:', error);
      const mount = document.getElementById('relphiComparisonWheelMount');
      if (mount) mount.innerHTML = '<p class="relphi-contract-wheel-status">The canonical chart could not render. Check the browser console for the exact missing asset.</p>';
    } finally {
      renderBusy = false;
      if (renderQueued) scheduleRender(true);
    }
  }

  function scheduleRender(force) {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => { renderQueued = false; render(!!force); });
  }

  function start() {
    ensureShell();
    render(true);
    window.addEventListener('storage', event => {
      if (!event.key || event.key === KEYS.A || event.key === KEYS.B) scheduleRender(true);
    });
    ['relphi:sky-builder-v4-loaded','relphi:extra-points-updated','relphi:houses-completed'].forEach(name => window.addEventListener(name, () => scheduleRender(true)));
    stateTimer = window.setInterval(() => {
      const next = signature(read(KEYS.A), read(KEYS.B));
      if (next !== lastSignature) scheduleRender(true);
    }, 750);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
