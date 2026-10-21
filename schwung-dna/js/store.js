// Lokale Speicherung im Browser dieses Geräts (localStorage). Kein Server, keine Cloud.
// Fällt automatisch auf Arbeitsspeicher zurück, wenn der Browser Speichern verweigert (z. B. privates Fenster).
const Store=(()=>{
 const KEY='schwungdna.v2';
 let mem=null,persistent=true;
 const empty=()=>({version:2,clients:[],sessions:[]});
 const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
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
  clients(){return load().clients.slice().sort((a,b)=>(this.lastDate(b.id)||b.created).localeCompare(this.lastDate(a.id)||a.created));},
  client(id){return load().clients.find(c=>c.id===id)||null;},
  saveClient(c){const d=load();const i=d.clients.findIndex(x=>x.id===c.id);if(i>=0)d.clients[i]={...d.clients[i],...c};else d.clients.push({id:uid(),created:new Date().toISOString(),...c});save();return i>=0?d.clients[i]:d.clients[d.clients.length-1];},
  deleteClient(id){const d=load();d.clients=d.clients.filter(c=>c.id!==id);d.sessions=d.sessions.filter(s=>s.clientId!==id);save();},
  sessions(clientId){return load().sessions.filter(s=>s.clientId===clientId).sort((a,b)=>(a.inputs.date||'').localeCompare(b.inputs.date||'')||a.created.localeCompare(b.created));},
  session(id){return load().sessions.find(s=>s.id===id)||null;},
  lastDate(clientId){const s=this.sessions(clientId);return s.length?s[s.length-1].inputs.date:'';},
  newSession(clientId,inputs){const d=load();const s={id:uid(),clientId,created:new Date().toISOString(),inputs};d.sessions.push(s);save();return s;},
  saveSession(id,inputs){const d=load();const s=d.sessions.find(x=>x.id===id);if(!s)return false;s.inputs={...inputs};s.updated=new Date().toISOString();return save();},
  deleteSession(id){const d=load();d.sessions=d.sessions.filter(s=>s.id!==id);save();},
  exportJSON(){return JSON.stringify({app:'schwung-dna',exported:new Date().toISOString(),...load()},null,1);},
  importJSON(text){
   const incoming=JSON.parse(text);
   if(!Array.isArray(incoming.clients)||!Array.isArray(incoming.sessions))throw new Error('Datei enthält keine Schwung-DNA-Daten.');
   const d=load();let nc=0,ns=0;
   incoming.clients.forEach(c=>{if(!d.clients.some(x=>x.id===c.id)){d.clients.push(c);nc++;}});
   incoming.sessions.forEach(s=>{if(!d.sessions.some(x=>x.id===s.id)){d.sessions.push(s);ns++;}});
   save();return {clients:nc,sessions:ns};
  },
  wipe(){mem=empty();save();},
  counts(){const d=load();return {clients:d.clients.length,sessions:d.sessions.length};}
 };
})();
