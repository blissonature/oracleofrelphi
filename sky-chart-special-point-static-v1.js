// Preview-only static special-point glyph correction. No observer and no repeated layout work.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const PLACEMENT = '.chart-wheel-placement-stick';
  const SYMBOLS = {
    'north node':'☊',
    'south node':'☋',
    'part of fortune':'⊗',
    'lilith':'⚸'
  };
  const TEXT_STYLE = {
    'asc':{ size:'13px', weight:'650' },
    'rising':{ size:'13px', weight:'650' },
    'mc':{ size:'13px', weight:'650' },
    'ic':{ size:'13px', weight:'650' },
    'dsc':{ size:'12px', weight:'600' },
    'descendant':{ size:'12px', weight:'600' },
    'vertex':{ size:'12px', weight:'600' }
  };

  function bare(value) {
    return String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim();
  }

  function name(group) {
    return (bare(group.querySelector('.chart-wheel-marker-name')?.textContent) ||
      bare(group.dataset.body) || bare(group.dataset.placement) || '').toLowerCase();
  }

  function apply(group) {
    if (group.dataset.relphiStaticSpecialApplied === 'true') return;
    const text = group.querySelector('.chart-wheel-marker-glyph');
    if (!text) return;
    const key = name(group);
    if (SYMBOLS[key]) {
      text.textContent = SYMBOLS[key];
      text.style.setProperty('font-size', key === 'lilith' ? '20px' : '19px', 'important');
      text.style.setProperty('font-weight', '500', 'important');
    } else if (TEXT_STYLE[key]) {
      text.style.setProperty('font-size', TEXT_STYLE[key].size, 'important');
      text.style.setProperty('font-weight', TEXT_STYLE[key].weight, 'important');
      text.style.setProperty('letter-spacing', '0', 'important');
    } else {
      return;
    }
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    group.dataset.relphiStaticSpecialApplied = 'true';
  }

  function run() {
    document.querySelectorAll(PLACEMENT).forEach(apply);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once:true });
  else run();
  window.addEventListener('relphi:sky-builder-v4-loaded', run);
  window.addEventListener('relphi:extra-points-updated', run);
})();
