/* הממשק המשותף (ניר, 31.10.2026: "צריך להיות כפתור יציאה מהדבר שאתה נמצא בו").
   כל חלון שנפתח יוצא באותן שלוש דרכים: ✕ בכותרת, Esc, ולחיצה מחוץ לחלון. הרשימה WINS מהחלון העליון לתחתון:
   חלון חדש = שורה אחת, עם המזהה שלו ומה סוגר אותו. המראה (.win, .whd, .wx) ב-css/style.css */
const UI={
  top:4,   // כמה משאבים לכל היותר בפס העליון. השאר בתרמיל, וכפתור "+N" פותח אותו
};
const WINS=[
  {id:'ovSound',close:()=>soundClose()},   // נגיעה בחוץ: audio.js
  {id:'ovHelp',close:()=>helpOpen(false),backdrop:true},
  {id:'ovGear',close:()=>gearClose(),backdrop:true},
  {id:'ovForge',close:()=>forgeClose(),backdrop:true},
  {id:'ovDaily',close:()=>dailyClose(),backdrop:true},
  {id:'ovEnd',close:()=>storyEndClose(),backdrop:true},   // "תודה ששיחקת" בסוף העלילה (story.js)
  {id:'npcDlg',close:()=>S.wd?wnpcTalk(null):npcTalk(null),outside:true},
  {id:'qLog',close:()=>questLogOpen(false),outside:true},
  {id:'bookWin',close:()=>bookOpen(false),outside:true},
  {id:'wMap',close:()=>wmapOpen(false),outside:true},   // מפת העולם (worldmap.js)
  {id:'vPanel',close:()=>vShut()},
  {id:'wPanel',close:()=>wShut()},
];
const uiOpen=w=>!$(w.id).hidden;
// סוגר את החלון העליון שפתוח. מחזיר אם היה מה לסגור
function uiCloseTop(){const w=WINS.find(uiOpen);if(!w)return false;w.close();sfx('ui');return true}
// הכותרת של כל חלון: שם באמצע ו-✕ אדום בסוף. sub: שורה קטנה ליד השם (רמה, תפקיד)
const winHead=(title,sub,tag='h3')=>'<div class="whd"><'+tag+'>'+title+(sub?' <small>'+sub+'</small>':'')+'</'+tag+'><button class="wx" data-act="close" aria-label="'+T('q.close')+'">✕</button></div>';
// מספר קצר לפס העליון ולתרמיל: 974, 1.3K, 13K, 1.3M
function shortN(n){
  n=Math.floor(n||0);const a=Math.abs(n);
  const f=(v,s)=>(v<10?Math.floor(v*10)/10:Math.floor(v))+s;
  return a<1000?String(n):a<1e6?f(n/1e3,'K'):f(n/1e6,'M');
}

addEventListener('keydown',e=>{if(e.code==='Escape'&&uiCloseTop())e.preventDefault()});
// לחיצה על הרקע מסביב לחלון מלא סוגרת אותו. רק כשגם הנגיעה התחילה ברקע, כדי שגרירה שהשתחררה בחוץ לא תסגור
for(const w of WINS.filter(w=>w.backdrop)){const el=$(w.id);let down=false;
  el.addEventListener('pointerdown',e=>{down=e.target===el});
  el.addEventListener('click',e=>{if(down&&e.target===el)w.close();down=false});
}
// נגיעה במשחק עצמו סוגרת את היומן ואת השיחה (הפאנל של מבנה נסגר כשמתרחקים ממנו, או ב-✕)
$('c').addEventListener('pointerdown',()=>{for(const w of WINS.filter(w=>w.outside))if(uiOpen(w))w.close()});
// "+N" בפס העליון: מה שלא נכנס לפס נמצא בתרמיל
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.resmore');if(b&&S&&S.mode==='play')gearOpen()});

// איך משחקים: מכפתור במסך הפתיחה
function helpOpen(on){$('ovHelp').hidden=!on;if(on)$('ovHelp').querySelector('.rules').scrollTop=0}
$('helpBtn').addEventListener('click',()=>{helpOpen(true);sfx('ui')});
$('helpClose').addEventListener('click',()=>helpOpen(false));
// "חזור" באנדרואיד (וחץ אחורה בדפדפן): כשנפתח חלון שעוצר את המשחק, נכנסת רשומה להיסטוריה, וחזור סוגר את החלון במקום לצאת מהמשחק.
// פאנל של מבנה או שער נפתח לבד כשעוברים לידו, ולכן רק חלון המסחר הגדול נחשב
const uiModal=w=>uiOpen(w)&&(w.id!=='vPanel'&&w.id!=='wPanel'||$(w.id).classList.contains('big'));
const UIH={on:false,skip:false};
function uiHistory(){
  const any=WINS.some(uiModal);
  if(any&&!UIH.on){UIH.on=true;try{history.pushState({ui:1},'')}catch(e){}}
  else if(!any&&UIH.on){UIH.on=false;UIH.skip=true;try{history.back()}catch(e){UIH.skip=false}}
}
addEventListener('popstate',()=>{
  if(UIH.skip){UIH.skip=false;return}
  UIH.on=false;if(WINS.some(uiModal))uiCloseTop();uiHistory();
});
{const mo=new MutationObserver(uiHistory);for(const w of WINS)mo.observe($(w.id),{attributes:true,attributeFilter:['hidden','class']})}
