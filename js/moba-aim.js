/* משחקי השאול: כיוון וביטול סקילים כמו ב-MLBB (אוראל, 3.11.2026: "הסקילים לא ניתנים לכיוון או לביטול")
   - נגיעה קצרה בכפתור: הטלה מהירה, עם כיוון אוטומטי (mbPress ב-moba.js, כמו קודם).
   - גרירה מהכפתור: כיוון. על הרצפה מופיע סימון לפי kind של הסקיל (MBKIT ב-moba-kits.js), ושחרור מטיל לשם.
   - בזמן הכיוון מופיע ✕ "ביטול" מעל הכפתורים. שחרור עליו מבטל, והסקיל לא נכנס לטעינה.
   כל אצבע לפי pointerId, ולכן הג'ויסטיק השמאלי ממשיך לעבוד בזמן שהימני מכוון.
   הסימון לא תלוי בסקיל מסוים: רק ב-kind וב-range/r/w/dist. kind לא מוכר: אזור אם יש לו r, אחרת קו */
const MBAIM={
  drag:14,         // כמה פיקסלים צריך לגרור כדי שזה ייחשב כיוון ולא נגיעה
  pull:90,         // גרירה של כך פיקסלים = קצה הטווח (בסקיל של נקודה)
  minK:0.15,       // סקיל של נקודה: הכי קרוב שאפשר, כחלק מהטווח
  cone:0.6,        // unit: כמה רחוק מהכיוון (ברדיאנים) עוד בוחרים אויב
  reach:1.15,      // unit: בוחרים אויב עד טווח × זה (כמו הכיוון האוטומטי)
  defRange:220,    // סקיל בלי range
  dotR:34,         // סקיל של נקודה בלי r: עיגול קטן במקום הנחיתה
  lineW:26,        // קו בלי w
  cancelPad:16,    // אזור הביטול גדול מהכפתור שלו בכמה פיקסלים, כדי שקל לפגוע בו
  alpha:0.28,      // שקיפות המילוי של הסימון
  tip:['heal','spell'],   // כפתורים שלחיצה ארוכה עליהם מראה הסבר (moba-spells.js, MBSPELL.hold) במקום להטיל
};
let mbAim=null;
// ההגדרה של הכפתור: סקיל מהערכה, או ריפוי ולחש (moba-spells.js)
const mbAimS=(u,slot)=>MBKIT[u.kit][slot]||(typeof mbSpellS==='function'?mbSpellS(u,slot):{});   // {slot,pid,b,sx,sy,a,len,on,cancel}

// כפתורי הסקילים (נקרא מ-mbUi אחרי שהם נבנו): לחיצה מתחילה כיוון, ואזור הביטול נכנס לאותה קופסה
function mbAimInit(box){
  mbAim=null;
  for(const b of box.querySelectorAll('[data-sk]'))b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();mbAimDown(b,e)});
  const c=document.createElement('div');c.className='mbcancel';c.id='mbCancel';c.hidden=true;
  c.innerHTML='<b>✕</b><span data-t="mb.cancel">'+T('mb.cancel')+'</span>';box.appendChild(c);
}
function mbAimDown(b,e){
  const u=mbMe(),slot=b.dataset.sk;if(!u||u.dead||MB.over||mbAim)return;
  if(slot==='ult'&&u.lvl<MOBA.ultAt||u.cd[slot]>0&&!MBAIM.tip.includes(slot)){mbPress(slot);return}   // נעול או בטעינה: mbPress מרעיד או מתעלם, כמו קודם
  mbAim={slot,pid:e.pointerId,b,sx:e.clientX,sy:e.clientY,a:u.face,len:0,on:false,cancel:false,t0:performance.now(),ts:e.timeStamp,tip:false};   // ts: זמן הנגיעה עצמה, בשביל ההחלטה בשחרור
  try{b.setPointerCapture(e.pointerId)}catch(_){}
}
function mbAimMove(e){
  const A=mbAim;if(!A||e.pointerId!==A.pid)return;
  const dx=e.clientX-A.sx,dy=e.clientY-A.sy;A.len=Math.hypot(dx,dy);
  if(A.len>=MBAIM.drag){A.a=Math.atan2(dy,dx);if(!A.on){A.on=true;mbAimShow(true);if(A.tip){A.tip=false;mbSpellTip(null)}}}   // גרירה אחרי הסבר: ההסבר נעלם ומכוונים
  if(A.on){const c=$('mbCancel').getBoundingClientRect(),p=MBAIM.cancelPad;
    const over=e.clientX>c.left-p&&e.clientX<c.right+p&&e.clientY>c.top-p&&e.clientY<c.bottom+p;
    if(over!==A.cancel){A.cancel=over;$('mbCancel').classList.toggle('hot',over);if(over)sfx('tap')}}
}
function mbAimUp(e){
  const A=mbAim;if(!A||e.pointerId!==A.pid)return;mbAimEnd();
  if(!S.mb||!MB||A.cancel)return;   // בוטל: בלי הטלה ובלי טעינה
  // לחיצה ארוכה (בלי גרירה) הראתה הסבר: בלי הטלה. ההחלטה לפי הזמנים של הנגיעה עצמה ולא לפי הפריימים,
  // כי פריים כבד אחד (יותר מחצי שנייה) מראה את ההסבר כבר בפריים הראשון, ונגיעה קצרה נבלעה (המתאם, 7.11)
  if(A.tip&&!(e.timeStamp-A.ts<MBSPELL.hold*1000))return;
  if(!A.on){mbPress(A.slot);return}  // נגיעה קצרה: כיוון אוטומטי
  const u=mbMe();if(u)mbPress(A.slot,mbAimPick(u,A).aim);
}
function mbAimEnd(){if(!mbAim)return;if(mbAim.tip&&typeof mbSpellTip==='function')mbSpellTip(null);mbAim=null;mbAimShow(false)}
function mbAimShow(on){
  const c=$('mbCancel');if(c){c.hidden=!on;c.classList.remove('hot')}
  for(const b of document.querySelectorAll('#mbSk [data-sk]'))b.classList.toggle('aiming',on&&!!mbAim&&b===mbAim.b);
}
addEventListener('pointermove',mbAimMove,true);
addEventListener('pointerup',mbAimUp,true);
addEventListener('pointercancel',e=>{if(mbAim&&e.pointerId===mbAim.pid)mbAimEnd()},true);

// לאן הסקיל ילך לפי הכיוון: {aim} בשביל mbCast, ו-{x,y,t} בשביל הציור
function mbAimRange(s){return s.range||s.dist||s.r||MBAIM.defRange}
function mbAimKind(s){const k=s.kind;if(k==='line'||k==='point'||k==='unit'||k==='self'||k==='away')return k;return s.r&&s.range?'point':s.range||s.dist?'line':'self'}
function mbAimPick(u,A){
  const s=mbAimS(u,A.slot),kind=mbAimKind(s),R=mbAimRange(s),ca=Math.cos(A.a),sa=Math.sin(A.a);
  if(kind==='self')return{kind,aim:null};
  if(kind==='point'){const d=R*Math.max(MBAIM.minK,Math.min(1,A.len/MBAIM.pull));const p={x:u.x+ca*d,y:u.y+sa*d};return{kind,aim:p,x:p.x,y:p.y}}
  if(kind==='unit'){let best=null,bd=MBAIM.cone;
    for(const o of MB.u){if(o.team===u.team||o.dead||(o.k!=='hero'&&o.k!=='minion')||!mbSeen(o,u.team)||!mbTgt(o))continue;const dd=Math.hypot(o.x-u.x,o.y-u.y);if(dd>R*MBAIM.reach)continue;
      const d=Math.abs(angDiff(Math.atan2(o.y-u.y,o.x-u.x),A.a))+(o.k==='hero'?0:0.25);if(d<bd){bd=d;best=o}}   // גיבור קודם לחייל
    if(best)return{kind,aim:best,x:best.x,y:best.y,t:best}}
  const p={x:u.x+ca*R,y:u.y+sa*R};return{kind,aim:p,x:p.x,y:p.y};   // line, away, ו-unit בלי אויב בכיוון
}

// הסימון על הרצפה, בקנבס מעל התלת-ממד (נקרא מ-mobaDraw, בקואורדינטות של העולם). גם השניות על הכפתורים
function mbAimDraw(){
  mbAimSecs();
  const A=mbAim,u=MB&&MB.me;if(!A)return;
  if(!u||u.dead||MB.over){mbAimEnd();return}
  if(!A.on&&!A.tip&&MBAIM.tip.includes(A.slot)&&typeof mbSpellTip==='function'&&performance.now()-A.t0>MBSPELL.hold*1000){A.tip=true;mbSpellTip(A.slot,A.b)}   // לחיצה ארוכה: הסבר
  if(!A.on||A.tip)return;
  const s=mbAimS(u,A.slot),R=mbAimRange(s),P0=mbAimPick(u,A),col=A.cancel?'#8A8F9E':s.col||dtCol(s.dt||MBKIT[u.kit].dt);
  ctx.save();ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=2;
  // עיגול הטווח: תמיד
  ctx.globalAlpha=0.5;ctx.setLineDash([8,6]);ctx.beginPath();ctx.arc(u.x,u.y,P0.kind==='self'?(s.r||R):R,0,7);ctx.stroke();ctx.setLineDash([]);
  ctx.globalAlpha=MBAIM.alpha;
  if(P0.kind==='self'){ctx.beginPath();ctx.arc(u.x,u.y,s.r||R,0,7);ctx.fill()}
  else if(P0.kind==='point'){const r=s.r||MBAIM.dotR;ctx.beginPath();ctx.arc(P0.x,P0.y,r,0,7);ctx.fill();ctx.globalAlpha=0.9;ctx.lineWidth=3;ctx.stroke();
    ctx.globalAlpha=0.5;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(u.x,u.y);ctx.lineTo(P0.x,P0.y);ctx.stroke()}
  else if(P0.kind==='unit'&&P0.t){const t=P0.t;ctx.globalAlpha=0.85;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(u.x,u.y);ctx.lineTo(t.x,t.y);ctx.stroke();
    ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(t.x,t.y+2,t.r+10,(t.r+10)*0.5,0,0,7);ctx.stroke()}
  else mbAimArrow(u.x,u.y,A.a,P0.kind==='line'?R:Math.min(R,s.dist||R),P0.kind==='line'?(s.w||MBAIM.lineW):MBAIM.lineW,P0.kind!=='line');
  ctx.restore();
}
// חץ על הרצפה: גוף ברוחב w עד אורך len, וראש בקצה. dash: קו מקווקו (קפיצה, או unit בלי אויב)
function mbAimArrow(x,y,a,len,w,dash){
  ctx.translate(x,y);ctx.rotate(a);const h=Math.max(w/2,10),head=Math.min(36,len*0.25);
  if(!dash){ctx.fillRect(0,-w/2,len-head,w)}
  ctx.globalAlpha=0.85;ctx.lineWidth=3;if(dash)ctx.setLineDash([10,8]);
  ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(len-head,0);ctx.stroke();ctx.setLineDash([]);
  ctx.beginPath();ctx.moveTo(len,0);ctx.lineTo(len-head,-h-6);ctx.lineTo(len-head,h+6);ctx.closePath();ctx.fill();
}
// בזמן הטעינה: השניות באמצע הכפתור (::after של .skb[data-sec])
function mbAimSecs(){
  const u=MB&&MB.me;if(!u)return;
  for(const b of document.querySelectorAll('#mbSk [data-sk]')){const c=u.cd[b.dataset.sk]||0,n=c>0?String(Math.ceil(c)):'';if(b.dataset.sec!==n)b.dataset.sec=n}
}
