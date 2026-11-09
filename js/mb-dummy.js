/* משחקי השאול: מגרש אימון מול בובה (MBDUMMY, השיפוץ, MAX ל-BOB, 10.11.2026). רק ב-overhaul/preview, לבדיקה ולצילום (הפרוטוקול של QUINN).
   ?mbdummy=1: אתה והגיבור שבחרת מול גיבור אחד של האויב (&dummy=<ערכה>, ברירת מחדל warrior) שעומד מולך, לא זז ולא תוקף, וחוזר לחיים מלאים כשהוא נמוך.
   בלי חיילים ובלי מגדלים. התקיפה, הסקילים, הנזק והזמנים הם של המשחק עצמו, בלי שינוי.
   &dummyauto=1: הגיבור שלך תוקף לבד ומפעיל את s1 (ואחר כך s2 וסקיל-העל) כשהם מוכנים, לצילום בלי ידיים. מחיקה: הקובץ והשורה ב-index.html */
const MBDUMMY={
  on:/[?&]mbdummy=1(&|$)/.test(location.search),
  kit:(location.search.match(/[?&]dummy=([a-z]+)/)||[])[1]||'warrior',
  auto:/[?&]dummyauto=1(&|$)/.test(location.search),
  cast:((location.search.match(/[?&]dummycast=([a-z0-9,]+)/)||[])[1]||'s1,s2,ult').split(','),   // אילו סקילים מופעלים לבד (&dummycast=s1: רק הסדן, כדי לצלם סקיל אחד בלי שאחר יכסה אותו)
  banners:false,   // הודעות באמצע המסך (טיפים, "המשחק התחיל"): כבויות במגרש האימון, הן מכסות את הצילום
  gap:90,          // המרחק בין הגיבור שלך לבובה בהתחלה (יחידות משחק)
  heal:0.25,       // מתחת לחלק הזה מהחיים, הבובה חוזרת לחיים מלאים
  stat:{starts:0,heals:0,casts:0}
};
(function(){
  if(!MBDUMMY.on||typeof mobaStart!=='function')return;
  const bs=mobaStart;mobaStart=function(kit){
    const r=bs.apply(this,arguments),M=MB,X=MBDUMMY;if(!M)return r;
    const me=M.me,d=mbHero(MBKIT[X.kit]?X.kit:'warrior',1,false,0);d.dummy=true;
    M.u=[me,d];M.waveT=1e9;M.queue=[];me.x=-120;me.y=0;d.x=me.x+X.gap;d.y=0;d.home={x:d.x,y:d.y};d.face=d.rot=Math.PI;me.face=me.rot=0;
    P.x=me.x;P.y=me.y;S.cam.x=P.x;S.cam.y=P.y;X.stat.starts++;return r};
  if(!MBDUMMY.banners&&typeof mbBanner==='function'){const bn=mbBanner;mbBanner=function(){if(S.mb)return;return bn.apply(this,arguments)}}   // הקובץ רץ רק במגרש האימון (MBDUMMY.on), ושם גם הודעת הפתיחה מכסה
  // הבובה: לא זזה, לא תוקפת, וחוזרת לחיים מלאים
  const bb=mbBot;mbBot=function(u,dt){
    if(u.dummy){u.moving=false;u.vs=0;if(u.hp<u.max*MBDUMMY.heal){u.hp=u.max;MBDUMMY.stat.heals++}return}
    return bb.apply(this,arguments)};
  // אתה בלי ידיים: הולך אל הבובה, תוקף, ומפעיל סקיל כשמוכן
  if(MBDUMMY.auto){const bp=mbPlayer;mbPlayer=function(u,dt){
    const d=MB.u.find(o=>o.dummy&&!o.dead);if(!d)return bp.apply(this,arguments);
    const A=MBKIT[u.kit].atk;if(mbDist(u,d)-d.r-u.r>A.range*0.8)mbMove(u,d.x,d.y,dt,A.range*0.6);else{u.moving=false;mbAttack(u,dt,d,A)}
    // כיוון אוטומטי של המשחק (mbPress בלי נקודה): הגיבור הקרוב בטווח, כלומר הבובה. סקיל-העל רק כשהוא פתוח (אחרת הכפתור רועד)
    for(const s of MB_SLOTS)if(MBDUMMY.cast.includes(s)&&u.cd&&!(u.cd[s]>0)&&MB.t>1&&(s!=='ult'||u.lvl>=MOBA.ultAt)){mbPress(s);MBDUMMY.stat.casts++;break}}}
})();
