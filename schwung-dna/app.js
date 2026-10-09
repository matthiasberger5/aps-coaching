const ids=['name','date','hand','height','span','upper','fore','fold','leadgrip','post','pressure','hip','trial','focus','pain','finding','email'];
const el=id=>document.getElementById(id),val=id=>el(id).value;
const number=id=>val(id)===''?null:Number(val(id));
const fmt=x=>x.toLocaleString('de-DE',{maximumFractionDigits:1});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function localDate(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
const PICTURES={
 gripweak:{src:'assets/grip/comparison.png',width:448,height:560,crop:{x:1232,y:508,width:448,height:560},caption:'Vordere Hand schwächer: weniger sichtbare Knöchel. Nur die vordere Hand etwas verändern; die hintere Hand beibehalten. Foto: HackMotion.',pdfCaption:'Weniger Knöchel der vorderen Hand. Foto: HackMotion.'},
 gripneutral:{src:'assets/grip/comparison.png',width:448,height:560,crop:{x:672,y:508,width:448,height:560},caption:'Vordere Hand neutral: Beispiel zur Orientierung, kein verbindlicher Knöchelwert. Hintere Hand separat aus deinem Test. Foto: HackMotion.',pdfCaption:'Neutrales Beispiel der vorderen Hand. Foto: HackMotion.'},
 gripstrong:{src:'assets/grip/comparison.png',width:448,height:560,crop:{x:112,y:508,width:448,height:560},caption:'Vordere Hand stärker: mehr sichtbare Knöchel. Nur die vordere Hand etwas verändern; die hintere Hand beibehalten. Foto: HackMotion.',pdfCaption:'Mehr Knöchel der vorderen Hand. Foto: HackMotion.'},

 under:{pdfCaption:'Under: Handfläche eher nach oben; Armstreckung eher nach außen.',src:'assets/new-horizons/swing_path_under_sequence1a-360x131.png',width:360,height:131,caption:'Under: hintere Handfläche eher nach oben; die Armstreckung verläuft eher nach außen. Beispiel der Armbewegung, keine Griff-Nahaufnahme.'},
 sideon:{pdfCaption:'Side On: Handfläche eher seitlich; Armstreckung nach unten und außen.',src:'assets/new-horizons/swing_path_side-on_seqjuence1a-360x143.png',width:360,height:143,caption:'Side On: hintere Handfläche eher seitlich; die Armstreckung verläuft nach unten und außen. Beispiel der Armbewegung, keine Griff-Nahaufnahme.'},
 ontop:{pdfCaption:'On Top: Handfläche eher zum Boden; Armstreckung eher nach unten.',src:'assets/new-horizons/swing_path_on-top_sequence1a-360x139.png',width:360,height:139,caption:'On Top: hintere Handfläche eher zum Boden; die Armstreckung verläuft eher nach unten. Beispiel der Armbewegung, keine Griff-Nahaufnahme.'},

 track:{src:'assets/new-horizons/Swing_Track_3_topsets4-375x190.png',width:375,height:190,caption:'Vorderer Arm am höchsten Punkt: links unterhalb, mittig auf Höhe, rechts oberhalb der Schulterlinie.'},
 shaft:{pdfCaption:'Hüftnahe Abschwungzone. Modellbereich: Steißbein bis Nabel.',src:'assets/new-horizons/slotting_-down_RDL_2-405x231.png',width:405,height:231,caption:'Hüftnahe Zone: Hände und Schläger werden im unteren Bereich zum Ball geführt. Der Modellbereich reicht vom Steißbein bis zum Nabel.'},
 elbow:{pdfCaption:'Rumpfnahe Abschwungzone. Modellbereich: Nabel bis unteres Brustbein.',src:'assets/new-horizons/slotting_-cross_RDL_2-405x217.png',width:405,height:217,caption:'Rumpfnahe Zone: Hände und Schläger werden im mittleren Bereich zum Ball geführt. Der Modellbereich reicht vom Nabel bis zum unteren Brustbein.'},
 shoulder:{pdfCaption:'Schulternahe Abschwungzone. Modellbereich: unteres Brustbein bis Schädelansatz.',src:'assets/new-horizons/slotting_-shoulder_RDL_2-405x226.png',width:405,height:226,caption:'Schulternahe Zone: Hände und Schläger werden im höheren Bereich zum Ball geführt. Der Modellbereich reicht vom unteren Brustbein bis zum Schädelansatz.'}
};
function buildReport(){
 const h=number('height'),w=number('span'),u=number('upper'),f=number('fore');
 const complete=[h,w,u,f].every(x=>x!==null&&Number.isFinite(x)&&x>0);
 const model=evaluateScreening({height:h,span:w,upper:u,fore:f,fold:val('fold'),leadgrip:val('leadgrip'),post:val('post'),pressure:val('pressure'),hip:val('hip'),trial:val('trial'),focus:val('focus'),pain:val('pain')});
 const finding=model.restricted?'Beschwerden wurden angegeben; wir empfehlen noch keine Bewegungsänderung.':complete?'Deine Tests liefern Ansätze für Griff, Körperbewegung und Schwungführung.':'Bitte die vier Körpermaße vervollständigen.';
 const measurements=complete?'Körpergröße '+fmt(h)+' cm · Spannweite '+fmt(w)+' cm · Oberarm '+fmt(u)+' cm · Ellenbogen–Fingerknöchel '+fmt(f)+' cm.':'';
 return {name:val('name')||'Dein Schwungcheck',date:val('date'),side:val('hand'),complete,finding:finding+(model.screenComplete?'':' Einzelne Tests oder Zuordnungen sind noch offen.')+' '+model.trialText+(val('finding').trim()?' '+val('finding').trim():''),measurements,model,gripPicture:model.restricted?null:({'Schwächer':'gripweak','Neutral':'gripneutral','Stärker':'gripstrong'}[model.leadCandidate]||null),bodyPicture:model.restricted?null:({'Side/Under':'under','Side On':'sideon','On Top':'ontop'}[val('fold')]||null),power:model.restricted?null:model.power,back:model.restricted?null:model.back,down:model.restricted?null:model.down,task:model.task,priority:model.priority,planTitle:model.planTitle,steps:model.steps,criterion:model.criterion,next:model.next};
}
function photo(key,highlight=null,mirror=false){const p=PICTURES[key];
 const source=p.crop?'<div class="grip-crop'+(mirror?' mirrored':'')+'" style="aspect-ratio:'+p.width+'/'+p.height+'"><img src="'+p.src+'" alt="'+esc(p.caption)+'" style="width:'+(1800/p.crop.width*100)+'%;left:'+(-p.crop.x/p.crop.width*100)+'%;top:'+(-p.crop.y/p.crop.height*100)+'%"></div>':'<div class="track-wrap"><img src="'+p.src+'" alt="'+esc(p.caption)+'">'+(highlight!==null?'<span class="track-highlight" style="left:'+highlight*100/3+'%" aria-hidden="true"></span>':'')+'</div>';
 return '<div class="profile-photo'+(p.crop?' grip-photo':'')+'">'+source+'<small>'+esc(p.caption)+(mirror?' Spiegelbild für Linksspieler.':'')+'</small></div>';
}

function render(){
 const r=buildReport(),date=r.date?r.date.split('-').reverse().join('.') :'';
 el('armresult').textContent=r.model.restricted?'Test bei Beschwerden auslassen.':r.model.armback? r.model.armback.name+'. '+r.model.grip:'Handstellung nach dem Pendeln auswählen.';
 el('measureresult').textContent=[r.model.back?.name,r.model.down?.name].filter(Boolean).join(' · ')||'Vier Maße erfassen; die beiden Zuordnungen entstehen automatisch.';
 el('postresult').textContent=({Front:'Ansatz: Drehung über die vordere Seite, ohne das Becken seitlich zu erzwingen.',Center:'Ansatz: mittige Drehung; keine zusätzliche Seitverschiebung erzwingen.',Rear:'Ansatz: rückseitigen Drehpunkt im Rückschwung zulassen. Die Bewegung zum Ziel separat prüfen.'}[val('post')]||'Beckenbewegung beobachten und Ergebnis auswählen.')+(val('pressure')?' Druckempfinden dokumentiert; keine Druckmessung.':'');
 el('hipresult').textContent=r.model.leadCandidate?'Vordere Hand: '+r.model.leadCandidate.toLowerCase()+'er Vergleichsansatz. Hintere Hand separat aus Test 01. Stärker/schwächer meint Handstellung, nicht Griffdruck.':'Dynamischen Test erfassen; der Griffvergleich wird vorgeschlagen.';
 el('compareresult').textContent=r.model.restricted?'Keine automatische Änderungsaufgabe bei Beschwerden.':r.model.compareCue;
 el('armbacktext').textContent=r.model.restricted?'':r.model.backExplanation;
 el('reportname').textContent=r.name+' · '+date+' · '+r.side;el('findingreport').textContent=r.finding;el('measurements').textContent=r.measurements;
 el('powerlabel').textContent=r.power?.name||'Noch offen';el('powertext').textContent=r.power?.text||(r.model.restricted?'Bei Beschwerden keine automatische Bewegungsänderung.':r.model.conflict?'Hand- und Dynamiktest passen noch nicht zusammen.':'Ohne eindeutige Testergebnisse wählen wir keinen Bewegungstyp.');el('griptext').textContent=r.model.restricted?'':r.model.grip;el('bodydetail').textContent=r.model.restricted?'':r.model.bodydetail;el('bodypicture').innerHTML=r.gripPicture?photo(r.gripPicture,null,r.side==='Links'):r.bodyPicture?photo(r.bodyPicture):'';
 el('backlabel').textContent=r.back?.name||'Noch offen';el('backtext').textContent=r.back?.text||(r.model.restricted?'Bei Beschwerden stellen wir die Bewegungsempfehlung zurück.':'Die benötigten Körpermaße fehlen.');el('backpicture').innerHTML=r.back?photo('track',({low:0,mid:1,high:2})[r.back.plane]??null):'';
 el('downlabel').textContent=r.down?.name||'Noch offen';el('downtext').textContent=r.down?.text||(r.model.restricted?'Bei Beschwerden stellen wir die Bewegungsempfehlung zurück.':'Die benötigten Armmaße fehlen.');el('downpicture').innerHTML=r.down?.plane?photo(r.down.plane):'';
 el('observationsblock').hidden=true;el('priority').textContent=r.priority;el('planlabel').textContent=r.planTitle;el('practice').innerHTML='<ol>'+r.steps.map(step=>'<li>'+esc(step)+'</li>').join('')+'</ol><p><b>Entscheidung nach dem Vergleich:</b> '+esc(r.criterion)+'</p>';el('recommendation').textContent=r.next;el('scorecard').hidden=!['compare','favorable'].includes(r.model.status);
}
function resetAll(){if(!confirm('Alle Eingaben löschen? PDF vorher sichern.'))return;ids.forEach(id=>el(id).value=id==='hand'?'Rechts':id==='pain'?'Keine angegeben':'');el('date').value=localDate();render();}
function printReport(){render();document.activeElement?.blur();requestAnimationFrame(()=>setTimeout(()=>window.print(),120));}
el('date').value=localDate();ids.forEach(id=>el(id).addEventListener('input',render));render();
