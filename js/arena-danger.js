/* רגע הסכנה של הבוס בזירה (MLBB גל 2.1, docs/concept/mlbb-fx-plan.md חלק 3, אוראל 8.11.2026).
   האזהרות עצמן (tg_* מהגיליונות) נשארות ב-arena-fx.js. כאן ארבעה דברים מעליהן, בצבע הסכנה (ה4: מג'נטה כמו בעולם, לא סוג נזק):
   - מילוי: הצורה של המתקפה (עיגול, קונוס, פס, נקודות זימון, מוקש) מתמלאת מהבוס החוצה. המילוי = הזמן שעבר מתוך הזמן עד הפגיעה,
     ומחושב מהשעונים האמיתיים של המתקפה (tl.t של האזהרה, ואחריה b.charge.t, w.t של גל ההדף, mn.t של מוקש), ולכן מגיע ל-100% בדיוק ברגע הפגיעה.
   - תקתוק שמאיץ: הקו החיצוני מהבהב ב-ticks (כל הבהוב בחצי מהזמן שנשאר). הצליל מחכה לסבב הצלילים (docs/concept/sound.md).
   - הבזק בוס: ברגע הפגיעה הבוס מבזיק לבן-מג'נטה. רק מראה, בלי עצירה חדשה (ה3).
   - סימני חריכה: גל הדף, הסתערות ומוקש משאירים כתם חרוך ברצפה. עד max בבת אחת (מאגר קבוע), נמוגים אחרי life שניות.
   "פחות אפקטים": המילוי והתקתוק נשארים (הם חלק מהאזהרה), בלי הבזק וחריכה. רק בזירה (skArena), לא בשאול.
   חיבורים מבחוץ: עוטף את bossUpdate (אחרי arena-fx.js), את drawDrops (מתחת לדמויות) ואת fxDraw (מעליהן). מחיקה: הקובץ והשורה ב-index.html */
const ARDG={
  on:true,
  col:'#FF3DD8',            // צבע הסכנה בכל המשחק (#521 בעולם)
  fill:0.22,line:3,lineA:0.6,  // שקיפות המילוי, עובי ושקיפות הקו החיצוני
  ticks:[0.5,0.75,0.875,0.94], // מתי מהבהב (חלק מהזמן עד הפגיעה): כל אחד בחצי מהזמן שנשאר
  tickT:0.1,tickW:3,         // כמה זמן הבהוב, וכמה הקו מתעבה בו
  hold:0.15,                 // אחרי הפגיעה: הצורה המלאה נשארת עוד רגע ונמוגה
  // הצורות (יחידות משחק): רדיוס לכל סוג, אורך וחצי זווית לקונוס, אורך ורוחב לפס, רדיוס לנקודת זימון ולמוקש (כמו העיגול ב-render.js)
  shape:{ring:110,spiral:90,shock:270,cone:{len:200,half:0.5},charge:{len:680*0.45},spawn:30,mine:58},
  flash:{t:0.18,k:1.7,a:0.75},  // הבזק הבוס: שניות, רדיוס ביחס לבוס, שקיפות
  scorch:{max:6,life:4,fade:1,a:0.55,shock:120,charge:70,mine:50},   // כמה בבת אחת, כמה שניות, דעיכה בסוף, שקיפות, וגודל לכל סוג
  stat:{fills:0,ticks:0,flash:0,scorch:0,hitP:{}}   // לבוט: hitP = המילוי ברגע הפגיעה לכל סוג
};
const ARDGS={b:new Map(),sc:[],mn:[],f:-1,img:null};
const ardgOn=()=>ARDG.on&&typeof skArena==='function'&&skArena()&&!S.mb&&S.mode==='play';

/* ---- מעקב: כל פריים אחרי bossUpdate ---- */
// st: {k,tl,ext,ph,o,p,tk,a}. ph: 'tele' (האזהרה רצה), 'after' (המתקפה התחילה וממתינה לפגיעה: הסתערות, גל הדף)
// הפגיעה: hitP = המילוי בפריים האחרון לפניה (לבוט: קרוב ל-1 עד פריים אחד), ואז מלא לגמרי ל-hold שניות ונמוג
function ardgHit(b,st){
  const s=ARDG.stat;s.hitP[st.k]=st.p;st.p=1;st.ph='done';st.d0=S.t;b.ardgFl=S.t;s.flash++;
  if(st.k==='shock')ardgScorch(b.x,b.y,ARDG.scorch.shock);
  if(st.k==='charge')ardgScorch(b.x,b.y,ARDG.scorch.charge);
}
function ardgTick(st,p){
  const T=ARDG.ticks;while(st.tn<T.length&&p>=T[st.tn]){st.tn++;st.tk=S.t;ARDG.stat.ticks++}
  st.p=p;
}
function ardgTrack(b){
  const tl=b.arTele;let st=ARDGS.b.get(b);
  if(tl&&(!st||st.tl!==tl)){const D=ARFX.tele[tl.k];st={k:tl.k,tl,ext:D.extra||0,ph:'tele',o:null,p:0,tn:0,tk:-9,a:0};ARDGS.b.set(b,st);ARDG.stat.fills++}
  if(!st)return;
  if(st.ph==='done'){if(S.t-st.d0>=ARDG.hold)ARDGS.b.delete(b);return}
  if(st.ph==='tele'){
    if(tl===st.tl){st.a=Math.atan2(P.y-b.y,P.x-b.x);ardgTick(st,tl.t/(tl.max+st.ext));return}
    // האזהרה נגמרה בפריים הזה: doPattern רץ
    const max=st.tl.max;
    if(st.k==='charge'&&b.charge&&b.charge.stage===0){st.ph='after';st.o=b.charge;st.max=max;st.a=b.charge.a}
    else if(st.k==='shock'&&waves.length&&waves[waves.length-1].t<0){st.ph='after';st.o=waves[waves.length-1];st.max=max}
    else{if(st.k==='charge'||st.k==='shock')ARDGS.b.delete(b);else ardgHit(b,st);return}
  }
  // אחרי: השעון של המתקפה עצמה
  if(st.k==='charge'){const c=st.o;if(b.charge!==c||c.stage>0||c.t<=0)return ardgHit(b,st);ardgTick(st,(st.max+st.ext-c.t)/(st.max+st.ext))}
  else{const w=st.o;if(w.t>=0||!waves.includes(w))return ardgHit(b,st);ardgTick(st,(st.max+st.ext+w.t)/(st.max+st.ext))}
}
// מוקשים: אין אזהרה של זמן (הם מחכים בעצמם). מוקש שנעלם כשהשעון שלו נגמר התפוצץ: חריכה
function ardgMines(){
  const L=ARDGS.mn;
  for(const m of L)if(!mines.includes(m)&&m.t<=0){ARDG.stat.hitP.mines=m.ardgP;ardgScorch(m.x,m.y,ARDG.scorch.mine)}
  L.length=0;for(const m of mines){if(m.ardgT0==null)m.ardgT0=m.t;m.ardgP=1-Math.max(0,m.t)/m.ardgT0;L.push(m)}
}
{const old=bossUpdate;bossUpdate=function(b,dt){
  const r=old.apply(this,arguments);
  if(ardgOn()&&!b.dead){ardgTrack(b);if(ARDGS.f!==S.t){ARDGS.f=S.t;ardgMines()}}
  return r}}
{const old=bossDown;bossDown=function(b){ARDGS.b.delete(b);return old.apply(this,arguments)}}

/* ---- חריכה: מאגר קבוע, הישן ביותר מתחלף ---- */
function ardgScorch(x,y,r){
  if(typeof fxLess==='function'&&fxLess())return;
  const C=ARDG.scorch,L=ARDGS.sc;let s;
  if(L.length<C.max){s={};L.push(s)}else{s=L[0];for(const o of L)if(o.t<s.t)s=o}
  s.x=x;s.y=y;s.r=r;s.t=S.t;s.rot=Math.random()*6.28;ARDG.stat.scorch++;
}
// הכתם מצויר פעם אחת לקנבס קטן, ובכל פריים רק drawImage
function ardgScorchImg(){
  if(ARDGS.img)return ARDGS.img;
  const c=document.createElement('canvas'),n=128;c.width=c.height=n;const g=c.getContext('2d');
  const gr=g.createRadialGradient(n/2,n/2,4,n/2,n/2,n/2);gr.addColorStop(0,'rgba(18,10,8,0.95)');gr.addColorStop(0.55,'rgba(30,16,12,0.7)');gr.addColorStop(1,'rgba(30,16,12,0)');
  g.fillStyle=gr;g.beginPath();g.arc(n/2,n/2,n/2,0,7);g.fill();
  g.strokeStyle='rgba(8,4,4,0.8)';g.lineWidth=2;g.beginPath();
  for(let i=0;i<7;i++){const a=i/7*6.28+0.3*Math.sin(i*2.1),r1=n*0.12,r2=n*(0.32+0.12*((i*37)%5)/5);g.moveTo(n/2+Math.cos(a)*r1,n/2+Math.sin(a)*r1);g.lineTo(n/2+Math.cos(a+0.15)*r2,n/2+Math.sin(a+0.15)*r2)}
  g.stroke();return ARDGS.img=c;
}

/* ---- ציור ---- */
function ardgShape(b,st){
  const S_=ARDG.shape,p=Math.min(1,st.p),k=st.k;
  const circ=(x,y,R)=>{ctx.beginPath();ctx.arc(x,y,R,0,7)};
  const both=(path,fillPath)=>{ctx.globalAlpha=ARDG.fill*fade;fillPath();ctx.fill();ctx.globalAlpha=(ARDG.lineA+(1-ARDG.lineA)*tk)*fade;ctx.lineWidth=ARDG.line+ARDG.tickW*tk;path();ctx.stroke()};
  const tk=Math.max(0,1-(S.t-st.tk)/ARDG.tickT),fade=st.ph==='done'?1-(S.t-st.d0)/ARDG.hold:1;
  if(k==='aimed'){const C=S_.cone,a=st.a;
    both(()=>{ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.arc(b.x,b.y,C.len,a-C.half,a+C.half);ctx.closePath()},
         ()=>{ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.arc(b.x,b.y,C.len*p,a-C.half,a+C.half);ctx.closePath()})}
  else if(k==='charge'){const L=S_.charge.len+b.r,w=b.r,a=st.a;ctx.save();ctx.translate(b.x,b.y);ctx.rotate(a);
    both(()=>{ctx.beginPath();ctx.rect(0,-w,L,2*w)},()=>{ctx.beginPath();ctx.rect(0,-w,L*p,2*w)});ctx.restore()}
  else if(k==='shields'||k==='wisps'){const n=2+b.phase;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,x=b.x+Math.cos(a)*60,y=b.y+Math.sin(a)*60;both(()=>circ(x,y,S_.spawn),()=>circ(x,y,S_.spawn*p))}}
  else{const R=k==='shock'?S_.shock:(b.r+(S_[k]||S_.ring));both(()=>circ(b.x,b.y,R),()=>circ(b.x,b.y,R*p))}
}
// מתחת לדמויות: חריכה, ואז המילוי
function ardgDrawUnder(){
  const L=ARDGS.sc,C=ARDG.scorch;let live=false;
  if(L.length){const im=ardgScorchImg();
    for(const s of L){const age=S.t-s.t;if(age<0||age>=C.life)continue;live=true;
      ctx.globalAlpha=C.a*Math.min(1,(C.life-age)/C.fade);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.rot);ctx.drawImage(im,-s.r,-s.r,2*s.r,2*s.r);ctx.restore()}
    if(!live)L.length=0}
  if(!ardgOn())return void(ctx.globalAlpha=1);
  ctx.save();ctx.fillStyle=ctx.strokeStyle=ARDG.col;
  for(const [b,st] of ARDGS.b)if(!b.dead)ardgShape(b,st);
  if(mines.length){const R=ARDG.shape.mine;for(const m of mines){const p=1-Math.max(0,m.t)/(m.ardgT0||1.3);
    ctx.globalAlpha=ARDG.fill;ctx.beginPath();ctx.arc(m.x,m.y,R*Math.min(1,p),0,7);ctx.fill()}}
  ctx.restore();ctx.globalAlpha=1;
}
// מעל הדמויות: הבזק הבוס
function ardgDrawOver(){
  if(!ardgOn()||(typeof fxLess==='function'&&fxLess()))return;
  const F=ARDG.flash;
  for(const b of enemies){if(!b.isBoss||b.dead||b.ardgFl==null)continue;const age=S.t-b.ardgFl;if(age<0||age>=F.t)continue;
    const k=1-age/F.t;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=F.a*k;
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(b.x,b.y,b.r*(1+0.2*(1-k)),0,7);ctx.fill();
    ctx.globalAlpha=F.a*k*0.6;ctx.fillStyle=ARDG.col;ctx.beginPath();ctx.arc(b.x,b.y,b.r*F.k,0,7);ctx.fill();ctx.restore()}
}
(function(){
  if(typeof drawDrops==='function'){const o=drawDrops;drawDrops=function(){if(typeof skArena==='function'&&skArena()&&!S.mb)ardgDrawUnder();return o.apply(this,arguments)}}
  if(typeof fxDraw==='function'){const o=fxDraw;fxDraw=function(){ardgDrawOver();return o.apply(this,arguments)}}
})();
