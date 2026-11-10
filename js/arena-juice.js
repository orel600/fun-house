/* אפקטים של קרב בזירה, גרסה קלה ומסוננת (אוראל, 2.11.2026 לילה: "שיפורים בכפתורים ובגרפיקה").
   בעולם ובכפר juice.js עושה הכל. בזירה הוא כבוי (JUICE.where.arena=false), כי יש מאות אויבים וזה היה כבד ועמוס.
   כאן מדליקים חלק קטן ממנו, מבחוץ, בלי לשנות את juice.js:
   - הבזק פגיעה וניצוצות קטנים בצורת סוג הנזק, רק ממכה של הנשק או סקיל של השחקן (לא חיית מחמד, לא ברק שקפץ),
     עם תקרה לכל פריים. כשיש הרבה אויבים על המסך, רק מכה קריטית או מכה באויב-על מקבלת אפקט
   - "פוף" בהריגה רק לאויב-על, אלוף ובוס
   - עצירה קצרה רק במכה קריטית באויב-על או בבוס, ואף פעם בגל גדול
   - מספרי הנזק נשארים של הזירה (מתמזגים, arenaui.js). רק הקריטי צהוב, כמו ב-juice.js
   "פחות אפקטים" בהגדרות, או "הפחתת תנועה" בטלפון, מכבים הכל. כל המספרים ב-JUICE.arena */

JUICE.arena={
  on:true,
  src:{gun:1,sword:1,skill:1,orbit:1},   // ממה מגיעה מכה שמקבלת אפקט: הנשק (קשת, חרב) וסקילים
  perFrame:4,                // כמה אפקטים חדשים לכל היותר בפריים אחד
  crowd:200,                 // מעל כך אויבים על המסך: רק קריטי או אויב-על מקבלים אפקט
  stopCrowd:40,              // מעל כך אויבים על המסך: בלי עצירה בכלל
  parts:{max:60,hit:3,weak:4,crit:6},   // ניצוצות: תקרה על המסך וכמה בכל מכה
  impact:{max:6,r:0.7},      // הבזקי פגיעה על המסך, וגודל ביחס לעולם
  poof:{max:4}               // ענני הריגה על המסך
};
const AJ={f:-1,n:0,seen:0,src:null,stat:{fx:0,skip:0,stops:0,poofs:0}};   // מונה לפריים, וספירה לבדיקה (tools/check.js)
// דולק רק בזירה (הקלאסית או זירת הגלים), כשהמתג של juice.js כבוי, ובלי "פחות אפקטים" ו"הפחתת תנועה"
const ajOn=()=>JUICE.arena.on&&!!S&&S.mode==='play'&&!S.wd&&!S.vil&&!JUICE.where.arena&&!RM&&!fxLess()&&!(typeof MB!=='undefined'&&MB);
const ajBig=e=>!!(e.isBoss||e.elite||e.champ||e.wanted||e.leader);
// כמה אויבים חיים על המסך, פעם אחת לפריים (S.t משתנה בכל פריים)
function ajFrame(){if(AJ.f===S.t)return;AJ.f=S.t;AJ.n=0;let c=0;const hw=W/2+40,hh=H/2+60;
  for(const e of enemies)if(!e.dead&&Math.abs(e.x-S.cam.x)<hw&&Math.abs(e.y-S.cam.y)<hh)c++;AJ.seen=c}

// מי פגע: damage (combat.js) נעטף כדי לדעת את הנשק ואם זו קפיצה של ברק
(()=>{const old=damage;damage=function(e,base,w,ang,t,chained){const s=AJ.src;AJ.src={w,ch:!!chained};try{return old.apply(this,arguments)}finally{AJ.src=s}}})();

// juiceHit מחזיר false בזירה, ואז הזירה מציירת את המספר והניצוצות שלה. כאן מוסיפים מעליהם
(()=>{const old=juiceHit;juiceHit=function(e,d,m,crit,t,ang){const r=old.apply(this,arguments);
  if(!r&&ajOn()&&AJ.src&&!AJ.src.ch&&JUICE.arena.src[AJ.src.w]&&!e.node)ajHit(e,m,crit,t,ang);return r}})();
function ajHit(e,m,crit,t,ang){
  const A=JUICE.arena,K=JUICE,big=ajBig(e);ajFrame();
  if(AJ.n>=A.perFrame||(AJ.seen>A.crowd&&!crit&&!big)){AJ.stat.skip++;return}
  AJ.n++;AJ.stat.fx++;const J=juice();
  e.flash=Math.max(e.flash||0,A.flash??K.flash);e.jT=jNow();   // לבן (A.flash: מ-arena-feel.js, 60ms) ומעיכה קטנה בתלת-ממד
  const hy=e.y-e.r*0.6,P_=A.parts,n=Math.min(crit?P_.crit:m>1?P_.weak:P_.hit,P_.max-J.p.length);
  const local=typeof kineticHere==='function'&&kineticHere()&&AJ.src&&(AJ.src.w==='sword'||AJ.src.w==='gun');
  if(n>0&&!local)jBurst(e.x,hy,t,n,ang);
  if(!local&&(m>=1||crit)){while(J.fl.length>=A.impact.max)J.fl.shift();
    J.fl.push({x:e.x-Math.cos(ang||0)*e.r*0.4,y:hy,t0:jNow(),r:(crit?K.impact.rCrit:K.impact.r*(m>1?1.25:1))*A.impact.r,col:dtCol(t),a:rand(0,1.6)})}
  if(crit&&big&&AJ.seen<=A.stopCrowd){const h0=S.hitstop;jStop(K.stop.crit);if(S.hitstop>h0)AJ.stat.stops++}
}
// "פוף" בהריגה: רק אויב-על, אלוף ובוס. בלי עצירה, בלי רעידה ובלי רצף (אלה של העולם)
(()=>{const old=juiceKill;juiceKill=function(e){old.apply(this,arguments);
  if(juiceOn()||!ajOn()||!ajBig(e))return;
  if(typeof ARFX!=='undefined'&&!fxLess()&&typeof fxImg==='function'&&fxImg(e.isBoss?'ko_boss':'ko'))return;   // MLBB 3.3: אירוע אחד = רגע אחד. הגיליון ko/ko_boss (arena-fx.js) הוא הרגע, והפוף רק כשהוא לא יוצג
  const J=juice(),K=JUICE.poof;while(J.poofs.length>=JUICE.arena.poof.max)J.poofs.shift();
  const pf=[];for(let i=0;i<K.puffs;i++)pf.push({a:rand(0,6.28),s:rand(20,55),r:rand(...K.r)});
  J.poofs.push({x:e.x,y:e.y,t0:jNow(),pf,r:e.r*(e.big||1),col:dtCol(e.weak)});AJ.stat.poofs++}})();
// מספר קריטי בזירה בצבע הקריטי של juice.js (צהוב), כדי שייראה אותו דבר בכל מקום
(()=>{const old=dmgFloat;dmgFloat=function(e,d,col,size,crit){if(crit&&ajOn())col=JUICE.nums.critCol;return old.call(this,e,d,col,size,crit)}})();
