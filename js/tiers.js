/* דרגות עולם (Claude מוביל, 1.11.2026. המחקר: docs/research-skills.md, "משחק אחרי הסוף", כמו World Tiers ב-Diablo).
   אחרי שהסיפור נגמר (SAVE.story.end) העולם הפתוח יכול להיות קשה יותר: אויבים חזקים יותר, ושלל ומטבעות נוספים.
   הבחירה בחלון מפת העולם (worldmap.js). רק אויבים רגילים בעולם (tierSpawn מ-wSpawn), לא שומרים, לא הזירה.
   דרגה 3 נפתחת אחרי TIERS.open3 הריגות בדרגה 2.
   נשמר ב-SAVE.tier: {t:הדרגה, k:הריגות בדרגה 2 ומעלה}. הטקסטים ב-lang.js תחת 'tier.' */
const TIERS={
  list:[                                            // לכל דרגה: פי כמה חיים ונזק, סיכוי להגרלת שלל נוספת, ומטבעות נוספים בכל הריגה
    {hp:1,  dmg:1,   loot:0,   coins:null, col:'#E8E2D0'},
    {hp:1.9,dmg:1.45,loot:0.45,coins:[2,5], col:'#F4C74F'},
    {hp:3.2,dmg:2,   loot:1,   coins:[5,10],col:'#EF4E57'}
  ],
  open3:150                                         // הריגות בדרגה 2 עד שדרגה 3 נפתחת
};
const TS=()=>SAVE.tier||(SAVE.tier={t:1,k:0});
const tierOpen=n=>n<=1||!!(SAVE.story&&SAVE.story.end)&&(n===2||TS().k>=TIERS.open3);
const tierNow=()=>tierOpen(TS().t)?TS().t:1;

// אויב שמופיע בעולם (wSpawn ב-world.js)
function tierSpawn(e,t=tierNow()){
  if(!S.wd||e.creature)return;const D=TIERS.list[t-1],o=e.tierK||{hp:1,dmg:1};
  e.hp*=D.hp/o.hp;e.max*=D.hp/o.hp;e.dmg*=D.dmg/o.dmg;e.tierK={hp:D.hp,dmg:D.dmg,t};
}
// אויב שנפל (kill ב-combat.js): שלל נוסף, ונספר לפתיחת הדרגה הבאה
function tierKill(e){
  if(!S.wd||!e.tierK||e.tierK.t<2)return;const D=TIERS.list[e.tierK.t-1],s=TS();
  if(Math.random()<D.loot)runGive(dropTable(e),e.x,e.y);
  if(D.coins)dropSpawn('coins',Math.round(rand(...D.coins)),e.x,e.y);
  s.k++;if(s.k===TIERS.open3){banner(T('tier.open3'),TIERS.list[2].col);celebrate(P.x,P.y-10,'quest','⚔️');saveNow()}
}
// בוחרים דרגה (מחלון המפה). האויבים שכבר בעולם מתחזקים או נחלשים מיד
function tierSet(n){
  if(!tierOpen(n)||TS().t===n)return false;TS().t=n;saveNow();
  for(const e of enemies)if(!e.dead&&e.tierK)tierSpawn(e,n);
  banner(T('tier.set',T('tier.n'+n)),TIERS.list[n-1].col);sfx('celebrate');return true;
}
// השורה בחלון המפה: שלושה כפתורים, דרגה סגורה עם מנעול והסבר
function tierRow(){
  const now=tierNow();let h='<div class="tierrow"><b>⚔️ '+T('tier.title')+'</b>';
  for(let n=1;n<=3;n++){const op=tierOpen(n);
    h+='<button class="tierb'+(n===now?' on':'')+'" data-act="tier" data-n="'+n+'"'+(op?'':' disabled')+' style="--tc:'+TIERS.list[n-1].col+'">'+(op?'':'🔒 ')+T('tier.n'+n)+'</button>'}
  const hint=!tierOpen(2)?T('tier.lock2'):!tierOpen(3)?T('tier.lock3',Math.max(0,TIERS.open3-TS().k)):T('tier.info');
  return h+'<small>'+hint+'</small></div>';
}
