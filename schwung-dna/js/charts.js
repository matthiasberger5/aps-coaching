// Kleine SVG-/HTML-Grafiken für das Dashboard. Farben kommen aus CSS-Klassen (siehe styles.css).
const Charts={
 // Zwei Messwerte als Balken mit Differenz
 compare({aLabel,a,bLabel,b,unit='cm',note=''}){
  if(!(a>0)||!(b>0))return '<div class="chart-empty">Messwerte fehlen</div>';
  const lo=Math.min(a,b)*0.88,hi=Math.max(a,b)*1.02,sc=v=>8+(v-lo)/(hi-lo)*300;
  const d=b-a,sign=d>0?'+':d<0?'−':'±';
  return `<svg class="chart" viewBox="0 0 360 108" role="img" aria-label="${esc(aLabel)} ${fmt(a)} ${unit}, ${esc(bLabel)} ${fmt(b)} ${unit}">
   <text x="8" y="14" class="c-label">${esc(aLabel)}</text>
   <rect x="8" y="20" width="${sc(a)}" height="20" rx="10" class="c-bar c-bar-a"/>
   <text x="${sc(a)+14}" y="35" class="c-val">${fmt(a)} ${unit}</text>
   <text x="8" y="62" class="c-label">${esc(bLabel)}</text>
   <rect x="8" y="68" width="${sc(b)}" height="20" rx="10" class="c-bar c-bar-b"/>
   <text x="${sc(b)+14}" y="83" class="c-val">${fmt(b)} ${unit}</text>
   <text x="352" y="104" text-anchor="end" class="c-note">Differenz ${sign}${fmt(Math.abs(d))} ${unit}${note?' · '+esc(note):''}</text>
  </svg>`;
 },
 // Fortschrittsring
 ring(done,total,label=''){
  const r=34,c=2*Math.PI*r,p=total?done/total:0;
  return `<svg class="ring" viewBox="0 0 90 90" role="img" aria-label="${done} von ${total}">
   <circle cx="45" cy="45" r="${r}" class="ring-bg"/>
   <circle cx="45" cy="45" r="${r}" class="ring-fg" stroke-dasharray="${(c*p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 45 45)"/>
   <text x="45" y="50" text-anchor="middle" class="ring-num">${done}/${total}</text>
   ${label?`<text x="45" y="64" text-anchor="middle" class="ring-sub">${esc(label)}</text>`:''}
  </svg>`;
 },
 // Drei Bewegungstypen
 triad(activeKey){
  const items=[['glide','Glide','seitlich'],['spin','Spin','drehend'],['launch','Launch','vertikal']];
  return '<div class="triad">'+items.map(([k,n,s])=>`<div class="triad-item${activeKey===k?' on':''}"><b>${n}</b><span>${s}</span></div>`).join('')+'</div>';
 },
 // Drei Ebenen (oberster Punkt oder Abschwungzone)
 levels(kind,active){
  const sets={
   top:[['low','Tief','unter der Schulterlinie'],['mid','Mittel','auf Schulterlinie'],['high','Hoch','über der Schulterlinie']],
   down:[['shaft','Hüftnah','Steißbein bis Nabel'],['elbow','Rumpfnah','Nabel bis unteres Brustbein'],['shoulder','Schulternah','unteres Brustbein bis Schädelansatz']]
  }[kind];
  return '<div class="levels">'+sets.map(([k,n,s])=>`<div class="level${active===k?' on':''}"><b>${n}</b><span>${s}</span></div>`).join('')+'</div>';
 },
 // Verlauf der Schlagvergleiche über mehrere Checks
 progress(points){
  const pts=points.filter(p=>p.habit!==null||p.compare!==null);
  if(!pts.length)return '<div class="chart-empty">Noch keine Trefferzahlen erfasst. Im Schritt „Am Ball“ eintragen.</div>';
  const W=360,H=170,padL=26,padB=34,padT=14,gw=(W-padL-8)/pts.length,bw=Math.min(22,gw/3);
  const y=v=>padT+(H-padT-padB)*(1-v/5);
  let g='';for(let v=0;v<=5;v++)g+=`<line x1="${padL}" x2="${W-4}" y1="${y(v)}" y2="${y(v)}" class="c-grid"/><text x="${padL-6}" y="${y(v)+4}" text-anchor="end" class="c-axis">${v}</text>`;
  const bars=pts.map((p,i)=>{
   const cx=padL+gw*i+gw/2;let s='';
   if(p.habit!==null)s+=`<rect x="${cx-bw-2}" y="${y(p.habit)}" width="${bw}" height="${H-padB-y(p.habit)}" rx="4" class="c-bar c-bar-a"/><text x="${cx-bw/2-2}" y="${y(p.habit)-4}" text-anchor="middle" class="c-val sm">${p.habit}</text>`;
   if(p.compare!==null)s+=`<rect x="${cx+2}" y="${y(p.compare)}" width="${bw}" height="${H-padB-y(p.compare)}" rx="4" class="c-bar c-bar-b"/><text x="${cx+bw/2+2}" y="${y(p.compare)-4}" text-anchor="middle" class="c-val sm">${p.compare}</text>`;
   s+=`<text x="${cx}" y="${H-padB+15}" text-anchor="middle" class="c-axis">${esc(p.label)}</text>`;
   if(p.focus)s+=`<text x="${cx}" y="${H-padB+28}" text-anchor="middle" class="c-axis sm">${esc(p.focus)}</text>`;
   return s;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Saubere Treffer pro Check, gewohnt gegen Vergleich">${g}${bars}</svg>
  <div class="legend"><span><i class="dot a"></i>gewohnt</span><span><i class="dot b"></i>Vergleich</span><span class="muted">saubere Treffer von 5</span></div>`;
 }
};
