/* היררכיית הכפתורים (ניר, 4.11.2026): "צריכה להיות היררכיה של אייקונים. במסכים שימין למטה שייך קודם לסקילים, מה שנמצא שם צריך לפנות את מקומו.
   אבל בכפר ההיררכיה משתנה. ההיררכיה עצמה נקבעת לפי כמות השימוש".
   לכל כפתור יש עדיפות בכל מקום (rank). המקומות על המסך (slots) מסודרים מהכי קל לאגודל להכי רחוק: הכפתור עם העדיפות הגבוהה מקבל
   את המקום הראשון שיש בו עוד מקום, והשאר לפי הסדר. בתוך מקום, הכפתור הראשון הוא הקרוב ביותר לפינה הימנית התחתונה (order=0, והכיוון ב-style.css).
   הזירה לא כאן (של אוראל). כפתור חדש = שורה ב-rank, לא מיקום ידני.
   שימוש: כל לחיצה נספרת (SAVE.hud.n), ומוסיפה לכל היותר use.max נקודות. הסידור מתעדכן רק בכניסה למקום, לא באמצע,
   והפערים בין הכפתורים (10) גדולים מהתוספת, כך ששימוש משנה רק סדר בין כפתורים קרובים ולא מזיז אותם כל יום */
const HUDRANK={
  // מקומות לפי הסדר: id של המיכל, וכמה כפתורים נכנסים בו. בעולם הפינה הימנית התחתונה של הסקילים (#skills), ולכן היא לא ברשימה
  slots:{
    village:[{id:'qRail',cap:3},{id:'vTop',cap:6}],      // בכפר אין סקילים: הטור בצד ימין, ואחריו השורה העליונה
    world:[{id:'qRail',cap:4},{id:'nav',cap:9}],         // בעולם: השורה מתחת לקווסט, ואחריה הסרגל של המקום
  },
  // עדיפות לכל כפתור בכל מקום. כפתור שאין לו מספר במקום מסוים לא זז שם (למשל הביקור בעולם)
  rank:{
    gearBtnQ:{village:90,world:70},   // 🎒 דמות ותרמיל: כמעט בכל כניסה לכפר
    qBtnQ:   {village:70,world:60},   // 📜 קווסטים
    bookBtnQ:{village:60,world:50},   // 📖 ספר
    wMapBtnQ:{world:40},              // 🗺️ מפה, רק בעולם
    welBtn:  {village:50},            // 📦 איסוף משאבים
    feedBtn: {village:40,world:30},   // 🥕 האכלת חיית המחמד
    dBtn:    {village:20},            // 🎁 מתנה יומית: פעם ביום
    visBtn:  {village:10},            // 🏡 ביקור בכפר של חבר: אולי פעמיים ביום
  },
  use:{max:8,k:2},   // תוספת לפי שימוש: k*log2(1+לחיצות), עד max
};
const hudPlace=()=>document.body.classList.contains('vil')?'village':document.body.classList.contains('world')?'world':null;
function hudUses(){const s=typeof SAVE!=='undefined'&&SAVE;if(!s)return{};if(!s.hud||typeof s.hud!=='object')s.hud={n:{}};if(!s.hud.n)s.hud.n={};return s.hud.n}
function hudScore(id,place){const b=(HUDRANK.rank[id]||{})[place];if(b==null)return null;const U=HUDRANK.use;
  return b+Math.min(U.max,U.k*Math.log2(1+(hudUses()[id]||0)))}
// מסדר את הכפתורים של המקום הנוכחי במקומות שלהם. מחזיר {מיכל: [ids לפי הסדר]} לבדיקה
function hudLayout(){const place=hudPlace(),out={};if(!place)return out;
  const ids=Object.keys(HUDRANK.rank).filter(id=>$(id)&&hudScore(id,place)!=null).sort((a,b)=>hudScore(b,place)-hudScore(a,place));
  // כפתור מוסתר לא תופס מקום בטור (מפה בכפר), אבל כפתור שמופיע רק לפעמים (איסוף, האכלה) כן, כדי שהסידור לא יקפוץ
  let i=0;for(const s of HUDRANK.slots[place]){const box=$(s.id);out[s.id]=[];if(!box)continue;
    while(i<ids.length&&out[s.id].length<s.cap){const e=$(ids[i++]);if(e.parentNode!==box)box.appendChild(e);e.style.order=out[s.id].length;out[s.id].push(e.id)}}
  return out}
// כניסה לכפר או לעולם (המחלקה על body): מסדרים מחדש. לחיצה: נספרת לפעם הבאה
{let last=null;new MutationObserver(()=>{const p=hudPlace();if(p!==last){last=p;hudLayout()}}).observe(document.body,{attributes:true,attributeFilter:['class']});
  for(const id in HUDRANK.rank){const e=$(id);if(e)e.addEventListener('click',()=>{const n=hudUses();n[id]=(n[id]||0)+1})}
  last=hudPlace();hudLayout()}
