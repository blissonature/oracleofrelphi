// When one sky is hidden, show that remaining sky's internal aspect relationships.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkySingleSkyAspectsV1) return;
  window.__relphiSkySingleSkyAspectsV1 = true;

  const NS = 'http://www.w3.org/2000/svg';
  const KEYS = { A: 'relphiSkyChartA', B: 'relphiSkyChartB' };
  const SKY = { A: '#c9211e', B: '#2462d0' };
  const SIGNS = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  const SIGN_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ORDER = ['sun','moon','asc','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','north-node','south-node','chiron','lilith','part-of-fortune','vertex','mc','ic','dsc'];
  const APPROVED_FALLBACKS = new Set(['chiron','north-node','south-node','part-of-fortune','vertex']);
  const ASPECTS = [
    { id:'conjunction', angle:0, orb:3, color:'#e53935' },
    { id:'semi-sextile', angle:30, orb:2, color:'#7c9b49' },
    { id:'octile', angle:45, orb:2, color:'#b86d43' },
    { id:'sextile', angle:60, orb:3, color:'#d3b727' },
    { id:'quintile', angle:72, orb:2, color:'#8b6cc2' },
    { id:'square', angle:90, orb:3, color:'#d6534d' },
    { id:'trine', angle:120, orb:3, color:'#4e9e69' },
    { id:'tri-octile', angle:135, orb:2, color:'#9f5944' },
    { id:'bi-quintile', angle:144, orb:2, color:'#7655aa' },
    { id:'quincunx', angle:150, orb:2, color:'#4b8e88' },
    { id:'opposition', angle:180, orb:3, color:'#5961c8' }
  ];
  const ALIASES = {
    rising:'asc', ascendant:'asc', asc:'asc', ac:'asc',
    descendant:'dsc', dsc:'dsc', dc:'dsc',
    midheaven:'mc', mc:'mc', 'imum coeli':'ic', imumcoeli:'ic', ic:'ic',
    vertex:'vertex', vx:'vertex',
    'north node':'north-node', node:'north-node', 'true node':'north-node', 'mean node':'north-node',
    'south node':'south-node', chiron:'chiron', lilith:'lilith', 'black moon lilith':'lilith',
    fortune:'part-of-fortune', 'part of fortune':'part-of-fortune', pof:'part-of-fortune'
  };

  const selection = { A: null, B: null };
  let timer = 0;
  let renderToken = 0;
  let activeMode = 'A-B';

  const norm = value => ((Number(value) % 360) + 360) % 360;
  const separation = (a, b) => Math.abs(((a - b + 180) % 360 + 360) % 360 - 180);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[character]));
  const svg = (name, attrs) => {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs || {}).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  };

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }

  function source(payload) {
    if (!payload || typeof payload !== 'object') return [];
    const known = [payload.placements, payload.positions, payload.points, payload.bodies]
      .find(value => value && typeof value === 'object');
    const value = known || payload;
    if (Array.isArray(value)) {
      return value.map((item, index) => [String(item?.name || item?.label || item?.id || index), item]);
    }
    return Object.entries(value).filter(([key, item]) =>
      item && typeof item === 'object' && !Array.isArray(item) &&
      !/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key) &&
      (Number.isFinite(Number(item.longitude)) || item.sign || item.zodiac)
    );
  }

  function longitude(item) {
    if (Number.isFinite(Number(item?.longitude))) return norm(item.longitude);
    const sign = SIGNS.indexOf(String(item?.sign || item?.zodiac || '').trim().toLowerCase());
    return sign < 0 ? NaN : norm(
      sign * 30 + Number(item.degree || item.degrees || 0) +
      Number(item.minute || item.minutes || 0) / 60 +
      Number(item.second || item.seconds || 0) / 3600
    );
  }

  function canonical(key, item) {
    const registry = window.RelphiGlyphRegistry;
    if (!registry) return null;
    for (const candidate of [item?.glyphId, item?.id, item?.name, item?.label, item?.body, item?.planet, item?.point, key]) {
      if (candidate == null) continue;
      const raw = String(candidate).trim();
      const identity = ALIASES[raw.toLowerCase()] || raw;
      const entry = registry.resolve(identity) || registry.get(identity);
      if (entry?.asset || APPROVED_FALLBACKS.has(entry?.id)) return entry;
    }
    return null;
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
    const p = profile(payload);
    for (const raw of [p.houseCusps, p.cusps, payload?.houseCusps, payload?.cusps, payload?.houses]) {
      if (!raw) continue;
      const values = (Array.isArray(raw) ? raw : Object.values(raw))
        .map(item => typeof item === 'object' ? Number(item.longitude ?? item.value ?? item.cusp) : Number(item))
        .slice(0, 12);
      if (values.length === 12 && values.every(Number.isFinite)) return values.map(norm);
    }
    const asc = ascendant(payload, list);
    const system = String(p.houseSystem || payload?.houseSystem || 'whole-sign').toLowerCase();
    const start = system.includes('whole') ? Math.floor(asc / 30) * 30 : asc;
    return Array.from({ length:12 }, (_, index) => norm(start + index * 30));
  }

  function houseFor(value, cusps) {
    for (let index = 0; index < 12; index += 1) {
      const start = cusps[index];
      const span = norm(cusps[(index + 1) % 12] - start) || 30;
      if (norm(value - start) < span) return index + 1;
    }
    return 12;
  }

  function records(payload, slot) {
    const list = source(payload).map(([key, item]) => {
      const entry = canonical(key, item);
      const value = longitude(item);
      return { key, item, entry, id:entry?.id || '', value, sky:slot };
    }).filter(record => record.entry && Number.isFinite(record.value));
    const cusps = houseCusps(payload, list);
    list.forEach(record => {
      record.sign = Math.floor(record.value / 30);
      record.house = houseFor(record.value, cusps);
    });
    return list.sort((left, right) => {
      const a = ORDER.indexOf(left.id);
      const b = ORDER.indexOf(right.id);
      return (a < 0 ? 999 : a) - (b < 0 ? 999 : b) || left.value - right.value;
    });
  }

  function relationships(list) {
    const result = [];
    for (let leftIndex = 0; leftIndex < list.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < list.length; rightIndex += 1) {
        const left = list[leftIndex];
        const right = list[rightIndex];
        const distance = separation(left.value, right.value);
        ASPECTS.forEach(aspect => {
          const orb = Math.abs(distance - aspect.angle);
          if (orb <= aspect.orb) result.push({ left, right, aspect, orb, distance });
        });
      }
    }
    return result.sort((a, b) => a.orb - b.orb);
  }

  function coordinate(record) {
    const sign = Math.floor(record.value / 30);
    const within = record.value - sign * 30;
    const degree = Math.floor(within);
    const minute = Math.round((within - degree) * 60) % 60;
    return { sign, text:`${degree}°${String(minute).padStart(2, '0')}′` };
  }

  function point(value, radius = 165) {
    const angle = (norm(value) - 180) * Math.PI / 180;
    return { x:600 + radius * Math.cos(angle), y:600 + radius * Math.sin(angle) };
  }

  async function draw(parent, id, options) {
    const registry = window.RelphiGlyphRegistry;
    const component = window.RelphiGlyphComponent;
    const entry = registry?.get(id) || registry?.resolve(id);
    if (!entry || !component?.draw) throw new Error('Approved registry glyph unavailable: ' + id);
    return component.draw(parent, entry.id, options);
  }

  function glyphHost(label) {
    return svg('svg', { viewBox:'-20 -20 40 40', 'aria-label':label });
  }

  function clearSingleSky() {
    document.querySelectorAll('.sky-foundation-single-sky-aspect,.sky-foundation-single-sky-row').forEach(node => node.remove());
  }

  function crossNodes() {
    return document.querySelectorAll(
      '[data-layer="aspects"] > .sky-foundation-aspect:not(.sky-foundation-single-sky-aspect),' +
      '#skyFoundationRelationshipList > .sky-foundation-relationship-row:not(.sky-foundation-single-sky-row)'
    );
  }

  function setCrossHidden(hidden) {
    crossNodes().forEach(node => node.classList.toggle('sky-foundation-single-sky-cross-hidden', hidden));
  }

  function updateCount(total) {
    const count = document.getElementById('skyFoundationRelationshipCount');
    const empty = document.getElementById('skyFoundationRelationshipEmpty');
    if (count) {
      count.textContent = `${total}/${total}`;
      count.dataset.total = String(total);
    }
    if (empty) empty.hidden = total !== 0;
  }

  function clearSelectedRelationship() {
    const selected = document.getElementById('skySelectedRelationship');
    if (selected) selected.hidden = true;
    window.dispatchEvent(new CustomEvent('relphi:sky-foundation-clear-selection', {
      detail:{ source:'single-sky-mode' }
    }));
  }

  async function renderSingleSky(slot, selectedIds, token) {
    const aspectLayer = document.querySelector('[data-layer="aspects"]');
    const listMount = document.getElementById('skyFoundationRelationshipList');
    if (!aspectLayer || !listMount) return;

    clearSingleSky();
    setCrossHidden(true);
    clearSelectedRelationship();

    const available = records(read(KEYS[slot]), slot);
    const chosen = available.filter(record => selectedIds.has(record.id));
    const relations = relationships(chosen);
    const jobs = [];

    relations.forEach(relation => {
      const from = point(relation.left.value);
      const to = point(relation.right.value);
      const line = svg('line', {
        x1:from.x, y1:from.y, x2:to.x, y2:to.y,
        stroke:relation.aspect.color,
        class:'sky-foundation-aspect sky-foundation-single-sky-aspect',
        'data-single-sky':slot,
        'data-relationship-mode':`${slot}-${slot}`,
        'data-aspect':relation.aspect.id,
        'data-left-sky':slot,
        'data-right-sky':slot,
        'data-left-placement':relation.left.id,
        'data-right-placement':relation.right.id,
        'data-left-house':relation.left.house,
        'data-right-house':relation.right.house,
        'data-left-sign':relation.left.sign,
        'data-right-sign':relation.right.sign,
        'data-orb':relation.orb.toFixed(6)
      });
      line.style.pointerEvents = 'none';
      aspectLayer.appendChild(line);

      const leftPosition = coordinate(relation.left);
      const rightPosition = coordinate(relation.right);
      const row = document.createElement('div');
      row.className = 'sky-foundation-relationship-row sky-foundation-single-sky-row';
      row.dataset.singleSky = slot;
      row.dataset.relationshipMode = `${slot}-${slot}`;
      row.dataset.aspect = relation.aspect.id;
      row.dataset.leftSky = slot;
      row.dataset.rightSky = slot;
      row.dataset.leftPlacement = relation.left.id;
      row.dataset.rightPlacement = relation.right.id;
      row.dataset.leftHouse = String(relation.left.house);
      row.dataset.rightHouse = String(relation.right.house);
      row.dataset.leftSign = String(relation.left.sign);
      row.dataset.rightSign = String(relation.right.sign);
      row.dataset.sourceOrb = relation.orb.toFixed(6);
      row.setAttribute('role', 'listitem');
      row.setAttribute('aria-label', `Sky ${slot} ${relation.left.entry.name} ${relation.aspect.id} Sky ${slot} ${relation.right.entry.name}, orb ${relation.orb.toFixed(2)} degrees`);

      const leftGlyph = glyphHost(relation.left.entry.name);
      const aspectGlyph = glyphHost(relation.aspect.id);
      const rightGlyph = glyphHost(relation.right.entry.name);
      const leftCopy = document.createElement('span');
      const rightCopy = document.createElement('span');
      leftCopy.className = rightCopy.className = 'sky-foundation-relationship-copy';
      leftCopy.innerHTML = `${esc(relation.left.entry.name)}<small>Sky ${slot} · ${leftPosition.text} ${esc(SIGN_NAMES[leftPosition.sign])} · H${relation.left.house}</small>`;
      rightCopy.innerHTML = `${esc(relation.right.entry.name)}<small>Sky ${slot} · ${rightPosition.text} ${esc(SIGN_NAMES[rightPosition.sign])} · H${relation.right.house} · Orb ${relation.orb.toFixed(2)}°</small>`;
      row.append(leftGlyph, leftCopy, aspectGlyph, rightGlyph, rightCopy);
      listMount.appendChild(row);

      jobs.push(
        draw(leftGlyph, relation.left.id, { radius:15, padding:1, color:SKY[slot] }).catch(error => { leftGlyph.remove(); console.error(error); }),
        draw(aspectGlyph, relation.aspect.id, { radius:15, padding:1, color:relation.aspect.color }).catch(error => { aspectGlyph.remove(); console.error(error); }),
        draw(rightGlyph, relation.right.id, { radius:15, padding:1, color:SKY[slot] }).catch(error => { rightGlyph.remove(); console.error(error); })
      );
    });

    if (token !== renderToken) return;
    activeMode = `${slot}-${slot}`;
    document.documentElement.dataset.skyRelationshipMode = activeMode;
    updateCount(relations.length);
    await Promise.allSettled(jobs);
    if (token !== renderToken) return;
    window.dispatchEvent(new CustomEvent('relphi:sky-single-sky-aspects-rendered', {
      detail:{ slot, mode:activeMode, count:relations.length }
    }));
  }

  function renderFromSelection() {
    timer = 0;
    const token = ++renderToken;
    const selectedA = selection.A || new Set();
    const selectedB = selection.B || new Set();
    const hasA = selectedA.size > 0;
    const hasB = selectedB.size > 0;

    if (hasA && hasB) {
      activeMode = 'A-B';
      clearSingleSky();
      setCrossHidden(false);
      document.documentElement.dataset.skyRelationshipMode = activeMode;
      return;
    }

    if (!hasA && !hasB) {
      activeMode = 'none';
      clearSingleSky();
      setCrossHidden(true);
      updateCount(0);
      clearSelectedRelationship();
      document.documentElement.dataset.skyRelationshipMode = activeMode;
      return;
    }

    const slot = hasA ? 'A' : 'B';
    void renderSingleSky(slot, hasA ? selectedA : selectedB, token);
  }

  function schedule(delay = 160) {
    clearTimeout(timer);
    timer = setTimeout(renderFromSelection, delay);
  }

  function selectionFromControl(slot) {
    const values = Array.from(document.querySelectorAll(`[data-placement-option][data-slot="${slot}"]:checked`))
      .map(input => input.value)
      .filter(Boolean);
    if (values.length) return new Set(values);
    const total = document.querySelectorAll(`[data-placement-option][data-slot="${slot}"]`).length;
    if (total) return new Set();
    return new Set(Array.from(document.querySelectorAll(`#skyFoundation${slot} .sky-foundation-row[data-placement]`)).map(row => row.dataset.placement));
  }

  function syncFromControl(renderImmediately = false) {
    selection.A = selectionFromControl('A');
    selection.B = selectionFromControl('B');
    if (renderImmediately) renderFromSelection();
    else schedule(0);
  }

  function restorePresentation() {
    if (!/^(A-A|B-B)$/.test(activeMode)) return;
    setCrossHidden(true);
    document.querySelectorAll('.sky-foundation-single-sky-row').forEach(row => {
      row.hidden = false;
      row.setAttribute('aria-hidden', 'false');
    });
    updateCount(document.querySelectorAll('.sky-foundation-single-sky-row').length);
  }

  function start() {
    window.addEventListener('relphi:sky-placement-multiselect-changed', event => {
      selection.A = new Set(event.detail?.A || []);
      selection.B = new Set(event.detail?.B || []);
      renderFromSelection();
    });
    document.addEventListener('change', event => {
      if (!event.target.closest?.('[data-placement-choice],[data-placement-option]')) return;
      setTimeout(() => syncFromControl(true), 0);
    });
    window.addEventListener('relphi:sky-foundation-ready', () => setTimeout(() => syncFromControl(true), 0));
    window.addEventListener('relphi:sky-foundation-filter-changed', () => setTimeout(restorePresentation, 0));
    window.addEventListener('resize', restorePresentation);
    setTimeout(() => syncFromControl(true), 0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
