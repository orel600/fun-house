/* המשאבים: טבלה אחת לכל המשחק (ההחלטות ב-game-design.md, "משאבים וכלכלה").
   כל משאב הוא שורה ב-RES.list: אייקון, משפחה, נדירות, ומחיר בשוק (sell: כמה השוק משלם, buy: כמה הוא גובה. בלי buy: אי אפשר לקנות).
   השמות ב-lang.js תחת 'res.<id>', והמשפחות תחת 'fam.<id>'. הכפר, הציוד, המחסן והשלל לוקחים מכאן אייקונים ומחירים.
   מאיפה משאב מגיע: make במבנים (village.js), drop באויבים ובבוסים (data.js), WANTED (wanted.js), BONUS.roomRes (bonus.js) ו-NODES (nodes.js).
   בשביל מה: cost במבנים (village.js) ו-GEAR.recipes (gear.js). הבדיקה (tools/check.js) נכשלת אם למשאב אין לפחות שני מקורות ושימוש אחד.
   מקור או שימוש חדש במקום אחר? מוסיפים אותו גם לרשימה של הבדיקה. */

const RES={
  // סדר המשפחות בתרמיל. min: כמה מקורות לפחות. לחלקי בוס יש מקור אחד בכוונה: רק הבוס שלהם (ניר)
  fams:{coins:{min:0},build:{min:2},metal:{min:2},creature:{min:2},boss:{min:1},rare:{min:2}},
  // הנדירות: col הצבע של המסגרת בתרמיל. lot: כמה יחידות בכל לחיצה בשוק. market: מאיזו רמת שוק אפשר לקנות
  rarity:[{col:'#5A6075',lot:5,market:1},{col:'#7FB2D9',lot:5,market:2},{col:'#B48CFF',lot:2,market:3},{col:C.gold,lot:1,market:4},{col:'#FF6FB5',lot:1,market:5}],
  list:{
    coins:   {fam:'coins',icon:'🪙',rar:0},
    // בנייה
    wood:    {fam:'build',icon:'🪵',rar:0,sell:1,buy:3},
    stone:   {fam:'build',icon:'🪨',rar:0,sell:1,buy:3},
    cloth:   {fam:'build',icon:'🧵',rar:1,sell:2,buy:6},
    // מתכות, מהחלשה לחזקה. ככל שהמקום רחוק וקשה יותר, המתכת טובה יותר
    copper:  {fam:'metal',icon:'🥉',rar:0,sell:2,buy:6},
    iron:    {fam:'metal',icon:'🔩',rar:1,sell:4,buy:12},
    silver:  {fam:'metal',icon:'🥈',rar:2,sell:8,buy:25},
    gold:    {fam:'metal',icon:'🥇',rar:3,sell:15,buy:50},
    mythril: {fam:'metal',icon:'💠',rar:4,sell:30,buy:110},
    // יצורים: כל סוג אויב מפיל את שלו (drop ב-data.js)
    bone:    {fam:'creature',icon:'🦴',rar:0,sell:2,buy:6},
    hide:    {fam:'creature',icon:'🐾',rar:0,sell:2,buy:6},
    essence: {fam:'creature',icon:'✨',rar:1,sell:4,buy:12},
    venom:   {fam:'creature',icon:'🧪',rar:1,sell:4,buy:12},
    // חלקי בוס: boss הוא ה-id של הבוס (BOSSES ב-data.js). אי אפשר לקנות, רק להשיג ממנו
    horn:    {fam:'boss',icon:'🦬',rar:4,sell:40,boss:'boss'},
    // נדיר: האבנים לפי סוגי הנזק. אבן כוכב תגן ב-Aging
    ruby:    {fam:'rare',icon:'🔴',rar:3,sell:20,buy:70,elem:'fire'},
    sapphire:{fam:'rare',icon:'🔷',rar:3,sell:20,buy:70,elem:'ice'},
    bolt:    {fam:'rare',icon:'⚡',rar:3,sell:20,buy:70,elem:'lightning'},
    star:    {fam:'rare',icon:'🌟',rar:4,sell:45,buy:160}
  },
  // מה רואים בפס העליון בכל מקום (ניר: "במסך רואים רק את מה שרלוונטי עכשיו"). המפתח: המבנה שעומדים לידו. bag: כל מה שיש בתרמיל
  show:{village:['coins','build'],forge:['coins','metal','rare'],mine:['coins','build','metal'],market:'bag'},
  // מוות בעולם הפתוח: איזה חלק מהתרמיל הולך לאיבוד. עוד לא מחובר, כי אין עולם פתוח
  deathLoss:{resources:0.5,items:0},
  // שמות ישנים בשמירה: 'עפרות' הפכו לברזל
  renamed:{ore:'iron'}
};

const resOf=r=>RES.list[r]||null;
const resIcon=r=>(RES.list[r]||{}).icon||'';
// כל המשאבים של משפחה, לפי הסדר בטבלה
const resFam=f=>Object.keys(RES.list).filter(r=>RES.list[r].fam===f);
// שמירה ישנה: משאב ששמו השתנה עובר לשם החדש, בתרמיל ובמחסן. נקרא מ-saveLoad
function resMigrate(sv){
  for(const box of [sv.bag,sv.stash])for(const o in RES.renamed)if(box[o]){const n=RES.renamed[o];box[n]=(box[n]||0)+box[o];delete box[o]}
}
// מה מוצג בפס העליון עכשיו: רשימת משאבים, או null = כל מה שיש בתרמיל
function resShown(place){
  const s=RES.show[place]||RES.show.village;if(s==='bag')return null;
  return s.flatMap(resFam);
}
