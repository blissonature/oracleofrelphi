// First-class interval relationships. DOM strings are views of these records, never their source.
(function(root,factory){
  const model=factory(
    root?.RelphiHarmonicEngine||(typeof require==='function'?require('./sky-chart-harmonic-engine-v1.js'):null)
  );
  if(typeof module==='object'&&module.exports)module.exports=model;
  if(root)root.RelphiSkyRelationshipModel=model;
})(typeof globalThis!=='undefined'?globalThis:this,function(HarmonicEngine){
  'use strict';
  if(!HarmonicEngine)throw new Error('RelphiHarmonicEngine is required.');

  const MODEL_VERSION='rainbow-interval-v1';
  const EVIDENCE=Object.freeze({
    geometry:'mathematical',
    positions:'astronomical/calculated',
    symbolicInterpretation:'traditional-symbolic',
    crossDomainTranslation:'experimental-unresolved',
    eventPrediction:'empirically-unsupported'
  });
  const freeze=value=>Object.freeze(value);

  function endpoint(record,sky){
    const longitude=HarmonicEngine.normalizeAngle(record?.value??record?.longitude);
    if(!record?.id||!Number.isFinite(longitude))throw new TypeError('A relationship endpoint needs a stable ID and finite longitude.');
    return freeze({
      id:String(record.id),
      sky,
      name:String(record.entry?.name||record.name||record.id),
      longitude,
      sign:Number.isFinite(Number(record.sign))?Number(record.sign):Math.floor(longitude/30),
      house:Number.isFinite(Number(record.house))?Number(record.house):null,
      angularVelocity:Number(record.angularVelocity??record.velocity??record.item?.angularVelocity??record.item?.velocity??record.item?.speed),
      entry:record.entry||null,
      source:record.item||record.source||null
    });
  }
  function stableId(left,aspect,right){
    return`${left.sky}:${left.id}|${aspect.id}|${right.sky}:${right.id}`;
  }
  function buildRelationship(leftRecord,rightRecord,aspect,phaseWindow,leftSky='A',rightSky='B'){
    const left=endpoint(leftRecord,leftSky),right=endpoint(rightRecord,rightSky);
    const directedSeparation=HarmonicEngine.normalizeAngle(right.longitude-left.longitude);
    const angularSeparation=HarmonicEngine.smallestCircularSeparation(right.longitude,left.longitude);
    const derived=HarmonicEngine.metrics(angularSeparation,aspect,phaseWindow);
    if(!derived?.admitted)return null;
    const temporal=HarmonicEngine.motion(derived,left.angularVelocity,right.angularVelocity);
    const id=stableId(left,aspect,right);
    return freeze({
      id,
      modelVersion:MODEL_VERSION,
      left,
      right,
      aspect,
      distance:angularSeparation,
      orb:derived.ordinaryOrb,
      targetAngle:derived.targetAngle,
      signedOrdinaryError:derived.signedOrdinaryError,
      signedOrdinaryOrb:derived.signedOrdinaryError,
      ordinaryOrb:derived.ordinaryOrb,
      harmonicOrder:derived.harmonicOrder,
      harmonicNumerator:derived.harmonicNumerator,
      signedPhaseError:derived.signedPhaseError,
      phaseError:derived.phaseError,
      masterWindow:derived.masterWindow,
      normalizedPhaseError:derived.normalizedPhaseError,
      windowFraction:derived.normalizedPhaseError,
      coherence:derived.coherence,
      coherencePercent:derived.coherencePercent,
      temporal,
      continuous:freeze({leftLongitude:left.longitude,rightLongitude:right.longitude,directedSeparation,angularSeparation}),
      interval:freeze({targetAngle:aspect.angle,signedOrdinaryError:derived.signedOrdinaryError,ordinaryOrb:derived.ordinaryOrb}),
      harmonic:freeze({order:aspect.denominator,numerator:aspect.numerator,denominator:aspect.denominator,signedPhaseError:derived.signedPhaseError,phaseError:derived.phaseError,phaseWindow:derived.masterWindow,normalizedPhaseError:derived.normalizedPhaseError,coherence:derived.coherence}),
      amplitude:freeze({source:null,harmonicFamily:null,displaySignificance:null}),
      context:freeze({leftSign:left.sign,rightSign:right.sign,leftHouse:left.house,rightHouse:right.house}),
      representations:freeze({angular:freeze({aspectId:aspect.id,label:aspect.label,targetAngle:aspect.angle}),harmonic:freeze({order:aspect.denominator,mode:aspect.numerator}),musical:null,spectral:null,tarot:null}),
      provenance:freeze({model:MODEL_VERSION,source:'sky-chart-calculated-placements',relationship:'derived'}),
      evidence:EVIDENCE
    });
  }
  function build({leftPlacements=[],rightPlacements=[],phaseWindow=HarmonicEngine.defaultWindow,aspects=HarmonicEngine.aspects,mode='cross',leftSky='A',rightSky='B',pairFilter=()=>true}={}){
    const relationships=[];
    const pairs=[];
    if(mode==='internal'){
      for(let leftIndex=0;leftIndex<leftPlacements.length;leftIndex++)for(let rightIndex=leftIndex+1;rightIndex<leftPlacements.length;rightIndex++)pairs.push([leftPlacements[leftIndex],leftPlacements[rightIndex]]);
    }else for(const left of leftPlacements)for(const right of rightPlacements)pairs.push([left,right]);
    for(const [left,right] of pairs){
        if(!pairFilter(left,right))continue;
        for(const aspect of aspects){
          const relationship=buildRelationship(left,right,aspect,phaseWindow,leftSky,rightSky);
          if(relationship)relationships.push(relationship);
        }
    }
    relationships.sort((a,b)=>a.phaseError-b.phaseError||a.harmonicOrder-b.harmonicOrder||a.ordinaryOrb-b.ordinaryOrb||a.id.localeCompare(b.id));
    const byId=new Map(relationships.map(relationship=>[relationship.id,relationship]));
    return freeze({
      version:MODEL_VERSION,
      constitution:freeze({finite:true,maxHarmonicOrder:Math.max(...aspects.map(aspect=>aspect.denominator)),phaseWindow:HarmonicEngine.clampWindow(phaseWindow),aspectIds:freeze(aspects.map(aspect=>aspect.id))}),
      mode,
      placements:freeze({A:freeze(leftPlacements.slice()),B:freeze(mode==='internal'?[]:rightPlacements.slice())}),
      relationships:freeze(relationships),
      byId,
      evidence:EVIDENCE
    });
  }

  return freeze({version:MODEL_VERSION,evidence:EVIDENCE,stableId,buildRelationship,build});
});
