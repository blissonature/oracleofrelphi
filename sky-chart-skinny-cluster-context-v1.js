// Context-aware collision pass for skinny Sky-card mini-zodiac lollipops.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const MIN_MARKER_GAP = 12;
  const CLUSTER_JOIN_GAP = 18;
  const CLUSTER_GAP = 12;
  const CX = 120;
  const CY = 120;
  const BASE_LANE = 108;
  let queued = false;

  function normalize(value) {
    value %= 360;
    return value < 0 ? value + 360 : value;
  }

  function point(radius, degrees) {
    const radians = degrees * Math.PI / 180;
    return {
      x: CX + Math.cos(radians) * radius,
      y: CY + Math.sin(radians) * radius
    };
  }

  function markerEntry(marker, index) {
    let contact = marker.previousElementSibling;
    while (contact && !contact.classList?.contains('planet-contact')) contact = contact.previousElementSibling;
    if (!contact) return null;

    let stick = contact.previousElementSibling;
    while (stick && !stick.classList?.contains('planet-stick')) stick = stick.previousElementSibling;
    if (!stick) return null;

    const x = Number(contact.getAttribute('cx'));
    const y = Number(contact.getAttribute('cy'));
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

    const angle = normalize(Math.atan2(y - CY, x - CX) * 180 / Math.PI);
    return { marker, contact, stick, angle, index };
  }

  function unwrapAtLargestGap(entries) {
    const sorted = entries.slice().sort((a, b) => a.angle - b.angle);
    if (sorted.length < 2) return sorted.map(entry => ({ ...entry, unwrappedAngle: entry.angle }));

    let cutAfter = 0;
    let largestGap = -1;
    for (let index = 0; index < sorted.length; index += 1) {
      const current = sorted[index].angle;
      const next = index === sorted.length - 1 ? sorted[0].angle + 360 : sorted[index + 1].angle;
      const gap = next - current;
      if (gap > largestGap) {
        largestGap = gap;
        cutAfter = index;
      }
    }

    const linear = [];
    for (let step = 1; step <= sorted.length; step += 1) {
      const sourceIndex = (cutAfter + step) % sorted.length;
      const entry = sorted[sourceIndex];
      const wrapped = cutAfter + step >= sorted.length;
      linear.push({ ...entry, unwrappedAngle: entry.angle + (wrapped ? 360 : 0) });
    }
    return linear;
  }

  function makeClusters(linear) {
    if (!linear.length) return [];
    const clusters = [];
    let members = [linear[0]];
    for (let index = 1; index < linear.length; index += 1) {
      if (linear[index].unwrappedAngle - linear[index - 1].unwrappedAngle <= CLUSTER_JOIN_GAP) {
        members.push(linear[index]);
      } else {
        clusters.push(members);
        members = [linear[index]];
      }
    }
    clusters.push(members);

    return clusters.map(group => {
      const naturalCenter = group.reduce((sum, entry) => sum + entry.unwrappedAngle, 0) / group.length;
      const halfWidth = ((group.length - 1) * MIN_MARKER_GAP) / 2;
      return {
        members: group,
        naturalCenter,
        center: naturalCenter,
        halfWidth
      };
    });
  }

  function resolveNeighboringClusters(clusters) {
    if (clusters.length < 2) return clusters;

    // Pairwise relaxation shares required movement between both neighboring regions,
    // avoiding the old one-directional pile-up.
    for (let pass = 0; pass < 10; pass += 1) {
      let changed = false;
      for (let index = 1; index < clusters.length; index += 1) {
        const left = clusters[index - 1];
        const right = clusters[index];
        const required = left.center + left.halfWidth + CLUSTER_GAP;
        const actual = right.center - right.halfWidth;
        if (actual < required) {
          const overlap = required - actual;
          left.center -= overlap / 2;
          right.center += overlap / 2;
          changed = true;
        }
      }

      // Keep the whole solution near the original astronomical regions instead of
      // allowing accumulated relaxation to drift around the wheel.
      const drift = clusters.reduce((sum, cluster) => sum + (cluster.center - cluster.naturalCenter), 0) / clusters.length;
      clusters.forEach(cluster => { cluster.center -= drift; });
      if (!changed) break;
    }
    return clusters;
  }

  function layoutSvg(svg) {
    const entries = Array.from(svg.querySelectorAll('.planet-marker.relphi-inscribed-lollipop'))
      .map(markerEntry)
      .filter(Boolean);
    if (entries.length < 2) return;

    const clusters = resolveNeighboringClusters(makeClusters(unwrapAtLargestGap(entries)));
    clusters.forEach(cluster => {
      cluster.members.forEach((entry, memberIndex) => {
        const offset = (memberIndex - (cluster.members.length - 1) / 2) * MIN_MARKER_GAP;
        const displayAngle = normalize(cluster.center + offset);
        const lane = BASE_LANE + (memberIndex % 2) * 7;
        const display = point(lane, displayAngle);
        entry.marker.setAttribute('transform', 'translate(' + display.x.toFixed(3) + ' ' + display.y.toFixed(3) + ')');
        entry.stick.setAttribute('x2', display.x.toFixed(3));
        entry.stick.setAttribute('y2', display.y.toFixed(3));
        entry.marker.dataset.contextAngle = displayAngle.toFixed(3);
      });
    });
  }

  function run() {
    queued = false;
    document.querySelectorAll('#relphiSkyWorkspace .relphi-skinny-solo svg').forEach(layoutSvg);
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      requestAnimationFrame(run);
    });
  }

  function start() {
    queue();
    window.addEventListener('storage', queue);
    window.addEventListener('relphi:extra-points-updated', queue);
    const workspace = document.getElementById('relphiSkyWorkspace');
    if (workspace) {
      new MutationObserver(mutations => {
        if (mutations.some(mutation => Array.from(mutation.addedNodes).some(node => node.nodeType === 1 && (node.matches?.('.relphi-skinny-solo,.planet-marker') || node.querySelector?.('.relphi-skinny-solo,.planet-marker'))))) queue();
      }).observe(workspace, { childList:true, subtree:true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
