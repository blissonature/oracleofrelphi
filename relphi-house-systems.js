/* Relphi House Systems
   Browser-safe cusp engine layered on top of Astronomy Engine primitives.
   Input degrees are tropical ecliptic longitude unless noted.
*/
(function(){
  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;
  const SYSTEMS = {
    'whole-sign': 'Whole Sign',
    'equal-house': 'Equal House',
    'porphyry': 'Porphyry',
    'placidus': 'Placidus',
    'alcabitius': 'Alcabitius',
    'regiomontanus': 'Regiomontanus',
    'campanus': 'Campanus',
    'koch': 'Koch'
  };
  function normDeg(x){ x = Number(x); return ((x % 360) + 360) % 360; }
  function forwardArc(from, to){ return (normDeg(to) - normDeg(from) + 360) % 360; }
  function angleDistance(a,b){ const d = Math.abs(forwardArc(a,b)); return Math.min(d, 360-d); }
  function sinDeg(x){ return Math.sin(x * DEG); }
  function cosDeg(x){ return Math.cos(x * DEG); }
  function tanDeg(x){ return Math.tan(x * DEG); }
  function asinDeg(x){ return Math.asin(Math.max(-1, Math.min(1, x))) * RAD; }
  function atan2Deg(y,x){ return Math.atan2(y,x) * RAD; }
  function clampLat(lat){ return Math.max(-89.999, Math.min(89.999, Number(lat))); }
  function vdot(a,b){ return a.x*b.x + a.y*b.y + a.z*b.z; }
  function vcross(a,b){ return { x:a.y*b.z - a.z*b.y, y:a.z*b.x - a.x*b.z, z:a.x*b.y - a.y*b.x }; }
  function vscale(a,s){ return { x:a.x*s, y:a.y*s, z:a.z*s }; }
  function vadd(a,b){ return { x:a.x+b.x, y:a.y+b.y, z:a.z+b.z }; }
  function vnorm(a){ const m = Math.sqrt(vdot(a,a)) || 1; return { x:a.x/m, y:a.y/m, z:a.z/m }; }
  function eclipticNormal(eps){ return { x:0, y:-sinDeg(eps), z:cosDeg(eps) }; }
  function vectorToEclipticLongitude(v, eps){
    const yEcl = v.y * cosDeg(eps) + v.z * sinDeg(eps);
    return normDeg(atan2Deg(yEcl, v.x));
  }
  function eclRaDec(lon, eps){
    const x = cosDeg(lon);
    const y = sinDeg(lon) * cosDeg(eps);
    const z = sinDeg(lon) * sinDeg(eps);
    return { ra:normDeg(atan2Deg(y,x)), dec:asinDeg(z) };
  }
  function eclFromRa(ra, eps){ return normDeg(atan2Deg(sinDeg(ra) / Math.max(1e-12, cosDeg(eps)), cosDeg(ra))); }
  function ascFromLst(lst, lat, eps){
    const theta = normDeg(lst) * DEG;
    const phi = clampLat(lat) * DEG;
    const ob = eps * DEG;
    return normDeg(Math.atan2(-Math.cos(theta), Math.sin(theta) * Math.cos(ob) + Math.tan(phi) * Math.sin(ob)) * RAD + 180);
  }
  function mcFromLst(lst, eps){
    const theta = normDeg(lst) * DEG;
    const ob = eps * DEG;
    return normDeg(Math.atan2(Math.sin(theta), Math.cos(theta) * Math.cos(ob)) * RAD);
  }
  function refPorphyry(asc, mc){
    const dsc = normDeg(asc + 180), ic = normDeg(mc + 180);
    return [
      asc,
      normDeg(asc + forwardArc(asc, ic)/3),
      normDeg(asc + 2*forwardArc(asc, ic)/3),
      ic,
      normDeg(ic + forwardArc(ic, dsc)/3),
      normDeg(ic + 2*forwardArc(ic, dsc)/3),
      dsc,
      normDeg(dsc + forwardArc(dsc, mc)/3),
      normDeg(dsc + 2*forwardArc(dsc, mc)/3),
      mc,
      normDeg(mc + forwardArc(mc, asc)/3),
      normDeg(mc + 2*forwardArc(mc, asc)/3)
    ].map(normDeg);
  }
  function chooseCandidate(candidates, ref){
    return candidates.slice().sort((a,b)=>angleDistance(a,ref)-angleDistance(b,ref))[0];
  }
  function intersectHouseCircleWithEcliptic(planeNormal, eps, ref){
    const v = vcross(planeNormal, eclipticNormal(eps));
    if (!Number.isFinite(v.x+v.y+v.z) || Math.sqrt(vdot(v,v)) < 1e-9) return normDeg(ref);
    const lonA = vectorToEclipticLongitude(v, eps);
    const lonB = normDeg(lonA + 180);
    return chooseCandidate([lonA, lonB], ref);
  }
  function localVectors(lst, lat){
    const L = normDeg(lst) * DEG;
    const p = clampLat(lat) * DEG;
    const zenith = vnorm({ x:Math.cos(p)*Math.cos(L), y:Math.cos(p)*Math.sin(L), z:Math.sin(p) });
    const east = vnorm({ x:-Math.sin(L), y:Math.cos(L), z:0 });
    const north = vnorm({ x:-Math.sin(p)*Math.cos(L), y:-Math.sin(p)*Math.sin(L), z:Math.cos(p) });
    return { zenith, east, north };
  }
  function circleProjectionCusps(kind, asc, mc, lst, lat, eps){
    const ref = refPorphyry(asc, mc);
    const { zenith, east, north } = localVectors(lst, lat);
    const cuspAngles = [90,120,150,180,210,240,270,300,330,0,30,60];
    return cuspAngles.map((a, i) => {
      let p;
      if (kind === 'campanus') {
        const rad = a * DEG;
        p = vnorm(vadd(vscale(zenith, Math.cos(rad)), vscale(east, Math.sin(rad))));
      } else {
        const ra = normDeg(lst + a) * DEG;
        p = { x:Math.cos(ra), y:Math.sin(ra), z:0 };
      }
      const planeNormal = vcross(north, p);
      return intersectHouseCircleWithEcliptic(planeNormal, eps, ref[i]);
    }).map(normDeg);
  }
  function ascensionalDifference(lon, lat, eps){
    const dec = eclRaDec(lon, eps).dec;
    const raw = tanDeg(clampLat(lat)) * tanDeg(dec);
    if (Math.abs(raw) >= 1) return null;
    return asinDeg(raw);
  }
  function placidusCusp(lst, lat, eps, offset, fraction, sign, ref){
    let lon = normDeg(ref);
    for (let i=0; i<30; i++) {
      const ad = ascensionalDifference(lon, lat, eps);
      if (ad === null) return null;
      const targetRa = normDeg(lst + offset + sign * fraction * ad);
      const next = chooseCandidate([eclFromRa(targetRa, eps), normDeg(eclFromRa(targetRa, eps) + 180)], ref);
      if (angleDistance(next, lon) < 1e-8) return normDeg(next);
      lon = next;
    }
    return normDeg(lon);
  }
  function placidusCusps(asc, mc, lst, lat, eps){
    if (Math.abs(Number(lat)) >= 66.55) throw new Error('Placidus can become undefined near polar latitudes.');
    const ref = refPorphyry(asc, mc);
    const c = Array(12).fill(null);
    c[0]=normDeg(asc); c[3]=normDeg(mc+180); c[6]=normDeg(asc+180); c[9]=normDeg(mc);
    c[10]=placidusCusp(lst, lat, eps, 30, 1/3, +1, ref[10]);
    c[11]=placidusCusp(lst, lat, eps, 60, 2/3, +1, ref[11]);
    c[1]=placidusCusp(lst, lat, eps, 120, 2/3, -1, ref[1]);
    c[2]=placidusCusp(lst, lat, eps, 150, 1/3, -1, ref[2]);
    if ([c[1],c[2],c[10],c[11]].some(x => x === null)) throw new Error('Placidus is undefined for this latitude/time.');
    c[4]=normDeg(c[10]+180); c[5]=normDeg(c[11]+180); c[7]=normDeg(c[1]+180); c[8]=normDeg(c[2]+180);
    return c.map(normDeg);
  }
  function alcabitiusCusps(asc, mc, lst, lat, eps){
    const raAsc = eclRaDec(asc, eps).ra;
    const arc = Math.max(1e-6, Math.min(179.999, forwardArc(lst, raAsc)));
    const c = Array(12).fill(null);
    c[0]=normDeg(asc); c[3]=normDeg(mc+180); c[6]=normDeg(asc+180); c[9]=normDeg(mc);
    c[11]=ascFromLst(lst - arc/3, lat, eps);
    c[10]=ascFromLst(lst - 2*arc/3, lat, eps);
    c[1]=ascFromLst(lst + arc/3, lat, eps);
    c[2]=ascFromLst(lst + 2*arc/3, lat, eps);
    c[4]=normDeg(c[10]+180); c[5]=normDeg(c[11]+180); c[7]=normDeg(c[1]+180); c[8]=normDeg(c[2]+180);
    return c.map(normDeg);
  }
  function kochCusps(asc, mc, lst, lat, eps){
    if (Math.abs(Number(lat)) >= 66.55) throw new Error('Koch can become undefined near polar latitudes.');
    const ref = refPorphyry(asc, mc);
    const adAsc = ascensionalDifference(asc, lat, eps);
    if (adAsc === null) throw new Error('Koch is undefined for this latitude/time.');
    const c = Array(12).fill(null);
    const lonForRa = (ra, refLon) => chooseCandidate([eclFromRa(ra, eps), normDeg(eclFromRa(ra, eps)+180)], refLon);
    c[0]=normDeg(asc); c[3]=normDeg(mc+180); c[6]=normDeg(asc+180); c[9]=normDeg(mc);
    c[10]=lonForRa(lst + 30 + adAsc/3, ref[10]);
    c[11]=lonForRa(lst + 60 + 2*adAsc/3, ref[11]);
    c[1]=lonForRa(lst + 120 - 2*adAsc/3, ref[1]);
    c[2]=lonForRa(lst + 150 - adAsc/3, ref[2]);
    c[4]=normDeg(c[10]+180); c[5]=normDeg(c[11]+180); c[7]=normDeg(c[1]+180); c[8]=normDeg(c[2]+180);
    return c.map(normDeg);
  }
  function calculateCusps(options){
    const system = normalizeSystem(options && options.system);
    const asc = normDeg(options && options.ascendant);
    const mc = normDeg(options && options.midheaven);
    const lst = normDeg(options && options.siderealDegrees);
    const eps = Number(options && options.obliquityDegrees);
    const lat = Number(options && options.latitude);
    if (!Number.isFinite(asc) || !Number.isFinite(mc)) throw new Error('House calculation needs Ascendant and Midheaven.');
    if (system === 'whole-sign') {
      const start = Math.floor(asc / 30) * 30;
      return result(system, Array.from({length:12}, (_,i)=>normDeg(start+i*30)), 'Whole-sign houses start at zero degrees of the rising sign.');
    }
    if (system === 'equal-house') return result(system, Array.from({length:12}, (_,i)=>normDeg(asc+i*30)), 'Equal houses start at the exact Ascendant degree.');
    if (system === 'porphyry') return result(system, refPorphyry(asc, mc), 'Porphyry trisects each quadrant between the angles.');
    if (!Number.isFinite(lst) || !Number.isFinite(eps) || !Number.isFinite(lat)) throw new Error(`${label(system)} needs latitude, local sidereal time, and obliquity.`);
    if (system === 'regiomontanus') return result(system, circleProjectionCusps('regiomontanus', asc, mc, lst, lat, eps), 'Regiomontanus divides the celestial equator and projects through the north/south horizon points.');
    if (system === 'campanus') return result(system, circleProjectionCusps('campanus', asc, mc, lst, lat, eps), 'Campanus divides the prime vertical and projects through the north/south horizon points.');
    if (system === 'placidus') return result(system, placidusCusps(asc, mc, lst, lat, eps), 'Placidus trisects diurnal/nocturnal motion arcs; it can be undefined near polar latitudes.');
    if (system === 'alcabitius') return result(system, alcabitiusCusps(asc, mc, lst, lat, eps), 'Alcabitius divides ascensional time between horizon and meridian.');
    if (system === 'koch') return result(system, kochCusps(asc, mc, lst, lat, eps), 'Koch is a time-based quadrant method; it can be undefined near polar latitudes.');
    return result('whole-sign', Array.from({length:12}, (_,i)=>normDeg(Math.floor(asc/30)*30+i*30)), 'Fallback to Whole Sign.');
  }
  function result(system, cusps, note){ return { system, label:label(system), cusps:cusps.map(normDeg), note }; }
  function label(system){ return SYSTEMS[normalizeSystem(system)] || 'Whole Sign'; }
  function normalizeSystem(system){
    const s = String(system || 'whole-sign').trim().toLowerCase().replace(/\s+/g,'-');
    if (/^whole/.test(s)) return 'whole-sign';
    if (/^equal/.test(s)) return 'equal-house';
    if (/porphyry/.test(s)) return 'porphyry';
    if (/placidus/.test(s)) return 'placidus';
    if (/alc?habitius|alcabitius/.test(s)) return 'alcabitius';
    if (/regio/.test(s)) return 'regiomontanus';
    if (/campanus/.test(s)) return 'campanus';
    if (/koch/.test(s)) return 'koch';
    return s in SYSTEMS ? s : 'whole-sign';
  }
  window.RelphiHouseSystems = { calculateCusps, normalizeSystem, label, systems:SYSTEMS, _debug:{ascFromLst, mcFromLst, eclRaDec, eclFromRa, circleProjectionCusps, placidusCusps, alcabitiusCusps, kochCusps} };
})();
