/* משחקי השאול: כפתור התקיפה הרגילה, כמו ב-MLBB (אוראל, 8.11.2026). הכפתור הכי גדול בפינה הימנית, והסקילים מסביבו.
   - נגיעה: תוקפים את המטרה הכי חשובה בטווח (mbAutoTarget). אין אף אחד בטווח: כמה צעדים אל האויב הקרוב (step), אבל לא אל מתחת למגדל אויב.
   - גרירה מהכפתור אל אויב על המסך: נעילה. האויב מסומן בטבעת אדומה שפועמת, והתקיפה האוטומטית מעדיפה אותו כשהוא בטווח.
     הנעילה נגמרת כשהוא מת, כשהוא רחוק מ-lockK כפול הטווח, או בנעילה חדשה. שחרור על ✕ (אזור הביטול של moba-aim.js) מבטל.
   - רווח במקלדת = נגיעה. הטעינה של התקיפה (u.atkT מתוך A.cd) נראית על הכפתור כמו בסקילים (--cd).
   - התקיפה האוטומטית נשארת: הכפתור רק בוחר על מי ומקרב. התקיפה עצמה עוברת ב-mbAttack, ולכן כל החוקים (מגדל שמכה במי שתוקף גיבור) נשארים.
   חיבורים: הכפתור נבנה ב-mbUi, mbAtkTick ב-mbPlayer, mbAtkPick ב-mbAutoTarget, mbAtkDraw ב-mobaDraw, mbAtkHud ב-mobaHud (moba.js) */
const MBATK={
  lockK:1.5,       // הנעילה נגמרת כשהמטרה רחוקה מטווח התקיפה כפול זה
  step:0.6,        // נגיעה בלי אף אחד בטווח: כמה שניות הולכים אל האויב הקרוב
  seek:520,        // עד כמה רחוק מחפשים אויב ללכת אליו
  grab:46,         // גרירה: כמה קרוב (יחידות משחק, מעבר לרדיוס) האצבע צריכה להיות לאויב כדי לנעול אותו
  ring:{col:'#FF4D4D',pad:12,w:3,pulse:7,amp:0.18},   // הסימון על הנעול: צבע, מרחק מהרדיוס, עובי, קצב ועוצמת הפעימה
  col:'#E8D9B0'    // צבע הכפתור (לא סוג נזק: התקיפה של כל ערכה בסוג שלה, והכפתור משותף)
};
let mbAtkP=null;   // הגרירה עכשיו: {pid,sx,sy,on,cancel,t}

// הכפתור (נבנה ב-mbUi, בתוך #mbSk אחרי הסקילים)
const mbAtkBtn=()=>'<button class="skb mbskb mbatk ready" id="mbAtk" style="--dt:'+MBATK.col+'" aria-label="'+T('mb.atk')+'">'+mbSvg('attack','mbski')+'<i></i></button>';
function mbAtkInit(){
  const b=$('mbAtk');if(!b)return;mbAtkP=null;if(MB)MB.lock=null;
  b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();const u=mbMe();if(!u||u.dead||MB.over||mbAtkP)return;
    mbAtkP={pid:e.pointerId,sx:e.clientX,sy:e.clientY,on:false,cancel:false,t:null};try{b.setPointerCapture(e.pointerId)}catch(_){}});
}
// נקודה על המסך ← נקודה בעולם (הקנבס מיושר עם התלת-ממד, render.js)
function mbAtkWorld(cx,cy){const r=cvs.getBoundingClientRect();return{x:S.cam.x+((cx-r.left)/r.width-0.5)*W,y:S.cam.y+((cy-r.top)/r.height-0.5)*H}}
// אויב שאפשר לתקוף (כמו mbAutoTarget: חי, אפשר לפגוע בו, רואים אותו)
const mbAtkOk=(u,o)=>o&&!o.dead&&o.team!==u.team&&mbHittable(o)&&mbSeen(o,u.team)&&mbTgt(o);
// האויב מתחת לאצבע, או null
function mbAtkUnder(u,p){let best=null,bd=1e9;for(const o of MB.u){if(!mbAtkOk(u,o))continue;const d=Math.hypot(o.x-p.x,o.y-p.y)-o.r;if(d<MBATK.grab&&d<bd){bd=d;best=o}}return best}
addEventListener('pointermove',e=>{
  const A=mbAtkP;if(!A||e.pointerId!==A.pid||!S.mb||!MB)return;const u=mbMe();if(!u)return;
  if(!A.on&&Math.hypot(e.clientX-A.sx,e.clientY-A.sy)>=MBAIM.drag){A.on=true;const c=$('mbCancel');if(c)c.hidden=false;$('mbAtk').classList.add('aiming')}
  if(!A.on)return;
  A.t=mbAtkUnder(u,mbAtkWorld(e.clientX,e.clientY));
  const c=$('mbCancel');if(c){const r=c.getBoundingClientRect(),p=MBAIM.cancelPad,over=e.clientX>r.left-p&&e.clientX<r.right+p&&e.clientY>r.top-p&&e.clientY<r.bottom+p;
    if(over!==A.cancel){A.cancel=over;c.classList.toggle('hot',over);if(over)sfx('tap')}}
},true);
function mbAtkEnd(){if(!mbAtkP)return;mbAtkP=null;const c=$('mbCancel');if(c&&!mbAim){c.hidden=true;c.classList.remove('hot')}const b=$('mbAtk');if(b)b.classList.remove('aiming')}
addEventListener('pointerup',e=>{
  const A=mbAtkP;if(!A||e.pointerId!==A.pid)return;mbAtkEnd();
  if(!S.mb||!MB||MB.over||A.cancel)return;
  if(!A.on)return mbAtkTap();
  if(A.t){MB.lock=A.t;sfx('ui')}   // נעילה. גרירה בלי אויב מתחת לאצבע: כלום
},true);
addEventListener('pointercancel',e=>{if(mbAtkP&&e.pointerId===mbAtkP.pid)mbAtkEnd()},true);

// נגיעה (או רווח): בטווח יש מישהו, אז התקיפה האוטומטית כבר עליו. אין: הולכים אל הקרוב, לא אל מתחת למגדל אויב שעוד לא עומדים מתחתיו
function mbAtkTap(){
  const u=mbMe();if(!u||u.dead||MB.over)return;const A=MBKIT[u.kit].atk;
  const $b=$('mbAtk');if($b){$b.classList.remove('tap');void $b.offsetWidth;$b.classList.add('tap')}
  MB.atkTaps=(MB.atkTaps||0)+1;
  if(mbAutoTarget(u,A.range)){MB.atkGo=null;return}
  const under=(o,t)=>{const B=t.k==='base'?MOBA.base:MOBA.tower;return mbDist(o,t)<B.range+o.r};
  const towers=MB.u.filter(t=>(t.k==='tower'||t.k==='base')&&t.team!==u.team&&!t.dead);
  let best=null,bd=MBATK.seek;
  for(const o of MB.u){if(!mbAtkOk(u,o))continue;const d=mbDist(u,o)-o.r-u.r;if(d>=bd)continue;
    if(o.k!=='tower'&&o.k!=='base'&&towers.some(t=>under(o,t)&&!under(u,t)))continue;   // לא נכנסים אל מתחת למגדל בגלל נגיעה
    bd=d;best=o}
  MB.atkGo=best?{t:best,until:MB.t+MBATK.step}:null;
}
// כל פריים של השחקן (mbPlayer, לפני התקיפה): רווח, הצעדים אל המטרה, ותוקף הנעילה. moving: האגודל השמאלי זז, אז הוא קובע
function mbAtkTick(u,dt,moving){
  const sp=!!keys.Space;if(sp&&!MB.keys.sp)mbAtkTap();MB.keys.sp=sp;
  const A=MBKIT[u.kit].atk,L=MB.lock;
  if(L&&(!mbAtkOk(u,L)||mbDist(u,L)-L.r-u.r>A.range*MBATK.lockK))MB.lock=null;
  const g=MB.atkGo;
  if(g&&(moving||MB.t>g.until||!mbAtkOk(u,g.t)||mbAutoTarget(u,A.range)))MB.atkGo=null;
  else if(g&&!(u.st.stun>0||u.st.root>0||u.st.taunt>0))mbMove(u,g.t.x,g.t.y,dt,g.t.r+u.r+A.range*0.8);
}
// mbAutoTarget: הנעול קודם, כשהוא בטווח
function mbAtkPick(u,range){const L=u.me&&MB.lock;return L&&mbAtkOk(u,L)&&mbDist(u,L)-L.r-u.r<=range?L:null}

// הסימון (mobaDraw, בעולם): טבעת אדומה שפועמת מתחת לנעול, וטבעת דקה מתחת למי שהאצבע עליו בגרירה
function mbAtkDraw(){
  const R=MBATK.ring,L=MB.lock,A=mbAtkP;
  const ring=(o,a,w)=>{const r=(o.r+R.pad)*(1+R.amp*Math.sin(MB.t*R.pulse));ctx.globalAlpha=a;ctx.strokeStyle=R.col;ctx.lineWidth=w;ctx.beginPath();ctx.ellipse(o.x,o.y+2,r,r*0.45,0,0,7);ctx.stroke()};
  if(L&&!L.dead&&mbShow(L))ring(L,0.95,R.w);
  if(A&&A.on&&A.t&&A.t!==L&&!A.cancel)ring(A.t,0.6,R.w*0.6);
  ctx.globalAlpha=1;
}
// הטעינה על הכפתור (mobaHud)
function mbAtkHud(u){const b=$('mbAtk');if(!b)return;const A=MBKIT[u.kit].atk,v=Math.max(0,Math.min(1,u.atkT/A.cd)).toFixed(2);if(b.dataset.cd!==v){b.dataset.cd=v;b.style.setProperty('--cd',v)}}
