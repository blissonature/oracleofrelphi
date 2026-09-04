// Drawing Board rendered-surface ownership and Celtic visual geometry.
(function () {
  'use strict';
  if (!/(^|\/)tarot\.html$/.test(location.pathname)) return;
  if (window.__relphiDrawingBoardRenderGeometryV1) return;
  window.__relphiDrawingBoardRenderGeometryV1 = true;

  const PANEL = '#shortListPanel';
  const RADIUS = '.72rem';
  let queued = false;
  let applying = false;

  function root() { return document.querySelector(PANEL); }
  function board(rootNode = root()) { return rootNode?.querySelector('.card-row-board') || null; }
  function face(item) { return item?.querySelector('.card-row-card-wrap,.card-row-drop-card') || null; }

  function setImportant(node, property, value) {
    if (!node) return;
    if (node.style.getPropertyValue(property) === value && node.style.getPropertyPriority(property) === 'important') return;
    node.style.setProperty(property, value, 'important');
  }

  function installStyle() {
    if (document.getElementById('relphi-render-geometry-style-v1')) return;
    const style = document.createElement('style');
    style.id = 'relphi-render-geometry-style-v1';
    style.textContent = [
      '#shortListPanel .card-row-board>.card-row-item::before,#shortListPanel .card-row-board>.card-row-item::after{content:none!important;display:none!important}',
      '#shortListPanel .card-row-board>.card-row-item>.card-row-card-wrap::before,#shortListPanel .card-row-board>.card-row-item>.card-row-card-wrap::after,#shortListPanel .card-row-board>.card-row-placeholder-item>.card-row-drop-card::before,#shortListPanel .card-row-board>.card-row-placeholder-item>.card-row-drop-card::after{content:none!important;display:none!important}',
      '#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="0"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="1"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="2"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="3"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="4"]>.card-row-position-panel,#shortListPanel.relphi-celtic-readable .card-row-board>.card-row-item[data-row-index="5"]>.card-row-position-panel{bottom:100%!important;margin-bottom:0!important}'
    ].join('');
    document.head.appendChild(style);
  }

  function ownCardSurfaces(rootNode) {
    const liveBoard = board(rootNode);
    if (!liveBoard) return;

    liveBoard.querySelectorAll(':scope > .card-row-item').forEach(item => {
      // The position envelope is geometry only. It must never paint a square behind the face.
      setImportant(item, 'background', 'transparent');
      setImportant(item, 'background-color', 'transparent');
      setImportant(item, 'border', '0px');
      setImportant(item, 'outline', '0px');
      setImportant(item, 'box-shadow', 'none');

      const wrap = item.querySelector(':scope > .card-row-card-wrap');
      const drop = item.querySelector(':scope > .card-row-drop-card');
      [wrap, drop].filter(Boolean).forEach(surface => {
        setImportant(surface, 'border-radius', RADIUS);
        setImportant(surface, 'overflow', 'hidden');
        setImportant(surface, 'clip-path', 'inset(0 round ' + RADIUS + ')');
        setImportant(surface, 'background-clip', 'padding-box');
        setImportant(surface, 'border', '0px');
        setImportant(surface, 'outline', '0px');
        setImportant(surface, 'box-shadow', 'none');
      });

      item.querySelectorAll('.card-row-card,.or-card.card-row-card,.card-row-drop-card-inner,.card-row-drop-card>img').forEach(surface => {
        setImportant(surface, 'border-radius', RADIUS);
        setImportant(surface, 'background-clip', 'padding-box');
      });
    });
  }

  function clearStaffTranslation(liveBoard) {
    liveBoard?.querySelectorAll(':scope > .card-row-item[data-row-index="6"],:scope > .card-row-item[data-row-index="7"],:scope > .card-row-item[data-row-index="8"],:scope > .card-row-item[data-row-index="9"]').forEach(item => {
      if (item.dataset.relphiStaffTranslateX) {
        item.style.removeProperty('translate');
        delete item.dataset.relphiStaffTranslateX;
      }
    });
  }

  function positionCelticStaff(rootNode) {
    const liveBoard = board(rootNode);
    if (!liveBoard) return;
    if (!rootNode.classList.contains('relphi-celtic-readable')) {
      clearStaffTranslation(liveBoard);
      return;
    }

    const before = liveBoard.querySelector(':scope > .card-row-item[data-row-index="5"]');
    const firstStaff = liveBoard.querySelector(':scope > .card-row-item[data-row-index="6"]');
    const beforeFace = face(before);
    const staffFace = face(firstStaff);
    if (!beforeFace || !staffFace) return;

    const beforeRect = beforeFace.getBoundingClientRect();
    const staffRect = staffFace.getBoundingClientRect();
    const boardRect = liveBoard.getBoundingClientRect();
    if (!beforeRect.width || !staffRect.width || !liveBoard.offsetWidth) return;

    // Required visual rule: Before | one full rendered card-width of felt | staff.
    const desiredLeft = beforeRect.right + beforeRect.width;
    const deltaVisual = desiredLeft - staffRect.left;
    if (Math.abs(deltaVisual) < .5) return;

    let scaleX = boardRect.width / liveBoard.offsetWidth;
    if (!Number.isFinite(scaleX) || Math.abs(scaleX) < .001) scaleX = 1;
    const previous = Number(firstStaff.dataset.relphiStaffTranslateX || 0);
    const next = previous + (deltaVisual / scaleX);

    [6,7,8,9].forEach(index => {
      const item = liveBoard.querySelector(':scope > .card-row-item[data-row-index="' + index + '"]');
      if (!item) return;
      item.dataset.relphiStaffTranslateX = String(next);
      setImportant(item, 'translate', next.toFixed(2) + 'px 0px');
    });
  }

  function enforceFlushLabels(rootNode) {
    if (!rootNode?.classList.contains('relphi-celtic-readable')) return;
    const liveBoard = board(rootNode);
    if (!liveBoard) return;
    [0,1,2,3,4,5].forEach(index => {
      const sticker = liveBoard.querySelector(':scope > .card-row-item[data-row-index="' + index + '"] > .card-row-position-panel');
      if (!sticker) return;
      setImportant(sticker, 'bottom', '100%');
      setImportant(sticker, 'margin-bottom', '0px');
    });
  }

  function apply() {
    queued = false;
    if (applying) return;
    const rootNode = root();
    if (!rootNode || rootNode.hidden) return;
    applying = true;
    try {
      installStyle();
      ownCardSurfaces(rootNode);
      enforceFlushLabels(rootNode);
      positionCelticStaff(rootNode);
    } finally {
      applying = false;
    }
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => requestAnimationFrame(apply));
  }

  document.addEventListener('relphi:drawing-board-rendered', schedule);
  document.addEventListener('relphi:drawing-board-center-view', schedule);
  document.addEventListener('input', event => {
    if (event.target?.matches?.('#rowZoom,#rowEnvelopeColor')) schedule();
  }, true);
  document.addEventListener('change', event => {
    if (event.target?.matches?.('#relphiSpreadTemplateSelect,#rowZoom,#rowEnvelopeColor')) schedule();
  }, true);
  window.addEventListener('resize', schedule);

  new MutationObserver(records => {
    if (applying) return;
    if (!records.some(record => record.type === 'childList' || (record.type === 'attributes' && ['class','style'].includes(record.attributeName)))) return;
    schedule();
  }).observe(document.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:['class','style'] });

  schedule();
})();