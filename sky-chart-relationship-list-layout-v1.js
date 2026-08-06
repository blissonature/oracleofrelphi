// Relationship-list presentation only: aspect stripe, layout, orb badge, containment, and scrollbar.
// Glyph geometry and internal transforms are owned exclusively by the Sky Chart foundation renderer.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyRelationshipListLayoutV13) return;
  window.__relphiSkyRelationshipListLayoutV13 = true;

  const STYLE_ID = 'skyRelationshipListLayoutV13';
  const ASPECT_COLORS = Object.freeze({
    conjunction:'#e53935','semi-sextile':'#7c9b49',octile:'#b86d43',sextile:'#d3b727',
    quintile:'#8b6cc2',square:'#d6534d',trine:'#4e9e69','tri-octile':'#9f5944',
    'bi-quintile':'#7655aa',quincunx:'#4b8e88',opposition:'#5961c8'
  });

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .sky-foundation-relationship-row{
        --relationship-stripe:var(--aspect-color,#777);
        position:relative;
        grid-template-columns:28px minmax(0,1fr) 28px 28px minmax(0,1fr) auto;
        grid-template-areas:"left-glyph left-copy aspect right-glyph right-copy orb";
        column-gap:6px;
        row-gap:4px;
        padding:8px 9px 8px 12px;
        overflow:hidden;
      }
      .sky-foundation-relationship-row::before{
        content:"";
        position:absolute;
        inset:0 auto 0 0;
        width:5px;
        background:var(--relationship-stripe);
      }
      .sky-foundation-relationship-row>:scope:nth-child(1){grid-area:left-glyph}
      .sky-foundation-relationship-row>:scope:nth-child(2){grid-area:left-copy}
      .sky-foundation-relationship-row>:scope:nth-child(3){grid-area:aspect;justify-self:center}
      .sky-foundation-relationship-row>:scope:nth-child(4){grid-area:right-glyph}
      .sky-foundation-relationship-row>:scope:nth-child(5){grid-area:right-copy}
      .sky-foundation-relationship-row>svg{
        display:block;
        width:28px!important;
        height:28px!important;
        max-width:28px!important;
        max-height:28px!important;
        align-self:center;
        overflow:hidden!important;
        contain:paint;
      }
      .sky-foundation-relationship-copy{white-space:normal;line-height:1.15;min-width:0}
      .sky-foundation-relationship-copy small{white-space:normal}
      .sky-foundation-relationship-orb{
        grid-area:orb;
        align-self:center;
        justify-self:end;
        min-width:48px;
        padding:5px 7px;
        border:1px solid color-mix(in srgb,var(--relationship-stripe) 42%,transparent);
        border-radius:999px;
        background:color-mix(in srgb,var(--relationship-stripe) 9%,#fffdfa);
        color:#403a35;
        text-align:center;
        white-space:nowrap;
        font:800 .6rem/1 system-ui,sans-serif;
        font-variant-numeric:tabular-nums;
      }
      #skyFoundationRelationshipList{
        scrollbar-width:thin;
        scrollbar-color:#8d8d8d transparent;
        scrollbar-gutter:stable;
      }
      #skyFoundationRelationshipList::-webkit-scrollbar{width:8px;height:8px}
      #skyFoundationRelationshipList::-webkit-scrollbar-track{background:transparent}
      #skyFoundationRelationshipList::-webkit-scrollbar-thumb{
        border:2px solid transparent;
        border-radius:999px;
        background:#8d8d8d;
        background-clip:padding-box;
      }
      #skyFoundationRelationshipList::-webkit-scrollbar-button{display:none;width:0;height:0}
      @media(max-width:620px){
        .sky-foundation-relationship-row{
          grid-template-columns:28px minmax(0,1fr) 28px minmax(0,1fr) 28px;
          grid-template-areas:"left-glyph left-copy aspect right-copy right-glyph" ". orb orb orb .";
          padding:9px 10px 8px 13px;
        }
        .sky-foundation-relationship-orb{justify-self:center;min-width:74px;margin-top:2px}
        .sky-foundation-relationship-row>:scope:nth-child(5){text-align:right}
        .sky-foundation-relationship-row>:scope:nth-child(4){justify-self:end}
      }
    `;
    document.head.appendChild(style);
  }

  function compose(row) {
    if (!(row instanceof HTMLElement)) return;
    const aspect = String(row.dataset.aspect || '').toLowerCase();
    const color = ASPECT_COLORS[aspect] || '#777';
    row.style.setProperty('--relationship-stripe', color);

    row.querySelectorAll(':scope > .sky-relationship-canonical-stage, :scope > .sky-relationship-master-stage, :scope > .sky-relationship-master-slot').forEach(function (node) {
      node.remove();
    });
    delete row.dataset.relationshipMasterGlyphs;

    if (row.dataset.relationshipLayout === 'v13') return;
    const copies = row.querySelectorAll('.sky-foundation-relationship-copy');
    const rightSmall = copies[1]?.querySelector('small');
    const orb = Number(row.dataset.sourceOrb);
    if (!rightSmall || !Number.isFinite(orb)) return;

    rightSmall.textContent = rightSmall.textContent.replace(/\s*·\s*Orb\s+[\d.]+°?\s*$/i, '').trim();
    row.querySelector(':scope > .sky-foundation-relationship-orb')?.remove();
    const badge = document.createElement('span');
    badge.className = 'sky-foundation-relationship-orb';
    badge.textContent = `Orb ${orb.toFixed(2)}°`;
    badge.setAttribute('aria-label', `Orb ${orb.toFixed(2)} degrees`);
    row.appendChild(badge);
    row.dataset.relationshipLayout = 'v13';
  }

  function refresh(root) {
    (root || document).querySelectorAll?.('.sky-foundation-relationship-row').forEach(compose);
  }

  function start() {
    installStyle();
    refresh(document);
    new MutationObserver(function (records) {
      records.forEach(function (record) {
        record.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.matches?.('.sky-foundation-relationship-row')) compose(node);
          refresh(node);
        });
      });
    }).observe(document.documentElement, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
