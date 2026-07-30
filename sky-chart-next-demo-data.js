(function(){
  'use strict';
  window.SkyChartNextInitialDocument={
    schemaVersion:1,
    mode:'compare',
    skies:{
      A:{
        id:'fixture-natal',slot:'A',name:'Natal',color:'#c9211e',
        metadata:{dateLabel:'8 Oct 1985 · 4:37 AM',locationLabel:'Malden, Massachusetts'},
        houseFrames:{
          'whole-sign':{system:'whole-sign',cusps:[150,180,210,240,270,300,330,0,30,60,90,120]},
          'equal-house':{system:'equal-house',cusps:[168.3833,198.3833,228.3833,258.3833,288.3833,318.3833,348.3833,18.3833,48.3833,78.3833,108.3833,138.3833]}
        },
        placements:[
          {id:'sun',longitude:195},{id:'moon',longitude:118.4167},{id:'mercury',longitude:206.1667},
          {id:'venus',longitude:169.8833},{id:'mars',longitude:167.8667},{id:'jupiter',longitude:307.15},
          {id:'saturn',longitude:235.5667},{id:'uranus',longitude:254.85},{id:'neptune',longitude:271.0167},{id:'pluto',longitude:213.8833}
        ]
      },
      B:{
        id:'fixture-comparison',slot:'B',name:'Comparison',color:'#2462d0',
        metadata:{dateLabel:'29 Jul 2026 · demonstration sky',locationLabel:'Same fixed zodiac reference'},
        houseFrames:{
          'whole-sign':{system:'whole-sign',cusps:[270,300,330,0,30,60,90,120,150,180,210,240]},
          'equal-house':{system:'equal-house',cusps:[284,314,344,14,44,74,104,134,164,194,224,254]}
        },
        placements:[
          {id:'sun',longitude:126},{id:'moon',longitude:302},{id:'mercury',longitude:112},
          {id:'venus',longitude:172},{id:'mars',longitude:82},{id:'jupiter',longitude:128},
          {id:'saturn',longitude:14.7},{id:'uranus',longitude:64.8},{id:'neptune',longitude:4.4},{id:'pluto',longitude:304.3}
        ]
      }
    },
    display:{houseSystem:'whole-sign'}
  };
})();