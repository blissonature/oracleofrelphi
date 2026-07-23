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
    ['aries','Aries',['aries','♈'],'assets/zodiac-glyphs/aries.svg',1,0,0.9,null,'circle'],
    ['taurus','Taurus',['taurus','♉'],'assets/zodiac-glyphs/taurus.svg',1,0,0.9,null,'circle'],
    ['gemini','Gemini',['gemini','♊'],'assets/zodiac-glyphs/gemini.svg',0.95,0,0,null,'circle'],
    ['cancer','Cancer',['cancer','♋'],'assets/zodiac-glyphs/cancer.svg',1,0,0,null,'circle'],
    ['leo','Leo',['leo','♌'],'assets/zodiac-glyphs/leo.svg',1,0,-0.9,null,'circle'],
    ['virgo','Virgo',['virgo','♍'],'assets/zodiac-glyphs/virgo.svg',1,0,0.45,null,'circle'],
    ['libra','Libra',['libra','♎'],'assets/zodiac-glyphs/libra.svg',1,0,-0.9,null,'circle'],
    ['scorpio','Scorpio',['scorpio','♏'],'assets/zodiac-glyphs/scorpio.svg',1,0,0.45,null,'circle'],
    ['sagittarius','Sagittarius',['sagittarius','♐'],'assets/zodiac-glyphs/sagittarius.svg',0.95,0,0,null,'circle'],
    ['capricorn','Capricorn',['capricorn','♑'],'assets/zodiac-glyphs/capricorn.svg',1,0,0.9,null,'circle'],
    ['aquarius','Aquarius',['aquarius','♒'],'assets/zodiac-glyphs/aquarius.svg',1,0,0,null,'circle'],
    ['pisces','Pisces',['pisces','♓'],'assets/zodiac-glyphs/pisces.svg',1,0,0,null,'circle'],
    ['fire','Fire',['fire','fire element','element fire','🜂'],'assets/element-glyphs/fire.svg',1,0,-3.35,null,'circle'],
    ['water','Water',['water','water element','element water','🜄'],'assets/element-glyphs/water.svg',1,0,3.35,null,'circle'],
    ['air','Air',['air','air element','element air','🜁'],'assets/element-glyphs/air.svg',1,0,-3.35,null,'circle'],
    ['earth','Earth',['earth','earth element','element earth','🜃'],'assets/element-glyphs/earth.svg',1,0,3.35,null,'circle'],
    ['north-node','North Node',['north node','true node','mean node','ascending node','node','☊','no'],null,1.18,0,-0.3,'☊','symbol','400'],
    ['south-node','South Node',['south node','descending node','☋','so'],null,1.18,0,0.3,'☋','symbol','400'],
    ['lilith','Lilith',['lilith','black moon lilith','bml','⚸'],'assets/planet-glyphs/lilith.svg',1,0,0,null,'lilith','400'],
    ['part-of-fortune','Part of Fortune',['part of fortune','fortune','pars fortunae','pof','⊗','pa'],null,.92,0,0,'fortune','circle'],
    ['vertex','Vertex',['vertex','vx'],null,1,0,0,'Vx','letter','700'],
    ['asc','Ascendant',['asc','ascendant','rising','ac'],null,1,0,0,'Asc','letter','700'],
    ['dsc','Descendant',['dsc','descendant','dc'],null,1,0,0,'Dsc','letter','700'],
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