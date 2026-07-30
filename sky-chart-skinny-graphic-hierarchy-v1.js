// Make the Sky Chart mini wheel the primary graphic in each skinny sky card.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkinnyGraphicHierarchyV1) return;
  window.__relphiSkinnyGraphicHierarchyV1 = true;

  const NS = 'http://www.w3.org/2000/svg';
  const KEYS = { skyA:'relphiSkyChartA', skyB:'relphiSkyChartB' };
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const RAINBOW = ['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
  const CX = 120;
  const CY = 120;
  const HOUSE_INNER = 18;
  const HOUSE_OUTER = 70;
  const SIGN_INNER = 70;
  const SIGN_OUTER = 88;
  let queued = false;

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }

  function profile(payload) {
    return payload && payload.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {};
  }

  function placements(payload) {
    const value = payload && (payload.placements || payload.positions || payload.points || payload);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function normalize(value) {
    value = Number(value) || 0;
    return ((value % 360) + 360) % 360;
  }

  function longitude(item) {
    if (!item) return NaN;
    if (Number.isFinite(Number(item.longitude))) return normalize(Number(item.longitude));
    const sign = SIGNS.findIndex(name => name.toLowerCase() === String(item.sign || item.zodiac || '').trim().toLowerCase());
    if (sign < 0) return NaN;
    return normalize(sign * 30 + Number(item.degree || item.degrees || 0) + Number(item.minute || item.minutes || 0) / 60 + Number(item.second || item.seconds || 0) / 3600);
  }

  function ascLongitude(payload) {
    const map = placements(payload);
    const key = Object.keys(map).find(name => /^(rising|ascendant|asc|ac)$/i.test(name));
    return key ? longitude(map[key]) : 0;
  }

  function houseCusps(payload, asc) {
    const p = profile(payload);
    const raw = p.houseCusps || payload?.houseCusps || payload?.cusps || payload?.houses;
    if (raw) {
      const source = Array.isArray(raw) ? raw : Object.values(raw);
      const values = source.map(item => typeof item === 'object' ? Number(item.longitude ?? item.value ?? item.cusp) : Number(item)).filter(Number.isFinite).slice(0, 12);
      if (values.length === 12) return values.map(normalize);
    }
    const system = String(p.houseSystem || payload?.houseSystem || payload?.house_system || '').toLowerCase();
    const start = system.includes('whole') ? Math.floor(asc / 30) * 30 : asc;
    return Array.from({ length:12 }, (_, index) => normalize(start + index * 30));
  }

  function svgNode(name, attrs) {
    const element = document.createElementNS(NS, name);
    Object.entries(attrs || {}).forEach(([key, value]) => element.setAttribute(key, String(value)));
    return element;
  }

  function point(radius, degrees) {
    const radians = degrees * Math.PI / 180;
    return {
      x:CX + Math.cos(radians) * radius,
      y:CY + Math.sin(radians) * radius
    };
  }

  function sectorPath(innerRadius, outerRadius, start, span) {
    const large = span > 180 ? 1 : 0;
    const outerStart = point(outerRadius, start);
    const outerEnd = point(outerRadius, start + span);
    if (innerRadius <= 0) {
      return `M${CX} ${CY} L${outerStart.x} ${outerStart.y} A${outerRadius} ${outerRadius} 0 ${large} 1 ${outerEnd.x} ${outerEnd.y} Z`;
    }
    const innerEnd = point(innerRadius, start + span);
    const innerStart = point(innerRadius, start);
    return `M${outerStart.x} ${outerStart.y} A${outerRadius} ${outerRadius} 0 ${large} 1 ${outerEnd.x} ${outerEnd.y} L${innerEnd.x} ${innerEnd.y} A${innerRadius} ${innerRadius} 0 ${large} 0 ${innerStart.x} ${innerStart.y} Z`;
  }

  function signature(payload, asc, cusps) {
    try { return JSON.stringify([payload?.name, asc, cusps]); }
    catch (_) { return String(Date.now()); }
  }

  function addRainbow(svg, payload) {
    if (!svg || svg.childElementCount < 2) return;
    const asc = ascLongitude(payload);
    const cusps = houseCusps(payload, asc);
    const nextSignature = signature(payload, asc, cusps);
    if (svg.dataset.rainbowSignature === nextSignature && svg.querySelector('[data-layer="mini-rainbow-houses"]')) return;

    svg.querySelector('[data-layer="mini-rainbow-houses"]')?.remove();
    svg.querySelector('[data-layer="mini-rainbow-signs"]')?.remove();

    const houseLayer = svgNode('g', { 'data-layer':'mini-rainbow-houses', 'aria-hidden':'true', 'pointer-events':'none' });
    cusps.forEach((startLongitude, index) => {
      const span = normalize(cusps[(index + 1) % 12] - startLongitude) || 30;
      const start = normalize(180 + startLongitude - asc);
      houseLayer.appendChild(svgNode('path', {
        d:sectorPath(HOUSE_INNER, HOUSE_OUTER, start, span),
        fill:RAINBOW[index],
        'fill-opacity':'.22'
      }));
    });

    const signLayer = svgNode('g', { 'data-layer':'mini-rainbow-signs', 'aria-hidden':'true', 'pointer-events':'none' });
    for (let index = 0; index < 12; index += 1) {
      const start = normalize(180 + index * 30 - asc);
      signLayer.appendChild(svgNode('path', {
        d:sectorPath(SIGN_INNER, SIGN_OUTER, start, 30),
        fill:RAINBOW[index],
        'fill-opacity':'.52'
      }));
    }

    const background = svg.querySelector(':scope > .wheel-core') || svg.firstElementChild;
    const anchor = background?.nextSibling || svg.firstChild;
    svg.insertBefore(houseLayer, anchor);
    svg.insertBefore(signLayer, anchor);
    svg.dataset.rainbowSignature = nextSignature;
  }

  function arrangeCard(card) {
    const slot = card?.dataset.workspaceSlot;
    const payload = slot && read(KEYS[slot]);
    const solo = card?.querySelector('.relphi-skinny-solo');
    const svg = solo?.querySelector('svg.ph-current-wheel');
    const portal = card?.querySelector('.relphi-skinny-heptagram');
    if (!slot || !payload || !solo || !svg) return;

    if (portal && portal.parentElement !== solo) solo.appendChild(portal);
    addRainbow(svg, payload);
  }

  function ensureStyle() {
    if (document.getElementById('relphi-skinny-graphic-hierarchy-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-skinny-graphic-hierarchy-style';
    style.textContent = `
      .relphi-skinny-solo{position:relative!important;isolation:isolate;padding:.28rem 0 .42rem!important;min-height:118px}
      .relphi-skinny-solo>svg.ph-current-wheel{position:relative;z-index:1;width:112px!important;max-width:calc(100% - 8px);margin:0 auto!important}
      .relphi-skinny-heptagram{position:absolute!important;z-index:3;top:.22rem;right:.18rem;width:38px!important;height:38px!important;margin:0!important;padding:2px;border:1px solid rgba(17,17,17,.12);border-radius:50%;background:rgba(255,255,255,.88);box-shadow:0 2px 8px rgba(17,17,17,.08);opacity:.56;transform:scale(.94);transform-origin:top right;transition:opacity .16s ease,transform .16s ease,box-shadow .16s ease}
      .relphi-skinny-heptagram svg{display:block;width:100%!important;height:100%!important}
      .relphi-skinny-heptagram:hover,.relphi-skinny-heptagram:focus-visible{opacity:1;transform:scale(1);box-shadow:0 3px 10px rgba(17,17,17,.16)}
      .relphi-skinny-heptagram:focus-visible{outline:2px solid var(--panel-accent)!important;outline-offset:2px}
      .relphi-skinny-solo [data-layer="mini-rainbow-houses"] path,.relphi-skinny-solo [data-layer="mini-rainbow-signs"] path{vector-effect:non-scaling-stroke}
      @media(max-width:760px){.relphi-skinny-solo{min-height:132px;max-width:180px!important}.relphi-skinny-solo>svg.ph-current-wheel{width:126px!important}.relphi-skinny-heptagram{width:42px!important;height:42px!important;right:.12rem;top:.18rem}}
    `;
    document.head.appendChild(style);
  }

  function run() {
    queued = false;
    ensureStyle();
    document.querySelectorAll('#relphiSkyWorkspace .relphi-workspace-sky').forEach(arrangeCard);
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => requestAnimationFrame(run));
  }

  function start() {
    run();
    [120, 320, 700, 1200].forEach(delay => setTimeout(schedule, delay));
    window.addEventListener('storage', schedule);
    window.addEventListener('relphi:extra-points-updated', schedule);
    const workspace = document.getElementById('relphiSkyWorkspace');
    if (workspace) new MutationObserver(schedule).observe(workspace, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();