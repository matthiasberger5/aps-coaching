const fs=require('fs'),vm=require('vm'),assert=require('assert');
const {createCanvas,Image,GlobalFonts}=require('@napi-rs/canvas');
for(const f of ['DejaVuSans.ttf','DejaVuSans-Bold.ttf']){const path='/usr/share/fonts/truetype/dejavu/'+f;if(fs.existsSync(path))GlobalFonts.registerFromPath(path,'Arial');}
const elements={};const get=id=>elements[id]||(elements[id]={value:'',innerHTML:'',textContent:'',addEventListener(){},checkValidity(){return true}});
get('hand').value='Rechts';get('pain').value='Keine angegeben';
const ctx={document:{getElementById:get,createElement:t=>t==='canvas'?createCanvas(1240,1754):{},activeElement:null},TextEncoder,Blob,Image,atob,console,confirm:()=>true,setTimeout,requestAnimationFrame:fn=>fn()};vm.createContext(ctx);
for(const f of ['rules.js','app.js','pdf.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);const run=s=>vm.runInContext(s,ctx);
run("el('height').value='170';el('span').value='164';el('upper').value='38';el('fore').value='34';el('fold').value='Side On';render()");
let r=run('buildReport()');assert.equal(r.power.key,'spin');assert.equal(r.bodyPicture,'sideon');assert(get('bodypicture').innerHTML.includes('side-on'));assert.equal(r.back.plane,'low');assert.equal(r.down.plane,'shaft');assert(!r.finding.includes('Ballkontakt war'));assert(r.power.grip.toLowerCase().includes('hintere hand'));
run("el('span').value='176';el('fore').value='42';el('fold').value='On Top';render()");r=run('buildReport()');assert.equal(r.power.key,'launch');assert.equal(r.bodyPicture,'ontop');assert.equal(r.back.plane,'high');assert.equal(r.down.plane,'shoulder');
run("el('span').value='170';el('fore').value='38';el('fold').value='Side/Under';render()");r=run('buildReport()');assert.equal(r.power.key,'glide');assert.equal(r.bodyPicture,'under');assert.equal(r.back.plane,'mid');assert.equal(r.down.plane,'elbow');
run("el('span').value='170.5';el('fore').value='38.5';render()");r=run('buildReport()');assert.equal(r.back.plane,null);assert.equal(r.down.plane,null);assert(r.model.gaps.includes('Armmaße erneut messen'));
run("el('fold').value='Uneindeutig';render()");assert.equal(run('buildReport().power'),null);
run("el('pain').value='Bewegung eingeschränkt';render()");r=run('buildReport()');assert.equal(r.power,null);assert.equal(r.back,null);assert.equal(r.bodyPicture,null);assert.equal(r.model.status,'paused');assert(r.task.includes('schmerzfreie'));
run("el('pain').value='Keine angegeben';el('hand').value='Links';el('fold').value='On Top';render()");r=run('buildReport()');assert(!r.power.grip.includes('rechte Hand'));
const html=fs.readFileSync('index.html','utf8');assert(html.includes('Mittelfingerspitze–Mittelfingerspitze'));assert(html.includes('for="post"'));assert(html.includes('for="hip"'));for(const p of Object.values(run('PICTURES')))assert(fs.existsSync(p.src));
run("el('leadgrip').value='Neutral';el('post').value='Rear';el('hip').value='Mid';el('trial').value='better';el('focus').value='motion';render()");
run("el('span').value='176';el('fore').value='42';render()");r=run('buildReport()');assert(r.model.screenComplete);assert(r.model.bodydetail.includes('hinteren Seite'));assert(!r.model.bodydetail.includes('Gewicht hinten'));
run("el('trial').value='worse';render()");assert(!run('buildReport().task').includes('Probeschwünge'));
run("el('leadgrip').value='';el('hip').value='Slow';render()");assert(run('buildReport().model.grip').includes('schwächeren'));
assert.equal(run('buildReport().model.armback.plane'),'shoulder');
run("el('fold').value='Side On';el('hip').value='Mid';el('focus').value='grip';el('trial').value='better';render()");r=run('buildReport()');assert(r.priority.includes('nur Griffansatz'));assert(!r.task.includes('Körperbewegung verändern'));assert(r.model.trialText.includes('Griffansatz'));
run("el('focus').value='down';render()");assert(run('buildReport().priority').includes('nur Abschwungzone'));
run("el('pressure').value='rear';render()");assert(run('buildReport().model.bodydetail').includes('Druck unter dem hinteren Fuß'));
run("el('pressure').value='';el('focus').value='motion';render()");
for(const id of ['powerobs','powerbasis','coachstatus','reportnote'])assert(!html.includes('id="'+id+'"'));
assert(!html.includes('Der Ablauf führt dich'));assert(!html.includes('Bereitlegen:'));
const steps=['01 · Arm-Pendeltest','02 · Körperproportionen','03 · Post-/Pivot-Test','04 · Hip-Speed-Test','05 · Am Ball'];assert(steps.every((x,i)=>i===0||html.indexOf(x)>html.indexOf(steps[i-1])));
const domIds=[...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(domIds).size,domIds.length);for(const id of run('ids'))assert(domIds.includes(id));assert(!html.includes('id="hang"'));

run("el('fold').value='Side On';el('height').value='170';el('span').value='176';el('upper').value='35';el('fore').value='40';el('post').value='Center';el('hip').value='Slow';el('leadgrip').value='';el('focus').value='';el('trial').value='unclear';render()");
r=run('buildReport()');assert.equal(r.model.chosenFocus,'grip');assert.equal(r.model.status,'compare');assert.equal(r.gripPicture,'gripweak');assert.equal(get('scorecard').hidden,false);assert(r.planTitle.includes('keine feste Umstellung'));assert(r.steps[0].includes('weniger'));assert(r.priority.includes('nur Griffansatz'));assert(!r.task.includes('..'));assert(r.model.backExplanation.includes('mittleren Armführung'));assert(r.model.backExplanation.includes('oberhalb'));
run("el('hand').value='Links';render()");assert(run('buildReport().steps[0]').includes('vordere Hand'));assert(!run('buildReport().steps[0]').includes('linke Hand'));
run("el('hip').value='Fast';render()");assert(run('buildReport().steps[0]').includes('mehr Fingerknöchel'));assert.equal(run('buildReport().gripPicture'),'gripstrong');assert(get('bodypicture').innerHTML.includes('mirror'));
run("el('trial').value='better';render()");assert.equal(run('buildReport().model.status'),'favorable');
run("el('trial').value='worse';render()");assert.equal(run('buildReport().model.status'),'rejected');assert(!run('buildReport().task').includes('Knöchel'));
run("el('focus').value='back';el('trial').value='same';render()");assert.equal(run('buildReport().model.chosenFocus'),'back');assert(run('buildReport().steps[0]').includes('oberhalb'));
assert(html.includes('id="trainingblock"'));assert(html.includes('#trainingblock,#nextblock{break-inside:avoid'));
run("el('hand').value='Rechts';el('focus').value='motion';el('hip').value='Mid';render()");
console.log('OK: geführtes Screening / vier Blöcke / drei Bereiche, alle Typen und Ebenen, Gleichheit, Grenzfälle, Beschwerden, Links');
(async()=>{fs.mkdirSync('../tmp/pdfs',{recursive:true});
 for(const [label,span,fore,fold] of [['low',164,34,'Side On'],['mid',170,38,'Side/Under'],['high',176,42,'On Top'],['unclear',170.5,38.5,'Uneindeutig']]){
 run("el('name').value='Beispielkunde';el('hand').value='Rechts';el('upper').value='38';el('span').value='"+span+"';el('fore').value='"+fore+"';el('fold').value='"+fold+"';el('trial').value='better';el('focus').value='motion';el('hip').value='Mid';el('leadgrip').value='Neutral';render()");const blob=await run('createReportPDF()');fs.writeFileSync('../tmp/pdfs/three-'+label+'.pdf',Buffer.from(await blob.arrayBuffer()));}
 run("el('span').value='176';el('upper').value='35';el('fore').value='40';el('fold').value='Side On';el('post').value='Center';el('hip').value='Slow';el('leadgrip').value='';el('focus').value='grip';el('trial').value='unclear';render()");
 const customer=await run('createReportPDF()');fs.writeFileSync('../tmp/pdfs/training-customer.pdf',Buffer.from(await customer.arrayBuffer()));
 run("el('upper').value='37';el('fore').value='42';el('post').value='Front';el('pressure').value='front';el('trial').value='better';render()");const latest=await run('createReportPDF()');fs.writeFileSync('../tmp/pdfs/latest-customer.pdf',Buffer.from(await latest.arrayBuffer()));
 console.log('OK: vier Profilfälle und zwei Kundenfälle als PDF erstellt');
})().catch(e=>{console.error(e);process.exitCode=1});
