// Branch-only preview interactions plus final micro-refinement.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const PLACEMENT = '.chart-wheel-placement-stick';
  const SVG_SELECTOR = '.unified-sky-wheel svg, #chartOutput svg, #currentSkyOutput svg, .sky-output-box svg';
  const EXTRA_OUTWARD = 6;
  const REFINED_RADIUS = 16.5;
  const LEADER_OVERLAP = 1.1;
  let tooltip = null;
  let pinned = null;
  let refinementQueued = false;

  function appendOnce(src) {
    const base = src.split('?')[0];
    if (document.querySelector('script[src^="' + base + '"]')) return;
    const script = document.createElement('script');
    script.async = false;
    script.src = src;
    document.body.appendChild(script);
  }

  function bare(value) {
    return String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim();
  }

  function markerColor(group) {
    return group.classList.contains('sky-b') ? '#3166e2' : '#dc1f18';
  }

  function placementLabel(group) {
    const name = bare(group.querySelector('.chart-wheel-marker-name')?.textContent) ||
      bare(group.dataset.body) || bare(group.dataset.placement) || 'Placement';
    const degree = bare(group.querySelector('.chart-wheel-marker-degree')?.textContent);
    return degree ? name + ' · ' + degree : name;
  }

  function installPreviewGuard() {
    if (!document.querySelector('meta[name="robots"]')) {
      const meta = document.createElement('meta');
      meta.name = 'robots';
      meta.content = 'noindex,nofollow,noarchive';
      document.head.appendChild(meta);
    }
    if (document.getElementById('relphiPreviewBadge')) return;
    const badge = document.createElement('div');
    badge.id = 'relphiPreviewBadge';
    badge.textContent = 'PRIVATE TEST PREVIEW · NOT PRODUCTION';
    Object.assign(badge.style, {
      position:'fixed', left:'10px', bottom:'10px', zIndex:'99999',
      padding:'7px 10px', borderRadius:'999px', background:'#111', color:'#fff',
      font:'700 11px/1.1 system-ui,sans-serif', letterSpacing:'.04em', opacity:'.88',
      pointerEvents:'none'
    });
    document.body.appendChild(badge);
  }

  function installRefinementStyle() {
    if (document.getElementById('relphiWheelRefinementStyle')) return;
    const style = document.createElement('style');
    style.id = 'relphiWheelRefinementStyle';
    style.textContent = '.unified-sky-wheel .chart-wheel-placement-stick .chart-wheel-stick-knob{r:' + REFINED_RADIUS + 'px!important}';
    document.head.appendChild(style);
  }

  function ensureTooltip() {
    if (tooltip) return tooltip;
    tooltip = document.createElement('div');
    tooltip.id = 'relphiWheelPreviewTooltip';
    tooltip.setAttribute('role', 'status');
    Object.assign(tooltip.style, {
      position:'fixed', zIndex:'99998', display:'none', maxWidth:'220px',
      padding:'8px 11px', border:'2px solid #111', borderRadius:'12px',
      background:'rgba(255,255,255,.98)', color:'#111', boxShadow:'0 5px 18px rgba(0,0,0,.18)',
      font:'750 13px/1.25 system-ui,sans-serif', textAlign:'center', pointerEvents:'none'
    });
    document.body.appendChild(tooltip);
    return tooltip;
  }

  function show(group) {
    const node = ensureTooltip();
    const knob = group.querySelector('.chart-wheel-stick-knob') || group;
    const rect = knob.getBoundingClientRect();
    node.textContent = placementLabel(group);
    node.style.borderColor = markerColor(group);
    node.style.display = 'block';
    const own = node.getBoundingClientRect();
    node.style.left = Math.max(8, Math.min(innerWidth - own.width - 8, rect.left + rect.width / 2 - own.width / 2)) + 'px';
    node.style.top = Math.max(8, rect.top - own.height - 10) + 'px';
    group.classList.add('is-preview-active');
  }

  function clear(group) {
    group?.classList.remove('is-preview-active');
    if (tooltip) tooltip.style.display = 'none';
  }

  function wire(group) {
    if (group.dataset.previewInteractionWired) return;
    group.dataset.previewInteractionWired = 'true';
    group.setAttribute('tabindex', '0');
    group.setAttribute('role', 'button');
    group.setAttribute('aria-label', placementLabel(group));
    const targets = [group.querySelector('.chart-wheel-stick-knob'), group.querySelector('.chart-wheel-stick')].filter(Boolean);
    targets.forEach(function (target) {
      target.style.cursor = 'pointer';
      target.addEventListener('pointerenter', function () { if (!pinned) show(group); });
      target.addEventListener('pointerleave', function () { if (!pinned) clear(group); });
      target.addEventListener('click', function (event) {
        event.stopPropagation();
        if (pinned === group) { pinned = null; clear(group); }
        else { if (pinned) clear(pinned); pinned = group; show(group); }
      });
    });
    group.addEventListener('focus', function () { if (!pinned) show(group); });
    group.addEventListener('blur', function () { if (!pinned) clear(group); });
  }

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function pointToRoot(node, x, y) {
    const matrix = node.getCTM?.();
    return matrix ? new DOMPoint(x, y).matrixTransform(matrix) : new DOMPoint(x, y);
  }

  function pointFromRoot(node, point) {
    const matrix = node.getCTM?.();
    if (!matrix) return point;
    try { return point.matrixTransform(matrix.inverse()); }
    catch (_) { return point; }
  }

  function rememberTransform(node) {
    if (node.dataset.relphiRefinementBaseTransform != null) return;
    node.dataset.relphiRefinementBaseTransform = node.getAttribute('transform') || '__none__';
  }

  function restoreTransform(node) {
    const base = node.dataset.relphiRefinementBaseTransform;
    if (base == null) return;
    if (base === '__none__') node.removeAttribute('transform');
    else node.setAttribute('transform', base);
  }

  function moveFromBase(node, dx, dy) {
    rememberTransform(node);
    restoreTransform(node);
    const base = node.dataset.relphiRefinementBaseTransform;
    const shift = 'translate(' + dx.toFixed(2) + ' ' + dy.toFixed(2) + ')';
    node.setAttribute('transform', base === '__none__' ? shift : base + ' ' + shift);
  }

  function refineGroup(group, wheelCenter) {
    const knob = group.querySelector('circle.chart-wheel-stick-knob');
    const contact = group.querySelector('circle.chart-wheel-contact-dot');
    const leader = group.querySelector('line.chart-wheel-stick');
    if (!knob || !contact || !leader) return;

    const moving = [knob, group.querySelector('.chart-wheel-marker-glyph'), group.querySelector('svg.relphi-bold-inline-glyph')].filter(Boolean);
    moving.forEach(restoreTransform);

    const knobCenter = pointToRoot(knob, number(knob.getAttribute('cx')), number(knob.getAttribute('cy')));
    const vx = knobCenter.x - wheelCenter.x;
    const vy = knobCenter.y - wheelCenter.y;
    const length = Math.hypot(vx, vy) || 1;
    const target = new DOMPoint(knobCenter.x + vx / length * EXTRA_OUTWARD, knobCenter.y + vy / length * EXTRA_OUTWARD);

    moving.forEach(function (node) {
      const localNow = pointFromRoot(node, knobCenter);
      const localTarget = pointFromRoot(node, target);
      moveFromBase(node, localTarget.x - localNow.x, localTarget.y - localNow.y);
    });

    knob.setAttribute('r', String(REFINED_RADIUS));

    const anchor = pointToRoot(contact, number(contact.getAttribute('cx')), number(contact.getAttribute('cy')));
    const lx = target.x - anchor.x;
    const ly = target.y - anchor.y;
    const leaderLength = Math.hypot(lx, ly) || 1;
    const edge = new DOMPoint(
      target.x - lx / leaderLength * (REFINED_RADIUS - LEADER_OVERLAP),
      target.y - ly / leaderLength * (REFINED_RADIUS - LEADER_OVERLAP)
    );
    const localAnchor = pointFromRoot(leader, anchor);
    const localEdge = pointFromRoot(leader, edge);
    leader.setAttribute('x1', localAnchor.x.toFixed(2));
    leader.setAttribute('y1', localAnchor.y.toFixed(2));
    leader.setAttribute('x2', localEdge.x.toFixed(2));
    leader.setAttribute('y2', localEdge.y.toFixed(2));
  }

  function refineSvg(svg) {
    const view = svg.viewBox?.baseVal;
    const wheelCenter = view && view.width ? new DOMPoint(view.x + view.width / 2, view.y + view.height / 2) : new DOMPoint(400, 400);
    svg.querySelectorAll(PLACEMENT).forEach(function (group) { refineGroup(group, wheelCenter); });
  }

  function refineAll() {
    refinementQueued = false;
    document.querySelectorAll(SVG_SELECTOR).forEach(refineSvg);
  }

  function scheduleRefinement() {
    if (refinementQueued) return;
    refinementQueued = true;
    queueMicrotask(refineAll);
  }

  function run() {
    installPreviewGuard();
    installRefinementStyle();
    document.querySelectorAll(PLACEMENT).forEach(wire);
    scheduleRefinement();
  }

  function install() {
    appendOnce('sky-chart-wheel-glyph-preview-fixes-v1.js?v=1');
    run();
    window.addEventListener('relphi:sky-builder-v4-loaded', run);
    window.addEventListener('resize', scheduleRefinement, { passive:true });
    document.addEventListener('click', function () { if (pinned) { clear(pinned); pinned = null; } });
    new MutationObserver(function (records) {
      if (records.some(function (record) {
        return Array.from(record.addedNodes || []).some(function (node) {
          return node.nodeType === Node.ELEMENT_NODE && (node.matches?.(PLACEMENT) || node.querySelector?.(PLACEMENT));
        });
      })) run();
    }).observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
