// Automatische Prüfung (Node, ohne Browser):  node tests/check.cjs
// Prüft Regeln, Übungszuordnung, Speicherung und erzeugt PDFs für viele Fälle.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.join(__dirname,'..');
const store={};const localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>delete store[k]};
const ctx={console,localStorage,TextEncoder,TextDecoder,Blob,setTimeout,URL,atob:global.atob,btoa:global.btoa};
ctx.window=undefined;vm.createContext(ctx);
const load=f=>vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
['js/rules.js','js/drills.js','js/model.js','js/store.js','js/charts.js','lib/pdf-lib.min.js','js/pdf.js'].forEach(load);
const run=s=>vm.runInContext(s,ctx);
const base={fold:'Side On',height:'170',span:'176',upper:'35',fore:'40',post:'Center',hip:'Slow',leadgrip:'',focus:'',trial:'',pressure:'',pain:'Keine angegeben',finding:'',date:'2026-10-21',hitsHabit:'',hitsCompare:'',feel:'',email:''};
ctx.__in=base;
const rep=(over={},client={name:'Test Kunde',side:'Rechts'})=>{ctx.__o=over;ctx.__c=client;return run('buildReport({...__in,...__o},__c)');};
let n=0;const ok=(c,m)=>{assert(c,m);n++;};

// ---- Regeln ----
let r=rep({fold:'Side On',span:'164',upper:'38',fore:'34'});
ok(r.power.key==='spin'&&r.back.plane==='low'&&r.down.plane==='shaft','Side On / niedrig');
r=rep({goal:'Konstanz',miss:'Slice'});ok(r.profileLine==='Dein Ziel: Konstanz  ·  Häufigster Fehlschlag: Slice','Ausgangslage-Zeile');
r=rep({});ok(r.profileLine==='','Ausgangslage leer');ok(r.video===null,'Video leer = kein Abschnitt');
r=rep({vidHip:'yes',vidBack:'yes',vidDown:'yes'});ok(r.video&&r.video.items.length===3&&/bestätigt/.test(r.video.summary),'Video bestätigt');
r=rep({vidHip:'no',vidBack:'part'});ok(r.video.items.length===2&&/weicht ab|Hüfte/.test(r.video.summary)&&/Hüfte/.test(r.video.summary),'Video weicht ab');
r=rep({fold:'On Top',span:'176',upper:'38',fore:'42'});ok(r.power.key==='launch'&&r.back.plane==='high'&&r.down.plane==='shoulder','On Top / hoch');
r=rep({fold:'Side/Under',span:'170',fore:'35'});ok(r.power.key==='glide'&&r.back.plane==='mid'&&r.down.plane==='elbow','Under / gleich');
r=rep({span:'170.5',fore:'35.5'});ok(r.back.plane===null&&r.down.plane===null&&r.model.gaps.includes('Armmaße erneut messen'),'kleine Differenz bleibt offen');
r=rep({fold:'Uneindeutig'});ok(r.power===null,'uneindeutiger Armtest');
r=rep({pain:'Bewegung eingeschränkt'});ok(r.model.status==='paused'&&r.power===null&&r.back===null&&r.bodyPicture===null,'Beschwerden pausieren');
ok(r.offer.sessions[0].title==='Beschwerdefrei starten'&&r.offer.sessions.length===3,'Angebot bei Beschwerden');
r=rep({hip:'Slow',leadgrip:''});ok(r.model.leadCandidate==='Schwächer'&&r.model.grip.includes('schwächeren'),'Slow → schwächer');
r=rep({hip:'Fast'});ok(r.model.leadCandidate==='Stärker','Fast → stärker');
r=rep({hip:'Mid',leadgrip:'Stärker'});ok(r.model.leadCandidate==='Stärker','Trainer-Griff hat Vorrang');
r=rep({trial:'worse'});ok(r.model.status==='rejected'&&r.priority.includes('gewohnten Bewegung')&&!r.decision,'ungünstig → keine Änderung');
r=rep({trial:'better'});ok(r.model.status==='favorable','günstig');
r=rep({fold:'',hip:'',post:''});ok(r.model.status==='open'||r.model.chosenFocus,'offene Tests ergeben gültigen Zustand');
r=rep({hitsHabit:'2',hitsCompare:'4',feel:'better'});ok(r.scores.verdict==='better','Trefferzahlen besser');
r=rep({hitsHabit:'4',hitsCompare:'2'});ok(r.scores.verdict==='worse','Trefferzahlen schlechter');
r=rep({hitsHabit:'3',hitsCompare:'3'});ok(r.scores.verdict==='same','Trefferzahlen gleich');
r=rep({hitsHabit:'2',hitsCompare:'4',feel:'worse'});ok(r.scores.verdict==='mixed','mehr Treffer, schlechteres Gefühl = uneindeutig');
r=rep({},{name:'Lina',side:'Links'});ok(r.side==='Links'&&r.name==='Lina','Linksspieler');

// ---- Übungen: jede Kombination liefert gültige Zuordnungen ----
let combos=0;const seen={};
for(const fold of ['Side/Under','Side On','On Top','Uneindeutig',''])for(const hip of ['Slow','Mid','Fast','Unclear',''])for(const focus of ['','motion','grip','back','down'])for(const trial of ['','better','same','worse','unclear'])for(const [span,fore] of [['164','30'],['170','35'],['176','42'],['180','36.5'],['170.5','35.5'],['','']]){
 const x=rep({fold,hip,focus,trial,span,fore});combos++;if(focus===''&&trial===''&&x.model.chosenFocus)seen[x.model.chosenFocus]=(seen[x.model.chosenFocus]||0)+1;
 if(['compare','favorable'].includes(x.model.status)){assert(x.drills.focus.length>0,`Keine Übung für ${x.model.chosenFocus} (${fold}/${hip}/${span})`);}
 assert(Array.isArray(x.steps)&&x.steps.length>0&&x.steps.every(t=>t.title&&t.text)&&x.priority&&x.next&&x.offer.sessions.length===3&&Array.isArray(x.ranking)&&x.ranking.length===4);
}
ok(combos===5*5*5*5*6,'Kombinationen geprüft: '+combos);
ok(['motion','grip','back','down'].every(k=>seen[k]>0),'Alle vier Vergleichspunkte kommen automatisch vor: '+JSON.stringify(seen));
// jede Übung hat vollständige Felder
run('DRILLS').forEach(d=>{ok(d.id&&d.title&&d.goal&&d.steps.length>=2&&d.watch&&d.reps&&d.minutes>0,'Übung unvollständig: '+d.id);});

// ---- Reihenfolge nach Klarheit ----
r=rep({fold:'On Top',post:'Rear',hip:'Fast',height:'170',span:'176',upper:'35',fore:'40'});
ok(r.model.chosenFocus==='motion'&&r.ranking[0].key==='motion','Beispiel Anna: Körperbewegung zuerst, nicht Griff');
ok(r.ranking.length===4&&r.ranking.every(x=>x.score>=0&&x.score<=3),'Ranking vollständig');
ok(r.focusWhy.length>20&&r.finding.includes('Körperbewegung'),'klare Aussage zum Vergleichspunkt');
r=rep({fold:'Side On',post:'Center',hip:'Mid',height:'170',span:'180',upper:'35',fore:'36.5'});ok(r.model.chosenFocus==='back','große Spannweitendifferenz → Rückschwung');
r=rep({fold:'Side On',post:'Center',hip:'Mid',height:'170',span:'171.5',upper:'35',fore:'41'});ok(r.model.chosenFocus==='down','große Armmaßdifferenz → Abschwung');
r=rep({fold:'Side On',post:'Center',hip:'Fast',height:'170',span:'171.5',upper:'35',fore:'36.5'});ok(r.model.chosenFocus==='grip','Hip Fast bei sonst neutralen Tests → Griff');
r=rep({fold:'Side On',post:'Center',hip:'Fast',focus:'down',height:'170',span:'171.5',upper:'35',fore:'41'});ok(r.model.chosenFocus==='down','Auswahl des Trainers hat Vorrang');
r=rep({});ok(r.offer.priceText==='199 €'&&r.offer.minutes===50&&r.offer.count===3,'Angebot 3 × 50 Min. für 199 €');
ok(run('Charts.levels("top","high")').indexOf('Tief')<run('Charts.levels("top","high")').indexOf('Hoch'),'Ebenen von Tief nach Hoch');
ok(run('Charts.levels("down","shaft")').indexOf('Hüftnah')<run('Charts.levels("down","shaft")').indexOf('Schulternah'),'Zonen von Hüftnah nach Schulternah');

// ---- Speicherung ----
run('Store.wipe()');
const c=run('Store.saveClient({name:"Max",side:"Rechts",email:"m@x.de"})');
const s=run(`Store.newSession("${c.id}",{...DEFAULT_INPUTS(),height:"180"})`);
ok(run('Store.counts().clients')===1&&run('Store.counts().sessions')===1,'Speichern');
ok(store['schwungdna.v2'].includes('"Max"'),'localStorage geschrieben');
const exp=run('Store.exportJSON()');run('Store.wipe()');ok(run('Store.counts().clients')===0,'wipe');
const imp=run(`Store.importJSON(${JSON.stringify(exp)})`);ok(imp.clients===1&&imp.sessions===1,'Import');
const imp2=run(`Store.importJSON(${JSON.stringify(exp)})`);ok(imp2.clients===0&&imp2.sessions===0,'Import doppelt ohne Duplikate');
assert.throws(()=>run('Store.importJSON("{\\"x\\":1}")'),/Schwung-DNA/);n++;
run(`Store.saveSession("${s.id}",{...DEFAULT_INPUTS(),height:"185"})`);ok(run(`Store.session("${s.id}").inputs.height`)==='185','Session ändern');
run(`Store.deleteClient("${c.id}")`);ok(run('Store.counts().sessions')===0,'Kunde löschen entfernt Checks');

// ---- Grafiken ----
for(const html of [run('Charts.compare({aLabel:"a",a:170,bLabel:"b",b:176})'),run('Charts.compare({aLabel:"a",a:0,bLabel:"b",b:1})'),run('Charts.ring(2,4)'),run('Charts.triad("spin")'),run('Charts.levels("top","mid")'),run('Charts.progress([{label:"1.1.",habit:2,compare:4,focus:"Griff"}])'),run('Charts.progress([])')])ok(typeof html==='string'&&html.length>10,'Chart');

// ---- PDF in vielen Zuständen ----
(async()=>{
 const out=path.join(root,'..','tmp-pdfs');fs.mkdirSync(out,{recursive:true});
 const cases={
  'voll-rechts':{},'links':{_c:{name:'Lina Links',side:'Links'}},'beschwerden':{pain:'Bewegung schmerzhaft – Test angepasst/ausgelassen'},
  'offen':{fold:'',hip:'',post:'',span:'',fore:'',height:'',upper:''},'ungünstig':{trial:'worse',focus:'grip'},'günstig-motion':{trial:'better',focus:'motion',hitsHabit:'1',hitsCompare:'5',feel:'better'},
  'rueck':{focus:'back',trial:'same'},'ab':{focus:'down',fold:'On Top',span:'176',fore:'42'},'unklar-maße':{span:'170.5',fore:'35.5'},
  'sonderzeichen':{finding:'Test → ≥ ✓ — „Anführung“ € 😀 ñ ø',_c:{name:'Zoë Ålesund-Müller 😀 mit sehr langem Nachnamen der nicht in eine Zeile passt',side:'Rechts'}},
  'lange-notiz':{finding:'Lorem ipsum dolor sit amet, '.repeat(9)}
 };
 for(const [name,o] of Object.entries(cases)){
  const cl=o._c||{name:'Test Kunde',side:'Rechts'};delete o._c;
  const rr=rep(o,cl);ctx.__r=rr;
  const bytes=await run('createReportPDF(__r)');
  const head=Buffer.from(bytes.slice(0,5)).toString();
  assert.equal(head,'%PDF-',name);
  fs.writeFileSync(path.join(out,name+'.pdf'),Buffer.from(bytes));
  const pages=await (async()=>{ctx.__b=bytes;return run('PDFLib.PDFDocument.load(__b).then(d=>d.getPageCount())');})();
  assert(pages>=2&&pages<=12,name+': Seitenzahl '+pages);n++;
 }
 console.log('OK:',n,'Prüfungen bestanden · PDFs in',out);
})().catch(e=>{console.error('FEHLER',e);process.exit(1);});
