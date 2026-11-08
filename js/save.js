/* שמירת התקדמות: מה שנשאר בין ריצות (רמת דמות, תרמיל, ציוד, כפר, קווסטים).
   הכפר, הציוד והקווסטים קוראים וכותבים רק דרך SAVE והפונקציות כאן.
   איפה זה נשמר קובע SAVE_STORE בלבד: בטלפון, ועותק ברקע בענן (Supabase, js/cloud.js, דרך onWrite).
   שדה חדש נכנס ל-saveBlank עם ערך התחלתי, ושמירה ישנה מקבלת אותו לבד בטעינה. */
const SAVE_VER=1;
const isObj=o=>!!o&&typeof o==='object'&&!Array.isArray(o);

function saveBlank(){return{
  v:SAVE_VER,
  hero:{start:null,skin:null,level:1,xp:0,rank:0,rankId:null,style:{}},   // start: דמות ההתחלה. skin: מראה אישי מעליה (HEROES.skins). xp: כל מה שנאסף, והרמה נגזרת ממנו. rank, rankId: שלב ודרגה (ranks.js). style: במה שיחק הכי הרבה, לקווסטי הדרגה
  gt:{axe:1,hammer:1,job:{}},                      // כלי איסוף: דרגה לכל כלי, ושדרוג בשעון {axe:{to,end}} (gtool.js)
  gm:{wood:0,stone:0,plant:0},                     // מומחיות איסוף: כמה מקורות נשברו בכל משפחה (gmastery.js)
  bag:{},                                           // התרמיל, בלי הגבלה: {wood:12,bone:3}. מה שסוחבים, ובעולם הפתוח מסתכנים בו
  stash:{},                                         // המחסן בכפר: המקום הבטוח, באותה צורה כמו התרמיל. מנוהל ב-stash.js
  gear:{weapon:null,shield:[],head:[],body:[],acc:[],boots:[],orbit:[]},   // shield, head, body: שריון (armor.js)               // orbit: החפצים המסתובבים, עד 5
  village:{center:1,forge:0,mill:0,mine:0,market:0,stash:0},// רמת כל מבנה. 0 = עוד לא נבנה
  quests:{active:{},done:{},track:null,day:'',daily:[]},   // מנוהל ב-quests.js. active: {id:{p:[התקדמות לכל מטרה]}}. done: {id:כמה פעמים}
  prod:{},                                          // ייצור במבנים, גם כשלא משחקים: {mill:{t:זמן,have:{wood:3.2}}}. מנוהל ב-village.js
  gift:false,                                       // מתנת הפתיחה של הכפר כבר ניתנה
  gearGift:false,                                   // הציוד הראשון (GEAR.gift ב-gear.js) כבר ניתן
  pity:0,                                           // כמה פעמים ברצף שלל נדיר לא נפל (LOOT.pity ב-loot.js)
  gearPity:0,                                       // כמה אויבים ברצף לא הפילו ציוד (LOOT.gear ב-loot.js)
  clsPity:0,                                        // כמה פריטים ברצף נפלו בעולם בלי נשק של הדמות (LOOT.gear.cls ב-loot.js)
  daily:{day:'',first:{}},                          // איזה סוג אויב כבר הופל היום, לבונוס ההריגה הראשונה (loot.js)
  met:{},                                           // דמויות בעולם שכבר נמצאו: {fisher:1} (worldnpc.js)
  home:{back:{}},                                   // אחרי איזה פנס התושב כבר חזר לכפר: {earth:1} (homecoming.js)
  agePity:0,                                        // כמה כישלונות ברצף ב-Aging, למזל הרך (aging.js)
  pet:{kind:null,stage:0,xp:0,fed:0,buff:0},                     // חיית המחמד (pet.js). kind: איזו חיה מ-PET.kinds (null: PET.default, פיוחו של ניר). stage: 0-2. fed: כמה גזרים אכלה, buff: כמה שניות נשארו לחיזוק מהגזר
  depths:{best:0},
  icons:{sk:'new',nav:'new'},                                 // סגנון האייקונים בהגדרות: 'new' (game-icons.net) או 'classic' (js/gicons.js)
  showHat:true,                                     // "הצג כובע" בהגדרות: כבוי = הכובע לא נראה על הדמות, וההגנה נשארת (armor.js)                                  // עומק הצל: הקומה הכי עמוקה שהגעת אליה (depths.js)
  ts:0}}

let SAVE=saveBlank();

// המקום היחיד שיודע איפה השמירה יושבת. onWrite: מי שרוצה לדעת על כל שמירה (הענן, cloud.js). quiet: בלי להודיע
// הגנה על ההתקדמות (ביקורת 6.11.2026): לפני כתיבה, פעם ב-bakEvery, העותק הקודם עובר ל-fh-save-bak2 (גיבוי מתגלגל).
// שמירה פגומה לא נמחקת: היא עוברת ל-fh-save-bad, ובמקומה עולה הגיבוי. note: מה להגיד לשחקן (saveWarnShow). כתיבה שנכשלה: הודעה פעם אחת
const SAVE_STORE={
  key:'fh-save',
  bakEvery:120000,     // כל כמה מילישניות לכל היותר מתעדכן הגיבוי המתגלגל
  lastBak:-1e15,note:null,failed:false,lock:false,
  load(){let raw=null;try{raw=localStorage.getItem(this.key)}catch(e){return null}
    if(raw==null)return null;
    const ok=t=>{try{const d=JSON.parse(t);return isObj(d)?d:null}catch(e){return null}};
    const d=ok(raw);if(d)return d;
    this.lastBak=Date.now();   // הגיבוי התקין לא יידרס בעותק של השמירה הפגומה
    try{localStorage.setItem(this.key+'-bad',raw)}catch(e){this.lock=true}   // אין מקום לעותק: לא כותבים מעל השמירה הפגומה
    for(const k of['-bak2','-bak']){let b=null;try{b=ok(localStorage.getItem(this.key+k))}catch(e){}
      if(b){this.note='save.restored';return b}}
    this.note=this.lock?'save.locked':'save.lost';return null},
  // ביקורת 7.11.2026: הגיבוי בנפרד. אם הוא נכשל (מקום מלא) השמירה הראשית עדיין נכתבת.
  // השמירה הראשית נכשלה: מפנים את הגיבוי המתגלגל (עותק ישן) ומנסים פעם אחת שוב. עדיין נכשל: השמירה הקודמת נשארת, והודעה פעם אחת
  write(d,quiet){
    if(!this.lock){
      if(Date.now()-this.lastBak>this.bakEvery){this.lastBak=Date.now()
        try{const prev=localStorage.getItem(this.key);if(prev)localStorage.setItem(this.key+'-bak2',prev)}catch(e){}}
      const s=JSON.stringify(d);let ok=false
      try{localStorage.setItem(this.key,s);ok=true}catch(e){
        try{localStorage.removeItem(this.key+'-bak2');localStorage.setItem(this.key,s);ok=true}catch(e2){}}
      if(ok)this.failed=false
      else if(!this.failed){this.failed=true;this.note='save.fail';if(typeof saveWarnShow==='function')saveWarnShow()}}
    if(!quiet&&this.onWrite)this.onWrite()},
  onWrite:null
};
// ההודעה לשחקן: שורה במסך הפתיחה, ובמשחק גם באנר. הטקסטים ב-lang.js (save.*)
function saveWarnShow(){const n=SAVE_STORE.note;if(!n)return;const e=document.getElementById('saveWarn');
  if(e){e.dataset.t=n;e.textContent=T(n);e.hidden=false}
  const st=document.getElementById('ovStart');if(st&&st.hidden&&typeof banner==='function')try{banner(T(n),C.ember)}catch(e){}}

// ממזג שמירה ישנה לתוך התבנית: שדות חדשים מקבלים ערך התחלתי, ומה שנשמר נשאר
function saveMerge(base,d){
  for(const k in d){if(isObj(base[k])&&isObj(d[k]))saveMerge(base[k],d[k]);else base[k]=d[k]}
  return base}

function saveLoad(){const d=SAVE_STORE.load();SAVE=isObj(d)?saveMerge(saveBlank(),d):saveBlank();resMigrate(SAVE);SAVE.v=SAVE_VER;return SAVE}
function saveNow(){SAVE.ts=Date.now();SAVE_STORE.write(SAVE)}

function bagHas(k,n=1){return (SAVE.bag[k]||0)>=n}
function bagAdd(k,n=1){SAVE.bag[k]=(SAVE.bag[k]||0)+n;if(typeof bookSee==='function')bookSee(k)}   // ספר ההרפתקאות (book.js)
function bagTake(k,n=1){if(!bagHas(k,n))return false;SAVE.bag[k]-=n;if(!SAVE.bag[k])delete SAVE.bag[k];return true}

saveLoad();
setTimeout(saveWarnShow,0);   // אחרי שכל הקבצים נטענו (T, banner)
