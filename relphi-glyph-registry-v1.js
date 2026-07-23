// Canonical semantic registry for astrology glyphs used across Relphi.
(function () {
  'use strict';
  if (window.RelphiGlyphRegistry) return;

  const entries = [
    ['sun','Sun',['sun','☉','⊙'],'assets/planet-glyphs/sun.svg',1,0,0,null,'circle'],
    ['moon','Moon',['moon','☽','☾'],'assets/planet-glyphs/moon.svg',1,1.1,0.35,null,'circle'],
    ['mercury','Mercury',['mercury','☿'],'assets/planet-glyphs/mercury.svg',1,0,0,null,'circle'],
    ['venus','Venus',['venus','♀'],'assets/planet-glyphs/venus.svg',1,0,0,null,'circle'],
    ['mars','Mars',['mars','♂'],'assets/planet-glyphs/mars.svg',1,-0.95,0.9,null,'circle'],
    ['jupiter','Jupiter',['jupiter','♃'],'assets/planet-glyphs/jupiter.svg',1,0,0,null,'circle'],
    ['saturn','Saturn',['saturn','♄'],'assets/planet-glyphs/saturn.svg',1,0,0,null,'circle'],
    ['uranus','Uranus',['uranus','♅','⛢'],'assets/planet-glyphs/uranus.svg',1,0.05,0.8,null,'circle'],
    ['neptune','Neptune',['neptune','♆'],'assets/planet-glyphs/neptune.svg',1,0,1.3,null,'circle'],
    ['pluto','Pluto',['pluto','♇','⯓','pl'],'assets/planet-glyphs/pluto.svg',1,0,0,null,'circle'],
    ['north-node','North Node',['north node','true node','mean node','ascending node','node','☊','no'],null,1.18,0,-0.3,'☊','symbol','400'],
    ['south-node','South Node',['south node','descending node','☋','so'],null,1.18,0,0.3,'☋','symbol','400'],
    ['lilith','Lilith',['lilith','black moon lilith','bml','⚸'],null,1,0,0.7,'lilith','lilith','400'],
    ['part-of-fortune','Part of Fortune',['part of fortune','fortune','pars fortunae','pof','⊗','pa'],null,.92,0,0,'fortune','circle'],
    ['vertex','Vertex',['vertex','vx'],null,1,0,0,'Vx','letter','700'],
    ['asc','Ascendant',['asc','ascendant','rising','ac'],null,1,0,0,'ASC','letter','700'],
    ['dsc','Descendant',['dsc','descendant','dc'],null,1,0,0,'DSC','letter','700'],
    ['mc','Midheaven',['mc','midheaven'],null,1,0,0,'MC','letter','700'],
    ['ic','Imum Coeli',['ic','imum coeli','imumcoeli'],null,1,0,0,'IC','letter','700']
  ].map(([id,name,aliases,asset,scale,dx,dy,fallback,fitMode,fontWeight]) => ({ id,name,aliases,asset,scale,dx,dy,fallback,fitMode,fontWeight }));

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