// Finalizes calculated skies locally: five derived points plus Chiron.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname) || window.__relphiCalculatedPointStorageBridgeV6) return;
  window.__relphiCalculatedPointStorageBridgeV6 = true;

  const KEYS = new Set(['relphiSkyChartA','relphiSkyChartB']);
  const CORE = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
  const DERIVED = ['North Node','South Node','Lilith','Vertex','Part of Fortune'];
  const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const nativeSet = Storage.prototype.setItem;
  let activeKey = '';
  let activeUntil = 0;

  const norm = x => ((Number(x) % 360) + 360) % 360;
  const rad = x => Number(x) * Math.PI / 180;
  const deg = x => Number(x) * 180 / Math.PI;
  function mapOf(p) { const m = p && (p.placements || p); return m && typeof m === 'object' && !Array.isArray(m) ? m : null; }
  function keyOf(m, aliases) { const a = aliases.map(x => x.toLowerCase()); return Object.keys(m || {}).find(k => a.includes(String(k).trim().toLowerCase())) || ''; }
  function get(m, aliases) { const k = keyOf(m, aliases); return k ? m[k] : null; }
  function all(m, names) { return names.every(n => Boolean(get(m,[n]))); }
  function field(id) { return document.getElementById(id)?.value || ''; }
  function profileOf(p, key) {
    const existing = p.calcProfile && typeof p.calcProfile === 'object' ? p.calcProfile : {};
    const mayUseLiveFields = key && key === activeKey && Date.now() < activeUntil;
    if (!mayUseLiveFields) return Object.assign({}, existing);
    return Object.assign({}, existing, {
      dateTime:field('skyCalcDateTime') || existing.dateTime || '',
      latitude:field('skyCalcLatitude') || existing.latitude || '',
      longitude:field('skyCalcLongitude') || existing.longitude || '',
      location:field('skyCalcLocation') || existing.location || '',
      timeZone:field('skyCalcTimeZone') || existing.timeZone || '',
      houseSystem:field('skyCalcHouseSystem') || existing.houseSystem || 'whole-sign'
    });
  }
  function dateOf(p) {
    const values = [p.utcDateTime,p.utcIso,p.instant,p.dateTimeUtc,p.isoUtc,p.calculatedAtUtc,p.dateTime,p.datetime];
    for (const v of values) { const d = v && new Date(v); if (d && !Number.isNaN(d.getTime())) return d; }
    return null;
  }
  function lonOf(item) {
    if (!item || typeof item !== 'object') return NaN;
    if (Number.isFinite(Number(item.longitude))) return norm(item.longitude);
    const i = SIGNS.findIndex(s => s.toLowerCase() === String(item.sign || '').toLowerCase());
    return i < 0 ? NaN : norm(i*30 + Number(item.degree || 0) + Number(item.minute || 0)/60 + Number(item.second || 0)/3600);
  }
  function cusps(p) { const q = p.calcProfile || {}; return Array.isArray(q.houseCusps) ? q.houseCusps : Array.isArray(q.cusps) ? q.cusps : null; }
  function houseFor(lon,p) { const c = cusps(p); if (!c || c.length < 12) return ''; for (let i=0;i<12;i++) if (norm(lon-norm(c[i])) < norm(c[(i+1)%12]-norm(c[i]))) return i+1; return ''; }
  function itemFrom(lon,p,extra) {
    lon = norm(lon); let within = lon % 30, degree = Math.floor(within), minute = Math.round((within-degree)*60);
    if (minute === 60) { minute=0; degree++; }
    if (degree === 30) { degree=0; lon=norm(lon+1/3600); }
    return Object.assign({ sign:SIGNS[Math.floor(lon/30)], degree, minute, longitude:lon, house:houseFor(lon,p) }, extra || {});
  }
  function put(m,p,name,lon,extra,aliases=[]) {
    if (!Number.isFinite(lon)) return;
    const names=[name,...aliases].map(x=>x.toLowerCase());
    Object.keys(m).forEach(k=>{ if (names.includes(k.toLowerCase()) && k!==name) delete m[k]; });
    m[name]=itemFrom(lon,p,extra);
  }
  function meanNode(jd) { const T=(jd-2451545)/36525; return norm(125.0445479-1934.1362891*T+0.0020754*T*T+T*T*T/467441-Math.pow(T,4)/60616000); }
  function meanLilith(jd) { const T=(jd-2451545)/36525; return norm(83.3532465+4069.0137287*T-0.01032*T*T-Math.pow(T,3)/80053+Math.pow(T,4)/18999000+180); }
  function ra(lon,eps) { const L=rad(lon), E=rad(eps); return norm(deg(Math.atan2(Math.sin(L)*Math.cos(E),Math.cos(L)))); }
  function vertex(lst,lat,eps) {
    if (![lst,lat,eps].every(Number.isFinite)) return NaN;
    const L=rad(norm(lst)), P=rad(Math.max(-89.999,Math.min(89.999,lat))), E=rad(eps);
    const n={x:-Math.sin(P)*Math.cos(L),y:-Math.sin(P)*Math.sin(L),z:Math.cos(P)}, e={x:0,y:-Math.sin(E),z:Math.cos(E)};
    let a={x:n.y*e.z-n.z*e.y,y:n.z*e.x-n.x*e.z,z:n.x*e.y-n.y*e.x}; const q=Math.hypot(a.x,a.y,a.z)||1; a={x:a.x/q,y:a.y/q,z:a.z/q};
    const w={x:Math.sin(L),y:-Math.cos(L),z:0}; if (a.x*w.x+a.y*w.y+a.z*w.z<0) a={x:-a.x,y:-a.y,z:-a.z};
    return norm(deg(Math.atan2(a.y*Math.cos(E)+a.z*Math.sin(E),a.x)));
  }
  function augment(p, key) {
    const m=mapOf(p); if (!m || !all(m,CORE)) return p;
    p.calcProfile=profileOf(p,key);
    const q=p.calcProfile;
    const d=dateOf(q);
    const asc=lonOf(get(m,['Rising','Ascendant','ASC','AC']));
    const mc=lonOf(get(m,['MC','Midheaven']));
    const sun=lonOf(get(m,['Sun']));
    const moon=lonOf(get(m,['Moon']));
    if (d) {
      const jd=d.getTime()/86400000+2440587.5, node=meanNode(jd);
      put(m,p,'North Node',node,{retrograde:true,glyph:'☊',calculation:'mean lunar node'},['Node','Mean North Node']);
      put(m,p,'South Node',norm(node+180),{retrograde:true,glyph:'☋',calculation:'opposite mean lunar node'});
      put(m,p,'Lilith',meanLilith(jd),{glyph:'⚸',calculation:'mean lunar apogee'},['Black Moon Lilith','BML']);
    }
    const eps=Number(q.obliquityDegrees ?? q.obliquity ?? 23.4392911), lat=Number(q.latitude ?? q.lat ?? q.coordinates?.latitude);
    let lst=Number(q.siderealDegrees ?? q.localSiderealDegrees ?? q.lstDegrees ?? q.localSiderealTimeDegrees);
    if (!Number.isFinite(lst)&&Number.isFinite(mc)) lst=ra(mc,eps);
    put(m,p,'Vertex',vertex(lst,lat,eps),{glyph:'Vx',calculation:'prime vertical intersection'},['Vx']);
    if ([asc,sun,moon].every(Number.isFinite)) {
      const h=Number(get(m,['Sun'])?.house), day=Number.isFinite(h)?h>=7&&h<=12:true;
      put(m,p,'Part of Fortune',norm(day?asc+moon-sun:asc+sun-moon),{glyph:'⊗',calculation:day?'day formula':'night formula'},['Fortune','POF']);
    }
    return p;
  }
  function status(message,error) { const a=document.getElementById('skyCalcStatus'), b=document.getElementById('relphiV4Status'); if(a)a.textContent=message; if(b){b.textContent=message;b.hidden=false;b.classList.toggle('is-error',Boolean(error));} }
  function finish(key,p) {
    const m=mapOf(p), d=dateOf(p.calcProfile || {});
    try {
      if (!window.RelphiChironLocal) throw new Error('Local Chiron calculator did not load.');
      if (!d) throw new Error('This sky has no saved calculation date.');
      const c=window.RelphiChironLocal.calculate(d);
      put(m,p,'Chiron',c.longitude,{glyph:'⚷',retrograde:c.retrograde,calculation:c.source});
      nativeSet.call(localStorage,key,JSON.stringify(p));
      status('Calculated 20 placements, including Chiron.');
      window.dispatchEvent(new CustomEvent('relphi:extra-points-updated',{detail:{calculated:true,chiron:true,placementCount:Object.keys(m).length,key}}));
    } catch (e) {
      nativeSet.call(localStorage,key,JSON.stringify(p));
      status('Derived placements were kept isolated for this sky: '+e.message,true);
      window.dispatchEvent(new CustomEvent('relphi:extra-points-updated',{detail:{calculated:true,chiron:false,placementCount:Object.keys(m).length,key}}));
    } finally { activeKey=''; activeUntil=0; }
  }

  document.addEventListener('click',e=>{ if(e.target.closest?.('#skyCalcRun')){ activeUntil=Date.now()+10000; activeKey=document.getElementById('skyCalcTarget')?.value==='currentSky'?'relphiSkyChartB':'relphiSkyChartA'; } },true);
  Storage.prototype.setItem=function(key,value){
    if(this===localStorage&&KEYS.has(String(key))){
      try {
        const p=JSON.parse(String(value)), m=mapOf(p), isActive=Date.now()<activeUntil&&String(key)===activeKey;
        if(isActive){
          if(!m||!all(m,CORE)) return;
          augment(p,String(key));
          if(!all(m,DERIVED)) return;
          if(!get(m,['Chiron'])){ finish(String(key),p); return; }
        } else if(m&&all(m,CORE)&&p.calcProfile&&typeof p.calcProfile==='object') {
          augment(p,String(key));
        }
        value=JSON.stringify(p);
      } catch(_){}
    }
    return nativeSet.call(this,key,value);
  };
  window.RelphiCalculatedPointStorageBridge={augment:(p,key)=>augment(p,key||''),hasCompletePrimarySky:m=>all(m,CORE),calculateChiron:d=>window.RelphiChironLocal.calculate(d)};
})();