/* תחושת קרב בזירה ובמשחקי השאול (אוראל, 8.11.2026, docs/concept/arena-feel.md, אושר ב-#502).
   רק הצגה ותחושת שליטה: נזק, קירור, מתי הנזק נוחת, קושי ואיזון לא משתנים.
   משלים את מה שכבר יש (arena-juice.js: ניצוצות והבזק, moba-fx.js: עצירה והילוך איטי בשאול), ולא נוגע ב-juice.js, hitfeel.js,
   skillcast.js או vfx3d.js: הכל עוטף מבחוץ, עם שומר "רק בזירה" (afArena) או "רק בשאול" (S.mb). בעולם ובכפר כלום לא משתנה.
   1. עצירת פריים בשלוש מדרגות, בלי הצטברות ועם תקרה לשנייה. 2. רעידה מדורגת. 3. הבזק 60ms, ונטייה אחורה מ-hitfeel.js.
   4. תנועת הטלה (הקליפים של skillcast.js) שמגיעה לשיא ברגע הנזק, וכפתור "מתנשף" לפני שהוא מוכן. 5. חוצץ לחיצה של 150ms.
   6. "Rampage!" מ-3 הריגות ברצף (streak.js), ועמוד אור ברצף. 7. הצליל כבר באותו פריים של העצירה.
   "הפחתת תנועה" (SAVE.calm בהגדרות, או של הטלפון: RM) מכבה רעידה, עצירה והילוך איטי בזירה ובשאול */
const ARFEEL={
  on:true,                      // הבדיקה האוטומטית יכולה לכבות בבלוקים שצריכים מספר פריימים קבוע
  stop:{hit:0.035,big:0.1,crowdHit:40,crowdKill:12,gap:0.22,budget:0.15},   // שניות. hit: מכה של השחקן (עד crowdHit אויבים על המסך). big: קריטי, או הריגה כשיש עד crowdKill. gap: בין עצירות. budget: תקרה לשנייה
  slow:{t:0.18,k:0.35},         // הריגת אויב-על או בוס: הילוך איטי (S.slow ב-main.js, ×0.35 קבוע שם)
  shake:{hurt:3,kill:1.5,killCrowd:20,big:8},   // פגיעה בך (היה 7), הריגה (רק עד killCrowd על המסך), אויב-על או בוס
  flash:0.06,                   // הבזק לבן על אויב שנפגע (JUICE.arena.flash, היה 0.14)
  cast:{quake:'ground',flame:'nova',splash:'summon',bloom:'summon',frost:'meteor',comet:'meteor',zap:'zap',lance:'zap',ult:'aura'},   // סקיל בזירה ← סוג תנועה ב-SKCAST.anim (skillcast.js)
  soon:0.12,                    // כמה שניות לפני שהסקיל מוכן הכפתור "מתנשף"
  buf:0.15,                     // חוצץ: לחיצה שנשארו לה עד כך שניות קירור נשמרת, ויוצאת ברגע שהסקיל מוכן
  rampage:{n:3,pillar:{r:34,h:260,life:0.6},col:'#FF8A3D'},   // מ-3 הריגות ברצף: מילה ועמוד אור (פעם אחת לרצף)
  pillar:{r:30,h:220,life:0.6}, // עמוד אור במדרגות הקיימות של הרצף (10/25/50/100)
  mb:{heroKill:0.11}            // משחקי השאול: הריגת גיבור על ידך
};
const AF={last:-9,win:0,used:0,buf:null,mbBuf:null,n:0,stat:{stops:0,slows:0,cut:0,casts:0,buffered:0,rampage:0,pillars:0}};
// הפחתת תנועה: המתג במשחק, או ההגדרה של הטלפון
const calmOn=()=>(typeof RM!=='undefined'&&RM)||(typeof SAVE!=='undefined'&&!!SAVE&&!!SAVE.calm);
function setCalm(on){SAVE.calm=!!on;saveNow();showCalm()}
function showCalm(){for(const b of document.querySelectorAll('[data-calm]'))b.setAttribute('aria-pressed',String((b.dataset.calm==='1')===!!(SAVE&&SAVE.calm)))}
for(const b of document.querySelectorAll('[data-calm]'))b.onclick=()=>{setCalm(b.dataset.calm==='1');sfx('ui')};
showCalm();
// רק בזירה (גם האתגר), לא בעולם, בכפר, בחדר הבונוס או בשאול
const afArena=()=>ARFEEL.on&&!!S&&S.mode==='play'&&!S.wd&&!S.vil&&!S.room&&!S.mb;
function afClock(){return performance.now()/1000}   // בזמן עצירה S.t לא זז, ולכן התקרה והמרווח לפי השעון. פונקציה (לא const): הבדיקה מחליפה את השעון
const afBig=e=>!!(e.isBoss||e.elite||e.champ||e.wanted||e.leader);

// עצירה: לא מצטברת (הגדולה מנצחת), מרווח בין עצירות, ותקרה לשנייה
function afStop(t){
  if(calmOn())return false;const now=afClock(),P_=ARFEEL.stop;
  if(now-AF.win>=1){AF.win=now;AF.used=0}
  if(S.hitstop>0||now-AF.last<P_.gap||AF.used+t>P_.budget){AF.stat.cut++;return false}
  S.hitstop=t;AF.last=now;AF.stat.stops++;return true;   // AF.used נספר ב-afTick לפי הזמן שבאמת עמד, מכל מערכת
}

// 1+3. מכה של השחקן בזירה: עצירה לפי מדרגה, הבזק קצר ונטייה אחורה (hitfeel.js)
(()=>{const old=juiceHit;juiceHit=function(e,d,m,crit,t,ang){const r=old.apply(this,arguments);
  if(r||!afArena()||typeof AJ==='undefined'||!AJ.src||AJ.src.ch||!JUICE.arena.src[AJ.src.w]||e.node)return r;
  ajFrame();if(typeof hfHit==='function')hfHit(e,m,crit,ang);   // הנטייה אחורה של ניר, דרך HITFEEL.where.arena (למטה)
  if(AJ.seen<=ARFEEL.stop.crowdHit){if(crit)afStop(ARFEEL.stop.big);else if(m>=1)afStop(ARFEEL.stop.hit)}   // מעל crowdHit על המסך: בלי עצירה בכלל, גם בקריטי (כמו JUICE.arena.stopCrowd)
  return r}})();
if(typeof JUICE!=='undefined'&&JUICE.arena)JUICE.arena.flash=ARFEEL.flash;   // arena-juice.js קורא את זה (במקום JUICE.flash של העולם)
if(typeof HITFEEL!=='undefined')HITFEEL.where.arena=true;   // החלטת אוראל (#502): הנטייה של hitfeel.js בזירה, בלי לשכפל אותה. hfOn עדיין כבוי ב-RM
// 7. צליל: sfx('hit') ב-damage (combat.js) נשמע באותו פריים שהעצירה מתחילה, ולכן הוא כבר מסונכרן. jSnd הוא const ולא נעטף

// 1+2. הריגה בזירה: עצירה גדולה כשיש מעט על המסך, הילוך איטי באויב-על ובבוס, ורעידה מדורגת
(()=>{const old=kill;kill=function(e){const r=old.apply(this,arguments);if(!afArena()||e.node)return r;
  const big=afBig(e),Sh=ARFEEL.shake;if(typeof ajFrame==='function')ajFrame();const seen=typeof AJ!=='undefined'?AJ.seen:0;
  if(big&&!calmOn()){S.slow=Math.max(S.slow||0,ARFEEL.slow.t);AF.stat.slows++}else if(seen<=ARFEEL.stop.crowdKill)afStop(ARFEEL.stop.big);
  if(!calmOn())S.shake=Math.max(S.shake,big?Sh.big:seen<=Sh.killCrowd?Sh.kill:0);
  return r}})();
// 2. פגיעה בך: רעידה קטנה יותר (combat.js שם 7)
(()=>{const old=hurt;hurt=function(d){const s0=S.shake,r=old.apply(this,arguments);if(afArena()&&S.shake>s0)S.shake=Math.max(s0,calmOn()?0:ARFEEL.shake.hurt);return r}})();

// 4+5. הטלה בזירה: תנועת הגוף העליון מ-skillcast (render3d.js מנגן את P.skCast), שמתחילה בשיא, באותו פריים של הנזק.
// לחיצה מוקדמת (עד buf שניות לפני שהסקיל מוכן) נשמרת, ויוצאת ב-afTick
function afCast(id){const k=ARFEEL.cast[id];if(!k)return;P.skCast={n:(P.skCast?P.skCast.n:0)+1,k,at:performance.now()};AF.stat.casts++}
(()=>{const old=skillUse;skillUse=function(id){const r=old.apply(this,arguments);if(!afArena())return r;
  if(r){afCast(id);if(AF.buf&&AF.buf.id===id)AF.buf=null;return r}
  const k=S.sk,i=k?k.ids.indexOf(id):-1;if(i>=0&&k.cd[i]>0&&k.cd[i]<=ARFEEL.buf){AF.buf={id,until:afClock()+ARFEEL.buf};AF.stat.buffered++}
  return r}})();
(()=>{const old=ultUse;ultUse=function(){const r=old.apply(this,arguments);if(r&&afArena())afCast('ult');return r}})();

// 6. רצף הריגות (streak.js): "Rampage!" מ-3 ברצף, פעם אחת לרצף, ועמוד אור גם במדרגות הקיימות
function afPillar(c,o){if(typeof VFX3D==='undefined'||!VFX3D.on||!VFX3D.on()||VFX3D.quality()!=='hi'||fxLess())return;
  if(VFX3D.pillar(P.x,P.y,o.r,o.h,c,{life:o.life}))AF.stat.pillars++}
(()=>{const old=streakKill;streakKill=function(){const s0=S.st,r=old.apply(this,arguments),s=S.st;if(!afArena()||!s)return r;
  const R=ARFEEL.rampage;
  if(s.n===R.n&&!s.ramp){s.ramp=true;AF.stat.rampage++;
    floatText(P.x,P.y-P.r-46,T('feel.rampage'),R.col,22,false,true);
    if(!fxLess()&&typeof fxPlay==='function'&&typeof SKANIM!=='undefined'){const Wd=SKANIM.word;fxPlay(Wd.fx,P.x,P.y-P.r-52,{size:Wd.size,sx:Wd.sx,alpha:Wd.alpha,vy:Wd.vy})}
    afPillar(R.col,R.pillar);sfx('streak1')}
  if(s.show&&s.show.t0===S.t&&s.n>R.n)afPillar(STREAK.ring,ARFEEL.pillar);   // מדרגה של streak.js (10/25/50/100) עכשיו
  return r}})();

// התקרה לשנייה, אמיתית: כל פריים שבו הזירה או השאול עומדים נספר, מכל מערכת (arena-feel, arena-juice, skill-anim, eliteDown,
// moba-fx), ומעל budget העצירה נחתכת (QUINN, #508: נמדדו עד 184ms ב-9 עצירות מכמה מערכות יחד)
function afCap(){
  const now=afClock(),dt=Math.min(0.1,now-(AF.tk??now));AF.tk=now;if(now-AF.win>=1){AF.win=now;AF.used=0}
  const B=ARFEEL.stop.budget;
  if(S.mb&&typeof MB!=='undefined'&&MB&&MB.fxs){const F=MB.fxs;if(F.stop>0){AF.used+=dt;if(AF.used>=B){F.stop=0;AF.stat.cut++}}}
  else if(!S.wd&&!S.vil&&!S.room&&S.hitstop>0){AF.used+=dt;if(AF.used>=B){S.hitstop=0;AF.stat.cut++}}
}
// כל פריים (render, גם בזמן עצירה): התקרה, החוצץ, הכפתור "מתנשף", והפחתת תנועה
function afTick(){
  if(!S)return;if(ARFEEL.on&&S.mode==='play')afCap();
  if(calmOn()&&!S.wd&&!S.vil){S.shake=0;if(!S.mb){S.hitstop=0;S.slow=0}}   // הפחתת תנועה: בזירה ובשאול בלי רעידה, עצירה והילוך איטי
  if(afArena()&&S.sk){
    const k=S.sk,b=AF.buf;
    if(b){const i=k.ids.indexOf(b.id);if(i<0||afClock()>b.until)AF.buf=null;else if(k.cd[i]<=0&&!(S.hitstop>0)){AF.buf=null;skillUse(b.id)}}
    const box=document.getElementById('skills');if(box)k.ids.forEach((id,i)=>{const el=box.children[i];if(!el)return;const on=k.cd[i]>0&&k.cd[i]<=ARFEEL.soon;if(el.classList.contains('afsoon')!==on)el.classList.toggle('afsoon',on)});
  }
  if(S.mb&&MB&&AF.mbBuf){const b=AF.mbBuf,u=mbMe();if(!u||u.dead||MB.over||afClock()>b.until)AF.mbBuf=null;else if(u.cd[b.slot]<=0){AF.mbBuf=null;mbPress(b.slot,b.pt)}}
}
(()=>{const old=render;render=function(){afTick();return old.apply(this,arguments)}})();

/* ---- משחקי השאול ---- */
// 5. חוצץ: לחיצה על סקיל שנשארו לו עד buf שניות נשמרת (היום היא רק נבלעת)
(()=>{const old=mbPress;mbPress=function(slot,pt){const u=MB&&mbMe();
  if(ARFEEL.on&&u&&!u.dead&&!MB.over&&MB_SLOTS.includes(slot)&&u.cd[slot]>0&&u.cd[slot]<=ARFEEL.buf&&!(slot==='ult'&&u.lvl<MOBA.ultAt)){AF.mbBuf={slot,pt,until:afClock()+ARFEEL.buf};AF.stat.buffered++;return}
  return old.apply(this,arguments)}})();
// 1. הריגת גיבור על ידך: עצירה של 110ms. אותה עצירה של moba-fx.js (mbfxTime מחזיר dt=0, וכל המשחק עומד יחד: קירור, בוטים, גלים, MB.t)
(()=>{const old=mbDie;mbDie=function(t,src){const r=old.apply(this,arguments);
  if(ARFEEL.on&&S.mb&&MB&&t&&t.k==='hero'&&src&&src.me&&!calmOn()){const F=mbfxS(),now=afClock();if(now-AF.win>=1){AF.win=now;AF.used=0}
    if(F.stop<=0&&AF.used+ARFEEL.mb.heroKill<=ARFEEL.stop.budget){F.stop=ARFEEL.mb.heroKill;AF.stat.stops++}}   // הזמן עצמו נספר ב-afCap
  return r}})();
// הפחתת תנועה בשאול: בלי העצירה וההילוך האיטי של moba-fx.js
(()=>{const old=mbfxTime;mbfxTime=function(dt){if(calmOn()&&MB){const F=mbfxS();F.stop=0;F.slow=0}return old.apply(this,arguments)}})();
