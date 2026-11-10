/* הגיבור נשאר גלוי בקרב צפוף (HCLEAR, ניר אישר 10.11.2026: "חד אבל קריא").
   בצילומים אחרי #619/#611 עננים לבנים גדולים ישבו על הגיבור: ה"פוף" וההבזק של juice.js (כשהגיליונות עוד לא נטענו),
   והפגיעה והמוות מהגיליונות (whit_*, wko_* של fxcombat.js). אותו רעיון כמו near ב-sharphit.js:
   אפקט שמרכזו קרוב לגיבור (עד r) זז לצד של האויב (הרחוק מהגיבור), קטן ועמום יותר, ולכל היותר perFrame כאלה בפריים.
   רק בעולם. בהפחתת תנועה עוד יותר עמום (calm).
   (ההלבנה בתלת-ממד של אויב שנפגע הוחלפה ב-#641, hitflash3d.js: מבהיר בצבע שלו, בלי לבן.)
   חיבור: hcFit מ-juiceKill/juiceHit (juice.js) ומ-fxcHit/fxcKill (fxcombat.js). מחיקה: הקובץ והקריאות, והכל כמו קודם. */
const HCLEAR={
  on:true,
  r:90,            // קרוב מזה לגיבור (פיקסלים בעולם) = "על הגיבור"
  perFrame:2,      // כמה אפקטים כאלה ליד הגיבור בפריים אחד. השאר לא מצוירים (המספר והניצוצות נשארים)
  scale:0.55,      // הגודל ליד הגיבור
  alpha:0.5,       // השקיפות ליד הגיבור
  calm:0.7,        // הפחתת תנועה: עוד פי כך
  push:1.1         // כמה רדיוסים של האויב האפקט זז מהגיבור והלאה (לצד של האויב)
};
const HC={fr:-1,n:0,log:[],stat:{near:0,capped:0}};
const hcOn=()=>HCLEAR.on&&!!S&&!!S.wd&&!S.mb&&!!P;
// x,y: איפה האפקט היה מצויר; e: האויב. מחזיר {x,y,k,a} (מקום, גודל ושקיפות), או null = לא לצייר (תקרה ליד הגיבור)
function hcFit(x,y,e){
  if(!hcOn()||!e||Math.hypot(x-P.x,y-P.y)>=HCLEAR.r)return{x,y,k:1,a:1};
  const fr=typeof FRAME_T==='number'?FRAME_T:Math.round(jNow()*120);   // FRAME_T (main.js): אותו מספר לכל הפריים
  if(fr!==HC.fr){HC.fr=fr;HC.n=0}
  if(HC.n>=HCLEAR.perFrame){HC.stat.capped++;return null}
  HC.n++;HC.stat.near++;
  let dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy);if(d<1){dx=x-P.x;dy=y-P.y;d=Math.hypot(dx,dy)||1}
  const s=(e.r||14)*HCLEAR.push,calm=typeof calmOn==='function'&&calmOn()?HCLEAR.calm:1;
  const o={x:x+dx/d*s,y:y+dy/d*s,k:HCLEAR.scale,a:HCLEAR.alpha*calm};
  HC.log.push({x:o.x,y:o.y,ex:e.x,ey:e.y,px:P.x,py:P.y,k:o.k,a:o.a});if(HC.log.length>20)HC.log.shift();
  return o;
}
