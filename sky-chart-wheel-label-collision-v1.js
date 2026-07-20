// Separates only crowded Sky Chart lollipop bubbles while preserving exact wheel anchors.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const PLACEMENT_SELECTOR = '.chart-wheel-placement';
  const DISC_SELECTOR = 'circle.chart-wheel-marker-disc';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const BUBBLE_GAP = 4;
  const MAX_ARC_SHIFT = 42;
  const ITERATIONS = 28;
  let queued = false;
  let running = false;

  function numeric(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function viewBox(svg) {
    const box = svg.viewBox && svg.viewBox.baseVal;
    if (box && box.width > 0 && box.height > 0) {
      return { x:box.x, y:box.y, width:box.width, height:box.height };
    }
    const width = numeric(svg.getAttribute('width')) || svg.clientWidth || 800;
    const height = numeric(svg.getAttribute('height')) || svg.clientHeight || 800;
    return { x:0, y:0, width:width, height:height };
  }

  function distance(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  function normalizeAngle(value) {
    let angle = value;
    while (angle <= -Math.PI) angle += Math.PI * 2;
    while (angle > Math.PI) angle -= Math.PI * 2;
    return angle;
  }

  function endpoint(line, suffix) {
    return {
      x:numeric(line.getAttribute('x' + suffix)),
      y:numeric(line.getAttribute('y' + suffix)),
      suffix:suffix
    };
  }

  function validPoint(point) {
    return point && Number.isFinite(point.x) && Number.isFinite(point.y);
  }

  function restore(svg) {
    svg.querySelectorAll('[data-relphi-exact-base-transform]').forEach(function (node) {
      const base = node.dataset.relphiExactBaseTransform;
      if (base === '__none__') node.removeAttribute('transform');
      else node.setAttribute('transform', base);
      delete node.dataset.relphiExactBaseTransform;
      delete node.dataset.relphiExactDx;
      delete node.dataset.relphiExactDy;
    });

    svg.querySelectorAll('line[data-relphi-exact-leader]').forEach(function (line) {
      ['x1','y1','x2','y2'].forEach(function (name) {
        const key = 'relphiExact' + name.toUpperCase();
        if (line.dataset[key] != null) line.setAttribute(name, line.dataset[key]);
        delete line.dataset[key];
      });
      delete line.dataset.relphiExactLeader;
    });

    svg.querySelectorAll(PLACEMENT_SELECTOR).forEach(function (group) {
      delete group.dataset.relphiExactShift;
      delete group.dataset.relphiExactAngleShift;
    });
    delete svg.dataset.relphiWheelCollisionResidual;
  }

  function leaderFor(group, discCenter, discRadius, wheelCenter) {
    const preferred = group.querySelector(
      'line.chart-wheel-marker-leader, line.chart-wheel-leader, line[class*="leader"], line[class*="stem"]'
    );
    const lines = preferred ? [preferred] : Array.from(group.querySelectorAll('line'));
    let best = null;

    lines.forEach(function (line) {
      const one = endpoint(line, '1');
      const two = endpoint(line, '2');
      if (!validPoint(one) || !validPoint(two)) return;

      const oneDistance = distance(one, discCenter);
      const twoDistance = distance(two, discCenter);
      const outer = oneDistance <= twoDistance ? one : two;
      const anchor = outer === one ? two : one;
      const outerDistance = Math.min(oneDistance, twoDistance);
      const anchorRadius = distance(anchor, wheelCenter);
      const discDistance = distance(discCenter, wheelCenter);
      const length = distance(one, two);

      if (outerDistance > discRadius + 12) return;
      if (anchorRadius >= discDistance - 8) return;
      if (length < discRadius * 1.5) return;

      const score = outerDistance + Math.abs(discDistance - anchorRadius - length) * 0.01;
      if (!best || score < best.score) {
        best = { line:line, outer:outer, anchor:anchor, score:score };
      }
    });

    return best;
  }

  function movableNodes(group, disc, discCenter) {
    const candidates = [disc]
      .concat(Array.from(group.querySelectorAll('text, image, .relphi-wheel-planet-glyph')))
      .concat(Array.from(group.querySelectorAll('circle')).filter(function (circle) {
        if (circle === disc) return false;
        const center = { x:numeric(circle.getAttribute('cx')), y:numeric(circle.getAttribute('cy')) };
        return validPoint(center) && distance(center, discCenter) <= 3;
      }));

    const unique = Array.from(new Set(candidates.filter(Boolean)));
    return unique.filter(function (node) {
      return !unique.some(function (possibleParent) {
        return possibleParent !== node && possibleParent.contains && possibleParent.contains(node);
      });
    });
  }

  function collect(svg, box) {
    const wheelCenter = { x:box.x + box.width / 2, y:box.y + box.height / 2 };
    return Array.from(svg.querySelectorAll(PLACEMENT_SELECTOR)).map(function (group, index) {
      const disc = group.querySelector(DISC_SELECTOR);
      if (!disc) return null;

      const center = {
        x:numeric(disc.getAttribute('cx')),
        y:numeric(disc.getAttribute('cy'))
      };
      const radius = numeric(disc.getAttribute('r'));
      if (!validPoint(center) || !Number.isFinite(radius) || radius <= 0) return null;

      const radialDistance = distance(center, wheelCenter);
      if (radialDistance < Math.min(box.width, box.height) * 0.3) return null;

      const leader = leaderFor(group, center, radius, wheelCenter);
      if (!leader) return null;

      return {
        index:index,
        group:group,
        disc:disc,
        nodes:movableNodes(group, disc, center),
        line:leader.line,
        anchor:leader.anchor,
        center:center,
        radius:radius,
        radialDistance:radialDistance,
        angle:Math.atan2(center.y - wheelCenter.y, center.x - wheelCenter.x),
        angleShift:0,
        maxAngleShift:MAX_ARC_SHIFT / radialDistance,
        wheelCenter:wheelCenter
      };
    }).filter(function (item) {
      return item && item.nodes.length > 0;
    });
  }

  function position(item) {
    const angle = item.angle + item.angleShift;
    return {
      x:item.wheelCenter.x + item.radialDistance * Math.cos(angle),
      y:item.wheelCenter.y + item.radialDistance * Math.sin(angle)
    };
  }

  function clampShift(item) {
    item.angleShift = Math.max(-item.maxAngleShift, Math.min(item.maxAngleShift, item.angleShift));
  }

  function separate(items) {
    for (let iteration = 0; iteration < ITERATIONS; iteration += 1) {
      let changed = false;

      for (let left = 0; left < items.length; left += 1) {
        for (let right = left + 1; right < items.length; right += 1) {
          const first = items[left];
          const second = items[right];
          const firstPosition = position(first);
          const secondPosition = position(second);
          const actual = distance(firstPosition, secondPosition);
          const required = first.radius + second.radius + BUBBLE_GAP;
          if (actual >= required - 0.15) continue;

          let signedDifference = normalizeAngle(
            (second.angle + second.angleShift) - (first.angle + first.angleShift)
          );
          let direction = Math.sign(signedDifference);
          if (!direction) direction = first.index <= second.index ? 1 : -1;

          const averageRadius = Math.max(1, (first.radialDistance + second.radialDistance) / 2);
          const angularPush = ((required - actual) / averageRadius) * 0.62 + 0.00035;
          first.angleShift -= direction * angularPush / 2;
          second.angleShift += direction * angularPush / 2;
          clampShift(first);
          clampShift(second);
          changed = true;
        }
      }

      if (!changed) break;
    }
  }

  function rememberTransform(node) {
    if (node.dataset.relphiExactBaseTransform != null) return;
    node.dataset.relphiExactBaseTransform = node.getAttribute('transform') || '__none__';
  }

  function translate(node, dx, dy) {
    rememberTransform(node);
    const base = node.dataset.relphiExactBaseTransform;
    const shift = 'translate(' + dx.toFixed(2) + ' ' + dy.toFixed(2) + ')';
    node.setAttribute('transform', base === '__none__' ? shift : base + ' ' + shift);
    node.dataset.relphiExactDx = dx.toFixed(2);
    node.dataset.relphiExactDy = dy.toFixed(2);
  }

  function rememberLeader(line) {
    if (line.dataset.relphiExactLeader) return;
    line.dataset.relphiExactLeader = 'true';
    ['x1','y1','x2','y2'].forEach(function (name) {
      line.dataset['relphiExact' + name.toUpperCase()] = line.getAttribute(name) || '0';
    });
  }

  function connectLeader(item, newCenter) {
    const vector = {
      x:newCenter.x - item.anchor.x,
      y:newCenter.y - item.anchor.y
    };
    const length = Math.hypot(vector.x, vector.y) || 1;
    const outer = {
      x:newCenter.x - vector.x / length * (item.radius + 0.75),
      y:newCenter.y - vector.y / length * (item.radius + 0.75)
    };

    rememberLeader(item.line);
    if (item.anchor.suffix === '1') {
      item.line.setAttribute('x1', item.anchor.x.toFixed(2));
      item.line.setAttribute('y1', item.anchor.y.toFixed(2));
      item.line.setAttribute('x2', outer.x.toFixed(2));
      item.line.setAttribute('y2', outer.y.toFixed(2));
    } else {
      item.line.setAttribute('x2', item.anchor.x.toFixed(2));
      item.line.setAttribute('y2', item.anchor.y.toFixed(2));
      item.line.setAttribute('x1', outer.x.toFixed(2));
      item.line.setAttribute('y1', outer.y.toFixed(2));
    }
  }

  function apply(items) {
    items.forEach(function (item) {
      if (Math.abs(item.angleShift) < 0.0001) return;
      const next = position(item);
      const dx = next.x - item.center.x;
      const dy = next.y - item.center.y;
      item.nodes.forEach(function (node) { translate(node, dx, dy); });
      connectLeader(item, next);
      item.group.dataset.relphiExactShift = Math.hypot(dx, dy).toFixed(2);
      item.group.dataset.relphiExactAngleShift = (item.angleShift * 180 / Math.PI).toFixed(3);
    });
  }

  function residualOverlap(items) {
    let residual = 0;
    for (let left = 0; left < items.length; left += 1) {
      for (let right = left + 1; right < items.length; right += 1) {
        const actual = distance(position(items[left]), position(items[right]));
        const required = items[left].radius + items[right].radius + BUBBLE_GAP;
        if (actual < required - 0.5) residual += 1;
      }
    }
    return residual;
  }

  function arrange(svg) {
    restore(svg);
    const items = collect(svg, viewBox(svg));
    if (items.length < 2) return;
    separate(items);
    apply(items);
    svg.dataset.relphiWheelCollisionResidual = String(residualOverlap(items));
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
            (node.namespaceURI === SVG_NS || node.matches?.(PLACEMENT_SELECTOR) || node.querySelector?.(PLACEMENT_SELECTOR));
        });
      });
      if (relevant) schedule();
    }).observe(root, { childList:true, subtree:true });
  }

  window.RelphiWheelCollision = { arrange:arrange, schedule:schedule };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
