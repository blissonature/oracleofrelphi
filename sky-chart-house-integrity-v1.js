// House integrity: never let a stale persisted cusp array outrank the current sky geometry.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyHouseIntegrityV1)return;
  window.__relphiSkyHouseIntegrityV1=true;

  const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
  const SIGNS=['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  const SYSTEMS_WITHOUT_TIME=new Set(['whole-sign','equal-house','porphyry']);
  let running=false;

  const norm=value=>((Number(value)%360)+360)%360;
  const separation=(a,b)=>Math.abs(((Number(a)-Number(b)+180)%360+360)%360-180);
  const normalizedName=value=>String(value||'').toLowerCase().replace(/[._-]+/g,'').replace(/\s+/g,'');

  function read(slot){
    try{return JSON.parse(localStorage.getItem(KEYS[slot])||'null')}
    catch(_){return null}
  }

  function placementSource(payload){
    if(!payload||typeof payload!=='object')return{};
    if(payload.placements&&typeof payload.placements==='object'&&!Array.isArray(payload.placements))return payload.placements;
    return{};
  }

  function find(source,names){
    const wanted=new Set(names.map(normalizedName));
    for(const [key,item] of Object.entries(source||{})){
      if(wanted.has(normalizedName(item?.name||item?.label||key)))return item;
    }
    return null;
  }

  function longitudeOf(item){
    if(!item||typeof item!=='object')return NaN;
    const explicit=item.longitude;
    if(explicit!==null&&explicit!==''&&Number.isFinite(Number(explicit)))return norm(Number(explicit));
    const signName=String(item.sign||item.zodiac||'').trim().toLowerCase();
    const sign=SIGNS.indexOf(signName);
    if(sign<0)return NaN;
    const degree=Number(item.degree??item.degrees??0);
    const minute=Number(item.minute??item.minutes??0);
    const second=Number(item.second??item.seconds??0);
    if(![degree,minute,second].every(Number.isFinite))return NaN;
    return norm(sign*30+degree+minute/60+second/3600);
  }

  function profileAngle(profile,names){
    for(const name of names){
      const value=profile?.[name];
      if(value!==null&&value!==''&&Number.isFinite(Number(value)))return norm(Number(value));
    }
    return NaN;
  }

  function houseFor(value,cusps){
    for(let index=0;index<12;index+=1){
      const start=norm(cusps[index]);
      const span=norm(cusps[(index+1)%12]-start)||30;
      if(norm(Number(value)-start)<span)return index+1;
    }
    return 12;
  }

  function numericCusps(raw){
    if(!raw)return null;
    const values=(Array.isArray(raw)?raw:Object.values(raw))
      .map(item=>typeof item==='object'?Number(item?.longitude??item?.value??item?.cusp):Number(item))
      .slice(0,12);
    return values.length===12&&values.every(Number.isFinite)?values.map(norm):null;
  }

  function storedCusps(payload){
    const profile=payload?.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:{};
    return numericCusps(profile.houseCusps)||numericCusps(profile.cusps)||numericCusps(payload?.houseCusps)||numericCusps(payload?.cusps)||numericCusps(payload?.houses);
  }

  function systemFor(payload){
    const profile=payload?.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:{};
    return window.RelphiHouseSystems?.normalizeSystem?.(profile.houseSystem||payload?.houseSystem||'whole-sign')||'whole-sign';
  }

  function calculate(payload){
    const engine=window.RelphiHouseSystems;
    if(!engine?.calculateCusps)return null;
    const source=placementSource(payload);
    const profile=payload?.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:{};
    const system=systemFor(payload);

    const ascRecord=find(source,['Ascendant','ASC','Rising']);
    const mcRecord=find(source,['Midheaven','Medium Coeli','MC']);
    const ascendantValue=longitudeOf(ascRecord);
    const midheavenValue=longitudeOf(mcRecord);
    const ascendant=Number.isFinite(ascendantValue)?ascendantValue:profileAngle(profile,['ascendant','asc','rising']);
    let midheaven=Number.isFinite(midheavenValue)?midheavenValue:profileAngle(profile,['midheaven','mediumCoeli','mc']);

    if(!Number.isFinite(ascendant))return null;
    if(!Number.isFinite(midheaven)){
      // Whole Sign and Equal House do not geometrically depend on the MC, but the
      // shared house engine accepts one common option shape. Use a harmless finite
      // placeholder only for those two systems; every quadrant system still requires MC.
      if(system==='whole-sign'||system==='equal-house')midheaven=0;
      else return null;
    }

    const options={system,ascendant,midheaven};

    if(!SYSTEMS_WITHOUT_TIME.has(system)){
      const Astronomy=window.Astronomy;
      const instantRaw=profile.instant||profile.dateTime||payload?.instant||payload?.dateTime;
      const instant=instantRaw?new Date(instantRaw):null;
      const latitude=Number(profile.latitude??payload?.latitude);
      const longitude=Number(profile.longitude??payload?.longitude);
      if(!Astronomy||!instant||Number.isNaN(instant.getTime())||!Number.isFinite(latitude)||!Number.isFinite(longitude))return null;
      options.latitude=latitude;
      options.siderealDegrees=norm(Astronomy.SiderealTime(instant)*15+longitude);
      options.obliquityDegrees=Number(Astronomy.e_tilt(instant).tobl);
    }

    try{return engine.calculateCusps(options)}
    catch(error){console.warn('[Sky Chart house integrity] Could not recalculate houses.',error);return null}
  }

  function materiallyDifferent(a,b){
    if(!a||!b||a.length!==12||b.length!==12)return true;
    return a.some((value,index)=>separation(value,b[index])>1e-5);
  }

  function repair(slot,emit=true){
    const payload=read(slot);
    if(!payload)return false;
    const result=calculate(payload);
    if(!result?.cusps?.length)return false;

    const expected=result.cusps.map(norm);
    const stored=storedCusps(payload);
    const source=placementSource(payload);
    let changed=materiallyDifferent(stored,expected);

    Object.values(source).forEach(item=>{
      const longitude=longitudeOf(item);
      if(!Number.isFinite(longitude))return;
      // Normalize imported sign/degree-only placements to a numeric longitude so every
      // downstream house consumer sees the same coordinate authority.
      if(item.longitude===null||item.longitude===''||!Number.isFinite(Number(item.longitude))){item.longitude=longitude;changed=true}
      const house=houseFor(longitude,expected);
      if(Number(item.house)!==house){item.house=house;changed=true}
    });

    const profile=payload.calcProfile&&typeof payload.calcProfile==='object'?payload.calcProfile:{};
    if(profile.houseSystem!==result.system)changed=true;
    if(materiallyDifferent(numericCusps(profile.houseCusps),expected))changed=true;
    if(materiallyDifferent(numericCusps(profile.cusps),expected))changed=true;

    if(!changed)return false;

    payload.houseCusps=expected;
    payload.calcProfile={
      ...profile,
      houseSystem:result.system,
      houseCusps:expected,
      cusps:expected,
      houseSystemNote:result.note,
      houseIntegrity:'recalculated-v2'
    };

    localStorage.setItem(KEYS[slot],JSON.stringify(payload));
    console.info(`[Sky Chart house integrity] Recalculated Sky ${slot} ${result.label||result.system} cusps from current angles.`);

    if(emit){
      try{
        window.dispatchEvent(new StorageEvent('storage',{key:KEYS[slot],newValue:localStorage.getItem(KEYS[slot]),storageArea:localStorage}));
      }catch(_){
        const event=new Event('storage');
        Object.defineProperty(event,'key',{value:KEYS[slot]});
        window.dispatchEvent(event);
      }
      window.dispatchEvent(new CustomEvent('relphi:sky-house-integrity-repaired',{detail:{slot,system:result.system,cusps:expected.slice()}}));
    }
    return true;
  }

  function repairAll(emit=true){
    if(running)return false;
    running=true;
    try{return repair('A',emit)|repair('B',emit)}
    finally{running=false}
  }

  window.RelphiSkyHouseIntegrity={repair,repairAll,calculate,houseFor,storedCusps,longitudeOf};

  // Run synchronously before the foundation/wheel scripts read persisted chart state.
  repairAll(false);

  window.addEventListener('storage',event=>{
    if(running)return;
    if(!event.key||event.key===KEYS.A||event.key===KEYS.B)repairAll(true);
  });
})();
