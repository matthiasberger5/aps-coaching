'use strict';
const uid = () => (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function')
  ? globalThis.crypto.randomUUID()
  : 'aps-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);

const OPTIONS = {
  types:['Abschlag','Transportschlag','Recovery','Bunkerschlag','Kurzspiel','Putt'],
  subtypes:{Bunkerschlag:['Grünbunker','Fairwaybunker'],Kurzspiel:['Chip','Pitch','Lob']},
  clubs:['Driver','Holz 3','Holz 5','Holz 7','Hybrid 2','Hybrid 3','Hybrid 4','Eisen 4','Eisen 5','Eisen 6','Eisen 7','Eisen 8','Eisen 9','PW','GW','SW','LW','Putter'],
  contact:['Miss – Ball kaum bewegt','Fett','Dünn','Solide','Sauber'],
  bunkerContact:['Ball kaum bewegt','Zu viel Sand','Zu wenig Sand / dünn','Solide','Sauber'],
  direction:['Stark links','Links','Zielbereich','Rechts','Stark rechts'],
  puttDirection:['Links vorbei','Startlinie passend','Rechts vorbei'],
  distance:['Viel zu kurz','Zu kurz','Passend','Zu lang','Viel zu lang'],
  lies:{
    Abschlag:['Fairway','Semi-Rough','Rough','Fairwaybunker','Recovery-Lage','Penalty Area','Aus','Ball kaum bewegt'],
    Transportschlag:['Fairway','Semi-Rough','Rough','Vorgrün','Grün','Bunker','Recovery-Lage','Penalty Area','Aus','Ball kaum bewegt'],
    Recovery:['Fairway','Semi-Rough','Rough','Vorgrün','Grün','Bunker','Recovery-Lage','Penalty Area','Aus','Ball kaum bewegt'],
    Bunkerschlag:['Grün','Vorgrün','Fairway','Rough','Im selben Bunker','Anderer Bunker','Recovery-Lage','Penalty Area','Aus'],
    Kurzspiel:['Eingelocht','Grün','Vorgrün','Rough','Bunker','Recovery-Lage']
  },
  puttStart:['Bis 1 m','1–2 m','2–5 m','5–10 m','Über 10 m'],
  rest:['Eingelocht','Bis 0,5 m','0,5–1 m','1–2 m','2–3 m','Über 3 m'],
  shortRest:['Eingelocht','Bis 0,5 m','0,5–1 m','1–2 m','2–5 m','Über 5 m'],
  penalties:['0','1','2'],
  penaltyReasons:['Penalty Area / Wasser','Aus','Unspielbar','Sonstige Regelstrafe']
};

const newShot = (type='Abschlag') => ({id:uid(),type,subtype:'',club:type==='Putt'?'Putter':'',contact:'',direction:'',distance:'',lie:'',puttStart:'',rest:'',penalties:'0',penaltyReason:''});
const newHole = n => ({id:uid(),number:n,par:4,score:'',shots:[newShot(n===1?'Abschlag':'Abschlag')]});
const initialState = () => ({version:'2.0',player:{name:'',handicap:'',date:new Date().toISOString().slice(0,10),course:'',note:''},holes:[newHole(1)],activeHole:0,lastAnalysis:null,archive:[]});

function sampleState(){
 const s=initialState(); s.player={name:'Max Mustermann',handicap:'18.4',date:new Date().toISOString().slice(0,10),course:'APS Test Course',note:'Feldtest'};
 const mk=(type,club,contact,direction,distance,lie,extra={})=>({id:uid(),type,subtype:'',club,contact,direction,distance,lie,puttStart:'',rest:'',penalties:'0',penaltyReason:'',...extra});
 s.holes=[
 {id:uid(),number:1,par:4,score:6,shots:[mk('Abschlag','Driver','Solide','Stark rechts','Passend','Recovery-Lage'),mk('Recovery','Eisen 7','Solide','Zielbereich','Passend','Fairway'),mk('Transportschlag','Eisen 8','Dünn','Links','Zu kurz','Vorgrün'),mk('Kurzspiel','SW','Solide','Zielbereich','Zu kurz','Grün',{subtype:'Chip',rest:'2–5 m'}),mk('Putt','Putter','','Startlinie passend','Viel zu kurz','',{puttStart:'2–5 m',rest:'1–2 m'}),mk('Putt','Putter','','Startlinie passend','Passend','',{puttStart:'1–2 m',rest:'Eingelocht'})]},
 {id:uid(),number:2,par:5,score:7,shots:[mk('Abschlag','Driver','Sauber','Stark links','Passend','Aus',{penalties:'1',penaltyReason:'Aus'}),mk('Abschlag','Driver','Solide','Rechts','Passend','Rough'),mk('Transportschlag','Holz 5','Dünn','Rechts','Zu kurz','Fairway'),mk('Transportschlag','Holz 5','Dünn','Links','Zu kurz','Fairway'),mk('Transportschlag','PW','Solide','Zielbereich','Passend','Grün'),mk('Putt','Putter','','Startlinie passend','Zu kurz','',{puttStart:'5–10 m',rest:'1–2 m'}),mk('Putt','Putter','','Startlinie passend','Passend','',{puttStart:'1–2 m',rest:'Eingelocht'})]},
 {id:uid(),number:3,par:3,score:4,shots:[mk('Abschlag','Eisen 7','Sauber','Zielbereich','Passend','Grün'),mk('Putt','Putter','','Startlinie passend','Viel zu lang','',{puttStart:'Über 10 m',rest:'2–3 m'}),mk('Putt','Putter','','Links vorbei','Passend','',{puttStart:'2–5 m',rest:'Bis 0,5 m'}),mk('Putt','Putter','','Startlinie passend','Passend','',{puttStart:'Bis 1 m',rest:'Eingelocht'})]}
 ]; return s;
}


const bad = v => ['Miss – Ball kaum bewegt','Fett','Dünn','Ball kaum bewegt','Zu viel Sand','Zu wenig Sand / dünn','Stark links','Stark rechts','Viel zu kurz','Viel zu lang'].includes(v);
const medium = v => ['Links','Rechts','Zu kurz','Zu lang'].includes(v);
const pct=(n,d)=>d?Math.round(n/d*100):0;
const titleCase=s=>s||'–';

function allShots(state){return state.holes.flatMap(h=>h.shots.map((s,i)=>({...s,hole:h.number,shotNo:i+1})));}
function issue(name,pillar,shots,filter,cause,training,strategy,goal){const hits=shots.filter(filter);return {name,pillar,count:hits.length,total:shots.length,impact:hits.reduce((a,s)=>a+Number(s.penalties||0)+(s.lie==='Recovery-Lage'?1:0)+(s.lie==='Aus'?1:0),0),cause,training,strategy,goal,evidence:hits};}

function analyse(state){
 const shots=allShots(state), nonPutts=shots.filter(s=>s.type!=='Putt'), putts=shots.filter(s=>s.type==='Putt'), penalties=shots.reduce((a,s)=>a+Number(s.penalties||0),0);
 const issues=[];
 issues.push(issue('Ballkontakt', 'Ballkontakt', nonPutts, s=>bad(s.contact), 'Wiederkehrende Miss-, Fett- oder Dünnkontakte.', 'Treffmoment und Bodenreferenz mit dem betroffenen Schläger trainieren.', 'Bis zur Stabilisierung einen zuverlässigeren Schläger wählen.', '8 von 10 solide oder sauber getroffene Bälle.'));
 issues.push(issue('Richtungskontrolle', 'Richtungskontrolle', nonPutts, s=>bad(s.direction), 'Große Links-/Rechtsabweichungen erzeugen schwierige Folgeschläge.', 'Startlinie und Schlagflächenkontrolle mit Zielkorridoren trainieren.', 'Auf engen Bahnen konservativer zielen oder kürzeren Schläger wählen.', 'Mindestens 7 von 10 Bälle im Zielkorridor.'));
 issues.push(issue('Distanzkontrolle', 'Distanzkontrolle', nonPutts, s=>bad(s.distance), 'Große Längenfehler verhindern die geplante Folgeposition.', 'Distanzfenster und Carry-Kontrolle je Schläger trainieren.', 'Zielzone vergrößern und Schlägerwahl konservativer treffen.', '8 von 10 Schlägen im definierten Distanzfenster.'));
 issues.push(issue('Abschlagleistung', 'Abschlagleistung', shots.filter(s=>s.type==='Abschlag'), s=>['Recovery-Lage','Penalty Area','Aus'].includes(s.lie)||Number(s.penalties)>0, 'Unspielbare Abschläge und Strafschläge treiben den Score.', 'Tee-Shots in einen breiten Spielkorridor trainieren.', 'Auf engen Bahnen den zuverlässigsten Abschlagschläger einsetzen.', 'Mindestens 8 von 10 Abschläge spielbar.'));
 issues.push(issue('Kurzspiel', 'Kurzspiel', shots.filter(s=>s.type==='Kurzspiel'||s.type==='Bunkerschlag'), s=>bad(s.contact)||bad(s.distance)||['Bunker','Recovery-Lage','Im selben Bunker'].includes(s.lie)||['2–5 m','Über 5 m'].includes(s.rest), 'Kontakt- oder Längenfehler lassen zu lange Putts übrig.', 'Landepunkt und Ausrolllänge in Ergebniszonen trainieren.', 'Den Schlag mit der größten Sicherheitsmarge wählen.', '8 von 10 Bälle innerhalb von 2 m.'));
 issues.push(issue('Putten', 'Putten', putts, s=>bad(s.distance)||['2–3 m','Über 3 m'].includes(s.rest), 'Das Putttempo lässt zu lange Rückputts und Dreiputtrisiko entstehen.', 'Tempo aus 5, 8, 10 und 12 Metern in einen 1-m-Kreis trainieren.', 'Bei langen Putts Länge vor Richtung priorisieren.', '8 von 10 Lag Putts innerhalb von 1 m.'));
 issues.forEach(i=>{i.rate=pct(i.count,i.total);i.priority=i.count*2+i.impact*3+(i.total?i.rate/20:0)}); issues.sort((a,b)=>b.priority-a.priority);
 const clubMap={}; nonPutts.forEach(s=>{const k=s.club||'Ohne Angabe';const x=clubMap[k]??={club:k,shots:0,bad:0,penalties:0,recovery:0};x.shots++;if(bad(s.contact)||bad(s.direction)||bad(s.distance))x.bad++;x.penalties+=Number(s.penalties||0);if(s.lie==='Recovery-Lage')x.recovery++;});
 const clubs=Object.values(clubMap).map(x=>({...x,reliability:100-pct(x.bad,x.shots)})).sort((a,b)=>(b.bad+b.penalties*2)-(a.bad+a.penalties*2));
 const pillars=issues.map(i=>({name:i.pillar,score:Math.max(0,100-i.rate-i.impact*8),summary:i.count?`${i.count} auffällige Beobachtungen bei ${i.total} relevanten Schlägen.`:'Keine belastbaren Auffälligkeiten.',focus:i.training}));
 const scores=state.holes.filter(h=>h.score).map(h=>Number(h.score)), pars=state.holes.filter(h=>h.score).map(h=>Number(h.par));
 const score=scores.reduce((a,b)=>a+b,0), par=pars.reduce((a,b)=>a+b,0);
 const directionCounts=['Stark links','Links','Rechts','Stark rechts'].map(v=>[v,shots.filter(s=>s.direction===v).length]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]);
 const distanceCounts=['Viel zu kurz','Zu kurz','Zu lang','Viel zu lang'].map(v=>[v,shots.filter(s=>s.distance===v).length]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]);
 const threePutts=state.holes.filter(h=>h.shots.filter(s=>s.type==='Putt').length>=3).length;
 return {shots,putts,penalties,score,par,scoreToPar:score&&par?score-par:null,issues,priorities:issues.filter(i=>i.count).slice(0,3),clubs,pillars,patterns:[...directionCounts,...distanceCounts].slice(0,6),threePutts};
}

function trainingFrom(analysis){const p=analysis.priorities.length?analysis.priorities:[{name:'Grundlagencheck',pillar:'Gesamtspiel',training:'Alle sechs Säulen mit einem strukturierten Test prüfen.',goal:'Für jede Säule belastbare Daten erfassen.'}]; const times=p.length===1?[60]:p.length===2?[50,40]:[40,30,20];return p.map((x,i)=>({minutes:times[i]||20,title:x.name,why:x.cause||'Noch keine belastbare Ursache.',exercise:x.training,goal:x.goal}));}


const KEY='aps-2.0-state';let state=load();let analysis=null;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function load(){try{return JSON.parse(localStorage.getItem(KEY))||initialState()}catch{return initialState()}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));$('#saveState').textContent='Lokal gespeichert';}
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800)}
function fill(select,values,current='',placeholder='Bitte wählen'){select.innerHTML=`<option value="">${placeholder}</option>`+values.map(v=>`<option ${v===current?'selected':''}>${v}</option>`).join('')}
function setView(id){$$('.view').forEach(v=>v.classList.toggle('active',v.id===id));$$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===id));$('.main-nav').classList.remove('open');if(id!=='entry')renderAnalysis();window.scrollTo({top:0,behavior:'smooth'})}
$$('.nav-btn').forEach(b=>b.onclick=()=>setView(b.dataset.view));$('#menuBtn').onclick=()=>$('.main-nav').classList.toggle('open');$$('.print-btn').forEach(b=>b.onclick=()=>window.print());

function syncMeta(){state.player={name:$('#playerName').value,handicap:$('#handicap').value,date:$('#roundDate').value,course:$('#course').value,note:$('#roundNote').value};save()}
['playerName','handicap','roundDate','course','roundNote'].forEach(id=>$('#'+id).addEventListener('change',syncMeta));
function renderMeta(){$('#playerName').value=state.player.name||'';$('#handicap').value=state.player.handicap||'';$('#roundDate').value=state.player.date||'';$('#course').value=state.player.course||'';$('#roundNote').value=state.player.note||''}
function activeHole(){return state.holes[state.activeHole]}
function renderHoles(){const el=$('#holeList');el.innerHTML=state.holes.map((h,i)=>`<button class="hole-btn ${i===state.activeHole?'active':''}" data-i="${i}"><span class="hole-index">${h.number}</span><span>Par ${h.par}</span><span class="hole-score">${h.score?`${h.score} Schläge`:`${h.shots.length} erfasst`}</span></button>`).join('');el.querySelectorAll('button').forEach(b=>b.onclick=()=>{state.activeHole=Number(b.dataset.i);save();renderRound()});const score=state.holes.reduce((a,h)=>a+(Number(h.score)||0),0),par=state.holes.filter(h=>h.score).reduce((a,h)=>a+Number(h.par),0),shots=state.holes.reduce((a,h)=>a+h.shots.length,0);$('#roundTotals').innerHTML=`<div class="total-line"><span>Bahnen</span><strong>${state.holes.length}</strong></div><div class="total-line"><span>Erfasste Schläge</span><strong>${shots}</strong></div><div class="total-line"><span>Score</span><strong>${score||'–'} ${score&&par?`(${score-par>=0?'+':''}${score-par})`:''}</strong></div>`}
function configureCard(card,shot){
 const type=card.querySelector('[data-field=type]'), subtype=card.querySelector('[data-field=subtype]'), club=card.querySelector('[data-field=club]'), contact=card.querySelector('[data-field=contact]'), direction=card.querySelector('[data-field=direction]'), distance=card.querySelector('[data-field=distance]'), lie=card.querySelector('[data-field=lie]'), puttStart=card.querySelector('[data-field=puttStart]'), rest=card.querySelector('[data-field=rest]'), penalties=card.querySelector('[data-field=penalties]'), reason=card.querySelector('[data-field=penaltyReason]');
 fill(type,OPTIONS.types,shot.type);fill(club,OPTIONS.clubs,shot.club);fill(penalties,OPTIONS.penalties,shot.penalties,'0');fill(reason,OPTIONS.penaltyReasons,shot.penaltyReason);
 const isPutt=shot.type==='Putt', isShort=shot.type==='Kurzspiel', hasSubtype=OPTIONS.subtypes[shot.type];card.querySelector('.subtype-field').classList.toggle('hidden',!hasSubtype);if(hasSubtype)fill(subtype,hasSubtype,shot.subtype);
 card.querySelector('.contact-field').classList.toggle('hidden',isPutt);if(!isPutt)fill(contact,shot.type==='Bunkerschlag'?OPTIONS.bunkerContact:OPTIONS.contact,shot.contact);
 card.querySelector('.putt-distance-field').classList.toggle('hidden',!isPutt);if(isPutt)fill(puttStart,OPTIONS.puttStart,shot.puttStart);
 fill(direction,isPutt?OPTIONS.puttDirection:OPTIONS.direction,shot.direction);fill(distance,OPTIONS.distance,shot.distance);card.querySelector('.distance-label').textContent=isPutt?'Tempo / Länge':'Distanz';
 card.querySelector('.lie-field').classList.toggle('hidden',isPutt);if(!isPutt)fill(lie,OPTIONS.lies[shot.type]||OPTIONS.lies.Transportschlag,shot.lie);
 card.querySelector('.rest-field').classList.toggle('hidden',!(isPutt||isShort));if(isPutt||isShort)fill(rest,isPutt?OPTIONS.rest:OPTIONS.shortRest,shot.rest);
 card.querySelector('.penalty-reason').classList.toggle('hidden',Number(shot.penalties||0)===0);
}
function renderShots(){const hole=activeHole(),list=$('#shotList');list.innerHTML='';hole.shots.forEach((shot,i)=>{const card=$('#shotTemplate').content.firstElementChild.cloneNode(true);card.dataset.id=shot.id;card.querySelector('.shot-number').textContent=`Schlag ${i+1}`;configureCard(card,shot);card.querySelectorAll('[data-field]').forEach(input=>input.onchange=e=>{shot[e.target.dataset.field]=e.target.value;if(e.target.dataset.field==='type'){shot.subtype='';shot.contact='';shot.direction='';shot.distance='';shot.lie='';shot.rest='';shot.puttStart='';if(shot.type==='Putt')shot.club='Putter';}if(e.target.dataset.field==='penalties'&&e.target.value==='0')shot.penaltyReason='';save();renderShots();renderHoles()});card.querySelector('.delete-shot').onclick=()=>{hole.shots=hole.shots.filter(s=>s.id!==shot.id);save();renderRound()};list.append(card)});}
function renderRound(){renderHoles();const h=activeHole();$('#holeKicker').textContent=`Bahn ${h.number}`;$('#holeTitle').textContent=`${h.shots.length} Schlag${h.shots.length===1?'':'e'} erfasst`;$('#holePar').value=h.par;$('#holeScore').value=h.score;renderShots()}
$('#holePar').onchange=e=>{activeHole().par=Number(e.target.value);save();renderHoles()};$('#holeScore').onchange=e=>{activeHole().score=e.target.value;save();renderHoles()};$('#addShotBtn').onclick=()=>{const h=activeHole();h.shots.push(newShot(h.shots.length?'Transportschlag':'Abschlag'));save();renderRound()};$('#addHoleBtn').onclick=()=>{if(state.holes.length>=18)return toast('Maximal 18 Bahnen.');state.holes.push(newHole(state.holes.length+1));state.activeHole=state.holes.length-1;save();renderRound()};
$('#newRoundBtn').onclick=()=>{if(confirm('Aktuelle Runde zurücksetzen?')){state=initialState();save();renderAll();toast('Neue Runde gestartet.')}};$('#sampleBtn').onclick=()=>{state=sampleState();save();renderAll();toast('Beispieldaten geladen.')};$('#analyseBtn').onclick=()=>{analysis=analyse(state);state.lastAnalysis=analysis;state.archive=[{date:state.player.date,course:state.player.course,score:analysis.score,par:analysis.par,penalties:analysis.penalties,top:analysis.priorities[0]?.name||'Keine',player:state.player.name},...(state.archive||[])].slice(0,20);save();renderAnalysis();setView('analysis')};
function metric(label,value,detail=''){return `<div class="metric"><strong>${value}</strong><span>${label}${detail?` · ${detail}`:''}</span></div>`}
function empty(t='Noch keine ausreichenden Daten.') {return `<div class="empty-state">${t}</div>`}
function renderAnalysis(){analysis=analyse(state);const a=analysis;$('#analysisHeadline').textContent=a.priorities[0]?`Größter Trainingshebel: ${a.priorities[0].name}`:'Noch keine klare Schwäche erkennbar';$('#analysisSubline').textContent=`${a.shots.length} Schläge · ${a.penalties} Strafschläge · ${a.threePutts} Bahnen mit Dreiputt`;
 $('#summaryHero').innerHTML=a.priorities[0]?`<span class="kicker" style="color:var(--lime)">APS Coach Summary</span><h2>${a.priorities[0].name} hat aktuell die höchste Trainingspriorität.</h2><p><strong>Ursache:</strong> ${a.priorities[0].cause}<br><strong>Trainingsziel:</strong> ${a.priorities[0].goal}</p>`:empty('Erfasse weitere Schläge, damit APS belastbare Muster erkennt.');
 $('#metricGrid').innerHTML=metric('Erfasste Schläge',a.shots.length)+metric('Strafschläge',a.penalties)+metric('Dreiputt-Bahnen',a.threePutts)+metric('Score',a.score||'–',a.scoreToPar!==null?`${a.scoreToPar>=0?'+':''}${a.scoreToPar}`:'');
 $('#priorityList').innerHTML=a.priorities.length?a.priorities.map((p,i)=>`<div class="priority"><h3><span class="rank">${i+1}</span>${p.name}</h3><p class="evidence">${p.count} Auffälligkeiten bei ${p.total} relevanten Schlägen.</p><p><strong>Ursache:</strong> ${p.cause}</p><p><strong>Training:</strong> ${p.training}</p><p><strong>Messziel:</strong> ${p.goal}</p></div>`).join(''):empty();
 $('#strategyList').innerHTML=a.priorities.length?a.priorities.map(p=>`<div class="priority"><h3>${p.name}</h3><p>${p.strategy}</p></div>`).join(''):empty();
 $('#pillarGrid').innerHTML=a.pillars.map(p=>`<div class="pillar"><div class="pillar-head"><strong>${p.name}</strong><span class="pillar-score">${Math.round(p.score)}%</span></div><div class="bar"><span style="width:${p.score}%"></span></div><p>${p.summary}</p><p><strong>Fokus:</strong> ${p.focus}</p></div>`).join('');
 $('#clubTable').innerHTML=a.clubs.length?`<table class="data-table"><thead><tr><th>Schläger</th><th>Schläge</th><th>Auffällig</th><th>Strafe</th><th>Zuverlässigkeit</th></tr></thead><tbody>${a.clubs.map(c=>`<tr><td><strong>${c.club}</strong></td><td>${c.shots}</td><td>${c.bad}</td><td>${c.penalties}</td><td><span class="tag">${c.reliability}%</span></td></tr>`).join('')}</tbody></table>`:empty();
 $('#patternList').innerHTML=a.patterns.length?a.patterns.map(([n,c])=>`<div class="priority"><h3>${n}</h3><p>${c} beobachtete${c===1?'r':'e'} Fehler.</p></div>`).join(''):empty('Noch keine wiederkehrenden Links-, Rechts-, Kurz- oder Langmuster.');renderTraining();renderProfile();}
function renderTraining(){const plan=trainingFrom(analysis||analyse(state));$('#trainingPlan').innerHTML=plan.map((x,i)=>`<article class="training-card"><span class="kicker">Priorität ${i+1}</span><div class="minutes">${x.minutes} Min.</div><h2>${x.title}</h2><p><strong>Warum:</strong> ${x.why}</p><p><strong>Übung:</strong> ${x.exercise}</p><p><strong>Messziel:</strong> ${x.goal}</p></article>`).join('')}
function renderProfile(){const a=analysis||analyse(state);$('#profileName').textContent=state.player.name?`${state.player.name} · Player Profile`:'APS Player Profile';$('#profileMeta').textContent=[state.player.handicap&&`HCP ${state.player.handicap}`,state.player.course,state.player.date].filter(Boolean).join(' · ')||'Noch keine Spielerdaten.';$('#profileMetrics').innerHTML=metric('Runden im Archiv',(state.archive||[]).length)+metric('Aktuelle Schläge',a.shots.length)+metric('Aktueller Score',a.score||'–')+metric('Strafschläge',a.penalties);const strengths=a.pillars.filter(p=>p.score>=75).sort((x,y)=>y.score-x.score);$('#strengthList').innerHTML=strengths.length?strengths.map(s=>`<div class="priority"><h3>${s.name}</h3><p>${s.summary}</p></div>`).join(''):empty('Noch keine Stärke ist ausreichend belegt.');$('#weaknessList').innerHTML=a.priorities.length?a.priorities.map(p=>`<div class="priority"><h3>${p.name}</h3><p>${p.count} auffällige Beobachtungen. ${p.cause}</p></div>`).join(''):empty();const ar=state.archive||[];$('#roundArchive').innerHTML=ar.length?`<table class="data-table"><thead><tr><th>Datum</th><th>Platz</th><th>Score</th><th>Strafen</th><th>Top-Priorität</th></tr></thead><tbody>${ar.map(r=>`<tr><td>${r.date||'–'}</td><td>${r.course||'–'}</td><td>${r.score||'–'}${r.score&&r.par?` (${r.score-r.par>=0?'+':''}${r.score-r.par})`:''}</td><td>${r.penalties}</td><td>${r.top}</td></tr>`).join('')}</tbody></table>`:empty('Noch keine abgeschlossene Analyse im Archiv.')}
$('#exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`APS_2_0_${(state.player.name||'Spieler').replace(/\s+/g,'_')}.json`;a.click();URL.revokeObjectURL(a.href)};$('#importInput').onchange=async e=>{try{state=JSON.parse(await e.target.files[0].text());save();renderAll();toast('Daten importiert.')}catch{toast('Import fehlgeschlagen.')}};
function renderAll(){renderMeta();renderRound();renderAnalysis()}renderAll();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js');
