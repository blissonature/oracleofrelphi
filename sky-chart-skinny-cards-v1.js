// Skinny Sky cards: partial planetary-hours seal, one-sky SVG, and minimal canonical glyph ledger.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const KEYS = { skyA:'relphiSkyChartA', skyB:'relphiSkyChartB' };
  const COLORS = { skyA:'#dc1f18', skyB:'#3166e2' };
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ORDER = ['Sun','Moon','Rising','Ascendant','ASC','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','Chiron','North Node','South Node','Lilith','Vertex','Part of Fortune','MC','IC','Descendant','Dsc','DSC'];
  let queued = false;

  function read(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } }
  function placements(payload) { const value = payload && (payload.placements || payload); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
  function profile(payload) { return payload && payload.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {}; }
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function resolve(value) { try { return window.RelphiGlyphRegistry?.resolve(value)?.id || window.RelphiGlyphRegistry?.get(value)?.id || ''; } catch (_) { return ''; } }
  function coordinate(item) { return (item.degree == null ? '' : Number(item.degree) + '°') + (item.minute == null ? '' : String(Number(item.minute)).padStart(2,'0') + '′'); }
  function normalize(value) { value %= 360; return value < 0 ? value + 360 : value; }
  function longitude(item) {
    if (!item) return NaN;
    if (Number.isFinite(Number(item.longitude))) return normalize(Number(item.longitude));
    const sign = SIGNS.findIndex(function (name) { return name.toLowerCase() === String(item.sign || '').toLowerCase(); });
    return sign < 0 ? NaN : sign * 30 + Number(item.degree || 0) + Number(item.minute || 0) / 60;
  }
  function point(cx, cy, radius, degrees) { const r = degrees * Math.PI / 180; return { x:cx + Math.cos(r) * radius, y:cy + Math.sin(r) * radius }; }
  function ascLongitude(map) {
    const key = Object.keys(map).find(function (name) { return /^(rising|ascendant|asc|ac)$/i.test(name); });
    return key ? longitude(map[key]) : 0;
  }
  function ordered(map) {
    const keys = Object.keys(map);
    return keys.sort(function (a,b) {
      const ai = ORDER.findIndex(function (name) { return name.toLowerCase() === a.toLowerCase(); });
      const bi = ORDER.findIndex(function (name) { return name.toLowerCase() === b.toLowerCase(); });
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
    });
  }
  function glyphSvg(id, label, cls) {
    return '<svg class="' + cls + '" data-relphi-glyph="' + esc(id) + '" viewBox="-18 -18 36 36" role="img" aria-label="' + esc(label) + '"></svg>';
  }

  function shell(slot, payload, card) {
    const map = placements(payload);
    const rows = ordered(map);
    const portal = card.querySelector('.relphi-ph-portal');
    card.classList.add('relphi-skinny-sky-card');
    card.innerHTML = '<header class="relphi-skinny-head"><span class="relphi-workspace-tab">' + (slot === 'skyA' ? 'Sky A' : 'Sky B') + '</span><h2>' + esc(payload.name || (slot === 'skyA' ? 'Sky A' : 'Sky B')) + '</h2><div class="relphi-skinny-actions"><button type="button" data-skinny-action="copy" aria-label="Copy ' + slot + '">Copy</button><button type="button" data-skinny-action="edit" aria-label="Edit ' + slot + '">⚙</button></div></header>' +
      '<div class="relphi-skinny-seal" aria-label="Planetary hours signature"></div>' +
      '<div class="relphi-skinny-solo"><svg viewBox="0 0 240 240" role="img" aria-label="' + esc((payload.name || slot) + ' solo chart') + '"></svg></div>' +
      '<div class="relphi-skinny-ledger" role="list" aria-label="' + esc((payload.name || slot) + ' placements') + '">' + rows.map(function (key) {
        const item = map[key] || {};
        const bodyId = resolve(key);
        const signId = resolve(item.sign || '');
        return '<button type="button" class="relphi-skinny-row" role="listitem" data-slot="' + slot + '" data-placement-key="' + esc(key) + '" data-glyph-id="' + esc(bodyId) + '">' +
          glyphSvg(bodyId, key, 'relphi-skinny-body-glyph') +
          (signId ? glyphSvg(signId, item.sign, 'relphi-skinny-sign-glyph') : '<span></span>') +
          '<span class="relphi-skinny-coordinate">' + esc(coordinate(item)) + '</span>' +
          '<span class="relphi-skinny-house">' + (item.house == null || item.house === '' ? '' : esc(item.house)) + (item.retrograde ? ' ℞' : '') + '</span>' +
        '</button>';
      }).join('') + '</div>';
    if (portal) card.querySelector('.relphi-skinny-seal').appendChild(portal);
    else card.querySelector('.relphi-skinny-seal').innerHTML = '<span aria-hidden="true">⌁</span>';
  }

  async function drawCanonical(root) {
    const component = window.RelphiGlyphComponent;
    if (!component?.draw) return;
    root.querySelectorAll('svg[data-relphi-glyph]:not([data-ready])').forEach(function (svg) {
      const id = svg.dataset.relphiGlyph;
      if (!id) return;
      svg.dataset.ready = 'pending';
      component.draw(svg, id, { radius:13, padding:1, color:'currentColor' }).then(function () { svg.dataset.ready = 'true'; }).catch(function () { svg.dataset.ready = 'failed'; });
    });
  }

  async function drawSolo(slot, payload, card) {
    const svg = card.querySelector('.relphi-skinny-solo svg');
    const component = window.RelphiGlyphComponent;
    if (!svg || !component?.draw) return;
    svg.replaceChildren();
    const color = COLORS[slot];
    const map = placements(payload);
    const asc = ascLongitude(map);
    const cx = 120, cy = 120;
    function node(name, attrs) { const n = document.createElementNS(NS, name); Object.keys(attrs || {}).forEach(function (key) { n.setAttribute(key, attrs[key]); }); return n; }
    svg.appendChild(node('circle',{cx:cx,cy:cy,r:105,fill:'none',stroke:'#bbb','stroke-width':'1'}));
    svg.appendChild(node('circle',{cx:cx,cy:cy,r:82,fill:'none',stroke:'#bbb','stroke-width':'1'}));
    for (let i=0;i<12;i+=1) {
      const a = i * 30;
      const p1 = point(cx,cy,82,a), p2 = point(cx,cy,105,a);
      svg.appendChild(node('line',{x1:p1.x,y1:p1.y,x2:p2.x,y2:p2.y,stroke:'#aaa','stroke-width':'1'}));
      const signHost = node('g',{transform:'translate(' + point(cx,cy,94,a+15).x + ' ' + point(cx,cy,94,a+15).y + ')'});
      svg.appendChild(signHost);
      component.draw(signHost, SIGNS[i], {radius:7.5,padding:.5,color:'#111'}).catch(function(){});
    }
    const houseCusps = profile(payload).houseCusps || payload.houseCusps || payload.cusps;
    if (Array.isArray(houseCusps) && houseCusps.length >= 12) {
      houseCusps.slice(0,12).forEach(function (value) {
        const angle = normalize(180 + Number(value) - asc);
        const p1 = point(cx,cy,62,angle), p2 = point(cx,cy,82,angle);
        svg.appendChild(node('line',{x1:p1.x,y1:p1.y,x2:p2.x,y2:p2.y,stroke:'#333','stroke-width':'1.4'}));
      });
    }
    const entries = ordered(map).map(function (key) { return {key:key,item:map[key],id:resolve(key)}; }).filter(function (entry) { return entry.id && Number.isFinite(longitude(entry.item)); });
    entries.forEach(function (entry, index) {
      const angle = normalize(180 + longitude(entry.item) - asc);
      const anchor = point(cx,cy,78,angle);
      const lane = 68 - (index % 2) * 8;
      const display = point(cx,cy,lane,angle);
      svg.appendChild(node('line',{x1:anchor.x,y1:anchor.y,x2:display.x,y2:display.y,stroke:color,'stroke-width':'1','stroke-linecap':'round'}));
      const host = node('g',{transform:'translate(' + display.x + ' ' + display.y + ')','data-glyph-id':entry.id});
      svg.appendChild(host);
      component.draw(host, entry.id, {radius:7,padding:.5,color:color}).catch(function(){});
    });
  }

  function bind(card, slot, payload) {
    if (card.dataset.skinnyBound === 'true') return;
    card.dataset.skinnyBound = 'true';
    card.addEventListener('click', function (event) {
      const action = event.target.closest('[data-skinny-action]')?.dataset.skinnyAction;
      if (action === 'edit') card.dispatchEvent(new MouseEvent('click',{bubbles:true}));
      if (action === 'edit') document.querySelector('.relphi-v4-sky-panel[data-slot="' + slot + '"] [data-edit]')?.click();
      if (action === 'copy') {
        window.RelphiGlyphCopySerializer?.copySky(payload).then(function () {
          const button = card.querySelector('[data-skinny-action="copy"]');
          if (!button) return;
          const old = button.textContent; button.textContent = 'Copied'; setTimeout(function(){button.textContent=old;},1000);
        });
      }
    });
  }

  function renderCard(card) {
    const slot = card.dataset.workspaceSlot;
    const payload = read(KEYS[slot]);
    if (!slot || !payload) return;
    const signature = JSON.stringify([payload.name, profile(payload), placements(payload)]);
    if (card.dataset.skinnySignature === signature) { drawCanonical(card); return; }
    card.dataset.skinnySignature = signature;
    shell(slot,payload,card);
    bind(card,slot,payload);
    drawCanonical(card);
    drawSolo(slot,payload,card);
  }

  function styles() {
    if (document.getElementById('relphi-skinny-sky-card-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-skinny-sky-card-style';
    style.textContent = `
      @media(min-width:1180px){
        #relphiSkyWorkspace.has-sky-b{grid-template-columns:minmax(190px,220px) minmax(760px,1fr) minmax(190px,220px)!important;gap:14px!important}
      }
      .relphi-skinny-sky-card{--panel-accent:#dc1f18;color:#111;overflow:hidden}
      .relphi-skinny-sky-card.is-blue{--panel-accent:#3166e2}
      .relphi-skinny-head{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:.45rem;border-bottom:1px solid #e4e6ea}
      .relphi-skinny-head h2{margin:0;font-size:1rem;line-height:1.1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .relphi-skinny-actions{display:flex;align-items:center}.relphi-skinny-actions button{border:0;background:transparent;padding:.45rem .35rem;font:700 .72rem system-ui;cursor:pointer}.relphi-skinny-actions button:last-child{font-size:1rem}
      .relphi-skinny-seal{height:54px;overflow:hidden;position:relative;border-bottom:1px solid #eceef1;background:#faf9f7}
      .relphi-skinny-seal .relphi-ph-portal{position:absolute!important;width:132px!important;max-width:none!important;left:50%!important;top:-44px!important;transform:translateX(-50%)!important;margin:0!important}
      .relphi-skinny-solo{padding:.45rem}.relphi-skinny-solo svg{display:block;width:100%;height:auto;overflow:visible}
      .relphi-skinny-ledger{display:grid;border-top:1px solid #e4e6ea}
      .relphi-skinny-row{display:grid;grid-template-columns:22px 22px minmax(54px,1fr) 28px;align-items:center;gap:.25rem;min-height:27px;padding:.2rem .45rem;border:0;border-bottom:1px solid #eff0f2;background:#fff;color:inherit;text-align:left;cursor:pointer}
      .relphi-skinny-row:hover,.relphi-skinny-row:focus-visible{background:color-mix(in srgb,var(--panel-accent) 7%,#fff)}
      .relphi-skinny-body-glyph,.relphi-skinny-sign-glyph{display:block;width:18px;height:18px;overflow:visible;color:var(--panel-accent)}
      .relphi-skinny-sign-glyph{color:#111}.relphi-skinny-coordinate,.relphi-skinny-house{font-size:.76rem;font-variant-numeric:tabular-nums}.relphi-skinny-house{text-align:right;color:#666}
      @media(max-width:760px){.relphi-skinny-seal{height:64px}.relphi-skinny-solo{max-width:320px;margin:auto}}
    `;
    document.head.appendChild(style);
  }

  function run() { queued = false; styles(); document.querySelectorAll('#relphiSkyWorkspace .relphi-workspace-sky').forEach(renderCard); }
  function queue() { if (queued) return; queued = true; requestAnimationFrame(run); }
  function start() { run(); new MutationObserver(queue).observe(document.body,{childList:true,subtree:true}); window.addEventListener('storage',queue); window.addEventListener('relphi:extra-points-updated',queue); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();