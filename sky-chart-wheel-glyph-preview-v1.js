// Branch-only preview interactions. Layout is owned exclusively by the tuning script.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const PLACEMENT = '.chart-wheel-placement-stick';
  let tooltip = null;
  let pinned = null;

  function appendOnce(src) {
    const base = src.split('?')[0];
    if (document.querySelector('script[src^="' + base + '"]')) return;
    const script = document.createElement('script');
    script.async = false;
    script.src = src;
    document.body.appendChild(script);
  }

  function bare(value) {
    return String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim();
  }

  function markerColor(group) {
    return group.classList.contains('sky-b') ? '#3166e2' : '#dc1f18';
  }

  function placementLabel(group) {
    const name = bare(group.querySelector('.chart-wheel-marker-name')?.textContent) ||
      bare(group.dataset.body) || bare(group.dataset.placement) || 'Placement';
    const degree = bare(group.querySelector('.chart-wheel-marker-degree')?.textContent);
    return degree ? name + ' · ' + degree : name;
  }

  function installPreviewGuard() {
    if (!document.querySelector('meta[name="robots"]')) {
      const meta = document.createElement('meta');
      meta.name = 'robots';
      meta.content = 'noindex,nofollow,noarchive';
      document.head.appendChild(meta);
    }
    if (document.getElementById('relphiPreviewBadge')) return;
    const badge = document.createElement('div');
    badge.id = 'relphiPreviewBadge';
    badge.textContent = 'PRIVATE TEST PREVIEW · NOT PRODUCTION';
    Object.assign(badge.style, {
      position:'fixed', left:'10px', bottom:'10px', zIndex:'99999',
      padding:'7px 10px', borderRadius:'999px', background:'#111', color:'#fff',
      font:'700 11px/1.1 system-ui,sans-serif', letterSpacing:'.04em', opacity:'.88',
      pointerEvents:'none'
    });
    document.body.appendChild(badge);
  }

  function ensureTooltip() {
    if (tooltip) return tooltip;
    tooltip = document.createElement('div');
    tooltip.id = 'relphiWheelPreviewTooltip';
    tooltip.setAttribute('role', 'status');
    Object.assign(tooltip.style, {
      position:'fixed', zIndex:'99998', display:'none', maxWidth:'220px',
      padding:'8px 11px', border:'2px solid #111', borderRadius:'12px',
      background:'rgba(255,255,255,.98)', color:'#111', boxShadow:'0 5px 18px rgba(0,0,0,.18)',
      font:'750 13px/1.25 system-ui,sans-serif', textAlign:'center', pointerEvents:'none'
    });
    document.body.appendChild(tooltip);
    return tooltip;
  }

  function show(group) {
    const node = ensureTooltip();
    const knob = group.querySelector('.chart-wheel-stick-knob') || group;
    const rect = knob.getBoundingClientRect();
    node.textContent = placementLabel(group);
    node.style.borderColor = markerColor(group);
    node.style.display = 'block';
    const own = node.getBoundingClientRect();
    node.style.left = Math.max(8, Math.min(innerWidth - own.width - 8, rect.left + rect.width / 2 - own.width / 2)) + 'px';
    node.style.top = Math.max(8, rect.top - own.height - 10) + 'px';
    group.classList.add('is-preview-active');
  }

  function clear(group) {
    group?.classList.remove('is-preview-active');
    if (tooltip) tooltip.style.display = 'none';
  }

  function wire(group) {
    if (group.dataset.previewInteractionWired) return;
    group.dataset.previewInteractionWired = 'true';
    group.setAttribute('tabindex', '0');
    group.setAttribute('role', 'button');
    group.setAttribute('aria-label', placementLabel(group));
    const targets = [group.querySelector('.chart-wheel-stick-knob'), group.querySelector('.chart-wheel-stick')].filter(Boolean);
    targets.forEach(function (target) {
      target.style.cursor = 'pointer';
      target.addEventListener('pointerenter', function () { if (!pinned) show(group); });
      target.addEventListener('pointerleave', function () { if (!pinned) clear(group); });
      target.addEventListener('click', function (event) {
        event.stopPropagation();
        if (pinned === group) { pinned = null; clear(group); }
        else { if (pinned) clear(pinned); pinned = group; show(group); }
      });
    });
    group.addEventListener('focus', function () { if (!pinned) show(group); });
    group.addEventListener('blur', function () { if (!pinned) clear(group); });
  }

  function run() {
    installPreviewGuard();
    document.querySelectorAll(PLACEMENT).forEach(wire);
  }

  function install() {
    appendOnce('sky-chart-wheel-glyph-preview-fixes-v1.js?v=1');
    run();
    window.addEventListener('relphi:sky-builder-v4-loaded', run);
    document.addEventListener('click', function () { if (pinned) { clear(pinned); pinned = null; } });
    new MutationObserver(function (records) {
      if (records.some(function (record) {
        return Array.from(record.addedNodes || []).some(function (node) {
          return node.nodeType === Node.ELEMENT_NODE && (node.matches?.(PLACEMENT) || node.querySelector?.(PLACEMENT));
        });
      })) run();
    }).observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();
