/* דרגות: כל 20 רמות דמות נפתח קווסט עלייה בדרגה (game-design.md, "דרגה (כל 20 רמות)").
   איזו דרגה נפתחת תלוי באיך ששיחקת (SAVE.hero.style מ-heroes.js): בעיקר חרב פותחת אביר, בעיקר קשת או קסם סייר, ערבוב לוחם-קשת, והרבה חפצי הגנה שומר.
   העלייה עצמה היא קווסט בטבלה QUESTS (quests.js, kind:'rank', הפרס rank:<שלב>), ולא באמצע קרב. כשלוקחים את הפרס: הדרגה נשמרת ב-SAVE.hero,
   הבונוס הקבוע שלה חל מעכשיו בכל ריצה (rankReset, מ-heroReset), ו-celebrate (fx.js) הוא הטקס.
   כאן גם רמת הדמות הקבועה: SAVE.hero.xp הוא כל ה-XP שנאסף אי פעם (פרסי קווסטים וחלק מה-XP של כל ריצה), והרמה נגזרת ממנו.
   השמות ב-lang.js תחת 'rank.<id>'. שלב 2: look (חלקי שריון וצבע, rankArmor3d ב-render3d.js) כבר פעיל. skill (סקיל חתימה ב-skills.js) עוד לא בשימוש */

const RANKS={
  every:20,                 // כל כמה רמות דמות נפתחת עלייה בדרגה
  xp:{base:50,per:15,run:0.5},   // XP לרמה הבאה: base+per*רמה. run: איזה חלק מה-XP של ריצה בזירה נשאר לדמות
  pick:{mix:0.35,guard:0.5},     // mix: מאיזה חלק מהנזק הנשק השני נחשב ערבוב. guard: מאיזה חלק מזמן הריצות עם חפץ הגנה זה שומר
  /* מראה בתלת-ממד: חלקים שכבר יש במודלים של KayKit (Knight_Cape, Mage_Hat...), לפי הסוף של השם. חלק שאין במודל (למשל בדמות של ניר) פשוט לא נוגעים בו.
     bare: מה מוסתר לפני הדרגה הראשונה. look.show: מה נדלק בדרגה. look.glow: זוהר בצבע הדרגה על החלקים האלה (0 עד 1).
     דרגה הבאה = שורה חדשה עם עוד חלקים או זוהר חזק יותר */
  bare:['Cape','HelmetVisor'],
  /* tier: באיזה שלב (1 = רמה 20, 2 = רמה 40). when: איזה סגנון פותח אותה (rankStyle). bonus: סטטים כמו של ציוד (GEAR.stats), בכל ריצה.
     icon, col: בממשק ובטקס, ו-col גם הזוהר של השריון. look: ראו bare למעלה. skill: לשלב 2 */
  list:{
    guardian:{tier:1,when:s=>s.guard>=RANKS.pick.guard,bonus:{hp:50,regen:0.5},icon:'🛡️',col:'#7FB2FF',look:{show:['Cape','HelmetVisor'],glow:0.4},skill:null},
    knight:  {tier:1,when:s=>s.sword>=1-RANKS.pick.mix,bonus:{hp:20,sdmg:15},icon:'⚔️',col:'#D9DEE6',look:{show:['Cape','HelmetVisor'],glow:0.3},skill:null},
    ranger:  {tier:1,when:s=>s.sword<=RANKS.pick.mix,bonus:{gdmg:15,speed:5},icon:'🏹',col:'#A8D08D',look:{show:['Cape'],glow:0.35},skill:null},
    hybrid:  {tier:1,when:()=>true,bonus:{sdmg:10,gdmg:10},icon:'🗡️',col:'#F4C74F',look:{show:['Cape','HelmetVisor'],glow:0.3},skill:null}
  }
};

const rankId=()=>RANKS.list[SAVE.hero.rankId]?SAVE.hero.rankId:null;
const rankName=id=>T('rank.'+id);

/* ---- רמת הדמות ---- */
const rankNeed=lv=>RANKS.xp.base+RANKS.xp.per*lv;   // כמה XP מרמה lv לרמה הבאה
function rankLevelOf(xp){let lv=1;while(xp>=rankNeed(lv)){xp-=rankNeed(lv);lv++}return lv}
// אחרי כל שינוי ב-SAVE.hero.xp: הרמה מתעדכנת, ועלייה מקבלת באנר
function rankSync(){
  const lv=rankLevelOf(SAVE.hero.xp||0);
  if(lv>SAVE.hero.level){SAVE.hero.level=lv;banner(T('rank.level',lv)+' · '+T('st.got',STATS.perLevel),C.gold);statBadge();if(P&&S&&S.mode==='play')celebrate(P.x,P.y-20,'rank');if(lv%RANKS.every===0)banner(T('rank.open',lv),C.lilac)}
}
// בסוף ריצה (runEnd ב-village.js): חלק מה-XP של הריצה נשאר
function rankRunXp(){const v=Math.round((S.xpRun||0)*RANKS.xp.run);if(v>0){SAVE.hero.xp=(SAVE.hero.xp||0)+v;rankSync()}}

/* ---- איזו דרגה נפתחת: לפי סגנון המשחק ---- */
function rankStyle(){
  const st=SAVE.hero.style||{},sw=st.dmg_sword||0,gn=st.dmg_gun||0;
  return{sword:sw+gn?sw/(sw+gn):0.5,guard:st.t_run?(st.t_defense||0)/st.t_run:0};
}
function rankFor(tier){const s=rankStyle();return Object.keys(RANKS.list).find(id=>RANKS.list[id].tier===tier&&RANKS.list[id].when(s))||null}

/* ---- עלייה: נקרא מ-questClaim כשהפרס הוא rank ---- */
function rankUp(tier){
  const id=rankFor(tier);if(!id)return null;
  const R=RANKS.list[id],old=RANKS.list[rankId()];
  if(old)gApply(old.bonus,-1);
  SAVE.hero.rank=tier;SAVE.hero.rankId=id;
  gApply(R.bonus,1);P.hp=P.maxHp;   // הבונוס חל מיד, וגם בכל ריצה מעכשיו
  saveNow();
  celebrate(P.x,P.y-10,'rank',R.icon);   // הטקס: עמוד אור, ניצוצות וצליל (fx.js)
  banner(T('rank.up',rankName(id)),R.col);
  return id;
}
// בתחילת כל ריצה (ובכפר): הבונוס של הדרגה. נקרא מ-heroReset
function rankReset(){const R=RANKS.list[rankId()];if(R)gApply(R.bonus,1)}

// בממשק: הדרגה הנוכחית, למשל "⚔️ אביר"
const rankLabel=()=>{const id=rankId();return id?RANKS.list[id].icon+' '+rankName(id):''};
