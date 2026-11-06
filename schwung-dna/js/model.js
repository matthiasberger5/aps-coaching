// Datenmodell: aus den Eingaben eines Checks wird der komplette Bericht (ohne DOM) berechnet.
const INPUT_KEYS=['fold','height','span','upper','fore','post','pressure','hip','leadgrip','focus','trial','hitsHabit','hitsCompare','feel','pain','finding','date','email'];
const DEFAULT_INPUTS=()=>({fold:'',height:'',span:'',upper:'',fore:'',post:'',pressure:'',hip:'',leadgrip:'',focus:'',trial:'',hitsHabit:'',hitsCompare:'',feel:'',pain:'Keine angegeben',goal:'',miss:'',vidHip:'',vidBack:'',vidDown:'',vidNote:'',finding:'',date:localDate(),email:''});
function localDate(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
const fmt=x=>Number(x).toLocaleString('de-DE',{maximumFractionDigits:1});
const fmtDate=iso=>iso?iso.split('-').reverse().join('.'):'';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const PICTURES={
 gripweak:{src:'assets/grip/comparison.png',width:448,height:560,crop:{x:1232,y:508,width:448,height:560},caption:'Vordere Hand schwächer: weniger sichtbare Knöchel. Nur die vordere Hand etwas verändern; die hintere Hand beibehalten.'},
 gripneutral:{src:'assets/grip/comparison.png',width:448,height:560,crop:{x:672,y:508,width:448,height:560},caption:'Vordere Hand neutral: Beispiel zur Orientierung, kein verbindlicher Knöchelwert.'},
 gripstrong:{src:'assets/grip/comparison.png',width:448,height:560,crop:{x:112,y:508,width:448,height:560},caption:'Vordere Hand stärker: mehr sichtbare Knöchel. Nur die vordere Hand etwas verändern; die hintere Hand beibehalten.'},
 under:{src:'assets/new-horizons/swing_path_under_sequence1a-360x131.png',width:360,height:131,caption:'Under: hintere Handfläche eher nach oben; die Armstreckung verläuft eher nach außen. Beispiel der Armbewegung, keine Griff-Nahaufnahme.'},
 sideon:{src:'assets/new-horizons/swing_path_side-on_seqjuence1a-360x143.png',width:360,height:143,caption:'Side On: hintere Handfläche eher seitlich; die Armstreckung verläuft nach unten und außen. Beispiel der Armbewegung, keine Griff-Nahaufnahme.'},
 ontop:{src:'assets/new-horizons/swing_path_on-top_sequence1a-360x139.png',width:360,height:139,caption:'On Top: hintere Handfläche eher zum Boden; die Armstreckung verläuft eher nach unten. Beispiel der Armbewegung, keine Griff-Nahaufnahme.'},
 powertypes:{src:'assets/golf-com/power-types.png',width:942,height:662,caption:''},
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
// Erklärung der Rangfolge für Bericht und PDF
const RANKING_NOTE='Die Punkte zeigen, wie eindeutig ein Befund ist: bei der Körperbewegung, wie klar die Mehrheit deiner fünf Tests ist; beim Griff, ob Hüfttempo und hintere Hand in dieselbe Richtung zeigen; bei Rückschwung und Abschwung, wie deutlich deine Maße vom Gleichstand abweichen. Der klarste Punkt ist dein erster Vergleichspunkt; die weiteren kannst du danach nacheinander angehen.';
// Kontakt zentral pflegen (Bericht, PDF, E-Mail).
const CONTACT={name:'Matthias Berger · Master Golf Professional',phone:'0171 9045523',whatsapp:'491719045523',web:'www.matthiasberger.pro'};
const CONTACT_LINE='Telefon und WhatsApp '+CONTACT.phone+' · '+CONTACT.web;
const firstName=n=>(n||'').trim().split(/\s+/)[0]||'';

const FOCUS_NAMES={motion:'Körperbewegung',grip:'Griffansatz',back:'Rückschwungführung',down:'Abschwungzone'};
const POWER_KEY={'Side/Under':'glide','Side On':'spin','On Top':'launch'};
const FOLD_LABEL={'Side/Under':'Under','Side On':'Side On','On Top':'On Top'};
const POST_LABEL={Front:'Front Post',Center:'Center Post',Rear:'Rear Post'};
const HIP_LABEL={Slow:'Slow',Mid:'Mid',Fast:'Fast'};
const TOP_LABEL={low:'Tiefer Top',mid:'Mittlerer Top',high:'Hoher Top'};
const DOWN_LABEL={shaft:'Hüftnah',elbow:'Rumpfnah',shoulder:'Schulternah'};

// Eine Hauptübung, höchstens zwei optionale Ergänzungen und das Warm-up.
// Der 5+5-Vergleich steckt bereits in der Aufgabe; der Ausgangswert nur, solange noch kein Vergleichspunkt feststeht.
function drillsForReport(model,inp){
 if(model.status==='paused')return {main:null,optional:[],focus:[],basis:[]};
 const k=model.chosenFocus;let core=[],extra=[];
 if(k==='motion'&&['glide','spin','launch'].includes(model.power?.key)){core=drillsFor('motion',model.power.key);extra=drillsFor('post',inp.post);}
 else if(k==='grip'&&model.leadCandidate){core=drillsFor('grip',model.leadCandidate);extra=drillsFor('hip',inp.hip);}
 else if(k==='back'){core=[...drillsFor('back',model.armback?.plane),...drillsFor('top',model.back?.plane)];}
 else if(k==='down'&&model.down?.plane)core=drillsFor('down',model.down.plane);
 const list=[...core,...extra].filter(Boolean);
 const focusMode=['compare','favorable'].includes(model.status);
 return {main:list[0]||null,optional:list.slice(1,3),focus:list.slice(0,3),
  basis:[focusMode?null:drillById('basis-baseline'),drillById('basis-warmup')].filter(Boolean)};
}
// Datum + 1 Monat (bei kürzerem Folgemonat der letzte Tag, z. B. 31.01. → 28./29.02.)
function addOneMonth(iso){
 const [y,m,d]=(iso||localDate()).split('-').map(Number);
 const next=new Date(y,m,1),last=new Date(y,m+1,0).getDate();
 return [next.getFullYear(),String(next.getMonth()+1).padStart(2,'0'),String(Math.min(d,last)).padStart(2,'0')].join('-');
}

const GOALS=['Länge','Konstanz','Schmerzfrei spielen','Mehr Kontrolle'];
const MISSES=['Slice','Hook','Fat','Top','Unterschiedlich'];
function profileLine(inp){return inp.miss&&inp.miss!=='Unterschiedlich'?'Dein häufigster Fehlschlag: '+inp.miss:'';}
// Fehlschlag mit dem Hüfttyp abgleichen (Slice = Fläche offen, Hook = Fläche geschlossen)
function missLine(miss,hip,restricted){
 if(restricted||!miss||miss==='Unterschiedlich')return null;
 if(miss==='Fat'||miss==='Top')return {match:'other',text:'Fette und getoppte Schläge hängen meist mit dem tiefsten Punkt des Schwungs und dem Gleichgewicht zusammen, weniger mit dem Hüfttempo.'};
 const T={Slow:'langsamen',Mid:'mittleren',Fast:'schnellen'}[hip];if(!T)return null;
 const fits=(hip==='Fast'&&miss==='Slice')||(hip==='Slow'&&miss==='Hook');
 if(fits)return {match:'yes',text:'Dein häufigster Fehlschlag, der '+miss+', passt zu deinem '+T+' Hüfttyp: Die Schlagfläche '+(miss==='Slice'?'bleibt im Treffmoment eher offen':'schließt im Treffmoment eher früh')+'. Genau hier setzt dein Ziel-Setup an.'};
 if(hip==='Mid')return {match:'other',text:'Bei deinem mittleren Hüfttyp erklärt das Hüfttempo deinen '+miss+' nicht allein. Die Ursache liegt eher in Griff oder Schwungbahn.'};
 return {match:'no',text:'Dein häufigster Fehlschlag, der '+miss+', passt nicht zu deinem '+T+' Hüfttyp, der eher zu '+(hip==='Fast'?'offenen':'geschlossenen')+' Schlagflächen führt. Die Ursache liegt vermutlich woanders, zum Beispiel in Griff oder Schwungbahn.'};
}
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
 const summary=off.length?'Im Video weicht ab: '+off.join(', ')+'. Dieser Punkt kommt deshalb nicht als Vergleichspunkt in Frage; dein Schwung zeigt hier etwas anderes als der Test.'
  :part.length?'Das Video bestätigt die Tests zum Teil ('+part.join(', ')+' nur teilweise). Diese Punkte haben bei der Wahl des Vergleichspunkts weniger Gewicht.'
  :'Das Video bestätigt die Testergebnisse.';
 return {items,summary,note:(inp.vidNote||'').trim()};
}
// Angebot nach dem Screening. Preis, Anzahl und Dauer hier zentral pflegen.
const OFFER={name:'Festigungs-Paket',count:3,minutes:50,price:199,currency:'€',priceLabel:'Sonderpreis'};
function buildOffer(model,date){
 const validUntil=addOneMonth(date);
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
 return {name:OFFER.name,count:OFFER.count,minutes:OFFER.minutes,price:OFFER.price,currency:OFFER.currency,validUntil,priceLabel:OFFER.priceLabel+' bei Buchung bis '+fmtDate(validUntil),bookingNote:'Der Sonderpreis gilt, wenn du das Paket bis zum '+fmtDate(validUntil)+' buchst. Die drei Termine selbst kannst du danach in Ruhe planen, auch '+(Number(String(validUntil).slice(5,7))>=10?'erst '+(Number(String(validUntil).slice(0,4))+1):'einige Wochen oder Monate später')+'. Entscheidend ist nur das Buchungsdatum.',priceText:OFFER.price+' '+OFFER.currency,sessions};
}

function buildReport(inp,client={}){
 const n=k=>inp[k]===''||inp[k]==null?null:Number(inp[k]);
 const h=n('height'),w=n('span'),u=n('upper'),f=n('fore');
 const complete=[h,w,u,f].every(x=>x!==null&&Number.isFinite(x)&&x>0);
 const model=evaluateScreening({height:h,span:w,upper:u,fore:f,fold:inp.fold,leadgrip:inp.leadgrip,post:inp.post,pressure:inp.pressure,hip:inp.hip,trial:inp.trial,focus:inp.focus,pain:inp.pain,vid:{hip:inp.vidHip,back:inp.vidBack,down:inp.vidDown}});
 const restricted=model.restricted;
 const lead=!restricted&&model.focusWhy&&model.chosenFocus?model.focusWhy+' Wir vergleichen deshalb zuerst: '+model.focusName+'.':null;
 const finding=restricted?'Beschwerden wurden angegeben; wir empfehlen noch keine Bewegungsänderung.':lead?lead:complete?'Deine Tests liefern Ansätze für Griff, Körperbewegung und Schwungführung.':'Bitte die vier Körpermaße vervollständigen.';
 const gripPicture=restricted?null:({'Schwächer':'gripweak','Neutral':'gripneutral','Stärker':'gripstrong'}[model.leadCandidate]||null);
 const bodyPicture=restricted?null:({'Side/Under':'under','Side On':'sideon','On Top':'ontop'}[inp.fold]||null);
 const drills=drillsForReport(model,inp);
 const offer=buildOffer(model,inp.date);
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
  model,gripPicture,bodyPicture,setup:setupBlock(inp.hip,client.side||inp.side||'Rechts',model),inputs:{...inp},profileLine:profileLine(inp),miss:missLine(inp.miss,inp.hip,restricted),video:videoBlock(model,inp,restricted),
  power:restricted?null:model.power,back:restricted?null:model.back,down:restricted?null:model.down,
  priority:model.priority,planTitle:model.planTitle,steps:model.steps,criterion:model.criterion,decision:model.decision,focusWhy:model.focusWhy,ranking:model.ranking,next:model.next,
  drills,offer,dna,done,doneCount:done.filter(Boolean).length,
  scores:{habit:hh,compare:hc,feel:inp.feel,verdict:scoreVerdict},
  hasScores:['compare','favorable'].includes(model.status)
 };
}

// Satz unter dem Bild der Bewegungstypen
function powerTypeLine(power){
 const T={glide:'seitliche Bewegung zum Ziel (Glide). Im Bild: The Glider',spin:'Rotation (Spin). Im Bild: The Spinner',launch:'Druck in den Boden und Aufrichten (Launch). Im Bild: The Launcher'};
 return T[power?.key]?'Deine Kraftquelle: '+T[power.key]+', grün umrandet.':'Du nutzt mehrere Kraftquellen. Im Bild ist deshalb kein einzelner Typ markiert.';
}

// Setup-Empfehlung nach Hüfttyp (Matthias Berger, nach Bill Schmedes III)
function setupBlock(hip,side,model){
 if(model.restricted||!['Slow','Mid','Fast'].includes(hip))return null;
 const t=side==='Links'?'linke':'rechte';
 const S={
  Slow:{name:'Langsamer Hüfttyp',text:'Deine Hüfte dreht im Abschwung eher ruhig. Dadurch schließt sich die Schlagfläche im Treffmoment schnell, und der Ball kann nach links ziehen. Ein etwas schwächerer Griff, eine Ballposition weiter vorn und ein leicht geöffneter vorderer Fuß helfen dir, Ober- und Unterkörper besser zu synchronisieren.',
   rows:[['Griff','maximal 2 Knöchel sichtbar (eher schwach)'],['V obere Hand','zeigt auf die Nase'],['V hintere Hand','zeigt auf das '+t+' Ohr'],['Ballposition','einen Ball weiter vorn als Standard'],['Abstand zum Ball','etwas weiter weg (mehr als eine Handbreit zwischen Körper und Griff)'],['Füße','vorderer Fuß ca. 20° zum Ziel geöffnet']]},
  Mid:{name:'Mittlerer Hüfttyp',text:'Deine Hüfte und dein Oberkörper arbeiten im Abschwung gut im Gleichgewicht. Für dich passt das klassische Setup: neutraler Griff, Standard-Ballposition und etwa eine Handbreit Abstand zwischen Körper und Griff.',
   rows:[['Griff','klassisch, 2 Knöchel sichtbar'],['V obere Hand','zeigt auf das '+t+' Auge'],['V hintere Hand','zeigt auf das '+t+' Ohr'],['Ballposition','Standard'],['Abstand zum Ball','eine Handbreit zwischen Körper und Griff'],['Füße','Standardposition']]},
  Fast:{name:'Schneller Hüfttyp',text:'Deine Hüfte dreht im Abschwung schnell und läuft dem Oberkörper voraus. Dadurch bleibt die Schlagfläche oft länger offen, typisch für einen Fade oder Slice. Ein kräftigerer Griff, eine Ballposition etwas weiter hinten und ein etwas näherer Stand zum Ball helfen, die Fläche rechtzeitig zu schließen.',
   rows:[['Griff','stärker, 3 bis 3,5 Knöchel sichtbar'],['V obere Hand','zeigt auf das '+t+' Ohr'],['V hintere Hand','zeigt auf das '+t+' Ohr'],['Ballposition','eine Ballbreite weiter hinten als Standard'],['Abstand zum Ball','etwas näher (weniger als eine Handbreit zwischen Körper und Griff)'],['Füße','beide Füße ca. 20° nach außen gedreht']]}
 }[hip];
 let rows=S.rows;
 if(model.gripConflict)rows=[['Griff','Noch keine Vorgabe: Hip-Speed-Test und Arm-Pendeltest zeigen für die beiden Hände in unterschiedliche Richtungen. Prüfe den Griff zuerst am Ballflug.'],...S.rows.slice(3)];
 const intro='Das ist dein Ziel-Setup als Orientierung, keine Änderung auf einmal. Nimm die Punkte nacheinander auf: zuerst den Griff, dann Ballposition und Abstand, zuletzt die Füße. Prüfe jede Änderung am Ball, bevor du die nächste dazunimmst.';
 return {...S,rows,key:hip,intro,note:''};
}

// Übersicht aller Tests: Beobachtung und Ergebnis im Modell (für Bericht und PDF)
function testOverview(r){
 const i=r.inputs||{},m=r.model,mm=r.measures||{};
 const FOLD={'Side/Under':'Handfläche eher nach oben','Side On':'Handfläche eher seitlich','On Top':'Handfläche eher zum Boden',Uneindeutig:'uneindeutig'};
 const POST={Front:'Gewicht eher vorn',Center:'Gewicht eher mittig',Rear:'Gewicht eher hinten',Unclear:'uneindeutig'};
 const PRES={front:'Druck vorn',center:'Druck beidseitig',rear:'Druck hinten',unclear:'Druck unklar'};
 const HIP={Slow:'Ferse am Boden, Hüfte zurück',Mid:'Ferse leicht angehoben',Fast:'Ferse deutlich angehoben, Hüfte voraus',Unclear:'uneindeutig'};
 const has=(...v)=>v.every(x=>x>0);
 return [
  {test:'Arm-Pendeltest',seen:FOLD[i.fold]||'noch offen',result:m.armback?.name||'offen'},
  {test:'Größe und Spannweite',seen:has(mm.height,mm.span)?fmt(mm.height)+' cm / '+fmt(mm.span)+' cm':'noch offen',result:r.back?.name||'offen'},
  {test:'Oberarm und Armmaß',seen:has(mm.upper,mm.fore)?fmt(mm.upper)+' cm / '+fmt(mm.fore)+' cm':'noch offen',result:r.down?.name||'offen'},
  {test:'Post-/Pivot-Test',seen:(POST[i.post]||'noch offen')+(i.pressure&&PRES[i.pressure]?' · '+PRES[i.pressure]:''),result:POST_LABEL[i.post]||'offen'},
  {test:'Hip-Speed-Test',seen:HIP[i.hip]||'noch offen',result:m.gripConflict?HIP_LABEL[i.hip]+' · Griff uneinheitlich, keine Änderung':m.leadCandidate?'Vordere Hand: '+m.leadCandidate.toLowerCase()+' prüfen':(HIP_LABEL[i.hip]||'offen')}
 ];
}
