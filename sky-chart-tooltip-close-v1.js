// Keep the preview placement label close to its selected marker and make it dismissible.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const GAP = 4;

  function tooltip() {
    return document.getElementById('relphiWheelPreviewTooltip');
  }

  function activePlacement() {
    return document.querySelector('.chart-wheel-placement-stick.is-preview-active');
  }

  function closeTooltip() {
    const tip = tooltip();
    document.querySelectorAll('.chart-wheel-placement-stick.is-preview-active').forEach(function (group) {
      group.classList.remove('is-preview-active');
      group.setAttribute('aria-expanded', 'false');
    });
    if (tip) {
      tip.style.display = 'none';
      tip.setAttribute('aria-hidden', 'true');
    }
  }

  function ensureCloseButton() {
    const tip = tooltip();
    if (!tip || tip.querySelector('.relphi-tooltip-close')) return;
    tip.style.position = 'absolute';
    tip.style.paddingRight = '2.35rem';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'relphi-tooltip-close';
    button.setAttribute('aria-label', 'Close placement label');
    button.textContent = '×';
    Object.assign(button.style, {
      position: 'absolute', top: '.32rem', right: '.45rem', width: '1.55rem', height: '1.55rem',
      border: '0', borderRadius: '50%', background: 'transparent', color: 'inherit',
      font: '700 1.35rem/1 system-ui,sans-serif', cursor: 'pointer', padding: '0'
    });
    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      closeTooltip();
    });
    tip.appendChild(button);
  }

  function position() {
    const group = activePlacement();
    const tip = tooltip();
    if (!group || !tip || tip.style.display === 'none') return;
    ensureCloseButton();
    tip.setAttribute('aria-hidden', 'false');

    const knob = group.querySelector('.chart-wheel-stick-knob') || group;
    const rect = knob.getBoundingClientRect();
    const own = tip.getBoundingClientRect();
    const view = window.visualViewport;
    const pageLeft = view ? view.pageLeft : window.scrollX;
    const pageTop = view ? view.pageTop : window.scrollY;
    const width = view ? view.width : window.innerWidth;

    const centerX = pageLeft + rect.left + rect.width / 2;
    const minLeft = pageLeft + 8;
    const maxLeft = pageLeft + width - own.width - 8;
    const left = Math.max(minLeft, Math.min(maxLeft, centerX - own.width / 2));

    let top = pageTop + rect.top - own.height - GAP;
    if (top < pageTop + 8) top = pageTop + rect.bottom + GAP;

    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }

  document.addEventListener('click', function (event) {
    const target = event.target;
    const clickedPlacement = target.closest?.('.chart-wheel-placement-stick');
    const clickedTooltip = target.closest?.('#relphiWheelPreviewTooltip');
    if (!clickedPlacement && !clickedTooltip) closeTooltip();
    requestAnimationFrame(position);
  }, true);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeTooltip();
  });

  document.addEventListener('pointerenter', function (event) {
    if (event.target.closest?.('.chart-wheel-placement-stick')) requestAnimationFrame(position);
  }, true);
  window.addEventListener('scroll', position, { passive:true });
  window.addEventListener('resize', position, { passive:true });
  window.visualViewport?.addEventListener('scroll', position, { passive:true });
  window.visualViewport?.addEventListener('resize', position, { passive:true });
})();