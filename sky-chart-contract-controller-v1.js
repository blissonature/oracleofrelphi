// Unified Sky Chart interaction state: wheel emphasis, relationship filtering,
// count updates, and selected relationship activation share one source of truth.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyChartContractControllerV1) return;
  window.__relphiSkyChartContractControllerV1 = true;

  const ROW_SELECTOR = '[data-relationship-index],.relationship-row,.relphi-relationship-row,.relationship-list-row,[data-relphi-relationship]';
  const EMPTY = Object.freeze({ mode:null, kind:null, sky:null, placementIds:[], aspectIndices:[], signIndex:null, house:null });
  let selectedState = EMPTY;
  let hoveredState = EMPTY;
  let activeSvg = null;

  function uniqueRows() {
    const heading = Array.from(document.querySelectorAll('h1,h2,h3,h4,[role="heading"]'))
      .find(node => /^relationships$/i.test(String(node.textContent || '').trim()));
    if (!heading) return [];
    let region = heading.parentElement;
    while (region && region !== document.body && !region.querySelector(ROW_SELECTOR)) region = region.parentElement;
    if (!region || region === document.body) return [];
    const seen = new Set();
    return Array.from(region.querySelectorAll(ROW_SELECTOR)).map(node => {
      let host = node;
      while (host.parentElement && host.parentElement !== region) {
        const parent = host.parentElement;
        if (parent.querySelectorAll(ROW_SELECTOR).length !== 1) break;
        host = parent;
      }
      return host;
    }).filter(host => !seen.has(host) && seen.add(host));
  }

  function relationshipIndex(row, fallback) {
    const raw = row.dataset.relationshipIndex ?? row.querySelector('[data-relationship-index]')?.dataset.relationshipIndex;
    const value = Number(raw);
    return Number.isInteger(value) && value >= 0 ? value : fallback;
  }

  function countNode() {
    const heading = Array.from(document.querySelectorAll('h1,h2,h3,h4,[role="heading"]'))
      .find(node => /^relationships$/i.test(String(node.textContent || '').trim()));
    const scope = heading?.parentElement;
    return Array.from(scope?.querySelectorAll('span,output,strong,b') || [])
      .find(node => /^\d+(?:\s*\/\s*\d+)?$/.test(String(node.textContent || '').trim())) || null;
  }

  function stateFor(svg, target, mode) {
    const type = target?.dataset.interactive || target?.dataset.focusablePiece || null;
    if (!type) return EMPTY;
    const aspects = new Set();
    const placements = new Set();
    let sky = target.dataset.sky || null;
    let house = target.dataset.house == null ? null : Number(target.dataset.house);
    let sign = target.dataset.signIndex == null ? null : Number(target.dataset.signIndex);

    function retainAspect(line) {
      const index = Number(line.dataset.aspectIndex);
      if (Number.isInteger(index) && index >= 0) aspects.add(index);
      if (line.dataset.skyAPlacement) placements.add('A:' + line.dataset.skyAPlacement);
      if (line.dataset.skyBPlacement) placements.add('B:' + line.dataset.skyBPlacement);
    }

    if (type === 'aspect') {
      retainAspect(target);
    } else if (type === 'placement' || type === 'placement-leader') {
      const key = target.dataset.sky + ':' + target.dataset.placement;
      placements.add(key);
      svg.querySelectorAll('[data-interactive="aspect"]').forEach(line => {
        if ('A:' + line.dataset.skyAPlacement === key || 'B:' + line.dataset.skyBPlacement === key) retainAspect(line);
      });
    } else if (type === 'house') {
      svg.querySelectorAll(`[data-interactive="placement"][data-sky="${sky}"][data-house="${house}"]`).forEach(node => {
        const key = sky + ':' + node.dataset.placement;
        placements.add(key);
        svg.querySelectorAll('[data-interactive="aspect"]').forEach(line => {
          if ('A:' + line.dataset.skyAPlacement === key || 'B:' + line.dataset.skyBPlacement === key) retainAspect(line);
        });
      });
    } else if (type === 'sign') {
      sky = null;
      svg.querySelectorAll(`[data-interactive="placement"][data-sign-index="${sign}"]`).forEach(node => {
        const key = node.dataset.sky + ':' + node.dataset.placement;
        placements.add(key);
        svg.querySelectorAll('[data-interactive="aspect"]').forEach(line => {
          if ('A:' + line.dataset.skyAPlacement === key || 'B:' + line.dataset.skyBPlacement === key) retainAspect(line);
        });
      });
    }

    return Object.freeze({
      mode,
      kind:type,
      sky,
      placementIds:Array.from(placements),
      aspectIndices:Array.from(aspects).sort((a, b) => a - b),
      signIndex:Number.isInteger(sign) ? sign : null,
      house:Number.isInteger(house) ? house : null
    });
  }

  function applyWheel(svg, state) {
    svg.querySelectorAll('[data-focusable-piece]').forEach(node => node.classList.remove('is-hovered','is-kept','is-selected'));
    svg.classList.toggle('has-isolation', state.mode === 'selected' && state.kind != null);
    if (!state.kind) return;
    const keep = new Set();
    state.aspectIndices.forEach(index => {
      const line = svg.querySelector(`[data-interactive="aspect"][data-aspect-index="${index}"]`);
      if (line) keep.add(line);
    });
    state.placementIds.forEach(key => {
      const [sky, id] = key.split(':');
      svg.querySelectorAll(`[data-sky="${sky}"][data-placement="${CSS.escape(id)}"]`).forEach(node => keep.add(node));
      const placement = svg.querySelector(`[data-interactive="placement"][data-sky="${sky}"][data-placement="${CSS.escape(id)}"]`);
      if (placement) {
        svg.querySelectorAll(`[data-focusable-piece="sign"][data-sign-index="${placement.dataset.signIndex}"]`).forEach(node => keep.add(node));
        svg.querySelectorAll(`[data-focusable-piece="house"][data-sky="${sky}"][data-house="${placement.dataset.house}"]`).forEach(node => keep.add(node));
      }
    });
    if (state.kind === 'house') svg.querySelectorAll(`[data-focusable-piece="house"][data-sky="${state.sky}"][data-house="${state.house}"]`).forEach(node => keep.add(node));
    if (state.kind === 'sign') svg.querySelectorAll(`[data-focusable-piece="sign"][data-sign-index="${state.signIndex}"]`).forEach(node => keep.add(node));
    keep.forEach(node => node.classList.add(state.mode === 'hover' ? 'is-hovered' : 'is-kept'));
    const selected = state.kind === 'aspect' && state.aspectIndices.length === 1
      ? svg.querySelector(`[data-interactive="aspect"][data-aspect-index="${state.aspectIndices[0]}"]`)
      : null;
    selected?.classList.add('is-selected');
  }

  function applyRelationships(state, activate) {
    const rows = uniqueRows();
    if (!rows.length) return;
    const allowed = state.kind ? new Set(state.aspectIndices) : null;
    let visible = 0;
    let soleRow = null;
    rows.forEach((row, fallback) => {
      const index = relationshipIndex(row, fallback);
      row.dataset.relphiResolvedRelationshipIndex = String(index);
      const show = !allowed || allowed.has(index);
      row.hidden = !show;
      row.classList.toggle('relphi-contract-filtered-out', !show);
      if (show) { visible += 1; soleRow = row; }
    });
    const count = countNode();
    if (count) {
      if (!count.dataset.relphiTotal) count.dataset.relphiTotal = String(rows.length);
      count.textContent = allowed ? `${visible} / ${count.dataset.relphiTotal}` : count.dataset.relphiTotal;
    }
    if (activate && allowed?.size === 1 && visible === 1) {
      const control = soleRow?.matches('button,a,[role="button"]') ? soleRow : soleRow?.querySelector('button,a,[role="button"]');
      control?.click();
    }
  }

  function publish(state, activate) {
    if (!activeSvg) return;
    applyWheel(activeSvg, state);
    applyRelationships(state, activate);
    window.dispatchEvent(new CustomEvent('relphi:sky-chart-focus-state', { detail:state }));
  }

  function restoreSelected() {
    publish(selectedState, false);
  }

  function bind(svg) {
    if (!svg || svg.dataset.relphiContractStateBound === 'true') return;
    activeSvg = svg;
    svg.dataset.relphiContractStateBound = 'true';
    svg.addEventListener('pointerover', event => {
      const target = event.target.closest?.('[data-focusable-piece]');
      if (!target || !svg.contains(target)) return;
      hoveredState = stateFor(svg, target, 'hover');
      publish(hoveredState, false);
    }, true);
    svg.addEventListener('pointerout', event => {
      const from = event.target.closest?.('[data-focusable-piece]');
      const to = event.relatedTarget?.closest?.('[data-focusable-piece]');
      if (from && from === to) return;
      hoveredState = EMPTY;
      restoreSelected();
    }, true);
    function select(target) {
      if (!target || !svg.contains(target)) {
        selectedState = EMPTY;
        publish(EMPTY, false);
        return;
      }
      selectedState = stateFor(svg, target, 'selected');
      publish(selectedState, selectedState.kind === 'aspect');
    }
    svg.addEventListener('click', event => {
      const target = event.target.closest?.('[data-interactive]');
      if (target) event.preventDefault();
      select(target);
    }, true);
    svg.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = event.target.closest?.('[data-interactive]');
      if (!target) return;
      event.preventDefault();
      select(target);
    }, true);
    publish(EMPTY, false);
  }

  function locateAndBind() {
    const svg = document.querySelector('.unified-sky-wheel > .scn-live-wheel[data-ready="true"]');
    if (svg) bind(svg);
  }

  window.addEventListener('relphi:sky-chart-next-display-ready', event => bind(event.detail?.svg));
  window.addEventListener('relphi:relationships-rendered', () => publish(hoveredState.kind ? hoveredState : selectedState, false));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', locateAndBind, { once:true });
  else locateAndBind();
})();
