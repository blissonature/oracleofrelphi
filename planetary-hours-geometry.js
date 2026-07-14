(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RelphiPlanetaryHoursGeometry = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const norm = value => ((Number(value) % 360) + 360) % 360;
  const signed = (from, to) => ((norm(to) - norm(from) + 540) % 360) - 180;
  const unwrapAfter = (value, start) => {
    let out = norm(value);
    while (out < start) out += 360;
    return out;
  };

  function intervalsOverlap(a, b, padding) {
    return !(a.right + padding <= b.left || b.right + padding <= a.left || a.bottom + padding <= b.top || b.bottom + padding <= a.top);
  }

  function solveCluster(cluster, boundaryBefore, boundaryAfter, gap) {
    const before = Number(boundaryBefore);
    const after = unwrapAfter(boundaryAfter, before + 0.001);
    const sorted = cluster.slice().sort((a, b) => unwrapAfter(a.longitude, before) - unwrapAfter(b.longitude, before));
    if (!sorted.length) return { angles:[], mode:'split' };
    const longitudes = sorted.map(item => unwrapAfter(item.longitude, before));
    const spans = sorted.map(item => Math.max(Number(item.halfSpan) || 0, gap / 2));
    const minimum = new Array(sorted.length);
    minimum[0] = before + spans[0] + gap;
    for (let i = 1; i < minimum.length; i += 1) minimum[i] = minimum[i - 1] + spans[i - 1] + spans[i] + gap;
    const maximum = new Array(sorted.length);
    maximum[maximum.length - 1] = after - spans[spans.length - 1] - gap;
    for (let i = maximum.length - 2; i >= 0; i -= 1) maximum[i] = maximum[i + 1] - spans[i + 1] - spans[i] - gap;
    const feasible = minimum.every((value, index) => value <= maximum[index]);
    let angles;
    if (!feasible) {
      const step = Math.max(gap, (after - before) / Math.max(1, sorted.length + 1));
      angles = sorted.map((_, index) => before + step * (index + 1));
    } else {
      angles = longitudes.map((value, index) => Math.max(minimum[index], Math.min(maximum[index], value)));
      for (let i = 1; i < angles.length; i += 1) angles[i] = Math.max(angles[i], angles[i - 1] + spans[i - 1] + spans[i] + gap);
      for (let i = angles.length - 2; i >= 0; i -= 1) angles[i] = Math.min(angles[i], angles[i + 1] - spans[i + 1] - spans[i] - gap);
    }
    const shift = angles.reduce((sum, value, index) => sum + (value - longitudes[index]), 0) / angles.length;
    const hasLeft = angles.some((value, index) => value < longitudes[index] - 0.05);
    const hasRight = angles.some((value, index) => value > longitudes[index] + 0.05);
    const mode = hasLeft && hasRight ? 'split' : (shift > 0.05 ? 'clockwise' : (shift < -0.05 ? 'counterclockwise' : 'split'));
    return { angles:angles.map(norm), mode, feasible };
  }

  function point(angle, radius, cx, cy) {
    const rad = (Number(angle) - 90) * Math.PI / 180;
    return { x:cx + Math.cos(rad) * radius, y:cy + Math.sin(rad) * radius };
  }

  function markerBounds(marker) {
    const parts = Array.from(marker.querySelectorAll('.planet-dot, .planet-label, .relphi-wheel-planet-glyph, image'));
    let union = null;
    parts.forEach(function (part) {
      try {
        const box = part.getBBox();
        if (!Number.isFinite(box.x) || !Number.isFinite(box.y) || !box.width || !box.height) return;
        union = union ? {
          left:Math.min(union.left, box.x), top:Math.min(union.top, box.y),
          right:Math.max(union.right, box.x + box.width), bottom:Math.max(union.bottom, box.y + box.height)
        } : { left:box.x, top:box.y, right:box.x + box.width, bottom:box.y + box.height };
      } catch (error) {}
    });
    if (!union) return null;
    union.width = union.right - union.left; union.height = union.bottom - union.top;
    return union;
  }

  function setMarkerAngle(marker, angle, options) {
    const p = point(angle, options.radius, options.cx, options.cy);
    const stick = marker.querySelector('.planet-stick');
    const dot = marker.querySelector('.planet-dot');
    const text = marker.querySelector('.planet-label');
    if (stick) { stick.setAttribute('x2', p.x.toFixed(2)); stick.setAttribute('y2', p.y.toFixed(2)); }
    if (dot) { dot.setAttribute('cx', p.x.toFixed(2)); dot.setAttribute('cy', p.y.toFixed(2)); }
    if (text) { text.setAttribute('x', p.x.toFixed(2)); text.setAttribute('y', (p.y + 0.5).toFixed(2)); }
    marker.dataset.displayLongitude = String(norm(angle));
  }

  function layoutWheel(svg) {
    if (!svg || svg.dataset.relphiClusterLayout === 'pending') return null;
    svg.dataset.relphiClusterLayout = 'pending';
    const viewBox = svg.viewBox && svg.viewBox.baseVal;
    const width = viewBox && viewBox.width || 220;
    const height = viewBox && viewBox.height || 220;
    const options = { cx:width / 2, cy:height / 2, radius:Math.min(width, height) / 2 - 10 };
    const markers = Array.from(svg.querySelectorAll('.planet-marker[data-true-longitude]'));
    if (markers.length < 2) { svg.dataset.relphiClusterLayout = 'done'; return { clusters:0 }; }
    const data = markers.map(marker => {
      const longitude = norm(marker.dataset.trueLongitude);
      const box = markerBounds(marker);
      const diagonal = box ? Math.hypot(box.width, box.height) : 14;
      const halfSpan = Math.asin(Math.min(0.95, diagonal / 2 / options.radius)) * 180 / Math.PI;
      return { marker, longitude, halfSpan, box };
    }).sort((a, b) => a.longitude - b.longitude);
    const close = (a, b) => {
      const angularNeed = a.halfSpan + b.halfSpan + 1.2;
      return Math.abs(signed(a.longitude, b.longitude)) < angularNeed || (a.box && b.box && intervalsOverlap(a.box, b.box, 1.5));
    };
    const clusters = [];
    let current = [data[0]];
    for (let i = 1; i < data.length; i += 1) {
      if (close(data[i - 1], data[i])) current.push(data[i]);
      else { clusters.push(current); current = [data[i]]; }
    }
    clusters.push(current);
    if (clusters.length > 1 && close(data[data.length - 1], data[0])) clusters[0] = clusters.pop().concat(clusters[0]);
    clusters.filter(cluster => cluster.length > 1).forEach(cluster => {
      const firstIndex = data.indexOf(cluster[0]);
      const lastIndex = data.indexOf(cluster[cluster.length - 1]);
      const before = data[(firstIndex - 1 + data.length) % data.length];
      const after = data[(lastIndex + 1) % data.length];
      let boundaryBefore = before.longitude;
      while (boundaryBefore >= cluster[0].longitude) boundaryBefore -= 360;
      let boundaryAfter = after.longitude;
      while (boundaryAfter <= cluster[cluster.length - 1].longitude) boundaryAfter += 360;
      let solved;
      for (let pass = 0; pass < 6; pass += 1) {
        solved = solveCluster(cluster, boundaryBefore, boundaryAfter, 1.2 + pass * 0.35);
        const ordered = cluster.slice().sort((a, b) => unwrapAfter(a.longitude, boundaryBefore) - unwrapAfter(b.longitude, boundaryBefore));
        ordered.forEach((item, index) => setMarkerAngle(item.marker, solved.angles[index], options));
        const boxes = ordered.map(item => markerBounds(item.marker));
        const collision = boxes.some((box, index) => index && box && boxes[index - 1] && intervalsOverlap(boxes[index - 1], box, 1.5));
        if (!collision) break;
        ordered.forEach(function (item) { item.halfSpan += 0.35; });
      }
      cluster.forEach(function (item) {
        item.marker.classList.add('is-clustered');
        item.marker.dataset.clusterDirection = solved.mode;
      });
    });
    svg.dataset.relphiClusterLayout = 'done';
    return { clusters:clusters.filter(cluster => cluster.length > 1).length };
  }

  return { norm, signed, intervalsOverlap, solveCluster, layoutWheel };
});
