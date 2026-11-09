/* משחקי השאול: התקיפה הרגילה של הגיבור בתלת-ממד (חבילת הבוקר של אוראל, 9.11.2026, משימה 1: הטנק).
   רק מראה. הנזק, ההאטה, הזינוק והזמנים נשארים ב-mbAttack (moba.js) וב-mbLunge (moba-kits.js) בדיוק כמו היום.
   המכה מתנגנת באותו פריים שבו הנזק נוחת: u.atkT קופץ ל-cd באותו פריים (moba.js), ושם היא מתחילה. אף פעם לא מעכבת או מזיזה אותו.
   שלושה שלבים, לפי ה-storyboard:
   - עמידה מוכנה (ready): בין מכות, כשעומדים, הגוף כפוף והנשק למעלה (Melee_2H_Idle). קוסמטי: לפי זמן מאז המכה, לא חוסם כלום.
   - מכה: Melee_2H_Attack_Chop רק בחלק היורד (from עד to), מהר (dur), עצירה קשה (timeScale 0) וקצת שקט (settle), בלי ריחוף.
   - התאוששות: נמוג חזרה לעמידה המוכנה, לאורך מה שנשאר מהטעינה (recover, בין min ל-max).
   זינוק: הריצה ממשיכה, והמכה מתנגנת בנחיתה (שם mbAttack מכה). בזמן הזינוק אין עמידה מוכנה.
   המכה בפלג הגוף העליון (@up), כך שהרגליים לא נעצרות. אבק קטן בנקודת המכה (בלי "פחות אפקטים", ורק במקום שהקבוצה רואה).
   חיבור מבחוץ: עוטף את mb3dUnit (moba-move.js, הבוטים) ואת syncPlayer (השחקן). מכבה את התקיפה הגנרית של moba-move לערכות שכאן.
   ערכה בלי שורה ב-MBATK3D.kit נשארת כמו היום. מחיקה: הקובץ והשורה ב-index.html */
const MBATK3D={
  on:true,
  kit:{
    tank:{ready:'Melee_2H_Idle',hit:'Melee_2H_Attack_Chop',
      from:0.42,to:0.66,     // החלק היורד של הקליפ (מהשיא עד המגע)
      dur:0.18,              // כמה שניות המכה עצמה (FOEATK3D.fast: 0.15-0.22)
      settle:0.06,           // עצירה קשה במגע, לפני ההתאוששות
      recover:{min:0.22,max:1},   // חזרה לעמידה המוכנה: מה שנשאר מהטעינה, בגבולות האלה
      keep:1,                // כמה שניות אחרי הטעינה עוד עומדים מוכנים (ואז חוזרים לעמידה הרגילה)
      puff:{fx:'hit_earth',size:58,ahead:20}}   // אבק במגע: בצבע סוג הנזק של הטנק (אדמה, חום). step_dust יוצא ירקרק: גודל, וכמה לפני הגוף (מעבר לרדיוס)
  },
  sound:{tank:'imp_hammer'},   // צליל המגע, באותו פריים של הנזק (גם בדו-ממד). רק כשהמכה על המסך, או שזה אתה
  stat:{strikes:0,puffs:0,ready:0,sounds:0}
};
const mbAtk3dCfg=u=>MBATK3D.on&&u&&u.k==='hero'&&MBATK3D.kit[u.kit]||null;
// עומד מוכן: אחרי מכה, עד keep שניות אחרי שהטעינה נגמרה, כשלא זזים ולא מזנקים
const mbAtk3dReady=(u,C)=>!u.dead&&!mbMoving(u)&&!u.st.dash&&u.atk3dT!=null&&MB.t-u.atk3dT<MBKIT[u.kit].atk.cd+C.keep;
// כל פריים, לפני שה-mixer מתקדם: מכה חדשה, עצירה במגע, והתאוששות. a: השחקן או הבוט
function mbAtk3dTick(u,a,C,dt){
  const st=a.mbA||(a.mbA={atk:u.atkT||0,x:null,ph:'',t:0});
  if((u.atkT||0)>st.atk+0.05&&R3D.clips[C.hit+'@up']){   // הנזק נחת בפריים הזה (moba.js)
    u.atk3dT=MB.t;once(a,C.hit+'@up',C.dur,true,C.from);
    const x=act(a,C.hit+'@up'),D=x.getClip().duration;x.timeScale=D*(C.to-C.from)/C.dur;
    st.x=x;st.stop=D*C.to;st.ph='hit';st.t=0;MBATK3D.stat.strikes++;mbAtk3dPuff(u,C);
  }
  st.atk=u.atkT||0;
  if(st.ph==='hit'&&st.x&&st.x.time>=st.stop){st.x.time=st.stop;st.x.timeScale=0;st.ph='settle';st.t=0}   // עצירה קשה, בלי להמשיך את הקליפ
  else if(st.ph==='settle'){st.t+=dt;if(st.t>=C.settle){const R=C.recover;st.x.fadeOut(Math.max(R.min,Math.min(R.max,u.atkT||0)));st.ph=''}}
}
function mbAtk3dPuff(u,C){
  const P_=C.puff;if(!P_||typeof fxPlay!=='function'||(typeof fxLess==='function'&&fxLess()))return;
  const r=mbRot(u),x=u.x+Math.cos(r)*(u.r+P_.ahead),y=u.y+Math.sin(r)*(u.r+P_.ahead);
  if(typeof mbfxOn==='function'&&!mbfxOn(x,y))return;   // בערפל: לא מסגירים
  if(fxPlay(P_.fx,x,y,{size:P_.size}))MBATK3D.stat.puffs++;
}
// עמידה מוכנה: מחליפים לרגע את העמידה של הדמות (L.anim.idle) בזמן שהיא מצוירת, ומחזירים מיד אחרי
function mbAtk3dWith(L,u,C,fn){
  if(!L||!L.anim||!mbAtk3dReady(u,C)||!R3D.clips[C.ready])return fn();
  const an=L.anim;L.anim=Object.assign({},an,{idle:C.ready});MBATK3D.stat.ready++;
  try{return fn()}finally{L.anim=an}
}
// הצליל: עוטף את mbAttack (moba.js). הנזק כבר נחת כשהוא חוזר, ולכן הצליל באותו פריים. לא נוגע במה שהוא מחזיר
(function(){
  if(typeof mbAttack!=='function')return;
  const ba=mbAttack;mbAttack=function(u){const t0=u&&u.atkT,r=ba.apply(this,arguments);
    const id=u&&u.k==='hero'&&MBATK3D.on&&MBATK3D.sound[u.kit];
    if(id&&(u.atkT||0)>(t0||0)+0.05&&(u.me||typeof mbfxOn!=='function'||mbfxOn(u.x,u.y))){sfx(id);MBATK3D.stat.sounds++}
    return r};
})();
(function(){
  if(typeof mb3dUnit!=='function'||typeof syncPlayer!=='function')return;
  for(const k in MBATK3D.kit)if(MBMOVE.atk[k])MBMOVE.atk[k]=null;   // התקיפה הגנרית של moba-move.js: לערכות שכאן המכה היא שלנו
  const bu=mb3dUnit;mb3dUnit=function(e,dt){
    const C=e&&e.k==='hero'&&mbAtk3dCfg(e);if(!C)return bu.apply(this,arguments);
    const a=R3D.actors.get(e);if(a)mbAtk3dTick(e,a,C,dt);
    return mbAtk3dWith(lookOf(e),e,C,()=>bu.call(this,e,dt));
  };
  const bp=syncPlayer;window.syncPlayer=function(dt){
    const u=S.mb&&MB&&MB.me,C=mbAtk3dCfg(u);if(!C||!R3D.player)return bp.apply(this,arguments);
    mbAtk3dTick(u,R3D.player,C,dt);
    {const st=R3D.player.st;if(st){st.anim=P.sw.anim;st.gt=P.gn.t}}   // המכה כאן היא שלנו: בלי התנופה הרגילה של syncPlayer, שהחליפה את המכה של הטנק באמצע
    return mbAtk3dWith(heroLook(),u,C,()=>bp.call(this,dt));
  };
})();
