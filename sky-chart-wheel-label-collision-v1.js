// Separates the live Sky Chart lollipops as complete placement units.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const PLACEMENT = '.chart-wheel-placement-stick';
  const KNOB = 'circle.chart-wheel-stick-knob';
  const LEADER = 'line.chart-wheel-stick';
  const MOVABLE = [
    'circle.chart-wheel-stick-knob',
    '.chart-wheel-marker-glyph',
    '.chart-wheel-marker-degree',
    '.chart-wheel-marker-name',
    'image.standardized-planet-glyph',
    'image.relphi-bubble-glyph-image'
  ].join(',');
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const BUBBLE_GAP = 5.5;
  const BOX_GAP = 2.5;
  const MAX_TANGENTIAL_SHIFT = 58;
  const MAX_RADIAL_SHIFT = 20;
  const ITERATIONS = 42;
  let queued = false;
  let running = false;

  function num(value) {
    const result = Number(value);
    return Number.isFinite(result) ? result : NaN;
  }

  function pointDistance(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  function viewBox(svg) {
    const box = svg.viewBox && svg.viewBox.baseVal;
    if (box && box.width > 0 && box.height > 0) return { x:box.x, y:box.y, width:box.width, height:box.height };
    return {
      x:0,
      y:0,
      width:num(svg.getAttribute('width')) || svg.clientWidth || 800,
      height:num(svg.getAttribute('height')) || svg.clientHeight || 800
    };
  }

  function endpoint(line, suffix) {
    return { x:num(line.getAttribute('x' + suffix)), y:num(line.getAttribute('y' + suffix)), suffix:suffix };
  }

  function validPoint(point) {
    return point && Number.isFinite(point.x) && Number.isFinite(point.y);
  }

  function rememberTransform(node) {
    if (node.dataset.relphiLollipopBaseTransform != null) return;
    node.dataset.relphiLollipopBaseTransform = node.getAttribute('transform') || '__none__';
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

  function nodeBox(node) {
    try {
      const box = node.getBBox();
      if (![box.x, box.y, box.width, box.height].every(Number.isFinite)) return null;
      return { x:box.x, y:box.y, width:box.width, height:box.height };
    } catch (_) {
      return null;
    }
  }

  function leaderGeometry(line, center, wheelCenter, radius) {
    if (!line) return null;
    const one = endpoint(line, '1');
    const two = endpoint(line, '2');
    if (!validPoint(one) || !validPoint(two)) return null;
    const oneToKnob = pointDistance(one, center);
    const twoToKnob = pointDistance(two, center);
    const outer = oneToKnob <= twoToKnob ? one : two;
    const anchor = outer === one ? two : one;
    if (Math.min(oneToKnob, twoToKnob) > radius + 12) return null;
    if (pointDistance(anchor, wheelCenter) >= pointDistance(center, wheelCenter) - 6) return null;
    return { line:line, anchor:anchor };
  }

  function collect(svg) {
    const box = viewBox(svg);
    const wheelCenter = { x:box.x + box.width / 2, y:box.y + box.height / 2 };
    return Array.from(svg.querySelectorAll(PLACEMENT)).map(function (group, index) {
      const knob = group.querySelector(KNOB);
      const line = group.querySelector(LEADER);
      if (!knob || !line) return null;
      const center = { x:num(knob.getAttribute('cx')), y:num(knob.getAttribute('cy')) };
      const radius = num(knob.getAttribute('r'));
      if (!validPoint(center) || !Number.isFinite(radius) || radius <= 0) return null;
      const leader = leaderGeometry(line, center, wheelCenter, radius);
      if (!leader) return null;
      const nodes = Array.from(group.querySelectorAll(MOVABLE));
      if (!nodes.includes(knob)) nodes.unshift(knob);
      const boxes = nodes.map(nodeBox).filter(Boolean);
      const radialDistance = pointDistance(wheelCenter, center);
      if (!boxes.length || radialDistance < Math.min(box.width, box.height) * 0.3) return null;
      const angle = Math.atan2(center.y - wheelCenter.y, center.x - wheelCenter.x);
      return {
        index:index,
        group:group,
        knob:knob,
        line:line,
        anchor:leader.anchor,
        nodes:Array.from(new Set(nodes)),
        boxes:boxes,
        center:center,
        radius:radius,
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
    const bubbleMissing = first.radius + second.radius + BUBBLE_GAP - pointDistance(a, b);
    const boxesOverlap = footprintOverlap(first, second);
    return {
      active:bubbleMissing > 0 || boxesOverlap,
      pressure:Math.max(1.2, bubbleMissing > 0 ? bubbleMissing : 3.5)
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
          const push = Math.min(5.5, contact.pressure * 0.58 + 0.45);
          first.tangential = Math.max(-MAX_TANGENTIAL_SHIFT, Math.min(MAX_TANGENTIAL_SHIFT, first.tangential - direction * push / 2));
          second.tangential = Math.max(-MAX_TANGENTIAL_SHIFT, Math.min(MAX_TANGENTIAL_SHIFT, second.tangential + direction * push / 2));
          changed = true;
        }
      }
      if (!changed) break;
    }

    // Radial movement is a small last resort only when tangential movement is exhausted.
    for (let pass = 0; pass < 8; pass += 1) {
      let changed = false;
      for (let left = 0; left < items.length; left += 1) {
        for (let right = left + 1; right < items.length; right += 1) {
          const first = items[left];
          const second = items[right];
          if (!collision(first, second).active) continue;
          const target = Math.abs(first.tangential) >= Math.abs(second.tangential) ? first : second;
          const next = Math.min(MAX_RADIAL_SHIFT, target.radial + 2.25);
          if (next !== target.radial) {
            target.radial = next;
            changed = true;
          }
        }
      }
      if (!changed) break;
    }
  }

  function translate(node, dx, dy) {
    rememberTransform(node);
    const base = node.dataset.relphiLollipopBaseTransform;
    const move = 'translate(' + dx.toFixed(2) + ' ' + dy.toFixed(2) + ')';
    node.setAttribute('transform', base === '__none__' ? move : base + ' ' + move);
  }

  function rememberLeader(line) {
    if (line.dataset.relphiLollipopLeader) return;
    line.dataset.relphiLollipopLeader = 'true';
    ['x1','y1','x2','y2'].forEach(function (name) {
      line.dataset['relphiLollipop' + name.toUpperCase()] = line.getAttribute(name) || '0';
    });
  }

  function connectLeader(item, center) {
    const vector = { x:center.x - item.anchor.x, y:center.y - item.anchor.y };
    const length = Math.hypot(vector.x, vector.y) || 1;
    const edge = {
      x:center.x - vector.x / length * (item.radius + 0.6),
      y:center.y - vector.y / length * (item.radius + 0.6)
    };
    rememberLeader(item.line);
    if (item.anchor.suffix === '1') {
      item.line.setAttribute('x1', item.anchor.x.toFixed(2));
      item.line.setAttribute('y1', item.anchor.y.toFixed(2));
      item.line.setAttribute('x2', edge.x.toFixed(2));
      item.line.setAttribute('y2', edge.y.toFixed(2));
    } else {
      item.line.setAttribute('x2', item.anchor.x.toFixed(2));
      item.line.setAttribute('y2', item.anchor.y.toFixed(2));
      item.line.setAttribute('x1', edge.x.toFixed(2));
      item.line.setAttribute('y1', edge.y.toFixed(2));
    }
  }

  function apply(items) {
    items.forEach(function (item) {
      const shift = offset(item);
      if (Math.hypot(shift.x, shift.y) < 0.25) return;
      item.nodes.forEach(function (node) { translate(node, shift.x, shift.y); });
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
      document.querySelectorAll('#chartOutput svg, #currentSkyOutput svg, #tarot-chart svg, .sky-output-box svg').forEach(arrange);
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
