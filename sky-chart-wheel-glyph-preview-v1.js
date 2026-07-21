// Branch-only Sky Chart glyph preview. Not intended for production.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const PLACEMENT = '.chart-wheel-placement-stick';
  const ASSETS = {
    '☉':'sun','⊙':'sun','☽':'moon','☾':'moon','☿':'mercury','♀':'venus','♂':'mars',
    '♃':'jupiter','♄':'saturn','♅':'uranus','⛢':'uranus','♆':'neptune','♇':'pluto','⯓':'pluto'
  };
  const ORBIT_GAP = 27;
  const MIN_CENTER_GAP = 29;
  const MAX_TANGENTIAL = 38;
  let queued = false;
  let pinned = null;
  let tooltip = null;

  function bare(value) {
    return String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim();
  }

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function installPreviewGuard() {
    if (!document.querySelector('meta[name="robots"]')) {
      const meta = document.createElement('meta');
      meta.name = 'robots';
      meta.content = 'noindex,nofollow,noarchive';
      document.head.appendChild(meta);
    }
    if (!document.getElementById('relphiPreviewBadge')) {
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
  }

  function ensureTooltip() {
    if (tooltip) return tooltip;
    tooltip = document.createElement('div');
    tooltip.id = 'relphiWheelPreviewTooltip';
    tooltip.setAttribute('role', 'status');
    Object.assign(tooltip.style, {
      position:'fixed', zIndex:'99998', display:'none', maxWidth:'210px',
      padding:'8px 11px', border:'2px solid #111', borderRadius:'12px',
      background:'rgba(255,255,255,.98)', color:'#111', boxShadow:'0 5px 18px rgba(0,0,0,.18)',
      font:'750 13px/1.25 system-ui,sans-serif', textAlign:'center', pointerEvents:'none'
    });
    document.body.appendChild(tooltip);
    return tooltip;
  }

  function placementLabel(group) {
    const name = bare(group.querySelector('.chart-wheel-marker-name')?.textContent) ||
      bare(group.dataset.body) || bare(group.dataset.placement) || 'Placement';
    const degree = bare(group.querySelector('.chart-wheel-marker-degree')?.textContent);
    return degree ? name + ' · ' + degree : name;
  }

  function showTooltip(text, rect, color) {
    const node = ensureTooltip();
    node.textContent = text;
    node.style.borderColor = color || '#111';
    node.style.display = 'block';
    const own = node.getBoundingClientRect();
    const left = Math.max(8, Math.min(innerWidth - own.width - 8, rect.left + rect.width / 2 - own.width / 2));
    let top = rect.top - own.height - 10;
    if (top < 8) top = Math.min(innerHeight - own.height - 8, rect.bottom + 10);
    node.style.left = left + 'px';
    node.style.top = top + 'px';
  }

  function hideTooltip() {
    if (tooltip) tooltip.style.display = 'none';
  }

  function markerColor(group) {
    return group.classList.contains('sky-b') ? '#3166e2' : '#dc1f18';
  }

  function standardizeGlyph(group) {
    const knob = group.querySelector('circle.chart-wheel-stick-knob');
    const text = group.querySelector('.chart-wheel-marker-glyph');
    if (!knob || !text) return;
    const asset = ASSETS[bare(text.textContent)];
    if (!asset) {
      group.classList.remove('has-preview-image');
      text.style.removeProperty('display');
      return;
    }
    const cx = number(knob.getAttribute('cx'));
    const cy = number(knob.getAttribute('cy'));
    if (!Number.isFinite(cx) || !Number.isFinite(cy)) return;

    let image = group.querySelector('image.relphi-bubble-glyph-image');
    if (!image) {
      image = document.createElementNS(NS, 'image');
      image.classList.add('relphi-bubble-glyph-image');
      image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      image.setAttribute('pointer-events', 'none');
      group.appendChild(image);
    }
    const size = 19;
    image.setAttribute('href', 'assets/planet-glyphs/' + asset + '.svg?v=4');
    image.setAttribute('x', String(cx - size / 2));
    image.setAttribute('y', String(cy - size / 2));
    image.setAttribute('width', String(size));
    image.setAttribute('height', String(size));
    group.classList.add('has-preview-image');
  }

  function rememberTransform(node) {
    if (node.dataset.previewBaseTransform != null) return;
    node.dataset.previewBaseTransform = node.getAttribute('transform') || '__none__';
  }

  function restoreLayout(svg) {
    svg.querySelectorAll('[data-preview-base-transform]').forEach(function (node) {
      const base = node.dataset.previewBaseTransform;
      if (base === '__none__') node.removeAttribute('transform');
      else node.setAttribute('transform', base);
      delete node.dataset.previewBaseTransform;
    });
    svg.querySelectorAll('line[data-preview-leader]').forEach(function (line) {
      ['x1','y1','x2','y2'].forEach(function (name) {
        const key = 'preview' + name.toUpperCase();
        if (line.dataset[key] != null) line.setAttribute(name, line.dataset[key]);
        delete line.dataset[key];
      });
      delete line.dataset.previewLeader;
    });
  }

  function translate(node, dx, dy) {
    rememberTransform(node);
    const base = node.dataset.previewBaseTransform;
    const move = 'translate(' + dx.toFixed(2) + ' ' + dy.toFixed(2) + ')';
    node.setAttribute('transform', base === '__none__' ? move : base + ' ' + move);
  }

  function rememberLeader(line) {
    if (line.dataset.previewLeader) return;
    line.dataset.previewLeader = 'true';
    ['x1','y1','x2','y2'].forEach(function (name) {
      line.dataset['preview' + name.toUpperCase()] = line.getAttribute(name) || '0';
    });
  }

  function collectLayout(svg) {
    const box = svg.viewBox?.baseVal;
    const center = box && box.width ? { x:box.x + box.width / 2, y:box.y + box.height / 2 } : { x:400, y:400 };
    return Array.from(svg.querySelectorAll(PLACEMENT)).map(function (group, index) {
      const knob = group.querySelector('circle.chart-wheel-stick-knob');
      const leader = group.querySelector('line.chart-wheel-stick');
      const contact = group.querySelector('circle.chart-wheel-contact-dot');
      if (!knob || !leader || !contact) return null;
      const original = { x:number(knob.getAttribute('cx')), y:number(knob.getAttribute('cy')) };
      const anchor = { x:number(contact.getAttribute('cx')), y:number(contact.getAttribute('cy')) };
      if (![original.x, original.y, anchor.x, anchor.y].every(Number.isFinite)) return null;
      const vx = anchor.x - center.x;
      const vy = anchor.y - center.y;
      const length = Math.hypot(vx, vy) || 1;
      const normal = { x:vx / length, y:vy / length };
      const tangent = { x:-normal.y, y:normal.x };
      return {
        index:index, group:group, knob:knob, leader:leader, anchor:anchor, original:original,
        normal:normal, tangent:tangent, tangential:0,
        target:{ x:anchor.x + normal.x * ORBIT_GAP, y:anchor.y + normal.y * ORBIT_GAP }
      };
    }).filter(Boolean);
  }

  function targetPosition(item) {
    return {
      x:item.target.x + item.tangent.x * item.tangential,
      y:item.target.y + item.tangent.y * item.tangential
    };
  }

  function solveLayout(items) {
    for (let pass = 0; pass < 24; pass += 1) {
      let changed = false;
      for (let a = 0; a < items.length; a += 1) {
        for (let b = a + 1; b < items.length; b += 1) {
          const first = items[a];
          const second = items[b];
          const p = targetPosition(first);
          const q = targetPosition(second);
          const distance = Math.hypot(q.x - p.x, q.y - p.y);
          if (distance >= MIN_CENTER_GAP) continue;
          const cross = first.normal.x * second.normal.y - first.normal.y * second.normal.x;
          const direction = Math.sign(cross) || (first.index < second.index ? 1 : -1);
          const push = Math.min(4, (MIN_CENTER_GAP - distance) * .56 + .35);
          first.tangential = Math.max(-MAX_TANGENTIAL, Math.min(MAX_TANGENTIAL, first.tangential - direction * push / 2));
          second.tangential = Math.max(-MAX_TANGENTIAL, Math.min(MAX_TANGENTIAL, second.tangential + direction * push / 2));
          changed = true;
        }
      }
      if (!changed) break;
    }
  }

  function connectLeader(item, position) {
    const x1 = number(item.leader.getAttribute('x1'));
    const y1 = number(item.leader.getAttribute('y1'));
    const x2 = number(item.leader.getAttribute('x2'));
    const y2 = number(item.leader.getAttribute('y2'));
    if (![x1,y1,x2,y2].every(Number.isFinite)) return;
    const d1 = Math.hypot(x1 - item.anchor.x, y1 - item.anchor.y);
    const d2 = Math.hypot(x2 - item.anchor.x, y2 - item.anchor.y);
    const vector = { x:position.x - item.anchor.x, y:position.y - item.anchor.y };
    const length = Math.hypot(vector.x, vector.y) || 1;
    const edge = { x:position.x - vector.x / length * 13.2, y:position.y - vector.y / length * 13.2 };
    rememberLeader(item.leader);
    if (d1 <= d2) {
      item.leader.setAttribute('x1', item.anchor.x.toFixed(2));
      item.leader.setAttribute('y1', item.anchor.y.toFixed(2));
      item.leader.setAttribute('x2', edge.x.toFixed(2));
      item.leader.setAttribute('y2', edge.y.toFixed(2));
    } else {
      item.leader.setAttribute('x2', item.anchor.x.toFixed(2));
      item.leader.setAttribute('y2', item.anchor.y.toFixed(2));
      item.leader.setAttribute('x1', edge.x.toFixed(2));
      item.leader.setAttribute('y1', edge.y.toFixed(2));
    }
  }

  function compactLayout(svg) {
    restoreLayout(svg);
    const items = collectLayout(svg);
    solveLayout(items);
    items.forEach(function (item) {
      const position = targetPosition(item);
      const dx = position.x - item.original.x;
      const dy = position.y - item.original.y;
      [item.knob, item.group.querySelector('.chart-wheel-marker-glyph'), item.group.querySelector('image.relphi-bubble-glyph-image')]
        .filter(Boolean).forEach(function (node) { translate(node, dx, dy); });
      connectLeader(item, position);
    });
  }

  function activatePlacement(group, pin) {
    const svg = group.closest('svg');
    svg?.querySelectorAll(PLACEMENT + '.is-preview-active').forEach(function (node) { node.classList.remove('is-preview-active'); });
    group.classList.add('is-preview-active');
    if (pin) pinned = group;
    const knob = group.querySelector('.chart-wheel-stick-knob');
    showTooltip(placementLabel(group), (knob || group).getBoundingClientRect(), markerColor(group));
  }

  function wirePlacement(group) {
    standardizeGlyph(group);
    if (group.dataset.previewWired) return;
    group.dataset.previewWired = 'true';
    group.setAttribute('tabindex', '0');
    group.setAttribute('role', 'button');
    group.setAttribute('aria-label', placementLabel(group));
    const knob = group.querySelector('.chart-wheel-stick-knob');
    const leader = group.querySelector('.chart-wheel-stick');
    [knob, leader].filter(Boolean).forEach(function (target) {
      target.style.cursor = 'pointer';
      target.style.pointerEvents = 'stroke';
      target.addEventListener('pointerenter', function () { if (!pinned) activatePlacement(group, false); });
      target.addEventListener('pointerleave', function () { if (!pinned) { group.classList.remove('is-preview-active'); hideTooltip(); } });
      target.addEventListener('click', function (event) {
        event.stopPropagation();
        if (pinned === group) {
          pinned = null;
          group.classList.remove('is-preview-active');
          hideTooltip();
        } else activatePlacement(group, true);
      });
    });
    group.addEventListener('focus', function () { activatePlacement(group, false); });
    group.addEventListener('blur', function () { if (!pinned) { group.classList.remove('is-preview-active'); hideTooltip(); } });
  }

  function rootPoint(node, x, y) {
    const matrix = node.getCTM?.();
    if (!matrix) return { x:x, y:y };
    const point = new DOMPoint(x, y).matrixTransform(matrix);
    return { x:point.x, y:point.y };
  }

  function contactPoint(group) {
    const dot = group.querySelector('.chart-wheel-contact-dot');
    if (!dot) return null;
    const x = number(dot.getAttribute('cx'));
    const y = number(dot.getAttribute('cy'));
    return Number.isFinite(x) && Number.isFinite(y) ? rootPoint(dot, x, y) : null;
  }

  function endpoints(node) {
    if (node.tagName.toLowerCase() === 'line') {
      const values = ['x1','y1','x2','y2'].map(function (key) { return number(node.getAttribute(key)); });
      if (values.every(Number.isFinite)) return [rootPoint(node, values[0], values[1]), rootPoint(node, values[2], values[3])];
    }
    if (node.tagName.toLowerCase() === 'path' && node.getTotalLength) {
      try {
        const length = node.getTotalLength();
        const a = node.getPointAtLength(0);
        const b = node.getPointAtLength(length);
        return [rootPoint(node, a.x, a.y), rootPoint(node, b.x, b.y)];
      } catch (_) {}
    }
    return [];
  }

  function placementsForAspect(node) {
    const svg = node.closest('svg');
    const ends = endpoints(node);
    if (!svg || ends.length !== 2) return [];
    const placements = Array.from(svg.querySelectorAll(PLACEMENT)).map(function (group) {
      return { group:group, point:contactPoint(group) };
    }).filter(function (item) { return item.point; });
    const matched = ends.map(function (end) {
      let best = null;
      placements.forEach(function (item) {
        const distance = Math.hypot(item.point.x - end.x, item.point.y - end.y);
        if (!best || distance < best.distance) best = { group:item.group, distance:distance };
      });
      return best && best.distance <= 10 ? best.group : null;
    }).filter(Boolean);
    return matched.length === 2 && matched[0] !== matched[1] ? matched : [];
  }

  function wireAspects(svg) {
    Array.from(svg.querySelectorAll('line,path')).forEach(function (node) {
      if (node.closest(PLACEMENT) || node.dataset.previewAspectWired) return;
      const groups = placementsForAspect(node);
      if (groups.length !== 2) return;
      node.dataset.previewAspectWired = 'true';
      node.style.cursor = 'pointer';
      node.style.pointerEvents = 'stroke';
      const reveal = function () {
        showTooltip(placementLabel(groups[0]) + ' ↔ ' + placementLabel(groups[1]), node.getBoundingClientRect(), '#7b6b34');
        groups.forEach(function (group) { group.classList.add('is-preview-active'); });
        node.classList.add('is-preview-aspect-active');
      };
      const clear = function () {
        if (pinned) return;
        groups.forEach(function (group) { group.classList.remove('is-preview-active'); });
        node.classList.remove('is-preview-aspect-active');
        hideTooltip();
      };
      node.addEventListener('pointerenter', reveal);
      node.addEventListener('pointerleave', clear);
      node.addEventListener('click', function (event) { event.stopPropagation(); pinned = null; reveal(); });
    });
  }

  function run() {
    queued = false;
    installPreviewGuard();
    document.querySelectorAll('.unified-sky-wheel svg, #chartOutput svg, #currentSkyOutput svg, .sky-output-box svg').forEach(function (svg) {
      svg.querySelectorAll(PLACEMENT).forEach(wirePlacement);
      compactLayout(svg);
      wireAspects(svg);
      if (!svg.dataset.previewClearWired) {
        svg.dataset.previewClearWired = 'true';
        svg.addEventListener('click', function (event) {
          if (event.target.closest?.(PLACEMENT) || event.target.dataset.previewAspectWired) return;
          pinned = null;
          svg.querySelectorAll('.is-preview-active').forEach(function (node) { node.classList.remove('is-preview-active'); });
          svg.querySelectorAll('.is-preview-aspect-active').forEach(function (node) { node.classList.remove('is-preview-aspect-active'); });
          hideTooltip();
        });
      }
    });
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { requestAnimationFrame(run); });
  }

  function install() {
    schedule();
    [150, 450, 1000, 2000].forEach(function (delay) { setTimeout(schedule, delay); });
    window.addEventListener('relphi:sky-builder-v4-loaded', schedule);
    window.addEventListener('resize', schedule, { passive:true });
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
