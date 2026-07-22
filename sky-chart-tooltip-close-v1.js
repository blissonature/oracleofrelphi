// Keep the preview placement label close to its selected marker, including under iOS pinch zoom.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const GAP = 4;

  function activePlacement() {
    return document.querySelector('.chart-wheel-placement-stick.is-preview-active');
  }

  function position() {
    const group = activePlacement();
    const tooltip = document.getElementById('relphiWheelPreviewTooltip');
    if (!group || !tooltip || tooltip.style.display === 'none') return;

    const knob = group.querySelector('.chart-wheel-stick-knob') || group;
    const rect = knob.getBoundingClientRect();
    const own = tooltip.getBoundingClientRect();
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

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  document.addEventListener('click', function () { requestAnimationFrame(position); }, true);
  document.addEventListener('pointerenter', function (event) {
    if (event.target.closest?.('.chart-wheel-placement-stick')) requestAnimationFrame(position);
  }, true);
  window.addEventListener('scroll', position, { passive:true });
  window.addEventListener('resize', position, { passive:true });
  window.visualViewport?.addEventListener('scroll', position, { passive:true });
  window.visualViewport?.addEventListener('resize', position, { passive:true });
})();