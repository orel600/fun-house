/* ציוד ותרמיל: משבצת לנשק, משבצות לאקססוריז, ו-5 משבצות לחפצים המסתובבים (נפתחות עם רמת הדמות).
   כל פריט הוא שורה ב-GEAR.items. בתרמיל פריט נשמר לפי ה-id שלו, כמו משאב (SAVE.bag.oakSword=1), ומה שלבוש נשמר ב-SAVE.gear.
   הסטטים של מה שלבוש חלים על השחקן בתחילת כל ריצה: gearReset, נקרא מ-reset.
   שלל: בסוף ריצה נופלים לפעמים פריטים לתרמיל (gearLoot, נקרא מ-gameOver), ליד המשאבים שהכפר מטפל בהם.
   המסך נפתח מכל מקום (כפתור בכפר ובזירה), ובזירה הריצה עוצרת. השמות והטקסטים ב-lang.js: 'it.<id>' לפריטים, 'st.<סטט>', 'orb.<סוג>' ו-'gear.*' */

const GEAR={
  slots:{acc:2,boots:1,orbit:[1,1,5,10,15]},   // boots: משבצת לנעליים, מתחת לאקססוריז בבובה   // orbit: מאיזו רמת דמות נפתחת כל משבצת. 2 פתוחות בהתחלה
  // החומרים, מהחלש לחזק. col: הצבע של הפריט (tint), אלא אם ב-look כתוב אחרת. w: כמה נפוץ בשלל.
  // metal: המשאב (RES) של השכבה. כל מתכון בשכבה צריך אותו, ובנפחייה ברמה L יוצרים עד שכבה L-1
  tiers:[{id:'wood',col:'#B07A45',w:50,metal:'wood'},{id:'iron',col:'#9AA3AD',w:30,metal:'iron'},{id:'silver',col:'#DCE3EA',w:14,metal:'silver'},{id:'gold',col:C.gold,w:5,metal:'gold'},{id:'legend',col:'#FF6FB5',w:1,metal:'mythril'}],
  // הסטטים. איך כל אחד חל על השחקן: gearReset. unit: מה מוצג אחרי המספר. w: משקל בהשוואה "מה יותר טוב"
  stats:{sdmg:{unit:'%',w:1},gdmg:{unit:'%',w:1},hp:{unit:'',w:0.4},speed:{unit:'%',w:1.5},magnet:{unit:'%',w:0.3},regen:{unit:'',w:8},
    // מגיעים מכוחות (powers.js). t: מפתח השם ב-lang.js, כש-'st.<סטט>' כבר תפוס
    aspd:{unit:'%',w:1.5,t:'gst.aspd'},crit:{unit:'%',w:1.5,t:'gst.crit'},loot:{unit:'%',w:0.5,t:'gst.loot'},def:{unit:'%',w:1.5,t:'gst.def'},combo:{unit:'%',w:1,t:'gst.combo'}},   // combo: נזק שילובים בעולם (wcombo.js)
  // חפצים מסתובבים: הסוג והאייקון במסך הציוד. מה כל סוג עושה בזירה: ORBIT ב-orbit.js
  orbit:{attack:'🔥',defense:'🛡️',control:'❄️',support:'💚',luck:'🍀'},
  /* הפריטים. slot: weapon / acc / boots / orbit. נעליים נותנות מהירות (speed). tier: מספר ב-tiers. w: סוג הנשק ב-WEAPONS (weapons.js): איך הוא תוקף. איתו מתחילים את הריצה.
     חוק הנדירות (ניר, 1.11.2026: "נעליים נדירות גרועות מרגילות"): בכל משבצת, כל פריט בשכבה מסוימת שווה (gScore) לפחות פי ladder
     מהפריט הכי חזק בשכבה שמתחתיו (בערך +25–35% לסטט הראשי, או סטט שני ששווה יותר). מתקנים את המספרים כאן, לא בקוד.
     gLadder מוצא הפרות, tools/gear-audit.js מדפיס את כולם, ו-check.js נכשל כשיש הפרה. חפצים מסתובבים מחוץ לחוק: כל סוג עושה משהו אחר
     look: איך הפריט נראה, כדי שכל שדרוג ייראה. tint צבע, glow זוהר, model המודל בתלת-ממד (w_<שם> מ-Fantasy Weapons, והחומר לפי tier).
     model: הכי קרוב לתמונה של הפריט (icons/ui/gear). הטבלה, וכמה כל אחד דומה: docs/concept-item-models.md (ניר, 4.11.2026) */
  items:{
    oakSword:   {slot:'weapon',tier:0,w:'sword',icon:'🗡️',stats:{sdmg:10},look:{model:'w_sword_A'}},
    ironSword:  {slot:'weapon',tier:1,w:'sword',icon:'🗡️',stats:{sdmg:25},look:{model:'w_sword_B'}},
    silverBlade:{slot:'weapon',tier:2,w:'sword',icon:'⚔️',stats:{sdmg:40,speed:5},look:{model:'w_sword_C',glow:'#DCE3EA'}},
    oakBow:     {slot:'weapon',tier:0,w:'bow',icon:'🏹',stats:{gdmg:10},look:{model:'w_bow_A_withString'}},
    ironBow:    {slot:'weapon',tier:1,w:'bow',icon:'🏹',stats:{gdmg:25},look:{model:'w_bow_B_withString'}},
    goldBow:    {slot:'weapon',tier:3,w:'bow',icon:'🏹',stats:{gdmg:60,magnet:20},look:{model:'w_bow_B_withString',glow:C.gold}},
    oakStaff:   {slot:'weapon',tier:0,w:'staff',icon:'🪄',stats:{gdmg:5,magnet:15},look:{model:'w_staff_A'}},   // הנשק של הקוסם: קסם שמתביית
    /* נשקים לכל דמות בכל שכבה (ניר, 2.11.2026: "הגעתי לרמה 20 ולא נפל לי אף נשק שמתאים לקלאס שלי"). לקוסם היה רק מטה עץ,
       ולכל דמות יש עכשיו נשק בכל שכבה עד אגדי. איזה נשק שייך לאיזו דמות: arms ב-HEROES (heroes.js), וההטיה בשלל: LOOT.gear.cls */
    ironStaff:  {slot:'weapon',tier:1,w:'staff',icon:'🪄',stats:{gdmg:20,magnet:15},look:{model:'w_staff_B'}},
    silverWand: {slot:'weapon',tier:2,w:'wand',icon:'🪄',stats:{gdmg:38,speed:4},look:{model:'w_wand_A',glow:'#DCE3EA'}},
    goldStaff:  {slot:'weapon',tier:3,w:'staff',icon:'🪄',stats:{gdmg:60,regen:0.6},look:{model:'w_staff_B',glow:C.gold}},
    starStaff:  {slot:'weapon',tier:4,w:'staff',icon:'🌟',stats:{gdmg:85,magnet:25,regen:0.6},look:{model:'w_staff_B',glow:'#FF6FB5'}},
    ironAxe:    {slot:'weapon',tier:1,w:'axe',icon:'🪓',stats:{sdmg:24},look:{model:'w_axe_A'}},
    goldAxe:    {slot:'weapon',tier:3,w:'axe',icon:'🪓',stats:{sdmg:60,hp:15},look:{model:'w_axe_B',glow:C.gold}},
    dragonBlade:{slot:'weapon',tier:4,w:'sword',icon:'⚔️',stats:{sdmg:85,speed:6},look:{model:'w_item_dragonBlade',glow:'#FF6FB5'}},
    skyBow:     {slot:'weapon',tier:4,w:'bow',icon:'🏹',stats:{gdmg:85,speed:6},look:{model:'w_bow_B_withString',glow:'#FF6FB5'}},
    boneCharm:  {slot:'acc',tier:0,icon:'🦴',stats:{hp:15}},
    ironRing:   {slot:'acc',tier:1,icon:'💍',stats:{regen:1}},
    starterBoots:{slot:'boots',tier:0,type:'boots',icon:'👟',stats:{speed:8}},   // הפרס של הקווסט הראשון של ראש הכפר (quests.js)
    swiftBoots: {slot:'boots',tier:2,type:'boots',icon:'👢',stats:{speed:13}},
    goldAmulet: {slot:'acc',tier:3,icon:'📿',stats:{hp:30,magnet:30},look:{glow:C.gold}},
    crown:      {slot:'acc',tier:4,icon:'👑',stats:{hp:40,sdmg:15,gdmg:15},look:{glow:'#FF6FB5'}},
    // סטים (sets.js): שניים או ארבעה חלקים מאותו סט נותנים בונוס. השומר האבן: מקרוב ועמיד. צייד הסערה: מרחוק ומהיר
    wardenHammer:{slot:'weapon',tier:1,w:'hammer',set:'warden',icon:'🔨',stats:{sdmg:22},look:{model:'w_hammer_A'}},
    wardenRing: {slot:'acc',tier:1,set:'warden',icon:'💍',stats:{hp:20}},
    wardenCharm:{slot:'acc',tier:1,set:'warden',icon:'🪨',stats:{hp:12,regen:0.4}},
    wardenBoots:{slot:'boots',tier:1,type:'boots',set:'warden',icon:'🥾',stats:{speed:7,hp:12}},
    stormBow:   {slot:'weapon',tier:2,w:'bow',set:'storm',icon:'🏹',stats:{gdmg:35},look:{model:'w_bow_B_withString',glow:'#C7A6FF'}},
    stormRing:  {slot:'acc',tier:2,set:'storm',icon:'💍',stats:{gdmg:11}},
    stormFeather:{slot:'acc',tier:2,set:'storm',icon:'🪶',stats:{speed:4,magnet:15}},
    stormBoots: {slot:'boots',tier:2,type:'boots',set:'storm',icon:'👢',stats:{speed:13}},
    emberOrb:   {slot:'orbit',tier:0,type:'attack'},
    stoneOrb:   {slot:'orbit',tier:0,type:'defense'},
    frostOrb:   {slot:'orbit',tier:0,type:'control'},
    leafOrb:    {slot:'orbit',tier:0,type:'support'},
    cloverOrb:  {slot:'orbit',tier:0,type:'luck'},
    // חפצים משולבים (orbit.js, ORBIT.combo): לא נופלים מהשלל הרגיל, רק מבוסים. types: החלקים, type: הראשי (לצבע)
    steamOrb:   {slot:'orbit',tier:2,type:'attack',types:['attack','control'],icon:'🔥❄️'},
    wardenOrb:  {slot:'orbit',tier:2,type:'defense',types:['defense','support'],icon:'🛡️💚'},
    gambleOrb:  {slot:'orbit',tier:2,type:'attack',types:['attack','luck'],icon:'🔥🍀'},
    trinityOrb: {slot:'orbit',tier:3,type:'attack',types:['attack','defense','support'],icon:'🔥🛡️💚'},
    // רק מהתכה בנפחייה (fuse.js), לא מבוסים (fuse:true). כל שילוב של 2 או 3 חלקים קיים, כדי שכל התכה תיתן משהו
    bastionOrb:  {slot:'orbit',tier:2,type:'attack',types:['attack','defense'],icon:'🔥🛡️',fuse:true},
    phoenixOrb:  {slot:'orbit',tier:2,type:'attack',types:['attack','support'],icon:'🔥💚',fuse:true},
    glacierOrb:  {slot:'orbit',tier:2,type:'control',types:['control','defense'],icon:'❄️🛡️',fuse:true},
    dewOrb:      {slot:'orbit',tier:2,type:'control',types:['control','support'],icon:'❄️💚',fuse:true},
    snowflakeOrb:{slot:'orbit',tier:2,type:'control',types:['control','luck'],icon:'❄️🍀',fuse:true},
    talismanOrb: {slot:'orbit',tier:2,type:'defense',types:['defense','luck'],icon:'🛡️🍀',fuse:true},
    bloomOrb:    {slot:'orbit',tier:2,type:'support',types:['support','luck'],icon:'💚🍀',fuse:true},
    tempestOrb:  {slot:'orbit',tier:3,type:'attack',types:['attack','control','defense'],icon:'🔥❄️🛡️',fuse:true},
    auroraOrb:   {slot:'orbit',tier:3,type:'attack',types:['attack','control','support'],icon:'🔥❄️💚',fuse:true},
    cometOrb:    {slot:'orbit',tier:3,type:'attack',types:['attack','control','luck'],icon:'🔥❄️🍀',fuse:true},
    dragonOrb:   {slot:'orbit',tier:3,type:'attack',types:['attack','defense','luck'],icon:'🔥🛡️🍀',fuse:true},
    sunOrb:      {slot:'orbit',tier:3,type:'attack',types:['attack','support','luck'],icon:'🔥💚🍀',fuse:true},
    frostwallOrb:{slot:'orbit',tier:3,type:'control',types:['control','defense','support'],icon:'❄️🛡️💚',fuse:true},
    moonOrb:     {slot:'orbit',tier:3,type:'control',types:['control','defense','luck'],icon:'❄️🛡️🍀',fuse:true},
    springOrb:   {slot:'orbit',tier:3,type:'control',types:['control','support','luck'],icon:'❄️💚🍀',fuse:true},
    sanctumOrb:  {slot:'orbit',tier:3,type:'defense',types:['defense','support','luck'],icon:'🛡️💚🍀',fuse:true}
  },
  gift:['oakSword','oakBow','boneCharm'],   // פעם אחת, בביקור הראשון בכפר
  /* יצירה בנפחייה: מה עולה כל פריט. המתכת של השכבה, וחומרים מיצורים, מבוסים ואבנים, כדי שלכל משאב יהיה שימוש.
     חרבות צריכות עצמות, קשתות עור או ארס, תכשיטים תמצית. האבנים לפי סוג הנזק: אודם לחרב, ספיר למגפיים, ברקית לקשת */
  recipes:{
    oakSword:   {wood:12,bone:4,coins:15},
    oakBow:     {wood:12,cloth:4,resin:2,coins:15},
    boneCharm:  {wood:4,bone:10,dust:2,cloth:2,coins:10},
    ironSword:  {iron:10,copper:4,bone:8,plate:2,rubyC:1,coins:40},
    ironBow:    {iron:6,wood:10,hide:6,resin:4,boltC:1,coins:40},
    ironRing:   {iron:6,copper:6,essence:4,sapphireC:1,coins:40},
    silverBlade:{silver:8,iron:6,hide:6,ruby:1,coins:90},
    swiftBoots: {silver:4,hide:10,cloth:6,sapphire:1,coins:90},
    goldBow:    {gold:6,silver:4,venom:8,bolt:1,coins:160},
    // נשקי הדמויות: מטות ושרביט מתמצית ואבק, גרזנים מעצם וקליפות, והאגדיים ממיתריל
    ironStaff:  {iron:6,wood:10,essence:4,aquaC:1,coins:40},
    ironAxe:    {iron:10,wood:6,bone:6,rubyC:1,coins:40},
    silverWand: {silver:6,wood:6,essence:8,aqua:1,coins:90},
    goldStaff:  {gold:6,silver:4,essence:10,shadow:2,aqua:1,coins:160},
    goldAxe:    {gold:6,iron:8,plate:4,horn:1,ruby:1,coins:160},
    starStaff:  {mythril:6,gold:4,essence:12,star:1,shadow:4,coins:300},
    dragonBlade:{mythril:6,gold:4,horn:3,star:1,ruby:2,coins:300},
    skyBow:     {mythril:6,gold:4,venom:8,star:1,bolt:2,coins:300},
    goldAmulet: {gold:8,essence:10,shadow:2,venom:4,aqua:1,horn:1,coins:160},
    crown:      {mythril:6,gold:6,horn:3,star:1,shadow:4,amberF:1,coins:300},
    // סטים: השומר מאבן, ברזל וקליפות (מהמחצבה), הצייד מכסף, נוצות ותמצית, עם רסיס ברק
    wardenHammer:{iron:10,stone:16,plate:4,amberC:1,coins:50},
    wardenRing: {iron:6,stone:10,plate:2,coins:40},
    wardenCharm:{iron:4,stone:14,plate:3,essence:2,coins:40},
    wardenBoots:{iron:4,stone:8,hide:6,coins:40},
    stormBow:   {silver:6,wood:10,essence:6,bolt:1,coins:100},
    stormRing:  {silver:5,essence:5,boltC:1,coins:80},
    stormFeather:{silver:3,cloth:6,dust:6,essence:3,coins:80},
    stormBoots: {silver:4,hide:8,dust:4,coins:80},
    // חפצים מסתובבים: עשבים, אבק וקליפות, ואבן שבורה לפי הסוג
    emberOrb:   {wood:6,dust:4,rubyC:1,coins:20},
    stoneOrb:   {wood:6,stone:10,plate:3,amberC:1,coins:20},
    frostOrb:   {wood:6,mushroom:4,aquaC:1,coins:20},
    leafOrb:    {wood:6,herb:8,flower:2,coins:20},
    cloverOrb:  {wood:6,flower:4,mushroom:2,coins:20}
  },
  // שלל בסוף ריצה. run: סיכוי לפריט אחד בכל ריצה. boss: סיכוי לפריט על כל בוס שהובס.
  // slots: מה יכול ליפול
  loot:{run:0.35,boss:1,slots:['weapon','acc','boots','orbit']},
  /* מסך הציוד: הבובה באמצע, ומשבצות מסביב. start/end: הצדדים (מתהפכים לפי השפה), under: שורה מתחת לבובה.
     משבצת חדשה (למשל מגפיים) נכנסת לאחת הרשימות. drag: כמה פיקסלים זזים לפני שלחיצה הופכת לגרירה.
     hold: באצבע, בתוך התרמיל שנגלל: כמה מילישניות מחזיקים לפני שגוררים. תזוזה לפני כן היא גלילה, והפריט לא קופץ (אוראל, 1.11.2026) */
  doll:{start:['weapon'],end:['acc','boots'],under:['orbit']},
  ladder:1.25,
  /* התרמיל (ניר, 1.11.2026: "הכל מרגיש בלגן"): מסננים לפי משבצת בראש התרמיל, באותו סדר שבו הפריטים ממוינים (ואחר כך נדירות וחוזק).
     sell: כמה מטבעות מקבלים על פריט במכירה, לפי שכבה. sellPlus: כמה מוסיפה כל רמת Aging למחיר (0.2 = ‎+20%).
     sellRare: מאיזו שכבה פריט "יקר" (נדיר ומעלה): לא נבחר ב"בחר חלשים", ומכירה שלו מבקשת אישור */
  filter:{weapon:'⚔️',boots:'👢',acc:'💍',orbit:'✨'},
  sell:{0:6,1:15,2:40,3:90,4:200},sellPlus:0.2,sellRare:2,
  drag:8,hold:220
};

// פריט ששודרג בנפחייה נשמר עם הרמה שלו: 'oakBow+3' (aging.js), ועם כוח אחריה: 'oakBow+3#keen' (powers.js).
// gBase: בלי הרמה והכוח, gPlus: הרמה, gPow: הכוח
const gBase=id=>String(id).split(/[+#~]/)[0];   // ~104: האיכות של חפץ שנפל בעולם (itemroll.js)
const gPlus=id=>{const m=/\+(\d+)/.exec(id||'');return m?+m[1]:0};
const gPow=id=>{const m=/#(\w+)/.exec(id||'');return m?m[1]:null};
const gItem=id=>id&&GEAR.items[gBase(id)]||null;
// ה-+3 נכתב משמאל לימין גם בעברית (\u2066...\u2069), אחרת הסימן קופץ לצד השני
const gName=id=>T('it.'+gBase(id))+(gPlus(id)?' \u2066+'+gPlus(id)+'\u2069':'');
// הסטטים של הפריט, כולל השדרוג בנפחייה, האיכות, הכוח שעליו (powers.js) ובונוס המחלקה (itemroll.js). pure: בלי בונוס המחלקה, לשורות בחלון
function gStats(id,pure){const s=(gItem(id)||{}).stats||{},k=ageMult(gPlus(id))*gQ(id)/100,c=!pure&&irClsOn(id)?1+ITEMROLL.cls.bonus:1,o={};for(const x in s)o[x]=Math.round(s[x]*k*c*10)/10;
  const p=powGive(gPow(id));for(const x in p)o[x]=(o[x]||0)+p[x];return o}
/* שפת הנדירות (ניר, 3.11.2026: "שיהיה ברור וקל להבדיל... שהעיצוב עצמו ידבר"): כל מקום שמציג חפץ מוסיף את gRarCls, והמראה כולו ב-css/rarity.css:
   עץ פשוט, ברזל עם מסמרות, כסף עם ברק, זהב עבה עם אבנים ומעבר אור, ואגדי עם זוהר נע וניצוצות. התמונה (gPic) נכנסת לתוך המסגרת כמו שהיא */
const gRarId=id=>gItem(id)?GEAR.tiers[gItem(id).tier].id:'';
const gRarCls=id=>gItem(id)?' rar rar-'+gRarId(id):'';
// משפט האופי של החפץ ('itf.<id>' ב-lang.js), או ריק לחפץ בלי משפט (החפצים המסתובבים)
const gFlav=id=>TEXT['itf.'+gBase(id)]?T('itf.'+gBase(id)):'';
const gFlavHtml=id=>gFlav(id)?'<p class="gflav">'+gFlav(id)+'</p>':'';
const gTint=id=>(gItem(id).look||{}).tint||GEAR.tiers[gItem(id).tier].col;
const gIcon=id=>{const it=gItem(id);return it.icon||GEAR.orbit[it.type]};
/* תמונה לפריט בממשק (HTML), מ-Creative Claw (icons/ui/gear, נחתך עם tools/slice-icons.py). בלי תמונה: האימוג'י. על הקנבס תמיד האימוג'י (gIcon) */
const GEAR_PIC={oakSword:1,ironSword:1,silverBlade:1,oakBow:1,ironBow:1,goldBow:1,oakStaff:1,boneCharm:1,ironRing:1,starterBoots:1,swiftBoots:1,goldAmulet:1,crown:1,wardenHammer:1,wardenRing:1,wardenCharm:1,wardenBoots:1,stormBow:1,stormRing:1,stormFeather:1,stormBoots:1,
  // 3.11.2026 (Creative Claw, tools/slice-objects.py): שריון לפי מחלקה ושכבה, מגנים, ושמונה נשקים שהיו אימוג'י. הדרגה נראית בתמונה עצמה: עץ, ברזל, כסף, זהב, אגדי
  warriorHead0:1,warriorHead1:1,warriorHead2:1,warriorHead3:1,warriorHead4:1,warriorBody0:1,warriorBody1:1,warriorBody2:1,warriorBody3:1,warriorBody4:1,hunterHead0:1,hunterHead1:1,hunterHead2:1,hunterHead3:1,hunterHead4:1,hunterBody0:1,hunterBody1:1,hunterBody2:1,hunterBody3:1,hunterBody4:1,mageHead0:1,mageHead1:1,mageHead2:1,mageHead3:1,mageHead4:1,mageBody0:1,mageBody1:1,mageBody2:1,mageBody3:1,mageBody4:1,shield0:1,shield1:1,shield2:1,shield3:1,shield4:1,ironStaff:1,silverWand:1,goldStaff:1,starStaff:1,ironAxe:1,goldAxe:1,dragonBlade:1,skyBow:1,
  // 3.11.2026: החפצים המסתובבים (של אוראל, רק התמונה): כלוב עץ, כסף או זהב לפי הדרגה, והיסודות מעורבבים בכדור
  emberOrb:1,stoneOrb:1,frostOrb:1,leafOrb:1,cloverOrb:1,steamOrb:1,wardenOrb:1,gambleOrb:1,bastionOrb:1,phoenixOrb:1,glacierOrb:1,dewOrb:1,snowflakeOrb:1,talismanOrb:1,bloomOrb:1,trinityOrb:1,tempestOrb:1,auroraOrb:1,cometOrb:1,dragonOrb:1,sunOrb:1,frostwallOrb:1,moonOrb:1,springOrb:1,sanctumOrb:1};
const gPic=id=>GEAR_PIC[gBase(id)]?'<img class="ri" src="icons/ui/gear/'+gBase(id)+'.png" alt="">':gIcon(id);
// כמה הפריט שווה, כדי לדעת אם החלפה היא שיפור. חומר טוב יותר שובר שוויון
function gScore(id,pure){const it=gItem(id);if(!it)return 0;let n=it.tier*0.01;const s=gStats(id,pure);for(const k in s)n+=s[k]*GEAR.stats[k].w;return n}
// חוק הנדירות (GEAR.ladder): בכל משבצת, הפריט הכי חלש בכל שכבה מול הכי חזק בשכבה הקודמת שיש בה פריטים. מחזיר רק הפרות
function gLadder(){
  const by={},bad=[];
  for(const id in GEAR.items){const it=GEAR.items[id];if(it.slot==='orbit')continue;((by[it.slot]=by[it.slot]||{})[it.tier]=by[it.slot][it.tier]||[]).push(id)}
  for(const slot in by){const ts=Object.keys(by[slot]).map(Number).sort((a,b)=>a-b);
    for(let i=1;i<ts.length;i++){const lo=by[slot][ts[i-1]],hi=by[slot][ts[i]],sc=id=>gScore(id)-GEAR.items[id].tier*0.01;
      const top=lo.reduce((a,b)=>sc(b)>sc(a)?b:a),weak=hi.reduce((a,b)=>sc(b)<sc(a)?b:a),k=sc(weak)/Math.max(1e-9,sc(top));
      if(k<GEAR.ladder)bad.push({slot,weak,top,k:Math.round(k*100)/100})}}
  return bad;
}
const heroLv=()=>SAVE.hero.level||1;
const gOrbOpen=()=>GEAR.slots.orbit.filter(l=>heroLv()>=l).length;
const gOpen=slot=>slot==='weapon'?1:slot==='orbit'?gOrbOpen():GEAR.slots[slot];
const gGet=(slot,i)=>slot==='weapon'?SAVE.gear.weapon:(SAVE.gear[slot]||[])[i]||null;   // שמירה ישנה: אין עדיין head/body (armor.js)
function gSet(slot,i,id){if(slot==='weapon')SAVE.gear.weapon=id;else (SAVE.gear[slot]||(SAVE.gear[slot]=[]))[i]=id}
// לאיזו משבצת ייכנס פריט: הראשונה הריקה, ואם הכל מלא, זו עם הפריט הכי חלש
function gTarget(it){
  const n=gOpen(it.slot);let best=0;
  for(let i=0;i<n;i++){if(!gGet(it.slot,i))return i;if(gScore(gGet(it.slot,i))<gScore(gGet(it.slot,best)))best=i}
  return best;
}
// כל מה שלבוש עכשיו, בלי משבצות נעולות
const GEAR_WEAR=['weapon','shield','head','body','acc','boots','orbit'];   // shield, head, body: שריון (armor.js)
function gearWorn(){const out=[];for(const s of GEAR_WEAR)for(let i=0;i<gOpen(s);i++){const id=gGet(s,i);if(gItem(id))out.push(id)}return out}
// כולל את הבונוס של סטים (sets.js), כדי שכל מי שמלביש ומוריד ציוד יקבל גם אותו
function gearStats(ids=gearWorn()){const t={};for(const id of ids){const s=gStats(id);for(const k in s)t[k]=(t[k]||0)+s[k]}const b=setStats(ids);for(const k in b)t[k]=(t[k]||0)+b[k];return t}

/* ---- ללבוש ולהוריד: מהתרמיל למשבצת ובחזרה. מה שהיה במשבצת חוזר לתרמיל ---- */
// i: לאיזו משבצת (בגרירה). בלי i: המשבצת שמתאימה הכי (gTarget). משבצת מסוג אחר או נעולה: לא לובשים
function gearEquip(id,slot,i){
  const it=gItem(id);if(!it||slot&&slot!==it.slot)return null;
  if(!irCanWear(id))return null;   // דרישות: רמה ותכונה (itemroll.js)
  if(i==null)i=gTarget(it);if(i>=gOpen(it.slot)||!bagTake(id))return null;
  const old=gGet(it.slot,i);
  gSet(it.slot,i,id);if(old)bagAdd(old);
  saveNow();
  return{slot:it.slot,i,old,better:gScore(id)>gScore(old)};
}
// מחליף בין שתי משבצות מאותו סוג (גרירה ממשבצת למשבצת)
function gearSwap(slot,a,b){if(a===b||b>=gOpen(slot))return false;const x=gGet(slot,a);gSet(slot,a,gGet(slot,b));gSet(slot,b,x);saveNow();return true}
function gearUnequip(slot,i){const id=gGet(slot,i);if(!id)return false;gSet(slot,i,null);bagAdd(id);saveNow();return true}

/* ---- בתחילת כל ריצה (ובכפר): מתנת פתיחה פעם אחת, והסטטים של הציוד חלים על השחקן ---- */
function gearReset(){
  if(!SAVE.gearGift){GEAR.gift.forEach(id=>bagAdd(id));SAVE.gearGift=true;saveNow()}
  armorGift();   // מגן עץ, פעם אחת (armor.js)
  gApply(gearStats(),1);P.hp=P.maxHp;
  wEquip(SAVE.gear.weapon);   // הנשק שלבוש ביד, ואיתו איך תוקפים (weapons.js)
}
// מלביש סטטים על השחקן (k=1) או מוריד אותם (k=-1). כך ציוד שמחליפים באמצע ריצה שומר על השדרוגים של הריצה
function gApply(s,k){
  const m=x=>Math.pow(1+(s[x]||0)/100,k);
  P.sw.dmg*=m('sdmg');P.gn.dmg*=m('gdmg');P.speed*=m('speed');P.magnet*=m('magnet');
  P.maxHp+=k*(s.hp||0);P.regen+=k*(s.regen||0);
  if(s.aspd){P.sw.cd/=m('aspd');P.gn.cd/=m('aspd')}   // קצב התקפה (נקודות דמות, stats.js)
  if(s.hpPct)P.maxHp*=m('hpPct');if(s.arc)P.sw.arc*=m('arc');P.gn.multi+=k*(s.multi||0);P.gn.pierce+=k*(s.pierce||0);   // עץ הסקילים (stats.js)
  P.def+=k*(s.def||0);P.combo=(P.combo||0)+k*(s.combo||0);   // נזק שילובים (wcombo.js)
  P.crit+=k*(s.crit||0);P.loot+=k*(s.loot||0);
}
// אחרי שינוי בציוד: מורידים את מה שהיה ומלבישים את החדש, מיד. חיים שנוספו מתמלאים, ונשק חדש נכנס ליד
function gearLive(before,id){
  const max0=P.maxHp;gApply(before,-1);gApply(gearStats(),1);
  P.hp=Math.max(1,Math.min(P.maxHp,P.hp+Math.max(0,P.maxHp-max0)));
  if(P.wid!==SAVE.gear.weapon)wEquip(SAVE.gear.weapon);
}

/* ---- יצירה בנפחייה: משלמים לפי GEAR.recipes, והפריט נכנס לתרמיל ---- */
const gCanCraft=id=>gItem(id)&&GEAR.recipes[id]&&gItem(id).tier<vLv('forge');
function gearCraft(id){
  const c=GEAR.recipes[id];if(!gCanCraft(id)||Object.keys(c).some(r=>!bagHas(r,c[r])))return false;
  for(const r in c)bagTake(r,c[r]);bagAdd(id);saveNow();
  const B=VILLAGE.b.forge;celebrate(B.x,B.y,'gear',gIcon(id));banner(T('forge.made',T('it.'+id)),gTint(id));
  return true;
}
// החלק של היצירה בפאנל הנפחייה (village.js): כל פריט שהרמה פותחת, עם המחיר שלו
function forgeHtml(){
  const ids=Object.keys(GEAR.recipes).filter(gCanCraft);
  return '<span class="sk">'+T('forge.craft')+'</span>'+ids.map(id=>{const c=GEAR.recipes[id],ok=Object.keys(c).every(r=>bagHas(r,c[r]));
    return '<div class="craft'+gRarCls(id)+'" style="--rar:'+gRarCol(id)+'"><button class="res item" data-act="craft" data-r="'+id+'" style="--tint:'+gTint(id)+'"'+(ok?'':' disabled')+'><span class="rpic'+gRarCls(id)+'">'+gPic(id)+'</span><b class="rname">'+T('it.'+id)+'</b></button><div class="cost">'+costLine(c)+'</div></div>'}).join('');
}

/* ---- שלל בסוף ריצה ---- */
// מגריל פריט לפי כמה כל שכבה נפוצה. n: כמה הגרלות, והשכבה הגבוהה מביניהן נבחרת (שלל מהמבוקש ומהבוס, LOOT.gear ב-loot.js)
function gRoll(n=1){
  const pool=Object.keys(GEAR.items).filter(id=>GEAR.loot.slots.includes(GEAR.items[id].slot)&&!GEAR.items[id].types);   // משולבים רק מבוסים (orbit.js)
  const one=()=>{let r=Math.random()*pool.reduce((n,id)=>n+GEAR.tiers[GEAR.items[id].tier].w,0);
    for(const id of pool){r-=GEAR.tiers[GEAR.items[id].tier].w;if(r<0)return id}return pool[0]};
  let best=one();for(let i=1;i<n;i++){const id=one();if(GEAR.items[id].tier>GEAR.items[best].tier)best=id}
  return powRoll(best);   // לפעמים עם כוח (powers.js)
}
function gearLoot(){
  if(S.gearLoot)return S.gearLoot;
  const got=S.gearLoot=[],rolls=[GEAR.loot.run];for(let i=0;i<S.bossCount;i++)rolls.push(GEAR.loot.boss);
  for(const ch of rolls)if(Math.random()<ch){const id=gRoll();bagAdd(id);got.push(id)}
  for(let i=0;i<S.bossCount;i++){const id=orbitComboRoll();if(id){bagAdd(id);got.push(id)}}   // חפץ משולב מבוס (orbit.js)
  if(got.length){saveNow();const el=$('sLoot');el.innerHTML=(el.textContent===T('vil.noLoot')?'':el.innerHTML)+got.map(gChip).join('')}
  return got;
}
const gChip=id=>'<span class="res item'+gRarCls(id)+'" style="--tint:'+gTint(id)+';--rar:'+gRarCol(id)+'">'+gPic(id)+' '+gName(id)+'</span>';

/* ---- המסך: התרמיל בצד אחד, הבובה עם המשבצות באמצע, והפרטים בצד השני. נפתח מכפתור 🎒 בכפר ובזירה.
   גוררים פריט מהתרמיל למשבצת כדי ללבוש, ממשבצת לתרמיל כדי להוריד, ובין התרמיל למחסן כשעומדים ליד המחסן.
   לחיצה בוחרת ומראה פרטים והשוואה, עם כפתור: הדרך החלופית לגרירה ---- */
/* שני דפים בחלון (ניר, 1.11.2026: "עדיין בלגן", ומחקר של Diablo Immortal, Archero 2, Torchlight Infinite ו-Genshin):
   page 'gear': הבובה עם המשבצות, התרמיל הרחב והפרטים. page 'char': הנקודות, הבניות ועץ הסקילים, ברוחב מלא */
const GUI={sel:null,tab:'items',page:'gear'};   // sel: מה נבחר: {id} מהתרמיל, {slot,i} ממשבצת, או {sid} מהמחסן. tab: הלשונית בתרמיל
// נפתח מכל מקום: מהכפר ומהזירה. בזירה הריצה עוצרת, כמו במסך השדרוג
function gearOpen(page){if(S.mode!=='play')return;S.mode='gear';joy=null;GUI.sel=null;GUI.view=null;GUI.sell=false;GUI.pick={};GUI.ask=false;GUI.undo=null;GUI.page=page==='char'?'char':'gear';$('ovGear').hidden=false;gearDraw()}
function gearClose(){gDragEnd();GUI.undo=null;GUI.sell=false;$('ovGear').hidden=true;if(S.mode==='gear')S.mode='play'}
// המחסן פתוח במסך רק כשעומדים לידו בכפר, והוא בנוי
const gStashOn=()=>!!(S.vil&&S.vil.near==='stash'&&vLv('stash')>0);
// הנדירות של פריט היא השכבה שלו (עץ = רגיל ... אגדי), ושל משאב היא rar שלו. כך הצבעים זהים לשלל שנופל
const gRar=k=>gItem(k)?gItem(k).tier:(resOf(k)||{}).rar||0;
// הצבע של הדרגה: חפץ לפי החומר של השכבה (GEAR.tiers, כמו המסגרת והתמונה, ניר 3.11.2026), משאב לפי RES.rarity
const gRarCol=k=>gItem(k)?GEAR.tiers[gItem(k).tier].col:RES.rarity[Math.min(gRar(k),RES.rarity.length-1)].col;

const gSign=(k,v)=>'<bdi dir="ltr">'+(v>0?'+':'')+Math.round(v*10)/10+GEAR.stats[k].unit+'</bdi> '+T(GEAR.stats[k].t||'st.'+k);
/* ---- חפץ מסתובב: מה הוא נותן, מהמספרים של ORBIT.types (orbit.js, של אוראל). רק תצוגה: לא משנה איך הוא עובד בזירה.
   כל שורה: k (המפתח, להשוואה), v (המספר), ו-b לשורה בלי מספר (עוצר יריות). הטקסט ב-lang.js תחת 'orb.f.<k>' ---- */
function gOrbFacts(type,k=1){
  const D=ORBIT.types[type]||{},out=[],pc=x=>Math.round(x*100*k);
  if(D.dmg)out.push({k:D.dt,v:pc(D.dmg)});   // אחוז מהנזק של הנשק, בסוג הנזק שלו
  if(D.block)out.push({k:'block',v:1,b:1});
  if(D.shield)out.push({k:'shield',v:1,b:1,n:Math.round(D.shield.every/k)});
  if(D.heal)out.push({k:'heal',v:pc(D.heal.k)});
  if(D.crit)out.push({k:'crit',v:pc(D.crit)});
  if(D.loot)out.push({k:'loot',v:pc(D.loot)});
  return out;
}
const gOrbLine=(f,v)=>f.b?T('orb.f.'+f.k,f.n):'<bdi dir="ltr">'+(v>0?'+':'')+v+'%</bdi> '+T('orb.f.'+f.k);
// lite: חפץ מסתובב מהתרמיל, כשההשוואה שמתחת כבר מראה את כל מה שהוא נותן (▲), כדי שהכל ייכנס בטור בלי גלילה
function gStatsHtml(id,lite){const it=gItem(id),s=gStats(id,true);
  if(it.slot==='orbit')return '<p class="gorb">'+(it.types?it.types.map(t=>T('orb.'+t)).join(' + ')+' · '+T('orb.combo.do',Math.round(ORBIT.combo.share[it.types.length]*100)):T('orb.'+it.type)+' · '+T('orb.do.'+it.type))+'</p>'+(lite?'':'<ul class="gstats">'+orbitFacts(id).map(f=>'<li>'+gOrbLine(f,f.v)+'</li>').join('')+'</ul>');
  return '<ul class="gstats">'+(it.w?'<li class="gdmg">'+wRangeTxt(wItemAvg(id),it.w)+'</li>':'')+Object.keys(s).map(k=>'<li>'+gSign(k,s[k])+irRange(id,k)+'</li>').join('')+'</ul>'+irQHtml(id)+irClsHtml(id)+irReqHtml(id)}   // איכות, בונוס מחלקה ודרישות (itemroll.js)
// מה ישתנה אם לובשים: לכל סטט, ההפרש מול מה שיוצא מהמשבצת, עם חץ למעלה או למטה
function gCompare(id,old){
  if(gItem(id)&&gItem(id).slot==='orbit')return gOrbCompare(id,old);
  const a=gearStats([id]),b=gearStats(old?[old]:[]),ks=[...new Set([...Object.keys(a),...Object.keys(b)])].filter(k=>(a[k]||0)!==(b[k]||0));
  // נשק: הטווח החדש, עם חץ לפי הממוצע מול הנשק שיוצא
  const it=gItem(id),da=it&&it.w?wItemAvg(id)-wItemAvg(old):0,dmg=it&&it.w&&Math.abs(da)>0.05?'<span class="'+(da>0?'up':'down')+'">'+(da>0?'▲':'▼')+' '+wRangeTxt(wItemAvg(id),it.w)+'</span>':'';
  if(!ks.length&&!dmg)return '<p class="dim">'+T('gear.same')+'</p>';
  return '<p class="cmp">'+dmg+ks.map(k=>{const d=(a[k]||0)-(b[k]||0);return '<span class="'+(d>0?'up':'down')+'">'+(d>0?'▲':'▼')+' '+gSign(k,d)+'</span>'}).join('')+'</p>';
}
// חפץ מסתובב מול מה שיוצא מהמשבצת (או משבצת ריקה): מה מתווסף ▲ ומה הולך ▼
function gOrbCompare(id,old){
  const a=orbitFacts(id),b=old&&gItem(old)?orbitFacts(old):[],ks=[...new Set([...a,...b].map(f=>f.k))];
  const v=(l,k)=>(l.find(f=>f.k===k)||{v:0}).v,ds=ks.map(k=>({f:[...a,...b].find(f=>f.k===k),d:v(a,k)-v(b,k)})).filter(x=>x.d);
  if(!ds.length)return '<p class="dim">'+T('gear.same')+'</p>';
  return '<p class="cmp">'+ds.map(x=>'<span class="'+(x.d>0?'up':'down')+'">'+(x.d>0?'▲':'▼')+' '+gOrbLine(x.f,x.d)+'</span>').join('')+'</p>';
}
// משבצת או תא בתרמיל: מסגרת בצבע הנדירות, ופס בצבע סוג הנזק לנשק
function gTile(id,attrs,extra){
  const it=gItem(id),cls='gtile'+(it&&it.w?' '+WEAPONS[it.w].use:'')+gRarCls(id);
  if(!it)return '<button class="'+cls+' empty" '+attrs+'>'+extra+'</button>';
  const glow=(it.look||{}).glow;
  return '<button class="'+cls+'" '+attrs+' style="--tint:'+gTint(id)+';--rar:'+gRarCol(id)+(glow?';--glow:'+glow:'')+'" aria-label="'+gName(id)+'">'+gPic(id)+(gPlus(id)?'<b class="gplus">+'+gPlus(id)+'</b>':'')+(gPow(id)?'<b class="gpw">✦</b>':'')+extra+'</button>';
}
// תא בתרמיל: ▲/▼ מול מה שלבוש, ונקודה לחדש
function gBagTile(k,n,attrs){
  const m=gMark(k),pk=GUI.sell&&(GUI.pick||{})[k],x=(m?'<i class="gmk '+(m>0?'up':'down')+'" aria-hidden="true">'+(m>0?'▲':'▼')+'</i>':'')+(gIsNew(k)?'<i class="gnew" aria-hidden="true"></i>':'')+
    (gLocked(k)?'<i class="glk" aria-hidden="true">🔒</i>':'')+(pk?'<i class="gpk" aria-hidden="true">✓</i>':'');   // מכירה: ✓ על מה שנבחר
  return gTile(k,attrs,(n>1?'<small>×'+shortN(n)+'</small>':'')+x);
}
// תא של משאב: אייקון, כמה יש, ומסגרת בצבע הנדירות
const gResTile=(r,n,attrs)=>'<button class="gtile res" '+attrs+' style="--rar:'+gRarCol(r)+'" aria-label="'+resName(r)+' '+n+'">'+resPic(r)+'<small>×'+shortN(n)+'</small></button>';
const gCell=(k,n,attrs)=>gItem(k)?gTile(k,attrs,n>1?'<small>×'+shortN(n)+'</small>':''):gResTile(k,n,attrs);
// מה בתרמיל בלשונית הנוכחית: items לפריטים, או משפחת משאבים (RES.fams)
// items: כל הפריטים. weapon/boots/acc/orbit: רק משבצת אחת (GEAR.filter). ממוין לפי משבצת, נדירות מלמעלה, ואז חוזק
const gIsItemTab=tab=>tab==='items'||!!GEAR.filter[tab];
function gBagKeys(tab){
  if(gIsItemTab(tab)){const order=Object.keys(GEAR.filter);return Object.keys(SAVE.bag).filter(k=>gItem(k)&&SAVE.bag[k]>0&&(tab==='items'||gItem(k).slot===tab))
    .sort((a,b)=>order.indexOf(gItem(a).slot)-order.indexOf(gItem(b).slot)||gItem(b).tier-gItem(a).tier||gScore(b)-gScore(a))}
  return resFam(tab).filter(r=>SAVE.bag[r]>0);
}
// הלשוניות: "הכל" ומסנן לכל משבצת, וכל משפחת משאבים שיש בה משהו. המטבעות למעלה, ליד הכותרת
const gTabs=()=>['items',...Object.keys(GEAR.filter),...Object.keys(RES.fams).filter(f=>f!=='coins'&&resFam(f).some(r=>SAVE.bag[r]>0))];
const gTabLabel=f=>f==='items'?T('gear.tab.all'):GEAR.filter[f]||(RES.list[resFam(f)[0]]||{}).icon||T('fam.'+f);   // משפחת משאבים: האייקון של המשאב הראשון בה, והשם ב-aria-label
/* ---- סימנים על פריט בתרמיל: ▲ ירוק אם הוא חזק ממה שלבוש במשבצת שלו, ▼ אדום אם חלש, ונקודה לפריט שעוד לא פתחו ---- */
// מה שלבוש במשבצת שהפריט ייכנס אליה (הכי חלש מבין המשבצות), כדי להשוות
const gVsWorn=it=>gGet(it.slot,gTarget(it));
function gMark(k){const it=gItem(k);if(!it||it.slot==='orbit')return 0;if(!irCanWear(k))return -1;const o=gVsWorn(it);if(!o)return 1;const d=gScore(k)-gScore(o);return Math.abs(d)<0.05?0:d>0?1:-1}
// פריטים שכבר ראו: SAVE.gseen. בפעם הראשונה כל מה שכבר בתרמיל נחשב ראוי, כדי ששמירה ישנה לא תתמלא נקודות
function gSeen(){if(!SAVE.gseen){SAVE.gseen={};for(const k in SAVE.bag)if(gItem(k))SAVE.gseen[k]=1}return SAVE.gseen}
const gIsNew=k=>!!gItem(k)&&!gSeen()[k];
/* ---- ללבוש הכי טוב: לכל משבצת (בלי חפצים מסתובבים), הפריט הכי חזק מהתרמיל, אם הוא חזק ממה שלבוש.
   נשק: רק מאותו צד (מקרוב או מרחוק) כמו מה שביד, כדי שלוחם לא יקבל פתאום קשת ---- */
function gBestPlan(){
  const out=[],bag=Object.assign({},SAVE.bag),worn={weapon:[SAVE.gear.weapon],shield:[...SAVE.gear.shield||[]],head:[...SAVE.gear.head||[]],body:[...SAVE.gear.body||[]],acc:[...SAVE.gear.acc],boots:[...SAVE.gear.boots]};
  for(const slot of ['weapon','shield','head','body','boots','acc']){const n=gOpen(slot),cur=worn[slot],use=slot==='weapon'&&gItem(cur[0])&&gItem(cur[0]).w?wUse(cur[0]):null;
    for(;;){const ks=Object.keys(bag).filter(k=>bag[k]>0&&gItem(k)&&gItem(k).slot===slot&&(!use||wUse(k)===use)&&irCanWear(k));if(!ks.length)break;
      const k=ks.reduce((a,b)=>gScore(b)>gScore(a)?b:a);let i=-1;
      for(let j=0;j<n;j++){if(!gItem(cur[j])){i=j;break}if(i<0||gScore(cur[j])<gScore(cur[i]))i=j}
      if(i<0||gItem(cur[i])&&gScore(k)<=gScore(cur[i])+0.05)break;
      bag[k]--;if(gItem(cur[i]))bag[cur[i]]=(bag[cur[i]]||0)+1;cur[i]=k;out.push({id:k,slot,i})}}
  return out;
}
function gDoBest(){
  const plan=gBestPlan();if(!plan.length)return 0;
  const before=gearStats(),worn=gearWorn();for(const p of plan)gearEquip(p.id,p.slot,p.i);
  gearLive(before);dollWantCheer=true;const p=plan[plan.length-1];GUI.sel={slot:p.slot,i:p.i};GUI.pop=p;
  if(!setCheck(worn))celebrate(P.x,P.y-20,'gear',gIcon(p.id));
  return plan.length;
}
/* ---- מכירה (ניר 2.11: "לא ברור איך משתמשים, נראה לי מכרתי משהו שלא התכוונתי, ואין לי אפשרות למכור הכל").
   🪙 למכור נכנס למצב בחירה: נגיעה בפריט בתרמיל מסמנת אותו (✓) ולא מוכרת. כפתור אחד מוכר את הנבחרים, עם אישור רק כשיש ביניהם פריט יקר.
   "בחר חלשים": כל מה שחלש ממה שלבוש (▼) והעותקים הכפולים, בלי יקרים ובלי נעולים. מסט נשאר עותק אחד, בשביל הבונוס.
   לעולם לא נמכר: מה שלבוש (הוא לא בתרמיל) ופריט נעול (🔒, SAVE.glock). "החזר" קונה בחזרה את המכירה האחרונה, עד שסוגרים את החלון ---- */
const gLocks=()=>SAVE.glock||(SAVE.glock={});
const gLocked=k=>!!gLocks()[k];
function gLockToggle(k){const l=gLocks();if(l[k])delete l[k];else l[k]=1;if(GUI.pick)delete GUI.pick[k];saveNow()}
const gPrice=k=>{const it=gItem(k);return it&&GEAR.sell[it.tier]!=null?Math.round(GEAR.sell[it.tier]*(1+GEAR.sellPlus*gPlus(k))):0};
const gPrecious=k=>gRar(k)>=GEAR.sellRare||!!gPlus(k)||!!gPow(k);   // נדיר ומעלה, משודרג או עם כוח
const gCanSell=k=>!!gItem(k)&&SAVE.bag[k]>0&&!gLocked(k)&&gPrice(k)>0;
// החלשים: ▼ (כל העותקים), וכפולים של כל השאר (חוץ מאחד). בלי יקרים ובלי נעולים
function gSellList(){
  const o={};
  for(const k in SAVE.bag){if(!gCanSell(k)||gPrecious(k))continue;const it=gItem(k),n=SAVE.bag[k];
    const m=gMark(k)===-1&&!it.set?n:n-1;if(m>0)o[k]=m}
  return o;
}
const gSellPick=()=>{const o={},p=GUI.pick||{};for(const k in p){const n=Math.min(p[k],gCanSell(k)?SAVE.bag[k]:0);if(n>0)o[k]=n}return o};
const gSellCoins=l=>Object.keys(l).reduce((t,k)=>t+gPrice(k)*l[k],0);
const gSellN=l=>Object.keys(l).reduce((t,k)=>t+l[k],0);
function gPickToggle(k){const p=GUI.pick||(GUI.pick={});if(!gCanSell(k))return false;if(p[k])delete p[k];else p[k]=SAVE.bag[k];return true}
function gDoSell(l=gSellPick()){
  const c=gSellCoins(l);if(!c)return 0;const got={};
  for(const k in l)if(bagTake(k,l[k]))got[k]=l[k];
  const cc=gSellCoins(got);bagAdd('coins',cc);GUI.undo={items:got,coins:cc};GUI.pick={};saveNow();sfx('coin');banner(T('gear.sold',cc),C.gold);
  return cc;
}
// החזר: מחזיר את מה שנמכר אחרון תמורת אותו מחיר
function gUndoSell(){
  const u=GUI.undo;if(!u||!bagHas('coins',u.coins))return false;
  bagTake('coins',u.coins);for(const k in u.items)bagAdd(k,u.items[k]);GUI.undo=null;saveNow();sfx('tap');banner(T('gear.unsold'),C.gold);return true;
}

function gSlotHtml(s){
  const n=s==='weapon'?1:s==='orbit'?GEAR.slots.orbit.length:GEAR.slots[s],sel=GUI.sel;let h='';
  for(let i=0;i<n;i++){
    if(i>=gOpen(s)){h+='<button class="gtile locked" disabled aria-label="'+T('gear.locked',GEAR.slots.orbit[i])+'">🔒<small>'+GEAR.slots.orbit[i]+'</small></button>';continue}
    const id=gGet(s,i);
    h+=gTile(id,'data-slot="'+s+'" data-i="'+i+'"'+(gItem(id)?'':' aria-label="'+T('gear.slot.'+s)+'"')+(sel&&sel.slot===s&&sel.i===i?' aria-pressed="true"':''),gItem(id)?'':'<i class="gsil" aria-hidden="true">'+GEARUI.empty[s]+'</i>');   // ריקה: צללית (gearui.js)
  }
  return '<div class="gslot '+s+'"><div class="grow">'+h+'</div></div>';
}
function gearDraw(){
  const D=GEAR.doll,hero=HEROES.list[heroId()]||{},sel=GUI.sel;
  $('gHero').textContent=T('gear.hero',heroLv())+(rankId()?' · '+rankLabel():'');   // הדרגה (ranks.js)
  $('gCoins').innerHTML=resChip('coins',SAVE.bag.coins||0);
  // הבובה: הדמות באמצע, והמשבצות בשני הצדדים ומתחתיה
  const side=k=>'<div class="gd-'+k+'">'+D[k].map(gSlotHtml).join('')+'</div>';
  $('gSlots').innerHTML='<div class="gsets">'+gSetBadge()+'</div>'+side('start')+'<div class="gfig" style="--hero:'+(hero.col||'#ECE7DC')+'"><span>🧍</span>'+(hero.icon?'<b>'+hero.icon+'</b>':'')+'</div>'+side('end')+side('under');   // תג הסט בשורה משלו מעל הדמות, לא עליה
  dollShow();   // הדמות בתלת-ממד במקום האימוג'י, עם מה שלבוש (doll3d.js)
  // התרמיל: לשוניות ורשת
  const tabs=gTabs();if(!tabs.includes(GUI.tab))GUI.tab='items';
  $('gTabs').innerHTML=tabs.map(f=>'<button data-tab="'+f+'"'+(GEAR.filter[f]?' class="gf" aria-label="'+T('gear.slot.'+f)+'"':f!=='items'?' class="gf" aria-label="'+T('fam.'+f)+'" title="'+T('fam.'+f)+'"':'')+(GUI.tab===f?' aria-pressed="true"':'')+'>'+gTabLabel(f)+'</button>').join('');
  if(GUI.sell&&!gIsItemTab(GUI.tab))GUI.tab='items';   // במצב מכירה: רק פריטים
  const ks=gBagKeys(GUI.tab),itm=gIsItemTab(GUI.tab),pk=GUI.pick||{};
  const tA=k=>GUI.sell?(gCanSell(k)?' aria-pressed="'+!!pk[k]+'" class="gpick"':' disabled'):(sel&&sel.id===k?' aria-pressed="true"':'');   // מכירה: נגיעה מסמנת. נעול: לא לחיץ
  $('gItems').classList.toggle('gselling',!!GUI.sell);
  $('gItems').innerHTML=ks.length?ks.map(k=>(itm?gBagTile:gCell)(k,SAVE.bag[k],'data-id="'+k+'"'+tA(k))).join('')
    :'<p class="dim">'+T(itm?'gear.noItems':'gear.noRes')+'</p>';
  // ללבוש הכי טוב ולמכור: מתחת לרשת, רק בפריטים. אחרי מכירה: ↩ החזר. במצב מכירה הכפתורים בטור הפרטים
  const best=gBestPlan().length,sc=Object.keys(SAVE.bag).some(gCanSell);
  $('gActs').hidden=!itm||!!GUI.sell;
  $('gActs').innerHTML='<button class="vbtn" data-act="best" title="'+T('gear.bestT')+'"'+(best?'':' disabled')+'>'+T('gear.best')+'</button><button class="vbtn ghost" data-act="sell" title="'+T('gear.sellT')+'"'+(sc?'':' disabled')+'>'+T('gear.sellWeak')+'</button>'+
    (GUI.undo?'<button class="vbtn ghost gundo" data-act="undo" title="'+T('gear.undoT',GUI.undo.coins)+'" aria-label="'+T('gear.undoT',GUI.undo.coins)+'">'+T('gear.undo')+'</button>':'');
  // המחסן: רק כשעומדים לידו
  const st=gStashOn(),sk=Object.keys(SAVE.stash).filter(k=>SAVE.stash[k]>0&&stashIcon(k));
  $('gStash').hidden=!st;
  if(st)$('gStash').innerHTML='<span class="k">'+T('gear.stash',stashUsed(),stashCap())+'</span><div class="ggrid">'+
    (sk.length?sk.map(k=>gCell(k,SAVE.stash[k],'data-sid="'+k+'"'+(sel&&sel.sid===k?' aria-pressed="true"':''))).join(''):'<p class="dim">'+T('stash.empty')+'</p>')+'</div>';
  $('gDetail').innerHTML=gDetailHtml();$('gDetail').classList.toggle('selling',!!GUI.sell);$('gDetail').classList.toggle('gstatp',!$('gDetail').querySelector('.gdhead,.gsell,.icard'));$('gDetail').classList.toggle('gcard',!!$('gDetail').querySelector('.icard'));   // gstatp: טור הסטטים (gearui.js)
  gTipSync();   // פריט נבחר: הפרטים בבועה ליד הפריט, והסטטים נשארים בטור (gearui.js, itemtip.js)
  // הדפים: ציוד, או דמות (הנקודות, stats.js). עץ הסקילים נפתח מדף הדמות ומחליף אותו
  const ch=GUI.page==='char',tv=ch&&GUI.view==='tree',pts=stFree()+trFree();
  $('gPages').innerHTML=['gear','char'].map(pg=>'<button data-page="'+pg+'"'+(GUI.page===pg?' aria-pressed="true"':'')+'>'+T('gear.pg.'+pg)+(pg==='char'&&pts?'<i class="gdot">'+pts+'</i>':'')+'</button>').join('');
  $('ovGear').querySelector('.gbody').hidden=ch;$('gChar').hidden=!ch||tv;$('gTree').hidden=!tv;
  const tcol=$('gTree').querySelector('.trcols'),tsc=tcol?tcol.scrollTop:0;   // הציור מחדש לא קופץ לראש העץ
  if(ch&&!tv)$('gChar').innerHTML=statsHtml();if(tv){$('gTree').innerHTML=treeHtml();const c=$('gTree').querySelector('.trcols');if(c)c.scrollTop=tsc}   // עץ הסקילים (stats.js)
  $('ovGear').classList.toggle('stv',ch);
}
// הפרטים: שם בצבע הנדירות, נדירות וחומר, רמת Aging, סטטים, השוואה למה שלבוש, וכפתורים
function gDetailHtml(){
  if(GUI.sell){const l=gSellPick(),ks=Object.keys(l),n=gSellN(l),c=gSellCoins(l),rare=ks.filter(gPrecious);   // מצב מכירה: מה נבחר, כמה מקבלים, וכפתור אחד
    if(GUI.ask&&rare.length)return '<h3>'+T('gear.sellRare')+'</h3><div class="gsell">'+rare.map(k=>gCell(k,l[k],'data-sk="'+k+'" aria-pressed="true"')).join('')+'</div>'+
      '<div class="gbtns"><button class="vbtn" data-act="sellSure">'+T('gear.sellGo',n,c)+'</button></div><div class="gbtns"><button class="vbtn ghost" data-act="sellBack">'+T('gear.back')+'</button></div>';
    GUI.ask=false;
    return '<h3>'+T('gear.sellHead')+'</h3><p class="dim gsellhint">'+T('gear.sellPick')+'</p><div class="gsell">'+
      (ks.length?ks.map(k=>gCell(k,l[k],'data-sk="'+k+'" aria-pressed="true"')).join(''):'<p class="dim">'+T('gear.sellNone')+'</p>')+'</div>'+
      '<div class="gbtns"><button class="vbtn" data-act="sellYes"'+(n?'':' disabled')+'>'+T('gear.sellGo',n,c)+'</button></div>'+
      '<div class="gbtns"><button class="vbtn ghost" data-act="sellWeak"'+(gSellN(gSellList())?'':' disabled')+'>'+T('gear.sellAllWeak')+'</button><button class="vbtn ghost" data-act="sellNo">'+T('gear.sellNo')+'</button></div>'}
  const sel=GUI.sel,k=sel&&(sel.id||sel.sid||gGet(sel.slot,sel.i)),n=!sel?0:sel.id?SAVE.bag[k]:sel.sid?SAVE.stash[k]:1;
  if(!k||!n)return gStatPanel();   // בלי פריט: הסטטים של הגיבור והעמידויות (gearui.js)
  const it=gItem(k),col=gRarCol(k);
  if(it)return gCardHtml(k,sel,n);   // חפץ: הכרטיס הגדול (gearui.js). משאב: התצוגה למטה
  let d='<div class="gdhead'+gRarCls(k)+'" style="--rar:'+col+'"><button class="gdx" data-act="desel" aria-label="'+T('gear.close')+'">✕</button><span class="gdicon'+gRarCls(k)+'">'+(it?gPic(k):resPic(k))+'</span><div><h3 style="color:'+col+'">'+(it?gName(k):resName(k))+'</h3>'+
    '<small>'+(it?'<b class="rbadge">'+T('tier')[gRar(k)]+'</b> ':T('tier')[gRar(k)]+' · ')+(it?(it.tier<4?T('vil.tiers')[it.tier]+' · ':'')+T('gear.slot.'+it.slot):T('fam.'+resOf(k).fam))+(n>1?' · <bdi>×'+n+'</bdi>':'')+'</small></div></div>';
  if(it)d+=gFlavHtml(k);   // משפט האופי, באיטליק מתחת לשם
  if(it&&gPlus(k))d+='<p class="gage">'+T('gear.aged',gPlus(k))+'</p>';
  const orbOld=it&&sel.id&&it.slot==='orbit'?gItem(gGet('orbit',gTarget(it))):null;
  if(it)d+=gStatsHtml(k,!!sel.id&&it.slot==='orbit'&&(!orbOld||orbOld.type!==it.type))+powLine(k)+setHtml(k);   // הכוח בזהב (powers.js)   // סט: מה הוא נותן וכמה חלקים לבושים (sets.js)
  else{const w=resWhere(k),cut=a=>a.slice(0,RES.tip.max).join(', ')+(a.length>RES.tip.max?'…':'');   // משאב: מאיפה ובשביל מה (resources.js)
    if(w.src.length)d+='<p class="dim">'+T('tip.from',cut(w.src))+'</p>';if(w.use.length)d+='<p class="dim">'+T('tip.for',cut(w.use))+'</p>'}
  const btn=(act,txt,ghost)=>'<button class="vbtn'+(ghost?' ghost':'')+'" data-act="'+act+'">'+txt+'</button>';
  let b='';
  if(sel.id&&it){const old=gGet(it.slot,gTarget(it));
    d+=(old?'<p class="dim">'+T('gear.vs',gIcon(old)+' '+gName(old))+'</p>':'')+gCompare(k,old);b+=irCanWear(k)?btn('equip',T('gear.equip')):'<button class="vbtn" disabled>'+T('ir.cant')+'</button>'}
  if(it&&(sel.id||sel.slot))b+='<button class="vbtn ghost glock" data-act="lock" aria-pressed="'+gLocked(k)+'" aria-label="'+T(gLocked(k)?'gear.unlock':'gear.lock')+'" title="'+T(gLocked(k)?'gear.unlock':'gear.lock')+'">'+(gLocked(k)?'🔒':'🔓')+'</button>';   // נעול: לא נמכר
  if(sel.slot)b+=btn('unequip',T('gear.unequip'),1);
  if(sel.id&&gStashOn())b+=btn('store',T('gear.store'),1);
  if(sel.sid)b+=btn('take',T('gear.take'));
  return '<div class="gdbody">'+d+'</div>'+(b?'<div class="gbtns">'+b+'</div>':'');
}

/* ---- פעולות: הגרירה והכפתורים עוברים שניהם דרך כאן ---- */
// לובשים, ואם זה שיפור: חגיגה על הדמות (עם הצליל שלה) והמשבצת קופצת
function gDoEquip(id,slot,i){
  const before=gearStats(),worn=gearWorn(),r=gearEquip(id,slot,i);if(!r)return null;
  gSeen()[id]=1;   // לבשו אותו: כבר לא חדש
  gearLive(before,id);GUI.sel={slot:r.slot,i:r.i};
  dollWantCheer=true;   // הדמות בחלון מריעה (doll3d.js)
  if(setCheck(worn))GUI.pop=r;   // מדרגה חדשה של סט (sets.js)
  else if(r.better){celebrate(P.x,P.y-20,'gear',gIcon(gGet(r.slot,r.i)));GUI.pop=r}else sfx('tap');
  return r;
}
function gDoUnequip(slot,i){const before=gearStats();if(!gearUnequip(slot,i))return false;gearLive(before);GUI.sel=null;sfx('tap');return true}
function gDoSwap(slot,a,b){if(!gearSwap(slot,a,b))return false;GUI.sel={slot,i:b};sfx('tap');return true}
function gDoStash(dir,k){const n=stashMove(dir,k);if(!n)return 0;GUI.sel=dir==='in'?(SAVE.stash[k]?{sid:k}:null):(SAVE.bag[k]?{id:k}:null);sfx('tap');return n}
function gRedraw(){
  gearDraw();
  if(GUI.pop){const t=document.querySelector('#gSlots [data-slot="'+GUI.pop.slot+'"][data-i="'+GUI.pop.i+'"]');if(t)t.classList.add('pop');GUI.pop=null}
}

/* ---- גרירה, באצבע ובעכבר (pointer events): מה נגרר (gSrcOf), לאן נופלים ואם מותר (gDropAt), ומה קורה (gDrop) ---- */
const GDRAG={src:null};
function gSrcOf(el){
  const b=el&&el.closest&&el.closest('#ovGear .gtile');if(!b||b.disabled)return null;
  if(b.dataset.id)return{id:b.dataset.id,el:b};
  if(b.dataset.sid)return{sid:b.dataset.sid,el:b};
  if(b.dataset.slot&&gGet(b.dataset.slot,+b.dataset.i))return{slot:b.dataset.slot,i:+b.dataset.i,el:b};
  return null;
}
// משבצת: רק פריט מהסוג שלה. התרמיל: ממשבצת או מהמחסן. המחסן: מהתרמיל, כשיש מקום
function gDropAt(src,el){
  const c=s=>el&&el.closest&&el.closest(s),s=c('#gSlots [data-slot]');
  if(s){const slot=s.dataset.slot,i=+s.dataset.i,it=gItem(src.id||(src.slot&&gGet(src.slot,src.i)));
    return{kind:'slot',slot,i,el:s,ok:!!it&&it.slot===slot&&!src.sid&&!(src.slot&&src.i===i)}}
  const bag=c('#gBag');if(bag)return{kind:'bag',el:bag,ok:!src.id};
  const st=c('#gStash');if(st&&!st.hidden)return{kind:'stash',el:st,ok:!!src.id&&stashUsed()<stashCap()};
  return null;
}
function gDrop(src,t){
  if(t.kind==='slot')return src.id?gDoEquip(src.id,t.slot,t.i):gDoSwap(t.slot,src.i,t.i);
  if(t.kind==='bag')return src.slot?gDoUnequip(src.slot,src.i):gDoStash('out',src.sid);
  return gDoStash('in',src.id);
}
// לא מותר: המקום רועד קצת, ושום דבר לא זז
function gShake(el){el.classList.remove('shake');void el.offsetWidth;el.classList.add('shake');setTimeout(()=>el.classList.remove('shake'),400)}
// בזמן גרירה: כל משבצת שמותר להניח בה מוארת, ואלה שלא מתעמעמות
function gMarkTargets(src){
  document.querySelectorAll('#gSlots [data-slot]').forEach(s=>s.classList.add(gDropAt(src,s).ok?'ok':'no'));
  for(const id of ['gBag','gStash']){const z=$(id);if(!z.hidden&&gDropAt(src,z).ok)z.classList.add('ok')}
}
function gDragEnd(){
  if(GDRAG.ghost)GDRAG.ghost.remove();
  document.querySelectorAll('#ovGear .ok,#ovGear .no,#ovGear .over,#ovGear .lift').forEach(e=>e.classList.remove('ok','no','over','lift'));
  GDRAG.src=GDRAG.ghost=null;GDRAG.on=false;
}
$('ovGear').addEventListener('pointerdown',e=>{
  if(e.button>0)return;const src=gSrcOf(e.target);if(!src)return;
  Object.assign(GDRAG,{src,pid:e.pointerId,x:e.clientX,y:e.clientY,on:false,t:performance.now(),touch:e.pointerType==='touch'&&!!e.target.closest('.ggrid')});
});
// אצבע שהחזיקה מספיק בתרמיל: מכאן זו גרירה, והרשימה לא נגללת מתחתיה
addEventListener('touchmove',e=>{if(GDRAG.src&&GDRAG.touch&&(GDRAG.on||performance.now()-GDRAG.t>=GEAR.hold))e.preventDefault()},{passive:false});
addEventListener('pointermove',e=>{
  const src=GDRAG.src;if(!src||e.pointerId!==GDRAG.pid)return;
  if(!GDRAG.on){
    if(Math.hypot(e.clientX-GDRAG.x,e.clientY-GDRAG.y)<GEAR.drag)return;
    if(GDRAG.touch&&performance.now()-GDRAG.t<GEAR.hold){GDRAG.src=null;return}   // זז מהר: גלילה, לא גרירה
    GDRAG.on=true;const g=GDRAG.ghost=src.el.cloneNode(true);g.classList.add('gghost');g.removeAttribute('aria-pressed');
    $('ovGear').appendChild(g);src.el.classList.add('lift');gMarkTargets(src);
  }
  e.preventDefault();
  GDRAG.ghost.style.transform='translate('+e.clientX+'px,'+e.clientY+'px) translate(-50%,-50%)';
  const t=gDropAt(src,document.elementFromPoint(e.clientX,e.clientY));
  document.querySelectorAll('#ovGear .over').forEach(x=>x.classList.remove('over'));
  if(t&&t.ok)t.el.classList.add('over');
},{passive:false});
addEventListener('pointerup',e=>{
  const src=GDRAG.src;if(!src||e.pointerId!==GDRAG.pid)return;
  if(!GDRAG.on){GDRAG.src=null;return}   // לא זז: זו לחיצה, וה-click מטפל בה
  const t=gDropAt(src,document.elementFromPoint(e.clientX,e.clientY));
  gDragEnd();
  if(!t)return;   // שוחרר באמצע שום מקום: הפריט חוזר למקומו
  if(!t.ok||!gDrop(src,t)){gShake(t.el);return}
  gRedraw();
});
addEventListener('pointercancel',e=>{if(GDRAG.src&&e.pointerId===GDRAG.pid)gDragEnd()});

$('ovGear').addEventListener('click',e=>{
  if(e.target.closest('.gfig')){GUI.sel=null;GUI.page='char';GUI.view=null;gRedraw();return}   // נגיעה בדמות: הדף שלה (נקודות)
  const tn=e.target.closest('.trn');   // עץ הסקילים: נגיעה בסקיל פותחת את התיאור המלא שלו (ניר 2.11: "לא רואים מה הסקילים עושים")
  if(tn&&!e.target.closest('button')){GUI.trOpen=GUI.trOpen===tn.dataset.tr?null:tn.dataset.tr;sfx('tap');gRedraw();return}
  const b=e.target.closest('button');
  if(!b){if(GUI.sel&&!e.target.closest('#gDetail')){GUI.sel=null;gRedraw()}return}   // נגיעה מחוץ לבועה: נסגרת
  if(b.disabled)return;
  if(b.id==='gearClose'){gearClose();return}
  if(b.dataset.act==='stat'){statAdd(b.dataset.k);statBadge();gRedraw();return}
  if(b.dataset.act==='build'){statBuild(+b.dataset.i);statBadge();gRedraw();return}   // שתי בניות שמורות (stats.js)
  if(b.dataset.page){GUI.page=b.dataset.page;GUI.view=null;GUI.sel=null;GUI.sell=false;gRedraw();return}
  if(b.dataset.act==='tree'||b.dataset.act==='back'){GUI.view=b.dataset.act==='tree'?'tree':null;GUI.sel=null;gRedraw();return}
  if(b.dataset.act==='learn'){treeLearn(b.dataset.b,b.dataset.id);statBadge();gRedraw();return}
  // מצב מכירה: נגיעה בפריט (בתרמיל או ברשימת הנבחרים) מסמנת או מבטלת, ולא מוכרת
  if(GUI.sell&&(b.dataset.sk||b.dataset.id)){gPickToggle(b.dataset.sk||b.dataset.id);GUI.ask=false;sfx('tap');gRedraw();return}
  const a=b.dataset.act,sel=GUI.sel;
  if(GUI.sell&&!b.dataset.tab&&!/^sell/.test(a||''))GUI.sell=false;   // לשונית לא יוצאת ממצב מכירה
  if(b.dataset.tab){GUI.tab=b.dataset.tab;GUI.sel=null}
  else if(a==='best'){if(!gDoBest())sfx('tap')}
  else if(a==='sell'){GUI.sell=true;GUI.pick={};GUI.ask=false;GUI.sel=null}
  else if(a==='sellWeak'){GUI.pick=Object.assign({},GUI.pick,gSellList());sfx('tap')}   // בחר חלשים: מוסיף לבחירה, ואפשר להוריד לפני המכירה
  else if(a==='sellYes'){const l=gSellPick();if(Object.keys(l).some(gPrecious))GUI.ask=true;else{gDoSell(l);GUI.sell=false}}   // יש יקר: אישור קצר קודם
  else if(a==='sellSure'){gDoSell(gSellPick());GUI.sell=false;GUI.ask=false}
  else if(a==='sellBack')GUI.ask=false;
  else if(a==='sellNo'){GUI.sell=false;GUI.pick={};GUI.ask=false}
  else if(a==='undo'){if(!gUndoSell()){sfx('tap');return}}
  else if(a==='lock'){const k=sel&&(sel.id||gGet(sel.slot,sel.i));if(k){gLockToggle(k);sfx('tap')}}
  else if(a==='desel')GUI.sel=null;   // ✕ בפרטים: חוזרים לסטטים
  else if(b.dataset.id){GUI.sel=gTipAgain(b)?null:{id:b.dataset.id};if(gIsNew(b.dataset.id)){gSeen()[b.dataset.id]=1;saveNow()}}   // נגיעה שנייה באותו פריט: הבועה נסגרת
  else if(b.dataset.sid)GUI.sel=gTipAgain(b)?null:{sid:b.dataset.sid};
  else if(b.dataset.slot)GUI.sel=gGet(b.dataset.slot,+b.dataset.i)&&!gTipAgain(b)?{slot:b.dataset.slot,i:+b.dataset.i}:null;
  else if(a==='equip')gDoEquip(sel.id);
  else if(a==='unequip')gDoUnequip(sel.slot,sel.i);
  else if(a==='store'){if(!gDoStash('in',sel.id)){gShake($('gStash'));return}}
  else if(a==='take')gDoStash('out',sel.sid);
  else if(a==='gup'){if(gUpgrade(sel))return;sfx('tap')}   // לשדרג: עוברים לנפחייה (gearui.js)
  gRedraw();
});
$('gearBtnRun').addEventListener('click',gearOpen);
// Esc ולחיצה על הרקע סוגרים: ui.js
