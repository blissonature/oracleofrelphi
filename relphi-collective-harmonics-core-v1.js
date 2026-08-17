(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.RelphiCollectiveHarmonicsCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const RAD=Math.PI/180;
  const EPS=1e-10;
  const norm=value=>((Number(value)%360)+360)%360;
  const wrap180=value=>((Number(value)+180)%360+360)%360-180;
  function gcd(a,b){a=Math.abs(Math.trunc(a));b=Math.abs(Math.trunc(b));while(b){const t=a%b;a=b;b=t}return a||1}
  function properDivisors(order){const n=Math.max(1,Math.trunc(Number(order)||1)),result=[];for(let d=1;d<n;d+=1)if(n%d===0)result.push(d);return result}
  function clampWindow(value){const n=Number(value);return Number.isFinite(n)&&n>=0?Math.min(180,n):6}
  function validRecords(records){
    const seen=new Set();
    return (Array.isArray(records)?records:[]).map(record=>({
      id:String(record?.id||'').trim(),
      name:String(record?.name||record?.id||'').trim(),
      longitude:norm(record?.longitude)
    })).filter(record=>record.id&&Number.isFinite(record.longitude)&&!seen.has(record.id)&&seen.add(record.id));
  }
  function pairPhase(left,right,order,windowValue){
    const n=Math.max(1,Math.trunc(Number(order)||1));
    const window=clampWindow(windowValue);
    const separation=norm(Number(right.longitude)-Number(left.longitude));
    const signedPhase=wrap180(n*separation);
    const phaseDistance=Math.abs(signedPhase);
    const contribution=Math.cos(signedPhase*RAD);
    const nearestRaw=Math.round(n*separation/360);
    const numerator=((nearestRaw%n)+n)%n;
    const common=numerator===0?n:gcd(numerator,n);
    const reducedOrder=numerator===0?1:n/common;
    const primitive=numerator!==0&&common===1;
    return Object.freeze({
      left,right,order:n,separation,signedPhase,phaseDistance,contribution,
      nearestNumerator:numerator,reducedOrder,primitive,
      inWindow:phaseDistance<=window+EPS
    });
  }
  function summarizePairs(pairs){
    const pairCount=pairs.length;
    if(!pairCount)return Object.freeze({pairCount:0,support:0,resistance:0,net:0,primitiveWindowHits:0,inheritedWindowHits:0,topSupport:Object.freeze([]),topResistance:Object.freeze([])});
    let support=0,resistance=0,net=0,primitiveWindowHits=0,inheritedWindowHits=0;
    pairs.forEach(pair=>{
      const c=pair.contribution;
      if(c>=0)support+=c;else resistance+=-c;
      net+=c;
      if(pair.inWindow){if(pair.primitive)primitiveWindowHits+=1;else inheritedWindowHits+=1}
    });
    support/=pairCount;resistance/=pairCount;net/=pairCount;
    const rankedSupport=pairs.slice().sort((a,b)=>b.contribution-a.contribution||a.phaseDistance-b.phaseDistance);
    const rankedResistance=pairs.slice().sort((a,b)=>a.contribution-b.contribution||b.phaseDistance-a.phaseDistance);
    return Object.freeze({pairCount,support,resistance,net,primitiveWindowHits,inheritedWindowHits,topSupport:Object.freeze(rankedSupport.slice(0,3)),topResistance:Object.freeze(rankedResistance.slice(0,3))});
  }
  function phaseVector(points,order){
    const n=Math.max(1,Math.trunc(Number(order)||1)),N=points.length;
    if(!N)return Object.freeze({x:0,y:0,power:0,magnitude:0,angle:0});
    let x=0,y=0;
    points.forEach(point=>{const phase=n*point.longitude*RAD;x+=Math.cos(phase);y+=Math.sin(phase)});
    x/=N;y/=N;
    const power=Math.max(0,Math.min(1,x*x+y*y));
    return Object.freeze({x,y,power,magnitude:Math.sqrt(power),angle:Math.atan2(y,x)/RAD});
  }
  function metric(records,order,windowValue){
    const points=validRecords(records),n=Math.max(1,Math.trunc(Number(order)||1)),window=clampWindow(windowValue),N=points.length;
    if(N<2)return Object.freeze({order:n,count:N,pairCount:0,window,phaseLockPower:0,support:0,resistance:0,net:0,identityNet:0,identityError:0,primitiveWindowHits:0,inheritedWindowHits:0,topSupport:Object.freeze([]),topResistance:Object.freeze([]),pairs:Object.freeze([])});
    const vector=phaseVector(points,n),pairs=[];
    for(let i=0;i<N;i+=1)for(let j=i+1;j<N;j+=1)pairs.push(pairPhase(points[i],points[j],n,window));
    const summary=summarizePairs(pairs);
    const identityNet=(N*vector.power-1)/(N-1);
    const identityError=Math.abs(summary.net-identityNet);
    return Object.freeze({
      order:n,count:N,window,phaseLockPower:vector.power,phaseAngle:vector.angle,
      ...summary,identityNet,identityError,pairs:Object.freeze(pairs)
    });
  }
  function crossMetric(leftRecords,rightRecords,order,windowValue){
    const left=validRecords(leftRecords),right=validRecords(rightRecords),n=Math.max(1,Math.trunc(Number(order)||1)),window=clampWindow(windowValue);
    if(!left.length||!right.length)return Object.freeze({order:n,leftCount:left.length,rightCount:right.length,pairCount:0,window,support:0,resistance:0,net:0,fieldCoupling:0,phaseAgreement:0,phaseOffset:0,identityNet:0,identityError:0,primitiveWindowHits:0,inheritedWindowHits:0,topSupport:Object.freeze([]),topResistance:Object.freeze([]),pairs:Object.freeze([])});
    const pairs=[];
    left.forEach(a=>right.forEach(b=>pairs.push(pairPhase(a,b,n,window))));
    const summary=summarizePairs(pairs),a=phaseVector(left,n),b=phaseVector(right,n);
    const identityNet=b.x*a.x+b.y*a.y;
    const crossImag=b.y*a.x-b.x*a.y;
    const fieldCoupling=Math.max(0,Math.min(1,a.magnitude*b.magnitude));
    const phaseAgreement=fieldCoupling>EPS?Math.max(-1,Math.min(1,identityNet/fieldCoupling)):0;
    const phaseOffset=fieldCoupling>EPS?Math.atan2(crossImag,identityNet)/RAD:0;
    return Object.freeze({
      order:n,leftCount:left.length,rightCount:right.length,window,
      ...summary,fieldCoupling,phaseAgreement,phaseOffset,
      leftPhaseLockPower:a.power,rightPhaseLockPower:b.power,
      identityNet,identityError:Math.abs(summary.net-identityNet),pairs:Object.freeze(pairs)
    });
  }
  function decorateSpectrum(base,max,counterbalanceScale){
    const result=[];
    for(let n=2;n<=max;n+=1){
      const current=base.get(n),divisors=properDivisors(n);
      let inheritedFrom=null,inheritedAlignment=0;
      divisors.forEach(d=>{const candidate=Math.max(0,base.get(d)?.net||0);if(candidate>inheritedAlignment+EPS){inheritedAlignment=candidate;inheritedFrom=d}});
      const alignment=Math.max(0,current.net);
      const distinctive=Math.max(0,alignment-inheritedAlignment);
      const counterbalance=current.net<0?Math.min(1,-current.net*counterbalanceScale(current)):0;
      result.push(Object.freeze({...current,alignment,distinctive,inheritedFrom,inheritedAlignment,counterbalance}));
    }
    return Object.freeze(result);
  }
  function spectrum(records,windowValue,maxOrder=12){
    const points=validRecords(records),max=Math.max(2,Math.trunc(Number(maxOrder)||12)),base=new Map();
    for(let n=1;n<=max;n+=1)base.set(n,metric(points,n,windowValue));
    return decorateSpectrum(base,max,current=>Math.max(1,current.count-1));
  }
  function crossSpectrum(leftRecords,rightRecords,windowValue,maxOrder=12){
    const left=validRecords(leftRecords),right=validRecords(rightRecords),max=Math.max(2,Math.trunc(Number(maxOrder)||12)),base=new Map();
    for(let n=1;n<=max;n+=1)base.set(n,crossMetric(left,right,n,windowValue));
    return decorateSpectrum(base,max,()=>1);
  }
  return Object.freeze({
    theorem:'all-pairs harmonic phase balance with lower-order inheritance control',
    norm,wrap180,gcd,properDivisors,clampWindow,pairPhase,phaseVector,metric,crossMetric,spectrum,crossSpectrum
  });
});
