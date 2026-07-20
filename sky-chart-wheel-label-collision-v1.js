// Makes only local, tangential corrections to crowded outer-wheel glyph bubbles.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const BODY_LABEL = /(?:\b(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Node|Lilith|Chiron|Fortune|Vertex|Ascendant|Rising|Midheaven|ASC|MC)\b|[☉☽☿♀♂♃♄♅♆♇⯓⚸⚷])/i;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const MIN_BUBBLE_RADIUS = 8;
  const MAX_BUBBLE_RADIUS = 24;
  const BUBBLE_GAP = 5;
  const MAX_SHIFT = 34;
  const ITERATIONS = 16;
  let queued = false;
  let running = false;

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function viewBox(svg) {
    const box = svg.viewBox && svg.viewBox.baseVal;
    if (box && box.width > 0 && box.height > 0) {
      return { x:box.x, y:box.y, width:box.width, height:box.height };
    }
    const width = number(svg.getAttribute('width')) || svg.clientWidth || 800;
    const height = number(svg.getAttribute('height')) || svg.clientHeight || 800;
    return { x:0, y:0, width:width, height:height };
  }

  function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  function restoreLegacy(svg) {
    svg.querySelectorAll('g[data-relphi-collision-base-transform]').forEach(function (group) {
      const base = group.dataset.relphiCollisionBaseTransform;
      if (base === '__none__') group.removeAttribute('transform');
      else if (base != null) group.setAttribute('transform', base);
      delete group.dataset.relphiCollisionBaseTransform;
      delete group.dataset.relphiCollisionDx;
      delete group.dataset.relphiCollisionDy;
      delete group.dataset.relphiLabelCollision;
    });

    svg.querySelectorAll('line[data-relphi-collision-line]').forEach(function (line) {
      ['x1','y1','x2','y2'].forEach(function (name) {
        const stored = line.dataset['relphiCollision' + name.toUpperCase()];
        if (stored != null) line.setAttribute(name, stored);
        delete line.dataset['relphiCollision' + name.toUpperCase()];
      });
      delete line.dataset.relphiCollisionLine;
    });

    svg.querySelectorAll('circle[data-relphi-collision-anchor]').forEach(function (circle) {
      if (circle.dataset.relphiCollisionCx != null) circle.setAttribute('cx', circle.dataset.relphiCollisionCx);
      if (circle.dataset.relphiCollisionCy != null) circle.setAttribute('cy', circle.dataset.relphiCollisionCy);
      delete circle.dataset.relphiCollisionCx;
      delete circle.dataset.relphiCollisionCy;
      delete circle.dataset.relphiCollisionAnchor;
    });
  }

  function restoreLocal(svg) {
    svg.querySelectorAll('[data-relphi-bubble-base-transform]').forEach(function (node) {
      const base = node.dataset.relphiBubbleBaseTransform;
      if (base === '__none__') node.removeAttribute('transform');
      else node.setAttribute('transform', base);
      delete node.dataset.relphiBubbleBaseTransform;
      delete node.dataset.relphiBubbleDx;
      delete node.dataset.relphiBubbleDy;
    });

    svg.querySelectorAll('line[data-relphi-bubble-leader]').forEach(function (line) {
      ['x1','y1','x2','y2'].forEach(function (name) {
        const key = 'relphiBubble' + name.toUpperCase();
        if (line.dataset[key] != null) line.setAttribute(name, line.dataset[key]);
        delete line.dataset[key];
      });
      delete line.dataset.relphiBubbleLeader;
    });
  }

  function endpoint(line, name) {
    return {
      x:number(line.getAttribute('x' + name)),
      y:number(line.getAttribute('y' + name)),
      name:name
    };
  }

  function bubbleCandidates(group) {
    return Array.from(group.querySelectorAll('circle')).filter(function (circle) {
      const radius = number(circle.getAttribute('r'));
      return radius >= MIN_BUBBLE_RADIUS && radius <= MAX_BUBBLE_RADIUS;
    });
  }

  function analyzeGroup(group, box) {
    if (!BODY_LABEL.test(group.textContent || '')) return null;
    const bubbles = bubbleCandidates(group);
    const lines = Array.from(group.querySelectorAll('line'));
    if (!bubbles.length || !lines.length || !group.querySelector('text')) return null;

    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const minimumOuterRadius = Math.min(box.width, box.height) * 0.31;
    let best = null;

    bubbles.forEach(function (bubble) {
      const bubbleX = number(bubble.getAttribute('cx'));
      const bubbleY = number(bubble.getAttribute('cy'));
      const radius = number(bubble.getAttribute('r'));
      const bubbleDistance = distance(cx, cy, bubbleX, bubbleY);
      if (bubbleDistance < minimumOuterRadius) return;

      lines.forEach(function (line) {
        const one = endpoint(line, '1');
        const two = endpoint(line, '2');
        const oneToBubble = distance(one.x, one.y, bubbleX, bubbleY);
        const twoToBubble = distance(two.x, two.y, bubbleX, bubbleY);
        const outer = oneToBubble <= twoToBubble ? one : two;
        const inner = outer === one ? two : one;
        const outerToBubble = Math.min(oneToBubble, twoToBubble);
        const innerRadius = distance(cx, cy, inner.x, inner.y);
        const lineLength = distance(one.x, one.y, two.x, two.y);

        if (outerToBubble > radius + 10) return;
        if (innerRadius >= bubbleDistance - 12 || lineLength < 24) return;

        const score = outerToBubble + Math.abs((bubbleDistance - innerRadius) - lineLength) * 0.02;
        if (!best || score < best.score) {
          best = {
            group:group,
            bubble:bubble,
            bubbleX:bubbleX,
            bubbleY:bubbleY,
            radius:radius,
            line:line,
            outer:outer,
            inner:inner,
            score:score
          };
        }
      });
    });

    return best;
  }

  function markerGroups(svg, box) {
    const analyzed = Array.from(svg.querySelectorAll('g')).map(function (group) {
      return analyzeGroup(group, box);
    }).filter(Boolean);

    return analyzed.filter(function (item) {
      return !analyzed.some(function (other) {
        return other !== item && item.group.contains(other.group);
      });
    });
  }

  function nodeCenter(node) {
    let bounds;
    try { bounds = node.getBBox(); }
    catch (_) { return null; }
    if (!bounds || !Number.isFinite(bounds.x) || !Number.isFinite(bounds.y)) return null;
    return { x:bounds.x + bounds.width / 2, y:bounds.y + bounds.height / 2 };
  }

  function movableNodes(item) {
    const nodes = [];
    Array.from(item.group.querySelectorAll('circle')).forEach(function (circle) {
      const x = number(circle.getAttribute('cx'));
      const y = number(circle.getAttribute('cy'));
      if (distance(x, y, item.bubbleX, item.bubbleY) <= 4) nodes.push(circle);
    });

    Array.from(item.group.querySelectorAll('text')).forEach(function (text) {
      const center = nodeCenter(text);
      if (!center) return;
      const toBubble = distance(center.x, center.y, item.bubbleX, item.bubbleY);
      const toAnchor = distance(center.x, center.y, item.inner.x, item.inner.y);
      if (toBubble <= 92 && toBubble < toAnchor) nodes.push(text);
    });

    return Array.from(new Set(nodes));
  }

  function makeItems(svg, box) {
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    return markerGroups(svg, box).map(function (item, index) {
      const angle = Math.atan2(item.bubbleY - cy, item.bubbleX - cx);
      item.index = index;
      item.angle = angle;
      item.tangentX = -Math.sin(angle);
      item.tangentY = Math.cos(angle);
      item.offset = 0;
      item.nodes = movableNodes(item);
      return item;
    }).filter(function (item) {
      return item.nodes.length > 0;
    });
  }

  function position(item) {
    return {
      x:item.bubbleX + item.tangentX * item.offset,
      y:item.bubbleY + item.tangentY * item.offset
    };
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function relax(items, box) {
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    for (let iteration = 0; iteration < ITERATIONS; iteration += 1) {
      let changed = false;
      for (let left = 0; left < items.length; left += 1) {
        for (let right = left + 1; right < items.length; right += 1) {
          const first = items[left];
          const second = items[right];
          const firstPosition = position(first);
          const secondPosition = position(second);
          const actual = distance(firstPosition.x, firstPosition.y, secondPosition.x, secondPosition.y);
          const required = first.radius + second.radius + BUBBLE_GAP;
          if (actual >= required - 0.25) continue;

          const meanX = (firstPosition.x + secondPosition.x) / 2;
          const meanY = (firstPosition.y + secondPosition.y) / 2;
          const meanAngle = Math.atan2(meanY - cy, meanX - cx);
          const tangentX = -Math.sin(meanAngle);
          const tangentY = Math.cos(meanAngle);
          const projectedOrder = (secondPosition.x - firstPosition.x) * tangentX + (secondPosition.y - firstPosition.y) * tangentY;
          const direction = Math.abs(projectedOrder) > 0.01
            ? Math.sign(projectedOrder)
            : (first.angle <= second.angle ? 1 : -1);
          const push = (required - actual) * 0.56 + 0.2;

          first.offset = clamp(first.offset - direction * push / 2, -MAX_SHIFT, MAX_SHIFT);
          second.offset = clamp(second.offset + direction * push / 2, -MAX_SHIFT, MAX_SHIFT);
          changed = true;
        }
      }
      if (!changed) break;
    }
  }

  function shiftNode(node, dx, dy) {
    if (!node.dataset.relphiBubbleBaseTransform) {
      node.dataset.relphiBubbleBaseTransform = node.getAttribute('transform') || '__none__';
    }
    const base = node.dataset.relphiBubbleBaseTransform;
    const shift = 'translate(' + dx.toFixed(2) + ' ' + dy.toFixed(2) + ')';
    node.setAttribute('transform', base === '__none__' ? shift : base + ' ' + shift);
    node.dataset.relphiBubbleDx = String(dx);
    node.dataset.relphiBubbleDy = String(dy);
  }

  function rememberLeader(line) {
    if (line.dataset.relphiBubbleLeader) return;
    line.dataset.relphiBubbleLeader = 'true';
    ['x1','y1','x2','y2'].forEach(function (name) {
      line.dataset['relphiBubble' + name.toUpperCase()] = line.getAttribute(name) || '0';
    });
  }

  function setLeader(item, bubbleX, bubbleY) {
    const line = item.line;
    rememberLeader(line);
    const vectorX = bubbleX - item.inner.x;
    const vectorY = bubbleY - item.inner.y;
    const length = Math.hypot(vectorX, vectorY) || 1;
    const edgeX = bubbleX - vectorX / length * (item.radius + 0.75);
    const edgeY = bubbleY - vectorY / length * (item.radius + 0.75);

    if (item.inner.name === '1') {
      line.setAttribute('x1', String(item.inner.x));
      line.setAttribute('y1', String(item.inner.y));
      line.setAttribute('x2', edgeX.toFixed(2));
      line.setAttribute('y2', edgeY.toFixed(2));
    } else {
      line.setAttribute('x2', String(item.inner.x));
      line.setAttribute('y2', String(item.inner.y));
      line.setAttribute('x1', edgeX.toFixed(2));
      line.setAttribute('y1', edgeY.toFixed(2));
    }
  }

  function apply(items) {
    items.forEach(function (item) {
      if (Math.abs(item.offset) < 0.35) return;
      const dx = item.tangentX * item.offset;
      const dy = item.tangentY * item.offset;
      item.nodes.forEach(function (node) { shiftNode(node, dx, dy); });
      setLeader(item, item.bubbleX + dx, item.bubbleY + dy);
      item.group.dataset.relphiBubbleCollision = 'true';
    });
  }

  function arrange(svg) {
    restoreLegacy(svg);
    restoreLocal(svg);
    const box = viewBox(svg);
    const items = makeItems(svg, box);
    if (items.length < 2) return;
    relax(items, box);
    apply(items);
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
    [180, 600, 1500].forEach(function (delay) { setTimeout(schedule, delay); });
    window.addEventListener('resize', schedule, { passive:true });
    window.addEventListener('relphi:sky-builder-v4-loaded', schedule);
    const root = document.getElementById('chartPanel') || document.body;
    new MutationObserver(function (records) {
      if (running) return;
      const relevant = records.some(function (record) {
        return record.type === 'characterData' || Array.from(record.addedNodes || []).some(function (node) {
          return node.nodeType === Node.ELEMENT_NODE && (node.namespaceURI === SVG_NS || node.querySelector?.('svg'));
        });
      });
      if (relevant) schedule();
    }).observe(root, { childList:true, subtree:true, characterData:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();