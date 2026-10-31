/* שמירת התקדמות: מה שנשאר בין ריצות (רמת דמות, תרמיל, ציוד, כפר, קווסטים).
   הכפר, הציוד והקווסטים קוראים וכותבים רק דרך SAVE והפונקציות כאן.
   איפה זה נשמר קובע SAVE_STORE בלבד: בטלפון, ועותק ברקע בענן (Supabase, js/cloud.js, דרך onWrite).
   שדה חדש נכנס ל-saveBlank עם ערך התחלתי, ושמירה ישנה מקבלת אותו לבד בטעינה. */
const SAVE_VER=1;

function saveBlank(){return{
  v:SAVE_VER,
  hero:{start:null,skin:null,level:1,xp:0,rank:0,rankId:null,style:{}},   // start: דמות ההתחלה. skin: מראה אישי מעליה (HEROES.skins). xp: כל מה שנאסף, והרמה נגזרת ממנו. rank, rankId: שלב ודרגה (ranks.js). style: במה שיחק הכי הרבה, לקווסטי הדרגה
  bag:{},                                           // התרמיל, בלי הגבלה: {wood:12,bone:3}. מה שסוחבים, ובעולם הפתוח מסתכנים בו
  stash:{},                                         // המחסן בכפר: המקום הבטוח, באותה צורה כמו התרמיל. מנוהל ב-stash.js
  gear:{weapon:null,acc:[],boots:[],orbit:[]},               // orbit: החפצים המסתובבים, עד 5
  village:{center:1,forge:0,mill:0,mine:0,market:0,stash:0},// רמת כל מבנה. 0 = עוד לא נבנה
  quests:{active:{},done:{},track:null,day:'',daily:[]},   // מנוהל ב-quests.js. active: {id:{p:[התקדמות לכל מטרה]}}. done: {id:כמה פעמים}
  prod:{},                                          // ייצור במבנים, גם כשלא משחקים: {mill:{t:זמן,have:{wood:3.2}}}. מנוהל ב-village.js
  gift:false,                                       // מתנת הפתיחה של הכפר כבר ניתנה
  gearGift:false,                                   // הציוד הראשון (GEAR.gift ב-gear.js) כבר ניתן
  pity:0,                                           // כמה פעמים ברצף שלל נדיר לא נפל (LOOT.pity ב-loot.js)
  gearPity:0,                                       // כמה אויבים ברצף לא הפילו ציוד (LOOT.gear ב-loot.js)
  daily:{day:'',first:{}},                          // איזה סוג אויב כבר הופל היום, לבונוס ההריגה הראשונה (loot.js)
  met:{},                                           // דמויות בעולם שכבר נמצאו: {fisher:1} (worldnpc.js)
  home:{back:{}},                                   // אחרי איזה פנס התושב כבר חזר לכפר: {earth:1} (homecoming.js)
  agePity:0,                                        // כמה כישלונות ברצף ב-Aging, למזל הרך (aging.js)
  pet:{kind:null,stage:0,xp:0,fed:0,buff:0},                     // חיית המחמד (pet.js). kind: איזו חיה מ-PET.kinds (null: PET.default, פיוחו של ניר). stage: 0-2. fed: כמה גזרים אכלה, buff: כמה שניות נשארו לחיזוק מהגזר
  ts:0}}

let SAVE=saveBlank();

// המקום היחיד שיודע איפה השמירה יושבת. onWrite: מי שרוצה לדעת על כל שמירה (הענן, cloud.js). quiet: בלי להודיע
const SAVE_STORE={
  key:'fh-save',
  load(){try{return JSON.parse(localStorage.getItem(this.key))}catch(e){return null}},
  write(d,quiet){try{localStorage.setItem(this.key,JSON.stringify(d))}catch(e){}if(!quiet&&this.onWrite)this.onWrite()},
  onWrite:null
};

const isObj=o=>o&&typeof o==='object'&&!Array.isArray(o);
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
