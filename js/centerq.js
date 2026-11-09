/* תור ההודעות במרכז, בזירה (MLBB גל 3.1, docs/concept/mlbb-fx-plan.md חלק 7, אוראל 8.11.2026).
   הבעיה: בזירה כמה מערכות כותבות למרכז העליון בלי לדעת זו על זו. banner (progression.js) מחליף את עצמו, מילת הרצף
   (streak.js) מצוירת על הקנבס באותו גובה, ו"First kill today" ו-"New in the book!" צפות שם. בצילום בתלת-ממד (#537)
   "Loot explosion!" נחתה בדיוק על "Streak!".
   כאן: תור אחד. אף פעם לא שתי הודעות במרכז יחד. הודעה חשובה (סכנה) קופצת לראש התור, ואם צריך מחליפה מיד את מה שמוצג.
   הודעה רגילה מחכה עד ttl שניות, ואחר כך נזרקת (אין טעם ב-"Streak!" של לפני שתי שניות). כל הודעה מוצגת לפחות min שניות.
   כל סוג מצויר כמו קודם (banner ב-HTML, הרצף על הקנבס). התור רק מחליט מתי.
   משחקי השאול: יש להם תור משלהם (mbBanner ב-moba.js), ושם הכל עובר כמו קודם. בעולם ובכפר: עמודת ההודעות (msglane.js).
   חיבורים: עוטף את banner ואת streakShow בטעינה, ואת reset. loot.js ו-book.js שולחים לכאן (cqSay) בזירה במקום טקסט צף.
   מחיקה: הקובץ, השורה ב-index.html, והשורות עם cqSay ב-loot.js וב-book.js */
const CQ={
  on:true,
  max:3,          // כמה מחכות לכל היותר (הכי פחות חשובה נזרקת)
  ttl:2,          // שניות שהודעה רגילה יכולה לחכות
  min:0.9,        // כל הודעה מוצגת לפחות כך, לפני שמישהי שמחכה מחליפה אותה
  // עדיפות לפי מפתח הטקסט (lang.js): 2 סכנה, קופצת. 0 מידע, אחרונה. כל השאר 1
  hi:['pace.peak','st.elite','st.swarm','wave.last','wave.ring','bossDown','rage1','rage2','phase2'],   // סכנה, ורגעי בוס וגל שאסור לאבד (QUINN, #545: "Final wave" נזרק)
  lo:['loot.first','book.new'],
  clock:null,     // לבדיקה: פונקציה שמחזירה שניות במקום performance.now
  stat:{shown:0,jumped:0,dropped:0,stale:0,overlap:0,maxQ:0}
};
const CQS={cur:null,q:[],raw:null,rawStreak:null};
const cqOn=()=>CQ.on&&typeof skArena==='function'&&skArena()&&!(typeof S!=='undefined'&&S&&S.mb);
const cqNow=()=>CQ.clock?CQ.clock():performance.now()/1000;
// עדיפות של טקסט: משווים לטקסט של המפתחות (גם מפתח עם פרמטר: לפי מה שלפני הפרמטר)
function cqPri(txt){
  const m=k=>{const v=TEXT[k]&&(TEXT[k].en??TEXT[k].he);if(typeof v==='function'){const [a,b='']=String(v('\u0001')).split('\u0001');return a.length+b.length>2&&txt.startsWith(a)&&txt.endsWith(b)}return v===txt};   // גם פרמטר בהתחלה ('n is furious')
  return CQ.hi.some(m)?2:CQ.lo.some(m)?0:1;
}
// כמה הודעות מרכז על המסך עכשיו (לבוט, ולמונה overlap)
function cqVisible(){const b=document.getElementById('banner');return (b&&b.classList.contains('on')?1:0)+(S&&S.st&&S.st.show?1:0)}
function cqShow(it){
  if(cqVisible()>0&&!it.same)CQ.stat.overlap++;   // לא אמור לקרות: מה שהיה הוסתר לפני
  CQS.cur=it;it.t0=cqNow();CQ.stat.shown++;it.show();
}
function cqHide(){const c=CQS.cur;CQS.cur=null;if(c)c.hide()}
// הודעה חדשה: it={kind,pri,dur,show,hide,key}
function cqPush(it){
  it.at=cqNow();
  const c=CQS.cur,Q=CQS.q;
  if(it.key){for(let i=Q.length-1;i>=0;i--)if(Q[i].key===it.key)Q.splice(i,1)}   // אותו סוג שמחכה (רצף, אותו טקסט): רק האחרונה
  if(!c){cqShow(it);return}
  if(c.key&&c.key===it.key){CQS.cur=null;c.hide();it.same=true;cqShow(it);return}   // אותו סוג על המסך (רצף אחרי רצף): החדש מחליף מיד
  if(it.pri>c.pri&&it.pri>=2){CQ.stat.jumped++;cqHide();cqShow(it);return}   // סכנה: מחליפה מיד
  let i=Q.length;while(i>0&&Q[i-1].pri<it.pri)i--;Q.splice(i,0,it);if(it.pri>=2&&i===0)CQ.stat.jumped++;
  while(Q.length>CQ.max){Q.pop();CQ.stat.dropped++}
  CQ.stat.maxQ=Math.max(CQ.stat.maxQ,Q.length);
}
// כל 50ms: מה שהוצג מספיק זמן ויש מי שמחכה, או שנגמר, מפנה מקום. הודעה רגילה שחיכתה יותר מ-ttl נזרקת
function cqTick(){
  const now=cqNow(),Q=CQS.q;
  for(let i=Q.length-1;i>=0;i--)if(Q[i].pri<2&&now-Q[i].at>CQ.ttl){Q.splice(i,1);CQ.stat.stale++}
  const c=CQS.cur;if(!c)return Q.length?cqShow(Q.shift()):undefined;
  if(!cqOn()){CQS.cur=null;Q.length=0;return}
  if(now-c.t0>=c.dur||(Q.length&&now-c.t0>=CQ.min)){cqHide();if(Q.length)cqShow(Q.shift())}
}
setInterval(()=>{if(CQS.cur||CQS.q.length)cqTick()},50);
// הודעה כללית בזירה (בסגנון banner): loot.js, book.js
function cqSay(txt,col,pri){
  if(!cqOn())return banner(txt,col);
  cqPush({kind:'say',txt,key:'t:'+txt,pri:pri??cqPri(txt),dur:1.6,show:()=>CQS.raw(txt,col),hide:cqBanHide});
}
const cqBanHide=()=>{const b=document.getElementById('banner');if(b)b.classList.remove('on')};

// חיבורים
(function(){
  CQS.raw=banner;
  banner=function(txt,col){if(!cqOn())return CQS.raw.apply(this,arguments);cqSay(txt,col)};
  if(typeof streakShow==='function'){CQS.rawStreak=streakShow;
    streakShow=function(key,n,col){if(!cqOn())return CQS.rawStreak.apply(this,arguments);
      cqPush({kind:'streak',key:'streak',pri:1,dur:STREAK.life,show:()=>CQS.rawStreak(key,n,col),
        hide:()=>{const s=S.st;if(s&&s.show){if(s.show.card)fxStop(s.show.card);s.show=null}}})}}
  const r=reset;reset=function(){CQS.cur=null;CQS.q.length=0;return r.apply(this,arguments)};
})();
