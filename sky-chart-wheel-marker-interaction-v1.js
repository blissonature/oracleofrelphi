// SkyChart canonical marker interaction: keep placement text hidden until a glyph is engaged.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const WHEEL_SELECTOR = '.unified-sky-wheel svg,#chartOutput svg,#currentSkyOutput svg,.sky-output-box svg';
  const PLACEMENT_SELECTOR = '.chart-wheel-placement-stick';
  const HOST_SELECTOR = '.relphi-canonical-marker-host';
  const TOOLTIP_ID = 'relphi-sky-marker-tooltip';
  let pinnedHost = null;
  let activeHost = null;
  let observerQueued = false;

  function bare(value) {
    return String(value || '').replace(/[\uFE0E\uFE0F]/g, '').replace(/\s+/g, ' ').trim();
  }

  function ensureStyles() {
    let style = document.getElementById('relphi-sky-marker-interaction-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'relphi-sky-marker-interaction-style';
      document.head.appendChild(style);
    }
    style.textContent = [
      'svg.relphi-canonical-ready ' + PLACEMENT_SELECTOR + ' text{display:none!important;visibility:hidden!important;opacity:0!important}',
      '.relphi-canonical-marker-layer{pointer-events:none!important}',
      HOST_SELECTOR + '{pointer-events:all!important;cursor:pointer;outline:none}',
      HOST_SELECTOR + ':focus .relphi-glyph-bubble>circle,' + HOST_SELECTOR + ':hover .relphi-glyph-bubble>circle{stroke-width:3!important}',
      '#' + TOOLTIP_ID + '{position:fixed;z-index:10000;display:none;max-width:min(280px,calc(100vw - 24px));padding:.58rem .72rem;border:1.5px solid rgba(17,17,17,.3);border-radius:.8rem;background:rgba(255,255,255,.98);box-shadow:0 8px 26px rgba(0,0,0,.18);color:#111;font:600 13px/1.35 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;pointer-events:none}',
      '#' + TOOLTIP_ID + '[data-open="true"]{display:block}',
      '#' + TOOLTIP_ID + ' strong{display:block;margin:0 0 .15rem;font-size:14px}',
      '#' + TOOLTIP_ID + ' span{display:block;font-weight:500;color:#333}'
    ].join('');
  }

  function ensureTooltip() {
    let tooltip = document.getElementById(TOOLTIP_ID);
    if (tooltip) return tooltip;
    tooltip = document.createElement('div');
    tooltip.id = TOOLTIP_ID;
    tooltip.setAttribute('role', 'tooltip');
    tooltip.setAttribute('aria-hidden', 'true');
    tooltip.innerHTML = '<strong></strong><span></span>';
    document.body.appendChild(tooltip);
    return tooltip;
  }

  function skyIdentity(group) {
    const signature = [
      group.className && group.className.baseVal,
      group.dataset && group.dataset.sky,
      group.dataset && group.dataset.slot,
      group.dataset && group.dataset.kind,
      group.getAttribute && group.getAttribute('aria-label')
    ].filter(Boolean).join(' ').toLowerCase();
    if (/(sky.?c|third)/.test(signature)) return 'skyC';
    if (/(sky.?b|current.?sky|comparison|blue)/.test(signature)) return 'skyB';
    return 'skyA';
  }

  function detailFromGroup(group, fallbackName) {
    const nameNode = group.querySelector('.chart-wheel-marker-name,[data-body-name],[data-planet-name]');
    const name = bare(nameNode && nameNode.textContent) || bare(fallbackName) || 'Placement';
    const data = group.dataset || {};
    const sign = bare(data.sign || data.zodiacSign || group.getAttribute('data-sign'));
    const degree = bare(data.degree || data.degrees || group.getAttribute('data-degree'));
    const minute = bare(data.minute || data.minutes || group.getAttribute('data-minute'));
    const explicit = [sign, degree && /°/.test(degree) ? degree : degree ? degree + '°' : '', minute && /[′\']/.test(minute) ? minute : minute ? minute + '′' : ''].filter(Boolean).join(' ');

    const ignored = new Set([name]);
    const glyphNode = group.querySelector('.chart-wheel-marker-glyph,[data-glyph-id]');
    if (glyphNode) ignored.add(bare(glyphNode.textContent));
    const textParts = Array.from(group.querySelectorAll('text'))
      .map(function (node) { return bare(node.textContent); })
      .filter(Boolean)
      .filter(function (value) { return !ignored.has(value); });
    const unique = Array.from(new Set(textParts));
    const placement = explicit || unique.join(' · ');
    return { name:name, placement:placement };
  }

  function hydrateWheel(svg) {
    const groups = Array.from(svg.querySelectorAll(PLACEMENT_SELECTOR));
    const hosts = Array.from(svg.querySelectorAll(HOST_SELECTOR));
    hosts.forEach(function (host, index) {
      const group = groups[index];
      const detail = group ? detailFromGroup(group, host.getAttribute('aria-label')) : { name:bare(host.getAttribute('aria-label')) || 'Placement', placement:'' };
      host.dataset.markerName = detail.name;
      host.dataset.markerPlacement = detail.placement;
      host.setAttribute('tabindex', '0');
      host.setAttribute('role', 'button');
      host.setAttribute('aria-describedby', TOOLTIP_ID);
      host.setAttribute('aria-label', detail.placement ? detail.name + ', ' + detail.placement : detail.name);
    });
  }

  function hydrate() {
    observerQueued = false;
    document.querySelectorAll(WHEEL_SELECTOR).forEach(hydrateWheel);
  }

  function scheduleHydrate() {
    if (observerQueued) return;
    observerQueued = true;
    requestAnimationFrame(hydrate);
  }

  function positionTooltip(host, event) {
    const tooltip = ensureTooltip();
    const rect = host.getBoundingClientRect();
    const x = event && Number.isFinite(event.clientX) ? event.clientX : rect.left + rect.width / 2;
    const y = event && Number.isFinite(event.clientY) ? event.clientY : rect.top;
    const margin = 12;
    tooltip.style.left = Math.max(margin, Math.min(window.innerWidth - tooltip.offsetWidth - margin, x + 12)) + 'px';
    tooltip.style.top = Math.max(margin, Math.min(window.innerHeight - tooltip.offsetHeight - margin, y - tooltip.offsetHeight - 12)) + 'px';
  }

  function show(host, event) {
    if (!host) return;
    const tooltip = ensureTooltip();
    tooltip.querySelector('strong').textContent = host.dataset.markerName || host.getAttribute('aria-label') || 'Placement';
    tooltip.querySelector('span').textContent = host.dataset.markerPlacement || '';
    tooltip.querySelector('span').hidden = !host.dataset.markerPlacement;
    tooltip.dataset.open = 'true';
    tooltip.setAttribute('aria-hidden', 'false');
    activeHost = host;
    requestAnimationFrame(function () { positionTooltip(host, event); });
  }

  function hide(force) {
    if (pinnedHost && !force) return;
    const tooltip = ensureTooltip();
    tooltip.dataset.open = 'false';
    tooltip.setAttribute('aria-hidden', 'true');
    activeHost = null;
  }

  function hostFromEvent(event) {
    return event.target && event.target.closest && event.target.closest(HOST_SELECTOR);
  }

  function installEvents() {
    document.addEventListener('pointerover', function (event) {
      const host = hostFromEvent(event);
      if (!host || host.contains(event.relatedTarget)) return;
      if (!pinnedHost) show(host, event);
    });
    document.addEventListener('pointermove', function (event) {
      const host = hostFromEvent(event);
      if (host && host === activeHost && !pinnedHost) positionTooltip(host, event);
    });
    document.addEventListener('pointerout', function (event) {
      const host = hostFromEvent(event);
      if (!host || host.contains(event.relatedTarget)) return;
      hide(false);
    });
    document.addEventListener('focusin', function (event) {
      const host = hostFromEvent(event);
      if (host) show(host);
    });
    document.addEventListener('focusout', function (event) {
      const host = hostFromEvent(event);
      if (host && !pinnedHost) hide(false);
    });
    document.addEventListener('click', function (event) {
      const host = hostFromEvent(event);
      if (host) {
        event.preventDefault();
        pinnedHost = pinnedHost === host ? null : host;
        if (pinnedHost) show(host, event); else hide(true);
        return;
      }
      if (pinnedHost) {
        pinnedHost = null;
        hide(true);
      }
    });
    document.addEventListener('keydown', function (event) {
      const host = hostFromEvent(event);
      if (host && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        pinnedHost = pinnedHost === host ? null : host;
        if (pinnedHost) show(host); else hide(true);
      }
      if (event.key === 'Escape') {
        pinnedHost = null;
        hide(true);
      }
    });
    window.addEventListener('resize', function () {
      if (activeHost) positionTooltip(activeHost);
    }, { passive:true });
  }

  function install() {
    ensureStyles();
    ensureTooltip();
    scheduleHydrate();
    installEvents();
    new MutationObserver(scheduleHydrate).observe(document.body, { childList:true, subtree:true });
    window.addEventListener('relphi:sky-builder-v4-loaded', scheduleHydrate);
    window.addEventListener('relphi:extra-points-updated', scheduleHydrate);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once:true });
  else install();
})();