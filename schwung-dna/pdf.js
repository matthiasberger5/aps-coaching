// Self-contained PDF export: each A4 page is a high-resolution JPEG.
function jpegPagesPDF(pages,width,height){
 const enc=new TextEncoder(),chunks=[],offsets=[0];let length=0;
 const add=data=>{const b=typeof data==='string'?enc.encode(data):data;chunks.push(b);length+=b.length};
 const object=(id,body)=>{offsets[id]=length;add(id+' 0 obj\n');add(body);add('\nendobj\n')};
 add('%PDF-1.4\n');object(1,'<< /Type /Catalog /Pages 2 0 R >>');
 object(2,'<< /Type /Pages /Count '+pages.length+' /Kids ['+pages.map((_,i)=>(3+i*3)+' 0 R').join(' ')+'] >>');
 pages.forEach((bytes,i)=>{const n=3+i*3;object(n,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Photo '+(n+1)+' 0 R >> >> /Contents '+(n+2)+' 0 R >>');
 offsets[n+1]=length;add((n+1)+' 0 obj\n<< /Type /XObject /Subtype /Image /Width '+width+' /Height '+height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+bytes.length+' >>\nstream\n');add(bytes);add('\nendstream\nendobj\n');
 const cmd='q 595.28 0 0 841.89 0 0 cm /Photo Do Q\n';object(n+2,'<< /Length '+enc.encode(cmd).length+' >>\nstream\n'+cmd+'endstream');});
 const start=length;add('xref\n0 '+offsets.length+'\n0000000000 65535 f \n');for(let i=1;i<offsets.length;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');add('trailer\n<< /Size '+offsets.length+' /Root 1 0 R >>\nstartxref\n'+start+'\n%%EOF');return new Blob(chunks,{type:'application/pdf'});
}
async function createReportPDF(){
 const r=buildReport(),W=1240,H=1754,M=64,limit=H-118,pages=[];let canvas,ctx,y;
 const newPage=()=>{canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,W,H);y=M;};
 const finish=()=>{ctx.fillStyle='#617066';ctx.font='17px Arial';ctx.fillText('Matthias Berger · Golf Professional | www.matthiasberger.pro',M,H-67);ctx.fillText('Seite '+(pages.length+1),W-M-70,H-67);pages.push(Uint8Array.from(atob(canvas.toDataURL('image/jpeg',0.95).split(',')[1]),c=>c.charCodeAt(0)));};
 const reserve=space=>{if(y+space>limit){finish();newPage();}};
 const lines=(value,size,bold=false,width=W-2*M)=>{ctx.font=(bold?'600 ':'')+size+'px Arial';const out=[];for(const paragraph of String(value).split('\n')){let line='';for(const word of paragraph.split(/\s+/)){if(ctx.measureText(line+word).width>width&&line){out.push(line.trim());line='';}if(ctx.measureText(word).width>width){for(const c of word){if(ctx.measureText(line+c).width>width){out.push(line.trim());line='';}line+=c;}line+=' ';}else line+=word+' ';}out.push(line.trim());}return out;};
 const text=(value,size=19,bold=false,color='#1e2923',x=M,width=W-2*M)=>{const rows=lines(value,size,bold,width);for(const row of rows){reserve(size*1.3);ctx.font=(bold?'600 ':'')+size+'px Arial';ctx.fillStyle=color;ctx.fillText(row,x,y);y+=size*1.3;}};
 const heading=value=>{reserve(65);y+=12;text(value,24,true);y+=4;};
 const photoAt=(key,x,top,width,height)=>{const p=PICTURES[key],img=loaded[key];ctx.save();if(p.crop&&r.side==='Links'){ctx.translate(x+width,top);ctx.scale(-1,1);x=0;top=0;}if(p.crop)ctx.drawImage(img,p.crop.x,p.crop.y,p.crop.width,p.crop.height,x,top,width,height);else ctx.drawImage(img,x,top,width,height);ctx.restore();};
 const keys=[r.gripPicture||r.bodyPicture,r.back?'track':null,r.down?.plane].filter(Boolean),loaded={};
 await Promise.all([...new Set(keys)].map(key=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{loaded[key]=img;resolve()};img.onerror=()=>reject(new Error('Beispielbild nicht geladen'));img.src=PICTURES[key].src;})));
 newPage();text('MATTHIAS BERGER · GOLF PROFESSIONAL',18,true,'#607266');y+=12;text('Dein Körper. Dein Schwung.',35,true);y+=5;text(r.name+' · '+r.date.split('-').reverse().join('.')+' · '+r.side,21);y+=10;
 text(r.finding,19);text(r.priority,20,true,'#284b38');y+=5;text(r.measurements,16,false,'#617066');
 const hasScores=['compare','favorable'].includes(r.model.status);
 const trainingHeight=65+lines(r.planTitle,18,true).length*24+r.steps.reduce((sum,step)=>sum+lines(step,18).length*24+4,0)+lines(r.criterion,18).length*24+(hasScores?120:0);
 reserve(trainingHeight);heading('Deine Aufgabe bis zum nächsten Training');text(r.planTitle,18,true);
 r.steps.forEach((step,i)=>{text((i+1)+'. '+step,18);y+=4;});y+=4;text('Entscheidung: '+r.criterion,18);
 if(hasScores){y+=7;text('Saubere Treffer — jeweils fünf Bälle',16,true);const x=[M,M+200,M+410,M+620,W-M],labels=['Einheit / Datum','Gewohnt','Vergleich','Gefühl: besser / gleich / schlechter'];ctx.font='15px Arial';ctx.fillStyle='#edf3ed';ctx.fillRect(M,y-12,W-2*M,29);ctx.fillStyle='#1e2923';labels.forEach((label,i)=>ctx.fillText(label,x[i]+8,y+6));y+=29;for(let i=1;i<=2;i++){ctx.fillStyle='#1e2923';ctx.font='17px Arial';[i+' · __________','___ / 5','___ / 5','______________________'].forEach((value,j)=>ctx.fillText(value,x[j]+8,y+7));ctx.strokeStyle='#d9e2d8';ctx.lineWidth=1;ctx.strokeRect(M,y-12,W-2*M,30);y+=30;}y+=10;}
 reserve(275);heading('1 · Dein Bewegungsansatz und Griff');
 const bodyKey=r.gripPicture||r.bodyPicture,bodyTop=y,bodyWidth=bodyKey?W-2*M-210:W-2*M;
 text(r.power?.name||'Noch offen',20,true,'#1e2923',M,bodyWidth);
 text(r.power?.text||'Die Testergebnisse sind noch offen.',18,false,'#1e2923',M,bodyWidth);
 if(!r.model.restricted){text(r.model.grip,18,false,'#1e2923',M,bodyWidth);text(r.model.bodydetail,17,false,'#1e2923',M,bodyWidth);}
 if(bodyKey){const p=PICTURES[bodyKey],iw=p.crop?145:190,ih=iw*p.height/p.width,ix=W-M-iw;photoAt(bodyKey,ix,bodyTop-15,iw,ih);const saveY=y;y=bodyTop+ih+7;text((p.pdfCaption||p.caption)+(p.crop&&r.side==='Links'?' Spiegelbild.':''),13,false,'#617066',ix,iw);y=Math.max(y,saveY)+8;}
 const gap=24,cw=(W-2*M-gap)/2,cardH=370;reserve(cardH+25);y+=15;
 const panels=[{title:'2 · Rückschwungführung',data:r.back?{...r.back,text:r.model.backExplanation}:null,image:r.back?'track':null},{title:'3 · Abschwungzone',data:r.down,image:r.down?.plane}];
 panels.forEach((panel,i)=>{const x=M+i*(cw+gap);ctx.fillStyle='#f3f5f2';ctx.fillRect(x,y,cw,cardH);let cy=y+27;
 const block=(value,size=17,bold=false)=>{for(const row of lines(value,size,bold,cw-28)){ctx.font=(bold?'600 ':'')+size+'px Arial';ctx.fillStyle='#1e2923';ctx.fillText(row,x+14,cy);cy+=size*1.3;}cy+=6;};
 block(panel.title,21,true);block(panel.data?.name||'Noch offen',19,true);block(panel.data?.text||'Die benötigten Testergebnisse fehlen.',17);
 if(panel.image){const p=PICTURES[panel.image],scale=Math.min((cw-28)/p.width,125/p.height),iw=p.width*scale,ih=p.height*scale,ix=x+(cw-iw)/2,iy=Math.max(y+185,cy+5);photoAt(panel.image,ix,iy,iw,ih);if(panel.image==='track'&&panel.data.plane){ctx.strokeStyle='#284b38';ctx.lineWidth=3;ctx.strokeRect(ix+iw*({low:0,mid:1,high:2}[panel.data.plane])/3,iy,iw/3,ih);}cy=iy+ih+17;block(p.pdfCaption||p.caption,13);}
 });y+=cardH+10;heading('Was wir beim nächsten Termin überprüfen');text(r.next,18);finish();
 return jpegPagesPDF(pages,W,H);
}

async function downloadReport(button){
 if(['height','span','upper','fore'].some(id=>!el(id).value||!el(id).checkValidity())){alert('Bitte die vier Körpermaße innerhalb der angegebenen Messbereiche erfassen.');return;}
 const old=button.textContent;button.disabled=true;button.textContent='PDF wird erstellt …';
 try{render();document.activeElement?.blur();const blob=await createReportPDF(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Schwungprofil_'+(val('name')||'Teilnehmer').replace(/[^a-zA-Z0-9äöüÄÖÜß_-]+/g,'_')+'_'+val('date')+'.pdf';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),120000);}
 catch(error){alert('PDF konnte nicht erstellt werden: '+error.message+'. Alternativ „Drucken“ verwenden.');}
 finally{button.disabled=false;button.textContent=old;}
}
