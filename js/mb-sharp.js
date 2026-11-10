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
  skip:{anvil:['sk_anvil_wave'],wall:['sk_anvil_wave'],ult:['ult_cast'],   // אפקטים שלא מתנגנים (גל הטבעת של הסדן והחומה, ומעגל הקסם הגדול של כל סקיל-על). עמוד האור (ult_ray) נשאר
    // השער של QUINN על #604 (10.11): דיסקים מלאים בסגנון הישן. הסיבוב: גלגל הטריזים (sk_spin) יוצא, ושובל הסיבוב (tr_spin_sapphire) הוא החיתוך המעגלי.
    // הסופה: הספירלה (sk_blizzard) וכדור הזוהר (sk_blizzard_ice) יוצאים. נשארים: סימון הנחיתה בזמן ההמתנה, סדקי הקרח (whit_ice) ופסי קרח שנופלים (shards)
    spin:['sk_spin'],blizzard:['sk_blizzard','sk_blizzard_ice']},
  noRing:{anvil:true,taunt:true,wall:true,ult:true,spin:true,rage:true,rain:true,blizzard:true},   // בלי טבעות קנבס (mbBoom, mbfxSlam, הטבעת הלבנה של mbfxBlast והטבעת של רגע סקיל-העל mbfxUlt) בסקיל הזה
  edge:{rain:true,blizzard:true},    // אזור (גשם החצים, הסופה): קו דק בצבע הקבוצה במקום דיסק מלא, גם בהמתנה (קו שגדל עד הנחיתה). moba.js. החצים שנופלים (sk_rain) נשארים
  // פסי קרח שנופלים לתוך האזור בזמן ההמתנה (הסופה): n פסים, נופלים fall יחידות, אורך len. רק ציור
  shards:{blizzard:{n:12,fall:90,len:16,w:2,col:'#D8F4FF'}},
  noBubble:{tank:true},              // מגן בלי בועה וטבעת שריון מעליו (בתלת-ממד בלבד): אצל הטנק המגן הוא הזוהר החם על הגוף (mb-tankskill3d.js), כמו במסמך של s2
  teamGlow:false,                    // טבעת הזוהר הגדולה של הקבוצה מתחת לגיבור (MBLIB.glow): כבויה. הטבעת הקטנה בתלת-ממד מתחת לרגליים נשארת סימן הקבוצה
  fieldEdge:false,                   // קו השדה של הסדן בקנבס (moba.js): כבוי, הסדקים (sk_anvil, hold) הם הסימן
  stat:{skipped:0,rings:0}
};
// הטבעת של סקיל: רגילה, או כלום בסקיל שב-noRing
function mbSharpBoom(id,x,y,r,t){if(MBSHARP.on&&MBSHARP.noRing[id]){MBSHARP.stat.rings++;return}mbBoom(x,y,r,t)}
// בועת המגן וטבעת השריון בקנבס (moba-fx.js, moba.js): לא לגיבור שב-noBubble, ורק בתלת-ממד. בדו-ממד אין זוהר על הגוף, אז הבועה נשארת
function mbSharpNoBubble(u){return MBSHARP.on&&u&&u.k==='hero'&&!!MBSHARP.noBubble[u.kit]&&typeof R3D!=='undefined'&&R3D.on}
// mbfxSlam של סקיל: האבנים תמיד, הטבעת (MB.fx) רק בסקיל שלא ב-noRing
function mbSharpSlam(id,u,r,t){const n=MB.fx.length,v=mbfxSlam(u,r,t);if(MBSHARP.on&&MBSHARP.noRing[id]&&MB.fx.length>n){MB.fx.length=n;MBSHARP.stat.rings++}return v}
// mbfxBlast של סקיל: הרסס תמיד, הטבעת הלבנה (MB.fx) רק בסקיל שלא ב-noRing
function mbSharpBlast(id,x,y,r,col){const n=MB.fx.length;mbfxBlast(x,y,r,col);if(MBSHARP.on&&MBSHARP.noRing[id]&&MB.fx.length>n){MB.fx.length=n;MBSHARP.stat.rings++}}
// אפקט חד ברשימה MB.fx (f.sh), מצויר מ-moba.js. shards: פסי קרח שנופלים, כל אחד בזמן משלו, ונעלמים כשהם נוגעים ברצפה (שם הסדקים לוקחים)
function mbSharpDraw(f){
  const B=MBSHARP.shards[f.sh];if(!B)return;const p=1-f.life/f.L0;
  ctx.strokeStyle=B.col;ctx.lineWidth=B.w;ctx.lineCap='round';
  for(let i=0;i<B.n;i++){const o=hash(i,3)*0.5,q=(p-o)/0.5;if(q<=0||q>=1)continue;
    const a=hash(i,11)*6.283,d=Math.sqrt(hash(i,29))*f.r*0.9,x=f.x+Math.cos(a)*d,y=f.y+Math.sin(a)*d*0.8-B.fall*(1-q);
    ctx.globalAlpha=Math.min(1,q*3)*0.9;ctx.beginPath();ctx.moveTo(x,y-B.len);ctx.lineTo(x,y);ctx.stroke()}
  ctx.globalAlpha=1;ctx.lineCap='butt';
}
(function(){
  const X=MBSHARP;if(!X.on)return;
  if(!X.teamGlow&&typeof MBLIB!=='undefined'&&MBLIB.glow)MBLIB.glow.a=0;
  if(typeof MBFX!=='undefined'){MBFX.flash.a*=X.screen.flash;MBFX.shake.max*=X.screen.shake}
  if(X.noSigil&&typeof MBANIM!=='undefined'&&typeof MBKIT!=='undefined')for(const k in MBKIT)for(const sl of ['s1','s2'])if(MBKIT[k][sl])MBANIM.noCirc[MBKIT[k][sl].id]=true;
  // אפקט שדולגים עליו: לפי השם, רק בסקילים שבטבלה (sk_anvil_wave מתנגן רק מהסדן)
  const sk=new Set(Object.values(X.skip).flat());
  if(typeof mbfxSk==='function'){const b=mbfxSk;mbfxSk=function(id){if(sk.has(id)){X.stat.skipped++;return null}return b.apply(this,arguments)}}
  if(typeof mbaPlay==='function'){const b=mbaPlay;mbaPlay=function(id){if(sk.has(id)){X.stat.skipped++;return null}return b.apply(this,arguments)}}   // אותה רשימה גם לאנימציות הסקילים (moba-skill-anim.js)
  // הסופה: כשהאזור נפתח, פסי הקרח נכנסים לרשימה לזמן ההמתנה שלו
  if(typeof mbZone==='function'){const b=mbZone;mbZone=function(u,x,y,r,delay,fire,look){const v=b.apply(this,arguments);if(X.shards[look]&&delay>0&&MB.fx.length<40)MB.fx.push({x,y,r,sh:look,life:delay,L0:delay});return v}}
  if(typeof mbfxUlt==='function'&&X.noRing.ult){const b=mbfxUlt;mbfxUlt=function(){const n=MB.fx.length,r=b.apply(this,arguments);if(MB.fx.length>n){MB.fx.length=n;X.stat.rings++}return r}}   // רגע סקיל-העל: בלי הטבעת, הרסס והשם נשארים
})();
