/* משחקי השאול: ראייה, ערפל ושיחים (אוראל, 6.11.2026. התוכנית: docs/moba-plan.md, סשן 2)
   כל קבוצה רואה רק מה שבטווח הראייה של אחד הגיבורים, החיילים, המגדלים או הבסיס שלה. אויב שהקבוצה של השחקן לא רואה לא מצויר בכלל
   (לא גוף, לא חיים, לא מספרים, לא במפה הקטנה), ואי אפשר לכוון אליו אוטומטית. סקיל של אזור עדיין פוגע בו.
   גיבור בשיח נסתר מהאויב גם בתוך הטווח שלו, אלא אם האויב עומד באותו שיח, או שהגיבור תקף או הטיל סקיל בשנייה האחרונה (bushReveal).
   החברים רואים אותו שקוף למחצה. מגדלים ובסיסים תמיד נראים, ויורים במי שבטווח כמו קודם.
   הבוטים רואים רק מה שהקבוצה שלהם רואה (moba-bot.js), ובוט שאיבד גיבור ליד שיח בודק את השיח לרגע (mbVisLost).
   השיחים: אותה רשימה שמצוירת (mbDecor ב-moba-look.js). שיחים שנוגעים זה בזה הם שיח אחד (u.bush הוא המספר שלו).
   לאחרים: mbSeen(u,team), mbInBush(u), mbVisReveal(x,y,r,t,team) (לחש החשיפה), mbShow(u) ו-mbVisPt(x,y) לציור */
const MBVIS={
  r:{hero:420,minion:300,tower:450,base:500},   // טווח הראייה
  bushReveal:1,     // שניות שגיבור חשוף אחרי תקיפה או סקיל מתוך שיח
  every:0.1,        // כל כמה שניות מחשבים מחדש מי רואה את מי
  allyFade:0.5,     // חבר בשיח: שקוף למחצה
  touch:0.9,        // שני עיגולי שיח נחשבים שיח אחד כשהמרחק קטן מסכום הרדיוסים כפול זה
  check:{bush:120,near:650,t:1.8,mem:2.5,hp:0.5},   // בוט שאיבד גיבור במרחק bush משיח, ובמרחק near ממנו: הולך לבדוק עד t שניות. mem: כמה זמן זוכרים איפה ראו. רק מעל hp מהחיים
};

/* ---- השיחים: עיגולים מ-mbDecor, מקובצים לשיחים ---- */
let MB_BUSH=null;
function mbBushes(){
  if(MB_BUSH)return MB_BUSH;
  const L=mbDecor().filter(d=>d.k==='bush').map(d=>({x:d.x,y:d.y,r:d.r,g:0})),par=L.map((_,i)=>i),root=i=>par[i]===i?i:(par[i]=root(par[i]));
  for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++)if(Math.hypot(L[i].x-L[j].x,L[i].y-L[j].y)<(L[i].r+L[j].r)*MBVIS.touch)par[root(i)]=root(j);
  const ids=new Map();for(let i=0;i<L.length;i++){const r=root(i);if(!ids.has(r))ids.set(r,ids.size+1);L[i].g=ids.get(r)}
  return MB_BUSH={list:L,n:ids.size};
}
// באיזה שיח היחידה עומדת: המספר של השיח, או 0. המרכז של היחידה בתוך אחד העיגולים של השיח (כמו שהוא מצויר)
function mbInBush(u){
  if(!u||u.k==='tower'||u.k==='base')return 0;
  for(const b of mbBushes().list)if(Math.abs(u.y-b.y)<b.r&&Math.hypot(u.x-b.x,u.y-b.y)<b.r)return b.g;
  return 0;
}

/* ---- מי רואה את מי. מחושב פעם ב-every שניות (MB.vis), ונשמר על כל יחידה ב-u.vis[קבוצה] ---- */
function mbVisNow(force){
  const M=MB;if(!M)return null;
  const V=M.vis||(M.vis={next:0,view:[[],[]],rev:[]});
  if(!force&&M.t<V.next)return V;
  V.next=M.t+MBVIS.every;V.rev=V.rev.filter(r=>r.until>M.t);V.view=[[],[]];
  for(const u of M.u){u.bush=u.dead?0:mbInBush(u);if(!u.dead)V.view[u.team].push({x:u.x,y:u.y,r:MBVIS.r[u.k]||0,b:u.bush})}
  for(const u of M.u)u.vis=u.dead?[false,false]:[0,1].map(tm=>u.team===tm||u.k==='tower'||u.k==='base'||mbVisSee(V,u,tm));
  return V;
}
const mbVisHid=u=>u.k==='hero'&&u.bush>0&&!(MB.t-(u.actT??-99)<MBVIS.bushReveal);   // מסתתר בשיח, ולא חשוף מתקיפה
function mbVisSee(V,u,tm){
  for(const r of V.rev)if(r.team===tm&&Math.hypot(u.x-r.x,u.y-r.y)<r.r+u.r)return true;   // חשיפה: רואים גם בתוך שיחים
  const hid=mbVisHid(u);
  for(const w of V.view[tm])if(Math.hypot(u.x-w.x,u.y-w.y)<=w.r&&(!hid||w.b===u.bush))return true;   // בשיח: רק מי שעומד באותו שיח
  return false;
}
// האם הקבוצה team רואה את היחידה u. קבוצה תמיד רואה את שלה, ומבנים תמיד נראים
function mbSeen(u,team){
  if(!MB||!u||u.team===team||u.k==='tower'||u.k==='base')return true;
  if(u.dead)return false;
  mbVisNow(!u.vis);return !!(u.vis&&u.vis[team]);   // יחידה חדשה (עוד לא חושבה): מחשבים עכשיו
}
// הקבוצה team רואה את האזור (כולל שיחים) למשך t שניות. לחש החשיפה (moba-spells.js)
function mbVisReveal(x,y,r,t,team){const V=mbVisNow();if(!V)return;V.rev.push({x,y,r,until:MB.t+t,team});mbVisNow(true)}
// לציור: מה שהקבוצה של השחקן רואה
const mbShow=u=>!MB||!MB.me||mbSeen(u,MB.me.team);
// נקודה שהקבוצה של השחקן רואה (מספרים, חלקיקים ויריות שלא קשורים ליחידה)
function mbVisPt(x,y){
  const V=mbVisNow();if(!V||!MB.me)return true;const tm=MB.me.team;
  for(const w of V.view[tm])if(Math.hypot(x-w.x,y-w.y)<=w.r+30)return true;
  for(const r of V.rev)if(r.team===tm&&Math.hypot(x-r.x,y-r.y)<=r.r)return true;
  return false;
}
// חבר בשיח: שקוף למחצה (גם השחקן עצמו, כדי שידע שהוא מוסתר)
const mbVisFade=u=>u.st&&u.st.veil>0&&!u.dead?MB_VEIL_A:MB&&MB.me&&u.team===MB.me.team&&u.k==='hero'&&!u.dead&&u.bush>0?MBVIS.allyFade:1;   // מתנקש מכוסה (היעלמות, moba-kits.js): שקוף לשני הצדדים

/* ---- בוטים: איבד גיבור ליד שיח? הולכים לבדוק אותו לרגע. seen: גיבורי האויב שהקבוצה רואה עכשיו. מחזיר נקודה או null ---- */
function mbVisLost(u,seen){
  const B=u.bot,C=MBVIS.check,mem=B.saw||(B.saw=new Map());
  for(const o of seen)mem.set(o,{x:o.x,y:o.y,t:MB.t});
  const close=seen.some(o=>Math.hypot(o.x-u.x,o.y-u.y)<C.near);   // רואים גיבור קרוב: אין מה לבדוק
  if(B.chk&&(MB.t>B.chk.until||Math.hypot(u.x-B.chk.x,u.y-B.chk.y)<30||close))B.chk=null;
  if(!B.chk&&!close&&u.hp>u.max*C.hp)for(const [o,p] of mem){
    if(o.dead||MB.t-p.t>C.mem||p.done||Math.hypot(u.x-p.x,u.y-p.y)>C.near){if(o.dead||MB.t-p.t>C.mem)mem.delete(o);continue}
    if(mbBushes().list.some(b=>Math.hypot(p.x-b.x,p.y-b.y)<C.bush+b.r)){p.done=true;B.chk={x:p.x,y:p.y,until:MB.t+C.t};break}}
  return B.chk;
}

/* ---- חיבורים מבחוץ ---- */
// סקיל מתוך שיח חושף (התקיפה הרגילה: u.actT ב-mbAttack)
(function(){const base=mbCast;window.mbCast=function(u){if(u)u.actT=MB?MB.t:0;return base.apply(this,arguments)}})();
// תלת-ממד: חבר בשיח שקוף למחצה. האויבים שלא רואים בכלל לא נכנסים ל-enemies (moba.js)
(function(){
  if(typeof syncEnemy!=='function')return;
  const fade=(a,k)=>{if(!a||!a.mats||a.vf===k)return;a.vf=k;for(const m of a.mats){m.transparent=k<1;m.opacity=k;m.needsUpdate=true}};
  const be=syncEnemy;window.syncEnemy=function(e,dt){const r=be(e,dt);if(S.mb&&e&&e.k==='hero')fade(R3D.actors.get(e),mbVisFade(e));return r};
  const bp=syncPlayer;window.syncPlayer=function(dt){const r=bp(dt);if(R3D.player)fade(R3D.player,S.mb&&MB&&MB.me?mbVisFade(MB.me):1);return r};
})();
