// Oberfläche: Kunden, geführter Ablauf, Bericht. Alle Daten bleiben im Browser dieses Geräts.
(function(){
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const app=$('#app');
const STEP_MIN=[1,3,3,3,3,4,3];
const STEPS=[
 {t:'Profil',s:'Kunde & Datum'},{t:'Arm-Pendeltest',s:'Handstellung'},{t:'Körpermaße',s:'Proportionen'},
 {t:'Post-Test',s:'Drehachse'},{t:'Hip-Speed',s:'Hüfte & Griff'},{t:'Am Ball',s:'5 + 5 Vergleich'},{t:'Video',s:'Abgleich (optional)'},{t:'Bericht',s:'PDF & Training'}
];
const S={clientId:null,sessionId:null,inputs:null,step:0,timer:{run:false,start:0,acc:0},saveT:null,saved:true};

// ---------- Hilfsfunktionen ----------
const initials=n=>(n||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]?.toUpperCase()||'').join('')||'?';
const clientName=c=>c?.name?.trim()||'Kunde ohne Namen';
const fmtDateLong=iso=>{if(!iso)return '';const [y,m,d]=iso.split('-');return d+'.'+m+'.'+y;};
function toast(msg,ms=2400){const t=document.createElement('div');t.className='toast no-print';t.textContent=msg;t.setAttribute('role','status');document.body.appendChild(t);setTimeout(()=>t.remove(),ms);}
function ask(title,text,ok='Löschen',danger=true){
 return new Promise(res=>{
  const d=document.createElement('dialog');
  d.innerHTML=`<h3>${esc(title)}</h3><p class="muted" style="margin:10px 0 20px">${esc(text)}</p><div class="row end"><button class="btn ghost" value="no">Abbrechen</button><button class="btn ${danger?'danger':''}" value="yes">${esc(ok)}</button></div>`;
  d.addEventListener('click',e=>{const v=e.target.closest('button')?.value;if(v){d.close(v);}});
  d.addEventListener('close',()=>{res(d.returnValue==='yes');d.remove();});
  document.body.appendChild(d);d.showModal();
 });
}
async function downloadBytes(bytes,name,type='application/pdf'){
 // In der Online-Vorschau (eingebetteter Rahmen) ist der direkte Download gesperrt; dort dient die Speichern-Funktion des Rahmens.
 try{const d=window.claude?.use?await window.claude.use('downloads'):null;if(d){await d.save({filename:name,data:bytes});return;}}catch(e){if(e&&e.code==='declined')return;}
 const url=URL.createObjectURL(new Blob([bytes],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function flushSave(){clearTimeout(S.saveT);S.saveT=null;if(S.sessionId&&S.inputs){S.saved=Store.saveSession(S.sessionId,S.inputs);paintSave();}}
function queueSave(){S.saved=false;paintSave();clearTimeout(S.saveT);S.saveT=setTimeout(flushSave,350);}
function paintSave(){const e=$('#savestate');if(!e)return;const ok=Store.persistent;e.className='save-state'+(ok?'':' warn');e.innerHTML='<i></i>'+(ok?(S.saved?'Gespeichert':'Speichert …'):'Nur Arbeitsspeicher');e.title=ok?'':'Dein Browser erlaubt kein Speichern (privates Fenster?). Bitte PDF direkt sichern.';}

// ---------- Timer ----------
const elapsed=()=>S.timer.acc+(S.timer.run?Date.now()-S.timer.start:0);
const fmtT=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
function saveTimer(){if(!S.sessionId)return;try{localStorage.setItem('schwungdna.timer',JSON.stringify({sid:S.sessionId,...S.timer}));}catch(e){}}
function loadTimer(sid){try{const t=JSON.parse(localStorage.getItem('schwungdna.timer')||'null');if(t&&t.sid===sid)return {run:!!t.run,start:t.start||0,acc:t.acc||0};}catch(e){}return null;}
function startTimer(){if(S.timer.run)return;S.timer.start=Date.now();S.timer.run=true;saveTimer();paintTimer();}
function pauseTimer(){if(!S.timer.run)return;S.timer.acc+=Date.now()-S.timer.start;S.timer.run=false;saveTimer();paintTimer();}
// Sollzeit: bis Ende des aktuellen Schritts darf die Zeit laufen (Schritt 7 = Bericht = Gesamtzeit)
const planEnd=step=>STEP_MIN.slice(0,Math.min(step,6)+1).reduce((a,b)=>a+b,0)*60;
function paintTimer(){
 const t=$('#timer');if(!t)return;const s=Math.floor(elapsed()/1000),started=S.timer.run||S.timer.acc>0;
 const allowed=planEnd(S.step),late=s-allowed,isLate=started&&late>0;
 t.className='timer'+(S.timer.run?' run':'')+(started?(isLate?' late':' ok'):'');
 t.innerHTML=`<span class="dot"></span><span>${fmtT(s)}</span><span class="muted">/ 20:00</span>${isLate?`<span class="delta">+${fmtT(late)}</span>`:''}`;
 t.title=started?(isLate?'Im Zeitrückstand: '+fmtT(late)+' über Plan':'Im Zeitplan'):'Startet automatisch mit dem Namen';
}
setInterval(paintTimer,1000);
document.addEventListener('click',e=>{const t=e.target.closest('#timer');if(!t)return;S.timer.run?pauseTimer():startTimer();});

// ---------- Routing ----------
function go(hash){if(location.hash===hash)route();else location.hash=hash;}
window.addEventListener('hashchange',route);
function route(){
 flushSave();app.onclick=null;app.oninput=null;$('#savestate').hidden=true;
 const p=location.hash.replace(/^#\/?/,'').split('/');
 window.scrollTo(0,0);
 $('#timerslot').innerHTML='';
 try{
  if(p[0]==='client'&&Store.client(p[1]))return viewClient(p[1]);
  if(p[0]==='check'&&Store.session(p[1]))return viewCheck(p[1],Math.min(6,Math.max(0,parseInt(p[2]||'0',10)||0)));
  if(p[0]==='report'&&Store.session(p[1]))return viewReport(p[1]);
 }catch(e){console.error(e);}
 viewHome();
}

// ---------- Startseite ----------
function viewHome(){
 S.sessionId=null;S.inputs=null;
 const clients=Store.clients(),cnt=Store.counts();
 app.innerHTML=`
 <section class="hero">
  <div class="eyebrow">Matthias Berger · Golf Professional</div>
  <h1>Dein Körper.<br>Dein Schwung.</h1>
  <p>Das 20-Minuten-Bio-Swing-Screening: vier Tests, ein klarer Vergleichspunkt und ein persönlicher Bericht als PDF.</p>
  <div class="row"><button class="btn" id="newcheck">Neuen Check starten</button></div>
 </section>
 <div class="stats"><div class="stat"><b>${cnt.clients}</b><span>Kunden</span></div><div class="stat"><b>${cnt.sessions}</b><span>Checks</span></div><div class="stat"><b>${clients.length?esc(fmtDateLong(Store.lastDate(clients[0].id))||'–'):'–'}</b><span>Letzter Check</span></div></div>
 ${Store.persistent?'':'<div class="banner">Dein Browser erlaubt kein dauerhaftes Speichern (z. B. privates Fenster). Daten gehen beim Schließen verloren. Bitte PDF direkt sichern.</div>'}
 <div class="card">
  <div class="row between" style="margin-bottom:12px"><h2>Kunden</h2><input type="search" id="q" placeholder="Suchen …" style="max-width:240px" ${clients.length?'':'hidden'}></div>
  <div class="clist" id="clist">${clients.length?clients.map(clientRow).join(''):'<div class="empty-state"><b>Noch keine Kunden</b><p class="small">Starte oben deinen ersten Check. Kunden und Ergebnisse werden automatisch auf diesem Gerät gespeichert.</p></div>'}</div>
 </div>
 <div class="card flat">
  <h3>Daten sichern</h3>
  <p class="small muted">Alle Kundendaten liegen nur in diesem Browser auf diesem Gerät, nicht auf einem Server. Sichere sie regelmäßig als Datei und bewahre sie geschützt auf. Beim Löschen der Safari-Website-Daten gehen sie verloren.</p>
  <div class="row"><button class="btn secondary small" id="export">Sicherung herunterladen</button><label class="btn secondary small" style="cursor:pointer">Sicherung einlesen<input type="file" id="import" accept="application/json,.json" hidden></label><button class="btn danger small" id="wipe" ${cnt.clients?'':'disabled'}>Alle Daten löschen</button></div>
 </div>`;
 $('#newcheck').onclick=()=>startCheck();
 $('#clist').onclick=e=>{const b=e.target.closest('[data-client]');if(b)go('#/client/'+b.dataset.client);};
 $('#q').oninput=e=>{const q=e.target.value.toLowerCase();$$('.client',app).forEach(c=>c.hidden=!c.dataset.name.includes(q));};
 $('#export').onclick=()=>{downloadBytes(new TextEncoder().encode(Store.exportJSON()),'Schwung-DNA_Sicherung_'+localDate()+'.json','application/json');toast('Sicherung erstellt');};
 $('#import').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const res=Store.importJSON(await f.text());toast(res.clients+' Kunden, '+res.sessions+' Checks übernommen');viewHome();}catch(err){toast('Fehler: '+err.message,4000);}};
 $('#wipe').onclick=async()=>{if(await ask('Alle Daten löschen?','Sämtliche Kunden und Checks auf diesem Gerät werden entfernt. Vorher bitte eine Sicherung herunterladen.','Alles löschen')){Store.wipe();viewHome();}};
}
function clientRow(c){
 const ss=Store.sessions(c.id),last=ss[ss.length-1];
 return `<button class="client" data-client="${c.id}" data-name="${esc(clientName(c).toLowerCase())}"><div class="avatar">${esc(initials(c.name))}</div><div style="flex:1;min-width:0"><b>${esc(clientName(c))}</b><span>${ss.length} Check${ss.length===1?'':'s'}${last?' · zuletzt '+esc(fmtDateLong(last.inputs.date)):''} · ${esc(c.side||'Rechts')}</span></div><span aria-hidden="true">›</span></button>`;
}
function startCheck(clientId){
 let c=clientId?Store.client(clientId):null;
 if(!c)c=Store.saveClient({name:'',side:'Rechts',email:''});
 const inputs=DEFAULT_INPUTS(),prev=Store.sessions(c.id).slice(-1)[0];
 if(prev){['height','span','upper','fore'].forEach(k=>inputs[k]=prev.inputs[k]||'');inputs._prefilled=prev.inputs.date;}
 const s=Store.newSession(c.id,inputs);
 S.timer={run:!!(c.name&&c.name.trim()),start:Date.now(),acc:0};try{localStorage.setItem('schwungdna.timer',JSON.stringify({sid:s.id,...S.timer}));}catch(e){}
 go('#/check/'+s.id+'/0');
}

// ---------- Kundenseite ----------
function viewClient(id){
 S.sessionId=null;S.inputs=null;
 const c=Store.client(id),ss=Store.sessions(id).slice().reverse();
 const pts=Store.sessions(id).map(s=>{const r=buildReport(s.inputs,c);return {label:(s.inputs.date||'').slice(5).split('-').reverse().join('.'),habit:r.scores.habit,compare:r.scores.compare,focus:r.model.focusName&&r.hasScores?r.model.focusName.slice(0,12):''};});
 const last=ss[0];
 app.innerHTML=`
 <p><button class="btn ghost small" id="back">‹ Alle Kunden</button></p>
 <div class="card">
  <div class="row" style="gap:16px;margin-bottom:14px"><div class="avatar" style="width:56px;height:56px;font-size:18px">${esc(initials(c.name))}</div><div style="flex:1"><div class="eyebrow">Kunde</div><h1 style="font-size:28px">${esc(clientName(c))}</h1></div><button class="btn" id="new">Neuer Check</button></div>
  <div class="grid3">
   <div class="field"><label for="cn">Name</label><input type="text" id="cn" value="${esc(c.name||'')}" autocomplete="off"></div>
   <div class="field"><label>Spielseite</label><div class="seg" id="cs">${['Rechts','Links'].map(v=>`<button aria-pressed="${(c.side||'Rechts')===v}" data-v="${v}">${v}</button>`).join('')}</div></div>
   <div class="field"><label for="ce">E-Mail (manueller Versand)</label><input type="email" id="ce" value="${esc(c.email||'')}" autocomplete="off"></div>
  </div>
 </div>
 ${last?`<div class="card"><h2>Aktueller Stand</h2><p class="lead">${esc(buildReport(last.inputs,c).priority)}</p>${dnaChips(buildReport(last.inputs,c))}</div>`:''}
 <div class="card"><h2>Verlauf der Schlagvergleiche</h2><p class="small muted">Saubere Treffer von fünf Bällen: gewohnt gegen Vergleich, pro Check.</p>${Charts.progress(pts)}</div>
 <div class="card"><h2>Checks</h2>${ss.length?ss.map(s=>{const r=buildReport(s.inputs,c);return `<div class="sess"><div class="grow"><b>${esc(fmtDateLong(s.inputs.date))}</b><div>${statusChip(r)}<span class="chip gray">${r.doneCount}/4 Tests</span></div></div><button class="btn secondary small" data-open="${s.id}">Bearbeiten</button><button class="btn small" data-report="${s.id}">Bericht</button><button class="btn danger small" data-del="${s.id}" aria-label="Check löschen">Löschen</button></div>`;}).join(''):'<div class="empty-state">Noch kein Check. Starte oben den ersten.</div>'}</div>
 <p><button class="btn danger small" id="delc">Kunden und alle Checks löschen</button></p>`;
 $('#back').onclick=()=>go('#/');
 $('#new').onclick=()=>startCheck(id);
 $('#cn').oninput=e=>Store.saveClient({id,name:e.target.value});
 $('#ce').oninput=e=>Store.saveClient({id,email:e.target.value});
 $('#cs').onclick=e=>{const b=e.target.closest('button');if(!b)return;Store.saveClient({id,side:b.dataset.v});$$('#cs button').forEach(x=>x.setAttribute('aria-pressed',x===b));};
 app.onclick=async e=>{
  const o=e.target.closest('[data-open]'),rp=e.target.closest('[data-report]'),d=e.target.closest('[data-del]');
  if(o)go('#/check/'+o.dataset.open+'/1');if(rp)go('#/report/'+rp.dataset.report);
  if(d&&await ask('Check löschen?','Dieser Check wird dauerhaft entfernt.')){Store.deleteSession(d.dataset.del);viewClient(id);}
 };
 $('#delc').onclick=async()=>{if(await ask('Kunden löschen?',clientName(c)+' und alle Checks werden dauerhaft entfernt.')){Store.deleteClient(id);go('#/');}};
}
const statusChip=r=>({favorable:'<span class="chip">Vergleich günstig</span>',rejected:'<span class="chip warn">Vergleich ungünstig</span>',compare:'<span class="chip gold">Vergleich läuft</span>',open:'<span class="chip gray">Tests offen</span>',paused:'<span class="chip warn">Beschwerden</span>'}[r.model.status]||'');
const dnaChips=r=>r.dna.length?'<div>'+r.dna.map(d=>`<span class="chip">${esc(d.label)}: ${esc(d.value)}</span>`).join('')+'</div>':'';

// ---------- Geführter Ablauf ----------
const choice=(k,v,title,sub,cls='')=>`<button type="button" class="choice ${cls}" data-k="${k}" data-v="${esc(v)}" aria-pressed="${S.inputs[k]===v}"><b>${esc(title)}</b>${sub?`<span>${esc(sub)}</span>`:''}</button>`;
const hitButtons=k=>`<div class="stepper-num six" role="group">${[0,1,2,3,4,5].map(n=>`<button type="button" data-k="${k}" data-v="${n}" aria-pressed="${String(S.inputs[k])===String(n)}">${n}</button>`).join('')}</div>`;
const guide=(parts,open=0)=>`<div class="guide">${parts.map(([h,t],i)=>`<details ${i===open?'open':''}><summary>${esc(h)}</summary><p>${esc(t)}</p></details>`).join('')}</div>`;
const result=id=>`<div class="result empty" data-live="${id}"></div>`;
const src=l=>`<p class="sources">${l.map(([t,u])=>`<a href="${u}" target="_blank" rel="noopener">${esc(t)}</a>`).join(' · ')}</p>`;
const numField=(k,label,min,max)=>`<div class="field unit" data-unit="cm"><label for="f_${k}">${label}</label><input id="f_${k}" type="number" inputmode="decimal" min="${min}" max="${max}" step="0.1" data-in="${k}" value="${esc(S.inputs[k])}"></div>`;

const STEP_VIEW=[
 // 0 Profil
 ()=>{const c=Store.client(S.clientId);return `
  <h2>Wer wird heute getestet?</h2><p class="lead">Name, Datum und eventuelle Beschwerden. Das Profil erscheint im Bericht.</p>
  <div class="grid2" style="margin-top:16px">
   <div class="field"><label for="f_name">Name</label><input type="text" id="f_name" data-client="name" value="${esc(c.name||'')}" autocomplete="off" placeholder="Vor- und Nachname"></div>
   <div class="field"><label for="f_date">Datum</label><input type="date" id="f_date" data-in="date" value="${esc(S.inputs.date)}"></div>
   <div class="field"><label>Spielseite</label><div class="seg" id="side">${['Rechts','Links'].map(v=>`<button type="button" data-client-side="${v}" aria-pressed="${(c.side||'Rechts')===v}">${v}</button>`).join('')}</div><p class="hint">Bei Linksspielern gelten vordere/hintere Hand entsprechend; das Griff-Foto wird gespiegelt.</p></div>
   <div class="field"><label for="f_email">E-Mail (manueller Versand)</label><input type="email" id="f_email" data-client="email" value="${esc(c.email||'')}" autocomplete="off"></div>
  </div>
  <div class="field"><label>Beschwerden</label><div class="choices c3">
   ${choice('pain','Keine angegeben','Keine Beschwerden','Alle Tests wie geplant','')}
   ${choice('pain','Bewegung eingeschränkt','Eingeschränkt','Bewegung nur begrenzt möglich','')}
   ${choice('pain','Bewegung schmerzhaft – Test angepasst/ausgelassen','Schmerzhaft','Test anpassen oder auslassen','')}
  </div><p class="hint">Bei Beschwerden entsteht keine automatische Änderungsaufgabe.</p></div>
  <div class="field"><label>Ziel</label><div class="choices c4">${['Länge','Konstanz','Schmerzfrei spielen','Mehr Kontrolle'].map(v=>choice('goal',v,v,'','')).join('')}</div></div>
  <div class="field"><label>Häufigster Fehlschlag</label><div class="choices c5">${['Slice','Hook','Fat','Top','Unterschiedlich'].map(v=>choice('miss',v,v,'','')).join('')}</div></div>
  ${S.inputs._prefilled?`<div class="result"><b>Übernommen</b>Die Körpermaße stammen aus dem Check vom ${esc(fmtDateLong(S.inputs._prefilled))}. Bitte in Schritt 3 kurz prüfen.</div>`:''}
  <div class="callout"><b>Ablauf (20 Minuten):</b> Vorbereitung 1 · Armtest 3 · Vermessung 3 · Post 3 · Hip-Speed 3 · Schlagvergleich 4 · Video 3. Der Timer oben rechts startet automatisch, sobald du den Namen eingibst. Grün bedeutet im Zeitplan, rot im Rückstand. Mit einem Tipp pausierst du ihn.</div>`;},
 // 1 Arm
 ()=>`<h2>Arm-Pendeltest</h2><p class="lead">Wohin zeigt die Handfläche der hinteren Hand?</p>
  ${guide([['Aufstellen','Kunde beugt sich aus der Hüfte vor, Hände gleiten über die Oberschenkel, Mittelfingerspitzen erreichen den oberen Kniebereich. Arme entspannt hängen lassen.'],['Durchführen','Handflächen zusammenlegen; die hintere Hand etwas tiefer wie am Griff. Arme locker zurückschwingen, Schultern dabei ruhig halten. Etwa auf Hüfthöhe stoppen; hinterer Ellenbogen darf sich natürlich beugen. Zweimal wiederholen.'],['Beobachten','Wohin zeigt die Handfläche der hinteren Hand? Keine Stellung vorgeben oder hinbiegen.']])}
  <div class="choices c2">
   ${choice('fold','Side/Under','Nach oben · Under','Handfläche eher nach oben')}
   ${choice('fold','Side On','Seitlich · Side On','Handfläche eher seitlich')}
   ${choice('fold','On Top','Zum Boden · On Top','Handfläche eher zum Boden')}
   ${choice('fold','Uneindeutig','Uneindeutig','Bei Wiederholung unterschiedlich','neutral')}
  </div>${result('arm')}
  <p class="hint">Handstellung der hinteren Hand und ein Ansatz für die Rückschwungführung. Der höchste Rückschwungpunkt folgt erst mit Größe und Spannweite. Die drei Gruppen sind eine vereinfachte Erfassung; Übergangsformen bleiben offen.</p>
  ${src([['Durchführung: Doniger / Adams','https://golf.com/instruction/grip-golf-club-test-can-tell-you/'],['Armfaltung und Ebenen: Spallone','https://appmesolutions.wixsite.com/vero-golf-pro/bioswing-dynamics-certification-exam']])}`,
 // 2 Maße
 ()=>`<h2>Körperproportionen</h2><p class="lead">Vier Maße bestimmen den obersten Punkt im Rückschwung und die Abschwungzone.</p>
  ${guide([['Größe und Spannweite','Ohne Schuhe aufrecht messen. Arme seitlich auf Schulterhöhe strecken, Ellenbogen gerade. Spannweite von einer Mittelfingerspitze zur anderen.'],['Armmaße','An der hinteren Schlagarmseite vom Schultergelenk zum Ellenbogen und vom Ellenbogen zum mittleren Fingerknöchel messen. Das zweite Maß enthält den Handanteil; keine Unterarmlänge bis zum Handgelenk eintragen.'],['Prüfen','Messpunkte einheitlich wählen und kleine Unterschiede erneut messen.']])}
  <div class="grid2">${numField('height','Körpergröße',100,230)}${numField('span','Spannweite: Mittelfingerspitze–Mittelfingerspitze',90,250)}${numField('upper','Schultergelenk–Ellenbogen',15,65)}${numField('fore','Ellenbogen–mittlerer Fingerknöchel',15,70)}</div>
  <div class="grid2"><div data-live="chart1"></div><div data-live="chart2"></div></div>
  ${result('measure')}
  <p class="hint">Spannweite im Verhältnis zur Größe: vorderer Arm am höchsten Rückschwungpunkt. Ellenbogen–Fingerknöchel im Verhältnis zum Oberarm: Abschwungzone. Ungleiche Differenzen bis 1 cm bleiben zur Nachmessung offen (eigene Arbeitsregel, kein offizieller Grenzwert).</p>
  ${src([['Messung und Ebenen','https://www.advanceddynamicgolfcenter.com/post/what-is-bio-swing-mechanics']])}`,
 // 3 Post
 ()=>`<h2>Post-/Pivot-Test</h2><p class="lead">Wie bewegt sich das Becken im Rückschwung?</p>
  ${guide([['Aufstellen','In Golfhaltung einen Schläger quer an die Oberschenkel legen.'],['Durchführen','Langsam in einen Rückschwung drehen, Schläger an den Oberschenkeln halten. Zweimal wiederholen.'],['Beobachten','Bleibt das Becken mittig, bewegt es sich zur hinteren Seite oder zur vorderen? Kunde beschreibt zusätzlich, unter welchem Fuß er mehr Druck spürt.']])}
  <div class="eyebrow" style="margin:6px 0">Beobachtete Drehachse</div>
  <div class="choices c2">${choice('post','Front','Vordere Seite · Front Post','Becken eher zur vorderen Seite')}${choice('post','Center','Mittig · Center Post','Becken bleibt mittig')}${choice('post','Rear','Hintere Seite · Rear Post','Becken eher zur hinteren Seite')}${choice('post','Unclear','Uneindeutig','Bewegung nicht klar erkennbar','neutral')}</div>
  <div class="eyebrow" style="margin:18px 0 6px">Druckempfinden im Rückschwung (optional)</div>
  <div class="choices c4 keep2">${choice('pressure','front','Vorderer Fuß','')}${choice('pressure','center','Beide ähnlich','')}${choice('pressure','rear','Hinterer Fuß','')}${choice('pressure','unclear','Nicht spürbar','','neutral')}</div>
  ${result('post')}
  <p class="hint">Die Drehachse hilft, die Körperbewegung zu organisieren. Das Druckempfinden ist eine Rückmeldung, keine gemessene Druckverteilung. Rear Post fordert nicht dazu auf, im Treffmoment das Gewicht hinten zu lassen.</p>
  ${src([['Durchführung: Adams / Najar','https://golf.com/instruction/five-easy-tests-to-gain-at-least-20-yards-with-your-driver/'],['Begriffe: E.A. Tischler','https://newhorizonsgolf.com/BioSwingDynamics.html']])}`,
 // 4 Hip
 ()=>`<h2>Hip-Speed-Test</h2><p class="lead">Hüfte, Arme und Griff der vorderen Hand abstimmen.</p>
  ${guide([['Aufstellen','Golfbag standsicher aufstellen. In Eisen-5-Haltung hält die vordere Hand das Bag; die hintere Hand trägt einen weichen Schlägerkopfbezug.'],['Durchführen','Hinteren Arm zurück und vor schwingen, die gepolsterte Hand kontrolliert an die Bagseite führen. Treffposition kurz halten. Nicht mit voller Kraft schlagen.'],['Beobachten','Hintere Ferse und Hüftöffnung im Verhältnis zum Oberkörper prüfen. Hüfte und Rumpf gemeinsam beurteilen; ein widersprüchliches Bild bleibt offen.']])}
  <div class="choices c2">${choice('hip','Slow','Slow','Ferse am Boden, Hüfte relativ zum Rumpf zurück')}${choice('hip','Mid','Mid','Ferse leicht angehoben, Hüfte und Rumpf gemeinsam')}${choice('hip','Fast','Fast','Ferse deutlich angehoben, Hüfte voraus')}${choice('hip','Unclear','Uneindeutig','Merkmale widersprüchlich','neutral')}</div>
  ${result('hip')}
  <div class="guide" style="margin-top:16px"><details><summary>Optional: geprüften Griff der vorderen Hand übernehmen</summary><p>Die hintere Hand kommt aus dem Arm-Pendeltest. Hier nur eintragen, wenn der Griffansatz der vorderen Hand im Schlagvergleich bereits bestätigt wurde. Stärker/schwächer meint Handstellung, nicht Griffdruck.</p><div class="choices c3 keep3">${choice('leadgrip','','Automatisch','Vorschlag aus Hip-Test')}${choice('leadgrip','Schwächer','Schwächer','')}${choice('leadgrip','Neutral','Neutral','')}${choice('leadgrip','Stärker','Stärker','')}</div></details></div>
  ${src([['Durchführung und Griffvergleich: Bill Schmedes III','https://golfwrx.com/205319/measure-your-hip-speed-to-determine-your-proper-setup/']])}`,
 // 5 Ball
 ()=>`<h2>Am Ball überprüfen</h2><p class="lead">Nur eine Änderung gegen die gewohnte Bewegung vergleichen.</p>
  ${guide([['So läuft der Vergleich','Mit Eisen 7 fünf lockere Bälle gewohnt schlagen, dann fünf mit dem angezeigten Ansatz. Nur einen Punkt ändern: Bewegung, Griff oder Armführung. Saubere Treffer zählen und das Bewegungsgefühl vergleichen.']])}
  ${result('compare')}
  <div class="eyebrow" style="margin:18px 0 6px">Was wird einzeln verglichen?</div>
  <div class="choices c3 keep2" style="grid-template-columns:repeat(auto-fit,minmax(125px,1fr))">${choice('focus','','Automatisch','Vorgeschlagener Punkt')}${choice('focus','motion','Körperbewegung','')}${choice('focus','grip','Griffansatz','')}${choice('focus','back','Rückschwung','Führung & oberster Punkt')}${choice('focus','down','Abschwungzone','')}</div>
  <div class="grid2" style="margin-top:20px"><div class="field"><label>Saubere Treffer · gewohnt (von 5)</label>${hitButtons('hitsHabit')}</div><div class="field"><label>Saubere Treffer · Vergleich (von 5)</label>${hitButtons('hitsCompare')}</div></div>
  <div class="field"><label>Bewegungsgefühl im Vergleich</label><div class="choices c3">${choice('feel','better','Angenehmer','')}${choice('feel','same','Gleich','')}${choice('feel','worse','Schlechter','')}</div></div>
  <div data-live="verdict"></div>
  <div class="field"><label>Ergebnis des Schlagvergleichs</label><div class="choices c4 keep2">${choice('trial','better','Besser','Mehr saubere Treffer, angenehmer')}${choice('trial','same','Gleich','Kein klarer Unterschied')}${choice('trial','worse','Ungünstiger','')}${choice('trial','unclear','Uneindeutig','','neutral')}</div></div>
  <div class="field"><label for="f_finding">Persönliche Notiz für den Kunden (optional)</label><textarea id="f_finding" data-in="finding" maxlength="240" placeholder="Nur ergänzen, wenn für das Training hilfreich.">${esc(S.inputs.finding)}</textarea><p class="hint">Erscheint im Bericht als Notiz von dir.</p></div>`
];
STEP_VIEW.push(()=>{
 const c=Store.client(S.clientId),r=buildReport({...S.inputs},c),v=r.video;
 const HIPX={Slow:'Hüfte eher zurück (Slow)',Mid:'Hüfte neutral (Mid)',Fast:'Hüfte eher voraus (Fast)'};
 const rows=[['vidHip','Hüfte','Von vorne (face-on): Wie bewegt und öffnet sich das Becken im Abschwung?',HIPX[S.inputs.hip]],['vidBack','Rückschwungebene','Von hinten (Ziellinie): Wie hoch steht der vordere Arm am obersten Punkt?',r.back?.plane?TOP_LABEL[r.back.plane]:''],['vidDown','Abschwungebene','Von hinten (Ziellinie): Wo laufen Hände und Schaft im Abschwung?',r.down?.plane?DOWN_LABEL[r.down.plane]:'']];
 return `<h2>Video-Abgleich (optional)</h2><p class="lead">Ein bis zwei Schwünge mit Eisen 7 filmen, von vorne und von hinten, mindestens 60 Bilder pro Sekunde. Dann kurz prüfen, ob der Schwung zu den Tests passt.</p>
 ${rows.map(([k,t,q,exp])=>`<div class="field"><label>${esc(t)}</label><p class="hint" style="margin:0 0 6px">${esc(q)}<br><b>Test sagt: ${esc(exp||'noch offen')}</b></p><div class="choices c3">${choice(k,'yes','Bestätigt','')}${choice(k,'part','Teilweise','')}${choice(k,'no','Weicht ab','')}</div></div>`).join('')}
 <div class="field"><label for="f_vidnote">Notiz zum Video (optional)</label><textarea id="f_vidnote" data-in="vidNote" maxlength="200" placeholder="Zum Beispiel: Hüfte gleitet im Abschwung stark zum Ziel.">${esc(S.inputs.vidNote)}</textarea></div>
 <div class="callout"><b>Hinweis:</b> Eine Abweichung ist kein Fehler im Test, sondern eine Information. Im Bericht gilt dann das, was im Video zu sehen ist.</div>`;
});

function stepDone(i,inp=S.inputs){
 const c=Store.client(S.clientId);
 return [!!c?.name?.trim(),!!inp.fold,['height','span','upper','fore'].every(k=>Number(inp[k])>0),!!inp.post,!!inp.hip,!!inp.trial,!!(inp.vidHip||inp.vidBack||inp.vidDown)][i];
}
function viewCheck(sid,step){
 const s=Store.session(sid);
 if(S.sessionId!==sid){S.sessionId=sid;S.timer=loadTimer(sid)||{run:false,start:0,acc:0};S.inputs={...DEFAULT_INPUTS(),...s.inputs};S.clientId=s.clientId;}
 S.step=step;
 $('#savestate').hidden=false;$('#timerslot').innerHTML='<button type="button" id="timer" class="timer" aria-label="Timer starten oder anhalten"></button>';paintTimer();
 const c=Store.client(S.clientId);
 const nav=STEPS.map((st,i)=>`<button class="step${i===step?' on':''}${i<7&&stepDone(i)?' done':''}" data-go="${i}"><span class="n">${i<7&&stepDone(i)&&i!==step?'✓':i+1}</span><span><b>${st.t}</b><span>${st.s}</span></span></button>`).join('');
 const bar=STEPS.map((st,i)=>`<button class="${i===step?'on':''}${i<7&&stepDone(i)?' done':''}" data-go="${i}">${i+1} · ${st.t}</button>`).join('');
 const done=[0,1,2,3,4,5].filter(i=>stepDone(i)).length;
 app.innerHTML=`
 <div class="wiz">
  <nav class="steps no-print" aria-label="Ablauf"><p class="small muted" style="margin:0 12px 6px"><b>${esc(clientName(c))}</b></p>${nav}</nav>
  <div>
   <div class="stepbar">${bar}</div>
   <div class="progress" aria-hidden="true"><i style="width:${Math.round(done/6*100)}%"></i></div>
   <div class="card">
    <div class="row between" style="margin-bottom:10px"><span class="eyebrow">Schritt ${step+1} von 7</span><span class="planned">ca. ${STEP_MIN[step]} Min.</span></div>
    ${STEP_VIEW[step]()}
   </div>
  </div>
 </div>
 <div class="wiz-foot no-print"><div class="wiz-foot-in">
  <button class="btn ghost" id="prev" ${step===0?'':''}>‹ ${step===0?'Zum Kunden':'Zurück'}</button>
  <button class="btn" id="next">${step===6?'Bericht ansehen ›':'Weiter ›'}</button>
 </div></div>`;
 bindCheck();refreshLive();paintSave();
}
function bindCheck(){
 app.onclick=e=>{
  const g=e.target.closest('[data-go]');if(g){go('#/check/'+S.sessionId+'/'+g.dataset.go);return;}
  if(e.target.closest('#prev')){S.step===0?go('#/client/'+S.clientId):go('#/check/'+S.sessionId+'/'+(S.step-1));return;}
  if(e.target.closest('#next')){if(S.step===0&&!S.timer.run&&S.timer.acc===0)startTimer();S.step===6?(pauseTimer(),go('#/report/'+S.sessionId)):go('#/check/'+S.sessionId+'/'+(S.step+1));return;}
  const side=e.target.closest('[data-client-side]');if(side){Store.saveClient({id:S.clientId,side:side.dataset.clientSide});$$('#side button').forEach(b=>b.setAttribute('aria-pressed',b===side));refreshLive();return;}
  const ch=e.target.closest('[data-k]');
  if(ch){
   const k=ch.dataset.k,v=ch.dataset.v;
   const sticky=['pain','focus','leadgrip','goal','miss'].includes(k);
   S.inputs[k]=(!sticky&&String(S.inputs[k])===v)?'':v;
   if(k==='trial'&&S.inputs.trial===''&&false)return;
   $$(`[data-k="${k}"]`,app).forEach(b=>b.setAttribute('aria-pressed',String(S.inputs[k])===b.dataset.v));
   queueSave();refreshLive();
  }
  const sug=e.target.closest('[data-suggest]');if(sug){S.inputs.trial=sug.dataset.suggest;$$('[data-k="trial"]',app).forEach(b=>b.setAttribute('aria-pressed',S.inputs.trial===b.dataset.v));queueSave();refreshLive();}
 };
 app.oninput=e=>{
  const t=e.target;
  if(t.dataset.in){S.inputs[t.dataset.in]=t.value;queueSave();refreshLive();}
  if(t.dataset.client){Store.saveClient({id:S.clientId,[t.dataset.client]:t.value});if(t.dataset.client==='name'&&t.value.trim()&&!S.timer.run&&S.timer.acc===0)startTimer();refreshLive();}
 };
}
const POST_TXT={Front:'Ansatz: Drehung über die vordere Seite, ohne das Becken seitlich zu erzwingen.',Center:'Ansatz: mittige Drehung; keine zusätzliche Seitverschiebung erzwingen.',Rear:'Ansatz: rückseitigen Drehpunkt im Rückschwung zulassen. Die Bewegung zum Ziel separat prüfen.'};
function setLive(id,text,state){const e=$(`[data-live="${id}"]`);if(!e)return;e.className='result'+(state==='empty'?' empty':state==='warn'?' warn':'');e.innerHTML=text;}
function refreshLive(){
 if(!S.inputs)return;
 const c=Store.client(S.clientId),r=buildReport(S.inputs,c),m=r.model,i=S.inputs;
 const R=(label,t)=>`<b>${label}</b>${esc(t)}`;
 if(m.restricted){['arm','measure','post','hip','compare'].forEach(k=>setLive(k,R('Hinweis','Bei Beschwerden diesen Test auslassen oder anpassen. Keine automatische Änderungsaufgabe.'),'warn'));}
 else{
  setLive('arm',m.armback?R(m.armback.name,(r.power?.grip||'')+' '+(r.power?.text||'')):'Handstellung nach dem Pendeln auswählen.',m.armback?'':'empty');
  setLive('measure',[r.back?.name,r.down?.name].filter(Boolean).length?R('Zuordnung',[r.back?.name,r.down?.name].filter(Boolean).join(' · ')):'Vier Maße erfassen; die beiden Zuordnungen entstehen automatisch.',[r.back?.name,r.down?.name].filter(Boolean).length?'':'empty');
  setLive('post',(POST_TXT[i.post]||'')?R('Auswertung',POST_TXT[i.post]+(i.pressure?' Druckempfinden dokumentiert; keine Druckmessung.':'')):'Beckenbewegung beobachten und Ergebnis auswählen.',POST_TXT[i.post]?'':'empty');
  setLive('hip',m.leadCandidate?R('Vordere Hand','Vergleichsansatz: '+m.leadCandidate.toLowerCase()+'. Hintere Hand separat aus dem Arm-Pendeltest. Stärker/schwächer meint Handstellung, nicht Griffdruck.'):'Dynamischen Test erfassen; der Griffvergleich wird vorgeschlagen.',m.leadCandidate?'':'empty');
  setLive('compare',R('Dein Vergleichspunkt',m.compareCue.replace(/^Dein Vergleichspunkt: /,'')),m.chosenFocus?'':'empty');
 }
 const c1=$('[data-live="chart1"]'),c2=$('[data-live="chart2"]');
 if(c1)c1.innerHTML=Charts.compare({aLabel:'Körpergröße',a:Number(i.height),bLabel:'Spannweite',b:Number(i.span)});
 if(c2)c2.innerHTML=Charts.compare({aLabel:'Oberarm',a:Number(i.upper),bLabel:'Ellenbogen–Fingerknöchel',b:Number(i.fore)});
 $$('input[type=number]',app).forEach(inp=>{const bad=inp.value!==''&&!inp.checkValidity();inp.style.borderColor=bad?'#c47a3a':'';let h=inp.parentElement.querySelector('.hint.range');if(bad&&!h){h=document.createElement('p');h.className='hint range';h.style.color='#a3501f';h.textContent='Bitte prüfen: Bereich '+inp.min+'–'+inp.max+' cm.';inp.parentElement.appendChild(h);}else if(!bad&&h)h.remove();});
 const v=$('[data-live="verdict"]');
 if(v){const sc=r.scores;
  if(sc.habit!==null&&sc.compare!==null){
   const map={better:['better','Mehr saubere Treffer mit dem Vergleich ('+sc.compare+' gegen '+sc.habit+').'],worse:['worse','Weniger saubere Treffer mit dem Vergleich ('+sc.compare+' gegen '+sc.habit+').'],same:['same','Gleich viele saubere Treffer ('+sc.compare+' gegen '+sc.habit+').'],mixed:['unclear','Mehr Treffer, aber ein schlechteres Gefühl ('+sc.compare+' gegen '+sc.habit+'). Das ist uneindeutig.']}[sc.verdict];
   v.className='result';v.innerHTML=`<b>Auswertung der Trefferzahlen</b>${esc(map[1])} ${i.trial===map[0]?'':`<button type="button" class="btn secondary small" data-suggest="${map[0]}" style="margin-left:8px">Als Ergebnis übernehmen</button>`}`;
  }else{v.className='';v.innerHTML='';}
 }
 // Fortschritt / Stepper-Markierung
 $$('.step',app).forEach((b,idx)=>{if(idx<7){const d=stepDone(idx);b.classList.toggle('done',d);b.querySelector('.n').textContent=d&&idx!==S.step?'✓':String(idx+1);}});
 $$('.stepbar button',app).forEach((b,idx)=>{if(idx<7)b.classList.toggle('done',stepDone(idx));});
 const done=[0,1,2,3,4,5].filter(x=>stepDone(x)).length,pb=$('.progress i',app);if(pb)pb.style.width=Math.round(done/6*100)+'%';
}

// ---------- Bericht ----------
function photo(key,{highlight=null,mirror=false}={}){
 const p=PICTURES[key];if(!p)return '';
 const body=p.crop
  ?`<div class="grip-crop${mirror?' mirrored':''}" style="aspect-ratio:${p.width}/${p.height}"><img src="${p.src}" alt="${esc(p.caption)}" style="width:${1800/p.crop.width*100}%;left:${-p.crop.x/p.crop.width*100}%;top:${-p.crop.y/p.crop.height*100}%"></div>`
  :`<div class="photo-in"><img src="${p.src}" alt="${esc(p.caption)}">${highlight!==null?`<span class="hl" style="left:${highlight*100/3}%" aria-hidden="true"></span>`:''}</div>`;
 return `<figure class="photo" style="margin:12px 0">${body}<figcaption>${esc(p.caption)}${mirror?' Spiegelbild für Linksspieler.':''}</figcaption></figure>`;
}
function reportHTML(r){
 const m=r.model,left=r.side==='Links',focusMode=['compare','favorable'].includes(m.status);
 const slotKeys=[['fold','Hintere Hand'],['post','Drehachse'],['hip','Hüfte'],['top','Oberer Punkt'],['down','Abschwung']];
 const dna=slotKeys.map(([k,l])=>{const d=m.restricted?null:r.dna.find(x=>x.key===k);return `<div class="${d?'':'open'}"><small>${l}</small><b>${d?esc(d.value):(m.restricted?'pausiert':'offen')}</b></div>`;}).join('');
 const bodyKey=r.gripPicture||r.bodyPicture;
 const drillCard=d=>`<div class="drill"><header><h4>${esc(d.title)}</h4><span class="chip">${d.minutes} Min.</span></header><p class="muted small" style="margin:0"><i>${esc(d.goal)}</i></p><ol>${d.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><div class="watch"><b>Achte darauf:</b> ${esc(d.watch)}</div><p class="tiny muted" style="margin:6px 0 0">Umfang: ${esc(d.reps)}</p></div>`;
 return `
 <div class="report">
  <div class="cover">
   <div class="eyebrow">Matthias Berger · Golf Professional</div>
   <h1>Dein Schwung-DNA-Profil</h1>
   <div class="meta"><b style="color:#fff;font-size:20px">${esc(r.name)}</b><br>${esc(fmtDateLong(r.date))} · Spielseite ${esc(r.side)} · 20-Minuten-Bio-Swing-Screening</div>
   <div class="dna">${dna}</div>
  </div>
  <div class="card">
   <div class="tag-line">Das nehmen wir mit</div>
   <p style="font-size:17px">${esc(r.finding)}</p>
   <p style="font-weight:700;color:var(--green)">${esc(r.priority)}</p>
   ${r.profileLine?`<p class="hint" style="margin-top:-4px">${esc(r.profileLine)}</p>`:''}
   ${r.note?`<div class="callout gold"><b>Notiz von Matthias:</b> ${esc(r.note)}</div>`:''}
   ${r.measures.height>0?`<div class="cols" style="margin-top:14px"><div>${Charts.compare({aLabel:'Körpergröße',a:r.measures.height,bLabel:'Spannweite',b:r.measures.span})}</div><div>${Charts.compare({aLabel:'Oberarm',a:r.measures.upper,bLabel:'Ellenbogen–Fingerknöchel',b:r.measures.fore})}</div></div>`:''}
  </div>
  <div class="card" id="task">
   <div class="sec-h"><h2>Deine Aufgabe bis zum nächsten Termin</h2></div>
   <div class="focus-banner"><small>${focusMode?(m.status==='favorable'?'Dein Vergleichspunkt · Kurzvergleich günstig':'Dein erster Vergleichspunkt'):'Dein Hinweis'}</small><b>${esc(focusMode?m.focusName:r.priority.replace(/^Dein (Hinweis|Ergebnis): /,''))}</b><p>${esc(focusMode?r.focusWhy:r.planTitle)}</p></div>
   <div class="stepcards n${r.steps.length}">${r.steps.map((st,i)=>`<div class="stepcard"><span class="sn">${i+1}</span><h4>${esc(st.title)}</h4><p>${esc(st.text)}</p></div>`).join('')}</div>
   ${r.decision?`<div class="decision"><div class="yes"><small>Übernehmen, wenn …</small><b>${esc(r.decision.adopt)}</b></div><div class="no"><small>Gewohnt weiterspielen, wenn …</small><p>${esc(r.decision.keep)}</p></div></div>`:`<div class="callout gold"><b>Hinweis:</b> ${esc(r.criterion)}</div>`}
   ${r.hasScores?`<table class="score"><thead><tr><th>Einheit / Datum</th><th>Gewohnt</th><th>Vergleich</th><th>Gefühl</th></tr></thead><tbody>
     <tr><td>${r.scores.habit!==null||r.scores.compare!==null?'Im Termin · '+esc(fmtDateLong(r.date)):'1 · ________'}</td><td>${r.scores.habit??'___'} / 5</td><td>${r.scores.compare??'___'} / 5</td><td>${esc({better:'besser',same:'gleich',worse:'schlechter'}[r.scores.feel]||'________')}</td></tr>
     <tr><td>2 · ________</td><td>___ / 5</td><td>___ / 5</td><td>________</td></tr></tbody></table>`:''}
   ${m.restricted?'':`<div class="tag-line">Alle Befunde nach Klarheit geordnet</div><div class="ranking">${r.ranking.map((x,i)=>`<div class="rank${x.key===m.chosenFocus&&x.available?' on':''}"><span class="rn">${i+1}</span><b>${esc(x.name)}</b><span class="rf">${esc(x.finding)}</span><span class="dots" title="${['kein klarer Ausschlag','leicht','deutlich','sehr deutlich'][x.score]}">${[0,1,2].map(d=>`<i class="${x.score>d?'f':''}"></i>`).join('')}</span></div>`).join('')}</div><p class="tiny muted">Je deutlicher ein Testergebnis vom mittleren Bereich abweicht, desto weiter vorn steht der Punkt. Der Punkt mit der meisten Klarheit ist dein erster Vergleichspunkt; die weiteren sind Themen für die nächsten Termine.</p>`}
   <div class="tag-line">Beim nächsten Termin</div><p>${esc(r.next)}</p>
  </div>
  ${m.restricted?'':`
  <div class="card"><div class="sec-h"><h2>Deine Testergebnisse im Überblick</h2></div><table class="score"><thead><tr><th>Test</th><th>Beobachtung</th><th>Ergebnis im Modell</th></tr></thead><tbody>${testOverview(r).map(o=>`<tr><td><b>${esc(o.test)}</b></td><td>${esc(o.seen)}</td><td><b style="color:var(--green)">${esc(o.result)}</b></td></tr>`).join('')}</tbody></table></div>
  ${r.video?`<div class="card"><div class="sec-h"><h2>Abgleich mit deinem Schwung-Video</h2></div><table class="score"><thead><tr><th>Punkt</th><th>Test sagt</th><th>Video zeigt</th></tr></thead><tbody>${r.video.items.map(o=>`<tr><td><b>${esc(o.label)}</b></td><td>${esc(o.expected||'offen')}</td><td><b style="color:var(--green)">${esc(o.result)}</b></td></tr>`).join('')}</tbody></table><p style="margin-top:12px">${esc(r.video.summary)}</p>${r.video.note?`<p class="hint">Notiz: ${esc(r.video.note)}</p>`:''}</div>`:''}
  <div class="card">
   <div class="sec-h"><span class="num">1</span><h2>Dein Bewegungsansatz und Griff</h2></div>
   <div class="cols"><div>
    <div class="tag-line">${esc(r.power?.name||'Noch offen')}</div>
    <p><b>${esc(r.power?.text||(m.conflict?'Hand- und Dynamiktest passen noch nicht zusammen.':'Ohne eindeutige Testergebnisse wählen wir keinen Bewegungstyp.'))}</b></p>
    <p>${esc(m.grip)}</p><p class="muted">${esc(m.bodydetail)}</p></div>
    <div>${bodyKey?photo(bodyKey,{mirror:left&&!!PICTURES[bodyKey].crop}):''}</div></div>
   ${Charts.triad(r.power?.key)}
  </div>
  <div class="cols">
   <div class="card"><div class="sec-h"><span class="num">2</span><h2>Rückschwungführung</h2></div>
    <div class="tag-line">${esc(m.armback?.name||'Noch offen')}</div><p>${esc(m.backExplanation)}</p><p class="muted">${esc(r.back?r.back.name+'. '+r.back.text:'Die benötigten Körpermaße fehlen.')}</p>
    ${r.back?photo('track',{highlight:({low:0,mid:1,high:2})[r.back.plane]??null}):''}${Charts.levels('top',r.back?.plane)}</div>
   <div class="card"><div class="sec-h"><span class="num">3</span><h2>Abschwungzone</h2></div>
    <div class="tag-line">${esc(r.down?.name||'Noch offen')}</div><p>${esc(r.down?.text||'Die benötigten Armmaße fehlen.')}</p>
    ${r.down?.plane?photo(r.down.plane):''}${Charts.levels('down',r.down?.plane)}</div>
  </div>
  <div class="callout"><b>Wichtig zum Verständnis:</b> Weg und Endposition sind zwei verschiedene Punkte. Der Armtest beschreibt, wie die Arme nach oben geführt werden. Die Spannweite sagt, wie hoch der vordere Arm am obersten Punkt stehen darf. Die Abschwungzone ergibt sich getrennt aus deinen Armmaßen.</div>`}
  ${m.status!=='paused'?`<div class="card"><div class="sec-h"><h2>Deine Übungen</h2></div><p class="muted small">Immer langsam und ohne Druck. Bei Schmerzen sofort beenden.</p>
   ${r.drills.focus.length?`<div class="tag-line">Für deinen Vergleichspunkt: ${esc(m.focusName)}</div>${r.drills.focus.map(drillCard).join('')}`:''}
   <div class="tag-line">Grundlagen für jede Einheit</div>${r.drills.basis.filter(Boolean).map(drillCard).join('')}</div>`:''}
  <div class="offer"><small>Dein nächster Schritt</small><div class="offer-h"><div><h2>${esc(r.offer.name)}</h2><p>${r.offer.count} Termine à ${r.offer.minutes} Minuten</p></div><div class="price"><small>${esc(r.offer.priceLabel)}</small><b>${esc(r.offer.priceText)}</b></div></div>
   <div class="offer-s">${r.offer.sessions.map(se=>`<div><small>Termin ${se.n}</small><b>${esc(se.title)}</b><p>${esc(se.text)}</p></div>`).join('')}</div>
   <p class="offer-f">Interesse? Sprich mich gern direkt an: www.matthiasberger.pro</p></div>
  <div class="card flat"><p><b>Matthias Berger · Golf Professional</b><br><span class="muted">www.matthiasberger.pro</span></p></div>
 </div>`;
}
function viewReport(sid){
 const s=Store.session(sid),c=Store.client(s.clientId);
 S.sessionId=null;S.inputs=null;
 const r=buildReport(s.inputs,c);
 const canShare=!!(navigator.canShare&&typeof File!=='undefined'&&(()=>{try{return navigator.canShare({files:[new File(['x'],'x.pdf',{type:'application/pdf'})]});}catch(e){return false;}})());
 app.innerHTML=`
 <div class="row between no-print" style="margin-bottom:14px">
  <button class="btn ghost small" id="edit">‹ Check bearbeiten</button>
  <div class="row"><button class="btn" id="pdf">PDF herunterladen</button>${canShare?'<button class="btn secondary" id="share">Teilen / Mail</button>':''}${c.email?'<button class="btn secondary" id="mail">E-Mail-Entwurf</button>':''}<button class="btn secondary" id="print">Drucken</button></div>
 </div>
 ${reportHTML(r)}
 <div class="row no-print" style="margin-top:6px"><button class="btn ghost" id="tolist">Zum Kunden</button><button class="btn ghost" id="again">Neuer Check für ${esc(clientName(c))}</button></div>`;
 $('#edit').onclick=()=>go('#/check/'+sid+'/5');
 $('#tolist').onclick=()=>go('#/client/'+c.id);
 $('#again').onclick=()=>startCheck(c.id);
 $('#print').onclick=()=>window.print();
 const busy=async(btn,fn)=>{const old=btn.textContent;btn.disabled=true;btn.textContent='PDF wird erstellt …';try{await fn();}catch(e){console.error(e);toast('PDF konnte nicht erstellt werden: '+e.message,5000);}finally{btn.disabled=false;btn.textContent=old;}};
 $('#pdf').onclick=e=>busy(e.currentTarget,async()=>{const bytes=await makeReportPDF(r);await downloadBytes(bytes,pdfFileName(r));toast('PDF erstellt. Auf dem iPad unter „Downloads“ in Dateien.');});
 if(canShare)$('#share').onclick=e=>busy(e.currentTarget,async()=>{const bytes=await makeReportPDF(r);const file=new File([bytes],pdfFileName(r),{type:'application/pdf'});try{await navigator.share({files:[file],title:'Dein Schwung-DNA-Profil',text:'Hallo '+(c.name||'')+', hier ist dein persönlicher Schwung-DNA-Bericht.'});}catch(err){if(err.name!=='AbortError')throw err;}});
 if(c.email)$('#mail').onclick=()=>{const sub=encodeURIComponent('Dein Schwung-DNA-Profil'),body=encodeURIComponent('Hallo '+(c.name||'')+',\n\nanbei dein persönlicher Schwung-DNA-Bericht.\n\nDeine Aufgabe: '+r.priority+'\n\nViele Grüße\nMatthias Berger\nwww.matthiasberger.pro');location.href='mailto:'+encodeURIComponent(c.email)+'?subject='+sub+'&body='+body;};
 app.onclick=null;app.oninput=null;
}

// ---------- Start ----------
$('#brand').onclick=()=>go('#/');
setInterval(paintSave,3000);
window.addEventListener('beforeunload',flushSave);
document.addEventListener('visibilitychange',()=>{if(document.hidden)flushSave();});
if('serviceWorker' in navigator&&location.protocol.startsWith('http')){navigator.serviceWorker.register('sw.js').catch(()=>{});}
route();
window.SchwungApp={route,startCheck,S};
})();
