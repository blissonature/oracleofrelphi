// Sky Chart coordinate precision contract.
// A finite longitude is the coordinate authority for geometry and presentation.
// Stored sign/degree/minute fields are fallback input only when longitude is absent.
// Corrections are event-driven: never watch the entire document for mutations.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyCoordinatePrecisionV5) return;
  window.__relphiSkyCoordinatePrecisionV1 = true;
  window.__relphiSkyCoordinatePrecisionV2 = true;
  window.__relphiSkyCoordinatePrecisionV3 = true;
  window.__relphiSkyCoordinatePrecisionV4 = true;
  window.__relphiSkyCoordinatePrecisionV5 = true;

  const KEYS = { A:'relphiSkyChartA', B:'relphiSkyChartB' };
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ALIASES = new Map([
    ['ascendant','asc'],['asc.','asc'],['asc','asc'],['rising','asc'],
    ['descendant','dsc'],['desc.','dsc'],['dsc','dsc'],
    ['midheaven','mc'],['mc','mc'],['imum coeli','ic'],['ic','ic'],
    ['north node','north-node'],['true node','north-node'],['mean node','north-node'],
    ['south node','south-node'],['part of fortune','part-of-fortune'],['fortune','part-of-fortune'],
    ['vertex','vertex'],['vx','vertex'],['lilith','lilith'],['black moon lilith','lilith'],['chiron','chiron']
  ]);

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }

  function source(payload) {
    if (!payload || typeof payload !== 'object') return [];
    const value = [payload.placements,payload.positions,payload.points,payload.bodies]
      .find(candidate => candidate && typeof candidate === 'object') || payload;
    return Array.isArray(value)
      ? value.map((item,index) => [String(item?.name || item?.id || index),item])
      : Object.entries(value);
  }

  function key(value) {
    const raw = String(value || '').trim().toLowerCase().replace(/\s+/g,' ');
    return ALIASES.get(raw) || raw.replace(/[.]/g,'').replace(/\s+/g,'-');
  }

  const norm = value => ((Number(value) % 360) + 360) % 360;

  function longitude(item) {
    if (!item) return NaN;
    if (Number.isFinite(Number(item.longitude))) return norm(item.longitude);
    const sign = SIGNS.findIndex(name => name.toLowerCase() === String(item.sign || item.zodiac || '').trim().toLowerCase());
    const degree = Number(item.degree ?? item.degrees);
    const minute = Number(item.minute ?? item.minutes);
    const second = Number(item.second ?? item.seconds ?? 0);
    if (sign < 0 || !Number.isFinite(degree) || !Number.isFinite(minute)) return NaN;
    return norm(sign * 30 + degree + minute / 60 + (Number.isFinite(second) ? second : 0) / 3600);
  }

  function exactCoordinate(item) {
    const value = longitude(item);
    if (!Number.isFinite(value)) return null;
    const signIndex = Math.floor(value / 30);
    const within = value - signIndex * 30;
    const degree = Math.floor(within);
    const minute = Math.floor((within - degree) * 60 + 1e-9);
    const sign = SIGNS[signIndex];
    return { text:`${degree}°${String(minute).padStart(2,'0')}′`, sign, signIndex, full:`${degree}°${String(minute).padStart(2,'0')}′ ${sign}` };
  }

  // Presentation is deliberately read-only. Longitude is authoritative, but this
  // layer never rewrites persisted Sky records while the chart is rendering.
  function identityFor(sourceKey,item) {
    const registry = window.RelphiGlyphRegistry;
    for (const candidate of [item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,sourceKey]) {
      if (candidate == null) continue;
      const raw = String(candidate).trim();
      const normalized = key(raw);
      const entry = registry?.resolve?.(normalized) || registry?.get?.(normalized) || registry?.resolve?.(raw) || registry?.get?.(raw);
      if (entry?.id) return entry.id;
      if (normalized) return normalized;
    }
    return '';
  }

  function mapsFor(slot) {
    const byName = new Map();
    const byIdentity = new Map();
    const payload = read(KEYS[slot]);
    source(payload).forEach(([sourceKey,item]) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return;
      const coordinate = exactCoordinate(item);
      if (!coordinate) return;
      [sourceKey,item.name,item.label,item.body,item.planet,item.point,item.id]
        .filter(Boolean)
        .forEach(name => byName.set(key(name),coordinate));
      const identity = identityFor(sourceKey,item);
      if (identity) byIdentity.set(identity,coordinate);
    });
    return { byName, byIdentity };
  }

  function correctLedger(slot,maps) {
    const panel = document.getElementById(slot === 'A' ? 'skyFoundationA' : 'skyFoundationB');
    if (!panel || !maps.byName.size) return;
    panel.querySelectorAll('.sky-foundation-row').forEach(row => {
      const name = row.querySelector('.sky-foundation-row-name')?.textContent;
      const coordinate = maps.byName.get(key(name));
      const target = row.querySelector('.sky-foundation-coordinate');
      if (coordinate && target && target.textContent !== coordinate.full) target.textContent = coordinate.full;
    });
  }

  function relationshipCopy(row,side) {
    const group = row.querySelector(`.sky-foundation-relationship-placement--${side}`);
    if (group) return group.querySelector('.sky-foundation-relationship-copy small');
    const copies = Array.from(row.children).filter(node => node.classList?.contains('sky-foundation-relationship-copy'));
    return (side === 'left' ? copies[0] : copies[copies.length - 1])?.querySelector('small') || null;
  }

  function rowSky(row,side) {
    const explicit = String(row?.dataset?.[side === 'left' ? 'leftSky' : 'rightSky'] || '').toUpperCase();
    if (explicit === 'A' || explicit === 'B') return explicit;
    const mode = String(row?.dataset?.relationshipMode || '').toUpperCase();
    if (mode === 'A-A') return 'A';
    if (mode === 'B-B') return 'B';
    return side === 'left' ? 'A' : 'B';
  }

  function mapsForRowSide(row,side,mapsA,mapsB) {
    return rowSky(row,side) === 'B' ? mapsB : mapsA;
  }

  function correctRelationships(mapsA,mapsB) {
    document.querySelectorAll('#skyFoundationRelationshipList .sky-foundation-relationship-row').forEach(row => {
      const leftMaps = mapsForRowSide(row,'left',mapsA,mapsB);
      const rightMaps = mapsForRowSide(row,'right',mapsA,mapsB);
      const left = leftMaps.byIdentity.get(row.dataset.leftPlacement || '');
      const right = rightMaps.byIdentity.get(row.dataset.rightPlacement || '');
      if (left) {
        row.dataset.leftSign = String(left.signIndex);
        const small = relationshipCopy(row,'left');
        if (small) {
          small.dataset.relationshipCoordinate = left.text;
          if (small.textContent !== left.text) small.textContent = left.text;
        }
      }
      if (right) {
        row.dataset.rightSign = String(right.signIndex);
        const small = relationshipCopy(row,'right');
        if (small) {
          small.dataset.relationshipCoordinate = right.text;
          if (small.textContent !== right.text) small.textContent = right.text;
        }
      }
    });
  }

  function replaceCoordinateText(root, maps) {
    if (!root || !maps.byName.size) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      let text = node.nodeValue || '';
      maps.byName.forEach((coordinate,name) => {
        const visibleName = name.replace(/[-]/g,' ');
        if (!text.toLowerCase().includes(visibleName)) return;
        text = text.replace(/\b\d{1,2}°\d{2}[′']\s+(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\b/g, coordinate.full);
      });
      if (text !== node.nodeValue) node.nodeValue = text;
    });
  }

  function correctSelectedRelationship(mapsA,mapsB) {
    const selected = document.getElementById('skySelectedRelationship');
    if (!selected) return;
    replaceCoordinateText(selected.querySelector('[data-selected-card="A"]'),mapsA);
    replaceCoordinateText(selected.querySelector('[data-selected-card="B"]'),mapsB);
    const facts = selected.querySelectorAll('.sky-selected-facts span');
    replaceCoordinateText(facts[0],mapsA);
    replaceCoordinateText(facts[1],mapsB);
    selected.querySelectorAll('[data-progressive-sky="A"],[data-sky="A"]').forEach(node => replaceCoordinateText(node,mapsA));
    selected.querySelectorAll('[data-progressive-sky="B"],[data-sky="B"]').forEach(node => replaceCoordinateText(node,mapsB));
  }

  function apply() {
    const mapsA = mapsFor('A');
    const mapsB = mapsFor('B');
    correctLedger('A',mapsA);
    correctLedger('B',mapsB);
    correctRelationships(mapsA,mapsB);
    correctSelectedRelationship(mapsA,mapsB);
    document.documentElement.dataset.skyCoordinatePrecision = 'longitude-authoritative-by-row-sky';
  }

  function whereWhenEditing() {
    return document.documentElement.dataset.skyWhereWhenEditing === 'true';
  }

  let queued = false;
  function schedule() {
    if (queued || whereWhenEditing()) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      apply();
    });
  }

  function start() {
    ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:selected-relationship-rendered','relphi:sky-progressive-symbols-ready']
      .forEach(name => window.addEventListener(name,schedule));
    window.addEventListener('storage',event => {
      if (!event.key || event.key === KEYS.A || event.key === KEYS.B) schedule();
    });
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
