/* מראה של סקילים בזירה (אוראל, 2.11.2026 לילה: "שיפורים בכפתורים ובגרפיקה").
   עוטף מבחוץ את drawSkills (skills.js), ורק בזירה: בעולם, בכפר, במובה ובדמות אישית (heroTheme) נשאר הציור הישן.
   הלוגיקה של הסקילים לא משתנה. skillUse נעטף רק כדי לסמן איזה סקיל יצר כל אפקט, ו-comboShow כדי להוסיף הבזק.
   - רעידת אדמה: טבעת שסודקת את הרצפה, אבנים שעפות ואבק
   - התזה: גל מים עם קצף לבן וטיפות
   - להבה: לשונות אש שעולות מהטבעת, וגחלים
   - כפור: רסיסי קרח שבולטים מהטבעת ושברים קטנים
   - ברק: קו שבור שמהבהב ומשתנה, עם ענף, הילה קצרה והבזק במטרה
   - מעל אויב: טיפה, פתית שלג וכוכבים בתוך עיגול כהה, וקרום קרח סביב קפוא. קומבו: הבזק חזק במקום
   כל ציור מקבל קו כהה מתחת, כדי שייראה גם על רצפת האבן בתלת-ממד (arena-look.js).
   החלקיקים מחושבים מהזמן (בלי מערך שמתעדכן), עם תקרה לכל סקיל ולכל פריים.
   "פחות אפקטים" בהגדרות, או "הפחתת תנועה" בטלפון: בלי חלקיקים, בלי הבהוב ובלי הבזק. כל המספרים ב-SKFX */
const SKFX={
  on:true,
  lineLife:1.2,              // ברק מהסקיל: פי כך יותר, כדי שההבהוב ייראה
  life:1.25,                 // טבעת חיה פי כך יותר מהציור הישן (0.35 שניות), כדי שיהיה זמן לראות סדקים ואבנים
  maxParts:60,               // כמה חלקיקים לכל היותר בפריים אחד, מכל הסקילים יחד
  parts:{quake:12,splash:14,flame:12,frost:12,zap:5},   // כמה חלקיקים לכל הטלה
  shade:'rgba(12,10,18,0.55)',   // הקו הכהה מתחת לכל ציור
  quake:{cracks:7,seg:4,jit:0.35,len:0.95,up:70,dust:3},   // סדקים: כמה, כמה חלקים, כמה עקום, אורך ביחס לטבעת. up: כמה גבוה האבנים עפות
  splash:{crest:'#DDF0FF',up:55},
  flame:{tongues:12,h:46,w:13,core:'#FFD84D',tip:'#FFF3C4'},
  frost:{shards:10,len:30,w:7,light:'#E8FBFF'},
  zap:{flick:0.045,jit:10,seg:7,branch:0.55,full:4},   // flick: כל כמה שניות הקו משתנה. branch: איפה יוצא הענף. full: כמה קווים בפריים מקבלים ציור מלא (חשמול יוצר עשרות), והשאר בנתיב אחד פשוט
  mark:{r:9,bg:'rgba(10,14,30,0.6)',stars:3,crust:7},    // הסימן מעל אויב: רדיוס העיגול, רקע, כמה כוכבים בהלם, וכמה צלעות לקרום הקרח
  combo:{max:0.45,r:46,rays:8}   // הבזק קומבו: כמה זמן, כמה גדול, וכמה קרניים
};
const SKFXS={drawn:0,parts:0,peak:0,combos:0,old:0};   // ספירה לבדיקה (tools/check.js)

const skfxOn=()=>SKFX.on&&!!S&&!!S.sk&&skArena()&&!heroTheme()&&!(typeof MB!=='undefined'&&MB);
const skfxParts=()=>!RM&&!fxLess();
// מספר אקראי קבוע לפי זרע ומספר, כדי שסדק או אבן יישארו באותו מקום בכל פריים
const skRnd=(s,i)=>{const x=Math.sin(s*12.9898+i*78.233)*43758.5453;return x-Math.floor(x)};
let skSeedN=0;const skSeed=()=>(++skSeedN)*7.31%1000;   // זרע לכל אפקט, בלי Math.random (שהבדיקה עם seed תישאר אותה ריצה)
const skEase=k=>1-(1-k)*(1-k);
const skDtOf=col=>{for(const t in DMG.types)if(DMG.types[t].col===col)return t;return null};

// skillUse: מסמנים את האפקטים החדשים בסקיל שיצר אותם, וטבעת מקבלת זמן ארוך יותר
(()=>{const old=skillUse;skillUse=function(id){const k=S.sk,n0=k?k.fx.length:0,r=old.apply(this,arguments);
  if(r&&k&&skfxOn())for(let i=n0;i<k.fx.length;i++){const f=k.fx[i];f.sk=id;f.seed=skSeed();if(f.ring)f.max*=SKFX.life;else if(f.line)f.max*=SKFX.lineLife}
  return r}})();
// comboShow: הבזק במקום, רק כשהמילה באמת קפצה (לא בתוך gap)
(()=>{const old=comboShow;comboShow=function(e,kind){const k=S.sk,l0=k&&k.last[kind];old.apply(this,arguments);
  if(k&&k.last[kind]!==l0&&skfxOn()&&skfxParts()){k.fx.push({combo:kind,x:e.x,y:e.y-e.r*0.6,t:0,max:SKFX.combo.max,col:SKILLS.combo[kind].col,seed:skSeed()});SKFXS.combos++}}})();

(()=>{const old=drawSkills;drawSkills=function(ox,oy){if(!skfxOn()){SKFXS.old++;return old.apply(this,arguments)}skfxDraw(ox,oy)}})();

let skfxBudget=0;
const skTake=n=>{const m=Math.max(0,Math.min(n,skfxBudget));skfxBudget-=m;return m};
function skfxDraw(ox,oy){
  const parts=skfxParts();skfxBudget=parts?SKFX.maxParts:0;SKFXS.drawn++;
  ctx.save();ctx.lineJoin='round';ctx.lineCap='round';let nl=0,rcol=null;const rest=new Path2D();
  for(const f of S.sk.fx){
    if(f.hand&&AGE_FX.tip){f.ax=AGE_FX.tip.x;f.ay=AGE_FX.tip.y}   // כמו ב-skills.js: מקצה הלהב, או מהיד לכיוון המטרה
    else if(f.hand&&AGE_FX.hand){const h=AGE_FX.hand,d=Math.hypot(f.bx-h.x,f.by-h.y)||1;f.ax=h.x+(f.bx-h.x)/d*SKILLS.tip;f.ay=h.y+(f.by-h.y)/d*SKILLS.tip}
    if(f.seed===undefined)f.seed=skSeed();
    const k=Math.min(1,f.t/f.max);
    if(f.combo)skfxCombo(f,k);
    else if(f.line){if(nl++<SKFX.zap.full)skfxZap(f,k,parts);else{const p=skBolt(f.ax,f.ay,f.bx,f.by,f.seed+(parts?Math.floor(f.t/SKFX.zap.flick):0),4,SKFX.zap.jit);
      p.forEach(([x,y],i)=>i?rest.lineTo(x,y):rest.moveTo(x,y));rcol=f.col}}
    else if(f.ring){const t=f.sk?skDef(f.sk).dt:skDtOf(f.col);
      (t==='earth'?skfxQuake:t==='water'?skfxSplash:t==='fire'?skfxFlame:t==='ice'?skfxFrost:skfxRing)(f,k,parts)}
  }
  if(rcol)for(const [w,c] of [[4,SKFX.shade],[2.2,rcol],[0.9,'#fff']]){ctx.globalAlpha=0.85;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.stroke(rest)}   // שאר הברקים: בנתיב אחד
  ctx.globalAlpha=1;
  for(const e of enemies){
    if(e.dead||!(e.wet>0||e.frozen>0||e.stun>0.3)||!onScreen(e.x+ox,e.y+oy))continue;
    skfxMark(e);
  }
  ctx.restore();ctx.globalAlpha=1;
  const used=(parts?SKFX.maxParts:0)-skfxBudget;SKFXS.parts=used;SKFXS.peak=Math.max(SKFXS.peak,used);
}


/* ---- עזרים: כל קבוצה (סדקים, אבנים, טיפות, לשונות) היא נתיב אחד שמצוירים פעם אחת, כדי שזה יהיה קל ---- */
// קו כהה מתחת ואז הצבע: נראה גם על אבן בהירה וגם על רצפה כהה
function skStroke(w,col,al){ctx.globalAlpha=al*0.8;ctx.strokeStyle=SKFX.shade;ctx.lineWidth=w+3;ctx.stroke();ctx.globalAlpha=al;ctx.strokeStyle=col;ctx.lineWidth=w;ctx.stroke()}
function skCircle(x,y,r){ctx.beginPath();ctx.arc(x,y,Math.max(0.1,r),0,7)}
const skDot=(x,y,r)=>{ctx.moveTo(x+r,y);ctx.arc(x,y,Math.max(0.1,r),0,7)};
// מצולע מסובב: נקודות [x,y] יחסית למרכז, מסובבות בזווית an
function skPoly(x,y,pts,an){const c=Math.cos(an),s=Math.sin(an);pts.forEach(([u,v],i)=>{const px=x+u*c-v*s,py=y+u*s+v*c;i?ctx.lineTo(px,py):ctx.moveTo(px,py)});ctx.closePath()}
// הגל עצמו: מילוי שקוף וקו עם צל
function skWave(f,rr,a,w,fill){ctx.fillStyle=f.col;ctx.globalAlpha=a*fill;skCircle(f.x,f.y,rr);ctx.fill();skStroke(w,f.col,a)}
function skfxRing(f,k){const a=1-k;skWave(f,f.r*(0.35+0.65*skEase(k)),a,2+3*a,0.14)}
const ROCK=[[-1,-0.6],[0.4,-1],[1,0.3],[-0.3,1]];

/* ---- רעידת אדמה: סדקים ברצפה, גל, אבק ואבנים שעפות בקשת ---- */
function skfxQuake(f,k,parts){
  const Q=SKFX.quake,a=1-k,R=f.r,g=Math.min(1,k/0.22),s=f.seed,rr=R*(0.3+0.7*skEase(k));
  ctx.beginPath();
  for(let c=0;c<Q.cracks;c++){const an=(c+skRnd(s,c)*0.6)/Q.cracks*6.283,L=R*Q.len*(0.65+0.35*skRnd(s,c+40))*g;ctx.moveTo(f.x,f.y);
    for(let j=1;j<=Q.seg;j++){const d=L*j/Q.seg,b=an+(skRnd(s,c*9+j)-0.5)*Q.jit*2;ctx.lineTo(f.x+Math.cos(b)*d,f.y+Math.sin(b)*d*0.85)}}
  ctx.globalAlpha=Math.min(1,a*1.6);ctx.strokeStyle='#1E140C';ctx.lineWidth=2+2.5*a;ctx.stroke();
  ctx.globalAlpha=a*0.8;ctx.strokeStyle='#D9B48A';ctx.lineWidth=1.2;ctx.stroke();
  skWave(f,rr,a,3+4*a,0.18);ctx.globalAlpha=a;ctx.strokeStyle='#E8C79A';ctx.lineWidth=1.3;ctx.stroke();   // קצה בהיר על הגל
  if(!parts)return;
  const nd=skTake(Q.dust);ctx.beginPath();
  for(let i=0;i<nd;i++){const an=skRnd(s,i+90)*6.283,d=rr*(0.85+0.2*skRnd(s,i+91));skDot(f.x+Math.cos(an)*d,f.y+Math.sin(an)*d*0.85,10+22*k)}
  ctx.globalAlpha=a*0.22;ctx.fillStyle='#C9AE8C';ctx.fill();
  const n=skTake(SKFX.parts.quake-Q.dust);ctx.beginPath();
  for(let i=0;i<n;i++){const an=skRnd(s,i+60)*6.283,sp=0.45+0.55*skRnd(s,i+61),d=R*sp*skEase(k),h=Q.up*sp*Math.sin(Math.PI*Math.min(1,k*1.2)),z=3.5+4*skRnd(s,i+62);
    skPoly(f.x+Math.cos(an)*d,f.y+Math.sin(an)*d*0.85-h,ROCK.map(([u,v])=>[u*z,v*z]),an+k*8*(skRnd(s,i+63)-0.5))}
  ctx.globalAlpha=Math.min(1,a*1.8);ctx.fillStyle=f.col;ctx.fill();ctx.strokeStyle=SKFX.shade;ctx.lineWidth=1.5;ctx.stroke();
}

/* ---- התזה: גל עם קצף לבן, שתי אדוות אחריו, וטיפות עם ברק לבן ---- */
function skfxSplash(f,k,parts){
  const Z=SKFX.splash,a=1-k,R=f.r,s=f.seed,rr=R*(0.3+0.7*skEase(k));
  skWave(f,rr,a,4+5*a,0.2);
  ctx.beginPath();for(let i=0;i<8;i++){const b=(i+skRnd(s,i)*0.5)/8*6.283;ctx.moveTo(f.x+Math.cos(b)*rr,f.y+Math.sin(b)*rr);ctx.arc(f.x,f.y,rr,b,b+0.35)}
  ctx.strokeStyle=Z.crest;ctx.lineWidth=2;ctx.globalAlpha=a*0.9;ctx.stroke();
  for(const lag of [0.25]){const q=Math.max(0,k-lag)/(1-lag);if(q<=0)continue;skCircle(f.x,f.y,R*0.75*skEase(q));ctx.strokeStyle=f.col;ctx.lineWidth=1.5;ctx.globalAlpha=(1-q)*0.55;ctx.stroke()}
  if(!parts)return;
  const n=skTake(SKFX.parts.splash),hl=[];ctx.beginPath();
  for(let i=0;i<n;i++){const an=skRnd(s,i+30)*6.283,sp=0.55+0.6*skRnd(s,i+31),d=R*sp*skEase(k),h=Z.up*sp*Math.sin(Math.PI*k),
      x=f.x+Math.cos(an)*d,y=f.y+Math.sin(an)*d*0.85-h,z=2+2.5*skRnd(s,i+32),up=Math.cos(Math.PI*k)>0?1:-1;
    // טיפה: עיגול וזנב לכיוון שממנו באה
    ctx.moveTo(x-z,y);ctx.lineTo(x-Math.cos(an)*z*2.6,y+up*z*1.5);ctx.lineTo(x+z,y);ctx.arc(x,y,z,0,Math.PI,up<0);hl.push(x-z*0.35,y-z*0.35,z*0.35)}
  ctx.globalAlpha=Math.min(1,a*1.6);ctx.fillStyle=f.col;ctx.fill();ctx.strokeStyle=SKFX.shade;ctx.lineWidth=1;ctx.stroke();
  ctx.beginPath();for(let i=0;i<hl.length;i+=3)skDot(hl[i],hl[i+1],hl[i+2]);ctx.fillStyle='#fff';ctx.globalAlpha*=0.8;ctx.fill();
}

/* ---- להבה: חום מהמרכז, לשונות אש בשלוש שכבות (כתום, צהוב, לבן) שעולות ומתנופפות, וגחלים ---- */
function skTongues(T,kw,kh,ks){ctx.beginPath();for(const t of T){const w=t.w*kw,h=t.h*kh,sw=t.sw*ks;
  ctx.moveTo(t.x-w,t.y);ctx.quadraticCurveTo(t.x-w*0.9,t.y-h*0.55,t.x+sw,t.y-h);ctx.quadraticCurveTo(t.x+w*0.9,t.y-h*0.55,t.x+w,t.y);ctx.quadraticCurveTo(t.x,t.y+w*0.5,t.x-w,t.y);ctx.closePath()}}
function skfxFlame(f,k,parts){
  const F=SKFX.flame,a=1-k,R=f.r,s=f.seed,rr=R*(0.35+0.65*skEase(k)),grow=Math.sin(Math.PI*Math.min(1,k*1.15)),flick=parts?S.t*14:0;
  const g=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,Math.max(1,rr));g.addColorStop(0,'rgba(255,216,77,0)');g.addColorStop(0.7,f.col);g.addColorStop(1,'rgba(255,138,61,0)');
  ctx.fillStyle=g;ctx.globalAlpha=a*0.3;skCircle(f.x,f.y,rr);ctx.fill();skStroke(2+3*a,f.col,a*0.9);
  const T=[];for(let i=0;i<F.tongues;i++){const an=(i+skRnd(s,i)*0.5)/F.tongues*6.283,h=F.h*grow*(0.6+0.4*skRnd(s,i+20))*(1+0.12*Math.sin(flick+i*1.7)),w=F.w*(0.7+0.3*skRnd(s,i+21));
    if(h>=2)T.push({x:f.x+Math.cos(an)*rr,y:f.y+Math.sin(an)*rr*0.85,h,w,sw:Math.sin(flick*0.7+i)*w*0.5})}
  if(T.length){
    ctx.globalAlpha=a*0.85;ctx.fillStyle=SKFX.shade;skTongues(T,1.15,1.08,1);ctx.fill();
    ctx.globalAlpha=a;ctx.fillStyle=f.col;skTongues(T,1,1,1);ctx.fill();
    ctx.fillStyle=F.core;skTongues(T,0.6,0.65,0.7);ctx.fill();
    ctx.fillStyle=F.tip;skTongues(T,0.28,0.32,0.4);ctx.fill()}
  if(!parts)return;
  const n=skTake(SKFX.parts.flame);
  for(const odd of [0,1]){ctx.beginPath();
    for(let i=odd;i<n;i+=2){const an=skRnd(s,i+50)*6.283,d=rr*(0.5+0.6*skRnd(s,i+51));skDot(f.x+Math.cos(an)*d+Math.sin(S.t*6+i)*4,f.y+Math.sin(an)*d*0.85-F.h*1.4*k*(0.6+0.6*skRnd(s,i+52)),1.6+1.6*skRnd(s,i+53))}
    ctx.globalAlpha=a;ctx.fillStyle=odd?F.core:f.col;ctx.fill()}
}

/* ---- כפור: גל עם קו בהיר, רסיסי קרח שבולטים החוצה, נצנוצים ושברים ---- */
const SHARD=(len,w)=>[[0,w],[len,0],[0,-w],[-w*0.6,0]];
function skfxFrost(f,k,parts){
  const I=SKFX.frost,a=1-k,R=f.r,s=f.seed,rr=R*(0.35+0.65*skEase(k)),g=Math.min(1,k/0.3);
  ctx.fillStyle=I.light;ctx.globalAlpha=a*0.16;skCircle(f.x,f.y,rr);ctx.fill();skStroke(2.5+3*a,f.col,a);
  skCircle(f.x,f.y,rr*0.9);ctx.globalAlpha=a*0.7;ctx.strokeStyle=I.light;ctx.lineWidth=1;ctx.stroke();
  const sh=[];for(let i=0;i<I.shards;i++){const an=(i+skRnd(s,i)*0.4)/I.shards*6.283;sh.push([f.x+Math.cos(an)*rr*0.92,f.y+Math.sin(an)*rr*0.92*0.85,an,I.len*g*(0.6+0.5*skRnd(s,i+10)),I.w*(0.7+0.3*skRnd(s,i+11))])}
  ctx.beginPath();for(const [x,y,an,l,w] of sh)skPoly(x,y,SHARD(l,w),an);ctx.globalAlpha=a;ctx.fillStyle=f.col;ctx.fill();ctx.strokeStyle=SKFX.shade;ctx.lineWidth=1.5;ctx.stroke();
  ctx.beginPath();for(const [x,y,an,l,w] of sh)skPoly(x,y,SHARD(l*0.6,w*0.35),an);ctx.fillStyle=I.light;ctx.fill();
  if(!parts)return;
  const n=skTake(SKFX.parts.frost),sp=new Path2D(),ch=new Path2D();
  for(let i=0;i<n;i++){const an=skRnd(s,i+70)*6.283,d=rr*(0.9+0.5*skRnd(s,i+71)*k),x=f.x+Math.cos(an)*d,y=f.y+Math.sin(an)*d*0.85-20*Math.sin(Math.PI*k)*skRnd(s,i+72),z=1.8+2*skRnd(s,i+73);
    if(i%3===0){sp.moveTo(x-z*1.6,y);sp.lineTo(x+z*1.6,y);sp.moveTo(x,y-z*1.6);sp.lineTo(x,y+z*1.6)}   // נצנוץ
    else{const c=Math.cos(an+k*4),q=Math.sin(an+k*4);[[-z,-z*0.5],[z,-z*0.5],[z,z*0.5],[-z,z*0.5]].forEach(([u,v],j)=>{const px=x+u*c-v*q,py=y+u*q+v*c;j?ch.lineTo(px,py):ch.moveTo(px,py)});ch.closePath()}}
  ctx.globalAlpha=a;ctx.strokeStyle='#fff';ctx.lineWidth=1.3;ctx.stroke(sp);ctx.fillStyle=I.light;ctx.fill(ch);
}

/* ---- ברק: קו שבור שמשתנה כל flick שניות ומהבהב, ענף אחד, הבזק בשני הקצוות וניצוצות במטרה ---- */
function skBolt(ax,ay,bx,by,seed,n,jit){const pts=[[ax,ay]],dx=bx-ax,dy=by-ay,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
  for(let i=1;i<n;i++){const p=i/n,o=(skRnd(seed,i)-0.5)*2*jit*Math.sin(Math.PI*p)*1.4;pts.push([ax+dx*p+nx*o,ay+dy*p+ny*o])}pts.push([bx,by]);return pts}
function skPath(pts){ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y))}
function skStarPath(x,y,r,n){for(let i=0;i<n*2;i++){const an=i/n*Math.PI-Math.PI/2,d=i%2?r*0.4:r,px=x+Math.cos(an)*d,py=y+Math.sin(an)*d;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath()}
function skfxZap(f,k,parts){
  const Z=SKFX.zap,a=1-k,fr=parts?Math.floor(f.t/Z.flick):0,sd=f.seed+fr*7.13,fl=parts?(fr%2?1:0.7):1;   // הבהוב: כל קו חדש בהיר אחר
  const pts=skBolt(f.ax,f.ay,f.bx,f.by,sd,Z.seg,Z.jit),m=pts[Math.round(Z.seg*Z.branch)],dx=f.bx-f.ax,dy=f.by-f.ay,side=skRnd(sd,99)<0.5?-1:1,bl=0.35;
  // קו עבה בלי שקיפות (קו שקוף ועבה הוא הכי כבד לצייר), ומעליו צבע ולב לבן. הענף דק, רק צבע ולבן
  skPath(pts);for(const [w,c] of [[6,SKFX.shade],[3.5,f.col],[1.4,'#fff']]){ctx.globalAlpha=a*fl;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.stroke()}
  skPath(skBolt(m[0],m[1],m[0]+dx*bl-dy*bl*0.5*side,m[1]+dy*bl+dx*bl*0.5*side,sd+3,4,Z.jit*0.6));
  for(const [w,c] of [[2,f.col],[0.8,'#fff']]){ctx.globalAlpha=a*fl*0.9;ctx.strokeStyle=c;ctx.lineWidth=w;ctx.stroke()}
  ctx.globalAlpha=a*0.45;ctx.fillStyle=f.col;skCircle(f.bx,f.by,6+12*a);ctx.fill();
  ctx.beginPath();skStarPath(f.bx,f.by,5+9*a,4);skStarPath(f.ax,f.ay,3+5*a,4);ctx.globalAlpha=a;ctx.fillStyle='#fff';ctx.fill();
  if(!parts)return;
  const n=skTake(SKFX.parts.zap);ctx.beginPath();
  for(let i=0;i<n;i++){const an=skRnd(f.seed,i+5)*6.283,d=6+26*k*(0.5+skRnd(f.seed,i+6));ctx.moveTo(f.bx+Math.cos(an)*d,f.by+Math.sin(an)*d);ctx.lineTo(f.bx+Math.cos(an)*(d+5),f.by+Math.sin(an)*(d+5))}
  ctx.strokeStyle='#fff';ctx.lineWidth=1.4;ctx.stroke();
}

/* ---- הבזק קומבו: עיגול לבן, טבעת בצבע הקומבו וקרניים ---- */
function skfxCombo(f,k){
  const C_=SKFX.combo,a=1-k,r=C_.r*(0.3+0.9*skEase(k));
  ctx.globalAlpha=a*a*0.75;ctx.fillStyle='#fff';skCircle(f.x,f.y,r*0.55*(1-k*0.5));ctx.fill();
  skCircle(f.x,f.y,r);skStroke(2+4*a,f.col,a);
  for(const odd of [0,1]){ctx.beginPath();
    for(let i=odd;i<C_.rays;i+=2){const an=f.seed+i/C_.rays*6.283,r0=r*0.6,r1=r*(1.05+0.25*odd);ctx.moveTo(f.x+Math.cos(an)*r0,f.y+Math.sin(an)*r0);ctx.lineTo(f.x+Math.cos(an)*r1,f.y+Math.sin(an)*r1)}
    skStroke(odd?2:3.5,odd?'#fff':f.col,a)}
}

/* ---- מעל אויב: סימן ברור בתוך עיגול כהה (טיפה, פתית שלג, כוכבים). קפוא: גם קרום קרח סביבו ---- */
function skFlake(x,y,r){ctx.beginPath();
  for(let i=0;i<3;i++){const an=i*Math.PI/3,c=Math.cos(an)*r,s=Math.sin(an)*r;ctx.moveTo(x-c,y-s);ctx.lineTo(x+c,y+s);
    for(const q of [-1,1]){const mx=x+c*0.55*q,my=y+s*0.55*q,b=an+(q>0?0:Math.PI);
      ctx.moveTo(mx+Math.cos(b+2.4)*r*0.35,my+Math.sin(b+2.4)*r*0.35);ctx.lineTo(mx,my);ctx.lineTo(mx+Math.cos(b-2.4)*r*0.35,my+Math.sin(b-2.4)*r*0.35)}}
  ctx.strokeStyle='#fff';ctx.lineWidth=1.8;ctx.stroke()}
function skBadge(x,y,col){const M=SKFX.mark;ctx.globalAlpha=1;ctx.fillStyle=M.bg;skCircle(x,y,M.r);ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.stroke()}
function skfxMark(e){
  const M=SKFX.mark,y=e.y-e.r-16,K=SKILLS.combo;
  if(e.frozen>0){
    ctx.beginPath();for(let i=0;i<M.crust;i++){const an=i/M.crust*6.283,d=(e.r+6)*(0.9+0.2*skRnd(i,3)),px=e.x+Math.cos(an)*d,py=e.y+Math.sin(an)*d*0.9;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath();
    ctx.globalAlpha=0.28;ctx.fillStyle=K.freeze.col;ctx.fill();ctx.globalAlpha=0.9;ctx.strokeStyle=SKFX.frost.light;ctx.lineWidth=2;ctx.stroke();
    skBadge(e.x,y,K.freeze.col);skFlake(e.x,y,M.r*0.7);
  }else if(e.wet>0){skBadge(e.x,y,dtCol('water'));dtIcon(e.x,y,'water',12)}
  if(e.stun>0.3){const sp=RM?0:S.t*5;ctx.beginPath();
    for(let i=0;i<M.stars;i++){const an=sp+i*6.283/M.stars;skStarPath(e.x+Math.cos(an)*14,y-10+Math.sin(an)*4,5.5,5)}
    ctx.globalAlpha=1;ctx.strokeStyle=SKFX.shade;ctx.lineWidth=2.5;ctx.stroke();ctx.fillStyle=K.stun.col;ctx.fill()}
  ctx.globalAlpha=1;
}
