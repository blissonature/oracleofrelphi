import{norm,placementEntries,calculateRelationships,skyCusps}from'./model.mjs';

export const GEOMETRY=Object.freeze({cx:500,cy:500,zodiacInner:292,zodiacOuter:365,outerDegree:365,innerDegree:292,placementRadius:17,clearance:5,lanes:{A:[406,426,446],B:[251,231,211]}});
const rad=value=>(Number(value)-180)*Math.PI/180;
export const polar=(radius,degree)=>({x:GEOMETRY.cx+radius*Math.cos(rad(degree)),y:GEOMETRY.cy+radius*Math.sin(rad(degree))});
const collide=(left,right)=>Math.hypot(left.x-right.x,left.y-right.y)<GEOMETRY.placementRadius*2+GEOMETRY.clearance;
const signIndex=value=>Math.floor(norm(value)/30);

function offsets(limit=14,step=.7){
  const values=[0];for(let value=step;value<=limit+1e-9;value+=step)values.push(value,-value);return values;
}
const OFFSET_CANDIDATES=offsets();

export function layoutSlot(sky,slot,occupied=[]){
  if(!sky)return[];
  const lanes=GEOMETRY.lanes[slot],result=[];
  for(const record of placementEntries(sky)){
    const actualSign=signIndex(record.longitude);let chosen=null;
    for(const offset of OFFSET_CANDIDATES){
      const display=norm(record.longitude+offset);if(signIndex(display)!==actualSign)continue;
      for(const lane of lanes){
        const point=polar(lane,display),candidate={x:point.x,y:point.y};
        if(occupied.some(existing=>collide(candidate,existing)))continue;
        chosen={...record,slot,displayLongitude:display,lane,x:point.x,y:point.y};break;
      }
      if(chosen)break;
    }
    if(!chosen){
      const lane=lanes[0],displayLongitude=record.longitude,point=polar(lane,displayLongitude);
      chosen={...record,slot,displayLongitude,lane,x:point.x,y:point.y,crowded:true};
    }
    const degreeRadius=slot==='A'?GEOMETRY.outerDegree:GEOMETRY.innerDegree,anchor=polar(degreeRadius,record.longitude);
    chosen.leader={id:`${slot}:${record.id}`,slot,placementId:record.id,x1:chosen.x,y1:chosen.y,x2:anchor.x,y2:anchor.y};
    result.push(chosen);occupied.push({x:chosen.x,y:chosen.y});
  }
  return result;
}

export function assertLayoutInvariant(items){
  for(const item of items){
    if(signIndex(item.displayLongitude)!==signIndex(item.longitude))throw new Error(`Placement ${item.slot}:${item.id} crossed its zodiac sign.`);
    if(item.leader?.placementId!==item.id||item.leader?.slot!==item.slot)throw new Error(`Leader identity diverged for ${item.slot}:${item.id}.`);
  }
  return true;
}

export function layoutWheel(skyA,skyB,orb=3){
  const occupied=[],a=layoutSlot(skyA,'A',occupied),b=layoutSlot(skyB,'B',occupied),placements=[...a,...b];
  assertLayoutInvariant(placements);
  const byKey=new Map(placements.map(item=>[`${item.slot}:${item.id}`,item]));
  const relationships=calculateRelationships(skyA,skyB,orb).map(relation=>{
    const left=byKey.get(`${relation.left.slot}:${relation.left.id}`),right=byKey.get(`${relation.right.slot}:${relation.right.id}`);
    return{...relation,leftLayout:left,rightLayout:right};
  }).filter(item=>item.leftLayout&&item.rightLayout);
  return{placements,relationships,cusps:{A:skyCusps(skyA),B:skyCusps(skyB)}};
}
