// Skinny Sky cards using the stable Planetary Hours mini-zodiac grammar.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NS = 'http://www.w3.org/2000/svg';
  const KEYS = { skyA:'relphiSkyChartA', skyB:'relphiSkyChartB' };
  const COLORS = { skyA:'#dc1f18', skyB:'#3166e2' };
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ORDER = ['Sun','Moon','Rising','Ascendant','ASC','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','Chiron','North Node','South Node','Lilith','Vertex','Part of Fortune','MC','IC','Descendant','Dsc','DSC'];
  const ANGLE_HOUSES = { rising:1, ascendant:1, asc:1, ac:1, descendant:7, dsc:7, dc:7, mc:10, midheaven:10, ic:4, 'imum coeli':4, imumcoeli:4 };
  let mountQueued = false;

  function read(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } }
  function placements(payload) { const value = payload && (payload.placements || payload); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
  function profile(payload) { return payload && payload.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {}; }
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function resolve(value) { try { return window.RelphiGlyphRegistry?.resolve(value)?.id || window.RelphiGlyphRegistry?.get(value)?.id || ''; } catch (_) { return ''; } }
  function coordinate(item) { return (item?.degree == null ? '' : Number(item.degree) + '°') + (item?.minute == null ? '' : String(Number(item.minute)).padStart(2,'0') + '′'); }
  function normalize(value) { value %= 360; return value < 0 ? value + 360 : value; }
  function longitude(item) {
    if (!item) return NaN;
    if (Number.isFinite(Number(item.longitude))) return normalize(Number(item.longitude));
    const sign = SIGNS.findIndex(name => name.toLowerCase() === String(item.sign || '').toLowerCase());
    return sign < 0 ? NaN : sign * 30 + Number(item.degree || 0) + Number(item.minute || 0) / 60;
  }
  function point(cx, cy, radius, degrees) { const r = degrees * Math.PI / 180; return { x:cx + Math.cos(r) * radius, y:cy + Math.sin(r) * radius }; }
  function ascLongitude(map) {
    const key = Object.keys(map).find(name => /^(rising|ascendant|asc|ac)$/i.test(name));
    return key ? longitude(map[key]) : 0;
  }
  function ordered(map) {
    return Object.keys(map).sort((a,b) => {
      const ai = ORDER.findIndex(name => name.toLowerCase() === a.toLowerCase());
      const bi = ORDER.findIndex(name => name.toLowerCase() === b.toLowerCase());
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
    });
  }
  function node(name, attrs) {
    const element = document.createElementNS(NS, name);
    Object.entries(attrs || {}).forEach(([key,value]) => element.setAttribute(key, String(value)));
    return element;
  }
  function glyphSvg(id, label, cls) {
    return '<svg class="' + cls + '" data-relphi-glyph="' + esc(id) + '" viewBox="-18 -18 36 36" role="img" aria-label="' + esc(label) + '"></svg>';
  }
  function signature(payload) {
    return JSON.stringify([payload?.name, profile(payload), ordered(placements(payload)).map(key => [key, placements(payload)[key]])]);
  }
  function cuspArray(payload) {
    const raw = profile(payload).houseCusps || payload?.houseCusps || payload?.cusps;
    if (!Array.isArray(raw) || raw.length < 12) return null;
    const cusps = raw.slice(0,12).map(Number);
    return cusps.every(Number.isFinite) ? cusps.map(normalize) : null;
  }
  function derivedHouse(key, item, payload) {
    const angleHouse = ANGLE_HOUSES[String(key || '').trim().toLowerCase()];
    if (angleHouse) return angleHouse;

    const raw = Number(item?.house);
    if (Number.isInteger(raw) && raw >= 1 && raw <= 12) return raw;

    const lon = longitude(item);
    const cusps = cuspArray(payload);
    if (!Number.isFinite(lon) || !cusps) return null;

    for (let index=0; index<12; index+=1) {
      const start = cusps[index];
      const end = cusps[(index+1)%12];
      const span = normalize(end - start) || 30;
      const offset = normalize(lon - start);
      if (offset < span || Math.abs(offset - span) < 1e-7) return index + 1;
    }
    return null;
  }

  function shell(slot, payload, card) {
    const map = placements(payload);
    const rows = ordered(map);
    card.classList.add('relphi-skinny-sky-card');
    card.innerHTML = '<header class="relphi-skinny-head"><span class="relphi-workspace-tab">' + (slot === 'skyA' ? 'Sky A' : 'Sky B') + '</span><h2>' + esc(payload.name || (slot === 'skyA' ? 'Sky A' : 'Sky B')) + '</h2><div class="relphi-skinny-actions"><button type="button" data-skinny-action="copy" aria-label="Copy ' + slot + '">Copy</button><button type="button" data-skinny-action="edit" aria-label="Edit ' + slot + '">⚙</button></div></header>' +
      '<div class="relphi-skinny-solo ph-current-wheel-card"><svg class="ph-current-wheel" viewBox="0 0 240 240" role="img" aria-label="' + esc((payload.name || slot) + ' mini zodiac') + '"></svg></div>' +
      '<div class="relphi-skinny-ledger" role="list" aria-label="' + esc((payload.name || slot) + ' placements') + '">' + rows.map(key => {
        const item = map[key] || {};
        const bodyId = resolve(key);
        const signId = resolve(item.sign || '');
        const house = derivedHouse(key,item,payload);
        return '<button type="button" class="relphi-skinny-row" role="listitem" data-slot="' + slot + '" data-placement-key="' + esc(key) + '" data-glyph-id="' + esc(bodyId) + '">' +
          glyphSvg(bodyId, key, 'relphi-skinny-body-glyph') +
          (signId ? glyphSvg(signId, item.sign, 'relphi-skinny-sign-glyph') : '<span></span>') +
          '<span class="relphi-skinny-coordinate">' + esc(coordinate(item)) + '</span>' +
          '<span class="relphi-skinny-house">' + (house == null ? '' : esc(house)) + (item.retrograde ? ' ℞' : '') + '</span>' +
        '</button>';
      }).join('') + '</div>';
  }

  function spreadMarkers(entries) {
    if (entries.length < 2) return entries.map(entry => ({...entry,displayAngle:entry.angle}));

    const sorted = entries.slice().sort((a,b) => a.angle - b.angle);
    let largestGap = -1;
    let cutAfter = 0;
    for (let i=0; i<sorted.length; i+=1) {
      const current = sorted[i].angle;
      const next = i === sorted.length - 1 ? sorted[0].angle + 360 : sorted[i+1].angle;
      const gap = next - current;
      if (gap > largestGap) { largestGap = gap; cutAfter = i; }
    }

    const linear = [];
    for (let step=1; step<=sorted.length; step+=1) {
      const entry = sorted[(cutAfter + step) % sorted.length];
      const angle = entry.angle + ((cutAfter + step) >= sorted.length ? 360 : 0);
      linear.push({...entry,unwrappedAngle:angle});
    }

    const clusterGap = 18;
    const minimum = 12;
    const clusters = [];
    let cluster = [linear[0]];
    for (let i=1; i<linear.length; i+=1) {
      if (linear[i].unwrappedAngle - linear[i-1].unwrappedAngle <= clusterGap) cluster.push(linear[i]);
      else { clusters.push(cluster); cluster = [linear[i]]; }
    }
    clusters.push(cluster);

    return clusters.flatMap(group => {
      if (group.length === 1) return [{...group[0],displayAngle:normalize(group[0].angle)}];
      const center = group.reduce((sum,entry) => sum + entry.unwrappedAngle,0) / group.length;
      return group.map((entry,index) => ({
        ...entry,
        displayAngle:normalize(center + (index - (group.length - 1) / 2) * minimum)
      }));
    });
  }

  async function drawMiniZodiac(slot, payload, card) {
    const svg = card.querySelector('.relphi-skinny-solo svg');
    const component = window.RelphiGlyphComponent;
    if (!svg || !component?.draw || !component?.createBubble) return;
    svg.replaceChildren();

    const color = COLORS[slot];
    const map = placements(payload);
    const asc = ascLongitude(map);
    const cx = 120, cy = 120;
    const coreR = 70, signR = 88, contactR = 92, headR = 108;

    svg.appendChild(node('circle',{class:'wheel-core',cx,cy,r:signR,fill:'#fffaf7',stroke:'#c4c1bc','stroke-width':'1.25'}));
    svg.appendChild(node('circle',{cx,cy,r:coreR,fill:'none',stroke:'#d8d4ce','stroke-width':'.8'}));

    for (let i=0; i<12; i+=1) {
      const boundary = normalize(180 + i * 30 - asc);
      const p1 = point(cx,cy,coreR,boundary), p2 = point(cx,cy,signR,boundary);
      svg.appendChild(node('line',{class:'sign-tick',x1:p1.x,y1:p1.y,x2:p2.x,y2:p2.y,stroke:'#6f6b66','stroke-width':'.55',opacity:'.42'}));
      const labelAngle = normalize(180 + i * 30 + 15 - asc);
      const lp = point(cx,cy,79,labelAngle);
      const signHost = node('g',{transform:'translate(' + lp.x + ' ' + lp.y + ')'});
      svg.appendChild(signHost);
      component.draw(signHost,SIGNS[i],{radius:6.4,padding:.4,color:'#4a4744'}).catch(()=>{});
    }

    const cusps = cuspArray(payload);
    if (cusps) {
      cusps.forEach((value,index) => {
        const angle = normalize(180 + value - asc);
        const p1 = point(cx,cy,0,angle), p2 = point(cx,cy,coreR,angle);
        svg.appendChild(node('line',{class:'house-cusp',x1:p1.x,y1:p1.y,x2:p2.x,y2:p2.y,stroke:'#77736e','stroke-width':'.62',opacity:'.24'}));
        const span = normalize(cusps[(index+1)%12] - value) || 30;
        const labelAngle = normalize(180 + value + span/2 - asc);
        const hp = point(cx,cy,48,labelAngle);
        const text = node('text',{class:'house-label',x:hp.x,y:hp.y,'text-anchor':'middle','dominant-baseline':'central',fill:'#5f5b56','font-size':'7','font-weight':'800',opacity:'.64'});
        text.textContent = String(index+1);
        svg.appendChild(text);
      });
    }

    const entries = ordered(map).map(key => ({key,item:map[key],id:resolve(key)})).filter(entry => entry.id && Number.isFinite(longitude(entry.item))).map(entry => {
      const angle = normalize(180 + longitude(entry.item) - asc);
      return {...entry,angle};
    });

    const jobs = [];
    spreadMarkers(entries).forEach((entry,index) => {
      const anchor = point(cx,cy,contactR,entry.angle);
      const lane = headR + (index % 2) * 7;
      const display = point(cx,cy,lane,entry.displayAngle);
      svg.appendChild(node('line',{class:'planet-center-ray',x1:cx,y1:cy,x2:anchor.x,y2:anchor.y,stroke:'#222','stroke-width':'.55',opacity:'.13'}));
      svg.appendChild(node('line',{class:'planet-stick',x1:anchor.x,y1:anchor.y,x2:display.x,y2:display.y,stroke:'#222','stroke-width':'.9',opacity:'.72','stroke-linecap':'round'}));
      svg.appendChild(node('circle',{class:'planet-contact',cx:anchor.x,cy:anchor.y,r:'2.1',fill:color,stroke:'#fff','stroke-width':'.7'}));
      const marker = node('g',{class:'planet-marker relphi-inscribed-lollipop',transform:'translate(' + display.x + ' ' + display.y + ')','data-glyph-id':entry.id});
      svg.appendChild(marker);
      const bubble = component.createBubble(marker,entry.id,{radius:8.2,padding:1,color:color,fill:'#fff',strokeWidth:2.35});
      if (bubble?.ready) jobs.push(bubble.ready);
    });
    await Promise.allSettled(jobs);
  }

  async function drawLedgerGlyphs(card) {
    const component = window.RelphiGlyphComponent;
    if (!component?.draw) return;
    const jobs = [];
    card.querySelectorAll('svg[data-relphi-glyph]:not([data-ready])').forEach(svg => {
      const id = svg.dataset.relphiGlyph;
      if (!id) return;
      svg.dataset.ready = 'pending';
      jobs.push(component.draw(svg,id,{radius:12,padding:1,color:'currentColor'}).then(()=>{svg.dataset.ready='true';}).catch(()=>{svg.dataset.ready='failed';}));
    });
    await Promise.allSettled(jobs);
  }

  function bind(card, slot, payload) {
    if (card.dataset.skinnyBound === 'true') return;
    card.dataset.skinnyBound = 'true';
    card.addEventListener('click', event => {
      const action = event.target.closest('[data-skinny-action]')?.dataset.skinnyAction;
      if (action === 'edit') document.querySelector('.relphi-v4-sky-panel[data-slot="' + slot + '"] [data-edit]')?.click();
      if (action === 'copy') {
        window.RelphiGlyphCopySerializer?.copySky(payload).then(() => {
          const button = card.querySelector('[data-skinny-action="copy"]');
          if (!button) return;
          const old = button.textContent; button.textContent = 'Copied'; setTimeout(()=>{button.textContent=old;},1000);
        });
      }
    });
  }

  function renderCard(card) {
    const slot = card.dataset.workspaceSlot;
    const payload = read(KEYS[slot]);
    if (!slot || !payload) return;
    const next = signature(payload);
    if (card.dataset.skinnySignature === next && card.querySelector('.relphi-skinny-solo svg')) return;
    card.dataset.skinnySignature = next;
    shell(slot,payload,card);
    bind(card,slot,payload);
    drawLedgerGlyphs(card);
    drawMiniZodiac(slot,payload,card);
  }

  function styles() {
    if (document.getElementById('relphi-skinny-sky-card-style')) return;
    const style = document.createElement('style');
    style.id = 'relphi-skinny-sky-card-style';
    style.textContent = `
      @media(min-width:1180px){#relphiSkyWorkspace.has-sky-b{grid-template-columns:minmax(152px,174px) minmax(840px,1fr) minmax(152px,174px)!important;gap:10px!important}}
      .relphi-skinny-sky-card{--panel-accent:#dc1f18;color:#111;overflow:hidden}.relphi-skinny-sky-card.is-blue{--panel-accent:#3166e2}
      .relphi-skinny-head{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:.25rem;border-bottom:1px solid #e4e6ea}.relphi-skinny-head .relphi-workspace-tab{padding:.42rem .72rem!important;font-size:.72rem!important}.relphi-skinny-head h2{margin:0;font-size:.82rem;line-height:1.1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.relphi-skinny-actions{display:flex;align-items:center}.relphi-skinny-actions button{border:0;background:transparent;padding:.3rem .22rem;font:700 .64rem system-ui;cursor:pointer}.relphi-skinny-actions button:last-child{font-size:.84rem}
      .relphi-skinny-solo{display:block;width:100%;margin:0;padding:.22rem .12rem .3rem;border:0;border-radius:0;background:#fff;box-shadow:none}.relphi-skinny-solo svg{display:block;width:min(146px,96%);height:auto;margin:0 auto;overflow:visible}
      .relphi-skinny-ledger{display:grid;border-top:1px solid #e4e6ea}.relphi-skinny-row{display:grid;grid-template-columns:17px 17px minmax(43px,1fr) 22px;align-items:center;gap:.16rem;min-height:22px;padding:.12rem .28rem;border:0;border-bottom:1px solid #eff0f2;background:#fff;color:inherit;text-align:left;cursor:pointer}.relphi-skinny-row:hover,.relphi-skinny-row:focus-visible{background:color-mix(in srgb,var(--panel-accent) 7%,#fff)}.relphi-skinny-body-glyph,.relphi-skinny-sign-glyph{display:block;width:14px;height:14px;overflow:visible;color:var(--panel-accent)}.relphi-skinny-sign-glyph{color:#111}.relphi-skinny-coordinate,.relphi-skinny-house{font-size:.66rem;font-variant-numeric:tabular-nums}.relphi-skinny-house{text-align:right;color:#666}
      @media(max-width:760px){.relphi-skinny-solo{max-width:230px;margin:auto}.relphi-skinny-solo svg{width:min(190px,94%)}}
    `;
    document.head.appendChild(style);
  }

  function mount() {
    mountQueued = false;
    styles();
    document.querySelectorAll('#relphiSkyWorkspace .relphi-workspace-sky').forEach(renderCard);
  }
  function queueMount() { if (mountQueued) return; mountQueued = true; requestAnimationFrame(mount); }
  function start() {
    mount();
    const root = document.getElementById('relphiSkyBuilderV4')?.parentElement || document.body;
    new MutationObserver(mutations => {
      if (mutations.some(m => Array.from(m.addedNodes).some(n => n.nodeType === 1 && (n.id === 'relphiSkyWorkspace' || n.querySelector?.('#relphiSkyWorkspace'))))) queueMount();
    }).observe(root,{childList:true,subtree:true});
    window.addEventListener('storage',queueMount);
    window.addEventListener('relphi:extra-points-updated',queueMount);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();