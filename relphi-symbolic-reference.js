// Oracle of Relphi canonical symbolic reference.
// Distilled principles only: discovery anecdotes and research paths do not belong here.
// This is shared semantic input for question generation and other Relphi surfaces.
(function(){
  'use strict';

  const PLANETS=Object.freeze({
    Sun:Object.freeze({
      principle:'Identity',
      operations:Object.freeze(['source','selfhood','presence','expression']),
      direct:'enact identity through presence and expression',
      retrograde:null,
      return:null,
      question:Object.freeze({
        focus:'Where does identity need to be expressed more fully?',
        repeated:'Where is identity asking to become more fully present?'
      })
    }),
    Moon:Object.freeze({
      principle:'Feedback',
      operations:Object.freeze(['reception','response','memory','incorporation']),
      direct:'receive and incorporate feedback',
      retrograde:null,
      return:null,
      question:Object.freeze({
        focus:'What feedback needs to be received and incorporated?',
        repeated:'What feedback keeps asking to be received and incorporated?'
      })
    }),
    Mercury:Object.freeze({
      principle:'Understanding',
      operations:Object.freeze(['parsing','differentiation','connection','transmission','intelligibility']),
      direct:'make distinctions connections and information intelligible',
      retrograde:'revisit and rework distinctions connections information and routes',
      return:'resume understanding with the revised map made by retracing',
      question:Object.freeze({
        focus:'What needs to be parsed or connected before it can be understood?',
        repeated:'What needs clearer differentiation or connection before it becomes intelligible?'
      })
    }),
    Venus:Object.freeze({
      principle:'Affection',
      operations:Object.freeze(['attraction','relation','valuation','joining','reciprocity']),
      direct:'form and value relationships through attraction joining and reciprocity',
      retrograde:'revisit value attachment relation and reciprocity',
      return:'resume relationship with what the exchange revealed incorporated',
      question:Object.freeze({
        focus:'What relationship or value needs to be brought into better reciprocity?',
        repeated:'Where does connection need renewed attention to value and reciprocity?'
      })
    }),
    Mars:Object.freeze({
      principle:'Protection',
      operations:Object.freeze(['agency','positioning','mobilization','coordination','deployment','restraint']),
      direct:'position mobilize coordinate deploy or restrain available force',
      retrograde:'regroup recover reposition and preserve capacity for further action',
      return:'redeploy with force differently positioned by what was learned',
      question:Object.freeze({
        focus:'Where do available efforts or resources need to be brought into effective formation?',
        repeated:'Where do available efforts or resources need better positioning coordination or restraint?'
      })
    }),
    Jupiter:Object.freeze({
      principle:'Participation',
      operations:Object.freeze(['contribution','amplification','inclusion','systemic involvement']),
      direct:'enter contribute to and amplify participation in a larger system',
      retrograde:'revisit participation through the effects contribution produced in the larger system',
      return:'reintegrate with knowledge of the larger system',
      question:Object.freeze({
        focus:'Where does participation in the larger system need attention?',
        repeated:'Where does contribution need to be reconsidered in relation to the larger whole?'
      })
    }),
    Saturn:Object.freeze({
      principle:'Freedom',
      operations:Object.freeze(['boundary','structure','autonomy','order','durable limitation']),
      direct:'create durable boundaries and structure that support autonomy',
      retrograde:'revisit whether a boundary preserves autonomy or unnecessarily confines it',
      return:'resume within a boundary that can be inhabited knowingly',
      question:Object.freeze({
        focus:'What boundary or structure would better support autonomy?',
        repeated:'Which boundary or structure needs attention so freedom can remain durable?'
      })
    }),
    Uranus:Object.freeze({
      principle:'Creation',
      operations:Object.freeze(['formation','invention','expression','new form']),
      direct:'bring new form into being',
      retrograde:'take an existing form back into possibility and re-create it',
      return:'resume creation with the previous form retained as information',
      question:Object.freeze({
        focus:'What is ready to take a new form?',
        repeated:'Where is a new form trying to emerge?'
      })
    }),
    Neptune:Object.freeze({
      principle:'Leisure',
      operations:Object.freeze(['release','play','surrender','completion','wholeness']),
      direct:'release the grip enough for play completion and the whole to appear',
      retrograde:'reopen what seemed complete without gripping it',
      return:'re-enter the completed pattern as renewed play or wholeness',
      question:Object.freeze({
        focus:'Where would release make room for play or a more complete whole?',
        repeated:'Where does the grip need to loosen so the whole can become visible?'
      })
    }),
    Pluto:Object.freeze({
      principle:'Burial',
      operations:Object.freeze(['decomposition','concealment','retrieval','post-closure transformation']),
      direct:'carry beyond closure what the completed form can no longer hold',
      retrograde:'return to what was buried and retrieve what remains operative',
      return:'allow what was retrieved to re-emerge in transformed form',
      question:Object.freeze({
        focus:'What has gone underground because the old form could no longer hold it?',
        repeated:'What buried material is ready for retrieval or transformation?'
      })
    })
  });

  const MOTION=Object.freeze({
    direct:'enact the planetary operation',
    retrograde:'revisit and rework the planetary operation',
    return:'resume the planetary operation carrying what the revisit revealed',
    formula:'Direct = enact · Retrograde = revisit/rework · Return = resume with memory'
  });

  window.RELPHI_SYMBOLIC_REFERENCE=Object.freeze({
    version:1,
    planets:PLANETS,
    motion:MOTION,
    planet(name){return PLANETS[String(name||'').trim()]||null;},
    planetQuestion(name,kind='focus'){
      const record=PLANETS[String(name||'').trim()];
      return record?.question?.[kind]||record?.question?.focus||'';
    }
  });
})();
