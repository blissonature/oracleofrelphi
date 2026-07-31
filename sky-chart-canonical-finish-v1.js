// Final canonical Sky Chart renderer: rainbow comparison, canonical glyphs,
// selected-relationship composition, and legible data-driven heptagram styling.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiCanonicalFinishV1) return;
  window.__relphiCanonicalFinishV1 = true;

  const NS = 'http://www.w3.org/2000/svg';
  const KEYS = { A:'relphiSkyChartA', B:'relphiSkyChartB' };
  const SKY = { A:'#c9211e', B:'#2462d0' };
  const RAINBOW = ['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
  const SIGNS = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  const CENTER = { x:600, y:600 };
  const R = { bIn:165, bOut:330, zIn:330, zOut:420, aIn:420, aOut:575, bDegree:330, aDegree:420 };
  const ASPECTS = [
    { id:'conjunction', angle:0, orb:3, color:'#2b9e93' },
    { id:'sextile', angle:60, orb:3, color:'#82c341' },
    { id:'square', angle:90, orb:3, color:'#efb52f' },
    { id:'trine', angle:120, orb:3, color:'#82c341' },
    { id:'opposition', angle:180, orb:3, color:'#2b9e93' }
  ];
  const ASPECT_SYMBOLS = { '☌':'conjunction', '☍':'opposition', '□':'square', '△':'trine', '✶':'sextile', '⚹':'sextile', '⚻':'quincunx' };
  let renderTimer = 0;
  let rendering = false;
  let lastSignature = '';
  let relationshipTimer = 0;

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }
  function norm(value) { return ((Number(value) || 0) % 360 + 360) % 360; }
  function svgNode(name, attrs) {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs || {}).forEach(function (entry) { node.setAttribute(entry[0], String(entry[1])); });
    return node;
  }
  function polar(radius, degrees) {
    const angle = (degrees - 180) * Math.PI / 180;
    return { x:CENTER.x + radius * Math.cos(angle), y:CENTER.y + radius * Math.sin(angle) };
  }
  function annular(innerRadius, outerRadius, start, end) {
    const span = norm(end - start) || 360;
    const large = span > 180 ? 1 : 0;
    const a = polar(outerRadius, start);
    const b = polar(outerRadius, start + span);
    const c = polar(innerRadius, start + span);
    const d = polar(innerRadius, start);
    return `M${a.x} ${a.y} A${outerRadius} ${outerRadius} 0 ${large} 1 ${b.x} ${b.y} L${c.x} ${c.y} A${innerRadius} ${innerRadius} 0 ${large} 0 ${d.x} ${d.y} Z`;
  }
  function line(parent, r1, r2, degree, attrs) {
    const a = polar(r1, degree);
    const b = polar(r2, degree);
    const node = svgNode('line', Object.assign({ x1:a.x, y1:a.y, x2:b.x, y2:b.y }, attrs || {}));
    parent.appendChild(node);
    return node;
  }
  function text(parent, radius, degree, value, attrs) {
    const p = polar(radius, degree);
    const node = svgNode('text', Object.assign({ x:p.x, y:p.y, 'text-anchor':'middle', 'dominant-baseline':'central' }, attrs || {}));
    node.textContent = value;
    parent.appendChild(node);
    return node;
  }
  function placementEntries(payload) {
    if (!payload) return [];
    const source = [payload.placements, payload.positions, payload.points, payload.bodies, payload].find(function (value) {
      return value && typeof value === 'object';
    });
    if (!source) return [];
    if (Array.isArray(source)) return source.map(function (item, index) {
      return [String(item?.name || item?.label || item?.body || item?.planet || item?.point || item?.id || index), item];
    });
    return Object.entries(source).filter(function (entry) {
      return entry[1] && typeof entry[1] === 'object' && !Array.isArray(entry[1]);
    });
  }
  function longitude(item) {
    if (!item) return NaN;
    if (Number.isFinite(Number(item.longitude))) return norm(item.longitude);
    const signIndex = SIGNS.indexOf(String(item.sign || item.zodiac || '').trim().toLowerCase());
    if (signIndex < 0) return NaN;
    return norm(signIndex * 30 + Number(item.degree || item.degrees || 0) + Number(item.minute || item.minutes || 0) / 60 + Number(item.second || item.seconds || 0) / 3600);
  }
  function glyphEntry(key, item) {
    const registry = window.RelphiGlyphRegistry;
    if (!registry) return null;
    const candidates = [key, item?.name, item?.label, item?.body, item?.planet, item?.point, item?.glyphId, item?.id];
    for (const value of candidates) {
      if (!value) continue;
      const entry = registry.resolve(value) || registry.get(value);
      if (entry) return entry;
    }
    return null;
  }
  function records(payload) {
    return placementEntries(payload).map(function (entry) {
      return { key:entry[0], item:entry[1], entry:glyphEntry(entry[0], entry[1]), value:longitude(entry[1]) };
    }).filter(function (record) { return record.entry && Number.isFinite(record.value); });
  }
  function ascLongitude(payload, items) {
    const direct = placementEntries(payload).find(function (entry) {
      const label = String(entry[0]) + ' ' + String(entry[1]?.name || entry[1]?.label || '');
      return /\b(asc|ascendant|rising|ac)\b/i.test(label);
    });
    if (direct) {
      const value = longitude(direct[1]);
      if (Number.isFinite(value)) return value;
    }
    const record = items.find(function (item) { return item.entry.id === 'asc'; });
    return record ? record.value : 0;
  }
  function profile(payload) {
    return payload?.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {};
  }
  function cusps(payload, asc) {
    const p = profile(payload);
    for (const raw of [p.houseCusps, p.cusps, payload?.houseCusps, payload?.cusps, payload?.houses]) {
      if (!raw) continue;
      const values = (Array.isArray(raw) ? raw : Object.values(raw)).map(function (item) {
        return typeof item === 'object' ? Number(item.longitude ?? item.value ?? item.cusp) : Number(item);
      }).slice(0, 12);
      if (values.length === 12 && values.every(Number.isFinite)) return values.map(norm);
    }
    const system = String(p.houseSystem || payload?.houseSystem || '').toLowerCase();
    const start = system.includes('whole') ? Math.floor(asc / 30) * 30 : asc;
    return Array.from({ length:12 }, function (_, index) { return norm(start + index * 30); });
  }
  function angularDistance(a, b) {
    const delta = Math.abs(norm(a) - norm(b));
    return Math.min(delta, 360 - delta);
  }
  function findAspect(a, b) {
    const distance = angularDistance(a, b);
    return ASPECTS.find(function (aspect) { return Math.abs(distance - aspect.angle) <= aspect.orb; }) || null;
  }
  function aspectRecords(a, b) {
    const output = [];
    a.forEach(function (first) {
      b.forEach(function (second) {
        const aspect = findAspect(first.value, second.value);
        if (!aspect) return;
        output.push({ first:first, second:second, aspect:aspect, orb:Math.abs(angularDistance(first.value, second.value) - aspect.angle) });
      });
    });
    return output.sort(function (x, y) { return x.orb - y.orb; });
  }
  function drawHouseBand(parent, cuspList, innerRadius, outerRadius, skyColor, skyId) {
    cuspList.forEach(function (start, index) {
      const end = cuspList[(index + 1) % 12];
      const sector = svgNode('path', {
        d:annular(innerRadius, outerRadius, start, end),
        fill:RAINBOW[index],
        'fill-opacity':'.5',
        class:'relphi-final-house-sector',
        tabindex:'0',
        role:'button',
        'data-sky':skyId,
        'data-house':index + 1,
        'aria-label':'Sky ' + skyId + ' house ' + (index + 1)
      });
      parent.appendChild(sector);
      line(parent, innerRadius, outerRadius, end, { stroke:skyColor, class:'relphi-final-house-divider' });
      text(parent, (innerRadius + outerRadius) / 2, start + (norm(end - start) || 30) / 2, String(index + 1), { class:'relphi-final-house-number' });
    });
  }
  function spread(items, minimum) {
    const sorted = items.slice().sort(function (a, b) { return a.value - b.value; }).map(function (item) {
      return Object.assign({}, item, { display:item.value });
    });
    for (let pass = 0; pass < 10; pass += 1) {
      let changed = false;
      for (let index = 1; index < sorted.length; index += 1) {
        const gap = sorted[index].display - sorted[index - 1].display;
        if (gap >= minimum) continue;
        const push = (minimum - gap) / 2;
        sorted[index - 1].display -= push;
        sorted[index].display += push;
        changed = true;
      }
      if (!changed) break;
    }
    sorted.forEach(function (item) { item.display = norm(item.display); });
    return sorted;
  }
  async function canonicalBubble(parent, id, options) {
    const component = window.RelphiGlyphComponent;
    const entry = window.RelphiGlyphRegistry?.get(id) || window.RelphiGlyphRegistry?.resolve(id);
    if (!component?.createBubble || !entry) throw new Error('Canonical glyph unavailable: ' + id);
    const bubble = component.createBubble(parent, entry.id, options);
    await bubble.ready;
    return parent;
  }
  async function canonicalGlyph(parent, id, options) {
    const component = window.RelphiGlyphComponent;
    const entry = window.RelphiGlyphRegistry?.get(id) || window.RelphiGlyphRegistry?.resolve(id);
    if (!component?.draw || !entry) throw new Error('Canonical glyph unavailable: ' + id);
    await component.draw(parent, entry.id, options);
    return parent;
  }
  async function buildWheel(payloadA, payloadB) {
    const itemsA = records(payloadA);
    const itemsB = records(payloadB);
    if (!itemsA.length) throw new Error('Sky A has no renderable placements.');
    const ascA = ascLongitude(payloadA, itemsA);
    const ascB = itemsB.length ? ascLongitude(payloadB, itemsB) : ascA;
    const cuspA = cusps(payloadA, ascA);
    const cuspB = cusps(payloadB, ascB);
    const svg = svgNode('svg', {
      viewBox:'0 0 1200 1200',
      class:'scn-live-wheel relphi-final-comparison-wheel relphi-canonical-ready',
      role:'img',
      'aria-label':'Rainbow two-sky comparison wheel with canonical glyphs',
      'data-ready':'false'
    });
    svg.appendChild(svgNode('circle', { cx:CENTER.x, cy:CENTER.y, r:R.aOut + 8, fill:'#fffdf8', stroke:'rgba(23,23,23,.16)' }));
    const bHouses = svgNode('g', { 'data-layer':'sky-b-houses' });
    const zodiac = svgNode('g', { 'data-layer':'fixed-zodiac' });
    const aHouses = svgNode('g', { 'data-layer':'sky-a-houses' });
    const ticks = svgNode('g', { 'data-layer':'degree-ticks' });
    const aspects = svgNode('g', { 'data-layer':'cross-sky-aspects' });
    const leaders = svgNode('g', { 'data-layer':'placement-leaders' });
    const glyphs = svgNode('g', { 'data-layer':'placement-glyphs' });
    const outlines = svgNode('g', { 'data-layer':'ring-outlines' });
    svg.append(bHouses, zodiac, aHouses, ticks, aspects, outlines, leaders, glyphs);
    drawHouseBand(bHouses, cuspB, R.bIn, R.bOut, SKY.B, 'B');
    drawHouseBand(aHouses, cuspA, R.aIn, R.aOut, SKY.A, 'A');
    const jobs = [];
    for (let index = 0; index < 12; index += 1) {
      const start = index * 30;
      zodiac.appendChild(svgNode('path', { d:annular(R.zIn, R.zOut, start, start + 30), fill:RAINBOW[index], 'fill-opacity':'.8' }));
      line(zodiac, R.zIn, R.zOut, start, { stroke:'#4c433a', class:'relphi-final-zodiac-cusp' });
      const p = polar((R.zIn + R.zOut) / 2, start + 15);
      const host = svgNode('g', { transform:'translate(' + p.x + ' ' + p.y + ')' });
      zodiac.appendChild(host);
      jobs.push(canonicalGlyph(host, SIGNS[index], { radius:19, padding:1, color:'#171717' }));
    }
    [R.bIn, R.zIn, R.zOut, R.aOut].forEach(function (radius) {
      outlines.appendChild(svgNode('circle', { cx:CENTER.x, cy:CENTER.y, r:radius, class:'relphi-final-ring' }));
    });
    for (let degree = 0; degree < 360; degree += 1) {
      const length = degree % 10 === 0 ? 12 : degree % 5 === 0 ? 8 : 5;
      const cls = degree % 10 === 0 ? 'relphi-final-degree major' : 'relphi-final-degree';
      line(ticks, R.bDegree - length, R.bDegree + length, degree, { class:cls });
      line(ticks, R.aDegree - length, R.aDegree + length, degree, { class:cls });
    }
    const cross = aspectRecords(itemsA, itemsB);
    cross.forEach(function (record, index) {
      const p1 = polar(R.zIn - 18, record.first.value);
      const p2 = polar(R.zIn - 18, record.second.value);
      const aspectLine = svgNode('line', {
        x1:p1.x, y1:p1.y, x2:p2.x, y2:p2.y,
        stroke:record.aspect.color,
        class:'relphi-final-aspect-line',
        'data-aspect-index':index,
        'data-aspect-id':record.aspect.id,
        'data-a-id':record.first.entry.id,
        'data-b-id':record.second.entry.id,
        tabindex:'0',
        role:'button',
        'aria-label':record.first.entry.name + ' ' + record.aspect.id + ' ' + record.second.entry.name
      });
      aspects.appendChild(aspectLine);
    });
    async function drawPlacements(items, sky, exactRadius, displayRadius) {
      for (const item of spread(items, 7.5)) {
        const exact = polar(exactRadius, item.value);
        const display = polar(displayRadius, item.display);
        leaders.appendChild(svgNode('line', {
          x1:display.x, y1:display.y, x2:exact.x, y2:exact.y,
          stroke:SKY[sky], class:'relphi-final-placement-leader',
          'data-sky':sky, 'data-glyph-id':item.entry.id
        }));
        const host = svgNode('g', {
          transform:'translate(' + display.x + ' ' + display.y + ')',
          'data-sky':sky,
          'data-glyph-id':item.entry.id,
          'data-longitude':item.value,
          class:'relphi-final-placement',
          tabindex:'0',
          role:'button',
          'aria-label':'Sky ' + sky + ' ' + item.entry.name
        });
        glyphs.appendChild(host);
        jobs.push(canonicalBubble(host, item.entry.id, { radius:16, padding:1, color:SKY[sky], fill:'#fffdf8', strokeWidth:2.35 }));
      }
    }
    await drawPlacements(itemsA, 'A', R.aDegree, R.aDegree + 34);
    await drawPlacements(itemsB, 'B', R.bDegree, R.bDegree - 34);
    await Promise.all(jobs);
    svg.dataset.ready = 'true';
    return svg;
  }
  function ensureMount() {
    let mount = document.querySelector('.unified-sky-wheel');
    if (mount) return mount;
    const output = document.getElementById('chartOutput') || document.querySelector('.sky-output-box');
    if (!output) return null;
    mount = document.createElement('div');
    mount.className = 'unified-sky-wheel relphi-final-wheel-mount';
    mount.setAttribute('aria-label', 'Sky comparison wheel');
    const exact = Array.from(output.querySelectorAll('h2,h3,h4')).find(function (heading) {
      return /exact relationships/i.test(heading.textContent || '');
    });
    if (exact) exact.closest('section,div')?.before(mount);
    else output.prepend(mount);
    return mount;
  }
  function signature(a, b) {
    try { return JSON.stringify([a, b]); }
    catch (_) { return String(Date.now()); }
  }
  async function renderWheel(force) {
    if (rendering) return;
    const registry = window.RelphiGlyphRegistry;
    const component = window.RelphiGlyphComponent;
    if (!registry || !component?.createBubble || !component?.draw) {
      scheduleWheel(80, true);
      return;
    }
    const a = read(KEYS.A);
    const b = read(KEYS.B);
    if (!records(a).length) {
      scheduleWheel(150, true);
      return;
    }
    const mount = ensureMount();
    if (!mount) {
      scheduleWheel(100, true);
      return;
    }
    const next = signature(a, b);
    if (!force && next === lastSignature && mount.querySelector(':scope > .relphi-final-comparison-wheel[data-ready="true"]')) return;
    rendering = true;
    try {
      const svg = await buildWheel(a, b);
      if (!mount.isConnected) return;
      mount.replaceChildren(svg);
      mount.dataset.displayMethod = 'canonical-rainbow-houses';
      lastSignature = next;
      window.dispatchEvent(new CustomEvent('relphi:sky-chart-next-display-ready', { detail:{ svg:svg, container:mount } }));
    } catch (error) {
      console.error('Canonical comparison wheel failed:', error);
    } finally {
      rendering = false;
    }
  }
  function scheduleWheel(delay, force) {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(function () { renderWheel(!!force); }, Number(delay) || 0);
  }

  function aspectIdentity(textValue) {
    const text = String(textValue || '');
    for (const symbol of Object.keys(ASPECT_SYMBOLS)) if (text.includes(symbol)) return ASPECT_SYMBOLS[symbol];
    for (const id of ['opposition','conjunction','square','trine','sextile','quincunx']) if (new RegExp(id, 'i').test(text)) return id;
    return 'opposition';
  }
  function findSelectedPanel() {
    return document.querySelector('.relphi-mobile-dual-card-view') || Array.from(document.querySelectorAll('section,article,div')).find(function (node) {
      const heading = node.querySelector(':scope > h2,:scope > h3,:scope > h4,:scope > .eyebrow');
      return heading && /selected relationship/i.test(heading.textContent || '');
    });
  }
  function cardCandidates(host) {
    let cards = Array.from(host.querySelectorAll('.relphi-dual-card-item')).slice(0, 2);
    if (cards.length >= 2) return cards;
    const images = Array.from(host.querySelectorAll('img')).filter(function (img) { return img.width > 40 || img.naturalWidth > 40; });
    cards = images.map(function (img) { return img.closest('article,section,figure,div'); }).filter(Boolean);
    return Array.from(new Set(cards)).slice(0, 2);
  }
  function resetTree(node) {
    if (!node) return;
    node.style.removeProperty('position');
    node.style.removeProperty('left');
    node.style.removeProperty('right');
    node.style.removeProperty('top');
    node.style.removeProperty('bottom');
    node.style.removeProperty('transform');
    node.style.removeProperty('width');
    node.style.removeProperty('max-width');
    node.style.removeProperty('min-width');
    node.style.removeProperty('writing-mode');
    node.querySelectorAll('*').forEach(function (child) {
      ['position','left','right','top','bottom','transform','width','max-width','min-width','writing-mode'].forEach(function (property) {
        child.style.removeProperty(property);
      });
    });
  }
  async function rebuildRelationship() {
    const host = findSelectedPanel();
    if (!host || host.dataset.relphiFinalRelationship === 'true') return false;
    const reading = host.querySelector('.relphi-progressive-reading,.relphi-canonical-relationship-reading');
    const cards = cardCandidates(host);
    if (!reading || cards.length < 2) return false;
    const sourceText = host.textContent || '';
    const aspectId = aspectIdentity(sourceText);
    const aspectEntry = window.RelphiGlyphRegistry?.get(aspectId) || window.RelphiGlyphRegistry?.resolve(aspectId);
    const orb = sourceText.match(/Orb:\s*([^\.\n]+)/i)?.[1]?.trim() || sourceText.match(/\b\d+°\s*\d+[′']/)?.[0] || '';
    const shell = document.createElement('div');
    shell.className = 'relphi-final-relationship-shell';
    const graphic = host.querySelector('.relphi-skinny-aspect-anchor,svg:not(.relphi-workspace-glyph):not([data-relphi-glyph]),canvas');
    if (graphic && !cards.some(function (card) { return card.contains(graphic); }) && !reading.contains(graphic)) {
      const graphicSlot = document.createElement('div');
      graphicSlot.className = 'relphi-final-relationship-graphic';
      graphicSlot.appendChild(graphic);
      shell.appendChild(graphicSlot);
    }
    const facts = document.createElement('header');
    facts.className = 'relphi-final-relationship-facts';
    const title = document.createElement('h3');
    title.textContent = aspectEntry?.name || aspectId;
    facts.appendChild(title);
    if (orb) {
      const orbNode = document.createElement('p');
      orbNode.textContent = 'Orb ' + orb;
      facts.appendChild(orbNode);
    }
    shell.appendChild(facts);
    const cardsRow = document.createElement('div');
    cardsRow.className = 'relphi-final-relationship-cards';
    const left = document.createElement('article');
    left.className = 'relphi-final-relationship-card';
    resetTree(cards[0]);
    left.appendChild(cards[0]);
    const middle = document.createElement('div');
    middle.className = 'relphi-final-relationship-symbol';
    const symbolSvg = svgNode('svg', { viewBox:'-24 -24 48 48', role:'img', 'aria-label':aspectEntry?.name || aspectId });
    middle.appendChild(symbolSvg);
    const right = document.createElement('article');
    right.className = 'relphi-final-relationship-card';
    resetTree(cards[1]);
    right.appendChild(cards[1]);
    cardsRow.append(left, middle, right);
    shell.appendChild(cardsRow);
    const reveal = document.createElement('section');
    reveal.className = 'relphi-final-relationship-reveal';
    reveal.appendChild(reading);
    shell.appendChild(reveal);
    Array.from(host.children).forEach(function (child) {
      if (child !== shell) child.hidden = true;
    });
    host.appendChild(shell);
    host.classList.add('relphi-final-relationship-host');
    host.dataset.relphiFinalRelationship = 'true';
    if (aspectEntry) await canonicalBubble(symbolSvg, aspectEntry.id, { radius:18, padding:1, color:'#111', fill:'#fffdf8', strokeWidth:2.35 });
    return true;
  }
  function scheduleRelationship() {
    clearTimeout(relationshipTimer);
    relationshipTimer = setTimeout(function () {
      const host = findSelectedPanel();
      if (host && !host.querySelector('.relphi-final-relationship-shell')) delete host.dataset.relphiFinalRelationship;
      rebuildRelationship().catch(function (error) { console.error('Selected relationship rebuild failed:', error); });
    }, 40);
  }

  function strengthenHeptagram() {
    document.querySelectorAll('.relphi-skinny-heptagram').forEach(function (portal) {
      portal.classList.add('relphi-final-heptagram');
      const svg = portal.querySelector('svg');
      if (svg) svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    });
  }
  function ensureStyles() {
    if (document.getElementById('relphi-canonical-finish-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-canonical-finish-style';
    style.textContent = `
      .unified-sky-wheel{position:relative;min-height:0;background:#fffdf8;border-radius:1rem;overflow:hidden}
      .unified-sky-wheel>.relphi-final-comparison-wheel{display:block!important;width:100%!important;height:auto!important;visibility:visible!important;opacity:1!important;overflow:visible}
      .relphi-final-comparison-wheel .relphi-final-ring{fill:none;stroke:#201d19;stroke-width:1.2}
      .relphi-final-comparison-wheel .relphi-final-house-divider{stroke-width:3;vector-effect:non-scaling-stroke}
      .relphi-final-comparison-wheel .relphi-final-house-number{font:700 16px/1 Georgia,serif;fill:#26211d;pointer-events:none}
      .relphi-final-comparison-wheel .relphi-final-zodiac-cusp{stroke-width:1.6;vector-effect:non-scaling-stroke}
      .relphi-final-comparison-wheel .relphi-final-degree{stroke:rgba(23,23,23,.52);stroke-width:1.15;vector-effect:non-scaling-stroke}
      .relphi-final-comparison-wheel .relphi-final-degree.major{stroke:rgba(23,23,23,.82);stroke-width:1.8}
      .relphi-final-comparison-wheel .relphi-final-placement-leader{fill:none;stroke-width:1.55;opacity:.72;vector-effect:non-scaling-stroke}
      .relphi-final-comparison-wheel .relphi-final-aspect-line{stroke-width:3;opacity:.7;vector-effect:non-scaling-stroke;cursor:pointer;transition:opacity .12s ease,stroke-width .12s ease}
      .relphi-final-comparison-wheel .relphi-final-aspect-line:hover,.relphi-final-comparison-wheel .relphi-final-aspect-line:focus{opacity:1;stroke-width:6;outline:none}
      .relphi-final-house-sector{cursor:pointer;transition:filter .12s ease,fill-opacity .12s ease}
      .relphi-final-house-sector:hover,.relphi-final-house-sector:focus{filter:saturate(1.4) brightness(1.04);fill-opacity:.72;outline:none}
      .relphi-final-placement{cursor:pointer}
      .relphi-final-relationship-host{width:100%!important;min-width:0!important;max-width:none!important;overflow:visible!important}
      .relphi-final-relationship-shell{display:grid;grid-template-columns:minmax(0,1fr);gap:1rem;width:100%;min-width:0}
      .relphi-final-relationship-graphic{display:grid;place-items:center;width:100%;min-height:110px;overflow:visible}
      .relphi-final-relationship-graphic>*{display:block;max-width:min(100%,320px);height:auto;position:static!important;transform:none!important}
      .relphi-final-relationship-facts{display:grid;gap:.25rem;text-align:center;min-width:0}
      .relphi-final-relationship-facts h3{margin:0;font-size:1.25rem}.relphi-final-relationship-facts p{margin:0;color:#666;font-weight:700}
      .relphi-final-relationship-cards{display:grid;grid-template-columns:minmax(0,1fr) 52px minmax(0,1fr);gap:.75rem;align-items:start;width:100%;min-width:0}
      .relphi-final-relationship-card{min-width:0;width:100%;padding:0;margin:0;background:transparent;border:0;overflow:visible}
      .relphi-final-relationship-card>*{display:block!important;width:100%!important;min-width:0!important;max-width:none!important;height:auto!important;margin:0!important;padding:0!important;position:static!important;inset:auto!important;transform:none!important;white-space:normal!important;word-break:normal!important;overflow-wrap:break-word!important;writing-mode:horizontal-tb!important;overflow:visible!important}
      .relphi-final-relationship-card img{display:block!important;width:min(100%,180px)!important;max-width:180px!important;height:auto!important;margin:0 auto .6rem!important}
      .relphi-final-relationship-card svg,.relphi-final-relationship-card canvas{max-width:100%!important;height:auto!important}
      .relphi-final-relationship-symbol{display:grid;place-items:center;align-self:center;width:52px;height:52px}.relphi-final-relationship-symbol svg{display:block;width:48px;height:48px;overflow:visible}
      .relphi-final-relationship-reveal{width:100%;min-width:0;padding:1rem;border-radius:1rem;background:#fffdf8;line-height:1.55;overflow:visible}
      .relphi-final-relationship-reveal>*{width:100%!important;min-width:0!important;max-width:none!important;white-space:normal!important;word-break:normal!important;overflow-wrap:normal!important}
      .relphi-skinny-heptagram.relphi-final-heptagram{display:grid!important;place-items:center!important;width:78px!important;height:78px!important;margin:.35rem auto .18rem!important;opacity:1!important;filter:contrast(1.22) saturate(1.15)!important;overflow:visible!important}
      .relphi-skinny-heptagram.relphi-final-heptagram svg{display:block!important;width:78px!important;height:78px!important;opacity:1!important;overflow:visible!important}
      .relphi-skinny-heptagram.relphi-final-heptagram svg *{opacity:1}
      .relphi-skinny-heptagram.relphi-final-heptagram line,.relphi-skinny-heptagram.relphi-final-heptagram path{vector-effect:non-scaling-stroke}
      .relphi-skinny-row svg[data-relphi-glyph]:not([data-ready="true"]){visibility:hidden!important}
      @media(max-width:700px){
        .relphi-final-relationship-cards{grid-template-columns:minmax(0,1fr) 42px minmax(0,1fr);gap:.4rem}
        .relphi-final-relationship-symbol{width:42px;height:42px}.relphi-final-relationship-symbol svg{width:40px;height:40px}
        .relphi-final-relationship-card img{max-width:130px!important}
      }
    `;
    document.head.appendChild(style);
  }
  function bindInteractions() {
    document.addEventListener('click', function (event) {
      const lineNode = event.target.closest('.relphi-final-aspect-line');
      if (lineNode) {
        const svg = lineNode.closest('svg');
        svg?.querySelectorAll('.relphi-final-aspect-line').forEach(function (line) { line.style.opacity = line === lineNode ? '1' : '.1'; });
        window.dispatchEvent(new CustomEvent('relphi:aspect-selection', { detail:{
          index:Number(lineNode.dataset.aspectIndex),
          aspectId:lineNode.dataset.aspectId,
          aId:lineNode.dataset.aId,
          bId:lineNode.dataset.bId
        } }));
        scheduleRelationship();
      }
    }, true);
  }
  function start() {
    ensureStyles();
    bindInteractions();
    scheduleWheel(0, true);
    scheduleRelationship();
    strengthenHeptagram();
    [100,300,700,1300].forEach(function (delay) {
      setTimeout(function () { scheduleWheel(0, true); scheduleRelationship(); strengthenHeptagram(); }, delay);
    });
    window.addEventListener('storage', function (event) {
      if (!event.key || event.key === KEYS.A || event.key === KEYS.B) scheduleWheel(20, true);
    });
    ['relphi:sky-builder-v4-loaded','relphi:extra-points-updated','relphi:houses-completed'].forEach(function (name) {
      window.addEventListener(name, function () { scheduleWheel(40, true); scheduleRelationship(); strengthenHeptagram(); });
    });
    new MutationObserver(function (records) {
      let wheelRelevant = false;
      let relationshipRelevant = false;
      records.forEach(function (record) {
        Array.from(record.addedNodes || []).forEach(function (node) {
          if (!node || node.nodeType !== 1) return;
          if (node.matches?.('.unified-sky-wheel,.sky-output-box') || node.querySelector?.('.unified-sky-wheel,.sky-output-box')) wheelRelevant = true;
          if (node.matches?.('.relphi-mobile-dual-card-view,.relphi-dual-card-item,.relphi-progressive-reading') || node.querySelector?.('.relphi-mobile-dual-card-view,.relphi-dual-card-item,.relphi-progressive-reading')) relationshipRelevant = true;
          if (node.matches?.('.relphi-skinny-heptagram') || node.querySelector?.('.relphi-skinny-heptagram')) strengthenHeptagram();
        });
      });
      if (wheelRelevant) scheduleWheel(60, true);
      if (relationshipRelevant) scheduleRelationship();
    }).observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
