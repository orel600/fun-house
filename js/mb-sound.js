/* משחקי השאול: צליל זהות לכל פעולה של גיבור (MBSND, השיפוץ, BOB, 10.11.2026, לפי המניפסט של משחקי השאול). רק צליל, ?mbsnd=0 מכבה.
   שלוש שכבות לכל היותר בפריים: צליל סוג הנזק בהטלה (sfxCast, moba-kits.js, כבר קיים), וכאן צליל הזהות של הפעולה, ברגע שלה:
   - cast: ברגע ההטלה (mbCast), לסקילים שפוגעים מיד או שהגוף שלהם מתחיל שם.
   - land: כשאזור נוחת (mbAnimLand, moba-skill-anim.js): הסדן, גשם החצים, כלא המים והסופה.
   - net: הרשת נסגרת על גיבור (mbfxHit עם 'net'). markPop: סימן המוות מתפוצץ (mbMarkClear כשהזמן נגמר).
   הטנק: התקיפה הרגילה, השאגה והחומה כבר מנגנים (mb-atk3d.js, mb-tankskill3d.js). התקיפות הרגילות האחרות נשארות hit ו-shoot.
   שומעים רק את הגיבור שלך, או מה שהקבוצה רואה (mbfxOn), כמו שאר הצלילים. k: עוצמה יחסית. מחיקה: הקובץ, השורה ב-index.html והשורות ב-audio.js */
const MBSND={
  on:!/[?&]mbsnd=0(&|$)/.test(location.search),
  cast:{
    warrior:{s1:'whoosh_blade',s2:'sweep_spin',ult:'cry_war'},
    hunter:{s1:'bow_release',s2:'bow_release'},
    mage:{s1:'wave_surge'},
    assassin:{s1:'whoosh_blade',s2:{id:'whoosh_blade',k:0.6},ult:'mark_seal'}},
  land:{anvil:'imp_anvil',rain:'rain_volley',bubble:'bubble_pop',blizzard:'frost_crack'},
  net:'net_catch',markPop:'mark_pop',
  stat:{played:0}
};
function mbSnd(e,x,y,me){
  if(!MBSND.on||!e||typeof sfx!=='function')return;
  if(!me&&typeof mbfxOn==='function'&&!mbfxOn(x,y))return;   // בערפל: לא מסגירים
  const id=typeof e==='string'?e:e.id;sfx(id,e.k||1);MBSND.stat.played++;
}
(function(){
  if(!MBSND.on)return;
  if(typeof mbCast==='function'){const b=mbCast;mbCast=function(u,slot){const r=b.apply(this,arguments);
    if(r&&u&&u.k==='hero'){const T=MBSND.cast[u.kit];if(T&&T[slot])mbSnd(T[slot],u.x,u.y,u.me)}return r}}
  if(typeof mbAnimLand==='function'){const b=mbAnimLand;mbAnimLand=function(id,x,y){const r=b.apply(this,arguments);if(MBSND.land[id])mbSnd(MBSND.land[id],x,y,false);return r}}
  if(typeof mbfxHit==='function'){const b=mbfxHit;mbfxHit=function(o,kind){const r=b.apply(this,arguments);if(kind==='net'&&o)mbSnd(MBSND.net,o.x,o.y,o.me);return r}}
  if(typeof mbMarkClear==='function'){const b=mbMarkClear;mbMarkClear=function(u){const pop=u&&u.mark&&!u.dead&&MB.t>=u.mark.end;const r=b.apply(this,arguments);if(pop)mbSnd(MBSND.markPop,u.x,u.y,u.me);return r}}
})();
