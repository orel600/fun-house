/* חיית המחמד: ניסוי של קפיצות ומעיכה בציור (ARI, 9.11.2026, מפרט ראשוני), כבוי כברירת מחדל. ?petx=1, או PETX.on=true תוך כדי משחק.
   רק מראה: מזיז ומועך את הגוף בתלת-ממד, ולא נוגע במיקום של החיה (S.pet), ולכן המעקב אחרי השחקן לא משתנה.
   - בתנועה: קפיצה כל period שניות, בגובה h מגובה הגוף. במגע עם הרצפה מעיכה (sy קטן, sx ו-sz גדלים), ובשיא מתיחה.
     נדנוד קטן לצדדים (roll) ובכיוון (yaw), באותו קצב.
   - בעמידה: נשימה (sy עולה ויורד לאט).
   - בין שני המצבים מעבר רך (blend), בלי קפיצה פתאומית. הפחתת תנועה: בלי קפיצות ובלי נשימה.
   מחיקה: הקובץ והשורה ב-index.html */
const PETX={
  on:/[?&]petx=1(&|$)/.test(location.search),
  period:0.45,h:0.12,                 // שניות לקפיצה, וגובה ביחס לגובה הגוף
  sq:{y:0.12,xz:0.09},                // מעיכה ומתיחה: sy=1-y*cos, sx=sz=1+xz*cos
  roll:0.1,yaw:0.12,                  // רדיאנים
  breathe:{amp:0.02,period:1.2},
  move:8,blend:0.15,                  // מהירות (פיקסלים לשנייה) שמעליה החיה "זזה", ושניות למעבר
  stat:{frames:0,hops:0,maxLift:0,minSy:9,maxSy:0}
};
(function(){
  if(typeof syncPet!=='function')return;
  const calm=()=>(typeof calmOn==='function'?calmOn():typeof RM!=='undefined'&&RM);
  const bp=syncPet;syncPet=function(dt){
    const r=bp.apply(this,arguments),a=R3D.pet,p=S.pet;
    if(!a||!p||!a.root.visible)return r;
    const t=R3D.tmpl[a.L.model],sc0=t?a.L.h/COSB()/t.userData.h:a.root.scale.x,st=a.px||(a.px={w:0,ph:0,bt:0,x:p.x,y:p.y});
    if(!PETX.on||calm()){if(st.on){st.on=0;a.root.scale.setScalar(sc0);a.root.rotation.z=0}st.x=p.x;st.y=p.y;return r}
    st.on=1;const d=dt>0?Math.hypot(p.x-st.x,p.y-st.y)/dt:0;st.x=p.x;st.y=p.y;
    const tgt=d>PETX.move?1:0;st.w+=Math.sign(tgt-st.w)*Math.min(Math.abs(tgt-st.w),dt/PETX.blend);
    if(st.w>0){const ph0=st.ph;st.ph+=dt/PETX.period;if(Math.floor(st.ph)>Math.floor(ph0))PETX.stat.hops++}
    st.bt+=dt;
    const w=st.w,c=Math.cos(st.ph*Math.PI*2),s=Math.sin(st.ph*Math.PI*2),H=sc0*(t?t.userData.h:1);
    const br=(1-w)*PETX.breathe.amp*Math.sin(st.bt/PETX.breathe.period*Math.PI*2);
    const sy=1-w*PETX.sq.y*c+br,sx=1+w*PETX.sq.xz*c,lift=w*PETX.h*H*(1-c)/2;
    a.root.scale.set(sc0*sx,sc0*sy,sc0*sx);a.root.position.y+=lift;
    a.root.rotation.z=w*PETX.roll*s;a.root.rotation.y+=w*PETX.yaw*s;
    const S_=PETX.stat;S_.frames++;S_.maxLift=Math.max(S_.maxLift,lift/H);S_.minSy=Math.min(S_.minSy,sy);S_.maxSy=Math.max(S_.maxSy,sy);
    return r};
})();
