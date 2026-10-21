// Four screening blocks, three customer outcomes. Source-specific coaching hypotheses.
const RULE_SOURCES={
 gripmeaning:{url:'https://golf.com/instruction/weak-grip-strong-grip-explainer-play-smart/',scope:'Griffstärke: sichtbare Knöchel der vorderen Hand; keine festen universellen Winkel'},
 armtest:{url:'https://golf.com/instruction/grip-golf-club-test-can-tell-you/',author:'Debbie Doniger, vorgestellt von Zephyr Melton',scope:'Armtest in Golfhaltung, ruhige Schultern, Stopp Hüfthöhe, hintere Hand'},
 armplane:{url:'https://appmesolutions.wixsite.com/vero-golf-pro/bioswing-dynamics-certification-exam',author:'Sal Spallone',scope:'Armfaltung → vorläufige Rückschwungführung; On-Top-Ausnahmen beachten'},
 pivot:{url:'https://golf.com/instruction/five-easy-tests-to-gain-at-least-20-yards-with-your-driver/',author:'Mike Adams / Bernie Najar',scope:'Schläger an Oberschenkeln, Drehung und Beckenbewegung beobachten'},
 hip:{url:'https://golfwrx.com/205319/measure-your-hip-speed-to-determine-your-proper-setup/',author:'Bill Schmedes III',scope:'Eigenes Lehrmodell: relative Hüft-/Rumpfrotation und Griffvergleich, keine universelle BSD-Regel'},
 planes:{url:'https://www.advanceddynamicgolfcenter.com/post/what-is-bio-swing-mechanics',scope:'Spannweite → oberste Rückschwungposition; Ellenbogen–Knöchel/Oberarm → Abschwungzone'},
 power:{url:'https://golf.com/instruction/hall-of-fame-teacher-3-thoughts-3-golfers/',original:'https://www.instagram.com/tv/CUuUEsDgwnq/',scope:'Mike Adams: hintere Hand unter/seitlich/oberhalb passt zu seitlich/rotierend/vertikal'},
 horizons:{url:'https://newhorizonsgolf.com/BioSwingDynamics.html',author:'E.A. Tischler',scope:'Begriffserklärung, oberste Rückschwungposition, Abschwungzonen und Bilder'}
};
const MEASUREMENT_MARGIN_CM=1; // Operational re-measurement band; not an official BSD boundary.
function comparison(d){if(Math.abs(d)<1e-7)return 'equal';if(Math.abs(d)<=MEASUREMENT_MARGIN_CM)return 'uncertain';return d>0?'longer':'shorter';}
function evaluateScreening({height,span,upper,fore,fold,leadgrip,post,pressure,hip,powerobs,powerbasis,trial,focus,pain}){
 const valid=(...x)=>x.every(v=>Number.isFinite(v)&&v>0),evidence=[],gaps=[];
 const powers={
  'Side/Under':{key:'glide',name:'Seitliches Bewegen · Glide',text:'Dein Armtest spricht für eine kleine seitliche Körperbewegung zum Ziel.',grip:'Hintere Hand eher unterhalb: stärkerer Griffansatz.',feel:'eine kleine seitliche Bewegung zum Ziel'},
  'Side On':{key:'spin',name:'Drehen · Spin',text:'Dein Armtest spricht für eine stärker drehende Körperbewegung.',grip:'Hintere Hand seitlich: neutraler Griffansatz.',feel:'eine ruhige Drehung zum Ziel'},
  'On Top':{key:'launch',name:'Drücken und Aufrichten · Launch',text:'Dein Armtest spricht für Druck in den Boden und koordiniertes Aufrichten.',grip:'Hintere Hand eher oberhalb: schwächerer Griffansatz.',feel:'Druck in den Boden und ein natürliches Aufrichten im Durchschwung'}
 };
 let power=powers[fold]||null;
 const handMatch=power,observed=Object.values(powers).find(p=>p.key===powerobs);
 const conflict=!!(observed&&handMatch&&observed.key!==handMatch.key);
 if(observed&&powerbasis){
  power={...observed,text:'Im Dynamikvergleich zeigte sich ein '+({glide:'seitlicher',spin:'drehender',launch:'vertikaler'})[observed.key]+' Bewegungsansatz.'};
  evidence.push({rule:'coach-power-result',source:'horizons',status:powerbasis==='plates'?'coach-reported-measurement':'observed'});
 }else if(powerobs==='mixed'){
  power={key:'mixed',name:'Kombinierter Bewegungsansatz',text:'Dein Dynamiktest zeigt eine Mischform. Wir reduzieren deine Bewegung deshalb nicht auf einen einzigen Krafttyp.',feel:null};
 }else if(powerobs==='unclear'||(observed&&!powerbasis)){power=null;}
 if(conflict){power=null;gaps.push('Hand-/Armtest und Dynamikvergleich passen noch nicht zusammen');}
 const checked=[['Arm-Pendeltest',!!handMatch],['Post-/Pivot-Test',['Front','Center','Rear'].includes(post)],['Hip-Speed-Test',['Slow','Mid','Fast'].includes(hip)]];
 if(powerobs&&!powerbasis)gaps.push('Grundlage der Zusatzuntersuchung fehlt');
 checked.forEach(([label,ok])=>{if(!ok)gaps.push(label+' noch offen');});
 const grip=[handMatch?.grip,leadgrip?'Vordere Hand: '+leadgrip.toLowerCase()+'er Griffansatz im Test.':({Slow:'Für die vordere Hand prüfen wir einen schwächeren Griffansatz am Ball.',Mid:'Für die vordere Hand prüfen wir einen neutralen Griffansatz am Ball.',Fast:'Für die vordere Hand prüfen wir einen stärkeren Griffansatz am Ball.'}[hip]||'Die vordere Hand ist noch offen.')].filter(Boolean).join(' ').replace('neutraler er','neutraler');
 const postText={Front:'Deine Drehachse liegt eher vorn; erzwinge im Rückschwung keine Verlagerung nach hinten.',Center:'Deine Drehachse liegt eher mittig; erzwinge keine zusätzliche Seitverschiebung.',Rear:'Deine Drehachse liegt eher auf der hinteren Seite; lasse diesen Drehpunkt im Rückschwung zu.'}[post]||'Die Drehachse ist noch offen.';
 const hipText={Slow:'Die Hüfte bleibt relativ zum Rumpf zurück. Die Schlagfläche kann früher schließen; Griff und Arm-/Körperbewegung gemeinsam prüfen.',Mid:'Deine Hüfte öffnet im Test mittel: Drehung und Armbewegung gemeinsam koordinieren.',Fast:'Die Hüfte ist dem Rumpf voraus. Die Schlagfläche kann länger offen bleiben; Griff und Arm-/Körperbewegung gemeinsam prüfen.'}[hip]||'Die Hüft-Abstimmung ist noch offen.';
 if(['Slow','Mid','Fast'].includes(hip))evidence.push({rule:'relative-hip-to-lead-grip-trial',source:'hip',status:'hypothesis'});
 const pressureText={front:'Im Rückschwung spürst du mehr Druck unter dem vorderen Fuß.',center:'Im Rückschwung spürst du den Druck ähnlich unter beiden Füßen.',rear:'Im Rückschwung spürst du mehr Druck unter dem hinteren Fuß.'}[pressure]||'';
 const bodydetail=postText+' '+hipText+(pressureText?' '+pressureText:'')+(conflict?' Hand- und Dynamiktest widersprechen sich; vor einer Änderung erneut prüfen.':'');

 if(handMatch)evidence.push({rule:'trail-hand-to-motion-match',source:'power',status:'hypothesis'});else gaps.push('Hand-/Armtest noch nicht eindeutig');
 let back=null,down=null;
 if(valid(height,span)){
  const c=comparison(span-height);
  const data={longer:{plane:'high',name:'Höhere Position',text:'Deine Spannweite ist länger als deine Körpergröße. Im Modell passt am höchsten Rückschwungpunkt eine Armposition oberhalb der Schulterlinie.'},shorter:{plane:'low',name:'Tiefere Position',text:'Deine Spannweite ist kürzer als deine Körpergröße. Im Modell passt am höchsten Rückschwungpunkt eine Armposition unterhalb der Schulterlinie.'},equal:{plane:'mid',name:'Mittlere Position',text:'Spannweite und Körpergröße sind gleich. Im Modell passt am höchsten Rückschwungpunkt eine Armposition auf Höhe der Schulterlinie.'},uncertain:{plane:null,name:'Nahezu gleich · noch offen',text:'Spannweite und Körpergröße unterscheiden sich nur wenig. Miss erneut; daraus wählen wir noch keine hohe oder tiefe Position.'}};
  back=data[c];evidence.push({rule:'span-height-to-top-position',source:'planes',status:c==='uncertain'?'uncertain':'hypothesis'});if(c==='uncertain')gaps.push('Spannweite/Körpergröße erneut messen');
 }else gaps.push('Spannweite oder Körpergröße fehlt');
 if(valid(upper,fore)){
  const c=comparison(fore-upper);
  const data={longer:{plane:'shoulder',name:'Höhere Abschwungzone · Schulter',text:'Das Maß Ellenbogen–Fingerknöchel ist länger als dein Oberarm. Im Modell prüfen wir einen höheren Bereich für Hände und Schläger im Abschwung.'},shorter:{plane:'shaft',name:'Tiefere Abschwungzone · Hüfte',text:'Das Maß Ellenbogen–Fingerknöchel ist kürzer als dein Oberarm. Im Modell prüfen wir einen tieferen Bereich für Hände und Schläger im Abschwung.'},equal:{plane:'elbow',name:'Mittlere Abschwungzone · Rumpf',text:'Die beiden Armmaße sind gleich. Im Modell prüfen wir eine mittlere Zone für Hände und Schläger im Abschwung.'},uncertain:{plane:null,name:'Armmaße nahezu gleich · noch offen',text:'Die beiden Armmaße unterscheiden sich nur wenig. Miss erneut; daraus legen wir noch keine Abschwungzone fest.'}};
  down=data[c];evidence.push({rule:'arm-ratio-to-delivery-zone',source:'planes',status:c==='uncertain'?'uncertain':'hypothesis'});if(c==='uncertain')gaps.push('Armmaße erneut messen');
 }else gaps.push('Armmaße fehlen');
 const armback={
 'Side/Under':{plane:'shaft',name:'Eher körpernah / flach',text:'Dein Armtest spricht für eine eher körpernahe Rückschwungführung. Das ist ein Startansatz; die Höhe am obersten Punkt folgt aus deinen Proportionen.'},
 'Side On':{plane:'elbow',name:'Eher mittlere Führung',text:'Dein Armtest spricht für eine mittlere Rückschwungführung. Die Höhe am obersten Punkt folgt getrennt aus deinen Proportionen.'},
 'On Top':{plane:'shoulder',name:'Eher höhere Führung',text:'Dein Armtest spricht zunächst für eine höhere Rückschwungführung. Körperbau und Beweglichkeit können diesen Ansatz verändern.'}
 }[fold]||null;
 if(armback)evidence.push({rule:'arm-fold-to-backswing-path',source:'armplane',status:'hypothesis'});
 const leadCandidate=leadgrip||({Slow:'Schwächer',Mid:'Neutral',Fast:'Stärker'}[hip]||null);
 const gripAction={
 'Schwächer':'Richte die Schlagfläche zum Ziel. Drehe die vordere Hand am Griff etwas, bis du beim Blick nach unten weniger Fingerknöchel als gewohnt siehst. Die Schlagfläche bleibt unverändert.',
 'Stärker':'Richte die Schlagfläche zum Ziel. Drehe die vordere Hand am Griff etwas, bis du beim Blick nach unten mehr Fingerknöchel als gewohnt siehst. Die Schlagfläche bleibt unverändert.',
 'Neutral':'Richte die Schlagfläche zum Ziel aus und erzwinge für die vordere Hand keine zusätzliche Drehung. Einen neutralen Ansatz zuerst im gemeinsamen Griffvergleich prüfen.'
 }[leadCandidate]||null;
 const topAction={high:'Am höchsten Punkt darf dein vorderer Arm oberhalb der Schulterlinie stehen.',mid:'Am höchsten Punkt orientierst du deinen vorderen Arm an der Schulterlinie.',low:'Am höchsten Punkt darf dein vorderer Arm unterhalb der Schulterlinie bleiben.'}[back?.plane]||'Die Höhe am höchsten Punkt bleibt bis zur Nachmessung offen.';
 const pathAction={shaft:'Beginne den Rückschwung eher körpernah.',elbow:'Beginne mit einer mittleren Armführung.',shoulder:'Erprobe eine eher höhere Armführung, ohne die Schulter hochzuziehen.'}[armback?.plane]||'Die Armführung ist noch offen.';
 const backExplanation=armback?pathAction+' '+topAction+' Weg und Endposition sind zwei verschiedene Punkte.':'Der Armtest ist noch offen. '+topAction;
 const downAction={shaft:'Erprobe die tiefere, hüftnahe Armführung aus dem Bild in langsamen Probeschwüngen.',elbow:'Erprobe die mittlere, rumpfnahe Armführung aus dem Bild in langsamen Probeschwüngen.',shoulder:'Erprobe die höhere, schulternahe Armführung aus dem Bild in langsamen Probeschwüngen.'}[down?.plane]||null;
 // Vergleichspunkte: eigene Arbeitsregel, kein offizieller BSD-Grenzwert.
 // Je deutlicher ein Testergebnis vom mittleren Bereich abweicht, desto weiter vorn steht der Punkt.
 // Bei Gleichstand: Körperbewegung vor Griff vor Rückschwung vor Abschwung. Eine Auswahl des Trainers hat Vorrang.
 const FOCUS_NAME={motion:'Körperbewegung',grip:'Griffansatz',back:'Rückschwungführung',down:'Abschwungzone'};
 const POSTN={Front:'Front Post',Center:'Center Post',Rear:'Rear Post'};
 const f1=x=>(Math.round(Math.abs(x)*10)/10).toLocaleString('de-DE',{maximumFractionDigits:1});
 const mag=(d,a,b)=>{const x=Math.abs(d);return x<1e-7?1:x<=MEASUREMENT_MARGIN_CM?0:x<=a?1:x<=b?2:3;};
 const clarity={
  motion:(handMatch?(fold==='Side On'?1:2):0)+(['Front','Rear'].includes(post)?1:0),
  grip:['Slow','Fast'].includes(hip)?2+(handMatch&&fold!=='Side On'?1:0):0,
  back:valid(height,span)?mag(span-height,3,6):0,
  down:valid(upper,fore)?mag(fore-upper,2,4):0
 };
 const postCue={Front:' Drehe im Rückschwung über die vordere Seite, ohne das Becken seitlich zu erzwingen.',Center:' Halte das Becken im Rückschwung mittig.',Rear:' Lass im Rückschwung den hinteren Drehpunkt zu; die Bewegung zum Ziel folgt im Abschwung.'}[post]||'';
 const cues={
  motion:power?.feel?'Erprobe '+power.feel+'.'+postCue+' Halte die Bewegung klein und bleibe im Gleichgewicht.':null,
  grip:handMatch&&gripAction?gripAction+' Hintere Handstellung und Griffdruck dabei beibehalten.':null,
  back:armback&&back?.plane?pathAction+' '+topAction+' Bewege dich langsam; erzwinge keine Endposition.':null,
  down:downAction
 };
 const order=['motion','grip','back','down'];
 const ranking=order.map((k,i)=>({key:k,name:FOCUS_NAME[k],available:!!cues[k],score:cues[k]?clarity[k]:0,i})).sort((a,b)=>b.score-a.score||a.i-b.i);
 const automaticFocus=(ranking.find(x=>x.available&&x.score>0)||ranking.find(x=>x.available)||{}).key||null;
 const chosenFocus=order.includes(focus)?focus:automaticFocus;
 const focusName=FOCUS_NAME[chosenFocus]||'offener Test';
 const cue=cues[chosenFocus]||null;
 const handLabel={'Side/Under':'stärker','Side On':'neutral','On Top':'schwächer'}[fold];
 const findings={
  motion:power?power.name+(POSTN[post]?' · '+POSTN[post]:''):'noch offen',
  grip:leadCandidate?'Vordere Hand '+leadCandidate.toLowerCase()+(handLabel?' · hintere Hand '+handLabel:''):'noch offen',
  back:back?back.name+(armback?' · Führung: '+armback.name.toLowerCase():''):'noch offen',
  down:down?down.name:'noch offen'
 };
 const POSTWHY={Front:' Dein Post-Test zeigt eine Drehachse eher vorn.',Center:' Dein Post-Test zeigt eine mittige Drehachse.',Rear:' Dein Post-Test zeigt eine Drehachse eher hinten.'};
 const HIPWHY={Slow:'Dein Hip-Speed-Test zeigt: Die Hüfte bleibt relativ zum Rumpf zurück.',Mid:'Dein Hip-Speed-Test zeigt: Hüfte und Rumpf öffnen gemeinsam.',Fast:'Dein Hip-Speed-Test zeigt: Die Hüfte ist dem Rumpf voraus.'};
 const dSpan=valid(height,span)?span-height:null,dArm=valid(upper,fore)?fore-upper:null;
 const focusWhyAll={
  motion:power?power.text+(POSTWHY[post]||''):'',
  grip:(HIPWHY[hip]||'')+(handMatch?' '+handMatch.grip:''),
  back:dSpan===null?'':Math.abs(dSpan)<1e-7?'Deine Spannweite entspricht deiner Körpergröße.':'Deine Spannweite ist '+f1(dSpan)+' cm '+(dSpan>0?'länger':'kürzer')+' als deine Körpergröße.',
  down:dArm===null?'':Math.abs(dArm)<1e-7?'Dein Armmaß Ellenbogen–Fingerknöchel entspricht deinem Oberarm.':'Dein Armmaß Ellenbogen–Fingerknöchel ist '+f1(dArm)+' cm '+(dArm>0?'länger':'kürzer')+' als dein Oberarm.'
 };
 const compareCue=cue?'Dein Vergleichspunkt: '+focusName+'. '+cue+' Alle anderen Punkte beibehalten.':'Zuerst die offenen Tests klären; noch keine Änderung auswählen.';
 const restricted=!!pain&&pain!=='Keine angegeben';
 const effectiveTrial=cue?trial:'';
 const status=restricted?'paused':!cue||conflict?'open':effectiveTrial==='better'?'favorable':effectiveTrial==='worse'?'rejected':'compare';
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

 return {ranking:ranking.map(x=>({key:x.key,name:x.name,available:x.available,score:x.score,finding:findings[x.key]})),focusWhy:focusWhyAll[chosenFocus]||'',decision,armback,leadCandidate,compareCue,focusName,chosenFocus,backExplanation,priority,planTitle,steps,status,grip,bodydetail,trialText,conflict,screenComplete:checked.every(x=>x[1])&&!!back?.plane&&!!down?.plane,power,back,down,restricted,evidence,gaps,task,criterion,next};
}
