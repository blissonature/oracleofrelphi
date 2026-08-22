import{normalizeSky}from'./model.mjs';

const cleanList=value=>Array.from(new Set(Array.isArray(value)?value.map(item=>String(item)):[])).sort();
function normalFilters(seed={}){
  return{
    placements:{A:cleanList(seed?.placements?.A),B:cleanList(seed?.placements?.B)},
    aspects:cleanList(seed?.aspects),
    houses:{A:cleanList(seed?.houses?.A),B:cleanList(seed?.houses?.B)},
    signs:{A:cleanList(seed?.signs?.A),B:cleanList(seed?.signs?.B)}
  };
}
function resetSlotFilters(filters,slot){
  return{...filters,placements:{...filters.placements,[slot]:[]},houses:{...filters.houses,[slot]:[]},signs:{...filters.signs,[slot]:[]}};
}
function setExcluded(filters,kind,slot,values){
  const next=cleanList(values);
  if(kind==='aspects')return{...filters,aspects:next};
  if(!['placements','houses','signs'].includes(kind)||!['A','B'].includes(slot))return filters;
  return{...filters,[kind]:{...filters[kind],[slot]:next}};
}
function toggleExcluded(filters,kind,slot,value,enabled){
  const current=kind==='aspects'?filters.aspects:filters?.[kind]?.[slot];if(!Array.isArray(current))return filters;
  const key=String(value),set=new Set(current);if(enabled)set.delete(key);else set.add(key);
  return setExcluded(filters,kind,slot,Array.from(set));
}

export function initialState(seed={}){
  return{
    slots:{A:normalizeSky(seed?.slots?.A),B:normalizeSky(seed?.slots?.B)},
    orb:Number.isFinite(Number(seed?.orb))?Number(seed.orb):3,
    filters:normalFilters(seed?.filters),
    selectedPlacement:null,
    selectedRelationship:null,
    dialog:null
  };
}

export function modeOf(state){return state?.slots?.A?(state?.slots?.B?'comparison':'single'):'empty'}

export function reducer(state,action){
  switch(action?.type){
    case'SET_SLOT':{
      const slot=action.slot==='B'?'B':'A',sky=normalizeSky(action.sky);
      if(slot==='B'&&!state.slots.A)return state;
      return{...state,slots:{...state.slots,[slot]:sky},filters:resetSlotFilters(state.filters,slot),selectedPlacement:null,selectedRelationship:null};
    }
    case'CLEAR_SLOT':{
      const slot=action.slot==='B'?'B':'A';
      if(slot==='A')return{...state,slots:{A:null,B:null},filters:normalFilters(),selectedPlacement:null,selectedRelationship:null};
      return{...state,slots:{...state.slots,B:null},filters:resetSlotFilters(state.filters,'B'),selectedPlacement:null,selectedRelationship:null};
    }
    case'SET_ORB':return{...state,orb:Math.max(0,Math.min(10,Number(action.value)||0)),selectedRelationship:null};
    case'SET_FILTER_EXCLUDED':return{...state,filters:setExcluded(state.filters,action.kind,action.slot,action.values),selectedRelationship:null};
    case'TOGGLE_FILTER_ITEM':return{...state,filters:toggleExcluded(state.filters,action.kind,action.slot,String(action.value),!!action.enabled),selectedRelationship:null};
    case'RESET_FILTERS':return{...state,filters:normalFilters(),selectedRelationship:null};
    case'SELECT_PLACEMENT':return{...state,selectedPlacement:action.value||null,selectedRelationship:null};
    case'SELECT_RELATIONSHIP':return{...state,selectedRelationship:action.value||null,selectedPlacement:null};
    case'OPEN_DIALOG':return{...state,dialog:action.dialog||null};
    case'CLOSE_DIALOG':return{...state,dialog:null};
    case'REPLACE_STATE':return initialState(action.state||{});
    default:return state;
  }
}

export function createStore(seed){
  let state=initialState(seed),queued=false;
  const listeners=new Set();
  const notify=()=>{queued=false;for(const listener of listeners)listener(state)};
  return{
    getState:()=>state,
    dispatch(action){const next=reducer(state,action);if(next===state)return state;state=next;if(!queued){queued=true;queueMicrotask(notify)}return state},
    subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener)}
  };
}
