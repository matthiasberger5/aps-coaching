'use strict';
const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const path=require('path');

const appPath=path.join(__dirname,'..','js','app.js');
const source=fs.readFileSync(appPath,'utf8').split("const KEY='aps-3.0-state'")[0];
const context={console,globalThis:{crypto:{randomUUID:()=>Math.random().toString(36).slice(2)}}};
vm.createContext(context);
vm.runInContext(source+';globalThis.testApi={initialState,sampleState,analyse,trainingFrom,performanceBand,uid,APS_OFFERS,ANALYSIS_CREDIT};',context);
const {initialState,sampleState,analyse,trainingFrom,performanceBand,uid,APS_OFFERS,ANALYSIS_CREDIT}=context.globalThis.testApi;

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
    'Putten – Distanzkontrolle',
    'Langes Spiel – Treffmoment & Carry'
  ]);
  assert.deepStrictEqual(Array.from(trainingFrom(result),x=>x.minutes),[35,30,25]);
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
  assert.deepStrictEqual(Array.from(APS_OFFERS,offer=>offer.price-ANALYSIS_CREDIT),[400,700,1391],'Die Restbeträge der APS-Programme müssen korrekt berechnet werden.');
}

console.log('Alle Analyse- und Angebots-Tests bestanden.');
