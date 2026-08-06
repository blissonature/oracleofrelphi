// Semantic lookup for the immutable masters in relphi-glyph-masters-v1.js.
(function(){
  'use strict';
  if(window.RelphiGlyphRegistry)return;

  const entries=[
    ['sun','Sun',['sun','☉','⊙']],
    ['moon','Moon',['moon','☽','☾']],
    ['mercury','Mercury',['mercury','☿']],
    ['venus','Venus',['venus','♀']],
    ['mars','Mars',['mars','♂']],
    ['jupiter','Jupiter',['jupiter','♃']],
    ['saturn','Saturn',['saturn','♄']],
    ['uranus','Uranus',['uranus','♅','⛢']],
    ['neptune','Neptune',['neptune','♆']],
    ['pluto','Pluto',['pluto','♇','⯓','pl']],
    ['chiron','Chiron',['chiron','⚷']],
    ['aries','Aries',['aries','♈']],
    ['taurus','Taurus',['taurus','♉']],
    ['gemini','Gemini',['gemini','♊']],
    ['cancer','Cancer',['cancer','♋']],
    ['leo','Leo',['leo','♌']],
    ['virgo','Virgo',['virgo','♍']],
    ['libra','Libra',['libra','♎']],
    ['scorpio','Scorpio',['scorpio','♏']],
    ['sagittarius','Sagittarius',['sagittarius','♐']],
    ['capricorn','Capricorn',['capricorn','♑']],
    ['aquarius','Aquarius',['aquarius','♒']],
    ['pisces','Pisces',['pisces','♓']],
    ['fire','Fire',['fire','fire element','element fire','🜂']],
    ['water','Water',['water','water element','element water','🜄']],
    ['air','Air',['air','air element','element air','🜁']],
    ['earth','Earth',['earth','earth element','element earth','🜃']],
    ['conjunction','Conjunction',['conjunction','conjunct','☌']],
    ['opposition','Opposition',['opposition','opposite','☍']],
    ['trine','Trine',['trine','△','▲']],
    ['square','Square',['square','□','■']],
    ['sextile','Sextile',['sextile','✶','⚹','*']],
    ['semi-sextile','Semi-Sextile',['semi-sextile','semisextile','semi sextile','⚺']],
    ['quincunx','Quincunx',['quincunx','inconjunct','⚻']],
    ['octile','Octile',['octile','semi-square','semisquare','semi square','∠']],
    ['tri-octile','Tri-Octile',['tri-octile','trioctile','tri octile','sesquiquadrate','sesqui-square','sesquisquare','⚼','∡']],
    ['quintile','Quintile',['quintile','Q','q']],
    ['bi-quintile','Bi-Quintile',['bi-quintile','biquintile','bi quintile','BQ','bQ','bq']],
    ['north-node','North Node',['north node','true node','mean node','ascending node','node','☊','no']],
    ['south-node','South Node',['south node','descending node','☋','so']],
    ['lilith','Lilith',['lilith','black moon lilith','bml','⚸']],
    ['part-of-fortune','Part of Fortune',['part of fortune','fortune','pars fortunae','pof','⊗','pa']],
    ['vertex','Vertex',['vertex','vx']],
    ['asc','Ascendant',['asc','ascendant','rising','ac']],
    ['dsc','Descendant',['dsc','descendant','dc']],
    ['mc','Midheaven',['mc','midheaven']],
    ['ic','Imum Coeli',['ic','imum coeli','imumcoeli']],
    ['hebrew-aleph','Aleph',['aleph','alef','א']],
    ['hebrew-beth','Beth',['beth','bet','beit','ב']],
    ['hebrew-gimel','Gimel',['gimel','gimmel','ג']],
    ['hebrew-daleth','Daleth',['daleth','dalet','daled','ד']],
    ['hebrew-heh','Heh',['heh','he','hei','ה']],
    ['hebrew-vav','Vav',['vav','vau','waw','ו']],
    ['hebrew-zayin','Zayin',['zayin','zain','zayn','ז']],
    ['hebrew-cheth','Cheth',['cheth','chet','heth','het','ח']],
    ['hebrew-teth','Teth',['teth','tet','ט']],
    ['hebrew-yod','Yod',['yod','yud','י']],
    ['hebrew-kaph','Kaph',['kaph','kaf','כ']],
    ['hebrew-lamed','Lamed',['lamed','ל']],
    ['hebrew-mem','Mem',['mem','מ']],
    ['hebrew-nun','Nun',['nun','נ']],
    ['hebrew-samekh','Samekh',['samekh','samech','ס']],
    ['hebrew-ayin','Ayin',['ayin','ע']],
    ['hebrew-peh','Peh',['peh','pe','פ']],
    ['hebrew-tzaddi','Tzaddi',['tzaddi','tzadi','tsadi','tsade','צ']],
    ['hebrew-qoph','Qoph',['qoph','qof','koph','kuf','ק']],
    ['hebrew-resh','Resh',['resh','ר']],
    ['hebrew-shin','Shin',['shin','ש']],
    ['hebrew-tav','Tav',['tav','tau','thav','ת']],
    ['greek-alpha','Alpha',['alpha','Α','α']],
    ['greek-beta','Beta',['beta','Β','β']],
    ['greek-gamma','Gamma',['gamma','Γ','γ']],
    ['greek-delta','Delta',['delta','Δ','δ']],
    ['greek-epsilon','Epsilon',['epsilon','epsílon','Ε','ε']],
    ['greek-zeta','Zeta',['zeta','Ζ','ζ']],
    ['greek-eta','Eta',['eta','Η','η']],
    ['greek-theta','Theta',['theta','thêta','Θ','θ']],
    ['greek-iota','Iota',['iota','Ι','ι']],
    ['greek-kappa','Kappa',['kappa','Κ','κ']],
    ['greek-lambda','Lambda',['lambda','lamda','Λ','λ']],
    ['greek-mu','Mu',['mu','Μ','μ']],
    ['greek-nu','Nu',['nu','Ν','ν']],
    ['greek-xi','Xi',['xi','Ξ','ξ']],
    ['greek-omicron','Omicron',['omicron','Ο','ο']],
    ['greek-pi','Pi',['pi','Π','π']],
    ['greek-rho','Rho',['rho','Ρ','ρ']],
    ['greek-sigma','Sigma',['sigma','Σ','σ','ς']],
    ['greek-tau','Tau',['tau','Τ','τ']],
    ['greek-upsilon','Upsilon',['upsilon','ypsilon','Υ','υ']],
    ['greek-phi','Phi',['phi','Φ','φ','ϕ']],
    ['greek-chi','Chi',['chi','Χ','χ']],
    ['greek-psi','Psi',['psi','Ψ','ψ']],
    ['greek-omega','Omega',['omega','Ω','ω']]
  ].map(([id,name,aliases])=>Object.freeze({id,name,aliases:Object.freeze(aliases)}));

  const byId=new Map(entries.map(entry=>[entry.id,entry]));
  const aliases=new Map();
  const normalize=value=>String(value||'').replace(/[\uFE0E\uFE0F]/g,'').trim().toLowerCase();
  entries.forEach(entry=>{
    aliases.set(normalize(entry.id),entry.id);
    aliases.set(normalize(entry.name),entry.id);
    entry.aliases.forEach(alias=>aliases.set(normalize(alias),entry.id));
  });

  function resolve(value){
    const id=aliases.get(normalize(value));
    return id?byId.get(id):null;
  }

  const masterIds=window.RelphiGlyphMasters?.ids||[];
  const registryIds=entries.map(entry=>entry.id);
  if(masterIds.length!==registryIds.length||registryIds.some(id=>!window.RelphiGlyphMasters.has(id))){
    throw new Error('Canonical glyph registry and master assets are out of sync.');
  }

  window.RelphiGlyphRegistry=Object.freeze({entries:Object.freeze(entries),get:id=>byId.get(id)||null,resolve,normalize});
})();
