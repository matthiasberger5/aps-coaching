// Auswertung des Screenings: fünf Tests, Zuordnungen nach den unten genannten Quellen, eigene Arbeitsregeln sind markiert.
// Geprüft am 26.10.2026 gegen: Adams/Najar (fünf Tests, Punktesystem Glide/Spin/Launch), Adams (Griff ↔ Bewegungstyp),
// Doniger/Adams (Armfaltung hintere Hand), BioSwing-Artikel GolfWRX (Spannweite/Armmaße → Ebenen), Schmedes (Hüfttempo → Griff).
const RULE_SOURCES={
 fivetests:{url:'https://golf.com/instruction/five-easy-tests-to-gain-at-least-20-yards-with-your-driver/',author:'Mike Adams / Bernie Najar',scope:'Punktesystem: Spannweite, Unterarm, Armschwung, Pivot und Hüfttempo vergeben je einen Punkt an Glide, Spin oder Launch'},
 armtest:{url:'https://golf.com/instruction/how-discover-best-grip-your-body-type/',author:'Debbie Doniger / Mike Adams',scope:'Armtest in Golfhaltung, Schultern ruhig, Stopp auf Hüfthöhe; Ergebnis: Griff der hinteren Hand'},
 armfold:{url:'https://golf.com/instruction/which-backswing-works-best-for-you/',scope:'Under: Arm faltet körpernah, Handfläche zum Himmel; Side On: seitlich; On Top: Ellenbogen nach oben/hinten, Handfläche zum Boden'},
 power:{url:'https://golf.com/instruction/hall-of-fame-teacher-3-thoughts-3-golfers/',author:'Mike Adams',scope:'Hintere Hand unter dem Griff → seitlich (Becken zum Ziel, Oberkörper bleibt zurück); seitlich → Drehung; oben → Druck in den Boden und Aufrichten'},
 planes:{url:'https://golfwrx.com/181715/biomechanics-and-how-they-affect-swing-plane/',scope:'Spannweite länger/gleich/kürzer als Körpergröße → vorderer Arm über/auf/unter der Schulterlinie; Ellenbogen–mittlerer Knöchel länger/gleich/kürzer als Schultergelenk–Ellenbogen → Schulter-/Rumpf-/Hüftebene'},
 hip:{url:'https://golfwrx.com/205319/measure-your-hip-speed-to-determine-your-proper-setup/',author:'Bill Schmedes III',scope:'Langsame Hüfte → schwächerer Griff (ca. 2 Knöchel), mittel → Standardgriff, schnelle Hüfte → stärkerer Griff (3–3,5 Knöchel); keine numerische Messung'},
 horizons:{url:'https://newhorizonsgolf.com/BioSwingDynamics.html',author:'E.A. Tischler',scope:'Begriffe, oberste Rückschwungposition, Abschwungzonen und Bilder'}
};
// Eigene Arbeitsregel: Unterschiede bis 2 cm liegen im Bereich üblicher Messabweichungen und gelten als nahezu gleich.
const MEASUREMENT_TOL_CM=2;
function comparison(d){return Math.abs(d)<=MEASUREMENT_TOL_CM?'equal':d>0?'longer':'shorter';}
const joinDe=a=>a.length<2?(a[0]||''):a.slice(0,-1).join(', ')+' und '+a[a.length-1];
const lcFirst=s=>s?s[0].toLowerCase()+s.slice(1):s;

const POWER_TYPES={
 glide:{key:'glide',name:'Seitliches Bewegen · Glide',short:'Glide (seitlich)',adj:'eine seitliche Bewegung zum Ziel',feel:'eine kleine Bewegung des Beckens zum Ziel, während Kopf und Oberkörper hinter dem Ball bleiben'},
 spin:{key:'spin',name:'Drehen · Spin',short:'Spin (drehend)',adj:'eine drehende Bewegung',feel:'eine ruhige Drehung zum Ziel ohne zusätzliche Seitverschiebung'},
 launch:{key:'launch',name:'Drücken und Aufrichten · Launch',short:'Launch (vertikal)',adj:'Druck in den Boden und Aufrichten',feel:'Druck in den Boden und ein natürliches Aufrichten im Durchschwung'}
};
// Punktesystem nach Adams/Najar
const FOLD_POWER={'Side/Under':'glide','Side On':'spin','On Top':'launch'};
const POST_POWER={Rear:'glide',Center:'spin',Front:'launch'};
const HIP_POWER={Fast:['spin'],Mid:['spin','glide'],Slow:['launch']};
const CMP_POWER={longer:'glide',equal:'spin',shorter:'launch'};
// Griffrichtung: +1 stärker, 0 neutral, −1 schwächer
const TRAIL_GRIP={
 'Side/Under':{dir:1,text:'Hintere Hand: Handfläche eher nach oben (Under), das passt zu einem stärkeren Griff der hinteren Hand.'},
 'Side On':{dir:0,text:'Hintere Hand: Handfläche seitlich (Side On), das passt zu einem neutralen Griff der hinteren Hand.'},
 'On Top':{dir:-1,text:'Hintere Hand: Handfläche eher zum Boden (On Top), das passt zu einem schwächeren Griff der hinteren Hand.'}
};
const LEAD_FROM_HIP={Slow:'Schwächer',Mid:'Neutral',Fast:'Stärker'};
const GRIP_DIR={Schwächer:-1,Neutral:0,Stärker:1};
const DIR_WORD={'-1':'schwächer','0':'neutral','1':'stärker'};

function evaluateScreening({height,span,upper,fore,fold,leadgrip,post,pressure,hip,trial,focus,pain}){
 const valid=(...x)=>x.every(v=>Number.isFinite(v)&&v>0),evidence=[],gaps=[];
 const spanCmp=valid(height,span)?comparison(span-height):null,armCmp=valid(upper,fore)?comparison(fore-upper):null;

 // ---------- Bewegungstyp: Punkte aus bis zu fünf Tests ----------
 const votes=[];const add=(test,keys)=>{if(keys)[].concat(keys).forEach(k=>votes.push({test,key:k}));};
 add('Arm-Pendeltest',FOLD_POWER[fold]);add('Post-Test',POST_POWER[post]);add('Hip-Speed-Test',HIP_POWER[hip]);
 if(spanCmp)add('Spannweite',CMP_POWER[spanCmp]);if(armCmp)add('Armmaße',CMP_POWER[armCmp]);
 const testsUsed=new Set(votes.map(v=>v.test)).size;
 const points={glide:0,spin:0,launch:0};votes.forEach(v=>points[v.key]++);
 const sorted=Object.entries(points).sort((a,b)=>b[1]-a[1]);
 let power=null,powerMargin=0;
 if(testsUsed>=3){
  const [k1,p1]=sorted[0],p2=sorted[1][1];
  const pointText=sorted.map(([k,p])=>POWER_TYPES[k].short.split(' ')[0]+' '+p).join(' · ');
  if(p1===p2){
   power={key:'mixed',name:'Kombinierter Bewegungsansatz',short:'Mischform',text:'Deine Tests verteilen sich auf mehrere Bewegungstypen ('+pointText+'). Wir legen deshalb noch keinen einzelnen Typ fest und prüfen die Bewegung im Termin am Ball.',feel:null,points};
  }else{
   powerMargin=p1-p2;
   const pro=[...new Set(votes.filter(v=>v.key===k1).map(v=>v.test))];
   const foldKey=FOLD_POWER[fold];
   const armNote=foldKey&&foldKey!==k1?' Dein Arm-Pendeltest allein deutet auf '+POWER_TYPES[foldKey].short+'; die Mehrheit der Tests entscheidet.':'';
   power={...POWER_TYPES[k1],text:pro.length+' von '+testsUsed+' Tests sprechen für '+POWER_TYPES[k1].adj+' ('+joinDe(pro)+').'+armNote,points};
   evidence.push({rule:'five-test-power-points',source:'fivetests',status:'hypothesis'});
  }
 }else gaps.push('Für den Bewegungstyp fehlen Tests (mindestens drei nötig)');

 // ---------- Griff: hintere Hand aus dem Armtest, vordere Hand aus dem Hüfttempo ----------
 const handMatch=TRAIL_GRIP[fold]||null;
 const checked=[['Arm-Pendeltest',!!handMatch],['Post-/Pivot-Test',['Front','Center','Rear'].includes(post)],['Hip-Speed-Test',['Slow','Mid','Fast'].includes(hip)]];
 checked.forEach(([label,ok])=>{if(!ok)gaps.push(label+' noch offen');});
 const leadBase=leadgrip||LEAD_FROM_HIP[hip]||null;
 const leadDir=leadBase?GRIP_DIR[leadBase]:null,trailDir=handMatch?handMatch.dir:null;
 // Eigene Sicherheitsregel: zeigen beide Hände in entgegengesetzte Richtungen, wird der Griff nicht automatisch verändert.
 const gripConflict=!leadgrip&&leadDir!==null&&trailDir!==null&&leadDir*trailDir<0;
 const leadCandidate=gripConflict?null:leadBase;
 const leadText=leadgrip?'Vordere Hand: '+({Schwächer:'schwächerer',Neutral:'neutraler',Stärker:'stärkerer'}[leadgrip])+' Griffansatz, im Schlagvergleich bestätigt.'
  :({Slow:'Für die vordere Hand prüfen wir einen schwächeren Griffansatz am Ball.',Mid:'Für die vordere Hand prüfen wir einen neutralen Griffansatz am Ball.',Fast:'Für die vordere Hand prüfen wir einen stärkeren Griffansatz am Ball.'}[hip]||'Die vordere Hand ist noch offen.');
 const grip=gripConflict
  ?handMatch.text+' Dein Hip-Speed-Test spricht dagegen für einen '+DIR_WORD[leadDir]+'en Griff der vorderen Hand. Beide Hände in entgegengesetzte Richtungen zu verändern, empfehlen wir nicht. Deinen Griff prüfen wir deshalb im Termin am Ballflug.'
  :[handMatch?.text,leadText].filter(Boolean).join(' ');
 if(['Slow','Mid','Fast'].includes(hip))evidence.push({rule:'hip-speed-to-lead-grip',source:'hip',status:'hypothesis'});
 if(handMatch)evidence.push({rule:'arm-fold-to-trail-grip',source:'armtest',status:'hypothesis'});else gaps.push('Hand-/Armtest noch nicht eindeutig');

 const postText={Front:'Im Post-Test geht dein Gewicht eher aufs vordere Bein; erzwinge im Rückschwung keine Verlagerung nach hinten.',Center:'Im Post-Test bleibt dein Gewicht eher mittig; erzwinge keine zusätzliche Seitverschiebung.',Rear:'Im Post-Test geht dein Gewicht eher aufs hintere Bein; lass das im Rückschwung zu und bewege dich im Abschwung zum Ziel.'}[post]||'Die Drehachse ist noch offen.';
 const hipText={Slow:'Die Hüfte bleibt im Treffmoment relativ zum Rumpf zurück. Die Schlagfläche kann dadurch früher schließen.',Mid:'Hüfte und Rumpf arbeiten im Treffmoment gemeinsam.',Fast:'Die Hüfte ist dem Rumpf im Treffmoment voraus. Die Schlagfläche kann dadurch länger offen bleiben.'}[hip]||'Die Hüft-Abstimmung ist noch offen.';
 const pressureText={front:'Im Rückschwung spürst du mehr Druck unter dem vorderen Fuß.',center:'Im Rückschwung spürst du den Druck ähnlich unter beiden Füßen.',rear:'Im Rückschwung spürst du mehr Druck unter dem hinteren Fuß.'}[pressure]||'';
 const bodydetail=postText+' '+hipText+(pressureText?' '+pressureText:'');

 // ---------- Ebenen aus den Körpermaßen ----------
 let back=null,down=null;
 if(spanCmp){
  back={longer:{plane:'high',name:'Höhere Position',text:'Deine Spannweite ist länger als deine Körpergröße. Im Modell passt am höchsten Rückschwungpunkt eine Armposition oberhalb der Schulterlinie.'},shorter:{plane:'low',name:'Tiefere Position',text:'Deine Spannweite ist kürzer als deine Körpergröße. Im Modell passt am höchsten Rückschwungpunkt eine Armposition unterhalb der Schulterlinie.'},equal:{plane:'mid',name:'Mittlere Position',text:'Spannweite und Körpergröße sind nahezu gleich (Unterschied höchstens '+MEASUREMENT_TOL_CM+' cm). Im Modell passt am höchsten Rückschwungpunkt eine Armposition auf Höhe der Schulterlinie.'}}[spanCmp];
  evidence.push({rule:'span-height-to-top-position',source:'planes',status:'hypothesis'});
 }else gaps.push('Spannweite oder Körpergröße fehlt');
 if(armCmp){
  down={longer:{plane:'shoulder',name:'Höhere Abschwungzone · Schulter',text:'Das Maß Ellenbogen–Fingerknöchel ist länger als dein Oberarm. Im Modell prüfen wir einen höheren Bereich für Hände und Schläger im Abschwung.'},shorter:{plane:'shaft',name:'Tiefere Abschwungzone · Hüfte',text:'Das Maß Ellenbogen–Fingerknöchel ist kürzer als dein Oberarm. Im Modell prüfen wir einen tieferen Bereich für Hände und Schläger im Abschwung.'},equal:{plane:'elbow',name:'Mittlere Abschwungzone · Rumpf',text:'Die beiden Armmaße sind nahezu gleich (Unterschied höchstens '+MEASUREMENT_TOL_CM+' cm). Im Modell prüfen wir eine mittlere Zone für Hände und Schläger im Abschwung.'}}[armCmp];
  evidence.push({rule:'arm-ratio-to-delivery-zone',source:'planes',status:'hypothesis'});
 }else gaps.push('Armmaße fehlen');
 const armback={
  'Side/Under':{plane:'shaft',name:'Eher körpernah / flach',text:'Dein Armtest spricht für eine eher körpernahe Rückschwungführung.'},
  'Side On':{plane:'elbow',name:'Eher mittlere Führung',text:'Dein Armtest spricht für eine mittlere Rückschwungführung.'},
  'On Top':{plane:'shoulder',name:'Eher höhere Führung',text:'Dein Armtest spricht für eine höhere Rückschwungführung.'}
 }[fold]||null;
 if(armback)evidence.push({rule:'arm-fold-to-backswing-path',source:'armfold',status:'hypothesis'});

 // ---------- Handlungsanweisungen ----------
 const gripAction={
  'Schwächer':'Richte die Schlagfläche zum Ziel aus und zähle beim Blick nach unten die sichtbaren Fingerknöchel der vorderen Hand. Ziel sind etwa zwei Knöchel. Siehst du schon etwa zwei, bleibt dein Griff, wie er ist. Siehst du mehr, drehe die vordere Hand am Griff etwas zum Ziel hin, ohne die Schlagfläche mitzudrehen.',
  'Stärker':'Richte die Schlagfläche zum Ziel aus und zähle beim Blick nach unten die sichtbaren Fingerknöchel der vorderen Hand. Ziel sind etwa drei bis dreieinhalb Knöchel. Siehst du schon so viele, bleibt dein Griff, wie er ist. Siehst du weniger, drehe die vordere Hand am Griff etwas vom Ziel weg, ohne die Schlagfläche mitzudrehen.',
  'Neutral':'Richte die Schlagfläche zum Ziel aus und prüfe, wohin das V zwischen Daumen und Zeigefinger der vorderen Hand zeigt. Im neutralen Griff zeigt es etwa zum hinteren Auge. Passt das, bleibt dein Griff, wie er ist; sonst justierst du nur die vordere Hand nach, ohne die Schlagfläche mitzudrehen.'
 }[leadCandidate]||null;
 const topAction={high:'Am höchsten Punkt darf dein vorderer Arm oberhalb der Schulterlinie stehen.',mid:'Am höchsten Punkt orientierst du deinen vorderen Arm an der Schulterlinie.',low:'Am höchsten Punkt darf dein vorderer Arm unterhalb der Schulterlinie bleiben.'}[back?.plane]||'Die Höhe am höchsten Punkt ist noch offen.';
 const pathAction={shaft:'Führe die Arme im Rückschwung eher körpernah.',elbow:'Führe die Arme im Rückschwung auf einem mittleren Weg.',shoulder:'Erprobe eine eher höhere Armführung im Rückschwung, ohne die Schulter hochzuziehen.'}[armback?.plane]||'Die Armführung ist noch offen.';
 const backExplanation=armback?pathAction+' '+topAction+' Weg und Endposition sind zwei verschiedene Punkte.':'Der Armtest ist noch offen. '+topAction;
 const downAction={shaft:'Erprobe die tiefere, hüftnahe Armführung aus dem Bild in langsamen Probeschwüngen.',elbow:'Erprobe die mittlere, rumpfnahe Armführung aus dem Bild in langsamen Probeschwüngen.',shoulder:'Erprobe die höhere, schulternahe Armführung aus dem Bild in langsamen Probeschwüngen.'}[down?.plane]||null;

 // ---------- Vergleichspunkte nach Klarheit (eigene Arbeitsregel, 0 bis 3 Punkte) ----------
 // Körperbewegung: Vorsprung des führenden Bewegungstyps; Spin ist der mittlere Typ und erhält höchstens 1.
 // Griff: Hüfttempo langsam/schnell 2, passt die hintere Hand in dieselbe Richtung +1; widersprüchliche Hände = nicht verfügbar.
 // Maße: Abstand über der Messtoleranz; Spannweite 1 bis 5 cm, 2 bis 9 cm, 3 darüber; Armmaße 1 bis 3,5 cm, 2 bis 5 cm, 3 darüber.
 const FOCUS_NAME={motion:'Körperbewegung',grip:'Griffansatz',back:'Rückschwungführung',down:'Abschwungzone'};
 const POSTN={Front:'Front Post',Center:'Center Post',Rear:'Rear Post'};
 const f1=x=>(Math.round(Math.abs(x)*10)/10).toLocaleString('de-DE',{maximumFractionDigits:1});
 const mag=(d,a,b)=>{const x=Math.abs(d);return x<=MEASUREMENT_TOL_CM?0:x<=a?1:x<=b?2:3;};
 const clarity={
  motion:power&&power.key!=='mixed'?Math.min(power.key==='spin'?1:3,powerMargin):0,
  grip:gripConflict?0:(leadDir?2:0)+(leadDir&&leadDir===trailDir?1:0),
  back:valid(height,span)?mag(span-height,5,9):0,
  down:valid(upper,fore)?mag(fore-upper,3.5,5):0
 };
 const postCue={Front:' Lass das Gewicht im Rückschwung eher vorn; erzwinge keine Verlagerung nach hinten.',Center:' Halte das Gewicht im Rückschwung eher mittig.',Rear:' Lass das Gewicht im Rückschwung aufs hintere Bein gehen; die Bewegung zum Ziel folgt im Abschwung.'}[post]||'';
 const cues={
  motion:power?.feel?'Erprobe '+power.feel+'.'+postCue+' Halte die Bewegung klein und bleibe im Gleichgewicht.':null,
  grip:handMatch&&gripAction&&!gripConflict?gripAction+' Die hintere Hand und den Griffdruck behältst du dabei bei.':null,
  back:armback&&back?.plane?pathAction+' '+topAction+' Bewege dich langsam; erzwinge keine Endposition.':null,
  down:downAction
 };
 const order=['motion','grip','back','down'];
 const ranking=order.map((k,i)=>({key:k,name:FOCUS_NAME[k],available:!!cues[k],score:cues[k]?clarity[k]:0,i})).sort((a,b)=>b.score-a.score||a.i-b.i);
 const automaticFocus=(ranking.find(x=>x.available&&x.score>0)||ranking.find(x=>x.available)||{}).key||null;
 const chosenFocus=order.includes(focus)?focus:automaticFocus;
 const focusName=FOCUS_NAME[chosenFocus]||'offener Test';
 const cue=cues[chosenFocus]||null;
 const top=ranking.filter(x=>x.available&&x.score>0);
 const tied=top.filter(x=>x.score===top[0]?.score).map(x=>x.name);
 const tieNote=!order.includes(focus)&&tied.length>1?'Gleich deutlich sind '+joinDe(tied)+'. Wir beginnen mit '+tied[0]+', weil wir in der Reihenfolge Körperbewegung, Griff, Rückschwung, Abschwung aufbauen.':'';
 const handLabel=trailDir===null?null:DIR_WORD[trailDir];
 const findings={
  motion:power?power.name+(POSTN[post]?' · '+POSTN[post]:''):'noch offen',
  grip:gripConflict?'Uneinheitlich: vordere Hand '+DIR_WORD[leadDir]+', hintere Hand '+handLabel+' · noch keine Änderung':leadCandidate?'Vordere Hand '+leadCandidate.toLowerCase()+(handLabel?' · hintere Hand '+handLabel:''):'noch offen',
  back:back?back.name+(armback?' · Führung: '+lcFirst(armback.name):''):'noch offen',
  down:down?down.name:'noch offen'
 };
 const HIPWHY={Slow:'Dein Hip-Speed-Test zeigt: Die Hüfte bleibt relativ zum Rumpf zurück.',Mid:'Dein Hip-Speed-Test zeigt: Hüfte und Rumpf öffnen gemeinsam.',Fast:'Dein Hip-Speed-Test zeigt: Die Hüfte ist dem Rumpf voraus.'};
 const dSpan=valid(height,span)?span-height:null,dArm=valid(upper,fore)?fore-upper:null;
 const diffText=(d,a,b)=>Math.abs(d)<=MEASUREMENT_TOL_CM?a+' ist nahezu gleich wie '+b+' ('+(Math.abs(d)<1e-7?'gleich':f1(d)+' cm Unterschied')+').':a+' ist '+f1(d)+' cm '+(d>0?'länger':'kürzer')+' als '+b+'.';
 const focusWhyAll={
  motion:power?power.text:'',
  grip:(HIPWHY[hip]||'')+(handMatch?' '+handMatch.text:''),
  back:dSpan===null?'':diffText(dSpan,'Deine Spannweite','deine Körpergröße'),
  down:dArm===null?'':diffText(dArm,'Dein Armmaß Ellenbogen–Fingerknöchel','dein Oberarm')
 };
 const compareCue=cue?'Dein Vergleichspunkt: '+focusName+'. '+cue+' Alle anderen Punkte beibehalten.':'Zuerst die offenen Tests klären; noch keine Änderung auswählen.';
 const restricted=!!pain&&pain!=='Keine angegeben';
 const effectiveTrial=cue?trial:'';
 const status=restricted?'paused':!cue?'open':effectiveTrial==='better'?'favorable':effectiveTrial==='worse'?'rejected':'compare';
 let task,criterion,next,priority,planTitle,steps,decision=null;
 if(status==='paused'){
  priority='Dein Hinweis: beschwerdefreie Bewegung klären.';
  planTitle='Bis zur Klärung keine neue Bewegungsübung';
  steps=[{title:'Auslassen',text:'Die betroffene Bewegung auslassen.'},{title:'Nur Schmerzfreies',text:'Nur die im Termin ausdrücklich besprochene, schmerzfreie Bewegung ausführen.'}];
  criterion='Bei Schmerzen sofort beenden.';
  next='Wir klären zuerst, welche Bewegungen du beschwerdefrei ausführen kannst.';
 }else if(status==='open'){
  priority='Dein Hinweis: erst den Ausgangspunkt festhalten.';
  planTitle='Noch keine neue Bewegung festlegen';
  steps=[{title:'Gewohnt schlagen',text:'Mit Eisen 7 zehn lockere Bälle wie gewohnt schlagen.'},{title:'Zählen und notieren',text:'Saubere Treffer zählen und die häufigste Ballkurve notieren.'}];
  criterion='Diese Werte sind die Grundlage für den nächsten Vergleich.';
  next='Wir wiederholen die offenen Tests und wählen daraus einen einzelnen Vergleichspunkt.';
 }else if(status==='rejected'){
  priority='Dein Ergebnis: Bei der gewohnten Bewegung bleiben.';
  planTitle='Den ungünstigen Ansatz vorerst weglassen';
  steps=[{title:'Gewohnt schlagen',text:'Mit Eisen 7 zehn lockere Bälle wie gewohnt schlagen.'},{title:'Zählen und notieren',text:'Trefferzahl und häufigste Ballkurve als Ausgangspunkt festhalten.'}];
  criterion='Die getestete Änderung wird vorerst nicht übernommen.';
  next='Wir prüfen, weshalb der Vergleich für '+focusName+' ungünstiger war, und wählen einen anderen Ansatz.';
 }else{
  priority=(status==='favorable'?'Dein Vergleichspunkt: ':'Dein erster Vergleichspunkt: ')+focusName+'.';
  planTitle=status==='favorable'?'So sicherst du den günstigen Kurzvergleich ab':'So prüfst du es';
  steps=[
   {title:'Ausprobieren',text:'Zuerst fünf langsame Probeschwünge ohne Ball. '+cue},
   {title:'Am Ball vergleichen',text:'Mit Eisen 7 und lockerem Tempo: fünf Bälle wie gewohnt, danach fünf Bälle mit dem Ansatz. Alles andere bleibt gleich.'},
   {title:'Zählen und wiederholen',text:'Saubere Treffer eintragen. In einer zweiten Einheit alles noch einmal, diesmal mit umgekehrter Reihenfolge.'}
  ];
  decision={adopt:'In beiden Einheiten mehr saubere Treffer und ein mindestens ebenso angenehmes Gefühl: Du übernimmst den Ansatz.',keep:'Sonst spielst du wie gewohnt weiter. Der Ansatz wird dann nicht übernommen.'};
  criterion=decision.adopt+' '+decision.keep;
  next='Bringe die Trefferzahlen beider Einheiten mit. Wir prüfen '+focusName+' am Ballflug und entscheiden, ob du den Ansatz beibehältst.';
 }
 task=steps.map(x=>x.text).join(' ');
 const trialText={favorable:'Der Kurzvergleich für '+focusName+' war günstiger; wir überprüfen den Vorteil erneut.',rejected:'Der Kurzvergleich für '+focusName+' war ungünstiger.',compare:effectiveTrial==='same'?'Der Vergleich für '+focusName+' zeigte keinen klaren Vorteil.':effectiveTrial==='unclear'?'Der Vergleich für '+focusName+' war uneindeutig.':'Der Ansatz für '+focusName+' ist noch nicht am Ball bestätigt.',open:'Ein geeigneter Vergleichspunkt ist noch offen.',paused:'Die Bewegungsänderung ist zurückgestellt.'}[status];

 return {ranking:ranking.map(x=>({key:x.key,name:x.name,available:x.available,score:x.score,finding:findings[x.key]})),tieNote,focusWhy:focusWhyAll[chosenFocus]||'',decision,armback,leadCandidate,handGrip:handMatch?.text||'',gripConflict,compareCue,focusName,chosenFocus,backExplanation,priority,planTitle,steps,status,grip,bodydetail,trialText,conflict:power?.key==='mixed',screenComplete:checked.every(x=>x[1])&&!!back?.plane&&!!down?.plane,power,back,down,restricted,evidence,gaps,task,criterion,next};
}
