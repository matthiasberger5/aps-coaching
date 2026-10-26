// Premium-PDF: echter Text (scharf, durchsuchbar, kopierbar), Vektorgrafiken, mehrere A4-Seiten.
// Erzeugt mit pdf-lib (lib/pdf-lib.min.js). Läuft komplett im Browser, keine Daten verlassen das Gerät.
(function(root){
const hex=h=>{const n=parseInt(h.slice(1),16);return PDFLib.rgb(((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255);};
const C={green:'#1f4a37',green2:'#2f6a4f',mint:'#e7f0e9',mint2:'#cfe3d5',gold:'#b8913a',goldbg:'#f7efd9',ink:'#17261f',muted:'#5d6e64',faint:'#8a978f',line:'#dfe4da',paper:'#f7f8f4',white:'#ffffff',lightgreen:'#a9d4b9'};
const A4={w:595.28,h:841.89},M=46,TOP=H=>H-70,BOTTOM=62;

// Nur Zeichen, die die Standardschrift (WinAnsi) darstellen kann.
const MAP={'→':'>','←':'<','−':'-','≈':'ca. ','≥':'>=','≤':'<=','✓':'','×':'x',' ':' ',' ':' ',' ':' '};
const clean=t=>String(t==null?'':t).replace(/[→←−≈≥≤✓×   ]/g,c=>MAP[c]).replace(/[^ -~¡-ÿ–—‘’‚“”„•…€\n]/g,'');

async function createReportPDF(r,opts={}){
 const {PDFDocument,StandardFonts}=PDFLib;
 const doc=await PDFDocument.create();
 const title='Schwung-DNA · '+(r.name||'Bericht');
 doc.setTitle(clean(title));doc.setAuthor('Matthias Berger · Golf Professional');doc.setSubject('Persönlicher Schwung-DNA-Bericht');doc.setCreator('Schwung-DNA App');doc.setProducer('pdf-lib');
 try{doc.setLanguage('de-DE');}catch(e){}
 const F={r:await doc.embedFont(StandardFonts.Helvetica),b:await doc.embedFont(StandardFonts.HelveticaBold),i:await doc.embedFont(StandardFonts.HelveticaOblique)};
 const W=A4.w,H=A4.h,CW=W-2*M;
 let page=null,y=0;const pages=[];
 const img={};
 if(opts.loadImage){
  const keys=new Set([r.gripPicture||r.bodyPicture,r.back?'track':null,r.down?.plane].filter(Boolean));
  for(const k of keys){try{const bytes=await opts.loadImage(k,r);if(bytes)img[k]=await doc.embedPng(bytes);}catch(e){console.warn('Bild nicht geladen',k,e);}}
 }

 // ---------- Grundfunktionen ----------
 const newPage=()=>{page=doc.addPage([W,H]);pages.push(page);y=TOP(H);return page;};
 const need=h=>{if(y-h<BOTTOM)newPage();};
 const width=(t,f,s)=>F[f].widthOfTextAtSize(t,s);
 function wrap(text,f,s,w){
  const out=[];
  for(const para of clean(text).split('\n')){
   let line='';
   for(const word of para.split(/\s+/).filter(Boolean)){
    const test=line?line+' '+word:word;
    if(width(test,f,s)<=w){line=test;continue;}
    if(line){out.push(line);line='';}
    if(width(word,f,s)>w){let chunk='';for(const ch of word){if(width(chunk+ch,f,s)>w){out.push(chunk);chunk='';}chunk+=ch;}line=chunk;}else line=word;
   }
   out.push(line);
  }
  return out;
 }
 const textH=(text,{f='r',s=10.5,w=CW,lh=1.45}={})=>wrap(text,f,s,w).length*s*lh;
 // Text mit Seitenumbruch zeilenweise
 function para(text,{f='r',s=10.5,color=C.ink,x=M,w=CW,lh=1.45,gap=6,align='left'}={}){
  const lines=wrap(text,f,s,w);
  for(const ln of lines){
   need(s*lh);
   const tx=align==='center'?x+(w-width(ln,f,s))/2:align==='right'?x+w-width(ln,f,s):x;
   page.drawText(ln,{x:tx,y:y-s*0.92,size:s,font:F[f],color:hex(color)});
   y-=s*lh;
  }
  y-=gap;
 }
 // Text an fester Stelle (ohne Cursor), gibt Höhe zurück
 function textAt(text,x,top,{f='r',s=10.5,color=C.ink,w=CW,lh=1.45,align='left'}={}){
  const lines=wrap(text,f,s,w);
  lines.forEach((ln,i)=>{const tx=align==='center'?x+(w-width(ln,f,s))/2:align==='right'?x+w-width(ln,f,s):x;page.drawText(ln,{x:tx,y:top-i*s*lh-s*0.92,size:s,font:F[f],color:hex(color)});});
  return lines.length*s*lh;
 }
 function spaced(text,x,baseline,{f='b',s=8,color=C.muted,sp=1.4}={}){
  let cx=x;for(const ch of clean(text)){page.drawText(ch,{x:cx,y:baseline,size:s,font:F[f],color:hex(color)});cx+=width(ch,f,s)+sp;}
  return cx-x;
 }
 const spacedW=(text,f,s,sp)=>[...clean(text)].reduce((a,ch)=>a+width(ch,f,s)+sp,0);
 function rrect(x,top,w,h,rad,o={}){
  const r=Math.min(rad,w/2,h/2);
  const d=`M ${r},0 L ${w-r},0 Q ${w},0 ${w},${r} L ${w},${h-r} Q ${w},${h} ${w-r},${h} L ${r},${h} Q 0,${h} 0,${h-r} L 0,${r} Q 0,0 ${r},0 Z`;
  const opt={x,y:top};if(o.fill)opt.color=hex(o.fill);if(o.stroke){opt.borderColor=hex(o.stroke);opt.borderWidth=o.sw||0.8;}if(o.dash)opt.borderDashArray=o.dash;if(o.opacity!=null)opt.opacity=o.opacity;
  page.drawSvgPath(d,opt);
 }
 const line=(x1,y1,x2,y2,color=C.line,t=0.8)=>page.drawLine({start:{x:x1,y:y1},end:{x:x2,y:y2},thickness:t,color:hex(color)});
 const circle=(cx,cy,rad,o={})=>page.drawCircle({x:cx,y:cy,size:rad,...(o.fill?{color:hex(o.fill)}:{}),...(o.stroke?{borderColor:hex(o.stroke),borderWidth:o.sw||1}:{}),...(o.opacity!=null?{opacity:o.opacity,borderOpacity:o.opacity}:{})});

 // Abschnittsüberschrift mit Nummer
 function section(num,titleText,sub){
  need(sub?70:50);
  y-=8;
  if(num){rrect(M,y,26,18,6,{fill:C.green2});const nw=width(String(num),'b',10);page.drawText(String(num),{x:M+(26-nw)/2,y:y-13,size:10,font:F.b,color:hex(C.white)});}
  page.drawText(clean(titleText),{x:M+(num?36:0),y:y-14,size:17,font:F.b,color:hex(C.ink)});
  y-=26;
  if(sub){para(sub,{s:10,color:C.muted,gap:4});}
  line(M,y,W-M,y,C.line,0.8);y-=12;
 }
 function callout(text,{fill=C.mint,bar=C.green2,f='r',s=10.5,label=null,color=C.ink}={}){
  const pad=12,w=CW-pad*2-6;
  const lh=label?14:0,h=textH(text,{f,s,w})+pad*2+lh;
  need(h+8);
  rrect(M,y,CW,h,10,{fill});
  rrect(M+1,y-9,3.5,h-18,1.75,{fill:bar});
  let ty=y-pad;
  if(label){spaced(label,M+pad+6,ty-8,{s:7.5,color:C.green2});ty-=lh;}
  textAt(text,M+pad+6,ty,{f,s,w,color});
  y-=h+10;
 }
 function bullets(items,{s=10.5,gap=3,x=M,w=CW}={}){
  items.filter(Boolean).forEach(t=>{
   const lines=wrap(t,'r',s,w-16);need(lines.length*s*1.4+gap);
   page.drawText('•',{x:x+2,y:y-s*0.92,size:s,font:F.b,color:hex(C.green2)});
   lines.forEach(ln=>{page.drawText(ln,{x:x+14,y:y-s*0.92,size:s,font:F.r,color:hex(C.ink)});y-=s*1.4;});
   y-=gap;
  });
 }
 function image(key,x,top,boxW,boxH,{highlight=null,mirror=false}={}){ // zentriert, Seitenverhältnis bleibt
  const im=img[key];if(!im)return 0;
  const sc=Math.min(boxW/im.width,boxH/im.height),w=im.width*sc,h=im.height*sc,ix=x+(boxW-w)/2;
  rrect(x,top,boxW,h+16,10,{fill:C.white,stroke:C.line});
  page.drawImage(im,{x:ix,y:top-8-h,width:w,height:h});
  if(highlight!==null){page.drawRectangle({x:ix+w*highlight/3,y:top-8-h,width:w/3,height:h,borderColor:hex(C.green),borderWidth:2.2});}
  return h+16;
 }
 function imageH(key,boxW,boxH){const im=img[key];if(!im)return 0;const sc=Math.min(boxW/im.width,boxH/im.height);return im.height*sc+16;}

 // Tabelle mit Zeilenumbruch
 function table(cols,head,rows,{s:fs=9.5}={}){
  const pad=8,ws=cols.map(c=>c-pad*2);
  let hh=22;need(hh+40);
  rrect(M,y,CW,hh,6,{fill:C.mint});
  let cx=M;head.forEach((t,i)=>{spaced(t.toUpperCase(),cx+pad,y-14,{s:6.3,color:C.green2,sp:0.5});cx+=cols[i];});y-=hh;
  rows.forEach((row,ri)=>{
   const ls=row.map((t,i)=>wrap(t,i===0?'b':'r',fs,ws[i])),rh=Math.max(...ls.map(l=>l.length))*fs*1.35+14;
   need(rh);
   if(ri%2===1)page.drawRectangle({x:M,y:y-rh,width:CW,height:rh,color:hex(C.paper)});
   let x=M;ls.forEach((l,i)=>{l.forEach((ln,j)=>page.drawText(ln,{x:x+pad,y:y-7-fs*0.92-j*fs*1.35,size:fs,font:F[i===0||i===2?'b':'r'],color:hex(i===2?C.green:C.ink)}));x+=cols[i];});
   line(M,y-rh,W-M,y-rh,C.line,0.6);y-=rh;
  });
  y-=10;
 }
 // Dreier-Auswahlgrafik (Bewegungstyp / Ebenen)
 function triple(items,activeKey,x,top,w,h=44){
  const gap=7,bw=(w-gap*2)/3;
  items.forEach(([k,name,sub],i)=>{
   const bx=x+i*(bw+gap),on=k===activeKey;
   rrect(bx,top,bw,h,9,on?{fill:C.green}:{fill:C.white,stroke:C.line,sw:1});
   const nw=width(name,'b',10.5);page.drawText(clean(name),{x:bx+(bw-nw)/2,y:top-17,size:10.5,font:F.b,color:hex(on?C.white:C.ink)});
   const sl=wrap(sub,'r',7.5,bw-8);sl.slice(0,2).forEach((ln,j)=>page.drawText(ln,{x:bx+(bw-width(ln,'r',7.5))/2,y:top-29-j*9,size:7.5,font:F.r,color:hex(on?C.mint2:C.muted)}));
  });
  return h;
 }
 const POWER=[['glide','Glide','seitlich'],['spin','Spin','drehend'],['launch','Launch','vertikal']];
 const TOPS=[['low','Tief','unter der Schulterlinie'],['mid','Mittel','auf der Schulterlinie'],['high','Hoch','über der Schulterlinie']];
 const DOWNS=[['shaft','Hüftnah','Steißbein bis Nabel'],['elbow','Rumpfnah','Nabel bis Brustbein'],['shoulder','Schulternah','Brustbein bis Schädelansatz']];

 // Horizontaler Vergleichsbalken zweier Maße
 function compareBars(aLabel,a,bLabel,b,x,top,w){
  if(!(a>0)||!(b>0)){textAt('Messwerte fehlen',x,top,{s:9,color:C.faint,w});return 20;}
  const lo=Math.min(a,b)*0.88,hi=Math.max(a,b)*1.02,bw=w-60,sc=v=>12+(v-lo)/(hi-lo)*(bw-12);
  const bar=(label,v,ty,col)=>{textAt(label,x,ty,{s:8.5,color:C.muted,w});rrect(x,ty-14,bw,11,5.5,{fill:'#edf1ea'});rrect(x,ty-14,sc(v),11,5.5,{fill:col});page.drawText(fmtN(v)+' cm',{x:x+bw+8,y:ty-24,size:9,font:F.b,color:hex(C.ink)});};
  bar(aLabel,a,top,'#b7c7ba');bar(bLabel,b,top-34,C.green2);
  const d=b-a;textAt('Differenz '+(d>0?'+':d<0?'-':'±')+fmtN(Math.abs(d))+' cm',x,top-68,{s:8,color:C.muted,w});
  return 80;
 }
 const fmtN=v=>Number(v).toLocaleString('de-DE',{maximumFractionDigits:1});
 const fmtD=iso=>iso?iso.split('-').reverse().join('.'):'';

 // ================= SEITE 1: Deckblatt =================
 newPage();
 const bandH=262;
 page.drawRectangle({x:0,y:H-bandH,width:W,height:bandH,color:hex(C.green)});
 page.drawRectangle({x:0,y:H-bandH,width:W,height:5,color:hex(C.gold)});
 [[W-100,H-135,34],[W-100,H-135,62],[W-100,H-135,92]].forEach(([cx,cy,rad],i)=>circle(cx,cy,rad,{stroke:'#ffffff',sw:1,opacity:0.14-i*0.03}));
 spaced('MATTHIAS BERGER  ·  GOLF PROFESSIONAL',M,H-54,{s:8.5,color:C.lightgreen,sp:1.6});
 page.drawText('Dein',{x:M,y:H-116,size:40,font:F.r,color:hex(C.white)});
 page.drawText('Schwung-DNA-Profil',{x:M,y:H-160,size:40,font:F.b,color:hex(C.white)});
 line(M,H-182,M+48,H-182,C.gold,2.5);
 let ns=19,nl=wrap(r.name,'b',ns,CW-120);if(nl.length>1){ns=15;nl=wrap(r.name,'b',ns,CW-120).slice(0,2);}
 nl.forEach((ln,i)=>page.drawText(ln,{x:M,y:H-212-i*(ns+5),size:ns,font:F.b,color:hex(C.white)}));
 page.drawText(clean(fmtD(r.date)+'   ·   Spielseite '+r.side+'   ·   20-Minuten-Bio-Swing-Screening'),{x:M,y:H-232-(nl.length-1)*(ns+5),size:10.5,font:F.r,color:hex(C.mint2)});
 y=H-bandH-30;
 // Profil auf einen Blick
 page.drawText('Dein Profil auf einen Blick',{x:M,y:y-14,size:15,font:F.b,color:hex(C.ink)});y-=30;
 const slots=[['fold','Hintere Hand'],['post','Drehachse'],['hip','Hüfte'],['top','Oberer Punkt'],['down','Abschwung']];
 const tw=(CW-4*8)/5;
 slots.forEach(([k,label],i)=>{
  const d=r.model.restricted?null:r.dna.find(x=>x.key===k),bx=M+i*(tw+8);
  if(d){rrect(bx,y,tw,62,10,{fill:C.mint});page.drawRectangle({x:bx,y:y-62,width:tw,height:3,color:hex(C.green2)});}
  else rrect(bx,y,tw,62,10,{fill:C.paper,stroke:'#c9d1c8',dash:[3,3],sw:0.9});
  spaced(label.toUpperCase(),bx+10,y-20,{s:6.3,color:d?C.green2:C.faint,sp:0.7});
  const val=d?d.value:(r.model.restricted?'pausiert':'offen'),fs=width(val,'b',12.5)>tw-16?10.5:12.5;
  page.drawText(clean(val),{x:bx+10,y:y-42,size:fs,font:F.b,color:hex(d?C.ink:C.faint)});
 });
 y-=62+22;
 // Zusammenfassung
 callout(r.finding,{label:'DAS NEHMEN WIR AUS DEINEM SCREENING MIT',s:11});
 para(r.priority,{f:'b',s:12.5,color:C.green,gap:r.profileLine?4:12});
 if(r.profileLine)para(r.profileLine,{s:10,color:C.muted,gap:12});
 // Körpermaße
 if(r.measures&&r.measures.height>0){
  page.drawText('Deine Körpermaße',{x:M,y:y-12,size:12.5,font:F.b,color:hex(C.ink)});y-=26;
  const half=(CW-24)/2;
  const top0=y;
  const h1=compareBars('Körpergröße',r.measures.height,'Spannweite',r.measures.span,M,top0,half);
  compareBars('Oberarm (Schulter-Ellenbogen)',r.measures.upper,'Ellenbogen-Fingerknöchel',r.measures.fore,M+half+24,top0,half);
  y-=h1+4;
 }
 // Orientierung / Inhalt
 need(96);
 rrect(M,y,CW,86,12,{fill:C.paper,stroke:C.line});
 spaced('SO LIEST DU DIESEN BERICHT',M+16,y-22,{s:7.5,color:C.green2});
 textAt(r.model.restricted?'Seite 2: dein Hinweis bis zum nächsten Termin. Bewegungsänderungen stellen wir zurück, bis geklärt ist, welche Bewegungen du beschwerdefrei ausführen kannst.':'Seite 2: deine Aufgabe bis zum nächsten Training. Danach folgen Bewegungsansatz und Griff, Rückschwung und Abschwung, passende Übungen und dein Angebot für die nächsten Termine. Alles sind Ansätze zum Ausprobieren: Wir ändern immer nur einen Punkt und entscheiden am Ball.',M+16,y-32,{s:9.5,color:C.muted,w:CW-32});
 y-=86+10;

 // ================= Aufgabe =================
 newPage();
 const focusMode=['compare','favorable'].includes(r.model.status);
 {
  const w=CW-44,labelTxt=focusMode?(r.model.status==='favorable'?'DEIN VERGLEICHSPUNKT · KURZVERGLEICH GÜNSTIG':'DEIN ERSTER VERGLEICHSPUNKT'):'DEIN HINWEIS';
  const big=focusMode?r.model.focusName:r.priority.replace(/^Dein (Hinweis|Ergebnis): /,''),bs=focusMode?27:17,sub=focusMode?r.focusWhy:r.planTitle;
  const bl=wrap(big,'b',bs,w),h=24+bl.length*bs*1.2+10+(sub?textH(sub,{s:10.5,w}):0)+20;
  need(h+14);rrect(M,y,CW,h,16,{fill:C.green});
  rrect(M,y,CW,6,3,{fill:C.gold});
  spaced(labelTxt,M+22,y-28,{s:7.5,color:C.lightgreen,sp:1.4});
  let ty=y-36;bl.forEach(ln=>{page.drawText(ln,{x:M+22,y:ty-bs*0.95,size:bs,font:F.b,color:hex(C.white)});ty-=bs*1.2;});ty-=8;
  if(sub)textAt(sub,M+22,ty,{s:10.5,w,color:C.mint2});
  y-=h+14;
 }
 {
  const n=r.steps.length,gap=10,cwid=(CW-gap*(n-1))/n,tw2=cwid-26;
  const hs=r.steps.map(st=>16+24+wrap(st.title,'b',11,tw2).length*14+4+wrap(st.text,'r',9.4,tw2).length*9.4*1.42+16);
  const hh=Math.max(...hs);need(hh+14);
  r.steps.forEach((st,i)=>{
   const x=M+i*(cwid+gap);rrect(x,y,cwid,hh,14,{fill:C.white,stroke:C.line,sw:1});
   circle(x+25,y-26,11,{fill:C.green});const nn=String(i+1);page.drawText(nn,{x:x+25-width(nn,'b',10.5)/2,y:y-29.5,size:10.5,font:F.b,color:hex(C.white)});
   let ty=y-50;wrap(st.title,'b',11,tw2).forEach(ln=>{page.drawText(ln,{x:x+13,y:ty-10,size:11,font:F.b,color:hex(C.ink)});ty-=14;});ty-=4;
   textAt(st.text,x+13,ty,{s:9.4,w:tw2,lh:1.42,color:C.ink});
  });
  y-=hh+14;
 }
 if(r.decision){
  const gap=10,cwid=(CW-gap)/2,tw2=cwid-30,hh=Math.max(textH(r.decision.adopt,{s:9.8,w:tw2}),textH(r.decision.keep,{s:9.8,w:tw2}))+46;
  need(hh+14);
  rrect(M,y,cwid,hh,12,{fill:C.mint});rrect(M+cwid+gap,y,cwid,hh,12,{fill:C.paper,stroke:C.line,sw:1});
  spaced('ÜBERNEHMEN, WENN …',M+15,y-22,{s:7.2,color:C.green2});textAt(r.decision.adopt,M+15,y-32,{s:9.8,w:tw2,f:'b'});
  spaced('GEWOHNT WEITERSPIELEN, WENN …',M+cwid+gap+15,y-22,{s:7.2,color:C.muted});textAt(r.decision.keep,M+cwid+gap+15,y-32,{s:9.8,w:tw2,color:C.muted});
  y-=hh+14;
 }else callout(r.criterion,{fill:C.goldbg,bar:C.gold,label:'HINWEIS',f:'b',s:10.5});
 if(r.hasScores){
  y-=2;page.drawText('Saubere Treffer festhalten (jeweils fünf Bälle)',{x:M,y:y-11,size:11.5,font:F.b,color:hex(C.ink)});y-=24;
  const cols=[130,95,95,CW-320],hdr=['Einheit / Datum','Gewohnt','Vergleich','Gefühl: besser / gleich / schlechter'];
  need(30+3*30);
  let cx=M;rrect(M,y,CW,24,6,{fill:C.mint});
  hdr.forEach((hh,i)=>{spaced(hh.toUpperCase(),cx+8,y-15,{s:6.3,color:C.green2,sp:0.5});cx+=cols[i];});y-=24;
  const given=(r.scores.habit!==null||r.scores.compare!==null);
  const rows=[[given?'Im Termin  '+fmtD(r.date):'1  ·  ____________',given?(r.scores.habit??'_')+' / 5':'___ / 5',given?(r.scores.compare??'_')+' / 5':'___ / 5',given?({better:'besser',same:'gleich',worse:'schlechter'}[r.scores.feel]||''):'______________'],['2  ·  ____________','___ / 5','___ / 5','______________']];
  rows.forEach((row,ri)=>{cx=M;row.forEach((cell,i)=>{page.drawText(clean(cell),{x:cx+8,y:y-19,size:10.5,font:ri===0&&given?F.b:F.r,color:hex(C.ink)});cx+=cols[i];});line(M,y-30,W-M,y-30,C.line);y-=30;});
  y-=12;
 }
 // Alle Befunde nach Klarheit
 if(!r.model.restricted&&r.ranking){
  need(40+r.ranking.length*40+30);page.drawText('Alle Befunde nach Klarheit geordnet',{x:M,y:y-11,size:11.5,font:F.b,color:hex(C.ink)});y-=22;
  const nameW=118,dotsW=64,findW=CW-34-nameW-dotsW-10;
  r.ranking.forEach((row,i)=>{
   const fl=wrap(row.finding,'r',9.2,findW),hh=Math.max(34,fl.length*9.2*1.4+16),isFocus=row.key===r.model.chosenFocus&&row.available;
   need(hh+2);
   rrect(M,y,CW,hh,8,isFocus?{fill:C.mint}:{fill:C.white,stroke:C.line,sw:0.8});
   circle(M+18,y-hh/2,9,{fill:isFocus?C.green:'#dfe5dc'});const nn=String(i+1);page.drawText(nn,{x:M+18-width(nn,'b',9.5)/2,y:y-hh/2-3.3,size:9.5,font:F.b,color:hex(isFocus?C.white:C.muted)});
   page.drawText(clean(row.name),{x:M+36,y:y-hh/2-3.5,size:10,font:F.b,color:hex(isFocus?C.green:C.ink)});
   fl.forEach((ln,j)=>page.drawText(ln,{x:M+36+nameW,y:y-(hh-fl.length*9.2*1.4)/2-9.2*0.95-j*9.2*1.4,size:9.2,font:F.r,color:hex(row.available?C.ink:C.faint)}));
   for(let d=0;d<3;d++)circle(W-M-14-(2-d)*14-0,y-hh/2,4.6,row.score>d?{fill:isFocus?C.green:C.green2}:{stroke:'#aab6ac',sw:1});
   y-=hh+4;
  });
  y-=4;
  if(r.model.tieNote)para(r.model.tieNote,{s:9.4,gap:4});
  para(RANKING_NOTE+' (Drei Punkte: sehr deutlich, zwei: deutlich, einer: leicht.)',{s:8.2,color:C.muted,gap:12});
 }
 y-=4;
 if(r.video){
  y-=8;section('','Abgleich mit deinem Schwung-Video');
  table([128,200,CW-328],['Punkt','Test sagt','Video zeigt'],r.video.items.map(o=>[o.label,o.expected||'offen',o.result]));
  para(r.video.summary,{s:10.5,gap:6});
  if(r.video.note)para('Notiz: '+r.video.note,{s:9.5,color:C.muted});
 }
 section('', 'Was wir beim nächsten Termin überprüfen');
 para(r.next,{s:11});
 if(r.note){callout(r.note,{label:'PERSÖNLICHE NOTIZ VON MATTHIAS',f:'i'});}

 // ================= 1 · Bewegungsansatz & Griff =================
 if(!r.model.restricted){
  newPage();
  section(1,'Dein Bewegungsansatz und Griff','Bewegungstyp aus allen fünf Tests, Griff aus Arm-Pendeltest und Hip-Speed-Test.');
  const bodyKey=r.gripPicture||r.bodyPicture,imgW=150,gap=20,tw2=bodyKey&&img[bodyKey]?CW-imgW-gap:CW;
  const top1=y;
  let ty=y;
  const put=(t,o)=>{const h=textH(t,{...o,w:tw2});textAt(t,M,ty,{...o,w:tw2});ty-=h+(o.gap??6);};
  spaced((r.power?.name||'OFFEN').toUpperCase(),M,ty-8,{s:7.5,color:C.green2});ty-=16;
  put(r.power?.text||(r.model.conflict?'Hand- und Dynamiktest passen noch nicht zusammen.':'Ohne eindeutige Testergebnisse wählen wir keinen Bewegungstyp.'),{s:11,f:'b'});
  put(r.model.grip,{s:10.5});
  put(r.model.bodydetail,{s:10.5,color:C.muted});
  let ih=0;
  if(bodyKey&&img[bodyKey]){ih=image(bodyKey,M+tw2+gap,top1,imgW,200);const cap=PICTURES[bodyKey].caption+(PICTURES[bodyKey].crop&&r.side==='Links'?' Spiegelbild für Linksspieler.':'');ih+=textAt(cap,M+tw2+gap,top1-ih-5,{s:7.3,color:C.muted,w:imgW,lh:1.35})+6;}
  y=Math.min(ty,top1-ih)-8;
  need(70);
  spaced('DEIN BEWEGUNGSTYP IM MODELL',M,y-8,{s:7.5,color:C.green2});y-=18;
  y-=triple(POWER,r.power?.key,M,y,CW,46)+14;
  para('Glide: Becken bewegt sich zum Ziel, Oberkörper bleibt zurück · Spin: drehende Körperbewegung · Launch: Druck in den Boden und Aufrichten. Zuordnung nach der Mehrheit aus Armtest, Post-Test, Hip-Speed-Test, Spannweite und Armmaßen; keine Messung von Bodenkräften.',{s:8.3,color:C.muted,gap:14});
  section('','Deine Testergebnisse im Überblick');
  table([128,200,CW-328],['Test','Beobachtung','Ergebnis im Modell'],testOverview(r).map(o=>[o.test,o.seen,o.result]));
 }

 // ================= 2 + 3 · Rückschwung / Abschwung =================
 if(!r.model.restricted){
  newPage();
  section('2 · 3','Rückschwung und Abschwung','Weg der Arme und Höhe am obersten Punkt, getrennt von der Abschwungzone.');
  const gap=22,cw=(CW-gap)/2,top0=y;
  const col=(x,head,tag,body,sub,imgKey,hl,caption)=>{
   let ty=top0;
   page.drawText(clean(head),{x,y:ty-13,size:13.5,font:F.b,color:hex(C.ink)});ty-=26;
   spaced(clean(tag).toUpperCase(),x,ty-8,{s:7.3,color:C.green2});ty-=17;
   ty-=textAt(body,x,ty,{s:10,w:cw})+6;
   if(sub)ty-=textAt(sub,x,ty,{s:10,w:cw,color:C.muted})+6;
   if(imgKey&&img[imgKey]){const h=image(imgKey,x,ty,cw,120,{highlight:hl});ty-=h+4;ty-=textAt(caption,x,ty,{s:7.5,color:C.muted,w:cw,lh:1.35})+8;}
   return ty;
  };
  const ypos=[];
  ypos.push(col(M,'Rückschwungführung',r.model.armback?.name||'Noch offen',r.model.backExplanation||'',r.back?r.back.name+'. '+r.back.text:'Die benötigten Körpermaße fehlen.','track',({low:0,mid:1,high:2})[r.back?.plane]??null,PICTURES.track.caption));
  ypos.push(col(M+cw+gap,'Abschwungzone',r.down?.name||'Noch offen',r.down?.text||'Die benötigten Armmaße fehlen.','',r.down?.plane,null,r.down?.plane?PICTURES[r.down.plane].caption:''));
  y=Math.min(...ypos)-8;
  need(150);
  spaced('OBERSTER PUNKT',M,y-8,{s:7.3,color:C.green2});spaced('ABSCHWUNGZONE',M+cw+gap,y-8,{s:7.3,color:C.green2});y-=18;
  const g=triple(TOPS,r.back?.plane,M,y,cw,46);triple(DOWNS,r.down?.plane,M+cw+gap,y,cw,46);y-=g+14;
  callout('Weg und Endposition sind zwei verschiedene Punkte: Der Armtest beschreibt, wie die Arme nach oben geführt werden. Die Spannweite sagt, wie hoch der vordere Arm am obersten Punkt stehen darf. Die Abschwungzone ergibt sich getrennt aus deinen Armmaßen.',{label:'WICHTIG ZUM VERSTÄNDNIS',s:9.5});
 }

 // ================= Übungen =================
 if(r.model.status!=='paused'){
  newPage();
  section('', 'Deine Übungen','Immer langsam und ohne Druck. Bei Schmerzen sofort beenden.');
  const drillCard=(d,compact)=>{
   const w=CW-28,steps=d.steps.map(s=>wrap(s,'r',9.8,w-18));
   const h=24+textH(d.goal,{f:'i',s:9.8,w})+steps.reduce((a,l)=>a+l.length*9.8*1.38+3,0)+(d.watch?textH(d.watch,{s:9,w:w-16})+16:0)+(d.reps?16:0)+22;
   need(h+10);
   rrect(M,y,CW,h,12,{fill:C.white,stroke:C.line,sw:1});
   rrect(M+1,y-10,3.5,h-20,1.75,{fill:compact?C.faint:C.green2});
   const top=y;let ty=y-14;
   page.drawText(clean(d.title),{x:M+16,y:ty-9,size:12,font:F.b,color:hex(C.ink)});
   const mm=d.minutes+' Min.';rrect(W-M-14-width(mm,'b',8.5)-14,ty+1,width(mm,'b',8.5)+14,15,7.5,{fill:C.mint});page.drawText(mm,{x:W-M-14-width(mm,'b',8.5)-7,y:ty-9,size:8.5,font:F.b,color:hex(C.green)});
   ty-=22;
   ty-=textAt(d.goal,M+16,ty,{f:'i',s:9.8,color:C.muted,w})+4;
   steps.forEach((ls,i)=>{page.drawText(String(i+1)+'.',{x:M+16,y:ty-9.8*0.92,size:9.8,font:F.b,color:hex(C.green2)});ls.forEach((ln,j)=>{page.drawText(ln,{x:M+32,y:ty-9.8*0.92-j*9.8*1.38,size:9.8,font:F.r,color:hex(C.ink)});});ty-=ls.length*9.8*1.38+3;});
   if(d.watch){const wh=textH(d.watch,{s:9,w:w-16})+10;rrect(M+16,ty-2,w,wh,7,{fill:C.goldbg});textAt('Achte darauf: '+d.watch,M+24,ty-7,{s:9,w:w-16,color:'#5c4510'});ty-=wh+6;}
   if(d.reps){page.drawText(clean('Umfang: '+d.reps),{x:M+16,y:ty-9,size:8.5,font:F.b,color:hex(C.muted)});}
   y=top-h-10;
  };
  const label=t=>{need(40);y-=4;spaced(t.toUpperCase(),M,y-8,{s:7.5,color:C.green2});y-=20;};
  if(r.drills.main){label('Deine Hauptübung · '+r.model.focusName);drillCard(r.drills.main,false);}
  label('Vor jeder Einheit');(r.drills.basis||[]).forEach(d=>drillCard(d,true));
  if((r.drills.optional||[]).length){label('Optional, wenn du mehr Zeit hast');r.drills.optional.forEach(d=>drillCard(d,true));}
 }

 // ================= Angebot =================
 {
  const o=r.offer;y-=8;need(320);
  const top=y,hh=302;
  rrect(M,top,CW,hh,18,{fill:C.green});rrect(M,top,CW,6,3,{fill:C.gold});
  spaced('DEIN NÄCHSTER SCHRITT',M+24,top-32,{s:7.5,color:C.lightgreen,sp:1.5});
  page.drawText(clean(o.name),{x:M+24,y:top-62,size:24,font:F.b,color:hex(C.white)});
  page.drawText(clean(o.count+' Termine à '+o.minutes+' Minuten'),{x:M+24,y:top-82,size:11.5,font:F.r,color:hex(C.mint2)});
  const pw=width(o.priceText,'b',32);
  spaced(o.priceLabel.toUpperCase(),W-M-24-Math.max(pw,spacedW(o.priceLabel.toUpperCase(),'b',7.5,1.5)),top-32,{s:7.5,color:C.gold,sp:1.5});
  page.drawText(clean(o.priceText),{x:W-M-24-pw,y:top-68,size:32,font:F.b,color:hex(C.white)});
  const gap=10,cwid=(CW-48-gap*2)/3,tw2=cwid-24;
  o.sessions.forEach((se,i)=>{
   const x=M+24+i*(cwid+gap),ty0=top-104,bh=hh-104-56;
   rrect(x,ty0,cwid,bh,12,{fill:C.green2});
   spaced('TERMIN '+se.n,x+12,ty0-20,{s:7,color:C.lightgreen,sp:1.2});
   let ty=ty0-30;wrap(se.title,'b',11.5,tw2).forEach(ln=>{page.drawText(ln,{x:x+12,y:ty-11,size:11.5,font:F.b,color:hex(C.white)});ty-=14;});ty-=4;
   textAt(se.text,x+12,ty,{s:8.6,w:tw2,lh:1.4,color:C.mint2});
  });
  textAt('Interesse? Ruf an oder schreib mir per WhatsApp: '+CONTACT.phone+'  ·  '+CONTACT.web,M+24,top-hh+40,{s:10,color:C.white,w:CW-48,f:'b'});
  y-=hh+16;
 }

 // ================= Notizen + Hinweise =================
 need(250);
 section('', 'Notizen');
 for(let i=0;i<6;i++){need(24);line(M,y-18,W-M,y-18,'#cfd6cc',0.7);y-=24;}
 y-=14;
 need(50);
 page.drawText(clean(CONTACT.name),{x:M,y:y-12,size:12,font:F.b,color:hex(C.green)});
 page.drawText(clean(CONTACT_LINE),{x:M,y:y-27,size:10,font:F.r,color:hex(C.muted)});
 y-=46;
 // Hinweis für Kunden und Bildnachweis
 callout(DISCLAIMER,{fill:C.goldbg,bar:C.gold,label:'WICHTIGER HINWEIS',s:9.2});
 if(Object.keys(img).length)para(CREDITS,{s:7.6,color:C.faint,gap:0});

 // ================= Kopf- und Fußzeilen =================
 const n=pages.length;
 pages.forEach((pg,i)=>{
  page=pg;
  if(i>0){
   spaced('SCHWUNG-DNA',M,H-40,{s:7.5,color:C.green2,sp:1.5});
   let nm=clean(r.name);while(nm.length>8&&width(nm+'  ·  '+fmtD(r.date),'r',8.5)>300)nm=nm.slice(0,-2);const right=clean((nm===clean(r.name)?nm:nm.trim()+'…')+'  ·  '+fmtD(r.date));pg.drawText(right,{x:W-M-width(right,'r',8.5),y:H-40,size:8.5,font:F.r,color:hex(C.muted)});
   line(M,H-48,W-M,H-48,C.line,0.7);
  }
  line(M,44,W-M,44,C.line,0.7);
  pg.drawText(clean(CONTACT.name+' · '+CONTACT.phone+' · '+CONTACT.web),{x:M,y:30,size:7.8,font:F.r,color:hex(C.faint)});
  const pn='Seite '+(i+1)+' / '+n;pg.drawText(pn,{x:W-M-width(pn,'r',7.8),y:30,size:7.8,font:F.r,color:hex(C.faint)});
 });
 return await doc.save();
}

// ---------- Browser: Bilder laden (2x hochskaliert und weich gerechnet), Download, Teilen ----------
function loadImageBrowser(key,r){
 return new Promise((resolve,reject)=>{
  const p=PICTURES[key],im=new Image();
  im.onload=()=>{
   const sw=p.crop?p.crop.width:im.naturalWidth,sh=p.crop?p.crop.height:im.naturalHeight,k=2;
   const c=document.createElement('canvas');c.width=sw*k;c.height=sh*k;const x=c.getContext('2d');
   x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';
   if(p.crop&&r.side==='Links'){x.translate(c.width,0);x.scale(-1,1);}
   if(p.crop)x.drawImage(im,p.crop.x,p.crop.y,p.crop.width,p.crop.height,0,0,c.width,c.height);else x.drawImage(im,0,0,c.width,c.height);
   c.toBlob(b=>b?b.arrayBuffer().then(buf=>resolve(new Uint8Array(buf))):reject(new Error('Bild konnte nicht umgewandelt werden')),'image/png');
  };
  im.onerror=()=>reject(new Error('Beispielbild nicht geladen: '+p.src));
  im.src=p.src;
 });
}
const pdfFileName=r=>'Schwung-DNA_'+(r.name||'Bericht').replace(/[^a-zA-Z0-9äöüÄÖÜß_-]+/g,'_')+'_'+(r.date||'')+'.pdf';
async function makeReportPDF(r){return createReportPDF(r,{loadImage:loadImageBrowser});}

root.createReportPDF=createReportPDF;root.makeReportPDF=makeReportPDF;root.pdfFileName=pdfFileName;
})(typeof window!=='undefined'?window:globalThis);
