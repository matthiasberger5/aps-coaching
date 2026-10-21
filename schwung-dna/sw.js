// Offline-Betrieb: Netz zuerst, bei fehlendem Netz der zuletzt geladene Stand. Nur Dateien dieser App.
const CACHE='schwung-dna-v2-5';
const ASSETS=['./','index.html','css/styles.css','js/rules.js','js/drills.js','js/model.js','js/store.js','js/charts.js','js/pdf.js','js/app.js','lib/pdf-lib.min.js','manifest.webmanifest','icon.png',
 'assets/grip/comparison.png','assets/new-horizons/Swing_Track_3_topsets4-375x190.png','assets/new-horizons/slotting_-down_RDL_2-405x231.png','assets/new-horizons/slotting_-cross_RDL_2-405x217.png','assets/new-horizons/slotting_-shoulder_RDL_2-405x226.png','assets/new-horizons/swing_path_under_sequence1a-360x131.png','assets/new-horizons/swing_path_side-on_seqjuence1a-360x143.png','assets/new-horizons/swing_path_on-top_sequence1a-360x139.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('schwung-dna-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
 const req=e.request;if(req.method!=='GET'||new URL(req.url).origin!==location.origin)return;
 e.respondWith(fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return res;}).catch(()=>caches.match(req).then(m=>m||caches.match('index.html'))));
});
