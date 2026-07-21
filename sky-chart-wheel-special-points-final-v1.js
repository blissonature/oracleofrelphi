// Preview-only unified finalizer for special-point glyphs, optical centering, hover solidity, and leader geometry.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const PLACEMENT = '.chart-wheel-placement-stick';
  const EDGE_OVERLAP_PX = 1.5;
  let scheduled = false;

  const SYMBOL_BY_NAME = {
    'north node':'☊', 'node':'☊',
    'south node':'☋',
    'part of fortune':'⊗', 'fortune':'⊗', 'pof':'⊗',
    'lilith':'⚸'
  };
  const SYMBOL_BY_STALE_TEXT = { 'No':'☊', 'So':'☋', 'Pa':'⊗' };
  const TEXT_BY_NAME = {
    'rising':'ASC', 'ascendant':'ASC', 'asc':'ASC', 'ac':'ASC',
    'dsc':'DSC', 'descendant':'DSC',
    'mc':'MC', 'midheaven':'MC',
    'ic':'IC', 'imum coeli':'IC',
    'vertex':'Vx'
  };
  const TEXT_BY_STALE_TEXT = { 'Ds':'DSC', 'V':'Vx' };

  function bare(value) {
    return String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim();
  }

  function placementName(group) {
    return (bare(group.querySelector('.chart-wheel-marker-name')?.textContent) ||
      bare(group.dataset.body) || bare(group.dataset.placement) || '').toLowerCase();
  }

  function glyphNode(group) {
    return group.querySelector('.chart-wheel-marker-glyph');
  }

  function normalizeGlyph(group) {
    const text = glyphNode(group);
    if (!text) return;
    const name = placementName(group);
    const stale = bare(text.textContent);
    const symbol = SYMBOL_BY_NAME[name] || SYMBOL_BY_STALE_TEXT[stale];
    const label = TEXT_BY_NAME[name] || TEXT_BY_STALE_TEXT[stale];

    if (symbol) {
      text.textContent = symbol;
      text.style.setProperty('font-size', name === 'lilith' || stale === '⚸' ? '20px' : '19px', 'important');
      text.style.setProperty('font-weight', '500', 'important');
      text.style.setProperty('letter-spacing', '0', 'important');
    } else if (label) {
      text.textContent = label;
      text.style.setProperty('font-size', label === 'DSC' ? '11px' : '12.5px', 'important');
      text.style.setProperty('font-weight', '600', 'important');
      text.style.setProperty('letter-spacing', label === 'DSC' ? '-0.04em' : '0', 'important');
    }
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
  }

  function screenCenter(node) {
    const rect = node.getBoundingClientRect();
    return { x:rect.left + rect.width / 2, y:rect.top + rect.height / 2, radius:Math.min(rect.width, rect.height) / 2 };
  }

  function screenToLocal(node, point) {
    const matrix = node.getScreenCTM?.();
    if (!matrix) return point;
    try { return new DOMPoint(point.x, point.y).matrixTransform(matrix.inverse()); }
    catch (_) { return point; }
  }

  function visibleArtworkRect(node) {
    if (!node) return null;
    if (!node.matches?.('svg.relphi-bold-inline-glyph')) return node.getBoundingClientRect();
    const shapes = node.querySelectorAll('path,circle,ellipse,rect,line,polyline,polygon');
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    shapes.forEach(function (shape) {
      const rect = shape.getBoundingClientRect();
      if (!rect.width && !rect.height) return;
      left = Math.min(left, rect.left);
      top = Math.min(top, rect.top);
      right = Math.max(right, rect.right);
      bottom = Math.max(bottom, rect.bottom);
    });
    if (!Number.isFinite(left)) return node.getBoundingClientRect();
    return { left:left, top:top, right:right, bottom:bottom, width:right-left, height:bottom-top };
  }

  function centerVisibleGlyph(group) {
    const bubble = group.querySelector('circle.chart-wheel-stick-knob');
    const node = group.querySelector('svg.relphi-bold-inline-glyph') || group.querySelector('.chart-wheel-marker-glyph');
    if (!bubble || !node) return;

    if (node.dataset.relphiOpticalBaseTransform == null) {
      node.dataset.relphiOpticalBaseTransform = node.getAttribute('transform') || '__none__';
    }
    const base = node.dataset.relphiOpticalBaseTransform;
    if (base === '__none__') node.removeAttribute('transform');
    else node.setAttribute('transform', base);

    const bubbleRect = bubble.getBoundingClientRect();
    const artRect = visibleArtworkRect(node);
    if (!artRect) return;
    const target = { x:bubbleRect.left + bubbleRect.width / 2, y:bubbleRect.top + bubbleRect.height / 2 };
    const current = { x:artRect.left + artRect.width / 2, y:artRect.top + artRect.height / 2 };
    const parent = node.parentNode;
    const targetLocal = screenToLocal(parent, target);
    const currentLocal = screenToLocal(parent, current);
    const dx = targetLocal.x - currentLocal.x;
    const dy = targetLocal.y - currentLocal.y;
    const shift = 'translate(' + dx.toFixed(2) + ' ' + dy.toFixed(2) + ')';
    node.setAttribute('transform', base === '__none__' ? shift : base + ' ' + shift);
  }

  function connectLeader(group) {
    const bubble = group.querySelector('circle.chart-wheel-stick-knob');
    const contact = group.querySelector('circle.chart-wheel-contact-dot');
    const leader = group.querySelector('line.chart-wheel-stick');
    if (!bubble || !contact || !leader) return;

    const center = screenCenter(bubble);
    const anchor = screenCenter(contact);
    const dx = center.x - anchor.x;
    const dy = center.y - anchor.y;
    const distance = Math.hypot(dx, dy) || 1;
    const stop = Math.max(0, center.radius - EDGE_OVERLAP_PX);
    const edgeScreen = {
      x:center.x - dx / distance * stop,
      y:center.y - dy / distance * stop
    };
    const start = screenToLocal(leader, anchor);
    const end = screenToLocal(leader, edgeScreen);
    leader.setAttribute('x1', start.x.toFixed(2));
    leader.setAttribute('y1', start.y.toFixed(2));
    leader.setAttribute('x2', end.x.toFixed(2));
    leader.setAttribute('y2', end.y.toFixed(2));
    leader.style.strokeLinecap = 'round';
  }

  function setSolid(group, solid) {
    const bubble = group.querySelector('.chart-wheel-stick-knob');
    const leader = group.querySelector('.chart-wheel-stick');
    const glyphs = group.querySelectorAll('.chart-wheel-marker-glyph, svg.relphi-bold-inline-glyph');
    if (bubble) {
      bubble.style.setProperty('fill-opacity', solid ? '1' : '.92', 'important');
      bubble.style.setProperty('stroke-opacity', '1', 'important');
    }
    if (leader) leader.style.setProperty('opacity', solid ? '1' : '.88', 'important');
    glyphs.forEach(function (glyph) { glyph.style.setProperty('opacity', '1', 'important'); });
  }

  function raise(group) {
    if (group.dataset.relphiUnifiedRaised === 'true') return;
    const parent = group.parentNode;
    if (!parent) return;
    const marker = document.createComment('relphi-unified-order');
    parent.insertBefore(marker, group);
    group.__relphiUnifiedMarker = marker;
    group.dataset.relphiUnifiedRaised = 'true';
    parent.appendChild(group);
    setSolid(group, true);
  }

  function restore(group) {
    const marker = group.__relphiUnifiedMarker;
    if (marker?.parentNode) marker.parentNode.replaceChild(group, marker);
    delete group.__relphiUnifiedMarker;
    delete group.dataset.relphiUnifiedRaised;
    setSolid(group, false);
  }

  function wire(group) {
    if (group.dataset.relphiUnifiedWired === 'true') return;
    group.dataset.relphiUnifiedWired = 'true';
    group.addEventListener('pointerenter', function () { raise(group); });
    group.addEventListener('pointerleave', function () { restore(group); });
    group.addEventListener('focusin', function () { raise(group); });
    group.addEventListener('focusout', function () { restore(group); });
  }

  function finalize() {
    scheduled = false;
    document.querySelectorAll(PLACEMENT).forEach(function (group) {
      normalizeGlyph(group);
      centerVisibleGlyph(group);
      connectLeader(group);
      setSolid(group, false);
      wire(group);
    });
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () { requestAnimationFrame(finalize); });
  }

  window.addEventListener('relphi:sky-builder-v4-loaded', schedule);
  window.addEventListener('relphi:extra-points-updated', schedule);
  window.addEventListener('resize', schedule, { passive:true });
  new MutationObserver(function (records) {
    if (records.some(function (record) {
      return Array.from(record.addedNodes || []).some(function (node) {
        return node.nodeType === Node.ELEMENT_NODE &&
          (node.matches?.(PLACEMENT) || node.querySelector?.(PLACEMENT));
      });
    })) schedule();
  }).observe(document.body, { childList:true, subtree:true });
  schedule();
})();