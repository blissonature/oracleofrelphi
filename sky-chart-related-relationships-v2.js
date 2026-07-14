// Adds related aspect and sign navigation to expanded Sky Chart relationship panels.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const KEY = 'relphiRelatedRelationshipsV1';
  const BODIES = '(☉|☽|☿|♀|♂|♃|♄|♅|♆|⯓|ASC|MC)';
  const SIGNS = '([♈♉♊♋♌♍♎♏♐♑♒♓])';
  const placementPattern = new RegExp(BODIES + '\\s*' + SIGNS + '\\s*(\\d{1,2})°\\s*(\\d{1,2})′', 'g');
  const aspectPairs = [['bQ','biquintile'],['☌','conjunction'],['☍','opposition'],['□','square'],['△','trine'],['✶','sextile'],['⚻','quincunx'],['⚼','sesquiquadrate'],['∠','semisquare'],['Q','quintile']];
  const bodyNames = {'☉':'Sun','☽':'Moon','☿':'Mercury','♀':'Venus','♂':'Mars','♃':'Jupiter','♄':'Saturn','♅':'Uranus','♆':'Neptune','⯓':'Pluto','ASC':'Ascendant','MC':'Midheaven'};
  const signNames = {'♈':'Aries','♉':'Taurus','♊':'Gemini','♋':'Cancer','♌':'Leo','♍':'Virgo','♎':'Libra','♏':'Scorpio','♐':'Sagittarius','♑':'Capricorn','♒':'Aquarius','♓':'Pisces'};
  let scheduled = false;

  function settings() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || '{}');
      return { byAspect:value.byAspect !== false, bySign:value.bySign !== false, maxOrb:Math.min(10, Math.max(0, Number(value.maxOrb == null ? 3 : value.maxOrb))) };
    } catch (error) { return { byAspect:true, bySign:true, maxOrb:3 }; }
  }
  function save(value) { try { localStorage.setItem(KEY, JSON.stringify(value)); } catch (error) {} }
  function key(p) { return [p.body,p.sign,p.degree,p.minute].join('|'); }
  function label(p) { return (bodyNames[p.body] || p.body) + ' in ' + (signNames[p.sign] || p.sign) + ' ' + p.degree + '°' + String(p.minute).padStart(2,'0') + '′'; }

  function placements(text) {
    const output = [];
    placementPattern.lastIndex = 0;
    let match;
    while ((match = placementPattern.exec(text))) {
      const p = { body:match[1], sign:match[2], degree:Number(match[3]), minute:Number(match[4]) };
      p.key = key(p);
      if (!output.some(function (item) { return item.key === p.key; })) output.push(p);
    }
    return output;
  }

  function orb(text) {
    let match = text.match(/orb\s*:?\s*(\d{1,2})°\s*(\d{1,2})′/i);
    if (!match) match = text.match(/(?:^|\n)\s*(\d{1,2})°\s*(\d{1,2})′\s*(?:left|right|neutral)?\s*(?:\n|$)/im);
    if (!match) return null;
    const degree = Number(match[1]);
    const minute = Number(match[2]);
    return { total:degree * 60 + minute, label:degree + '° ' + String(minute).padStart(2,'0') + '′' };
  }

  function aspect(text) {
    for (let i = 0; i < aspectPairs.length; i += 1) {
      const pair = aspectPairs[i];
      if (text.indexOf(pair[0]) !== -1 || new RegExp('\\b' + pair[1] + '\\b','i').test(text)) return { symbol:pair[0], name:pair[1] };
    }
    return { symbol:'', name:'relationship' };
  }

  function smallestCard(start) {
    let node = start;
    let best = null;
    while (node && node !== document.body) {
      const text = (node.textContent || '').trim();
      const ps = placements(text);
      if (ps.length >= 2 && ps.length <= 3 && orb(text) && text.length < 1800) best = node;
      if (best && (ps.length > 3 || text.length >= 1800)) break;
      node = node.parentElement;
    }
    return best;
  }

  function relationshipRows() {
    const rows = [];
    const seen = new Set();
    document.querySelectorAll('body *').forEach(function (node) {
      const text = (node.textContent || '').trim();
      if (text.length < 20 || text.length > 1000 || placements(text).length < 2 || !orb(text)) return;
      const card = smallestCard(node);
      if (!card || seen.has(card)) return;
      const cardText = (card.textContent || '').trim();
      const ps = placements(cardText);
      const cardOrb = orb(cardText);
      if (ps.length < 2 || !cardOrb) return;
      seen.add(card);
      rows.push({ element:card, placements:ps.slice(0,2), orb:cardOrb, aspect:aspect(cardText) });
    });
    return rows;
  }

  function detailPanels() {
    const panels = [];
    document.querySelectorAll('body *').forEach(function (node) {
      if (node.querySelector('.relphi-related-relationships')) return;
      const text = (node.textContent || '').trim();
      if (!/Relationship reading/i.test(text) || placements(text).length < 2) return;
      let panel = node;
      while (panel.parentElement && panel.parentElement !== document.body) {
        const parentText = (panel.parentElement.textContent || '').trim();
        if (placements(parentText).length > 5 || parentText.length > text.length * 2.4) break;
        panel = panel.parentElement;
      }
      if (!panels.includes(panel)) panels.push(panel);
    });
    return panels;
  }

  function samePair(row, selected) {
    return row.placements.map(function (p) { return p.key; }).sort().join('~') === selected.map(function (p) { return p.key; }).sort().join('~');
  }
  function shared(row, selected) { return row.placements.find(function (p) { return selected.some(function (s) { return s.key === p.key; }); }); }

  function jump(row) {
    const clicker = row.element.matches('button,summary,[role="button"]') ? row.element : row.element.querySelector('button,summary,[role="button"]');
    if (clicker) clicker.click();
    row.element.scrollIntoView({behavior:'smooth',block:'center'});
    row.element.classList.add('relphi-related-highlight');
    setTimeout(function () { row.element.classList.remove('relphi-related-highlight'); }, 1800);
  }

  function addSignContext(host, a, b) {
    const old = host.querySelector('.relphi-sign-context');
    if (old) old.remove();
    const distance = Math.abs((a.degree * 60 + a.minute) - (b.degree * 60 + b.minute));
    const panel = document.createElement('div');
    panel.className = 'relphi-sign-context';
    panel.innerHTML = '<div class="relphi-sign-context-head"><strong>By sign</strong><button type="button" aria-label="Close">×</button></div><p><strong>' + label(a) + '</strong> and <strong>' + label(b) + '</strong> occupy the same sign. This is sign-based context rather than a close supported aspect.</p><small>Distance: ' + Math.floor(distance / 60) + '° ' + String(distance % 60).padStart(2,'0') + '′</small>';
    panel.querySelector('button').addEventListener('click', function () { panel.remove(); });
    host.appendChild(panel);
  }

  function render(panel, rows) {
    if (panel.querySelector('.relphi-related-relationships')) return;
    const selected = placements(panel.textContent || '').slice(0,2);
    if (selected.length < 2) return;
    const initial = settings();
    const box = document.createElement('section');
    box.className = 'relphi-related-relationships';
    box.innerHTML = '<h4>Related relationships</h4><div class="relphi-related-controls"><label><input type="checkbox" data-by-aspect> By aspect</label><label class="relphi-related-orb">Maximum orb <input type="number" min="0" max="10" step="0.5" inputmode="decimal" data-max-orb>°</label><label><input type="checkbox" data-by-sign> By sign</label></div><div class="relphi-related-list"></div><button type="button" class="relphi-related-more" hidden>Show all related</button>';
    const byAspect = box.querySelector('[data-by-aspect]');
    const bySign = box.querySelector('[data-by-sign]');
    const maxOrb = box.querySelector('[data-max-orb]');
    const list = box.querySelector('.relphi-related-list');
    const more = box.querySelector('.relphi-related-more');
    byAspect.checked = initial.byAspect;
    bySign.checked = initial.bySign;
    maxOrb.value = initial.maxOrb;
    let expanded = false;

    function redraw() {
      const current = { byAspect:byAspect.checked, bySign:bySign.checked, maxOrb:Math.min(10,Math.max(0,Number(maxOrb.value || 0))) };
      save(current);
      const items = [];
      const aspectPairsSeen = new Set();
      if (current.byAspect) rows.forEach(function (row) {
        const endpoint = shared(row,selected);
        if (!endpoint || samePair(row,selected) || row.orb.total > current.maxOrb * 60) return;
        const pair = row.placements.map(function (p) { return p.key; }).sort().join('~');
        aspectPairsSeen.add(pair);
        items.push({ kind:'aspect', score:row.orb.total, title:label(row.placements[0]) + ' ' + row.aspect.name + ' ' + label(row.placements[1]), meta:'Shared ' + (bodyNames[endpoint.body] || endpoint.body) + ' · orb ' + row.orb.label, row:row });
      });
      if (current.bySign) {
        const allPlacements = [];
        rows.forEach(function (row) { row.placements.forEach(function (p) { if (!allPlacements.some(function (x) { return x.key === p.key; })) allPlacements.push(p); }); });
        selected.forEach(function (endpoint) { allPlacements.forEach(function (candidate) {
          if (endpoint.key === candidate.key || endpoint.sign !== candidate.sign) return;
          const pair = [endpoint.key,candidate.key].sort().join('~');
          if (aspectPairsSeen.has(pair) || items.some(function (item) { return item.pair === pair; })) return;
          const distance = Math.abs((endpoint.degree * 60 + endpoint.minute) - (candidate.degree * 60 + candidate.minute));
          items.push({ kind:'sign', score:10000 + distance, pair:pair, title:(bodyNames[endpoint.body] || endpoint.body) + ' and ' + (bodyNames[candidate.body] || candidate.body) + ' in ' + (signNames[endpoint.sign] || endpoint.sign), meta:'Related by sign · distance ' + Math.floor(distance / 60) + '° ' + String(distance % 60).padStart(2,'0') + '′', a:endpoint, b:candidate });
        }); });
      }
      items.sort(function (a,b) { return a.score - b.score; });
      const visible = expanded ? items : items.slice(0,5);
      list.innerHTML = '';
      if (!visible.length) list.innerHTML = '<p class="relphi-related-empty">No related relationships match these settings.</p>';
      visible.forEach(function (item) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'relphi-related-link';
        button.innerHTML = '<span>' + item.title + '</span><small>' + item.meta + '</small>';
        button.addEventListener('click', function () { if (item.kind === 'aspect') jump(item.row); else addSignContext(box,item.a,item.b); });
        list.appendChild(button);
      });
      more.hidden = items.length <= 5;
      more.textContent = expanded ? 'Show fewer' : 'Show all related (' + items.length + ')';
    }
    [byAspect,bySign,maxOrb].forEach(function (control) { control.addEventListener('change',redraw); });
    maxOrb.addEventListener('input',redraw);
    more.addEventListener('click',function () { expanded = !expanded; redraw(); });
    panel.appendChild(box);
    redraw();
  }

  function style() {
    if (document.getElementById('relphi-related-styles')) return;
    const node = document.createElement('style');
    node.id = 'relphi-related-styles';
    node.textContent = '.relphi-related-relationships{margin-top:1rem;padding-top:1rem;border-top:1px solid rgba(0,0,0,.18)}.relphi-related-relationships h4{margin:0 0 .65rem}.relphi-related-controls{display:flex;flex-wrap:wrap;gap:.55rem 1rem;align-items:center;margin-bottom:.75rem;font-size:.92rem}.relphi-related-controls label{display:inline-flex;gap:.35rem;align-items:center}.relphi-related-orb input{width:4.5rem}.relphi-related-list{display:grid;gap:.45rem}.relphi-related-link{display:flex;flex-direction:column;align-items:flex-start;width:100%;padding:.7rem .8rem;text-align:left;border:1px solid rgba(0,0,0,.18);border-radius:.7rem;background:rgba(255,255,255,.72);cursor:pointer}.relphi-related-link:hover,.relphi-related-link:focus{border-color:#dc1f18;outline:none}.relphi-related-link small,.relphi-sign-context small{margin-top:.2rem;opacity:.72}.relphi-related-more{margin-top:.65rem}.relphi-related-empty{margin:.25rem 0;opacity:.7}.relphi-sign-context{margin-top:.75rem;padding:.8rem;border:1px solid rgba(0,0,0,.18);border-radius:.7rem;background:rgba(255,255,255,.82)}.relphi-sign-context-head{display:flex;justify-content:space-between;align-items:center}.relphi-sign-context-head button{border:0;background:transparent;font-size:1.3rem;cursor:pointer}.relphi-related-highlight{outline:3px solid rgba(220,31,24,.5);outline-offset:4px}@media(max-width:600px){.relphi-related-controls{display:grid;grid-template-columns:1fr 1fr}.relphi-related-orb{grid-column:1/-1}.relphi-related-link{font-size:.92rem}}';
    document.head.appendChild(node);
  }

  function run() {
    style();
    const rows = relationshipRows();
    if (!rows.length) return;
    detailPanels().forEach(function (panel) { render(panel,rows); });
  }
  function queue() { if (scheduled) return; scheduled = true; requestAnimationFrame(function () { scheduled = false; run(); }); }
  function start() { run(); new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,characterData:true}); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();