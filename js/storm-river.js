/* נהר הברקים (מגדלי הסערה, 6.11.2026): docs/concept-regions.md, פרק 4. המפה ב-map-storm.js, והנהר שם חוסם כמו מים.
   ניר: "יותר חי וברור, לא יותר קשה". לכן כל סכנה כאן נראית מראש ואפשר להימנע ממנה:
   1. הגדה: מי שנדחף אל הנהר נפגע בנזק מתון, נהדף החוצה, ויש הפסקה בין פגיעות. הגשרים בטוחים תמיד.
   2. מעבר האבנים (map.fords): ברק מכה במעבר בקצב קבוע. לפני כל מכה אזהרה: המים מאירים וטבעת מתמלאת. עוברים בין ברק לברק.
   3. ברקים בנהר: ליד השחקן ברק מכה במים מדי פעם, עם עיגול שנסגר לפני המכה. מי שעומד על הגדה ממש לידו, נפגע.
   אויבים נפגעים מכל השלושה כמו השחקן (בלי בוסים ומקורות משאבים), אז משתלם למשוך אותם לנהר. הריגה כזו נותנת שלל כרגיל.
   הלוגיקה ב-riverUpdate, הציור בקנבס ב-riverDraw (מעל התלת-ממד, אז אותו ציור בשניהם). rzWait: לבוט (tools/balance-world.js).
   חיבור: worldUpdate ו-drawWorld ב-world.js. פעיל במפה של RIVERZAP.reg, וגם בקומות של עומק הצל שנבנות ממנה (אותה מפה) */
const RIVERZAP={
  reg:'storm',
  touch:-2,                                         // "נגיעה": מרחק מהמים קטן מ-TERRAIN.pad ועוד זה. שלילי: רק מי שנדחף לתוך הנהר, לא מי שהולך לידו
  bank:{dmg:0.06,foe:0.12,cd:1,push:30},            // dmg/foe: חלק מהחיים המקסימליים. cd: שניות בין פגיעות. push: כמה נהדפים מהמים
  ford:{calm:2.8,warn:1,hit:0.35,dmg:0.15,foe:0.35,band:14,stones:6},   // מחזור במעבר: שקט, אזהרה, מכה. band: כמה מעבר לשפת המים מסוכן. stones: כמה אבנים מצוירות
  bolt:{every:1.8,warn:0.8,hit:0.3,r:80,dmg:0.12,foe:0.3,near:600,spread:380,safe:240},   // ברק במים ליד השחקן (near). safe: לא ליד גשר או מעבר
  hint:300,                                         // מתקרבים למעבר האבנים: פעם אחת בביקור, "עבור בין ברק לברק"
  sparks:{gap:150,view:760}                         // ניצוצות על המים: כל כמה פיקסלים, ועד כמה רחוק מהשחקן
};
const RZSEG=new WeakMap();   // הקטעים של הנהר לכל מפה, נבנים פעם אחת
function rzOn(){const B=WORLD.regions[RIVERZAP.reg];return !!(S.wd&&B&&B.map&&typeof TR!=='undefined'&&TR&&TR.map===B.map)}
function rzSegs(M){let s=RZSEG.get(M);if(s)return s;s=[];
  for(const r of M.rivers||[])for(let i=1;i<r.pts.length;i++){const a=r.pts[i-1],b=r.pts[i];s.push({ax:a[0],ay:a[1],bx:b[0],by:b[1],w:r.w,len:Math.hypot(b[0]-a[0],b[1]-a[1])||1})}
  RZSEG.set(M,s);return s}
// הנקודה הקרובה במים: d = המרחק משפת המים (שלילי = בתוך המים), nx,ny = הכיוון החוצה, s = הקטע
function rzNear(x,y){let b=null;
  for(const s of rzSegs(TR.map)){const dx=s.bx-s.ax,dy=s.by-s.ay,t=Math.max(0,Math.min(1,((x-s.ax)*dx+(y-s.ay)*dy)/(s.len*s.len))),px=s.ax+dx*t,py=s.ay+dy*t,e=Math.hypot(x-px,y-py),d=e-s.w/2;
    if(!b||d<b.d)b={d,px,py,nx:e?(x-px)/e:0,ny:e?(y-py)/e:0,s,t}}
  return b}
// בתוך מלבן מסובב (גשר) או אליפסה (מעבר), עם שוליים m. כמו הציור ב-terrain.js
const rzLocal=(o,a,x,y)=>{const c=Math.cos(a||0),s=Math.sin(a||0),dx=x-o.x,dy=y-o.y;return[dx*c+dy*s,-dx*s+dy*c]};
function rzBridge(x,y,m){for(const b of TR.map.bridges||[]){const [u,v]=rzLocal(b,b.a,x,y);if(Math.abs(u)<b.len/2+m&&Math.abs(v)<b.w/2+m)return true}return false}
function rzInFord(f,x,y,m){const [u,v]=rzLocal(f,f.a,x,y);return (u/(f.r+m))**2+(v/(f.r*0.8+m))**2<1}
// האזור המסוכן במעבר: האליפסה, רק איפה שהיא מעל המים (עם band)
function rzFordZone(f,x,y,r=0){if(!rzInFord(f,x,y,r*0.5))return false;const n=rzNear(x,y);return n.d<TERRAIN.pad+RIVERZAP.ford.band+r*0.5}
const rzFords=()=>TR.map.fords||[];
function rzState(){const w=S.wd;if(!w.rz||w.rz.reg!==w.reg)w.rz={reg:w.reg,t:0,ford:rzFords().map((f,i)=>({ph:i*1.3,struck:false,flash:0})),bolts:[],next:1,told:false,zapTold:false,cdP:0};return w.rz}

/* ---- לוגיקה ---- */
const rzVictims=()=>enemies.filter(e=>!e.dead&&!e.isBoss&&!e.wboss&&!e.node);
function rzFoe(e,k,from){const d=Math.max(1,e.max*k);e.hp-=d;e.flash=0.12;dmgFloat(e,d,dtCol('bolt'),15,false);sparks(e.x,e.y,dtCol('bolt'),6);
  if(from){e.kx=(e.kx||0)+from.nx*140;e.ky=(e.ky||0)+from.ny*140}
  if(e.hp<=0&&!e.dead)kill(e)}
function rzStrike(x,y,inside,kP,kF){   // מכה אחת: מי שבפנים נפגע, ניצוצות ורעידה
  sparks(x,y,dtCol('bolt'),14,260);sparks(x,y,'#FFFFFF',6,160);
  if(Math.hypot(P.x-x,P.y-y)<520)S.shake=Math.max(S.shake,5);
  if(inside(P.x,P.y,P.r||12))hurt(P.maxHp*kP)
  for(const e of rzVictims())if(inside(e.x,e.y,e.r||12))rzFoe(e,kF)}
function riverUpdate(dt){
  if(!rzOn()||S.mode!=='play')return;
  const Z=RIVERZAP,st=rzState();st.t+=dt;st.cdP-=dt;
  // 1. הגדה
  const touch=(o)=>{const n=rzNear(o.x,o.y);if(n.d>=TERRAIN.pad+Z.touch||rzBridge(o.x,o.y,20)||rzFords().some(f=>rzInFord(f,o.x,o.y,30)))return null;return n};
  let n=touch(P);
  if(n&&st.cdP<=0){st.cdP=Z.bank.cd;hurt(P.maxHp*Z.bank.dmg);
    P.x+=n.nx*Z.bank.push;P.y+=n.ny*Z.bank.push;sparks(n.px,n.py,dtCol('bolt'),10,220);
    if(!st.zapTold){st.zapTold=true;floatText(P.x,P.y-58,T('rz.zap'),dtCol('bolt'),15)}}
  for(const e of rzVictims()){e._rz=(e._rz||0)-dt;if(e._rz>0)continue;n=touch(e);if(n){e._rz=Z.bank.cd;rzFoe(e,Z.bank.foe,n)}}
  // 2. מעבר האבנים
  const F=Z.ford,cyc=F.calm+F.warn+F.hit;
  rzFords().forEach((f,i)=>{const s=st.ford[i];s.ph+=dt;
    if(!s.struck&&s.ph>=F.calm+F.warn){s.struck=true;rzStrike(f.x,f.y,(x,y,r)=>rzFordZone(f,x,y,r),F.dmg,F.foe)}
    if(s.ph>=cyc){s.ph-=cyc;s.struck=false}
    if(!st.told&&Math.hypot(P.x-f.x,P.y-f.y)<Z.hint){st.told=true;floatText(P.x,P.y-58,T('rz.hint'),dtCol('bolt'),15)}});
  // 3. ברקים במים ליד השחקן
  const Bo=Z.bolt;
  for(const b of st.bolts){b.t+=dt;if(!b.hit&&b.t>=Bo.warn){b.hit=true;rzStrike(b.x,b.y,(x,y,r)=>Math.hypot(x-b.x,y-b.y)<Bo.r+r,Bo.dmg,Bo.foe)}}
  st.bolts=st.bolts.filter(b=>b.t<Bo.warn+Bo.hit);
  if((st.next-=dt)<=0){st.next=Bo.every*(0.7+Math.random()*0.6);const p=rzNear(P.x,P.y);
    if(p.d<Bo.near)for(let k=0;k<4;k++){const s=p.s,along=(p.t*s.len+(Math.random()*2-1)*Bo.spread)/s.len,t=Math.max(0,Math.min(1,along)),off=(Math.random()-0.5)*s.w*0.4;
      const ux=(s.bx-s.ax)/s.len,uy=(s.by-s.ay)/s.len,x=s.ax+(s.bx-s.ax)*t-uy*off,y=s.ay+(s.by-s.ay)*t+ux*off;
      if(rzBridge(x,y,Bo.safe)||rzFords().some(f=>Math.hypot(x-f.x,y-f.y)<Bo.safe+f.r))continue;
      st.bolts.push({x,y,t:0,hit:false,seed:Math.floor(Math.random()*1e4)});break}}
}
// לבוט: האם לחכות לפני הצעד הבא (dx,dy)? לא נכנסים למעבר שעומד להכות או לעיגול אזהרה. מי שכבר בפנים ממשיך
function rzWait(o,dx,dy){
  if(!rzOn()||!S.wd.rz||!(dx||dy))return false;const st=S.wd.rz,Z=RIVERZAP,F=Z.ford,nx=o.x+dx*40,ny=o.y+dy*40;
  for(const [i,f] of rzFords().entries()){if(rzFordZone(f,o.x,o.y,12)||!rzFordZone(f,nx,ny,12))continue;const s=st.ford[i];if(s.struck||F.calm-s.ph<1.6)return true}
  for(const b of st.bolts)if(!b.hit&&Math.hypot(o.x-b.x,o.y-b.y)>Z.bolt.r+14&&Math.hypot(nx-b.x,ny-b.y)<Z.bolt.r+14)return true;
  return false}

/* ---- ציור (קנבס, נקודות העולם) ---- */
function rzBolt(x,y,seed,k){   // ברק מהשמיים אל (x,y)
  const pts=[[x+(hash(seed,1)-0.5)*90,y-560]];for(let j=1;j<8;j++)pts.push([x+(hash(seed,j+2)-0.5)*70*(1-j/9),y-560+j*70]);pts.push([x,y]);
  const line=()=>{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke()};
  ctx.lineCap=ctx.lineJoin='round';ctx.globalAlpha=0.45*k;ctx.strokeStyle=dtCol('bolt');ctx.lineWidth=12;line();
  ctx.globalAlpha=k;ctx.strokeStyle='#FFFFFF';ctx.lineWidth=3.5;line();
  ctx.globalAlpha=0.55*k;ctx.fillStyle='#FFFFFF';ctx.beginPath();ctx.ellipse(x,y,46,30,0,0,7);ctx.fill()}
function rzRing(x,y,r,k,col){   // טבעת שמתמלאת: כמה זמן נשאר עד המכה
  ctx.globalAlpha=0.9;ctx.strokeStyle='rgba(10,6,24,0.6)';ctx.lineWidth=7;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.stroke();
  ctx.strokeStyle=col;ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y,r,-Math.PI/2,-Math.PI/2+k*6.283);ctx.stroke()}
function riverDraw(){
  if(!rzOn())return;
  const Z=RIVERZAP,st=rzState(),t=fxNow(),col=dtCol('bolt'),M=TR.map,F=Z.ford,cyc=F.calm+F.warn+F.hit;ctx.save();ctx.lineCap=ctx.lineJoin='round';
  // ניצוצות קטנים שמהבהבים על המים: הנהר "חי" גם כשאין ברק
  ctx.strokeStyle=col;ctx.lineWidth=2;
  rzSegs(M).forEach((s,si)=>{const n=Math.floor(s.len/Z.sparks.gap);for(let i=0;i<n;i++){
    const q=(i+0.5)/n,x=s.ax+(s.bx-s.ax)*q,y=s.ay+(s.by-s.ay)*q;if(Math.abs(x-P.x)>Z.sparks.view||Math.abs(y-P.y)>Z.sparks.view*0.7)continue;
    const fr=Math.floor(t*7+hash(si,i)*9);if(hash(si*31+i,fr)<0.55)continue;
    const ox=x+(hash(i,fr+1)-0.5)*s.w*0.6,oy=y+(hash(i,fr+2)-0.5)*s.w*0.4;ctx.globalAlpha=0.85;ctx.beginPath();ctx.moveTo(ox,oy);
    for(let j=1;j<=3;j++)ctx.lineTo(ox+(hash(i*7+j,fr)-0.5)*26,oy+(hash(i*5+j,fr+3)-0.5)*18);ctx.stroke()}});
  // מעבר האבנים: האבנים, ובאזהרה המים מאירים וטבעת מתמלאת. במכה: ברק מהשמיים
  rzFords().forEach((f,i)=>{const s=st.ford[i];if(Math.abs(f.x-P.x)>1400||Math.abs(f.y-P.y)>1000)return;
    const warn=s.ph>F.calm&&!s.struck,hit=s.struck?Math.max(0,1-(s.ph-F.calm-F.warn)/F.hit):0,k=warn?(s.ph-F.calm)/F.warn:0;
    ctx.save();ctx.beginPath();ctx.ellipse(f.x,f.y,f.r,f.r*0.8,f.a||0,0,7);ctx.clip();   // האזור: האליפסה, רק מעל המים
    for(const r of M.rivers||[]){ctx.beginPath();r.pts.forEach((p,j)=>j?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.lineWidth=r.w+2*(TERRAIN.pad+F.band);
      ctx.globalAlpha=warn?0.25+0.45*k*(0.75+0.25*Math.sin(t*30)):hit?0.8*hit:0.14;ctx.strokeStyle=hit?'#FFFFFF':col;ctx.stroke();
      if(!warn&&!hit){ctx.globalAlpha=0.5;ctx.setLineDash([14,12]);ctx.lineWidth=2;ctx.strokeStyle=col;ctx.stroke();ctx.setLineDash([])}}
    ctx.restore();
    const c=Math.cos(f.a||0),sn=Math.sin(f.a||0);   // האבנים: לאורך הציר הארוך של המעבר
    for(let j=0;j<F.stones;j++){const u=(j/(F.stones-1)-0.5)*f.r*1.5,x=f.x+c*u+(hash(j,77)-0.5)*14,y=f.y+sn*u;
      ctx.globalAlpha=1;ctx.fillStyle='rgba(10,6,24,0.45)';ctx.beginPath();ctx.ellipse(x+2,y+4,15,10,0,0,7);ctx.fill();
      ctx.fillStyle=warn?'#E4D6FF':'#8F8AA6';ctx.beginPath();ctx.ellipse(x,y,14,9.5,0,0,7);ctx.fill();ctx.fillStyle='rgba(255,255,255,0.35)';ctx.beginPath();ctx.ellipse(x-3,y-3,6,3.5,0,0,7);ctx.fill()}
    if(warn)rzRing(f.x,f.y,f.r*0.95,k,'#FFFFFF');
    if(hit)rzBolt(f.x,f.y,Math.floor(st.t/cyc)*13+i,hit)});
  // ברקים במים: עיגול שנסגר עד המכה, ואז ברק
  const Bo=Z.bolt;
  for(const b of st.bolts){if(!b.hit){const k=b.t/Bo.warn;ctx.globalAlpha=0.2+0.35*k;ctx.fillStyle=col;ctx.beginPath();ctx.arc(b.x,b.y,Bo.r,0,7);ctx.fill();
      ctx.globalAlpha=0.9;ctx.strokeStyle='#FFFFFF';ctx.lineWidth=3;ctx.beginPath();ctx.arc(b.x,b.y,Bo.r*(2-k),0,7);ctx.stroke();
      ctx.lineWidth=2;ctx.strokeStyle=col;ctx.beginPath();ctx.arc(b.x,b.y,Bo.r,0,7);ctx.stroke()}
    else rzBolt(b.x,b.y,b.seed,Math.max(0,1-(b.t-Bo.warn)/Bo.hit))}
  ctx.restore();
}
