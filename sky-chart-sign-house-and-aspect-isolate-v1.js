// Correct sign-to-house highlighting in both skies and replace the card-pair
// aspect token with an isolated rendering of the actual selected relationship.
(function () {
  'use strict';
  if (window.__relphiSignHouseAndAspectIsolateV1) return;
  window.__relphiSignHouseAndAspectIsolateV1 = true;

  const NS = 'http://www.w3.org/2000/svg';
  const KEYS = { A:'relphiSkyChartA', B:'relphiSkyChartB' };
  const COLORS = { A:'#c9211e', B:'#2462d0' };
  const norm = value => ((Number(value) % 360) + 360) % 360;

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }

  function placementSource(payload) {
    if (!payload || typeof payload !== 'object') return [];
    const known = [payload.placements,payload.positions,payload.points,payload.bodies].find(value => value && typeof value === 'object');
    const source = known || payload;
    return (Array.isArray(source) ? source : Object.values(source)).filter(value => value && typeof value === 'object' && !Array.isArray(value));
  }

  function longitude(item) {
    if (Number.isFinite(Number(item?.longitude))) return norm(item.longitude);
    const signs = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
    const sign = signs.indexOf(String(item?.sign || item?.zodiac || '').trim().toLowerCase());
    if (sign < 0) return NaN;
    return norm(sign * 30 + Number(item.degree || item.degrees || 0) + Number(item.minute || item.minutes || 0) / 60);
  }

  function ascendant(payload) {
    const placements = placementSource(payload);
    const asc = placements.find(item => /^(asc|ascendant|rising)$/i.test(String(item.id || item.name || item.label || item.point || '')));
    if (asc && Number.isFinite(longitude(asc))) return longitude(asc);
    const profile = payload?.calcProfile || {};
    const value = Number(profile.ascendant ?? payload?.ascendant ?? payload?.asc);
    return Number.isFinite(value) ? norm(value) : 0;
  }

  function cusps(payload) {
    const profile = payload?.calcProfile || {};
    for (const raw of [profile.houseCusps,profile.cusps,payload?.houseCusps,payload?.cusps,payload?.houses]) {
      if (!raw) continue;
      const values = (Array.isArray(raw) ? raw : Object.values(raw)).map(value => typeof value === 'object' ? Number(value.longitude ?? value.value ?? value.cusp) : Number(value)).slice(0,12);
      if (values.length === 12 && values.every(Number.isFinite)) return values.map(norm);
    }
    const asc = ascendant(payload);
    const system = String(profile.houseSystem || payload?.houseSystem || 'whole-sign').toLowerCase();
    const start = system.includes('whole') ? Math.floor(asc / 30) * 30 : asc;
    return Array.from({length:12},(_,index)=>norm(start + index * 30));
  }

  function intervalParts(start, span) {
    const end = start + span;
    return end <= 360 ? [[start,end]] : [[start,360],[0,end-360]];
  }

  function overlaps(aStart,aSpan,bStart,bSpan) {
    return intervalParts(norm(aStart),aSpan).some(a => intervalParts(norm(bStart),bSpan).some(b => Math.max(a[0],b[0]) < Math.min(a[1],b[1])));
  }

  function housesForSign(payload, sign) {
    const houseCusps = cusps(payload);
    const signStart = sign * 30;
    const result = new Set();
    houseCusps.forEach((start,index) => {
      const span = norm(houseCusps[(index + 1) % 12] - start) || 30;
      if (overlaps(start,span,signStart,30)) result.add(index + 1);
    });
    return result;
  }

  function applySignHouseCorrection(event) {
    const state = event.detail?.state;
    if (!state || state.kind !== 'sign') return;
    const sign = Number(state.value);
    if (!Number.isInteger(sign) || sign < 0 || sign > 11) return;
    const bySky = {
      A:housesForSign(read(KEYS.A),sign),
      B:housesForSign(read(KEYS.B),sign)
    };
    document.querySelectorAll('.sky-foundation-house-sector[data-sky][data-house]').forEach(node => {
      const kept = bySky[node.dataset.sky]?.has(Number(node.dataset.house));
      if (kept) node.classList.add('is-kept');
    });
  }

  async function drawBubble(target,id,color,radius) {
    const registry = window.RelphiGlyphRegistry;
    const component = window.RelphiGlyphComponent;
    const entry = registry?.get?.(id) || registry?.resolve?.(id);
    if (!entry?.asset || !component?.createBubble) {
      target.dataset.missingCanonicalGlyph = id || 'unknown';
      return;
    }
    const bubble = component.createBubble(target,entry.id,{radius,padding:1,color,fill:'#fffdf8',strokeWidth:2.2});
    await bubble.ready;
  }

  function selectedRelationData(panel) {
    const index = Number(panel?.dataset?.relationIndex);
    const row = document.querySelector(`.sky-foundation-relationship-row[data-relation-index="${index}"]`);
    if (!row) return null;
    const svgs = row.querySelectorAll('svg');
    const orb = Number(row.getAttribute('aria-label')?.match(/orb\s+([\d.]+)/i)?.[1] || 0);
    return {
      index,
      left:row.dataset.leftPlacement,
      right:row.dataset.rightPlacement,
      aspect:svgs[1]?.getAttribute('aria-label') || '',
      orb
    };
  }

  async function replaceMiddleAspect() {
    const panel = document.getElementById('skySelectedRelationship');
    const relation = selectedRelationData(panel);
    const slot = panel?.querySelector('.sky-selected-aspect-symbol');
    if (!relation || !slot) return;

    slot.classList.add('sky-selected-aspect-isolate');
    slot.innerHTML = `<svg viewBox="0 0 132 92" role="img" aria-label="Isolated ${relation.aspect} aspect, orb ${relation.orb.toFixed(2)} degrees"><line x1="32" y1="38" x2="100" y2="54" class="sky-selected-isolate-line"></line><g data-isolate-a transform="translate(32 38)"></g><g data-isolate-b transform="translate(100 54)"></g><text x="66" y="84" text-anchor="middle" class="sky-selected-isolate-orb">${relation.orb.toFixed(2)}°</text></svg>`;
    const svg = slot.querySelector('svg');
    const line = svg.querySelector('.sky-selected-isolate-line');
    const sourceLine = document.querySelector(`.sky-foundation-aspect[data-relation-index="${relation.index}"]`);
    line.setAttribute('stroke',sourceLine?.getAttribute('stroke') || '#5961c8');
    await Promise.allSettled([
      drawBubble(svg.querySelector('[data-isolate-a]'),relation.left,COLORS.A,14),
      drawBubble(svg.querySelector('[data-isolate-b]'),relation.right,COLORS.B,14)
    ]);
  }

  window.addEventListener('relphi:sky-foundation-filter-changed',applySignHouseCorrection);
  window.addEventListener('relphi:selected-relationship-rendered',function () {
    requestAnimationFrame(replaceMiddleAspect);
  });
})();
