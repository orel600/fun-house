/* תחושת מכה בגוף (ניר, 8.11.2026, לפי patch-gg/pixelfx "acting" ו-game-feel: שכבות משוב לפי גודל המכה).
   juice.js כבר עושה עצירה, הבזק, הדיפה ורעידה. כאן רק הגוף, בלי עצירה ובלי רעידה נוספות:
   - הגיבור: תנוחת הכנה קצרה לפני המכה (נטייה לאחור ומשיכה קטנה, חרב או מתיחת קשת), ואחריה התאוששות (נטייה קדימה שנרגעת).
     ההכנה כולה בסוף זמן הקירור הקיים (P.sw.t / P.gn.t), כך שהתקיפה האוטומטית יוצאת בדיוק באותו רגע כמו קודם.
   - האויב שנפגע: נטייה קצרה של הגוף אחורה, הרחק מהמכה, עם קפיצה קטנה חזרה. עוצמה לפי המכה: רגילה עדינה, חולשה יותר, קריטי הכי הרבה.
   רק בעולם ובכפר. כבוי ב"הפחתת תנועה" (RM, core.js), וחצי ב"פחות אפקטים".
   חיבורים: hfHit מ-juiceHit (juice.js), hf2d/hf2dEnd סביב ציור דמות בדו-ממד (render.js), hf3d אחרי place (render3d.js).
   זוויות ברדיאנים, מרחקים בפיקסלים של המשחק, זמנים בשניות */

const HITFEEL={
  where:{world:true,village:true,arena:false},   // arena: לבדיקה בלבד (tools/check.js). הזירה של אוראל
  sword:{wind:0.11,windK:0.35,back:0.16,pull:3,fwd:0.13,lunge:4},   // wind: אורך ההכנה, לא יותר מ-windK מהקירור. back/fwd: נטייה. pull/lunge: הזזה קטנה
  bow:{wind:0.16,windK:0.45,back:0.08,pull:2,fwd:0.07,kick:2.5},     // מתיחה: נטייה לאחור. שחרור: נטייה קדימה, והגוף נהדף מעט אחורה (kick)
  crit:1.6,                                      // בקריטי ההתאוששות של הגיבור חזקה פי כך
  foe:{t:0.2,tCrit:0.3,out:0.25,lean:{hit:0.12,weak:0.18,crit:0.3,resist:0.05},max:0.35},   // t: משך. out: החלק של הזמן עד שיא הנטייה. max: תקרה
  less:0.5                                       // "פחות אפקטים": חצי
};
const HF={n:{wind:0,foe:0},heroK:1,heroT:-9,wasWind:false,o:{dx:0,dy:0,lean:0,a:0}};   // n: מונים בשביל הבוט. o: התנוחה של הגיבור, בלי הקצאה בכל פריים
function hfOn(){if(typeof RM!=='undefined'&&RM||!S||S.mode!=='play')return false;const W=HITFEEL.where;return S.wd?W.world:S.vil?W.village:W.arena}
const hfLess=()=>typeof fxLess==='function'&&fxLess()?HITFEEL.less:1;

// נקרא מ-juiceHit: האויב מתחיל להתנדנד, והגיבור זוכר אם המכה הייתה קריטית
function hfHit(e,m,crit,ang){
  if(!hfOn()||e.isBoss||e.node)return;
  const L=HITFEEL.foe.lean,k=crit?L.crit:m>1?L.weak:m<1?L.resist:L.hit;
  e.hfT=jNow();e.hfA=ang||0;e.hfK=Math.min(HITFEEL.foe.max,k/(e.big||1));e.hfD=crit?HITFEEL.foe.tCrit:HITFEEL.foe.t;HF.n.foe++;
  if(crit){HF.heroK=HITFEEL.crit;HF.heroT=jNow()}
}
// כמה האויב נוטה עכשיו (רדיאנים, לכיוון e.hfA). מהיר החוצה, ואז חוזר עם קפיצה קטנה לצד השני
function hfFoe(e){
  if(!e.hfT||!hfOn())return 0;const k=(jNow()-e.hfT)/e.hfD;if(k>=1){e.hfT=0;return 0}
  const o=HITFEEL.foe.out,u=(k-o)/(1-o);
  return e.hfK*hfLess()*(k<o?Math.sin(Math.PI/2*k/o):(1-u)*(1-u)*Math.cos(u*Math.PI*1.25));
}
// התנוחה של הגיבור עכשיו: נטייה (חיובי = קדימה, לכיוון a) והזזה. רק מראה, לא משנה את התקיפה
function hfHero(){
  const o=HF.o;o.dx=o.dy=o.lean=0;o.a=P.aim||0;if(!hfOn())return o;
  const sword=P.weapon==='sword',H=sword?HITFEEL.sword:HITFEEL.bow,g=sword?P.sw:P.gn,cd=g.cd*(typeof wK==='function'?wK('cd'):1);
  const wind=Math.min(H.wind,cd*H.windK),less=hfLess(),hk=jNow()-HF.heroT<0.4?HF.heroK:1;
  let lean=0,off=0;
  if(g.t>0&&g.t<=wind&&aimTarget(sword?P.sw.range:440)){   // הכנה: רק כשיש במי להכות, בסוף הקירור
    const k=1-g.t/wind,ez=k*k*(3-2*k);lean=-H.back*ez;off=-H.pull*ez;
    if(!HF.wasWind){HF.wasWind=true;HF.n.wind++}
  }else{
    HF.wasWind=false;
    if(sword&&g.anim>0){const q=g.anim/0.2;lean=H.fwd*hk*q*q;off=H.lunge*hk*q*q;o.a=g.ang}   // אחרי ההנפה: קדימה, ונרגע
    else if(!sword&&g.recoil>0){const q=g.recoil;lean=H.fwd*hk*q*q;off=-H.kick*hk*q}           // אחרי החץ: קדימה, והגוף נהדף מעט אחורה
  }
  if(!lean&&!off)return o;
  o.lean=lean*less;o.dx=Math.cos(o.a)*off*less;o.dy=Math.sin(o.a)*off*less;return o;
}
// דו-ממד (render.js): לפני ציור של דמות. מסובב סביב הרגליים. מחזיר true כשצריך hf2dEnd אחרי הציור
function hf2d(a){
  if(R3D.on||!hfOn())return false;
  let lean,ang,dx=0,dy=0;
  if(a.isPlayer){const o=hfHero();lean=o.lean;ang=o.a;dx=o.dx;dy=o.dy}else{lean=hfFoe(a);ang=a.hfA}
  if(!lean&&!dx&&!dy)return false;
  const x=a.isPlayer?P.x:a.x,y=(a.isPlayer?P.y:a.y)+15*(a.big||1);   // הרגליים: 15 מתחת למרכז (BONES ב-rig.js)
  ctx.save();ctx.translate(x+dx,y+dy);ctx.rotate(lean*Math.cos(ang));ctx.translate(-x,-y);return true;   // על המסך רואים רק את הרכיב לצדדים
}
function hf2dEnd(on){if(on)ctx.restore()}
// תלת-ממד (render3d.js), אחרי place ו-yaw: נטייה סביב הרגליים (ה-root של המודל) והזזה קטנה. e: האויב, או null לגיבור.
// סדר YXZ: x ו-z הם נטייה בתוך המסגרת של הדמות, ו-y (הכיוון שלה) לא משתנה, אז הסיבוב הרך של place ממשיך לעבוד
function hf3d(a,e){
  const r=a.root.rotation;if(r.order!=='YXZ')r.order='YXZ';
  let lean=0,ang=0;
  if(!e){const o=hfHero();lean=o.lean;ang=o.a;if(o.dx||o.dy){a.root.position.x+=o.dx;a.root.position.z+=o.dy/SIN()}}
  else{lean=hfFoe(e);ang=e.hfA}
  if(!lean){if(r.x||r.z){r.x=0;r.z=0}return}
  const rel=yawOf(Math.cos(ang),Math.sin(ang))-r.y;r.x=lean*Math.cos(rel);r.z=-lean*Math.sin(rel);
}
