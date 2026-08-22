import{normalizeSky}from'./model.mjs';

export function initialState(seed={}){
  return{
    slots:{A:normalizeSky(seed?.slots?.A),B:normalizeSky(seed?.slots?.B)},
    orb:Number.isFinite(Number(seed?.orb))?Number(seed.orb):3,
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
      return{...state,slots:{...state.slots,[slot]:sky},selectedPlacement:null,selectedRelationship:null};
    }
    case'CLEAR_SLOT':{
      const slot=action.slot==='B'?'B':'A';
      if(slot==='A')return{...state,slots:{A:null,B:null},selectedPlacement:null,selectedRelationship:null};
      return{...state,slots:{...state.slots,B:null},selectedPlacement:null,selectedRelationship:null};
    }
    case'SET_ORB':return{...state,orb:Math.max(0,Math.min(10,Number(action.value)||0)),selectedRelationship:null};
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
