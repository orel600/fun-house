/* עדכון לבד לגרסה הכי חדשה (ניר, 1.11.2026: "אני כל פעם צריך לסגור ולפתוח מחדש את המשחק וגם לא תמיד זה עוזר").
   באנדרואיד אפליקציה מותקנת לא באמת נסגרת, אז בודקים בעצמנו: version.json (נכתב בפרסום, deploy.yml) מול VERSION (js/version.js).
   - מתי בודקים: בפתיחה, כשחוזרים לאפליקציה (visibilitychange), וכל UPD.every כשהמשחק על המסך.
   - יש חדשה: registration.update() ל-service worker (sw.js), ואז במסך הפתיחה או בכפר בלי חלון פתוח: שומרים (saveNow) ומרעננים לבד, עם "מתעדכן…".
     בעולם ובזירה: רק כפתור "🔄 גרסה חדשה" למעלה, ונגיעה בו שומרת ומרעננת. באמצע ריצה בזירה לעולם לא מרעננים לבד (שם יש מצב שלא נשמר).
   - בלי לולאה: על כל גרסה מרעננים לבד פעם אחת בלבד (sessionStorage). אם אחרי הרענון עדיין ישן, נשאר רק הכפתור.
   - מ-file:// ובלי version.json (במחשב) לא עושה כלום. בהגדרות: מספר הגרסה וכפתור "בדוק עדכון" (updCheckBtn). נבדק ב-tools/check.js */
const UPD={
  url:'version.json',
  first:2000,          // כמה מילישניות אחרי הטעינה בודקים בפעם הראשונה
  every:5*60000,       // כל כמה זמן בודקים כשהאפליקציה פתוחה
  wait:3000,           // כמה מחכים ל-service worker החדש לפני הרענון
  key:'fh-upd',        // sessionStorage: לאיזו גרסה כבר רעננו לבד
  next:'',             // הגרסה החדשה שנמצאה ברשת, או ריק
  going:false,
  last:0,
};
const updWeb=()=>/^https?:$/.test(location.protocol);
// בטוח לרענן לבד: מסך הפתיחה, או הכפר כשהמשחק רץ ואין חלון פתוח
function updSafe(){
  const st=$('ovStart');if(st&&!st.hidden)return true;
  if(!S||!S.vil||S.mode!=='play')return false;
  if(typeof WINS!=='undefined'&&WINS.some(uiModal))return false;
  return ![...document.querySelectorAll('.ov')].some(o=>!o.hidden);
}
async function updCheck(){   // מחזיר 'new' | 'same' | 'off'
  if(!updWeb())return'off';
  UPD.last=Date.now();
  try{
    const r=await fetch(UPD.url+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)return'off';
    const v=String((await r.json()).v||'');if(!v)return'off';
    if(v===VERSION){UPD.next='';updShow();return'same'}
    UPD.next=v;
    try{const reg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();if(reg)reg.update().catch(()=>{})}catch(e){}
    updShow();updTick();return'new';
  }catch(e){return'off'}
}
async function updGo(){   // שומרים ומרעננים
  if(UPD.going)return;UPD.going=true;updShow();
  try{sessionStorage.setItem(UPD.key,UPD.next)}catch(e){}
  try{if(typeof saveNow==='function'&&SAVE)saveNow()}catch(e){}
  try{const sw=navigator.serviceWorker,reg=sw&&await sw.getRegistration(),w=reg&&(reg.installing||reg.waiting);
    if(w)await new Promise(ok=>{sw.addEventListener('controllerchange',ok,{once:true});setTimeout(ok,UPD.wait)})}catch(e){}
  location.reload();
}
function updAuto(){let done='';try{done=sessionStorage.getItem(UPD.key)||''}catch(e){}return UPD.next&&done!==UPD.next}
function updTick(){if(UPD.next&&!UPD.going&&updAuto()&&updSafe())updGo()}
function updShow(){   // הכפתור למעלה: "🔄 גרסה חדשה", או "מתעדכן…" בזמן הרענון
  const b=$('updBtn');if(!b)return;
  b.hidden=!UPD.next;b.disabled=UPD.going;b.textContent=T(UPD.going?'upd.going':'upd.new');
  const l=$('updLine');if(l)l.textContent=T('upd.ver')+' v'+VERSION;
}
(function updInit(){
  const b=$('updBtn');if(b)b.addEventListener('click',e=>{e.stopPropagation();updGo()});
  const c=$('updCheckBtn');
  if(c){c.hidden=!updWeb();c.addEventListener('click',async e=>{e.stopPropagation();c.disabled=true;c.textContent='…';
    const r=await updCheck();c.disabled=false;c.textContent=T('upd.check');
    const n=$('updNote');if(n)n.textContent=T(r==='new'?(updSafe()||!S||!S.mode||S.vil||S.wd?'upd.going':'upd.later'):r==='same'?'upd.latest':'upd.off');
    if(r==='new'&&!UPD.going&&(updSafe()||S&&(S.vil||S.wd)))updGo()})}   // ביקשו בעצמם: גם בעולם מרעננים. בזירה רק הכפתור
  updShow();
  if(!updWeb())return;
  setTimeout(updCheck,UPD.first);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')updCheck()});
  setInterval(()=>{if(document.visibilityState==='visible'&&Date.now()-UPD.last>=UPD.every)updCheck();updTick()},1000);
})();
