// Progressive relationship language. Glyph identity and artwork come only from the unified registry.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const MEANING = {
    sun:'luminary: identity, vitality, and conscious purpose', moon:'luminary: feelings, instincts, and emotional needs',
    mercury:'planet: thought, perception, and communication', venus:'planet: values, attraction, affection, and relating',
    mars:'planet: drive, assertion, desire, and action', jupiter:'planet: growth, confidence, meaning, and expansion',
    saturn:'planet: structure, limits, responsibility, and commitment', uranus:'planet: freedom, disruption, originality, and change',
    neptune:'planet: imagination, sensitivity, surrender, and vision', pluto:'planet: power, depth, transformation, and compulsion',
    chiron:'minor body: wounding, medicine, teaching, and initiation through pain',
    'north-node':'lunar node: growth, appetite, direction, and unfamiliar development',
    'south-node':'lunar node: habit, residue, release, and familiar patterns',
    lilith:'calculated point: refusal, exile, autonomy, taboo, and uncompromised need',
    'part-of-fortune':'lot: material flow, embodied support, worldly ease, and circumstance',
    vertex:'calculated point: encounter, relational thresholds, and fated-feeling meetings',
    asc:'angle: the way a person enters life, meets the world, and is immediately perceived',
    dsc:'angle: partners, mirrors, others, and the relational horizon', mc:'angle: public direction, vocation, visibility, and the role a person grows toward',
    ic:'angle: roots, home, ancestry, privacy, and the hidden foundation',
    aries:'sign: initiative, directness, courage, impulse, and beginning', taurus:'sign: embodiment, value, pleasure, endurance, and material continuity',
    gemini:'sign: language, exchange, curiosity, movement, and multiplicity', cancer:'sign: care, protection, memory, belonging, and attachment',
    leo:'sign: radiance, creativity, pride, loyalty, and recognition', virgo:'sign: discernment, service, refinement, repair, and usefulness',
    libra:'sign: relationship, balance, fairness, dialogue, and mutual recognition', scorpio:'sign: intensity, secrecy, survival, bonding, and emotional truth',
    sagittarius:'sign: meaning, faith, exploration, philosophy, and freedom', capricorn:'sign: structure, responsibility, endurance, mastery, and worldly form',
    aquarius:'sign: systems, reform, collective intelligence, detachment, and future orientation', pisces:'sign: surrender, imagination, compassion, permeability, and release',
    conjunction:'aspect: a concentrated relationship in which the two functions operate together and intensify one another',
    opposition:'aspect: a polarized relationship that creates awareness through contrast, mirroring, and negotiation',
    square:'aspect: a tense, activating relationship that demands movement, effort, and development',
    trine:'aspect: a flowing, low-resistance relationship in which the two functions support one another naturally',
    sextile:'aspect: a cooperative relationship that creates usable opportunities when consciously engaged',
    'semi-sextile':'aspect: an adjacent relationship that creates subtle friction, awareness, and small continuing adjustments',
    quincunx:'aspect: an awkward but productive relationship that requires ongoing adjustment and recalibration',
    octile:'aspect: a tense minor relationship that produces irritation, pressure, and the need for corrective action',
    'tri-octile':'aspect: a compounded frictional relationship that builds agitation and demands sustained adjustment',
    quintile:'aspect: a fifth-harmonic relationship associated with creative intelligence, patterning, craft, and distinctive talent',
    'bi-quintile':'aspect: a doubled fifth-harmonic relationship associated with refined creative ability and complex pattern integration',
    fire:'element: initiative, enthusiasm, directness, and the urge to act', earth:'element: practicality, embodiment, stability, and material reality',
    air:'element: ideas, language, social exchange, and perspective', water:'element: feeling, intuition, receptivity, and emotional memory'
  };

  function registry() { return window.RelphiGlyphRegistry; }
  function component() { return window.RelphiGlyphComponent; }
  function resolve(value) { return registry()?.resolve(String(value || '').trim()) || null; }

  function glyphButton(entry) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'relphi-progressive-term relphi-progressive-glyph';
    button.dataset.glyphIdentity = entry.id;
    button.setAttribute('aria-label','Reveal ' + entry.name);
    button.setAttribute('aria-expanded','false');
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','-12 -12 24 24');
    svg.setAttribute('aria-hidden','true');
    svg.classList.add('relphi-progressive-svg');
    const group = document.createElementNS('http://www.w3.org/2000/svg','g');
    svg.appendChild(group); button.appendChild(svg);
    component().draw(group,entry.id,{radius:9.5,padding:.5,color:'#111'}).catch(function () {});
    return button;
  }

  function token(identity, meaning) {
    const entry = resolve(identity);
    if (!entry) return null;
    const wrap = document.createElement('span');
    wrap.className = 'relphi-progressive-token';
    const glyph = glyphButton(entry);
    glyph.addEventListener('click',function (event) {
      event.stopPropagation();
      const existing = wrap.querySelector('.relphi-progressive-name');
      if (existing) {
        wrap.querySelector('.relphi-progressive-meaning')?.remove(); existing.remove(); glyph.setAttribute('aria-expanded','false'); return;
      }
      const name = document.createElement('button');
      name.type = 'button'; name.className = 'relphi-progressive-term relphi-progressive-name'; name.textContent = ' ' + entry.name; name.setAttribute('aria-expanded','false');
      name.addEventListener('click',function (inner) {
        inner.stopPropagation();
        const old = wrap.querySelector('.relphi-progressive-meaning');
        if (old) { old.remove(); name.setAttribute('aria-expanded','false'); return; }
        const detail = document.createElement('button');
        detail.type = 'button'; detail.className = 'relphi-progressive-term relphi-progressive-meaning'; detail.textContent = ' (' + (meaning || MEANING[entry.id] || entry.name) + ')';
        detail.addEventListener('click',function (last) { last.stopPropagation(); detail.remove(); name.setAttribute('aria-expanded','false'); });
        wrap.appendChild(detail); name.setAttribute('aria-expanded','true');
      });
      wrap.appendChild(name); glyph.setAttribute('aria-expanded','true');
    });
    wrap.appendChild(glyph); return wrap;
  }

  function appendToken(parent,identity,meaning) {
    const node = token(identity,meaning);
    if (!node) return false;
    parent.appendChild(node); return true;
  }

  function placement(parent,body,sign,degree) {
    if (!appendToken(parent,body)) return false;
    parent.append(' in ');
    if (!appendToken(parent,sign)) return false;
    parent.append(' at ' + degree);
    return true;
  }

  function parse(value) {
    return value.match(/^(.+?)(?:'s|’s)\s+(.+?)\s+in\s+(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\s+([^\s]+)\s+forms an?\s+(.+?)\s+with\s+(.+?)(?:'s|’s)\s+(.+?)\s+in\s+(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\s+([^\.]+)\./i);
  }

  function rewrite(root) {
    const walker = document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[]; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      if (node.parentElement?.closest('.relphi-progressive-reading')) return;
      const value=(node.nodeValue || '').replace(/\s+/g,' ').trim();
      if (!/ forms an? /i.test(value)) return;
      const match=parse(value); if (!match) return;
      const bodyA=resolve(match[2]), signA=resolve(match[3]), aspect=resolve(match[5]), bodyB=resolve(match[7]), signB=resolve(match[8]);
      if (!bodyA || !signA || !aspect || !bodyB || !signB) return;
      const reading=document.createElement('span'); reading.className='relphi-progressive-reading';
      reading.append('Between ' + match[1].trim() + ' and ' + match[6].trim() + ', ');
      if (!placement(reading,bodyA.id,signA.id,match[4])) return;
      reading.append(' connects with ');
      if (!placement(reading,bodyB.id,signB.id,match[9].trim())) return;
      reading.append(' through '); if (!appendToken(reading,aspect.id)) return; reading.append('.');
      const elementMatch=value.match(/Shared\s+(fire|earth|air|water)\s+element/i);
      if (elementMatch) { const element=resolve(elementMatch[1]); if (element) { reading.append(' They share '); appendToken(reading,element.id); reading.append('.'); } }
      const orbMatch=value.match(/Orb:\s*([^\.]+(?:\.|$))/i); if (orbMatch) reading.append(' Orb: ' + orbMatch[1].trim());
      const hint=document.createElement('span'); hint.className='relphi-progressive-hint'; hint.textContent='Select a glyph for its name, then select the name for its meaning. Select either again to fold back.'; reading.appendChild(hint);
      node.parentNode?.replaceChild(reading,node);
    });
  }

  function styles() {
    if (document.getElementById('relphi-progressive-reading-styles')) return;
    const style=document.createElement('style'); style.id='relphi-progressive-reading-styles';
    style.textContent='.relphi-progressive-reading{line-height:1.75}.relphi-progressive-term{appearance:none;border:0;background:transparent;color:inherit;font:inherit;padding:0;cursor:pointer;text-align:left}.relphi-progressive-svg{width:1.2em;height:1.2em;display:inline-block;vertical-align:-.22em;overflow:visible}.relphi-progressive-name,.relphi-progressive-meaning{margin-left:.22em}.relphi-progressive-name{font-weight:800;text-decoration:underline dotted rgba(17,17,17,.38);text-underline-offset:.2em}.relphi-progressive-meaning{color:#554d48;font-weight:520}.relphi-progressive-term:focus-visible{outline:2px solid rgba(220,31,24,.32);outline-offset:2px;border-radius:.2em}.relphi-progressive-hint{display:block;margin-top:.55rem;color:#706761;font-size:.78rem;font-weight:650}';
    document.head.appendChild(style);
  }

  let observer,queued=false,running=false;
  function run() {
    if (running) return;
    if (!registry() || !component()) { setTimeout(schedule,80); return; }
    running=true; observer?.disconnect(); styles();
    document.querySelectorAll('body *').forEach(function (element) { if (/RELATIONSHIP READING/i.test(element.textContent || '')) rewrite(element); });
    observer?.observe(document.body,{childList:true,subtree:true,characterData:true}); running=false;
  }
  function schedule() { if (queued || running) return; queued=true; requestAnimationFrame(function () { queued=false; run(); }); }
  function start() {
    observer=new MutationObserver(function (records) {
      if (records.some(function (record) { return record.type==='characterData' || Array.from(record.addedNodes).some(function (node) { return node.nodeType===1 && !node.matches?.('.relphi-progressive-token,.relphi-progressive-svg'); }); })) schedule();
    });
    run();
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();