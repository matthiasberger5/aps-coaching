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
 // Own coaching workflow: explicit comparison wins; otherwise choose one available starting point.
 const automaticFocus=handMatch&&leadCandidate&&['Slow','Fast'].includes(hip)?'grip':power?.feel?'motion':armback&&back?.plane?'back':down?.plane?'down':null;
 const chosenFocus=['motion','grip','back','down'].includes(focus)?focus:automaticFocus;
 const focusName={motion:'Körperbewegung',grip:'Griffansatz',back:'Rückschwungführung',down:'Abschwungzone'}[chosenFocus]||'offener Test';
 const cue={
  motion:power?.feel?'Erprobe '+power.feel+'. Halte die Bewegung klein; bleibe im Gleichgewicht.':null,
  grip:handMatch&&gripAction?gripAction+' Hintere Handstellung und Griffdruck dabei beibehalten.':null,
  back:armback&&back?.plane?pathAction+' '+topAction+' Bewege dich langsam; erzwinge keine Endposition.':null,
  down:downAction
 }[chosenFocus]||null;
 const compareCue=cue?'Dein Vergleichspunkt: '+focusName+'. '+cue+' Alle anderen Punkte beibehalten.':'Zuerst die offenen Tests klären; noch keine Änderung auswählen.';
 const restricted=!!pain&&pain!=='Keine angegeben';
 const effectiveTrial=cue?trial:'';
 const status=restricted?'paused':!cue||conflict?'open':effectiveTrial==='better'?'favorable':effectiveTrial==='worse'?'rejected':'compare';
 let task,criterion,next,priority,planTitle,steps;
 if(status==='paused'){
  priority='Deine erste Aufgabe: beschwerdefreie Bewegung klären.';
  planTitle='Bis zur Klärung keine neue Bewegungsübung';
  steps=['Betroffene Bewegung auslassen.','Nur die im Termin ausdrücklich besprochene, schmerzfreie Bewegung ausführen.'];
  criterion='Bei Schmerzen beenden.';
  next='Wir klären zuerst, welche Bewegungen du beschwerdefrei ausführen kannst.';
 }else if(status==='open'){
  priority='Deine erste Aufgabe: Ausgangspunkt festhalten.';
  planTitle='Noch keine neue Bewegung festlegen';
  steps=['Mit Eisen 7 zehn lockere Bälle gewohnt schlagen.','Saubere Treffer zählen und häufigste Ballkurve notieren.'];
  criterion='Diese Werte bilden die Grundlage für den nächsten Vergleich.';
  next='Wir wiederholen die offenen Tests und wählen daraus einen einzelnen Vergleichspunkt.';
 }else if(status==='rejected'){
  priority='Deine erste Aufgabe: bei der gewohnten Bewegung bleiben.';
  planTitle='Den ungünstigen Ansatz vorerst weglassen';
  steps=['Mit Eisen 7 zehn lockere Bälle gewohnt schlagen.','Trefferzahl und häufigste Ballkurve als Ausgangspunkt notieren.'];
  criterion='Die getestete Änderung vorerst nicht übernehmen.';
  next='Wir prüfen, weshalb der Vergleich für '+focusName+' ungünstiger war, und wählen einen anderen Ansatz.';
 }else{
  priority='Deine erste Aufgabe: nur '+focusName+' '+(status==='favorable'?'erneut vergleichen.':'vergleichen.');
  planTitle=status==='favorable'?'Den günstigen Kurzvergleich wiederholen':'Vergleichsübung — noch keine feste Umstellung';
  steps=[cue,'5 langsame Probeschwünge ohne Ball. Mit Eisen 7 je 5 Bälle gewohnt und mit dem Ansatz schlagen. Alles andere beibehalten.','In zwei kurzen Einheiten saubere Treffer zählen und das Bewegungsgefühl vergleichen.'];
  criterion='Nur übernehmen bei mehr sauberen Treffern in beiden Einheiten und mindestens ebenso angenehmem Gefühl. Sonst gewohnt weiterspielen.';
  next='Bringe die Trefferzahlen beider Einheiten mit. Wir prüfen '+focusName+' am Ballflug und entscheiden, ob du den Ansatz beibehältst.';
 }
 task=steps.join(' ');
 const trialText={favorable:'Der Kurzvergleich für '+focusName+' war günstiger; wir überprüfen den Vorteil erneut.',rejected:'Der Kurzvergleich für '+focusName+' war ungünstiger.',compare:effectiveTrial==='same'?'Der Vergleich für '+focusName+' zeigte keinen klaren Vorteil.':effectiveTrial==='unclear'?'Der Vergleich für '+focusName+' war uneindeutig.':'Der Ansatz für '+focusName+' ist noch nicht am Ball bestätigt.',open:'Ein geeigneter Vergleichspunkt ist noch offen.',paused:'Die Bewegungsänderung ist zurückgestellt.'}[status];

 return {armback,leadCandidate,compareCue,focusName,chosenFocus,backExplanation,priority,planTitle,steps,status,grip,bodydetail,trialText,conflict,screenComplete:checked.every(x=>x[1])&&!!back?.plane&&!!down?.plane,power,back,down,restricted,evidence,gaps,task,criterion,next};
}
