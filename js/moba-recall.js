/* משחקי השאול: HUD ששומר אותך בחיים (הבודק של אוראל, 4.11.2026: 31%-39% מהמשחק מת, לא שמים לב שעומדים למות, ואין איך לחזור מהר לבסיס)
   (1) חזרה לבסיס כמו ב-MLBB: כפתור, 4 שניות של טבעת שמתמלאת סביב הגיבור, וכל תזוזה או פגיעה מבטלת. בסוף מופיעים בבסיס.
       גם הבוטים חוזרים כך כשהם נסוגים רחוק מהבסיס (שורה אחת ב-moba-bot.js: mbRecallBot).
   (2) אזהרה בחיים נמוכים: מסגרת אדומה רכה פועמת בקצוות המסך, והודעה קצרה פעם אחת בכל ירידה מתחת לסף.
   החיבור: mbRecallTick ב-mobaUpdate, mbRecallDraw ב-mobaDraw, mbRecallHud ב-mobaHud */
const MBRECALL={
  t:4,              // שניות עד שמגיעים לבסיס
  move:5,           // תזוזה של יותר מזה (פיקסלים) מבטלת
  ring:{r:30,w:5},  // הטבעת סביב הגיבור
  low:{at:0.3,off:0.4},   // אזהרה מתחת ל-30% חיים. נגמרת מעל 40%, וכך לא מהבהבת סביב הסף
  bot:{far:900,safe:650}, // בוט שנסוג חוזר כך רק כשהוא רחוק מהבסיס, ואין גיבור אויב קרוב
};
function mbRecallStart(u){
  if(!u||u.dead||MB.over||u.st.stun>0||u.st.dash||mbDist(u,u.home)<MBRECALL.ring.r*3)return false;
  u.recall={t:MBRECALL.t,x:u.x,y:u.y,hp:u.hp};if(u.me)sfx('tap');return true;
}
function mbRecallStop(u,why){if(!u.recall)return;u.recall=null;if(u.me&&why)mbBanner(T('mb.recallOff'),C.dim)}
function mbRecallTick(M,dt){
  for(const u of M.u){const R=u.recall;if(!R)continue;
    if(u.dead||u.st.stun>0)mbRecallStop(u,true);
    else if(Math.hypot(u.x-R.x,u.y-R.y)>MBRECALL.move||u.hp<R.hp-0.5)mbRecallStop(u,true);   // זז או נפגע: בוטל
    else{R.hp=Math.max(R.hp,u.hp);R.t-=dt;
      if(R.t<=0){u.recall=null;u.x=u.home.x;u.y=u.home.y;mbFeelReset(u);mbBoom(u.x,u.y,70,u.team?'red':'blue');if(u.me)sfx('celebrate')}}}
}
// בוט: עומד במקום בזמן החזרה, ומתחיל לחזור כשהוא נסוג רחוק בלי אויב קרוב. מחזיר true = הבוט לא עושה כלום אחר בפריים הזה
function mbRecallBot(u){
  if(u.recall)return true;
  if(u.bot.mode!=='retreat'||mbDist(u,u.home)<MBRECALL.bot.far)return false;
  if(MB.u.some(o=>o.k==='hero'&&o.team!==u.team&&!o.dead&&mbDist(o,u)<MBRECALL.bot.safe))return false;
  return mbRecallStart(u);
}
// הטבעת על הרצפה סביב מי שחוזר (גם בוטים, כדי לראות שהאויב בורח)
function mbRecallDraw(){
  for(const u of MB.u){const R=u.recall;if(!R||u.dead||!mbShow(u))continue;
    const k=1-R.t/MBRECALL.t,r=MBRECALL.ring.r+u.r,col=MOBA.team[u.team];
    ctx.save();ctx.translate(u.x,u.y+2);ctx.scale(1,0.45);ctx.lineWidth=MBRECALL.ring.w;
    ctx.strokeStyle='rgba(14,16,26,0.55)';ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.stroke();
    ctx.strokeStyle=u.me?C.gold:col;ctx.shadowColor=col;ctx.shadowBlur=10;ctx.beginPath();ctx.arc(0,0,r,-Math.PI/2,-Math.PI/2+k*Math.PI*2);ctx.stroke();
    ctx.restore()}
}
// ה-HUD: מסגרת אדומה בחיים נמוכים, והודעה פעם אחת בכל ירידה. הכפתור מראה את ההתקדמות
function mbRecallHud(){
  const u=mbMe();if(!u)return;const L=MBRECALL.low,f=u.hp/u.max,low=!u.dead&&f<L.at;
  if(low&&!u.lowWarn){u.lowWarn=true;mbBanner(T('mb.low'),C.blood)}
  if(u.dead||f>L.off)u.lowWarn=false;
  const v=$('mbLow');if(v.classList.contains('on')!==low)v.classList.toggle('on',low);
  const b=$('mbRecall'),R=u.recall;b.classList.toggle('on',!!R);b.style.setProperty('--rp',R?1-R.t/MBRECALL.t:0);b.disabled=u.dead;
}
$('mbRecall').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();const u=mbMe();if(!u)return;if(u.recall)mbRecallStop(u,false);else mbRecallStart(u)});
addEventListener('keydown',e=>{if(e.code==='KeyB'&&S.mb&&S.mode==='play'){const u=mbMe();if(u&&!u.recall)mbRecallStart(u)}});   // מקלדת: B
