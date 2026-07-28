// Aligns each mini-wheel aspect endpoint with the exact placement dot used by its lollipop stick.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const KEYS = { skyA:'relphiSkyChartA', skyB:'relphiSkyChartB' };
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ORDER = ['Sun','Moon','Rising','Ascendant','ASC','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','Chiron','North Node','South Node','Lilith','Vertex','Part of Fortune','MC','IC','Descendant','Dsc','DSC'];
  const ASPECTS = [
    { angle:0, orb:3 },
    { angle:60, orb:3 },
    { angle:90, orb:3 },
    { angle:120, orb:3 },
    { angle:180, orb:3 }
  ];
  const CX = 120;
  const CY = 120;
  const CONTACT_RADIUS = 92;
  let queued = false;

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }

  function placements(payload) {
    const value = payload && (payload.placements || payload);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function normalize(value) {
    value %= 360;
    return value < 0 ? value + 360 : value;
  }

  function longitude(item) {
    if (!item) return NaN;
    if (Number.isFinite(Number(item.longitude))) return normalize(Number(item.longitude));
    const sign = SIGNS.findIndex(name => name.toLowerCase() === String(item.sign || '').toLowerCase());
    return sign < 0 ? NaN : sign * 30 + Number(item.degree || 0) + Number(item.minute || 0) / 60;
  }

  function angularDistance(a, b) {
    const distance = Math.abs(normalize(a) - normalize(b));
    return Math.min(distance, 360 - distance);
  }

  function point(radius, degrees) {
    const radians = degrees * Math.PI / 180;
    return {
      x: CX + Math.cos(radians) * radius,
      y: CY + Math.sin(radians) * radius
    };
  }

  function ascLongitude(map) {
    const key = Object.keys(map).find(name => /^(rising|ascendant|asc|ac)$/i.test(name));
    return key ? longitude(map[key]) : 0;
  }

  function ordered(map) {
    return Object.keys(map).sort((a, b) => {
      const ai = ORDER.findIndex(name => name.toLowerCase() === a.toLowerCase());
      const bi = ORDER.findIndex(name => name.toLowerCase() === b.toLowerCase());
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
    });
  }

  function aspectPairs(entries) {
    const pairs = [];
    for (let i = 0; i < entries.length; i += 1) {
      for (let j = i + 1; j < entries.length; j += 1) {
        const distance = angularDistance(entries[i].longitude, entries[j].longitude);
        const aspect = ASPECTS.find(candidate => Math.abs(distance - candidate.angle) <= candidate.orb);
        if (!aspect || aspect.angle === 0) continue;
        pairs.push([entries[i], entries[j]]);
      }
    }
    return pairs;
  }

  function alignCard(card) {
    const slot = card.dataset.workspaceSlot;
    const payload = read(KEYS[slot]);
    const svg = card.querySelector('.relphi-skinny-solo svg');
    if (!slot || !payload || !svg) return false;

    const map = placements(payload);
    const asc = ascLongitude(map);
    const entries = ordered(map)
      .map(key => ({ key, longitude:longitude(map[key]) }))
      .filter(entry => Number.isFinite(entry.longitude))
      .map(entry => ({ ...entry, angle:normalize(180 + entry.longitude - asc) }));

    const pairs = aspectPairs(entries);
    const lines = Array.from(svg.querySelectorAll('.relphi-mini-aspect'));
    if (!lines.length || lines.length !== pairs.length) return false;

    lines.forEach((line, index) => {
      const pair = pairs[index];
      const start = point(CONTACT_RADIUS, pair[0].angle);
      const end = point(CONTACT_RADIUS, pair[1].angle);
      line.setAttribute('x1', start.x.toFixed(3));
      line.setAttribute('y1', start.y.toFixed(3));
      line.setAttribute('x2', end.x.toFixed(3));
      line.setAttribute('y2', end.y.toFixed(3));
      line.dataset.relphiPlacementDotAnchored = 'true';
    });
    return true;
  }

  function run() {
    queued = false;
    document.querySelectorAll('#relphiSkyWorkspace .relphi-workspace-sky').forEach(alignCard);
  }

  function queue(delay) {
    if (queued) return;
    queued = true;
    setTimeout(() => requestAnimationFrame(run), delay || 0);
  }

  function start() {
    run();
    [50, 150, 350, 700].forEach(delay => setTimeout(run, delay));
    window.addEventListener('storage', () => queue(40));
    window.addEventListener('relphi:extra-points-updated', () => queue(40));
    document.addEventListener('click', event => {
      if (event.target.closest('[data-skinny-action],.relphi-skinny-row')) queue(40);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();