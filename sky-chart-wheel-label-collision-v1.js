// Collision layout for complete SkyChart placement units using the unified glyph host.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const PLACEMENT = '.chart-wheel-placement-stick';
  const KNOB = 'circle.chart-wheel-stick-knob';
  const LEADER = 'line.chart-wheel-stick';
  const MOVABLE = [
    'circle.chart-wheel-stick-knob',
    '.relphi-sky-glyph-host',
    '.chart-wheel-marker-degree',
    '.chart-wheel-marker-name'
  ].join(',');
  const WHEEL_SELECTOR = '#chartOutput svg,#currentSkyOutput svg,#tarot-chart svg,.sky-output-box svg';
  const BUBBLE_GAP = 5.5;
  const BOX_GAP = 2.5;
  const MAX_TANGENTIAL_SHIFT = 64;
  const MAX_RADIAL_SHIFT = 24;
  const ITERATIONS = 48;

  let queued = false;
  let running = false;

  function num(value) {
    const result = Number(value);
    return Number.isFinite(result) ? result : NaN;
  }

  function validPoint(point) {
    return point && Number.isFinite(point.x) && Number.isFinite(point.y);
  }

  function distance(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  function rootViewBox(svg) {
    const box = svg && svg.viewBox && svg.viewBox.baseVal;
    if (box && box.width > 0 && box.height > 0) {
      return { x:box.x, y:box.y, width:box.width, height:box.height };
    }
    return {
      x:0,
      y:0,
      width:num(svg.getAttribute('width')) || svg.clientWidth || 800,
      height:num(svg.getAttribute('height')) || svg.clientHeight || 800
    };
  }

  function rootPoint(node, x, y, svg) {
    const sourceMatrix = node && node.getScreenCTM && node.getScreenCTM();
    const rootMatrix = svg && svg.getScreenCTM && svg.getScreenCTM();
    if (!sourceMatrix || !rootMatrix || typeof rootMatrix.inverse !== 'function') return { x:x, y:y };
    try {
      const point = svg.createSVGPoint();
      point.x = x;
      point.y = y;
      return point.matrixTransform(sourceMatrix).matrixTransform(rootMatrix.inverse());
    } catch (_) {
      return { x:x, y:y };
    }
  }

  function pointInNode(node, point, svg) {
    const rootMatrix = svg && svg.getScreenCTM && svg.getScreenCTM();
    const nodeMatrix = node && node.getScreenCTM && node.getScreenCTM();
    if (!rootMatrix || !nodeMatrix || typeof nodeMatrix.inverse !== 'function') return point;
    try {
      const svgPoint = svg.createSVGPoint();
      svgPoint.x = point.x;
      svgPoint.y = point.y;
      return svgPoint.matrixTransform(rootMatrix).matrixTransform(nodeMatrix.inverse());
    } catch (_) {
      return point;
    }
  }

  function nodeBox(node, svg) {
    let box;
    try { box = node.getBBox(); } catch (_) { return null; }
    if (!box || ![box.x, box.y, box.width, box.height].every(Number.isFinite)) return null;
    const corners = [
      rootPoint(node, box.x, box.y, svg),
      rootPoint(node, box.x + box.width, box.y, svg),
      rootPoint(node, box.x, box.y + box.height, svg),
      rootPoint(node, box.x + box.width, box.y + box.height, svg)
    ];
    const xs = corners.map(function (point) { return point.x; });
    const ys = corners.map(function (point) { return point.y; });
    return {
      x:Math.min.apply(Math, xs),
      y:Math.min.apply(Math, ys),
      width:Math.max.apply(Math, xs) - Math.min.apply(Math, xs),
      height:Math.max.apply(Math, ys) - Math.min.apply(Math, ys)
    };
  }

  function rememberTransform(node) {
    if (node.dataset.relphiLollipopBaseTransform != null) return;
    node.dataset.relphiLollipopBaseTransform = node.getAttribute('transform') || '__none__';
  }

  function rememberLeader(line) {
    if (line.dataset.relphiLollipopLeader) return;
    line.dataset.relphiLollipopLeader = 'true';
    ['x1','y1','x2','y2'].forEach(function (name) {
      line.dataset['relphiLollipop' + name.toUpperCase()] = line.getAttribute(name) || '0';
    });
  }

  function restore(svg) {
    svg.querySelectorAll('[data-relphi-lollipop-base-transform]').forEach(function (node) {
      const base = node.dataset.relphiLollipopBaseTransform;
      if (base === '__none__') node.removeAttribute('transform');
      else node.setAttribute('transform', base);
      delete node.dataset.relphiLollipopBaseTransform;
    });
    svg.querySelectorAll('line[data-relphi-lollipop-leader]').forEach(function (line) {
      ['x1','y1','x2','y2'].forEach(function (name) {
        const key = 'relphiLollipop' + name.toUpperCase();
        if (line.dataset[key] != null) line.setAttribute(name, line.dataset[key]);
        delete line.dataset[key];
      });
      delete line.dataset.relphiLollipopLeader;
    });
    svg.querySelectorAll(PLACEMENT).forEach(function (group) {
      delete group.dataset.relphiLollipopShift;
      delete group.dataset.relphiLollipopRadialShift;
    });
  }

  function knobGeometry(knob, svg) {
    const cx = num(knob.getAttribute('cx'));
    const cy = num(knob.getAttribute('cy'));
    const radius = num(knob.getAttribute('r'));
    if (![cx, cy, radius].every(Number.isFinite) || radius <= 0) return null;
    const center = rootPoint(knob, cx, cy, svg);
    const edge = rootPoint(knob, cx + radius, cy, svg);
    return { center:center, radius:Math.max(1, distance(center, edge)) };
  }

  function endpoint(line, suffix, svg) {
    const x = num(line.getAttribute('x' + suffix));
    const y = num(line.getAttribute('y' + suffix));
    if (![x, y].every(Number.isFinite)) return null;
    const point = rootPoint(line, x, y, svg);
    point.suffix = suffix;
    return point;
  }

  function leaderGeometry(line, center, wheelCenter, radius, svg) {
    if (!line) return null;
    const one = endpoint(line, '1', svg);
    const two = endpoint(line, '2', svg);
    if (!validPoint(one) || !validPoint(two)) return null;
    const oneToKnob = distance(one, center);
    const twoToKnob = distance(two, center);
    const outer = oneToKnob <= twoToKnob ? one : two;
    const anchor = outer === one ? two : one;
    if (Math.min(oneToKnob, twoToKnob) > radius + 18) return null;
    if (distance(anchor, wheelCenter) >= distance(center, wheelCenter) - 4) return null;
    return { line:line, anchor:anchor, outer:outer };
  }

  function collect(svg) {
    const box = rootViewBox(svg);
    const wheelCenter = { x:box.x + box.width / 2, y:box.y + box.height / 2 };
    return Array.from(svg.querySelectorAll(PLACEMENT)).map(function (group, index) {
      const knob = group.querySelector(KNOB);
      const line = group.querySelector(LEADER);
      if (!knob || !line) return null;
      const knobInfo = knobGeometry(knob, svg);
      if (!knobInfo) return null;
      const leader = leaderGeometry(line, knobInfo.center, wheelCenter, knobInfo.radius, svg);
      if (!leader) return null;
      const nodes = Array.from(new Set(Array.from(group.querySelectorAll(MOVABLE))));
      if (!nodes.includes(knob)) nodes.unshift(knob);
      const boxes = nodes.map(function (node) { return nodeBox(node, svg); }).filter(Boolean);
      if (!boxes.length) return null;
      const radialDistance = distance(wheelCenter, knobInfo.center);
      const angle = Math.atan2(knobInfo.center.y - wheelCenter.y, knobInfo.center.x - wheelCenter.x);
      return {
        index:index,
        svg:svg,
        group:group,
        knob:knob,
        line:line,
        anchor:leader.anchor,
        nodes:nodes,
        boxes:boxes,
        center:knobInfo.center,
        radius:knobInfo.radius,
        wheelCenter:wheelCenter,
        radialDistance:radialDistance,
        angle:angle,
        tangent:{ x:-Math.sin(angle), y:Math.cos(angle) },
        normal:{ x:Math.cos(angle), y:Math.sin(angle) },
        tangential:0,
        radial:0
      };
    }).filter(Boolean);
  }

  function offset(item) {
    return {
      x:item.tangent.x * item.tangential + item.normal.x * item.radial,
      y:item.tangent.y * item.tangential + item.normal.y * item.radial
    };
  }

  function centerAt(item) {
    const shift = offset(item);
    return { x:item.center.x + shift.x, y:item.center.y + shift.y };
  }

  function shiftedBoxes(item) {
    const shift = offset(item);
    return item.boxes.map(function (box) {
      return { x:box.x + shift.x, y:box.y + shift.y, width:box.width, height:box.height };
    });
  }

  function rectanglesOverlap(a, b, gap) {
    return a.x < b.x + b.width + gap &&
      a.x + a.width + gap > b.x &&
      a.y < b.y + b.height + gap &&
      a.y + a.height + gap > b.y;
  }

  function footprintOverlap(first, second) {
    const firstBoxes = shiftedBoxes(first);
    const secondBoxes = shiftedBoxes(second);
    for (const a of firstBoxes) {
      for (const b of secondBoxes) {
        if (rectanglesOverlap(a, b, BOX_GAP)) return true;
      }
    }
    return false;
  }

  function collision(first, second) {
    const a = centerAt(first);
    const b = centerAt(second);
    const bubbleMissing = first.radius + second.radius + BUBBLE_GAP - distance(a, b);
    const boxesOverlap = footprintOverlap(first, second);
    return {
      active:bubbleMissing > 0 || boxesOverlap,
      pressure:Math.max(1.25, bubbleMissing > 0 ? bubbleMissing : 3.75)
    };
  }

  function angularDirection(first, second) {
    let delta = second.angle - first.angle;
    while (delta <= -Math.PI) delta += Math.PI * 2;
    while (delta > Math.PI) delta -= Math.PI * 2;
    return Math.sign(delta) || (first.index <= second.index ? 1 : -1);
  }

  function solve(items) {
    for (let pass = 0; pass < ITERATIONS; pass += 1) {
      let changed = false;
      for (let left = 0; left < items.length; left += 1) {
        for (let right = left + 1; right < items.length; right += 1) {
          const first = items[left];
          const second = items[right];
          const contact = collision(first, second);
          if (!contact.active) continue;
          const direction = angularDirection(first, second);
          const push = Math.min(6.25, contact.pressure * 0.58 + 0.5);
          first.tangential = Math.max(-MAX_TANGENTIAL_SHIFT, Math.min(MAX_TANGENTIAL_SHIFT, first.tangential - direction * push / 2));
          second.tangential = Math.max(-MAX_TANGENTIAL_SHIFT, Math.min(MAX_TANGENTIAL_SHIFT, second.tangential + direction * push / 2));
          changed = true;
        }
      }
      if (!changed) break;
    }

    for (let pass = 0; pass < 10; pass += 1) {
      let changed = false;
      for (let left = 0; left < items.length; left += 1) {
        for (let right = left + 1; right < items.length; right += 1) {
          const first = items[left];
          const second = items[right];
          if (!collision(first, second).active) continue;
          const target = Math.abs(first.tangential) >= Math.abs(second.tangential) ? first : second;
          const next = Math.min(MAX_RADIAL_SHIFT, target.radial + 2.5);
          if (next !== target.radial) {
            target.radial = next;
            changed = true;
          }
        }
      }
      if (!changed) break;
    }
  }

  function rootVectorInParent(node, dx, dy, svg) {
    const parent = node.parentNode;
    const rootMatrix = svg && svg.getScreenCTM && svg.getScreenCTM();
    const parentMatrix = parent && parent.getScreenCTM && parent.getScreenCTM();
    if (!rootMatrix || !parentMatrix || typeof parentMatrix.inverse !== 'function') return { x:dx, y:dy };
    try {
      const zero = svg.createSVGPoint();
      zero.x = 0;
      zero.y = 0;
      const delta = svg.createSVGPoint();
      delta.x = dx;
      delta.y = dy;
      const parentInverse = parentMatrix.inverse();
      const localZero = zero.matrixTransform(rootMatrix).matrixTransform(parentInverse);
      const localDelta = delta.matrixTransform(rootMatrix).matrixTransform(parentInverse);
      return { x:localDelta.x - localZero.x, y:localDelta.y - localZero.y };
    } catch (_) {
      return { x:dx, y:dy };
    }
  }

  function translate(node, dx, dy, svg) {
    rememberTransform(node);
    const base = node.dataset.relphiLollipopBaseTransform;
    const local = rootVectorInParent(node, dx, dy, svg);
    const move = 'translate(' + local.x.toFixed(2) + ' ' + local.y.toFixed(2) + ')';
    node.setAttribute('transform', base === '__none__' ? move : move + ' ' + base);
  }

  function setLeaderEndpoint(line, suffix, point, svg) {
    const local = pointInNode(line, point, svg);
    line.setAttribute('x' + suffix, local.x.toFixed(2));
    line.setAttribute('y' + suffix, local.y.toFixed(2));
  }

  function connectLeader(item, center) {
    const vector = { x:center.x - item.anchor.x, y:center.y - item.anchor.y };
    const length = Math.hypot(vector.x, vector.y) || 1;
    const edge = {
      x:center.x - vector.x / length * (item.radius + 0.8),
      y:center.y - vector.y / length * (item.radius + 0.8)
    };
    rememberLeader(item.line);
    if (item.anchor.suffix === '1') {
      setLeaderEndpoint(item.line, '1', item.anchor, item.svg);
      setLeaderEndpoint(item.line, '2', edge, item.svg);
    } else {
      setLeaderEndpoint(item.line, '2', item.anchor, item.svg);
      setLeaderEndpoint(item.line, '1', edge, item.svg);
    }
  }

  function apply(items) {
    items.forEach(function (item) {
      const shift = offset(item);
      if (Math.hypot(shift.x, shift.y) < 0.25) return;
      item.nodes.forEach(function (node) { translate(node, shift.x, shift.y, item.svg); });
      connectLeader(item, centerAt(item));
      item.group.dataset.relphiLollipopShift = Math.hypot(shift.x, shift.y).toFixed(2);
      item.group.dataset.relphiLollipopRadialShift = item.radial.toFixed(2);
    });
  }

  function residual(items) {
    let count = 0;
    for (let left = 0; left < items.length; left += 1) {
      for (let right = left + 1; right < items.length; right += 1) {
        if (collision(items[left], items[right]).active) count += 1;
      }
    }
    return count;
  }

  function arrange(svg) {
    restore(svg);
    const items = collect(svg);
    if (items.length < 2) return;
    solve(items);
    apply(items);
    svg.dataset.relphiWheelCollisionResidual = String(residual(items));
  }

  function run() {
    queued = false;
    if (running) return;
    running = true;
    try {
      document.querySelectorAll(WHEEL_SELECTOR).forEach(arrange);
    } finally {
      running = false;
    }
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { requestAnimationFrame(run); });
  }

  function install() {
    schedule();
    [120, 360, 900, 1800].forEach(function (delay) { setTimeout(schedule, delay); });
    window.addEventListener('resize', schedule, { passive:true });
    window.addEventListener('relphi:sky-builder-v4-loaded', schedule);
    window.addEventListener('relphi:canonical-sky-glyphs-ready', schedule);
    const root = document.getElementById('chartPanel') || document.body;
    new MutationObserver(function (records) {
      if (running) return;
      const relevant = records.some(function (record) {
        return Array.from(record.addedNodes || []).some(function (node) {
          return node.nodeType === Node.ELEMENT_NODE &&
            (node.namespaceURI === SVG_NS || node.matches?.(PLACEMENT) || node.querySelector?.(PLACEMENT));
        });
      });
      if (relevant) schedule();
    }).observe(root, { childList:true, subtree:true });
  }

  window.RelphiWheelCollision = { arrange:arrange, schedule:schedule };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
