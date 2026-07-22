// Canonical semantic registry for astrology glyphs used across Relphi.
(function () {
  'use strict';
  if (window.RelphiGlyphRegistry) return;

  const entries = [
    ['sun','Sun',['sun','☉','⊙'],'assets/planet-glyphs/sun.svg',1,0,0],
    ['moon','Moon',['moon','☽','☾'],'assets/planet-glyphs/moon.svg',1,0,0],
    ['mercury','Mercury',['mercury','☿'],'assets/planet-glyphs/mercury.svg',1,0,0],
    ['venus','Venus',['venus','♀'],'assets/planet-glyphs/venus.svg',1,0,0],
    ['mars','Mars',['mars','♂'],'assets/planet-glyphs/mars.svg',1,0,0],
    ['jupiter','Jupiter',['jupiter','♃'],'assets/planet-glyphs/jupiter.svg',1,0,0],
    ['saturn','Saturn',['saturn','♄'],'assets/planet-glyphs/saturn.svg',1,0,0],
    ['uranus','Uranus',['uranus','♅','⛢'],'assets/planet-glyphs/uranus.svg',1,0,0],
    ['neptune','Neptune',['neptune','♆'],'assets/planet-glyphs/neptune.svg',1,0,0],
    ['pluto','Pluto',['pluto','♇','⯓','pl'],'assets/planet-glyphs/pluto.svg',1,0,0],
    ['north-node','North Node',['north node','true node','mean node','ascending node','node','☊','no'],null,1.05,0,-0.5,'☊'],
    ['south-node','South Node',['south node','descending node','☋','so'],null,1.05,0,0.5,'☋'],
    ['lilith','Lilith',['lilith','black moon lilith','bml','⚸'],null,1.02,0,-0.6,'⚸'],
    ['part-of-fortune','Part of Fortune',['part of fortune','fortune','pars fortunae','pof','⊗','pa'],null,1.02,0,0,'fortune'],
    ['vertex','Vertex',['vertex','vx'],null,.82,0,0,'Vx'],
    ['asc','Ascendant',['asc','ascendant','rising','ac'],null,.76,0,0,'ASC'],
    ['dsc','Descendant',['dsc','descendant','dc'],null,.76,0,0,'DSC'],
    ['mc','Midheaven',['mc','midheaven'],null,.82,0,0,'MC'],
    ['ic','Imum Coeli',['ic','imum coeli','imumcoeli'],null,.82,0,0,'IC']
  ].map(([id,name,aliases,asset,scale,dx,dy,fallback]) => ({ id,name,aliases,asset,scale,dx,dy,fallback }));

  const byId = new Map(entries.map(entry => [entry.id, entry]));
  const aliases = new Map();
  const normalize = value => String(value || '').replace(/[\uFE0E\uFE0F]/g, '').trim().toLowerCase();
  entries.forEach(entry => {
    aliases.set(normalize(entry.id), entry.id);
    aliases.set(normalize(entry.name), entry.id);
    entry.aliases.forEach(alias => aliases.set(normalize(alias), entry.id));
  });

  function resolve(value) {
    const id = aliases.get(normalize(value));
    return id ? byId.get(id) : null;
  }

  window.RelphiGlyphRegistry = Object.freeze({
    entries: Object.freeze(entries),
    get: id => byId.get(id) || null,
    resolve,
    normalize
  });
})();