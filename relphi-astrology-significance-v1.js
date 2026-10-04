// Relphi Significant Factors Engine.
// Pure astrology in; synthesized factors out. Tarot is intentionally absent from this dataset.
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.RelphiAstrologySignificance=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const MODES=['Cardinal','Fixed','Mutable'];
  const ELEMENTS=['Fire','Earth','Air','Water'];
  const RULER={Aries:'Mars',Taurus:'Venus',Gemini:'Mercury',Cancer:'Moon',Leo:'Sun',Virgo:'Mercury',Libra:'Venus',Scorpio:'Mars',Sagittarius:'Jupiter',Capricorn:'Saturn',Aquarius:'Saturn',Pisces:'Jupiter'};
  const DOMICILE={Sun:['Leo'],Moon:['Cancer'],Mercury:['Gemini','Virgo'],Venus:['Taurus','Libra'],Mars:['Aries','Scorpio'],Jupiter:['Sagittarius','Pisces'],Saturn:['Capricorn','Aquarius']};
  const EXALTATION={Sun:'Aries',Moon:'Taurus',Mercury:'Virgo',Venus:'Pisces',Mars:'Capricorn',Jupiter:'Cancer',Saturn:'Libra'};
  const PLANETS=new Set(['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','Chiron']);
  const ANGLE_ALIASES={
    Ascendant:['ascendant','asc'],
    Descendant:['descendant','dsc','desc'],
    MC:['medium coeli','midheaven','mc'],
    IC:['imum coeli','nadir','ic']
  };
  const AXIS={Ascendant:'horizon',Descendant:'horizon',MC:'meridian',IC:'meridian'};
  const clean=s=>String(s||'').trim();
  const norm=s=>clean(s).toLowerCase().replace(/[^a-z0-9]+/g,'');
  const clampLon=n=>((Number(n)%360)+360)%360;
  const distance=(a,b)=>{const d=Math.abs(clampLon(a)-clampLon(b));return Math.min(d,360-d)};
  const signIndexFromName=name=>SIGNS.findIndex(s=>s.toLowerCase()===clean(name).toLowerCase());
  const titleName=value=>{
    const n=norm(value);
    for(const [canonical,aliases] of Object.entries(ANGLE_ALIASES))if(aliases.some(a=>norm(a)===n))return canonical;
    for(const p of PLANETS)if(norm(p)===n)return p;
    if(n==='northnode'||n==='truenode'||n==='meanNode'.toLowerCase())return 'North Node';
    if(n==='southnode')return 'South Node';
    if(n==='partoffortune'||n==='fortune')return 'Part of Fortune';
    if(n==='vertex')return 'Vertex';
    if(n==='antivertex')return 'Anti-Vertex';
    return clean(value);
  };
  function sourceMap(payload){return payload?.placements||payload?.positions||payload?.points||payload?.bodies||{}}
  function records(payload){
    return Object.entries(sourceMap(payload)).map(([key,item])=>{
      if(!item||typeof item!=='object')return null;
      let signIndex=signIndexFromName(item.sign||item.zodiac),lon=Number(item.longitude);
      if(!Number.isFinite(lon)&&signIndex>=0)lon=signIndex*30+Number(item.degree??item.degrees??0)+Number(item.minute??item.minutes??0)/60;
      if(!Number.isFinite(lon))return null;
      lon=clampLon(lon);if(signIndex<0)signIndex=Math.floor(lon/30);
      const body=titleName(item.name||item.label||item.body||item.planet||key);
      const house=Number(item.house??item.houseNumber);
      return {
        id:norm(key||body),key,body,lon,sign:SIGNS[signIndex],signIndex,
        degree:Number.isFinite(Number(item.degree??item.degrees))?Number(item.degree??item.degrees):lon%30,
        house:Number.isFinite(house)?house:null,
        retrograde:Boolean(item.retrograde||item.isRetrograde||clean(item.motion).toLowerCase()==='retrograde'),
        isPlanet:PLANETS.has(body),
        isAngle:Object.prototype.hasOwnProperty.call(ANGLE_ALIASES,body)
      };
    }).filter(Boolean);
  }
  function evidence(id,type,text,entities=[],weight=1,meta={}){
    return {id,type,text,entities:[...new Set(entities.filter(Boolean))],weight,meta};
  }
  function dignityFor(r){
    if(!r?.isPlanet)return null;
    if(DOMICILE[r.body]?.includes(r.sign))return 'domicile';
    if(EXALTATION[r.body]===r.sign)return 'exaltation';
    return null;
  }
  function aspectName(angle){
    const defs=[['conjunction',0],['sextile',60],['square',90],['trine',120],['opposition',180]];
    let best=null;
    defs.forEach(([name,target])=>{const orb=Math.abs(angle-target);if(!best||orb<best.orb)best={name,target,orb}});
    return best;
  }
  function aspectOrbLimit(a,b,name){
    const lum=a.body==='Sun'||a.body==='Moon'||b.body==='Sun'||b.body==='Moon';
    if(name==='conjunction')return lum?10:6;
    if(name==='opposition')return lum?5:5;
    return 4;
  }
  function calculatedAspects(rs){
    const bodies=rs.filter(r=>r.isPlanet||r.isAngle||['North Node','South Node'].includes(r.body)),out=[];
    for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
      const a=bodies[i],b=bodies[j],best=aspectName(distance(a.lon,b.lon)),limit=aspectOrbLimit(a,b,best.name);
      if(best.orb<=limit)out.push({a,b,name:best.name,angle:best.target,orb:best.orb});
    }
    return out;
  }
  function suppliedConfigurations(payload){
    const list=payload?.configurations||payload?.aspectConfigurations||payload?.patterns?.configurations||[];
    return Array.isArray(list)?list:[];
  }
  function readTemporalRulers(payload){
    const seen=new Set(),found={day:'',hour:''};
    function walk(value,depth=0){
      if(!value||typeof value!=='object'||depth>4||seen.has(value))return;seen.add(value);
      Object.entries(value).forEach(([k,v])=>{
        const key=norm(k);
        if(typeof v==='string'){
          const candidate=titleName(v);
          if((key==='dayruler'||key==='planetaryday'||key==='planetarydayruler')&&PLANETS.has(candidate))found.day=candidate;
          if((key==='hourruler'||key==='planetaryhour'||key==='planetaryhourruler')&&PLANETS.has(candidate))found.hour=candidate;
        } else if(v&&typeof v==='object')walk(v,depth+1);
      });
    }
    walk(payload);return found;
  }
  function factor(kind,title,claim,question,score,ev,entities,meta={}){
    return {kind,title,claim,question,score,evidence:ev,entities:[...new Set(entities||[])],meta};
  }
  function dispositionFactor(rs,sky){
    const asc=rs.find(r=>r.body==='Ascendant');if(!asc)return null;
    const chartRuler=RULER[asc.sign];if(!chartRuler)return null;
    const byBody=new Map(rs.filter(r=>r.isPlanet).map(r=>[r.body,r]));
    const chain=[],seen=new Map();let current=chartRuler,cycle=[];
    for(let step=0;step<10;step++){
      const p=byBody.get(current);if(!p)break;
      chain.push({planet:current,sign:p.sign,ruler:RULER[p.sign]});
      if(seen.has(current)){cycle=chain.slice(seen.get(current));break}
      seen.set(current,chain.length-1);
      const next=RULER[p.sign];if(!next||next===current){if(next===current)cycle=[chain[chain.length-1]];break}
      current=next;
    }
    if(chain.length<2)return null;
    const ev=[
      evidence(sky+':asc-ruler','rulership','Ascendant in '+asc.sign+' makes '+chartRuler+' the chart ruler',['Ascendant',asc.sign,chartRuler],2),
      ...chain.map((x,i)=>evidence(sky+':dispositor:'+i,'dispositor',x.planet+' in '+x.sign+' answers to '+x.ruler,[x.planet,x.sign,x.ruler],2))
    ];
    const planets=[...new Set(chain.flatMap(x=>[x.planet,x.ruler]))];
    const cycleText=cycle.length>1?' and closes into a '+cycle.map(x=>x.planet).filter((v,i,a)=>a.indexOf(v)===i).join('–')+' circuit':'';
    return factor('rulership','Chart-ruler dispositor structure',
      chartRuler+' carries the Ascendant through '+chain.map(x=>x.planet+' in '+x.sign).join(' → ')+cycleText+'.',
      'What is the chart-ruler chain asking to be integrated or acted through?',
      96+Math.min(6,chain.length),ev,['Ascendant',asc.sign,...planets],{chartRuler,chain,cycle});
  }
  function concentrationFactors(rs,sky){
    const out=[];
    for(const field of ['sign','house']){
      const map=new Map();
      rs.filter(r=>r.isPlanet).forEach(r=>{const v=r[field];if(v==null)return;const k=String(v);if(!map.has(k))map.set(k,[]);map.get(k).push(r)});
      for(const [value,list] of map)if(list.length>=3){
        const label=field==='house'?'House '+value:value;
        const ev=list.map(r=>evidence(sky+':'+field+':'+value+':'+r.id,'placement',r.body+' in '+label,[r.body,label],1));
        out.push(factor('concentration',label+' concentration',
          list.map(r=>r.body).join(', ')+' concentrate in '+label+'.',
          'What is the '+label+' concentration gathering into one central concern?',
          66+list.length*4,ev,[label,...list.map(r=>r.body)],{field,value,count:list.length}));
      }
    }
    return out;
  }
  function configurationFactors(payload,rs,sky){
    return suppliedConfigurations(payload).map((cfg,i)=>{
      const name=clean(cfg.name||cfg.type||cfg.label||'Configuration');
      const participants=Array.isArray(cfg.members)?cfg.members:Array.isArray(cfg.points)?cfg.points:Array.isArray(cfg.participants)?cfg.participants:[];
      const names=participants.map(p=>titleName(p?.name||p?.body||p)).filter(Boolean);
      const ev=[evidence(sky+':configuration:'+i,'configuration',name+(names.length?' · '+names.join(' · '):''),[name,...names],3)];
      return factor('configuration',name,name+' is a dominant piece of aspect geometry'+(names.length?' involving '+names.join(', '):'')+'.',
        'What is the '+name+' organizing into one problem, demand, or developmental task?',99,ev,[name,...names],{configuration:cfg});
    });
  }
  function tSquareFactors(rs,aspects,sky){
    const out=[],opps=aspects.filter(a=>a.name==='opposition'&&a.a.isPlanet&&a.b.isPlanet);
    for(const opp of opps){
      for(const apex of rs.filter(r=>r.isPlanet&&r!==opp.a&&r!==opp.b)){
        const a=aspects.find(x=>x.name==='square'&&((x.a===apex&&x.b===opp.a)||(x.b===apex&&x.a===opp.a)));
        const b=aspects.find(x=>x.name==='square'&&((x.a===apex&&x.b===opp.b)||(x.b===apex&&x.a===opp.b)));
        if(!a||!b)continue;
        const ev=[
          evidence(sky+':opp:'+norm(opp.a.body)+':'+norm(opp.b.body),'aspect',opp.a.body+' opposite '+opp.b.body+' · orb '+opp.orb.toFixed(2)+'°',[opp.a.body,opp.b.body,opp.a.sign,opp.b.sign],3),
          evidence(sky+':square:'+norm(apex.body)+':'+norm(opp.a.body),'aspect',apex.body+' square '+opp.a.body+' · orb '+a.orb.toFixed(2)+'°',[apex.body,opp.a.body],2),
          evidence(sky+':square:'+norm(apex.body)+':'+norm(opp.b.body),'aspect',apex.body+' square '+opp.b.body+' · orb '+b.orb.toFixed(2)+'°',[apex.body,opp.b.body],2)
        ];
        out.push(factor('configuration','T-square · '+opp.a.body+' / '+opp.b.body+' → '+apex.body,
          'The '+opp.a.body+'–'+opp.b.body+' polarity discharges through '+apex.body+'.',
          'Where is the '+opp.a.body+'–'+opp.b.body+' tension demanding action through '+apex.body+'?',
          101-(opp.orb+a.orb+b.orb)/6,ev,[opp.a.body,opp.b.body,apex.body,opp.a.sign,opp.b.sign,apex.sign],{opposition:[opp.a.body,opp.b.body],apex:apex.body}));
      }
    }
    return out;
  }
  function dignityPolarityFactors(rs,aspects,sky){
    const out=[],dignified=rs.map(r=>({r,d:dignityFor(r)})).filter(x=>x.d);
    for(let i=0;i<dignified.length;i++)for(let j=i+1;j<dignified.length;j++){
      const a=dignified[i],b=dignified[j],opp=aspects.find(x=>x.name==='opposition'&&((x.a===a.r&&x.b===b.r)||(x.b===a.r&&x.a===b.r)));
      if(!opp)continue;
      const ev=[
        evidence(sky+':dignity:'+norm(a.r.body),'dignity',a.r.body+' is in '+a.d+' in '+a.r.sign,[a.r.body,a.r.sign],3),
        evidence(sky+':dignity:'+norm(b.r.body),'dignity',b.r.body+' is in '+b.d+' in '+b.r.sign,[b.r.body,b.r.sign],3),
        evidence(sky+':dignity-opposition:'+norm(a.r.body)+':'+norm(b.r.body),'aspect',a.r.body+' opposes '+b.r.body+' · orb '+opp.orb.toFixed(2)+'°',[a.r.body,b.r.body],2)
      ];
      out.push(factor('condition','Empowered polarity · '+a.r.sign+' / '+b.r.sign,
        'Both sides of this polarity have unusual planetary authority: '+a.r.body+' is in '+a.d+' and '+b.r.body+' is in '+b.d+'.',
        'What must be honored on both sides of this strongly empowered polarity?',
        94-opp.orb/10,ev,[a.r.body,b.r.body,a.r.sign,b.r.sign],{dignities:[a,b]}));
    }
    return out;
  }
  function meridianFactor(rs,aspects,sky){
    const mc=rs.find(r=>r.body==='MC'),ic=rs.find(r=>r.body==='IC');if(!mc&&!ic)return null;
    const ev=[],entities=['meridian','MC','IC'];
    const axisBodies=rs.filter(r=>r.house===4||r.house===10||['North Node','South Node'].includes(r.body)&&(r.sign===mc?.sign||r.sign===ic?.sign));
    axisBodies.forEach(r=>{ev.push(evidence(sky+':meridian-occupant:'+r.id,'axis-occupancy',r.body+' occupies the '+(r.house===4?'H4/IC':'H10/MC')+' side',[r.body,r.sign,'meridian'],1.6));entities.push(r.body,r.sign)});
    const pressure=[];
    rs.filter(r=>r.isPlanet).forEach(r=>{
      const contact=aspects.filter(a=>(a.a===r||a.b===r)&&((a.a.body==='MC'||a.b.body==='MC'||a.a.body==='IC'||a.b.body==='IC'))&&['conjunction','square','opposition'].includes(a.name));
      if(contact.length){
        pressure.push(r);
        contact.forEach(a=>ev.push(evidence(sky+':meridian-contact:'+r.id+':'+a.name+':'+(a.a.body==='MC'||a.b.body==='MC'?'mc':'ic'),'angle-aspect',
          r.body+' '+a.name+' '+(a.a.body==='MC'||a.b.body==='MC'?'MC':'IC')+' · orb '+a.orb.toFixed(2)+'°',[r.body,r.sign,'meridian'],2.5)));
        entities.push(r.body,r.sign);
      }
    });
    const nodes=rs.filter(r=>['North Node','South Node'].includes(r.body)&&[4,10].includes(r.house));
    const moon=rs.find(r=>r.body==='Moon'&&[4,10].includes(r.house));
    if(moon&&nodes.some(n=>n.house===moon.house&&distance(n.lon,moon.lon)<=5)){
      const n=nodes.find(n=>n.house===moon.house&&distance(n.lon,moon.lon)<=5);
      ev.push(evidence(sky+':moon-node-meridian','axis-recurrence','Moon is joined to '+n.body+' on the meridian side',[moon.body,n.body,moon.sign,'meridian'],3));
      entities.push('Moon',n.body);
    }
    if(ev.length<2)return null;
    const pressureNames=[...new Set(pressure.map(r=>r.body))];
    const occupiedNames=[...new Set(axisBodies.map(r=>r.body))];
    let claim='The meridian is reinforced by '+occupiedNames.join(', ');
    if(pressureNames.length)claim+=(occupiedNames.length?' while ':'')+pressureNames.join(', ')+' bears directly on the axis';
    claim+='.';
    return factor('axis','Reinforced meridian complex',claim,
      'How is this reinforced home–direction axis asking to be lived or redirected?',
      92+Math.min(9,ev.reduce((s,x)=>s+x.weight,0)/2),ev,entities,{occupants:occupiedNames,pressure:pressureNames});
  }
  function horizonFactor(rs,aspects,sky){
    const asc=rs.find(r=>r.body==='Ascendant'),dsc=rs.find(r=>r.body==='Descendant');if(!asc&&!dsc)return null;
    const near=rs.filter(r=>r.isPlanet&&((asc&&distance(r.lon,asc.lon)<=5)||(dsc&&distance(r.lon,dsc.lon)<=5)));
    if(near.length<2)return null;
    const ev=near.map(r=>evidence(sky+':horizon:'+r.id,'angle-contact',r.body+' is close to the horizon in '+r.sign,[r.body,r.sign,'horizon'],2.5));
    const pairAspects=aspects.filter(a=>near.includes(a.a)&&near.includes(a.b)&&a.name==='conjunction');
    pairAspects.forEach(a=>ev.push(evidence(sky+':horizon-pair:'+norm(a.a.body)+':'+norm(a.b.body),'aspect',a.a.body+' conjunct '+a.b.body+' · orb '+a.orb.toFixed(2)+'°',[a.a.body,a.b.body,'horizon'],2)));
    return factor('axis','Horizon planetary complex',near.map(r=>r.body).join(' and ')+' gather on the horizon'+(asc?' around the '+asc.sign+' Ascendant':'')+'.',
      'What is this horizon complex making immediate, embodied, or personally unavoidable?',
      93+near.length*2,ev,['horizon',...near.map(r=>r.body),...(asc?[asc.sign]:[])],{bodies:near.map(r=>r.body)});
  }
  function temporalFactor(payload,rs,sky){
    const t=readTemporalRulers(payload);if(!t.day&&!t.hour)return null;
    const same=t.day&&t.hour&&t.day===t.hour,planet=rs.find(r=>r.body===(same?t.day:(t.day||t.hour)));
    const d=planet?dignityFor(planet):null;
    if(!same&&!d)return null;
    const ruler=same?t.day:(t.day||t.hour),ev=[];
    if(t.day)ev.push(evidence(sky+':day-ruler','planetary-time','Planetary day is ruled by '+t.day,[t.day,'planetary day'],2));
    if(t.hour)ev.push(evidence(sky+':hour-ruler','planetary-time','Planetary hour is ruled by '+t.hour,[t.hour,'planetary hour'],2));
    if(d)ev.push(evidence(sky+':temporal-dignity','dignity',planet.body+' is in '+d+' in '+planet.sign,[planet.body,planet.sign],3));
    return factor('recurrence','Planetary-time reinforcement · '+ruler,
      ruler+' is reinforced across '+[same?'day and hour':'planetary time',d?d:null].filter(Boolean).join(' and ')+'.',
      'What is the repeated '+ruler+' principle making especially authoritative in this chart?',
      90+(same?6:0)+(d?5:0),ev,[ruler,...(planet?[planet.sign]:[])],{day:t.day,hour:t.hour,dignity:d});
  }
  function rawAspectStructure(rs,aspects,sky){
    const strong=aspects.filter(a=>a.a.isPlanet&&a.b.isPlanet&&a.orb<=2.5).sort((a,b)=>a.orb-b.orb).slice(0,5);
    return strong.map((a,i)=>factor('relationship',a.a.body+' '+a.name+' '+a.b.body,
      a.a.body+' and '+a.b.body+' are tied by a close '+a.name+'.',
      'What is the '+a.a.body+'–'+a.b.body+' '+a.name+' requiring these two principles to do together?',
      79-a.orb*2,evidence(sky+':close-aspect:'+i,'aspect',a.a.body+' '+a.name+' '+a.b.body+' · orb '+a.orb.toFixed(2)+'°',[a.a.body,a.b.body,a.a.sign,a.b.sign],2),[a.a.body,a.b.body,a.a.sign,a.b.sign],{aspect:a}));
  }
  function overlap(a,b){
    const A=new Set(a.entities.map(norm)),B=new Set(b.entities.map(norm));if(!A.size||!B.size)return 0;
    let shared=0;A.forEach(x=>{if(B.has(x))shared++});return shared/Math.min(A.size,B.size);
  }
  function evidenceOverlap(a,b){
    const A=new Set(a.evidence.map(e=>e.id)),B=new Set(b.evidence.map(e=>e.id));if(!A.size||!B.size)return 0;
    let shared=0;A.forEach(x=>{if(B.has(x))shared++});return shared/Math.min(A.size,B.size);
  }
  function selectFactors(candidates,max=7){
    const sorted=candidates.filter(Boolean).sort((a,b)=>b.score-a.score),selected=[];
    for(const candidate of sorted){
      if(selected.length>=max)break;
      const maxEntity=Math.max(0,...selected.map(s=>overlap(candidate,s)));
      const maxEvidence=Math.max(0,...selected.map(s=>evidenceOverlap(candidate,s)));
      const novelty=1-Math.max(maxEvidence,maxEntity*.72);
      candidate.novelty=novelty;candidate.adjustedScore=candidate.score*(.45+.55*novelty);
      if(maxEvidence>=.72)continue;
      if(maxEntity>=.84&&candidate.kind==='concentration')continue;
      if(candidate.adjustedScore<55)continue;
      selected.push(candidate);
    }
    const total=new Set(candidates.flatMap(c=>c.evidence.map(e=>e.id))).size||1;
    const covered=new Set(selected.flatMap(c=>c.evidence.map(e=>e.id))).size;
    selected.coverage=Math.min(1,covered/total);
    return selected;
  }
  function synthesizeSky(payload,skyName){
    const rs=records(payload),aspects=calculatedAspects(rs),candidates=[];
    candidates.push(...configurationFactors(payload,rs,skyName));
    candidates.push(...tSquareFactors(rs,aspects,skyName));
    candidates.push(dispositionFactor(rs,skyName));
    candidates.push(meridianFactor(rs,aspects,skyName));
    candidates.push(horizonFactor(rs,aspects,skyName));
    candidates.push(...dignityPolarityFactors(rs,aspects,skyName));
    candidates.push(temporalFactor(payload,rs,skyName));
    candidates.push(...concentrationFactors(rs,skyName));
    candidates.push(...rawAspectStructure(rs,aspects,skyName));
    return {name:skyName,records:rs,aspects,candidates:candidates.filter(Boolean)};
  }
  function synthesize(input={}){
    const skies=[input.skyA?['A',input.skyA]:null,input.skyB?['B',input.skyB]:null].filter(Boolean).map(([slot,payload])=>synthesizeSky(payload,payload?.name||('Sky '+slot)));
    const candidates=skies.flatMap(s=>s.candidates);
    // Cross-sky recurrence: same structural kind + strongly overlapping entities independently appears twice.
    if(skies.length===2){
      for(const a of skies[0].candidates)for(const b of skies[1].candidates){
        const ov=overlap(a,b);if(ov<.55||a.kind!==b.kind)continue;
        candidates.push(factor('recurrence','Recurrence across Sky A / B',
          a.title+' recurs independently across both skies.',
          'What changes when this same astrological structure recurs across both skies?',
          98+ov*5,[...a.evidence,...b.evidence],[...a.entities,...b.entities],{sourceFactors:[a.title,b.title]}));
      }
    }
    const factors=selectFactors(candidates,Math.max(1,Math.min(7,Number(input.maxFactors)||7)));
    return {version:1,skies,factors,coverage:factors.coverage||0,candidateCount:candidates.length};
  }
  return {SIGNS,RULER,records,calculatedAspects,synthesize};
});
