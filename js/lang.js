/* שפות: כל טקסט שהשחקן רואה נמצא כאן, בעברית ובאנגלית. המשחק יהיה באנגלית, ובינתיים עברית כברירת מחדל.
   טקסט חדש = מפתח חדש ב-TEXT עם he ו-en. בקוד: T('מפתח'), ולטקסט עם ערכים: T('מפתח',ערך).
   ערך יכול להיות מחרוזת, מערך, או פונקציה שמקבלת את הערכים.
   ב-index.html: data-t="מפתח" ממלא את התוכן (מערך הופך לרשימת <li>), ו-data-ta="מפתח" את ה-aria-label */
const LANGS={he:{dir:'rtl'},en:{dir:'ltr'}};
let LANG='he';try{const s=localStorage.getItem('zm-lang');if(LANGS[s])LANG=s}catch(e){}
let DIR=LANGS[LANG].dir;   // כיוון הטקסט, גם לציור על הקנבס

const TEXT={
  // מסך פתיחה
  title:{he:'זירת המקל',en:'Stick Arena'},
  tagline:{he:'דמו ראשון · כל בוס נבנה מחדש לפי איך ששיחקת',en:'First demo · every boss is rebuilt around how you played'},
  rules:{
    he:['מתחילים ב<span class="g">כפר</span>: בונים ומשדרגים מבנים, אוספים עץ ואבן, ויוצאים לזירה דרך השער. בסוף ריצה חוזרים הביתה עם השלל, גם אם נפלת.',
      'גוררים אצבע בכל מקום על המסך כדי לזוז. התקיפה אוטומטית.',
      'הכפתור העגול למטה מחליף בין <span class="e">חרב</span> ל<span class="t">קשת</span>.',
      'צבע האויב הוא הנשק שפוגע בו: <span class="e">כתום</span> נופל מחרב, <span class="t">תכלת</span> נופל מחצים. כשהכפתור פועם, הגיע הזמן להחליף.',
      'ריצה של כמה דקות: גושים של אויבים, <b>גלים ענקיים</b> ו<b>אויבי-על</b> בתחנות שעל הפס למעלה, וב-<span class="l">6:00</span> מגיע בוס. הוא צפה בך כל הזמן הזה ובנה את עצמו נגדך. ואל תברחו ממנו, זה רק מעצבן אותו.',
      'חדש: <span class="g">דלת זהב</span> נפתחת לכמה שניות ומובילה לחדר מטבעות, ובתוך <span class="r">אזורים אדומים</span> מחכים פצצה או באף. הם שורפים, אז נכנסים, לוקחים ויוצאים.',
      'אחרי שמועה מופיע <span class="g">המבוקש</span>, עם שק שלל על הגב. רודפים אחריו ומפילים אותו לפני שהוא בורח. בשק יכול להיות זבל, ויכול להיות אוצר.'],
    en:['You start in your <span class="g">village</span>: build and upgrade, collect wood and stone, and head to the arena through the gate. At the end of a run you come home with the loot, even if you fell.',
      'Drag a finger anywhere on the screen to move. Attacks are automatic.',
      'The round button at the bottom switches between the <span class="e">sword</span> and the <span class="t">bow</span>.',
      'An enemy’s color tells you what hurts it: <span class="e">orange</span> falls to the sword, <span class="t">cyan</span> falls to arrows. When the button pulses, it’s time to switch.',
      'A run lasts a few minutes: packs of enemies, <b>huge waves</b> and <b>elites</b> at the stations on the bar up top, and at <span class="l">6:00</span> a boss arrives. It has been watching you all along and built itself to counter you. And don’t run from it, that only makes it angrier.',
      'New: a <span class="g">golden door</span> opens for a few seconds and leads to a coin room, and inside <span class="r">red zones</span> a bomb or a power-up is waiting. The zones burn, so get in, grab it and get out.',
      'After a rumor, <span class="g">the Wanted</span> shows up with a loot sack on his back. Chase him down before he escapes. The sack might hold junk, or real treasure.']},
  start:{he:'יאללה',en:'Let’s go'},
  best:{he:t=>'השיא שלך: '+t,en:t=>'Your best: '+t},
  langGroup:{he:'שפה',en:'Language'},
  gfxGroup:{he:'גרפיקה',en:'Graphics'},
  gfx3d:{he:'תלת-ממד',en:'3D'},
  gfx2d:{he:'דו-ממד',en:'2D'},
  arena:{he:'זירת המשחק',en:'Game arena'},
  swapWeapon:{he:'החלף נשק',en:'Switch weapon'},

  // ממשק בזמן משחק
  level:{he:n=>'רמה '+n,en:n=>'Level '+n},
  bossIn:{he:t=>'בוס בעוד '+t,en:t=>'Boss in '+t},
  bossHere:{he:'בוס בזירה',en:'Boss in the arena'},
  'next.swarm':{he:t=>'גל ענק בעוד '+t,en:t=>'Huge wave in '+t},
  'next.elite':{he:t=>'אויב-על בעוד '+t,en:t=>'Elite in '+t},
  bossBeaten:{he:'הבוס הובס',en:'Boss defeated'},
  // תחנות בדרך לבוס
  'st.swarm':{he:'גל ענק!',en:'Huge wave!'},
  'st.elite':{he:n=>'אויב-על: '+n,en:n=>'Elite: '+n},
  'elite.shield':{he:'אביר השלדים',en:'Skeleton Knight'},
  'elite.wisp':{he:'מכשף הצללים',en:'Shadow Mage'},
  eliteDown:{he:'אויב-העל נפל',en:'Elite down'},
  'w.sword':{he:'חרב',en:'Sword'},
  'w.gun':{he:'קשת',en:'Bow'},
  'w.any':{he:'כללי',en:'General'},
  'weak.sword':{he:'חלש לחרב',en:'Weak to sword'},
  'weak.gun':{he:'חלש לקשת',en:'Weak to bow'},
  immune:{he:'חסין',en:'Immune'},

  // עליית רמה ושדרוגים: [שם, תיאור]
  pickUpgrade:{he:'בחר שדרוג אחד',en:'Pick one upgrade'},
  'up.sdmg':{he:['להב כבד','נזק חרב +35%'],en:['Heavy Blade','Sword damage +35%']},
  'up.srng':{he:['הנפה רחבה','טווח חרב +20%'],en:['Wide Swing','Sword reach +20%']},
  'up.sspd':{he:['יד מהירה','מהירות הנפה +22%'],en:['Quick Hand','Swing speed +22%']},
  'up.gdmg':{he:['חוד מחודד','נזק חצים +35%'],en:['Sharp Tips','Arrow damage +35%']},
  'up.grate':{he:['מיתר מהיר','קצב ירי +25%'],en:['Fast String','Fire rate +25%']},
  'up.gmulti':{he:['חץ כפול','חץ נוסף בכל ירייה'],en:['Double Arrow','One more arrow per shot']},
  'up.gpierce':{he:['חודר שריון','כל חץ עובר דרך אויב נוסף'],en:['Armor Piercer','Each arrow passes through one more enemy']},
  'up.hp':{he:['לב אבן','חיים מקסימליים +25 וריפוי מלא'],en:['Stone Heart','Max HP +25 and a full heal']},
  'up.spd':{he:['רגליים קלות','מהירות תנועה +12%'],en:['Light Feet','Move speed +12%']},
  'up.mag':{he:['מגנט','טווח איסוף XP +60%'],en:['Magnet','XP pickup range +60%']},
  'up.swap':{he:['החלפה זריזה','אחרי כל החלפת נשק: נזק כפול לשנייה וחצי'],en:['Quick Swap','After each weapon switch: double damage for 1.5 seconds']},
  'up.regen':{he:['נשימה עמוקה','מרפא 1.5 חיים בשנייה'],en:['Deep Breath','Heals 1.5 HP per second']},

  // הבוס
  bossComing:{he:'בוס מתקרב',en:'Boss incoming'},
  bossLearned:{he:'מה הוא למד עליך',en:'What it learned about you'},
  bossPats:{he:'ההתקפות שהוא בחר',en:'The attacks it chose'},
  fight:{he:'להילחם',en:'Fight'},
  syl1:{he:['גרו','זאר','מור','קאל','בל','נוקס','אוב','דרא','שק','טור'],en:['Gro','Zar','Mor','Kal','Bel','Nox','Ob','Dra','Shak','Tor']},
  syl2:{he:['גוט','רון','מאק','זיל','דור','קס','ות','גאל','בר'],en:['gut','ron','mak','zil','dor','kas','oth','gal','bar']},
  'bossTitle.sword':{he:'שובר הלהבים',en:'Blade Breaker'},
  'bossTitle.gun':{he:'בולע החצים',en:'Arrow Eater'},
  'learn.sword':{he:'נלחמת בעיקר עם החרב, אז השריון שלו מקהה להבים.',en:'You fought mostly with the sword, so its armor dulls blades.'},
  'learn.gun':{he:'ירית בעיקר חצים מרחוק, אז השריון שלו בולע חצים.',en:'You mostly shot arrows from afar, so its armor swallows arrows.'},
  'learn.mobile':{he:'אתה כל הזמן בתנועה, אז הוא ממלא את האוויר בספירלות.',en:'You never stop moving, so it fills the air with spirals.'},
  'learn.still':{he:'אתה נוטה לעמוד במקום, אז הוא שותל מוקשים מתחתיך.',en:'You tend to stand still, so it plants mines under you.'},
  'pat.ring':{he:'טבעת אש',en:'Ring of Fire'},
  'pat.spiral':{he:'ספירלה',en:'Spiral'},
  'pat.aimed':{he:'מטח מכוון',en:'Aimed Volley'},
  'pat.charge':{he:'הסתערות',en:'Charge'},
  'pat.shields':{he:'זימון מגינים',en:'Summon Shields'},
  'pat.wisps':{he:'זימון רוחות',en:'Summon Wisps'},
  'pat.shock':{he:'גל הדף',en:'Shockwave'},
  'pat.mines':{he:'מוקשים',en:'Mines'},
  secretAttack:{he:'+ אחת סודית בשלב 2',en:'+ one secret attack in phase 2'},
  hatesRunning:{he:'שונא שבורחים ממנו',en:'Hates it when you run'},
  weakSpot:{he:(cls,w)=>'נקודת התורפה: <span class="'+cls+'">'+w+'</span>. הזוהר סביבו בצבע הזה.',
    en:(cls,w)=>'Weak spot: <span class="'+cls+'">'+w+'</span>. Its glow is that color.'},
  rage1:{he:n=>n+' מתעצבן: אל תברח',en:n=>n+' is getting angry: stop running'},
  rage2:{he:n=>n+' זועם',en:n=>n+' is furious'},
  phase2:{he:p=>'שלב 2 · '+p,en:p=>'Phase 2 · '+p},
  bossDown:{he:n=>n+' הובס',en:n=>n+' defeated'},

  // הרעיונות של אוראל: דלת זהב, חדר בונוס ופריטים
  doorOpen:{he:'דלת זהב נפתחה',en:'A golden door opened'},
  doorClosed:{he:'הדלת נסגרה',en:'The door closed'},
  roomSaws:{he:'חדר בונוס · זהירות, מסורים',en:'Bonus room · watch out for saws'},
  roomGo:{he:'חדר בונוס · אספו מהר',en:'Bonus room · grab them fast'},
  roomCoins:{he:n=>'מטבעות: '+n,en:n=>'Coins: '+n},
  roomOut:{he:n=>'יצאת עם '+n+' מטבעות',en:n=>'You got out with '+n+' coins'},
  boom:{he:'בום',en:'Boom'},
  powerUp:{he:'כוח: נזק ומהירות',en:'Power: damage and speed'},

  // המבוקש. פריטי הזבל פתוחים לבדיחות פנימיות של שנינו
  'wanted.rumors':{he:['שמועה: המבוקש נראה באזור','מישהו ראה את המבוקש','ריח של שלל באוויר'],
    en:['Rumor: the Wanted was seen nearby','Someone spotted the Wanted','Loot is in the air']},
  'wanted.here':{he:'המבוקש כאן: תפסו אותו',en:'The Wanted is here: catch him'},
  'wanted.gone':{he:'המבוקש ברח',en:'The Wanted got away'},
  'loot.junk':{he:'זבל',en:'Junk'},
  'loot.junkItems':{he:['גרב ישנה','כפית עקומה','עצם של דג','חשבונית מקומטת'],en:['An old sock','A bent spoon','A fish bone','A crumpled receipt']},
  'loot.coins':{he:'שק מטבעות',en:'Bag of coins'},
  'loot.chest':{he:'תיבת שלל',en:'Loot chest'},
  'loot.treasure':{he:'אוצר אמיתי',en:'Real treasure'},

  // סוף ריצה
  fell:{he:'נפלת',en:'You fell'},
  statTime:{he:'שרדת',en:'Survived'},
  statLevel:{he:'רמה',en:'Level'},
  statBosses:{he:'בוסים שהפלת',en:'Bosses defeated'},
  statBest:{he:'השיא שלך',en:'Your best'},
  statCoins:{he:'מטבעות',en:'Coins'},
  statPicks:{he:'פריטים שלקחת',en:'Items taken'},
  nextRun:{he:'בריצה הבאה הבוס יהיה שונה, לפי איך שתשחק.',en:'Next run the boss will be different, based on how you play.'},
  again:{he:'עוד ריצה',en:'Run again'},
  toVillage:{he:'חזרה לכפר',en:'Back to the village'},
  statLoot:{he:'שלל שהגיע הביתה',en:'Loot brought home'},

  // הכפר (js/village.js)
  'vil.home':{he:'הכפר שלך',en:'Your village'},
  'vil.gift':{he:'מתנת פתיחה: מספיק למנסרה ולמכרה',en:'A welcome gift: enough for a sawmill and a mine'},
  'vil.won':{he:'ניצחת',en:'Victory'},
  'vil.noLoot':{he:'בלי שלל הפעם',en:'No loot this time'},
  'vil.center':{he:'מרכז הכפר',en:'Village Center'},
  'vil.forge':{he:'נפחייה',en:'Forge'},
  'vil.mill':{he:'מנסרה',en:'Sawmill'},
  'vil.mine':{he:'מכרה',en:'Mine'},
  'vil.market':{he:'שוק',en:'Market'},
  'vil.gate':{he:'לזירה',en:'To the arena'},
  'vil.notBuilt':{he:'עוד לא נבנה',en:'Not built yet'},
  'vil.build':{he:'לבנות',en:'Build'},
  'vil.up':{he:n=>'לשדרג לרמה '+n,en:n=>'Upgrade to level '+n},
  'vil.max':{he:'רמה מקסימלית',en:'Max level'},
  'vil.needCenter':{he:'קודם משדרגים את מרכז הכפר',en:'Upgrade the Village Center first'},
  'vil.next':{he:s=>'ברמה הבאה: '+s,en:s=>'Next level: '+s},
  'vil.info.center':{he:n=>'מבנים עד רמה '+n,en:n=>'Buildings up to level '+n},
  'vil.info.forge':{he:t=>'ציוד: '+t+' (בקרוב)',en:t=>'Gear: '+t+' (coming soon)'},
  'vil.tiers':{he:['עץ','ברזל','כסף','זהב','אגדי'],en:['wood','iron','silver','gold','legendary']},
  'vil.info.mill':{he:(n,c)=>n+' עץ בשעה · מחסן '+c,en:(n,c)=>n+' wood per hour · holds '+c},
  'vil.info.mine':{he:(s,o,c)=>s+' אבן ו-'+o+' עפרות בשעה · מחסן '+c,en:(s,o,c)=>s+' stone and '+o+' ore per hour · holds '+c},
  'vil.info.market':{he:p=>'מוכרים וקונים משאבים'+(p?' · מחירים +'+p+'%':''),en:p=>'Sell and buy resources'+(p?' · prices +'+p+'%':'')},
  'vil.sell':{he:'מכור',en:'Sell'},
  'vil.buy':{he:'קנה',en:'Buy'},
  bagGroup:{he:'תרמיל',en:'Bag'},
  'res.coins':{he:'מטבעות',en:'Coins'},
  'res.wood':{he:'עץ',en:'Wood'},
  'res.stone':{he:'אבן',en:'Stone'},
  'res.ore':{he:'עפרות',en:'Ore'},
  'res.bone':{he:'עצמות',en:'Bones'}
};

function T(key,...a){const e=TEXT[key],v=e?(e[LANG]??e.he):key;return typeof v==='function'?v(...a):v}
function setLang(l){if(!LANGS[l])return;LANG=l;DIR=LANGS[l].dir;try{localStorage.setItem('zm-lang',l)}catch(e){}}
// ממלא את כל הטקסטים הקבועים בדף לפי השפה הנוכחית, והופך את כיוון המסך
function applyLang(){
  const r=document.documentElement;r.lang=LANG;r.dir=DIR;document.title=T('title');
  for(const el of document.querySelectorAll('[data-t]')){const v=T(el.dataset.t);el.innerHTML=Array.isArray(v)?v.map(s=>'<li>'+s+'</li>').join(''):v}
  for(const el of document.querySelectorAll('[data-ta]'))el.setAttribute('aria-label',T(el.dataset.ta));
  for(const b of document.querySelectorAll('[data-lang]'))b.setAttribute('aria-pressed',String(b.dataset.lang===LANG));
}
