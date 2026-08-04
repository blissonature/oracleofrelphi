// Sky Chart coordinate precision contract.
// Minute-precision text uses the chart's stored degree/minute fields; full
// longitude remains untouched for wheel geometry, houses, and aspect math.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyCoordinatePrecisionV1) return;
  window.__relphiSkyCoordinatePrecisionV1 = true;

  const KEYS = { A:'relphiSkyChartA', B:'relphiSkyChartB' };
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ALIASES = new Map([
    ['ascendant','asc'],['asc.','asc'],['asc','asc'],['rising','asc'],
    ['descendant','dsc'],['desc.','dsc'],['dsc','dsc'],
    ['midheaven','mc'],['mc','mc'],['imum coeli','ic'],['ic','ic']
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
    return ALIASES.get(raw) || raw.replace(/[.]/g,'');
  }

  function exactCoordinate(item) {
    if (!item || !Number.isFinite(Number(item.degree ?? item.degrees)) || !Number.isFinite(Number(item.minute ?? item.minutes))) return null;
    const degree = Math.trunc(Number(item.degree ?? item.degrees));
    const minute = Math.trunc(Number(item.minute ?? item.minutes));
    let sign = String(item.sign || item.zodiac || '').trim();
    if (!sign && Number.isFinite(Number(item.longitude))) sign = SIGNS[Math.floor((((Number(item.longitude)%360)+360)%360)/30)];
    if (!sign) return null;
    sign = sign.charAt(0).toUpperCase() + sign.slice(1).toLowerCase();
    return `${degree}°${String(minute).padStart(2,'0')}′ ${sign}`;
  }

  function mapFor(slot) {
    const map = new Map();
    source(read(KEYS[slot])).forEach(([sourceKey,item]) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return;
      const coordinate = exactCoordinate(item);
      if (!coordinate) return;
      [sourceKey,item.name,item.label,item.body,item.planet,item.point,item.id]
        .filter(Boolean)
        .forEach(name => map.set(key(name),coordinate));
    });
    return map;
  }

  function correctLedger(slot) {
    const map = mapFor(slot);
    const panel = document.getElementById(slot === 'A' ? 'skyFoundationA' : 'skyFoundationB');
    if (!panel || !map.size) return;
    panel.querySelectorAll('.sky-foundation-row').forEach(row => {
      const name = row.querySelector('.sky-foundation-row-name')?.textContent;
      const coordinate = map.get(key(name));
      const target = row.querySelector('.sky-foundation-coordinate');
      if (coordinate && target && target.textContent !== coordinate) target.textContent = coordinate;
    });
  }

  function replaceCoordinateText(root, slot) {
    const map = mapFor(slot);
    if (!root || !map.size) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      let text = node.nodeValue || '';
      map.forEach((coordinate,name) => {
        const visibleName = name.replace(/[-]/g,' ');
        if (!text.toLowerCase().includes(visibleName)) return;
        text = text.replace(/\b\d{1,2}°\d{2}[′']\s+(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\b/g, coordinate);
      });
      if (text !== node.nodeValue) node.nodeValue = text;
    });
  }

  function correctSelectedRelationship() {
    const selected = document.getElementById('skySelectedRelationship');
    if (!selected) return;
    replaceCoordinateText(selected.querySelector('[data-selected-card="A"]'),'A');
    replaceCoordinateText(selected.querySelector('[data-selected-card="B"]'),'B');
    const facts = selected.querySelectorAll('.sky-selected-facts span');
    replaceCoordinateText(facts[0],'A');
    replaceCoordinateText(facts[1],'B');
    selected.querySelectorAll('[data-progressive-sky="A"],[data-sky="A"]').forEach(node => replaceCoordinateText(node,'A'));
    selected.querySelectorAll('[data-progressive-sky="B"],[data-sky="B"]').forEach(node => replaceCoordinateText(node,'B'));
  }

  function apply() {
    correctLedger('A');
    correctLedger('B');
    correctSelectedRelationship();
    document.documentElement.dataset.skyCoordinatePrecision = 'stored-minute-fields';
  }

  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      apply();
    });
  }

  const observer = new MutationObserver(schedule);
  function start() {
    observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    ['relphi:sky-foundation-ready','relphi:selected-relationship-rendered'].forEach(name => window.addEventListener(name,schedule));
    window.addEventListener('storage',event => {
      if (!event.key || event.key === KEYS.A || event.key === KEYS.B) schedule();
    });
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
