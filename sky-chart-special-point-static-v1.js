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
  const ABBREVIATION_SYMBOLS = {
    'no':'☊',
    'so':'☋',
    'pa':'⊗'
  };
  const TEXT_STYLE = {
    'asc':{ size:'13px', weight:'650', text:'ASC' },
    'rising':{ size:'13px', weight:'650', text:'ASC' },
    'mc':{ size:'13px', weight:'650', text:'MC' },
    'ic':{ size:'13px', weight:'650', text:'IC' },
    'dsc':{ size:'12px', weight:'600', text:'DSC' },
    'descendant':{ size:'12px', weight:'600', text:'DSC' },
    'vertex':{ size:'12px', weight:'600', text:'Vx' }
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
    const visible = bare(text.textContent).toLowerCase();
    const symbol = SYMBOLS[key] || ABBREVIATION_SYMBOLS[visible];

    if (symbol) {
      text.textContent = symbol;
      text.style.setProperty('font-size', symbol === '⚸' ? '20px' : '19px', 'important');
      text.style.setProperty('font-weight', '500', 'important');
    } else if (TEXT_STYLE[key]) {
      text.textContent = TEXT_STYLE[key].text;
      text.style.setProperty('font-size', TEXT_STYLE[key].size, 'important');
      text.style.setProperty('font-weight', TEXT_STYLE[key].weight, 'important');
      text.style.setProperty('letter-spacing', '0', 'important');
    } else if (visible === 'ds') {
      text.textContent = 'DSC';
      text.style.setProperty('font-size', '12px', 'important');
      text.style.setProperty('font-weight', '600', 'important');
    } else if (visible === 'v') {
      text.textContent = 'Vx';
      text.style.setProperty('font-size', '12px', 'important');
      text.style.setProperty('font-weight', '600', 'important');
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