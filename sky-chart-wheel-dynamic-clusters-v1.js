// Branch-only dynamic collision clusters for visible Sky Chart placements.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const SVG_SELECTOR = '.unified-sky-wheel svg, #chartOutput svg, #currentSkyOutput svg, .sky-output-box svg';
  const PLACEMENT = '.chart-wheel-placement-stick';
  const COLLISION_DISTANCE = 44;
  const BUBBLE_RADIUS = 17.5;
  const EXPANDED_SPACING = 43;
  const expandedKeys = new Set();
  let queued = 0;
  let updating = false;

  function num(value) {
    const result = Number(value);
    return Number.isFinite(result) ? result : NaN;
  }

  function rootPoint(node, x, y) {
    const matrix = node.getCTM && node.getCTM();
    if (!matrix) return { x:x, y:y };
    const point = new DOMPoint(x, y).matrixTransform(matrix);
    return { x:point.x, y:point.y };
  }

  function visible(group) {
    if (group.hidden || group.getAttribute('aria-hidden') === 'true') return false;
    const style = getComputedStyle(group);
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0;
  }

  function color(group) {
    return group.classList.contains('sky-b') ? '#3166e2' : '#dc1f18';
  }

  function label(group) {
    return String(group.querySelector('.chart-wheel-marker-name')?.textContent || group.dataset.body || group.dataset.placement || 'Placement').trim();
  }

  function rememberAndHide(group) {
    if (!group.dataset.relphiClusterHidden) {
      group.dataset.relphiClusterHidden = 'true';
      group.dataset.relphiClusterDisplay = group.style.display || '__none__';
    }
    group.style.display = 'none';
  }

  function restoreGroups(svg) {
    svg.querySelectorAll(PLACEMENT + '[data-relphi-cluster-hidden="true"]').forEach(function (group) {
      const old = group.dataset.relphiClusterDisplay;
      if (old === '__none__') group.style.removeProperty('display');
      else group.style.display = old;
      delete group.dataset.relphiClusterHidden;
      delete group.dataset.relphiClusterDisplay;
    });
  }

  function itemFrom(group, index) {
    const knob = group.querySelector('circle.chart-wheel-stick-knob');
    const contact = group.querySelector('circle.chart-wheel-contact-dot');
    if (!knob || !contact || !visible(group)) return null;
    const cx = num(knob.getAttribute('cx'));
    const cy = num(knob.getAttribute('cy'));
    const ax = num(contact.getAttribute('cx'));
    const ay = num(contact.getAttribute('cy'));
    if (![cx,cy,ax,ay].every(Number.isFinite)) return null;
    return {
      index:index,
      group:group,
      knob:knob,
      contact:contact,
      bubble:rootPoint(knob, cx, cy),
      anchor:rootPoint(contact, ax, ay),
      color:color(group),
      label:label(group)
    };
  }

  function components(items) {
    const seen = new Set();
    const result = [];
    items.forEach(function (item, start) {
      if (seen.has(start)) return;
      const queue = [start];
      const component = [];
      seen.add(start);
      while (queue.length) {
        const index = queue.shift();
        const current = items[index];
        component.push(current);
        items.forEach(function (other, candidate) {
          if (seen.has(candidate)) return;
          const distance = Math.hypot(other.bubble.x - current.bubble.x, other.bubble.y - current.bubble.y);
          if (distance < COLLISION_DISTANCE) {
            seen.add(candidate);
            queue.push(candidate);
          }
        });
      }
      if (component.length > 1) result.push(component);
    });
    return result;
  }

  function average(items, field) {
    return items.reduce(function (sum, item) {
      sum.x += item[field].x;
      sum.y += item[field].y;
      return sum;
    }, { x:0, y:0 });
  }

  function clusterKey(items) {
    return items.map(function (item) { return item.label + ':' + item.color; }).sort().join('|');
  }

  function line(parent, from, to) {
    const node = document.createElementNS(NS, 'line');
    node.setAttribute('x1', from.x.toFixed(2));
    node.setAttribute('y1', from.y.toFixed(2));
    node.setAttribute('x2', to.x.toFixed(2));
    node.setAttribute('y2', to.y.toFixed(2));
    node.setAttribute('stroke', '#222');
    node.setAttribute('stroke-width', '1.35');
    node.setAttribute('stroke-linecap', 'round');
    parent.appendChild(node);
    return node;
  }

  function circle(parent, center, stroke, radius) {
    const node = document.createElementNS(NS, 'circle');
    node.setAttribute('cx', center.x.toFixed(2));
    node.setAttribute('cy', center.y.toFixed(2));
    node.setAttribute('r', String(radius));
    node.setAttribute('fill', '#fff');
    node.setAttribute('stroke', stroke);
    node.setAttribute('stroke-width', '2.5');
    parent.appendChild(node);
    return node;
  }

  function drawGlyph(parent, item, center) {
    const source = item.group.querySelector('svg.relphi-bold-inline-glyph');
    if (source) {
      const clone = source.cloneNode(true);
      clone.removeAttribute('transform');
      clone.setAttribute('x', String(center.x - 13));
      clone.setAttribute('y', String(center.y - 13));
      clone.setAttribute('width', '26');
      clone.setAttribute('height', '26');
      clone.style.display = 'block';
      clone.style.visibility = 'visible';
      parent.appendChild(clone);
      return;
    }
    const sourceText = item.group.querySelector('.chart-wheel-marker-glyph');
    const text = document.createElementNS(NS, 'text');
    text.textContent = sourceText?.textContent || item.label;
    text.setAttribute('x', center.x.toFixed(2));
    text.setAttribute('y', center.y.toFixed(2));
    text.setAttribute('fill', item.color);
    text.setAttribute('font-family', 'system-ui,sans-serif');
    text.setAttribute('font-size', /ASC|MC/i.test(text.textContent) ? '11.5' : '17');
    text.setAttribute('font-weight', /ASC|MC/i.test(text.textContent) ? '750' : '900');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    parent.appendChild(text);
  }

  function bubbleEdge(anchor, center) {
    const vx = center.x - anchor.x;
    const vy = center.y - anchor.y;
    const length = Math.hypot(vx, vy) || 1;
    return {
      x:center.x - vx / length * (BUBBLE_RADIUS - 1.1),
      y:center.y - vy / length * (BUBBLE_RADIUS - 1.1)
    };
  }

  function clamp(point, box) {
    const margin = BUBBLE_RADIUS + 4;
    return {
      x:Math.max(box.x + margin, Math.min(box.x + box.width - margin, point.x)),
      y:Math.max(box.y + margin, Math.min(box.y + box.height - margin, point.y))
    };
  }

  function drawExpanded(overlay, items, center, wheelCenter, box, key) {
    const vx = center.x - wheelCenter.x;
    const vy = center.y - wheelCenter.y;
    const length = Math.hypot(vx, vy) || 1;
    const radial = { x:vx / length, y:vy / length };
    const tangent = { x:-radial.y, y:radial.x };
    const middle = (items.length - 1) / 2;

    items.forEach(function (item, index) {
      const offset = (index - middle) * EXPANDED_SPACING;
      const target = clamp({
        x:center.x + tangent.x * offset + radial.x * (18 + Math.abs(offset) * 0.13),
        y:center.y + tangent.y * offset + radial.y * (18 + Math.abs(offset) * 0.13)
      }, box);
      line(overlay, item.anchor, bubbleEdge(item.anchor, target));
      circle(overlay, target, item.color, BUBBLE_RADIUS);
      drawGlyph(overlay, item, target);
    });

    overlay.style.cursor = 'zoom-out';
    overlay.addEventListener('click', function (event) {
      event.stopPropagation();
      expandedKeys.delete(key);
      schedule();
    });
  }

  function drawCollapsed(overlay, items, center, anchor, key) {
    const colors = Array.from(new Set(items.map(function (item) { return item.color; })));
    line(overlay, anchor, bubbleEdge(anchor, center));
    circle(overlay, center, colors[0], BUBBLE_RADIUS + 1);
    if (colors.length > 1) circle(overlay, center, colors[1], BUBBLE_RADIUS - 3.2);

    const text = document.createElementNS(NS, 'text');
    text.textContent = String(items.length);
    text.setAttribute('x', center.x.toFixed(2));
    text.setAttribute('y', center.y.toFixed(2));
    text.setAttribute('fill', colors.length > 1 ? '#5b43b7' : colors[0]);
    text.setAttribute('font-family', 'system-ui,sans-serif');
    text.setAttribute('font-size', '13');
    text.setAttribute('font-weight', '850');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    overlay.appendChild(text);

    overlay.style.cursor = 'zoom-in';
    overlay.setAttribute('role', 'button');
    overlay.setAttribute('tabindex', '0');
    overlay.setAttribute('aria-label', 'Expand ' + items.length + ' nearby placements');
    function expand(event) {
      event.preventDefault();
      event.stopPropagation();
      expandedKeys.add(key);
      schedule();
    }
    overlay.addEventListener('click', expand);
    overlay.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') expand(event);
    });
  }

  function apply(svg) {
    svg.querySelectorAll(':scope > g.relphi-dynamic-cluster').forEach(function (node) { node.remove(); });
    restoreGroups(svg);

    const items = Array.from(svg.querySelectorAll(PLACEMENT)).map(itemFrom).filter(Boolean);
    const groups = components(items);
    if (!groups.length) return;

    const view = svg.viewBox && svg.viewBox.baseVal;
    const box = view && view.width ? { x:view.x, y:view.y, width:view.width, height:view.height } : { x:0, y:0, width:800, height:800 };
    const wheelCenter = { x:box.x + box.width / 2, y:box.y + box.height / 2 };

    groups.forEach(function (members) {
      const key = clusterKey(members);
      const bubbleSum = average(members, 'bubble');
      const anchorSum = average(members, 'anchor');
      const center = clamp({ x:bubbleSum.x / members.length, y:bubbleSum.y / members.length }, box);
      const anchor = { x:anchorSum.x / members.length, y:anchorSum.y / members.length };
      members.forEach(function (member) { rememberAndHide(member.group); });

      const overlay = document.createElementNS(NS, 'g');
      overlay.classList.add('relphi-dynamic-cluster');
      overlay.dataset.clusterKey = key;
      overlay.setAttribute('pointer-events', 'all');
      svg.appendChild(overlay);

      if (expandedKeys.has(key)) drawExpanded(overlay, members, center, wheelCenter, box, key);
      else drawCollapsed(overlay, members, center, anchor, key);
    });
  }

  function run() {
    queued = 0;
    if (updating) return;
    updating = true;
    try { document.querySelectorAll(SVG_SELECTOR).forEach(apply); }
    finally { updating = false; }
  }

  function schedule(delay) {
    clearTimeout(queued);
    queued = setTimeout(run, delay == null ? 40 : delay);
  }

  function install() {
    schedule(0);
    document.addEventListener('input', function (event) {
      if (event.target.closest?.('.sky-filter-panel,.sky-chart-filter,.sky-results-toolbar,[data-sky-filter]')) schedule(60);
    }, true);
    document.addEventListener('change', function () { schedule(60); }, true);
    document.addEventListener('click', function (event) {
      if (!event.target.closest?.('.relphi-dynamic-cluster') && expandedKeys.size) {
        expandedKeys.clear();
        schedule(0);
      } else if (event.target.closest?.('button,input,select,label,[data-filter],[data-sky-filter]')) schedule(80);
    }, true);
    window.addEventListener('resize', function () { schedule(80); }, { passive:true });
    window.addEventListener('relphi:sky-builder-v4-loaded', function () { schedule(80); });
    new MutationObserver(function (records) {
      if (updating) return;
      const relevant = records.some(function (record) {
        const target = record.target instanceof Element ? record.target : null;
        if (target?.closest?.('.relphi-dynamic-cluster')) return false;
        return target?.matches?.(PLACEMENT) || target?.closest?.(PLACEMENT) ||
          Array.from(record.addedNodes || []).some(function (node) {
            return node instanceof Element && !node.matches('.relphi-dynamic-cluster') &&
              (node.matches?.(PLACEMENT) || node.querySelector?.(PLACEMENT));
          });
      });
      if (relevant) schedule(60);
    }).observe(document.body, {
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:['class','style','hidden','aria-hidden']
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
