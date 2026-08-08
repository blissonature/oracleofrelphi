// Relationship-list presentation only: stripe, semantic slot layout, orb badge, scrollbar,
// and canonical relationship glyph mounts. Every glyph uses the exact 64×64 Master Glyph List artboard.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyRelationshipListLayoutV19) return;
  window.__relphiSkyRelationshipListLayoutV19 = true;

  const NS = 'http://www.w3.org/2000/svg';
  const STYLE_ID = 'skyRelationshipListLayoutV19';
  const OWNER = 'relationship-layout-v19';
  const MASTER_VIEWBOX = '-32 -32 64 64';
  const MASTER_RADIUS = 19;
  const DISPLAY_SIZE = 28;
  const SIGN_DISPLAY_SIZE = 17;
  const SIGN_IDS = Object.freeze(['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces']);
  const SIGN_NAMES = Object.freeze(['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']);
  const SKY_COLORS = Object.freeze({ A:'#c9211e', B:'#2462d0' });
  const ASPECT_COLORS = Object.freeze({
    conjunction:'#e53935','semi-sextile':'#7c9b49',octile:'#b86d43',sextile:'#d3b727',
    quintile:'#8b6cc2',square:'#d6534d',trine:'#4e9e69','tri-octile':'#9f5944',
    'bi-quintile':'#7655aa',quincunx:'#4b8e88',opposition:'#5961c8'
  });

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    document.getElementById('skyRelationshipListLayoutV18')?.remove();
    document.getElementById('skyRelationshipListLayoutV17')?.remove();
    document.getElementById('skyRelationshipListLayoutV16')?.remove();
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .sky-foundation-relationship-row{
        --relationship-stripe:var(--aspect-color,#777);
        position:relative;
        grid-template-columns:28px minmax(0,1fr) 58px 28px minmax(0,1fr);
        grid-template-areas:
          "left-glyph left-copy aspect right-glyph right-copy"
          ". . orb . .";
        column-gap:6px;
        row-gap:1px;
        padding:8px 9px 8px 12px;
        overflow:visible;
      }
      .sky-foundation-relationship-row::before{
        content:"";
        position:absolute;
        inset:0 auto 0 0;
        width:5px;
        background:var(--relationship-stripe);
      }
      .sky-foundation-relationship-glyph{
        display:grid;
        place-items:center;
        width:${DISPLAY_SIZE}px;
        height:${DISPLAY_SIZE}px;
        min-width:${DISPLAY_SIZE}px;
        min-height:${DISPLAY_SIZE}px;
        align-self:center;
        overflow:visible;
      }
      .sky-foundation-relationship-glyph>svg[data-relationship-canonical-host="${OWNER}"]{
        display:block;
        width:${DISPLAY_SIZE}px!important;
        height:${DISPLAY_SIZE}px!important;
        min-width:${DISPLAY_SIZE}px;
        min-height:${DISPLAY_SIZE}px;
        max-width:${DISPLAY_SIZE}px;
        max-height:${DISPLAY_SIZE}px;
        overflow:visible;
        transform:none!important;
      }
      .sky-foundation-relationship-sign{
        display:inline-grid;
        place-items:center;
        width:${SIGN_DISPLAY_SIZE}px;
        height:${SIGN_DISPLAY_SIZE}px;
        margin:0 1px;
        vertical-align:-4px;
        overflow:visible;
      }
      .sky-foundation-relationship-sign>svg[data-relationship-canonical-host="${OWNER}"]{
        display:block;
        width:${SIGN_DISPLAY_SIZE}px!important;
        height:${SIGN_DISPLAY_SIZE}px!important;
        min-width:${SIGN_DISPLAY_SIZE}px;
        min-height:${SIGN_DISPLAY_SIZE}px;
        max-width:${SIGN_DISPLAY_SIZE}px;
        max-height:${SIGN_DISPLAY_SIZE}px;
        overflow:visible;
        transform:none!important;
      }
      .sky-foundation-relationship-glyph--left{grid-area:left-glyph}
      .sky-foundation-relationship-glyph--aspect{grid-area:aspect;justify-self:center;align-self:end}
      .sky-foundation-relationship-glyph--right{grid-area:right-glyph}
      .sky-foundation-relationship-row>.sky-foundation-relationship-copy:nth-child(2){grid-area:left-copy}
      .sky-foundation-relationship-row>.sky-foundation-relationship-copy:nth-child(5){grid-area:right-copy}
      .sky-foundation-relationship-copy{white-space:normal;line-height:1.15;min-width:0}
      .sky-foundation-relationship-copy small{white-space:normal}
      .sky-foundation-relationship-orb{
        grid-area:orb;
        align-self:start;
        justify-self:center;
        min-width:48px;
        padding:4px 7px;
        border:1px solid color-mix(in srgb,var(--relationship-stripe) 42%,transparent);
        border-radius:999px;
        background:color-mix(in srgb,var(--relationship-stripe) 9%,#fffdfa);
        color:#403a35;
        text-align:center;
        white-space:nowrap;
        font:800 .58rem/1 system-ui,sans-serif;
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
          grid-template-columns:28px minmax(0,1fr) 54px minmax(0,1fr) 28px;
          grid-template-areas:
            "left-glyph left-copy aspect right-copy right-glyph"
            ". . orb . .";
          padding:9px 10px 8px 13px;
        }
        .sky-foundation-relationship-row>.sky-foundation-relationship-copy:nth-child(5){text-align:right}
        .sky-foundation-relationship-glyph--right{justify-self:end}
      }
    `;
    document.head.appendChild(style);
  }

  function outerHostIsIntact(slot, entry) {
    const host = slot?.firstElementChild;
    return slot?.childElementCount === 1 &&
      slot?.dataset.relationshipGlyphOwner === OWNER &&
      host?.matches?.(`svg[data-relationship-canonical-host="${OWNER}"]`) &&
      host.dataset.canonicalGlyphId === entry?.id &&
      host.getAttribute('viewBox') === MASTER_VIEWBOX;
  }

  function canonicalHostIsIntact(slot, entry, mode) {
    if (!outerHostIsIntact(slot, entry)) return false;
    const host = slot.firstElementChild;
    if (host.childElementCount !== 1) return false;
    const bubble = host.firstElementChild;
    if (!bubble?.matches?.('g.relphi-glyph-bubble') || bubble.dataset.glyphId !== entry.id) return false;
    const circles = Array.from(bubble.children).filter(node => node.tagName?.toLowerCase() === 'circle');
    const arts = Array.from(bubble.children).filter(node => node.classList?.contains('relphi-canonical-glyph'));
    if (circles.length !== 1 || arts.length !== 1 || !arts[0].classList.contains('relphi-glyph-' + entry.id)) return false;
    if (mode === 'plain' && circles[0].style.opacity !== '0') return false;
    return true;
  }

  function paintGlyph(slot, identity, mode, color, label) {
    if (!slot) return;
    const registry = window.RelphiGlyphRegistry;
    const component = window.RelphiGlyphComponent;
    const entry = registry && (registry.get(identity) || registry.resolve(identity));
    if (!entry || !component?.createBubble) {
      slot.dataset.glyphUnavailable = 'true';
      return;
    }

    if (slot.dataset.canonicalGlyphReady === 'loading' && outerHostIsIntact(slot, entry)) return;
    if (slot.dataset.canonicalGlyphReady === 'true' && canonicalHostIsIntact(slot, entry, mode)) return;

    const host = document.createElementNS(NS, 'svg');
    host.setAttribute('viewBox', MASTER_VIEWBOX);
    host.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    host.setAttribute('aria-hidden', 'true');
    host.setAttribute('focusable', 'false');
    host.dataset.relationshipCanonicalHost = OWNER;
    host.dataset.canonicalGlyphId = entry.id;
    host.dataset.masterGlyphViewBox = MASTER_VIEWBOX;

    slot.replaceChildren(host);
    slot.dataset.relationshipGlyphOwner = OWNER;
    slot.dataset.relationshipGlyphIdentity = entry.id;
    slot.dataset.relationshipGlyphMode = mode;
    slot.dataset.canonicalGlyphReady = 'loading';
    slot.setAttribute('title', label || entry.name || entry.id);
    delete slot.dataset.glyphUnavailable;

    let bubble;
    try {
      bubble = component.createBubble(host, entry.id, {
        radius:MASTER_RADIUS,
        padding:1,
        color
      });
      if (mode === 'plain') {
        bubble.circle.style.opacity = '0';
        bubble.circle.setAttribute('aria-hidden', 'true');
      }
    } catch (error) {
      slot.dataset.canonicalGlyphReady = 'error';
      slot.dataset.glyphUnavailable = 'true';
      host.remove();
      console.error('[Sky Chart relationship glyph]', error);
      return;
    }

    Promise.resolve(bubble.ready).then(() => {
      if (canonicalHostIsIntact(slot, entry, mode)) {
        slot.dataset.canonicalGlyphReady = 'true';
        return;
      }
      slot.dataset.canonicalGlyphReady = 'corrupt';
      queueMicrotask(() => paintGlyph(slot, identity, mode, color, label));
    }).catch(error => {
      slot.dataset.canonicalGlyphReady = 'error';
      slot.dataset.glyphUnavailable = 'true';
      if (host.isConnected) host.remove();
      console.error('[Sky Chart relationship glyph]', error);
    });
  }

  function ensureSignGlyph(row, side, color) {
    const left = side === 'left';
    const copy = row.querySelector(left
      ? ':scope > .sky-foundation-relationship-copy:nth-child(2)'
      : ':scope > .sky-foundation-relationship-copy:nth-child(5)');
    const small = copy?.querySelector('small');
    const signIndex = Number(row.dataset[left ? 'leftSign' : 'rightSign']);
    const house = row.dataset[left ? 'leftHouse' : 'rightHouse'];
    const signId = SIGN_IDS[signIndex];
    const signName = SIGN_NAMES[signIndex];
    if (!small || !signId || !signName || !house) return;

    let signSlot = small.querySelector(':scope > .sky-foundation-relationship-sign');
    if (!signSlot) {
      const source = small.textContent.trim();
      const match = source.match(/^(.+?)\s+(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\s+·/i);
      const coordinate = (match?.[1] || source.split('·')[0] || '').trim();
      signSlot = document.createElement('span');
      signSlot.className = 'sky-foundation-relationship-sign';
      signSlot.dataset.signGlyph = signId;
      signSlot.setAttribute('aria-label', signName);
      small.replaceChildren(
        document.createTextNode(coordinate + ' '),
        signSlot,
        document.createTextNode(` · H${house}`)
      );
    }
    paintGlyph(signSlot, signId, 'plain', color, signName);
  }

  function paintRowGlyphs(row) {
    const aspect = String(row.dataset.aspect || '').toLowerCase();
    paintGlyph(row.querySelector('.sky-foundation-relationship-glyph--left'), row.dataset.leftPlacement, 'plain', SKY_COLORS.A, row.dataset.leftPlacement);
    paintGlyph(row.querySelector('.sky-foundation-relationship-glyph--aspect'), aspect, 'plain', ASPECT_COLORS[aspect] || '#777', aspect);
    paintGlyph(row.querySelector('.sky-foundation-relationship-glyph--right'), row.dataset.rightPlacement, 'plain', SKY_COLORS.B, row.dataset.rightPlacement);
    ensureSignGlyph(row, 'left', SKY_COLORS.A);
    ensureSignGlyph(row, 'right', SKY_COLORS.B);
  }

  function compose(row) {
    if (!(row instanceof HTMLElement)) return;
    const aspect = String(row.dataset.aspect || '').toLowerCase();
    const color = ASPECT_COLORS[aspect] || '#777';
    row.style.setProperty('--relationship-stripe', color);
    paintRowGlyphs(row);

    if (row.dataset.relationshipLayout === 'v19') return;
    const copies = row.querySelectorAll('.sky-foundation-relationship-copy');
    const rightSmall = copies[1]?.querySelector('small');
    const orb = Number(row.dataset.sourceOrb);
    if (!rightSmall || !Number.isFinite(orb)) return;

    rightSmall.textContent = rightSmall.textContent.replace(/\s*·\s*Orb\s+[\d.]+°?\s*$/i, '').trim();
    // Reconstitute the right-side sign glyph after removing the legacy inline Orb text.
    ensureSignGlyph(row, 'right', SKY_COLORS.B);
    row.querySelector(':scope > .sky-foundation-relationship-orb')?.remove();
    const badge = document.createElement('span');
    badge.className = 'sky-foundation-relationship-orb';
    badge.textContent = `Orb ${orb.toFixed(2)}°`;
    badge.setAttribute('aria-label', `Orb ${orb.toFixed(2)} degrees`);
    row.appendChild(badge);
    row.dataset.relationshipLayout = 'v19';
  }

  function refresh(root) {
    (root || document).querySelectorAll?.('.sky-foundation-relationship-row').forEach(compose);
  }

  function start() {
    installStyle();
    refresh(document);
    new MutationObserver(function (records) {
      const rows = new Set();
      records.forEach(function (record) {
        const targetRow = record.target instanceof Element ? record.target.closest('.sky-foundation-relationship-row') : null;
        if (targetRow) rows.add(targetRow);
        record.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.matches?.('.sky-foundation-relationship-row')) rows.add(node);
          const parentRow = node.closest?.('.sky-foundation-relationship-row');
          if (parentRow) rows.add(parentRow);
          node.querySelectorAll?.('.sky-foundation-relationship-row').forEach(row => rows.add(row));
        });
      });
      rows.forEach(compose);
    }).observe(document.documentElement, { childList:true, subtree:true });
    window.addEventListener('relphi:sky-foundation-interactions-ready', () => refresh(document));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
