// Preview-only optical sizing for special points and zodiac glyphs in hover labels.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const PLACEMENT = '.chart-wheel-placement-stick';
  const SIGN_GLYPHS = {
    Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍',
    Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓'
  };
  const SPECIAL_SIZES = {
    'north node':'22px',
    'south node':'22px',
    'lilith':'24px',
    'part of fortune':'22px',
    'vertex':'16px',
    'ic':'16px',
    'dsc':'13.5px',
    'descendant':'13.5px'
  };
  let queued = false;

  function bare(value) {
    return String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim();
  }

  function placementName(group) {
    return bare(group.querySelector('.chart-wheel-marker-name')?.textContent) ||
      bare(group.dataset.body) || bare(group.dataset.placement) || '';
  }

  function readSlot(group) {
    const key = group.classList.contains('sky-b') ? 'relphiSkyChartB' : 'relphiSkyChartA';
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch (_) { return null; }
  }

  function placementMap(payload) {
    return payload && (payload.placements || payload) || {};
  }

  function storedPlacement(group) {
    const map = placementMap(readSlot(group));
    const wanted = placementName(group).toLowerCase();
    const aliases = wanted === 'asc' ? ['asc','rising','ascendant','ac'] :
      wanted === 'dsc' ? ['dsc','descendant'] :
      wanted === 'mc' ? ['mc','midheaven'] :
      wanted === 'ic' ? ['ic','imum coeli'] : [wanted];
    const key = Object.keys(map).find(function (candidate) {
      return aliases.includes(String(candidate).trim().toLowerCase());
    });
    return key ? map[key] : null;
  }

  function signGlyph(group) {
    const direct = bare(group.dataset.sign || group.dataset.zodiac || group.dataset.signName);
    if (SIGN_GLYPHS[direct]) return SIGN_GLYPHS[direct];
    const item = storedPlacement(group);
    return SIGN_GLYPHS[bare(item && item.sign)] || '';
  }

  function opticalSize(group) {
    const name = placementName(group).toLowerCase();
    const size = SPECIAL_SIZES[name];
    if (!size) return;
    const text = group.querySelector('.chart-wheel-marker-glyph');
    if (!text) return;
    text.style.setProperty('font-size', size, 'important');
    text.style.setProperty('font-weight', name === 'vertex' || name === 'ic' || name === 'dsc' || name === 'descendant' ? '750' : '850', 'important');
    text.style.setProperty('letter-spacing', name === 'dsc' || name === 'descendant' ? '-0.04em' : '0', 'important');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
  }

  function updateTooltip(group) {
    const tooltip = document.getElementById('relphiWheelPreviewTooltip');
    if (!tooltip || !group) return;
    const name = placementName(group) || 'Placement';
    const degree = bare(group.querySelector('.chart-wheel-marker-degree')?.textContent);
    const glyph = signGlyph(group);
    tooltip.textContent = degree ? name + ' · ' + (glyph ? glyph + ' ' : '') + degree : name;
    group.setAttribute('aria-label', tooltip.textContent);
  }

  function run() {
    queued = false;
    document.querySelectorAll(PLACEMENT).forEach(opticalSize);
  }

  function schedule() {
    if (queued) return;
    queued = true;
    queueMicrotask(run);
  }

  document.addEventListener('pointerover', function (event) {
    const group = event.target.closest?.(PLACEMENT);
    if (group) queueMicrotask(function () { updateTooltip(group); });
  }, true);
  document.addEventListener('focusin', function (event) {
    const group = event.target.closest?.(PLACEMENT);
    if (group) queueMicrotask(function () { updateTooltip(group); });
  }, true);

  window.addEventListener('relphi:sky-builder-v4-loaded', schedule);
  window.addEventListener('relphi:extra-points-updated', schedule);
  new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true });
  schedule();
})();