// Pure finite harmonic engine. It has no DOM, storage, event, or rendering dependency.
(function(root,factory){
  const engine=factory();
  if(typeof module==='object'&&module.exports)module.exports=engine;
  if(root)root.RelphiHarmonicEngine=engine;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const DEFAULT_WINDOW=6;
  const MAX_WINDOW=12;
  const EPSILON=1e-9;

  function gcd(left,right){
    let a=Math.abs(Math.trunc(Number(left))),b=Math.abs(Math.trunc(Number(right)));
    while(b){const next=a%b;a=b;b=next}
    return a||1;
  }
  function reduceFraction(numerator,denominator){
    const d=Math.trunc(Number(denominator));
    if(!Number.isFinite(d)||d===0)throw new RangeError('Harmonic denominator must be non-zero.');
    const n=Math.trunc(Number(numerator));
    if(!Number.isFinite(n))throw new TypeError('Harmonic numerator must be finite.');
    const divisor=gcd(n,d),sign=d<0?-1:1;
    return Object.freeze({numerator:sign*n/divisor,denominator:sign*d/divisor});
  }
  function normalizeAngle(value){
    const angle=Number(value);
    if(!Number.isFinite(angle))return NaN;
    return((angle%360)+360)%360;
  }
  function signedCircularDisplacement(value,target=0){
    const displacement=normalizeAngle(Number(value)-Number(target));
    return displacement>180?displacement-360:displacement;
  }
  function smallestCircularSeparation(left,right){
    return Math.abs(signedCircularDisplacement(left,right));
  }
  function clampWindow(value){
    const numeric=Number(value);
    return Number.isFinite(numeric)&&numeric>=0?Math.min(MAX_WINDOW,numeric):DEFAULT_WINDOW;
  }
  function defineAspect(id,angle,numerator,denominator,color,label){
    const reduced=reduceFraction(numerator,denominator);
    return Object.freeze({
      id,
      label:label||String(id).replace(/(^|-)([a-z])/g,(_,space,letter)=>(space?' ':'')+letter.toUpperCase()),
      angle:Number(angle),
      numerator:reduced.numerator,
      denominator:reduced.denominator,
      harmonic:reduced.denominator,
      color
    });
  }
  const ASPECTS=Object.freeze([
    defineAspect('conjunction',0,0,1,'#e53935','Conjunction'),
    defineAspect('semi-sextile',30,1,12,'#7c9b49','Semi-Sextile'),
    defineAspect('octile',45,1,8,'#b86d43','Octile'),
    defineAspect('sextile',60,1,6,'#d3b727','Sextile'),
    defineAspect('quintile',72,1,5,'#8b6cc2','Quintile'),
    defineAspect('square',90,1,4,'#d6534d','Square'),
    defineAspect('trine',120,1,3,'#4e9e69','Trine'),
    defineAspect('tri-octile',135,3,8,'#9f5944','Tri-Octile'),
    defineAspect('bi-quintile',144,2,5,'#7655aa','Bi-Quintile'),
    defineAspect('quincunx',150,5,12,'#4b8e88','Quincunx'),
    defineAspect('opposition',180,1,2,'#5961c8','Opposition')
  ]);
  const BY_ID=new Map(ASPECTS.map(aspect=>[aspect.id,aspect]));

  function resolveAspect(aspectLike){
    return typeof aspectLike==='string'?BY_ID.get(aspectLike)||null:aspectLike||null;
  }
  function metrics(distance,aspectLike,windowValue=DEFAULT_WINDOW){
    const aspect=resolveAspect(aspectLike),separation=Number(distance);
    if(!aspect||!Number.isFinite(separation))return null;
    const masterWindow=clampWindow(windowValue);
    const signedOrdinaryError=signedCircularDisplacement(separation,aspect.angle);
    const ordinaryOrb=Math.abs(signedOrdinaryError);
    // The aspect already selects one finite interval. Do not wrap the scaled
    // error back around the harmonic circle or unrelated aspects alias as exact.
    const signedPhaseError=signedOrdinaryError*aspect.denominator;
    const phaseError=Math.abs(signedPhaseError);
    const normalizedPhaseError=masterWindow>0?phaseError/masterWindow:(phaseError<=EPSILON?0:Infinity);
    const admitted=phaseError<=masterWindow+EPSILON;
    const coherence=masterWindow===0
      ?(phaseError<=EPSILON?1:0)
      :(admitted?Math.cos(Math.min(1,normalizedPhaseError)*Math.PI/2)**2:0);
    return Object.freeze({
      targetAngle:aspect.angle,
      ordinaryOrb,
      signedOrdinaryError,
      signedOrdinaryOrb:signedOrdinaryError,
      harmonicOrder:aspect.denominator,
      harmonicNumerator:aspect.numerator,
      signedPhaseError,
      phaseError,
      masterWindow,
      normalizedPhaseError,
      windowFraction:normalizedPhaseError,
      coherence,
      coherencePercent:coherence*100,
      admitted,
      active:admitted
    });
  }
  function motion(metricsLike,leftVelocity,rightVelocity){
    const left=Number(leftVelocity),right=Number(rightVelocity);
    if(!metricsLike||!Number.isFinite(left)||!Number.isFinite(right))return Object.freeze({available:false,relativeVelocity:NaN,harmonicVelocity:NaN,applying:null,separating:null,timeToExactitudeDays:NaN});
    const relativeVelocity=right-left;
    const harmonicVelocity=relativeVelocity*metricsLike.harmonicOrder;
    const later=Math.abs(metricsLike.signedPhaseError+harmonicVelocity/24);
    const applying=later<Math.abs(metricsLike.signedPhaseError);
    const timeToExactitudeDays=Math.abs(harmonicVelocity)>1e-12?Math.abs(metricsLike.signedPhaseError/harmonicVelocity):Infinity;
    return Object.freeze({available:true,relativeVelocity,harmonicVelocity,applying,separating:!applying,timeToExactitudeDays});
  }
  function relation(left,right,aspectLike,distance,windowValue=DEFAULT_WINDOW){
    const aspect=resolveAspect(aspectLike),derived=metrics(distance,aspect,windowValue);
    if(!aspect||!derived||!derived.admitted)return null;
    const temporal=motion(
      derived,
      left?.angularVelocity??left?.velocity??left?.item?.angularVelocity??left?.item?.velocity??left?.item?.speed,
      right?.angularVelocity??right?.velocity??right?.item?.angularVelocity??right?.item?.velocity??right?.item?.speed
    );
    return Object.freeze({left,right,aspect,distance,orb:derived.ordinaryOrb,...derived,temporal});
  }

  return Object.freeze({
    theorem:'shortest circular harmonic phase displacement; locally ordinary orb × reduced denominator',
    defaultWindow:DEFAULT_WINDOW,
    maxWindow:MAX_WINDOW,
    epsilon:EPSILON,
    aspects:ASPECTS,
    byId:id=>BY_ID.get(String(id||''))||null,
    gcd,
    reduceFraction,
    normalizeAngle,
    signedCircularDisplacement,
    smallestCircularSeparation,
    clampWindow,
    metrics,
    motion,
    relation
  });
});
