/* תפריט ראשי אחד (ניר, 1.11.2026: "המסכים מגושמים, יש הרבה כפתורים וחלונות"), כמו התפריט של Genshin:
   כפתור ☰ אחד בפינה העליונה, רק בכפר ובעולם, פותח מסך מלא עם לשוניות בצד (בטלפון עומד: למטה).
   כל לשונית מציגה חלון שכבר קיים, כמו שהוא, ולא בונה אותו מחדש. נקודה אדומה על לשונית שיש בה משהו חדש, וגם על ☰.
   ✕, Esc ונגיעה בחוץ סוגרים את כל התפריט (WINS ב-ui.js). הזירה לא משתנה: שם נשארים הכפתורים שלה.
   לשונית חדשה = שורה ב-MENU.tabs וכפתור ב-#menuRail ב-index.html. המראה ב-css/style.css, "התפריט הראשי".
   טור הקיצורים (ניר, 2.11.2026: "האייקונים קטנים אבל ברורים מסביב, וככה מפנים הרבה מקום"): #qRail בצד המסך, בכפר ובעולם,
   אייקון קטן עם תווית לכל לשונית שמשחקים בה הרבה, ונקודה אדומה כשיש בה מה לעשות (אותה נקודה של הלשונית). ☰ נשאר להגדרות.
   קיצור חדש = כפתור .qr עם data-tab ב-#qRail. המראה ב-style.css, "טור הקיצורים" */
const MENU={
  // id: הכפתור בסרגל הצד. win: החלון שהוא מציג. badge: הנקודה האדומה שהחלון כבר מעדכן. when: מתי הלשונית מופיעה
  tabs:[
    {id:'gearBtn',win:'ovGear',open:()=>gearOpen(),close:()=>gearClose(),badge:'gBadge',dot:'skDot'},   // דמות, ציוד ותרמיל (gear.js). dot: סקיל או רונה חדשים (skguide.js)
    {id:'qBtn',win:'qLog',open:()=>questLogOpen(true),close:()=>questLogOpen(false),badge:'qBadge'}, // קווסטים (quests.js)
    {id:'bookBtn',win:'bookWin',open:()=>bookOpen(true),close:()=>bookOpen(false),badge:'bBadge'},   // ספר ההרפתקאות (book.js)
    {id:'wMapBtn',win:'wMap',open:()=>wmapOpen(true),close:()=>wmapOpen(false),when:()=>!!(S&&S.wd)}, // מפה, רק בעולם (worldmap.js)
    {id:'mbTab',win:'ovMoba',open:()=>mobaOpen(),close:()=>mobaPickClose()},                        // משחקי השאול (moba.js)
    {id:'setBtn',win:'ovSound',open:()=>soundOpen(),close:()=>soundClose()},                         // הגדרות וצלילים (audio.js)
  ],
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
  MENU.cur=id;document.body.classList.add('menu');menuDraw();sfx('ui');
}
function menuClose(){const c=MENU.cur&&menuTab(MENU.cur);if(c&&!$(c.win).hidden)c.close();menuEnd()}
function menuEnd(){MENU.cur=null;document.body.classList.remove('menu');menuDraw()}
// יש משהו חדש בלשונית: הנקודה (badge) או הסימן (dot) שהחלון שלה כבר מעדכן
const menuNew=t=>!!(t&&(t.badge&&!$(t.badge).hidden||t.dot&&!$(t.dot).hidden));
// הנקודות: על כל קיצור בטור, ועל ☰ רק כשיש משהו חדש בלשונית שאין לה קיצור
function menuDot(){const rail=[...document.querySelectorAll('#qRail .qr')],has=new Set(rail.map(b=>b.dataset.tab));
  for(const b of rail){const d=b.querySelector('.qrdot'),on=menuNew(menuTab(b.dataset.tab));if(d.hidden===on)d.hidden=!on}
  const on=MENU.tabs.some(t=>!has.has(t.id)&&menuNew(t)),d=$('menuBtn').querySelector('b');if(d.hidden===on)d.hidden=!on}

$('menuBtn').addEventListener('click',e=>{e.stopPropagation();menuShow('setBtn')});   // ☰ = הגדרות. שאר הלשוניות בטור הקיצורים
for(const b of document.querySelectorAll('#qRail .qr'))b.addEventListener('click',e=>{e.stopPropagation();menuShow(b.dataset.tab)});
for(const t of MENU.tabs)$(t.id).addEventListener('click',e=>{e.stopPropagation();menuShow(t.id)});
$('menuBg').addEventListener('click',()=>{menuClose();sfx('ui')});
// החלון נסגר לבד (✕, Esc, נגיעה ברקע): התפריט נסגר איתו. במעבר בין לשוניות החלון החדש כבר פתוח כשזה נבדק
{const mo=new MutationObserver(()=>{
  const c=MENU.cur&&menuTab(MENU.cur);if(c&&$(c.win).hidden)menuEnd();menuDot()});
  for(const t of MENU.tabs){mo.observe($(t.win),{attributes:true,attributeFilter:['hidden']});if(t.badge)mo.observe($(t.badge),{attributes:true,attributeFilter:['hidden']});if(t.dot)mo.observe($(t.dot),{attributes:true,attributeFilter:['hidden']})}}
menuDraw();menuDot();
// האכלת חיית המחמד: בכפר בשורה העליונה (#vTop) ליד הביקור והאיסוף (ניר, 4.11.2026), בעולם בסרגל של המקום (#nav). pet.js לא יודע איפה הכפתור
{const fb=$('feedBtn'),home=fb.parentNode,mv=()=>{const p=document.body.classList.contains('vil')?$('vTop'):home;if(fb.parentNode!==p)p.appendChild(fb)};
  new MutationObserver(mv).observe(document.body,{attributes:true,attributeFilter:['class']});mv()}
