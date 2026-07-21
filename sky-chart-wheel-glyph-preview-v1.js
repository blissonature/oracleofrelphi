// Branch-only preview interactions. Layout, glyph placement, and leaders belong exclusively to the preview renderer.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const PLACEMENT = '.chart-wheel-placement-stick';
  const SIGN_GLYPHS = {
    Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍',
    Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓'
  };
  let tooltip = null;
  let pinned = null;

  function bare(value) {
    return String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim();
  }

  function markerColor(group) {
    return group.classList.contains('sky-b') ? '#3166e2' : '#dc1f18';
  }

  function installPreviewGuard() {
    if (!document.querySelector('meta[name="robots"]')) {
      const meta = document.createElement('meta');
      meta.name = 'robots';
      meta.content = 'noindex,nofollow,noarchive';
      document.head.appendChild(meta);
    }
    if (!document.getElementById('relphiPreviewBadge')) {
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
  }

  function installInteractionStyle() {
    if (document.getElementById('relphiWheelInteractionStyle')) return;
    const style = document.createElement('style');
    style.id = 'relphiWheelInteractionStyle';
    style.textContent = `
      .chart-wheel-placement-stick{cursor:pointer}
      .chart-wheel-placement-stick.is-preview-active{opacity:1!important}
      .chart-wheel-placement-stick.is-preview-active .chart-wheel-stick-knob{
        fill:#fff!important;fill-opacity:1!important;stroke-opacity:1!important
      }
      .chart-wheel-placement-stick.is-preview-active .chart-wheel-stick,
      .chart-wheel-placement-stick.is-preview-active .chart-wheel-marker-glyph,
      .chart-wheel-placement-stick.is-preview-active svg.relphi-bold-inline-glyph{
        opacity:1!important
      }
    `;
    document.head.appendChild(style);
  }

  function placementData(group) {
    const name = bare(group.querySelector('.chart-wheel-marker-name')?.textContent) ||
      bare(group.dataset.body) || bare(group.dataset.placement) || 'Placement';
    const degreeText = bare(group.querySelector('.chart-wheel-marker-degree')?.textContent);
    const signName = bare(group.dataset.sign || group.querySelector('.chart-wheel-marker-sign')?.textContent);
    const signGlyph = SIGN_GLYPHS[signName] || (/^[♈-♓]$/.test(signName) ? signName : '');
    return { name:name, degree:degreeText, signGlyph:signGlyph };
  }

  function placementLabel(group) {
    const data = placementData(group);
    const coordinate = [data.signGlyph, data.degree].filter(Boolean).join(' ');
    return coordinate ? data.name + ' · ' + coordinate : data.name;
  }

  function ensureTooltip() {
    if (tooltip) return tooltip;
    tooltip = document.createElement('div');
    tooltip.id = 'relphiWheelPreviewTooltip';
    tooltip.setAttribute('role', 'status');
    Object.assign(tooltip.style, {
      position:'fixed', zIndex:'99998', display:'none', maxWidth:'220px',
      padding:'8px 11px', border:'2px solid #111', borderRadius:'12px',
      background:'#fff', color:'#111', boxShadow:'0 5px 18px rgba(0,0,0,.18)',
      font:'750 13px/1.25 system-ui,sans-serif', textAlign:'center', pointerEvents:'none'
    });
    document.body.appendChild(tooltip);
    return tooltip;
  }

  function raise(group) {
    if (group.dataset.relphiInteractionRaised === 'true') return;
    const parent = group.parentNode;
    if (!parent) return;
    const marker = document.createComment('relphi-interaction-order');
    parent.insertBefore(marker, group);
    group.__relphiInteractionMarker = marker;
    group.dataset.relphiInteractionRaised = 'true';
    parent.appendChild(group);
  }

  function restore(group) {
    const marker = group && group.__relphiInteractionMarker;
    if (marker?.parentNode) marker.parentNode.replaceChild(group, marker);
    if (group) {
      delete group.__relphiInteractionMarker;
      delete group.dataset.relphiInteractionRaised;
    }
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
    raise(group);
    group.classList.add('is-preview-active');
  }

  function clear(group) {
    if (!group) return;
    group.classList.remove('is-preview-active');
    restore(group);
    if (tooltip) tooltip.style.display = 'none';
  }

  function wire(group) {
    if (group.dataset.previewInteractionWired) return;
    group.dataset.previewInteractionWired = 'true';
    group.setAttribute('tabindex', '0');
    group.setAttribute('role', 'button');
    group.setAttribute('aria-label', placementLabel(group));

    group.addEventListener('pointerenter', function () { if (!pinned) show(group); });
    group.addEventListener('pointerleave', function () { if (!pinned) clear(group); });
    group.addEventListener('click', function (event) {
      event.stopPropagation();
      if (pinned === group) {
        pinned = null;
        clear(group);
      } else {
        if (pinned) clear(pinned);
        pinned = group;
        show(group);
      }
    });
    group.addEventListener('focusin', function () { if (!pinned) show(group); });
    group.addEventListener('focusout', function () { if (!pinned) clear(group); });
  }

  function scan(root) {
    if (root.matches?.(PLACEMENT)) wire(root);
    root.querySelectorAll?.(PLACEMENT).forEach(wire);
  }

  function install() {
    installPreviewGuard();
    installInteractionStyle();
    scan(document);
    window.addEventListener('relphi:sky-builder-v4-loaded', function () { scan(document); });
    document.addEventListener('click', function () {
      if (pinned) {
        const current = pinned;
        pinned = null;
        clear(current);
      }
    });
    new MutationObserver(function (records) {
      records.forEach(function (record) {
        Array.from(record.addedNodes || []).forEach(function (node) {
          if (node instanceof Element) scan(node);
        });
      });
    }).observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();