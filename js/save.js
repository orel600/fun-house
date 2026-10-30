/* שמירת התקדמות: מה שנשאר בין ריצות (רמת דמות, תרמיל, ציוד, כפר, קווסטים).
   הכפר, הציוד והקווסטים קוראים וכותבים רק דרך SAVE והפונקציות כאן.
   איפה זה נשמר קובע SAVE_STORE בלבד: היום בטלפון, ובהמשך Supabase (ההחלטה ב-game-design.md, "החלטות של ניר").
   שדה חדש נכנס ל-saveBlank עם ערך התחלתי, ושמירה ישנה מקבלת אותו לבד בטעינה. */
const SAVE_VER=1;

function saveBlank(){return{
  v:SAVE_VER,
  hero:{start:null,level:1,xp:0,rank:0,style:{}},   // start: דמות ההתחלה. style: במה שיחק הכי הרבה, לקווסטי הדרגה
  bag:{},                                           // התרמיל, בלי הגבלה: {wood:12,bone:3}. מה שסוחבים, ובעולם הפתוח מסתכנים בו
  stash:{},                                         // המחסן בכפר: המקום הבטוח, באותה צורה כמו התרמיל. מנוהל ב-stash.js
  gear:{weapon:null,acc:[],orbit:[]},               // orbit: החפצים המסתובבים, עד 5
  village:{center:1,forge:0,mill:0,mine:0,market:0,stash:0},// רמת כל מבנה. 0 = עוד לא נבנה
  quests:{active:{},done:{}},
  prod:{},                                          // ייצור במבנים, גם כשלא משחקים: {mill:{t:זמן,have:{wood:3.2}}}. מנוהל ב-village.js
  gift:false,                                       // מתנת הפתיחה של הכפר כבר ניתנה
  gearGift:false,                                   // הציוד הראשון (GEAR.gift ב-gear.js) כבר ניתן
  ts:0}}

let SAVE=saveBlank();

// המקום היחיד שיודע איפה השמירה יושבת. בענן מחליפים רק את האובייקט הזה
const SAVE_STORE={
  key:'fh-save',
  load(){try{return JSON.parse(localStorage.getItem(this.key))}catch(e){return null}},
  write(d){try{localStorage.setItem(this.key,JSON.stringify(d))}catch(e){}}
};

const isObj=o=>o&&typeof o==='object'&&!Array.isArray(o);
// ממזג שמירה ישנה לתוך התבנית: שדות חדשים מקבלים ערך התחלתי, ומה שנשמר נשאר
function saveMerge(base,d){
  for(const k in d){if(isObj(base[k])&&isObj(d[k]))saveMerge(base[k],d[k]);else base[k]=d[k]}
  return base}

function saveLoad(){const d=SAVE_STORE.load();SAVE=isObj(d)?saveMerge(saveBlank(),d):saveBlank();SAVE.v=SAVE_VER;return SAVE}
function saveNow(){SAVE.ts=Date.now();SAVE_STORE.write(SAVE)}

function bagHas(k,n=1){return (SAVE.bag[k]||0)>=n}
function bagAdd(k,n=1){SAVE.bag[k]=(SAVE.bag[k]||0)+n}
function bagTake(k,n=1){if(!bagHas(k,n))return false;SAVE.bag[k]-=n;if(!SAVE.bag[k])delete SAVE.bag[k];return true}

saveLoad();
