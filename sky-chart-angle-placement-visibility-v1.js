// Chart angles are structural chart objects. Relationship filters may control
// their participation in relationship results, but must never hide them from the
// Sky Card Placements tab or from the wheel itself.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyAnglePlacementVisibilityV4) return;
  window.__relphiSkyAnglePlacementVisibilityV1 = true;
  window.__relphiSkyAnglePlacementVisibilityV2 = true;
  window.__relphiSkyAnglePlacementVisibilityV3 = true;
  window.__relphiSkyAnglePlacementVisibilityV4 = true;

  const ANGLES = ['asc','dsc','mc','ic'];
  const ANGLE_SELECTOR = [
    '#skyFoundationA .sky-foundation-row[data-placement="asc"]',
    '#skyFoundationA .sky-foundation-row[data-placement="dsc"]',
    '#skyFoundationA .sky-foundation-row[data-placement="mc"]',
    '#skyFoundationA .sky-foundation-row[data-placement="ic"]',
    '#skyFoundationB .sky-foundation-row[data-placement="asc"]',
    '#skyFoundationB .sky-foundation-row[data-placement="dsc"]',
    '#skyFoundationB .sky-foundation-row[data-placement="mc"]',
    '#skyFoundationB .sky-foundation-row[data-placement="ic"]',
    '[data-layer="placements"] [data-angle-axis="true"]',
    '[data-layer="leaders"] [data-angle]'
  ].join(',');
  let queued = false;
  let hoverFilterActive = false;

  const norm = value => ((Number(value) % 360) + 360) % 360;
  function point(center,radius,degree) {
    const angle = (norm(degree) - 180) * Math.PI / 180;
    return { x:center.x + radius * Math.cos(angle), y:center.y + radius * Math.sin(angle) };
  }
  function translatedRadius(node,center) {
    const raw = String(node?.getAttribute('transform') || '');
    const match = raw.match(/translate\(\s*(-?\d+(?:\.\d+)?)\s*(?:,|\s)\s*(-?\d+(?:\.\d+)?)\s*\)/i);
    if (!match) return NaN;
    return Math.hypot(Number(match[1]) - center.x, Number(match[2]) - center.y);
  }
  function normalizeStandaloneAxes() {
    const wheel = document.querySelector('#skyFoundationWheelMount .sky-foundation-single-wheel');
    const spec = window.RelphiSkyWheelSpec;
    if (!wheel || !spec?.mini?.center || !spec?.miniRole) return;
    const center = spec.mini.center;
    const geometry = spec.miniRole('A');
    const outerEdge = Number(geometry?.edge);
    const gap = Number(spec.mini.angleGap) || 12;
    if (!Number.isFinite(outerEdge)) return;

    ANGLES.forEach(id => {
      const host = wheel.querySelector(`[data-layer="placements"] [data-angle-axis="true"][data-placement="${id}"]`);
      const line = wheel.querySelector(`[data-layer="leaders"] [data-angle="${id}"]`);
      const degree = Number(line?.dataset?.exactLongitude ?? host?.dataset?.exactLongitude);
      if (!host || !line || !Number.isFinite(degree)) return;

      // Match the approved outer-ring convention: the exact-position notch
      // begins at the ring edge and extends inward toward the chart center.
      const lane = translatedRadius(host,center);
      const inward = Number.isFinite(lane) ? Math.max(0,lane - gap) : Math.max(0,outerEdge - gap * 1.75);
      const a = point(center,inward,degree);
      const b = point(center,outerEdge,degree);
      line.setAttribute('x1',String(a.x));
      line.setAttribute('y1',String(a.y));
      line.setAttribute('x2',String(b.x));
      line.setAttribute('y2',String(b.y));
      line.setAttribute('stroke-width','1.3');
      line.dataset.standaloneAxisDirection = 'inward';

      // The comparison-wheel angle treatment is visually smaller at this scale.
      if (host.dataset.standaloneAxisScale !== 'approved') {
        const transform = String(host.getAttribute('transform') || '').replace(/\s+scale\([^)]*\)\s*$/,'');
        host.setAttribute('transform',`${transform} scale(.77)`);
        host.dataset.standaloneAxisScale = 'approved';
      }
    });
    wheel.dataset.standaloneAxes = 'approved';
  }

  function apply() {
    queued = false;
    ['A','B'].forEach(slot => {
      ANGLES.forEach(id => {
        document.querySelectorAll(
          `#skyFoundation${slot} .sky-foundation-row[data-placement="${id}"],` +
          `[data-layer="placements"] [data-sky="${slot}"][data-placement="${id}"],` +
          `[data-layer="leaders"] [data-sky="${slot}"][data-angle="${id}"]`
        ).forEach(node => {
          node.classList.remove('sky-chart-angle-placement-hidden');
          node.removeAttribute('hidden');
          node.dataset.chartAngleVisibility = 'structural-always-visible';
        });
      });
    });
    normalizeStandaloneAxes();
    document.documentElement.dataset.skyAnglePlacementVisibility = 'structural-always-visible';
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(apply);
  }

  function relevantMutation(record) {
    if (record.type === 'attributes') return record.target?.matches?.(ANGLE_SELECTOR);
    return [...record.addedNodes,...record.removedNodes].some(node => {
      if (!(node instanceof Element)) return false;
      return node.matches(ANGLE_SELECTOR) || !!node.querySelector?.(ANGLE_SELECTOR);
    });
  }

  function isHoverFilterEvent(event) {
    const state = event.detail?.state || null;
    const hover = state?.mode === 'hover' || (!state && hoverFilterActive);
    hoverFilterActive = state?.mode === 'hover';
    return hover;
  }

  function start() {
    ['relphi:sky-placement-multiselect-changed','relphi:sky-house-multiselect-changed','relphi:sky-aspect-multiselect-changed','relphi:sky-zodiac-filter-changed','relphi:sky-filter-wheel-focus-changed','relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-single-sky-aspects-rendered'].forEach(name => window.addEventListener(name, schedule));
    window.addEventListener('relphi:sky-foundation-filter-changed', event => {
      if (!isHoverFilterEvent(event)) schedule();
    });
    new MutationObserver(records => {
      if (records.some(relevantMutation)) schedule();
    }).observe(
      document.getElementById('skyFoundationRoot') || document.documentElement,
      { childList:true, subtree:true, attributes:true, attributeFilter:['hidden'] }
    );
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
