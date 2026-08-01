// Part 1 interaction controller: one state owns hover, focus, isolation, and relationship filtering.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyFoundationInteractionsV1) return;
  window.__relphiSkyFoundationInteractionsV1 = true;

  const NS = 'http://www.w3.org/2000/svg';
  const KEYS = { A:'relphiSkyChartA', B:'relphiSkyChartB' };
  const SKY = { A:'#c9211e', B:'#2462d0' };
  const SIGNS = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  const SIGN_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ORDER = ['sun','moon','asc','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','north-node','south-node','chiron','lilith','part-of-fortune','vertex','mc','ic','dsc'];
  const ASPECTS = [
    { id:'conjunction', angle:0, orb:3, color:'#e53935' },
    { id:'sextile', angle:60, orb:3, color:'#d3b727' },
    { id:'square', angle:90, orb:3, color:'#d6534d' },
    { id:'trine', angle:120, orb:3, color:'#4e9e69' },
    { id:'opposition', angle:180, orb:3, color:'#5961c8' }
  ];
  const ANGLE_ALIASES = {
    rising:'asc', ascendant:'asc', asc:'asc', ac:'asc',
    descendant:'dsc', dsc:'dsc', dc:'dsc',
    midheaven:'mc', mc:'mc',
    'imum coeli':'ic', imumcoeli:'ic', ic:'ic',
    vertex:'vertex', vx:'vertex',
    'north node':'north-node', node:'north-node', 'true node':'north-node',
    'south node':'south-node',
    fortune:'part-of-fortune', 'part of fortune':'part-of-fortune', pof:'part-of-fortune'
  };

  let lockedState = null;
  let hoverState = null;
  let refreshQueued = false;
  let current = { listA:[], listB:[], relations:[] };

  const norm = value => ((Number(value) % 360) + 360) % 360;
  const separation = (a, b) => Math.abs(((a - b + 180) % 360 + 360) % 360 - 180);
  const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, character => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[character]);

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }

  function placementSource(payload) {
    if (!payload || typeof payload !== 'object') return [];
    const known = [payload.placements, payload.positions, payload.points, payload.bodies].find(value => value && typeof value === 'object');
    const source = known || payload;
    if (Array.isArray(source)) {
      return source.map((item, index) => [String(item?.name || item?.label || item?.body || item?.planet || item?.point || item?.id || index), item]);
    }
    return Object.entries(source).filter(([key, value]) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
      if (/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key)) return false;
      return Number.isFinite(Number(value.longitude)) || value.sign || value.zodiac;
    });
  }

  function longitude(item) {
    if (!item) return NaN;
    if (Number.isFinite(Number(item.longitude))) return norm(item.longitude);
    const sign = SIGNS.indexOf(String(item.sign || item.zodiac || '').trim().toLowerCase());
    if (sign < 0) return NaN;
    return norm(sign * 30 + Number(item.degree || item.degrees || 0) + Number(item.minute || item.minutes || 0) / 60 + Number(item.second || item.seconds || 0) / 3600);
  }

  function canonicalEntry(key, item) {
    const registry = window.RelphiGlyphRegistry;
    if (!registry) return null;
    const candidates = [item?.glyphId, item?.id, item?.name, item?.label, item?.body, item?.planet, item?.point, key];
    for (const candidate of candidates) {
      if (candidate == null) continue;
      const normalized = String(candidate).trim().toLowerCase();
      const alias = ANGLE_ALIASES[normalized] || candidate;
      const entry = registry.resolve(alias) || registry.get(alias);
      if (entry?.asset) return entry;
    }
    return null;
  }

  function records(payload) {
    return placementSource(payload).map(([key, item]) => {
      const entry = canonicalEntry(key, item);
      const value = longitude(item);
      return { key, item, entry, id:entry?.id || '', value };
    }).filter(record => record.entry && Number.isFinite(record.value)).sort((left, right) => {
      const a = ORDER.indexOf(left.id), b = ORDER.indexOf(right.id);
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
    const p = profile(payload);
    for (const raw of [p.houseCusps, p.cusps, payload?.houseCusps, payload?.cusps, payload?.houses]) {
      if (!raw) continue;
      const values = (Array.isArray(raw) ? raw : Object.values(raw)).map(item => typeof item === 'object' ? Number(item.longitude ?? item.value ?? item.cusp) : Number(item)).slice(0, 12);
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

  function prepareRecords(payload, slot) {
    const list = records(payload);
    const cusps = houseCusps(payload, list);
    list.forEach(record => {
      record.sky = slot;
      record.sign = Math.floor(record.value / 30);
      record.house = houseFor(record.value, cusps);
    });
    return list;
  }

  function relationships(listA, listB) {
    const result = [];
    listA.forEach(left => listB.forEach(right => {
      const distance = separation(left.value, right.value);
      ASPECTS.forEach(aspect => {
        const orb = Math.abs(distance - aspect.angle);
        if (orb <= aspect.orb) result.push({ left, right, aspect, orb, distance });
      });
    }));
    return result.sort((a, b) => a.orb - b.orb);
  }

  function coordinate(record) {
    const sign = Math.floor(record.value / 30);
    const within = record.value - sign * 30;
    const degree = Math.floor(within);
    const minute = Math.round((within - degree) * 60) % 60;
    return { sign, text:`${degree}°${String(minute).padStart(2, '0')}′` };
  }

  function ensureRelationshipPanel() {
    let panel = document.getElementById('skyFoundationRelationships');
    if (panel) return panel;
    const comparison = document.getElementById('skyFoundationComparison');
    if (!comparison) return null;
    panel = document.createElement('section');
    panel.id = 'skyFoundationRelationships';
    panel.setAttribute('aria-label', 'Filtered relationships');
    panel.innerHTML = `
      <header class="sky-foundation-relationships-heading">
        <h2>Relationships</h2>
        <span id="skyFoundationRelationshipCount">0/0</span>
        <button id="skyFoundationClearIsolation" type="button" hidden>Clear</button>
      </header>
      <div id="skyFoundationRelationshipList"></div>
      <p id="skyFoundationRelationshipEmpty" hidden>No relationships involve this selection.</p>`;
    comparison.appendChild(panel);
    panel.querySelector('#skyFoundationClearIsolation').addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      lockedState = null;
      hoverState = null;
      applyState();
    });
    return panel;
  }

  async function drawCanonical(parent, id, options) {
    const registry = window.RelphiGlyphRegistry;
    const component = window.RelphiGlyphComponent;
    const entry = registry?.get(id) || registry?.resolve(id);
    if (!entry?.asset || !component?.draw) throw new Error('Approved SVG asset unavailable: ' + id);
    return component.draw(parent, entry.id, options);
  }

  function makeSvg(label) {
    const node = document.createElementNS(NS, 'svg');
    node.setAttribute('viewBox', '-20 -20 40 40');
    node.setAttribute('aria-label', label);
    return node;
  }

  async function renderRelationshipRows(relations) {
    const list = document.getElementById('skyFoundationRelationshipList');
    const count = document.getElementById('skyFoundationRelationshipCount');
    if (!list || !count) return;
    list.replaceChildren();
    count.textContent = `${relations.length}/${relations.length}`;
    count.dataset.total = String(relations.length);
    const jobs = [];
    relations.forEach((relation, index) => {
      const left = coordinate(relation.left);
      const right = coordinate(relation.right);
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'sky-foundation-relationship-row';
      row.dataset.interactive = 'aspect';
      row.dataset.relationIndex = String(index);
      row.dataset.leftPlacement = relation.left.id;
      row.dataset.rightPlacement = relation.right.id;
      row.dataset.leftHouse = String(relation.left.house);
      row.dataset.rightHouse = String(relation.right.house);
      row.dataset.leftSign = String(relation.left.sign);
      row.dataset.rightSign = String(relation.right.sign);
      row.setAttribute('aria-label', `${relation.left.entry.name} ${relation.aspect.id} ${relation.right.entry.name}, orb ${relation.orb.toFixed(2)} degrees`);

      const leftGlyph = makeSvg(relation.left.entry.name);
      const aspectGlyph = makeSvg(relation.aspect.id);
      const rightGlyph = makeSvg(relation.right.entry.name);
      const leftCopy = document.createElement('span');
      leftCopy.className = 'sky-foundation-relationship-copy';
      leftCopy.innerHTML = `${escapeHtml(relation.left.entry.name)}<small>${left.text} ${escapeHtml(SIGN_NAMES[left.sign])} · H${relation.left.house}</small>`;
      const rightCopy = document.createElement('span');
      rightCopy.className = 'sky-foundation-relationship-copy';
      rightCopy.innerHTML = `${escapeHtml(relation.right.entry.name)}<small>${right.text} ${escapeHtml(SIGN_NAMES[right.sign])} · H${relation.right.house} · Orb ${relation.orb.toFixed(2)}°</small>`;
      row.append(leftGlyph, leftCopy, aspectGlyph, rightCopy);
      list.appendChild(row);

      jobs.push(drawCanonical(leftGlyph, relation.left.id, { radius:15, padding:1, color:SKY.A }).catch(error => { leftGlyph.remove(); console.error(error); }));
      jobs.push(drawCanonical(aspectGlyph, relation.aspect.id, { radius:15, padding:1, color:relation.aspect.color }).catch(error => { aspectGlyph.remove(); console.error(error); }));
      jobs.push(drawCanonical(rightGlyph, relation.right.id, { radius:15, padding:1, color:SKY.B }).catch(error => { rightGlyph.remove(); console.error(error); }));
    });
    await Promise.allSettled(jobs);
  }

  function annotateHouseLayer(layerName, slot) {
    const layer = document.querySelector(`[data-layer="${layerName}"]`);
    if (!layer) return;
    Array.from(layer.children).filter(node => node.tagName?.toLowerCase() === 'path').forEach((node, index) => {
      node.classList.add('sky-foundation-interactive', 'sky-foundation-house-sector');
      node.dataset.interactive = 'house';
      node.dataset.focusPiece = 'house';
      node.dataset.sky = slot;
      node.dataset.house = String(index + 1);
      node.setAttribute('tabindex', '0');
      node.setAttribute('role', 'button');
      node.setAttribute('aria-label', `Sky ${slot} house ${index + 1}`);
    });
  }

  function annotateSigns() {
    const layer = document.querySelector('[data-layer="zodiac"]');
    if (!layer) return;
    const paths = Array.from(layer.children).filter(node => node.tagName?.toLowerCase() === 'path');
    const glyphs = Array.from(layer.children).filter(node => node.tagName?.toLowerCase() === 'g');
    paths.forEach((node, index) => {
      node.classList.add('sky-foundation-interactive', 'sky-foundation-sign-sector');
      node.dataset.interactive = 'sign';
      node.dataset.focusPiece = 'sign';
      node.dataset.sign = String(index);
      node.setAttribute('tabindex', '0');
      node.setAttribute('role', 'button');
      node.setAttribute('aria-label', SIGN_NAMES[index]);
    });
    glyphs.forEach((node, index) => {
      node.classList.add('sky-foundation-sign-glyph');
      node.dataset.focusPiece = 'sign';
      node.dataset.sign = String(index);
      node.style.pointerEvents = 'none';
    });
  }

  function annotatePlacements(listA, listB) {
    const maps = {
      A:new Map(listA.map(record => [record.id, record])),
      B:new Map(listB.map(record => [record.id, record]))
    };
    const placementNodes = Array.from(document.querySelectorAll('[data-layer="placements"] > g[data-sky][data-placement]'));
    const leaderNodes = Array.from(document.querySelectorAll('[data-layer="leaders"] > line'));
    placementNodes.forEach((node, index) => {
      const slot = node.dataset.sky;
      const record = maps[slot]?.get(node.dataset.placement);
      if (!record) return;
      node.classList.add('sky-foundation-interactive', 'sky-foundation-placement');
      node.dataset.interactive = 'placement';
      node.dataset.focusPiece = 'placement';
      node.dataset.sign = String(record.sign);
      node.dataset.house = String(record.house);
      node.setAttribute('tabindex', '0');
      node.setAttribute('role', 'button');
      node.setAttribute('aria-label', `Sky ${slot} ${record.entry.name}, house ${record.house}`);
      const leader = leaderNodes[index];
      if (leader) {
        leader.classList.add('sky-foundation-focus-piece');
        leader.dataset.focusPiece = 'leader';
        leader.dataset.sky = slot;
        leader.dataset.placement = record.id;
        leader.dataset.sign = String(record.sign);
        leader.dataset.house = String(record.house);
      }
    });
  }

  function annotateAspects(relations) {
    const lines = Array.from(document.querySelectorAll('[data-layer="aspects"] > line'));
    lines.forEach((line, index) => {
      const relation = relations[index];
      if (!relation) return;
      line.classList.add('sky-foundation-interactive');
      line.dataset.interactive = 'aspect';
      line.dataset.focusPiece = 'aspect';
      line.dataset.relationIndex = String(index);
      line.dataset.leftPlacement = relation.left.id;
      line.dataset.rightPlacement = relation.right.id;
      line.dataset.leftHouse = String(relation.left.house);
      line.dataset.rightHouse = String(relation.right.house);
      line.dataset.leftSign = String(relation.left.sign);
      line.dataset.rightSign = String(relation.right.sign);
      line.setAttribute('tabindex', '0');
      line.setAttribute('role', 'button');
      line.setAttribute('aria-label', `Sky A ${relation.left.entry.name} ${relation.aspect.id} Sky B ${relation.right.entry.name}`);
      line.style.pointerEvents = 'stroke';
    });
  }

  function annotateLedger(slot, list) {
    const panel = document.getElementById(slot === 'A' ? 'skyFoundationA' : 'skyFoundationB');
    if (!panel) return;
    Array.from(panel.querySelectorAll('.sky-foundation-row')).forEach((row, index) => {
      const record = list[index];
      if (!record) return;
      row.dataset.interactive = 'placement';
      row.dataset.sky = slot;
      row.dataset.placement = record.id;
      row.dataset.house = String(record.house);
      row.dataset.sign = String(record.sign);
      row.setAttribute('tabindex', '0');
      row.setAttribute('role', 'button');
      row.setAttribute('aria-label', `Sky ${slot} ${record.entry.name}, house ${record.house}`);
    });
  }

  function specFrom(node) {
    if (!node) return null;
    const kind = node.dataset.interactive;
    if (kind === 'house') return { kind, sky:node.dataset.sky, value:Number(node.dataset.house) };
    if (kind === 'sign') return { kind, sky:null, value:Number(node.dataset.sign) };
    if (kind === 'placement') return { kind, sky:node.dataset.sky, value:node.dataset.placement };
    if (kind === 'aspect') return { kind, sky:null, value:Number(node.dataset.relationIndex) };
    return null;
  }

  function sameState(a, b) {
    return !!a && !!b && a.kind === b.kind && a.sky === b.sky && a.value === b.value;
  }

  function relationMatches(relation, index, state) {
    if (!state) return true;
    if (state.kind === 'aspect') return index === state.value;
    if (state.kind === 'sign') return relation.left.sign === state.value || relation.right.sign === state.value;
    if (state.kind === 'house') return state.sky === 'A' ? relation.left.house === state.value : relation.right.house === state.value;
    if (state.kind === 'placement') return state.sky === 'A' ? relation.left.id === state.value : relation.right.id === state.value;
    return true;
  }

  function buildKeepSets(state) {
    const matched = new Set();
    const placements = new Set();
    const houses = new Set();
    const signs = new Set();

    current.relations.forEach((relation, index) => {
      if (!relationMatches(relation, index, state)) return;
      matched.add(index);
      placements.add(`A:${relation.left.id}`);
      placements.add(`B:${relation.right.id}`);
      houses.add(`A:${relation.left.house}`);
      houses.add(`B:${relation.right.house}`);
      signs.add(relation.left.sign);
      signs.add(relation.right.sign);
    });

    if (state?.kind === 'house') {
      houses.add(`${state.sky}:${state.value}`);
      const source = state.sky === 'A' ? current.listA : current.listB;
      source.filter(record => record.house === state.value).forEach(record => {
        placements.add(`${state.sky}:${record.id}`);
        signs.add(record.sign);
      });
    }
    if (state?.kind === 'sign') {
      signs.add(state.value);
      [...current.listA, ...current.listB].filter(record => record.sign === state.value).forEach(record => {
        placements.add(`${record.sky}:${record.id}`);
        houses.add(`${record.sky}:${record.house}`);
      });
    }
    if (state?.kind === 'placement') {
      placements.add(`${state.sky}:${state.value}`);
      const source = state.sky === 'A' ? current.listA : current.listB;
      const record = source.find(item => item.id === state.value);
      if (record) {
        houses.add(`${state.sky}:${record.house}`);
        signs.add(record.sign);
      }
    }
    return { matched, placements, houses, signs };
  }

  function nodeIsKept(node, keep) {
    const type = node.dataset.focusPiece;
    if (type === 'aspect') return keep.matched.has(Number(node.dataset.relationIndex));
    if (type === 'house') return keep.houses.has(`${node.dataset.sky}:${node.dataset.house}`);
    if (type === 'sign') return keep.signs.has(Number(node.dataset.sign));
    if (type === 'placement' || type === 'leader') return keep.placements.has(`${node.dataset.sky}:${node.dataset.placement}`);
    return false;
  }

  function nodeMatchesState(node, state) {
    if (!state) return false;
    const type = node.dataset.interactive;
    if (state.kind === 'aspect') return type === 'aspect' && Number(node.dataset.relationIndex) === state.value;
    if (state.kind === 'house') return type === 'house' && node.dataset.sky === state.sky && Number(node.dataset.house) === state.value;
    if (state.kind === 'sign') return type === 'sign' && Number(node.dataset.sign) === state.value;
    if (state.kind === 'placement') return type === 'placement' && node.dataset.sky === state.sky && node.dataset.placement === state.value;
    return false;
  }

  function applyState() {
    const state = lockedState || hoverState;
    const keep = buildKeepSets(state);
    const wheel = document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
    if (wheel) {
      wheel.classList.toggle('has-isolation', !!state);
      wheel.querySelectorAll('[data-focus-piece]').forEach(node => {
        node.classList.toggle('is-kept', !!state && nodeIsKept(node, keep));
        node.classList.toggle('is-selected', !!lockedState && nodeMatchesState(node, lockedState));
        node.classList.toggle('is-hovered', !!hoverState && !lockedState && nodeMatchesState(node, hoverState));
      });
    }

    ['A','B'].forEach(slot => {
      const panel = document.getElementById(slot === 'A' ? 'skyFoundationA' : 'skyFoundationB');
      if (!panel) return;
      panel.classList.toggle('has-ledger-isolation', !!state);
      panel.querySelectorAll('.sky-foundation-row[data-placement]').forEach(row => {
        const kept = keep.placements.has(`${slot}:${row.dataset.placement}`);
        row.classList.toggle('is-kept', !!state && kept);
        row.classList.toggle('is-selected', !!lockedState && nodeMatchesState(row, lockedState));
        row.classList.toggle('is-hovered', !!hoverState && !lockedState && nodeMatchesState(row, hoverState));
      });
    });

    const rows = Array.from(document.querySelectorAll('.sky-foundation-relationship-row'));
    rows.forEach(row => {
      const index = Number(row.dataset.relationIndex);
      const visible = !state || keep.matched.has(index);
      row.hidden = !visible;
      row.setAttribute('aria-hidden', visible ? 'false' : 'true');
      row.classList.toggle('is-selected', !!lockedState && lockedState.kind === 'aspect' && lockedState.value === index);
    });

    const visibleCount = state ? keep.matched.size : current.relations.length;
    const count = document.getElementById('skyFoundationRelationshipCount');
    if (count) count.textContent = `${visibleCount}/${current.relations.length}`;
    const empty = document.getElementById('skyFoundationRelationshipEmpty');
    if (empty) empty.hidden = visibleCount !== 0;
    const clear = document.getElementById('skyFoundationClearIsolation');
    if (clear) clear.hidden = !lockedState;

    window.dispatchEvent(new CustomEvent('relphi:sky-foundation-filter-changed', {
      detail:{
        state:state ? { ...state, mode:lockedState ? 'selected' : 'hover' } : null,
        relationshipIndexes:Array.from(state ? keep.matched : current.relations.map((_, index) => index))
      }
    }));
  }

  function interactiveFromEvent(event) {
    const node = event.target.closest?.('[data-interactive]');
    const root = document.getElementById('skyFoundationRoot');
    return node && root?.contains(node) ? node : null;
  }

  function bindEvents() {
    const root = document.getElementById('skyFoundationRoot');
    if (!root || root.dataset.foundationInteractionsBound === 'true') return;
    root.dataset.foundationInteractionsBound = 'true';

    root.addEventListener('pointerover', event => {
      if (lockedState) return;
      const node = interactiveFromEvent(event);
      if (!node || node.contains(event.relatedTarget)) return;
      hoverState = specFrom(node);
      applyState();
    });

    root.addEventListener('pointerout', event => {
      if (lockedState) return;
      const node = interactiveFromEvent(event);
      if (!node || node.contains(event.relatedTarget)) return;
      hoverState = null;
      applyState();
    });

    root.addEventListener('focusin', event => {
      if (lockedState) return;
      const node = interactiveFromEvent(event);
      if (!node) return;
      hoverState = specFrom(node);
      applyState();
    });

    root.addEventListener('focusout', event => {
      if (lockedState) return;
      const node = interactiveFromEvent(event);
      if (!node || node.contains(event.relatedTarget)) return;
      hoverState = null;
      applyState();
    });

    root.addEventListener('click', event => {
      const node = interactiveFromEvent(event);
      if (node) {
        event.preventDefault();
        const next = specFrom(node);
        lockedState = sameState(lockedState, next) ? null : next;
        hoverState = null;
        applyState();
        return;
      }
      if (lockedState && event.target.closest?.('#skyFoundationWheelMount,#skyFoundationRelationships')) {
        lockedState = null;
        hoverState = null;
        applyState();
      }
    });

    root.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        lockedState = null;
        hoverState = null;
        applyState();
        return;
      }
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const node = interactiveFromEvent(event);
      if (!node) return;
      event.preventDefault();
      const next = specFrom(node);
      lockedState = sameState(lockedState, next) ? null : next;
      hoverState = null;
      applyState();
    });
  }

  async function refresh() {
    refreshQueued = false;
    const root = document.getElementById('skyFoundationRoot');
    const wheel = document.querySelector('#skyFoundationWheelMount > .sky-foundation-wheel');
    if (!root || !wheel || root.getAttribute('aria-busy') !== 'false') return;
    ensureRelationshipPanel();

    const listA = prepareRecords(read(KEYS.A), 'A');
    const listB = prepareRecords(read(KEYS.B), 'B');
    const relations = relationships(listA, listB);
    current = { listA, listB, relations };
    lockedState = null;
    hoverState = null;

    annotateHouseLayer('a-houses', 'A');
    annotateHouseLayer('b-houses', 'B');
    annotateSigns();
    annotatePlacements(listA, listB);
    annotateAspects(relations);
    annotateLedger('A', listA);
    annotateLedger('B', listB);
    await renderRelationshipRows(relations);
    bindEvents();
    applyState();
    window.dispatchEvent(new Event('relphi:sky-foundation-interactions-ready'));
  }

  function scheduleRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(refresh);
  }

  function start() {
    window.addEventListener('relphi:sky-foundation-ready', scheduleRefresh);
    if (document.getElementById('skyFoundationRoot')?.getAttribute('aria-busy') === 'false') scheduleRefresh();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
