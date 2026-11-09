/* משחקי השאול: הגוף של הטנק ב-s1, הסדן (חבילת הבוקר של אוראל, 9.11.2026, משימה 2). רק מראה.
   הקפיצה, הזמנים, הנזק, ההלם ושדה ההאטה נשארים ב-moba-kits.js בדיוק כמו היום: הקפיצה מתחילה ברגע ההטלה ונוחתת כש-u.st.dash נגמר.
   מה רואים:
   - המראה: כיווץ קצר של הגוף (squash) ברגע הקפיצה, כי אין זמן הכנה במשחק.
   - באוויר: תנוחת קפיצה (Jump_Idle) במקום ריצה, והגוף עולה ויורד בקשת (h), לאורך כל זמן הזינוק.
   - נחיתה: מכת הפטיש (Melee_2H_Attack_Chop, רק החלק היורד) נעצרת במגע בדיוק בפריים של הנזק, כיווץ של 14%, ואז חזרה לעמידה.
   חל על הבוטים (mb3dUnit) ועל השחקן (syncPlayer). "הפחתת תנועה": בלי קשת ובלי כיווץ. כיבוי: MBANVIL.on=false. מחיקה: הקובץ והשורה ב-index.html */
const MBANVIL={
  on:true,kit:'tank',skill:'anvil',
  h:60,                    // כמה גבוה באוויר, ביחידות משחק
  air:'Jump_Idle',         // התנוחה באוויר
  squash:{k:0.14,t:0.12,up:0.08},   // כיווץ בנחיתה (k, זמן), וכיווץ קטן יותר בקפיצה (up)
  land:{clip:'Melee_2H_Attack_Chop',from:0.42,to:0.66,dur:0.12,settle:0.08,recover:0.3},
  stat:{jumps:0,lands:0}
};
// u: היחידה, a: הדמות בתלת-ממד, L: המראה שלה. נקרא לפני הציור (להחליף תנוחה) ואחריו (גובה וכיווץ)
function mbAnvilPre(u,a,L){
  const st=a.anv||(a.anv={air:false,t0:0,left0:1,sq:0,sqK:0,x:null,ph:''});
  const d=u.st&&u.st.dash,jump=!!(d&&d.jump&&u.kit===MBANVIL.kit);
  if(jump&&!st.air){st.air=true;st.left0=Math.max(1,d.left);st.sq=MBANVIL.squash.t;st.sqK=MBANVIL.squash.up;MBANVIL.stat.jumps++}
  else if(!jump&&st.air){st.air=false;MBANVIL.stat.lands++;st.sq=MBANVIL.squash.t;st.sqK=MBANVIL.squash.k;
    const C=MBANVIL.land,n=C.clip+'@up';if(R3D.clips[n]){once(a,n,C.dur,true,C.from);const x=act(a,n),D=x.getClip().duration;x.timeScale=D*(C.to-C.from)/C.dur;st.x=x;st.stop=D*C.to;st.ph='hit';st.t=0}}
  st.p=jump?1-Math.max(0,d.left)/st.left0:0;
  // באוויר: התנוחה של הקפיצה במקום ריצה ועמידה (מוחלף רק בזמן הציור, כמו העמידה המוכנה ב-mb-atk3d.js)
  if(st.air&&L&&L.anim&&R3D.clips[MBANVIL.air]){const an=L.anim;L.anim=Object.assign({},an,{run:MBANVIL.air,idle:MBANVIL.air});return an}
  return null;
}
function mbAnvilPost(u,a,dt){
  const st=a.anv;if(!st)return;const calm=typeof calmOn==='function'?calmOn():typeof RM!=='undefined'&&RM;
  if(st.air&&!calm)a.root.position.y+=Math.sin(Math.PI*Math.min(1,st.p))*MBANVIL.h/COS();
  // עצירה קשה במגע, ואז חזרה
  if(st.ph==='hit'&&st.x&&st.x.time>=st.stop){st.x.time=st.stop;st.x.timeScale=0;st.ph='settle';st.t=0}
  else if(st.ph==='settle'){st.t+=dt;if(st.t>=MBANVIL.land.settle){st.x.fadeOut(MBANVIL.land.recover);st.ph=''}}
  // כיווץ: מהגודל של עכשיו (הבוט מקבל גודל בכל פריים מ-mb3dUnit, השחקן לא), ומוחזר בסוף
  if(st.sq>0&&!calm){st.sq-=dt;if(st.s0==null)st.s0=a.root.scale.y;const q=st.sqK*Math.max(0,st.sq)/MBANVIL.squash.t,s=st.s0;a.root.scale.set(s*(1+q*0.6),s*(1-q),s*(1+q*0.6))}
  else if(st.s0!=null){a.root.scale.setScalar(st.s0);st.s0=null;st.sq=0}
}
(function(){
  const on=u=>MBANVIL.on&&u&&u.k==='hero'&&u.kit===MBANVIL.kit;
  if(typeof mb3dUnit==='function'){const bu=mb3dUnit;mb3dUnit=function(e,dt){
    if(!on(e))return bu.apply(this,arguments);let a=R3D.actors.get(e),L=a&&a.L,an=null;
    if(a)an=mbAnvilPre(e,a,L);try{return bu.apply(this,arguments)}finally{if(an)L.anim=an;a=R3D.actors.get(e);if(a)mbAnvilPost(e,a,dt)}}}
  if(typeof syncPlayer==='function'){const bp=syncPlayer;window.syncPlayer=function(dt){
    const u=S.mb&&MB&&MB.me;if(!on(u)||!R3D.player)return bp.apply(this,arguments);const a=R3D.player,L=heroLook();
    const an=mbAnvilPre(u,a,L);try{return bp.apply(this,arguments)}finally{if(an)L.anim=an;if(R3D.player)mbAnvilPost(u,R3D.player,dt)}}}
})();
