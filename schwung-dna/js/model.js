// Datenmodell: aus den Eingaben eines Checks wird der komplette Bericht (ohne DOM) berechnet.
const INPUT_KEYS=['fold','height','span','upper','fore','post','pressure','hip','leadgrip','focus','trial','hitsHabit','hitsCompare','feel','pain','finding','date','email'];
const DEFAULT_INPUTS=()=>({fold:'',height:'',span:'',upper:'',fore:'',post:'',pressure:'',hip:'',leadgrip:'',focus:'',trial:'',hitsHabit:'',hitsCompare:'',feel:'',pain:'Keine angegeben',goal:'',miss:'',vidHip:'',vidBack:'',vidDown:'',vidNote:'',finding:'',date:localDate(),email:''});
function localDate(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
const fmt=x=>Number(x).toLocaleString('de-DE',{maximumFractionDigits:1});
const fmtDate=iso=>iso?iso.split('-').reverse().join('.'):'';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const PICTURES={
 gripweak:{src:'assets/grip/comparison.png',width:448,height:560,crop:{x:1232,y:508,width:448,height:560},caption:'Vordere Hand schwächer: weniger sichtbare Knöchel. Nur die vordere Hand etwas verändern; die hintere Hand beibehalten. Foto: HackMotion.'},
 gripneutral:{src:'assets/grip/comparison.png',width:448,height:560,crop:{x:672,y:508,width:448,height:560},caption:'Vordere Hand neutral: Beispiel zur Orientierung, kein verbindlicher Knöchelwert. Foto: HackMotion.'},
 gripstrong:{src:'assets/grip/comparison.png',width:448,height:560,crop:{x:112,y:508,width:448,height:560},caption:'Vordere Hand stärker: mehr sichtbare Knöchel. Nur die vordere Hand etwas verändern; die hintere Hand beibehalten. Foto: HackMotion.'},
 under:{src:'assets/new-horizons/swing_path_under_sequence1a-360x131.png',width:360,height:131,caption:'Under: hintere Handfläche eher nach oben; die Armstreckung verläuft eher nach außen. Beispiel der Armbewegung, keine Griff-Nahaufnahme.'},
 sideon:{src:'assets/new-horizons/swing_path_side-on_seqjuence1a-360x143.png',width:360,height:143,caption:'Side On: hintere Handfläche eher seitlich; die Armstreckung verläuft nach unten und außen. Beispiel der Armbewegung, keine Griff-Nahaufnahme.'},
 ontop:{src:'assets/new-horizons/swing_path_on-top_sequence1a-360x139.png',width:360,height:139,caption:'On Top: hintere Handfläche eher zum Boden; die Armstreckung verläuft eher nach unten. Beispiel der Armbewegung, keine Griff-Nahaufnahme.'},
 track:{src:'assets/new-horizons/Swing_Track_3_topsets4-375x190.png',width:375,height:190,caption:'Vorderer Arm am höchsten Punkt: links unterhalb, mittig auf Höhe, rechts oberhalb der Schulterlinie.'},
 shaft:{src:'assets/new-horizons/slotting_-down_RDL_2-405x231.png',width:405,height:231,caption:'Hüftnahe Zone: Hände und Schläger werden im unteren Bereich zum Ball geführt. Modellbereich: Steißbein bis Nabel.'},
 elbow:{src:'assets/new-horizons/slotting_-cross_RDL_2-405x217.png',width:405,height:217,caption:'Rumpfnahe Zone: Hände und Schläger werden im mittleren Bereich zum Ball geführt. Modellbereich: Nabel bis unteres Brustbein.'},
 shoulder:{src:'assets/new-horizons/slotting_-shoulder_RDL_2-405x226.png',width:405,height:226,caption:'Schulternahe Zone: Hände und Schläger werden im höheren Bereich zum Ball geführt. Modellbereich: unteres Brustbein bis Schädelansatz.'}
};
// Bildnachweis für Bericht und PDF. ACHTUNG: Nutzungsrecht für die kommerzielle Weitergabe vor dem Einsatz klären
// oder die Bilder durch eigene ersetzen (PICTURES oben). Ein Nachweis allein ersetzt keine Erlaubnis.
const CREDITS='Bildquellen: E.A. Tischler / New Horizons Golf Approach (newhorizonsgolf.com) · Griff-Foto: HackMotion (hackmotion.com).';
// Hinweis für Kunden; erscheint am Ende von Bericht und PDF.
const DISCLAIMER='Dieser Bericht beschreibt Trainingsansätze aus einem Coaching-Screening. Er ist keine medizinische Untersuchung und ersetzt keine ärztliche oder physiotherapeutische Beratung. Alle Ansätze sind Vorschläge zum Ausprobieren; entscheidend ist der Vergleich am Ball. Bei Schmerzen oder Beschwerden die Übung sofort beenden und ärztlichen Rat einholen.';
// Kontakt zentral pflegen (Bericht, PDF, E-Mail).
const CONTACT={name:'Matthias Berger · Golf Professional',phone:'0171 9045523',whatsapp:'491719045523',web:'www.matthiasberger.pro'};
const CONTACT_LINE='Telefon und WhatsApp '+CONTACT.phone+' · '+CONTACT.web;
const firstName=n=>(n||'').trim().split(/\s+/)[0]||'';

const FOCUS_NAMES={motion:'Körperbewegung',grip:'Griffansatz',back:'Rückschwungführung',down:'Abschwungzone'};
const POWER_KEY={'Side/Under':'glide','Side On':'spin','On Top':'launch'};
const FOLD_LABEL={'Side/Under':'Under','Side On':'Side On','On Top':'On Top'};
const POST_LABEL={Front:'Front Post',Center:'Center Post',Rear:'Rear Post'};
const HIP_LABEL={Slow:'Slow',Mid:'Mid',Fast:'Fast'};
const TOP_LABEL={low:'Tiefer Top',mid:'Mittlerer Top',high:'Hoher Top'};
const DOWN_LABEL={shaft:'Hüftnah',elbow:'Rumpfnah',shoulder:'Schulternah'};

function drillsForReport(model,inp){
 const out={};
 const k=model.chosenFocus;
 if(k==='motion'&&model.power?.key&&['glide','spin','launch'].includes(model.power.key))out.focus=[...drillsFor('motion',model.power.key),...drillsFor('post',inp.post)];
 else if(k==='grip'&&model.leadCandidate)out.focus=[...drillsFor('grip',model.leadCandidate),...drillsFor('hip',inp.hip)];
 else if(k==='back'){out.focus=[...drillsFor('back',model.armback?.plane),...drillsFor('top',model.back?.plane)].filter(Boolean);}
 else if(k==='down'&&model.down?.plane)out.focus=drillsFor('down',model.down.plane);
 else out.focus=[];
 out.focus=out.focus.slice(0,4);
 out.basis=['basis-baseline','basis-compare','basis-warmup'].map(drillById);
 return out;
}

const GOALS=['Länge','Konstanz','Schmerzfrei spielen','Mehr Kontrolle'];
const MISSES=['Slice','Hook','Fat','Top','Unterschiedlich'];
function profileLine(inp){const p=[];if(inp.goal)p.push('Dein Ziel: '+inp.goal);if(inp.miss)p.push('Häufigster Fehlschlag: '+inp.miss);return p.join('  ·  ');}
const VID_RES={yes:'bestätigt',part:'teilweise',no:'weicht ab'};
const VID_HIP={Slow:'Hüfte eher zurück (Slow)',Mid:'Hüfte neutral (Mid)',Fast:'Hüfte eher voraus (Fast)'};
function videoBlock(model,inp,restricted){
 if(restricted)return null;
 const items=[
  {label:'Hüfte',expected:VID_HIP[inp.hip]||'',res:inp.vidHip},
  {label:'Rückschwungebene',expected:model.back?.plane?TOP_LABEL[model.back.plane]:'',res:inp.vidBack},
  {label:'Abschwungebene',expected:model.down?.plane?DOWN_LABEL[model.down.plane]:'',res:inp.vidDown}
 ].filter(x=>VID_RES[x.res]).map(x=>({...x,result:VID_RES[x.res]}));
 if(!items.length)return null;
 const off=items.filter(x=>x.res==='no').map(x=>x.label),part=items.filter(x=>x.res==='part').map(x=>x.label);
 const summary=off.length?'Im Video weicht ab: '+off.join(', ')+'. Wir richten den Vergleichspunkt nach dem, was im Schwung zu sehen ist, und prüfen es beim nächsten Termin.'
  :part.length?'Das Video bestätigt die Tests zum Teil ('+part.join(', ')+' nur teilweise). Wir beobachten das beim nächsten Termin genauer.'
  :'Das Video bestätigt die Testergebnisse.';
 return {items,summary,note:(inp.vidNote||'').trim()};
}
// Angebot nach dem Screening. Preis, Anzahl und Dauer hier zentral pflegen.
const OFFER={name:'Festigungs-Paket',count:3,minutes:50,price:199,currency:'€',priceLabel:'Sonderpreis'};
function buildOffer(model){
 const pts=(model.ranking||[]).filter(x=>x.available).slice(0,OFFER.count);
 const paused=model.status==='paused',off=paused?1:0,sessions=[];
 for(let i=0;i<OFFER.count;i++){
  const p=pts[i-off],last=i===OFFER.count-1;
  let title,text;
  if(paused&&i===0){title='Beschwerdefrei starten';text='Wir klären, welche Bewegungen schmerzfrei möglich sind, und passen die Tests daran an.';}
  else if(p){title=p.name;text=(i-off===0?'Dein erster Vergleichspunkt wird am Ball geprüft und mit passenden Übungen gefestigt.':'Nächster Befund aus deinem Check: wieder als einzelne Änderung mit Vergleich am Ball.')+(last?' Zum Abschluss führen wir alles Übernommene zusammen.':'');}
  else{title='Zusammenführen';text='Übernommene Punkte verbinden und auf die Runde übertragen.';}
  sessions.push({n:i+1,title,text});
 }
 return {name:OFFER.name,count:OFFER.count,minutes:OFFER.minutes,price:OFFER.price,currency:OFFER.currency,priceLabel:OFFER.priceLabel,priceText:OFFER.price+' '+OFFER.currency,sessions};
}

function buildReport(inp,client={}){
 const n=k=>inp[k]===''||inp[k]==null?null:Number(inp[k]);
 const h=n('height'),w=n('span'),u=n('upper'),f=n('fore');
 const complete=[h,w,u,f].every(x=>x!==null&&Number.isFinite(x)&&x>0);
 const model=evaluateScreening({height:h,span:w,upper:u,fore:f,fold:inp.fold,leadgrip:inp.leadgrip,post:inp.post,pressure:inp.pressure,hip:inp.hip,trial:inp.trial,focus:inp.focus,pain:inp.pain});
 const restricted=model.restricted;
 const lead=!restricted&&model.focusWhy&&model.chosenFocus?model.focusWhy+' Wir vergleichen deshalb zuerst: '+model.focusName+'.':null;
 const finding=restricted?'Beschwerden wurden angegeben; wir empfehlen noch keine Bewegungsänderung.':lead?lead:complete?'Deine Tests liefern Ansätze für Griff, Körperbewegung und Schwungführung.':'Bitte die vier Körpermaße vervollständigen.';
 const gripPicture=restricted?null:({'Schwächer':'gripweak','Neutral':'gripneutral','Stärker':'gripstrong'}[model.leadCandidate]||null);
 const bodyPicture=restricted?null:({'Side/Under':'under','Side On':'sideon','On Top':'ontop'}[inp.fold]||null);
 const drills=drillsForReport(model,inp);
 const offer=buildOffer(model);
 const done=[!!model.armback,complete&&!!model.back?.plane&&!!model.down?.plane,['Front','Center','Rear'].includes(inp.post),['Slow','Mid','Fast'].includes(inp.hip)];
 const hh=inp.hitsHabit===''?null:Number(inp.hitsHabit),hc=inp.hitsCompare===''?null:Number(inp.hitsCompare);
 let scoreVerdict=null;
 if(hh!==null&&hc!==null){scoreVerdict=hc>hh?(inp.feel==='worse'?'mixed':'better'):hc<hh?'worse':'same';}
 const dna=[
  inp.fold&&FOLD_LABEL[inp.fold]?{label:'Hintere Hand',value:FOLD_LABEL[inp.fold],key:'fold'}:null,
  POST_LABEL[inp.post]?{label:'Drehachse',value:POST_LABEL[inp.post],key:'post'}:null,
  HIP_LABEL[inp.hip]?{label:'Hüfte',value:HIP_LABEL[inp.hip],key:'hip'}:null,
  model.back?.plane?{label:'Oberer Punkt',value:TOP_LABEL[model.back.plane],key:'top'}:null,
  model.down?.plane?{label:'Abschwung',value:DOWN_LABEL[model.down.plane],key:'down'}:null
 ].filter(Boolean);
 return {
  name:client.name||inp.name||'Dein Schwungcheck',date:inp.date,side:client.side||inp.side||'Rechts',complete,
  finding:finding+(model.screenComplete?'':' Einzelne Tests oder Zuordnungen sind noch offen.')+' '+model.trialText,
  note:inp.finding?.trim()||'',
  measures:{height:h,span:w,upper:u,fore:f},
  measurements:complete?'Körpergröße '+fmt(h)+' cm · Spannweite '+fmt(w)+' cm · Oberarm '+fmt(u)+' cm · Ellenbogen–Fingerknöchel '+fmt(f)+' cm.':'',
  model,gripPicture,bodyPicture,inputs:{...inp},profileLine:profileLine(inp),video:videoBlock(model,inp,restricted),
  power:restricted?null:model.power,back:restricted?null:model.back,down:restricted?null:model.down,
  priority:model.priority,planTitle:model.planTitle,steps:model.steps,criterion:model.criterion,decision:model.decision,focusWhy:model.focusWhy,ranking:model.ranking,next:model.next,
  drills,offer,dna,done,doneCount:done.filter(Boolean).length,
  scores:{habit:hh,compare:hc,feel:inp.feel,verdict:scoreVerdict},
  hasScores:['compare','favorable'].includes(model.status)
 };
}

// Übersicht aller Tests: Beobachtung und Ergebnis im Modell (für Bericht und PDF)
function testOverview(r){
 const i=r.inputs||{},m=r.model,mm=r.measures||{};
 const FOLD={'Side/Under':'Handfläche eher nach oben','Side On':'Handfläche eher seitlich','On Top':'Handfläche eher zum Boden',Uneindeutig:'uneindeutig'};
 const POST={Front:'Becken eher vorn',Center:'Becken eher mittig',Rear:'Becken eher hinten',Unclear:'uneindeutig'};
 const PRES={front:'Druck vorn',center:'Druck beidseitig',rear:'Druck hinten',unclear:'Druck unklar'};
 const HIP={Slow:'Ferse am Boden, Hüfte zurück',Mid:'Ferse leicht angehoben',Fast:'Ferse deutlich angehoben, Hüfte voraus',Unclear:'uneindeutig'};
 const has=(...v)=>v.every(x=>x>0);
 return [
  {test:'Arm-Pendeltest',seen:FOLD[i.fold]||'noch offen',result:m.armback?.name||'offen'},
  {test:'Größe und Spannweite',seen:has(mm.height,mm.span)?fmt(mm.height)+' cm / '+fmt(mm.span)+' cm':'noch offen',result:r.back?.name||'offen'},
  {test:'Oberarm und Armmaß',seen:has(mm.upper,mm.fore)?fmt(mm.upper)+' cm / '+fmt(mm.fore)+' cm':'noch offen',result:r.down?.name||'offen'},
  {test:'Post-/Pivot-Test',seen:(POST[i.post]||'noch offen')+(i.pressure&&PRES[i.pressure]?' · '+PRES[i.pressure]:''),result:POST_LABEL[i.post]||'offen'},
  {test:'Hip-Speed-Test',seen:HIP[i.hip]||'noch offen',result:m.leadCandidate?'Vordere Hand: '+m.leadCandidate.toLowerCase()+' prüfen':(HIP_LABEL[i.hip]||'offen')}
 ];
}
