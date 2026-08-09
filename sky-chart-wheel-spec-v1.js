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
  zodiac:Object.freeze({inner:323,outer:414,fillOpacity:.82,glyphRadius:19,strokeWidth:2.35}),
  outer:Object.freeze({inner:414,outer:574,degree:414,placement:Object.freeze([450,440,460]),angle:Object.freeze([540,522,504]),edge:574,side:'outer'}),
  houseFillOpacity:.5,houseNumberFont:22,angleGap:17,placementRadius:16,placementBubbleRadius:17.2,
  placementClearance:6,tangentialStep:.75,tangentialLimit:15
});
const mini=Object.freeze({
  scale:.5,viewBox:Object.freeze([0,0,600,600]),center:Object.freeze({x:300,y:300}),
  // At the card's rendered width these values match the apparent scale of the comparison wheel.
  zodiac:Object.freeze({inner:161.5,outer:207,fillOpacity:.82,glyphRadius:14,strokeWidth:1.8}),
  A:Object.freeze({role:'inner',house:Object.freeze({inner:83,outer:161.5,numberRadius:112}),degree:161.5,placement:Object.freeze([145,151,139]),angle:Object.freeze([101,110,119]),edge:83,side:'inner'}),
  B:Object.freeze({role:'outer',house:Object.freeze({inner:207,outer:287,numberRadius:222}),degree:207,placement:Object.freeze([252,261,270]),angle:Object.freeze([279,270,261]),edge:287,side:'outer'}),
  houseFillOpacity:.5,houseNumberFont:16,angleGap:12,angleRadius:14,angleStrokeWidth:1.8,
  placementRadius:12,placementBubbleRadius:13,placementStrokeWidth:1.8,
  placementClearance:5,tangentialStep:.75,tangentialLimit:18
});
function role(slot){return slot==='A'?comparison.inner:comparison.outer}
function miniRole(slot){return mini[slot==='A'?'A':'B']}
window.RelphiSkyWheelSpec=Object.freeze({COLORS,SKY,SIGNS,ANGLES,comparison,mini,role,miniRole});
})();
