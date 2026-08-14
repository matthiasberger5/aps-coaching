'use strict';
const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const path=require('path');

const appPath=path.join(__dirname,'..','js','app.js');
const source=fs.readFileSync(appPath,'utf8').split("const KEY='aps-3.0-state'")[0];
const context={console,globalThis:{crypto:{randomUUID:()=>Math.random().toString(36).slice(2)}}};
vm.createContext(context);
vm.runInContext(source+';globalThis.testApi={initialState,sampleState,analyse,trainingFrom,performanceBand,uid,APS_OFFERS,ANALYSIS_CREDIT,calculatedHoleScore,recordedStrokeCount,penaltyStrokeCount};',context);
const {initialState,sampleState,analyse,trainingFrom,performanceBand,uid,APS_OFFERS,ANALYSIS_CREDIT,calculatedHoleScore,recordedStrokeCount,penaltyStrokeCount}=context.globalThis.testApi;

const shot=(type,extra={})=>({id:uid(),type,subtype:'',club:type==='Putt'?'Putter':'Eisen 7',contact:'',direction:'',distance:'',lie:'',puttStart:'',rest:'',penalties:'0',penaltyReason:'',...extra});
const stateWithShots=shots=>({version:'3.0',player:{name:'Test',handicap:'',date:'2026-07-27',course:'',note:''},holes:[{id:uid(),number:1,par:4,score:'',shots}],activeHole:0,lastAnalysis:null,archive:[]});

{
  const result=analyse(initialState());
  assert.strictEqual(result.shots.length,0,'Leere Platzhalter dürfen nicht als erfasste Schläge zählen.');
  assert.strictEqual(result.priorities.length,0,'Ohne Daten darf keine Priorität entstehen.');
}

{
  const result=analyse(sampleState());
  assert.deepStrictEqual(Array.from(result.priorities,p=>p.name),[
    'Abschlag – Ball im Spiel halten',
    'Langes Spiel – Treffmoment & Carry',
    'Putten – Distanzkontrolle'
  ]);
  assert.deepStrictEqual(Array.from(trainingFrom(result),x=>x.minutes),[30,30,30]);
}

{
  const result=analyse(stateWithShots([
    shot('Transportschlag',{contact:'Solide',direction:'Links',distance:'Passend',lie:'Fairway'}),
    shot('Transportschlag',{contact:'Sauber',direction:'Links',distance:'Passend',lie:'Grün'}),
    shot('Transportschlag',{contact:'Solide',direction:'Rechts',distance:'Passend',lie:'Vorgrün'})
  ]));
  assert.strictEqual(result.priorities[0].name,'Langes Spiel – Richtungskontrolle','Normale Links-/Rechtsfehler müssen ausgewertet werden.');
  assert.strictEqual(result.priorities[0].count,3);
}

{
  const result=analyse(stateWithShots([
    shot('Putt',{puttStart:'1–2 m',direction:'Links vorbei',distance:'Passend',rest:'Bis 0,5 m'}),
    shot('Putt',{puttStart:'1–2 m',direction:'Rechts vorbei',distance:'Passend',rest:'Bis 0,5 m'}),
    shot('Putt',{puttStart:'Bis 1 m',direction:'Links vorbei',distance:'Passend',rest:'Bis 0,5 m'})
  ]));
  assert.strictEqual(result.priorities[0].name,'Putten – kurze Putts');
}

{
  const result=analyse(stateWithShots([
    shot('Kurzspiel',{subtype:'Chip',contact:'Solide',direction:'Zielbereich',distance:'Zu kurz',lie:'Grün',rest:'2–5 m'}),
    shot('Transportschlag',{contact:'Dünn',direction:'Zielbereich',distance:'Zu kurz',lie:'Vorgrün'}),
    shot('Transportschlag',{contact:'Dünn',direction:'Zielbereich',distance:'Zu kurz',lie:'Vorgrün'}),
    shot('Transportschlag',{contact:'Dünn',direction:'Zielbereich',distance:'Zu kurz',lie:'Vorgrün'})
  ]));
  assert.strictEqual(result.priorities[0].name,'Langes Spiel – Treffmoment & Carry','Ein einzelner Kurzspielschlag darf ein wiederkehrendes Muster nicht überstimmen.');
}


// Referenzprofile: unterschiedliche Spielprobleme müssen zu unterschiedlichen Prioritäten führen.
{
  const result=analyse(stateWithShots([
    ...Array.from({length:6},()=>shot('Abschlag',{contact:'Solide',direction:'Stark rechts',distance:'Passend',lie:'Rough'})),
    ...Array.from({length:4},()=>shot('Kurzspiel',{subtype:'Chip',contact:'Solide',direction:'Zielbereich',distance:'Passend',lie:'Grün',rest:'Bis 0,5 m'})),
    ...Array.from({length:6},()=>shot('Putt',{puttStart:'2–5 m',direction:'Startlinie passend',distance:'Passend',rest:'Bis 0,5 m'}))
  ]));
  assert.strictEqual(result.priorities[0].name,'Abschlag – Richtungskontrolle');
}
{
  const result=analyse(stateWithShots([
    ...Array.from({length:6},()=>shot('Transportschlag',{contact:'Dünn',direction:'Zielbereich',distance:'Zu kurz',lie:'Vorgrün'})),
    ...Array.from({length:4},()=>shot('Kurzspiel',{subtype:'Chip',contact:'Solide',direction:'Zielbereich',distance:'Passend',lie:'Grün',rest:'Bis 0,5 m'})),
    ...Array.from({length:6},()=>shot('Putt',{puttStart:'2–5 m',direction:'Startlinie passend',distance:'Passend',rest:'Bis 0,5 m'}))
  ]));
  assert.ok(result.priorities[0].name.startsWith('Langes Spiel –'));
}
{
  const result=analyse(stateWithShots([
    ...Array.from({length:6},()=>shot('Kurzspiel',{subtype:'Chip',contact:'Dünn',direction:'Zielbereich',distance:'Passend',lie:'Grün',rest:'1–2 m'})),
    ...Array.from({length:6},()=>shot('Putt',{puttStart:'2–5 m',direction:'Startlinie passend',distance:'Passend',rest:'Bis 0,5 m'}))
  ]));
  assert.strictEqual(result.priorities[0].name,'Kurzspiel – Ballkontakt');
}
{
  const result=analyse(stateWithShots([
    ...Array.from({length:6},()=>shot('Putt',{puttStart:'Bis 1 m',direction:'Links vorbei',distance:'Passend',rest:'Bis 0,5 m'})),
    ...Array.from({length:4},()=>shot('Kurzspiel',{subtype:'Chip',contact:'Solide',direction:'Zielbereich',distance:'Passend',lie:'Grün',rest:'Bis 0,5 m'}))
  ]));
  assert.strictEqual(result.priorities[0].name,'Putten – kurze Putts');
}
{
  const result=analyse(stateWithShots([
    ...Array.from({length:6},()=>shot('Kurzspiel',{subtype:'Pitch',contact:'Solide',direction:'Zielbereich',distance:'Zu kurz',lie:'Grün',rest:'2–5 m'})),
    ...Array.from({length:6},()=>shot('Putt',{puttStart:'2–5 m',direction:'Startlinie passend',distance:'Passend',rest:'Bis 0,5 m'}))
  ]));
  assert.strictEqual(result.priorities[0].name,'Kurzspiel – Längenkontrolle');
}


{
  const result=analyse(initialState());
  assert.ok(result.pillars.every(p=>p.score===null),'Fehlende Säulendaten müssen als nicht bewertbar statt als 0 angezeigt werden.');
  assert.strictEqual(performanceBand(null,0,false).label,'Keine Daten');
  assert.strictEqual(performanceBand(0,10,true).label,'Kritisch');
  assert.strictEqual(performanceBand(49,10,true).label,'Deutlicher Trainingsbedarf');
  assert.strictEqual(performanceBand(69,10,true).label,'Ausbaufähig');
  assert.strictEqual(performanceBand(84,10,true).label,'Stabil');
  assert.strictEqual(performanceBand(85,10,true).label,'Stärke');
}

{
  const result=analyse(sampleState());
  const putting=result.pillars.find(p=>p.name==='Putten');
  assert.ok(putting.details.includes('Putts erfasst'),'Die Putt-Säule muss konkrete Kennzahlen erklären.');
  assert.ok(Number.isInteger(putting.errorRate),'Die Fehlerquote muss getrennt vom Leistungsindex vorliegen.');
}

{
  assert.strictEqual(ANALYSIS_CREDIT,99,'Die bereits bezahlte Erstanalyse muss mit 99 Euro angerechnet werden.');
  assert.deepStrictEqual(Array.from(APS_OFFERS,offer=>offer.price-ANALYSIS_CREDIT),[250,500,1200],'Die Restbeträge der APS-Programme müssen korrekt berechnet werden.');
}


{
  const hole={id:uid(),number:1,par:4,score:'',shots:[
    shot('Abschlag',{club:'Driver',contact:'Solide',direction:'Zielbereich',distance:'Passend',lie:'Fairway'}),
    shot('Transportschlag',{club:'Eisen 7',contact:'Solide',direction:'Zielbereich',distance:'Passend',lie:'Grün'}),
    shot('Putt',{club:'Putter',puttStart:'5–10 m',direction:'Startlinie passend',distance:'Passend',rest:'Bis 0,5 m'}),
    shot('Putt',{club:'Putter',puttStart:'Bis 1 m',direction:'Startlinie passend',distance:'Passend',rest:'Eingelocht'})
  ]};
  assert.strictEqual(recordedStrokeCount(hole),4,'Jeder erfasste Schlag muss genau einmal zum Score zählen.');
  assert.strictEqual(penaltyStrokeCount(hole),0);
  assert.strictEqual(calculatedHoleScore(hole),4,'Vier erfasste Schläge müssen Score 4 ergeben.');
  hole.shots[0].penalties='1';
  hole.shots[0].penaltyReason='Aus';
  assert.strictEqual(penaltyStrokeCount(hole),1,'Ein Strafschlag muss separat gezählt werden.');
  assert.strictEqual(calculatedHoleScore(hole),5,'Vier Schläge plus ein Strafschlag müssen Score 5 ergeben.');
}

console.log('Alle Analyse-, Angebots- und Score-Tests bestanden.');
