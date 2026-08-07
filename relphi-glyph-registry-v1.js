// Canonical semantic registry for glyphs used across Relphi.
(function () {
  'use strict';
  if (window.RelphiGlyphRegistry) return;

  const entries = [
    ['sun','Sun',['sun','☉','⊙'],'assets/planet-glyphs/sun.svg',1,0,0,null,'static-master'],
    ['moon','Moon',['moon','☽','☾'],'assets/planet-glyphs/moon.svg',1,0,0,null,'static-master'],
    ['mercury','Mercury',['mercury','☿'],'assets/planet-glyphs/mercury.svg',1,0,0,null,'static-master'],
    ['venus','Venus',['venus','♀'],'assets/planet-glyphs/venus.svg',1,0,0,null,'static-master'],
    ['mars','Mars',['mars','♂'],'assets/planet-glyphs/mars.svg',1,0,0,null,'static-master'],
    ['jupiter','Jupiter',['jupiter','♃'],'assets/planet-glyphs/jupiter.svg',1,0,0,null,'static-master'],
    ['saturn','Saturn',['saturn','♄'],'assets/planet-glyphs/saturn.svg',1,0,0,null,'static-master'],
    ['uranus','Uranus',['uranus','♅','⛢'],'assets/planet-glyphs/uranus.svg',1,0,0,null,'static-master'],
    ['neptune','Neptune',['neptune','♆'],'assets/planet-glyphs/neptune.svg',1,0,0,null,'static-master'],
    ['pluto','Pluto',['pluto','♇','⯓','pl'],'assets/planet-glyphs/pluto.svg',1,0,0,null,'static-master'],
    ['chiron','Chiron',['chiron','⚷'],null,1.242,0,0,'⚷','symbol','400'],
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
    ['fire','Fire',['fire','fire element','element fire','🜂'],'assets/element-glyphs/fire.svg',1,0,-2.2,null,'circle'],
    ['water','Water',['water','water element','element water','🜄'],'assets/element-glyphs/water.svg',1,0,2.2,null,'circle'],
    ['air','Air',['air','air element','element air','🜁'],'assets/element-glyphs/air.svg',1,0,-2.2,null,'circle'],
    ['earth','Earth',['earth','earth element','element earth','🜃'],'assets/element-glyphs/earth.svg',1,0,2.2,null,'circle'],
    ['conjunction','Conjunction',['conjunction','conjunct','☌'],'assets/aspect-glyphs/conjunction.svg',0.9,0,0,null,'circle'],
    ['opposition','Opposition',['opposition','opposite','☍'],'assets/aspect-glyphs/opposition.svg',1,0,0,null,'circle'],
    ['trine','Trine',['trine','△','▲'],'assets/element-glyphs/fire.svg',1,0,-2.2,null,'circle'],
    ['square','Square',['square','□','■'],'assets/aspect-glyphs/square.svg',0.9,0,0,null,'circle'],
    ['sextile','Sextile',['sextile','✶','⚹','*'],'assets/aspect-glyphs/sextile.svg',0.96,0,0,null,'circle'],
    ['semi-sextile','Semi-Sextile',['semi-sextile','semisextile','semi sextile','⚺'],'assets/aspect-glyphs/semi-sextile.svg',0.95,0,0,null,'circle'],
    ['quincunx','Quincunx',['quincunx','inconjunct','⚻'],'assets/aspect-glyphs/quincunx.svg',0.95,0,0,null,'circle'],
    ['octile','Octile',['octile','semi-square','semisquare','semi square','∠'],'assets/aspect-glyphs/octile.svg',0.95,0,0,null,'circle'],
    ['tri-octile','Tri-Octile',['tri-octile','trioctile','tri octile','sesquiquadrate','sesqui-square','sesquisquare','⚼','∡'],'assets/aspect-glyphs/tri-octile.svg',0.92,0,0,null,'circle'],
    ['quintile','Quintile',['quintile','Q','q'],'assets/aspect-glyphs/quintile.svg',0.96,0,-1.2,null,'circle'],
    ['bi-quintile','Bi-Quintile',['bi-quintile','biquintile','bi quintile','BQ','bQ','bq'],'assets/aspect-glyphs/bi-quintile.svg',0.92,0,0,null,'circle'],
    ['north-node','North Node',['north node','true node','mean node','ascending node','node','☊','no'],null,1.18,0,-0.3,'☊','symbol','400'],
    ['south-node','South Node',['south node','descending node','☋','so'],null,1.18,0,0.3,'☋','symbol','400'],
    ['lilith','Lilith',['lilith','black moon lilith','bml','⚸'],'assets/planet-glyphs/lilith.svg',1,0,0,null,'static-master'],
    ['part-of-fortune','Part of Fortune',['part of fortune','fortune','pars fortunae','pof','⊗','pa'],'assets/planet-glyphs/part-of-fortune.svg',1,0,0,null,'static-master'],
    ['vertex','Vertex',['vertex','vx'],null,1,0,0,'Vx','letter','700'],
    ['asc','Ascendant',['asc','ascendant','rising','ac'],null,1,0,0,'Asc','letter','700'],
    ['dsc','Descendant',['dsc','descendant','dc'],null,1,0,0,'Dsc','letter','700'],
    ['mc','Midheaven',['mc','midheaven'],null,1,0,0,'MC','letter','700'],
    ['ic','Imum Coeli',['ic','imum coeli','imumcoeli'],null,1,0,0,'IC','letter','700'],
    ['hebrew-aleph','Aleph',['aleph','alef','א'],null,1,0,0,'א','hebrew-letter','600'],
    ['hebrew-beth','Beth',['beth','bet','beit','ב'],null,1,0,0,'ב','hebrew-letter','600'],
    ['hebrew-gimel','Gimel',['gimel','gimmel','ג'],null,1,0,0,'ג','hebrew-letter','600'],
    ['hebrew-daleth','Daleth',['daleth','dalet','daled','ד'],null,1,0,0,'ד','hebrew-letter','600'],
    ['hebrew-heh','Heh',['heh','he','hei','ה'],null,1,0,0,'ה','hebrew-letter','600'],
    ['hebrew-vav','Vav',['vav','vau','waw','ו'],null,1,0,0,'ו','hebrew-letter','600'],
    ['hebrew-zayin','Zayin',['zayin','zain','zayn','ז'],null,1,0,0,'ז','hebrew-letter','600'],
    ['hebrew-cheth','Cheth',['cheth','chet','heth','het','ח'],null,1,0,0,'ח','hebrew-letter','600'],
    ['hebrew-teth','Teth',['teth','tet','ט'],null,1,0,0,'ט','hebrew-letter','600'],
    ['hebrew-yod','Yod',['yod','yud','י'],null,1,0,0,'י','hebrew-letter','600'],
    ['hebrew-kaph','Kaph',['kaph','kaf','כ'],null,1,0,0,'כ','hebrew-letter','600'],
    ['hebrew-lamed','Lamed',['lamed','ל'],null,1,0,0,'ל','hebrew-letter','600'],
    ['hebrew-mem','Mem',['mem','מ'],null,1,0,0,'מ','hebrew-letter','600'],
    ['hebrew-nun','Nun',['nun','נ'],null,1,0,0,'נ','hebrew-letter','600'],
    ['hebrew-samekh','Samekh',['samekh','samech','ס'],null,1,0,0,'ס','hebrew-letter','600'],
    ['hebrew-ayin','Ayin',['ayin','ע'],null,1,0,0,'ע','hebrew-letter','600'],
    ['hebrew-peh','Peh',['peh','pe','פ'],null,1,0,0,'פ','hebrew-letter','600'],
    ['hebrew-tzaddi','Tzaddi',['tzaddi','tzadi','tsadi','tsade','צ'],null,1,0,0,'צ','hebrew-letter','600'],
    ['hebrew-qoph','Qoph',['qoph','qof','koph','kuf','ק'],null,1,0,0,'ק','hebrew-letter','600'],
    ['hebrew-resh','Resh',['resh','ר'],null,1,0,0,'ר','hebrew-letter','600'],
    ['hebrew-shin','Shin',['shin','ש'],null,1,0,0,'ש','hebrew-letter','600'],
    ['hebrew-tav','Tav',['tav','tau','thav','ת'],null,1,0,0,'ת','hebrew-letter','600'],
    ['greek-alpha','Alpha',['alpha','Α','α'],null,1,0,0,'Α','greek-letter','600'],
    ['greek-beta','Beta',['beta','Β','β'],null,1,0,0,'Β','greek-letter','600'],
    ['greek-gamma','Gamma',['gamma','Γ','γ'],null,1,0,0,'Γ','greek-letter','600'],
    ['greek-delta','Delta',['delta','Δ','δ'],null,1,0,0,'Δ','greek-letter','600'],
    ['greek-epsilon','Epsilon',['epsilon','epsílon','Ε','ε'],null,1,0,0,'Ε','greek-letter','600'],
    ['greek-zeta','Zeta',['zeta','Ζ','ζ'],null,1,0,0,'Ζ','greek-letter','600'],
    ['greek-eta','Eta',['eta','Η','η'],null,1,0,0,'Η','greek-letter','600'],
    ['greek-theta','Theta',['theta','thêta','Θ','θ'],null,1,0,0,'Θ','greek-letter','600'],
    ['greek-iota','Iota',['iota','Ι','ι'],null,1,0,0,'Ι','greek-letter','600'],
    ['greek-kappa','Kappa',['kappa','Κ','κ'],null,1,0,0,'Κ','greek-letter','600'],
    ['greek-lambda','Lambda',['lambda','lamda','Λ','λ'],null,1,0,0,'Λ','greek-letter','600'],
    ['greek-mu','Mu',['mu','Μ','μ'],null,1,0,0,'Μ','greek-letter','600'],
    ['greek-nu','Nu',['nu','Ν','ν'],null,1,0,0,'Ν','greek-letter','600'],
    ['greek-xi','Xi',['xi','Ξ','ξ'],null,1,0,0,'Ξ','greek-letter','600'],
    ['greek-omicron','Omicron',['omicron','Ο','ο'],null,1,0,0,'Ο','greek-letter','600'],
    ['greek-pi','Pi',['pi','Π','π'],null,1,0,0,'Π','greek-letter','600'],
    ['greek-rho','Rho',['rho','Ρ','ρ'],null,1,0,0,'Ρ','greek-letter','600'],
    ['greek-sigma','Sigma',['sigma','Σ','σ','ς'],null,1,0,0,'Σ','greek-letter','600'],
    ['greek-tau','Tau',['tau','Τ','τ'],null,1,0,0,'Τ','greek-letter','600'],
    ['greek-upsilon','Upsilon',['upsilon','ypsilon','Υ','υ'],null,1,0,0,'Υ','greek-letter','600'],
    ['greek-phi','Phi',['phi','Φ','φ','ϕ'],null,1,0,0,'Φ','greek-letter','600'],
    ['greek-chi','Chi',['chi','Χ','χ'],null,1,0,0,'Χ','greek-letter','600'],
    ['greek-psi','Psi',['psi','Ψ','ψ'],null,1,0,0,'Ψ','greek-letter','600'],
    ['greek-omega','Omega',['omega','Ω','ω'],null,1,0,0,'Ω','greek-letter','600']
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