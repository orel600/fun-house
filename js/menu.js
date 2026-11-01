/* תפריט ראשי אחד (ניר, 1.11.2026: "המסכים מגושמים, יש הרבה כפתורים וחלונות"), כמו התפריט של Genshin:
   כפתור ☰ אחד בפינה העליונה, רק בכפר ובעולם, פותח מסך מלא עם לשוניות בצד (בטלפון עומד: למטה).
   כל לשונית מציגה חלון שכבר קיים, כמו שהוא, ולא בונה אותו מחדש. נקודה אדומה על לשונית שיש בה משהו חדש, וגם על ☰.
   ✕, Esc ונגיעה בחוץ סוגרים את כל התפריט (WINS ב-ui.js). הזירה לא משתנה: שם נשארים הכפתורים שלה.
   לשונית חדשה = שורה ב-MENU.tabs וכפתור ב-#menuRail ב-index.html. המראה ב-css/style.css, "התפריט הראשי" */
const MENU={
  // id: הכפתור בסרגל הצד. win: החלון שהוא מציג. badge: הנקודה האדומה שהחלון כבר מעדכן. when: מתי הלשונית מופיעה
  tabs:[
    {id:'gearBtn',win:'ovGear',open:()=>gearOpen(),close:()=>gearClose(),badge:'gBadge'},          // דמות, ציוד ותרמיל (gear.js)
    {id:'qBtn',win:'qLog',open:()=>questLogOpen(true),close:()=>questLogOpen(false),badge:'qBadge'}, // קווסטים (quests.js)
    {id:'bookBtn',win:'bookWin',open:()=>bookOpen(true),close:()=>bookOpen(false),badge:'bBadge'},   // ספר ההרפתקאות (book.js)
    {id:'wMapBtn',win:'wMap',open:()=>wmapOpen(true),close:()=>wmapOpen(false),when:()=>!!(S&&S.wd)}, // מפה, רק בעולם (worldmap.js)
    {id:'setBtn',win:'ovSound',open:()=>soundOpen(),close:()=>soundClose()},                         // הגדרות וצלילים (audio.js)
  ],
  last:'gearBtn',   // ☰ פותח את הלשונית האחרונה שהייתה פתוחה
  cur:null,
};
const menuTab=id=>MENU.tabs.find(t=>t.id===id);
const menuHere=()=>!!(S&&S.mode&&(S.vil||S.wd));   // רק בכפר ובעולם
function menuDraw(){
  for(const t of MENU.tabs){const b=$(t.id);b.hidden=!!t.when&&!t.when();b.setAttribute('aria-selected',String(MENU.cur===t.id))}
}
// פותח לשונית. לחיצה על לשונית שהחלון שלה כבר פתוח סוגרת אותו, כמו הכפתורים שהיו בסרגל
function menuShow(id){
  const t=menuTab(id);if(!t)return;
  if(!$(t.win).hidden){t.close();menuEnd();sfx('ui');return}
  if(!menuHere()){t.open();return}   // לא בכפר ולא בעולם: רק החלון, בלי התפריט
  const c=MENU.cur&&menuTab(MENU.cur);if(c&&!$(c.win).hidden)c.close();
  // חלון אחד בכל פעם: חלון שקפץ מחוץ לתפריט (שיחה, "בזמן שלא היית", מתנה) נסגר לפני שהתפריט נפתח
  if(!MENU.cur)for(let i=0;i<8;i++){const w=WINS.find(w=>uiModal(w)&&!MENU.tabs.some(t=>t.win===w.id));if(!w)break;w.close()}
  t.open();
  if($(t.win).hidden){menuEnd();return}   // לא נפתח (למשל חלון אחר עוצר את המשחק)
  MENU.cur=MENU.last=id;document.body.classList.add('menu');menuDraw();sfx('ui');
}
function menuClose(){const c=MENU.cur&&menuTab(MENU.cur);if(c&&!$(c.win).hidden)c.close();menuEnd()}
function menuEnd(){MENU.cur=null;document.body.classList.remove('menu');menuDraw()}
// הנקודה על ☰: יש משהו חדש באחת הלשוניות
function menuDot(){const on=MENU.tabs.some(t=>t.badge&&!$(t.badge).hidden),d=$('menuBtn').querySelector('b');if(d.hidden===on)d.hidden=!on}

$('menuBtn').addEventListener('click',e=>{e.stopPropagation();const t=menuTab(MENU.last);menuShow(t&&(!t.when||t.when())?MENU.last:'gearBtn')});
for(const t of MENU.tabs)$(t.id).addEventListener('click',e=>{e.stopPropagation();menuShow(t.id)});
$('menuBg').addEventListener('click',()=>{menuClose();sfx('ui')});
// החלון נסגר לבד (✕, Esc, נגיעה ברקע): התפריט נסגר איתו. במעבר בין לשוניות החלון החדש כבר פתוח כשזה נבדק
{const mo=new MutationObserver(()=>{
  const c=MENU.cur&&menuTab(MENU.cur);if(c&&$(c.win).hidden)menuEnd();menuDot()});
  for(const t of MENU.tabs){mo.observe($(t.win),{attributes:true,attributeFilter:['hidden']});if(t.badge)mo.observe($(t.badge),{attributes:true,attributeFilter:['hidden']})}}
menuDraw();
