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
      operations:Object.freeze(['parsing','differentiation','connection','transmission','intelligibility','negotiation','negotium']),
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
      operations:Object.freeze(['release','play','surrender','completion','wholeness','otium','noninstrumental being']),
      direct:'release the grip of obligation transaction and required production enough for play contemplation completion and the whole to appear',
      retrograde:'reopen what seemed complete without gripping it',
      return:'re-enter the completed pattern as renewed play or wholeness',
      question:Object.freeze({
        focus:'Where would release from obligation or required production make room for play contemplation or a more complete whole?',
        repeated:'Where does the grip of obligation transaction or production need to loosen so the whole can become visible?'
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

  const SIGN_AFFAIRS=Object.freeze({
    Aries:Object.freeze({host:'Mars',element:'Fire',mode:'Cardinal'}),
    Taurus:Object.freeze({host:'Venus',element:'Earth',mode:'Fixed'}),
    Gemini:Object.freeze({host:'Mercury',element:'Air',mode:'Mutable'}),
    Cancer:Object.freeze({host:'Moon',element:'Water',mode:'Cardinal'}),
    Leo:Object.freeze({host:'Sun',element:'Fire',mode:'Fixed'}),
    Virgo:Object.freeze({host:'Mercury',element:'Earth',mode:'Mutable'}),
    Libra:Object.freeze({host:'Venus',element:'Air',mode:'Cardinal'}),
    Scorpio:Object.freeze({host:'Mars',element:'Water',mode:'Fixed'}),
    Sagittarius:Object.freeze({host:'Jupiter',element:'Fire',mode:'Mutable'}),
    Capricorn:Object.freeze({host:'Saturn',element:'Earth',mode:'Cardinal'}),
    Aquarius:Object.freeze({host:'Saturn',element:'Air',mode:'Fixed'}),
    Pisces:Object.freeze({host:'Jupiter',element:'Water',mode:'Mutable'})
  });

  // Traditional seven-planet relationship matrix used by Astrological Tarot.
  // Element + mode describe the host planet's affairs. Relationship verbs remain
  // deliberately open while Relphi tests them through metathesis, repetition,
  // convergence, planetary-hour deputyship, and motion.
  const TRADITIONAL_RELATIONSHIPS=Object.freeze({
    relationshipTypes:Object.freeze({
      domicile:Object.freeze({question:'Who is this planet when it is at home?',status:'established'}),
      deputy:Object.freeze({question:"Who is this planet when it is away from home working in another planet's government?",status:'research'}),
      exaltation:Object.freeze({question:"What relationship exists when another ruler's affairs especially support or privilege this planet?",status:'research',doNotAssume:Object.freeze(['trust','superiority'])}),
      detriment:Object.freeze({question:"What relationship exists when this planet handles the affairs opposite its own homes?",status:'research',doNotAssume:Object.freeze(['distrust','bad'])}),
      fall:Object.freeze({question:"What relationship exists between this planet and the ruler of the affairs in which it falls?",status:'research',doNotAssume:Object.freeze(['distrust','failure'])})
    }),
    profiles:Object.freeze({
      Moon:Object.freeze({
        invariant:'Feedback',
        homes:Object.freeze([{host:'Moon',element:'Water',mode:'Cardinal'}]),
        exaltation:Object.freeze({host:'Venus',element:'Earth',mode:'Fixed'}),
        detriment:Object.freeze([{host:'Saturn',element:'Earth',mode:'Cardinal'}]),
        fall:Object.freeze({host:'Mars',element:'Water',mode:'Fixed'}),
        deputies:Object.freeze(['Saturn','Jupiter']),
        motion:Object.freeze({retrograde:false})
      }),
      Sun:Object.freeze({
        invariant:'Identity',
        homes:Object.freeze([{host:'Sun',element:'Fire',mode:'Fixed'}]),
        exaltation:Object.freeze({host:'Mars',element:'Fire',mode:'Cardinal'}),
        detriment:Object.freeze([{host:'Saturn',element:'Air',mode:'Fixed'}]),
        fall:Object.freeze({host:'Venus',element:'Air',mode:'Cardinal'}),
        deputies:Object.freeze(['Venus','Mercury']),
        motion:Object.freeze({retrograde:false})
      }),
      Mercury:Object.freeze({
        invariant:'Understanding',
        coreHypotheses:Object.freeze(['parser','differentiation','connection','transmission','intelligibility']),
        capabilityCandidates:Object.freeze(['recognize','distinguish','parse','name','represent','encode','decode','translate','transmit','connect','compare','match','index','reference','sequence','sort','classify','measure','coordinate','navigate','orient','handle','exchange','mediate','negotiate','broker','improvise','circumvent']),
        homes:Object.freeze([{host:'Mercury',element:'Air',mode:'Mutable'},{host:'Mercury',element:'Earth',mode:'Mutable'}]),
        exaltation:Object.freeze({host:'Mercury',element:'Earth',mode:'Mutable',convergence:Object.freeze(['domicile','exaltation'])}),
        detriment:Object.freeze([{host:'Jupiter',element:'Fire',mode:'Mutable'},{host:'Jupiter',element:'Water',mode:'Mutable'}]),
        fall:Object.freeze({host:'Jupiter',element:'Water',mode:'Mutable',convergence:Object.freeze(['detriment','fall'])}),
        deputies:Object.freeze(['Moon','Saturn']),
        motion:Object.freeze({retrograde:true,retrogradeOperation:'reparse_revise',returnOperation:'resume_with_revised_understanding'}),
        tarot:Object.freeze({card:'Magus',observedOperations:Object.freeze(['speech','handling','exchange','translation','crossing_between_inside_and_outside'])}),
        mythicRelationships:Object.freeze({son:Object.freeze([]),brother:Object.freeze([]),father:Object.freeze([]),husbandOrLover:Object.freeze([]),loyalCompanion:Object.freeze([])})
      }),
      Venus:Object.freeze({
        invariant:'Affection',
        homes:Object.freeze([{host:'Venus',element:'Earth',mode:'Fixed'},{host:'Venus',element:'Air',mode:'Cardinal'}]),
        exaltation:Object.freeze({host:'Jupiter',element:'Water',mode:'Mutable'}),
        detriment:Object.freeze([{host:'Mars',element:'Water',mode:'Fixed'},{host:'Mars',element:'Fire',mode:'Cardinal'}]),
        fall:Object.freeze({host:'Mercury',element:'Earth',mode:'Mutable'}),
        deputies:Object.freeze(['Mercury','Moon']),
        motion:Object.freeze({retrograde:true,retrogradeOperation:'rerelate',returnOperation:'resume_with_revised_relation'})
      }),
      Mars:Object.freeze({
        invariant:'Protection',
        homes:Object.freeze([{host:'Mars',element:'Fire',mode:'Cardinal'},{host:'Mars',element:'Water',mode:'Fixed'}]),
        exaltation:Object.freeze({host:'Saturn',element:'Earth',mode:'Cardinal'}),
        detriment:Object.freeze([{host:'Venus',element:'Air',mode:'Cardinal'},{host:'Venus',element:'Earth',mode:'Fixed'}]),
        fall:Object.freeze({host:'Moon',element:'Water',mode:'Cardinal'}),
        deputies:Object.freeze(['Sun','Venus']),
        motion:Object.freeze({retrograde:true,retrogradeOperation:'regroup_reposition',returnOperation:'redeploy'})
      }),
      Jupiter:Object.freeze({
        invariant:'Participation',
        homes:Object.freeze([{host:'Jupiter',element:'Fire',mode:'Mutable'},{host:'Jupiter',element:'Water',mode:'Mutable'}]),
        exaltation:Object.freeze({host:'Moon',element:'Water',mode:'Cardinal'}),
        detriment:Object.freeze([{host:'Mercury',element:'Air',mode:'Mutable'},{host:'Mercury',element:'Earth',mode:'Mutable'}]),
        fall:Object.freeze({host:'Saturn',element:'Earth',mode:'Cardinal'}),
        deputies:Object.freeze(['Mars','Sun']),
        motion:Object.freeze({retrograde:true,retrogradeOperation:'participation_becomes_feedback',returnOperation:'reintegrate'})
      }),
      Saturn:Object.freeze({
        invariant:'Freedom',
        homes:Object.freeze([{host:'Saturn',element:'Earth',mode:'Cardinal'},{host:'Saturn',element:'Air',mode:'Fixed'}]),
        exaltation:Object.freeze({host:'Venus',element:'Air',mode:'Cardinal'}),
        detriment:Object.freeze([{host:'Moon',element:'Water',mode:'Cardinal'},{host:'Sun',element:'Fire',mode:'Fixed'}]),
        fall:Object.freeze({host:'Mars',element:'Fire',mode:'Cardinal'}),
        deputies:Object.freeze(['Jupiter','Mars']),
        motion:Object.freeze({retrograde:true,retrogradeOperation:'revisit_boundary',returnOperation:'resume_with_knowingly_inhabitable_boundary'})
      })
    })
  });

  function traditionalProfile(name){
    return TRADITIONAL_RELATIONSHIPS.profiles[String(name||'').trim()]||null;
  }
  function traditionalCondition(name,sign){
    const profile=traditionalProfile(name),host=SIGN_AFFAIRS[String(sign||'').trim()];
    if(!profile||!host)return null;
    const same=(x)=>x&&x.host===host.host&&x.element===host.element&&x.mode===host.mode;
    const statuses=[];
    if(profile.homes.some(same))statuses.push('domicile');
    if(same(profile.exaltation))statuses.push('exaltation');
    if(profile.detriment.some(same))statuses.push('detriment');
    if(same(profile.fall))statuses.push('fall');
    return Object.freeze({planet:String(name),sign:String(sign),host:host.host,element:host.element,mode:host.mode,statuses:Object.freeze(statuses)});
  }
  function relationshipQuestion(name,sign){
    const c=traditionalCondition(name,sign),p=traditionalProfile(name);
    if(!c||!p)return '';
    if(c.statuses.includes('domicile'))return 'Who is '+name+' when '+p.invariant.toLowerCase()+' is handling its own '+c.mode+' '+c.element+' affairs?';
    if(c.statuses.includes('exaltation'))return 'What becomes possible when '+c.host+"'s "+c.mode+' '+c.element+' affairs are entrusted to '+name+'?';
    if(c.statuses.includes('detriment')||c.statuses.includes('fall'))return 'What does '+name+' discover while handling '+c.host+"'s "+c.mode+' '+c.element+' affairs?';
    return 'What does '+name+' contribute while working in '+c.host+"'s "+c.mode+' '+c.element+' affairs?';
  }

  const RELATIONSHIPS=Object.freeze({
    mercuryNeptune:Object.freeze({
      axis:'negotium ↔ otium',
      Mercury:'engagement in what must be parsed differentiated communicated negotiated or dealt with',
      Neptune:'release from compulsory transactional or productive engagement into noninstrumental being play contemplation and wholeness'
    }),
    nonNegotiable:Object.freeze({
      operation:'a boundary asserted within negotium rather than otium itself',
      sequence:Object.freeze(['Mercury differentiates the terms','Venus establishes value in the relation','Mars protects the line','Jupiter locates participation in the larger system','Saturn establishes the boundary that preserves freedom','Neptune releases compulsory engagement'])
    })
  });

  const MOTION=Object.freeze({
    direct:'enact the planetary operation',
    retrograde:'revisit and rework the planetary operation',
    return:'resume the planetary operation carrying what the revisit revealed',
    formula:'Direct = enact · Retrograde = revisit/rework · Return = resume with memory'
  });

  window.RELPHI_SYMBOLIC_REFERENCE=Object.freeze({
    version:3,
    planets:PLANETS,
    signAffairs:SIGN_AFFAIRS,
    traditionalRelationships:TRADITIONAL_RELATIONSHIPS,
    relationships:RELATIONSHIPS,
    motion:MOTION,
    planet(name){return PLANETS[String(name||'').trim()]||null;},
    traditionalProfile,
    traditionalCondition,
    relationshipQuestion,
    planetQuestion(name,kind='focus'){
      const record=PLANETS[String(name||'').trim()];
      return record?.question?.[kind]||record?.question?.focus||'';
    }
  });
})();
