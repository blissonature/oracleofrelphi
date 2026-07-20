// Separates crowded outer-wheel placement labels while preserving their wheel anchors.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const BODY_LABEL = /(?:\b(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Node|Lilith|Chiron|Fortune|Vertex|Ascendant|Rising|Midheaven|ASC|MC)\b|[☉☽☿♀♂♃♄♅♆♇⯓⚸⚷])/i;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const GAP = 8;
  const EDGE = 18;
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

  function pointDistance(x, y, cx, cy) {
    return Math.hypot(x - cx, y - cy);
  }

  function lineGeometry(line, cx, cy) {
    const x1 = number(line.getAttribute('x1'));
    const y1 = number(line.getAttribute('y1'));
    const x2 = number(line.getAttribute('x2'));
    const y2 = number(line.getAttribute('y2'));
    const d1 = pointDistance(x1, y1, cx, cy);
    const d2 = pointDistance(x2, y2, cx, cy);
    return d1 <= d2
      ? { inner:'1', innerX:x1, innerY:y1, outerX:x2, outerY:y2, outerDistance:d2 }
      : { inner:'2', innerX:x2, innerY:y2, outerX:x1, outerY:y1, outerDistance:d1 };
  }

  function restore(group) {
    if (!group.dataset.relphiCollisionBaseTransform) {
      group.dataset.relphiCollisionBaseTransform = group.getAttribute('transform') || '__none__';
    }
    const base = group.dataset.relphiCollisionBaseTransform;
    if (base === '__none__') group.removeAttribute('transform');
    else group.setAttribute('transform', base);

    group.querySelectorAll('line[data-relphi-collision-line]').forEach(function (line) {
      ['x1','y1','x2','y2'].forEach(function (name) {
        const stored = line.dataset['relphiCollision' + name.toUpperCase()];
        if (stored != null) line.setAttribute(name, stored);
      });
    });
    group.querySelectorAll('circle[data-relphi-collision-anchor]').forEach(function (circle) {
      if (circle.dataset.relphiCollisionCx != null) circle.setAttribute('cx', circle.dataset.relphiCollisionCx);
      if (circle.dataset.relphiCollisionCy != null) circle.setAttribute('cy', circle.dataset.relphiCollisionCy);
    });
    delete group.dataset.relphiCollisionDx;
    delete group.dataset.relphiCollisionDy;
  }

  function qualifyingGroup(group, cx, cy, minRadius) {
    if (!BODY_LABEL.test(group.textContent || '')) return false;
    const lines = Array.from(group.querySelectorAll('line'));
    if (!lines.length || !group.querySelector('circle') || !group.querySelector('text')) return false;
    return lines.some(function (line) {
      return lineGeometry(line, cx, cy).outerDistance > minRadius;
    });
  }

  function candidateGroups(svg, box) {
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const minRadius = Math.min(box.width, box.height) * 0.31;
    const all = Array.from(svg.querySelectorAll('g')).filter(function (group) {
      return qualifyingGroup(group, cx, cy, minRadius);
    });
    return all.filter(function (group) {
      return !all.some(function (other) {
        return other !== group && group.contains(other);
      });
    });
  }

  function labelBounds(group, geometry) {
    const candidates = Array.from(group.querySelectorAll('text, circle, rect')).filter(function (node) {
      let bounds;
      try { bounds = node.getBBox(); }
      catch (_) { return false; }
      if (!bounds || bounds.width < 0 || bounds.height < 0) return false;
      const x = bounds.x + bounds.width / 2;
      const y = bounds.y + bounds.height / 2;
      const outerDistance = pointDistance(x, y, geometry.outerX, geometry.outerY);
      const innerDistance = pointDistance(x, y, geometry.innerX, geometry.innerY);
      return outerDistance <= innerDistance;
    });
    if (!candidates.length) return null;
    let union = null;
    candidates.forEach(function (node) {
      let bounds;
      try { bounds = node.getBBox(); }
      catch (_) { return; }
      const next = {
        x:bounds.x,
        y:bounds.y,
        right:bounds.x + bounds.width,
        bottom:bounds.y + bounds.height
      };
      if (!union) union = next;
      else {
        union.x = Math.min(union.x, next.x);
        union.y = Math.min(union.y, next.y);
        union.right = Math.max(union.right, next.right);
        union.bottom = Math.max(union.bottom, next.bottom);
      }
    });
    if (!union) return null;
    return { x:union.x, y:union.y, width:union.right - union.x, height:union.bottom - union.y };
  }

  function makeItem(group, box) {
    restore(group);
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const lines = Array.from(group.querySelectorAll('line'));
    let leader = null;
    let geometry = null;
    lines.forEach(function (line) {
      const next = lineGeometry(line, cx, cy);
      if (!geometry || next.outerDistance > geometry.outerDistance) {
        leader = line;
        geometry = next;
      }
    });
    if (!leader || !geometry) return null;
    let bounds = labelBounds(group, geometry);
    if (!bounds) {
      try { bounds = group.getBBox(); }
      catch (_) { return null; }
    }
    if (!bounds || !Number.isFinite(bounds.x) || bounds.width <= 0 || bounds.height <= 0) return null;

    const x = bounds.x + bounds.width / 2;
    const y = bounds.y + bounds.height / 2;
    const dx = geometry.outerX - cx;
    const dy = geometry.outerY - cy;
    const dominantHorizontal = Math.abs(dx) >= Math.abs(dy);
    const zone = dominantHorizontal ? (dx >= 0 ? 'right' : 'left') : (dy >= 0 ? 'bottom' : 'top');

    return {
      group:group,
      leader:leader,
      geometry:geometry,
      x:x,
      y:y,
      width:bounds.width,
      height:bounds.height,
      zone:zone,
      proposedX:x,
      proposedY:y
    };
  }

  function centeredPack(items, axis, min, max) {
    if (items.length < 2) return;
    const size = axis === 'x' ? 'width' : 'height';
    const desired = axis === 'x' ? 'x' : 'y';
    const proposed = axis === 'x' ? 'proposedX' : 'proposedY';
    items.sort(function (a, b) { return a[desired] - b[desired]; });

    items[0][proposed] = Math.max(min + items[0][size] / 2, items[0][desired]);
    for (let index = 1; index < items.length; index += 1) {
      const previous = items[index - 1];
      const item = items[index];
      const separation = previous[size] / 2 + item[size] / 2 + GAP;
      item[proposed] = Math.max(item[desired], previous[proposed] + separation);
    }

    const desiredMean = items.reduce(function (sum, item) { return sum + item[desired]; }, 0) / items.length;
    const packedMean = items.reduce(function (sum, item) { return sum + item[proposed]; }, 0) / items.length;
    const recenter = desiredMean - packedMean;
    items.forEach(function (item) { item[proposed] += recenter; });

    const first = items[0];
    const last = items[items.length - 1];
    const lowerOverflow = min - (first[proposed] - first[size] / 2);
    if (lowerOverflow > 0) items.forEach(function (item) { item[proposed] += lowerOverflow; });
    const upperOverflow = (last[proposed] + last[size] / 2) - max;
    if (upperOverflow > 0) items.forEach(function (item) { item[proposed] -= upperOverflow; });

    for (let index = items.length - 2; index >= 0; index -= 1) {
      const item = items[index];
      const next = items[index + 1];
      const separation = item[size] / 2 + next[size] / 2 + GAP;
      item[proposed] = Math.min(item[proposed], next[proposed] - separation);
    }
    const finalOverflow = min - (items[0][proposed] - items[0][size] / 2);
    if (finalOverflow > 0) items.forEach(function (item) { item[proposed] += finalOverflow; });
  }

  function storeLine(line) {
    if (line.dataset.relphiCollisionLine) return;
    line.dataset.relphiCollisionLine = 'true';
    ['x1','y1','x2','y2'].forEach(function (name) {
      line.dataset['relphiCollision' + name.toUpperCase()] = line.getAttribute(name) || '0';
    });
  }

  function anchorCircle(group, geometry, cx, cy) {
    const circles = Array.from(group.querySelectorAll('circle'));
    if (!circles.length) return null;
    const nearest = circles.reduce(function (best, circle) {
      const x = number(circle.getAttribute('cx'));
      const y = number(circle.getAttribute('cy'));
      const distance = pointDistance(x, y, geometry.innerX, geometry.innerY);
      const centerDistance = pointDistance(x, y, cx, cy);
      if (!best || distance < best.distance) return { circle:circle, distance:distance, centerDistance:centerDistance };
      return best;
    }, null);
    if (!nearest || nearest.distance > 14 || nearest.centerDistance >= geometry.outerDistance - 12) return null;
    return nearest.circle;
  }

  function apply(item, box) {
    const dx = item.proposedX - item.x;
    const dy = item.proposedY - item.y;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

    const group = item.group;
    const base = group.dataset.relphiCollisionBaseTransform;
    const translate = 'translate(' + dx.toFixed(2) + ' ' + dy.toFixed(2) + ')';
    group.setAttribute('transform', base === '__none__' ? translate : base + ' ' + translate);
    group.dataset.relphiCollisionDx = String(dx);
    group.dataset.relphiCollisionDy = String(dy);
    group.dataset.relphiLabelCollision = 'true';

    storeLine(item.leader);
    if (item.geometry.inner === '1') {
      item.leader.setAttribute('x1', String(item.geometry.innerX - dx));
      item.leader.setAttribute('y1', String(item.geometry.innerY - dy));
    } else {
      item.leader.setAttribute('x2', String(item.geometry.innerX - dx));
      item.leader.setAttribute('y2', String(item.geometry.innerY - dy));
    }

    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const anchor = anchorCircle(group, item.geometry, cx, cy);
    if (anchor) {
      if (!anchor.dataset.relphiCollisionAnchor) {
        anchor.dataset.relphiCollisionAnchor = 'true';
        anchor.dataset.relphiCollisionCx = anchor.getAttribute('cx') || '0';
        anchor.dataset.relphiCollisionCy = anchor.getAttribute('cy') || '0';
      }
      anchor.setAttribute('cx', String(number(anchor.dataset.relphiCollisionCx) - dx));
      anchor.setAttribute('cy', String(number(anchor.dataset.relphiCollisionCy) - dy));
    }
  }

  function arrange(svg) {
    const box = viewBox(svg);
    const groups = candidateGroups(svg, box);
    if (groups.length < 2) return;
    const items = groups.map(function (group) { return makeItem(group, box); }).filter(Boolean);
    if (items.length < 2) return;

    const zones = { left:[], right:[], top:[], bottom:[] };
    items.forEach(function (item) { zones[item.zone].push(item); });
    centeredPack(zones.left, 'y', box.y + EDGE, box.y + box.height - EDGE);
    centeredPack(zones.right, 'y', box.y + EDGE, box.y + box.height - EDGE);
    centeredPack(zones.top, 'x', box.x + EDGE, box.x + box.width - EDGE);
    centeredPack(zones.bottom, 'x', box.x + EDGE, box.x + box.width - EDGE);
    items.forEach(function (item) { apply(item, box); });
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
