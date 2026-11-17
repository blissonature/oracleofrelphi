// Shared wheel geometry/presentation contract for comparison and standalone Sky wheels.
(function(){
'use strict';
if(window.RelphiSkyWheelSpec)return;
const COLORS=Object.freeze(['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e']);
const SKY=Object.freeze({A:'#c9211e',B:'#2462d0'});
const SIGNS=Object.freeze(['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces']);
const ANGLES=Object.freeze(['asc','dsc','mc','ic']);
const comparison=Object.freeze({
  viewBox:Object.freeze([0,0,1200,1200]),center:Object.freeze({x:600,y:600}),
  inner:Object.freeze({inner:166,outer:323,degree:323,placement:Object.freeze([287,299,283]),angle:Object.freeze([202,220,238]),edge:166,side:'inner'}),
  zodiac:Object.freeze({inner:323,outer:414,fillOpacity:.82,glyphRadius:24,strokeWidth:2.7}),
  outer:Object.freeze({inner:414,outer:574,degree:414,placement:Object.freeze([450,440,460]),angle:Object.freeze([540,522,504]),edge:574,side:'outer'}),
  houseFillOpacity:.5,houseNumberFont:22,angleGap:17,placementRadius:18.5,placementBubbleRadius:19.7,
  placementClearance:6,tangentialStep:.75,tangentialLimit:15
});
const standaloneInner=Object.freeze({
  role:'inner',house:Object.freeze({inner:128.5,outer:207,numberRadius:167.75}),degree:128.5,
  placement:Object.freeze([172,178,166]),angle:Object.freeze([188,179,197]),edge:207,side:'outer'
});
const mini=Object.freeze({
  scale:.5,viewBox:Object.freeze([0,0,600,600]),center:Object.freeze({x:300,y:300}),
  // Standalone wheels keep the same compact outer radius, with zodiac inside and houses outside.
  zodiac:Object.freeze({inner:83,outer:128.5,fillOpacity:.82,glyphRadius:14,strokeWidth:1.8}),
  standalone:standaloneInner,A:standaloneInner,B:standaloneInner,
  houseFillOpacity:.5,houseNumberFont:16,angleGap:12,angleRadius:14,angleStrokeWidth:1.8,
  placementRadius:12,placementBubbleRadius:13,placementStrokeWidth:1.8,
  placementClearance:5,tangentialStep:.75,tangentialLimit:18
});
function role(slot){return slot==='A'?comparison.inner:comparison.outer}
function miniRole(){return mini.standalone}
window.RelphiSkyWheelSpec=Object.freeze({COLORS,SKY,SIGNS,ANGLES,comparison,mini,role,miniRole});
})();
