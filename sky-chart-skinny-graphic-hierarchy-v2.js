// Make the mini Sky Chart the primary graphic and tuck Planetary Hours into its corner.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkinnyGraphicHierarchyV2) return;
  window.__relphiSkinnyGraphicHierarchyV2 = true;

  const NS = 'http://www.w3.org/2000/svg';
  const KEYS = { skyA:'relphiSkyChartA', skyB:'relphiSkyChartB' };
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const RAINBOW = ['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
  const CX = 120, CY = 120;
  let queued = false;

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }
  function profile(payload) { return payload?.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {}; }
  function placements(payload) {
    const value = payload && (payload.placements || payload.positions || payload.points || payload);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }
  function norm(value) { return ((Number(value || 0) % 360) + 360) % 360; }
  function longitude(item) {
    if (Number.isFinite(Number(item?.longitude))) return norm(item.longitude);
    const sign = SIGNS.findIndex(name => name.toLowerCase() === String(item?.sign || item?.zodiac || '').trim().toLowerCase());
    return sign < 0 ? NaN : norm(sign * 30 + Number(item?.degree || item?.degrees || 0) + Number(item?.minute || item?.minutes || 0) / 60);
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
      const values = (Array.isArray(raw) ? raw : Object.values(raw))
        .map(item => typeof item === 'object' ? Number(item.longitude ?? item.value ?? item.cusp) : Number(item))
        .filter(Number.isFinite)
        .slice(0, 12);
      if (values.length === 12) return values.map(norm);
    }
    const system = String(p.houseSystem || payload?.houseSystem || payload?.house_system || '').toLowerCase();
    const start = system.includes('whole') ? Math.floor(asc / 30) * 30 : asc;
    return Array.from({ length:12 }, (_, index) => norm(start + index * 30));
  }
  function node(name, attrs) {
    const result = document.createElementNS(NS, name);
    Object.entries(attrs || {}).forEach(([key, value]) => result.setAttribute(key, String(value)));
    return result;
  }
  function point(radius, degrees) {
    const radians = degrees * Math.PI / 180;
    return { x:CX + Math.cos(radians) * radius, y:CY + Math.sin(radians) * radius };
  }
  function sector(inner, outer, start, span) {
    const large = span > 180 ? 1 : 0;
    const a = point(outer, start), b = point(outer, start + span);
    const c = point(inner, start + span), d = point(inner, start);
    return `M${a.x} ${a.y} A${outer} ${outer} 0 ${large} 1 ${b.x} ${b.y} L${c.x} ${c.y} A${inner} ${inner} 0 ${large} 0 ${d.x} ${d.y} Z`;
  }

  function paintWheel(svg, payload) {
    if (!svg || svg.childElementCount < 2) return;
    svg.querySelectorAll('[data-layer="mini-rainbow-houses-v2"],[data-layer="mini-rainbow-signs-v2"]').forEach(n => n.remove());

    const asc = ascLongitude(payload);
    const cusps = houseCusps(payload, asc);
    const houses = node('g', {'data-layer':'mini-rainbow-houses-v2','pointer-events':'none','aria-hidden':'true'});
    const signs = node('g', {'data-layer':'mini-rainbow-signs-v2','pointer-events':'none','aria-hidden':'true'});

    cusps.forEach((startLongitude, index) => {
      const span = norm(cusps[(index + 1) % 12] - startLongitude) || 30;
      houses.appendChild(node('path', {
        d:sector(18, 70, norm(180 + startLongitude - asc), span),
        fill:RAINBOW[index],
        'fill-opacity':'.28'
      }));
    });
    for (let index = 0; index < 12; index += 1) {
      signs.appendChild(node('path', {
        d:sector(70, 88, norm(180 + index * 30 - asc), 30),
        fill:RAINBOW[index],
        'fill-opacity':'.68'
      }));
    }

    // Keep the original white wheel background, then place color beneath all ticks,
    // glyphs, house labels, placements, and aspect lines.
    const background = svg.querySelector(':scope > .wheel-core') || svg.firstElementChild;
    const insertionPoint = background?.nextSibling || svg.firstChild;
    svg.insertBefore(houses, insertionPoint);
    svg.insertBefore(signs, insertionPoint);
    svg.dataset.rainbowMiniReady = 'true';
  }

  function arrange(card) {
    const slot = card?.dataset.workspaceSlot;
    const payload = slot && read(KEYS[slot]);
    const solo = card?.querySelector('.relphi-skinny-solo');
    const wheel = solo?.querySelector('svg.ph-current-wheel');
    const portal = card?.querySelector('.relphi-skinny-heptagram');
    if (!payload || !solo || !wheel) return;

    solo.classList.add('relphi-skinny-graphic-stage');
    if (portal) {
      portal.classList.add('relphi-corner-planetary-hours');
      if (portal.parentElement !== solo) solo.appendChild(portal);
    }
    paintWheel(wheel, payload);
  }

  function styles() {
    if (document.getElementById('relphi-skinny-graphic-hierarchy-v2-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-skinny-graphic-hierarchy-v2-style';
    style.textContent = `
      .relphi-skinny-graphic-stage{position:relative!important;isolation:isolate!important;padding:.25rem 0 .42rem!important;min-height:126px!important}
      .relphi-skinny-graphic-stage>svg.ph-current-wheel{display:block!important;position:relative!important;z-index:1!important;width:120px!important;height:auto!important;max-width:calc(100% - 6px)!important;margin:0 auto!important;overflow:visible!important}
      .relphi-skinny-graphic-stage>.relphi-corner-planetary-hours{display:block!important;position:absolute!important;z-index:4!important;top:.16rem!important;right:.12rem!important;width:34px!important;height:34px!important;margin:0!important;padding:2px!important;border:1px solid rgba(17,17,17,.12)!important;border-radius:50%!important;background:rgba(255,255,255,.9)!important;box-shadow:0 2px 7px rgba(17,17,17,.08)!important;opacity:.42!important;transform:none!important;transition:opacity .16s ease,box-shadow .16s ease!important}
      .relphi-skinny-graphic-stage>.relphi-corner-planetary-hours svg{display:block!important;width:100%!important;height:100%!important}
      .relphi-skinny-graphic-stage>.relphi-corner-planetary-hours:hover,.relphi-skinny-graphic-stage>.relphi-corner-planetary-hours:focus-visible{opacity:1!important;box-shadow:0 3px 10px rgba(17,17,17,.18)!important}
      .relphi-skinny-graphic-stage [data-layer="mini-rainbow-houses-v2"] path,.relphi-skinny-graphic-stage [data-layer="mini-rainbow-signs-v2"] path{vector-effect:non-scaling-stroke}
      @media(max-width:760px){.relphi-skinny-graphic-stage{min-height:142px!important;max-width:190px!important}.relphi-skinny-graphic-stage>svg.ph-current-wheel{width:136px!important}.relphi-skinny-graphic-stage>.relphi-corner-planetary-hours{width:36px!important;height:36px!important}}
    `;
    document.head.appendChild(style);
  }

  function run() {
    queued = false;
    styles();
    document.querySelectorAll('#relphiSkyWorkspace .relphi-workspace-sky').forEach(arrange);
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => requestAnimationFrame(run));
  }
  function start() {
    run();
    [80, 220, 500, 900, 1400, 2200].forEach(delay => setTimeout(schedule, delay));
    window.addEventListener('storage', schedule);
    window.addEventListener('relphi:extra-points-updated', schedule);
    const workspace = document.getElementById('relphiSkyWorkspace');
    if (workspace) new MutationObserver(schedule).observe(workspace, {childList:true, subtree:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();