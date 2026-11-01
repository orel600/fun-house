/* אויבים רגילים שנלחמים בחזרה (המחקר "למה הקרב לא כיף", docs/plan-combat.md שינוי 3, 1.11.2026). רק בעולם.
   היום אויב בעולם נופל במכה אחת, ופוגע רק במגע: אין מה לקרוא ואין ממה להתחמק. כאן:
   - יותר חיים לאויבים בעולם (WORLD.foeHp ב-world.js), כך שאויב רגיל לוקח 2 עד 3 מכות.
   - במקום נזק במגע: מכה עם הכנה. האויב נעצר, מאדים, וקשת אדומה מתמלאת על הרצפה לכיוון שלך (wind). בסוף, אם אתה עדיין בטווח, הוא מכה.
     התרחקת בזמן ההכנה = התחמקת. אחרי מכה יש הפסקה (cd), כדי שקבוצה תהיה "רגע של פעולה" ולא מכונת נזק.
   החיבורים: strikeTick מ-wFoes (world.js) ומ-paceFoeMove (pacing.js) במקום hurt במגע, strikeDraw מהציור של העולם.
   הזירה לא משתנה: היא לא קוראת לקובץ הזה */

const STRIKE={
  wind:0.42,          // כמה שניות ההכנה (המחקר: כ-0.4)
  reach:16,           // טווח המכה מעבר למגע (פיקסלים במשחק). מחוץ לזה בסוף ההכנה: התחמקת
  start:6,            // מתחיל להתכונן כשהשחקן קרוב מזה מעבר למגע
  cd:[0.9,1.4],       // הפסקה אחרי מכה (או החטאה), בשניות. אקראי, כדי שקבוצה לא תכה ביחד
  dmg:1.1,            // כמה פעמים e.dmg במכה אחת. במגע היה e.dmg כל 0.6 שניות (P.inv), כאן מכה אחת בכ-1.6 שניות
  lunge:120,          // קפיצה קטנה קדימה במכה
  arc:0.9,            // רוחב הקשת על הרצפה (רדיאנים)
  col:'#FF4D4D'       // צבע ההכנה
};

// כל פריים, לאויב בעולם שרודף. d: המרחק לשחקן. מחזיר true כשהאויב עסוק בהכנה (לא זז)
function strikeTick(e,dt,d){
  const K=STRIKE,touch=e.r+P.r;
  if(e.sw==null){e.sw=0;e.scd=rand(0,K.cd[0])}
  if(e.sw>0){
    e.sw-=dt;e.flash=Math.max(e.flash||0,0.05);   // מאדים בזמן ההכנה
    if(e.sw<=0){
      e.sw=0;e.scd=rand(...K.cd);
      const dx=P.x-e.x,dy=P.y-e.y,dd=Math.hypot(dx,dy)||1;
      e.kx+=Math.cos(e.sa)*K.lunge;e.ky+=Math.sin(e.sa)*K.lunge;
      // פוגע רק אם השחקן עדיין בטווח ובכיוון של הקשת
      const da=Math.abs(((Math.atan2(dy,dx)-e.sa+Math.PI*3)%(Math.PI*2))-Math.PI);
      if(dd<touch+K.reach&&da<K.arc)hurt(e.dmg*K.dmg);else e.dodged=(e.dodged||0)+1;
    }
    return true;
  }
  if((e.scd-=dt)<=0&&d<touch+K.start){e.sw=K.wind;e.sa=Math.atan2(P.y-e.y,P.x-e.x)}
  return false;
}
// ציור (בעולם, לפני הדמויות): קשת אדומה על הרצפה שמתמלאת עד המכה
function strikeDraw(){
  const K=STRIKE;
  for(const e of enemies){if(e.dead||!(e.sw>0))continue;
    const k=1-e.sw/K.wind,R=e.r+P.r+K.reach;
    ctx.save();ctx.translate(e.x,e.y);
    ctx.globalAlpha=0.18;ctx.fillStyle=K.col;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,R,e.sa-K.arc,e.sa+K.arc);ctx.closePath();ctx.fill();
    ctx.globalAlpha=0.45+0.4*k;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,R*k,e.sa-K.arc,e.sa+K.arc);ctx.closePath();ctx.fill();
    ctx.globalAlpha=0.9;ctx.strokeStyle=K.col;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,R,e.sa-K.arc,e.sa+K.arc);ctx.stroke();
    ctx.restore()}
  ctx.globalAlpha=1;
}
