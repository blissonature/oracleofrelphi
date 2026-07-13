// Adds optional related-relationship navigation to an expanded Sky Chart comparison.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SETTINGS_KEY = 'relphiRelatedRelationshipsV1';
  const BODY_RE = /(☉|☽|☿|♀|♂|♃|♄|♅|♆|⯓|ASC|MC)\s*([♈♉♊♋♌♍♎♏♐♑♒♓])\s*(\d{1,2})°\s*(\d{1,2})′/g;
  const ORB_RE = /orb\s*(\d{1,2})°\s*(\d{1,2})′|(?:^|\s)(\d{1,2})°\s*(\d{1,2})′(?:\s|$)/i;
  const ASPECTS = [
    ['☌', 'conjunction'], ['☍', 'opposition'], ['□', 'square'], ['△', 'trine'], ['✶', 'sextile'],
    ['⚻', 'quincunx'], ['bQ', 'biquintile'], ['Q', 'quintile'], ['⚼', 'sesquiquadrate'], ['∠', 'semisquare']
  ];
  const BODY_NAME = {
    '☉':'Sun', '☽':'Moon', '☿':'Mercury', '♀':'Venus', '♂':'Mars', '♃':'Jupiter',
    '♄':'Saturn', '♅':'Uranus', '♆':'Neptune', '⯓':'Pluto', 'ASC':'Ascendant', 'MC':'Midheaven'
  };
  const SIGN_NAME = {
    '♈':'Aries', '♉':'Taurus', '♊':'Gemini', '♋':'Cancer', '♌':'Leo', '♍':'Virgo',
    '♎':'Libra', '♏':'Scorpio', '♐':'Sagittarius', '♑':'Capricorn', '♒':'Aquarius', '♓':'Pisces'
  };

  let queued = false;
  let activeSignPanel = null;

  function readSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      return {
        byAspect: saved.byAspect !== false,
        bySign: saved.bySign !== false,
        maxOrb: Math.min(10, Math.max(0, Number(saved.maxOrb == null ? 3 : saved.maxOrb)))
      };
    } catch (error) {
      return { byAspect:true, bySign:true, maxOrb:3 };
    }
  }

  function writeSettings(settings) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (error) {}
  }

  function placementKey(p) {
    return [p.body, p.sign, p.degree, p.minute].join('|');
  }

  function placementLabel(p) {
    return (BODY_NAME[p.body] || p.body) + ' in ' + (SIGN_NAME[p.sign] || p.sign) + ' ' + p.degree + '°' + String(p.minute).padStart(2, '0') + '′';
  }

  function parsePlacements(text) {
    const found = [];
    BODY_RE.lastIndex = 0;
    let match;
    while ((match = BODY_RE.exec(text))) {
      const item = { body:match[1], sign:match[2], degree:Number(match[3]), minute:Number(match[4]) };
      item.key = placementKey(item);
      if (!found.some(function (p) { return p.key === item.key; })) found.push(item);
    }
    return found;
  }

  function parseOrb(text) {
    const match = text.match(ORB_RE);
    if (!match) return null;
    const degree = Number(match[1] != null ? match[1] : match[3]);
    const minute = Number(match[2] != null ? match[2] : match[4]);
    return { degree:degree, minute:minute, total:degree * 60 + minute, label:degree + '° ' + String(minute).padStart(2, '0') + '′' };
  }

  function parseAspect(text) {
    for (let i = 0; i < ASPECTS.length; i += 1) {
      if (text.indexOf(ASPECTS[i][0]) !== -1 || new RegExp('\\b' + ASPECTS[i][1] + '\\b', 'i').test(text)) {
        return { symbol:ASPECTS[i][0], name:ASPECTS[i][1] };
      }
    }
    return { symbol:'', name:'relationship' };
  }

  function smallestRelationshipElement(node) {
    let el = node.nodeType === 1 ? node : node.parentElement;
    while (el && el !== document.body) {
      const text = (el.textContent || '').trim();
      const placements = parsePlacements(text);
      if (placements.length >= 2 && placements.length <= 3 && parseOrb(text) && text.length < 1800) {
        const parentText = el.parentElement ? (el.parentElement.textContent || '').trim() : '';
        const parentPlacements = parsePlacements(parentText);
        if (parentPlacements.length > 3 || parentText.length >= 1800) return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  function collectRelationships() {
    const seen = new Set();
    const rows = [];
    const all = document.querySelectorAll('body *');
    all.forEach(function (el) {
      if (el.children.length > 8) return;
      const text = (el.textContent || '').trim();
      if (text.length < 20 || text.length > 1800) return;
      const placements = parsePlacements(text);
      const orb = parseOrb(text);
      if (placements.length < 2 || !orb) return;
      const root = smallestRelationshipElement(el);
      if (!root || seen.has(root)) return;
      seen.add(root);
      const rootText = (root.textContent || '').trim();
      const rootPlacements = parsePlacements(rootText);
      if (rootPlacements.length < 2) return;
      rows.push({
        element:root,
        placements:rootPlacements.slice(0, 2),
        orb:parseOrb(rootText) || orb,
        aspect:parseAspect(rootText),
        text:rootText
      });
    });
    return rows;
  }

  function findDetailPanels() {
    const results = [];
    document.querySelectorAll('body *').forEach(function (el) {
      if (el.querySelector('.relphi-related-relationships')) return;
      const ownText = Array.prototype.filter.call(el.childNodes, function (node) { return node.nodeType === 3; }).map(function (node) { return node.nodeValue; }).join(' ');
      const full = (el.textContent || '').trim();
      if (!/Relationship reading/i.test(full)) return;
      if (parsePlacements(full).length < 2) return;
      let root = el;
      while (root.parentElement && root.parentElement !== document.body) {
        const parentText = (root.parentElement.textContent || '').trim();
        if (parentText.length > full.length * 2.4 || parsePlacements(parentText).length > 5) break;
        root = root.parentElement;
      }
      if (!results.includes(root)) results.push(root);
    });
    return results;
  }

  function relationshipId(row) {
    return row.placements.map(function (p) { return p.key; }).sort().join('~') + '~' + row.aspect.name;
  }

  function sameRelationship(row, selected) {
    const selectedKeys = selected.map(function (p) { return p.key; }).sort().join('~');
    return row.placements.map(function (p) { return p.key; }).sort().join('~') === selectedKeys;
  }

  function sharesEndpoint(row, selected) {
    return row.placements.some(function (p) {
      return selected.some(function (s) { return p.key === s.key; });
    });
  }

  function endpointSharedLabel(row, selected) {
    const shared = row.placements.find(function (p) { return selected.some(function (s) { return p.key === s.key; }); });
    return shared ? 'Shared ' + (BODY_NAME[shared.body] || shared.body) : 'Connected aspect';
  }

  function jumpToRelationship(row) {
    const target = row.element;
    const clickable = target.matches('button,summary,[role="button"]') ? target : target.querySelector('button,summary,[role="button"]');
    if (clickable) clickable.click();
    target.scrollIntoView({ behavior:'smooth', block:'center' });
    target.classList.add('relphi-related-highlight');
    window.setTimeout(function () { target.classList.remove('relphi-related-highlight'); }, 1800);
  }

  function signDistance(a, b) {
    return Math.abs((a.degree * 60 + a.minute) - (b.degree * 60 + b.minute));
  }

  function buildSignItems(selected, relationships, excludedKeys) {
    const placements = [];
    relationships.forEach(function (row) {
      row.placements.forEach(function (p) {
        if (!placements.some(function (x) { return x.key === p.key; })) placements.push(p);
      });
    });
    const items = [];
    selected.forEach(function (endpoint) {
      placements.forEach(function (candidate) {
        if (candidate.key === endpoint.key || candidate.sign !== endpoint.sign) return;
        const pairKey = [endpoint.key, candidate.key].sort().join('~');
        if (excludedKeys.has(pairKey) || items.some(function (item) { return item.pairKey === pairKey; })) return;
        items.push({
          kind:'sign',
          endpoint:endpoint,
          candidate:candidate,
          pairKey:pairKey,
          distance:signDistance(endpoint, candidate),
          title:(BODY_NAME[endpoint.body] || endpoint.body) + ' and ' + (BODY_NAME[candidate.body] || candidate.body) + ' in ' + (SIGN_NAME[endpoint.sign] || endpoint.sign),
          meta:'Related by sign · distance ' + Math.floor(signDistance(endpoint, candidate) / 60) + '° ' + String(signDistance(endpoint, candidate) % 60).padStart(2, '0') + '′'
        });
      });
    });
    return items.sort(function (a, b) { return a.distance - b.distance; });
  }

  function showSignPanel(host, item) {
    if (activeSignPanel && activeSignPanel.parentNode) activeSignPanel.remove();
    const panel = document.createElement('div');
    panel.className = 'relphi-sign-context';
    panel.innerHTML = '<div class="relphi-sign-context-head"><strong>By sign</strong><button type="button" aria-label="Close sign relationship">×</button></div>' +
      '<p><strong>' + placementLabel(item.endpoint) + '</strong> and <strong>' + placementLabel(item.candidate) + '</strong> occupy the same sign. This is sign-based context rather than a close supported aspect.</p>' +
      '<p class="relphi-related-meta">Distance: ' + Math.floor(item.distance / 60) + '° ' + String(item.distance % 60).padStart(2, '0') + '′</p>';
    panel.querySelector('button').addEventListener('click', function () { panel.remove(); if (activeSignPanel === panel) activeSignPanel = null; });
    host.appendChild(panel);
    activeSignPanel = panel;
  }

  function render(panel, relationships) {
    if (panel.querySelector('.relphi-related-relationships')) return;
    const selected = parsePlacements(panel.textContent || '').slice(0, 2);
    if (selected.length < 2) return;

    const settings = readSettings();
    const box = document.createElement('section');
    box.className = 'relphi-related-relationships';
    box.setAttribute('aria-label', 'Related relationships');
    box.innerHTML = '<div class="relphi-related-head"><h4>Related relationships</h4></div>' +
      '<div class="relphi-related-controls">' +
      '<label><input type="checkbox" data-related-by-aspect> By aspect</label>' +
      '<label class="relphi-related-orb">Maximum orb <input type="number" min="0" max="10" step="0.5" inputmode="decimal" data-related-max-orb>°</label>' +
      '<label><input type="checkbox" data-related-by-sign> By sign</label>' +
      '</div><div class="relphi-related-list"></div><button type="button" class="relphi-related-more" hidden>Show all related</button>';

    const byAspect = box.querySelector('[data-related-by-aspect]');
    const bySign = box.querySelector('[data-related-by-sign]');
    const maxOrb = box.querySelector('[data-related-max-orb]');
    const list = box.querySelector('.relphi-related-list');
    const more = box.querySelector('.relphi-related-more');
    byAspect.checked = settings.byAspect;
    bySign.checked = settings.bySign;
    maxOrb.value = settings.maxOrb;
    let expanded = false;

    function redraw() {
      const current = { byAspect:byAspect.checked, bySign:bySign.checked, maxOrb:Math.min(10, Math.max(0, Number(maxOrb.value || 0))) };
      writeSettings(current);
      const aspectItems = [];
      const excludedSignPairs = new Set();

      if (current.byAspect) {
        relationships.forEach(function (row) {
          if (sameRelationship(row, selected) || !sharesEndpoint(row, selected)) return;
          if (row.orb.total > current.maxOrb * 60) return;
          excludedSignPairs.add(row.placements.map(function (p) { return p.key; }).sort().join('~'));
          aspectItems.push({
            kind:'aspect', row:row, score:row.orb.total,
            title:placementLabel(row.placements[0]) + ' ' + row.aspect.name + ' ' + placementLabel(row.placements[1]),
            meta:endpointSharedLabel(row, selected) + ' · orb ' + row.orb.label
          });
        });
        aspectItems.sort(function (a, b) { return a.score - b.score; });
      }

      const signItems = current.bySign ? buildSignItems(selected, relationships, excludedSignPairs) : [];
      const allItems = aspectItems.concat(signItems);
      const visible = expanded ? allItems : allItems.slice(0, 5);
      list.innerHTML = '';

      if (!visible.length) {
        list.innerHTML = '<p class="relphi-related-empty">No related relationships match these settings.</p>';
      } else {
        visible.forEach(function (item) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'relphi-related-link';
          button.innerHTML = '<span>' + item.title + '</span><small>' + item.meta + '</small>';
          button.addEventListener('click', function () {
            if (item.kind === 'aspect') jumpToRelationship(item.row);
            else showSignPanel(box, item);
          });
          list.appendChild(button);
        });
      }

      more.hidden = allItems.length <= 5;
      more.textContent = expanded ? 'Show fewer' : 'Show all related (' + allItems.length + ')';
    }

    [byAspect, bySign, maxOrb].forEach(function (control) { control.addEventListener('change', redraw); });
    maxOrb.addEventListener('input', redraw);
    more.addEventListener('click', function () { expanded = !expanded; redraw(); });
    panel.appendChild(box);
    redraw();
  }

  function ensureStyles() {
    if (document.getElementById('relphi-related-relationship-styles')) return;
    const style = document.createElement('style');
    style.id = 'relphi-related-relationship-styles';
    style.textContent = '.relphi-related-relationships{margin-top:1rem;padding-top:1rem;border-top:1px solid rgba(0,0,0,.18)}.relphi-related-head h4{margin:0 0 .65rem}.relphi-related-controls{display:flex;flex-wrap:wrap;gap:.55rem 1rem;align-items:center;margin-bottom:.75rem;font-size:.92rem}.relphi-related-controls label{display:inline-flex;gap:.35rem;align-items:center}.relphi-related-orb input{width:4.5rem}.relphi-related-list{display:grid;gap:.45rem}.relphi-related-link{display:flex;flex-direction:column;align-items:flex-start;width:100%;padding:.7rem .8rem;text-align:left;border:1px solid rgba(0,0,0,.18);border-radius:.7rem;background:rgba(255,255,255,.72);cursor:pointer}.relphi-related-link:hover,.relphi-related-link:focus{border-color:#dc1f18;outline:none}.relphi-related-link small,.relphi-related-meta{margin-top:.2rem;opacity:.72}.relphi-related-more{margin-top:.65rem}.relphi-related-empty{margin:.25rem 0;opacity:.7}.relphi-sign-context{margin-top:.75rem;padding:.8rem;border:1px solid rgba(0,0,0,.18);border-radius:.7rem;background:rgba(255,255,255,.82)}.relphi-sign-context-head{display:flex;justify-content:space-between;align-items:center}.relphi-sign-context-head button{border:0;background:transparent;font-size:1.3rem;cursor:pointer}.relphi-related-highlight{outline:3px solid rgba(220,31,24,.5);outline-offset:4px;transition:outline-color .3s}@media(max-width:600px){.relphi-related-controls{display:grid;grid-template-columns:1fr 1fr}.relphi-related-orb{grid-column:1 / -1}.relphi-related-link{font-size:.92rem}}';
    document.head.appendChild(style);
  }

  function run() {
    ensureStyles();
    const relationships = collectRelationships();
    if (!relationships.length) return;
    findDetailPanels().forEach(function (panel) { render(panel, relationships); });
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; run(); });
  }

  function start() {
    run();
    new MutationObserver(schedule).observe(document.body, { childList:true, subtree:true, characterData:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();