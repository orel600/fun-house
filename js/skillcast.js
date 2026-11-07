/* הגיבור מטיל כל סקיל (ניר, 7.11.2026: "כשעושים סקיל, הדמות לא עושה אנימציה... גם יהיה נחמד אם מתחתיה יהיה עיגול קסם").
   בכל שימוש בסקיל (wskUse ב-wskill.js, sigUse ב-sigskill.js): תנועה קצרה של פלג הגוף העליון (render3d.js), ועיגול רונות
   בצבע סוג הנזק מתחת לגיבור, שמופיע, מסתובב לאט ונעלם. רק מראה: הנזק, הקירור והתזמון של הסקילים לא משתנים.
   התנועה לפי סוג הסקיל (kind), לא סקיל-סקיל, אז סקיל חדש מקבל אותה לבד. 'shot': משיכת קשת כשיש קשת ביד, אחרת יריית קסם.
   בעולם ובכפר בלבד. הזירה והמובה של אוראל לא משתנים (להדליק שם: SKCAST.where).
   חיבור: skCast(id) מ-wskUse ומ-sigUse, skcClip(L) ב-syncPlayer (render3d.js), skcDraw() ב-render.js (רק בדו-ממד) */
const SKCAST={
  dur:0.42,        // שניות של התנועה (פלג הגוף העליון, הרגליים ממשיכות לרוץ)
  // בלי הכנה (ניר, 7.11, מסרטון של מפתח Diablo 3): הגיבור קופץ ישר לתנוחת המכה בפריים הראשון, והזמן הולך על ההמשך שאחרי.
  // skip: איזה חלק מתחילת האנימציה מדלגים (ההכנה). הסקיל עצמו יורה מיד בלחיצה ולא מחכה לאנימציה. לאויבים ההכנה נשארת, כאזהרה
  skip:0.35,
  where:()=>!!S&&(S.wd||S.vil)&&!S.room&&!S.mb,
  // kind (מהספר wskbook.js, ומסקיל החתימה sigskill.js) ← אנימציה. בלי kind: 'zap' לברק, 'ground' לאדמה, 'ring' לשאר
  anim:{
    dash:'Melee_1H_Attack_Chop', aura:'Melee_2H_Attack_Spin', guard:'Melee_Block', trap:'Melee_1H_Attack_Chop',
    zone:'shot', chain:'shot', zap:'shot', ring:'Ranged_Magic_Shoot',
    pull:'Ranged_Magic_Summon', summon:'Ranged_Magic_Summon', storm:'Ranged_Magic_Summon', rain:'Ranged_Magic_Summon',
    meteor:'Ranged_Magic_Spellcasting', vortex:'Ranged_Magic_Spellcasting',
    petrify:'Melee_2H_Attack_Chop', ground:'Melee_2H_Attack_Chop', nova:'Melee_2H_Attack_Chop', blade:'Melee_2H_Attack_Chop'
  },
  shot:{bow:'Ranged_Bow_Release',other:'Ranged_Magic_Shoot'},
  fallback:'Ranged_Magic_Spellcasting',
  // עיגול הרונות: עדין, כי סקילים חוזרים הרבה. מדבקה אחת לכל היותר (משתמשים שוב באותה), אז מאגר המדבקות לא מתמלא
  rune:{life:0.7,r:62,a:1,hdr:1.6,spin:2,fin:0.14,fade:0.4},   // ניר, 7.11: "המצלמה בעולם רחוקה": פי 1.5 מרוחב הדמות, ועם הילה. hdr: כמה זוהר (מעל 1 נכנס ל-bloom)
  // הבזק בידיים ברגע ההטלה, בצבע סוג הנזק. h: הגובה של הידיים (פיקסלים של המשחק)
  flash:{h:34,size:46,size2:80,life:[0.16,0.22],spark:10,light:6,lightT:0.3}
};
const skcStat={casts:0,runes:0};   // בשביל הבוט
let skcRune=null;                   // {t,col,id}: העיגול הנוכחי (גם לדו-ממד)
function skcKind(D){return D.kind||(D.range?'zap':D.dt==='earth'?'ground':'ring')}
function skCast(id){
  if(!SKCAST.where())return;
  const D=SKILLS.list[id];if(!D)return;
  P.skCast={n:(P.skCast?P.skCast.n:0)+1,k:skcKind(D),at:performance.now()};skcStat.casts++;
  const col=typeof skCol==='function'?skCol(id):dtCol(D.dt),R=SKCAST.rune;
  if(skcRune&&skcRune.d3&&typeof VFX3D!=='undefined')VFX3D.free(skcRune.d3);   // עיגול אחד בכל פעם
  skcRune={t:0,col};skcStat.runes++;
  if(typeof VFX3D==='undefined'||!R3D.on)return;
  // בכפר המדבקות כבויות (VFX3D.on רק בעולם). כמו האש של פיוחו (petfx3d.js), מדליקים לרגע את VFX3D.pet
  const was=VFX3D.pet,F=SKCAST.flash;VFX3D.pet=true;
  const d=skcRune.d3=VFX3D.decal('rune',P.x,P.y,R.r,{life:Infinity,col,a:0,hdr:R.hdr});   // הזמן לפי המשחק (skcUpdate), לא לפי הציור
  VFX3D.emit('glow',P.x,P.y,F.h,{n:1,raw:1,col,col2:col,hdr:2,size:F.size,size2:F.size2,life:F.life});
  VFX3D.emit('spark',P.x,P.y,F.h,{n:F.spark,col:'#ffffff',col2:col,spd:160,up:120,grav:-300,life:[0.2,0.4]});
  VFX3D.light(P.x,P.y,F.h,col,F.light,F.lightT);
  VFX3D.pet=was;
  if(d)d.spin=R.spin;
}
// איזו אנימציה לנגן (render3d.js). L: המראה של הגיבור (heroLook)
function skcClip(L){
  const k=P.skCast&&P.skCast.k;let c=SKCAST.anim[k]||SKCAST.fallback;
  if(c==='shot')c=L.anim.gunDraw&&P.weapon!=='sword'?SKCAST.shot.bow:SKCAST.shot.other;
  return R3D.clips[c+'@up']?c:SKCAST.fallback;
}
// העיגול הולך עם הגיבור. בתלת-ממד מזיזים את המדבקה, ובדו-ממד מציירים בקנבס, מתחת לדמויות
const skcAlpha=f=>{const R=SKCAST.rune;return R.a*(f<R.fin?f/R.fin:f>1-R.fade?(1-f)/R.fade:1)};
function skcUpdate(dt){
  if(!skcRune)return;skcRune.t+=dt;
  const d=skcRune.d3,f=skcRune.t/SKCAST.rune.life;if(d&&d.on){d.x=P.x;d.y=P.y;d.a=skcAlpha(Math.min(1,f))}
  if(f>=1){if(d&&typeof VFX3D!=='undefined')VFX3D.free(d);skcRune=null}
}
function skcDraw(){
  if(!skcRune||R3D.on&&skcRune.d3)return;
  const R=SKCAST.rune,f=skcRune.t/R.life,a=skcAlpha(f),r=R.r*(0.85+0.15*Math.min(1,f*4)),rot=skcRune.t*R.spin;
  ctx.save();ctx.translate(P.x,P.y+6);ctx.scale(1,0.5);ctx.globalAlpha=a;ctx.strokeStyle=skcRune.col;ctx.shadowColor=skcRune.col;ctx.shadowBlur=10;ctx.lineWidth=2.5;
  ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.stroke();ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,r*0.78,0,7);ctx.stroke();
  ctx.rotate(rot);ctx.beginPath();   // משולש כפול (מגן דוד של קווים) וסימנים בין הטבעות
  for(let j=0;j<2;j++)for(let i=0;i<=3;i++){const t=j*Math.PI/3+i*Math.PI*2/3;i?ctx.lineTo(Math.cos(t)*r*0.74,Math.sin(t)*r*0.74):ctx.moveTo(Math.cos(t)*r*0.74,Math.sin(t)*r*0.74)}
  for(let i=0;i<12;i++){const t=i*Math.PI/6;ctx.moveTo(Math.cos(t)*r*0.8,Math.sin(t)*r*0.8);ctx.lineTo(Math.cos(t)*r*0.96,Math.sin(t)*r*0.96)}
  ctx.stroke();ctx.restore();
}
