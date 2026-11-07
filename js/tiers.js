/* דרגות עולם (Claude מוביל, 1.11.2026. המחקר: docs/research-skills.md, "משחק אחרי הסוף", כמו World Tiers ב-Diablo).
   אחרי שהסיפור נגמר (SAVE.story.end) העולם הפתוח יכול להיות קשה יותר: אויבים חזקים יותר, ושלל ומטבעות נוספים.
   דרגות אמיתיות (ת11, ניר 5.11.2026: "כרגע אפשר לסיים את התוכן תוך שעה". docs/plan-longevity.md):
     - גם השומרים (story.js), המפלצות הנדירות (rares.js), מבוקש היום (hunt.js) והנמסיס מתחזקים, יותר מאויב רגיל (big).
     - שלל שנופל רק בדרגה גבוהה: שכבת הזהב נפוצה רק מדרגה 2, ואגדיים רק בדרגה 3 (gw, דרך tierGearW ב-lootRoll, loot.js).
       ושומר, נדירה או מבוקש בדרגה 2 ומעלה מפילים גם חפץ בטוח ושלל משלהם (bigLoot).
     - הדרגה הבאה נפתחת כשמנצחים את שומר הצל (הפנס 'light') בדרגה הנוכחית (tierWin מ-giantWin), ולא בספירת הריגות.
   הבחירה בחלון מפת העולם (worldmap.js), והדרגה מוצגת גם בכל כניסה לעולם (tierEnter). לא בזירה, לא בעומק (depths.js, שם יש דרגה משלו).
   נשמר ב-SAVE.tier: {t:הדרגה, w:הדרגה הגבוהה שבה ניצחת את הצל, k:הריגות בדרגה 2 ומעלה}. הטקסטים ב-lang.js תחת 'tier.' */
const TIERS={
  /* לכל דרגה: hp, dmg פי כמה לאויב רגיל. big: פי כמה לשומר, נדירה, מבוקש ונמסיס. loot: סיכוי להגרלת שלל נוספת. coins: מטבעות נוספים בכל הריגה.
     gw: פי כמה האחוז של כל שכבת ציוד (עץ, ברזל, כסף, זהב, אגדי; GEAR.tiers) בציוד שנופל בעולם. 0 = לא נופל בדרגה הזאת.
     bigLoot: מה ששומר, נדירה או מבוקש מפילים בנוסף בדרגה הזאת (בפורמט של runGive). gear: 1 = גם חפץ בטוח (בהגרלה של בוס, LOOT.gear.boss)
     כוונון קצב (5.11, docs/playtime-2026-11-05.md): ה-XP איטי פי 3, אז בדרגות הגבוהות יש יותר "רגעים טובים" לשעה, ולא יותר חיים לאויבים:
     gearK: פי כמה הסיכוי לציוד מאויב (lootGear ב-loot.js). rareAgain: כל כמה שניות באזור עוד הגרלה של מפלצת נדירה (rareUpdate ב-rares.js). 0 = רק בכניסה */
  list:[
    {hp:1,  dmg:1,   big:{hp:1,  dmg:1},   loot:0,   coins:null, col:'#E8E2D0', gw:[1,1,1,0.35,0],      bigLoot:null,                                   gear:0, gearK:1,  rareAgain:0},
    {hp:1.9,dmg:1.45,big:{hp:2.4,dmg:1.5}, loot:0.45,coins:[2,5], col:'#F4C74F', gw:[0.6,1,1,1.3,0],    bigLoot:{coins:[1,80],star:[0.5,1],gem:[0.5,1]}, gear:1, gearK:1.5,rareAgain:150},
    {hp:3.2,dmg:2,   big:{hp:4.5,dmg:2.1}, loot:1,   coins:[5,10],col:'#EF4E57', gw:[0.2,0.6,1,1.6,0.25],bigLoot:{coins:[1,160],star:[1,1],gem:[1,2],mythril:[0.6,1]},gear:1, gearK:2,  rareAgain:90}
  ],
  boss:'light',                                     // השומר שפותח את הדרגה הבאה: שומר הצל, האחרון
  legacyK:150                                       // מי שכבר פתח את דרגה 3 בשיטה הישנה (150 הריגות באמיץ) לא מאבד אותה
};
const TS=()=>{const s=SAVE.tier||(SAVE.tier={t:1,k:0,w:0,v:1});if(!s.v){s.v=1;if(s.k>=TIERS.legacyK)s.w=Math.max(s.w||0,2)}return s};   // v: המעבר מהשיטה הישנה נעשה פעם אחת
const tierOpen=n=>n<=1||!!(SAVE.story&&SAVE.story.end)&&(n===2||(TS().w||0)>=n-1);
const tierNow=()=>tierOpen(TS().t)?TS().t:1;
const tierBig=e=>!!(e.warden||e.rare||e.hunt||e.nem);   // אויב "אירוע": מתחזק לפי big ומפיל את bigLoot

// אויב שמופיע בעולם (wSpawn ב-world.js, וגם storyWarden, rareSpawn, huntEnter, nemEnter)
function tierSpawn(e,t=tierNow()){
  if(!S.wd||e.creature||e.rematch||S.wd.dp)return;const L=TIERS.list[t-1],D=tierBig(e)?L.big:L,o=e.tierK||{hp:1,dmg:1};
  e.hp*=D.hp/o.hp;e.max*=D.hp/o.hp;e.dmg*=D.dmg/o.dmg;e.tierK={hp:D.hp,dmg:D.dmg,t};
}
// אויב שנפל (kill ב-combat.js): שלל נוסף, ונספר לפתיחת הדרגה הבאה
function tierKill(e){
  if(!S.wd||!e.tierK||e.tierK.t<2)return;const D=TIERS.list[e.tierK.t-1],s=TS();
  if(Math.random()<D.loot)runGive(dropTable(e),e.x,e.y);
  if(D.coins)dropSpawn('coins',Math.round(rand(...D.coins)),e.x,e.y);
  if(tierBig(e)){if(D.bigLoot)runGive(D.bigLoot,e.x,e.y);if(D.gear)S.wd.tierGot=lootGear(Object.assign({},e,{boss:1,isBoss:true}),true)}   // חפץ בטוח, בשכבות של הדרגה
  s.k++;
}
/* שומר הצל נפל (giantWin ב-giant.js): הדרגה הבאה נפתחת. נקרא גם בניצחון הראשון (הסוף), ואז הוא לא משנה כלום כי דרגה 2 נפתחת עם הסוף */
function tierWin(e){
  if(e.warden!==TIERS.boss||!e.tierK)return false;const t=e.tierK.t,s=TS();
  if(t<2||(s.w||0)>=t)return false;
  s.w=t;saveNow();
  if(t<TIERS.list.length){const n=t+1;banner(T('tier.openN',T('tier.n'+n)),TIERS.list[n-1].col);celebrate(P.x,P.y-10,'quest','⚔️')}
  return true;
}
// כניסה לעולם (enterWorld): הדרגה הנוכחית בשורה קטנה, רק כשהיא מעל רגיל
function tierEnter(){const t=tierNow();if(t<2||!S.wd)return;const txt='⚔️ '+T('tier.title')+': '+T('tier.n'+t);
  if(typeof feedOn==='function'&&feedOn())feedAdd('⚔️',txt,TIERS.list[t-1].col,'tier');else banner(txt,TIERS.list[t-1].col)}
// ציוד שנופל בעולם (lootRoll ב-loot.js): האחוזים של LOOT.gear.tier, כפול gw של הדרגה. בזירה ובעומק לא משתנה
function tierGearW(W){if(!S.wd||S.wd.dp)return W;const g=TIERS.list[tierNow()-1].gw;return W.map((w,i)=>w*(g[i]==null?1:g[i]))}
// פי כמה ציוד מאויבים (lootGear), וכל כמה שניות עוד הגרלה של נדירה באזור (rareUpdate). רק בעולם, לא בעומק
const tierGearK=()=>!S.wd||S.wd.dp?1:TIERS.list[tierNow()-1].gearK||1;
const tierRareAgain=()=>!S.wd||S.wd.dp?0:TIERS.list[tierNow()-1].rareAgain||0;
// בוחרים דרגה (מחלון המפה). האויבים שכבר בעולם מתחזקים או נחלשים מיד
function tierSet(n){
  if(!tierOpen(n)||TS().t===n)return false;TS().t=n;saveNow();
  for(const e of enemies)if(!e.dead&&e.tierK)tierSpawn(e,n);
  banner(T('tier.set',T('tier.n'+n)),TIERS.list[n-1].col);sfx('celebrate');return true;
}
// השורה בחלון המפה: שלושה כפתורים, דרגה סגורה עם מנעול והסבר
function tierRow(){
  const now=tierNow();let h='<div class="tierrow"><b>⚔️ '+T('tier.title')+'</b>';
  for(let n=1;n<=TIERS.list.length;n++){const op=tierOpen(n);
    h+='<button class="tierb'+(n===now?' on':'')+'" data-act="tier" data-n="'+n+'"'+(op?'':' disabled')+' style="--tc:'+TIERS.list[n-1].col+'">'+(op?'':'🔒 ')+T('tier.n'+n)+'</button>'}
  const lock=[2,3].find(n=>!tierOpen(n));
  const hint=lock===2?T('tier.lock2'):lock?T('tier.lockN',T('tier.n'+lock),T('tier.n'+(lock-1))):T('tier.info'+now);
  return h+'<small>'+hint+'</small></div>';
}
