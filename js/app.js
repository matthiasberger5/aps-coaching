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
const initialState = () => ({version:'3.0',player:{name:'',handicap:'',date:new Date().toISOString().slice(0,10),course:'',note:''},holes:[newHole(1)],activeHole:0,lastAnalysis:null,archive:[]});

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
function makeIssue({name,pillar,shots,evaluate,cause,training,strategy,goal,details={}}){
  const evaluated=shots.map(s=>({shot:s,...evaluate(s)}));
  const hits=evaluated.filter(x=>(x.severity||0)+(x.impact||0)>0.25);
  const severity=hits.reduce((a,x)=>a+(x.severity||0),0);
  const impact=hits.reduce((a,x)=>a+(x.impact||0),0)+(details.extraImpact||0);
  const total=shots.length,count=hits.length,rate=pct(count,total),avgSeverity=total?severity/total:0;
  const confidence=Math.min(1,total/3);
  const priority=impact*2.8+(avgSeverity*4+rate/12)*confidence+Math.min(4,Math.max(0,count-1))*0.7;
  return {name,pillar,count,total,rate,severity,impact,avgSeverity,priority,cause,training,strategy,goal,evidence:hits.map(x=>x.shot),...details};
}

function teeIssue(shots){
  const sig=dominantSignal(shots),bias=directionBias(shots);
  const unplayable=shots.filter(s=>Number(s.penalties||0)>0||['Recovery-Lage','Penalty Area','Aus','Ball kaum bewegt'].includes(s.lie)).length;
  const severeOutcome=shots.some(s=>Number(s.penalties||0)>0||['Penalty Area','Aus'].includes(s.lie));
  let name='Abschlag – Kontrolle';
  let cause='Die Abschläge verlieren durch technische Abweichungen an Spielbarkeit.';
  let training='10-Ball-Korridor: mit dem bevorzugten Abschlagschläger einen breiten Zielkorridor treffen und jeden unspielbaren Ball doppelt werten.';
  let strategy='Den Schläger und die Ziellinie wählen, mit denen der Ball am häufigsten spielbar bleibt.';
  let goal='Mindestens 8 von 10 Abschläge spielbar, höchstens ein starker Seitenfehler.';
  if(severeOutcome||unplayable>=2){
    name='Abschlag – Ball im Spiel halten';
    cause=`${unplayable} von ${shots.length} Abschlägen führten zu einer unspielbaren Lage oder einem Strafschlag.`;
  }else if(sig.key==='direction'){
    name='Abschlag – Richtungskontrolle';
    cause=`Die häufigste Auffälligkeit ist die Start- und Seitenkontrolle${bias?` mit Tendenz nach ${bias}`:''}.`;
    training=`Startlinien-Korridor mit zwei Zielmarken trainieren${bias?` und die ${bias==='links'?'linke':'rechte'} Korridorgrenze als Ausschlussseite behandeln`:''}.`;
  }else if(sig.key==='contact'){
    name='Abschlag – Treffmoment';
    cause='Der Ballkontakt ist der häufigste technische Verlust am Abschlag.';
    training='Treffbild am Schlägerblatt markieren und 3 Serien à 10 Bälle mit gleichbleibender Tee-Höhe schlagen.';
    goal='Mindestens 8 von 10 Treffer solide oder sauber und spielbar.';
  }else if(sig.key==='distance'){
    name='Abschlag – Längenkontrolle';
    cause='Die Abschläge verfehlen wiederholt das geplante Längenfenster.';
    training='Carry-Fenster mit drei kontrollierten Schwungintensitäten trainieren und nur stabile Varianten in den Spielplan übernehmen.';
  }
  return makeIssue({name,pillar:'Abschlagleistung',shots,evaluate:s=>({severity:contactSeverity(s.contact)+directionSeverity(s.direction)+distanceSeverity(s.distance),impact:nonPuttOutcomeImpact(s)}),cause,training,strategy,goal,details:{unplayable,dominant:sig.key}});
}

function longGameIssue(shots){
  const sig=dominantSignal(shots),bias=directionBias(shots);
  const correlated=shots.filter(s=>contactSeverity(s.contact)>0&&distanceSeverity(s.distance)>0).length;
  let name='Langes Spiel – Kontrolle',cause='Im langen Spiel treten wiederkehrende technische Abweichungen auf.',training='Zielkorridor und Carry-Fenster mit den am häufigsten gespielten Schlägern trainieren.',goal='Mindestens 7 von 10 Schläge mit solidem Kontakt im Ziel- und Distanzfenster.';
  if(correlated>=2&&sig.sums.contact>0&&sig.sums.distance>0){
    name='Langes Spiel – Treffmoment & Carry';
    cause=`Bei ${correlated} Schlägen treten Kontakt- und Längenfehler gemeinsam auf; die Längenabweichung ist daher wahrscheinlich eine Folge des Treffmoments.`;
    training='Bodenlinie-/Treffmoment-Drill: erst Kontaktqualität stabilisieren, danach dieselben Bälle in ein definiertes Carry-Fenster schlagen.';
  }else if(sig.key==='contact'){
    name='Langes Spiel – Ballkontakt';cause='Fett-, Dünn- oder Misskontakte sind das stärkste wiederkehrende Muster.';
    training='Bodenreferenz mit Linie oder Handtuch trainieren: 3 Serien à 10 Bälle, Trefferpunkt und Bodenberührung dokumentieren.';
    goal='Mindestens 8 von 10 Bälle solide oder sauber treffen.';
  }else if(sig.key==='distance'){
    name='Langes Spiel – Distanzkontrolle';cause='Zu kurze oder zu lange Schläge verfehlen wiederholt das geplante Carry-Fenster.';
    training='Carry-Leiter mit drei Zielentfernungen und dem passenden Schläger; erst bei 3 Treffern im Fenster zur nächsten Distanz wechseln.';
    goal='Mindestens 7 von 10 Schläge im definierten Carry-Fenster.';
  }else if(sig.key==='direction'){
    name='Langes Spiel – Richtungskontrolle';cause=`Die Start- und Seitenkontrolle ist das häufigste Muster${bias?` mit Tendenz nach ${bias}`:''}.`;
    training='Startlinien-Gate plus Zielkorridor: Ballstart und Endlage getrennt bewerten.';
    goal='Mindestens 7 von 10 Bälle im Zielkorridor.';
  }
  return makeIssue({name,pillar:'Langes Spiel',shots,evaluate:s=>({severity:contactSeverity(s.contact)+directionSeverity(s.direction)+distanceSeverity(s.distance),impact:nonPuttOutcomeImpact(s)}),cause,training,strategy:'Bei Druck den Schläger mit der höchsten dokumentierten Zuverlässigkeit und die größte sichere Zielzone wählen.',goal,details:{dominant:sig.key,correlated}});
}

function shortGameIssue(shots){
  const sig=dominantSignal(shots);
  const outsideTwo=shots.filter(s=>['2–5 m','Über 5 m'].includes(s.rest)).length;
  const contactErrors=shots.filter(s=>contactSeverity(s.contact)>0).length;
  const cause=outsideTwo?`${outsideTwo} von ${shots.length} Kurzspielschlägen ließen mehr als 2 m Restdistanz.`:contactErrors?`${contactErrors} Kurzspielschläge verloren durch den Ballkontakt an Kontrolle.`:'Kontakt, Längenkontrolle oder Ergebniszone sind im Kurzspiel auffällig.';
  const training=sig.key==='contact'?'Landepunkt-Drill aus drei Lagen: erst sauberen Kontakt werten, danach die Endlage innerhalb von 2 m.':'Landepunkt-Leiter: drei Landefelder anspielen und jeden Ball nach Restdistanz statt nur nach Gefühl bewerten.';
  return makeIssue({name:'Kurzspiel – Nähe zum Loch',pillar:'Kurzspiel',shots,evaluate:s=>({severity:contactSeverity(s.contact)+distanceSeverity(s.distance)+directionSeverity(s.direction)*0.5,impact:restValue(s.rest)+nonPuttOutcomeImpact(s)}),cause,training,strategy:'Den Schlag mit der größten Fehlertoleranz und einem klaren Landepunkt wählen.',goal:'Mindestens 8 von 10 Bälle innerhalb von 2 m.',details:{outsideTwo,dominant:sig.key}});
}

function bunkerIssue(shots){
  const failed=shots.filter(s=>['Im selben Bunker','Anderer Bunker','Recovery-Lage','Penalty Area','Aus'].includes(s.lie)||s.contact==='Ball kaum bewegt').length;
  const cause=failed?`${failed} von ${shots.length} Bunkerschlägen beendeten die Situation nicht kontrolliert.`:'Kontakt oder Längenkontrolle im Bunker ist wiederholt auffällig.';
  return makeIssue({name:'Bunker – sicher heraus und kontrolliert',pillar:'Bunkerspiel',shots,evaluate:s=>({severity:contactSeverity(s.contact)+distanceSeverity(s.distance)+directionSeverity(s.direction)*0.5,impact:nonPuttOutcomeImpact(s)}),cause,training:'Linien-Drill im Sand: Eintrittspunkt markieren, zuerst 8 von 10 Bälle sicher herausspielen, danach Distanzzonen ergänzen.',strategy:'Bei schwieriger Lage zuerst den sicheren Ausstieg priorisieren und Fahnenrisiko reduzieren.',goal:'Mindestens 8 von 10 Bälle sicher heraus, 6 davon auf Grün oder Vorgrün.',details:{failed}});
}

function puttingIssue(putts,threePutts){
  const shortMisses=putts.filter(s=>['Bis 1 m','1–2 m'].includes(s.puttStart)&&filled(s.rest)&&s.rest!=='Eingelocht').length;
  const lagErrors=putts.filter(s=>!['Bis 1 m','1–2 m'].includes(s.puttStart)&&(distanceSeverity(s.distance)>0||puttRestImpact(s)>0.5)).length;
  let name='Putten – Distanzkontrolle',cause=`${lagErrors} längere Putts verfehlten das passende Tempo- oder Restdistanzfenster${threePutts?`; daraus entstanden ${threePutts} Dreiputt-Bahnen`:''}.`,training='Distanzleiter aus 5, 8, 10 und 12 m: Punkte nur für Bälle innerhalb von 1 m hinter oder neben dem Loch.',strategy='Bei langen Putts Tempo vor perfekter Linie priorisieren.',goal='Mindestens 8 von 10 Lag-Putts innerhalb von 1 m.';
  if(shortMisses>lagErrors){
    name='Putten – kurze Putts';cause=`${shortMisses} Putts aus bis zu 2 m wurden nicht gelocht.`;
    training='Startlinien-Gate aus 1 m und 1,5 m: 20 Putts pro Distanz, Serienquote dokumentieren.';
    strategy='Bei kurzen Putts klare Startlinie festlegen und das Ergebnis nicht durch zusätzliche Sicherheitsbewegungen verändern.';
    goal='Mindestens 17 von 20 Putts aus 1 m und 14 von 20 aus 1,5 m lochen.';
  }else if(threePutts>=2){
    name='Putten – Dreiputts vermeiden';
  }
  return makeIssue({name,pillar:'Putten',shots:putts,evaluate:s=>({severity:directionSeverity(s.direction)+distanceSeverity(s.distance),impact:puttRestImpact(s)}),cause,training,strategy,goal,details:{shortMisses,lagErrors,extraImpact:threePutts*3}});
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
  const score=Math.max(0,Math.round(100-Math.min(100,issue.rate*0.55+issue.avgSeverity*10+issue.impact*4)));
  return {name,score,sample:issue.total,errors:issue.count,errorRate:issue.rate,reliable:issue.total>=3,summary:`${issue.count} von ${issue.total} Beobachtungen waren auffällig${issue.total>=3?'':'; Stichprobe noch klein'}.`,focus,details};
}

function analyse(state){
  const shots=allShots(state).filter(isRecordedShot),nonPutts=shots.filter(s=>s.type!=='Putt'),putts=shots.filter(s=>s.type==='Putt');
  const penalties=shots.reduce((a,s)=>a+Number(s.penalties||0),0);
  const tee=shots.filter(s=>s.type==='Abschlag'),longGame=shots.filter(s=>['Transportschlag','Recovery'].includes(s.type)),shortGame=shots.filter(s=>s.type==='Kurzspiel'),bunker=shots.filter(s=>s.type==='Bunkerschlag');
  const threePutts=state.holes.filter(h=>h.shots.filter(s=>s.type==='Putt'&&isRecordedShot(s)).length>=3).length;
  const issues=[tee.length&&teeIssue(tee),longGame.length&&longGameIssue(longGame),shortGame.length&&shortGameIssue(shortGame),bunker.length&&bunkerIssue(bunker),putts.length&&puttingIssue(putts,threePutts)].filter(Boolean).sort((a,b)=>b.priority-a.priority);
  const priorities=issues.filter(i=>i.count&&(i.total>=2||i.impact>=3||i.severity>=3)).slice(0,3);
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
  const pillars=[contactPillar,directionPillar,distancePillar,phasePillar('Abschlagleistung',issues.find(i=>i.pillar==='Abschlagleistung'),'Ball im Spiel halten und Ausschlussseite kontrollieren.'),phasePillar('Kurzspiel',issues.find(i=>i.pillar==='Kurzspiel'),'Landepunkt und Restdistanz trainieren.'),phasePillar('Putten',issues.find(i=>i.pillar==='Putten'),'Kurze Putts und Tempokontrolle getrennt messen.',puttingDetails)];
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
function load(){try{const current=JSON.parse(localStorage.getItem(KEY));if(current)return current;for(const key of LEGACY_KEYS){const legacy=JSON.parse(localStorage.getItem(key));if(legacy){legacy.version='3.0';localStorage.setItem(KEY,JSON.stringify(legacy));return legacy;}}return initialState()}catch{return initialState()}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));$('#saveState').textContent='Lokal gespeichert';}
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
 renderPrintReport();document.body.dataset.printView=view;
 const oldTitle=document.title,kind=view==='customer'?'Kundenbericht':view==='training'?'Trainingsplan':view==='analysis'?'Analyse':'Profil',date=state.player?.date||new Date().toISOString().slice(0,10);
 document.title=`APS_${kind}_${filePart(state.player?.name)}_${date}`;
 requestAnimationFrame(()=>setTimeout(()=>{window.print();document.title=oldTitle;},60));
}
window.addEventListener('afterprint',()=>{delete document.body.dataset.printView;});

function syncMeta(){state.player={name:$('#playerName').value,handicap:$('#handicap').value,date:$('#roundDate').value,course:$('#course').value,note:$('#roundNote').value};save()}
['playerName','handicap','roundDate','course','roundNote'].forEach(id=>$('#'+id).addEventListener('change',syncMeta));
function renderMeta(){$('#playerName').value=state.player.name||'';$('#handicap').value=state.player.handicap||'';$('#roundDate').value=state.player.date||'';$('#course').value=state.player.course||'';$('#roundNote').value=state.player.note||''}
function activeHole(){return state.holes[state.activeHole]}
function renderHoles(){const el=$('#holeList');el.innerHTML=state.holes.map((h,i)=>`<button class="hole-btn ${i===state.activeHole?'active':''}" data-i="${i}"><span class="hole-index">${h.number}</span><span>Par ${h.par}</span><span class="hole-score">${h.score?`${h.score} Schläge`:`${h.shots.length} erfasst`}</span></button>`).join('');el.querySelectorAll('button').forEach(b=>b.onclick=()=>{state.activeHole=Number(b.dataset.i);save();renderRound()});const score=state.holes.reduce((a,h)=>a+(Number(h.score)||0),0),par=state.holes.filter(h=>h.score).reduce((a,h)=>a+Number(h.par),0),shots=state.holes.reduce((a,h)=>a+h.shots.length,0);$('#roundTotals').innerHTML=`<div class="total-line"><span>Bahnen</span><strong>${state.holes.length}</strong></div><div class="total-line"><span>Erfasste Schläge</span><strong>${shots}</strong></div><div class="total-line"><span>Score</span><strong>${score||'–'} ${score&&par?`(${score-par>=0?'+':''}${score-par})`:''}</strong></div>`}
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
function renderShots(){const hole=activeHole(),list=$('#shotList');list.innerHTML='';hole.shots.forEach((shot,i)=>{const card=$('#shotTemplate').content.firstElementChild.cloneNode(true);card.dataset.id=shot.id;card.querySelector('.shot-number').textContent=`Schlag ${i+1}`;configureCard(card,shot);card.querySelectorAll('[data-field]').forEach(input=>input.onchange=e=>{shot[e.target.dataset.field]=e.target.value;if(e.target.dataset.field==='type'){shot.subtype='';shot.contact='';shot.direction='';shot.distance='';shot.lie='';shot.rest='';shot.puttStart='';if(shot.type==='Putt')shot.club='Putter';}if(e.target.dataset.field==='penalties'&&e.target.value==='0')shot.penaltyReason='';save();renderShots();renderHoles()});card.querySelector('.delete-shot').onclick=()=>{hole.shots=hole.shots.filter(s=>s.id!==shot.id);save();renderRound()};list.append(card)});}
function renderRound(){renderHoles();const h=activeHole();$('#holeKicker').textContent=`Bahn ${h.number}`;$('#holeTitle').textContent=`${h.shots.length} Schlag${h.shots.length===1?'':'e'} erfasst`;$('#holePar').value=h.par;$('#holeScore').value=h.score;renderShots()}
$('#holePar').onchange=e=>{activeHole().par=Number(e.target.value);save();renderHoles()};$('#holeScore').onchange=e=>{activeHole().score=e.target.value;save();renderHoles()};$('#addShotBtn').onclick=()=>{const h=activeHole();h.shots.push(newShot(h.shots.length?'Transportschlag':'Abschlag'));save();renderRound()};$('#addHoleBtn').onclick=()=>{if(state.holes.length>=18)return toast('Maximal 18 Bahnen.');state.holes.push(newHole(state.holes.length+1));state.activeHole=state.holes.length-1;save();renderRound()};
$('#newRoundBtn').onclick=()=>{if(confirm('Aktuelle Runde zurücksetzen?')){state=initialState();save();renderAll();toast('Neue Runde gestartet.')}};$('#sampleBtn').onclick=()=>{state=sampleState();save();renderAll();toast('Beispieldaten geladen.')};$('#analyseBtn').onclick=()=>{analysis=analyse(state);state.lastAnalysis=analysis;state.archive=[{date:state.player.date,course:state.player.course,score:analysis.score,par:analysis.par,penalties:analysis.penalties,top:analysis.priorities[0]?.name||'Keine',player:state.player.name},...(state.archive||[])].slice(0,20);save();renderAnalysis();setView('analysis')};
function metric(label,value,detail=''){return `<div class="metric"><strong>${value}</strong><span>${label}${detail?` · ${detail}`:''}</span></div>`}
function empty(t='Noch keine ausreichenden Daten.') {return `<div class="empty-state">${t}</div>`}
function renderAnalysis(){analysis=analyse(state);const a=analysis;$('#analysisHeadline').textContent=a.priorities[0]?`Größter Trainingshebel: ${a.priorities[0].name}`:'Noch keine klare Schwäche erkennbar';$('#analysisSubline').textContent=`${a.shots.length} Schläge · ${a.penalties} Strafschläge · ${a.threePutts} Bahnen mit Dreiputt`;
 $('#summaryHero').innerHTML=a.priorities[0]?`<span class="kicker" style="color:var(--lime)">APS Coach Summary</span><h2>${a.priorities[0].name} hat aktuell die höchste Trainingspriorität.</h2><p><strong>Ursache:</strong> ${a.priorities[0].cause}<br><strong>Trainingsziel:</strong> ${a.priorities[0].goal}</p>`:empty('Erfasse weitere Schläge, damit APS belastbare Muster erkennt.');
 $('#metricGrid').innerHTML=metric('Erfasste Schläge',a.shots.length)+metric('Strafschläge',a.penalties)+metric('Dreiputt-Bahnen',a.threePutts)+metric('Score',a.score||'–',a.scoreToPar!==null?`${a.scoreToPar>=0?'+':''}${a.scoreToPar}`:'');
 $('#priorityList').innerHTML=a.priorities.length?a.priorities.map((p,i)=>`<div class="priority"><h3><span class="rank">${i+1}</span>${p.name}</h3><p class="evidence">${observationLabel(p.count)} bei ${p.total} relevanten Schlägen.</p><p><strong>Ursache:</strong> ${p.cause}</p><p><strong>Training:</strong> ${p.training}</p><p><strong>Messziel:</strong> ${p.goal}</p></div>`).join(''):empty();
 $('#strategyList').innerHTML=a.priorities.length?a.priorities.map(p=>`<div class="priority"><h3>${p.name}</h3><p>${p.strategy}</p></div>`).join(''):empty();
 $('#pillarGrid').innerHTML=a.pillars.map(p=>{const band=performanceBand(p.score,p.sample,p.reliable),score=p.score===null?'–':`${Math.round(p.score)} / 100`,width=p.score===null?0:p.score,status=`${band.label}${band.provisional?' · vorläufig':''}`;return `<div class="pillar pillar-${band.key}"><div class="pillar-head"><strong>${p.name}</strong><span class="pillar-score"><small>Index</small>${score}</span></div><div class="pillar-status status-${band.key}">${status}</div><div class="bar ${p.score===null?'bar-empty':''}" role="img" aria-label="${p.name}: ${score}, ${status}"><span style="width:${width}%"></span></div><p><strong>Fehlerquote:</strong> ${p.sample?`${p.errors} von ${p.sample} (${p.errorRate} %)`: 'Keine bewertbaren Daten'}</p>${p.details?`<p><strong>Kennzahlen:</strong> ${p.details}</p>`:''}<p><strong>Fokus:</strong> ${p.focus}</p></div>`}).join('');
 $('#clubTable').innerHTML=a.clubs.length?`<table class="data-table"><thead><tr><th>Schläger</th><th>Schläge</th><th>Auffällig</th><th>Strafe</th><th>Zuverlässigkeit</th></tr></thead><tbody>${a.clubs.map(c=>`<tr><td><strong>${c.club}</strong></td><td>${c.shots}</td><td>${c.bad}</td><td>${c.penalties}</td><td><span class="tag">${c.reliability}%</span></td></tr>`).join('')}</tbody></table>`:empty();
 $('#patternList').innerHTML=a.patterns.length?a.patterns.map(([n,c])=>`<div class="priority"><h3>${n}</h3><p>${c} beobachtete${c===1?'r':'e'} Fehler.</p></div>`).join(''):empty('Noch keine wiederkehrenden Links-, Rechts-, Kurz- oder Langmuster.');renderTraining();renderProfile();}
function renderTraining(){const plan=trainingFrom(analysis||analyse(state));$('#trainingPlan').innerHTML=plan.map((x,i)=>`<article class="training-card"><div class="training-card-top"><div class="training-card-title"><span class="kicker">Priorität ${i+1}</span><h2>${x.title}</h2></div><div class="minutes"><strong>${x.minutes}</strong><span>Min.</span></div></div><div class="training-card-content"><div class="training-block"><span>Warum</span><p>${x.why}</p></div><div class="training-block"><span>Übung</span><p>${x.exercise}</p></div><div class="training-block training-goal"><span>Messziel</span><p>${x.goal}</p></div></div></article>`).join('');renderPrintReport(plan);renderOffers()}
function renderProfile(){const a=analysis||analyse(state);$('#profileName').textContent=state.player.name?`${state.player.name} · Player Profile`:'APS Player Profile';$('#profileMeta').textContent=[state.player.handicap&&`HCP ${state.player.handicap}`,state.player.course,state.player.date].filter(Boolean).join(' · ')||'Noch keine Spielerdaten.';$('#profileMetrics').innerHTML=metric('Runden im Archiv',(state.archive||[]).length)+metric('Aktuelle Schläge',a.shots.length)+metric('Aktueller Score',a.score||'–')+metric('Strafschläge',a.penalties);const strengths=a.pillars.filter(p=>p.reliable&&p.score>=85).sort((x,y)=>y.score-x.score);$('#strengthList').innerHTML=strengths.length?strengths.map(s=>`<div class="priority"><h3>${s.name}</h3><p>${s.summary}</p></div>`).join(''):empty('Noch keine Stärke ist ausreichend belegt.');$('#weaknessList').innerHTML=a.priorities.length?a.priorities.map(p=>`<div class="priority"><h3>${p.name}</h3><p>${observationLabel(p.count)}. ${p.cause}</p></div>`).join(''):empty();const ar=state.archive||[];$('#roundArchive').innerHTML=ar.length?`<table class="data-table"><thead><tr><th>Datum</th><th>Platz</th><th>Score</th><th>Strafen</th><th>Top-Priorität</th></tr></thead><tbody>${ar.map(r=>`<tr><td>${r.date||'–'}</td><td>${r.course||'–'}</td><td>${r.score||'–'}${r.score&&r.par?` (${r.score-r.par>=0?'+':''}${r.score-r.par})`:''}</td><td>${r.penalties}</td><td>${r.top}</td></tr>`).join('')}</tbody></table>`:empty('Noch keine abgeschlossene Analyse im Archiv.')}
$('#exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`APS_3_0_${(state.player.name||'Spieler').replace(/\s+/g,'_')}.json`;a.click();URL.revokeObjectURL(a.href)};$('#importInput').onchange=async e=>{try{state=JSON.parse(await e.target.files[0].text());save();renderAll();toast('Daten importiert.')}catch{toast('Import fehlgeschlagen.')}};
function renderAll(){renderMeta();renderRound();renderAnalysis()}renderAll();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js');
