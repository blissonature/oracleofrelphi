// Part 1 Sky Chart foundation: canonical panels, rainbow comparison wheel,
// and deterministic collision-safe Angle axes.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyFoundationV1) return;
  window.__relphiSkyFoundationV1 = true;

  const NS = 'http://www.w3.org/2000/svg';
  const KEYS = { A:'relphiSkyChartA', B:'relphiSkyChartB' };
  const SKY = { A:'#c9211e', B:'#2462d0' };
  const COLORS = ['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
  const SIGNS = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  const SIGN_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ORDER = ['sun','moon','asc','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','north-node','south-node','chiron','lilith','part-of-fortune','vertex','mc','ic','dsc'];
  const ANGLE_IDS = new Set(['asc','dsc','mc','ic']);
  const APPROVED_COMPONENT_MASTERS = new Set(['chiron','north-node','south-node','part-of-fortune','vertex','asc','dsc','mc','ic']);
  const ASPECTS = [
    {id:'conjunction',angle:0,orb:3,color:'#e53935'},
    {id:'semi-sextile',angle:30,orb:2,color:'#7c9b49'},
    {id:'octile',angle:45,orb:2,color:'#b86d43'},
    {id:'sextile',angle:60,orb:3,color:'#d3b727'},
    {id:'quintile',angle:72,orb:2,color:'#8b6cc2'},
    {id:'square',angle:90,orb:3,color:'#d6534d'},
    {id:'trine',angle:120,orb:3,color:'#4e9e69'},
    {id:'tri-octile',angle:135,orb:2,color:'#9f5944'},
    {id:'bi-quintile',angle:144,orb:2,color:'#7655aa'},
    {id:'quincunx',angle:150,orb:2,color:'#4b8e88'},
    {id:'opposition',angle:180,orb:3,color:'#5961c8'}
  ];
  const C = { x:600, y:600 };
  const R = { bIn:166, bOut:323, zIn:323, zOut:414, aIn:414, aOut:574, bDegree:323, aDegree:414 };
  const ALIASES = {
    rising:'asc', ascendant:'asc', asc:'asc', ac:'asc',
    descendant:'dsc', dsc:'dsc', dc:'dsc',
    midheaven:'mc', mc:'mc', 'imum coeli':'ic', imumcoeli:'ic', ic:'ic',
    vertex:'vertex', vx:'vertex', 'north node':'north-node', node:'north-node',
    'true node':'north-node', 'south node':'south-node', fortune:'part-of-fortune',
    'part of fortune':'part-of-fortune', pof:'part-of-fortune'
  };
  const ANGLE_LAYOUT = Object.freeze({
    frameRadius:19,
    frameStrokeWidth:2.35,
    minimumClearance:6,
    lineGap:17,
    lanes:Object.freeze({
      A:Object.freeze([540,522,504]),
      B:Object.freeze([202,220,238])
    }),
    edgeRadius:Object.freeze({A:R.aOut,B:R.bIn}),
    extreme:Object.freeze({A:'outer',B:'inner'})
  });

  let lastSignature = '';
  let rendering = false;
  let rerender = false;

  const svg = (name, attrs) => {
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
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }

  function placementSource(payload) {
    if (!payload || typeof payload !== 'object') return [];
    const known = [payload.placements,payload.positions,payload.points,payload.bodies]
      .find(value => value && typeof value === 'object');
    const source = known || payload;
    if (Array.isArray(source)) {
      return source.map((item, index) => [String(item?.name || item?.label || item?.body || item?.planet || item?.point || item?.id || index), item]);
    }
    return Object.entries(source).filter(([key, value]) => value && typeof value === 'object' && !Array.isArray(value) &&
      !/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key) &&
      (Number.isFinite(Number(value.longitude)) || value.sign || value.zodiac));
  }

  function longitude(item) {
    if (!item) return NaN;
    if (Number.isFinite(Number(item.longitude))) return norm(item.longitude);
    const sign = SIGNS.indexOf(String(item.sign || item.zodiac || '').trim().toLowerCase());
    return sign < 0 ? NaN : norm(sign * 30 + Number(item.degree || item.degrees || 0) + Number(item.minute || item.minutes || 0) / 60 + Number(item.second || item.seconds || 0) / 3600);
  }

  function canonicalEntry(key, item) {
    const registry = window.RelphiGlyphRegistry;
    if (!registry) return null;
    for (const candidate of [item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key]) {
      if (candidate == null) continue;
      const raw = String(candidate).trim();
      const canonical = ALIASES[raw.toLowerCase()] || raw;
      const entry = registry.resolve(canonical) || registry.get(canonical);
      if (entry?.asset || APPROVED_COMPONENT_MASTERS.has(entry?.id)) return entry;
    }
    return null;
  }

  function records(payload) {
    const omitted = [];
    const result = placementSource(payload).map(([key, item]) => {
      const entry = canonicalEntry(key, item);
      const value = longitude(item);
      if (!entry && Number.isFinite(value)) omitted.push(String(item?.name || item?.label || key));
      return { key, item, entry, id:entry?.id || '', value };
    }).filter(record => record.entry && Number.isFinite(record.value));
    if (omitted.length) console.info('Sky Chart omitted placements without approved canonical registry entries:', omitted);
    return result.sort((left, right) => {
      const a = ORDER.indexOf(left.id);
      const b = ORDER.indexOf(right.id);
      return (a < 0 ? 999 : a) - (b < 0 ? 999 : b) || left.value - right.value;
    });
  }

  function profile(payload) {
    return payload?.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {};
  }

  function ascendant(payload, list) {
    const record = list.find(item => item.id === 'asc');
    if (record) return record.value;
    const value = Number(profile(payload).ascendant ?? payload?.ascendant ?? payload?.asc);
    return Number.isFinite(value) ? norm(value) : 0;
  }

  function houseCusps(payload, list) {
    const profileData = profile(payload);
    for (const raw of [profileData.houseCusps,profileData.cusps,payload?.houseCusps,payload?.cusps,payload?.houses]) {
      if (!raw) continue;
      const values = (Array.isArray(raw) ? raw : Object.values(raw))
        .map(item => typeof item === 'object' ? Number(item.longitude ?? item.value ?? item.cusp) : Number(item))
        .slice(0, 12);
      if (values.length === 12 && values.every(Number.isFinite)) return values.map(norm);
    }
    const asc = ascendant(payload, list);
    const system = String(profileData.houseSystem || payload?.houseSystem || 'whole-sign').toLowerCase();
    const start = system.includes('whole') ? Math.floor(asc / 30) * 30 : asc;
    return Array.from({length:12}, (_, index) => norm(start + index * 30));
  }

  function houseFor(value, cusps) {
    for (let index = 0; index < 12; index += 1) {
      const start = cusps[index];
      const span = norm(cusps[(index + 1) % 12] - start) || 30;
      if (norm(value - start) < span) return index + 1;
    }
    return 12;
  }

  function coordinate(record) {
    const item = record.item || {};
    const explicitSign = SIGNS.indexOf(String(item.sign || item.zodiac || '').trim().toLowerCase());
    const explicitDegree = Number(item.degree ?? item.degrees);
    const explicitMinute = Number(item.minute ?? item.minutes);
    if (explicitSign >= 0 && Number.isFinite(explicitDegree) && Number.isFinite(explicitMinute)) {
      const degree = Math.max(0, Math.min(29, Math.trunc(explicitDegree)));
      const minute = Math.max(0, Math.min(59, Math.trunc(explicitMinute)));
      return { sign:explicitSign, text:`${degree}°${String(minute).padStart(2,'0')}′` };
    }
    const sign = Math.floor(record.value / 30);
    const within = record.value - sign * 30;
    const degree = Math.floor(within);
    const minute = Math.floor((within - degree) * 60 + 1e-9);
    return { sign, text:`${degree}°${String(minute).padStart(2,'0')}′` };
  }

  function annular(inner, outer, start, end) {
    const span = norm(end - start) || 360;
    const large = span > 180 ? 1 : 0;
    const a = polar(outer, start);
    const b = polar(outer, start + span);
    const c = polar(inner, start + span);
    const d = polar(inner, start);
    return `M${a.x} ${a.y} A${outer} ${outer} 0 ${large} 1 ${b.x} ${b.y} L${c.x} ${c.y} A${inner} ${inner} 0 ${large} 0 ${d.x} ${d.y} Z`;
  }

  function radialLine(parent, inner, outer, degree, attrs) {
    const a = polar(inner, degree);
    const b = polar(outer, degree);
    const line = svg('line', Object.assign({x1:a.x,y1:a.y,x2:b.x,y2:b.y}, attrs || {}));
    parent.appendChild(line);
    return line;
  }

  function radialText(parent, radius, degree, text) {
    const point = polar(radius, degree);
    const node = svg('text', {x:point.x,y:point.y,class:'sky-foundation-house-number'});
    node.textContent = text;
    parent.appendChild(node);
  }

  function shell() {
    let root = document.getElementById('skyFoundationRoot');
    if (root) return root;
    const panel = document.getElementById('chartPanel');
    if (!panel) return null;
    root = document.createElement('section');
    root.id = 'skyFoundationRoot';
    root.setAttribute('aria-label','Sky Chart foundation');
    root.innerHTML = `<aside id="skyFoundationA" class="sky-foundation-panel" aria-label="Sky A"><header class="sky-foundation-heading"><span class="sky-foundation-slot" style="--slot-color:${SKY.A}">Sky A</span><span class="sky-foundation-name">Sky A</span></header><div class="sky-foundation-body"></div></aside><section id="skyFoundationComparison" class="sky-foundation-panel" aria-label="Comparison zodiac wheel"><header class="sky-foundation-heading"><span>Comparison</span></header><div id="skyFoundationWheelMount"></div></section><aside id="skyFoundationB" class="sky-foundation-panel" aria-label="Sky B"><header class="sky-foundation-heading"><span class="sky-foundation-slot" style="--slot-color:${SKY.B}">Sky B</span><span class="sky-foundation-name">Sky B</span></header><div class="sky-foundation-body"></div></aside>`;
    panel.prepend(root);
    document.body.classList.add('sky-foundation-active');
    return root;
  }

  function masterAvailable(entry) {
    return !!entry && (!!entry.asset || APPROVED_COMPONENT_MASTERS.has(entry.id));
  }

  async function drawCanonical(parent, id, options) {
    const registry = window.RelphiGlyphRegistry;
    const component = window.RelphiGlyphComponent;
    const entry = registry?.get(id) || registry?.resolve(id);
    if (!masterAvailable(entry) || !component?.draw) throw new Error('Canonical Master Glyph List entry unavailable: ' + id);
    return component.draw(parent, entry.id, options);
  }

  async function drawLedgerCanonical(parent, id, options) {
    const art = await drawCanonical(parent, id, options);
    parent.dataset.canonicalLedgerGlyph = 'true';
    return art;
  }

  async function drawBubble(parent, id, options) {
    const registry = window.RelphiGlyphRegistry;
    const component = window.RelphiGlyphComponent;
    const entry = registry?.get(id) || registry?.resolve(id);
    if (!masterAvailable(entry) || !component?.createBubble) throw new Error('Canonical Master Glyph List entry unavailable: ' + id);
    const bubble = component.createBubble(parent, entry.id, options);
    await bubble.ready;
    return bubble.root;
  }

  async function drawUncircledBubble(parent, id, options) {
    const registry = window.RelphiGlyphRegistry;
    const component = window.RelphiGlyphComponent;
    const entry = registry?.get(id) || registry?.resolve(id);
    if (!masterAvailable(entry) || !component?.createBubble) throw new Error('Canonical Master Glyph List entry unavailable: ' + id);
    const bubble = component.createBubble(parent, entry.id, options);
    bubble.circle.style.opacity = '0';
    bubble.circle.setAttribute('aria-hidden','true');
    bubble.root.dataset.circlePresentation = 'hidden-only';
    await bubble.ready;
    return bubble.root;
  }

  function preserveCanonicalStrokeWeight(root) {
    const art = root?.querySelector?.('.relphi-canonical-glyph');
    if (!art) return root;
    const transform = art.getAttribute('transform') || '';
    const match = /scale\(\s*([-\d.]+)(?:[\s,]+[-\d.]+)?\s*\)/.exec(transform);
    const fitScale = match ? Math.abs(Number(match[1])) : 1;
    if (!Number.isFinite(fitScale) || fitScale <= 0) return root;
    let preserved = 0;
    art.querySelectorAll('path,circle,ellipse,rect,polygon,polyline,line').forEach(node => {
      const stroke = node.getAttribute('stroke');
      const sourceStroke = Number(node.getAttribute('stroke-width'));
      if (!stroke || stroke === 'none' || !Number.isFinite(sourceStroke) || sourceStroke <= 0) return;
      const fittedStroke = sourceStroke * fitScale;
      node.dataset.canonicalSourceStroke = String(sourceStroke);
      node.dataset.canonicalFittedStroke = fittedStroke.toFixed(6);
      node.setAttribute('stroke-width', fittedStroke.toFixed(6));
      node.setAttribute('vector-effect', 'non-scaling-stroke');
      preserved += 1;
    });
    if (preserved) root.dataset.canonicalStrokePresentation = 'fitted-non-scaling';
    return root;
  }

  function glyphFailure(host, error) {
    host.dataset.relphiGlyphError = error?.message || 'canonical-glyph-failed';
    const mark = svg('g', {'data-canonical-glyph-error':'true'});
    mark.appendChild(svg('rect', {x:-18,y:-11,width:36,height:22,rx:3,fill:'#fff',stroke:'#b00020','stroke-width':2}));
    const label = svg('text', {x:0,y:1,'text-anchor':'middle','dominant-baseline':'middle',fill:'#b00020','font-size':7,'font-weight':800});
    label.textContent = 'GLYPH ERROR';
    mark.appendChild(label);
    host.appendChild(mark);
    console.error(error);
  }

  function renderCard(slot, payload, list, cusps) {
    const panel = document.getElementById(slot === 'A' ? 'skyFoundationA' : 'skyFoundationB');
    if (!panel) return [];
    panel.querySelector('.sky-foundation-name').textContent = payload?.name || `Sky ${slot}`;
    const body = panel.querySelector('.sky-foundation-body');
    body.replaceChildren();
    if (!list.length) {
      body.innerHTML = '<p class="sky-foundation-empty">No approved canonical placements are available for this sky.</p>';
      return [];
    }
    const ledger = document.createElement('div');
    ledger.className = 'sky-foundation-ledger';
    body.appendChild(ledger);
    const jobs = [];
    list.forEach(record => {
      const position = coordinate(record);
      const row = document.createElement('div');
      row.className = 'sky-foundation-row';
      row.innerHTML = `<svg viewBox="-20 -20 40 40" aria-label="${esc(record.entry.name)}"></svg><span class="sky-foundation-row-name">${esc(record.entry.name)}</span><span class="sky-foundation-coordinate">${position.text} ${SIGN_NAMES[position.sign]}</span><span class="sky-foundation-house">H${houseFor(record.value,cusps)}</span>`;
      ledger.appendChild(row);
      const host = row.querySelector('svg');
      jobs.push(drawLedgerCanonical(host, record.id, {radius:16,padding:1,color:SKY[slot]}).catch(error => glyphFailure(host, error)));
    });
    return jobs;
  }

  function spreadPlacements(list, exactRadius, direction) {
    const laneA = exactRadius + direction * 36;
    const laneB = laneA + direction * 38;
    const result = list.slice().sort((a,b) => a.value - b.value)
      .map((record,index) => ({...record,display:record.value,lane:index % 4 === 3 ? laneB : laneA}));
    const gap = 7.5;
    for (let pass = 0; pass < 10; pass += 1) {
      let changed = false;
      for (let index = 1; index < result.length; index += 1) {
        if (result[index].lane !== result[index - 1].lane) continue;
        const difference = result[index].display - result[index - 1].display;
        if (difference >= gap) continue;
        const push = (gap - difference) / 2;
        result[index - 1].display -= push;
        result[index].display += push;
        changed = true;
      }
      if (!changed) break;
    }
    result.forEach(record => { record.display = norm(record.display); });
    return result;
  }

  function relationships(a, b) {
    const result = [];
    a.forEach(left => b.forEach(right => {
      const distance = separation(left.value, right.value);
      ASPECTS.forEach(aspect => {
        const orb = Math.abs(distance - aspect.angle);
        if (orb <= aspect.orb) result.push({left,right,aspect,orb});
      });
    }));
    return result.sort((x,y) => x.orb - y.orb);
  }

  function squareCircleCollision(square, circle, clearance) {
    const dx = Math.max(Math.abs(square.x - circle.x) - square.half, 0);
    const dy = Math.max(Math.abs(square.y - circle.y) - square.half, 0);
    return Math.hypot(dx, dy) < circle.radius + clearance;
  }

  function squareSquareCollision(left, right, clearance) {
    return Math.abs(left.x - right.x) < left.half + right.half + clearance &&
      Math.abs(left.y - right.y) < left.half + right.half + clearance;
  }

  function collides(candidate, obstacles) {
    return obstacles.some(obstacle => obstacle.kind === 'square'
      ? squareSquareCollision(candidate, obstacle, ANGLE_LAYOUT.minimumClearance)
      : squareCircleCollision(candidate, obstacle, ANGLE_LAYOUT.minimumClearance));
  }

  function angleHalfExtent() {
    return ANGLE_LAYOUT.frameRadius + ANGLE_LAYOUT.frameStrokeWidth / 2;
  }

  function buildWheel(listA, listB, cuspsA, cuspsB) {
    const chart = svg('svg', {
      viewBox:'0 0 1200 1200', role:'img',
      'aria-label':'Sky A and Sky B rainbow comparison wheel',
      class:'sky-foundation-wheel relphi-canonical-ready',
      'data-angle-collision-state':'resolved'
    });
    chart.appendChild(svg('circle',{cx:C.x,cy:C.y,r:R.aOut+8,fill:'#fffdf8',stroke:'rgba(31,27,24,.14)'}));
    const layers = {};
    ['b-houses','zodiac','a-houses','ticks','aspects','outlines','leaders','placements'].forEach(name => {
      layers[name] = svg('g', {'data-layer':name});
      chart.appendChild(layers[name]);
    });

    function houses(layer, cusps, inner, outer, slot) {
      cusps.forEach((start,index) => {
        const end = cusps[(index + 1) % 12];
        layer.appendChild(svg('path',{d:annular(inner,outer,start,end),fill:COLORS[index],'fill-opacity':'.5'}));
        radialLine(layer,inner,outer,end,{stroke:SKY[slot],class:'sky-foundation-divider'});
        radialText(layer,(inner+outer)/2,start+(norm(end-start)||30)/2,index+1);
      });
    }

    houses(layers['b-houses'],cuspsB,R.bIn,R.bOut,'B');
    houses(layers['a-houses'],cuspsA,R.aIn,R.aOut,'A');
    const jobs = [];
    const obstacles = [];

    SIGNS.forEach((id,index) => {
      const start = index * 30;
      layers.zodiac.appendChild(svg('path',{d:annular(R.zIn,R.zOut,start,start+30),fill:COLORS[index],'fill-opacity':'.82'}));
      radialLine(layers.zodiac,R.zIn,R.zOut,start,{stroke:'#423b35','stroke-width':'1.35','vector-effect':'non-scaling-stroke'});
      const point = polar((R.zIn+R.zOut)/2,start+15);
      const glyphRadius = 19;
      const host = svg('g',{
        transform:`translate(${point.x} ${point.y})`,
        class:'sky-foundation-sign-glyph',
        'data-zodiac-sign':id,
        'data-wheel-glyph-radius':glyphRadius
      });
      layers.zodiac.appendChild(host);
      obstacles.push({kind:'circle',x:point.x,y:point.y,radius:20,role:'zodiac-glyph'});
      jobs.push(drawUncircledBubble(host,id,{
        radius:glyphRadius,
        padding:1,
        color:'#171717',
        strokeWidth:2.35
      }).then(root => {
        root.dataset.canonicalMaster = 'glyphs-unified-preview.html';
        root.dataset.wheelPresentation = 'without-circles';
        preserveCanonicalStrokeWeight(root);
      }).catch(error => glyphFailure(host,error)));
    });

    [R.bIn,R.zIn,R.zOut,R.aOut].forEach(radius => layers.outlines.appendChild(svg('circle',{cx:C.x,cy:C.y,r:radius,class:'sky-foundation-ring'})));
    for (let degree = 0; degree < 360; degree += 1) {
      const length = degree % 10 === 0 ? 12 : degree % 5 === 0 ? 8 : 5;
      const className = degree % 10 === 0 ? 'sky-foundation-tick sky-foundation-tick-major' : 'sky-foundation-tick';
      radialLine(layers.ticks,R.bDegree-length,R.bDegree+length,degree,{class:className});
      radialLine(layers.ticks,R.aDegree-length,R.aDegree+length,degree,{class:className});
    }

    relationships(listA,listB).forEach(relation => {
      const from = polar(R.bIn-1,relation.left.value);
      const to = polar(R.bIn-1,relation.right.value);
      layers.aspects.appendChild(svg('line',{
        x1:from.x,y1:from.y,x2:to.x,y2:to.y,stroke:relation.aspect.color,
        class:'sky-foundation-aspect','data-aspect':relation.aspect.id,
        'data-left-placement':relation.left.id,'data-right-placement':relation.right.id,
        'data-orb':relation.orb.toFixed(6)
      }));
    });

    function addHouseNumberObstacles(cusps, inner, outer, slot) {
      cusps.forEach((start,index) => {
        const end = cusps[(index + 1) % 12];
        const point = polar((inner+outer)/2,start+(norm(end-start)||30)/2);
        obstacles.push({kind:'circle',x:point.x,y:point.y,radius:11,role:`house-number-${slot}-${index+1}`});
      });
    }
    addHouseNumberObstacles(cuspsA,R.aIn,R.aOut,'A');
    addHouseNumberObstacles(cuspsB,R.bIn,R.bOut,'B');

    function ordinaryLayout(list,slot,exactRadius,direction,cusps) {
      return spreadPlacements(list.filter(record => !ANGLE_IDS.has(record.id)),exactRadius,direction)
        .map(record => ({...record,slot,cusps,exactRadius}));
    }

    const ordinary = [
      ...ordinaryLayout(listA,'A',R.aDegree,1,cuspsA),
      ...ordinaryLayout(listB,'B',R.bDegree,-1,cuspsB)
    ];

    ordinary.forEach(record => {
      const exact = polar(record.exactRadius,record.value);
      const display = polar(record.lane,record.display);
      layers.leaders.appendChild(svg('line',{x1:display.x,y1:display.y,x2:exact.x,y2:exact.y,stroke:SKY[record.slot],class:'sky-foundation-leader'}));
      const host = svg('g',{
        transform:`translate(${display.x} ${display.y})`,
        'data-sky':record.slot,'data-placement':record.id,'data-house':houseFor(record.value,record.cusps)
      });
      layers.placements.appendChild(host);
      obstacles.push({kind:'circle',x:display.x,y:display.y,radius:17.2,role:`placement-${record.slot}-${record.id}`});
      jobs.push(drawBubble(host,record.id,{radius:16,padding:1,color:SKY[record.slot],fill:'#fffdf8',strokeWidth:2.35}).catch(error => glyphFailure(host,error)));
    });

    function placeAngle(record, slot, inner, outer, cusps) {
      const half = angleHalfExtent();
      let chosen = null;
      for (const radius of ANGLE_LAYOUT.lanes[slot]) {
        if (radius - half - ANGLE_LAYOUT.minimumClearance <= inner || radius + half + ANGLE_LAYOUT.minimumClearance >= outer) continue;
        const point = polar(radius,record.value);
        const candidate = {kind:'square',x:point.x,y:point.y,half,role:`angle-${slot}-${record.id}`};
        if (!collides(candidate,obstacles)) {
          chosen = {radius,point,candidate,fallback:false};
          break;
        }
      }
      if (!chosen) {
        const radius = ANGLE_LAYOUT.lanes[slot][0];
        const point = polar(radius,record.value);
        chosen = {radius,point,candidate:{kind:'square',x:point.x,y:point.y,half,role:`angle-${slot}-${record.id}`},fallback:true};
        console.warn(`Sky ${slot} ${record.entry.name} used its deterministic extreme lane at ${record.value}°.`);
      }

      const edge = ANGLE_LAYOUT.edgeRadius[slot];
      const labelSide = slot === 'A'
        ? chosen.radius + ANGLE_LAYOUT.lineGap
        : chosen.radius - ANGLE_LAYOUT.lineGap;
      const lineStart = Math.min(edge,labelSide);
      const lineEnd = Math.max(edge,labelSide);
      const attrs = {
        stroke:SKY[slot],class:'sky-foundation-angle-axis','stroke-width':'2.6',
        'vector-effect':'non-scaling-stroke','data-sky':slot,'data-angle':record.id,
        'data-exact-longitude':record.value.toFixed(8),'data-angle-lane':chosen.radius,
        'data-axis-extreme':ANGLE_LAYOUT.extreme[slot],
        'data-axis-edge-radius':edge
      };
      if (lineEnd > lineStart) radialLine(layers.leaders,lineStart,lineEnd,record.value,attrs);

      const host = svg('g',{
        transform:`translate(${chosen.point.x} ${chosen.point.y})`,
        'data-sky':slot,'data-placement':record.id,'data-angle-axis':'true',
        'data-house':houseFor(record.value,cusps),'data-angle-lane':chosen.radius,
        'data-angle-longitude':record.value.toFixed(8),'data-angle-extreme':ANGLE_LAYOUT.extreme[slot],
        'data-angle-lane-fallback':chosen.fallback ? 'true' : 'false',
        'data-canonical-master':'glyphs-unified-preview.html',
        'data-canonical-viewbox':'-32 -32 64 64'
      });
      layers.placements.appendChild(host);
      obstacles.push(chosen.candidate);
      jobs.push(drawUncircledBubble(host,record.id,{
        radius:ANGLE_LAYOUT.frameRadius,
        padding:1,
        color:SKY[slot],
        strokeWidth:ANGLE_LAYOUT.frameStrokeWidth
      }).then(root => {
        root.dataset.canonicalMaster = 'glyphs-unified-preview.html';
        host.dataset.uncircledCanonical = 'true';
      }).catch(error => glyphFailure(host,error)));
    }

    listA.filter(record => ANGLE_IDS.has(record.id)).forEach(record => placeAngle(record,'A',R.aIn,R.aOut,cuspsA));
    listB.filter(record => ANGLE_IDS.has(record.id)).forEach(record => placeAngle(record,'B',R.bIn,R.bOut,cuspsB));

    return {chart,jobs};
  }

  function signature(a,b) {
    try { return JSON.stringify([a,b]); }
    catch (_) { return String(Date.now()); }
  }

  async function render(force) {
    if (rendering) { rerender = true; return; }
    const root = shell();
    if (!root) return;
    const registry = window.RelphiGlyphRegistry;
    const component = window.RelphiGlyphComponent;
    if (!registry || !component?.draw || !component?.createBubble) {
      setTimeout(() => render(true),20);
      return;
    }
    const payloadA = read(KEYS.A);
    const payloadB = read(KEYS.B);
    const nextSignature = signature(payloadA,payloadB);
    if (!force && nextSignature === lastSignature) return;
    rendering = true;
    rerender = false;
    try {
      const listA = records(payloadA);
      const listB = records(payloadB);
      const cuspsA = houseCusps(payloadA,listA);
      const cuspsB = houseCusps(payloadB,listB);
      const cardJobs = [...renderCard('A',payloadA,listA,cuspsA),...renderCard('B',payloadB,listB,cuspsB)];
      const mount = document.getElementById('skyFoundationWheelMount');
      if (!listA.length || !listB.length) {
        mount.innerHTML = `<p class="sky-foundation-empty">${!listA.length ? 'Sky A needs approved canonical placements.' : 'Sky B needs approved canonical placements.'}</p>`;
        await Promise.allSettled(cardJobs);
      } else {
        const wheel = buildWheel(listA,listB,cuspsA,cuspsB);
        mount.replaceChildren(wheel.chart);
        await Promise.allSettled([...cardJobs,...wheel.jobs]);
      }
      root.setAttribute('aria-busy','false');
      document.body.classList.remove('sky-foundation-booting');
      lastSignature = nextSignature;
      window.dispatchEvent(new Event('relphi:sky-foundation-ready'));
    } catch (error) {
      console.error('Sky Chart foundation render failed:',error);
      document.getElementById('skyFoundationWheelMount').innerHTML = '<p class="sky-foundation-empty">The canonical foundation could not render.</p>';
      document.body.classList.remove('sky-foundation-booting');
    } finally {
      rendering = false;
      if (rerender) requestAnimationFrame(() => render(true));
    }
  }

  function start() {
    shell();
    render(true);
    window.addEventListener('storage',event => {
      if (!event.key || event.key === KEYS.A || event.key === KEYS.B) render(true);
    });
    setInterval(() => {
      const next = signature(read(KEYS.A),read(KEYS.B));
      if (next !== lastSignature) render(true);
    },1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
