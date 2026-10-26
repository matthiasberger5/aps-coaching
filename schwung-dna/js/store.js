// Lokale Speicherung im Browser dieses Geräts (localStorage). Kein Server, keine Cloud.
// Fällt automatisch auf Arbeitsspeicher zurück, wenn der Browser Speichern verweigert (z. B. privates Fenster).
const Store=(()=>{
 const KEY='schwungdna.v2',BACKUP_KEY='schwungdna.lastBackup';
 let mem=null,persistent=true;
 const empty=()=>({version:2,clients:[],sessions:[]});
 const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
 const now=()=>new Date().toISOString();
 // IDs landen in HTML-Attributen; nur harmlose Zeichen zulassen (Schutz bei importierten Dateien).
 const safeId=id=>typeof id==='string'&&/^[a-z0-9_-]{1,40}$/i.test(id);
 const stamp=x=>x.updated||x.created||'';
 // Ein Check ohne jede Testeingabe gilt als leer.
 const TEST_KEYS=['fold','height','span','upper','fore','post','hip','hitsHabit','hitsCompare','trial','vidHip','vidBack','vidDown'];
 const sessionEmpty=s=>TEST_KEYS.every(k=>s.inputs?.[k]===''||s.inputs?.[k]==null);
 function load(){
  if(mem)return mem;
  try{const raw=localStorage.getItem(KEY);mem=raw?JSON.parse(raw):empty();if(!mem.clients||!mem.sessions)mem=empty();}
  catch(e){persistent=false;mem=empty();}
  return mem;
 }
 function save(){
  try{localStorage.setItem(KEY,JSON.stringify(mem));persistent=true;}catch(e){persistent=false;}
  return persistent;
 }
 return {
  uid,
  get persistent(){load();return persistent;},
  // Bittet den Browser, die Daten nicht automatisch zu löschen (Safari löscht sonst nach 7 Tagen ohne Besuch).
  async requestPersist(){
   try{if(navigator.storage?.persisted&&await navigator.storage.persisted())return true;if(navigator.storage?.persist)return await navigator.storage.persist();}catch(e){}
   return false;
  },
  clients(){return load().clients.slice().sort((a,b)=>(this.lastDate(b.id)||b.created).localeCompare(this.lastDate(a.id)||a.created));},
  client(id){return load().clients.find(c=>c.id===id)||null;},
  saveClient(c){const d=load();const i=d.clients.findIndex(x=>x.id===c.id);if(i>=0)d.clients[i]={...d.clients[i],...c,updated:now()};else d.clients.push({id:uid(),created:now(),...c});save();return i>=0?d.clients[i]:d.clients[d.clients.length-1];},
  deleteClient(id){const d=load();d.clients=d.clients.filter(c=>c.id!==id);d.sessions=d.sessions.filter(s=>s.clientId!==id);save();},
  // Entfernt abgebrochene Neuanlagen: Kunde ohne Namen, dessen Checks keine einzige Testeingabe enthalten.
  purgeEmpty(exceptId=null){
   const d=load();
   const drop=d.clients.filter(c=>c.id!==exceptId&&!(c.name||'').trim()&&!(c.email||'').trim()&&d.sessions.filter(s=>s.clientId===c.id).every(sessionEmpty)).map(c=>c.id);
   if(!drop.length)return 0;
   d.clients=d.clients.filter(c=>!drop.includes(c.id));d.sessions=d.sessions.filter(s=>!drop.includes(s.clientId));save();
   return drop.length;
  },
  sessions(clientId){return load().sessions.filter(s=>s.clientId===clientId).sort((a,b)=>(a.inputs.date||'').localeCompare(b.inputs.date||'')||a.created.localeCompare(b.created));},
  session(id){return load().sessions.find(s=>s.id===id)||null;},
  lastDate(clientId){const s=this.sessions(clientId);return s.length?s[s.length-1].inputs.date:'';},
  newSession(clientId,inputs){const d=load();const s={id:uid(),clientId,created:now(),inputs};d.sessions.push(s);save();return s;},
  saveSession(id,inputs){const d=load();const s=d.sessions.find(x=>x.id===id);if(!s)return false;s.inputs={...inputs};s.updated=now();return save();},
  deleteSession(id){const d=load();d.sessions=d.sessions.filter(s=>s.id!==id);save();},
  exportJSON(){return JSON.stringify({app:'schwung-dna',exported:now(),...load()},null,1);},
  markBackup(){try{localStorage.setItem(BACKUP_KEY,now());}catch(e){}},
  lastBackup(){try{return localStorage.getItem(BACKUP_KEY)||'';}catch(e){return '';}},
  // Neue Einträge werden übernommen, vorhandene nur ersetzt, wenn die Sicherung einen neueren Stand hat.
  importJSON(text){
   const incoming=JSON.parse(text);
   if(!Array.isArray(incoming.clients)||!Array.isArray(incoming.sessions))throw new Error('Datei enthält keine Schwung-DNA-Daten.');
   const d=load();let nc=0,ns=0,upd=0,skipped=0;
   const merge=(list,x,isValid)=>{
    if(!x||!safeId(x.id)||!isValid(x)){skipped++;return 0;}
    const i=list.findIndex(y=>y.id===x.id);
    if(i<0){list.push(x);return 1;}
    if(stamp(x)>stamp(list[i])){list[i]=x;upd++;}
    return 0;
   };
   incoming.clients.forEach(c=>{nc+=merge(d.clients,c,c=>typeof c.created==='string');});
   incoming.sessions.forEach(s=>{ns+=merge(d.sessions,s,s=>safeId(s.clientId)&&s.inputs&&typeof s.inputs==='object'&&typeof s.created==='string');});
   save();return {clients:nc,sessions:ns,updated:upd,skipped};
  },
  wipe(){mem=empty();save();},
  counts(){const d=load();return {clients:d.clients.length,sessions:d.sessions.length};}
 };
})();
