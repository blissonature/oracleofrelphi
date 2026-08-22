import{canonicalId,isAngle,placementEntries,houseFor,skyCusps}from'./model.mjs';

const setOf=value=>new Set(Array.isArray(value)?value.map(item=>String(item)):[]);
export const slotPlacementIds=(state,slot)=>placementEntries(state?.slots?.[slot]).map(item=>item.id);
export function placementExcluded(state,slot,id){return setOf(state?.filters?.placements?.[slot]).has(String(id))}
export function aspectExcluded(state,id){return setOf(state?.filters?.aspects).has(String(id))}
export function houseExcluded(state,slot,house){return setOf(state?.filters?.houses?.[slot]).has(String(house))}
export function signExcluded(state,slot,sign){return setOf(state?.filters?.signs?.[slot]).has(canonicalId(sign))}

export function placementHouse(state,slot,item){
  if(!item||isAngle(item))return null;
  if(Number.isFinite(Number(item.house)))return Number(item.house);
  return houseFor(item.longitude,skyCusps(state?.slots?.[slot]));
}

export function placementPassesFilters(state,slot,item){
  if(!item)return false;
  if(placementExcluded(state,slot,item.id))return false;
  if(signExcluded(state,slot,item.sign))return false;
  if(!isAngle(item)){
    const house=placementHouse(state,slot,item);
    if(house&&houseExcluded(state,slot,house))return false;
  }
  return true;
}

export function relationshipMode(state){
  if(!state?.slots?.A)return'none';
  if(!state?.slots?.B)return'A-A';
  const a=placementEntries(state.slots.A),b=placementEntries(state.slots.B);
  const enabledA=a.some(item=>!placementExcluded(state,'A',item.id));
  const enabledB=b.some(item=>!placementExcluded(state,'B',item.id));
  if(enabledA&&!enabledB)return'A-A';
  if(!enabledA&&enabledB)return'B-B';
  if(!enabledA&&!enabledB)return'none';
  return'A-B';
}

export function relationshipPassesFilters(state,relation){
  const mode=relationshipMode(state);if(mode==='none'||relation?.scope!==mode)return false;
  if(aspectExcluded(state,relation.id?.split('|').at(-1)||relation.id))return false;
  return placementPassesFilters(state,relation.left.slot,relation.left)&&placementPassesFilters(state,relation.right.slot,relation.right);
}

export function visibleRelationships(state,relations){return(Array.isArray(relations)?relations:[]).filter(relation=>relationshipPassesFilters(state,relation))}
export function enabledPlacementCount(state,slot){return placementEntries(state?.slots?.[slot]).filter(item=>!placementExcluded(state,slot,item.id)).length}
