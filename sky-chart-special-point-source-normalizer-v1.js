// Preview-only source normalization for calculated special points. Runs once per slot and reloads only when data changes.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SLOTS = [
    { key:'relphiSkyChartA', button:'loadChart' },
    { key:'relphiSkyChartB', button:'loadCurrentSky' }
  ];
  const CANON = [
    { name:'North Node', aliases:['North Node','Node','No'], glyph:'☊' },
    { name:'South Node', aliases:['South Node','So'], glyph:'☋' },
    { name:'Part of Fortune', aliases:['Part of Fortune','Fortune','POF','Pa'], glyph:'⊗' },
    { name:'Lilith', aliases:['Lilith'], glyph:'⚸' },
    { name:'DSC', aliases:['DSC','Dsc','Descendant','Ds'], glyph:'DSC', angle:true },
    { name:'Vertex', aliases:['Vertex','Vx','V'], glyph:'Vx' },
    { name:'IC', aliases:['IC'], glyph:'IC', angle:true },
    { name:'MC', aliases:['MC','Midheaven'], glyph:'MC', angle:true },
    { name:'Rising', aliases:['Rising','Ascendant','ASC','AC'], glyph:'ASC', angle:true }
  ];

  function read(key) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
    catch (_) { return null; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { return false; }
  }
  function mapOf(payload) { return payload && (payload.placements || payload) || null; }
  function findKey(map, aliases) {
    const wanted = aliases.map(function (v) { return String(v).toLowerCase(); });
    return Object.keys(map || {}).find(function (key) { return wanted.includes(String(key).toLowerCase()); }) || '';
  }

  function normalizeSlot(slot) {
    const payload = read(slot.key);
    const map = mapOf(payload);
    if (!payload || !map || typeof map !== 'object') return false;
    let changed = false;

    CANON.forEach(function (rule) {
      const key = findKey(map, rule.aliases);
      if (!key) return;
      const item = map[key] && typeof map[key] === 'object' ? map[key] : {};
      if (key !== rule.name) {
        delete map[key];
        map[rule.name] = item;
        changed = true;
      }
      if (item.glyph !== rule.glyph) { item.glyph = rule.glyph; changed = true; }
      if (rule.angle && item.angle !== true) { item.angle = true; changed = true; }
    });

    if (!changed) return false;
    if (payload.placements && payload.placements !== map) payload.placements = map;
    write(slot.key, payload);
    return true;
  }

  function run() {
    SLOTS.forEach(function (slot) {
      if (!normalizeSlot(slot)) return;
      queueMicrotask(function () { document.getElementById(slot.button)?.click(); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once:true });
  else run();
  window.addEventListener('relphi:sky-builder-v4-loaded', run, { once:true });
})();