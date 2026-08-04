// Runtime verification of the exact Master Glyph List contract used by Sky Chart.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyGlyphAuditV2) return;
  window.__relphiSkyGlyphAuditV1 = true;
  window.__relphiSkyGlyphAuditV2 = true;

  const ANGLES = new Set(['asc','dsc','mc','ic']);
  const REQUIRED = new Set(['neptune','asc','dsc','mc','ic','north-node','south-node']);
  const SKY_BANDS = Object.freeze({ A:[414,574], B:[166,323] });
  const SKY_COLORS = Object.freeze({ A:'rgb(201, 33, 30)', B:'rgb(36, 98, 208)' });
  const CENTER = Object.freeze({ x:600, y:600 });
  let timer = 0;
  let lastSignature = '';

  function entry(id) {
    const registry = window.RelphiGlyphRegistry;
    return registry && (registry.get(id) || registry.resolve(id));
  }

  function art(root) {
    return Array.from(root?.children || []).find(node => node.classList?.contains('relphi-canonical-glyph')) || null;
  }

  function circle(root) {
    return root?.querySelector?.(':scope > circle') || null;
  }

  function hiddenCircle(root) {
    const node = circle(root);
    if (!node) return false;
    const style = getComputedStyle(node);
    return Number(style.opacity) === 0 || node.getAttribute('opacity') === '0';
  }

  function canonicalRoot(host) {
    return host?.querySelector?.(':scope > .relphi-glyph-bubble') || host?.querySelector?.('.relphi-glyph-bubble') || null;
  }

  function expectedSource(id) {
    return id === 'neptune' ? 'assets/planet-glyphs/neptune.svg' : `glyphs-unified-preview.html#${id}`;
  }

  function expectedViewBox(id) {
    return id === 'neptune' ? '0 0 100 100' : '-32 -32 64 64';
  }

  function auditMaster(root, issues, label) {
    if (root?.dataset?.relphiAtomicPending === 'true') return;
    const id = root?.dataset?.glyphId || art(root)?.dataset?.relphiAtomicIdentity || '';
    const resolved = entry(id);
    if (!resolved) {
      issues.push(`${label}: unresolved identity ${id || '(missing)'}`);
      return;
    }
    const glyph = art(root);
    if (!glyph) {
      issues.push(`${label}: canonical artwork missing for ${resolved.id}`);
      return;
    }
    if (!glyph.classList.contains(`relphi-glyph-${resolved.id}`)) issues.push(`${label}: identity mismatch for ${resolved.id}`);
    if (REQUIRED.has(resolved.id)) {
      const source = glyph.dataset.relphiCanonicalSource || root.dataset.relphiCanonicalSource || resolved.canonicalSource || '';
      if (source !== expectedSource(resolved.id)) issues.push(`${label}: ${resolved.id} source is ${source || '(missing)'}`);
      const viewBox = glyph.dataset.relphiCanonicalViewBox || root.closest('svg')?.dataset?.canonicalViewbox || resolved.canonicalMasterViewBox || '';
      if (viewBox && viewBox !== expectedViewBox(resolved.id)) issues.push(`${label}: ${resolved.id} viewBox is ${viewBox}`);
      if (resolved.id === 'neptune' && glyph.querySelector('text')) issues.push(`${label}: Neptune rendered as text`);
      if (glyph.querySelector('[transform*="rotate("]') || /rotate\s*\(/i.test(glyph.getAttribute('transform') || '')) {
        issues.push(`${label}: ${resolved.id} carries a generated rotation`);
      }
    }
    if (root.classList.contains('relphi-glyph-framed') || root.dataset.canonicalFraming === 'hidden-bubble') {
      if (!hiddenCircle(root)) issues.push(`${label}: uncircled master does not hide only its canonical circle`);
      if (glyph.dataset.relphiWhitespaceAware !== 'true') issues.push(`${label}: intentional whitespace is not marked preserved`);
    }
  }

  function boxesOverlap(a,b,clearance) {
    return a.left < b.right + clearance && a.right > b.left - clearance && a.top < b.bottom + clearance && a.bottom > b.top - clearance;
  }

  function polarAngle(x,y) {
    return ((Math.atan2(y - CENTER.y,x - CENTER.x) * 180 / Math.PI) + 180 + 360) % 360;
  }

  function angularDifference(a,b) {
    return Math.abs(((a - b + 180) % 360 + 360) % 360 - 180);
  }

  function auditAngles(issues) {
    const chart = document.querySelector('.sky-foundation-wheel');
    if (!chart) return;
    if (chart.dataset.angleCollisionState === 'unresolved' || chart.querySelector('[data-angle-collision-error]')) {
      issues.push('Comparison wheel reports an unresolved Angle collision');
    }

    const hosts = Array.from(chart.querySelectorAll('[data-layer="placements"] > g[data-angle-axis="true"]'));
    if (hosts.length !== 8) issues.push(`Comparison wheel has ${hosts.length} Angle labels instead of 8`);
    for (const slot of ['A','B']) {
      const ids = hosts.filter(host => host.dataset.sky === slot).map(host => host.dataset.placement).sort();
      if (ids.join(',') !== 'asc,dsc,ic,mc') issues.push(`Sky ${slot} Angle identities are ${ids.join(',') || '(none)'}`);
    }

    const angleBoxes = [];
    hosts.forEach((host,index) => {
      const id = host.dataset.placement || '';
      const slot = host.dataset.sky || '';
      const root = canonicalRoot(host);
      auditMaster(root,issues,`Wheel Angle ${slot} ${id}`);
      if (!ANGLES.has(id)) issues.push(`Wheel Angle ${index + 1} has invalid identity ${id}`);
      if (!hiddenCircle(root)) issues.push(`Wheel Angle ${slot} ${id} is inside a visible bubble`);
      if (host.dataset.canonicalMaster !== 'glyphs-unified-preview.html') issues.push(`Wheel Angle ${slot} ${id} does not name the Master Glyph List`);
      if (host.dataset.canonicalViewbox !== '-32 -32 64 64') issues.push(`Wheel Angle ${slot} ${id} lost the master stage viewBox`);

      const lane = Number(host.dataset.angleLane);
      const longitude = Number(host.dataset.angleLongitude);
      const transform = /translate\(([-\d.]+)\s+([-\d.]+)\)/.exec(host.getAttribute('transform') || '');
      const x = transform ? Number(transform[1]) : NaN;
      const y = transform ? Number(transform[2]) : NaN;
      const radius = Math.hypot(x - CENTER.x,y - CENTER.y);
      const band = SKY_BANDS[slot];
      if (!band || !Number.isFinite(lane) || lane <= band[0] || lane >= band[1]) issues.push(`Wheel Angle ${slot} ${id} is outside its sky-owned band`);
      if (!Number.isFinite(radius) || Math.abs(radius - lane) > 0.25) issues.push(`Wheel Angle ${slot} ${id} is not centered on its declared radial lane`);
      if (!Number.isFinite(longitude) || angularDifference(polarAngle(x,y),longitude) > 0.01) issues.push(`Wheel Angle ${slot} ${id} moved off its exact longitude`);

      const lines = Array.from(chart.querySelectorAll(`[data-layer="leaders"] .sky-foundation-angle-axis[data-sky="${slot}"][data-angle="${id}"]`));
      if (lines.length !== 2) issues.push(`Wheel Angle ${slot} ${id} has ${lines.length} axis segments instead of 2`);
      lines.forEach(line => {
        const stated = Number(line.dataset.exactLongitude);
        if (!Number.isFinite(stated) || angularDifference(stated,longitude) > 1e-5) issues.push(`Wheel Angle ${slot} ${id} line longitude changed`);
        const endpointAngles = [polarAngle(Number(line.getAttribute('x1')),Number(line.getAttribute('y1'))),polarAngle(Number(line.getAttribute('x2')),Number(line.getAttribute('y2')))];
        if (endpointAngles.some(value => angularDifference(value,longitude) > 0.01)) issues.push(`Wheel Angle ${slot} ${id} line is not radial at the exact longitude`);
        const stroke = getComputedStyle(line).stroke;
        if (SKY_COLORS[slot] && stroke !== SKY_COLORS[slot]) issues.push(`Wheel Angle ${slot} ${id} line has the wrong sky color`);
      });

      const glyph = art(root);
      const colorNode = glyph?.querySelector('[fill]:not([fill="none"]),[stroke]:not([stroke="none"])');
      const displayed = colorNode ? (getComputedStyle(colorNode).fill !== 'none' && getComputedStyle(colorNode).fill !== 'rgba(0, 0, 0, 0)' ? getComputedStyle(colorNode).fill : getComputedStyle(colorNode).stroke) : '';
      if (SKY_COLORS[slot] && displayed && displayed !== SKY_COLORS[slot]) issues.push(`Wheel Angle ${slot} ${id} glyph has the wrong sky color`);

      angleBoxes.push({host,id,slot,box:host.getBoundingClientRect()});
    });

    for (let i=0;i<angleBoxes.length;i+=1) {
      for (let j=i+1;j<angleBoxes.length;j+=1) {
        if (boxesOverlap(angleBoxes[i].box,angleBoxes[j].box,2)) issues.push(`Angle labels overlap: Sky ${angleBoxes[i].slot} ${angleBoxes[i].id} and Sky ${angleBoxes[j].slot} ${angleBoxes[j].id}`);
      }
    }

    const obstacles = Array.from(chart.querySelectorAll(
      '[data-layer="placements"] > g[data-placement]:not([data-angle-axis="true"]),[data-layer="zodiac"] > g,.sky-foundation-house-number'
    )).map(node => ({node,box:node.getBoundingClientRect()}));
    angleBoxes.forEach(angle => obstacles.forEach(obstacle => {
      if (boxesOverlap(angle.box,obstacle.box,2)) issues.push(`Wheel Angle ${angle.slot} ${angle.id} overlaps ${obstacle.node.matches('.sky-foundation-house-number') ? 'a house number' : obstacle.node.closest('[data-layer="zodiac"]') ? 'a zodiac glyph' : 'a placement bubble'}`);
    }));
  }

  function run() {
    timer = 0;
    const issues = [];
    const component = window.RelphiGlyphComponent;
    if (!component?.skyWhitespaceAware) issues.push('Whitespace-aware Master Glyph List wrapper is not active');
    if (window.__relphiNeptuneCrossConnectionInstalled) issues.push('Neptune-specific rendering wrapper is active');

    document.querySelectorAll('.relphi-glyph-bubble').forEach((root,index) => auditMaster(root,issues,`Glyph ${index + 1}`));

    document.querySelectorAll('[data-layer="placements"] > g[data-placement]:not([data-angle-axis="true"])').forEach((host,index) => {
      const root = canonicalRoot(host);
      if (!root || hiddenCircle(root)) issues.push(`Ordinary wheel placement ${index + 1} is not using the visible master bubble`);
    });

    auditAngles(issues);

    const requiredSeen = new Set();
    document.querySelectorAll('.relphi-canonical-glyph').forEach(node => {
      for (const id of REQUIRED) if (node.classList.contains(`relphi-glyph-${id}`)) requiredSeen.add(id);
    });
    for (const id of REQUIRED) if (!requiredSeen.has(id)) issues.push(`Required identity ${id} is not rendered in the current chart`);

    const unique = Array.from(new Set(issues));
    const signature = JSON.stringify(unique);
    document.documentElement.dataset.skyGlyphAudit = unique.length ? 'failed' : 'passed';
    document.documentElement.dataset.skyGlyphAuditCount = String(unique.length);
    window.__relphiSkyGlyphAuditIssues = unique;
    if (signature !== lastSignature && unique.length) console.error('Sky Chart canonical glyph audit failed:', unique);
    lastSignature = signature;
    window.dispatchEvent(new CustomEvent('relphi:sky-glyph-audit-complete',{detail:{passed:!unique.length,issues:unique.slice()}}));
    return unique;
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(run)),120);
  }

  window.RelphiSkyGlyphAudit = Object.freeze({ run, get lastIssues(){ return (window.__relphiSkyGlyphAuditIssues || []).slice(); } });

  function start() {
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
    ['relphi:sky-foundation-ready','relphi:selected-relationship-rendered','relphi:sky-heptagram-source-ready','relphi:glyph-atomic-committed']
      .forEach(name => window.addEventListener(name,schedule));
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
