/* המשאבים: טבלה אחת לכל המשחק (ההחלטות ב-game-design.md, "משאבים וכלכלה").
   כל משאב הוא שורה ב-RES.list: אייקון, משפחה, נדירות, ומחיר בשוק (sell: כמה השוק משלם, buy: כמה הוא גובה. בלי buy: אי אפשר לקנות).
   השמות ב-lang.js תחת 'res.<id>', והמשפחות תחת 'fam.<id>'. הכפר, הציוד, המחסן והשלל לוקחים מכאן אייקונים ומחירים.
   מאיפה משאב מגיע: make במבנים (village.js), drop באויבים ובבוסים (data.js), WANTED (wanted.js), BONUS.roomRes (bonus.js) ו-NODES (nodes.js).
   בשביל מה: cost במבנים (village.js) ו-GEAR.recipes (gear.js). הבדיקה (tools/check.js) נכשלת אם למשאב אין לפחות שני מקורות ושימוש אחד.
   מקור או שימוש חדש במקום אחר? מוסיפים אותו גם לרשימה של הבדיקה. */

const RES={
  // סדר המשפחות בתרמיל. min: כמה מקורות לפחות. לחלקי בוס יש מקור אחד בכוונה: רק הבוס שלהם (ניר)
  fams:{coins:{min:0},build:{min:2},metal:{min:2},creature:{min:2},boss:{min:1},rare:{min:2}},
  /* דרגות הנדירות של שלל: רגיל, לא שכיח, נדיר, אפי, אגדי. הדרגה של שלל היא הנדירות של המשאב (rar).
     col: הצבע של המסגרת ושל עמוד האור שעל הקרקע. beam: כמה גבוה עמוד האור (0: בלי). party: חגיגה וצליל כשנופל (celebrate ב-fx.js).
     lot: כמה יחידות בכל לחיצה בשוק. market: מאיזו רמת שוק אפשר לקנות */
  rarity:[{id:'common',col:'#A9AFC0',beam:0,lot:5,market:1},{id:'uncommon',col:'#6FD08C',beam:60,lot:5,market:2},{id:'rare',col:'#5AA8FF',beam:110,party:true,lot:2,market:3},
          {id:'epic',col:'#B48CFF',beam:160,party:true,lot:1,market:4},{id:'legend',col:'#FFB347',beam:220,party:true,lot:1,market:5}],
  list:{
    coins:   {fam:'coins',icon:'🪙',rar:0},
    // טבע ובנייה: חומרי בנייה, ועשבים לשיקויים ולברכות במקדש שיגיעו
    wood:    {fam:'build',icon:'🪵',rar:0,sell:1,buy:3},
    stone:   {fam:'build',icon:'🪨',rar:0,sell:1,buy:3},
    cloth:   {fam:'build',icon:'🧵',rar:1,sell:2,buy:6},
    resin:   {fam:'build',icon:'🍯',rar:1,sell:2,buy:6},
    herb:    {fam:'build',icon:'🌿',rar:0,sell:1,buy:4},
    mushroom:{fam:'build',icon:'🍄',rar:1,sell:3,buy:9},
    flower:  {fam:'build',icon:'🌸',rar:1,sell:3,buy:9},
    carrot:  {fam:'build',icon:'🥕',rar:0,sell:1,buy:4,glow:1},   // הגזר הקסום (שני, 31.10.2026). glow: זוהר זהב כשהוא על הרצפה (drops.js). אוכל לחיית המחמד (PET.feed ב-pet.js). משיחים, ופיוחו חופרת אותו
    // מתכות, מהחלשה לחזקה. ככל שהמקום רחוק וקשה יותר, המתכת טובה יותר.
    // האייקון הוא גוש בצבע המתכת, לא כלי (ניר: "המשאב שנראה כמו PICK AXE לא ברור"). האבנים בצורות אחרות, כדי שלא יתבלבלו
    copper:  {fam:'metal',icon:'🟤',rar:0,sell:2,buy:6},
    iron:    {fam:'metal',icon:'⚫',rar:1,sell:4,buy:12},
    silver:  {fam:'metal',icon:'⚪',rar:2,sell:8,buy:25},
    gold:    {fam:'metal',icon:'🟡',rar:3,sell:15,buy:50},
    mythril: {fam:'metal',icon:'🔵',rar:4,sell:30,buy:110},
    // יצורים: כל סוג אויב מפיל את שלו (drop ב-data.js). אבק עצמות משלד, שריון שבור ממשוריין, תמצית צל מרוח נדירה
    bone:    {fam:'creature',icon:'🦴',rar:0,sell:2,buy:6},
    dust:    {fam:'creature',icon:'🌫️',rar:1,sell:3,buy:9},
    hide:    {fam:'creature',icon:'🟫',rar:0,sell:2,buy:6},
    plate:   {fam:'creature',icon:'🛡️',rar:1,sell:4,buy:12},
    essence: {fam:'creature',icon:'✨',rar:1,sell:4,buy:12},
    shadow:  {fam:'creature',icon:'🌑',rar:2,sell:9,buy:28},
    venom:   {fam:'creature',icon:'🟢',rar:1,sell:4,buy:12},
    // חלקי בוס: boss הוא ה-id של הבוס (BOSSES ב-data.js). אי אפשר לקנות, רק להשיג ממנו
    horn:    {fam:'boss',icon:'🦏',rar:4,sell:40,boss:'boss'},
    // נדיר: אבן לכל סוג נזק (elem), בשלוש דרגות: שבורה (C), רגילה, מושלמת (F). אבן כוכב תגן ב-Aging
    rubyC:   {fam:'rare',icon:'♦️',rar:2,sell:8,buy:30,elem:'fire',grade:0},
    ruby:    {fam:'rare',icon:'♦️',rar:3,sell:20,buy:70,elem:'fire',grade:1},
    rubyF:   {fam:'rare',icon:'♦️',rar:4,sell:50,buy:180,elem:'fire',grade:2},
    sapphireC:{fam:'rare',icon:'🔷',rar:2,sell:8,buy:30,elem:'ice',grade:0},
    sapphire:{fam:'rare',icon:'🔷',rar:3,sell:20,buy:70,elem:'ice',grade:1},
    sapphireF:{fam:'rare',icon:'🔷',rar:4,sell:50,buy:180,elem:'ice',grade:2},
    boltC:   {fam:'rare',icon:'🔮',rar:2,sell:8,buy:30,elem:'lightning',grade:0},
    bolt:    {fam:'rare',icon:'🔮',rar:3,sell:20,buy:70,elem:'lightning',grade:1},
    boltF:   {fam:'rare',icon:'🔮',rar:4,sell:50,buy:180,elem:'lightning',grade:2},
    aquaC:   {fam:'rare',icon:'💧',rar:2,sell:8,buy:30,elem:'water',grade:0},
    aqua:    {fam:'rare',icon:'💧',rar:3,sell:20,buy:70,elem:'water',grade:1},
    aquaF:   {fam:'rare',icon:'💧',rar:4,sell:50,buy:180,elem:'water',grade:2},
    amberC:  {fam:'rare',icon:'🔶',rar:2,sell:8,buy:30,elem:'earth',grade:0},
    amber:   {fam:'rare',icon:'🔶',rar:3,sell:20,buy:70,elem:'earth',grade:1},
    amberF:  {fam:'rare',icon:'🔶',rar:4,sell:50,buy:180,elem:'earth',grade:2},
    gem:     {fam:'rare',icon:'💎',rar:2,sell:12,buy:45},   // אבן מגן: שומרת על פריט מירידה כשנכשלים ב-Aging (aging.js)
    star:    {fam:'rare',icon:'🌟',rar:4,sell:45,buy:160}
  },
  /* מה רואים בפס העליון בכל מקום (ניר: "לא חייבים לראות כל הזמן את כל המשאבים"). המפתח: המבנה שעומדים לידו.
     ברשימה: משפחות או משאבים. מה שב-always מוצג תמיד, וכל השאר רק כשיש ממנו. bag: כל מה שיש בתרמיל */
  show:{village:['coins','wood','stone','cloth','resin'],world:'bag',forge:['coins','metal','rare'],mine:['coins','stone','metal'],market:'bag'},
  always:['coins','wood','stone','copper','iron'],
  // מוות בעולם הפתוח: איזה חלק מהתרמיל הולך לאיבוד (worldDeath ב-world.js)
  deathLoss:{resources:0.5,items:0},
  // שמות ישנים בשמירה: 'עפרות' (⛏️) הפכו לברזל
  renamed:{ore:'iron'}
};

const resOf=r=>RES.list[r]||null;
const resIcon=r=>(RES.list[r]||{}).icon||'';
/* תמונה למשאב בממשק (HTML), מהעיצוב של ניר מג'מיני ומ-Creative Claw (icons/ui/res, נחתך עם tools/slice-icons.py). למשאב בלי תמונה: האימוג'י. על הקנבס תמיד האימוג'י (resIcon).
   משאב חדש עם תמונה: קובץ ב-icons/ui/res בשם המשאב, ושורה כאן. אבנים בשלוש דרגות (רסיס, אבן, מושלמת) חולקות תמונה, והמסגרת בצבע הנדירות מבדילה */
const RES_PIC={coins:1,wood:1,stone:1,cloth:1,copper:1,iron:1,silver:1,gold:1,bone:1,hide:1,herb:1,mushroom:1,flower:1,ruby:1,sapphire:1,star:1,resin:1,mythril:1,dust:1,plate:1,essence:1,shadow:1,venom:1,horn:1,bolt:1,aqua:1,amber:1,gem:1,carrot:1,boltC:'bolt',boltF:'bolt',aquaC:'aqua',aquaF:'aqua',amberC:'amber',amberF:'amber',rubyC:'ruby',rubyF:'ruby',sapphireC:'sapphire',sapphireF:'sapphire'};
const resPic=r=>{const p=RES_PIC[r];return p?'<img class="ri" src="icons/ui/res/'+(p===1?r:p)+'.png" alt="">':resIcon(r)};
// כל המשאבים של משפחה, לפי הסדר בטבלה
const resFam=f=>Object.keys(RES.list).filter(r=>RES.list[r].fam===f);
// שמירה ישנה: משאב ששמו השתנה עובר לשם החדש, בתרמיל ובמחסן. נקרא מ-saveLoad
function resMigrate(sv){
  for(const box of [sv.bag,sv.stash])for(const o in RES.renamed)if(box[o]){const n=RES.renamed[o];box[n]=(box[n]||0)+box[o];delete box[o]}
}
// מה מוצג בפס העליון עכשיו: רשימת משאבים, או null = כל מה שיש בתרמיל
function resShown(place){
  const s=RES.show[place]||RES.show.village;if(s==='bag')return null;
  return s.flatMap(k=>RES.fams[k]?resFam(k):[k]).filter(r=>RES.always.includes(r)||SAVE.bag[r]>0);
}
// השם של משאב, עם הדרגה של אבן: 'אודם שבור'
const resName=r=>{const R=resOf(r);return R&&R.grade!=null?T('gemName',T('gem.'+R.elem),R.grade):T('res.'+r)};

/* "מה זה?": שורה אחת על משאב, כשנוגעים בו בתרמיל או בפס העליון. מה הוא, מאיפה הוא מגיע ובשביל מה, מחושב מהטבלאות עצמן,
   כך שמקור או שימוש חדש מופיע כאן לבד. מכל סוג עד RES.tip.max שמות */
RES.tip={max:3,ms:3500};
function resWhere(r){
  const src=new Set(),use=new Set(),has=t=>t&&t[r];
  for(const k in NODES.kinds)if(has(NODES.kinds[k].drop)||has(NODES.kinds[k].wdrop))src.add(T('node.'+k));
  for(const t in ETYPES)if(has(ETYPES[t].drop))src.add(T('foe.'+t));
  for(const b in BOSSES)if(has(BOSSES[b].drop))src.add(T('foe.boss'));
  if(has(WANTED.drop)||WANTED.loot.some(l=>has(l.res)))src.add(T('foe.wanted'));
  for(const k in VILLAGE.b){const B=VILLAGE.b[k];if(B.make&&B.make[r]&&B.make[r].some(n=>n>0))src.add(T('vil.'+k));if(B.cost.some(has))use.add(T('vil.'+k))}
  if(Object.values(GEAR.recipes).some(has))use.add(T('tip.craft'));
  if(AGING.cost.some(has)||AGING.gem===r)use.add(T('tip.aging'));
  for(const k in PET.kinds)if(PET.kinds[k].stages.some(s=>has(s.dig.loot)))src.add(T('pet.name.'+k));   // חפירה של חיית המחמד
  if(PET.feed.res===r)use.add(T('tip.pet'));
  if(RES.list[r].sell)use.add(T('vil.market'));
  return{src:[...src],use:[...use]};
}
function resTip(r){
  const R=resOf(r);if(!R)return '';
  const w=resWhere(r),cut=a=>a.slice(0,RES.tip.max).join(', ')+(a.length>RES.tip.max?'…':'');
  return R.icon+' '+resName(r)+' · '+T('tier')[R.rar]+(w.src.length?' · '+T('tip.from',cut(w.src)):'')+(w.use.length?' · '+T('tip.for',cut(w.use)):'');
}
// נגיעה בתג של משאב (resChip ב-village.js, data-r) מציגה את השורה מעליו לכמה שניות
document.addEventListener('click',e=>{
  const c=e.target.closest&&e.target.closest('.res[data-tip]');if(!c)return;
  let t=document.getElementById('resTip');if(!t){t=document.createElement('div');t.id='resTip';t.className='restip';document.body.appendChild(t)}
  t.textContent=resTip(c.dataset.tip);t.dir=DIR;t.hidden=false;
  const b=c.getBoundingClientRect();t.style.top=Math.max(4,b.bottom+6)+'px';
  clearTimeout(t._h);t._h=setTimeout(()=>{t.hidden=true},RES.tip.ms);
});
