// Desktop Celtic Cross canonicalizer. Geometry belongs to the prefab state, not a post-render renderer.
(function(){
  'use strict';
  if(!/(^|\/)tarot\.html$/.test(location.pathname))return;
  if(window.matchMedia&&window.matchMedia('(max-width:700px)').matches)return;
  if(window.__relphiCelticCanonicalV1)return;
  window.__relphiCelticCanonicalV1=true;

  // Permanently retire the old desktop DOM geometry owners.
  window.__relphiDrawingBoardRenderGeometryV1=true;
  window.__relphiDrawingBoardRenderGeometryV2=true;
  window.__relphiDrawingBoardRenderGeometryV3=true;

  var TARGET='celtic-cross-10';
  var SCALE=.60;
  var BASE_W=900;
  var BASE_H=760;
  var CENTER_LEFT=260;
  var CENTER_TOP=300;
  var STAFF_LEFT=650;
  var STAFF_TOP=15;
  var FACE_W=174;
  var FACE_H=301;
  var LABEL_H=40;
  var LABEL_CLEARANCE=2;

  function clone(value){return JSON.parse(JSON.stringify(value));}
  function transform(x,y,rotation,zIndex){
    return {x:x/BASE_W,y:y/BASE_H,rotation:rotation||0,scale:SCALE,zIndex:zIndex||1};
  }
  function canonicalize(prefab){
    if(!prefab||prefab.id!==TARGET||!Array.isArray(prefab.positions))return prefab;

    var visualW=FACE_W*SCALE;
    var visualH=FACE_H*SCALE;
    var labelGap=(LABEL_H+LABEL_CLEARANCE)*SCALE;
    var axis=CENTER_LEFT+FACE_W/2;

    // Positions 1 and 2 begin open and upright, touching the central axis.
    // CSS closes them into the traditional crossing only after position 2 contains a card.
    var coverX=CENTER_LEFT-visualW/2;
    var crossX=CENTER_LEFT+visualW/2;

    // The outer cross is fixed to the footprint of the eventual closed crossing card,
    // so positions 3–6 never jump when position 2 is revealed.
    var closedLeft=axis-visualH/2;
    var closedRight=axis+visualH/2;
    var xForVisualRight=function(right){return right-(FACE_W+visualW)/2;};
    var xForVisualLeft=function(left){return left-(FACE_W-visualW)/2;};
    var behindX=xForVisualRight(closedLeft);
    var beforeX=xForVisualLeft(closedRight+labelGap);
    var crownY=CENTER_TOP-visualH-labelGap;
    var beneathY=CENTER_TOP+visualH+labelGap;

    var geometry={
      covering:transform(coverX,CENTER_TOP,0,20),
      crossing:transform(crossX,CENTER_TOP,0,30),
      crowning:transform(CENTER_LEFT,crownY,0,4),
      beneath:transform(CENTER_LEFT,beneathY,0,4),
      behind:transform(behindX,CENTER_TOP,0,4),
      before:transform(beforeX,CENTER_TOP,0,4),
      outcome:transform(STAFF_LEFT,STAFF_TOP,0,4),
      'hopes-fears':transform(STAFF_LEFT,STAFF_TOP+visualH,0,4),
      house:transform(STAFF_LEFT,STAFF_TOP+2*visualH,0,4),
      self:transform(STAFF_LEFT,STAFF_TOP+3*visualH,0,4)
    };

    var copy=clone(prefab);
    copy.positions=copy.positions.map(function(position){
      var value=geometry[position.id];
      if(!value)return position;
      var next=Object.assign({},position,{transform:clone(value)});
      if(position.id==='covering'||position.id==='crossing')next.openTransform=clone(value);
      return next;
    });
    return copy;
  }

  function syncClass(){
    var panel=document.getElementById('shortListPanel');
    var state=window.RelphiDrawingBoardPrefabsBridge&&window.RelphiDrawingBoardPrefabsBridge.getState&&window.RelphiDrawingBoardPrefabsBridge.getState();
    if(panel)panel.classList.toggle('relphi-celtic-readable',state&&state.activeLayout&&state.activeLayout.id===TARGET);
  }

  function install(){
    var original=window.RelphiDrawingBoardPrefabsBridge;
    if(!original)return false;
    if(original.__relphiCelticCanonicalV1){syncClass();return true;}

    var wrapped={};
    Object.keys(original).forEach(function(key){wrapped[key]=original[key];});
    wrapped.applyLayout=function(prefab,options){
      var result=original.applyLayout(canonicalize(prefab),options);
      syncClass();
      return result;
    };
    Object.defineProperty(wrapped,'__relphiCelticCanonicalV1',{value:true,enumerable:false});
    window.RelphiDrawingBoardPrefabsBridge=Object.freeze(wrapped);

    var state=wrapped.getState&&wrapped.getState();
    if(state&&state.activeLayout&&state.activeLayout.id===TARGET&&!state.hasCards&&!state.locked){
      var currentScale=Number(state.activeLayout.positions&&state.activeLayout.positions[0]&&state.activeLayout.positions[0].transform&&state.activeLayout.positions[0].transform.scale)||0;
      if(Math.abs(currentScale-SCALE)>.001)wrapped.applyLayout(state.activeLayout,{designMode:!!state.designMode});
    }
    syncClass();
    return true;
  }

  if(!install()){
    var attempts=0;
    var retry=function(){
      attempts+=1;
      if(install()||attempts>=40)return;
      window.setTimeout(retry,25);
    };
    window.setTimeout(retry,0);
  }
  document.addEventListener('relphi:drawing-board-rendered',syncClass);
})();
