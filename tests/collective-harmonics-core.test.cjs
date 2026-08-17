const assert=require('assert');
const core=require('../relphi-collective-harmonics-core-v1.js');
const records=longitudes=>longitudes.map((longitude,index)=>({id:`p${index}`,name:`P${index}`,longitude}));
const get=(spectrum,order)=>spectrum.find(item=>item.order===order);

let spectrum=core.spectrum(records([0,120,240]),6,12);
assert(Math.abs(get(spectrum,3).net-1)<1e-9,'triangle should be perfectly H3 coherent');
assert(Math.abs(get(spectrum,3).distinctive-1)<1e-9,'triangle should be fundamentally H3');
assert(Math.abs(get(spectrum,6).net-1)<1e-9,'triangle should produce the H6 overtone');
assert(get(spectrum,6).distinctive<1e-9,'H6 should be removed as an inherited H3 overtone');
assert.strictEqual(get(spectrum,6).inheritedFrom,3);

spectrum=core.spectrum(records([0,90,180,270]),6,12);
assert(Math.abs(get(spectrum,4).distinctive-1)<1e-9,'square should be fundamentally H4');
assert(get(spectrum,8).distinctive<1e-9,'H8 should be inherited from H4');

spectrum=core.spectrum(records([0,180]),6,12);
assert(Math.abs(get(spectrum,2).distinctive-1)<1e-9,'opposition should be fundamentally H2');
assert(Math.abs(get(spectrum,3).net+1)<1e-9,'opposition should maximally resist H3');

spectrum=core.spectrum(records(Array.from({length:7},(_,index)=>index*360/7)),6,12);
assert(Math.abs(get(spectrum,7).distinctive-1)<1e-9,'regular heptagon should be fundamentally H7');

const h6=core.metric(records([0,60,120,180]),6,6);
assert(h6.primitiveWindowHits>0,'H6 should recognize primitive sextile-family hits');
assert(h6.inheritedWindowHits>0,'H6 should distinguish lower-order inherited alignments');
assert(h6.identityError<1e-9,'pairwise balance must equal the whole-field phase identity');

let cross=core.crossSpectrum(records([0]),records([180]),6,12);
assert(Math.abs(get(cross,2).net-1)<1e-9,'cross-sky opposition should support H2');
assert(Math.abs(get(cross,2).distinctive-1)<1e-9,'cross-sky opposition should be fundamentally H2');
assert.strictEqual(get(cross,2).primitiveWindowHits,1,'opposition should be a primitive H2 window hit');

cross=core.crossSpectrum(records([0]),records([120]),6,12);
assert(Math.abs(get(cross,3).net-1)<1e-9,'cross-sky trine should support H3');
assert(Math.abs(get(cross,6).net-1)<1e-9,'cross-sky trine should also land on the H6 overtone');
assert(get(cross,6).distinctive<1e-9,'cross H6 overtone should inherit from H3');

const resisted=core.crossMetric(records([0]),records([60]),3,6);
assert(Math.abs(resisted.resistance-1)<1e-9,'a half-cycle H3 phase displacement should be maximal resistance');
assert(Math.abs(resisted.net+1)<1e-9,'maximal cross resistance should produce net -1');
assert(resisted.identityError<1e-9,'cross-pair mean must equal the cross-field vector identity');

const mixed=core.crossMetric(records([0,42,177]),records([15,96,251]),7,12);
assert(mixed.pairCount===9,'cross metric must include every A × B pair, not only recognized aspects');
assert(mixed.identityError<1e-9,'all-pairs cross balance must equal the cross-field phase identity');

console.log('collective harmonic core controls: pass');
