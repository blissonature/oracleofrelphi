(function(){
'use strict';
const bridge=window.RelphiPolygonSpecialShapes;
if(!bridge||!bridge.shapes||!bridge.shapes.triangle) return;

// Canonical 21–55–64 construction: A=(0,0), B=(55,0),
// Neptune/C=(-63/11, 84√7/11), so the Neptune point is in Cartesian Quadrant II.
// Polygon Harmonics uses clockwise-positive screen angles; therefore the
// canonical circumcircle offsets must be the sign-reversal of the Cartesian
// angular offsets.
const b=111.54226734437484;
const c=36.80449239188047;
const DEG=Math.PI/180;
const triangle=bridge.shapes.triangle;
triangle.offsets=[0,-b*DEG,c*DEG];
triangle.detail='A is the root vertex. AB = 55, AC = 21, and BC = 64. The Neptune/C point keeps its canonical Quadrant II orientation instead of the mirrored construction. The unequal circumcircle arcs create three interleaved note streams instead of the simultaneous augmented-triad strikes of the regular triangle.';
triangle.law='The canonical construction has A at the origin, B fifty-five units to the right, and Neptune/C at negative sixty-three elevenths, positive eighty-four square-root-seven elevenths: Quadrant II. On the clockwise-positive sound wheel this places B about one hundred eleven point five four two degrees counterclockwise from A and C about thirty-six point eight zero four degrees clockwise from A. The three crossing streams remain distinct, producing thirty-six separate vertex-note contacts per complete turn. Whenever A crosses a note, that pitch becomes the current root.';

bridge.triangleCentralOffsetsDegrees=[0,-b,c];
bridge.triangleCanonicalCartesian={A:[0,0],B:[55,0],C:[-63/11,84*Math.sqrt(7)/11],neptuneVertex:'C',neptuneQuadrant:'II'};
})();
