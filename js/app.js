'use strict';
const uid = () => (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function')
  ? globalThis.crypto.randomUUID()
  : 'aps-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);

const OPTIONS = {
  types:['Abschlag','Transportschlag','Recovery','Bunkerschlag','Kurzspiel','Putt'],
  subtypes:{Bunkerschlag:['Grünbunker','Fairwaybunker'],Kurzspiel:['Chip','Pitch','Lob']},
  clubs:['Driver','Holz 3','Holz 5','Holz 7','Hybrid 2','Hybrid 3','Hybrid 4','Eisen 4','Eisen 5','Eisen 6','Eisen 7','Eisen 8','Eisen 9','PW','GW','SW','LW','Putter'],
  contact:['Miss – Ball kaum bewegt','Fett','Dünn','Solide','Sauber'],
  bunkerContact:['Ball kaum bewegt','Zu viel Sand','Zu wenig Sand / dünn','Solide','Sauber'],
  direction:['Stark links','Links','Zielbereich','Rechts','Stark rechts'],
  puttDirection:['Links vorbei','Startlinie passend','Rechts vorbei'],
  distance:['Viel zu kurz','Zu kurz','Passend','Zu lang','Viel zu lang'],
  lies:{
    Abschlag:['Fairway','Semi-Rough','Rough','Fairwaybunker','Recovery-Lage','Penalty Area','Aus','Ball kaum bewegt'],
    Transportschlag:['Fairway','Semi-Rough','Rough','Vorgrün','Grün','Bunker','Recovery-Lage','Penalty Area','Aus','Ball kaum bewegt'],
    Recovery:['Fairway','Semi-Rough','Rough','Vorgrün','Grün','Bunker','Recovery-Lage','Penalty Area','Aus','Ball kaum bewegt'],
    Bunkerschlag:['Grün','Vorgrün','Fairway','Rough','Im selben Bunker','Anderer Bunker','Recovery-Lage','Penalty Area','Aus'],
    Kurzspiel:['Eingelocht','Grün','Vorgrün','Rough','Bunker','Recovery-Lage']
  },
  puttStart:['Bis 1 m','1–2 m','2–5 m','5–10 m','Über 10 m'],
  rest:['Eingelocht','Bis 0,5 m','0,5–1 m','1–2 m','2–3 m','Über 3 m'],
  shortRest:['Eingelocht','Bis 0,5 m','0,5–1 m','1–2 m','2–5 m','Über 5 m'],
  penalties:['0','1','2'],
  penaltyReasons:['Penalty Area / Wasser','Aus','Unspielbar','Sonstige Regelstrafe']
};

const newShot = (type='Abschlag') => ({id:uid(),type,subtype:'',club:type==='Putt'?'Putter':'',contact:'',direction:'',distance:'',lie:'',puttStart:'',rest:'',penalties:'0',penaltyReason:''});
const newHole = n => ({id:uid(),number:n,par:4,score:'',shots:[newShot(n===1?'Abschlag':'Abschlag')]});
const initialState = () => ({version:'3.0',player:{name:'',handicap:'',date:new Date().toISOString().slice(0,10),course:'',note:''},holes:[newHole(1)],activeHole:0,lastAnalysis:null,archive:[],currentRoundId:null});

function sampleState(){
 const s=initialState(); s.player={name:'Max Mustermann',handicap:'18.4',date:new Date().toISOString().slice(0,10),course:'APS Test Course',note:'Feldtest'};
 const mk=(type,club,contact,direction,distance,lie,extra={})=>({id:uid(),type,subtype:'',club,contact,direction,distance,lie,puttStart:'',rest:'',penalties:'0',penaltyReason:'',...extra});
 s.holes=[
 {id:uid(),number:1,par:4,score:6,shots:[mk('Abschlag','Driver','Solide','Stark rechts','Passend','Recovery-Lage'),mk('Recovery','Eisen 7','Solide','Zielbereich','Passend','Fairway'),mk('Transportschlag','Eisen 8','Dünn','Links','Zu kurz','Vorgrün'),mk('Kurzspiel','SW','Solide','Zielbereich','Zu kurz','Grün',{subtype:'Chip',rest:'2–5 m'}),mk('Putt','Putter','','Startlinie passend','Viel zu kurz','',{puttStart:'2–5 m',rest:'1–2 m'}),mk('Putt','Putter','','Startlinie passend','Passend','',{puttStart:'1–2 m',rest:'Eingelocht'})]},
 {id:uid(),number:2,par:5,score:7,shots:[mk('Abschlag','Driver','Sauber','Stark links','Passend','Aus',{penalties:'1',penaltyReason:'Aus'}),mk('Abschlag','Driver','Solide','Rechts','Passend','Rough'),mk('Transportschlag','Holz 5','Dünn','Rechts','Zu kurz','Fairway'),mk('Transportschlag','Holz 5','Dünn','Links','Zu kurz','Fairway'),mk('Transportschlag','PW','Solide','Zielbereich','Passend','Grün'),mk('Putt','Putter','','Startlinie passend','Zu kurz','',{puttStart:'5–10 m',rest:'1–2 m'}),mk('Putt','Putter','','Startlinie passend','Passend','',{puttStart:'1–2 m',rest:'Eingelocht'})]},
 {id:uid(),number:3,par:3,score:4,shots:[mk('Abschlag','Eisen 7','Sauber','Zielbereich','Passend','Grün'),mk('Putt','Putter','','Startlinie passend','Viel zu lang','',{puttStart:'Über 10 m',rest:'2–3 m'}),mk('Putt','Putter','','Links vorbei','Passend','',{puttStart:'2–5 m',rest:'Bis 0,5 m'}),mk('Putt','Putter','','Startlinie passend','Passend','',{puttStart:'Bis 1 m',rest:'Eingelocht'})]}
 ]; return s;
}


const CONTACT_SEVERITY={
  'Miss – Ball kaum bewegt':3,'Ball kaum bewegt':3,'Fett':2,'Dünn':2,
  'Zu viel Sand':2,'Zu wenig Sand / dünn':2,'Solide':0,'Sauber':0
};
const DIRECTION_SEVERITY={
  'Stark links':2,'Stark rechts':2,'Links':1,'Rechts':1,
  'Links vorbei':1.5,'Rechts vorbei':1.5,'Zielbereich':0,'Startlinie passend':0
};
const DISTANCE_SEVERITY={'Viel zu kurz':2,'Viel zu lang':2,'Zu kurz':1,'Zu lang':1,'Passend':0};
const filled=v=>typeof v==='string'&&v.trim()!=='';
const contactSeverity=v=>CONTACT_SEVERITY[v]??0;
const directionSeverity=v=>DIRECTION_SEVERITY[v]??0;
const distanceSeverity=v=>DISTANCE_SEVERITY[v]??0;
const pct=(n,d)=>d?Math.round(n/d*100):0;
const titleCase=s=>s||'–';
const observationLabel=n=>`${n} ${n===1?'Auffälligkeit':'Auffälligkeiten'}`;

function allShots(state){return state.holes.flatMap(h=>h.shots.map((s,i)=>({...s,hole:h.number,shotNo:i+1})));}
function isRecordedShot(s){return Number(s.penalties||0)>0||['contact','direction','distance','lie','puttStart','rest'].some(k=>filled(s[k]));}
function isCountedStroke(s){return isRecordedShot(s)||filled(s.club)||filled(s.subtype);}
function recordedStrokeCount(hole){return (hole?.shots||[]).filter(isCountedStroke).length;}
function penaltyStrokeCount(hole){return (hole?.shots||[]).filter(isCountedStroke).reduce((sum,shot)=>sum+Number(shot.penalties||0),0);}
function calculatedHoleScore(hole){const strokes=recordedStrokeCount(hole);return strokes?strokes+penaltyStrokeCount(hole):0;}
function syncHoleScore(hole){if(!hole)return 0;const score=calculatedHoleScore(hole);hole.score=score||'';return score;}
function syncAllHoleScores(target){(target?.holes||[]).forEach(syncHoleScore);return target;}
function nonPuttOutcomeImpact(s){
  const lieImpact={
    'Aus':4,'Penalty Area':4,'Ball kaum bewegt':3.5,'Recovery-Lage':2.5,
    'Im selben Bunker':3,'Anderer Bunker':2,'Bunker':1.5,'Rough':0.5
  }[s.lie]||0;
  return Number(s.penalties||0)*4+lieImpact;
}
function restValue(rest){return ({'Eingelocht':0,'Bis 0,5 m':0,'0,5–1 m':0.5,'1–2 m':1,'2–3 m':2.5,'2–5 m':2.5,'Über 3 m':4,'Über 5 m':4}[rest]??0);}
function puttRestImpact(s){
  if(!filled(s.rest)) return 0;
  if(['Bis 1 m','1–2 m'].includes(s.puttStart)) return s.rest==='Eingelocht'?0:3+restValue(s.rest)*0.5;
  if(s.puttStart==='2–5 m') return Math.max(0,restValue(s.rest)-0.25);
  if(['5–10 m','Über 10 m'].includes(s.puttStart)) return Math.max(0,restValue(s.rest)-0.75);
  return restValue(s.rest);
}
function directionBias(shots){
  const left=shots.filter(s=>['Links','Stark links','Links vorbei'].includes(s.direction)).length;
  const right=shots.filter(s=>['Rechts','Stark rechts','Rechts vorbei'].includes(s.direction)).length;
  if(left>=2&&left>right*1.4) return 'links';
  if(right>=2&&right>left*1.4) return 'rechts';
  return '';
}
function dominantSignal(shots){
  const sums={
    contact:shots.reduce((a,s)=>a+contactSeverity(s.contact),0),
    direction:shots.reduce((a,s)=>a+directionSeverity(s.direction),0),
    distance:shots.reduce((a,s)=>a+distanceSeverity(s.distance),0)
  };
  return {sums,key:Object.entries(sums).sort((a,b)=>b[1]-a[1])[0]?.[0]||'contact'};
}

function clamp(n,min=0,max=100){return Math.max(min,Math.min(max,n));}
function avg(arr){return arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:0;}

function playabilityValue(s){
  const p=Number(s.penalties||0);
  if(p>0||['Penalty Area','Aus'].includes(s.lie)) return 0;
  return ({
    'Fairway':1,'Grün':1,'Eingelocht':1,
    'Semi-Rough':0.92,'Vorgrün':0.90,
    'Rough':0.78,'Fairwaybunker':0.72,'Bunker':0.65,
    'Recovery-Lage':0.30,'Ball kaum bewegt':0.15,
    'Im selben Bunker':0.25,'Anderer Bunker':0.50
  }[s.lie] ?? 0.85);
}
function severeOutcomeShot(s){
  return Number(s.penalties||0)>0||['Penalty Area','Aus','Recovery-Lage','Ball kaum bewegt'].includes(s.lie);
}
function technicalQuality(shots,weights={contact:1,direction:1,distance:1}){
  if(!shots.length)return 100;
  let used=0,loss=0,maxLoss=0;
  shots.forEach(s=>{
    if(filled(s.contact)){used++;loss+=contactSeverity(s.contact)*weights.contact;maxLoss+=3*weights.contact;}
    if(filled(s.direction)){used++;loss+=directionSeverity(s.direction)*weights.direction;maxLoss+=2*weights.direction;}
    if(filled(s.distance)){used++;loss+=distanceSeverity(s.distance)*weights.distance;maxLoss+=2*weights.distance;}
  });
  return maxLoss?clamp(Math.round(100-(loss/maxLoss)*100)):100;
}
function makeIssue({name,pillar,shots,evaluate,cause,training,strategy,goal,details={},countOverride=null,performanceScore=null,qualifies=true}){
  const evaluated=shots.map(s=>({shot:s,...evaluate(s)}));
  const hits=evaluated.filter(x=>(x.severity||0)+(x.impact||0)>0.25);
  const severity=hits.reduce((a,x)=>a+(x.severity||0),0);
  const impact=hits.reduce((a,x)=>a+(x.impact||0),0)+(details.extraImpact||0);
  const total=shots.length,count=countOverride===null?hits.length:countOverride,rate=pct(count,total),avgSeverity=total?severity/total:0;
  const score=performanceScore===null?clamp(Math.round(100-(rate*.45+avgSeverity*8+Math.min(25,impact*2)))):clamp(Math.round(performanceScore));
  const priority=clamp(100-score);
  return {name,pillar,count,total,rate,severity,impact,avgSeverity,priority,performanceScore:score,qualifies,cause,training,strategy,goal,evidence:hits.map(x=>x.shot),...details};
}

function teeIssue(shots){
  const n=shots.length;
  const unplayableShots=shots.filter(severeOutcomeShot);
  const unplayable=unplayableShots.length;
  const penaltyCount=shots.reduce((a,s)=>a+Number(s.penalties||0),0);
  const playabilityScore=Math.round(avg(shots.map(playabilityValue))*100);
  const consequenceScore=clamp(100-(unplayable/n)*85-(penaltyCount/n)*40);
  const techScore=technicalQuality(shots,{contact:1,direction:.65,distance:.45});
  const performanceScore=playabilityScore*.60+consequenceScore*.25+techScore*.15;

  const dirErrors=shots.filter(s=>directionSeverity(s.direction)>0);
  const contactErrors=shots.filter(s=>contactSeverity(s.contact)>0);
  const distErrors=shots.filter(s=>distanceSeverity(s.distance)>0);
  const sig=dominantSignal(shots),bias=directionBias(shots);

  // Ball-im-Spiel is only a priority when the consequence repeats.
  if((n>=6&&unplayable>=2)||(n<6&&unplayable/n>=.34)){
    return makeIssue({
      name:'Abschlag – Ball im Spiel halten',pillar:'Abschlagleistung',shots,
      evaluate:s=>({severity:severeOutcomeShot(s)?2:0,impact:nonPuttOutcomeImpact(s)}),
      countOverride:unplayable,performanceScore,qualifies:performanceScore<78,
      cause:`${unplayable} von ${n} Abschlägen führten zu einer unspielbaren Lage oder einem Strafschlag.`,
      training:'10-Ball-Spielbarkeits-Test: breiten Zielkorridor wählen und Recovery-, Penalty- oder Aus-Bälle separat dokumentieren.',
      strategy:'Schläger und Ziellinie nach größter Spielbarkeitsquote wählen; technische Streuung ist zweitrangig, solange der nächste Schlag normal spielbar bleibt.',
      goal:'Mindestens 8 von 10 Abschläge ohne Recovery oder Strafschlag spielbar.',
      details:{unplayable,penaltyCount,playabilityScore,technicalScore:techScore,dominant:'outcome'}
    });
  }

  // A purely technical tee tendency must be strong and repeated; harmless misses remain a note, not a priority.
  const candidates=[
    {key:'contact',count:contactErrors.length,name:'Abschlag – Treffmoment',
     cause:`${contactErrors.length} von ${n} Abschlägen zeigten einen deutlichen Kontaktfehler.`,
     training:'Treffbild am Schlägerblatt markieren und Serien mit konstanter Tee-Höhe dokumentieren.',
     goal:'Mindestens 8 von 10 Treffer solide oder sauber bei gleichzeitig hoher Spielbarkeit.'},
    {key:'direction',count:dirErrors.length,name:'Abschlag – Richtungskontrolle',
     cause:`${dirErrors.length} von ${n} Abschlägen verließen den Zielkorridor${bias?` mit Tendenz nach ${bias}`:''}, ohne dass jede Abweichung automatisch als Spielverlust gewertet wird.`,
     training:'Zielkorridor trainieren und zusätzlich notieren, ob die Abweichung den nächsten Schlag tatsächlich erschwert.',
     goal:'Mindestens 8 von 10 Abschläge im Zielkorridor oder normal spielbar.'},
    {key:'distance',count:distErrors.length,name:'Abschlag – Längenkontrolle',
     cause:`${distErrors.length} von ${n} Abschlägen lagen außerhalb des geplanten Längenfensters.`,
     training:'Carry-Fenster mit kontrollierten Schwungintensitäten trainieren.',
     goal:'Mindestens 8 von 10 Abschläge im geplanten Längenfenster und spielbar.'}
  ].sort((a,b)=>b.count-a.count);
  const top=candidates[0];
  const techRate=top.count/n;
  const qualifies=performanceScore<72 && techRate>=.50 && top.count>=3;
  return makeIssue({
    name:top.name,pillar:'Abschlagleistung',shots,
    evaluate:s=>({severity: top.key==='contact'?contactSeverity(s.contact):top.key==='direction'?directionSeverity(s.direction):distanceSeverity(s.distance),impact:nonPuttOutcomeImpact(s)}),
    countOverride:top.count,performanceScore,qualifies,
    cause:top.cause,training:top.training,
    strategy:'Technische Abweichungen nur dann aggressiv korrigieren, wenn sie wiederholt Spielbarkeit oder Score beeinflussen.',
    goal:top.goal,
    details:{unplayable,penaltyCount,playabilityScore,technicalScore:techScore,dominant:top.key}
  });
}

function longGameIssue(shots){
  const n=shots.length,sig=dominantSignal(shots),bias=directionBias(shots);
  const playabilityScore=Math.round(avg(shots.map(playabilityValue))*100);
  const techScore=technicalQuality(shots,{contact:1,direction:.75,distance:.8});
  const penalties=shots.reduce((a,s)=>a+Number(s.penalties||0),0);
  const severe=shots.filter(severeOutcomeShot).length;
  const consequenceScore=clamp(100-(severe/n)*75-(penalties/n)*40);
  const performanceScore=playabilityScore*.45+consequenceScore*.25+techScore*.30;
  const contactErrors=shots.filter(s=>contactSeverity(s.contact)>0).length;
  const directionErrors=shots.filter(s=>directionSeverity(s.direction)>0).length;
  const distanceErrors=shots.filter(s=>distanceSeverity(s.distance)>0).length;
  const candidates=[
    ['contact',contactErrors,'Langes Spiel – Ballkontakt','Fett-, Dünn- oder Misskontakte sind das stärkste wiederkehrende Muster.','Bodenreferenz mit Linie oder Handtuch trainieren: Trefferpunkt und Bodenberührung dokumentieren.','Mindestens 8 von 10 Bälle solide oder sauber treffen.'],
    ['distance',distanceErrors,'Langes Spiel – Distanzkontrolle','Zu kurze oder zu lange Schläge sind das stärkste wiederkehrende Muster.','Carry-Leiter mit drei Zielentfernungen und passenden Schlägern trainieren.','Mindestens 7 von 10 Schläge im definierten Carry-Fenster.'],
    ['direction',directionErrors,'Langes Spiel – Richtungskontrolle',`Die Seitenkontrolle ist das stärkste wiederkehrende Muster${bias?` mit Tendenz nach ${bias}`:''}.`,'Startlinien-Gate plus Zielkorridor: Ballstart und Endlage getrennt bewerten.','Mindestens 7 von 10 Bälle im Zielkorridor oder in einer normal spielbaren Lage.']
  ].sort((a,b)=>b[1]-a[1]);
  const [key,count,name,cause,training,goal]=candidates[0];
  const qualifies=performanceScore<78 && count>=Math.max(2,Math.ceil(n*.35));
  return makeIssue({
    name,pillar:'Langes Spiel',shots,
    evaluate:s=>({severity:key==='contact'?contactSeverity(s.contact):key==='distance'?distanceSeverity(s.distance):directionSeverity(s.direction),impact:nonPuttOutcomeImpact(s)}),
    countOverride:count,performanceScore,qualifies,cause,training,
    strategy:'Schlägerwahl und Zielzone nach der tatsächlich erzielten Spielbarkeit ausrichten; technische Fehler ohne Folge niedriger gewichten.',
    goal,details:{dominant:key,playabilityScore,technicalScore:techScore,severe}
  });
}

function shortGameIssue(shots){
  const n=shots.length;
  const contactErrors=shots.filter(s=>contactSeverity(s.contact)>0).length;
  const distanceErrors=shots.filter(s=>distanceSeverity(s.distance)>0).length;
  const directionErrors=shots.filter(s=>directionSeverity(s.direction)>0).length;
  const outcomeScore=Math.round(avg(shots.map(playabilityValue))*100);
  const techScore=technicalQuality(shots,{contact:1,direction:.45,distance:.85});

  // The app has no starting-distance field for chips/pitches. Therefore a 2–5 m
  // remaining distance is context, not automatically a failure.
  const proximityScore=75;
  const performanceScore=outcomeScore*.35+techScore*.50+proximityScore*.15;
  const candidates=[
    ['contact',contactErrors,'Kurzspiel – Ballkontakt',
     `${contactErrors} von ${n} Kurzspielschlägen zeigten einen klaren Kontaktfehler.`,
     'Kontakt-Drill aus drei Lagen: zuerst Treffmoment und Landepunkt, danach erst die Endlage bewerten.',
     'Mindestens 8 von 10 Bälle solide oder sauber treffen.'],
    ['distance',distanceErrors,'Kurzspiel – Längenkontrolle',
     `${distanceErrors} von ${n} Kurzspielschlägen verfehlten das geplante Längenfenster.`,
     'Landepunkt-Leiter mit drei Distanzen: gleiche Technik, wechselnde Landefelder und Endlage dokumentieren.',
     'Mindestens 7 von 10 Bälle im geplanten Längenfenster.'],
    ['direction',directionErrors,'Kurzspiel – Richtungskontrolle',
     `${directionErrors} von ${n} Kurzspielschlägen verfehlten den Zielkorridor.`,
     'Startlinie und Landepunkt getrennt trainieren.',
     'Mindestens 8 von 10 Bälle in der gewählten Start- und Landezone.']
  ].sort((a,b)=>b[1]-a[1]);
  const [key,count,name,cause,training,goal]=candidates[0];
  const qualifies=performanceScore<80 && count>=Math.max(2,Math.ceil(n*.34));

  return makeIssue({
    name,pillar:'Kurzspiel',shots,
    evaluate:s=>({severity:key==='contact'?contactSeverity(s.contact):key==='distance'?distanceSeverity(s.distance):directionSeverity(s.direction),impact:nonPuttOutcomeImpact(s)}),
    countOverride:count,performanceScore,qualifies,cause,training,
    strategy:'Landepunkt und Schlagwahl nach Fehlertoleranz wählen. Restdistanz ohne bekannte Ausgangsdistanz nicht isoliert als Fehler werten.',
    goal,
    details:{dominant:key,outcomeScore,technicalScore:techScore,proximityContext:'Ausgangsdistanz nicht erfasst'}
  });
}

function bunkerIssue(shots){
  const n=shots.length;
  const failed=shots.filter(s=>['Im selben Bunker','Anderer Bunker','Recovery-Lage','Penalty Area','Aus'].includes(s.lie)||s.contact==='Ball kaum bewegt').length;
  const outcomeScore=Math.round(avg(shots.map(playabilityValue))*100);
  const techScore=technicalQuality(shots,{contact:1,direction:.4,distance:.7});
  const performanceScore=outcomeScore*.65+techScore*.35;
  return makeIssue({
    name:'Bunker – sicher heraus und kontrolliert',pillar:'Bunkerspiel',shots,
    evaluate:s=>({severity:contactSeverity(s.contact)+distanceSeverity(s.distance)*.5,impact:nonPuttOutcomeImpact(s)}),
    countOverride:failed||shots.filter(s=>contactSeverity(s.contact)>0||distanceSeverity(s.distance)>0).length,
    performanceScore,qualifies:performanceScore<75 && (failed>=2 || techScore<60),
    cause:failed?`${failed} von ${n} Bunkerschlägen beendeten die Situation nicht kontrolliert.`:'Kontakt oder Längenkontrolle im Bunker ist wiederholt auffällig.',
    training:'Linien-Drill im Sand: zuerst sichere Ausstiegsquote, danach Distanzzonen ergänzen.',
    strategy:'Bei schwieriger Lage zuerst den sicheren Ausstieg priorisieren.',
    goal:'Mindestens 8 von 10 Bälle sicher heraus.',
    details:{failed,outcomeScore,technicalScore:techScore}
  });
}

function puttingIssue(putts,threePutts){
  const n=putts.length;
  const shortPutts=putts.filter(s=>['Bis 1 m','1–2 m'].includes(s.puttStart));
  const shortHoled=shortPutts.filter(s=>s.rest==='Eingelocht').length;
  const shortScore=shortPutts.length?shortHoled/shortPutts.length*100:75;

  const longPutts=putts.filter(s=>['5–10 m','Über 10 m'].includes(s.puttStart));
  const longInsideOne=longPutts.filter(s=>['Eingelocht','Bis 0,5 m','0,5–1 m'].includes(s.rest)).length;
  const longInsideTwo=longPutts.filter(s=>['Eingelocht','Bis 0,5 m','0,5–1 m','1–2 m'].includes(s.rest)).length;
  const lagScore=longPutts.length?((longInsideOne*1+(longInsideTwo-longInsideOne)*.65)/longPutts.length*100):80;
  const threePuttScore=clamp(100-(threePutts/Math.max(1,new Set(putts.map(s=>s.hole)).size))*100);
  const explicitTempoErrors=putts.filter(s=>distanceSeverity(s.distance)>0).length;
  const technicalTempoScore=clamp(100-(explicitTempoErrors/n)*35); // small penalty if result remains controlled

  const performanceScore=shortScore*.40+threePuttScore*.35+lagScore*.15+technicalTempoScore*.10;
  const shortMisses=shortPutts.length-shortHoled;
  const lagFailures=longPutts.length-longInsideTwo;

  let name='Putten – Distanzkontrolle',count=lagFailures,cause=`${lagFailures} von ${longPutts.length} langen Putts blieben außerhalb eines kontrollierten Zwei-Meter-Fensters.`,training='Distanzleiter aus 5, 8, 10 und 12 m: Ergebniszone dokumentieren.',goal='Mindestens 8 von 10 Lag-Putts innerhalb von 2 m, davon möglichst viele innerhalb 1 m.';
  if(shortMisses>=2 && shortMisses/Math.max(1,shortPutts.length)>.20){
    name='Putten – kurze Putts';count=shortMisses;cause=`${shortMisses} von ${shortPutts.length} Putts bis 2 m wurden nicht gelocht.`;
    training='Startlinien-Gate aus 1 m und 1,5 m; Serienquote dokumentieren.';
    goal='Mindestens 90 % bis 1 m und 75 % aus 1–2 m lochen.';
  }else if(threePutts>=2){
    name='Putten – Dreiputts vermeiden';count=threePutts;cause=`Auf ${threePutts} Bahnen entstanden Dreiputts.`;
  }
  const qualifies=performanceScore<78 && count>=2;
  return makeIssue({
    name,pillar:'Putten',shots:putts,
    evaluate:s=>({severity:distanceSeverity(s.distance)*.35+directionSeverity(s.direction)*.25,impact:puttRestImpact(s)}),
    countOverride:count,performanceScore,qualifies,cause,training,
    strategy:'Lochergebnis und Folgeputt stärker bewerten als eine bloße Links-/Rechts- oder Tempoabweichung.',
    goal,
    details:{shortMisses,lagFailures,shortHoled,shortPutts:shortPutts.length,longPutts:longPutts.length,longInsideOne,longInsideTwo,threePutts}
  });
}

function performanceBand(score,sample=0,reliable=false){
  if(score===null||score===undefined||!sample)return {label:'Keine Daten',key:'none',provisional:false};
  const provisional=!reliable;
  if(score<25)return {label:'Kritisch',key:'critical',provisional};
  if(score<50)return {label:'Deutlicher Trainingsbedarf',key:'high',provisional};
  if(score<70)return {label:'Ausbaufähig',key:'medium',provisional};
  if(score<85)return {label:'Stabil',key:'stable',provisional};
  return {label:'Stärke',key:'strength',provisional};
}
function dimensionPillar(name,shots,severityFn,focus){
  const observed=shots.filter(s=>filled(name==='Ballkontakt'?s.contact:name==='Richtungskontrolle'?s.direction:s.distance));
  const severity=observed.reduce((a,s)=>a+severityFn(s),0),errors=observed.filter(s=>severityFn(s)>0).length;
  const maxSeverity=observed.length*(name==='Ballkontakt'?3:2);
  const score=maxSeverity?Math.max(0,Math.round(100-severity/maxSeverity*100)):null;
  const reliable=observed.length>=3,errorRate=pct(errors,observed.length);
  return {name,score,sample:observed.length,errors,errorRate,reliable,summary:observed.length?`${errors} von ${observed.length} Beobachtungen waren auffällig${reliable?'':'; Stichprobe noch klein'}.`:'Noch keine bewertbaren Daten.',focus,details:''};
}
function phasePillar(name,issue,focus,details=''){
  if(!issue||!issue.total)return {name,score:null,sample:0,errors:0,errorRate:0,reliable:false,summary:'Noch keine bewertbaren Daten.',focus,details};
  const score=issue.performanceScore??clamp(100-issue.priority);
  const reliable=issue.total>=3;
  return {
    name,score,sample:issue.total,errors:issue.count,errorRate:issue.rate,reliable,
    summary:`Leistungsindex ${score}/100 aus ${issue.total} relevanten Schlägen${reliable?'':'; Stichprobe noch klein'}.`,
    focus,details
  };
}

function analyse(state){
  syncAllHoleScores(state);
  const shots=allShots(state).filter(isRecordedShot),nonPutts=shots.filter(s=>s.type!=='Putt'),putts=shots.filter(s=>s.type==='Putt');
  const penalties=shots.reduce((a,s)=>a+Number(s.penalties||0),0);
  const tee=shots.filter(s=>s.type==='Abschlag'),longGame=shots.filter(s=>['Transportschlag','Recovery'].includes(s.type)),shortGame=shots.filter(s=>s.type==='Kurzspiel'),bunker=shots.filter(s=>s.type==='Bunkerschlag');
  const threePutts=state.holes.filter(h=>h.shots.filter(s=>s.type==='Putt'&&isRecordedShot(s)).length>=3).length;
  const issues=[tee.length&&teeIssue(tee),longGame.length&&longGameIssue(longGame),shortGame.length&&shortGameIssue(shortGame),bunker.length&&bunkerIssue(bunker),putts.length&&puttingIssue(putts,threePutts)].filter(Boolean).sort((a,b)=>b.priority-a.priority);
  // Absolute relevance threshold first, ranking second. No forced Top-3.
  const priorities=issues.filter(i=>i.qualifies===true).sort((a,b)=>b.priority-a.priority).slice(0,3);
  const clubMap={};
  nonPutts.forEach(s=>{const k=s.club||'Ohne Angabe';const x=clubMap[k]??={club:k,shots:0,bad:0,weightedErrors:0,penalties:0,recovery:0};const sev=Math.min(3,Math.max(contactSeverity(s.contact),directionSeverity(s.direction),distanceSeverity(s.distance)));x.shots++;if(sev>0)x.bad++;x.weightedErrors+=sev;x.penalties+=Number(s.penalties||0);if(s.lie==='Recovery-Lage')x.recovery++;});
  const clubs=Object.values(clubMap).map(x=>({...x,reliability:Math.max(0,Math.round(100-(x.weightedErrors/(x.shots*3))*100))})).sort((a,b)=>(b.weightedErrors+b.penalties*4+b.recovery*2)-(a.weightedErrors+a.penalties*4+a.recovery*2));
  const contactPillar=dimensionPillar('Ballkontakt',nonPutts, s=>contactSeverity(s.contact),priorities.find(p=>p.dominant==='contact')?.training||'Treffmoment und Bodenreferenz stabilisieren.');
  const directionPillar=dimensionPillar('Richtungskontrolle',shots,s=>directionSeverity(s.direction),priorities.find(p=>p.dominant==='direction')?.training||'Startlinie und Zielkorridor trainieren.');
  const distancePillar=dimensionPillar('Distanzkontrolle',shots,s=>distanceSeverity(s.distance),priorities.find(p=>p.dominant==='distance')?.training||'Carry- und Tempofenster trainieren.');
  const shortPutts=putts.filter(s=>['Bis 1 m','1–2 m'].includes(s.puttStart));
  const shortHoled=shortPutts.filter(s=>s.rest==='Eingelocht').length;
  const longPutts=putts.filter(s=>['5–10 m','Über 10 m'].includes(s.puttStart));
  const longInsideOne=longPutts.filter(s=>['Eingelocht','Bis 0,5 m','0,5–1 m'].includes(s.rest)).length;
  const puttingDetails=[
    `${putts.length} ${putts.length===1?'Putt':'Putts'} erfasst`,
    `${threePutts} ${threePutts===1?'Dreiputt-Bahn':'Dreiputt-Bahnen'}`,
    shortPutts.length?`${shortHoled} von ${shortPutts.length} Putts bis 2 m gelocht`:'',
    longPutts.length?`${longInsideOne} von ${longPutts.length} langen Putts mit höchstens 1 m Restdistanz`:''
  ].filter(Boolean).join(' · ');
  const pillars=[contactPillar,directionPillar,distancePillar,phasePillar('Abschlagleistung',issues.find(i=>i.pillar==='Abschlagleistung'),'Spielbarkeit und Score-Auswirkung zuerst; Technik als zweite Ebene.'),phasePillar('Kurzspiel',issues.find(i=>i.pillar==='Kurzspiel'),'Treffmoment, Längenkontrolle und Ergebnislage getrennt bewerten.'),phasePillar('Putten',issues.find(i=>i.pillar==='Putten'),'Lochquote, Dreiputts und Lag-Ergebnis vor bloßer Abweichung bewerten.',puttingDetails)];
  const scoredHoles=state.holes.filter(h=>h.score!==''&&h.score!==null&&h.score!==undefined&&Number.isFinite(Number(h.score)));
  const scores=scoredHoles.map(h=>Number(h.score)),pars=scoredHoles.map(h=>Number(h.par));
  const score=scores.reduce((a,b)=>a+b,0),par=pars.reduce((a,b)=>a+b,0);
  const directionCounts=['Stark links','Links','Rechts','Stark rechts','Links vorbei','Rechts vorbei'].map(v=>[v,shots.filter(s=>s.direction===v).length]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]);
  const distanceCounts=['Viel zu kurz','Zu kurz','Zu lang','Viel zu lang'].map(v=>[v,shots.filter(s=>s.distance===v).length]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]);
  return {shots,putts,penalties,score,par,scoreToPar:scores.length?score-par:null,issues,priorities,clubs,pillars,patterns:[...directionCounts,...distanceCounts].sort((a,b)=>b[1]-a[1]).slice(0,6),threePutts};
}

function trainingFrom(analysis){
  const p=analysis.priorities.length?analysis.priorities:[{name:'Grundlagencheck',pillar:'Gesamtspiel',priority:1,cause:'Noch sind zu wenige bewertbare Schläge vorhanden.',training:'Alle Spielbereiche mit einem strukturierten Test prüfen und vollständige Ergebnisdaten erfassen.',goal:'Für mindestens drei Spielbereiche jeweils drei bewertbare Schläge erfassen.'}];
  if(p.length===1)return p.map(x=>({minutes:60,title:x.name,why:x.cause,exercise:x.training,goal:x.goal}));
  const totalMinutes=p.length===2?90:90,minMinutes=p.length===2?30:20,free=totalMinutes-minMinutes*p.length,weightSum=p.reduce((a,x)=>a+Math.max(1,x.priority||1),0);
  let times=p.map(x=>minMinutes+Math.round((free*Math.max(1,x.priority||1)/weightSum)/5)*5);
  let diff=totalMinutes-times.reduce((a,b)=>a+b,0);times[0]+=diff;
  return p.map((x,i)=>({minutes:times[i],title:x.name,why:x.cause||'Noch keine belastbare Ursache.',exercise:x.training,goal:x.goal}));
}


const ANALYSIS_CREDIT=99;
const APS_OFFERS=[
  {
    id:'play',name:'APS PLAY',tagline:'Der perfekte Einstieg',price:349,url:'https://www.matthiasberger.pro/programm/aps-play',qr:'assets/qr-aps-play.png',
    description:'Für Golfer, die ihr Spiel mit einem klaren Plan und individueller Begleitung strukturiert entwickeln möchten.',
    features:['Persönliches APS Player Profile','Persönlicher Entwicklungsplan','4 x APS Coaching','APS Abschlussanalyse']
  },
  {
    id:'adapt',name:'APS ADAPT',tagline:'Der nächste Schritt',price:599,url:'https://www.matthiasberger.pro/programm/aps-adapt',qr:'assets/qr-aps-adapt.png',
    description:'Gezielte Weiterentwicklung auf Basis des Player Profiles - mit Coaching, Platztransfer und regelmäßiger Standortbestimmung.',
    features:['6 x APS Coaching','1 x APS Platz-Coaching','Individuelle Trainingsaufgaben','APS Abschlussanalyse']
  },
  {
    id:'perform',name:'APS PERFORM',tagline:'Langfristige Entwicklung',price:1299,url:'https://www.matthiasberger.pro/programm/aps-perform',qr:'assets/qr-aps-perform.png',
    description:'Die umfassendste APS-Begleitung für eine ganzheitliche, langfristige und kontinuierlich angepasste Entwicklung.',
    features:['10 x APS Coaching','2 x APS Platz-Coaching','2 x APS Performance-Studio','Kurzspiel- und Putt-Coaching']
  }
];
const euro=value=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(value);

const KEY='aps-3.0-state';const LEGACY_KEYS=['aps-2.0-state'];let state=load();let analysis=null;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clone=value=>JSON.parse(JSON.stringify(value));
function normalizeState(input){
 const base=initialState(),next={...base,...(input||{})};
 next.player={...base.player,...(input?.player||{})};
 next.holes=Array.isArray(input?.holes)&&input.holes.length?input.holes:base.holes;
 syncAllHoleScores(next);
 next.archive=Array.isArray(input?.archive)?input.archive.map(r=>({...r,id:r.id||uid()})):[];
 next.currentRoundId=input?.currentRoundId||null;
 return next;
}
function load(){try{const current=JSON.parse(localStorage.getItem(KEY));if(current)return normalizeState(current);for(const key of LEGACY_KEYS){const legacy=JSON.parse(localStorage.getItem(key));if(legacy){const migrated=normalizeState({...legacy,version:'3.0'});localStorage.setItem(KEY,JSON.stringify(migrated));return migrated;}}return initialState()}catch{return initialState()}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));const el=$('#saveState');if(el)el.textContent='Lokal gespeichert';}
function roundSnapshot(){return {version:'3.0',player:clone(state.player),holes:clone(state.holes),activeHole:0,lastAnalysis:clone(state.lastAnalysis),currentRoundId:state.currentRoundId};}
function archiveCurrentAnalysis(a){
 const id=state.currentRoundId||uid();state.currentRoundId=id;
 const item={id,savedAt:new Date().toISOString(),player:state.player.name||'Unbenannter Spieler',date:state.player.date,course:state.player.course,score:a.score,par:a.par,penalties:a.penalties,top:a.priorities[0]?.name||'Keine',analysis:clone(a),snapshot:null};
 item.snapshot=roundSnapshot();item.snapshot.currentRoundId=id;item.snapshot.lastAnalysis=clone(a);
 const archive=Array.isArray(state.archive)?state.archive:[];const pos=archive.findIndex(r=>r.id===id);
 if(pos>=0)archive[pos]=item;else archive.unshift(item);state.archive=archive.slice(0,100);
}
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800)}
function fill(select,values,current='',placeholder='Bitte wählen'){select.innerHTML=`<option value="">${placeholder}</option>`+values.map(v=>`<option ${v===current?'selected':''}>${v}</option>`).join('')}
function setView(id){$$('.view').forEach(v=>v.classList.toggle('active',v.id===id));$$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===id));$('.main-nav').classList.remove('open');if(id!=='entry')renderAnalysis();window.scrollTo({top:0,behavior:'smooth'})}
$$('.nav-btn').forEach(b=>b.onclick=()=>setView(b.dataset.view));$('#menuBtn').onclick=()=>$('.main-nav').classList.toggle('open');$$('.print-btn,.customer-report-btn').forEach(b=>b.onclick=()=>printCurrentView(b));

function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));}
function formatDateDE(value){if(!value)return '–';const d=new Date(`${value}T12:00:00`);return Number.isNaN(d.getTime())?escapeHtml(value):new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}).format(d);}
function filePart(value){return String(value||'Spieler').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'')||'Spieler';}
function metaItem(label,value,extraClass=''){return `<div class="print-meta-item ${extraClass}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value||'–')}</strong></div>`;}
function renderOffers(){
 const a=analysis||analyse(state),grid=$('#offerGrid'),context=$('#offerContext');if(!grid)return;
 const top=a.priorities[0]?.name;
 if(context)context.textContent=top?`Ihre Analyse zeigt mit "${top}" den aktuell größten Entwicklungshebel. Die folgenden Programme führen Ihr Player Profile mit einem klaren Coaching-Prozess weiter.`:'Die folgenden Programme führen Ihre Erstanalyse mit einem klaren Coaching-Prozess weiter.';
 grid.innerHTML=APS_OFFERS.map(offer=>{
   const remainder=Math.max(0,offer.price-ANALYSIS_CREDIT);
   return `<article class="offer-card offer-${offer.id}"><div class="offer-card-head"><div><span class="offer-tagline">${escapeHtml(offer.tagline)}</span><h3>${escapeHtml(offer.name)}</h3></div><img class="offer-qr" src="${offer.qr}" alt="QR-Code zu ${escapeHtml(offer.name)}"></div><p>${escapeHtml(offer.description)}</p><ul>${offer.features.map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ul><div class="offer-pricing"><div><span>Programmpreis</span><s>${euro(offer.price)}</s></div><div><span>Anrechnung Erstanalyse</span><strong>- ${euro(ANALYSIS_CREDIT)}</strong></div></div><div class="offer-remainder"><span>Ihr Restbetrag</span><strong>${euro(remainder)}</strong></div><a class="offer-link" href="${offer.url}" target="_blank" rel="noopener">Programm ansehen</a></article>`;
 }).join('');
}
function renderPrintReport(plan=trainingFrom(analysis||analyse(state))){
 const a=analysis||analyse(state),player=state.player||{},score=a.score?`${a.score}${a.scoreToPar!==null?` (${a.scoreToPar>=0?'+':''}${a.scoreToPar})`:''}`:'–';
 const common=metaItem('Spieler',player.name||'–')+metaItem('Handicap',player.handicap?`HCP ${player.handicap}`:'–')+metaItem('Rundendatum',formatDateDE(player.date))+metaItem('Golfplatz',player.course||'–')+metaItem('Score',score)+(player.note?metaItem('Rundennotiz',player.note,'print-meta-note'):'');
 const analysisMeta=$('#analysisPrintMeta'),trainingMeta=$('#trainingPrintMeta');if(analysisMeta)analysisMeta.innerHTML=common;if(trainingMeta)trainingMeta.innerHTML=common;
 const offerMeta=$('#offerPrintMeta');if(offerMeta)offerMeta.innerHTML=metaItem('Spieler',player.name||'–')+metaItem('Erstanalyse angerechnet',euro(ANALYSIS_CREDIT))+metaItem('Persönlicher Fokus',a.priorities[0]?.name||'Grundlagencheck');
 const total=plan.reduce((sum,item)=>sum+Number(item.minutes||0),0),top=plan[0]?.title||'Grundlagencheck';
 const summary=$('#trainingPrintSummary');if(summary)summary.innerHTML=`<div><span>Gesamtdauer</span><strong>${total} Minuten</strong></div><div><span>Hauptfokus</span><strong>${escapeHtml(top)}</strong></div><div><span>Datengrundlage</span><strong>${a.shots.length} erfasste Schläge</strong></div>`;
 renderOffers();
}
function printCurrentView(button){
 const requested=button.dataset.printMode||button.closest('.view')?.id||'profile';
 const view=requested==='customer'?'customer':requested;
 if(view==='analysis'||view==='training'||view==='customer')renderAnalysis();else renderProfile();
 renderPrintReport();
 const kind=view==='customer'?'Kundenbericht':view==='training'?'Trainingsplan':view==='analysis'?'Analyse':'Profil',date=state.player?.date||new Date().toISOString().slice(0,10),title=`APS_${kind}_${filePart(state.player?.name)}_${date}`;
 const ids=view==='customer'?['analysis','training']:[view];
 const popup=window.open('','_blank');
 if(!popup){document.body.dataset.printView=view;const oldTitle=document.title;document.title=title;requestAnimationFrame(()=>setTimeout(()=>{window.print();document.title=oldTitle;},60));return;}
 const cssUrl=new URL('css/app.css',location.href).href;
 const html=ids.map(id=>document.getElementById(id)?.outerHTML||'').join('');
 popup.document.open();popup.document.write(`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><link rel="stylesheet" href="${cssUrl}"></head><body data-print-view="${view}" class="print-document"><main class="app-shell">${html}</main></body></html>`);popup.document.close();
 let printed=false;const doPrint=()=>{if(printed)return;printed=true;try{popup.focus();popup.print();}catch{popup.close();}};
 popup.addEventListener('load',()=>setTimeout(doPrint,180),{once:true});setTimeout(()=>{if(!popup.closed&&popup.document.readyState==='complete')doPrint();},700);
}
window.addEventListener('afterprint',()=>{delete document.body.dataset.printView;});

function syncMeta(){state.player={name:$('#playerName').value,handicap:$('#handicap').value,date:$('#roundDate').value,course:$('#course').value,note:$('#roundNote').value};save()}
['playerName','handicap','roundDate','course','roundNote'].forEach(id=>$('#'+id).addEventListener('change',syncMeta));
function renderMeta(){$('#playerName').value=state.player.name||'';$('#handicap').value=state.player.handicap||'';$('#roundDate').value=state.player.date||'';$('#course').value=state.player.course||'';$('#roundNote').value=state.player.note||''}
function activeHole(){return state.holes[state.activeHole]}
function renderHoles(){
 syncAllHoleScores(state);
 const el=$('#holeList');
 el.innerHTML=state.holes.map((h,i)=>{const recorded=recordedStrokeCount(h),penalties=penaltyStrokeCount(h),score=calculatedHoleScore(h);return `<button class="hole-btn ${i===state.activeHole?'active':''}" data-i="${i}"><span class="hole-index">${h.number}</span><span>Par ${h.par}</span><span class="hole-score">${score?`${score} Schläge${penalties?` (${penalties} Strafe)`:''}`:`${recorded} erfasst`}</span></button>`}).join('');
 el.querySelectorAll('button').forEach(b=>b.onclick=()=>{state.activeHole=Number(b.dataset.i);save();renderRound()});
 const score=state.holes.reduce((a,h)=>a+calculatedHoleScore(h),0),scoredHoles=state.holes.filter(h=>calculatedHoleScore(h)>0),par=scoredHoles.reduce((a,h)=>a+Number(h.par),0),shots=state.holes.reduce((a,h)=>a+recordedStrokeCount(h),0),penalties=state.holes.reduce((a,h)=>a+penaltyStrokeCount(h),0);
 $('#roundTotals').innerHTML=`<div class="total-line"><span>Bahnen</span><strong>${state.holes.length}</strong></div><div class="total-line"><span>Erfasste Schläge</span><strong>${shots}</strong></div><div class="total-line"><span>Strafschläge</span><strong>${penalties}</strong></div><div class="total-line"><span>Score</span><strong>${score||'–'} ${score&&par?`(${score-par>=0?'+':''}${score-par})`:''}</strong></div>`;
 const scoreField=$('#holeScore');if(scoreField)scoreField.value=calculatedHoleScore(activeHole())||'';
}
function configureCard(card,shot){
 const type=card.querySelector('[data-field=type]'), subtype=card.querySelector('[data-field=subtype]'), club=card.querySelector('[data-field=club]'), contact=card.querySelector('[data-field=contact]'), direction=card.querySelector('[data-field=direction]'), distance=card.querySelector('[data-field=distance]'), lie=card.querySelector('[data-field=lie]'), puttStart=card.querySelector('[data-field=puttStart]'), rest=card.querySelector('[data-field=rest]'), penalties=card.querySelector('[data-field=penalties]'), reason=card.querySelector('[data-field=penaltyReason]');
 fill(type,OPTIONS.types,shot.type);fill(club,OPTIONS.clubs,shot.club);fill(penalties,OPTIONS.penalties,shot.penalties,'0');fill(reason,OPTIONS.penaltyReasons,shot.penaltyReason);
 const isPutt=shot.type==='Putt', isShort=shot.type==='Kurzspiel', hasSubtype=OPTIONS.subtypes[shot.type];card.querySelector('.subtype-field').classList.toggle('hidden',!hasSubtype);if(hasSubtype)fill(subtype,hasSubtype,shot.subtype);
 card.querySelector('.contact-field').classList.toggle('hidden',isPutt);if(!isPutt)fill(contact,shot.type==='Bunkerschlag'?OPTIONS.bunkerContact:OPTIONS.contact,shot.contact);
 card.querySelector('.putt-distance-field').classList.toggle('hidden',!isPutt);if(isPutt)fill(puttStart,OPTIONS.puttStart,shot.puttStart);
 fill(direction,isPutt?OPTIONS.puttDirection:OPTIONS.direction,shot.direction);fill(distance,OPTIONS.distance,shot.distance);card.querySelector('.distance-label').textContent=isPutt?'Tempo / Länge':'Distanz';
 card.querySelector('.lie-field').classList.toggle('hidden',isPutt);if(!isPutt)fill(lie,OPTIONS.lies[shot.type]||OPTIONS.lies.Transportschlag,shot.lie);
 card.querySelector('.rest-field').classList.toggle('hidden',!(isPutt||isShort));if(isPutt||isShort)fill(rest,isPutt?OPTIONS.rest:OPTIONS.shortRest,shot.rest);
 card.querySelector('.penalty-reason').classList.toggle('hidden',Number(shot.penalties||0)===0);
}
function renderShots(){const hole=activeHole(),list=$('#shotList');list.innerHTML='';hole.shots.forEach((shot,i)=>{const card=$('#shotTemplate').content.firstElementChild.cloneNode(true);card.dataset.id=shot.id;card.querySelector('.shot-number').textContent=`Schlag ${i+1}`;configureCard(card,shot);card.querySelectorAll('[data-field]').forEach(input=>input.onchange=e=>{shot[e.target.dataset.field]=e.target.value;if(e.target.dataset.field==='type'){shot.subtype='';shot.contact='';shot.direction='';shot.distance='';shot.lie='';shot.rest='';shot.puttStart='';if(shot.type==='Putt')shot.club='Putter';}if(e.target.dataset.field==='penalties'&&e.target.value==='0')shot.penaltyReason='';syncHoleScore(hole);save();renderShots();renderHoles()});card.querySelector('.delete-shot').onclick=()=>{hole.shots=hole.shots.filter(s=>s.id!==shot.id);syncHoleScore(hole);save();renderRound()};list.append(card)});}
function renderRound(){renderHoles();const h=activeHole(),recorded=recordedStrokeCount(h);$('#holeKicker').textContent=`Bahn ${h.number}`;$('#holeTitle').textContent=`${recorded} Schlag${recorded===1?'':'e'} erfasst`;$('#holePar').value=h.par;$('#holeScore').value=calculatedHoleScore(h)||'';renderShots()}
$('#holePar').onchange=e=>{activeHole().par=Number(e.target.value);save();renderHoles()};$('#addShotBtn').onclick=()=>{const h=activeHole();h.shots.push(newShot(h.shots.length?'Transportschlag':'Abschlag'));save();renderRound()};$('#addHoleBtn').onclick=()=>{if(state.holes.length>=18)return toast('Maximal 18 Bahnen.');state.holes.push(newHole(state.holes.length+1));state.activeHole=state.holes.length-1;save();renderRound()};
$('#newRoundBtn').onclick=()=>{if(confirm('Neue Runde starten? Gespeicherte Analysen im Archiv bleiben erhalten.')){const archive=state.archive||[];state=initialState();state.archive=archive;analysis=null;save();renderAll();toast('Neue Runde gestartet.')}};$('#sampleBtn').onclick=()=>{const archive=state.archive||[];state=sampleState();state.archive=archive;state.currentRoundId=null;analysis=null;save();renderAll();toast('Beispieldaten geladen.')};$('#analyseBtn').onclick=()=>{analysis=analyse(state);state.lastAnalysis=analysis;archiveCurrentAnalysis(analysis);save();renderAnalysis();setView('analysis');toast('Analyse dauerhaft im Archiv gespeichert.')};
function metric(label,value,detail=''){return `<div class="metric"><strong>${value}</strong><span>${label}${detail?` · ${detail}`:''}</span></div>`}
function empty(t='Noch keine ausreichenden Daten.') {return `<div class="empty-state">${t}</div>`}

// APS V3: Ergebniswirkung vor Technik.
// Ein technischer Fehler ist nur dann eine Trainingspriorität, wenn er
// wiederholt auftritt UND entweder die Spielbarkeit/Score-Auswirkung mindert
// oder als sehr starkes Muster mit hohem zukünftigem Risiko erkennbar ist.
function apsOutcomeClass(shot){
  const result=(shot.result||"").toLowerCase();
  const lie=(shot.lie||"").toLowerCase();
  const penalty=Number(shot.penalty||shot.penalties||0) || 0;

  if(penalty>0 || result.includes("aus") || result.includes("penalty") || lie.includes("aus") || lie.includes("wasser") || lie.includes("penalty")){
    return {level:3, label:"schwer", playable:false};
  }
  if(result.includes("recovery") || lie.includes("recovery") || lie.includes("wald") || result.includes("keine verbesserung")){
    return {level:2, label:"erschwert", playable:false};
  }
  if(result.includes("bunker") || lie.includes("bunker") || lie.includes("rough") || result.includes("grün verfehlt")){
    return {level:1, label:"spielbar mit Folgeaufwand", playable:true};
  }
  return {level:0, label:"spielbar", playable:true};
}

function apsIsDirectionFault(v){
  const s=(v||"").toLowerCase();
  return ["links","rechts","fehler","grober fehler","stark links","stark rechts"].some(x=>s.includes(x));
}
function apsIsSevereDirectionFault(v){
  const s=(v||"").toLowerCase();
  return s.includes("stark") || s.includes("grober");
}
function apsIsDistanceFault(v){
  const s=(v||"").toLowerCase();
  return s.includes("zu kurz") || s.includes("zu lang") || s.includes("fehler");
}
function apsIsSevereDistanceFault(v){
  const s=(v||"").toLowerCase();
  return s.includes("viel zu") || s.includes("grober");
}
function apsIsContactFault(v){
  const s=(v||"").toLowerCase();
  return ["miss","dünn","fett"].some(x=>s.includes(x));
}

// Liefert eine Priorität 0..10 für ein beobachtetes Muster.
// outcomeRate = Anteil mit negativer Spiel-/Scorefolge.
// patternRate = Häufigkeit des technischen Musters.
// severeRate = Anteil grober Fehler.
// sampleFactor reduziert kleine Stichproben.
function apsPatternPriority({patternRate=0,outcomeRate=0,severeRate=0,n=0,directScore=0}){
  if(n<=0) return 0;
  const sampleFactor=Math.min(1, n/6);
  const consequence = Math.min(1, outcomeRate*1.25 + directScore*0.20);
  const pattern = Math.min(1, patternRate);
  const severe = Math.min(1, severeRate);
  // Konsequenz dominiert; Technik allein bleibt Hinweis, außer Muster ist sehr stark.
  let score = (consequence*6.2) + (pattern*2.0) + (severe*1.8);
  score *= (0.55 + 0.45*sampleFactor);

  // Schutz vor "technisch nicht perfekt, aber vollständig spielbar":
  // Wenn keine negative Folge vorliegt, wird ein normales Muster nicht zur Trainingspriorität.
  if(outcomeRate===0 && directScore===0 && severeRate<0.34){
    if(patternRate < 0.67) return Math.min(score, 2.4);
    score = Math.min(score, 4.2); // starkes Muster = beobachten, aber nicht automatisch Top-Priorität
  }
  return score;
}

function renderAnalysis(){analysis=analyse(state);const a=analysis;$('#analysisHeadline').textContent=a.priorities[0]?`Größter Trainingshebel: ${a.priorities[0].name}`:'Noch keine klare Schwäche erkennbar';$('#analysisSubline').textContent=`${a.shots.length} Schläge · ${a.penalties} Strafschläge · ${a.threePutts} Bahnen mit Dreiputt`;
 $('#summaryHero').innerHTML=a.priorities[0]?`<span class="kicker" style="color:var(--lime)">APS Coach Summary</span><h2>${a.priorities[0].name} hat aktuell die höchste Trainingspriorität.</h2><p><strong>Ursache:</strong> ${a.priorities[0].cause}<br><strong>Trainingsziel:</strong> ${a.priorities[0].goal}</p>`:empty('Erfasse weitere Schläge, damit APS belastbare Muster erkennt.');
 $('#metricGrid').innerHTML=metric('Erfasste Schläge',a.shots.length)+metric('Strafschläge',a.penalties)+metric('Dreiputt-Bahnen',a.threePutts)+metric('Score',a.score||'–',a.scoreToPar!==null?`${a.scoreToPar>=0?'+':''}${a.scoreToPar}`:'');
 $('#priorityList').innerHTML=a.priorities.length?a.priorities.map((p,i)=>`<div class="priority"><h3><span class="rank">${i+1}</span>${p.name}</h3><p class="evidence">${observationLabel(p.count)} bei ${p.total} relevanten Schlägen.</p><p><strong>Ursache:</strong> ${p.cause}</p><p><strong>Training:</strong> ${p.training}</p><p><strong>Messziel:</strong> ${p.goal}</p></div>`).join(''):empty();
 $('#strategyList').innerHTML=a.priorities.length?a.priorities.map(p=>`<div class="priority"><h3>${p.name}</h3><p>${p.strategy}</p></div>`).join(''):empty();
 $('#pillarGrid').innerHTML=a.pillars.map(p=>{const band=performanceBand(p.score,p.sample,p.reliable),score=p.score===null?'–':`${Math.round(p.score)} / 100`,width=p.score===null?0:p.score,status=`${band.label}${band.provisional?' · vorläufig':''}`;return `<div class="pillar pillar-${band.key}"><div class="pillar-head"><strong>${p.name}</strong><span class="pillar-score"><small>Index</small>${score}</span></div><div class="pillar-status status-${band.key}">${status}</div><div class="bar ${p.score===null?'bar-empty':''}" role="img" aria-label="${p.name}: ${score}, ${status}"><span style="width:${width}%"></span></div><p><strong>Fehlerquote:</strong> ${p.sample?`${p.errors} von ${p.sample} (${p.errorRate} %)`: 'Keine bewertbaren Daten'}</p>${p.details?`<p><strong>Kennzahlen:</strong> ${p.details}</p>`:''}<p><strong>Fokus:</strong> ${p.focus}</p></div>`}).join('');
 $('#clubTable').innerHTML=a.clubs.length?`<table class="data-table"><thead><tr><th>Schläger</th><th>Schläge</th><th>Auffällig</th><th>Strafe</th><th>Zuverlässigkeit</th></tr></thead><tbody>${a.clubs.map(c=>`<tr><td><strong>${c.club}</strong></td><td>${c.shots}</td><td>${c.bad}</td><td>${c.penalties}</td><td><span class="tag">${c.reliability}%</span></td></tr>`).join('')}</tbody></table>`:empty();
 $('#patternList').innerHTML=a.patterns.length?a.patterns.map(([n,c])=>`<div class="priority"><h3>${n}</h3><p>${c} beobachtete${c===1?'r':'e'} Fehler.</p></div>`).join(''):empty('Noch keine wiederkehrenden Links-, Rechts-, Kurz- oder Langmuster.');renderTraining();renderProfile();}
function renderTraining(){const plan=trainingFrom(analysis||analyse(state));$('#trainingPlan').innerHTML=plan.map((x,i)=>`<article class="training-card"><div class="training-card-top"><div class="training-card-title"><span class="kicker">Priorität ${i+1}</span><h2>${x.title}</h2></div><div class="minutes"><strong>${x.minutes}</strong><span>Min.</span></div></div><div class="training-card-content"><div class="training-block"><span>Warum</span><p>${x.why}</p></div><div class="training-block"><span>Übung</span><p>${x.exercise}</p></div><div class="training-block training-goal"><span>Messziel</span><p>${x.goal}</p></div></div></article>`).join('');renderPrintReport(plan);renderOffers()}
function archiveScore(r){return `${r.score||'–'}${r.score&&r.par?` (${r.score-r.par>=0?'+':''}${r.score-r.par})`:''}`;}
function loadArchivedRound(id){
 const item=(state.archive||[]).find(r=>r.id===id);if(!item||!item.snapshot)return toast('Dieser ältere Archiveintrag enthält noch keine ladbaren Rundendaten.');
 const archive=state.archive||[],snap=normalizeState(clone(item.snapshot));snap.archive=archive;snap.currentRoundId=item.id;state=snap;analysis=item.analysis||state.lastAnalysis||analyse(state);state.lastAnalysis=analysis;save();renderAll();setView('profile');toast(`Runde von ${item.player||'Spieler'} geladen.`);
}
function deleteArchivedRound(id){
 const item=(state.archive||[]).find(r=>r.id===id);if(!item)return;if(!confirm(`Gespeicherte Analyse von ${item.player||'Spieler'} am ${formatDateDE(item.date)} wirklich löschen?`))return;
 state.archive=(state.archive||[]).filter(r=>r.id!==id);if(state.currentRoundId===id)state.currentRoundId=null;save();renderProfile();toast('Gespeicherte Analyse gelöscht.');
}
function renderProfile(){
 const a=analysis||analyse(state);$('#profileName').textContent=state.player.name?`${state.player.name} · Player Profile`:'APS Player Profile';$('#profileMeta').textContent=[state.player.handicap&&`HCP ${state.player.handicap}`,state.player.course,state.player.date].filter(Boolean).join(' · ')||'Noch keine Spielerdaten.';$('#profileMetrics').innerHTML=metric('Runden im Archiv',(state.archive||[]).length)+metric('Aktuelle Schläge',a.shots.length)+metric('Aktueller Score',a.score||'–')+metric('Strafschläge',a.penalties);const strengths=a.pillars.filter(p=>p.reliable&&p.score>=85).sort((x,y)=>y.score-x.score);$('#strengthList').innerHTML=strengths.length?strengths.map(s=>`<div class="priority"><h3>${s.name}</h3><p>${s.summary}</p></div>`).join(''):empty('Noch keine Stärke ist ausreichend belegt.');$('#weaknessList').innerHTML=a.priorities.length?a.priorities.map(p=>`<div class="priority"><h3>${p.name}</h3><p>${observationLabel(p.count)}. ${p.cause}</p></div>`).join(''):empty();
 const ar=state.archive||[];$('#roundArchive').innerHTML=ar.length?`<div class="archive-list">${ar.map(r=>`<article class="archive-row ${r.id===state.currentRoundId?'active':''}"><div class="archive-main"><strong>${escapeHtml(r.player||'Unbenannter Spieler')}</strong><span>${formatDateDE(r.date)} · ${escapeHtml(r.course||'–')}</span><small>Score ${archiveScore(r)} · ${Number(r.penalties||0)} Strafe(n) · ${escapeHtml(r.top||'Keine Priorität')}</small></div><div class="archive-actions">${r.snapshot?`<button class="mini-btn archive-load" data-id="${r.id}">Laden</button>`:`<span class="tag">Altbestand</span>`}<button class="mini-btn archive-delete danger" data-id="${r.id}">Löschen</button></div></article>`).join('')}</div>`:empty('Noch keine abgeschlossene Analyse im Archiv.');
 $$('#roundArchive .archive-load').forEach(b=>b.onclick=()=>loadArchivedRound(b.dataset.id));$$('#roundArchive .archive-delete').forEach(b=>b.onclick=()=>deleteArchivedRound(b.dataset.id));
}
function exportFile(){return new File([JSON.stringify(state,null,2)],`APS_3_0_${filePart(state.player.name||'Archiv')}_${new Date().toISOString().slice(0,10)}.json`,{type:'application/json'});}
function downloadExport(file=exportFile()){const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
$('#exportBtn').onclick=()=>{downloadExport();toast('APS-Datenexport gespeichert.')};
$('#emailExportBtn').onclick=async()=>{
 const file=exportFile(),shareData={title:'APS Datenexport',text:'APS Datenexport zur Übertragung auf den PC. Datei dort in APS über „Importieren“ einlesen.',files:[file]};
 try{
   if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share(shareData);toast('Export zum Teilen geöffnet. In der Auswahl Mail wählen.');return;}
 }catch(err){if(err?.name==='AbortError')return;}
 downloadExport(file);const subject=encodeURIComponent('APS Datenexport');const body=encodeURIComponent(`Der APS-Datenexport wurde als Datei ${file.name} heruntergeladen. Bitte diese JSON-Datei an die E-Mail anhängen und auf dem PC in APS über „Importieren“ einlesen.`);location.href=`mailto:?subject=${subject}&body=${body}`;toast('Datei gespeichert; Mail-Entwurf geöffnet. JSON-Datei bitte anhängen.');
};
$('#importInput').onchange=async e=>{try{const imported=normalizeState(JSON.parse(await e.target.files[0].text()));state=imported;analysis=state.lastAnalysis||null;save();renderAll();toast('Daten inklusive Archiv importiert.')}catch{toast('Import fehlgeschlagen.')}finally{e.target.value=''}};
function renderAll(){renderMeta();renderRound();renderAnalysis()}renderAll();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js');


function apsReweightRecommendations(base, shots){
  if(!Array.isArray(base)) return base || [];
  const valid=(shots||[]).filter(s=>s && (s.phase||s.shotType||s.type));
  const enriched=base.map(rec=>{
    const title=(rec.title||"").toLowerCase();
    let relevant=valid.filter(s=>{
      const p=(s.phase||s.shotType||s.type||"").toLowerCase();
      const club=(s.club||"").toLowerCase();
      if(title.includes("abschlag")) return p.includes("abschlag") || p.includes("tee");
      if(title.includes("putt")) return p.includes("putt");
      if(title.includes("kurzspiel") || title.includes("kurzes spiel")) return p.includes("kurz") || p.includes("chip") || p.includes("pitch") || p.includes("lob");
      if(title.includes("bunker")) return p.includes("bunker");
      if(title.includes("transport") || title.includes("langes spiel")) return p.includes("transport") || p.includes("lang");
      if(title.includes("recovery")) return p.includes("recovery");
      if(club && title.includes(club)) return true;
      return false;
    });
    if(!relevant.length) return {...rec, apsPriority:Number(rec.score||rec.priority||0)};

    let faults=0,severe=0,negative=0,directScore=0;
    relevant.forEach(s=>{
      const out=apsOutcomeClass(s);
      if(out.level>0) negative++;
      directScore += Number(s.penalty||s.penalties||0) || 0;
      const dir=apsIsDirectionFault(s.direction);
      const dist=apsIsDistanceFault(s.distance);
      const cont=apsIsContactFault(s.contact);
      if(title.includes("richtung")){ if(dir) faults++; if(apsIsSevereDirectionFault(s.direction)) severe++; }
      else if(title.includes("distanz") || title.includes("lag")){ if(dist) faults++; if(apsIsSevereDistanceFault(s.distance)) severe++; }
      else if(title.includes("ballkontakt")){ if(cont) faults++; if((s.contact||"").toLowerCase().includes("miss")) severe++; }
      else { if(dir||dist||cont||out.level>0) faults++; if(out.level>=2) severe++; }
    });

    const n=relevant.length;
    const p=apsPatternPriority({
      patternRate:faults/n,
      outcomeRate:negative/n,
      severeRate:severe/n,
      n,
      directScore
    });
    return {...rec, apsPriority:p, apsRelevant:n, apsNegative:negative};
  });

  // echte Coaching-Prioritäten benötigen einen Mindestwert.
  // Darunter bleibt der Befund als Hinweis, nicht als Top-Trainingsthema.
  return enriched
    .filter(r => (r.apsPriority ?? 0) >= 3.2)
    .sort((a,b)=>(b.apsPriority||0)-(a.apsPriority||0))
    .slice(0,3);
}

