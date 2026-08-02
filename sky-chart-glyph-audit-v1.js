// Runtime audit for every canonical glyph presentation used by Sky Chart.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyGlyphAuditV1) return;
  window.__relphiSkyGlyphAuditV1 = true;

  let timer = 0;
  let lastSignature = '';

  function resolved(id) {
    const registry = window.RelphiGlyphRegistry;
    return registry && (registry.get(id) || registry.resolve(id));
  }

  function glyphArt(root) {
    return Array.from(root?.children || []).find(node => node.classList?.contains('relphi-canonical-glyph')) || null;
  }

  function calibrationCircle(root) {
    return root?.querySelector?.(':scope > circle') || null;
  }

  function circleIsHidden(root) {
    const circle = calibrationCircle(root);
    if (!circle) return false;
    const opacityAttribute = circle.getAttribute('opacity');
    const opacity = opacityAttribute == null ? NaN : Number(opacityAttribute);
    const styleOpacity = Number.parseFloat(circle.style.opacity || '');
    return opacity === 0 || styleOpacity === 0 || circle.closest('svg')?.dataset?.canonicalCircle === 'hidden';
  }

  function rootIsFramed(root) {
    return !!root && (
      root.classList.contains('relphi-glyph-framed') ||
      root.dataset.canonicalFraming === 'hidden-bubble' ||
      circleIsHidden(root)
    );
  }

  function auditBubble(root, issues) {
    const id = root?.dataset?.glyphId || '';
    const entry = resolved(id);
    if (!entry) {
      issues.push(`Unresolved glyph bubble identity: ${id || '(missing)'}`);
      return;
    }

    const art = glyphArt(root);
    if (!art) {
      issues.push(`Missing canonical artwork for ${entry.id}`);
      return;
    }
    if (!art.classList.contains(`relphi-glyph-${entry.id}`)) {
      issues.push(`Canonical artwork mismatch: expected ${entry.id}`);
    }
    if (entry.asset && art.querySelector('text')) {
      issues.push(`Asset-backed glyph ${entry.id} rendered as text`);
    }

    if (rootIsFramed(root)) {
      if (!calibrationCircle(root) || !circleIsHidden(root)) {
        issues.push(`Uncircled glyph ${entry.id} lost its hidden calibration frame`);
      }
      const host = root.closest('svg');
      if (
        art.dataset.relphiWhitespaceAware !== 'true' &&
        host?.dataset?.canonicalCircle !== 'hidden'
      ) {
        issues.push(`Uncircled glyph ${entry.id} is not marked whitespace-aware`);
      }
    }
  }

  function requireFramed(host, label, issues) {
    const root = host.querySelector('.relphi-glyph-bubble');
    if (!rootIsFramed(root)) {
      issues.push(`${label} is not using the hidden canonical bubble frame`);
    }
  }

  function requireVisibleBubble(host, label, issues) {
    const root = host.querySelector('.relphi-glyph-bubble');
    if (!root || rootIsFramed(root)) issues.push(`${label} is not using the visible canonical bubble`);
  }

  function run() {
    timer = 0;
    const issues = [];
    const component = window.RelphiGlyphComponent;
    if (!component?.skyWhitespaceAware) {
      issues.push('The Sky Chart whitespace-aware glyph wrapper is not active');
    }

    document.querySelectorAll('.relphi-glyph-bubble').forEach(root => auditBubble(root, issues));

    document.querySelectorAll('.sky-foundation-ledger .sky-foundation-row > svg').forEach((host, index) => {
      requireFramed(host, `Placement ledger glyph ${index + 1}`, issues);
    });
    document.querySelectorAll('[data-layer="zodiac"] > g').forEach((host, index) => {
      requireFramed(host, `Zodiac wheel glyph ${index + 1}`, issues);
    });
    document.querySelectorAll('.sky-foundation-relationship-row > svg').forEach((host, index) => {
      requireFramed(host, `Relationship-list glyph ${index + 1}`, issues);
    });
    document.querySelectorAll('.sky-selected-reveal-glyph svg').forEach(host => {
      requireFramed(host, 'Selected-relationship reveal glyph', issues);
    });
    document.querySelectorAll('.sky-progressive-token[data-progressive-glyph-id] svg').forEach((host, index) => {
      requireFramed(host, `Progressive-reading glyph ${index + 1}`, issues);
    });

    document.querySelectorAll('[data-layer="placements"] > g[data-placement]').forEach((host, index) => {
      requireVisibleBubble(host, `Wheel placement glyph ${index + 1}`, issues);
    });
    document.querySelectorAll('.sky-selected-graphic [data-selected-graphic-a],.sky-selected-graphic [data-selected-graphic-aspect],.sky-selected-graphic [data-selected-graphic-b]').forEach((host, index) => {
      requireVisibleBubble(host, `Selected-relationship header glyph ${index + 1}`, issues);
    });
    document.querySelectorAll('.sky-ph-node-glyph').forEach((host, index) => {
      if (host.closest('.sky-ph-heptagram')?.dataset.canonicalHeptagramV1 === 'true') {
        requireVisibleBubble(host, `Planetary Hours glyph ${index + 1}`, issues);
      }
    });

    const unique = Array.from(new Set(issues));
    const signature = JSON.stringify(unique);
    document.documentElement.dataset.skyGlyphAudit = unique.length ? 'failed' : 'passed';
    document.documentElement.dataset.skyGlyphAuditCount = String(unique.length);
    window.__relphiSkyGlyphAuditIssues = unique;
    if (signature !== lastSignature && unique.length) {
      console.error('Sky Chart canonical glyph audit failed:', unique);
    }
    lastSignature = signature;
    window.dispatchEvent(new CustomEvent('relphi:sky-glyph-audit-complete', {
      detail:{ passed:!unique.length, issues:unique.slice() }
    }));
    return unique;
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(run)), 120);
  }

  window.RelphiSkyGlyphAudit = Object.freeze({
    run,
    get lastIssues() { return (window.__relphiSkyGlyphAuditIssues || []).slice(); }
  });

  const observer = new MutationObserver(schedule);
  function start() {
    observer.observe(document.documentElement, { childList:true, subtree:true });
    ['relphi:sky-foundation-ready','relphi:selected-relationship-rendered','relphi:sky-heptagram-source-ready']
      .forEach(name => window.addEventListener(name, schedule));
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
