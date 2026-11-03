/* משחקי השאול: תנועה שמרגישה טוב (אוראל, 3.11.2026: "התנועתיות של השחקנים מאוד מוזרה"). התוכנית: docs/moba.md
   מה היה מוזר, ונמדד בבוט: הגיבור הסתובב 180° בפריים אחד, חייל שעמד בדרך האט את הגיבור ב-30%, והבוטים עברו בין "רץ" ל"עומד" כ-80 פעם ב-20 שניות (האנימציה ריצדה).
   כאן: (1) סיבוב מהיר אבל רך: u.face הוא לאן שרוצים להסתכל, ו-u.rot הוא מה שמצויר. (2) גיבור עובר דרך חיילים, והם זזים הצידה.
   גיבורים נדחפים זה מזה בעדינות, במהירות מוגבלת, בלי קפיצות. (3) "זז" ומהירות האנימציה נמדדים מהתנועה האמיתית, עם השהיה קטנה, בלי ריצוד.
   מתחבר ב-moba.js בשורה אחת (mbFeel במקום ההפרדה הישנה), ובתלת-ממד עוטף את syncEnemy ו-syncPlayer מבחוץ, בלי לגעת ב-render3d.js */
const MBMOVE={
  turn:{k:12,min:6},        // סיבוב: 12 מהפער בשנייה, ולפחות 6 רדיאנים בשנייה. חצי סיבוב לוקח כ-0.2 שניות
  sep:{hero:0.8,minion:0.9,rate:140,yield:260},   // דחיפה בין יחידות: חלק מסכום הרדיוסים שבו נוגעים, כמה פיקסלים בשנייה לכל היותר, וכמה מהר חייל מפנה דרך לגיבור
  heroThroughMinion:true,   // גיבור לא נעצר בחייל (כמו ב-MLBB): החייל זז הצידה
  arrive:0.3,               // mbMove: מתחילים להאט כשנשארו 0.3 שניות ליעד
  creep:14,                 // מתחת למהירות הזאת (פיקסלים בשנייה) הדמות לא "רצה"
  still:0.15,               // כמה שניות בלי תנועה עד שהדמות "עומדת" (בלי זה האנימציה מהבהבת)
  ema:10,                   // כמה מהר המהירות שמוצגת עוקבת אחרי האמיתית
  run:165,                  // באיזו מהירות אנימציית הריצה במהירות 1 (כמו בזירה, render3d.js)
  anim:{min:0.6,max:1.6},
  atk:{tank:'Melee_2H_Attack_Chop',warrior:'Melee_1H_Attack_Slice_Horizontal',hunter:'Ranged_Bow_Release',mage:'Ranged_Magic_Shoot'},   // תקיפה של בוט בתלת-ממד
  minIdle:'Idle_Combat',
};
const mbAng=a=>Math.atan2(Math.sin(a),Math.cos(a));
const mbRot=u=>u.rot??u.face;
const mbMoving=u=>!u.dead&&(u.mvT||0)>0;
// הפרדה: מי דוחף את מי, וכמה. גיבור מול חייל: רק החייל זז. השאר: שניהם, במהירות מוגבלת
function mbSeparate(mob,dt){
  const C=MBMOVE.sep;
  for(let i=0;i<mob.length;i++)for(let j=i+1;j<mob.length;j++){const a=mob[i],b=mob[j],dx=b.x-a.x,dy=b.y-a.y;
    const hm=a.k!==b.k,rr=(a.r+b.r)*(hm||a.k==='minion'?C.minion:C.hero);
    if(Math.abs(dx)>rr||Math.abs(dy)>rr)continue;const d=Math.hypot(dx,dy);if(d>=rr)continue;
    const ux=d>0.01?dx/d:Math.cos(a.id),uy=d>0.01?dy/d:Math.sin(a.id),over=rr-d;
    if(hm&&MBMOVE.heroThroughMinion){const m=a.k==='minion'?a:b,s=m===a?-1:1,p=Math.min(over,C.yield*dt);mbStep(m,s*ux*p,s*uy*p);continue}
    const p=Math.min(over/2,C.rate*dt);mbStep(a,-ux*p,-uy*p);mbStep(b,ux*p,uy*p)}
}
// אחרי שכולם זזו: סיבוב רך, ומהירות אמיתית בשביל האנימציה
function mbFeel(M,dt){
  const mob=M.u.filter(o=>!o.dead&&(o.k==='hero'||o.k==='minion'));
  mbSeparate(mob,dt);
  const T=MBMOVE.turn;
  for(const u of mob){
    if(u.px==null){u.px=u.x;u.py=u.y;u.rot=u.face;u.vs=0}
    const step=Math.hypot(u.x-u.px,u.y-u.py);u.px=u.x;u.py=u.y;
    u.vs+=(step/Math.max(dt,1e-3)-u.vs)*Math.min(1,MBMOVE.ema*dt);
    u.mvT=u.moving?MBMOVE.still:Math.max(0,(u.mvT||0)-dt);
    if(mbMoving(u))u.ph+=step*0.07;
    const d=mbAng(u.face-u.rot),r=Math.max(T.min,Math.abs(d)*T.k)*dt;u.rot=Math.abs(d)<=r?u.face:mbAng(u.rot+Math.sign(d)*r);
  }
}
// גיבור שחזר לחיים מופיע בבסיס: בלי סיבוב ובלי "ריצה" מהמקום שבו נפל
function mbFeelReset(u){u.px=u.x;u.py=u.y;u.rot=u.face;u.vs=0;u.mvT=0}
const mbAnimK=u=>Math.max(MBMOVE.anim.min,Math.min(MBMOVE.anim.max,(u.vs||0)/(u.k==='minion'?u.speed||80:MBMOVE.run)));

/* ---- תלת-ממד: הגיבורים והחיילים של המוד, במקום החישוב של render3d (שמסובב לפי התזוזה בפריים, ולכן כל דחיפה סובבה) ---- */
function mb3dUnit(e,dt){
  let a=R3D.actors.get(e);const L=lookOf(e);if(!L)return;
  if(!a){a=makeActor(L);R3D.actors.set(e,a);a.root.scale.setScalar(L.h/COSB()/R3D.tmpl[L.model].userData.h);a.sc0=a.root.scale.x;
    if(L.anim.spawn&&!R3D.shown.has(e))once(a,L.anim.spawn,0.45);R3D.shown.add(e);a.prev={x:e.x,y:e.y,atk:0}}
  a.seen=R3D.frame;
  const one=a.one&&a.one.isRunning()?a.one.getClip().name:'',spawn=one===L.anim.spawn;
  // בוט גיבור תוקף: תנועת תקיפה בפלג הגוף העליון, כך שהרגליים ממשיכות לרוץ
  const atk=e.k==='hero'&&MBMOVE.atk[e.kit];
  if(atk&&e.atkT>a.prev.atk+0.05&&!spawn){const up=R3D.clips[atk+'@up']?atk+'@up':atk;if(R3D.clips[up])once(a,up,Math.min(0.45,MBKIT[e.kit].atk.cd*0.8))}
  a.prev.atk=e.atkT;
  if(!spawn){const mv=mbMoving(e),idle=e.k==='hero'?L.anim.idle:R3D.clips[MBMOVE.minIdle]?MBMOVE.minIdle:null,busy=a.one&&a.one.isRunning()&&!spawn;
    if(mv||!idle)loop(a,L.anim.run+(busy&&R3D.clips[L.anim.run+'@low']?'@low':''),mv?mbAnimK(e):MBMOVE.anim.min);
    else loop(a,idle+(busy&&R3D.clips[idle+'@low']?'@low':''),1)}
  place(a,e.x,e.y,L.foot,null);const r=mbRot(e);a.root.rotation.y=yawOf(Math.cos(r),Math.sin(r));
  setFlash(a,e.flash>0?0.9:0,0xffffff);
  if(a.sc0&&typeof juiceSquash==='function'){const q=juiceSquash(e);a.root.scale.set(a.sc0*(1+q),a.sc0*(1-q),a.sc0*(1+q))}
  a.mixer.update(dt);a.prev.x=e.x;a.prev.y=e.y;
  mark('shadow',a.root.position.x,a.root.position.z,e.r*1.15);
}
(function(){
  if(typeof syncEnemy!=='function')return;
  const base=syncEnemy;window.syncEnemy=function(e,dt){if(S.mb&&e&&(e.k==='hero'||e.k==='minion'))return mb3dUnit(e,dt);return base(e,dt)};
  // השחקן: הגוף מסתובב לפי u.rot (moba.js שם אותו ב-P.face), והריצה במהירות האמיתית. P.speed משתנה רק לרגע הציור
  const bp=syncPlayer;window.syncPlayer=function(dt){const u=S.mb&&MB&&MB.me;if(!u)return bp(dt);const sp=P.speed;P.speed=mbAnimK(u)*MBMOVE.run;try{return bp(dt)}finally{P.speed=sp}};
})();
