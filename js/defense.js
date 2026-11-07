/* הגנה כדירוג עם תשואה פוחתת (ניר, 7.11.2026, מסרטון של מעצב לשעבר בבליזארד). במקום אחוזים שמתחברים עד תקרה:
   הגנה היא מספר נקודות (P.def), וכמה נזק היא בולעת תלוי ברמת התוקף: אחוז = נקודות / (נקודות + K), ו-K = a + b × רמת התוקף.
   כך כל נקודה שווה קצת פחות מהקודמת, ושריון ישן נחלש מול מפלצות של אזור גבוה יותר.
   - שריון ומגן (armor.js): הנקודות = האחוז הישן × tierMul לפי השכבה. כל מקור אחר (נקודות דמות, סטים, פסיבית, כוחות, חנות): האחוז הישן × flat.
   - a ו-b כוילו כך שגיבור רגיל, ברמה של כל אזור ובשכבה שבדרך כלל נופלת שם, מקבל בערך את האחוז שהיה לו קודם (טבלת הכיול ב-PR של feature/defense-rating).
   - רמת התוקף: hurt (combat.js) לא יודע מי הכה, אז לפי איפה שאתה עומד: רמת האזור (CURIO.paths, האחו 1), ועוד לפי המרחק מהשער (zoneLv), ועוד דרגת העולם.
   - הזירה של אוראל לא משתנה: מחוץ לכפר ולעולם (זירה, חדר בונוס) defOld מחזיר בדיוק את האחוז הישן, עם התקרה הישנה (STATS.cap.def).
   - עץ הסקילים (statDefFx: עומדים במקום, שריון ננעל) נשאר אחוז שמתווסף, כי זה מצב רגעי ולא ציוד.
   החיבורים: hurt ב-combat.js (defMit), arenaPower ב-arena-scale.js, טור הסטטים ב-gearui.js, הציון ב-power.js (defItemOld). */
const DEFENSE={
  flat:6,                  // מקור שאינו שריון: נקודות לכל אחוז ישן. נקודת דמות 1.5% → 9
  tierMul:[3,4,5,7,10],    // שריון ומגן: נקודות לכל אחוז ישן, לפי השכבה (עץ, ברזל, כסף, זהב, אגדי). קסדה [9,16,25,49,90]
  a:280,b:10,              // K = a + b × רמת התוקף. רמה 1: 290, רמה 30: 580
  cap:85,                  // תקרת ביטחון באחוזים בעולם (קודם 60). בפועל רחוק ממנה
  lv:{meadow:1},           // רמת האזור. השאר מהרמה המומלצת של הדרך אליו (CURIO.paths)
  zoneLv:[0,2,4,5,6],      // עוד רמות לפי האזור בתוך המפה (ליד השער, באמצע, רחוק...), לפי הסדר ב-zones (world.js)
  tierLv:[0,3,6]           // עוד רמות בדרגת עולם 2 ו-3 (tiers.js)
};

const defK=lv=>DEFENSE.a+DEFENSE.b*lv;
// כמה אחוז נזק נבלע: נקודות מול תוקף ברמה lv
const defPct=(r,lv)=>r>0?100*r/(r+defK(lv)):0;   // מתחת ל-0 (קללה): 0, לא נזק נוסף. חיים אפקטיביים = חיים × (1 + r/K), קו ישר בנקודות
// בכפר ובעולם: הדירוג החדש. בזירה, במובה ובחדר הבונוס: ההתנהגות הישנה
const defWorld=()=>!!(typeof S!=='undefined'&&S&&(S.wd||S.vil)&&!S.mb);
// רמת המפלצות כאן: רמת האזור, המרחק מהשער ודרגת העולם
function defAtkLv(){
  const D=DEFENSE,R=typeof WR==='function'?WR():{},reg=R.region||'meadow';
  let lv=D.lv[reg]??((typeof CURIO!=='undefined'&&CURIO.paths[reg]||{}).lv||1);
  if(S&&S.wd&&R.zones&&typeof wZone==='function'){const z=wZone(P),i=R.zones.indexOf(z);if(i>0)lv+=D.zoneLv[Math.min(i,D.zoneLv.length-1)]}
  if(S&&S.wd&&typeof tierNow==='function')lv+=D.tierLv[tierNow()-1]||0;
  return lv;
}
const defFx=()=>typeof statDefFx==='function'?statDefFx():0;
// כמה הגנה של חפץ היא מהשריון עצמו (לפי השכבה) ולא מכוח שהוטבע בו (powers.js), שתמיד לפי flat
function defItemSplit(id){
  const it=gItem(id);if(!it)return{base:0,pow:0,mul:DEFENSE.flat};
  const all=gStats(id).def||0,pow=(typeof powGive==='function'&&typeof gPow==='function'?powGive(gPow(id)).def:0)||0;
  return{base:all-pow,pow,mul:it.defMul||DEFENSE.flat};
}
// האחוז הישן של חפץ (לציון ב-power.js ולזירה)
function defItemOld(id){const s=defItemSplit(id);return s.base/s.mul+s.pow/DEFENSE.flat}
// האחוז הישן של הגיבור, בדיוק כמו קודם: כל הנקודות לפי flat, ותיקון לשריון שלבוש לפי השכבה שלו
function defOld(){
  let n=(P.def||0)/DEFENSE.flat;
  if(typeof gearWorn==='function')for(const id of gearWorn()){const s=defItemSplit(id);if(s.mul!==DEFENSE.flat)n+=s.base/s.mul-s.base/DEFENSE.flat}
  return n;
}
// האחוז שמוצג ושנבלע עכשיו, עם עץ הסקילים ועם התקרה
function defNow(){
  if(!defWorld())return Math.min(STATS.cap.def,defOld()+defFx());
  return Math.min(DEFENSE.cap,defPct(P.def||0,defAtkLv())+defFx());
}
// לחלק: hurt ב-combat.js
const defMit=()=>defNow()/100;
