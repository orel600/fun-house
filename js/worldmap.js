/* מפת העולם (WMAP): כפתור 🗺️ בעולם הפתוח פותח חלון עם שתי מפות, להתמצאות. קפיצה רק לאי עם פנס דולק (travel.js), כי מסע מהיר לכל מקום מוריד מהחקירה.
   משמאל (או למעלה בטלפון עומד): כל האזורים כאיים, מחוברים בשבילים (WORLD.paths). אזור שעוד לא ביקרת בו הוא צללית עם ?,
   ומופיעים רק אזורים שביקרת בהם והשכנים שלהם, כדי שיישאר מה לגלות. לכל אזור שביקרת: הפנס (דולק או כבוי, STORY.lanterns ו-SAVE.story)
   ומונה הסודות 🔍 x/y (secrets.js). מימין: האזור הנוכחי, עם הדמות, השערים, המקורות, הפנס והדמויות שגילית (worldnpc.js).
   הסודות עצמם לא מסומנים, כדי שיישארו סודות.
   הכל מנתונים קיימים: אזור חדש ב-WORLD.regions עם דרך אליו מופיע לבד. המיקום של אי נקבע מהכיוון של הדרך אליו.
   נשמר ב-SAVE.wmap ({seen:{meadow:1}}). החיבורים: enterWorld ב-world.js (wmapVisit), WINS ב-ui.js, והכפתור ב-index.html */

const WMAP={
  step:1,            // המרחק בין שני איים מחוברים (ביחידות של המפה, לפני ההתאמה לחלון)
  minGap:0.8,        // אי חדש לא יושב קרוב מזה לאי אחר: מסובבים את הכיוון עד שיש מקום
  island:0.3,        // גודל אי, ביחס למרחק בין איים
  pad:0.62,          // שוליים סביב כל האיים, ביחס למרחק בין איים
  dot:{player:7,node:2.4,gate:7,npc:5,lantern:7},   // גדלים במפה של האזור, בפיקסלים
  fog:'#0E1220',     // הצבע של אזור שעוד לא ביקרו בו
  stretch:2.4,
  turn:1.4,          // אם סיבוב של רבע (שרשרת האיים לרוחב) מגדיל את המפה פי turn לפחות, מסובבים. בטלפון לרוחב החלון נמוך, והשרשרת עולה למעלה       // כמה מותר למתוח את המפה לרוחב (או לגובה) כדי למלא את החלון, כשהאיים בטור צר
  // תוויות (שם האזור ומונה הסודות): מחפשים מקום פנוי מתחת, מעל, בצדדים ובאלכסון, ואם אין, רחוק יותר עם קו קצר. בלי מקום בכלל: גופן קטן יותר
  label:{name:13,count:12,min:10,gap:5,far:1.9,pad:3}
};

const WMS=()=>SAVE.wmap||(SAVE.wmap={seen:{}});
const wmRegion=r=>r==='meadow'?WORLD:WORLD.regions[r];
// ביקרת באזור: נשמר בכניסה. גם מי ששיחק לפני המפה: פנס שנדלק או סוד שנמצא שם אומרים שהוא היה שם
function wmSeen(r){
  if(r==='meadow'||WMS().seen[r])return true;
  for(const k in STORY.lanterns)if(STORY.lanterns[k].reg===r&&storyOpen(k))return true;
  return (SECRETS.regions[r]||[]).some(s=>scFound(s.id));
}
function wmapVisit(r){if(!WMS().seen[r]){WMS().seen[r]=1;saveNow()}}

/* ---- הגרף: אילו אזורים מחוברים, ואיפה כל אי. הכיוון של אי הוא הכיוון של הדרך אליו באזור הקודם ---- */
function wmGraph(){
  const all=['meadow',...Object.keys(WORLD.regions)],edges=[],pos={meadow:{x:0,y:0}},q=['meadow'];
  for(const r of all){const P0=wmRegion(r).paths||{};for(const k in P0)if(k==='meadow'||WORLD.regions[k])edges.push({a:r,b:k,p:P0[k]})}
  while(q.length){const a=q.shift();
    for(const e of edges){if(e.a!==a||pos[e.b])continue;
      const base=Math.atan2(e.p.y,e.p.x);let at=null;
      for(let i=0;i<12&&!at;i++){const ang=base+(i%2?1:-1)*Math.ceil(i/2)*Math.PI/6,c={x:pos[a].x+Math.cos(ang)*WMAP.step,y:pos[a].y+Math.sin(ang)*WMAP.step};
        if(Object.values(pos).every(o=>Math.hypot(o.x-c.x,o.y-c.y)>=WMAP.minGap*WMAP.step))at=c}
      pos[e.b]=at||{x:pos[a].x+Math.cos(base)*WMAP.step,y:pos[a].y+Math.sin(base)*WMAP.step};q.push(e.b)}}
  // מה מוצג: אזורים שביקרת בהם, ושכנים שהדרך אליהם כבר נפתחה (wPathOpen ב-world.js) כצללית
  const seen=all.filter(r=>pos[r]&&wmSeen(r)),show=new Set(seen);
  for(const e of edges)if(pos[e.a]&&pos[e.b]&&(seen.includes(e.a)&&seen.includes(e.b)||seen.includes(e.a)&&wPathOpen(e.p))){show.add(e.a);show.add(e.b)}
  // כל שביל פעם אחת, גם כשיש דרך בשני הכיוונים
  const one=[],key=e=>[e.a,e.b].sort().join('|');
  for(const e of edges)if(show.has(e.a)&&show.has(e.b)&&!one.some(f=>key(f)===key(e)))one.push(e);
  return{pos,edges:one,show:[...show]};
}
// הפנס של אזור: {k, lit} או null
function wmLantern(r){for(const k in STORY.lanterns)if(STORY.lanterns[k].reg===r)return{k,L:STORY.lanterns[k],lit:storyOpen(k)};return null}
const wmSecrets=r=>{const L=SECRETS.regions[r]||[];return L.length?scCount(r)+'/'+L.length:''};

/* ---- ציור ---- */
function wmCanvas(id){
  const c=$(id),dpr=Math.min(2,devicePixelRatio||1),w=c.parentNode.clientWidth||300,h=c.parentNode.clientHeight||200;
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr)}
  const x=c.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,w,h);x.direction=DIR;x.textAlign='center';x.textBaseline='middle';
  return{x,w,h};
}
function wmText(x,s,px,py,size,col){x.font='800 '+size+'px Heebo, system-ui, sans-serif';x.lineWidth=3;x.lineJoin='round';   // round: בלי קוצים שחורים מעל M ו-W
  x.strokeStyle='#000a';x.strokeText(s,px,py);x.fillStyle=col;x.fillText(s,px,py)}
const wmFont=size=>'800 '+size+'px Heebo, system-ui, sans-serif';
/* מסדר תוויות בלי שיעלו זו על זו. items: {x,y,r (רדיוס של מה שמסומן), lines:[[טקסט,גודל,צבע]...]}. avoid: עיגולים {x,y,r} שאסור לכסות.
   לכל תווית מנסים מקומות סביב הנקודה, ובוחרים את הראשון בלי חפיפה (או עם הכי מעט). מחזיר את המלבנים, ומונה כמה חפיפות נשארו */
function wmLabels(x,items,avoid,w,h){
  const L=WMAP.label,out=[],box=(cx,cy,bw,bh)=>({x0:cx-bw/2,y0:cy-bh/2,x1:cx+bw/2,y1:cy+bh/2}),
    ov=(a,b)=>Math.max(0,Math.min(a.x1,b.x1)-Math.max(a.x0,b.x0))*Math.max(0,Math.min(a.y1,b.y1)-Math.max(a.y0,b.y0)),
    ovC=(a,c)=>{const nx=Math.max(a.x0,Math.min(c.x,a.x1)),ny=Math.max(a.y0,Math.min(c.y,a.y1)),d=c.r-Math.hypot(c.x-nx,c.y-ny);return d>0?d*d:0},
    outB=a=>Math.max(0,-a.x0)*(a.y1-a.y0)+Math.max(0,a.x1-w)*(a.y1-a.y0)+Math.max(0,-a.y0)*(a.x1-a.x0)+Math.max(0,a.y1-h)*(a.x1-a.x0);
  let bad=0;
  for(const it of items){
    let best=null;
    // ניסיונות לפי הסדר: גודל מלא, שורה אחת (שם · מונה), שם קצר (short), ואז גופן קטן יותר
    const one=ls=>ls.length>1?[[ls.map(l=>l[0]).join(' · '),ls[0][1],ls[0][2]]]:ls,sh=it.short?[[it.short,it.lines[0][1],it.lines[0][2]]].concat(it.lines.slice(1)):null;
    const tries=[[it.lines,0],[one(it.lines),0]].concat(sh?[[sh,0],[one(sh),0]]:[],[[it.lines,1],[one(it.lines),1]],sh?[[sh,1],[one(sh),1],[one(sh),2],[one(sh),3]]:[[one(it.lines),2],[one(it.lines),3]]);
    for(let ti=0;ti<tries.length;ti++){const [src,shrink]=tries[ti],pen=ti*60;
      const lines=src.map(([t,sz,c])=>[t,Math.max(L.min,sz-shrink),c]);
      let bw=0,bh=0;for(const [t,sz] of lines){x.font=wmFont(sz);bw=Math.max(bw,x.measureText(t).width);bh+=sz+3}
      bw+=L.pad*2;bh+=L.pad;
      const g=L.gap,rx=it.r+g+bw/2,ry=it.r*0.85+g+bh/2,dg=0.72;
      const spots=[[0,ry],[0,-ry],[rx,0],[-rx,0],[it.r*dg+bw/2,it.r*dg+bh/2],[-(it.r*dg+bw/2),it.r*dg+bh/2],[it.r*dg+bw/2,-(it.r*dg+bh/2)],[-(it.r*dg+bw/2),-(it.r*dg+bh/2)]];
      for(const far of [1,L.far])for(const [dx,dy] of spots){
        const cx=Math.max(bw/2+1,Math.min(w-bw/2-1,it.x+dx*far)),cy=Math.max(bh/2+1,Math.min(h-bh/2-1,it.y+dy*far)),b=box(cx,cy,bw,bh);
        let sc=outB(b)*5;for(const o of out)sc+=ov(b,o)*4;for(const c of avoid)sc+=ovC(b,c);
        if(sc>1)sc+=5000;   // כל חפיפה גרועה מכל פשרה (שם קצר, גופן קטן, קו)
        sc+=(far>1?40:0)+pen;   // קרוב ובגודל מלא עדיף
        if(!best||sc<best.sc)best={sc,b,lines,far,cx,cy};
      }
      if(best&&best.sc<=(best.far>1?40:0)+pen)break;   // נמצא מקום פנוי
    }
    const B=best.b;B.it=it;out.push(B);
    let clash=0;for(const o of out)if(o!==B&&ov(B,o)>1)clash++;for(const c of avoid)if(ovC(B,c)>2)clash++;bad+=clash;
    const ex=Math.max(B.x0,Math.min(it.x,B.x1)),ey=Math.max(B.y0,Math.min(it.y,B.y1));
    if(Math.hypot(ex-it.x,ey-it.y)>it.r+L.gap*2.5){   // לא צמוד לנקודה: קו קצר אליה, כדי שיהיה ברור של מי התווית
      const a=Math.atan2(ey-it.y,ex-it.x);
      x.save();x.strokeStyle='#E8D3A0aa';x.lineWidth=1.5;x.beginPath();x.moveTo(it.x+Math.cos(a)*it.r*0.9,it.y+Math.sin(a)*it.r*0.9);x.lineTo(ex,ey);x.stroke();x.restore()}
    let ty=B.y0+L.pad;for(const [t,sz,c] of best.lines){wmText(x,t,(B.x0+B.x1)/2,ty+sz/2+1,sz,c);ty+=sz+3}
  }
  return{rects:out,bad};
}

function wmDrawWorld(){
  const {x,w,h}=wmCanvas('wmWorld'),G=wmGraph(),cur=S.wd&&S.wd.reg;
  // סיבוב: בוחרים בין בלי סיבוב לרבע סיבוב, לפי מה שנותן מפה גדולה יותר בחלון הזה
  const fit=f=>{const q=G.show.map(r=>f(G.pos[r]));return Math.min(w/(Math.max(...q.map(p=>p.x))-Math.min(...q.map(p=>p.x))+WMAP.pad*2),h/(Math.max(...q.map(p=>p.y))-Math.min(...q.map(p=>p.y))+WMAP.pad*2.35))};
  const rot=fit(p=>({x:-p.y,y:p.x}))>fit(p=>p)*WMAP.turn?(p=>({x:-p.y,y:p.x})):(p=>p),pos={};for(const r of G.show)pos[r]=rot(G.pos[r]);
  const ps=G.show.map(r=>pos[r]),x0=Math.min(...ps.map(p=>p.x))-WMAP.pad,x1=Math.max(...ps.map(p=>p.x))+WMAP.pad,
    y0=Math.min(...ps.map(p=>p.y))-WMAP.pad,y1=Math.max(...ps.map(p=>p.y))+WMAP.pad*1.35;   // מתחת לאי: השם ומונה הסודות
  // קנה מידה לכל ציר בנפרד: כשהאיים בטור צר והחלון רחב, המפה נמתחת לרוחב (עד stretch), כדי שיהיה מקום לשמות
  let kx=w/(x1-x0),ky=h/(y1-y0);const k=Math.min(kx,ky);kx=Math.min(kx,k*WMAP.stretch);ky=Math.min(ky,k*WMAP.stretch);
  const ox=(w-(x1-x0)*kx)/2-x0*kx,oy=(h-(y1-y0)*ky)/2-y0*ky,at=r=>({x:pos[r].x*kx+ox,y:pos[r].y*ky+oy}),rad=Math.min(64,WMAP.island*k);
  // הים מסביב
  x.fillStyle='#10233A';x.fillRect(0,0,w,h);
  // השבילים: מלא בין שני אזורים שביקרת בהם, מקווקו לאזור שעוד לא
  for(const e of G.edges){const a=at(e.a),b=at(e.b),known=wmSeen(e.a)&&wmSeen(e.b);
    x.save();x.strokeStyle=known?'#E8D3A0':'#E8D3A066';x.lineWidth=known?5:3;x.setLineDash(known?[]:[8,8]);x.lineCap='round';
    x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke();x.restore()}
  for(const r of G.show){const p=at(r),R=wmRegion(r),seen=wmSeen(r);
    // האי: צבע הקרקע של האזור, עם חוף בהיר. צללית כהה כשעוד לא ביקרת
    x.beginPath();for(let i=0;i<=16;i++){const a=i/16*Math.PI*2,rr=rad*(1+0.09*Math.sin(a*3+r.length));i?x.lineTo(p.x+Math.cos(a)*rr,p.y+Math.sin(a)*rr*0.82):x.moveTo(p.x+rr,p.y)}
    x.closePath();x.fillStyle=seen?R.ground:WMAP.fog;x.fill();x.lineWidth=3;x.strokeStyle=seen?'#D9C690':'#3A4566';x.stroke();
    if(!seen){wmText(x,'?',p.x,p.y,Math.round(rad*0.8),C.dim);continue}
    if(r===cur){x.save();x.lineWidth=4;x.strokeStyle=C.gold;x.shadowColor=C.gold;x.shadowBlur=12;x.stroke();x.restore()}
    const ln=wmLantern(r);
    if(ln){x.beginPath();x.arc(p.x,p.y-rad*0.3,9,0,Math.PI*2);x.fillStyle=ln.lit?ln.L.glow:'#2A2F3E';
      if(ln.lit){x.save();x.shadowColor=ln.L.glow;x.shadowBlur=14;x.fill();x.restore()}else x.fill();x.lineWidth=2;x.strokeStyle='#000a';x.stroke()}
    if(r===cur)wmText(x,'★',p.x,p.y+rad*0.25,20,C.gold);
  }
  // השמות ומוני הסודות, אחרי כל האיים, כדי שאף אי לא יכסה תווית. האזור הנוכחי בוחר מקום ראשון
  const L=WMAP.label,seen=G.show.filter(wmSeen).sort((a,b)=>(b===cur)-(a===cur));
  const lab=wmLabels(x,seen.map(r=>{const p=at(r),sc=wmSecrets(r);return{reg:r,x:p.x,y:p.y,r:rad,short:T('wm.short.'+r),
    lines:[[T('w.region.'+r),L.name,r===cur?C.gold:C.chalk]].concat(sc?[['🔍 '+sc,L.count,C.chalk]]:[])}}),G.show.map(r=>Object.assign({r:rad*0.95},at(r))),w,h);
  WMAP.rects=lab.rects;WMAP.bad=lab.bad;   // לבדיקה (check.js): כמה חפיפות נשארו
  travelMapSpots(G.show.map(r=>Object.assign({r},at(r))),rad);   // נגיעה באי עם פנס דולק: קפיצה (travel.js)
}

function wmDrawHere(){
  const {x,w,h}=wmCanvas('wmHere'),R=WR(),sz=R.size,k=Math.min((w-16)/sz.w,(h-16)/sz.h),ox=w/2,oy=h/2,at=(px,py)=>({x:ox+px*k,y:oy+py*k});
  x.fillStyle='#0B0E18';x.fillRect(0,0,w,h);
  const tl=at(-sz.w/2,-sz.h/2);x.fillStyle=R.ground;x.fillRect(tl.x,tl.y,sz.w*k,sz.h*k);x.lineWidth=2;x.strokeStyle='#D9C69099';x.strokeRect(tl.x,tl.y,sz.w*k,sz.h*k);
  // מים, סדקים או לבה
  const pc=R.pondCol||['#1F4A66','#46D3E6'];
  for(const p of R.ponds||[]){const c=at(p.x,p.y);x.beginPath();x.arc(c.x,c.y,p.r*k,0,Math.PI*2);x.fillStyle=pc[0];x.fill();x.lineWidth=1.5;x.strokeStyle=pc[1]+'88';x.stroke()}
  // המקורות כמו שהם עכשיו: נקודה בצבע של הסוג, דהויה כשנשבר
  for(const n of (S.nd&&S.nd.list)||[]){const K=wKind(n.kind),c=at(n.x,n.y);x.globalAlpha=n.hp>0?0.9:0.25;x.beginPath();x.arc(c.x,c.y,WMAP.dot.node,0,Math.PI*2);x.fillStyle=K?K.col:'#888';x.fill()}
  x.globalAlpha=1;
  // הפנס של האזור
  const ln=wmLantern(S.wd.reg);
  if(ln){const c=at(ln.L.x,ln.L.y);x.beginPath();x.arc(c.x,c.y,WMAP.dot.lantern,0,Math.PI*2);x.fillStyle=ln.lit?ln.L.glow:'#2A2F3E';x.fill();x.lineWidth=2;x.strokeStyle=ln.lit?'#fff':ln.L.glow;x.stroke()}
  // הדמויות שגילית (רק באזורים שיש בהם)
  if(!R.noNpc)for(const id in WNPC.list)if(wnpcMet(id)){const A=WNPC.list[id].at,c=at(A.x,A.y);
    x.beginPath();x.arc(c.x,c.y,WMAP.dot.npc,0,Math.PI*2);x.fillStyle=WNPC.list[id].col;x.fill();x.lineWidth=2;x.strokeStyle='#fff';x.stroke()}
  // השערים: לכפר, לזירה, ולאזורים אחרים, עם השם
  const gs=wGates(),gl=[];
  for(const id in gs){const g=gs[id],c=at(g.x,g.y);x.beginPath();x.arc(c.x,c.y,WMAP.dot.gate,0,Math.PI*2);x.fillStyle=wGateCol(id);x.fill();x.lineWidth=2;x.strokeStyle='#000a';x.stroke();
    gl.push({x:c.x,y:c.y,r:WMAP.dot.gate,lines:[[wGateName(id),11,wGateCol(id)]]})}
  const me0=at(P.x,P.y),hl=wmLabels(x,gl,gl.map(g=>({x:g.x,y:g.y,r:g.r})).concat([{x:me0.x,y:me0.y,r:WMAP.dot.player*1.8}]),w,h);WMAP.hereRects=hl.rects;WMAP.hereBad=hl.bad;   // שמות השערים: בלי לחתוך בקצה ובלי לעלות זה על זה
  // אתה: נקודה זהובה עם חץ לכיוון ההליכה
  const me=at(P.x,P.y),a=P.face||0,r=WMAP.dot.player;
  x.save();x.shadowColor=C.gold;x.shadowBlur=10;x.beginPath();x.moveTo(me.x+Math.cos(a)*r*1.8,me.y+Math.sin(a)*r*1.8);
  x.lineTo(me.x+Math.cos(a+2.4)*r,me.y+Math.sin(a+2.4)*r);x.lineTo(me.x+Math.cos(a-2.4)*r,me.y+Math.sin(a-2.4)*r);x.closePath();x.fillStyle=C.gold;x.fill();x.restore();
  x.lineWidth=2;x.strokeStyle='#000';x.stroke();
}

function wmDraw(){
  $('wMap').innerHTML=winHead('🗺️ '+T('wm.title'))+
    '<div class="wmcols"><section><h4>'+T('wm.world')+'</h4><div class="wmbox"><canvas id="wmWorld"></canvas></div></section>'+
    '<section><h4>'+T('w.region.'+S.wd.reg)+' <small>★ '+T('wm.here')+'</small></h4><div class="wmbox"><canvas id="wmHere"></canvas></div></section></div>'+
    tierRow()+travelMapRow()+'<p class="wmkey">'+[$('wSec').textContent,$('chTag').hidden?'':$('chTag').textContent].filter(Boolean).map(s=>'<b>'+s+'</b>').join(' ')+' '+T('wm.key')+'</p>';   // 🔍 ו-🌀 עברו מהפס העליון לכאן (docs/plan-hud.md)   // דרגת העולם (tiers.js)
  wmDrawWorld();wmDrawHere();
}

function wmapOpen(on){
  const w=$('wMap');
  if(on){if(!S||S.mode!=='play'||!S.wd)return;if(!$('qLog').hidden)questLogOpen(false);if(!$('bookWin').hidden)bookOpen(false);
    S.mode='map';joy=null;w.hidden=false;wmDraw()}
  else{w.hidden=true;if(S&&S.mode==='map')S.mode='play'}
}
// הכפתור: לשונית בתפריט הראשי (menu.js)
$('wMap').addEventListener('click',e=>{const b=e.target.closest('button');if(b&&b.dataset.act==='close'){wmapOpen(false);sfx('ui')}if(b&&b.dataset.act==='tier'&&tierSet(+b.dataset.n))wmDraw()});
addEventListener('resize',()=>{if(!$('wMap').hidden&&S.wd)wmDraw()});
