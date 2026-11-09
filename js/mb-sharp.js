/* משחקי השאול: שפת אפקטים חדה (MBSHARP, השיפוץ, MAX ל-BOB, 10.11.2026). רק מראה, ורק ב-overhaul/preview. ?mbsharp=0 מחזיר את הקודם.
   הכלל (התדריך): מכה אחת חדה וכיוונית, הסדקים, וסימן הלם קטן. בלי עיגולים וסיגילים שנערמים, בלי הבזק על כל המסך ובלי רעידה כברירת מחדל.
   - כל המסך: הבזק ורעידה כבויים (MBFX.flash.a, MBFX.shake.max).
   - מעגל הקסם מתחת למטיל (wcirc_<סוג>, moba-skill-anim.js) כבוי לכל הסקילים: מחקנו אותו דרך noCirc, הטבלה הקיימת.
   - הסדן (s1 של הטנק): בלי גל הטבעת (sk_anvil_wave), בלי הטבעת של mbBoom ובלי הטבעת של mbfxSlam. נשארים: הבזק המכה (hit_heavy),
     האבנים (debris), הסדקים שנשארים לאורך השדה (sk_anvil, hold) והסימן של ההלם מעל הראש.
   - טבעת הזוהר הגדולה של הקבוצה (MBLIB.glow) כבויה, וקו השדה של הסדן בקנבס כבוי.
   מחיקה: הקובץ, השורה ב-index.html, והקריאות mbSharpBoom ו-mbSharpSlam ב-moba-kits.js (חוזרות ל-mbBoom ו-mbfxSlam) */
const MBSHARP={
  on:!/[?&]mbsharp=0(&|$)/.test(location.search),
  screen:{flash:0,shake:0},          // כמה מההבזק ומהרעידה נשאר (0 = כבוי)
  noSigil:true,                      // בלי מעגל קסם מתחת למטיל
  skip:{anvil:['sk_anvil_wave']},    // אפקטים שלא מתנגנים בסקיל הזה
  noRing:{anvil:true},               // בלי טבעות קנבס (mbBoom, mbfxSlam) בסקיל הזה
  teamGlow:false,                    // טבעת הזוהר הגדולה של הקבוצה מתחת לגיבור (MBLIB.glow): כבויה. הטבעת הקטנה בתלת-ממד מתחת לרגליים נשארת סימן הקבוצה
  fieldEdge:false,                   // קו השדה של הסדן בקנבס (moba.js): כבוי, הסדקים (sk_anvil, hold) הם הסימן
  stat:{skipped:0,rings:0}
};
// הטבעת של סקיל: רגילה, או כלום בסקיל שב-noRing
function mbSharpBoom(id,x,y,r,t){if(MBSHARP.on&&MBSHARP.noRing[id]){MBSHARP.stat.rings++;return}mbBoom(x,y,r,t)}
// mbfxSlam של סקיל: האבנים תמיד, הטבעת (MB.fx) רק בסקיל שלא ב-noRing
function mbSharpSlam(id,u,r,t){const n=MB.fx.length,v=mbfxSlam(u,r,t);if(MBSHARP.on&&MBSHARP.noRing[id]&&MB.fx.length>n){MB.fx.length=n;MBSHARP.stat.rings++}return v}
(function(){
  const X=MBSHARP;if(!X.on)return;
  if(!X.teamGlow&&typeof MBLIB!=='undefined'&&MBLIB.glow)MBLIB.glow.a=0;
  if(typeof MBFX!=='undefined'){MBFX.flash.a*=X.screen.flash;MBFX.shake.max*=X.screen.shake}
  if(X.noSigil&&typeof MBANIM!=='undefined'&&typeof MBKIT!=='undefined')for(const k in MBKIT)for(const sl of ['s1','s2'])if(MBKIT[k][sl])MBANIM.noCirc[MBKIT[k][sl].id]=true;
  // אפקט שדולגים עליו: לפי השם, רק בסקילים שבטבלה (sk_anvil_wave מתנגן רק מהסדן)
  const sk=new Set(Object.values(X.skip).flat());
  if(typeof mbfxSk==='function'){const b=mbfxSk;mbfxSk=function(id){if(sk.has(id)){X.stat.skipped++;return null}return b.apply(this,arguments)}}
})();
